# Shared instructions for coding agents — new-direction planning branch

## Before every task

Read `README.md`, `docs/STATUS.md`, `CONTRIBUTING.md`, the assigned GitHub issue and the relevant focused docs. Inspect the selected branch and working tree first. Report your task scope, intended files, assumptions and acceptance criteria.

## Authority and status

This branch replaces the **working plan**, not repository history. No old product, dataset, model, technology, architecture, UI or schema is automatically approved. Do not revive old assumptions from `main` unless the team explicitly evaluates and accepts them. Treat all new specification text as a **proposal** until a decision record says otherwise. Prefer verified official challenge rules to unsourced claims; keep unknown facts labeled unknown.

## Collaboration

One contributor/agent, one task, one branch or isolated worktree. During pivot planning, branch from `chore/clean-slate-new-direction-2026-11-13` and open PRs **against that branch**. Follow the shared-file ownership rules in `docs/team/WORKSTREAMS.md`. Never reset/force-push `main`, overwrite someone else's work, silently change shared contracts, or merge unreviewed assumptions. Use `docs/team/HANDOFF_TEMPLATE.md` for incomplete work.

## Planning sequence

1. Verify the challenge and deadline requirements.
2. Write competing product approaches with measurable outcomes.
3. Audit candidate datasets: exact product, relevance, eligibility, access, coverage, units, granularity, missingness, licensing and provenance.
4. Decide the smallest demonstrable end-to-end path and what remains uncertain.
5. Choose a stack and define interface contracts *after* the product/data decision.
6. Implement in independent reviewed slices, with tests and clear evidence.

Do not silently scaffold a framework, select datasets or fabricate example scientific outputs as if they were real. Small synthetic fixtures may be added only when a proposal or contract is accepted, and must be explicitly labeled.

## Checks and handoff

Run `python3 scripts/check_repository.py` for documentation and structural edits, and report the actual output. Add task-specific checks when code is introduced. No claimed deployment, benchmark, scientific validity, field result, or dataset eligibility without evidence. Never commit API keys, credentials, private data or bulky raw downloads. Record material AI contributions in `docs/AI_USAGE.md`.
