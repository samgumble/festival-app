# PWA Shell + Art Budget Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the fan app on GitHub Pages an installable, offline-capable PWA with an update banner and an Info-screen install nudge, while cutting the precached art and fonts to fit a 3 MB precache budget.

**Architecture:** `vite-plugin-pwa` (generateSW, prompt mode) precaches the built shell, WebP art, WOFF2 fonts and icons; a tiny zustand store bridges `registerSW` callbacks to an `UpdateBanner` in the tab shell; `src/platform/install.ts` wraps the browser install APIs behind a hook the Info screen uses. Generated assets (WebP, WOFF2, icon PNGs) are produced by scripts and committed, so CI has no native image tooling.

**Tech Stack:** Vite 8.2.2, React 19.3.0, TypeScript 5.9.3 strict, Tailwind v4 tokens, zustand 5.0.15, motion 13.2.0, `vite-plugin-pwa` 1.3.0 (+ `workbox-build`/`workbox-window` 7.4.1), Vitest 4.1.11 + jsdom, Playwright 1.63.0, Homebrew `cwebp` and `woff2_compress`.

Spec: `docs/superpowers/specs/2026-09-10-pwa-and-art-budget-design.md`. Decision: `docs/DECISIONS.md` D-022.

## Global Constraints

- Work in `apps/festival` unless a path says otherwise; all `npm run` commands below are run from `apps/festival` unless prefixed with `(root)`.
- Only new dependencies: `vite-plugin-pwa@1.3.0`, `workbox-build@7.4.1`, `workbox-window@7.4.1` (devDependencies; the last two are the plugin's peers). Nothing else; no `sharp`, no asset generators.
- `public/art/*.webp` total ≤ **1,000,000 bytes**; the official lockup (`lockup.png`) and every PNG with alpha are converted **lossless**; opaque PNGs use `-q 82`.
- Fonts ship as WOFF2 only; TTF sources and `OFL.txt` stay in the repo untouched. `fonts.css` references only `.woff2`.
- Manifest values verbatim: name `Telluride Blues & Brews`, short_name `Blues & Brews`, description `Official festival guide: lineup, your plan, alerts.`, display `standalone`, orientation `portrait`, start_url `./`, scope `./`, id `./`, background_color `#EBD5B3`, theme_color `#1A4A80`, lang `en`.
- Service worker: `registerType: "prompt"`, `injectRegister: false`, `cleanupOutdatedCaches: true`, `clientsClaim: true`, `skipWaiting` unset (false), `devOptions.enabled: false`; registration is a no-op when `import.meta.env.DEV`, `import.meta.env.MODE === "test"`, or `serviceWorker` is missing.
- Precache glob: `**/*.{js,css,html,svg,webp,woff2,png}`; ignore `art/*.png`, `fonts/**/*.ttf`, `fonts/**/OFL.txt`. Precache total ≤ 3,000,000 bytes.
- Banner copy verbatim: eyebrow `Update`, body `A fresh festival guide is ready.`, button `Refresh`, dismiss label `Dismiss`. Appears with a 150 ms opacity fade only when `useMotionOk()` is true, otherwise instantly.
- Install card copy verbatim: eyebrow `Get the app`, body `Works offline at the venue once it's on your home screen.`, button `Add to Home Screen`; iOS sheet title `Add to Home Screen`, steps `Tap Share`, `Scroll to Add to Home Screen`, `Tap Add`.
- Info footer suffix ` · offline-ready ✓` appended only when the update store's `offlineReady` is true.
- Every DEV-only test hook (`?update=1`, `?install=ios`) is guarded by `import.meta.env.DEV` and never reaches production.
- Tests: Vitest for units/components, Playwright only for the offline check and screenshots. Conventional commits, one commit per task, `main` auto-deploys to Pages so keep `npm test` and `npm run build` green.
- No festival content is invented; no analytics; every animation has a reduced-motion fallback.

---

## File Structure

| Path (under `apps/festival/`) | Responsibility |
|---|---|
| `scripts/art-build.ts` | PNG → WebP with `cwebp`; `checkBudget()` guard; prints size table |
| `scripts/art-build.test.ts` | unit test for `checkBudget` |
| `scripts/fonts-build.ts` | TTF → WOFF2 with `woff2_compress` |
| `scripts/icons.ts` | renders `public/icons/icon.svg` to the four PNGs with headless Chromium |
| `public/art/*.webp`, `public/fonts/*/*.woff2`, `public/icons/*.png`, `public/favicon.svg` | committed generated assets |
| `public/icons/icon.svg` | the code-drawn sun icon source |
| `src/design/fonts.css` | `@font-face` → `.woff2` |
| `src/design/fonts.test.ts` | asserts only `.woff2` is referenced |
| `src/features/now/Hero.tsx`, `src/features/info/InfoScreen.tsx` | art references → `.webp`; Info gains the install card, sheet, and footer suffix |
| `vite.config.ts` | `VitePWA()` plugin + manifest + test alias/include |
| `src/state/updates.ts` (+ test) | update/offline store |
| `src/app/sw.ts` (+ test), `src/test/pwa-register.mock.ts` | service worker registration bridge |
| `src/app/UpdateBanner.tsx` (+ test), `src/app/TabShell.tsx` | banner and its mount |
| `src/platform/install.ts` (+ test), `src/features/info/InstallSheet.tsx` | install detection/prompt and the iOS steps sheet |
| `src/main.tsx` | calls `captureInstallPrompt()` and `setupServiceWorker()` |
| `index.html` | favicon, apple-touch-icon, apple web-app meta |
| `playwright.offline.config.ts`, `e2e/offline.spec.ts` | offline end-to-end check against `vite preview` |
| `e2e/screenshots.spec.ts` | two new shots (banner, install sheet) |
| `(root) docs/HANDOFF.md`, `CLAUDE.md` | status board, commands |

---

### Task 1: WebP art pipeline

**Files:**
- Create: `apps/festival/scripts/art-build.ts`
- Create: `apps/festival/scripts/art-build.test.ts`
- Modify: `apps/festival/package.json` (scripts)
- Modify: `apps/festival/vite.config.ts` (test include)
- Modify: `apps/festival/tsconfig.json` (include `scripts`)
- Modify: `apps/festival/src/features/now/Hero.tsx:6-10,28`
- Modify: `apps/festival/src/features/info/InfoScreen.tsx:42,68`
- Generate + commit: `apps/festival/public/art/{sky,mountains-near,foreground,lockup,dates,sbg}.webp`

**Interfaces:**
- Produces: `checkBudget(sizes: Record<string, number>, budget?: number): { total: number; ok: boolean }`, `ART_BUDGET_BYTES = 1_000_000`, npm script `art:build`.

- [ ] **Step 1: Write the failing test**

`apps/festival/scripts/art-build.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { ART_BUDGET_BYTES, checkBudget } from "./art-build";

describe("art budget", () => {
  it("sums sizes and passes under the budget", () => {
    expect(checkBudget({ "a.webp": 400_000, "b.webp": 500_000 })).toEqual({ total: 900_000, ok: true });
  });
  it("fails when the total exceeds the budget", () => {
    expect(checkBudget({ "a.webp": 600_000, "b.webp": 500_000 })).toEqual({ total: 1_100_000, ok: false });
  });
  it("accepts a custom budget and treats equality as ok", () => {
    expect(checkBudget({ "a.webp": 10 }, 10).ok).toBe(true);
    expect(ART_BUDGET_BYTES).toBe(1_000_000);
  });
});
```

- [ ] **Step 2: Make Vitest and tsc see `scripts/`**

In `apps/festival/vite.config.ts` change the test `include` line to:

```ts
    include: ["src/**/*.test.{ts,tsx}", "scripts/**/*.test.ts"],
```

In `apps/festival/tsconfig.json` change `include` to:

```json
  "include": ["src", "e2e", "scripts", "vite.config.ts", "playwright.config.ts"]
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm test -- scripts/art-build.test.ts`
Expected: FAIL — `Failed to resolve import "./art-build"`.

- [ ] **Step 4: Write the script**

`apps/festival/scripts/art-build.ts`:

```ts
// Converts public/art/*.png → *.webp with Homebrew cwebp. Alpha PNGs (incl. the official
// lockup, which must ship unmodified) are lossless; opaque poster crops use -q 82.
// Run from apps/festival: `npm run art:build`. Fails when the WebP set exceeds the budget.
import { execFileSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ART_BUDGET_BYTES = 1_000_000;

export function checkBudget(sizes: Record<string, number>, budget: number = ART_BUDGET_BYTES): { total: number; ok: boolean } {
  const total = Object.values(sizes).reduce((a, b) => a + b, 0);
  return { total, ok: total <= budget };
}

function hasAlpha(png: string): boolean {
  return execFileSync("sips", ["-g", "hasAlpha", png], { encoding: "utf8" }).includes("hasAlpha: yes");
}

function main(): void {
  const here = dirname(fileURLToPath(import.meta.url));
  const art = resolve(here, "../public/art");
  const sizes: Record<string, number> = {};
  for (const file of readdirSync(art).filter((f) => f.endsWith(".png")).sort()) {
    const src = resolve(art, file);
    const out = resolve(art, `${basename(file, ".png")}.webp`);
    const args = hasAlpha(src) ? ["-quiet", "-lossless", src, "-o", out] : ["-quiet", "-q", "82", src, "-o", out];
    execFileSync("cwebp", args, { stdio: "inherit" });
    sizes[basename(out)] = statSync(out).size;
  }
  const { total, ok } = checkBudget(sizes);
  for (const [name, size] of Object.entries(sizes)) console.log(`${String(size).padStart(9)}  ${name}`);
  console.log(`${String(total).padStart(9)}  total (budget ${ART_BUDGET_BYTES})`);
  if (!ok) {
    console.error(`Art budget exceeded by ${total - ART_BUDGET_BYTES} bytes.`);
    process.exit(1);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
```

Add to `apps/festival/package.json` scripts:

```json
    "art:build": "node scripts/art-build.ts",
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- scripts/art-build.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Generate the WebP set**

Run: `npm run art:build`
Expected output ends with a total around `968170  total (budget 1000000)` and exit 0. Six `.webp` files now sit in `public/art/`.

- [ ] **Step 7: Switch the app to `.webp`**

In `src/features/now/Hero.tsx` replace the four references:

```ts
const LAYERS = [
  { src: asset("/art/sky.webp"), rate: 0.15, top: "0%" },
  { src: asset("/art/mountains-near.webp"), rate: 0.35, top: "38%" },
  { src: asset("/art/foreground.webp"), rate: 0.6, top: "62%" },
] as const;
```

and `<img src={asset("/art/lockup.webp")} …`.

In `src/features/info/InfoScreen.tsx` replace `asset("/art/dates.png")` with `asset("/art/dates.webp")` and `asset("/art/sbg.png")` with `asset("/art/sbg.webp")`.

Run: `grep -rn 'art/.*\.png' src` — Expected: no output.

- [ ] **Step 8: Full checks**

Run: `npm run typecheck && npm test`
Expected: PASS (all suites).

- [ ] **Step 9: Commit**

```bash
git add apps/festival/scripts/art-build.ts apps/festival/scripts/art-build.test.ts apps/festival/package.json apps/festival/vite.config.ts apps/festival/tsconfig.json apps/festival/public/art/*.webp apps/festival/src/features/now/Hero.tsx apps/festival/src/features/info/InfoScreen.tsx
git commit -m "feat(art): ship poster art as WebP under a 1 MB budget"
```

---

### Task 2: WOFF2 fonts

**Files:**
- Create: `apps/festival/scripts/fonts-build.ts`
- Create: `apps/festival/src/design/fonts.test.ts`
- Modify: `apps/festival/src/design/fonts.css`
- Modify: `apps/festival/package.json` (scripts)
- Generate + commit: `apps/festival/public/fonts/*/*.woff2`

**Interfaces:**
- Produces: npm script `fonts:build`; `fonts.css` referencing only `.woff2`.

- [ ] **Step 1: Write the failing test**

`apps/festival/src/design/fonts.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(__dirname, "fonts.css"), "utf8");

