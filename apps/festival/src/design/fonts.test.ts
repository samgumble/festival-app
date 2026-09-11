import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(__dirname, "fonts.css"), "utf8");

describe("fonts.css", () => {
  it("references only WOFF2 files", () => {
    const urls = [...css.matchAll(/url\("([^"]+)"\)/g)].map((m) => m[1]);
    expect(urls.length).toBe(5);
    for (const u of urls) expect(u).toMatch(/\.woff2$/);
    expect(css).not.toMatch(/\.ttf|truetype/);
  });
});
