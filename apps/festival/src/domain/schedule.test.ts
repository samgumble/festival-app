import { describe, expect, it } from "vitest";
import { Content } from "@bb/shared";
import bundled from "@/data/bundled.json";
import { parseIso } from "./time";
import { festivalState, groupByStage, headliners, isEnded, nowPlaying, progress, searchArtists, setsForDay, upNext } from "./schedule";

const content = Content.parse(bundled);
const SAT_340 = parseIso("2026-09-19T15:40:00-06:00");

describe("festivalState", () => {
  const at = (s: string) => festivalState(content.festival, parseIso(s));
  it("is pre before Friday gates, live from gates, post after 4 AM Monday", () => {
    expect(at("2026-09-17T20:00:00-06:00")).toBe("pre");
    expect(at("2026-09-18T11:29:00-06:00")).toBe("pre");
    expect(at("2026-09-18T11:30:00-06:00")).toBe("live");
    expect(at("2026-09-20T21:31:00-06:00")).toBe("live"); // Sunday night is still the festival
    expect(at("2026-09-21T03:59:00-06:00")).toBe("live");
    expect(at("2026-09-21T04:00:00-06:00")).toBe("post");
  });
});

describe("day + stage grouping", () => {
  it("returns Saturday's sets in chronological order, grouped by stage sortOrder", () => {
    const sat = setsForDay(content.sets, "sat");
    expect(sat.length).toBe(14);
    expect(sat[0]?.id).toBe("sat-j-causeways-main-1200");
    const groups = groupByStage(sat, content.stages);
    expect(groups.map((g) => g.stage.id)).toEqual(["main", "blues", "truck", "camp"]);
    expect(groups[0]?.sets.map((s) => s.artistId)).toEqual([
      "j-causeways", "judith-hill", "nether-hour", "charlie-musselwhite-ga20", "record-company", "taj-mahal-keb-mo",
    ]);
  });
});

describe("now / next at Saturday 3:40 PM", () => {
  const sat = setsForDay(content.sets, "sat");
  it("Nether Hour is on the Main Stage with 20 minutes left", () => {
    const on = nowPlaying(sat, SAT_340);
    expect(on.map((s) => s.artistId)).toEqual(["nether-hour"]);
    expect(progress(on[0]!, SAT_340)).toBeCloseTo(40 / 60, 2);
  });
  it("up next is Nigel Wearne (Truck 4:00) then Musselwhite (Main 4:30), one per stage", () => {
    expect(upNext(sat, SAT_340, 2).map((s) => s.id)).toEqual(["sat-nigel-wearne-truck-1600", "sat-charlie-musselwhite-ga20-main-1630"]);
  });
  it("Kirk Fletcher's 2:30 set has ended", () => {
    const kirk = sat.find((s) => s.id === "sat-kirk-fletcher-blues-1430")!;
    expect(isEnded(kirk, SAT_340)).toBe(true);
  });
});

describe("artists", () => {
  it("lists the three headliners in poster order", () => {
    expect(headliners(content.artists).map((a) => a.id)).toEqual(["marcus-king-band", "taj-mahal-keb-mo", "jon-batiste"]);
  });
  it("search ignores case, punctuation and curly quotes", () => {
    expect(searchArtists(content.artists, "keb mo").map((a) => a.id)).toEqual(["taj-mahal-keb-mo"]);
    expect(searchArtists(content.artists, "HARMONICA").map((a) => a.id)).toEqual(["terry-bean"]);
    expect(searchArtists(content.artists, "").length).toBe(content.artists.length);
  });
});
