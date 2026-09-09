const BANDS = ["#D4452F", "#F09A1C", "#F0C41C", "#3CA81E", "#1890A8"];

/** Five poster bands + a checker inner ring. Fills its positioned parent. */
export function RainbowArch({ className = "" }: { className?: string }) {
  const w = 390, h = 440, r0 = 189, step = 8, sw = 7;
  return (
    <svg aria-hidden="true" className={`absolute inset-0 h-full w-full ${className}`} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs>
        <pattern id="arch-checker" width="10" height="10" patternUnits="userSpaceOnUse">
          <rect width="10" height="10" fill="#F5E7CC" />
          <rect width="5" height="5" fill="#1E1A1A" />
          <rect x="5" y="5" width="5" height="5" fill="#1E1A1A" />
        </pattern>
      </defs>
      <g fill="none" strokeLinecap="round">
        {BANDS.map((color, i) => {
          const inset = 6 + i * step, r = r0 - i * step;
          return <path key={color} d={`M${inset} ${h} V200 A${r} ${r} 0 0 1 ${w - inset} 200 V${h}`} stroke={color} strokeWidth={sw} />;
        })}
        <path d={`M${6 + 5 * step + 1} ${h} V200 A${r0 - 5 * step - 1} ${r0 - 5 * step - 1} 0 0 1 ${w - 6 - 5 * step - 1} 200 V${h}`} stroke="url(#arch-checker)" strokeWidth={8} />
      </g>
    </svg>
  );
}
