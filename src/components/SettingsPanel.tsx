import { useEffect, useState } from 'react';
import { Eye, EyeOff, Loader2, Check, X, Trash2, Save, KeyRound } from 'lucide-react';
import {
  DEFAULT_MODELS,
  MODEL_GROUPS,
  PROVIDER_LABELS,
  DEFAULT_LOCAL_BASE_URL,
  loadSettings,
  saveSettings,
  clearSettings,
  streamForge,
  type Provider,
  type LLMSettings,
} from '../lib/llm';

const CUSTOM_SENTINEL = '__custom__';

interface Props {
  open: boolean;
  onClose: () => void;
  onChange: (s: LLMSettings | null) => void;
}

const DEFAULT_PROVIDER: Provider = 'openrouter';

export function SettingsPanel({ open, onClose, onChange }: Props) {
  const [provider, setProvider] = useState<Provider>(DEFAULT_PROVIDER);
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState(DEFAULT_MODELS[DEFAULT_PROVIDER][0]);
  const [baseUrl, setBaseUrl] = useState<string>(DEFAULT_LOCAL_BASE_URL);
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const isLocal = provider === 'local';
  const keyRequired = !isLocal;

  useEffect(() => {
    if (!open) return;
    const cur = loadSettings();
    if (cur) {
      setProvider(cur.provider);
      setApiKey(cur.apiKey);
      setModel(cur.model);
      setBaseUrl(cur.baseUrl ?? DEFAULT_LOCAL_BASE_URL);
    } else {
      setProvider(DEFAULT_PROVIDER);
      setApiKey('');
      setModel(DEFAULT_MODELS[DEFAULT_PROVIDER][0]);
      setBaseUrl(DEFAULT_LOCAL_BASE_URL);
    }
    setTestResult(null);
  }, [open]);

  const onProviderChange = (p: Provider) => {
    setProvider(p);
    setModel(DEFAULT_MODELS[p][0]);
    setTestResult(null);
  };

  const buildConfig = () => ({
    provider,
    apiKey: apiKey.trim(),
    model: model.trim(),
    baseUrl: isLocal ? (baseUrl.trim() || DEFAULT_LOCAL_BASE_URL) : undefined,
  });

  const onTest = async () => {
    if (keyRequired && !apiKey.trim()) {
      setTestResult({ ok: false, msg: 'Enter an API key.' });
      return;
    }
    if (!model.trim()) {
      setTestResult({ ok: false, msg: 'Enter a model name.' });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      await streamForge({
        config: buildConfig(),
        systemPrompt: 'Reply with the single word: pong.',
        userPrompt: 'ping',
        onToken: () => {},
      });
      setTestResult({ ok: true, msg: 'Connected.' });
    } catch (err) {
      const m = err instanceof Error ? err.message : 'Unknown error';
      setTestResult({ ok: false, msg: m });
    } finally {
      setTesting(false);
    }
  };

  const onSave = () => {
    if (keyRequired && !apiKey.trim()) {
      setTestResult({ ok: false, msg: 'Enter an API key.' });
      return;
    }
    if (!model.trim()) {
      setTestResult({ ok: false, msg: 'Enter a model name.' });
      return;
    }
    const s: LLMSettings = buildConfig();
    saveSettings(s);
    onChange(s);
    onClose();
  };

  const onClear = () => {
    clearSettings();
    setApiKey('');
    setTestResult(null);
    onChange(null);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative w-full max-w-lg rounded-2xl border border-templar-sand/30 bg-templar-bg p-6 shadow-[0_0_60px_-15px_rgba(212,199,165,0.5)]">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-templar-sand">
            <KeyRound className="h-4 w-4" />
            LLM Settings · BYOK
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-templar-text/60 transition-colors hover:text-templar-sand"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-5 text-xs text-templar-text/60">
          Bring your own key. Stored only in this browser&apos;s localStorage. Sent only to the
          provider you choose. Never to any other server.
        </p>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-templar-sand/80">
              Provider
            </label>
            <select
              value={provider}
              onChange={(e) => onProviderChange(e.target.value as Provider)}
              className="w-full rounded-lg border border-templar-sand/30 bg-black/40 px-3 py-2 text-sm text-templar-text focus:border-templar-sand focus:outline-none"
            >
              {(Object.keys(PROVIDER_LABELS) as Provider[]).map((p) => (
                <option key={p} value={p}>
                  {PROVIDER_LABELS[p]}
                </option>
              ))}
            </select>
          </div>

          {isLocal && (
            <div>
              <label className="mb-1.5 block text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-templar-sand/80">
                Base URL
              </label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder={DEFAULT_LOCAL_BASE_URL}
                autoComplete="off"
                spellCheck={false}
                className="w-full rounded-lg border border-templar-sand/30 bg-black/40 px-3 py-2 font-mono text-sm text-templar-text placeholder:text-templar-text/30 focus:border-templar-sand focus:outline-none"
              />
              <p className="mt-1.5 text-[0.65rem] text-templar-text/50">
                Ollama: <span className="font-mono">http://localhost:11434/v1</span> · LM Studio:{' '}
                <span className="font-mono">http://localhost:1234/v1</span>. Server must expose an
                OpenAI-compatible <span className="font-mono">/chat/completions</span> route with{' '}
                <span className="font-mono">stream=true</span>.
              </p>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-templar-sand/80">
              API Key {!keyRequired && <span className="ml-1 text-[0.6rem] text-templar-text/40">(optional for local)</span>}
            </label>
            <div className="flex gap-2">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={isLocal ? 'leave blank for keyless Ollama' : 'sk-…'}
                autoComplete="off"
                spellCheck={false}
                className="flex-1 rounded-lg border border-templar-sand/30 bg-black/40 px-3 py-2 font-mono text-sm text-templar-text placeholder:text-templar-text/30 focus:border-templar-sand focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowKey((s) => !s)}
                className="rounded-lg border border-templar-sand/30 px-3 text-templar-text/70 transition-colors hover:border-templar-sand hover:text-templar-sand"
                aria-label={showKey ? 'Hide key' : 'Show key'}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <ModelPicker provider={provider} model={model} onChange={setModel} />

          {testResult && (
            <div
              className={
                'flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ' +
                (testResult.ok
                  ? 'border-templar-sand/50 bg-templar-sand/10 text-templar-sand'
                  : 'border-templar-red/60 bg-templar-red/10 text-templar-text/90')
              }
            >
              {testResult.ok ? (
                <Check className="mt-0.5 h-4 w-4 shrink-0" />
              ) : (
                <X className="mt-0.5 h-4 w-4 shrink-0 text-templar-red" />
              )}
              <span className="break-words">{testResult.msg}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onTest}
              disabled={testing || (keyRequired && !apiKey.trim()) || !model.trim()}
              className="inline-flex items-center gap-2 rounded-lg border border-templar-sand/40 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-templar-text/90 transition-colors hover:border-templar-sand hover:bg-templar-sand/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Test connection
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={(keyRequired && !apiKey.trim()) || !model.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-templar-sand px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-templar-bg transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Save className="h-3.5 w-3.5" />
              Save
            </button>
            <button
              type="button"
              onClick={onClear}
              className="ml-auto inline-flex items-center gap-2 rounded-lg border border-templar-sand/20 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-templar-text/60 transition-colors hover:border-templar-red/60 hover:text-templar-red"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModelPicker({
  provider,
  model,
  onChange,
}: {
  provider: Provider;
  model: string;
  onChange: (m: string) => void;
}) {
  const groups = MODEL_GROUPS[provider];
  const knownModels = new Set(DEFAULT_MODELS[provider]);
  const isCustom = model.length > 0 && !knownModels.has(model);

  return (
    <div>
      <label className="mb-1.5 block text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-templar-sand/80">
        Model
      </label>
      <select
        value={isCustom ? CUSTOM_SENTINEL : model}
        onChange={(e) => {
          const v = e.target.value;
          if (v === CUSTOM_SENTINEL) {
            // Switch to custom mode but keep whatever the user had typed.
            // If they were on a known model, clear it so the input is empty.
            if (!isCustom) onChange('');
            return;
          }
          onChange(v);
        }}
        className="w-full rounded-lg border border-templar-sand/30 bg-black/40 px-3 py-2 font-mono text-sm text-templar-text focus:border-templar-sand focus:outline-none"
      >
        {groups.map((g) => (
          <optgroup key={g.label} label={g.label}>
            {g.models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </optgroup>
        ))}
        <option value={CUSTOM_SENTINEL}>— Custom model id… —</option>
      </select>
      {isCustom && (
        <input
          type="text"
          value={model}
          onChange={(e) => onChange(e.target.value)}
          placeholder="paste any model id supported by this provider"
          autoComplete="off"
          spellCheck={false}
          className="mt-2 w-full rounded-lg border border-templar-sand/30 bg-black/40 px-3 py-2 font-mono text-sm text-templar-text placeholder:text-templar-text/30 focus:border-templar-sand focus:outline-none"
        />
      )}
    </div>
  );
}
