import { fireEvent, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { renderAt } from "@/test/render";
import { useUiStore } from "@/state/ui";
import { usePlanStore } from "@/state/plan";

describe("Lineup list", () => {
  beforeEach(() => {
    useUiStore.setState({ devNow: "2026-09-19T15:40:00-06:00", lineupView: "list" });
    usePlanStore.setState({ favorites: [] });
  });

  it("defaults to today during the festival and groups by stage", async () => {
    renderAt("/lineup");
    expect(await screen.findByRole("radio", { name: /sat/i })).toBeChecked();
    const main = screen.getByTestId("stage-main");
    expect(within(main).getByText("Nether Hour")).toBeInTheDocument();
    expect(within(main).getByText(/on now · 20 min left/i)).toBeInTheDocument();
    expect(within(screen.getByTestId("stage-blues")).getByText("Albert White")).toBeInTheDocument();
  });

  it("hearts add a set to the plan without opening the sheet", async () => {
    renderAt("/lineup");
    const heart = await screen.findByRole("button", { name: /favorite nether hour/i });
    fireEvent.click(heart);
    expect(usePlanStore.getState().favorites).toEqual(["sat-nether-hour-main-1500"]);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("search filters across all days", async () => {
    renderAt("/lineup");
    fireEvent.change(await screen.findByRole("searchbox"), { target: { value: "keb" } });
    expect(screen.getByText("Taj Mahal & Keb’ Mo’")).toBeInTheDocument();
    expect(screen.queryByText("Nether Hour")).toBeNull();
  });

  it("lists comedy acts without times", async () => {
    renderAt("/lineup");
    expect(await screen.findByText("Baron Vaughn")).toBeInTheDocument();
  });
});
