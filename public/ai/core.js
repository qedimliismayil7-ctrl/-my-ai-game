/* Nuanza — real AI core.
   Talks to the Worker's POST /api ({prompt, speed}) and gives adapters the
   prompt building blocks that worked in the original Nuanza.
   Adapters register themselves in NuanzaAI.kinds[kind] = async function (input) {...}
   and must return the same shape as the demo answer of that kind (see app.js AI.*). */
(function () {
  'use strict';
  var W = window;

  var ORTHO = 'All Azerbaijani text must use standard Azerbaijani Latin orthography with ə ğ ı ö ü ş ç — never Turkish words, forms or spellings.';
  var AZNOTES = 'Write every explanation, label and comment in Azerbaijani.';
  var LANG = { en: 'English', az: 'Azerbaijani', ru: 'Russian', tr: 'Turkish' };
  var RULES = {
    'en-az': "EN→AZ checks: drop articles and express definiteness through word order, the accusative -ı/-i/-u/-ü or 'həmin/bir'; phrasal verbs become single Azerbaijani verbs; passive usually becomes active or -ıl/-in forms; rebuild verb-final order; relative clauses become -an/-ən, -dığı participles; keep sən/siz register consistent. WORD ORDER: rebuild every sentence in Azerbaijani order — subject, time, place, object, and the verb at the end; English relative clauses (which / that / who) become participle phrases placed BEFORE the noun (-an / -ən, -dığı); never keep the English word order.",
    'az-en': "AZ→EN checks: decide a/an/the for every noun; no grammatical gender, so choose pronouns from context; map -mış/-ıb/-mışdı to the right English tense or aspect; rebuild SVO order; turn long participial chains into relative clauses; numbers take plural nouns in English; avoid calques such as 'in the last year' or 'I am agree'. WORD ORDER: rebuild every sentence in English order — subject, verb, object, manner, place, time; move the Azerbaijani sentence-final verb right after the subject; long participle phrases before a noun become phrases or relative clauses after the noun; split very long sentences when that reads better; legal obligations use shall.",
    'ru-az': 'RU→AZ checks: avoid Russian word order and calques; render participial and adverbial participle constructions with Azerbaijani -an/-ən and -araq/-ərək forms; convey aspect with the right Azerbaijani tense; turn Russian officialese into natural Azerbaijani official style. WORD ORDER: Azerbaijani is verb-final; place time and place before the verb; Russian participle phrases go before the noun as -an / -ən forms.',
    'az-ru': 'AZ→RU checks: correct gender, number and case agreement; choose perfective or imperfective aspect by meaning; natural Russian word order. WORD ORDER: use natural Russian order, usually subject, verb, object, with new information at the end of the sentence; never mirror the Azerbaijani verb-final order.',
    'tr-az': 'TR→AZ checks: beware of Turkish–Azerbaijani false friends and near-cognates; never leave Turkish words, suffixes or spellings (değil→deyil, -yor→-ır/-ir, çok→çox, güzel→gözəl). WORD ORDER: both languages are verb-final; keep natural Azerbaijani order and adapt Turkish idioms instead of copying them.',
    'az-tr': 'AZ→TR checks: beware of false friends; use standard Turkish vocabulary, suffixes and orthography, never Azerbaijani forms. WORD ORDER: both languages are verb-final; keep natural Turkish order and adapt Azerbaijani idioms instead of copying them.'
  };
  var REGISTER = {
    danisiq: 'casual spoken register — how people in Baku really talk (informal "sən", contractions and everyday words), still correct',
    neytral: 'neutral register',
    resmi: 'formal official register (polite "siz", complete sentences)',
    huquqi: 'legal register — precise, conservative, standard legal formulas, obligations with -malıdır / shall'
  };
  var ETYPES = ['məna təhrifi', 'buraxma', 'əlavə', 'terminologiya', 'qrammatika', 'üslub', 'söz seçimi', 'orfoqrafiya', 'kalka', 'yalançı dost', 'mədəni uyğunsuzluq', 'rəqəm/tarix', 'xüsusi ad'];
  var CAUSES = ['ana dilinin təsiri', 'sözbəsöz tərcümə', 'konteksti səhv anlama', 'yanlış termin seçimi', 'qrammatika', 'üslub', 'məna dəyişməsi'];

  var ERR = {
    network: 'İnternet bağlantısını yoxlayın.',
    not_configured: 'Sayt hələ tam qurulmayıb — Gemini açarı əlavə edilməyib.',
    model_unavailable: 'Süni intellekt modeli əlçatan deyil.',
    bad_code: 'Giriş kodu yanlışdır — Ayarlar → Hesab bölməsində kodu daxil edin.',
    rate_limited: 'Limit doldu. Bir dəqiqə gözləyib yenidən cəhd edin.',
    refused: 'Bu mətn emal edilmədi. Mətni dəyişib yenidən cəhd edin.',
    invalid_json: 'Cavab düzgün formatda gəlmədi. Yenidən cəhd edin.',
    prompt_too_large: 'Mətn çox uzundur. Qısaldıb yenidən cəhd edin.',
    empty_completion: 'Cavab boş gəldi. Yenidən cəhd edin.',
    daily_limit: 'Bu günlük AI limiti doldu. Sabah yenidən cəhd edin.',
    server_error: 'Xəta baş verdi. Yenidən cəhd edin.'
  };
  function errText(e) { return ERR[e && e.code] || ERR.server_error; }

  /* Ayarlar → Hesab → «Sayt giriş kodu»: App.store key 'code' = localStorage 'nuanza2:code' (JSON).
     App.store first (it also works when localStorage is blocked), the raw key as a fallback. */
  function accessCode() {
    try {
      if (W.App && W.App.store && typeof W.App.store.get === 'function') { var c = W.App.store.get('code', ''); return c == null ? '' : String(c).trim(); }
    } catch (e) { /* fall through */ }
    try { var v = localStorage.getItem('nuanza2:code'); v = v ? JSON.parse(v) : ''; return v == null ? '' : String(v).trim(); } catch (e) { return ''; }
  }

  /* One call to the Worker. Throws {code} on failure. */
  function call(prompt, opts) {
    opts = opts || {};
    var speed = opts.speed === 'fast' || opts.speed === 'deep' ? opts.speed : 'normal';
    var ctl = typeof AbortController === 'function' ? new AbortController() : null;
    var code = accessCode();
    /* a header value must be Latin-1; such a code can never match the Worker's — say so, not «network» */
    if (/[^\x20-\x7e]/.test(code)) return Promise.reject({ code: 'bad_code' });
    var timer = ctl ? setTimeout(function () { ctl.abort(); }, opts.timeout || 90000) : null;
    return fetch('/api', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-access-code': code },
      body: JSON.stringify({ prompt: String(prompt), speed: speed }),
      signal: ctl ? ctl.signal : undefined
    }).then(function (r) {
      return r.json().catch(function () { return null; }).then(function (j) {
        if (timer) clearTimeout(timer);
        if (!r.ok || !j || !j.ok) throw { code: (j && j.error) || 'server_error' };
        return j.data;
      });
    }, function () {
      if (timer) clearTimeout(timer);
      throw { code: 'network' };
    });
  }

  function pairOf(input) {
    var from = (input && input.from) || 'en', to = (input && input.to) || 'az';
    if (input && input.pair && /^[a-z]{2}-[a-z]{2}$/.test(input.pair)) { from = input.pair.slice(0, 2); to = input.pair.slice(3); }
    return { from: from, to: to, key: from + '-' + to, A: LANG[from] || 'English', B: LANG[to] || 'Azerbaijani', rules: RULES[from + '-' + to] || '' };
  }
  function q(text) { return '"""' + String(text == null ? '' : text).replace(/"""/g, '"') + '"""'; }
  function clamp100(v) { v = parseInt(v, 10); return isFinite(v) ? Math.max(0, Math.min(100, v)) : 0; }
  function arr(v) { return Array.isArray(v) ? v.filter(Boolean) : []; }
  function str(v) { return v == null ? '' : String(v); }

  W.NuanzaAI = {
    kinds: {},
    call: call,
    errText: errText,
    pairOf: pairOf,
    q: q,
    clamp100: clamp100,
    arr: arr,
    str: str,
    ORTHO: ORTHO,
    AZNOTES: AZNOTES,
    LANG: LANG,
    RULES: RULES,
    REGISTER: REGISTER,
    ETYPES: ETYPES,
    CAUSES: CAUSES
  };
})();
