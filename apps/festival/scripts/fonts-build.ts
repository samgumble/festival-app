// Converts assets-src/fonts/<family>/*.ttf → public/fonts/<family>/*.woff2 with Homebrew
// woff2_compress (brew install woff2). TTF sources and OFL.txt stay in assets-src; only .woff2
// (and OFL.txt) ship in public/ and are referenced by fonts.css and precached.
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, renameSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

function run(cmd: string, args: string[], remedy: string): void {
  try {
    execFileSync(cmd, args, { stdio: "ignore" });
  } catch (err) {
    if (err instanceof Error && (err as NodeJS.ErrnoException).code === "ENOENT") {
      console.error(`\`${cmd}\` not found. ${remedy}`);
      process.exit(1);
    }
    throw err;
  }
}

const here = dirname(fileURLToPath(import.meta.url));
const srcRoot = resolve(here, "../assets-src/fonts");
const outRoot = resolve(here, "../public/fonts");
let total = 0;
for (const dir of readdirSync(srcRoot).sort()) {
  const full = resolve(srcRoot, dir);
  if (!statSync(full).isDirectory()) continue;
  const outDir = resolve(outRoot, dir);
  mkdirSync(outDir, { recursive: true });
  for (const file of readdirSync(full).filter((f) => f.endsWith(".ttf")).sort()) {
    const ttf = resolve(full, file);
    run("woff2_compress", [ttf], "Install it with `brew install woff2`.");
    // woff2_compress writes its output next to the input TTF; move it into public/fonts/<family>.
    const woff2Name = file.replace(/\.ttf$/, ".woff2");
    const woff2Src = resolve(full, woff2Name);
    const woff2Out = resolve(outDir, woff2Name);
    renameSync(woff2Src, woff2Out);
    const size = statSync(woff2Out).size;
    total += size;
    console.log(`${String(size).padStart(9)}  ${dir}/${woff2Name}`);
  }
}
console.log(`${String(total).padStart(9)}  total`);
