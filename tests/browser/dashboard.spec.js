import { test, expect } from "@playwright/test";
const blockRemote = (page) =>
  page.route(/^https:\/\//, (route) =>
    new URL(route.request().url()).origin ===
    new URL(test.info().project.use.baseURL).origin
      ? route.continue()
      : route.abort(),
  );
const english = (page) =>
  page.getByRole("button", { name: "English", exact: true }).click();
const expert = (page) =>
  page.getByRole("button", { name: "Expert mode", exact: true }).click();
async function complete(page, ar = false) {
  for (let i = 0; i < 3; i++)
    await page
      .getByRole("button", { name: ar ? "كمّل" : "Continue", exact: true })
      .click();
  await page
    .getByRole("button", {
      name: ar ? "قارن دورتي الزراعية" : "Compare my rotation",
      exact: true,
    })
    .click();
}

test("four questions preserve choices, optional totals and goal changes update a score-free farmer result", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await blockRemote(page);
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator(".map-panel")).toHaveCount(0);
  await expect(page.locator(".diagnostics-grid")).toHaveCount(0);
  await english(page);
  await expect(
    page.getByRole("heading", { name: "Where is your field?", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("radio", { name: "West Delta · Nubariya", exact: true })
    .check();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByLabel("Winter crop", { exact: true })
    .selectOption("faba_bean");
  await page.getByLabel("Summer crop", { exact: true }).selectOption("sesame");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("radio", { name: "Drip", exact: true }).check();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page.getByLabel("Summer crop", { exact: true })).toHaveValue(
    "sesame",
  );
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    page.getByRole("radio", { name: "Drip", exact: true }),
  ).toBeChecked();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByRole("radio", { name: "Improve soil condition", exact: true })
    .check();
  await page
    .getByRole("button", { name: "Compare my rotation", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "A proposed rotation for your goal",
      exact: true,
    }),
  ).toBeFocused();
  await expect(page.getByTestId("farmer-total")).toHaveCount(0);
  await expect(page.locator(".suitability")).toHaveCount(0);
  await expect(
    page.getByText("Historical observations · 2025", { exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Change your goal", { exact: true })
    .selectOption("market");
  await expect(page.locator(".goal-context")).toHaveText(
    "Consider market / forage return",
  );
  await page
    .getByRole("button", { name: "Compare options", exact: true })
    .click();
  await expect(page.getByTestId("farmer-option-baseline")).toContainText(
    "Sesame",
  );
  await expect(page.locator(".compact-option")).toHaveCount(3);
  await page
    .getByRole("button", { name: "Why this suggestion?", exact: true })
    .click();
  await expect(
    page.getByText("Check locally before planting", { exact: true }),
  ).toBeVisible();
  await page
    .getByText("Optional details about your field", { exact: true })
    .click();
  await page
    .getByLabel("Estimate water for my whole field", { exact: true })
    .check();
  await page.getByLabel("Area in feddans", { exact: true }).fill("0");
  await expect(page.getByRole("alert")).toContainText(
    "total area greater than zero",
  );
  await expect(page.getByTestId("farmer-total")).toHaveCount(0);
  await page.getByLabel("Area in feddans", { exact: true }).fill("2");
  await expect(page.getByTestId("farmer-total")).toContainText(
    "Whole field model estimate",
  );
  expect(errors).toEqual([]);
});

test("expert mode retains shared state, exact scores, diagnostics, measured ECe, references and pipeline", async ({
  page,
}) => {
  await blockRemote(page);
  await page.goto("/");
  await english(page);
  await complete(page);
  await expert(page);
  await expect(page.getByTestId("water-baseline")).toContainText("10,813");
  await page.getByLabel("Water conservation", { exact: true }).fill("100");
  await page.getByLabel("Soil & nitrogen recovery", { exact: true }).fill("0");
  await page.getByLabel("Cash & forage return", { exact: true }).fill("0");
  await expect(page.getByTestId("strategy-water")).toContainText("Rank 1");
  await page.getByRole("button", { name: "Farmer mode", exact: true }).click();
  await expect(
    page.getByLabel("Change your goal", { exact: true }),
  ).toHaveValue("custom");
  await page
    .getByLabel("Change your goal", { exact: true })
    .selectOption("soil");
  await expert(page);
  await expect(
    page.getByLabel("Soil & nitrogen recovery", { exact: true }),
  ).toHaveValue("70");
  await page
    .getByRole("button", { name: "North Delta · Kafr El-Sheikh", exact: true })
    .click();
  await expect(page.locator(".diagnostic-2")).toContainText(
    "Illustrative demo fixture",
  );
  await expect(page.locator(".diagnostic-0 .metric")).toContainText("70");
  // Region changes no longer overwrite the user's intentional irrigation choice.
  await expect(
    page.getByLabel("Irrigation system", { exact: true }),
  ).toHaveValue("flood");
  await page
    .getByRole("button", {
      name: "Apply region demo context and irrigation",
      exact: true,
    })
    .click();
  await expect(
    page.getByLabel("Irrigation system", { exact: true }),
  ).toHaveValue("modified_surface");
  await page.getByLabel("Measured soil ECe", { exact: true }).fill("12");
  await page.getByRole("button", { name: "Farmer mode", exact: true }).click();
  await page
    .getByRole("button", { name: "Compare options", exact: true })
    .click();
  await page.getByTestId("farmer-option-baseline").getByRole("button").click();
  await expect(page.locator(".farmer-cautions")).toContainText(
    "measured soil ECe",
  );
  await expert(page);
  await page
    .getByText("Inspect all six field indices", { exact: true })
    .click();
  await expect(
    page.getByText("Seasonal reference ET₀", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Canopy anomaly · ZNDVI", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Shared coordinates, different scales", { exact: true }),
  ).toBeVisible();
  await page.getByText("View chart values as tables", { exact: true }).click();
  await expect(page.getByRole("table")).toHaveCount(2);
  await page
    .getByLabel("Explore a conditional Nili cover", { exact: true })
    .check();
  await expect(page.getByTestId("strategy-water")).toContainText(
    "NILI · CONDITIONAL COVER",
  );
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
  await page
    .getByTestId("strategy-water")
    .getByText("Verify locally before planting", { exact: true })
    .click();
  await expect(page.getByTestId("strategy-water")).toContainText("broomrape");
});

test("optional map, custom location, missing support and coordinate validation", async ({
  page,
}) => {
  await blockRemote(page);
  await page.goto("/");
  await english(page);
  await complete(page);
  await page
    .getByRole("button", { name: "View location on map", exact: true })
    .click();
  await page
    .getByLabel("Satellite layer", { exact: true })
    .selectOption("ndvi");
  await expect(page.getByText("12 JUL 2025", { exact: true })).toBeVisible();
  await page.getByLabel("Latitude", { exact: true }).fill("0");
  await page
    .getByRole("button", { name: "Analyze location", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("within Egypt");
  await page.getByLabel("Latitude", { exact: true }).fill("30.666");
  await page.getByLabel("Longitude", { exact: true }).fill("30.068");
  await page
    .getByRole("button", { name: "Analyze location", exact: true })
    .click();
  await expect(
    page.getByText("30.6660° N, 30.0680° E", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Illustrative fallback data is in use", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".farmer-cautions")).toContainText(
    "illustrative fallback",
  );
  await page.getByRole("button", { name: "Close map", exact: true }).click();
  await expert(page);
  await page
    .locator(".leaflet-container")
    .click({ position: { x: 210, y: 100 } });
  await expect(
    page.getByRole("button", { name: "Fayoum · Etsa tail-end", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
});

test("incomplete live POWER cannot overwrite audited historical evidence", async ({
  page,
}) => {
  await page.route(/^https:\/\//, (route) => {
    if (
      new URL(route.request().url()).origin ===
      new URL(test.info().project.use.baseURL).origin
    )
      return route.continue();
    if (route.request().url().includes("power.larc"))
      return route.fulfill({
        json: {
          properties: {
            parameter: {
              T2M_MAX: { 20250701: 40, 20250702: -999 },
              GWETROOT: { 20250701: 0.33 },
              EVPTRNS: { 20250701: 8.5 },
            },
          },
        },
      });
    return route.abort();
  });
  await page.goto("/");
  await english(page);
  await expert(page);
  await expect(page.locator(".diagnostic-0 .metric")).toContainText("58");
  await expect(page.locator(".diagnostic-0")).toContainText(
    "Audited historical snapshot",
  );
  await expect(page.locator(".diagnostic-1")).toContainText(
    "Audited historical snapshot",
  );
});

test("mobile Arabic RTL and English LTR journeys and results fit viewport and keyboard works", async ({
  page,
}) => {
  await blockRemote(page);
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await page.screenshot({
      path: `test-results/journey-ar-${width}.png`,
      fullPage: true,
    });
    await complete(page, true);
    await expect(page.locator(".recommendation")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/results-ar-${width}.png`,
      fullPage: true,
    });
    await english(page);
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/results-en-${width}.png`,
      fullPage: true,
    });
    await page
      .getByRole("button", { name: "Compare options", exact: true })
      .focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("farmer-option-baseline")).toBeVisible();
    await expert(page);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/expert-en-${width}.png`,
      fullPage: true,
    });
  }
});

test("production shell reloads offline and all three regional journeys remain available", async ({
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
  await expect(
    page.getByRole("heading", { name: "Where is your field?", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("radio", { name: "North Delta · Kafr El-Sheikh", exact: true })
    .check();
  await complete(page);
  await expect(
    page.getByText("Illustrative fallback data is in use", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".farmer-cautions")).toContainText(
    "illustrative fallback",
  );
  await page
    .getByRole("button", { name: "Back to field questions", exact: true })
    .click();
  for (let i = 0; i < 3; i++)
    await page.getByRole("button", { name: "Back", exact: true }).click();
  await page
    .getByRole("radio", { name: "West Delta · Nubariya", exact: true })
    .check();
  await complete(page);
  await expect(
    page.getByText("Historical observations · 2025", { exact: true }),
  ).toBeVisible();
});

test("expert sliders repaint within 100 ms without additional source requests", async ({
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
  await expert(page);
  await expect(
    page.getByRole("button", { name: "Refresh sources", exact: true }),
  ).toBeEnabled();
  const before = requests.length;
  const durations = await page.evaluate(async () => {
    const range = document.querySelector("#priority-water"),
      setter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      ).set,
      times = [];
    for (let i = 0; i < 12; i++) {
      const start = performance.now();
      setter.call(range, String(10 + i * 7));
      range.dispatchEvent(new Event("input", { bubbles: true }));
      await new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      );
      times.push(performance.now() - start);
    }
    return times;
  });
  await expect(page.locator('label[for="priority-water"] output')).toHaveText(
    "87",
  );
  durations.sort((a, b) => a - b);
  expect(durations[10]).toBeLessThan(100);
  expect(requests.length).toBe(before);
  console.log(`Slider input-to-paint p90: ${durations[10].toFixed(1)} ms`);
});
