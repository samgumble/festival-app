import { useState } from "react";
import { asset } from "@/app/assets";
import type { ReactNode } from "react";
import { Button, Card, Eyebrow, SegmentedControl, Toggle } from "@/design";
import { useContent, useContentStatus } from "@/data/content";
import { formatTime, fromDenver, parseIso } from "@/domain/time";
import { useAlertsStore } from "@/state/alerts";
import { usePlanStore } from "@/state/plan";
import { useUiStore } from "@/state/ui";
import { InstallSheet } from "./InstallSheet";
import { useInstall } from "@/platform/install";
import { useUpdateStore } from "@/state/updates";

// Inline text buttons in an 18 px line: extend the hit area invisibly to the 44 px floor (18 + 13 + 13).
const INLINE_LINK = "relative inline-block underline before:absolute before:inset-x-0 before:-inset-y-[13px] before:content-['']";

const FONTS = [
  ["Bungee", "SIL Open Font License 1.1"], ["Bungee Shade", "SIL Open Font License 1.1"],
  ["Michroma", "SIL Open Font License 1.1"], ["DM Sans", "SIL Open Font License 1.1"],
];

function Row({ label, children, href }: { label: string; children?: ReactNode; href?: string }) {
  const inner = <><span className="flex-1 text-[15px]">{label}</span><span className="text-[14px] text-fg-soft">{children}</span></>;
  return href ? (
    <a href={href} target="_blank" rel="noreferrer" className="flex items-center gap-3 border-b border-hair py-3 last:border-b-0">{inner}</a>
  ) : (
    <div className="flex items-center gap-3 border-b border-hair py-3 last:border-b-0">{inner}</div>
  );
}

export function InfoScreen() {
  const { festival, meta } = useContent();
  const status = useContentStatus();
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  const { settings, setSettings } = usePlanStore();
  const { pushOptIn, setPushOptIn } = useAlertsStore();
  const [licenses, setLicenses] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const install = useInstall();
  const offlineReady = useUpdateStore((s) => s.offlineReady);
  // DEV-only: `?install=ios` forces the iOS path with the sheet open, for screenshots.
  const forcedIos = import.meta.env.DEV && new URLSearchParams(window.location.search).get("install") === "ios";
  const [installSheet, setInstallSheet] = useState(forcedIos);
  const installMode = forcedIos ? "ios" : install.mode;
  const first = festival.days[0]!, last = festival.days[festival.days.length - 1]!;
  return (
    <div className="pt-3">
      <h1 className="font-display text-[32px] leading-9 text-structure-2">Info</h1>
      <Card padded={false} className="mt-2.5 overflow-hidden">
        <div className="bg-night px-4 pb-2.5 pt-3.5 text-center"><img src={asset("/art/dates.webp")} alt={`September ${Number(first.date.slice(8))}–${Number(last.date.slice(8))}, ${festival.year}`} className="mx-auto w-[80%]" /></div>
        <div className="px-4">
          <Row label="Gates">{formatTime(fromDenver(first.date, first.gatesOpen))} daily</Row>
          <Row label="Venue">{festival.venue}</Row>
          <Row label="Altitude">{festival.altitudeFt.toLocaleString()} ft — hydrate</Row>
        </div>
      </Card>

      {(installMode === "prompt" || installMode === "ios") && (
        <>
          <Eyebrow tone="structure" className="mt-4 block px-0.5">Get the app</Eyebrow>
          <Card className="mt-1.5 flex items-center gap-3">
            <div className="flex-1 text-[14px] leading-5 text-fg-soft">Works offline at the venue once it's on your home screen.</div>
            <Button variant="ink" size="sm" className="shrink-0" onClick={() => (installMode === "prompt" ? void install.prompt() : setInstallSheet(true))}>Add to Home Screen</Button>
          </Card>
        </>
      )}
      {installSheet && <InstallSheet onClose={() => setInstallSheet(false)} />}

      <Eyebrow tone="structure" className="mt-4 block px-0.5">Official links</Eyebrow>
      <Card padded={false} className="mt-1.5 px-4 py-1">
        <Row label="tellurideblues.com" href={festival.links.site}>↗</Row>
        <Row label="Lineup" href={festival.links.lineup}>↗</Row>
        <Row label="Schedule" href={festival.links.schedule}>↗</Row>
        <Row label="FAQ" href={festival.links.faq}>↗</Row>
        <Row label="Festival guide" href={festival.links.guide}>↗</Row>
        <Row label="Town Park in Maps" href={`https://maps.apple.com/?q=${encodeURIComponent(`${festival.venue}, ${festival.city}`)}`}>↗</Row>
      </Card>

      <Eyebrow tone="structure" className="mt-4 block px-0.5">Settings</Eyebrow>
      <Card padded={false} className="mt-1.5 px-4 py-1">
        <Row label="Festival alerts"><Toggle on={pushOptIn} onChange={setPushOptIn} label="Festival alerts" /></Row>
        <Row label="Set reminders"><SegmentedControl label="Reminder lead time" value={String(settings.leadMinutes)} onChange={(v) => setSettings({ leadMinutes: Number(v) as 5 | 15 | 30 })} options={[{ value: "5", label: "5" }, { value: "15", label: "15" }, { value: "30", label: "30" }]} /></Row>
        <Row label="Appearance"><SegmentedControl label="Appearance" value={theme} onChange={setTheme} options={[{ value: "system", label: "Auto" }, { value: "light", label: "Light" }, { value: "dark", label: "Dark" }]} /></Row>
      </Card>

      <Card className="mt-4 flex items-center gap-3">
        <img src={asset("/art/sbg.webp")} alt="SBG Productions" className="h-11 w-11 rounded-[10px]" />
        <div className="flex-1 text-[13px] leading-[18px] text-fg-soft">Official app of the {festival.name}<br />© {festival.year} SBG Productions ·{" "}
          <button type="button" className={INLINE_LINK} onClick={() => setPrivacy(!privacy)}>Privacy</button> ·{" "}
          <button type="button" className={INLINE_LINK} onClick={() => setLicenses(!licenses)}>Licenses</button>
        </div>
      </Card>
      {privacy && (
        <Card className="mt-2 text-[14px] leading-5 text-fg-soft">No accounts. No analytics or ads. Your favorites, plan, and settings stay on this device. Festival alerts are delivered by the organizer; enabling notifications later uses Firebase Cloud Messaging solely to deliver them.</Card>
      )}
      {licenses && (
        <Card className="mt-2 text-[14px] leading-5 text-fg-soft">{FONTS.map(([f, l]) => <div key={f}><b className="text-fg">{f}</b> — {l}</div>)}<div className="mt-1">Poster artwork © SBG Productions, used with permission.</div></Card>
      )}
      <p className="mt-4 text-center eyebrow text-fg-soft">
        Content v{status.contentVersion} · {status.source === "live" ? "live" : status.source === "cache" ? "cached" : "bundled"}
        {" · updated "}{formatTime(parseIso(status.updatedAt ?? meta.publishedAt))} · app {__APP_VERSION__}{offlineReady && " · offline-ready ✓"}
      </p>
    </div>
  );
}
