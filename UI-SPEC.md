# Blues & Brews Companion — UI Design Contract

Status: **LOCKED for the 2026 flagship polish pass**  
Scope: public companion app, PWA states, share flow, and organizer publisher  
Baseline audited: September 8, 2026 at 390×844 and 1440×1000

## Product character

The app should feel like the official pocket expression of the Telluride poster: warm, tactile, spirited, and highly legible at altitude. It is an operational festival tool with editorial confidence—not a generic event template, dashboard, or phone mockup floating on desktop.

Three experience promises govern every screen:

1. **Know what matters now.** Current state, favorites, next set, conflicts, offline readiness, and updates are obvious without hunting.
2. **React at tap speed.** Favorite, filter, plan, FAQ, and share actions acknowledge input immediately and update every dependent view in the same frame.
3. **Keep the poster soul.** Preserve the licensed artwork, existing paper/indigo/plum/sun palette, bold display type, and handcrafted energy while making layout and motion more disciplined.

## Brand invariants

- Keep the official festival logo prominent and unmodified.
- Keep the poster-derived palette: paper `#f8efdd`, ink `#191630`, indigo `#24236f`, deep indigo `#171743`, plum `#6a326e`, sun `#f6b815`, coral `#ed704c`, teal `#1e7373`.
- Archivo Black owns display headlines; DM Sans owns interface/body copy. Michroma remains reserved for the personalized poster label.
- Paper grain may remain subtle. Decorative arcs/sun fields support hierarchy but never sit behind small body copy at low contrast.
- Do not introduce glassmorphism, neon gradients, generic stock imagery, excessive blur, novelty cursor effects, or motion without state meaning.

## Layout system

- **Mobile, 320–719 px:** one-column content; 16 px side gutters; 72 px sticky top bar; safe-area-aware bottom navigation; minimum 44×44 px targets.
- **Tablet, 720–1023 px:** 24 px gutters; wider content cards; two-column supporting grids; bottom navigation remains available.
- **Desktop, 1024 px and above:** full responsive canvas up to 1240 px; 32 px outer gutters; top-bar navigation replaces the bottom bar; route content uses editorial two- and three-column compositions. Never render the app as a 680 px phone frame.
- Route transitions preserve the stable chrome, move focus to the route heading, and reset scroll without a long smooth-scroll delay.
- Primary content has at least 104 px clearance above mobile bottom navigation and at least 48 px final breathing room on desktop.

## Tokens

- Spacing scale: 4, 8, 16, 24, 32, 48, 64 px. Components must compose these values rather than introducing new spacing tokens.
- Corner scale: controls 12 px; cards 18 px; feature surfaces 24–30 px; pills fully rounded.
- Shadows: low `0 10px 30px rgba(25,22,48,.08)`; raised `0 22px 60px rgba(25,22,48,.16)`. Use hard 3–4 px sun accents only as branded emphasis.
- Typography uses four tiers only: caption/eyebrow 12 px at 1.4; body/control 16 px at 1.55; section heading 32 px at 1; display heading `clamp(48px, 7vw, 80px)` at 0.94. Weight, case, and tracking create secondary hierarchy without new size tokens.
- Focus ring: 3 px sun/ink paired ring with 3 px offset; never rely on browser-default blue alone.

## Color roles

- Aim for a **60/30/10 allocation**: roughly 60% paper/white reading surfaces, 30% indigo/plum/teal structural fields, and 10% sun/coral accents.
- **Sun is the primary accent**, reserved for primary actions, current selections, focus reinforcement, success sparks, and the small live-update pulse. It must not become a general card background except the intentional survival/summary surfaces.
- Indigo/deep indigo anchor navigation, hero, tuner, and high-emphasis content. Plum distinguishes personal-plan/favorite contexts. Teal is reserved for guide/connectivity contexts. Coral is a supporting lineup accent only.
- Ink is the default text color on light/sun surfaces; white is limited to passing dark structural fields. Muted text must still pass AA at its rendered size.

## App chrome and navigation

