import { useEffect, useMemo, useRef, useState } from 'react';
import { Flame, ShieldAlert, ShieldCheck, ShieldOff, Loader2 } from 'lucide-react';
import { generate, generateAgentPrompt, detectMode, type Suggestion, type AgentSuggestion } from '../lib/generate';
import { guard, type GuardResult } from '../lib/guardrail';
import { evaluateContent, reportViolation, SAFETY_REFUSAL_MESSAGE } from '../lib/contentGate';
import { streamForge, type LLMSettings } from '../lib/llm';
import { META_SYSTEM_PROMPT } from '../lib/metaPrompt';
import { OutputPanel, type OutputPayload } from './OutputPanel';
import { emit, pushRecent } from '../lib/forgeEvents';

type Status = 'idle' | 'checking' | 'streaming' | 'blocked' | 'allowed' | 'unavailable' | 'error' | 'refused';
type Mode = 'project' | 'agent';
type ModeChoice = 'auto' | Mode;

const LOADING_CAPTIONS = [
  'Heating the forge…',
  'Hammering the steel…',
  'Quenching the blade…',
  'Tempering the prompt…',
];

interface ForgeProps {
  settings: LLMSettings | null;
  externalBrief?: { value: string; nonce: number } | null;
  onPayloadChange?: (payload: OutputPayload | null) => void;
  onOpenSettings?: () => void;
  onOpenLibrary?: () => void;
  resetNonce?: number;
}

