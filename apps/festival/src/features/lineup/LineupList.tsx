import type { DayId } from "@bb/shared";
import { useNavigate } from "react-router";
import { Chip, Eyebrow } from "@/design";
import { useContent, useContentIndex } from "@/data/content";
import { groupByStage } from "@/domain/schedule";
import { SetRow } from "./SetRow";

export function LineupList({ dayId, now }: { dayId: DayId; now: Date }) {
  const content = useContent();
  const idx = useContentIndex();
  const navigate = useNavigate();
  const groups = groupByStage(idx.setsByDay[dayId], content.stages);
  const comedy = content.artists.filter((a) => a.tier === "comedy");
  return (
    <div>
      {groups.map((g) => (
        <section key={g.stage.id} data-testid={`stage-${g.stage.id}`} className="mt-4">
          <div className="flex items-center gap-2"><Chip tone={g.stage.color}>{g.stage.name}</Chip><div className="h-px flex-1 bg-hair" /></div>
          {g.sets.map((s) => (
            <SetRow key={s.id} set={s} artist={idx.artistsById.get(s.artistId)!} stage={g.stage} now={now} />
          ))}
        </section>
      ))}
      {comedy.length > 0 && (
        <section className="mt-4">
          <div className="flex items-center gap-2"><Chip tone="paper">Comedy</Chip><div className="h-px flex-1 bg-hair" /><Eyebrow>Times from SBG</Eyebrow></div>
          {comedy.map((a) => (
            <button key={a.id} type="button" onClick={() => navigate(`/lineup/artist/${a.id}`)} className="-mx-4 flex w-[calc(100%+2rem)] items-center border-b border-hair px-4 py-3 text-left text-[16px] font-semibold">{a.name}</button>
          ))}
        </section>
      )}
    </div>
  );
}
