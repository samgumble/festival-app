import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { Content } from "@bb/shared";

const here = dirname(fileURLToPath(import.meta.url));
const src = resolve(here, "../content-2026.json");
const out = resolve(here, "../../../apps/festival/src/data/bundled.json");

const raw: unknown = JSON.parse(readFileSync(src, "utf8"));
const result = Content.safeParse(raw);
if (!result.success) {
  console.error("content-2026.json is invalid:\n" + z.prettifyError(result.error));
  process.exit(1);
}
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(result.data, null, 2) + "\n");
const c = result.data;
console.log(`bundled.json ← ${c.meta.contentVersion}: ${c.artists.length} artists, ${c.sets.length} sets, ${c.stages.length} stages`);
