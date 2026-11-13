const { chromium } = require("@playwright/test");
const fs = require("node:fs/promises");
const baseURL = process.env.BASE_URL || "http://localhost:3000";
(async () => {
  await fs.mkdir("test-results/prototype-qa", { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
      : {}),
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1100 },
    acceptDownloads: true,
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(baseURL);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: "test-results/prototype-qa/desktop-ar.png",
    fullPage: true,
  });
  if ((await page.locator("html").getAttribute("dir")) !== "rtl")
    throw Error("Arabic RTL not default");
  await page.getByRole("button", { name: "Switch to English" }).click();
  await page.getByLabel("Area · hectares").fill("2");
  await page.getByLabel("Available water · m³").fill("8000");
  await page
    .getByRole("button", { name: "Save in this browser", exact: true })
    .click();
  await page.reload();
  await page.getByRole("heading", { name: "My field." }).waitFor();
  if ((await page.getByLabel("Area · hectares").inputValue()) !== "2")
    throw Error("Save failed");
  await page.screenshot({
    path: "test-results/prototype-qa/desktop-en.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Compare plans", exact: true })
    .last()
    .click();
  await page
    .getByRole("heading", { name: "Three ways to rehearse the next cycle" })
    .waitFor();
  if (
    (await page
      .getByLabel("Your baseline winter crop", { exact: true })
      .locator("option")
      .count()) !== 4
  )
    throw Error("Winter crop choices");
  if (
    (await page
      .getByLabel("Your baseline summer crop", { exact: true })
      .locator("option")
      .count()) !== 4
  )
    throw Error("Summer crop choices");
  await page
    .getByLabel("Your baseline winter crop", { exact: true })
    .selectOption("barley");
  await page.screenshot({
    path: "test-results/prototype-qa/compare-en.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Test water scenario", exact: true })
    .click();
  await page.getByLabel("Exact reduction · %").fill("25");
  await page
    .getByText("Exceeds the demonstration budget", { exact: true })
    .waitFor();
  await page.screenshot({
    path: "test-results/prototype-qa/scenario-en.png",
    fullPage: true,
  });
  await page.getByLabel("Enable demonstration demand assumptions").uncheck();
  await page
    .getByText("Water comparison unavailable", { exact: true })
    .waitFor();
  const dl = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export rehearsal", exact: true })
    .click();
  const download = await dl;
  const path = await download.path();
  const payload = JSON.parse(await fs.readFile(path, "utf8"));
  if (
    payload.results[0].agronomy !== "unreviewed" ||
    payload.plans[0].winter !== "barley"
  )
    throw Error("Export provenance/state mismatch");
  await page
    .getByRole("button", { name: "Understand the evidence", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "The seven-source ledger" })
    .waitFor();
  if ((await page.locator(".source-row").count()) !== 7)
    throw Error("Missing evidence");
  const response = await page.request.get(
    baseURL +
      "/data/regions/20261113T123805653050Z/egypt-fayoum-power-30.75-29.55.csv",
  );
  if (!response.ok() || !(await response.text()).includes("2025-12-31"))
    throw Error("CSV inaccessible");
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const lang of ["en", "ar"]) {
      if ((await page.locator("html").getAttribute("lang")) !== lang)
        await page
          .getByRole("button", {
            name: lang === "en" ? "Switch to English" : "التبديل إلى العربية",
          })
          .click();
      for (let step = 0; step < 4; step++) {
        await page.locator(".nav-item").nth(step).click();
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth + 1,
        );
        if (overflow) throw Error(`Overflow ${width} ${lang} ${step}`);
        if (width === 390)
          await page.screenshot({
            path: `test-results/prototype-qa/mobile-${lang}-${step}.png`,
            fullPage: true,
          });
      }
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  if ((await page.locator("html").getAttribute("lang")) !== "en")
    await page.getByRole("button", { name: "Switch to English" }).click();
  await page.locator(".nav-item").nth(0).click();
  await page.getByLabel("Available water · m³").fill("");
  await page
    .getByRole("button", { name: "Compare plans", exact: true })
    .last()
    .click();
  await page
    .getByRole("button", { name: "Test water scenario", exact: true })
    .click();
  await page
    .getByText("Water comparison unavailable", { exact: true })
    .waitFor();
  if (errors.length) throw Error(errors.join("\n"));
  console.log(
    "PASS: all four screens, eight crop choices, save/reload, assumption toggle, unknown water, scenario, JSON export, source download, RTL/LTR at 390/768/1440, no page errors",
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
