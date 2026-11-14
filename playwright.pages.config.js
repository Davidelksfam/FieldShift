import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/hosting",
  use: {
    baseURL: "http://127.0.0.1:4197/FieldShift/",
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {},
  },
  webServer: {
    command: "npm run preview -- --port 4197 --strictPort --base /FieldShift/",
    url: "http://127.0.0.1:4197/FieldShift/",
    reuseExistingServer: false,
  },
});
