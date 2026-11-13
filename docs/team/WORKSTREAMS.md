# Workstreams and shared-file ownership

**Status:** Team lanes. The user-authorized root SPA is scoped in issue #12; confirm individual assignments in GitHub Issues. Root `src/` supersedes the prior `web/` placeholders for implementation.

| Lane | Main responsibility | Suggested scope |
| --- | --- | --- |
| Integration / project lead | Priorities, interfaces, PR integration and release | `contracts/`, `docs/engineering/`, `.github/` |
| Data/research | Source selection, verification, data quality and provenance | `docs/data/`, `scripts/data/`, `data/` |
| Computation / features | Approved transformations or algorithms and corresponding tests | `scripts/features/`, feature/model tests |
| Frontend / app | User journey and functional UI once scoped | `src/App.jsx`, `src/components/`, feature-specific UI |
| UI/UX / design | Prototype, accessibility, visual rules and components | `docs/brand/`, `src/styles.css`, `src/components/` |
| Validation / pitch | Reproduction, limitations, judging narrative, final checks | `tests/`, `docs/delivery/` |

The lanes are not fixed team roles. The selected stack and contracts are in IMPLEMENTATION_PLAN.md. One owner and one reviewer per issue. Coordinate edits to `AGENTS.md`, `docs/STATUS.md`, `docs/decisions/`, `contracts/`, shared app configuration and CI. Never assume a previous dataset, model or UI flow applies.

## Daily handoff protocol

Each contributor shares: issue + branch, goal, changed files, sample/input contract, actual check results, blockers, the next action and required reviewer. Use [handoff template](HANDOFF_TEMPLATE.md).

## Integration rule

Agree on input/output structure and null/unit/error policies before separate agents develop producer and consumer code. The team accepts implementation only when its combined vertical slice is tested; isolated polished screens are not proof of integration.
