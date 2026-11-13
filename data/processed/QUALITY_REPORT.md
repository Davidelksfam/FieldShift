# Dataset reliability report — 2025 benchmarks

Actual acquisition and preprocessing: 2026-11-13. Scope: three centroid subsets, not Egypt-wide mapping or independent field validation.

| Benchmark | Latitude, longitude | Valid climate days | Days >38°C / summer observations | Good MODIS composites | Soil profile |
| --- | --- | --- | --- | --- | --- |
| fayoum_etsa | 29.2315, 30.7952 | 365/365 | 58 / 153 | 21 / 23 | Accepted |
| delta_kafr_el_sheikh | 31.1107, 30.9388 | 365/365 | 70 / 153 | 15 / 23 | Rejected: zero-filled |
| west_delta_nubariya | 30.665, 30.068 | 365/365 | 28 / 153 | 22 / 23 | Accepted |

All six climate variables have 365 valid daily values at each location: 1,095 daily rows / 6,570 values, without interpolation. Tmax/Tmin, wetness and precipitation passed physical range/order checks. Actual POWER grid coordinates and version/source headers are retained in the machine-readable report. The 2025 historical period is fixed; retrieval dates are separate.

## Cleaning and quality gates

1. Verify every raw response's SHA-256 against the request manifest before parsing. Dates must be unique, in 2025, and cover the expected daily or sixteen-day calendar. Wrong units, missing files or mismatched hashes stop preparation.
2. POWER: mask null/nonfinite and <=-900 flags; check temperatures, precipitation, wetness 0–1, energy flux and Tmax >= Tmin. All requested unit metadata is checked. EVPTRNS is retained as **MJ/m²/day energy flux**, not ET₀. Live refresh now rejects incomplete years/summer coverage and unknown units instead of replacing an audited series with a fragment.
3. MODIS: download NDVI and pixel reliability for each composite in three <=10-date batches. Match dates, tiles and native pixel geometry before scaling. Accept raw NDVI -2000..10000 only when reliability == 0 (good); mask marginal (1), snow (2), cloud (3), fill and missing QA to **null**. No smoothing, interpolation or cloud-gap fabrication. Native MODIS sinusoidal pixel width is 231.656358264 m (the nominal 250 m product).
4. SoilGrids: official point API was initially unavailable, so retrieve native WCS cells. A later Fayoum point response succeeded: its unit conversion metadata and all 30 mean/quantile values exactly matched the WCS extraction. This validates interface alignment, not field accuracy. Transform WGS84 centroids to Interrupted Goode Homolosine; align to the native 250 m grid; verify returned CRS, 1×1 dimensions, bounds containing the centroid and pixel size. Fetch mean, Q0.05 and Q0.95 for five properties at two depths: 90 tiny TIFFs total. Convert clay/sand/pH/SOC by ÷10 and nitrogen by ÷100. Weight 0–5 and 5–15 cm means 1:2 for the top 15 cm. Preserve depth-specific prediction quantiles; do not call their weighted sum a joint confidence interval.
5. Reject pH zero, impossible texture totals, fill and incomplete soil profiles. **All 30 Kafr El-Sheikh cells returned zero**, including pH and every uncertainty statistic. This is invalid coverage, not a measured soil condition. No nearby pixel was substituted or attributed to the original point. The app retains a visibly synthetic soil fallback for this location; soil-driven scores there are illustrative.
6. Require valid numeric NDVI for autumn duration counts. Display observed versus unknown autumn support so rejected composites cannot be interpreted as covered soil or as evidence of zero risk. Historical offline snapshots apply only to the exact three coordinates; arbitrary map clicks never inherit their provenance.

## Cleaned top 15 cm soil predictions

| Benchmark | Clay % | Sand % | pH | SOC g/kg | Nitrogen g/kg |
| --- | --- | --- | --- | --- | --- |
| fayoum_etsa | 26.900 | 53.100 | 7.300 | 23.733 | 2.010 |
| delta_kafr_el_sheikh | Unavailable | Unavailable | Unavailable | Unavailable | Unavailable |
| west_delta_nubariya | 25.233 | 41.267 | 8.000 | 6.833 | 0.857 |

These replace demo assumptions only where validated source coverage exists. Soil predictions differ materially from regional stereotypes: the exact Nubariya point has ~41% predicted sand, not the demo's 74%; the Fayoum point has pH 7.3, not 8.2. Land type, canal position and reported salinity remain farmer inputs, not inferred facts.

## What reliability means here

Transport integrity, unit conversion, time coverage, pixel alignment and documented quality filters have been checked. These checks do not establish field-scale accuracy, crop suitability, measured salinity, water savings or calibrated thresholds. POWER is a coarse reanalysis grid; SoilGrids is a static model prediction; retained MODIS pixels can still mix different land uses. A region label does not prove the selected point is representative farmland. MODIS summary QA screening is used; the detailed VI bitfield is not additionally screened. The service does not explicitly expose a MODIS collection/version, which remains unverified.

The nine crop records' water/heat/salinity/Kc values and market/N indices still require authoritative crop-stage and local agronomic review. Direct requests to the FAO 56 crop-coefficient reference and FAO 29 salinity reference both returned HTTP 403 in this environment; attempts are recorded in the manifest. No fabricated external citations or “FAO validated” label has been added. Bare soil remains a low-NDVI proxy; confirm crop dates, canal EC, drainage and field boundaries locally.

## Artifacts and checks

See [reproduction/source attribution](README.md), [quality-report.json](quality-report.json), [soil profiles](soil-profiles.json) and [request manifest](../manifests/benchmark-acquisition.json). Raw payloads and scripts are in the accompanying dataset package. Published cleaned payload bytes are hash-checked in the automated tests. Actual validation results are recorded in the PR and delivery documentation.
