# Nile Delta and Fayoum: regional inputs and completeness

The user selected **Egypt's Nile Delta and Fayoum**, and confirmed **2024–2025** as two complete historical years. These replace the earlier Giza access-test scope. [Regional configuration](../../scripts/data/config/regions/delta-fayoum.json) and [machine-readable regional readiness](../../data/manifests/regions/readiness.json) are the entry points.

## Geographic support

| Area | WGS84 study envelope: west, south, east, north | Interpretation |
| --- | --- | --- |
| Nile Delta | 29.5, 30.0, 32.75, 31.75 | Conservative regional envelope, including non-agricultural margins |
| Fayoum basin | 30.0, 28.8, 31.35, 29.8 | Conservative basin envelope, including lake/desert margins |

These are explicit engineering study envelopes, **not official administrative boundaries or a cultivated-field mask**. Coordinates use longitude,latitude. Region-wide datasets must subsequently be intersected with real fields or a reviewed cropland/water/urban mask. POWER points are a sampling lattice; they are not independent farm stations or a claim that all source grids share this resolution.

## Actual import status

| Dataset | Delta | Fayoum | Completeness boundary |
| --- | --- | --- | --- |
| POWER | 18 sampling locations × 731 days × 8 variables | 6 sampling locations × 731 days × 8 variables | Full date series at all 24 sampled locations; units, unique dates and missing values checked |
| SoilGrids | 108 native region-envelope rasters | 108 native region-envelope rasters | Six properties × six depths × three statistics, all downloaded; static predictions, not 2024–2025 soil measurements |
| IMERG | 639 daily regional values + 92 explicit inventory gaps | 639 daily regional values + 92 explicit inventory gaps | All 639 listed daily subsets per region collected; 731-row calendars preserve provider gaps |
| SMAP | 902 valid AM/PM rows, 558 QA-empty, 2 inventory-gap rows | 719 valid AM/PM rows, 741 QA-empty, 2 inventory-gap rows | All 730 listed daily subsets per region collected; each 731-day calendar has separate AM/PM rows; QA-empty is unavailable |
| HLS | New matching local red/NIR/Fmask acquisition | New matching local red/NIR/Fmask acquisition | Scene overlap only; complete regional mosaic, full sequence and reviewed QA pending |
| MOD13Q1 | New local composite with all returned QA bands | New local composite with all returned QA bands | One local sample; full spatial mosaic and two-year composite series pending |
| ECOSTRESS | New matching local LST/error/QC/cloud/water acquisition | New matching local LST/error/QC/cloud/water acquisition | Scene overlap only; regional/temporal coverage and valid thermal observations pending |

All fourteen region/source entries have complete **handoff structure**, required evidence paths and explicit temporal/spatial/quality states. That is not the same as all fourteen being production-complete. `allProductionComplete=false` deliberately prevents the earlier access samples from being mislabeled as complete regional inputs.

Imported data: [regional data folder](../../web/public/data/regions/20261113T123805653050Z/). POWER CSVs have adjacent unit/provenance metadata JSON. Soil-profile JSON contains all property/depth/statistic records, native CRS, bounds, resolution, valid-pixel counts, source URLs, raw byte counts and SHA-256. Satellite extracts preserve observation period, native support and QA information.

## Source-specific corrections and gaps

- SoilGrids WCS quantile names are `Q0.05` and `Q0.95`; `Q05` and `Q95` are not interchangeable WCS coverage IDs. The adapter now explicitly translates the file/statistic convention to the service convention. The first unsuccessful requests are retained separately from the successful corrected 216-layer import.
- Monthly CMR checks found no matching IMERG Final daily records for October–December 2025 in the selected collection query. Treat these as a provider-catalog availability gap requiring investigation, not proof that rainfall was zero or all possible access routes lack data. POWER rainfall is available as a separately labeled source; do not silently splice it into an IMERG series.
- ECOSTRESS has months without matching granules in the regional catalog query. ISS acquisition and valid-pixel coverage are irregular; a complete calendar cannot require fabricated daily thermal observations.
- Satellite geometry intersects a region even when usable data are absent at particular fields. Scene/tile overlap is separate from nodata validity and product QA. HLS clouds/aerosol, SMAP retrieval flags and ECOSTRESS masks require method-specific filtering.
- The study envelopes include water, urban areas and desert. Valid soil/raster fractions are not percentages of cultivated land until a reviewed land mask is applied.

## Reproduce and validate

From the repository root:

```sh
python3 scripts/data/audit_regions.py --config scripts/data/config/regions/delta-fayoum.json
.venv/bin/python scripts/data/import_regional_soils.py --config scripts/data/config/regions/delta-fayoum.json --run <regional-run-id>
.venv/bin/python scripts/data/import_regional_cached.py
python3 scripts/data/plan_regional_downloads.py --config scripts/data/config/regions/delta-fayoum.json
python3 scripts/data/validate_regions.py
python3 -m unittest discover -s tests/data -p 'test_*.py'
```

Geospatial/science readers are listed in the existing optional requirements files. Authenticated acquisition uses the already documented Earthdata route; secrets remain outside Git. Raw rasters and catalog response bodies remain ignored locally. Only compact normalized series, summaries, catalogs and attributable metadata are committed.

