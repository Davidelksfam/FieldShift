import { test, expect } from "@playwright/test";

test("repository subpath loads the globe, current inputs and scoped offline shell", async ({
  page,
  context,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  // Simulate another application sharing this github.io origin before activation.
  await context.addInitScript(async () => {
    const cache = await caches.open("fieldshift-shell-unrelated-app");
    await cache.put(
      "/FieldShift/index.html",
      new Response("<h1>Unrelated cached page</h1>", {
        headers: { "Content-Type": "text/html" },
      }),
    );
  });
  await page.route(/^https:\/\//, (route) => route.abort());
  await page.goto("./");
  await page.getByRole("button", { name: "English", exact: true }).click();
  const stage = page.locator(".earth-stage");
  await expect(stage).toHaveAttribute("data-camera-distance", "1.3500");
  const logo = page.locator(".brand img");
  expect(await logo.getAttribute("src")).toMatch(
    /^\/FieldShift\/assets\/site-logo-/,
  );
  await expect
    .poll(() => logo.evaluate((img) => img.naturalWidth))
    .toBeGreaterThan(0);
  await expect(
    page.getByRole("radiogroup", { name: "Canal position", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("combobox", { name: "Land type", exact: true }),
  ).toHaveValue("");
  await page.getByLabel("Area in feddans", { exact: true }).fill("2");
  await expect(page.getByTestId("farmer-total-baseline")).toBeVisible();
  await page.getByTestId("landmark-west_delta_nubariya").click();
  await expect(stage).toHaveAttribute("data-camera-distance", "1.0060");
  await expect(page.locator(".earth-caption")).toContainText("30.6650");
  const scope = await page.evaluate(
    async () => (await navigator.serviceWorker.ready).scope,
  );
  expect(new URL(scope).pathname).toBe("/FieldShift/");
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await context.setOffline(true);
  await page.reload();
  await page.getByRole("button", { name: "English", exact: true }).click();
  await expect(page.getByTestId("farmer-water-baseline")).toHaveText("10,813");
  await expect(stage).toHaveAttribute("data-camera-distance", "1.3500");
  await page
    .getByRole("button", { name: "Understand my results", exact: true })
    .click();
  const guide = page.getByRole("dialog", {
    name: "Your calculation guide",
    exact: true,
  });
  await guide
    .getByRole("button", {
      name: "What if I switch to drip irrigation?",
      exact: true,
    })
    .click();
  await expect(guide.getByTestId("guide-fact-drip-scenario")).toContainText(
    "6,758",
  );
  await page.keyboard.press("Escape");
  await expect(guide).not.toBeVisible();
  expect(
    await page.evaluate(() => caches.has("fieldshift-shell-unrelated-app")),
  ).toBe(true);
  expect(errors).toEqual([]);
});
