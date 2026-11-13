import { text, formatNumber } from "../i18n";
export default function FieldIndicesPanel({ lang, diagnostics: d }) {
  const t = (en, ar) => text(lang, en, ar);
  const n = (v) => formatNumber(v, lang, { maximumFractionDigits: 2 });
  const entries = [
    [
      t("Seasonal reference ET₀", "البخر المرجعي الموسمي ET₀"),
      d.referenceEt0.status === "modeled"
        ? Object.entries(d.referenceEt0.seasonal)
            .map(([s, p]) => `${s}: ${n(p.sum)} mm`)
            .join(" · ")
        : t("Unavailable", "غير متاح"),
      t(
        "FAO-56 model using radiation, humidity, wind, pressure and temperatures; independent of EVPTRNS. Winter is a calendar-year proxy and windows overlap.",
        "نموذج FAO-56 باستخدام الإشعاع والرطوبة والرياح والضغط والحرارة، مستقل عن EVPTRNS. الشتوي تقريب لسنة تقويمية والفترات متداخلة.",
      ),
    ],
    [
      t("Summer heat stress", "الإجهاد الحراري الصيفي"),
      `${n(d.heatStressDays)} / ${n(d.summerObservationDays)}`,
      t(
        "Days above 38°C / valid summer days.",
        "أيام فوق ٣٨°م / أيام الصيف الصالحة.",
      ),
    ],
    [
      t("Longest autumn bare-soil proxy", "أطول فترة تربة مكشوفة محتملة"),
      `${n(d.bareSoilDays)} ${t("days", "يوماً")}`,
      t(
        `${d.bareSoilTotalDays} total low-cover days; ${d.autumnMissingDays} unknown. Gaps break runs.`,
        `${n(d.bareSoilTotalDays)} يوماً منخفض الغطاء إجمالاً؛ ${n(d.autumnMissingDays)} غير معلوم. الفجوات تقطع التتابع.`,
      ),
    ],
    [
      t("Canopy anomaly · ZNDVI", "شذوذ الغطاء · ZNDVI"),
      d.canopyAnomaly.value === null
        ? t("Unavailable", "غير متاح")
        : n(d.canopyAnomaly.value),
      t(
        `${d.canopyAnomaly.baselineYears.length} accepted baseline summers. A negative anomaly does not diagnose a cause.`,
        `${n(d.canopyAnomaly.baselineYears.length)} موسم صيفي مرجعي مقبول. الشذوذ السالب لا يشخص السبب.`,
      ),
    ],
    [
      t("Salinity/drainage screening", "فحص الملوحة والصرف"),
      `${n(d.salinityRisk)} / 100`,
      t(
        "Heuristic pH/clay/canal screening; NOT lab soil ECe or drainage. Only an optional separate ECe input supports FAO threshold comparison.",
        "مؤشر تقديري من pH والطين وموقع الترعة؛ ليس تحليل ECe معملياً أو قياس صرف. يوجد حقل ECe منفصل اختياري لمقارنة FAO.",
      ),
    ],
    [
      t("Baseline nitrogen context", "سياق النيتروجين الحالي"),
      `${n(d.nitrogen.cropBalance)} ${t("index points", "نقطة مؤشر")}`,
      t(
        `Soil N: ${n(d.nitrogen.soilNitrogenGkg)} g/kg; SOC: ${n(d.nitrogen.soilOrganicCarbonGkg)} g/kg. Adjusted index unavailable without calibration.`,
        `نيتروجين التربة: ${n(d.nitrogen.soilNitrogenGkg)} غ/كغ؛ كربون: ${n(d.nitrogen.soilOrganicCarbonGkg)} غ/كغ. المؤشر المعدل غير متاح دون معايرة.`,
      ),
    ],
  ];
  return (
    <details className="panel indices-panel">
      <summary>
        {t("Inspect all six field indices", "استعرض مؤشرات الحقل الستة")}
      </summary>
      <div className="indices-grid">
        {entries.map(([label, value, note]) => (
          <article key={label}>
            <h3>{label}</h3>
            <strong>{value}</strong>
            <p>{note}</p>
          </article>
        ))}
      </div>
    </details>
  );
}
