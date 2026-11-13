# MOD13Q1: no-key ORNL subset API and schemas

[Seven-source index](../../DATASET_ACCESS_GUIDE.md) · [Actual download status](../../DOWNLOAD_STATUS.md)

Use: regional vegetation context. [ORNL TESViS REST documentation](https://modis.ornl.gov/data/modis_webservice.html), [NASA V061 file specification](https://ladsweb.modaps.eosdis.nasa.gov/filespec/MODIS/61/MOD13Q1). The tested synchronous ORNL API returned actual band values without an API key.

## Connect

```sh
python3 scripts/data/acquire_research.py \
  --config scripts/data/config/research-giza.example.json --sources modis_mod13q1
```

Provider endpoints under `https://modis.ornl.gov/rst/api/v1/MOD13Q1`:

```text
GET /bands
GET /dates?latitude=29.9&longitude=31.15
GET /subset?latitude=29.9&longitude=31.15
    &startDate=A2025001&endDate=A2025001
    &kmAboveBelow=0&kmLeftRight=0
```

The runner selects a composite date actually returned by `/dates`; it does not fabricate a matching daily observation. `/products` is useful for service discovery but timed out in exploratory checks, so downloading does not depend on it.

## Input schema

| Parameter | Type / semantics |
| --- | --- |
| `latitude`, `longitude` | WGS84 degrees |
| `startDate`, `endDate` | Native MODIS `AYYYYDDD` dates from `/dates` |
| `kmAboveBelow`, `kmLeftRight` | Extent around point; zero gave a 1×1 pixel sample |
| Optional `band` | Provider band identifier; omit for all available bands/QA |

[Native subset query schema](../../api-schemas/modis-request.schema.json). Provider documentation limits a synchronous request to at most ten composite dates; use bounded chunks for larger ranges. The runner intentionally selects one composite.

## Output schema

The actual response contained:

| Field | Type / semantics |
| --- | --- |
| `xllcorner`, `yllcorner` | Numeric strings in the native projected grid; not longitude/latitude |
| `cellsize` | Number; actual native spacing was about 231.656 m, despite nominal “250 m” name |
| `nrows`, `ncols` | Integer grid shape |
| `subset[]` | Entries for composite/band/tile |
| Entry `modis_date`, `calendar_date`, `tile`, `proc_date` | Composite date, readable date, tile and processing identifier |
| Entry `band`, `data[]` | Band ID and row-major pixel array; length must equal nrows×ncols |

[Response shape schema](../../api-schemas/modis-response.schema.json). `/bands` separately returns units, valid range, fill value, scale factor and offset for each band. Read those fields rather than hard-coding one fill code for every variable.

The inspected NDVI band metadata used scale 0.0001 and fill -3000; pixel reliability used fill -1 and unscaled category ranks. The normalizer converts fill to null **before** scaling and leaves QA as flags. It explicitly reports `qaApplied=false`; scaled values are inspection samples, not approved vegetation features. Preserve Detailed VI Quality and reliability bands and apply the reviewed product-specific mask before deriving a field/season indicator.

The native product is a 16-day composite, even if a query spans seven days or the response has a calendar date. Do not repeat it into independent daily samples. Do not assume that an ORNL response lacking an explicit collection-version field has proven an exact pinned LPCLOUD release. If exact V061 file reproducibility is mandatory, discover `MOD13Q1` version `061` in CMR and retrieve its HDF via Earthdata Login, keeping the full file/version metadata.
