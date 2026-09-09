import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AlertsState {
  readIds: string[];
  pushOptIn: boolean;
  markRead: (id: string) => void;
  setPushOptIn: (v: boolean) => void;
}

export const useAlertsStore = create<AlertsState>()(
  persist(
    (set) => ({
      readIds: [],
      pushOptIn: false,
      markRead: (id) => set((s) => (s.readIds.includes(id) ? s : { readIds: [...s.readIds, id] })),
      setPushOptIn: (v) => set({ pushOptIn: v }),
    }),
    { name: "bb-alerts" },
  ),
);
