# Data plan and access audit

Selected for prototype integration by the user's blueprint on 2026-11-13. Access checks below ran from the managed development environment that day; they do not guarantee browser CORS support, latency, licensing or future uptime.

| Source | Purpose and native support | Access observed | Cleanup and limitation |
| --- | --- | --- | --- |
| [NASA POWER daily](https://power.larc.nasa.gov/api/temporal/daily/point) | 2025 Tmax/Tmin, rain, EVPTRNS, root/top wetness; regional ~50 km climate grid | HTTP 200 for Fayoum; metadata API v2.10.3, MERRA2/POWER. Unmocked browser also retrieved it: 58 May–Sep hot days / 153 valid observations | Remove <=-900/null/nonfinite. T °C; rain mm/day; EVPTRNS MJ/m²/day; wetness unitless. Historical regional signal, not field sensor or forecast. |
| [PixelGust](https://api.pixelgust.com/v1/soil) | Proposed normalized SoilGrids primary | Proxy tunnel HTTP 403; response schema could not be independently audited | Require explicit normalized units; unknown schema falls through to raw ISRIC. No claim of successful primary integration against a real response. |
| [ISRIC SoilGrids](https://rest.isric.org/soilgrids/v2.0/properties/query) | 250 m modeled pedological properties, 0–5 and 5–15 cm means | Timed out at 15 seconds | Thickness-weight top 15 cm. Clay/sand/pH/SOC ÷10; N ÷100. Missing/null profile → cache or nearest region. No direct electrical conductivity. |
| [ORNL MOD13Q1](https://modis.ornl.gov/data/modis_webservice.html) | 250 m, 16-day NDVI, 2025 | Full-year request HTTP 400: exceeds ten-tile time support. Ten-composite batch timed out at 20 seconds | Split year in three requests, filter raw outside -2000..10000 and scale .0001. No QA-band cloud screening; inspect limitations. |
| [NASA GIBS](https://gibs.earthdata.nasa.gov/) | Historical Terra NDVI eight-day overlay and land surface temperature, 2025-07-12 | Both specified sample PNG tiles HTTP 200 | Attribution and historical date visible. Native zoom 9/7; resampling at field zoom adds no detail. Temperature is surface, not 2 m air. |
| [Esri World Imagery](https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer) | Visual location context | Ten image tiles loaded in the unmocked browser check; availability handled per tile | Dates vary; attribution retained. Not an analytical input or boundary survey. |

## Bundled data and provenance

[src/data/demoPresets.json](../../src/data/demoPresets.json) contains **synthetic** regional benchmarks constructed from the user's location/soil/heat examples, with illustrative complete daily/NDVI series. None is a downloaded source payload. `fixture: true`, provenance text and per-source UI labels make this explicit. Real responses replace sources independently; exact-centroid localStorage observations expire after seven days.

The nine-crop catalog preserves user-supplied parameters. The app does not label them as exact FAO constants or validated regional recommendations. Kc/stage, seasonal demand, heat/salinity limits and ordinal scores need agronomic review. Repeated Fabaceae and overlapping crop windows remain constraints.

`harmonizationMeta` describes centroid alignment of regional climate and 250 m vegetation/soil. This is not physical fusion or validated downscaling. Soil EC, subsurface drains, contracts and crop dates cannot be inferred reliably from these products.

Source attribution is retained. Official challenge eligibility and a full source licensing review remain open; no eligibility claim is made. Remote tiles are not stored in the offline shell. No keys, private data or bulk source downloads are committed.

## Refresh and reproduction

Run the app and use Refresh or select a map point. The service uses a shared 4.5-second deadline and `Promise.allSettled`; successful sources survive other timeouts. Soil primary/fallback share the same budget. A versioned coordinate cache is used before regional fixtures. See the exact URLs and transformation formulas in [IMPLEMENTATION_PLAN.md](../../IMPLEMENTATION_PLAN.md) and regression checks in [tests](../../tests/unit/data-and-engine.test.js).

## Audited acquisition update — 2026-11-13

The initial access findings above are superseded for the three benchmarks by the [completed acquisition report](../../data/processed/QUALITY_REPORT.md). All three have complete real POWER years and QA-screened MODIS. Official native SoilGrids WCS extraction succeeded at two centroids; the Delta profile was zero-filled and rejected. `src/data/observedBenchmarks.json` now takes precedence at exact benchmark coordinates; `demoPresets.json` remains synthetic test/emergency input. Live MODIS now requires matching pixel reliability, and incomplete POWER cannot override a validated snapshot. See [reproduction and attribution](../../data/processed/README.md).
