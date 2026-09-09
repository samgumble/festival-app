import type { Artist, DayId, Festival, FestivalDay, FestivalSet, Stage } from "@bb/shared";
import { dayWindow, fromDenver, isoMs, minutesBetween, parseIso } from "./time";

export type FestivalState = "pre" | "live" | "post";

export function gatesOpenAt(day: FestivalDay): Date {
  return fromDenver(day.date, day.gatesOpen);
}

export function festivalState(festival: Pick<Festival, "days">, now: Date): FestivalState {
  const first = festival.days[0];
  const last = festival.days[festival.days.length - 1];
  if (!first || !last) return "post";
  if (now < gatesOpenAt(first)) return "pre";
  return now < dayWindow(last.date).end ? "live" : "post";
}

export const setStart = (s: FestivalSet): Date => parseIso(s.start);
export const setEnd = (s: FestivalSet): Date => parseIso(s.end);

const byStart = (a: FestivalSet, b: FestivalSet) => isoMs(a.start) - isoMs(b.start);

export function setsForDay(sets: FestivalSet[], dayId: DayId): FestivalSet[] {
  return sets.filter((s) => s.dayId === dayId).sort(byStart);
}

export interface StageGroup { stage: Stage; sets: FestivalSet[] }

export function groupByStage(sets: FestivalSet[], stages: Stage[]): StageGroup[] {
  return [...stages]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((stage) => ({ stage, sets: sets.filter((s) => s.stageId === stage.id).sort(byStart) }))
    .filter((g) => g.sets.length > 0);
}

export function nowPlaying(sets: FestivalSet[], now: Date): FestivalSet[] {
  const t = now.getTime();
  return sets.filter((s) => isoMs(s.start) <= t && t < isoMs(s.end)).sort(byStart);
}

/** Next sets to start, at most one per stage, soonest first. */
export function upNext(sets: FestivalSet[], now: Date, limit = 2): FestivalSet[] {
  const t = now.getTime();
  const taken = new Set<string>();
  const out: FestivalSet[] = [];
  for (const s of [...sets].sort(byStart)) {
    if (isoMs(s.start) <= t || taken.has(s.stageId)) continue;
    taken.add(s.stageId);
    out.push(s);
    if (out.length >= limit) break;
  }
  return out;
}

export function progress(set: FestivalSet, now: Date): number {
  const a = isoMs(set.start), b = isoMs(set.end);
  if (b <= a) return 1;
  return Math.max(0, Math.min(1, (now.getTime() - a) / (b - a)));
}

export const isEnded = (set: FestivalSet, now: Date): boolean => now.getTime() >= isoMs(set.end);
export const minutesLeft = (set: FestivalSet, now: Date): number => minutesBetween(now, setEnd(set));

export function headliners(artists: Artist[]): Artist[] {
  return artists.filter((a) => a.tier === "headliner");
}

const fold = (s: string) =>
  s.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[\u2019'\u201c\u201d".,&-]/g, " ").replace(/\s+/g, " ").trim().toLowerCase();

export function searchArtists(artists: Artist[], query: string): Artist[] {
  const q = fold(query);
  if (!q) return artists;
  return artists.filter((a) => fold(a.name).includes(q));
}
