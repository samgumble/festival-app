import type { HTMLAttributes } from "react";

export type CardTint = "info" | "important" | "urgent";

// Alert cards carry their severity as a background wash (tokens.css `--tint-*`) instead of an edge accent.
const TINT: Record<CardTint, string> = { info: "bg-tint-info", important: "bg-tint-important", urgent: "bg-tint-urgent" };

export function Card({ className = "", padded = true, tint, ...rest }: HTMLAttributes<HTMLDivElement> & { padded?: boolean; tint?: CardTint }) {
  return <div className={`rounded-card ${tint ? TINT[tint] : "bg-surface"} border border-hair shadow-card ${padded ? "px-4 py-3.5" : ""} ${className}`} {...rest} />;
}
