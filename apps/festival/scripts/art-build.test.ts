import { describe, expect, it } from "vitest";
import { ART_BUDGET_BYTES, checkBudget } from "./art-build";

describe("art budget", () => {
  it("sums sizes and passes under the budget", () => {
    expect(checkBudget({ "a.webp": 400_000, "b.webp": 500_000 })).toEqual({ total: 900_000, ok: true });
  });
  it("fails when the total exceeds the budget", () => {
    expect(checkBudget({ "a.webp": 800_000, "b.webp": 600_000 })).toEqual({ total: 1_400_000, ok: false });
  });
  it("accepts a custom budget and treats equality as ok", () => {
    expect(checkBudget({ "a.webp": 10 }, 10).ok).toBe(true);
    expect(ART_BUDGET_BYTES).toBe(1_300_000);
  });
});
