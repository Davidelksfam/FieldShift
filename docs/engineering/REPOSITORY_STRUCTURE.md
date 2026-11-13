# Contribution-oriented repository structure

This folder tree is a **collaboration scaffold**, not an architecture choice.

| Location | Provisional lane |
| --- | --- |
| `docs/product/`, `docs/challenge/`, `docs/delivery/` | Product/research and release coordination |
| `docs/team/`, `docs/decisions/`, `.github/` | Team coordination, review and accepted decisions |
| `docs/data/`, `data/`, `scripts/data/` | Source audit, acquisition and quality |
| `scripts/features/`, `tests/features/` | Data transformations and validation |
| `contracts/`, `tests/integration/` | Shared interface review and integration checks |
| `web/`, `web/src/components/ui/` | Future UX/frontend if a web UI is approved |
| `web/src/lib/`, `tests/` | Future logic and testing, subject to chosen stack |
| `docs/brand/` | Awaiting refreshed brand guidance |

Some inherited empty subdirectories mention older UI concepts (field/rotations/scenarios); **their names are not endorsed new features**. Rename or discard them after the new product architecture is accepted, rather than coding assumptions into them.

Owners and review boundaries: [workstreams](../team/WORKSTREAMS.md). No runnable application or pipeline is present.
