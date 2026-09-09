import { useMemo, useSyncExternalStore } from "react";
import { Content, type Artist, type DayId, type FestivalSet, type Stage } from "@bb/shared";
import { isoMs } from "@/domain/time";
import bundled from "./bundled.json";

export interface ContentRepository {
  getContent(): Content;
  subscribe(cb: () => void): () => void;
}

/** Bundled snapshot: validated once at import, never changes at runtime. */
export function createBundledRepository(raw: unknown): ContentRepository {
  const content = Content.parse(raw);
  return { getContent: () => content, subscribe: () => () => {} };
}

export const contentRepository: ContentRepository = createBundledRepository(bundled);

export function useContent(): Content {
  return useSyncExternalStore(contentRepository.subscribe, contentRepository.getContent, contentRepository.getContent);
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
