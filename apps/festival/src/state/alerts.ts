import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AlertsState {
  readIds: string[];
  pushOptIn: boolean;
  /** Alert ids already surfaced as an on-device notification (or present when notifications first armed). */
  notifiedIds: string[];
  notifiedSeeded: boolean;
  markRead: (id: string) => void;
  setPushOptIn: (v: boolean) => void;
  markNotified: (ids: string[]) => void;
  seedNotified: (ids: string[]) => void;
}

export const useAlertsStore = create<AlertsState>()(
  persist(
    (set) => ({
      readIds: [],
      pushOptIn: false,
      notifiedIds: [],
      notifiedSeeded: false,
      markRead: (id) => set((s) => (s.readIds.includes(id) ? s : { readIds: [...s.readIds, id] })),
      setPushOptIn: (v) => set({ pushOptIn: v }),
      markNotified: (ids) => set((s) => ({ notifiedIds: [...new Set([...s.notifiedIds, ...ids])] })),
      seedNotified: (ids) => set((s) => ({ notifiedIds: [...new Set([...s.notifiedIds, ...ids])], notifiedSeeded: true })),
    }),
    { name: "bb-alerts" },
  ),
);
