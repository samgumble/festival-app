import type { ReactNode } from "react";

const TONE = { soft: "text-fg-soft", structure: "text-structure", plum: "text-plum" };
export function Eyebrow({ tone = "soft", children, className = "" }: { tone?: keyof typeof TONE; children: ReactNode; className?: string }) {
  return <span className={`eyebrow ${TONE[tone]} ${className}`}>{children}</span>;
}
