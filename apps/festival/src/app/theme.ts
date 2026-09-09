import { useEffect } from "react";
import { useUiStore, type ThemeChoice } from "@/state/ui";

export function resolveTheme(choice: ThemeChoice, prefersDark: boolean): "light" | "dark" {
  return choice === "system" ? (prefersDark ? "dark" : "light") : choice;
}

/** Keeps <html data-theme> in sync with the user's choice and the OS. */
export function useApplyTheme(): void {
  const choice = useUiStore((s) => s.theme);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => { document.documentElement.dataset.theme = resolveTheme(choice, mq.matches); };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [choice]);
}
