import { mkdir, writeFile } from "node:fs/promises";
import { chromium, expect } from "@playwright/test";
await mkdir("test-results/live", { recursive: true });
const baseURL =
  process.env.DEMO_BASE_URL || "https://fieldshift-tau.vercel.app";
const browser = await chromium.launch(
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
    : {},
);
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  const errors = [];
  const failures = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("requestfailed", (r) =>
    failures.push({
      host: new URL(r.url()).hostname,
      error: r.failure().errorText,
    }),
  );
  const response = await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "English", exact: true }).click();
  await page.getByRole("button", { name: "Expert mode", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Retry sources", exact: true }),
  ).toBeVisible({ timeout: 15000 });
  const status = await page.locator(".source-status-panel").innerText();
  const diagnostics = await page.locator(".diagnostics-grid").innerText();
  await page.getByLabel("Explore a conditional Nili cover").check();
  const explorer = page.getByRole("region", {
    name: "Post-processing pipeline explorer",
  });
  await explorer
    .getByRole("button", { name: "5 · Farmer output", exact: true })
    .click();
  const result = JSON.parse(
    await explorer.getByLabel("Stage JSON output").innerText(),
  );
  if (result.hypotheticalSummerSwitch.modeledSavingsM3Feddan !== 1970)
    throw new Error("Counterfactual does not match the tested model");
  await page.getByLabel("Satellite layer").selectOption("ndvi");
  try {
    await page
      .locator('img.leaflet-tile-loaded[src*="gibs.earthdata"]')
      .first()
      .waitFor({ timeout: 12000 });
  } catch {}
  const tiles = {
    esri: await page
      .locator('img.leaflet-tile-loaded[src*="arcgisonline"]')
      .count(),
    gibs: await page
      .locator('img.leaflet-tile-loaded[src*="gibs.earthdata"]')
      .count(),
  };
  await page.screenshot({
    path: "test-results/live/demo-en.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 900 });
  await page.getByRole("button", { name: "العربية", exact: true }).click();
  if (
    await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
  )
    throw new Error("Mobile overflow");
  await page.screenshot({
    path: "test-results/live/demo-ar.png",
    fullPage: true,
  });
  const report = {
    baseURL,
    checkedAt: new Date().toISOString(),
    http: response.status(),
    status,
    diagnostics,
    sources: result.sources,
    counterfactual: result.hypotheticalSummerSwitch,
    tiles,
    errors,
    failures,
  };
  await writeFile(
    "test-results/live/report.json",
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
  if (errors.length) throw new Error("Uncaught browser errors");
} finally {
  await browser.close();
}
