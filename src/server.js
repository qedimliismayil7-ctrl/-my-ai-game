// ===================================================================
//  Nuanza — tərcüməçinin iş masası (sayt + Telegram botu)
//  Cloudflare Worker. Settings → Variables and Secrets:
//    GEMINI_KEY  — məcburi (Secret). aistudio.google.com açarı
//    TG_TOKEN    — istəyə bağlı (Secret). Telegram @BotFather açarı
//    ACCESS_CODE — istəyə bağlı, amma tövsiyə olunur. Sayta və /setup-a giriş kodu
//    MODEL       — istəyə bağlı. Standart: gemini-flash-latest
//    TG_ALLOWED  — istəyə bağlı. Botdan istifadə edə bilən Telegram ID-ləri, vergüllə
//    API_LIMIT   — istəyə bağlı. Bir IP üçün 10 dəqiqədə AI sorğusu (standart 40)
//  Quraşdırmadan sonra bir dəfə açın:  https://SIZIN-UNVAN/setup?key=ACCESS_CODE
//  Bu fayl build.mjs ilə yığılır: ASSETS obyekti public/ qovluğundan gəlir.
// ===================================================================

const ORTHO = "All Azerbaijani text must use standard Azerbaijani Latin orthography with ə ğ ı ö ü ş ç — never Turkish words, forms or spellings.";
const MAX_PROMPT = 30000;
const SW = "self.addEventListener('install',function(){self.skipWaiting()});self.addEventListener('activate',function(e){e.waitUntil(self.clients.claim())});";
const MANIFEST = {
  name: "Nuanza — tərcüməçinin iş masası", short_name: "Nuanza", lang: "az", start_url: "/", display: "standalone",
  background_color: "#0A0B0E", theme_color: "#0A0B0E",
  icons: [{ src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }, { src: "/icon.svg", sizes: "any", type: "image/svg+xml" }]
};
const FF = [
  ["actual", "faktiki, həqiqi", "«aktual» deyil"], ["sympathetic", "rəğbət bəsləyən, anlayışlı", "«simpatik» deyil"],
  ["accurate", "dəqiq", "«akkurat» deyil"], ["magazine", "jurnal", "«mağaza» deyil"], ["fabric", "parça", "«fabrik» deyil"],
  ["artist", "rəssam, sənətkar", "«artist» (aktyor) deyil"], ["decade", "onillik", "«dekada» (on gün) deyil"],
  ["intelligent", "ağıllı", "«ziyalı» deyil"], ["prospect", "perspektiv", "«prospekt» deyil"], ["cabinet", "şkaf; nazirlər kabineti", "«iş otağı» deyil"],
  ["replica", "surət, nüsxə", "«replika» deyil"], ["genial", "mehriban, səmimi", "«dahiyanə» deyil"], ["obligation", "öhdəlik", "«obliqasiya» deyil"],
  ["pathetic", "acınacaqlı", "«patetik» deyil"], ["principal", "əsas; direktor", "«prinsipial» deyil"], ["lunatic", "dəli", "«lunatik» deyil"]
];

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url), p = url.pathname;
    try {
      if (p === "/api") return request.method === "POST" ? handleApi(request, env) : json({ error: "method" }, 405);
      if (p === "/tg") return request.method === "POST" ? handleTelegram(request, env, ctx) : new Response("ok");
      if (p === "/setup") return handleSetup(request, env, url);
      if (p === "/health") return json({ ok: true, ai: !!env.GEMINI_KEY, bot: !!env.TG_TOKEN, locked: !!env.ACCESS_CODE });
      if (p === "/manifest.webmanifest") return json(MANIFEST, 200, { "content-type": "application/manifest+json", "cache-control": "public, max-age=3600" });
      if (p === "/sw.js") return new Response(SW, { headers: { "content-type": "text/javascript; charset=utf-8", "cache-control": "no-cache" } });
      if (request.method !== "GET" && request.method !== "HEAD") return new Response("Tapılmadı", { status: 404 });
      return serveAsset(p === "/" ? "/index.html" : p);
    } catch (e) {
      return new Response("Xəta baş verdi", { status: 500 });
    }
  }
};

