import { test, expect } from "@playwright/test";
test("Pages manifest, branded icons and installation assets remain available offline", async ({
  page,
  context,
}) => {
  await page.addInitScript(() =>
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      e.stopImmediatePropagation();
    }),
  );
  await page.route(/^https:\/\//, (r) => r.abort());
  await page.goto("./");
  await page.getByRole("button", { name: "English", exact: true }).click();
  const manifest = await page.evaluate(async () => {
    const url = document.querySelector('link[rel="manifest"]').href;
    return { url, data: await (await fetch(url)).json() };
  });
  expect(new URL(manifest.data.start_url, manifest.url).pathname).toBe(
    "/FieldShift/",
  );
  expect(new URL(manifest.data.scope, manifest.url).pathname).toBe(
    "/FieldShift/",
  );
  expect(manifest.data.display).toBe("standalone");
  const icons = await page.evaluate(
    async ({ url, data }) =>
      await Promise.all(
        data.icons.map(
          (icon) =>
            new Promise((resolve, reject) => {
              const image = new Image();
              image.onload = () =>
                resolve({
                  width: image.naturalWidth,
                  height: image.naturalHeight,
                  purpose: icon.purpose,
                });
              image.onerror = reject;
              image.src = new URL(icon.src, url).href;
            }),
        ),
      ),
    manifest,
  );
  expect(icons).toEqual([
    { width: 192, height: 192, purpose: "any" },
    { width: 512, height: 512, purpose: "any" },
    { width: 512, height: 512, purpose: "maskable" },
  ]);
  expect(
    await page.locator('link[rel="apple-touch-icon"]').getAttribute("href"),
  ).toBe("/FieldShift/pwa/apple-touch-icon.png");
  await page
    .getByRole("button", { name: "Install FieldShift", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "Android:" }),
  ).toContainText("iPhone/iPad:");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await context.setOffline(true);
  await page.reload();
  const cached = await page.evaluate(async () =>
    Promise.all(
      [
        "manifest.webmanifest",
        "pwa/icon-192.png",
        "pwa/icon-512.png",
        "pwa/maskable-512.png",
        "pwa/apple-touch-icon.png",
      ].map(async (path) => (await fetch(path)).status),
    ),
  );
  expect(cached).toEqual([200, 200, 200, 200, 200]);
});
test("install action uses browser prompt and installed state hides installation controls", async ({
  page,
}) => {
  await page.route(/^https:\/\//, (r) => r.abort());
  await page.goto("./");
  await page.getByRole("button", { name: "English", exact: true }).click();
  await page.evaluate(() => {
    const event = new Event("beforeinstallprompt", { cancelable: true });
    event.prompt = async () => {
      window.installPromptCalls = (window.installPromptCalls ?? 0) + 1;
    };
    event.userChoice = Promise.resolve({ outcome: "dismissed" });
    window.dispatchEvent(event);
  });
  await page
    .getByRole("button", { name: "Install FieldShift", exact: true })
    .click();
  expect(await page.evaluate(() => window.installPromptCalls)).toBe(1);
  await page.evaluate(() => window.dispatchEvent(new Event("appinstalled")));
  await expect(
    page.getByRole("button", { name: "Install FieldShift", exact: true }),
  ).toHaveCount(0);
});
test("standalone launch does not offer installation again", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "standalone", { value: true }),
  );
  await page.route(/^https:\/\//, (r) => r.abort());
  await page.goto("./");
  await expect(page.getByTestId("enter-project")).toBeVisible();
  await expect(page.locator(".install-app")).toHaveCount(0);
});
