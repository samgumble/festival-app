# Festival app — local design pass (spec)

**Date:** 2026-09-09 · **Owner:** Sam Gumble · **Status:** approved in brainstorming, awaiting written review
**Scope:** the first implementation pass of the fan app described in `docs/PLAN.md`. Local only. Establishes the design system, the app shell, all five screens at rough fidelity, and the pure domain layer — on real 2026 content — with no backend.

Companion docs: `docs/PLAN.md` (product + architecture), `docs/HANDOFF.md` (status), `docs/DECISIONS.md`, `docs/ASSET-BRIEF.md`. Approved mockups from this session live in `.superpowers/brainstorm/*/content/design-system.html` and `screens.html` (git-ignored; reference only).

---

## 1. Goal

Ship a runnable local build where every design decision is real code: tokens, fonts, ornaments, primitives, the tab shell, and Now · Lineup · Plan · Alerts · Info rendering the verified 2026 lineup from a bundled snapshot. Sam judges the design in the browser at 390×844; nothing built here is thrown away when Firebase, Capacitor, and the admin console arrive on their scheduled days.

## 2. Decisions made in this session

| # | Decision |
|---|---|
| S-1 | Real code from the start (not mockups-then-code). |
| S-2 | All five tabs at rough fidelity in this pass, not Now + Lineup only. |
| S-3 | Design system derived from the poster: palette sampled from the poster PNG; ornaments code-drawn in its illustration language. |
| S-4 | Artwork: flattened-poster crops for the hero under the ASSET-BRIEF file names (true PSD layers swap in later, no code change); everything else code-drawn SVG/CSS. |
| S-5 | Repository shape A: monorepo skeleton with only `apps/festival`, `packages/shared`, `packages/content`. No `apps/admin`, `functions`, `firebase/` until their day. |
| S-6 | Palette locked (supersedes the "provisional" status in D-013). Stage color mapping: Main = sky, Blues = plum, Truck = pine, Campground Sessions = violet. |
| S-7 | D-010's "Bungee only ≥ 24 px" is relaxed to ≥ 17 px for headliner rows in Lineup lists and Plan timelines (approved in the screens mockup); Bungee Shade stays reserved for countdown numerals and day headers. |

These get logged in `docs/DECISIONS.md` as D-016 (palette lock + stage colors) and D-017 (design-pass scope and repo shape) when the spec is committed.

## 3. Out of scope for this pass

Firebase (Auth, Firestore, Functions, Messaging, App Check), admin console, Capacitor/native, PWA service worker, push, local notifications, CI, GitHub Pages deploy, content re-verification against tellurideblues.com (checklist item before the beta), Brews/Map (v1.1). Fonts load from bundled files, never from Google Fonts at runtime.

## 4. Design system

### 4.1 Color tokens (sampled from `poster-preview-1080x1890.png`, locked)

| Token | Hex | Role |
|---|---|---|
| `paper` | `#EBD5B3` | light background |
| `paper-light` | `#F5E7CC` | cards on paper |
| `paper-deep` | `#D8C09A` | dividers, segmented-control track, pressed |
| `ink` | `#1E1A1A` | text on paper; checker dark squares |
| `ink-soft` | `#4A403C` | secondary text |
| `night` | `#1A4A80` | dark-mode surface; light-mode title color |
| `night-deep` | `#0A3070` | dark-mode background |
| `night-ink` | `#071F4A` | dark-mode track/pressed |
| `sky` | `#1890A8` | structure primary; Main Stage; info alerts; active tab |
| `sky-light` | `#7CC4D6` | dark-mode structure; tints |
| `plum` | `#78307A` | Blues Stage; personal/plan context |
| `violet` | `#7A64A8` | Campground Sessions; columbine petals |
| `pine` | `#1E7A22` | Truck Stage; success |
| `leaf` | `#3CA81E` | rainbow green band; success tints |
| `sun` | `#F0C41C` | primary accent: CTAs, favorites, "now", important alerts |
| `sun-hot` | `#F09A1C` | gradient partner for sun; rays |
| `amber` | `#D1973D` | brews context (reserved for v1.1) |
| `ember` | `#D4452F` | urgent alerts, conflicts, destructive; rainbow red band |
| `bloom` | `#E0508F` | celebratory moments only |

Semantic aliases per theme: `bg`, `surface`, `surface-2`, `fg`, `fg-soft`, `hair` (hairline), `structure`, `structure-2`. Light: paper/paper-light/paper-deep/ink/ink-soft/sky/night. Dark ("poster at night"): night-deep/night/night-ink/paper/`#CDB99A`/sky-light/sky.

