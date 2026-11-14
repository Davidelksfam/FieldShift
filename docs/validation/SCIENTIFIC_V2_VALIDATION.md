# Scientific V2 — software verification and scientific release assessment

Date: 2026-11-14. Preserved farmer baseline: main `3fcf71fa825f76e46aafab0d0e75cc121d4eb39e`. Scope: the PR0–6 stack; experimental Expert inspection only. This report distinguishes executed software checks, published numerical component checks and unresolved independent agronomic validation.

## Result

The implemented flow preserves missingness, checks explicit constraints before comparison, and selects a conditional minimum only among compatible feasible modeled ETc alternatives. The existing farmer demo remains on legacy. No unconditional scientific recommendation is released. Code review and passing tests cannot establish correctness for every possible field or input.

## Reproducible checks

```bash
npm ci
npm run check
npm run validate:water-reference
npx playwright install --with-deps chromium
npm run test:browser
npm run test:browser:v2
```

The experimental browser command builds its own `dist-v2/`; it does not enable V2 in the normal production build. Run the browser configurations sequentially. The default suite uses port 4173, the experimental suite 4174. CI runs both plus the published component comparison script.

| Executed check | Result | What it establishes |
| --- | --- | --- |
| Unit/integration suite | 116 passed | Implemented arithmetic, dates, constraints, provenance, missingness, adapter and recommendation regressions |
| Nine immutable legacy region × goal outputs | Identical SHA-256 results | Complete serialized baseline behavior retained with flag on/off |
| Default production browser suite | 10 passed | Map/input/three-card flow, custom requests, races/cancellation, input preservation, source fallback, Arabic/English mobile and offline shell |
| Flagged experimental browser suite | 4 passed | Explicit selection, Arabic RTL/mobile, Nili/goals, invalid inputs, numerical fixture, source failure, offline reload and custom-point weather isolation |
| Production build and repository/link checker | Passed | Buildability and local documentation structure |
| Published FAO component comparisons | 9 passed | Four published Kc anchors and five daily ETc multiplication answers within declared published precision |
| Existing independent pyet ET0 samples | Passed within unit suite | Previously implemented FAO-56 ET0 sample agreement; not ETc or irrigation validation |

Browser source success paths use known HTTP fixtures; failure paths abort remote requests. They establish wiring and fallback behavior, not uninterrupted availability of external providers. Offline means the first-party shell after a successful initial visit; uncached remote maps/data cannot appear offline.

## Agronomy-oriented decision review

The independent reviewer exercised the full public analysis API with explicitly artificial eight-day test calendars and archived exact-point Fayoum weather. These crop durations are deliberately software fixtures and must never become production calendars or example planting advice.

| Scenario | Observed behavior |
| --- | --- |
| Artificial wheat/maize vs wheat/sorghum complete plans | Crop-only reference ETc 55.84230537509318 vs 69.05607837321821 mm; wheat/maize is conditional model minimum |
| Difference from artificial wheat/maize baseline | 0 and -13.21377299812503 mm; negative means the alternative exceeds baseline requirement |
| Inconsistent maize harvest vs supplied stage duration | Hard exclusion; the single remaining supported option is not proclaimed best |
| Missing crop water, date, use, weather day or horizon confirmation | Unavailable quantity/null; never zero or fabricated date |
| Next winter starts within the declared water horizon | Unavailable aggregate; boundary-only crop water cannot be omitted |
| Wrong selected point, source period, endpoint, units or model identity | Not eligible for supported comparison |
| Multiple incompatible eligible comparison groups | No arbitrary overall winner |
| Nili off / explore / require | No cover / optional with-without exploration / no exposed option until full timeline and management checks pass |
| Soil or market goal | Transparent qualitative evidence or unavailable economics; no fabricated score winner |
| Source failure or custom field without exact-point ET0 drivers | Explicit unavailable scientific water; no borrowed centroid series |
| Caller supplies passed release gates | Ignored by orchestration; actual pending gates retained |

