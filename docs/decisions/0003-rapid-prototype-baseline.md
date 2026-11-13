# 0003 — Rapid prototype baseline

Date: 2026-11-13 (Africa/Cairo). Status: implemented under the user's explicit request to build the full prototype and deploy to Vercel. This supersedes the preparation-only implementation scope for this task; it does not resolve official event eligibility or constitute agronomic validation.

Use Next.js App Router, React and TypeScript in `web/`, with project-local dependencies and a genuine lockfile. Use approved brand tokens, logo and self-hosted DM Sans / IBM Plex Sans Arabic fonts. The four-screen client workflow is My Field → Compare Plans → Test Conditions → Evidence. Arabic RTL is the default; English LTR is available.

Pilot: public Fayoum POWER query point at longitude 30.75, latitude 29.55. Imported weather spans 2024–2025; the UI summarizes calendar year 2025, with full source CSV downloadable. Regional soil and satellite sources remain evidence context; no farm boundary or field-pixel matching is implied.

The first interface supports editable illustrative crop sequences, explicit crop exclusions, date-overlap checks and hypothetical water arithmetic. Demonstration schedules, field inputs and complete-cycle demand amounts are synthetic interface assumptions, visibly separated from historical weather. Demand amounts do not change automatically when a crop changes. Disable demand assumptions or leave area/water unknown to see unavailable states. No crop suitability, efficiency, yield, profitability or scientific ranking is inferred. Local crop rule enablement remains false.

Save field inputs only to browser localStorage when explicitly requested by the user; provide JSON export of full rehearsal inputs, assumptions, results and source provenance. No farmer data is sent to a database. Cached public data permits use without NASA credentials at runtime. Deployment requires the user's connected Vercel team access; no credentials are embedded.

Keep this baseline reviewable and replace isolated prototype assumptions through later reviewed scientific and integration changes. Existing canonical contract drafts remain unchanged; the prototype boundary is documented in [the runbook](../engineering/PROTOTYPE_RUNBOOK.md).
