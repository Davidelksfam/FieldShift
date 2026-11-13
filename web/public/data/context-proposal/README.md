# Real historical weather context — proposed handoff

These four JSON files contain actual aggregates of imported NASA POWER daily weather at two explicit sampling coordinates, one per study region, for 2024 and 2025. They are **not synthetic farmer fixtures**, field measurements, forecasts or crop recommendations. Each record includes its query coordinate, input hashes and processing semantics; no field matching has occurred. They do not represent region-wide means.

The output shape is [a proposal](../../../../docs/data/fixture-proposal/environmental-context.schema.json), not the accepted shared application contract. Annual observation periods are not Egyptian crop seasons. Both metrics require all expected daily inputs; missingness remains explicit. Heat exposure is unavailable until a reviewed crop threshold/method exists.

See the [implementation checkpoint](../../../../docs/data/IMPLEMENTATION_CHECKPOINT.md) and [builder](../../../../scripts/data/build_weather_context.py) for reproduction and next gates. The synthetic request examples remain separately under data/fixtures/proposed.
