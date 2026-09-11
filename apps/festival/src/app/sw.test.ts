import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { registerSW, updateSW } from "virtual:pwa-register";
import { setupServiceWorker } from "./sw";
import { useUpdateStore } from "@/state/updates";

type Options = { immediate?: boolean; onNeedRefresh?: () => void; onOfflineReady?: () => void };
const PROD = { dev: false, mode: "production" };

function stubServiceWorker(controller: object | null) {
  Object.defineProperty(navigator, "serviceWorker", { value: { controller }, configurable: true });
}

describe("setupServiceWorker", () => {
  beforeEach(() => {
    useUpdateStore.getState().reset();
    vi.mocked(registerSW).mockClear();
    vi.mocked(updateSW).mockClear();
  });
  afterEach(() => {
    // @ts-expect-error jsdom has no serviceWorker; remove our stub
    delete navigator.serviceWorker;
  });

  it("does nothing in dev, in tests, or without serviceWorker support", () => {
    stubServiceWorker(null);
    setupServiceWorker({ dev: true, mode: "production" });
    setupServiceWorker({ dev: false, mode: "test" });
    // @ts-expect-error see above
    delete navigator.serviceWorker;
    setupServiceWorker(PROD);
    expect(registerSW).not.toHaveBeenCalled();
  });

  it("registers immediately in production and wires the callbacks into the store", async () => {
    stubServiceWorker(null);
    setupServiceWorker(PROD);
    expect(registerSW).toHaveBeenCalledTimes(1);
    const opts = vi.mocked(registerSW).mock.calls[0]![0] as Options;
    expect(opts.immediate).toBe(true);
    expect(useUpdateStore.getState().needRefresh).toBe(false);
    opts.onNeedRefresh!();
    expect(useUpdateStore.getState().needRefresh).toBe(true);
    opts.onOfflineReady!();
    expect(useUpdateStore.getState().offlineReady).toBe(true);
    await useUpdateStore.getState().apply();
    expect(updateSW).toHaveBeenCalledWith(true);
  });

  it("treats an already-controlling worker as offline-ready at startup", () => {
    stubServiceWorker({});
    setupServiceWorker(PROD);
    expect(useUpdateStore.getState().offlineReady).toBe(true);
  });
});
