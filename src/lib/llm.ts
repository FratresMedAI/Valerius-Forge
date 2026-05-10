// Multi-provider browser-side LLM client (BYOK).
// Keys live ONLY in localStorage. Never log, never persist elsewhere.

export type Provider = 'openrouter' | 'xai' | 'anthropic' | 'openai' | 'google' | 'local';

export interface LLMConfig {
  provider: Provider;
  apiKey: string;
  model: string;
  /** Base URL — only used for `local` (Ollama / LM Studio / any OpenAI-compatible local server). */
  baseUrl?: string;
}

export type LLMSettings = LLMConfig;

export const PROVIDER_LABELS: Record<Provider, string> = {
  openrouter: 'OpenRouter',
  xai: 'xAI (Grok)',
  anthropic: 'Anthropic (Claude)',
  openai: 'OpenAI',
  google: 'Google (Gemini)',
  local: 'Local LLM (Ollama / LM Studio)',
};

/** Comprehensive model catalog per provider, grouped for the picker dropdown.
 * Users can also pick "Custom…" and paste any model id their provider supports.
 * Newer / more capable models lead each group. */
export interface ModelGroup {
  label: string;
  models: string[];
}

export const MODEL_GROUPS: Record<Provider, ModelGroup[]> = {
  openai: [
    {
      label: 'GPT-5 family',
      models: ['gpt-5', 'gpt-5-mini', 'gpt-5-nano'],
    },
    {
      label: 'GPT-4.1 family',
      models: ['gpt-4.1', 'gpt-4.1-mini', 'gpt-4.1-nano'],
    },
    {
      label: 'GPT-4o family',
      models: ['gpt-4o', 'gpt-4o-mini', 'chatgpt-4o-latest', 'gpt-4o-2024-11-20', 'gpt-4o-2024-08-06'],
    },
    {
      label: 'Reasoning (o-series)',
      models: ['o3', 'o3-mini', 'o3-pro', 'o1', 'o1-mini', 'o1-pro', 'o1-preview'],
    },
    {
      label: 'Legacy GPT-4',
      models: ['gpt-4-turbo', 'gpt-4-turbo-2024-04-09', 'gpt-4', 'gpt-4-0613'],
    },
    {
      label: 'Legacy GPT-3.5',
      models: ['gpt-3.5-turbo', 'gpt-3.5-turbo-0125'],
    },
  ],
  anthropic: [
    {
      label: 'Claude 4.5 family',
      models: ['claude-opus-4-5', 'claude-sonnet-4-5', 'claude-haiku-4-5'],
    },
    {
      label: 'Claude 4 family',
      models: ['claude-opus-4', 'claude-sonnet-4', 'claude-haiku-4'],
    },
    {
      label: 'Claude 3.7',
      models: ['claude-3-7-sonnet-latest', 'claude-3-7-sonnet-20250219'],
    },
    {
      label: 'Claude 3.5',
      models: [
        'claude-3-5-sonnet-latest',
        'claude-3-5-sonnet-20241022',
        'claude-3-5-sonnet-20240620',
        'claude-3-5-haiku-latest',
        'claude-3-5-haiku-20241022',
      ],
    },
    {
      label: 'Claude 3',
      models: [
        'claude-3-opus-latest',
        'claude-3-opus-20240229',
        'claude-3-sonnet-20240229',
        'claude-3-haiku-20240307',
      ],
    },
  ],
  google: [
    {
      label: 'Gemini 2.5',
      models: ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'],
    },
    {
      label: 'Gemini 2.0',
      models: [
        'gemini-2.0-pro',
        'gemini-2.0-flash',
        'gemini-2.0-flash-lite',
        'gemini-2.0-flash-thinking-exp',
      ],
    },
    {
      label: 'Gemini 1.5',
      models: ['gemini-1.5-pro', 'gemini-1.5-pro-002', 'gemini-1.5-flash', 'gemini-1.5-flash-002', 'gemini-1.5-flash-8b'],
    },
  ],
  xai: [
    {
      label: 'Grok 4',
      models: ['grok-4', 'grok-4-fast', 'grok-4-mini', 'grok-4-heavy'],
    },
    {
      label: 'Grok 3',
      models: ['grok-3', 'grok-3-fast', 'grok-3-mini', 'grok-3-mini-fast'],
    },
    {
      label: 'Grok 2',
      models: ['grok-2-1212', 'grok-2-vision-1212', 'grok-beta'],
    },
  ],
  openrouter: [
    {
      label: 'xAI',
      models: ['x-ai/grok-4', 'x-ai/grok-4-fast', 'x-ai/grok-3', 'x-ai/grok-3-mini'],
    },
    {
      label: 'Anthropic',
      models: [
        'anthropic/claude-opus-4-5',
        'anthropic/claude-sonnet-4-5',
        'anthropic/claude-opus-4',
        'anthropic/claude-sonnet-4',
        'anthropic/claude-3.7-sonnet',
        'anthropic/claude-3.5-sonnet',
        'anthropic/claude-3.5-haiku',
      ],
    },
    {
      label: 'OpenAI',
      models: [
        'openai/gpt-5',
        'openai/gpt-5-mini',
        'openai/gpt-4.1',
        'openai/gpt-4.1-mini',
        'openai/gpt-4o',
        'openai/gpt-4o-mini',
        'openai/o3',
        'openai/o3-mini',
        'openai/o1',
        'openai/o1-mini',
      ],
    },
    {
      label: 'Google',
      models: [
        'google/gemini-2.5-pro',
        'google/gemini-2.5-flash',
        'google/gemini-2.0-pro',
        'google/gemini-2.0-flash',
        'google/gemini-1.5-pro',
        'google/gemini-1.5-flash',
      ],
    },
    {
      label: 'Meta Llama',
      models: [
        'meta-llama/llama-3.3-70b-instruct',
        'meta-llama/llama-3.1-405b-instruct',
        'meta-llama/llama-3.1-70b-instruct',
        'meta-llama/llama-3.1-8b-instruct',
      ],
    },
    {
      label: 'DeepSeek',
      models: ['deepseek/deepseek-r1', 'deepseek/deepseek-chat', 'deepseek/deepseek-v3'],
    },
    {
      label: 'Qwen',
      models: ['qwen/qwen-2.5-72b-instruct', 'qwen/qwq-32b', 'qwen/qwen-2.5-coder-32b-instruct'],
    },
    {
      label: 'Mistral',
      models: ['mistralai/mistral-large', 'mistralai/mixtral-8x22b-instruct', 'mistralai/mistral-nemo'],
    },
    {
      label: 'Perplexity (online)',
      models: [
        'perplexity/llama-3.1-sonar-large-128k-online',
        'perplexity/llama-3.1-sonar-small-128k-online',
        'perplexity/sonar-pro',
      ],
    },
  ],
  local: [
    {
      label: 'Llama',
      models: ['llama3.3', 'llama3.2', 'llama3.1', 'llama3.1:70b', 'llama3.1:8b'],
    },
    {
      label: 'Qwen',
      models: ['qwen2.5', 'qwen2.5:32b', 'qwen2.5:72b', 'qwen2.5-coder', 'qwen2.5-coder:32b', 'qwq'],
    },
    {
      label: 'DeepSeek',
      models: ['deepseek-r1', 'deepseek-r1:32b', 'deepseek-r1:70b', 'deepseek-coder-v2'],
    },
    {
      label: 'Mistral / Mixtral',
      models: ['mistral', 'mistral-nemo', 'mixtral', 'mixtral:8x22b'],
    },
    {
      label: 'Microsoft / Google',
      models: ['phi3', 'phi3:14b', 'phi4', 'gemma2', 'gemma2:27b'],
    },
    {
      label: 'Code-focused',
      models: ['codellama', 'codellama:34b', 'codestral', 'starcoder2'],
    },
  ],
};

