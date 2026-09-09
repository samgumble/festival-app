import { Link } from "react-router";
import { Button, Card, Chip, Eyebrow } from "@/design";
import { activeUrgent, useAlerts } from "@/data/alerts";
import { useContent, useContentIndex } from "@/data/content";
import { nextUp } from "@/domain/conflicts";
import { nowPlaying, upNext } from "@/domain/schedule";
import { formatRange, formatTime, minutesBetween, parseIso } from "@/domain/time";
import { usePlanStore } from "@/state/plan";
import type { DayId } from "@bb/shared";
import { Hero } from "./Hero";
import { SetCard } from "./SetCard";

export function NowLive({ now, dayId }: { now: Date; dayId: DayId | null }) {
  const content = useContent();
  const idx = useContentIndex();
  const alerts = useAlerts();
  const urgent = activeUrgent(alerts, now);
  const { favorites, resolutions, settings } = usePlanStore();
  const day = content.festival.days.find((d) => d.id === dayId) ?? content.festival.days[0]!;
  const dayIndex = content.festival.days.findIndex((d) => d.id === day.id) + 1;
  const todays = idx.setsByDay[day.id];
  const on = nowPlaying(todays, now);
  const next = upNext(todays, now, 2);
  const mine = favorites.map((id) => idx.setsById.get(id)).filter((s): s is NonNullable<typeof s> => !!s);
  const myNext = nextUp(mine, now, resolutions, settings.bufferMinutes);
  const pick = (setId: string) => ({ set: idx.setsById.get(setId)!, artist: idx.artistsById.get(idx.setsById.get(setId)!.artistId)!, stage: idx.stagesById.get(idx.setsById.get(setId)!.stageId)! });
  return (
    <>
      <Hero compact>
        <div className="absolute inset-x-3.5 bottom-2.5 flex items-end justify-between">
          <div><Eyebrow className="text-fg">{day.label} · Town Park</Eyebrow><div className="font-display text-[24px] leading-7">Day {dayIndex} of {content.festival.days.length}</div></div>
          <Chip tone="paper">Offline-ready ✓</Chip>
        </div>
      </Hero>
      {urgent && (
        <Link to={`/alerts/${urgent.id}`} className="mt-3 block">
          <Card className="border-l-[5px] border-l-ember py-2.5"><div className="flex items-center gap-2"><Chip tone="ember">Urgent</Chip><b className="min-w-0 flex-1 truncate text-[15px]">{urgent.title}</b><Eyebrow>{formatTime(parseIso(urgent.publishedAt))}</Eyebrow></div></Card>
        </Link>
      )}
      <div className="mt-4 flex items-baseline justify-between px-0.5"><Eyebrow tone="structure">On stage now</Eyebrow><Link to="/lineup" className="eyebrow text-fg-soft">Up next →</Link></div>
      <div className="mt-1.5 space-y-2">
        {on.length === 0 && <Card><div className="text-[15px] text-fg-soft">{next.length ? "Nothing on right now — next sets below." : `That's a wrap on ${day.label}. Thank you, Town Park.`}</div></Card>}
        {on.map((s) => { const p = pick(s.id); return <SetCard key={s.id} {...p} now={now} emphasis="now" />; })}
      </div>
      {next.length > 0 && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          {next.map((s) => { const p = pick(s.id); return (
            <Link key={s.id} to={`/lineup/artist/${p.artist.id}`}><Card className="h-full px-3 py-2.5"><Chip tone={p.stage.color}>{p.stage.shortName}</Chip><div className="mt-1.5 text-[14px] font-semibold leading-[18px]">{p.artist.name}</div><div className="text-[13px] text-fg-soft tabular-nums">{formatTime(parseIso(s.start))}</div></Card></Link>
          ); })}
        </div>
      )}
      <div className="mt-4 flex items-baseline justify-between px-0.5"><Eyebrow tone="plum">Your next set</Eyebrow><Link to="/plan" className="eyebrow text-fg-soft">My plan →</Link></div>
      <div className="mt-1.5">
        {myNext ? (() => { const p = pick(myNext.id); return (
          <Card className="flex items-center gap-3 border-plum">
            <Link to={`/lineup/artist/${p.artist.id}`} className="min-w-0 flex-1">
              <div className="text-[16px] font-semibold leading-5">{p.artist.name}</div>
              <div className="text-[13px] text-fg-soft tabular-nums">in {minutesBetween(now, parseIso(myNext.start))} min · {formatRange(parseIso(myNext.start), parseIso(myNext.end))} · {p.stage.name}</div>
            </Link>
            <Link to="/plan"><Button size="sm">Plan</Button></Link>
          </Card>
        ); })() : (
          <Link to="/lineup" className="block"><Card className="flex items-center gap-3"><div className="flex-1 text-[15px] text-fg-soft">No favorites yet — tap the heart on any set.</div><Button variant="sun" size="sm">Lineup</Button></Card></Link>
        )}
      </div>
    </>
  );
}
