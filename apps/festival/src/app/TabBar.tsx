import { NavLink } from "react-router";
import { Badge, CheckerRibbon } from "@/design";
import { useAlerts } from "@/data/alerts";
import { useFestivalClock } from "./clock";
import { isoMs } from "@/domain/time";
import { useAlertsStore } from "@/state/alerts";
import { usePlanStore } from "@/state/plan";
import { IconAlerts, IconInfo, IconLineup, IconNow, IconPlan } from "./icons";

const TABS = [
  { to: "/", label: "Now", Icon: IconNow },
  { to: "/lineup", label: "Lineup", Icon: IconLineup },
  { to: "/plan", label: "Schedule", Icon: IconPlan },
  { to: "/alerts", label: "Alerts", Icon: IconAlerts },
  { to: "/info", label: "Info", Icon: IconInfo },
] as const;

export function TabBar() {
  const favorites = usePlanStore((s) => s.favorites.length);
  const readIds = useAlertsStore((s) => s.readIds);
  const { now } = useFestivalClock();
  // Scheduled alerts sit in Firestore with a future publishedAt; they don't count until they go out (D-026).
  const unread = useAlerts().filter((a) => isoMs(a.publishedAt) <= now.getTime() && !readIds.includes(a.id)).length;
  return (
    <nav aria-label="Sections" className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[480px]">
      <CheckerRibbon rows={2} />
      <div className="grid grid-cols-[1fr_1fr_auto_1fr_1fr] bg-surface px-1 pt-2 safe-b">
        {TABS.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => `relative grid min-h-14 min-w-0 place-items-center gap-1 micro ${to === "/plan" ? "px-1.5" : ""} ${isActive ? "text-sky" : "text-fg-soft"}`}>
            {({ isActive }) => (
              <>
                {to === "/plan" && <Badge count={favorites} tone="sun" />}
                {label === "Alerts" && <Badge count={unread} tone="ember" />}
                <Icon active={isActive} />
                <span className={`max-w-full truncate tracking-[0.02em] ${isActive ? "text-structure" : ""}`}>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
