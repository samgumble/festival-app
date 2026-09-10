import { doc, onSnapshot, type Firestore, type Unsubscribe } from "firebase/firestore";
import { Alert, Content } from "@bb/shared";
import { isoMs } from "@/domain/time";

export interface ContentStatus {
  source: "bundled" | "live" | "cache";
  contentVersion: string;
  updatedAt: string | null;
}
export interface ContentState { current: Content; status: ContentStatus }

export interface ListenerHandle { stop(): void }

/** Pure: fold one Firestore snapshot into the current state. Invalid or missing docs never replace good content. */
export function applyContentSnapshot(state: ContentState, snap: { exists: boolean; data: unknown; fromCache: boolean }): ContentState {
  if (!snap.exists) return state;
  const parsed = Content.safeParse(snap.data);
  if (!parsed.success) {
    console.warn("content/published failed validation; keeping last good content", parsed.error.issues.slice(0, 3));
    return state;
  }
  const sameVersion = parsed.data.meta.contentVersion === state.status.contentVersion;
  const sameCacheState = snap.fromCache === (state.status.source === "cache");
  // Metadata-only re-emits (e.g. a server ack after a local write) carry the same version and the
  // same cache/live state we already have — skip reallocating Content so subscribers don't re-render.
  // The very first snapshot after the bundled fallback always applies, even when the version already
  // matches, so status can move off "bundled" to "live"/"cache".
  if (state.status.source !== "bundled" && sameVersion && sameCacheState) return state;
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

/**
 * Attach a live `content/published` listener. `initial` seeds the fold (typically the caller's
 * bundled snapshot); `onChange` fires with the new state whenever it actually changes. On a
 * listener error, `onError` runs so the caller can reset its "started" flag and let a later
 * `subscribe` retry.
 */
export function startContentListener(
  db: Firestore,
  initial: ContentState,
  onChange: (state: ContentState) => void,
  onError?: () => void,
): ListenerHandle {
  let state = initial;
  const unsubscribe: Unsubscribe = onSnapshot(
    doc(db, "content", "published"),
    { includeMetadataChanges: true },
    (snap) => {
      const next = applyContentSnapshot(state, { exists: snap.exists(), data: snap.data(), fromCache: snap.metadata.fromCache });
      if (next !== state) { state = next; onChange(state); }
    },
    (err) => {
      console.warn("content/published listener error", err);
      onError?.();
    },
  );
  return { stop: () => unsubscribe() };
}
