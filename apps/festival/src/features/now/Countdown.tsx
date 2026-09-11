import { Eyebrow } from "@/design";

export function Countdown({ msUntil, gatesLine }: { msUntil: number; gatesLine: string }) {
  const totalHours = Math.max(0, Math.floor(msUntil / 3_600_000));
  const days = Math.floor(totalHours / 24), hours = totalHours % 24;
  return (
    <div className="text-center">
      <Eyebrow tone="structure">Gates open in</Eyebrow>
      <div className="font-shade text-[56px] leading-none text-structure tabular-nums" aria-label={`${days} days ${hours} hours`}>
        {days}<span className="font-shade text-[24px] align-top mx-1">days</span>{String(hours).padStart(2, "0")}<span className="font-shade text-[24px] align-top ml-1">hrs</span>
      </div>
      <Eyebrow className="mt-1">{gatesLine}</Eyebrow>
    </div>
  );
}
