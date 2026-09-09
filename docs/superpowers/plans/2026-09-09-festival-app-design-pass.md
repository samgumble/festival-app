# Festival App — Local Design Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A runnable local build of the Telluride Blues & Brews fan app — design system, tab shell, and all five screens (Now · Lineup · Plan · Alerts · Info) at rough fidelity on the real 2026 lineup, with a pure, unit-tested domain layer and no backend.

**Architecture:** npm-workspaces monorepo with `apps/festival` (Vite + React 19 + TypeScript strict + Tailwind v4 + `motion` + React Router 7 + Zustand), `packages/shared` (Zod schema + inferred types + token source), and `packages/content` (verified 2026 JSON + a validating build script that emits `bundled.json`). Screens read content through a `ContentRepository` interface (bundled-only today; Firestore later, no screen changes). All schedule math is pure TypeScript in `apps/festival/src/domain` using `Intl.DateTimeFormat` in `America/Denver`.

**Tech Stack:** Node 26 (native `.ts` type stripping for scripts), npm 11 workspaces, Vite 8.2.2, React 19.3.0, react-router 7.18.3, zustand 5.0.15, zod 4.6.0, motion 13.2.0, tailwindcss 4.3.3 + @tailwindcss/vite 4.3.3, TypeScript 5.9.3, Vitest 4.1.11 + jsdom 30 + @testing-library/react 16.3.3, @playwright/test 1.63.0 (screenshots only).

**Spec:** `docs/superpowers/specs/2026-09-09-festival-app-design-pass-design.md`. Approved mockups: `.superpowers/brainstorm/*/content/design-system.html` and `screens.html` (git-ignored, open in a browser for reference).

## Global Constraints

- Never commit `*.psd`, `google-services.json`, `GoogleService-Info.plist`, `*.p8`, `*.p12`, `*.keystore`, `*.jks`, `.env*`.
- Never invent festival content. Artists, sets, stages, links come only from `packages/content/content-2026.json` (migrated from the Sep 8 verified data) or the official poster. No bios, no photos, no made-up URLs.
- No analytics, ads, or tracking SDKs. No remote fonts at runtime — fonts are bundled OFL files under `apps/festival/public/fonts/`.
- All schedule time math goes through `apps/festival/src/domain/time.ts` in `America/Denver`. Never `new Date("Friday 4:30 PM")`-style wall-clock parsing; ISO-8601-with-offset strings only.
- Dependencies only from the approved list (`docs/HANDOFF.md §6`) plus the test tooling named above; exact versions pinned.
- Palette (locked, D-016): paper `#EBD5B3`, paper-light `#F5E7CC`, paper-deep `#D8C09A`, ink `#1E1A1A`, ink-soft `#4A403C`, night `#1A4A80`, night-deep `#0A3070`, night-ink `#071F4A`, sky `#1890A8`, sky-light `#7CC4D6`, plum `#78307A`, violet `#7A64A8`, pine `#1E7A22`, leaf `#3CA81E`, sun `#F0C41C`, sun-hot `#F09A1C`, amber `#D1973D`, ember `#D4452F`, bloom `#E0508F`.
- Stage colors: Main = sky, Blues = plum, Truck = pine, Campground Sessions = violet. Sun/sun-hot never carry white text. Color is never the only signal.
- Type: Bungee (display, ≥ 17 px only for headliner rows, otherwise ≥ 20), Bungee Shade (countdown numerals + day headers only), Michroma (eyebrows/chips, caps, tracked), DM Sans (everything else; tabular numerals for times).
- Every animation has a `prefers-reduced-motion` path. Touch targets ≥ 44 px (48 preferred).
- Official lockups (`2026-poster-logo-png.png`, `2026-Dates-Center.png`, `SBG-logo-png.png`) are used as images, unmodified.
- Conventional commits, small and atomic. `main` must stay green. Do **not** `git push` — `origin` still points at the old prototype repo.
- Relative imports inside `packages/*` carry the `.ts` extension (Node's type stripping needs them). App code under `apps/festival/src` may omit extensions (Vite resolves them).

---

## File structure (what exists when this plan is done)

```
package.json                         workspaces root; scripts: dev, test, typecheck, content:build, screenshots
tsconfig.base.json                   strict shared compiler options
CLAUDE.md                            moved from docs/ (repo rules)
packages/shared/
  package.json                       @bb/shared
  tsconfig.json
  src/index.ts                       re-exports
  src/schema.ts                      Zod schemas + inferred types
  src/schema.test.ts
  src/tokens.ts                      palette + stage-color map as TS constants (single source for app + future admin)
packages/content/
  package.json                       @bb/content
  content-2026.json                  verified content (migrated)
  scripts/build.ts                   validate + emit bundled.json
apps/festival/
  package.json  vite.config.ts  tsconfig.json  index.html  playwright.config.ts
  public/fonts/{bungee,bungee-shade,michroma,dm-sans}/   TTFs + OFL.txt
  public/art/                        poster crops (sky.png, mountains.png, foreground.png) + lockups
  src/main.tsx                       mounts <App/>
  src/app/App.tsx                    RouterProvider + theme + dev clock
  src/app/router.tsx                 routes
  src/app/TabShell.tsx               layout with <Outlet/>, safe areas
  src/app/TabBar.tsx  src/app/icons.tsx
  src/app/theme.ts                   data-theme sync
  src/app/clock.ts                   useFestivalClock
  src/app/DevClock.tsx               dev-only clock pill
  src/design/tokens.css              Tailwind @theme + semantic vars + grain
  src/design/fonts.css               @font-face
  src/design/motion.ts               springs, durations, useMotionOk
  src/design/{Button,Card,Chip,Eyebrow,SegmentedControl,Heart,Badge,Toggle,ProgressBar,Sheet}.tsx
  src/design/ornaments/{CheckerRibbon,RainbowArch,SunRays,Columbine,Mountains,Butterfly}.tsx
  src/design/Gallery.tsx             /design route (dev)
  src/data/bundled.json              generated by content:build (committed)
  src/data/alerts.fixture.json
  src/data/content.ts                ContentRepository + bundled source + useContent + useContentIndex
  src/data/alerts.ts                 AlertsRepository + fixture source + useAlerts
  src/state/{plan,alerts,ui}.ts      Zustand persisted stores
  src/domain/{time,schedule,conflicts,ics}.ts (+ .test.ts each)
  src/features/now/NowScreen.tsx (+ Hero.tsx, states)
  src/features/lineup/{LineupScreen,LineupList,LineupGrid,ArtistSheet}.tsx
  src/features/plan/{PlanScreen,PlanTimeline,PlanSettings}.tsx
  src/features/alerts/AlertsScreen.tsx
  src/features/info/InfoScreen.tsx
  src/test/setup.ts  src/test/render.tsx
  e2e/screenshots.spec.ts
docs/screens/design-pass/            screenshots (committed)
```

---

### Task 1: Monorepo scaffold and a running Vite app

**Files:**
- Create: `package.json`, `tsconfig.base.json`, `.npmrc`
- Create: `packages/shared/package.json`, `packages/shared/tsconfig.json`, `packages/shared/src/index.ts`
- Create: `packages/content/package.json`
- Create: `apps/festival/package.json`, `apps/festival/tsconfig.json`, `apps/festival/vite.config.ts`, `apps/festival/index.html`, `apps/festival/src/main.tsx`, `apps/festival/src/app/App.tsx`, `apps/festival/src/vite-env.d.ts`, `apps/festival/src/test/setup.ts`
- Move: `docs/CLAUDE.md` → `CLAUDE.md`
- Modify: `.gitignore`

**Interfaces:**
- Produces: workspace names `@bb/shared`, `@bb/content`, `@bb/festival`; root scripts `npm run dev`, `npm test`, `npm run typecheck`; alias `@/` → `apps/festival/src`.

- [ ] **Step 1: Root package.json, tsconfig, npmrc**

`package.json`:
```json
{
  "name": "bb-festival",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "engines": { "node": ">=22.18" },
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "npm run dev -w @bb/festival",
    "build": "npm run content:build && npm run build -w @bb/festival",
    "content:build": "node packages/content/scripts/build.ts",
    "test": "npm run content:build && npm run test --workspaces --if-present",
    "typecheck": "npm run typecheck --workspaces --if-present",
    "screenshots": "npm run screenshots -w @bb/festival"
  }
}
```

`tsconfig.base.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "verbatimModuleSyntax": true,
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "noEmit": true,
    "jsx": "react-jsx"
  }
}
```

`.npmrc`:
```
save-exact=true
```

- [ ] **Step 2: packages/shared skeleton**

`packages/shared/package.json`:
```json
{
  "name": "@bb/shared",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": { ".": "./src/index.ts" },
  "scripts": {
    "test": "vitest run",
    "typecheck": "tsc -p tsconfig.json"
  },
  "dependencies": { "zod": "4.6.0" },
  "devDependencies": { "typescript": "5.9.3", "vitest": "4.1.11" }
}
```

`packages/shared/tsconfig.json`:
```json
{ "extends": "../../tsconfig.base.json", "include": ["src"] }
```

`packages/shared/src/index.ts`:
```ts
export const SHARED_OK = true;
```

- [ ] **Step 3: packages/content skeleton**

`packages/content/package.json`:
```json
{
  "name": "@bb/content",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "dependencies": { "@bb/shared": "*", "zod": "4.6.0" }
}
```

- [ ] **Step 4: apps/festival**

`apps/festival/package.json`:
```json
{
  "name": "@bb/festival",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --host --port 5173",
    "build": "tsc -p tsconfig.json && vite build",
    "preview": "vite preview --port 5173",
    "test": "vitest run",
    "typecheck": "tsc -p tsconfig.json",
    "screenshots": "playwright test"
  },
  "dependencies": {
    "@bb/shared": "*",
    "motion": "13.2.0",
    "react": "19.3.0",
    "react-dom": "19.3.0",
    "react-router": "7.18.3",
    "zod": "4.6.0",
    "zustand": "5.0.15"
  },
  "devDependencies": {
    "@playwright/test": "1.63.0",
    "@tailwindcss/vite": "4.3.3",
    "@testing-library/jest-dom": "7.0.1",
    "@testing-library/react": "16.3.3",
    "@types/react": "19.3.0",
    "@types/react-dom": "19.3.0",
    "@vitejs/plugin-react": "6.1.1",
    "jsdom": "30.0.1",
    "tailwindcss": "4.3.3",
    "typescript": "5.9.3",
    "vite": "8.2.2",
    "vitest": "4.1.11"
  }
}
```

`apps/festival/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "types": ["vite/client", "@testing-library/jest-dom"],
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src", "e2e", "vite.config.ts", "playwright.config.ts"]
}
```

`apps/festival/vite.config.ts`:
```ts
/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
  base: process.env.BASE_PATH ?? "/",
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    css: false,
  },
});
```

`apps/festival/index.html`:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="theme-color" content="#EBD5B3" media="(prefers-color-scheme: light)" />
    <meta name="theme-color" content="#0A3070" media="(prefers-color-scheme: dark)" />
    <title>Telluride Blues &amp; Brews</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`apps/festival/src/vite-env.d.ts`:
```ts
/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_FESTIVAL_NOW?: string;
}
```

`apps/festival/src/main.tsx`:
```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

`apps/festival/src/app/App.tsx` (placeholder until Task 12):
```tsx
import { SHARED_OK } from "@bb/shared";

export function App() {
  return <h1>Blues &amp; Brews scaffold {SHARED_OK ? "✓" : "✗"}</h1>;
}
```

`apps/festival/src/test/setup.ts`:
```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 5: Move CLAUDE.md, extend .gitignore**

```bash
git mv docs/CLAUDE.md CLAUDE.md
```
Append to `.gitignore`:
```
# build + tool output
apps/festival/dist/
apps/festival/test-results/
apps/festival/playwright-report/
```

- [ ] **Step 6: Install and verify**

Run: `npm install`
Expected: completes without peer-dependency errors; `node_modules/@bb/shared` is a symlink to `packages/shared`.

Run: `npm run typecheck`
Expected: both workspaces pass with no errors.

Run: `npm run dev` then open `http://localhost:5173`
Expected: the page shows "Blues & Brews scaffold ✓". Stop the server.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold npm-workspaces monorepo (festival app, shared, content)"
```

---

### Task 2: Shared schema and tokens (`@bb/shared`)

**Files:**
- Create: `packages/shared/src/schema.ts`, `packages/shared/src/schema.test.ts`, `packages/shared/src/tokens.ts`
- Modify: `packages/shared/src/index.ts`

**Interfaces:**
- Produces: Zod schemas `Festival`, `Stage`, `Artist`, `FestivalSet`, `Content`, `Alert`, enums `DayId`, `Tier`, `StageColor`, `Severity`; inferred types of the same names (`type Content = z.infer<typeof Content>` etc.); `PALETTE` record and `STAGE_COLOR_HEX`.

- [ ] **Step 1: Write the failing schema tests**

`packages/shared/src/schema.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { Content, FestivalSet, Alert } from "./schema.ts";

const festival = {
  year: 2026,
  name: "Telluride Blues & Brews Festival",
  edition: "32nd Annual",
  venue: "Telluride Town Park",
  city: "Telluride, Colorado",
  altitudeFt: 8750,
  timezone: "America/Denver",
  days: [
    { id: "fri", date: "2026-09-18", label: "Friday", gatesOpen: "11:30" },
    { id: "sat", date: "2026-09-19", label: "Saturday", gatesOpen: "11:30" },
    { id: "sun", date: "2026-09-20", label: "Sunday", gatesOpen: "11:30" },
  ],
  links: {
    site: "https://www.tellurideblues.com",
    lineup: "https://www.tellurideblues.com/lineup",
    schedule: "https://www.tellurideblues.com/schedule",
    faq: "https://www.tellurideblues.com/faqs",
    guide: "https://www.tellurideblues.com/news/the-official-telluride-blues-brews-festival-guide",
  },
};

const base = {
  meta: {
    contentVersion: "2026.09.09.1",
    publishedAt: "2026-09-09T12:00:00-06:00",
    publishedBy: "seed",
    sources: ["https://www.tellurideblues.com/schedule"],
  },
  festival,
  stages: [{ id: "main", name: "Main Stage", shortName: "Main", color: "sky", sortOrder: 1 }],
  artists: [{ id: "eggy", name: "Eggy", tier: "lineup" }],
  sets: [
    {
      id: "fri-eggy",
      artistId: "eggy",
      stageId: "main",
      dayId: "fri",
      start: "2026-09-18T15:00:00-06:00",
      end: "2026-09-18T16:00:00-06:00",
    },
  ],
};

describe("Content schema", () => {
  it("accepts a valid document", () => {
    expect(Content.safeParse(base).success).toBe(true);
  });

  it("rejects a set whose end is not after its start", () => {
    const bad = { ...base, sets: [{ ...base.sets[0], end: "2026-09-18T15:00:00-06:00" }] };
    const r = Content.safeParse(bad);
    expect(r.success).toBe(false);
  });

  it("rejects a set that references an unknown stage", () => {
    const bad = { ...base, sets: [{ ...base.sets[0], stageId: "moon" }] };
    const r = Content.safeParse(bad);
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toContain("unknown stageId");
  });

  it("rejects a set that references an unknown artist", () => {
    const bad = { ...base, sets: [{ ...base.sets[0], artistId: "nobody" }] };
    expect(Content.safeParse(bad).success).toBe(false);
  });

  it("rejects a set on a day the festival does not have", () => {
    const bad = { ...base, sets: [{ ...base.sets[0], dayId: "mon" }] };
    expect(Content.safeParse(bad).success).toBe(false);
  });

  it("rejects duplicate ids", () => {
    const bad = { ...base, artists: [base.artists[0], base.artists[0]] };
    expect(Content.safeParse(bad).success).toBe(false);
  });

  it("requires ISO timestamps with an explicit offset", () => {
    expect(FestivalSet.safeParse({ ...base.sets[0], start: "2026-09-18T15:00:00Z" }).success).toBe(false);
    expect(FestivalSet.safeParse({ ...base.sets[0], start: "2026-09-18 3:00 PM" }).success).toBe(false);
  });
});

describe("Alert schema", () => {
  it("caps title at 60 and body at 240 characters", () => {
    const ok = {
      id: "a1", title: "Gates open", body: "Welcome.", severity: "info",
      publishedAt: "2026-09-18T11:30:00-06:00", publishedBy: "sbg", push: false,
    };
    expect(Alert.safeParse(ok).success).toBe(true);
    expect(Alert.safeParse({ ...ok, title: "x".repeat(61) }).success).toBe(false);
    expect(Alert.safeParse({ ...ok, body: "x".repeat(241) }).success).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -w @bb/shared`
Expected: FAIL — `Cannot find module './schema.ts'`.

- [ ] **Step 3: Implement the schema**

`packages/shared/src/schema.ts`:
```ts
import { z } from "zod";

// ISO 8601 with an explicit numeric offset, e.g. 2026-09-18T12:00:00-06:00.
// "Z" and bare wall-clock strings are rejected on purpose (PLAN §3.6).
export const IsoWithOffset = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/, "ISO 8601 with explicit offset");

export const DayId = z.enum(["fri", "sat", "sun"]);
export const Tier = z.enum(["headliner", "featured", "lineup", "comedy", "musicmaker"]);
export const StageColor = z.enum(["sky", "plum", "pine", "violet"]);
export const Severity = z.enum(["info", "important", "urgent"]);

export const FestivalDay = z.object({
  id: DayId,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  label: z.string().min(1),
  gatesOpen: z.string().regex(/^\d{2}:\d{2}$/),
});

export const Festival = z.object({
  year: z.number().int(),
  name: z.string().min(1),
  edition: z.string().min(1),
  venue: z.string().min(1),
  city: z.string().min(1),
  altitudeFt: z.number().int(),
  timezone: z.literal("America/Denver"),
  days: z.array(FestivalDay).min(1),
  links: z.object({
    site: z.url(),
    lineup: z.url(),
    schedule: z.url(),
    faq: z.url(),
    guide: z.url(),
    tickets: z.url().optional(),
  }),
  announcement: z
    .object({ text: z.string().min(1).max(160), url: z.url().optional(), active: z.boolean() })
    .optional(),
});

export const Stage = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  shortName: z.string().min(1),
  color: StageColor,
  sortOrder: z.number().int(),
});

export const Artist = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  tier: Tier,
  blurb: z.string().optional(),
  links: z.object({ site: z.url().optional(), spotify: z.url().optional(), apple: z.url().optional() }).optional(),
  imageId: z.string().optional(),
});

export const FestivalSet = z
  .object({
    id: z.string().min(1),
    artistId: z.string().min(1),
    stageId: z.string().min(1),
    dayId: DayId,
    start: IsoWithOffset,
    end: IsoWithOffset,
    note: z.string().optional(),
  })
  .refine((s) => Date.parse(s.end) > Date.parse(s.start), { message: "end must be after start", path: ["end"] });

export const ContentMeta = z.object({
  contentVersion: z.string().min(1),
  publishedAt: IsoWithOffset,
  publishedBy: z.string().min(1),
  sources: z.array(z.url()),
});

function assertUnique(ctx: z.RefinementCtx, ids: string[], label: string) {
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) ctx.addIssue({ code: "custom", message: `duplicate ${label} id "${id}"` });
    seen.add(id);
  }
}

export const Content = z
  .object({
    meta: ContentMeta,
    festival: Festival,
    stages: z.array(Stage).min(1),
    artists: z.array(Artist).min(1),
    sets: z.array(FestivalSet),
  })
  .superRefine((c, ctx) => {
    assertUnique(ctx, c.stages.map((s) => s.id), "stage");
    assertUnique(ctx, c.artists.map((a) => a.id), "artist");
    assertUnique(ctx, c.sets.map((s) => s.id), "set");
    const stageIds = new Set(c.stages.map((s) => s.id));
    const artistIds = new Set(c.artists.map((a) => a.id));
    const dayIds = new Set(c.festival.days.map((d) => d.id));
    c.sets.forEach((s, i) => {
      if (!stageIds.has(s.stageId)) ctx.addIssue({ code: "custom", path: ["sets", i, "stageId"], message: `unknown stageId "${s.stageId}"` });
      if (!artistIds.has(s.artistId)) ctx.addIssue({ code: "custom", path: ["sets", i, "artistId"], message: `unknown artistId "${s.artistId}"` });
      if (!dayIds.has(s.dayId)) ctx.addIssue({ code: "custom", path: ["sets", i, "dayId"], message: `unknown dayId "${s.dayId}"` });
    });
  });

export const Alert = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(60),
  body: z.string().min(1).max(240),
  severity: Severity,
  url: z.url().optional(),
  publishedAt: IsoWithOffset,
  publishedBy: z.string().min(1),
  expiresAt: IsoWithOffset.optional(),
  push: z.boolean(),
  pushSentAt: IsoWithOffset.optional(),
  pushMessageId: z.string().optional(),
});

export type DayId = z.infer<typeof DayId>;
export type Tier = z.infer<typeof Tier>;
export type StageColor = z.infer<typeof StageColor>;
export type Severity = z.infer<typeof Severity>;
export type FestivalDay = z.infer<typeof FestivalDay>;
export type Festival = z.infer<typeof Festival>;
export type Stage = z.infer<typeof Stage>;
export type Artist = z.infer<typeof Artist>;
export type FestivalSet = z.infer<typeof FestivalSet>;
export type Content = z.infer<typeof Content>;
export type Alert = z.infer<typeof Alert>;
```

`packages/shared/src/tokens.ts`:
```ts
import type { StageColor } from "./schema.ts";

/** Locked palette (DECISIONS D-016). Single source for app, admin, and generated CSS. */
export const PALETTE = {
  paper: "#EBD5B3",
  "paper-light": "#F5E7CC",
  "paper-deep": "#D8C09A",
  ink: "#1E1A1A",
  "ink-soft": "#4A403C",
  night: "#1A4A80",
  "night-deep": "#0A3070",
  "night-ink": "#071F4A",
  sky: "#1890A8",
  "sky-light": "#7CC4D6",
  plum: "#78307A",
  violet: "#7A64A8",
  pine: "#1E7A22",
  leaf: "#3CA81E",
  sun: "#F0C41C",
  "sun-hot": "#F09A1C",
  amber: "#D1973D",
  ember: "#D4452F",
  bloom: "#E0508F",
} as const;

export type PaletteName = keyof typeof PALETTE;

export const STAGE_COLOR_HEX: Record<StageColor, string> = {
  sky: PALETTE.sky,
  plum: PALETTE.plum,
  pine: PALETTE.pine,
  violet: PALETTE.violet,
};
```

`packages/shared/src/index.ts`:
```ts
export * from "./schema.ts";
export * from "./tokens.ts";
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -w @bb/shared`
Expected: 8 tests pass.

Run: `npm run typecheck -w @bb/shared`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add packages/shared
git commit -m "feat(shared): zod content/alert schemas with cross-reference checks; locked palette tokens"
```

---

### Task 3: Content package — migrate verified 2026 data and emit `bundled.json`

**Files:**
- Create: `packages/content/content-2026.json` (generated once by the migration below, then hand-checked and committed)
- Create: `packages/content/scripts/build.ts`
- Create: `apps/festival/src/data/bundled.json` (generated by `content:build`, committed)
- Modify: `apps/festival/src/app/App.tsx` (temporary proof it loads)

**Interfaces:**
- Consumes: `Content` schema from `@bb/shared`.
- Produces: `apps/festival/src/data/bundled.json` conforming to `Content`; ids: days `fri|sat|sun`; stages `main|blues|truck|camp`; artist ids as in the old data (e.g. `marcus-king-band`, `samantha-fish`); set ids `${dayId}-${artistId}-${stageId}-${HHMM}` (e.g. `sat-charlie-musselwhite-ga20-main-1630`).

- [ ] **Step 1: Run the one-off migration (scratch script, not committed)**

The verified source is the old prototype's `data/content.json` at commit `33906d2`. Write this to `/tmp/migrate.mjs` (or the session scratchpad) and run it — it is deliberately not kept in the repo:

