# Scientific V2 PR 04 — indicator and soil evidence audit

Scope: add pure evidence/soil/salinity/heat assessments behind the existing experimental V2 boundary. No default farmer flow, legacy engine, historical dataset, crop coefficients, calendar or ranking weights change. This PR supplies no validated hard constraint or numeric scientific ranking metric.

## Changed files and purpose

- `src/engine/v2/evidenceRegistry.js`: explicit indicator roles, source nature, source availability/point association, pinned checked-reference identity, independently checked botanical taxonomy, units and missing-data requirements.
- `src/engine/v2/soilAssessment.js`: qualitative family structure; predicted soil context; strict outcome-matched laboratory ECe reference response; unavailable nitrogen mass balance and economics.
- `src/engine/v2/heatAssessment.js`: dated historical >38°C exposure with explicit coverage, units, source period and no crop penalty.
- `tests/unit/v2-evidence.test.js`: regression and adversarial coverage for missingness, unsupported crop uses, source/profile mutation, units, location, periods and synthetic inputs.
- `docs/data/INDICATOR_DECISION_AUDIT.md`: indicator decisions, official citations, verification scope and explicit prohibited claims.
- This delivery record: API examples, checks, release limits and rollback.

## Scientific assumptions and citations

See the [indicator audit](../data/INDICATOR_DECISION_AUDIT.md) for official FAO and Kew links and verification hashes. Existing FAO coefficients are reused without mutation and only for their exact reported endpoint. Kew accepted-species/family facts support botanical labels only. Generic historical >38°C exposure follows [post-processing definitions](../engineering/POSTPROCESSING.md), not a validated crop-stage response.

SoilGrids is predicted soil, never a laboratory measurement. Soil nitrogen g/kg is not plant-available N and is not converted to fertilizer or kg/ha. No model of fixation, residue mineralization, nutrient removal, market return or forage economics is available. No nitrogen/market/forage legacy score is consumed. Heat/NDVI/wetness and general soil evidence remain advisory; penalties remain null.

## API and input/output examples

All exports accept object arguments and return deterministic plain objects. Scientific quantities carry `value`, `unit`, `availability`, `nature`, `sourceIds`, `validity`, assumptions, missing inputs and reason codes. Unavailable values are null.

```js
import { buildEvidenceRegistry } from "../../src/engine/v2/evidenceRegistry.js";
import {
  assessSoilV2,
  assessSalinityV2,
  assessEconomicsV2,
} from "../../src/engine/v2/soilAssessment.js";
import { assessHeatV2 } from "../../src/engine/v2/heatAssessment.js";

const evidence = buildEvidenceRegistry({
  observedData,
  sourceProvenance,
  sourceRegistry,
  location,
  scenario,
});
const soil = assessSoilV2({
  sequence,
  observedData,
  sourceProvenance,
  sourceRegistry,
  location,
});
const heat = assessHeatV2({
  observedData,
  sourceProvenance,
  sourceRegistry,
  location,
  scenario,
});
const economics = assessEconomicsV2();
```

A sequence entry supplies `cropId` (or is a crop-ID string); legacy catalog numeric traits are ignored. Checked Kew families can describe a wheat/maize sequence as Poaceae/Poaceae and request local pest-history review. They do not generate a numeric penalty, soil restoration or nutrient credit.

Context adapters must explicitly preserve units, for example `observedData.soilUnits = {nitrogen:'g/kg',soc:'g/kg',phh2o:'pH',clay:'%',sand:'%'}`. Celsius comes from climate source `units.tmax`, `units.T2M_MAX`, `quality.units.T2M_MAX`, or `observedData.climateUnits.tmax`; no guessing from numeric magnitude. Selected map coordinates must match traceable source coordinates/URL or observed-data point. Matching regional coverage is not field-scale measurement.

