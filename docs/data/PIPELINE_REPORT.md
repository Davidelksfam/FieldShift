# FieldShift: regional data and integration pipeline

Research delivery, 13 November 2026. Scope confirmed by the user: Nile Delta and Fayoum, Egypt; 1 January 2024 through 31 December 2025; compact regional inputs with QA and provenance. This report accompanies the [PDF edition](PIPELINE_REPORT.pdf), [regional coverage register](REGIONAL_COVERAGE.md) and [source connection guide](DATASET_ACCESS_GUIDE.md).

## 1. Outcome and boundaries

The repository now has seven source adapters/guides, real downloaded source examples, two explicit study regions, a complete regional handoff structure, full-period satellite catalog inventories, and submitted provider-side regional processing requests. POWER has complete daily histories at 24 sampled locations. SoilGrids has all 216 requested regional property/depth/statistic rasters and compact profiles. All four Harmony jobs succeeded: 2,738 listed daily regional subsets were collected. Compact calendars preserve 92 IMERG missing dates and the SMAP missing day plus QA-empty passes. Six AppEEARS jobs cover HLS, MODIS and ECOSTRESS. Their current states are recorded in the manifests; an accepted request is not a completed import.

The critical architectural correction is to preserve each source's native meaning, scale, QA and observation interval before producing common seasonal features. A single table that blindly joins all products by date and latitude would conceal missing observations, duplicate overlapping imagery and confuse rainfall, irrigation, surface wetness and crop water stress.

The two envelopes are engineering study areas, not official administrative or cultivated-land boundaries. Delta: west 29.5, south 30.0, east 32.75, north 31.75. Fayoum: west 30.0, south 28.8, east 31.35, north 29.8. Both use WGS84 longitude,latitude. Regional averages include valid non-cropland pixels until a reviewed land mask is applied. No field-level recommendation or agronomic validation is claimed.

## 2. Seven-source strategy

| Source | Input interface and native output | Intended use and scale boundary |
| --- | --- | --- |
| NASA POWER | Daily point API: lat/lon, dates, community AG, parameter names; JSON keyed by parameter and YYYYMMDD | Weather backbone; gridded modeled meteorology, not field weather stations |
| GPM IMERG | CMR inventory, then Harmony bbox/time/variable request; daily NetCDF precipitation and sample counts | Rainfall context at about 0.1 degree; never farmer irrigation supply |
| SMAP Enhanced L3 | CMR inventory, then Harmony bbox/time/variable request; HDF5-compatible NetCDF with AM/PM retrieval groups and flags | Near-surface regional soil moisture at about 9 km; not root-zone water or a field sensor |
| HLS L30 | AppEEARS area request HLSL30.020: B04, B05, Fmask; native-projection NetCDF | Red/NIR vegetation evidence at about 30 m; current import is Landsat L30 only, not a combined L30/S30 time series |
| MODIS MOD13Q1 | AppEEARS MOD13Q1.061: NDVI, EVI, VI_Quality, pixel_reliability; NetCDF | About 250 m, 16-day composites; broad seasonal context, not a daily crop measurement |
| ECOSTRESS | AppEEARS ECO_L2T_LSTE.002: LST, LST_err, QC, cloud, water; NetCDF | About 70 m thermal surface observations with irregular ISS timing; this is LST, not downloaded ET or a calibrated stress index |
| SoilGrids | WCS GetCoverage with projected bbox, property/depth/statistic ID; GeoTIFF | About 250 m static predicted soil properties; Q05/Q95 uncertainty, not laboratory tests or annual observations |

Collection/product/version selection and examples are in the [source registry](../../data/manifests/source-registry.json) and per-source guides linked by the access guide. Do not swap products simply because they have similar names. Resolve a changed version through a new manifest and adapter review.

POWER currently contains 18 Delta and six Fayoum sample locations, each with 731 dates and eight variables. Sampling coordinates are not evidence of finer native resolution. SoilGrids contains six properties, six depth intervals and three statistics for each region. WCS quantile coverage IDs require Q0.05/Q0.95 even though stored statistic names are Q05/Q95; that adapter mismatch was fixed.

## 3. Storage and reproducible lineage

