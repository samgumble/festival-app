import { beforeEach, describe, expect, it } from "vitest";
import { usePlanStore } from "./plan";

describe("plan store", () => {
  beforeEach(() => usePlanStore.setState({ favorites: [], resolutions: {}, settings: { leadMinutes: 15, bufferMinutes: 10 }, remindersOn: false }));

  it("toggles favorites", () => {
    usePlanStore.getState().toggleFavorite("a");
    usePlanStore.getState().toggleFavorite("b");
    usePlanStore.getState().toggleFavorite("a");
    expect(usePlanStore.getState().favorites).toEqual(["b"]);
  });

  it("records resolutions and settings", () => {
    usePlanStore.getState().resolve("a|b", "b");
    usePlanStore.getState().setSettings({ leadMinutes: 30 });
    expect(usePlanStore.getState().resolutions).toEqual({ "a|b": "b" });
    expect(usePlanStore.getState().settings).toEqual({ leadMinutes: 30, bufferMinutes: 10 });
  });
});

describe("reminders switch", () => {
  it("defaults off and persists the choice", () => {
    expect(usePlanStore.getState().remindersOn).toBe(false);
    usePlanStore.getState().setRemindersOn(true);
    expect(usePlanStore.getState().remindersOn).toBe(true);
    expect(JSON.parse(localStorage.getItem("bb-plan")!).state.remindersOn).toBe(true);
  });
  it("migrates a v0 snapshot by dropping the old per-set reminders list", () => {
    localStorage.setItem("bb-plan", JSON.stringify({ state: { favorites: ["x"], resolutions: {}, reminders: ["x"], settings: { leadMinutes: 15, bufferMinutes: 10 } }, version: 0 }));
    usePlanStore.persist.rehydrate();
    const s = usePlanStore.getState() as unknown as Record<string, unknown>;
    expect(s.favorites).toEqual(["x"]);
    expect(s.reminders).toBeUndefined();
    expect(s.remindersOn).toBe(false);
  });
});

describe("persist migration v2", () => {
  it("resets the old default 10-minute buffer to none, keeps a deliberate 20", () => {
    const opts = (usePlanStore as unknown as { persist: { getOptions: () => { migrate: (p: unknown, v: number) => { settings: { bufferMinutes: number; leadMinutes: number } } } } }).persist.getOptions();
    expect(opts.migrate({ favorites: [], settings: { leadMinutes: 5, bufferMinutes: 10 } }, 1).settings).toEqual({ leadMinutes: 5, bufferMinutes: 0 });
    expect(opts.migrate({ favorites: [], settings: { leadMinutes: 15, bufferMinutes: 20 } }, 1).settings).toEqual({ leadMinutes: 15, bufferMinutes: 20 });
  });
});
