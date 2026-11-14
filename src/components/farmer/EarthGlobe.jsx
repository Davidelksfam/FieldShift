import { useEffect, useRef, useState } from "react";
import { Globe2, LocateFixed, Minus, Pause, Play, Plus } from "lucide-react";
import { text } from "../../i18n";
import blueMarble from "../../assets/earth/earth-blue-marble.jpg";
import topology from "../../assets/earth/earth-topology.png";
import nightSky from "../../assets/earth/night-sky.png";
import plainEarth from "../../assets/earth/plain-earth.jpg";

// Shared equirectangular convention: sphere picks and markers use the same axes.
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
  variant,
  lang,
  location,
  presets,
  onLocationChange,
  onMap,
}) {
  const host = useRef(null),
    api = useRef(null);
  const latest = useRef({ location, onLocationChange, onMap });
  latest.current = { location, onLocationChange, onMap };
  const [failed, setFailed] = useState(false),
    [ready, setReady] = useState(false);
  const [intro, setIntro] = useState(variant === "3d");
  const [rotating, setRotating] = useState(false);
  const [distance, setDistance] = useState(3.55);
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
        const container = host.current;
        container.appendChild(renderer.domElement);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        const scene = new T.Scene();
        const camera = new T.PerspectiveCamera(40, 1, 0.01, 50);
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enablePan = false;
        controls.minDistance = 1.04;
        controls.maxDistance = 6;
        controls.enableDamping = false;
        controls.zoomSpeed = 1.4;
        controls.autoRotateSpeed = 0.55;
        const motion = matchMedia("(prefers-reduced-motion: reduce)");
        controls.autoRotate = variant === "3d" && !motion.matches;
        setRotating(controls.autoRotate);
        let frame = 0,
          animation = null,
          started = variant !== "3d",
          handedOff = false;
        const geometry = new T.SphereGeometry(1, 64, 48);
        const material =
          variant === "3d"
            ? new T.MeshPhongMaterial({
                color: 0xffffff,
                shininess: 5,
                bumpScale: 0.008,
              })
            : new T.MeshBasicMaterial({ color: 0xffffff });
        const globe = new T.Mesh(geometry, material);
        scene.add(globe);
        scene.add(new T.AmbientLight(0xffffff, 1.6));
        const sunlight = new T.DirectionalLight(0xffffff, 2);
        sunlight.position.set(3, 2, 4);
        scene.add(sunlight);
        // Branch's sage atmosphere, adapted to the existing Three.js selector.
        const halo =
          variant === "3d"
            ? new T.Mesh(
                new T.SphereGeometry(1.07, 48, 32),
                new T.ShaderMaterial({
                  uniforms: { tint: { value: new T.Color(0x86efac) } },
                  vertexShader: `varying vec3 normalView; varying vec3 positionView;
              void main() { vec4 p = modelViewMatrix * vec4(position, 1.0); normalView = normalize(normalMatrix * normal); positionView = p.xyz; gl_Position = projectionMatrix * p; }`,
                  fragmentShader: `uniform vec3 tint; varying vec3 normalView; varying vec3 positionView;
              void main() { float rim = pow(1.0 - abs(dot(normalize(normalView), normalize(-positionView))), 3.0); gl_FragColor = vec4(tint, rim * 0.35); }`,
                  transparent: true,
                  side: T.BackSide,
                  depthWrite: false,
                }),
              )
            : null;
        if (halo) scene.add(halo);
        const pins = Object.values(presets).map((preset) => {
          const pin = new T.Mesh(
            new T.SphereGeometry(0.014, 12, 12),
            new T.MeshBasicMaterial({ color: 0xffd36e }),
          );
          pin.position.set(...earthPoint(preset.lat, preset.lon, 1.014));
          pin.userData.preset = preset;
          scene.add(pin);
          return pin;
        });
        const selected = new T.Mesh(
          new T.SphereGeometry(0.009, 12, 12),
          new T.MeshBasicMaterial({ color: 0x78efbe }),
        );
        scene.add(selected);
        const render = () => {
          if (!disposed) renderer.render(scene, camera);
        };
        const tick = (now) => {
          frame = 0;
          if (disposed || document.hidden) return;
          if (animation) {
            const p = Math.min(1, (now - animation.start) / 1400);
            const eased = 1 - Math.pow(1 - p, 3);
            camera.position.lerpVectors(animation.from, animation.to, eased);
            if (p === 1) animation = null;
          }
          controls.update();
          render();
          if (animation || controls.autoRotate) requestFrame();
        };
        const requestFrame = () => {
          if (!disposed && !frame && !document.hidden)
            frame = requestAnimationFrame(tick);
        };
        const stop = () => {
          animation = null;
          controls.autoRotate = false;
          setRotating(false);
        };
        const updateView = () => {
          setDistance(Number(camera.position.length().toFixed(2)));
          render();
          // Zoom changes the viewport only. It never selects a new analysis point.
          if (
            variant === "3d" &&
            started &&
            !handedOff &&
            camera.position.length() < 1.09
          ) {
            handedOff = true;
            latest.current.onMap();
          }
        };
        const focus = (animate = false) => {
          const { lat, lon } = latest.current.location;
          selected.position.set(...earthPoint(lat, lon, 1.018));
          const to = new T.Vector3(
            ...earthPoint(lat, lon, started ? 2.45 : 3.55),
          );
          if (animate && !motion.matches) {
            animation = {
              from: camera.position.clone(),
              to,
              start: performance.now(),
            };
            requestFrame();
          } else {
            camera.position.copy(to);
            controls.update();
            render();
          }
        };
        const resize = () => {
          const { width, height } = container.getBoundingClientRect();
          if (!width || !height) return;
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height);
          render();
        };
        const observer = new ResizeObserver(resize);
        observer.observe(container);
        const loader = new T.TextureLoader();
        const texture = loader.load(
          variant === "3d" ? blueMarble : plainEarth,
          (tex) => {
            if (disposed) {
              tex.dispose();
              return;
            }
            tex.colorSpace = T.SRGBColorSpace;
            material.map = tex;
            material.needsUpdate = true;
            setReady(true);
            render();
          },
          undefined,
          () => {
            if (!disposed) setFailed(true);
          },
        );
        const bump =
          variant === "3d"
            ? loader.load(topology, (tex) => {
                if (disposed) {
                  tex.dispose();
                  return;
                }
                material.bumpMap = tex;
                material.needsUpdate = true;
                render();
              })
            : null;
        const ray = new T.Raycaster();
        const pointers = new Set();
        let down = null,
          gesture = false;
        const start = (e) => {
          pointers.add(e.pointerId);
          if (pointers.size > 1) gesture = true;
          if (pointers.size === 1) {
            gesture = false;
            down = [e.clientX, e.clientY];
          }
        };
        const pick = (e) => {
          pointers.delete(e.pointerId);
          if (
            gesture ||
            !down ||
            Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5
          )
            return;
          down = null;
          const rect = renderer.domElement.getBoundingClientRect();
          ray.setFromCamera(
            new T.Vector2(
              ((e.clientX - rect.left) / rect.width) * 2 - 1,
              -((e.clientY - rect.top) / rect.height) * 2 + 1,
            ),
            camera,
          );
          const hit = ray.intersectObjects([globe, ...pins, selected])[0];
          if (!hit) return;
          if (hit.object === selected) return;
          if (hit.object.userData.preset) {
            const p = hit.object.userData.preset;
            latest.current.onLocationChange(p.lat, p.lon, p.id);
          } else {
            const v = hit.point.clone().normalize();
            latest.current.onLocationChange(
              (Math.asin(v.y) * 180) / Math.PI,
              (Math.atan2(-v.z, v.x) * 180) / Math.PI,
            );
          }
        };
        const cancelPointer = (e) => {
          pointers.delete(e.pointerId);
          down = null;
          gesture = true;
        };
        const lose = (e) => {
          e.preventDefault();
          if (!disposed) {
            stop();
            setFailed(true);
          }
        };
        const visibility = () => {
          if (document.hidden) {
            cancelAnimationFrame(frame);
            frame = 0;
          } else requestFrame();
        };
        const reduceMotion = () => {
          if (motion.matches) {
            stop();
            focus();
          }
        };
        renderer.domElement.addEventListener("pointerdown", start);
        renderer.domElement.addEventListener("pointerup", pick);
        renderer.domElement.addEventListener("pointercancel", cancelPointer);
        renderer.domElement.addEventListener("webglcontextlost", lose);
        document.addEventListener("visibilitychange", visibility);
        motion.addEventListener("change", reduceMotion);
        controls.addEventListener("start", stop);
        controls.addEventListener("change", updateView);
        api.current = {
          focus: () => {
            stop();
            focus();
          },
          select: () => {
            stop();
            focus(true);
          },
          start: () => {
            started = true;
            stop();
            focus(true);
          },
          rotate: () => {
            controls.autoRotate = !controls.autoRotate;
            setRotating(controls.autoRotate);
            requestFrame();
          },
          zoom: (factor) => {
            stop();
            camera.position.setLength(
              Math.max(1.04, Math.min(6, camera.position.length() * factor)),
            );
            controls.update();
            updateView();
          },
        };
        focus();
        resize();
        requestFrame();
        cleanup = () => {
          cancelAnimationFrame(frame);
          observer.disconnect();
          document.removeEventListener("visibilitychange", visibility);
          motion.removeEventListener("change", reduceMotion);
          controls.dispose();
          renderer.domElement.removeEventListener("pointerdown", start);
          renderer.domElement.removeEventListener("pointerup", pick);
          renderer.domElement.removeEventListener(
            "pointercancel",
            cancelPointer,
          );
          renderer.domElement.removeEventListener("webglcontextlost", lose);
          geometry.dispose();
          material.dispose();
          texture.dispose();
          bump?.dispose();
          if (halo) {
            halo.geometry.dispose();
            halo.material.dispose();
          }
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
  }, [variant, presets]);

  useEffect(() => {
    api.current?.select();
  }, [location]);
  return (
    <section
      className={`earth-stage earth-${variant}`}
      data-camera-distance={distance.toFixed(2)}
      aria-label={t("Interactive Earth", "الأرض التفاعلية")}
      style={
        variant === "3d" ? { backgroundImage: `url(${nightSky})` } : undefined
      }
    >
      <div className="earth-render" ref={host} aria-hidden="true" />
      <div className="earth-caption">
        <bdi dir="ltr">
          {location.lat.toFixed(4)}° N, {location.lon.toFixed(4)}° E
        </bdi>
      </div>
      {!ready && !failed && (
        <p className="earth-status" role="status">
          {t("Loading Earth…", "جارٍ تحميل الأرض…")}
        </p>
      )}
      {failed ? (
        <div className="earth-fallback" role="status">
          <Globe2 size={36} />
          <p>
            {t(
              "3D is unavailable. Use the field map or quick locations.",
              "العرض ثلاثي الأبعاد غير متاح. استخدم الخريطة أو المواقع السريعة.",
            )}
          </p>
          <button className="button" onClick={onMap}>
            {t("Open field map", "افتح خريطة الأرض")}
          </button>
        </div>
      ) : (
        <>
          {intro && (
            <div className="earth-intro">
              <span>
                {t("A new perspective on your field", "نظرة جديدة على أرضك")}
              </span>
              <button
                className="button"
                disabled={!ready}
                onClick={() => {
                  setIntro(false);
                  api.current?.start();
                }}
              >
                {t("Start exploring", "ابدأ الاستكشاف")}
              </button>
            </div>
          )}
          <div className="earth-tools">
            <button
              onClick={() => api.current?.zoom(0.8)}
              disabled={!ready}
              aria-label={t("Zoom Earth in", "تكبير الأرض")}
            >
              <Plus size={18} />
            </button>
            <button
              onClick={() => api.current?.zoom(1.25)}
              disabled={!ready}
              aria-label={t("Zoom Earth out", "تصغير الأرض")}
            >
              <Minus size={18} />
            </button>
            <button
              onClick={() => api.current?.focus()}
              disabled={!ready}
              aria-label={t(
                "Focus selected region",
                "ركز على المنطقة المختارة",
              )}
            >
              <LocateFixed size={18} />
            </button>
            {variant === "3d" && (
              <button
                onClick={() => api.current?.rotate()}
                disabled={!ready}
                aria-label={t("Rotate Earth", "تدوير الأرض")}
                aria-pressed={rotating}
              >
                {rotating ? <Pause size={18} /> : <Play size={18} />}
              </button>
            )}
          </div>
          <button className="button earth-map-link" onClick={onMap}>
            {t("Open field map", "افتح خريطة الأرض")}
          </button>
        </>
      )}
      <p className="earth-note">
        {t(
          "Orientation imagery · not live satellite data",
          "صور لتحديد الاتجاه · ليست بيانات أقمار حية",
        )}
      </p>
    </section>
  );
}
