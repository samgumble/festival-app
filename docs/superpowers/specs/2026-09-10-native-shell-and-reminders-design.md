# Native shell + reminders (spec)

**Date:** 2026-09-10 · **Owner:** Sam Gumble · **Status:** approved in conversation ("Looks right"), written up for the record
**Scope:** wrap the fan app in Capacitor 8 for iOS and Android; add local-notification set reminders (one switch), haptics, status bar, splash and store icons; leave the projects ready for TestFlight/Play the day the developer accounts clear. No push (Blaze), no store submission in this phase.

Companion docs: `docs/PLAN.md` §3.5/§4 (platform specifics), `docs/STORE-CHECKLIST.md` (identifiers, capabilities), `docs/ASSET-BRIEF.md` §2 (icon/splash specs), `docs/DECISIONS.md` D-021 (no push on Spark), D-023 (this phase).

---

## 1. Goal

Sam opens the app from his iPhone home screen as a real app: it launches on paper with the lockup, shows the live lineup, buzzes when he favorites a set, and reminds him 15 minutes before every set he favorited — even with the phone in his pocket. The same repo builds Android. When Apple approves the account, Product → Archive works without code changes.

## 2. Decisions made in this session

| # | Decision |
|---|---|
| N-1 | **Capacitor 8.5.1** wraps the existing web build (`apps/festival/dist`); native projects live at `apps/festival/ios` and `apps/festival/android` and are committed (minus signing/keys). Logged as **D-023**. |
| N-2 | App name `Telluride Blues & Brews`; bundle ID / application ID **`com.sbgproductions.bluesandbrews`** on both platforms (STORE-CHECKLIST §0); iPhone-only, portrait-only for v1; Android `compileSdk`/`targetSdk` 36. |
| N-3 | **Reminders: one switch, all favorites.** "Remind me before my sets" in Plan settings, native only. Every favorited, still-upcoming set is scheduled at `settings.leadMinutes` before its start (Denver time). No per-set toggles anywhere (Sam removed them on web). Reconciliation is a diff: cancel only what changed, schedule only what's new. |
| N-4 | Apple Developer enrollment is pending (expected within days) → this phase ends at **simulator + side-loaded iPhone (free personal team)**; TestFlight is a follow-up task in STORE-CHECKLIST, not in this spec. |
| N-5 | The **service worker is not registered inside Capacitor** (the WebView bundles everything; `capacitor://localhost` is offline by construction). The install nudge and update banner are web-only. |
| N-6 | Interim icon/splash reuse the code-drawn sun (D-022) and the official lockup; ASSET-BRIEF §2 PSD-derived assets replace them by file swap later. |
| N-7 | Plugins (exact pins): `@capacitor/core|cli|ios|android` 8.5.1, `@capacitor/local-notifications` 8.3.1, `@capacitor/haptics` 8.0.2, `@capacitor/status-bar` 8.0.3, `@capacitor/splash-screen` 8.0.2, `@capacitor/share` 8.0.1, `@capacitor/app` 8.1.1. All on the approved list (HANDOFF §6). `@capacitor/preferences` is **not** added: zustand `persist` on WebView localStorage is sufficient for v1 and matches web behavior. |

## 3. Out of scope

Push/FCM, `@capacitor-firebase/messaging`, App Check, TestFlight/Play upload, store listing copy and screenshots (Day 5), deep links from push, device-tilt parallax, native tab bar, iPad layout.

## 4. Projects and config

- `apps/festival/capacitor.config.ts`:
  ```ts
  import type { CapacitorConfig } from "@capacitor/cli";
  const config: CapacitorConfig = {
    appId: "com.sbgproductions.bluesandbrews",
    appName: "Telluride Blues & Brews",
    webDir: "dist",
    ios: { contentInset: "automatic", scheme: "Telluride Blues & Brews" },
    android: { allowMixedContent: false },
    plugins: {
      SplashScreen: { launchAutoHide: false, backgroundColor: "#EBD5B3", showSpinner: false },
      LocalNotifications: { smallIcon: "ic_stat_sun", iconColor: "#F0C41C" },
      StatusBar: { overlaysWebView: true },
    },
  };
  export default config;
  ```
