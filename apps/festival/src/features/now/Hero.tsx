import { motion, useScroll, useTransform } from "motion/react";
import type { ReactNode } from "react";
import { Chip, RainbowArch, useMotionOk } from "@/design";

const LAYERS = [
  { src: "/art/sky.png", rate: 0.15, top: "0%" },
  { src: "/art/mountains-near.png", rate: 0.35, top: "38%" },
  { src: "/art/foreground.png", rate: 0.6, top: "62%" },
] as const;

/** Poster-crop parallax hero framed by the rainbow arch; official lockup on top. */
export function Hero({ compact = false, children }: { compact?: boolean; children?: ReactNode }) {
  const ok = useMotionOk();
  const { scrollY } = useScroll();
  const cap = 24;
  const y0 = useTransform(scrollY, [0, cap / LAYERS[0].rate], [0, ok ? cap : 0], { clamp: true });
  const y1 = useTransform(scrollY, [0, cap / LAYERS[1].rate], [0, ok ? cap : 0], { clamp: true });
  const y2 = useTransform(scrollY, [0, cap / LAYERS[2].rate], [0, ok ? cap : 0], { clamp: true });
  const ys = [y0, y1, y2];
  return (
    <div className={`relative overflow-hidden rounded-hero bg-night ${compact ? "h-[250px]" : "h-[420px]"}`}>
      {LAYERS.map((l, i) => (
        <motion.img key={l.src} src={l.src} alt="" aria-hidden="true" style={{ y: ys[i]!, top: l.top }}
          className="absolute left-1/2 w-[150%] max-w-none -translate-x-1/2 select-none" draggable={false} />
      ))}
      <RainbowArch />
      <img src="/art/lockup.png" alt="Telluride Blues & Brews Festival, September 18–20, 2026, Telluride, Colorado"
        className="absolute left-1/2 top-4 w-[74%] -translate-x-1/2 drop-shadow-[0_6px_14px_rgba(0,0,0,.35)]" />
      <div className="absolute inset-x-0 bottom-0 h-[58%] bg-gradient-to-b from-transparent to-bg to-[82%]" />
      <div className="absolute right-3 top-3"><Chip tone="sun">32nd annual</Chip></div>
      {children}
    </div>
  );
}
