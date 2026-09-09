import type { DayId } from "@bb/shared";
export function LineupGrid({ dayId }: { dayId: DayId; now: Date }) {
  return <p className="mt-4 text-fg-soft">Grid for {dayId} — Task 15.</p>;
}
