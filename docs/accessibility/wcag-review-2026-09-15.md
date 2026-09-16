# WCAG 2.2 AA review — Telluride Blues & Brews app (v1.0.0, 2026-09-15)

Read-only review. Nothing in the app was changed. Companion document: `vpat-acr-2026-09-15.md` (the Accessibility Conformance Report in ITI VPAT 2.5 format).

## Summary

**Update, later on 2026-09-15:** items 1, 2 and 4 below and the sheet focus management (item 9) are fixed (D-035, D-037); the axe gate now scans the grid view and passes 16/16 in both themes. The VPAT reflects the new state.

The app has a strong accessibility foundation: real HTML semantics everywhere, named icon buttons, reduced-motion fallbacks on every animation, a deliberate 44px touch-target system, and no information conveyed by colour alone. The problems are concentrated in five places, and all of them are fixable in a day or two of work without touching content or layout:

| # | Problem | WCAG | Severity |
|---|---|---|---|
| 1 | Text on the coloured stage blocks (grid and schedule) is below the 4.5:1 contrast minimum — sky 3.08–3.75:1, violet 3.76–4.27:1, pine 4.14:1, 9px column headers 3.75:1 | 1.4.3 | Blocker |
| 2 | Sheets (artist, schedule settings, reset favorites, install) declare themselves modal but do not move focus in, trap it, hide the page behind, or return it on close | 2.4.3, 2.4.11, 4.1.2 | Blocker |
| 3 | No author focus styles; favourited grid blocks and conflicted schedule blocks have **no** visible focus ring because their own outline overrides the browser's | 2.4.7 | Blocker |
| 4 | Red "notifications are off" text is 2.01:1 in dark mode and 3.66:1 in light; iOS install-sheet step numbers are sky-on-sky (1.00:1) in dark mode | 1.4.3 | Blocker |
| 5 | The native iOS/Android builds lock zoom and use fixed pixel type, so there is no way to enlarge text in the store apps (web build is fine) | 1.4.4 | Blocker (native only) |

Beyond those: static page title on every route, no live regions for new alerts or the update banner, headings rendered as styled spans, and a handful of dark-mode UI-component contrast misses. Full list below.

## Method

- **Automated:** axe-core 4.10.2 (rules wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa, best-practice) driven by Playwright at 390×844. The stock gate (`npm run e2e:a11y`) covers 7 routes × 2 themes. A supplementary run covered the surfaces the gate skips: lineup **grid** view (both themes), the schedule calendar with favourites, the schedule settings sheet, the reset-favorites sheet, the search state, and the artist sheet in dark mode. The supplementary spec was run from a temporary file and removed; it is not in the repo.
- **Manual code review** of `apps/festival/src` for the criteria axe cannot test: focus management, keyboard reachability, motion, text scaling, colour-only cues, live regions, headings and landmarks, target sizes. Contrast ratios computed from the literal hex values in `src/design/tokens.css`.
- **Not done:** screen-reader testing on a device (VoiceOver, TalkBack), switch access, or testing with real users. Those should happen before the conformance report is shared externally.

Stock gate result: 12 of 14 pass. Both failures are the schedule calendar (light and dark) on colour contrast. Supplementary run: grid view fails contrast in both themes; every other surface passes axe.

## Findings

Severity: **Blocker** = fails a Level A/AA criterion in a way that blocks a group of users; **Should fix** = fails a criterion with a workaround or limited scope; **Minor** = best practice or edge case.

### Contrast (1.4.3 text, 1.4.11 non-text)

