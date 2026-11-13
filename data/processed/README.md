# Audited benchmark datasets

Collected 2026-11-13 for the three exact coordinates specified by the user. [Quality report](QUALITY_REPORT.md), [machine-readable gates](quality-report.json), [depth-specific soil estimates/uncertainty](soil-profiles.json) and [request/hash manifest](../manifests/benchmark-acquisition.json) describe actual outputs. The served cleaned payload is [observedBenchmarks.json](../../src/data/observedBenchmarks.json).

## Reproduce

From repository root, with Python 3.12:

```bash
python3 -m venv .venv
.venv/bin/pip install -r scripts/data/requirements.txt
python3 scripts/data/acquire_benchmarks.py --source power
python3 scripts/data/acquire_benchmarks.py --source modis
python3 scripts/data/acquire_benchmarks.py --source soil
.venv/bin/python scripts/data/acquire_soil_wcs.py
.venv/bin/python scripts/data/prepare_benchmarks.py
npm run check
npm run test:browser
```

Acquisition can take minutes; it deliberately runs outside the app's 4.5-second interactive budget. At most three requests run at once, with two bounded attempts. Successful responses are reused only if their bytes match the manifest SHA-256. Run acquisition commands sequentially because they update one shared manifest. The Fayoum point API eventually succeeded and matched all 30 WCS values; remaining point API failures are recorded separately from successful WCS extraction.

Raw responses stay under ignored `data/raw/benchmark-2025/`. To rebuild without network, use `--offline` on the acquisition scripts and then run preparation. Preparation rehashes every input, reads TIFF values again, validates units/dates/quality and produces deterministic JSON (no generated-at timestamp). Missing source files or hash mismatch stop processing. Downloads and preparation never replace data with interpolated or generated observations.

The accompanying dataset ZIP contains the raw responses and the repository-relative files needed for offline reproduction. The repository includes the small cleaned snapshots and provenance rather than bulk source data.

## Source attribution

- NASA POWER Project, NASA Langley Research Center: [POWER](https://power.larc.nasa.gov/), daily MERRA-2/POWER values and returned API metadata; acquisition URLs are in the manifest. Regional reanalysis, not field measurements.
- NASA LP DAAC MOD13Q1, distributed through the [ORNL DAAC MODIS web service](https://modis.ornl.gov/data/modis_webservice.html). Preserve product name, grid geometry, processing date and retrieval URLs. The point API does not explicitly expose the MODIS collection/version; do not infer it from the product ID. Raw responses retain per-composite processing dates. NASA Earthdata [data use policy](https://www.earthdata.nasa.gov/engage/open-data-services-and-software/data-and-information-policy).
- ISRIC SoilGrids 2.0, [WCS maps](https://maps.isric.org/) and [documentation](https://docs.isric.org/globaldata/soilgrids/SoilGrids_faqs.html); Poggio et al. (2021), [DOI:10.5194/soil-7-217-2021](https://doi.org/10.5194/soil-7-217-2021). SoilGrids predictions are distributed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); retain attribution and identify our unit conversions/extraction. Quantiles are predictions, not an accuracy guarantee at a farm.

No Esri/GIBS raster tiles are repackaged. They are contextual map services, not numerical inputs to the engine. Crop traits/market/N scores remain separately labeled user-supplied assumptions; gathering these environmental inputs does not validate the recommender.
