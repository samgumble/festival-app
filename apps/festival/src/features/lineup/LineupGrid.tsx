import { useEffect, useRef } from "react";
import type { DayId, FestivalSet } from "@bb/shared";
import { useNavigate } from "react-router";
import { Button, Eyebrow } from "@/design";
import { useContent, useContentIndex } from "@/data/content";
import { gridLanes, isEnded } from "@/domain/schedule";
import { formatTime, isoMs, parseIso } from "@/domain/time";
import { usePlanStore } from "@/state/plan";
import { placeOf } from "@/domain/place";

const HOUR = 3_600_000;
// Stage/venue label column: wide enough that the longest single word in any row label fits on one
// line (Michroma 9px caps ≈ 8.4px per character), so names wrap by word and the divider hugs them.
const LABEL_MIN = 70, LABEL_MAX = 112, CHAR_PX = 8.4;
function labelWidth(labels: string[]): number {
  const longestWord = Math.max(0, ...labels.flatMap((l) => l.split(/\s+/)).map((w) => w.length));
  return Math.min(LABEL_MAX, Math.max(LABEL_MIN, Math.ceil(longestWord * CHAR_PX) + 14));
}
// the timeline opens scrolled to noon (gates open 11:30) unless "now" falls on that day
const BLOCK_GAP = 4;

export function gridLayout(sets: FestivalSet[], pxPerHour: number) {
  if (sets.length === 0) return { startMs: 0, endMs: 0, hours: [] as Date[], left: () => 0, width: () => 0, x: () => 0 };
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

// block fill + text colour per stage: ink on the light fills (amber/bloom/leaf) for AA contrast
const STAGE_BG = { sky: "bg-sky text-white", plum: "bg-plum text-white", pine: "bg-pine text-white", violet: "bg-violet text-white", amber: "bg-amber text-ink", bloom: "bg-bloom text-ink", leaf: "bg-leaf text-ink", "sun-hot": "bg-sun-hot text-ink" } as const;

export function LineupGrid({ dayId, now }: { dayId: DayId; now: Date }) {
  const content = useContent();
  const idx = useContentIndex();
  const navigate = useNavigate();
  const favorites = usePlanStore((s) => s.favorites);
  const scroller = useRef<HTMLDivElement>(null);
  const pxPerHour = 72;
  const sets = idx.setsByDay[dayId];
  const g = gridLayout(sets, pxPerHour);
  const lanes = gridLanes(sets, content.stages);
  const nowMs = now.getTime();
  const showNow = nowMs >= g.startMs && nowMs <= g.endMs;
  const jump = () => scroller.current?.scrollTo?.({ left: Math.max(0, g.x(nowMs) - 120), behavior: "smooth" });
  const labelW = labelWidth(lanes.map((l) => l.label));
  // initial position: the current time when the festival is live on this day, otherwise noon (Denver)
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const noon = g.hours.find((h) => formatTime(h) === "12:00 PM");
    const target = showNow ? g.x(nowMs) - 120 : noon ? g.x(noon.getTime()) : 0;
    el.scrollLeft = Math.max(0, target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayId]);
  if (sets.length === 0) return <p className="mt-6 text-center text-fg-soft">No sets published for this day yet.</p>;
  return (
    <div className="mt-3">
      <div className="mb-2 flex items-center justify-between px-0.5">
        <Eyebrow tone="structure">Stage timeline · scroll →</Eyebrow>
        {showNow && <Button variant="sun" size="sm" onClick={jump}>● Jump to now</Button>}
      </div>
      <div className="flex overflow-hidden rounded-card border border-hair bg-surface">
        <div className="shrink-0" style={{ width: labelW }}>
          <div className="h-7 border-b border-hair" />
          {lanes.map((lane) => <div key={lane.key} data-testid={`lane-label-${lane.key}`} className="micro flex h-[72px] items-start whitespace-pre-line border-b border-r border-hair px-1.5 pt-2 text-fg-soft last:border-b-0">{lane.label}</div>)}
        </div>
        <div ref={scroller} className="relative flex-1 overflow-x-auto">
          <div className="relative" style={{ width: g.hours.length * pxPerHour }}>
            <div className="flex h-7 border-b border-hair text-[11px] font-semibold text-fg-soft">
              {g.hours.map((h) => <div key={h.getTime()} style={{ width: pxPerHour }} className="px-1 py-1.5 tabular-nums">{formatTime(h).replace(":00", "")}</div>)}
            </div>
            {lanes.map((grp) => (
              <div key={grp.key} data-testid={`lane-${grp.key}`} className="relative h-[72px] border-b border-hair last:border-b-0">
                {grp.sets.map((s) => {
                  const artist = idx.artistsById.get(s.artistId)!;
                  const fav = favorites.includes(s.id);
                  const time = formatTime(parseIso(s.start));
                  const width = g.width(s);
                  return (
                    <button key={s.id} type="button" data-favorite={fav} onClick={() => navigate(`/lineup/artist/${artist.id}`)}
                      aria-label={`${artist.name}, ${time}, ${placeOf(s, grp.stage)}`}
                      style={{ left: g.left(s), width }}
                      className={`absolute top-2 h-14 rounded-[10px] px-2 py-1 text-left text-[12px] font-semibold leading-[14px] ${STAGE_BG[grp.stage.color]} ${fav ? "outline outline-2 -outline-offset-2 outline-sun" : ""} ${isEnded(s, now) ? "opacity-85" : ""} ${width < 44 ? "before:absolute before:inset-y-0 before:-inset-x-1.5 before:content-['']" : ""}`}>
                      <span className="block h-full overflow-hidden">
                        <span className="line-clamp-2 break-words">{artist.name}</span>
                        <span className="block text-[10px] font-normal opacity-85 tabular-nums">{time}{fav ? " ♥" : ""}</span>
                      </span>
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
    </div>
  );
}
