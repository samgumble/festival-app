import { describe, expect, it } from "vitest";
import { asset } from "./assets";

describe("asset", () => {
  it("joins the public path onto Vite's base without doubling slashes", () => {
    // vitest runs with BASE_URL "/"
    expect(asset("/art/sky.webp")).toBe("/art/sky.webp");
    expect(asset("art/sky.webp")).toBe("/art/sky.webp");
  });
});
