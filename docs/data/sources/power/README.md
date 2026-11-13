# NASA POWER: connection and native schemas

[Seven-source index](../../DATASET_ACCESS_GUIDE.md) · [Actual download status](../../DOWNLOAD_STATUS.md)

Use: daily gridded weather history. This is model/reanalysis-based regional context, not a farm weather station. [Official daily API](https://power.larc.nasa.gov/docs/services/api/temporal/daily/). No API key is required for the tested endpoint.

## Connect / download

```sh
python3 scripts/data/acquire_research.py \
  --config scripts/data/config/research-giza.example.json --sources power
```

Equivalent public request:

```sh
curl --fail --get 'https://power.larc.nasa.gov/api/temporal/daily/point' \
  --data-urlencode 'parameters=T2M,T2M_MIN,T2M_MAX,RH2M,WS2M,ALLSKY_SFC_SW_DWN,PRECTOTCORR,PS' \
  --data-urlencode 'community=AG' --data-urlencode 'latitude=29.9' \
  --data-urlencode 'longitude=31.15' --data-urlencode 'start=20250101' \
  --data-urlencode 'end=20250107' --data-urlencode 'format=JSON' \
  --data-urlencode 'time-standard=UTC'
```

Run from a shell/script during offline acquisition, rather than calling the provider on every browser interaction. Save originals under ignored `data/raw/`; use the supplied script for checksums/provenance. It is unnecessary to expose any credential to the frontend.

## Input schema

| Query field | Type / meaning |
| --- | --- |
| `parameters` | Comma-separated provider parameter IDs; eight listed above |
| `community` | `AG` for this request |
| `latitude`, `longitude` | WGS84 decimal degrees, separately named, not array order |
| `start`, `end` | `YYYYMMDD`; requested daily interval, end inclusive |
| `format` | `JSON` in this kit |
| `time-standard` | Explicit `UTC`; provider also supports LST and defaults must not be assumed |

[Machine-readable native query schema](../../api-schemas/power-request.schema.json).

## Output schema

JSON Feature with `geometry.coordinates` (longitude, latitude, optional elevation), `header`, `properties.parameter`, `parameters` and possibly additional provider fields. `properties.parameter.<parameterId>.<YYYYMMDD>` is a number; missing data use the sentinel declared in `header.fill_value`, not JSON null. `parameters.<parameterId>` supplies `units` and `longname`. Header metadata include API version, source names, time standard and requested dates. Do not equate API version with the versions of every upstream source.

[Machine-readable response shape](../../api-schemas/power-response.schema.json).

| Parameter | Unit observed in the successful request | Role |
| --- | --- | --- |
| `T2M`, `T2M_MIN`, `T2M_MAX` | `C` | Mean/min/max air temperature at 2 m |
| `RH2M` | `%` | Relative humidity |
| `WS2M` | `m/s` | Wind speed at 2 m |
| `ALLSKY_SFC_SW_DWN` | `MJ/m^2/day` | Shortwave radiation; not net radiation |
| `PRECTOTCORR` | `mm/day` | Corrected precipitation; not irrigation supply |
| `PS` | `kPa` | Surface pressure |

The observed response header reported API `v2.10.3` and fill `-999.0`; those are a dated observation, not constants to force onto future responses. This particular AG radiation output already uses MJ/m²/day: multiplying it by 3.6 would be wrong. The inspection normalizer checks actual units, converts fill to null before use, validates matching dates and temperature ordering, and preserves valid zero rainfall. It fails explicitly on unsupported unit changes.

## Quality and handoff

Preserve the spatial support of each underlying weather/radiation source; point coordinates do not establish one common field-scale grid. Check complete day coverage before publishing totals. Daily values alone do not establish initial soil-water storage, crop coefficients or irrigation efficiency. Inspect source metadata, and only then implement ETo/seasonal features under the reviewed contracts.
