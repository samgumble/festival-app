import { useState } from "react";
import { Eyebrow, SegmentedControl, Sheet, Toggle } from "@/design";
import { notifications } from "@/platform/notifications";
import { usePlanStore } from "@/state/plan";
import { useReminderToggle } from "./useReminderToggle";

export function PlanSettings({ onClose }: { onClose: () => void }) {
  const { settings, setSettings } = usePlanStore();
  const { supported, remindersOn, showDenied, inexact, toggle: onToggle, requestExact } = useReminderToggle();
  const [pendingCount, setPendingCount] = useState<number | null>(null);

  return (
    <Sheet onClose={onClose} title="Schedule settings">
      <h2 className="font-display text-[24px] leading-7">Schedule settings</h2>
      <div className="mt-4 space-y-4">
        {supported && (
          <div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Eyebrow tone="structure">Reminders</Eyebrow>
                <div className="mt-1 text-[15px]">Remind me before my sets</div>
                <p className="mt-0.5 text-[13px] text-fg-soft">Uses your lead time below. Works with the app closed.</p>
              </div>
              <Toggle on={remindersOn} onChange={(v) => void onToggle(v)} label="Remind me before my sets" />
            </div>
            {showDenied && <p className="mt-1.5 text-[13px] text-ember">Notifications are off for this app in Settings.</p>}
            {inexact && (
              <p className="mt-1.5 text-[13px] text-fg-soft">
                Reminders may arrive a few minutes late. <button type="button" className="underline" onClick={requestExact}>Allow exact timing in Settings</button>
              </p>
            )}
            {import.meta.env.DEV && (
              <button type="button" className="mt-1.5 text-[12px] underline text-fg-soft" onClick={() => void notifications.pending().then((p) => setPendingCount(p.length)).catch(() => {})}>
                pending: {pendingCount ?? "?"}
              </button>
            )}
          </div>
        )}
        <div><Eyebrow tone="structure">Remind me before a set</Eyebrow><div className="mt-2"><SegmentedControl label="Reminder lead time" value={String(settings.leadMinutes)} onChange={(v) => setSettings({ leadMinutes: Number(v) as 5 | 15 | 30 })} options={[{ value: "5", label: "5 min" }, { value: "15", label: "15 min" }, { value: "30", label: "30 min" }]} /></div></div>
        <div><Eyebrow tone="structure">Buffer between stages</Eyebrow><div className="mt-2"><SegmentedControl label="Buffer" value={String(settings.bufferMinutes)} onChange={(v) => setSettings({ bufferMinutes: Number(v) as 0 | 10 | 20 })} options={[{ value: "0", label: "None" }, { value: "10", label: "10 min" }, { value: "20", label: "20 min" }]} /></div><p className="mt-1.5 text-[13px] text-fg-soft">Sets closer together than this are flagged so you have time to walk over.</p></div>
      </div>
    </Sheet>
  );
}