Rules: 60% paper (or night) / 30% structure / 10% accent. Sun and sun-hot never carry white text. Color is never the only signal (severity and conflicts also carry a label or icon). WCAG 2.2 AA on every text/background pair; body copy on paper meets AAA.

### 4.2 Type

Bundled OFL files under `apps/festival/public/fonts/` with `OFL.txt` each; `font-display: block`.

| Tier | Face | Size/line | Use |
|---|---|---|---|
| display | Bungee | 40/44 | hero moments |
| countdown | Bungee Shade | 56–64 | countdown numerals, day headers only |
| title-1 | Bungee | 32/36 | screen titles |
| title-2 | Bungee | 24/28 | artist names in cards/sheets |
| headline | DM Sans 600 | 20/24 | |
| body | DM Sans 400 | 17/24 | |
| callout | DM Sans | 15/20 | times (tabular numerals) |
| caption | DM Sans | 13/16 | |
| eyebrow | Michroma | 11/14, +0.14em, caps | section labels, stage names, "NOW" |
| micro | Michroma | 9–10, +0.1em, caps | chips |

Bungee is never used below 17 px (headliner rows) and prefers ≥ 20. OS text scaling to 200% must not clip.

### 4.3 Shape, surface, elevation

Radii: chip 999, control 12, card 20, sheet 28 (top), hero 28–32. Paper grain: tiled 256 px noise (SVG `feTurbulence` data URI or `paper-tile.png` once exported), `mix-blend-mode: multiply` at ~10% light / `screen` at ~6% dark. Card: `surface`, 1 px `hair`, shadow `0 8px 24px rgba(32,28,29,.10)` (dark: `rgba(0,0,0,.35)`). Sheet: `0 -12px 40px rgba(23,58,101,.18)`, 40×5 grabber.

### 4.4 Ornaments (`src/design/ornaments/`, SVG components, token-tinted, `aria-hidden`)

`CheckerRibbon` (2 rows; dividers, tab-bar top edge, sheet grabber band) · `RainbowArch` (ember → sun-hot → sun → leaf → sky bands + checker inner ring; frames the Now hero and empty states) · `SunRays` (24 rays, two tones; rotates 360°/120 s; static under reduced motion) · `Columbine` (favorite "on" state, bullets) · `Mountains` (far sky / near plum / grass leaf silhouettes with snow caps) · `Butterfly` (drifts on a 9 s sine loop; static under reduced motion).

### 4.5 Primitives (`src/design/`)

`Button` (sun / ink / ghost; 48 px, `sm` 36 px) · `Card` · `Chip` (stage + severity variants) · `SegmentedControl` · `Heart` (outline → columbine bloom, spring 0.8 → 1.15 → 1 over 220 ms, `aria-pressed`, accessible label "Favorite {artist}, {day} {time}, {stage}") · `Sheet` (route-driven; medium/large detents on iOS manners) · `Eyebrow` · `Badge` · `Toggle` · `ProgressBar` · `TabBar`. Targets ≥ 44 px (48 preferred). Every animation has a `prefers-reduced-motion` path (motion presets in `src/design/motion.ts`: tap spring 380/32, sheet spring 220/26, durations 160/240/320 ms, transform/opacity only).

### 4.6 Gallery

`/design` route, registered only when `import.meta.env.DEV`: tokens, type tiers, ornaments, primitives, light and dark.

## 5. App shell and navigation

- React Router 7 routes: `/` Now · `/lineup` · `/lineup/artist/:id` (sheet over Lineup) · `/plan` · `/alerts` · `/alerts/:id` · `/info` · `/design` (dev). `TabShell` layout owns the tab bar, safe-area insets, and `<Outlet>`. Back gesture / browser back closes sheets.
- Tab bar: checker ribbon top edge, hand-drawn 24 px SVG icons (Now sun, Lineup bars+note, Plan calendar+heart, Alerts bell+ray, Info circle-i) with filled active variants, Michroma labels, badges (Plan = favorites count in sun; Alerts = unread in ember). Height 56 px + `env(safe-area-inset-bottom)`.
- `data-platform` on `<html>`: `ios | android | web`; this pass renders `web` with iOS manners (large-title collapse, sheet detents). Android manners are implemented later behind the same attribute.
- Per-tab scroll position preserved.
- `data-theme`: follows `prefers-color-scheme` by default; Info offers System / Light / Dark.
- Festival clock: `useFestivalClock()` → `{ now, state: "pre" | "live" | "post", dayId | null }`, ticks each minute. Dev-only floating clock pill with presets (Thu before, Fri 11:30 gates, Sat 3:40 PM, Sun 9:00 PM, Mon after) persisted in localStorage; honors `VITE_FESTIVAL_NOW` as the initial value; stripped from production builds.
- `ContentStatus` surface: "Bundled content · v2026.09.09 · offline-ready" (Info footer; later "Updated 4:12 PM · offline").

