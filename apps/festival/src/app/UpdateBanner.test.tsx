import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UpdateBanner } from "./UpdateBanner";
import { useUpdateStore } from "@/state/updates";

describe("UpdateBanner", () => {
  beforeEach(() => useUpdateStore.getState().reset());

  it("renders nothing until a refresh is needed", () => {
    render(<UpdateBanner />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("shows the copy, applies the update, and dismisses", async () => {
    const apply = vi.fn(async () => {});
    useUpdateStore.getState().setApply(apply);
    useUpdateStore.getState().setNeedRefresh();
    render(<UpdateBanner />);
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Update");
    expect(status).toHaveTextContent("A fresh festival guide is ready.");
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    expect(apply).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("dismiss button keeps a 44px hit area", () => {
    useUpdateStore.getState().setNeedRefresh();
    render(<UpdateBanner />);
    expect(screen.getByRole("button", { name: "Dismiss" }).className).toMatch(/h-11 w-11/);
  });
});
