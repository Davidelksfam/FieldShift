# 0004 — Historical low cover suggests exploration rather than requiring Nili

Status: implemented on the farmer-first feature branch; requires PR review, not field validation.

The user explicitly requested review of `bareSoilDays > 32`, with any change documented and covered by before/after tests. The audited engine used this pixel proxy to force all candidates to include Nili. Low vegetation cover cannot establish bare soil or compatible harvest and sowing dates at a farmer's field.

Keep the existing optional two-/three-crop candidate set whenever the farmer has not explicitly requested a cover scenario. Only `forceNiliCover` requires Nili. The proxy now supplies a separate exploration hint. All Nili sequences retain conditional calendar and pest cautions. MCDA, penalties, crop traits and irrigation efficiencies are unchanged.

Before editing, three regional outputs were captured from main commit `af705094984dd38e02360f50a90e4473620f27f3` in `tests/fixtures/pre-farmer-ux-baselines.json`. Dedicated tests in `tests/unit/nili-regression.test.js` check exact old outputs with equivalent explicit cover inputs, unchanged Fayoum output, candidate counts and exact new Delta/Nubariya outputs.

| Benchmark, original 50/30/20 weights | Old candidates | New candidates | Old water alternative | New water alternative |
| --- | --- | --- | --- | --- |
| Fayoum | 32 | 32 | faba bean / sesame | unchanged |
| Kafr El-Sheikh | 16 | 32 | faba bean / sesame / conditional cowpea | faba bean / sesame |
| Nubariya | 16 | 32 | faba bean / sesame / conditional cowpea | faba bean / sesame |

Explicit cover still produces 16 candidates. Without it, the soil-oriented alternative may still include a conditional cover when selected by the existing engine. This decision expands candidate eligibility; it does not validate any crop's planting dates or suitability.
