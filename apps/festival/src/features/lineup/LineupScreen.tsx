import { Outlet, useNavigate } from "react-router";
import { SegmentedControl } from "@/design";
import { useContent, useContentIndex } from "@/data/content";
import { searchArtists } from "@/domain/schedule";
import { LineupList } from "./LineupList";
import { LineupGrid } from "./LineupGrid";
import { SetRow } from "./SetRow";
import { useLineupState } from "./useLineupState";

export function LineupScreen() {
  const { now, day, setDay, view, setView, query, setQuery } = useLineupState();
  const content = useContent();
  const idx = useContentIndex();
  const navigate = useNavigate();
  const searching = query.trim().length > 0;
  const hits = searching ? searchArtists(content.artists, query) : [];
  return (
    <div className="pt-3">
      <h1 className="font-display text-[32px] leading-9 text-structure-2">Lineup</h1>
      <div className="mt-2 flex items-center gap-2">
        <SegmentedControl label="Day" value={day} onChange={setDay} options={content.festival.days.map((d) => ({ value: d.id, label: d.label.slice(0, 3) }))} />
        <div className="flex-1" />
        <SegmentedControl label="View" value={view} onChange={setView} options={[{ value: "list", label: "List" }, { value: "grid", label: "Grid" }]} />
      </div>
      <input type="search" role="searchbox" aria-label="Search artists" placeholder="Search artists" value={query} onChange={(e) => setQuery(e.target.value)}
        className="mt-2.5 h-11 w-full rounded-ctl border border-hair bg-surface px-3 text-[15px] placeholder:text-fg-soft" />
      {searching ? (
        <div className="mt-2">
          {hits.length === 0 && <p className="py-6 text-center text-fg-soft">No artists match “{query}”.</p>}
          {hits.map((a) => {
            const sets = idx.setsByArtist.get(a.id) ?? [];
            if (sets.length === 0) {
              return (
                <button key={a.id} type="button" onClick={() => navigate(`/lineup/artist/${a.id}`)} className="-mx-4 flex w-[calc(100%+2rem)] items-center border-b border-hair px-4 py-3 text-left text-[16px] font-semibold">{a.name}</button>
              );
            }
            return sets.map((s) => (
              <SetRow key={s.id} set={s} artist={a} stage={idx.stagesById.get(s.stageId)!} now={now} showStage dayLabel={content.festival.days.find((d) => d.id === s.dayId)?.label.slice(0, 3)} />
            ));
          })}
        </div>
      ) : view === "list" ? (
        <LineupList dayId={day} now={now} />
      ) : (
        <LineupGrid dayId={day} now={now} />
      )}
      <Outlet />
    </div>
  );
}
