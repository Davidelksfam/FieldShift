import { test, expect } from "@playwright/test";
import { sourcePayload } from "../helpers/sourcePayloads.js";

async function start(page, { live = false, english = true } = {}) {
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
  return sourceRequests;
}
async function openEarth(page, plain = false) {
  await page
    .getByRole("button", {
      name: plain ? "Plain Earth" : "3D Earth",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("button", { name: "Zoom Earth in", exact: true }),
  ).toBeEnabled();
  await expect(page.locator(".earth-render canvas")).toBeVisible();
}

test("main layout, farm inputs and comparison survive all Earth views and the persisted dark theme without fetching", async ({
  page,
}) => {
  const requests = await start(page, { live: true });
  await expect(
    page.getByRole("button", { name: "Retry sources", exact: true }),
  ).toBeVisible({ timeout: 25000 });
  await page.getByTestId("irrigation-choice-drip").locator("..").click();
  await page.getByTestId("crop-choice-sesame").locator("..").click();
  const baseline = await page.getByTestId("farmer-water-baseline").innerText();
  const count = requests.length;
  await openEarth(page);
  await page
    .getByRole("button", { name: "Start exploring", exact: true })
    .click();
  await expect(page.locator(".earth-stage")).toHaveAttribute(
    "data-camera-distance",
    "2.45",
  );
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
      return elements.map((element) => {
        const style = getComputedStyle(element);
        const values = [
          luminance(style.color),
          luminance(style.backgroundColor),
        ].sort((a, b) => b - a);
        return (values[0] + 0.05) / (values[1] + 0.05);
      });
    });
  expect(contrasts.length).toBeGreaterThan(3);
  for (const contrast of contrasts)
    expect(contrast).toBeGreaterThanOrEqual(4.5);
  await openEarth(page, true);
  await expect(
    page.getByRole("button", { name: "Start exploring", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Field map", exact: true }).click();
  await expect(page.locator(".leaflet-container")).toBeVisible();
  await expect(page.getByTestId("crop-choice-sesame")).toBeChecked();
  await expect(page.getByTestId("irrigation-choice-drip")).toBeChecked();
  await expect(page.getByTestId("farmer-water-baseline")).toHaveText(baseline);
  expect(requests).toHaveLength(count);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator(".leaflet-container")).toBeVisible();
});

test("a real sphere pick uses the existing custom-location source pipeline and preserves inputs", async ({
  page,
}) => {
  const requests = await start(page, { live: true });
  await page.getByTestId("irrigation-choice-drip").locator("..").click();
  await openEarth(page);
  await page
    .getByRole("button", { name: "Start exploring", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Focus selected region", exact: true })
    .click();
  const canvas = page.locator(".earth-render canvas");
  const box = await canvas.boundingBox();
  await page.mouse.click(box.x + box.width / 2 + 8, box.y + box.height / 2);
  await expect(page.getByTestId("quick-fayoum_etsa")).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await expect(page.getByTestId("source-climate")).toContainText(
    "Retrieved source data",
    { timeout: 25000 },
  );
  await expect(page.getByTestId("source-soil")).toContainText(
    "Retrieved source data",
  );
  await expect(page.getByTestId("source-ndvi")).toContainText(
    "Retrieved source data",
  );
  await expect(page.getByTestId("farmer-water-baseline")).toHaveText("6,758");
  await expect(page.getByTestId("irrigation-choice-drip")).toBeChecked();
  const power = requests.findLast((url) => url.includes("power.larc"));
  expect(power).toBeTruthy();
  const params = new URL(power).searchParams;
  expect(Number(params.get("latitude"))).toBeGreaterThan(22);
  expect(Number(params.get("longitude"))).toBeGreaterThan(30.7952);
  await page.getByText("Enter coordinates instead", { exact: true }).click();
  await expect(page.getByLabel("Longitude", { exact: true })).toHaveValue(
    Number(params.get("longitude")).toFixed(4),
  );
  await page
    .getByRole("button", { name: "Open field map", exact: true })
    .click();
  await expect(page.locator(".coordinate")).toContainText(
    Number(params.get("longitude")).toFixed(4),
  );
});

test("reduced motion disables startup spin, zoom handoff preserves selection, and plain Earth remains available", async ({
  page,
}) => {
  const requests = await start(page, { live: true });
  await expect(
    page.getByRole("button", { name: "Retry sources", exact: true }),
  ).toBeVisible({ timeout: 25000 });
  await openEarth(page);
  await expect(
    page.getByRole("button", { name: "Rotate Earth", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  await page
    .getByRole("button", { name: "Start exploring", exact: true })
    .click();
  const count = requests.length;
  for (let i = 0; i < 4; i++)
    await page
      .getByRole("button", { name: "Zoom Earth in", exact: true })
      .click();
  await expect(page.locator(".leaflet-container")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Field map", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("quick-fayoum_etsa")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(requests).toHaveLength(count);
  await openEarth(page, true);
  await page.getByTestId("quick-west_delta_nubariya").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".earth-caption")).toContainText("30.6650");
  await expect(page.getByTestId("quick-west_delta_nubariya")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("WebGL failure and context loss recover to the map without losing the field", async ({
  page,
}) => {
  await start(page);
  await openEarth(page);
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
  await page.evaluate(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return type.startsWith("webgl")
        ? null
        : original.call(this, type, ...args);
    };
  });
  await page.getByRole("button", { name: "Plain Earth", exact: true }).click();
  await expect(page.locator(".earth-fallback")).toContainText(
    "3D is unavailable",
  );
  await page
    .getByRole("button", { name: "Open field map", exact: true })
    .click();
  await expect(page.getByTestId("quick-fayoum_etsa")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("both globe textures remain usable after an offline shell reload", async ({
  page,
  context,
}) => {
  await start(page);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBe(true);
  await context.setOffline(true);
  await page.reload();
  await page.getByRole("button", { name: "English", exact: true }).click();
  await openEarth(page);
  await page
    .getByRole("button", { name: "Start exploring", exact: true })
    .click();
  await openEarth(page, true);
  await expect(page.locator(".earth-fallback")).toHaveCount(0);
  await expect(page.getByTestId("farmer-water-baseline")).toHaveText("10,813");
});

test("dark Earth controls and main inputs fit mobile Arabic and English layouts", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await start(page, { english: false });
  await page.getByRole("button", { name: "الوضع الداكن", exact: true }).click();
  await page
    .getByRole("button", { name: "الأرض ثلاثية الأبعاد", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "ابدأ الاستكشاف", exact: true }),
  ).toBeEnabled();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "English", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Start exploring", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expect(
    page.getByRole("radiogroup", { name: "Winter crop", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Plain Earth", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { name: "Plain Earth", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("animated startup can be paused and interaction stops rotation", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await start(page);
  await openEarth(page);
  const rotate = page.getByRole("button", {
    name: "Rotate Earth",
    exact: true,
  });
  await expect(rotate).toHaveAttribute("aria-pressed", "true");
  await rotate.click();
  await expect(rotate).toHaveAttribute("aria-pressed", "false");
  await page
    .getByRole("button", { name: "Start exploring", exact: true })
    .click();
  await expect(page.locator(".earth-stage")).toHaveAttribute(
    "data-camera-distance",
    "2.45",
  );
  await rotate.click();
  await expect(rotate).toHaveAttribute("aria-pressed", "true");
  const box = await page.locator(".earth-render canvas").boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 30, box.y + box.height / 2, {
    steps: 6,
  });
  await page.mouse.up();
  await expect(rotate).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByTestId("quick-fayoum_etsa")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});
