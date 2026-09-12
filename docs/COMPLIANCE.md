# COMPLIANCE — privacy, security, consumer-protection and accessibility audit

Audited 2026-09-12 against two checklists Sam supplied (privacy/consumer items 1–10 and the marketing/security/accessibility items 1–10). Evidence is from the code, the built bundle, live probes of the Firebase project, and an axe-core scan. Re-run the checks in §3 before each store submission.

## 1. What this app actually does with data (the basis for everything below)

- **No accounts, no sign-up, no forms.** Fans never enter anything about themselves.
- **On-device only:** favorites, plan choices, settings, read-alert ids — WebView/browser localStorage (`bb-plan`, `bb-ui`, `bb-alerts`). No server copy.
- **Network:** read-only Firestore (`content/published`, `alerts`, `history`) on `bb-festival-2026`; GitHub Pages for the web build; outbound links to tellurideblues.com and Apple/Google Maps. The built bundle references no other hosts (verified by grepping `dist/assets/*.js`).
- **No analytics, ads, pixels, error trackers, AI providers, SMS, or email** — none in dependencies or code (`grep` of both repos' `package.json` and `src`).
- **Staff console** (`festival-admin`): staff sign in with email/password via Firebase Auth; `admins/{uid}` allowlist; self sign-up disabled; the staff email is never written into world-readable documents (D-025 — `publishedBy` is the uid).
- **Firestore rules:** default deny; public read only on `content/published`, `history/*`, `alerts/*`; writes only by allowlisted admins; `content/draft` and `admins/*` unreadable to the public (live probes: 404/403 as expected). No Cloud Storage bucket is provisioned (unauthenticated list → 404).
- **Encryption:** Firestore and Firebase Auth encrypt data at rest and in transit (Google-managed); GitHub Pages is HTTPS-only (HSTS present).

## 2. Checklist A — privacy and consumer protection

| # | Item | Status | Evidence / action |
|---|---|---|---|
| 1 | Privacy policy exists | ✅ | Published in-app and on the web at `/privacy` (`PrivacyScreen.tsx`), linked from Info; mirrored in `docs/store/privacy-policy.md`; URL recorded in `STORE-CHECKLIST.md` §0 and `docs/store/listing.md`. |
| 2 | Policy matches what is collected | ✅ | Policy states no collection; §1 above is the code-level inventory it was written from. Firestore reads (IP to Google) and GitHub Pages are disclosed. |
| 3 | AI processing disclosed | n/a | No user input leaves the device; no AI provider in either repo. |
| 4 | Third parties named | ✅ | Google Firebase (Firestore, Auth for staff), GitHub Pages, links to tellurideblues.com and maps — all named in the policy. Network inventory in §1. |
| 5 | Deletion promises kept | ✅ | The only promise is "delete the app / clear site data erases everything"; nothing is stored server-side, so nothing can linger. |
| 6 | Storage/table not public | ✅ | Rules default-deny (`firebase/firestore.rules`, 10 emulator tests + live probes); no Storage bucket; Auth sign-up disabled. Re-probe command in §3. |
| 7 | Testimonials | n/a | None in the app or the store drafts. |
| 8 | Cancellation parity | n/a | No subscriptions or purchases. |
| 9 | Free-trial auto-charge | n/a | No payments. |
| 10 | Chatbot self-harm protocol | n/a | No chat feature. |

## 3. Checklist B — marketing, security, accessibility

| # | Item | Status | Evidence / action |
|---|---|---|---|
| 1 | Marketing SMS consent | n/a | No SMS of any kind. Set reminders are on-device local notifications the fan switches on. |
| 2 | DMCA agent | n/a | No user uploads or user-generated content. |
| 3 | Unencrypted user data / reasonable security | ✅ / 🟡 | No end-user data is stored anywhere. Staff data = one email in Firebase Auth (encrypted at rest). Rules default-deny; sign-up off; single admin. 🟡 Follow-ups: MFA for the admin account needs Firebase Identity Platform (Blaze) — enable with push; the breach-response step is written below (§4). |
| 4 | Chatbot policy guardrails | n/a | No chatbot. |
| 5 | Biometric consent | n/a | No biometrics, camera, or selfies. |
| 6 | Pixels before consent | ✅ | No pixels, tags, or cookies; verified against the built bundle's host list. No consent banner needed. |
| 7 | Accessibility | ✅ | axe-core 4.10 (WCAG 2.x A/AA + best-practice) over every screen in light and dark, after fixes on 2026-09-12: 0 violations except the DEV-only clock widget (not in production). Fixes: ember chip/badge fill darkened to `ember-deep` (white text 5.9:1), selected segment text ink-on-sky (4.6:1), dark soft text `#DCC9A8`, ghost buttons use `structure` (≥ 7:1 in dark). All images carry `alt`; all controls have accessible names; 44 px hit areas throughout; every animation has a reduced-motion fallback. Re-run recipe in §5. |
| 8 | Age gate | n/a | No sign-up, no ads, no behavioral targeting; not directed at children; store age ratings answer the alcohol-reference question honestly (`docs/store/listing.md`). |
| 9 | Email unsubscribe / CAN-SPAM | n/a | The app sends no email. |
| 10 | "AI-powered" claims | n/a | No AI claims anywhere in the app or listing copy. |

## 4. Security posture and incident step (kept as the "receipts")

- Access: Firebase project owner sam.gumble@gmail.com; admin console allowlist `admins/{uid}`; Auth self sign-up disabled 2026-09-10; strong unique password (reset 2026-09-10); MFA pending Blaze (Identity Platform).
- Rules are unit-tested (`npm run rules:test`) and deployed with `npm run rules:deploy`; every deploy is a git commit.
- **If a security problem is suspected** (a rule loosened by mistake, a leaked credential, an unexpected write): 1) revoke — reset the admin password and rotate the Firebase CLI login (`npx firebase-tools logout`), re-deploy rules from `main`; 2) assess — export the affected collections from the Firebase console and diff against `history/`; 3) notify — because the app holds no fan data, the exposure surface is content and the staff email; if that ever changes (accounts, push tokens), notify affected people within 72 hours per the applicable state law and record what was sent; 4) log the incident in `docs/DECISIONS.md`.
- Re-verify public/deny surfaces (run from anywhere):
  ```bash
  B="https://firestore.googleapis.com/v1/projects/bb-festival-2026/databases/(default)/documents"
  curl -s -o /dev/null -w "published %{http_code}\n" "$B/content/published"     # 200
  curl -s -o /dev/null -w "draft %{http_code}\n" "$B/content/draft"             # 403
  curl -s -o /dev/null -w "admins %{http_code}\n" "$B/admins/x"                 # 403
  curl -s -o /dev/null -w "storage %{http_code}\n" "https://firebasestorage.googleapis.com/v0/b/bb-festival-2026.firebasestorage.app/o"  # 404 (no bucket)
  ```

## 5. Accessibility re-scan recipe

From `apps/festival`, with the dev server available: copy a Playwright spec that injects `https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js` into each route (`/`, `/lineup`, `/plan`, `/alerts`, `/info`, `/privacy`, an artist sheet) in both themes and prints `axe.run` violations for tags `wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa, best-practice`. The session's scratch version lived outside the repo on purpose (no new dependency); a checked-in `e2e/a11y.spec.ts` is the follow-up if this becomes a CI gate. Known accepted finding: `region` on the DEV-only `DevClock` pill.

## 6. Open items for Sam

- Fill the store-draft placeholders (support email/URL; whether the privacy URL should move to tellurideblues.com; SBG postal address for the policy's contact block if legal wants one).
- Decide on MFA for the admin account when the project moves to Blaze.
- Optional: delete the two archived `history/` documents and the Sep 9 published doc's copy that still carry `publishedBy: sam.gumble@gmail.com` (world-readable; it is your own email). The next re-seed rewrites `content/published`; history entries can be removed in the Firebase console → Firestore → `history`.
