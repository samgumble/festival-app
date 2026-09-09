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

  it("lists alerts newest first with severity labels and an opt-in card", async () => {
    renderAt("/alerts");
    const titles = (await screen.findAllByTestId("alert-title")).map((n) => n.textContent);
    expect(titles[0]).toMatch(/Lightning hold/);
    expect(titles.at(-1)).toMatch(/Gates open at 11:30/);
    expect(screen.getByText("Urgent")).toBeInTheDocument();
    expect(screen.getByText(/get alerts on your lock screen/i)).toBeInTheDocument();
  });

  it("expanding an alert marks it read; the opt-in card hides once enabled", async () => {
    renderAt("/alerts");
    fireEvent.click((await screen.findAllByTestId("alert-title"))[1]!);
    expect(useAlertsStore.getState().readIds).toEqual(["fx-004"]);
    fireEvent.click(screen.getByRole("button", { name: /enable/i }));
    expect(screen.queryByText(/get alerts on your lock screen/i)).toBeNull();
  });

  it("deep link opens and reads the alert", async () => {
    renderAt("/alerts/fx-003");
    expect(await screen.findByText(/bring your glass/i)).toBeInTheDocument();
    expect(useAlertsStore.getState().readIds).toEqual(["fx-003"]);
  });

  it("hides alerts from the future and shows the quiet state", async () => {
    useUiStore.setState({ devNow: "2026-09-17T18:00:00-06:00" });
    renderAt("/alerts");
    expect(await screen.findByText(/all quiet in town park/i)).toBeInTheDocument();
  });
});
