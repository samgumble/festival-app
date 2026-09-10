import { collection, limit, onSnapshot, orderBy, query, type Firestore, type Unsubscribe } from "firebase/firestore";
import type { Alert } from "@bb/shared";
import { applyAlertsSnapshot, type ListenerHandle } from "./firestore-content";

/**
 * Attach a live `alerts` listener (newest 50, by `publishedAt`). `onChange` fires with the full
 * validated list on every update; `onError` runs on a listener error so the caller can reset its
 * "started" flag and let a later `subscribe` retry.
 */
export function startAlertsListener(db: Firestore, onChange: (alerts: Alert[]) => void, onError?: () => void): ListenerHandle {
  const q = query(collection(db, "alerts"), orderBy("publishedAt", "desc"), limit(50));
  const unsubscribe: Unsubscribe = onSnapshot(
    q,
    (snap) => onChange(applyAlertsSnapshot(snap.docs.map((d) => ({ id: d.id, data: d.data() })))),
    (err) => {
      console.warn("alerts listener error", err);
      onError?.();
    },
  );
  return { stop: () => unsubscribe() };
}
