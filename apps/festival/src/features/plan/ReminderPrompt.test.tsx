import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const adapter = vi.hoisted(() => ({ supported: true, request: vi.fn(), exactAllowed: vi.fn(), permission: vi.fn() }));
vi.mock("@/platform/notifications", () => ({
  notifications: { isSupported: () => adapter.supported, request: adapter.request, exactAllowed: adapter.exactAllowed, requestExact: vi.fn(), permission: adapter.permission, pending: async () => [], schedule: async () => {}, cancel: async () => {}, onTap: () => () => {} },
}));

import { renderAt } from "@/test/render";
import { useUiStore } from "@/state/ui";
import { usePlanStore } from "@/state/plan";

describe("Reminder prompt on My Schedule", () => {
  beforeEach(() => {
    adapter.supported = true;
    adapter.request.mockResolvedValue("granted");
    adapter.exactAllowed.mockResolvedValue(true);
    adapter.permission.mockResolvedValue("prompt");
    useUiStore.setState({ devNow: "2026-09-19T15:40:00-06:00" });
    usePlanStore.setState({ favorites: ["sat-taj-mahal-keb-mo-main-2000"], resolutions: {}, remindersOn: false, remindersRevoked: false, settings: { leadMinutes: 15, bufferMinutes: 10 } });
  });

  it("offers to turn reminders on, asks permission, then shows the status line", async () => {
    renderAt("/plan");
    fireEvent.click(await screen.findByRole("button", { name: /turn on/i }));
    await waitFor(() => expect(usePlanStore.getState().remindersOn).toBe(true));
    expect(adapter.request).toHaveBeenCalled();
    expect(await screen.findByText(/reminders on · 15 min before/i)).toBeInTheDocument();
  });

  it("is absent on the web", async () => {
    adapter.supported = false;
    renderAt("/plan");
    await screen.findByRole("heading", { name: /my schedule/i });
    expect(screen.queryByRole("button", { name: /turn on/i })).not.toBeInTheDocument();
  });
});
