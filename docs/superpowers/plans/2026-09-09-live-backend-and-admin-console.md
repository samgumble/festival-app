# Live Backend + Admin Console Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The fan app reads live content and alerts from Firestore (project `bb-festival-2026`, Spark plan), and SBG gets a password-protected admin console on GitHub Pages (`samgumble/festival-admin`) to edit the lineup, publish, roll back, and send alerts.

**Architecture:** Firestore holds `content/published`, `content/draft`, `history/{version}`, `alerts/{id}`, `admins/{uid}`; rules make published/history/alerts world-readable and admin-only writable. The fan app gets two new sources behind its existing `ContentRepository`/`AlertsRepository` seams (Zod-validated; bundled snapshot stays the fallback). The admin console is a separate Vite + React app that carries a git-subtree copy of `packages/shared`, signs in with Firebase Auth, autosaves a draft, and publishes with an atomic batch (archive old → write new). No Cloud Functions.

**Tech Stack:** firebase 12.19.0 (app, auth, firestore), @firebase/rules-unit-testing 5.0.2, firebase-tools 15.30.0 (via `npx`, emulator needs Java 21 at `/opt/homebrew/opt/openjdk@21/bin`), plus the fan app's existing pins (Vite 8.2.2, React 19.3.0, react-router 7.18.3, zustand 5.0.15, zod 4.6.0, Tailwind 4.3.3, TS 5.9.3, Vitest 4.1.11).

**Spec:** `docs/superpowers/specs/2026-09-09-live-backend-and-admin-console-design.md`.

## Global Constraints

- Two repos. `festival-app` (this monorepo, path `/Users/samgumble/Claude/Projects/Blues and Brews App Fable 5.1`) owns the rules, the seed, and the fan app. `festival-admin` is cloned to the **sibling** path `/Users/samgumble/Claude/Projects/festival-admin` (Tasks 6+). Never edit `festival-admin/shared/` by hand — it is a git subtree of `packages/shared`.
- Never commit secrets: no service-account JSON, no passwords, no `.env*`. The Firebase **web** config in `packages/shared/src/firebase.config.ts` is public by design. The seed script reads the admin password from the environment at run time only.
- Never invent festival content. Firestore is seeded from `packages/content/content-2026.json`; the admin console edits what SBG enters.
- All time math via `time.ts` (`isoMs`, `parseIso`, `fromDenver`, `toDenverParts`) — the admin repo gets an identical copy under `src/domain/time.ts` (Task 8) rather than reaching into the fan app.
- Firestore rules: `content/published`, `history/**`, `alerts/**` → `read: true`, `write: isAdmin()`; `content/draft` → `read, write: isAdmin()`; `admins/{uid}` → `read: request.auth.uid == uid`, `write: false`; everything else `false`. `isAdmin()` = signed in AND `admins/{uid}` exists.
- Remote content must pass `Content.safeParse` (and each alert `Alert.safeParse`) before it can replace what's shown; an invalid snapshot never wins.
- `contentVersion` format `YYYY.MM.DD.n` (Denver date); `publishedBy` is the admin's email; publishing archives the previous published doc to `history/{oldVersion}` (top-level collection) and writes the new `published` in one batch.
- Admin console: no analytics; `browserSessionPersistence`; 60-minute idle sign-out; sun (`#F0C41C`) used only for **Publish** and **Send alert**; tap targets ≥ 44 px; never `<button>` inside `<a>`.
- Fan app: no screen changes beyond the Info provenance line; `VITE_DATA_SOURCE=bundled` in tests and screenshots, `firestore` in production builds.
- Conventional commits; small commits; push `festival-app` only when a task says so (Pages redeploys on push); `festival-admin` pushes are part of its deploy task.
- Firebase CLI: `npx --yes firebase-tools@15.30.0 …`, always with `--project bb-festival-2026`. Sam has run `firebase login`; if a command fails with "Failed to authenticate", stop and report — do not try to log in.

---

## File structure

```
festival-app/
  firebase/
    firebase.json                 emulator config (firestore on 8080, ui off)
    .firebaserc                   default project bb-festival-2026
    firestore.rules
    firestore.indexes.json        alerts: publishedAt desc (single-field, auto — file kept for deploy)
    rules.test.ts                 emulator tests
  vitest.rules.config.ts          node-environment vitest config for firebase/rules.test.ts
  package.json                    + rules:test, rules:deploy, emulators, seed scripts
  packages/content/scripts/seed.ts
  apps/festival/src/data/firebase.ts             lazy app + Firestore (persistent cache)
  apps/festival/src/data/firestore-content.ts    FirestoreContentSource
  apps/festival/src/data/firestore-alerts.ts     FirestoreAlertsSource
  apps/festival/src/data/content.ts              chooses source by VITE_DATA_SOURCE; exposes status
  apps/festival/src/data/alerts.ts               same
  apps/festival/src/features/info/InfoScreen.tsx provenance line from status

festival-admin/  (sibling clone)
  package.json  vite.config.ts  tsconfig.json  index.html  .gitignore
  shared/                          git subtree of festival-app/packages/shared
  .github/workflows/pages.yml
  src/main.tsx  src/app/{App,router,Shell,RequireAdmin}.tsx
  src/design/{tokens.css,fonts.css,index.ts,Button,Card,Field,Select,Chip,Eyebrow,Dialog}.tsx
  src/auth/{firebase,session,useSession}.ts  src/auth/SignIn.tsx
  src/data/{content,alerts}.ts
  src/domain/{time,version,diff,overlap,alerts}.ts (+ tests)
  src/features/dashboard/Dashboard.tsx
  src/features/lineup/{LineupEditor,ArtistsTable,SetsEditor,SetRowEditor}.tsx
  src/features/alerts/{AlertsPage,Compose,AlertPreview,History}.tsx
  src/features/publish/{PublishPage,DiffList,HistoryList}.tsx
  public/fonts/…  (Michroma, DM Sans, Bungee — copied from the fan app)
```

---

### Task 1: Firestore rules, emulator config, and rules tests

**Files:**
- Create: `firebase/firebase.json`, `firebase/.firebaserc`, `firebase/firestore.rules`, `firebase/firestore.indexes.json`, `firebase/rules.test.ts`, `vitest.rules.config.ts`
- Modify: `package.json` (root scripts + devDependencies)

**Interfaces:**
- Produces: `npm run rules:test` (emulator-backed), `npm run rules:deploy`, `npm run emulators` (foreground Firestore emulator on 8080 for local dev of the admin app).

- [ ] **Step 1: Firebase project files**

`firebase/.firebaserc`:
```json
{ "projects": { "default": "bb-festival-2026" } }
```

`firebase/firebase.json`:
```json
{
  "firestore": { "rules": "firestore.rules", "indexes": "firestore.indexes.json" },
  "emulators": {
    "firestore": { "port": 8080, "host": "127.0.0.1" },
    "auth": { "port": 9099, "host": "127.0.0.1" },
    "ui": { "enabled": false },
    "singleProjectMode": true
  }
}
```

`firebase/firestore.indexes.json`:
```json
{ "indexes": [], "fieldOverrides": [] }
```

