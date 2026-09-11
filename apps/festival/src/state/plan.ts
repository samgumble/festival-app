import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface PlanSettings { leadMinutes: 5 | 15 | 30; bufferMinutes: 0 | 10 | 20 }

interface PlanState {
  favorites: string[];
  resolutions: Record<string, string>;
  settings: PlanSettings;
  /** One switch: remind me before every favorited set (native only; D-023). */
  remindersOn: boolean;
  toggleFavorite: (setId: string) => void;
  resolve: (conflictKey: string, keepSetId: string) => void;
  setSettings: (patch: Partial<PlanSettings>) => void;
  setRemindersOn: (v: boolean) => void;
}

const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

export const usePlanStore = create<PlanState>()(
  persist(
    (set) => ({
      favorites: [],
      resolutions: {},
      settings: { leadMinutes: 15, bufferMinutes: 10 },
      remindersOn: false,
      toggleFavorite: (id) => set((s) => ({ favorites: toggle(s.favorites, id) })),
      resolve: (key, keep) => set((s) => ({ resolutions: { ...s.resolutions, [key]: keep } })),
      setSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      setRemindersOn: (remindersOn) => set({ remindersOn }),
    }),
    {
      name: "bb-plan",
      version: 1,
      // v0 carried a per-set `reminders: string[]` (toggles removed in the design pass); drop it.
      migrate: (persisted) => {
        const { reminders: _dropped, ...rest } = (persisted ?? {}) as Record<string, unknown> & { reminders?: unknown };
        return { remindersOn: false, ...rest } as unknown as PlanState;
      },
    },
  ),
);
