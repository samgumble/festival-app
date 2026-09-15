# App Review notes — Telluride Blues & Brews

Text to paste into App Store Connect's "App Review Information → Notes" field and Play Console's "App content → App access / instructions for review" field, plus talking points if a reviewer follows up.

---

## Apple App Review notes (guideline 4.2 pre-empt)

```
Telluride Blues & Brews is the official companion app for the 32nd Telluride Blues & Brews Festival (Sep 18-20, 2026, Telluride Town Park, Telluride, Colorado), built for SBG Productions, the festival's producer.

No sign-in is required. There are no demo credentials to provide.

This is more than a website wrapper:
- The full festival schedule and your personal plan render from data bundled at build time and cached on-device, so lineup and schedule are fully usable in Airplane Mode from a cold launch, including immediately after install. Alerts shows the last batch of organizer updates synced to the device; on a device that has never been online, the Alerts tab is empty until it first connects.
- "My Schedule" (the Schedule tab) runs an on-device conflict engine: favoriting overlapping sets on different stages surfaces a conflict with a one-tap resolution, and a "what should I see next" recommendation, entirely client-side.
- Set reminders use native local notifications (not push) scheduled directly on the device when the user turns on "Remind me before my sets."
- The app uses native tab-bar navigation, sheet presentations with grabbers, and haptics (via Capacitor plugins), matching iOS conventions rather than presenting a single scrollable web page.
- All lineup, schedule, and alert content is authored and published by the festival organizer (SBG Productions) through a password-protected admin console, not generated or scraped by this app.

Suggested review path:
1. Launch the app (no login).
2. Go to Lineup, search or browse, and favorite two or three sets using the heart icon.
3. Go to the Schedule tab — "My Schedule" builds your personal schedule automatically, with a conflict flagged if you favorited overlapping sets.
4. Turn on "Remind me before my sets" in the Schedule tab's settings sheet (gear icon, top-right of My Schedule) — a native notification permission prompt appears with an in-app explanation first.
5. Put the device in Airplane Mode and relaunch the app — the lineup and your schedule still render fully from bundled/cached content; Alerts shows whatever was last synced (empty if this device has never been online).
6. Open Alerts to see organizer-published festival updates from the last sync.

Privacy: no accounts, no analytics SDK, no advertising, no location tracking. Favorites, plan, and settings stay on the device. See the App Privacy answers in this submission and `docs/store/privacy-answers.md` in the source repository for the full reasoning.

"Add to calendar" saves an .ics file on the web version; on iPhone in v1 it offers "Share as text" instead of writing to the device calendar directly.

Interim icon: if asked about the current app icon, note that it is a code-drawn sun on the app's sky-to-night gradient, intentionally matching the app's design system, while the PSD-derived icon export from the official festival poster is finalized (see docs/DECISIONS.md D-022). The official poster artwork and logo lockups used inside the app (splash screen, Info tab, lineup imagery) are the real, licensed SBG Productions artwork, used unmodified with permission — only the launcher icon is a temporary placeholder pending final asset export.

Demo content: the schedule shown in this build is the real, official 2026 lineup (35 artists, 46 sets, four stages, three days), sourced from tellurideblues.com and entered by SBG Productions through the admin console — it is not sample or placeholder data.
```

**Only if the App Store Connect / Apple Developer account is Sam Gumble's personal account rather than an SBG Productions organization account, append this sentence to the notes above:** (pending — the signed SBG Productions authorization letter has not yet been obtained)

```
Third-party authorization: the attached signed SBG Productions authorization letter (STORE-CHECKLIST §0) confirms Sam's authorization to publish this app, use the "Telluride Blues & Brews" name, and use the 2026 festival artwork under guideline 5.2.1.
```

---

## Google Play "Instructions for review" / App content notes

```
Telluride Blues & Brews is the official companion app for the 32nd Telluride Blues & Brews Festival (Sep 18-20, 2026, Telluride Town Park, Telluride, Colorado), for SBG Productions, the festival's producer.

App access: all functionality is available without login or special access — no test account is needed.

How to exercise the app:
1. Open the app.
2. Go to Lineup, browse by day/stage or search, and tap the heart on two or three sets to favorite them.
3. Go to the Schedule tab to see the personal schedule ("My Schedule") build automatically, including a conflict flag if favorited sets overlap across stages.
4. Turn on "Remind me before my sets" (in the Schedule tab's settings sheet) to see the local-notification permission request (Android 13+ POST_NOTIFICATIONS), requested only after this explicit action with in-app context first.
5. Enable Airplane Mode and reopen the app — the lineup and schedule remain fully usable from bundled/cached content; the Alerts tab shows whatever was last synced (empty if this device has never been online).
6. Open Alerts to see organizer-published festival updates (no push in this version — see docs/store/privacy-answers.md for the SCHEDULE_EXACT_ALARM permission declaration).

Content authorship: all lineup and alert content is entered and published by SBG Productions staff through a separate, password-protected admin console; this app only displays it.

"Add to calendar" saves an .ics file on the web version; on Android in v1 it offers "Share as text" instead of writing to the device calendar directly.
```

**Only if the Play Console developer account is Sam Gumble's personal account rather than SBG Productions' organization account, append this sentence to the notes above:** (pending — the signed SBG Productions authorization letter has not yet been obtained)

```
Third-party branding: this app is published with a signed authorization letter from SBG Productions on file, confirming permission to use the "Telluride Blues & Brews" name and the 2026 festival artwork.
```

---

## Talking points if a reviewer follows up

- **"This looks like a web app in a wrapper."** Point to: native tab bar, native sheet presentation with drag handles, haptics, offline-first bundled content, on-device conflict engine, and native local notifications — none of which are simply an embedded website. See the guideline 4.2 pre-empt above.
- **"Who authorized publishing the 'Telluride Blues & Brews' name and artwork?"** SBG Productions, the festival's producer — either the store account itself is SBG's, or the authorization-letter sentence appended above (once obtained) confirms it.
- **"The app icon doesn't match the marketing artwork."** True and acknowledged — see the "Interim icon" note above. The official festival artwork inside the app (splash, Info tab) is the real licensed art; only the launcher icon is a temporary placeholder.
- **"Is this schedule real or a demo?"** Real — the 2026 official lineup, entered by SBG Productions via the admin console, verified against tellurideblues.com. Nothing in the app is sample/seed data left over from development.
- **"Are the Alerts shown in the store screenshots real?"** No — the Alerts store screenshot is composed from benign sample notices (a welcome message, an altitude/hydration reminder, and a caption showing where organizer updates appear), not a real incident or an actual 2026 alert.
- **"What data does this collect?"** None, per the App Privacy / Data safety answers — see `docs/store/privacy-answers.md`.

## Open placeholders in this file

- SBG Productions authorization letter — needed only if the store accounts are Sam's personal accounts rather than SBG's; not yet obtained (STORE-CHECKLIST §0/§1). If needed, append the sentence provided below each review-notes fence above.
- Reviewer contact name/phone/email for App Store Connect's "App Review Information" (first/last name, phone, email) — not filled in here; use Sam's or SBG's real contact details when submitting, not a placeholder in the console itself.
- Support email and support URL (`docs/store/listing.md`) — still undecided; both are required before either console submission can be completed.
