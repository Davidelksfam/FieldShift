import { test, expect } from "@playwright/test";
import { sourcePayload } from "../helpers/sourcePayloads.js";
const firstParty = (route) =>
  new URL(route.request().url()).origin ===
  new URL(test.info().project.use.baseURL).origin;
const blockRemote = (page) =>
  page.route(/^https:\/\//, (route) =>
    firstParty(route) ? route.continue() : route.abort(),
  );
const english = (page) =>
  page.getByRole("button", { name: "English", exact: true }).click();
const expert = (page) =>
  page.getByRole("button", { name: "Expert mode", exact: true }).click();
async function coordinates(page, lat, lon) {
  const disclosure = page.getByText("Enter coordinates instead", {
    exact: true,
  });
  if (!(await page.getByLabel("Latitude", { exact: true }).isVisible()))
    await disclosure.click();
  await page.getByLabel("Latitude", { exact: true }).fill(String(lat));
  await page.getByLabel("Longitude", { exact: true }).fill(String(lon));
  await page
    .getByRole("button", { name: "Use this location", exact: true })
    .click();
}
async function waitSources(page) {
  await expect(
    page.getByRole("button", { name: "Retry sources", exact: true }),
  ).toBeVisible();
}

test("map and all primary inputs share one page with three actual numerical strategy cards", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await blockRemote(page);
  await page.goto("/");
  await english(page);
  await expect(page.locator(".map-panel")).toBeVisible();
  for (const name of [
    "Winter crop",
    "Summer crop",
    "Irrigation system",
    "Main goal",
  ])
    await expect(page.getByLabel(name, { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continue", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByTestId("farmer-water-baseline")).toHaveText("10,813");
  await expect(page.getByTestId("farmer-water-water")).toHaveText("4,998");
  await expect(page.getByTestId("farmer-water-soil")).toHaveText("7,904");
  await expect(page.getByTestId("farmer-delta-water")).toContainText("5,815");
  await expect(page.getByTestId("farmer-nitrogen-baseline")).toContainText(
    "-5",
  );
  await expect(page.getByTestId("farmer-nitrogen-water")).toContainText("+2");
  await expect(page.getByTestId("farmer-nitrogen-soil")).toContainText("+6");
  await expect(page.locator(".three-strategy-grid .suitability")).toHaveCount(
    0,
  );
  await page
    .getByRole("button", { name: "Compare three strategies", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "One field. Three strategies.",
      exact: true,
    }),
  ).toBeFocused();
  await page
    .getByLabel("Irrigation system", { exact: true })
    .selectOption("drip");
  await expect(page.getByTestId("farmer-water-baseline")).toHaveText("6,758");
  await page.getByLabel("Summer crop", { exact: true }).selectOption("sesame");
  await expect(page.getByTestId("farmer-strategy-baseline")).toContainText(
    "Sesame",
  );
  await page.getByLabel("Main goal", { exact: true }).selectOption("soil");
  await expect(page.getByLabel("Summer crop", { exact: true })).toHaveValue(
    "sesame",
  );
  await page
    .getByTestId("farmer-strategy-water")
    .getByText("Calculation and scoring details", { exact: true })
    .click();
  await expect(page.getByTestId("farmer-strategy-water")).toContainText(
    "not a success probability",
  );
  expect(errors).toEqual([]);
});

test("optional whole-field totals accept valid area and hide for zero/missing/invalid values without hiding per-feddan results", async ({
  page,
}) => {
  await blockRemote(page);
  await page.goto("/");
  await english(page);
  await expect(page.getByTestId("farmer-total-baseline")).toHaveCount(0);
  await page
    .getByText("Optional details about your field", { exact: true })
    .click();
  await page
    .getByLabel("Estimate water for my whole field", { exact: true })
    .check();
  await expect(page.getByRole("alert")).toContainText(
    "total area greater than zero",
  );
  await page.getByLabel("Area in feddans", { exact: true }).fill("2");
  await expect(page.getByTestId("farmer-total-baseline")).toContainText(
    "21,626",
  );
  await page.getByLabel("Area in feddans", { exact: true }).fill("0");
  await expect(page.getByTestId("farmer-total-baseline")).toHaveCount(0);
  await expect(page.getByTestId("farmer-water-baseline")).toHaveText("10,813");
  await page.getByLabel("Area in feddans", { exact: true }).fill("");
  await page.getByLabel("Extra qirats", { exact: true }).fill("1");
  await expect(page.getByTestId("farmer-total-baseline")).toContainText("451");
  await page.getByLabel("Extra qirats", { exact: true }).fill("24");
  await expect(page.getByTestId("farmer-total-baseline")).toHaveCount(0);
  await page
    .getByLabel("Estimate water for my whole field", { exact: true })
    .uncheck();
  await page
    .getByLabel("Do you keep livestock? Include forage in scoring.", {
      exact: true,
    })
    .check();
  await page
    .getByLabel("Explore a conditional Nili cover", { exact: true })
    .check();
  await expect(
    page.getByTestId("farmer-strategy-water").locator(".numeric-crops"),
  ).toContainText("Cowpea");
  await expect(
    page.getByTestId("farmer-strategy-water").locator(".farmer-cautions"),
  ).toContainText("Nili cover is conditional");
});

test("custom map location failure hides numeric results until an illustrative comparison is explicitly requested", async ({
  page,
}) => {
  const urls = [];
  page.on("request", (r) => {
    if (/power.larc|pixelgust|modis.ornl/.test(r.url())) urls.push(r.url());
  });
  await blockRemote(page);
  await page.goto("/");
  await english(page);
  await coordinates(page, 30.8, 31.2);
  await waitSources(page);
  await expect(page.getByLabel("Saved locations", { exact: true })).toHaveValue(
    "",
  );
  for (const id of ["baseline", "water", "soil"])
    await expect(page.getByTestId(`farmer-water-${id}`)).toHaveText("—");
  await expect(page.getByTestId("source-climate")).toContainText(
    "Illustrative demo fixture",
  );
  await expect(page.getByTestId("source-soil")).toContainText(
    "Illustrative demo fixture",
  );
  await expect(page.getByTestId("source-ndvi")).toContainText(
    "Illustrative demo fixture",
  );
  expect(
    urls.some(
      (url) => url.includes("latitude=30.8") && url.includes("longitude=31.2"),
    ),
  ).toBe(true);
  await page
    .getByText("Data coverage and calculation method", { exact: true })
    .click();
  await expect(page.locator(".source-method")).toContainText(
    "complete weather drivers have not been retrieved",
  );
  await expect(page.locator(".source-method")).toContainText(
    "NASA ET₀ does not drive",
  );
  await page
    .getByRole("button", { name: "Show illustrative comparison", exact: true })
    .click();
  await expect(page.locator(".illustrative-banner")).toBeVisible();
  await expect(page.getByTestId("farmer-water-baseline")).toHaveText("10,813");
  await page
    .getByLabel("Saved locations", { exact: true })
    .selectOption("delta_kafr_el_sheikh");
  await waitSources(page);
  await expect(page.getByTestId("farmer-water-baseline")).toHaveText("—");
  await expect(page.getByTestId("source-soil")).toContainText(
    "Illustrative demo fixture",
  );
  await page
    .getByRole("button", { name: "Show illustrative comparison", exact: true })
    .click();
  await expect(page.getByTestId("farmer-water-baseline")).toHaveText("10,813"); // Irrigation is preserved.
  await page
    .getByLabel("Saved locations", { exact: true })
    .selectOption("west_delta_nubariya");
  await expect(page.getByTestId("farmer-water-baseline")).toHaveText("10,813");
  await coordinates(page, 0, 0);
  await expect(page.getByRole("alert")).toContainText("within Egypt");
  await page
    .getByLabel("Satellite layer", { exact: true })
    .selectOption("ndvi");
  await expect(page.getByText("12 JUL 2025", { exact: true })).toBeVisible();
  await page
    .locator(".leaflet-container")
    .click({ position: { x: 200, y: 120 } });
  await waitSources(page);
  await expect(page.getByLabel("Saved locations", { exact: true })).toHaveValue(
    "",
  );
  await expect(page.getByTestId("farmer-water-baseline")).toHaveText("—");
});

test("complete custom-location HTTP responses feed the real service, diagnostics and three comparisons", async ({
  page,
}) => {
  const requests = [];
  await page.route(/^https:\/\//, (route) => {
    if (firstParty(route)) return route.continue();
    const url = route.request().url(),
      payload = sourcePayload(url);
    if (payload) {
      requests.push(url);
      return route.fulfill({ json: payload });
    }
    return route.abort();
  });
  await page.goto("/");
  await english(page);
  await coordinates(page, 30.8, 31.2);
  await waitSources(page);
  for (const key of ["climate", "soil", "ndvi"])
    await expect(page.getByTestId(`source-${key}`)).toContainText(
      "Retrieved source data",
    );
  await expect(
    page.getByRole("button", {
      name: "Show illustrative comparison",
      exact: true,
    }),
  ).toHaveCount(0);
  await expect(page.getByTestId("farmer-water-baseline")).toHaveText("10,813");
  await expert(page);
  await expect(page.locator(".diagnostic-0 .metric")).toContainText("153");
  await page
    .getByText("Inspect all six field indices", { exact: true })
    .click();
  await expect(
    page.getByText("Seasonal reference ET₀", { exact: true }).locator(".."),
  ).toContainText("Unavailable");
  expect(
    requests.filter((url) => {
      const p = new URL(url).searchParams;
      return (
        Number(p.get("latitude") ?? p.get("lat")) === 30.8 &&
        Number(p.get("longitude") ?? p.get("lon")) === 31.2
      );
    }).length,
  ).toBe(8);
  await page.getByRole("button", { name: "Farmer mode", exact: true }).click();
  await page
    .getByRole("button", { name: "Retry sources", exact: true })
    .click();
  await waitSources(page);
  await expect(page.getByTestId("source-climate")).toContainText(
    "Retrieved source data",
  );
});

