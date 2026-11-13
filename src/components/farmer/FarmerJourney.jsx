import { useEffect, useRef } from "react";
import { MapPin, Sprout, Droplets, Leaf } from "lucide-react";
import { text } from "../../i18n";
import { GOALS, selectGoal } from "../../presentation/farmerModel";
import AdditionalDetails from "./AdditionalDetails";
const steps = [
  ["Where is your field?", "أرضك فين؟", MapPin],
  ["What do you currently grow?", "بتزرع إيه حاليًا؟", Sprout],
  ["How do you irrigate?", "بتروي أرضك إزاي؟", Droplets],
  ["What matters most?", "إيه أهم حاجة عندك؟", Leaf],
];
export default function FarmerJourney({
  lang,
  inputs,
  setInputs,
  presets,
  presetId,
  onPresetChange,
  crops,
  step,
  setStep,
  onComplete,
  invalid,
}) {
  const t = (en, ar) => text(lang, en, ar),
    title = useRef(null);
  useEffect(() => {
    title.current?.focus();
  }, [step]);
  const update = (key, value) => setInputs((p) => ({ ...p, [key]: value }));
  const Icon = steps[step][2];
  const options = (name, value, choices, onChange) => (
    <fieldset className="choice-group">
      <legend className="sr-only">{name}</legend>
      {choices.map(([id, en, ar]) => (
        <label
          className={`choice-card ${value === id ? "active" : ""}`}
          key={id}
        >
          <input
            type="radio"
            name={name}
            value={id}
            checked={value === id}
            onChange={() => onChange(id)}
          />
          <span>{t(en, ar)}</span>
        </label>
      ))}
    </fieldset>
  );
  return (
    <section className="journey panel" aria-labelledby="journey-title">
      <div
        className="journey-progress"
        aria-label={t("Your progress", "خطواتك")}
      >
        <span>{t(`Step ${step + 1} of 4`, `الخطوة ${step + 1} من ٤`)}</span>
        <div className="progress-track">
          {steps.map((s, i) => (
            <span key={s[0]} className={i <= step ? "filled" : ""} />
          ))}
        </div>
      </div>
      <div className="journey-heading">
        <span className="icon-box">
          <Icon size={24} />
        </span>
        <h2 id="journey-title" ref={title} tabIndex="-1">
          {t(...steps[step])}
        </h2>
      </div>
      {step === 0 && (
        <>
          {options(
            t("Supported region", "المنطقة المدعومة"),
            presetId,
            Object.values(presets).map((p) => [p.id, p.nameEn, p.nameAr]),
            onPresetChange,
          )}
          <p className="small-note">
            {t(
              "These exact benchmark locations have audited historical datasets. Changing region keeps your crop and irrigation choices.",
              "المواقع دي مرتبطة ببيانات تاريخية اتراجعت. تغيير المنطقة بيحافظ على اختيارات المحاصيل والري.",
            )}{" "}
            {!presetId &&
              t(
                "Custom location selected in Expert Mode; source support may be incomplete.",
                "موقع مخصص من وضع الخبير؛ دعم البيانات قد يكون ناقصاً.",
              )}
          </p>
        </>
      )}
      {step === 1 && (
        <div className="crop-selectors">
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
          <p className="small-note">
            {t(
              "Your current rotation is the reference for comparison.",
              "دورتك الحالية هي المرجع اللي هنقارن بيه.",
            )}
          </p>
        </div>
      )}
      {step === 2 && (
        <>
          {options(
            t("Irrigation system", "نظام الري"),
            inputs.irrigationType,
            [
              ["flood", "Flood irrigation", "غمر"],
              [
                "modified_surface",
                "Improved surface irrigation",
                "ري سطحي مطور",
              ],
              ["sprinkler", "Sprinkler", "رش"],
              ["drip", "Drip", "تنقيط"],
            ],
            (id) => update("irrigationType", id),
          )}
          <p className="small-note">
            {t(
              "Your irrigation method changes the modeled gross water estimate.",
              "طريقة الري بتغيّر تقدير كمية مياه الري في النموذج.",
            )}
          </p>
        </>
      )}
      {step === 3 && (
        <>
          {options(
            t("Main goal", "الهدف الأساسي"),
            inputs.goal,
            Object.entries(GOALS).map(([id, g]) => [id, g.en, g.ar]),
            (id) => setInputs((p) => selectGoal(p, id)),
          )}
          <p className="small-note">
            {inputs.goal === "custom"
              ? t(
                  "Custom expert weights are active. Choose a goal to replace them.",
                  "أوزان الخبير المخصصة مفعّلة. اختيار هدف هيستبدلها.",
                )
              : t(
                  "These are comparison preferences, not scientifically calibrated weights. Market / forage scores do not predict profit.",
                  "دي تفضيلات للمقارنة، مش أوزان معايرة علمياً. درجات السوق والأعلاف لا تتنبأ بالربح.",
                )}
          </p>
        </>
      )}
      <div className="journey-navigation">
        <button
          className="button"
          disabled={step === 0}
          onClick={() => setStep(step - 1)}
        >
          {t("Back", "رجوع")}
        </button>
        <button
          className="button primary"
          disabled={step === 3 && Boolean(invalid)}
          onClick={() => (step < 3 ? setStep(step + 1) : onComplete())}
        >
          {step === 3
            ? t("Compare my rotation", "قارن دورتي الزراعية")
            : t("Continue", "كمّل")}
        </button>
      </div>
      {step === 3 && (
        <AdditionalDetails lang={lang} inputs={inputs} setInputs={setInputs} />
      )}
    </section>
  );
}
