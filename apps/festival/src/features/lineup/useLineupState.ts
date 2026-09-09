import { useState } from "react";
import type { DayId } from "@bb/shared";
import { useFestivalClock } from "@/app/clock";
import { useUiStore } from "@/state/ui";

export function useLineupState() {
  const { now, state, dayId } = useFestivalClock();
  const [day, setDay] = useState<DayId>(state === "live" && dayId ? dayId : "fri");
  const view = useUiStore((s) => s.lineupView);
  const setView = useUiStore((s) => s.setLineupView);
  const [query, setQuery] = useState("");
  return { now, day, setDay, view, setView, query, setQuery };
}
