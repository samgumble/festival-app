// Converts assets-src/art/*.png → public/art/*.webp with Homebrew cwebp. Alpha PNGs (incl. the
// official lockup, which must ship unmodified) are lossless; opaque poster crops use -q 82.
// Run from apps/festival: `npm run art:build`. Fails when the WebP set exceeds the budget.
import { execFileSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ART_BUDGET_BYTES = 1_000_000;

export function checkBudget(sizes: Record<string, number>, budget: number = ART_BUDGET_BYTES): { total: number; ok: boolean } {
  const total = Object.values(sizes).reduce((a, b) => a + b, 0);
  return { total, ok: total <= budget };
}

function run(cmd: string, args: string[], remedy: string, opts: Parameters<typeof execFileSync>[2] = {}): Buffer | string {
  try {
    return execFileSync(cmd, args, opts);
  } catch (err) {
    if (err instanceof Error && (err as NodeJS.ErrnoException).code === "ENOENT") {
      console.error(`\`${cmd}\` not found. ${remedy}`);
      process.exit(1);
    }
    throw err;
  }
}

function hasAlpha(png: string): boolean {
  return run("sips", ["-g", "hasAlpha", png], "sips is macOS built-in; run this script on a Mac.", { encoding: "utf8" }).toString().includes("hasAlpha: yes");
}

function main(): void {
  const here = dirname(fileURLToPath(import.meta.url));
  const art = resolve(here, "../assets-src/art");
  const outDir = resolve(here, "../public/art");
  const sizes: Record<string, number> = {};
  for (const file of readdirSync(art).filter((f) => f.endsWith(".png")).sort()) {
    const src = resolve(art, file);
    const out = resolve(outDir, `${basename(file, ".png")}.webp`);
    const args = hasAlpha(src) ? ["-quiet", "-lossless", src, "-o", out] : ["-quiet", "-q", "82", src, "-o", out];
    run("cwebp", args, "Install it with `brew install webp`.", { stdio: "inherit" });
    sizes[basename(out)] = statSync(out).size;
  }
  const { total, ok } = checkBudget(sizes);
  for (const [name, size] of Object.entries(sizes)) console.log(`${String(size).padStart(9)}  ${name}`);
  console.log(`${String(total).padStart(9)}  total (budget ${ART_BUDGET_BYTES})`);
  if (!ok) {
    console.error(`Art budget exceeded by ${total - ART_BUDGET_BYTES} bytes.`);
    process.exit(1);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
