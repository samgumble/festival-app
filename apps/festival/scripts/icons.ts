// Rasterizes public/icons/icon.svg with headless Chromium (Playwright is already a dev dependency).
// The body carries the sky→night gradient full-bleed; the SVG's own background rect is stripped so the
// maskable/native variants can inset the artwork without a visible square edge.
// Run from apps/festival: `npm run icons:build`.
import { chromium } from "@playwright/test";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(here, "../public/icons");
const raw = readFileSync(resolve(out, "icon.svg"), "utf8");
const svg = raw.replace(/<rect id="bg-rect"[^>]*\/>\s*/, "");
if (svg === raw) throw new Error("icon.svg: bg-rect not found; the maskable icon would ship with a square edge");

type Variant = { file: string; size: number; inset: number; alpha?: boolean; mono?: boolean; round?: boolean };

const VARIANTS: Variant[] = [
  { file: "icon-192.png", size: 192, inset: 0 },
  { file: "icon-512.png", size: 512, inset: 0 },
  { file: "icon-512-maskable.png", size: 512, inset: 0.1 },
  { file: "apple-touch-icon-180.png", size: 180, inset: 0 },
];

// Native icon set (Task 5, D-023): iOS universal AppIcon must be opaque (App Store rejects an alpha
// channel); Android adaptive foreground/monochrome layers are transparent with an 18 % safe-zone inset;
// legacy + round launcher PNGs are full-bleed opaque, with the round variant pre-masked to a circle; the
// status-bar notification icon is white-on-transparent.
const NATIVE: Variant[] = [
  { file: "../../ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png", size: 1024, inset: 0, alpha: false },
  ...[["mdpi", 108], ["hdpi", 162], ["xhdpi", 216], ["xxhdpi", 324], ["xxxhdpi", 432]].map(([d, px]) => ({ file: `../../android/app/src/main/res/mipmap-${d}/ic_launcher_foreground.png`, size: px as number, inset: 0.18, alpha: true })),
  ...[["mdpi", 108], ["hdpi", 162], ["xhdpi", 216], ["xxhdpi", 324], ["xxxhdpi", 432]].map(([d, px]) => ({ file: `../../android/app/src/main/res/mipmap-${d}/ic_launcher_monochrome.png`, size: px as number, inset: 0.18, alpha: true, mono: true })),
  ...[["mdpi", 48], ["hdpi", 72], ["xhdpi", 96], ["xxhdpi", 144], ["xxxhdpi", 192]].flatMap(([d, px]) => [
    { file: `../../android/app/src/main/res/mipmap-${d}/ic_launcher.png`, size: px as number, inset: 0, alpha: false },
    { file: `../../android/app/src/main/res/mipmap-${d}/ic_launcher_round.png`, size: px as number, inset: 0, alpha: false, round: true },
  ]),
  ...[["mdpi", 24], ["hdpi", 36], ["xhdpi", 48], ["xxhdpi", 72], ["xxxhdpi", 96]].map(([d, px]) => ({ file: `../../android/app/src/main/res/drawable-${d}/ic_stat_sun.png`, size: px as number, inset: 0.05, alpha: true, mono: true })),
];

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
for (const { file, size, inset, alpha = false, mono = false, round = false } of [...VARIANTS, ...NATIVE]) {
  let markup = svg;
  if (mono) markup = markup.replaceAll('fill="url(#sun)"', 'fill="#FFFFFF"').replaceAll('stroke="#1E1A1A"', 'stroke="none"');

  const pad = Math.round(size * inset);
  // The gradient (and the round mask) live on `body`, not `html`. When `html` has no background, Chromium
  // propagates `body`'s background to paint the viewport canvas directly, ignoring `body`'s own border-radius
  // and overflow — the round mask would be a visual no-op. Giving `html` an explicit white background stops
  // that propagation so `body`'s circular clip actually shows, with opaque white corners (alpha stays false).
  const bodyRules = ["margin:0", `width:${size}px`, `height:${size}px`, "overflow:hidden", alpha ? "" : "background:linear-gradient(#1890A8,#1A4A80)", round ? "border-radius:50%" : ""]
    .filter(Boolean)
    .join(";");

  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<style>html{margin:0${round ? ";background:#FFFFFF" : ""}}body{${bodyRules}}svg{position:absolute;left:${pad}px;top:${pad}px;width:${size - 2 * pad}px;height:${size - 2 * pad}px}</style>${markup}`,
  );
  const dest = resolve(out, file);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, await page.screenshot({ type: "png", clip: { x: 0, y: 0, width: size, height: size }, omitBackground: alpha }));
  console.log(`${file}  ${size}×${size}${inset ? ` (inset ${Math.round(inset * 100)} %)` : ""}`);
}
await browser.close();
