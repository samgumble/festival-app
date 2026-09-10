import { describe, expect, it } from "vitest";
import { asset } from "./assets";

describe("asset", () => {
  it("joins the public path onto Vite's base without doubling slashes", () => {
    // vitest runs with BASE_URL "/"
    expect(asset("/art/sky.png")).toBe("/art/sky.png");
    expect(asset("art/sky.png")).toBe("/art/sky.png");
  });
});
