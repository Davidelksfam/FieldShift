# ECOSTRESS: surface-temperature route and native raster schema

**Authenticated follow-up:** science bytes have now been acquired and inspected. Earlier unauthenticated findings below are retained as historical access context; see [current readiness and limitations](../../DOWNLOAD_STATUS.md). The inspection reader is `scripts/data/inspect_protected_samples.py`; missing/flagged point observations are not silently promoted into model features.

[Seven-source index](../../DATASET_ACCESS_GUIDE.md) · [Actual download status](../../DOWNLOAD_STATUS.md)

Use: thermal surface context. Selected **historical** candidate: `ECO_L2T_LSTE` version `002`. This is an explicit reproducibility choice for the sample period, not a claim that 002 is the latest collection. [Official product/guide table](https://ecostress.jpl.nasa.gov/data/atbds-summary-table).

## Connect / input schema

```sh
python3 scripts/data/acquire_research.py \
  --config scripts/data/config/research-giza.example.json --sources ecostress
```

Public CMR collection inputs: `short_name=ECO_L2T_LSTE`, string `version=002`, bounded `page_size`. Granule inputs: returned collection ID, point **longitude,latitude**, UTC temporal range, sort and first-match limit. [CMR input](../../api-schemas/cmr-request.schema.json) and [catalog output](../../api-schemas/cmr-response.schema.json).

The selected science asset returned HTTP 401 without Earthdata Login. [Connection instructions](../../DATASET_ACCESS_GUIDE.md#earthdata-connection). The explicit protected-download mode selects LST, LST error, QC, cloud and water rasters for one matching observation; full tiles remain bounded by the per-file ceiling.

## Native output schema

The catalog describes granules/assets; it does not return temperature values. A matching sample was `ECOv002_L2T_LSTE_36806_017_36RUU_20250102T043608_0713_01`.

| Layer/file suffix | Meaning / decoding requirement |
| --- | --- |
| `_LST.tif` | Land-surface temperature; inspect actual units/scale/nodata |
| `_LST_err.tif` | Temperature-error estimate; preserve its definition |
| `_QC.tif` | Version-specific QC bit field |
| `_cloud.tif`, `_water.tif` | Separate cloud/water masks, essential to interpretation |
| Raster metadata | Native ~70 m grid, CRS/transform, dimensions, dtype, observation time |

The guide is a documented decoding plan; authenticated rasters are not yet inspected. In V002, do not rely on a V001 QC cloud-bit assumption: separate mask products matter. Only convert Kelvin to Celsius if the actual variable uses Kelvin. Preserve overpass time and irregular revisit/coverage. LST is a surface skin quantity, not POWER air temperature.

ET is a **different product**, such as a reviewed `ECO_L3T_JET` collection/layer. Selecting LST does not download ET and does not calculate irrigation demand. An ET layer can be instantaneous flux, daytime/daily estimate or another modeled quantity depending on collection/version; inspect its units and temporal meaning first. Do not relabel W/m² as mm/day or integrate sparse irregular snapshots into a complete seasonal total without a justified method.
