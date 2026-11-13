# SMAP Enhanced L3: discovery, authentication and HDF5 schema

[Seven-source index](../../DATASET_ACCESS_GUIDE.md) · [Actual download status](../../DOWNLOAD_STATUS.md)

Use: **regional near-surface wetness context**, not fertility or root-zone water storage. Selected candidate: `SPL3SMP_E`, version `006`, daily Enhanced L3 with 9 km posting. [NSIDC product and guide](https://nsidc.org/data/spl3smp_e/versions/6).

## Connect / input schema

```sh
python3 scripts/data/acquire_research.py \
  --config scripts/data/config/research-giza.example.json --sources smap
```

Public catalog endpoint: `https://cmr.earthdata.nasa.gov/search/collections.json`, with `short_name=SPL3SMP_E`, `version=006`, `page_size=2`. Feed its returned collection ID to `/search/granules.json`, with point `31.15,29.9`, UTC temporal interval, `sort_key=start_date`, `page_size=1`. See [native CMR input](../../api-schemas/cmr-request.schema.json) and [catalog response schema](../../api-schemas/cmr-response.schema.json). Preserve all version strings, including leading zeros.

The tested HDF5 science link requires Earthdata Login (HTTP 401 without it). [Authentication and size controls](../../DATASET_ACCESS_GUIDE.md#earthdata-connection). A generic NASA API key cannot authorize this download.

## Output schema: distinguish catalog from measurements

CMR JSON returns `feed.entry[]` containing granule ID/title, observation timestamps, estimated `granule_size` and link records. It does **not** contain moisture arrays. The selected example was `SMAP_L3_SM_P_E_20250101_R19240_001.h5`; the source registry pins collection 006 separately from filename processing revision.

| HDF5 component | Decoder requirements |
| --- | --- |
| AM/PM retrieval groups | Treat passes separately; expected groups include `Soil_Moisture_Retrieval_Data_AM` and `_PM`; verify exact V006 paths |
| Soil-moisture datasets | Volumetric near-surface moisture, m³/m³; read units/fill/range attributes |
| Latitude/longitude or native grid mapping | Native EASE-Grid support and matched cell; preserve grid metadata |
| Retrieval-quality and surface flags | Decode using the exact version's recommended retrieval policy; preserve original bit fields |
| Acquisition-time/ancillary datasets | Observation timing, water/frozen-ground/vegetation context where supplied |

Science-file field/group paths remain **documented expectations, not inspected downloads** until authentication succeeds. Inspect HDF5 keys and attributes first. Do not silently reuse an older version's flag interpretation. Never average a fill code into a seasonal statistic. A daily composite can have no valid retrieval at the requested point; valid sample count and maximum gap must be reported.

## Bounded downloads

The discovered global daily granule is roughly 634 MB according to CMR metadata; actual transferred size/checksum must be measured after download. A point/bounding-box catalog search still returns that global file. The default 64 MiB/file limit intentionally stops it. Prefer a confirmed collection-supported spatial/variable subsetting service; do not assume AppEEARS or Harmony supports this collection without checking. If explicitly choosing a full granule, budget disk/network and raise the file ceiling consciously (the runner allows at most 1024 MiB/file).

Nine-kilometer grid posting is not a measurement of each small field or a guarantee of independent 9 km effective resolution. Do not multiply surface moisture by a crop rooting depth to invent root-zone storage. Use a sourced soil profile/model for that separate calculation.
