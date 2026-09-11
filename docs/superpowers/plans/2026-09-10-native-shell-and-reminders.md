# Native Shell + Reminders Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wrap the fan app in Capacitor 8 for iOS and Android with local-notification set reminders (one switch over all favorites), haptics, status bar, splash and store icons, leaving both projects ready for TestFlight/Play when the accounts clear.

**Architecture:** Capacitor loads the same `dist/` the web uses. Browser/native differences live behind small adapters in `src/platform/` chosen at load time by `runtime.isNative()`, each with a web fallback that preserves today's behavior. A pure reminder planner + reconciler in `src/domain/reminders.ts` computes the desired notification set; a React hook applies the diff through the notifications adapter. Generated native assets are produced by scripts and committed.

**Tech Stack:** Capacitor 8.5.1 (`core`, `cli`, `ios`, `android`), `@capacitor/local-notifications` 8.3.1, `@capacitor/haptics` 8.0.2, `@capacitor/status-bar` 8.0.3, `@capacitor/splash-screen` 8.0.2, `@capacitor/share` 8.0.1, `@capacitor/app` 8.1.1; Xcode 26.6 + iOS 26.5 simulator; Android Studio + SDK 36; CocoaPods 1.17; JDK 21 at `/opt/homebrew/opt/openjdk@21`; Vitest; Playwright (icon rendering).

Spec: `docs/superpowers/specs/2026-09-10-native-shell-and-reminders-design.md`. Decision: `docs/DECISIONS.md` D-023.

## Global Constraints

- Work in `apps/festival` unless a path says otherwise. npm commands run from `apps/festival`.
- Only these new dependencies, exact pins: `@capacitor/core@8.5.1`, `@capacitor/cli@8.5.1`, `@capacitor/ios@8.5.1`, `@capacitor/android@8.5.1`, `@capacitor/local-notifications@8.3.1`, `@capacitor/haptics@8.0.2`, `@capacitor/status-bar@8.0.3`, `@capacitor/splash-screen@8.0.2`, `@capacitor/share@8.0.1`, `@capacitor/app@8.1.1`. No `@capacitor/preferences`, no `@capacitor/filesystem`.
- App name `Telluride Blues & Brews`; bundle ID / application ID `com.sbgproductions.bluesandbrews` on both platforms; iPhone-only (`TARGETED_DEVICE_FAMILY = 1`), portrait-only; `ITSAppUsesNonExemptEncryption = NO`; Android `versionCode 1`, `versionName "1.0.0"`, `compileSdk`/`targetSdk` 36.
- Never commit: signing material, keystores, `*.p8/*.p12`, `GoogleService-Info.plist`, `google-services.json`, `ios/App/Pods/`, `ios/App/App/public/`, `android/app/src/main/assets/public/`, Gradle/Xcode build output, `android/local.properties`.
- Capacitor plugins are imported lazily (`await import(...)`) inside native implementations; the web bundle must not grow by more than 5 kB gzipped (check `dist/assets/index-*.js` size before/after).
- Reminders: one persisted switch `remindersOn` (default `false`), native only; notification id = FNV-1a 32-bit hash of `set.id` masked to 31 bits; title `${artist.name} · ${stage.name}` truncated to 40 chars with `…`; body `Starts in ${leadMinutes} min`; `at = isoMs(set.start) − leadMinutes × 60 000`; past or already-inside-lead sets are never scheduled; conflicts resolved in Plan are still reminded. Reconciliation cancels only changed/removed ids and schedules only new/changed items.
- The service worker never registers on native; `useInstall()` returns `"none"` on native; the update banner never shows on native.
- Every animation keeps its reduced-motion fallback; all schedule time math goes through `src/domain/time.ts`.
- DEV-only hooks are guarded by `import.meta.env.DEV`.
- Tests: Vitest for domain/adapters/components; native builds are verified by `xcodebuild` (simulator destination) and `./gradlew assembleDebug`, not by CI. Conventional commits, one commit per task, `main` auto-deploys the web app so keep `npm test` and `npm run build` green.

---

## File Structure

| Path (under `apps/festival/`) | Responsibility |
|---|---|
| `capacitor.config.ts` | app id/name/webDir + plugin config |
| `ios/`, `android/` | generated native projects (committed, minus ignored output) |
| `src/platform/runtime.ts` (+test) | `isNative()`, `platform()` |
| `src/platform/haptics.ts` (+test) | light impact on favorite |
| `src/platform/statusBar.ts` (+test) | theme-aware status bar |
| `src/platform/splash.ts` (+test) | hide the native splash after first paint |
| `src/platform/share.ts` (+test) | text/file share with web fallback |
| `src/platform/notifications.ts` (+test) | local-notification adapter |
| `src/domain/reminders.ts` (+test) | `hashId`, `planReminders`, `diffReminders` |
| `src/state/plan.ts` (+test) | `remindersOn`; `reminders[]`/`toggleReminder` removed with migration |
| `src/features/plan/useReminderSync.ts` (+test) | applies the plan/diff through the adapter; tap → `/plan` |
| `src/features/plan/PlanSettings.tsx` (+test) | the reminders switch (native only) + DEV pending readout |
| `src/design/Heart.tsx`, `src/app/theme.ts`, `src/app/TabShell.tsx`, `src/app/sw.ts`, `src/platform/install.ts`, `src/features/plan/PlanScreen.tsx` | wiring |
| `scripts/icons.ts`, `scripts/splash.ts` | native icon/splash rendering |
| `(root) .gitignore`, `docs/HANDOFF.md`, `docs/STORE-CHECKLIST.md`, `CLAUDE.md` | hygiene + docs |

---

### Task 1: Capacitor projects

**Files:**
- Modify: `apps/festival/package.json` (deps, scripts)
- Create: `apps/festival/capacitor.config.ts`
- Create (generated): `apps/festival/ios/**`, `apps/festival/android/**`
- Modify: `(root) .gitignore`
- Modify: `apps/festival/tsconfig.json` (include `capacitor.config.ts`)

**Interfaces:**
- Produces: npm scripts `cap:sync`, `cap:ios`, `cap:android`, `cap:build:ios`, `cap:build:android`; native projects that build for the simulator/emulator.

- [ ] **Step 1: Install**

Run from `apps/festival`:

```bash
npm i -E @capacitor/core@8.5.1 @capacitor/local-notifications@8.3.1 @capacitor/haptics@8.0.2 @capacitor/status-bar@8.0.3 @capacitor/splash-screen@8.0.2 @capacitor/share@8.0.1 @capacitor/app@8.1.1
npm i -D -E @capacitor/cli@8.5.1 @capacitor/ios@8.5.1 @capacitor/android@8.5.1
```

Expected: `package.json` shows the exact pins (`-E` saves exact); root `package-lock.json` updates.

- [ ] **Step 2: Config**

`apps/festival/capacitor.config.ts`:

```ts
import type { CapacitorConfig } from "@capacitor/cli";

// Native shell config (D-023). webDir is the same production build the web app ships;
// native builds always use BASE_PATH=/ (see the cap:sync script).
const config: CapacitorConfig = {
  appId: "com.sbgproductions.bluesandbrews",
  appName: "Telluride Blues & Brews",
  webDir: "dist",
  ios: { contentInset: "automatic" },
  android: { allowMixedContent: false },
  plugins: {
    SplashScreen: { launchAutoHide: false, backgroundColor: "#EBD5B3", showSpinner: false, androidScaleType: "CENTER_CROP" },
    LocalNotifications: { smallIcon: "ic_stat_sun", iconColor: "#F0C41C" },
    StatusBar: { overlaysWebView: true, style: "DEFAULT" },
  },
};

export default config;
```

