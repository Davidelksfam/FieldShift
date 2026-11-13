# Synthetic fixtures — cross-team test data

`seasonal-features.synthetic.v1.json` is intentionally fabricated for interface and failure-state testing. It follows the *draft* schema in `contracts/`. No values here are NASA readings, agronomic coefficients, forecast results, or recommended farming choices.

The team must replace the synthetic test path with separately validated, attributable real data before science claims or final judging.

A separate [input-freeze proposal](../../docs/data/FIXTURE_SPEC.md) adds three synthetic farmer-input cases under `proposed/`: known, unknown and zero water. Its draft schema lives with the proposal; it does not replace the canonical seasonal fixture or establish team agreement.
