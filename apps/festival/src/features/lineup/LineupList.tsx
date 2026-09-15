import type { DayId, FestivalSet, Stage } from "@bb/shared";
import { Chip } from "@/design";
import { useContent, useContentIndex } from "@/data/content";
import { groupByHostStage } from "@/domain/schedule";
import { SetRow } from "./SetRow";

export function LineupList({ dayId, now }: { dayId: DayId; now: Date }) {
  const content = useContent();
  const idx = useContentIndex();
  // comedy at the Blues Stage / Campground and the late Blues Stage Juke Joint show list under those stages
  const groups = groupByHostStage(idx.setsByDay[dayId], content.stages);
  // side tag: a set listed under a host stage shows its own stage; a comedian's set anywhere else (the
  // Juke Joint comedy nights) shows the Comedy tag
  const comedyStage = content.stages.find((st) => st.id === "comedy");
  const tagFor = (s: FestivalSet, host: Stage): Stage | undefined => {
    if (s.stageId !== host.id) return idx.stagesById.get(s.stageId);
    if (comedyStage && host.id !== comedyStage.id && idx.artistsById.get(s.artistId)?.tier === "comedy") return comedyStage;
    return undefined;
  };
  return (
    <div>
      {groups.map((g) => (
        <section key={g.stage.id} data-testid={`stage-${g.stage.id}`} className="mt-4">
          <div className="flex items-center gap-2"><Chip tone={g.stage.color}>{g.stage.name}</Chip><div className="h-px flex-1 bg-hair" /></div>
          {g.sets.map((s) => (
            <SetRow key={s.id} set={s} artist={idx.artistsById.get(s.artistId)!} stage={g.stage} now={now} tag={tagFor(s, g.stage)} />
          ))}
        </section>
      ))}
    </div>
  );
}