describe("fonts.css", () => {
  it("references only WOFF2 files", () => {
    const urls = [...css.matchAll(/url\("([^"]+)"\)/g)].map((m) => m[1]);
    expect(urls.length).toBe(5);
    for (const u of urls) expect(u).toMatch(/\.woff2$/);
    expect(css).not.toMatch(/\.ttf|truetype/);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/design/fonts.test.ts`
Expected: FAIL — urls end in `.ttf`.

- [ ] **Step 3: Write the script and run it**

`apps/festival/scripts/fonts-build.ts`:

```ts
// Converts public/fonts/*/*.ttf → .woff2 with Homebrew woff2_compress (brew install woff2).
// TTF sources and OFL.txt stay in the repo; only .woff2 is referenced by fonts.css and precached.
import { execFileSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const fonts = resolve(here, "../public/fonts");
let total = 0;
for (const dir of readdirSync(fonts).sort()) {
  const full = resolve(fonts, dir);
  if (!statSync(full).isDirectory()) continue;
  for (const file of readdirSync(full).filter((f) => f.endsWith(".ttf")).sort()) {
    const ttf = resolve(full, file);
    execFileSync("woff2_compress", [ttf], { stdio: "ignore" });
    const woff2 = ttf.replace(/\.ttf$/, ".woff2");
    const size = statSync(woff2).size;
    total += size;
    console.log(`${String(size).padStart(9)}  ${dir}/${file.replace(/\.ttf$/, ".woff2")}`);
  }
}
console.log(`${String(total).padStart(9)}  total`);
```

Add to `apps/festival/package.json` scripts:

```json
    "fonts:build": "node scripts/fonts-build.ts",
```

Run: `npm run fonts:build`
Expected: five lines and a total near `350256  total`; five `.woff2` files beside the TTFs.

- [ ] **Step 4: Point `fonts.css` at WOFF2**

Replace the whole of `src/design/fonts.css` with:

```css
@font-face { font-family: "Bungee"; src: url("/fonts/bungee/Bungee-Regular.woff2") format("woff2"); font-weight: 400; font-style: normal; font-display: block; }
@font-face { font-family: "Bungee Shade"; src: url("/fonts/bungee-shade/BungeeShade-Regular.woff2") format("woff2"); font-weight: 400; font-style: normal; font-display: block; }
@font-face { font-family: "Michroma"; src: url("/fonts/michroma/Michroma-Regular.woff2") format("woff2"); font-weight: 400; font-style: normal; font-display: block; }
@font-face { font-family: "DM Sans"; src: url("/fonts/dm-sans/DMSans-Variable.woff2") format("woff2"); font-weight: 100 1000; font-style: normal; font-display: block; }
@font-face { font-family: "DM Sans"; src: url("/fonts/dm-sans/DMSans-Italic-Variable.woff2") format("woff2"); font-weight: 100 1000; font-style: italic; font-display: block; }
```

(Keep any other rules that exist in the file after these five lines unchanged — check with `cat` first; only the five `@font-face` blocks change.)

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- src/design/fonts.test.ts`
Expected: PASS.

- [ ] **Step 6: Visual sanity**

Run: `npm run dev` then open http://localhost:5173/ — the "NOW" wordmark still renders in Bungee (not a fallback serif). Stop the server.

- [ ] **Step 7: Commit**

```bash
git add apps/festival/scripts/fonts-build.ts apps/festival/src/design/fonts.test.ts apps/festival/src/design/fonts.css apps/festival/package.json apps/festival/public/fonts
git commit -m "feat(fonts): ship WOFF2 fonts (TTF sources kept)"
```

---

### Task 3: Icon source, rasterized icons, and `index.html` meta

**Files:**
- Create: `apps/festival/public/icons/icon.svg`
- Create: `apps/festival/public/favicon.svg` (identical copy of `icon.svg`)
- Create: `apps/festival/scripts/icons.ts`
- Generate + commit: `apps/festival/public/icons/{icon-192.png,icon-512.png,icon-512-maskable.png,apple-touch-icon-180.png}`
- Modify: `apps/festival/index.html`
- Modify: `apps/festival/package.json` (scripts)

**Interfaces:**
- Produces: the four icon PNGs at the paths the manifest in Task 4 lists; npm script `icons:build`.

- [ ] **Step 1: Draw the icon**

`apps/festival/public/icons/icon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="Telluride Blues &amp; Brews">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1890A8"/>
      <stop offset="1" stop-color="#1A4A80"/>
    </linearGradient>
    <linearGradient id="sun" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#F0C41C"/>
      <stop offset="1" stop-color="#F09A1C"/>
    </linearGradient>
  </defs>
  <rect id="bg-rect" width="512" height="512" fill="url(#bg)"/>
  <g fill="url(#sun)" opacity="0.9">
    <polygon points="256,256 216,-80 296,-80"/>
    <polygon points="256,256 216,-80 296,-80" transform="rotate(30 256 256)"/>
    <polygon points="256,256 216,-80 296,-80" transform="rotate(60 256 256)"/>
    <polygon points="256,256 216,-80 296,-80" transform="rotate(90 256 256)"/>
    <polygon points="256,256 216,-80 296,-80" transform="rotate(120 256 256)"/>
    <polygon points="256,256 216,-80 296,-80" transform="rotate(150 256 256)"/>
    <polygon points="256,256 216,-80 296,-80" transform="rotate(180 256 256)"/>
    <polygon points="256,256 216,-80 296,-80" transform="rotate(210 256 256)"/>
    <polygon points="256,256 216,-80 296,-80" transform="rotate(240 256 256)"/>
    <polygon points="256,256 216,-80 296,-80" transform="rotate(270 256 256)"/>
    <polygon points="256,256 216,-80 296,-80" transform="rotate(300 256 256)"/>
    <polygon points="256,256 216,-80 296,-80" transform="rotate(330 256 256)"/>
  </g>
  <circle cx="256" cy="256" r="118" fill="url(#sun)" stroke="#1E1A1A" stroke-width="10"/>
</svg>
```

Copy it: `cp public/icons/icon.svg public/favicon.svg`.

- [ ] **Step 2: Write the renderer**

`apps/festival/scripts/icons.ts`:

```ts
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
const svg = readFileSync(resolve(out, "icon.svg"), "utf8").replace(/<rect id="bg-rect"[^>]*\/>\s*/, "");

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
```

Add to `apps/festival/package.json` scripts:

```json
    "icons:build": "node scripts/icons.ts",
```

- [ ] **Step 3: Render and inspect**

Run: `npm run icons:build`
Expected: four lines printed; `ls -l public/icons` shows four PNGs, each under 40 kB. Open `public/icons/icon-512-maskable.png` (`open public/icons/icon-512-maskable.png`) — the sun disc is centered, rays stop at ~80 % and the gradient fills the square.

- [ ] **Step 4: Add the head tags**

In `apps/festival/index.html`, after the two `theme-color` metas insert:

```html
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="apple-touch-icon" href="/icons/apple-touch-icon-180.png" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="Blues &amp; Brews" />
```

- [ ] **Step 5: Verify the base path rewrite**

Run: `BASE_PATH=/festival-app/ npm run build && grep -o 'href="[^"]*apple-touch-icon[^"]*"' dist/index.html`
Expected: `href="/festival-app/icons/apple-touch-icon-180.png"`.

- [ ] **Step 6: Commit**

```bash
git add apps/festival/public/icons apps/festival/public/favicon.svg apps/festival/scripts/icons.ts apps/festival/index.html apps/festival/package.json
git commit -m "feat(pwa): code-drawn sun icon set and iOS home-screen meta"
```

---

### Task 4: `vite-plugin-pwa` config, update store, and service-worker bridge

**Files:**
- Modify: `apps/festival/package.json` (devDependencies)
- Modify: `apps/festival/vite.config.ts`
- Modify: `apps/festival/tsconfig.json` (types)
- Create: `apps/festival/src/state/updates.ts`, `apps/festival/src/state/updates.test.ts`
- Create: `apps/festival/src/test/pwa-register.mock.ts`
- Create: `apps/festival/src/app/sw.ts`, `apps/festival/src/app/sw.test.ts`
- Modify: `apps/festival/src/main.tsx`

**Interfaces:**
- Produces: `useUpdateStore` with `{ needRefresh, offlineReady, dismissed, apply, setNeedRefresh(), setOfflineReady(), dismiss(), setApply(fn), reset() }`; `setupServiceWorker(env?: { dev: boolean; mode: string })`.
- Consumed by Task 5 (banner) and Task 6 (footer suffix).

- [ ] **Step 1: Install the plugin**

Run (from `apps/festival`): `npm i -D vite-plugin-pwa@1.3.0 workbox-build@7.4.1 workbox-window@7.4.1`
Expected: `package.json` devDependencies gain the three exact pins; root `package-lock.json` updates.

- [ ] **Step 2: Write the failing store test**

`apps/festival/src/state/updates.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useUpdateStore } from "./updates";

describe("update store", () => {
  beforeEach(() => useUpdateStore.getState().reset());

  it("starts idle", () => {
    const s = useUpdateStore.getState();
    expect(s.needRefresh).toBe(false);
    expect(s.offlineReady).toBe(false);
    expect(s.dismissed).toBe(false);
  });

  it("flags a refresh and can be dismissed for the session", () => {
    useUpdateStore.getState().setNeedRefresh();
    expect(useUpdateStore.getState().needRefresh).toBe(true);
    useUpdateStore.getState().dismiss();
    expect(useUpdateStore.getState().dismissed).toBe(true);
  });

  it("a later needRefresh clears a previous dismissal", () => {
    useUpdateStore.getState().setNeedRefresh();
    useUpdateStore.getState().dismiss();
    useUpdateStore.getState().setNeedRefresh();
    expect(useUpdateStore.getState().dismissed).toBe(false);
  });

  it("apply defaults to a no-op and can be replaced", async () => {
    await expect(useUpdateStore.getState().apply()).resolves.toBeUndefined();
    const fn = vi.fn(async () => {});
    useUpdateStore.getState().setApply(fn);
    await useUpdateStore.getState().apply();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("marks offline-ready", () => {
    useUpdateStore.getState().setOfflineReady();
    expect(useUpdateStore.getState().offlineReady).toBe(true);
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npm test -- src/state/updates.test.ts`
Expected: FAIL — cannot resolve `./updates`.

- [ ] **Step 4: Write the store**

`apps/festival/src/state/updates.ts`:

```ts
import { create } from "zustand";

/** Bridges service-worker lifecycle events (src/app/sw.ts) to the UI. Session-only; never persisted. */
interface UpdateState {
  needRefresh: boolean;
  offlineReady: boolean;
  dismissed: boolean;
  apply: () => Promise<void>;
  setNeedRefresh: () => void;
  setOfflineReady: () => void;
  dismiss: () => void;
  setApply: (fn: () => Promise<void>) => void;
  reset: () => void;
}

const initial = { needRefresh: false, offlineReady: false, dismissed: false, apply: async () => {} };

export const useUpdateStore = create<UpdateState>()((set) => ({
  ...initial,
  setNeedRefresh: () => set({ needRefresh: true, dismissed: false }),
  setOfflineReady: () => set({ offlineReady: true }),
  dismiss: () => set({ dismissed: true }),
  setApply: (apply) => set({ apply }),
  reset: () => set({ ...initial }),
}));
```

- [ ] **Step 5: Run the store test to verify it passes**

Run: `npm test -- src/state/updates.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 6: Write the failing service-worker bridge test**

`apps/festival/src/test/pwa-register.mock.ts` (aliased in place of `virtual:pwa-register` under Vitest):

```ts
import { vi } from "vitest";

export const updateSW = vi.fn(async (_reload?: boolean) => {});
export const registerSW = vi.fn((_options?: unknown) => updateSW);
```

`apps/festival/src/app/sw.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { registerSW, updateSW } from "virtual:pwa-register";
import { setupServiceWorker } from "./sw";
import { useUpdateStore } from "@/state/updates";

type Options = { immediate?: boolean; onNeedRefresh?: () => void; onOfflineReady?: () => void };
const PROD = { dev: false, mode: "production" };

function stubServiceWorker(controller: object | null) {
  Object.defineProperty(navigator, "serviceWorker", { value: { controller }, configurable: true });
}

describe("setupServiceWorker", () => {
  beforeEach(() => {
    useUpdateStore.getState().reset();
    vi.mocked(registerSW).mockClear();
    vi.mocked(updateSW).mockClear();
  });
  afterEach(() => {
    // @ts-expect-error jsdom has no serviceWorker; remove our stub
    delete navigator.serviceWorker;
  });

  it("does nothing in dev, in tests, or without serviceWorker support", () => {
    stubServiceWorker(null);
    setupServiceWorker({ dev: true, mode: "production" });
    setupServiceWorker({ dev: false, mode: "test" });
    // @ts-expect-error see above
    delete navigator.serviceWorker;
    setupServiceWorker(PROD);
    expect(registerSW).not.toHaveBeenCalled();
  });

  it("registers immediately in production and wires the callbacks into the store", async () => {
    stubServiceWorker(null);
    setupServiceWorker(PROD);
    expect(registerSW).toHaveBeenCalledTimes(1);
    const opts = vi.mocked(registerSW).mock.calls[0]![0] as Options;
    expect(opts.immediate).toBe(true);
    expect(useUpdateStore.getState().needRefresh).toBe(false);
    opts.onNeedRefresh!();
    expect(useUpdateStore.getState().needRefresh).toBe(true);
    opts.onOfflineReady!();
    expect(useUpdateStore.getState().offlineReady).toBe(true);
    await useUpdateStore.getState().apply();
    expect(updateSW).toHaveBeenCalledWith(true);
  });

  it("treats an already-controlling worker as offline-ready at startup", () => {
    stubServiceWorker({});
    setupServiceWorker(PROD);
    expect(useUpdateStore.getState().offlineReady).toBe(true);
  });
});
```

- [ ] **Step 7: Alias the virtual module for tests and add the client types**

In `apps/festival/vite.config.ts` `test` block add:

```ts
    alias: { "virtual:pwa-register": fileURLToPath(new URL("./src/test/pwa-register.mock.ts", import.meta.url)) },
```

In `apps/festival/tsconfig.json` change `types` to:

```json
    "types": ["node", "vite/client", "vite-plugin-pwa/client", "@testing-library/jest-dom"],
```

- [ ] **Step 8: Run the bridge test to verify it fails**

Run: `npm test -- src/app/sw.test.ts`
Expected: FAIL — cannot resolve `./sw`.

- [ ] **Step 9: Write the bridge**

`apps/festival/src/app/sw.ts`:

```ts
import { registerSW } from "virtual:pwa-register";
import { useUpdateStore } from "@/state/updates";

/**
 * Registers the Workbox service worker (vite-plugin-pwa, prompt mode) and forwards its lifecycle
 * into the update store. No-op in dev, under Vitest, and in browsers without service workers.
 */
export function setupServiceWorker(env: { dev: boolean; mode: string } = { dev: import.meta.env.DEV, mode: import.meta.env.MODE }): void {
  if (env.dev || env.mode === "test" || typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  const store = useUpdateStore.getState();
  if (navigator.serviceWorker.controller) store.setOfflineReady();
  const update = registerSW({
    immediate: true,
    onNeedRefresh: () => useUpdateStore.getState().setNeedRefresh(),
    onOfflineReady: () => useUpdateStore.getState().setOfflineReady(),
  });
  store.setApply(() => update(true));
}
```

- [ ] **Step 10: Run the bridge test to verify it passes**

Run: `npm test -- src/app/sw.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 11: Configure the plugin**

Replace `apps/festival/vite.config.ts` with:

```ts
/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath } from "node:url";

const base = process.env.BASE_PATH ?? "/";

export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "prompt",
      injectRegister: false,
      includeAssets: ["favicon.svg", "icons/*.png", "fonts/**/*.woff2", "art/*.webp"],
      manifest: {
        name: "Telluride Blues & Brews",
        short_name: "Blues & Brews",
        description: "Official festival guide: lineup, your plan, alerts.",
        display: "standalone",
        orientation: "portrait",
        start_url: "./",
        scope: "./",
        id: "./",
        background_color: "#EBD5B3",
        theme_color: "#1A4A80",
        lang: "en",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          { src: "icons/apple-touch-icon-180.png", sizes: "180x180", type: "image/png" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,webp,woff2,png}"],
        globIgnores: ["art/*.png", "fonts/**/*.ttf", "fonts/**/OFL.txt"],
        navigateFallback: `${base}index.html`,
        navigateFallbackDenylist: [/\/design(\/|$)/],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  define: { __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? "0.0.0") },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "scripts/**/*.test.ts"],
    css: false,
    env: { VITE_DATA_SOURCE: "bundled" },
    alias: { "virtual:pwa-register": fileURLToPath(new URL("./src/test/pwa-register.mock.ts", import.meta.url)) },
  },
});
```

- [ ] **Step 12: Register from `main.tsx`**

Replace `apps/festival/src/main.tsx` with:

```tsx
import "./design/tokens.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { setupServiceWorker } from "./app/sw";

setupServiceWorker();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 13: Build and verify the precache**

Run: `npm run typecheck && npm test && BASE_PATH=/festival-app/ npm run build`
Expected: tests PASS; the build log ends with a `PWA v1.3.0` block listing `precache  N entries (X KiB)`. Then:

```bash
ls dist/sw.js dist/workbox-*.js dist/manifest.webmanifest && node -e "const m=JSON.parse(require('fs').readFileSync('dist/manifest.webmanifest','utf8'));console.log(m.name,m.start_url,m.scope,m.icons.length)"
```

Expected: the three files exist; prints `Telluride Blues & Brews /festival-app/ /festival-app/ 4`. The precache KiB figure must be ≤ 2930 KiB (3,000,000 bytes); record the number for the HANDOFF in Task 7. Also `grep -c 'art/.*\.png' dist/sw.js` prints `0`.

- [ ] **Step 14: Commit**

```bash
git add apps/festival/package.json package-lock.json apps/festival/vite.config.ts apps/festival/tsconfig.json apps/festival/src/state/updates.ts apps/festival/src/state/updates.test.ts apps/festival/src/test/pwa-register.mock.ts apps/festival/src/app/sw.ts apps/festival/src/app/sw.test.ts apps/festival/src/main.tsx
git commit -m "feat(pwa): workbox precache via vite-plugin-pwa with prompt-mode updates"
```

---

### Task 5: Update banner

**Files:**
- Create: `apps/festival/src/app/UpdateBanner.tsx`, `apps/festival/src/app/UpdateBanner.test.tsx`
- Modify: `apps/festival/src/app/TabShell.tsx`

**Interfaces:**
- Consumes: `useUpdateStore` (Task 4), `Button`, `useMotionOk` from `@/design`.

- [ ] **Step 1: Write the failing test**

`apps/festival/src/app/UpdateBanner.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UpdateBanner } from "./UpdateBanner";
import { useUpdateStore } from "@/state/updates";

describe("UpdateBanner", () => {
  beforeEach(() => useUpdateStore.getState().reset());

  it("renders nothing until a refresh is needed", () => {
    render(<UpdateBanner />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("shows the copy, applies the update, and dismisses", async () => {
    const apply = vi.fn(async () => {});
    useUpdateStore.getState().setApply(apply);
    useUpdateStore.getState().setNeedRefresh();
    render(<UpdateBanner />);
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Update");
    expect(status).toHaveTextContent("A fresh festival guide is ready.");
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    expect(apply).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("dismiss button keeps a 44px hit area", () => {
    useUpdateStore.getState().setNeedRefresh();
    render(<UpdateBanner />);
    expect(screen.getByRole("button", { name: "Dismiss" }).className).toMatch(/h-11 w-11/);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- src/app/UpdateBanner.test.tsx`
Expected: FAIL — cannot resolve `./UpdateBanner`.

- [ ] **Step 3: Write the banner**

`apps/festival/src/app/UpdateBanner.tsx`:

```tsx
import { motion } from "motion/react";
import { Button, useMotionOk } from "@/design";
import { useUpdateStore } from "@/state/updates";

// Sits above the tab bar: checker ribbon 12 px + padding 8 px + tabs 56 px = 76 px, plus 8 px breathing room.
const ABOVE_TABS = "calc(84px + env(safe-area-inset-bottom))";

/** "A fresh festival guide is ready → Refresh". Shown by the service-worker bridge in prompt mode. */
export function UpdateBanner() {
  const ok = useMotionOk();
  const needRefresh = useUpdateStore((s) => s.needRefresh);
  const dismissed = useUpdateStore((s) => s.dismissed);
  const apply = useUpdateStore((s) => s.apply);
  const dismiss = useUpdateStore((s) => s.dismiss);
  if (!needRefresh || dismissed) return null;
  return (
    <motion.div role="status" initial={ok ? { opacity: 0 } : undefined} animate={{ opacity: 1 }} transition={{ duration: ok ? 0.15 : 0 }}
      className="fixed inset-x-0 z-30 mx-auto max-w-[480px] px-4" style={{ bottom: ABOVE_TABS }}>
      <div className="flex items-center gap-3 rounded-card bg-night px-4 py-3 text-paper-light shadow-sheet">
        <div className="min-w-0 flex-1">
          <span className="eyebrow block text-sky-light">Update</span>
          <span className="text-[14px] leading-5">A fresh festival guide is ready.</span>
        </div>
        <Button variant="sun" size="sm" onClick={() => void apply()}>Refresh</Button>
        <button type="button" aria-label="Dismiss" onClick={dismiss} className="grid h-11 w-11 shrink-0 place-items-center text-[18px] text-paper-light/80">✕</button>
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- src/app/UpdateBanner.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Mount it in the shell, with a DEV-only forcing hook**

Replace `apps/festival/src/app/TabShell.tsx` with:

```tsx
import { useEffect } from "react";
import { Outlet, ScrollRestoration } from "react-router";
import { useApplyTheme } from "./theme";
import { TabBar } from "./TabBar";
import { DevClock } from "./DevClock";
import { UpdateBanner } from "./UpdateBanner";
import { useUpdateStore } from "@/state/updates";

export function TabShell() {
  useApplyTheme();
  useEffect(() => {
    // DEV-only: `?update=1` forces the banner so screenshots can capture it.
    if (import.meta.env.DEV && new URLSearchParams(window.location.search).get("update") === "1") useUpdateStore.getState().setNeedRefresh();
  }, []);
  return (
    <div className="mx-auto min-h-dvh max-w-[480px]">
      <main className="px-4 pb-28 safe-t">
        <Outlet />
      </main>
      <UpdateBanner />
      <TabBar />
      {import.meta.env.DEV && <DevClock />}
      <ScrollRestoration getKey={(loc) => loc.pathname.split("/")[1] ?? ""} />
    </div>
  );
}
```

- [ ] **Step 6: Check it in the browser**

Run: `npm run dev`, open http://localhost:5173/?update=1 — the night banner sits above the tab bar; Refresh is sun-colored; ✕ hides it. Open http://localhost:5173/ — no banner. Stop the server.

- [ ] **Step 7: Full checks and commit**

Run: `npm run typecheck && npm test` — Expected: PASS.

```bash
git add apps/festival/src/app/UpdateBanner.tsx apps/festival/src/app/UpdateBanner.test.tsx apps/festival/src/app/TabShell.tsx
git commit -m "feat(pwa): update banner above the tab bar"
```

---

### Task 6: Install nudge and offline-ready provenance on Info

**Files:**
- Create: `apps/festival/src/platform/install.ts`, `apps/festival/src/platform/install.test.ts`
- Create: `apps/festival/src/features/info/InstallSheet.tsx`
- Modify: `apps/festival/src/features/info/InfoScreen.tsx`
- Modify: `apps/festival/src/features/info/InfoScreen.test.tsx`
- Modify: `apps/festival/src/main.tsx`

**Interfaces:**
- Produces: `captureInstallPrompt(target?: Window)`, `isStandalone(w?: Window)`, `isIosSafari(nav?: Navigator)`, `installMode(): InstallMode`, `useInstall(): { mode: InstallMode; prompt(): Promise<void> }`, `_resetInstallForTests()`.
- Consumes: `useUpdateStore.offlineReady` (Task 4), `Sheet`, `Button`, `Card`, `Eyebrow` from `@/design`.

- [ ] **Step 1: Write the failing platform test**

`apps/festival/src/platform/install.test.ts`:

```ts
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { _resetInstallForTests, captureInstallPrompt, installMode, isIosSafari, isStandalone, useInstall } from "./install";

const IOS_SAFARI = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const IOS_CHROME = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/125.0 Mobile/15E148 Safari/604.1";
const ANDROID = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Mobile Safari/537.36";

function nav(userAgent: string, extra: Partial<Navigator> = {}): Navigator {
  return { userAgent, platform: "iPhone", maxTouchPoints: 5, ...extra } as Navigator;
}
function win(standalone: boolean): Window {
  return { matchMedia: () => ({ matches: standalone }) as MediaQueryList, navigator: {} as Navigator } as unknown as Window;
}

describe("install platform", () => {
  beforeEach(() => _resetInstallForTests());
  afterEach(() => vi.unstubAllGlobals());

  it("detects standalone via display-mode or navigator.standalone", () => {
    expect(isStandalone(win(true))).toBe(true);
    expect(isStandalone(win(false))).toBe(false);
    const legacy = { matchMedia: () => ({ matches: false }) as MediaQueryList, navigator: { standalone: true } } as unknown as Window;
    expect(isStandalone(legacy)).toBe(true);
  });

  it("detects iOS Safari but not iOS Chrome or Android", () => {
    expect(isIosSafari(nav(IOS_SAFARI))).toBe(true);
    expect(isIosSafari(nav(IOS_CHROME))).toBe(false);
    expect(isIosSafari(nav(ANDROID, { platform: "Linux armv8l" }))).toBe(false);
    expect(isIosSafari(nav("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.5 Safari/605.1.15", { platform: "MacIntel", maxTouchPoints: 5 }))).toBe(true);
  });

  it("mode is none by default, prompt after beforeinstallprompt, installed when standalone", () => {
    vi.stubGlobal("navigator", nav(ANDROID, { platform: "Linux armv8l" }));
    expect(installMode()).toBe("none");
    const target = new EventTarget() as unknown as Window;
    captureInstallPrompt(target);
    const ev = Object.assign(new Event("beforeinstallprompt", { cancelable: true }), { prompt: vi.fn(async () => {}), userChoice: Promise.resolve({ outcome: "accepted" as const }) });
    target.dispatchEvent(ev);
    expect(installMode()).toBe("prompt");
    expect(ev.defaultPrevented).toBe(true);
    vi.stubGlobal("matchMedia", () => ({ matches: true }) as MediaQueryList);
    expect(installMode()).toBe("installed");
  });

  it("useInstall re-renders on capture and prompt() consumes the event", async () => {
    vi.stubGlobal("navigator", nav(ANDROID, { platform: "Linux armv8l" }));
    const target = new EventTarget() as unknown as Window;
    captureInstallPrompt(target);
    const { result } = renderHook(() => useInstall());
    expect(result.current.mode).toBe("none");
    const prompt = vi.fn(async () => {});
    act(() => { target.dispatchEvent(Object.assign(new Event("beforeinstallprompt", { cancelable: true }), { prompt, userChoice: Promise.resolve({ outcome: "dismissed" as const }) })); });
    expect(result.current.mode).toBe("prompt");
    await act(() => result.current.prompt());
    expect(prompt).toHaveBeenCalledTimes(1);
    expect(result.current.mode).toBe("none");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- src/platform/install.test.ts`
Expected: FAIL — cannot resolve `./install`.

- [ ] **Step 3: Write the platform module**

`apps/festival/src/platform/install.ts`:

```ts
import { useEffect, useState } from "react";

/**
 * Web install affordances behind a small interface (Capacitor builds get a no-op later):
 * captures `beforeinstallprompt` (Chromium), detects standalone mode and iOS Safari (manual
 * Add to Home Screen), and exposes a hook for the Info screen.
 */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export type InstallMode = "installed" | "prompt" | "ios" | "none";

let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

export function captureInstallPrompt(target: Window = window): void {
  target.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    notify();
  });
  target.addEventListener("appinstalled", () => {
    deferred = null;
    notify();
  });
}

export function isStandalone(w: Window = window): boolean {
  const nav = w.navigator as Navigator & { standalone?: boolean };
  return w.matchMedia?.("(display-mode: standalone)").matches === true || nav.standalone === true;
}

export function isIosSafari(nav: Navigator = navigator): boolean {
  const ua = nav.userAgent;
  const iDevice = /iPhone|iPad|iPod/i.test(ua) || (nav.platform === "MacIntel" && nav.maxTouchPoints > 1);
  return iDevice && /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS/i.test(ua);
}

export function installMode(): InstallMode {
  if (isStandalone()) return "installed";
  if (deferred) return "prompt";
  if (isIosSafari()) return "ios";
  return "none";
}

export function useInstall(): { mode: InstallMode; prompt: () => Promise<void> } {
  const [mode, setMode] = useState<InstallMode>(installMode);
  useEffect(() => {
    const l = () => setMode(installMode());
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  return {
    mode,
    prompt: async () => {
      const ev = deferred;
      if (!ev) return;
      await ev.prompt();
      await ev.userChoice;
      deferred = null;
      setMode(installMode());
    },
  };
}

export function _resetInstallForTests(): void {
  deferred = null;
  listeners.clear();
}
```

- [ ] **Step 4: Run the platform test to verify it passes**

Run: `npm test -- src/platform/install.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Write the failing Info tests**

Append to `apps/festival/src/features/info/InfoScreen.test.tsx`. Add `vi`, `afterEach` to the vitest import, `act` to the `@testing-library/react` import, and these lines directly under the imports (module mocks are hoisted; spying on ESM namespace exports is not reliable, so the whole platform module is replaced):

```tsx
import { useUpdateStore } from "@/state/updates";
import type { InstallMode } from "@/platform/install";

const installMock = vi.hoisted(() => ({ mode: "none" as InstallMode, prompt: vi.fn(async () => {}) }));
vi.mock("@/platform/install", () => ({
  useInstall: () => ({ mode: installMock.mode, prompt: installMock.prompt }),
}));
```

Then the tests:

```tsx
describe("Info · get the app", () => {
  afterEach(() => { installMock.mode = "none"; installMock.prompt.mockClear(); useUpdateStore.getState().reset(); });

  it("hides the card when installed or unsupported", async () => {
    installMock.mode = "installed";
    renderAt("/info");
    await screen.findByText(/11:30 AM daily/);
    expect(screen.queryByText("Get the app")).not.toBeInTheDocument();
  });

  it("prompts on Chromium", async () => {
    installMock.mode = "prompt";
    renderAt("/info");
    fireEvent.click(await screen.findByRole("button", { name: "Add to Home Screen" }));
    expect(installMock.prompt).toHaveBeenCalledTimes(1);
  });

  it("opens the iOS steps sheet on Safari", async () => {
    installMock.mode = "ios";
    renderAt("/info");
    fireEvent.click(await screen.findByRole("button", { name: "Add to Home Screen" }));
    const dialog = screen.getByRole("dialog", { name: "Add to Home Screen" });
    expect(dialog).toHaveTextContent("Tap Share");
    expect(dialog).toHaveTextContent("Tap Add");
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("footer says offline-ready once the worker is active", async () => {
    renderAt("/info");
    expect(await screen.findByText(/app 0\.1\.0$/)).toBeInTheDocument();
    act(() => useUpdateStore.getState().setOfflineReady());
    expect(screen.getByText(/offline-ready ✓$/)).toBeInTheDocument();
  });
});
```



- [ ] **Step 6: Run to verify they fail**

Run: `npm test -- src/features/info/InfoScreen.test.tsx`
Expected: the four new tests FAIL (no card, no sheet, no suffix); the existing two still pass.

- [ ] **Step 7: Write the sheet**

`apps/festival/src/features/info/InstallSheet.tsx`:

```tsx
import { Button, Eyebrow, Sheet } from "@/design";

const STEPS = ["Tap Share", "Scroll to Add to Home Screen", "Tap Add"] as const;

/** iOS Safari has no install prompt; walk the fan through Share → Add to Home Screen. */
export function InstallSheet({ onClose }: { onClose: () => void }) {
  return (
    <Sheet onClose={onClose} title="Add to Home Screen">
      <Eyebrow tone="structure">Get the app</Eyebrow>
      <h2 className="mt-1 font-display text-[24px] leading-7 text-structure-2">Add to Home Screen</h2>
      <p className="mt-2 text-[14px] leading-5 text-fg-soft">Then it opens full-screen and works offline at the venue.</p>
      <ol className="mt-4 space-y-3">
        {STEPS.map((step, i) => (
          <li key={step} className="flex items-center gap-3 text-[15px]">
            <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-chip bg-structure-fill font-semibold text-structure-2">{i + 1}</span>
            <span>
              {i === 0 && <ShareGlyph />}
              {step}
            </span>
          </li>
        ))}
      </ol>
      <Button variant="ink" full className="mt-6" onClick={onClose}>Done</Button>
    </Sheet>
  );
}

function ShareGlyph() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="mr-1.5 inline-block h-5 w-5 align-[-4px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v12M8 7l4-4 4 4" />
      <path d="M5 11v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8" />
    </svg>
  );
}
```

- [ ] **Step 8: Wire the Info screen**

In `apps/festival/src/features/info/InfoScreen.tsx`:

Add imports:

```ts
import { InstallSheet } from "./InstallSheet";
import { useInstall } from "@/platform/install";
import { useUpdateStore } from "@/state/updates";
import { Button } from "@/design";   // merge into the existing "@/design" import line
```

Inside `InfoScreen()` after the existing `useState` lines add:

```ts
  const install = useInstall();
  const offlineReady = useUpdateStore((s) => s.offlineReady);
  // DEV-only: `?install=ios` forces the iOS path with the sheet open, for screenshots.
  const forcedIos = import.meta.env.DEV && new URLSearchParams(window.location.search).get("install") === "ios";
  const [installSheet, setInstallSheet] = useState(forcedIos);
  const installMode = forcedIos ? "ios" : install.mode;
```

Insert between the festival facts `</Card>` and the `Official links` eyebrow:

```tsx
      {(installMode === "prompt" || installMode === "ios") && (
        <>
          <Eyebrow tone="structure" className="mt-4 block px-0.5">Get the app</Eyebrow>
          <Card className="mt-1.5 flex items-center gap-3">
            <div className="flex-1 text-[14px] leading-5 text-fg-soft">Works offline at the venue once it's on your home screen.</div>
            <Button variant="ink" size="sm" className="shrink-0" onClick={() => (installMode === "prompt" ? void install.prompt() : setInstallSheet(true))}>Add to Home Screen</Button>
          </Card>
        </>
      )}
      {installSheet && <InstallSheet onClose={() => setInstallSheet(false)} />}
```

Change the footer's last line to:

```tsx
        {" · updated "}{formatTime(parseIso(status.updatedAt ?? meta.publishedAt))} · app {__APP_VERSION__}{offlineReady && " · offline-ready ✓"}
```

- [ ] **Step 9: Capture the prompt at startup**

In `apps/festival/src/main.tsx` add `import { captureInstallPrompt } from "./platform/install";` and call `captureInstallPrompt();` on the line before `setupServiceWorker();`.

- [ ] **Step 10: Run the Info tests to verify they pass**

Run: `npm test -- src/features/info/InfoScreen.test.tsx`
Expected: PASS (6 tests).

- [ ] **Step 11: Browser check, full checks, commit**

Run: `npm run dev`, open http://localhost:5173/info?install=ios — the sheet with three steps is open; Done closes it and the "Get the app" card remains. Stop the server.

Run: `npm run typecheck && npm test` — Expected: PASS.

```bash
git add apps/festival/src/platform/install.ts apps/festival/src/platform/install.test.ts apps/festival/src/features/info/InstallSheet.tsx apps/festival/src/features/info/InfoScreen.tsx apps/festival/src/features/info/InfoScreen.test.tsx apps/festival/src/main.tsx
git commit -m "feat(info): Add to Home Screen nudge and offline-ready provenance"
```

---

### Task 7: Offline end-to-end check, screenshots, docs

**Files:**
- Create: `apps/festival/playwright.offline.config.ts`, `apps/festival/e2e/offline.spec.ts`
- Modify: `apps/festival/package.json` (scripts), `apps/festival/tsconfig.json` (include)
- Modify: `apps/festival/e2e/screenshots.spec.ts`
- Modify: `(root) docs/HANDOFF.md`, `(root) CLAUDE.md`

**Interfaces:**
- Consumes: the built `dist/` from Task 4, the DEV hooks `?update=1` (Task 5) and `?install=ios` (Task 6).

- [ ] **Step 1: Offline Playwright config**

`apps/festival/playwright.offline.config.ts`:

```ts
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
```

Add to `apps/festival/package.json` scripts:

```json
    "e2e:offline": "VITE_DATA_SOURCE=bundled npm run build && playwright test --config playwright.offline.config.ts",
```

Add `"playwright.offline.config.ts"` to `include` in `apps/festival/tsconfig.json`.

Also exclude the offline spec from the screenshot run: in `apps/festival/playwright.config.ts` add `testIgnore: /offline\.spec\.ts/,` after `testDir`.

- [ ] **Step 2: Write the offline spec**

`apps/festival/e2e/offline.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("airplane-mode reload still renders the lineup and says offline-ready", async ({ page, context }) => {
  await page.goto("/");
  // Wait for the worker to control the page and finish precaching.
  await page.waitForFunction(() => navigator.serviceWorker?.controller != null || false, null, { timeout: 60_000 }).catch(async () => {
    await page.reload();
    await page.waitForFunction(() => navigator.serviceWorker?.controller != null, null, { timeout: 60_000 });
  });
  await page.waitForFunction(async () => (await caches.keys()).some((k) => k.startsWith("workbox-precache")), null, { timeout: 60_000 });

  await context.setOffline(true);
  await page.goto("/lineup");
  await expect(page.getByText("Myron Elkins")).toBeVisible();   // Friday noon set; Friday is the default day before the festival
  await page.goto("/info");
  await expect(page.getByText(/offline-ready ✓/)).toBeVisible();
  await context.setOffline(false);
});
```

- [ ] **Step 3: Run it**

Run: `npm run e2e:offline`
Expected: build output with the PWA block, then `1 passed`. If the first attempt reports the precache never appearing, run `npx vite preview --port 4173` manually, open http://localhost:4173/ in Chromium, check DevTools → Application → Service Workers, and fix the config before retrying — do not loosen the assertions.

- [ ] **Step 4: Screenshot additions**

Append to `apps/festival/e2e/screenshots.spec.ts`:

```ts
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
```

Run: `npm run screenshots -- -g "update-banner|install-sheet"`
Expected: 2 passed; two new PNGs in `docs/screens/design-pass/`. Open both and confirm the banner sits above the tab bar and the sheet lists three steps.

- [ ] **Step 5: Docs**

In `(root) docs/HANDOFF.md`:
- Status board row `| Plan / Alerts / Info / PWA | 🟡 | …` → `| Plan / Alerts / Info / PWA | ✅ Sep 10 | Plan/Alerts/Info at rough fidelity; PWA: Workbox precache (<precache KiB from Task 4 step 13> KiB), prompt-mode update banner, Info "Get the app" nudge (Chromium prompt / iOS sheet), offline e2e \`npm run e2e:offline\` |`
- Row `| Art budget | ⚠️ open | …` → `| Art budget | ✅ Sep 10 | \`public/art\` WebP 0.97 MB (lockup lossless), fonts WOFF2 0.35 MB; regenerate with \`npm run art:build\` / \`fonts:build\` / \`icons:build\`; PSD-derived icon still to replace the code-drawn sun |`
- In the commands section add: `npm run art:build · fonts:build · icons:build   # regenerate committed assets (cwebp, woff2_compress, Playwright)` and `npm run e2e:offline                      # build + airplane-mode Playwright check (local only)`.

In `(root) CLAUDE.md` Commands line append: `· npm run e2e:offline · art:build · fonts:build · icons:build` and add a rule bullet: `- Generated assets (WebP art, WOFF2 fonts, icon PNGs) are committed; regenerate with the scripts, never hand-edit. The service worker never registers in dev/tests (D-022).`

- [ ] **Step 6: Full checks and commit**

Run (from `apps/festival`): `npm run typecheck && npm test` — Expected: PASS.

```bash
git add apps/festival/playwright.offline.config.ts apps/festival/playwright.config.ts apps/festival/e2e/offline.spec.ts apps/festival/e2e/screenshots.spec.ts apps/festival/package.json apps/festival/tsconfig.json docs/screens/design-pass/live-light-update-banner.png docs/screens/design-pass/pre-light-info-install-sheet.png docs/HANDOFF.md CLAUDE.md
git commit -m "test(pwa): offline e2e, banner and install screenshots; docs"
```

---

## Self-review notes

- Spec §4–§8 each map to Tasks 1–6; §9 testing to every task's tests plus Task 7; §11 DoD items 1–3 and 5 are covered by Tasks 1–7, item 4 (Pages install/update check) is a manual post-deploy step recorded in HANDOFF by the controller.
- The spec's `window.__bbForceUpdateBanner()` hook is implemented as the DEV-only `?update=1` query (Task 5) to match the `?install=ios` mechanism; both are guarded by `import.meta.env.DEV`.
- Names are consistent across tasks: `useUpdateStore`, `setupServiceWorker`, `captureInstallPrompt`, `useInstall`, `InstallSheet`, `UpdateBanner`, scripts `art:build`, `fonts:build`, `icons:build`, `e2e:offline`.
