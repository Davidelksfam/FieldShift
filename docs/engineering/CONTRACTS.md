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

`getInitialFarmData` synchronously returns cache or a labeled benchmark. `fetchUnifiedFarmData(lat, lon, presetId?, {signal?, timeoutMs?})` refreshes within 4,500 ms by default. Cancellation rejects with AbortError. Provider failures return source-level fallback rather than throwing. Cached observations remain labeled cached when refresh fails; synthetic values remain synthetic.

Farmer inputs: landType, feddans, qirats, irrigationType, canalPosition, salinityLevel, currentWinterId, currentSummerId, hasLivestock and weights.water/soil/market. Qirats are 0–23 whole units; area must be positive. Weights are relative; all-zero means 50/30/20 defaults.

Engine output: diagnostics; strategies with IDs baseline/water/soil, crop records, grossWaterM3Feddan, totalFarmWaterM3, signed waterSavedPercent, N index, water/soil/return subscores, finalSuitability, explicit rank, penalties, warning translations and verification checklists; rankedStrategyIds and effectiveWeights. Stable card order preserves comparison alignment while rank labels update. Numerical formulas and limits are in the blueprint.

## Audited dataset amendment

Source status `snapshot` means a versioned bundled historical download with acquisition provenance. It applies only to an exact benchmark centroid, before synthetic fallback. `kind: observed` distinguishes retrieved source values from synthetic data; `dataNature` clarifies reanalysis, satellite index or modeled soil prediction. It does not mean in-field measurement. NDVI dates rejected by matching pixel reliability are retained with `ndvi: null`; the engine reports autumnObservedDays/autumnMissingDays. See [data quality report](../../data/processed/QUALITY_REPORT.md). Cache namespace/schema v2 invalidates old unscreened cache entries.
