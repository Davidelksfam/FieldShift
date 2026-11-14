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
test("all field factors are discoverable without disclosures and illustrated choices work with keyboard", async ({
  page,
}) => {
  await start(page);
  for (const label of [
    "Winter crop",
    "Summer crop",
    "Irrigation system",
    "Reported salinity",
    "Main goal",
  ]) {
    const group = page.getByRole("radiogroup", { name: label, exact: true });
    await expect(group).toBeVisible();
    expect(await group.evaluate((el) => el.closest("details"))).toBeNull();
  }
  await expect(
    page.getByRole("radiogroup", { name: "Canal position", exact: true }),
  ).toHaveCount(0);
  for (const label of [
    "Do you keep livestock? Include forage in scoring.",
    "Require Nili cover in alternatives",
    "Area in feddans",
    "Measured soil ECe",
  ])
    await expect(page.getByLabel(label, { exact: true })).toBeVisible();
  await expect(page.locator(".crop-question .crop-illustration")).toHaveCount(
    8,
  );
  await expect(page.locator(".crop-question select")).toHaveCount(0);
  expect(
    (await page.locator(".crop-question").allTextContents()).join(" "),
  ).not.toMatch(/🌾|🌽|☘|🫘|🌱|🌼/);
  await page.getByTestId("crop-choice-wheat").focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByTestId("crop-choice-berseem")).toBeChecked();
  await expect(page.getByTestId("farmer-strategy-baseline")).toContainText(
    "Egyptian Clover",
  );
  const landType = page.getByRole("combobox", {
    name: "Land type",
    exact: true,
  });
  await expect(landType).toBeVisible();
  await expect(landType).toHaveValue("");
  await landType.selectOption("new_sandy");
  await expect(landType).toHaveValue("new_sandy");
  await page.getByTestId("field-salinityLevel-high").locator("..").click();
  await page
    .getByLabel("Do you keep livestock? Include forage in scoring.", {
      exact: true,
    })
    .check();
  await page
    .getByLabel("Require Nili cover in alternatives", { exact: true })
    .check();
  await expect(
    page.getByTestId("farmer-strategy-water").locator(".numeric-crops"),
  ).toContainText("Cowpea");
  await page.getByLabel("Area in feddans", { exact: true }).fill("2");
  await expect(
    page.getByLabel("Estimate water for my whole field", { exact: true }),
  ).toHaveCount(0);
  await expect(page.getByTestId("farmer-total-baseline")).toBeVisible();
  await page.getByLabel("Measured soil ECe", { exact: true }).fill("12");
  await expect(
    page.getByTestId("farmer-strategy-baseline").locator(".farmer-cautions"),
  ).toContainText("measured soil ECe");
});
test("advanced analytics expands on the same page without replacing the form or remounting the map", async ({
  page,
}) => {
  await start(page);
  await page.evaluate(() => {
    window.originalMap = document.querySelector(".earth-render canvas");
  });
  await page.getByTestId("crop-choice-sesame").locator("..").click();
  await page
    .getByRole("button", { name: "Show advanced analytics", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Advanced analytics", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("radiogroup", { name: "Winter crop", exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("farmer-water-baseline")).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        window.originalMap === document.querySelector(".earth-render canvas"),
    ),
  ).toBe(true);
  await expect(page.getByTestId("crop-choice-sesame")).toBeChecked();
  await page.getByTestId("irrigation-choice-drip").locator("..").click();
  const farmerValue = await page
    .getByTestId("farmer-water-baseline")
    .innerText();
  await expect(page.getByTestId("water-baseline")).toContainText(farmerValue);
  await page
    .getByRole("button", { name: "Close analytics", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Advanced analytics", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByTestId("irrigation-choice-drip")).toBeChecked();
  await expect(page.getByTestId("crop-choice-sesame")).toBeChecked();
});
test("live plan summary follows priorities and hides unsupported alternatives", async ({
  page,
}) => {
  await start(page);
  const summary = page.getByRole("complementary", {
    name: "Live comparison summary",
    exact: true,
  });
  await expect(summary).toContainText("Faba Bean");
  await expect(summary).toContainText("Sesame");
  await page.getByTestId("goal-choice-soil").locator("..").click();
  await expect(summary).toContainText("Soybean");
  await page.getByRole("button", { name: "View plans", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "One field. Three strategies.",
      exact: true,
    }),
  ).toBeFocused();
  await page.getByText("Enter coordinates instead", { exact: true }).click();
  await page.getByLabel("Latitude", { exact: true }).fill("30.8");
  await page.getByLabel("Longitude", { exact: true }).fill("31.2");
  await page
    .getByRole("button", { name: "Use this location", exact: true })
    .click();
  await expect(summary).toContainText("Waiting for supported climate data");
  await expect(summary.locator(".crop-illustration")).toHaveCount(0);
});
