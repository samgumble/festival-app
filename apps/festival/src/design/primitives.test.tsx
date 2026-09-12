import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Badge, Button, buttonClasses, Card, Heart, SegmentedControl, Sheet, Toggle } from "./index";

describe("Heart", () => {
  it("exposes pressed state and calls onToggle", () => {
    const onToggle = vi.fn();
    render(<Heart on={false} onToggle={onToggle} label="Favorite Eggy, Friday 3:00 PM, Main Stage" />);
    const btn = screen.getByRole("button", { name: /favorite eggy/i });
    expect(btn).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(btn);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});

describe("SegmentedControl", () => {
  it("marks the selected option and reports changes", () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl label="Day" value="sat" onChange={onChange}
        options={[{ value: "fri", label: "Fri" }, { value: "sat", label: "Sat" }, { value: "sun", label: "Sun" }]} />,
    );
    expect(screen.getByRole("radio", { name: "Sat" })).toBeChecked();
    fireEvent.click(screen.getByRole("radio", { name: "Sun" }));
    expect(onChange).toHaveBeenCalledWith("sun");
  });
});

describe("Badge", () => {
  it("renders nothing for zero", () => {
    const { container } = render(<Badge count={0} />);
    expect(container).toBeEmptyDOMElement();
  });
  it("renders the count", () => {
    render(<Badge count={3} />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});

describe("Toggle", () => {
  it("is a switch", () => {
    const onChange = vi.fn();
    render(<Toggle on={true} onChange={onChange} label="Festival alerts" />);
    const sw = screen.getByRole("switch", { name: "Festival alerts" });
    expect(sw).toHaveAttribute("aria-checked", "true");
    fireEvent.click(sw);
    expect(onChange).toHaveBeenCalledWith(false);
  });
});

describe("Sheet", () => {
  it("closes on Escape and backdrop click", () => {
    const onClose = vi.fn();
    render(<Sheet onClose={onClose} title="Artist"><p>body</p></Sheet>);
    expect(screen.getByRole("dialog", { name: "Artist" })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.click(screen.getByTestId("sheet-backdrop"));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});

describe("Button", () => {
  it("renders as a native button with text", () => {
    render(<Button variant="sun">Remind me</Button>);
    expect(screen.getByRole("button", { name: "Remind me" })).toBeInTheDocument();
  });
});

describe("buttonClasses", () => {
  it("matches the classes Button renders", () => {
    render(<Button variant="sun" size="sm">X</Button>);
    expect(screen.getByRole("button", { name: "X" }).className).toBe(buttonClasses({ variant: "sun", size: "sm" }));
  });
});

describe("touch targets", () => {
  it("small controls carry a 44 px hit-area extension", () => {
    render(
      <>
        <Button size="sm">Small</Button>
        <SegmentedControl label="Day" value="a" onChange={() => {}} options={[{ value: "a", label: "A" }]} />
        <Toggle on={false} onChange={() => {}} label="Switch" />
      </>,
    );
    expect(screen.getByRole("button", { name: "Small" }).className).toMatch(/before:-inset-y-1\b/);
    expect(screen.getByRole("radio", { name: "A" }).className).toMatch(/before:-inset-y-0\.5\b/);
    expect(screen.getByRole("switch", { name: "Switch" }).className).toMatch(/before:-inset-y-2\b/);
    // class presence is a proxy for geometry — jsdom has no layout
    for (const el of [
      screen.getByRole("button", { name: "Small" }),
      screen.getByRole("radio", { name: "A" }),
      screen.getByRole("switch", { name: "Switch" }),
    ]) {
      expect(el.className).toMatch(/\brelative\b/);
      expect(el.className).toContain("before:content-['']");
    }
  });
});

describe("Card tint", () => {
  it("swaps the surface background for the severity wash", () => {
    const { container, rerender } = render(<Card tint="urgent">x</Card>);
    expect(container.firstElementChild!.className).toMatch(/bg-tint-urgent/);
    expect(container.firstElementChild!.className).not.toMatch(/bg-surface/);
    rerender(<Card>x</Card>);
    expect(container.firstElementChild!.className).toMatch(/bg-surface/);
  });
});
