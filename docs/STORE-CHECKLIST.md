# STORE-CHECKLIST — App Store and Google Play publishing

Everything required to get **Telluride Blues & Brews** onto both stores, in the order it has to happen. Tick items in this file as they land (☐ → ☑ with a date) so any session can see exactly where publishing stands. Values in *italics* are decisions Sam/SBG still need to make; record the final value inline.

Verified against current store guidance on 2026-09-09; re-check anything marked ⚠ in the console before submitting, since Apple and Google change these details often.

---

## 0. Decisions to lock before anything else

| # | Item | Value |
|---|---|---|
| ☐ | Which entity owns the store accounts | *Sam personal / SBG Productions organization* — **strongly prefer SBG's accounts from day one**; transfers later are possible but slow and Apple transfers reset some metadata |
| ☐ | Apple Developer Program account type | *Individual / Organization (needs SBG's D-U-N-S number and a person with legal authority to bind SBG)* |
| ☐ | Google Play developer account type | *Personal / Organization (D-U-N-S)* — personal accounts created after Nov 13 2023 must run a 14-day closed test with 12 opted-in testers before production |
| ☐ | Third-party authorization | If the accounts are Sam's, obtain a signed letter from SBG Productions authorizing Sam to publish the app, use the "Telluride Blues & Brews" name, and the 2026 artwork (Apple guideline 5.2.1 "Intellectual Property"). Keep a PDF in 1Password and be ready to attach it in review notes. |
| ☑ | App display name | *"Telluride Blues & Brews"* (App Store name ≤ 30 chars; Play title ≤ 30) — locked in `capacitor.config.ts` `appName` |
| ☑ | Bundle ID / application ID | *`com.sbgproductions.bluesandbrews`* — identical on both platforms; cannot change after first upload — locked in `capacitor.config.ts` `appId`, iOS `Info.plist`, and Android `build.gradle` `applicationId` |
| ☐ | Support email + support URL | *e.g. app-support@… / tellurideblues.com/app* (required on both stores) |
| ☑ | Privacy policy URL | `https://samgumble.github.io/festival-app/privacy` — live (the app serves its own policy at `/privacy`, D-025); swap to a tellurideblues.com URL later if SBG prefers |
| ☐ | Marketing URL | *https://www.tellurideblues.com* |
| ☐ | Copyright line | *© 2026 SBG Productions* |
| ☑ | iPhone-only for v1 | Set `TARGETED_DEVICE_FAMILY = 1` (iPhone) in Xcode so iPad screenshots are not required; iPad users still install in compatibility mode. Revisit in v1.1. |
| ☐ | Release control | Choose **manual release** on both stores so go-live is a deliberate moment |

## 1. Accounts and enrollment

### Apple
- ☐ Apple Developer Program enrollment approved (status: pending as of Sep 9). Individual: ID verification; Organization: D-U-N-S, legal-entity verification, may take 1–2+ weeks. Call Apple Developer Support to ask about expediting if it stalls.
- ☐ Sign in to App Store Connect; accept the latest Program License Agreement (Account Holder only). No banking/tax forms needed for a free app without IAP.
- ☐ Add Sam (or SBG staff) as users with **App Manager** role if the account holder is someone else.
- ☐ Two-factor authentication on the Apple ID (required).

### Google
- ☐ Play Console developer account approved (pending as of Sep 9). Personal accounts require identity verification; organization accounts need D-U-N-S and a verified org email/website/phone.
- ☐ If personal: plan the **closed-testing** route for the 2026 festival (§7) and production access after.
- ☐ Play App Signing accepted (default; Google holds the app signing key, you keep an **upload key**).

### Firebase (needed for push before store builds)
- ☐ Firebase project created on **Blaze** plan, budget alert at $10.
- ☐ iOS app registered in Firebase with the bundle ID → download `GoogleService-Info.plist` (git-ignored; vault copy).
- ☐ Android app registered with the application ID + SHA-1/SHA-256 of the **upload** key and of the Play app-signing key (from Play Console → App integrity) → `google-services.json` (git-ignored; vault copy).
- ☐ APNs authentication key (.p8) created in the Apple developer portal (Certificates, Identifiers & Profiles → Keys → Apple Push Notifications service), uploaded to Firebase → Cloud Messaging → Apple app configuration, with Key ID and Team ID.
- ☐ Firebase Analytics **not** enabled / not initialized in code (keeps data-collection answers truthful).

## 2. Identifiers, capabilities, signing

### Apple
- ☐ Register the App ID (explicit bundle ID) in Certificates, Identifiers & Profiles with capabilities: **Push Notifications** (and nothing else for v1).
- ☐ Xcode: Signing & Capabilities → Team set, "Automatically manage signing" on; add **Push Notifications** and **Background Modes → Remote notifications**.
- ☐ Distribution certificate + App Store provisioning profile (Xcode creates them automatically when archiving).
- ☑ `Info.plist`: `CFBundleDisplayName`, `ITSAppUsesNonExemptEncryption = NO` (HTTPS-only is exempt), `UIRequiresFullScreen` not needed, supported orientations portrait only for iPhone.
- ☑ `PrivacyInfo.xcprivacy` in the app target listing required-reason APIs actually used (Capacitor/WebKit typically: `NSPrivacyAccessedAPICategoryUserDefaults` reason `CA92.1`; check the Capacitor 8 docs for the current list) and `NSPrivacyTracking = false`, no tracking domains.
- ☐ Third-party SDK privacy manifests present (Firebase SDKs ship theirs; verify the build has no missing-manifest warnings on upload).
- ☐ Build with the current Xcode (26.x) and iOS SDK — Apple rejects uploads built with old SDKs after each spring deadline. ⚠

### Google
- ☑ `applicationId` set in `android/app/build.gradle`; `versionCode` integer increments every upload; `versionName` "1.0.0".
- ☑ `targetSdkVersion` / `compileSdkVersion` = **36** (Android 16) — required for new apps since Aug 31 2026. ⚠ Confirm Capacitor 8 template defaults; bump if lower.
- ☐ Create the **upload keystore** (`keytool -genkeypair -v -keystore bb-upload.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000`) stored **outside the repo** and in the vault with its passwords. Losing it is recoverable via Play App Signing key reset, but avoid it.
- ☐ Build an **Android App Bundle (.aab)**, not an APK: Android Studio → Build → Generate Signed Bundle.
- ☑ Adaptive icon (foreground/background/monochrome), themed-icon check on Android 13+, notification small icon is white-on-transparent (see `ASSET-BRIEF.md §2`).
- ☐ Edge-to-edge and predictive-back behave on Android 15/16 (required behaviors when targeting 35+).
- ☐ Play Console → App content → declare the SCHEDULE_EXACT_ALARM use case (set reminders at a user-chosen time); the local-notifications plugin merges the permission unconditionally.

## 3. Assets

| ☐ | Asset | Spec |
|---|---|---|
| ☐ | iOS app icon | 1024×1024 PNG, no alpha, in `Assets.xcassets` (single-size icon is fine on Xcode 26) |
| ☐ | Android icons | adaptive fg/bg/mono 432×432; Play Store icon **512×512 PNG, 32-bit**, ≤ 1 MB |
| ☐ | iPhone screenshots | **6.9"** set required: 1320×2868 (or 1290×2796 / 1260×2736), portrait, 1–10 images, PNG/JPG, no alpha, no device-frame transparency. 6.5" set optional (Apple scales the 6.9" set). Suggested six: Now (live state), Lineup grid, Artist sheet, Plan with a resolved conflict, Alerts, Now (countdown/dark mode). |
| ☐ | iPad screenshots | not needed while iPhone-only |
| ☐ | Play phone screenshots | 2–8 images, 16:9 or 9:16, each side 320–3840 px (use 1080×2340), PNG/JPG ≤ 8 MB |
| ☐ | Play feature graphic | 1024×500 PNG/JPG, no transparency, required to be featured/promoted; poster crop + lockup, no extra text |
| ☐ | Play 7"/10" tablet screenshots | optional; skip for v1 |
| ☐ | App preview video | optional; skip for v1 |
| ☐ | Splash / launch | iOS launch storyboard uses `paper` + centered lockup; Android 12+ splash uses the adaptive icon |

Generate screenshots from the real app with `npm run screenshots` (Playwright at device sizes with `VITE_FESTIVAL_NOW` set to a live Saturday afternoon), then add captions in Michroma on a `paper` band. Screenshots must show the actual app; no mock UI. Full plan (exact sizes re-verified against Apple's current spec, frame treatment, and the six captions) is in `docs/store/screenshots.md`; generating the final captioned/sized assets from the existing `docs/screens/design-pass/*.png` states is a follow-up script, not yet written.

## 4. Metadata and listing copy

Drafts are written: listing copy in `docs/store/listing.md`, App Privacy / Data safety answers in `docs/store/privacy-answers.md`, App Review / Play review notes in `docs/store/review-notes.md`. Nothing below is ticked yet — these are drafts to paste into the consoles, not confirmation the consoles have been filled in.

### App Store Connect → App Information / Version
- ☐ Name (≤ 30) · ☐ Subtitle (≤ 30, e.g. "Official 2026 festival guide") · ☐ Primary category **Music**, secondary **Entertainment** ⚠ `docs/store/listing.md` drafted this the other way round (primary Entertainment, secondary Music) per its task instructions — pick one order and reconcile both docs before submitting, don't leave them contradicting each other.
- ☐ Primary language English (U.S.) · ☐ Bundle ID selected · ☐ SKU (e.g. `bb-2026`) · ☐ Content rights: "Yes, contains third-party content; I have the rights" (SBG artwork, artist names)
- ☐ Promotional text (≤ 170, editable without a new build) · ☐ Description (≤ 4000) · ☐ Keywords (≤ 100 chars) · ☐ Support URL · ☐ Marketing URL · ☐ Copyright — all drafted, ready to paste, in `docs/store/listing.md`
- ☐ Version 1.0.0; What's New — drafted in `docs/store/listing.md`
- ☐ **Age rating questionnaire** ⚠ Apple's tiers are now 4+, 9+, 13+, 16+, 18+. Answer "Alcohol, Tobacco, or Drug Use or References: Infrequent/Mild" truthfully (breweries, tastings, beer imagery) plus the newer mandatory questions (no in-app controls, no medical content, no violence, no user-generated content, no messaging, no unrestricted web access — the app opens official links in the system browser only). Accept whatever tier the questionnaire computes (expect 9+ or 13+); do not answer "None" to get 4+. Full per-question grid in `docs/store/listing.md`.
- ☐ App Privacy (nutrition label): with no analytics, no accounts, and no push in v1 (D-021), the expected answer is **Data Not Collected**. Before answering, read Apple's current definitions for "Device ID" and confirm the final binary matches (no Firebase Analytics, no Crashlytics, no IDFA). Full per-category answers and reasoning drafted in `docs/store/privacy-answers.md` — re-verify against Apple's current definitions before submitting.
- ☐ App Review Information: contact first/last name, phone, email; **no sign-in required** (leave demo credentials blank, tick "Sign-in not required"); **Notes** — paste the review notes from `docs/store/review-notes.md` (offline data, on-device planning, native notifications, organizer-published content; mention the SBG authorization letter if the account is Sam's; give a suggested test path: favorite three artists → Plan → Remind me → airplane mode relaunch → Alerts).
- ☐ Attachment: SBG authorization letter PDF (if applicable).
- ☐ Export compliance: answered by the Info.plist key; confirm "No" to non-exempt encryption in the wizard if asked.
- ☐ Advertising identifier: **No**.
- ☐ Release: **Manually release this version**. Phased release off (tiny audience).
- ☐ Pricing: Free, all territories (or U.S. + Canada only if SBG prefers).

### Play Console → Dashboard "Set up your app" tasks
- ☐ App name · ☐ Default language en-US · ☐ App or game: App · ☐ Free
- ☐ Store listing: short description (≤ 80), full description (≤ 4000) — drafted in `docs/store/listing.md` · icon 512, feature graphic, phone screenshots — see `docs/store/screenshots.md` · category **Music & Audio** (or **Events**, recommended in `docs/store/listing.md` with reasoning — not yet decided) · contact email (required), website, privacy policy URL
- ☐ **App access**: "All functionality is available without special access" (no login) — review text drafted in `docs/store/review-notes.md`
- ☐ **Ads**: No ads
- ☐ **Content rating** (IARC questionnaire): answer alcohol references truthfully → expect Teen / PEGI 12–16 range; complete honestly — full answer grid in `docs/store/listing.md`
- ☐ **Target audience & content**: 18+ or 13+ audience (do **not** select under-13 — avoids Families policy); "not designed for children"
- ☐ **News app**: No · ☐ **COVID-19**: No · ☐ **Data safety**: no data collected, no data shared (no push in v1, D-021); encryption in transit: yes; deletion request: N/A (no accounts) — full per-question answers, the `SCHEDULE_EXACT_ALARM` use-case declaration text, and the sensitive-permissions list are drafted in `docs/store/privacy-answers.md`
- ☐ **Government app**: No · ☐ **Financial features**: None · ☐ **Health apps**: None
- ☐ Advertising ID declaration: **No** — app does not use it; make sure the manifest has no `AD_ID` permission — Firebase Messaging alone doesn't add it, but verify the merged manifest (`docs/store/privacy-answers.md`)
- ☐ Countries/regions: U.S. (+ Canada) or worldwide

## 5. In-app legal and content-rights items
- ☐ Privacy policy draft written: `docs/store/privacy-policy.md` (plain language, under 600 words, placeholders for SBG's address, support email, and effective date). **Hosting location not yet decided** — two options, pick one:
  - **The fan app's own `/privacy` route** (React Router, served by the existing GitHub Pages deploy) — recommended: no dependency on tellurideblues.com's CMS/access, ships with the same deploy pipeline that already builds the app, and keeps the policy versioned in this repo alongside the code it describes.
  - **tellurideblues.com/privacy** (SBG's own site) — alternative if SBG wants the policy under their primary domain regardless of app changes, or if they want one privacy policy covering the whole festival brand (site + app) rather than an app-specific one.
  This is a recommendation, not a decision — tick this row once Sam/SBG confirms, then update the URL placeholders in `docs/store/listing.md`, `docs/store/privacy-answers.md`, and `docs/store/review-notes.md`.
- ☐ Privacy policy page live (plain language: no data collected; notifications optional; contact email). Linked from Info screen and both listings.
- ☐ Font licenses (OFL) shipped in `docs/FONT_LICENSES.md` and listed under Info → Licenses.
- ☐ Artwork/trademark: SBG's permission on file; official lockups unmodified; no artist photos.
- ☐ No "Sign in with Apple" needed (no third-party login) and no account-deletion flow needed (no accounts) — keep it that way or both become mandatory.
- ☐ Notification permission requested only after a user action, with an in-app explanation first (Apple guideline 5.1.1 and Android 13+ `POST_NOTIFICATIONS` runtime permission).
- ☐ External links open in the system browser / SFSafariViewController; no in-app web browsing of arbitrary sites.

## 6. Pre-submission QA gate (do not submit until all ✓)
- ☐ Real-device test on iPhone and Android: cold launch in airplane mode, favorites → plan, reminders fire, push received (Android; iOS once APNs key exists), push tap opens Alerts, text size 200%, dark mode, VoiceOver/TalkBack pass on Lineup + Plan.
- ☐ No crash on rotation (portrait-locked) or on notification permission denial.
- ☐ Version/build numbers set (iOS `CFBundleShortVersionString` 1.0.0 / `CFBundleVersion` 1; Android `versionName` 1.0.0 / `versionCode` 1) and CI tags the commit.
- ☐ Archive validates in Xcode Organizer with no privacy-manifest or SDK warnings; AAB passes Play's pre-launch report without blocking issues.
- ☐ Screenshots match the submitted build.
- ☐ `HANDOFF.md` status board updated with build numbers and submission timestamps.

## 7. Testing tracks

### TestFlight (Apple)
- ☐ Upload the archive from Xcode Organizer (or `xcodebuild -exportArchive` + Transporter).
- ☐ Test Information: beta app description, feedback email, privacy policy URL.
- ☐ **Internal testing** group (App Store Connect users, up to 100, no Beta App Review) — add SBG staff by inviting them as users with the Customer Support or Marketing role. Builds available within minutes of processing.
- ☐ Avoid **external** TestFlight groups for 2026 unless time allows: they require a Beta App Review (usually < 24 h but it is another review).

### Google Play
- ☐ Create an **Internal testing** release first (up to 100 testers by email list, available in minutes) for SBG staff and Sam.
- ☐ Then a **Closed testing** track ("Festival 2026") with an opt-in link; if the account is personal this is the track that must hold ≥ 12 opted-in testers for 14 continuous days before production access can be requested (then a 3–7 business-day review of the questionnaire). Recruit SBG staff, volunteers, friends — ask them to actually open the app during the window.
- ☐ Production release after production access is granted (organization accounts can go straight to production after review).

## 8. Submission day (target Mon Sep 14)
1. ☐ Freeze content in the admin console except via SBG; bump version numbers; tag `v1.0.0`.
2. ☐ iOS: archive → validate → upload → attach build to the 1.0 version → confirm all sections show green → **Submit for Review** (morning, Central time). Typical first review 24–48 h; respond to any message within the hour via App Store Connect → App Review → Reply.
3. ☐ Android: upload the AAB to Internal testing → promote to Closed testing → complete every "Set up your app" task → **Send for review** (new apps are reviewed; usually 1–3 days, can be up to 7).
4. ☐ Record submission timestamps and build numbers in `HANDOFF.md`.
5. ☐ On approval: release manually, then verify the store pages, deep links, and that the live build fetches `content/published`.

## 9. Common rejection reasons and our pre-empts
| Reason | Pre-empt |
|---|---|
| 4.2 Minimum functionality / "web wrapper" | Offline data, on-device plan + notifications, native tab bar/sheets/haptics, organizer-published content; explain in notes |
| 5.2.1 Intellectual property (publishing on behalf of a third party) | SBG account, or SBG authorization letter attached |
| 2.1 Crash / incomplete | Real-device QA gate (§6), no placeholders, all links live |
| 5.1.1 Data collection & permissions | Notification permission only after tap with explanation; privacy answers match binary |
| Metadata mismatch | Screenshots from the real build; description doesn't promise Brews/Map (v1.1) |
| Play Data safety mismatch | Verify merged manifest permissions; no AD_ID; Firebase Analytics absent |
| Play target API too low | targetSdk 36 |

## 10. After launch
- ☐ Store listings link from tellurideblues.com and social; QR code assets point to a single smart link (web app URL that offers store buttons on mobile).
- ☐ Post-festival: v1.1 with Brews + Map; transfer app ownership to SBG if not already; rotate the upload key access; archive review correspondence in `docs/store/`.