## 6. Screens (as approved in `screens.html`)

**Now.** Hero: rainbow arch + checker ring framing the poster crop, official lockup unmodified, "32nd annual" sun chip. Pre-festival: taller hero with Bungee Shade countdown (days:hours) and "Gates 11:30 AM · Fri Sep 18"; below it headliner cards and "Build your plan" (if no favorites). Live: hero compressed to ~250 px with "Day N of 3"; urgent alert banner (only when an unexpired urgent alert exists); "On stage now" — one card per stage currently playing (artist in Bungee, sun "● Now" chip, stage chip, minutes left, progress bar); up-next pair; "Your next set" card in plum with Remind. Post: thank-you, "see you in 2027", share. Everywhere: latest two alerts and quick links (tickets, FAQ, site).

**Lineup.** Title-1 "Lineup"; `SegmentedControl` Fri/Sat/Sun defaulting to today during the festival, else Friday; List/Grid toggle; search field (filters by artist name across all days). List: grouped by stage in `sortOrder`, chronological rows (time · artist · optional sub-label · Heart); the "now" row gets a sun wash and "On now · N min left"; ended rows dim; headliner rows use Bungee with a sun wash. Grid: horizontal-scroll timeline, hours across (60 px/hour), stage lanes down, blocks in stage color, favorited blocks rimmed in sun, sun "now" line updated on the minute tick, "● Jump to now" button; blocks ≥ 48 px tall; short sets abbreviated. Tap row/block → Artist sheet: name, tier chip, all sets with stage chips, plan state button ("Add to plan" / "✓ In your plan"), "Remind 15 min", share. No bios, no photos.

**Plan.** Title "My Plan" + settings button (lead time 5/15/30 min; buffer between stages 0/10/20 min). Day control with per-day counts; conflict count chip when > 0. "Next up" card pinned (plum) with "leave by" derived from buffer. Vertical timeline of favorited sets for the day; ended sets dimmed; headliners sun-washed; reminder toggle per set. Overlaps render as a braided pair: kept set solid with an ember "⚠ Overlaps N min" chip and explanatory text; the other dashed with **Swap**. Footer: "Add to calendar" (`.ics` download) and "Share as text" (Web Share API, clipboard fallback). Empty state: rainbow arch, "Your weekend starts here", three headliner quick-adds.

**Alerts.** Title + "From the festival · updated {time}". Push opt-in card until enabled (this pass: toggles a local flag, no permission prompt). Cards reverse-chronological: left bar + chip by severity (sky info / sun important / ember urgent), unread dot, title, time, body, optional link button; older days grouped under an eyebrow. Opening a card marks it read; badge = unread count. Empty state: "All quiet in Town Park."

**Info.** Festival card: official dates lockup on `night`, then Gates / Venue / Altitude rows. Official links (site, tickets, FAQ & guide, Town Park in Maps) opening in a new tab. Settings: Festival alerts toggle, Set reminders lead time, Appearance. SBG credit card with logo, © 2026 SBG Productions, Privacy, Licenses (fonts). Footer provenance line: content version · bundled · offline-ready · app version.

## 7. Data and domain

### 7.1 Repository layout (this pass)

```
apps/festival/            Vite + React 19 + TS strict + Tailwind v4 + motion + React Router 7 + Zustand
  public/fonts/           Bungee, Bungee Shade, Michroma, DM Sans (+ OFL.txt each)
  public/art/             poster crops under ASSET-BRIEF names (sky.png, mountains-far.png, …) + lockups
  src/app/                router, TabShell, providers, dev clock
  src/design/             tokens.css, motion.ts, primitives, ornaments/, gallery (dev)
  src/features/{now,lineup,plan,alerts,info}/
  src/data/               ContentRepository, BundledContentSource, alerts fixture, bundled.json (generated)
  src/domain/             time.ts, schedule.ts, conflicts.ts, ics.ts (+ tests)
  src/state/              plan, alerts, ui stores
packages/shared/          schema.ts (Zod), types, tokens source
packages/content/         content-2026.json, build script → apps/festival/src/data/bundled.json
docs/                     existing docs + superpowers/specs, screens/
```

npm workspaces at the root. Dependencies only from `HANDOFF.md §6`; versions pinned at install.

