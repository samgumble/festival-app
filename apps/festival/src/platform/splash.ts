import { runtime } from "./runtime";

/** Hide the native splash once React has painted. Web: no-op. */
export const splash = {
  async hide(): Promise<void> {
    if (!runtime.isNative()) return;
    try {
      const { SplashScreen } = await import("@capacitor/splash-screen");
      await SplashScreen.hide({ fadeOutDuration: 200 });
    } catch {
      /* splash screen unavailable */
    }
  },
};
