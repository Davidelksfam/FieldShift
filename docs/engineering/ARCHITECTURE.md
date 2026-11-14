# Client-first SPA architecture

Accepted in [decision 0003](../decisions/0003-client-first-egypt-dashboard.md); complete instructions in [blueprint](../../IMPLEMENTATION_PLAN.md).

`App.jsx` owns location, farmer inputs, language and source state. Preset or map selection synchronously loads local data and starts a cancellable service request. The service runs climate, soil and NDVI jobs under one global deadline, preserving successful partial results and returning normalized inputs/provenance. A memoized pure engine calculates diagnostics and three stable strategy identities with explicit ranks. Components render the comparison and supporting evidence.

Vite/React + Tailwind/Lucide handle UI; Leaflet/react-leaflet displays Esri and NASA GIBS rasters; Recharts presents historical series and a labeled hypothetical cover curve. Local fonts and canonical brand tokens support Arabic RTL and English. Numeric charts/maps remain LTR.

No backend or credentials are needed. localStorage holds seven-day source caches; a generated service worker precaches the production shell for offline reload after first use. Remote map tiles are excluded. Storage/private mode failure leaves bundled fixtures available. New location effects abort previous requests and reject stale responses.

Tests exercise parsing/missingness, rule outputs and failures, then the production browser flow with blocked or mocked providers, language, responsive layouts, inputs/map, and offline reload. Build chunks separate map and chart libraries. No deployment is configured in this task.

## Farmer workspace revision

The default view is now a map and shared primary inputs above three numerical cards. `FieldLocation`, `FieldInputs`, `SourceStatus` and `ThreeStrategyComparison` consume the same App state and engine used by inline advanced analytics. Supported climate unlocks the farmer comparison; missing optional soil/NDVI inputs are omitted from `prepareComparisonData` and their diagnostics stay unavailable. Missing climate gates numbers until explicit illustrative acknowledgement; changing location resets that acknowledgement. Source jobs automatically retry transient failures within a bounded 90-second acquisition window; cold MODIS requests get up to 60 seconds per attempt and publish successful results immediately. A stalled primary soil source falls through to ISRIC after at most 2.5 seconds; stopping acquisition retains completed sources. Completed, validated MODIS batches are cached independently at exact URLs with original receipt times. Failed batches do not cancel the remaining MODIS batches; full-year QA/grid/calendar validation is still required. Manual retry remains optional. The old per-question journey and promoted result components were removed. [Current UX contract](../product/FARMER_FIRST_UX.md) records defaults and scientific limits.

## Unified farmer workspace redesign

The [unified workspace contract](../product/UNIFIED_FARMER_WORKSPACE.md) supersedes the previous separate farmer/Expert layout. App always renders location, visual crop/irrigation choices, visible field factors, shared priorities, the live-plan summary and numerical comparison. A single analytics disclosure reveals diagnostics, technical scores, satellite evidence and the pipeline below the planner. Opening it does not remount the location map or replace inputs. VisualChoice uses native radios; CropIcon and FieldIllustration provide locally bundled SVG artwork. The new scoped workspace stylesheet follows the existing brand tokens.
