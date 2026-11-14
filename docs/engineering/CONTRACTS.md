# Application integration contract v1

Producer: [nasaDataService.js](../../src/services/nasaDataService.js). Consumers: [engine](../../src/engine/rotationEngine.js), diagnostics and evidence components. All timestamps are ISO strings. Coordinates are WGS84 decimal degrees inside Egypt's bounding box (22–32.5 N, 24–37 E), not a verified national polygon.

| Field | Shape / unit | Missing and error policy |
| --- | --- | --- |
| lat, lon | finite numbers | reject invalid/out-of-range input |
| soil | clay/sand %, phh2o pH, soc/nitrogen g/kg | require complete normalized profile; cached or regional fallback |
| climateDaily | array: date, tmax/tmin °C, precipitation mm/day, evapotranspiration MJ/m²/day, rootWetness/topWetness unitless | null daily values stay null; only valid values aggregate |
| summerMaxTemps | valid May–Sep °C array | invalid samples removed; observation count displayed |
| avgRootWetness | valid daily mean or null | valid zero preserved |
| ndviSeries | date + scaled NDVI -0.2..1 | fill/out-of-range pixels removed; source-level fallback if unavailable |
| sources | climate/soil/ndvi objects | provider, kind observed/synthetic, status live/cached/demo, timestamps/URL for retrieved sources, region/reason for fixtures |
| harmonizationMeta | centroid, resolutions, period, method | spatial alignment only, no downscaling claim |

`getInitialFarmData` synchronously returns cache or a labeled benchmark. `fetchUnifiedFarmData(lat, lon, presetId?, {signal?, timeoutMs?, onSourceUpdate?, onDataUpdate?, attemptTimeoutMs?, retryDelayMs?, maxAttempts?})` automatically refreshes within 20,000 ms by default. Transient request failures retry up to three times including the first attempt, with exponential backoff and Retry-After handling. First attempts allow 4,500 ms; later attempts can use the remaining overall budget. The primary soil provider allows at most 2,500 ms before trying ISRIC. Its point API gets one bounded attempt so a slow/invalid response leaves time for the native WCS fallback described below. Successful source results are cached and delivered immediately through `onDataUpdate` as independent snapshots; progress can be fulfilled, retrying or rejected. Cancellation rejects promptly with AbortError and retains already published successes. Provider failures return source-level fallback rather than throwing. Cached observations remain labeled cached when refresh fails; synthetic values remain synthetic.

### Native SoilGrids fallback

[soilGridsWcs.js](../../src/services/soilGridsWcs.js) requests ten tiny native GeoTIFF cells: five properties at 0–5 and 5–15 cm, mean only. Its Egypt-only Interrupted Goode Homolosine transform reproduces the independently acquired benchmark grid bounds. Each image must have the expected CRS, one sample, 1×1 dimensions and the exact containing 250 m cell bounds; no reprojection, neighboring-cell substitution or spatial interpolation is performed. GeoTIFF parsing is loaded on demand. The existing 1:2 thickness weighting, property scaling and complete-profile physical validation apply. WCS provenance retains all ten URLs, native bounds and model-prediction nature in the source/cache. Binary response bodies share the request timeout/cancellation policy, with up to two WCS transport attempts within the overall deadline.

NoData/fill or entirely zero-filled profiles produce `sources.soil.failureCode: SOIL_NO_COVERAGE`. Other failures use `SOURCE_UNAVAILABLE`. Synthetic fallbacks remain excluded from supported comparisons. The soil card distinguishes missing native coverage from retrieval failure in Arabic and English; a cached/audited valid profile remains usable when refresh fails.

