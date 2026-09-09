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
});
