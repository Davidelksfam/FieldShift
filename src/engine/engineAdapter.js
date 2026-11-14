import { evaluateFieldAndRotations } from "./rotationEngine.js";
import { analyzeRotationV2 } from "./v2/index.js";
export const scientificV2Enabled = (value) =>
  value === true || value === "true";
export const SCIENTIFIC_V2_ENABLED = scientificV2Enabled(
  import.meta.env?.VITE_SCIENTIFIC_V2,
);
/** Only the explicitly enabled expert inspector can request incomplete V2. */
export function analyzeRotations({
  engineVersion = "legacy",
  experimentalEnabled = SCIENTIFIC_V2_ENABLED,
  data,
  farmerInputs,
  cropCatalog,
  ...v2Inputs
} = {}) {
  if (engineVersion === "legacy")
    return evaluateFieldAndRotations(data, farmerInputs, cropCatalog);
  if (engineVersion !== "scientific-v2")
    throw new TypeError("Unknown engine version.");
  if (!scientificV2Enabled(experimentalEnabled))
    throw new Error(
      "Scientific V2 is disabled. Set VITE_SCIENTIFIC_V2=true in an experimental build.",
    );
  return analyzeRotationV2({
    ...v2Inputs,
    farmerInputs,
    sourceProvenance: v2Inputs.sourceProvenance ?? data?.sources ?? {},
  });
}
