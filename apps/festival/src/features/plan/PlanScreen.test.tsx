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
});
