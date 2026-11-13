import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  useMap,
  useMapEvents,
  Tooltip,
} from "react-leaflet";
import { Layers, MapPin } from "lucide-react";
import { text } from "../i18n";

const overlays = {
  ndvi: { layer: "MODIS_Terra_NDVI_8Day", level: 9 },
  temperature: { layer: "MODIS_Terra_Land_Surface_Temp_Day", level: 7 },
};
function MapController({ lat, lon, onLocationChange }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lon], map.getZoom(), { animate: false });
  }, [lat, lon, map]);
  useMapEvents({ click: (e) => onLocationChange(e.latlng.lat, e.latlng.lng) });
  return null;
}
export default function FarmMap({ lang, lat, lon, onLocationChange }) {
  const [overlay, setOverlay] = useState("imagery");
  const [tileError, setTileError] = useState(false);
  const layer = overlays[overlay];
  return (
    <section className="map-panel panel" aria-labelledby="map-title">
      <div className="section-heading map-heading">
        <div>
          <h2 id="map-title">
            <MapPin size={18} />
            {text(lang, "Find your field", "حدد موقع أرضك")}
          </h2>
          <p>
            {text(
              lang,
              "Click within Egypt to compare a new location.",
              "اضغط داخل مصر لمقارنة موقع جديد.",
            )}
          </p>
        </div>
        <span className="coordinate" dir="ltr">
          {lat.toFixed(4)}° N, {lon.toFixed(4)}° E
        </span>
      </div>
      <div className="map-toolbar">
        <Layers size={16} />
        <label>
          {text(lang, "Satellite layer", "طبقة القمر الصناعي")}
          <select
            aria-label={text(lang, "Satellite layer", "طبقة القمر الصناعي")}
            value={overlay}
            onChange={(e) => {
              setTileError(false);
              setOverlay(e.target.value);
            }}
          >
            <option value="imagery">
              {text(lang, "Esri · field imagery", "Esri · صور الأرض")}
            </option>
            <option value="ndvi">NASA GIBS · NDVI</option>
            <option value="temperature">
              {text(
                lang,
                "NASA GIBS · land temperature",
                "NASA GIBS · حرارة السطح",
              )}
            </option>
          </select>
        </label>
        <span className="small-note">
          {layer
            ? "12 JUL 2025"
            : text(lang, "Imagery dates vary", "تختلف تواريخ الصور")}
        </span>
      </div>
      <div className="map-canvas" dir="ltr">
        <MapContainer
          center={[lat, lon]}
          zoom={11}
          minZoom={5}
          maxZoom={18}
          scrollWheelZoom={false}
          maxBounds={[
            [20, 22],
            [34, 39],
          ]}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics"
            eventHandlers={{ tileerror: () => setTileError(true) }}
          />
          {layer && (
            <TileLayer
              key={overlay}
              url={`https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${layer.layer}/default/2025-07-12/GoogleMapsCompatible_Level${layer.level}/{z}/{y}/{x}.png`}
              maxNativeZoom={layer.level}
              maxZoom={18}
              opacity={0.65}
              attribution="NASA EOSDIS GIBS"
              eventHandlers={{ tileerror: () => setTileError(true) }}
            />
          )}
          <CircleMarker
            center={[lat, lon]}
            radius={9}
            pathOptions={{
              color: "var(--fs-bg-surface)",
              weight: 3,
              fillColor: "var(--fs-action-bg)",
              fillOpacity: 1,
            }}
          >
            <Tooltip direction="top">
              {text(lang, "Analysis centroid", "مركز التحليل")}
            </Tooltip>
          </CircleMarker>
          <MapController
            lat={lat}
            lon={lon}
            onLocationChange={onLocationChange}
          />
        </MapContainer>
        <div className="map-tag">
          {text(
            lang,
            "Centroid selection · no field boundary",
            "اختيار مركز التحليل · دون حدود الحقل",
          )}
        </div>
      </div>
      <div className="map-footnote">
        {tileError
          ? text(
              lang,
              "Some map tiles are unavailable. Presets, coordinate entry and local comparisons remain available.",
              "بعض مربعات الخريطة غير متاحة. يمكنك استخدام المناطق المحفوظة والإحداثيات والمقارنة المحلية.",
            )
          : layer
            ? text(
                lang,
                "Historical coarse raster, resampled when zoomed. Land surface temperature differs from air temperature.",
                "طبقة تاريخية خشنة تُعاد معاينتها عند التكبير. حرارة السطح تختلف عن حرارة الهواء.",
              )
            : text(
                lang,
                "Esri imagery for orientation; NASA overlays are historical evidence.",
                "صور Esri لتحديد الموقع؛ طبقات ناسا أدلة تاريخية.",
              )}
      </div>
    </section>
  );
}
