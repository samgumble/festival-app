import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testIgnore: [/offline\.spec\.ts/, /store-shots\.spec\.ts/, /a11y\.spec\.ts/],
  timeout: 90_000,
  workers: 1,
  reporter: "list",
  use: { baseURL: "http://localhost:5173", viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, browserName: "chromium" },
  webServer: { command: "npm run dev", url: "http://localhost:5173", reuseExistingServer: true, timeout: 60_000, env: { ...process.env, VITE_DATA_SOURCE: "bundled" } },
});
