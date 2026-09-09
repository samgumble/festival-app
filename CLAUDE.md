# CLAUDE.md — Telluride Blues & Brews festival app

You are working in the official companion-app monorepo for the Telluride Blues & Brews Festival (SBG Productions). Read `docs/HANDOFF.md` first, then `docs/PLAN.md`. Log every material decision in `docs/DECISIONS.md` and update the HANDOFF status board when a phase lands.

## Stack
React 19 + Vite 8 + TypeScript (strict) · Tailwind v4 tokens · `motion` · React Router 7 · Zustand · Zod · Firebase (Auth, Firestore, Cloud Messaging, Functions v2, Hosting, App Check) · Capacitor 8 (iOS/Android) · Vitest · Playwright. npm workspaces: `apps/festival`, `apps/admin`, `packages/shared`, `packages/content`, `functions`.

## Rules
- Never commit: `*.psd`, `google-services.json`, `GoogleService-Info.plist`, `*.p8`, `*.p12`, `*.keystore`, `*.jks`, `.env*`.
- Never invent festival content (artists, times, stages, bios, images). Data comes from `packages/content` (seeded from official sources) or the admin console.
- No analytics/ads/tracking SDKs. Firebase Analytics stays off.
- All schedule time math goes through `packages/shared/src/time.ts` in `America/Denver`.
- Remote content must pass the Zod schema in `packages/shared/src/schema.ts` before replacing cached content.
- Firestore writes only via rules-protected paths and the `publishContent` callable. Do not loosen `firebase/firestore.rules`.
- Every animation has a `prefers-reduced-motion` fallback; every screen renders from `bundled.json` offline.
- Official logo lockups are used as images, unmodified. Fonts are bundled OFL files only (Bungee, Bungee Shade, Michroma, DM Sans).
- Add dependencies only from the approved list in `docs/HANDOFF.md §6`; otherwise ask.

## Conventions
- Conventional commits: `feat(scope): …`, `fix:`, `chore:`, `docs:`. Small atomic commits. `main` auto-deploys the web app to GitHub Pages, so keep CI green.
- Domain logic (`apps/festival/src/domain`, `packages/shared`) is pure and unit-tested. Platform code (`apps/festival/src/platform`) wraps Capacitor plugins behind interfaces with web fallbacks.
- Components live with their feature (`src/features/<name>`); shared primitives in `src/design`.
- Screenshots for review: `npm run screenshots` → `docs/screens/<phase>/` at 390×844 and 1440×900.
- Default festival "now" in dev: `VITE_FESTIVAL_NOW=2026-09-19T15:40:00-06:00` for live-state demos; production ignores it.

## Commands
`npm run dev` · `npm run dev:admin` · `npm run emulators` · `npm run seed` · `npm run test` · `npm run test:rules` · `npm run build` · `npm run cap:sync` · `npm run cap:ios` · `npm run cap:android`
