type P = { active: boolean };
const base = { width: 24, height: 24, viewBox: "0 0 24 24", "aria-hidden": true as const };

export function IconNow({ active }: P) {
  return (
    <svg {...base} fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <circle cx="12" cy="12" r={active ? 5 : 4} />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" fill="none" />
    </svg>
  );
}
export function IconLineup({ active }: P) {
  return (
    <svg {...base} fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 2} strokeLinecap="round">
      <path d="M4 6h12M4 12h12M4 18h8" /><circle cx="19" cy="17" r="2.5" fill={active ? "currentColor" : "none"} /><path d="M21.5 17V9" />
    </svg>
  );
}
export function IconPlan({ active }: P) {
  return (
    <svg {...base} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4" />
      <path d="M12 18.5l-2.6-2.6a1.6 1.6 0 0 1 2.3-2.3l.3.3.3-.3a1.6 1.6 0 0 1 2.3 2.3z" fill={active ? "currentColor" : "none"} stroke={active ? "none" : "currentColor"} strokeWidth={1.5} />
    </svg>
  );
}
export function IconAlerts({ active }: P) {
  return (
    <svg {...base} fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <path d="M6 17V11a6 6 0 0 1 12 0v6l1.5 2h-15z" /><path d="M10 21h4" fill="none" /><path d="M19 4l1.5-1.5M20 8h2" fill="none" />
    </svg>
  );
}
export function IconInfo({ active }: P) {
  return (
    <svg {...base} fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6" stroke={active ? "var(--surface)" : "currentColor"} />
      <circle cx="12" cy="7.5" r="0.9" fill={active ? "var(--surface)" : "currentColor"} stroke="none" />
    </svg>
  );
}
