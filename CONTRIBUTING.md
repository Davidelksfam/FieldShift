# Contributing to Field Shift Egypt

Read the [accepted blueprint](IMPLEMENTATION_PLAN.md), [status](docs/STATUS.md), [agent instructions](AGENTS.md) and [workstreams](docs/team/WORKSTREAMS.md).

1. Scope work through a GitHub issue with a goal, owner/reviewer, files and acceptance criteria.
2. Use one branch per task, based on main now that PR #13 integrated the pivot. Open PRs against main; preserve historical branches.
3. Root `src/` contains the Vite SPA. Shared app configuration, contracts, workflows, brand tokens and schemas need coordinated review. `web/` is not a second application.
4. Keep source URLs, units, dates, spatial scale, missingness and provenance. Synthetic benchmarks must stay labeled, including in charts. The user-supplied scoring rules are prototype assumptions, not verified agronomic advice.
5. Run `npm ci`, `npm run check`, and, for UI/flow changes, `npx playwright install chromium` followed by `npm run test:browser`. CI runs the same checks. Report anything not run.
6. Use the PR template, link the issue and document limitations/AI assistance. Obtain teammate review before merging; no automatic main reset or deployment.

Do not commit API keys, private farmer data, raw satellite archives, node_modules or generated test/build artifacts. See [data plan](docs/data/DATA_PLAN.md) and [handoff template](docs/team/HANDOFF_TEMPLATE.md).
