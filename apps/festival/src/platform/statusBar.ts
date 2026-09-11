import { runtime } from "./runtime";

/** Status-bar text follows the resolved theme. Web: no-op. */
export const statusBar = {
  async apply(theme: "light" | "dark"): Promise<void> {
    if (!runtime.isNative()) return;
    try {
      const { StatusBar, Style } = await import("@capacitor/status-bar");
      await StatusBar.setStyle({ style: theme === "dark" ? Style.Dark : Style.Light });
      if (runtime.platform() === "android") await StatusBar.setBackgroundColor({ color: "#00000000" });
    } catch {
      /* status bar unavailable */
    }
  },
};
