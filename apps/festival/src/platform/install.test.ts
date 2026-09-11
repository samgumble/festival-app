import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { _resetInstallForTests, captureInstallPrompt, installMode, isIosSafari, isStandalone, useInstall } from "./install";

const IOS_SAFARI = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const IOS_CHROME = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/125.0 Mobile/15E148 Safari/604.1";
const ANDROID = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Mobile Safari/537.36";

function nav(userAgent: string, extra: Partial<Navigator> = {}): Navigator {
  return { userAgent, platform: "iPhone", maxTouchPoints: 5, ...extra } as Navigator;
}
function win(standalone: boolean): Window {
  return { matchMedia: () => ({ matches: standalone }) as MediaQueryList, navigator: {} as Navigator } as unknown as Window;
}

describe("install platform", () => {
  beforeEach(() => _resetInstallForTests());
  afterEach(() => vi.unstubAllGlobals());

  it("detects standalone via display-mode or navigator.standalone", () => {
    expect(isStandalone(win(true))).toBe(true);
    expect(isStandalone(win(false))).toBe(false);
    const legacy = { matchMedia: () => ({ matches: false }) as MediaQueryList, navigator: { standalone: true } } as unknown as Window;
    expect(isStandalone(legacy)).toBe(true);
  });

  it("detects iOS Safari but not iOS Chrome or Android", () => {
    expect(isIosSafari(nav(IOS_SAFARI))).toBe(true);
    expect(isIosSafari(nav(IOS_CHROME))).toBe(false);
    expect(isIosSafari(nav(ANDROID, { platform: "Linux armv8l" }))).toBe(false);
    expect(isIosSafari(nav("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.5 Safari/605.1.15", { platform: "MacIntel", maxTouchPoints: 5 }))).toBe(true);
  });

  it("mode is none by default, prompt after beforeinstallprompt, installed when standalone", () => {
    vi.stubGlobal("navigator", nav(ANDROID, { platform: "Linux armv8l" }));
    expect(installMode()).toBe("none");
    const target = new EventTarget() as unknown as Window;
    captureInstallPrompt(target);
    const ev = Object.assign(new Event("beforeinstallprompt", { cancelable: true }), { prompt: vi.fn(async () => {}), userChoice: Promise.resolve({ outcome: "accepted" as const }) });
    target.dispatchEvent(ev);
    expect(installMode()).toBe("prompt");
    expect(ev.defaultPrevented).toBe(true);
    vi.stubGlobal("matchMedia", () => ({ matches: true }) as MediaQueryList);
    expect(installMode()).toBe("installed");
  });

  it("useInstall re-renders on capture and prompt() consumes the event", async () => {
    vi.stubGlobal("navigator", nav(ANDROID, { platform: "Linux armv8l" }));
    const target = new EventTarget() as unknown as Window;
    captureInstallPrompt(target);
    const { result } = renderHook(() => useInstall());
    expect(result.current.mode).toBe("none");
    const prompt = vi.fn(async () => {});
    act(() => { target.dispatchEvent(Object.assign(new Event("beforeinstallprompt", { cancelable: true }), { prompt, userChoice: Promise.resolve({ outcome: "dismissed" as const }) })); });
    expect(result.current.mode).toBe("prompt");
    await act(() => result.current.prompt());
    expect(prompt).toHaveBeenCalledTimes(1);
    expect(result.current.mode).toBe("none");
  });

  it("picks up an event that fired before the hook subscribed", () => {
    vi.stubGlobal("navigator", nav(ANDROID, { platform: "Linux armv8l" }));
    const target = new EventTarget() as unknown as Window;
    captureInstallPrompt(target);
    target.dispatchEvent(Object.assign(new Event("beforeinstallprompt", { cancelable: true }), { prompt: vi.fn(async () => {}), userChoice: Promise.resolve({ outcome: "accepted" as const }) }));
    const { result } = renderHook(() => useInstall());
    expect(result.current.mode).toBe("prompt");
  });

  it("mode is none inside the native shell", () => {
    (globalThis as { Capacitor?: unknown }).Capacitor = { isNativePlatform: () => true, getPlatform: () => "ios" };
    try { expect(installMode()).toBe("none"); } finally { delete (globalThis as { Capacitor?: unknown }).Capacitor; }
  });
});
