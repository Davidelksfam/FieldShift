import PrioritySliders from "./PrioritySliders";
import { Droplets, MapPin, Sprout, Tractor } from "lucide-react";
import presets from "../data/demoPresets.json" with { type: "json" };
import { text } from "../i18n";

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
      {presetId && (
        <button
          className="button"
          onClick={() =>
            setInputs((p) => ({ ...p, ...presets[presetId].defaults }))
          }
        >
          {t(
            "Apply region demo context and irrigation",
            "طبّق سياق وري عرض المنطقة",
          )}
        </button>
      )}
      <p className="small-note">
        {t(
          "Expert controls · weight edits activate a custom goal. Region changes preserve inputs.",
          "أدوات الخبير · تعديل الأوزان يفعّل هدفاً مخصصاً. تغيير المنطقة يحافظ على المدخلات.",
        )}
      </p>
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={inputs.estimateArea}
          onChange={(e) => update("estimateArea", e.target.checked)}
        />
        {t(
          "Estimate water for my whole field",
          "أحسب تقدير المياه لأرضي بالكامل",
        )}
      </label>
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
          {select("salinityLevel", t("Known salinity", "الملوحة المعروفة"), [
            ["none", "None reported", "غير مُبلغ عنها"],
            ["moderate", "Moderate", "متوسطة"],
            ["high", "High", "مرتفعة"],
          ])}
        </div>
        <label className="field-label">
          {t(
            "Measured soil ECe (dS/m) · optional lab result",
            "ملوحة التربة ECe (dS/m) · تحليل معمل اختياري",
          )}
          <input
            aria-label={t("Measured soil ECe", "ECe المقاس للتربة")}
            type="number"
            min="0"
            max="100"
            step="0.1"
            placeholder={t(
              "Leave blank if not tested",
              "اتركه فارغاً دون تحليل",
            )}
            value={inputs.soilEceDsm ?? ""}
            onChange={(e) =>
              update(
                "soilEceDsm",
                e.target.value === "" ? null : Number(e.target.value),
              )
            }
          />
        </label>
        <p className="small-note">
          {t(
            "Only laboratory saturated-paste soil ECe can be compared with FAO crop thresholds. This is NOT the 0–100 salinity screening index.",
            "فقط قياس ECe المعملي للتربة يمكن مقارنته بحدود FAO، وليس مؤشر الملوحة التقديري من ٠ إلى ١٠٠.",
          )}
        </p>
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
      <PrioritySliders lang={lang} inputs={inputs} setInputs={setInputs} />
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
