import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderAt } from "@/test/render";
import { useUiStore } from "@/state/ui";
import { useUpdateStore } from "@/state/updates";
import type { InstallMode } from "@/platform/install";

const installMock = vi.hoisted(() => ({ mode: "none" as InstallMode, prompt: vi.fn(async () => {}) }));
vi.mock("@/platform/install", () => ({
  useInstall: () => ({ mode: installMock.mode, prompt: installMock.prompt }),
}));

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

describe("Info · get the app", () => {
  afterEach(() => { installMock.mode = "none"; installMock.prompt.mockClear(); useUpdateStore.getState().reset(); });

  it("hides the card when installed or unsupported", async () => {
    installMock.mode = "installed";
    renderAt("/info");
    await screen.findByText(/11:30 AM daily/);
    expect(screen.queryByText("Get the app")).not.toBeInTheDocument();
  });

  it("prompts on Chromium", async () => {
    installMock.mode = "prompt";
    renderAt("/info");
    fireEvent.click(await screen.findByRole("button", { name: "Add to Home Screen" }));
    expect(installMock.prompt).toHaveBeenCalledTimes(1);
  });

  it("opens the iOS steps sheet on Safari", async () => {
    installMock.mode = "ios";
    renderAt("/info");
    fireEvent.click(await screen.findByRole("button", { name: "Add to Home Screen" }));
    const dialog = screen.getByRole("dialog", { name: "Add to Home Screen" });
    expect(dialog).toHaveTextContent("Tap Share");
    expect(dialog).toHaveTextContent("Tap Add");
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("footer says offline-ready once the worker is active", async () => {
    renderAt("/info");
    expect(await screen.findByText(/app 0\.1\.0$/)).toBeInTheDocument();
    act(() => useUpdateStore.getState().setOfflineReady());
    expect(screen.getByText(/offline-ready ✓$/)).toBeInTheDocument();
  });
});
