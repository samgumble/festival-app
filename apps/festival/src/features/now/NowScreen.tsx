import { Link } from "react-router";
import { Card, Eyebrow } from "@/design";
import { activeUrgent, useAlerts } from "@/data/alerts";
import { useContent } from "@/data/content";
import { useFestivalClock } from "@/app/clock";
import { formatTime, isoMs, parseIso } from "@/domain/time";
import { NowLive } from "./NowLive";
import { NowPost } from "./NowPost";
import { NowPre } from "./NowPre";

export function NowScreen() {
  const { now, state, dayId } = useFestivalClock();
  const { festival } = useContent();
  const banner = activeUrgent(useAlerts(), now);
  const alerts = useAlerts().filter((a) => isoMs(a.publishedAt) <= now.getTime()).filter((a) => a.id !== banner?.id).slice(0, 2);
  return (
    <div className="pt-3">
      <h1 className="sr-only">Now</h1>
      {state === "pre" && <NowPre now={now} />}
      {state === "live" && <NowLive now={now} dayId={dayId} />}
      {state === "post" && <NowPost />}
      {alerts.length > 0 && (
        <>
          <div className="mt-5 flex items-baseline justify-between px-0.5"><Eyebrow tone="structure">Latest alerts</Eyebrow><Link to="/alerts" className="eyebrow text-fg-soft">All alerts →</Link></div>
          <div className="mt-1.5 space-y-2">
            {alerts.map((a) => (
              <Link key={a.id} to={`/alerts/${a.id}`} className="block"><Card tint={a.severity} className="py-2.5"><div className="flex items-center gap-2"><b className="min-w-0 flex-1 truncate text-[15px]">{a.title}</b><Eyebrow>{formatTime(parseIso(a.publishedAt))}</Eyebrow></div></Card></Link>
            ))}
          </div>
        </>
      )}
      <div className="mt-5 grid grid-cols-3 gap-2">
        {[["Site", festival.links.site], ["FAQ", festival.links.faq], ["Guide", festival.links.guide]].map(([label, href]) => (
          <a key={label} href={href} target="_blank" rel="noreferrer" className="rounded-ctl border border-hair bg-surface py-3 text-center text-[15px] font-semibold text-structure">{label} ↗</a>
        ))}
      </div>
    </div>
  );
}
