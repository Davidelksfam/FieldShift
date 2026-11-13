import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChevronDown, Database, Info, Satellite } from "lucide-react";
import { text, sourceLabel } from "../i18n";

const valid = (n) => typeof n === "number" && Number.isFinite(n);
export function monthlyClimate(daily) {
  return Array.from({ length: 12 }, (_, i) => {
    const points = daily.filter((p) => Number(p.date.slice(5, 7)) === i + 1);
    const flux = points.map((p) => p.evapotranspiration).filter(valid);
    const wetness = points.map((p) => p.rootWetness).filter(valid);
    return {
      month: i + 1,
      flux: flux.length
        ? Number((flux.reduce((a, b) => a + b, 0) / flux.length).toFixed(6))
        : null,
      wetness: wetness.length
        ? Number(
            (wetness.reduce((a, b) => a + b, 0) / wetness.length).toFixed(2),
          )
        : null,
      observations: flux.length,
    };
  });
}
export default function SatelliteEvidenceDrawer({
  lang,
  data,
  open,
  onToggle,
}) {
  const t = (en, ar) => text(lang, en, ar);
  const month = (value) =>
    new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en", {
      month: "short",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(2025, value - 1, 15)));
  const vegetation = data.ndviSeries.map((p) => ({
    ...p,
    day: Math.floor((Date.parse(p.date) - Date.UTC(2025, 0, 1)) / 86400000) + 1,
    coverScenario:
      p.date >= "2025-09-01" && p.date < "2025-12-01"
        ? Math.max(p.ndvi, 0.42)
        : p.ndvi,
  }));
  const climate = monthlyClimate(data.climateDaily).map((p) => ({
    ...p,
    label: month(p.month),
  }));
  return (
    <section className="evidence-panel panel" aria-labelledby="evidence-title">
      <button
        className="evidence-toggle"
        onClick={() => onToggle(!open)}
        aria-expanded={open}
        aria-controls="evidence-body"
      >
        <span className="icon-box">
          <Satellite size={21} />
        </span>
        <span>
          <span className="eyebrow">
            {t("THE EVIDENCE BEHIND THE PLAN", "الأدلة وراء الخطة")}
          </span>
          <h2 id="evidence-title">
            {t(
              "Satellite evidence & assumptions",
              "أدلة الأقمار الصناعية والافتراضات",
            )}
          </h2>
        </span>
        <ChevronDown className={open ? "rotate" : ""} size={22} />
      </button>
      {open && (
        <div id="evidence-body" className="evidence-body">
          <div className="chart-grid">
            <article>
              <h3>
                {t("Vegetation cover through 2025", "الغطاء النباتي خلال ٢٠٢٥")}
              </h3>
              <p className="small-note">
                MOD13Q1 · 250 m · {sourceLabel(data.sources.ndvi, lang)}
              </p>
              <div
                className="chart"
                dir="ltr"
                role="img"
                aria-label={t(
                  "NDVI curve, bare soil threshold 0.22 and hypothetical autumn cover",
                  "منحنى NDVI وحد التربة المكشوفة ٠٫٢٢ وسيناريو افتراضي لغطاء الخريف",
                )}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={vegetation}
                    margin={{ top: 18, right: 12, bottom: 8, left: -18 }}
                  >
                    <CartesianGrid vertical={false} stroke="var(--fs-border)" />
                    <XAxis
                      dataKey="day"
                      type="number"
                      domain={[1, 365]}
                      ticks={[
                        15, 46, 74, 105, 135, 166, 196, 227, 258, 288, 319, 349,
                      ]}
                      tickFormatter={(d) =>
                        month(new Date(Date.UTC(2025, 0, d)).getUTCMonth() + 1)
                      }
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis domain={[-0.2, 1]} tick={{ fontSize: 11 }} />
                    <Tooltip
                      labelFormatter={(d) =>
                        new Date(Date.UTC(2025, 0, d))
                          .toISOString()
                          .slice(0, 10)
                      }
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <ReferenceArea
                      x1={244}
                      x2={334}
                      fill="var(--fs-caution-soft)"
                      fillOpacity={0.8}
                    />
                    <ReferenceLine
                      y={0.22}
                      stroke="var(--fs-threshold)"
                      strokeDasharray="4 4"
                      label={{
                        value: "0.22",
                        position: "insideTopRight",
                        fontSize: 11,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="ndvi"
                      name={t("NDVI input", "بيانات NDVI")}
                      fill="var(--fs-brand-soft)"
                      stroke="var(--fs-action-bg)"
                      strokeWidth={2}
                      isAnimationActive={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="coverScenario"
                      name={t("Hypothetical cover", "غطاء افتراضي")}
                      stroke="var(--fs-brand-primary)"
                      strokeWidth={2}
                      strokeDasharray="6 4"
                      dot={false}
                      isAnimationActive={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <p className="chart-note">
                {t(
                  "Shaded: Sep–Nov. Dashed: illustrative 0.42 NDVI floor with Nili cover, not a predicted crop response. Low NDVI alone cannot establish erosion or a harvest date. No MODIS QA-band screening in this prototype.",
                  "التظليل: سبتمبر–نوفمبر. الخط المتقطع: حد افتراضي ٠٫٤٢ مع الغطاء النيلي، وليس تنبؤاً باستجابة المحصول. انخفاض NDVI وحده لا يثبت التعرية أو موعد الحصاد. لم تُطبق تصفية نطاق جودة MODIS.",
                )}
              </p>
            </article>
            <article>
              <h3>
                {t(
                  "Climate water signals · 2025",
                  "إشارات المياه المناخية · ٢٠٢٥",
                )}
              </h3>
              <p className="small-note">
                NASA POWER · ~50 km · {sourceLabel(data.sources.climate, lang)}
              </p>
              <div
                className="chart"
                dir="ltr"
                role="img"
                aria-label={t(
                  "Monthly mean evapotranspiration energy flux and root-zone wetness",
                  "متوسط تدفق طاقة البخر نتح الشهري ورطوبة منطقة الجذور",
                )}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={climate}
                    margin={{ top: 18, right: -14, bottom: 8, left: -18 }}
                  >
                    <CartesianGrid vertical={false} stroke="var(--fs-border)" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="flux" tick={{ fontSize: 11 }} />
                    <YAxis
                      yAxisId="wetness"
                      orientation="right"
                      domain={[0, 1]}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar
                      yAxisId="flux"
                      dataKey="flux"
                      name="EVPTRNS · MJ/m²/day"
                      fill="var(--fs-data-blue)"
                      radius={[3, 3, 0, 0]}
                      isAnimationActive={false}
                    />
                    <Line
                      yAxisId="wetness"
                      dataKey="wetness"
                      name="GWETROOT · 0–1"
                      stroke="var(--fs-action-bg)"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <p className="chart-note">
                {t(
                  "Monthly means of valid daily samples. EVPTRNS is energy flux (MJ/m²/day), not reference ET₀ in mm. GWETROOT is a regional wetness fraction; it is not an in-field moisture sensor.",
                  "متوسطات شهرية للأيام الصالحة. EVPTRNS تدفق طاقة (ميغاجول/م²/يوم)، وليس ET₀ بالملليمتر. GWETROOT كسر رطوبة إقليمي، وليس حساس رطوبة داخل الحقل.",
                )}
              </p>
            </article>
          </div>
          <details className="data-table">
            <summary>
              {t("View chart values as tables", "عرض قيم الرسوم في جداول")}
            </summary>
            <div className="table-scroll">
              <table>
                <caption>
                  {t(
                    "NDVI observations and cover illustration",
                    "قيم NDVI والغطاء التوضيحي",
                  )}
                </caption>
                <thead>
                  <tr>
                    <th>{t("Date", "التاريخ")}</th>
                    <th>NDVI</th>
                    <th>{t("Hypothetical cover", "غطاء افتراضي")}</th>
                  </tr>
                </thead>
                <tbody>
                  {vegetation.map((p) => (
                    <tr key={p.date}>
                      <td>{p.date}</td>
                      <td>{p.ndvi.toFixed(3)}</td>
                      <td>{p.coverScenario.toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <table>
                <caption>NASA POWER · 2025</caption>
                <thead>
                  <tr>
                    <th>{t("Month", "الشهر")}</th>
                    <th>MJ/m²/day</th>
                    <th>GWETROOT</th>
                    <th>{t("Valid days", "أيام صالحة")}</th>
                  </tr>
                </thead>
                <tbody>
                  {climate.map((p) => (
                    <tr key={p.month}>
                      <td>{p.label}</td>
                      <td>{p.flux ?? "—"}</td>
                      <td>{p.wetness ?? "—"}</td>
                      <td>{p.observations}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
          <div className="fusion-card">
            <Info size={21} />
            <div>
              <h3>
                {t(
                  "Shared coordinates, different scales",
                  "إحداثيات مشتركة ومقاييس مختلفة",
                )}
              </h3>
              <p>
                {t(
                  "Climate vectors at ~50 km are co-located with 250 m MODIS and SoilGrids at the chosen centroid. This is spatial alignment, not field-level downscaling. SoilGrids uses a thickness-weighted top 0–15 cm profile.",
                  "نربط متجهات المناخ بدقة نحو ٥٠ كم مع MODIS وSoilGrids بدقة ٢٥٠ م عند مركز التحليل. هذه محاذاة مكانية وليست تقديراً بدقة الحقل. يستخدم ملف التربة متوسطاً مرجحاً بسُمك الطبقات لعمق ٠–١٥ سم.",
                )}{" "}
                <bdi>
                  ({data.lat.toFixed(4)}, {data.lon.toFixed(4)})
                </bdi>
              </p>
              <p>
                {t(
                  "Blind spots: subsurface drainage, canal water EC, current market contracts and actual planting dates. Water, nitrogen and market scores are prototype rules. Crop coefficients and limits are user-supplied assumptions awaiting local agronomic review.",
                  "نقاط غير مرصودة: الصرف تحت السطحي وملوحة مياه الترعة وعقود السوق ومواعيد الزراعة الفعلية. درجات المياه والنيتروجين والسوق قواعد للنموذج الأولي. معاملات المحاصيل وحدودها افتراضات مقدمة من المستخدم وتحتاج مراجعة زراعية محلية.",
                )}
              </p>
            </div>
          </div>
          <div className="source-grid">
            {Object.entries(data.sources).map(([key, source]) => (
              <div className="source-card" key={key}>
                <Database size={17} />
                <strong>{source.provider}</strong>
                <span>{sourceLabel(source, lang)}</span>
                {source.regionalPreset && (
                  <small>
                    {t("Regional fallback:", "البديل الإقليمي:")}{" "}
                    {source.regionalPreset}
                  </small>
                )}
                {source.retrievedAt && (
                  <small>
                    {t("Retrieved", "استُرجع")} {source.retrievedAt.slice(0, 10)}
                  </small>
                )}
                {source.reason && (
                  <small>
                    {source.kind === "synthetic"
                      ? t(
                          "Illustrative regional fixture; live data unavailable or not requested.",
                          "بيانات إقليمية توضيحية؛ لم تتوفر البيانات الحية أو لم تُطلب.",
                        )
                      : source.reason}
                  </small>
                )}
                <a
                  href={
                    source.url ??
                    (key === "climate"
                      ? "https://power.larc.nasa.gov/"
                      : key === "ndvi"
                        ? "https://modis.ornl.gov/data/modis_webservice.html"
                        : "https://www.isric.org/explore/soilgrids")
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  {t("Source documentation", "توثيق المصدر")} ↗
                </a>
              </div>
            ))}
          </div>
          <p className="small-note">
            {t(
              "Gross water estimate = Σ(base water mm × Kc) × 4.2 ÷ irrigation efficiency. Nitrogen is an ordinal index, not kg N/ha. Model scores are not probabilities or verified yield predictions. Historical 2025 inputs are not a weather forecast.",
              "تقدير المياه الإجمالي = مجموع (المياه الأساسية مم × Kc) × ٤٫٢ ÷ كفاءة الري. النيتروجين مؤشر ترتيبي وليس كغ ن/هكتار. الدرجات ليست احتمالات أو توقعات إنتاج معتمدة. بيانات ٢٠٢٥ التاريخية ليست توقعات جوية.",
            )}
          </p>
        </div>
      )}
    </section>
  );
}
