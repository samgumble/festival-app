# Telluride Blues & Brews — Festival App Build Plan

**Version:** 1.0 · **Date:** September 9, 2026 · **Owner:** Sam Gumble (for SBG Productions)
**Status:** Approved direction, fresh build. Supersedes every earlier prototype (vanilla-JS/Capacitor `music-app`, Codex `expo-v2`).

Companion docs: `HANDOFF.md` (start here in any new session), `DECISIONS.md` (why), `ASSET-BRIEF.md` (artwork export + generation), `STORE-CHECKLIST.md` (every store-publishing step and field), `CLAUDE.md` (repo rules for coding agents).

---

## 1. Mission and hard constraints

Build the official companion app for the 32nd Telluride Blues & Brews Festival (September 18–20, 2026, Telluride Town Park, 8,750 ft) that feels like the poster came to life in your pocket — and give SBG a password-protected web console to change the lineup and push alerts without shipping an app update.

| Constraint | Value |
|---|---|
| Festival | Fri Sep 18 – Sun Sep 20, 2026 · gates 11:30 AM · time zone `America/Denver` |
| Today | Wed Sep 9, 2026 — **9 days** to gates |
| Goal for 2026 | Attempt App Store + Play submission by **Mon Sep 14**; installable web app (PWA) on GitHub Pages is the guaranteed fallback and ships regardless by **Sat Sep 12** |
| Long-term | Both stores live and stable well before the ~mid-January 2027 lineup announcement; SBG owns repo, Firebase project, and store listings |
| Store accounts | Apple Developer + Google Play both **pending approval** as of Sep 9 (see §11 risks) |
| Privacy posture | No accounts for fans, no analytics SDK, no ads, no location tracking. Favorites and plans stay on-device. |
| Assets | Licensed poster PSD (1.74 GB, never committed), poster logo lockup, sun dates lockup, SBG logo. Poster fonts (Beastly, Eurostile Extended, Futura PT) are Adobe-licensed and **cannot be bundled**; they live only inside rasterized artwork. |
| Content truth | Only official SBG sources (tellurideblues.com lineup/schedule/guide/FAQ) or content SBG enters in the admin console. Never invent bios, genres, set times, or images. |

## 2. Product definition

### 2.1 v1 (store submission) — must-haves

1. **Now (Home)** — time-aware front page. Before the festival: countdown, headliners, "build your plan" nudge. During: what's on each stage right now / up next, your next favorited set, live alert banner. After: thank-you + "see you in 2027."
2. **Lineup** — full official lineup by day and stage, two views (list + stage timeline grid), search, headliner tiers, artist detail with set times and one-tap favorite.
3. **My Plan** — favorites become a personal schedule with conflict detection and resolution, "what should I see next," set reminders (native local notifications; on web a calendar `.ics` fallback), and share-as-text.
4. **Alerts** — in-app inbox fed from Firestore (works for everyone, including people who decline push) + push notifications (FCM → APNs/Android; web push on Android Chrome and desktop; iOS web push only when installed to Home Screen). Severity levels: info / important / urgent.
5. **Offline-first** — bundled content snapshot at build time, Firestore persistent cache, service-worker precache of the app shell and artwork. Airplane-mode launch shows the full lineup, plan, and last-known alerts.
6. **Info** — festival essentials (dates, gates, venue, official links), notification settings, about/privacy, content version.
7. **Admin console** (separate web app, password-protected) — see §6.

### 2.2 v1.1 backlog (after the 2026 festival, before Jan 2027 lineup drop)

Brews module (25+ breweries, 4 tasting sessions, beer-pairing dinner, rare beers, "beers I tried" tracker), stylized Town Park map (stages, beer garden, gates, water, restrooms, first aid), full guide + FAQ, "My Festival Picks" shareable poster image, comedy stage & Music Maker Foundation groupings as first-class sections, artist listen-links/bios if SBG approves copy, sponsor placements, multi-year support (2027 content switch without an app update), gondola/parking/shuttle info, weather widget.

### 2.3 Non-goals

Ticketing, payments, wristband/RFID, fan accounts, social feed, chat, precise location, analytics dashboards, camera/AR.

## 3. Architecture

### 3.1 Stack

