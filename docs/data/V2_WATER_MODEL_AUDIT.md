# V2 water-model evidence and calculation audit

## Scope

`src/engine/v2/waterModel.js` is a pure, deterministic **historical reference ETc** module. It does not change the legacy engine, any original crop data, `dailyReferenceEt`, source acquisition or the working farmer demo. A supported numerical result is computationally available, not field-validated.

The module reads the existing checked FAO crop-reference registry rather than legacy `baseWaterMm`, `kc`, irrigation-method constants, N points, market points or suitability scores. Runtime coefficient overrides cannot borrow a checked FAO source ID; conflicting pinned-reference metadata is rejected.

## Accepted sources and exact claims

| Evidence | Source | Accepted use | Not established |
| --- | --- | --- | --- |
| Reference ET₀ | Existing [reference ET module](../../src/engine/referenceEt.js), [driver manifest](../../data/manifests/reference-et.json), [pyet comparison](../../data/processed/reference-et-validation.json) | Reuse identical 2025 FAO-56 daily short-grass Penman–Monteith calculation | Egypt-specific crop ETc, irrigation or field accuracy |
| Crop coefficients | [FAO-56 Chapter 6, Table 12](https://www.fao.org/4/x0490e/x0490e0b.htm), preserved [registry](../../src/data/cropEvidence.json) | Published standard-condition, exact crop-use reference coefficients; recorded scalar choices within ranges remain assumptions | Local wetting/climate adjustment, cultivars or verified calendars |
| Daily stage curve | [FAO-56 Chapter 6, equation 66 / Example 28](https://www.fao.org/4/x0490e/x0490e0b.htm#numerical%20determination%20of%20kc) | Linear development/late-season interpolation with supplied stage lengths | Actual Egyptian stage lengths |
| ETc equation | [FAO-56 Chapter 5, equation 56](https://www.fao.org/4/x0490e/x0490e0a.htm) | `ETc(day) = ET₀(day) × Kc(day)` under stated standard non-stressed conditions | Net irrigation, gross withdrawal or measured water use |
| Numerical ETcrop products | [FAO Irrigation Water Management Training Manual 3, §3.3.2, Step 4](https://www.fao.org/4/s2022e/s2022e07.htm#3.3.2%20crop%20water%20need%20calculation%20example) | Independent published multiplication component checks | A full daily-season/CROPWAT comparison: that manual example uses rounded monthly Kc and artificial 30-day months |
| Net-to-gross units | [User-approved plan, PR 3](../engineering/FieldShift_Scientific_V2_Implementation_Plan.md) | Explicit externally supplied net estimate ÷ explicit supported/scenario application efficiency; multiply mm by 4.2 m³/feddan/mm | A validated soil-water balance, universal efficiency, measured plot size or measured savings |

The two FAO numerical pages were retrieved directly on 2026-11-14. Small, attributed numeric fixtures are in [the published checks](../../tests/fixtures/v2-water/fao-published-checks.json); raw downloaded HTML is not committed.

## Input boundary

`calculateWaterV2` requires an explicit historical 2025 scenario and comparison horizon; exact latitude/longitude matching the weather drivers and source coordinates; a real ISO sowing date; four positive stage lengths in days; supported crop use; checked Kc references; and an available recorded/reference calendar source. Calendar dates/stages may be a recorded farmer **scenario**; the output discloses that they are not a verified Egyptian crop calendar. Neither the module nor its tests supply default agricultural dates or stage durations.

Canonical uses are wheat `grain`, faba bean `dry_seed`, sugar beet `storage_root`, maize `grain`, sorghum `grain`, soybean `seed`, sesame `seed`. Berseem is unavailable until cutting-cycle support exists. The generic cowpea profile cannot be applied to short Nili `cover`. The exact-use map is a reference interpretation, not a statement that any crop is suitable for any Egyptian field.

`adaptArchivedWeatherDrivers(drivers, sourceId)` returns a cloned driver input and source metadata with the archive's actual units and point. It checks the coordinates declared in the original NASA POWER URL; changing an archive's lat/lon cannot make another point's weather eligible. Source IDs remain explicit; no nearby-pixel borrowing occurs.

Required native units: Tmax/Tmin `C`, RH `%`, 2 m wind `m/s`, solar radiation `MJ/m^2/day`, pressure `kPa`. The module does not treat EVPTRNS energy flux as reference ET. Any missing/unsupported unit makes ETc unavailable.

## Calendar and daily completeness

Dates use UTC day arithmetic. The sum of explicit stage lengths defines a continuous inclusive crop window. Each actual day must occur exactly once and contain valid FAO-56 drivers. Incomplete weather, invalid/duplicate dates, invalid model inputs or mismatched source scope return `status: unavailable`, with null physical quantities, machine-readable reasons, missing-input identifiers and bilingual explanation. No gap interpolation, zero-filling or neighboring weather substitution occurs.

The unchanged ET₀ function supports only 2025. A 2024/2026/leap-year request is therefore **unavailable**, rather than generalized without evidence. A winter crossing December/January also remains unavailable without the other year's drivers/model support. Full 365-day coverage is not required for a short crop **if every actual crop-window day is present**; annual sums are never substituted for crop-window sums.

FAO equation 66 is one-based: initial/mid Kc remain constant, development approaches mid Kc linearly, and late approaches end Kc linearly. Returned daily modeled ET₀/Kc/ETc values share `dailyMetadata` with units, source IDs, method, crop/use/point/date validity and assumptions. Each row points to the exact weather date and common coefficient/calendar inputs. They are not presented as measured irrigation.

## Output, comparisons and irrigation

- `etcMm` is a guarded `ScientificQuantity` with status/value/unit/provenance/validity/assumptions/reasons.
- `netIrrigationMm`, `grossIrrigationMm`, `m3PerFeddan` remain null/unavailable in `calculateWaterV2`. No effective rain or soil storage/depletion/rooting model has been invented.
- `comparisonBasis` names quantity (`etc_reference`), unit, entire declared planning horizon, exact covered crop period, native point/weather source, method, grass reference and non-stressed/wetting assumptions. `completeWindow: true` does **not** assert an entire rotation: `completePlannedHorizon: false` identifies a single crop. The caller must account for every crop, including Nili, over a common horizon before comparing rotation totals.
- `convertNetToGrossV2` is separate and never accepts an ETc quantity as net irrigation. It requires a supported net quantity with outcome `net_irrigation`, matching complete period, explicit efficiency fraction in `(0,1]`, supported source lineage and matching known region/crop/use/point scope. A dated efficiency must cover the horizon. An undated efficiency is accepted only as a disclosed farmer scenario. Its result is labeled `conditional_external_scenario`, with cloned operand audit; this module does not verify the external net balance.
- No quantitative result is clipped to an attractive range. No water score, saved-water probability, net/gross demand inferred from ETc, irrigation schedule or scientifically optimal rotation is produced.

Derived conversion metadata marks `inputSourceIds` separately from the direct dimensional method reference. Operand source-use/outcome checks must remain strict; parent PR 3 integration adds the narrow shared-contract support for this lineage distinction. It does not relax salinity-reference endpoint matching.

## Independent numerical checks and release boundary

Tolerances were recorded in the fixture before evaluating the implementation:

1. FAO-56 Example 28: source stages `[25,25,30,20]`, Kc `[0.15,1.19,0.35]`, published Kc at days 20/40/70/95 of 0.15/0.77/1.19/0.56. Absolute tolerance 0.005 allows source rounding to two decimal places (unrounded day 40 is 0.774). These are the Idaho dry-bean worked example, not an Egypt calendar.
2. FAO training manual Step 4: five published ETcrop daily products for tomato. Absolute tolerance 0.050000001 mm/day allows source rounding to one decimal plus binary arithmetic. The manual's 786 mm seasonal result is explicitly **not comparable** with the implemented actual-date, linearly varying daily Kc calculation. It must not be used as a false seasonal validation pass.

`node scripts/validation/verify-v2-water-reference.mjs` reports all component checks. Existing archived ET₀/pyet agreement is preserved. Full-season ETc agreement with matched worked inputs or CROPWAT is **not independently established**. Net/gross irrigation schedules are **not implemented or independently validated**. Those release gates remain pending and prevent claims of FAO-calibrated savings or field accuracy.
