import { useSyncExternalStore } from "react";
import { Alert } from "@bb/shared";
import { z } from "zod";
import { isoMs } from "@/domain/time";
import fixture from "./alerts.fixture.json";
import { getDb } from "./firebase";
import { createFirestoreAlertsSource } from "./firestore-alerts";

export interface AlertsRepository {
  getAlerts(): Alert[];
  subscribe(cb: () => void): () => void;
}

const alerts = z.array(Alert).parse(fixture).sort((a, b) => isoMs(b.publishedAt) - isoMs(a.publishedAt));

const fixtureRepository: AlertsRepository = { getAlerts: () => alerts, subscribe: () => () => {} };

const useFirestore = import.meta.env.VITE_DATA_SOURCE === "firestore" || (import.meta.env.PROD && import.meta.env.VITE_DATA_SOURCE !== "bundled");

export const alertsRepository: AlertsRepository = useFirestore ? createFirestoreAlertsSource(getDb()) : fixtureRepository;

export function useAlerts(): Alert[] {
  return useSyncExternalStore(alertsRepository.subscribe, alertsRepository.getAlerts, alertsRepository.getAlerts);
}

export function activeUrgent(list: Alert[], now: Date): Alert | null {
  const t = now.getTime();
  return list.find((a) => a.severity === "urgent" && isoMs(a.publishedAt) <= t && (!a.expiresAt || isoMs(a.expiresAt) > t)) ?? null;
}
