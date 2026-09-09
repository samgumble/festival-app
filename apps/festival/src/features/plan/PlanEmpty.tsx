import { Columbine, Heart, RainbowArch } from "@/design";
import { useContent, useContentIndex } from "@/data/content";
import { headliners } from "@/domain/schedule";
import { formatTime, parseIso } from "@/domain/time";
import { usePlanStore } from "@/state/plan";

export function PlanEmpty() {
  const content = useContent();
  const idx = useContentIndex();
  const { favorites, toggleFavorite } = usePlanStore();
  return (
    <div className="mt-4">
      <div className="relative overflow-hidden rounded-hero bg-night px-6 pb-6 pt-24 text-center">
        <RainbowArch />
        <div className="relative"><Columbine size={56} className="mx-auto" /><div className="mt-2 font-display text-[24px] leading-7 text-paper">Your weekend starts here</div><p className="mt-1 text-[15px] text-paper/80">Tap the heart on any set and it lands in your plan.</p></div>
      </div>
      <div className="mt-4 space-y-2">
        {headliners(content.artists).map((a) => {
          const set = idx.setsByArtist.get(a.id)?.[0];
          if (!set) return null;
          const stage = idx.stagesById.get(set.stageId)!;
          return (
            <div key={a.id} className="flex items-center gap-3 rounded-card border border-hair bg-surface px-4 py-3">
              <div className="min-w-0 flex-1"><div className="font-display text-[20px] leading-6">{a.name}</div><div className="text-[14px] text-fg-soft tabular-nums">{content.festival.days.find((d) => d.id === set.dayId)?.label.slice(0, 3)} · {formatTime(parseIso(set.start))} · {stage.name}</div></div>
              <Heart on={favorites.includes(set.id)} onToggle={() => toggleFavorite(set.id)} label={`Favorite ${a.name}`} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
