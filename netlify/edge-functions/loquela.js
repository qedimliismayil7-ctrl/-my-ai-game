// Loquela on Netlify: runs the same Worker bundle (dist/worker.js) as a Netlify Edge Function.
// Secrets come from Netlify → Site configuration → Environment variables
// (GEMINI_KEY, ACCESS_CODE, TG_TOKEN, TG_ALLOWED, MODEL, API_LIMIT, GRAMMAR_LIMIT, LIB_LIMIT, SETUP_KEY).
import worker from "../../dist/worker.js";

const KEYS = ["GEMINI_KEY", "ACCESS_CODE", "TG_TOKEN", "TG_ALLOWED", "MODEL", "API_LIMIT", "GRAMMAR_LIMIT", "LIB_LIMIT", "SETUP_KEY"];

// The Worker caches library pages in Cloudflare's caches.default; Netlify has no such cache, so it gets a no-op one.
const noCache = { match: async () => undefined, put: async () => {}, delete: async () => false };
try {
  if (typeof globalThis.caches === "undefined") globalThis.caches = { default: noCache };
  else if (!globalThis.caches.default) Object.defineProperty(globalThis.caches, "default", { value: noCache });
} catch (e) { /* leave caching off */ }

function readEnv() {
  const env = {};
  for (const k of KEYS) {
    let v;
    try { v = globalThis.Netlify && Netlify.env ? Netlify.env.get(k) : undefined; } catch (e) { v = undefined; }
    if (v == null && typeof Deno !== "undefined") { try { v = Deno.env.get(k); } catch (e) { v = undefined; } }
    if (v != null && v !== "") env[k] = v;
  }
  return env;
}

export default async (request, context) => {
  const ctx = { waitUntil: (p) => (context && typeof context.waitUntil === "function" ? context.waitUntil(p) : p) };
  return worker.fetch(request, readEnv(), ctx);
};

export const config = { path: "/*" };
