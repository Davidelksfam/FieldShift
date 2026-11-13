# Contributing to the Field Shift pivot

Read [AGENTS.md](AGENTS.md), [status](docs/STATUS.md) and [workstreams](docs/team/WORKSTREAMS.md) first.

## One task, one branch, one review

1. Open or claim a GitHub issue with goal, owner, reviewer, allowed files, acceptance criteria and dependencies.
2. Base a separate branch/worktree on `chore/clean-slate-new-direction-2026-11-13` during pivot planning. Examples: `docs/new-product-proposal`, `data/source-comparison`, `chore/team-setup`.
3. Keep changes scoped. Shared specs, contracts, GitHub workflows, lockfiles and global UI files need integration-lead coordination.
4. Record datasets and factual claims with links, dates, limitations and evidence, never unsupported certainty.
5. Run `python3 scripts/check_repository.py` and relevant task-specific checks; describe anything not run.
6. Open a pull request **targeting the pivot branch**, attach evidence and use the PR template. Obtain teammate review for shared assumptions and contracts.
7. If unfinished, publish a handoff using [the template](docs/team/HANDOFF_TEMPLATE.md).

Only after the team approves the new plan should it decide how to merge the pivot into `main`. Do not delete or rewrite the previous work to accomplish that. Prefer explicit decisions over divergent agent instructions.

## Files and datasets

Do not commit secrets, private participant information, raw/bulk satellite downloads or unexplained sample data. Keep source evidence and provenance when proposing a dataset. Synthetic inputs must be clearly marked, and claims about outputs must match validation actually performed.
