import { useSyncExternalStore } from "react";
import { Alert } from "@bb/shared";
import { z } from "zod";
import { isoMs } from "@/domain/time";
import fixture from "./alerts.fixture.json";

export interface AlertsRepository {
  getAlerts(): Alert[];
  subscribe(cb: () => void): () => void;
}

const alerts = z.array(Alert).parse(fixture).sort((a, b) => isoMs(b.publishedAt) - isoMs(a.publishedAt));

export const alertsRepository: AlertsRepository = { getAlerts: () => alerts, subscribe: () => () => {} };

export function useAlerts(): Alert[] {
  return useSyncExternalStore(alertsRepository.subscribe, alertsRepository.getAlerts, alertsRepository.getAlerts);
}

export function activeUrgent(list: Alert[], now: Date): Alert | null {
  const t = now.getTime();
  return list.find((a) => a.severity === "urgent" && isoMs(a.publishedAt) <= t && (!a.expiresAt || isoMs(a.expiresAt) > t)) ?? null;
}