The farmer comparison requires observed climate support (live, cache or exact-point snapshot) because heat influences crop ranking. Soil and NDVI are optional evidence, not prerequisites for crop-water/ordinal-N calculations. `comparisonSourceSupport` exposes `blocked` for missing climate alongside all `missing` sources. `prepareComparisonData(data, allowIllustrative)` omits unsupported optional inputs unless illustrative use is explicitly selected: null soil fields, empty NDVI/history, and `usedInComparison: false` on their preserved source metadata. The original acquisition/cache object is not mutated. Omitted pH cannot produce a pH warning; omitted vegetation has null bare-soil quantities rather than fabricated zero-risk evidence. Laboratory ECe remains a separate farmer input.

Farmer inputs: landType, feddans, qirats, irrigationType, salinityLevel, currentWinterId, currentSummerId, hasLivestock and weights.water/soil/market. Qirats are 0–23 whole units; area must be positive. Weights are relative; all-zero means 50/30/20 defaults.

Engine output: diagnostics; strategies with IDs baseline/water/soil, crop records, grossWaterM3Feddan, totalFarmWaterM3, signed waterSavedPercent, N index, water/soil/return subscores, finalSuitability, explicit rank, penalties, warning translations and verification checklists; rankedStrategyIds and effectiveWeights. Stable card order preserves comparison alignment while rank labels update. Numerical formulas and limits are in the blueprint.

## Audited dataset amendment

Source status `snapshot` means a versioned bundled historical download with acquisition provenance. It applies only to an exact benchmark centroid, before synthetic fallback. `kind: observed` distinguishes retrieved source values from synthetic data; `dataNature` clarifies reanalysis, satellite index or modeled soil prediction. It does not mean in-field measurement. NDVI dates rejected by matching pixel reliability are retained with `ndvi: null`; the engine reports autumnObservedDays/autumnMissingDays. See [data quality report](../../data/processed/QUALITY_REPORT.md). Cache namespace/schema v2 invalidates old unscreened cache entries.

Snapshot fallback is applied independently per source: a usable cached climate or vegetation source cannot suppress an audited soil profile when cached soil is synthetic. Valid cached observations retain precedence. An absent audited soil profile (the Delta preset) remains absent, and nearby coordinates cannot borrow the benchmark profile. A failed refresh persists any restored audited source for subsequent reloads.

## Post-processing amendment — issue #16

The engine now delegates six diagnostics to `computeFieldIndices`, searches 16/32 catalog candidates (depending on cover requirement), selects distinct objective-specific alternatives and re-scores all cards with common farmer weights. `candidateAudit` exposes generation, hard rejections, objective weights and rankings. Strategy output adds `sequenceKey`, `objectiveSuitability`, `objectiveWeights`, absolute modeled water savings and bilingual `explanation` (evidence, data-support category/reasons, checklist).

`referenceEtDrivers` and `ndviHistory` attach only at exact acquired centroids. ET₀ is modeled from additional FAO-56 weather drivers; seasonal EVPTRNS energy sums remain separate. Longest BSW replaces the previous total as the cover trigger; total, individual intervals and unknown coverage remain available. Soil-adjusted N is explicitly null without calibration. See [complete formulas, limits and provenance](POSTPROCESSING.md). `forceNiliCover` is a farmer scenario toggle. `pitchCounterfactual` is a separate hypothetical summer switch, not an automatically selected recommendation.

## Crop evidence and measured soil ECe amendment

Optional `soilEceDsm` in farmer inputs denotes a user-provided **laboratory saturated-paste soil electrical conductivity** in dS/m (0–100), never the calculated screening index. Blank/null => no numeric FAO salinity penalty. Invalid values stop evaluation. Only outcome-compatible numeric FAO ECe reference records permit an explicit *prototype* 15-point threshold penalty. The preserved `salinityRisk` 0–100 index is screening-only; FAO ECe and model risk scores must not be substituted. `waterModelStatus: prototype_uncalibrated` on strategies warns that current gross-water comparisons do not use the new FAO-stage ETc reference calculator. Read [the full scientific reference audit](../data/CROP_SCIENCE_AUDIT.md).
