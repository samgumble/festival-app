import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";

const root = resolve(process.argv[2] || ".");
const port = Number(process.argv[3] || 4173);
const types = {".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"text/javascript; charset=utf-8",".json":"application/json; charset=utf-8",".webmanifest":"application/manifest+json",".png":"image/png",".svg":"image/svg+xml"};
createServer(async (req,res) => {
  try {
    const path = normalize(join(root, decodeURIComponent(new URL(req.url, "http://localhost").pathname)));
    if (!path.startsWith(root)) throw new Error("Invalid path");
    let target = path; if ((await stat(target)).isDirectory()) target = join(target,"index.html");
    const body = await readFile(target); res.writeHead(200,{"Content-Type":types[extname(target)] || "application/octet-stream","Cache-Control":"no-cache"}); res.end(body);
  } catch (_) { res.writeHead(404,{"Content-Type":"text/plain"}); res.end("Not found"); }
}).listen(port, () => console.log(`Festival app: http://localhost:${port}`));
