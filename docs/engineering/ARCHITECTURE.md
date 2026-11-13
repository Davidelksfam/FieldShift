# Client-first SPA architecture

Accepted in [decision 0003](../decisions/0003-client-first-egypt-dashboard.md); complete instructions in [blueprint](../../IMPLEMENTATION_PLAN.md).

`App.jsx` owns location, farmer inputs, language and source state. Preset or map selection synchronously loads local data and starts a cancellable service request. The service runs climate, soil and NDVI jobs under one global deadline, preserving successful partial results and returning normalized inputs/provenance. A memoized pure engine calculates diagnostics and three stable strategy identities with explicit ranks. Components render the comparison and supporting evidence.

Vite/React + Tailwind/Lucide handle UI; Leaflet/react-leaflet displays Esri and NASA GIBS rasters; Recharts presents historical series and a labeled hypothetical cover curve. Local fonts and canonical brand tokens support Arabic RTL and English. Numeric charts/maps remain LTR.

No backend or credentials are needed. localStorage holds seven-day source caches; a generated service worker precaches the production shell for offline reload after first use. Remote map tiles are excluded. Storage/private mode failure leaves bundled fixtures available. New location effects abort previous requests and reject stale responses.

Tests exercise parsing/missingness, rule outputs and failures, then the production browser flow with blocked or mocked providers, language, responsive layouts, inputs/map, and offline reload. Build chunks separate map and chart libraries. No deployment is configured in this task.