| Layer | Choice | Notes |
|---|---|---|
| Language | TypeScript (strict) | everywhere, including Cloud Functions |
| Festival app | **React 19 + Vite 8** PWA, wrapped by **Capacitor 8** for iOS/Android | one codebase, three targets; Xcode/Android Studio open the generated native projects |
| Admin app | React 19 + Vite 8, hosted on **Firebase Hosting** | separate bundle so admin code never ships in the store binary |
| Routing | React Router 7 | nested routes, `<Outlet>` for tab shells |
| State | Zustand (+ `persist` → Capacitor Preferences / localStorage) | favorites, plan settings, read alerts, onboarding flags |
| Data | Firebase **Firestore** (public read on published content + alerts; admin-only writes) with persistent offline cache | live schedule updates in-app, offline for free |
| Auth (admin only) | Firebase **Auth** email/password, no self-signup, allowlist collection `admins/{uid}` | 1–3 named SBG staff |
| Push | Firebase **Cloud Messaging** via `@capacitor-firebase/messaging` (native) and FCM web SDK (PWA) → topic `festival-2026` | one Cloud Function fans out an alert doc to the topic |
| Functions | Firebase Cloud Functions v2 (Node 22) | `onAlertCreated` → send push; `publishContent` → validate + version bump; rate limiting |
| Local notifications | `@capacitor/local-notifications` | set reminders 15 min before, scheduled on-device |
| Styling | Tailwind CSS v4 with design tokens in `@theme`; CSS custom properties; `motion` (Framer Motion) for gestures/springs | tokens shared with admin app |
| Validation | Zod schemas in `packages/shared` | same schema validates admin input, Function writes, and app reads |
| PWA | `vite-plugin-pwa` (Workbox) | precache shell + artwork; runtime cache Firestore is handled by SDK |
| Tests | Vitest (schedule/conflict/time logic, schemas, rules via Firebase emulator), Playwright (web smoke), manual device matrix | |
| CI | GitHub Actions: lint + typecheck + test on PR; deploy festival app to GitHub Pages on `main`; deploy admin + functions + rules to Firebase on `main` (manual approval) | |

### 3.2 Repository layout (new private repo)

```
bb-festival/                     # obscure repo name of Sam's choosing
  apps/
    festival/                    # the fan app (Vite + React + Capacitor)
      src/
        app/                     # router, providers, shell (tab bar, safe areas)
        features/
          now/  lineup/  plan/  alerts/  info/
        design/                  # tokens.css, primitives (Button, Card, Sheet, Chip, Heart), motion presets
        data/                    # firestore client, content repository, bundled snapshot loader
        domain/                  # pure logic: schedule, conflicts, festival clock, time (Denver)
        platform/                # capacitor adapters: notifications, haptics, share, preferences, push
      public/                    # icons, manifest, artwork (exported layers)
      ios/  android/             # generated by `npx cap add`, committed (minus build products)
      capacitor.config.ts
    admin/                       # SBG console (Vite + React)
      src/
        auth/  lineup/  alerts/  publish/  settings/
  packages/
    shared/                      # zod schemas, TS types, design tokens source, time utils, conflict engine
    content/                     # seed content (YAML/JSON) + scripts to seed Firestore and emit bundled snapshot
  functions/                     # Cloud Functions v2 (TypeScript)
  firebase/                      # firestore.rules, firestore.indexes.json, storage.rules, emulator config
  docs/                          # PLAN.md, HANDOFF.md, DECISIONS.md, ASSET-BRIEF.md, store/ (listing copy, screenshots)
  .github/workflows/             # ci.yml, pages.yml, firebase-deploy.yml
  CLAUDE.md  README.md  package.json (npm workspaces)
```

### 3.3 Data flow

```
SBG staff ──login──▶ Admin app ──edit──▶ Firestore content/draft
                               ──Publish──▶ callable fn publishContent
                                             ├─ zod validate, bump contentVersion, stamp publishedAt/publishedBy
                                             ├─ write content/published  (single doc, ≤ 1 MB)
                                             └─ archive to content/history/{version}
Fan app  ◀── onSnapshot(content/published) ── Firestore (persistent cache, IndexedDB / native SQLite)
         ◀── bundled snapshot (packages/content → apps/festival/src/data/bundled.json) on first launch / no cache
         ◀── onSnapshot(alerts, orderBy publishedAt desc, limit 50)

SBG staff ──"Send alert"──▶ Firestore alerts/{id}  ──trigger──▶ fn onAlertCreated
                                                                 ├─ rate limit (max 6/hour), validate
                                                                 └─ FCM send to topic festival-2026
Fan devices ◀── APNs / FCM / Web Push ── tap opens Alerts tab, deep-links to alert
```

