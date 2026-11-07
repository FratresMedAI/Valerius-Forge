# Contributing

Thanks for looking at Valerius. This is a **portfolio demo** (see the maturity block in [README.md](README.md)), not a supported product line.

## Quick start (docs / hygiene only)

```bash
git clone https://github.com/FratresMedAI/Valerius-Forge.git
cd Valerius-Forge
```

- **Web app:** `npm install` then `npm run dev` (root).
- **CLI:** `cd valerius-cli && npm install && npm run build`.
- **Gate smoke:** after CLI build, `node scripts/gate-test.mjs` from repo root.

## What we welcome

- Bug fixes with a clear repro
- Docs, CI, and repo hygiene
- Tests that lock existing behavior (especially the content gate)

## What to skip without an issue first

- Large refactors or new product features
- Changing forge output shape or safety policy without discussion
- Duplicating `metaPrompt` logic in yet another copy instead of consolidating in `valerius-core`

## Pull requests

1. One focused change per PR.
2. Run `node scripts/gate-test.mjs` if you touch `contentGate` or shared safety patterns.
3. Do not commit secrets, `.env.local`, or API keys.
