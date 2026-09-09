import { useReducedMotion } from "motion/react";

export const SPRING_TAP = { type: "spring", stiffness: 380, damping: 32 } as const;
export const SPRING_SHEET = { type: "spring", stiffness: 220, damping: 26 } as const;
export const SPRING_BLOOM = { type: "spring", stiffness: 500, damping: 18 } as const;
export const DUR = { control: 0.16, surface: 0.24, route: 0.32 } as const;

/** True when motion is welcome (no reduced-motion preference). */
export function useMotionOk(): boolean {
  return !useReducedMotion();
}
