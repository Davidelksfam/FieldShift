# Field Shift — clean-slate planning workspace

This is the **new-direction planning branch**, prepared after the team decided to reconsider its approach, product scope, datasets and implementation. It intentionally contains **no working application, selected datasets, accepted model, final tech stack, or new product plan**.

**Important:** The previous prototype, research outputs, draft schemas, brand implementation and reports are preserved in the repository's `main` branch and Git history. Their presence in history does **not** mean they are approved for this direction.

## Team starts here

1. [Current status and decisions needed](docs/STATUS.md)
2. [Contributor workflow](CONTRIBUTING.md) and [agent instructions](AGENTS.md)
3. [Workstreams and owners](docs/team/WORKSTREAMS.md)
4. [Product proposal template](docs/product/PRD.md)
5. [Dataset evaluation template](docs/data/DATA_PLAN.md)
6. [Architecture and contracts](docs/engineering/ARCHITECTURE.md)
7. [Milestones and delivery](docs/delivery/PLAN.md)

## Working agreement

- Plan first; no code or data integration is approved merely because a folder exists.
- Use GitHub Issues for scoped proposals; one branch/worktree per person or coding agent.
- While this pivot is being discussed, base task branches on `chore/clean-slate-new-direction-2026-11-13` and target their PRs at it, **not `main`**.
- Accept product, data, scientific claims and technical architecture through [decision records](docs/decisions/README.md), then update the canonical docs.
- The `web/`, `scripts/`, `contracts/`, `data/` and `tests/` folders are organizational placeholders only. Domain-specific folders inherited from the old structure are **not requirements** for the new project.

## Quick check

Run `python3 scripts/check_repository.py`. It verifies the planning skeleton and internal Markdown links, not a product build.

See the [documentation index](docs/README.md). No deployment is configured on this branch.
