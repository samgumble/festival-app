import { describe, expect, it } from "vitest";
import { Content } from "@bb/shared";
import bundled from "@/data/bundled.json";
import { planToIcs, planToText } from "./ics";

const content = Content.parse(bundled);
const artistsById = new Map(content.artists.map((a) => [a.id, a]));
const stagesById = new Map(content.stages.map((s) => [s.id, s]));
const sets = content.sets.filter((s) => ["sat-charlie-musselwhite-ga20-main-1630", "sat-taj-mahal-keb-mo-main-2000"].includes(s.id));

describe("planToIcs", () => {
  it("emits one VEVENT per set with UTC times and escaped text", () => {
    const ics = planToIcs(sets, artistsById, stagesById, content.festival);
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.match(/BEGIN:VEVENT/g)?.length).toBe(2);
    expect(ics).toContain("DTSTART:20260919T223000Z");
    expect(ics).toContain("DTEND:20260919T234000Z");
    expect(ics).toContain("SUMMARY:Charlie Musselwhite & GA-20");
    expect(ics).toContain("LOCATION:Main Stage\\, Telluride Town Park");
    expect(ics).toContain("UID:sat-charlie-musselwhite-ga20-main-1630@bluesandbrews");
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
  });
});

describe("planToText", () => {
  it("groups by day with Denver times", () => {
    const t = planToText(sets, artistsById, stagesById, content.festival);
    expect(t).toContain("Saturday");
    expect(t).toContain("4:30 – 5:40 PM · Charlie Musselwhite & GA-20 · Main Stage");
    expect(t).toContain("8:00 – 9:30 PM · Taj Mahal & Keb’ Mo’ · Main Stage");
  });
});
