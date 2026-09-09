import { useState } from "react";
import { PALETTE } from "@bb/shared";
import { Badge, Butterfly, Button, Card, CheckerRibbon, Chip, Columbine, Eyebrow, Heart, Mountains, ProgressBar, RainbowArch, SegmentedControl, SunRays, Toggle } from "@/design";
import { useUiStore } from "@/state/ui";

export function Gallery() {
  const [on, setOn] = useState(false);
  const [day, setDay] = useState<"fri" | "sat" | "sun">("sat");
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  return (
    <div className="space-y-8 py-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-[32px] leading-9 text-structure-2">Design</h1>
        <SegmentedControl label="Theme" value={theme} onChange={setTheme} options={[{ value: "system", label: "Sys" }, { value: "light", label: "☀" }, { value: "dark", label: "☾" }]} />
      </div>
      <section><Eyebrow tone="structure">Color</Eyebrow>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {Object.entries(PALETTE).map(([name, hex]) => (
            <div key={name} className="overflow-hidden rounded-ctl border border-hair bg-surface"><div className="h-10" style={{ background: hex }} /><div className="micro px-2 py-1">{name}</div></div>
          ))}
        </div>
      </section>
      <section className="space-y-2"><Eyebrow tone="structure">Type</Eyebrow>
        <div className="font-display text-[40px] leading-11 text-structure-2">Saturday in Town Park</div>
        <div className="font-shade text-[56px] leading-none text-sun tabular-nums">09 : 04</div>
        <div className="font-display text-[24px] leading-7">Samantha Fish</div>
        <div className="eyebrow text-structure">Now playing · Main Stage</div>
        <p>Favorites become a personal schedule. Overlaps are flagged and you choose which set wins.</p>
        <p className="text-[15px] leading-5 text-fg-soft tabular-nums">4:30 – 5:40 PM · 11:30 AM – 12:30 PM</p>
      </section>
      <section><Eyebrow tone="structure">Ornaments</Eyebrow>
        <CheckerRibbon className="my-3" />
        <div className="relative h-40 overflow-hidden rounded-card bg-night"><RainbowArch /></div>
        <div className="mt-3 flex items-end gap-4"><SunRays size={110} /><Columbine size={72} /><Butterfly /></div>
        <Mountains className="mt-3 h-24" />
      </section>
      <section className="space-y-3"><Eyebrow tone="structure">Primitives</Eyebrow>
        <div className="flex flex-wrap gap-2"><Button variant="sun">Remind me</Button><Button variant="ink">Enable alerts</Button><Button>Share plan</Button><Button variant="sun" size="sm">Jump to now</Button></div>
        <div className="flex flex-wrap gap-2"><Chip tone="sky">Main Stage</Chip><Chip tone="plum">Blues Stage</Chip><Chip tone="pine">Truck</Chip><Chip tone="violet">Camp</Chip><Chip tone="sun">● Now</Chip><Chip tone="ember">Urgent</Chip><Chip tone="paper">Up next</Chip></div>
        <SegmentedControl label="Day" value={day} onChange={setDay} options={[{ value: "fri", label: "Fri" }, { value: "sat", label: "Sat" }, { value: "sun", label: "Sun" }]} />
        <div className="flex items-center gap-3"><Heart on={on} onToggle={() => setOn(!on)} label="Favorite" /><Toggle on={on} onChange={setOn} label="Toggle" /><span className="relative h-6 w-6 rounded-chip bg-surface-2"><Badge count={3} tone="sun" /></span></div>
        <Card><div className="flex items-center gap-2"><Chip tone="sun">● Now</Chip><Eyebrow>Main Stage</Eyebrow><span className="ml-auto text-[15px] text-fg-soft tabular-nums">42 min left</span></div><div className="mt-2 font-display text-[24px] leading-7">Taj Mahal &amp; Keb’ Mo’</div><div className="mt-3"><ProgressBar value={0.62} label="Set progress" /></div></Card>
      </section>
    </div>
  );
}
