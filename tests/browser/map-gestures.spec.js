import { test, expect } from "@playwright/test";
test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });
test("pinch zoom in and out does not change the selected field", async ({
  page,
  context,
}) => {
  await page.route(/^https:\/\//, (r) => r.abort());
  await page.goto("/");
  await page.getByRole("button", { name: "English", exact: true }).click();
  const map = page.locator(".leaflet-container");
  await map.scrollIntoViewIfNeeded();
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
  const zoom = page.getByLabel("Map zoom", { exact: true });
  await expect(zoom).toHaveText("11×");
  await pinch(25, 90);
  await expect
    .poll(async () => parseInt(await zoom.innerText()))
    .toBeGreaterThan(11);
  const closer = parseInt(await zoom.innerText());
  await page.waitForTimeout(300);
  await pinch(90, 25);
  await expect
    .poll(async () => parseInt(await zoom.innerText()))
    .toBeLessThan(closer);
  await expect(page.getByTestId("quick-fayoum_etsa")).toHaveAttribute(
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
  const map = page.locator(".leaflet-container"),
    zoom = page.getByLabel("Map zoom", { exact: true });
  await map.hover();
  await page.mouse.wheel(0, -250);
  await expect
    .poll(async () => parseInt(await zoom.innerText()))
    .toBeGreaterThan(11);
  const before = parseInt(await zoom.innerText());
  await map.focus();
  await page.keyboard.press("-");
  await expect
    .poll(async () => parseInt(await zoom.innerText()))
    .toBeLessThan(before);
  await expect(page.getByTestId("quick-fayoum_etsa")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});
