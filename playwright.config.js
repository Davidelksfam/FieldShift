import { defineConfig } from "@playwright/test";
const remoteBaseUrl = process.env.DEMO_BASE_URL;
export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: false,
  use: {
    baseURL: remoteBaseUrl || "http://127.0.0.1:4173",
    headless: true,
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  },
  webServer: remoteBaseUrl
    ? undefined
    : {
        command: "npm run preview -- --port 4173",
        url: "http://127.0.0.1:4173",
        reuseExistingServer: !process.env.CI,
      },
  reporter: [["list"]],
});
