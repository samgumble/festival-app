import { fireEvent, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { renderAt } from "@/test/render";
import { useUiStore } from "@/state/ui";
import { usePlanStore } from "@/state/plan";

describe("ArtistSheet", () => {
  beforeEach(() => {
    useUiStore.setState({ devNow: "2026-09-19T15:40:00-06:00" });
    usePlanStore.setState({ favorites: [], reminders: [] });
  });

  it("lists every set for the artist and toggles plan membership", async () => {
    renderAt("/lineup/artist/nigel-wearne");
    const dialog = await screen.findByRole("dialog", { name: /nigel wearne/i });
    expect(within(dialog).getAllByRole("button", { name: /^favorite/i }).length).toBe(3);
    expect(within(dialog).getByText(/Fri/)).toBeInTheDocument();
    fireEvent.click(within(dialog).getAllByRole("button", { name: /^favorite/i })[1]!);
    expect(usePlanStore.getState().favorites).toEqual(["sat-nigel-wearne-camp-1230"]);
  });

  it("offers a single-set add button and a reminder once added", async () => {
    renderAt("/lineup/artist/nether-hour");
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: /add to plan/i }));
    expect(usePlanStore.getState().favorites).toEqual(["sat-nether-hour-main-1500"]);
    fireEvent.click(within(dialog).getByRole("switch", { name: /remind me/i }));
    expect(usePlanStore.getState().reminders).toEqual(["sat-nether-hour-main-1500"]);
  });

  it("shows comedy acts without sets", async () => {
    renderAt("/lineup/artist/baron-vaughn");
    expect(await screen.findByText(/set times will be announced by the festival/i)).toBeInTheDocument();
  });

  it("closes back to the lineup", async () => {
    const { router } = renderAt("/lineup/artist/eggy");
    await screen.findByRole("dialog");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(router.state.location.pathname).toBe("/lineup");
  });

  it("external link carries the 44px hit-area and share survives a cancelled sheet", async () => {
    const original = navigator.share;
    Object.defineProperty(navigator, "share", { value: () => Promise.reject(new DOMException("cancelled", "AbortError")), configurable: true });
    try {
      renderAt("/lineup/artist/eggy");
      const dialog = await screen.findByRole("dialog");
      expect(within(dialog).getByRole("link", { name: /official lineup/i }).className).toMatch(/before:-inset-y-1\b/);
      fireEvent.click(within(dialog).getByRole("button", { name: /share/i }));
      await new Promise((r) => setTimeout(r, 0)); // let the rejected promise settle without an unhandled rejection
    } finally {
      Object.defineProperty(navigator, "share", { value: original, configurable: true });
    }
  });
});
