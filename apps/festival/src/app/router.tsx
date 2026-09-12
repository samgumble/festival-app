import { createBrowserRouter, type RouteObject } from "react-router";
import { TabShell } from "./TabShell";
import { NowScreen } from "@/features/now/NowScreen";
import { LineupScreen } from "@/features/lineup/LineupScreen";
import { ArtistSheet } from "@/features/lineup/ArtistSheet";
import { PlanScreen } from "@/features/plan/PlanScreen";
import { AlertsScreen } from "@/features/alerts/AlertsScreen";
import { InfoScreen } from "@/features/info/InfoScreen";
import { PrivacyScreen } from "@/features/info/PrivacyScreen";
import { Gallery } from "@/design/Gallery";

export function buildRoutes(): RouteObject[] {
  const children: RouteObject[] = [
    { index: true, element: <NowScreen /> },
    { path: "lineup", element: <LineupScreen />, children: [{ path: "artist/:id", element: <ArtistSheet /> }] },
    { path: "plan", element: <PlanScreen /> },
    { path: "alerts", element: <AlertsScreen />, children: [{ path: ":id", element: null }] },
    { path: "info", element: <InfoScreen /> },
    { path: "privacy", element: <PrivacyScreen /> },
  ];
  if (import.meta.env.DEV) children.push({ path: "design", element: <Gallery /> });
  return [{ path: "/", element: <TabShell />, children }];
}

export function createAppRouter() {
  const basename = import.meta.env.BASE_URL.replace(/\/$/, "") || "/";
  return createBrowserRouter(buildRoutes(), { basename });
}
