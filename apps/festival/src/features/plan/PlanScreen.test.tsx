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

  it("empty state invites the user with headliner quick-adds and a build-your-schedule banner", async () => {
    renderAt("/plan");
    expect(await screen.findByRole("heading", { name: /my schedule/i })).toBeInTheDocument();
    const banner = screen.getByTestId("build-schedule-banner");
    expect(banner).toHaveAttribute("href", "/lineup");
    expect(banner).toHaveTextContent(/favorite your artists in the lineup/i);
    fireEvent.click(await screen.findByRole("button", { name: /favorite marcus king band/i }));
    expect(usePlanStore.getState().favorites).toEqual(["fri-marcus-king-band-main-2000"]);
    expect(screen.queryByTestId("build-schedule-banner")).toBeNull();
    // day switch shows plain day names, no favorite counts
    expect(screen.getByRole("radio", { name: "Fri" })).toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: /Fri \d/ })).toBeNull();
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
    expect(screen.getAllByTestId(/^plan-col-(?!title)/).map((c) => c.dataset.testid)).toEqual(["plan-col-main", "plan-col-blues"]);
    expect(screen.getByTestId("plan-col-title-main").textContent).toBe("Main\nStage"); // two rows
  });


  it("renders every favorite in a three-way overlap as conflicts, columns in stage order", async () => {
    // Saturday 2:00–3:00 Camp, 2:30–3:30 Blues, 2:30–3:30 Truck — all three overlap each other
    usePlanStore.setState({ favorites: ["sat-david-jacobs-strain-camp-1400", "sat-kirk-fletcher-blues-1430", "sat-katie-skene-truck-1430"] });
    renderAt("/plan");
    await screen.findAllByText(/David Jacobs-Strain and Bob Beach/); // block + Next up card
    expect(screen.getAllByText(/Kirk Fletcher/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Katie Skene/).length).toBeGreaterThan(0);
    expect(screen.getAllByTestId("plan-block").filter((b) => b.dataset.conflict === "true").length).toBe(3);
    expect(screen.getAllByTestId(/^plan-col-(?!title)/).map((c) => c.dataset.testid)).toEqual(["plan-col-blues", "plan-col-truck", "plan-col-camp"]);
    expect(screen.getByTestId("plan-col-title-truck").textContent).toBe("Truck\nStage"); // sponsor tail dropped
  });

  it("names Juke Joint columns by venue", async () => {
    usePlanStore.setState({ favorites: ["sat-tab-benoit-juke-2200", "sat-judith-hill-juke-2200"] });
    renderAt("/plan");
    await screen.findAllByText(/Tab Benoit/);
    expect(screen.getAllByTestId(/^plan-col-(?!title)/).map((c) => c.dataset.testid)).toEqual(["plan-col-juke:Sheridan Opera House", "plan-col-juke:Elks Lodge"]);
    expect(screen.getByTestId("plan-col-title-juke:Elks Lodge").textContent).toBe("Elks\nLodge");
    expect(screen.getByText("Sheridan Opera House")).toBeInTheDocument();
  });
});
