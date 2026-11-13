import { test, expect } from "@playwright/test";
const blockRemote = async (page) =>
  page.route(/^https:\/\//, (route) => route.abort());
async function english(page) {
  await page.getByRole("button", { name: "English", exact: true }).click();
}

test("presets, inputs, rankings and both language directions work with all remote sources down", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await blockRemote(page);
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByTestId("strategy-baseline")).toBeVisible();
  await english(page);
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(page.getByText("Historical observations · 2025")).toBeVisible();
  await expect(page.getByTestId("water-baseline")).toContainText("10,813");
  await page
    .getByRole("button", { name: "North Delta · Kafr El-Sheikh", exact: true })
    .click();
  await expect(page.getByText("31.1107° N, 30.9388° E")).toBeVisible();
  await expect(page.getByLabel("Known salinity")).toHaveValue("high");
  await expect(page.locator(".diagnostic-2")).toContainText(
    "Illustrative demo fixture",
  );
  await expect(page.locator(".diagnostic-0 .metric")).toContainText("70");
  await page
    .getByRole("button", { name: "West Delta · Nubariya", exact: true })
    .click();
  await expect(page.getByLabel("Land type", { exact: true })).toHaveValue(
    "new_sandy",
  );
  await expect(page.getByLabel("Irrigation system")).toHaveValue("drip");
  await page
    .getByRole("button", { name: "Fayoum · Etsa tail-end", exact: true })
    .click();
  await page.getByLabel("Water conservation").fill("100");
  await page.getByLabel("Soil & nitrogen recovery").fill("0");
  await page.getByLabel("Cash & forage return").fill("0");
  await expect(page.getByTestId("strategy-water")).toContainText("Rank 1");
  await page.getByLabel("Water conservation").fill("0");
  await page.getByLabel("Soil & nitrogen recovery").fill("100");
  await expect(page.getByTestId("strategy-soil")).toContainText("Rank 1");
  const water = await page.getByTestId("water-baseline").textContent();
  await page.getByLabel("Irrigation system").selectOption("drip");
  await expect(page.getByTestId("water-baseline")).not.toHaveText(water);
  await page.getByLabel("Area in feddans").fill("0");
  await expect(page.getByRole("alert")).toContainText(
    "total area greater than zero",
  );
  await expect(page.getByTestId("strategy-baseline")).toHaveCount(0);
  await page.getByLabel("Area in feddans").fill("5");
  await page.getByLabel("Seifi · summer crop").selectOption("sesame");
  await expect(page.getByTestId("strategy-baseline")).toContainText(
    "Sesame (Semsem)",
  );
  await page.getByRole("button", { name: "Judge mode", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByText("Shared coordinates, different scales"),
  ).toBeVisible();
  await page.getByText("View chart values as tables").click();
  await expect(page.getByRole("table")).toHaveCount(2);
  await expect(
    page
      .getByTestId("strategy-water")
      .getByText("Verify locally before planting"),
  ).toBeVisible();
  await page
    .getByTestId("strategy-water")
    .getByText("Verify locally before planting")
    .click();
  await expect(page.getByTestId("strategy-water")).toContainText(
    "Catalog windows overlap",
  );
  expect(errors).toEqual([]);
});

test("map selection, historical overlay and coordinate validation", async ({
  page,
}) => {
  await blockRemote(page);
  await page.goto("/");
  await english(page);
  await page.getByLabel("Satellite layer").selectOption("ndvi");
  await expect(page.getByText("12 JUL 2025")).toBeVisible();
  await page
    .locator(".leaflet-container")
    .click({ position: { x: 210, y: 100 } });
  await expect(
    page.getByRole("button", { name: "Fayoum · Etsa tail-end", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  await page.getByLabel("Latitude", { exact: true }).fill("0");
  await page.getByRole("button", { name: "Analyze location" }).click();
  await expect(page.getByRole("alert")).toContainText("within Egypt");
  await page.getByLabel("Latitude", { exact: true }).fill("30.665");
  await page.getByLabel("Longitude", { exact: true }).fill("30.068");
  await page.getByRole("button", { name: "Analyze location" }).click();
  await expect(page.getByText("30.6650° N, 30.0680° E")).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("incomplete live POWER cannot overwrite an audited snapshot", async ({
  page,
}) => {
  await page.route(/^https:\/\//, async (route) => {
    if (route.request().url().includes("power.larc"))
      return route.fulfill({
        json: {
          properties: {
            parameter: {
              T2M_MAX: { 20250701: 40, 20250702: -999, 20250703: 39 },
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
  await expect(page.getByText("Historical observations · 2025")).toBeVisible();
  await expect(page.locator(".diagnostic-0 .metric")).toContainText("58");
  await expect(page.locator(".diagnostic-0")).toContainText(
    "Audited historical snapshot",
  );
  await expect(page.locator(".diagnostic-1")).toContainText(
    "Audited historical snapshot",
  );
});

test("mobile Arabic and English remain within viewport with keyboard-accessible evidence", async ({
  page,
}) => {
  await blockRemote(page);
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/dashboard-ar-${width}.png`,
      fullPage: true,
    });
    await english(page);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/dashboard-en-${width}.png`,
      fullPage: true,
    });
  }
});

test("production shell reloads offline after a completed first online visit", async ({
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
  await expect(page.getByTestId("strategy-baseline")).toBeVisible();
  await english(page);
  await expect(page.getByText("Historical observations · 2025")).toBeVisible();
  await page
    .getByRole("button", { name: "West Delta · Nubariya", exact: true })
    .click();
  await expect(page.getByLabel("Irrigation system")).toHaveValue("drip");
});
