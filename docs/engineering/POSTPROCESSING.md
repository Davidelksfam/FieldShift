# Post-processing contract and assumptions

User-authorized scope: issue #16, after dataset PR #15 was merged to main. The six implementation stages are recorded here; the five-stage explorer exposes the decision pipeline in Judge Mode. Brand and source-provenance rules continue to apply.

## 1. Six diagnostics

`computeFieldIndices(data, inputs, catalog)` returns:

| Diagnostic | Implemented definition | Limits |
| --- | --- | --- |
| Reference ET₀ | Daily FAO-56 short-grass Penman–Monteith, summed for seasonal windows | Derived from separately acquired Tmax/Tmin, RH2M, WS2M, solar radiation and pressure, plus native-grid elevation/latitude. EVPTRNS is **not** ET₀. |
| Summer heat | Count Tmax >38°C in valid May–Sep daily observations; report July separately | Regional exposure, not observed crop damage |
| Bare-soil window | Longest consecutive accepted NDVI<0.22 composite support clipped to Sep–Nov; total duration also retained | Cloud/missing observations and calendar gaps break runs. Unknown support remains visible. Low NDVI can mean water, settlement or uncropped land. |
| Canopy anomaly | `(2025 summer peak − mean(2020–24 accepted annual summer peaks)) / sample SD` | Exact same native pixel, at least 3 distinct prior years and 8 current summer observations. Each historical year needs >=8/10 QA-good composites. Zero SD/insufficient history → null. Small-sample anomaly, not causal diagnosis. |
| Salinity/drainage screening | `clamp(15 + 35×max(pH−8,0) + (clay>40?15:0) + (tail?12:0) + reportedSaltBonus,0,100)`; salt bonus 0/18/35 | Prototype screening index, not EC, drainage measurement or crop-specific salt exposure. Synthetic soil stays labeled illustrative. |
| Baseline nitrogen | Sum the last two crop ordinal N scores; report retrieved soil N and SOC alongside | **Soil-adjusted ordinal index remains null:** g/kg concentrations cannot be converted into ordinal crop points without a calibrated relationship. No fertilizer quantity or mineralization rate is invented. |

Seasonal windows are Shitwi months 11,12,1–4 (181 days), Seifi 5–9 (153), Nili 9–11 (91). With a single 2025 year, Shitwi is **Jan–Apr + Nov–Dec**, not one continuous winter season. The windows overlap and must not be summed as nonoverlapping annual quantities.

The ET₀ implementation uses daily G=0, mean-RH approximation for actual vapor pressure, albedo .23, FAO solar geometry and net longwave radiation; solar/clear-sky ratio is clamped .3–1 and negative modeled ET is floored at zero. All required drivers must pass ranges and a complete 365-day calendar. Arbitrary clicked locations without acquired driver history show unavailable ET₀/anomaly rather than borrowing another pixel. Source URLs, dates, hashes and units are in [reference-ET manifest](../../data/manifests/reference-et.json) and [history manifest](../../data/manifests/ndvi-history.json).

Numerical validation: all 1,095 daily ET₀ results agree with independent `pyet 1.3.1 pm_fao56` to <0.000001 mm/day (actual maximum ~4.4×10⁻¹⁰). See [validation output](../../data/processed/reference-et-validation.json). This is an implementation comparison using identical input data, not independent field validation. Reference ET₀ does **not** calibrate existing crop water estimates.

## 2. Candidate generation and filters

Enumerate the catalog's winter × summer × optional Nili crops: 32 candidates with the nine-record catalog. Longest observed BSW>32 days, or the farmer's explicit “Explore a conditional Nili cover” switch, requires Nili and yields 16 candidates. The switch is a hypothetical planting opportunity, not a new satellite observation.

Hard exclusions: duplicate crop IDs, invalid/missing water traits, and explicit farmer exclusions. Season slots come from the catalog. Calendar overlap is **not hard-validated** because sowing/harvest dates are absent; all Nili options stay conditional and need local review. Barley is not generated because the accepted catalog has no reviewed barley record.

