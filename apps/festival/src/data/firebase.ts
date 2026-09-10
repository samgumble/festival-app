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
