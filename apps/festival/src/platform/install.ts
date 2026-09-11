import { useEffect, useState } from "react";

/**
 * Web install affordances behind a small interface (Capacitor builds get a no-op later):
 * captures `beforeinstallprompt` (Chromium), detects standalone mode and iOS Safari (manual
 * Add to Home Screen), and exposes a hook for the Info screen.
 */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export type InstallMode = "installed" | "prompt" | "ios" | "none";

let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

export function captureInstallPrompt(target: Window = window): void {
  target.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    notify();
  });
  target.addEventListener("appinstalled", () => {
    deferred = null;
    notify();
  });
}

export function isStandalone(w: Window = window): boolean {
  const nav = w.navigator as Navigator & { standalone?: boolean };
  return w.matchMedia?.("(display-mode: standalone)").matches === true || nav.standalone === true;
}

export function isIosSafari(nav: Navigator = navigator): boolean {
  const ua = nav.userAgent;
  const iDevice = /iPhone|iPad|iPod/i.test(ua) || (nav.platform === "MacIntel" && nav.maxTouchPoints > 1);
  return iDevice && /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS/i.test(ua);
}

export function installMode(): InstallMode {
  if (isStandalone()) return "installed";
  if (deferred) return "prompt";
  if (isIosSafari()) return "ios";
  return "none";
}

export function useInstall(): { mode: InstallMode; prompt: () => Promise<void> } {
  const [mode, setMode] = useState<InstallMode>(installMode);
  useEffect(() => {
    const l = () => setMode(installMode());
    listeners.add(l);
    l(); // pick up an event that fired between first render and subscription
    return () => { listeners.delete(l); };
  }, []);
  return {
    mode,
    prompt: async () => {
      const ev = deferred;
      if (!ev) return;
      await ev.prompt();
      await ev.userChoice;
      deferred = null;
      setMode(installMode());
    },
  };
}

export function _resetInstallForTests(): void {
  deferred = null;
  listeners.clear();
}
