import { ChartNoAxesCombined, Globe2 } from "lucide-react";
import { text } from "../i18n";
export default function HeaderBar({
  lang,
  onLanguageChange,
  analyticsOpen,
  onAnalyticsToggle,
}) {
  const t = (en, ar) => text(lang, en, ar);
  return (
    <header className="header-bar unified-header">
      <a className="brand" href="#main" aria-label="Field Shift">
        <img src="/brand/field-shift-mark.svg" alt="" width="38" height="38" />
        <span dir="ltr">
          field<span>shift.</span>
          <small>GROW WITH CLARITY</small>
        </span>
      </a>
      <nav
        className="workspace-nav"
        aria-label={t("Workspace navigation", "التنقل في مساحة التخطيط")}
      >
        <a href="#field-setup">{t("Your field", "أرضك")}</a>
        <a href="#comparison">{t("Compare plans", "مقارنة الخطط")}</a>
      </nav>
      <div className="header-actions">
        <button
          className={`button analytics-link ${analyticsOpen ? "selected" : ""}`}
          aria-expanded={analyticsOpen}
          aria-controls="advanced-analytics"
          onClick={onAnalyticsToggle}
        >
          <ChartNoAxesCombined size={17} />
          {t(
            analyticsOpen
              ? "Hide advanced analytics"
              : "Show advanced analytics",
            analyticsOpen
              ? "إخفاء التحليلات المتقدمة"
              : "عرض التحليلات المتقدمة",
          )}
        </button>
        <button
          className="button language-button"
          onClick={() => onLanguageChange(lang === "ar" ? "en" : "ar")}
        >
          <Globe2 size={16} />
          {lang === "ar" ? "English" : "العربية"}
        </button>
      </div>
    </header>
  );
}
