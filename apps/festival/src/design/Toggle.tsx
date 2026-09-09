// invisible hit area: 28 px visual → 44 px tall target (28 + 8 + 8), 48 + 4 + 4 wide
const HIT_AREA = "before:absolute before:-inset-x-1 before:-inset-y-2 before:content-['']";

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}
      className={`relative h-7 w-12 shrink-0 rounded-chip transition-colors duration-150 motion-reduce:transition-none ${HIT_AREA} ${on ? "bg-pine" : "bg-surface-2"}`}>
      <span className={`absolute top-[3px] h-[22px] w-[22px] rounded-chip bg-white shadow transition-[left] duration-150 motion-reduce:transition-none ${on ? "left-[23px]" : "left-[3px]"}`} />
    </button>
  );
}
