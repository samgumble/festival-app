import { Outlet } from "react-router";

export function LineupScreen() {
  return (
    <>
      <h1 className="font-display text-[32px] leading-9 text-structure-2">Lineup</h1>
      <Outlet />
    </>
  );
}
