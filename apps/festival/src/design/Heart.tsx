import { motion } from "motion/react";
import { haptics } from "@/platform/haptics";
import { Columbine } from "./ornaments";
import { SPRING_BLOOM, useMotionOk } from "./motion";

export function Heart({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  const ok = useMotionOk();
  return (
    <button type="button" aria-pressed={on} aria-label={label} onClick={() => { if (!on) void haptics.tap(); onToggle(); }}
      className="grid h-12 w-12 shrink-0 place-items-center rounded-chip border border-hair bg-surface">
      <motion.span key={on ? "bloom" : "heart"} className="grid place-items-center"
        initial={ok ? { scale: 0.8 } : undefined} animate={{ scale: 1 }} transition={ok ? SPRING_BLOOM : { duration: 0 }}>
        {on ? (
          <Columbine size={26} />
        ) : (
          <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 20.5l-7.4-7.3a4.4 4.4 0 0 1 6.2-6.2l1.2 1.1 1.2-1.1a4.4 4.4 0 0 1 6.2 6.2z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          </svg>
        )}
      </motion.span>
    </button>
  );
}
