import { runtime } from "./runtime";

/** Fires when the app returns to the foreground. Web: no-op. */
export const appLifecycle = {
  onResume(handler: () => void): () => void {
    if (!runtime.isNative()) return () => {};
    let remove: (() => void) | undefined;
    let cancelled = false;
    void import("@capacitor/app").then(async ({ App }) => {
      const h = await App.addListener("resume", () => handler());
      if (cancelled) await h.remove();
      else remove = () => void h.remove();
    });
    return () => { cancelled = true; remove?.(); };
  },
};
