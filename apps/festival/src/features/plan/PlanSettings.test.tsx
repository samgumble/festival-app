import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const adapter = vi.hoisted(() => ({
  supported: true,
  request: vi.fn(async () => "granted" as "granted" | "denied"),
  exactAllowed: vi.fn(async () => true),
  requestExact: vi.fn(async () => true),
  permission: vi.fn(async () => "prompt" as "granted" | "denied" | "prompt"),
}));
vi.mock("@/platform/notifications", () => ({
  notifications: { isSupported: () => adapter.supported, request: adapter.request, exactAllowed: adapter.exactAllowed, requestExact: adapter.requestExact, permission: adapter.permission, pending: async () => [], schedule: async () => {}, cancel: async () => {}, onTap: () => () => {} },
}));

import { PlanSettings } from "./PlanSettings";
import { usePlanStore } from "@/state/plan";

describe("PlanSettings reminders switch", () => {
  beforeEach(() => {
    usePlanStore.setState({ remindersOn: false, remindersRevoked: false });
    adapter.supported = true;
    adapter.request.mockResolvedValue("granted");
    adapter.exactAllowed.mockResolvedValue(true);
    adapter.requestExact.mockResolvedValue(true);
    adapter.permission.mockResolvedValue("prompt");
  });
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
    expect(adapter.exactAllowed).toHaveBeenCalledTimes(1);
  });

  it("shows the arrive-late hint when exact alarms aren't allowed, while reminders stay on", async () => {
    adapter.exactAllowed.mockResolvedValue(false);
    render(<PlanSettings onClose={() => {}} />);
    fireEvent.click(screen.getByRole("switch", { name: "Remind me before my sets" }));
    expect(await screen.findByText(/arrive a few minutes late/)).toBeInTheDocument();
    expect(usePlanStore.getState().remindersOn).toBe(true);
  });

  it("snaps back and explains when denied", async () => {
    adapter.request.mockResolvedValue("denied");
    render(<PlanSettings onClose={() => {}} />);
    fireEvent.click(screen.getByRole("switch", { name: "Remind me before my sets" }));
    expect(await screen.findByText(/Notifications are off for this app in Settings/)).toBeInTheDocument();
    expect(usePlanStore.getState().remindersOn).toBe(false);
  });

  it("explains the switch via remindersRevoked even though Android's checkPermissions() only says \"prompt\"", async () => {
    // useReminderSync already flipped the switch off and set remindersRevoked before this sheet
    // mounted (matches: fan revokes in system Settings, relaunches, opens Plan settings). The
    // sheet's own mount-time permission() check comes back "prompt", not "denied" — Android
    // resets shouldShowRequestPermissionRationale on an external revoke — so remindersRevoked is
    // what must carry the explanation.
    adapter.permission.mockResolvedValue("prompt");
    usePlanStore.setState({ remindersOn: false, remindersRevoked: true });
    render(<PlanSettings onClose={() => {}} />);
    expect(await screen.findByText(/Notifications are off for this app in Settings/)).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "Remind me before my sets" })).not.toBeChecked();
  });

  it("clears remindersRevoked once the fan turns reminders back on", async () => {
    usePlanStore.setState({ remindersOn: false, remindersRevoked: true });
    render(<PlanSettings onClose={() => {}} />);
    fireEvent.click(screen.getByRole("switch", { name: "Remind me before my sets" }));
    await waitFor(() => expect(usePlanStore.getState().remindersOn).toBe(true));
    expect(usePlanStore.getState().remindersRevoked).toBe(false);
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
