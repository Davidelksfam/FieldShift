# PR 2 — Explicit Nili generation and temporal eligibility

## Scope

`candidateGenerator.js` enumerates catalog winter/summer/cover combinations, delegates to the sourced calendar checker and returns both eligible/exploratory candidates and full exclusion audit. It copies no legacy water, N, market, heat or suitability traits. Tests cover all three modes, candidate counts, unknown propagation, hard exclusions, stable ordering and explicit following-winter/use inputs.

## Behavior and example

With the existing nine-crop catalog:

- `off` (default) evaluates 16 two-crop combinations; no Nili appears.
- `explore` evaluates 32 with/without-cover combinations. It does not require a cover and unknown dates remain conditional.
- `require` evaluates 16 cover-only possibilities, but exposes no options until calendar and management checks are feasible. Unknown or impossible cover is never relaxed into a two-crop choice.

```js
generateCandidatesV2({cropCatalog, regionId:'fayoum_etsa',
  farmerInputs:{niliMode:'explore'}, scenario:{year:2025}});
// Missing verified local dates/use/buffers -> unknown, not approved.
```

NDVI never activates cover. `forceNiliCover` and legacy weights are intentionally not interpreted by V2. Source-backed full summer → cover → next-winter timing, preparation/termination and management review come from the calendar engine. Following winter is a constraint boundary, not an extra crop silently added to a water total. Actual crop uses are supplied explicitly, never guessed from crop names.

## Assumptions / references

This PR introduces no agricultural constants or regional dates. Catalog season labels generate exploratory combinations only. Source eligibility and timing use [the calendar audit](../data/CROP_CALENDAR_AUDIT.md) and [the submitted plan](../engineering/FieldShift_Scientific_V2_Implementation_Plan.md). Software-fixture temporal responses in unit tests are not agricultural validation.

## Verification / limits / rollback

Root integration records actual unit/browser results for the stacked PR. No verified-calendar or agronomic release is asserted; missing calendars produce unknown. Legacy behavior and data are unchanged. Disable `VITE_SCIENTIFIC_V2` and rebuild to roll back experimental inspection. No production merge or deployment.
