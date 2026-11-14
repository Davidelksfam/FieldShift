# FieldShift — Scientific Decision Engine V2 Implementation Plan

**Project:** [Davidelksfam/FieldShift](https://github.com/Davidelksfam/FieldShift)  
**Reviewed baseline:** `main` @ `cd39477569f35b2efc1a84fac15381a58f542a1b` (2026-11-14 review)  
**Status:** Proposed implementation plan; **not implemented or merged**  
**Primary audience:** Coding agents, domain/data researchers, frontend engineers, and reviewers  
**Priority:** Safety-first hackathon MVP, followed by scientific calibration

## 0. Mission, boundaries, and non-negotiables

Build a transparent, farmer-first **rotation decision-support prototype**. Its recommended sequences must satisfy sourced feasibility constraints, and its numerical outputs must be appropriately supported, with explicit uncertainty and unavailable states.

- **Keep current working demo running.** Preserve legacy behavior for regression comparison; introduce `scientific-v2` behind a feature flag. Never mutate historical/source fixture files just to improve a demo story.
- **No scientifically unsupported precision.** Do not present ordinal crop nitrogen/market/forage values, prototype weights, simplistic salinity index, or arbitrary heat thresholds as FAO-approved agricultural outcomes.
- **Unknown ≠ safe, infeasible, or zero.** Treat missing calendars, missing weather dates, absent lab ECe, missing yield outcomes, and unavailable local calibration as first-class statuses.
- **Distinguish data nature:** retrieved historical climate, satellite observations, predicted SoilGrids values, synthetic fallbacks, user-entered lab tests, and published crop references are not interchangeable.
- **No mandatory backend.** Preserve the existing Vite/React SPA, offline behavior, Arabic RTL / English, existing map/evidence views, browser checks, and source provenance.
- **No future-year prediction from 2025 observations.** Historical 2025 data may support clearly labeled historical scenarios, not a forecast for the next planting season.
- **No unsupported crop recommendations.** When the engine cannot verify a key constraint or water comparison, report `needs_review`/`unavailable`, not an invented numerical confidence or attractive percentage.

**Definition of scientific release:** numerical water comparisons must pass independent checks and use complete season-appropriate driver data; rotation feasibility must have validated region-relevant calendars; uncertain outcomes remain labeled until reviewed. Otherwise ship a transparent *exploration / research demo*, not a field-approved recommendation.

## 1. Current-state audit (do not accidentally reinvent existing work)

| Existing module | Current role | V2 treatment |
|---|---|---|
| `src/App.jsx` | owns farmer inputs, location, data refresh, UI mode | add V2 selection/adaptation; preserve legacy |
| `src/services/nasaDataService.js` | 2025 NASA POWER, SoilGrids, MODIS; QA, cache, snapshots/fallback | preserve; extend drivers separately when justified |
| `src/engine/fieldIndices.js` | ET0, heat count, NDVI gap/anomaly, salinity screening, N indicators | classify into decision/evidence-only/unavailable |
| `src/engine/referenceEt.js` | FAO-56 modeled daily reference ET0, 2025-specific | reuse validated computation; generalize year handling only with tests |
| `src/engine/cropEvidence.js` | FAO stage-Kc/ECe and guarded `projectCropEtc` | reuse; ensure crop use/outcome and dates match |
| `src/data/cropEvidence.json` | provenance-aware references, legacy fields unvalidated | leave provenance intact, supplement sourced calendars |
| `src/data/egyptCrops.json` | 9 crops + uncalibrated water/N/market/forage traits | legacy-only for unsupported fields |
| `src/engine/rotationEngine.js` | 16/32 candidates, prototype MCDA, penalties, 3 strategies | leave stable; create independent V2 core |
| `src/components/farmer/*` | 4-step journey, optional inputs, 3-tab recommendation | adapt messages/actions based on evidence/status |
| `src/components/PipelineExplorer.jsx` | five-stage explainability display | render V2 pipeline and reasons behind unknowns |

Current important issues:
1. Without `forceNiliCover`, the current generator still includes Nili candidates; with it, all candidates are forced to contain Nili. This contradicts the optional "Explore" UI.
2. Calendar clashes are not hard-validated. Winter in the 2025 snapshot is January–April **plus** November–December and is **not a continuous winter season**.
3. Legacy water uses `sum(baseWaterMm * kc) * 4.2 / eta`, not the already implemented stage-based FAO ETc.
4. `heatStressDays > 14` and some crop thresholds are assumed heuristics; NDVI anomaly, wetness and ET0 are not direct ranking drivers in legacy.
5. Soil `nitrogenScore` and `marketScore` are invented demo indices; the FAO salinity registry supports only outcome-matched ECe screening when user provides a laboratory result.

## 2. Proposed architecture

```text
Farmer inputs + verified location
             |
Historical data + source provenance + crop reference registry
             |
      Diagnostic registry
    (decision / evidence / unavailable)
             |
  Candidate rotation generator
             |
  Crop-calendar feasibility engine
   feasible / infeasible / unknown
             |
 Scientific models (only where inputs valid)
   ET0 -> stage-Kc -> ETc -> optional water balance
   soil / heat / salt evidence and constraints
             |
  Rank ONLY comparable, feasible options
             |
 Recommendation: actionability + reasons + assumptions
             |
 Farmer-first UI + Expert Mode + traceability
```

Create `src/engine/v2/` with pure functions and stable types using JS objects / JSDoc or a schema library already in project. No new server, DB, or hidden runtime fetch in the engine. Engines must accept explicitly supplied immutable inputs and produce deterministic outputs.

**Core API** (illustrative contract, not implemented):

```js
analyzeRotationV2({
  location, farmerInputs, observedData, sourceProvenance,
  cropCatalog, cropEvidence, cropCalendars, scenario,
}) => {
  diagnostics,
  candidateAudit,
  alternatives: [{
    cropIds,
    feasibility: { status: 'feasible'|'infeasible'|'unknown', reasons: [], sourceIds: [] },
    nili: { mode: 'off'|'explore'|'require', status: 'not_applicable'|'feasible'|'unknown'|'infeasible' },
    water: { status: 'unavailable'|'etc_reference'|'net_estimate'|'gross_estimate', etcMm: null, irrigationMm: null, m3PerFeddan: null, assumptions: [], sources: [] },
    soil: { status: 'qualitative'|'unavailable', benefits: [], risks: [], numericNitrogenBalanceKgHa: null },
    heat: { status: 'evidence_only'|'assessed'|'unavailable', observations: [], cropRisk: null },
    salinity: { status: 'requires_lab_test'|'reference_screen'|'unavailable', outcome: null },
    economic: { status: 'unavailable'|'verified_scenario', returnValue: null },
    decisionStatus: 'comparable'|'conditional'|'not_comparable'|'excluded',
    rationale: [], caveats: [], provenance: [],
  }],
  recommendation: { status: 'proposed'|'conditional'|'unavailable', selectedId: null, reasons: [] },
  comparisonAudit: { criteriaUsed: [], criteriaNotUsed: [], tieBreakers: [] }
}
```

Do **not** report a calibrated confidence probability or `92% suitability` without a validation study. `source support` may be shown as a descriptive data-coverage category, clearly distinct from agronomic confidence.

## 3. Delivery work packages

### PR 0 — Baseline, contracts, and feature flag [P0]

**Owner:** engine/integration lead.  
**Files:** `src/App.jsx`, `src/presentation/farmerModel.js`, new `src/engine/v2/contracts.js`, `docs/engineering/SCIENTIFIC_V2_CONTRACTS.md`, tests.

- Add a non-public or explicitly marked `scientific-v2` mode selector; legacy remains default until release gates pass.
- Freeze and snapshot three current benchmark outputs for the three goal presets (water/soil/market), including source/provenance statuses, candidate IDs, and water estimates. These snapshots are *regression baselines*, not validation truth.
- Add schema guards for `null`, missing units, unsupported outcomes, crop calendar provenance, and source availability.
- Document expected actionability states and the `unknown` propagation policy; preserve exact benchmark centroid matching.
- Ensure default experiences work with network blocked and partial fallback; check RTL/mobile accessibility.

**Done when:** Existing `npm run check` + browser tests pass; legacy outputs unchanged; V2 can be toggled without changing the baseline; baseline fixture checked into tests.

### PR 1 — Verified regional crop-calendar registry [P0]

**Owner:** agricultural data research.  
**Files:** new `src/data/cropCalendars.json`, `docs/data/CROP_CALENDAR_AUDIT.md`, optional `scripts/data/validate_crop_calendars.py`, `src/engine/v2/calendarEngine.js`.

For each crop + region + intended use/cultivar, record:

```json
{
  "cropId": "wheat",
  "regionId": "fayoum_etsa",
  "variety": null,
  "intendedUse": "grain",
  "sowingWindow": null,
  "growthStagesDays": null,
  "harvestWindow": null,
  "prepBufferDays": null,
  "sourceId": null,
  "sourceUrl": null,
  "sourceYear": null,
  "reviewStatus": "unverified"
}
```

`null` means **not established**, not `0`. Do not fill region dates based solely on generic national seasons. Use FAO Crop Calendar, local Egyptian ARC extension publications where obtainable, and separately documented institutional sources. Check whether each crop/region/variety is actually covered. A date range in a reference must be copied with its geographical and cultivation qualifiers. Keep accepted/rejected evidence notes.

Calendar evaluator:
- Compare **actual date intervals** over year boundaries; use ISO date strings and UTC-safe day arithmetic. Never concatenate `Jan–Apr` and `Nov–Dec 2025` into one continuous winter.
- Accept `scenarioYear`, farmer-specific planting dates (optional), sourced sowing windows, stage duration ranges, harvesting window, preparation/termination buffer, and intended use.
- Return `feasible`, `infeasible`, `unknown`, with machine-readable `reasonCodes`, source IDs, and explicit missing fields. Fail closed for *proposed/verified* status, not for exploratory listing.
- Explicit farmer exclusions are hard constraints. An unknown calendar is not permission to claim feasibility; use conditional/exploratory UI.

**Done when:** region-aware calendar schemas validate; year boundary and missing-source cases are unit-tested; no fabricated dates are merged.

### PR 2 — Correct Nili exploration and crop sequence generation [P0]

**Owner:** engine.  
**Files:** `src/engine/v2/candidateGenerator.js`, `src/engine/v2/calendarEngine.js`, `src/components/farmer/AdditionalDetails.jsx`, `src/components/farmer/RecommendationView.jsx`.

Replace `forceNiliCover` semantics *in V2* with `niliMode`:
- `off` (default): **zero** Nili candidates in primary alternatives.
- `explore`: generate both with- and without-cover candidates; cover options are evaluated separately and shown only as conditional unless calendar/buffer and local management requirements are verified.
- `require`: optional advanced expert setting; search cover-only candidates; if none feasible, show none and an explanation. Do not silently weaken this constraint.

Validate summer harvest -> Nili sowing -> Nili termination/harvest -> next winter sowing, including field prep, water availability, and pest-family review. The available time window must cover **all** steps. Treat NDVI low-cover as an exploratory hint, **never** an automatic authorization for cover cropping. Do not promise N fixation or soil restoration from an unverified Nili sequence.

**Done when:** `off` never proposes cover, `explore` never forces it, unknown timing stays explicitly conditional, and known overlaps are excluded from approved suggestions.

### PR 3 — Scientific ETc and guarded irrigation-water model [P1]

**Owner:** climate/water engineer.  
**Files:** `src/engine/v2/waterModel.js`, `src/engine/referenceEt.js`, `src/engine/cropEvidence.js`, `scripts/data/` acquisition/validation tools, `tests/unit/v2-water.test.js`.

Substages and exact claims:
1. **ET0:** reuse existing FAO-56 Penman–Monteith implementation; keep published source units and validation provenance. If changing date logic from the existing 2025-only implementation, test ordinary/leap years, day-of-year, invalid records, full-year and season continuity.
2. **ETc reference:** daily `ETc(t) = ET0(t) * Kc(t)`, with verified **crop use**, a locally supported or user-entered sowing date, explicit initial/development/mid/late lengths, and a documented Kc source. The existing `projectCropEtc` can be adapted. No invented stage durations. Special handling needed for berseem cutting cycles and for cowpea used as short cover rather than grain/forage.
3. **Complete windows:** a winter season may straddle 2024–2025 or 2025–2026. Extend historical daily meteorological drivers before claiming complete season ETc; otherwise return `unavailable`. Do not borrow 2025 dates for a 2026 forecast.
4. **Net irrigation:** implement a soil-water balance only when effective rain, soil water storage/initial depletion, rooting behavior and management assumptions have a documented method and valid inputs. Without these, output ETc only, **not net irrigation demand**.
5. **Gross irrigation:** `gross_mm = net_irrigation_mm / supported_efficiency`; `m3_per_feddan = gross_mm * 4.2`. Irrigation efficiency must be stated as a validated value or an explicit farmer/editable scenario assumption, not a universal verified constant. Do not double-count any legacy Kc multiplication.
6. **Comparisons:** show baseline-vs-candidate *modeled* difference only when both share compatible periods, methods, complete windows, and units. Cross-cycle comparisons with Nili must use equivalent planned horizon and include all crops/water.

Independent verification: compare modeled ETc and, separately, irrigation schedules with worked FAO examples / FAO CROPWAT for matched inputs; record tolerances **before** accepting the test. Existing pyet agreement checks only ET0 implementation, not real-world irrigation accuracy. Document any simplifications that make results incomparable.

**Done when:** missing driver/date/Kc makes water outputs unavailable; complete supported dates generate deterministic physically meaningful ETc with units; net/gross are gated; legacy water numbers are never mislabeled as FAO-calibrated.

### PR 4 — Soil, salinity, heat, and diagnostic purpose audit [P1]

**Owner:** agronomy/data + engine.  
**Files:** `src/engine/v2/evidenceRegistry.js`, `src/engine/v2/soilAssessment.js`, `src/engine/v2/heatAssessment.js`, `docs/data/INDICATOR_DECISION_AUDIT.md`.

Use an explicit role for every metric: `hard_constraint`, `validated_comparison_metric`, `advisory_evidence`, or `unavailable`.

- **Nitrogen:** remove the additive legacy `-2/+3` scores from V2 ranking. Prefer qualitative supported facts: crop family diversity, rotation break, known management cautions. `numericNitrogenBalanceKgHa = null` until fertilization, harvest removal, residue management, biological fixation and losses can be modeled and independently checked. SoilGrids total N (g/kg) is not plant-available N.
- **Salinity:** only user-provided saturated-paste laboratory soil ECe can be compared with outcome-matched FAO salinity references; screening index, pH and canal location are not ECe. Preserve outcome/use mismatches as `unsupported` and avoid arbitrary 15-point penalties in V2.
- **Heat:** keep `>38 C days` as historical exposure; apply a crop-stage penalty/constraint only if sourced crop/cultivar-specific sensitivity and season timing are available. Otherwise show advisory evidence, not an invented `+12` penalty.
- **NDVI anomaly, low cover, root wetness:** evidence/context only, no direct agronomic claim or score until independent validation supports its causal/use relationship. Missing QA remains missing.
- **pH/soil texture:** screening or verified local constraint according to source strength. Predicted SoilGrids topsoil values cannot establish measured field diagnosis.
- **Market/forage:** hide quantitative economic rankings without sourced local price, yield, costs or feed outcomes. If unavailable, say unavailable; do not silently pretend `marketScore` is profit.

**Done when:** a report enumerates each indicator, observed/derived/source nature, entry point into decision, and accepted/disallowed claims; tests assert no unsupported numeric penalty is produced.

### PR 5 — Feasibility-first ranking + farmer-facing output [P1]

**Owner:** engine + UX.  
**Files:** `src/engine/v2/recommender.js`, `src/engine/v2/explanations.js`, `src/components/farmer/RecommendationView.jsx`, `src/components/PipelineExplorer.jsx`, `src/presentation/farmerModel.js`.

Ranking policy:
1. Exclude definite hard violations from the recommended set (keep audit reasons).
2. Put feasible / comparable scenarios ahead of unverified scenarios. Do **not** compare a candidate with complete modeled irrigation against one missing critical water data as if missing means zero.
3. For **water goal**, rank by **comparable modeled irrigation** when valid; if only ETc exists, label criterion as consumptive crop requirement, not irrigation withdrawal. If neither available, return `no_verified_water_ranking`.
4. For **soil goal**, do not turn qualitative advisory indicators into false percentages. Provide a sourced, explainable checklist and optionally Pareto/non-dominated choices; avoid a mathematically false singular optimum.
5. For **market goal**, if local economics unavailable, say `economic_comparison_unavailable` and show non-economic evidence separately; never advertise a market winner based on legacy points.
6. Prefer a compact set of distinct alternatives and preserve a deterministic stable tie-break. Never fabricate three cards if only one is supportable.
7. Return reasons (`whyIncluded`, `whyExcluded`, `missingEvidence`, `sources`, `assumptionSensitivity`) and an actionable state: `proposed`, `conditional`, or `no_supported_recommendation`.

Farmer UX requirements: four-question first-run flow retained; label water as `ETc reference`, `net estimate`, or `gross estimate` distinctly; use simple Arabic descriptions; show strongest caveats before “plant this” phrasing; keep optional expert details collapsed and use accessible status labels; explain non-comparability clearly.

**Done when:** recommendations are reproducible and traceable; UI never displays fabricated percent accuracy, invalid numeric savings, or unsourced claims; Expert Mode exposes full audit.

### PR 6 — Scientific and product validation + release gate [P1]

**Owner:** QA/integration lead with agronomy reviewer.  
**Files:** `tests/unit/v2-*.test.js`, `tests/browser/scientific-v2.spec.js`, `docs/delivery/SCIENTIFIC_V2_VALIDATION.md`, `docs/pitch/THREE_MINUTE_DEMO.md`, documentation updates.

Required test matrix:

| Test | Expected behavior |
|---|---|
| Nili `off` | no Nili in primary candidate set |
| Nili `explore` | with/without Nili; conditional if calendar unverified |
| Nili `require`, impossible timeline | no fabricated feasible Nili choice |
| Winter crosses Dec/Jan | correct continuous date ordering, no fake 2025 winter sum |
| Missing calendar/source | feasibility `unknown`, never approved |
| Valid dated crop + FAO stage Kc + complete ET0 | reproducible ETc with provenance |
| Incomplete weather / unsupported crop use | ETc `unavailable`, no borrowed pixel |
| No rain/soil-water input | net/gross irrigation `unavailable` |
| User-provided ECe absent | no numeric salinity inference |
| SoilGrids N or SOC provided | never convert directly into fertilizer/N-balance quantity |
| Generic heat observation only | no unverified crop-specific heat penalty |
| Market data absent | `economic_comparison_unavailable` |
| Synthetic fallback | explicit source warning; no verified-field claim |
| Candidate A lacks water; B has water | no apples-to-oranges water ranking |
| Goal/region change | recompute deterministically, preserve other inputs |
| Arabic/English, phone/desktop, offline | correct RTL, accessible warnings, no broken legacy demo |

Run `npm run check` and `npm run test:browser` after each substantive PR, plus the V2-specific tests and an offline/source-failure browser scenario. Preserve original ET0 numerical validation. For any new quantitative claim add an external reference calculation and record input/output/tolerances and known regional limitations.

**Release decision:** V2 can become default **only** after calendar provenance and behavior tests pass; use a preview/experimental label for unvalidated ETc/soil logic. If water model cannot pass scientific release gates, keep it as `ETc reference scenario` and do not present gross water savings.

## 4. Sequencing and collaboration

**Recommended PR order:** `00-foundation` -> `01-calendars` -> `02-nili` -> `03-water` -> `04-soil-evidence` -> `05-ranking-ux` -> `06-validation`.

**Parallel work after PR 0:**
- **Data researcher:** sourced crop calendar matrix and local source verification; owns reference JSON/docs only.
- **Engine engineer:** pure feasibility/candidate modules and water-model interfaces; no UI ownership.
- **UX engineer:** state language and accessible components against frozen mocked V2 contracts; no algorithm edits.
- **QA/reviewer:** fixtures, invariants, scientific test cases and independent CROPWAT comparisons.

Assign **one owner per shared file**; don't let multiple agents concurrently edit `src/App.jsx`, `src/engine/rotationEngine.js`, or the same fixture. Every PR must include: task scope, changed data/units, provenance, before/after behavior, limitations, test evidence, rollback switch, and explicit “no unsupported claim” review.

**Safe migration:** Keep the old `evaluateFieldAndRotations` exported and used by the legacy view; expose new `analyzeRotationV2` behind one adapter. No direct port of `nitrogenScore`, `marketScore`, `baseWaterMm`, or `finalSuitability` into the V2 public contract. Roll back to legacy by disabling the flag; do not relabel legacy estimates as validated recommendations.

## 5. Minimal hackathon scope (if time or references are constrained)

**Must complete:** PR 0 + calendar `unknown`/`infeasible` handling + correct Nili opt-in + explicit current-evidence labels + safe UI messaging + regression/browser checks.

**Strong next step:** stage-Kc ETc for one fully supported crop/calendar/region scenario with full historical weather and independent reference comparison. Expand crop/region support only after that vertical slice is correct.

**Deliberately defer:** full Egypt crop catalog calibration, measured yield prediction, verified fertilizer prescription, nitrogen mass budget, crop-price forecasting, soil-water deficit model without proper inputs, live weather forecast, and any “X% scientifically accurate recommendation” claim.

**Successful demo statement:** “FieldShift combines historical Earth observations, sourced crop references and date-aware feasibility checks. It compares what can be compared, identifies what still requires local verification, and makes every assumption inspectable.”

## 6. Agent implementation directive (paste into a coding agent)

> Act as a senior agronomic decision-support engineer on `Davidelksfam/FieldShift`. Read `AGENTS.md`, `web/AGENTS.md` when relevant, `docs/engineering/POSTPROCESSING.md`, `docs/data/CROP_SCIENCE_AUDIT.md`, and this implementation plan. Implement only the PR assigned to you. Respect the existing Vite/React client-first architecture and bilingual/offline behavior. Preserve legacy demo and data files, use pure deterministic engine functions, record provenance and units, avoid fabricated calendar values/soil-water results, and treat missing scientific support as unknown/unavailable. Add unit, integration and browser tests for all decision-path changes. Do not claim FAO-calibrated water savings, verified nitrogen restoration, or farm-scale agronomic accuracy without matching validation evidence. Open a small PR with acceptance-test output and remaining gaps; do not merge until reviewed.

## 7. Reference bibliography and evidence boundary

- Current repo: [Postprocessing contract](https://github.com/Davidelksfam/FieldShift/blob/main/docs/engineering/POSTPROCESSING.md) and [Crop Science Audit](https://github.com/Davidelksfam/FieldShift/blob/main/docs/data/CROP_SCIENCE_AUDIT.md).
- [FAO-56 Chapter 5: crop ETc = Kc × ET0](https://www.fao.org/4/X0490E/x0490e0a.htm); [FAO-56 Chapter 6 stage coefficients](https://www.fao.org/4/x0490e/x0490e0b.htm).
- [FAO CROPWAT 8.0](https://www.fao.org/sustainable-development-goals-helpdesk/accelerate/data-portals/article-detail/cropwat/) — requirements and daily soil-water balance; benchmark/reference, **not a claim that any V2 output already matches it**.
- [FAO Crop Calendar](https://cropcalendar.apps.fao.org/?language=en&pagename=%2Fwelcome.do) — source discovery; **country/crop/region coverage must be checked before filling fields**.
- [FAO Annex A1.1 soil salinity references](https://www.fao.org/4/y4263e/y4263e0e.htm) — only outcome-matched lab ECe comparisons.
- [Egypt Agricultural Research Center](https://www.arc.sci.eg/) — potential local extension evidence; no specific calendar data assumed here.
- [USDA-NRCS cover crop guidance](https://efotg.sc.egov.usda.gov/api/CPSFile/59338/340_PA_PS_Cover_Crop_2026) — illustrates timing/termination considerations, not Egypt-specific crop calendars.

---
**Delivery principle:** first prove a proposed sequence is possible; then calculate only what the data support; then rank honestly; finally make the explanation easy for a farmer to act on with local expert review.