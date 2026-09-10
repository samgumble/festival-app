import { useSyncExternalStore } from "react";
import { Alert } from "@bb/shared";
import { z } from "zod";
import { isoMs } from "@/domain/time";
import fixture from "./alerts.fixture.json";
import { useFirestore } from "./source";

export interface AlertsRepository {
  getAlerts(): Alert[];
  subscribe(cb: () => void): () => void;
}

const alerts = z.array(Alert).parse(fixture).sort((a, b) => isoMs(b.publishedAt) - isoMs(a.publishedAt));

const fixtureRepository: AlertsRepository = { getAlerts: () => alerts, subscribe: () => () => {} };

/**
 * An `AlertsRepository` that starts empty and only pulls in the Firestore SDK (via dynamic import)
 * the first time something actually subscribes — keeping `firebase/firestore` out of the initial
 * JS chunk for everyone who never touches live alerts (tests, first paint).
 */
function createLazyLiveAlertsSource(): AlertsRepository {
  let current: Alert[] = [];
  const listeners = new Set<() => void>();
  let started = false;
  const subscribe = (cb: () => void) => {
    listeners.add(cb);
    if (!started) {
      started = true;
      void import("./firebase").then(({ getDb }) =>
        import("./firestore-alerts").then(({ startAlertsListener }) =>
          startAlertsListener(
            getDb(),
            (next) => { current = next; listeners.forEach((l) => l()); },
            () => { started = false; },
          ),
        ),
      );
    }
    return () => listeners.delete(cb);
  };
  return { getAlerts: () => current, subscribe };
}

export const alertsRepository: AlertsRepository = useFirestore ? createLazyLiveAlertsSource() : fixtureRepository;

export function useAlerts(): Alert[] {
  return useSyncExternalStore(alertsRepository.subscribe, alertsRepository.getAlerts, alertsRepository.getAlerts);
}

export function activeUrgent(list: Alert[], now: Date): Alert | null {
  const t = now.getTime();
  return list.find((a) => a.severity === "urgent" && isoMs(a.publishedAt) <= t && (!a.expiresAt || isoMs(a.expiresAt) > t)) ?? null;
}
