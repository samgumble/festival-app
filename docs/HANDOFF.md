# HANDOFF — Telluride Blues & Brews Festival App

**Read this first in every new session (Claude Code, Codex, Cowork, Fable).** Keep it current: whenever a decision changes or a milestone lands, edit this file and append to `DECISIONS.md` in the same commit.

Last updated: 2026-09-09 (planning session, Fable 5.1 in Cowork) · Next owner: Claude Code (implementation, Day 0–1)

---

## 1. Thirty-second brief

Sam Gumble is building, as a favor for SBG Productions (the festival's producer), the official companion app for the **Telluride Blues & Brews Festival, Sep 18–20, 2026**. Two deliverables:

1. **Fan app** — React 19 + Vite 8 PWA wrapped with Capacitor 8 for iOS and Android. Offline-first. Tabs: Now · Lineup · Plan · Alerts · Info. No fan accounts, no analytics, no ads.
2. **Admin console** — separate React app on Firebase Hosting, Firebase Auth (email/password, 1–3 named SBG staff), edits lineup/schedule in Firestore and sends push alerts through one Cloud Function. Changes reach fans without an app update.

Target: attempt store submission **Mon Sep 14**; the web app on GitHub Pages ships **Sat Sep 12** no matter what. Stores are expected to be fully live before the January 2027 lineup announcement.

This is a **fresh start**. Two earlier prototypes exist in the old `samgumble/music-app` repo (`main` = vanilla JS + Capacitor, `expo-v2` = Expo Router). Do not copy code from them. Do reuse: the verified content data (`data/content.json` on old `main`), the font-license notes (`FONT_LICENSES.md`), and the App Review notes as a starting point.

## 2. Where things are

| Thing | Location |
|---|---|
| Plan, decisions, asset brief, store checklist | `docs/PLAN.md`, `docs/DECISIONS.md`, `docs/ASSET-BRIEF.md`, `docs/STORE-CHECKLIST.md` (this folder) |
| Repo rules for agents | `CLAUDE.md` at repo root |
| Licensed artwork (never commit the PSD) | `SBG Content/` on Sam's Mac: `16x28 commemorative poster.psd` (1.74 GB), `2026-poster-logo-png.png` (800×350 lockup), `2026-Dates-Center.png` (1350×506 sun lockup), `SBG-logo-png.png` (312×312), `poster-preview-1080x1890.png` (flattened derivative) |
| Exported poster layers (as they land) | `apps/festival/public/art/` per naming in `ASSET-BRIEF.md` |
| Old prototype (reference only) | github.com/samgumble/music-app — `main` and `expo-v2` |
| Fan app repo | https://github.com/samgumble/festival-app (public, generic name for now) — this monorepo |
| Admin console repo | https://github.com/samgumble/festival-admin (public; built Day 3, separate from the monorepo per D-018) |
| Firebase project | `bb-festival-2026` (project number 221524343225), **Spark/free plan, no card** — owner sam.gumble@gmail.com. Auth: Email/Password enabled, self sign-up disabled (Sep 10; new admins are added in the console + an `admins/{uid}` doc), admin user sam.gumble@gmail.com (uid `YQlsno0sgAbQZJKRuKB7m1XvCqL2`, allowlisted in `admins/`), authorized domain `samgumble.github.io`. Firestore `(default)` in `nam5`, production rules. Web app `festival-web`; config in `packages/shared/src/firebase.config.ts` |
| Store records | Google Play developer account approved (Sam, Sep 14). Apple Developer Program submitted Aug 31, still pending Sep 14. Record team IDs / app IDs here when created |
| Official content sources | tellurideblues.com `/lineup`, `/schedule`, `/faqs`, the 2026 festival guide news post |
| Claude Project | "Blues and Brews Fable 5.1" — mirrors these docs |

## 3. Status board

| Area | State | Notes |
|---|---|---|
| Plan approved | ✅ Sep 9 | stack, backend, scope, timeline chosen with Sam |
| Repo scaffold | ✅ Sep 9 | npm workspaces: apps/festival, packages/shared, packages/content (`festival-app`) |
| Firebase project + rules | ✅ | `firebase/firestore.rules` deployed to `bb-festival-2026` on 2026-09-10 (`npm run rules:deploy`); 14 emulator tests green (cross-user isolation added Sep 15) (`npm run rules:test`); live probe: `content/published` readable, `content/draft` and `admins/*` denied unauthenticated |
| Design tokens + fonts | ✅ | Palette locked D-016; Tailwind v4 theme; Bungee/Bungee Shade/Michroma/DM Sans bundled |
| Content seed | ✅ Sep 10, re-verified Sep 11 | bundled ✅ (35 artists, 46 sets); Firestore `content/published` re-seeded Sep 15 to v2026.09.15.1 (73 sets; campground sets note "Campers only"; earlier Sep 14 v2026.09.14.2: 46 sets, comedy + Blues Challenge + Truck Stage rename + tickets link; seeded via `npm run seed`; password via env only, e.g. `FIREBASE_ADMIN_PASSWORD="$(pbpaste)" FIREBASE_ADMIN_EMAIL=… npm run seed; pbcopy </dev/null`) — history: `content-2026.json`/`bundled.json` were re-verified against the official schedule Sep 11 and gained 4 comedy sets + the Saturday Blues Challenge Winner slot (11 official items were missing; see `.superpowers/sdd/content-update-report.md`); Sep 14: Truck Stage renamed "Truck Stage by Sierra Nevada®" (D-027), content bumped to v2026.09.14.1 and re-seeded the same day; then v2026.09.14.2 added `links.tickets` (Front Gate) for the Now screen's Get tickets button, re-seeded Sep 14 as well. v2026.09.14.3 (D-031) adds Beer Tasting Sessions, Stand-Up Comedy, and Juke Joints stages (38 artists / 61 sets / 7 stages), re-seeded Sep 14 evening — Firestore matches. v2026.09.14.4 adds `venue` per set; v2026.09.14.5 adds the Special Events stage (45 artists / 73 sets / 8 stages), re-seeded Sep 14 night; v2026.09.14.6 shortens juke/special descriptions, re-seeded Sep 14 night — Firestore matches. v2026.09.14.8 adds `stages[].gridLabel` (Camp / ground / Sessions on three rows), re-seeded Sep 14 late. v2026.09.14.9 drops the 'Juke Joint' / 'Special Event' prefixes from notes, re-seeded Sep 15 — Firestore matches. Heritage Plaza (6 more sets, 2 new artists) is scoped but not implemented — 5th-stage support needed first. |
| Now / Lineup | ✅ design pass | all states via dev clock; screenshots in `docs/screens/design-pass/` |
| Plan / Alerts / Info / PWA | ✅ Sep 10 | Plan/Alerts/Info at rough fidelity; PWA: Workbox precache (2605 KiB (grew by the Capacitor web-fallback chunks)), prompt-mode update banner, Info "Get the app" nudge (Chromium prompt / iOS sheet), offline e2e `npm run e2e:offline`. GitHub Pages serves `sw.js` with `Cache-Control: max-age=600`, so a new build can take up to ~10 min to surface the update banner |
| Admin console | ✅ Sep 9 | https://samgumble.github.io/festival-admin/ (repo `festival-admin`, Pages) — sign-in, lineup editor, alerts incl. scheduled sends (D-026, Sep 14), publish/rollback; no Functions/push (D-021) |
| Live content in fan app | ✅ Sep 10 | Firestore `content/published` + `alerts` behind the repository seams; bundled fallback. Verified live on Pages Sep 10: edit → publish (v2026.09.10.1) → restore (v2026.09.10.2, content identical to seed) reflected in Info within seconds; alert send + delete round-trip through the fan inbox; `history/` holds 2026.09.09.1 and 2026.09.10.1 |
| Web beta live for SBG | ✅ Sep 9 | https://samgumble.github.io/festival-app/ — auto-deploys from `main` via `.github/workflows/pages.yml`; live Firestore content + alerts since Sep 10 |
| Accessibility review | 🟡 Sep 15 | `docs/accessibility/wcag-review-2026-09-15.md` + VPAT 2.5 ACR `vpat-acr-2026-09-15.md` (read-only; 4 blockers: stage-block contrast, sheet focus trap, focus visibility, native text scaling) |
| Compliance | ✅ Sep 12 | `docs/COMPLIANCE.md`: privacy policy live at `/privacy` (in-app + web), third parties named, no fan data collected, rules default-deny (probed), staff email removed from public docs (D-025), axe-core clean in both themes; open: admin MFA (needs Blaze), store placeholders |
| Native shell | ✅ Sep 10 | Capacitor 8 iOS/Android in `apps/festival/{ios,android}` (D-023); reminders = one switch over favorites via local notifications (organizer alerts notify through the same switch while the app runs, D-036); haptics, status bar, splash, icons; simulator-verified. iOS template is SPM-only (no CocoaPods, no `.xcworkspace`; open `ios/App/App.xcodeproj`). Pending: Apple/Play accounts → TestFlight/closed track (STORE-CHECKLIST §1/§7); push needs Blaze (D-021) |
| Publish-readiness review | ✅ Sep 14 | `.superpowers/sdd/publish-readiness-review.md`: 6 blockers fixed (D-029); open for Sam: support email/URL, account ownership → authorization letter, Play category, `history/` docs carrying his email, real-device QA (§6) |
| TestFlight / Play closed test | 🟡 Sep 15 | Upload key created Sep 15 at `~/Keys/bb-upload.jks` (alias `upload`, cert SHA-1 `37:DC:71:8A:19:7A:68:C7:6B:73:9A:41:18:A5:AE:8A:0C:37:78:CA`, SHA-256 `63:59:99:F5:F3:D1:11:E6:BD:7C:8D:C5:A1:31:01:07:B5:97:6B:00:C2:EA:00:BB:05:8D:66:B8:62:BB:AB:47`; password only in Sam's password manager). Signed `app-release.aab` (1.0.0, versionCode 1, targetSdk 36, 5.2 MB) built Sep 15 from commit 21f18dc, copied to `~/Desktop/bb-festival-1.0.0-vc1.aab`, Play app created Sep 15 (console app id 4976193996588986086, package `com.sbgproductions.bluesandbrews`); release 1.0.0 (1) published to Internal testing Sep 15 5:10 PM; **1.0.0 (2) (versionCode 2, sheet swipe/back, campers-only note, juke list, alert notifications) published to Internal testing Sep 15 9:25 PM** — next Android upload must use versionCode 3 to the `SBG internal testers` list (Sam ×2, Patrick, Jacob); tester opt-in link https://play.google.com/apps/internaltest/4701141515910296343 (6 testers: sam.gumble@gmail.com, sbgumble@gmail.com, sgumble@sbgproductions.com, patrick@sbgproductions.com, patrickgshehan@gmail.com, Jacob.Gumble@gmail.com). Main store listing + Store settings (Events, contact via tellurideblues.com) saved Sep 15; all 11 App content declarations saved Sep 15 (privacy URL, app access, ads, content rating ESRB Everyone, target 18+, data safety none, government/financial/health none). Remaining before review: upload versionCode 3, create the production release with countries = United States, then Sam sends for review. Store listing + App content declarations still to fill before Closed testing/Production. Apple enrollment pending since Aug 31 |
| iOS submitted | ⬜ | Mon Sep 14 — follow `STORE-CHECKLIST.md` §8 |
| Store accounts / ownership decided | ⬜ | STORE-CHECKLIST §0 — urgent: SBG vs Sam accounts, Play account type, authorization letter |
| Poster layers exported | ⬜ | Sam, in parallel — see ASSET-BRIEF |
| Generated supporting art | ⬜ | Sam via ChatGPT — see ASSET-BRIEF |
| Art budget | ✅ Sep 10 | `public/art` WebP 0.97 MB (lockup lossless), fonts WOFF2 0.35 MB; sources live in `assets-src/`; regenerate with `npm run art:build` / `fonts:build` / `icons:build`; PSD-derived icon still to replace the code-drawn sun |
| Dev clock caveat | ℹ️ | Lineup/Plan day selector is chosen on first render; scrubbing the dev clock doesn't move it — pick the day tab manually when reviewing |

## 4. How we work

- **Fable 5.1 (Cowork)** plans, designs, reviews screenshots and docs, writes copy. **Claude Code** (with the GSD workflow: `/gsd:new-project` → discuss → plan → execute per phase) implements. Sam runs Xcode/Android Studio, Firebase console, store consoles, and Photoshop.
- Small, atomic commits with conventional prefixes (`feat(lineup): …`, `chore(ci): …`). PRs optional while solo; CI must be green on `main` because `main` deploys.
- Every feature phase ends with: unit tests for domain logic, a 390×844 and 1440×900 screenshot set in `docs/screens/<phase>/`, and a HANDOFF status update.
- Ask Sam before: adding any third-party SDK beyond the approved list, changing the content schema after Day 3 (admin depends on it), any store-console action, anything that costs money.

## 5. Guardrails (non-negotiable)

1. **Never commit** the PSD, `google-services.json`, `GoogleService-Info.plist`, `.p8`/`.p12`/keystores, or `.env*`. `.gitignore` covers them; check anyway.
2. **Never invent content.** Artist names, set times, stages, venue facts come only from official SBG sources or the admin console. No AI-generated bios, genres, or artist imagery. Generated art is limited to supporting illustration in the poster's style (ASSET-BRIEF §3).
3. **No analytics, ads, or tracking SDKs.** Firebase Analytics stays disabled (`analytics` not initialized; on native, set `FirebaseAppDelegateProxyEnabled`/analytics collection flags off). Push topic subscription only; no fan identifiers stored by us.
4. **Official lockups are images, unmodified.** No re-typesetting "Telluride Blues & Brews" in a substitute font as a logo.
5. **All schedule math in `America/Denver`** through `packages/shared/time.ts`. Never `new Date(string)` on wall-clock strings.
6. **Remote content is validated with Zod before it can replace cached content.** Invalid remote data never wins.
7. **Reduced motion and offline** are first-class: every animation has a static fallback; every screen renders from the bundled snapshot with no network.
8. **Admin writes only through rules-protected paths and the `publishContent` callable.** Never widen Firestore rules to make a demo work.

## 6. Approved dependency list

`react`, `react-dom`, `react-router`, `zustand`, `zod`, `motion`, `tailwindcss` (v4) + `@tailwindcss/vite`, `firebase` (app, auth, firestore, messaging, functions, app-check), `vite`, `vite-plugin-pwa`, `@capacitor/core|cli|ios|android`, `@capacitor/local-notifications`, `@capacitor/haptics`, `@capacitor/preferences`, `@capacitor/share`, `@capacitor/status-bar`, `@capacitor/splash-screen`, `@capacitor/app`, `@capacitor-firebase/messaging`, `vitest`, `@playwright/test`, `@firebase/rules-unit-testing`, `firebase-tools`, `firebase-functions`, `firebase-admin`, `eslint`, `prettier`, `typescript`. Pin exact versions at install time (registry lookups were unavailable from the planning sandbox; expect Capacitor 8.5.x, Vite 8.x, React 19.2.x, Firebase JS SDK 12.x). Anything else: ask.

## 7. Commands (target shape — make these real on Day 0)

```bash
npm install                          # workspaces
npm run dev                          # festival app on http://localhost:5173
npm run dev:admin                    # admin console on :5174 (uses Firebase emulators if FIREBASE_EMULATOR=1)
npm run emulators                    # firestore + auth + functions emulators with seed data
npm run seed                         # packages/content → Firestore (emulator or --project)
npm run test                         # vitest across workspaces
npm run test:rules                   # firestore rules against emulator
npm run build                        # festival app → apps/festival/dist (+ bundled.json refreshed)
npm run build:admin
npm run screenshots                  # playwright device-size screenshots into docs/screens
npm run art:build · fonts:build · icons:build   # regenerate committed assets from assets-src/ (cwebp, woff2_compress, Playwright)
npm run e2e:offline                      # build + airplane-mode Playwright check (local only)
npm run e2e:a11y                     # axe-core WCAG gate, every screen × both themes (needs network for axe; docs/COMPLIANCE.md §5)
npm run store:shots                  # captioned store screenshots → docs/store/shots/{ios-6.9,android-phone}/ + Play feature graphic
npm run cap:sync                     # build (BASE_PATH=/, firestore data source) + npx cap sync
npm run cap:ios                      # open the iOS project in Xcode (apps/festival/ios/App/App.xcodeproj — SPM-only, no CocoaPods)
npm run cap:android                  # open the Android project in Android Studio
npm run cap:build:ios                # headless Debug build for iOS Simulator (no code signing)
BB_UPLOAD_PASSWORD="$(pbpaste)" npm run cap:bundle:android; pbcopy </dev/null   # signed Play bundle from ~/Keys/bb-upload.jks (STORE-CHECKLIST §2)
~/Library/Android/sdk/emulator/emulator -avd bb36 -gpu host   # Android emulator MUST use the host GPU: SwiftShader (-gpu swiftshader_indirect) leaves stale frames layered over the WebView (seen Sep 14); the AVD config now has hw.gpu.mode=host so Android Studio launches match
npm run cap:build:android            # headless Debug .apk build via Gradle
npm run splash:build                 # regenerate the native splash screen assets from assets-src/
```

Native builds are not in CI; `cap sync` output (`ios/App/App/public`, `android/app/src/main/assets/public`) is git-ignored and regenerated.

## 8. Environment on Sam's Mac (from the Sep 8 prototype; re-verify)

Apple Silicon. Node 22.x, npm 10.x. Xcode 26.x installed, license accepted; **iOS platform/Simulator runtime may still need installing** (Xcode → Settings → Components). CocoaPods 1.17 installed but unused — the Capacitor 8 iOS project is Swift Package Manager only (open `apps/festival/ios/App/App.xcodeproj`). Android Studio: an Intel build was installed by mistake earlier — **install the Apple Silicon (ARM64) build**, then SDK + JDK 21 via its wizard. Photoshop available for PSD layer export.

## 9. Next actions (in order)

1. Sam: answer the open questions in `PLAN.md §12` (Play account type is the urgent one); create the private repo; create the Firebase project on Blaze; start the PSD layer export from `ASSET-BRIEF.md`.
2. Claude Code Day 0: scaffold per `PLAN.md §3.2`, tokens/fonts, content package + seed, rules + tests, CI + Pages deploy, update this file's Status board and record repo/project IDs above.
3. Fable: review Day 1 screenshots against `PLAN.md §5`; write store listing copy and privacy policy into `docs/store/`.

## 10. Session log

| Date | Who | What |
|---|---|---|
| 2026-09-01 | Cowork | First plan (Expo two-tier) — superseded |
| 2026-09-08 | Codex | Vanilla-JS/Capacitor flagship UI deployed to Pages; Expo v2 branch — both superseded |
| 2026-09-09 | Fable 5.1 / Cowork | Fresh-start plan approved: React+Vite+Capacitor, Firebase, new repo, store attempt by Sep 14; docs written |
| 2026-09-09 | Fable 5.1 / Cowork | Store gap review → `STORE-CHECKLIST.md`; PLAN §8 corrected (age rating, iPhone-only, targetSdk 36, 5.2.1 authorization); D-015 |
| 2026-09-09 | Fable 5.1 / Claude Code | Working tree cleared of the old prototype; design-system + five-screen mockups approved; palette locked (D-016); local design-pass spec written (D-017) |
| 2026-09-09 | Claude Code | Live backend + admin console built per `docs/superpowers/plans/2026-09-09-live-backend-and-admin-console.md`: rules + emulator tests, seed script, Firestore sources in the fan app, admin console deployed to Pages |
| 2026-09-09 | Claude Code | Design pass implemented per `docs/superpowers/plans/2026-09-09-festival-app-design-pass.md`: tokens, ornaments, primitives, shell, five screens, domain tests, screenshots |
