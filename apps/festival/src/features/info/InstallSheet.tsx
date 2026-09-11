import { Button, Eyebrow, Sheet } from "@/design";

const STEPS = ["Tap Share", "Scroll to Add to Home Screen", "Tap Add"] as const;

/** iOS Safari has no install prompt; walk the fan through Share → Add to Home Screen. */
export function InstallSheet({ onClose }: { onClose: () => void }) {
  return (
    <Sheet onClose={onClose} title="Add to Home Screen">
      <Eyebrow tone="structure">Get the app</Eyebrow>
      <h2 className="mt-1 font-display text-[24px] leading-7 text-structure-2">Add to Home Screen</h2>
      <p className="mt-2 text-[14px] leading-5 text-fg-soft">Then it opens full-screen and works offline at the venue.</p>
      <ol className="mt-4 space-y-3">
        {STEPS.map((step, i) => (
          <li key={step} className="flex items-center gap-3 text-[15px]">
            <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-chip bg-structure-fill font-semibold text-structure-2">{i + 1}</span>
            <span>
              {i === 0 && <ShareGlyph />}
              {step}
            </span>
          </li>
        ))}
      </ol>
      <Button variant="ink" full className="mt-6" onClick={onClose}>Done</Button>
    </Sheet>
  );
}

function ShareGlyph() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="mr-1.5 inline-block h-5 w-5 align-[-4px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v12M8 7l4-4 4 4" />
      <path d="M5 11v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8" />
    </svg>
  );
}