- Top bar uses a compact logo, visible route context on desktop, and grouped status/install controls.
- Mobile bottom navigation is a raised dock with clear active-state fill, label, and favorite count. It must not cover page actions or card copy.
- Desktop navigation is horizontal, keyboard accessible, and shows the same routes and favorite badge.
- Offline state is a calm teal status pill: “Offline · guide saved.” Online recovery removes it without layout jump.
- The update banner is an assertive but compact bottom/edge notice with one clear refresh action.

## Home

- Hero becomes a concise editorial split: copy/action on one side and poster-like sun/mountain composition on the other at desktop; mobile height targets 430–500 px, keeping the next section visible above the fold on common devices.
- **Signature poster assembly:** the hero uses clipped views of the existing licensed runtime poster—not invented replacement art—to separate its sun/rays, mountain field, and foreground scene by a small capped offset at the top of the page. During the first portion of hero scroll, those layers settle into the recognizable poster composition. The effect runs only while the hero is near the viewport, updates one CSS custom property through `requestAnimationFrame`, and animates only `transform`/`opacity`; total travel is capped at 24 px and scale variance at 2%. Text and controls remain on a stable, high-contrast plane above the art.
- The assembled scene remains static after its single scroll progression; there is no looping or pointer-following parallax. At widths below 360 px, when `prefers-reduced-motion` is active, when save-data is requested, or if the poster cannot load, show a static/simplified hero composition. The existing poster file remains the only motion-art payload and stays in the offline app shell, so no PSD-derived master or new network dependency is introduced.
- Add a compact utility strip for official dates, location, and offline-ready positioning rather than burying those facts at the hero floor.
- “Your pocket festival” actions read as useful tasks with short outcome copy and visible current favorite count where relevant.
- The home lineup remains the full official lineup. Mobile uses high-quality horizontal cards; desktop uses a scannable multi-column grid without hiding artists.
- Favorite changes animate the heart/number briefly and update Home, Lineup, My Plan, and navigation immediately.

## Lineup

- Search and day filters form one compact sticky tool surface. Show a live result count and a clear-search affordance when text is present.
- Mobile list rows emphasize artist, day/time, and stage. Desktop uses a two-column grid of substantial rows/cards while retaining day/headliner grouping.
- Favorite buttons expose `aria-pressed`, have descriptive labels, and use a 160–220 ms scale/fill confirmation. Rows briefly acknowledge a successful save without shifting layout.
- Empty search/filter state names the active condition and offers a one-tap reset.
- Input changes update results immediately; no submit button or delayed loader.

## My Plan / Festival Flow

- Desktop uses a two-column workbench: the tuner remains visible while results, next set, and schedule occupy the larger column. Mobile remains linear.
- The current favorite count is visible in the intro and tuner. Before a plan exists, the empty state clearly sends people to the lineup or builds from saved picks.
- Building a plan gives immediate pressed/busy feedback, then reveals the summary with a restrained entrance.
- Conflict resolution is explicit: show the count and explain that higher-priority/non-overlapping sets were kept. Zero conflicts is celebrated without overclaiming.
- “What should I see next?” is the strongest result card, with time, stage, and concise reason.
- Reminder/calendar/share actions use clear success/error feedback. Share-poster generation shows a temporary “Building poster…” state, disables duplicate activation, opens a polished preview, and restores controls on error.
- Removing a favorite reconciles an existing plan immediately and never leaves orphaned schedule entries.

## Guide and FAQ

- Guide essentials use icon-supported cards with consistent height only where content permits; body copy remains readable and never over-compressed.
- Desktop uses a three-column essentials grid; mobile uses one or two columns based on available width.
- Offline survival guidance gets a full-width sun treatment and explicitly confirms what remains available offline.
- FAQ summaries have clear plus/minus state, 48 px minimum height, visible focus, and restrained open/close feedback. Native `<details>` semantics remain.
- Venue, privacy, and official-source links are visually distinct and remain keyboard/screen-reader accessible.

