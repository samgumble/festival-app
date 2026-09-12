import { defineConfig } from "@playwright/test";

// Accessibility gate (docs/COMPLIANCE.md §5): `npm run e2e:a11y`. Runs against the dev server with
// bundled content; axe-core is fetched from cdnjs, so this needs network and stays out of the Pages workflow.
export default defineConfig({
  testDir: "./e2e",
  testMatch: /a11y\.spec\.ts/,
  timeout: 90_000,
  workers: 1,
  reporter: "list",
  use: { baseURL: "http://localhost:5173", viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, browserName: "chromium" },
  webServer: { command: "npm run dev", url: "http://localhost:5173", reuseExistingServer: true, timeout: 60_000, env: { ...process.env, VITE_DATA_SOURCE: "bundled" } },
});