// ---------- Statik fayllar ----------
const TYPES = { html: "text/html; charset=utf-8", css: "text/css; charset=utf-8", js: "text/javascript; charset=utf-8", svg: "image/svg+xml", png: "image/png", json: "application/json" };
function serveAsset(path) {
  const a = ASSETS[path];
  if (!a) return new Response("Tapılmadı", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
  const ext = path.split(".").pop();
  const headers = {
    "content-type": TYPES[ext] || "application/octet-stream",
    "cache-control": ext === "html" ? "no-cache" : "public, max-age=300",
    "x-content-type-options": "nosniff",
    "referrer-policy": "strict-origin-when-cross-origin"
  };
  if (ext === "html") headers["content-security-policy"] = "frame-ancestors 'self' https://web.telegram.org https://*.telegram.org";
  return new Response(a.b64 ? b64bytes(a.body) : a.body, { headers });
}

// ---------- Köməkçilər ----------
function json(o, status, extra) { return new Response(JSON.stringify(o), { status: status || 200, headers: Object.assign({ "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }, extra || {}) }); }
function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
function b64bytes(b) { const s = atob(b), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; }
function parseJSON(t) {
  t = String(t).trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  try { return JSON.parse(t); } catch (e) {}
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  if (a >= 0 && b > a) { try { return JSON.parse(t.slice(a, b + 1)); } catch (e) {} }
  return null;
}
async function sha(text) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(d)).map(function (b) { return b.toString(16).padStart(2, "0"); }).join("");
}
function sameText(a, b) {
  a = String(a || ""); b = String(b || "");
  if (a.length !== b.length) return false;
  let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

// Sadə sorğu limiti (hər Worker nüsxəsində ayrıca saxlanır — qəza qoruyucusu kimi işləyir).
const BUCKETS = new Map();
function allow(key, limit, windowMs) {
  const now = Date.now();
  let b = BUCKETS.get(key);
  if (!b || now - b.t > windowMs) { b = { t: now, n: 0 }; BUCKETS.set(key, b); }
  b.n++;
  if (BUCKETS.size > 5000) BUCKETS.clear();
  return b.n <= limit;
}
function clientIp(request) { return request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "unknown"; }

// ---------- Gemini ----------
async function gemini(env, prompt, speed) {
  if (!env.GEMINI_KEY) throw { code: "not_configured", status: 500 };
  const models = [env.MODEL || "gemini-flash-latest", "gemini-flash-lite-latest"];
  const variants = [];
  if (speed === "fast") variants.push({ thinkingLevel: "minimal" }, { thinkingBudget: 0 });
  else if (speed !== "deep") variants.push({ thinkingLevel: "low" }, { thinkingBudget: 1024 });
  variants.push(null);
  let last = { code: "server_error", status: 502 };
  for (const m of models) {
    let vi = 0, retried = false;
    while (vi < variants.length) {
      const gc = { responseMimeType: "application/json", temperature: 0.4, maxOutputTokens: 8192 };
      if (variants[vi]) gc.thinkingConfig = variants[vi];
      let r;
      try {
        r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(m) + ":generateContent", {
          method: "POST",
          headers: { "content-type": "application/json", "x-goog-api-key": env.GEMINI_KEY },
          body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: gc })
        });
      } catch (e) { last = { code: "server_error", status: 502 }; break; }
      if (r.status === 400 && variants[vi]) { vi++; continue; }
      if (r.status === 429 || r.status === 503) { last = { code: "rate_limited", status: 429 }; if (!retried) { retried = true; await sleep(2000); continue; } break; }
      if (r.status === 404) { last = { code: "model_unavailable", status: 502 }; break; }
      if (r.status === 400 || r.status === 403) { last = { code: r.status === 403 ? "not_configured" : "server_error", status: 502 }; break; }
      if (!r.ok) { last = { code: "server_error", status: 502 }; break; }
      let j = null; try { j = await r.json(); } catch (e) {}
      const c = j && j.candidates && j.candidates[0];
      const txt = ((c && c.content && c.content.parts) || []).filter(function (x) { return !x.thought; }).map(function (x) { return x.text || ""; }).join("");
      if (!txt) { last = { code: (j && j.promptFeedback && j.promptFeedback.blockReason) ? "refused" : "empty_completion", status: 502 }; break; }
      const parsed = parseJSON(txt);
      if (parsed == null) { last = { code: "invalid_json", status: 502 }; break; }
      return parsed;
    }
    if (last.code === "not_configured" || last.code === "refused") break;
  }
  throw last;
}

async function handleApi(request, env) {
  if (env.ACCESS_CODE && !sameText(request.headers.get("x-access-code") || "", env.ACCESS_CODE)) return json({ error: "bad_code" }, 401);
  const limit = parseInt(env.API_LIMIT, 10) || 40;
  if (!allow("api:" + clientIp(request), limit, 10 * 60 * 1000)) return json({ error: "rate_limited" }, 429);
  let body = null; try { body = await request.json(); } catch (e) {}
  const prompt = String((body && body.prompt) || "");
  if (!prompt) return json({ error: "invalid_request" }, 400);
  if (prompt.length > MAX_PROMPT) return json({ error: "prompt_too_large" }, 400);
  const speed = ["fast", "normal", "deep"].indexOf(body && body.speed) >= 0 ? body.speed : "normal";
  try { return json({ ok: true, data: await gemini(env, prompt, speed) }); }
  catch (e) { return json({ error: e.code || "server_error" }, e.status || 502); }
}

// ---------- Telegram ----------
function hx(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
async function tgSecret(token) { return (await sha("nuanza-tg:" + token)).slice(0, 48); }
async function tg(env, method, payload) {
  try {
    const r = await fetch("https://api.telegram.org/bot" + env.TG_TOKEN + "/" + method, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload || {}) });
    return await r.json();
  } catch (e) { return { ok: false }; }
}
async function send(env, chat, html, markup) {
  const base = { chat_id: chat, disable_web_page_preview: true };
  if (markup) base.reply_markup = markup;
  const r = await tg(env, "sendMessage", Object.assign({ text: html.slice(0, 4000), parse_mode: "HTML" }, base));
  if (!r.ok) await tg(env, "sendMessage", Object.assign({ text: html.replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").slice(0, 4000) }, base));
  return r;
}
function menu(origin) {
  return { inline_keyboard: [
    [{ text: "Nuanzanı aç", web_app: { url: origin + "/" } }],
    [{ text: "Tərcüməmi yoxla", callback_data: "help_check" }, { text: "Termin axtar", callback_data: "help_term" }],
    [{ text: "Yalançı dostlar", callback_data: "ff" }, { text: "Necə işləyir", callback_data: "help" }]
  ] };
}
function grade(s) { return s >= 91 ? ["A", "əla"] : s >= 81 ? ["B", "çox yaxşı"] : s >= 71 ? ["C", "yaxşı"] : s >= 61 ? ["D", "kafi"] : s >= 51 ? ["E", "qənaətbəxş"] : ["F", "qeyri-kafi"]; }
function errMsg(e) {
  const c = e && e.code;
  if (c === "rate_limited") return "Limit doldu — bir az sonra yenidən yazın.";
  if (c === "not_configured") return "Bot hələ tam qurulmayıb — Gemini açarı yoxdur.";
  if (c === "refused") return "Bu mətni emal edə bilmədim. Mətni dəyişib yenidən göndərin.";
  return "Xəta baş verdi. Bir az sonra yenidən cəhd edin.";
}
function detectPair(t) {
  if (/[А-Яа-яЁё]/.test(t)) return ["Russian", "Azerbaijani"];
  if (/[əƏ]/.test(t) || /(^|\s)(və|bu|ilə|deyil|olan|mən|sən|üçün)(\s|$|[.,!?])/i.test(t)) return ["Azerbaijani", "English"];
  return ["English", "Azerbaijani"];
}
async function handleTelegram(request, env, ctx) {
  if (!env.TG_TOKEN) return new Response("ok");
  if (!sameText(request.headers.get("x-telegram-bot-api-secret-token") || "", await tgSecret(env.TG_TOKEN))) return new Response("forbidden", { status: 403 });
  let upd = null; try { upd = await request.json(); } catch (e) { return new Response("ok"); }
  const origin = new URL(request.url).origin;
  ctx.waitUntil(processUpdate(env, upd, origin).catch(function () {}));
  return new Response("ok");
}
function allowedUser(env, from) {
  if (!env.TG_ALLOWED) return true;
  const ids = String(env.TG_ALLOWED).split(/[\s,]+/).filter(Boolean);
  return !!(from && ids.indexOf(String(from.id)) >= 0);
}
async function processUpdate(env, upd, origin) {
  if (upd.callback_query) {
    const q = upd.callback_query;
    await tg(env, "answerCallbackQuery", { callback_query_id: q.id });
    const chat = q.message && q.message.chat && q.message.chat.id;
    if (!chat) return;
    if (!allowedUser(env, q.from)) return send(env, chat, "Bu bot hələ yalnız dəvət olunanlar üçündür.");
    return command(env, chat, String(q.data || ""), origin);
  }
  const m = upd.message; if (!m || !m.chat) return;
  const chat = m.chat.id, text = String(m.text || "").trim();
  if (!allowedUser(env, m.from)) return send(env, chat, "Bu bot hələ yalnız dəvət olunanlar üçündür.");
  if (!text) return send(env, chat, "Mənə mətn göndərin — tərcümə edim. Menyu üçün /start yazın.");
  if (text.charAt(0) === "/") return command(env, chat, text, origin);
  if (!allow("tg:" + chat, 20, 10 * 60 * 1000)) return send(env, chat, "Çox sürətli yazırsınız — 10 dəqiqə sonra yenidən cəhd edin.");
  if (/\n\s*-{3,}\s*\n/.test(text)) return check(env, chat, text);
  return translate(env, chat, text);
}
async function command(env, chat, t, origin) {
  const parts = t.trim().split(/\s+/), c = parts[0].toLowerCase().replace(/@.*$/, ""), arg = parts.slice(1).join(" ").trim();
  if (c === "/start" || c === "/menu")
    return send(env, chat, "<b>Salam! Mən Nuanzayam</b> — tərcüməçinin köməkçisi.\n\nMənə mətn göndərin: tərcümə edim, işlənən transformasiyaları və terminləri göstərim.\n\nTam iş masası — layihələr, redaktor, keyfiyyət yoxlaması, Mirzə Məclisi və Akademiya — aşağıdakı düymədədir.", menu(origin));
  if (c === "help")
    return send(env, chat, "<b>Nə edə bilərəm</b>\n\n• Mətn göndərin — tərcümə, transformasiyalar, terminlər\n• Mənbə, ayrıca sətirdə <code>---</code>, sonra öz tərcüməniz — 100 ballıq qiymət və səhvlər\n• <code>/termin söz</code> — termin izahı və qarşılıqları\n• /dost — yalançı dostlar\n\nMüştəri sənədlərini, şəxsiyyət vəsiqəsi və pasport məlumatlarını bura göndərməyin.", menu(origin));
  if (c === "/termin" || c === "help_term") {
    if (!arg) return send(env, chat, "Termini belə yazın:\n<code>/termin due diligence</code>");
    if (!allow("tg:" + chat, 20, 10 * 60 * 1000)) return send(env, chat, "Çox sürətli yazırsınız — 10 dəqiqə sonra yenidən cəhd edin.");
    return term(env, chat, arg);
  }
  if (c === "/yoxla" || c === "help_check")
    return send(env, chat, "Tərcümənizi yoxlatmaq üçün bir mesajda göndərin:\n\n<i>mənbə mətn</i>\n<code>---</code>\n<i>sizin tərcüməniz</i>\n\n100 ballıq qiymət, səhvlər və düzəldilmiş variant alacaqsınız.");
  if (c === "/dost" || c === "ff")
    return send(env, chat, "<b>Yalançı dostlar</b>\n\n" + FF.map(function (x) { return "• <b>" + hx(x[0]) + "</b> — " + hx(x[1]) + " (" + hx(x[2]) + ")"; }).join("\n"));
  return send(env, chat, "Bu əmri tanımadım. Menyu üçün /start yazın.");
}
async function translate(env, chat, text) {
  if (text.length > 3500) return send(env, chat, "Mətn çox uzundur — 3500 simvola qədər göndərin və ya tam proqramı açın.");
  const pr = detectPair(text), A = pr[0], B = pr[1];
  await tg(env, "sendChatAction", { chat_id: chat, action: "typing" });
  let r;
  try {
    r = await gemini(env, "You are an expert " + A + "→" + B + " translator. " + ORTHO + "\nTranslate the SOURCE faithfully and naturally (meaning, not words; natural " + B + " word order), then annotate up to 4 translation techniques you used (Azerbaijani names such as konkretləşdirmə, ümumiləşdirmə, modulyasiya, antonimik tərcümə, kompensasiya, təsviri tərcümə, transpozisiya, yerdəyişmə, əlavə, buraxma, kalka) and list up to 6 key terms. Write explanations in Azerbaijani.\nReply with ONLY: {\"final\": \"...\", \"techniques\": [{\"src\": \"...\", \"tgt\": \"...\", \"technique\": \"...\", \"why\": \"...\"}], \"terms\": [{\"a\": \"...\", \"b\": \"...\"}]}\nSOURCE:\n\"\"\"" + text + "\"\"\"", "normal");
  } catch (e) { return send(env, chat, errMsg(e)); }
  let out = "<b>Tərcümə</b>\n" + hx(String(r.final || "").slice(0, 3000));
  const te = Array.isArray(r.techniques) ? r.techniques.filter(Boolean).slice(0, 4) : [];
  if (te.length) out += "\n\n<b>Transformasiyalar</b>\n" + te.map(function (x) { return "• " + hx(x.src) + " → " + hx(x.tgt) + "\n  <i>" + hx(x.technique) + ": " + hx(x.why) + "</i>"; }).join("\n");
  const tm = Array.isArray(r.terms) ? r.terms.filter(Boolean).slice(0, 6) : [];
  if (tm.length) out += "\n\n<b>Terminlər</b>\n" + tm.map(function (x) { return "• " + hx(x.a) + " — " + hx(x.b); }).join("\n");
  return send(env, chat, out);
}
async function check(env, chat, text) {
  const parts = text.split(/\n\s*-{3,}\s*\n/), src = parts[0].trim(), tgt = parts.slice(1).join("\n").trim();
  if (!src || !tgt) return send(env, chat, "Mənbə ilə tərcümə arasında ayrıca sətirdə <code>---</code> qoyun.");
  if (src.length + tgt.length > 6000) return send(env, chat, "Mətn çox uzundur — hissə-hissə göndərin.");
  const pr = detectPair(src);
  await tg(env, "sendChatAction", { chat_id: chat, action: "typing" });
  let r;
  try {
    r = await gemini(env, "You are an experienced translation reviser. Mark the TRANSLATION (" + pr[0] + "→" + pr[1] + ") strictly on a 100-point scale: accuracy of meaning first, then terminology, grammar, style and register. " + ORTHO + " Write comments in Azerbaijani and quote the exact words.\nReply with ONLY: {\"score\": integer 0-100, \"summary\": \"...\", \"errors\": [up to 6 {\"was\": \"...\", \"now\": \"...\", \"type\": \"...\", \"why\": \"...\"}], \"corrected\": \"...\"}\nSOURCE: \"\"\"" + src + "\"\"\"\nTRANSLATION: \"\"\"" + tgt + "\"\"\"", "normal");
  } catch (e) { return send(env, chat, errMsg(e)); }
  const s = Math.max(0, Math.min(100, parseInt(r.score, 10) || 0)), g = grade(s);
  let out = "<b>Qiymət: " + s + "/100 — " + g[0] + ", " + g[1] + "</b>\n" + hx(r.summary || "");
  const er = Array.isArray(r.errors) ? r.errors.filter(Boolean).slice(0, 6) : [];
  if (er.length) out += "\n\n<b>Səhvlər</b>\n" + er.map(function (x) { return "• <s>" + hx(x.was) + "</s> → <b>" + hx(x.now) + "</b>\n  <i>" + hx(x.type) + ": " + hx(x.why) + "</i>"; }).join("\n");
  if (r.corrected) out += "\n\n<b>Düzəldilmiş variant</b>\n" + hx(String(r.corrected).slice(0, 1500));
  return send(env, chat, out);
}
async function term(env, chat, w) {
  await tg(env, "sendChatAction", { chat_id: chat, action: "typing" });
  let r;
  try {
    r = await gemini(env, "Write a terminology entry for translators for the term \"\"\"" + w.slice(0, 100) + "\"\"\". " + ORTHO + " Explanations in Azerbaijani.\nReply with ONLY: {\"term\": \"...\", \"domain\": \"...\", \"definition\": \"...\", \"az\": \"...\", \"en\": \"...\", \"ru\": \"...\", \"example\": {\"a\": \"...\", \"b\": \"...\"}, \"note\": \"...\"}", "fast");
  } catch (e) { return send(env, chat, errMsg(e)); }
  let out = "<b>" + hx(r.term || w) + "</b>" + (r.domain ? " <i>(" + hx(r.domain) + ")</i>" : "") + "\n" + hx(r.definition || "");
  out += "\n\nAzərbaycanca: " + hx(r.az || "—") + "\nİngiliscə: " + hx(r.en || "—") + "\nRusca: " + hx(r.ru || "—");
  if (r.example && r.example.a) out += "\n\n<i>" + hx(r.example.a) + "</i>\n" + hx(r.example.b || "");
  if (r.note) out += "\n\n" + hx(r.note);
  return send(env, chat, out);
}

// ---------- Quraşdırma ----------
async function handleSetup(request, env, url) {
  const key = env.SETUP_KEY || env.ACCESS_CODE;
  if (key && !sameText(url.searchParams.get("key") || "", key)) {
    return new Response("Bu səhifə qorunur. Ünvanın sonuna ?key=GİRİŞ_KODU əlavə edin.", { status: 403, headers: { "content-type": "text/plain; charset=utf-8" } });
  }
  if (!allow("setup:" + clientIp(request), 10, 10 * 60 * 1000)) return new Response("Çox tez-tez açılır. Bir az gözləyin.", { status: 429 });
  const origin = url.origin, lines = [];
  if (!env.GEMINI_KEY) lines.push("❌ GEMINI_KEY yoxdur — Settings → Variables and Secrets bölməsində əlavə edin.");
  else {
    try { await gemini(env, 'Reply with ONLY: {"ok": true}', "fast"); lines.push("✅ Gemini açarı işləyir."); }
    catch (e) { lines.push("❌ Gemini cavab vermədi: " + (e.code || "xəta") + (e.code === "model_unavailable" ? " — MODEL dəyişənini yeniləyin." : "")); }
  }
  if (!env.ACCESS_CODE) lines.push("⚠️ ACCESS_CODE yoxdur — sayt hamıya açıqdır və AI limitinizi istənilən adam işlədə bilər. Kod əlavə etmək tövsiyə olunur.");
  else lines.push("🔒 Sayt giriş kodu ilə qorunur. İstifadəçilər kodu Ayarlar → Hesab bölməsinə yazır.");
  if (!env.TG_TOKEN) lines.push("ℹ️ TG_TOKEN yoxdur — Telegram botu qoşulmayıb (istəyə bağlı).");
  else {
    const a = await tg(env, "setWebhook", { url: origin + "/tg", secret_token: await tgSecret(env.TG_TOKEN), allowed_updates: ["message", "callback_query"], drop_pending_updates: true });
    lines.push(a.ok ? "✅ Telegram botu saytla birləşdirildi." : "❌ Telegram: " + (a.description || "bot açarını yoxlayın"));
    await tg(env, "setMyCommands", { commands: [{ command: "start", description: "Menyu" }, { command: "termin", description: "Termin axtar" }, { command: "yoxla", description: "Tərcüməmi yoxla" }, { command: "dost", description: "Yalançı dostlar" }] });
    await tg(env, "setChatMenuButton", { menu_button: { type: "web_app", text: "Nuanza", web_app: { url: origin + "/" } } });
    const me = await tg(env, "getMe", {});
    if (me && me.ok && me.result) lines.push("🤖 Botunuz: @" + me.result.username);
    lines.push(env.TG_ALLOWED ? "🔒 Botdan yalnız TG_ALLOWED siyahısındakılar istifadə edə bilər." : "⚠️ Bot hamıya açıqdır. Yalnız özünüz üçün istəyirsinizsə, TG_ALLOWED dəyişəninə Telegram ID-nizi yazın.");
  }
  lines.push("🌐 Saytınız: " + origin + "/");
  const page = "<!doctype html><html lang='az'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>Nuanza quraşdırma</title></head><body style='font-family:system-ui,-apple-system,sans-serif;padding:24px;line-height:1.7;max-width:640px;margin:auto'><h2>Nuanza — quraşdırma yoxlaması</h2>" + lines.map(function (l) { return "<p>" + hx(l) + "</p>"; }).join("") + "</body></html>";
  return new Response(page, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}
