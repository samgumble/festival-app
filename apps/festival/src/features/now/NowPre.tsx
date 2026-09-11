import { Link } from "react-router";
import { buttonClasses, Card, Eyebrow, Heart } from "@/design";
import { useContentIndex, useContent } from "@/data/content";
import { gatesOpenAt, headliners } from "@/domain/schedule";
import { formatTime, parseIso } from "@/domain/time";
import { usePlanStore } from "@/state/plan";
import { Countdown } from "./Countdown";
import { Hero } from "./Hero";

export function NowPre({ now }: { now: Date }) {
  const content = useContent();
  const idx = useContentIndex();
  const favorites = usePlanStore((s) => s.favorites);
  const toggleFavorite = usePlanStore((s) => s.toggleFavorite);
  const first = content.festival.days[0]!;
  const gates = gatesOpenAt(first);
  return (
    <>
      <Hero />
      <Card className="mt-3 text-center">
        <Countdown msUntil={gates.getTime() - now.getTime()} gatesLine={`${first.label.slice(0, 3)} Sep ${Number(first.date.slice(8))} · ${formatTime(gates)} · ${content.festival.venue.replace("Telluride ", "")}`} />
      </Card>
      <div className="mt-4 flex items-baseline justify-between px-0.5">
        <Eyebrow tone="structure">Headliners</Eyebrow>
        <Link to="/lineup" className="eyebrow text-fg-soft">See lineup →</Link>
      </div>
      <div className="mt-2 space-y-2">
        {headliners(content.artists).map((a) => {
          const set = idx.setsByArtist.get(a.id)?.[0];
          const stage = set ? idx.stagesById.get(set.stageId) : undefined;
          return (
            <Card key={a.id} className="flex items-center gap-3">
              <Link to={`/lineup/artist/${a.id}`} className="min-w-0 flex-1">
                <div className="font-display text-[20px] leading-6">{a.name}</div>
                {set && stage && <div className="text-[15px] text-fg-soft tabular-nums">{content.festival.days.find((d) => d.id === set.dayId)?.label.slice(0, 3)} · {formatTime(parseIso(set.start))} · {stage.name}</div>}
              </Link>
              {set && <Heart on={favorites.includes(set.id)} onToggle={() => toggleFavorite(set.id)} label={`Favorite ${a.name}`} />}
            </Card>
          );
        })}
      </div>
      {favorites.length === 0 && (
        <Link to="/lineup" className={`mt-3 ${buttonClasses({ variant: "sun", full: true })}`}>Build your plan</Link>
      )}
    </>
  );
}
