# Proposed fixture and input freeze

Status: **proposal for integration review**, 13 November 2026. Delta/Fayoum and the 2024–2025 historical inputs are user-confirmed. The interface choices below are recommendations, not a record of team agreement. This is preparation data/schema work; no application or crop recommendation engine is implemented.

## The first version

One field or selected study location, one historical two-year replay, a baseline if supplied, and candidate plans drawn from a small reviewed crop catalog. First show constraints and environmental evidence. Add water comparisons only when crop-demand rules and water accounting are reviewed. Do not train a rotation ML model from two years of satellite data.

Keep four things separate:

1. **Farmer input:** what this farmer knows about this field and its water supply.
2. **Environmental context:** historical weather, observed satellite signals and predicted soil properties.
3. **Crop rules:** locally reviewed planting windows, duration, family, suitability and crop-water methodology.
4. **Results:** which checks pass, fail or remain unknown, and which evidence supports the comparison.

A fixture is a test example of these interfaces. It is not a real farm, scientific validation or a recommendation. The existing seasonal fixture tests only a small environmental payload; it does not define farmer input or a complete integrated result.

## Farmer questions: six core prompts

| Prompt | Proposed stored fields | Requiredness and behavior |
| --- | --- | --- |
| Where is the field? | location.point.longitude/latitude; location.regionId | Require a map pin or explicit sample selection to resolve context. Region is derived/confirmed against supported study geometry, not typed freely. A pin provides coarse context; field-pixel summaries require a boundary. |
| How large is it? | areaHa | Positive hectares internally; null means unknown. Require a known area for absolute field-volume comparison. A field boundary can supply a separately attributed calculated area. |
| What was grown before? | cropHistory.status and entries of cropId/startDate/endDate | Offer unknown. Known entries are ordered and refer to a versioned crop catalog. Unknown history makes rotation-history checks unknown, not passed. |
| How is it irrigated? | irrigationMethod | surface, drip, sprinkler, other or unknown. This does not automatically assign an efficiency. |
| How much water can you receive in each planning window? | waterBudget.status; allocations[windowId,availableM3]; accountingBoundary | Known volumes are m3 delivered to the field inlet over the stated window. Zero is a real zero; unknown uses an empty allocation list plus unknown status. A schedule or irrigation method alone cannot supply volume. |
| Which crops cannot you grow? | excludedCropIds | Empty means the farmer declared no crop exclusions within the reviewed local catalog. IDs come from that catalog; the list is not a claim that all other crops are suitable. |

Two optional prompts: **your current/intended plan** (baselinePlan) and **comparison preference** (objective). A missing baseline stays null: show candidate comparison without a current-plan improvement claim. Default objective is compare_only; lower_irrigation_demand becomes actionable only when comparable reviewed demand estimates exist. Do not invent numerical preference weights.

The research replay period, window IDs, unit conventions and catalog version are application configuration, not extra farmer questions. Four half-year windows in the sample are deliberately **synthetic software intervals**, not Egyptian crop seasons. Real local windows must be reviewed before model use. Historical replay does not forecast the farmer's next two years.

Soil tests, water quality/salinity, drainage restrictions and a field polygon are valuable optional follow-ups. Do not force farmers to type NASA metrics, NDVI, soil-moisture estimates, crop coefficients or estimated yield. A missing lab test must never be displayed as a SoilGrids measurement.

## Internal units and missing values

- Use ISO dates, WGS84 longitude/latitude, hectares, mm, m3, degC and explicit observation intervals. Convert local area/volume units once at the boundary, using an accepted conversion and preserving the original entry. No feddan conversion is hard-coded in this proposal.
- 1 mm over 1 ha equals 10 m3. Volume therefore depends on area. Depth-to-volume conversion alone does not estimate crop irrigation demand.
- Compare field-inlet supply with field-inlet demand. Net crop ET is a different water boundary. Convert only with sourced soil-water, effective-rain and irrigation-loss assumptions; never silently assume efficiency from irrigation type.
- Unknown is explicit null/status, not zero, a guessed average or an automatically successful check. A farmer assertion has different provenance from a dataset estimate.
- Missing critical water inputs permit evidence browsing, but water feasibility is unknown. A real zero budget is evaluated as zero. Missing crop rules also produce unknown/blocked checks, never feasible by default.

## Dataset parameters to keep

| Dataset | Native inputs retained | First use | Model dependency |
| --- | --- | --- | --- |
| POWER | T2M, T2M_MIN, T2M_MAX, RH2M, WS2M, ALLSKY_SFC_SW_DWN, PRECTOTCORR, PS; units and dates | Mean/min/max air-temperature context and rainfall history. Retain other variables for a later reviewed ET0 method. | Primary weather backbone. POWER is gridded meteorological context. Current 24-point sampling does not prove field resolution. |
| IMERG | precipitation, precipitation_cnt, date, native support | Rainfall cross-check and independent regional context, only for available valid days | Optional corroboration; do not splice over POWER without an explicit source policy. 92 dates are missing in the selected inventory. |
| SMAP | soil_moisture, retrieval_qual_flag, latitude/longitude, AM/PM, native bounds | Regional surface-wetness evidence and valid-pass coverage | Optional evidence. Not root-zone water, irrigation supply or a mandatory daily field input. QA gaps are substantial. |
| HLS L30 | B04, B05, Fmask, scales, acquisition time, grid | QA-filtered NDVI and observed vegetation timing | Optional field evidence once boundary, mosaic and QA processing exist. Red/NIR alone does not establish crop identity. |
| MOD13Q1 | NDVI, EVI, VI_Quality, pixel_reliability, scale and composite interval | Regional vegetation trajectory | Fallback/context, not an extra independent daily HLS measurement. |
| ECOSTRESS LSTE | LST, LST_err, QC, cloud, water and acquisition time | Observed surface thermal context | Optional; the selected product is LST, not ET, air temperature or a calibrated water-stress score. |
| SoilGrids | phh2o, clay, sand, silt, soc, bdod; depth; mean/Q05/Q95; units/support | Predicted soil context with uncertainty, overridden only by separately attributed field evidence | Context/fallback; no salinity, nutrient-fertilizer prescription or direct field test is implied. Do not use all six depths as duplicate model votes. |

