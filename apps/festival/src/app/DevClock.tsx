import { useUiStore } from "@/state/ui";
import { useFestivalClock } from "./clock";
import { formatTime, toDenverParts } from "@/domain/time";

const PRESETS: { label: string; iso: string | null }[] = [
  { label: "Real time", iso: null },
  { label: "Thu before", iso: "2026-09-17T18:00:00-06:00" },
  { label: "Fri gates", iso: "2026-09-18T11:30:00-06:00" },
  { label: "Sat 3:40 PM", iso: "2026-09-19T15:40:00-06:00" },
  { label: "Sun 9 PM", iso: "2026-09-20T21:00:00-06:00" },
  { label: "Mon after", iso: "2026-09-21T10:00:00-06:00" },
];

/** Dev-only. Lets Sam scrub the festival clock without editing env files. */
export function DevClock() {
  const devNow = useUiStore((s) => s.devNow);
  const setDevNow = useUiStore((s) => s.setDevNow);
  const { now, state } = useFestivalClock();
  const p = toDenverParts(now);
  return (
    <div data-devclock className="fixed bottom-28 right-3 z-30 flex items-center gap-2 rounded-chip border border-hair bg-surface px-3 py-1.5 text-[12px] shadow-card">
      <span className="tabular-nums">{p.weekday} {formatTime(now)} · {state}</span>
      <select aria-label="Festival clock" value={devNow ?? ""} onChange={(e) => setDevNow(e.target.value || null)} className="bg-transparent">
        {PRESETS.map((x) => <option key={x.label} value={x.iso ?? ""}>{x.label}</option>)}
      </select>
    </div>
  );
}
