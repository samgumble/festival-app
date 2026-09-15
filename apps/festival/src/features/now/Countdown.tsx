import { Eyebrow } from "@/design";

export function Countdown({ msUntil, gatesLine }: { msUntil: number; gatesLine: string }) {
  const totalHours = Math.max(0, Math.floor(msUntil / 3_600_000));
  const days = Math.floor(totalHours / 24), hours = totalHours % 24;
  return (
    <div className="text-center">
      <Eyebrow className="text-white!">Gates open in</Eyebrow>
      {/* two nowrap units inside a wrapping row: at 200% text size "16 hrs" drops to its own line instead of clipping */}
      <div className="flex flex-wrap items-start justify-center gap-x-2 font-display text-[56px] leading-none text-white tabular-nums" aria-label={`${days} days ${hours} hours`}>
        <span className="whitespace-nowrap">{days}<span className="font-display text-[24px] align-top ml-1">days</span></span>
        <span className="whitespace-nowrap">{String(hours).padStart(2, "0")}<span className="font-display text-[24px] align-top ml-1">hrs</span></span>
      </div>
      <Eyebrow className="mt-1 text-white!">{gatesLine}</Eyebrow>
    </div>
  );
}