`firebase/firestore.rules`:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return request.auth != null
        && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }
    function isContent() {
      return request.resource.data.meta is map
        && request.resource.data.meta.contentVersion is string
        && request.resource.data.festival is map
        && request.resource.data.stages is list
        && request.resource.data.artists is list
        && request.resource.data.sets is list;
    }
    function isAlert() {
      return request.resource.data.title is string && request.resource.data.title.size() <= 60
        && request.resource.data.body is string && request.resource.data.body.size() <= 240
        && request.resource.data.severity in ['info', 'important', 'urgent']
        && request.resource.data.publishedAt is string
        && request.resource.data.publishedBy is string
        && request.resource.data.push is bool;
    }

    match /content/published {
      allow read: if true;
      allow write: if isAdmin() && isContent();
    }
    match /content/draft {
      allow read, write: if isAdmin();
    }
    match /history/{version} {
      allow read: if true;
      allow create: if isAdmin() && isContent();
      allow update, delete: if false;
    }
    match /alerts/{id} {
      allow read: if true;
      allow create, update: if isAdmin() && isAlert();
      allow delete: if isAdmin();
    }
    match /admins/{uid} {
      allow read: if request.auth != null && request.auth.uid == uid;
      allow write: if false;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

- [ ] **Step 2: Rules tests (written before the first emulator run)**

`vitest.rules.config.ts` (repo root):
```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { environment: "node", include: ["firebase/**/*.test.ts"], testTimeout: 20_000, hookTimeout: 30_000 },
});
```

`firebase/rules.test.ts`:
```ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs } from "firebase/firestore";

let env: RulesTestEnvironment;
const ADMIN = "admin-uid";
const STRANGER = "stranger-uid";

const content = {
  meta: { contentVersion: "2026.09.09.1", publishedAt: "2026-09-09T12:00:00-06:00", publishedBy: "seed", sources: [] },
  festival: { name: "Test" }, stages: [], artists: [], sets: [],
};
const alert = { title: "Gates open", body: "Welcome.", severity: "info", publishedAt: "2026-09-18T11:30:00-06:00", publishedBy: "admin@example.com", push: false };

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "bb-festival-2026",
    firestore: { rules: readFileSync(resolve(__dirname, "firestore.rules"), "utf8"), host: "127.0.0.1", port: 8080 },
  });
});
afterAll(async () => { await env.cleanup(); });
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, "admins", ADMIN), { email: "admin@example.com" });
    await setDoc(doc(db, "content", "published"), content);
    await setDoc(doc(db, "content", "draft"), content);
    await setDoc(doc(db, "alerts", "a1"), alert);
  });
});

const admin = () => env.authenticatedContext(ADMIN).firestore();
const stranger = () => env.authenticatedContext(STRANGER).firestore();
const anon = () => env.unauthenticatedContext().firestore();

describe("public reads", () => {
  it("anyone can read published, history and alerts", async () => {
    await assertSucceeds(getDoc(doc(anon(), "content", "published")));
    await assertSucceeds(getDocs(collection(anon(), "alerts")));
    await assertSucceeds(getDocs(collection(anon(), "history")));
  });
  it("nobody but admins can read the draft", async () => {
    await assertFails(getDoc(doc(anon(), "content", "draft")));
    await assertFails(getDoc(doc(stranger(), "content", "draft")));
    await assertSucceeds(getDoc(doc(admin(), "content", "draft")));
  });
});

describe("writes", () => {
  it("anonymous and non-admin users cannot write anything", async () => {
    await assertFails(setDoc(doc(anon(), "content", "published"), content));
    await assertFails(setDoc(doc(stranger(), "content", "published"), content));
    await assertFails(setDoc(doc(stranger(), "alerts", "a2"), alert));
    await assertFails(setDoc(doc(stranger(), "admins", STRANGER), { email: "x" }));
  });
  it("admins can publish, archive, and manage alerts", async () => {
    await assertSucceeds(setDoc(doc(admin(), "content", "published"), { ...content, meta: { ...content.meta, contentVersion: "2026.09.09.2" } }));
    await assertSucceeds(setDoc(doc(admin(), "history", "2026.09.09.1"), { ...content, archivedAt: "2026-09-09T13:00:00-06:00" }));
    await assertSucceeds(setDoc(doc(admin(), "alerts", "a2"), alert));
    await assertSucceeds(deleteDoc(doc(admin(), "alerts", "a1")));
  });
  it("history is append-only and admins cannot grant admin", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => { await setDoc(doc(ctx.firestore(), "history", "v0"), content); });
    await assertFails(setDoc(doc(admin(), "history", "v0"), { ...content, meta: { ...content.meta, contentVersion: "x" } }));
    await assertFails(deleteDoc(doc(admin(), "history", "v0")));
    await assertFails(setDoc(doc(admin(), "admins", "new-uid"), { email: "new@example.com" }));
  });
  it("shape guards reject malformed content and alerts", async () => {
    await assertFails(setDoc(doc(admin(), "content", "published"), { festival: {} }));
    await assertFails(setDoc(doc(admin(), "alerts", "bad"), { ...alert, severity: "loud" }));
    await assertFails(setDoc(doc(admin(), "alerts", "long"), { ...alert, title: "x".repeat(61) }));
  });
  it("admins can read only their own admin doc", async () => {
    await assertSucceeds(getDoc(doc(admin(), "admins", ADMIN)));
    await assertFails(getDoc(doc(admin(), "admins", STRANGER)));
  });
});
```

- [ ] **Step 3: Scripts and dependencies**

Root `package.json` — add devDependencies `"@firebase/rules-unit-testing": "5.0.2"`, `"firebase": "12.19.0"`, `"vitest": "4.1.11"` (root, for the rules config) and scripts:
```json
    "emulators": "PATH=/opt/homebrew/opt/openjdk@21/bin:$PATH npx --yes firebase-tools@15.30.0 emulators:start --only firestore,auth --config firebase/firebase.json --project bb-festival-2026",
    "rules:test": "PATH=/opt/homebrew/opt/openjdk@21/bin:$PATH npx --yes firebase-tools@15.30.0 emulators:exec --only firestore --config firebase/firebase.json --project bb-festival-2026 \"vitest run --config vitest.rules.config.ts\"",
    "rules:deploy": "npx --yes firebase-tools@15.30.0 deploy --only firestore --config firebase/firebase.json --project bb-festival-2026",
    "seed": "node packages/content/scripts/seed.ts"
```
Then `npm install`.

- [ ] **Step 4: Run the rules tests**

Run: `npm run rules:test`
Expected: the emulator downloads on first use, then `7 passed`. If `java` is not found, confirm `/opt/homebrew/opt/openjdk@21/bin/java -version` prints 21 (it was installed by Homebrew) — do not change the PATH prefix in the scripts.

- [ ] **Step 5: Deploy the rules**

Run: `npm run rules:deploy`
Expected: `✔ Deploy complete!` for `firestore: rules` (and indexes). If it fails with "Failed to authenticate", stop and report BLOCKED — Sam must run `npx firebase-tools login`.

- [ ] **Step 6: Commit**

```bash
git add firebase vitest.rules.config.ts package.json package-lock.json
git commit -m "feat(firebase): firestore rules with emulator tests; deploy + emulator scripts"
```

---

### Task 2: Admin allowlist doc and content seed

**Files:**
- Create: `packages/content/scripts/seed.ts`
- Modify: `packages/content/package.json` (dependency `firebase`)

**Interfaces:**
- Consumes: `FIREBASE_CONFIG` from `@bb/shared`, `content-2026.json`, rules from Task 1.
- Produces: `content/published` seeded at version `2026.09.09.1`; `admins/{uid}` for sam.gumble@gmail.com exists.

- [ ] **Step 1: Create the admin allowlist doc (controller does this — it needs the console)**

Rules forbid clients from writing `admins/*`, so the doc is created in the Firebase console: Authentication → Users → copy the UID for `sam.gumble@gmail.com`; Firestore → Start collection `admins` → document ID = that UID → field `email` (string) = `sam.gumble@gmail.com`, field `createdAt` (string) = today's ISO. The controller performs this step in Chrome and records the UID in `docs/HANDOFF.md §2`. The implementer of this task must **not** attempt it; verify it exists via the seed script's sign-in (Step 3) instead.

- [ ] **Step 2: Seed script (client SDK, signs in as the admin; password from the environment)**

`packages/content/scripts/seed.ts`:
```ts
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, getFirestore, setDoc, writeBatch } from "firebase/firestore";
import { Content, FIREBASE_CONFIG } from "@bb/shared";

const email = process.env.FIREBASE_ADMIN_EMAIL;
const password = process.env.FIREBASE_ADMIN_PASSWORD;
if (!email || !password) {
  console.error("Set FIREBASE_ADMIN_EMAIL and FIREBASE_ADMIN_PASSWORD in the environment (never in a file).");
  process.exit(2);
}

const here = dirname(fileURLToPath(import.meta.url));
const raw: unknown = JSON.parse(readFileSync(resolve(here, "../content-2026.json"), "utf8"));
const content = Content.parse(raw);

const app = initializeApp(FIREBASE_CONFIG);
const auth = getAuth(app);
const db = getFirestore(app);

const cred = await signInWithEmailAndPassword(auth, email, password);
const adminDoc = await getDoc(doc(db, "admins", cred.user.uid));
if (!adminDoc.exists()) {
  console.error(`Signed in as ${email} (uid ${cred.user.uid}) but admins/${cred.user.uid} does not exist. Create it in the Firebase console first.`);
  process.exit(3);
}

const published = await getDoc(doc(db, "content", "published"));
if (published.exists() && process.env.SEED_FORCE !== "1") {
  console.log(`content/published already exists (v${(published.data() as { meta: { contentVersion: string } }).meta.contentVersion}). Set SEED_FORCE=1 to overwrite.`);
  process.exit(0);
}

const batch = writeBatch(db);
const now = new Date().toISOString();
if (published.exists()) {
  const old = published.data() as { meta: { contentVersion: string } };
  batch.set(doc(db, "history", old.meta.contentVersion), { ...published.data(), archivedAt: now });
}
batch.set(doc(db, "content", "published"), { ...content, meta: { ...content.meta, publishedBy: email } });
batch.set(doc(db, "content", "draft"), { ...content, meta: { ...content.meta, publishedBy: email } });
await batch.commit();
console.log(`Seeded content/published and content/draft at v${content.meta.contentVersion} as ${email}.`);
process.exit(0);
```
Add `"firebase": "12.19.0"` to `packages/content/package.json` dependencies and run `npm install`.

- [ ] **Step 3: Run the seed (Sam's terminal — the password is typed there)**

The controller asks Sam to run, from the repo root:
```bash
FIREBASE_ADMIN_EMAIL=sam.gumble@gmail.com FIREBASE_ADMIN_PASSWORD='…' npm run seed
```
Expected: `Seeded content/published and content/draft at v2026.09.09.1 as sam.gumble@gmail.com.` Verify with the console (Firestore → content → published) or by reading it anonymously: `curl -s "https://firestore.googleapis.com/v1/projects/bb-festival-2026/databases/(default)/documents/content/published" | head -c 300` → JSON with `fields.meta`.

- [ ] **Step 4: Commit**

```bash
git add packages/content/scripts/seed.ts packages/content/package.json package-lock.json
git commit -m "feat(content): seed script publishes the bundled snapshot as the signed-in admin"
```

---

### Task 3: Fan app — Firestore sources behind the repository seams

**Files:**
- Create: `apps/festival/src/data/firebase.ts`, `apps/festival/src/data/firestore-content.ts`, `apps/festival/src/data/firestore-alerts.ts`, `apps/festival/src/data/sources.test.ts`
- Modify: `apps/festival/src/data/content.ts`, `apps/festival/src/data/alerts.ts`, `apps/festival/src/vite-env.d.ts`, `apps/festival/package.json` (dependency `firebase`), `apps/festival/playwright.config.ts` (env), `apps/festival/vite.config.ts` (test env)

**Interfaces:**
- Consumes: `ContentRepository { getContent(); subscribe(cb) }`, `AlertsRepository { getAlerts(); subscribe(cb) }` (existing).
- Produces: `interface ContentStatus { source: "bundled" | "live" | "cache"; contentVersion: string; updatedAt: string | null }`, `useContentStatus(): ContentStatus`; `createFirestoreContentSource(db, fallback: Content): ContentRepository & { getStatus(): ContentStatus }`; `createFirestoreAlertsSource(db): AlertsRepository`; `VITE_DATA_SOURCE` env switch (`bundled` | `firestore`).

- [ ] **Step 1: Tests first (no emulator needed — fake snapshot feeds)**

`apps/festival/src/data/sources.test.ts`:
```ts
import { describe, expect, it, vi } from "vitest";
import { Content } from "@bb/shared";
import bundled from "./bundled.json";
import { applyContentSnapshot, applyAlertsSnapshot } from "./firestore-content";

const base = Content.parse(bundled);

describe("applyContentSnapshot", () => {
  it("replaces content when the snapshot validates and reports live/cache", () => {
    const next = { ...base, meta: { ...base.meta, contentVersion: "2026.09.10.1" } };
    const r = applyContentSnapshot({ current: base, status: { source: "bundled", contentVersion: base.meta.contentVersion, updatedAt: null } }, { exists: true, data: next, fromCache: false });
    expect(r.current.meta.contentVersion).toBe("2026.09.10.1");
    expect(r.status.source).toBe("live");
    const c = applyContentSnapshot(r, { exists: true, data: next, fromCache: true });
    expect(c.status.source).toBe("cache");
  });
  it("ignores an invalid snapshot and keeps the last good content", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const r = applyContentSnapshot({ current: base, status: { source: "bundled", contentVersion: base.meta.contentVersion, updatedAt: null } }, { exists: true, data: { meta: {} }, fromCache: false });
    expect(r.current).toBe(base);
    expect(r.status.source).toBe("bundled");
    warn.mockRestore();
  });
  it("ignores a missing document", () => {
    const r = applyContentSnapshot({ current: base, status: { source: "bundled", contentVersion: base.meta.contentVersion, updatedAt: null } }, { exists: false, data: undefined, fromCache: false });
    expect(r.current).toBe(base);
  });
});

describe("applyAlertsSnapshot", () => {
  const good = { id: "a1", title: "Gates open", body: "Welcome.", severity: "info", publishedAt: "2026-09-18T11:30:00-06:00", publishedBy: "sbg", push: false };
  it("keeps valid alerts newest first and drops invalid ones", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const list = applyAlertsSnapshot([
      { id: "a1", data: good },
      { id: "a2", data: { ...good, publishedAt: "2026-09-19T11:30:00-06:00" } },
      { id: "bad", data: { title: 1 } },
    ]);
    expect(list.map((a) => a.id)).toEqual(["a2", "a1"]);
    warn.mockRestore();
  });
});
```

Run: `npm test -w @bb/festival -- sources` → FAIL (module not found).

- [ ] **Step 2: Firebase bootstrap and the two sources**

`apps/festival/src/vite-env.d.ts` — add to `ImportMetaEnv`: `readonly VITE_DATA_SOURCE?: "bundled" | "firestore";`

`apps/festival/src/data/firebase.ts`:
```ts
import { initializeApp, getApps } from "firebase/app";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, type Firestore } from "firebase/firestore";
import { FIREBASE_CONFIG } from "@bb/shared";

let db: Firestore | null = null;

/** Lazily initialized Firestore with the persistent (IndexedDB) cache. Analytics is never initialized. */
export function getDb(): Firestore {
  if (db) return db;
  const app = getApps()[0] ?? initializeApp(FIREBASE_CONFIG);
  db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
  return db;
}
```

`apps/festival/src/data/firestore-content.ts`:
```ts
import { doc, onSnapshot, type Firestore } from "firebase/firestore";
import { Alert, Content } from "@bb/shared";
import { isoMs } from "@/domain/time";
import type { ContentRepository } from "./content";

export interface ContentStatus {
  source: "bundled" | "live" | "cache";
  contentVersion: string;
  updatedAt: string | null;
}
export interface ContentState { current: Content; status: ContentStatus }

/** Pure: fold one Firestore snapshot into the current state. Invalid or missing docs never replace good content. */
export function applyContentSnapshot(state: ContentState, snap: { exists: boolean; data: unknown; fromCache: boolean }): ContentState {
  if (!snap.exists) return state;
  const parsed = Content.safeParse(snap.data);
  if (!parsed.success) {
    console.warn("content/published failed validation; keeping last good content", parsed.error.issues.slice(0, 3));
    return state;
  }
  return {
    current: parsed.data,
    status: { source: snap.fromCache ? "cache" : "live", contentVersion: parsed.data.meta.contentVersion, updatedAt: parsed.data.meta.publishedAt },
  };
}

/** Pure: validate alert docs, drop invalid ones, newest first. */
export function applyAlertsSnapshot(docs: { id: string; data: unknown }[]): Alert[] {
  const out: Alert[] = [];
  for (const d of docs) {
    const parsed = Alert.safeParse({ ...(d.data as object), id: d.id });
    if (parsed.success) out.push(parsed.data);
    else console.warn(`alert ${d.id} failed validation; dropped`);
  }
  return out.sort((a, b) => isoMs(b.publishedAt) - isoMs(a.publishedAt));
}

export function createFirestoreContentSource(db: Firestore, fallback: Content): ContentRepository & { getStatus(): ContentStatus } {
  let state: ContentState = { current: fallback, status: { source: "bundled", contentVersion: fallback.meta.contentVersion, updatedAt: null } };
  const listeners = new Set<() => void>();
  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    onSnapshot(doc(db, "content", "published"), { includeMetadataChanges: true }, (snap) => {
      const next = applyContentSnapshot(state, { exists: snap.exists(), data: snap.data(), fromCache: snap.metadata.fromCache });
      if (next !== state) { state = next; listeners.forEach((l) => l()); }
    }, (err) => console.warn("content/published listener error", err));
  };
  return {
    getContent: () => state.current,
    getStatus: () => state.status,
    subscribe: (cb) => { listeners.add(cb); start(); return () => listeners.delete(cb); },
  };
}
```

`apps/festival/src/data/firestore-alerts.ts`:
```ts
import { collection, limit, onSnapshot, orderBy, query, type Firestore } from "firebase/firestore";
import type { Alert } from "@bb/shared";
import type { AlertsRepository } from "./alerts";
import { applyAlertsSnapshot } from "./firestore-content";

export function createFirestoreAlertsSource(db: Firestore): AlertsRepository {
  let alerts: Alert[] = [];
  const listeners = new Set<() => void>();
  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    const q = query(collection(db, "alerts"), orderBy("publishedAt", "desc"), limit(50));
    onSnapshot(q, (snap) => {
      alerts = applyAlertsSnapshot(snap.docs.map((d) => ({ id: d.id, data: d.data() })));
      listeners.forEach((l) => l());
    }, (err) => console.warn("alerts listener error", err));
  };
  return { getAlerts: () => alerts, subscribe: (cb) => { listeners.add(cb); start(); return () => listeners.delete(cb); } };
}
```

- [ ] **Step 3: Wire the source switch**

`apps/festival/src/data/content.ts` — replace the `contentRepository` export and add status:
```ts
import { getDb } from "./firebase";
import { createFirestoreContentSource, type ContentStatus } from "./firestore-content";

const useFirestore = import.meta.env.VITE_DATA_SOURCE === "firestore" || (import.meta.env.PROD && import.meta.env.VITE_DATA_SOURCE !== "bundled");
const bundledRepo = createBundledRepository(bundled);
const liveRepo = useFirestore ? createFirestoreContentSource(getDb(), bundledRepo.getContent()) : null;

export const contentRepository: ContentRepository = liveRepo ?? bundledRepo;

export function useContentStatus(): ContentStatus {
  const get = () => liveRepo?.getStatus() ?? { source: "bundled" as const, contentVersion: bundledRepo.getContent().meta.contentVersion, updatedAt: null };
  return useSyncExternalStore(contentRepository.subscribe, get, get);
}
```
(Keep `createBundledRepository`, `useContent`, `buildIndex`, `useContentIndex` as they are; note `firestore-content.ts` imports the `ContentRepository` type from this file — that is a type-only cycle and fine under `verbatimModuleSyntax`.)

`apps/festival/src/data/alerts.ts` — same pattern: `const useFirestore = …` (same expression), `export const alertsRepository: AlertsRepository = useFirestore ? createFirestoreAlertsSource(getDb()) : fixtureRepository;` where `fixtureRepository` is the existing object. `activeUrgent` unchanged.

`apps/festival/vite.config.ts` — in `test`, add `env: { VITE_DATA_SOURCE: "bundled" }`. `apps/festival/playwright.config.ts` — in `webServer`, add `env: { ...process.env, VITE_DATA_SOURCE: "bundled" }` so screenshots stay deterministic.

`apps/festival/package.json` — add `"firebase": "12.19.0"` to dependencies; `npm install`.

- [ ] **Step 4: Info provenance line**

In `apps/festival/src/features/info/InfoScreen.tsx`, replace the footer's `Content v{meta.contentVersion} · bundled {formatTime(parseIso(meta.publishedAt))} · offline-ready ✓` with a status-driven line:
```tsx
const status = useContentStatus();
…
<p className="mt-4 text-center eyebrow text-fg-soft">
  Content v{status.contentVersion} · {status.source === "live" ? "live" : status.source === "cache" ? "offline · cached" : "bundled"}
  {status.updatedAt ? ` · updated ${formatTime(parseIso(status.updatedAt))}` : ""} · app {__APP_VERSION__}
</p>
```
(import `useContentStatus` from `@/data/content`). Update the Info test's provenance assertion to `/Content v2026\.09\.09\.1 · bundled/`.

- [ ] **Step 5: Verify**

Run: `npm test -w @bb/festival` → all pass (previous 81 + 4 new). `npm run typecheck`. Then a live check: `VITE_DATA_SOURCE=firestore npm run dev -w @bb/festival` and `curl -s http://localhost:5173/src/data/content.ts | grep -c createFirestoreContentSource` ≥ 1; kill the server. Build: `npm run build` (production → Firestore source by default). Confirm the bundle contains `firestore.googleapis.com` (`grep -l "firestore.googleapis" apps/festival/dist/assets/*.js`).

- [ ] **Step 6: Commit and push (Pages redeploys; the live app now reads Firestore once seeded)**

```bash
git add apps/festival package-lock.json
git commit -m "feat(data): firestore content + alerts sources behind the repository seams; provenance in Info"
git push origin main
```
After the Pages run finishes, open https://samgumble.github.io/festival-app/info — the footer must read `Content v2026.09.09.1 · live · updated …` (once Task 2's seed has run).

---

### Task 4: Admin console scaffold (separate repo, subtree, tokens, Pages workflow)

**Files (in `/Users/samgumble/Claude/Projects/festival-admin`):**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `.gitignore`, `.npmrc`, `src/main.tsx`, `src/app/App.tsx`, `src/vite-env.d.ts`, `src/design/tokens.css`, `src/design/fonts.css`, `src/test/setup.ts`, `.github/workflows/pages.yml`, `README.md`
- Subtree: `shared/` from `festival-app` `packages/shared`
- Copy: `public/fonts/{michroma,dm-sans,bungee}/…` from the fan app

**Interfaces:**
- Produces: `npm run dev` (port 5174), `npm test`, `npm run typecheck`, `npm run build`; alias `@/` → `src`, `@shared` → `shared/src/index.ts`; Tailwind utilities identical to the fan app's (`bg-surface`, `text-fg`, `rounded-card`, `shadow-card`, `eyebrow`, `micro`, …).

- [ ] **Step 1: Clone and subtree**

```bash
cd /Users/samgumble/Claude/Projects
gh repo clone samgumble/festival-admin festival-admin
cd festival-admin
git subtree add --prefix=shared https://github.com/samgumble/festival-app.git main --squash
```
Expected: `shared/` contains `package.json`, `src/schema.ts`, `src/tokens.ts`, `src/firebase.config.ts`, `src/index.ts` and the whole `festival-app` tree is **not** there — subtree with a monorepo root brings the whole repo. So instead use the split approach:
```bash
cd "/Users/samgumble/Claude/Projects/Blues and Brews App Fable 5.1"
git subtree split --prefix=packages/shared -b shared-split
cd /Users/samgumble/Claude/Projects/festival-admin
git subtree add --prefix=shared "/Users/samgumble/Claude/Projects/Blues and Brews App Fable 5.1" shared-split --squash
ls shared/src   # schema.ts tokens.ts firebase.config.ts index.ts schema.test.ts
```
Record the sync command in `README.md`:
```
# Sync shared from festival-app
(cd "../Blues and Brews App Fable 5.1" && git subtree split --prefix=packages/shared -b shared-split)
git subtree pull --prefix=shared "../Blues and Brews App Fable 5.1" shared-split --squash
```

- [ ] **Step 2: Package, config, entry**

`package.json`:
```json
{
  "name": "festival-admin",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --host --port 5174",
    "build": "tsc -p tsconfig.json && vite build",
    "preview": "vite preview --port 5174",
    "test": "NODE_OPTIONS=--no-experimental-webstorage vitest run",
    "typecheck": "tsc -p tsconfig.json"
  },
  "dependencies": {
    "firebase": "12.19.0",
    "react": "19.3.0",
    "react-dom": "19.3.0",
    "react-router": "7.18.3",
    "zod": "4.6.0",
    "zustand": "5.0.15"
  },
  "devDependencies": {
    "@tailwindcss/vite": "4.3.3",
    "@testing-library/jest-dom": "7.0.1",
    "@testing-library/react": "16.3.3",
    "@types/node": "22.20.2",
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
`.npmrc`: `save-exact=true`. `.gitignore`: `node_modules/`, `dist/`, `.DS_Store`, `.env`, `.env.*`, `*.log`.

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022", "lib": ["ES2023", "DOM", "DOM.Iterable"], "module": "ESNext", "moduleResolution": "bundler",
    "strict": true, "noUncheckedIndexedAccess": true, "noImplicitOverride": true, "verbatimModuleSyntax": true,
    "allowImportingTsExtensions": true, "resolveJsonModule": true, "isolatedModules": true, "skipLibCheck": true, "noEmit": true,
    "jsx": "react-jsx", "types": ["node", "vite/client", "@testing-library/jest-dom"],
    "baseUrl": ".", "paths": { "@/*": ["src/*"], "@shared": ["shared/src/index.ts"] }
  },
  "include": ["src", "shared/src", "vite.config.ts"]
}
```

`vite.config.ts`:
```ts
/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
  base: process.env.BASE_PATH ?? "/",
  plugins: [react(), tailwindcss()],
  define: { __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? "0.0.0") },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@shared": fileURLToPath(new URL("./shared/src/index.ts", import.meta.url)),
    },
  },
  test: { environment: "jsdom", setupFiles: ["./src/test/setup.ts"], include: ["src/**/*.test.{ts,tsx}"], css: false },
});
```

`index.html`:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <title>Blues &amp; Brews — Admin</title>
  </head>
  <body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body>
</html>
```

`src/vite-env.d.ts`:
```ts
/// <reference types="vite/client" />
declare const __APP_VERSION__: string;
interface ImportMetaEnv { readonly VITE_USE_EMULATORS?: string; }
```

`src/test/setup.ts` — identical to the fan app's (jest-dom import, `afterEach(cleanup)`, `matchMedia` stub).

`src/design/fonts.css` — the fan app's file minus Bungee Shade (copy `public/fonts/michroma`, `public/fonts/dm-sans`, `public/fonts/bungee` directories, with their `OFL.txt`, from `festival-app/apps/festival/public/fonts/`).

`src/design/tokens.css` — copy the fan app's `apps/festival/src/design/tokens.css` verbatim, then: remove the `body::before` grain block (admin is calmer), and keep everything else (palette, `@theme inline`, light/dark blocks, `.eyebrow`, `.micro`, `.checker`, `--structure-fill`).

`src/main.tsx`:
```tsx
import "./design/tokens.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
```

`src/app/App.tsx` (placeholder until Task 5):
```tsx
import { PALETTE } from "@shared";
export function App() {
  return <main className="p-6"><h1 className="font-display text-[32px] leading-9 text-structure-2">Blues &amp; Brews Admin</h1><p className="mt-2 text-fg-soft">{Object.keys(PALETTE).length} palette tokens loaded from shared.</p></main>;
}
```

- [ ] **Step 3: Pages workflow**

`.github/workflows/pages.yml` — same shape as the fan app's:
```yaml
name: Deploy admin console to GitHub Pages
on:
  push: { branches: [main] }
  workflow_dispatch:
permissions: { contents: read, pages: write, id-token: write }
concurrency: { group: pages, cancel-in-progress: true }
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm test
      - run: npm run build
        env: { BASE_PATH: "/${{ github.event.repository.name }}/" }
      - run: cp dist/index.html dist/404.html
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: { name: github-pages, url: "${{ steps.deployment.outputs.page_url }}" }
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 4: Verify and commit**

```bash
npm install && npm run typecheck && npm run build
npm run dev &  # then curl -s http://localhost:5174 | grep -c main.tsx ; kill %1
gh api -X POST repos/samgumble/festival-admin/pages -f build_type=workflow || true
git add -A && git commit -m "chore: scaffold admin console (vite, tailwind tokens, shared subtree, pages workflow)"
git push origin main
```
Expected: Pages run goes green; `https://samgumble.github.io/festival-admin/` shows the placeholder heading.

---

### Task 5: Auth — sign-in, session persistence, idle sign-out, admin gate, shell

**Files (festival-admin):**
- Create: `src/auth/firebase.ts`, `src/auth/session.ts`, `src/auth/SignIn.tsx`, `src/app/RequireAdmin.tsx`, `src/app/Shell.tsx`, `src/app/router.tsx`, `src/design/{Button,Card,Field,Select,Chip,Eyebrow,Dialog,index}.tsx`
- Modify: `src/app/App.tsx`
- Test: `src/auth/session.test.ts`, `src/design/primitives.test.tsx`

**Interfaces:**
- Produces: `getFirebase(): { app, auth, db }` (uses emulators when `VITE_USE_EMULATORS=1`); `useSession()` → `{ status: "loading" | "anon" | "denied" | "ok"; user: { uid, email } | null; signIn(email, password): Promise<void>; signOut(): Promise<void>; error: string | null }`; `resolveSessionStatus(user, adminDocExists)` pure; `IDLE_MS = 60 * 60_000`; primitives `Button({ variant: "sun"|"ink"|"ghost"|"danger", size, full })`, `Card`, `Field({ label, error?, children })`, `Select`, `Chip`, `Eyebrow`, `Dialog({ open, title, body, confirmLabel, danger?, onConfirm, onCancel })`.

- [ ] **Step 1: Tests**

`src/auth/session.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { resolveSessionStatus, isIdle, IDLE_MS } from "./session";

describe("session", () => {
  it("resolves status from auth user and admin doc", () => {
    expect(resolveSessionStatus(null, false)).toBe("anon");
    expect(resolveSessionStatus({ uid: "u", email: "a@b.c" }, false)).toBe("denied");
    expect(resolveSessionStatus({ uid: "u", email: "a@b.c" }, true)).toBe("ok");
  });
  it("idle after 60 minutes without activity", () => {
    const t = 1_000_000;
    expect(isIdle(t, t + IDLE_MS - 1)).toBe(false);
    expect(isIdle(t, t + IDLE_MS)).toBe(true);
  });
});
```

`src/design/primitives.test.tsx`:
```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Button, Dialog, Field } from "./index";

describe("primitives", () => {
  it("Field wires label and error to its control", () => {
    render(<Field label="Title" error="Too long"><input /></Field>);
    expect(screen.getByLabelText("Title")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Too long");
  });
  it("Dialog confirms and cancels", () => {
    const onConfirm = vi.fn(), onCancel = vi.fn();
    render(<Dialog open title="Send alert?" body="Goes to every phone." confirmLabel="Send" onConfirm={onConfirm} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onConfirm).toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalled();
  });
  it("Button sizes keep a 44px target", () => {
    render(<Button size="sm">Go</Button>);
    expect(screen.getByRole("button", { name: "Go" }).className).toMatch(/before:-inset-y-1\b/);
  });
});
```

- [ ] **Step 2: Primitives**

`src/design/Button.tsx` — the fan app's `buttonClasses`/`Button` with an added `danger` variant (`bg-ember text-white`) and default `type="button"`. `src/design/Card.tsx` — as fan app. `src/design/Chip.tsx`, `Eyebrow.tsx` — as fan app (Chip `sky` uses `text-ink`). `src/design/Field.tsx`:
```tsx
import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from "react";
export function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: ReactElement }) {
  const id = useId();
  const control = isValidElement(children) ? cloneElement(children as ReactElement<Record<string, unknown>>, { id, "aria-invalid": !!error, "aria-describedby": error ? `${id}-err` : undefined, className: `h-11 w-full rounded-ctl border px-3 text-[15px] bg-surface ${error ? "border-ember" : "border-hair"} ${(children.props as { className?: string }).className ?? ""}` }) : children;
  return (
    <label className="block" htmlFor={id}>
      <span className="eyebrow text-fg-soft">{label}</span>
      <span className="mt-1.5 block">{control}</span>
      {hint && !error && <span className="mt-1 block text-[13px] text-fg-soft">{hint}</span>}
      {error && <span id={`${id}-err`} role="alert" className="mt-1 block text-[13px] text-ember">{error}</span>}
    </label>
  );
}
```
`src/design/Select.tsx`: a styled native `<select>` (`h-11 rounded-ctl border border-hair bg-surface px-3`). `src/design/Dialog.tsx`:
```tsx
import { useEffect } from "react";
import { Button } from "./Button";
export function Dialog({ open, title, body, confirmLabel, danger = false, onConfirm, onCancel }: { open: boolean; title: string; body: string; confirmLabel: string; danger?: boolean; onConfirm: () => void; onCancel: () => void }) {
  useEffect(() => { if (!open) return; const k = (e: KeyboardEvent) => e.key === "Escape" && onCancel(); document.addEventListener("keydown", k); return () => document.removeEventListener("keydown", k); }, [open, onCancel]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-night-ink/40 p-4">
      <div role="dialog" aria-modal="true" aria-label={title} className="w-full max-w-md rounded-card border border-hair bg-surface p-5 shadow-sheet">
        <h2 className="text-[20px] font-semibold leading-6">{title}</h2>
        <p className="mt-2 text-[15px] leading-5 text-fg-soft">{body}</p>
        <div className="mt-4 flex justify-end gap-2"><Button onClick={onCancel}>Cancel</Button><Button variant={danger ? "danger" : "sun"} onClick={onConfirm}>{confirmLabel}</Button></div>
      </div>
    </div>
  );
}
```
`src/design/index.ts` re-exports all.

- [ ] **Step 3: Firebase + session**

`src/auth/firebase.ts`:
```ts
import { getApps, initializeApp } from "firebase/app";
import { browserSessionPersistence, connectAuthEmulator, getAuth, setPersistence, type Auth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore, type Firestore } from "firebase/firestore";
import { FIREBASE_CONFIG } from "@shared";

let cached: { auth: Auth; db: Firestore } | null = null;
export function getFirebase() {
  if (cached) return cached;
  const app = getApps()[0] ?? initializeApp(FIREBASE_CONFIG);
  const auth = getAuth(app);
  const db = getFirestore(app);
  if (import.meta.env.VITE_USE_EMULATORS === "1") {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
  }
  void setPersistence(auth, browserSessionPersistence);
  cached = { auth, db };
  return cached;
}
```

`src/auth/session.ts`:
```ts
import { create } from "zustand";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut as fbSignOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { getFirebase } from "./firebase";

export type SessionStatus = "loading" | "anon" | "denied" | "ok";
export interface SessionUser { uid: string; email: string }
export const IDLE_MS = 60 * 60_000;

export function resolveSessionStatus(user: SessionUser | null, adminDocExists: boolean): SessionStatus {
  if (!user) return "anon";
  return adminDocExists ? "ok" : "denied";
}
export const isIdle = (lastActivityMs: number, nowMs: number) => nowMs - lastActivityMs >= IDLE_MS;

interface SessionState {
  status: SessionStatus; user: SessionUser | null; error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  start: () => () => void;
}
const GENERIC = "Couldn't sign in. Check the email and password.";

export const useSession = create<SessionState>()((set) => ({
  status: "loading", user: null, error: null,
  signIn: async (email, password) => {
    set({ error: null });
    try { await signInWithEmailAndPassword(getFirebase().auth, email, password); }
    catch { set({ error: GENERIC }); } // never reveal whether the email exists
  },
  signOut: async () => { await fbSignOut(getFirebase().auth); },
  start: () => {
    const { auth, db } = getFirebase();
    let last = Date.now();
    const bump = () => { last = Date.now(); };
    const events = ["pointerdown", "keydown", "scroll"] as const;
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    const idle = window.setInterval(() => { if (auth.currentUser && isIdle(last, Date.now())) void fbSignOut(auth); }, 60_000);
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { set({ status: "anon", user: null }); return; }
      const user = { uid: u.uid, email: u.email ?? "" };
      let exists = false;
      try { exists = (await getDoc(doc(db, "admins", u.uid))).exists(); } catch { exists = false; }
      set({ status: resolveSessionStatus(user, exists), user });
    });
    return () => { unsub(); window.clearInterval(idle); events.forEach((e) => window.removeEventListener(e, bump)); };
  },
}));
```

- [ ] **Step 4: Sign-in screen, gate, shell, router**

`src/auth/SignIn.tsx`:
```tsx
import { useState, type FormEvent } from "react";
import { Button, Card, Eyebrow, Field } from "@/design";
import { useSession } from "./session";
export function SignIn() {
  const { signIn, error, status } = useSession();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => { e.preventDefault(); setBusy(true); await signIn(email.trim(), password); setBusy(false); };
  return (
    <main className="mx-auto max-w-sm px-4 pt-16">
      <Eyebrow tone="structure">SBG Productions</Eyebrow>
      <h1 className="mt-1 font-display text-[28px] leading-8 text-structure-2">Blues &amp; Brews Admin</h1>
      <Card className="mt-6">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Email"><input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
          <Field label="Password" error={error ?? undefined}><input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></Field>
          <Button type="submit" variant="ink" full disabled={busy || status === "loading"}>{busy ? "Signing in…" : "Sign in"}</Button>
        </form>
      </Card>
      <p className="mt-4 text-[13px] text-fg-soft">Accounts are created by the festival's app admin. Signing in lasts until you close this tab or after an hour of inactivity.</p>
    </main>
  );
}
```

`src/app/RequireAdmin.tsx`:
```tsx
import { Outlet } from "react-router";
import { Button } from "@/design";
import { SignIn } from "@/auth/SignIn";
import { useSession } from "@/auth/session";
export function RequireAdmin() {
  const { status, user, signOut } = useSession();
  if (status === "loading") return <main className="p-8 text-fg-soft">Loading…</main>;
  if (status === "anon") return <SignIn />;
  if (status === "denied") return (
    <main className="mx-auto max-w-sm px-4 pt-16">
      <h1 className="text-[20px] font-semibold">This account isn't an admin</h1>
      <p className="mt-2 text-fg-soft">{user?.email} can sign in but hasn't been added to the admin list. Ask the app admin, then sign in again.</p>
      <Button className="mt-4" onClick={signOut}>Sign out</Button>
    </main>
  );
  return <Outlet />;
}
```

`src/app/Shell.tsx`:
```tsx
import { NavLink, Outlet } from "react-router";
import { Button, CheckerRibbon } from "@/design";
import { useSession } from "@/auth/session";
const TABS = [["/", "Dashboard"], ["/lineup", "Lineup"], ["/alerts", "Alerts"], ["/publish", "Publish"]] as const;
export function Shell() {
  const { user, signOut } = useSession();
  return (
    <div className="min-h-dvh">
      <header className="border-b border-hair bg-surface">
        <CheckerRibbon rows={1} />
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <span className="font-display text-[18px] text-structure-2">B&amp;B Admin</span>
          <nav aria-label="Sections" className="flex gap-1">
            {TABS.map(([to, label]) => <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => `rounded-chip px-3 py-2 text-[15px] font-semibold ${isActive ? "bg-structure-fill text-white" : "text-fg-soft"}`}>{label}</NavLink>)}
          </nav>
          <span className="ml-auto text-[13px] text-fg-soft">{user?.email}</span>
          <a className="text-[13px] text-structure-2 underline" href="https://samgumble.github.io/festival-app/" target="_blank" rel="noreferrer">Fan app ↗</a>
          <Button size="sm" onClick={signOut}>Sign out</Button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6"><Outlet /></main>
    </div>
  );
}
```
(`CheckerRibbon` — copy the fan app's ornament into `src/design/CheckerRibbon.tsx` and export it.)

`src/app/router.tsx`:
```tsx
import { createBrowserRouter, type RouteObject } from "react-router";
import { RequireAdmin } from "./RequireAdmin";
import { Shell } from "./Shell";
import { Dashboard } from "@/features/dashboard/Dashboard";
import { LineupEditor } from "@/features/lineup/LineupEditor";
import { AlertsPage } from "@/features/alerts/AlertsPage";
import { PublishPage } from "@/features/publish/PublishPage";
export function buildRoutes(): RouteObject[] {
  return [{ element: <RequireAdmin />, children: [{ path: "/", element: <Shell />, children: [
    { index: true, element: <Dashboard /> }, { path: "lineup", element: <LineupEditor /> }, { path: "alerts", element: <AlertsPage /> }, { path: "publish", element: <PublishPage /> },
  ] }] }];
}
export const createAppRouter = () => createBrowserRouter(buildRoutes(), { basename: import.meta.env.BASE_URL.replace(/\/$/, "") || "/" });
```
Create placeholder screens for the four features (each `export function X() { return <h1 className="font-display text-[28px] text-structure-2">X</h1>; }`) — Tasks 7–10 replace them.

`src/app/App.tsx`:
```tsx
import { useEffect } from "react";
import { RouterProvider } from "react-router";
import { useSession } from "@/auth/session";
import { createAppRouter } from "./router";
const router = createAppRouter();
export function App() {
  const start = useSession((s) => s.start);
  useEffect(() => start(), [start]);
  return <RouterProvider router={router} />;
}
```

- [ ] **Step 5: Verify against the emulator, commit**

```bash
npm test && npm run typecheck
```
Manual (emulator): in `festival-app` run `npm run emulators` (Firestore + Auth on 8080/9099). In `festival-admin`: `VITE_USE_EMULATORS=1 npm run dev`; the Auth emulator has no users — create one via its REST API: `curl -s -X POST "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=any" -H 'Content-Type: application/json' -d '{"email":"admin@example.com","password":"password123","returnSecureToken":true}'` → note `localId`; write `admins/{localId}` through the emulator REST: `curl -s -X PATCH "http://127.0.0.1:8080/v1/projects/bb-festival-2026/databases/(default)/documents/admins/{localId}" -H 'Content-Type: application/json' -d '{"fields":{"email":{"stringValue":"admin@example.com"}}}'`. Open http://localhost:5174 → sign in → Dashboard placeholder with the header. Sign out works. Stop both servers.

```bash
git add -A && git commit -m "feat(auth): email/password sign-in, session persistence, idle sign-out, admin gate, shell"
```

---

### Task 6: Admin data layer and domain helpers (with tests)

**Files (festival-admin):**
- Create: `src/domain/time.ts` (copy of the fan app's `apps/festival/src/domain/time.ts`, unchanged), `src/domain/version.ts`, `src/domain/diff.ts`, `src/domain/overlap.ts`, `src/domain/alerts.ts`, `src/data/content.ts`, `src/data/alerts.ts`
- Test: `src/domain/version.test.ts`, `src/domain/diff.test.ts`, `src/domain/overlap.test.ts`, `src/domain/alerts.test.ts`

**Interfaces:**
- Produces:
  - `nextVersion(previous: string | null, now: Date): string` — `YYYY.MM.DD.n` in Denver; same-day increments `n`, else `.1`.
  - `diffContent(before: Content, after: Content): ContentDiff` with `{ addedSets: FestivalSet[]; removedSets: FestivalSet[]; movedSets: { before: FestivalSet; after: FestivalSet }[]; addedArtists: Artist[]; removedArtists: Artist[]; renamedArtists: { before: Artist; after: Artist }[]; identical: boolean }`.
  - `stageOverlaps(sets: FestivalSet[]): { a: FestivalSet; b: FestivalSet }[]` — same stage, same day, time overlap.
  - `expiryFor(preset: "none" | "1h" | "3h" | "eod", now: Date): string | undefined` — ISO with `-06:00`; `eod` = 23:59 Denver that day.
  - `newAlertId(now: Date): string` — `${YYYYMMDD}-${HHmm}-${4 random hex}`.
  - `ContentRepo`: `subscribePublished(cb: (c: Content | null) => void)`, `subscribeDraft(cb: (raw: unknown | null) => void)`, `saveDraft(raw: unknown): Promise<void>`, `publish(draft: Content, published: Content | null, by: string, now: Date): Promise<string>` (returns new version; atomic batch archiving the old doc), `listHistory(): Promise<{ version: string; archivedAt: string; content: Content }[]>`, `restore(version: string, by: string, now: Date): Promise<string>`.
  - `AlertsRepo`: `subscribeAlerts(cb: (a: Alert[]) => void)`, `sendAlert(input: Omit<Alert, "id" | "publishedAt" | "publishedBy" | "push">, by: string, now: Date): Promise<string>`, `deleteAlert(id: string): Promise<void>`.

- [ ] **Step 1: Tests**

`src/domain/version.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { nextVersion } from "./version";
import { parseIso } from "./time";
describe("nextVersion", () => {
  const sat = parseIso("2026-09-19T15:40:00-06:00");
  it("increments within the same Denver day, restarts on a new day", () => {
    expect(nextVersion(null, sat)).toBe("2026.09.19.1");
    expect(nextVersion("2026.09.19.3", sat)).toBe("2026.09.19.4");
    expect(nextVersion("2026.09.18.9", sat)).toBe("2026.09.19.1");
    expect(nextVersion("garbage", sat)).toBe("2026.09.19.1");
  });
  it("uses the Denver date even late at night UTC", () => {
    expect(nextVersion(null, parseIso("2026-09-19T23:30:00-06:00"))).toBe("2026.09.19.1"); // 05:30Z next day
  });
});
```

`src/domain/diff.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { Content } from "@shared";
import { diffContent } from "./diff";
const base = Content.parse({
  meta: { contentVersion: "1", publishedAt: "2026-09-09T12:00:00-06:00", publishedBy: "t", sources: [] },
  festival: { year: 2026, name: "F", edition: "E", venue: "V", city: "C", altitudeFt: 1, timezone: "America/Denver", days: [{ id: "fri", date: "2026-09-18", label: "Friday", gatesOpen: "11:30" }], links: { site: "https://a.b", lineup: "https://a.b", schedule: "https://a.b", faq: "https://a.b", guide: "https://a.b" } },
  stages: [{ id: "main", name: "Main", shortName: "Main", color: "sky", sortOrder: 1 }],
  artists: [{ id: "a", name: "A", tier: "lineup" }, { id: "b", name: "B", tier: "lineup" }],
  sets: [{ id: "s1", artistId: "a", stageId: "main", dayId: "fri", start: "2026-09-18T12:00:00-06:00", end: "2026-09-18T13:00:00-06:00" }],
});
describe("diffContent", () => {
  it("reports identical content", () => { expect(diffContent(base, base).identical).toBe(true); });
  it("finds moved, added, removed sets and renamed/added/removed artists", () => {
    const after = Content.parse({
      ...base,
      artists: [{ id: "a", name: "A!", tier: "lineup" }, { id: "c", name: "C", tier: "lineup" }],
      sets: [
        { ...base.sets[0]!, start: "2026-09-18T12:30:00-06:00", end: "2026-09-18T13:30:00-06:00" },
        { id: "s2", artistId: "c", stageId: "main", dayId: "fri", start: "2026-09-18T14:00:00-06:00", end: "2026-09-18T15:00:00-06:00" },
      ],
    });
    const d = diffContent(base, after);
    expect(d.identical).toBe(false);
    expect(d.movedSets.map((m) => m.after.id)).toEqual(["s1"]);
    expect(d.addedSets.map((s) => s.id)).toEqual(["s2"]);
    expect(d.removedSets).toEqual([]);
    expect(d.renamedArtists.map((r) => r.after.name)).toEqual(["A!"]);
    expect(d.addedArtists.map((a) => a.id)).toEqual(["c"]);
    expect(d.removedArtists.map((a) => a.id)).toEqual(["b"]);
  });
});
```

`src/domain/overlap.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { stageOverlaps } from "./overlap";
const s = (id: string, stageId: string, start: string, end: string) => ({ id, artistId: "x", stageId, dayId: "sat" as const, start: `2026-09-19T${start}:00-06:00`, end: `2026-09-19T${end}:00-06:00` });
describe("stageOverlaps", () => {
  it("flags overlapping sets on the same stage only", () => {
    const r = stageOverlaps([s("1", "main", "12:00", "13:00"), s("2", "main", "12:30", "13:30"), s("3", "blues", "12:30", "13:30"), s("4", "main", "13:00", "14:00")]);
    expect(r.map((p) => `${p.a.id}-${p.b.id}`)).toEqual(["1-2"]);
  });
});
```

`src/domain/alerts.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { expiryFor, newAlertId } from "./alerts";
import { parseIso } from "./time";
describe("alerts helpers", () => {
  const now = parseIso("2026-09-19T15:40:00-06:00");
  it("expiry presets", () => {
    expect(expiryFor("none", now)).toBeUndefined();
    expect(expiryFor("1h", now)).toBe("2026-09-19T16:40:00-06:00");
    expect(expiryFor("3h", now)).toBe("2026-09-19T18:40:00-06:00");
    expect(expiryFor("eod", now)).toBe("2026-09-19T23:59:00-06:00");
  });
  it("ids are sortable by time and unique-ish", () => {
    const a = newAlertId(now), b = newAlertId(now);
    expect(a.startsWith("20260919-1540-")).toBe(true);
    expect(a).not.toBe(b);
  });
});
```

Run: `npm test` → the four new files fail (modules not found).

- [ ] **Step 2: Domain**

`src/domain/version.ts`:
```ts
import { toDenverParts } from "./time";
export function nextVersion(previous: string | null, now: Date): string {
  const p = toDenverParts(now);
  const today = `${p.year}.${String(p.month).padStart(2, "0")}.${String(p.day).padStart(2, "0")}`;
  const m = previous ? /^(\d{4}\.\d{2}\.\d{2})\.(\d+)$/.exec(previous) : null;
  const n = m && m[1] === today ? Number(m[2]) + 1 : 1;
  return `${today}.${n}`;
}
```

`src/domain/diff.ts`:
```ts
import type { Artist, Content, FestivalSet } from "@shared";
export interface ContentDiff {
  addedSets: FestivalSet[]; removedSets: FestivalSet[]; movedSets: { before: FestivalSet; after: FestivalSet }[];
  addedArtists: Artist[]; removedArtists: Artist[]; renamedArtists: { before: Artist; after: Artist }[];
  identical: boolean;
}
const sameSet = (a: FestivalSet, b: FestivalSet) => a.artistId === b.artistId && a.stageId === b.stageId && a.dayId === b.dayId && a.start === b.start && a.end === b.end && (a.note ?? "") === (b.note ?? "");
export function diffContent(before: Content, after: Content): ContentDiff {
  const bSets = new Map(before.sets.map((s) => [s.id, s])), aSets = new Map(after.sets.map((s) => [s.id, s]));
  const bArt = new Map(before.artists.map((a) => [a.id, a])), aArt = new Map(after.artists.map((a) => [a.id, a]));
  const d: ContentDiff = { addedSets: [], removedSets: [], movedSets: [], addedArtists: [], removedArtists: [], renamedArtists: [], identical: false };
  for (const s of after.sets) { const b = bSets.get(s.id); if (!b) d.addedSets.push(s); else if (!sameSet(b, s)) d.movedSets.push({ before: b, after: s }); }
  for (const s of before.sets) if (!aSets.has(s.id)) d.removedSets.push(s);
  for (const a of after.artists) { const b = bArt.get(a.id); if (!b) d.addedArtists.push(a); else if (b.name !== a.name || b.tier !== a.tier) d.renamedArtists.push({ before: b, after: a }); }
  for (const a of before.artists) if (!aArt.has(a.id)) d.removedArtists.push(a);
  const { meta: _m, ...restB } = before; const { meta: _n, ...restA } = after;
  d.identical = JSON.stringify(restB) === JSON.stringify(restA);
  return d;
}
```

`src/domain/overlap.ts`:
```ts
import type { FestivalSet } from "@shared";
import { isoMs } from "./time";
export function stageOverlaps(sets: FestivalSet[]): { a: FestivalSet; b: FestivalSet }[] {
  const sorted = [...sets].sort((x, y) => isoMs(x.start) - isoMs(y.start));
  const out: { a: FestivalSet; b: FestivalSet }[] = [];
  for (let i = 0; i < sorted.length; i++) for (let j = i + 1; j < sorted.length; j++) {
    const a = sorted[i]!, b = sorted[j]!;
    if (a.stageId !== b.stageId || a.dayId !== b.dayId) continue;
    if (isoMs(b.start) < isoMs(a.end)) out.push({ a, b });
  }
  return out;
}
```

`src/domain/alerts.ts`:
```ts
import { toDenverParts } from "./time";
export type ExpiryPreset = "none" | "1h" | "3h" | "eod";
const OFFSET = "-06:00"; // festival runs in MDT; the fan app parses offsets, so this is exact for September
const pad = (n: number) => String(n).padStart(2, "0");
export function toDenverIso(d: Date): string {
  const p = toDenverParts(d);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}:00${OFFSET}`;
}
export function expiryFor(preset: ExpiryPreset, now: Date): string | undefined {
  if (preset === "none") return undefined;
  if (preset === "eod") { const p = toDenverParts(now); return `${p.year}-${pad(p.month)}-${pad(p.day)}T23:59:00${OFFSET}`; }
  const hours = preset === "1h" ? 1 : 3;
  return toDenverIso(new Date(now.getTime() + hours * 3_600_000));
}
export function newAlertId(now: Date): string {
  const p = toDenverParts(now);
  const rand = Math.floor(Math.random() * 0xffff).toString(16).padStart(4, "0");
  return `${p.year}${pad(p.month)}${pad(p.day)}-${pad(p.hour)}${pad(p.minute)}-${rand}`;
}
```
Note: `toDenverIso` assumes MDT (`-06:00`); a comment documents that this holds for the festival window and is revisited if the app outlives DST.

- [ ] **Step 3: Data repos**

`src/data/content.ts`:
```ts
import { collection, doc, getDocs, onSnapshot, orderBy, query, setDoc, writeBatch } from "firebase/firestore";
import { Content } from "@shared";
import { getFirebase } from "@/auth/firebase";
import { nextVersion } from "@/domain/version";
import { toDenverIso } from "@/domain/alerts";

const db = () => getFirebase().db;
export function subscribePublished(cb: (c: Content | null) => void): () => void {
  return onSnapshot(doc(db(), "content", "published"), (s) => { const p = s.exists() ? Content.safeParse(s.data()) : null; cb(p && p.success ? p.data : null); });
}
export function subscribeDraft(cb: (raw: unknown | null) => void): () => void {
  return onSnapshot(doc(db(), "content", "draft"), (s) => cb(s.exists() ? s.data() : null));
}
export async function saveDraft(raw: unknown): Promise<void> {
  await setDoc(doc(db(), "content", "draft"), raw as object);
}
/** Atomic: archive the old published doc (if any) and write the new one. Returns the new version. */
export async function publish(draft: Content, published: Content | null, by: string, now: Date): Promise<string> {
  const version = nextVersion(published?.meta.contentVersion ?? null, now);
  const next: Content = { ...draft, meta: { ...draft.meta, contentVersion: version, publishedAt: toDenverIso(now), publishedBy: by } };
  Content.parse(next);
  const batch = writeBatch(db());
  if (published) batch.set(doc(db(), "history", published.meta.contentVersion), { ...published, archivedAt: toDenverIso(now) });
  batch.set(doc(db(), "content", "published"), next);
  batch.set(doc(db(), "content", "draft"), next);
  await batch.commit();
  return version;
}
export async function listHistory(): Promise<{ version: string; archivedAt: string; content: Content }[]> {
  const snap = await getDocs(query(collection(db(), "history"), orderBy("archivedAt", "desc")));
  const out: { version: string; archivedAt: string; content: Content }[] = [];
  for (const d of snap.docs) { const { archivedAt, ...rest } = d.data() as { archivedAt: string } & Record<string, unknown>; const p = Content.safeParse(rest); if (p.success) out.push({ version: d.id, archivedAt, content: p.data }); }
  return out;
}
export async function restore(entry: Content, published: Content | null, by: string, now: Date): Promise<string> {
  return publish(entry, published, by, now);
}
```

`src/data/alerts.ts`:
```ts
import { collection, deleteDoc, doc, limit, onSnapshot, orderBy, query, setDoc } from "firebase/firestore";
import { Alert } from "@shared";
import { getFirebase } from "@/auth/firebase";
import { newAlertId, toDenverIso } from "@/domain/alerts";
const db = () => getFirebase().db;
export function subscribeAlerts(cb: (a: Alert[]) => void): () => void {
  return onSnapshot(query(collection(db(), "alerts"), orderBy("publishedAt", "desc"), limit(100)), (s) => {
    cb(s.docs.map((d) => Alert.safeParse({ ...d.data(), id: d.id })).filter((p) => p.success).map((p) => p.data));
  });
}
export async function sendAlert(input: { title: string; body: string; severity: Alert["severity"]; url?: string; expiresAt?: string }, by: string, now: Date): Promise<string> {
  const id = newAlertId(now);
  const alert = Alert.parse({ id, ...input, publishedAt: toDenverIso(now), publishedBy: by, push: false });
  const { id: _id, ...data } = alert;
  await setDoc(doc(db(), "alerts", id), data);
  return id;
}
export const deleteAlert = (id: string) => deleteDoc(doc(db(), "alerts", id));
```

- [ ] **Step 4: Verify, commit**

`npm test` (all green) and `npm run typecheck`. Commit: `feat(data): content/alerts repositories, version/diff/overlap/expiry helpers with tests`.

---

### Task 7: Draft store + Dashboard

**Files (festival-admin):**
- Create: `src/features/lineup/draftStore.ts`, `src/features/lineup/draftStore.test.ts`, `src/features/dashboard/Dashboard.tsx`, `src/data/usePublished.ts`, `src/data/useAlerts.ts`

**Interfaces:**
- Produces: `useDraft()` zustand store `{ raw: Record<string, unknown> | null; content: Content | null; issues: string[]; dirty: boolean; savedAt: string | null; saving: boolean; load(raw): void; update(fn: (c: Content) => Content): void; markSaved(at: string): void }`; `useDraftSync()` hook (subscribe once + debounced autosave 800 ms); `usePublished(): Content | null | undefined` (undefined while loading); `useAlertsList(): Alert[]`.

- [ ] **Step 1: Store test**

`src/features/lineup/draftStore.test.ts`:
```ts
import { beforeEach, describe, expect, it } from "vitest";
import { Content } from "@shared";
import { useDraft } from "./draftStore";
const valid = { meta: { contentVersion: "1", publishedAt: "2026-09-09T12:00:00-06:00", publishedBy: "t", sources: [] }, festival: { year: 2026, name: "F", edition: "E", venue: "V", city: "C", altitudeFt: 1, timezone: "America/Denver", days: [{ id: "fri", date: "2026-09-18", label: "Friday", gatesOpen: "11:30" }], links: { site: "https://a.b", lineup: "https://a.b", schedule: "https://a.b", faq: "https://a.b", guide: "https://a.b" } }, stages: [{ id: "main", name: "Main", shortName: "Main", color: "sky", sortOrder: 1 }], artists: [{ id: "a", name: "A", tier: "lineup" }], sets: [] };
describe("draft store", () => {
  beforeEach(() => useDraft.setState({ raw: null, content: null, issues: [], dirty: false, savedAt: null, saving: false }));
  it("loads valid content, exposes issues for invalid content", () => {
    useDraft.getState().load(valid);
    expect(useDraft.getState().content?.artists[0]?.name).toBe("A");
    expect(useDraft.getState().issues).toEqual([]);
    useDraft.getState().load({ ...valid, sets: [{ id: "s", artistId: "nope", stageId: "main", dayId: "fri", start: "2026-09-18T12:00:00-06:00", end: "2026-09-18T13:00:00-06:00" }] });
    expect(useDraft.getState().content).toBeNull();
    expect(useDraft.getState().issues.join(" ")).toMatch(/unknown artistId/);
  });
  it("update applies to content and marks dirty", () => {
    useDraft.getState().load(valid);
    useDraft.getState().update((c) => ({ ...c, artists: [...c.artists, { id: "b", name: "B", tier: "lineup" }] }));
    expect(useDraft.getState().content?.artists.length).toBe(2);
    expect(useDraft.getState().dirty).toBe(true);
    useDraft.getState().markSaved("2026-09-09T12:01:00-06:00");
    expect(useDraft.getState().dirty).toBe(false);
  });
});
```

- [ ] **Step 2: Store, sync hook, data hooks**

`src/features/lineup/draftStore.ts`:
```ts
import { create } from "zustand";
import { z } from "zod";
import { Content } from "@shared";
interface DraftState {
  raw: Record<string, unknown> | null; content: Content | null; issues: string[]; dirty: boolean; savedAt: string | null; saving: boolean;
  load: (raw: unknown) => void;
  update: (fn: (c: Content) => Content) => void;
  markSaved: (at: string) => void;
}
const parse = (raw: unknown) => { const p = Content.safeParse(raw); return p.success ? { content: p.data, issues: [] as string[] } : { content: null, issues: z.prettifyError(p.error).split("\n").filter(Boolean).slice(0, 8) }; };
export const useDraft = create<DraftState>()((set, get) => ({
  raw: null, content: null, issues: [], dirty: false, savedAt: null, saving: false,
  load: (raw) => set({ raw: raw as Record<string, unknown>, ...parse(raw), dirty: false }),
  update: (fn) => { const c = get().content; if (!c) return; const next = fn(c); set({ raw: next as unknown as Record<string, unknown>, ...parse(next), dirty: true }); },
  markSaved: (at) => set({ dirty: false, savedAt: at, saving: false }),
}));
```

`src/features/lineup/useDraftSync.ts`:
```ts
import { useEffect, useRef } from "react";
import { saveDraft, subscribeDraft } from "@/data/content";
import { toDenverIso } from "@/domain/alerts";
import { useDraft } from "./draftStore";
/** Loads the draft once, then autosaves local edits 800 ms after the last change. */
export function useDraftSync() {
  const loaded = useRef(false);
  useEffect(() => subscribeDraft((raw) => { if (!loaded.current && raw) { useDraft.getState().load(raw); loaded.current = true; } }), []);
  const raw = useDraft((s) => s.raw), dirty = useDraft((s) => s.dirty);
  useEffect(() => {
    if (!dirty || !raw) return;
    const t = setTimeout(async () => { useDraft.setState({ saving: true }); try { await saveDraft(raw); useDraft.getState().markSaved(toDenverIso(new Date())); } catch { useDraft.setState({ saving: false }); } }, 800);
    return () => clearTimeout(t);
  }, [raw, dirty]);
}
```

`src/data/usePublished.ts`:
```ts
import { useEffect, useState } from "react";
import type { Content } from "@shared";
import { subscribePublished } from "./content";
export function usePublished(): Content | null | undefined {
  const [c, setC] = useState<Content | null | undefined>(undefined);
  useEffect(() => subscribePublished(setC), []);
  return c;
}
```
`src/data/useAlerts.ts` — same shape over `subscribeAlerts`, initial `[]`.

`src/features/dashboard/Dashboard.tsx`:
```tsx
import { Link } from "react-router";
import { buttonClasses, Card, Chip, Eyebrow } from "@/design";
import { usePublished } from "@/data/usePublished";
import { useAlertsList } from "@/data/useAlerts";
import { useDraft } from "@/features/lineup/draftStore";
import { useDraftSync } from "@/features/lineup/useDraftSync";
import { diffContent } from "@/domain/diff";
import { formatTime, parseIso } from "@/domain/time";
export function Dashboard() {
  useDraftSync();
  const published = usePublished();
  const alerts = useAlertsList();
  const draft = useDraft((s) => s.content);
  const pending = published && draft ? !diffContent(published, draft).identical : false;
  return (
    <div className="space-y-6">
      <h1 className="font-display text-[28px] leading-8 text-structure-2">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <Card><Eyebrow tone="structure">Published lineup</Eyebrow>
          {published === undefined ? <p className="mt-2 text-fg-soft">Loading…</p> : published ? <><p className="mt-2 text-[20px] font-semibold">v{published.meta.contentVersion}</p><p className="text-[13px] text-fg-soft">{published.artists.length} artists · {published.sets.length} sets · by {published.meta.publishedBy} at {formatTime(parseIso(published.meta.publishedAt))}</p></> : <p className="mt-2 text-fg-soft">Nothing published yet.</p>}
          {pending && <div className="mt-2"><Chip tone="sun">Draft has unpublished changes</Chip></div>}
        </Card>
        <Card><Eyebrow tone="structure">Last alert</Eyebrow>
          {alerts[0] ? <><p className="mt-2 text-[16px] font-semibold">{alerts[0].title}</p><p className="text-[13px] text-fg-soft">{alerts[0].severity} · {formatTime(parseIso(alerts[0].publishedAt))}</p></> : <p className="mt-2 text-fg-soft">No alerts sent.</p>}
        </Card>
        <Card><Eyebrow tone="structure">Fan app</Eyebrow><p className="mt-2 text-[13px] text-fg-soft">Changes appear on every phone within seconds of publishing.</p><a className="mt-2 inline-block text-structure-2 underline" href="https://samgumble.github.io/festival-app/" target="_blank" rel="noreferrer">Open the fan app ↗</a></Card>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link to="/lineup" className={buttonClasses({ variant: "ink" })}>Edit lineup</Link>
        <Link to="/alerts" className={buttonClasses({ variant: "sun" })}>Send alert</Link>
        <Link to="/publish" className={buttonClasses({ variant: pending ? "sun" : "ghost" })}>Publish{pending ? " · changes waiting" : ""}</Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify, commit** — `npm test && npm run typecheck`; commit `feat(admin): draft store with autosave; dashboard`.

---

### Task 8: Lineup editor (artists + sets, autosave, overlap warnings)

**Files (festival-admin):**
- Replace: `src/features/lineup/LineupEditor.tsx`
- Create: `src/features/lineup/ArtistsTable.tsx`, `src/features/lineup/SetsEditor.tsx`, `src/features/lineup/SetRowEditor.tsx`, `src/features/lineup/ids.ts`, `src/features/lineup/ids.test.ts`, `src/features/lineup/LineupEditor.test.tsx`

**Interfaces:**
- Produces: `slugify(name): string` and `newSetId(dayId, artistId, stageId, startIso): string` (same id format as the content package: `${day}-${artist}-${stage}-${HHMM}`); the editor mutates the draft store only (autosave from Task 7).

- [ ] **Step 1: Tests**

`src/features/lineup/ids.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { newSetId, slugify } from "./ids";
describe("ids", () => {
  it("slugifies names like the content package", () => {
    expect(slugify("Taj Mahal & Keb’ Mo’")).toBe("taj-mahal-keb-mo");
    expect(slugify("Eddie 9V")).toBe("eddie-9v");
  });
  it("set ids follow day-artist-stage-HHMM", () => {
    expect(newSetId("sat", "charlie-musselwhite-ga20", "main", "2026-09-19T16:30:00-06:00")).toBe("sat-charlie-musselwhite-ga20-main-1630");
  });
});
```

`src/features/lineup/LineupEditor.test.tsx` (renders against the draft store, no Firestore):
```tsx
import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router";
import { useDraft } from "./draftStore";
import { LineupEditor } from "./LineupEditor";
vi.mock("./useDraftSync", () => ({ useDraftSync: () => {} }));
const content = { meta: { contentVersion: "1", publishedAt: "2026-09-09T12:00:00-06:00", publishedBy: "t", sources: [] }, festival: { year: 2026, name: "F", edition: "E", venue: "V", city: "C", altitudeFt: 1, timezone: "America/Denver", days: [{ id: "sat", date: "2026-09-19", label: "Saturday", gatesOpen: "11:30" }], links: { site: "https://a.b", lineup: "https://a.b", schedule: "https://a.b", faq: "https://a.b", guide: "https://a.b" } }, stages: [{ id: "main", name: "Main Stage", shortName: "Main", color: "sky", sortOrder: 1 }], artists: [{ id: "a", name: "Artist A", tier: "lineup" }, { id: "b", name: "Artist B", tier: "headliner" }], sets: [{ id: "sat-a-main-1200", artistId: "a", stageId: "main", dayId: "sat", start: "2026-09-19T12:00:00-06:00", end: "2026-09-19T13:00:00-06:00" }] };
describe("LineupEditor", () => {
  beforeEach(() => { useDraft.setState({ raw: null, content: null, issues: [], dirty: false, savedAt: null, saving: false }); useDraft.getState().load(content); });
  it("renames an artist in the draft", () => {
    render(<MemoryRouter><LineupEditor /></MemoryRouter>);
    const input = screen.getByDisplayValue("Artist A");
    fireEvent.change(input, { target: { value: "Artist A Trio" } });
    expect(useDraft.getState().content?.artists[0]?.name).toBe("Artist A Trio");
  });
  it("adds a set and warns on same-stage overlap", () => {
    render(<MemoryRouter><LineupEditor /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: /add set/i }));
    const rows = screen.getAllByTestId("set-row");
    expect(rows.length).toBe(2);
    // new set defaults to the same stage/day; set its time to overlap 12:00–13:00
    const start = within(rows[1]!).getByLabelText("Start");
    fireEvent.change(start, { target: { value: "12:30" } });
    expect(screen.getAllByText(/overlaps/i).length).toBeGreaterThan(0);
  });
  it("removes a set", () => {
    render(<MemoryRouter><LineupEditor /></MemoryRouter>);
    fireEvent.click(within(screen.getByTestId("set-row")).getByRole("button", { name: /remove/i }));
    expect(useDraft.getState().content?.sets.length).toBe(0);
  });
});
```

- [ ] **Step 2: ids + editor**

`src/features/lineup/ids.ts`:
```ts
import { toDenverParts } from "@/domain/time";
import { parseIso } from "@/domain/time";
export const slugify = (name: string) => name.normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[’'“”"]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export function newSetId(dayId: string, artistId: string, stageId: string, startIso: string): string {
  const p = toDenverParts(parseIso(startIso));
  return `${dayId}-${artistId}-${stageId}-${String(p.hour).padStart(2, "0")}${String(p.minute).padStart(2, "0")}`;
}
```

`src/features/lineup/ArtistsTable.tsx`:
```tsx
import { Button, Select } from "@/design";
import { Tier } from "@shared";
import { useDraft } from "./draftStore";
import { slugify } from "./ids";
export function ArtistsTable() {
  const content = useDraft((s) => s.content)!;
  const update = useDraft((s) => s.update);
  const usedBy = (id: string) => content.sets.filter((s) => s.artistId === id).length;
  return (
    <section>
      <div className="flex items-center justify-between"><h2 className="text-[20px] font-semibold">Artists ({content.artists.length})</h2>
        <Button size="sm" onClick={() => update((c) => { const base = "new-artist"; let id = base, n = 2; while (c.artists.some((a) => a.id === id)) id = `${base}-${n++}`; return { ...c, artists: [...c.artists, { id, name: "New artist", tier: "lineup" }] }; })}>Add artist</Button></div>
      <div className="mt-3 divide-y divide-hair rounded-card border border-hair bg-surface">
        {content.artists.map((a, i) => (
          <div key={a.id} className="flex flex-wrap items-center gap-2 px-3 py-2" data-testid="artist-row">
            <input aria-label={`Name of ${a.name}`} className="h-11 min-w-0 flex-1 rounded-ctl border border-hair bg-surface px-3" value={a.name}
              onChange={(e) => update((c) => ({ ...c, artists: c.artists.map((x) => x.id === a.id ? { ...x, name: e.target.value } : x) }))}
              onBlur={() => { if (a.id.startsWith("new-artist") && usedBy(a.id) === 0) { const id = slugify(a.name) || a.id; if (!content.artists.some((x) => x.id === id)) update((c) => ({ ...c, artists: c.artists.map((x) => x.id === a.id ? { ...x, id } : x) })); } }} />
            <Select aria-label={`Tier of ${a.name}`} value={a.tier} onChange={(e) => update((c) => ({ ...c, artists: c.artists.map((x) => x.id === a.id ? { ...x, tier: e.target.value as Tier } : x) }))}>
              {Tier.options.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
            <span className="micro text-fg-soft">{usedBy(a.id)} set{usedBy(a.id) === 1 ? "" : "s"}</span>
            <Button size="sm" onClick={() => update((c) => { const arr = [...c.artists]; const j = Math.max(0, i - 1); [arr[i], arr[j]] = [arr[j]!, arr[i]!]; return { ...c, artists: arr }; })} aria-label={`Move ${a.name} up`}>↑</Button>
            <Button size="sm" variant="danger" disabled={usedBy(a.id) > 0} aria-label={`Remove ${a.name}`} onClick={() => update((c) => ({ ...c, artists: c.artists.filter((x) => x.id !== a.id) }))}>Remove</Button>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[13px] text-fg-soft">Artists with sets can't be removed — remove their sets first. Order here is the poster order.</p>
    </section>
  );
}
```
(`Tier` is the Zod enum exported by `@shared`; `Tier.options` lists its values.)

`src/features/lineup/SetRowEditor.tsx`:
```tsx
import type { Content, FestivalSet } from "@shared";
import { Button, Select } from "@/design";
import { fromDenver, parseIso, toDenverParts } from "@/domain/time";
import { toDenverIso } from "@/domain/alerts";
import { useDraft } from "./draftStore";
const hhmm = (iso: string) => { const p = toDenverParts(parseIso(iso)); return `${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`; };
export function SetRowEditor({ set, content, overlaps }: { set: FestivalSet; content: Content; overlaps: boolean }) {
  const update = useDraft((s) => s.update);
  const patch = (p: Partial<FestivalSet>) => update((c) => ({ ...c, sets: c.sets.map((x) => x.id === set.id ? { ...x, ...p } : x) }));
  const day = content.festival.days.find((d) => d.id === set.dayId)!;
  const setTime = (field: "start" | "end", v: string) => { if (!/^\d{2}:\d{2}$/.test(v)) return; patch({ [field]: toDenverIso(fromDenver(day.date, v)) }); };
  const moveDay = (dayId: FestivalSet["dayId"]) => { const d = content.festival.days.find((x) => x.id === dayId)!; patch({ dayId, start: toDenverIso(fromDenver(d.date, hhmm(set.start))), end: toDenverIso(fromDenver(d.date, hhmm(set.end))) }); };
  return (
    <div data-testid="set-row" className={`flex flex-wrap items-end gap-2 px-3 py-2 ${overlaps ? "bg-ember/10" : ""}`}>
      <label className="grid text-[11px] text-fg-soft">Artist<Select value={set.artistId} onChange={(e) => patch({ artistId: e.target.value })}>{content.artists.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</Select></label>
      <label className="grid text-[11px] text-fg-soft">Day<Select value={set.dayId} onChange={(e) => moveDay(e.target.value as FestivalSet["dayId"])}>{content.festival.days.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}</Select></label>
      <label className="grid text-[11px] text-fg-soft">Stage<Select value={set.stageId} onChange={(e) => patch({ stageId: e.target.value })}>{content.stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></label>
      <label className="grid text-[11px] text-fg-soft">Start<input aria-label="Start" type="time" step={900} className="h-11 rounded-ctl border border-hair bg-surface px-2" value={hhmm(set.start)} onChange={(e) => setTime("start", e.target.value)} /></label>
      <label className="grid text-[11px] text-fg-soft">End<input aria-label="End" type="time" step={900} className="h-11 rounded-ctl border border-hair bg-surface px-2" value={hhmm(set.end)} onChange={(e) => setTime("end", e.target.value)} /></label>
      <label className="grid min-w-40 flex-1 text-[11px] text-fg-soft">Note<input className="h-11 rounded-ctl border border-hair bg-surface px-2" value={set.note ?? ""} onChange={(e) => patch({ note: e.target.value || undefined })} placeholder="optional" /></label>
      {overlaps && <span className="micro rounded-chip bg-ember px-2 py-1 text-white">Overlaps another set on this stage</span>}
      <Button size="sm" variant="danger" aria-label={`Remove set ${set.id}`} onClick={() => update((c) => ({ ...c, sets: c.sets.filter((x) => x.id !== set.id) }))}>Remove</Button>
    </div>
  );
}
```

`src/features/lineup/SetsEditor.tsx`:
```tsx
import { Button } from "@/design";
import { isoMs } from "@/domain/time";
import { stageOverlaps } from "@/domain/overlap";
import { toDenverIso } from "@/domain/alerts";
import { fromDenver } from "@/domain/time";
import { useDraft } from "./draftStore";
import { newSetId } from "./ids";
import { SetRowEditor } from "./SetRowEditor";
export function SetsEditor() {
  const content = useDraft((s) => s.content)!;
  const update = useDraft((s) => s.update);
  const overlapping = new Set(stageOverlaps(content.sets).flatMap((p) => [p.a.id, p.b.id]));
  const addSet = (dayId: string) => update((c) => {
    const day = c.festival.days.find((d) => d.id === dayId)!; const artist = c.artists[0]!; const stage = c.stages[0]!;
    const start = toDenverIso(fromDenver(day.date, "12:00")), end = toDenverIso(fromDenver(day.date, "13:00"));
    let id = newSetId(day.id, artist.id, stage.id, start), n = 2; while (c.sets.some((s) => s.id === id)) id = `${newSetId(day.id, artist.id, stage.id, start)}-${n++}`;
    return { ...c, sets: [...c.sets, { id, artistId: artist.id, stageId: stage.id, dayId: day.id, start, end }] };
  });
  return (
    <section className="space-y-6">
      <h2 className="text-[20px] font-semibold">Sets ({content.sets.length})</h2>
      {content.festival.days.map((day) => {
        const sets = content.sets.filter((s) => s.dayId === day.id).sort((a, b) => isoMs(a.start) - isoMs(b.start));
        return (
          <div key={day.id}>
            <div className="flex items-center justify-between"><h3 className="eyebrow text-structure">{day.label} · {sets.length}</h3><Button size="sm" onClick={() => addSet(day.id)}>Add set</Button></div>
            <div className="mt-2 divide-y divide-hair rounded-card border border-hair bg-surface">
              {sets.length === 0 && <p className="px-3 py-3 text-[13px] text-fg-soft">No sets on {day.label}.</p>}
              {sets.map((s) => <SetRowEditor key={s.id} set={s} content={content} overlaps={overlapping.has(s.id)} />)}
            </div>
          </div>
        );
      })}
    </section>
  );
}
```
(The test's "Add set" click uses the first day's button; there is exactly one day in the fixture.)

`src/features/lineup/LineupEditor.tsx`:
```tsx
import { Link } from "react-router";
import { Button, buttonClasses, Chip } from "@/design";
import { formatTime, parseIso } from "@/domain/time";
import { ArtistsTable } from "./ArtistsTable";
import { SetsEditor } from "./SetsEditor";
import { useDraft } from "./draftStore";
import { useDraftSync } from "./useDraftSync";
export function LineupEditor() {
  useDraftSync();
  const { raw, content, issues, dirty, saving, savedAt } = useDraft();
  if (!raw) return <p className="text-fg-soft">Loading draft…</p>;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-[28px] leading-8 text-structure-2">Lineup</h1>
        <Chip tone={dirty || saving ? "sun" : "paper"}>{saving ? "Saving…" : dirty ? "Unsaved" : savedAt ? `Saved ${formatTime(parseIso(savedAt))}` : "Draft"}</Chip>
        <Link to="/publish" className={`ml-auto ${buttonClasses({ variant: "sun", size: "sm" })}`}>Publish…</Link>
      </div>
      {issues.length > 0 && <div role="alert" className="rounded-card border border-ember bg-ember/10 p-3 text-[14px]"><b>Draft has problems — fix before publishing:</b><ul className="mt-1 list-disc pl-5">{issues.map((i) => <li key={i}>{i}</li>)}</ul></div>}
      {content ? <><ArtistsTable /><SetsEditor /></> : <p className="text-fg-soft">The draft can't be edited until it validates. Use Publish → Discard draft to restore it from the published lineup.</p>}
      <p className="text-[13px] text-fg-soft">Edits save automatically to the draft. Nothing reaches fans until you Publish.</p>
      <Button size="sm" onClick={() => window.scrollTo({ top: 0 })}>Back to top</Button>
    </div>
  );
}
```

- [ ] **Step 3: Verify, commit** — `npm test && npm run typecheck`; commit `feat(admin): lineup editor — artists, sets with Denver time pickers, overlap warnings, autosave`.

---

### Task 9: Alerts — compose with preview, send, history, delete

**Files (festival-admin):**
- Replace: `src/features/alerts/AlertsPage.tsx`
- Create: `src/features/alerts/Compose.tsx`, `src/features/alerts/AlertPreview.tsx`, `src/features/alerts/History.tsx`, `src/features/alerts/AlertsPage.test.tsx`

- [ ] **Step 1: Test** — `src/features/alerts/AlertsPage.test.tsx`: mock `@/data/alerts` (`sendAlert` resolves `"id"`, `deleteAlert` resolves, `subscribeAlerts` calls back with one alert) and `@/auth/session` (user email); render `AlertsPage` in a `MemoryRouter`; type a 61-char title → the Send button is disabled and an error shows; fix the title, click Send → the confirm dialog appears → confirm → `sendAlert` called with `{ title, body, severity: "info" }` and `sam.gumble@gmail.com`; click the history item's Delete → dialog → confirm → `deleteAlert("a1")`.

- [ ] **Step 2: Implementation**

`AlertPreview.tsx` — a 360-px wide card styled like the fan app's alert card (left severity bar `border-l-[5px]` sky/sun/ember, unread dot, title, time "now", severity chip, body, optional "Details ↗").

`Compose.tsx`:
```tsx
import { useState } from "react";
import type { Alert } from "@shared";
import { Button, Dialog, Field, Select } from "@/design";
import { expiryFor, type ExpiryPreset } from "@/domain/alerts";
import { AlertPreview } from "./AlertPreview";
export function Compose({ onSend }: { onSend: (input: { title: string; body: string; severity: Alert["severity"]; url?: string; expiresAt?: string }) => Promise<void> }) {
  const [title, setTitle] = useState(""), [body, setBody] = useState(""), [severity, setSeverity] = useState<Alert["severity"]>("info"), [url, setUrl] = useState(""), [expiry, setExpiry] = useState<ExpiryPreset>("none");
  const [confirm, setConfirm] = useState(false), [busy, setBusy] = useState(false), [sent, setSent] = useState<string | null>(null);
  const titleErr = title.length > 60 ? `${title.length}/60 — too long` : undefined;
  const bodyErr = body.length > 240 ? `${body.length}/240 — too long` : undefined;
  const urlErr = url && !/^https:\/\//.test(url) ? "Must start with https://" : undefined;
  const valid = title.trim() && body.trim() && !titleErr && !bodyErr && !urlErr;
  const send = async () => { setBusy(true); await onSend({ title: title.trim(), body: body.trim(), severity, url: url || undefined, expiresAt: expiryFor(expiry, new Date()) }); setBusy(false); setConfirm(false); setSent(title); setTitle(""); setBody(""); setUrl(""); setExpiry("none"); setSeverity("info"); };
  return (
    <div className="grid gap-6 md:grid-cols-[1fr_380px]">
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (valid) setConfirm(true); }}>
        <Field label="Title" error={titleErr} hint={`${title.length}/60`}><input value={title} onChange={(e) => setTitle(e.target.value)} required /></Field>
        <Field label="Message" error={bodyErr} hint={`${body.length}/240`}><textarea rows={4} className="rounded-ctl border border-hair bg-surface p-3 text-[15px]" value={body} onChange={(e) => setBody(e.target.value)} required /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Severity" hint="Urgent shows a red banner on the Now screen while it's active"><Select value={severity} onChange={(e) => setSeverity(e.target.value as Alert["severity"])}><option value="info">Info</option><option value="important">Important</option><option value="urgent">Urgent</option></Select></Field>
          <Field label="Expires"><Select value={expiry} onChange={(e) => setExpiry(e.target.value as ExpiryPreset)}><option value="none">Doesn't expire</option><option value="1h">In 1 hour</option><option value="3h">In 3 hours</option><option value="eod">End of today</option></Select></Field>
        </div>
        <Field label="Link (optional)" error={urlErr}><input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.tellurideblues.com/…" /></Field>
        <Button type="submit" variant="sun" disabled={!valid || busy}>Send alert</Button>
        {sent && <p role="status" className="text-[14px] text-pine">Sent “{sent}”. It's on every phone now.</p>}
      </form>
      <div><p className="eyebrow mb-2 text-fg-soft">Preview</p><AlertPreview title={title || "Title"} body={body || "Message"} severity={severity} url={url || undefined} /></div>
      <Dialog open={confirm} title="Send this alert?" body={`“${title}” goes to everyone using the app. Alerts can be deleted but not edited.`} confirmLabel={busy ? "Sending…" : "Send"} onConfirm={send} onCancel={() => setConfirm(false)} />
    </div>
  );
}
```

`History.tsx` — list of `useAlertsList()` newest first: severity chip, title, body, time, expiry, publishedBy, a **Delete** (`danger`, `sm`) that opens `Dialog` ("Delete this alert? It disappears from every phone on their next sync.") and calls `deleteAlert(id)`.

`AlertsPage.tsx` — heading, `<Compose onSend={(input) => sendAlert(input, user.email, new Date()).then(() => undefined)} />`, then `<History />`.

- [ ] **Step 3: Verify, commit** — tests + typecheck; commit `feat(admin): alerts compose with preview, confirm, history, delete`.

---

### Task 10: Publish page — diff, publish, discard draft, rollback

**Files (festival-admin):**
- Replace: `src/features/publish/PublishPage.tsx`
- Create: `src/features/publish/DiffList.tsx`, `src/features/publish/HistoryList.tsx`, `src/features/publish/PublishPage.test.tsx`

- [ ] **Step 1: Test** — mock `@/data/content` (`publish` resolves `"2026.09.19.2"`, `listHistory` resolves one entry, `saveDraft` resolves, `subscribePublished`/`subscribeDraft` feed the fixtures) and `@/auth/session`; render with a draft that moves one set: the diff list shows "1 moved"; **Publish v…** is enabled; click → dialog → confirm → `publish` called with the draft, the published, `sam.gumble@gmail.com`; with an identical draft the button is disabled and "No changes to publish" shows; the history entry's **Restore** → dialog → confirm → `restore`/`publish` called with the history content.

- [ ] **Step 2: Implementation**

`DiffList.tsx` — given `ContentDiff` + artist/stage name lookups, renders grouped lists: "Moved (n)": `Artist · Stage · was Fri 4:30 – 5:40 → now Fri 5:00 – 6:10`; "Added (n)"; "Removed (n)"; artists renamed/added/removed. Uses `formatRange`/`parseIso`.

`HistoryList.tsx` — `listHistory()` on mount; each row: version, archivedAt, publishedBy, counts, **Restore** (ghost, sm) → `Dialog` ("Restore v…? The current lineup is archived first; fans see the restored lineup within seconds.") → `onRestore(entry.content)`.

`PublishPage.tsx`:
```tsx
import { useState } from "react";
import { Button, Card, Chip, Dialog, Eyebrow } from "@/design";
import { publish, restore, saveDraft } from "@/data/content";
import { usePublished } from "@/data/usePublished";
import { useSession } from "@/auth/session";
import { diffContent } from "@/domain/diff";
import { nextVersion } from "@/domain/version";
import { formatTime, parseIso } from "@/domain/time";
import { useDraft } from "@/features/lineup/draftStore";
import { useDraftSync } from "@/features/lineup/useDraftSync";
import { DiffList } from "./DiffList";
import { HistoryList } from "./HistoryList";
export function PublishPage() {
  useDraftSync();
  const published = usePublished();
  const { content: draft, issues, dirty, saving } = useDraft();
  const user = useSession((s) => s.user)!;
  const [confirm, setConfirm] = useState<"publish" | "discard" | null>(null);
  const [busy, setBusy] = useState(false), [result, setResult] = useState<string | null>(null), [error, setError] = useState<string | null>(null);
  if (published === undefined) return <p className="text-fg-soft">Loading…</p>;
  const diff = published && draft ? diffContent(published, draft) : null;
  const canPublish = !!draft && issues.length === 0 && !dirty && !saving && (!published || (diff && !diff.identical));
  const version = nextVersion(published?.meta.contentVersion ?? null, new Date());
  const run = async (fn: () => Promise<string | void>, ok: (v: string | void) => string) => { setBusy(true); setError(null); try { setResult(ok(await fn())); } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong"); } finally { setBusy(false); setConfirm(null); } };
  return (
    <div className="space-y-6">
      <h1 className="font-display text-[28px] leading-8 text-structure-2">Publish</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Card><Eyebrow tone="structure">Published</Eyebrow>{published ? <p className="mt-1 text-[18px] font-semibold">v{published.meta.contentVersion} <span className="text-[13px] font-normal text-fg-soft">by {published.meta.publishedBy} · {formatTime(parseIso(published.meta.publishedAt))}</span></p> : <p className="mt-1 text-fg-soft">Nothing published yet.</p>}</Card>
        <Card><Eyebrow tone="structure">Draft</Eyebrow><p className="mt-1 text-[18px] font-semibold">{draft ? `${draft.artists.length} artists · ${draft.sets.length} sets` : "Invalid"} {dirty || saving ? <Chip tone="sun">saving…</Chip> : null}</p>{issues.length > 0 && <ul role="alert" className="mt-2 list-disc pl-5 text-[13px] text-ember">{issues.map((i) => <li key={i}>{i}</li>)}</ul>}</Card>
      </div>
      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-[20px] font-semibold">Changes since v{published?.meta.contentVersion ?? "—"}</h2>
          <div className="ml-auto flex gap-2">
            <Button disabled={!published || busy} onClick={() => setConfirm("discard")}>Discard draft</Button>
            <Button variant="sun" disabled={!canPublish || busy} onClick={() => setConfirm("publish")}>Publish v{version}</Button>
          </div>
        </div>
        {diff && diff.identical && <p className="mt-3 text-fg-soft">No changes to publish.</p>}
        {diff && !diff.identical && draft && <DiffList diff={diff} content={draft} before={published!} />}
        {!published && draft && <p className="mt-3 text-fg-soft">First publish: the whole draft goes live as v{version}.</p>}
        {result && <p role="status" className="mt-3 text-pine">{result}</p>}
        {error && <p role="alert" className="mt-3 text-ember">{error}</p>}
      </Card>
      <HistoryList onRestore={(entry) => run(() => restore(entry, published, user.email, new Date()), (v) => `Restored as v${v}. Fans see it within seconds.`)} busy={busy} />
      <Dialog open={confirm === "publish"} title={`Publish v${version}?`} body="Every phone updates within seconds. The current lineup is archived so you can roll back." confirmLabel={busy ? "Publishing…" : "Publish"} onConfirm={() => run(() => publish(draft!, published, user.email, new Date()), (v) => `Published v${v}.`)} onCancel={() => setConfirm(null)} />
      <Dialog open={confirm === "discard"} title="Discard draft changes?" body="The draft goes back to the published lineup. Unpublished edits are lost." confirmLabel="Discard" danger onConfirm={() => run(async () => { await saveDraft(published!); useDraft.getState().load(published!); }, () => "Draft reset to the published lineup.")} onCancel={() => setConfirm(null)} />
    </div>
  );
}
```

- [ ] **Step 3: Verify, commit** — tests + typecheck; commit `feat(admin): publish with diff and confirm, discard draft, rollback from history`.

---

### Task 11: Deploy both, end-to-end check, docs

- [ ] **Step 1: Deploy the admin console** — in `festival-admin`: `npm test && npm run typecheck && npm run build`, `git push origin main`, `gh run watch` until green; `curl -s -o /dev/null -w "%{http_code}" https://samgumble.github.io/festival-admin/` → 200.
- [ ] **Step 2: Real-project check (controller + Sam; needs the seed from Task 2):** sign in at https://samgumble.github.io/festival-admin/ as sam.gumble@gmail.com → Dashboard shows v2026.09.09.1 → Lineup: move one set by 15 min → Publish v2026.09.xx.1 → https://samgumble.github.io/festival-app/info shows the new version and "live"; Lineup shows the moved time. Alerts: send an "info" test alert → it appears in the fan app's Alerts tab; delete it → it disappears. Publish → Restore the previous version → fan app reverts. Record the results in `docs/HANDOFF.md`.
- [ ] **Step 3: Docs (festival-app)** — HANDOFF status board: `Firebase project + rules` ✅ (rules deployed, tests), `Admin console + Functions` → `Admin console` ✅ with the Pages URL and "no Functions/push (D-021)", `Content seed` ✅ (Firestore seeded v2026.09.09.1), add `Live content in fan app` ✅. Session log line. `CLAUDE.md`: add `npm run rules:test · npm run rules:deploy · npm run emulators · npm run seed` to Commands and a Rules bullet: "Firestore writes only from the admin console under `firebase/firestore.rules`; never widen rules to make a demo work." Commit `docs: live backend + admin console shipped`, push.
- [ ] **Step 4: Sync note** — in `festival-admin/README.md` keep the subtree sync commands (Task 4) and add "Run after any change to `packages/shared` in festival-app."

---

## Self-review notes

- **Spec coverage:** §4 data model → Tasks 1–2, 6; §5 rules → Task 1; §6 fan app → Task 3; §7 admin console (stack, design, auth, four screens, publish algorithm, tests) → Tasks 4–10; §8 layout → Tasks 1, 4; §9 done → Tasks 1–3, 11.
- **Deviations noted for the reviewer:** rules carry only shape guards (full validation is Zod in both apps); `restore()` is `publish()` of a history entry (new version, old one archived) — matches "history is append-only"; `toDenverIso` fixes the offset at `-06:00` (documented; the festival is in MDT).
- **Type consistency:** `ContentRepository`/`AlertsRepository` shapes match the design pass; `publish(draft, published, by, now)` is called identically from PublishPage and HistoryList (via `restore`); `useDraft` fields (`raw, content, issues, dirty, savedAt, saving, load, update, markSaved`) are used consistently across Tasks 7–10; `Tier.options` relies on `Tier` being exported as a Zod enum from `@bb/shared` (it is).
