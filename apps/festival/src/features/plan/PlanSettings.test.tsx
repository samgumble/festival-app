import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const adapter = vi.hoisted(() => ({ supported: true, request: vi.fn(async () => "granted" as "granted" | "denied"), ensureExact: vi.fn(async () => true) }));
vi.mock("@/platform/notifications", () => ({
  notifications: { isSupported: () => adapter.supported, request: adapter.request, ensureExact: adapter.ensureExact, permission: async () => "prompt", pending: async () => [], schedule: async () => {}, cancel: async () => {}, onTap: () => () => {} },
}));

import { PlanSettings } from "./PlanSettings";
import { usePlanStore } from "@/state/plan";

describe("PlanSettings reminders switch", () => {
  beforeEach(() => { usePlanStore.setState({ remindersOn: false }); adapter.supported = true; adapter.request.mockResolvedValue("granted"); });
  afterEach(() => vi.clearAllMocks());

  it("is hidden where notifications are unsupported", () => {
    adapter.supported = false;
    render(<PlanSettings onClose={() => {}} />);
    expect(screen.queryByRole("switch", { name: "Remind me before my sets" })).not.toBeInTheDocument();
  });

  it("asks permission and turns on when granted", async () => {
    render(<PlanSettings onClose={() => {}} />);
    fireEvent.click(screen.getByRole("switch", { name: "Remind me before my sets" }));
    await waitFor(() => expect(usePlanStore.getState().remindersOn).toBe(true));
    expect(adapter.request).toHaveBeenCalledTimes(1);
    expect(adapter.ensureExact).toHaveBeenCalledTimes(1);
  });

  it("snaps back and explains when denied", async () => {
    adapter.request.mockResolvedValue("denied");
    render(<PlanSettings onClose={() => {}} />);
    fireEvent.click(screen.getByRole("switch", { name: "Remind me before my sets" }));
    expect(await screen.findByText(/Notifications are off for this app in Settings/)).toBeInTheDocument();
    expect(usePlanStore.getState().remindersOn).toBe(false);
  });

  it("turns off without asking", async () => {
    usePlanStore.setState({ remindersOn: true });
    render(<PlanSettings onClose={() => {}} />);
    fireEvent.click(screen.getByRole("switch", { name: "Remind me before my sets" }));
    await waitFor(() => expect(usePlanStore.getState().remindersOn).toBe(false));
    expect(adapter.request).not.toHaveBeenCalled();
  });

  it("guards against a second tap while the permission request is in flight", async () => {
    let resolveRequest!: (v: "granted" | "denied") => void;
    adapter.request.mockReturnValue(new Promise((resolve) => { resolveRequest = resolve; }));
    render(<PlanSettings onClose={() => {}} />);
    const toggle = screen.getByRole("switch", { name: "Remind me before my sets" });
    fireEvent.click(toggle);
    fireEvent.click(toggle);
    resolveRequest("granted");
    await waitFor(() => expect(usePlanStore.getState().remindersOn).toBe(true));
    expect(adapter.request).toHaveBeenCalledTimes(1);
  });
});
