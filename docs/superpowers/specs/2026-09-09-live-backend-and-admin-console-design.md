# Live backend + admin console (spec)

**Date:** 2026-09-09 · **Owner:** Sam Gumble · **Status:** approved in conversation ("keep going"), written up for the record
**Scope:** the fan app reads live content and alerts from Firestore; SBG gets a password-protected admin console on GitHub Pages (separate repo `festival-admin`) to edit the lineup, publish, roll back, and send alerts. Free tier only — no Cloud Functions, no push, no card.

Companion docs: `docs/PLAN.md` §3–§6 (architecture the plan already chose), `docs/DECISIONS.md` (D-004 Firebase, D-007 published doc, D-008 alerts, D-018 two repos, and the new D-020/D-021 below), the design-pass spec for the fan app's repository seams.

---

## 1. Goal

Sam logs into the portal on his phone, moves a set time, and the Pages app shows it within seconds; he sends an alert and it appears in the fan app's inbox — with nothing costing money and nothing invented.

## 2. Decisions made in this session

| # | Decision |
|---|---|
| S-1 | Firebase project `bb-festival-2026` on the **Spark** plan under sam.gumble@gmail.com. No Blaze, so no Cloud Functions → **no push notifications in this phase**; the in-app Alerts inbox (live Firestore) is the channel (per D-008 it always was the primary one). Logged as **D-021**. |
| S-2 | Publishing is done **in the browser** by the admin console (Zod validation, version bump, archive to history) guarded by Firestore rules, instead of the `publishContent` callable in PLAN §3.3. Same on-disk result; the callable returns if/when Blaze is enabled. |
| S-3 | Admin console hosted on **GitHub Pages** from `samgumble/festival-admin` (not Firebase Hosting). Firebase Auth authorized domain `samgumble.github.io` is already added. |
| S-4 | `@bb/shared` reaches the admin repo by **git subtree** (`packages/shared` → `festival-admin/shared`), synced with one command. No registry, no tokens. Logged as **D-020**. |
| S-5 | Admin accounts: `sam.gumble@gmail.com` now; more via the Firebase console + an `admins/{uid}` doc. No self-signup. |
| S-6 | Firestore `(default)` in `nam5`, production rules; the Firebase web config lives in `packages/shared/src/firebase.config.ts` (public by design). |

## 3. Out of scope

Push (FCM/APNs), Cloud Functions, App Check, PWA/service worker, Capacitor, MFA, audit-log UI beyond what publish/history give for free, custom domain.

## 4. Firestore data model

```
content/published              Content (schema in @bb/shared)          world-readable · admin write
content/draft                  Content (may be invalid mid-edit)       admin read/write
history/{version}      Content + { archivedAt }                world-readable · admin write
alerts/{id}                    Alert                                   world-readable · admin write/delete
admins/{uid}                   { email, createdAt }                    read: that uid only · write: console/Admin SDK only
```

- `Content.meta.contentVersion` is `YYYY.MM.DD.n` in Denver; `n` increments within a day. `publishedBy` is the admin's email; `publishedAt` ISO with offset.
- `history` documents are the exact previous `published` doc plus `archivedAt`. Rollback = write a history doc back to `published` with a new version (the rolled-back one is itself archived), so history is append-only.
- Alerts are never edited after send (SBG "corrects" by sending another); deletion is allowed for mistakes and removes the alert from every device on next sync.
- Seed: `packages/content/content-2026.json` becomes the first `content/published` (version `2026.09.09.1`) via a one-off script run with the CLI's credentials.

## 5. Rules (`firebase/firestore.rules`)

```
function isAdmin() { return request.auth != null && exists(/databases/$(database)/documents/admins/$(request.auth.uid)); }
content/published, history/**, alerts/**   → read: true;  write: isAdmin()
content/draft                                       → read, write: isAdmin()
admins/{uid}                                        → read: request.auth.uid == uid; write: false
everything else                                     → false
```
Plus shape guards on writes that rules can express cheaply: `alerts` docs must carry `title`, `body`, `severity ∈ {info,important,urgent}`, `publishedAt` strings; `content/*` must carry `meta.contentVersion`. Full validation is Zod in the admin app (and Zod again in the fan app on read). Rules are unit-tested with `@firebase/rules-unit-testing` against the emulator (needs Java 21 — Homebrew `openjdk@21`).

## 6. Fan app changes (`festival-app`)

