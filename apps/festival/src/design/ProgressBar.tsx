export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} className="h-1.5 overflow-hidden rounded-chip bg-surface-2">
      <div className="h-full bg-gradient-to-r from-sun to-sun-hot" style={{ width: `${pct}%` }} />
    </div>
  );
}
