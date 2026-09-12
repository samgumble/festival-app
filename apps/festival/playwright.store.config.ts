import { defineConfig } from "@playwright/test";

// Generates the store-ready, captioned, device-pixel-exact screenshots described in
// docs/store/screenshots.md — separate from playwright.config.ts (`npm run screenshots`,
// review/design-pass captures) and playwright.offline.config.ts (production-build offline
// check) so neither of those runs is touched by this one. Run with `npm run store:shots`.
//
// Each project's viewport x deviceScaleFactor equals the exact required output pixel size,
// so a raw `page.screenshot()` in that project already is the store dimension (no upscale/
// crop): iPhone 6.9" -> 1320x2868, Android phone -> 1080x2340.
export default defineConfig({
  testDir: "./e2e",
  testMatch: /store-shots\.spec\.ts/,
  timeout: 120_000,
  workers: 1,
  reporter: "list",
  use: { baseURL: "http://localhost:5173", browserName: "chromium" },
  projects: [
    { name: "ios-6.9", use: { viewport: { width: 440, height: 956 }, deviceScaleFactor: 3 } },
    { name: "android-phone", use: { viewport: { width: 360, height: 780 }, deviceScaleFactor: 3 } },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: true,
    timeout: 60_000,
    env: { ...process.env, VITE_DATA_SOURCE: "bundled" },
  },
});
