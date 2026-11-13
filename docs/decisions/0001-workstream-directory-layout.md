# 0001 — Workstream directory layout

- **Status:** Accepted for repository organization (user instruction, 2026-11-13)
- **Date:** 2026-11-13
- **Scope:** Folder boundaries, contract governance and planned separation of data / feature / model / frontend work only.

## Context

The six-person team and its coding agents need ownership boundaries to work concurrently without merge conflicts. Existing documentation is the source of truth; only the organizer and official source can resolve event rules.

## Decision

Use the workstream and folder map in [repository structure](../engineering/REPOSITORY_STRUCTURE.md), with primary owners named by role rather than guessing which teammate owns each role. Adopt one schema owner and task branches/PR reviews. Maintain synthetic clearly labeled fixtures while components are developed independently.

## Non-decisions

This does **not** approve an exact application framework/version, external service, real-data source eligibility, agricultural coefficient, crop catalog, location, kickoff status, auth system, or production deployment. `web/` is a reserved directory; no runnable application is being asserted.

## Consequences

Improves parallel work and makes handoffs explicit. Before implementation: verify event rules, select pilot and technology stack, freeze reviewed contracts, assign actual member owners and ensure an independent scientific review.
