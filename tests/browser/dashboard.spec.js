import { test, expect } from "@playwright/test";
const blockRemote = async (page) =>
  page.route(/^https:\/\//, (route) =>
    new URL(route.request().url()).origin ===
    new URL(test.info().project.use.baseURL).origin
      ? route.continue()
      : route.abort(),
  );
const english = (page) =>
  page.getByRole("button", { name: "English", exact: true }).click();
const step = (page, name) =>
  page
    .getByRole("navigation", { name: "Planning journey" })
    .getByRole("button", { name, exact: true })
    .click();
const demo = (page) =>
  page
    .getByRole("button", { name: "Explore Fayoum demo", exact: true })
    .click();

test("one-click demo, editable journey, presets, ranking and inputs survive navigation with all remote sources down", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await blockRemote(page);
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "ماذا تزرع في الموسم القادم؟",
  );
  await english(page);
  await demo(page);
  await expect(page.getByTestId("strategy-baseline")).toBeVisible();
  await expect(page.getByTestId("water-baseline")).toContainText("10,813");
  await expect(
    page.getByText("Historical observations · 2025", { exact: true }),
  ).toBeVisible();
  await step(page, "Field");
  await page
    .getByRole("button", { name: "North Delta · Kafr El-Sheikh", exact: true })
    .click();
  await step(page, "Farm");
  await expect(page.getByLabel("Known salinity")).toHaveValue("high");
  await step(page, "Evidence");
  await expect(page.locator(".diagnostic-2")).toContainText(
    "Illustrative demo fixture",
  );
  await expect(page.locator(".diagnostic-0 .metric")).toContainText("70");
  await step(page, "Field");
  await page
    .getByRole("button", { name: "West Delta · Nubariya", exact: true })
    .click();
  await step(page, "Farm");
  await expect(page.getByLabel("Land type", { exact: true })).toHaveValue(
    "new_sandy",
  );
  await expect(page.getByLabel("Irrigation system")).toHaveValue("drip");
  await step(page, "Field");
  await page
    .getByRole("button", { name: "Fayoum · Etsa tail-end", exact: true })
    .click();
  await step(page, "Goals");
  await page.locator(".custom-goals > summary").click();
  await page.getByLabel("Water conservation").fill("100");
  await page.getByLabel("Soil & nitrogen recovery").fill("0");
  await page.getByLabel("Cash & forage return").fill("0");
  await expect(
    page.getByRole("region", { name: "Updated model preview" }),
  ).toContainText("Rank 1");
  await step(page, "Compare");
  await expect(page.getByTestId("strategy-water")).toContainText("Rank 1");
  await step(page, "Goals");
  await page.locator(".custom-goals > summary").click();
  await page.getByLabel("Water conservation").fill("0");
  await page.getByLabel("Soil & nitrogen recovery").fill("100");
  await step(page, "Compare");
  await expect(page.getByTestId("strategy-soil")).toContainText("Rank 1");
  const water = await page.getByTestId("water-baseline").textContent();
  await step(page, "Farm");
  await page.getByLabel("Irrigation system").selectOption("drip");
  await page.getByLabel("Area in feddans").fill("0");
  await expect(page.getByRole("alert")).toContainText(
    "total area greater than zero",
  );
  await step(page, "Compare");
  await expect(page.getByTestId("strategy-baseline")).toHaveCount(0);
  await step(page, "Farm");
  await page.getByLabel("Area in feddans").fill("5");
  await page.getByLabel("Seifi · summer crop").selectOption("sesame");
  await step(page, "Compare");
  await expect(page.getByTestId("water-baseline")).not.toHaveText(water);
  await expect(page.getByTestId("strategy-baseline")).toContainText(
    "Sesame (Semsem)",
  );
  await page
    .getByTestId("strategy-water")
    .getByText("Verify locally before planting", { exact: true })
    .click();
  await expect(page.getByTestId("strategy-water")).toContainText("broomrape");
  await page
    .getByTestId("strategy-water")
    .getByText("Why this plan? Evidence & confidence", { exact: true })
    .click();
  await expect(
    page
      .getByTestId("strategy-water")
      .getByText("Data support", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Judge mode", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByText("Shared coordinates, different scales", { exact: true }),
  ).toBeVisible();
  await page.getByText("View chart values as tables", { exact: true }).click();
  await expect(page.getByRole("table")).toHaveCount(2);
  expect(errors).toEqual([]);
});

