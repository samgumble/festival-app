import { useEffect, useRef, useState } from "react";
import { notifications } from "@/platform/notifications";
import { usePlanStore } from "@/state/plan";

/**
 * One switch, many surfaces: the reminders toggle logic shared by the Schedule settings sheet, the
 * Info page, and the "turn on reminders" card on My Schedule. Requests the OS permission on turn-on.
 */
export function useReminderToggle() {
  const { remindersOn, setRemindersOn, remindersRevoked, setRemindersRevoked, settings } = usePlanStore();
  const [denied, setDenied] = useState(false);
  // Android's checkPermissions() reports "prompt", not "denied", right after the fan revokes
  // notifications in system Settings, so `remindersRevoked` (left by useReminderSync) is the
  // reliable signal for that case.
  const showDenied = denied || remindersRevoked;
  const [inexact, setInexact] = useState(false);
  const supported = notifications.isSupported();
  const busy = useRef(false);

  useEffect(() => {
    if (!supported) return;
    void notifications.permission().then((p) => { if (p === "denied") setDenied(true); });
  }, [supported]);

  const toggle = async (v: boolean) => {
    if (busy.current) return;
    if (!v) { setRemindersOn(false); setDenied(false); setRemindersRevoked(false); return; }
    busy.current = true;
    try {
      const perm = await notifications.request();
      if (perm !== "granted") { setDenied(true); setRemindersOn(false); setRemindersRevoked(false); return; }
      setDenied(false);
      setRemindersRevoked(false);
      setRemindersOn(true);
      const exact = await notifications.exactAllowed();
      setInexact(!exact);
    } catch {
      setDenied(true);
      setRemindersOn(false);
      setRemindersRevoked(false);
    } finally {
      busy.current = false;
    }
  };
  const requestExact = () => void notifications.requestExact().then((ok) => setInexact(!ok));
  return { supported, remindersOn, showDenied, inexact, leadMinutes: settings.leadMinutes, toggle, requestExact };
}
