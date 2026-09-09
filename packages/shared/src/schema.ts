import { z } from "zod";

// ISO 8601 with an explicit numeric offset, e.g. 2026-09-18T12:00:00-06:00.
// "Z" and bare wall-clock strings are rejected on purpose (PLAN §3.6).
export const IsoWithOffset = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/, "ISO 8601 with explicit offset");

export const DayId = z.enum(["fri", "sat", "sun"]);
export const Tier = z.enum(["headliner", "featured", "lineup", "comedy", "musicmaker"]);
export const StageColor = z.enum(["sky", "plum", "pine", "violet"]);
export const Severity = z.enum(["info", "important", "urgent"]);

export const FestivalDay = z.object({
  id: DayId,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  label: z.string().min(1),
  gatesOpen: z.string().regex(/^\d{2}:\d{2}$/),
});

export const Festival = z.object({
  year: z.number().int(),
  name: z.string().min(1),
  edition: z.string().min(1),
  venue: z.string().min(1),
  city: z.string().min(1),
  altitudeFt: z.number().int(),
  timezone: z.literal("America/Denver"),
  days: z.array(FestivalDay).min(1),
  links: z.object({
    site: z.url(),
    lineup: z.url(),
    schedule: z.url(),
    faq: z.url(),
    guide: z.url(),
    tickets: z.url().optional(),
  }),
  announcement: z
    .object({ text: z.string().min(1).max(160), url: z.url().optional(), active: z.boolean() })
    .optional(),
});

export const Stage = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  shortName: z.string().min(1),
  color: StageColor,
  sortOrder: z.number().int(),
});

export const Artist = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  tier: Tier,
  blurb: z.string().optional(),
  links: z.object({ site: z.url().optional(), spotify: z.url().optional(), apple: z.url().optional() }).optional(),
  imageId: z.string().optional(),
});

export const FestivalSet = z
  .object({
    id: z.string().min(1),
    artistId: z.string().min(1),
    stageId: z.string().min(1),
    dayId: DayId,
    start: IsoWithOffset,
    end: IsoWithOffset,
    note: z.string().optional(),
  })
  .refine((s) => Date.parse(s.end) > Date.parse(s.start), { message: "end must be after start", path: ["end"] });

export const ContentMeta = z.object({
  contentVersion: z.string().min(1),
  publishedAt: IsoWithOffset,
  publishedBy: z.string().min(1),
  sources: z.array(z.url()),
});

function assertUnique(ctx: z.RefinementCtx, ids: string[], label: string) {
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) ctx.addIssue({ code: "custom", message: `duplicate ${label} id "${id}"` });
    seen.add(id);
  }
}

export const Content = z
  .object({
    meta: ContentMeta,
    festival: Festival,
    stages: z.array(Stage).min(1),
    artists: z.array(Artist).min(1),
    sets: z.array(FestivalSet),
  })
  .superRefine((c, ctx) => {
    assertUnique(ctx, c.stages.map((s) => s.id), "stage");
    assertUnique(ctx, c.artists.map((a) => a.id), "artist");
    assertUnique(ctx, c.sets.map((s) => s.id), "set");
    const stageIds = new Set(c.stages.map((s) => s.id));
    const artistIds = new Set(c.artists.map((a) => a.id));
    const dayIds = new Set(c.festival.days.map((d) => d.id));
    c.sets.forEach((s, i) => {
      if (!stageIds.has(s.stageId)) ctx.addIssue({ code: "custom", path: ["sets", i, "stageId"], message: `unknown stageId "${s.stageId}"` });
      if (!artistIds.has(s.artistId)) ctx.addIssue({ code: "custom", path: ["sets", i, "artistId"], message: `unknown artistId "${s.artistId}"` });
      if (!dayIds.has(s.dayId)) ctx.addIssue({ code: "custom", path: ["sets", i, "dayId"], message: `unknown dayId "${s.dayId}"` });
    });
  });

export const Alert = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(60),
  body: z.string().min(1).max(240),
  severity: Severity,
  url: z.url().optional(),
  publishedAt: IsoWithOffset,
  publishedBy: z.string().min(1),
  expiresAt: IsoWithOffset.optional(),
  push: z.boolean(),
  pushSentAt: IsoWithOffset.optional(),
  pushMessageId: z.string().optional(),
});

export type DayId = z.infer<typeof DayId>;
export type Tier = z.infer<typeof Tier>;
export type StageColor = z.infer<typeof StageColor>;
export type Severity = z.infer<typeof Severity>;
export type FestivalDay = z.infer<typeof FestivalDay>;
export type Festival = z.infer<typeof Festival>;
export type Stage = z.infer<typeof Stage>;
export type Artist = z.infer<typeof Artist>;
export type FestivalSet = z.infer<typeof FestivalSet>;
export type Content = z.infer<typeof Content>;
export type Alert = z.infer<typeof Alert>;