```js
// node /tmp/migrate.mjs < old.json > packages/content/content-2026.json
import { readFileSync } from "node:fs";
const old = JSON.parse(readFileSync(0, "utf8"));

const days = [
  { id: "fri", date: "2026-09-18", label: "Friday", gatesOpen: "11:30" },
  { id: "sat", date: "2026-09-19", label: "Saturday", gatesOpen: "11:30" },
  { id: "sun", date: "2026-09-20", label: "Sunday", gatesOpen: "11:30" },
];
const dayByLabel = Object.fromEntries(days.map((d) => [d.label, d]));

const stages = [
  { id: "main", name: "Main Stage", shortName: "Main", color: "sky", sortOrder: 1 },
  { id: "blues", name: "Blues Stage", shortName: "Blues", color: "plum", sortOrder: 2 },
  { id: "truck", name: "Truck Stage", shortName: "Truck", color: "pine", sortOrder: 3 },
  { id: "camp", name: "Campground Sessions", shortName: "Camp", color: "violet", sortOrder: 4 },
];
const stageByName = Object.fromEntries(stages.map((s) => [s.name, s]));

// From the official poster: "MUSIC MAKER FOUNDATION: Terry "Harmonica" Bean ★ Albert White ★ Little Willie Farmer"
const musicMaker = new Set(["terry-bean", "albert-white", "little-willie-farmer"]);
// From the official poster: "COMEDY: Troy Walker ★ Hannah Jones ★ Baron Vaughn ★ Kiran Deol" (no set times published yet)
const comedy = [
  { id: "troy-walker", name: "Troy Walker" },
  { id: "hannah-jones", name: "Hannah Jones" },
  { id: "baron-vaughn", name: "Baron Vaughn" },
  { id: "kiran-deol", name: "Kiran Deol" },
];

const artists = [
  ...old.artists.map((a) => ({
    id: a.id,
    name: a.name,
    tier: a.tier === "headliner" ? "headliner" : musicMaker.has(a.id) ? "musicmaker" : "lineup",
  })),
  ...comedy.map((c) => ({ ...c, tier: "comedy" })),
];

function iso(date, t) {
  const m = /^(\d{1,2}):(\d{2}) (AM|PM)$/.exec(t);
  if (!m) throw new Error(`bad time ${t}`);
  let h = Number(m[1]) % 12;
  if (m[3] === "PM") h += 12;
  return `${date}T${String(h).padStart(2, "0")}:${m[2]}:00-06:00`;
}

const sets = old.events.map((e) => {
  const day = dayByLabel[e.day];
  const stage = stageByName[e.stage];
  if (!day || !stage) throw new Error(`unmapped ${e.day} / ${e.stage}`);
  const start = iso(day.date, e.start);
  const hhmm = start.slice(11, 16).replace(":", "");
  return { id: `${day.id}-${e.artistId}-${stage.id}-${hhmm}`, artistId: e.artistId, stageId: stage.id, dayId: day.id, start, end: iso(day.date, e.end) };
});

const content = {
  meta: {
    contentVersion: "2026.09.09.1",
    publishedAt: "2026-09-09T12:00:00-06:00",
    publishedBy: "seed",
    sources: old.meta.sources,
  },
  festival: {
    year: 2026,
    name: "Telluride Blues & Brews Festival",
    edition: "32nd Annual",
    venue: "Telluride Town Park",
    city: "Telluride, Colorado",
    altitudeFt: 8750,
    timezone: "America/Denver",
    days,
    links: {
      site: "https://www.tellurideblues.com",
      lineup: "https://www.tellurideblues.com/lineup",
      schedule: "https://www.tellurideblues.com/schedule",
      faq: "https://www.tellurideblues.com/faqs",
      guide: "https://www.tellurideblues.com/news/the-official-telluride-blues-brews-festival-guide",
    },
  },
  stages,
  artists,
  sets,
};
process.stdout.write(JSON.stringify(content, null, 2) + "\n");
```

Run:
```bash
git show 33906d2:data/content.json > /tmp/old-content.json
node /tmp/migrate.mjs < /tmp/old-content.json > packages/content/content-2026.json
node -e 'const c=require("./packages/content/content-2026.json");console.log(c.artists.length,"artists",c.sets.length,"sets",c.stages.length,"stages")'
```
Expected: `34 artists 41 sets 4 stages` (30 verified + 4 comedy).

Spot-check by eye: `sat-charlie-musselwhite-ga20-main-1630` has `start: "2026-09-19T16:30:00-06:00"`, `end: "2026-09-19T17:40:00-06:00"`; `sun-jon-batiste-main-2000` ends `21:30`.

- [ ] **Step 2: Write the build script**

`packages/content/scripts/build.ts`:
```ts
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { Content } from "@bb/shared";

const here = dirname(fileURLToPath(import.meta.url));
const src = resolve(here, "../content-2026.json");
const out = resolve(here, "../../../apps/festival/src/data/bundled.json");

const raw: unknown = JSON.parse(readFileSync(src, "utf8"));
const result = Content.safeParse(raw);
if (!result.success) {
  console.error("content-2026.json is invalid:\n" + z.prettifyError(result.error));
  process.exit(1);
}
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(result.data, null, 2) + "\n");
const c = result.data;
console.log(`bundled.json ← ${c.meta.contentVersion}: ${c.artists.length} artists, ${c.sets.length} sets, ${c.stages.length} stages`);
```

- [ ] **Step 3: Run the build**

Run: `npm run content:build`
Expected: `bundled.json ← 2026.09.09.1: 34 artists, 41 sets, 4 stages` and `apps/festival/src/data/bundled.json` exists.

Prove validation bites: temporarily change one set's `stageId` to `"moon"` in `content-2026.json`, run again.
Expected: exit code 1 with `unknown stageId "moon"`. Revert the change.

- [ ] **Step 4: Prove the app can import it**

Replace `apps/festival/src/app/App.tsx`:
```tsx
import { Content } from "@bb/shared";
import bundled from "@/data/bundled.json";

const content = Content.parse(bundled);

export function App() {
  return (
    <h1>
      {content.festival.name} — {content.artists.length} artists, {content.sets.length} sets
    </h1>
  );
}
```

Run: `npm run typecheck && npm run dev` → open `http://localhost:5173`
Expected: "Telluride Blues & Brews Festival — 34 artists, 41 sets". Stop the server.

- [ ] **Step 5: Commit**

```bash
git add packages/content apps/festival/src/data/bundled.json apps/festival/src/app/App.tsx
git commit -m "feat(content): verified 2026 content package with validating build to bundled.json"
```

---

### Task 4: Design tokens, bundled fonts, paper grain, poster art

**Files:**
- Create: `apps/festival/src/design/tokens.css`, `apps/festival/src/design/fonts.css`
- Create: `apps/festival/public/fonts/{bungee,bungee-shade,michroma,dm-sans}/…` (downloaded)
- Create: `apps/festival/public/art/{sky,mountains-near,foreground,lockup,dates,sbg}.png` (crops + copies)
- Create: `docs/FONT_LICENSES.md`
- Modify: `apps/festival/src/main.tsx` (import CSS), `apps/festival/src/app/App.tsx` (token smoke)

**Interfaces:**
- Produces: Tailwind utilities `bg-paper … bg-bloom`, semantic `bg-bg / bg-surface / bg-surface-2 / text-fg / text-fg-soft / border-hair / text-structure / text-structure-2`, fonts `font-display / font-shade / font-wide / font-sans`, radii `rounded-chip / rounded-ctl / rounded-card / rounded-sheet / rounded-hero`, shadows `shadow-card / shadow-sheet / shadow-sun`, animation classes `animate-rays`, `animate-drift`, and `data-theme="light|dark"` on `<html>`.

- [ ] **Step 1: Download fonts (OFL) and record licenses**

```bash
cd apps/festival/public && mkdir -p fonts/bungee fonts/bungee-shade fonts/michroma fonts/dm-sans
B=https://raw.githubusercontent.com/google/fonts/main/ofl
curl -sL "$B/bungee/Bungee-Regular.ttf" -o fonts/bungee/Bungee-Regular.ttf
curl -sL "$B/bungee/OFL.txt" -o fonts/bungee/OFL.txt
curl -sL "$B/bungeeshade/BungeeShade-Regular.ttf" -o fonts/bungee-shade/BungeeShade-Regular.ttf
curl -sL "$B/bungeeshade/OFL.txt" -o fonts/bungee-shade/OFL.txt
curl -sL "$B/michroma/Michroma-Regular.ttf" -o fonts/michroma/Michroma-Regular.ttf
curl -sL "$B/michroma/OFL.txt" -o fonts/michroma/OFL.txt
curl -sL "$B/dmsans/DMSans%5Bopsz,wght%5D.ttf" -o fonts/dm-sans/DMSans-Variable.ttf
curl -sL "$B/dmsans/DMSans-Italic%5Bopsz,wght%5D.ttf" -o fonts/dm-sans/DMSans-Italic-Variable.ttf
curl -sL "$B/dmsans/OFL.txt" -o fonts/dm-sans/OFL.txt
ls -la fonts/*/ && file fonts/*/*.ttf
cd ../../..
```
Expected: five `.ttf` files reported as "TrueType Font data" (sizes ≈ 119 KB, 305 KB, 64 KB, 240 KB, 285 KB) and four `OFL.txt` (≈ 4.4 KB each).

`docs/FONT_LICENSES.md`:
```markdown
# Font licenses

All fonts bundled in `apps/festival/public/fonts/` are licensed under the SIL Open Font License 1.1. The OFL text ships next to each family and is listed under Info → Licenses in the app.

| Family | Files | Source | License |
|---|---|---|---|
| Bungee | `bungee/Bungee-Regular.ttf` | github.com/google/fonts/tree/main/ofl/bungee | OFL 1.1 (`bungee/OFL.txt`) |
| Bungee Shade | `bungee-shade/BungeeShade-Regular.ttf` | github.com/google/fonts/tree/main/ofl/bungeeshade | OFL 1.1 |
| Michroma | `michroma/Michroma-Regular.ttf` | github.com/google/fonts/tree/main/ofl/michroma | OFL 1.1 |
| DM Sans | `dm-sans/DMSans-Variable.ttf`, `dm-sans/DMSans-Italic-Variable.ttf` | github.com/google/fonts/tree/main/ofl/dmsans | OFL 1.1 |

The poster typefaces (Beastly, Eurostile Extended, Futura PT) are Adobe-licensed and are never bundled; they appear only inside the rasterized official lockups.
```

- [ ] **Step 2: Poster crops and lockups under the ASSET-BRIEF names**

The flattened preview is 1080×1890. Crop three horizontal bands of the arch interior (x 60→1020) so the hero can parallax them; they overlap by ~40 px so nothing shows through. `sips -c <height> <width> --cropOffset <y> <x>`:

```bash
SRC="SBG Content/poster-preview-1080x1890.png"; OUT=apps/festival/public/art; mkdir -p "$OUT"
sips -c 380 960 --cropOffset 380 60 "$SRC" --out "$OUT/sky.png"            # rays, sun, rainbow, butterflies
sips -c 340 960 --cropOffset 700 60 "$SRC" --out "$OUT/mountains-near.png" # peaks, gondola, guitar body
sips -c 320 960 --cropOffset 1000 60 "$SRC" --out "$OUT/foreground.png"    # trees, mug, columbines
cp "SBG Content/2026-poster-logo-png.png" "$OUT/lockup.png"
cp "SBG Content/2026-Dates-Center.png"    "$OUT/dates.png"
cp "SBG Content/SBG-logo-png.png"         "$OUT/sbg.png"
du -ch "$OUT"/*.png | tail -1
```
Expected: three 960-wide crops + three lockups; total under 3 MB. (When true PSD layers arrive, replace `sky.png` / `mountains-near.png` / `foreground.png` with same-named transparent exports — no code change.)

- [ ] **Step 3: fonts.css**

`apps/festival/src/design/fonts.css`:
```css
@font-face { font-family: "Bungee"; src: url("/fonts/bungee/Bungee-Regular.ttf") format("truetype"); font-weight: 400; font-style: normal; font-display: block; }
@font-face { font-family: "Bungee Shade"; src: url("/fonts/bungee-shade/BungeeShade-Regular.ttf") format("truetype"); font-weight: 400; font-style: normal; font-display: block; }
@font-face { font-family: "Michroma"; src: url("/fonts/michroma/Michroma-Regular.ttf") format("truetype"); font-weight: 400; font-style: normal; font-display: block; }
@font-face { font-family: "DM Sans"; src: url("/fonts/dm-sans/DMSans-Variable.ttf") format("truetype"); font-weight: 100 1000; font-style: normal; font-display: block; }
@font-face { font-family: "DM Sans"; src: url("/fonts/dm-sans/DMSans-Italic-Variable.ttf") format("truetype"); font-weight: 100 1000; font-style: italic; font-display: block; }
```

- [ ] **Step 4: tokens.css (Tailwind v4 theme + semantic vars + grain + motion classes)**

`apps/festival/src/design/tokens.css`:
```css
@import "tailwindcss";
@import "./fonts.css";

/* ---------- locked palette (D-016). Keep in sync with packages/shared/src/tokens.ts ---------- */
@theme {
  --color-*: initial;
  --color-paper: #EBD5B3;
  --color-paper-light: #F5E7CC;
  --color-paper-deep: #D8C09A;
  --color-ink: #1E1A1A;
  --color-ink-soft: #4A403C;
  --color-night: #1A4A80;
  --color-night-deep: #0A3070;
  --color-night-ink: #071F4A;
  --color-sky: #1890A8;
  --color-sky-light: #7CC4D6;
  --color-plum: #78307A;
  --color-violet: #7A64A8;
  --color-pine: #1E7A22;
  --color-leaf: #3CA81E;
  --color-sun: #F0C41C;
  --color-sun-hot: #F09A1C;
  --color-amber: #D1973D;
  --color-ember: #D4452F;
  --color-bloom: #E0508F;
  --color-white: #FFFFFF;

  --font-display: "Bungee", "DM Sans", system-ui, sans-serif;
  --font-shade: "Bungee Shade", "Bungee", system-ui, sans-serif;
  --font-wide: "Michroma", "DM Sans", system-ui, sans-serif;
  --font-sans: "DM Sans", system-ui, -apple-system, sans-serif;

  --radius-chip: 999px;
  --radius-ctl: 12px;
  --radius-card: 20px;
  --radius-sheet: 28px;
  --radius-hero: 28px;

  --shadow-card: 0 8px 24px rgba(32, 28, 29, 0.10);
  --shadow-sheet: 0 -12px 40px rgba(23, 58, 101, 0.18);
  --shadow-sun: 0 6px 16px rgba(240, 154, 28, 0.28);

  --animate-rays: rays 120s linear infinite;
  --animate-drift: drift 9s ease-in-out infinite;
  @keyframes rays { to { transform: rotate(360deg); } }
  @keyframes drift {
    0%, 100% { transform: translate(0, 0) rotate(-4deg); }
    50% { transform: translate(6px, -8px) rotate(4deg); }
  }
}

/* ---------- semantic aliases swap per theme; utilities resolve at use site ---------- */
@theme inline {
  --color-bg: var(--bg);
  --color-surface: var(--surface);
  --color-surface-2: var(--surface-2);
  --color-fg: var(--fg);
  --color-fg-soft: var(--fg-soft);
  --color-hair: var(--hair);
  --color-structure: var(--structure);
  --color-structure-2: var(--structure-2);
}

:root, [data-theme="light"] {
  --bg: var(--color-paper);
  --surface: var(--color-paper-light);
  --surface-2: var(--color-paper-deep);
  --fg: var(--color-ink);
  --fg-soft: var(--color-ink-soft);
  --hair: rgba(30, 26, 26, 0.14);
  --structure: var(--color-sky);
  --structure-2: var(--color-night);
  --grain-blend: multiply;
  --grain-opacity: 0.10;
  --checker-a: var(--color-ink);
  --checker-b: var(--color-paper-light);
  color-scheme: light;
}
[data-theme="dark"] {
  --bg: var(--color-night-deep);
  --surface: var(--color-night);
  --surface-2: var(--color-night-ink);
  --fg: var(--color-paper);
  --fg-soft: #CDB99A;
  --hair: rgba(235, 213, 179, 0.16);
  --structure: var(--color-sky-light);
  --structure-2: var(--color-sky);
  --grain-blend: screen;
  --grain-opacity: 0.06;
  --checker-a: var(--color-paper);
  --checker-b: var(--color-night-ink);
  color-scheme: dark;
}

@layer base {
  html { background: var(--bg); color: var(--fg); }
  body {
    margin: 0;
    font-family: var(--font-sans);
    font-size: 17px;
    line-height: 24px;
    -webkit-font-smoothing: antialiased;
    overscroll-behavior-y: none;
  }
  /* paper grain: a tiled noise overlay under the content layer */
  body::before {
    content: "";
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    mix-blend-mode: var(--grain-blend);
    opacity: var(--grain-opacity);
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='256' height='256'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
  }
  #root { position: relative; z-index: 1; min-height: 100dvh; }
  button { font: inherit; color: inherit; }
}

@layer utilities {
  .checker {
    background: repeating-conic-gradient(var(--checker-a) 0 25%, var(--checker-b) 0 50%) 0 0 / 12px 12px;
  }
  .eyebrow {
    font-family: var(--font-wide);
    font-size: 11px;
    line-height: 14px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }
  .micro {
    font-family: var(--font-wide);
    font-size: 9px;
    line-height: 12px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
  .safe-b { padding-bottom: env(safe-area-inset-bottom); }
  .safe-t { padding-top: env(safe-area-inset-top); }
}

@media (prefers-reduced-motion: reduce) {
  .animate-rays, .animate-drift { animation: none !important; }
}
```

- [ ] **Step 5: Wire CSS and smoke it**

`apps/festival/src/main.tsx` — add as the first import:
```tsx
import "./design/tokens.css";
```

Replace `apps/festival/src/app/App.tsx`:
```tsx
export function App() {
  return (
    <main className="p-6 space-y-4">
      <div className="checker h-3" />
      <h1 className="font-display text-[32px] leading-9 text-structure-2">Lineup</h1>
      <p className="font-shade text-[56px] leading-none text-sun tabular-nums">09 : 04</p>
      <p className="eyebrow text-structure">Now playing · Main Stage</p>
      <p>Body copy in DM Sans on paper.</p>
      <div className="rounded-card bg-surface border border-hair shadow-card p-4">Card</div>
      <button className="rounded-ctl bg-sun text-ink font-semibold h-12 px-5 shadow-sun">Remind me</button>
      <button onClick={() => { const h = document.documentElement; h.dataset.theme = h.dataset.theme === "dark" ? "light" : "dark"; }}>toggle theme</button>
    </main>
  );
}
```

Run: `npm run dev` → `http://localhost:5173`
Expected: paper background with visible grain, Bungee title in night blue, Bungee Shade numerals in sun, Michroma eyebrow, checker strip; "toggle theme" flips to night-deep with paper text. Network tab shows fonts loading from `/fonts/…` (no googleapis). Stop the server.

- [ ] **Step 6: Commit**

```bash
git add apps/festival/public apps/festival/src docs/FONT_LICENSES.md
git commit -m "feat(design): locked tokens as tailwind theme, bundled OFL fonts, paper grain, poster crops"
```

---

### Task 5: Ornaments (code-drawn SVG in the poster's language)

**Files:**
- Create: `apps/festival/src/design/ornaments/CheckerRibbon.tsx`, `RainbowArch.tsx`, `SunRays.tsx`, `Columbine.tsx`, `Mountains.tsx`, `Butterfly.tsx`, `index.ts`
- Test: `apps/festival/src/design/ornaments/ornaments.test.tsx`

**Interfaces:**
- Produces: `CheckerRibbon({ className?, rows? })`, `RainbowArch({ className?, width?, height? })` (frames its parent: absolutely positioned SVG with `preserveAspectRatio="none"`), `SunRays({ size?, className?, spinning? })`, `Columbine({ size?, className? })`, `Mountains({ className? })`, `Butterfly({ className?, drifting? })`. All `aria-hidden`.

- [ ] **Step 1: Write the failing test**

`apps/festival/src/design/ornaments/ornaments.test.tsx`:
```tsx
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Butterfly, CheckerRibbon, Columbine, Mountains, RainbowArch, SunRays } from "./index";

describe("ornaments", () => {
  it("render as decorative (aria-hidden) elements", () => {
    const { container } = render(
      <div>
        <CheckerRibbon /><RainbowArch /><SunRays /><Columbine /><Mountains /><Butterfly />
      </div>,
    );
    const nodes = container.querySelectorAll("[aria-hidden='true']");
    expect(nodes.length).toBe(6);
  });

  it("SunRays spins only when asked", () => {
    const { container, rerender } = render(<SunRays />);
    expect(container.querySelector(".animate-rays")).not.toBeNull();
    rerender(<SunRays spinning={false} />);
    expect(container.querySelector(".animate-rays")).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -w @bb/festival`
Expected: FAIL — cannot resolve `./index`.

- [ ] **Step 3: Implement the ornaments**

`apps/festival/src/design/ornaments/CheckerRibbon.tsx`:
```tsx
export function CheckerRibbon({ className = "", rows = 2 }: { className?: string; rows?: 1 | 2 }) {
  return <div aria-hidden="true" className={`checker w-full ${rows === 1 ? "h-1.5" : "h-3"} ${className}`} />;
}
```

`apps/festival/src/design/ornaments/RainbowArch.tsx`:
```tsx
const BANDS = ["#D4452F", "#F09A1C", "#F0C41C", "#3CA81E", "#1890A8"];

/** Five poster bands + a checker inner ring. Fills its positioned parent. */
export function RainbowArch({ className = "" }: { className?: string }) {
  const w = 390, h = 440, r0 = 189, step = 8, sw = 7;
  return (
    <svg aria-hidden="true" className={`absolute inset-0 h-full w-full ${className}`} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs>
        <pattern id="arch-checker" width="10" height="10" patternUnits="userSpaceOnUse">
          <rect width="10" height="10" fill="#F5E7CC" />
          <rect width="5" height="5" fill="#1E1A1A" />
          <rect x="5" y="5" width="5" height="5" fill="#1E1A1A" />
        </pattern>
      </defs>
      <g fill="none" strokeLinecap="round">
        {BANDS.map((color, i) => {
          const inset = 6 + i * step, r = r0 - i * step;
          return <path key={color} d={`M${inset} ${h} V200 A${r} ${r} 0 0 1 ${w - inset} 200 V${h}`} stroke={color} strokeWidth={sw} />;
        })}
        <path d={`M${6 + 5 * step + 1} ${h} V200 A${r0 - 5 * step - 1} ${r0 - 5 * step - 1} 0 0 1 ${w - 6 - 5 * step - 1} 200 V${h}`} stroke="url(#arch-checker)" strokeWidth={8} />
      </g>
    </svg>
  );
}
```

`apps/festival/src/design/ornaments/SunRays.tsx`:
```tsx
const ANGLES = Array.from({ length: 12 }, (_, i) => i * 30);

export function SunRays({ size = 130, className = "", spinning = true }: { size?: number; className?: string; spinning?: boolean }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="-60 -60 120 120" className={className}>
      <g className={spinning ? "animate-rays origin-center" : "origin-center"}>
        <g fill="#F09A1C">{ANGLES.map((a) => <path key={a} d="M0 0L-6 -58L6 -58Z" transform={`rotate(${a})`} />)}</g>
        <g fill="#F0C41C">{ANGLES.map((a) => <path key={a} d="M0 0L-4 -50L4 -50Z" transform={`rotate(${a + 15})`} />)}</g>
      </g>
      <circle r="22" fill="#F0C41C" stroke="#1E1A1A" strokeWidth="2.5" />
    </svg>
  );
}
```

`apps/festival/src/design/ornaments/Columbine.tsx`:
```tsx
export function Columbine({ size = 48, className = "" }: { size?: number; className?: string }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 48 48" className={className}>
      <g fill="#7A64A8" stroke="#1E1A1A" strokeWidth="1.5">
        <ellipse cx="24" cy="11" rx="6" ry="9" /><ellipse cx="24" cy="37" rx="6" ry="9" />
        <ellipse cx="11" cy="24" rx="9" ry="6" /><ellipse cx="37" cy="24" rx="9" ry="6" />
        <ellipse cx="14.5" cy="14.5" rx="5" ry="8" transform="rotate(-45 14.5 14.5)" />
        <ellipse cx="33.5" cy="33.5" rx="5" ry="8" transform="rotate(-45 33.5 33.5)" />
        <ellipse cx="33.5" cy="14.5" rx="5" ry="8" transform="rotate(45 33.5 14.5)" />
        <ellipse cx="14.5" cy="33.5" rx="5" ry="8" transform="rotate(45 14.5 33.5)" />
      </g>
      <g fill="#F5E7CC"><circle cx="24" cy="13" r="2.4" /><circle cx="24" cy="35" r="2.4" /><circle cx="13" cy="24" r="2.4" /><circle cx="35" cy="24" r="2.4" /></g>
      <circle cx="24" cy="24" r="6" fill="#F0C41C" stroke="#1E1A1A" strokeWidth="1.5" />
    </svg>
  );
}
```

`apps/festival/src/design/ornaments/Mountains.tsx`:
```tsx
/** Far (sky) / near (plum) / grass (leaf) silhouettes. Width-fills its container. */
export function Mountains({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={`block w-full ${className}`} viewBox="0 0 220 110" preserveAspectRatio="none">
      <path d="M0 110L40 40L70 75L110 15L150 70L180 45L220 110Z" fill="#1890A8" stroke="#1E1A1A" strokeWidth="2" strokeLinejoin="round" />
      <path d="M96 36L110 15L124 36L116 33L110 40L104 33Z" fill="#F5E7CC" />
      <path d="M30 57L40 40L50 57L44 54L40 60L36 54Z" fill="#F5E7CC" />
      <path d="M0 110L60 60L100 90L140 55L190 90L220 110Z" fill="#78307A" stroke="#1E1A1A" strokeWidth="2" strokeLinejoin="round" />
      <path d="M0 110L30 92L70 105L120 88L170 104L220 110Z" fill="#3CA81E" stroke="#1E1A1A" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}
```

