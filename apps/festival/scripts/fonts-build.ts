// Converts public/fonts/*/*.ttf → .woff2 with Homebrew woff2_compress (brew install woff2).
// TTF sources and OFL.txt stay in the repo; only .woff2 is referenced by fonts.css and precached.
import { execFileSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const fonts = resolve(here, "../public/fonts");
let total = 0;
for (const dir of readdirSync(fonts).sort()) {
  const full = resolve(fonts, dir);
  if (!statSync(full).isDirectory()) continue;
  for (const file of readdirSync(full).filter((f) => f.endsWith(".ttf")).sort()) {
    const ttf = resolve(full, file);
    execFileSync("woff2_compress", [ttf], { stdio: "ignore" });
    const woff2 = ttf.replace(/\.ttf$/, ".woff2");
    const size = statSync(woff2).size;
    total += size;
    console.log(`${String(size).padStart(9)}  ${dir}/${file.replace(/\.ttf$/, ".woff2")}`);
  }
}
console.log(`${String(total).padStart(9)}  total`);
