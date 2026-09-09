import type { ReactNode } from "react";

export type ChipTone = "sky" | "plum" | "pine" | "violet" | "sun" | "ember" | "paper";
const TONE: Record<ChipTone, string> = {
  sky: "bg-sky text-ink", plum: "bg-plum text-white", pine: "bg-pine text-white", violet: "bg-violet text-white",
  sun: "bg-sun text-ink", ember: "bg-ember text-white", paper: "bg-surface-2 text-fg",
};

export function Chip({ tone, children, className = "" }: { tone: ChipTone; children: ReactNode; className?: string }) {
  return <span className={`micro inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-chip px-2.5 ${TONE[tone]} ${className}`}>{children}</span>;
}
