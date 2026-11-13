# Product proposal: Rotation Rehearsal

Status: proposed, derived from strategy guide §§5–9 and 11; team acceptance pending.

## User and outcome

An Arabic-speaking farmer in one pilot locality compares a current two-year crop sequence with two realistic alternatives, then reduces available irrigation to see which constraints and trade-offs change. An English switch supports judges. Pilot locality, specific crops and local units remain undecided.

## Four-screen flow

1. **My Field:** location/sample, prior crops, soil information, water budget, restrictions and priorities. “I don't know” is valid; distinguish farmer inputs from inferred data.
2. **Compare Rotations:** baseline plus lower-water and balanced/cover-focused alternatives on aligned seasonal timelines. Explain infeasibility before ranking.
3. **Test Conditions:** water-budget control and explicitly hypothetical scenarios update feasibility and explain changes.
4. **Why This Plan?:** source, observation period, native spatial scale, transformations, assumptions, limitations and next useful question.

Use mobile-friendly Arabic RTL, English LTR, clear units and conversions, readable labels independent of color, large controls and a shareable/printable summary. Do not decide brand styling yet.

## Proposed MVP acceptance criteria

- [ ] One named pilot locality, crop catalog and two-year season calendar reviewed for local suitability.
- [ ] Baseline plus two feasible alternatives; if insufficient candidates exist, explain that honestly rather than inventing plans.
- [ ] Verified eligible NASA input materially changes or supports a calculation.
- [ ] Soil/farmer constraints and unknowns are labeled; invalid choices have explicit reasons.
- [ ] Reproducible water scenario demonstrates a constraint or preference change.
- [ ] Each numerical result exposes provenance, scale, assumptions and caveats.
- [ ] Cached real-data demo works when remote services fail; mock data is labeled separately.
- [ ] Independent numerical check and agronomic review documented.
- [ ] Arabic RTL/mobile and English judging path checked end to end.

## Boundaries

Avoid global coverage, a generic LLM agronomist, training “best rotation” ML without labels, guaranteed water savings/yields/profits, and unsupported soil-health scores. Historical replay and sensitivity are not forecasting or probability of agricultural success. Prioritize evidence labeling, then ranking stability, then a rule-based next useful question.

Evidence labels: farmer-provided, satellite-derived, model-estimated, agronomic rule, unknown. Meteorological model data must be described accurately rather than mislabeled as direct satellite measurements.
