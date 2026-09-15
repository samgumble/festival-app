import { asset } from "@/app/assets";

/**
 * Official lockup on the page background, then the poster art (the arch scene below the title) in its
 * own tile. Static by design: no parallax, no overlays, no chips on the art (owner requests 2026-09-12/14).
 */
export function Hero({ compact = false }: { compact?: boolean }) {
  return (
    <div>
      <img src={asset("/art/lockup.webp")} alt="Telluride Blues & Brews Festival, September 18–20, 2026, Telluride, Colorado"
        draggable={false} className="mx-auto block w-[88%] max-w-[360px] select-none" />
      <div className={`relative mt-3 overflow-hidden rounded-hero bg-night ${compact ? "h-[200px]" : "h-[300px]"}`}>
        <img src={asset("/art/poster-hero.webp")} alt="" aria-hidden="true" draggable={false}
          className="absolute inset-0 h-full w-full select-none object-cover object-top" />
      </div>
    </div>
  );
}
