# Farmer-first interaction and audit

## Scope and acceptance

Implement the user-supplied farmer-first plan in the active root React SPA. Four questions, Arabic RTL by default, English LTR, progressive results, preserved shared input state, and a secondary Expert Mode. No production deployment or merge. Keep the existing MCDA, crop constants, irrigation efficiencies, datasets, source metadata, cache and offline shell.

Before: all inputs, map, diagnostics and dense ranked cards appear together. After: location → current crops → irrigation → main goal → proposed comparison → alternatives / explanation. Expert Mode retains controls, diagnostics, source provenance, FAO references and the pipeline.

## Verified dependency matrix

| Input / metric | Ranking | Water estimate | Warnings / interpretation | Visibility |
| --- | --- | --- | --- | --- |
| Exact location | Indirect via source heat | No | Source support, pH, low cover | Question 1; map secondary |
| Winter / summer history | Baseline, cereal penalties, distinct candidates | Baseline | Crop / family context | Question 2 |
| Irrigation | Water component | Gross volume via efficiency | Sandy-surface context | Question 3 |
| Weights | MCDA and objective candidate evaluation | No | Explain priority | Question 4; manual in Expert |
| Livestock | Market/forage component | No | Forage interpretation | Optional |
| Laboratory soil ECe | FAO-threshold penalty where supported | No | Threshold exceedance | Advanced; critical caution in result |
| Land type | No | No | Sandy-surface / source support | Advanced |
| Canal / reported salinity | No | No | Heuristic salinity screening | Advanced |
| Area | No | Whole-field scaling only | Invalid-entry message | Optional total request |
| Heat days | Summer crop penalties | No | Historical regional heat | Plain summary / expert values |
| Low-cover proxy | Candidate inclusion before this change | No | Conditional Nili exploration | Plain context / expert values |
| Soil pH | No | No | Catalog-range warnings | Expert / contextual details |
| Heuristic salinity index | No | No | Test-soil caution | Plain summary / expert values |
| ET₀ / energy flux / anomaly / N / SOC / wetness | No direct effect (crop N traits do affect scores) | No | Diagnostics and support | Expert |

Audit difference: region selection previously overwrote irrigation and contextual defaults. New region selection preserves all intentional input values; only location and its sources change. Users can explicitly apply the selected region's demo context in Expert Mode.

## Traceable decision change: low cover

Pre-change baseline outputs were captured from main in `tests/fixtures/pre-farmer-ux-baselines.json` before edits. Historical pixel low cover no longer forces a Nili crop. Without explicit opt-in the existing candidate set allows both two-crop and conditional three-crop sequences (32 candidates); with opt-in it requires conditional cover (16). This preserves the former low-cover<=32 behavior. Kafr El-Sheikh and Nubariya previously forced cover from the proxy. `lowCoverExplorationSuggested` records the historical hint separately. Every included Nili crop still needs harvest/sowing compatibility and pest review; no planting calendar is validated. Baseline and forced-cover outputs can be compared directly with the recorded old outputs in regression tests.

## Scientific presentation correction

Per-rotation modeled water cannot be tested against the supplied annual 2,500–5,200 reference band. Remove that invalid cross-period warning. Always disclose calibration limitations and verify crop dates, legacy base water and assumed irrigation efficiency, including large modeled values. No replacement acceptable range is invented. FAO references do not calibrate the legacy scoring model; ETc remains inactive.

## Input contract and defaults

- Initial question values: Fayoum exact centroid, wheat / maize, flood irrigation, water goal. These are editable demo starting assumptions, not inferred farmer facts.
- Goals set `{water, soil, market}` weights: water `{70,20,10}`, soil `{20,70,10}`, market/forage `{20,20,60}`. They are deterministic product preferences, not scientific calibration. Existing MCDA normalizes and boosts the candidate's target objective by `max(weights)+50`; final comparison uses farmer weights and existing dominant-priority ties. A selected goal may change scores without changing crop names.
- Expert slider edits set `goal=custom` immediately. Returning to Farmer Mode discloses custom weights. Choosing any goal replaces all three weights atomically. Goal changes after results recalculate immediately with a visible explanation.
- Optional defaults: livestock false; required Nili cover false; soil ECe absent; area absent and total estimates off. The engine's required positive area is supplied as **one feddan comparison basis** only when totals are off or the entered area is invalid. Invalid area retains the per-feddan comparison and an error, with totals hidden. Only explicit valid area produces totals. Feddans may be fractional; additional qirats are whole 0–23; total >0 and <=100,000.
- Initial hidden context: old clay, canal tail, moderate reported salinity (Fayoum demo context). These are farmer scenario assumptions, not observations. Region changes preserve them and irrigation; Expert Mode has an explicit “Apply region demo context and irrigation” action. All context is editable under optional advanced details.
- Measured ECe accepts 0–100 dS/m or missing. Only the separate laboratory input triggers the existing outcome-matched FAO penalties. Never fill it from the screening index. Invalid ECe blocks evaluation with an error.
- Default candidate search can still select a conditional cover even without requiring it; every included cover is labeled conditional. The optional switch requires a cover for scenario exploration, never asserts planting feasibility.

## Presentation and warnings

Farmer presentation consumes engine results and `rankedStrategyIds`; React never ranks candidates independently. The primary card identifies the option leading the chosen model comparison, not a universally best or approved crop plan. It may be the baseline. Raw suitability, raw N index, score bars and data-support categories stay in Expert Mode. Compact options include the baseline and both available engine alternatives.

Critical warnings retain all measured ECe exceedances and unavailable outcome-matched salinity references, conditional Nili requirements, illustrative sources and incomplete important observations, deduplicated by message. Contextual crop/pH/infiltration cautions and crop-specific verification are in explanation details. Expert Mode retains all underlying warnings, exact scores, components, penalties, weights, candidates/rejections, raw diagnostics and source metadata. Observed regional history, missing coverage, modeled interpretations and synthetic fallback have distinct plain-language text. No green safe/verified badge is used.

## Accessibility and verification contract

Use semantic radio groups, labeled selects, native details, >=44px targets, visible focus, focus on step/result headings, preserved Back/Continue state and reduced motion. Arabic RTL is default, English LTR switches in the header. Technical coordinates/charts keep native direction. Browser coverage must include widths 390/768/1440, both modes, keyboard activation, offline production reload, audited source retention after invalid live responses and synthetic custom-location fallback. No auth, database, backend or dependencies were added.

## Review evidence

See [actual verification results and screenshots](FARMER_FIRST_VALIDATION.md) and the separately committed [Nili decision](../decisions/0004-low-cover-does-not-require-nili.md). Scientific assumptions remain reviewable and uncalibrated.
