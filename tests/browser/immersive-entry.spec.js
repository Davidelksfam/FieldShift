import { test, expect } from "@playwright/test";
import { sourcePayload } from "../helpers/sourcePayloads.js";

async function sources(page) {
  const requests = [];
  await page.route(/^https:\/\//, (route) => {
    const payload = sourcePayload(route.request().url());
    if (payload) {
      requests.push(route.request().url());
      return route.fulfill({ json: payload });
    }
    return route.abort();
  });
  return requests;
}

test("welcome enters the same fullscreen globe, starts acquisition and leads to the parameters below", async ({
  page,
}) => {
  const requests = await sources(page);
  await page.goto("/");
  await expect(page.getByTestId("enter-project")).toBeVisible();
  await expect(page.getByRole("radiogroup")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Understand my results", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "English", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "Your land. A clearer plan.",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator(".earth-stage")).toHaveAttribute(
    "data-camera-distance",
    "3.5500",
  );
  await expect(page.locator(".earth-render canvas")).toHaveCount(1);
  await page.evaluate(
    () => (window.entryCanvas = document.querySelector(".earth-render canvas")),
  );
  expect(requests).toHaveLength(0);
  await page.getByTestId("enter-project").focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("enter-project")).toHaveCount(0);
  await expect(page.locator("#map-title")).toBeFocused();
  await expect(page.locator(".earth-stage")).toHaveAttribute(
    "data-camera-distance",
    "1.3500",
  );
  expect(
    await page.evaluate(
      () =>
        window.entryCanvas === document.querySelector(".earth-render canvas"),
    ),
  ).toBe(true);
  const map = await page.locator(".earth-stage").boundingBox(),
    parameters = await page.locator("#parameters").boundingBox();
  expect(map.width).toBe(1440);
  expect(map.height).toBe(1000);
  expect(map.y).toBe(0);
  expect(parameters.y).toBeGreaterThanOrEqual(map.height);
  await expect.poll(() => requests.length).toBeGreaterThan(0);
  await page
    .getByRole("button", { name: "Set up your field", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Field parameters", exact: true }),
  ).toBeFocused();
  await page.getByTestId("crop-choice-sesame").locator("..").click();
  await page.getByTestId("landmark-west_delta_nubariya").click();
  await expect(page.locator(".earth-stage")).toHaveAttribute(
    "data-camera-distance",
    "1.0060",
  );
  await expect(page.getByTestId("crop-choice-sesame")).toBeChecked();
  await page.reload();
  await expect(page.getByTestId("enter-project")).toHaveCount(0);
  await expect(page.locator(".earth-stage")).toHaveAttribute(
    "data-camera-distance",
    "1.3500",
  );
});

test("mobile entry and location controls fit Arabic and English with parameters after the viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await sources(page);
  await page.goto("/");
  await expect(page.getByTestId("enter-project")).toBeInViewport();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByTestId("enter-project").click();
  const stage = page.locator(".earth-stage");
  await expect(stage).toHaveAttribute("data-camera-distance", "1.3500");
  expect((await stage.boundingBox()).height).toBe(844);
  for (const lang of ["ar", "en"]) {
    if (lang === "en")
      await page.getByRole("button", { name: "English", exact: true }).click();
    await expect(page.locator(".analytics-link svg")).toBeVisible();
    for (const selector of [
      ".map-location-dock",
      ".map-next",
      ".earth-tools",
    ]) {
      const box = await page.locator(selector).boundingBox();
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(390);
      expect(box.y + box.height).toBeLessThanOrEqual(844);
    }
    for (const preset of [
      "fayoum_etsa",
      "delta_kafr_el_sheikh",
      "west_delta_nubariya",
    ])
      await expect(page.getByTestId(`landmark-${preset}`)).toBeVisible();
  }
  await page.getByText("Enter coordinates instead", { exact: true }).click();
  await page.getByLabel("Latitude", { exact: true }).fill("30.8");
  await page.getByLabel("Longitude", { exact: true }).fill("31.2");
  await page
    .getByRole("button", { name: "Use this location", exact: true })
    .click();
  await expect(page.locator(".earth-caption")).toContainText("30.8000");
  await expect(stage).toHaveAttribute("data-camera-distance", "1.0060");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("entry works without session storage or WebGL and keeps the field-map recovery", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "sessionStorage", {
      get() {
        throw new Error("Storage unavailable");
      },
    });
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return type.includes("webgl") ? null : original.call(this, type, ...args);
    };
  });
  await sources(page);
  await page.goto("/");
  await page.getByRole("button", { name: "English", exact: true }).click();
  await page.getByTestId("enter-project").click();
  await page
    .getByRole("button", { name: "Open field map", exact: true })
    .click();
  await expect(page.locator(".leaflet-container")).toBeVisible();
  await page.getByTestId("quick-west_delta_nubariya").click();
  await expect(page.getByTestId("quick-west_delta_nubariya")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page
    .getByRole("button", { name: "Set up your field", exact: true })
    .click();
  await expect(
    page.getByRole("radiogroup", { name: "Winter crop", exact: true }),
  ).toBeVisible();
});