```js
// TEST-ONLY hypothetical software specimen, not a real observation.
const salinity = assessSalinityV2({
  cropId: "wheat",
  intendedUse: "grain",
  outcome: "grain yield",
  location: { lat: 29.2315, lon: 30.7952 },
  labEce: {
    value: 8,
    unit: "dS/m",
    method: "saturated_paste",
    samplingScope: "root_zone",
    sourceId: "test_lab",
    date: "2025-04-01",
    lat: 29.2315,
    lon: 30.7952,
  },
  sourceRegistry: {
    test_lab: {
      id: "test_lab",
      nature: "laboratory_measurement",
      availability: "available",
      reviewStatus: "recorded_input",
      title: "TEST ONLY hypothetical specimen",
      url: "test://specimen",
      validityScope: "Software fixture only",
    },
  },
});
// status: 'reference_screen', role: 'advisory_evidence'
// measuredEce.value: 8 dS/m; thresholdEce.value: 6 dS/m
// responseSlope.value: 7.1 %/(dS/m)
// relativeOutcomePercent.value: 85.8 % of reference outcome
// numericPenalty: null; this is not a field-yield prediction.
```

The same record with maize `grain`, faba `dry_seed` or Nili cowpea `cover` remains unsupported; missing lab data requires a lab test. Missing intended use/outcome is never inferred. A source ID alone cannot authenticate changed coefficients or taxonomy. Missing, synthetic, unlocated, malformed or contradictory samples remain unavailable. Laboratory provenance supplied by a caller is recorded, not independently authenticated.

The existing Fayoum historical fixture produces 58 >38°C observations over 153 valid May–September 2025 days. A three-observation sparse fixture reports one hot day, three valid days and 150 missing days. Neither yields crop damage or feasibility. Historical 2025 rows cannot be relabeled as 2026 evidence; malformed declared periods fail closed. ET₀ and NDVI registry descriptors report input presence separately and defer calculation readiness to dedicated validated model coverage checks.

## Verification

Executed in the isolated PR04 worktree on 2026-11-13:

- `node --test tests/unit/v2-evidence.test.js`: 14 tests passed.
- `npm run check`: 57 unit tests passed, production Vite build passed, repository checker passed (24 skeleton files, 186 local Markdown links).
- Final documentation/source formatting was applied; the full check above includes the completed delivery file.

The suite covers unavailable N/economics despite legacy scores, known and missing zero values, unsupported endpoints, nonlaboratory/synthetic ECe, physical bounds, explicit units, profile/source override injection, disabled Kew references, map-point/URL/region mismatches, malformed dates/scopes, source-period relabeling, duplicate dates, sparse climate coverage and no numeric penalties. Legacy regression snapshots pass in the same full suite. This PR changes pure engine modules and documentation, with no browser-flow changes; parent integration/release owns browser and live deployment checks.

These are software checks and source verification, not independent agronomic validation or FAO/CROPWAT water-model validation.

## Remaining limitations and release gates

- No independently authenticated laboratory workflow, field boundary identity, sample-depth history or local representativeness assessment.
- Exact point checks deliberately reject silently transferred evidence; this does not establish spatial resolution or validated regional extrapolation.
- No validated stage-specific heat, NDVI, wetness or general soil decision rule; no calibrated fertility, pest, profit or fixation model.
- FAO reference outcomes are conditional on source study conditions and matching crop use. Cultivar, soil interactions and Egyptian field-yield effects remain unvalidated.
- Missing unsupported source units must remain unavailable until an adapter supplies documented normalized units.
- V2 remains experimental. Default legacy recommendations must stay unchanged until the combined release gates and independent comparisons pass.

## Rollback

Leave `VITE_SCIENTIFIC_V2` unset/false to retain the legacy default. The new modules are side-effect free and do not mutate datasets. Reverting this PR and its integration imports restores the prior experimental evidence boundary without a data migration. Do not remove legacy code or promote V2 to the farmer default through this PR.

## Integrated verification

The PR0–4 stack passes 98 unit tests, production build and repository/link checks. Default browser suite passes 10/10; experimental browser suite passes 1/1. Nine frozen legacy outputs remain unchanged. Source-backed indicator screening is tested as screening, not field outcome validation.
