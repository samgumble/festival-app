import type { FestivalSet } from "@bb/shared";
import { Link } from "react-router";
import { Button, Chip, Toggle } from "@/design";
import { useContentIndex } from "@/data/content";
import { detectConflicts, lostSetIds, type Conflict } from "@/domain/conflicts";
import { isEnded } from "@/domain/schedule";
import { formatRange, formatTime, parseIso } from "@/domain/time";
import { usePlanStore } from "@/state/plan";

function SetCardRow({ set, lost, conflict, now, onSwap }: { set: FestivalSet; lost: boolean; conflict?: Conflict; now: Date; onSwap?: () => void }) {
  const idx = useContentIndex();
  const { reminders, toggleReminder, settings } = usePlanStore();
  const artist = idx.artistsById.get(set.artistId)!, stage = idx.stagesById.get(set.stageId)!;
  const ended = isEnded(set, now);
  const other = conflict ? (conflict.a.id === set.id ? conflict.b : conflict.a) : undefined;
  const otherName = other ? idx.artistsById.get(other.artistId)?.name : undefined;
  return (
    <div className={`mb-2.5 rounded-2xl border bg-surface px-3 py-2.5 shadow-card ${lost ? "border-dashed border-hair opacity-60" : conflict ? "border-ember shadow-[0_0_0_2px_rgba(212,69,47,.18)]" : "border-hair"} ${artist.tier === "headliner" && !lost ? "bg-gradient-to-r from-sun/20 to-surface" : ""} ${ended ? "opacity-60" : ""}`}>
      <div className="flex items-center gap-2">
        <Link to={`/lineup/artist/${artist.id}`} className="min-w-0 flex-1">
          <span className={`block truncate ${artist.tier === "headliner" ? "font-display text-[17px] leading-5" : "text-[16px] font-semibold leading-5"}`}>{artist.name}</span>
          <span className="block text-[13px] text-fg-soft tabular-nums">{stage.name} · {formatRange(parseIso(set.start), parseIso(set.end))}{ended ? " · ended" : ""}</span>
        </Link>
        {lost ? (
          <Button size="sm" onClick={onSwap}>Swap</Button>
        ) : (
          !ended && <Toggle on={reminders.includes(set.id)} onChange={() => toggleReminder(set.id)} label={`Remind me for ${artist.name}`} />
        )}
      </div>
      {conflict && !lost && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Chip tone="ember">⚠ {conflict.bufferOnly ? `Under ${settings.bufferMinutes} min gap` : `Overlaps ${conflict.overlapMinutes} min`}</Chip>
          <span className="text-[13px] text-fg-soft">with {otherName} — keeping {artist.name}</span>
        </div>
      )}
    </div>
  );
}

export function PlanTimeline({ sets, now }: { sets: FestivalSet[]; now: Date }) {
  const { resolutions, resolve, settings } = usePlanStore();
  const conflicts = detectConflicts(sets, settings.bufferMinutes);
  const lostIds = lostSetIds(conflicts, resolutions);
  const conflictsOf = (id: string) => conflicts.filter((c) => c.a.id === id || c.b.id === id);
  const other = (c: Conflict, id: string) => (c.a.id === id ? c.b : c.a);
  const rendered = new Set<string>();
  const rows: { lead: FestivalSet; leadConflict?: Conflict; lost: { set: FestivalSet; conflict: Conflict }[] }[] = [];
  for (const s of sets) {
    if (rendered.has(s.id)) continue;
    rendered.add(s.id);
    const mine = conflictsOf(s.id);
    if (lostIds.has(s.id)) {
      // orphan loser: every opponent is itself lost; show it dashed with Swap against the first conflict it lost
      rows.push({ lead: s, leadConflict: mine[0], lost: [] });
      continue;
    }
    const lost = mine
      .map((c) => ({ set: other(c, s.id), conflict: c }))
      .filter(({ set }) => lostIds.has(set.id) && !rendered.has(set.id));
    for (const l of lost) rendered.add(l.set.id);
    rows.push({ lead: s, leadConflict: mine[0], lost });
  }
  return (
    <div className="mt-4">
      {rows.map(({ lead, leadConflict, lost }) => {
        const leadLost = lostIds.has(lead.id);
        return (
          <div key={lead.id} className="relative grid grid-cols-[56px_1fr] gap-2.5">
            <div className="pt-3 text-[13px] font-semibold leading-4 text-fg-soft tabular-nums">{formatTime(parseIso(lead.start)).replace(" ", "\n")}</div>
            <span aria-hidden="true" className={`absolute left-[46px] top-4 h-2.5 w-2.5 rounded-chip border-2 border-surface ${leadConflict ? "bg-ember" : "bg-sky"}`} />
            <span aria-hidden="true" className="absolute -bottom-3 left-[50px] top-6 w-0.5 bg-hair" />
            <div>
              <SetCardRow set={lead} lost={leadLost} conflict={leadConflict} now={now}
                onSwap={leadLost && leadConflict ? () => resolve(leadConflict.key, lead.id) : undefined} />
              {lost.map(({ set, conflict }) => (
                <SetCardRow key={set.id} set={set} lost conflict={conflict} now={now} onSwap={() => resolve(conflict.key, set.id)} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
