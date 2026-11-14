import { useEffect, useRef, useState } from "react";
import { Globe2, LocateFixed, MapPin, Minus, Plus } from "lucide-react";
import { text } from "../../i18n";
import blueMarble from "../../assets/earth/earth-blue-marble.jpg";
import topology from "../../assets/earth/earth-topology.png";
import nightSky from "../../assets/earth/night-sky.png";

const EGYPT = { lat: 27.2, lon: 30.5, distance: 1.35 };
const MIN_DISTANCE = 1.025;
const landmarkNames = {
  fayoum_etsa: ["Fayoum", "الفيوم"],
  delta_kafr_el_sheikh: ["North Delta", "شمال الدلتا"],
  west_delta_nubariya: ["Nubariya", "النوبارية"],
};

// Equirectangular convention shared by the texture, marker projection and picks.
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
    api = useRef(null);
  const labels = useRef({}),
    guides = useRef({});
  const latest = useRef({ location, onLocationChange });
  latest.current = { location, onLocationChange };
  const [failed, setFailed] = useState(false),
    [ready, setReady] = useState(false);
  const [distance, setDistance] = useState(3.55);
  const t = (en, ar) => text(lang, en, ar);

  useEffect(() => {
    let disposed = false,
      cleanup;
    const launchLocation = latest.current.location;
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
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        renderer.domElement.tabIndex = 0;
        container.appendChild(renderer.domElement);
        const scene = new T.Scene(),
          camera = new T.PerspectiveCamera(40, 1, 0.005, 50);
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enablePan = false;
        controls.minDistance = MIN_DISTANCE;
        controls.maxDistance = 6;
        controls.enableDamping = false;
        controls.zoomSpeed = 1.4;
        // The camera settles over Egypt; it never spins away while choosing land.
        controls.autoRotate = false;
        const motion = matchMedia("(prefers-reduced-motion: reduce)");
        let frame = 0,
          animation = null,
          imageReady = false;
        const geometry = new T.SphereGeometry(1, 128, 96);
        const material = new T.MeshPhongMaterial({
          color: 0xffffff,
          shininess: 5,
          bumpScale: 0.002,
        });
        const globe = new T.Mesh(geometry, material);
        scene.add(globe, new T.AmbientLight(0xffffff, 1.6));
        const sunlight = new T.DirectionalLight(0xffffff, 2);
        sunlight.position.set(3, 2, 4);
        scene.add(sunlight);
        const halo = new T.Mesh(
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
        );
        scene.add(halo);
        const pins = Object.values(presets).map((preset) => {
          const pin = new T.Mesh(
            new T.SphereGeometry(0.003, 12, 12),
            new T.MeshBasicMaterial({ color: 0xffd36e }),
          );
          pin.position.set(...earthPoint(preset.lat, preset.lon, 1.002));
          pin.userData.preset = preset;
          scene.add(pin);
          return pin;
        });
        const selected = new T.Mesh(
          new T.SphereGeometry(0.002, 12, 12),
          new T.MeshBasicMaterial({ color: 0x78efbe }),
        );
        scene.add(selected);

        function placeLandmarks() {
          const { width, height } = container.getBoundingClientRect();
          const stage = container.parentElement;
          const bounds = stage.getBoundingClientRect();
          const obstacles = [
            ...stage.querySelectorAll(".earth-caption, .earth-tools"),
          ].map((el) => {
            const r = el.getBoundingClientRect();
            return {
              x: r.x - bounds.x - 5,
              y: r.y - bounds.y - 5,
              w: r.width + 10,
              h: r.height + 10,
            };
          });
          const overlaps = (a, b) =>
            a.x < b.x + b.w + 4 &&
            a.x + a.w + 4 > b.x &&
            a.y < b.y + b.h + 4 &&
            a.y + a.h + 4 > b.y;
          for (const pin of pins) {
            const id = pin.userData.preset.id,
              label = labels.current[id],
              line = guides.current[id];
            if (!label || !line) continue;
            const projected = pin.position.clone().project(camera);
            const visible =
              imageReady &&
              pin.position
                .clone()
                .normalize()
                .dot(camera.position.clone().sub(pin.position)) > 0 &&
              Math.abs(projected.x) < 1 &&
              Math.abs(projected.y) < 1;
            label.hidden = !visible;
            line.style.display = visible ? "" : "none";
            if (!visible) continue;
            const x = ((projected.x + 1) * width) / 2,
              y = ((1 - projected.y) * height) / 2;
            const w = label.offsetWidth,
              h = label.offsetHeight;
            const preferred =
              id === "fayoum_etsa"
                ? [-w - 18, 24]
                : id === "delta_kafr_el_sheikh"
                  ? [20, -h - 24]
                  : [-w - 20, -h - 35];
            const offsets = [
              preferred,
              [20, 24],
              [-w - 18, 24],
              [20, -h - 24],
              [-w - 20, -h - 35],
              [-w / 2, 65],
              [-w / 2, -h - 85],
            ];
            const candidates = offsets.map(([dx, dy]) => ({
              x: Math.max(8, Math.min(width - w - 8, x + dx)),
              y: Math.max(40, Math.min(height - h - 36, y + dy)),
              w,
              h,
            }));
            // Search remaining free space if a narrow view exhausts the preferred offsets.
            for (let gy = 44; gy <= height - h - 36; gy += 12) {
              for (let gx = 8; gx <= width - w - 8; gx += 12) {
                candidates.push({ x: gx, y: gy, w, h });
              }
            }
            const box =
              candidates.find(
                (candidate) =>
                  !obstacles.some((obstacle) => overlaps(candidate, obstacle)),
              ) ??
              candidates.reduce((best, candidate) =>
                obstacles.filter((o) => overlaps(candidate, o)).length <
                obstacles.filter((o) => overlaps(best, o)).length
                  ? candidate
                  : best,
              );
            obstacles.push(box);
            label.style.transform = `translate(${box.x.toFixed(1)}px, ${box.y.toFixed(1)}px)`;
            line.setAttribute("x1", x);
            line.setAttribute("y1", y);
            line.setAttribute("x2", Math.max(box.x, Math.min(box.x + w, x)));
            line.setAttribute("y2", Math.max(box.y, Math.min(box.y + h, y)));
          }
        }
        const render = () => {
          if (disposed) return;
          renderer.render(scene, camera);
          placeLandmarks();
        };
        const updateView = () => {
          controls.rotateSpeed = Math.max(
            0.003,
            Math.min(0.5, (camera.position.length() - 1) * 0.1),
          );
          setDistance(Number(camera.position.length().toFixed(3)));
          render();
        };
        const tick = (now) => {
          frame = 0;
          if (disposed || document.hidden) return;
          if (animation) {
            const p = Math.min(1, (now - animation.start) / 1600);
            camera.position.lerpVectors(
              animation.from,
              animation.to,
              1 - Math.pow(1 - p, 3),
            );
            if (p === 1) animation = null;
          }
          controls.update();
          render();
          if (animation) requestFrame();
        };
        const requestFrame = () => {
          if (!disposed && !frame && !document.hidden)
            frame = requestAnimationFrame(tick);
        };
        const stop = () => {
          animation = null;
        };
        const cameraTo = (lat, lon, radius, animate = true) => {
          const to = new T.Vector3(...earthPoint(lat, lon, radius));
          if (animate && !motion.matches) {
            animation = {
              from: camera.position.clone(),
              to,
              start: performance.now(),
            };
            requestFrame();
          } else {
            animation = null;
            camera.position.copy(to);
            controls.update();
            updateView();
          }
        };
        const updateSelection = () => {
          const { lat, lon, presetId } = latest.current.location;
          selected.position.set(...earthPoint(lat, lon, 1.003));
          selected.visible = !presetId;
          for (const pin of pins)
            pin.material.color.set(
              pin.userData.preset.id === presetId ? 0x78efbe : 0xffd36e,
            );
        };
        const focus = () => {
          updateSelection();
          const { lat, lon } = latest.current.location;
          cameraTo(
            lat,
            lon,
            Math.min(camera.position.length(), EGYPT.distance),
          );
        };
        const zoom = (factor) => {
          stop();
          camera.position.setLength(
            Math.max(
              MIN_DISTANCE,
              Math.min(6, camera.position.length() * factor),
            ),
          );
          controls.update();
          updateView();
        };
        const resize = () => {
          const { width, height } = container.getBoundingClientRect();
          if (!width || !height) return;
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height);
          render();
        };
        // App applies RTL/LTR on <html>; reposition after that parent effect runs.
        const directionObserver = new MutationObserver(placeLandmarks);
        directionObserver.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ["dir"],
        });
        const observer = new ResizeObserver(resize);
        observer.observe(container);
        Object.values(labels.current).forEach((label) => {
          if (label) observer.observe(label);
        });
        const loader = new T.TextureLoader();
        const texture = loader.load(
          blueMarble,
          (tex) => {
            if (disposed) {
              tex.dispose();
              return;
            }
            tex.colorSpace = T.SRGBColorSpace;
            material.map = tex;
            material.needsUpdate = true;
            imageReady = true;
            setReady(true);
            updateSelection();
            if (latest.current.location === launchLocation)
              cameraTo(EGYPT.lat, EGYPT.lon, EGYPT.distance);
            else focus();
            render();
          },
          undefined,
          () => {
            if (!disposed) setFailed(true);
          },
        );
        const bump = loader.load(topology, (tex) => {
          if (disposed) {
            tex.dispose();
            return;
          }
          material.bumpMap = tex;
          material.needsUpdate = true;
          render();
        });
        const ray = new T.Raycaster();
        const pointers = new Set();
        const landmarkTouches = new Map();
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
          const landmark = landmarkTouches.get(e.pointerId);
          landmarkTouches.delete(e.pointerId);
          if (
            !imageReady ||
            gesture ||
            !down ||
            Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5
          )
            return;
          down = null;
          if (landmark) {
            latest.current.onLocationChange(
              landmark.lat,
              landmark.lon,
              landmark.id,
            );
            return;
          }
          const rect = renderer.domElement.getBoundingClientRect();
          ray.setFromCamera(
            new T.Vector2(
              ((e.clientX - rect.left) / rect.width) * 2 - 1,
              -((e.clientY - rect.top) / rect.height) * 2 + 1,
            ),
            camera,
          );
          const hit = ray.intersectObjects([globe, ...pins])[0];
          if (!hit) return;
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
          landmarkTouches.delete(e.pointerId);
          down = null;
          gesture = true;
        };
        // Labels remain tappable, but touch gestures starting on them belong to
        // OrbitControls too. Pointer capture then keeps the entire pinch on canvas.
        const forwardLandmarkTouch = (e) => {
          if (e.pointerType !== "touch" || e.target === renderer.domElement)
            return;
          if (e.type === "pointerdown") {
            const label = e.target.closest?.(".earth-landmark");
            const preset = label && presets[label.dataset.presetId];
            if (!preset) return;
            landmarkTouches.set(e.pointerId, preset);
          } else if (!landmarkTouches.has(e.pointerId)) return;
          e.preventDefault();
          renderer.domElement.dispatchEvent(
            new PointerEvent(e.type, {
              view: window,
              pointerId: e.pointerId,
              pointerType: e.pointerType,
              clientX: e.clientX,
              clientY: e.clientY,
              button: e.button,
              buttons: e.buttons,
              isPrimary: e.isPrimary,
              cancelable: true,
            }),
          );
        };
        container.parentElement.addEventListener(
          "pointerdown",
          forwardLandmarkTouch,
          { capture: true, passive: false },
        );
        // The second touch may end on a label that moved out of view during zoom.
        // Keep its move/end lifecycle even when it no longer bubbles through the stage.
        const outsidePointer = (e) => {
          if (!pointers.has(e.pointerId) || e.target === renderer.domElement)
            return;
          e.preventDefault();
          renderer.domElement.dispatchEvent(
            new PointerEvent(e.type, {
              view: window,
              pointerId: e.pointerId,
              pointerType: e.pointerType,
              clientX: e.clientX,
              clientY: e.clientY,
              button: e.button,
              buttons: e.buttons,
              isPrimary: e.isPrimary,
              cancelable: true,
            }),
          );
        };
        const touchEvents = ["pointermove", "pointerup", "pointercancel"];
        for (const name of touchEvents)
          document.addEventListener(name, outsidePointer, {
            capture: true,
            passive: false,
          });
        const keydown = (e) => {
          if (
            !imageReady ||
            ![
              "+",
              "=",
              "-",
              "_",
              "ArrowLeft",
              "ArrowRight",
              "ArrowUp",
              "ArrowDown",
            ].includes(e.key)
          )
            return;
          e.preventDefault();
          stop();
          if (["+", "=", "-", "_"].includes(e.key))
            return zoom(e.key === "+" || e.key === "=" ? 0.8 : 1.25);
          const r = camera.position.length();
          const lat = (Math.asin(camera.position.y / r) * 180) / Math.PI;
          const lon =
            (Math.atan2(-camera.position.z, camera.position.x) * 180) / Math.PI;
          const step = Math.max(0.02, (r - 1) * 2);
          cameraTo(
            Math.max(
              -85,
              Math.min(
                85,
                lat +
                  (e.key === "ArrowUp"
                    ? step
                    : e.key === "ArrowDown"
                      ? -step
                      : 0),
              ),
            ),
            lon +
              (e.key === "ArrowRight"
                ? step
                : e.key === "ArrowLeft"
                  ? -step
                  : 0),
            r,
            false,
          );
        };
        const lose = (e) => {
          e.preventDefault();
          if (!disposed) {
            stop();
            imageReady = false;
            controls.enabled = false;
            renderer.domElement.tabIndex = -1;
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
          if (motion.matches && animation) {
            const target = animation.to.clone();
            stop();
            camera.position.copy(target);
            controls.update();
            updateView();
          }
        };
        for (const [name, fn] of [
          ["pointerdown", start],
          ["pointerup", pick],
          ["pointercancel", cancelPointer],
          ["keydown", keydown],
          ["webglcontextlost", lose],
        ])
          renderer.domElement.addEventListener(name, fn);
        document.addEventListener("visibilitychange", visibility);
        motion.addEventListener("change", reduceMotion);
        controls.addEventListener("start", stop);
        controls.addEventListener("change", updateView);
        api.current = { focus, zoom, relabel: placeLandmarks };
        cameraTo(EGYPT.lat, EGYPT.lon, 3.55, false);
        updateSelection();
        resize();
        cleanup = () => {
          cancelAnimationFrame(frame);
          observer.disconnect();
          directionObserver.disconnect();
          container.parentElement.removeEventListener(
            "pointerdown",
            forwardLandmarkTouch,
            true,
          );
          for (const name of touchEvents)
            document.removeEventListener(name, outsidePointer, true);
          document.removeEventListener("visibilitychange", visibility);
          motion.removeEventListener("change", reduceMotion);
          controls.dispose();
          for (const [name, fn] of [
            ["pointerdown", start],
            ["pointerup", pick],
            ["pointercancel", cancelPointer],
            ["keydown", keydown],
            ["webglcontextlost", lose],
          ])
            renderer.domElement.removeEventListener(name, fn);
          geometry.dispose();
          material.dispose();
          texture.dispose();
          bump.dispose();
          halo.geometry.dispose();
          halo.material.dispose();
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
    api.current?.focus();
  }, [location]);
  useEffect(() => {
    const canvas = host.current?.querySelector("canvas");
    if (canvas)
      canvas.setAttribute(
        "aria-label",
        t(
          "3D Earth: drag or use arrow keys to rotate, scroll, pinch or use plus and minus to zoom. Click to select your field.",
          "الأرض ثلاثية الأبعاد: اسحب أو استخدم الأسهم للتدوير، ومرّر أو قرّب إصبعين أو استخدم زائد وناقص للتكبير. اضغط لتحديد أرضك.",
        ),
      );
    api.current?.relabel();
  }, [lang, ready]);
  return (
    <section
      className="earth-stage earth-3d"
      data-camera-distance={distance.toFixed(3)}
      aria-label={t("Interactive Earth", "الأرض التفاعلية")}
      style={{ backgroundImage: `url(${nightSky})` }}
    >
      <div className="earth-render" ref={host} />
      <svg className="earth-guides" aria-hidden="true">
        {Object.values(presets).map((p) => (
          <line
            key={p.id}
            ref={(el) => {
              guides.current[p.id] = el;
            }}
          />
        ))}
      </svg>
      <div
        className="earth-landmarks"
        aria-label={t("Preset landmarks", "معالم المواقع الجاهزة")}
      >
        {Object.values(presets).map((p) => (
          <button
            key={p.id}
            type="button"
            hidden={!ready || failed}
            ref={(el) => {
              labels.current[p.id] = el;
            }}
            data-testid={`landmark-${p.id}`}
            data-preset-id={p.id}
            className="earth-landmark"
            aria-pressed={location.presetId === p.id}
            onClick={(event) => {
              // Touch selection runs on pointerup before camera recentering.
              // Ignore the later compatibility click on a potentially moved label.
              if (event.nativeEvent.pointerType === "touch") return;
              onLocationChange(p.lat, p.lon, p.id);
            }}
          >
            <MapPin size={16} />
            <span>
              {text(lang, ...(landmarkNames[p.id] ?? [p.nameEn, p.nameAr]))}
            </span>
          </button>
        ))}
      </div>
      <div className="earth-caption">
        <bdi dir="ltr">
          {location.lat.toFixed(4)}° N, {location.lon.toFixed(4)}° E
        </bdi>
      </div>
      {!ready && !failed && (
        <p className="earth-status" role="status">
          {t("Opening Egypt…", "جارٍ فتح مصر…")}
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
            aria-label={t("Focus selected region", "ركز على المنطقة المختارة")}
          >
            <LocateFixed size={18} />
          </button>
        </div>
      )}
      <p className="earth-hint">
        {t(
          "Drag to explore · scroll or pinch to zoom · tap to select",
          "اسحب للاستكشاف · مرّر أو قرّب للتكبير · اضغط للاختيار",
        )}
      </p>
      <p className="earth-note">
        {t(
          "Orientation imagery · not live satellite data",
          "صور لتحديد الاتجاه · ليست بيانات أقمار حية",
        )}
      </p>
    </section>
  );
}
