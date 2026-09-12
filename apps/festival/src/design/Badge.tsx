export function Badge({ count, tone = "ember" }: { count: number; tone?: "sun" | "ember" }) {
  if (count <= 0) return null;
  return (
    <span className={`absolute -top-1 left-[calc(50%+6px)] min-w-4 rounded-chip px-1 text-center text-[10px] font-bold leading-4 ${tone === "sun" ? "bg-sun text-ink" : "bg-ember-deep text-white"}`}>
      {count > 99 ? "99+" : count}
    </span>
  );
}
