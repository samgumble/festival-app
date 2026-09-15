import { defineConfig } from "@playwright/test";

// Generates the store-ready, captioned, device-pixel-exact screenshots described in
// docs/store/screenshots.md — separate from playwright.config.ts (`npm run screenshots`,
// review/design-pass captures) and playwright.offline.config.ts (production-build offline
// check) so neither of those runs is touched by this one. Run with `npm run store:shots`.
//
// Each project's viewport x deviceScaleFactor equals the exact required output pixel size,
// so a raw `page.screenshot()` in that project already is the store dimension (no upscale/
// crop): iPhone 6.9" -> 1320x2868, Android phone -> 1080x1920 (9:16; Play rejects long sides over 2x the short side).
export default defineConfig({
  testDir: "./e2e",
  testMatch: /store-shots\.spec\.ts/,
  timeout: 120_000,
  workers: 1,
  reporter: "list",
  use: { baseURL: "http://localhost:5173", browserName: "chromium" },
  projects: [
    { name: "ios-6.9", use: { viewport: { width: 440, height: 956 }, deviceScaleFactor: 3 } },
    { name: "android-phone", use: { viewport: { width: 360, height: 640 }, deviceScaleFactor: 3 } },
    // Play now requires 7" and 10" tablet screenshots (16:9 or 9:16, each side 320-3840 px)
    { name: "android-tablet-7", use: { viewport: { width: 600, height: 1067 }, deviceScaleFactor: 2 } },
    { name: "android-tablet-10", use: { viewport: { width: 800, height: 1422 }, deviceScaleFactor: 2 } },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: true,
    timeout: 60_000,
    env: { ...process.env, VITE_DATA_SOURCE: "bundled", VITE_ALERTS_FIXTURE: "store" },
  },
});