## Defects found and fixed during review

- Rejected unresolved calendar source IDs, borrowed citation URLs, wrong crop/use/region/date scope and generic references masquerading as farmer-entered dates or management checks.
- Preserved the following-winter timing boundary even without Nili; rejected boundary crops silently omitted inside the water horizon.
- Required complete exact-point historical drivers, actual dates and matching crop uses. Missing crop water cannot count as zero in a rotation sum.
- Kept derived operand provenance distinct from direct endpoint evidence without bypassing identity, availability or regional scope checks.
- Rejected incompatible horizons, units, weather points and methods; quantity method identity and actual weather lineage must agree with comparison labels.
- Removed arbitrary winners across incompatible groups and suppressed a winner when only one supported option remains.
- Preserved the baseline reference when it falls outside the three displayed alternatives.
- Made contradictory explicit units unavailable, rather than accepting whichever declaration happened to take precedence.
- Retained exact raw used drivers, observations, sources, dates and constraints in the replay audit. Invalid JSON removes the stale result.
- Required every named release gate before an unconditional proposal; excluded/infeasible/nonexistent plans cannot be selected.

## Scientific coverage and outstanding gates

| Gate | Evidence now | Remaining requirement |
| --- | --- | --- |
| Calendar evidence | Three partially verified FAO bread-wheat regional windows; all unknown stage/buffer/cultivar fields stay null | Reviewed local cultivar/use calendars and complete summer → Nili → winter dates, field clearance and management evidence |
| Independent water comparison | Published Kc/daily ETc components and prior ET0 pyet checks | Independent complete-season ETc comparison against a compatible FAO example or CROPWAT setup, with declared inputs/tolerances |
| Indicator audit | Checked botanical identity, qualitative family facts and outcome-specific laboratory-only ECe handling | Independent review of relevance and any future locally calibrated decision thresholds |
| Product validation | Executed software/browser matrix above | Broader field/user scenarios and review of release scope; tests do not make unresolved science valid |
| Agronomic review | Agronomy-oriented software logic review | Independent qualified local agronomic review and appropriate field evidence |

No soil-water balance, effective-rain model, net/gross irrigation schedule, measured consumption, calibrated nitrogen balance, profit estimate or validated water savings is implemented. The guarded external net-to-gross converter is scenario arithmetic, not an irrigation model. Heat exposure, NDVI, wetness and predicted SoilGrids values remain advisory. Laboratory ECe must match point, sample scope, date, crop use and outcome; screening cannot substitute for laboratory evidence.

The map/data service supports requests at custom Egyptian coordinates. This does **not** establish complete V2 agronomic coverage there. Custom-point ET0 driver acquisition is not implemented by this stack; incomplete/unsupported locations return unknown/unavailable. The production registry has no complete field-validated rotation calendar. Historical 2025 weather is not a forecast, and no archived year is relabeled.

## Audit and references

See [calendar audit](../data/CROP_CALENDAR_AUDIT.md), [water audit](../data/V2_WATER_MODEL_AUDIT.md), [indicator audit](../data/INDICATOR_DECISION_AUDIT.md), [original crop audit](../data/CROP_SCIENCE_AUDIT.md) and [contracts](../engineering/SCIENTIFIC_V2_CONTRACTS.md). Each analysis retains inputAudit, sourceRegistry, candidate/exclusion reports, per-crop daily ET0/Kc/ETc, comparison basis, baseline arithmetic and actual release gates. References are checked within their documented scopes; metadata guards do not authenticate arbitrary caller citations.

## Release and rollback

Keep V2 experimental. `VITE_SCIENTIFIC_V2` is absent/false in the normal build. An experimental build exposes inspection in Expert Mode and leaves farmer results on legacy. Disable the flag and rebuild to remove inspection; no database, source dataset or cache migration is required. These stacked PRs do not merge or deploy themselves.
