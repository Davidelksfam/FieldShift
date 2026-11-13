# Current project status

Updated: 2026-11-13 (Africa/Cairo).

## Established context

- Team selected Field Shift for NASA Space Apps 2026 (user request).
- Zewail City/Giza, acceptance and six-person roster are team-reported in the original README, not independently verified event facts.
- Repository preparation and shared context are in scope. Workstream folder/ownership layout is authorized, with draft contracts and a synthetic test fixture. The user additionally requested bounded research data acquisition: see the [seven-source access kit](data/DATASET_ACCESS_GUIDE.md) and [actual status](data/DOWNLOAD_STATUS.md). No application code, live app/NASA integration, agronomic validation, deployment or final stack exists yet.
- User-approved light-green Field Shift brand guidance was merged separately through PR #4; the data integration preserves it.

## Proposed direction

Research acquisition now includes verified science downloads from all seven sources, exact access/provenance records and small inspection extracts. Authenticated retrieval succeeds; SMAP local retrieval, ECOSTRESS point nodata and HLS aerosol limitations remain visible in download status. A later SoilGrids 503 is retained alongside the earlier successful artifact. Small derived public inspection excerpts are labeled **not validated for decisions**. Shared application contracts, product decisions and brand files remain unchanged.

The supplied guide recommends “Rotation Rehearsal”: Arabic-first comparison of a two-year baseline plus two alternatives, feasibility before ranking, water stress testing and inspectable evidence. This is a proposal awaiting team acceptance, not an implemented feature or official requirement.

## Next actions

| Priority | Outcome | Owner | Completion evidence |
| --- | --- | --- | --- |
| P0 | Resolve event dates, kickoff and rules | Unassigned | Organizer/official source in verification register |
| P0 | Capture official challenge brief and eligible resource list | Unassigned | Exact links, checked date, reviewer |
| P0 | Accept/revise product, pilot area, crops and stack | Unassigned | Decision record and updated specs |
| P1 | Assign workstreams and agree data/model/UI contract | Unassigned | Issues and accepted architecture decision |
| P1 | Arrange local agronomic review | Unassigned | Reviewer consent and review notes |
| P1 | Adopt approved brand identity across future UI tasks | UI/UX + frontend workstreams | Canonical tokens and UI review checklist followed |

Implementation backlog and submission preparation: [delivery plan](delivery/PLAN.md). Unverified facts and conflicts: [verification register](challenge/VERIFICATION.md).


## Workstream layout prepared (organizational decision)

See [accepted directory decision](decisions/0001-workstream-directory-layout.md), [team ownership](team/WORKSTREAMS.md), [repository map](engineering/REPOSITORY_STRUCTURE.md) and [draft contracts](engineering/CONTRACTS.md). Actual named assignments, scientific definitions, implementation permissions and final stack remain pending. The `web/` folder is not yet runnable and no Vercel project was deployed.


Regional follow-up: the user selected **Nile Delta and Fayoum, 2024–2025**. See [regional coverage and import status](data/REGIONAL_COVERAGE.md). The earlier Giza snapshots are source-access evidence, not complete regional datasets.

All four regional Harmony jobs succeeded and 2,738 daily subsets were collected for IMERG/SMAP. Compact QA-derived calendars and monthly missingness are published; substantial SMAP QA gaps and 92 IMERG inventory-gap dates remain explicit. Six AppEEARS tasks are processing/queued. The [pipeline report](data/PIPELINE_REPORT.md) is also available as [PDF](data/PIPELINE_REPORT.pdf). No full production-readiness claim is made.

## Approved visual direction

See [decision 0002](decisions/0002-approved-light-green-identity.md) and the [brand guide](brand/README.md). Clean, light, white-card green-accented dashboard styling has user approval; product, data, model and event decisions remain separate and pending verification.

Fixture/data handoff: a separate [implementation checkpoint](data/IMPLEMENTATION_CHECKPOINT.md) proposes three core crops and per-metric context. Four real POWER query-point/year examples are available for review; local crop calendars, water-demand rules and acceptance of shared contract changes remain pending.
