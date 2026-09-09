import { useRef } from "react";
import type { DayId, FestivalSet } from "@bb/shared";
import { useNavigate } from "react-router";
import { Button, Eyebrow } from "@/design";
import { useContent, useContentIndex } from "@/data/content";
import { groupByStage, isEnded } from "@/domain/schedule";
import { formatTime, isoMs, parseIso } from "@/domain/time";
import { usePlanStore } from "@/state/plan";

const HOUR = 3_600_000;
const LABEL_W = 70;
const BLOCK_GAP = 4;

export function gridLayout(sets: FestivalSet[], pxPerHour: number) {
  const starts = sets.map((s) => isoMs(s.start)), ends = sets.map((s) => isoMs(s.end));
  const first = Math.min(...starts), last = Math.max(...ends);
  const startMs = Math.floor(first / HOUR) * HOUR;
  const endMs = Math.ceil(last / HOUR) * HOUR;
  const hours: Date[] = [];
  for (let t = startMs; t < endMs; t += HOUR) hours.push(new Date(t));
  return {
    startMs, endMs, hours,
    left: (s: FestivalSet) => ((isoMs(s.start) - startMs) / HOUR) * pxPerHour,
    width: (s: FestivalSet) => ((isoMs(s.end) - isoMs(s.start)) / HOUR) * pxPerHour - BLOCK_GAP,
    x: (ms: number) => ((ms - startMs) / HOUR) * pxPerHour,
  };
}

const STAGE_BG = { sky: "bg-sky", plum: "bg-plum", pine: "bg-pine", violet: "bg-violet" } as const;

export function LineupGrid({ dayId, now }: { dayId: DayId; now: Date }) {
  const content = useContent();
  const idx = useContentIndex();
  const navigate = useNavigate();
  const favorites = usePlanStore((s) => s.favorites);
  const scroller = useRef<HTMLDivElement>(null);
  const pxPerHour = 72;
  const sets = idx.setsByDay[dayId];
  if (sets.length === 0) return <p className="mt-6 text-center text-fg-soft">No sets published for this day yet.</p>;
  const g = gridLayout(sets, pxPerHour);
  const groups = groupByStage(sets, content.stages);
  const nowMs = now.getTime();
  const showNow = nowMs >= g.startMs && nowMs <= g.endMs;
  const jump = () => scroller.current?.scrollTo?.({ left: Math.max(0, g.x(nowMs) - 120), behavior: "smooth" });
  return (
    <div className="mt-3">
      <div className="mb-2 flex items-center justify-between px-0.5">
        <Eyebrow tone="structure">Stage timeline · scroll →</Eyebrow>
        {showNow && <Button variant="sun" size="sm" onClick={jump}>● Jump to now</Button>}
      </div>
      <div className="flex overflow-hidden rounded-card border border-hair bg-surface">
        <div className="shrink-0" style={{ width: LABEL_W }}>
          <div className="h-7 border-b border-hair" />
          {groups.map((grp) => <div key={grp.stage.id} className="micro flex h-16 items-start border-b border-r border-hair px-1.5 pt-2 text-fg-soft last:border-b-0">{grp.stage.shortName}</div>)}
        </div>
        <div ref={scroller} className="relative flex-1 overflow-x-auto">
          <div className="relative" style={{ width: g.hours.length * pxPerHour }}>
            <div className="flex h-7 border-b border-hair text-[11px] font-semibold text-fg-soft">
              {g.hours.map((h) => <div key={h.getTime()} style={{ width: pxPerHour }} className="px-1 py-1.5 tabular-nums">{formatTime(h).replace(":00", "")}</div>)}
            </div>
            {groups.map((grp) => (
              <div key={grp.stage.id} data-testid={`lane-${grp.stage.id}`} className="relative h-16 border-b border-hair last:border-b-0">
                {grp.sets.map((s) => {
                  const artist = idx.artistsById.get(s.artistId)!;
                  const fav = favorites.includes(s.id);
                  return (
                    <button key={s.id} type="button" data-favorite={fav} onClick={() => navigate(`/lineup/artist/${artist.id}`)}
                      aria-label={`${artist.name}, ${formatTime(parseIso(s.start))}, ${grp.stage.name}`}
                      style={{ left: g.left(s), width: g.width(s) }}
                      className={`absolute top-2 h-12 overflow-hidden rounded-[10px] px-2 py-1 text-left text-[12px] font-semibold leading-[14px] text-white ${STAGE_BG[grp.stage.color]} ${fav ? "outline outline-2 -outline-offset-2 outline-sun" : ""} ${isEnded(s, now) ? "opacity-60" : ""}`}>
                      <span className="block truncate">{artist.name}</span>
                      <span className="block text-[10px] font-normal opacity-85 tabular-nums">{formatTime(parseIso(s.start))}{fav ? " ♥" : ""}</span>
                    </button>
                  );
                })}
              </div>
            ))}
            {showNow && (
              <div data-testid="now-line" aria-hidden="true" className="absolute bottom-0 top-7 w-0.5 bg-sun" style={{ left: g.x(nowMs) }}>
                <span className="absolute -left-[5px] -top-[5px] h-3 w-3 rounded-chip border-2 border-ink bg-sun" />
              </div>
            )}
          </div>
        </div>
      </div>
      <p className="mt-2 text-[13px] text-fg-soft">Favorited sets are rimmed in sun. Tap a block for the artist.</p>
    </div>
  );
}
