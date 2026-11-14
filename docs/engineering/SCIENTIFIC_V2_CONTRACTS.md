# Scientific V2 contracts and migration

## PR 0 scope

Foundation only: pure contracts/guards, explicit engine selection in an experimental Expert inspector, and nine full legacy regression snapshots. No sourced crop calendars, candidate changes, water models, soil scores or V2 ranking are implemented by this PR. The submitted [implementation plan](FieldShift_Scientific_V2_Implementation_Plan.md) is archived unchanged.

The plan reviewed `cd39477`; the actual preserved baseline is merged main `3fcf71fa825f76e46aafab0d0e75cc121d4eb39e`, including the user's newer map-and-three-cards layout. Do not restore the removed question-per-screen UI. The legacy `evaluateFieldAndRotations` export and its active farmer call remain untouched.

## Feature flag and rollback

Default: `VITE_SCIENTIFIC_V2=false` or absent. Only exact `true` enables an explicitly experimental inspector inside Expert Mode. No query parameter or saved browser state can enable it. The inspector starts on legacy; choosing V2 does not replace the farmer comparison or existing legacy pipeline. Unknown engine names throw rather than silently changing algorithms.

For a separate experimental build:

```bash
npm run build:scientific-v2
npm run test:browser:v2
```

The experimental build goes to ignored `dist-v2/`. Rollback: unset the flag or set it to false and rebuild. No source data, localStorage or database migration is needed. Disabling the flag restores the previous visible default UI.

## State semantics

| State | Meaning | Permission |
| --- | --- | --- |
| Feasibility `feasible` | All declared, nonempty supported checks pass | Only within the exact checked scope; not agronomic approval |
| Feasibility `infeasible` | At least one definite declared hard violation | Exclude from supported recommendations; retain reason |
| Feasibility `unknown` | No checks, missing dates/references, uncertain or unsupported scope | Never approve as feasible |
| Quantity `available` | A finite value with units, scope and available source lineage | Computational availability; not automatically field validation |
| Quantity `unknown` | The requested property is not established | `value: null`, with reason codes |
| Quantity `unavailable` | Model cannot produce a supported result or is not implemented | `value: null`, with reason codes |
| Decision `comparable` | Constraints and numeric comparison basis support comparison | Future recommender must check both |
| Decision `conditional` | Explicit unresolved requirements remain | Surface conditions; no unconditional planting advice |
| Decision `not_comparable` | Missing/mismatched evidence, units or time basis | No numerical ranking |
| Decision `excluded` | Hard violation / explicit exclusion | Audit only |
| Recommendation `proposed` | Future supported, gate-passing selection | Not emitted by PR 0 |
| Recommendation `conditional` | Exploratory choice with explicit conditions | Not emitted by PR 0 |
| Recommendation `unavailable` / `no_supported_recommendation` | No supportable result | `selectedId: null` |

A definite hard failure dominates other feasibility findings. Otherwise any unknown, including an empty check list, propagates unknown. Model availability is separate from feasibility: an unavailable water calculation must not make a calendar feasible or assign zero water.

## Scientific quantity envelope

`src/engine/v2/contracts.js` contains JSDoc and runtime guards, without new dependencies. Every emitted scientific number must have `status`, `value`, `unit`, `provenance`, `validity`, `assumptions`, `missingInputs` and `reasonCodes`.

- Finite zero can be a real explicit scenario value. Missing values must be exactly null, never zero, undefined, NaN or a numeric string.
- Provenance declares nature, source IDs, method and input references. A derived available value requires a method and exact input lineage.
- Validity declares region, crop, intended use, outcome and continuous actual-date period (each explicitly nullable), plus a readable scope.
- An available quantity requires a source registry. Source IDs resolve to available, reviewed/recorded evidence. Synthetic and unknown sources cannot be promoted to scientific quantities. Units are required even when a known quantity cannot be calculated.
- Matching outcomes and crop uses are enforced when requested; registry qualifiers restrict region/use/outcome as applicable. A forage endpoint cannot silently become grain yield.
- Source `verified_reference` means a reference was checked, not that an Egyptian field model was validated. `recorded_input` means an explicitly supplied scenario/input, not a confirmed physical measurement.
- Source metadata and guard success do not independently verify a citation's content. Evidence review and numerical validation remain release gates.

