import { describe, expect, it, vi } from "vitest";
import { Content } from "@bb/shared";
import bundled from "./bundled.json";
import { applyContentSnapshot, applyAlertsSnapshot } from "./firestore-content";

const base = Content.parse(bundled);

describe("applyContentSnapshot", () => {
  it("replaces content when the snapshot validates and reports live/cache", () => {
    const next = { ...base, meta: { ...base.meta, contentVersion: "2026.09.10.1" } };
    const r = applyContentSnapshot({ current: base, status: { source: "bundled", contentVersion: base.meta.contentVersion, updatedAt: null } }, { exists: true, data: next, fromCache: false });
    expect(r.current.meta.contentVersion).toBe("2026.09.10.1");
    expect(r.status.source).toBe("live");
    const c = applyContentSnapshot(r, { exists: true, data: next, fromCache: true });
    expect(c.status.source).toBe("cache");
  });
  it("ignores an invalid snapshot and keeps the last good content", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const r = applyContentSnapshot({ current: base, status: { source: "bundled", contentVersion: base.meta.contentVersion, updatedAt: null } }, { exists: true, data: { meta: {} }, fromCache: false });
    expect(r.current).toBe(base);
    expect(r.status.source).toBe("bundled");
    warn.mockRestore();
  });
  it("ignores a missing document", () => {
    const r = applyContentSnapshot({ current: base, status: { source: "bundled", contentVersion: base.meta.contentVersion, updatedAt: null } }, { exists: false, data: undefined, fromCache: false });
    expect(r.current).toBe(base);
  });
});

describe("applyAlertsSnapshot", () => {
  const good = { id: "a1", title: "Gates open", body: "Welcome.", severity: "info", publishedAt: "2026-09-18T11:30:00-06:00", publishedBy: "sbg", push: false };
  it("keeps valid alerts newest first and drops invalid ones", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const list = applyAlertsSnapshot([
      { id: "a1", data: good },
      { id: "a2", data: { ...good, publishedAt: "2026-09-19T11:30:00-06:00" } },
      { id: "bad", data: { title: 1 } },
    ]);
    expect(list.map((a) => a.id)).toEqual(["a2", "a1"]);
    warn.mockRestore();
  });
});
