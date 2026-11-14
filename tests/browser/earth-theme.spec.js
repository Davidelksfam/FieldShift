import { test, expect } from "../helpers/plannerTest.js";
import { sourcePayload } from "../helpers/sourcePayloads.js";
import presets from "../../src/data/demoPresets.json" with { type: "json" };

async function start(page, { live = true, english = true } = {}) {
  const sourceRequests = [];
  const appOrigin = new URL(test.info().project.use.baseURL).origin;
  await page.route(/^https:\/\//, (route) => {
    const url = route.request().url();
    if (new URL(url).origin === appOrigin) return route.continue();
    const payload = sourcePayload(url);
    if (payload) sourceRequests.push(url);
    return live && payload ? route.fulfill({ json: payload }) : route.abort();
  });
  await page.goto("/");
  if (english)
    await page.getByRole("button", { name: "English", exact: true }).click();
  await expect(page.locator(".earth-render canvas")).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: english ? "Zoom Earth in" : "تكبير الأرض",
      exact: true,
    }),
  ).toBeEnabled();
  return sourceRequests;
}

const settled = (page) =>
  expect(page.locator(".earth-stage")).toHaveAttribute(
    "data-camera-distance",
    "1.3500",
  );

test("3D Earth opens over Egypt automatically, alternative views stay hidden and theme changes preserve the farmer state", async ({
  page,
}) => {
  const requests = await start(page);
  await settled(page);
  for (const name of [
    "Field map",
    "Plain Earth",
    "3D Earth",
    "Open field map",
    "Start exploring",
  ])
    await expect(page.getByRole("button", { name, exact: true })).toHaveCount(
      0,
    );
  await expect(page.locator(".leaflet-container")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Retry sources", exact: true }),
  ).toBeVisible({ timeout: 25000 });
  await page.getByTestId("irrigation-choice-drip").locator("..").click();
  await page.getByTestId("crop-choice-sesame").locator("..").click();
  const baseline = await page.getByTestId("farmer-water-baseline").innerText(),
    count = requests.length;
  await page.getByRole("button", { name: "Dark mode", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  const contrasts = await page
    .locator(".priority-sliders output, .compare-action")
    .evaluateAll((elements) => {
      const luminance = (color) => {
        const rgb = color
          .match(/[\d.]+/g)
          .slice(0, 3)
          .map(Number)
          .map((v) => {
            v /= 255;
            return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
          });
        return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
      };
      return elements.map((el) => {
        const s = getComputedStyle(el),
          values = [luminance(s.color), luminance(s.backgroundColor)].sort(
            (a, b) => b - a,
          );
        return (values[0] + 0.05) / (values[1] + 0.05);
      });
    });
  expect(contrasts.length).toBeGreaterThan(3);
  for (const contrast of contrasts)
    expect(contrast).toBeGreaterThanOrEqual(4.5);
  await page
    .getByRole("button", { name: "Zoom Earth in", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Zoom Earth out", exact: true })
    .click();
  await expect(page.getByTestId("farmer-water-baseline")).toHaveText(baseline);
  await expect(page.getByTestId("crop-choice-sesame")).toBeChecked();
  expect(requests).toHaveLength(count);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await settled(page);
});

test("all preset landmarks are visible, separated and select exact existing source coordinates without resetting inputs", async ({
  page,
}) => {
  const requests = await start(page);
  await settled(page);
  await page.getByTestId("irrigation-choice-drip").locator("..").click();
  const boxes = [];
  for (const preset of Object.values(presets)) {
    const label = page.getByTestId(`landmark-${preset.id}`);
    await expect(label).toBeVisible();
    boxes.push(await label.boundingBox());
  }
  for (let i = 0; i < boxes.length; i++)
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i],
        b = boxes[j];
      expect(
        a.x < b.x + b.width &&
          a.x + a.width > b.x &&
          a.y < b.y + b.height &&
          a.y + a.height > b.y,
      ).toBe(false);
    }
  for (const preset of Object.values(presets).reverse()) {
    await page.getByRole("button", { name: "View Egypt", exact: true }).click();
    await page.getByTestId(`landmark-${preset.id}`).click();
    await expect(page.getByTestId(`quick-${preset.id}`)).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.getByTestId(`landmark-${preset.id}`)).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.locator(".earth-caption")).toContainText(
      preset.lat.toFixed(4),
    );
    await expect
      .poll(() =>
        requests.some(
          (url) =>
            url.includes("power.larc") &&
            Number(new URL(url).searchParams.get("latitude")) === preset.lat &&
            Number(new URL(url).searchParams.get("longitude")) === preset.lon,
        ),
      )
      .toBe(true);
    await expect(page.getByTestId("source-climate")).toContainText(
      "Retrieved source data",
    );
    await expect(page.getByTestId("irrigation-choice-drip")).toBeChecked();
    await expect(page.locator(".earth-stage")).toHaveAttribute(
      "data-camera-distance",
      "1.0060",
    );
  }
});

