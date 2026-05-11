import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { BadgeCheck } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { DOMAIN_ROLE, type Suggestion, type AgentSuggestion, type AgentDomain } from '../lib/generate';
import { CopyButton } from './CopyButton';
import { MasterworkSeal } from './MasterworkSeal';
import { Playground } from './Playground';
import { ExportForge } from './ExportForge';
import { ForgeDiff } from './ForgeDiff';

const AGENT_KIND_LABEL: Record<AgentDomain, string> = {
  travel: 'Travel Planner Agent',
  developer: 'Developer Pair-Programmer',
  support: 'Customer Support Agent',
  finance: 'Personal Finance Advisor',
  health: 'Health & Wellness Coach',
  education: 'One-on-One Tutor',
  lifestyle: 'Lifestyle Concierge',
  writing: 'Writing Coach & Editor',
  generic: 'General-Purpose Assistant',
};

const STYLE_LABEL: Record<string, string> = {
  'emoji-rich': 'Markdown + emojis + tables',
  technical: 'Code blocks + concise prose',
  plain: 'Clean markdown bullets',
};

// TODO: pull from package.json at build time (Vite supports import { version } from '../../package.json' with json import).
const VALERIUS_VERSION = 'v0.2.0';
const VALERIUS_VERSION_SHORT = 'v0.2';
const MASTERWORK_THRESHOLD = 95;

export type OutputPayload =
  | { mode: 'project'; suggestion: Suggestion }
  | { mode: 'agent'; suggestion: AgentSuggestion }
  | { mode: 'llm'; markdown: string; streaming: boolean };

interface CardProps {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  index?: number;
  masterwork?: boolean;
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-templar-sand/30 bg-black/40 px-2 py-1 font-mono text-[0.7rem] text-templar-text/85">
      <span className="text-templar-sand/70">{label}</span>
      <span>{value}</span>
    </span>
  );
}

function Card({ title, action, children, className, index = 0, masterwork = false }: CardProps) {
  const animStyle: React.CSSProperties = {
    animationDelay: `${index * 50}ms`,
  };
  return (
    <section
      className={
        'valerius-card valerius-card-cool relative rounded-xl border bg-templar-bg/95 p-6 shadow-[0_0_40px_-20px_rgba(212,199,165,0.3)] ' +
        (masterwork ? 'border-templar-sand/70 ' : 'border-templar-sand/20 ') +
        (className ?? '')
      }
      style={animStyle}
    >
      {masterwork && <MasterworkSeal />}
      <header className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-templar-sand">
          {title}
        </h3>
        {action}
      </header>
      {children}
    </section>
  );
}

const FEATURE_LABEL: Record<string, string> = {
  auth: 'Auth', payments: 'Payments', realtime: 'Realtime', search: 'Search',
  fileUpload: 'Files', ai: 'AI', scheduling: 'Jobs', multiTenant: 'Multi-tenant',
  notifications: 'Notifications', analytics: 'Analytics', admin: 'Admin',
  i18n: 'i18n', offline: 'Offline', webhooks: 'Webhooks',
};
const CONSTRAINT_LABEL: Record<string, string> = {
  offline: 'Offline', accessibility: 'A11y', performance: 'Perf',
  scale: 'Scale', security: 'Security', lowCost: 'Low cost',
};

function VerifiedBadge() {
  return (
    <div className="flex items-center justify-end">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-templar-sand/30 bg-black/30 px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-templar-sand/90">
        <BadgeCheck className="h-3.5 w-3.5 text-templar-sand" />
        Verified by Valerius
        <span className="font-mono text-templar-text/50">{VALERIUS_VERSION_SHORT}</span>
      </span>
    </div>
  );
}

function ForgedFooter() {
  const time = useMemo(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }, []);
  return (
    <p className="pt-2 text-center text-[0.7rem] italic text-templar-sand/55">
      Forged at {time} &middot; Tempered by Valerius {VALERIUS_VERSION}
    </p>
  );
}

