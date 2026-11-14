import { useEffect, useRef, useState } from "react";
import { Plus, Minus, LocateFixed, Globe2 } from "lucide-react";
import { text } from "../../i18n";
// Equirectangular texture convention used by Three SphereGeometry.
export function earthPoint(lat, lon, radius = 1) {
  const a = (lat * Math.PI) / 180,
    b = (lon * Math.PI) / 180;
  return [
    radius * Math.cos(a) * Math.cos(b),
    radius * Math.sin(a),
    -radius * Math.cos(a) * Math.sin(b),
  ];
}
export default function EarthGlobe({
  lang,
  location,
  presets,
  onLocationChange,
  onMap,
}) {
  const host = useRef(null),
    api = useRef(null),
    latest = useRef({ location, onLocationChange });
  latest.current = { location, onLocationChange };
  const [failed, setFailed] = useState(false);
  const t = (en, ar) => text(lang, en, ar);
  useEffect(() => {
    let disposed = false,
      cleanup;
    Promise.all([
      import("three"),
      import("three/addons/controls/OrbitControls.js"),
    ])
      .then(([T, { OrbitControls }]) => {
        if (disposed) return;
        let renderer;
        try {
          renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
        } catch {
          setFailed(true);
          return;
        }
        const scene = new T.Scene(),
          camera = new T.PerspectiveCamera(40, 1, 0.001, 50);
        renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
        host.current.appendChild(renderer.domElement);
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enablePan = false;
        controls.minDistance = 1.03;
        controls.maxDistance = 6;
        controls.enableDamping = false;
        const geometry = new T.SphereGeometry(1, 64, 48);
        const material = new T.MeshBasicMaterial({ color: 0x92b9c3 });
        const globe = new T.Mesh(geometry, material);
        scene.add(globe);
        const render = () => {
          if (!disposed) renderer.render(scene, camera);
        };
        const loader = new T.TextureLoader();
        const texture = loader.load("/earth/earth.jpg", (tex) => {
          tex.colorSpace = T.SRGBColorSpace;
          material.map = tex;
          material.color.set(0xffffff);
          material.needsUpdate = true;
          render();
        });
        const pins = Object.values(presets).map((p) => {
          const pin = new T.Mesh(
            new T.SphereGeometry(0.014, 12, 12),
            new T.MeshBasicMaterial({ color: 0xffd36e }),
          );
          pin.position.set(...earthPoint(p.lat, p.lon, 1.012));
          pin.userData.preset = p;
          scene.add(pin);
          return pin;
        });
        const selected = new T.Mesh(
          new T.SphereGeometry(0.008, 12, 12),
          new T.MeshBasicMaterial({ color: 0x78efbe }),
        );
        scene.add(selected);
        const focus = (close = false) => {
          camera.position.set(
            ...earthPoint(
              latest.current.location.lat,
              latest.current.location.lon,
              close ? 1.35 : camera.position.length() || 3.2,
            ),
          );
          selected.position.set(
            ...earthPoint(
              latest.current.location.lat,
              latest.current.location.lon,
              1.015,
            ),
          );
          controls.update();
          render();
        };
        const resize = () => {
          if (!host.current) return;
          const { width, height } = host.current.getBoundingClientRect();
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height);
          render();
        };
        const observer = new ResizeObserver(resize);
        observer.observe(host.current);
        const ray = new T.Raycaster();
        let down = null;
        const start = (e) => {
          down = [e.clientX, e.clientY];
        };
        const pick = (e) => {
          if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5)
            return;
          const rect = renderer.domElement.getBoundingClientRect();
          ray.setFromCamera(
            new T.Vector2(
              ((e.clientX - rect.left) / rect.width) * 2 - 1,
              (-(e.clientY - rect.top) / rect.height) * 2 + 1,
            ),
            camera,
          );
          const hit = ray.intersectObjects([globe, ...pins])[0];
          if (!hit) return;
          if (hit.object.userData.preset) {
            const p = hit.object.userData.preset;
            latest.current.onLocationChange(p.lat, p.lon, p.id);
          } else {
            const v = hit.point.normalize();
            latest.current.onLocationChange(
              (Math.asin(v.y) * 180) / Math.PI,
              (Math.atan2(-v.z, v.x) * 180) / Math.PI,
            );
          }
        };
        renderer.domElement.addEventListener("pointerdown", start);
        renderer.domElement.addEventListener("pointerup", pick);
        const lose = (e) => {
          e.preventDefault();
          if (!disposed) setFailed(true);
        };
        renderer.domElement.addEventListener("webglcontextlost", lose);
        controls.addEventListener("change", render);
        api.current = {
          focus,
          zoom: (factor) => {
            camera.position.multiplyScalar(factor);
            camera.position.setLength(
              Math.max(1.03, Math.min(6, camera.position.length())),
            );
            controls.update();
            render();
          },
        };
        focus();
        resize();
        cleanup = () => {
          observer.disconnect();
          controls.dispose();
          renderer.domElement.removeEventListener("pointerdown", start);
          renderer.domElement.removeEventListener("pointerup", pick);
          renderer.domElement.removeEventListener("webglcontextlost", lose);
          geometry.dispose();
          material.dispose();
          texture.dispose();
          [...pins, selected].forEach((p) => {
            p.geometry.dispose();
            p.material.dispose();
          });
          renderer.dispose();
          renderer.domElement.remove();
          api.current = null;
        };
      })
      .catch(() => {
        if (!disposed) setFailed(true);
      });
    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [presets]);
  useEffect(() => {
    api.current?.focus(true);
  }, [location]);
  return (
    <div
      className="earth-stage"
      aria-label={t("Interactive 3D Earth", "الأرض التفاعلية ثلاثية الأبعاد")}
    >
      <div className="earth-caption">
        <span className="earth-live-dot" />{" "}
        {t("EXPLORE YOUR FIELD", "استكشف أرضك")}
        <small>
          {t("Egypt · historical 2025 data", "مصر · بيانات تاريخية ٢٠٢٥")}
        </small>
        <small dir="ltr">
          {location.lat.toFixed(4)}° N, {location.lon.toFixed(4)}° E
        </small>
      </div>
      <div className="earth-render" ref={host} aria-hidden="true" />
      {failed && (
        <div className="earth-fallback">
          <Globe2 size={48} />
          <p>
            {t(
              "3D is unavailable on this device.",
              "العرض ثلاثي الأبعاد غير متاح على جهازك.",
            )}
          </p>
          <button className="button" onClick={onMap}>
            {t("Open field map", "افتح خريطة الأرض")}
          </button>
        </div>
      )}
      <div className="earth-tools">
        <button
          onClick={() => api.current?.zoom(0.8)}
          aria-label={t("Zoom Earth in", "تكبير الأرض")}
        >
          <Plus size={18} />
        </button>
        <button
          onClick={() => api.current?.zoom(1.25)}
          aria-label={t("Zoom Earth out", "تصغير الأرض")}
        >
          <Minus size={18} />
        </button>
        <button
          onClick={() => api.current?.focus()}
          aria-label={t("Focus selected region", "ركز على المنطقة المختارة")}
        >
          <LocateFixed size={18} />
        </button>
      </div>
      <div className="earth-legend">
        <span>● {t("Quick locations", "مواقع سريعة")}</span>
        <span>● {t("Your selection", "اختيارك")}</span>
      </div>
      <span className="earth-hint">
        {t(
          "Drag to rotate · scroll or pinch to zoom",
          "اسحب للتدوير · قرّب للتكبير",
        )}
      </span>
    </div>
  );
}
