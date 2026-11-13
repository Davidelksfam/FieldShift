export function explainStrategy(strategy, data, inputs, metrics) {
  const reasons = [];
  const add = (en, ar) => reasons.push({ en, ar });
  if (Object.values(data.sources ?? {}).some((s) => s.kind !== "observed"))
    add(
      "Low: at least one source is an illustrative fallback.",
      "منخفض: أحد المصادر على الأقل بديل توضيحي.",
    );
  if (inputs.landType === "new_sandy")
    add(
      "Desert-fringe land scenario: pixel mixing is possible, not detected or measured.",
      "سيناريو أرض على حافة الصحراء: اختلاط البكسل محتمل ولم يُقَس.",
    );
  if (metrics.summerObservationDays < 153)
    add(
      "Summer climate observations are incomplete.",
      "أرصاد المناخ الصيفية غير مكتملة.",
    );
  if (metrics.autumnMissingDays > 0)
    add(
      `${metrics.autumnMissingDays} autumn days lack accepted NDVI support.`,
      `${metrics.autumnMissingDays} يوم خريفي دون رصد NDVI مقبول.`,
    );
  if (metrics.canopyAnomaly.value === null)
    add(
      "Historical canopy anomaly is unavailable.",
      "شذوذ الغطاء النباتي التاريخي غير متاح.",
    );
  if (strategy.conditionalNili)
    add(
      "Nili crop dates are conditional and need local scheduling.",
      "مواعيد الغطاء النيلي مشروطة وتحتاج تخطيطاً محلياً.",
    );
  const confidence = Object.values(data.sources ?? {}).some(
    (s) => s.kind !== "observed",
  )
    ? "low"
    : reasons.length
      ? "medium"
      : "high";
  const ndviSource =
    data.sources?.ndvi?.kind === "observed"
      ? "MODIS NDVI"
      : "Illustrative NDVI fixture";
  const ndviSourceAr =
    data.sources?.ndvi?.kind === "observed"
      ? "MODIS NDVI"
      : "بيانات NDVI توضيحية";
  const source =
    data.sources?.climate?.kind === "observed"
      ? "NASA POWER"
      : "Illustrative climate fixture";
  const sourceAr =
    data.sources?.climate?.kind === "observed"
      ? "ناسا POWER"
      : "بيانات مناخ توضيحية";
  const summer = strategy.crops.find((c) => c.season === "Seifi");
  return {
    why: {
      en: `${source}: ${metrics.heatStressDays} days above 38°C in May–September (${metrics.julyHeatDays} in July). ${ndviSource}: longest observed autumn low-cover run ${metrics.bareSoilDays} days; ${metrics.autumnMissingDays} days unknown. ${summer.nameEn}: catalog heat threshold ${summer.heatThresholdC}°C; modeled N index ${strategy.nitrogenBalance}. ${strategy.crops.length === 3 ? "Conditional cover is included; planting dates must fit." : "Two-crop option avoids assuming an extra cover window."}`,
      ar: `${sourceAr}: ${metrics.heatStressDays} يوماً فوق ٣٨°م من مايو إلى سبتمبر (${metrics.julyHeatDays} في يوليو). ${ndviSourceAr}: أطول فترة خريفية مرصودة منخفضة الغطاء ${metrics.bareSoilDays} يوماً؛ ${metrics.autumnMissingDays} يوماً غير معلوم. ${summer.nameAr}: حد الحرارة في الدليل ${summer.heatThresholdC}°م؛ مؤشر النيتروجين المقدر ${strategy.nitrogenBalance}. ${strategy.crops.length === 3 ? "الغطاء مشروط بتوافق مواعيد الزراعة." : "خيار بمحصولين دون افتراض نافذة غطاء إضافية."}`,
    },
    confidence,
    confidenceReasons: reasons,
    confidenceMeaning: {
      en: "Heuristic data-support category, not a calibrated probability, field accuracy or agronomic approval.",
      ar: "فئة إرشادية لدعم البيانات وليست احتمالاً معايراً أو دقة حقلية أو اعتماداً زراعياً.",
    },
    checklist: strategy.crops.map((c) => ({
      en: c.riskNote,
      ar: c.riskNoteAr,
    })),
  };
}
