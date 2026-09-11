import { motion } from "motion/react";
import { Button, useMotionOk } from "@/design";
import { useUpdateStore } from "@/state/updates";

// Sits above the tab bar: checker ribbon 12 px + padding 8 px + tabs 56 px = 76 px, plus 8 px breathing room.
const ABOVE_TABS = "calc(84px + env(safe-area-inset-bottom))";

/** "A fresh festival guide is ready → Refresh". Shown by the service-worker bridge in prompt mode. */
export function UpdateBanner() {
  const ok = useMotionOk();
  const needRefresh = useUpdateStore((s) => s.needRefresh);
  const dismissed = useUpdateStore((s) => s.dismissed);
  const apply = useUpdateStore((s) => s.apply);
  const dismiss = useUpdateStore((s) => s.dismiss);
  if (!needRefresh || dismissed) return null;
  return (
    <motion.div role="status" initial={ok ? { opacity: 0 } : undefined} animate={{ opacity: 1 }} transition={{ duration: ok ? 0.15 : 0 }}
      className="fixed inset-x-0 z-30 mx-auto max-w-[480px] px-4" style={{ bottom: ABOVE_TABS }}>
      <div className="flex items-center gap-3 rounded-card bg-night px-4 py-3 text-paper-light shadow-sheet">
        <div className="min-w-0 flex-1">
          <span className="eyebrow block text-sky-light">Update</span>
          <span className="text-[14px] leading-5">A fresh festival guide is ready.</span>
        </div>
        <Button variant="sun" size="sm" onClick={() => void apply()}>Refresh</Button>
        <button type="button" aria-label="Dismiss" onClick={dismiss} className="grid h-11 w-11 shrink-0 place-items-center text-[18px] text-paper-light/80">✕</button>
      </div>
    </motion.div>
  );
}
