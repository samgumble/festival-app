import { beforeEach, describe, expect, it, vi } from "vitest";
import { useUpdateStore } from "./updates";

describe("update store", () => {
  beforeEach(() => useUpdateStore.getState().reset());

  it("starts idle", () => {
    const s = useUpdateStore.getState();
    expect(s.needRefresh).toBe(false);
    expect(s.offlineReady).toBe(false);
    expect(s.dismissed).toBe(false);
  });

  it("flags a refresh and can be dismissed for the session", () => {
    useUpdateStore.getState().setNeedRefresh();
    expect(useUpdateStore.getState().needRefresh).toBe(true);
    useUpdateStore.getState().dismiss();
    expect(useUpdateStore.getState().dismissed).toBe(true);
  });

  it("a later needRefresh clears a previous dismissal", () => {
    useUpdateStore.getState().setNeedRefresh();
    useUpdateStore.getState().dismiss();
    useUpdateStore.getState().setNeedRefresh();
    expect(useUpdateStore.getState().dismissed).toBe(false);
  });

  it("apply defaults to a no-op and can be replaced", async () => {
    await expect(useUpdateStore.getState().apply()).resolves.toBeUndefined();
    const fn = vi.fn(async () => {});
    useUpdateStore.getState().setApply(fn);
    await useUpdateStore.getState().apply();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("marks offline-ready", () => {
    useUpdateStore.getState().setOfflineReady();
    expect(useUpdateStore.getState().offlineReady).toBe(true);
  });
});
