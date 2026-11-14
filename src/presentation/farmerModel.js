// Presentation adapters only; all scoring and candidate selection stays in the engine.
export const GOALS = {
  water: {
    en: "Save irrigation water",
    ar: "أوفّر مياه الري",
    weights: { water: 70, soil: 20, market: 10 },
  },
  soil: {
    en: "Improve soil condition",
    ar: "أحافظ على خصوبة الأرض",
    weights: { water: 20, soil: 70, market: 10 },
  },
  market: {
    en: "Consider market / forage return",
    ar: "أراعي العائد والأعلاف",
    weights: { water: 20, soil: 20, market: 60 },
  },
};
export function selectGoal(inputs, goal) {
  return { ...inputs, goal, weights: { ...GOALS[goal].weights } };
}
export function areaWasEntered(inputs) {
  return (
    String(inputs.feddans ?? "").trim() !== "" ||
    Number(inputs.qirats ?? 0) !== 0
  );
}
export function areaIsValid(inputs) {
  const f = Number(inputs.feddans),
    q = Number(inputs.qirats);
  return (
    (String(inputs.feddans).trim() !== "" ||
      String(inputs.qirats).trim() !== "") &&
    Number.isFinite(f) &&
    f >= 0 &&
    f <= 100000 &&
    Number.isInteger(q) &&
    q >= 0 &&
    q <= 23 &&
    f + q / 24 > 0 &&
    f + q / 24 <= 100000
  );
}
export function evaluationInputs(inputs) {
  // The engine requires a positive scale. One feddan is a comparison basis,
  // never a claim about the user's field area. UI totals require explicit valid area.
  return areaIsValid(inputs) ? inputs : { ...inputs, feddans: 1, qirats: 0 };
}
export function proposedStrategy(evaluation) {
  return evaluation.strategies.find(
    (s) => s.id === evaluation.rankedStrategyIds[0],
  );
}
export function warningLayers(strategy, data, diagnostics) {
  const critical = strategy.warnings.filter((w) =>
    /measured soil ECe|Nili cover is conditional|no outcome-matched quantitative FAO salinity response/.test(
      w.en,
    ),
  );
  if (
    Object.values(data.sources).some(
      (s) => s.kind === "synthetic" && s.usedInComparison !== false,
    )
  )
    critical.unshift({
      en: "Some inputs are illustrative fallback data, not observations of your field. Review the evidence before planting.",
      ar: "بعض المدخلات بيانات توضيحية بديلة وليست أرصاداً لأرضك. راجع الأدلة قبل الزراعة.",
    });
  if (
    diagnostics.summerObservationDays < 153 ||
    diagnostics.autumnMissingDays > 0
  )
    critical.push({
      en: "Historical observations are incomplete; missing periods do not establish low risk.",
      ar: "الأرصاد التاريخية غير مكتملة؛ الفترات المفقودة لا تعني إن المخاطر قليلة.",
    });
  return {
    critical: [...new Map(critical.map((w) => [w.en, w])).values()],
    contextual: strategy.warnings.filter((w) => !critical.includes(w)),
  };
}

export function comparisonSourceSupport(data) {
  const missing = ["climate", "soil", "ndvi"].filter(
    (key) => data.sources?.[key]?.kind !== "observed",
  );
  // Climate drives heat penalties. Soil and NDVI only support optional diagnostics.
  return {
    missing,
    illustrative: missing.length > 0,
    blocked: missing.includes("climate"),
  };
}

export function prepareComparisonData(data, allowIllustrative = false) {
  if (allowIllustrative) return data;
  const result = { ...data, sources: { ...data.sources } };
  if (data.sources.soil.kind !== "observed") {
    result.soil = {
      clay: null,
      sand: null,
      phh2o: null,
      soc: null,
      nitrogen: null,
    };
    result.sources.soil = { ...data.sources.soil, usedInComparison: false };
  }
  if (data.sources.ndvi.kind !== "observed") {
    result.ndviSeries = [];
    result.ndviHistory = null;
    result.sources.ndvi = { ...data.sources.ndvi, usedInComparison: false };
  }
  return result;
}
