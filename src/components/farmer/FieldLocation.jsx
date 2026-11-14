import { lazy, Suspense, useState, useEffect, useRef } from "react";
import { MapPin, LocateFixed, Check } from "lucide-react";
import { text } from "../../i18n";
import FarmMap from "../FarmMap";
const EarthGlobe = lazy(() => import("./EarthGlobe"));
export default function FieldLocation({
  lang,
  expert = false,
  location,
  coordinates,
  setCoordinates,
  presets,
  onLocationChange,
  intro = false,
  error = "",
}) {
  const [locating, setLocating] = useState(false);
  const [fallbackMap, setFallbackMap] = useState(false);
  const [geoError, setGeoError] = useState("");
  const geoRequest = useRef(0);
  useEffect(() => {
    geoRequest.current++;
    setLocating(false);
    setGeoError("");
    return () => {
      geoRequest.current++;
    };
  }, [location]);
  function locate() {
    const request = ++geoRequest.current;
    setGeoError("");
    if (!navigator.geolocation) {
      setGeoError(
        t(
          "Location is unavailable. Choose a quick location or the map.",
          "الموقع غير متاح. اختر موقعاً سريعاً أو الخريطة.",
        ),
      );
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        if (request !== geoRequest.current) return;
        setLocating(false);
        onLocationChange(p.coords.latitude, p.coords.longitude);
      },
      (e) => {
        if (request !== geoRequest.current) return;
        setLocating(false);
        setGeoError(
          t(
            e.code === 1
              ? "Location permission denied. You can still use the map or quick locations."
              : "Could not get your location. Use the map or quick locations.",
            "تعذر تحديد موقعك. استخدم الخريطة أو المواقع السريعة.",
          ),
        );
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 },
    );
  }
  const t = (en, ar) => text(lang, en, ar);
  return (
    <section
      className="field-location immersive-map"
      aria-label={t("Select your field", "اختار أرضك")}
      aria-hidden={intro ? true : undefined}
      inert={intro ? true : undefined}
    >
      {fallbackMap ? (
        <FarmMap
          lang={lang}
          lat={location.lat}
          lon={location.lon}
          compact={!expert}
          onLocationChange={onLocationChange}
        />
      ) : (
        <Suspense
          fallback={
            <p className="earth-loading" role="status">
              {t("Loading Earth…", "جارٍ تحميل الأرض…")}
            </p>
          }
        >
          <EarthGlobe
            intro={intro}
            lang={lang}
            location={location}
            presets={presets}
            onLocationChange={onLocationChange}
            onMap={() => setFallbackMap(true)}
          />
        </Suspense>
      )}
      <div className="map-location-dock" data-map-obstacle>
        {error && (
          <p className="geo-error" role="alert">
            {error}
          </p>
        )}
        <div className="map-dock-label">
          <MapPin size={16} />
          {t("Choose your starting point", "اختار مكان أرضك")}
        </div>
        <div className="map-dock-controls">
          <div className="quick-locations">
            {Object.values(presets).map((p) => (
              <button
                key={p.id}
                data-testid={`quick-${p.id}`}
                className={location.presetId === p.id ? "active" : ""}
                aria-pressed={location.presetId === p.id}
                onClick={() => onLocationChange(p.lat, p.lon, p.id)}
              >
                <MapPin size={18} />
                <span>
                  {expert
                    ? lang === "ar"
                      ? p.nameAr
                      : p.nameEn
                    : {
                        fayoum_etsa: t("Fayoum", "الفيوم"),
                        delta_kafr_el_sheikh: t("North Delta", "شمال الدلتا"),
                        west_delta_nubariya: t("Nubariya", "النوبارية"),
                      }[p.id]}
                </span>
                {location.presetId === p.id && <Check size={16} />}
              </button>
            ))}
          </div>
          <div className="geo-row">
            <button className="button" disabled={locating} onClick={locate}>
              <LocateFixed size={17} />
              {locating
                ? t("Locating…", "جارٍ التحديد…")
                : t("Use my location", "استخدم موقعي")}
            </button>
            <small>{t("Egypt only", "داخل مصر")}</small>
          </div>
          {geoError && (
            <p role="alert" className="geo-error">
              {geoError}
            </p>
          )}
          <div className="panel location-controls">
            <label className="field-label saved-location-select">
              {t("Saved locations · shortcuts", "مواقع محفوظة · اختصارات")}
              <select
                aria-label={t("Saved locations", "مواقع محفوظة")}
                tabIndex={-1}
                value={location.presetId ?? ""}
                onChange={(e) => {
                  const p = presets[e.target.value];
                  if (p) onLocationChange(p.lat, p.lon, p.id);
                }}
              >
                <option value="" disabled>
                  {t("Custom map location", "موقع مخصص من الخريطة")}
                </option>
                {Object.values(presets).map((p) => (
                  <option value={p.id} key={p.id}>
                    {lang === "ar" ? p.nameAr : p.nameEn}
                  </option>
                ))}
              </select>
            </label>

            <details>
              <summary>
                {t("Enter coordinates instead", "أدخل الإحداثيات بدل الخريطة")}
              </summary>
              <form
                className="coordinate-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  onLocationChange(
                    coordinates.lat.trim() ? Number(coordinates.lat) : NaN,
                    coordinates.lon.trim() ? Number(coordinates.lon) : NaN,
                  );
                }}
              >
                <label>
                  {t("Latitude", "خط العرض")}
                  <input
                    type="number"
                    step="any"
                    required
                    value={coordinates.lat}
                    onChange={(e) =>
                      setCoordinates((c) => ({ ...c, lat: e.target.value }))
                    }
                  />
                </label>
                <label>
                  {t("Longitude", "خط الطول")}
                  <input
                    type="number"
                    step="any"
                    required
                    value={coordinates.lon}
                    onChange={(e) =>
                      setCoordinates((c) => ({ ...c, lon: e.target.value }))
                    }
                  />
                </label>
                <button className="button" type="submit">
                  {t("Use this location", "استخدم الموقع ده")}
                </button>
              </form>
            </details>
          </div>
        </div>
        <p className="map-evidence-note">
          {t(
            "A point locates regional evidence, not your field boundary.",
            "النقطة بتحدد مكان البيانات الإقليمية، مش حدود أرضك.",
          )}
        </p>
      </div>
    </section>
  );
}
