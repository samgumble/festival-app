/** Which shell we are running in. Native detection reads the global Capacitor injects into the WebView. */
export type Platform = "ios" | "android" | "web";

interface CapacitorGlobal { isNativePlatform?: () => boolean; getPlatform?: () => string }

function cap(): CapacitorGlobal | undefined {
  return (globalThis as { Capacitor?: CapacitorGlobal }).Capacitor;
}

export const runtime = {
  isNative(): boolean {
    return cap()?.isNativePlatform?.() === true;
  },
  platform(): Platform {
    const p = cap()?.getPlatform?.();
    return p === "ios" || p === "android" ? p : "web";
  },
};
