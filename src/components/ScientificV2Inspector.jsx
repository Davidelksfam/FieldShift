import { useMemo, useState } from "react";
import { text } from "../i18n";
import { analyzeRotations } from "../engine/engineAdapter";
export default function ScientificV2Inspector({
  lang,
  data,
  inputs,
  crops,
  location,
}) {
  const [version, setVersion] = useState("legacy"),
    [niliMode, setNiliMode] = useState("off"),
    [goal, setGoal] = useState("water"),
    [scenarioText, setScenarioText] = useState(
      JSON.stringify(
        {
          scenario: {
            type: "historical",
            year: 2025,
            horizon: { start: "2025-01-01", end: "2025-12-31" },
          },
          sourceRegistry: {},
        },
        null,
        2,
      ),
    ),
    t = (en, ar) => text(lang, en, ar);
  const inspection = useMemo(() => {
    if (version !== "scientific-v2") return { result: null, error: null };
    try {
      const config = JSON.parse(scenarioText);
      if (!config || typeof config !== "object" || Array.isArray(config))
        throw new Error("Expected an object.");
      return {
        result: analyzeRotations({
          engineVersion: version,
          experimentalEnabled: true,
          data,
          farmerInputs: { ...inputs, niliMode, goal },
          cropCatalog: crops,
          location,
          scenario: config.scenario,
          sourceRegistry: config.sourceRegistry,
          cropCalendars: config.cropCalendars,
        }),
        error: null,
      };
    } catch (error) {
      return { result: null, error: error.message };
    }
  }, [version, data, inputs, crops, location, niliMode, goal, scenarioText]);
  const { result, error } = inspection;
  const statusText = (value) =>
    ({
      unknown: t("Unknown", "مجهول"),
      feasible: t("Feasible", "ممكن"),
      infeasible: t("Infeasible", "غير ممكن"),
      conditional: t("Conditional", "مشروط"),
      unavailable: t("Unavailable", "غير متاح"),
      no_supported_recommendation: t(
        "No supported recommendation",
        "لا توجد توصية مدعومة",
      ),
    })[value] ?? value;
  return (
    <section
      className="panel indices-panel v2-inspector"
      aria-labelledby="v2-inspector-title"
    >
      <h2 id="v2-inspector-title">
        {t("Scientific V2 · experimental inspection", "V2 العلمي · فحص تجريبي")}
      </h2>
      <p>
        {t(
          "Historical research inspection. Release gates are pending. Missing crop dates, stages or sources remain unknown; this does not approve a planting plan.",
          "فحص بحثي تاريخي. بوابات الإصدار لم تُجتز. مواعيد المحاصيل ومراحلها ومصادرها الناقصة تظل مجهولة؛ هذا ليس اعتماداً لخطة زراعة.",
        )}
      </p>
      <label className="field-label">
        {t("Inspection engine", "محرك الفحص")}
        <select
          aria-label={t("Inspection engine", "محرك الفحص")}
          value={version}
          onChange={(e) => setVersion(e.target.value)}
        >
          <option value="legacy">
            {t(
              "Legacy · current demo unchanged",
              "المحرك السابق · العرض الحالي بدون تغيير",
            )}
          </option>
          <option value="scientific-v2">
            {t("Scientific V2 · not released", "V2 العلمي · غير مُصدر")}
          </option>
        </select>
      </label>
      {version === "scientific-v2" && (
        <>
          <label className="field-label">
            {t("V2 Nili mode", "وضع النيلي في V2")}
            <select
              aria-label={t("V2 Nili mode", "وضع النيلي في V2")}
              value={niliMode}
              onChange={(e) => setNiliMode(e.target.value)}
            >
              <option value="off">{t("Off", "إيقاف")}</option>
              <option value="explore">
                {t("Explore optional Nili", "استكشاف النيلي الاختياري")}
              </option>
              <option value="require">
                {t("Require verified Nili", "اشتراط نيلي مثبت")}
              </option>
            </select>
          </label>
          <label className="field-label">
            {t("V2 goal", "هدف V2")}
            <select
              aria-label={t("V2 goal", "هدف V2")}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
            >
              <option value="water">
                {t("Comparable water", "مياه قابلة للمقارنة")}
              </option>
              <option value="soil">
                {t("Qualitative soil evidence", "أدلة تربة وصفية")}
              </option>
              <option value="market">
                {t("Economics availability", "توفر الاقتصاديات")}
              </option>
            </select>
          </label>
          <details>
            <summary>
              {t(
                "Historical scenario and sources (advanced JSON)",
                "السيناريو التاريخي والمصادر (JSON متقدم)",
              )}
            </summary>
            <p>
              {t(
                "The 2025 horizon is a historical scenario, not a forecast. Supply scenario.cropPlans with intended use, actual dates, four growthStagesDays, prepBufferDays and inputSourceIds; sourceRegistry must describe the actual recorded inputs. Complete rotation water also needs explicit planning-horizon provenance. No dates or measurements are prefilled.",
                "أفق ٢٠٢٥ سيناريو تاريخي وليس توقعاً. أدخل استخدام المحصول والتواريخ الفعلية ومراحل النمو الأربع وفترة التجهيز ومعرفات المصادر في scenario.cropPlans، ووثّق المدخلات الفعلية في sourceRegistry. مياه الدورة الكاملة تحتاج أيضاً توثيق أفق التخطيط. لا تُملأ تواريخ أو قياسات افتراضية.",
              )}
            </p>
            <textarea
              aria-label={t(
                "Historical scenario JSON",
                "JSON السيناريو التاريخي",
              )}
              dir="ltr"
              rows={12}
              style={{ width: "100%", maxWidth: "100%" }}
              value={scenarioText}
              onChange={(e) => setScenarioText(e.target.value)}
            />
          </details>
        </>
      )}
      {error && (
        <p role="alert">
          {t("Scenario rejected: ", "تم رفض السيناريو: ")}
          {error}
        </p>
      )}
      {result && (
        <>
          <p role="status">
            {lang === "ar"
              ? result.recommendation.reasons[0].ar
              : result.recommendation.reasons[0].en}
          </p>
          <p>
            {t("Experimental status", "الحالة التجريبية")}:{" "}
            {statusText(result.recommendation.status)} · {t("Feasible", "ممكن")}
            : {result.candidateAudit.feasibleCount} · {t("Unknown", "مجهول")}:{" "}
            {result.candidateAudit.unknownCount}
          </p>
          {result.recommendation.selectedId && (
            <p>
              {t("Conditional model candidate", "مرشح النموذج المشروط")}:{" "}
              {result.recommendation.selectedId}
            </p>
          )}
          <p aria-label={t("V2 baseline reference", "مرجع الأساس في V2")}>
            {t("Current rotation reference", "مرجع الدورة الحالية")}:{" "}
            {result.comparisonAudit.baselineReference
              ? `${result.comparisonAudit.baselineReference.id} · ${result.comparisonAudit.baselineReference.quantity.value.toFixed(1)} ${result.comparisonAudit.baselineReference.quantity.unit}`
              : t(
                  "Unavailable or not comparable; no difference is claimed.",
                  "غير متاح أو غير قابل للمقارنة؛ لا يُدّعى وجود فرق.",
                )}
          </p>
          <ul aria-label={t("V2 alternatives", "بدائل V2")}>
            {result.alternatives.map((alternative) => (
              <li key={alternative.id}>
                <strong>
                  {alternative.cropIds
                    .map((id) => {
                      const crop = crops.find((x) => x.id === id);
                      return lang === "ar"
                        ? (crop?.nameAr ?? id)
                        : (crop?.nameEn ?? id);
                    })
                    .join(" → ")}
                </strong>
                <p>
                  {t("Calendar", "المواعيد")}:{" "}
                  {statusText(alternative.feasibility.status)} ·{" "}
                  {t("Reference crop ETc", "ETc مرجعي للمحصول")}:{" "}
                  {alternative.water.etcMm.status === "available"
                    ? `${alternative.water.etcMm.value.toFixed(1)} ${alternative.water.etcMm.unit}`
                    : t("Unavailable", "غير متاح")}
                </p>
                {alternative.modeledDifference && (
                  <p>
                    {t(
                      "Modeled difference from current rotation (not measured savings)",
                      "فرق النموذج عن الدورة الحالية (ليس وفراً مقاساً)",
                    )}
                    : {alternative.modeledDifference.value.toFixed(1)}{" "}
                    {alternative.modeledDifference.unit}
                  </p>
                )}
                <p>
                  {alternative.water.reasons
                    .map((r) => (lang === "ar" ? r.ar : r.en))
                    .join(" ")}
                </p>
                <p>
                  {t("Needs evidence", "يحتاج أدلة")}:{" "}
                  {alternative.missingEvidence.join(", ") ||
                    t("See trace", "راجع التتبع")}
                </p>
              </li>
            ))}
          </ul>
          <pre
            className="pipeline-json"
            aria-label={t(
              "Scientific V2 JSON output",
              "مخرجات V2 العلمية JSON",
            )}
            dir="ltr"
          >
            {JSON.stringify(result, null, 2)}
          </pre>
        </>
      )}
    </section>
  );
}
