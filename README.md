# Field Shift: Adapting Farms with NASA Data

Shared project context for our NASA Space Apps 2026 team at Zewail City, Giza, Egypt. This repository is the team's source of truth for planning, decisions, evidence, implementation, and handoffs.

**Stage:** research and repository preparation; no application has been implemented. **Working proposal:** an Arabic-first, evidence-aware crop-rotation planner, provisionally called “Rotation Rehearsal.” The team has not yet accepted a final product or technology stack.

## Start here

1. Read [AGENTS.md](AGENTS.md), the shared instructions for coding agents.
2. Read [current status and open questions](docs/STATUS.md).
3. Read the [challenge brief](docs/challenge/BRIEF.md) and [verification register](docs/challenge/VERIFICATION.md).
4. Read the [product proposal](docs/product/PRD.md), [data plan](docs/data/DATA_PLAN.md), and [architecture proposal](docs/engineering/ARCHITECTURE.md).
5. Follow [CONTRIBUTING.md](CONTRIBUTING.md); select a scoped task before editing.

## Context map

| Location | Purpose |
| --- | --- |
| [docs/README.md](docs/README.md) | Full documentation index and authority rules |
| [docs/reference/](docs/reference/README.md) | Unmodified supplied strategy guide and original README |
| [docs/team/TEAM.md](docs/team/TEAM.md) | Preserved roster and proposed workstreams |
| [docs/team/HANDOFF_TEMPLATE.md](docs/team/HANDOFF_TEMPLATE.md) | Context transfer between people and agents |
| [docs/decisions/](docs/decisions/README.md) | Accepted decisions and proposal template |
| [docs/delivery/PLAN.md](docs/delivery/PLAN.md) | Ordered backlog, validation and submission checklist |
| [docs/AI_USAGE.md](docs/AI_USAGE.md) | AI assistance and review disclosure log |
| [docs/brand/](docs/brand/README.md) | Approved light-green Field Shift brand, design rules and canonical CSS tokens |


## Repository checks

Requires Python 3.10+; no application dependencies are needed yet.

```sh
python3 scripts/check_repository.py
```

This checks local Markdown file links, required context files, approved brand presence/tokens, and the synthetic fixture. GitHub Actions runs the same check on pushes and pull requests. Build, app test, deployment, and data-processing commands will be documented when the team selects and implements a stack.

## Workstream folders and integration

The organizational layout is prepared for **data engineering**, **feature engineering**, **deterministic modeling**, **frontend**, **UI/UX**, and **integration**. No member assignments or application implementation are implied.

1. Read [workstream ownership](docs/team/WORKSTREAMS.md) and the [folder map](docs/engineering/REPOSITORY_STRUCTURE.md).
2. Review the draft [cross-team contracts](docs/engineering/CONTRACTS.md) and the clearly synthetic sample in `data/fixtures/`.
3. Select one GitHub issue, one branch/worktree, and task-scoped files; follow [contribution rules](CONTRIBUTING.md).
4. Do not begin live product coding until event restrictions and stack decisions are resolved.

`web/` is reserved for a future Vercel-friendly app, **not a runnable Next.js project yet**. No `package.json`, lockfile, NASA integration or deployment is claimed.