Use the existing folder ownership rules. Acquisition belongs in scripts/data; feature calculations belong in scripts/features. Raw and temporary data remain ignored. Compact, attributable handoffs belong in web/public/data, with no farmer-private geometry in public Git.

1. Configuration: scripts/data/config/regions/delta-fayoum.json defines regions, coordinates, dates and output scope. Service request payloads are reviewable JSON beside it.
2. Discovery: full-period-plans stores gzip JSON inventories of granules, times and URLs. Complete inventory means pagination finished; it does not imply downloaded science or usable coverage.
3. Acquisition: ignored data/raw stores verified native outputs. SHA-256, byte count, source job/granule and raw path go in data/manifests. Never store bearer tokens or signed result URLs there.
4. Normalization: adapters decode native fill/scale/unit/QA semantics and retain acquisition intervals. They must fail on unexpected dimensions or units rather than guessing.
5. Publication: compact CSV/JSON outputs include parent hashes, support, counts and missing-data status. These historical inputs are research artifacts, separate from the synthetic integration fixture.
6. Validation: source-specific checks precede seasonal aggregation. A readiness index records spatial, temporal and quality completion independently.

Deduplicate shared global source files between regions. Use provider-side bbox and variable selection for large satellite products. Never commit global daily archives or thousands of native scenes just to demonstrate access. Retain enough parent references and processing versions to reproduce published numbers.

## 4. Input and output schemas

These are data-adapter handoff descriptions, not an approved replacement for shared application contracts. The integration lead still owns contracts/seasonal-features.v1.schema.json and the documented FieldInput, CropRule, RotationResult and EvidenceRecord concepts.

### Requests

POWER request fields are longitude/latitude, start/end YYYYMMDD, community AG, time-standard UTC, format JSON and the eight parameter codes. Native response has header.fill_value/time_standard, parameters.<code>.units and properties.parameter.<code>.<YYYYMMDD>. The importer validates units, common dates, finite values, fill and temperature ordering.

CMR discovery accepts collection concept ID, temporal interval, bounding_box west,south,east,north and pagination. Native responses contain granule IDs, temporal metadata and science links. CMR spatial matching selects intersecting granules; it does not clip them. The full-period planner preserves this distinction.

Harmony requests specify the verified collection, time bounds, lat/lon subset, selected variables and NetCDF4 output. Status responses contain job status/progress and data links. Job records store jobID, sourceId, regionId and collection results. A successful job must also have all result assets collected and inspected.

AppEEARS requests specify task_type area, task_name and params containing dates, layers, GeoJSON geo and output. Dates use MM-DD-YYYY in these payloads. layers are product/layer pairs; output format is netcdf4 and projection native. Submission returns task_id; task polling returns status; completed bundles return files with file_id, file_name and file_size. Six exact submitted payloads are committed. Do not send the Earthdata-profile token to AppEEARS; use APPEEARS_TOKEN.

SoilGrids WCS requests use service/version, request GetCoverage, coverageId and axis subsets in the documented source CRS. Returned GeoTIFFs require raster CRS, transform, nodata and property scaling; do not infer WGS84 from the query's farmer coordinates. See the SoilGrids guide for conversions.

### Compact outputs

| Artifact | Key fields | Semantics |
| --- | --- | --- |
| POWER CSV + metadata | date, T2M, T2M_MIN, T2M_MAX, RH2M, WS2M, ALLSKY_SFC_SW_DWN, PRECTOTCORR, PS | degC, %, m/s, MJ/m2/day, mm/day and kPa, respectively; one point/day; adjacent metadata supplies location and provenance |
| Harmony daily CSV + metadata | date, pass, value, unit, valid_count, total_count, valid_fraction, status, source_sha256 | IMERG one daily row; SMAP separate AM/PM rows; native in-envelope cell denominator; region and QA recipe in metadata |
| Soil profile JSON | property, depthCm, statistic, status and native raster metadata | 108 records/region with physical summaries, support and source provenance; do not average Q05/Q95 into a fabricated confidence level |
| Regional readiness JSON | regionId, sourceId, schemaStatus, spatialStatus, temporalStatus, qualityStatus, fullProductionReady, evidencePaths, missingRequirements | Exactly two regions and seven distinct sources each; aggregate readiness cannot be true with incomplete members |

