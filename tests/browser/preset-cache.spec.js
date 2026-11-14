import { test, expect } from "../helpers/plannerTest.js";
import presets from "../../src/data/demoPresets.json" with { type: "json" };
import synthetic from "../../src/data/syntheticFixtures.json" with { type: "json" };
import { sourcePayload } from "../helpers/sourcePayloads.js";

for (const id of ["fayoum_etsa", "west_delta_nubariya"])
  test(`${id} restores audited soil from a partial saved cache when live soil fails`, async ({
    page,
  }) => {
    const preset = presets[id];
    const data = structuredClone(synthetic[id]);
    data.sources = Object.fromEntries(
      ["climate", "soil", "ndvi"].map((key) => [
        key,
        {
          kind: key === "soil" ? "synthetic" : "observed",
          status: key === "soil" ? "demo" : "cached",
          retrievedAt: new Date().toISOString(),
          provider: "Partial HTTP test cache",
        },
      ]),
    );
    const key = `fieldshift-v2:${preset.lat.toFixed(4)},${preset.lon.toFixed(4)}`;
    await page.addInitScript(
      ({ key, data }) => {
        if (!localStorage.getItem(key))
          localStorage.setItem(
            key,
            JSON.stringify({ version: 2, savedAt: Date.now(), data }),
          );
      },
      { key, data },
    );
    const origin = new URL(test.info().project.use.baseURL).origin;
    await page.route(/^https:\/\//, (route) => {
      const url = route.request().url();
      if (new URL(url).origin === origin) return route.continue();
      return url.includes("power.larc")
        ? route.fulfill({ json: sourcePayload(url) })
        : route.abort();
    });
    await page.goto("/");
    await page.getByRole("button", { name: "English", exact: true }).click();
    if (id !== "fayoum_etsa") await page.getByTestId(`quick-${id}`).click();
    await expect(
      page.getByRole("button", { name: "Retry sources", exact: true }),
    ).toBeVisible({ timeout: 25000 });
    await expect(page.getByTestId("source-climate")).toContainText(
      "Retrieved source data",
    );
    await expect(page.getByTestId("source-soil")).toContainText(
      "Audited historical snapshot",
    );
    await expect(page.getByTestId("source-ndvi")).toContainText(
      "Cached source data",
    );
    await expect(page.getByTestId("source-soil")).not.toContainText(
      "Unavailable",
    );
    const stored = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)).data,
      key,
    );
    expect(stored.soil).toEqual(preset.soil);
    expect(stored.sources.soil.kind).toBe("observed");
    await page.reload();
    await page.getByRole("button", { name: "English", exact: true }).click();
    await page.getByTestId(`quick-${id}`).click();
    await expect(
      page.getByRole("button", { name: "Retry sources", exact: true }),
    ).toBeVisible({ timeout: 25000 });
    await expect(page.getByTestId("source-soil")).toContainText(
      "Cached source data",
    );
    await page.getByRole("button", { name: "العربية", exact: true }).click();
    await expect(page.getByTestId("source-soil")).not.toContainText("غير متاح");
  });
