import { Button, Card, Eyebrow } from "@/design";
import { useReminderToggle } from "./useReminderToggle";

/** Native only: a visible way to switch reminders on from the schedule itself, and a status line once they are. */
export function ReminderPrompt({ count }: { count: number }) {
  const r = useReminderToggle();
  if (!r.supported || count === 0) return null;
  if (r.remindersOn) {
    return <p className="mt-2 px-0.5 text-[13px] text-fg-soft">Reminders on · {r.leadMinutes} min before each set{r.inexact ? " · may arrive a few minutes late" : ""}</p>;
  }
  return (
    <Card className="mt-3 flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <Eyebrow tone="structure">Reminders</Eyebrow>
        <div className="text-[15px]">Get a heads-up {r.leadMinutes} min before each favorite.</div>
        {r.showDenied && <p className="mt-0.5 text-[13px] text-ember">Notifications are off for this app in Settings. <button type="button" className="underline" onClick={r.openSettings}>Open Settings</button></p>}
      </div>
      <Button variant="sun" size="sm" onClick={() => void r.toggle(true)}>Turn on</Button>
    </Card>
  );
}
