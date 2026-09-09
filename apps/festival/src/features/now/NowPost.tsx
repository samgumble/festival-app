import { Button, Card, Eyebrow } from "@/design";
import { useContent } from "@/data/content";
import { Hero } from "./Hero";

export function NowPost() {
  const { festival } = useContent();
  const share = async () => {
    const text = `Thank you, ${festival.name} ${festival.year}. See you in ${festival.year + 1}. ${festival.links.site}`;
    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch {
        /* user cancelled */
      }
    } else {
      await navigator.clipboard?.writeText(text);
    }
  };
  return (
    <>
      <Hero>
        <div className="absolute inset-x-0 bottom-5 text-center">
          <Eyebrow className="text-fg">That's a wrap</Eyebrow>
          <div className="font-display text-[32px] leading-9 text-structure-2">Thank you, Telluride</div>
          <div className="mt-1 font-shade text-[28px] leading-none text-sun">See you in {festival.year + 1}</div>
        </div>
      </Hero>
      <Card className="mt-4 flex items-center gap-3">
        <div className="flex-1 text-[15px] text-fg-soft">Three days, four stages, one Town Park.</div>
        <Button variant="sun" size="sm" onClick={share}>Share</Button>
      </Card>
    </>
  );
}
