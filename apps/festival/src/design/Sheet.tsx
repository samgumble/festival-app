import { motion, useDragControls, type PanInfo } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { appLifecycle } from "@/platform/appLifecycle";
import { SPRING_SHEET, useMotionOk } from "./motion";

/** Drag past this many px, or flick faster than this px/s, and the sheet closes; otherwise it springs back. */
export const DISMISS_OFFSET = 110;
export const DISMISS_VELOCITY = 650;
export function shouldDismiss(offsetY: number, velocityY: number): boolean {
  return offsetY > DISMISS_OFFSET || (offsetY > 24 && velocityY > DISMISS_VELOCITY);
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Bottom sheet. Closes on Escape, backdrop tap, Android back, and a downward swipe (from the handle,
 * or from the body when it is scrolled to the top). Modal for real: focus moves in on open, Tab cycles
 * inside, the app behind is inert, and focus returns to where it was on close.
 */
export function Sheet({ onClose, title, children }: { onClose: () => void; title?: string; children: ReactNode }) {
  const ok = useMotionOk();
  const controls = useDragControls();
  const dialogRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pending = useRef<{ y: number } | null>(null);
  const [scrollable, setScrollable] = useState(false);

  // When the content fits without scrolling (artist cards, settings), the whole sheet is the drag
  // handle: touch-action none keeps the WebView from claiming the gesture as a scroll. Long sheets
  // keep native scrolling and fall back to the handle plus the at-top downward-swipe heuristic.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const measure = () => setScrollable(el.scrollHeight > el.clientHeight + 1);
    measure();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    return () => ro?.disconnect();
  }, [children]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key !== "Tab" || !dialogRef.current) return;
      const items = [...dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => !el.closest("[hidden], [aria-hidden='true']"));
      if (items.length === 0) { e.preventDefault(); dialogRef.current.focus(); return; }
      const first = items[0]!, last = items[items.length - 1]!;
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === dialogRef.current)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => appLifecycle.onBackButton(onClose), [onClose]);

  // Focus in, make the app behind inert, restore on close.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const root = document.getElementById("root");
    root?.setAttribute("inert", "");
    dialogRef.current?.focus({ preventScroll: true });
    return () => {
      root?.removeAttribute("inert");
      if (previous && previous.isConnected) previous.focus({ preventScroll: true });
    };
  }, []);

  // Body drag: only start a dismiss drag when the content is at its scroll top and the finger moves down,
  // so scrolling a long sheet keeps working natively.
  const onBodyPointerDown = (e: ReactPointerEvent) => {
    if (!scrollable) { controls.start(e); return; }
    pending.current = { y: e.clientY };
  };
  const onBodyPointerMove = (e: ReactPointerEvent) => {
    if (!pending.current) return;
    const dy = e.clientY - pending.current.y;
    if (dy < -6) { pending.current = null; return; }
    if (dy > 10) {
      pending.current = null;
      if ((scrollRef.current?.scrollTop ?? 0) <= 0) controls.start(e);
    }
  };
  const onBodyPointerEnd = () => { pending.current = null; };
  const onDragEnd = (_: unknown, info: PanInfo) => { if (shouldDismiss(info.offset.y, info.velocity.y)) onClose(); };

  const sheet = (
    <div className="fixed inset-0 z-40">
      <div data-testid="sheet-backdrop" onClick={onClose} className="absolute inset-0 bg-night-ink/40" />
      <motion.div ref={dialogRef} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}
        initial={ok ? { y: "100%" } : undefined} animate={{ y: 0 }} transition={ok ? SPRING_SHEET : { duration: 0 }}
        drag="y" dragListener={false} dragControls={controls} dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.7 }} dragMomentum={false} onDragEnd={onDragEnd}
        className="absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t-sheet border border-b-0 border-hair bg-surface shadow-sheet outline-none safe-b">
        {/* 44px grab strip (owner request 2026-09-15): the whole strip starts a dismiss drag, not just the bar. */}
        <div data-testid="sheet-handle" onPointerDown={(e) => controls.start(e)} style={{ touchAction: "none" }}
          className="flex min-h-11 shrink-0 cursor-grab items-center px-4 active:cursor-grabbing">
          <div aria-hidden="true" className="mx-auto h-1.5 w-12 rounded-chip bg-hair" />
        </div>
        <div ref={scrollRef} data-testid="sheet-body" data-scrollable={scrollable ? "true" : "false"} onPointerDown={onBodyPointerDown} onPointerMove={onBodyPointerMove}
          onPointerUp={onBodyPointerEnd} onPointerCancel={onBodyPointerEnd} style={{ touchAction: scrollable ? "pan-y" : "none" }}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-8">
          {children}
        </div>
      </motion.div>
    </div>
  );
  return typeof document !== "undefined" ? createPortal(sheet, document.body) : sheet;
}
