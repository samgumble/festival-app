import { Eyebrow, SegmentedControl, Sheet } from "@/design";
import { usePlanStore } from "@/state/plan";

export function PlanSettings({ onClose }: { onClose: () => void }) {
  const { settings, setSettings } = usePlanStore();
  return (
    <Sheet onClose={onClose} title="Plan settings">
      <h2 className="font-display text-[24px] leading-7">Plan settings</h2>
      <div className="mt-4 space-y-4">
        <div><Eyebrow tone="structure">Remind me before a set</Eyebrow><div className="mt-2"><SegmentedControl label="Reminder lead time" value={String(settings.leadMinutes)} onChange={(v) => setSettings({ leadMinutes: Number(v) as 5 | 15 | 30 })} options={[{ value: "5", label: "5 min" }, { value: "15", label: "15 min" }, { value: "30", label: "30 min" }]} /></div></div>
        <div><Eyebrow tone="structure">Buffer between stages</Eyebrow><div className="mt-2"><SegmentedControl label="Buffer" value={String(settings.bufferMinutes)} onChange={(v) => setSettings({ bufferMinutes: Number(v) as 0 | 10 | 20 })} options={[{ value: "0", label: "None" }, { value: "10", label: "10 min" }, { value: "20", label: "20 min" }]} /></div><p className="mt-1.5 text-[13px] text-fg-soft">Sets closer together than this are flagged so you have time to walk over.</p></div>
      </div>
    </Sheet>
  );
}
