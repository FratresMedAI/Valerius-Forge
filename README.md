<div align="center">
  <img src="https://valerius-forge.vercel.app/templar-helm.png" alt="Valerius Helm" width="110" />
  <br />
  <img src="https://valerius-forge.vercel.app/valerius-logo.png" alt="Valerius" width="340" />
  <br /><br />
  <p><strong>The prompt forge. Turn a single sentence into a battle-ready AI agent prompt.</strong></p>
  <p>
    <a href="https://valerius-forge.vercel.app">Web App</a> ·
    <a href="https://www.npmjs.com/package/@fratresxai/valerius">CLI on npm</a> ·
    <a href="./valerius-vscode">VS Code Extension</a> ·
    <a href="./valerius-raycast">Raycast Extension</a>
  </p>
  <br />
  <a href="https://www.npmjs.com/package/@fratresxai/valerius"><img src="https://img.shields.io/npm/v/@fratresxai/valerius?color=D4C7A5&labelColor=1a1a1a&label=npm&style=for-the-badge" alt="npm version" /></a>
  <img src="https://img.shields.io/badge/node-%3E%3D18-D4C7A5?style=for-the-badge&labelColor=1a1a1a" alt="node ≥18" />
  <img src="https://img.shields.io/badge/BYOK-no%20middleman-D4C7A5?style=for-the-badge&labelColor=1a1a1a" alt="BYOK" />
  <img src="https://img.shields.io/badge/license-MIT-D4C7A5?style=for-the-badge&labelColor=1a1a1a" alt="MIT License" />
  <br /><br />
</div>

---

## What is Valerius?

Valerius takes a plain-English brief and forges it into a production-grade AI agent system prompt or a full coding-agent-ready project spec — in seconds, directly from your browser, terminal, or editor.

**No middleman. No hosted API. You bring your own key.**

---

## Platforms

| | Platform | Install |
|---|---|---|
| 🌐 | **Web App** — live at [valerius-forge.vercel.app](https://valerius-forge.vercel.app) | Open in browser |
| ⚔️ | **CLI** — forge prompts from your terminal | `npm install -g @fratresxai/valerius` |
| 🛡️ | **VS Code / Cursor Extension** — forge from the command palette | [Download `.vsix`](https://github.com/FratresMedAI/Valerius-Forge/releases/latest) |
| 🪄 | **Raycast Extension** — forge from your launcher | Under review — [PR #27796](https://github.com/raycast/extensions/pull/27796) |

---

## CLI Quick Start

```bash
# Install
npm install -g @fratresxai/valerius

# First-time setup (pick a provider, paste your key)
valerius init

# Forge an agent prompt
valerius forge "build a research assistant that searches the web and summarizes papers"

# Forge a full project spec
valerius forge "SaaS app for tracking freelance invoices" --mode project

# Pipe from stdin
echo "a customer support bot for a fintech startup" | valerius forge -

# Force agent mode + copy result to clipboard
valerius forge "data pipeline orchestrator" --mode agent --copy
```

---

## Two Output Modes

**Agent Prompt** — a structured system prompt ready to drop into any AI tool:
- Role, tone, and persona
- Clear goals and scope
- Conversation flow rules
- Tool suggestions
- Parallel execution hints (when relevant)
- Edge case handling

**Project Mode** — a full coding-agent brief:
- Architecture diagram (Mermaid)
- Recommended tech stack
- Phase-by-phase build plan
- Time-to-ship estimate
- Multi-tool compatible (Cursor, Windsurf, Copilot, Continue.dev, Roo Code, Zed)

---

## BYOK — Bring Your Own Key

Your API key never touches our servers. Requests go **directly** from your device to your chosen provider.

| Provider | Get a Key |
|---|---|
| OpenRouter (multi-model) | [openrouter.ai/keys](https://openrouter.ai/keys) |
| xAI (Grok) | [console.x.ai](https://console.x.ai/) |
| Anthropic (Claude) | [console.anthropic.com](https://console.anthropic.com/) |
| OpenAI (GPT) | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| Google (Gemini) | [aistudio.google.com](https://aistudio.google.com/) |
| Local (Ollama / LM Studio) | `http://localhost:11434` |

Keys are stored only in `~/.valerius/config.json` (CLI) or your browser's `localStorage` (web app). Never in the cloud, never proxied.

---

## Safety

Every forge runs through a client-side content gate before any LLM call is made. Requests involving fraud, credential theft, unauthorized account access, financial automation, CSAM, or targeted violence are blocked immediately and silently logged — the model never sees them.

The web app also integrates [Mini Templar](https://github.com/occisorleonum/mini-x-templar) (3rd place, GraySwan Arena 2026) as a secondary guardrail.

---

## Web App Stack

- **Vite + React 18 + TypeScript**
- **Tailwind CSS v3** — custom Strict Templar dark theme
- **Lucide React** icons
- Pure client-side — fully static, deploys anywhere

---

## CLI Commands

```
valerius init                        # one-time setup wizard
valerius forge "<brief>"             # forge a prompt
valerius forge - --mode agent        # read brief from stdin
valerius models [provider]           # list common models
valerius config show                 # view current config
valerius config set-key              # update API key
valerius config set-provider         # switch provider
valerius config set-model            # switch model
valerius config clear                # wipe config
```

---

## Repo Structure

```
Valerius-Forge/
├── src/                  # Web app (Vite + React)
├── public/               # Static assets (helm, fonts, chainmail)
├── valerius-cli/         # CLI package → npm @fratresxai/valerius
├── valerius-vscode/      # VS Code / Cursor extension
└── valerius-raycast/     # Raycast extension
```

---

## License

MIT — built by [Fratres X AI](https://github.com/FratresMedAI)
