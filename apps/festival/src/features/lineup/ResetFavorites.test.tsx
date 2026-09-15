import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { renderAt } from "@/test/render";
import { useUiStore } from "@/state/ui";
import { usePlanStore } from "@/state/plan";

describe("Reset favorites", () => {
  beforeEach(() => {
    useUiStore.setState({ devNow: "2026-09-19T15:40:00-06:00", lineupView: "list" });
    usePlanStore.setState({ favorites: ["sat-charlie-musselwhite-ga20-main-1630", "sat-taj-mahal-keb-mo-main-2000"], resolutions: { "a|b": "a" } });
  });

  it("needs two confirmations, then empties favorites and conflict choices", async () => {
    renderAt("/lineup");
    fireEvent.click(await screen.findByRole("button", { name: /reset favorites/i }));
    expect(screen.getByText(/reset favorites\?/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    expect(screen.getByText(/are you sure\?/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /yes, reset/i }));
    expect(usePlanStore.getState().favorites).toEqual([]);
    expect(usePlanStore.getState().resolutions).toEqual({});
    expect(screen.getByText(/no favorites yet/i)).toBeInTheDocument();
  });

  it("keeps everything when the second step is declined", async () => {
    renderAt("/lineup");
    fireEvent.click(await screen.findByRole("button", { name: /reset favorites/i }));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    fireEvent.click(screen.getByRole("button", { name: /keep favorites/i }));
    expect(usePlanStore.getState().favorites).toHaveLength(2);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
