import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { renderAt } from "@/test/render";
import { useAlertsStore } from "@/state/alerts";
import { useUiStore } from "@/state/ui";

// The fixture has five alerts; fx-005 is published at 3:22 PM on Sat Sep 19 (Denver).
describe("TabBar unread badge", () => {
  beforeEach(() => useAlertsStore.setState({ readIds: [] }));

  it("counts only alerts that have already gone out", async () => {
    useUiStore.setState({ devNow: "2026-09-19T15:00:00-06:00" });
    renderAt("/info");
    await screen.findByText(/11:30 AM daily/);
    expect(screen.getByRole("link", { name: /alerts/i })).toHaveTextContent("4");
  });

  it("includes a scheduled alert once its time passes", async () => {
    useUiStore.setState({ devNow: "2026-09-19T15:40:00-06:00" });
    renderAt("/info");
    await screen.findByText(/11:30 AM daily/);
    expect(screen.getByRole("link", { name: /alerts/i })).toHaveTextContent("5");
  });
});
