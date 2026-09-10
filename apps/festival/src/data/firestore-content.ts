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
