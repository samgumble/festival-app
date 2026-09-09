import type { Artist, FestivalSet, Stage } from "@bb/shared";
import { Link } from "react-router";
import { Card, Chip, Eyebrow, ProgressBar } from "@/design";
import { minutesLeft, progress } from "@/domain/schedule";
import { formatRange, formatTime, minutesBetween, parseIso } from "@/domain/time";

export function SetCard({ set, artist, stage, now, emphasis = "plain" }: {
  set: FestivalSet; artist: Artist; stage: Stage; now: Date; emphasis?: "now" | "next" | "plain";
}) {
  const start = parseIso(set.start), end = parseIso(set.end);
  const isHeadliner = artist.tier === "headliner";
  return (
    <Link to={`/lineup/artist/${artist.id}`} className="block">
      <Card className={emphasis === "next" ? "border-plum" : ""}>
        <div className="flex items-center gap-2">
          {emphasis === "now" && <Chip tone="sun">● Now</Chip>}
          <Chip tone={stage.color}>{stage.shortName}</Chip>
          <span className="ml-auto text-[14px] text-fg-soft tabular-nums">
            {emphasis === "now" ? `${minutesLeft(set, now)} min left` : emphasis === "next" ? `in ${minutesBetween(now, start)} min` : formatTime(start)}
          </span>
        </div>
        <div className={`mt-1.5 ${isHeadliner || emphasis === "now" ? "font-display text-[22px] leading-[26px]" : "text-[17px] font-semibold leading-6"}`}>{artist.name}</div>
        {emphasis === "now" ? (
          <div className="mt-2.5"><ProgressBar value={progress(set, now)} label={`${artist.name} set progress`} /></div>
        ) : (
          <Eyebrow className="mt-1 normal-case tracking-normal font-sans text-[13px]">{formatRange(start, end)} · {stage.name}</Eyebrow>
        )}
      </Card>
    </Link>
  );
}
