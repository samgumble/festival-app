import { beforeEach, describe, expect, it, vi } from "vitest";

const { addListener, remove, isNative } = vi.hoisted(() => ({
  addListener: vi.fn(),
  remove: vi.fn(async () => {}),
  isNative: vi.fn(() => true),
}));
vi.mock("@capacitor/app", () => ({ App: { addListener } }));
vi.mock("./runtime", () => ({ runtime: { isNative, platform: () => "android" } }));

import { appLifecycle } from "./appLifecycle";

const flush = () => new Promise((r) => setTimeout(r, 0));

describe("appLifecycle.onBackButton", () => {
  beforeEach(() => { addListener.mockReset(); remove.mockClear(); isNative.mockReturnValue(true); addListener.mockResolvedValue({ remove }); });

  it("registers a Capacitor backButton listener while mounted and removes it on dispose", async () => {
    const handler = vi.fn();
    const dispose = appLifecycle.onBackButton(handler);
    await flush();
    expect(addListener).toHaveBeenCalledWith("backButton", handler);
    dispose();
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it("removes a listener that resolves after an early dispose", async () => {
    const dispose = appLifecycle.onBackButton(() => {});
    dispose();
    await flush();
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it("is a no-op on the web", () => {
    isNative.mockReturnValue(false);
    appLifecycle.onBackButton(() => {})();
    expect(addListener).not.toHaveBeenCalled();
  });
});
