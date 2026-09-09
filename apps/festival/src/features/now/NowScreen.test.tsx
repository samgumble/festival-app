import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { renderAt } from "@/test/render";
import { useUiStore } from "@/state/ui";
import { usePlanStore } from "@/state/plan";

describe("Now screen states", () => {
  beforeEach(() => { usePlanStore.setState({ favorites: [], resolutions: {} }); });

  it("pre-festival shows a countdown to Friday gates", async () => {
    useUiStore.setState({ devNow: "2026-09-17T18:00:00-06:00" });
    renderAt("/");
    expect(await screen.findByText(/gates open in/i)).toBeInTheDocument();
    expect(screen.getByText(/Fri Sep 18 · 11:30 AM/)).toBeInTheDocument();
    expect(screen.getByText("Marcus King Band")).toBeInTheDocument();
  });

  it("live shows what is on stage and the user's next favorited set", async () => {
    useUiStore.setState({ devNow: "2026-09-19T15:40:00-06:00" });
    usePlanStore.setState({ favorites: ["sat-charlie-musselwhite-ga20-main-1630"] });
    renderAt("/");
    expect(await screen.findByText(/on stage now/i)).toBeInTheDocument();
    expect(screen.getByText("Nether Hour")).toBeInTheDocument();
    expect(screen.getByText(/your next set/i)).toBeInTheDocument();
    expect(screen.getAllByText("Charlie Musselwhite & GA-20").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Lightning hold/).length).toBeGreaterThan(0); // banner + latest alerts
  });

  it("post-festival thanks the user", async () => {
    useUiStore.setState({ devNow: "2026-09-21T10:00:00-06:00" });
    renderAt("/");
    expect(await screen.findByText(/see you in 2027/i)).toBeInTheDocument();
  });
});
