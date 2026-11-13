# FieldShift planning workspace

The product question is “What can I grow next, why, and what trade-offs should I consider?” The interface uses five freely navigable destinations rather than a mandatory wizard. Arabic remains the default. Canonical logo, colors, typefaces and CSS tokens are unchanged.

## Navigation and state

`App.jsx` owns the selected step and visited steps alongside the existing location, inputs, evaluation and evidence state. Step changes focus the main heading and scroll to the start, with reduced-motion support. They never change model inputs or fetch dependencies. Back/next are optional; an invalid area keeps the farm editor accessible and suppresses the comparison until corrected.

- **Field:** one-click Fayoum demo, three benchmark regions, optional map and advanced coordinate disclosure. Preset selection continues to apply that preset's existing land/irrigation defaults. Crop choices, area and weights persist. The demo selects Fayoum while retaining those working farm choices; it does not reset the scenario.
- **Farm:** crop visuals paired with native accessible selectors, livestock, area, irrigation and reported soil/canal conditions. All settings remain visible on this dedicated page, including the optional laboratory ECe result added concurrently on main. This remains separate from the heuristic salinity screening.
- **Goals:** balanced (50/30/20), water (80/10/10), soil (20/70/10). These are UI shortcuts for the existing relative water/soil/market weights, not new engine objectives. Custom weights retain 0–100 ranges and the existing all-zero behavior. Conditional Nili exploration stays explicit.
- **Compare:** baseline and up to two engine-selected alternatives; all / current+water / current+soil views. Modeled demand, relative savings, nitrogen index and crop timeline precede expandable explanation, subscore and local-check sections. Published FAO reference disclosures and the uncalibrated-water notice from main remain available. Mobile also has a concise metrics table. No winner is called validated or optimal.
- **Evidence:** historical/source limitations first, field observations and missingness, six indices, charts and accessible tables, provenance, scale limitations. Judge Mode opens the charts and all five pipeline stages with the same JSON outputs.

Farm and goals include a model preview so edits have a visible effect without leaving the editor. Editing never causes a network refresh. The scenario review disclosure gives direct edit links to field, farm and goal settings.

## Components

| Component | Responsibility |
| --- | --- |
| `JourneyStepper` | Accessible desktop/sidebar, tablet row, mobile bottom navigation; selected step is `aria-current=step`. |
| `RegionSelector` | Distinct region cards with names, context and selection states. |
| `FarmerInputPanel` | Farm-only controls with native inputs, visible labels and units. |
| `CropVisual` | Crop-specific Lucide symbols; no additional imagery or licensing dependency. |
| `GoalSelector` | Presets, advanced weight editor, conditional Nili scenario. |
| `FieldSummary` | Expandable scenario review and edit links. |
| `ScenarioPreview` | Existing model scores, ranks and water demand while editing. |
| `StrategyComparison` | Full timeline/metric/explanation comparison and mobile summary. |
| Existing evidence components | Historical diagnostics, six indices, charts, source caveats and pipeline JSON; computation unchanged. |

All essential controls have 44px minimum targets, visible keyboard focus and selected/hover/press/disabled states. Maps and charts stay LTR inside RTL content. At extremely narrow reflow widths the bottom navigation uses two rows and the metrics table scrolls inside its own keyboard-focusable region.

Scenario edits survive step changes and language switches in the current session; this change does not introduce persistence across reloads. Remote imagery still requires connectivity. Existing offline shell and source fallback semantics remain unchanged.
