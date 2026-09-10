import { useMemo, useSyncExternalStore } from "react";
import { Content, type Artist, type DayId, type FestivalSet, type Stage } from "@bb/shared";
import { isoMs } from "@/domain/time";
import bundled from "./bundled.json";
import { useFirestore } from "./source";
import type { ContentState, ContentStatus } from "./firestore-content";

export interface ContentRepository {
  getContent(): Content;
  subscribe(cb: () => void): () => void;
}

/** Bundled snapshot: validated once at import, never changes at runtime. */
export function createBundledRepository(raw: unknown): ContentRepository {
  const content = Content.parse(raw);
  return { getContent: () => content, subscribe: () => () => {} };
}

/**
 * A `ContentRepository` that serves `fallback` synchronously and only pulls in the Firestore SDK
 * (via dynamic import) the first time something actually subscribes — keeping `firebase/firestore`
 * out of the initial JS chunk for everyone who never touches live data (tests, first paint).
 */
function createLazyLiveContentSource(fallback: Content): ContentRepository & { getStatus(): ContentStatus } {
  let state: ContentState = { current: fallback, status: { source: "bundled", contentVersion: fallback.meta.contentVersion, updatedAt: null } };
  const listeners = new Set<() => void>();
  let started = false;
  const subscribe = (cb: () => void) => {
    listeners.add(cb);
    if (!started) {
      started = true;
      void import("./firebase").then(({ getDb }) =>
        import("./firestore-content").then(({ startContentListener }) =>
          startContentListener(
            getDb(),
            state,
            (next) => { state = next; listeners.forEach((l) => l()); },
            () => { started = false; },
          ),
        ),
      );
    }
    return () => listeners.delete(cb);
  };
  return { getContent: () => state.current, getStatus: () => state.status, subscribe };
}

const bundledRepo = createBundledRepository(bundled);
const liveRepo = useFirestore ? createLazyLiveContentSource(bundledRepo.getContent()) : null;

export const contentRepository: ContentRepository = liveRepo ?? bundledRepo;

export function useContent(): Content {
  return useSyncExternalStore(contentRepository.subscribe, contentRepository.getContent, contentRepository.getContent);
}

// Stable reference so useSyncExternalStore doesn't see a "new" snapshot on every call when there's no live repo.
const bundledStatus: ContentStatus = { source: "bundled", contentVersion: bundledRepo.getContent().meta.contentVersion, updatedAt: null };
const getContentStatus = () => liveRepo?.getStatus() ?? bundledStatus;

export function useContentStatus(): ContentStatus {
  return useSyncExternalStore(contentRepository.subscribe, getContentStatus, getContentStatus);
}

export interface ContentIndex {
  artistsById: Map<string, Artist>;
  stagesById: Map<string, Stage>;
  setsById: Map<string, FestivalSet>;
  setsByDay: Record<DayId, FestivalSet[]>;
  setsByArtist: Map<string, FestivalSet[]>;
}

export function buildIndex(c: Content): ContentIndex {
  const byStart = (a: FestivalSet, b: FestivalSet) => isoMs(a.start) - isoMs(b.start);
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