`apps/festival/src/design/ornaments/Butterfly.tsx`:
```tsx
export function Butterfly({ className = "", drifting = true, size = 80 }: { className?: string; drifting?: boolean; size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size * 0.8} viewBox="0 0 80 64" className={`${drifting ? "animate-drift" : ""} ${className}`}>
      <g stroke="#1E1A1A" strokeWidth="1.6" strokeLinejoin="round">
        <path d="M40 32C30 10 8 6 6 22c-2 12 14 16 30 14z" fill="#1A4A80" />
        <path d="M40 32C50 10 72 6 74 22c2 12-14 16-30 14z" fill="#1A4A80" />
        <path d="M40 34C28 42 10 52 14 58c4 6 18-4 26-20z" fill="#78307A" />
        <path d="M40 34C52 42 70 52 66 58c-4 6-18-4-26-20z" fill="#78307A" />
        <ellipse cx="22" cy="24" rx="5" ry="6" fill="#F0C41C" /><ellipse cx="58" cy="24" rx="5" ry="6" fill="#F0C41C" />
        <rect x="37.5" y="18" width="5" height="30" rx="2.5" fill="#1E1A1A" />
        <path d="M39 18l-6-10M41 18l6-10" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
}
```

`apps/festival/src/design/ornaments/index.ts`:
```ts
export { CheckerRibbon } from "./CheckerRibbon";
export { RainbowArch } from "./RainbowArch";
export { SunRays } from "./SunRays";
export { Columbine } from "./Columbine";
export { Mountains } from "./Mountains";
export { Butterfly } from "./Butterfly";
```

- [ ] **Step 4: Run tests**

Run: `npm test -w @bb/festival`
Expected: 2 tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/festival/src/design/ornaments
git commit -m "feat(design): code-drawn poster ornaments (checker, arch, rays, columbine, mountains, butterfly)"
```

---

### Task 6: Primitives and motion presets

**Files:**
- Create: `apps/festival/src/design/motion.ts`, `Button.tsx`, `Card.tsx`, `Chip.tsx`, `Eyebrow.tsx`, `SegmentedControl.tsx`, `Heart.tsx`, `Badge.tsx`, `Toggle.tsx`, `ProgressBar.tsx`, `Sheet.tsx`, `index.ts`
- Test: `apps/festival/src/design/primitives.test.tsx`

**Interfaces:**
- Consumes: ornaments (`Columbine`, `CheckerRibbon`).
- Produces (exact props):
  - `Button({ variant?: "sun"|"ink"|"ghost", size?: "md"|"sm", full?: boolean, ...ButtonHTMLAttributes })`
  - `Card({ className?, padded?: boolean, children, ...HTMLAttributes<HTMLDivElement> })`
  - `Chip({ tone: "sky"|"plum"|"pine"|"violet"|"sun"|"ember"|"paper", children, className? })`
  - `Eyebrow({ tone?: "soft"|"structure"|"plum", children, className? })`
  - `SegmentedControl<T extends string>({ options: { value: T; label: ReactNode }[], value: T, onChange(v: T): void, label: string })`
  - `Heart({ on: boolean, onToggle(): void, label: string })` (button with `aria-pressed`)
  - `Badge({ count: number, tone?: "sun"|"ember" })` (renders nothing when count is 0)
  - `Toggle({ on: boolean, onChange(v: boolean): void, label: string })` (`role="switch"`)
  - `ProgressBar({ value: number /* 0..1 */, label?: string })`
  - `Sheet({ onClose(): void, title?: string, children })` (route-mounted; backdrop click / Escape → onClose)
  - `motion.ts`: `SPRING_TAP`, `SPRING_SHEET`, `DUR`, `useMotionOk()`.

- [ ] **Step 1: Write the failing tests**

`apps/festival/src/design/primitives.test.tsx`:
```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Badge, Button, Heart, SegmentedControl, Sheet, Toggle } from "./index";

describe("Heart", () => {
  it("exposes pressed state and calls onToggle", () => {
    const onToggle = vi.fn();
    render(<Heart on={false} onToggle={onToggle} label="Favorite Eggy, Friday 3:00 PM, Main Stage" />);
    const btn = screen.getByRole("button", { name: /favorite eggy/i });
    expect(btn).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(btn);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});

describe("SegmentedControl", () => {
  it("marks the selected option and reports changes", () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl label="Day" value="sat" onChange={onChange}
        options={[{ value: "fri", label: "Fri" }, { value: "sat", label: "Sat" }, { value: "sun", label: "Sun" }]} />,
    );
    expect(screen.getByRole("radio", { name: "Sat" })).toBeChecked();
    fireEvent.click(screen.getByRole("radio", { name: "Sun" }));
    expect(onChange).toHaveBeenCalledWith("sun");
  });
});

