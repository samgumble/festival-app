import { useState } from "react";
import { Link } from "react-router";
import { Button, Card, Chip, Eyebrow, SegmentedControl } from "@/design";
import { useFestivalClock } from "@/app/clock";
import { useContent, useContentIndex } from "@/data/content";
import { detectConflicts, leaveBy, nextUp } from "@/domain/conflicts";
import { planToIcs, planToText } from "@/domain/ics";
import { formatDuration, formatRange, formatTime, isoMs, minutesBetween, parseIso } from "@/domain/time";
import { usePlanStore } from "@/state/plan";
import type { DayId } from "@bb/shared";
import { share } from "@/platform/share";
import { PlanEmpty } from "./PlanEmpty";
import { PlanSettings } from "./PlanSettings";
import { PlanTimeline } from "./PlanTimeline";

export function PlanScreen() {
  const { now, state, dayId } = useFestivalClock();
  const content = useContent();
  const idx = useContentIndex();
  const { favorites, resolutions, settings } = usePlanStore();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const mine = favorites.map((id) => idx.setsById.get(id)).filter((s): s is NonNullable<typeof s> => !!s).sort((a, b) => isoMs(a.start) - isoMs(b.start));
  const firstDayWithSets = content.festival.days.find((d) => mine.some((s) => s.dayId === d.id))?.id ?? "fri";
  const [day, setDay] = useState<DayId>(state === "live" && dayId ? dayId : firstDayWithSets);
  const daySets = mine.filter((s) => s.dayId === day);
  const conflicts = detectConflicts(daySets, settings.bufferMinutes);
  const next = nextUp(mine, now, resolutions, settings.bufferMinutes);
  const title = (
    <div className="flex items-end justify-between pt-3">
      <h1 className="font-display text-[32px] leading-9 text-structure-2">My Plan</h1>
      <Button size="sm" aria-label="Plan settings" onClick={() => setSettingsOpen(true)}>⚙</Button>
    </div>
  );
  if (mine.length === 0) return <div>{title}<PlanEmpty />{settingsOpen && <PlanSettings onClose={() => setSettingsOpen(false)} />}</div>;
  const exportIcs = () => void share.shareFile("blues-and-brews-plan.ics", "text/calendar", planToIcs(mine, idx.artistsById, idx.stagesById, content.festival));
  const shareText = async () => {
    try { await share.shareText("My Blues & Brews plan", planToText(mine, idx.artistsById, idx.stagesById, content.festival)); }
    catch { /* user cancelled the share sheet */ }
  };
  return (
    <div>
      {title}
      <div className="mt-2 flex items-center gap-2">
        <SegmentedControl label="Day" value={day} onChange={setDay} options={content.festival.days.map((d) => ({ value: d.id, label: `${d.label.slice(0, 3)} ${mine.filter((s) => s.dayId === d.id).length}` }))} />
        <div className="flex-1" />
        {conflicts.length > 0 && <Chip tone="ember">{conflicts.length} conflict{conflicts.length > 1 ? "s" : ""}</Chip>}
      </div>
      {next && (
        <Card className="mt-3 border-plum bg-gradient-to-br from-surface to-violet/15">
          <Eyebrow tone="plum">Next up · {formatDuration(minutesBetween(now, parseIso(next.start)))}</Eyebrow>
          <Link to={`/lineup/artist/${next.artistId}`} className="mt-1 block font-display text-[20px] leading-6">{idx.artistsById.get(next.artistId)?.name}</Link>
          <div className="text-[13px] text-fg-soft tabular-nums">{formatRange(parseIso(next.start), parseIso(next.end))} · {idx.stagesById.get(next.stageId)?.name}{settings.bufferMinutes > 0 ? ` · leave by ${formatTime(leaveBy(next, settings.bufferMinutes))}` : ""}</div>
        </Card>
      )}
      {daySets.length === 0 ? <p className="mt-6 text-center text-fg-soft">Nothing planned for this day yet.</p> : <PlanTimeline sets={daySets} now={now} />}
      <div className="mt-2 flex gap-2"><Button size="sm" className="flex-1" onClick={exportIcs}>Add to calendar</Button><Button size="sm" className="flex-1" onClick={shareText}>Share as text</Button></div>
      {settingsOpen && <PlanSettings onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
