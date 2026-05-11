# Changelog

All notable changes to Valerius Forge will be documented in this file.

## [0.1.0] — 2026-05-10

### Added
- Initial release of Valerius Forge
- Forge webview panel with dark theme (VS Code CSS variables)
- Multi-provider SSE streaming: OpenAI, Anthropic, Google, xAI, OpenRouter, Local LLM
- Three forge modes: Auto, Agent Prompt, Full Project
- `valerius.forge` — open Forge panel
- `valerius.forgeSelection` — forge selected editor text
- `valerius.setApiKey` — securely store API key via SecretStorage
- `valerius.setProvider` — quick-pick provider selector
- `valerius.clearApiKey` — remove stored key
- Status bar indicator showing API key status with click-to-configure
- Editor context menu entry for `valerius.forgeSelection`
- Content safety gate (local pattern matching, pre-LLM)
- Abort support — stop mid-stream with the Stop button
- Copy-to-clipboard button on output
- Keyboard shortcut: `Ctrl+Enter` / `Cmd+Enter` to forge
