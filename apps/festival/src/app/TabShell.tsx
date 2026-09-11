import { useEffect } from "react";
import { Outlet, ScrollRestoration } from "react-router";
import { splash } from "@/platform/splash";
import { useApplyTheme } from "./theme";
import { TabBar } from "./TabBar";
import { DevClock } from "./DevClock";
import { UpdateBanner } from "./UpdateBanner";
import { useUpdateStore } from "@/state/updates";
import { useReminderSync } from "@/features/plan/useReminderSync";

export function TabShell() {
  useApplyTheme();
  useReminderSync();
  const needRefresh = useUpdateStore((s) => s.needRefresh);
  const dismissed = useUpdateStore((s) => s.dismissed);
  const bannerVisible = needRefresh && !dismissed;
  useEffect(() => {
    // DEV-only: `?update=1` forces the banner so screenshots can capture it.
    if (import.meta.env.DEV && new URLSearchParams(window.location.search).get("update") === "1") useUpdateStore.getState().setNeedRefresh();
  }, []);
  useEffect(() => { void splash.hide(); }, []);
  return (
    <div className="mx-auto min-h-dvh max-w-[480px]">
      <main className={`px-4 safe-t ${bannerVisible ? "pb-44" : "pb-28"}`}>
        <Outlet />
      </main>
      <UpdateBanner />
      <TabBar />
      {import.meta.env.DEV && <DevClock />}
      <ScrollRestoration getKey={(loc) => loc.pathname.split("/")[1] ?? ""} />
    </div>
  );
}
