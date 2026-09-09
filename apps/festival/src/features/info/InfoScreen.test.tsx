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
    expect(screen.getByText(/Content v2026\.09\.09\.1/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: "Dark" }));
    expect(useUiStore.getState().theme).toBe("dark");
  });
});
