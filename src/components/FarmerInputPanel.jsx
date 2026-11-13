import {
  Droplets,
  MapPin,
  SlidersHorizontal,
  Sprout,
  Tractor,
} from "lucide-react";
import presets from "../data/demoPresets.json" with { type: "json" };
import { text, formatNumber } from "../i18n";

export default function FarmerInputPanel({
  lang,
  inputs,
  setInputs,
  presetId,
  onPresetChange,
  crops,
}) {
  const t = (en, ar) => text(lang, en, ar);
  const update = (key, value) =>
    setInputs((current) => ({ ...current, [key]: value }));
  const select = (key, label, options) => (
    <label key={key} className="field-label">
      {label}
      <select
        aria-label={label}
        value={inputs[key]}
        onChange={(e) => update(key, e.target.value)}
      >
        {options.map(([value, en, ar]) => (
          <option key={value} value={value}>
            {t(en, ar)}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <aside className="input-panel panel" aria-labelledby="field-settings">
      <div className="panel-heading">
        <div className="icon-box">
          <Tractor size={20} />
        </div>
        <div>
          <h2 id="field-settings">
            {t("Your field, your priorities", "أرضك وأولوياتك")}
          </h2>
          <p>
            {t(
              "A minute to shape your next season.",
              "دقيقة لتخطيط موسمك القادم.",
            )}
          </p>
        </div>
      </div>
      <div className="form-section">
        <h3>
          <MapPin size={16} />
          {t("Start with a region", "ابدأ بالمنطقة")}
        </h3>
        <div className="preset-list">
          {Object.values(presets).map((p) => (
            <button
              key={p.id}
              className={`preset ${presetId === p.id ? "active" : ""}`}
              aria-pressed={presetId === p.id}
              onClick={() => onPresetChange(p.id)}
            >
              <span className="preset-dot" />
              <span>{lang === "ar" ? p.nameAr : p.nameEn}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="form-section">
        <h3>
          <Sprout size={16} />
          {t("Land & water", "الأرض والمياه")}
        </h3>
        <div className="form-row">
          <label className="field-label">
            {t("Area · feddans", "المساحة · فدان")}
            <input
              aria-label={t("Area in feddans", "المساحة بالفدان")}
              type="number"
              min="0"
              max="100000"
              step="0.25"
              value={inputs.feddans}
              onChange={(e) => update("feddans", e.target.value)}
            />
          </label>
          <label className="field-label">
            {t("Extra qirats", "قراريط إضافية")}
            <input
              type="number"
              min="0"
              max="23"
              step="1"
              value={inputs.qirats}
              onChange={(e) => update("qirats", e.target.value)}
            />
          </label>
        </div>
        <p className="small-note">
          {t("1 feddan = 24 qirats ≈ 4,200 m²", "الفدان = ٢٤ قيراط ≈ ٤٢٠٠ م²")}
        </p>
        {select("landType", t("Land type", "نوع الأرض"), [
          ["old_clay", "Old alluvial clay", "طينية قديمة"],
          ["new_sandy", "New sandy land", "رملية مستصلحة"],
        ])}
        {select("irrigationType", t("Irrigation system", "نظام الري"), [
          ["flood", "Flood / surface", "غمر"],
          ["modified_surface", "Improved surface", "ري سطحي مطور"],
          ["sprinkler", "Sprinkler", "رش"],
          ["drip", "Drip", "تنقيط"],
        ])}
        <div className="form-row">
          {select("canalPosition", t("Canal position", "موقع المسقى"), [
            ["head", "Head", "البداية"],
            ["middle", "Middle", "الوسط"],
            ["tail", "Tail-end", "النهاية"],
          ])}
          {select("salinityLevel", t("Known salinity", "الملوحة المعروفة"), [
            ["none", "None reported", "غير مُبلغ عنها"],
            ["moderate", "Moderate", "متوسطة"],
            ["high", "High", "مرتفعة"],
          ])}
        </div>
      </div>
      <div className="form-section">
        <h3>
          <Tractor size={16} />
          {t("Current rotation", "الدورة الحالية")}
        </h3>
        {["Shitwi", "Seifi"].map((season) =>
          select(
            season === "Shitwi" ? "currentWinterId" : "currentSummerId",
            season === "Shitwi"
              ? t("Shitwi · winter crop", "شتوي · المحصول الشتوي")
              : t("Seifi · summer crop", "صيفي · المحصول الصيفي"),
            crops
              .filter((c) => c.season === season)
              .map((c) => [c.id, c.nameEn, c.nameAr]),
          ),
        )}
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={inputs.hasLivestock}
            onChange={(e) => update("hasLivestock", e.target.checked)}
          />
          {t(
            "I keep livestock · prioritize forage",
            "أربي ماشية · أعطي أولوية للأعلاف",
          )}
        </label>
      </div>
      <div className="form-section">
        <h3>
          <SlidersHorizontal size={16} />
          {t("What matters most?", "ما أولوياتك؟")}
        </h3>
        <p className="small-note">
          {t(
            "Relative weights, normalized automatically.",
            "أوزان نسبية تُوازن تلقائياً.",
          )}
        </p>
        {[
          ["water", t("Water conservation", "ترشيد المياه")],
          ["soil", t("Soil & nitrogen recovery", "تعافي التربة والنيتروجين")],
          ["market", t("Cash & forage return", "العائد النقدي والأعلاف")],
        ].map(([key, label]) => (
          <label className="slider-label" key={key} htmlFor={`priority-${key}`}>
            <span>
              {label}
              <output>{formatNumber(inputs.weights[key], lang)}</output>
            </span>
            <input
              id={`priority-${key}`}
              type="range"
              min="0"
              max="100"
              step="1"
              value={inputs.weights[key]}
              onChange={(e) =>
                setInputs((current) => ({
                  ...current,
                  weights: {
                    ...current.weights,
                    [key]: Number(e.target.value),
                  },
                }))
              }
            />
          </label>
        ))}
        {Object.values(inputs.weights).every((w) => w === 0) && (
          <p className="small-note">
            {t(
              "All zero: using default weights 50 / 30 / 20.",
              "جميعها صفر: نستخدم الأوزان الافتراضية ٥٠ / ٣٠ / ٢٠.",
            )}
          </p>
        )}
      </div>
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={Boolean(inputs.forceNiliCover)}
          onChange={(e) => update("forceNiliCover", e.target.checked)}
        />
        {t("Explore a conditional Nili cover", "استكشف غطاءً نيلياً مشروطاً")}
      </label>
      <div className="input-footer">
        <Droplets size={16} />
        <span>
          {t(
            "Every change updates your comparison.",
            "كل تعديل يحدّث مقارنة الخطط.",
          )}
        </span>
      </div>
    </aside>
  );
}
