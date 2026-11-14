import { Check } from "lucide-react";
import { text } from "../i18n";

export default function BestMatch({ lang, strategy }) {
  if (strategy.rank !== 1) return null;
  const t = (en, ar) => text(lang, en, ar);
  return (
    <div className="best-match-note">
      <strong className="best-match-badge">
        <Check size={16} aria-hidden="true" />
        {t("Best match for your priorities", "أنسب خطة لأولوياتك")}
      </strong>
      <p>
        {t(
          "Highest-ranked of these strategies using your priorities and the model’s trade-offs and penalties.",
          "الأعلى ترتيباً بين الخطط المعروضة حسب أولوياتك والمفاضلات وخصم النقاط في النموذج.",
        )}
      </p>
    </div>
  );
}
