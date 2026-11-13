import { useMemo, useState } from "react";
import { text } from "../i18n";
import { analyzeRotations } from "../engine/engineAdapter";
export default function ScientificV2Inspector({
  lang,
  data,
  inputs,
  crops,
  location,
}) {
  const [version, setVersion] = useState("legacy"),
    t = (en, ar) => text(lang, en, ar);
  const result = useMemo(
    () =>
      version === "scientific-v2"
        ? analyzeRotations({
            engineVersion: version,
            experimentalEnabled: true,
            data,
            farmerInputs: inputs,
            cropCatalog: crops,
            location,
          })
        : null,
    [version, data, inputs, crops, location],
  );
  return (
    <section
      className="panel indices-panel v2-inspector"
      aria-labelledby="v2-inspector-title"
    >
      <h2 id="v2-inspector-title">
        {t("Scientific V2 · experimental inspection", "V2 العلمي · فحص تجريبي")}
      </h2>
      <p>
        {t(
          "Foundation only. The farmer comparison and existing pipeline remain on the legacy engine. No scientific recommendation is released.",
          "أساس تقني فقط. مقارنة المزارع وخط المعالجة الحالي يفضلوا على المحرك السابق. لا تُصدر توصية علمية.",
        )}
      </p>
      <label className="field-label">
        {t("Inspection engine", "محرك الفحص")}
        <select
          aria-label={t("Inspection engine", "محرك الفحص")}
          value={version}
          onChange={(e) => setVersion(e.target.value)}
        >
          <option value="legacy">
            {t(
              "Legacy · current demo unchanged",
              "المحرك السابق · العرض الحالي بدون تغيير",
            )}
          </option>
          <option value="scientific-v2">
            {t("Scientific V2 · not released", "V2 العلمي · غير مُصدر")}
          </option>
        </select>
      </label>
      {result && (
        <>
          <p role="status">
            {lang === "ar"
              ? result.recommendation.reasons[0].ar
              : result.recommendation.reasons[0].en}
          </p>
          <pre
            className="pipeline-json"
            aria-label={t(
              "Scientific V2 JSON output",
              "مخرجات V2 العلمية JSON",
            )}
            dir="ltr"
          >
            {JSON.stringify(result, null, 2)}
          </pre>
        </>
      )}
    </section>
  );
}