Add `"capacitor.config.ts"` to `include` in `apps/festival/tsconfig.json`.

Add to `apps/festival/package.json` scripts:

```json
    "cap:sync": "BASE_PATH=/ VITE_DATA_SOURCE=firestore npm run build && cap sync",
    "cap:ios": "cap open ios",
    "cap:android": "cap open android",
    "cap:build:ios": "cd ios/App && xcodebuild -workspace App.xcworkspace -scheme App -configuration Debug -destination 'generic/platform=iOS Simulator' -derivedDataPath build CODE_SIGNING_ALLOWED=NO build | tail -5",
    "cap:build:android": "cd android && JAVA_HOME=/opt/homebrew/opt/openjdk@21 ./gradlew assembleDebug --console=plain -q"
```

- [ ] **Step 3: Ignore rules (repo root `.gitignore`)**

Append:

```
# Capacitor native projects: sources are committed, generated web copies and build output are not
apps/festival/ios/App/Pods/
apps/festival/ios/App/App/public/
apps/festival/ios/App/build/
apps/festival/ios/App/App.xcworkspace/xcuserdata/
apps/festival/ios/App/App.xcodeproj/xcuserdata/
apps/festival/ios/App/App.xcodeproj/project.xcworkspace/xcuserdata/
apps/festival/android/app/src/main/assets/public/
apps/festival/android/app/src/main/assets/capacitor.config.json
apps/festival/android/app/src/main/assets/capacitor.plugins.json
apps/festival/android/.gradle/
apps/festival/android/build/
apps/festival/android/app/build/
apps/festival/android/local.properties
apps/festival/android/.idea/
apps/festival/android/*.iml
apps/festival/android/app/*.iml
apps/festival/ios/App/App/capacitor.config.json
```

- [ ] **Step 4: Add the platforms**

Run from `apps/festival`:

```bash
BASE_PATH=/ VITE_DATA_SOURCE=firestore npm run build
npx cap add ios
npx cap add android
npx cap sync
```

Expected: `ios/App/App.xcworkspace` and `android/app/build.gradle` exist; `cap sync` ends with `✔ Sync finished`. Confirm `git status --short | grep -E 'Pods/|assets/public/|App/public/'` prints nothing.

- [ ] **Step 5: iOS project settings**

Run from `apps/festival/ios/App`:

```bash
/usr/libexec/PlistBuddy -c "Set :CFBundleDisplayName Telluride Blues & Brews" App/Info.plist
/usr/libexec/PlistBuddy -c "Add :ITSAppUsesNonExemptEncryption bool false" App/Info.plist
/usr/libexec/PlistBuddy -c "Delete :UISupportedInterfaceOrientations" App/Info.plist
/usr/libexec/PlistBuddy -c "Add :UISupportedInterfaceOrientations array" App/Info.plist
/usr/libexec/PlistBuddy -c "Add :UISupportedInterfaceOrientations:0 string UIInterfaceOrientationPortrait" App/Info.plist
/usr/libexec/PlistBuddy -c "Delete :UISupportedInterfaceOrientations~ipad" App/Info.plist 2>/dev/null || true
sed -i '' 's/TARGETED_DEVICE_FAMILY = "1,2";/TARGETED_DEVICE_FAMILY = 1;/g' App.xcodeproj/project.pbxproj
grep -c 'TARGETED_DEVICE_FAMILY = 1;' App.xcodeproj/project.pbxproj
```

Expected: the last command prints `2` (Debug + Release). Then create `App/PrivacyInfo.xcprivacy`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>NSPrivacyTracking</key><false/>
  <key>NSPrivacyTrackingDomains</key><array/>
  <key>NSPrivacyCollectedDataTypes</key><array/>
  <key>NSPrivacyAccessedAPITypes</key>
  <array>
    <dict>
      <key>NSPrivacyAccessedAPIType</key><string>NSPrivacyAccessedAPICategoryUserDefaults</string>
      <key>NSPrivacyAccessedAPITypeReasons</key><array><string>CA92.1</string></array>
    </dict>
  </array>
</dict>
</plist>
```

Add it to the App target's resources: open `App.xcodeproj/project.pbxproj` and add the file the same way `Info.plist`/`Assets.xcassets` are referenced (a `PBXFileReference`, a `PBXBuildFile`, an entry in the `App` group's `children`, and an entry in the App target's `PBXResourcesBuildPhase` `files`). Use new 24-hex-char ids that do not collide (e.g. `504EC3131FED79650016851F` style — grep to confirm uniqueness). Verify with `grep -c PrivacyInfo App.xcodeproj/project.pbxproj` → `4` (or more).

- [ ] **Step 6: Android project settings**

In `apps/festival/android/app/build.gradle` confirm `applicationId "com.sbgproductions.bluesandbrews"`, `versionCode 1`, `versionName "1.0.0"`. In `apps/festival/android/variables.gradle` set `compileSdkVersion = 36` and `targetSdkVersion = 36` if lower (leave `minSdkVersion` at the template default). Set the launcher label: in `android/app/src/main/res/values/strings.xml` `app_name` and `title_activity_main` = `Telluride Blues & Brews`.

- [ ] **Step 7: Build both**

```bash
npm run cap:build:ios
npm run cap:build:android
```

Expected: iOS ends with `** BUILD SUCCEEDED **`; Android exits 0 and `ls android/app/build/outputs/apk/debug/app-debug.apk` exists. If the first Gradle run needs to accept SDK licenses, run `yes | ~/Library/Android/sdk/cmdline-tools/latest/bin/sdkmanager --licenses` (or via Android Studio) and retry.

- [ ] **Step 8: Web unchanged, commit**

Run: `npm run typecheck && npm test` — PASS. Confirm `git status --short` lists no ignored output (no `Pods/`, `public/`, `build/`).

```bash
git add apps/festival/package.json package-lock.json apps/festival/capacitor.config.ts apps/festival/tsconfig.json apps/festival/ios apps/festival/android .gitignore
git commit -m "feat(native): Capacitor 8 iOS/Android projects (com.sbgproductions.bluesandbrews)"
```

---

### Task 2: Platform adapters and wiring

**Files:**
- Create: `src/platform/runtime.ts`, `haptics.ts`, `statusBar.ts`, `splash.ts`, `share.ts`, `notifications.ts` (+ `platform.test.ts` covering the web fallbacks)
- Modify: `src/design/Heart.tsx`, `src/app/theme.ts`, `src/app/TabShell.tsx`, `src/app/sw.ts` (+ `sw.test.ts`), `src/platform/install.ts` (+ test), `src/features/plan/PlanScreen.tsx`

**Interfaces:**
- Produces (used by Tasks 3–4): `runtime.isNative()`, `runtime.platform()`, `haptics.tap()`, `statusBar.apply(theme)`, `splash.hide()`, `share.shareText(title, text)`, `share.shareFile(filename, mime, text)`, `notifications` with `isSupported()`, `permission()`, `request()`, `ensureExact()`, `pending()`, `schedule(items)`, `cancel(ids)`, `onTap(handler)`; `ReminderItem` type.

- [ ] **Step 1: Failing tests for the web fallbacks**

`src/platform/platform.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { runtime } from "./runtime";
import { haptics } from "./haptics";
import { statusBar } from "./statusBar";
import { splash } from "./splash";
import { share } from "./share";
import { notifications } from "./notifications";

