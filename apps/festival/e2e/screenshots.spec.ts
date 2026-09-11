import { test } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../../../docs/screens/design-pass");
const CLOCKS = { pre: "2026-09-17T18:00:00-06:00", live: "2026-09-19T15:40:00-06:00", post: "2026-09-21T10:00:00-06:00" } as const;
const THEMES = ["light", "dark"] as const;
const TABS = [["now", "/"], ["lineup-list", "/lineup"], ["plan", "/plan"], ["alerts", "/alerts"], ["info", "/info"], ["artist", "/lineup/artist/charlie-musselwhite-ga20"]] as const;
const FAVORITES = ["sat-charlie-musselwhite-ga20-main-1630", "sat-albert-white-blues-1730", "sat-taj-mahal-keb-mo-main-2000", "fri-marcus-king-band-main-2000"];

test.beforeAll(() => mkdirSync(OUT, { recursive: true }));

for (const theme of THEMES) for (const [clockName, devNow] of Object.entries(CLOCKS)) for (const [name, path] of TABS) {
  test(`${clockName} ${theme} ${name}`, async ({ page }) => {
    await page.addInitScript(([t, now, favs]) => {
      localStorage.setItem("bb-ui", JSON.stringify({ state: { theme: t, devNow: now, lineupView: "list" }, version: 0 }));
      localStorage.setItem("bb-plan", JSON.stringify({ state: { favorites: favs, resolutions: {}, reminders: [], settings: { leadMinutes: 15, bufferMinutes: 10 } }, version: 0 }));
    }, [theme, devNow, FAVORITES] as const);
    await page.goto(path);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(400);
    await page.addStyleTag({ content: "[data-devclock]{display:none!important}" });
    await page.screenshot({ path: `${OUT}/${clockName}-${theme}-${name}.png` });
  });
}

test("live light lineup-grid", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("bb-ui", JSON.stringify({ state: { theme: "light", devNow: "2026-09-19T15:40:00-06:00", lineupView: "grid" }, version: 0 }));
  });
  await page.goto("/lineup");
  await page.evaluate(() => document.fonts.ready);
  await page.getByRole("button", { name: /jump to now/i }).click();
  await page.waitForTimeout(600);
  await page.addStyleTag({ content: "[data-devclock]{display:none!important}" });
  await page.screenshot({ path: `${OUT}/live-light-lineup-grid.png` });
});

test("live light update-banner", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("bb-ui", JSON.stringify({ state: { theme: "light", devNow: "2026-09-19T15:40:00-06:00", lineupView: "list" }, version: 0 }));
  });
  await page.goto("/?update=1");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  await page.addStyleTag({ content: "[data-devclock]{display:none!important}" });
  await page.screenshot({ path: `${OUT}/live-light-update-banner.png` });
});

test("pre light info-install-sheet", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("bb-ui", JSON.stringify({ state: { theme: "light", devNow: "2026-09-17T18:00:00-06:00", lineupView: "list" }, version: 0 }));
  });
  await page.goto("/info?install=ios");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(600);
  await page.addStyleTag({ content: "[data-devclock]{display:none!important}" });
  await page.screenshot({ path: `${OUT}/pre-light-info-install-sheet.png` });
});
