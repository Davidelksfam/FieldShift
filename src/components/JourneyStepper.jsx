import {
  MapPin,
  Tractor,
  SlidersHorizontal,
  GitCompareArrows,
  Satellite,
  Check,
} from "lucide-react";
import { text } from "../i18n";
export const journeySteps = [
  { en: "Field", ar: "الحقل", icon: MapPin },
  { en: "Farm", ar: "المزرعة", icon: Tractor },
  { en: "Goals", ar: "الأولويات", icon: SlidersHorizontal },
  { en: "Compare", ar: "المقارنة", icon: GitCompareArrows },
  { en: "Evidence", ar: "الأدلة", icon: Satellite },
];
export default function JourneyStepper({ lang, active, onChange, visited }) {
  return (
    <nav
      className="journey-nav"
      aria-label={text(lang, "Planning journey", "خطوات التخطيط")}
    >
      {journeySteps.map(({ en, ar, icon: Icon }, i) => (
        <button
          key={en}
          className={`journey-step ${active === i ? "active" : ""}`}
          aria-current={active === i ? "step" : undefined}
          onClick={() => onChange(i)}
        >
          <span className="step-symbol">
            <Icon size={20} />
          </span>
          <span className="step-label">{text(lang, en, ar)}</span>
          <span className="step-number" aria-hidden="true">
            {visited.includes(i) && active !== i ? (
              <Check size={14} />
            ) : (
              String(i + 1).padStart(2, "0")
            )}
          </span>
        </button>
      ))}
    </nav>
  );
}
