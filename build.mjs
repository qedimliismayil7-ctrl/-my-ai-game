// Yığım: public/ qovluğunu və src/server.js-i tək dist/worker.js faylına birləşdirir.
// İstifadə: node build.mjs   →   dist/worker.js (Cloudflare redaktoruna yapışdırmaq və ya wrangler deploy üçün)
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = new URL(".", import.meta.url).pathname;
const PUB = join(ROOT, "public");
const BINARY = new Set(["png", "jpg", "jpeg", "gif", "webp", "ico", "woff", "woff2"]);

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    if (name.startsWith("_") || name.startsWith(".")) return [];
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const assets = {};
let total = 0;
for (const file of walk(PUB).sort()) {
  const path = "/" + relative(PUB, file).split(sep).join("/");
  const ext = path.split(".").pop().toLowerCase();
  const buf = readFileSync(file);
  total += buf.length;
  assets[path] = BINARY.has(ext) ? { b64: true, body: buf.toString("base64") } : { body: buf.toString("utf8") };
}
if (!assets["/index.html"]) throw new Error("public/index.html tapılmadı");

const server = readFileSync(join(ROOT, "src", "server.js"), "utf8");
const out = "// Bu fayl build.mjs ilə avtomatik yaradılıb — redaktə etməyin, public/ və src/ qovluqlarını dəyişin.\n" +
  "const ASSETS = " + JSON.stringify(assets) + ";\n\n" + server;
mkdirSync(join(ROOT, "dist"), { recursive: true });
writeFileSync(join(ROOT, "dist", "worker.js"), out);
console.log(`dist/worker.js: ${Object.keys(assets).length} fayl, ${(total / 1024).toFixed(0)} KB mənbə → ${(out.length / 1024).toFixed(0)} KB`);
