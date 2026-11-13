# First implementation checkpoint

Working recommendations, 13 November 2026. User asked to resolve the fixture/data handoff and delegated crop-shortlist research to the assistant. These are implementation recommendations, not locally validated crop advice or a record of approval by all workstream owners.

## Recommended crop scope

Start with **wheat, maize and faba bean**. Wheat and maize supply winter/summer cereal baselines; faba bean supplies a winter grain-legume comparison. Add **berseem** later when cutting dates and forage management are represented. This is a choice to keep the first implementation small, not a ranking of agricultural profitability, water savings or field suitability.

[FAO's Egypt production-systems chapter](https://www.fao.org/4/y5863e/y5863e07.htm) supports their broad seasonal membership. It is historical national evidence, not a current Fayoum/Delta planting prescription. Exact local sowing windows, varieties, durations and rotation rules still need review. The [machine-readable shortlist](../../data/manifests/crop-shortlist.proposed.json) records these missing fields as null and keeps every crop modelEnabled=false.

Rice, cotton, vegetables and perennial crops are outside the initial implementation scope. This keeps locality/eligibility checks, commodity-specific management and more complex calendars out of the first calculation path; it does not assert that those crops are unsuitable everywhere. Do not create three ranked alternatives simply by asserting that one listed crop uses less water.

## Working input defaults

Use the six prompts in [the fixture specification](FIXTURE_SPEC.md): field location, area, previous crops, irrigation method, water volumes per defined window and crop exclusions. Optional baseline and objective remain optional. Water is m3 at the field inlet; area is hectares; unknown is distinct from zero. The existing three synthetic input cases remain the frontend/request preparation examples. Real farmers' coordinates and budgets must not be published in Git.

The proposed crop shortlist is a separate research artifact. Do not replace synthetic crop IDs in interface fixtures with real crop IDs and assume that makes them agronomically valid.

## The real-data handoff now exists

[Four research context records](../../web/public/data/context-proposal/README.md) derive annual weather summaries from two already imported POWER query points, one in each region, for 2024 and 2025. These are real historical gridded weather inputs with a **proposed** output shape. They are separate from synthetic farmer fixtures and cannot describe a farmer's field unless spatial matching is explicitly performed.

Each metric now carries its own value, unit, status, data origin, calculation method, source references, valid/expected days, coverage and missing reason. The [proposed context schema](fixture-proposal/environmental-context.schema.json) and [reproducible builder](../../scripts/data/build_weather_context.py) are review artifacts; shared contracts/seasonal-features.v1.schema.json remains unchanged. sourceRefs resolve to input CSV/metadata hashes and the parent native-artifact checksum and source URL.

The initial publication rule requires complete daily coverage for both mean temperature and rainfall. With missing days, value is null and observedValue reports the available-day diagnostic summary with coverage. Heat exposure remains null pending a crop-specific method. No output contains irrigation demand, feasibility or a score, and decisionReady remains false.

Example reproduction from the repository root:

```sh
python3 scripts/data/build_weather_context.py --csv web/public/data/regions/20261113T123805653050Z/egypt-fayoum-power-30.75-29.55.csv --start 2024-01-01 --end 2024-12-31 --output web/public/data/context-proposal/egypt-fayoum-2024.json
python3 scripts/data/validate_fixture_proposal.py
python3 -m unittest discover -s tests/data -p 'test_*.py'
python3 scripts/data/validate_regions.py
python3 scripts/check_repository.py
```

The JSON Schema command requires jsonschema. Application/consumer schema validation must use the proposed schema with date-format checking plus the semantic checks exercised by the data tests. This handoff is not silently compatible with the old SeasonalFeatures payload: integration must review a named new version and update producers/consumers together.

## Calendar and water-method decisions

2024–2025 contains two complete calendar years, not automatically two complete winter/summer agricultural cycles. A winter crop planted in late 2023 and harvested in 2024 needs 2023 inputs; a crop planted in late 2025 and harvested in 2026 needs 2026 inputs. Keep those periods incomplete unless acquisition is explicitly extended. The first real-data crop replay should use a complete locally reviewed cycle inside the available interval; annual context records are not crop-season features. Do not change the user-confirmed archive scope or invent missing winter data.

For later water-demand work, use [FAO Irrigation and Drainage Paper 56](https://www.fao.org/4/x0490e/x0490e00.htm) as the method foundation: reviewed reference ET, stage-specific crop coefficients and a soil-water/rainfall accounting method. ETc is not field-inlet irrigation demand. Effective rainfall, soil-water storage, losses and management assumptions must be defined before comparing with the farmer's supply. POWER radiation, humidity and wind remain available for this next task; no efficiency or crop coefficient is currently invented or computed.

## What each role can implement next

| Role | Concrete next handoff | Current gate |
| --- | --- | --- |
| Integration | Review input proposal and context proposal as separately versioned contracts; align consumer types | Review pending; no silent replacement |
| Data | Use existing imports, hashes and date/QA status; resolve native spatial support before assigning context to a farm | Query-point context available; field matching pending |
| Feature | Reproduce temperature/rainfall summaries, then apply reviewed crop intervals | Real examples and missingness behavior implemented |
| Model/domain | Fill local crop windows, duration, rotation and water-method evidence for the three core crops | Crop rules remain unavailable; suitability/water checks unknown |
| Frontend | Wire known/unknown/zero synthetic forms and render real research context separately | No recommendations or real farmer persistence implied |
| UI/UX | Explain input origin, unknown states, scale and observation dates using approved brand guidance | Avoid presenting historical point context as live farm readings |

No source-data import or form-completeness check should produce a successful crop-feasibility result by itself. The next scientific deliverable is the reviewed three-crop calendar/rule sheet; the next integration deliverable is a contract review using the files in this checkpoint.
