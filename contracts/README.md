# Cross-language contract registry

Owned by the **integration lead**; every producer and consumer reviews relevant changes.

- `seasonal-features.v1.schema.json`: **draft** JSON Schema for environmental features produced by Python and consumed by TypeScript.
- `data/fixtures/seasonal-features.synthetic.v1.json`: clearly synthetic interface-only sample (not satellite data).
- Remaining contracts (`FieldInput`, `CropRule`, `RotationResult`, `EvidenceRecord`) are planned in `docs/engineering/CONTRACTS.md`; do not manufacture final interfaces until pilot and rule choices are agreed.

One version per breaking contract change. Do not duplicate manually edited schema definitions in multiple packages. Validate Python output against the canonical schema before publishing; integrate TypeScript validators or generated types once the app exists.