/** Flat list of curated defaults. Used when we just need an array (e.g. the
 * default-model lookup when switching providers). First entry per provider is
 * the "good default". */
export const DEFAULT_MODELS: Record<Provider, string[]> = Object.fromEntries(
  (Object.keys(MODEL_GROUPS) as Provider[]).map((p) => [
    p,
    MODEL_GROUPS[p].flatMap((g) => g.models),
  ]),
) as Record<Provider, string[]>;

export const DEFAULT_LOCAL_BASE_URL = 'http://localhost:11434/v1';

const STORAGE_KEY = 'valerius:llm-settings:v1';

export function loadSettings(): LLMSettings | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LLMSettings>;
    if (!parsed.provider || !parsed.model) return null;
    // Local LLM may run keyless (Ollama default). Other providers require a key.
    if (parsed.provider !== 'local' && !parsed.apiKey) return null;
    if (
      !(['openrouter', 'xai', 'anthropic', 'openai', 'google', 'local'] as Provider[]).includes(
        parsed.provider,
      )
    )
      return null;
    return {
      provider: parsed.provider,
      apiKey: parsed.apiKey ?? '',
      model: parsed.model,
      baseUrl: parsed.baseUrl,
    } as LLMSettings;
  } catch {
    return null;
  }
}

export function saveSettings(s: LLMSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

export function clearSettings(): void {
  localStorage.removeItem(STORAGE_KEY);
}

interface StreamOpts {
  config: LLMConfig;
  systemPrompt: string;
  userPrompt: string;
  onToken: (chunk: string) => void;
  signal?: AbortSignal;
}

class LLMError extends Error {
  status?: number;
  constructor(msg: string, status?: number) {
    super(msg);
    this.status = status;
  }
}

function friendlyStatus(status: number): string {
  if (status === 401 || status === 403) return 'Invalid or unauthorized API key.';
  if (status === 404) return 'Model not found for this provider.';
  if (status === 429) return 'Rate limited — slow down or check your plan.';
  if (status >= 500) return 'Provider is having issues right now.';
  return `Request failed (HTTP ${status}).`;
}

async function readErrorBody(res: Response): Promise<string> {
  try {
    const text = await res.text();
    return text.slice(0, 240);
  } catch {
    return '';
  }
}

export async function streamForge(opts: StreamOpts): Promise<{ fullText: string }> {
  const { config } = opts;
  if (config.provider === 'anthropic') return streamAnthropic(opts);
  return streamOpenAICompatible(opts);
}

function endpointFor(config: LLMConfig): string {
  switch (config.provider) {
    case 'openrouter':
      return 'https://openrouter.ai/api/v1/chat/completions';
    case 'xai':
      return 'https://api.x.ai/v1/chat/completions';
    case 'openai':
      return 'https://api.openai.com/v1/chat/completions';
    case 'anthropic':
      return 'https://api.anthropic.com/v1/messages';
    case 'google':
      // Gemini exposes an OpenAI-compatible Chat Completions surface.
      return 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
    case 'local': {
      const base = (config.baseUrl?.trim() || DEFAULT_LOCAL_BASE_URL).replace(/\/+$/, '');
      // Ollama at port 11434 exposes `/v1/chat/completions` (OpenAI-compatible).
      // LM Studio defaults to `http://localhost:1234/v1`. Either works as long
      // as the user points us at the OpenAI-compatible base.
      return `${base}/chat/completions`;
    }
  }
}

function headersFor(provider: Provider, apiKey: string): Record<string, string> {
  const base: Record<string, string> = { 'Content-Type': 'application/json' };
  if (provider === 'anthropic') {
    base['x-api-key'] = apiKey;
    base['anthropic-version'] = '2023-06-01';
    base['anthropic-dangerous-direct-browser-access'] = 'true';
    return base;
  }
  if (provider === 'local') {
    // Ollama runs keyless by default; only attach Bearer if the user provided
    // one (LM Studio / a proxy may require it).
    if (apiKey.trim()) base['Authorization'] = `Bearer ${apiKey}`;
    return base;
  }
  base['Authorization'] = `Bearer ${apiKey}`;
  if (provider === 'openrouter') {
    base['HTTP-Referer'] = window.location.origin;
    base['X-Title'] = 'Valerius';
  }
  return base;
}

async function streamOpenAICompatible(opts: StreamOpts): Promise<{ fullText: string }> {
  const { config, systemPrompt, userPrompt, onToken, signal } = opts;
  const res = await fetch(endpointFor(config), {
    method: 'POST',
    headers: headersFor(config.provider, config.apiKey),
    body: JSON.stringify({
      model: config.model,
      stream: true,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
    signal,
  });
  if (!res.ok || !res.body) {
    const body = await readErrorBody(res);
    throw new LLMError(`${friendlyStatus(res.status)}${body ? ` — ${body}` : ''}`, res.status);
  }
  return readSSE(res, onToken, (data) => {
    try {
      const json = JSON.parse(data);
      const delta = json?.choices?.[0]?.delta?.content;
      if (typeof delta === 'string') return delta;
      const msg = json?.choices?.[0]?.message?.content;
      if (typeof msg === 'string') return msg;
    } catch {
      // ignore non-JSON lines
    }
    return '';
  });
}

async function streamAnthropic(opts: StreamOpts): Promise<{ fullText: string }> {
  const { config, systemPrompt, userPrompt, onToken, signal } = opts;
  const res = await fetch(endpointFor({ provider: 'anthropic', apiKey: '', model: '' }), {
    method: 'POST',
    headers: headersFor('anthropic', config.apiKey),
    body: JSON.stringify({
      model: config.model,
      max_tokens: 4096,
      stream: true,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
    signal,
  });
  if (!res.ok || !res.body) {
    const body = await readErrorBody(res);
    throw new LLMError(`${friendlyStatus(res.status)}${body ? ` — ${body}` : ''}`, res.status);
  }
  return readSSE(res, onToken, (data) => {
    try {
      const json = JSON.parse(data);
      if (json.type === 'content_block_delta' && json.delta?.type === 'text_delta') {
        return json.delta.text ?? '';
      }
    } catch {
      // ignore
    }
    return '';
  });
}

async function readSSE(
  res: Response,
  onToken: (chunk: string) => void,
  parseData: (data: string) => string,
): Promise<{ fullText: string }> {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  let full = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buf.indexOf('\n')) !== -1) {
      const line = buf.slice(0, idx).replace(/\r$/, '');
      buf = buf.slice(idx + 1);
      if (!line.startsWith('data:')) continue;
      const data = line.slice(5).trim();
      if (!data || data === '[DONE]') continue;
      const piece = parseData(data);
      if (piece) {
        full += piece;
        onToken(piece);
      }
    }
  }
  return { fullText: full };
}
