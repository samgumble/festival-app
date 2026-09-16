import { useEffect, useRef } from "react";
import type { Alert } from "@bb/shared";
import { useFestivalClock } from "@/app/clock";
import { useAlerts } from "@/data/alerts";
import { alertNotificationId } from "@/domain/reminders";
import { isoMs } from "@/domain/time";
import { notifications } from "@/platform/notifications";
import { useAlertsStore } from "@/state/alerts";
import { usePlanStore } from "@/state/plan";

/** Alerts that are live right now and have not yet been surfaced as a notification. Pure. */
export function newAlertsToNotify(alerts: Alert[], notifiedIds: Iterable<string>, now: number): Alert[] {
  const done = new Set(notifiedIds);
  return alerts.filter((a) => !done.has(a.id) && isoMs(a.publishedAt) <= now && (!a.expiresAt || isoMs(a.expiresAt) > now));
}

/**
 * Surfaces organizer alerts as on-device notifications while the app is running, the same way set
 * reminders are, gated by the same switch and OS permission. The first time notifications arm on a
 * device every existing alert is recorded as already seen, so a fresh install never replays history.
 * Native only; a no-op on the web. Alerts published while the app is closed appear when it next opens
 * (true push needs Cloud Messaging; see docs/DECISIONS.md D-021).
 */
export function useAlertNotifications(): void {
  const alerts = useAlerts();
  const { now } = useFestivalClock();
  const remindersOn = usePlanStore((s) => s.remindersOn);
  const chain = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    if (!notifications.isSupported() || !remindersOn) return;
    chain.current = chain.current.then(async () => {
      if (!usePlanStore.getState().remindersOn) return;
      if ((await notifications.permission()) !== "granted") return;
      const store = useAlertsStore.getState();
      if (!store.notifiedSeeded) { store.seedNotified(alerts.map((a) => a.id)); return; }
      const fresh = newAlertsToNotify(alerts, store.notifiedIds, now.getTime());
      if (fresh.length === 0) return;
      store.markNotified(fresh.map((a) => a.id));
      await notifications.schedule(fresh.map((a) => ({
        id: alertNotificationId(a.id),
        setId: `alert:${a.id}`,
        title: a.title,
        body: a.body,
        at: Date.now() + 1_000,
      })));
    });
  }, [alerts, now, remindersOn]);
}
