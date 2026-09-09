import { beforeEach, describe, expect, it } from "vitest";
import { usePlanStore } from "./plan";

describe("plan store", () => {
  beforeEach(() => usePlanStore.setState({ favorites: [], resolutions: {}, reminders: [], settings: { leadMinutes: 15, bufferMinutes: 10 } }));

  it("toggles favorites and reminders", () => {
    usePlanStore.getState().toggleFavorite("a");
    usePlanStore.getState().toggleFavorite("b");
    usePlanStore.getState().toggleFavorite("a");
    expect(usePlanStore.getState().favorites).toEqual(["b"]);
    usePlanStore.getState().toggleReminder("b");
    expect(usePlanStore.getState().reminders).toEqual(["b"]);
  });

  it("removing a favorite also drops its reminder", () => {
    usePlanStore.getState().toggleFavorite("a");
    usePlanStore.getState().toggleReminder("a");
    usePlanStore.getState().toggleFavorite("a");
    expect(usePlanStore.getState().reminders).toEqual([]);
  });

  it("records resolutions and settings", () => {
    usePlanStore.getState().resolve("a|b", "b");
    usePlanStore.getState().setSettings({ leadMinutes: 30 });
    expect(usePlanStore.getState().resolutions).toEqual({ "a|b": "b" });
    expect(usePlanStore.getState().settings).toEqual({ leadMinutes: 30, bufferMinutes: 10 });
  });
});
