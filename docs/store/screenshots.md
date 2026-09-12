# Store screenshot plan — Telluride Blues & Brews

## Generate the store-ready assets

`npm run store:shots` (from `apps/festival`) runs `apps/festival/e2e/store-shots.spec.ts` against
`apps/festival/playwright.store.config.ts` — a dedicated Playwright config (own dev-server-backed
projects, doesn't touch `npm run screenshots` or `npm run e2e:offline`). It boots the dev server
(`VITE_DATA_SOURCE=bundled`), captures each of the six screens below at the exact device pixel size
for both targets, composites the paper/caption frame around each raw capture in-browser, and writes:

- `docs/store/shots/ios-6.9/01-now.png` … `06-offline.png` — 1320×2868 (iPhone 6.9")
- `docs/store/shots/android-phone/01-now.png` … `06-offline.png` — 1080×2340 (Android phone)
- `docs/store/shots/play-feature-1024x500.png` — 1024×500 Play feature graphic (paper background, official lockup, no text)

Re-run it any time the underlying screens or content change; the generated PNGs are committed
(they're the deliverable), so regenerate and re-commit deliberately rather than by CI.

Source states already exist: `apps/festival/e2e/screenshots.spec.ts` produces raw device-size screenshots into `docs/screens/design-pass/*.png` at three dev-clock states (`pre`/`live`/`post`) × two themes (`light`/`dark`) × six views (`now`, `lineup-list`, `plan`, `alerts`, `info`, `artist`), plus one-off variants (`live-light-lineup-grid`, `live-light-update-banner`, `pre-light-info-install-sheet`). These are review/design screenshots, not store-final assets — no captions, no device frame, and taken at whatever viewport Playwright's default project uses, not store-required pixel dimensions. This file plans the store-ready set; it does not add the generation script.

## Required sizes

Confirmed against Apple's current App Store Connect screenshot spec (checked 2026-09-11 — re-verify before upload, Apple has changed these lists before):

| Platform | Size | Status |
|---|---|---|
| iPhone 6.9" | **1320×2868** portrait (also accepted: 1290×2796, 1260×2736) | **Required.** This is now the only iPhone size Apple requires — supplying it lets Apple auto-scale down to every smaller iPhone size shown in the store. |
| iPhone 6.5" | 1284×2778 or 1242×2688 portrait | **Optional.** Only becomes mandatory if the 6.9" set is not supplied. STORE-CHECKLIST §3 already lists it as optional — this plan follows that: skip 6.5" for v1 unless the 6.9" upload is rejected for some reason. |
| iPad | — | Not needed — iPhone-only for v1 (`TARGETED_DEVICE_FAMILY = 1`, STORE-CHECKLIST §0). |
| Android phone | **1080×2340** portrait, PNG/JPG ≤ 8 MB, 2–8 images | Required (STORE-CHECKLIST §3). |
| Play feature graphic | 1024×500, no transparency | Required for a featured/promoted listing (STORE-CHECKLIST §3). |

## Proposed frame

- **Background**: `paper` token (`#EBD5B3`, D-016) with the existing 5% grain texture used throughout the app, so the frame reads as an extension of the app rather than a separate marketing layer.
- **Caption band**: a fixed-height band at the top or bottom of the canvas (not overlapping the device screenshot), caption set in **Michroma** (the app's wide-label/eyebrow face, D-010) in `ink` on `paper`, matching how the app itself labels sections — no new typography introduced for marketing.
- **Device frame**: optional. A plain rounded-rect crop of the raw screenshot (no literal iPhone/Android bezel PNG) keeps focus on the UI and avoids needing frame assets per device generation; add a hardware frame only if a later review of the six captioned comps looks bare. Do not add a checkerboard-ribbon or rainbow-arch ornament behind the device — those are reserved in-app signature ornaments (PLAN §5.4) and would compete with the caption band at thumbnail size.
- Same six screens are recommended for both stores' screenshot sets — Apple allows up to 10, Play requires 2–8; six lets one set serve both without editing per-store.

## Six proposed screens and captions (≤ 8 words each, no invented facts)

Sourced from the existing states already captured in `docs/screens/design-pass/` — the app states referenced are real, verified sets and real UI, not mockups.

| # | Source screenshot(s) | Caption |
|---|---|---|
| 1 | `live-light-now.png` (or `live-dark-now.png`) — Now tab, live festival state | **Know what's on, right now.** |
| 2 | `live-light-lineup-grid.png` — Lineup, stage timeline grid view | **Every stage, one schedule.** |
| 3 | `live-light-artist.png` — artist detail sheet with favorite/heart | **Favorite the sets you want.** |
| 4 | `live-light-plan.png` (pick a favorites set that shows a resolved conflict once seeded, per STORE-CHECKLIST §3's suggested set: "Plan with a resolved conflict") | **See conflicts before they happen.** |
| 5 | `live-light-alerts.png` | **Alerts straight from the organizer.** |
| 6 | `pre-dark-now.png` or `live-dark-now.png` — dark mode / pre-festival countdown | **Works offline, even at altitude.** |

Caption word counts: 6, 4, 5, 5, 5, 6 — all ≤ 8 words. None reference artist names, prices, or v1.1 features (Brews, map); "Works offline, even at altitude" is a true, verified product fact (PLAN §1 constraints, §3.5 offline strategy), not marketing invention.

## Notes

- Screenshot #4's conflict is real, not staged: `sat-charlie-musselwhite-ga20-main-1630` (16:30–17:40) and `sat-albert-white-blues-1730` (17:30–18:30) genuinely overlap by 10 minutes — verified directly against `packages/content/content-2026.json` start/end times. `store-shots.spec.ts` seeds both (plus two more favorites for a fuller Plan list) and sets an explicit `resolutions` entry keeping Charlie Musselwhite, so the shot shows an explicitly *resolved* conflict (solid "keeping…" row + dashed "Swap" row), per `apps/festival/src/state/plan.ts` / `apps/festival/src/domain/conflicts.ts`.
- The generator is implemented: `apps/festival/e2e/store-shots.spec.ts` + `apps/festival/playwright.store.config.ts`. See "Generate the store-ready assets" above for the command and output paths.
- Feature graphic (1024×500) is a separate, single asset (not a screenshot): paper background + grain, the official lockup (`apps/festival/public/art/lockup.webp`, unmodified) centered at ~70% width, no text.
