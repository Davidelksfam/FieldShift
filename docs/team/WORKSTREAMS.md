# Workstreams, ownership, and handoffs

**Status:** Repository workstream boundaries approved by user on 2026-11-13. Individual members are **not** assigned yet. The roster is in [TEAM.md](TEAM.md).

## Six proposed workstreams

| Workstream | Primary responsibility | Primary folders | Expected handoff |
| --- | --- | --- | --- |
| Integration lead / architect | Shared contracts, branch integration, CI, deployment, release readiness | `contracts/`, `docs/engineering/`, top-level configs, integration PRs | Approved contract versions and tested integrated demo |
| Data engineer | NASA retrieval, input cleaning, provenance and raw-data quality | `scripts/data/`, `data/manifests/` | Versioned, clean source data and reproducible acquisition instructions |
| Feature engineer | Compute seasonal indicators from cleaned data, quantify missingness and retain units | `scripts/features/`, `web/public/data/`, `tests/features/` | Validated, versioned JSON conforming to an approved contract |
| Model / domain engineer | Crop rotation feasibility, rules, ranking, scenario sensitivity and tests | `web/src/lib/rotation/` | Pure deterministic evaluation function and independently checked unit tests |
| Frontend developer | Pages, state, wiring, accessibility, integration with engine | `web/src/app/`, `web/src/hooks/`, `web/src/components/field/`, `rotations/`, `scenarios/` | Working four-screen journey with synthetic and then real fixtures |
| UI/UX developer | Design tokens, base components, chart/map visuals, responsive and RTL/LTR quality | `web/src/components/ui/` and coordinated visual changes | Accessible component primitives and documented UI conventions |

People may combine roles, but **each issue has one accountable owner** and one reviewer. All roles participate in QA/pitch; the scientific author must not be their sole numerical reviewer.

## Shared-file protocol

- `contracts/`, `web/src/lib/schemas/`, `web/package.json`, `web/package-lock.json`, `docs/engineering/ARCHITECTURE.md`, `docs/STATUS.md`, `.github/` and configuration files are **integration-controlled**.
- Propose changes to these in a small dedicated PR; notify downstream consumers before merging. No silent renaming or unit changes.
- Each person and each coding agent uses one issue, one branch or isolated worktree, and a bounded set of files. Never share an uncommitted checkout between agents.
- Contributors may read any directory; ownership means coordination/review, not an authorization boundary.
- Do not invent actual GitHub CODEOWNERS usernames until team assignments are confirmed.

## Task brief: required fields

1. Outcome and acceptance criteria (observable demo behavior or test).
2. Owner, reviewer, dependencies, and branch name.
3. Allowed files/directories; shared files needing approval.
4. Input contract and output contract with fixture paths.
5. Commands run, evidence, unresolved uncertainty, and handoff.

Use GitHub issues for assignments and the existing [handoff template](HANDOFF_TEMPLATE.md) when switching people/agents. A pull request must show test results, limitations, and any AI assistance.

## Team rhythm

- **Kickoff:** agree one pilot, frozen v1 schema draft, data ownership, and two realistic end-to-end checkpoints.
- **Parallel phase:** frontend/model/features use synthetic fixture; data engineer obtains real data with provenance.
- **Integration checkpoint:** first feature file passes schema checks; model produces a transparent result; frontend consumes it.
- **Release checkpoint:** run offline cached demo, unit/missing-data boundaries, Arabic/English and mobile; independently review scientific claims.
- **Freeze:** no new features until final submission, only verified fixes and pitch assets.

Current official event restrictions and dates remain to be verified in [challenge verification](../challenge/VERIFICATION.md). Do not interpret directory preparation as permission for competition implementation before kickoff.
