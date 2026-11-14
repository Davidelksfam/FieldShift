import { Database, LoaderCircle, RefreshCw } from "lucide-react";
import { text, sourceLabel, formatNumber } from "../../i18n";
import { comparisonSourceSupport } from "../../presentation/farmerModel";
export default function SourceStatus({
  lang,
  data,
  loading,
  progress,
  onRetry,
  onCancel,
  offline,
  diagnostics,
}) {
  const t = (en, ar) => text(lang, en, ar),
    support = comparisonSourceSupport(data);
  return (
    <section
      className="panel source-status-panel"
      aria-labelledby="source-status-title"
    >
      <div className="source-status-heading">
        <div>
          <h2 id="source-status-title">
            <Database size={19} />
            {t("Data for this location", "بيانات الموقع ده")}
          </h2>
          <p role="status" aria-live="polite">
            {loading
              ? t(
                  "Fetching data automatically. Slow or interrupted sources are retried while successful results are kept…",
                  "بنجيب البيانات تلقائياً وبنحاول تاني مع المصادر البطيئة أو المتقطعة، مع الاحتفاظ بالنتائج اللي وصلت…",
                )
              : support.illustrative && !support.blocked
                ? t(
                    "Strategies are available with partial data. Missing soil or vegetation checks are identified below.",
                    "الاستراتيجيات متاحة بالبيانات الموجودة. فحوص التربة أو الغطاء النباتي غير المتاحة موضّحة تحت.",
                  )
                : support.illustrative
                  ? t(
                      "Some selected-location data remains unavailable after automatic retrieval. Illustrative fallback is identified below.",
                      "بعض بيانات الموقع لسه غير متاحة بعد المحاولات التلقائية. البيانات التوضيحية البديلة موضّحة تحت.",
                    )
                  : t(
                      "Historical source data is available. Regional observations are not a field diagnosis.",
                      "بيانات المصادر التاريخية متاحة. أرصاد المنطقة ليست تشخيصاً لأرضك.",
                    )}
            {offline ? " · " + t("Offline", "بدون اتصال") : ""}
          </p>
        </div>
        <div>
          {loading ? (
            <button className="button" onClick={onCancel}>
              {t("Stop fetching", "أوقف طلب البيانات")}
            </button>
          ) : (
            <button className="button" onClick={onRetry}>
              <RefreshCw size={16} />
              {t("Retry sources", "حاول جلب البيانات تاني")}
            </button>
          )}
        </div>
      </div>
      <div className="location-sources">
        {[
          ["climate", "Climate · NASA POWER", "المناخ · NASA POWER"],
          ["soil", "Soil · SoilGrids", "التربة · SoilGrids"],
          ["ndvi", "Vegetation · MODIS", "الغطاء النباتي · MODIS"],
        ].map(([key, en, ar]) => {
          const event = progress[key],
            source =
              loading && event?.source ? event.source : data.sources[key];
          const pending = loading && (!event || event.status === "retrying");
          return (
            <article
              className={`location-source ${!pending && source.kind === "synthetic" ? "source-illustrative" : ""}`}
              key={key}
              data-testid={`source-${key}`}
            >
              <h3>{t(en, ar)}</h3>
              <strong>
                {pending ? (
                  <>
                    <LoaderCircle size={15} className="spin" />
                    {event?.status === "retrying"
                      ? t("Retrying automatically…", "بنحاول تاني تلقائياً…")
                      : t("Requesting…", "جارٍ الطلب…")}
                  </>
                ) : (
                  sourceLabel(source, lang)
                )}
              </strong>
              <span>
                {source.usedInComparison === false
                  ? t(
                      "No assessment from this source is used in the comparison",
                      "لا يُستخدم تقييم من المصدر ده في المقارنة",
                    )
                  : source.kind === "observed"
                    ? key === "soil"
                      ? t(
                          "Regional soil predictions · not a laboratory measurement",
                          "تقديرات تربة إقليمية · ليست تحليلاً معملياً",
                        )
                      : t(
                          "Historical observations · 2025",
                          "أرصاد تاريخية · ٢٠٢٥",
                        )
                    : t(
                        "Illustrative regional values · not observed at your field",
                        "قيم إقليمية توضيحية · ليست أرصاداً لأرضك",
                      )}
              </span>
              {loading && event?.status === "fulfilled" && (
                <small>
                  {t(
                    "Retrieved for the selected coordinates",
                    "مسترجعة للإحداثيات المختارة",
                  )}
                </small>
              )}
            </article>
          );
        })}
      </div>
      <details className="source-method">
        <summary>
          {t(
            "Data coverage and calculation method",
            "تغطية البيانات وطريقة الحساب",
          )}
        </summary>
        <div className="details-body">
          <p>
            {t(
              "Water numbers use legacy crop-water constants and assumed irrigation efficiency. NASA ET₀ does not drive the active crop-water comparison.",
              "أرقام المياه من ثوابت مياه المحاصيل وكفاءة ري مفترضة. ET₀ من ناسا لا يدخل في حساب مقارنة مياه المحاصيل الحالي.",
            )}
          </p>
          <p>
            {t(
              "Climate is about 50 km resolution; vegetation and soil about 250 m. Selecting coordinates does not create field-scale measurements. Imagery is historical, not a forecast.",
              "دقة المناخ حوالي ٥٠ كم، والغطاء والتربة حوالي ٢٥٠ م. اختيار الإحداثيات لا ينتج قياسات حقلية. البيانات تاريخية وليست توقعاً.",
            )}
          </p>
          <p>
            {t("Modeled reference ET₀", "البخر المرجعي المقدر ET₀")}:{" "}
            {diagnostics?.referenceEt0.status === "modeled"
              ? t(
                  "Available from separate benchmark weather drivers",
                  "متاح من بيانات طقس منفصلة للموقع المرجعي",
                )
              : t(
                  "Unavailable: complete weather drivers have not been retrieved for this location",
                  "غير متاح: لم تُجلب بيانات الطقس الكاملة للموقع ده",
                )}
            .{" "}
            {t("Historical vegetation anomaly", "شذوذ الغطاء النباتي التاريخي")}
            :{" "}
            {diagnostics?.canopyAnomaly.status === "available"
              ? t("Available", "متاح")
              : t(
                  "Unavailable: historical same-pixel baseline is missing or insufficient",
                  "غير متاح: المرجع التاريخي لنفس البكسل ناقص أو غير متاح",
                )}
            .
          </p>
          {diagnostics && (
            <p>
              {data.sources.climate.kind === "observed"
                ? t(
                    `Summer temperature coverage: ${diagnostics.summerObservationDays} / 153 days.`,
                    `تغطية حرارة الصيف: ${formatNumber(diagnostics.summerObservationDays, lang)} / ١٥٣ يوماً.`,
                  )
                : t(
                    "Observed summer temperature coverage is unavailable.",
                    "تغطية أرصاد حرارة الصيف غير متاحة.",
                  )}{" "}
              {data.sources.ndvi.kind === "observed"
                ? t(
                    `Autumn vegetation coverage: ${diagnostics.autumnObservedDays} / 91 days; ${diagnostics.autumnMissingDays} unknown.`,
                    `تغطية غطاء الخريف: ${formatNumber(diagnostics.autumnObservedDays, lang)} / ٩١ يوماً؛ ${formatNumber(diagnostics.autumnMissingDays, lang)} غير معلوم.`,
                  )
                : t(
                    "Observed vegetation coverage is unavailable.",
                    "تغطية رصد الغطاء النباتي غير متاحة.",
                  )}
            </p>
          )}
          {Object.entries(data.sources).map(([key, s]) => (
            <p key={key}>
              <strong>{s.provider}</strong> · {sourceLabel(s, lang)}
              {s.retrievedAt ? " · " + s.retrievedAt : ""}
              {s.reason ? " · " + s.reason : ""}
            </p>
          ))}
        </div>
      </details>
    </section>
  );
}
