# Crop calendar registry audit — Scientific V2 PR 1

## Evidence boundary

The production registry has 27 crop/use/region records (nine catalog crops × three benchmark region scenarios). Only **three bread-wheat records have partially checked reference windows**. There is no fully verified cultivar calendar. All four-stage durations and preparation buffers remain null. A source's total growing-period range must never be divided into invented Kc-stage lengths.

Evidence was inspected on **2026-11-14**. FAO source records report last update **26 February 2021**. This is a source-record update date, not proof of publication year, current cultivar applicability or local validation; `sourceYear` remains null. The unmodified legacy catalog and historical datasets remain separate.

## Official source discovery and coverage

The public [FAO Crop Calendar application](https://cropcalendar.apps.fao.org/?language=en&pagename=%2Fwelcome.do) loaded successfully. Its application bundle identifies `https://api-cropcalendar.apps.fao.org/api/v1/` as its backend. Read-only API responses were inspected directly:

| Endpoint | Observed coverage | Response SHA-256 |
| --- | --- | --- |
| [Countries](https://api-cropcalendar.apps.fao.org/api/v1/countries?language=en) | 58 countries; Egypt ID `EG` present | `daef4be3c25d62b22a7c03c4434afc59806aace2ecb31a0e676500cfb835b0ab` |
| [Egypt crops](https://api-cropcalendar.apps.fao.org/api/v1/countries/EG/crops?language=en) | 96 crop records, including bread wheat `0373` | `e4f480d62f65d919cc7dca7daf84aad8861c9c2fb6a716ca37727183663ad101` |
| [Egypt agroecological zones](https://api-cropcalendar.apps.fao.org/api/v1/countries/EG/aez?language=en) | 12 named zones with administrative and cultivation descriptions | `d981cd3da8c42b31ec091f43ec2a46125de65da5fc8496e6fd49bd00416f6feb` |
| [Egypt calendar records](https://api-cropcalendar.apps.fao.org/api/v1/countries/EG/cropCalendar?language=en) | 573 crop/zone records | `1f092ca3c5b3abcc8d43957b57e2faa265b62fa273721a5a352c5b497fecda9c` |

The [filtered Delta bread-wheat query](https://api-cropcalendar.apps.fao.org/api/v1/countries/EG/cropCalendar?language=en&crop=0373&aez=001) returned exactly one matching record. SHA-256: `bb0939c94e7e6e36965f1446de609b1a07a7f6554864d2b09f8d472c9b616fae`. Registry source entries include exact query IDs, URLs and minimal unmodified date/period excerpts. Bulky raw API responses and application code are not committed.

## Accepted partial mapping

| FieldShift scenario | Explicit FAO AEZ scope | Accepted reference fields |
| --- | --- | --- |
| `fayoum_etsa` | `007`, Middle Egypt Region; administrative list explicitly includes Fayoum | Bread wheat sowing Nov 15–30; harvest Apr 25–May 25; total growing period 150–190 days |
| `delta_kafr_el_sheikh` | `001`, Delta region; administrative list explicitly includes Kafer Elshiekh | Same values reported in the corresponding source row |
| `west_delta_nubariya` | `003`, near by Delta region new reclaimed soils `NDRNRL`; administrative list explicitly includes Nubaria | Same values reported in the corresponding source row; only the declared new-reclaimed-land scenario |

FAO's crop `0373` is bread wheat; the Egypt crop identity lists *Triticum aestivum* L. subsp. *aestivum*. Mapping to the catalog wheat/grain scenario is a bread-wheat reference identity, **not** a forage, cultivar-specific or field-validated calendar. The source does not supply four stage lengths, a preparation buffer or cultivar identity. Therefore these records are `partially_verified`, and even a matching entered 2024–2025 planting/harvest pair remains `unknown` for full calendar feasibility.

These are named broad AEZs, not field polygons or coordinate downscaling. The registry binds only the three declared benchmark scenarios. Arbitrary locations do not inherit a nearby benchmark calendar. Annual sowing/harvest windows are separate month/day constraints; actual dated scenarios must establish continuous year ordering.

## Deferred or rejected promotion

- The remaining eight crop/use records in each region remain null/unverified. Their possible FAO entries were not promoted into complete local profiles. Source availability elsewhere must not be confused with this registry's verified coverage.
- FAO responses contain inconsistencies in some `other_name` and parent-taxonomy fields; for example a broad-bean parent record carries *Panicum miliaceum*. These parent/alias fields were not used to map crop uses or infer dates. Only the explicitly checked bread-wheat identity/zone/session was accepted.
- A `growing_period` total of 150–190 days does **not** establish initial/development/mid/late stage lengths. Those fields remain null.
- Ordinary cowpea green-pod/dry-seed/intercrop sessions do not validate the catalog's Nili short-cover use. No short-cover dates, maturity, termination buffer or fixation claim were inferred.
- Berseem hay cutting cycles and terminal field clearance are not established by a generic harvest window.
- The [Egypt Agricultural Research Center homepage](https://www.arc.sci.eg/) returned HTTP 403 from this workspace. No ARC bulletin or numerical calendar value was retrieved or claimed.
- Legacy `months` and prose risk notes are prototype assumptions, not sourced calendar inputs.

## Calendar engine policy

`evaluateRotationCalendar` in [calendarEngine.js](../../src/engine/v2/calendarEngine.js) accepts ordered actual date entries and exact calendar references. `regionId`, `intendedUse` and `scenarioYear` must be explicit. It returns feasible/infeasible/unknown, bilingual reasons, missing fields, source IDs and a timeline with units, field lineage and validity scope.

A source-backed outside-window or actual overlap is a violation of the declared scenario constraints, not proof that cultivation is biologically impossible in every field. Missing sources/dates/scope stay unknown. Caller-entered dates/stages/buffers require `farmer_scenario` / `recorded_input` provenance; a generic checked botanical or coefficient reference cannot authenticate them. Available source periods must cover the supplied actual dates. Declared primary cycles wholly outside `scenarioYear` are unknown; a genuine winter crossing December/January is valid date arithmetic.

Crops occupy sowing through harvest/termination dates **inclusively**. Preparation buffers are full clear days after the final declared harvest/termination. Earliest next sowing is end + buffer + one day. A source-backed zero buffer means the next calendar day; same-day harvest/sowing cannot be approved at this daily resolution. No default zero buffer is supplied. A Nili case needs its actual preceding summer and a following winter entry with `role: next_winter`; the latter checks the next sowing boundary, without inventing a future harvest cycle.

Nili water/pest checks require explicit matching scenario/reference management evidence, `managementChecks` declarations on sources and a period covering the Nili interval. Climate, SoilGrids, NDVI or Kc sources cannot substitute for a local pest or water-availability check.

No temporal computation fetches data, mutates input, consults the current clock or changes legacy outputs. Scientific release remains blocked: none of the production records establishes a complete local cultivar calendar.

## Cultivation-context qualifier

FAO AEZ 001/007 describe “Clay to salty clay soils (Nile transmitted)” and furrow irrigation from Nile-connected channels. AEZ 003 is explicitly “near by Delta region new reclaimed soils” and describes sandy soils with drip, pivot or sprinkler groundwater irrigation. Partial records require declared `cultivationContext.landType`: existing `old_clay` scenario for 001/007 and reclaimed `new_sandy` scenario for 003. These legacy labels select a scenario context; they do not establish measured soil texture or actual irrigation infrastructure. Missing or mismatching context is unknown and reference sowing/harvest windows are not used for hard exclusion.
