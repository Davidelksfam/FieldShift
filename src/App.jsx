import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  CircleHelp,
  LoaderCircle,
  MapPin,
  RefreshCw,
  Satellite,
  WifiOff,
} from "lucide-react";
import crops from "./data/egyptCrops.json";
import presets from "./data/demoPresets.json" with { type: "json" };
import { evaluateFieldAndRotations } from "./engine/rotationEngine";
import {
  fetchUnifiedFarmData,
  getInitialFarmData,
} from "./services/nasaDataService";
import { text } from "./i18n";
import HeaderBar from "./components/HeaderBar";
import FarmerInputPanel from "./components/FarmerInputPanel";
import FarmMap from "./components/FarmMap";
import VulnerabilityBanner from "./components/VulnerabilityBanner";
import StrategyComparison from "./components/StrategyComparison";
import SatelliteEvidenceDrawer from "./components/SatelliteEvidenceDrawer";

import FieldIndicesPanel from "./components/FieldIndicesPanel";
import PipelineExplorer from "./components/PipelineExplorer";

const initialPreset = presets.fayoum_etsa;
const initialInputs = {
  ...initialPreset.defaults,
  feddans: 5,
  qirats: 0,
  currentWinterId: "wheat",
  currentSummerId: "maize",
  hasLivestock: false,
  weights: { water: 50, soil: 30, market: 20 },
};
export default function App() {
  const [lang, setLang] = useState("ar");
  const [judgeMode, setJudgeMode] = useState(false);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [inputs, setInputs] = useState(initialInputs);
  const [location, setLocation] = useState({
    lat: initialPreset.lat,
    lon: initialPreset.lon,
    presetId: initialPreset.id,
  });
  const [coordinates, setCoordinates] = useState({
    lat: String(initialPreset.lat),
    lon: String(initialPreset.lon),
  });
  const [data, setData] = useState(() =>
    getInitialFarmData(initialPreset.lat, initialPreset.lon, initialPreset.id),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [offline, setOffline] = useState(!navigator.onLine);
  const evidenceRef = useRef(null);
  const t = (en, ar) => text(lang, en, ar);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);
  useEffect(() => {
    const online = () => setOffline(false);
    const offlineHandler = () => setOffline(true);
    window.addEventListener("online", online);
    window.addEventListener("offline", offlineHandler);
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offlineHandler);
    };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setLoading(true);
    fetchUnifiedFarmData(location.lat, location.lon, location.presetId, {
      signal: controller.signal,
    })
      .then((result) => {
        if (active) setData(result);
      })
      .catch((e) => {
        if (active && e.name !== "AbortError") setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [location, refresh]);
  const invalidMeasuredEce = inputs.soilEceDsm !== null && inputs.soilEceDsm !== undefined &&
    (!Number.isFinite(inputs.soilEceDsm) || inputs.soilEceDsm < 0 || inputs.soilEceDsm > 100);
  const validationError =
    invalidMeasuredEce ||
    Number(inputs.feddans) < 0 ||
    Number(inputs.feddans) > 100000 ||
    !Number.isFinite(Number(inputs.feddans)) ||
    Number(inputs.qirats) < 0 ||
    Number(inputs.qirats) > 23 ||
    !Number.isInteger(Number(inputs.qirats)) ||
    Number(inputs.feddans) + Number(inputs.qirats) / 24 <= 0;
  const evaluation = useMemo(
    () =>
      validationError ? null : evaluateFieldAndRotations(data, inputs, crops),
    [data, inputs, validationError],
  );
  function changeLocation(lat, lon, presetId = null) {
    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lon) ||
      lat < 22 ||
      lat > 32.5 ||
      lon < 24 ||
      lon > 37
    ) {
      setError(
        t(
          "Choose a location within Egypt: latitude 22–32.5, longitude 24–37.",
          "اختر موقعاً داخل مصر: خط عرض ٢٢–٣٢٫٥ وخط طول ٢٤–٣٧.",
        ),
      );
      return;
    }
    setError("");
    setLocation({ lat, lon, presetId });
    setCoordinates({ lat: lat.toFixed(4), lon: lon.toFixed(4) });
    setData(getInitialFarmData(lat, lon, presetId));
    if (presetId)
      setInputs((current) => ({ ...current, ...presets[presetId].defaults }));
  }
  function showEvidence() {
    setEvidenceOpen(true);
    requestAnimationFrame(() =>
      evidenceRef.current?.scrollIntoView({
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
        block: "start",
      }),
    );
  }
  const syntheticCount = Object.values(data.sources).filter(
    (s) => s.kind === "synthetic",
  ).length;
  return (
    <>
      <a className="skip-link" href="#main">
        {t("Skip to comparison", "انتقل إلى المقارنة")}
      </a>
      <HeaderBar
        lang={lang}
        onLanguageChange={setLang}
        judgeMode={judgeMode}
        onJudgeModeChange={(value) => {
          setJudgeMode(value);
          setEvidenceOpen(value);
        }}
      />
      <div className="workspace">
        <FarmerInputPanel
          lang={lang}
          inputs={inputs}
          setInputs={setInputs}
          presetId={location.presetId}
          onPresetChange={(id) =>
            changeLocation(presets[id].lat, presets[id].lon, id)
          }
          crops={crops}
        />
        <main id="main">
          <div className="page-intro">
            <div>
              <div className="eyebrow">
                <span className="green-dot" />
                {t("FIELD INTELLIGENCE / EGYPT", "رؤية أوضح لأرضك / مصر")}
              </div>
              <h1>
                {t(
                  "A better rotation starts here.",
                  "دورة زراعية أفضل تبدأ من هنا.",
                )}
              </h1>
              <p>
                {t(
                  "Understand your field. Compare the trade-offs. Plan with clarity.",
                  "افهم أرضك. قارن الخيارات. وخطط بوضوح.",
                )}
              </p>
            </div>
            <button className="button evidence-link" onClick={showEvidence}>
              <Satellite size={18} />
              {t("Explore the evidence", "استكشف الأدلة")}
              <ArrowUpRight size={16} />
            </button>
          </div>
          <div className="data-status" role="status" aria-live="polite">
            {loading ? (
              <LoaderCircle className="spin" size={18} />
            ) : offline ? (
              <WifiOff size={18} />
            ) : (
              <Satellite size={18} />
            )}
            <div>
              <strong>
                {loading
                  ? t(
                      "Refreshing historical sources…",
                      "جارٍ تحديث المصادر التاريخية…",
                    )
                  : syntheticCount === 3
                    ? t(
                        "Demo fixtures · ready offline",
                        "بيانات توضيحية · جاهزة دون اتصال",
                      )
                    : syntheticCount
                      ? t(
                          "Mixed sources · regional fallback in use",
                          "مصادر مختلطة · بديل إقليمي مستخدم",
                        )
                      : t(
                          "Historical observations · 2025",
                          "أرصاد تاريخية · ٢٠٢٥",
                        )}
              </strong>
              <span>
                {loading
                  ? t(
                      "Local comparison is ready now. Live requests stop after 4.5 seconds.",
                      "المقارنة المحلية جاهزة الآن. تنتهي الطلبات الحية خلال ٤٫٥ ثانية.",
                    )
                  : syntheticCount
                    ? t(
                        "Illustrative values are labeled. Open evidence for source-by-source provenance.",
                        "القيم التوضيحية معلّمة. افتح الأدلة لمعرفة أصل كل مصدر.",
                      )
                    : t(
                        "Source dates and spatial limitations are available in the evidence panel.",
                        "تواريخ المصادر وحدود الدقة المكانية متاحة في لوحة الأدلة.",
                      )}
              </span>
            </div>
            <button
              className="button compact"
              disabled={loading}
              onClick={() => setRefresh((n) => n + 1)}
              aria-label={t("Refresh sources", "تحديث المصادر")}
            >
              <RefreshCw size={16} />
              <span>{t("Refresh", "تحديث")}</span>
            </button>
          </div>
          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}
          {validationError && (
            <div className="error-message" role="alert">
              {t(
                invalidMeasuredEce ? "Measured soil ECe must be between 0 and 100 dS/m." : "Enter a total area greater than zero (up to 100,000 feddans), with 0–23 whole extra qirats.",
                invalidMeasuredEce ? "يجب أن تكون ملوحة التربة ECe المقاسة بين صفر و١٠٠ dS/m." : "أدخل مساحة إجمالية أكبر من صفر وحتى ١٠٠ ألف فدان، ومن ٠ إلى ٢٣ قيراطاً إضافياً صحيحاً.",
              )}
            </div>
          )}
          {evaluation && (
            <VulnerabilityBanner
              lang={lang}
              diagnostics={evaluation.diagnostics}
              data={data}
            />
          )}
          {evaluation && (
            <FieldIndicesPanel
              lang={lang}
              diagnostics={evaluation.diagnostics}
            />
          )}
          <FarmMap
            lang={lang}
            lat={location.lat}
            lon={location.lon}
            onLocationChange={changeLocation}
          />
          <form
            className="coordinate-form"
            onSubmit={(e) => {
              e.preventDefault();
              changeLocation(
                coordinates.lat.trim() ? Number(coordinates.lat) : NaN,
                coordinates.lon.trim() ? Number(coordinates.lon) : NaN,
              );
            }}
          >
            <MapPin size={16} />
            <span>{t("Or enter coordinates", "أو أدخل الإحداثيات")}</span>
            <label>
              {t("Latitude", "خط العرض")}
              <input
                type="number"
                step="any"
                value={coordinates.lat}
                onChange={(e) =>
                  setCoordinates((c) => ({ ...c, lat: e.target.value }))
                }
                required
              />
            </label>
            <label>
              {t("Longitude", "خط الطول")}
              <input
                type="number"
                step="any"
                value={coordinates.lon}
                onChange={(e) =>
                  setCoordinates((c) => ({ ...c, lon: e.target.value }))
                }
                required
              />
            </label>
            <button className="button" type="submit">
              {t("Analyze location", "تحليل الموقع")}
            </button>
          </form>
          {evaluation && (
            <StrategyComparison
              lang={lang}
              strategies={evaluation.strategies}
            />
          )}
          <div ref={evidenceRef}>
            <SatelliteEvidenceDrawer
              diagnostics={evaluation?.diagnostics}
              hasRecommendedCover={evaluation?.strategies.some(
                (s) => s.id !== "baseline" && s.conditionalNili,
              )}
              lang={lang}
              data={data}
              open={evidenceOpen}
              onToggle={setEvidenceOpen}
            />
          </div>
          {judgeMode && evaluation && (
            <PipelineExplorer lang={lang} data={data} evaluation={evaluation} />
          )}
          <footer className="page-footer">
            <span dir="ltr">
              fieldshift. <span>© 2026</span>
            </span>
            <p>
              <CircleHelp size={15} />
              {t(
                "Historical evidence. Transparent rules. Local expertise.",
                "أدلة تاريخية. قواعد واضحة. خبرة محلية.",
              )}
            </p>
          </footer>
        </main>
      </div>
    </>
  );
}
