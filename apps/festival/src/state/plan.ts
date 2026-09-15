import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface PlanSettings { leadMinutes: 5 | 15 | 30; bufferMinutes: 0 | 10 | 20 }

interface PlanState {
  favorites: string[];
  resolutions: Record<string, string>;
  settings: PlanSettings;
  /** One switch: remind me before every favorited set (native only; D-023). */
  remindersOn: boolean;
  /**
   * True when `remindersOn` was auto-disabled because the OS permission was found missing
   * (revoked outside the app), as opposed to the fan deliberately flipping the switch off.
   * Android's `checkPermissions()` reports the ambiguous `"prompt"` (not `"denied"`) right
   * after an external revoke, so this flag is the reliable signal the settings sheet uses to
   * explain the switch turning itself off. Cleared once the fan interacts with the switch again.
   */
  remindersRevoked: boolean;
  toggleFavorite: (setId: string) => void;
  /** Empties the schedule: favorites and conflict choices (reminders follow via useReminderSync). */
  clearFavorites: () => void;
  resolve: (conflictKey: string, keepSetId: string) => void;
  setSettings: (patch: Partial<PlanSettings>) => void;
  setRemindersOn: (v: boolean) => void;
  setRemindersRevoked: (v: boolean) => void;
}

const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

export const usePlanStore = create<PlanState>()(
  persist(
    (set) => ({
      favorites: [],
      resolutions: {},
      settings: { leadMinutes: 15, bufferMinutes: 0 }, // back-to-back sets are not a conflict unless the fan asks for a buffer
      remindersOn: false,
      remindersRevoked: false,
      toggleFavorite: (id) => set((s) => ({ favorites: toggle(s.favorites, id) })),
      clearFavorites: () => set({ favorites: [], resolutions: {} }),
      resolve: (key, keep) => set((s) => ({ resolutions: { ...s.resolutions, [key]: keep } })),
      setSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      setRemindersOn: (remindersOn) => set({ remindersOn }),
      setRemindersRevoked: (remindersRevoked) => set({ remindersRevoked }),
    }),
    {
      name: "bb-plan",
      version: 2,
      // v0 carried a per-set `reminders: string[]` (toggles removed in the design pass); drop it.
      // v1 defaulted the stage buffer to 10 min, which flagged back-to-back sets (12–1 then 1–2) as
      // conflicts (owner, 2026-09-14); v2 resets a buffer that is still at that old default to 0.
      migrate: (persisted, version) => {
        const { reminders: _dropped, ...rest } = (persisted ?? {}) as Record<string, unknown> & { reminders?: unknown; settings?: { leadMinutes?: number; bufferMinutes?: number } };
        const settings = { leadMinutes: rest.settings?.leadMinutes ?? 15, bufferMinutes: version < 2 && (rest.settings?.bufferMinutes ?? 10) === 10 ? 0 : rest.settings?.bufferMinutes ?? 0 };
        return { remindersOn: false, ...rest, settings } as unknown as PlanState;
      },
    },
  ),
);
