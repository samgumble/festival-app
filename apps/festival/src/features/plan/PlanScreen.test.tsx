import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { renderAt } from "@/test/render";
import { useUiStore } from "@/state/ui";
import { usePlanStore } from "@/state/plan";

const MUSSEL = "sat-charlie-musselwhite-ga20-main-1630";
const ALBERT = "sat-albert-white-blues-1730";
const TAJ = "sat-taj-mahal-keb-mo-main-2000";

describe("Plan", () => {
  beforeEach(() => {
    useUiStore.setState({ devNow: "2026-09-19T15:40:00-06:00" });
    usePlanStore.setState({ favorites: [], resolutions: {}, reminders: [], settings: { leadMinutes: 15, bufferMinutes: 10 } });
  });

  it("empty state invites the user with headliner quick-adds", async () => {
    renderAt("/plan");
    expect(await screen.findByText(/your weekend starts here/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /favorite marcus king band/i }));
    expect(usePlanStore.getState().favorites).toEqual(["fri-marcus-king-band-main-2000"]);
  });

  it("shows the Saturday overlap as a braided pair and swaps", async () => {
    usePlanStore.setState({ favorites: [MUSSEL, ALBERT, TAJ] });
    renderAt("/plan");
    expect(await screen.findByText(/overlaps 10 min/i)).toBeInTheDocument();
    expect(screen.getByText(/1 conflict/i)).toBeInTheDocument();
    expect(screen.getByText(/next up/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /swap/i }));
    expect(usePlanStore.getState().resolutions).toEqual({ [`${ALBERT}|${MUSSEL}`]: ALBERT });
    expect(screen.getByText(/keeping albert white/i)).toBeInTheDocument();
  });

  it("day control carries per-day counts", async () => {
    usePlanStore.setState({ favorites: [MUSSEL, "fri-eggy-main-1500"] });
    renderAt("/plan");
    expect(await screen.findByRole("radio", { name: /fri 1/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /sat 1/i })).toBeChecked();
  });

  it("renders every favorite in a three-way overlap, with a Swap for each loser", async () => {
    // Saturday 2:00–3:00 Camp, 2:30–3:30 Blues, 2:30–3:30 Truck — all three overlap each other
    usePlanStore.setState({ favorites: ["sat-david-jacobs-strain-camp-1400", "sat-kirk-fletcher-blues-1430", "sat-katie-skene-truck-1430"] });
    renderAt("/plan");
    expect(await screen.findByText("David Jacobs-Strain and Bob Beach")).toBeInTheDocument();
    expect(screen.getByText("Kirk Fletcher")).toBeInTheDocument();
    expect(screen.getByText("Katie Skene")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /swap/i }).length).toBe(2);
  });

  it("renders a chain where the middle set loses (orphan loser still gets a Swap)", async () => {
    // Nigel Wearne Camp 12:30–1:30 × Derrick Dove Blues 1:00–2:00 × Judith Hill Main 1:30–2:30 (Nigel and Judith don't overlap)
    usePlanStore.setState({ favorites: ["sat-nigel-wearne-camp-1230", "sat-derrick-dove-blues-1300", "sat-judith-hill-main-1330"] });
    renderAt("/plan");
    expect(await screen.findByText("Nigel Wearne & The Spectres")).toBeInTheDocument();
    expect(screen.getByText("Derrick Dove & The Peacekeepers")).toBeInTheDocument();
    expect(screen.getByText("Judith Hill")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /swap/i }).length).toBe(2);
  });
});
