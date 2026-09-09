import { NavLink } from "react-router";
import { Badge, CheckerRibbon } from "@/design";
import { useAlerts } from "@/data/alerts";
import { useAlertsStore } from "@/state/alerts";
import { usePlanStore } from "@/state/plan";
import { IconAlerts, IconInfo, IconLineup, IconNow, IconPlan } from "./icons";

const TABS = [
  { to: "/", label: "Now", Icon: IconNow },
  { to: "/lineup", label: "Lineup", Icon: IconLineup },
  { to: "/plan", label: "Plan", Icon: IconPlan },
  { to: "/alerts", label: "Alerts", Icon: IconAlerts },
  { to: "/info", label: "Info", Icon: IconInfo },
] as const;

export function TabBar() {
  const favorites = usePlanStore((s) => s.favorites.length);
  const readIds = useAlertsStore((s) => s.readIds);
  const unread = useAlerts().filter((a) => !readIds.includes(a.id)).length;
  return (
    <nav aria-label="Sections" className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[480px]">
      <CheckerRibbon rows={2} />
      <div className="grid grid-cols-5 bg-surface px-2 pt-2 safe-b">
        {TABS.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => `relative grid h-14 place-items-center gap-1 micro ${isActive ? "text-sky" : "text-fg-soft"}`}>
            {({ isActive }) => (
              <>
                {label === "Plan" && <Badge count={favorites} tone="sun" />}
                {label === "Alerts" && <Badge count={unread} tone="ember" />}
                <Icon active={isActive} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
