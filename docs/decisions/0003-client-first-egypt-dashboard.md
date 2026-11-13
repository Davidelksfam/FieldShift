# 0003 — Client-first Egyptian rotation dashboard

Date: 2026-11-13. Status: accepted for implementation by the repository owner's direct instruction in this session. Review of the implementation remains through [issue #12](https://github.com/Davidelksfam/FieldShift/issues/12) and its PR.

The user's six-phase blueprint chooses Vite/React/Tailwind, Leaflet/GIBS, Recharts, three bounded source jobs and a deterministic rotation engine. This supersedes the blank planning status and prior seven-source/backend direction. Root `src/` is the canonical application; `web/` remains a historical organizational placeholder. The visual system is recovered from `docs/approved-light-green-brand-20261113`; see [0002](0002-approved-light-green-identity.md).

Implementation authority is not scientific validation. The nine crop records preserve the user's parameters without asserting they are exact validated FAO constants. No actual source payloads for the three presets were supplied, so bundled presets are explicitly synthetic fixtures. Real source responses carry individual provenance and can replace fixtures. This avoids presenting generated values as cached observations.

Two operational corrections follow inspected endpoint responses: split annual ORNL MODIS requests into <=10-composite batches, and label POWER EVPTRNS as energy flux in MJ/m²/day. Restrict bare-soil support to Sep–Nov, as required by the diagnostic's meaning. Explain that co-location is not downscaling. Display Nili sequences as conditional because crop windows overlap.

The supplied rule engine is for comparative exploration. It does not solve scheduling, validate crop feasibility, predict yield or estimate profit. Source access, model calibration, cultivar suitability and official challenge eligibility remain limitations documented in the [data plan](../data/DATA_PLAN.md) and [verification](../challenge/VERIFICATION.md).

Proceed phase by phase through [IMPLEMENTATION_PLAN.md](../../IMPLEMENTATION_PLAN.md), preserve branches/history and open a reviewable PR into the pivot branch. No merge or deployment is part of this change.