test("sphere picking fetches custom data and invalid coordinates preserve the last valid selection", async ({
  page,
}) => {
  const requests = await start(page);
  await settled(page);
  await page.getByTestId("irrigation-choice-drip").locator("..").click();
  // The field parameters now follow the viewport-sized map.
  await page.locator(".earth-render canvas").scrollIntoViewIfNeeded();
  const box = await page.locator(".earth-render canvas").boundingBox();
  await page.mouse.click(box.x + box.width / 2 + 8, box.y + box.height / 2);
  await expect(page.getByLabel("Saved locations", { exact: true })).toHaveValue(
    "",
  );
  for (const key of ["climate", "soil", "ndvi"])
    await expect(page.getByTestId(`source-${key}`)).toContainText(
      "Retrieved source data",
      { timeout: 25000 },
    );
  await expect(page.getByTestId("farmer-water-baseline")).toHaveText("6,758");
  const power = requests.findLast((url) => url.includes("power.larc")),
    params = new URL(power).searchParams;
  expect(Number(params.get("latitude"))).toBeGreaterThan(22);
  await page.getByText("Enter coordinates instead", { exact: true }).click();
  await expect(page.getByLabel("Latitude", { exact: true })).toHaveValue(
    Number(params.get("latitude")).toFixed(4),
  );
  const selected = await page.locator(".earth-caption").innerText(),
    count = requests.length;
  await page.getByLabel("Latitude", { exact: true }).fill("0");
  await page.getByLabel("Longitude", { exact: true }).fill("0");
  await page
    .getByRole("button", { name: "Use this location", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("within Egypt");
  await expect(page.locator(".earth-caption")).toHaveText(selected);
  expect(requests).toHaveLength(count);
});

test("close zoom stays in 3D without changing analysis location or fetching data", async ({
  page,
}) => {
  // This exhaustive 45-click traversal renders a full viewport on CI's software
  // GPU. Keep every interaction/assertion, with time for the larger surface.
  test.setTimeout(60000);
  const requests = await start(page);
  await settled(page);
  await expect(
    page.getByRole("button", { name: "Retry sources", exact: true }),
  ).toBeVisible({ timeout: 25000 });
  const count = requests.length;
  for (let i = 0; i < 40; i++)
    await page
      .getByRole("button", { name: "Zoom Earth in", exact: true })
      .click();
  await expect(page.locator(".earth-stage")).toHaveAttribute(
    "data-camera-distance",
    "1.0001",
  );
  await expect(page.locator(".leaflet-container")).toHaveCount(0);
  await expect(page.getByTestId("quick-fayoum_etsa")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(requests).toHaveLength(count);
});

test("WebGL failure exposes map recovery only when needed and preserves the location", async ({
  page,
}) => {
  await start(page);
  await page.getByTestId("quick-west_delta_nubariya").click();
  await page
    .locator(".earth-render canvas")
    .evaluate((canvas) =>
      canvas.dispatchEvent(new Event("webglcontextlost", { cancelable: true })),
    );
  await expect(page.locator(".earth-fallback")).toContainText(
    "3D is unavailable",
  );
  await page
    .getByRole("button", { name: "Open field map", exact: true })
    .click();
  await expect(page.locator(".leaflet-container")).toBeVisible();
  await expect(page.getByTestId("quick-west_delta_nubariya")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return type.startsWith("webgl")
        ? null
        : original.call(this, type, ...args);
    };
  });
  await page.reload();
  await expect(page.locator(".earth-fallback")).toBeVisible();
});

test("Egypt, 3D assets and landmark selection remain usable after an offline reload", async ({
  page,
  context,
}) => {
  await start(page, { live: false });
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBe(true);
  await context.setOffline(true);
  await page.reload();
  await page.getByRole("button", { name: "English", exact: true }).click();
  await settled(page);
  await page.getByTestId("landmark-west_delta_nubariya").click();
  await expect(page.getByTestId("quick-west_delta_nubariya")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.locator(".earth-fallback")).toHaveCount(0);
});

test("mobile Arabic/English landmarks do not overlap each other or the controls", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await start(page, { english: false });
  await settled(page);
  await page.getByRole("button", { name: "الوضع الداكن", exact: true }).click();
  for (const english of [false, true]) {
    if (english)
      await page.getByRole("button", { name: "English", exact: true }).click();
    const controls = await page.locator(".earth-tools").boundingBox(),
      boxes = [];
    for (const preset of Object.values(presets)) {
      const label = page.getByTestId(`landmark-${preset.id}`);
      await expect(label).toBeVisible();
      const a = await label.boundingBox();
      for (const b of [...boxes, controls])
        expect(
          a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y,
        ).toBe(false);
      boxes.push(a);
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.getByTestId("landmark-west_delta_nubariya").focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("quick-west_delta_nubariya")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("normal startup zooms automatically and stops in Egypt; interaction interrupts the animation", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await start(page);
  await settled(page);
  const canvas = page.locator(".earth-render canvas");
  await canvas.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator(".earth-stage")).toHaveAttribute(
    "data-camera-distance",
    "1.3500",
  );
  await expect(page.getByTestId("quick-fayoum_etsa")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  // A later focus animation is cancellable by the same controls as startup.
  await page
    .getByRole("button", { name: "Zoom Earth out", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Focus selected region", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Zoom Earth out", exact: true })
    .click();
  const stopped = await page
    .locator(".earth-stage")
    .getAttribute("data-camera-distance");
  await page.waitForTimeout(1700);
  await expect(page.locator(".earth-stage")).toHaveAttribute(
    "data-camera-distance",
    stopped,
  );
});
