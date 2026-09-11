import { asset } from "@/app/assets";
import type { ReactNode } from "react";
import { Chip, RainbowArch } from "@/design";

const LAYERS = [
  { src: asset("/art/sky.webp"), top: "0%" },
  { src: asset("/art/mountains-near.webp"), top: "38%" },
  { src: asset("/art/foreground.webp"), top: "62%" },
] as const;

/** Poster-crop hero framed by the rainbow arch; official lockup on top. */
export function Hero({ compact = false, children }: { compact?: boolean; children?: ReactNode }) {
  return (
    <div className={`relative overflow-hidden rounded-hero bg-night ${compact ? "h-[250px]" : "h-[340px]"}`}>
      {LAYERS.map((l) => (
        <img key={l.src} src={l.src} alt="" aria-hidden="true" style={{ top: l.top }}
          className="absolute left-1/2 w-[150%] max-w-none -translate-x-1/2 select-none" draggable={false} />
      ))}
      <RainbowArch />
      <img src={asset("/art/lockup.webp")} alt="Telluride Blues & Brews Festival, September 18–20, 2026, Telluride, Colorado"
        className="absolute left-1/2 top-4 w-[74%] -translate-x-1/2 drop-shadow-[0_6px_14px_rgba(0,0,0,.35)]" />
      <div className="absolute inset-x-0 bottom-0 h-[58%] bg-gradient-to-b from-transparent to-bg to-[82%]" />
      <div className="absolute right-3 top-3"><Chip tone="sun">32nd annual</Chip></div>
      {children}
    </div>
  );
}
