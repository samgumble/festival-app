import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface PlanSettings { leadMinutes: 5 | 15 | 30; bufferMinutes: 0 | 10 | 20 }

interface PlanState {
  favorites: string[];
  resolutions: Record<string, string>;
  reminders: string[];
  settings: PlanSettings;
  toggleFavorite: (setId: string) => void;
  resolve: (conflictKey: string, keepSetId: string) => void;
  toggleReminder: (setId: string) => void;
  setSettings: (patch: Partial<PlanSettings>) => void;
}

const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

export const usePlanStore = create<PlanState>()(
  persist(
    (set) => ({
      favorites: [],
      resolutions: {},
      reminders: [],
      settings: { leadMinutes: 15, bufferMinutes: 10 },
      toggleFavorite: (id) =>
        set((s) => {
          const favorites = toggle(s.favorites, id);
          const reminders = favorites.includes(id) ? s.reminders : s.reminders.filter((x) => x !== id);
          return { favorites, reminders };
        }),
      resolve: (key, keep) => set((s) => ({ resolutions: { ...s.resolutions, [key]: keep } })),
      toggleReminder: (id) => set((s) => ({ reminders: toggle(s.reminders, id) })),
      setSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
    }),
    { name: "bb-plan" },
  ),
);
