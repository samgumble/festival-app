import { Card, Eyebrow } from "@/design";
import { useContent } from "@/data/content";
import { Hero } from "./Hero";

export function NowPost() {
  const { festival } = useContent();
  return (
    <>
      <Hero />
      <Card className="mt-3 text-center">
        <Eyebrow tone="structure">That's a wrap</Eyebrow>
        <div className="font-display text-[32px] leading-9 text-structure">Thank you, Telluride</div>
        <div className="mt-1 font-display text-[28px] leading-none text-structure">See you in {festival.year + 1}</div>
      </Card>
    </>
  );
}