export function Forge({ settings, externalBrief, onPayloadChange, onOpenSettings, resetNonce }: ForgeProps) {
  const [input, setInput] = useState('');
  const [modeChoice, setModeChoice] = useState<ModeChoice>('auto');
  const [status, setStatus] = useState<Status>('idle');
  const [payload, setPayload] = useState<OutputPayload | null>(null);
  const [guardResult, setGuardResult] = useState<GuardResult | null>(null);
  const [autoDetected, setAutoDetected] = useState<Mode | null>(null);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [captionIdx, setCaptionIdx] = useState(0);
  const [ctrlDown, setCtrlDown] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  // Track latest input value for autoforge triggered by refinement chip
  const latestInputRef = useRef(input);
  useEffect(() => {
    latestInputRef.current = input;
  }, [input]);

  const resolveMode = (text: string): Mode =>
    modeChoice === 'auto' ? detectMode(text) : modeChoice;

  const buildPayload = (text: string): OutputPayload => {
    const mode = resolveMode(text);
    return mode === 'agent'
      ? { mode: 'agent', suggestion: generateAgentPrompt(text) satisfies AgentSuggestion }
      : { mode: 'project', suggestion: generate(text) satisfies Suggestion };
  };

  const runForge = async (rawText: string) => {
    const text = rawText.trim();
    if (!text) return;

    abortRef.current?.abort();
    setStatus('checking');
    setPayload(null);
    setGuardResult(null);
    setStreamError(null);
    emit('valerius:forge-start');

    // ── HARD CONTENT GATE — runs before Mini Templar and before any LLM call.
    // Catches plain-English requests for clearly illegal/severely harmful
    // content (fraud bots, CSAM, terrorism/weapons, etc). Mini Templar handles
    // jailbreak/injection attacks; this gate handles content policy.
    const contentResult = evaluateContent(text);
    if (contentResult.blocked) {
      reportViolation(text, contentResult);
      setStatus('refused');
      emit('valerius:forge-end');
      return;
    }

    const result = await guard(text);
    setGuardResult(result);

    if (result.blocked) {
      setStatus('blocked');
      emit('valerius:forge-end');
      return;
    }

    const guardOk = !result.unavailable;
    setStatus(guardOk ? 'allowed' : 'unavailable');
    setAutoDetected(modeChoice === 'auto' ? detectMode(text) : null);
    emit('valerius:forge-strike');

    if (settings) {
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      let acc = '';
      setPayload({ mode: 'llm', markdown: '', streaming: true });
      setStatus('streaming');
      try {
        await streamForge({
          config: settings,
          systemPrompt: META_SYSTEM_PROMPT,
          userPrompt: text,
          signal: ctrl.signal,
          onToken: (chunk) => {
            acc += chunk;
            setPayload({ mode: 'llm', markdown: acc, streaming: true });
          },
        });
        setPayload({ mode: 'llm', markdown: acc, streaming: false });
        setStatus(guardOk ? 'allowed' : 'unavailable');
      } catch (err) {
        if (ctrl.signal.aborted) {
          emit('valerius:forge-end');
          return;
        }
        const msg = err instanceof Error ? err.message : 'Stream failed';
        setStreamError(msg);
        setStatus('error');
        setPayload(buildPayload(text));
      } finally {
        emit('valerius:forge-end');
      }
      return;
    }

    const p = buildPayload(text);
    setPayload(p);
    emit('valerius:forge-end');
    if (!settings) {
      pushRecent({ brief: text, mode: p.mode });
    }
  };

  useEffect(() => {
    onPayloadChange?.(payload);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload]);

  const onForge = () => runForge(latestInputRef.current);

  // External brief load (Recent Forges click)
  useEffect(() => {
    if (!externalBrief) return;
    setInput(externalBrief.value);
    latestInputRef.current = externalBrief.value;
    // small delay to let UI paint then auto-forge
    const id = window.setTimeout(() => runForge(externalBrief.value), 30);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalBrief?.nonce]);

  // External reset (from App-level Reset button)
  useEffect(() => {
    if (!resetNonce) return;
    abortRef.current?.abort();
    setInput('');
    latestInputRef.current = '';
    setPayload(null);
    setGuardResult(null);
    setStatus('idle');
    setStreamError(null);
    setAutoDetected(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetNonce]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      onForge();
    }
  };

  const isBusy = status === 'checking' || status === 'streaming';

  // Themed loading caption cycle
  useEffect(() => {
    if (!isBusy) {
      setCaptionIdx(0);
      return;
    }
    const id = window.setInterval(() => {
      setCaptionIdx((i) => (i + 1) % LOADING_CAPTIONS.length);
    }, 1100);
    return () => window.clearInterval(id);
  }, [isBusy]);

  // Ctrl key glow on hint
  useEffect(() => {
    const dn = (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.key === 'Meta') setCtrlDown(true);
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.key === 'Meta') setCtrlDown(false);
    };
    const blur = () => setCtrlDown(false);
    window.addEventListener('keydown', dn);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', dn);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, []);

  const onAppendInput = (text: string) => {
    const next = (() => {
      const prev = latestInputRef.current;
      if (prev.trim().length === 0) return text;
      return prev.replace(/\s+$/, '') + '\n\nRefinement: ' + text;
    })();
    setInput(next);
    latestInputRef.current = next;
    // Auto re-forge after appending refinement
    window.setTimeout(() => runForge(next), 30);
  };

  const buttonLabel = useMemo(() => {
    if (isBusy) return LOADING_CAPTIONS[captionIdx];
    if (modeChoice === 'agent') return 'Forge Agent Prompt';
    if (modeChoice === 'project') return 'Forge Suggestion';
    return 'Forge';
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBusy, captionIdx, modeChoice]);

  return (
    <section className="mx-auto w-full">
      <div className="mb-4 flex flex-col items-center justify-center gap-1">
        <ModeToggle mode={modeChoice} onChange={setModeChoice} />
        {modeChoice === 'auto' && autoDetected && (
          <span className="text-[0.65rem] uppercase tracking-[0.2em] text-templar-sand/60">
            Auto-detected: {autoDetected === 'agent' ? 'Agent Prompt' : 'Full Project'}
          </span>
        )}
      </div>

      <div className="rounded-2xl border border-templar-sand/25 bg-templar-bg/95 p-2 shadow-[0_0_60px_-30px_rgba(212,199,165,0.4)]">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          rows={6}
          placeholder={
            modeChoice === 'agent'
              ? 'Describe the AI agent / chatbot you want a system prompt for...'
              : modeChoice === 'project'
                ? 'Describe what you want to build or fix...'
                : 'Describe what you want to forge — agent, app, prompt, or system…'
          }
          className="scroll-thin block w-full resize-y rounded-xl bg-transparent p-5 font-display text-base text-templar-text placeholder:text-templar-text/30 focus:outline-none"
        />
        <div className="flex flex-wrap items-center justify-end gap-3 px-3 pb-3 pt-1">
          {/* ── Ctrl+Enter hint + Forge button ── */}
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-[0.16em] text-templar-text/40">
              <kbd
                className={
                  'rounded border border-templar-sand/30 px-1.5 py-0.5 font-mono text-[0.65rem] transition-colors ' +
                  (ctrlDown ? 'valerius-kbd-glow' : '')
                }
              >
                Ctrl
              </kbd>{' '}
              +{' '}
              <kbd className="rounded border border-templar-sand/30 px-1.5 py-0.5 font-mono text-[0.65rem]">
                Enter
              </kbd>
            </span>

            <button
              type="button"
              onClick={onForge}
              disabled={!input.trim() || isBusy}
              aria-label={buttonLabel}
              title={buttonLabel}
              className={
                'valerius-shine group inline-flex items-center gap-1.5 rounded-lg bg-templar-sand px-4 py-2.5 shadow-[0_0_30px_-8px_rgba(212,199,165,0.7)] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100 ' +
                (isBusy ? 'is-active' : '')
              }
            >
              {isBusy ? (
                <Loader2 className="h-4 w-4 animate-spin text-templar-bg" />
              ) : (
                <ForgeFlames />
              )}
            </button>
          </div>
        </div>
      </div>

      <GuardBanner status={status} guardResult={guardResult} />

      {status === 'refused' && <RefusalCard />}

      {status === 'blocked' && guardResult?.response && <BlockedCard response={guardResult.response} />}

      {streamError && (
        <div className="mt-6 rounded-lg border border-templar-red/60 bg-templar-red/10 px-4 py-3 text-xs text-templar-text/90">
          <span className="font-semibold uppercase tracking-[0.16em] text-templar-red">LLM error</span>{' '}
          — {streamError}. Falling back to heuristic preview.
        </div>
      )}

      {payload && <OutputPanel payload={payload} onAppendInput={onAppendInput} onOpenSettings={onOpenSettings} />}

    </section>
  );
}

