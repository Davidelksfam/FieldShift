# Repository structure and ownership

**Status:** Organizational directory layout accepted; application code, dependency installation, live NASA imports and deployment are **not** implemented.

| Path | Owner | What belongs here |
| --- | --- | --- |
| `contracts/` | Integration lead | Cross-language JSON Schema, versioning, compatibility rules |
| `docs/` | Integration lead coordinates | Product, methodology, decisions, collaboration and delivery guidance |
| `scripts/data/` | Data engineer | Fetch/clean/validate NASA and external source inputs |
| `scripts/features/` | Feature engineer | Aggregation, indicators, source-to-feature transforms |
| `data/raw/` | Data engineer | Large/raw downloads: ignored; never committed |
| `data/interim/` | Data engineer | Temporary cleaned intermediates: ignored except README |
| `data/manifests/` | Data engineer | Small provenance manifests and retrieval instructions |
| `data/fixtures/` | Shared, lead approves | Versioned labeled synthetic fixtures for parallel work and tests |
| `web/src/app/` | Frontend developer | App Router routes and layouts once framework choice accepted |
| `web/src/components/ui/` | UI/UX developer | Reusable base components and design system |
| `web/src/components/field/` | Frontend developer | Field input and location widgets |
| `web/src/components/rotations/` | Frontend developer | Rotation comparisons and timelines |
| `web/src/components/scenarios/` | Frontend developer | Water and priority scenario controls |
| `web/src/hooks/` | Frontend developer | React-facing state and adapters |
| `web/src/lib/rotation/` | Model engineer | Deterministic rules, feasibility, ranking, sensitivity |
| `web/src/lib/evidence/` | Integration lead with data/model review | Provenance transformations and evidence display adapters |
| `web/src/lib/schemas/` | Integration lead | Types/validators bound to canonical contracts |
| `web/src/lib/utils/` | Integration lead | Generic shared utilities only; no farming logic |
| `web/public/data/` | Feature engineer publishes, lead reviews | Small publicly safe output artifacts (no private farmer info) |
| `tests/data/`, `tests/features/` | Relevant pipeline owner | Fixtures and reproducibility/quality checks |
| `tests/integration/` | Integration lead | Cross-component contracts and end-to-end smoke tests |

## Dependency flow

`NASA / local sources → scripts/data → cleaned intermediates → scripts/features → versioned public feature JSON → web/src/lib/rotation → frontend`

Cross-language data travels through reviewed [contracts](CONTRACTS.md), never through incidental Python dict keys or hard-coded UI assumptions. The frontend may render synthetic fixtures while real data is prepared, but **must label them synthetic**. The model must reject unsupported rules or expose uncertainty rather than manufacture outputs.

## Vercel-ready, not Vercel-deployed

The **proposed** web deployment root is `web/`. Once the team has accepted the stack and the event permits coding, create the actual Next.js project there, including a genuine generated `package-lock.json` and working `package.json`. No empty or fabricated lockfiles are committed. Heavy remote-data collection runs offline, not on each Vercel request.

Git tracks files, not empty directories: the placeholder README files reserve owner-specific folder paths without pretending an application exists. No production service, database or external API integration has been configured.
