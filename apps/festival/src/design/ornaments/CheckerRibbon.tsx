export function CheckerRibbon({ className = "", rows = 2 }: { className?: string; rows?: 1 | 2 }) {
  return <div aria-hidden="true" className={`checker w-full ${rows === 1 ? "h-1.5" : "h-3"} ${className}`} />;
}
