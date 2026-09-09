/** Far (sky) / near (plum) / grass (leaf) silhouettes. Width-fills its container. */
export function Mountains({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={`block w-full ${className}`} viewBox="0 0 220 110" preserveAspectRatio="none">
      <path d="M0 110L40 40L70 75L110 15L150 70L180 45L220 110Z" fill="#1890A8" stroke="#1E1A1A" strokeWidth="2" strokeLinejoin="round" />
      <path d="M96 36L110 15L124 36L116 33L110 40L104 33Z" fill="#F5E7CC" />
      <path d="M30 57L40 40L50 57L44 54L40 60L36 54Z" fill="#F5E7CC" />
      <path d="M0 110L60 60L100 90L140 55L190 90L220 110Z" fill="#78307A" stroke="#1E1A1A" strokeWidth="2" strokeLinejoin="round" />
      <path d="M0 110L30 92L70 105L120 88L170 104L220 110Z" fill="#3CA81E" stroke="#1E1A1A" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}
