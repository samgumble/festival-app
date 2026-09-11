# Privacy answers — App Privacy label (Apple) and Data safety form (Play)

Grounded in the facts confirmed for this app: no accounts, no analytics SDK (Firebase Analytics is never initialized — `docs/DECISIONS.md` D-012, D-021; `CLAUDE.md`), no ads, no location tracking, no push in v1 (D-021, no Cloud Functions on the Spark plan). Favorites, plan, and settings are stored only in the device's WebView `localStorage` (`apps/festival/src/features/info/InfoScreen.tsx` privacy text; `docs/DECISIONS.md` D-023 addendum). Live lineup and alerts are read from a public Firestore collection with no sign-in.

**⚠ Verify every answer below against Apple's and Google's current definitions and forms before submitting — both have changed these questionnaires before, and this file reflects the facts as of 2026-09-11, not a guarantee the console UI still asks the same questions the same way.**

---

## Apple App Privacy ("nutrition label")

Expected top-line answer: **Data Not Collected.**

Apple's categories, answered against the actual binary:

| Category | Answer | Reasoning |
|---|---|---|
| Contact Info | Not Collected | No accounts, no forms, nothing to enter. |
| Health & Fitness | Not Collected | Not applicable. |
| Financial Info | Not Collected | No purchases, no IAP, no payment fields. |
| Location | Not Collected | No location APIs used; the "Town Park in Maps" link (`InfoScreen.tsx`) opens the system Maps app with a static address string — the app itself never reads device location. |
| Sensitive Info | Not Collected | Not applicable. |
| Contacts | Not Collected | Not applicable. |
| User Content | Not Collected | No photos, no user-authored text stored server-side; favorites/plan/settings never leave the device. |
| Browsing History | Not Collected | External links open in the system browser/SFSafariViewController (STORE-CHECKLIST §5), not tracked by the app. |
| Search History | Not Collected | The Lineup search box filters bundled/cached content client-side; nothing is sent anywhere. |
| Identifiers | Not Collected | No accounts, no device ID collection, no advertising ID (Advertising Identifier declared **No**). No push tokens exist in this version — v1 has no Cloud Messaging registration (D-021). |
| Purchases | Not Collected | Free app, no IAP. |
| Usage Data | Not Collected | No analytics SDK initialized (Firebase Analytics stays off per D-012/D-021 and `CLAUDE.md`). |
| Diagnostics | Not Collected | No crash-reporting SDK (no Crashlytics). Errors are logged locally only. |
| Other Data | Not Collected | Not applicable. |

### Honest caveats to disclose internally (not necessarily separate label answers, but keep on file for review)

1. **Network-necessity IP address.** Every Firestore read (`content/published`, `alerts`) is an HTTPS request to Google's infrastructure, which — like any network request — carries the device's IP address as a transport-layer necessity. Apple's guidance excludes IP addresses collected *solely* to fulfill the request and not linked to the user or retained for another purpose; this app does not read, store, or link that IP address itself. State this in review notes if asked (`docs/store/review-notes.md`), and re-read Apple's current "Data Not Collected" definition before answering, since this exact carve-out is the part of the label Apple revises most often.
2. **No identifiers of any kind are stored by us.** Firestore reads are unauthenticated and anonymous; there is no `admins`-collection access from the fan app (`firebase/firestore.rules`), and the fan app never signs in.
3. **No third-party SDK collects data.** The only Firebase products used by the fan app in this version are Firestore (public read) and, later, Cloud Messaging once Blaze is enabled (D-021) — Analytics, Crashlytics, and Performance Monitoring are not integrated. If Cloud Messaging is added for push in a later version, this label must be revisited (push tokens would likely need declaring, even if not linked to identity).
4. **Local notifications are 100% on-device.** The "Remind me before my sets" switch (D-023) schedules native local notifications via `@capacitor/local-notifications`; nothing about that schedule is transmitted anywhere.

### App Review Information note (cross-reference)

State in the App Privacy section (and in review notes) that this is a first submission with no accounts and no analytics, so the "Data Not Collected" answer should be verifiable by inspecting the built binary for any Firebase Analytics/Crashlytics initialization calls — there are none (`grep` the bundle for `getAnalytics`/Crashlytics init before final upload as a sanity check).

---

## Apple `PrivacyInfo.xcprivacy` — required-reason API declarations

