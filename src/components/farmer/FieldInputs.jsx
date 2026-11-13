import { Sprout, Droplets } from "lucide-react";
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
          <h2 id="field-inputs-title">
            {t("Crops, irrigation & priorities", "محاصيلك وطريقة الري")}
          </h2>
          <p>
            {t(
              "All your field inputs in one place.",
              "كل بيانات أرضك في مكان واحد.",
            )}
          </p>
        </div>
      </div>
      <div className="workspace-fields">
        {[
          ["Shitwi", "currentWinterId", "Winter crop", "المحصول الشتوي"],
          ["Seifi", "currentSummerId", "Summer crop", "المحصول الصيفي"],
        ].map(([season, key, en, ar]) => (
          <label className="field-label" key={key}>
            {t(en, ar)}
            <select
              aria-label={t(en, ar)}
              value={inputs[key]}
              onChange={(e) => update(key, e.target.value)}
            >
              {crops
                .filter((c) => c.season === season)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {lang === "ar" ? c.nameAr : c.nameEn}
                  </option>
                ))}
            </select>
          </label>
        ))}
        <label className="field-label">
          {t("Irrigation system", "نظام الري")}
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
          {t("Main goal", "هدف المقارنة")}
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
                {t(g.en, g.ar)}
              </option>
            ))}
          </select>
        </label>
      </div>
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
      <AdditionalDetails lang={lang} inputs={inputs} setInputs={setInputs} />
      <button
        className="button primary compare-action"
        disabled={invalid}
        onClick={onCompare}
      >
        <Droplets size={18} />
        {t("Compare three strategies", "قارن ٣ استراتيجيات")}
      </button>
      <p className="small-note">
        {t(
          "Numbers update immediately when inputs change. This button takes you to the comparison.",
          "الأرقام بتتحدّث فوراً مع تعديل المدخلات. الزر بينقلك للمقارنة.",
        )}
      </p>
    </section>
  );
}
