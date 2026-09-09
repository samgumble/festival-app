import { Outlet, ScrollRestoration } from "react-router";
import { useApplyTheme } from "./theme";
import { TabBar } from "./TabBar";
import { DevClock } from "./DevClock";

export function TabShell() {
  useApplyTheme();
  return (
    <div className="mx-auto min-h-dvh max-w-[480px]">
      <main className="px-4 pb-28 safe-t">
        <Outlet />
      </main>
      <TabBar />
      {import.meta.env.DEV && <DevClock />}
      <ScrollRestoration getKey={(loc) => loc.pathname.split("/")[1] ?? ""} />
    </div>
  );
}
