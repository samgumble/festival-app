import { cp, mkdir, rm } from "node:fs/promises";

const output = new URL("../dist/", import.meta.url);
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const file of ["index.html", "styles.css", "app.js", "manifest.webmanifest", "sw.js", "admin.html", "admin.css", "admin.js", "privacy.html"]) {
  await cp(new URL(`../${file}`, import.meta.url), new URL(file, output));
}
await cp(new URL("../assets", import.meta.url), new URL("assets", output), { recursive: true });
await cp(new URL("../data", import.meta.url), new URL("data", output), { recursive: true });
console.log("Built static app to dist/");
