# Download and access status

Checked: 13 November 2026 (Africa/Cairo). Research only; no production pilot or scientific recommendation is approved.

Three sources have actual bounded science downloads. Four have verified matching catalog records but science downloads are blocked by missing Earthdata Login credentials. Do not interpret catalog discovery as downloaded measurements.

| Source | Actual status | Science bytes | Provenance |
| --- | --- | --- | --- |
| [NASA POWER](sources/power/README.md) | Science subset downloaded and inspected | 1,981 | [Access record](../../data/manifests/research-runs/20261113T120557479254Z/power.json) |
| [GPM IMERG](sources/imerg/README.md) | Catalog downloaded; science HTTP 401 / authentication required | 0 | [Access record](../../data/manifests/research-runs/20261113T120557479254Z/imerg.json) |
| [SMAP Enhanced L3](sources/smap/README.md) | Catalog downloaded; science HTTP 401 / authentication required | 0 | [Access record](../../data/manifests/research-runs/20261113T120557479254Z/smap.json) |
| [HLS L30](sources/hls/README.md) | Catalog downloaded; science HTTP 401 / authentication required | 0 | [Access record](../../data/manifests/research-runs/20261113T120557479254Z/hls.json) |
| [MODIS MOD13Q1](sources/modis_mod13q1/README.md) | Science subset downloaded and inspected | 2,275 | [Access record](../../data/manifests/research-runs/20261113T120557479254Z/modis_mod13q1.json) |
| [ECOSTRESS L2T LSTE](sources/ecostress/README.md) | Catalog downloaded; science HTTP 401 / authentication required | 0 | [Access record](../../data/manifests/research-runs/20261113T120557479254Z/ecostress.json) |
| [SoilGrids](sources/soilgrids/README.md) | Science subset downloaded and inspected | 1,085 | [Access record](../../data/manifests/research-runs/20261113T120557479254Z/soilgrids.json) |

## What the samples contain

- POWER: eight daily weather parameters for 1–7 January 2025; actual UTC response, units and fill code checked.
- MOD13Q1: one native composite beginning 1 January 2025, a 1×1 pixel subset including all returned bands/QA. Scaled inspection values are not QA-filtered decision features; the composite extends beyond the seven-day weather window.
- SoilGrids: small pH mean-prediction GeoTIFF for 0–5 cm, 250 m output spacing, with a point inspection value. This is not a complete soil profile or field test.

Public exploratory point: longitude **31.15**, latitude **29.9**. It is not a confirmed farm. The user was asked for the actual pilot/location/date range; absent that selection, these are deliberately tiny access tests.

## Small derived excerpts available in Git

- [POWER inspection JSON](../../web/public/data/research-samples/20261113T120557479254Z/power.json)
- [MOD13Q1 inspection JSON](../../web/public/data/research-samples/20261113T120557479254Z/modis_mod13q1.json)
- [SoilGrids inspection JSON](../../web/public/data/research-samples/20261113T120557479254Z/soilgrids.json)

These contain normalized research excerpts and source hashes, not raw provider files or accepted SeasonalFeatures. They have `qualityStatus=not_validated_for_decisions`. Raw downloads remain under ignored `data/raw/`, with retrieval URLs and SHA-256 in the committed records.

## Service failures and reproducibility

SoilGrids WCS succeeded in run `20261113T120557479254Z`. A later attempt in run `20261113T121323753539Z` returned HTTP 503; [that failure record](../../data/manifests/research-runs/20261113T121323753539Z/soilgrids.json) is retained. The earlier validated raster is preserved and is not presented as a fresh successful acquisition. The corrected runner snaps future WCS requests to the native 250 m grid; the first successful raster retains its exact returned transform in the inspection sample. SoilGrids REST was also unavailable during probing; use WCS with explicit status checking rather than assuming REST works.

The four Earthdata sources have no science values in this repository. Their manifests include exact matching product/granule identifiers and selected science URLs; no token or secret was configured. The protected download path is documented but untested with valid credentials.

The runner records per-source results and does not automatically retry away a failure. A run can complete while some sources remain blocked. Use `--require-all-science` if your calling workflow must reject partial acquisition.

## Checks performed

- Repository documentation/link/placeholder check (final result recorded in the PR).
- Thirteen offline acquisition tests: fill versus zero, unit mismatch, date bounds, grid length, QA preservation, science-link selection, login HTML rejection, byte limit, credential redirects and exception-text redaction.
- Nine Draft 2020-12 schemas checked; example config and committed access records validated; actual POWER/MODIS native JSON responses and eight CMR catalog responses validated.
- Original downloaded artifacts checked against recorded byte counts and SHA-256; SoilGrids TIFF opened with CRS/transform/nodata inspection.

No crop model, local agronomic validation, NASA-resource eligibility decision, application build or deployment was performed. Next requirements: the true pilot/date window, secure Earthdata credentials, and reviewer approval before these inputs become model/UI features.

Reproduction and connection instructions: [main guide](DATASET_ACCESS_GUIDE.md).
