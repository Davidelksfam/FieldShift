# Delivery plan

Status: proposed ordering; event timestamps remain unresolved. No assignments or completion claims are implied.

## Before implementation

Resolve official/local event rules, kickoff and deadlines; obtain the official brief and resources; confirm eligible input; accept scope, pilot and stack; assign owners; define shared contracts; identify local agronomic reviewers. Current repository work organizes research and coordination.

## Implementation backlog after kickoff is confirmed

| Order | Slice | Done when |
| --- | --- | --- |
| 1 | Real eligible NASA subset → feature → result | Reproducible cached feature with provenance affects one indicator |
| 2 | Constraints and candidates | Baseline plus alternatives; explicit rejection reasons; rule/unit checks |
| 3 | Four-screen flow | Input, comparison, scenarios and evidence work together in Arabic/English |
| 4 | Water scenario and sensitivity | Reproducible change in feasibility/ranking; boundaries tested |
| 5 | Scientific validation | Independent calculation, agronomic review and limits recorded |
| 6 | Integration and demo | Cached flow works without remote services; mobile/accessibility checked |
| 7 | Submission | Verified requirements met; links/assets/credits tested |

## Validation evidence to collect

Data versions, units, quality/missing values and coverage; independent calculation worksheet; agronomic review of windows/rules/sequences; budget/coefficient/weight sensitivity; usability check that a person can explain a plan and downside; NASA-vs-generic-input comparison. Record actual results rather than checking boxes in advance.

## Pitch proposal

One farmer's two-year decision → field and constraints → NASA evidence → three plans → reduce water budget → show the constraint change → open evidence and acknowledge uncertainty → show a validation result and next field-validation step. The guide suggests 2–3 minutes; the required duration is unverified.

## Submission preflight

- [ ] Official/local rules, eligible resources, exact deadline/timezone and format verified.
- [ ] Working demo plus fallback video/screenshots and cached data.
- [ ] Sources, licenses, attribution and required AI disclosures complete.
- [ ] No unsupported soil-health/yield/profit/probability claims.
- [ ] One named locality; crop sequences reviewed; constraints honored.
- [ ] Source, version, observation dates, grid scale and assumptions visible.
- [ ] Final URLs/files and English judging path tested.

Reported rubric pending verification: Impact, Creativity, Validity, Relevance, Presentation. Evidence for each is a concrete farmer decision, visible scenario change, audited methodology, meaningful NASA contribution and coherent demonstration.

## Parallel work checkpoints (after permission to implement)

1. **Shared interface checkpoint:** integration lead and workstream owners approve a pilot, contract versions, null/unit policy, synthetic fixtures, and task ownership.
2. **First vertical slice:** data engineer produces a documented cleaned input; feature engineer emits validated seasonal features; model engineer consumes the same fixture; frontend renders scenario comparisons against fixtures.
3. **Real-data handshake:** feature JSON passes reviewed schema; model and UI integration tests pass; NASA contribution to at least one indicator is documented.
4. **Frozen demo:** remove synthetic data from any real-result demo path; independent scientific check, full offline cached walkthrough, responsive/RTL/English verification, exact submission criteria.

Detailed responsibilities: [team workstreams](../team/WORKSTREAMS.md), [repository layout](../engineering/REPOSITORY_STRUCTURE.md), [contracts](../engineering/CONTRACTS.md). These are proposed tasks, not completed implementation.
