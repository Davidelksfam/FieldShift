import * as T from "three";

export const IMAGERY_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile";
const MAX_TILES = 48,
  CACHE_LIMIT = 128,
  MAX_REQUESTS = 4;
export function xyzAt(lat, lon, z) {
  const n = 2 ** z,
    latitude =
      (Math.max(-85.05112878, Math.min(85.05112878, lat)) * Math.PI) / 180;
  return {
    x: ((Math.floor(((lon + 180) / 360) * n) % n) + n) % n,
    y: Math.max(
      0,
      Math.min(
        n - 1,
        Math.floor(((1 - Math.asinh(Math.tan(latitude)) / Math.PI) / 2) * n),
      ),
    ),
    z,
  };
}
export function tilePoint(x, y, z) {
  const n = 2 ** z;
  return {
    lon: (x / n) * 360 - 180,
    lat: (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n))) * 180) / Math.PI,
  };
}
export function imageryLevel(altitude, height, pixelRatio, latitude) {
  const span = 2 * Math.max(0.0001, altitude) * Math.tan((20 * Math.PI) / 180);
  return Math.max(
    2,
    Math.min(
      18,
      Math.ceil(
        Math.log2(
          (2 *
            Math.PI *
            Math.cos((latitude * Math.PI) / 180) *
            height *
            pixelRatio) /
            (256 * span),
        ),
      ),
    ),
  );
}
export function overlapsTile(a, b) {
  const low = a.z <= b.z ? a : b,
    high = a.z <= b.z ? b : a,
    scale = 2 ** (high.z - low.z);
  return (
    Math.floor(high.x / scale) === low.x && Math.floor(high.y / scale) === low.y
  );
}
export function tileGeometry({ x, y, z }) {
  const segments = Math.max(1, Math.ceil(32 / 2 ** Math.max(0, z - 2)));
  const positions = [],
    uvs = [],
    indices = [];
  for (let row = 0; row <= segments; row++)
    for (let col = 0; col <= segments; col++) {
      const { lat, lon } = tilePoint(x + col / segments, y + row / segments, z);
      const a = (lat * Math.PI) / 180,
        b = (lon * Math.PI) / 180;
      positions.push(
        Math.cos(a) * Math.cos(b),
        Math.sin(a),
        -Math.cos(a) * Math.sin(b),
      );
      uvs.push(col / segments, 1 - row / segments);
      if (row < segments && col < segments) {
        const i = row * (segments + 1) + col,
          next = i + segments + 1;
        indices.push(i, next, i + 1, i + 1, next, next + 1);
      }
    }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new T.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function desiredTiles(camera, height, pixelRatio) {
  const r = camera.position.length(),
    latitude = (Math.asin(camera.position.y / r) * 180) / Math.PI;
  const longitude =
    (Math.atan2(-camera.position.z, camera.position.x) * 180) / Math.PI;
  let z = imageryLevel(r - 1, height, pixelRatio, latitude);
  const ray = new T.Raycaster(),
    sphere = new T.Sphere(new T.Vector3(), 1),
    p = new T.Vector3(),
    samples = [];
  camera.updateMatrixWorld();
  for (let row = 0; row <= 4; row++)
    for (let col = 0; col <= 4; col++) {
      ray.setFromCamera(new T.Vector2(col / 2 - 1, row / 2 - 1), camera);
      if (!ray.ray.intersectSphere(sphere, p)) continue;
      const lat = (Math.asin(p.y) * 180) / Math.PI;
      let lon = (Math.atan2(-p.z, p.x) * 180) / Math.PI;
      while (lon - longitude > 180) lon -= 360;
      while (lon - longitude < -180) lon += 360;
      samples.push({ lat, lon });
    }
  if (!samples.length) return [];
  let bounds;
  do {
    const n = 2 ** z;
    const xs = samples.map((p) => ((p.lon + 180) / 360) * n);
    const ys = samples.map((p) => xyzAt(p.lat, p.lon, z).y);
    bounds = {
      x0: Math.floor(Math.min(...xs)) - 1,
      x1: Math.floor(Math.max(...xs)) + 1,
      y0: Math.max(0, Math.min(...ys) - 1),
      y1: Math.min(n - 1, Math.max(...ys) + 1),
    };
    if (
      (bounds.x1 - bounds.x0 + 1) * (bounds.y1 - bounds.y0 + 1) <= MAX_TILES ||
      z <= 2
    )
      break;
    z--;
  } while (true);
  const n = 2 ** z,
    center = xyzAt(latitude, longitude, z),
    result = [];
  for (let y = bounds.y0; y <= bounds.y1; y++)
    for (let x = bounds.x0; x <= bounds.x1; x++) {
      const tile = { x: ((x % n) + n) % n, y, z };
      tile.key = `${z}/${tile.y}/${tile.x}`;
      tile.priority = Math.hypot(x - center.x, y - center.y);
      result.push(tile);
    }
  return result.sort((a, b) => a.priority - b.priority).slice(0, MAX_TILES);
}

// Imagery is an independent orientation layer, never an input to farm calculations.
export class EarthImagery {
  constructor({ scene, camera, renderer, onRender, onState }) {
    Object.assign(this, { camera, renderer, onRender, onState });
    this.group = new T.Group();
    scene.add(this.group);
    this.records = new Map();
    this.active = new Map();
    this.desired = [];
    this.disposed = false;
    this.timer = null;
    this.lastState = "";
    this.schedule = this.schedule.bind(this);
    window.addEventListener("online", this.schedule);
  }
  schedule() {
    if (this.disposed) return;
    clearTimeout(this.timer);
    const state = this.camera.position.length() < 2 ? "loading" : "overview";
    const zoom = this.desired[0]?.z ?? 0;
    const signature = `${state}:${zoom}`;
    if (signature !== this.lastState) {
      this.lastState = signature;
      this.onState({ state, zoom });
    }
    this.timer = setTimeout(() => this.update(), 100);
  }
  update() {
    if (this.disposed) return;
    const height = this.renderer.domElement.clientHeight;
    this.group.visible = this.camera.position.length() < 2;
    this.desired = this.group.visible
      ? desiredTiles(this.camera, height, this.renderer.getPixelRatio())
      : [];
    const wanted = new Set(this.desired.map((t) => t.key));
    for (const [key, controller] of this.active)
      if (!wanted.has(key)) controller.abort();
    for (const tile of this.desired) {
      let record = this.records.get(tile.key);
      if (!record) {
        record = { ...tile, state: "idle", lastUsed: 0 };
        this.records.set(tile.key, record);
      }
      record.lastUsed = performance.now();
    }
    this.refresh();
    this.pump();
    this.prune();
    this.onRender();
  }
  refresh() {
    if (this.disposed) return;
    for (const record of this.records.values())
      if (record.mesh)
        record.mesh.visible = this.desired.some((tile) =>
          overlapsTile(record, tile),
        );
    const records = this.desired.map((t) => this.records.get(t.key));
    const loaded = records.filter((r) => r.state === "ready").length;
    const failed = records.filter((r) => r.state === "error").length;
    const state = !records.length
      ? "overview"
      : loaded === records.length
        ? "ready"
        : failed + loaded === records.length
          ? loaded
            ? "partial"
            : "unavailable"
          : "loading";
    const zoom = this.desired[0]?.z ?? 0;
    const signature = `${state}:${zoom}`;
    if (signature !== this.lastState) {
      this.lastState = signature;
      this.onState({ state, zoom });
    }
  }
  pump() {
    if (this.disposed) return;
    for (const tile of this.desired) {
      if (this.active.size >= MAX_REQUESTS) break;
      const record = this.records.get(tile.key);
      if (
        record.state === "ready" ||
        this.active.has(tile.key) ||
        (record.retryAt ?? 0) > Date.now()
      )
        continue;
      this.load(record);
    }
  }
  async load(record) {
    const controller = new AbortController();
    this.active.set(record.key, controller);
    record.state = "loading";
    let timeout = false;
    const timer = setTimeout(() => {
      timeout = true;
      controller.abort();
    }, 8000);
    try {
      const response = await fetch(`${IMAGERY_URL}/${record.key}`, {
        signal: controller.signal,
        mode: "cors",
        credentials: "omit",
        cache: "force-cache",
      });
      if (!response.ok) throw new Error(`Imagery ${response.status}`);
      const blob = await response.blob();
      const image = await createImageBitmap(blob, {
        imageOrientation: "flipY",
        colorSpaceConversion: "none",
      });
      if (this.disposed || controller.signal.aborted) {
        image.close();
        return;
      }
      if (image.width < 256 || image.height < 256) {
        image.close();
        throw new Error("Insufficient tile resolution");
      }
      const texture = new T.Texture(image);
      texture.flipY = false;
      texture.colorSpace = T.SRGBColorSpace;
      texture.anisotropy = Math.min(
        8,
        this.renderer.capabilities.getMaxAnisotropy(),
      );
      texture.needsUpdate = true;
      const mesh = new T.Mesh(
        tileGeometry(record),
        new T.MeshBasicMaterial({
          map: texture,
          depthTest: false,
          depthWrite: false,
        }),
      );
      mesh.renderOrder = 100 + record.z;
      Object.assign(record, { image, mesh, state: "ready", retryAt: 0 });
      this.group.add(mesh);
    } catch {
      record.state = controller.signal.aborted && !timeout ? "idle" : "error";
      record.retryAt = record.state === "error" ? Date.now() + 15000 : 0;
    } finally {
      clearTimeout(timer);
      this.active.delete(record.key);
      if (!this.disposed) {
        this.refresh();
        this.prune();
        this.onRender();
        this.pump();
      }
    }
  }
  prune() {
    const wanted = new Set(this.desired.map((t) => t.key));
    const candidates = [...this.records.values()]
      .filter((r) => !wanted.has(r.key) && !this.active.has(r.key))
      .sort((a, b) => a.lastUsed - b.lastUsed);
    while (this.records.size > CACHE_LIMIT && candidates.length)
      this.remove(candidates.shift());
  }
  remove(record) {
    if (record.mesh) {
      this.group.remove(record.mesh);
      record.mesh.geometry.dispose();
      record.mesh.material.map.dispose();
      record.mesh.material.dispose();
      record.image.close();
    }
    this.records.delete(record.key);
  }
  dispose() {
    this.disposed = true;
    clearTimeout(this.timer);
    window.removeEventListener("online", this.schedule);
    for (const controller of this.active.values()) controller.abort();
    for (const record of this.records.values()) this.remove(record);
    this.group.removeFromParent();
  }
}
