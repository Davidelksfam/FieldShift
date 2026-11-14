import { useState } from "react";
import { text } from "../i18n";
export default function PipelineExplorer({ lang, data, evaluation }) {
  const [step, setStep] = useState(0);
  const t = (en, ar) => text(lang, en, ar);
  const stages = [
    {
      name: t("1 · Field indices", "١ · مؤشرات الحقل"),
      input: t(
        "Cleaned daily climate, QA-screened NDVI, topsoil and farmer history.",
        "المناخ اليومي المنظف وNDVI المصفى والتربة وتاريخ المحاصيل.",
      ),
      formula:
        "HSD = count(Tmax > 38°C); BSW = longest consecutive autumn NDVI<0.22 support; Z = (2025 summer peak − historical peak mean) / sample SD; ET₀ = FAO-56 daily Penman–Monteith from separate weather drivers; EVPTRNS sums remain energy flux.",
      output: evaluation.diagnostics,
    },
    {
      name: t("2 · Candidates", "٢ · المرشحون"),
      input: t(
        "Catalog seasons, crop exclusions and historical low-cover proxy.",
        "مواسم الدليل والمحاصيل المستبعدة ومؤشر الغطاء المنخفض التاريخي.",
      ),
      formula:
        "Shitwi × Seifi × [optional Nili]; Low-cover proxy>32 suggests exploration only; explicit farmer opt-in requires conditional cover. Reject duplicate IDs, invalid water traits and farmer exclusions. Penalize cereals/salt/heat mismatches.",
      output: {
        generated: evaluation.candidateAudit.generated,
        retained: evaluation.candidateAudit.retained,
        coverRequired: evaluation.candidateAudit.coverRequired,
        rejected: evaluation.candidateAudit.rejected,
        calendarStatus: evaluation.candidateAudit.calendarStatus,
      },
    },
    {
      name: t("3 · MCDA ranking", "٣ · ترتيب MCDA"),
      input: t(
        "Farmer weights plus the stated strategy objective.",
        "أوزان المزارع إضافة إلى هدف الاستراتيجية المعلن.",
      ),
      formula:
        "Weighted subscore average − explicit penalties; target weight = max(farmer weights)+50; other weights unchanged. Distinct alternatives; no fabricated crop constants.",
      output: {
        farmerWeights: evaluation.effectiveWeights,
        waterWeights: evaluation.candidateAudit.waterWeights,
        soilWeights: evaluation.candidateAudit.soilWeights,
        waterRanking: evaluation.candidateAudit.waterRanking,
        soilRanking: evaluation.candidateAudit.soilRanking,
      },
    },
    {
      name: t("4 · Explanation", "٤ · تفسير النتائج"),
      input: t(
        "Selected sequences, source availability and metric coverage.",
        "الدورات المختارة وتوفر المصادر وتغطية المؤشرات.",
      ),
      formula:
        "Evidence template + High/Medium/Low data-support rules + crop verification checklist. No calibrated probability.",
      output: evaluation.strategies.map((s) => ({
        id: s.id,
        crops: s.crops.map((c) => c.id),
        explanation: s.explanation,
      })),
    },
    {
      name: t("5 · Farmer output", "٥ · مخرجات المزارع"),
      input: t(
        "Final comparison and traceable source provenance.",
        "المقارنة النهائية وأصل المصادر القابل للتتبع.",
      ),
      formula:
        "Gross m³/feddan = Σ(baseWaterMm×Kc)×4.2/η; savings = baseline − candidate. Prototype formula, not measured annual demand.",
      output: {
        centroid: { lat: data.lat, lon: data.lon },
        sources: Object.fromEntries(
          Object.entries(data.sources).map(([k, s]) => [
            k,
            { provider: s.provider, status: s.status, kind: s.kind },
          ]),
        ),
        hypotheticalSummerSwitch: {
          crops: evaluation.pitchCounterfactual.crops.map((c) => c.id),
          modeledWaterM3Feddan:
            evaluation.pitchCounterfactual.grossWaterM3Feddan,
          modeledSavingsM3Feddan:
            evaluation.pitchCounterfactual.waterSavedM3Feddan,
          status: evaluation.pitchCounterfactual.status,
        },
        strategies: evaluation.strategies.map((s) => ({
          id: s.id,
          crops: s.crops.map((c) => c.id),
          suitability: s.finalSuitability,
          modeledWaterM3Feddan: s.grossWaterM3Feddan,
          modeledSavingsM3Feddan: s.waterSavedM3Feddan,
          nitrogenIndex: s.nitrogenBalance,
        })),
      },
    },
  ];
  const selected = stages[step];
  return (
    <section
      className="panel pipeline-explorer"
      aria-labelledby="pipeline-title"
    >
      <h2 id="pipeline-title">
        {t(
          "Post-processing pipeline explorer",
          "مستكشف خط المعالجة بعد التنظيف",
        )}
      </h2>
      <p>
        {t(
          "Inspect the actual inputs, formulas and JSON behind this field.",
          "استعرض المدخلات والمعادلات وJSON الفعلية لهذا الحقل.",
        )}
      </p>
      <div
        className="pipeline-steps"
        aria-label={t("Pipeline stage", "مرحلة المعالجة")}
      >
        {stages.map((s, i) => (
          <button
            className={`button ${step === i ? "selected" : ""}`}
            aria-pressed={step === i}
            key={s.name}
            onClick={() => setStep(i)}
          >
            {s.name}
          </button>
        ))}
      </div>
      <article aria-live="polite">
        <h3>{selected.name}</h3>
        <p>{selected.input}</p>
        <p className="pipeline-formula" dir="ltr">
          {selected.formula}
        </p>
        <pre
          dir="ltr"
          tabIndex="0"
          aria-label={t("Stage JSON output", "مخرجات المرحلة بصيغة JSON")}
        >
          {JSON.stringify(selected.output, null, 2)}
        </pre>
      </article>
    </section>
  );
}
