import type { Artist, FestivalSet, Stage } from "@bb/shared";
import { useNavigate } from "react-router";
import { Chip, Heart } from "@/design";
import { isEnded, minutesLeft, nowPlaying } from "@/domain/schedule";
import { formatTime, parseIso } from "@/domain/time";
import { usePlanStore } from "@/state/plan";

export function SetRow({ set, artist, stage, now, showStage = false, dayLabel }: {
  set: FestivalSet; artist: Artist; stage: Stage; now: Date; showStage?: boolean; dayLabel?: string;
}) {
  const navigate = useNavigate();
  const on = usePlanStore((s) => s.favorites.includes(set.id));
  const toggle = usePlanStore((s) => s.toggleFavorite);
  const start = parseIso(set.start);
  const live = nowPlaying([set], now).length > 0;
  const ended = isEnded(set, now);
  const isHeadliner = artist.tier === "headliner";
  const sub = live ? `On now · ${minutesLeft(set, now)} min left` : ended ? "Ended" : artist.tier === "musicmaker" ? "Music Maker Foundation" : isHeadliner ? "Headliner" : showStage ? stage.name : undefined;
  return (
    <div className={`-mx-4 flex items-center gap-3 border-b border-hair px-4 py-2.5 ${live || isHeadliner ? "bg-gradient-to-r from-sun/20 to-transparent" : ""} ${ended ? "opacity-60" : ""}`}>
      <button type="button" onClick={() => navigate(`/lineup/artist/${artist.id}`)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <span className={`w-20 shrink-0 text-[14px] font-semibold leading-[18px] tabular-nums ${live ? "text-fg" : "text-fg-soft"}`}>{dayLabel ? `${dayLabel} ` : ""}{live ? "● " : ""}{formatTime(start)}</span>
        <span className="min-w-0 flex-1">
          <span className={`block truncate ${isHeadliner ? "font-display text-[17px] leading-5" : "text-[16px] font-semibold leading-5"}`}>{artist.name}</span>
          {sub && <span className="block text-[13px] text-fg-soft">{sub}</span>}
        </span>
        {showStage && <Chip tone={stage.color}>{stage.shortName}</Chip>}
      </button>
      <Heart on={on} onToggle={() => toggle(set.id)} label={`Favorite ${artist.name}, ${formatTime(start)}, ${stage.name}`} />
    </div>
  );
}
