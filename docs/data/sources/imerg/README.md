# GPM IMERG: catalog API and science-file schema

[Seven-source index](../../DATASET_ACCESS_GUIDE.md) · [Actual download status](../../DOWNLOAD_STATUS.md)

Use: rainfall history and comparisons with the chosen weather backbone. Selected historical candidate: **GPM_3IMERGDF, collection version 07, Final daily**. Granules can additionally name an algorithm revision such as V07B; retain it. [NASA technical documentation](https://gpm.nasa.gov/resources/documents/imerg-v07-technical-documentation) and [daily dataset description](https://disc.gsfc.nasa.gov/datasets/GPM_3IMERGDF_07/summary).

## Connect / download

```sh
python3 scripts/data/acquire_research.py \
  --config scripts/data/config/research-giza.example.json --sources imerg
```

This discovers one file and tests access without downloading a global raster. Public CMR requests:

```text
GET https://cmr.earthdata.nasa.gov/search/collections.json
    ?short_name=GPM_3IMERGDF&version=07&page_size=2
GET https://cmr.earthdata.nasa.gov/search/granules.json
    ?collection_concept_id=<collection id from first response>
    &point=31.15,29.9
    &temporal=2025-01-01T00:00:00Z,2025-01-07T23:59:59Z
    &page_size=1&sort_key=start_date
```

For actual science bytes, configure Earthdata Login as described in the [connection guide](../../DATASET_ACCESS_GUIDE.md#earthdata-connection) and rerun with `--download-earthdata`. There is no generic NASA API key in these queries. Catalog access is public; the tested science URL returned HTTP 401 without authentication.

## Input / catalog output schema

The collection query takes `short_name`, string `version`, `page_size`; subsequent granule queries use returned `collection_concept_id`, point string **longitude,latitude**, UTC temporal interval, sort and page size. [CMR request schema](../../api-schemas/cmr-request.schema.json) and [response schema](../../api-schemas/cmr-response.schema.json).

CMR response: `feed.entry[]` contains identifiers/titles and `links[]` with `href`, `rel`, optional `type`, `inherited` and title. Granule metadata include observation times and sometimes estimated size. Download **data** links with expected `.nc4` suffix, not browse images, catalog portals, S3 credential endpoints or inherited collection links. Follow paging for full discovery; the research default intentionally retrieves only the first matching file.

## Native science output schema

| Layer/attribute | Expected meaning; verify in actual NetCDF |
| --- | --- |
| Container | NetCDF4, with time/latitude/longitude coordinates and precipitation fields |
| `precipitation` | Candidate V07 science variable; inspect name, dimensions, `_FillValue`, units and bounds in the downloaded file |
| Daily temporal support | Provider-defined daily precipitation quantity/rate; preserve file metadata and algorithm |
| Spatial support | 0.1° grid; point search does not make a field pixel |
| Ancillary variables | Preserve uncertainty/count/quality metadata supplied by the selected file |

Variable naming/dimension order have not been inspected in authenticated science bytes here. Read them before writing a decoder; never silently assume `[time,lat,lon]` or a variable name from another release.

Daily V07 semantics differ from summing arbitrary half-hour files: the provider documents a daily mean rate expressed in mm/day. For the separate half-hourly `GPM_3IMERGHH` route, a value in mm/h multiplied by 0.5 h gives interval amount. Do not multiply an already daily mm/day value by 24. Record incomplete intervals; missing is not no rain. Never add IMERG rainfall to POWER rainfall; choose one model recipe and use the other for comparison or a declared alternative.

CMR's spatial/temporal arguments select files, not clipped data. Inspect download size and use supported provider subsetting for larger study periods. None of these rainfall quantities measure a farmer's canal delivery or pumping allocation.