- `apps/festival/src/data/firebase.ts` — lazy `initializeApp(FIREBASE_CONFIG)` + Firestore with `persistentLocalCache`. Never initializes Analytics.
- `FirestoreContentSource` implements `ContentRepository`: `onSnapshot(doc("content/published"))`; a snapshot that fails `Content.safeParse` is ignored (logged in dev) and the last good content stays; initial value = bundled snapshot until the first valid snapshot. Exposes `status: { source: "bundled" | "live" | "cache", updatedAt?: string, contentVersion }` for Info.
- `FirestoreAlertsSource` implements `AlertsRepository`: `onSnapshot(query(alerts, orderBy publishedAt desc, limit 50))`, each doc validated with `Alert.safeParse` (invalid docs dropped). The fixture stays as the Vitest/screenshot source; production wiring picks Firestore. Switch: `VITE_DATA_SOURCE=bundled|firestore` (default `firestore` in production builds, `bundled` in tests).
- Info footer shows `Content v… · live · updated 4:12 PM` / `cache` / `bundled`.
- Offline: Firestore persistence handles reloads; the bundled snapshot handles first-ever launch with no network. The urgent-banner/latest-alerts logic is unchanged.
- Tests: source adapters tested with the Firestore emulator when `FIRESTORE_EMULATOR_HOST` is set, otherwise skipped; the Zod-reject path tested with a stub.

## 7. Admin console (`festival-admin`)

**Stack:** Vite 8 + React 19 + TS strict + Tailwind v4 + react-router 7 + zustand + zod + firebase (auth, firestore) — the same pins as the fan app. `shared/` is the git-subtree copy of `packages/shared` (schema, tokens, Firebase config). Deployed by a Pages workflow identical in shape to the fan app's (`BASE_PATH=/festival-admin/`, 404 fallback). Desktop-first at 1280 but usable at 390 (SBG sends alerts from the field).

**Design:** the festival tokens (`tokens.css` copied from the fan app via the subtree's `tokens.ts` values), paper-light surfaces, sky structure, **sun only for "Publish" and "Send alert"**. Michroma eyebrows, DM Sans body; Bungee for the wordmark only. No poster art.

**Auth:** email/password sign-in; `browserSessionPersistence` (closing the tab signs out); 60-minute idle sign-out; a signed-in user without an `admins/{uid}` doc sees "This account isn't an admin" and a sign-out button. Errors never reveal whether an email exists.

**Screens (routes):**
- `/signin`
- `/` Dashboard — published version + time, last alert, buttons **Edit lineup**, **Send alert**, **Publish** (badge when draft ≠ published).
- `/lineup` — Artists table (name, tier; inline edit; add/remove; drag-free reorder via up/down); Sets editor grouped by day: stage select, artist select, start/end pickers in 15-min steps (Denver), note; per-stage overlap warnings; Zod errors inline; autosaves to `content/draft` (debounced 800 ms) with "Saved 4:12 PM" / "Unsaved" indicator; "Discard draft" restores from published.
- `/alerts` — compose: title (≤ 60), body (≤ 240), severity, optional URL, expiry preset (none / 1 h / 3 h / end of day); live phone-style preview using the fan app's alert-card look; **Send** → confirm dialog → writes `alerts/{id}`; history list with delete (confirm).
- `/publish` — draft vs published summary (counts + a per-set diff list: added / removed / moved), Zod validation status, **Publish vN** (disabled while invalid or identical), rollback list from `history` with **Restore** (confirm).
- Header: project name, signed-in email, sign out, link to the live fan app.

**Publish algorithm (client):** `draft` → `Content.parse` → set `meta = { contentVersion: nextVersion(published.meta.contentVersion, nowDenver), publishedAt, publishedBy: user.email, sources }` → batch: write `history/{oldVersion}` ← old published + archivedAt, write `published` ← new. Firestore batches are atomic.

**Tests:** domain helpers (`nextVersion`, diff, overlap detection, alert expiry presets) unit-tested; rules tested in `festival-app` (single source of rules); sign-in/publish flows smoke-tested with the emulator where available.

## 8. Repo layout

```
festival-app/
  firebase/firestore.rules, firestore.indexes.json, firebase.json, .firebaserc   (rules deploy from here)
  firebase/rules.test.ts                                                      (emulator tests)
  packages/content/scripts/seed.ts                                            (one-off: publish content-2026.json)
  apps/festival/src/data/{firebase,firestore-content,firestore-alerts}.ts
festival-admin/
  shared/               ← git subtree of festival-app/packages/shared
  src/{app,auth,design,features/{dashboard,lineup,alerts,publish},data,domain}
  .github/workflows/pages.yml
```

## 9. Definition of done

1. `npm run rules:test` passes in `festival-app` (emulator); `npm run rules:deploy` has been run once against `bb-festival-2026`.
2. `content/published` seeded; the Pages fan app shows "live" in Info and reflects an edit within seconds of publish.
3. `https://samgumble.github.io/festival-admin/` signs in `sam.gumble@gmail.com`, edits a set time, publishes, rolls back; sends and deletes an alert; every write is rejected for a non-admin (verified by rules tests).
4. Fan app offline behavior unchanged (airplane-mode reload shows the last content); tests green in both repos; HANDOFF status board and DECISIONS (D-020, D-021) updated.
