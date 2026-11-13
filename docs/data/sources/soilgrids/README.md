# SoilGrids: WCS subset route, REST status and schema

[Seven-source index](../../DATASET_ACCESS_GUIDE.md) · [Actual download status](../../DOWNLOAD_STATUS.md)

Use: predicted soil fallback, explicitly non-NASA and not a field soil test. [ISRIC access documentation](https://docs.isric.org/globaldata/soilgrids/SoilGrids_faqs_02.html), [layer/unit definitions](https://docs.isric.org/globaldata/soilgrids/SoilGrids_faqs_01.html), [WCS tutorial](https://docs.isric.org/globaldata/soilgrids/WCS_from_Python.html).

ISRIC reports its REST service temporarily paused. The exploratory REST request returned HTTP 503. WCS DescribeCoverage succeeded during probing, while GetCoverage availability must be checked separately; receiving XML metadata does not prove a raster was downloaded.

## Connect / download

Install the optional local dependencies in the [main guide](../../DATASET_ACCESS_GUIDE.md), then:

```sh
.venv/bin/python scripts/data/acquire_research.py \
  --config scripts/data/config/research-giza.example.json --sources soilgrids
```

No API key is required for the WCS route. The script requests a small pH 0–5 cm mean-prediction raster and records actual success/failure. It transforms the WGS84 sample point into the documented native interrupted Goode homolosine projection, preserving native 250 m support. Never change the point while reusing another location's projected bounds.

## Input schema

Endpoint: `https://maps.isric.org/mapserv` with query parameters:

| Parameter | Value / meaning |
| --- | --- |
| `map` | `/map/phh2o.map`, property-specific map service |
| `SERVICE`, `VERSION` | `WCS`, `2.0.1` |
| `REQUEST` | `DescribeCoverage` for metadata or `GetCoverage` for raster |
| `COVERAGEID` | `phh2o_0-5cm_mean`: property, depth, statistic |
| Repeated `SUBSET` | `X(min,max)` and `Y(min,max)` in declared native meters in this runner |
| `FORMAT` | `image/tiff` for science data |

[WCS request-as-JSON schema](../../api-schemas/wcs-request.schema.json) describes the query-building object; the wire protocol is HTTP query parameters, **not** a JSON POST. Actual requests encode both SUBSET parameters separately. Future geographic subsetting must state CRS/axis conventions rather than treating native meters as degrees.

## Output schema

`DescribeCoverage` returns XML with CoverageId, grid geometry/CRS, origin, offsets and range metadata. `GetCoverage` returns a GeoTIFF with CRS/transform, grid shape, numeric property samples and nodata; an XML ExceptionReport is an error, even under HTTP 200. The runner checks binary signatures and opens the raster before counting success. `[sourceId, status, artifacts]` in the manifest are **our access record**, not SoilGrids' science response.

During probing, the generic WCS range XML advertised an implausible radiance unit for the pH coverage. Do not trust that generic `swe:uom` field as soil semantics; use ISRIC's property dictionary, preserve the discrepancy, and require review before calculations.

| Property | Published mapped -> conventional conversion |
| --- | --- |
| `phh2o` | pH×10 divided by 10 -> pH |
| `clay`, `sand`, `silt` | g/kg divided by 10 -> percent |
| `soc` | dg/kg divided by 10 -> g/kg |

Store top/bottom depth and statistic (`mean`, median or quantile) independently. The sample only requests pH mean at 0–5 cm; it does **not** download a complete texture/carbon/rooting profile. Expand properties/depths once the pilot is chosen and service works. Preserve prediction uncertainty layers when relevant. Depth means need thickness weighting and property-appropriate methods. Lab/farmer evidence is a separate source, never silently overwritten by a raster prediction. pH alone cannot establish salinity or hydraulic storage.