`plan_regional_downloads.py` pages through all matching satellite granules, records exact science URLs and observation times, and distinguishes a complete **catalog inventory** from a complete **science download**. [Full-period plans](../../data/manifests/regions/full-period-plans/) are the batch-acquisition handoff. Global files shared by Delta/Fayoum must be deduplicated, and a CMR bounding box does not clip them. Do not download hundreds of global SMAP files into a small workspace: use verified collection-supported subsetting or stream/process bounded batches, retaining source checksums and cache status.

## Remaining production gate

Before the project can claim complete 2024–2025 regional satellite imports, finish the full-period asset queues with real spatial/variable subsetting, resolve provider gaps, construct mosaics without double counting, apply product-specific QA and publish measured usable coverage by region/month. The current dataset structure and source connectivity are verified; **the full satellite data import is still incomplete**. Keep that state visible in the UI/model handoff rather than substituting synthetic values or implying regional-pixel values describe an individual farm.

## Region-only cloud processing, initiated for the confirmed period

The user selected compact regional inputs with QA and provenance. Four NASA Harmony jobs have been submitted for **IMERG and SMAP × both regions**, with the full 2024–2025 time bounds and quality variables. Live collection-capability responses verified bbox/variable subsetting for these two collections. Job IDs and current states are in [Harmony request records](../../data/manifests/regions/harmony-requests.json); signed URLs and credentials are excluded. Queue/running/success states must not be equated with collected and validated outputs.

```sh
python3 scripts/data/submit_harmony_regions.py --submit
python3 scripts/data/poll_harmony_regions.py --download
```

The submit helper skips existing job IDs to avoid duplicate work. It uses `EARTHDATA_TOKEN` from the environment. Result collection authenticates only to Harmony and strips the bearer before the verified result-delivery CDN redirect.

The selected **HLS, MOD13Q1 and ECOSTRESS** collections reported no Harmony transformation service in the checked capabilities, despite general portal documentation describing broader options. Their native AppEEARS product/layer IDs and native output projection were separately verified against live service metadata. Six AppEEARS area requests were prepared and submitted with the separately user-authorized application token. See [task records](../../data/manifests/regions/appeears-tasks.json) and [reviewable request payloads](../../scripts/data/config/regions/appeears/).

```sh
python3 scripts/data/submit_appeears_regions.py --submit
```

AppEEARS requires `APPEEARS_TOKEN` generated by its application login service; an Earthdata-profile token is not interchangeable. [NASA's authentication guidance](https://github.com/nasa/AppEEARS-Data-Resources/blob/main/guides/How-to-bulk-download-AppEEARS-outputs.md) documents this distinction. Tokens are task-local and are not stored in the repository. Future invocations must receive them through secure environment configuration.

The cloud requests crop at the provider and preserve quality layers. Complete processing, output inspection, source-native QA and compact regional publication remain gates; submitting requests does not itself finish those imports. See [Harmony API documentation](https://harmony.earthdata.nasa.gov/docs) for job semantics. Full-period catalog plans are gzip-compressed JSON metadata to keep Git compact; open with Python `gzip.open(path, 'rt')` and `json.load`.

The [regional readiness JSON Schema](../../scripts/data/config/regions/regional-readiness.schema.json) defines the handoff structure. CI also checks distinct region/source IDs, evidence paths, weather columns and all 731 dates, and the complete 108-layer soil profile per region. Cloud processing status can be refreshed without resubmitting:

```sh
python3 scripts/data/poll_harmony_regions.py --download
python3 scripts/data/poll_appeears_regions.py
```

Both tokens were tested successfully for their respective services. No additional credential is requested at this stage. All four Harmony jobs succeeded and all 2,738 listed daily subsets were collected. The six AppEEARS tasks are processing/queued; their result inventories and scientific QA remain separate completion gates. Downloaded regional subsets include quality variables; compact QA-derived daily/monthly inputs must retain valid counts, masked fractions, observation windows, units and parent checksums. Preserve explicit calendar gaps rather than interpolating unsupported observations.

## Compact daily publication and measured missingness

[Daily inputs](../../web/public/data/regions/harmony-daily/) now contain four CSVs plus metadata. IMERG has 731 rows/region; SMAP has 1,462 day/pass rows/region. All downloaded parent artifacts have SHA-256 records in the Harmony manifest. Native units, valid bounds, quality flags and in-envelope cell centers are checked. The SMAP ratio cm3/cm3 is numerically equivalent to m3/m3; native valid_min/max are honored. Valid fractions use native cell centers inside the envelope, including non-cropland.

QA-empty SMAP observations are substantial, particularly in Fayoum; download success does not establish usable daily soil moisture. Metadata reports monthly row-status counts and the exact QA recipe. No inventory-gap or QA-empty row contains a fabricated value. IMERG uses cosine-latitude weights; SMAP uses its native equal-area cells. Independent QA-method and land-mask review remains required.

```sh
.venv/bin/python scripts/data/summarize_harmony_regions.py
python3 scripts/data/refresh_regional_readiness.py
python3 scripts/data/validate_regions.py
```

The full pipeline, proposed schema mapping and role handoffs are in the [Markdown report](PIPELINE_REPORT.md) and [PDF report](PIPELINE_REPORT.pdf). AppEEARS science-output extraction is still pending provider completion and inspection; the polling helper records bundle inventories, not completed scientific imports.
