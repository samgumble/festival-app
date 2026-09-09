import type { DayId, Festival } from "@bb/shared";

export const TZ = "America/Denver";
const HOUR = 3_600_000;

const PARTS = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", weekday: "short",
});
const TIME = new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit" });

export interface DenverParts {
  year: number; month: number; day: number; hour: number; minute: number; weekday: string;
  /** YYYY-MM-DD in Denver */
  dateKey: string;
}

/** Collapse NBSP/NNBSP that Intl inserts before AM/PM so copy and tests compare plainly. */
export function norm(s: string): string {
  return s.replace(/[  ]/g, " ");
}

export function toDenverParts(d: Date): DenverParts {
  const p: Record<string, string> = {};
  for (const part of PARTS.formatToParts(d)) p[part.type] = part.value;
  const hour = Number(p.hour) % 24; // some ICU builds emit "24" at midnight with h23
  return {
    year: Number(p.year), month: Number(p.month), day: Number(p.day), hour, minute: Number(p.minute),
    weekday: p.weekday ?? "", dateKey: `${p.year}-${p.month}-${p.day}`,
  };
}

/** Instant for a Denver wall-clock time. Two-pass offset resolution keeps it exact across DST transitions. */
export function fromDenver(dateKey: string, hhmm: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number) as [number, number, number];
  const [hh, mm] = hhmm.split(":").map(Number) as [number, number];
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  const offsetAt = (ms: number) => {
    const p = toDenverParts(new Date(ms));
    return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute) - ms;
  };
  const first = guess - offsetAt(guess);
  return new Date(guess - offsetAt(first));
}

const ISO_WITH_OFFSET = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/;

export function parseIso(s: string): Date {
  const t = Date.parse(s);
  if (Number.isNaN(t) || !ISO_WITH_OFFSET.test(s)) throw new Error(`Not an ISO timestamp with offset: ${s}`);
  return new Date(t);
}

export function formatTime(d: Date): string {
  return norm(TIME.format(d));
}

export function formatRange(a: Date, b: Date): string {
  const A = formatTime(a), B = formatTime(b);
  const sameMeridiem = A.slice(-2) === B.slice(-2);
  return sameMeridiem ? `${A.slice(0, -3)} – ${B}` : `${A} – ${B}`;
}

export function minutesBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 60_000);
}

/** Festival day for an instant; nights belong to the day before until 4 AM Denver. */
export function dayIdFor(now: Date, festival: Pick<Festival, "days">): DayId | null {
  const key = toDenverParts(new Date(now.getTime() - 4 * HOUR)).dateKey;
  return festival.days.find((d) => d.date === key)?.id ?? null;
}

/** 4 AM Denver on the given date through 4 AM the next day. */
export function dayWindow(dateKey: string): { start: Date; end: Date } {
  const start = fromDenver(dateKey, "04:00");
  return { start, end: new Date(start.getTime() + 24 * HOUR) };
}

export function festivalNow(override?: string | null): Date {
  return override ? parseIso(override) : new Date();
}
