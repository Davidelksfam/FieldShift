import CropIcon, { cropEmoji } from "./CropIcon";
import { Sprout, Droplets, Target } from "lucide-react";
import { text } from "../../i18n";
import { GOALS, selectGoal } from "../../presentation/farmerModel";
import AdditionalDetails from "./AdditionalDetails";
export default function FieldInputs({
  lang,
  inputs,
  setInputs,
  crops,
  onCompare,
  invalid,
}) {
  const t = (en, ar) => text(lang, en, ar);
  const update = (key, value) => setInputs((p) => ({ ...p, [key]: value }));
  return (
    <section
      className="panel field-inputs"
      aria-labelledby="field-inputs-title"
    >
      <div className="workspace-panel-heading">
        <span className="icon-box">
          <Sprout size={20} />
        </span>
        <div>
          <h2 id="field-inputs-title">{t("Your crops", "محاصيلك")}</h2>
        </div>
      </div>
      <div className="workspace-fields">
        {[
          ["Shitwi", "currentWinterId", "Winter crop", "المحصول الشتوي"],
          ["Seifi", "currentSummerId", "Summer crop", "المحصول الصيفي"],
        ].map(([season, key, en, ar]) => (
          <label className="field-label" key={key}>
            <span className="input-title">
              <CropIcon id={inputs[key]} />
              {t(en, ar)}
            </span>
            <select
              aria-label={t(en, ar)}
              value={inputs[key]}
              onChange={(e) => update(key, e.target.value)}
            >
              {crops
                .filter((c) => c.season === season)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {cropEmoji[c.id]}{" "}
                    {lang === "ar"
                      ? c.nameAr
                      : c.nameEn
                          .split(" (")[0]
                          .replace("Summer Maize", "Maize")}
                  </option>
                ))}
            </select>
          </label>
        ))}
        <label className="field-label">
          <span className="input-title">
            <Droplets size={20} />
            {t("Irrigation system", "نظام الري")}
          </span>
          <select
            aria-label={t("Irrigation system", "نظام الري")}
            value={inputs.irrigationType}
            onChange={(e) => update("irrigationType", e.target.value)}
          >
            {[
              ["flood", "Flood irrigation", "غمر"],
              [
                "modified_surface",
                "Improved surface irrigation",
                "ري سطحي مطور",
              ],
              ["sprinkler", "Sprinkler", "رش"],
              ["drip", "Drip", "تنقيط"],
            ].map(([id, en, ar]) => (
              <option key={id} value={id}>
                {t(en, ar)}
              </option>
            ))}
          </select>
        </label>
        <label className="field-label">
          <span className="input-title">
            <Target size={20} />
            {t("Main goal", "هدف المقارنة")}
          </span>
          <select
            aria-label={t("Main goal", "هدف المقارنة")}
            value={inputs.goal}
            onChange={(e) => setInputs((p) => selectGoal(p, e.target.value))}
          >
            {inputs.goal === "custom" && (
              <option value="custom">
                {t("Custom expert weights", "أوزان خبير مخصصة")}
              </option>
            )}
            {Object.entries(GOALS).map(([id, g]) => (
              <option key={id} value={id}>
                {
                  {
                    water: t("Save water", "توفير المياه"),
                    soil: t("Soil condition", "حالة التربة"),
                    market: t("Market / forage", "السوق والأعلاف"),
                  }[id]
                }
              </option>
            ))}
          </select>
        </label>
      </div>
      <details className="preference-note">
        <summary>{t("How priorities work", "كيف تعمل الأولويات")}</summary>
        <p className="small-note">
          {inputs.goal === "custom"
            ? t(
                "Your custom expert weights are active. Choosing a goal replaces them.",
                "أوزان الخبير المخصصة مفعّلة. اختيار هدف بيستبدلها.",
              )
            : t(
                "Goal weights are comparison preferences, not scientifically calibrated. Market scores do not predict profit.",
                "أوزان الهدف تفضيلات للمقارنة وليست معايرة علمياً. درجات السوق لا تتنبأ بالربح.",
              )}
        </p>
      </details>
      <AdditionalDetails lang={lang} inputs={inputs} setInputs={setInputs} />
      <button
        className="button primary compare-action"
        disabled={invalid}
        onClick={onCompare}
      >
        <Droplets size={18} />
        {t("Compare three strategies", "قارن ٣ استراتيجيات")}
      </button>
    </section>
  );
}
