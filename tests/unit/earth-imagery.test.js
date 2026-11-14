import test from "node:test";
import assert from "node:assert/strict";
import * as T from "three";
import {
  xyzAt,
  tilePoint,
  imageryLevel,
  overlapsTile,
  tileGeometry,
  EarthImagery,
} from "../../src/components/farmer/earthImagery.js";

test("XYZ imagery follows Web Mercator, including pole clamps and the antimeridian", () => {
  assert.deepEqual(xyzAt(0, 0, 1), { x: 1, y: 1, z: 1 });
  assert.deepEqual(tilePoint(1, 1, 1), { lat: 0, lon: 0 });
  assert.equal(xyzAt(90, 0, 8).y, 0);
  assert.equal(xyzAt(-90, 0, 8).y, 255);
  assert.equal(xyzAt(0, 180, 4).x, xyzAt(0, -180, 4).x);
  // Cairo's standard XYZ cell at level 10.
  assert.deepEqual(xyzAt(30.0444, 31.2357, 10), { x: 600, y: 422, z: 10 });
});
test("closer views request finer imagery and account for physical display resolution", () => {
  const country = imageryLevel(0.35, 340, 1, 27);
  const region = imageryLevel(0.006, 340, 1, 27);
  const field = imageryLevel(0.0001, 340, 2, 27);
  assert.ok(region > country + 4);
  assert.ok(field > region + 4);
  assert.equal(field, 18);
  assert.ok(imageryLevel(0.006, 340, 2, 27) > region);
});
test("only matching parent/child imagery can be retained as fallback coverage", () => {
  assert.equal(overlapsTile({ x: 3, y: 4, z: 3 }, { x: 6, y: 9, z: 4 }), true);
  assert.equal(overlapsTile({ x: 3, y: 4, z: 3 }, { x: 8, y: 9, z: 4 }), false);
  assert.equal(overlapsTile({ x: 6, y: 9, z: 4 }, { x: 3, y: 4, z: 3 }), true);
});
test("imagery meshes face outwards and align north-up with the geographic sphere", () => {
  const geometry = tileGeometry({ x: 2, y: 1, z: 2 });
  const positions = geometry.getAttribute("position"),
    uvs = geometry.getAttribute("uv");
  const index = geometry.index;
  const a = new T.Vector3().fromBufferAttribute(positions, index.getX(0));
  const b = new T.Vector3().fromBufferAttribute(positions, index.getX(1));
  const c = new T.Vector3().fromBufferAttribute(positions, index.getX(2));
  const normal = b.clone().sub(a).cross(c.clone().sub(a));
  assert.ok(normal.dot(a) > 0);
  assert.equal(uvs.getY(0), 1); // image north is at the northern row
  assert.equal(uvs.getY(uvs.count - 1), 0);
  for (let i = 0; i < positions.count; i++)
    assert.ok(
      Math.abs(new T.Vector3().fromBufferAttribute(positions, i).length() - 1) <
        1e-6,
    );
  assert.ok(positions.getY(0) > positions.getY(positions.count - 1));
  geometry.dispose();
});

test("imagery requests are bounded and late image decoding cannot revive a disposed globe", async (t) => {
  const original = {
    window: globalThis.window,
    fetch: globalThis.fetch,
    createImageBitmap: globalThis.createImageBitmap,
  };
  t.after(() => {
    Object.assign(globalThis, original);
  });
  globalThis.window = new EventTarget();
  const pending = [];
  globalThis.fetch = (_url, { signal }) =>
    new Promise((resolve) => pending.push({ signal, resolve }));
  let closed = 0;
  globalThis.createImageBitmap = async () => ({
    width: 256,
    height: 256,
    close: () => closed++,
  });
  const scene = new T.Scene(),
    camera = new T.PerspectiveCamera(40, 1.2, 0.0001, 10);
  camera.position.set(1.1, 0.5, -0.5).setLength(1.35);
  camera.lookAt(0, 0, 0);
  let renders = 0,
    states = 0;
  const layer = new EarthImagery({
    scene,
    camera,
    renderer: { domElement: { clientHeight: 340 }, getPixelRatio: () => 1 },
    onRender: () => renders++,
    onState: () => states++,
  });
  layer.update();
  assert.equal(pending.length, 4);
  layer.dispose();
  assert.ok(pending.every((r) => r.signal.aborted));
  assert.equal(scene.children.length, 0);
  const before = { renders, states };
  for (const request of pending)
    request.resolve({ ok: true, blob: async () => new Blob() });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(closed, 4);
  assert.deepEqual({ renders, states }, before);
});
