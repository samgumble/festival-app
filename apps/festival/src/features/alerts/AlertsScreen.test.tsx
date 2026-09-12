import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { renderAt } from "@/test/render";
import { useUiStore } from "@/state/ui";
import { useAlertsStore } from "@/state/alerts";

describe("Alerts", () => {
  beforeEach(() => {
    useUiStore.setState({ devNow: "2026-09-19T15:40:00-06:00" });
    useAlertsStore.setState({ readIds: [], pushOptIn: false });
  });

  it("lists alerts newest first with severity labels", async () => {
    renderAt("/alerts");
    const titles = (await screen.findAllByTestId("alert-title")).map((n) => n.textContent);
    expect(titles[0]).toMatch(/Lightning hold/);
    expect(titles.at(-1)).toMatch(/Gates open at 11:30/);
    expect(screen.getByText("Urgent")).toBeInTheDocument();
  });

  it("expanding an alert marks it read", async () => {
    renderAt("/alerts");
    fireEvent.click((await screen.findAllByTestId("alert-title"))[1]!);
    expect(useAlertsStore.getState().readIds).toEqual(["fx-004"]);
  });

  it("deep link opens and reads the alert", async () => {
    renderAt("/alerts/fx-003");
    expect(await screen.findByText(/bring your glass/i)).toBeInTheDocument();
    expect(useAlertsStore.getState().readIds).toEqual(["fx-003"]);
  });

  it("hides alerts from the future and shows the quiet state", async () => {
    useUiStore.setState({ devNow: "2026-09-17T18:00:00-06:00" });
    renderAt("/alerts");
    expect(await screen.findByText(/Festival updates will appear here/)).toBeInTheDocument();
  });

  it("expand controls carry the 44px minimum height", async () => {
    renderAt("/alerts");
    const titles = await screen.findAllByTestId("alert-title");
    const btn = titles[0]!.closest("button")!;
    expect(btn.className).toMatch(/\bmin-h-11\b/);
  });
});
