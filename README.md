# Valerius

> Don't just write code. Command it.

A premium, dark-mode single-page tool that turns a freeform project brief into a **Cursor-ready prompt**, a **Mermaid architecture diagram**, a **recommended stack**, and a **build-time estimate** — instantly, client-side, with zero API calls.

Built as a portfolio piece for an **AI Solutions Architect** whose primary build stack is **Grok + Cursor**.

## Stack

- Vite + React 18 + TypeScript
- Tailwind CSS v3 (custom Templar theme)
- `lucide-react` icons
- Pure client-side generation — no backend, no API keys

## Defense layer

Suggestio's textarea is gated by **Mini Templar** (3rd place, GraySwan Arena 2026), the user's own prompt-injection / jailbreak classifier — running locally as a Docker container. Every brief is vetted before it gets forged. Malicious inputs are blocked with a styled report (decision, confidence, risk, reason codes); benign inputs surface a "Verified by Mini Templar" badge.

If the container isn't running, Suggestio degrades gracefully and forges unguarded with a visible warning.

```bash
docker compose up -d
```

This starts `occisorleonum/mini-x-templar-gray-swan` on `localhost:8090`. Vite proxies `/api/classify` to it.

## Run locally

```bash
docker compose up -d   # start Mini Templar guardrail
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

The `dist/` output is fully static — drop it on Vercel, Netlify, Cloudflare Pages, or GitHub Pages.

## Theme

Strict Templar palette — no other colors are used:

| Token | Hex |
|-------|-----|
| Background | `#0F0F0F` |
| Templar Red | `#B22222` |
| Sand | `#D4C7A5` |
| Text | `#FFFFFF` |

## How it works

`src/lib/generate.ts` classifies the brief into one of: `webapp`, `api`, `cli`, `mobile`, `data`, `ai`, `generic`, then composes:

1. A structured Cursor prompt (Role / Objective / Context / Requirements / Constraints / Deliverables / Acceptance)
2. A kind-specific Mermaid `flowchart LR` diagram
3. A curated stack grouped by category
4. A complexity-weighted build-time estimate

No external models are called. The output is deterministic and instant.

## Bring Your Own Key (BYOK)

Valerius ships in two modes:

- **Demo mode** (default) — heuristic templates render instantly, fully client-side, no network calls to any LLM provider.
- **LLM mode** — paste your own API key into Settings (gear icon, top-right). The key is stored only in this browser's `localStorage` (key `valerius:llm-settings:v1`) and is sent **only** to the official endpoint of the provider you selected. The owner of this app never sees, proxies, or pays for your usage.

Supported providers (pick one and grab a key):

| Provider | Default model | Get a key |
|---|---|---|
| OpenRouter | `x-ai/grok-4-fast` | <https://openrouter.ai/keys> |
| xAI (Grok) | `grok-4-fast` | <https://console.x.ai/> |
| Anthropic | `claude-sonnet-4-5` | <https://console.anthropic.com/> |
| OpenAI | `gpt-4.1` | <https://platform.openai.com/api-keys> |

In Settings you can pick a provider, paste your key, choose a model from the suggestions list (or type your own), hit **Test connection**, then **Save**. Once saved, every Forge click streams real model output through the Valerius meta-prompt. Click **Clear** to wipe the key from local storage and return to demo mode.

The Mini Templar guardrail still vets every brief before any LLM call leaves the browser.

## License

MIT
