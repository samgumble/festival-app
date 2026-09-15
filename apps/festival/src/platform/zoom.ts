import { runtime } from "./runtime";

/**
 * Native shells only: pin the page scale so a stray pinch cannot zoom the app and leave the fan
 * panning in two directions (owner report 2026-09-14). The web build stays zoomable, which the
 * accessibility gate (docs/COMPLIANCE.md §5) requires. Returns a teardown for tests.
 */
export function lockZoom(doc: Document = document): () => void {
  if (!runtime.isNative()) return () => {};
  const meta = doc.querySelector<HTMLMetaElement>('meta[name="viewport"]');
  const previous = meta?.content;
  if (meta) meta.content = "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover";
  doc.documentElement.style.touchAction = "pan-x pan-y";
  // WebKit fires proprietary gesture events for pinches; cancelling them blocks the zoom.
  const block = (e: Event) => e.preventDefault();
  const pinch = (e: TouchEvent) => { if (e.touches.length > 1) e.preventDefault(); };
  for (const type of ["gesturestart", "gesturechange", "gestureend"]) doc.addEventListener(type, block, { passive: false });
  doc.addEventListener("touchmove", pinch, { passive: false });
  return () => {
    if (meta && previous !== undefined) meta.content = previous;
    doc.documentElement.style.touchAction = "";
    for (const type of ["gesturestart", "gesturechange", "gestureend"]) doc.removeEventListener(type, block);
    doc.removeEventListener("touchmove", pinch);
  };
}
