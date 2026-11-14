import { ChartNoAxesCombined, Globe2, Moon, Sun } from "lucide-react";
import { text } from "../i18n";
import siteLogo from "../assets/brand/site-logo.png";
export default function HeaderBar({
  lang,
  onLanguageChange,
  analyticsOpen,
  onAnalyticsToggle,
  theme,
  onThemeToggle,
  intro = false,
}) {
  const t = (en, ar) => text(lang, en, ar);
  return (
    <header className="header-bar unified-header" data-map-obstacle>
      <a className="brand" href="#main" aria-label="Field Shift">
        <img
          src={siteLogo}
          alt={t("Field Shift logo", "شعار فيلد شيفت")}
          width="52"
          height="52"
        />
        <span dir="ltr">
          field<span>shift.</span>
          <small>GROW WITH CLARITY</small>
        </span>
      </a>
      {!intro && (
        <nav
          className="workspace-nav"
          aria-label={t("Workspace navigation", "التنقل في مساحة التخطيط")}
        >
          <a href="#field-setup">{t("Your field", "أرضك")}</a>
          <a href="#comparison">{t("Compare plans", "مقارنة الخطط")}</a>
        </nav>
      )}
      <div className="header-actions">
        <button
          className="button theme-button"
          onClick={onThemeToggle}
          aria-label={t("Dark mode", "الوضع الداكن")}
          aria-pressed={theme === "dark"}
          title={t("Dark mode", "الوضع الداكن")}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        {!intro && (
          <button
            className={`button analytics-link ${analyticsOpen ? "selected" : ""}`}
            aria-expanded={analyticsOpen}
            aria-controls="advanced-analytics"
            aria-label={t(
              analyticsOpen
                ? "Hide advanced analytics"
                : "Show advanced analytics",
              analyticsOpen
                ? "إخفاء التحليلات المتقدمة"
                : "عرض التحليلات المتقدمة",
            )}
            onClick={onAnalyticsToggle}
          >
            <ChartNoAxesCombined size={17} />
            <span>
              {t(
                analyticsOpen
                  ? "Hide advanced analytics"
                  : "Show advanced analytics",
                analyticsOpen
                  ? "إخفاء التحليلات المتقدمة"
                  : "عرض التحليلات المتقدمة",
              )}
            </span>
          </button>
        )}
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
