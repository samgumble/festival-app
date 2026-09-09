import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { renderAt } from "@/test/render";
import { usePlanStore } from "@/state/plan";

describe("tab shell", () => {
  beforeEach(() => usePlanStore.setState({ favorites: [] }));

  it("renders five tabs and marks the current one", async () => {
    renderAt("/lineup");
    const nav = await screen.findByRole("navigation", { name: "Sections" });
    const links = nav.querySelectorAll("a");
    expect(links.length).toBe(5);
    expect(screen.getByRole("link", { name: /lineup/i })).toHaveAttribute("aria-current", "page");
  });

  it("shows the favorites count on the Plan tab", async () => {
    usePlanStore.setState({ favorites: ["a", "b", "c"] });
    renderAt("/");
    expect(await screen.findByText("3")).toBeInTheDocument();
  });
});
