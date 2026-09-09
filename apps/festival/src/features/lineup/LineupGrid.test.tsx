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
    expect(new Date(g.startMs).toISOString()).toBe("2026-09-19T18:00:00.000Z"); // 12:00 PM MDT
    const mussel = sat.find((s) => s.id === "sat-charlie-musselwhite-ga20-main-1630")!;
    expect(g.left(mussel)).toBe(4.5 * 72);
    expect(g.width(mussel)).toBeCloseTo((70 / 60) * 72 - 4, 5);
    expect(g.hours.length).toBe(10); // 12 PM … 9 PM
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
    expect(screen.getAllByTestId(/^lane-/).length).toBe(4);
    const block = screen.getByRole("button", { name: /Charlie Musselwhite & GA-20/ });
    expect(block).toHaveAttribute("data-favorite", "true");
    fireEvent.click(block);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });
});
