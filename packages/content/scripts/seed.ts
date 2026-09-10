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
