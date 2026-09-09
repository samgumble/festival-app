import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Butterfly, CheckerRibbon, Columbine, Mountains, RainbowArch, SunRays } from "./index";

describe("ornaments", () => {
  it("render as decorative (aria-hidden) elements", () => {
    const { container } = render(
      <div>
        <CheckerRibbon /><RainbowArch /><SunRays /><Columbine /><Mountains /><Butterfly />
      </div>,
    );
    const nodes = container.querySelectorAll("[aria-hidden='true']");
    expect(nodes.length).toBe(6);
  });

  it("SunRays spins only when asked", () => {
    const { container, rerender } = render(<SunRays />);
    expect(container.querySelector(".animate-rays")).not.toBeNull();
    rerender(<SunRays spinning={false} />);
    expect(container.querySelector(".animate-rays")).toBeNull();
  });

  it("RainbowArch scopes its pattern id per instance", () => {
    const { container } = render(<div><RainbowArch /><RainbowArch /></div>);
    const ids = [...container.querySelectorAll("pattern")].map((p) => p.id);
    expect(ids.length).toBe(2);
    expect(new Set(ids).size).toBe(2);
    const refs = [...container.querySelectorAll("path[stroke^='url(#']")].map((p) => p.getAttribute("stroke"));
    expect(refs).toEqual(ids.map((id) => `url(#${id})`));
  });

  it("Butterfly drifts only when asked", () => {
    const { container, rerender } = render(<Butterfly />);
    expect(container.querySelector(".animate-drift")).not.toBeNull();
    rerender(<Butterfly drifting={false} />);
    expect(container.querySelector(".animate-drift")).toBeNull();
  });
});
