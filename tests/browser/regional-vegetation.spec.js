import { test, expect } from "@playwright/test";
import { sourcePayload } from "../helpers/sourcePayloads.js";
test("default presentation uses immediate regional vegetation across Fayoum and Delta with no MODIS requests", async ({
  page,
  context,
}) => {
  await context.addInitScript(() =>
    sessionStorage.setItem("fieldshift-entered", "1"),
  );
  const origin = new URL(test.info().project.use.baseURL).origin;
  const modis = [];
  await page.route(/^https:\/\//, (r) => {
    const u = r.request().url();
    if (new URL(u).origin === origin) return r.continue();
    if (u.includes("modis.ornl")) {
      modis.push(u);
      return r.abort();
    }
    const p = sourcePayload(u);
    return p ? r.fulfill({ json: p }) : r.abort();
  });
  await page.goto("/");
  await page.getByRole("button", { name: "English", exact: true }).click();
  await expect(page.getByTestId("source-ndvi")).toContainText(
    "Audited historical snapshot",
  );
  await page.getByText("Enter coordinates instead", { exact: true }).click();
  for (const [lat, lon, id] of [
    ["29.25", "30.75", "fayoum_etsa"],
    ["30.8", "31.2", "delta_kafr_el_sheikh"],
  ]) {
    await page.getByLabel("Latitude", { exact: true }).fill(lat);
    await page.getByLabel("Longitude", { exact: true }).fill(lon);
    await page
      .getByRole("button", { name: "Use this location", exact: true })
      .click();
    await expect(page.getByTestId("source-ndvi")).toContainText(
      "Regional reference",
    );
    await expect(page.getByTestId("source-ndvi")).not.toContainText(
      "Unavailable",
    );
    const ref = await page.evaluate(
      ({ lat, lon }) =>
        JSON.parse(
          localStorage.getItem(
            `fieldshift-v2:${Number(lat).toFixed(4)},${Number(lon).toFixed(4)}`,
          ),
        )?.data.sources.ndvi.referenceLocation.presetId,
      { lat, lon },
    );
    expect(ref).toBe(id);
  }
  expect(modis).toHaveLength(0);
});
