import { useState } from "react";
import { Button, Sheet } from "@/design";
import { usePlanStore } from "@/state/plan";

/** Bottom-of-lineup escape hatch: clears every favorite after two confirmations (owner request 2026-09-14). */
export function ResetFavorites() {
  const count = usePlanStore((s) => s.favorites.length);
  const clear = usePlanStore((s) => s.clearFavorites);
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const close = () => setStep(0);
  return (
    <>
      <div className="mb-2 mt-10 text-center">
        <Button size="sm" disabled={count === 0} onClick={() => setStep(1)}>Reset favorites</Button>
        <p className="mt-1.5 text-[13px] text-fg-soft">{count === 0 ? "No favorites yet." : `${count} favorited set${count === 1 ? "" : "s"} in your schedule.`}</p>
      </div>
      {step > 0 && (
        <Sheet title="Reset favorites" onClose={close}>
          {step === 1 ? (
            <>
              <h2 className="font-display text-[24px] leading-7">Reset favorites?</h2>
              <p className="mt-2 text-[15px] text-fg-soft">This clears all {count} favorited set{count === 1 ? "" : "s"} from your schedule.</p>
              <div className="mt-4 flex gap-2"><Button className="flex-1" onClick={close}>Cancel</Button><Button variant="ink" className="flex-1" onClick={() => setStep(2)}>Continue</Button></div>
            </>
          ) : (
            <>
              <h2 className="font-display text-[24px] leading-7">Are you sure?</h2>
              <p className="mt-2 text-[15px] text-fg-soft">Your schedule, conflict choices, and reminders for these sets will be removed. This can’t be undone.</p>
              <div className="mt-4 flex gap-2"><Button className="flex-1" onClick={close}>Keep favorites</Button><Button variant="ink" className="flex-1 bg-ember-deep text-white!" onClick={() => { clear(); close(); }}>Yes, reset</Button></div>
            </>
          )}
        </Sheet>
      )}
    </>
  );
}
