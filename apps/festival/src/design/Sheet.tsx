import { motion } from "motion/react";
import { useEffect, type ReactNode } from "react";
import { SPRING_SHEET, useMotionOk } from "./motion";

export function Sheet({ onClose, title, children }: { onClose: () => void; title?: string; children: ReactNode }) {
  const ok = useMotionOk();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-40">
      <div data-testid="sheet-backdrop" onClick={onClose} className="absolute inset-0 bg-night-ink/40" />
      <motion.div role="dialog" aria-modal="true" aria-label={title}
        initial={ok ? { y: "100%" } : undefined} animate={{ y: 0 }} transition={ok ? SPRING_SHEET : { duration: 0 }}
        className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-sheet border border-b-0 border-hair bg-surface px-4 pb-8 pt-2.5 shadow-sheet safe-b">
        <div aria-hidden="true" className="mx-auto mb-3 h-1.5 w-10 rounded-chip bg-hair" />
        {children}
      </motion.div>
    </div>
  );
}
