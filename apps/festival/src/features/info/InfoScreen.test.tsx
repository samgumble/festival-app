import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderAt } from "@/test/render";
import { useUiStore } from "@/state/ui";

describe("Info", () => {
  it("shows festival facts, official links, settings and provenance", async () => {
    renderAt("/info");
    expect(await screen.findByText(/11:30 AM daily/)).toBeInTheDocument();
    expect(screen.getByText(/8,750 ft/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /tellurideblues.com/i })).toHaveAttribute("href", "https://www.tellurideblues.com");
    expect(screen.getByText(/Content v2026\.09\.09\.1 · bundled/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: "Dark" }));
    expect(useUiStore.getState().theme).toBe("dark");
  });

  it("inline privacy/licenses toggles carry a 44px hit area and reveal their panels", async () => {
    renderAt("/info");
    const privacy = await screen.findByRole("button", { name: "Privacy" });
    expect(privacy.className).toMatch(/before:-inset-y-\[13px\]/);
    fireEvent.click(privacy);
    expect(screen.getByText(/no accounts\. no analytics or ads/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Licenses" }));
    expect(screen.getByText("Michroma")).toBeInTheDocument();
  });
});
