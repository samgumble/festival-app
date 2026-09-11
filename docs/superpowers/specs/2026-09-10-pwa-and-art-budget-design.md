# PWA shell + art budget (spec)

**Date:** 2026-09-10 · **Owner:** Sam Gumble · **Status:** approved in conversation ("keep going"), written up for the record
**Scope:** the fan app on GitHub Pages becomes an installable, offline-capable PWA with an update banner and an install nudge; poster art is converted to WebP and the precache is kept under budget. No push, no Capacitor, no Blaze.

Companion docs: `docs/PLAN.md` §3.5 (offline strategy, budget, update banner), `docs/ASSET-BRIEF.md` §2 (icon composition), `docs/DECISIONS.md` D-022 (this phase), the live-backend spec for the data seams this builds on.

---

## 1. Goal

A fan who opens https://samgumble.github.io/festival-app/ once can add it to their home screen, open it in airplane mode at the venue, and see the full lineup, their plan, and the last alerts. When SBG publishes new content while the app shell has changed, the fan sees "A fresh festival guide is ready → Refresh". Total precache ≤ 3 MB.

## 2. Decisions made in this session

| # | Decision |
|---|---|
| P-1 | Service worker via **`vite-plugin-pwa` 1.3.0 in `generateSW` mode**, `registerType: "prompt"` (update banner, no silent reload), `cleanupOutdatedCaches`, `navigateFallback: index.html` scoped to the Vite base. No runtime caching rules: Firestore's SDK persistence owns data; everything else is precached. Logged as **D-022**. |
| P-2 | **WebP art is committed** next to the PNG sources and produced by `npm run art:build` (Homebrew `cwebp`; no `sharp`, which isn't on the approved list). Opaque hero layers lossy q82; every alpha file lossless. The official lockup stays lossless because the rules say logo lockups ship unmodified. Measured: 3.2 MB → 0.95 MB. |
| P-3 | **Interim code-drawn icon**: one SVG sun (disc + 12 rays in `sun`/`sun-hot`) on the `sky → night` vertical gradient from ASSET-BRIEF §2, rasterized by a Playwright script (already a dev dependency) to 192, 512, 512-maskable, 180 apple-touch. Swapping in the PSD-derived icon later is a file replacement, no code change. |
| P-4 | Install nudge lives on **Info** only (no interstitials): `beforeinstallprompt` where supported, a Share → Add to Home Screen sheet on iOS Safari, nothing when already standalone. |
| P-5 | **Fonts ship as WOFF2** produced by `npm run fonts:build` (Homebrew `woff2_compress`, installed 2026-09-10); the OFL TTF sources and `OFL.txt` stay in the repo (OFL permits format conversion; the files are not renamed with the Reserved Font Names). Measured: 1,013 kB TTF → 350 kB WOFF2. |
| P-6 | Service worker registration is **off in dev, tests, and Playwright screenshots** (they run on the dev server); a separate Playwright config runs the offline check against `vite preview` of a real build. |

## 3. Out of scope

Push/FCM, background sync, Capacitor, periodic content prefetch beyond Firestore's cache, App Store assets (ASSET-BRIEF §2 rows 1–4, 6–7), custom domain, share-target, shortcuts in the manifest.

## 4. Art budget

- Script `apps/festival/scripts/art-build.ts` (Node, spawns `cwebp`): for every `public/art/*.png` produce `public/art/<name>.webp`; files whose PNG has alpha (`sips -g hasAlpha` / list in the script) use `-lossless`, others `-q 82`. Prints a size table and **fails (exit 1) if `public/art/*.webp` totals more than 1,000,000 bytes**.
- npm script `art:build` in `apps/festival`. Outputs are committed. PNG sources stay in the repo as the editable originals under `apps/festival/assets-src/art/` (moved out of `public/` in the final review so Vite never serves them; the `globIgnores` for `art/*.png` remains as a guard).
- App references switch to `.webp`: `Hero.tsx` (sky, mountains-near, foreground, lockup), `InfoScreen.tsx` (lockup in the festival card, sbg), any other `art/*.png` reference found by grep. No `<picture>` fallback (WebP is universal on the supported browsers: iOS 14+, Chrome, Firefox, Edge).
- Budget check in CI: the Vite build's precache manifest total must be ≤ 3,000,000 bytes; `vite-plugin-pwa`'s `maximumFileSizeToCacheInBytes` stays default (2 MiB per file), and a unit test on the build output isn't required — the `art:build` guard plus the plugin's per-file cap are the guards.

Measured on 2026-09-10 (bytes): sky 187,706 · mountains-near 154,100 · foreground 133,168 · lockup 380,806 (lossless) · dates 82,308 · sbg 30,082 → 968,170 total.

**Fonts.** `apps/festival/scripts/fonts-build.ts` runs `woff2_compress` on every `public/fonts/*/*.ttf`, writing the `.woff2` beside it (Bungee 40,528 · Bungee Shade 81,612 · Michroma 26,384 · DM Sans 89,116 · DM Sans Italic 112,616 → 350,256). `fonts.css` switches each `src` to `url(".../X.woff2") format("woff2")`. TTFs are kept as sources under `apps/festival/assets-src/fonts/<family>/` (with a copy of `OFL.txt`; the served `public/fonts/<family>/OFL.txt` stays beside the WOFF2) and excluded from the precache glob. npm script `fonts:build`; outputs committed.

Precache estimate: JS ~1.13 MB (main ~600 kB + Firebase chunk ~534 kB, stored uncompressed) + art 0.97 MB + fonts 0.35 MB + CSS 34 kB + icons ≈ 60 kB + HTML/manifest ≈ **2.55 MB** (budget 3 MB).

## 5. Manifest and icons

`vite-plugin-pwa` `manifest` option (the plugin prefixes `start_url`/`scope`/icon paths with the Vite base, so GitHub Pages' `/festival-app/` works untouched):

```
name: "Telluride Blues & Brews"      short_name: "Blues & Brews"
description: "Official festival guide: lineup, your plan, alerts."
display: "standalone"   orientation: "portrait"   start_url: "./"   scope: "./"
background_color: "#EBD5B3" (paper)   theme_color: "#1A4A80" (night)   lang: "en"   id: "./"
icons: icon-192.png (192, any) · icon-512.png (512, any) · icon-512-maskable.png (512, maskable) · apple-touch-icon-180.png (180)
```

Icons come from `apps/festival/scripts/icons.ts`: loads `apps/festival/public/icons/icon.svg` in headless Chromium, renders it at each size (maskable variant scales the artwork to 80 % inside the full-bleed gradient so it survives the safe-zone crop), writes the PNGs to `public/icons/`. npm script `icons:build`. Outputs committed. `favicon.svg` is the same SVG. `index.html` gains: `<link rel="icon" href="/favicon.svg">`, `<link rel="apple-touch-icon" href="/icons/apple-touch-icon-180.png">`, `<meta name="apple-mobile-web-app-capable" content="yes">`, `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`, `<meta name="apple-mobile-web-app-title" content="Blues & Brews">` (Vite rewrites these `/` hrefs for the base path at build time because they are in `index.html`).

## 6. Offline shell (service worker)

Vite config additions:

```ts
VitePWA({
  registerType: "prompt",
  injectRegister: false,                 // we call registerSW ourselves (src/app/sw.ts)
  manifest: { …§5 },
  includeAssets: ["favicon.svg", "icons/*.png", "fonts/**/*.woff2", "art/*.webp"],   // public/ files to precache
  workbox: {
    globPatterns: ["**/*.{js,css,html,svg,webp,woff2,png}"],
    globIgnores: ["art/*.png", "fonts/**/*.ttf", "fonts/**/OFL.txt"],
    navigateFallback: `${base}index.html`,
    navigateFallbackDenylist: [/^\/design/],   // dev-only gallery route never precached
    cleanupOutdatedCaches: true,
    clientsClaim: true,                  // skipWaiting stays false → prompt flow
  },
  devOptions: { enabled: false },
})
```

`src/app/sw.ts` exports `setupServiceWorker(): void`: no-op when `import.meta.env.DEV`, `import.meta.env.MODE === "test"`, or `!("serviceWorker" in navigator)`; otherwise calls `registerSW({ immediate: false, onNeedRefresh, onOfflineReady, onRegisterError })` from `virtual:pwa-register` and wires the callbacks into the update store. `immediate: false` (final review, 2026-09-10): revisioned precache entries (art, fonts, icons) are fetched a second time at install under a `__WB_REVISION__` cache key, so precaching waits for the window `load` event rather than racing first paint. Called once from `main.tsx`.

Bundled content is already inside the JS bundle (`bundled.json` import), so a first launch with no network after install renders everything; Firestore persistence supplies the last live content on later launches. The GitHub Pages `404.html` copy stays in the workflow for first (uncached) deep-link loads; once the worker controls the page, `navigateFallback` serves `index.html` for every in-scope navigation.

## 7. Update banner

- `src/state/updates.ts`: zustand store (not persisted) `{ needRefresh: boolean; offlineReady: boolean; dismissed: boolean; apply: () => Promise<void> | void; setNeedRefresh(fn) ; setOfflineReady() ; dismiss() }`. `apply` is set by `sw.ts` to `updateSW(true)`.
- `src/app/UpdateBanner.tsx`: renders only when `needRefresh && !dismissed`. Fixed above the tab bar (bottom offset = tab-bar height + safe area), `role="status"`, night background, paper text, Michroma eyebrow "Update", body "A fresh festival guide is ready.", **Refresh** (sun `Button`) and a 44 px ✕ dismiss. Appears without motion (no slide) — the only animation would be a 150 ms fade that is disabled under `prefers-reduced-motion`. Mounted in `TabShell` before `<TabBar />`.
- Dismiss lasts for the session (store, not persisted); the banner returns on the next `needRefresh` event or next launch.

## 8. Install nudge + provenance

- `src/platform/install.ts`: module-level `beforeinstallprompt` capture (`window.addEventListener` at import; event stored), `isStandalone()` (`matchMedia("(display-mode: standalone)").matches || navigator.standalone === true`), `isIosSafari()` (UA `iPhone|iPad|iPod` and not standalone; iPadOS desktop UA detected via `navigator.maxTouchPoints > 1 && platform === "MacIntel"`), `useInstall(): { mode: "installed" | "prompt" | "ios" | "none"; prompt(): Promise<void> }`. Web-only; the same interface gets a Capacitor no-op later (platform code wraps behind interfaces per CLAUDE.md).
- Info screen: new card under the festival card, eyebrow "Get the app", one `Row` "Add to Home Screen" with a `Button` → `prompt()` (mode `prompt`) or opens `InstallSheet` (mode `ios`) built on the existing `Sheet` primitive with three steps: 1 Tap Share (square-and-arrow icon from `icons.tsx`), 2 Scroll to **Add to Home Screen**, 3 Tap **Add**. Card hidden when mode is `installed` or `none`.
- Info footer: `… · app 0.1.0 · offline-ready ✓` when `offlineReady` (set on `onOfflineReady`, or at startup when `navigator.serviceWorker.controller` exists). Otherwise the footer is unchanged.

## 9. Testing

- Unit (Vitest): `sw.test.ts` mocks `virtual:pwa-register` (vitest `alias`) and asserts `setupServiceWorker` registers once in production mode, never in DEV/test, and that `onNeedRefresh` flips the store; `updates.test.ts` for the store; `install.test.ts` for `isStandalone`/`isIosSafari`/`useInstall` modes with stubbed `matchMedia`, UA, and a synthetic `beforeinstallprompt`; `UpdateBanner.test.tsx` (hidden by default, visible on `needRefresh`, Refresh calls `apply`, ✕ dismisses); `InfoScreen` test for the "Get the app" card in each mode and the footer suffix; `art-build` size guard tested by running the script's `checkBudget(sizes)` function in isolation; `fonts.css` asserted (string test) to reference only `.woff2`.
- Playwright: `playwright.offline.config.ts` + `e2e/offline.spec.ts`: `npm run build` (base `/`), `vite preview --port 4173`, load `/`, wait for `navigator.serviceWorker.ready` and precache completion (poll `caches.keys()` until the workbox precache exists and a second load is controlled), `context.setOffline(true)`, `goto('/lineup')`, expect a known set from the bundled fixture to be visible and the Info footer to say "offline-ready ✓". npm script `e2e:offline`. Existing `screenshots.spec.ts` gains two shots: the update banner (forced via `window.__bbForceUpdateBanner()` exposed only when `import.meta.env.DEV`) and the Info "Get the app" card with the iOS sheet open (forced via a `?install=ios` query the Info screen honors only in DEV).
- CI (`pages.yml`): add `npm run e2e:offline` after `npm test`? **No** — Chromium install on the runner costs ~40 s and Pages deploys already gate on unit tests; offline e2e runs locally before merge (documented in HANDOFF §Commands). Revisit when the native pipeline adds a browser step anyway.

## 10. Repo layout

```
apps/festival/
  scripts/art-build.ts, scripts/fonts-build.ts, scripts/icons.ts
  public/fonts/*/*.woff2  (committed, generated)
  public/icons/{icon.svg,icon-192.png,icon-512.png,icon-512-maskable.png,apple-touch-icon-180.png}, public/favicon.svg
  public/art/*.webp  (committed, generated)
  src/app/{sw.ts,UpdateBanner.tsx}, src/state/updates.ts, src/platform/install.ts, src/features/info/InstallSheet.tsx
  e2e/offline.spec.ts, playwright.offline.config.ts
```

## 11. Definition of done

1. `npm run art:build` regenerates the WebP set under 1 MB and `npm run fonts:build` the WOFF2 set; no `.png` art or `.ttf` font is referenced by the app.
2. Production build emits `sw.js`, `workbox-*.js`, `manifest.webmanifest`, icons; the precache manifest totals ≤ 3 MB.
3. `npm run e2e:offline` passes: airplane-mode reload of `/lineup` renders the lineup and Info says "offline-ready ✓".
4. On the Pages deploy: Chrome desktop offers Install; iOS Safari's Info card shows the Add to Home Screen sheet; after a second deploy the update banner appears and Refresh loads the new build.
5. Unit tests green in `festival-app`; HANDOFF status board (PWA row, art-budget row) and DECISIONS (D-022) updated; screenshots refreshed.
