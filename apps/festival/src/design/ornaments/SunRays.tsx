const ANGLES = Array.from({ length: 12 }, (_, i) => i * 30);

export function SunRays({ size = 130, className = "", spinning = true }: { size?: number; className?: string; spinning?: boolean }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="-60 -60 120 120" className={className}>
      <g className={spinning ? "animate-rays origin-center" : "origin-center"}>
        <g fill="#F09A1C">{ANGLES.map((a) => <path key={a} d="M0 0L-6 -58L6 -58Z" transform={`rotate(${a})`} />)}</g>
        <g fill="#F0C41C">{ANGLES.map((a) => <path key={a} d="M0 0L-4 -50L4 -50Z" transform={`rotate(${a + 15})`} />)}</g>
      </g>
      <circle r="22" fill="#F0C41C" stroke="#1E1A1A" strokeWidth="2.5" />
    </svg>
  );
}
