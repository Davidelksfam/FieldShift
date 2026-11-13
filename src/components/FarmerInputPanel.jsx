import { Sprout, Tractor } from "lucide-react";
import { text } from "../i18n";
import CropVisual from "./CropVisual";
export default function FarmerInputPanel({ lang, inputs, setInputs, crops }) {
  const t = (en, ar) => text(lang, en, ar);
  const update = (key, value) => setInputs((c) => ({ ...c, [key]: value }));
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
    <div className="farm-form">
      <div className="form-section">
        <h3>
          <Tractor size={16} />
          {t("Current rotation", "الدورة الحالية")}
        </h3>
        {["Shitwi", "Seifi"].map((season) => (
          <div className="crop-selector" key={season}>
            <span className="crop-selector-icon">
              <CropVisual
                id={
                  inputs[
                    season === "Shitwi" ? "currentWinterId" : "currentSummerId"
                  ]
                }
              />
            </span>
            {select(
              season === "Shitwi" ? "currentWinterId" : "currentSummerId",
              season === "Shitwi"
                ? t("Shitwi · winter crop", "شتوي · المحصول الشتوي")
                : t("Seifi · summer crop", "صيفي · المحصول الصيفي"),
              crops
                .filter((c) => c.season === season)
                .map((c) => [c.id, c.nameEn, c.nameAr]),
            )}
          </div>
        ))}
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
      <p className="small-note">
        {t(
          "These are farmer-reported settings. Verify soil salinity with a local EC test; the satellite screening is not a measurement.",
          "هذه معلومات يقدمها المزارع. تحقق من ملوحة التربة باختبار EC محلي؛ الفحص الفضائي ليس قياساً.",
        )}
      </p>
    </div>
  );
}