describe("Badge", () => {
  it("renders nothing for zero", () => {
    const { container } = render(<Badge count={0} />);
    expect(container).toBeEmptyDOMElement();
  });
  it("renders the count", () => {
    render(<Badge count={3} />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});

describe("Toggle", () => {
  it("is a switch", () => {
    const onChange = vi.fn();
    render(<Toggle on={true} onChange={onChange} label="Festival alerts" />);
    const sw = screen.getByRole("switch", { name: "Festival alerts" });
    expect(sw).toHaveAttribute("aria-checked", "true");
    fireEvent.click(sw);
    expect(onChange).toHaveBeenCalledWith(false);
  });
});

describe("Sheet", () => {
  it("closes on Escape and backdrop click", () => {
    const onClose = vi.fn();
    render(<Sheet onClose={onClose} title="Artist"><p>body</p></Sheet>);
    expect(screen.getByRole("dialog", { name: "Artist" })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.click(screen.getByTestId("sheet-backdrop"));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});

describe("Button", () => {
  it("renders as a native button with text", () => {
    render(<Button variant="sun">Remind me</Button>);
    expect(screen.getByRole("button", { name: "Remind me" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -w @bb/festival`
Expected: FAIL — cannot resolve `./index`.

- [ ] **Step 3: Implement motion presets and primitives**

`apps/festival/src/design/motion.ts`:
```ts
import { useReducedMotion } from "motion/react";

export const SPRING_TAP = { type: "spring", stiffness: 380, damping: 32 } as const;
export const SPRING_SHEET = { type: "spring", stiffness: 220, damping: 26 } as const;
export const SPRING_BLOOM = { type: "spring", stiffness: 500, damping: 18 } as const;
export const DUR = { control: 0.16, surface: 0.24, route: 0.32 } as const;

/** True when motion is welcome (no reduced-motion preference). */
export function useMotionOk(): boolean {
  return !useReducedMotion();
}
```

`apps/festival/src/design/Button.tsx`:
```tsx
import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "sun" | "ink" | "ghost";
  size?: "md" | "sm";
  full?: boolean;
};

const VARIANT = {
  sun: "bg-gradient-to-b from-sun to-sun-hot text-ink shadow-sun",
  ink: "bg-structure-2 text-bg",
  ghost: "bg-transparent text-structure-2 border-[1.5px] border-hair",
};
const SIZE = { md: "h-12 px-5 text-[16px] rounded-ctl", sm: "h-9 px-3.5 text-[14px] rounded-[10px]" };

export function Button({ variant = "ghost", size = "md", full = false, className = "", type = "button", ...rest }: Props) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 font-semibold leading-6 transition-transform duration-150 active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100 disabled:opacity-50 ${VARIANT[variant]} ${SIZE[size]} ${full ? "w-full" : ""} ${className}`}
      {...rest}
    />
  );
}
```

`apps/festival/src/design/Card.tsx`:
```tsx
import type { HTMLAttributes } from "react";

export function Card({ className = "", padded = true, ...rest }: HTMLAttributes<HTMLDivElement> & { padded?: boolean }) {
  return <div className={`rounded-card bg-surface border border-hair shadow-card ${padded ? "px-4 py-3.5" : ""} ${className}`} {...rest} />;
}
```

`apps/festival/src/design/Chip.tsx`:
```tsx
import type { ReactNode } from "react";

export type ChipTone = "sky" | "plum" | "pine" | "violet" | "sun" | "ember" | "paper";
const TONE: Record<ChipTone, string> = {
  sky: "bg-sky text-white", plum: "bg-plum text-white", pine: "bg-pine text-white", violet: "bg-violet text-white",
  sun: "bg-sun text-ink", ember: "bg-ember text-white", paper: "bg-surface-2 text-fg",
};

export function Chip({ tone, children, className = "" }: { tone: ChipTone; children: ReactNode; className?: string }) {
  return <span className={`micro inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-chip px-2.5 ${TONE[tone]} ${className}`}>{children}</span>;
}
```

`apps/festival/src/design/Eyebrow.tsx`:
```tsx
import type { ReactNode } from "react";

const TONE = { soft: "text-fg-soft", structure: "text-structure", plum: "text-plum" };
export function Eyebrow({ tone = "soft", children, className = "" }: { tone?: keyof typeof TONE; children: ReactNode; className?: string }) {
  return <span className={`eyebrow ${TONE[tone]} ${className}`}>{children}</span>;
}
```

`apps/festival/src/design/SegmentedControl.tsx`:
```tsx
import type { ReactNode } from "react";

export function SegmentedControl<T extends string>({ options, value, onChange, label }: {
  options: { value: T; label: ReactNode }[]; value: T; onChange: (v: T) => void; label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-grid grid-flow-col gap-0.5 rounded-chip bg-surface-2 p-1">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button key={o.value} type="button" role="radio" aria-checked={on} onClick={() => onChange(o.value)}
            className={`h-10 min-w-11 rounded-chip px-4 text-[15px] font-semibold tabular-nums transition-colors duration-150 ${on ? "bg-sky text-white shadow-[0_2px_8px_rgba(24,144,168,.35)]" : "text-fg-soft"}`}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
```

`apps/festival/src/design/Heart.tsx`:
```tsx
import { motion } from "motion/react";
import { Columbine } from "./ornaments";
import { SPRING_BLOOM, useMotionOk } from "./motion";

export function Heart({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  const ok = useMotionOk();
  return (
    <button type="button" aria-pressed={on} aria-label={label} onClick={onToggle}
      className="grid h-12 w-12 shrink-0 place-items-center rounded-chip border border-hair bg-surface">
      <motion.span key={on ? "bloom" : "heart"} className="grid place-items-center"
        initial={ok ? { scale: 0.8 } : false} animate={{ scale: [0.8, 1.15, 1] }} transition={ok ? SPRING_BLOOM : { duration: 0 }}>
        {on ? (
          <Columbine size={26} />
        ) : (
          <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 20.5l-7.4-7.3a4.4 4.4 0 0 1 6.2-6.2l1.2 1.1 1.2-1.1a4.4 4.4 0 0 1 6.2 6.2z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          </svg>
        )}
      </motion.span>
    </button>
  );
}
```

`apps/festival/src/design/Badge.tsx`:
```tsx
export function Badge({ count, tone = "ember" }: { count: number; tone?: "sun" | "ember" }) {
  if (count <= 0) return null;
  return (
    <span className={`absolute -top-1 left-[calc(50%+6px)] min-w-4 rounded-chip px-1 text-center text-[10px] font-bold leading-4 ${tone === "sun" ? "bg-sun text-ink" : "bg-ember text-white"}`}>
      {count > 99 ? "99+" : count}
    </span>
  );
}
```

`apps/festival/src/design/Toggle.tsx`:
```tsx
export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}
      className={`relative h-7 w-12 shrink-0 rounded-chip transition-colors duration-150 ${on ? "bg-pine" : "bg-surface-2"}`}>
      <span className={`absolute top-[3px] h-[22px] w-[22px] rounded-chip bg-white shadow transition-[left] duration-150 motion-reduce:transition-none ${on ? "left-[23px]" : "left-[3px]"}`} />
    </button>
  );
}
```

`apps/festival/src/design/ProgressBar.tsx`:
```tsx
export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} className="h-1.5 overflow-hidden rounded-chip bg-surface-2">
      <div className="h-full bg-gradient-to-r from-sun to-sun-hot" style={{ width: `${pct}%` }} />
    </div>
  );
}
```

`apps/festival/src/design/Sheet.tsx`:
```tsx
import { motion } from "motion/react";
import { useEffect, type ReactNode } from "react";
import { SPRING_SHEET, useMotionOk } from "./motion";

export function Sheet({ onClose, title, children }: { onClose: () => void; title?: string; children: ReactNode }) {
  const ok = useMotionOk();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-40">
      <div data-testid="sheet-backdrop" onClick={onClose} className="absolute inset-0 bg-night-ink/40" />
      <motion.div role="dialog" aria-modal="true" aria-label={title}
        initial={ok ? { y: "100%" } : false} animate={{ y: 0 }} transition={ok ? SPRING_SHEET : { duration: 0 }}
        className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-sheet border border-b-0 border-hair bg-surface px-4 pb-8 pt-2.5 shadow-sheet safe-b">
        <div aria-hidden="true" className="mx-auto mb-3 h-1.5 w-10 rounded-chip bg-hair" />
        {children}
      </motion.div>
    </div>
  );
}
```

`apps/festival/src/design/index.ts`:
```ts
export { Button } from "./Button";
export { Card } from "./Card";
export { Chip, type ChipTone } from "./Chip";
export { Eyebrow } from "./Eyebrow";
export { SegmentedControl } from "./SegmentedControl";
export { Heart } from "./Heart";
export { Badge } from "./Badge";
export { Toggle } from "./Toggle";
export { ProgressBar } from "./ProgressBar";
export { Sheet } from "./Sheet";
export * from "./ornaments";
export * from "./motion";
```

- [ ] **Step 4: Run tests**

Run: `npm test -w @bb/festival`
Expected: all primitive + ornament tests pass (8 total).

Run: `npm run typecheck -w @bb/festival`
Expected: no errors. (If `motion/react` types complain about `initial={false}` unions, wrap as `initial={ok ? { y: "100%" } : undefined}` and add `animate` only — either is acceptable.)

- [ ] **Step 5: Commit**

```bash
git add apps/festival/src/design
git commit -m "feat(design): primitives (button, card, chip, segmented, heart→bloom, badge, toggle, progress, sheet) + motion presets"
```

---

### Task 7: Domain — `time.ts` (Denver clock)

**Files:**
- Create: `apps/festival/src/domain/time.ts`
- Test: `apps/festival/src/domain/time.test.ts`

**Interfaces:**
- Produces: `TZ`, `toDenverParts(d: Date): DenverParts`, `fromDenver(dateKey: string, hhmm: string): Date`, `parseIso(s: string): Date`, `formatTime(d: Date): string` ("4:30 PM"), `formatRange(a: Date, b: Date): string` ("4:30 – 5:40 PM"), `minutesBetween(a: Date, b: Date): number`, `dayIdFor(now: Date, festival: Festival): DayId | null` (4 AM rollover), `festivalNow(override?: string | null): Date`, `norm(s: string): string` (whitespace normalizer used by tests and UI).

- [ ] **Step 1: Write the failing tests**

`apps/festival/src/domain/time.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import type { Festival } from "@bb/shared";
import { dayIdFor, festivalNow, formatRange, formatTime, fromDenver, minutesBetween, norm, parseIso, toDenverParts } from "./time";

const festival = {
  days: [
    { id: "fri", date: "2026-09-18", label: "Friday", gatesOpen: "11:30" },
    { id: "sat", date: "2026-09-19", label: "Saturday", gatesOpen: "11:30" },
    { id: "sun", date: "2026-09-20", label: "Sunday", gatesOpen: "11:30" },
  ],
} as unknown as Festival;

describe("time (America/Denver)", () => {
  it("converts an instant to Denver wall-clock parts regardless of host zone", () => {
    // 2026-09-19T21:40:00Z is 3:40 PM MDT
    const p = toDenverParts(new Date("2026-09-19T21:40:00Z"));
    expect(p).toMatchObject({ year: 2026, month: 9, day: 19, hour: 15, minute: 40, dateKey: "2026-09-19", weekday: "Sat" });
  });

  it("builds an instant from a Denver date + HH:MM (MDT in September)", () => {
    expect(fromDenver("2026-09-18", "11:30").toISOString()).toBe("2026-09-18T17:30:00.000Z");
  });

  it("parses ISO with offset and rejects garbage", () => {
    expect(parseIso("2026-09-19T16:30:00-06:00").toISOString()).toBe("2026-09-19T22:30:00.000Z");
    expect(() => parseIso("Saturday 4:30 PM")).toThrow();
  });

  it("formats times and ranges in Denver", () => {
    const a = parseIso("2026-09-19T16:30:00-06:00");
    const b = parseIso("2026-09-19T17:40:00-06:00");
    expect(norm(formatTime(a))).toBe("4:30 PM");
    expect(norm(formatRange(a, b))).toBe("4:30 – 5:40 PM");
    const c = parseIso("2026-09-19T11:30:00-06:00");
    expect(norm(formatRange(c, a))).toBe("11:30 AM – 4:30 PM");
  });

  it("measures minutes", () => {
    expect(minutesBetween(parseIso("2026-09-19T15:40:00-06:00"), parseIso("2026-09-19T16:30:00-06:00"))).toBe(50);
  });

  it("assigns the festival day with a 4 AM rollover", () => {
    expect(dayIdFor(parseIso("2026-09-19T15:40:00-06:00"), festival)).toBe("sat");
    expect(dayIdFor(parseIso("2026-09-20T01:30:00-06:00"), festival)).toBe("sat"); // 1:30 AM still Saturday night
    expect(dayIdFor(parseIso("2026-09-20T04:00:00-06:00"), festival)).toBe("sun");
    expect(dayIdFor(parseIso("2026-09-17T12:00:00-06:00"), festival)).toBeNull();
  });

  it("festivalNow honors an override", () => {
    expect(festivalNow("2026-09-19T15:40:00-06:00").toISOString()).toBe("2026-09-19T21:40:00.000Z");
    expect(Math.abs(festivalNow(null).getTime() - Date.now())).toBeLessThan(1000);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -w @bb/festival -- time`
Expected: FAIL — cannot resolve `./time`.

- [ ] **Step 3: Implement**

`apps/festival/src/domain/time.ts`:
```ts
import type { DayId, Festival } from "@bb/shared";

export const TZ = "America/Denver";
const HOUR = 3_600_000;

const PARTS = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", weekday: "short",
});
const TIME = new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit" });

export interface DenverParts {
  year: number; month: number; day: number; hour: number; minute: number; weekday: string;
  /** YYYY-MM-DD in Denver */
  dateKey: string;
}

/** Collapse NBSP/NNBSP that Intl inserts before AM/PM so copy and tests compare plainly. */
export function norm(s: string): string {
  return s.replace(/[\u00a0\u202f]/g, " ");
}

export function toDenverParts(d: Date): DenverParts {
  const p: Record<string, string> = {};
  for (const part of PARTS.formatToParts(d)) p[part.type] = part.value;
  const hour = Number(p.hour) % 24; // some ICU builds emit "24" at midnight with h23
  return {
    year: Number(p.year), month: Number(p.month), day: Number(p.day), hour, minute: Number(p.minute),
    weekday: p.weekday ?? "", dateKey: `${p.year}-${p.month}-${p.day}`,
  };
}

/** Instant for a Denver wall-clock time. Correct away from DST transitions (the festival is mid-September). */
export function fromDenver(dateKey: string, hhmm: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number) as [number, number, number];
  const [hh, mm] = hhmm.split(":").map(Number) as [number, number];
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  const p = toDenverParts(new Date(guess));
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
  return new Date(guess - (asUtc - guess));
}

export function parseIso(s: string): Date {
  const t = Date.parse(s);
  if (Number.isNaN(t) || !/^\d{4}-\d{2}-\d{2}T/.test(s)) throw new Error(`Not an ISO timestamp: ${s}`);
  return new Date(t);
}

export function formatTime(d: Date): string {
  return norm(TIME.format(d));
}

export function formatRange(a: Date, b: Date): string {
  const A = formatTime(a), B = formatTime(b);
  const sameMeridiem = A.slice(-2) === B.slice(-2);
  return sameMeridiem ? `${A.slice(0, -3)} – ${B}` : `${A} – ${B}`;
}

export function minutesBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 60_000);
}

/** Festival day for an instant; nights belong to the day before until 4 AM Denver. */
export function dayIdFor(now: Date, festival: Pick<Festival, "days">): DayId | null {
  const key = toDenverParts(new Date(now.getTime() - 4 * HOUR)).dateKey;
  return festival.days.find((d) => d.date === key)?.id ?? null;
}

/** 4 AM Denver on the given date through 4 AM the next day. */
export function dayWindow(dateKey: string): { start: Date; end: Date } {
  const start = fromDenver(dateKey, "04:00");
  return { start, end: new Date(start.getTime() + 24 * HOUR) };
}

export function festivalNow(override?: string | null): Date {
  return override ? parseIso(override) : new Date();
}
```

- [ ] **Step 4: Run tests**

Run: `npm test -w @bb/festival -- time`
Expected: 7 tests pass. Also run once with a different host zone to prove independence: `TZ=America/Chicago npm test -w @bb/festival -- time` → same result.

- [ ] **Step 5: Commit**

```bash
git add apps/festival/src/domain/time.ts apps/festival/src/domain/time.test.ts
git commit -m "feat(domain): Denver time utilities with 4am day rollover"
```

---

### Task 8: Domain — `schedule.ts`

**Files:**
- Create: `apps/festival/src/domain/schedule.ts`
- Test: `apps/festival/src/domain/schedule.test.ts`

**Interfaces:**
- Consumes: `time.ts`.
- Produces: `type FestivalState = "pre" | "live" | "post"`, `festivalState(festival, now)`, `gatesOpenAt(day)`, `setStart(set)`, `setEnd(set)`, `setsForDay(sets, dayId)`, `groupByStage(sets, stages): StageGroup[]`, `nowPlaying(sets, now)`, `upNext(sets, now, limit?)`, `progress(set, now)`, `isEnded(set, now)`, `minutesLeft(set, now)`, `headliners(artists)`, `searchArtists(artists, query)`.

- [ ] **Step 1: Write the failing tests (against the real bundled data)**

`apps/festival/src/domain/schedule.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { Content } from "@bb/shared";
import bundled from "@/data/bundled.json";
import { parseIso } from "./time";
import { festivalState, groupByStage, headliners, isEnded, nowPlaying, progress, searchArtists, setsForDay, upNext } from "./schedule";

const content = Content.parse(bundled);
const SAT_340 = parseIso("2026-09-19T15:40:00-06:00");

describe("festivalState", () => {
  const at = (s: string) => festivalState(content.festival, parseIso(s));
  it("is pre before Friday gates, live from gates, post after 4 AM Monday", () => {
    expect(at("2026-09-17T20:00:00-06:00")).toBe("pre");
    expect(at("2026-09-18T11:29:00-06:00")).toBe("pre");
    expect(at("2026-09-18T11:30:00-06:00")).toBe("live");
    expect(at("2026-09-20T21:31:00-06:00")).toBe("live"); // Sunday night is still the festival
    expect(at("2026-09-21T03:59:00-06:00")).toBe("live");
    expect(at("2026-09-21T04:00:00-06:00")).toBe("post");
  });
});

describe("day + stage grouping", () => {
  it("returns Saturday's sets in chronological order, grouped by stage sortOrder", () => {
    const sat = setsForDay(content.sets, "sat");
    expect(sat.length).toBe(14);
    expect(sat[0]?.id).toBe("sat-j-causeways-main-1200");
    const groups = groupByStage(sat, content.stages);
    expect(groups.map((g) => g.stage.id)).toEqual(["main", "blues", "truck", "camp"]);
    expect(groups[0]?.sets.map((s) => s.artistId)).toEqual([
      "j-causeways", "judith-hill", "nether-hour", "charlie-musselwhite-ga20", "record-company", "taj-mahal-keb-mo",
    ]);
  });
});

describe("now / next at Saturday 3:40 PM", () => {
  const sat = setsForDay(content.sets, "sat");
  it("Nether Hour is on the Main Stage with 20 minutes left", () => {
    const on = nowPlaying(sat, SAT_340);
    expect(on.map((s) => s.artistId)).toEqual(["nether-hour"]);
    expect(progress(on[0]!, SAT_340)).toBeCloseTo(40 / 60, 2);
  });
  it("up next is Nigel Wearne (Truck 4:00) then Musselwhite (Main 4:30), one per stage", () => {
    expect(upNext(sat, SAT_340, 2).map((s) => s.id)).toEqual(["sat-nigel-wearne-truck-1600", "sat-charlie-musselwhite-ga20-main-1630"]);
  });
  it("Kirk Fletcher's 2:30 set has ended", () => {
    const kirk = sat.find((s) => s.id === "sat-kirk-fletcher-blues-1430")!;
    expect(isEnded(kirk, SAT_340)).toBe(true);
  });
});

describe("artists", () => {
  it("lists the three headliners in poster order", () => {
    expect(headliners(content.artists).map((a) => a.id)).toEqual(["marcus-king-band", "taj-mahal-keb-mo", "jon-batiste"]);
  });
  it("search ignores case, punctuation and curly quotes", () => {
    expect(searchArtists(content.artists, "keb mo").map((a) => a.id)).toEqual(["taj-mahal-keb-mo"]);
    expect(searchArtists(content.artists, "HARMONICA").map((a) => a.id)).toEqual(["terry-bean"]);
    expect(searchArtists(content.artists, "").length).toBe(content.artists.length);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -w @bb/festival -- schedule`
Expected: FAIL — cannot resolve `./schedule`.

- [ ] **Step 3: Implement**

`apps/festival/src/domain/schedule.ts`:
```ts
import type { Artist, DayId, Festival, FestivalDay, FestivalSet, Stage } from "@bb/shared";
import { dayWindow, fromDenver, minutesBetween, parseIso } from "./time";

export type FestivalState = "pre" | "live" | "post";

export function gatesOpenAt(day: FestivalDay): Date {
  return fromDenver(day.date, day.gatesOpen);
}

export function festivalState(festival: Pick<Festival, "days">, now: Date): FestivalState {
  const first = festival.days[0];
  const last = festival.days[festival.days.length - 1];
  if (!first || !last) return "post";
  if (now < gatesOpenAt(first)) return "pre";
  return now < dayWindow(last.date).end ? "live" : "post";
}

export const setStart = (s: FestivalSet): Date => parseIso(s.start);
export const setEnd = (s: FestivalSet): Date => parseIso(s.end);

const byStart = (a: FestivalSet, b: FestivalSet) => Date.parse(a.start) - Date.parse(b.start);

export function setsForDay(sets: FestivalSet[], dayId: DayId): FestivalSet[] {
  return sets.filter((s) => s.dayId === dayId).sort(byStart);
}

export interface StageGroup { stage: Stage; sets: FestivalSet[] }

export function groupByStage(sets: FestivalSet[], stages: Stage[]): StageGroup[] {
  return [...stages]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((stage) => ({ stage, sets: sets.filter((s) => s.stageId === stage.id).sort(byStart) }))
    .filter((g) => g.sets.length > 0);
}

export function nowPlaying(sets: FestivalSet[], now: Date): FestivalSet[] {
  const t = now.getTime();
  return sets.filter((s) => Date.parse(s.start) <= t && t < Date.parse(s.end)).sort(byStart);
}

/** Next sets to start, at most one per stage, soonest first. */
export function upNext(sets: FestivalSet[], now: Date, limit = 2): FestivalSet[] {
  const t = now.getTime();
  const taken = new Set<string>();
  const out: FestivalSet[] = [];
  for (const s of [...sets].sort(byStart)) {
    if (Date.parse(s.start) <= t || taken.has(s.stageId)) continue;
    taken.add(s.stageId);
    out.push(s);
    if (out.length >= limit) break;
  }
  return out;
}

export function progress(set: FestivalSet, now: Date): number {
  const a = Date.parse(set.start), b = Date.parse(set.end);
  return Math.max(0, Math.min(1, (now.getTime() - a) / (b - a)));
}

export const isEnded = (set: FestivalSet, now: Date): boolean => now.getTime() >= Date.parse(set.end);
export const minutesLeft = (set: FestivalSet, now: Date): number => minutesBetween(now, setEnd(set));

export function headliners(artists: Artist[]): Artist[] {
  return artists.filter((a) => a.tier === "headliner");
}

const fold = (s: string) =>
  s.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[’'“”".,&-]/g, " ").replace(/\s+/g, " ").trim().toLowerCase();

export function searchArtists(artists: Artist[], query: string): Artist[] {
  const q = fold(query);
  if (!q) return artists;
  return artists.filter((a) => fold(a.name).includes(q));
}
```

- [ ] **Step 4: Run tests**

Run: `npm test -w @bb/festival -- schedule`
Expected: 8 tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/festival/src/domain/schedule.ts apps/festival/src/domain/schedule.test.ts
git commit -m "feat(domain): festival state machine, day/stage grouping, now playing, up next, search"
```

---

### Task 9: Domain — `conflicts.ts`

**Files:**
- Create: `apps/festival/src/domain/conflicts.ts`
- Test: `apps/festival/src/domain/conflicts.test.ts`

**Interfaces:**
- Produces: `interface Conflict { key: string; a: FestivalSet; b: FestivalSet; overlapMinutes: number; bufferOnly: boolean }`, `conflictKey(a, b)`, `detectConflicts(sets, bufferMinutes)`, `keptSet(conflict, resolutions)`, `lostSetIds(conflicts, resolutions): Set<string>`, `nextUp(sets, now, resolutions, bufferMinutes)`, `leaveBy(set, bufferMinutes): Date`.

- [ ] **Step 1: Write the failing tests**

`apps/festival/src/domain/conflicts.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { Content } from "@bb/shared";
import bundled from "@/data/bundled.json";
import { conflictKey, detectConflicts, keptSet, leaveBy, lostSetIds, nextUp } from "./conflicts";
import { parseIso } from "./time";

const content = Content.parse(bundled);
const byId = new Map(content.sets.map((s) => [s.id, s]));
const pick = (...ids: string[]) => ids.map((id) => byId.get(id)!);

const MUSSEL = "sat-charlie-musselwhite-ga20-main-1630"; // 4:30–5:40
const ALBERT = "sat-albert-white-blues-1730";            // 5:30–6:30
const DOVE = "sat-derrick-dove-truck-1740";              // 5:40–6:10
const TAJ = "sat-taj-mahal-keb-mo-main-2000";            // 8:00–9:30

describe("detectConflicts", () => {
  it("finds the real Saturday overlap: Musselwhite vs Albert White, 10 minutes", () => {
    const c = detectConflicts(pick(MUSSEL, ALBERT, TAJ), 0);
    expect(c).toHaveLength(1);
    expect(c[0]).toMatchObject({ key: conflictKey(byId.get(MUSSEL)!, byId.get(ALBERT)!), overlapMinutes: 10, bufferOnly: false });
  });
  it("a buffer turns back-to-back sets on different stages into a buffer-only conflict", () => {
    expect(detectConflicts(pick(MUSSEL, DOVE), 0)).toHaveLength(0); // 5:40 end vs 5:40 start: no overlap
    const c = detectConflicts(pick(MUSSEL, DOVE), 10);
    expect(c).toHaveLength(1);
    expect(c[0]).toMatchObject({ overlapMinutes: 0, bufferOnly: true });
  });
  it("keys are order-independent", () => {
    expect(conflictKey(byId.get(ALBERT)!, byId.get(MUSSEL)!)).toBe(conflictKey(byId.get(MUSSEL)!, byId.get(ALBERT)!));
  });
});

describe("resolution", () => {
  const [c] = detectConflicts(pick(MUSSEL, ALBERT), 0);
  it("defaults to the earlier set, honors an explicit choice, ignores a stale one", () => {
    expect(keptSet(c!, {}).id).toBe(MUSSEL);
    expect(keptSet(c!, { [c!.key]: ALBERT }).id).toBe(ALBERT);
    expect(keptSet(c!, { [c!.key]: "sun-jon-batiste-main-2000" }).id).toBe(MUSSEL);
  });
  it("lostSetIds lists the losers", () => {
    expect([...lostSetIds([c!], {})]).toEqual([ALBERT]);
  });
});

describe("nextUp / leaveBy", () => {
  it("skips lost sets and ended sets", () => {
    const now = parseIso("2026-09-19T15:40:00-06:00");
    const plan = pick("sat-judith-hill-main-1330", MUSSEL, ALBERT, TAJ);
    expect(nextUp(plan, now, {}, 0)?.id).toBe(MUSSEL);
    expect(nextUp(plan, now, { [conflictKey(byId.get(MUSSEL)!, byId.get(ALBERT)!)]: ALBERT }, 0)?.id).toBe(ALBERT);
    expect(nextUp(plan, parseIso("2026-09-19T22:00:00-06:00"), {}, 0)).toBeNull();
  });
  it("leaveBy subtracts the buffer", () => {
    expect(leaveBy(byId.get(MUSSEL)!, 10).toISOString()).toBe("2026-09-19T22:20:00.000Z");
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -w @bb/festival -- conflicts`
Expected: FAIL — cannot resolve `./conflicts`.

- [ ] **Step 3: Implement**

`apps/festival/src/domain/conflicts.ts`:
```ts
import type { FestivalSet } from "@bb/shared";

export interface Conflict {
  key: string;
  a: FestivalSet; // earlier start
  b: FestivalSet;
  overlapMinutes: number; // true overlap, ≥ 0
  bufferOnly: boolean;    // no overlap, but the gap is shorter than the buffer
}

export type Resolutions = Record<string, string>;

export function conflictKey(a: FestivalSet, b: FestivalSet): string {
  return [a.id, b.id].sort().join("|");
}

export function detectConflicts(sets: FestivalSet[], bufferMinutes: number): Conflict[] {
  const sorted = [...sets].sort((x, y) => Date.parse(x.start) - Date.parse(y.start));
  const buffer = bufferMinutes * 60_000;
  const out: Conflict[] = [];
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const a = sorted[i]!, b = sorted[j]!;
      if (a.stageId === b.stageId && a.id === b.id) continue;
      const aEnd = Date.parse(a.end), bStart = Date.parse(b.start);
      const gap = bStart - aEnd; // negative = overlap
      if (gap >= buffer && !(gap < 0)) continue;
      if (gap >= 0 && gap >= buffer) continue;
      const overlap = Math.max(0, Math.round(-gap / 60_000));
      out.push({ key: conflictKey(a, b), a, b, overlapMinutes: overlap, bufferOnly: overlap === 0 });
    }
  }
  return out;
}

export function keptSet(c: Conflict, resolutions: Resolutions): FestivalSet {
  const chosen = resolutions[c.key];
  if (chosen === c.b.id) return c.b;
  return c.a;
}

export function lostSetIds(conflicts: Conflict[], resolutions: Resolutions): Set<string> {
  const lost = new Set<string>();
  for (const c of conflicts) {
    const keep = keptSet(c, resolutions);
    lost.add(keep.id === c.a.id ? c.b.id : c.a.id);
  }
  return lost;
}

/** The next kept set that hasn't ended. */
export function nextUp(sets: FestivalSet[], now: Date, resolutions: Resolutions, bufferMinutes: number): FestivalSet | null {
  const lost = lostSetIds(detectConflicts(sets, bufferMinutes), resolutions);
  const t = now.getTime();
  return (
    [...sets]
      .filter((s) => !lost.has(s.id) && Date.parse(s.end) > t)
      .sort((x, y) => Date.parse(x.start) - Date.parse(y.start))[0] ?? null
  );
}

export function leaveBy(set: FestivalSet, bufferMinutes: number): Date {
  return new Date(Date.parse(set.start) - bufferMinutes * 60_000);
}
```

Note on `detectConflicts`: a pair conflicts when `gap < buffer` — i.e. a true overlap (`gap < 0`) or a gap shorter than the buffer. Simplify the two `continue` lines to the single condition `if (gap >= buffer) continue;` — it is equivalent, keep whichever reads better, but the tests above must pass.

- [ ] **Step 4: Run tests**

Run: `npm test -w @bb/festival -- conflicts`
Expected: 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/festival/src/domain/conflicts.ts apps/festival/src/domain/conflicts.test.ts
git commit -m "feat(domain): conflict detection with buffers, resolutions, next-up, leave-by"
```

---

### Task 10: Domain — `ics.ts`

**Files:**
- Create: `apps/festival/src/domain/ics.ts`
- Test: `apps/festival/src/domain/ics.test.ts`

**Interfaces:**
- Produces: `planToIcs(sets: FestivalSet[], artistsById: Map<string, Artist>, stagesById: Map<string, Stage>, festival: Festival): string`, `planToText(sets, artistsById, stagesById, festival): string` (share-as-text).

- [ ] **Step 1: Write the failing tests**

`apps/festival/src/domain/ics.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { Content } from "@bb/shared";
import bundled from "@/data/bundled.json";
import { planToIcs, planToText } from "./ics";

const content = Content.parse(bundled);
const artistsById = new Map(content.artists.map((a) => [a.id, a]));
const stagesById = new Map(content.stages.map((s) => [s.id, s]));
const sets = content.sets.filter((s) => ["sat-charlie-musselwhite-ga20-main-1630", "sat-taj-mahal-keb-mo-main-2000"].includes(s.id));

describe("planToIcs", () => {
  it("emits one VEVENT per set with UTC times and escaped text", () => {
    const ics = planToIcs(sets, artistsById, stagesById, content.festival);
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.match(/BEGIN:VEVENT/g)?.length).toBe(2);
    expect(ics).toContain("DTSTART:20260919T223000Z");
    expect(ics).toContain("DTEND:20260919T234000Z");
    expect(ics).toContain("SUMMARY:Charlie Musselwhite & GA-20");
    expect(ics).toContain("LOCATION:Main Stage\\, Telluride Town Park");
    expect(ics).toContain("UID:sat-charlie-musselwhite-ga20-main-1630@bluesandbrews");
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
  });
});

describe("planToText", () => {
  it("groups by day with Denver times", () => {
    const t = planToText(sets, artistsById, stagesById, content.festival);
    expect(t).toContain("Saturday");
    expect(t).toContain("4:30 – 5:40 PM · Charlie Musselwhite & GA-20 · Main Stage");
    expect(t).toContain("8:00 – 9:30 PM · Taj Mahal & Keb’ Mo’ · Main Stage");
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -w @bb/festival -- ics`
Expected: FAIL — cannot resolve `./ics`.

- [ ] **Step 3: Implement**

`apps/festival/src/domain/ics.ts`:
```ts
import type { Artist, Festival, FestivalSet, Stage } from "@bb/shared";
import { formatRange, parseIso } from "./time";

const utcStamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

export function planToIcs(sets: FestivalSet[], artistsById: Map<string, Artist>, stagesById: Map<string, Stage>, festival: Festival): string {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//SBG Productions//Telluride Blues & Brews//EN", "CALSCALE:GREGORIAN"];
  const stamp = utcStamp(new Date());
  for (const s of [...sets].sort((a, b) => Date.parse(a.start) - Date.parse(b.start))) {
    const artist = artistsById.get(s.artistId)?.name ?? s.artistId;
    const stage = stagesById.get(s.stageId)?.name ?? s.stageId;
    lines.push(
      "BEGIN:VEVENT",
      `UID:${s.id}@bluesandbrews`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${utcStamp(parseIso(s.start))}`,
      `DTEND:${utcStamp(parseIso(s.end))}`,
      `SUMMARY:${esc(artist)}`,
      `LOCATION:${esc(`${stage}, ${festival.venue}`)}`,
      `DESCRIPTION:${esc(`${festival.name} — ${festival.edition}`)}`,
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}

export function planToText(sets: FestivalSet[], artistsById: Map<string, Artist>, stagesById: Map<string, Stage>, festival: Festival): string {
  const out = [`My ${festival.name} plan`];
  for (const day of festival.days) {
    const daySets = sets.filter((s) => s.dayId === day.id).sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
    if (daySets.length === 0) continue;
    out.push("", day.label);
    for (const s of daySets) {
      const artist = artistsById.get(s.artistId)?.name ?? s.artistId;
      const stage = stagesById.get(s.stageId)?.name ?? s.stageId;
      out.push(`${formatRange(parseIso(s.start), parseIso(s.end))} · ${artist} · ${stage}`);
    }
  }
  out.push("", festival.links.site);
  return out.join("\n");
}
```

- [ ] **Step 4: Run tests**

Run: `npm test -w @bb/festival -- ics`
Expected: 2 tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/festival/src/domain/ics.ts apps/festival/src/domain/ics.test.ts
git commit -m "feat(domain): plan export to .ics and shareable text"
```

---

### Task 11: Data repositories, alerts fixture, and persisted stores

**Files:**
- Create: `apps/festival/src/data/content.ts`, `apps/festival/src/data/alerts.ts`, `apps/festival/src/data/alerts.fixture.json`
- Create: `apps/festival/src/state/plan.ts`, `apps/festival/src/state/alerts.ts`, `apps/festival/src/state/ui.ts`
- Test: `apps/festival/src/data/content.test.ts`, `apps/festival/src/state/plan.test.ts`

**Interfaces:**
- Produces:
  - `interface ContentRepository { getContent(): Content; subscribe(cb: () => void): () => void }`, `contentRepository`, `useContent(): Content`, `interface ContentIndex { artistsById: Map<string, Artist>; stagesById: Map<string, Stage>; setsById: Map<string, FestivalSet>; setsByDay: Record<DayId, FestivalSet[]>; setsByArtist: Map<string, FestivalSet[]> }`, `buildIndex(c)`, `useContentIndex()`.
  - `useAlerts(): Alert[]` (newest first), `activeUrgent(alerts, now): Alert | null`.
  - `usePlanStore` with `{ favorites: string[]; resolutions: Record<string,string>; reminders: string[]; settings: { leadMinutes: 5|15|30; bufferMinutes: 0|10|20 }; toggleFavorite(id); resolve(key, keepId); toggleReminder(id); setSettings(partial) }`.
  - `useAlertsStore` with `{ readIds: string[]; pushOptIn: boolean; markRead(id); setPushOptIn(v) }`.
  - `useUiStore` with `{ theme: "system"|"light"|"dark"; devNow: string | null; setTheme(t); setDevNow(iso | null) }`.

- [ ] **Step 1: Write the failing tests**

`apps/festival/src/data/content.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { buildIndex, contentRepository } from "./content";

describe("content repository", () => {
  it("serves validated bundled content and an index", () => {
    const c = contentRepository.getContent();
    expect(c.meta.contentVersion).toBe("2026.09.09.1");
    const idx = buildIndex(c);
    expect(idx.stagesById.get("main")?.color).toBe("sky");
    expect(idx.setsByDay.sat.length).toBe(14);
    expect(idx.setsByArtist.get("nigel-wearne")?.length).toBe(3);
  });
});
```

`apps/festival/src/state/plan.test.ts`:
```ts
import { beforeEach, describe, expect, it } from "vitest";
import { usePlanStore } from "./plan";

describe("plan store", () => {
  beforeEach(() => usePlanStore.setState({ favorites: [], resolutions: {}, reminders: [], settings: { leadMinutes: 15, bufferMinutes: 10 } }));

  it("toggles favorites and reminders", () => {
    usePlanStore.getState().toggleFavorite("a");
    usePlanStore.getState().toggleFavorite("b");
    usePlanStore.getState().toggleFavorite("a");
    expect(usePlanStore.getState().favorites).toEqual(["b"]);
    usePlanStore.getState().toggleReminder("b");
    expect(usePlanStore.getState().reminders).toEqual(["b"]);
  });

  it("removing a favorite also drops its reminder", () => {
    usePlanStore.getState().toggleFavorite("a");
    usePlanStore.getState().toggleReminder("a");
    usePlanStore.getState().toggleFavorite("a");
    expect(usePlanStore.getState().reminders).toEqual([]);
  });

  it("records resolutions and settings", () => {
    usePlanStore.getState().resolve("a|b", "b");
    usePlanStore.getState().setSettings({ leadMinutes: 30 });
    expect(usePlanStore.getState().resolutions).toEqual({ "a|b": "b" });
    expect(usePlanStore.getState().settings).toEqual({ leadMinutes: 30, bufferMinutes: 10 });
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -w @bb/festival -- content plan`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement data layer**

`apps/festival/src/data/content.ts`:
```ts
import { useMemo, useSyncExternalStore } from "react";
import { Content, type Artist, type DayId, type FestivalSet, type Stage } from "@bb/shared";
import bundled from "./bundled.json";

export interface ContentRepository {
  getContent(): Content;
  subscribe(cb: () => void): () => void;
}

/** Bundled snapshot: validated once at import, never changes at runtime. */
export function createBundledRepository(raw: unknown): ContentRepository {
  const content = Content.parse(raw);
  return { getContent: () => content, subscribe: () => () => {} };
}

export const contentRepository: ContentRepository = createBundledRepository(bundled);

export function useContent(): Content {
  return useSyncExternalStore(contentRepository.subscribe, contentRepository.getContent, contentRepository.getContent);
}

export interface ContentIndex {
  artistsById: Map<string, Artist>;
  stagesById: Map<string, Stage>;
  setsById: Map<string, FestivalSet>;
  setsByDay: Record<DayId, FestivalSet[]>;
  setsByArtist: Map<string, FestivalSet[]>;
}

export function buildIndex(c: Content): ContentIndex {
  const byStart = (a: FestivalSet, b: FestivalSet) => Date.parse(a.start) - Date.parse(b.start);
  const setsByDay = { fri: [], sat: [], sun: [] } as Record<DayId, FestivalSet[]>;
  const setsByArtist = new Map<string, FestivalSet[]>();
  for (const s of c.sets) {
    setsByDay[s.dayId].push(s);
    setsByArtist.set(s.artistId, [...(setsByArtist.get(s.artistId) ?? []), s]);
  }
  for (const k of Object.keys(setsByDay) as DayId[]) setsByDay[k].sort(byStart);
  for (const v of setsByArtist.values()) v.sort(byStart);
  return {
    artistsById: new Map(c.artists.map((a) => [a.id, a])),
    stagesById: new Map(c.stages.map((s) => [s.id, s])),
    setsById: new Map(c.sets.map((s) => [s.id, s])),
    setsByDay,
    setsByArtist,
  };
}

export function useContentIndex(): ContentIndex {
  const c = useContent();
  return useMemo(() => buildIndex(c), [c]);
}
```

`apps/festival/src/data/alerts.fixture.json` — illustrative only; real alerts come from SBG via Firestore later:
```json
[
  { "id": "fx-005", "title": "Lightning hold — Main Stage paused", "body": "Please move away from stage structures and metal fencing. We'll resume as soon as the 30-minute all-clear passes.", "severity": "urgent", "publishedAt": "2026-09-19T15:22:00-06:00", "publishedBy": "fixture", "expiresAt": "2026-09-19T17:00:00-06:00", "push": true },
  { "id": "fx-004", "title": "Truck Stage running 15 min late", "body": "Sets on the Truck Stage are shifted by 15 minutes this afternoon. Check the schedule for updated times.", "severity": "important", "publishedAt": "2026-09-19T14:48:00-06:00", "publishedBy": "fixture", "push": true },
  { "id": "fx-003", "title": "Tasting session 2 opens at 4:00", "body": "Wristbands at the Grand Tasting entrance. Bring your glass.", "severity": "info", "url": "https://www.tellurideblues.com/faqs", "publishedAt": "2026-09-19T13:05:00-06:00", "publishedBy": "fixture", "push": false },
  { "id": "fx-002", "title": "Welcome to Day 2", "body": "Gates are open. Hydrate — you're at 8,750 ft.", "severity": "info", "publishedAt": "2026-09-19T11:30:00-06:00", "publishedBy": "fixture", "push": false },
  { "id": "fx-001", "title": "Gates open at 11:30", "body": "Welcome to the 32nd Telluride Blues & Brews Festival. Have your ticket ready and enjoy Town Park.", "severity": "info", "publishedAt": "2026-09-18T11:30:00-06:00", "publishedBy": "fixture", "push": true }
]
```

`apps/festival/src/data/alerts.ts`:
```ts
import { useSyncExternalStore } from "react";
import { Alert } from "@bb/shared";
import { z } from "zod";
import fixture from "./alerts.fixture.json";

export interface AlertsRepository {
  getAlerts(): Alert[];
  subscribe(cb: () => void): () => void;
}

const alerts = z.array(Alert).parse(fixture).sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));

export const alertsRepository: AlertsRepository = { getAlerts: () => alerts, subscribe: () => () => {} };

export function useAlerts(): Alert[] {
  return useSyncExternalStore(alertsRepository.subscribe, alertsRepository.getAlerts, alertsRepository.getAlerts);
}

export function activeUrgent(list: Alert[], now: Date): Alert | null {
  const t = now.getTime();
  return list.find((a) => a.severity === "urgent" && Date.parse(a.publishedAt) <= t && (!a.expiresAt || Date.parse(a.expiresAt) > t)) ?? null;
}
```

- [ ] **Step 4: Implement stores**

`apps/festival/src/state/plan.ts`:
```ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface PlanSettings { leadMinutes: 5 | 15 | 30; bufferMinutes: 0 | 10 | 20 }

interface PlanState {
  favorites: string[];
  resolutions: Record<string, string>;
  reminders: string[];
  settings: PlanSettings;
  toggleFavorite: (setId: string) => void;
  resolve: (conflictKey: string, keepSetId: string) => void;
  toggleReminder: (setId: string) => void;
  setSettings: (patch: Partial<PlanSettings>) => void;
}

const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

export const usePlanStore = create<PlanState>()(
  persist(
    (set) => ({
      favorites: [],
      resolutions: {},
      reminders: [],
      settings: { leadMinutes: 15, bufferMinutes: 10 },
      toggleFavorite: (id) =>
        set((s) => {
          const favorites = toggle(s.favorites, id);
          const reminders = favorites.includes(id) ? s.reminders : s.reminders.filter((x) => x !== id);
          return { favorites, reminders };
        }),
      resolve: (key, keep) => set((s) => ({ resolutions: { ...s.resolutions, [key]: keep } })),
      toggleReminder: (id) => set((s) => ({ reminders: toggle(s.reminders, id) })),
      setSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
    }),
    { name: "bb-plan" },
  ),
);
```

`apps/festival/src/state/alerts.ts`:
```ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AlertsState {
  readIds: string[];
  pushOptIn: boolean;
  markRead: (id: string) => void;
  setPushOptIn: (v: boolean) => void;
}

export const useAlertsStore = create<AlertsState>()(
  persist(
    (set) => ({
      readIds: [],
      pushOptIn: false,
      markRead: (id) => set((s) => (s.readIds.includes(id) ? s : { readIds: [...s.readIds, id] })),
      setPushOptIn: (v) => set({ pushOptIn: v }),
    }),
    { name: "bb-alerts" },
  ),
);
```

`apps/festival/src/state/ui.ts`:
```ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeChoice = "system" | "light" | "dark";

interface UiState {
  theme: ThemeChoice;
  /** Dev-only clock override (ISO with offset). Ignored in production builds. */
  devNow: string | null;
  setTheme: (t: ThemeChoice) => void;
  setDevNow: (iso: string | null) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      theme: "system",
      devNow: import.meta.env.DEV ? (import.meta.env.VITE_FESTIVAL_NOW ?? null) : null,
      setTheme: (theme) => set({ theme }),
      setDevNow: (devNow) => set({ devNow }),
    }),
    { name: "bb-ui" },
  ),
);
```

- [ ] **Step 5: Run tests and typecheck**

Run: `npm test -w @bb/festival && npm run typecheck -w @bb/festival`
Expected: all tests pass (content 1, plan 3, plus earlier suites); no type errors.

- [ ] **Step 6: Commit**

```bash
git add apps/festival/src/data apps/festival/src/state
git commit -m "feat(data): content/alerts repositories over bundled snapshot; persisted plan, alerts, ui stores"
```

---

### Task 12: App shell — router, tab bar, theme, festival clock, dev clock, gallery

**Files:**
- Create: `apps/festival/src/app/theme.ts`, `clock.ts`, `icons.tsx`, `TabBar.tsx`, `TabShell.tsx`, `DevClock.tsx`, `router.tsx`
- Create placeholders (replaced in Tasks 13–19): `apps/festival/src/features/now/NowScreen.tsx`, `features/lineup/LineupScreen.tsx`, `features/lineup/ArtistSheet.tsx`, `features/plan/PlanScreen.tsx`, `features/alerts/AlertsScreen.tsx`, `features/info/InfoScreen.tsx`
- Create: `apps/festival/src/design/Gallery.tsx`, `apps/festival/src/test/render.tsx`
- Modify: `apps/festival/src/app/App.tsx`
- Test: `apps/festival/src/app/theme.test.ts`, `apps/festival/src/app/shell.test.tsx`

**Interfaces:**
- Produces: `resolveTheme(choice, prefersDark): "light" | "dark"`, `useApplyTheme()`, `useFestivalClock(): { now: Date; state: FestivalState; dayId: DayId | null }`, `buildRoutes(): RouteObject[]`, `renderAt(path: string)` test helper, routes `/`, `/lineup`, `/lineup/artist/:id`, `/plan`, `/alerts`, `/alerts/:id`, `/info`, `/design` (DEV).
- Screen components are default-less named exports: `NowScreen`, `LineupScreen`, `ArtistSheet`, `PlanScreen`, `AlertsScreen`, `InfoScreen`.

- [ ] **Step 1: Write the failing tests**

`apps/festival/src/app/theme.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { resolveTheme } from "./theme";

describe("resolveTheme", () => {
  it("follows the OS for system, otherwise the explicit choice", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });
});
```

`apps/festival/src/app/shell.test.tsx`:
```tsx
import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { renderAt } from "@/test/render";
import { usePlanStore } from "@/state/plan";

describe("tab shell", () => {
  beforeEach(() => usePlanStore.setState({ favorites: [] }));

  it("renders five tabs and marks the current one", async () => {
    renderAt("/lineup");
    const nav = await screen.findByRole("navigation", { name: "Sections" });
    const links = nav.querySelectorAll("a");
    expect(links.length).toBe(5);
    expect(screen.getByRole("link", { name: /lineup/i })).toHaveAttribute("aria-current", "page");
  });

  it("shows the favorites count on the Plan tab", async () => {
    usePlanStore.setState({ favorites: ["a", "b", "c"] });
    renderAt("/");
    expect(await screen.findByText("3")).toBeInTheDocument();
  });
});
```

`apps/festival/src/test/render.tsx`:
```tsx
import { render } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { buildRoutes } from "@/app/router";

export function renderAt(path: string) {
  const router = createMemoryRouter(buildRoutes(), { initialEntries: [path] });
  return { router, ...render(<RouterProvider router={router} />) };
}
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -w @bb/festival -- theme shell`
Expected: FAIL — modules not found.

- [ ] **Step 3: Theme and clock**

`apps/festival/src/app/theme.ts`:
```ts
import { useEffect } from "react";
import { useUiStore, type ThemeChoice } from "@/state/ui";

export function resolveTheme(choice: ThemeChoice, prefersDark: boolean): "light" | "dark" {
  return choice === "system" ? (prefersDark ? "dark" : "light") : choice;
}

/** Keeps <html data-theme> in sync with the user's choice and the OS. */
export function useApplyTheme(): void {
  const choice = useUiStore((s) => s.theme);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => { document.documentElement.dataset.theme = resolveTheme(choice, mq.matches); };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [choice]);
}
```

`apps/festival/src/app/clock.ts`:
```ts
import { useEffect, useMemo, useState } from "react";
import type { DayId } from "@bb/shared";
import { useContent } from "@/data/content";
import { festivalState, type FestivalState } from "@/domain/schedule";
import { dayIdFor, festivalNow } from "@/domain/time";
import { useUiStore } from "@/state/ui";

export interface FestivalClock { now: Date; state: FestivalState; dayId: DayId | null }

/** Minute-ticking festival clock in Denver time; honors the dev override outside production. */
export function useFestivalClock(): FestivalClock {
  const devNow = useUiStore((s) => (import.meta.env.DEV ? s.devNow : null));
  const { festival } = useContent();
  const [tick, setTick] = useState(() => Date.now());
  useEffect(() => {
    const msToNextMinute = 60_000 - (Date.now() % 60_000);
    let interval: ReturnType<typeof setInterval> | undefined;
    const timeout = setTimeout(() => {
      setTick(Date.now());
      interval = setInterval(() => setTick(Date.now()), 60_000);
    }, msToNextMinute);
    return () => { clearTimeout(timeout); if (interval) clearInterval(interval); };
  }, []);
  return useMemo(() => {
    const now = devNow ? festivalNow(devNow) : new Date(tick);
    return { now, state: festivalState(festival, now), dayId: dayIdFor(now, festival) };
  }, [devNow, tick, festival]);
}
```

- [ ] **Step 4: Icons, tab bar, shell, dev clock**

`apps/festival/src/app/icons.tsx`:
```tsx
type P = { active: boolean };
const base = { width: 24, height: 24, viewBox: "0 0 24 24", "aria-hidden": true as const };

export function IconNow({ active }: P) {
  return (
    <svg {...base} fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <circle cx="12" cy="12" r={active ? 5 : 4} />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" fill="none" />
    </svg>
  );
}
export function IconLineup({ active }: P) {
  return (
    <svg {...base} fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 2} strokeLinecap="round">
      <path d="M4 6h12M4 12h12M4 18h8" /><circle cx="19" cy="17" r="2.5" fill={active ? "currentColor" : "none"} /><path d="M21.5 17V9" />
    </svg>
  );
}
export function IconPlan({ active }: P) {
  return (
    <svg {...base} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4" />
      <path d="M12 18.5l-2.6-2.6a1.6 1.6 0 0 1 2.3-2.3l.3.3.3-.3a1.6 1.6 0 0 1 2.3 2.3z" fill={active ? "currentColor" : "none"} stroke={active ? "none" : "currentColor"} strokeWidth={1.5} />
    </svg>
  );
}
export function IconAlerts({ active }: P) {
  return (
    <svg {...base} fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <path d="M6 17V11a6 6 0 0 1 12 0v6l1.5 2h-15z" /><path d="M10 21h4" fill="none" /><path d="M19 4l1.5-1.5M20 8h2" fill="none" />
    </svg>
  );
}
export function IconInfo({ active }: P) {
  return (
    <svg {...base} fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6" stroke={active ? "var(--surface)" : "currentColor"} />
      <circle cx="12" cy="7.5" r="0.9" fill={active ? "var(--surface)" : "currentColor"} stroke="none" />
    </svg>
  );
}
```

`apps/festival/src/app/TabBar.tsx`:
```tsx
import { NavLink } from "react-router";
import { Badge, CheckerRibbon } from "@/design";
import { useAlerts } from "@/data/alerts";
import { useAlertsStore } from "@/state/alerts";
import { usePlanStore } from "@/state/plan";
import { IconAlerts, IconInfo, IconLineup, IconNow, IconPlan } from "./icons";

const TABS = [
  { to: "/", label: "Now", Icon: IconNow, end: true },
  { to: "/lineup", label: "Lineup", Icon: IconLineup },
  { to: "/plan", label: "Plan", Icon: IconPlan },
  { to: "/alerts", label: "Alerts", Icon: IconAlerts },
  { to: "/info", label: "Info", Icon: IconInfo },
] as const;

export function TabBar() {
  const favorites = usePlanStore((s) => s.favorites.length);
  const readIds = useAlertsStore((s) => s.readIds);
  const unread = useAlerts().filter((a) => !readIds.includes(a.id)).length;
  return (
    <nav aria-label="Sections" className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[480px]">
      <CheckerRibbon rows={1} />
      <div className="grid grid-cols-5 bg-surface px-2 pt-2 safe-b">
        {TABS.map(({ to, label, Icon, ...rest }) => (
          <NavLink key={to} to={to} end={"end" in rest} className={({ isActive }) => `relative grid h-14 place-items-center gap-1 micro ${isActive ? "text-sky" : "text-fg-soft"}`}>
            {({ isActive }) => (
              <>
                {label === "Plan" && <Badge count={favorites} tone="sun" />}
                {label === "Alerts" && <Badge count={unread} tone="ember" />}
                <Icon active={isActive} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
```

`apps/festival/src/app/TabShell.tsx`:
```tsx
import { Outlet, ScrollRestoration } from "react-router";
import { useApplyTheme } from "./theme";
import { TabBar } from "./TabBar";
import { DevClock } from "./DevClock";

export function TabShell() {
  useApplyTheme();
  return (
    <div className="mx-auto min-h-dvh max-w-[480px]">
      <main className="px-4 pb-28 safe-t">
        <Outlet />
      </main>
      <TabBar />
      {import.meta.env.DEV && <DevClock />}
      <ScrollRestoration getKey={(loc) => loc.pathname.split("/")[1] ?? ""} />
    </div>
  );
}
```

`apps/festival/src/app/DevClock.tsx`:
```tsx
import { useUiStore } from "@/state/ui";
import { useFestivalClock } from "./clock";
import { formatTime, toDenverParts } from "@/domain/time";

const PRESETS: { label: string; iso: string | null }[] = [
  { label: "Real time", iso: null },
  { label: "Thu before", iso: "2026-09-17T18:00:00-06:00" },
  { label: "Fri gates", iso: "2026-09-18T11:30:00-06:00" },
  { label: "Sat 3:40 PM", iso: "2026-09-19T15:40:00-06:00" },
  { label: "Sun 9 PM", iso: "2026-09-20T21:00:00-06:00" },
  { label: "Mon after", iso: "2026-09-21T10:00:00-06:00" },
];

/** Dev-only. Lets Sam scrub the festival clock without editing env files. */
export function DevClock() {
  const devNow = useUiStore((s) => s.devNow);
  const setDevNow = useUiStore((s) => s.setDevNow);
  const { now, state } = useFestivalClock();
  const p = toDenverParts(now);
  return (
    <div className="fixed bottom-28 right-3 z-30 flex items-center gap-2 rounded-chip border border-hair bg-surface px-3 py-1.5 text-[12px] shadow-card">
      <span className="tabular-nums">{p.weekday} {formatTime(now)} · {state}</span>
      <select aria-label="Festival clock" value={devNow ?? ""} onChange={(e) => setDevNow(e.target.value || null)} className="bg-transparent">
        {PRESETS.map((x) => <option key={x.label} value={x.iso ?? ""}>{x.label}</option>)}
      </select>
    </div>
  );
}
```

- [ ] **Step 5: Placeholder screens (each replaced by its own task)**

Create each of these with the same shape, changing only the name and title:

`apps/festival/src/features/now/NowScreen.tsx`:
```tsx
export function NowScreen() {
  return <h1 className="font-display text-[32px] leading-9 text-structure-2">Now</h1>;
}
```
Same for `features/lineup/LineupScreen.tsx` (`LineupScreen`, "Lineup" — and it must render `<Outlet />` from `react-router` below the title so the artist sheet route can mount), `features/plan/PlanScreen.tsx` (`PlanScreen`, "My Plan"), `features/alerts/AlertsScreen.tsx` (`AlertsScreen`, "Alerts"), `features/info/InfoScreen.tsx` (`InfoScreen`, "Info").

`apps/festival/src/features/lineup/ArtistSheet.tsx`:
```tsx
import { useNavigate, useParams } from "react-router";
import { Sheet } from "@/design";

export function ArtistSheet() {
  const { id } = useParams();
  const navigate = useNavigate();
  return <Sheet onClose={() => navigate("/lineup")} title="Artist"><p>{id}</p></Sheet>;
}
```

- [ ] **Step 6: Gallery (dev) and router**

`apps/festival/src/design/Gallery.tsx`:
```tsx
import { useState } from "react";
import { PALETTE } from "@bb/shared";
import { Badge, Butterfly, Button, Card, CheckerRibbon, Chip, Columbine, Eyebrow, Heart, Mountains, ProgressBar, RainbowArch, SegmentedControl, SunRays, Toggle } from "@/design";
import { useUiStore } from "@/state/ui";

export function Gallery() {
  const [on, setOn] = useState(false);
  const [day, setDay] = useState<"fri" | "sat" | "sun">("sat");
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  return (
    <div className="space-y-8 py-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-[32px] leading-9 text-structure-2">Design</h1>
        <SegmentedControl label="Theme" value={theme} onChange={setTheme} options={[{ value: "system", label: "Sys" }, { value: "light", label: "☀" }, { value: "dark", label: "☾" }]} />
      </div>
      <section><Eyebrow tone="structure">Color</Eyebrow>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {Object.entries(PALETTE).map(([name, hex]) => (
            <div key={name} className="overflow-hidden rounded-ctl border border-hair bg-surface"><div className="h-10" style={{ background: hex }} /><div className="micro px-2 py-1">{name}</div></div>
          ))}
        </div>
      </section>
      <section className="space-y-2"><Eyebrow tone="structure">Type</Eyebrow>
        <div className="font-display text-[40px] leading-11 text-structure-2">Saturday in Town Park</div>
        <div className="font-shade text-[56px] leading-none text-sun tabular-nums">09 : 04</div>
        <div className="font-display text-[24px] leading-7">Samantha Fish</div>
        <div className="eyebrow text-structure">Now playing · Main Stage</div>
        <p>Favorites become a personal schedule. Overlaps are flagged and you choose which set wins.</p>
        <p className="text-[15px] leading-5 text-fg-soft tabular-nums">4:30 – 5:40 PM · 11:30 AM – 12:30 PM</p>
      </section>
      <section><Eyebrow tone="structure">Ornaments</Eyebrow>
        <CheckerRibbon className="my-3" />
        <div className="relative h-40 overflow-hidden rounded-card bg-night"><RainbowArch /></div>
        <div className="mt-3 flex items-end gap-4"><SunRays size={110} /><Columbine size={72} /><Butterfly /></div>
        <Mountains className="mt-3 h-24" />
      </section>
      <section className="space-y-3"><Eyebrow tone="structure">Primitives</Eyebrow>
        <div className="flex flex-wrap gap-2"><Button variant="sun">Remind me</Button><Button variant="ink">Enable alerts</Button><Button>Share plan</Button><Button variant="sun" size="sm">Jump to now</Button></div>
        <div className="flex flex-wrap gap-2"><Chip tone="sky">Main Stage</Chip><Chip tone="plum">Blues Stage</Chip><Chip tone="pine">Truck</Chip><Chip tone="violet">Camp</Chip><Chip tone="sun">● Now</Chip><Chip tone="ember">Urgent</Chip><Chip tone="paper">Up next</Chip></div>
        <SegmentedControl label="Day" value={day} onChange={setDay} options={[{ value: "fri", label: "Fri" }, { value: "sat", label: "Sat" }, { value: "sun", label: "Sun" }]} />
        <div className="flex items-center gap-3"><Heart on={on} onToggle={() => setOn(!on)} label="Favorite" /><Toggle on={on} onChange={setOn} label="Toggle" /><span className="relative h-6 w-6 rounded-chip bg-surface-2"><Badge count={3} tone="sun" /></span></div>
        <Card><div className="flex items-center gap-2"><Chip tone="sun">● Now</Chip><Eyebrow>Main Stage</Eyebrow><span className="ml-auto text-[15px] text-fg-soft tabular-nums">42 min left</span></div><div className="mt-2 font-display text-[24px] leading-7">Taj Mahal &amp; Keb’ Mo’</div><div className="mt-3"><ProgressBar value={0.62} label="Set progress" /></div></Card>
      </section>
    </div>
  );
}
```

`apps/festival/src/app/router.tsx`:
```tsx
import { createBrowserRouter, type RouteObject } from "react-router";
import { TabShell } from "./TabShell";
import { NowScreen } from "@/features/now/NowScreen";
import { LineupScreen } from "@/features/lineup/LineupScreen";
import { ArtistSheet } from "@/features/lineup/ArtistSheet";
import { PlanScreen } from "@/features/plan/PlanScreen";
import { AlertsScreen } from "@/features/alerts/AlertsScreen";
import { InfoScreen } from "@/features/info/InfoScreen";
import { Gallery } from "@/design/Gallery";

export function buildRoutes(): RouteObject[] {
  const children: RouteObject[] = [
    { index: true, element: <NowScreen /> },
    { path: "lineup", element: <LineupScreen />, children: [{ path: "artist/:id", element: <ArtistSheet /> }] },
    { path: "plan", element: <PlanScreen /> },
    { path: "alerts", element: <AlertsScreen />, children: [{ path: ":id", element: null }] },
    { path: "info", element: <InfoScreen /> },
  ];
  if (import.meta.env.DEV) children.push({ path: "design", element: <Gallery /> });
  return [{ path: "/", element: <TabShell />, children }];
}

export function createAppRouter() {
  const basename = import.meta.env.BASE_URL.replace(/\/$/, "") || "/";
  return createBrowserRouter(buildRoutes(), { basename });
}
```

`apps/festival/src/app/App.tsx`:
```tsx
import { RouterProvider } from "react-router";
import { createAppRouter } from "./router";

const router = createAppRouter();

export function App() {
  return <RouterProvider router={router} />;
}
```

- [ ] **Step 7: Run tests, typecheck, and look**

Run: `npm test -w @bb/festival && npm run typecheck -w @bb/festival`
Expected: all pass, including the 2 shell tests and 1 theme test.

Run: `npm run dev` → `http://localhost:5173`
Expected: tab bar with checker edge and five icons; tapping tabs changes the title; `/design` shows the gallery in both themes (use the theme control); the dev clock pill bottom-right changes its readout with each preset. Stop the server.

- [ ] **Step 8: Commit**

```bash
git add apps/festival/src
git commit -m "feat(app): router + tab shell, theme sync, festival clock with dev scrubber, design gallery"
```

---

### Task 13: Now screen (pre · live · post)

**Files:**
- Create: `apps/festival/src/features/now/Hero.tsx`, `Countdown.tsx`, `NowLive.tsx`, `NowPre.tsx`, `NowPost.tsx`, `SetCard.tsx`
- Replace: `apps/festival/src/features/now/NowScreen.tsx`
- Test: `apps/festival/src/features/now/NowScreen.test.tsx`

**Interfaces:**
- Consumes: `useFestivalClock`, `useContent`, `useContentIndex`, `useAlerts`/`activeUrgent`, `usePlanStore`, domain `schedule`/`conflicts`/`time`, primitives.
- Produces: `SetCard({ set, artist, stage, now, emphasis?: "now"|"next"|"plain" })` reused by Lineup/Plan.

- [ ] **Step 1: Write the failing test**

`apps/festival/src/features/now/NowScreen.test.tsx`:
```tsx
import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { renderAt } from "@/test/render";
import { useUiStore } from "@/state/ui";
import { usePlanStore } from "@/state/plan";

describe("Now screen states", () => {
  beforeEach(() => { usePlanStore.setState({ favorites: [], resolutions: {} }); });

  it("pre-festival shows a countdown to Friday gates", async () => {
    useUiStore.setState({ devNow: "2026-09-17T18:00:00-06:00" });
    renderAt("/");
    expect(await screen.findByText(/gates open in/i)).toBeInTheDocument();
    expect(screen.getByText(/Fri Sep 18 · 11:30 AM/)).toBeInTheDocument();
    expect(screen.getByText("Marcus King Band")).toBeInTheDocument();
  });

  it("live shows what is on stage and the user's next favorited set", async () => {
    useUiStore.setState({ devNow: "2026-09-19T15:40:00-06:00" });
    usePlanStore.setState({ favorites: ["sat-charlie-musselwhite-ga20-main-1630"] });
    renderAt("/");
    expect(await screen.findByText(/on stage now/i)).toBeInTheDocument();
    expect(screen.getByText("Nether Hour")).toBeInTheDocument();
    expect(screen.getByText(/your next set/i)).toBeInTheDocument();
    expect(screen.getAllByText("Charlie Musselwhite & GA-20").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Lightning hold/).length).toBeGreaterThan(0); // banner + latest alerts
  });

  it("post-festival thanks the user", async () => {
    useUiStore.setState({ devNow: "2026-09-21T10:00:00-06:00" });
    renderAt("/");
    expect(await screen.findByText(/see you in 2027/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -w @bb/festival -- NowScreen`
Expected: FAIL (placeholder has none of these texts).

- [ ] **Step 3: Implement hero, countdown, cards**

`apps/festival/src/features/now/Hero.tsx`:
```tsx
import { motion, useScroll, useTransform } from "motion/react";
import type { ReactNode } from "react";
import { Chip, RainbowArch, useMotionOk } from "@/design";

const LAYERS = [
  { src: "/art/sky.png", rate: 0.15, top: "0%" },
  { src: "/art/mountains-near.png", rate: 0.35, top: "38%" },
  { src: "/art/foreground.png", rate: 0.6, top: "62%" },
] as const;

/** Poster-crop parallax hero framed by the rainbow arch; official lockup on top. */
export function Hero({ compact = false, children }: { compact?: boolean; children?: ReactNode }) {
  const ok = useMotionOk();
  const { scrollY } = useScroll();
  const cap = 24;
  const y0 = useTransform(scrollY, [0, 300], [0, ok ? Math.min(cap, 300 * 0.15) : 0]);
  const y1 = useTransform(scrollY, [0, 300], [0, ok ? Math.min(cap, 300 * 0.35) : 0]);
  const y2 = useTransform(scrollY, [0, 300], [0, ok ? Math.min(cap, 300 * 0.6) : 0]);
  const ys = [y0, y1, y2];
  return (
    <div className={`relative overflow-hidden rounded-hero bg-night ${compact ? "h-[250px]" : "h-[420px]"}`}>
      {LAYERS.map((l, i) => (
        <motion.img key={l.src} src={l.src} alt="" aria-hidden="true" style={{ y: ys[i], top: l.top }}
          className="absolute left-1/2 w-[150%] max-w-none -translate-x-1/2 select-none" draggable={false} />
      ))}
      <RainbowArch />
      <img src="/art/lockup.png" alt="Telluride Blues & Brews Festival, September 18–20, 2026, Telluride, Colorado"
        className="absolute left-1/2 top-4 w-[74%] -translate-x-1/2 drop-shadow-[0_6px_14px_rgba(0,0,0,.35)]" />
      <div className="absolute inset-x-0 bottom-0 h-[58%] bg-gradient-to-b from-transparent to-bg to-[82%]" />
      <div className="absolute right-3 top-3"><Chip tone="sun">32nd annual</Chip></div>
      {children}
    </div>
  );
}
```

`apps/festival/src/features/now/Countdown.tsx`:
```tsx
import { Eyebrow } from "@/design";

export function Countdown({ msUntil, gatesLine }: { msUntil: number; gatesLine: string }) {
  const totalHours = Math.max(0, Math.floor(msUntil / 3_600_000));
  const days = Math.floor(totalHours / 24), hours = totalHours % 24;
  return (
    <div className="absolute inset-x-0 bottom-4 text-center">
      <Eyebrow className="text-fg">Gates open in</Eyebrow>
      <div className="font-shade text-[64px] leading-none text-sun tabular-nums" aria-label={`${days} days ${hours} hours`}>
        {days}<span className="font-shade text-[28px] align-top mx-1">days</span>{String(hours).padStart(2, "0")}<span className="font-shade text-[28px] align-top ml-1">hrs</span>
      </div>
      <Eyebrow className="mt-1 text-fg">{gatesLine}</Eyebrow>
    </div>
  );
}
```

`apps/festival/src/features/now/SetCard.tsx`:
```tsx
import type { Artist, FestivalSet, Stage } from "@bb/shared";
import { Link } from "react-router";
import { Card, Chip, Eyebrow, ProgressBar } from "@/design";
import { minutesLeft, progress } from "@/domain/schedule";
import { formatRange, formatTime, minutesBetween, parseIso } from "@/domain/time";

export function SetCard({ set, artist, stage, now, emphasis = "plain" }: {
  set: FestivalSet; artist: Artist; stage: Stage; now: Date; emphasis?: "now" | "next" | "plain";
}) {
  const start = parseIso(set.start), end = parseIso(set.end);
  const isHeadliner = artist.tier === "headliner";
  return (
    <Link to={`/lineup/artist/${artist.id}`} className="block">
      <Card className={emphasis === "next" ? "border-plum" : ""}>
        <div className="flex items-center gap-2">
          {emphasis === "now" && <Chip tone="sun">● Now</Chip>}
          <Chip tone={stage.color}>{stage.shortName}</Chip>
          <span className="ml-auto text-[14px] text-fg-soft tabular-nums">
            {emphasis === "now" ? `${minutesLeft(set, now)} min left` : emphasis === "next" ? `in ${minutesBetween(now, start)} min` : formatTime(start)}
          </span>
        </div>
        <div className={`mt-1.5 ${isHeadliner || emphasis === "now" ? "font-display text-[22px] leading-[26px]" : "text-[17px] font-semibold leading-6"}`}>{artist.name}</div>
        {emphasis === "now" ? (
          <div className="mt-2.5"><ProgressBar value={progress(set, now)} label={`${artist.name} set progress`} /></div>
        ) : (
          <Eyebrow className="mt-1 normal-case tracking-normal font-sans text-[13px]">{formatRange(start, end)} · {stage.name}</Eyebrow>
        )}
      </Card>
    </Link>
  );
}
```

- [ ] **Step 4: Implement the three states and the screen**

`apps/festival/src/features/now/NowPre.tsx`:
```tsx
import { Link } from "react-router";
import { Button, Card, Eyebrow, Heart } from "@/design";
import { useContentIndex, useContent } from "@/data/content";
import { gatesOpenAt, headliners } from "@/domain/schedule";
import { formatTime } from "@/domain/time";
import { usePlanStore } from "@/state/plan";
import { Countdown } from "./Countdown";
import { Hero } from "./Hero";

export function NowPre({ now }: { now: Date }) {
  const content = useContent();
  const idx = useContentIndex();
  const favorites = usePlanStore((s) => s.favorites);
  const toggleFavorite = usePlanStore((s) => s.toggleFavorite);
  const first = content.festival.days[0]!;
  const gates = gatesOpenAt(first);
  return (
    <>
      <Hero>
        <Countdown msUntil={gates.getTime() - now.getTime()} gatesLine={`${first.label.slice(0, 3)} Sep ${Number(first.date.slice(8))} · ${formatTime(gates)} · ${content.festival.venue.replace("Telluride ", "")}`} />
      </Hero>
      <div className="mt-4 flex items-baseline justify-between px-0.5">
        <Eyebrow tone="structure">Headliners</Eyebrow>
        <Link to="/lineup" className="eyebrow text-fg-soft">See lineup →</Link>
      </div>
      <div className="mt-2 space-y-2">
        {headliners(content.artists).map((a) => {
          const set = idx.setsByArtist.get(a.id)?.[0];
          const stage = set ? idx.stagesById.get(set.stageId) : undefined;
          return (
            <Card key={a.id} className="flex items-center gap-3">
              <Link to={`/lineup/artist/${a.id}`} className="min-w-0 flex-1">
                <div className="font-display text-[20px] leading-6">{a.name}</div>
                {set && stage && <div className="text-[15px] text-fg-soft tabular-nums">{content.festival.days.find((d) => d.id === set.dayId)?.label.slice(0, 3)} · {formatTime(new Date(set.start))} · {stage.name}</div>}
              </Link>
              {set && <Heart on={favorites.includes(set.id)} onToggle={() => toggleFavorite(set.id)} label={`Favorite ${a.name}`} />}
            </Card>
          );
        })}
      </div>
      {favorites.length === 0 && (
        <Link to="/lineup" className="mt-3 block"><Button variant="sun" full>Build your plan</Button></Link>
      )}
    </>
  );
}
```

`apps/festival/src/features/now/NowLive.tsx`:
```tsx
import { Link } from "react-router";
import { Button, Card, Chip, Eyebrow } from "@/design";
import { activeUrgent, useAlerts } from "@/data/alerts";
import { useContent, useContentIndex } from "@/data/content";
import { nextUp } from "@/domain/conflicts";
import { nowPlaying, upNext } from "@/domain/schedule";
import { formatRange, formatTime, minutesBetween, parseIso } from "@/domain/time";
import { usePlanStore } from "@/state/plan";
import type { DayId } from "@bb/shared";
import { Hero } from "./Hero";
import { SetCard } from "./SetCard";

export function NowLive({ now, dayId }: { now: Date; dayId: DayId | null }) {
  const content = useContent();
  const idx = useContentIndex();
  const alerts = useAlerts();
  const urgent = activeUrgent(alerts, now);
  const { favorites, resolutions, settings } = usePlanStore();
  const day = content.festival.days.find((d) => d.id === dayId) ?? content.festival.days[0]!;
  const dayIndex = content.festival.days.findIndex((d) => d.id === day.id) + 1;
  const todays = idx.setsByDay[day.id];
  const on = nowPlaying(todays, now);
  const next = upNext(todays, now, 2);
  const mine = favorites.map((id) => idx.setsById.get(id)).filter((s): s is NonNullable<typeof s> => !!s);
  const myNext = nextUp(mine, now, resolutions, settings.bufferMinutes);
  const pick = (setId: string) => ({ set: idx.setsById.get(setId)!, artist: idx.artistsById.get(idx.setsById.get(setId)!.artistId)!, stage: idx.stagesById.get(idx.setsById.get(setId)!.stageId)! });
  return (
    <>
      <Hero compact>
        <div className="absolute inset-x-3.5 bottom-2.5 flex items-end justify-between">
          <div><Eyebrow className="text-fg">{day.label} · Town Park</Eyebrow><div className="font-display text-[24px] leading-7">Day {dayIndex} of {content.festival.days.length}</div></div>
          <Chip tone="paper">Offline-ready ✓</Chip>
        </div>
      </Hero>
      {urgent && (
        <Link to={`/alerts/${urgent.id}`} className="mt-3 block">
          <Card className="border-l-[5px] border-l-ember py-2.5"><div className="flex items-center gap-2"><Chip tone="ember">Urgent</Chip><b className="min-w-0 flex-1 truncate text-[15px]">{urgent.title}</b><Eyebrow>{formatTime(parseIso(urgent.publishedAt))}</Eyebrow></div></Card>
        </Link>
      )}
      <div className="mt-4 flex items-baseline justify-between px-0.5"><Eyebrow tone="structure">On stage now</Eyebrow><Link to="/lineup" className="eyebrow text-fg-soft">Up next →</Link></div>
      <div className="mt-1.5 space-y-2">
        {on.length === 0 && <Card><div className="text-[15px] text-fg-soft">{next.length ? "Nothing on right now — next sets below." : `That's a wrap on ${day.label}. Thank you, Town Park.`}</div></Card>}
        {on.map((s) => { const p = pick(s.id); return <SetCard key={s.id} {...p} now={now} emphasis="now" />; })}
      </div>
      {next.length > 0 && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          {next.map((s) => { const p = pick(s.id); return (
            <Link key={s.id} to={`/lineup/artist/${p.artist.id}`}><Card className="h-full px-3 py-2.5"><Chip tone={p.stage.color}>{p.stage.shortName}</Chip><div className="mt-1.5 text-[14px] font-semibold leading-[18px]">{p.artist.name}</div><div className="text-[13px] text-fg-soft tabular-nums">{formatTime(parseIso(s.start))}</div></Card></Link>
          ); })}
        </div>
      )}
      <div className="mt-4 flex items-baseline justify-between px-0.5"><Eyebrow tone="plum">Your next set</Eyebrow><Link to="/plan" className="eyebrow text-fg-soft">My plan →</Link></div>
      <div className="mt-1.5">
        {myNext ? (() => { const p = pick(myNext.id); return (
          <Card className="flex items-center gap-3 border-plum">
            <Link to={`/lineup/artist/${p.artist.id}`} className="min-w-0 flex-1">
              <div className="text-[16px] font-semibold leading-5">{p.artist.name}</div>
              <div className="text-[13px] text-fg-soft tabular-nums">in {minutesBetween(now, parseIso(myNext.start))} min · {formatRange(parseIso(myNext.start), parseIso(myNext.end))} · {p.stage.name}</div>
            </Link>
            <Link to="/plan"><Button size="sm">Plan</Button></Link>
          </Card>
        ); })() : (
          <Link to="/lineup" className="block"><Card className="flex items-center gap-3"><div className="flex-1 text-[15px] text-fg-soft">No favorites yet — tap the heart on any set.</div><Button variant="sun" size="sm">Lineup</Button></Card></Link>
        )}
      </div>
    </>
  );
}
```

`apps/festival/src/features/now/NowPost.tsx`:
```tsx
import { Button, Card, Eyebrow } from "@/design";
import { useContent } from "@/data/content";
import { Hero } from "./Hero";

export function NowPost() {
  const { festival } = useContent();
  const share = async () => {
    const text = `Thank you, ${festival.name} ${festival.year}. See you in ${festival.year + 1}. ${festival.links.site}`;
    if (navigator.share) await navigator.share({ text }); else await navigator.clipboard?.writeText(text);
  };
  return (
    <>
      <Hero>
        <div className="absolute inset-x-0 bottom-5 text-center">
          <Eyebrow className="text-fg">That's a wrap</Eyebrow>
          <div className="font-display text-[32px] leading-9 text-structure-2">Thank you, Telluride</div>
          <div className="mt-1 font-shade text-[28px] leading-none text-sun">See you in {festival.year + 1}</div>
        </div>
      </Hero>
      <Card className="mt-4 flex items-center gap-3">
        <div className="flex-1 text-[15px] text-fg-soft">Three days, four stages, one Town Park.</div>
        <Button variant="sun" size="sm" onClick={share}>Share</Button>
      </Card>
    </>
  );
}
```

`apps/festival/src/features/now/NowScreen.tsx`:
```tsx
import { Link } from "react-router";
import { Card, Eyebrow } from "@/design";
import { useAlerts } from "@/data/alerts";
import { useContent } from "@/data/content";
import { useFestivalClock } from "@/app/clock";
import { formatTime, parseIso } from "@/domain/time";
import { NowLive } from "./NowLive";
import { NowPost } from "./NowPost";
import { NowPre } from "./NowPre";

export function NowScreen() {
  const { now, state, dayId } = useFestivalClock();
  const { festival } = useContent();
  const alerts = useAlerts().filter((a) => Date.parse(a.publishedAt) <= now.getTime()).slice(0, 2);
  return (
    <div className="pt-3">
      <h1 className="sr-only">Now</h1>
      {state === "pre" && <NowPre now={now} />}
      {state === "live" && <NowLive now={now} dayId={dayId} />}
      {state === "post" && <NowPost />}
      {alerts.length > 0 && (
        <>
          <div className="mt-5 flex items-baseline justify-between px-0.5"><Eyebrow tone="structure">Latest alerts</Eyebrow><Link to="/alerts" className="eyebrow text-fg-soft">All alerts →</Link></div>
          <div className="mt-1.5 space-y-2">
            {alerts.map((a) => (
              <Link key={a.id} to={`/alerts/${a.id}`} className="block"><Card className={`border-l-[5px] py-2.5 ${a.severity === "urgent" ? "border-l-ember" : a.severity === "important" ? "border-l-sun" : "border-l-sky"}`}><div className="flex items-center gap-2"><b className="min-w-0 flex-1 truncate text-[15px]">{a.title}</b><Eyebrow>{formatTime(parseIso(a.publishedAt))}</Eyebrow></div></Card></Link>
            ))}
          </div>
        </>
      )}
      <div className="mt-5 grid grid-cols-3 gap-2">
        {[["Site", festival.links.site], ["FAQ", festival.links.faq], ["Guide", festival.links.guide]].map(([label, href]) => (
          <a key={label} href={href} target="_blank" rel="noreferrer" className="rounded-ctl border border-hair bg-surface py-3 text-center text-[15px] font-semibold text-structure-2">{label} ↗</a>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run tests, look at all three states**

Run: `npm test -w @bb/festival -- NowScreen && npm run typecheck -w @bb/festival`
Expected: 3 tests pass; no type errors.

Run: `npm run dev`; use the dev clock to view Thu before / Sat 3:40 PM / Mon after in light and dark. Compare with `screens.html` frame 1 and the design-system hero. The live hero must keep the "On stage now" card above the fold at 390×844. Stop the server.

- [ ] **Step 6: Commit**

```bash
git add apps/festival/src/features/now
git commit -m "feat(now): poster hero with parallax, countdown, live on-stage/up-next/your-next-set, post-festival"
```

---

### Task 14: Lineup — screen chrome, list view, search

**Files:**
- Replace: `apps/festival/src/features/lineup/LineupScreen.tsx`
- Create: `apps/festival/src/features/lineup/LineupList.tsx`, `apps/festival/src/features/lineup/SetRow.tsx`, `apps/festival/src/features/lineup/useLineupState.ts`
- Test: `apps/festival/src/features/lineup/LineupScreen.test.tsx`

**Interfaces:**
- Produces: `useLineupState()` → `{ day, setDay, view, setView, query, setQuery }` (view persisted in `useUiStore` as `lineupView`; add `lineupView: "list" | "grid"` + `setLineupView` to `src/state/ui.ts`), `SetRow({ set, artist, stage, now, showStage? })`, `LineupList({ dayId, now })`. `LineupGrid` is a placeholder here and implemented in Task 15.

- [ ] **Step 1: Write the failing tests**

`apps/festival/src/features/lineup/LineupScreen.test.tsx`:
```tsx
import { fireEvent, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { renderAt } from "@/test/render";
import { useUiStore } from "@/state/ui";
import { usePlanStore } from "@/state/plan";

describe("Lineup list", () => {
  beforeEach(() => {
    useUiStore.setState({ devNow: "2026-09-19T15:40:00-06:00", lineupView: "list" });
    usePlanStore.setState({ favorites: [] });
  });

  it("defaults to today during the festival and groups by stage", async () => {
    renderAt("/lineup");
    expect(await screen.findByRole("radio", { name: /sat/i })).toBeChecked();
    const main = screen.getByTestId("stage-main");
    expect(within(main).getByText("Nether Hour")).toBeInTheDocument();
    expect(within(main).getByText(/on now · 20 min left/i)).toBeInTheDocument();
    expect(within(screen.getByTestId("stage-blues")).getByText("Albert White")).toBeInTheDocument();
  });

  it("hearts add a set to the plan without opening the sheet", async () => {
    renderAt("/lineup");
    const heart = await screen.findByRole("button", { name: /favorite nether hour/i });
    fireEvent.click(heart);
    expect(usePlanStore.getState().favorites).toEqual(["sat-nether-hour-main-1500"]);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("search filters across all days", async () => {
    renderAt("/lineup");
    fireEvent.change(await screen.findByRole("searchbox"), { target: { value: "keb" } });
    expect(screen.getByText("Taj Mahal & Keb’ Mo’")).toBeInTheDocument();
    expect(screen.queryByText("Nether Hour")).toBeNull();
  });

  it("lists comedy acts without times", async () => {
    renderAt("/lineup");
    expect(await screen.findByText("Baron Vaughn")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -w @bb/festival -- LineupScreen`
Expected: FAIL.

- [ ] **Step 3: Extend the ui store**

In `apps/festival/src/state/ui.ts` add to the interface and initial state:
```ts
  lineupView: "list" | "grid";
  setLineupView: (v: "list" | "grid") => void;
```
```ts
      lineupView: "list",
      setLineupView: (lineupView) => set({ lineupView }),
```

- [ ] **Step 4: Lineup state hook, row, list**

`apps/festival/src/features/lineup/useLineupState.ts`:
```ts
import { useState } from "react";
import type { DayId } from "@bb/shared";
import { useFestivalClock } from "@/app/clock";
import { useUiStore } from "@/state/ui";

export function useLineupState() {
  const { now, state, dayId } = useFestivalClock();
  const [day, setDay] = useState<DayId>(state === "live" && dayId ? dayId : "fri");
  const view = useUiStore((s) => s.lineupView);
  const setView = useUiStore((s) => s.setLineupView);
  const [query, setQuery] = useState("");
  return { now, day, setDay, view, setView, query, setQuery };
}
```

`apps/festival/src/features/lineup/SetRow.tsx`:
```tsx
import type { Artist, FestivalSet, Stage } from "@bb/shared";
import { useNavigate } from "react-router";
import { Chip, Heart } from "@/design";
import { isEnded, minutesLeft, nowPlaying } from "@/domain/schedule";
import { formatTime, parseIso } from "@/domain/time";
import { usePlanStore } from "@/state/plan";

export function SetRow({ set, artist, stage, now, showStage = false, dayLabel }: {
  set: FestivalSet; artist: Artist; stage: Stage; now: Date; showStage?: boolean; dayLabel?: string;
}) {
  const navigate = useNavigate();
  const on = usePlanStore((s) => s.favorites.includes(set.id));
  const toggle = usePlanStore((s) => s.toggleFavorite);
  const start = parseIso(set.start);
  const live = nowPlaying([set], now).length > 0;
  const ended = isEnded(set, now);
  const isHeadliner = artist.tier === "headliner";
  const sub = live ? `On now · ${minutesLeft(set, now)} min left` : ended ? "Ended" : artist.tier === "musicmaker" ? "Music Maker Foundation" : isHeadliner ? "Headliner" : showStage ? stage.name : undefined;
  return (
    <div className={`-mx-4 flex items-center gap-3 border-b border-hair px-4 py-2.5 ${live || isHeadliner ? "bg-gradient-to-r from-sun/20 to-transparent" : ""} ${ended ? "opacity-60" : ""}`}>
      <button type="button" onClick={() => navigate(`/lineup/artist/${artist.id}`)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <span className={`w-16 shrink-0 text-[14px] font-semibold leading-[18px] tabular-nums ${live ? "text-ink" : "text-fg-soft"}`}>{dayLabel ? `${dayLabel} ` : ""}{live ? "● " : ""}{formatTime(start)}</span>
        <span className="min-w-0 flex-1">
          <span className={`block truncate ${isHeadliner ? "font-display text-[17px] leading-5" : "text-[16px] font-semibold leading-5"}`}>{artist.name}</span>
          {sub && <span className="block text-[13px] text-fg-soft">{sub}</span>}
        </span>
        {showStage && <Chip tone={stage.color}>{stage.shortName}</Chip>}
      </button>
      <Heart on={on} onToggle={() => toggle(set.id)} label={`Favorite ${artist.name}, ${formatTime(start)}, ${stage.name}`} />
    </div>
  );
}
```

`apps/festival/src/features/lineup/LineupList.tsx`:
```tsx
import type { DayId } from "@bb/shared";
import { useNavigate } from "react-router";
import { Chip, Eyebrow } from "@/design";
import { useContent, useContentIndex } from "@/data/content";
import { groupByStage } from "@/domain/schedule";
import { SetRow } from "./SetRow";

export function LineupList({ dayId, now }: { dayId: DayId; now: Date }) {
  const content = useContent();
  const idx = useContentIndex();
  const navigate = useNavigate();
  const groups = groupByStage(idx.setsByDay[dayId], content.stages);
  const comedy = content.artists.filter((a) => a.tier === "comedy");
  return (
    <div>
      {groups.map((g) => (
        <section key={g.stage.id} data-testid={`stage-${g.stage.id}`} className="mt-4">
          <div className="flex items-center gap-2"><Chip tone={g.stage.color}>{g.stage.name}</Chip><div className="h-px flex-1 bg-hair" /></div>
          {g.sets.map((s) => (
            <SetRow key={s.id} set={s} artist={idx.artistsById.get(s.artistId)!} stage={g.stage} now={now} />
          ))}
        </section>
      ))}
      {comedy.length > 0 && (
        <section className="mt-4">
          <div className="flex items-center gap-2"><Chip tone="paper">Comedy</Chip><div className="h-px flex-1 bg-hair" /><Eyebrow>Times from SBG</Eyebrow></div>
          {comedy.map((a) => (
            <button key={a.id} type="button" onClick={() => navigate(`/lineup/artist/${a.id}`)} className="-mx-4 flex w-[calc(100%+2rem)] items-center border-b border-hair px-4 py-3 text-left text-[16px] font-semibold">{a.name}</button>
          ))}
        </section>
      )}
    </div>
  );
}
```

- [ ] **Step 5: The screen (with a grid placeholder)**

`apps/festival/src/features/lineup/LineupScreen.tsx`:
```tsx
import { Outlet } from "react-router";
import { SegmentedControl } from "@/design";
import { useContent, useContentIndex } from "@/data/content";
import { searchArtists } from "@/domain/schedule";
import { LineupList } from "./LineupList";
import { LineupGrid } from "./LineupGrid";
import { SetRow } from "./SetRow";
import { useLineupState } from "./useLineupState";

export function LineupScreen() {
  const { now, day, setDay, view, setView, query, setQuery } = useLineupState();
  const content = useContent();
  const idx = useContentIndex();
  const searching = query.trim().length > 0;
  const hits = searching ? searchArtists(content.artists, query) : [];
  return (
    <div className="pt-3">
      <h1 className="font-display text-[32px] leading-9 text-structure-2">Lineup</h1>
      <div className="mt-2 flex items-center gap-2">
        <SegmentedControl label="Day" value={day} onChange={setDay} options={content.festival.days.map((d) => ({ value: d.id, label: d.label.slice(0, 3) }))} />
        <div className="flex-1" />
        <SegmentedControl label="View" value={view} onChange={setView} options={[{ value: "list", label: "List" }, { value: "grid", label: "Grid" }]} />
      </div>
      <input type="search" role="searchbox" aria-label="Search artists" placeholder="Search artists" value={query} onChange={(e) => setQuery(e.target.value)}
        className="mt-2.5 h-11 w-full rounded-ctl border border-hair bg-surface px-3 text-[15px] placeholder:text-fg-soft" />
      {searching ? (
        <div className="mt-2">
          {hits.length === 0 && <p className="py-6 text-center text-fg-soft">No artists match “{query}”.</p>}
          {hits.map((a) => (idx.setsByArtist.get(a.id) ?? []).map((s) => (
            <SetRow key={s.id} set={s} artist={a} stage={idx.stagesById.get(s.stageId)!} now={now} showStage dayLabel={content.festival.days.find((d) => d.id === s.dayId)?.label.slice(0, 3)} />
          )))}
        </div>
      ) : view === "list" ? (
        <LineupList dayId={day} now={now} />
      ) : (
        <LineupGrid dayId={day} now={now} />
      )}
      <Outlet />
    </div>
  );
}
```

`apps/festival/src/features/lineup/LineupGrid.tsx` (placeholder until Task 15):
```tsx
import type { DayId } from "@bb/shared";
export function LineupGrid({ dayId }: { dayId: DayId; now: Date }) {
  return <p className="mt-4 text-fg-soft">Grid for {dayId} — Task 15.</p>;
}
```

- [ ] **Step 6: Run tests and look**

Run: `npm test -w @bb/festival -- LineupScreen && npm run typecheck -w @bb/festival`
Expected: 4 tests pass; no type errors.

Run: `npm run dev` → `/lineup` at Sat 3:40 PM. Compare with `screens.html` frame 2. Stop the server.

- [ ] **Step 7: Commit**

```bash
git add apps/festival/src/features/lineup apps/festival/src/state/ui.ts
git commit -m "feat(lineup): day/view controls, stage-grouped list with live/ended states, search, comedy group"
```

---

### Task 15: Lineup — stage timeline grid

**Files:**
- Replace: `apps/festival/src/features/lineup/LineupGrid.tsx`
- Test: `apps/festival/src/features/lineup/LineupGrid.test.tsx`

**Interfaces:**
- Consumes: `useContent`, `useContentIndex`, `usePlanStore`, `groupByStage`, `time.ts`.
- Produces: `LineupGrid({ dayId, now })`, `gridLayout(sets, pxPerHour): { startMs, hours: Date[], left(set), width(set) }` (pure helper exported for tests).

- [ ] **Step 1: Write the failing test**

`apps/festival/src/features/lineup/LineupGrid.test.tsx`:
```tsx
import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { Content } from "@bb/shared";
import bundled from "@/data/bundled.json";
import { renderAt } from "@/test/render";
import { useUiStore } from "@/state/ui";
import { usePlanStore } from "@/state/plan";
import { gridLayout } from "./LineupGrid";

const content = Content.parse(bundled);

describe("gridLayout", () => {
  it("starts on the hour before the first set and positions blocks by minutes", () => {
    const sat = content.sets.filter((s) => s.dayId === "sat");
    const g = gridLayout(sat, 72);
    expect(new Date(g.startMs).toISOString()).toBe("2026-09-19T18:00:00.000Z"); // 12:00 PM MDT
    const mussel = sat.find((s) => s.id === "sat-charlie-musselwhite-ga20-main-1630")!;
    expect(g.left(mussel)).toBe(4.5 * 72);
    expect(g.width(mussel)).toBeCloseTo((70 / 60) * 72 - 4, 5);
    expect(g.hours.length).toBe(10); // 12 PM … 9 PM
  });
});

describe("LineupGrid", () => {
  beforeEach(() => {
    useUiStore.setState({ devNow: "2026-09-19T15:40:00-06:00", lineupView: "grid" });
    usePlanStore.setState({ favorites: ["sat-charlie-musselwhite-ga20-main-1630"] });
  });
  it("renders a lane per stage, a now line, and favorited blocks", async () => {
    renderAt("/lineup");
    expect(await screen.findByTestId("now-line")).toBeInTheDocument();
    expect(screen.getAllByTestId(/^lane-/).length).toBe(4);
    const block = screen.getByRole("button", { name: /Charlie Musselwhite & GA-20/ });
    expect(block).toHaveAttribute("data-favorite", "true");
    fireEvent.click(block);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -w @bb/festival -- LineupGrid`
Expected: FAIL — `gridLayout` is not exported.

- [ ] **Step 3: Implement**

`apps/festival/src/features/lineup/LineupGrid.tsx`:
```tsx
import { useRef } from "react";
import type { DayId, FestivalSet } from "@bb/shared";
import { useNavigate } from "react-router";
import { Button, Eyebrow } from "@/design";
import { useContent, useContentIndex } from "@/data/content";
import { groupByStage, isEnded } from "@/domain/schedule";
import { formatTime } from "@/domain/time";
import { usePlanStore } from "@/state/plan";

const HOUR = 3_600_000;
const LABEL_W = 70;
const BLOCK_GAP = 4;

export function gridLayout(sets: FestivalSet[], pxPerHour: number) {
  const starts = sets.map((s) => Date.parse(s.start)), ends = sets.map((s) => Date.parse(s.end));
  const first = Math.min(...starts), last = Math.max(...ends);
  const startMs = Math.floor(first / HOUR) * HOUR;
  const endMs = Math.ceil(last / HOUR) * HOUR;
  const hours: Date[] = [];
  for (let t = startMs; t < endMs; t += HOUR) hours.push(new Date(t));
  return {
    startMs, endMs, hours,
    left: (s: FestivalSet) => ((Date.parse(s.start) - startMs) / HOUR) * pxPerHour,
    width: (s: FestivalSet) => ((Date.parse(s.end) - Date.parse(s.start)) / HOUR) * pxPerHour - BLOCK_GAP,
    x: (ms: number) => ((ms - startMs) / HOUR) * pxPerHour,
  };
}

const STAGE_BG = { sky: "bg-sky", plum: "bg-plum", pine: "bg-pine", violet: "bg-violet" } as const;

export function LineupGrid({ dayId, now }: { dayId: DayId; now: Date }) {
  const content = useContent();
  const idx = useContentIndex();
  const navigate = useNavigate();
  const favorites = usePlanStore((s) => s.favorites);
  const scroller = useRef<HTMLDivElement>(null);
  const pxPerHour = 72;
  const sets = idx.setsByDay[dayId];
  if (sets.length === 0) return <p className="mt-6 text-center text-fg-soft">No sets published for this day yet.</p>;
  const g = gridLayout(sets, pxPerHour);
  const groups = groupByStage(sets, content.stages);
  const nowMs = now.getTime();
  const showNow = nowMs >= g.startMs && nowMs <= g.endMs;
  const jump = () => scroller.current?.scrollTo({ left: Math.max(0, g.x(nowMs) - 120), behavior: "smooth" });
  return (
    <div className="mt-3">
      <div className="mb-2 flex items-center justify-between px-0.5">
        <Eyebrow tone="structure">Stage timeline · scroll →</Eyebrow>
        {showNow && <Button variant="sun" size="sm" onClick={jump}>● Jump to now</Button>}
      </div>
      <div className="flex overflow-hidden rounded-card border border-hair bg-surface">
        <div className="shrink-0" style={{ width: LABEL_W }}>
          <div className="h-7 border-b border-hair" />
          {groups.map((grp) => <div key={grp.stage.id} className="micro flex h-16 items-start border-b border-r border-hair px-1.5 pt-2 text-fg-soft last:border-b-0">{grp.stage.shortName}</div>)}
        </div>
        <div ref={scroller} className="relative flex-1 overflow-x-auto">
          <div className="relative" style={{ width: g.hours.length * pxPerHour }}>
            <div className="flex h-7 border-b border-hair text-[11px] font-semibold text-fg-soft">
              {g.hours.map((h) => <div key={h.getTime()} style={{ width: pxPerHour }} className="px-1 py-1.5 tabular-nums">{formatTime(h).replace(":00", "")}</div>)}
            </div>
            {groups.map((grp) => (
              <div key={grp.stage.id} data-testid={`lane-${grp.stage.id}`} className="relative h-16 border-b border-hair last:border-b-0">
                {grp.sets.map((s) => {
                  const artist = idx.artistsById.get(s.artistId)!;
                  const fav = favorites.includes(s.id);
                  return (
                    <button key={s.id} type="button" data-favorite={fav} onClick={() => navigate(`/lineup/artist/${artist.id}`)}
                      aria-label={`${artist.name}, ${formatTime(new Date(s.start))}, ${grp.stage.name}`}
                      style={{ left: g.left(s), width: g.width(s) }}
                      className={`absolute top-2 h-12 overflow-hidden rounded-[10px] px-2 py-1 text-left text-[12px] font-semibold leading-[14px] text-white ${STAGE_BG[grp.stage.color]} ${fav ? "outline outline-2 -outline-offset-2 outline-sun" : ""} ${isEnded(s, now) ? "opacity-60" : ""}`}>
                      <span className="block truncate">{artist.name}</span>
                      <span className="block text-[10px] font-normal opacity-85 tabular-nums">{formatTime(new Date(s.start))}{fav ? " ♥" : ""}</span>
                    </button>
                  );
                })}
              </div>
            ))}
            {showNow && (
              <div data-testid="now-line" aria-hidden="true" className="absolute bottom-0 top-7 w-0.5 bg-sun" style={{ left: g.x(nowMs) }}>
                <span className="absolute -left-[5px] -top-[5px] h-3 w-3 rounded-chip border-2 border-ink bg-sun" />
              </div>
            )}
          </div>
        </div>
      </div>
      <p className="mt-2 text-[13px] text-fg-soft">Favorited sets are rimmed in sun. Tap a block for the artist.</p>
    </div>
  );
}
```

- [ ] **Step 4: Run tests and look**

Run: `npm test -w @bb/festival -- LineupGrid && npm run typecheck -w @bb/festival`
Expected: 2 tests pass.

Run: `npm run dev` → Lineup → Grid at Sat 3:40 PM. "Jump to now" scrolls to the sun line. Compare with `screens.html` frame 3. Stop the server.

- [ ] **Step 5: Commit**

```bash
git add apps/festival/src/features/lineup/LineupGrid.tsx apps/festival/src/features/lineup/LineupGrid.test.tsx
git commit -m "feat(lineup): horizontal stage timeline grid with now line, favorites rim, jump to now"
```

---

### Task 16: Artist sheet (route `/lineup/artist/:id`)

**Files:**
- Replace: `apps/festival/src/features/lineup/ArtistSheet.tsx`
- Test: `apps/festival/src/features/lineup/ArtistSheet.test.tsx`

**Interfaces:**
- Consumes: `Sheet`, `Heart`, `Chip`, `Button`, `useContentIndex`, `usePlanStore`, `time.ts`.

- [ ] **Step 1: Write the failing test**

`apps/festival/src/features/lineup/ArtistSheet.test.tsx`:
```tsx
import { fireEvent, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { renderAt } from "@/test/render";
import { useUiStore } from "@/state/ui";
import { usePlanStore } from "@/state/plan";

describe("ArtistSheet", () => {
  beforeEach(() => {
    useUiStore.setState({ devNow: "2026-09-19T15:40:00-06:00" });
    usePlanStore.setState({ favorites: [], reminders: [] });
  });

  it("lists every set for the artist and toggles plan membership", async () => {
    renderAt("/lineup/artist/nigel-wearne");
    const dialog = await screen.findByRole("dialog", { name: /nigel wearne/i });
    expect(within(dialog).getAllByRole("button", { name: /^favorite/i }).length).toBe(3);
    expect(within(dialog).getByText(/Fri/)).toBeInTheDocument();
    fireEvent.click(within(dialog).getAllByRole("button", { name: /^favorite/i })[1]!);
    expect(usePlanStore.getState().favorites).toEqual(["sat-nigel-wearne-camp-1230"]);
  });

  it("offers a single-set add button and a reminder once added", async () => {
    renderAt("/lineup/artist/nether-hour");
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: /add to plan/i }));
    expect(usePlanStore.getState().favorites).toEqual(["sat-nether-hour-main-1500"]);
    fireEvent.click(within(dialog).getByRole("switch", { name: /remind me/i }));
    expect(usePlanStore.getState().reminders).toEqual(["sat-nether-hour-main-1500"]);
  });

  it("shows comedy acts without sets", async () => {
    renderAt("/lineup/artist/baron-vaughn");
    expect(await screen.findByText(/set times will be announced by the festival/i)).toBeInTheDocument();
  });

  it("closes back to the lineup", async () => {
    const { router } = renderAt("/lineup/artist/eggy");
    await screen.findByRole("dialog");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(router.state.location.pathname).toBe("/lineup");
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -w @bb/festival -- ArtistSheet`
Expected: FAIL.

- [ ] **Step 3: Implement**

`apps/festival/src/features/lineup/ArtistSheet.tsx`:
```tsx
import { useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import { Button, Chip, Eyebrow, Heart, Sheet, Toggle } from "@/design";
import { useFestivalClock } from "@/app/clock";
import { useContent, useContentIndex } from "@/data/content";
import { formatRange, parseIso } from "@/domain/time";
import { usePlanStore } from "@/state/plan";

const TIER_LABEL = { headliner: "Headliner", featured: "Featured", lineup: "Lineup", comedy: "Comedy", musicmaker: "Music Maker Foundation" } as const;

export function ArtistSheet() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const onClose = useCallback(() => navigate("/lineup"), [navigate]);
  const { now } = useFestivalClock();
  const content = useContent();
  const idx = useContentIndex();
  const { favorites, reminders, toggleFavorite, toggleReminder, settings } = usePlanStore();
  const artist = idx.artistsById.get(id);
  if (!artist) return <Sheet onClose={onClose} title="Artist"><p className="py-6 text-center text-fg-soft">Artist not found.</p></Sheet>;
  const sets = idx.setsByArtist.get(artist.id) ?? [];
  const single = sets.length === 1 ? sets[0] : undefined;
  const inPlan = single ? favorites.includes(single.id) : false;
  const dayLabel = (dayId: string) => content.festival.days.find((d) => d.id === dayId)?.label.slice(0, 3) ?? dayId;
  const share = async () => {
    const lines = sets.map((s) => `${dayLabel(s.dayId)} ${formatRange(parseIso(s.start), parseIso(s.end))} · ${idx.stagesById.get(s.stageId)?.name}`);
    const text = `${artist.name} — ${content.festival.name}\n${lines.join("\n")}\n${content.festival.links.lineup}`;
    if (navigator.share) await navigator.share({ text }); else await navigator.clipboard?.writeText(text);
  };
  return (
    <Sheet onClose={onClose} title={artist.name}>
      <Eyebrow tone="structure">Artist</Eyebrow>
      <h2 className="mt-0.5 font-display text-[24px] leading-7">{artist.name}</h2>
      <div className="mt-1.5"><Chip tone={artist.tier === "headliner" ? "sun" : "paper"}>{TIER_LABEL[artist.tier]}</Chip></div>
      <div className="mt-2">
        {sets.length === 0 && <p className="py-4 text-[15px] text-fg-soft">Set times will be announced by the festival.</p>}
        {sets.map((s) => {
          const stage = idx.stagesById.get(s.stageId)!;
          const start = parseIso(s.start);
          return (
            <div key={s.id} className="flex items-center gap-3 border-b border-hair py-2.5 last:border-b-0">
              <span className="w-16 shrink-0 text-[14px] font-semibold text-fg-soft tabular-nums">{dayLabel(s.dayId)} {formatRange(start, parseIso(s.end)).split(" – ")[0]}</span>
              <span className="min-w-0 flex-1 text-[15px] font-semibold">{stage.name}<span className="block text-[13px] font-normal text-fg-soft tabular-nums">{formatRange(start, parseIso(s.end))}</span></span>
              <Chip tone={stage.color}>{stage.shortName}</Chip>
              <Heart on={favorites.includes(s.id)} onToggle={() => toggleFavorite(s.id)} label={`Favorite ${artist.name}, ${dayLabel(s.dayId)} ${formatRange(start, parseIso(s.end))}, ${stage.name}`} />
            </div>
          );
        })}
      </div>
      {single && (
        <div className="mt-3 flex items-center gap-2">
          <Button variant={inPlan ? "ghost" : "sun"} className="flex-1" onClick={() => toggleFavorite(single.id)}>{inPlan ? "✓ In your plan" : "Add to plan"}</Button>
          {inPlan && (
            <label className="flex items-center gap-2 text-[14px]"><span>Remind me {settings.leadMinutes} min before</span><Toggle on={reminders.includes(single.id)} onChange={() => toggleReminder(single.id)} label="Remind me" /></label>
          )}
        </div>
      )}
      <div className="mt-3 flex gap-2">
        <Button size="sm" onClick={share}>Share ↗</Button>
        <a className="inline-flex h-9 items-center rounded-[10px] border-[1.5px] border-hair px-3.5 text-[14px] font-semibold text-structure-2" href={content.festival.links.lineup} target="_blank" rel="noreferrer">Official lineup ↗</a>
      </div>
      <p className="mt-3 text-[12px] text-fg-soft">Times shown in Telluride (Mountain) time. Now: {formatRange(now, now).split(" – ")[0]}</p>
    </Sheet>
  );
}
```

- [ ] **Step 4: Run tests and look**

Run: `npm test -w @bb/festival -- ArtistSheet && npm run typecheck -w @bb/festival`
Expected: 4 tests pass.

Run: `npm run dev`; tap a Lineup row and a grid block; Escape / backdrop / browser back all return to `/lineup`. Stop the server.

- [ ] **Step 5: Commit**

```bash
git add apps/festival/src/features/lineup/ArtistSheet.tsx apps/festival/src/features/lineup/ArtistSheet.test.tsx
git commit -m "feat(lineup): route-driven artist sheet with all sets, plan/reminder toggles, share"
```

---

### Task 17: Plan screen — timeline, conflicts, swap, next-up, settings, export, share, empty state

**Files:**
- Replace: `apps/festival/src/features/plan/PlanScreen.tsx`
- Create: `apps/festival/src/features/plan/PlanTimeline.tsx`, `apps/festival/src/features/plan/PlanSettings.tsx`, `apps/festival/src/features/plan/PlanEmpty.tsx`, `apps/festival/src/features/plan/download.ts`
- Test: `apps/festival/src/features/plan/PlanScreen.test.tsx`

**Interfaces:**
- Consumes: `detectConflicts`, `keptSet`, `lostSetIds`, `nextUp`, `leaveBy`, `planToIcs`, `planToText`, primitives, `RainbowArch`, `Columbine`.
- Produces: `downloadText(filename, mime, text)`.

- [ ] **Step 1: Write the failing tests**

`apps/festival/src/features/plan/PlanScreen.test.tsx`:
```tsx
import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { renderAt } from "@/test/render";
import { useUiStore } from "@/state/ui";
import { usePlanStore } from "@/state/plan";

const MUSSEL = "sat-charlie-musselwhite-ga20-main-1630";
const ALBERT = "sat-albert-white-blues-1730";
const TAJ = "sat-taj-mahal-keb-mo-main-2000";

describe("Plan", () => {
  beforeEach(() => {
    useUiStore.setState({ devNow: "2026-09-19T15:40:00-06:00" });
    usePlanStore.setState({ favorites: [], resolutions: {}, reminders: [], settings: { leadMinutes: 15, bufferMinutes: 10 } });
  });

  it("empty state invites the user with headliner quick-adds", async () => {
    renderAt("/plan");
    expect(await screen.findByText(/your weekend starts here/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /favorite marcus king band/i }));
    expect(usePlanStore.getState().favorites).toEqual(["fri-marcus-king-band-main-2000"]);
  });

  it("shows the Saturday overlap as a braided pair and swaps", async () => {
    usePlanStore.setState({ favorites: [MUSSEL, ALBERT, TAJ] });
    renderAt("/plan");
    expect(await screen.findByText(/overlaps 10 min/i)).toBeInTheDocument();
    expect(screen.getByText(/1 conflict/i)).toBeInTheDocument();
    expect(screen.getByText(/next up/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /swap/i }));
    expect(usePlanStore.getState().resolutions).toEqual({ [`${ALBERT}|${MUSSEL}`]: ALBERT });
    expect(screen.getByText(/keeping albert white/i)).toBeInTheDocument();
  });

  it("day control carries per-day counts", async () => {
    usePlanStore.setState({ favorites: [MUSSEL, "fri-eggy-main-1500"] });
    renderAt("/plan");
    expect(await screen.findByRole("radio", { name: /fri 1/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /sat 1/i })).toBeChecked();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -w @bb/festival -- PlanScreen`
Expected: FAIL.

- [ ] **Step 3: Helpers, settings sheet, empty state**

`apps/festival/src/features/plan/download.ts`:
```ts
/** Web download of generated text. Native builds replace this with a share sheet later. */
export function downloadText(filename: string, mime: string, text: string): void {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
```

`apps/festival/src/features/plan/PlanSettings.tsx`:
```tsx
import { Eyebrow, SegmentedControl, Sheet } from "@/design";
import { usePlanStore } from "@/state/plan";

export function PlanSettings({ onClose }: { onClose: () => void }) {
  const { settings, setSettings } = usePlanStore();
  return (
    <Sheet onClose={onClose} title="Plan settings">
      <h2 className="font-display text-[24px] leading-7">Plan settings</h2>
      <div className="mt-4 space-y-4">
        <div><Eyebrow tone="structure">Remind me before a set</Eyebrow><div className="mt-2"><SegmentedControl label="Reminder lead time" value={String(settings.leadMinutes)} onChange={(v) => setSettings({ leadMinutes: Number(v) as 5 | 15 | 30 })} options={[{ value: "5", label: "5 min" }, { value: "15", label: "15 min" }, { value: "30", label: "30 min" }]} /></div></div>
        <div><Eyebrow tone="structure">Buffer between stages</Eyebrow><div className="mt-2"><SegmentedControl label="Buffer" value={String(settings.bufferMinutes)} onChange={(v) => setSettings({ bufferMinutes: Number(v) as 0 | 10 | 20 })} options={[{ value: "0", label: "None" }, { value: "10", label: "10 min" }, { value: "20", label: "20 min" }]} /></div><p className="mt-1.5 text-[13px] text-fg-soft">Sets closer together than this are flagged so you have time to walk over.</p></div>
      </div>
    </Sheet>
  );
}
```

`apps/festival/src/features/plan/PlanEmpty.tsx`:
```tsx
import { Columbine, Heart, RainbowArch } from "@/design";
import { useContent, useContentIndex } from "@/data/content";
import { headliners } from "@/domain/schedule";
import { formatTime, parseIso } from "@/domain/time";
import { usePlanStore } from "@/state/plan";

export function PlanEmpty() {
  const content = useContent();
  const idx = useContentIndex();
  const { favorites, toggleFavorite } = usePlanStore();
  return (
    <div className="mt-4">
      <div className="relative overflow-hidden rounded-hero bg-night px-6 pb-6 pt-24 text-center">
        <RainbowArch />
        <div className="relative"><Columbine size={56} className="mx-auto" /><div className="mt-2 font-display text-[24px] leading-7 text-paper">Your weekend starts here</div><p className="mt-1 text-[15px] text-paper/80">Tap the heart on any set and it lands in your plan.</p></div>
      </div>
      <div className="mt-4 space-y-2">
        {headliners(content.artists).map((a) => {
          const set = idx.setsByArtist.get(a.id)?.[0];
          if (!set) return null;
          const stage = idx.stagesById.get(set.stageId)!;
          return (
            <div key={a.id} className="flex items-center gap-3 rounded-card border border-hair bg-surface px-4 py-3">
              <div className="min-w-0 flex-1"><div className="font-display text-[20px] leading-6">{a.name}</div><div className="text-[14px] text-fg-soft tabular-nums">{content.festival.days.find((d) => d.id === set.dayId)?.label.slice(0, 3)} · {formatTime(parseIso(set.start))} · {stage.name}</div></div>
              <Heart on={favorites.includes(set.id)} onToggle={() => toggleFavorite(set.id)} label={`Favorite ${a.name}`} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Timeline and screen**

`apps/festival/src/features/plan/PlanTimeline.tsx`:
```tsx
import type { FestivalSet } from "@bb/shared";
import { Link } from "react-router";
import { Button, Chip, Toggle } from "@/design";
import { useContentIndex } from "@/data/content";
import { detectConflicts, keptSet, type Conflict } from "@/domain/conflicts";
import { isEnded } from "@/domain/schedule";
import { formatRange, formatTime, parseIso } from "@/domain/time";
import { usePlanStore } from "@/state/plan";

function SetCardRow({ set, lost, conflict, now, onSwap }: { set: FestivalSet; lost: boolean; conflict?: Conflict; now: Date; onSwap?: () => void }) {
  const idx = useContentIndex();
  const { reminders, toggleReminder, settings } = usePlanStore();
  const artist = idx.artistsById.get(set.artistId)!, stage = idx.stagesById.get(set.stageId)!;
  const ended = isEnded(set, now);
  const other = conflict ? (conflict.a.id === set.id ? conflict.b : conflict.a) : undefined;
  const otherName = other ? idx.artistsById.get(other.artistId)?.name : undefined;
  return (
    <div className={`mb-2.5 rounded-2xl border bg-surface px-3 py-2.5 shadow-card ${lost ? "border-dashed border-hair opacity-60" : conflict ? "border-ember shadow-[0_0_0_2px_rgba(212,69,47,.18)]" : "border-hair"} ${artist.tier === "headliner" && !lost ? "bg-gradient-to-r from-sun/20 to-surface" : ""} ${ended ? "opacity-60" : ""}`}>
      <div className="flex items-center gap-2">
        <Link to={`/lineup/artist/${artist.id}`} className="min-w-0 flex-1">
          <span className={`block truncate ${artist.tier === "headliner" ? "font-display text-[17px] leading-5" : "text-[16px] font-semibold leading-5"}`}>{artist.name}</span>
          <span className="block text-[13px] text-fg-soft tabular-nums">{stage.name} · {formatRange(parseIso(set.start), parseIso(set.end))}{ended ? " · ended" : ""}</span>
        </Link>
        {lost ? (
          <Button size="sm" onClick={onSwap}>Swap</Button>
        ) : (
          !ended && <Toggle on={reminders.includes(set.id)} onChange={() => toggleReminder(set.id)} label={`Remind me for ${artist.name}`} />
        )}
      </div>
      {conflict && !lost && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Chip tone="ember">⚠ {conflict.bufferOnly ? `Under ${settings.bufferMinutes} min gap` : `Overlaps ${conflict.overlapMinutes} min`}</Chip>
          <span className="text-[13px] text-fg-soft">with {otherName} — keeping {artist.name}</span>
        </div>
      )}
    </div>
  );
}

export function PlanTimeline({ sets, now }: { sets: FestivalSet[]; now: Date }) {
  const { resolutions, resolve, settings } = usePlanStore();
  const conflicts = detectConflicts(sets, settings.bufferMinutes);
  const conflictFor = (id: string) => conflicts.find((c) => c.a.id === id || c.b.id === id);
  const lostIds = new Set(conflicts.map((c) => (keptSet(c, resolutions).id === c.a.id ? c.b.id : c.a.id)));
  const rendered = new Set<string>();
  return (
    <div className="mt-4">
      {sets.map((s) => {
        if (rendered.has(s.id) || lostIds.has(s.id)) return null;
        rendered.add(s.id);
        const c = conflictFor(s.id);
        const partner = c ? (c.a.id === s.id ? c.b : c.a) : undefined;
        if (partner) rendered.add(partner.id);
        return (
          <div key={s.id} className="relative grid grid-cols-[56px_1fr] gap-2.5">
            <div className="pt-3 text-[13px] font-semibold leading-4 text-fg-soft tabular-nums">{formatTime(parseIso(s.start)).replace(" ", "\n")}</div>
            <span aria-hidden="true" className={`absolute left-[46px] top-4 h-2.5 w-2.5 rounded-chip border-2 border-surface ${c ? "bg-ember" : "bg-sky"}`} />
            <span aria-hidden="true" className="absolute -bottom-3 left-[50px] top-6 w-0.5 bg-hair" />
            <div>
              <SetCardRow set={s} lost={false} conflict={c} now={now} />
              {partner && c && <SetCardRow set={partner} lost conflict={c} now={now} onSwap={() => resolve(c.key, partner.id)} />}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

`apps/festival/src/features/plan/PlanScreen.tsx`:
```tsx
import { useState } from "react";
import { Link } from "react-router";
import { Button, Card, Chip, Eyebrow, SegmentedControl } from "@/design";
import { useFestivalClock } from "@/app/clock";
import { useContent, useContentIndex } from "@/data/content";
import { detectConflicts, leaveBy, nextUp } from "@/domain/conflicts";
import { planToIcs, planToText } from "@/domain/ics";
import { formatRange, formatTime, minutesBetween, parseIso } from "@/domain/time";
import { usePlanStore } from "@/state/plan";
import type { DayId } from "@bb/shared";
import { downloadText } from "./download";
import { PlanEmpty } from "./PlanEmpty";
import { PlanSettings } from "./PlanSettings";
import { PlanTimeline } from "./PlanTimeline";

export function PlanScreen() {
  const { now, state, dayId } = useFestivalClock();
  const content = useContent();
  const idx = useContentIndex();
  const { favorites, resolutions, settings } = usePlanStore();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const mine = favorites.map((id) => idx.setsById.get(id)).filter((s): s is NonNullable<typeof s> => !!s).sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
  const firstDayWithSets = content.festival.days.find((d) => mine.some((s) => s.dayId === d.id))?.id ?? "fri";
  const [day, setDay] = useState<DayId>(state === "live" && dayId ? dayId : firstDayWithSets);
  const daySets = mine.filter((s) => s.dayId === day);
  const conflicts = detectConflicts(daySets, settings.bufferMinutes);
  const next = nextUp(mine, now, resolutions, settings.bufferMinutes);
  const title = (
    <div className="flex items-end justify-between pt-3">
      <h1 className="font-display text-[32px] leading-9 text-structure-2">My Plan</h1>
      <Button size="sm" aria-label="Plan settings" onClick={() => setSettingsOpen(true)}>⚙</Button>
    </div>
  );
  if (mine.length === 0) return <div>{title}<PlanEmpty />{settingsOpen && <PlanSettings onClose={() => setSettingsOpen(false)} />}</div>;
  const exportIcs = () => downloadText("blues-and-brews-plan.ics", "text/calendar", planToIcs(mine, idx.artistsById, idx.stagesById, content.festival));
  const share = async () => {
    const text = planToText(mine, idx.artistsById, idx.stagesById, content.festival);
    if (navigator.share) await navigator.share({ text }); else await navigator.clipboard?.writeText(text);
  };
  return (
    <div>
      {title}
      <div className="mt-2 flex items-center gap-2">
        <SegmentedControl label="Day" value={day} onChange={setDay} options={content.festival.days.map((d) => ({ value: d.id, label: `${d.label.slice(0, 3)} ${mine.filter((s) => s.dayId === d.id).length}` }))} />
        <div className="flex-1" />
        {conflicts.length > 0 && <Chip tone="ember">{conflicts.length} conflict{conflicts.length > 1 ? "s" : ""}</Chip>}
      </div>
      {next && (
        <Card className="mt-3 border-plum bg-gradient-to-br from-surface to-violet/15">
          <Eyebrow tone="plum">Next up · in {minutesBetween(now, parseIso(next.start))} min</Eyebrow>
          <Link to={`/lineup/artist/${next.artistId}`} className="mt-1 block font-display text-[20px] leading-6">{idx.artistsById.get(next.artistId)?.name}</Link>
          <div className="text-[13px] text-fg-soft tabular-nums">{formatRange(parseIso(next.start), parseIso(next.end))} · {idx.stagesById.get(next.stageId)?.name}{settings.bufferMinutes > 0 ? ` · leave by ${formatTime(leaveBy(next, settings.bufferMinutes))}` : ""}</div>
        </Card>
      )}
      {daySets.length === 0 ? <p className="mt-6 text-center text-fg-soft">Nothing planned for this day yet.</p> : <PlanTimeline sets={daySets} now={now} />}
      <div className="mt-2 flex gap-2"><Button size="sm" className="flex-1" onClick={exportIcs}>Add to calendar</Button><Button size="sm" className="flex-1" onClick={share}>Share as text</Button></div>
      {settingsOpen && <PlanSettings onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
```

- [ ] **Step 5: Run tests and look**

Run: `npm test -w @bb/festival -- PlanScreen && npm run typecheck -w @bb/festival`
Expected: 3 tests pass. (jsdom lacks `URL.createObjectURL`; the export button is not clicked in tests.)

Run: `npm run dev`; favorite Musselwhite + Albert White + Taj on Saturday; open Plan; Swap; change buffer to 20 in settings and watch Derrick Dove (5:40 Truck) become a buffer-only conflict if favorited; "Add to calendar" downloads an `.ics` that opens in Calendar with the right Mountain times. Compare with `screens.html` frame 4. Stop the server.

- [ ] **Step 6: Commit**

```bash
git add apps/festival/src/features/plan
git commit -m "feat(plan): favorites timeline with braided conflicts + swap, next-up with leave-by, settings, ics export, share, empty state"
```

---

### Task 18: Alerts screen

**Files:**
- Replace: `apps/festival/src/features/alerts/AlertsScreen.tsx`
- Test: `apps/festival/src/features/alerts/AlertsScreen.test.tsx`

**Interfaces:**
- Consumes: `useAlerts`, `useAlertsStore`, `useFestivalClock`, `Card`, `Chip`, `Eyebrow`, `Button`, `time.ts`. Route `/alerts/:id` expands and marks that alert read (matched with `useMatch`, since the child route renders nothing itself).

- [ ] **Step 1: Write the failing tests**

`apps/festival/src/features/alerts/AlertsScreen.test.tsx`:
```tsx
import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { renderAt } from "@/test/render";
import { useUiStore } from "@/state/ui";
import { useAlertsStore } from "@/state/alerts";

describe("Alerts", () => {
  beforeEach(() => {
    useUiStore.setState({ devNow: "2026-09-19T15:40:00-06:00" });
    useAlertsStore.setState({ readIds: [], pushOptIn: false });
  });

  it("lists alerts newest first with severity labels and an opt-in card", async () => {
    renderAt("/alerts");
    const titles = (await screen.findAllByTestId("alert-title")).map((n) => n.textContent);
    expect(titles[0]).toMatch(/Lightning hold/);
    expect(titles.at(-1)).toMatch(/Gates open at 11:30/);
    expect(screen.getByText("Urgent")).toBeInTheDocument();
    expect(screen.getByText(/get alerts on your lock screen/i)).toBeInTheDocument();
  });

  it("expanding an alert marks it read; the opt-in card hides once enabled", async () => {
    renderAt("/alerts");
    fireEvent.click((await screen.findAllByTestId("alert-title"))[1]!);
    expect(useAlertsStore.getState().readIds).toEqual(["fx-004"]);
    fireEvent.click(screen.getByRole("button", { name: /enable/i }));
    expect(screen.queryByText(/get alerts on your lock screen/i)).toBeNull();
  });

  it("deep link opens and reads the alert", async () => {
    renderAt("/alerts/fx-003");
    expect(await screen.findByText(/bring your glass/i)).toBeInTheDocument();
    expect(useAlertsStore.getState().readIds).toEqual(["fx-003"]);
  });

  it("hides alerts from the future and shows the quiet state", async () => {
    useUiStore.setState({ devNow: "2026-09-17T18:00:00-06:00" });
    renderAt("/alerts");
    expect(await screen.findByText(/all quiet in town park/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -w @bb/festival -- AlertsScreen`
Expected: FAIL.

- [ ] **Step 3: Implement**

`apps/festival/src/features/alerts/AlertsScreen.tsx`:
```tsx
import { useEffect, useState } from "react";
import { useMatch, useNavigate } from "react-router";
import type { Alert } from "@bb/shared";
import { Button, Card, Chip, Eyebrow } from "@/design";
import { useFestivalClock } from "@/app/clock";
import { useAlerts } from "@/data/alerts";
import { formatTime, parseIso, toDenverParts } from "@/domain/time";
import { useAlertsStore } from "@/state/alerts";

const SEV = {
  info: { bar: "border-l-sky", tone: "sky" as const, label: "Info" },
  important: { bar: "border-l-sun", tone: "sun" as const, label: "Important" },
  urgent: { bar: "border-l-ember", tone: "ember" as const, label: "Urgent" },
};

function AlertCard({ alert, expanded, unread, onToggle }: { alert: Alert; expanded: boolean; unread: boolean; onToggle: () => void }) {
  const sev = SEV[alert.severity];
  return (
    <Card className={`border-l-[5px] ${sev.bar} ${expanded ? "" : "py-3"}`}>
      <button type="button" onClick={onToggle} aria-expanded={expanded} className="flex w-full items-center gap-2 text-left">
        {unread && <span aria-label="Unread" className="h-2 w-2 shrink-0 rounded-chip bg-ember" />}
        <b data-testid="alert-title" className="min-w-0 flex-1 text-[16px] leading-5">{alert.title}</b>
        <Eyebrow>{formatTime(parseIso(alert.publishedAt))}</Eyebrow>
      </button>
      {expanded && (
        <div className="mt-2">
          <Chip tone={sev.tone}>{sev.label}</Chip>
          <p className="mt-2 text-[15px] leading-5 text-fg-soft">{alert.body}</p>
          {alert.url && <a href={alert.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex h-9 items-center rounded-[10px] border-[1.5px] border-hair px-3.5 text-[14px] font-semibold text-structure-2">Details ↗</a>}
        </div>
      )}
    </Card>
  );
}

export function AlertsScreen() {
  const { now } = useFestivalClock();
  const navigate = useNavigate();
  const match = useMatch("/alerts/:id");
  const routeId = match?.params.id ?? null;
  const all = useAlerts().filter((a) => Date.parse(a.publishedAt) <= now.getTime());
  const { readIds, pushOptIn, markRead, setPushOptIn } = useAlertsStore();
  const [expandedId, setExpandedId] = useState<string | null>(routeId);
  useEffect(() => { if (routeId) { setExpandedId(routeId); markRead(routeId); } }, [routeId, markRead]);
  const toggle = (id: string) => {
    const next = expandedId === id ? null : id;
    setExpandedId(next);
    if (next) markRead(next);
    if (routeId && next !== routeId) navigate("/alerts", { replace: true });
  };
  const todayKey = toDenverParts(now).dateKey;
  const groups = new Map<string, Alert[]>();
  for (const a of all) {
    const p = toDenverParts(parseIso(a.publishedAt));
    const key = p.dateKey === todayKey ? "Today" : `${p.weekday}`;
    groups.set(key, [...(groups.get(key) ?? []), a]);
  }
  const latest = all[0];
  return (
    <div className="pt-3">
      <h1 className="font-display text-[32px] leading-9 text-structure-2">Alerts</h1>
      <Eyebrow>From the festival{latest ? ` · updated ${formatTime(parseIso(latest.publishedAt))}` : ""}</Eyebrow>
      {!pushOptIn && (
        <Card className="mt-3.5 flex items-center gap-3 bg-gradient-to-br from-surface to-sky/10">
          <div className="min-w-0 flex-1"><div className="text-[15px] font-semibold leading-5">Get alerts on your lock screen</div><div className="text-[13px] text-fg-soft">Weather holds, schedule changes, gate news.</div></div>
          <Button variant="ink" size="sm" onClick={() => setPushOptIn(true)}>Enable</Button>
        </Card>
      )}
      {all.length === 0 && (
        <Card className="mt-6 py-8 text-center"><div className="font-display text-[20px] leading-6">All quiet in Town Park</div><p className="mt-1 text-[14px] text-fg-soft">Festival updates will appear here.</p></Card>
      )}
      {[...groups.entries()].map(([label, items]) => (
        <section key={label} className="mt-4">
          <Eyebrow tone="structure">{label} · {items.length} alert{items.length > 1 ? "s" : ""}</Eyebrow>
          <div className="mt-1.5 space-y-2.5">
            {items.map((a) => <AlertCard key={a.id} alert={a} expanded={expandedId === a.id} unread={!readIds.includes(a.id)} onToggle={() => toggle(a.id)} />)}
          </div>
        </section>
      ))}
      <p className="mt-6 text-center text-[12px] text-fg-soft">Push notifications arrive with the native app. Until then, this inbox is the source.</p>
    </div>
  );
}
```

- [ ] **Step 4: Run tests and look**

Run: `npm test -w @bb/festival -- AlertsScreen && npm run typecheck -w @bb/festival`
Expected: 4 tests pass.

Run: `npm run dev` → `/alerts` at Sat 3:40 PM; the Alerts tab badge drops as you expand cards. Compare with `screens.html` frame 5. Stop the server.

- [ ] **Step 5: Commit**

```bash
git add apps/festival/src/features/alerts
git commit -m "feat(alerts): inbox with severity bars, read state, deep-link expand, push opt-in card, quiet state"
```

---

### Task 19: Info screen

**Files:**
- Replace: `apps/festival/src/features/info/InfoScreen.tsx`
- Test: `apps/festival/src/features/info/InfoScreen.test.tsx`

**Interfaces:**
- Consumes: `useContent`, `useUiStore` (theme), `usePlanStore` (settings), `useAlertsStore` (pushOptIn), `Card`, `Eyebrow`, `SegmentedControl`, `Toggle`.

- [ ] **Step 1: Write the failing test**

`apps/festival/src/features/info/InfoScreen.test.tsx`:
```tsx
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderAt } from "@/test/render";
import { useUiStore } from "@/state/ui";

describe("Info", () => {
  it("shows festival facts, official links, settings and provenance", async () => {
    renderAt("/info");
    expect(await screen.findByText(/11:30 AM daily/)).toBeInTheDocument();
    expect(screen.getByText(/8,750 ft/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /tellurideblues.com/i })).toHaveAttribute("href", "https://www.tellurideblues.com");
    expect(screen.getByText(/Content v2026\.09\.09\.1/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: "Dark" }));
    expect(useUiStore.getState().theme).toBe("dark");
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -w @bb/festival -- InfoScreen`
Expected: FAIL.

- [ ] **Step 3: Implement**

`apps/festival/src/features/info/InfoScreen.tsx`:
```tsx
import { useState } from "react";
import { Card, Eyebrow, SegmentedControl, Toggle } from "@/design";
import { useContent } from "@/data/content";
import { formatTime, fromDenver, parseIso } from "@/domain/time";
import { useAlertsStore } from "@/state/alerts";
import { usePlanStore } from "@/state/plan";
import { useUiStore } from "@/state/ui";

const FONTS = [
  ["Bungee", "SIL Open Font License 1.1"], ["Bungee Shade", "SIL Open Font License 1.1"],
  ["Michroma", "SIL Open Font License 1.1"], ["DM Sans", "SIL Open Font License 1.1"],
];

function Row({ label, children, href }: { label: string; children?: React.ReactNode; href?: string }) {
  const inner = <><span className="flex-1 text-[15px]">{label}</span><span className="text-[14px] text-fg-soft">{children}</span></>;
  return href ? (
    <a href={href} target="_blank" rel="noreferrer" className="flex items-center gap-3 border-b border-hair py-3 last:border-b-0">{inner}</a>
  ) : (
    <div className="flex items-center gap-3 border-b border-hair py-3 last:border-b-0">{inner}</div>
  );
}

export function InfoScreen() {
  const { festival, meta } = useContent();
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  const { settings, setSettings } = usePlanStore();
  const { pushOptIn, setPushOptIn } = useAlertsStore();
  const [licenses, setLicenses] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const first = festival.days[0]!, last = festival.days[festival.days.length - 1]!;
  return (
    <div className="pt-3">
      <h1 className="font-display text-[32px] leading-9 text-structure-2">Info</h1>
      <Card padded={false} className="mt-2.5 overflow-hidden">
        <div className="bg-night px-4 pb-2.5 pt-3.5 text-center"><img src="/art/dates.png" alt={`September ${Number(first.date.slice(8))}–${Number(last.date.slice(8))}, ${festival.year}`} className="mx-auto w-[80%]" /></div>
        <div className="px-4">
          <Row label="Gates">{formatTime(fromDenver(first.date, first.gatesOpen))} daily</Row>
          <Row label="Venue">{festival.venue}</Row>
          <Row label="Altitude">{festival.altitudeFt.toLocaleString()} ft — hydrate</Row>
        </div>
      </Card>

      <Eyebrow tone="structure" className="mt-4 block px-0.5">Official links</Eyebrow>
      <Card padded={false} className="mt-1.5 px-4 py-1">
        <Row label="tellurideblues.com" href={festival.links.site}>↗</Row>
        <Row label="Lineup" href={festival.links.lineup}>↗</Row>
        <Row label="Schedule" href={festival.links.schedule}>↗</Row>
        <Row label="FAQ" href={festival.links.faq}>↗</Row>
        <Row label="Festival guide" href={festival.links.guide}>↗</Row>
        <Row label="Town Park in Maps" href={`https://maps.apple.com/?q=${encodeURIComponent(`${festival.venue}, ${festival.city}`)}`}>↗</Row>
      </Card>

      <Eyebrow tone="structure" className="mt-4 block px-0.5">Settings</Eyebrow>
      <Card padded={false} className="mt-1.5 px-4 py-1">
        <Row label="Festival alerts"><Toggle on={pushOptIn} onChange={setPushOptIn} label="Festival alerts" /></Row>
        <Row label="Set reminders"><SegmentedControl label="Reminder lead time" value={String(settings.leadMinutes)} onChange={(v) => setSettings({ leadMinutes: Number(v) as 5 | 15 | 30 })} options={[{ value: "5", label: "5" }, { value: "15", label: "15" }, { value: "30", label: "30" }]} /></Row>
        <Row label="Appearance"><SegmentedControl label="Appearance" value={theme} onChange={setTheme} options={[{ value: "system", label: "Auto" }, { value: "light", label: "Light" }, { value: "dark", label: "Dark" }]} /></Row>
      </Card>

      <Card className="mt-4 flex items-center gap-3">
        <img src="/art/sbg.png" alt="SBG Productions" className="h-11 w-11 rounded-[10px]" />
        <div className="flex-1 text-[13px] leading-[18px] text-fg-soft">Official app of the {festival.name}<br />© {festival.year} SBG Productions ·{" "}
          <button type="button" className="underline" onClick={() => setPrivacy(!privacy)}>Privacy</button> ·{" "}
          <button type="button" className="underline" onClick={() => setLicenses(!licenses)}>Licenses</button>
        </div>
      </Card>
      {privacy && (
        <Card className="mt-2 text-[14px] leading-5 text-fg-soft">No accounts. No analytics or ads. Your favorites, plan, and settings stay on this device. Festival alerts are delivered by the organizer; enabling notifications later uses Firebase Cloud Messaging solely to deliver them.</Card>
      )}
      {licenses && (
        <Card className="mt-2 text-[14px] leading-5 text-fg-soft">{FONTS.map(([f, l]) => <div key={f}><b className="text-fg">{f}</b> — {l}</div>)}<div className="mt-1">Poster artwork © SBG Productions, used with permission.</div></Card>
      )}
      <p className="mt-4 text-center eyebrow text-fg-soft">Content v{meta.contentVersion} · bundled {formatTime(parseIso(meta.publishedAt))} · offline-ready ✓ · app 0.1.0</p>
    </div>
  );
}
```

- [ ] **Step 4: Run tests and look**

Run: `npm test -w @bb/festival -- InfoScreen && npm run typecheck -w @bb/festival`
Expected: 1 test passes.

Run: `npm run dev` → `/info`; switch Appearance and confirm the whole app re-themes; links open in a new tab. Compare with `screens.html` frame 6. Stop the server.

- [ ] **Step 5: Commit**

```bash
git add apps/festival/src/features/info
git commit -m "feat(info): festival card with dates lockup, official links, settings, credits, provenance"
```

---

### Task 20: Screenshot set, full test run, docs update

**Files:**
- Create: `apps/festival/playwright.config.ts`, `apps/festival/e2e/screenshots.spec.ts`
- Create: `docs/screens/design-pass/*.png` (generated)
- Modify: `docs/HANDOFF.md` (status board + session log), `CLAUDE.md` (commands + layout for this pass)

- [ ] **Step 1: Playwright config and spec**

`apps/festival/playwright.config.ts`:
```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  workers: 1,
  reporter: "list",
  use: { baseURL: "http://localhost:5173", viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, browserName: "chromium" },
  webServer: { command: "npm run dev", url: "http://localhost:5173", reuseExistingServer: true, timeout: 60_000 },
});
```

`apps/festival/e2e/screenshots.spec.ts`:
```ts
import { test } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const OUT = resolve(__dirname, "../../../docs/screens/design-pass");
const CLOCKS = { pre: "2026-09-17T18:00:00-06:00", live: "2026-09-19T15:40:00-06:00", post: "2026-09-21T10:00:00-06:00" } as const;
const THEMES = ["light", "dark"] as const;
const TABS = [["now", "/"], ["lineup-list", "/lineup"], ["plan", "/plan"], ["alerts", "/alerts"], ["info", "/info"], ["artist", "/lineup/artist/charlie-musselwhite-ga20"]] as const;
const FAVORITES = ["sat-charlie-musselwhite-ga20-main-1630", "sat-albert-white-blues-1730", "sat-taj-mahal-keb-mo-main-2000", "fri-marcus-king-band-main-2000"];

test.beforeAll(() => mkdirSync(OUT, { recursive: true }));

for (const theme of THEMES) for (const [clockName, devNow] of Object.entries(CLOCKS)) for (const [name, path] of TABS) {
  test(`${clockName} ${theme} ${name}`, async ({ page }) => {
    await page.addInitScript(([t, now, favs]) => {
      localStorage.setItem("bb-ui", JSON.stringify({ state: { theme: t, devNow: now, lineupView: "list" }, version: 0 }));
      localStorage.setItem("bb-plan", JSON.stringify({ state: { favorites: favs, resolutions: {}, reminders: [], settings: { leadMinutes: 15, bufferMinutes: 10 } }, version: 0 }));
    }, [theme, devNow, FAVORITES] as const);
    await page.goto(path);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${OUT}/${clockName}-${theme}-${name}.png` });
  });
}

test("live light lineup-grid", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("bb-ui", JSON.stringify({ state: { theme: "light", devNow: "2026-09-19T15:40:00-06:00", lineupView: "grid" }, version: 0 }));
  });
  await page.goto("/lineup");
  await page.evaluate(() => document.fonts.ready);
  await page.getByRole("button", { name: /jump to now/i }).click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/live-light-lineup-grid.png` });
});
```

Run once: `npx playwright install chromium` (downloads the browser; ~150 MB).

- [ ] **Step 2: Generate the set**

Run: `npm run screenshots`
Expected: 37 screenshots written to `docs/screens/design-pass/` (36 combinations + the grid), all tests "passed".

Open a few (`open docs/screens/design-pass/live-light-now.png`) and compare against `screens.html`. Fix anything that's clearly off (overlaps, clipped text, unreadable contrast) before continuing; re-run the screenshots after fixes.

- [ ] **Step 3: Full verification**

Run, from the repo root:
```bash
npm test && npm run typecheck && npm run build
```
Expected: content build OK, all Vitest suites green in both workspaces (≈ 45 tests), no type errors, `apps/festival/dist/` produced. Check the built bundle has no external font URLs: `grep -r "fonts.googleapis" apps/festival/dist || echo "no remote fonts"` → `no remote fonts`.

- [ ] **Step 4: Update the docs**

`docs/HANDOFF.md` status board — change these rows:
```
| Repo scaffold | ✅ Sep 9 | npm workspaces: apps/festival, packages/shared, packages/content (`festival-app`) |
| Design tokens + fonts | ✅ | Palette locked D-016; Tailwind v4 theme; Bungee/Bungee Shade/Michroma/DM Sans bundled |
| Content seed | ✅ (bundled) | `packages/content/content-2026.json` from Sep 8 verified data + poster comedy names; Firestore seed still Day 3; re-verify vs official schedule before beta |
| Now / Lineup | ✅ design pass | all states via dev clock; screenshots in `docs/screens/design-pass/` |
| Plan / Alerts / Info / PWA | 🟡 | Plan/Alerts/Info at rough fidelity (alerts from fixture); PWA/service worker not started |
```
Append to the session log:
```
| 2026-09-09 | Claude Code | Design pass implemented per `docs/superpowers/plans/2026-09-09-festival-app-design-pass.md`: tokens, ornaments, primitives, shell, five screens, domain tests, screenshots |
```

`CLAUDE.md` — replace the **Stack** workspace list and **Commands** to match what exists now:
- Stack line ends: `npm workspaces: apps/festival, packages/shared, packages/content (admin console lives in the separate festival-admin repo, D-018).`
- Rules: change `packages/shared/src/time.ts` → `apps/festival/src/domain/time.ts`.
- Commands: `npm run dev · npm test · npm run typecheck · npm run build · npm run content:build · npm run screenshots` (the Firebase/Capacitor commands return when those days land).

- [ ] **Step 5: Commit and push**

```bash
git add apps/festival/playwright.config.ts apps/festival/e2e docs/screens docs/HANDOFF.md CLAUDE.md
git commit -m "chore: playwright screenshot set for the design pass; update HANDOFF and CLAUDE.md"
git push
```

---

## Self-review notes (already applied)

- **Spec coverage:** §4 design system → Tasks 4–6; §5 shell → Task 12; §6 screens → Tasks 13–19; §7 data/domain → Tasks 2–3, 7–11; §8 testing/screenshots → every task + Task 20; §9 done criteria → Task 20 step 3.
- **Deliberate deviations from the spec, none material:** the Alerts `/alerts/:id` child route renders `null` and the parent uses `useMatch` (simpler than a nested element); Plan "Add to calendar" is a web download (native share arrives with Capacitor); reminders are a stored flag only (local notifications are Day 4).
- **Type consistency:** `nextUp(sets, now, resolutions, bufferMinutes)` (Task 9) is called with that signature in Tasks 13 and 17; `SegmentedControl` options use `{ value, label }` everywhere; store field names (`favorites`, `resolutions`, `reminders`, `settings`, `readIds`, `pushOptIn`, `theme`, `devNow`, `lineupView`) match across Tasks 11, 12, 14, 17, 18, 19, 20.
