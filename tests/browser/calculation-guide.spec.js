import { test, expect } from "@playwright/test";
async function start(page) {
  const origin = new URL(test.info().project.use.baseURL).origin;
  await page.route(/^https:\/\//, (r) =>
    new URL(r.request().url()).origin === origin ? r.continue() : r.abort(),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "English", exact: true }).click();
}
async function open(page) {
  await page
    .getByRole("button", { name: "Understand my results", exact: true })
    .click();
  return page.getByRole("dialog", {
    name: "Your calculation guide",
    exact: true,
  });
}
async function close(page) {
  await page
    .getByRole("button", { name: "Close calculation guide", exact: true })
    .click();
}

test("guided answers follow current priorities and area; drip what-if preserves inputs and makes no source requests", async ({
  page,
}) => {
  await start(page);
  const providerRequests = [];
  page.on("request", (r) => {
    if (/power.larc|pixelgust|isric.org|modis.ornl/.test(r.url()))
      providerRequests.push(r.url());
  });
  await page
    .getByRole("button", { name: "Retry sources", exact: true })
    .waitFor();
  const before = providerRequests.length;
  const dialog = await open(page);
  await expect(
    dialog
      .getByRole("group", { name: "Questions about your results" })
      .getByRole("button"),
  ).toHaveCount(8);
  await expect(dialog.getByRole("region")).toContainText("Sesame");
  await dialog
    .getByRole("button", { name: "How much water could I save?", exact: true })
    .click();
  await expect(dialog.getByTestId("guide-fact-water-difference")).toContainText(
    "5,815",
  );
  await dialog
    .getByRole("button", {
      name: "What if I switch to drip irrigation?",
      exact: true,
    })
    .click();
  await expect(dialog.getByTestId("guide-fact-drip-scenario")).toContainText(
    "6,758",
  );
  await expect(dialog.getByTestId("guide-fact-drip-difference")).toContainText(
    "4,055",
  );
  await close(page);
  await expect(page.getByTestId("irrigation-choice-flood")).toBeChecked();
  await expect(page.getByTestId("farmer-water-baseline")).toHaveText("10,813");
  await page.getByLabel("Area in feddans", { exact: true }).fill("2");
  await page.getByTestId("goal-choice-soil").locator("..").click();
  await open(page);
  await dialog
    .getByRole("button", {
      name: "Why is this strategy recommended?",
      exact: true,
    })
    .click();
  await expect(dialog.getByRole("region")).toContainText("Soybean");
  await dialog
    .getByRole("button", { name: "What about my whole field?", exact: true })
    .click();
  await expect(dialog.getByTestId("guide-fact-field-current")).toHaveText(
    "21,626",
  );
  await close(page);
  await page.getByLabel("Area in feddans", { exact: true }).fill("");
  await open(page);
  await expect(dialog.getByRole("region")).toContainText(
    "Enter a valid positive area",
  );
  await expect(dialog.getByTestId("guide-fact-field-current")).toHaveCount(0);
  expect(providerRequests).toHaveLength(before);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "Understand my results", exact: true }),
  ).toBeFocused();
});
test("guide respects missing-climate gating and invalid ECe while source information remains accessible", async ({
  page,
}) => {
  await start(page);
  await page.getByText("Enter coordinates instead", { exact: true }).click();
  await page.getByLabel("Latitude", { exact: true }).fill("30.8");
  await page.getByLabel("Longitude", { exact: true }).fill("31.2");
  await page
    .getByRole("button", { name: "Use this location", exact: true })
    .click();
  const dialog = await open(page);
  await expect(dialog.getByRole("region")).toContainText(
    "strategy numbers are hidden",
  );
  await dialog
    .getByRole("button", {
      name: "What if I switch to drip irrigation?",
      exact: true,
    })
    .click();
  await expect(dialog.getByTestId("guide-fact-drip-scenario")).toHaveCount(0);
  await dialog
    .getByRole("button", {
      name: "Where do these numbers come from?",
      exact: true,
    })
    .click();
  await expect(dialog.getByTestId("guide-fact-climate")).toBeVisible();
  await close(page);
  await page.getByLabel("Measured soil ECe", { exact: true }).fill("101");
  await open(page);
  await dialog
    .getByRole("button", {
      name: "Why is this strategy recommended?",
      exact: true,
    })
    .click();
  await expect(dialog.getByRole("region")).toContainText(
    "Check the measured soil ECe input",
  );
  await expect(dialog.getByTestId("guide-fact-score-water")).toHaveCount(0);
});
test("Arabic mobile guide fits the screen, closes accessibly and supports offline calculation help", async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await start(page);
  await page.getByRole("button", { name: "العربية", exact: true }).click();
  await page.getByRole("button", { name: "افهم نتائجي", exact: true }).click();
  const dialog = page.getByRole("dialog", {
    name: "دليلك لفهم الحسابات",
    exact: true,
  });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "اقفل دليل الحسابات", exact: true }),
  ).toBeFocused();
  const fits = await dialog.evaluate((el) => ({
    width: el.getBoundingClientRect().width,
    viewport: innerWidth,
    scroll: el.scrollWidth,
    client: el.clientWidth,
  }));
  expect(fits.width).toBeLessThanOrEqual(fits.viewport);
  expect(fits.scroll).toBeLessThanOrEqual(fits.client + 1);
  await context.setOffline(true);
  await dialog
    .getByRole("button", { name: "ممكن أوفّر مياه قد إيه؟", exact: true })
    .click();
  await expect(dialog.getByTestId("guide-fact-water-difference")).toContainText(
    "٥٬٨١٥",
  );
  await dialog.getByRole("button", { name: "اعرض خططي", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "أرض واحدة. ٣ استراتيجيات.",
      exact: true,
    }),
  ).toBeFocused();
});
