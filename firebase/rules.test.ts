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
