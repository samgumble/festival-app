import { afterEach, describe, expect, it } from "vitest";
import { lockZoom } from "./zoom";

const g = globalThis as { Capacitor?: { isNativePlatform: () => boolean; getPlatform: () => string } };

describe("lockZoom", () => {
  afterEach(() => { delete g.Capacitor; });

  it("leaves the web build zoomable", () => {
    const meta = document.createElement("meta"); meta.name = "viewport"; meta.content = "width=device-width, initial-scale=1"; document.head.append(meta);
    lockZoom();
    expect(meta.content).toBe("width=device-width, initial-scale=1");
    meta.remove();
  });

  it("pins the scale and cancels pinch gestures on native", () => {
    g.Capacitor = { isNativePlatform: () => true, getPlatform: () => "ios" };
    const meta = document.createElement("meta"); meta.name = "viewport"; meta.content = "width=device-width, initial-scale=1"; document.head.append(meta);
    const undo = lockZoom();
    expect(meta.content).toContain("user-scalable=no");
    expect(document.documentElement.style.touchAction).toBe("pan-x pan-y");
    const ev = new Event("gesturestart", { cancelable: true });
    document.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(true);
    undo();
    expect(meta.content).toBe("width=device-width, initial-scale=1");
    meta.remove();
  });
});