1. **Stage block text** — `features/lineup/LineupGrid.tsx:39`, `features/plan/PlanGrid.tsx:21` (`STAGE_BG`). Measured by axe: white on sky `#1890A8` 3.75:1; off-white on sky 3.08:1; on violet `#8C78AD` 3.76:1 (dark 4.27:1); on pine `#3E8A3C` 4.14:1. Text is 10–12px, so 4.5:1 applies. The 9px `micro` schedule column titles are also 3.75:1. Plum, amber, bloom, leaf and sun-hot pass. Note `design/Chip.tsx` already uses ink-on-sky (4.59:1) for the same colour. **Blocker.** Fix: ink text on sky and violet; a darker pine, or ink text.
2. **Denied-notifications message** — `features/plan/PlanSettings.tsx:27`, `features/plan/ReminderPrompt.tsx:16`, `features/info/InfoScreen.tsx:86`. `text-ember` (#D4452F) at 13px: 3.66:1 light, 2.01:1 dark. **Blocker.** Fix: a themed danger-text token (light ≈ #B8341F, dark a lifted red).
3. **Install sheet step numbers** — `features/info/InstallSheet.tsx:15`. Dark theme resolves both fill and text to sky: 1.00:1, invisible. Light: 2.40:1. Only reachable on iOS Safari, so the scan never saw it. **Blocker.** Fix: ink text.
4. **`Button variant="ink"` in dark mode** — `design/Button.tsx:11`. Night-deep text on sky 3.35:1 at 14–16px. Used for "Add to Home Screen", "Continue", "Done". The destructive "Yes, reset" (`ResetFavorites.tsx:29`) overrides the fill to ember-deep and drops to 4.14:1 light / 2.13:1 dark. **Should fix.** Fix: explicit white or ink foreground per fill.
5. **Active tab icon** — `app/TabBar.tsx:29`. Sky icon on the dark surface 2.40:1 (light 3.07:1). The label uses a themed token and passes; the icon does not. **Should fix.**
6. **Favourite and conflict outlines** — `LineupGrid.tsx:93` (sun outline), `PlanGrid.tsx:68` (ember outline). Outline vs block fill as low as 1.19:1; the ring is invisible on several stages. Not a colour-only failure because both states also carry a glyph, but the ring itself misses 3:1. **Should fix.** Fix: add a contrasting hairline.
7. **Stage blocks in dark mode have no visible boundary** — plum fill vs night surface 1.07:1, sky vs night 2.40:1. Text is readable; the edge of the control is not. **Should fix.** Fix: a hairline border on every block.
8. **Minor:** schedule now-line (`PlanGrid.tsx:76`) 1.36:1 on the light surface (the lineup grid's version has an ink-stroked dot and passes); Toggle track vs surface 1.44:1 and knob vs track 1.76:1 (`design/Toggle.tsx:7-8`); unread dot on dark alert tints 1.66–2.41:1 (`AlertsScreen.tsx:22`); plum eyebrow on the dark card surface 4.03:1 at 11px (`PlanScreen.tsx:57`).

### Focus and keyboard (2.4.3, 2.4.7, 2.4.11, 2.1.1)

9. **Sheets have no focus management** — `design/Sheet.tsx:12-22`. `role="dialog"`, `aria-modal="true"`, a name and Escape are all present. But nothing moves focus into the sheet, Tab is not constrained to it, the page behind is not `inert`, and focus is not restored on close. A keyboard user can Tab through the tab bar behind the backdrop while a screen reader is told that content is unavailable. The artist sheet opens by route change, so there is no trigger to return to. **Blocker.** Fix: a focus-trap hook in `Sheet` (focus on mount, cycle Tab, `inert` siblings, restore on unmount) and focus `<main>` after `navigate("/lineup")`.
10. **No visible focus on favourited or conflicted blocks** — the app has no author focus styles anywhere (zero `focus` matches in `src`), so controls rely on the browser's default ring. That ring is an `outline`, and the favourite (`LineupGrid.tsx:93`) and conflict (`PlanGrid.tsx:68`) states set their own `outline`, which replaces it. Those blocks show no focus at all. **Blocker.** Fix: a global `:focus-visible` rule in `tokens.css`, and move the state rings to `box-shadow`/`ring-*`.
11. **No skip link, no focus reset on route change** — `app/TabShell.tsx`. Landmarks exist, and the nav comes after `<main>` in DOM order, so the practical cost is small. **Should fix.**
12. **Minor:** horizontal scrollers (`LineupGrid.tsx:76`, `PlanGrid.tsx:53`) are not focusable regions, so a keyboard user cannot arrow-scroll the timeline without landing on a block. All blocks are reachable by Tab, and "Jump to now" is a good affordance.

### Names, roles, values (4.1.2, 1.3.1, 2.4.6)

13. **`aria-label` on plain `<div>`/`<span>`** — `Countdown.tsx:10`, `UpdateBanner.tsx:17`, `AlertsScreen.tsx:22` ("Unread" dot). ARIA prohibits naming a generic element; support is inconsistent. **Should fix.** Fix: `sr-only` text plus `aria-hidden` on the visual, or `role="img"`.
14. **Grid block accessible name omits favourite and ended state** — `LineupGrid.tsx:91`. The visible ♥ sits inside content that `aria-label` replaces; ended sets are only `opacity-85`. **Minor.** Fix: append ", favorited" / ", ended".
15. **Section headings are styled spans, not headings** — stage groups in `LineupList.tsx:23`, day groups in `AlertsScreen.tsx:70`, "Get the app / Official links / Settings" in `InfoScreen.tsx:62-81`, every section of `PrivacyScreen.tsx:69-75`. Heading navigation skips the structure; the privacy policy is eight sections under one heading. **Minor, cheap.** Fix: render `Section` titles as `<h2>` with the existing eyebrow class.
16. **External links** carry only a `↗` glyph as the new-window cue (six sites). **Minor.** Fix: `sr-only` "(opens in a new tab)".
17. **Search** has `role="searchbox"` on `<input type="search">` (redundant) and only a placeholder as visible label. **Minor.**
18. **Tab-bar badges** (unread alerts, favourite count) are not in the link's accessible name. **Should fix.** Fix: `aria-label="Alerts, 3 unread"`.

### Status messages (4.1.3)

19. **Update banner live region mounts together with its content** — `app/UpdateBanner.tsx:15,20`. `role="status"` is right, but a region injected with its text is often not announced. **Should fix.** Fix: a persistent empty status region in `TabShell`.
20. **No announcement for new alerts, unread count changes, or the "Send a test reminder" result** — `PlanSettings.tsx:34-36` appends the outcome to a static paragraph. **Should fix.** Fix: `aria-live="polite"` on that paragraph; badge counts in tab names (item 18).

### Page title (2.4.2)

21. **One static `<title>` for all routes** — `index.html:13`; no `document.title` anywhere. Browser tabs, history and the screen-reader page announcement are identical on every screen. Each screen does have a correct `<h1>`. **Should fix.** Fix: `useDocumentTitle("Lineup · Telluride Blues & Brews")` per screen.

### Text scaling and reflow (1.4.4, 1.4.10, 1.4.12)

22. **Native builds cannot enlarge text** — `platform/zoom.ts:12-18` sets `maximum-scale=1, user-scalable=no` and cancels pinch gestures (native only, added at the owner's request to stop scroll-lock incidents), and all 97 font sizes are hard pixels, so OS text-size settings do not apply inside the WebView either. The web build has no zoom lock and browser zoom to 200% reflows correctly. **Blocker for the store apps.** Fix: convert the type scale to `rem` so the OS setting scales text, then keep the pinch lock; or keep the gesture handlers but drop `user-scalable=no`.
23. **Fixed-height grid blocks clip** — `LineupGrid.tsx:93-96` (`h-14`, `overflow-hidden`, `line-clamp-2` at 12px/14px) and the lane label column computed from a hard-coded glyph width (`CHAR_PX = 8.4`). Names already truncate at default size and cannot grow. The countdown (`Countdown.tsx:9-12`) shows the right pattern. **Should fix.**
24. **Orientation** — the native apps are portrait-locked (Android manifest and iOS `Info.plist`). WCAG 1.3.4 requires supporting both unless essential. **Should fix** for native; web is unaffected.
25. **Minor:** My Schedule has no non-2D-scroll alternative (the calendar needs horizontal + vertical scroll). The 2D-layout exception plausibly applies, and Lineup's list view shows the pattern if wanted.

### Target size (2.5.8)

26. **All targets meet the 24px minimum.** The 15-minute Blues Challenge Winner set renders 18px wide on Saturday, but the block's pseudo-element hit area extends it to about 30px. Five 30-minute Truck Stage sets are 43px, under the 44px house standard but above the AA floor. The clear-search × is 28px, the only control below 44px. **Minor.**

## What is done well

- **Motion:** every animation has a reduced-motion path (`useMotionOk`, `motion-reduce:` variants, and a `prefers-reduced-motion` block). The hero is static by design. Nothing flashes.
- **Colour is never the only cue:** conflicts get a ⚠ prefix and an `sr-only` sentence naming the other artist and the overlap; favourites use `aria-pressed` and a different glyph; severity is a text chip; stages are named in lane labels, column titles, chips and every block's accessible name.
- **Native semantics:** real `<button>`, `<a>`, `<nav aria-label>`, `<main>`, one `<h1>` per screen, `role="radiogroup"/"radio"` for day and view controls, `role="switch"` for reminders, `role="progressbar"` with values, `aria-expanded` on alert cards, `aria-current` via NavLink, `role="dialog"` with names on every sheet.
- **Touch targets are a designed system:** four documented invisible-hit-area helpers keep 36px, 40px, 28px and 18px visuals at 44px, and narrow grid blocks get extra hit area automatically.
- **Accessible names are rich:** grid blocks announce "artist, time, stage"; hearts announce "Favorite artist, time, place".
- **Destructive actions are double-confirmed** in plain language.
- **The palette was contrast-engineered:** base text pairs measure 5.5:1 to 12:1 in both themes; every failure above is a specific use site that drifted from the tokens.
- **A regression gate exists** (`npm run e2e:a11y`, axe across 7 routes × 2 themes) and is documented in `docs/COMPLIANCE.md`.

## Gap in the test gate

`e2e/a11y.spec.ts` seeds `lineupView: "list"`, so the lineup grid has never been scanned by the gate, and the schedule calendar failures were being reported but the run was not blocking anything. Recommended: add grid-view cases and the four sheets to the gate, and make it part of CI once the contrast fixes land so it stays green.

## Suggested order of work (not applied)

1. Contrast on stage blocks and the denied-notification message (items 1–4): token-level changes, no layout impact.
2. Focus trap in `Sheet` and a global `:focus-visible` rule (items 9–10).
3. `document.title` per screen, persistent live region, badge counts in tab names (items 18–21).
4. `rem` type scale for the native builds (item 22), then re-verify the grid at 200%.
5. Headings for sections, external-link text, `aria-label` on generics (items 13–17).
6. Extend the axe gate to grid view and sheets.

Estimated effort for 1–3: about a day. Item 4 is a broader change and should be tested on device at large text sizes.
