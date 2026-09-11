import type { Artist, FestivalSet, Stage } from "@bb/shared";
import { isoMs } from "./time";
import type { ReminderItem } from "@/platform/notifications";

export type { ReminderItem };

const TITLE_MAX = 40;

/** FNV-1a 32-bit hash masked to 31 bits: a stable, positive notification id per set. */
export function hashId(setId: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < setId.length; i++) {
    h ^= setId.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) & 0x7fffffff || 1;
}

export interface PlanInput {
  favorites: string[];
  sets: FestivalSet[];
  artistsById: Map<string, Artist>;
  stagesById: Map<string, Stage>;
  leadMinutes: number;
  now: number;
}

/** The notifications that should exist right now: one per favorited set whose reminder time is still ahead. */
export function planReminders({ favorites, sets, artistsById, stagesById, leadMinutes, now }: PlanInput): ReminderItem[] {
  const wanted = new Set(favorites);
  const items: ReminderItem[] = [];
  for (const s of sets) {
    if (!wanted.has(s.id)) continue;
    const at = isoMs(s.start) - leadMinutes * 60_000;
    if (at <= now) continue;
    const artist = artistsById.get(s.artistId)?.name ?? "Your set";
    const stage = stagesById.get(s.stageId)?.name ?? "";
    const full = stage ? `${artist} · ${stage}` : artist;
    const title = full.length > TITLE_MAX ? `${full.slice(0, TITLE_MAX - 1)}…` : full;
    items.push({ id: hashId(s.id), setId: s.id, title, body: `Starts in ${leadMinutes} min`, at });
  }
  return items.sort((a, b) => a.at - b.at);
}

/** Minimal change set: cancel what is gone or moved, schedule what is new or moved. */
export function diffReminders(desired: ReminderItem[], pending: Array<{ id: number; at?: number }>): { cancel: number[]; schedule: ReminderItem[] } {
  const want = new Map(desired.map((d) => [d.id, d]));
  const have = new Map(pending.map((p) => [p.id, p]));
  const cancel: number[] = [];
  const schedule: ReminderItem[] = [];
  for (const p of pending) {
    const d = want.get(p.id);
    if (!d || (p.at !== undefined && p.at !== d.at)) cancel.push(p.id);
  }
  for (const d of desired) {
    const p = have.get(d.id);
    if (!p || (p.at !== undefined && p.at !== d.at)) schedule.push(d);
  }
  return { cancel, schedule };
}
