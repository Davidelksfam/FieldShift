import { test, expect } from "../helpers/plannerTest.js";
async function start(page) {
  const appOrigin = new URL(test.info().project.use.baseURL).origin;
  await page.route(/^https:\/\//, (route) =>
    new URL(route.request().url()).origin === appOrigin
      ? route.continue()
      : route.abort(),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "English", exact: true }).click();
}
test("unified workspace retains 44px touch targets including mobile comparison and 3D navigation", async ({
  page,
}) => {
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await start(page);
    await page.getByText("Enter coordinates instead", { exact: true }).click();
    await expect(page.locator(".earth-tools button").first()).toBeVisible();
    for (const locator of [
      page.getByRole("button", { name: "View plans", exact: true }),
      page.locator(".earth-tools button").first(),
      page.getByRole("button", { name: "Use this location", exact: true }),
      page.getByLabel("Latitude", { exact: true }),
      page.getByLabel("Longitude", { exact: true }),
    ]) {
      const box = await locator.boundingBox();
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.width).toBeGreaterThanOrEqual(44);
    }
    await page.getByRole("button", { name: "العربية", exact: true }).click();
    for (const locator of [
      page.getByRole("button", { name: "شوف الخطط", exact: true }),
      page.locator(".earth-tools button").first(),
      page.getByRole("button", { name: "استخدم الموقع ده", exact: true }),
    ])
      expect((await locator.boundingBox()).height).toBeGreaterThanOrEqual(44);
  }
});
test("200 percent reflow equivalents preserve both languages and analytics without page overflow", async ({
  page,
}) => {
  // Halved CSS widths model 200% desktop reflow; this is not browser-chrome zoom automation.
  for (const width of [195, 384, 720]) {
    await page.setViewportSize({ width, height: 900 });
    await start(page);
    for (const lang of ["en", "ar"]) {
      if (lang === "ar")
        await page
          .getByRole("button", { name: "العربية", exact: true })
          .click();
      await page
        .getByRole("button", {
          name:
            lang === "en"
              ? "Show advanced analytics"
              : "عرض التحليلات المتقدمة",
          exact: true,
        })
        .click();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${lang} at ${width}px`,
      ).toBe(true);
      await expect(
        page.getByRole("radiogroup", {
          name: lang === "en" ? "Winter crop" : "المحصول الشتوي",
          exact: true,
        }),
      ).toBeVisible();
      await page
        .getByRole("button", {
          name: lang === "en" ? "Close analytics" : "إغلاق التحليلات",
          exact: true,
        })
        .click();
    }
  }
});
