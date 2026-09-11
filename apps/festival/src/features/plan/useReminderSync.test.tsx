import { act, renderHook } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

const adapter = vi.hoisted(() => ({
  supported: true,
  pendingList: [] as Array<{ id: number; at?: number }>,
  schedule: vi.fn(async (_i: unknown) => {}),
  cancel: vi.fn(async (_ids: number[]) => {}),
  onTap: vi.fn((_h: () => void) => () => {}),
}));
vi.mock("@/platform/notifications", () => ({
  notifications: {
    isSupported: () => adapter.supported,
    pending: async () => adapter.pendingList,
    schedule: adapter.schedule,
    cancel: adapter.cancel,
    onTap: adapter.onTap,
    permission: async () => "granted",
    request: async () => "granted",
    ensureExact: async () => true,
  },
}));

import { useReminderSync } from "./useReminderSync";
import { usePlanStore } from "@/state/plan";
import { hashId } from "@/domain/reminders";

const wrap = ({ children }: { children: ReactNode }) => <MemoryRouter>{children}</MemoryRouter>;
const FAV = "sat-charlie-musselwhite-ga20-main-1630"; // Sat 4:30 PM in the bundled fixture
const flush = () => act(async () => { await Promise.resolve(); await Promise.resolve(); });

describe("useReminderSync", () => {
  beforeEach(() => {
    usePlanStore.setState({ favorites: [], remindersOn: false, settings: { leadMinutes: 15, bufferMinutes: 10 } });
    adapter.pendingList = [];
    adapter.schedule.mockClear();
    adapter.cancel.mockClear();
    vi.useFakeTimers({ now: Date.parse("2026-09-19T10:00:00-06:00") });
  });
  afterEach(() => vi.useRealTimers());

  it("does nothing while the switch is off", async () => {
    usePlanStore.setState({ favorites: [FAV] });
    renderHook(() => useReminderSync(), { wrapper: wrap });
    await flush();
    expect(adapter.schedule).not.toHaveBeenCalled();
  });

  it("schedules favorites when on, cancels when a favorite is removed, cancels all when switched off", async () => {
    usePlanStore.setState({ favorites: [FAV], remindersOn: true });
    renderHook(() => useReminderSync(), { wrapper: wrap });
    await flush();
    expect(adapter.schedule).toHaveBeenCalledTimes(1);
    const [items] = adapter.schedule.mock.calls[0] as [Array<{ id: number; at: number }>];
    expect(items[0]!.id).toBe(hashId(FAV));
    expect(items[0]!.at).toBe(Date.parse("2026-09-19T16:15:00-06:00"));

    adapter.pendingList = [{ id: hashId(FAV), at: items[0]!.at }];
    act(() => usePlanStore.setState({ favorites: [] }));
    await flush();
    expect(adapter.cancel).toHaveBeenLastCalledWith([hashId(FAV)]);

    adapter.pendingList = [{ id: hashId(FAV) }];
    act(() => usePlanStore.setState({ favorites: [FAV] }));
    await flush();
    act(() => usePlanStore.setState({ remindersOn: false }));
    await flush();
    expect(adapter.cancel).toHaveBeenLastCalledWith([hashId(FAV)]);
  });

  it("reschedules when the lead time changes", async () => {
    usePlanStore.setState({ favorites: [FAV], remindersOn: true });
    renderHook(() => useReminderSync(), { wrapper: wrap });
    await flush();
    adapter.pendingList = [{ id: hashId(FAV), at: Date.parse("2026-09-19T16:15:00-06:00") }];
    act(() => usePlanStore.getState().setSettings({ leadMinutes: 30 }));
    await flush();
    expect(adapter.cancel).toHaveBeenLastCalledWith([hashId(FAV)]);
    const last = adapter.schedule.mock.calls.at(-1)![0] as Array<{ at: number }>;
    expect(last[0]!.at).toBe(Date.parse("2026-09-19T16:00:00-06:00"));
  });

  it("is inert where notifications are unsupported", async () => {
    adapter.supported = false;
    usePlanStore.setState({ favorites: [FAV], remindersOn: true });
    renderHook(() => useReminderSync(), { wrapper: wrap });
    await flush();
    expect(adapter.schedule).not.toHaveBeenCalled();
    adapter.supported = true;
  });
});
