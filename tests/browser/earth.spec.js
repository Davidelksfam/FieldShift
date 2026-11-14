import { test, expect } from "@playwright/test";
const start = async (page) => {
  await page.route(/^https:\/\//, (r) => r.abort());
  await page.goto("/");
  await page.getByRole("button", { name: "English", exact: true }).click();
};
test("Earth renders locally, zooms and keeps quick locations keyboard accessible", async ({
  page,
}) => {
  await start(page);
  await expect(page.locator(".earth-render canvas")).toBeVisible();
  for (const name of [
    "Zoom Earth in",
    "Zoom Earth out",
    "Focus selected region",
  ])
    await page.getByRole("button", { name, exact: true }).click();
  const globe = page.locator(".earth-render canvas");
  const bounds = await globe.boundingBox();
  await globe.click({
    position: { x: bounds.width / 2 + 8, y: bounds.height / 2 },
  });
  await expect(page.getByLabel("Saved locations", { exact: true })).toHaveValue(
    "",
  );
  await page.getByTestId("quick-west_delta_nubariya").focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("quick-west_delta_nubariya")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByLabel("Winter crop", { exact: true })).toHaveValue(
    "wheat",
  );
  await page.getByRole("button", { name: "Field map", exact: true }).click();
  await expect(page.locator(".leaflet-container")).toBeVisible();
});
test("geolocation is opt-in and updates the selected coordinates after permission", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ latitude: 30.8, longitude: 31.2 });
  await start(page);
  await expect(page.getByTestId("quick-fayoum_etsa")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page
    .getByRole("button", { name: "Use my location", exact: true })
    .click();
  await expect(page.getByLabel("Saved locations", { exact: true })).toHaveValue(
    "",
  );
  await page.getByText("Enter coordinates instead", { exact: true }).click();
  await expect(page.getByLabel("Latitude", { exact: true })).toHaveValue(
    "30.8000",
  );
  await expect(page.getByLabel("Longitude", { exact: true })).toHaveValue(
    "31.2000",
  );
});
test("denied and out-of-region geolocation preserve the current field", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.geoCalls = 0;
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition(ok, fail) {
          window.geoCalls++;
          fail({ code: 1 });
        },
      },
    });
  });
  await start(page);
  expect(await page.evaluate(() => window.geoCalls)).toBe(0);
  await page
    .getByRole("button", { name: "Use my location", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("permission denied");
  await expect(page.getByTestId("quick-fayoum_etsa")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.evaluate(() =>
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition(ok) {
          ok({ coords: { latitude: 0, longitude: 0 } });
        },
      },
    }),
  );
  await page
    .getByRole("button", { name: "Use my location", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("within Egypt");
  await expect(page.getByTestId("quick-fayoum_etsa")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});
test("WebGL unavailable keeps the map and quick locations usable", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const get = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return type.startsWith("webgl") ? null : get.call(this, type, ...args);
    };
  });
  await start(page);
  await expect(
    page.getByText("3D is unavailable on this device.", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Open field map", exact: true })
    .click();
  await expect(page.locator(".leaflet-container")).toBeVisible();
  await page.getByTestId("quick-delta_kafr_el_sheikh").click();
  await expect(page.getByTestId("quick-delta_kafr_el_sheikh")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("late GPS cannot replace a newer quick-location choice", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "geolocation", {
      value: {
        getCurrentPosition(ok) {
          window.delayedGps = ok;
        },
      },
    }),
  );
  await start(page);
  await page
    .getByRole("button", { name: "Use my location", exact: true })
    .click();
  await page.getByTestId("quick-west_delta_nubariya").click();
  await page.evaluate(() =>
    window.delayedGps({ coords: { latitude: 30.8, longitude: 31.2 } }),
  );
  await expect(page.getByTestId("quick-west_delta_nubariya")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(
    page.getByRole("button", { name: "Use my location", exact: true }),
  ).toBeEnabled();
});
