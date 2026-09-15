import type { FestivalSet } from "@bb/shared";
import { Link } from "react-router";
import { Chip } from "@/design";
import { useContent, useContentIndex } from "@/data/content";
import { detectConflicts, type Conflict } from "@/domain/conflicts";
import { placeOf } from "@/domain/place";
import { groupByStage, isEnded } from "@/domain/schedule";
import { formatRange, formatTime, parseIso } from "@/domain/time";
import { gridLayout } from "@/features/lineup/LineupGrid";
import { usePlanStore } from "@/state/plan";

const PX_PER_HOUR = 72;
const HEADER_H = 36;
const STAGE_BG = { sky: "bg-sky text-white", plum: "bg-plum text-white", pine: "bg-pine text-white", violet: "bg-violet text-white", amber: "bg-amber text-ink", bloom: "bg-bloom text-ink", leaf: "bg-leaf text-ink", "sun-hot": "bg-sun-hot text-ink" } as const;

/**
 * The day as a calendar: time runs down the page, one column per stage that holds a favorite
 * (in the lineup grid's stage order), blocks sized to their real duration so overlapping picks
 * sit side by side. Overlapping picks are both outlined in ember with a warning mark; there is no
 * swap control (owner request 2026-09-14, replacing the braided list). Next-up and reminders still
 * follow the default choice (the earlier set).
 */
export function PlanGrid({ sets, now }: { sets: FestivalSet[]; now: Date }) {
  const content = useContent();
  const idx = useContentIndex();
  const { settings } = usePlanStore();
  const conflicts = detectConflicts(sets, settings.bufferMinutes);
  const conflictOf = (id: string): Conflict | undefined => conflicts.find((c) => c.a.id === id || c.b.id === id);
  const g = gridLayout(sets, PX_PER_HOUR);
  const columns = groupByStage(sets, content.stages);
  const bodyH = g.hours.length * PX_PER_HOUR;
  const nowMs = now.getTime();
  const showNow = nowMs >= g.startMs && nowMs <= g.endMs;
  const hourLines = { backgroundImage: `repeating-linear-gradient(to bottom, var(--hair) 0 1px, transparent 1px ${PX_PER_HOUR}px)` };
  return (
    <div className="mt-4 overflow-hidden rounded-card border border-hair bg-surface">
      <div className="flex">
        <div className="w-12 shrink-0 border-r border-hair">
          <div style={{ height: HEADER_H }} className="border-b border-hair" />
          <div className="relative" style={{ height: bodyH, ...hourLines }}>
            {g.hours.map((h, i) => (
              <div key={h.getTime()} className="absolute left-1 text-[10px] font-semibold leading-3 text-fg-soft tabular-nums" style={{ top: i * PX_PER_HOUR + 3 }}>{formatTime(h).replace(":00", "")}</div>
            ))}
          </div>
        </div>
        <div className="grid min-w-0 flex-1" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
          {columns.map((col) => (
            <div key={col.stage.id} data-testid={`plan-col-${col.stage.id}`} className="min-w-0 border-l border-hair first:border-l-0">
              <div style={{ height: HEADER_H }} className="flex items-center justify-center border-b border-hair px-1"><Chip tone={col.stage.color}>{col.stage.shortName}</Chip></div>
              <div className="relative" style={{ height: bodyH, ...hourLines }}>
                {col.sets.map((s) => {
                  const artist = idx.artistsById.get(s.artistId)!;
                  const conflict = conflictOf(s.id);
                  const other = conflict ? (conflict.a.id === s.id ? conflict.b : conflict.a) : undefined;
                  const otherName = other ? idx.artistsById.get(other.artistId)?.name : undefined;
                  const top = g.left(s), height = Math.max(24, g.width(s));
                  return (
                    <Link key={s.id} to={`/lineup/artist/${artist.id}`} data-testid="plan-block" data-conflict={conflict ? "true" : undefined} style={{ top, height }}
                      className={`absolute inset-x-1 block overflow-hidden rounded-[10px] px-1.5 py-1 text-left ${STAGE_BG[col.stage.color]} ${conflict ? "outline outline-2 -outline-offset-2 outline-ember" : ""} ${isEnded(s, now) ? "opacity-85" : ""}`}>
                      <span className={`line-clamp-2 text-[12px] leading-[14px] ${artist.tier === "headliner" ? "font-display" : "font-semibold"}`}>{conflict ? "⚠ " : ""}{artist.name}</span>
                      <span className="block text-[10px] leading-3 opacity-85 tabular-nums">{formatRange(parseIso(s.start), parseIso(s.end))}</span>
                      {s.venue && <span className="block truncate text-[10px] leading-3 opacity-85">{placeOf(s, col.stage)}</span>}
                      {conflict && <span className="sr-only">{conflict.bufferOnly ? `Under ${settings.bufferMinutes} min gap` : `Overlaps ${conflict.overlapMinutes} min`} with {otherName}</span>}
                    </Link>
                  );
                })}
                {showNow && <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 h-0.5 bg-sun" style={{ top: g.x(nowMs) }} />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
