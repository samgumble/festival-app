import { useEffect, useState } from "react";
import { useMatch, useNavigate } from "react-router";
import type { Alert } from "@bb/shared";
import { Button, buttonClasses, Card, Chip, Eyebrow } from "@/design";
import { useFestivalClock } from "@/app/clock";
import { useAlerts } from "@/data/alerts";
import { formatTime, isoMs, parseIso, toDenverParts } from "@/domain/time";
import { useAlertsStore } from "@/state/alerts";

const SEV = {
  info: { tone: "sky" as const, label: "Info" },
  important: { tone: "sun" as const, label: "Important" },
  urgent: { tone: "ember" as const, label: "Urgent" },
};

function AlertCard({ alert, expanded, unread, onToggle }: { alert: Alert; expanded: boolean; unread: boolean; onToggle: () => void }) {
  const sev = SEV[alert.severity];
  return (
    <Card tint={alert.severity}>
      {/* min-h-11 keeps the expand control at the 44 px tap floor even for one-line titles */}
      <button type="button" onClick={onToggle} aria-expanded={expanded} className="flex min-h-11 w-full items-center gap-2 text-left">
        {unread && <span aria-label="Unread" className="h-2 w-2 shrink-0 rounded-chip bg-ember" />}
        <b data-testid="alert-title" className="min-w-0 flex-1 text-[16px] leading-5">{alert.title}</b>
        <Eyebrow>{formatTime(parseIso(alert.publishedAt))}</Eyebrow>
      </button>
      <div className="mt-2">
        <Chip tone={sev.tone}>{sev.label}</Chip>
      </div>
      {expanded && (
        <div className="mt-2">
          <p className="text-[15px] leading-5 text-fg-soft">{alert.body}</p>
          {alert.url && <a href={alert.url} target="_blank" rel="noreferrer" className={buttonClasses({ size: "sm", className: "mt-2" })}>Details ↗</a>}
        </div>
      )}
    </Card>
  );
}

export function AlertsScreen() {
  const { now } = useFestivalClock();
  const navigate = useNavigate();
  const match = useMatch("/alerts/:id");
  const routeId = match?.params.id ?? null;
  const all = useAlerts().filter((a) => isoMs(a.publishedAt) <= now.getTime());
  const { readIds, pushOptIn, markRead, setPushOptIn } = useAlertsStore();
  const [expandedId, setExpandedId] = useState<string | null>(routeId);
  useEffect(() => { if (routeId) { setExpandedId(routeId); markRead(routeId); } }, [routeId, markRead]);
  const toggle = (id: string) => {
    const next = expandedId === id ? null : id;
    setExpandedId(next);
    if (next) markRead(next);
    if (routeId && next !== routeId) navigate("/alerts", { replace: true });
  };
  const todayKey = toDenverParts(now).dateKey;
  const groups = new Map<string, Alert[]>();
  for (const a of all) {
    const p = toDenverParts(parseIso(a.publishedAt));
    const key = p.dateKey === todayKey ? "Today" : `${p.weekday}`;
    groups.set(key, [...(groups.get(key) ?? []), a]);
  }
  const latest = all[0];
  return (
    <div className="pt-3">
      <h1 className="font-display text-[32px] leading-9 text-structure-2">Alerts</h1>
      <Eyebrow>From the festival{latest ? ` · updated ${formatTime(parseIso(latest.publishedAt))}` : ""}</Eyebrow>
      {!pushOptIn && (
        <Card className="mt-3.5 flex items-center gap-3 bg-gradient-to-br from-surface to-sky/10">
          <div className="min-w-0 flex-1"><div className="text-[15px] font-semibold leading-5">Get alerts on your lock screen</div><div className="text-[13px] text-fg-soft">Weather holds, schedule changes, gate news.</div></div>
          <Button variant="ink" size="sm" onClick={() => setPushOptIn(true)}>Enable</Button>
        </Card>
      )}
      {all.length === 0 && (
        <Card className="mt-6 py-8 text-center"><p className="text-[14px] text-fg-soft">Festival updates will appear here.</p></Card>
      )}
      {[...groups.entries()].map(([label, items]) => (
        <section key={label} className="mt-4">
          <Eyebrow tone="structure">{label} · {items.length} alert{items.length > 1 ? "s" : ""}</Eyebrow>
          <div className="mt-1.5 space-y-2.5">
            {items.map((a) => <AlertCard key={a.id} alert={a} expanded={expandedId === a.id} unread={!readIds.includes(a.id)} onToggle={() => toggle(a.id)} />)}
          </div>
        </section>
      ))}
      <p className="mt-6 text-center text-[12px] text-fg-soft">Push notifications arrive with the native app. Until then, this inbox is the source.</p>
    </div>
  );
}
