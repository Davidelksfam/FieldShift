import { test, expect } from "@playwright/test";
test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });
test("pinch zoom in and out does not change the selected field", async ({
  page,
  context,
}) => {
  await page.route(/^https:\/\//, (r) => r.abort());
  await page.goto("/");
  await page.getByRole("button", { name: "English", exact: true }).click();
  const map = page.locator(".earth-render canvas");
  await map.scrollIntoViewIfNeeded();
  await map.evaluate((el) => el.scrollIntoView({ block: "center" }));
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(0);
  const box = await map.boundingBox(),
    x = box.x + box.width / 2,
    y = box.y + box.height / 2;
  const cdp = await context.newCDPSession(page);
  async function pinch(from, to) {
    const points = (d) => [
      { x: x - d, y, id: 0 },
      { x: x + d, y, id: 1 },
    ];
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: points(from),
    });
    for (let i = 1; i <= 8; i++) {
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: points(from + ((to - from) * i) / 8),
      });
      await page.waitForTimeout(20);
    }
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
  }
  const zoom = page.locator(".earth-stage");
  await expect(zoom).toHaveAttribute("data-camera-distance", "1.350");

  await pinch(25, 90);
  await expect
    .poll(async () => Number(await zoom.getAttribute("data-camera-distance")))
    .toBeLessThan(1.35);
  const closer = Number(await zoom.getAttribute("data-camera-distance"));
  await page.waitForTimeout(300);
  await pinch(90, 25);
  await expect
    .poll(async () => Number(await zoom.getAttribute("data-camera-distance")))
    .toBeGreaterThan(closer);
  await expect(page.getByTestId("quick-fayoum_etsa")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(await page.evaluate(() => visualViewport.scale)).toBe(1);
  await page.getByTestId("landmark-west_delta_nubariya").tap();
  await expect(page.getByTestId("quick-west_delta_nubariya")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});
test("wheel zoom and keyboard zoom leave the field selection unchanged", async ({
  page,
}) => {
  await page.route(/^https:\/\//, (r) => r.abort());
  await page.goto("/");
  await page.getByRole("button", { name: "English", exact: true }).click();
  const map = page.locator(".earth-render canvas"),
    zoom = page.locator(".earth-stage");
  await expect(zoom).toHaveAttribute("data-camera-distance", "1.350");
  await map.hover();
  await page.mouse.wheel(0, -250);
  await expect
    .poll(async () => Number(await zoom.getAttribute("data-camera-distance")))
    .toBeLessThan(1.35);
  const before = Number(await zoom.getAttribute("data-camera-distance"));
  await map.focus();
  await page.keyboard.press("-");
  await expect
    .poll(async () => Number(await zoom.getAttribute("data-camera-distance")))
    .toBeGreaterThan(before);
  await expect(page.getByTestId("quick-fayoum_etsa")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});
