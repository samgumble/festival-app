import type { HTMLAttributes } from "react";

export function Card({ className = "", padded = true, ...rest }: HTMLAttributes<HTMLDivElement> & { padded?: boolean }) {
  return <div className={`rounded-card bg-surface border border-hair shadow-card ${padded ? "px-4 py-3.5" : ""} ${className}`} {...rest} />;
}