Example, no crop water invented:

```js
unavailableQuantity({
  unit: 'mm',
  code: 'missing_crop_calendar',
  missingInputs: ['sowingDate', 'growthStagesDays'],
  cropId: 'wheat',
  intendedUse: 'grain',
});
// status: unavailable; value: null; units/scope/reasons/lineage present
```

Calendar guards accept explicit nulls in the plan's crop/region/use record. Populated dates/durations require source identity and units. Sourced zero preparation buffer is distinct from an invented default. A verified record must cite a checked reference with matching region/use. This is a metadata guard, not the PR 1 date-overlap algorithm.

## Pure API and legacy boundary

`analyzeRotations` is the single opt-in adapter for engine inspection. Legacy calls return the original engine's exact object shape. `analyzeRotationV2` accepts the plan's location, farmer inputs and provenance; PR 0 records a cloned, unassessed input audit and returns no alternatives or scientific quantities. Its recommendation is unavailable and all scientific release gates are unassessed. It never copies legacy scores into V2 alternatives or calls the legacy model as a scientific substitute.

No network request, current-time dependence, source mutation, random identifier or calendar inference belongs inside V2. Source acquisition stays in services. Laboratory ECe is not inferred from heuristic salt/pH/canal data. The raw input audit is an unassessed trace, not eligible scientific evidence or a recommendation.

## Regression evidence and delivery

`tests/fixtures/scientific-v2-legacy-baselines.json` captures the three exact benchmark centroids × water/soil/market goals from main before engine edits. Each scenario explicitly uses that region's demo defaults (not an implicit UI region-change reset), one-feddan basis, wheat/maize, no livestock, no measured ECe and no required cover. It fingerprints the entire serialized output with SHA-256 and records readable source statuses/URLs, candidate IDs, ranks, scores and water. These are regression truth **only**, not independent scientific validation.

Tests compare the complete serialized legacy output with the flag both off and on, immutable inputs, explicit missingness/units, unsupported outcomes/regions, synthetic sources, invalid periods, calendar provenance and unknown propagation. Existing default browser tests remain required; the separately built inspector has bilingual/mobile and unchanged-legacy tests. Every later PR must include changed files, citations, input/output example, actual test results, limitations and rollback. Scientific release remains blocked until independently checked water and region-relevant calendars pass their gates.

## PR 1–6 implemented experimental scope

The foundation scope above records PR 0. The complete stack now wires region-aware calendar checks, explicit Nili modes, sourced daily crop ETc, qualitative evidence, feasibility-first compatible-water comparison and a bilingual Expert inspector. Normal sparse production calendars produce unknown/unavailable, not manufactured alternatives with complete scientific support. The inspector may show distinct conditional exploratory plans; a model minimum requires at least two feasible compatible quantities. All actual release gates remain pending; no unconditional proposal is emitted.

Derived output envelopes may declare `provenance.inputSourceIds`, a subset of full source lineage. These are separately validated operands whose original crop/use/outcome need not equal the final arithmetic endpoint. Their source identity, availability and region still apply. A derived output needs a distinct direct method/reference source, method ID and input references; direct references must match the output scope. This is not permission to repurpose a FAO endpoint.

Rotation-water aggregation is the sum of complete explicitly supplied primary crop ETc windows only, with source-backed planning-horizon confirmation. Non-crop evaporation and irrigation are excluded and disclosed. Following-winter boundary dates cannot fall inside that horizon without accounting for the crop. Comparisons require the selected point, full matching horizon, outcome, units, modeled method, weather lineage and assumptions. More than one incompatible eligible group produces no arbitrary overall winner. Differences mean baseline minus alternative modeled requirement, not measured savings.

Every analysis records exact used driver/observation values, source registries, calendar inputs, all evaluated candidates/exclusions, daily calculations and comparison basis. [Executed checks and scientific release blockers](../validation/SCIENTIFIC_V2_VALIDATION.md) define the current evidence level and rollback.
