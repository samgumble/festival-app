import { describe, expect, it } from "vitest";
import { diffReminders, hashId, planReminders } from "./reminders";
import type { Artist, FestivalSet, Stage } from "@bb/shared";

const artists = new Map<string, Artist>([
  ["a1", { id: "a1", name: "Samantha Fish", tier: "headliner" } as Artist],
  ["a2", { id: "a2", name: "A Very Long Band Name That Goes On And On Forever", tier: "featured" } as Artist],
]);
const stages = new Map<string, Stage>([["main", { id: "main", name: "Main Stage", color: "sky" } as Stage]]);
const set = (id: string, artistId: string, start: string, end: string): FestivalSet =>
  ({ id, artistId, stageId: "main", dayId: "sat", start, end }) as FestivalSet;
const sets = [
  set("s1", "a1", "2026-09-19T16:30:00-06:00", "2026-09-19T17:45:00-06:00"),
  set("s2", "a2", "2026-09-19T12:00:00-06:00", "2026-09-19T13:00:00-06:00"),
  set("s3", "a1", "2026-09-20T20:00:00-06:00", "2026-09-20T21:30:00-06:00"),
];
const now = Date.parse("2026-09-19T15:00:00-06:00");

describe("hashId", () => {
  it("is stable, positive, and 31-bit", () => {
    expect(hashId("s1")).toBe(hashId("s1"));
    expect(hashId("s1")).not.toBe(hashId("s2"));
    expect(hashId("s1")).toBeGreaterThan(0);
    expect(hashId("s1")).toBeLessThanOrEqual(0x7fffffff);
  });
});

describe("planReminders", () => {
  it("schedules upcoming favorites at start minus lead, sorted, skipping past sets", () => {
    const items = planReminders({ favorites: ["s3", "s1", "s2"], sets, artistsById: artists, stagesById: stages, leadMinutes: 15, now });
    expect(items.map((i) => i.setId)).toEqual(["s1", "s3"]);
    expect(items[0]).toEqual({ id: hashId("s1"), setId: "s1", title: "Samantha Fish · Main Stage", body: "Starts in 15 min", at: Date.parse("2026-09-19T16:15:00-06:00") });
  });
  it("skips a set already inside the lead window", () => {
    const soon = Date.parse("2026-09-19T16:20:00-06:00");
    expect(planReminders({ favorites: ["s1"], sets, artistsById: artists, stagesById: stages, leadMinutes: 15, now: soon })).toEqual([]);
  });
  it("truncates long titles to 40 chars with an ellipsis", () => {
    const [item] = planReminders({ favorites: ["s2"], sets, artistsById: artists, stagesById: stages, leadMinutes: 5, now: Date.parse("2026-09-19T10:00:00-06:00") });
    expect(item!.title.length).toBeLessThanOrEqual(40);
    expect(item!.title.endsWith("…")).toBe(true);
  });
  it("ignores favorites with no set", () => {
    expect(planReminders({ favorites: ["ghost"], sets, artistsById: artists, stagesById: stages, leadMinutes: 15, now })).toEqual([]);
  });
});

describe("diffReminders", () => {
  const a = { id: 1, setId: "a", title: "A", body: "b", at: 1000 };
  const b = { id: 2, setId: "b", title: "B", body: "b", at: 2000 };
  it("schedules new, cancels removed, leaves unchanged alone", () => {
    expect(diffReminders([a, b], [{ id: 1, at: 1000 }, { id: 3, at: 3000 }])).toEqual({ cancel: [3], schedule: [b] });
  });
  it("reschedules when the time moved", () => {
    expect(diffReminders([{ ...a, at: 1500 }], [{ id: 1, at: 1000 }])).toEqual({ cancel: [1], schedule: [{ ...a, at: 1500 }] });
  });
  it("treats a pending entry with unknown time as unchanged", () => {
    expect(diffReminders([a], [{ id: 1 }])).toEqual({ cancel: [], schedule: [] });
  });
});
