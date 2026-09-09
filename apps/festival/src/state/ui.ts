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
    { name: "bb-ui" },
  ),
);