function SignalsCard({
  kind, features, constraints, techHints, extra, index = 0,
}: {
  kind: string;
  features: string[];
  constraints: string[];
  techHints: string[];
  extra?: { label: string; value: string }[];
  index?: number;
}) {
  return (
    <Card title="Detected Signals" index={index}>
      <div className="flex flex-wrap gap-3 text-xs">
        <Pill label="Kind" value={kind} />
        {extra?.map((e) => <Pill key={e.label + e.value} label={e.label} value={e.value} />)}
        {features.length > 0 ? (
          features.map((f) => <Pill key={f} label="Feature" value={FEATURE_LABEL[f] ?? f} />)
        ) : (
          <span className="text-templar-text/40">No specific features detected</span>
        )}
        {constraints.map((c) => (
          <Pill key={c} label="Constraint" value={CONSTRAINT_LABEL[c] ?? c} />
        ))}
        {techHints.map((t) => <Pill key={t} label="Tech" value={t} />)}
      </div>
    </Card>
  );
}

function AnimatedScore({ target }: { target: number }) {
  const [value, setValue] = useState(0);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setValue(target);
      setFlash(true);
      const t = window.setTimeout(() => setFlash(false), 260);
      return () => window.clearTimeout(t);
    }
    setValue(0);
    setFlash(false);
    const start = performance.now();
    const dur = 900;
    let raf = 0;
    let flashTimer = 0;
    let done = false;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else if (!done) {
        done = true;
        setFlash(true);
        flashTimer = window.setTimeout(() => setFlash(false), 260);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      if (flashTimer) window.clearTimeout(flashTimer);
    };
  }, [target]);

  return (
    <span
      className={
        'font-display text-7xl font-extrabold leading-none text-templar-sand ' +
        (flash ? 'valerius-score-flash' : '')
      }
    >
      {value}
    </span>
  );
}