test("map selection, historical overlays, tile failure recovery and coordinate validation", async ({
  page,
}) => {
  await blockRemote(page);
  await page.goto("/");
  await english(page);
  await page.getByText("Choose a point on the map", { exact: true }).click();
  await page.getByLabel("Satellite layer").selectOption("ndvi");
  await expect(page.getByText("12 JUL 2025")).toBeVisible();
  await page
    .locator(".leaflet-container")
    .click({ position: { x: 210, y: 100 } });
  await expect(
    page.getByRole("button", { name: "Fayoum · Etsa tail-end", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  await page.getByText("Advanced: enter coordinates", { exact: true }).click();
  await page.getByLabel("Latitude", { exact: true }).fill("0");
  await page
    .getByRole("button", { name: "Analyze location", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("within Egypt");
  await page.getByLabel("Latitude", { exact: true }).fill("30.665");
  await page.getByLabel("Longitude", { exact: true }).fill("30.068");
  await page
    .getByRole("button", { name: "Analyze location", exact: true })
    .click();
  await expect(
    page.getByText("30.6650° N, 30.0680° E", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await step(page, "Compare");
  await expect(page.getByTestId("strategy-baseline")).toBeVisible();
});

test("incomplete live POWER cannot overwrite an audited snapshot", async ({
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
  await expect(
    page.getByText("Historical observations · 2025", { exact: true }),
  ).toBeVisible();
  await step(page, "Evidence");
  await expect(page.locator(".diagnostic-0 .metric")).toContainText("58");
  await expect(page.locator(".diagnostic-0")).toContainText(
    "Audited historical snapshot",
  );
  await expect(page.locator(".diagnostic-1")).toContainText(
    "Audited historical snapshot",
  );
});

test("responsive English/Arabic journey at 390, 768, 1440 and 200% browser zoom equivalent", async ({
  page,
}) => {
  await blockRemote(page);
  // Chromium headless has no browser chrome zoom API. Halving the CSS viewport reproduces 200% reflow (1440→720, 768→384, 390→195).
  for (const width of [390, 768, 1440, 720, 384, 195]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    for (const lang of ["ar", "en"]) {
      if (lang === "en") await english(page);
      for (const [name, arName] of [
        ["Field", "الحقل"],
        ["Farm", "المزرعة"],
        ["Goals", "الأولويات"],
        ["Compare", "المقارنة"],
        ["Evidence", "الأدلة"],
      ]) {
        await page
          .getByRole("navigation")
          .getByRole("button", {
            name: lang === "ar" ? arName : name,
            exact: true,
          })
          .click();
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          `${lang} ${name} at ${width}`,
        ).toBe(true);
      }
      await page.screenshot({
        path: `test-results/journey-${lang}-${width}.png`,
        fullPage: true,
      });
    }
  }
});

test("production shell reloads offline and demo remains navigable", async ({
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
  await demo(page);
  await expect(page.getByTestId("strategy-baseline")).toBeVisible();
  await expect(
    page.getByText("Historical observations · 2025", { exact: true }),
  ).toBeVisible();
  await step(page, "Field");
  await page
    .getByRole("button", { name: "West Delta · Nubariya", exact: true })
    .click();
  await step(page, "Farm");
  await expect(page.getByLabel("Irrigation system")).toHaveValue("drip");
});

test("six indices, conditional cover and five explorer stages retain current field JSON in both languages", async ({
  page,
}) => {
  await blockRemote(page);
  await page.goto("/");
  await english(page);
  await step(page, "Goals");
  await page.getByLabel("Explore a conditional Nili cover").check();
  await step(page, "Compare");
  await expect(page.getByTestId("strategy-water")).toContainText(
    "NILI · CONDITIONAL COVER",
  );
  await page.getByRole("button", { name: "Judge mode", exact: true }).click();
  await page
    .getByText("Inspect all six field indices", { exact: true })
    .click();
  await expect(
    page.getByText("Seasonal reference ET₀", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Canopy anomaly · ZNDVI", { exact: true }),
  ).toBeVisible();
  const explorer = page.getByRole("region", {
    name: "Post-processing pipeline explorer",
  });
  for (const label of [
    "1 · Field indices",
    "2 · Candidates",
    "3 · MCDA ranking",
    "4 · Explanation",
    "5 · Farmer output",
  ]) {
    await explorer.getByRole("button", { name: label, exact: true }).click();
    await expect(
      explorer.getByRole("button", { name: label, exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(explorer.getByLabel("Stage JSON output")).toBeVisible();
  }
  await expect(explorer.getByLabel("Stage JSON output")).toContainText(
    "hypotheticalSummerSwitch",
  );
  await page.setViewportSize({ width: 390, height: 900 });
  await page.getByRole("button", { name: "العربية", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "مستكشف خط المعالجة بعد التنظيف",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await page.screenshot({
    path: "test-results/pipeline-mobile-ar.png",
    fullPage: true,
  });
});

test("goal changes paint within 100 ms and never fetch APIs; irrigation also updates locally", async ({
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
  await expect(
    page.getByRole("button", { name: "Refresh sources" }),
  ).toBeEnabled();
  const before = requests.length;
  await step(page, "Goals");
  await page.locator(".custom-goals > summary").click();
  const original = await page.getByTestId("preview-score-water").textContent();
  const durations = await page.evaluate(async () => {
    const range = document.querySelector("#priority-water");
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    ).set;
    const times = [];
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
  await expect(page.getByTestId("preview-score-water")).not.toHaveText(
    original,
  );
  await step(page, "Farm");
  const preview = page.getByRole("region", { name: "Updated model preview" });
  const initial = await preview.textContent();
  await page.getByLabel("Irrigation system").selectOption("drip");
  await expect(preview).not.toHaveText(initial);
  expect(requests.length).toBe(before);
  console.log(`Goal input-to-paint p90: ${durations[10].toFixed(1)} ms`);
});

test("compare controls, goal presets, summary editing and back/next are non-blocking", async ({
  page,
}) => {
  await blockRemote(page);
  await page.goto("/");
  await english(page);
  await page.getByRole("button", { name: "Next: Farm", exact: true }).click();
  await page.getByLabel("Area in feddans").fill("7");
  await page.getByRole("button", { name: "Next: Goals", exact: true }).click();
  await page.getByRole("button", { name: /Conserve water/ }).click();
  await expect(
    page.getByRole("button", { name: /Conserve water/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("button", { name: "Next: Compare", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Current + water", exact: true })
    .click();
  await expect(page.getByTestId("strategy-soil")).toHaveCount(0);
  await expect(page.getByTestId("strategy-water")).toBeVisible();
  await page.getByRole("button", { name: "All plans", exact: true }).click();
  await expect(page.locator(".strategy-card")).toHaveCount(3);
  await page
    .getByText("Review farm settings", { exact: false })
    .first()
    .click();
  await expect(
    page.getByRole("region", { name: "Your scenario" }),
  ).toContainText("7 feddans");
  await page
    .getByRole("region", { name: "Your scenario" })
    .getByRole("button")
    .nth(1)
    .click();
  await expect(page.getByLabel("Area in feddans")).toHaveValue("7");
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "What can you grow next?",
  );
  await step(page, "Goals");
  await page.getByRole("button", { name: /Recover soil/ }).click();
  await expect(
    page.getByRole("button", { name: /Recover soil/ }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("keyboard focus, reduced motion and mobile touch targets", async ({
  page,
}) => {
  await blockRemote(page);
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/");
  // Wait for the SPA to mount before sending the first keyboard event.
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "انتقل إلى مساحة التخطيط" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main")).toBeFocused();
  await english(page);
  const nav = page.getByRole("navigation", { name: "Planning journey" });
  await nav.getByRole("button", { name: "Farm", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
  await page.getByLabel("Irrigation system").focus();
  expect(
    await page
      .getByLabel("Irrigation system")
      .evaluate((el) => getComputedStyle(el).outlineStyle),
  ).not.toBe("none");
  const smallTargets = await page
    .locator("button:visible,summary:visible")
    .evaluateAll((els) =>
      els
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return r.width < 44 || r.height < 44;
        })
        .map((el) => el.textContent.trim()),
    );
  expect(smallTargets).toEqual([]);
  expect(
    await page
      .locator(".stage-content")
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
  await nav.getByRole("button", { name: "Compare", exact: true }).click();
  await expect(page.locator(".mobile-metric-comparison")).toBeVisible();
  await page
    .getByTestId("strategy-water")
    .getByText("Why this plan? Evidence & confidence", { exact: true })
    .click();
  const comparisonTargets = await page
    .locator("button:visible, summary:visible")
    .evaluateAll((els) =>
      els
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return r.width < 44 || r.height < 44;
        })
        .map((el) => el.textContent.trim()),
    );
  expect(comparisonTargets).toEqual([]);
});

test("latest-main measured ECe validation and FAO references remain available", async ({
  page,
}) => {
  await blockRemote(page);
  await page.goto("/");
  await english(page);
  await step(page, "Farm");
  await page.getByLabel("Measured soil ECe", { exact: true }).fill("-1");
  await expect(page.getByRole("alert")).toContainText("between 0 and 100 dS/m");
  await page.getByLabel("Measured soil ECe", { exact: true }).fill("7");
  await step(page, "Compare");
  const baseline = page.getByTestId("strategy-baseline");
  await baseline
    .getByText("FAO references & unverified inputs", { exact: true })
    .click();
  await expect(
    baseline.getByRole("link", { name: "FAO-56 Kc", exact: true }),
  ).toBeVisible();
  await expect(baseline).toContainText("FAO ECe: 6 dS/m");
  await baseline
    .getByText("Verify locally before planting", { exact: true })
    .click();
  await expect(baseline).toContainText(
    "measured soil ECe 7 dS/m exceeds the FAO reference",
  );
  await step(page, "Farm");
  await expect(
    page.getByLabel("Measured soil ECe", { exact: true }),
  ).toHaveValue("7");
  await page.getByLabel("Measured soil ECe", { exact: true }).fill("");
  await expect(page.getByRole("alert")).toHaveCount(0);
});
