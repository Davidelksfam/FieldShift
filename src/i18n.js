export const text = (lang, en, ar) => (lang === "ar" ? ar : en);
export const formatNumber = (value, lang = "en", options = {}) =>
  value == null
    ? "—"
    : new Intl.NumberFormat(lang === "ar" ? "ar-EG" : "en-GB", {
        maximumFractionDigits: 1,
        ...options,
      }).format(value);
export const sourceLabel = (source, lang) => {
  const labels = {
    live: ["Retrieved source data", "بيانات مصدر مسترجعة"],
    cached: ["Cached source data", "بيانات مصدر محفوظة"],
    snapshot: ["Audited historical snapshot", "نسخة تاريخية مدققة"],
    demo: ["Illustrative demo fixture", "بيانات تجريبية توضيحية"],
  };
  const label = labels[source?.status] ?? labels.demo;
  return text(lang, ...label);
};
