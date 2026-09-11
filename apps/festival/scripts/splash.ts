// Renders the launch screen: paper background with the official lockup at 60 % width, centred.
// iOS uses one 2732×2732 image (Capacitor template's Splash.imageset); Android 12+ uses the
// system icon-only splash on a paper window background (styles.xml), so no bitmap is needed there.
import { chromium } from "@playwright/test";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const lockup = readFileSync(resolve(here, "../public/art/lockup.webp")).toString("base64");
const out = resolve(here, "../ios/App/App/Assets.xcassets/Splash.imageset");
const SIZE = 2732;

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
await page.setViewportSize({ width: SIZE, height: SIZE });
await page.setContent(`<style>html,body{margin:0;width:${SIZE}px;height:${SIZE}px;background:#EBD5B3;display:grid;place-items:center}img{width:60%}</style><img src="data:image/webp;base64,${lockup}">`);
await page.waitForLoadState("networkidle");
const png = await page.screenshot({ type: "png", clip: { x: 0, y: 0, width: SIZE, height: SIZE } });
mkdirSync(out, { recursive: true });
for (const name of ["splash-2732x2732.png", "splash-2732x2732-1.png", "splash-2732x2732-2.png"]) writeFileSync(resolve(out, name), png);
console.log(`Splash.imageset ← 3 × ${SIZE}×${SIZE}`);
await browser.close();
