import type { FestivalSet } from "@bb/shared";
import { Link } from "react-router";
import { useContent, useContentIndex } from "@/data/content";
import { detectConflicts, type Conflict } from "@/domain/conflicts";
import { placeOf } from "@/domain/place";
import { gridLanes, isEnded, shortVenue } from "@/domain/schedule";
import { formatRange, formatTime, parseIso } from "@/domain/time";
import { gridLayout } from "@/features/lineup/LineupGrid";
import { usePlanStore } from "@/state/plan";

const PX_PER_HOUR = 72;
const HEADER_H = 44;
const COL_MIN = 112; // columns never squeeze below this; the day scrolls sideways instead

/** Column title: the stage's full name without a sponsor tail ("Truck Stage by Sierra Nevada®" → "Truck Stage"), or the venue. Two-word titles break onto two rows. */
function columnTitle(col: { key: string; label: string; stage: { id: string; name: string } }): string {
  const raw = col.key === col.stage.id ? col.stage.name.replace(/\s+by\s.*$/u, "") : shortVenue(col.label);
  const words = raw.split(" ");
  return words.length === 2 ? words.join("\n") : raw;
}
const STAGE_BG = { sky: "bg-sky text-ink", plum: "bg-plum text-white", pine: "bg-pine text-white", violet: "bg-violet text-white", amber: "bg-amber text-ink", bloom: "bg-bloom text-ink", leaf: "bg-leaf text-ink", "sun-hot": "bg-sun-hot text-ink" } as const;

/**
 * The day as a calendar: time runs down the page, one column per stage that holds a favorite
 * (in the lineup grid's stage order; Juke Joint and special-event columns are named by venue), blocks sized to their real duration so overlapping picks
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
  const columns = gridLanes(sets, content.stages, "always");
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
        <div className="min-w-0 flex-1 overflow-x-auto">
        <div className="grid" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(${COL_MIN}px, 1fr))`, minWidth: columns.length * COL_MIN }}>
          {columns.map((col) => (
            <div key={col.key} data-testid={`plan-col-${col.key}`} className="min-w-0 border-l border-hair first:border-l-0">
              <div style={{ height: HEADER_H }} data-testid={`plan-col-title-${col.key}`} className={`micro flex items-center justify-center whitespace-pre-line border-b border-hair px-1 text-center font-bold leading-3 ${STAGE_BG[col.stage.color]}`}>{columnTitle(col)}</div>
              <div className="relative" style={{ height: bodyH, ...hourLines }}>
                {col.sets.map((s) => {
                  const artist = idx.artistsById.get(s.artistId)!;
                  const own = idx.stagesById.get(s.stageId) ?? col.stage;
                  const conflict = conflictOf(s.id);
                  const other = conflict ? (conflict.a.id === s.id ? conflict.b : conflict.a) : undefined;
                  const otherName = other ? idx.artistsById.get(other.artistId)?.name : undefined;
                  const top = g.left(s) + 2, height = Math.max(24, g.width(s)); // centred in its slot: 2px above and below
                  return (
                    <Link key={s.id} to={`/lineup/artist/${artist.id}`} data-testid="plan-block" data-conflict={conflict ? "true" : undefined} style={{ top, height }}
                      className={`absolute inset-x-1.5 block overflow-hidden rounded-[10px] px-1.5 py-1 text-left ${STAGE_BG[own.color]} ${conflict ? "outline outline-2 -outline-offset-2 outline-ember" : ""} ${isEnded(s, now) ? "saturate-50" : ""}`}>
                      <span className={`line-clamp-2 text-[12px] leading-[14px] ${artist.tier === "headliner" ? "font-display" : "font-semibold"}`}>{conflict ? "⚠ " : ""}{artist.name}</span>
                      <span className="block text-[10px] leading-3 tabular-nums">{formatRange(parseIso(s.start), parseIso(s.end))}</span>
                      {s.venue && col.key === col.stage.id && <span className="block truncate text-[10px] leading-3">{placeOf(s, col.stage)}</span>}
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
    </div>
  );
}
