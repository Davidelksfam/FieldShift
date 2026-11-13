import { MapPin, Pencil, Droplets, SlidersHorizontal } from "lucide-react";
import presets from "../data/demoPresets.json" with { type: "json" };
import { text, formatNumber } from "../i18n";
export default function FieldSummary({
  lang,
  location,
  inputs,
  crops,
  onNavigate,
}) {
  const t = (en, ar) => text(lang, en, ar);
  const p = presets[location.presetId];
  const cropName = (id) => {
    const c = crops.find((c) => c.id === id);
    return c ? (lang === "ar" ? c.nameAr : c.nameEn) : "—";
  };
  const irrigation = {
    flood: t("Flood", "غمر"),
    modified_surface: t("Improved surface", "سطحي مطور"),
    sprinkler: t("Sprinkler", "رش"),
    drip: t("Drip", "تنقيط"),
  };
  return (
    <details className="scenario-review">
      <summary>
        {t("Review farm settings", "راجع إعدادات المزرعة")}
        <span>
          {formatNumber(
            Number(inputs.feddans) + Number(inputs.qirats) / 24,
            lang,
            { maximumFractionDigits: 2 },
          )}{" "}
          {t("feddans", "فدان")} · {irrigation[inputs.irrigationType]}
        </span>
      </summary>
      <section
        className="field-summary"
        aria-label={t("Your scenario", "سيناريو الحقل")}
      >
        <button onClick={() => onNavigate(0)}>
          <MapPin size={18} />
          <span>
            <small>{t("FIELD", "الحقل")}</small>
            <strong>
              {p
                ? lang === "ar"
                  ? p.nameAr
                  : p.nameEn
                : t("Selected map location", "موقع محدد بالخريطة")}
            </strong>
          </span>
          <Pencil size={14} />
        </button>
        <button onClick={() => onNavigate(1)}>
          <Droplets size={18} />
          <span>
            <small>
              {formatNumber(
                Number(inputs.feddans) + Number(inputs.qirats) / 24,
                lang,
                { maximumFractionDigits: 2 },
              )}{" "}
              {t("feddans", "فدان")} · {irrigation[inputs.irrigationType]}
            </small>
            <strong>
              {cropName(inputs.currentWinterId)} →{" "}
              {cropName(inputs.currentSummerId)}
            </strong>
          </span>
          <Pencil size={14} />
        </button>
        <button onClick={() => onNavigate(2)}>
          <SlidersHorizontal size={18} />
          <span>
            <small>
              {t("WATER / SOIL / RETURN", "المياه / التربة / العائد")}
            </small>
            <strong>
              <bdi>
                {inputs.weights.water} / {inputs.weights.soil} /{" "}
                {inputs.weights.market}
              </bdi>
            </strong>
          </span>
          <Pencil size={14} />
        </button>
      </section>
    </details>
  );
}
