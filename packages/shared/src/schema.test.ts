import { describe, expect, it } from "vitest";
import { Content, FestivalSet, Alert } from "./schema.ts";

const festival = {
  year: 2026,
  name: "Telluride Blues & Brews Festival",
  edition: "32nd Annual",
  venue: "Telluride Town Park",
  city: "Telluride, Colorado",
  altitudeFt: 8750,
  timezone: "America/Denver",
  days: [
    { id: "fri", date: "2026-09-18", label: "Friday", gatesOpen: "11:30" },
    { id: "sat", date: "2026-09-19", label: "Saturday", gatesOpen: "11:30" },
    { id: "sun", date: "2026-09-20", label: "Sunday", gatesOpen: "11:30" },
  ],
  links: {
    site: "https://www.tellurideblues.com",
    lineup: "https://www.tellurideblues.com/lineup",
    schedule: "https://www.tellurideblues.com/schedule",
    faq: "https://www.tellurideblues.com/faqs",
    guide: "https://www.tellurideblues.com/news/the-official-telluride-blues-brews-festival-guide",
  },
};

const base = {
  meta: {
    contentVersion: "2026.09.09.1",
    publishedAt: "2026-09-09T12:00:00-06:00",
    publishedBy: "seed",
    sources: ["https://www.tellurideblues.com/schedule"],
  },
  festival,
  stages: [{ id: "main", name: "Main Stage", shortName: "Main", color: "sky", sortOrder: 1 }],
  artists: [{ id: "eggy", name: "Eggy", tier: "lineup" }],
  sets: [
    {
      id: "fri-eggy",
      artistId: "eggy",
      stageId: "main",
      dayId: "fri",
      start: "2026-09-18T15:00:00-06:00",
      end: "2026-09-18T16:00:00-06:00",
    },
  ],
};

describe("Content schema", () => {
  it("accepts a valid document", () => {
    expect(Content.safeParse(base).success).toBe(true);
  });

  it("rejects a set whose end is not after its start", () => {
    const bad = { ...base, sets: [{ ...base.sets[0], end: "2026-09-18T15:00:00-06:00" }] };
    const r = Content.safeParse(bad);
    expect(r.success).toBe(false);
  });

  it("rejects a set that references an unknown stage", () => {
    const bad = { ...base, sets: [{ ...base.sets[0], stageId: "moon" }] };
    const r = Content.safeParse(bad);
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toContain("unknown stageId");
  });

  it("rejects a set that references an unknown artist", () => {
    const bad = { ...base, sets: [{ ...base.sets[0], artistId: "nobody" }] };
    expect(Content.safeParse(bad).success).toBe(false);
  });

  it("rejects a set on a day the festival does not have", () => {
    const bad = { ...base, sets: [{ ...base.sets[0], dayId: "mon" }] };
    expect(Content.safeParse(bad).success).toBe(false);
  });

  it("rejects duplicate ids", () => {
    const bad = { ...base, artists: [base.artists[0], base.artists[0]] };
    expect(Content.safeParse(bad).success).toBe(false);
  });

  it("requires ISO timestamps with an explicit offset", () => {
    expect(FestivalSet.safeParse({ ...base.sets[0], start: "2026-09-18T15:00:00Z" }).success).toBe(false);
    expect(FestivalSet.safeParse({ ...base.sets[0], start: "2026-09-18 3:00 PM" }).success).toBe(false);
  });
});

describe("Alert schema", () => {
  it("caps title at 60 and body at 240 characters", () => {
    const ok = {
      id: "a1", title: "Gates open", body: "Welcome.", severity: "info",
      publishedAt: "2026-09-18T11:30:00-06:00", publishedBy: "sbg", push: false,
    };
    expect(Alert.safeParse(ok).success).toBe(true);
    expect(Alert.safeParse({ ...ok, title: "x".repeat(61) }).success).toBe(false);
    expect(Alert.safeParse({ ...ok, body: "x".repeat(241) }).success).toBe(false);
  });
});
