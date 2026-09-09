import type { StageColor } from "./schema.ts";

/** Locked palette (DECISIONS D-016). Single source for app, admin, and generated CSS. */
export const PALETTE = {
  paper: "#EBD5B3",
  "paper-light": "#F5E7CC",
  "paper-deep": "#D8C09A",
  ink: "#1E1A1A",
  "ink-soft": "#4A403C",
  night: "#1A4A80",
  "night-deep": "#0A3070",
  "night-ink": "#071F4A",
  sky: "#1890A8",
  "sky-light": "#7CC4D6",
  plum: "#78307A",
  violet: "#7A64A8",
  pine: "#1E7A22",
  leaf: "#3CA81E",
  sun: "#F0C41C",
  "sun-hot": "#F09A1C",
  amber: "#D1973D",
  ember: "#D4452F",
  bloom: "#E0508F",
} as const;

export type PaletteName = keyof typeof PALETTE;

export const STAGE_COLOR_HEX: Record<StageColor, string> = {
  sky: PALETTE.sky,
  plum: PALETTE.plum,
  pine: PALETTE.pine,
  violet: PALETTE.violet,
};