test("rapid map changes discard old source responses; stopping a retry preserves selected-location fallback status", async ({
  page,
}) => {
  await page.route(/^https:\/\//, async (route) => {
    if (firstParty(route)) return route.continue();
    const url = route.request().url(),
      p = new URL(url).searchParams,
      lat = Number(p.get("latitude") ?? p.get("lat"));
    const payload = sourcePayload(url);
    if (!payload) return route.abort();
    if (lat === 30.8) await new Promise((resolve) => setTimeout(resolve, 350));
    if (lat === 30.9) return route.abort();
    return route.fulfill({ json: payload }).catch(() => {});
  });
  await page.goto("/");
  await english(page);
  await coordinates(page, 30.8, 31.2);
  await coordinates(page, 30.9, 31.3);
  await waitSources(page);
  await expect(
    page.getByText("30.9000° N, 31.3000° E", { exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("source-climate")).toContainText(
    "Illustrative demo fixture",
  );
  await expect(page.getByTestId("farmer-water-baseline")).toHaveText("—");
  await page.route(
    /power\.larc|pixelgust|modis\.ornl|rest\.isric/,
    async (route) => {
      if (route.request().url().includes("power.larc"))
        return route.fulfill({ json: sourcePayload(route.request().url()) });
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await route.abort().catch(() => {});
    },
  );
  await page
    .getByRole("button", { name: "Retry sources", exact: true })
    .click();
  await expect(page.getByTestId("source-climate")).toContainText(
    "Retrieved source data",
  );
  await page
    .getByRole("button", { name: "Stop fetching", exact: true })
    .click();
  await waitSources(page);
  await expect(page.getByTestId("source-climate")).toContainText(
    "Illustrative demo fixture",
  );
  await expect(page.getByTestId("farmer-water-baseline")).toHaveText("—");
});

test("expert inspection, custom weights, measured ECe and all five pipeline stages retain shared state", async ({
  page,
}) => {
  await blockRemote(page);
  await page.goto("/");
  await english(page);
  await expert(page);
  await page.getByLabel("Water conservation", { exact: true }).fill("100");
  await page.getByLabel("Soil & nitrogen recovery", { exact: true }).fill("0");
  await page.getByLabel("Cash & forage return", { exact: true }).fill("0");
  await expect(page.getByTestId("strategy-water")).toContainText("Rank 1");
  await page.getByRole("button", { name: "Farmer mode", exact: true }).click();
  await expect(page.getByLabel("Main goal", { exact: true })).toHaveValue(
    "custom",
  );
  await page.getByLabel("Main goal", { exact: true }).selectOption("soil");
  await expert(page);
  await expect(
    page.getByLabel("Soil & nitrogen recovery", { exact: true }),
  ).toHaveValue("70");
  await page.getByLabel("Measured soil ECe", { exact: true }).fill("12");
  await page.getByRole("button", { name: "Farmer mode", exact: true }).click();
  await expect(
    page.getByTestId("farmer-strategy-baseline").locator(".farmer-cautions"),
  ).toContainText("measured soil ECe");
  await expert(page);
  await page
    .getByText("Inspect all six field indices", { exact: true })
    .click();
  await expect(
    page.getByText("Canopy anomaly · ZNDVI", { exact: true }),
  ).toBeVisible();
  await page.getByText("View chart values as tables", { exact: true }).click();
  await expect(page.getByRole("table")).toHaveCount(2);
  const explorer = page.getByRole("region", {
    name: "Post-processing pipeline explorer",
    exact: true,
  });
  for (const label of [
    "1 · Field indices",
    "2 · Candidates",
    "3 · MCDA ranking",
    "4 · Explanation",
    "5 · Farmer output",
  ]) {
    await explorer.getByRole("button", { name: label, exact: true }).click();
    await expect(explorer.getByLabel("Stage JSON output")).toBeVisible();
  }
  await expect(explorer.getByLabel("Stage JSON output")).toContainText(
    "hypotheticalSummerSwitch",
  );
  await page
    .getByTestId("strategy-water")
    .getByText("FAO references & unverified inputs", { exact: true })
    .click();
  await expect(
    page
      .getByTestId("strategy-water")
      .getByRole("link", { name: "FAO ECe", exact: true }),
  ).toBeVisible();
});

test("incomplete POWER responses cannot overwrite audited snapshots", async ({
  page,
}) => {
  await page.route(/^https:\/\//, (route) =>
    firstParty(route)
      ? route.continue()
      : route.request().url().includes("power.larc")
        ? route.fulfill({
            json: { properties: { parameter: { T2M_MAX: { 20250701: 40 } } } },
          })
        : route.abort(),
  );
  await page.goto("/");
  await english(page);
  await waitSources(page);
  await expect(page.getByTestId("source-climate")).toContainText(
    "Audited historical snapshot",
  );
  await expect(page.getByTestId("farmer-water-baseline")).toHaveText("10,813");
  await expert(page);
  await expect(page.locator(".diagnostic-0 .metric")).toContainText("58");
});

test("Arabic RTL and English LTR layouts fit mobile, tablet and desktop with accessible comparison focus", async ({
  page,
}) => {
  await blockRemote(page);
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByTestId("farmer-water-baseline")).toContainText(
      "١٠٬٨١٣",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/map-cards-ar-${width}.png`,
      fullPage: true,
    });
    await english(page);
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page
      .getByRole("button", { name: "Compare three strategies", exact: true })
      .focus();
    await page.keyboard.press("Enter");
    await expect(
      page.getByRole("heading", {
        name: "One field. Three strategies.",
        exact: true,
      }),
    ).toBeFocused();
    await page.screenshot({
      path: `test-results/map-cards-en-${width}.png`,
      fullPage: true,
    });
    await expert(page);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});

test("production shell and numerical comparisons reload offline after first visit", async ({
  page,
  context,
}) => {
  await blockRemote(page);
  await page.goto("/");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await context.setOffline(true);
  await page.reload();
  await english(page);
  await expect(page.getByTestId("farmer-water-baseline")).toHaveText("10,813");
  await page
    .getByLabel("Saved locations", { exact: true })
    .selectOption("west_delta_nubariya");
  await expect(page.getByTestId("farmer-water-baseline")).toHaveText("10,813");
  await coordinates(page, 30.8, 31.2);
  await waitSources(page);
  await expect(page.getByTestId("farmer-water-baseline")).toHaveText("—");
});

test("input changes repaint locally without new source requests", async ({
  page,
}) => {
  const requests = [];
  page.on("request", (r) => {
    if (/power.larc|pixelgust|rest.isric|modis.ornl/.test(r.url()))
      requests.push(r.url());
  });
  await blockRemote(page);
  await page.goto("/");
  await english(page);
  await waitSources(page);
  const before = requests.length;
  await page
    .getByLabel("Irrigation system", { exact: true })
    .selectOption("drip");
  await page
    .getByLabel("Winter crop", { exact: true })
    .selectOption("faba_bean");
  await page.getByLabel("Main goal", { exact: true }).selectOption("soil");
  await expect(page.getByTestId("farmer-water-baseline")).not.toHaveText(
    "10,813",
  );
  expect(requests.length).toBe(before);
});
