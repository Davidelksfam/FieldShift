# Architecture proposal

Status: no stack selected, no application implemented. Accept a decision record before creating framework or infrastructure scaffolding.

## Suggested boundaries

`farmer inputs + cached environmental features + sourced crop rules → feasibility → indicators → scenario comparison → UI/evidence summary`

- Responsive frontend: field input, comparison timelines, scenario controls, evidence panel, Arabic/English localization.
- Deterministic domain/model layer: sequence generation, constraints, water/other indicators, ranking and sensitivity; independent of UI and any LLM.
- Offline data processing: bounded retrieval, quality filtering, seasonal aggregation and provenance.
- Compact versioned data: pilot inputs, sourced crop rules and reproducible cached demo features. A database is optional.
- Optional explanation adapter: summarizes existing calculated evidence; no invented parameters or scientific decisions.

The guide suggests familiar web tooling and small Python processing scripts. These are suggestions, not selected dependencies. No cloud provider, auth, database, API or deployment is required by this setup.

## Contract to agree before parallel development

Record units, schema/version and missing-data behavior for: field inputs; seasonal crop slots and previous crops; environmental features with provenance; crop-rule records; scenario water budget; feasibility violations; indicator results; ranking weights; evidence labels and uncertainty. Define whether an unknown blocks a result or produces a warning. Keep rejected candidates inspectable. Local units require explicit conversion to canonical calculation units.

Proposed future layout, created only as needed: `apps/web/`, `packages/model/` or `services/model/`, `data/` for compact manifests/fixtures, `scripts/data/`, and tests next to owned components. Choose language/package boundaries through a decision record; avoid empty application scaffolding now.

## Quality gates when implementation starts

Pure calculation and rule tests; no overlap between seasons; exact budget-boundary and missing-data cases; independently reproduced water estimate; deterministic cached end-to-end flow; offline fallback; source/date/scale visibility; Arabic RTL and English LTR; mobile and keyboard access. Document actual install/dev/test/build commands with selected runtime versions and lockfiles in the same PR that introduces them.