All seven remain in the evidence/source registry. The first application path does not need seven mandatory feature dependencies. Use POWER plus known farmer constraints and reviewed crop rules; progressively add a satellite layer only when it supports a defined output. Provider-complete downloads and scientifically usable features are different gates. Satellite import status is documented in [regional coverage](REGIONAL_COVERAGE.md).

## Feature output: what to compute first

For each configured, reviewed time window and resolved spatial support:

- avgAirTempC = mean of valid daily T2M, with observed/expected days.
- seasonalRainfallMm = sum of selected-source daily precipitation over the exact interval. The initial conservative publication rule is null if any day is unavailable; retain a separately labeled observed subtotal and coverage for diagnosis. Do not add rainfall products together.
- heatExposureDays stays null until the crop, threshold, daily variable and method are reviewed. An arbitrary generic threshold would create false precision.
- Optional evidence: QA-filtered vegetation observations, SMAP AM/PM coverage and wetness, thermal acquisition summaries, and depth-specific predicted soil context. These need not enter ranking.

Weather statistics have to be extracted for the chosen point/native cells or a documented spatial aggregation. The current envelope-mean Harmony series cannot be relabeled as the farmer's field measurements. Field HLS processing needs an actual polygon; a pin cannot supply cultivated-area weights.

## Corrections needed before freezing the shared feature contract

The existing [SeasonalFeatures schema](../../contracts/seasonal-features.v1.schema.json) is useful for a one-source mock. It is too small for a mixed-source production handoff:

| Current gap | Proposed integration change |
| --- | --- |
| One provenance object for every metric | Per-metric evidence references to independently versioned source/processing records |
| One dataStatus for modeled, observed and predicted values | Per-metric status and origin; preserve farmer/synthetic/historical/modeled distinctions |
| No usable coverage denominator | Per-metric observed/expected counts, valid fraction and missing reason |
| locationId without a spatial resolution record | Explicit support type, geometry/grid reference, matching method and distance/area where meaningful |
| season label not tied to a reviewed calendar | Calendar/config version and exact interval; distinguish historical observations from planning dates |
| Heat count exists without accepted threshold | Keep nullable; add method/threshold reference before populating |

Because these change meaning and shape, propose a reviewed next contract version and migrate fixture/consumers together. This branch intentionally leaves the existing shared contract and fixture intact. Do not independently add different fields in Python and TypeScript.

## Concrete proposal files

- [Replay configuration](../../data/fixtures/proposed/replay-config.synthetic.json): synthetic windows and catalog placeholder.
- [Known-water farmer input](../../data/fixtures/proposed/field-input.known-water.synthetic.json): complete input shape with fabricated water amounts and baseline.
- [Unknown-water input](../../data/fixtures/proposed/field-input.unknown-water.synthetic.json): tests unavailable water, unknown history and no baseline.
- [Zero-water input](../../data/fixtures/proposed/field-input.zero-water.synthetic.json): confirms zero differs from unknown.
- [Proposed input schema](fixture-proposal/field-input.schema.json): request shape for review, not yet a canonical contract.
- [Validation command](../../scripts/data/validate_fixture_proposal.py): JSON Schema plus date/window/catalog/region consistency checks; requires jsonschema.

All coordinates, histories, crops, budgets, areas and baselines in these fixtures are software test data. No crop suitability, demand, ranking or successful recommendation is encoded. Farmer-private requests must not be published in Git.

## Implementation order and owners

1. Integration lead reviews this input shape, water boundary, replay mode and next feature-contract version with frontend, feature and model owners. This is the proposed freeze; no team agreement is presumed.
2. Domain/model owner supplies a small locally reviewed crop catalog, real seasonal windows, rotation-family rules and a sourced water-demand method. These are the largest missing inputs; NASA does not supply them.
3. Frontend uses the synthetic known/unknown/zero cases for form and unavailable-state design. It must label the fixture as synthetic and avoid implied recommendations.
4. Data engineer resolves location/support and publishes a reproducible single-source weather handoff; feature engineer computes the two initial metrics with coverage and provenance. Keep research context separate from decision-ready features.
5. Model engineer evaluates reviewed constraints with pass/fail/unknown states. Water comparison is enabled only after compatible supply/demand evidence exists. Rank only after feasibility and objective definitions are accepted.
6. Integration lead verifies one complete synthetic path, then a separately labeled historical data path. Independently check a numerical example, gaps, zero water, unknown area/history, no baseline and unsupported location.

Work is ready to start when the team can point to **one input fixture, one crop/calendar configuration, one accepted feature contract and one result-state policy**. More datasets or more UI fields will not resolve those four decisions.

## Implementation follow-up

See the [implementation checkpoint](IMPLEMENTATION_CHECKPOINT.md) for the recommended three-crop shortlist, proposed per-metric real-weather handoff and cross-year calendar issue. These additions are reviewable artifacts; no crop rules or team approvals are fabricated.
