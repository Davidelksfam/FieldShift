import { test, expect } from "@playwright/test";
test("experimental inspection is explicit, bilingual and cannot change legacy comparison or source fallback", async ({
  page,
}) => {
  await page.route(/^https:\/\//, (route) => route.abort());
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "V2 العلمي · فحص تجريبي", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByTestId("farmer-water-baseline")).toHaveText("١٠٬٨١٣");
  await page.getByRole("button", { name: "English", exact: true }).click();
  await page.getByRole("button", { name: "Expert mode", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "Scientific V2 · experimental inspection",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByLabel("Inspection engine", { exact: true })
    .selectOption("scientific-v2");
  const output = page.getByLabel("Scientific V2 JSON output", { exact: true });
  const analysis = JSON.parse(await output.innerText());
  expect(analysis.recommendation.status).toBe("no_supported_recommendation");
  expect(analysis.recommendation.selectedId).toBeNull();
  expect(analysis.alternatives).toHaveLength(3);
  expect(
    analysis.alternatives.every(
      (a) => a.feasibility.status === "unknown" && a.water.etcMm.value === null,
    ),
  ).toBe(true);
  await expect(page.getByTestId("water-baseline")).toContainText("10,813");
  await page
    .getByLabel("Inspection engine", { exact: true })
    .selectOption("legacy");
  await expect(output).toHaveCount(0);
  await page.getByRole("button", { name: "العربية", exact: true }).click();
  await page
    .getByLabel("محرك الفحص", { exact: true })
    .selectOption("scientific-v2");
  await expect(
    page.getByLabel("مخرجات V2 العلمية JSON", { exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 900 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "وضع المزارع", exact: true }).click();
  await expect(page.getByTestId("farmer-water-baseline")).toHaveText("١٠٬٨١٣");
});
