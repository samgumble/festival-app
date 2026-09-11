import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useContent, useContentIndex } from "@/data/content";
import { diffReminders, planReminders } from "@/domain/reminders";
import { festivalNow } from "@/domain/time";
import { notifications } from "@/platform/notifications";
import { usePlanStore } from "@/state/plan";
import { useUiStore } from "@/state/ui";

const TICK_MS = 60_000;

/**
 * Keeps on-device reminders equal to "every favorited upcoming set at start − lead" while the
 * switch is on; cancels everything we own when it is off. Native only; a no-op elsewhere.
 * Runs on mount too, so schedule changes published while the app was closed reconcile on launch.
 */
export function useReminderSync(): void {
  const navigate = useNavigate();
  const content = useContent();
  const idx = useContentIndex();
  const favorites = usePlanStore((s) => s.favorites);
  const leadMinutes = usePlanStore((s) => s.settings.leadMinutes);
  const remindersOn = usePlanStore((s) => s.remindersOn);
  const devNow = useUiStore((s) => s.devNow);
  const owned = useRef<Set<number>>(new Set());
  const chain = useRef<Promise<void>>(Promise.resolve());

  // Tap on a reminder → Plan tab.
  useEffect(() => notifications.onTap(() => navigate("/plan")), [navigate]);

  useEffect(() => {
    if (!notifications.isSupported()) return;
    const run = () => {
      chain.current = chain.current.then(async () => {
        const pending = await notifications.pending();
        if (!remindersOn) {
          const ids = [...new Set([...owned.current, ...pending.map((p) => p.id)])].filter((id) => owned.current.has(id) || pending.some((p) => p.id === id));
          if (ids.length) await notifications.cancel(ids);
          owned.current.clear();
          return;
        }
        const desired = planReminders({
          favorites, sets: content.sets, artistsById: idx.artistsById, stagesById: idx.stagesById, leadMinutes,
          now: festivalNow(devNow).getTime(),
        });
        const { cancel, schedule } = diffReminders(desired, pending);
        if (cancel.length) await notifications.cancel(cancel);
        if (schedule.length) await notifications.schedule(schedule);
        owned.current = new Set(desired.map((d) => d.id));
      }).catch((e: unknown) => { if (import.meta.env.DEV) console.warn("reminder sync failed", e); });
    };
    run();
    const t = setInterval(run, TICK_MS);
    return () => clearInterval(t);
  }, [remindersOn, favorites, leadMinutes, content, idx, devNow]);
}