// 4 animated forge-flames used as the Forge button's visual label
const FLAME_COLORS = ['#7a2a1f', '#c46a1c', '#d49b3a', '#f2e4b2'];
const FLAME_GLOWS = [
  'rgba(178,34,34,0.55)',
  'rgba(212,130,40,0.6)',
  'rgba(220,170,70,0.75)',
  'rgba(242,228,178,0.95)',
];
function ForgeFlames() {
  return (
    <span className="flex items-center gap-0.5" aria-hidden="true">
      {FLAME_COLORS.map((color, i) => (
        <Flame
          key={i}
          className="valerius-flame is-lit h-5 w-5"
          style={{
            color,
            fill: color,
            filter: `drop-shadow(0 0 5px ${FLAME_GLOWS[i]})`,
            animationDelay: `${i * 0.13}s`,
          }}
        />
      ))}
    </span>
  );
}


function ModeToggle({ mode, onChange }: { mode: ModeChoice; onChange: (m: ModeChoice) => void }) {
  const opt = (m: ModeChoice, label: string) => {
    const active = mode === m;
    return (
      <button
        key={m}
        type="button"
        onClick={() => onChange(m)}
        aria-pressed={active}
        className={
          'px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition-colors ' +
          (active
            ? 'bg-templar-sand text-templar-bg'
            : 'bg-transparent text-templar-text/70 hover:text-templar-sand')
        }
      >
        {label}
      </button>
    );
  };
  return (
    <div className="inline-flex overflow-hidden rounded-lg border border-templar-sand/40 bg-black/30">
      {opt('auto', 'Auto Prompt')}
      <div className="w-px bg-templar-sand/30" />
      {opt('project', 'Full Project')}
      <div className="w-px bg-templar-sand/30" />
      {opt('agent', 'Agent Prompt')}
    </div>
  );
}

function GuardBanner({ status, guardResult }: { status: Status; guardResult: GuardResult | null }) {
  if (status === 'idle' || status === 'checking') return null;

  if (status === 'allowed' && guardResult?.response) {
    return (
      <div className="mt-6 flex items-center justify-center gap-2 text-xs uppercase tracking-[0.18em] text-templar-sand/80">
        <ShieldCheck className="h-4 w-4 text-templar-sand" />
        Verified by Mini Templar &middot; risk {guardResult.response.risk_score.toFixed(1)} &middot; v
        {guardResult.response.version}
      </div>
    );
  }
  if (status === 'unavailable') {
    return (
      <div className="mt-6 flex items-center justify-center gap-2 text-xs uppercase tracking-[0.18em] text-templar-sand/60">
        <ShieldOff className="h-4 w-4" />
        Mini Templar offline &mdash; running unguarded. Start the container to enable defense.
      </div>
    );
  }
  return null;
}

function BlockedCard({ response }: { response: NonNullable<GuardResult['response']> }) {
  return (
    <div className="mt-10 rounded-xl border border-templar-sand/60 bg-templar-sand/10 p-6 shadow-[0_0_50px_-15px_rgba(212,199,165,0.6)]">
      <div className="flex items-center gap-3">
        <ShieldAlert className="h-6 w-6 text-templar-sand" />
        <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-templar-sand">
          Blocked by Mini Templar
        </h3>
      </div>
      <p className="mt-3 text-sm text-templar-text/85">
        Your input was flagged as a potential prompt-injection or policy violation and will not be
        forged. Edit the request and try again.
      </p>
      <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-xs sm:grid-cols-4">
        <Stat label="Decision" value={response.decision.toUpperCase()} />
        <Stat label="Confidence" value={`${(response.confidence * 100).toFixed(0)}%`} />
        <Stat label="Risk Score" value={response.risk_score.toFixed(1)} />
        <Stat label="Detector" value={response.detail ?? '—'} />
      </dl>
      {response.reason_codes.length > 0 && (
        <div className="mt-5">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-templar-sand">
            Reason Codes
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {response.reason_codes.map((code) => (
              <li
                key={code}
                className="rounded border border-templar-sand/40 bg-black/40 px-2 py-1 font-mono text-[0.7rem] text-templar-text/80"
              >
                {code}
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="mt-5 text-[0.65rem] uppercase tracking-[0.2em] text-templar-text/40">
        Mini Templar v{response.version} &middot; 3rd place &middot; GraySwan Arena
      </p>
    </div>
  );
}

function RefusalCard() {
  // Intentionally minimal — show only the clean refusal. Do NOT echo the
  // user's brief, the matched category, or the matched pattern: that would
  // leak signal that helps a probing user iterate around the gate.
  return (
    <div className="mt-10 rounded-xl border border-templar-sand/60 bg-black/40 p-6 text-center shadow-[0_0_50px_-15px_rgba(212,199,165,0.6)]">
      <p className="font-display text-base text-templar-text/90">
        {SAFETY_REFUSAL_MESSAGE}
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-templar-sand">
        {label}
      </dt>
      <dd className="mt-1 font-mono text-templar-text">{value}</dd>
    </div>
  );
}