- Native build always uses `BASE_PATH=/` and `VITE_DATA_SOURCE=firestore` (the same production data source as Pages). npm scripts in `apps/festival`: `cap:sync` = `npm run build && cap sync`, `cap:ios` = `cap open ios`, `cap:android` = `cap open android`, `cap:run:ios` = `cap run ios --target <sim>` (documented, not pinned to a UDID).
- iOS: `TARGETED_DEVICE_FAMILY = 1`, portrait only, `CFBundleDisplayName` = app name, `ITSAppUsesNonExemptEncryption = NO`, `PrivacyInfo.xcprivacy` with `NSPrivacyAccessedAPICategoryUserDefaults` reason `CA92.1` and `NSPrivacyTracking = false`. No push capability yet (added with Blaze/APNs later).
- Android: `applicationId` from config, `versionCode 1`, `versionName "1.0.0"`, `compileSdk`/`targetSdk` 36, `POST_NOTIFICATIONS` permission (plugin adds it), edge-to-edge default for target 35+; adaptive icon resources under `android/app/src/main/res/mipmap-*`; notification small icon `ic_stat_sun` (white-on-transparent) under `res/drawable-*`.
- `.gitignore` additions: `apps/festival/ios/App/Pods/`, `apps/festival/ios/App/App.xcworkspace/xcuserdata/`, `apps/festival/ios/App/App/public/` (generated web copy; `cap sync` recreates it), `apps/festival/android/app/src/main/assets/public/`, `apps/festival/android/.gradle/`, `apps/festival/android/build/`, `apps/festival/android/app/build/`, `apps/festival/android/local.properties`, plus the existing key/keystore/plist rules. `cap sync` output is never committed; CI does not build native (documented).
- Java for Android CLI builds: `JAVA_HOME=/opt/homebrew/opt/openjdk@21` (Android Studio uses its bundled JBR when opened from the IDE).

## 5. Platform layer (`apps/festival/src/platform/`)

Each adapter is a module exporting an interface-typed object chosen at load time by `runtime.isNative()`; web fallbacks preserve today's behavior exactly. Capacitor plugins are imported lazily (`await import("@capacitor/...")`) inside the native implementations so the web bundle does not grow.

| Module | Interface | Native | Web fallback |
|---|---|---|---|
| `runtime.ts` | `isNative(): boolean`, `platform(): "ios" \| "android" \| "web"` | `Capacitor.isNativePlatform()` / `getPlatform()` | `false` / `"web"` |
| `haptics.ts` | `tap(): Promise<void>` | `Haptics.impact({ style: ImpactStyle.Light })` | no-op |
| `statusBar.ts` | `apply(theme: "light" \| "dark"): Promise<void>` | `StatusBar.setStyle({ style: theme === "dark" ? Style.Dark : Style.Light })`; Android also `setBackgroundColor` transparent | no-op |
| `splash.ts` | `hide(): Promise<void>` | `SplashScreen.hide({ fadeOutDuration: 200 })` after first content render | no-op |
| `share.ts` | `shareText(title, text): Promise<void>`, `shareFile(filename, mime, text): Promise<void>` | `Share.share({ title, text })`; file share writes to cache via `Filesystem`? **No** — v1 shares the `.ics` as text with the calendar URL note; `Filesystem` is not on the approved list | existing `downloadText` |
| `notifications.ts` | `isSupported(): boolean`, `permission(): Promise<"granted" \| "denied" \| "prompt">`, `request(): Promise<"granted" \| "denied">`, `pending(): Promise<Array<{ id: number }>>`, `schedule(items: ReminderItem[]): Promise<void>`, `cancel(ids: number[]): Promise<void>`, `onTap(handler: () => void): () => void` | `LocalNotifications.*` | `isSupported() === false`; everything else resolves without effect |

`ReminderItem = { id: number; setId: string; title: string; body: string; at: number /* epoch ms */ }`. `id` is a stable 31-bit hash of `setId` (FNV-1a), so the same set always maps to the same notification id across launches.

## 6. Reminders

