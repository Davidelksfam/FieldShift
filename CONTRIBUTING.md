# Contributing

Read [AGENTS.md](AGENTS.md) and [current status](docs/STATUS.md) first. Anyone using an agent that does not discover AGENTS.md automatically should explicitly include it in the task context.

## A small, reviewable contribution

1. Pick or open one issue with an outcome, owner, affected files, dependencies and acceptance criteria. Use the task template; no roles have been assigned automatically.
2. Update your local `main`, then branch: `git switch -c feat/short-task-name` (or `docs/`, `fix/`, `data/`). For concurrent agents use separate clones or worktrees, e.g. `git worktree add ../field-shift-task -b docs/task main`.
3. Read relevant canonical docs. Agree on input/output contracts before parallel implementation. Coordinate before changing shared status, contracts or lockfiles.
4. Make the smallest coherent change. Update evidence and docs with it. Keep large source data outside Git; track reproducible retrieval instructions and compact derived fixtures.
5. Run `python3 scripts/check_repository.py` and any implementation-specific checks available at that time. Record commands, results and omitted checks.
6. Open a pull request using the template. Link the issue and explain behavior, evidence, limitations and AI assistance. Obtain a teammate's review for shared interfaces and scientific assumptions; calculations need an independent check.
7. Resolve review, merge through GitHub, and update the task/handoff. Do not merge unrelated cleanup into a task.

## Documentation ownership

Official claims go in the verification register with exact source, checked date and scope. Proposals go in the relevant spec. Accepted material decisions get a decision record and linked spec update. Source snapshots stay unmodified; annotate them in their wrapper. Do not copy evolving requirements into multiple agent-specific files.

## Maintainer setup

Recommended GitHub settings: protect `main`, require pull requests and the `Repository checks / context` check, and block force-pushes. These settings are recommendations, not changes applied by this contribution. Add CODEOWNERS only after the team agrees real paths and reviewers; no owners are fabricated.

## Reporting a problem

Use the bug template with reproduction, expected behavior, observed result, environment, and safe logs. Report exposed credentials privately to the team lead and rotate them; never paste secrets in an issue.
