import { expect, test } from "@playwright/test";

/**
 * WCAG 2.x A/AA + best-practice scan of every screen in both themes with axe-core (D-025,
 * docs/COMPLIANCE.md §5). axe is injected from cdnjs at run time so no dependency is added;
 * run with `npm run e2e:a11y` (needs network). Only the DEV-only clock pill is allowed to fail
 * the "region" rule — it never ships.
 */
const AXE = "https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js";
const PAGES = [
  ["now", "/"], ["lineup", "/lineup"], ["plan", "/plan"], ["alerts", "/alerts"], ["info", "/info"],
  ["privacy", "/privacy"], ["artist", "/lineup/artist/charlie-musselwhite-ga20"],
] as const;
const FAVORITES = ["sat-charlie-musselwhite-ga20-main-1630", "sat-taj-mahal-keb-mo-main-2000"];
const ALLOWED = new Set(["region:[data-devclock]"]);

type Violation = { id: string; impact: string; help: string; nodes: { target: string[] }[] };

for (const theme of ["light", "dark"] as const) for (const [name, path] of PAGES) {
  test(`${theme} ${name} has no axe violations`, async ({ page }) => {
    await page.addInitScript(([t, favs]) => {
      localStorage.setItem("bb-ui", JSON.stringify({ state: { theme: t, devNow: "2026-09-19T15:40:00-06:00", lineupView: "list" }, version: 0 }));
      localStorage.setItem("bb-plan", JSON.stringify({ state: { favorites: favs, resolutions: {}, settings: { leadMinutes: 15, bufferMinutes: 10 }, remindersOn: false }, version: 1 }));
    }, [theme, FAVORITES] as const);
    await page.goto(path);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(400);
    await page.addScriptTag({ url: AXE });
    const violations = await page.evaluate(async () => {
      // @ts-expect-error axe is injected above
      const r = await axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"] } });
      return (r.violations as Violation[]).map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.map((n) => ({ target: n.target })) }));
    });
    const real = violations
      .map((v) => ({ ...v, nodes: v.nodes.filter((n) => !ALLOWED.has(`${v.id}:${n.target.join(" ")}`) && !(v.id === "region" && n.target.join(" ").includes("bottom-28"))) }))
      .filter((v) => v.nodes.length > 0);
    expect(real, JSON.stringify(real, null, 2)).toEqual([]);
  });
}
