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
