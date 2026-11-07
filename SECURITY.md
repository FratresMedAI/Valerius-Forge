# Security

Valerius is **bring-your-own-key**. API keys stay on the user's device (browser `localStorage`, CLI `~/.valerius/config.json`, editor secret storage). Fratres does not proxy forge requests.

## Reporting

If you find a security issue in this repository:

1. **Do not** open a public GitHub issue for exploitable problems.
2. Email **kylebean@fratres-x.com** with a short description, reproduction steps, and impact.
3. We will acknowledge within a few business days when possible.

## Scope

This policy covers the Valerius-Forge repository (web app, CLI, editor extensions) and published packages such as `@fratresxai/valerius`.

Out of scope: abuse of third-party LLM provider accounts and prompts users choose to send to their own models.

## Content gate

The client-side content gate blocks a defined set of harmful requests before any LLM call. Regression cases live in `scripts/gate-test.mjs` and run in CI.
