import { Check, Droplets, Waves, Sun } from "lucide-react";
import presets from "../data/demoPresets.json" with { type: "json" };
import { text } from "../i18n";
const regions = [
  [
    "fayoum_etsa",
    Droplets,
    "Fayoum",
    "الفيوم",
    "Etsa · canal tail-end",
    "إطسا · نهاية الترعة",
    "Explore heat and irrigation trade-offs.",
    "استكشف مفاضلات الحرارة والري.",
  ],
  [
    "delta_kafr_el_sheikh",
    Waves,
    "North Delta",
    "شمال الدلتا",
    "Kafr El-Sheikh",
    "كفر الشيخ",
    "Review salinity and soil recovery.",
    "راجع الملوحة وتعافي التربة.",
  ],
  [
    "west_delta_nubariya",
    Sun,
    "West Delta",
    "غرب الدلتا",
    "Nubariya · reclaimed land",
    "النوبارية · أرض مستصلحة",
    "Plan for sandy land and efficient irrigation.",
    "خطط للأرض الرملية وكفاءة الري.",
  ],
];
export default function RegionSelector({ lang, presetId, onChange }) {
  const t = (en, ar) => text(lang, en, ar);
  return (
    <div className="region-grid">
      {regions.map(([id, Icon, en, ar, sub, subAr, note, noteAr]) => (
        <button
          key={id}
          aria-label={lang === "ar" ? presets[id].nameAr : presets[id].nameEn}
          aria-pressed={presetId === id}
          onClick={() => onChange(id)}
          className={`region-card ${presetId === id ? "active" : ""}`}
        >
          <span className="region-top">
            <span className="region-icon">
              <Icon size={26} />
            </span>
            <span className="selection-check">
              {presetId === id ? <Check size={18} /> : null}
            </span>
          </span>
          <strong>{t(en, ar)}</strong>
          <span>{t(sub, subAr)}</span>
          <p>{t(note, noteAr)}</p>
          <small>
            {t("2025 benchmark scenario", "سيناريو مرجعي لعام ٢٠٢٥")}
          </small>
        </button>
      ))}
    </div>
  );
}
