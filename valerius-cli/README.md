# ⚒ Valerius — the prompt forge

[![npm version](https://img.shields.io/npm/v/@fratresmedai/valerius?color=d4c7a5&label=npm)](https://www.npmjs.com/package/@fratresmedai/valerius)
[![license](https://img.shields.io/badge/license-MIT-d4c7a5)](./LICENSE)
[![node](https://img.shields.io/badge/node-%3E%3D18-d4c7a5)](https://nodejs.org)
[![web](https://img.shields.io/badge/web-valerius--forge.vercel.app-d4c7a5)](https://valerius-forge.vercel.app)

**Forge AI-ready agent prompts and project briefs from your terminal.**

Valerius takes a one-line description of what you want — an agent, an app, a system, a workflow — and forges a production-quality system prompt, agent architecture, or full project specification. Streamed live, Markdown-formatted, ready to paste into Cursor, Claude, ChatGPT, or any agent framework.

```bash
$ valerius forge "a research assistant that summarizes scientific papers and flags weak methodology"
```

You bring your own key. Your key never leaves your machine.

---

## Why Valerius?

Most prompt-engineering wrappers send your text through their server, charge per call, and lock you to one model. Valerius doesn't.

- **BYOK, terminal-native.** OpenAI, Anthropic, Google, xAI, OpenRouter, or any local OpenAI-compatible LLM (Ollama, LM Studio).
- **No middleman.** Requests go directly from your machine to your provider. Zero telemetry, zero analytics.
- **Streamed.** Tokens hit your terminal as they're generated — feels instant.
- **Two output modes.** *Agent prompts* (system prompts with persona, guardrails, examples) or *full project specs* (architecture, stack, time estimates).
- **Built-in safety gate.** Refuses fraud, malware, and unauthorized-access requests before any LLM call.
- **One file.** No daemon. No config server. Just a CLI.

---

## Install

```bash
npm install -g @fratresmedai/valerius
```

Requires Node.js 18 or newer.

---

## Quick start

```bash
# One-time setup wizard (provider, key, model)
valerius init

# Forge something
valerius forge "an AI coding assistant that follows TDD strictly"

# Pipe a brief from stdin
cat brief.txt | valerius forge -

# Force a specific mode
valerius forge "a customer support chatbot for a SaaS" --mode agent

# Copy the result to clipboard
valerius forge "..." --copy
```

---

## Commands

### `valerius init`

First-time setup wizard. Walks you through choosing a provider, entering your API key (input is hidden), and picking a model. Saves to `~/.valerius/config.json`.

### `valerius forge <brief> [options]`

Forge a prompt or project spec.

| Flag | Default | Description |
|------|---------|-------------|
| `-m, --mode <mode>` | `auto` | `auto`, `agent`, or `project` |
| `-c, --copy` | off | Copy final output to clipboard |
| `--provider <p>` | configured | Override provider for this run |
| `--model <m>` | configured | Override model for this run |

**Modes:**

- **`auto`** — Valerius detects intent. Briefs that describe an AI agent get system prompts; briefs that describe an app get project specs.
- **`agent`** — Force a polished system prompt with persona, capabilities, guardrails, and example conversations.
- **`project`** — Force a full project specification with Mermaid architecture diagram, recommended stack, and realistic time estimate.

**Stdin support:**

```bash
echo "a Discord bot for moderating gaming communities" | valerius forge -
valerius forge - < brief.md
```

### `valerius models [provider]`

List recommended and budget models for a provider.

```bash
valerius models           # uses your configured provider
valerius models anthropic # any provider name
```

### `valerius config show / set-key / set-provider / set-model / clear`

Manage your config.

```bash
valerius config show                          # prints current setup, redacts the key
valerius config set-key sk-ant-...            # set non-interactively
valerius config set-provider anthropic        # or interactive if no arg
valerius config set-model claude-opus-4-5     # or interactive
valerius config clear                         # delete ~/.valerius/config.json
```

---

## Supported providers

| Provider | Value | Get a key |
|----------|-------|-----------|
| OpenAI | `openai` | [platform.openai.com](https://platform.openai.com/api-keys) |
| Anthropic | `anthropic` | [console.anthropic.com](https://console.anthropic.com/settings/keys) |
| Google (Gemini) | `google` | [aistudio.google.com](https://aistudio.google.com/apikey) |
| xAI (Grok) | `xai` | [console.x.ai](https://console.x.ai) |
| OpenRouter | `openrouter` | [openrouter.ai/keys](https://openrouter.ai/keys) |
| Local (Ollama / LM Studio / any OpenAI-compatible) | `local` | — |

For local models, set `baseUrl` to your endpoint (default `http://localhost:11434/v1` for Ollama).

---

## Examples

### Agent system prompts

```bash
valerius forge "a medical triage assistant that scores urgency 1-5 and asks one clarifying question at a time" --mode agent

valerius forge "a senior code reviewer focused on security, performance, and readability — strict but constructive"

valerius forge "a friendly DM/GM for solo D&D 5e — improvises, runs combat, tracks state in a structured block"
```

### Full project specs

```bash
valerius forge "a habit tracker PWA with offline-first sync, streaks, and a calm minimal UI" --mode project

valerius forge "a CLI tool that watches a directory and runs configurable AI agents on file changes"
```

### Pipe + copy workflow

```bash
# Take a one-liner from a teammate and turn it into a full agent prompt
echo "we need a slack bot that triages bug reports" | valerius forge - --mode agent --copy
```

---

## Privacy

- Your API key is stored **only** in `~/.valerius/config.json` on your machine.
- Requests are made **directly** from your terminal to the provider's API.
- Valerius does not run a backend. There is no telemetry, no usage tracking, no analytics.
- The CLI is open source — read the code at [`github.com/FratresMedAI/Valerius-Forge`](https://github.com/FratresMedAI/Valerius-Forge/tree/main/valerius-cli).

---

## Safety

Valerius refuses to forge prompts for clearly harmful content (fraud bots, account takeover scripts, malware, CSAM, terrorism, etc.). The safety gate runs **before** any LLM call — your key is never used for blocked requests. The full pattern set is in [`src/contentGate.ts`](./src/contentGate.ts).

If you hit a false positive on a legitimate brief, please [open an issue](https://github.com/FratresMedAI/Valerius-Forge/issues).

---

## Web version

There's also a web app at **[valerius-forge.vercel.app](https://valerius-forge.vercel.app)** with the same engine, plus visual extras (forge library, modes, embers).

---

## License

MIT — © FratresMedAI

> *"Don't just write code. Command it."*
