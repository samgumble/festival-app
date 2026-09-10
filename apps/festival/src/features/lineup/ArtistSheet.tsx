import { useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import { Button, buttonClasses, Chip, Eyebrow, Heart, Sheet } from "@/design";
import { useFestivalClock } from "@/app/clock";
import { useContent, useContentIndex } from "@/data/content";
import { formatRange, formatTime, parseIso } from "@/domain/time";
import { usePlanStore } from "@/state/plan";

const TIER_LABEL = { headliner: "Headliner", featured: "Featured", lineup: "Lineup", comedy: "Comedy", musicmaker: "Music Maker Foundation" } as const;

export function ArtistSheet() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const onClose = useCallback(() => navigate("/lineup"), [navigate]);
  const { now } = useFestivalClock();
  const content = useContent();
  const idx = useContentIndex();
  const { favorites, toggleFavorite } = usePlanStore();
  const artist = idx.artistsById.get(id);
  if (!artist) return <Sheet onClose={onClose} title="Artist"><p className="py-6 text-center text-fg-soft">Artist not found.</p></Sheet>;
  const sets = idx.setsByArtist.get(artist.id) ?? [];
  const single = sets.length === 1 ? sets[0] : undefined;
  const inPlan = single ? favorites.includes(single.id) : false;
  const dayLabel = (dayId: string) => content.festival.days.find((d) => d.id === dayId)?.label.slice(0, 3) ?? dayId;
  const share = async () => {
    const lines = sets.map((s) => `${dayLabel(s.dayId)} ${formatRange(parseIso(s.start), parseIso(s.end))} · ${idx.stagesById.get(s.stageId)?.name}`);
    const text = `${artist.name} — ${content.festival.name}\n${lines.join("\n")}\n${content.festival.links.lineup}`;
    try {
      if (navigator.share) await navigator.share({ text }); else await navigator.clipboard?.writeText(text);
    } catch {
      /* user cancelled the share sheet, or clipboard unavailable */
    }
  };
  return (
    <Sheet onClose={onClose} title={artist.name}>
      <Eyebrow tone="structure">Artist</Eyebrow>
      <h2 className="mt-0.5 font-display text-[24px] leading-7">{artist.name}</h2>
      <div className="mt-1.5"><Chip tone={artist.tier === "headliner" ? "sun" : "paper"}>{TIER_LABEL[artist.tier]}</Chip></div>
      <div className="mt-2">
        {sets.length === 0 && <p className="py-4 text-[15px] text-fg-soft">Set times will be announced by the festival.</p>}
        {sets.map((s) => {
          const stage = idx.stagesById.get(s.stageId)!;
          const start = parseIso(s.start);
          return (
            <div key={s.id} className="flex items-center gap-3 border-b border-hair py-2.5 last:border-b-0">
              <span className="w-16 shrink-0 text-[14px] font-semibold text-fg-soft tabular-nums">{dayLabel(s.dayId)} {formatRange(start, parseIso(s.end)).split(" – ")[0]}</span>
              <span className="min-w-0 flex-1 text-[15px] font-semibold">{stage.name}<span className="block text-[13px] font-normal text-fg-soft tabular-nums">{formatRange(start, parseIso(s.end))}</span></span>
              <Chip tone={stage.color}>{stage.shortName}</Chip>
              <Heart on={favorites.includes(s.id)} onToggle={() => toggleFavorite(s.id)} label={`Favorite ${artist.name}, ${dayLabel(s.dayId)} ${formatRange(start, parseIso(s.end))}, ${stage.name}`} />
            </div>
          );
        })}
      </div>
      {single && (
        <div className="mt-3 flex items-center gap-2">
          <Button variant={inPlan ? "ghost" : "sun"} className="flex-1" onClick={() => toggleFavorite(single.id)}>{inPlan ? "✓ In your plan" : "Add to plan"}</Button>
        </div>
      )}
      <div className="mt-3 flex gap-2">
        <Button size="sm" onClick={share}>Share ↗</Button>
        <a className={buttonClasses({ size: "sm" })} href={content.festival.links.lineup} target="_blank" rel="noreferrer">Official lineup ↗</a>
      </div>
      <p className="mt-3 text-[12px] text-fg-soft">Times shown in Telluride (Mountain) time. Now: {formatTime(now)}</p>
    </Sheet>
  );
}
