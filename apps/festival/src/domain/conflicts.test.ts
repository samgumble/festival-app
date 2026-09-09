import { describe, expect, it } from "vitest";
import { Content } from "@bb/shared";
import bundled from "@/data/bundled.json";
import { conflictKey, detectConflicts, keptSet, leaveBy, lostSetIds, nextUp } from "./conflicts";
import { parseIso } from "./time";

const content = Content.parse(bundled);
const byId = new Map(content.sets.map((s) => [s.id, s]));
const pick = (...ids: string[]) => ids.map((id) => byId.get(id)!);

const MUSSEL = "sat-charlie-musselwhite-ga20-main-1630"; // 4:30–5:40
const ALBERT = "sat-albert-white-blues-1730";            // 5:30–6:30
const DOVE = "sat-derrick-dove-truck-1740";              // 5:40–6:10
const TAJ = "sat-taj-mahal-keb-mo-main-2000";            // 8:00–9:30

describe("detectConflicts", () => {
  it("finds the real Saturday overlap: Musselwhite vs Albert White, 10 minutes", () => {
    const c = detectConflicts(pick(MUSSEL, ALBERT, TAJ), 0);
    expect(c).toHaveLength(1);
    expect(c[0]).toMatchObject({ key: conflictKey(byId.get(MUSSEL)!, byId.get(ALBERT)!), overlapMinutes: 10, bufferOnly: false });
  });
  it("a buffer turns back-to-back sets on different stages into a buffer-only conflict", () => {
    expect(detectConflicts(pick(MUSSEL, DOVE), 0)).toHaveLength(0); // 5:40 end vs 5:40 start: no overlap
    const c = detectConflicts(pick(MUSSEL, DOVE), 10);
    expect(c).toHaveLength(1);
    expect(c[0]).toMatchObject({ overlapMinutes: 0, bufferOnly: true });
  });
  it("keys are order-independent", () => {
    expect(conflictKey(byId.get(ALBERT)!, byId.get(MUSSEL)!)).toBe(conflictKey(byId.get(MUSSEL)!, byId.get(ALBERT)!));
  });
});

describe("resolution", () => {
  const [c] = detectConflicts(pick(MUSSEL, ALBERT), 0);
  it("defaults to the earlier set, honors an explicit choice, ignores a stale one", () => {
    expect(keptSet(c!, {}).id).toBe(MUSSEL);
    expect(keptSet(c!, { [c!.key]: ALBERT }).id).toBe(ALBERT);
    expect(keptSet(c!, { [c!.key]: "sun-jon-batiste-main-2000" }).id).toBe(MUSSEL);
  });
  it("lostSetIds lists the losers", () => {
    expect([...lostSetIds([c!], {})]).toEqual([ALBERT]);
  });
});

describe("nextUp / leaveBy", () => {
  it("skips lost sets and ended sets", () => {
    const now = parseIso("2026-09-19T15:40:00-06:00");
    const plan = pick("sat-judith-hill-main-1330", MUSSEL, ALBERT, TAJ);
    expect(nextUp(plan, now, {}, 0)?.id).toBe(MUSSEL);
    expect(nextUp(plan, now, { [conflictKey(byId.get(MUSSEL)!, byId.get(ALBERT)!)]: ALBERT }, 0)?.id).toBe(ALBERT);
    expect(nextUp(plan, parseIso("2026-09-19T22:00:00-06:00"), {}, 0)).toBeNull();
  });
  it("leaveBy subtracts the buffer", () => {
    expect(leaveBy(byId.get(MUSSEL)!, 10).toISOString()).toBe("2026-09-19T22:20:00.000Z");
  });
});
