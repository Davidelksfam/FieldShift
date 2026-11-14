import { spawnSync } from "node:child_process";
const result = spawnSync(
  process.execPath,
  ["node_modules/vite/bin/vite.js", "build", "--outDir", "dist-v2"],
  { stdio: "inherit", env: { ...process.env, VITE_SCIENTIFIC_V2: "true" } },
);
process.exit(result.status ?? 1);
