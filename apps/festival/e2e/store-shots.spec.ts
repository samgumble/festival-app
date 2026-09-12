import { test, type Page } from "@playwright/test";
import { mkdirSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Generates the six captioned, device-pixel-exact store screenshots per platform (see
// docs/store/screenshots.md) plus the Play feature graphic. Two passes per screen:
//   1. a "raw" capture of the real app, at the exact final pixel size (viewport x
//      deviceScaleFactor, set per-project in playwright.store.config.ts), from the dev
//      server with bundled content and the dev clock seeded exactly like
//      apps/festival/e2e/screenshots.spec.ts does;
//   2. a compositing pass: a blank page at the same pixel size (deviceScaleFactor 1, so
//      CSS px == final px) whose HTML draws the paper/grain background, a Michroma caption
//      band, and the raw capture (as a data-URI <img>) clipped to a rounded rect with a
//      soft shadow — then that page itself is screenshotted as the final PNG.

const __dirname = dirname(fileURLToPath(import.meta.url));
const SHOTS_ROOT = resolve(__dirname, "../../../docs/store/shots");
const LOCKUP_PATH = resolve(__dirname, "../public/art/lockup.webp");
const FONT_URL = "http://localhost:5173/fonts/michroma/Michroma-Regular.woff2";
const FONT_PATH = resolve(__dirname, "../public/fonts/michroma/Michroma-Regular.woff2");
// The compositing page is a blank page.setContent() document (origin "null"), and cross-origin
// @font-face loads are always CORS-checked (unlike images) — the dev server doesn't send
// Access-Control-Allow-Origin, so document.fonts.load() would reject with a NetworkError.
// Rather than changing the dev server's CORS policy (would affect the real app for everyone)
// each compositing context routes this one exact URL to the on-disk file with an ACAO header
// added, so the page still "loads the font from the dev server URL" as far as its own CSS is
// concerned, just without an unreliable network hop.
const FONT_BYTES = readFileSync(FONT_PATH);

const PAPER = "#EBD5B3";
const INK = "#1E1A1A";
// Same body::before noise technique as apps/festival/src/design/tokens.css, copied verbatim.
const GRAIN_SVG =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='256' height='256'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>";

const CLOCK = { pre: "2026-09-17T18:00:00-06:00", live: "2026-09-19T15:40:00-06:00" } as const;

// Same favorites the design-pass spec (apps/festival/e2e/screenshots.spec.ts) seeds.
// sat-charlie-musselwhite-ga20-main-1630 (16:30-17:40) and sat-albert-white-blues-1730
// (17:30-18:30) genuinely overlap by 10 minutes — verified against
// packages/content/content-2026.json start/end times, not invented. That overlap is what
// makes screen 04's "resolved conflict" real.
const FAVORITES = [
  "sat-charlie-musselwhite-ga20-main-1630",
  "sat-albert-white-blues-1730",
  "sat-taj-mahal-keb-mo-main-2000",
  "fri-marcus-king-band-main-2000",
];
// conflictKey() in apps/festival/src/domain/conflicts.ts sorts the pair's ids and joins with
// "|"; the value is the id of the set that's KEPT. Setting this explicitly (rather than
// relying on the default "earlier start wins") is what makes the conflict shot show an
// explicitly *resolved* conflict, per apps/festival/src/state/plan.ts's `resolve()` shape.
const CONFLICT_KEY = ["sat-albert-white-blues-1730", "sat-charlie-musselwhite-ga20-main-1630"].sort().join("|");
const RESOLUTIONS = { [CONFLICT_KEY]: "sat-charlie-musselwhite-ga20-main-1630" };

interface Screen {
  slug: string;
  caption: string;
  path: string;
  theme: "light" | "dark";
  devNow: string;
  lineupView?: "list" | "grid";
  afterGoto?: (page: Page) => Promise<void>;
}

const SCREENS: Screen[] = [
  { slug: "01-now", caption: "Know what's on, right now.", path: "/", theme: "light", devNow: CLOCK.live },
  {
    slug: "02-lineup",
    caption: "Every stage, one schedule.",
    path: "/lineup",
    theme: "light",
    devNow: CLOCK.live,
    lineupView: "grid",
    afterGoto: async (page) => {
      await page.getByRole("button", { name: /jump to now/i }).click();
      await page.waitForTimeout(600);
    },
  },
  {
    slug: "03-artist",
    caption: "Favorite the sets you want.",
    path: "/lineup/artist/charlie-musselwhite-ga20",
    theme: "light",
    devNow: CLOCK.live,
  },
  { slug: "04-plan", caption: "See conflicts before they happen.", path: "/plan", theme: "light", devNow: CLOCK.live },
  { slug: "05-alerts", caption: "Alerts straight from the organizer.", path: "/alerts", theme: "light", devNow: CLOCK.live },
  { slug: "06-offline", caption: "Works offline, even at altitude.", path: "/", theme: "dark", devNow: CLOCK.pre },
];

test.beforeAll(() => {
  mkdirSync(resolve(SHOTS_ROOT, "ios-6.9"), { recursive: true });
  mkdirSync(resolve(SHOTS_ROOT, "android-phone"), { recursive: true });
});

interface Layout {
  width: number;
  height: number;
  captionBandHeight: number;
  topGap: number;
  availableWidth: number;
  availableHeight: number;
  captionMaxWidth: number;
  captionMaxFont: number;
}

/** Computes the shared layout numbers used by both the HTML markup and the fit-and-place step. */
function computeLayout(width: number, height: number): Layout {
  const captionBandHeight = Math.round(height * 0.095);
  const sideMargin = Math.round(width * 0.045);
  const bottomMargin = Math.round(height * 0.035);
  const topGap = Math.round(height * 0.02);
  return {
    width,
    height,
    captionBandHeight,
    topGap,
    availableWidth: width - sideMargin * 2,
    availableHeight: height - captionBandHeight - topGap - bottomMargin,
    captionMaxWidth: Math.round(width * 0.85),
    captionMaxFont: Math.round(captionBandHeight * 0.4),
  };
}

/** Builds the compositing page's HTML for one store screenshot. */
function compositeHtml(layout: Layout, caption: string, screenshotDataUri: string): string {
  const { width, height, captionBandHeight, topGap, availableHeight } = layout;

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  @font-face {
    font-family: "Michroma";
    src: url("${FONT_URL}") format("woff2");
    font-weight: 400;
    font-style: normal;
  }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    width: ${width}px;
    height: ${height}px;
    background: ${PAPER};
    overflow: hidden;
  }
  .grain {
    position: absolute;
    inset: 0;
    pointer-events: none;
    mix-blend-mode: multiply;
    opacity: 0.06;
    background-image: url("${GRAIN_SVG}");
  }
  .caption-band {
    position: absolute;
    top: 0;
    left: 0;
    width: ${width}px;
    height: ${captionBandHeight}px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  #cap {
    font-family: "Michroma", sans-serif;
    color: ${INK};
    text-transform: uppercase;
    letter-spacing: 0.14em;
    white-space: nowrap;
    text-align: center;
  }
  .shot-wrap {
    position: absolute;
    left: 0;
    width: ${width}px;
    top: ${captionBandHeight + topGap}px;
    height: ${availableHeight}px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  #shot {
    display: block;
  }
</style>
</head>
<body>
  <div class="grain"></div>
  <div class="caption-band"><div id="cap">${caption.toUpperCase()}</div></div>
  <div class="shot-wrap"><img id="shot" src="${screenshotDataUri}" /></div>
</body>
</html>`;
}

/**
 * After setContent(): waits for Michroma to load, shrinks the caption to fit one line
 * within captionMaxWidth (capped at captionMaxFont), then sizes+positions the screenshot
 * image to fill the remaining height with a margin, clipped to a rounded rect with a soft
 * shadow whose radius scales with how much the raw capture was shrunk.
 */
async function fitAndPlace(page: Page, layout: Layout, viewportCssWidth: number) {
  const { captionMaxWidth, captionMaxFont, availableWidth, availableHeight } = layout;
  await page.evaluate(async (o) => {
    await document.fonts.load('400 100px "Michroma"');
    await document.fonts.ready;

    const cap = document.getElementById("cap") as HTMLDivElement;
    const baseline = 100;
    cap.style.fontSize = `${baseline}px`;
    const natural = cap.getBoundingClientRect().width;
    const fitted = (o.captionMaxWidth / natural) * baseline;
    cap.style.fontSize = `${Math.min(fitted, o.captionMaxFont)}px`;

    const img = document.getElementById("shot") as HTMLImageElement;
    await new Promise<void>((res) => {
      if (img.complete) res();
      else img.onload = () => res();
    });
    const rawW = img.naturalWidth, rawH = img.naturalHeight;
    const scale = Math.min(o.availableWidth / rawW, o.availableHeight / rawH);
    const dispW = rawW * scale, dispH = rawH * scale;
    const overallScale = dispW / o.viewportCssWidth;
    img.style.width = `${dispW}px`;
    img.style.height = `${dispH}px`;
    img.style.borderRadius = `${28 * overallScale}px`;
    img.style.boxShadow = `0 ${12 * overallScale}px ${32 * overallScale}px rgba(30, 26, 26, 0.35)`;
  }, { captionMaxWidth, captionMaxFont, availableWidth, availableHeight, viewportCssWidth });
}

for (const screen of SCREENS) {
  test(`store shot: ${screen.slug}`, async ({ page, browser }, testInfo) => {
    const { viewport, deviceScaleFactor } = testInfo.project.use;
    const viewportCssWidth = viewport!.width;
    const dsf = deviceScaleFactor ?? 1;
    const width = viewportCssWidth * dsf;
    const height = viewport!.height * dsf;

    // 1. Raw capture of the real app at the exact final pixel size.
    await page.addInitScript(
      ([theme, devNow, lineupView, favorites, resolutions]) => {
        localStorage.setItem("bb-ui", JSON.stringify({ state: { theme, devNow, lineupView }, version: 0 }));
        localStorage.setItem(
          "bb-plan",
          JSON.stringify({
            state: { favorites, resolutions, remindersOn: false, settings: { leadMinutes: 15, bufferMinutes: 10 } },
            version: 1,
          }),
        );
      },
      [screen.theme, screen.devNow, screen.lineupView ?? "list", FAVORITES, RESOLUTIONS] as const,
    );
    await page.goto(screen.path);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(400);
    if (screen.afterGoto) await screen.afterGoto(page);
    await page.addStyleTag({ content: "[data-devclock]{display:none!important}" });
    const rawPng = await page.screenshot();
    const screenshotDataUri = `data:image/png;base64,${rawPng.toString("base64")}`;

    // 2. Composite: blank page at deviceScaleFactor 1, CSS px == final px.
    const compositeContext = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
    await compositeContext.route(FONT_URL, (route) =>
      route.fulfill({ status: 200, contentType: "font/woff2", headers: { "Access-Control-Allow-Origin": "*" }, body: FONT_BYTES }),
    );
    const compositePage = await compositeContext.newPage();
    const layout = computeLayout(width, height);

    await compositePage.setContent(compositeHtml(layout, screen.caption, screenshotDataUri));
    await fitAndPlace(compositePage, layout, viewportCssWidth);

    const folder = testInfo.project.name; // "ios-6.9" | "android-phone"
    await compositePage.screenshot({ path: resolve(SHOTS_ROOT, folder, `${screen.slug}.png`) });
    await compositeContext.close();
  });
}

// Play feature graphic: a single, non-per-screen asset. Generated once (guarded to the
// "ios-6.9" project so it isn't produced twice) since it doesn't depend on either device's
// viewport.
test("play feature graphic", async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== "ios-6.9", "generated once, not per device project");

  const width = 1024, height = 500;
  const lockupBase64 = readFileSync(LOCKUP_PATH).toString("base64");
  const lockupDataUri = `data:image/webp;base64,${lockupBase64}`;
  const displayWidth = Math.round(width * 0.7);

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  html, body { margin: 0; padding: 0; width: ${width}px; height: ${height}px; background: ${PAPER}; overflow: hidden; }
  .grain { position: absolute; inset: 0; pointer-events: none; mix-blend-mode: multiply; opacity: 0.06; background-image: url("${GRAIN_SVG}"); }
  .center { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
</style>
</head>
<body>
  <div class="grain"></div>
  <div class="center"><img id="lockup" src="${lockupDataUri}" style="width:${displayWidth}px;height:auto;display:block;" /></div>
</body>
</html>`;

  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.setContent(html);
  await page.waitForFunction(() => {
    const img = document.querySelector("img");
    return !!img && img.complete && img.naturalWidth > 0;
  });
  await page.screenshot({ path: resolve(SHOTS_ROOT, "play-feature-1024x500.png") });
  await context.close();
});
