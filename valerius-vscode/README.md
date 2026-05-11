# Valerius Forge

**Forge AI-ready agent prompts and project briefs directly in your editor.**

Valerius Forge is a VS Code / Cursor extension that brings the Valerius prompt engine into your IDE. Paste a one-line brief, hit Forge, and get a production-grade agent system prompt or full project spec — streamed token-by-token from your own API key (BYOK).

## Features

- **Forge Panel** — full webview UI with dark-theme styling using VS Code CSS variables
- **Multi-provider streaming** — OpenAI, Anthropic (Claude), Google (Gemini), xAI (Grok), OpenRouter, Local LLM (Ollama / LM Studio)
- **Three forge modes** — Auto, Agent Prompt, Full Project
- **Secure key storage** — API keys stored in VS Code's `SecretStorage` (OS keychain), never in plaintext
- **Editor context menu** — right-click selected text → "Valerius: Forge Selected Text"
- **Status bar indicator** — quick visual feedback on API key status, click to configure

## Installation

> This extension is not yet published on the VS Code Marketplace. Install it manually:

1. Run `npm run package` in the `valerius-vscode` directory to produce a `.vsix` file
2. In VS Code: **Extensions** → `...` → **Install from VSIX…** → select the `.vsix`

## Setup

### 1. Set your API key

Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and run:

```
Valerius: Set API Key
```

Enter your API key for your chosen provider (e.g., `sk-...` for OpenAI).

### 2. Set your provider

```
Valerius: Set Provider
```

Choose from: OpenAI, Anthropic, Google (Gemini), xAI (Grok), OpenRouter, or Local LLM.

### 3. Open the Forge

```
Valerius: Open Forge
```

Or right-click selected text in any editor → **Valerius: Forge Selected Text**.

## Commands

| Command | Description |
|---------|-------------|
| `Valerius: Open Forge` | Open the Forge webview panel |
| `Valerius: Forge Selected Text` | Open Forge pre-filled with selected editor text |
| `Valerius: Set API Key` | Store your API key securely |
| `Valerius: Set Provider` | Choose your LLM provider |
| `Valerius: Clear API Key` | Remove the stored API key |

## Supported Providers

| Provider | Notes |
|----------|-------|
| **OpenAI** | GPT-4o, GPT-5, o3, and more |
| **Anthropic** | Claude 3.5, Claude 4 family |
| **Google** | Gemini 2.5 Pro/Flash |
| **xAI** | Grok 3, Grok 4 |
| **OpenRouter** | Access 100+ models via one key |
| **Local** | Ollama, LM Studio, any OpenAI-compatible server |

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `valerius.defaultMode` | `auto` | Default forge mode (`auto`, `agent`, `project`) |

## Security

- API keys are stored using VS Code's `SecretStorage` API (backed by the OS keychain on macOS/Windows)
- All LLM requests are made directly from the extension host — no proxy, no telemetry
- A content safety gate runs locally before every request

## Requirements

- VS Code 1.85.0 or later (or Cursor)
- Node.js 18+ (for the extension host)
- An API key from a supported provider (or a local Ollama instance)

## Publisher

FratresMedAI — [GitHub](https://github.com/fratresmedai)

> **Note:** To publish to the Marketplace, register a publisher at [marketplace.visualstudio.com](https://marketplace.visualstudio.com/manage) and run `npx @vscode/vsce publish`.
