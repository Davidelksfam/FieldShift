# HLS: L30/S30 discovery, selected bands and raster schema

[Seven-source index](../../DATASET_ACCESS_GUIDE.md) · [Actual download status](../../DOWNLOAD_STATUS.md)

Use: observed vegetation timing/greenness proxies. [NASA HLS products](https://hls.gsfc.nasa.gov/data-products/) and [V2 user guide](https://lpdaac.usgs.gov/documents/1698/HLS_User_Guide_V2.pdf). The first reproducible route selects `HLSL30`, version `2.0`. S30 is an explicit alternative, not a different name for the same band layout.

## Connect / input schema

```sh
python3 scripts/data/acquire_research.py \
  --config scripts/data/config/research-giza.example.json --sources hls
```

Public CMR collection query: `short_name=HLSL30`, `version=2.0`, `page_size=2`; granule query uses the returned collection ID, `point=longitude,latitude`, UTC temporal range and bounded page size. [CMR request](../../api-schemas/cmr-request.schema.json) / [response](../../api-schemas/cmr-response.schema.json).

Actual reflectance/QA COGs require Earthdata Login; the tested L30 red-band URL returned HTTP 401. After [credential setup](../../DATASET_ACCESS_GUIDE.md#earthdata-connection), `--download-earthdata` selects only **B04, B05, Fmask** for the first matching L30 scene. It does not fetch every angle/thermal/browse asset, and it does not crop a tile spatially. Authenticated downloads remain untested without a credential.

## Native output schema

CMR JSON describes granules and asset URLs, not reflectance pixels. Preserve granule ID, acquisition time, tile and collection. An observed matching scene was `HLS.L30.T36RUU.2025007T083009.v2.0`.

| Science raster | Role / handling |
| --- | --- |
| L30 `B04` | Red reflectance |
| L30 `B05` | NIR reflectance |
| S30 alternative `B04` / `B8A` | Red / narrow NIR; do not substitute B08 by habit |
| `Fmask` | Bit-packed QA, not reflectance; decode exact version's flags |
| Raster metadata | CRS, transform, width/height, nodata, scale/offset, band dtype and native support |

Products use 30 m pixels. Read scale/fill metadata before calculation (the V2 guide documents reflectance scaling); cloud/shadow/snow/aerosol/adjacency choices need a reviewed policy. Do not discard every nonzero Fmask as though all bits meant cloud. Preserve valid-area fraction and scene gaps. All layer/range handling needs confirmation in the actual raster; science bytes have not yet been inspected in this task.

Future feature formula: `NDVI = (NIR-red)/(NIR+red)` for valid pixels with nonzero denominator. Compute pixel indices before a declared field statistic, mask first, and deduplicate overlapping scene support. A field boundary intersecting a 30 m cell does not prove that pixel measures only that field. Neither greenness nor low NDVI alone identifies crop species, drought cause, soil fertility or irrigation need.
