# Download and project-input readiness

Checked: 13 November 2026 (Africa/Cairo). **All seven sources have successful science downloads.** Original bytes are local and ignored; compact attributable extracts and manifests are committed. Earlier 401/503 and credential-redirect failures remain recorded rather than erased.

| Source | Science bytes in selected acquisition | Manifest | Inspection sample |
| --- | --- | --- | --- |
| ecostress | 733,016 | [Provenance](../../data/manifests/research-runs/20261113T122709746832Z/ecostress.json) | [JSON extract](../../web/public/data/research-samples/20261113T122709746832Z/ecostress.json) |
| hls | 23,306,000 | [Provenance](../../data/manifests/research-runs/20261113T122824330687Z/hls.json) | [JSON extract](../../web/public/data/research-samples/20261113T122824330687Z/hls.json) |
| imerg | 28,051,281 | [Provenance](../../data/manifests/research-runs/20261113T122709746832Z/imerg.json) | [JSON extract](../../web/public/data/research-samples/20261113T122709746832Z/imerg.json) |
| modis_mod13q1 | 2,275 | [Provenance](../../data/manifests/research-runs/20261113T120557479254Z/modis_mod13q1.json) | [JSON extract](../../web/public/data/research-samples/20261113T120557479254Z/modis_mod13q1.json) |
| power | 1,981 | [Provenance](../../data/manifests/research-runs/20261113T120557479254Z/power.json) | [JSON extract](../../web/public/data/research-samples/20261113T120557479254Z/power.json) |
| smap | 664,237,103 | [Provenance](../../data/manifests/research-runs/20261113T122709746832Z/smap.json) | [JSON extract](../../web/public/data/research-samples/20261113T122709746832Z/smap.json) |
| soilgrids | 1,085 | [Provenance](../../data/manifests/research-runs/20261113T120557479254Z/soilgrids.json) | [JSON extract](../../web/public/data/research-samples/20261113T120557479254Z/soilgrids.json) |

## Important remaining data requirements

- These are bounded access tests for 31.15 E, 29.9 N and an illustrative January 2025 window. POWER has seven days; protected sources intentionally retrieve one selected granule/scene. They are not a full growing-season training/feature dataset.
- SMAP: neither selected pass has a retrieval centroid within the conservative 15 km research match radius. Inspection returns null instead of importing a distant cell. Choose valid local dates or retain the layer as unavailable.
- ECOSTRESS: the selected scene has nodata LST at the point. Scene metadata overlap does not guarantee a valid point observation. Inspect later matching overpasses before computing thermal features.
- HLS: sampled Fmask=192 indicates high aerosol (upper QA bits). Raw reflectance is retained, but no QA-approved NDVI is claimed.
- MODIS retains unfiltered QA; SoilGrids is only predicted pH at 0–5 cm, not a complete soil profile. IMERG uses time/lon/lat dimensions and mm/day; its daily count is retained.

## Reproduce authenticated downloads

Configure EARTHDATA_TOKEN through your local secret manager or execution-environment secret settings. No credential is stored in Git, a guide, a manifest, or this sample index. Future sessions need the same secure configuration; an interactive token supplied for this task does not create a persistent environment secret.

```sh
.venv/bin/pip install -r scripts/data/requirements-geospatial.txt -r scripts/data/requirements-science.txt
.venv/bin/python scripts/data/acquire_research.py --config scripts/data/config/research-giza.example.json --sources imerg,smap,hls,ecostress --download-earthdata --max-file-mb 768
.venv/bin/python scripts/data/inspect_protected_samples.py --run <new-run-id>
```

The downloader follows only the explicitly observed NASA CDN routes and strips Authorization before delivery-CDN requests. Unknown destinations remain blocked. Full global SMAP is large; the 768 MiB ceiling was explicitly selected for this task. CMR location filtering does not clip full rasters.

## Reliability and production gates

1. Select the actual pilot geometry and full crop-season/replay periods. The current runner intentionally selects one matching protected granule; full-period batching requires a separately reviewed expansion of that limit.
2. Check actual per-variable spatial/temporal coverage and native QA before promoting an extract. Reject distant SMAP substitutes, cloudy/high-aerosol optical observations, and thermal nodata.
3. Keep immutable checksummed raw artifacts outside Git and publish small validated features through the accepted contract. Use cached known-good artifacts when services fail; retry bounded transient errors and retain failure records.
4. Choose crop rules, soil depth/profile inputs and model requirements before asserting farmer/project readiness. No observed sample here validates a yield, irrigation recommendation or soil-health claim.

Validation: fourteen acquisition boundary tests (including bearer stripping on NASA CDN redirects), native file readers, byte counts/SHA-256 and repository checks. Authenticated retrieval is now exercised against all four previously protected sources.

[Connection and schema guide](DATASET_ACCESS_GUIDE.md).
