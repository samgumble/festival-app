export function Butterfly({ className = "", drifting = true, size = 80 }: { className?: string; drifting?: boolean; size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size * 0.8} viewBox="0 0 80 64" className={`${drifting ? "animate-drift" : ""} ${className}`}>
      <g stroke="#1E1A1A" strokeWidth="1.6" strokeLinejoin="round">
        <path d="M40 32C30 10 8 6 6 22c-2 12 14 16 30 14z" fill="#1A4A80" />
        <path d="M40 32C50 10 72 6 74 22c2 12-14 16-30 14z" fill="#1A4A80" />
        <path d="M40 34C28 42 10 52 14 58c4 6 18-4 26-20z" fill="#78307A" />
        <path d="M40 34C52 42 70 52 66 58c-4 6-18-4-26-20z" fill="#78307A" />
        <ellipse cx="22" cy="24" rx="5" ry="6" fill="#F0C41C" /><ellipse cx="58" cy="24" rx="5" ry="6" fill="#F0C41C" />
        <rect x="37.5" y="18" width="5" height="30" rx="2.5" fill="#1E1A1A" />
        <path d="M39 18l-6-10M41 18l6-10" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
}