Content precedence in the app: live Firestore doc (if valid) → Firestore cache → bundled snapshot. An invalid remote doc never replaces a valid cached one (schema-validated on read). The UI shows "Updated 4:12 PM · offline" style provenance in Info.

### 3.4 Content model (Zod in `packages/shared/src/schema.ts`)

```ts
Festival   { year: 2026, name, edition: "32nd Annual", venue, city, altitudeFt, timezone: "America/Denver",
             days: [{ id: "fri", date: "2026-09-18", label: "Friday", gatesOpen: "11:30" }, ...],
             links: { tickets, site, faq, map }, announcement?: { text, url?, active } }
Stage      { id, name, shortName, color: TokenName, sortOrder }
Artist     { id, name, tier: "headliner" | "featured" | "lineup" | "comedy" | "musicmaker",
             blurb?: string /* SBG-approved only */, links?: { site?, spotify?, apple? }, imageId?: string }
Set        { id, artistId, stageId, dayId, start: ISO8601 w/ offset, end: ISO8601, note?: string }
Content    { meta: { contentVersion: "2026.09.09.1", publishedAt, publishedBy, sources: string[] },
             festival, stages[], artists[], sets[] }            // published doc; v1.1 adds breweries[], sessions[], map
Alert      { id, title, body, severity: "info"|"important"|"urgent", url?, publishedAt, publishedBy,
             expiresAt?, push: boolean, pushSentAt?, pushMessageId? }
AdminUser  { uid, email, displayName, role: "admin", createdAt }   // allowlist; existence == access
AuditEntry { id, at, uid, action: "publish"|"alert"|"login"|..., summary, diffRef? }
```

