import { defineConfig } from "@playwright/test";

// Runs against a real production build served by `vite preview` (base "/"), so the
// service worker registers. Build first: `npm run e2e:offline` does both.
export default defineConfig({
  testDir: "./e2e",
  testMatch: /offline\.spec\.ts/,
  timeout: 120_000,
  workers: 1,
  reporter: "list",
  use: { baseURL: "http://localhost:4173", viewport: { width: 390, height: 844 }, browserName: "chromium" },
  webServer: { command: "npx vite preview --port 4173 --strictPort", url: "http://localhost:4173", reuseExistingServer: false, timeout: 60_000 },
});
