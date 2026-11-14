import { test, expect } from "../helpers/plannerTest.js";
import { sourcePayload } from "../helpers/sourcePayloads.js";
test("custom-point MODIS retries only the missing quality batch and keeps source provenance", async ({
  page,
}) => {
  const calls = new Map();
  let fail = true;
  const origin = new URL(test.info().project.use.baseURL).origin;
  await page.route(/^https:\/\//, async (route) => {
    const url = route.request().url();
    if (new URL(url).origin === origin) return route.continue();
    if (!url.includes("latitude=30.8123") && !url.includes("lat=30.8123"))
      return route.abort();
    if (url.includes("modis.ornl")) {
      calls.set(url, (calls.get(url) || 0) + 1);
      if (fail && url.includes("pixel_reliability&startDate=A2025321"))
        return route.fulfill({ status: 400, body: "Unavailable" });
      await new Promise((r) => setTimeout(r, 1500));
    }
    const payload = sourcePayload(url);
    return payload ? route.fulfill({ json: payload }) : route.abort();
  });
  await page.goto("/");
  await page.getByRole("button", { name: "English", exact: true }).click();
  await page.getByText("Enter coordinates instead", { exact: true }).click();
  await page.getByLabel("Latitude", { exact: true }).fill("30.8123");
  await page.getByLabel("Longitude", { exact: true }).fill("31.2123");
  await page
    .getByRole("button", { name: "Use this location", exact: true })
    .click();
  await expect(page.getByTestId("source-ndvi")).toContainText(
    "can take about a minute",
  );
  await expect(
    page.getByRole("button", { name: "Retry sources", exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("source-ndvi")).toContainText("Unavailable");
  expect(calls.size).toBe(10);
  fail = false;
  await page
    .getByRole("button", { name: "Retry sources", exact: true })
    .click();
  await expect(page.getByTestId("source-ndvi")).toContainText(
    "Retrieved source data",
  );
  for (const [url, count] of calls)
    expect(count).toBe(
      url.includes("pixel_reliability&startDate=A2025321") ? 2 : 1,
    );
});
