import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { offlineShell } from "./scripts/offline-plugin.js";
export default defineConfig({
  base: process.env.VITE_BASE_PATH || "/",
  plugins: [react(), tailwindcss(), offlineShell()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          benchmarks: ["./src/data/demoPresets.json"],
          weather: ["./src/data/referenceEtDrivers.json"],
          charts: ["recharts"],
          map: ["leaflet", "react-leaflet"],
        },
      },
    },
  },
});
