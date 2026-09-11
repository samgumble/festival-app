import { afterEach, describe, expect, it, vi } from "vitest";
import { runtime } from "./runtime";
import { haptics } from "./haptics";
import { statusBar } from "./statusBar";
import { splash } from "./splash";
import { share } from "./share";
import { notifications } from "./notifications";

describe("platform adapters on the web", () => {
  afterEach(() => vi.restoreAllMocks());

  it("runtime reports web", () => {
    expect(runtime.isNative()).toBe(false);
    expect(runtime.platform()).toBe("web");
  });

  it("haptics, statusBar and splash are no-ops that resolve", async () => {
    await expect(haptics.tap()).resolves.toBeUndefined();
    await expect(statusBar.apply("dark")).resolves.toBeUndefined();
    await expect(splash.hide()).resolves.toBeUndefined();
  });

  it("native adapter failures resolve instead of rejecting (haptics)", async () => {
    try {
      (globalThis as { Capacitor?: unknown }).Capacitor = { isNativePlatform: () => true, getPlatform: () => "ios" };
      await expect(haptics.tap()).resolves.toBeUndefined();
    } finally {
      delete (globalThis as { Capacitor?: unknown }).Capacitor;
    }
  });

  it("native adapter failures resolve instead of rejecting (statusBar)", async () => {
    try {
      (globalThis as { Capacitor?: unknown }).Capacitor = { isNativePlatform: () => true, getPlatform: () => "ios" };
      await expect(statusBar.apply("light")).resolves.toBeUndefined();
    } finally {
      delete (globalThis as { Capacitor?: unknown }).Capacitor;
    }
  });

  it("native adapter failures resolve instead of rejecting (splash)", async () => {
    try {
      (globalThis as { Capacitor?: unknown }).Capacitor = { isNativePlatform: () => true, getPlatform: () => "ios" };
      await expect(splash.hide()).resolves.toBeUndefined();
    } finally {
      delete (globalThis as { Capacitor?: unknown }).Capacitor;
    }
  });

  it("shareText prefers navigator.share and falls back to the clipboard", async () => {
    const nshare = vi.fn(async () => {});
    Object.defineProperty(navigator, "share", { value: nshare, configurable: true });
    await share.shareText("Plan", "hello");
    expect(nshare).toHaveBeenCalledWith({ title: "Plan", text: "hello" });
    Object.defineProperty(navigator, "share", { value: undefined, configurable: true });
    const write = vi.fn(async () => {});
    Object.defineProperty(navigator, "clipboard", { value: { writeText: write }, configurable: true });
    await share.shareText("Plan", "hello");
    expect(write).toHaveBeenCalledWith("hello");
  });

  it("shareFile downloads on the web", async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const url = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:x");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    await share.shareFile("plan.ics", "text/calendar", "BEGIN:VCALENDAR");
    expect(url).toHaveBeenCalled();
    expect(click).toHaveBeenCalledTimes(1);
  });

  it("notifications are unsupported and inert on the web", async () => {
    expect(notifications.isSupported()).toBe(false);
    await expect(notifications.permission()).resolves.toBe("denied");
    await expect(notifications.request()).resolves.toBe("denied");
    await expect(notifications.ensureExact()).resolves.toBe(true);
    await expect(notifications.pending()).resolves.toEqual([]);
    await expect(notifications.schedule([{ id: 1, setId: "a", title: "t", body: "b", at: 1 }])).resolves.toBeUndefined();
    await expect(notifications.cancel([1])).resolves.toBeUndefined();
    const off = notifications.onTap(() => {});
    expect(typeof off).toBe("function");
    off();
  });
});
