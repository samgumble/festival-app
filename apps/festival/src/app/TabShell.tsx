import { useEffect } from "react";
import { Outlet, ScrollRestoration } from "react-router";
import { useApplyTheme } from "./theme";
import { TabBar } from "./TabBar";
import { DevClock } from "./DevClock";
import { UpdateBanner } from "./UpdateBanner";
import { useUpdateStore } from "@/state/updates";

export function TabShell() {
  useApplyTheme();
  useEffect(() => {
    // DEV-only: `?update=1` forces the banner so screenshots can capture it.
    if (import.meta.env.DEV && new URLSearchParams(window.location.search).get("update") === "1") useUpdateStore.getState().setNeedRefresh();
  }, []);
  return (
    <div className="mx-auto min-h-dvh max-w-[480px]">
      <main className="px-4 pb-28 safe-t">
        <Outlet />
      </main>
      <UpdateBanner />
      <TabBar />
      {import.meta.env.DEV && <DevClock />}
      <ScrollRestoration getKey={(loc) => loc.pathname.split("/")[1] ?? ""} />
    </div>
  );
}
