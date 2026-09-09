import type { ReactNode } from "react";

export function SegmentedControl<T extends string>({ options, value, onChange, label }: {
  options: { value: T; label: ReactNode }[]; value: T; onChange: (v: T) => void; label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-grid grid-flow-col gap-0.5 rounded-chip bg-surface-2 p-1">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button key={o.value} type="button" role="radio" aria-checked={on} onClick={() => onChange(o.value)}
            className={`h-10 min-w-11 rounded-chip px-4 text-[15px] font-semibold tabular-nums transition-colors duration-150 ${on ? "bg-sky text-white shadow-[0_2px_8px_rgba(24,144,168,.35)]" : "text-fg-soft"}`}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
