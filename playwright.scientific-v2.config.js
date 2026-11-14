import { defineConfig } from "@playwright/test";
import base from "./playwright.config.js";
export default defineConfig({
  ...base,
  testDir: "./tests/browser-v2",
  use: { ...base.use, baseURL: "http://127.0.0.1:4174" },
  webServer: {
    command:
      "npm run build:scientific-v2 && npm run preview -- --outDir dist-v2 --port 4174",
    url: "http://127.0.0.1:4174",
    reuseExistingServer: false,
  },
});
