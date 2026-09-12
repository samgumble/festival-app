import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, getFirestore, writeBatch } from "firebase/firestore";
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

let cred;
try {
  cred = await signInWithEmailAndPassword(auth, email, password);
} catch (err) {
  console.error(`Sign-in failed for ${email}: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
}

const adminDoc = await getDoc(doc(db, "admins", cred.user.uid));
if (!adminDoc.exists()) {
  console.error(`Signed in as ${email} (uid ${cred.user.uid}) but admins/${cred.user.uid} does not exist. Create it in the Firebase console first.`);
  process.exit(3);
}

// World-readable docs carry the admin uid, not an email address (D-025).
const publishedBy = cred.user.uid;

const published = await getDoc(doc(db, "content", "published"));
if (published.exists() && process.env.SEED_FORCE !== "1") {
  console.log(`content/published already exists (v${(published.data() as { meta: { contentVersion: string } }).meta.contentVersion}). Set SEED_FORCE=1 to overwrite.`);
  process.exit(0);
}

const now = new Date().toISOString();
if (published.exists()) {
  const old = published.data() as { meta: { contentVersion: string } };
  const historyDoc = await getDoc(doc(db, "history", old.meta.contentVersion));
  if (historyDoc.exists()) {
    console.error(`history/${old.meta.contentVersion} already exists — bump the content version first.`);
    process.exit(4);
  }
}

try {
  const batch = writeBatch(db);
  if (published.exists()) {
    const old = published.data() as { meta: { contentVersion: string } };
    batch.set(doc(db, "history", old.meta.contentVersion), { ...published.data(), archivedAt: now });
  }
  batch.set(doc(db, "content", "published"), { ...content, meta: { ...content.meta, publishedBy } });
  batch.set(doc(db, "content", "draft"), { ...content, meta: { ...content.meta, publishedBy } });
  await batch.commit();
} catch (err) {
  console.error(`Seed write failed: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
}

console.log(`Seeded content/published and content/draft at v${content.meta.contentVersion} as uid ${publishedBy} (${email}).`);
process.exit(0);
