# Scientific V2 PR 5 — Experimental orchestration and feasibility-first inspection

## Changes

- `src/engine/v2/index.js` wires candidate/calendar evaluation, crop-only reference ETc, indicator provenance, qualitative soil/family evidence, historical heat, outcome-matched laboratory salinity and recommendation policy. It retains all candidate reports, exclusions, reasons, raw used inputs and source registries for replay.
- `src/engine/v2/explanations.js` preserves original reasons, assumptions, missing fields and source IDs without inventing a score.
- `src/engine/engineAdapter.js` forwards the legacy service payload/catalog explicitly, inheriting its normalized temperature/soil units only at that boundary. Contradictory explicit unit declarations fail closed. The default legacy call is unchanged.
- `src/components/ScientificV2Inspector.jsx` provides Expert-only bilingual historical scenario/source/calendar JSON, independent Nili off/explore/require and goal controls, distinct alternatives, conditional candidate, baseline and modeled differences, and complete JSON audit. Invalid JSON or contracts produce a rejection rather than a stale result.
- Integration/browser coverage adds missing-source/date handling, Nili transitions, release-gate spoof rejection, legacy invariance, malformed input rejection and a numerical end-to-end software fixture. Legacy snapshot hashes are unchanged.

The separate policy and rotation-water modules are dependencies delivered with this staged PR; they do not activate the farmer journey.

## Scientific assumptions and sources

The engine uses the existing daily FAO-56 reference ET0 implementation, checked FAO-56 Kc profiles and supplied complete actual-date crop stages. Reference links and exact registry IDs are returned with every calculation. See [water-model delivery](SCIENTIFIC_V2_PR03.md), [crop calendar audit](../data/CROP_CALENDAR_AUDIT.md), [crop-science audit](../data/CROP_SCIENCE_AUDIT.md), and the [submitted plan](../engineering/FieldShift_Scientific_V2_Implementation_Plan.md).

Only complete, feasible, compatible quantities for the same point, horizon, weather source and model assumptions are ranked. ETc is crop-only consumptive reference requirement; fallow evaporation, soil-water balance, net/gross irrigation, withdrawals and measured savings are not modeled. A minimum needs at least two compatible feasible alternatives. Qualitative soil/family evidence and heat exposure do not become nitrogen, market or heat scores. Scalar legacy ECe never becomes a laboratory sample.

Request fields cannot pass release gates: local calendar review, independent whole-season water comparison, indicator review, product validation and independent agronomic review remain pending.

## Input/output examples

Normal sparse 2025 exploration with the nine-crop catalog: Nili `off` generates 16 options with unknown timing; `explore` generates 32; `require` exposes zero until complete calendar and management evidence passes. Water stays null with units and explicit missing reasons. No option is declared optimal.

The deliberately artificial unit/browser fixture supplies eight-day crop stages and checked **test-only** reference/scenario provenance for wheat, maize and sorghum, using archived Fayoum weather. It produces wheat/maize reference ETc 55.84230537509318 mm and wheat/sorghum 69.05607837321821 mm, with baseline differences 0 and -13.21377299812503 mm. These short dates are software assertions, not crop-calendar or agronomic recommendations. The selected model candidate is conditional; irrigation stays unavailable. Changing the artificial maize harvest by one day produces a hard calendar exclusion, leaving one feasible option and no selected best strategy.

## Verification

- `npm run check`: 101 tests passed; default production build and repository/link checker passed.
- Focused integration: seven tests passed including full numerical orchestration, exact input replay snapshots and source failure.
- Experimental browser inspection: three tests cover bilingual/mobile legacy invariance, Nili/goals/invalid JSON, and an artificial full numerical comparison. All three passed using an isolated temporary port 4184 configuration; the tracked configuration stays on 4174.
- Nine frozen legacy benchmark/goal outputs retain identical hashes with the feature flag on and off.

## Limitations and rollback

No independent whole-season CROPWAT/field comparison, full Egyptian crop calendar or independent agronomic approval is claimed. Historical 2025 observations are not forecasts; arbitrary map clicks cannot borrow a benchmark's weather. Local scenario entries are recorded assumptions, not proof of scientific validity. External sources/maps may fail; scientific availability must remain explicit.

The production farmer UI keeps the legacy engine. Omit `VITE_SCIENTIFIC_V2=true` to remove the experimental inspector, or revert this staged PR. No data migration or backend rollback is needed.

## Complete stacked verification

Root integration passes **113 unit tests**, production build and documentation checks, plus **10 default browser tests** and **3 flagged V2 browser tests** on the tracked configuration. Policy regressions additionally reject relabeled model methods, non-model quantities, foreign weather points/periods and incomplete source lineage. Unknown values never enter comparison as zero; incompatible comparison groups produce no arbitrary overall winner. Baseline references remain in the audit even when outside the three displayed alternatives. All five scientific release gates remain pending.