describe("platform adapters on the web", () => {
  afterEach(() => vi.restoreAllMocks());

  it("runtime reports web", () => {
    expect(runtime.isNative()).toBe(false);
    expect(runtime.platform()).toBe("web");
  });

  it("haptics, statusBar and splash are no-ops that resolve", async () => {
    await expect(haptics.tap()).resolves.toBeUndefined();
    await expect(statusBar.apply("dark")).resolves.toBeUndefined();
    await expect(splash.hide()).resolves.toBeUndefined();
  });

  it("shareText prefers navigator.share and falls back to the clipboard", async () => {
    const nshare = vi.fn(async () => {});
    Object.defineProperty(navigator, "share", { value: nshare, configurable: true });
    await share.shareText("Plan", "hello");
    expect(nshare).toHaveBeenCalledWith({ title: "Plan", text: "hello" });
    Object.defineProperty(navigator, "share", { value: undefined, configurable: true });
    const write = vi.fn(async () => {});
    Object.defineProperty(navigator, "clipboard", { value: { writeText: write }, configurable: true });
    await share.shareText("Plan", "hello");
    expect(write).toHaveBeenCalledWith("hello");
  });

  it("shareFile downloads on the web", async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const url = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:x");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    await share.shareFile("plan.ics", "text/calendar", "BEGIN:VCALENDAR");
    expect(url).toHaveBeenCalled();
    expect(click).toHaveBeenCalledTimes(1);
  });

  it("notifications are unsupported and inert on the web", async () => {
    expect(notifications.isSupported()).toBe(false);
    await expect(notifications.permission()).resolves.toBe("denied");
    await expect(notifications.request()).resolves.toBe("denied");
    await expect(notifications.ensureExact()).resolves.toBe(true);
    await expect(notifications.pending()).resolves.toEqual([]);
    await expect(notifications.schedule([{ id: 1, setId: "a", title: "t", body: "b", at: 1 }])).resolves.toBeUndefined();
    await expect(notifications.cancel([1])).resolves.toBeUndefined();
    const off = notifications.onTap(() => {});
    expect(typeof off).toBe("function");
    off();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- src/platform/platform.test.ts` — FAIL: cannot resolve `./runtime`.

- [ ] **Step 3: Write the adapters**

`src/platform/runtime.ts`:

```ts
/** Which shell we are running in. Native detection reads the global Capacitor injects into the WebView. */
export type Platform = "ios" | "android" | "web";

interface CapacitorGlobal { isNativePlatform?: () => boolean; getPlatform?: () => string }

function cap(): CapacitorGlobal | undefined {
  return (globalThis as { Capacitor?: CapacitorGlobal }).Capacitor;
}

export const runtime = {
  isNative(): boolean {
    return cap()?.isNativePlatform?.() === true;
  },
  platform(): Platform {
    const p = cap()?.getPlatform?.();
    return p === "ios" || p === "android" ? p : "web";
  },
};
```

`src/platform/haptics.ts`:

```ts
import { runtime } from "./runtime";

/** Light impact on favorite. Web: no-op. */
export const haptics = {
  async tap(): Promise<void> {
    if (!runtime.isNative()) return;
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    await Haptics.impact({ style: ImpactStyle.Light });
  },
};
```

`src/platform/statusBar.ts`:

```ts
import { runtime } from "./runtime";

/** Status-bar text follows the resolved theme. Web: no-op. */
export const statusBar = {
  async apply(theme: "light" | "dark"): Promise<void> {
    if (!runtime.isNative()) return;
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({ style: theme === "dark" ? Style.Dark : Style.Light });
    if (runtime.platform() === "android") await StatusBar.setBackgroundColor({ color: "#00000000" }).catch(() => {});
  },
};
```

`src/platform/splash.ts`:

```ts
import { runtime } from "./runtime";

/** Hide the native splash once React has painted. Web: no-op. */
export const splash = {
  async hide(): Promise<void> {
    if (!runtime.isNative()) return;
    const { SplashScreen } = await import("@capacitor/splash-screen");
    await SplashScreen.hide({ fadeOutDuration: 200 });
  },
};
```

`src/platform/share.ts`:

```ts
import { runtime } from "./runtime";
import { downloadText } from "@/features/plan/download";

/** Native share sheet; web uses the Web Share API, then the clipboard, and a download for files. */
export const share = {
  async shareText(title: string, text: string): Promise<void> {
    if (runtime.isNative()) {
      const { Share } = await import("@capacitor/share");
      await Share.share({ title, text });
      return;
    }
    if (navigator.share) await navigator.share({ title, text });
    else await navigator.clipboard?.writeText(text);
  },
  /** v1: native shares the file body as text with the filename in the title (no Filesystem plugin). */
  async shareFile(filename: string, mime: string, text: string): Promise<void> {
    if (runtime.isNative()) {
      const { Share } = await import("@capacitor/share");
      await Share.share({ title: filename, text });
      return;
    }
    downloadText(filename, mime, text);
  },
};
```

`src/platform/notifications.ts`:

```ts
import { runtime } from "./runtime";

export interface ReminderItem { id: number; setId: string; title: string; body: string; at: number }
export type Permission = "granted" | "denied" | "prompt";

/** Local (on-device) notifications for set reminders. Web: unsupported and inert. */
export const notifications = {
  isSupported(): boolean {
    return runtime.isNative();
  },
  async permission(): Promise<Permission> {
    if (!runtime.isNative()) return "denied";
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const { display } = await LocalNotifications.checkPermissions();
    return display === "granted" ? "granted" : display === "denied" ? "denied" : "prompt";
  },
  async request(): Promise<"granted" | "denied"> {
    if (!runtime.isNative()) return "denied";
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const { display } = await LocalNotifications.requestPermissions();
    return display === "granted" ? "granted" : "denied";
  },
  /** Android 12+: exact alarms need a system setting; opens it if not granted. iOS/web: true. */
  async ensureExact(): Promise<boolean> {
    if (runtime.platform() !== "android") return true;
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const { exact_alarm } = await LocalNotifications.checkExactNotificationSetting();
    if (exact_alarm === "granted") return true;
    const after = await LocalNotifications.changeExactNotificationSetting();
    return after.exact_alarm === "granted";
  },
  async pending(): Promise<Array<{ id: number; at?: number }>> {
    if (!runtime.isNative()) return [];
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const { notifications } = await LocalNotifications.getPending();
    return notifications.map((n) => ({ id: n.id, at: n.schedule?.at ? new Date(n.schedule.at).getTime() : undefined }));
  },
  async schedule(items: ReminderItem[]): Promise<void> {
    if (!runtime.isNative() || items.length === 0) return;
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    await LocalNotifications.schedule({
      notifications: items.map((i) => ({
        id: i.id,
        title: i.title,
        body: i.body,
        schedule: { at: new Date(i.at), allowWhileIdle: true },
        extra: { setId: i.setId },
      })),
    });
  },
  async cancel(ids: number[]): Promise<void> {
    if (!runtime.isNative() || ids.length === 0) return;
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    await LocalNotifications.cancel({ notifications: ids.map((id) => ({ id })) });
  },
  /** Fires when the user taps a reminder. Returns an unsubscribe. */
  onTap(handler: () => void): () => void {
    if (!runtime.isNative()) return () => {};
    let remove: (() => void) | undefined;
    let cancelled = false;
    void import("@capacitor/local-notifications").then(async ({ LocalNotifications }) => {
      const h = await LocalNotifications.addListener("localNotificationActionPerformed", () => handler());
      if (cancelled) await h.remove();
      else remove = () => void h.remove();
    });
    return () => { cancelled = true; remove?.(); };
  },
};
```

- [ ] **Step 4: Run the adapter tests**

Run: `npm test -- src/platform/platform.test.ts` — PASS (5 tests). Run `npm run typecheck` — PASS (the plugin packages ship types; if `checkExactNotificationSetting` is missing from the 8.3.1 typings, read `node_modules/@capacitor/local-notifications/dist/esm/definitions.d.ts` and use the exact method names it exports — report any rename).

- [ ] **Step 5: Wire the web-only guards**

`src/app/sw.ts`: add `import { runtime } from "@/platform/runtime";` and make the first line of `setupServiceWorker` `if (runtime.isNative() || env.dev || …) return;`. Add to `sw.test.ts`:

```ts
  it("never registers inside the native shell", () => {
    stubServiceWorker(null);
    (globalThis as { Capacitor?: unknown }).Capacitor = { isNativePlatform: () => true, getPlatform: () => "ios" };
    try {
      setupServiceWorker(PROD);
      expect(registerSW).not.toHaveBeenCalled();
    } finally {
      delete (globalThis as { Capacitor?: unknown }).Capacitor;
    }
  });
```

`src/platform/install.ts`: in `installMode()`, first line `if (runtime.isNative()) return "none";` (import `runtime`). Add to `install.test.ts`:

```ts
  it("mode is none inside the native shell", () => {
    (globalThis as { Capacitor?: unknown }).Capacitor = { isNativePlatform: () => true, getPlatform: () => "ios" };
    try { expect(installMode()).toBe("none"); } finally { delete (globalThis as { Capacitor?: unknown }).Capacitor; }
  });
```

- [ ] **Step 6: Wire haptics, status bar, splash, share**

`src/design/Heart.tsx`: import `haptics` from `@/platform/haptics`; change `onClick={onToggle}` to `onClick={() => { if (!on) void haptics.tap(); onToggle(); }}`.

`src/app/theme.ts`: import `statusBar`; inside `apply`, after setting `dataset.theme`, add `void statusBar.apply(resolveTheme(choice, mq.matches));`.

`src/app/TabShell.tsx`: import `splash`; add `useEffect(() => { void splash.hide(); }, []);`.

`src/features/plan/PlanScreen.tsx`: replace the `downloadText` import with `import { share } from "@/platform/share";`; `exportIcs` becomes `() => void share.shareFile("blues-and-brews-plan.ics", "text/calendar", planToIcs(...))`; `share` local becomes:

```ts
  const shareText = async () => {
    try { await share.shareText("My Blues & Brews plan", planToText(mine, idx.artistsById, idx.stagesById, content.festival)); }
    catch { /* user cancelled the share sheet */ }
  };
```

and the button uses `onClick={shareText}`. Keep `download.ts` (the share adapter uses it).

- [ ] **Step 7: Bundle-size check, full tests, commit**

Run: `npm run typecheck && npm test` — PASS. Run `BASE_PATH=/festival-app/ npm run build` and compare `ls -l dist/assets/index-*.js` with the pre-task size (record both in the report); the main chunk must not grow by more than 5 kB gzipped (`gzip -c dist/assets/index-*.js | wc -c`). The Capacitor plugin chunks appear as separate small `assets/*.js` files.

```bash
git add apps/festival/src/platform apps/festival/src/design/Heart.tsx apps/festival/src/app/theme.ts apps/festival/src/app/TabShell.tsx apps/festival/src/app/sw.ts apps/festival/src/app/sw.test.ts apps/festival/src/features/plan/PlanScreen.tsx
git commit -m "feat(platform): native adapters (haptics, status bar, splash, share, notifications) with web fallbacks"
```

---

### Task 3: Reminder domain and plan store

**Files:**
- Create: `src/domain/reminders.ts`, `src/domain/reminders.test.ts`
- Modify: `src/state/plan.ts`, `src/state/plan.test.ts`
- Modify: any file still referencing `toggleReminder`/`reminders` (grep; expected: none besides the store and `e2e/screenshots.spec.ts` seed data, which drops the `reminders: []` key)

**Interfaces:**
- Produces: `hashId(setId: string): number`, `planReminders(input): ReminderItem[]`, `diffReminders(desired, pending): { cancel: number[]; schedule: ReminderItem[] }`, `usePlanStore().remindersOn` + `setRemindersOn(v)`.

- [ ] **Step 1: Failing domain tests**

`src/domain/reminders.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { diffReminders, hashId, planReminders } from "./reminders";
import type { Artist, FestivalSet, Stage } from "@bb/shared";

const artists = new Map<string, Artist>([
  ["a1", { id: "a1", name: "Samantha Fish", tier: "headliner" } as Artist],
  ["a2", { id: "a2", name: "A Very Long Band Name That Goes On And On Forever", tier: "support" } as Artist],
]);
const stages = new Map<string, Stage>([["main", { id: "main", name: "Main Stage", color: "sky" } as Stage]]);
const set = (id: string, artistId: string, start: string, end: string): FestivalSet =>
  ({ id, artistId, stageId: "main", dayId: "sat", start, end }) as FestivalSet;
const sets = [
  set("s1", "a1", "2026-09-19T16:30:00-06:00", "2026-09-19T17:45:00-06:00"),
  set("s2", "a2", "2026-09-19T12:00:00-06:00", "2026-09-19T13:00:00-06:00"),
  set("s3", "a1", "2026-09-20T20:00:00-06:00", "2026-09-20T21:30:00-06:00"),
];
const now = Date.parse("2026-09-19T15:00:00-06:00");

describe("hashId", () => {
  it("is stable, positive, and 31-bit", () => {
    expect(hashId("s1")).toBe(hashId("s1"));
    expect(hashId("s1")).not.toBe(hashId("s2"));
    expect(hashId("s1")).toBeGreaterThan(0);
    expect(hashId("s1")).toBeLessThanOrEqual(0x7fffffff);
  });
});

describe("planReminders", () => {
  it("schedules upcoming favorites at start minus lead, sorted, skipping past sets", () => {
    const items = planReminders({ favorites: ["s3", "s1", "s2"], sets, artistsById: artists, stagesById: stages, leadMinutes: 15, now });
    expect(items.map((i) => i.setId)).toEqual(["s1", "s3"]);
    expect(items[0]).toEqual({ id: hashId("s1"), setId: "s1", title: "Samantha Fish · Main Stage", body: "Starts in 15 min", at: Date.parse("2026-09-19T16:15:00-06:00") });
  });
  it("skips a set already inside the lead window", () => {
    const soon = Date.parse("2026-09-19T16:20:00-06:00");
    expect(planReminders({ favorites: ["s1"], sets, artistsById: artists, stagesById: stages, leadMinutes: 15, now: soon })).toEqual([]);
  });
  it("truncates long titles to 40 chars with an ellipsis", () => {
    const [item] = planReminders({ favorites: ["s2"], sets, artistsById: artists, stagesById: stages, leadMinutes: 5, now: Date.parse("2026-09-19T10:00:00-06:00") });
    expect(item!.title.length).toBeLessThanOrEqual(40);
    expect(item!.title.endsWith("…")).toBe(true);
  });
  it("ignores favorites with no set", () => {
    expect(planReminders({ favorites: ["ghost"], sets, artistsById: artists, stagesById: stages, leadMinutes: 15, now })).toEqual([]);
  });
});

describe("diffReminders", () => {
  const a = { id: 1, setId: "a", title: "A", body: "b", at: 1000 };
  const b = { id: 2, setId: "b", title: "B", body: "b", at: 2000 };
  it("schedules new, cancels removed, leaves unchanged alone", () => {
    expect(diffReminders([a, b], [{ id: 1, at: 1000 }, { id: 3, at: 3000 }])).toEqual({ cancel: [3], schedule: [b] });
  });
  it("reschedules when the time moved", () => {
    expect(diffReminders([{ ...a, at: 1500 }], [{ id: 1, at: 1000 }])).toEqual({ cancel: [1], schedule: [{ ...a, at: 1500 }] });
  });
  it("treats a pending entry with unknown time as unchanged", () => {
    expect(diffReminders([a], [{ id: 1 }])).toEqual({ cancel: [], schedule: [] });
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- src/domain/reminders.test.ts` — FAIL: cannot resolve `./reminders`.

- [ ] **Step 3: Implement the domain**

`src/domain/reminders.ts`:

```ts
import type { Artist, FestivalSet, Stage } from "@bb/shared";
import { isoMs } from "./time";
import type { ReminderItem } from "@/platform/notifications";

export type { ReminderItem };

const TITLE_MAX = 40;

/** FNV-1a 32-bit hash masked to 31 bits: a stable, positive notification id per set. */
export function hashId(setId: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < setId.length; i++) {
    h ^= setId.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) & 0x7fffffff || 1;
}

export interface PlanInput {
  favorites: string[];
  sets: FestivalSet[];
  artistsById: Map<string, Artist>;
  stagesById: Map<string, Stage>;
  leadMinutes: number;
  now: number;
}

/** The notifications that should exist right now: one per favorited set whose reminder time is still ahead. */
export function planReminders({ favorites, sets, artistsById, stagesById, leadMinutes, now }: PlanInput): ReminderItem[] {
  const wanted = new Set(favorites);
  const items: ReminderItem[] = [];
  for (const s of sets) {
    if (!wanted.has(s.id)) continue;
    const at = isoMs(s.start) - leadMinutes * 60_000;
    if (at <= now) continue;
    const artist = artistsById.get(s.artistId)?.name ?? "Your set";
    const stage = stagesById.get(s.stageId)?.name ?? "";
    const full = stage ? `${artist} · ${stage}` : artist;
    const title = full.length > TITLE_MAX ? `${full.slice(0, TITLE_MAX - 1)}…` : full;
    items.push({ id: hashId(s.id), setId: s.id, title, body: `Starts in ${leadMinutes} min`, at });
  }
  return items.sort((a, b) => a.at - b.at);
}

/** Minimal change set: cancel what is gone or moved, schedule what is new or moved. */
export function diffReminders(desired: ReminderItem[], pending: Array<{ id: number; at?: number }>): { cancel: number[]; schedule: ReminderItem[] } {
  const want = new Map(desired.map((d) => [d.id, d]));
  const have = new Map(pending.map((p) => [p.id, p]));
  const cancel: number[] = [];
  const schedule: ReminderItem[] = [];
  for (const p of pending) {
    const d = want.get(p.id);
    if (!d || (p.at !== undefined && p.at !== d.at)) cancel.push(p.id);
  }
  for (const d of desired) {
    const p = have.get(d.id);
    if (!p || (p.at !== undefined && p.at !== d.at)) schedule.push(d);
  }
  return { cancel, schedule };
}
```

- [ ] **Step 4: Domain tests pass**

Run: `npm test -- src/domain/reminders.test.ts` — PASS (8 tests).

- [ ] **Step 5: Failing store tests**

Append to `src/state/plan.test.ts` (read it first; follow its reset pattern):

```ts
describe("reminders switch", () => {
  it("defaults off and persists the choice", () => {
    expect(usePlanStore.getState().remindersOn).toBe(false);
    usePlanStore.getState().setRemindersOn(true);
    expect(usePlanStore.getState().remindersOn).toBe(true);
    expect(JSON.parse(localStorage.getItem("bb-plan")!).state.remindersOn).toBe(true);
  });
  it("migrates a v0 snapshot by dropping the old per-set reminders list", () => {
    localStorage.setItem("bb-plan", JSON.stringify({ state: { favorites: ["x"], resolutions: {}, reminders: ["x"], settings: { leadMinutes: 15, bufferMinutes: 10 } }, version: 0 }));
    usePlanStore.persist.rehydrate();
    const s = usePlanStore.getState() as unknown as Record<string, unknown>;
    expect(s.favorites).toEqual(["x"]);
    expect(s.reminders).toBeUndefined();
    expect(s.remindersOn).toBe(false);
  });
});
```

- [ ] **Step 6: Run to verify they fail**

Run: `npm test -- src/state/plan.test.ts` — the two new tests FAIL.

- [ ] **Step 7: Update the store**

Replace `src/state/plan.ts` with:

```ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface PlanSettings { leadMinutes: 5 | 15 | 30; bufferMinutes: 0 | 10 | 20 }

interface PlanState {
  favorites: string[];
  resolutions: Record<string, string>;
  settings: PlanSettings;
  /** One switch: remind me before every favorited set (native only; D-023). */
  remindersOn: boolean;
  toggleFavorite: (setId: string) => void;
  resolve: (conflictKey: string, keepSetId: string) => void;
  setSettings: (patch: Partial<PlanSettings>) => void;
  setRemindersOn: (v: boolean) => void;
}

const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

export const usePlanStore = create<PlanState>()(
  persist(
    (set) => ({
      favorites: [],
      resolutions: {},
      settings: { leadMinutes: 15, bufferMinutes: 10 },
      remindersOn: false,
      toggleFavorite: (id) => set((s) => ({ favorites: toggle(s.favorites, id) })),
      resolve: (key, keep) => set((s) => ({ resolutions: { ...s.resolutions, [key]: keep } })),
      setSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      setRemindersOn: (remindersOn) => set({ remindersOn }),
    }),
    {
      name: "bb-plan",
      version: 1,
      // v0 carried a per-set `reminders: string[]` (toggles removed in the design pass); drop it.
      migrate: (persisted) => {
        const { reminders: _dropped, ...rest } = (persisted ?? {}) as Record<string, unknown> & { reminders?: unknown };
        return { remindersOn: false, ...rest } as unknown as PlanState;
      },
    },
  ),
);
```

Grep for leftovers: `grep -rn "toggleReminder\|reminders:" src e2e` — update `e2e/screenshots.spec.ts` seed to drop `reminders: []` and add `remindersOn: false`; fix any other hit.

- [ ] **Step 8: Store tests pass, full suite, commit**

Run: `npm test -- src/state/plan.test.ts` — PASS. `npm run typecheck && npm test` — PASS.

```bash
git add apps/festival/src/domain/reminders.ts apps/festival/src/domain/reminders.test.ts apps/festival/src/state/plan.ts apps/festival/src/state/plan.test.ts apps/festival/e2e/screenshots.spec.ts
git commit -m "feat(plan): reminder planner/reconciler and one-switch store (migrates v0)"
```

---

### Task 4: Reminder sync hook and Plan settings switch

**Files:**
- Create: `src/features/plan/useReminderSync.ts`, `src/features/plan/useReminderSync.test.tsx`
- Modify: `src/features/plan/PlanSettings.tsx`, create `src/features/plan/PlanSettings.test.tsx`
- Modify: `src/app/TabShell.tsx` (mount the hook)

**Interfaces:**
- Consumes: `notifications` adapter (Task 2), `planReminders`/`diffReminders` (Task 3), `usePlanStore.remindersOn`, `useContent()`/`useContentIndex()` from `@/data/content`, `festivalNow` from `@/domain/time`.
- Produces: `useReminderSync()` (call once in `TabShell`).

- [ ] **Step 1: Failing hook test**

`src/features/plan/useReminderSync.test.tsx`:

```tsx
import { act, renderHook } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

const adapter = vi.hoisted(() => ({
  supported: true,
  pendingList: [] as Array<{ id: number; at?: number }>,
  schedule: vi.fn(async (_i: unknown) => {}),
  cancel: vi.fn(async (_ids: number[]) => {}),
  onTap: vi.fn((_h: () => void) => () => {}),
}));
vi.mock("@/platform/notifications", () => ({
  notifications: {
    isSupported: () => adapter.supported,
    pending: async () => adapter.pendingList,
    schedule: adapter.schedule,
    cancel: adapter.cancel,
    onTap: adapter.onTap,
    permission: async () => "granted",
    request: async () => "granted",
    ensureExact: async () => true,
  },
}));

import { useReminderSync } from "./useReminderSync";
import { usePlanStore } from "@/state/plan";
import { hashId } from "@/domain/reminders";

const wrap = ({ children }: { children: ReactNode }) => <MemoryRouter>{children}</MemoryRouter>;
const FAV = "sat-charlie-musselwhite-ga20-main-1630"; // Sat 4:30 PM in the bundled fixture
const flush = () => act(async () => { await Promise.resolve(); await Promise.resolve(); });

describe("useReminderSync", () => {
  beforeEach(() => {
    usePlanStore.setState({ favorites: [], remindersOn: false, settings: { leadMinutes: 15, bufferMinutes: 10 } });
    adapter.pendingList = [];
    adapter.schedule.mockClear();
    adapter.cancel.mockClear();
    vi.useFakeTimers({ now: Date.parse("2026-09-19T10:00:00-06:00") });
  });
  afterEach(() => vi.useRealTimers());

  it("does nothing while the switch is off", async () => {
    usePlanStore.setState({ favorites: [FAV] });
    renderHook(() => useReminderSync(), { wrapper: wrap });
    await flush();
    expect(adapter.schedule).not.toHaveBeenCalled();
  });

  it("schedules favorites when on, cancels when a favorite is removed, cancels all when switched off", async () => {
    usePlanStore.setState({ favorites: [FAV], remindersOn: true });
    renderHook(() => useReminderSync(), { wrapper: wrap });
    await flush();
    expect(adapter.schedule).toHaveBeenCalledTimes(1);
    const [items] = adapter.schedule.mock.calls[0] as [Array<{ id: number; at: number }>];
    expect(items[0]!.id).toBe(hashId(FAV));
    expect(items[0]!.at).toBe(Date.parse("2026-09-19T16:15:00-06:00"));

    adapter.pendingList = [{ id: hashId(FAV), at: items[0]!.at }];
    act(() => usePlanStore.setState({ favorites: [] }));
    await flush();
    expect(adapter.cancel).toHaveBeenLastCalledWith([hashId(FAV)]);

    adapter.pendingList = [{ id: hashId(FAV) }];
    act(() => usePlanStore.setState({ favorites: [FAV] }));
    await flush();
    act(() => usePlanStore.setState({ remindersOn: false }));
    await flush();
    expect(adapter.cancel).toHaveBeenLastCalledWith([hashId(FAV)]);
  });

  it("reschedules when the lead time changes", async () => {
    usePlanStore.setState({ favorites: [FAV], remindersOn: true });
    renderHook(() => useReminderSync(), { wrapper: wrap });
    await flush();
    adapter.pendingList = [{ id: hashId(FAV), at: Date.parse("2026-09-19T16:15:00-06:00") }];
    act(() => usePlanStore.getState().setSettings({ leadMinutes: 30 }));
    await flush();
    expect(adapter.cancel).toHaveBeenLastCalledWith([hashId(FAV)]);
    const last = adapter.schedule.mock.calls.at(-1)![0] as Array<{ at: number }>;
    expect(last[0]!.at).toBe(Date.parse("2026-09-19T16:00:00-06:00"));
  });

  it("is inert where notifications are unsupported", async () => {
    adapter.supported = false;
    usePlanStore.setState({ favorites: [FAV], remindersOn: true });
    renderHook(() => useReminderSync(), { wrapper: wrap });
    await flush();
    expect(adapter.schedule).not.toHaveBeenCalled();
    adapter.supported = true;
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- src/features/plan/useReminderSync.test.tsx` — FAIL: cannot resolve `./useReminderSync`.

- [ ] **Step 3: Write the hook**

`src/features/plan/useReminderSync.ts`:

```ts
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useContent, useContentIndex } from "@/data/content";
import { diffReminders, planReminders } from "@/domain/reminders";
import { festivalNow } from "@/domain/time";
import { notifications } from "@/platform/notifications";
import { usePlanStore } from "@/state/plan";
import { useUiStore } from "@/state/ui";

const TICK_MS = 60_000;

/**
 * Keeps on-device reminders equal to "every favorited upcoming set at start − lead" while the
 * switch is on; cancels everything we own when it is off. Native only; a no-op elsewhere.
 * Runs on mount too, so schedule changes published while the app was closed reconcile on launch.
 */
export function useReminderSync(): void {
  const navigate = useNavigate();
  const content = useContent();
  const idx = useContentIndex();
  const favorites = usePlanStore((s) => s.favorites);
  const leadMinutes = usePlanStore((s) => s.settings.leadMinutes);
  const remindersOn = usePlanStore((s) => s.remindersOn);
  const devNow = useUiStore((s) => s.devNow);
  const owned = useRef<Set<number>>(new Set());
  const chain = useRef<Promise<void>>(Promise.resolve());

  // Tap on a reminder → Plan tab.
  useEffect(() => notifications.onTap(() => navigate("/plan")), [navigate]);

  useEffect(() => {
    if (!notifications.isSupported()) return;
    const run = () => {
      chain.current = chain.current.then(async () => {
        const pending = await notifications.pending();
        if (!remindersOn) {
          const ids = [...new Set([...owned.current, ...pending.map((p) => p.id)])].filter((id) => owned.current.has(id) || pending.some((p) => p.id === id));
          if (ids.length) await notifications.cancel(ids);
          owned.current.clear();
          return;
        }
        const desired = planReminders({
          favorites, sets: content.sets, artistsById: idx.artistsById, stagesById: idx.stagesById, leadMinutes,
          now: festivalNow(devNow).getTime(),
        });
        const { cancel, schedule } = diffReminders(desired, pending);
        if (cancel.length) await notifications.cancel(cancel);
        if (schedule.length) await notifications.schedule(schedule);
        owned.current = new Set(desired.map((d) => d.id));
      }).catch((e: unknown) => { if (import.meta.env.DEV) console.warn("reminder sync failed", e); });
    };
    run();
    const t = setInterval(run, TICK_MS);
    return () => clearInterval(t);
  }, [remindersOn, favorites, leadMinutes, content, idx, devNow]);
}
```

- [ ] **Step 4: Hook tests pass**

Run: `npm test -- src/features/plan/useReminderSync.test.tsx` — PASS (4 tests). If the fake-timer/`flush` combination leaves a promise unresolved, replace `flush` with `await act(async () => { await vi.advanceTimersByTimeAsync(0); })` and note it in the report; do not weaken assertions.

- [ ] **Step 5: Mount it**

`src/app/TabShell.tsx`: `import { useReminderSync } from "@/features/plan/useReminderSync";` and call `useReminderSync();` after `useApplyTheme();`. Run `npm test -- src/app/shell.test.tsx` — PASS (the adapter is unsupported under Vitest so the hook is inert).

- [ ] **Step 6: Failing settings test**

`src/features/plan/PlanSettings.test.tsx`:

```tsx
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const adapter = vi.hoisted(() => ({ supported: true, request: vi.fn(async () => "granted" as "granted" | "denied"), ensureExact: vi.fn(async () => true) }));
vi.mock("@/platform/notifications", () => ({
  notifications: { isSupported: () => adapter.supported, request: adapter.request, ensureExact: adapter.ensureExact, permission: async () => "prompt", pending: async () => [], schedule: async () => {}, cancel: async () => {}, onTap: () => () => {} },
}));

import { PlanSettings } from "./PlanSettings";
import { usePlanStore } from "@/state/plan";

describe("PlanSettings reminders switch", () => {
  beforeEach(() => { usePlanStore.setState({ remindersOn: false }); adapter.supported = true; adapter.request.mockResolvedValue("granted"); });
  afterEach(() => vi.clearAllMocks());

  it("is hidden where notifications are unsupported", () => {
    adapter.supported = false;
    render(<PlanSettings onClose={() => {}} />);
    expect(screen.queryByRole("switch", { name: "Remind me before my sets" })).not.toBeInTheDocument();
  });

  it("asks permission and turns on when granted", async () => {
    render(<PlanSettings onClose={() => {}} />);
    fireEvent.click(screen.getByRole("switch", { name: "Remind me before my sets" }));
    await waitFor(() => expect(usePlanStore.getState().remindersOn).toBe(true));
    expect(adapter.request).toHaveBeenCalledTimes(1);
    expect(adapter.ensureExact).toHaveBeenCalledTimes(1);
  });

  it("snaps back and explains when denied", async () => {
    adapter.request.mockResolvedValue("denied");
    render(<PlanSettings onClose={() => {}} />);
    fireEvent.click(screen.getByRole("switch", { name: "Remind me before my sets" }));
    expect(await screen.findByText(/Notifications are off for this app in Settings/)).toBeInTheDocument();
    expect(usePlanStore.getState().remindersOn).toBe(false);
  });

  it("turns off without asking", async () => {
    usePlanStore.setState({ remindersOn: true });
    render(<PlanSettings onClose={() => {}} />);
    fireEvent.click(screen.getByRole("switch", { name: "Remind me before my sets" }));
    await waitFor(() => expect(usePlanStore.getState().remindersOn).toBe(false));
    expect(adapter.request).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 7: Run to verify it fails**

Run: `npm test -- src/features/plan/PlanSettings.test.tsx` — FAIL (no switch).

- [ ] **Step 8: Add the switch**

Replace `src/features/plan/PlanSettings.tsx` with:

```tsx
import { useState } from "react";
import { Eyebrow, SegmentedControl, Sheet, Toggle } from "@/design";
import { notifications } from "@/platform/notifications";
import { usePlanStore } from "@/state/plan";

export function PlanSettings({ onClose }: { onClose: () => void }) {
  const { settings, setSettings, remindersOn, setRemindersOn } = usePlanStore();
  const [denied, setDenied] = useState(false);
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const supported = notifications.isSupported();

  const onToggle = async (v: boolean) => {
    if (!v) { setRemindersOn(false); setDenied(false); return; }
    const perm = await notifications.request();
    if (perm !== "granted") { setDenied(true); setRemindersOn(false); return; }
    await notifications.ensureExact();
    setDenied(false);
    setRemindersOn(true);
  };

  return (
    <Sheet onClose={onClose} title="Plan settings">
      <h2 className="font-display text-[24px] leading-7">Plan settings</h2>
      <div className="mt-4 space-y-4">
        {supported && (
          <div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Eyebrow tone="structure">Reminders</Eyebrow>
                <div className="mt-1 text-[15px]">Remind me before my sets</div>
                <p className="mt-0.5 text-[13px] text-fg-soft">Uses your lead time below. Works with the app closed.</p>
              </div>
              <Toggle on={remindersOn} onChange={(v) => void onToggle(v)} label="Remind me before my sets" />
            </div>
            {denied && <p className="mt-1.5 text-[13px] text-ember">Notifications are off for this app in Settings.</p>}
            {import.meta.env.DEV && (
              <button type="button" className="mt-1.5 text-[12px] underline text-fg-soft" onClick={() => void notifications.pending().then((p) => setPendingCount(p.length))}>
                pending: {pendingCount ?? "?"}
              </button>
            )}
          </div>
        )}
        <div><Eyebrow tone="structure">Remind me before a set</Eyebrow><div className="mt-2"><SegmentedControl label="Reminder lead time" value={String(settings.leadMinutes)} onChange={(v) => setSettings({ leadMinutes: Number(v) as 5 | 15 | 30 })} options={[{ value: "5", label: "5 min" }, { value: "15", label: "15 min" }, { value: "30", label: "30 min" }]} /></div></div>
        <div><Eyebrow tone="structure">Buffer between stages</Eyebrow><div className="mt-2"><SegmentedControl label="Buffer" value={String(settings.bufferMinutes)} onChange={(v) => setSettings({ bufferMinutes: Number(v) as 0 | 10 | 20 })} options={[{ value: "0", label: "None" }, { value: "10", label: "10 min" }, { value: "20", label: "20 min" }]} /></div><p className="mt-1.5 text-[13px] text-fg-soft">Sets closer together than this are flagged so you have time to walk over.</p></div>
      </div>
    </Sheet>
  );
}
```

- [ ] **Step 9: Tests pass, full suite, commit**

Run: `npm test -- src/features/plan/PlanSettings.test.tsx` — PASS (4). `npm run typecheck && npm test` — PASS.

```bash
git add apps/festival/src/features/plan/useReminderSync.ts apps/festival/src/features/plan/useReminderSync.test.tsx apps/festival/src/features/plan/PlanSettings.tsx apps/festival/src/features/plan/PlanSettings.test.tsx apps/festival/src/app/TabShell.tsx
git commit -m "feat(plan): one-switch set reminders via local notifications"
```

---

### Task 5: Native icons and splash

**Files:**
- Modify: `apps/festival/scripts/icons.ts`
- Create: `apps/festival/scripts/splash.ts`
- Modify: `apps/festival/package.json` (script `splash:build`)
- Generate + commit: `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png` (1024, replacing the template icon; keep the template's `Contents.json` filename or update it), `ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732*.png` (three copies, per the template's `Contents.json`), `android/app/src/main/res/mipmap-*/ic_launcher*.png` (via the adaptive XML) — specifically: `res/mipmap-anydpi-v26/ic_launcher.xml` + `ic_launcher_round.xml` referencing `@mipmap/ic_launcher_foreground`, `@color/ic_launcher_background`, `@mipmap/ic_launcher_monochrome`; `res/mipmap-{mdpi,hdpi,xhdpi,xxhdpi,xxxhdpi}/ic_launcher_foreground.png` (108 dp → 108/162/216/324/432 px) and `ic_launcher_monochrome.png` (same sizes); `res/values/ic_launcher_background.xml` (`#1890A8`); legacy `ic_launcher.png`/`ic_launcher_round.png` per density (48 dp → 48/72/96/144/192) rendered from the full-bleed icon; notification `res/drawable-{mdpi,hdpi,xhdpi,xxhdpi,xxxhdpi}/ic_stat_sun.png` (24 dp → 24/36/48/72/96, white on transparent); `res/drawable*/splash.png` per the Capacitor template list (or `res/values/styles.xml` `windowSplashScreenBackground` = `#EBD5B3` with icon-only splash on Android 12+).

**Interfaces:**
- Consumes: `public/icons/icon.svg` (Task 3 of the PWA phase), `public/art/lockup.webp`.
- Produces: assets referenced by the native projects; `npm run icons:build` and `npm run splash:build` regenerate them.

- [ ] **Step 1: Extend `scripts/icons.ts`**

Keep the existing web variants. Add, after them, a second table rendered by the same page loop:

```ts
const NATIVE = [
  { file: "../../ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png", size: 1024, inset: 0, alpha: false },
  ...[["mdpi", 108], ["hdpi", 162], ["xhdpi", 216], ["xxhdpi", 324], ["xxxhdpi", 432]].map(([d, px]) => ({ file: `../../android/app/src/main/res/mipmap-${d}/ic_launcher_foreground.png`, size: px as number, inset: 0.18, alpha: true })),
  ...[["mdpi", 108], ["hdpi", 162], ["xhdpi", 216], ["xxhdpi", 324], ["xxxhdpi", 432]].map(([d, px]) => ({ file: `../../android/app/src/main/res/mipmap-${d}/ic_launcher_monochrome.png`, size: px as number, inset: 0.18, alpha: true, mono: true })),
  ...[["mdpi", 48], ["hdpi", 72], ["xhdpi", 96], ["xxhdpi", 144], ["xxxhdpi", 192]].flatMap(([d, px]) => [
    { file: `../../android/app/src/main/res/mipmap-${d}/ic_launcher.png`, size: px as number, inset: 0, alpha: false },
    { file: `../../android/app/src/main/res/mipmap-${d}/ic_launcher_round.png`, size: px as number, inset: 0, alpha: false, round: true },
  ]),
  ...[["mdpi", 24], ["hdpi", 36], ["xhdpi", 48], ["xxhdpi", 72], ["xxxhdpi", 96]].map(([d, px]) => ({ file: `../../android/app/src/main/res/drawable-${d}/ic_stat_sun.png`, size: px as number, inset: 0.05, alpha: true, mono: true })),
] as const;
```

Rendering rules (implement in the loop; `alpha: true` → `omitBackground: true` and no body gradient; `mono: true` → replace both gradients with `#FFFFFF` fills and drop the disc stroke via string replaces on the SVG (`fill="url(#sun)"` → `fill="#FFFFFF"`, `stroke="#1E1A1A"` → `stroke="none"`); `round: true` → wrap the body in `border-radius: 50%; overflow: hidden` so the legacy round icon is pre-masked; `inset` semantics unchanged). `mkdirSync(dirname(out), { recursive: true })` before each write. Print one line per file.

- [ ] **Step 2: Android adaptive XML + background color**

Create `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml` and `ic_launcher_round.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
  <background android:drawable="@color/ic_launcher_background"/>
  <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
  <monochrome android:drawable="@mipmap/ic_launcher_monochrome"/>
</adaptive-icon>
```

`android/app/src/main/res/values/ic_launcher_background.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources><color name="ic_launcher_background">#1890A8</color></resources>
```

Remove the template's vector `ic_launcher_foreground.xml`/`ic_launcher_background.xml` under `res/drawable*` if present so the PNGs win (grep `ic_launcher` under `res/` and reconcile duplicates; a resource may exist in only one type per name).

- [ ] **Step 3: Splash script**

`scripts/splash.ts`:

```ts
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
```

Add `"splash:build": "node scripts/splash.ts"` to `package.json` scripts. Confirm the filenames match the template's `Splash.imageset/Contents.json` (adjust the loop's names to whatever it lists).

Android: in `android/app/src/main/res/values/styles.xml` set `<item name="windowSplashScreenBackground">#EBD5B3</item>` (and `android:windowSplashScreenBackground` if the template uses the `Theme.SplashScreen` style) — icon-only splash from the adaptive icon; remove the template's `splash.png` drawables if present so no dark placeholder flashes.

- [ ] **Step 4: Generate and inspect**

Run: `npm run icons:build && npm run splash:build`. Use the Read tool on `AppIcon-512@2x.png`, one `ic_launcher_foreground.png`, one `ic_stat_sun.png`, and one splash — foreground has the sun inside the centre ~66 % with transparent surround; `ic_stat_sun` is white on transparent; splash is paper with the lockup centred. `sips -g hasAlpha` on the 1024 iOS icon → `no`.

- [ ] **Step 5: Sync, build both, commit**

Run: `npx cap sync && npm run cap:build:ios && npm run cap:build:android` — both succeed. `npm run typecheck && npm test` — PASS.

```bash
git add apps/festival/scripts/icons.ts apps/festival/scripts/splash.ts apps/festival/package.json apps/festival/ios/App/App/Assets.xcassets apps/festival/android/app/src/main/res
git commit -m "feat(native): app icons, adaptive icon, notification icon, and splash from the sun + lockup"
```

---

### Task 6: Simulator smoke, docs, checklist

**Files:**
- Modify: `(root) docs/HANDOFF.md`, `docs/STORE-CHECKLIST.md`, `CLAUDE.md`
- Modify: `apps/festival/README.md` if present (else HANDOFF only)

- [ ] **Step 1: Run on the simulator**

```bash
npm run cap:sync
npx cap run ios --target "iPhone 17 Pro" 2>&1 | tail -5
```

(If that device name is absent, `xcrun simctl list devices available | grep iPhone` and pick one.) Expected: the app launches on a paper splash, then the Now screen with live content. Then, driving the simulator (controller uses the iOS Simulator tool; an implementer uses `xcrun simctl`/screenshots): favorite a set on Lineup; open Plan → ⚙ → toggle "Remind me before my sets" → iOS permission alert → Allow; tap the DEV `pending: ?` readout → shows `pending: 1`; unfavorite → `pending: 0`. Record screenshots in `docs/screens/native/` (`ios-splash.png`, `ios-now.png`, `ios-plan-settings.png`).

- [ ] **Step 2: Docs**

`docs/HANDOFF.md`: status board row `| Native (icons, push, notifications) | ⬜ | Day 4 |` → `| Native shell | ✅ Sep 10 | Capacitor 8 iOS/Android in \`apps/festival/{ios,android}\` (D-023); reminders = one switch over favorites via local notifications; haptics, status bar, splash, icons; simulator-verified. Pending: Apple/Play accounts → TestFlight/closed track (STORE-CHECKLIST §1/§7); push needs Blaze (D-021) |`. Commands section: add `npm run cap:sync · cap:ios · cap:android · cap:build:ios · cap:build:android · splash:build` with one line each. Note: "Native builds are not in CI; `cap sync` output (`ios/App/App/public`, `android/app/src/main/assets/public`) is git-ignored and regenerated."

`docs/STORE-CHECKLIST.md`: tick (☑) the §0 rows for app display name and bundle ID (values now locked in `capacitor.config.ts`), iPhone-only, and the §2 Apple items `Info.plist` (display name, non-exempt encryption, portrait) and `PrivacyInfo.xcprivacy`; §2 Google items `applicationId`/`versionCode`/`versionName`, `targetSdkVersion 36`, adaptive icon + notification small icon. Leave signing/keystore/Firebase rows unticked.

`CLAUDE.md` Commands line: append `` · `npm run cap:sync` · `npm run cap:ios` · `npm run cap:android` ``; add a rule bullet: "Native: platform APIs only through `src/platform/*` adapters with web fallbacks; never commit signing material, keystores, or Firebase native config (D-023)."

- [ ] **Step 3: Full checks and commit**

Run (from `apps/festival`): `npm run typecheck && npm test` — PASS; `BASE_PATH=/festival-app/ npm run build` — PASS (web unaffected).

```bash
git add docs/HANDOFF.md docs/STORE-CHECKLIST.md CLAUDE.md docs/screens/native
git commit -m "docs(native): handoff, store checklist ticks, simulator screenshots"
```

---

## Self-review notes

- Spec §4 → Task 1; §5 → Task 2; §6 → Tasks 3–4; §7 → Task 2 (wiring); §8 → Task 5; §9/§10 → tests in each task + Task 6.
- Names consistent: `runtime`, `haptics`, `statusBar`, `splash`, `share`, `notifications`, `ReminderItem`, `hashId`, `planReminders`, `diffReminders`, `remindersOn`/`setRemindersOn`, `useReminderSync`, scripts `cap:sync`, `cap:build:ios`, `cap:build:android`, `splash:build`.
- Known plan-level risks for implementers to report rather than guess: exact `@capacitor/local-notifications` 8.3.1 method names for the exact-alarm setting; the Capacitor 8 iOS template's `AppIcon.appiconset`/`Splash.imageset` filenames; whether the Android template still ships bitmap splash drawables.
