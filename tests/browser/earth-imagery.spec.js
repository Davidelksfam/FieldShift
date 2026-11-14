import { test, expect } from "../helpers/plannerTest.js";
import { sourcePayload } from "../helpers/sourcePayloads.js";
import { readFileSync } from "node:fs";
const tile = readFileSync(
  new URL("../fixtures/imagery/synthetic-tile.png", import.meta.url),
);
async function start(page, fail = false) {
  const tiles = [],
    data = [];
  const appOrigin = new URL(test.info().project.use.baseURL).origin;
  await page.route(/^https:\/\//, async (route) => {
    const url = route.request().url();
    if (new URL(url).origin === appOrigin) return route.continue();
    if (url.includes("/World_Imagery/MapServer/tile/")) {
      tiles.push(url);
      return fail
        ? route.fulfill({ status: 503, body: "Imagery unavailable" })
        : route.fulfill({ contentType: "image/png", body: tile });
    }
    const payload = sourcePayload(url);
    if (payload) {
      data.push(url);
      return route.fulfill({ json: payload });
    }
    return route.abort();
  });
  await page.goto("/");
  await page.getByRole("button", { name: "English", exact: true }).click();
  await expect(page.locator(".earth-stage")).toHaveAttribute(
    "data-camera-distance",
    "1.3500",
  );
  return { tiles, data };
}
test("satellite detail refines on the 3D sphere and every region selection zooms in automatically", async ({
  page,
}) => {
  const { tiles, data } = await start(page);
  const stage = page.locator(".earth-stage");
  await expect(stage).toHaveAttribute("data-imagery-state", "ready", {
    timeout: 15000,
  });
  const initialLevel = Number(await stage.getAttribute("data-imagery-level"));
  await page.getByTestId("landmark-west_delta_nubariya").click();
  await expect(stage).toHaveAttribute("data-camera-distance", "1.0060");
  await expect(page.getByTestId("quick-west_delta_nubariya")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(stage).toHaveAttribute("data-imagery-state", "ready", {
    timeout: 15000,
  });
  const regionalLevel = Number(await stage.getAttribute("data-imagery-level"));
  expect(regionalLevel).toBeGreaterThan(initialLevel + 3);
  await expect(
    page.getByRole("button", { name: "Retry sources", exact: true }),
  ).toBeVisible({ timeout: 25000 });
  const count = data.length;
  // Scroll farther in without changing the data-analysis point.
  await page.locator(".earth-render canvas").hover();
  await page.mouse.wheel(0, -900);
  await expect
    .poll(async () => Number(await stage.getAttribute("data-camera-distance")))
    .toBeLessThan(1.006);
  await expect(stage).toHaveAttribute("data-imagery-state", "ready", {
    timeout: 15000,
  });
  expect(
    Number(await stage.getAttribute("data-imagery-level")),
  ).toBeGreaterThan(regionalLevel);
  expect(
    tiles.some((url) => Number(url.split("/").at(-3)) > regionalLevel),
  ).toBe(true);
  expect(data).toHaveLength(count);
  await expect(page.locator(".leaflet-container")).toHaveCount(0);
  await page.getByRole("button", { name: "View Egypt", exact: true }).click();
  await expect(stage).toHaveAttribute("data-camera-distance", "1.3500");
  await page.getByTestId("quick-delta_kafr_el_sheikh").click();
  await expect(stage).toHaveAttribute("data-camera-distance", "1.0060");
  await expect(page.locator(".earth-caption")).toContainText("31.1107");
});
test("a point click also zooms in and imagery failure leaves location and farmer data usable", async ({
  page,
}) => {
  await start(page, true);
  const stage = page.locator(".earth-stage");
  await expect(stage).toHaveAttribute("data-imagery-state", "unavailable", {
    timeout: 15000,
  });
  const box = await page.locator(".earth-render canvas").boundingBox();
  await page.mouse.click(box.x + box.width / 2 + 8, box.y + box.height / 2);
  await expect(stage).toHaveAttribute("data-camera-distance", "1.0060");
  await expect(page.getByLabel("Saved locations", { exact: true })).toHaveValue(
    "",
  );
  await expect(page.getByTestId("source-climate")).toContainText(
    "Retrieved source data",
    { timeout: 25000 },
  );
  await expect(page.getByTestId("farmer-water-baseline")).toHaveText("10,813");
  await expect(page.locator(".earth-fallback")).toHaveCount(0);
  await expect(page.locator(".earth-imagery-status")).toContainText(
    "unavailable",
  );
});
