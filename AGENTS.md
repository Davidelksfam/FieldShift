# Shared instructions for coding agents

## Current direction and authority

Read `README.md`, `IMPLEMENTATION_PLAN.md`, `docs/STATUS.md`, `CONTRIBUTING.md` and the assigned issue before working. Inspect branch and working tree. State scope, assumptions and acceptance criteria.

The user authorized the client-first Egypt blueprint on 2026-11-13; [decision 0003](docs/decisions/0003-client-first-egypt-dashboard.md) records that direction. This replaces the earlier blank planning gate. The canonical application lives at root `src/`; `web/` is a historical placeholder. Do not revive older backend/seven-source assumptions.

## Collaboration

One contributor/agent, one task, one branch or isolated worktree. During pivot integration, branch from `chore/clean-slate-new-direction-2026-11-13` and target PRs at that branch. Never reset or force-push main, overwrite another contributor's changes or merge without authorization. Track shared-file edits and use `docs/team/HANDOFF_TEMPLATE.md` for incomplete work.

## Implementation and evidence

- Follow the six phases and contracts in the implementation plan. Use the approved brand files in `docs/brand/` before UI work.
- Keep synthetic fixtures visibly labeled. Do not describe generated benchmark values as NASA/ISRIC observations, model scores as probabilities, or modeled savings as measured outcomes.
- Preserve missingness and source provenance. Co-location is not field-level downscaling. Crop assumptions require local agronomic review.
- Historical 2025 data is not a forecast; salinity heuristic is not soil EC. Nili sequences are conditional on dates and local pest review.
- Do not claim scientific validation, challenge eligibility, deployment or field outcomes without evidence. Never commit secrets, private data or bulky raw downloads.

## Required checks and handoff

Run `npm run check` for code changes and `npm run test:browser` for flow changes (after a production build). Run `python3 scripts/check_repository.py` for documentation/structure changes. Report actual results and limitations. Record material AI contributions in `docs/AI_USAGE.md`.
