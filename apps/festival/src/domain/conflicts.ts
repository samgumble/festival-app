import type { FestivalSet } from "@bb/shared";
import { isoMs } from "./time";

export interface Conflict {
  key: string;
  a: FestivalSet; // earlier start
  b: FestivalSet;
  overlapMinutes: number; // true overlap, ≥ 0
  bufferOnly: boolean;    // no overlap, but the gap is shorter than the buffer
}

export type Resolutions = Record<string, string>;

export function conflictKey(a: FestivalSet, b: FestivalSet): string {
  return [a.id, b.id].sort().join("|");
}

export function detectConflicts(sets: FestivalSet[], bufferMinutes: number): Conflict[] {
  const sorted = [...sets].sort((x, y) => isoMs(x.start) - isoMs(y.start));
  const buffer = bufferMinutes * 60_000;
  const out: Conflict[] = [];
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const a = sorted[i]!, b = sorted[j]!;
      if (a.stageId === b.stageId && a.id === b.id) continue;
      const aEnd = isoMs(a.end), bStart = isoMs(b.start);
      const gap = bStart - aEnd; // negative = overlap
      if (gap >= buffer) continue;
      const overlap = Math.max(0, Math.round(-gap / 60_000));
      out.push({ key: conflictKey(a, b), a, b, overlapMinutes: overlap, bufferOnly: overlap === 0 });
    }
  }
  return out;
}

export function keptSet(c: Conflict, resolutions: Resolutions): FestivalSet {
  const chosen = resolutions[c.key];
  if (chosen === c.b.id) return c.b;
  return c.a;
}

export function lostSetIds(conflicts: Conflict[], resolutions: Resolutions): Set<string> {
  const lost = new Set<string>();
  for (const c of conflicts) {
    const keep = keptSet(c, resolutions);
    lost.add(keep.id === c.a.id ? c.b.id : c.a.id);
  }
  return lost;
}

/** The next kept set that hasn't ended. */
export function nextUp(sets: FestivalSet[], now: Date, resolutions: Resolutions, bufferMinutes: number): FestivalSet | null {
  const lost = lostSetIds(detectConflicts(sets, bufferMinutes), resolutions);
  const t = now.getTime();
  return (
    [...sets]
      .filter((s) => !lost.has(s.id) && isoMs(s.end) > t)
      .sort((x, y) => isoMs(x.start) - isoMs(y.start))[0] ?? null
  );
}

export function leaveBy(set: FestivalSet, bufferMinutes: number): Date {
  return new Date(isoMs(set.start) - bufferMinutes * 60_000);
}