function QualityScoreCard({
  qualityScore,
  index = 0,
}: {
  qualityScore: { score: number; reasons: string[] };
  index?: number;
}) {
  return (
    <Card
      title="Forge Quality Score"
      className="bg-gradient-to-br from-templar-sand/[0.06] to-transparent"
      index={index}
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-8">
        <div className="flex items-baseline gap-1">
          <AnimatedScore target={qualityScore.score} />
          <span className="font-display text-2xl text-templar-text/40">/100</span>
        </div>
        <ul className="flex-1 space-y-2 pt-2">
          {qualityScore.reasons.map((reason, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-templar-text/90">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-templar-sand" />
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

function TimeToValueCard({
  timeToValue,
  estimate,
  index = 0,
}: {
  timeToValue: { label: string; rationale: string };
  estimate: { hours: number; label: string; rationale: string };
  index?: number;
}) {
  return (
    <Card title="Time to First Excellent Result" index={index}>
      <div className="flex flex-col items-baseline gap-2 sm:flex-row sm:gap-6">
        <span className="font-display text-5xl font-extrabold text-templar-sand">
          {timeToValue.label}
        </span>
        <div>
          <p className="text-sm font-medium text-templar-sand">{timeToValue.rationale}</p>
          <p className="mt-1 text-xs text-templar-text/60">
            Reference build: ~{estimate.hours}h · {estimate.label} — {estimate.rationale}
          </p>
        </div>
      </div>
    </Card>
  );
}

function RefinementsCard({
  refinements,
  onAppendInput,
  index = 0,
}: {
  refinements: string[];
  onAppendInput?: (text: string) => void;
  index?: number;
}) {
  if (!refinements || refinements.length === 0) return null;
  return (
    <Card title="Try Refining With…" index={index}>
      <div className="flex flex-wrap gap-2.5">
        {refinements.map((r, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Refine and re-forge: ${r}`}
            onClick={() => onAppendInput?.(r)}
            className="valerius-rune group relative bg-gradient-to-b from-templar-sand/15 to-templar-sand/5 px-4 py-2 text-xs font-medium text-templar-sand transition-all hover:from-templar-sand/30 hover:to-templar-sand/10 hover:text-templar-bg"
            style={{
              animationDelay: `${i * 220}ms`,
              border: '1px solid rgba(212, 199, 165, 0.45)',
            }}
          >
            <span className="relative z-10">{r}</span>
          </button>
        ))}
      </div>
      <p className="mt-3 text-[0.65rem] uppercase tracking-[0.18em] text-templar-text/40">
        Tap a rune to append &amp; re-forge.
      </p>
    </Card>
  );
}

interface Props {
  payload: OutputPayload;
  onAppendInput?: (text: string) => void;
  onOpenSettings?: () => void;
  activeForgeParentId?: string;
}

export function OutputPanel({ payload, onAppendInput, onOpenSettings, activeForgeParentId }: Props) {
  if (payload.mode === 'llm')
    return <LLMOutput markdown={payload.markdown} streaming={payload.streaming} />;
  if (payload.mode === 'agent')
    return (
      <>
        <HeuristicEyebrow />
        <AgentOutput
          suggestion={payload.suggestion}
          onAppendInput={onAppendInput}
          onOpenSettings={onOpenSettings}
          parentId={activeForgeParentId}
        />
      </>
    );
  return (
    <>
      <HeuristicEyebrow />
      <ProjectOutput suggestion={payload.suggestion} />
    </>
  );
}

function HeuristicEyebrow() {
  return (
    <p className="mt-8 text-center text-[0.65rem] uppercase tracking-[0.22em] text-templar-sand/55">
      Heuristic preview — add an API key in settings for real AI forging.
    </p>
  );
}

function LLMOutput({ markdown, streaming }: { markdown: string; streaming: boolean }) {
  return (
    <div className="mt-10 space-y-6">
      <VerifiedBadge />
      <Card
        title="Forged by Valerius"
        action={<CopyButton value={markdown} label="Copy Output" />}
        index={0}
      >
        <div className="prose prose-invert max-w-none scroll-thin
          prose-headings:font-semibold prose-headings:text-templar-sand
          prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
          prose-h2:mt-6 prose-h2:mb-2 prose-h2:border-b prose-h2:border-templar-sand/20 prose-h2:pb-1.5
          prose-p:text-templar-text/90 prose-p:leading-relaxed
          prose-strong:text-templar-sand
          prose-a:text-templar-sand prose-a:no-underline hover:prose-a:underline
          prose-li:text-templar-text/90
          prose-li:marker:text-templar-sand
          prose-code:rounded prose-code:bg-black/50 prose-code:px-1.5 prose-code:py-0.5
          prose-code:text-templar-sand prose-code:font-mono prose-code:text-[0.85em]
          prose-code:before:content-none prose-code:after:content-none
          prose-pre:rounded-lg prose-pre:border prose-pre:border-templar-sand/30
          prose-pre:bg-black/50 prose-pre:p-4 prose-pre:text-templar-text/90
          prose-blockquote:border-templar-sand/40 prose-blockquote:text-templar-text/80
          prose-table:text-sm prose-th:text-templar-sand
          prose-th:border-templar-sand/30 prose-td:border-templar-sand/20
          prose-hr:border-templar-sand/20
        ">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown || '\u200b'}</ReactMarkdown>
          {streaming && (
            <span
              aria-hidden
              className="ml-0.5 inline-block h-4 w-[2px] -translate-y-[2px] animate-pulse bg-templar-sand align-middle"
            />
          )}
        </div>
      </Card>
      <ForgedFooter />
    </div>
  );
}

function ProjectOutput({ suggestion }: { suggestion: Suggestion }) {
  const mermaidBlock = '```mermaid\n' + suggestion.mermaid + '\n```';
  const isMasterwork = suggestion.qualityScore.score >= MASTERWORK_THRESHOLD;
  return (
    <div className="mt-10 space-y-6">
      {!isMasterwork && <VerifiedBadge />}
      <SignalsCard
        kind={suggestion.kind}
        features={suggestion.features}
        constraints={suggestion.constraints}
        techHints={suggestion.techHints}
        index={0}
      />

      <Card
        title="Coding-Agent-Ready Prompt"
        action={<CopyButton value={suggestion.cursorPrompt} label="Copy Prompt" />}
        index={1}
        masterwork={isMasterwork}
      >
        <pre className="scroll-thin max-h-[28rem] overflow-auto whitespace-pre-wrap rounded-lg border border-templar-sand/30 bg-black/40 p-4 font-mono text-sm leading-relaxed text-templar-text/90">
          {suggestion.cursorPrompt}
        </pre>
      </Card>

      <QualityScoreCard qualityScore={suggestion.qualityScore} index={2} />

      <Card
        title="Architecture Diagram (Mermaid)"
        action={<CopyButton value={mermaidBlock} label="Copy Mermaid" />}
        index={3}
      >
        <pre className="scroll-thin max-h-[24rem] overflow-auto rounded-lg border border-templar-sand/30 bg-black/40 p-4 font-mono text-sm leading-relaxed text-templar-text/90">
{mermaidBlock}
        </pre>
      </Card>

      <Card title="Recommended Stack & Tools" index={4}>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {suggestion.stack.map((group) => (
            <div key={group.category}>
              <h4 className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-templar-sand">
                {group.category}
              </h4>
              <ul className="mt-2 space-y-1.5">
                {group.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-templar-text/90">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-templar-sand" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      <TimeToValueCard timeToValue={suggestion.timeToValue} estimate={suggestion.estimate} index={5} />
      <ForgedFooter />
    </div>
  );
}

function AgentOutput({
  suggestion,
  onAppendInput,
  onOpenSettings,
  parentId,
}: {
  suggestion: AgentSuggestion;
  onAppendInput?: (text: string) => void;
  onOpenSettings?: () => void;
  parentId?: string;
}) {
  const role = DOMAIN_ROLE[suggestion.domain];
  const kindDisplay = suggestion.kindLabel ?? AGENT_KIND_LABEL[suggestion.domain];
  const toneDisplay =
    suggestion.tonePhrases && suggestion.tonePhrases.length > 0
      ? suggestion.tonePhrases.join(', ')
      : role.tone;
  const coreFeaturesDisplay =
    suggestion.coreCapabilities && suggestion.coreCapabilities.length > 0
      ? suggestion.coreCapabilities.join(' · ')
      : suggestion.features.length > 0
        ? suggestion.features.map((f) => FEATURE_LABEL[f] ?? f).join(' · ')
        : '—';
  const isMasterwork = suggestion.qualityScore.score >= MASTERWORK_THRESHOLD;
  return (
    <div className="mt-10 space-y-6">
      {!isMasterwork && <VerifiedBadge />}
      <Card title="Detected Signals" index={0}>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          <SignalRow label="Kind" value={kindDisplay} />
          <SignalRow label="Personality / Tone" value={toneDisplay} />
          <SignalRow label="Core Features" value={coreFeaturesDisplay} />
          <SignalRow
            label="Constraints"
            value={
              suggestion.constraints.length > 0
                ? suggestion.constraints.map((c) => CONSTRAINT_LABEL[c] ?? c).join(' · ')
                : '—'
            }
          />
          <SignalRow label="Output Style" value={STYLE_LABEL[suggestion.style] ?? suggestion.style} />
          <SignalRow label="Tools" value={suggestion.tools.join(' · ')} />
          {suggestion.parallelHint && (
            <SignalRow
              label="Mode"
              value={
                suggestion.parallelComplexity === 'orchestrator'
                  ? 'Parallel Execution · Orchestrator'
                  : 'Parallel Execution'
              }
            />
          )}
        </dl>
      </Card>

      <Card
        title="Forged Agent System Prompt"
        action={<CopyButton value={suggestion.systemPrompt} label="Copy Prompt" />}
        index={1}
        masterwork={isMasterwork}
      >
        <pre className="scroll-thin max-h-[40rem] overflow-auto whitespace-pre-wrap rounded-lg border border-templar-sand/30 bg-black/40 p-4 font-mono text-sm leading-relaxed text-templar-text/90">
          {suggestion.systemPrompt}
        </pre>
      </Card>

      <QualityScoreCard qualityScore={suggestion.qualityScore} index={2} />

      <TimeToValueCard timeToValue={suggestion.timeToValue} estimate={suggestion.estimate} index={3} />

      <RefinementsCard refinements={suggestion.refinements} onAppendInput={onAppendInput} index={4} />

      {parentId && <ForgeDiff suggestion={suggestion} parentId={parentId} />}

      <Playground suggestion={suggestion} onOpenSettings={onOpenSettings} />

      <ExportForge suggestion={suggestion} />

      <ForgedFooter />
    </div>
  );
}

function SignalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-templar-sand/80">
        {label}
      </dt>
      <dd className="mt-0.5 text-templar-text/90">{value}</dd>
    </div>
  );
}
