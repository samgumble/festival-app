import type { Artist, Festival, FestivalSet, Stage } from "@bb/shared";
import { formatRange, isoMs, parseIso } from "./time";

const utcStamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

export function planToIcs(sets: FestivalSet[], artistsById: Map<string, Artist>, stagesById: Map<string, Stage>, festival: Festival): string {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//SBG Productions//Telluride Blues & Brews//EN", "CALSCALE:GREGORIAN"];
  const stamp = utcStamp(new Date());
  for (const s of [...sets].sort((a, b) => isoMs(a.start) - isoMs(b.start))) {
    const artist = artistsById.get(s.artistId)?.name ?? s.artistId;
    const stage = stagesById.get(s.stageId)?.name ?? s.stageId;
    lines.push(
      "BEGIN:VEVENT",
      `UID:${s.id}@bluesandbrews`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${utcStamp(parseIso(s.start))}`,
      `DTEND:${utcStamp(parseIso(s.end))}`,
      `SUMMARY:${esc(artist)}`,
      `LOCATION:${esc(`${stage}, ${festival.venue}`)}`,
      `DESCRIPTION:${esc(`${festival.name} — ${festival.edition}`)}`,
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}

export function planToText(sets: FestivalSet[], artistsById: Map<string, Artist>, stagesById: Map<string, Stage>, festival: Festival): string {
  const out = [`My ${festival.name} plan`];
  for (const day of festival.days) {
    const daySets = sets.filter((s) => s.dayId === day.id).sort((a, b) => isoMs(a.start) - isoMs(b.start));
    if (daySets.length === 0) continue;
    out.push("", day.label);
    for (const s of daySets) {
      const artist = artistsById.get(s.artistId)?.name ?? s.artistId;
      const stage = stagesById.get(s.stageId)?.name ?? s.stageId;
      out.push(`${formatRange(parseIso(s.start), parseIso(s.end))} · ${artist} · ${stage}`);
    }
  }
  out.push("", festival.links.site);
  return out.join("\n");
}
