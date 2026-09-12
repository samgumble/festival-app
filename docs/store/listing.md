# Store listing copy — Telluride Blues & Brews

Ready-to-paste copy for App Store Connect and Google Play Console. Every fact below comes from `packages/content/content-2026.json` (`festival`/`stages` blocks) and `docs/PLAN.md`/`docs/HANDOFF.md`. Nothing about breweries, tasting sessions, artists, set times, or v1.1 features (Brews module, map) is promised here — those are not in the v1 app. Unknowns are marked with «guillemets»; do not fill them in with guesses.

Character counts below are computed against the exact text — re-count if you edit.

---

## App name (Apple ≤ 30, Play title ≤ 30)

```
Telluride Blues & Brews
```
23 characters. Locked in `capacitor.config.ts` `appName` (STORE-CHECKLIST §0).

## Subtitle (Apple ≤ 30)

```
Official 2026 Festival Guide
```
28 characters.

## Short description (Play ≤ 80)

```
Official Telluride Blues & Brews Festival companion: lineup, plan, and alerts.
```
78 characters.

## Promotional text (Apple ≤ 170 — editable without a new build)

```
Official companion for the 32nd Telluride Blues & Brews Festival, Sep 18-20, 2026, Telluride Town Park. Browse the lineup, build your plan, catch festival alerts.
```
162 characters. This field can be swapped closer to the festival for something timelier (e.g. gate times, a schedule-change notice) without shipping a new build — see App Store Connect → Version → Promotional Text.

## Full description (shared text — Apple ≤ 4000, Play ≤ 4000; kept ≤ 3000 here per instruction, plain text, no emoji)

```
The official companion app for the 32nd Telluride Blues & Brews Festival, September 18-20, 2026, at Telluride Town Park in Telluride, Colorado.

Now shows what is happening at the festival right now: which stage is live, what is next, and any alerts from the festival organizer.

Lineup is the full official schedule across all four stages (Main Stage, Blues Stage, Truck Stage, and Campground Sessions), organized by day. Search by artist, switch between a list view and a stage-by-stage timeline grid, and tap any set for details.

Plan lets you favorite the sets you do not want to miss. The app builds your personal festival schedule automatically, flags time conflicts between stages, and helps you decide what to see next. Turn on set reminders and your phone notifies you before each favorited set starts, using on-device local notifications.

Alerts is where updates from SBG Productions, the festival's producer, appear inside the app.

Info covers festival essentials: dates, gate times, venue, altitude, official links, and notification and appearance settings.

The app is built to work at the festival grounds: the full lineup, your plan, and your last-known alerts are all available offline, even with no signal in Town Park.

There are no accounts and no sign-in. There is no analytics and no advertising. Your favorites, plan, and settings stay on your device. Official Telluride Blues & Brews Festival artwork appears with the permission of SBG Productions.
```
1474 characters. Paste as-is into both Apple's Description field and Play's Full description field.

## Keywords (Apple ≤ 100, comma-separated, no spaces after commas, no duplicates of the app name)

```
festival,lineup,schedule,music,concert,colorado,mountaintown,liveevent,artists,setlist,plan,alerts
```
98 characters. "Telluride," "Blues," and "Brews" are deliberately omitted — Apple already indexes the app name and subtitle for search, so repeating those words here wastes the 100-character budget (standard ASO practice, not a store rule). Re-check this list once real usage data exists — Apple lets keywords change every version.

## Category

**Apple**: primary **Music**, secondary **Entertainment** — as chosen in `docs/PLAN.md` §8 and `docs/STORE-CHECKLIST.md` §4 (the earlier draft had these inverted; reconciled 2026-09-11).

**Play**: recommend **Events** over **Music & Audio**.
Reason: the app has no music playback, streaming, or audio content — it is a schedule/plan/alert companion for one real-world event. Play's "Music & Audio" category skews toward listening apps and could mismatch user expectations and Play's own store algorithms; "Events" matches the app's actual function (and pairs with the Apple "Entertainment" primary choice above). This is a recommendation, not a decision — tick the STORE-CHECKLIST row once Sam/SBG confirms.

## Age rating

**Apple age rating questionnaire** — answer every question **None** except:
- **Alcohol, Tobacco, or Drug Use or References** → **Infrequent/Mild**.
  Reason: the festival's own name includes "Brews," and the app's real content (alerts, official links) can reference tasting sessions and the beer garden as part of the festival's real identity, even though the in-app Brews module itself is v1.1 (not yet built). Apple's own guidance is to disclose based on the festival being depicted/referenced, not only on-screen imagery.
- Every other question (violence, horror, mature themes, gambling, medical, unrestricted web access, user-generated content, contests, in-app purchases) → **None** / **No**, and truthfully so: the app opens official links in the system browser only, has no chat/UGC/purchases.
- Expect the computed overall tier to land at **9+ or 13+** (per Apple's four-tier system: 4+/9+/13+/16+/18+), not 4+. Do not answer "None" to the alcohol question to force a 4+ result — see D-015 in `docs/DECISIONS.md`.

**Play IARC content rating questionnaire** — answer the alcohol-reference question **Yes** (references to alcohol, not depiction of use), same reasoning as above; answer every other question truthfully as **No**/**None**. Expect a Teen-range PEGI 12–16 result, not "Everyone."

## Copyright

```
© 2026 SBG Productions
```

## What's New (version 1.0.0)

```
Welcome to the official Telluride Blues & Brews Festival companion app. Browse the full 2026 lineup, build your personal plan with conflict detection, turn on set reminders, and get alerts from the festival organizer — all working offline at Town Park.
```

## URLs

| Field | Value |
|---|---|
| Marketing URL | `https://www.tellurideblues.com` |
| Support email | «support email» — not decided (STORE-CHECKLIST §0) |
| Support URL | «support URL» — not decided (STORE-CHECKLIST §0) |
| Privacy policy URL | `https://samgumble.github.io/festival-app/privacy` (live, served by the app itself; move to a tellurideblues.com URL later if SBG prefers — the in-app page is the source of truth, D-025) |

## SKU / bundle (reference only, already locked)

Bundle ID `com.sbgproductions.bluesandbrews` (STORE-CHECKLIST §0). Suggested App Store Connect SKU: `bb-2026` (per PLAN §8/STORE-CHECKLIST §4 — not yet created).
