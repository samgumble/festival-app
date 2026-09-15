import type { FestivalSet, Stage } from "@bb/shared";

/** The place a fan should walk to: the set's own venue when it has one, otherwise its stage. */
export function placeOf(set: Pick<FestivalSet, "venue">, stage: Pick<Stage, "name"> | undefined): string {
  return set.venue ?? stage?.name ?? "";
}
