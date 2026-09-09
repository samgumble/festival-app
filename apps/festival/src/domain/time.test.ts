import { describe, expect, it } from "vitest";
import type { Festival } from "@bb/shared";
import { dayIdFor, dayWindow, festivalNow, formatRange, formatTime, fromDenver, isoMs, minutesBetween, norm, parseIso, toDenverParts } from "./time";

const festival = {
  days: [
    { id: "fri", date: "2026-09-18", label: "Friday", gatesOpen: "11:30" },
    { id: "sat", date: "2026-09-19", label: "Saturday", gatesOpen: "11:30" },
    { id: "sun", date: "2026-09-20", label: "Sunday", gatesOpen: "11:30" },
  ],
} as unknown as Festival;

describe("time (America/Denver)", () => {
  it("converts an instant to Denver wall-clock parts regardless of host zone", () => {
    // 2026-09-19T21:40:00Z is 3:40 PM MDT
    const p = toDenverParts(new Date("2026-09-19T21:40:00Z"));
    expect(p).toMatchObject({ year: 2026, month: 9, day: 19, hour: 15, minute: 40, dateKey: "2026-09-19", weekday: "Sat" });
  });

  it("builds an instant from a Denver date + HH:MM (MDT in September)", () => {
    expect(fromDenver("2026-09-18", "11:30").toISOString()).toBe("2026-09-18T17:30:00.000Z");
  });

  it("parses ISO with offset and rejects garbage", () => {
    expect(parseIso("2026-09-19T16:30:00-06:00").toISOString()).toBe("2026-09-19T22:30:00.000Z");
    expect(() => parseIso("Saturday 4:30 PM")).toThrow();
  });

  it("isoMs validates like parseIso", () => {
    expect(isoMs("2026-09-19T16:30:00-06:00")).toBe(Date.UTC(2026, 8, 19, 22, 30));
    expect(() => isoMs("2026-09-19T16:30:00")).toThrow();
  });

  it("formats times and ranges in Denver", () => {
    const a = parseIso("2026-09-19T16:30:00-06:00");
    const b = parseIso("2026-09-19T17:40:00-06:00");
    expect(norm(formatTime(a))).toBe("4:30 PM");
    expect(norm(formatRange(a, b))).toBe("4:30 – 5:40 PM");
    const c = parseIso("2026-09-19T11:30:00-06:00");
    expect(norm(formatRange(c, a))).toBe("11:30 AM – 4:30 PM");
  });

  it("measures minutes", () => {
    expect(minutesBetween(parseIso("2026-09-19T15:40:00-06:00"), parseIso("2026-09-19T16:30:00-06:00"))).toBe(50);
  });

  it("assigns the festival day with a 4 AM rollover", () => {
    expect(dayIdFor(parseIso("2026-09-19T15:40:00-06:00"), festival)).toBe("sat");
    expect(dayIdFor(parseIso("2026-09-20T01:30:00-06:00"), festival)).toBe("sat"); // 1:30 AM still Saturday night
    expect(dayIdFor(parseIso("2026-09-20T04:00:00-06:00"), festival)).toBe("sun");
    expect(dayIdFor(parseIso("2026-09-17T12:00:00-06:00"), festival)).toBeNull();
  });

  it("festivalNow honors an override", () => {
    expect(festivalNow("2026-09-19T15:40:00-06:00").toISOString()).toBe("2026-09-19T21:40:00.000Z");
    expect(Math.abs(festivalNow(null).getTime() - Date.now())).toBeLessThan(1000);
  });

  it("parseIso rejects timestamps without an explicit offset", () => {
    expect(() => parseIso("2026-09-19T16:30:00")).toThrow();
    expect(() => parseIso("2026-09-19T16:30:00.000")).toThrow();
    expect(parseIso("2026-09-19T22:30:00Z").toISOString()).toBe("2026-09-19T22:30:00.000Z");
  });

  it("fromDenver is exact across the spring-forward transition", () => {
    // 2026-03-08 02:00 MST → 03:00 MDT. 03:30 local is MDT (UTC-6) = 09:30Z.
    expect(fromDenver("2026-03-08", "03:30").toISOString()).toBe("2026-03-08T09:30:00.000Z");
    // Fall-back day, unambiguous afternoon time: 2026-11-01 15:00 MST (UTC-7) = 22:00Z.
    expect(fromDenver("2026-11-01", "15:00").toISOString()).toBe("2026-11-01T22:00:00.000Z");
  });

  it("dayWindow spans 4 AM to 4 AM Denver", () => {
    const w = dayWindow("2026-09-19");
    expect(w.start.toISOString()).toBe("2026-09-19T10:00:00.000Z");
    expect(w.end.toISOString()).toBe("2026-09-20T10:00:00.000Z");
  });
});
