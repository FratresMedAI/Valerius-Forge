# @fratresmedai/valerius-core

Core BYOK LLM engine, content safety gate, and heuristic prompt forge for the Valerius platform.

## What it is

`valerius-core` is the shared runtime library powering Valerius Forge. It provides:

- **`streamForge`** — multi-provider SSE streaming over OpenAI-compatible and Anthropic APIs (BYOK)
- **`evaluateContent`** — hard content gate with pattern-based safety rules (runs before any LLM call)
- **`META_SYSTEM_PROMPT`** — the master Valerius system prompt for the forge
- **`extractBriefSignals`** / **`buildPrompt`** and related heuristics — brief analysis and prompt generation

Works in **Node 18+** and modern browsers (no transpilation quirks — uses native `fetch` and `ReadableStream`).

## Exports

### From `llm`
| Export | Description |
|--------|-------------|
| `streamForge(opts)` | Stream tokens from any supported provider |
| `endpointFor(config)` | Resolve the API endpoint URL for a provider |
| `headersFor(provider, apiKey, referer?)` | Build request headers for a provider |
| `LLMConfig` | Config interface: `{ provider, apiKey, model, baseUrl? }` |
| `Provider` | Union type of all supported providers |
| `PROVIDER_LABELS` | Human-readable labels per provider |
| `MODEL_GROUPS` | Grouped model catalog per provider |
| `DEFAULT_MODELS` | Flat array of curated models per provider |
| `DEFAULT_LOCAL_BASE_URL` | Default Ollama base URL |

### From `contentGate`
| Export | Description |
|--------|-------------|
| `evaluateContent(input)` | Returns `{ blocked, category?, matchedPattern? }` |
| `reportViolation(input, result)` | Structured violation log (extend with your backend) |
| `ContentGateResult` | Result type |
| `ContentViolationCategory` | Union of all violation categories |

### From `metaPrompt`
| Export | Description |
|--------|-------------|
| `META_SYSTEM_PROMPT` | The Valerius forge system prompt string |

### From `generate`
All heuristic analysis and prompt-building utilities (`extractBriefSignals`, `buildPrompt`, `detectKind`, etc.).

## Installation

```bash
npm install @fratresmedai/valerius-core
```

> **Note:** This package is not yet published to npm. Install locally via `npm install ../valerius-core` or link with `npm link`.

## Usage

### Basic streaming with BYOK

```ts
import { streamForge } from '@fratresmedai/valerius-core';

const result = await streamForge({
  config: {
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY!,
    model: 'gpt-4o',
  },
  systemPrompt: 'You are a helpful assistant.',
  userPrompt: 'Write a haiku about TypeScript.',
  onToken: (chunk) => process.stdout.write(chunk),
});

console.log('\nFull text:', result.fullText);
```

### With the content gate (recommended)

```ts
import { evaluateContent, reportViolation, streamForge } from '@fratresmedai/valerius-core';

const brief = userInput;
const gate = evaluateContent(brief);

if (gate.blocked) {
  reportViolation(brief, gate);
  throw new Error('I cannot assist with that request.');
}

await streamForge({ config, systemPrompt, userPrompt: brief, onToken });
```

### Anthropic (Claude)

```ts
await streamForge({
  config: {
    provider: 'anthropic',
    apiKey: process.env.ANTHROPIC_API_KEY!,
    model: 'claude-sonnet-4',
  },
  systemPrompt: META_SYSTEM_PROMPT,
  userPrompt: brief,
  onToken: (chunk) => process.stdout.write(chunk),
});
```

### Local LLM (Ollama / LM Studio)

```ts
await streamForge({
  config: {
    provider: 'local',
    apiKey: '',                           // keyless by default for Ollama
    model: 'llama3.1',
    baseUrl: 'http://localhost:11434/v1', // default; omit to use this value
  },
  systemPrompt: META_SYSTEM_PROMPT,
  userPrompt: brief,
  onToken: (chunk) => process.stdout.write(chunk),
});
```

## Supported Providers

| Provider | Identifier |
|----------|------------|
| OpenAI | `openai` |
| Anthropic | `anthropic` |
| Google (Gemini) | `google` |
| xAI (Grok) | `xai` |
| OpenRouter | `openrouter` |
| Local (Ollama / LM Studio) | `local` |

## Requirements

- Node.js >= 18 (for native `fetch` and `ReadableStream`)
- Or any modern browser

## License

MIT
