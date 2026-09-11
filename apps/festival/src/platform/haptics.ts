import { runtime } from "./runtime";

/** Light impact on favorite. Web: no-op. */
export const haptics = {
  async tap(): Promise<void> {
    if (!runtime.isNative()) return;
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    await Haptics.impact({ style: ImpactStyle.Light });
  },
};