Seed data: the 30 artists / 41 sets / stages / festival meta already verified from tellurideblues.com on Sep 8 (recoverable from the old repo's `data/content.json`) — re-verify against the official schedule page before seeding.

### 3.5 Offline strategy

- Build step writes the current published content into `bundled.json`; the app renders it instantly on cold start with no network.
- Firestore SDK persistence (`persistentLocalCache` with multi-tab manager on web; native SDK cache via the Capacitor Firebase plugins or the JS SDK inside the WebView — decision: **JS SDK inside the WebView for both**, simplest single code path).
- Workbox precaches: HTML/JS/CSS, fonts, all poster layer PNGs (budget ≤ 8 MB total, WebP where transparent alpha is preserved), icons. `navigateFallback` to `index.html`. Update flow: "A fresh festival guide is ready → Refresh" banner via `registerSW({ onNeedRefresh })`.
- Native builds bundle everything in the binary; the WebView loads from `capacitor://localhost`, so offline is inherent.
- Set reminders are scheduled locally when the user taps "Remind me"; schedule changes from SBG trigger reconciliation (cancel + reschedule affected reminders when the published set time changes).

### 3.6 Time handling

All schedule math uses `America/Denver` regardless of device zone (a visitor's phone may still be on Central time). `domain/time.ts` exposes `festivalNow()`, `toDenver()`, formatting helpers, and a dev override `VITE_FESTIVAL_NOW` (ignored in production builds) for demos: "pretend it's Saturday 3:40 PM."

## 4. Security model (admin console)

- Firebase Auth **email/password only**, self-signup disabled in the console, email enumeration protection on, password policy on. Accounts created by Sam/SBG in the Firebase console; `admins/{uid}` doc created alongside.
- Firestore rules: `content/published`, `content/history/*`, `alerts/*` are world-readable; **all writes** require `request.auth != null && exists(/databases/$(db)/documents/admins/$(request.auth.uid))`. `admins/*` readable only by the signed-in admin for their own doc; not writable from clients (console/Admin SDK only). `audit/*` append-only by admins.
- Alerts can only be created through the admin app; the Function enforces rate limits (6/hour, 30/day), body length, and strips HTML. Pushes go to a topic, so no fan device tokens are ever stored server-side except FCM's own registry.
- Publishing goes through a **callable Function** (validates schema, refuses if draft invalid, records audit) rather than direct client writes to `content/published`.
- Admin app served over HTTPS on Firebase Hosting with strict CSP, `X-Frame-Options: DENY`, session persistence `browserSession` (sign-in doesn't survive closing the tab), idle sign-out after 60 min, "Sign out everywhere" via Admin SDK token revocation script.
- Firebase **App Check** (reCAPTCHA Enterprise on web, DeviceCheck/App Attest on iOS, Play Integrity on Android) — enable in *monitor* mode for v1, enforce in v1.1 once metrics confirm no false positives.
- Secrets: none in the repo. Firebase web config is public by design; APNs key and service accounts live only in Firebase/Apple consoles; `google-services.json` / `GoogleService-Info.plist` are git-ignored and stored in a private shared vault (1Password) for SBG.
- Rules are unit-tested with `@firebase/rules-unit-testing` against the emulator (admin can publish; anonymous cannot write; anonymous can read published + alerts; anonymous cannot read draft/audit/admins).

## 5. Design system — "the poster comes alive"

### 5.1 Principles

1. **Poster-native, not poster-pasted.** Every screen inherits the poster's world — paper grain, checkerboard edges, rainbow arches, sun rays, mountains, columbines — as *structure and atmosphere*, never as a static wallpaper behind text.
2. **Altitude legibility.** Bright sun at 8,750 ft, cold hands, a beer in the other hand: big type, high contrast, one-thumb reach, 48 px targets, no hover-only affordances.
3. **Know what's happening now.** Time is the primary axis; the app always answers "what's on, where, and when's my next set" within one glance.
4. **Platform-fluent.** iOS gets HIG: bottom tab bar, large titles that collapse, sheets with grabbers, SF-style symbol weights, haptics, `safe-area-inset` everywhere. Android gets Material 3: navigation bar with active indicator pill, edge-to-edge with transparent system bars, predictive back, ripple, dynamic type scaling. One design language, two sets of manners.
5. **Motion with meaning.** Springs and parallax only where they explain hierarchy or acknowledge input. Everything honors `prefers-reduced-motion`.
6. **Never fabricate.** No invented artist art, no AI-drawn musicians, no made-up bios. Generated art is limited to *supporting* elements in the poster's illustration language (see `ASSET-BRIEF.md`).

### 5.2 Color — sampled from the poster (verify against PSD swatches, then lock)

| Token | Hex | Role |
|---|---|---|
| `paper` | `#EAD6BA` | default light surface (with 4–6% grain overlay) |
| `paper-light` | `#F4E8D2` | cards on paper |
| `paper-deep` | `#DCC6A3` | dividers, pressed states |
| `ink` | `#201C1D` | primary text on paper, checkerboard dark squares |
| `night` | `#173A65` | dark-mode base, poster's night mountains |
| `night-deep` | `#0E2440` | dark-mode surface 0 |
| `sky` | `#158EAA` | primary brand blue (lineup/schedule structures) |
| `sky-light` | `#7CC4D6` | tints, selected day tab |
| `sun` | `#E8C146` | primary accent: CTAs, favorites-on, "now" indicators |
| `sun-hot` | `#F5A623` | gradient partner for sun, urgent-but-friendly |
| `amber` | `#D1973D` | beer/brews context, secondary accent |
| `ember` | `#C8413F` | urgent alerts, destructive, conflict markers |
| `pine` | `#1B8D5F` | success, "no conflicts," offline-ready pill |
| `leaf` | `#54AF65` | success tints |
| `plum` | `#69155C` | My Plan / personal context |
| `violet` | `#7A3E8E` | butterflies, plan gradients |
| `bloom` | `#E0508F` | rainbow pink, celebratory moments |

Rules: 60% paper (or night in dark mode) / 30% sky-night-plum structure / 10% sun-ember accents. Sun never carries white text (use ink). WCAG 2.2 AA on every text/background pair at rendered size; AAA for body copy on paper. Dark mode is the poster at night: `night-deep` surfaces, `paper` text, sun and bloom accents glow slightly (no neon).

### 5.3 Typography (all OFL, bundled locally, no remote fonts)

| Tier | Face | Use |
|---|---|---|
| Display | **Bungee** (regular; **Bungee Shade** reserved for countdown numerals and day headers) | closest open-source cousin to the poster's chromatic 3D lettering |
| Wide label / eyebrow | **Michroma** | Eurostile-Extended-like caps for stage names, badges, "NOW PLAYING" |
| UI / body | **DM Sans** (variable) | legible at small sizes, friendly geometric like Futura |
| Numerals (times) | DM Sans tabular (`font-variant-numeric: tabular-nums`) | schedule alignment |

Scale (mobile): display 40/44, title-1 32/36, title-2 24/28, headline 20/24, body 17/24, callout 15/20, caption 13/16, micro 11/14. Respects OS text scaling up to 200% without clipping (test iOS Larger Text + Android font size XL).

The official lockups (`2026-poster-logo-png.png`, `2026-Dates-Center.png`, `SBG-logo-png.png`) are used as images, unmodified, never re-typeset.

### 5.4 Shape, surface, elevation

- Radii: chips 999, controls 12, cards 20, sheets 28 (top corners), hero 32.
- Surfaces are paper with a subtle grain (`mix-blend: multiply` PNG noise at 5% opacity, precached, 256 px tile). Cards get a 1 px `ink/12` hairline and a warm shadow `0 8px 24px rgba(32,28,29,.10)`; elevated sheets `0 -12px 40px rgba(23,58,101,.18)`.
- Signature ornaments (used sparingly): checkerboard ribbon (2 rows) as section dividers and the tab-bar top edge; rainbow arch as the frame for the Now hero and empty states; sun rays as a rotating backdrop behind the countdown and favorites celebration; columbine flower as the favorite ("bloom") icon state.

### 5.5 Motion

- Springs: `stiffness 380, damping 32` for taps; `stiffness 220, damping 26` for sheets.
- Durations for non-spring transitions: 160 ms control, 240 ms surface, 320 ms route. Transform/opacity only.
- **Hero parallax** (Now screen): 5 layers (sky+rays, far mountains, near mountains+gondola, guitar-waterfall+mug, foreground trees+flowers+butterflies), each translating at 0.15–0.6× scroll with a 24 px cap; butterflies drift on a 9 s sine loop; rays rotate 360° every 120 s. Optional device-tilt parallax on native (`DeviceMotion`, ±6 px). All static under reduced motion or Save-Data.
- Favorite tap: heart → columbine bloom (scale 0.8→1.15→1, 220 ms) + light haptic; count badge on the Plan tab pulses once.
- "Now" indicator: a thin sun line sweeps across the stage timeline every minute tick, no continuous animation.
- Sheet open/close: iOS-style spring; Android uses M3 emphasized easing. Predictive back on Android collapses the sheet.
- Skeletons, not spinners, for content loading (but content is bundled, so cold start should never show a skeleton).

### 5.6 Navigation and screens

Tab bar (5): **Now · Lineup · Plan · Alerts · Info**. Badge counts: Plan (favorites), Alerts (unread).

**Now** — Hero (poster layers + official logo lockup, edition "32nd Annual" badge) → state block: *pre-festival* countdown (Bungee Shade days:hours) + "Gates 11:30 AM · Fri Sep 18"; *live* "On stage now" row per stage (artist, time remaining bar) + "Your next set" card + urgent alert banner; *post* thank-you + share. Below: headliner trio cards, "Build your plan" CTA (if no favorites), latest 2 alerts, quick links (tickets, map link, FAQ).

**Lineup** — Segmented day control (Fri/Sat/Sun) + view toggle (List / Grid). List: grouped by stage, chronological, each row = time, artist, stage chip, heart. Grid: horizontal-scroll stage timeline (hours across, stages down, now-line), pinch-free but with a "Now" jump. Search field filters by artist. Headliners have a sun-rimmed card treatment. Tap → Artist sheet (name, tier, all sets, heart, "Remind me," official links if any).

**Plan** — If empty: rainbow-arch empty state ("Your weekend starts here") with three headliner quick-adds. Otherwise: per-day vertical timeline of favorited sets; overlaps rendered as a braided pair with a "Conflict — you chose {A}" chip and a swap action; "Next up" card pinned to top during the festival; reminder toggle per set; "Export to calendar" + "Share plan as text." Settings sheet: reminder lead time (5/15/30 min), buffer between stages.

**Alerts** — Reverse-chronological cards, unread dot, severity color bar (sky/sun/ember), expandable body, optional link button. Top card if push not enabled: "Get festival alerts on your lock screen → Enable" (permission prompt only on tap; iOS shows a pre-prompt explaining why). Pull to refresh. Empty state: "All quiet in Town Park."

**Info** — Festival card (dates, gates, venue, altitude), official links (site, tickets, FAQ, Apple/Google Maps link to Telluride Town Park), notification settings, "Content version 2026.09.12.3 · updated Sep 12, 4:12 PM · Offline-ready ✓," privacy policy, licenses (fonts), SBG Productions credit, app version.

**Platform specifics**: iOS large-title collapse on Lineup/Alerts; sheet detents (medium/large) for Artist; haptics via `@capacitor/haptics`. Android: M3 nav bar height 80 dp with indicator pill, `StatusBar` transparent + `EdgeToEdge`, back gesture closes sheets first, splash via `androidx.core.splashscreen` theme with the sun icon.

### 5.7 Accessibility

WCAG 2.2 AA; VoiceOver/TalkBack labels for hearts ("Favorite Samantha Fish, Saturday 4:30 PM, Main Stage"), `aria-pressed` states, live regions for "Added to your plan," focus management on route change, 48×48 targets, text scaling to 200%, color never the only signal (conflicts also get an icon + text), reduced-motion parity, high-contrast check for sun on paper (use ink text).

### 5.8 Admin console design

Same tokens, calmer: paper-light surfaces, sky primary, sun for "Publish" and "Send alert" only. Desktop-first (1280) but usable on a phone at the festival (SBG will send alerts from the field). Screens: Sign in → Dashboard (published version, last alert, "Send alert" and "Edit lineup" tiles, publish status) → Lineup editor (artists table with inline edit; sets editor with day/stage/time pickers in Denver time; validation and overlap warnings; drag to reorder tiers) → Alerts (compose with severity, live phone preview, "Send push" toggle, confirm dialog with recipient count estimate; history) → Publish (draft vs published diff, "Publish v2026.09.12.4," rollback list) → Settings (festival info, announcement banner, admins list read-only). Every action toasts and writes an audit entry.

## 6. Admin console — functional spec (v1)

| Feature | Behavior |
|---|---|
| Sign in | Email + password; error copy never reveals whether an email exists; "Forgot password" → Firebase reset email |
| Lineup editor | Edit artist name/tier/links/blurb; add/remove/move sets; stage + day + start/end pickers (15-min steps, Denver); zod validation inline; overlap warnings per stage; unsaved-changes guard |
| Draft / Publish | Edits save to `content/draft` continuously (autosave, debounced); **Publish** runs the callable: validates, bumps version, writes `published`, archives previous to `history`, audit entry. Rollback = republish a history entry. |
| Alerts | Title (≤ 60), body (≤ 240), severity, optional URL, expiry; "Send push" checkbox default on for important/urgent; preview as lock-screen notification; confirm step; history with delivery status |
| Announcement banner | Short text + link shown on Now; toggle |
| Audit | List of who did what when |

## 7. Delivery plan — day by day

Realistic assumption: Sam + Claude Code build; Fable/Cowork reviews design and docs; SBG reviews on Sat/Sun.

| Day | Date | Build | Exit criteria |
|---|---|---|---|
| 0 | Wed Sep 9 | Approve this plan. Create private repo, Firebase project (`bb-festival-2026`, Blaze plan for Functions), scaffold monorepo, tokens + fonts, seed content package from verified data, CI skeleton. Sam starts PSD layer export (ASSET-BRIEF). Check Xcode iOS runtime installed; install ARM64 Android Studio. | `npm run dev` shows tab shell with tokens; Firestore has `content/published`; rules deployed; GitHub Pages deploy green |
| 1 | Thu Sep 10 | Design system primitives; **Now** (states + hero with placeholder layers), **Lineup** (list + grid + search + artist sheet), favorites store. Domain: time.ts, schedule.ts with tests. | Lineup fully browsable offline on web; favorites persist; 390×844 screenshots reviewed by Fable |
| 2 | Fri Sep 11 | **Plan** (conflict engine, next-up, reminders, ics export), **Alerts** inbox (Firestore live), **Info**. PWA precache + update banner. Swap in real poster layers as they land. | Airplane-mode reload works; conflicts resolved correctly on fixture data; Lighthouse PWA pass |
| 3 | Sat Sep 12 | **Admin console**: auth, lineup editor, alerts compose, publish flow; Functions `publishContent`, `onAlertCreated`; rules tests. Deploy admin to Firebase Hosting. **Web beta live** on GitHub Pages → send link/QR to SBG for feedback + create SBG admin accounts. | SBG can log in, change a set time, publish, see it appear live in the web app; send a test alert |
| 4 | Sun Sep 13 | **Native**: `cap add ios/android`, icons/splash (adaptive + iOS 1024), push (APNs key needs Apple account — see risks), local notifications, haptics, edge-to-edge, status bar, deep link from push → Alerts. Device testing on Sam's iPhone + an Android. Polish pass on motion. | App runs on both devices from Xcode/Android Studio; push received on Android; iOS push received if account cleared |
| 5 | Mon Sep 14 | Store readiness: screenshots (6.9", 6.5", iPad optional; Android phone), listing copy, privacy answers, review notes, age rating, export-compliance flag, privacy policy page. **TestFlight** internal build; **Play closed testing** track. **Submit iOS for review** (Mon so it clears mid-week). | Builds uploaded; iOS "Waiting for Review" |
| 6 | Tue Sep 15 | Fix findings from SBG/TestFlight; Android closed track shared with SBG staff + friends (this also starts the 12-tester clock if the account is personal); content re-verified against official schedule. | Any Apple rejection answered same day |
| 7–8 | Wed–Thu Sep 16–17 | Buffer. Content freeze Thursday noon except via admin. SBG training (15-min screen share: publish, send alert, rollback). Print QR posters/social assets pointing to the web app + store links. | Go-live checklist signed off |
| — | Fri Sep 18 | Festival. Sam on call for the admin console; monitor Functions logs + Crashlytics-free error boundary logs (no analytics — just Function logs). | |
| +1 wk | Sep 21–25 | Retro, v1.1 planning, transfer ownership plan (GitHub org, Firebase project, App Store Connect / Play transfer to SBG). | |

## 8. Store submission plan

**Identity**: name "Telluride Blues & Brews" (subtitle "Official 2026 Festival Guide"), bundle/app ID `com.sbgproductions.bluesandbrews` (confirm), category Music (secondary Entertainment), price free, no IAP. **Age rating:** answer "Alcohol, Tobacco, or Drug Use or References: Infrequent/Mild" truthfully — Apple's tiers are now 4+/9+/13+/16+/18+, so expect 9+ or 13+ (not 4+); Play's IARC questionnaire will land around Teen / PEGI 12–16. **iPhone-only** for v1 (`TARGETED_DEVICE_FAMILY = 1`) so iPad screenshots aren't required. **Ownership:** create the app records under SBG's developer accounts if at all possible; if the accounts are Sam's, obtain a signed SBG authorization letter (Apple guideline 5.2.1) before submitting.

The complete field-by-field list for both consoles is `docs/STORE-CHECKLIST.md`; treat this section as the summary.

**Apple**: App Store Connect record, APNs auth key (.p8) → Firebase; Push Notifications + Background Modes (remote-notification) capabilities; `PrivacyInfo.xcprivacy` listing UserDefaults reason (CA92.1) and file-timestamp reason if Capacitor needs it; `ITSAppUsesNonExemptEncryption = NO`; privacy nutrition label: expected **Data Not Collected** (push tokens used solely for delivery and not linked to identity — verify wording against Apple's current guidance before answering); review notes emphasize offline data, on-device planning, native notifications, and that content changes come from the official organizer — mitigates guideline 4.2 "minimum functionality." One TestFlight pass before submission. Submit Monday.

**Google**: Play Console app, `google-services.json`, adaptive icon, Data safety form (no data collected/shared; push token handled by FCM), **target API 36** (required for new apps since Aug 31, 2026), AAB with Play App Signing, closed testing track first. **If the Play developer account is a personal account created after Nov 13, 2023, Google requires 12 opted-in testers for 14 continuous days plus a 3–7 business-day production-access review before any public release** — that cannot complete by Sep 18. Organization accounts (D-U-N-S) are exempt. Either way, the closed-testing link is a perfectly usable distribution for SBG staff and early fans during the festival, and the festival itself satisfies the tester requirement for a production release afterward.

**Both**: privacy policy URL (host on Firebase Hosting or GitHub Pages: `/privacy`), support email, marketing URL (tellurideblues.com), screenshots generated from the real app at device sizes via Playwright + device frames.

## 9. Testing plan

- Unit: time conversion (Denver vs device zone), festival-state machine (pre/live/post, overnight), conflict engine (overlaps, buffers, priority), schema validation (rejects bad remote content), reminder reconciliation on schedule change.
- Rules: emulator tests for read/write matrix.
- Web smoke (Playwright): cold start offline, favorite → plan, alert appears within 5 s of admin send (emulator), update banner.
- Device matrix: iPhone (latest iOS, one older), Android (Pixel-class + one budget device), tablet sanity, iPad compatibility mode or proper layout.
- Manual checklist: airplane mode first launch after install, denied notification permission path, text size 200%, dark mode, VoiceOver/TalkBack pass on Lineup + Plan, push tap deep link, kill-and-relaunch state, timezone set to Chicago while "in Telluride."
- Performance budgets: JS ≤ 350 KB gz, artwork ≤ 8 MB precached, LCP ≤ 2.0 s on 4G, 60 fps parallax on iPhone 12 / Pixel 6.

## 10. Ownership hand-off (post-festival)

GitHub: move repo to an SBG org (or transfer). Firebase: add SBG as Owner, Sam as Editor, billing on SBG's card (Blaze; expected cost ≈ $0–2/month). Apple/Google: apps transfer or were created under SBG's accounts from the start (preferred). Document admin runbook in `docs/RUNBOOK.md` (v1.1).

## 11. Risks and mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Apple Developer account not approved by ~Sep 12 | Medium-high | Web app is the 2026 product; TestFlight/App Store follows when approved. Build everything store-ready anyway. Keep chasing Apple (phone support can expedite). |
| Play personal-account 12-tester/14-day rule | High if personal | Use closed-testing link for 2026; production after festival. Check account type today. |
| Apple 5.2.1 rejection for publishing SBG's brand from a personal account | Medium | Use SBG's accounts, or attach a signed SBG authorization letter to the review notes (STORE-CHECKLIST §0). |
| Apple 4.2 "minimum functionality" rejection | Low-medium | Offline data, on-device plan, native notifications, official-organizer content; strong review notes; no "web wrapper" feel (native tab bar behaviors, haptics, sheets). |
| Poster layer export takes longer than expected | Medium | Hero ships with flattened-poster crops + generated supporting elements; layers swap in without code changes (file names fixed in ASSET-BRIEF). |
| Schedule changes during festival | Certain | Admin publish flow + live Firestore; reminders reconcile automatically. |
| Push not arriving on iOS | Medium | Alerts inbox is the primary channel; push is enhancement. Test with a real device early (Day 4). |
| Blaze plan required for Functions | Certain | Enable with budget alert at $10; costs are negligible at this scale. |
| Scope creep from a beautiful poster | High | v1.1 backlog is the parking lot; Fable reviews scope before Claude Code builds. |

## 12. Open questions for Sam / SBG

1. Play account type: personal or organization (D-U-N-S)? Under whose name are the Apple and Google accounts — Sam or SBG Productions?
2. Final app display name, bundle ID, support email, privacy contact.
3. SBG staff emails for admin accounts (1–3).
4. Confirm the Sep 8 schedule data is still current; any comedy/Music Maker Foundation set times to include?
5. Is a custom domain wanted for the web app (e.g., `app.tellurideblues.com`) or is a GitHub Pages / Firebase Hosting URL fine for 2026?
6. May we use artist names + official links only (no photos) in v1? Any SBG-approved artist blurbs?
7. Alert voice and cadence: who at SBG writes them, and is there a max per day they'd like enforced?
