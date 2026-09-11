import { registerSW } from "virtual:pwa-register";
import { runtime } from "@/platform/runtime";
import { useUpdateStore } from "@/state/updates";

/**
 * Registers the Workbox service worker (vite-plugin-pwa, prompt mode) and forwards its lifecycle
 * into the update store. No-op in the native shell, in dev, under Vitest, and in browsers without
 * service workers.
 */
export function setupServiceWorker(env: { dev: boolean; mode: string } = { dev: import.meta.env.DEV, mode: import.meta.env.MODE }): void {
  if (runtime.isNative() || env.dev || env.mode === "test" || typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  const store = useUpdateStore.getState();
  if (navigator.serviceWorker.controller) store.setOfflineReady();
  const update = registerSW({
    immediate: false,
    onNeedRefresh: () => useUpdateStore.getState().setNeedRefresh(),
    onOfflineReady: () => useUpdateStore.getState().setOfflineReady(),
    onRegisterError: (e) => console.warn("Service worker registration failed", e),
  });
  store.setApply(() => update(true));
}
