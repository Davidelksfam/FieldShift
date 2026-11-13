# Native API schemas

These Draft 2020-12 schemas describe the request-building objects and observed/documented response shapes used by the research data kit. They are **not** accepted feature/model/frontend contracts. No schema under `contracts/` is changed.

| Connection | Request object | Response |
| --- | --- | --- |
| POWER daily point | [Query schema](power-request.schema.json) | [Native JSON Feature schema](power-response.schema.json) |
| CMR collections/granules: IMERG, SMAP, HLS, ECOSTRESS | [Query schemas](cmr-request.schema.json) | [Catalog JSON schema](cmr-response.schema.json); science files are binary |
| ORNL MOD13Q1 subset | [Query schema](modis-request.schema.json) | [Native subset JSON schema](modis-response.schema.json) |
| SoilGrids WCS | [Query-building schema](wcs-request.schema.json) | DescribeCoverage XML / GetCoverage GeoTIFF, described in the [source guide](../sources/soilgrids/README.md) |

API query objects become URL query parameters via URL encoding; they are not JSON POST bodies. WCS SUBSET is repeated, not joined into one comma-separated parameter. Provider output schemas permit additional metadata fields so an additive provider update does not silently discard provenance.

Separate runner metadata schemas: [research request](../../../scripts/data/config/research-request.schema.json) and [access record](../../../scripts/data/config/access-record.schema.json).

Structural validation cannot verify physical units, date ordering, coordinate support, QA bits or response-array length relationships. The runner implements basic checks for the acquired samples; application feature semantics and scientific review remain future work. Always enable a JSON Schema format checker when checking ISO dates/URIs. Missing native science values can be numeric sentinels; normalize them before downstream publication.
