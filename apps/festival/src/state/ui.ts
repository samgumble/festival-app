import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeChoice = "system" | "light" | "dark";

interface UiState {
  theme: ThemeChoice;
  /** Dev-only clock override (ISO with offset). Ignored in production builds. */
  devNow: string | null;
  lineupView: "list" | "grid";
  setTheme: (t: ThemeChoice) => void;
  setDevNow: (iso: string | null) => void;
  setLineupView: (v: "list" | "grid") => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      theme: "system",
      devNow: import.meta.env.DEV ? (import.meta.env.VITE_FESTIVAL_NOW ?? null) : null,
      lineupView: "list",
      setTheme: (theme) => set({ theme }),
      setDevNow: (devNow) => set({ devNow }),
      setLineupView: (lineupView) => set({ lineupView }),
    }),
    {
      name: "bb-ui",
      // The Lineup view is session-only: every launch opens in the list (owner request 2026-09-15).
      partialize: (s) => ({ theme: s.theme, devNow: s.devNow }),
      version: 1,
      migrate: (persisted) => { const { lineupView: _drop, ...rest } = (persisted ?? {}) as { lineupView?: unknown; theme?: ThemeChoice; devNow?: string | null }; return { theme: rest.theme ?? "system", devNow: rest.devNow ?? null }; },
    },
  ),
);
