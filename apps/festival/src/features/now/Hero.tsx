import { asset } from "@/app/assets";
import type { ReactNode } from "react";
import { Chip } from "@/design";

/**
 * One cropped slice of the official 2026 poster (the arch scene, below the title) with the official
 * lockup on top. Static by design: no parallax, no layered crops (owner request, 2026-09-12).
 */
export function Hero({ compact = false, children }: { compact?: boolean; children?: ReactNode }) {
  return (
    <div className={`relative overflow-hidden rounded-hero bg-night ${compact ? "h-[250px]" : "h-[340px]"}`}>
      <img src={asset("/art/poster-hero.webp")} alt="" aria-hidden="true" draggable={false}
        className="absolute inset-0 h-full w-full select-none object-cover object-top" />
      <img src={asset("/art/lockup.webp")} alt="Telluride Blues & Brews Festival, September 18–20, 2026, Telluride, Colorado"
        className="absolute left-1/2 top-4 w-[74%] -translate-x-1/2 drop-shadow-[0_6px_14px_rgba(0,0,0,.35)]" />
      <div className="absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-b from-transparent to-bg to-[88%]" />
      <div className="absolute right-3 top-3"><Chip tone="sun">32nd annual</Chip></div>
      {children}
    </div>
  );
}
