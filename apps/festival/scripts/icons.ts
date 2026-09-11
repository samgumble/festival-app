// Rasterizes public/icons/icon.svg with headless Chromium (Playwright is already a dev dependency).
// The body carries the sky→night gradient full-bleed; the SVG's own background rect is stripped so the
// maskable variant can inset the artwork 10 % per side (80 % safe zone) without a visible square edge.
// Run from apps/festival: `npm run icons:build`.
import { chromium } from "@playwright/test";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(here, "../public/icons");
const raw = readFileSync(resolve(out, "icon.svg"), "utf8");
const svg = raw.replace(/<rect id="bg-rect"[^>]*\/>\s*/, "");
if (svg === raw) throw new Error("icon.svg: bg-rect not found; the maskable icon would ship with a square edge");

const VARIANTS = [
  { file: "icon-192.png", size: 192, inset: 0 },
  { file: "icon-512.png", size: 512, inset: 0 },
  { file: "icon-512-maskable.png", size: 512, inset: 0.1 },
  { file: "apple-touch-icon-180.png", size: 180, inset: 0 },
] as const;

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
for (const { file, size, inset } of VARIANTS) {
  const pad = Math.round(size * inset);
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<style>html,body{margin:0;width:${size}px;height:${size}px;overflow:hidden;background:linear-gradient(#1890A8,#1A4A80)}` +
      `svg{position:absolute;left:${pad}px;top:${pad}px;width:${size - 2 * pad}px;height:${size - 2 * pad}px}</style>${svg}`,
  );
  writeFileSync(resolve(out, file), await page.screenshot({ type: "png", clip: { x: 0, y: 0, width: size, height: size }, omitBackground: false }));
  console.log(`${file}  ${size}×${size}${inset ? " (maskable, 80 % safe zone)" : ""}`);
}
await browser.close();
