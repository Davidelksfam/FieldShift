import { useEffect, useMemo, useRef, useState } from "react";
import { CircleHelp } from "lucide-react";
import crops from "./data/egyptCrops.json";
import presets from "./data/demoPresets.json" with { type: "json" };
import { evaluateFieldAndRotations } from "./engine/rotationEngine";
import {
  fetchUnifiedFarmData,
  getInitialFarmData,
  REQUEST_TIMEOUT_MS,
  EXTENDED_REQUEST_TIMEOUT_MS,
} from "./services/nasaDataService";
import { text } from "./i18n";
import HeaderBar from "./components/HeaderBar";
import FarmerInputPanel from "./components/FarmerInputPanel";
import VulnerabilityBanner from "./components/VulnerabilityBanner";
import StrategyComparison from "./components/StrategyComparison";
import SatelliteEvidenceDrawer from "./components/SatelliteEvidenceDrawer";
import FieldIndicesPanel from "./components/FieldIndicesPanel";
import PipelineExplorer from "./components/PipelineExplorer";
import FieldSummary from "./components/farmer/FieldSummary";
import FieldInputs from "./components/farmer/FieldInputs";
import FieldLocation from "./components/farmer/FieldLocation";
import SourceStatus from "./components/farmer/SourceStatus";
import ThreeStrategyComparison from "./components/farmer/ThreeStrategyComparison";
import {
  GOALS,
  areaIsValid,
  evaluationInputs,
  comparisonSourceSupport,
} from "./presentation/farmerModel";
import { SCIENTIFIC_V2_ENABLED } from "./engine/engineAdapter";
import ScientificV2Inspector from "./components/ScientificV2Inspector";
const initialPreset = presets.fayoum_etsa;
const initialInputs = {
  ...initialPreset.defaults,
  feddans: "",
  estimateArea: false,
  goal: "water",
  qirats: 0,
  currentWinterId: "wheat",
  currentSummerId: "maize",
  hasLivestock: false,
  weights: { ...GOALS.water.weights },
};
export default function App() {
  const [lang, setLang] = useState("ar"),
    [expert, setExpert] = useState(false),
    [evidenceOpen, setEvidenceOpen] = useState(false);
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
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [refresh, setRefresh] = useState(0),
    [requestTimeout, setRequestTimeout] = useState(REQUEST_TIMEOUT_MS);
  const [progress, setProgress] = useState({}),
    [allowIllustrative, setAllowIllustrative] = useState(false);
  const [offline, setOffline] = useState(!navigator.onLine);
  const comparisonRef = useRef(null),
    requestRef = useRef(null);
  const t = (en, ar) => text(lang, en, ar);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);
  useEffect(() => {
    const online = () => setOffline(false),
      offlineHandler = () => setOffline(true);
    window.addEventListener("online", online);
    window.addEventListener("offline", offlineHandler);
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offlineHandler);
    };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    requestRef.current = controller;
    let active = true;
    setLoading(true);
    setProgress({});
    setError("");
    fetchUnifiedFarmData(location.lat, location.lon, location.presetId, {
      signal: controller.signal,
      timeoutMs: requestTimeout,
      onDataUpdate: (result) => {
        if (active) setData(result);
      },
      onSourceUpdate: (event) => {
        if (active) setProgress((p) => ({ ...p, [event.key]: event }));
      },
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
  }, [location, refresh, requestTimeout]);
  const invalidMeasuredEce =
    inputs.soilEceDsm != null &&
    (!Number.isFinite(inputs.soilEceDsm) ||
      inputs.soilEceDsm < 0 ||
      inputs.soilEceDsm > 100);
  const evaluation = useMemo(
    () =>
      invalidMeasuredEce
        ? null
        : evaluateFieldAndRotations(data, evaluationInputs(inputs), crops),
    [data, inputs, invalidMeasuredEce],
  );
  const support = comparisonSourceSupport(data);
  const visible = !support.illustrative || allowIllustrative;
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
    const matched = Object.values(presets).find(
      (p) => Math.abs(p.lat - lat) < 1e-7 && Math.abs(p.lon - lon) < 1e-7,
    );
    const id = presetId ?? matched?.id ?? null;
    setError("");
    setAllowIllustrative(false);
    setRequestTimeout(REQUEST_TIMEOUT_MS);
    setProgress({});
    setLoading(true);
    setLocation({ lat, lon, presetId: id });
    setCoordinates({ lat: lat.toFixed(4), lon: lon.toFixed(4) });
    setData(getInitialFarmData(lat, lon, id));
  }
  function retry() {
    setRequestTimeout(EXTENDED_REQUEST_TIMEOUT_MS);
    setRefresh((n) => n + 1);
  }
  function compare() {
    comparisonRef.current?.focus();
    comparisonRef.current?.scrollIntoView({
      block: "start",
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }
  const validation = (
    <>
      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}
      {invalidMeasuredEce && (
        <div className="error-message" role="alert">
          {t(
            "Measured soil ECe must be between 0 and 100 dS/m.",
            "يجب أن تكون ملوحة التربة ECe المقاسة بين صفر و١٠٠ dS/m.",
          )}
        </div>
      )}
      {inputs.estimateArea && !areaIsValid(inputs) && (
        <div className="error-message" role="alert">
          {t(
            "Enter a total area greater than zero (up to 100,000 feddans), with 0–23 whole extra qirats. Per-feddan comparisons remain available; whole-field totals are hidden.",
            "أدخل مساحة أكبر من صفر وحتى ١٠٠ ألف فدان، ومن ٠ إلى ٢٣ قيراطاً إضافياً صحيحاً. المقارنة بالفدان متاحة؛ إجمالي الأرض مخفي.",
          )}
        </div>
      )}
    </>
  );
  const map = (
    <FieldLocation
      lang={lang}
      location={location}
      coordinates={coordinates}
      setCoordinates={setCoordinates}
      presets={presets}
      onLocationChange={changeLocation}
    />
  );
  const sources = (
    <SourceStatus
      lang={lang}
      data={data}
      loading={loading}
      progress={progress}
      onRetry={retry}
      onCancel={() => {
        requestRef.current?.abort();
        setLoading(false);
        setProgress({});
      }}
      offline={offline}
      diagnostics={evaluation?.diagnostics}
    />
  );
  return (
    <>
      <a className="skip-link" href="#comparison">
        {t("Skip to comparison", "انتقل إلى المقارنة")}
      </a>
      <HeaderBar
        lang={lang}
        onLanguageChange={setLang}
        judgeMode={expert}
        onJudgeModeChange={(value) => {
          setExpert(value);
          setEvidenceOpen(value);
        }}
      />
      <div
        className={`workspace ${expert ? "expert-workspace" : "farmer-workspace map-cards-workspace"}`}
      >
        {expert && (
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
        )}
        <main id="main">
          <div className="farmer-intro">
            <span className="eyebrow">
              {t("YOUR FIELD · YOUR NEXT ROTATION", "أرضك · دورتك الجاية")}
            </span>
            <h1>
              {expert
                ? t(
                    "Inspect the evidence and calculations",
                    "افحص الأدلة والحسابات",
                  )
                : t(
                    "Find your field. Compare your options.",
                    "حدّد أرضك. وقارن خططك بالأرقام.",
                  )}
            </h1>
            <p>
              {t(
                "Select a point on the map, enter your crops and irrigation, then compare three strategies using the same calculated quantities.",
                "اختار نقطة على الخريطة، أدخل محاصيلك وطريقة الري، وقارن ٣ استراتيجيات بنفس الكميات المحسوبة.",
              )}
            </p>
          </div>
          {validation}
          {expert ? (
            <>
              {sources}
              {map}
              {evaluation && (
                <>
                  <VulnerabilityBanner
                    lang={lang}
                    diagnostics={evaluation.diagnostics}
                    data={data}
                  />
                  <FieldIndicesPanel
                    lang={lang}
                    diagnostics={evaluation.diagnostics}
                  />
                  <div id="comparison" tabIndex="-1">
                    <StrategyComparison
                      lang={lang}
                      strategies={evaluation.strategies}
                      showTotals={inputs.estimateArea && areaIsValid(inputs)}
                    />
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              <div className="field-setup-grid">
                {map}
                <FieldInputs
                  lang={lang}
                  inputs={inputs}
                  setInputs={setInputs}
                  crops={crops}
                  onCompare={compare}
                  invalid={invalidMeasuredEce}
                />
              </div>
              {sources}
              <div id="comparison" tabIndex="-1">
                <ThreeStrategyComparison
                  ref={comparisonRef}
                  lang={lang}
                  evaluation={evaluation}
                  data={data}
                  inputs={inputs}
                  visible={visible}
                  loading={loading}
                  illustrative={support.illustrative}
                  onShowExample={() => setAllowIllustrative(true)}
                />
              </div>
              {evaluation && visible && (
                <details className="workspace-summary">
                  <summary>
                    {t("Read the field summary", "اقرأ ملخص حالة أرضك")}
                  </summary>
                  <FieldSummary
                    lang={lang}
                    data={data}
                    diagnostics={evaluation.diagnostics}
                    inputs={inputs}
                  />
                </details>
              )}
            </>
          )}
          {expert && (
            <>
              <SatelliteEvidenceDrawer
                lang={lang}
                diagnostics={evaluation?.diagnostics}
                hasRecommendedCover={evaluation?.strategies.some(
                  (s) => s.id !== "baseline" && s.conditionalNili,
                )}
                data={data}
                open={evidenceOpen}
                onToggle={setEvidenceOpen}
              />
              {SCIENTIFIC_V2_ENABLED && (
                <ScientificV2Inspector
                  lang={lang}
                  data={data}
                  inputs={inputs}
                  crops={crops}
                  location={location}
                />
              )}
              {evaluation && (
                <PipelineExplorer
                  lang={lang}
                  data={data}
                  evaluation={evaluation}
                />
              )}
            </>
          )}
          <footer className="page-footer">
            <span dir="ltr">
              fieldshift. <span>© 2026</span>
            </span>
            <p>
              <CircleHelp size={15} />
              {t(
                "Historical evidence. Transparent calculations. Local review.",
                "أدلة تاريخية. حسابات واضحة. مراجعة محلية.",
              )}
            </p>
          </footer>
        </main>
      </div>
    </>
  );
}