### 7.2 Schema (`packages/shared/src/schema.ts`)

PLAN §3.4 shapes with these refinements: `Stage.color` is one of `"sky" | "plum" | "pine" | "violet"`; `Artist.tier` is `"headliner" | "featured" | "lineup" | "comedy" | "musicmaker"`; `Set.start`/`end` are ISO 8601 with offset and `end > start`; cross-reference refinements reject sets whose `artistId`/`stageId`/`dayId` don't exist. `Alert` per PLAN. Types are inferred from the schemas.

### 7.3 Content

`packages/content/content-2026.json` migrated from the Sep 8 verified data (git `HEAD:data/content.json`): four stages (Main Stage, Blues Stage, Truck Stage, Campground Sessions), three days (`fri` 2026-09-18, `sat` 2026-09-19, `sun` 2026-09-20; gates 11:30), 30 artists, 41 sets with ISO times in `-06:00`. `npm run content:build` validates against the schema and writes `bundled.json`; failure fails the build and `npm test`. Nothing is invented. Music Maker Foundation acts have verified set times and get tier `musicmaker`. The four comedy acts named on the official poster (Troy Walker, Hannah Jones, Baron Vaughn, Kiran Deol) are not in the Sep 8 data; they are added as tier `comedy` lineup-only entries with no sets, sourced from the poster, and shown in Lineup under a "Comedy" group without times until SBG supplies a schedule.

### 7.4 Repository interface (`src/data`)

`ContentRepository { getContent(): Content; subscribe(cb: (c: Content) => void): () => void }`. This pass: `BundledContentSource`. `AlertsRepository` with the same shape over `alerts.fixture.json`. Firestore sources are added later behind the same interfaces with validated-remote → cache → bundled precedence.

### 7.5 Domain (pure, no React, unit-tested)

- `time.ts`: `festivalNow(override?)`, `toDenverParts(date)`, `formatTime`, `formatRange`, `minutesBetween`, `dayIdFor(date, festival)` with a 4 AM Denver rollover. `Intl.DateTimeFormat` with `timeZone: "America/Denver"`; no date library; never `new Date(wallClockString)`.
- `schedule.ts`: `setsForDay`, `groupByStage`, `nowPlaying(sets, now)`, `upNext(sets, now, perStage)`, `festivalState(festival, now)`, `progress(set, now)`.
- `conflicts.ts`: `detectConflicts(sets, bufferMin)` (pairwise overlaps incl. buffer, stable keys `a|b` sorted), `applyResolutions(conflicts, resolutions)`, `nextUp(plan, now)`, `leaveBy(set, bufferMin)`.
- `ics.ts`: `planToIcs(sets, artists, stages, festival)`.

### 7.6 State (Zustand + `persist`, localStorage; Capacitor Preferences adapter later)

`usePlanStore` { favorites: setId[], resolutions: Record<conflictKey, setId>, reminders: setId[], settings { leadMinutes: 5|15|30, bufferMinutes: 0|10|20 } } · `useAlertsStore` { readIds, pushOptIn } · `useUiStore` { theme: system|light|dark, devNow?: string }.

## 8. Testing and review

- Vitest: `time` (Denver vs Chicago/UTC device zones; override ignored in PROD), `schedule` (state at Thu night / Fri 11:29 vs 11:30 / Sun 9:31 PM / Mon; Sat 3:40 PM now/up-next against bundled data; 4 AM rollover), `conflicts` (real Musselwhite/Albert White overlap; buffer-induced conflict; resolution survives a moved set), `schema` (bundled validates; bad `end`, unknown `stageId`, unknown `artistId` rejected), `content:build` runs in `npm test`.
- Render smoke per screen at pre/live/post via the dev clock.
- `npm run screenshots`: Playwright, 390×844, light + dark, three clock states → `docs/screens/design-pass/`.
- Performance guardrail: hero art ≤ 2 MB total for this pass (WebP where alpha allows).

## 9. Definition of done

1. `npm install && npm run dev` serves all five tabs with real 2026 content; favorites, resolutions, reminders, and read state persist across reload.
2. Dev clock scrubs Now / Lineup / Plan through pre → live → post.
3. Lineup list + grid + search + Artist sheet; Plan with conflicts, Swap, next-up, `.ics`, share; Alerts inbox from fixture with read state and badge; Info complete.
4. Light + dark; reduced-motion honored; fonts bundled locally; `/design` gallery renders.
5. All tests green; screenshot set committed under `docs/screens/design-pass/`; `HANDOFF.md` status board updated; `DECISIONS.md` gains D-016 and D-017.
