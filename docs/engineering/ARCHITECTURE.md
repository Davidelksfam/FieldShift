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

The user-approved organizational folder layout is documented in [repository structure](REPOSITORY_STRUCTURE.md), and intended workstreams in [team ownership](../team/WORKSTREAMS.md). Reserved folders contain scope READMEs only; no application framework, runtime or dependency versions are committed. Before implementation, accept the final stack and schema contracts in a separate decision.

## Quality gates when implementation starts

Pure calculation and rule tests; no overlap between seasons; exact budget-boundary and missing-data cases; independently reproduced water estimate; deterministic cached end-to-end flow; offline fallback; source/date/scale visibility; Arabic RTL and English LTR; mobile and keyboard access. Document actual install/dev/test/build commands with selected runtime versions and lockfiles in the same PR that introduces them.


## Cross-team interface draft

See [contracts](CONTRACTS.md) and the canonical sample schema in `contracts/seasonal-features.v1.schema.json`. Draft does not imply scientific verification or framework approval.
