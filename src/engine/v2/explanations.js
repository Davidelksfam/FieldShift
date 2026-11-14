import { clone } from "./contracts.js";
/** Preserve model reasons and missingness rather than translating them into a score. */
export function explainAlternativeV2(alternative) {
  return {
    rationale: clone([
      ...(alternative.whyIncluded ?? []),
      ...(alternative.feasibility?.reasons ?? []),
      ...(alternative.water?.reasons ?? []),
    ]),
    caveats: clone([
      ...(alternative.feasibility?.assumptions ?? []),
      ...(alternative.water?.assumptions ?? []),
      ...(alternative.soil?.assumptions ?? []),
    ]),
    missingEvidence: [
      ...new Set([
        ...(alternative.missingEvidence ?? []),
        ...(alternative.water?.etcMm?.missingInputs ?? []),
        ...(alternative.soil?.missingFields ?? []),
        ...(alternative.economic?.missingInputs ?? []),
      ]),
    ],
    provenance: [
      ...new Set([
        ...(alternative.feasibility?.sourceIds ?? []),
        ...(alternative.water?.sourceIds ?? []),
        ...(alternative.soil?.sourceIds ?? []),
        ...(alternative.heat?.sourceIds ?? []),
        ...alternative.salinity.flatMap((x) => x.sourceIds ?? []),
      ]),
    ],
  };
}