Satellite value status is valid_regional_context, no_QA_valid_pixels or provider_inventory_gap. Missing values are blank in CSV, never zero. An inventory gap has no parent science hash; a QA-empty observation retains its parent hash. Dates are explicit across all 731 calendar days, so a missing granule cannot disappear from a seasonal denominator. CSV checksums and parent manifests link the compact output to downloaded bytes.

## 5. Scientific normalization and feature research

Do not upsample SMAP or POWER and label the result field detail. Keep source-native grids, transform field polygons into the correct CRS, compute intersection weights and retain contributing-cell counts and area. For a region summary, explicitly report envelope versus cropland support. Use nearest-neighbor resampling for categorical QA; any continuous resampling requires a documented method. Intersect overlapping tiles without double-counting the same pixel/date.

Current IMERG regional aggregation requires finite nonnegative precipitation and 48 valid half-hour samples, with cosine-latitude area weights. SMAP keeps AM and PM separate, finite volumetric fraction within native valid_min/max, non-fill retrieval flags and recommended retrieval quality bit 0 unset, and native equal-area averaging. These explicit research QA recipes still need independent scientific review and a cultivated-land mask.

For HLS, decode Fmask bits, remove cloud/shadow/snow and review aerosol policy; use reflectance scale/offset from product metadata. Compute NDVI as (NIR-red)/(NIR+red), guarding a zero denominator, then summarize valid field pixels per acquisition. For MODIS, decode detailed VI QA and reliability before applying NDVI/EVI scale factors; preserve each composite's observation window. Do not count a 16-day value 16 times as independent evidence. For ECOSTRESS, decode QC/cloud/water, inspect LST error and exact local observation time, and preserve uncertainty. Day/night surface temperatures are not directly comparable without a reviewed method.

Candidate seasonal features are period rainfall totals, mean/min/max air-temperature summaries, documented dry-spell statistics, vegetation timing, observed surface wetness, thermal evidence and depth-specific soil context. These are proposals until formulas, seasons, coverage thresholds and agronomic interpretation are accepted. Compute rainfall totals only with a defined completeness rule; partial totals need their observed-day denominator. Heat exposure needs a locally supported threshold. Reference evapotranspiration requires a reviewed method and all necessary inputs; ECOSTRESS LST alone cannot supply it.

SMAP has 902 valid, 558 QA-empty and two inventory-gap day/pass rows in Delta; Fayoum has 719 valid, 741 QA-empty and two inventory-gap rows. These are day/pass counts, not cultivated-area coverage. Monthly status counts are published in each series metadata.

Two historical years support replay and pipeline testing. They do not supply a long-term climate normal, crop-yield labels or enough evidence to train a credible outcome model. Compare sources on matching support and times, investigate disagreements and test data ablation. Do not claim correlations prove irrigation needs or yield effects.

## 6. Role-by-role delivery and integration gates

| Role | Next concrete deliverable | Acceptance gate |
| --- | --- | --- |
| Integration architect | Accept/version contracts and source-to-feature mapping; review shared changes | One schema/unit/null convention across feature, model and UI; source evidence always traceable |
| Data engineer | Finish provider queues, inspect bundles, publish source-native QA and monthly usable coverage | All requested outputs accounted for; hashes verified; explicit unavailable dates and spatial support |
| Feature engineer | Deterministic seasonal adapters in scripts/features with formulas, support and missingness | Boundary/unit tests and independent numerical review; conforms to accepted SeasonalFeatures schema |
| Model/domain engineer | Reviewed local crop catalog and deterministic feasibility-first baseline | Rotation/family/window/water constraints tested before ranking; missing critical inputs produce an explicit limited/no-result state |
| Frontend developer | Consume approved JSON and render loading, unavailable and evidence states | Farmer-selected location and farmer-supplied irrigation budget remain distinct from satellite context |
| UI/UX developer | Accessible Arabic/English and RTL/LTR flows, mobile evidence displays | Units, dates, uncertainty and support readable; design tokens await user-provided brand decisions |

