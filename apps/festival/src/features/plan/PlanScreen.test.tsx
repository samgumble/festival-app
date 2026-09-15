import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderAt } from "@/test/render";
import { useUiStore } from "@/state/ui";
import { usePlanStore } from "@/state/plan";

const MUSSEL = "sat-charlie-musselwhite-ga20-main-1630";
const ALBERT = "sat-albert-white-blues-1730";
const TAJ = "sat-taj-mahal-keb-mo-main-2000";

describe("Plan", () => {
  beforeEach(() => {
    useUiStore.setState({ devNow: "2026-09-19T15:40:00-06:00" });
    usePlanStore.setState({ favorites: [], resolutions: {}, settings: { leadMinutes: 15, bufferMinutes: 10 }, remindersOn: false });
  });

  it("empty state invites the user with headliner quick-adds", async () => {
    renderAt("/plan");
    expect(await screen.findByRole("heading", { name: /my schedule/i })).toBeInTheDocument();
    fireEvent.click(await screen.findByRole("button", { name: /favorite marcus king band/i }));
    expect(usePlanStore.getState().favorites).toEqual(["fri-marcus-king-band-main-2000"]);
  });

  it("marks the Saturday overlap as a conflict on both blocks, side by side", async () => {
    usePlanStore.setState({ favorites: [MUSSEL, ALBERT, TAJ] });
    renderAt("/plan");
    expect(await screen.findByText(/1 conflict/i)).toBeInTheDocument();
    expect(screen.getByText(/next up/i)).toBeInTheDocument();
    const blocks = screen.getAllByTestId("plan-block");
    expect(blocks.length).toBe(3);
    expect(blocks.filter((b) => b.dataset.conflict === "true").length).toBe(2);
    expect(screen.getAllByText(/overlaps 10 min/i).length).toBe(2);
    expect(screen.queryByRole("button", { name: /swap/i })).not.toBeInTheDocument();
    // only the two stages with favorites, in lineup-grid order
    expect(screen.getAllByTestId(/^plan-col-/).map((c) => c.dataset.testid)).toEqual(["plan-col-main", "plan-col-blues"]);
  });

  it("day control carries per-day counts", async () => {
    usePlanStore.setState({ favorites: [MUSSEL, "fri-eggy-main-1500"] });
    renderAt("/plan");
    expect(await screen.findByRole("radio", { name: /fri 1/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /sat 1/i })).toBeChecked();
  });

  it("renders every favorite in a three-way overlap as conflicts, columns in stage order", async () => {
    // Saturday 2:00–3:00 Camp, 2:30–3:30 Blues, 2:30–3:30 Truck — all three overlap each other
    usePlanStore.setState({ favorites: ["sat-david-jacobs-strain-camp-1400", "sat-kirk-fletcher-blues-1430", "sat-katie-skene-truck-1430"] });
    renderAt("/plan");
    await screen.findAllByText(/David Jacobs-Strain and Bob Beach/); // block + Next up card
    expect(screen.getAllByText(/Kirk Fletcher/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Katie Skene/).length).toBeGreaterThan(0);
    expect(screen.getAllByTestId("plan-block").filter((b) => b.dataset.conflict === "true").length).toBe(3);
    expect(screen.getAllByTestId(/^plan-col-/).map((c) => c.dataset.testid)).toEqual(["plan-col-blues", "plan-col-truck", "plan-col-camp"]);
  });
});
