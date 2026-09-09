export function Columbine({ size = 48, className = "" }: { size?: number; className?: string }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 48 48" className={className}>
      <g fill="#7A64A8" stroke="#1E1A1A" strokeWidth="1.5">
        <ellipse cx="24" cy="11" rx="6" ry="9" /><ellipse cx="24" cy="37" rx="6" ry="9" />
        <ellipse cx="11" cy="24" rx="9" ry="6" /><ellipse cx="37" cy="24" rx="9" ry="6" />
        <ellipse cx="14.5" cy="14.5" rx="5" ry="8" transform="rotate(-45 14.5 14.5)" />
        <ellipse cx="33.5" cy="33.5" rx="5" ry="8" transform="rotate(-45 33.5 33.5)" />
        <ellipse cx="33.5" cy="14.5" rx="5" ry="8" transform="rotate(45 33.5 14.5)" />
        <ellipse cx="14.5" cy="33.5" rx="5" ry="8" transform="rotate(45 14.5 33.5)" />
      </g>
      <g fill="#F5E7CC"><circle cx="24" cy="13" r="2.4" /><circle cx="24" cy="35" r="2.4" /><circle cx="13" cy="24" r="2.4" /><circle cx="35" cy="24" r="2.4" /></g>
      <circle cx="24" cy="24" r="6" fill="#F0C41C" stroke="#1E1A1A" strokeWidth="1.5" />
    </svg>
  );
}
