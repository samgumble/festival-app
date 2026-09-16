import { runtime } from "./runtime";

type Handle = { remove: () => Promise<void> };

/** Subscribe to a Capacitor App event for as long as the returned disposer is not called. Web: no-op. */
function onAppEvent(event: "resume" | "backButton", handler: () => void): () => void {
  if (!runtime.isNative()) return () => {};
  let remove: (() => void) | undefined;
  let cancelled = false;
  void import("@capacitor/app").then(async ({ App }) => {
    // Capacitor's listener signature varies per event; both events are handled without their payload here.
    const h = (await (App.addListener as (e: string, cb: () => void) => Promise<Handle>)(event, handler)) as Handle;
    if (cancelled) await h.remove();
    else remove = () => void h.remove();
  });
  return () => { cancelled = true; remove?.(); };
}

export const appLifecycle = {
  /** Fires when the app returns to the foreground. Web: no-op. */
  onResume(handler: () => void): () => void {
    return onAppEvent("resume", handler);
  },
  /**
   * Android hardware/gesture back. While at least one listener is registered Capacitor suppresses its
   * default (WebView history back, then exit), so register only while there is something to close.
   * Web and iOS: no-op.
   */
  onBackButton(handler: () => void): () => void {
    return onAppEvent("backButton", handler);
  },
};