Penalties include three consecutive Poaceae across the known last-two-crop history and proposed sequence (+18), N balance<=−3 (+18), salinity only when a farmer-supplied lab soil ECe exceeds an outcome-matched FAO threshold (+15/crop; prototype penalty, not FAO weight), and summer heat-sensitive crops (<37°C) when HSD>14 (+12/crop). pH mismatches and sandy surface-irrigation losses trigger local review. Salt screening is never treated as measured soil EC.

## 3. MCDA and distinct cards

The established prototype water/N/market/forage subscore formulas remain, with explicit penalties. Relative farmer weights are normalized; all-zero uses 50/30/20. The **water objective sets water weight to max(farmer weights)+50**, leaving other weights unchanged; the soil objective does the same for soil weight. This keeps each objective dominant while retaining user priorities.

Select the best water candidate distinct from baseline, then the best soil candidate distinct from both. Objective ties use lower water volume / higher N balance, then stable sequence ID. The three displayed suitability scores and global ranks are **recomputed with the same farmer weights** so unlike objectives are not compared as one scale. Objective scores/weights and full candidate rankings are separately inspectable. No alternative is fabricated if constraints leave fewer distinct choices.

Gross water follows the user's original formula `round(Σ(baseWaterMm×Kc)×4.2/η)`, η=.55/.68/.75/.88. Unit: m³/feddan/**rotation**, not an exact measured annual quantity. The supplied 2,500–5,200 reference band is displayed as a review flag when exceeded; outputs are never clipped or rescaled to look plausible. Whether baseWaterMm already includes stage-specific Kc remains a calibration question. Nitrogen and market indices are ordinal, not fertilizer or profit estimates.

## 4. Explanations and uncertainty

Each card has actual heat/July/low-cover evidence, summer crop catalog threshold, a data-support category and crop-specific AR/EN local checks. High/Medium/Low categories are deterministic **availability/support heuristics**, not calibrated probabilities or agronomic approval. Any synthetic source → Low; missing autumn support/history, incomplete climate, a declared new-sandy scenario or conditional Nili → Medium; otherwise High. Desert-fringe input signals possible mixing; the app does not claim to detect a boundary. Poor-quality live source responses retain the audited fallback instead of silently renewing confidence.

## 5. Reactive UI and explorer

Preset/map changes load local content immediately and refresh sources asynchronously. Sliders, irrigation and optional-cover controls only recompute in memory. Judge Mode opens historical charts and a five-button explorer: indices → candidates → ranking → explanations → farmer JSON. Red shading marks actual observed low-NDVI runs; green dashed cover is a hypothetical .42 floor only when a Nili recommendation exists. Missing dates are not interpolated.

The real 2025 flagship data now lives in [demoPresets.json](../../src/data/demoPresets.json), generated by the preparation script. [syntheticFixtures.json](../../src/data/syntheticFixtures.json) retains the original illustrative fixtures for tests/arbitrary-location fallback. Historical NDVI and ET drivers are separate versioned local assets and are included in the offline shell. The original cleaned acquisition artifact remains [observedBenchmarks.json](../../src/data/observedBenchmarks.json) with its integrity hash unchanged.

## 6. Validation and pitch

See [three-minute demo](../pitch/THREE_MINUTE_DEMO.md), actual pipeline regression tests and browser checks. No claimed award, confirmed rubric, field success, measured water savings, canal EC or verified crop calendar follows from these implementation checks. The synthetic 19-day/48-day Fayoum story must not replace the retrieved 58-day/no-observed-gap result.

## Crop-reference evidence amendment — 2026-11-13

The new `src/data/cropEvidence.json` stores direct FAO-56 (1998, Chapter 6 Table 12) crop-stage Kc references and official Annex A1.1 soil ECe thresholds with source links, crop-outcome distinctions and explicit unverified legacy fields. Numeric 2025 edition values were not independently transcribed in this audit. `projectCropEtc` is a guarded secondary reference calculation requiring actual 2025 sowing dates and four locally checked stage lengths; **it does not replace the active demo gross-water calculation**. The optional farmer-provided *lab soil ECe* is separately evaluated; the unmeasured 0–100 salinity screening no longer triggers a numeric salinity penalty. See [Crop Science Audit](../data/CROP_SCIENCE_AUDIT.md).