Current file: `apps/festival/ios/App/App/PrivacyInfo.xcprivacy`.

```xml
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
```

- `NSPrivacyTracking = false`, no tracking domains, no collected data types declared — consistent with the "Data Not Collected" label above.
- One required-reason API category declared: **User Defaults**, reason **CA92.1** ("Access info from same app, extension, or App Group"), which covers Capacitor/WebKit's use of `UserDefaults` for its own bridge/preferences plumbing.
- **⚠ Re-verify against Capacitor 8's current documentation before every upload.** Capacitor plugins (especially `@capacitor/local-notifications`, `@capacitor/preferences` if reintroduced, `@capacitor/share`) can each pull in required-reason APIs (e.g. file timestamp APIs, `NSFileManager`) as their implementations change between minor versions; Apple's App Store Connect upload step now flags a build if a used required-reason API has no matching reason string, so a stale manifest can hard-block an upload rather than just draw a warning. Diff the shipped plugin versions against Capacitor's "iOS Privacy Manifest" guidance for 8.5.x before the Sep 14 build.

---

## Google Play Data safety form

Answer for every data-type section Play asks about (Personal info, Financial info, Health and fitness, Messages, Photos and videos, Audio files, Files and docs, Calendar, Contacts, App activity, Web browsing, App info and performance, Device or other IDs):

| Question | Answer | Justification |
|---|---|---|
| Does your app collect or share any of the required user data types? | **No** | Nothing is collected off-device; favorites/plan/settings live only in local storage. |
| Is all user data encrypted in transit? | **Yes** (informational — no user data is collected, but all network calls, including public Firestore reads, are HTTPS) | Firestore SDK uses TLS by default; there is no unencrypted network path in the app. |
| Do you provide a way for users to request their data be deleted? | **Not applicable / N/A — no accounts, no server-side user data exists to delete** | There is nothing to delete: no accounts, no server-side per-user records. |
| Does your app collect or share any of: location, personal info, financial info, health and fitness, messages, photos/video, audio, files/docs, calendar, contacts, app activity, web browsing, app info & performance, device/other IDs? | **No, for every category** | Confirmed against the actual data flows: local storage only for favorites/plan/settings; public, unauthenticated Firestore reads for lineup/alerts; no crash/analytics SDK; no device identifiers read or transmitted. |

### SCHEDULE_EXACT_ALARM use-case declaration (Play Console → App content)

The `@capacitor/local-notifications` plugin merges `SCHEDULE_EXACT_ALARM` into the manifest unconditionally (`docs/HANDOFF.md` status board, `docs/STORE-CHECKLIST.md` §2). Declaration text to paste into Play Console's permission-declaration form:

```
This app schedules a local, on-device reminder before each festival set the user has favorited, using the "Remind me before my sets" switch. Reminders must fire at the exact minute the user chose (e.g. 15 minutes before a set starts) so the notification is still useful; inexact alarms can be delayed by the system by many minutes, which would defeat the feature's purpose. The alarm is scheduled directly by explicit, in-the-moment user action (turning the switch on) and is never used for background refresh, analytics, or advertising. No server-triggered or automatically-recurring alarms are scheduled.
```

### Sensitive permissions section

| Permission | Platform | Why requested | When requested |
|---|---|---|---|
| `POST_NOTIFICATIONS` | Android 13+ | Required at runtime to show the local set-reminder notifications and the in-app Alerts (no push in v1; this is only for local notifications) | Only after the user turns on "Remind me before my sets" in Plan/Info, with in-app explanation first (STORE-CHECKLIST §5, Apple guideline 5.1.1) |
| `SCHEDULE_EXACT_ALARM` | Android (merged by `@capacitor/local-notifications`) | See declaration above | Not user-facing; declared at install time, exercised only when reminders are turned on |
| Local notification permission | iOS | Same reminder feature | Same trigger — after the switch is tapped, with an in-app explanation first, never on cold launch |

No camera, microphone, contacts, storage, location, or SMS permissions are requested by this app.

### Advertising ID declaration

**No** — the app does not use the Advertising ID. Confirm at build time that the merged Android manifest carries no `com.google.android.gms.permission.AD_ID` entry (Firebase Cloud Messaging alone does not add it, but any future SDK addition should be re-checked here, per STORE-CHECKLIST §4).
