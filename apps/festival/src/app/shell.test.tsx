import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { renderAt } from "@/test/render";
import { usePlanStore } from "@/state/plan";
import { useUpdateStore } from "@/state/updates";

describe("tab shell", () => {
  beforeEach(() => {
    usePlanStore.setState({ favorites: [] });
    useUpdateStore.getState().reset();
  });

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

  it("gives main extra bottom padding so the update banner never covers content", async () => {
    renderAt("/lineup");
    expect((await screen.findByRole("main")).className).toMatch(/pb-28/);
  });

  it("increases main's bottom padding while the update banner is showing", async () => {
    useUpdateStore.getState().setNeedRefresh();
    renderAt("/lineup");
    expect((await screen.findByRole("main")).className).toMatch(/pb-44/);
  });
});
