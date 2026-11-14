# Scientific V2 PR 6 — validation and experimental release gates

## Changed files and purpose

- `tests/unit/v2-release.test.js`: explicit release-key/choice invariants and custom-point weather isolation.
- `tests/browser-v2/scientific-flow.spec.js`: warm offline reload followed by custom-field selection; no centroid driver substitution or unsupported winner.
- `package.json` and `.github/workflows/repository-checks.yml`: repeatable published water component checks and flagged browser suite in CI, alongside required default checks.
- [Scientific verification report](../validation/SCIENTIFIC_V2_VALIDATION.md), contracts, status and README: actual check results, fixed defects, evidence coverage, limitations and rollback.

## Assumptions, citations and examples

No agricultural parameter is introduced by this PR. Release-state test mutations and short-calendar numerical fixtures are explicitly software-only. The report links the FAO/Kew audits, gives exact example inputs/outputs and distinguishes modeled crop-only ETc from irrigation and measured consumption. Local calendar, whole-season water and independent agronomic gates remain pending.

## Tests

`npm run check`: 116 tests passed, production build and repository/link checker passed. `npm run validate:water-reference`: nine published component comparisons passed. Default production browsers: 10 passed. Flagged experimental browsers: four passed. All nine frozen legacy result hashes unchanged. The report records the scope and limits of these checks; no universal agricultural accuracy is asserted.

## Remaining limitations

The scientific release gates have not all passed. No production field-validated crop rotation, whole-season CROPWAT comparison, net irrigation model, calibrated nitrogen/economic optimum or custom-point ET0 acquisition is claimed. V2 remains experimental and the default farmer journey remains on legacy. This is an auditable software delivery with explicit scientific blockers, not a validated agronomic release.

## Rollback

Set `VITE_SCIENTIFIC_V2=false` or omit it and rebuild. Revert this PR to remove additional checks/reporting without changing data or legacy behavior. No merge, new backend or production deployment is performed here.
