import { useEffect, useMemo, useState } from "react";
import type { DayId } from "@bb/shared";
import { useContent } from "@/data/content";
import { festivalState, type FestivalState } from "@/domain/schedule";
import { dayIdFor, festivalNow } from "@/domain/time";
import { useUiStore } from "@/state/ui";

export interface FestivalClock { now: Date; state: FestivalState; dayId: DayId | null }

/** Minute-ticking festival clock in Denver time; honors the dev override outside production. */
export function useFestivalClock(): FestivalClock {
  const devNow = useUiStore((s) => (import.meta.env.DEV ? s.devNow : null));
  const { festival } = useContent();
  const [tick, setTick] = useState(() => Date.now());
  useEffect(() => {
    const msToNextMinute = 60_000 - (Date.now() % 60_000);
    let interval: ReturnType<typeof setInterval> | undefined;
    const timeout = setTimeout(() => {
      setTick(Date.now());
      interval = setInterval(() => setTick(Date.now()), 60_000);
    }, msToNextMinute);
    return () => { clearTimeout(timeout); if (interval) clearInterval(interval); };
  }, []);
  return useMemo(() => {
    const now = devNow ? festivalNow(devNow) : new Date(tick);
    return { now, state: festivalState(festival, now), dayId: dayIdFor(now, festival) };
  }, [devNow, tick, festival]);
}
