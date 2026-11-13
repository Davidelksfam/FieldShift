# Repository structure

The runnable application is at repository root: `package.json`, `vite.config.js`, `index.html`, `src/`, `public/`. See the full [target tree](../../IMPLEMENTATION_PLAN.md).

- `src/data/`: crop catalog and clearly synthetic regional benchmarks.
- `src/services/`: bounded remote access, normalization, provenance and cache.
- `src/engine/`: deterministic agronomic rules.
- `src/components/`: farmer inputs, map, diagnostics, comparisons and evidence.
- `tests/unit/`, `tests/browser/`: calculation/service regression checks and production browser smoke tests.
- `scripts/offline-plugin.js`: build-time first-party shell precache generation.
- `docs/brand/`, `assets/brand/`, `public/brand/`: canonical visual guidance and served logo.
- `docs/`: product, data, contracts, status, decisions, delivery and team context.

The former `web/`, `contracts/`, `data/` and feature-script folders remain organizational/history placeholders. Do not scaffold a second app or restore the old pipeline merely because these folders exist. Old implementations remain in Git history and existing branches.
