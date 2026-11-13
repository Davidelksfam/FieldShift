import { useEffect, useRef, useState } from "react";
import { Sprout, Droplets } from "lucide-react";
import { text, formatNumber } from "../../i18n";
import {
  GOALS,
  proposedStrategy,
  warningLayers,
  areaIsValid,
} from "../../presentation/farmerModel";
import FieldSummary from "./FieldSummary";
import AdditionalDetails from "./AdditionalDetails";
export default function RecommendationView({
  lang,
  evaluation,
  data,
  inputs,
  setInputs,
  onEdit,
  onMap,
}) {
  const t = (en, ar) => text(lang, en, ar),
    n = (v) => formatNumber(v, lang, { maximumFractionDigits: 0 });
  const [view, setView] = useState("recommendation"),
    [detailId, setDetailId] = useState(null);
  const title = useRef(null);
  const proposed = proposedStrategy(evaluation);
  const selected =
    evaluation.strategies.find((s) => s.id === detailId) || proposed;
  useEffect(() => {
    title.current?.focus();
  }, [view]);
  const category = (s) =>
    s.id === "baseline"
      ? t("Your current rotation", "دورتك الحالية")
      : s.id === "water"
        ? t("Water-oriented alternative", "بديل يراعي المياه")
        : t("Soil-oriented alternative", "بديل يراعي التربة");
  const sequence = (s) => (
    <ol className="farmer-crops">
      {s.crops.map((c) => (
        <li key={c.id}>
          <Sprout size={20} />
          <div>
            <small>
              {c.season === "Shitwi"
                ? t("Winter", "الشتوي")
                : c.season === "Seifi"
                  ? t("Summer", "الصيفي")
                  : t("Conditional Nili", "نيلي مشروط")}
            </small>
            <strong>{lang === "ar" ? c.nameAr : c.nameEn}</strong>
          </div>
        </li>
      ))}
    </ol>
  );
  const water = (s) => (
    <p className="modeled-water">
      <Droplets size={19} />
      <span>
        {s.id === "baseline"
          ? t("Current comparison basis", "مرجع المقارنة الحالي")
          : s.waterSavedM3Feddan > 0
            ? t(
                `${n(s.waterSavedM3Feddan)} less modeled water than your current rotation`,
                `${n(s.waterSavedM3Feddan)} مياه أقل في النموذج من دورتك الحالية`,
              )
            : s.waterSavedM3Feddan < 0
              ? t(
                  `${n(-s.waterSavedM3Feddan)} more modeled water than your current rotation`,
                  `${n(-s.waterSavedM3Feddan)} مياه أكثر في النموذج من دورتك الحالية`,
                )
              : t(
                  "Same modeled water as your current rotation",
                  "نفس كمية المياه في النموذج مقارنة بدورتك الحالية",
                )}
        <small>
          {t(
            "Model estimate · m³ / feddan / rotation",
            "تقدير النموذج · م³ / فدان / دورة",
          )}
        </small>
      </span>
    </p>
  );
  const cautions = (s) => {
    const { critical } = warningLayers(s, data, evaluation.diagnostics);
    return (
      <div className="farmer-cautions">
        {critical.map((w) => (
          <p key={w.en}>{lang === "ar" ? w.ar : w.en}</p>
        ))}
      </div>
    );
  };
  const details = (s) => (
    <>
      {sequence(s)}
      {water(s)}
      {cautions(s)}
      <p>
        {t(
          `Modeled gross water: ${n(s.grossWaterM3Feddan)} m³ / feddan / rotation.`,
          `إجمالي مياه الري في النموذج: ${n(s.grossWaterM3Feddan)} م³ / فدان / دورة.`,
        )}
      </p>
      {inputs.estimateArea && areaIsValid(inputs) && (
        <p data-testid="farmer-total">
          {t(
            `Whole field model estimate: ${n(s.totalFarmWaterM3)} m³ / rotation.`,
            `تقدير النموذج للأرض بالكامل: ${n(s.totalFarmWaterM3)} م³ / دورة.`,
          )}
        </p>
      )}
      <p className="small-note">
        {t(
          "Calculated from legacy crop-water constants and assumed irrigation efficiency. Not measured water, annual demand or validated savings. Verify crop dates, base water and irrigation efficiency; this model has no validated acceptable range.",
          "الحساب من ثوابت قديمة لمياه المحاصيل وكفاءة ري مفترضة. مش مياه مقاسة أو احتياج سنوي أو توفير معتمد. راجع المواعيد والمياه الأساسية وكفاءة الري؛ النموذج مالوش نطاق مقبول معتمد.",
        )}
      </p>
      <h3>{t("The trade-off", "المفاضلة")}</h3>
      <p>
        {s.nitrogenBalance > evaluation.strategies[0].nitrogenBalance
          ? t(
              "The crop mix has a higher modeled nitrogen balance than your current rotation; that is not a measured fertility improvement.",
              "توليفة المحاصيل ليها توازن نيتروجين أعلى في النموذج من دورتك الحالية؛ ده مش تحسن خصوبة مقاس.",
            )
          : t(
              "This option does not improve the modeled nitrogen balance over your current rotation.",
              "الخيار ده لا يحسّن توازن النيتروجين في النموذج عن دورتك الحالية.",
            )}
      </p>
      <h3>{t("Check locally before planting", "راجع محلياً قبل الزراعة")}</h3>
      <p>
        {t(
          "Confirm water availability, soil suitability, planting and harvest dates with a local extension engineer.",
          "اتأكد من توفر المياه وملاءمة التربة ومواعيد الزراعة والحصاد مع مهندس الإرشاد الزراعي.",
        )}
      </p>
      <ul>
        {s.explanation.checklist.map((c) => (
          <li key={c.en}>{lang === "ar" ? c.ar : c.en}</li>
        ))}
      </ul>
      <details>
        <summary>{t("Context and assumptions", "السياق والافتراضات")}</summary>
        <div className="details-body">
          {warningLayers(s, data, evaluation.diagnostics).contextual.map(
            (w) => (
              <p key={w.en}>{lang === "ar" ? w.ar : w.en}</p>
            ),
          )}
          <p>
            {t(
              "Market and forage scores are catalog assumptions, without live prices or validated farm economics. FAO references do not validate these rankings.",
              "درجات السوق والأعلاف افتراضات من الدليل، بدون أسعار حية أو اقتصاديات مزرعة معتمدة. مراجع FAO لا تعني اعتماد الترتيب.",
            )}
          </p>
        </div>
      </details>
    </>
  );
  return (
    <div className="farmer-results">
      <nav
        className="result-tabs"
        aria-label={t("Rotation comparison", "مقارنة الدورة")}
      >
        {[
          ["recommendation", "Proposed rotation", "الدورة المقترحة"],
          ["alternatives", "Compare options", "قارن الخيارات"],
          ["details", "Why this suggestion?", "ليه الاقتراح ده؟"],
        ].map(([id, en, ar]) => (
          <button
            key={id}
            className={`button ${view === id ? "selected" : ""}`}
            aria-current={view === id ? "page" : undefined}
            onClick={() => {
              setDetailId(null);
              setView(id);
            }}
          >
            {t(en, ar)}
          </button>
        ))}
      </nav>
      <section className="panel recommendation" aria-labelledby="result-title">
        <div className="eyebrow">
          {t(
            "PLANNING COMPARISON · NEEDS LOCAL REVIEW",
            "مقارنة للتخطيط · تحتاج مراجعة محلية",
          )}
        </div>
        <h2 id="result-title" ref={title} tabIndex="-1">
          {view === "recommendation"
            ? t("A proposed rotation for your goal", "دورة مقترحة حسب هدفك")
            : view === "alternatives"
              ? t("Compare other options", "قارن الخيارات التانية")
              : t("Why this suggestion?", "ليه الاقتراح ده؟")}
        </h2>
        {view === "recommendation" && (
          <>
            <p className="goal-context">
              {inputs.goal === "custom"
                ? t(
                    "Using your custom expert weights.",
                    "حسب أوزان الخبير المخصصة.",
                  )
                : t(GOALS[inputs.goal].en, GOALS[inputs.goal].ar)}
            </p>
            {sequence(proposed)}
            <p>
              {proposed.id === "baseline"
                ? t(
                    "Your current rotation leads this model comparison under the selected preferences.",
                    "دورتك الحالية متقدمة في مقارنة النموذج حسب التفضيلات المختارة.",
                  )
                : t(
                    "This option leads the model comparison under your preferences; local checks determine whether it fits your field.",
                    "الخيار ده متقدم في مقارنة النموذج حسب تفضيلاتك؛ المراجعة المحلية بتحدد ملاءمته لأرضك.",
                  )}
            </p>
            {water(proposed)}
            <p className="small-note">
              {t(
                "The trade-off includes modeled water needs and crop nitrogen balance; neither is a measured field outcome.",
                "المفاضلة بتشمل احتياج المياه وتوازن النيتروجين في النموذج؛ الاتنين مش نتائج مقاسة في أرضك.",
              )}
            </p>
            {cautions(proposed)}
            <p className="prototype-note">
              {t(
                "Historical-data planning prototype. This is not a field-validated planting prescription. Verify soil, water and crop dates locally.",
                "نموذج أولي للتخطيط ببيانات تاريخية، وليس توصية زراعة معتمدة حقلياً. راجع التربة والمياه ومواعيد المحاصيل محلياً.",
              )}
            </p>
            <button
              className="button primary"
              onClick={() => setView("details")}
            >
              {t("View explanation and checks", "شوف التفسير والمراجعات")}
            </button>
          </>
        )}
        {view === "alternatives" && (
          <div className="alternatives-list">
            {evaluation.strategies.map((s) => (
              <article
                className="compact-option"
                key={s.id}
                data-testid={`farmer-option-${s.id}`}
              >
                <h3>{category(s)}</h3>
                {sequence(s)}
                {water(s)}
                <button
                  className="button"
                  onClick={() => {
                    setDetailId(s.id);
                    setView("details");
                  }}
                >
                  {t("View details", "شوف التفاصيل")} · {category(s)}
                </button>
              </article>
            ))}
          </div>
        )}
        {view === "details" && (
          <div className="recommendation-details">
            <h3>{category(selected)}</h3>
            {details(selected)}
          </div>
        )}
      </section>
      <FieldSummary
        lang={lang}
        data={data}
        diagnostics={evaluation.diagnostics}
        inputs={inputs}
      />
      <section className="panel goal-revision">
        <label className="field-label">
          {t("Change your goal", "غيّر هدفك")}
          <select
            aria-label={t("Change your goal", "غيّر هدفك")}
            value={inputs.goal}
            onChange={(e) =>
              setInputs((p) => ({
                ...p,
                goal: e.target.value,
                weights: { ...GOALS[e.target.value].weights },
              }))
            }
          >
            {inputs.goal === "custom" && (
              <option value="custom">
                {t("Custom expert weights", "أوزان خبير مخصصة")}
              </option>
            )}
            {Object.entries(GOALS).map(([id, g]) => (
              <option key={id} value={id}>
                {t(g.en, g.ar)}
              </option>
            ))}
          </select>
        </label>
        <p className="small-note" role="status">
          {t(
            "Changing your goal immediately recalculates this comparison. It may change the proposed rotation.",
            "تغيير الهدف بيعيد حساب المقارنة فوراً، وممكن يغيّر الدورة المقترحة.",
          )}
        </p>
      </section>
      <AdditionalDetails lang={lang} inputs={inputs} setInputs={setInputs} />
      <div className="result-actions">
        <button className="button" onClick={onEdit}>
          {t("Back to field questions", "ارجع لأسئلة الأرض")}
        </button>
        <button className="button" onClick={onMap}>
          {t("View location on map", "عرض الموقع على الخريطة")}
        </button>
      </div>
    </div>
  );
}
