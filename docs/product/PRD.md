# Product scope — Field Shift Egypt

Accepted implementation scope: [decision 0003](../decisions/0003-client-first-egypt-dashboard.md) and [blueprint](../../IMPLEMENTATION_PLAN.md).

Egyptian farmers and extension engineers need to compare practical crop-rotation trade-offs when irrigation access, heat, soil condition and livestock priorities differ. The prototype connects a short farmer input panel and map centroid to historical satellite context, three transparent rule-based strategies and local verification checklists.

The complete demo path is region/map → farmer inputs → source/cache/fixture → diagnostics → baseline/water/soil comparison → evidence. Adjusting weights changes scores/ranks; crop and irrigation choices change modeled demand. Arabic RTL and English LTR share the same flow.

Success means the three regional demos remain usable under source failures, responsive inputs update coherent comparisons, provenance is visible and a judge can inspect data units and model limits. It does not mean scientific validation, guaranteed crop feasibility, profit/yield prediction or measured water savings.

Non-goals: accounts, backend infrastructure, field polygon analysis, production crop scheduling, live prices and fertilizer prescriptions. Review Nili windows, repeated legumes, EC/drainage and contracts with local extension engineers.