## Organizer publisher

- Preserve its credential-free architecture and editorial voice.
- Desktop uses a contained 1120 px workflow with clear numbered stages; mobile reduces headline scale and keeps forms comfortably tappable.
- Validation is persistent and unmistakable. Valid, invalid, copied, and downloaded states receive live-region feedback without relying on color alone.
- Primary publishing actions remain visually separated from editing controls to reduce accidental downloads.

## Motion and tactile feedback

- Standard motion: 160 ms control feedback, 240 ms surface transitions, 320 ms route entrance. Prefer opacity and transform only.
- Buttons depress 1–2 px; cards lift no more than 3 px on pointer hover. Touch devices do not receive sticky hover states.
- Route entrance staggers only major regions, maximum 80 ms spread. Never animate every lineup row on initial load.
- Favorite confirmation may use a short heart pop and count pulse. Plan generation may use a single sparkle sweep. FAQ uses icon rotation and content reveal.
- `prefers-reduced-motion: reduce` disables smooth scroll, staggers, scale effects, and decorative loops while preserving immediate state visibility.
- Scroll-linked hero assembly is progressively enhanced. It must never delay first interaction, capture scroll, obscure controls, or leave layers separated after an orientation/viewport change.

## Accessibility and resilience

- Target WCAG 2.2 AA contrast. White body text appears only on indigo/plum/teal tones that pass; sun uses ink text.
- All interactive controls support keyboard focus and activation. Search has a visible label (screen-reader text is acceptable), filters expose pressed state, and route controls identify the current page.
- Route headings receive programmatic focus without suppressing a needed focus indicator.
- Toasts and publisher validation use polite live regions; urgent failures use assertive announcements only when action is required.
- State copy and actions are locked as follows:
  - Initial loading: **“Tuning the festival guide…”** with supporting **“Loading the official 2026 lineup and your saved picks.”** No button while a request is active.
  - Fatal content failure: **“Festival guide unavailable”** with **“Reconnect once to save the guide for offline use.”** and button **“Try again.”**
  - Empty lineup result: **“No artists match”** with **“Try another name or reset your day filters.”** and button **“Clear filters.”**
  - No favorites/plan: **“Your weekend starts here”** with button **“Choose artists.”** Saved favorites without a plan: **“Your picks are ready”** with button **“Build my festival flow.”**
  - Share generation: button **“Building poster…”** while busy; success heading **“My Festival Picks”**; failure toast **“Poster couldn’t be built. Try again.”**
  - Offline pill: **“Offline · guide saved.”** Offline toast: **“Offline — your saved guide is ready.”** Update notice: **“A fresh festival guide is ready.”** with button **“Refresh now.”**
- Loading content renders the branded status above instead of a blank shell. Offline mode continues to use cached content and app shell.
- Safe-area insets, text zoom, 320 px width, 200% zoom, and long artist names must not clip controls or important copy.

## Component registry safety

This is a vanilla HTML/CSS/JavaScript design system. No shadcn registry, third-party UI registry, component CDN, remote font, or generated registry block is permitted. Reusable patterns are local CSS classes and small local render functions only.

## Implementation acceptance

- Home, Lineup, My Plan, Guide, publisher, privacy, install, offline, update, empty, error, and share-preview states follow this contract.
- Mobile screenshots at 390×844 and desktop screenshots at 1440×1000 show intentional layouts with no covered content or phone-frame desktop treatment.
- The poster assembly is visually verified in Chromium and WebKit where available, remains compositor-friendly during scroll, and resolves to a coherent static scene in reduced-motion/small-device fallback conditions.
- Favorite toggles propagate synchronously to all dependent UI and reconcile a built plan.
- Search/day filters, plan builder, FAQ, reminder/calendar fallbacks, and poster generation remain functional.
- Build and syntax checks pass; PWA paths remain relative; service-worker cache keys and asset versions are bumped for changed production assets.
- No analytics, accounts, network personalization, remote fonts, credentials, or source PSD enter the implementation or public bundle.
