import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { Content } from "@bb/shared";
import bundled from "@/data/bundled.json";
import { renderAt } from "@/test/render";
import { useUiStore } from "@/state/ui";
import { usePlanStore } from "@/state/plan";
import { gridLayout } from "./LineupGrid";

const content = Content.parse(bundled);

describe("gridLayout", () => {
  it("starts on the hour before the first set and positions blocks by minutes", () => {
    const sat = content.sets.filter((s) => s.dayId === "sat");
    const g = gridLayout(sat, 72);
    expect(new Date(g.startMs).toISOString()).toBe("2026-09-19T13:00:00.000Z"); // 7:00 AM MDT (5K registration at 7:15)
    const mussel = sat.find((s) => s.id === "sat-charlie-musselwhite-ga20-main-1630")!;
    expect(g.left(mussel)).toBe(9.5 * 72);
    expect(g.width(mussel)).toBeCloseTo((70 / 60) * 72 - 4, 5);
    expect(g.hours.length).toBe(17); // 7 AM … 11 PM (5K at 7:15 AM, juke joints to 11:55 PM)
  });
});

describe("gridLayout edge cases", () => {
  it("returns an empty layout for no sets", () => {
    const g = gridLayout([], 72);
    expect(g.hours).toEqual([]);
    expect(g.startMs).toBe(0);
  });
});

describe("LineupGrid", () => {
  beforeEach(() => {
    useUiStore.setState({ devNow: "2026-09-19T15:40:00-06:00", lineupView: "grid" });
    usePlanStore.setState({ favorites: ["sat-charlie-musselwhite-ga20-main-1630"] });
  });
  it("renders a lane per stage, a now line, and favorited blocks", async () => {
    renderAt("/lineup");
    expect(await screen.findByTestId("now-line")).toBeInTheDocument();
    expect(screen.getAllByTestId(/^lane-(?!label)/).length).toBe(12); // 5 stage rows (Saturday comedy sits in the Blues row) + 4 juke venues + 3 special-event venues
    expect(screen.queryByTestId("lane-juke:Blues Stage")).not.toBeInTheDocument(); // the late Blues Stage show lives in the Blues row
    expect(screen.getByTestId("lane-juke:Liz")).toBeInTheDocument();
    expect(screen.getByTestId("lane-special:Elks Park")).toBeInTheDocument();
    expect(screen.getByTestId("lane-label-camp").textContent).toBe("Camp\nground\nSessions"); // grid label, three rows
    const block = screen.getByRole("button", { name: /Charlie Musselwhite & GA-20/ });
    expect(block).toHaveAttribute("data-favorite", "true");
    fireEvent.click(block);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("short sets get an invisible hit-area extension", async () => {
    useUiStore.setState({ devNow: "2026-09-19T15:40:00-06:00", lineupView: "grid" });
    renderAt("/lineup");
    const short = await screen.findByRole("button", { name: /Derrick Dove & The Peacekeepers, 5:40 PM/ });
    expect(short.className).toMatch(/before:-inset-x-1\.5\b/);
    expect(short.className).not.toMatch(/\boverflow-hidden\b/);
    const long = screen.getByRole("button", { name: /Charlie Musselwhite & GA-20/ });
    expect(long.className).not.toMatch(/before:-inset-x/);
  });
});
