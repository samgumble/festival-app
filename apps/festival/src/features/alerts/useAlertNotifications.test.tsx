import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Alert } from "@bb/shared";

const adapter = vi.hoisted(() => ({
  supported: true,
  schedule: vi.fn(async (_i: unknown) => {}),
  permission: vi.fn(async () => "granted" as "granted" | "denied" | "prompt"),
}));
vi.mock("@/platform/notifications", () => ({
  notifications: { isSupported: () => adapter.supported, schedule: adapter.schedule, permission: adapter.permission },
}));
const feed = vi.hoisted(() => ({ alerts: [] as unknown[] }));
vi.mock("@/data/alerts", () => ({ useAlerts: () => feed.alerts }));

import { newAlertsToNotify, useAlertNotifications } from "./useAlertNotifications";
import { alertNotificationId, diffReminders, isAlertNotificationId, TEST_REMINDER_ID } from "@/domain/reminders";
import { useAlertsStore } from "@/state/alerts";
import { usePlanStore } from "@/state/plan";
import { useUiStore } from "@/state/ui";

const NOW = "2026-09-19T15:40:00-06:00";
const alert = (id: string, publishedAt = "2026-09-19T15:30:00-06:00", extra: Partial<Alert> = {}): Alert =>
  ({ id, title: `Alert ${id}`, body: "Body", severity: "info", publishedAt, publishedBy: "admin", push: false, ...extra });

const flush = () => act(async () => { for (let i = 0; i < 4; i++) await Promise.resolve(); });

describe("newAlertsToNotify", () => {
  const now = Date.parse(NOW);
  it("returns live alerts not yet notified, skipping future and expired ones", () => {
    const list = [alert("a"), alert("b"), alert("future", "2026-09-19T16:00:00-06:00"), alert("expired", "2026-09-19T10:00:00-06:00", { expiresAt: "2026-09-19T12:00:00-06:00" })];
    expect(newAlertsToNotify(list, ["a"], now).map((a) => a.id)).toEqual(["b"]);
  });
});

describe("alert notification ids", () => {
  it("live in a reserved range the reminder sync never cancels", () => {
    const id = alertNotificationId("gates-open");
    expect(isAlertNotificationId(id)).toBe(true);
    expect(isAlertNotificationId(TEST_REMINDER_ID)).toBe(false);
    expect(isAlertNotificationId(12345)).toBe(false);
    const diff = diffReminders([], [{ id, at: Date.now() }, { id: 42, at: 1 }]);
    expect(diff.cancel).toEqual([42]);
  });
});

describe("useAlertNotifications", () => {
  beforeEach(() => {
    useUiStore.setState({ devNow: NOW });
    usePlanStore.setState({ remindersOn: true });
    useAlertsStore.setState({ notifiedIds: [], notifiedSeeded: false, readIds: [] });
    adapter.supported = true;
    adapter.schedule.mockClear();
    adapter.permission.mockResolvedValue("granted");
    feed.alerts = [alert("old-1"), alert("old-2")];
  });
  afterEach(() => { feed.alerts = []; });

  it("seeds existing alerts silently on first arm, then notifies only new ones and routes them to the alert range", async () => {
    const { rerender } = renderHook(() => useAlertNotifications());
    await flush();
    expect(adapter.schedule).not.toHaveBeenCalled();
    expect(useAlertsStore.getState().notifiedSeeded).toBe(true);
    expect(useAlertsStore.getState().notifiedIds).toEqual(["old-1", "old-2"]);
    feed.alerts = [...feed.alerts, alert("new-1")];
    rerender();
    await flush();
    expect(adapter.schedule).toHaveBeenCalledTimes(1);
    const items = adapter.schedule.mock.calls[0]![0] as Array<{ id: number; setId: string; title: string }>;
    expect(items).toHaveLength(1);
    expect(items[0]!.setId).toBe("alert:new-1");
    expect(items[0]!.title).toBe("Alert new-1");
    expect(isAlertNotificationId(items[0]!.id)).toBe(true);
    rerender();
    await flush();
    expect(adapter.schedule).toHaveBeenCalledTimes(1); // not repeated
  });

  it("stays quiet while the reminders switch is off or permission is missing", async () => {
    useAlertsStore.setState({ notifiedSeeded: true, notifiedIds: [] });
    usePlanStore.setState({ remindersOn: false });
    renderHook(() => useAlertNotifications());
    await flush();
    expect(adapter.schedule).not.toHaveBeenCalled();
    usePlanStore.setState({ remindersOn: true });
    adapter.permission.mockResolvedValue("denied");
    renderHook(() => useAlertNotifications());
    await flush();
    expect(adapter.schedule).not.toHaveBeenCalled();
  });

  it("is inert on the web", async () => {
    adapter.supported = false;
    renderHook(() => useAlertNotifications());
    await flush();
    expect(useAlertsStore.getState().notifiedSeeded).toBe(false);
    expect(adapter.schedule).not.toHaveBeenCalled();
  });
});