- **Store:** `usePlanStore` gains `remindersOn: boolean` (persisted, default `false`). The existing `reminders: string[]` and `toggleReminder` are removed (dead since the toggles went) with a persist `migrate` that drops the key.
- **Planner (pure, `src/domain/reminders.ts`):** `planReminders({ favorites, sets, artistsById, stagesById, leadMinutes, now }): ReminderItem[]` — for each favorited set with `start − lead > now`, emit `{ id: hashId(set.id), setId, title: "${artist} · ${stage}", body: "Starts in ${lead} min", at: isoMs(set.start) − lead*60_000 }`. Conflicts resolved in Plan (`lostSetIds`) are still reminded (the fan favorited them; Plan's resolution is advisory). Sorted by `at`.
- **Reconciler (pure):** `diffReminders(desired: ReminderItem[], pending: Array<{ id: number; at?: number }>): { cancel: number[]; schedule: ReminderItem[] }` — cancel pending ids not in desired or whose `at` differs; schedule desired ids not pending or changed.
- **Effect (`src/features/plan/useReminderSync.ts`):** on native only, when `remindersOn`, subscribe to favorites, `settings.leadMinutes`, content (published set times), and a 60 s tick; compute plan → diff against `notifications.pending()` → apply. When `remindersOn` flips off, cancel all pending ids that belong to us (ids present in the last planned set ∪ pending). Runs once at app start too, so schedule changes published while the app was closed reconcile on next launch (v1 has no background fetch).
- **UI (`PlanSettings.tsx`):** native only, first row: `Toggle` "Remind me before my sets" with helper "Uses your lead time below. Works with the app closed." Turning it on calls `notifications.request()`; on `"denied"` the toggle snaps back and a line reads "Notifications are off for this app in Settings." Lead-time control stays as is.
- **Tap:** `notifications.onTap` navigates to `/plan`.
- **Copy limits:** title ≤ 40 chars (artist truncated with …), body fixed.

## 7. Native polish

- `Heart` (favorite) calls `haptics.tap()` on toggle-on (web no-op).
- `useApplyTheme` calls `statusBar.apply(resolvedTheme)` whenever the resolved theme changes.
- `TabShell` calls `splash.hide()` in an effect after first paint.
- `src/app/sw.ts`: `setupServiceWorker` returns early when `runtime.isNative()`; `useInstall()` returns `"none"` on native; `UpdateBanner` therefore never shows.
- Share: Plan's "Share plan" uses `share.shareText`; "Add to calendar" keeps the web download on web and, on native, shares the `.ics` text via `share.shareText` with the filename in the title (v1 limitation, noted in HANDOFF).

## 8. Assets

`scripts/icons.ts` extended (same SVG, same renderer): `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-1024.png` (1024, no alpha — render on the gradient, flatten), Android adaptive foreground `ic_launcher_foreground.png` 432×432 (art within the centre 264 px), background `ic_launcher_background.png` 432×432 solid `#1890A8`→`#1A4A80` gradient, monochrome `ic_launcher_monochrome.png` 432 white silhouette, notification `ic_stat_sun` at 24 dp × {mdpi 24, hdpi 36, xhdpi 48, xxhdpi 72, xxxhdpi 96} white-on-transparent. Splash: `scripts/splash.ts` renders `public/art/lockup.webp` centred at 60 % width on `#EBD5B3` to 2732×2732 for iOS `Splash.imageset` (1x/2x/3x same file) and Android `drawable*/splash.png` (`@capacitor/splash-screen` 8 uses the Android 12 splash API: icon-only from the adaptive icon, `windowSplashScreenBackground` paper). All generated files committed; regenerate with `npm run icons:build` / `npm run splash:build`.

## 9. Testing

- Vitest: `domain/reminders.test.ts` (planner: excludes past sets, respects lead, stable ids, sorted; reconciler: cancel/schedule diffs incl. time changes), `platform/*.test.ts` web fallbacks (`isSupported false`, `tap` no-op, `share` falls back to `downloadText`), `PlanSettings` toggle behavior with a mocked notifications adapter (request granted → on; denied → snaps back + message), `useReminderSync` with mocked adapter (schedules on favorite add, cancels on remove, reschedules on lead change, cancels all on switch off).
- Simulator smoke (controller, via the iOS Simulator tool): app launches to Now, favorite → haptic call logged, Plan settings toggle asks permission, a favorited set 20 min ahead (dev clock is DEV-only, so use `xcrun simctl` time? **No** — use a real upcoming set by temporarily favoriting and setting lead to 30 min while a set starts within 30 min in Denver time; otherwise verify via `LocalNotifications.getPending()` output logged in DEV).
- Android: `./gradlew assembleDebug` with `JAVA_HOME` set succeeds; emulator boot optional.
- Sam's iPhone: side-load with personal team; confirm launch, haptic, permission prompt, and one reminder firing.

## 10. Definition of done

1. `npm run cap:sync` produces `ios/` and `android/` projects that build (`xcodebuild -scheme App -destination 'generic/platform=iOS Simulator' build` and `./gradlew assembleDebug`) with zero code-signing errors on the simulator target.
2. Simulator run: launch on paper splash → Now screen with live content; favorite buzzes (haptics call verified); reminders switch requests permission; `getPending()` lists one item per upcoming favorite at `start − lead`; removing the favorite removes it.
3. All platform adapters have web fallbacks and the web build/tests/PWA are unchanged (Pages deploy still green; precache unaffected).
4. Icons/splash generated and committed; no signing/keystore/Firebase native files in git.
5. HANDOFF status board (Native row), DECISIONS D-023, STORE-CHECKLIST §2 items that this phase satisfies ticked; `docs/HANDOFF.md` commands updated.