Do not invent team member assignments. Use one owner and one reviewer per issue. Proposed schema changes belong in a reviewed integration change, not separate ad hoc interfaces in each workstream. Keep the existing synthetic fixture clearly labeled until real feature files pass the same contract and scientific checks.

The proposed product path is field/context input, baseline and alternative rotations, feasibility, scenario comparison and an evidence explanation. It still needs team acceptance. An LLM can explain sourced deterministic results; it must not invent crop coefficients, irrigation supply or success probabilities. Source download completion does not authorize unreviewed crop recommendations.

## 7. Reliability, gaps and continuation

The selected IMERG inventory has 639 daily granules per region and no matching records for October-December 2025. SMAP has 730 granules per region for a 731-day period. Preserve those gaps and investigate the selected collection, archive and provider availability. POWER rainfall is a separately labeled backbone; never silently substitute it into IMERG. ECOSTRESS and optical imagery are irregular and cloud/QA-limited, so acquisition coverage and usable-pixel coverage need separate counts.

Both service tokens were tested. Future runs receive EARTHDATA_TOKEN and APPEEARS_TOKEN through environment secrets, with no values in source control. Harmony downloads resume verified cached artifacts and retry transient delivery errors. AppEEARS tasks may take longer than this interactive session; poll existing task IDs rather than submitting duplicates. Provider output retention and token expiry must be checked before later collection.

Run from the repository root with the optional science/geospatial readers installed:

```sh
python3 scripts/data/poll_harmony_regions.py --download --workers 6
.venv/bin/python scripts/data/summarize_harmony_regions.py
python3 scripts/data/poll_appeears_regions.py
python3 scripts/data/validate_regions.py
python3 -m unittest discover -s tests/data -p 'test_*.py'
python3 scripts/check_repository.py
```

For completed AppEEARS tasks, inspect outputCount and byteCount in the task manifest before collection. Retrieve the bundle via GET /api/bundle/{task_id} and each output via GET /api/bundle/{task_id}/{file_id} with the application bearer. Inspect native NetCDF dimensions, attributes and QA for each product. Process bounded time/spatial batches or use NASA's documented streaming approach; a two-year HLS area bundle can exceed workspace capacity even after cropping. Publish compact QA-derived observations and provenance, not giant scene files. Automatic AppEEARS science extraction is not implemented yet; task polling and inventory alone do not finish this gate.

Production acceptance requires reviewed region/cropland/field masks, all outputs accounted for, correct scale/unit/QA decoding, monthly usable coverage, resolved or explicitly accepted source gaps, scientific review, and approved feature/model contracts. Until then allProductionComplete remains false.

## 8. Evidence and research priorities

Repository evidence: [source access guide](DATASET_ACCESS_GUIDE.md), [regional coverage](REGIONAL_COVERAGE.md), [Harmony jobs](../../data/manifests/regions/harmony-requests.json), [AppEEARS tasks](../../data/manifests/regions/appeears-tasks.json), [readiness](../../data/manifests/regions/readiness.json), [workstream rules](../team/WORKSTREAMS.md) and [draft contracts](../engineering/CONTRACTS.md).

Provider references: [POWER API](https://power.larc.nasa.gov/docs/services/api/), [CMR search](https://cmr.earthdata.nasa.gov/search/site/docs/search/api.html), [Harmony](https://harmony.earthdata.nasa.gov/docs), [AppEEARS API](https://appeears.earthdatacloud.nasa.gov/api/), [NASA AppEEARS examples](https://github.com/nasa/AppEEARS-Data-Resources), [SoilGrids](https://docs.isric.org/globaldata/soilgrids/).

The user supplied the [Space Apps resource URL](https://www.spaceappschallenge.org/2026/challenges/adapting-farms-with-nasa-data/?tab=resources). Official challenge eligibility, event timing and submission rules remain governed by the repository's verification register; product/API access is not evidence of challenge eligibility. Next research should prioritize local crop calendars/rules, actual irrigation constraints, salinity and drainage evidence, ground-truth availability, and independent agronomic review. The current seven products do not measure farm irrigation allocation, soil salinity or future yield directly.
