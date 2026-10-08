/* Nuanza — live adapters for kinds 'qa' and 'analyze'.

   qa  input: { project: { name, segments: [{ s|src|source, t|tgt|target, n? }], pair?, register|reg?,
                field?, terms?: [{a,b,note}], reqs?: [text | [text,key]], situation?: {purpose,audience,note} } }
              or { src, tgt } for a single segment (like the demo).
       Every segment gets the deterministic checks locally (Turkish forms, numbers, punctuation,
       spelling — App.mockAI('check') on that segment's own text — plus extra Turkish words and
       suffixes). Segments that have both a source and a target go to Gemini in batches of up to 10
       for the deep review. Issues are merged and scored exactly like the demo AI.qa:
       { score, grade, summary, project, segments, checked,
         issues: [{ id, type, severity: 'high'|'mid'|'low', seg, src, tgt, was, now, fix, text, elder }],
         counts: { type: n }, checks: [{ key, label, issues, ok }], verdict: { score, text, seal, grade },
         risky: [segment numbers the reviser wants a human to look at] }
       Without any segment text there is nothing real to check: resolves { ok:false, error }.

   analyze input: { text } (optional from / to / genre / register).
       Volume, repetition, TM, readability and price come from the demo's deterministic counters
       (App.mockAI('analyze') — all computed from the text itself); domain, register, terms, risks and
       client questions come from one Gemini call. Resolves to the demo AI.analyze shape:
       { words, chars, sentences, repetition, tm: { exact, fuzzy, fresh, repeats }, domain, register,
         registerId, from, readability, estimate: { hours, price, currency, weightedWords },
         terms: [{ a, b, domain, note, enforced }], risks: [string], questions: [{ q, options, why }],
         brief: { goal, audience, register, domain, special[] }, special } */
(function () {
  'use strict';
  var W = window, N = W.NuanzaAI;
  if (!N || !N.kinds) return;

  /* ---------- tables mirrored from app.js (labels the screens switch on) ---------- */
  var REG_LABEL = { danisiq: 'Danışıq', neytral: 'Neytral', resmi: 'Rəsmi', huquqi: 'Hüquqi' };
  var ELDER_BY_TYPE = {
    'Termin': 'Lüğətçi Mirzə', 'Məna': 'Mənaçı Mirzə', 'Boş seqment': 'Mənaçı Mirzə', 'Üslub': 'Üslubçu Mirzə', 'Söz sırası': 'Üslubçu Mirzə',
    'Ardıcıllıq': 'Üslubçu Mirzə', 'Türk forması': 'Dilçi Nənə', 'Orfoqrafiya': 'Dilçi Nənə', 'Durğu': 'Dilçi Nənə',
    'Rəqəm': 'Möhürdar Mirzə', 'Ad': 'Möhürdar Mirzə', 'Tarix': 'Möhürdar Mirzə'
  };
  var SEV_DEF = {
    'Türk forması': 'mid', 'Rəqəm': 'high', 'Termin': 'mid', 'Məna': 'high', 'Orfoqrafiya': 'mid', 'Üslub': 'low', 'Durğu': 'low',
    'Ad': 'mid', 'Tarix': 'high', 'Ardıcıllıq': 'mid', 'Söz sırası': 'low', 'Boş seqment': 'high'
  };
  var QA_CHECKS = [
    { key: 'numbers', label: 'Rəqəmlər', types: ['Rəqəm'] }, { key: 'names', label: 'Adlar', types: ['Ad'] },
    { key: 'dates', label: 'Tarixlər', types: ['Tarix'] }, { key: 'terms', label: 'Terminlər', types: ['Termin'] },
    { key: 'turkish', label: 'Türk formaları', types: ['Türk forması', 'Orfoqrafiya'] }, { key: 'consistency', label: 'Ardıcıllıq', types: ['Ardıcıllıq', 'Üslub'] },
    { key: 'punct', label: 'Durğu', types: ['Durğu'] }, { key: 'complete', label: 'Tamlıq', types: ['Boş seqment', 'Məna'] }
  ];
  var QA_TYPES = ['Məna', 'Termin', 'Rəqəm', 'Tarix', 'Ad', 'Türk forması', 'Orfoqrafiya', 'Üslub', 'Söz sırası', 'Ardıcıllıq', 'Durğu'];
  var TYPE_HELP = '"Məna" = meaning changed, mistranslated, omitted or added, or an unclear reference (who is "they"); ' +
    '"Termin" = wrong or non-approved term, or a false friend; "Rəqəm" = a number, amount or percentage differs from the SOURCE; ' +
    '"Tarix" = a date differs from the SOURCE or is written wrongly; "Ad" = a proper name, company name or abbreviation is misspelled or mistransliterated; ' +
    '"Türk forması" = a Turkish word, suffix or spelling inside Azerbaijani text; "Orfoqrafiya" = spelling, capitalisation or grammar (agreement, case endings, verb forms); ' +
    '"Üslub" = register that does not fit the STYLE, an unnatural calque or awkward wording; "Söz sırası" = word order copied from the SOURCE; ' +
    '"Ardıcıllıq" = the same source term or phrase translated differently in different segments; "Durğu" = punctuation, quotation marks or number format.';
  var WHY_DEF = {
    'Məna': 'Məna mənbə ilə üst-üstə düşmür — mənbə ilə tutuşdurun.', 'Termin': 'Termin layihə lüğətinə uyğun deyil.',
    'Rəqəm': 'Rəqəm mənbə ilə üst-üstə düşmür.', 'Tarix': 'Tarix mənbə ilə üst-üstə düşmür.', 'Ad': 'Ad düzgün yazılmayıb.',
    'Türk forması': 'Türk formasıdır — Azərbaycan ədəbi dilində işlənmir.', 'Orfoqrafiya': 'Yazılış ədəbi normaya uyğun deyil.',
    'Üslub': 'Üslub mətnin janrına uyğun deyil.', 'Söz sırası': 'Söz sırası mənbədən köçürülüb.', 'Ardıcıllıq': 'Eyni termin sənəddə fərqli verilib.',
    'Durğu': 'Durğu işarəsi normaya uyğun deyil.', 'Boş seqment': 'Seqment tərcümə edilməyib.'
  };
  /* Domain labels of the demo (DOMAINS in app.js) plus the two the project screens also use. */
  var DOMAIN_LABELS = ['Hüquq', 'Maliyyə', 'Neft-qaz', 'İşgüzar yazışma', 'İnterfeys', 'Turizm', 'Tibb', 'Təhsil', 'Gündəlik yazışma', 'Ümumi'];
  var DOMAIN_ALIAS = {
    legal: 'Hüquq', law: 'Hüquq', contract: 'Hüquq', huquq: 'Hüquq', huquqi: 'Hüquq',
    finance: 'Maliyyə', financial: 'Maliyyə', banking: 'Maliyyə', bank: 'Maliyyə', economy: 'Maliyyə', maliyye: 'Maliyyə',
    oil: 'Neft-qaz', gas: 'Neft-qaz', energy: 'Neft-qaz', neft: 'Neft-qaz',
    business: 'İşgüzar yazışma', letter: 'İşgüzar yazışma', correspondence: 'İşgüzar yazışma', isguzar: 'İşgüzar yazışma',
    ui: 'İnterfeys', interface: 'İnterfeys', software: 'İnterfeys', it: 'İnterfeys', tech: 'İnterfeys', technical: 'İnterfeys', interfeys: 'İnterfeys',
    tourism: 'Turizm', travel: 'Turizm', hospitality: 'Turizm', turizm: 'Turizm',
    medical: 'Tibb', medicine: 'Tibb', health: 'Tibb', pharma: 'Tibb', pharmaceutical: 'Tibb', tibb: 'Tibb',
    education: 'Təhsil', academic: 'Təhsil', university: 'Təhsil', tehsil: 'Təhsil',
    chat: 'Gündəlik yazışma', casual: 'Gündəlik yazışma', everyday: 'Gündəlik yazışma', personal: 'Gündəlik yazışma', gundelik: 'Gündəlik yazışma',
    general: 'Ümumi', umumi: 'Ümumi', other: 'Ümumi'
  };

  /* Turkish forms the demo list (TR_FORMS in app.js, reached through mockAI('check')) does not cover. */
  var TR_EXTRA = [
    ['hakkında', 'haqqında'], ['şekilde', 'şəkildə'], ['yetkili', 'səlahiyyətli'], ['kadar', 'qədər'], ['göre', 'görə'], ['gibi', 'kimi'],
    ['veya', 'və ya'], ['yani', 'yəni'], ['üzere', 'üzrə'], ['aynı', 'eyni'], ['değişiklik', 'dəyişiklik'], ['değildir', 'deyil'],
    ['sürdürülebilirlik', 'davamlı inkişaf'], ['bulunmaktadır', 'mövcuddur'], ['gerçekleştirilir', 'həyata keçirilir'], ['işlem', 'əməliyyat'],
    ['işlemler', 'əməliyyatlar'], ['kullanım', 'istifadə'], ['herhangi', 'hər hansı'], ['tüm', 'bütün'], ['sorumluluk', 'məsuliyyət'],
    ['sorumlu', 'məsul'], ['başvuru', 'müraciət'], ['onay', 'təsdiq'], ['güvenlik', 'təhlükəsizlik'], ['şifre', 'şifrə'], ['sonuç', 'nəticə'],
    ['sonucu', 'nəticəsi'], ['durum', 'vəziyyət'], ['süre', 'müddət'], ['süresi', 'müddəti'], ['içerisinde', 'ərzində'], ['dahil', 'daxil'],
    ['hariç', 'istisna olmaqla'], ['şartlar', 'şərtlər'], ['hizmetler', 'xidmətlər'], ['müşteriler', 'müştərilər'], ['imzalanmıştır', 'imzalanmışdır']
  ];
  /* Turkish verb suffixes: -iyor, -maktadır/-mektedir, -acak/-ecek (Azerbaijani: -ır/-ir, -maqdadır, -acaq/-əcək). */
  var TR_SUFFIX = [
    { re: /(^|[^\p{L}])(\p{L}+[ıiuü]yor(?:um|sun|uz|sunuz|lar|du|dı|muş)?)(?=$|[^\p{L}])/giu, why: '«-yor» türk dilinin şəkilçisidir; Azərbaycan dilində indiki zaman -ır/-ir/-ur/-ür ilə düzəlir.' },
    { re: /(^|[^\p{L}])(\p{L}+m[ae]kt[ae]d[ıi]r(?:lar|ler)?)(?=$|[^\p{L}])/giu, why: '«-maktadır/-mektedir» türk formasıdır; Azərbaycan dilində «-maqdadır/-məkdədir» və ya sadə indiki zaman işlənir.' },
    { re: /(^|[^\p{L}])(\p{L}+(?:acak|ecek)(?:tır|tir|lar|ler|sınız|siniz)?)(?=$|[^\p{L}])/giu, why: '«-acak/-ecek» türk formasıdır; Azərbaycan dilində «-acaq/-əcək» yazılır.' }
  ];
  /* Local check types taken from the demo checker (Termin and Məna are left to the model: the demo's
     fixed glossary and length ratio do not know this project's approved terms or sentence structure). */
  var LOCAL_TYPES = { 'Türk forması': 1, 'Rəqəm': 1, 'Durğu': 1, 'Orfoqrafiya': 1, 'Üslub': 1 };

  var FATAL = { bad_code: 1, not_configured: 1, daily_limit: 1, rate_limited: 1, network: 1, model_unavailable: 1 };
  var RETRY = { invalid_json: 1, empty_completion: 1, server_error: 1 };
  var BATCH = 10, MAX_DEEP = 80, CONC = 2, SEG_CHARS = 3500, BATCH_CHARS = 16000, ANALYZE_CHARS = 20000;

  /* ---------- small helpers ---------- */
  function App() { return W.App || null; }
  function lower(s) { s = String(s == null ? '' : s); try { return s.toLocaleLowerCase('az'); } catch (e) { return s.toLowerCase(); } }
  function upper(s) { s = String(s == null ? '' : s); try { return s.toLocaleUpperCase('az'); } catch (e) { return s.toUpperCase(); } }
  function cap(s) { s = String(s || ''); return s ? upper(s.charAt(0)) + s.slice(1) : s; }
  function fold(s) {
    return lower(s).replace(/ə/g, 'e').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ü/g, 'u')
      .replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/̇/g, '');
  }
  function clean(s) { return N.str(s).replace(/\s+/g, ' ').trim(); }
  function reEsc(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function countWords(s) { return (String(s || '').match(/[\p{L}\p{N}]+(?:[-'’][\p{L}\p{N}]+)*/gu) || []).length; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function short(s, n) { s = clean(s); return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s; }
  function cut(s, n) { s = String(s || ''); return s.length > n ? s.slice(0, n) + '…' : s; }
  function mock(kind, input) {
    var A = App();
    if (!A || typeof A.mockAI !== 'function') return null;
    try { return A.mockAI(kind, input); } catch (e) { return null; }
  }
  /* A refusal that is not a server error: show it like App.fakeAI shows errors and resolve {ok:false}. */
  function fail(msg) {
    var A = App();
    try { if (A && typeof A.toast === 'function') A.toast(msg, 'err'); } catch (e) { /* toast not ready */ }
    return { ok: false, error: msg };
  }
  function detectLang(t) {
    var A = App();
    if (A && A.detect && typeof A.detect.lang === 'function') { try { return A.detect.lang(t); } catch (e) { /* fall through */ } }
    t = String(t || '');
    if (/[Ѐ-ӿ]/.test(t)) return 'ru';
    if (/[əƏ]/.test(t)) return 'az';
    if (/[ğışçöüİĞŞÇÖÜ]/.test(t)) return /[xqXQ]/.test(t) ? 'az' : 'tr';
    return 'en';
  }
  function normReg(r) {
    var f = fold(r || '').trim();
    if (!f || f === 'auto' || f === 'avto') return null;
    if (/^(danis|casual|informal|chat|spoken|colloq|conversational)/.test(f)) return 'danisiq';
    if (/^(neyt|neutr)/.test(f)) return 'neytral';
    if (/^(resm|formal|offic)/.test(f)) return 'resmi';
    if (/^(huq|legal|law|jur)/.test(f)) return 'huquqi';
    return null;
  }
  function regDesc(reg, P) {
    if (!reg) return '';
    if (P.to === 'az') return N.REGISTER[reg] || '';
    if (reg === 'danisiq') return 'casual spoken register — how people really talk in everyday ' + P.B + ', still correct';
    if (reg === 'resmi') return 'formal official register (polite address, complete sentences)';
    if (reg === 'huquqi') return 'legal register — precise, conservative, standard ' + P.B + ' legal formulas' + (P.to === 'en' ? ', obligations with shall' : '');
    return 'neutral register';
  }
  function normDomain(v) {
    var f = fold(v).trim();
    if (!f) return null;
    for (var i = 0; i < DOMAIN_LABELS.length; i++) if (fold(DOMAIN_LABELS[i]) === f) return DOMAIN_LABELS[i];
    var words = f.split(/[^a-z]+/).filter(Boolean);
    for (var k = 0; k < words.length; k++) if (DOMAIN_ALIAS[words[k]]) return DOMAIN_ALIAS[words[k]];
    for (var j = 0; j < DOMAIN_LABELS.length; j++) if (f.indexOf(fold(DOMAIN_LABELS[j])) === 0) return DOMAIN_LABELS[j];
    return null;
  }
  function normType(t) {
    var f = fold(t).trim();
    if (!f) return 'Məna';
    for (var i = 0; i < QA_TYPES.length; i++) if (fold(QA_TYPES[i]) === f) return QA_TYPES[i];
    if (/bos seqment|empty|untranslated/.test(f)) return 'Boş seqment';
    if (/turk/.test(f)) return 'Türk forması';
    if (/tarix|date/.test(f) && !/reqem/.test(f)) return 'Tarix';
    if (/reqem|number|numer|amount|mebleg|figure|percent/.test(f)) return 'Rəqəm';
    if (/^(ad|xususi ad|name|proper)|transl?iter/.test(f)) return 'Ad';
    if (/ardicil|consist/.test(f)) return 'Ardıcıllıq';
    if (/soz sira|word order|order/.test(f)) return 'Söz sırası';
    if (/durgu|punct|quot|dirnaq/.test(f)) return 'Durğu';
    if (/orfo|spell|qrammat|gramm|capital|agreement|case/.test(f)) return 'Orfoqrafiya';
    if (/yalanci dost|false friend/.test(f)) return 'Məna';
    if (/termin|term|glossar/.test(f)) return 'Termin';
    if (/uslub|style|regist|kalka|calque|soz secimi|word choice|medeni|cultur|unnatural|fluen|awkward/.test(f)) return 'Üslub';
    return 'Məna';
  }
  function normSev(s, type) {
    var f = fold(s).trim();
    if (/^(crit|high|kritik|yuks|ciddi|severe|block|major-critical)/.test(f)) return 'high';
    if (/^(maj|mid|med|orta|moder|important)/.test(f)) return 'mid';
    if (/^(min|low|kicik|asag|trivial|cosm|pref)/.test(f)) return 'low';
    return SEV_DEF[type] || 'mid';
  }
  function gradeOf(s) { return s >= 90 ? 'Əla' : s >= 80 ? 'Yaxşı' : s >= 70 ? 'Orta' : s >= 60 ? 'Zəif' : 'Yenidən işlənməli'; }
  function sealOf(s) { return s >= 85 ? 'Təhvilə hazırdır' : s >= 70 ? 'Düzəlişlərlə qəbul' : 'Yenidən işlənməli'; }
  function matchCase(was, now) { return was && upper(was.charAt(0)) === was.charAt(0) && lower(was.charAt(0)) !== was.charAt(0) ? cap(now) : now; }
  function findPhrase(text, phrase) {
    var re;
    try { re = new RegExp('(^|[^\\p{L}])(' + reEsc(lower(phrase)) + ')(?=$|[^\\p{L}])', 'u'); } catch (e) { return null; }
    var lt = lower(text), m = re.exec(lt);
    if (!m || lt.length !== text.length) return m ? phrase : null;
    return text.substr(m.index + m[1].length, m[2].length);
  }
  /* The exact fragment of the target that the model quoted (it sometimes changes case, spacing or quotes). */
  function locate(t, w) {
    w = String(w || '').trim();
    if (!w || w === '—' || w === '-' || w === '…') return null;
    if (t.indexOf(w) >= 0) return w;
    var lt = lower(t), i = lt.indexOf(lower(w));
    if (i >= 0 && lt.length === t.length) return t.substr(i, w.length);
    try { var m = new RegExp(reEsc(w).replace(/\s+/g, '\\s+'), 'iu').exec(t); if (m) return m[0]; } catch (e) { /* ignore */ }
    var w2 = w.replace(/^[«"“'‘(\[]+|[»"”'’)\].,;:!?]+$/g, '').trim();
    return w2 && w2 !== w ? locate(t, w2) : null;
  }
  function overlaps(a, b) {
    a = lower(a); b = lower(b);
    if (!a || !b || a === '—' || b === '—') return false;
    return a === b || a.indexOf(b) >= 0 || b.indexOf(a) >= 0;
  }
  var ABBR = /^(mr|mrs|ms|dr|no|st|art|co|ltd|inc|vs|e\.g|i\.e|cənab|г|ст|т\.е|т\.д|prof|jr|sr)\.$/i;
  function splitSentences(p) {
    var out = [], buf = '', toks = String(p).match(/\S+\s*/g) || [];
    toks.forEach(function (tok) {
      buf += tok;
      var core = tok.trim();
      if (/[.!?…]["»”')\]]*$/.test(core) && !ABBR.test(core) && !/^\d+\.$/.test(core)) { out.push(buf.trim()); buf = ''; }
    });
    if (buf.trim()) out.push(buf.trim());
    return out;
  }
  function sentencesOf(text) {
    var out = [];
    String(text || '').split(/\n+/).forEach(function (p) { if (p.trim()) out = out.concat(splitSentences(p.trim())); });
    return out;
  }

  /* =====================================================================
     QA
     ===================================================================== */
  function projName(inp) {
    var p = inp.project;
    if (typeof p === 'string' && p.trim()) return p.trim();
    if (p && typeof p === 'object' && (p.name || p.title)) return clean(p.name || p.title);
    if (inp.name || inp.title) return clean(inp.name || inp.title);
    return 'Layihə';
  }
  function pick(o, keys) {
    for (var i = 0; i < keys.length; i++) {
      var v = o[keys[i]];
      if (typeof v === 'string') return v;
      if (typeof v === 'number' && isFinite(v)) return String(v);
    }
    return '';
  }
  function readSegments(inp, proj) {
    var list = Array.isArray(proj.segments) ? proj.segments : Array.isArray(proj.segs) ? proj.segs : Array.isArray(inp.segments) ? inp.segments : null;
    var out = [];
    if (list) {
      list.forEach(function (o, idx) {
        if (!o || typeof o !== 'object') return;
        var n = parseInt(o.n != null ? o.n : o.num, 10);
        out.push({ n: n > 0 ? n : idx + 1, s: pick(o, ['s', 'src', 'source']).trim(), t: pick(o, ['t', 'tgt', 'target', 'translation']).trim() });
      });
      var seen = {}, dup = out.some(function (sg) { if (seen[sg.n]) return true; seen[sg.n] = 1; return false; });
      if (dup) out.forEach(function (sg, i) { sg.n = i + 1; });
    } else {
      var s = str2(inp.src || inp.source), t = str2(inp.tgt || inp.target || inp.translation);
      if (s || t) out.push({ n: 1, s: s, t: t });
    }
    return out.filter(function (sg) { return sg.s || sg.t; });
  }
  function str2(v) { return N.str(v).trim(); }

  function resolveQAPair(inp, proj, segs) {
    var raw = String(proj.pair || inp.pair || '');
    var m = /([a-z]{2})\s*(?:-|–|—|→|->|>|\/|\s)\s*([a-z]{2})/i.exec(raw);
    var from = String(inp.from || proj.from || (m ? m[1] : '')).toLowerCase();
    var to = String(inp.to || proj.to || (m ? m[2] : '')).toLowerCase();
    if (!N.LANG[from]) from = detectLang(segs.map(function (sg) { return sg.s; }).join(' ').slice(0, 3000));
    if (!N.LANG[to]) {
      var tl = detectLang(segs.map(function (sg) { return sg.t; }).join(' ').slice(0, 3000));
      to = tl !== from && N.LANG[tl] ? tl : (from === 'az' ? 'en' : 'az');
    }
    if (to === from) to = from === 'az' ? 'en' : 'az';
    return N.pairOf({ from: from, to: to });
  }

  /* Project terminology: the project's own terms first, then the user's glossary entries that occur in the sources. */
  function termsLine(proj, P, segs) {
    var out = [], seen = {}, srcAll = lower(segs.map(function (sg) { return sg.s; }).join('\n'));
    function add(a, b, note) {
      a = clean(a); b = clean(b);
      if (!a || !b || seen[lower(a)] || out.length >= 40) return;
      seen[lower(a)] = 1;
      out.push(a + ' → ' + b + (note ? ' (' + short(note, 80) + ')' : ''));
    }
    N.arr(proj.terms || proj.glossary).forEach(function (g) {
      if (g && typeof g === 'object') add(g.a || g.src || g.source || g.term, g.b || g.tgt || g.target, g.note);
    });
    var A = App(), mine = [];
    try { mine = A && A.store ? A.store.get('glossary-user', []) : []; } catch (e) { mine = []; }
    if (Array.isArray(mine)) mine.forEach(function (g) {
      if (!g || typeof g !== 'object') return;
      var gf = g.from || 'en', gt = g.to || 'az', a = null, b = null;
      if (gf === P.from && gt === P.to) { a = g.a; b = g.b; } else if (gf === P.to && gt === P.from) { a = g.b; b = g.a; }
      if (a && b && srcAll.indexOf(lower(clean(a))) >= 0) add(a, b, g.note);
    });
    return out.join('; ').slice(0, 3500);
  }
  function contextLines(proj, P, name, segs) {
    var lines = [], reg = normReg(proj.register || proj.reg || proj.style);
    var field = clean(proj.field || proj.domain || proj.genre);
    lines.push('PROJECT: ' + name + '.' + (field ? ' GENRE: ' + field + '.' : '') + (reg ? ' STYLE: ' + regDesc(reg, P) + '.' : ''));
    var sit = proj.situation || proj.sit;
    if (sit && typeof sit === 'object') {
      var s = [sit.purpose && 'purpose: ' + clean(sit.purpose), sit.audience && 'readers: ' + clean(sit.audience), sit.note && 'note: ' + clean(sit.note)].filter(Boolean);
      if (s.length) lines.push('CLIENT SITUATION: ' + cut(s.join('; '), 600));
    }
    var reqs = N.arr(proj.reqs || proj.requirements).map(function (r) { return clean(Array.isArray(r) ? r[0] : r); }).filter(Boolean);
    if (reqs.length) lines.push('CLIENT REQUIREMENTS: ' + cut(reqs.join('; '), 800));
    var terms = termsLine(proj, P, segs);
    if (terms) lines.push('PROJECT TERMINOLOGY (source → approved target; mandatory, flag every other rendering as "Termin"): ' + terms);
    return lines.join('\n');
  }

  function qaPrompt(batch, P, ctx) {
    var segJson = JSON.stringify(batch.map(function (sg) { return { i: sg.n, source: cut(sg.s, SEG_CHARS), target: cut(sg.t, SEG_CHARS) }; }));
    return 'You are a "second pair of eyes": a senior reviser checking a professional ' + P.A + '→' + P.B + ' translation. Do NOT retranslate. ' +
      'For each numbered segment compare TARGET with SOURCE and report only real problems: meaning change, omission, addition, wrong or inconsistent terminology, ' +
      'numbers, dates and names that differ from the SOURCE, register that does not fit the STYLE, unnatural calques, word order copied from the SOURCE, grammar' +
      (P.to === 'az' ? ', Turkish words, suffixes or spellings in the Azerbaijani text' : '') +
      '. Change nothing that is already right; a correct segment gets no issue. Also list segments that need human attention.\n' +
      ctx + '\n' +
      (P.rules ? P.rules + '\n' : '') +
      N.ORTHO + '\n' + N.AZNOTES + '\n' +
      'TYPES: ' + TYPE_HELP + '\n' +
      'SEVERITY: "critical" = changes the legal or financial meaning, a wrong number, date or name, or an omission; "major" = wrong term, grammar error, Turkish form, wrong register; "minor" = style or punctuation.\n' +
      'SEGMENTS: ' + segJson + '\n' +
      'Reply with ONLY: {"issues": [{"i": segment number, "type": EXACTLY one of ' + JSON.stringify(QA_TYPES) + ', "severity": "critical" or "major" or "minor", ' +
      '"was": the exact wrong fragment copied from that segment\'s TARGET (empty string for an omission), "now": the corrected fragment that replaces "was", ' +
      '"why": one short sentence}], "risky": [numbers of segments that need human attention]}';
  }

  function callRetry(prompt, speed) {
    return N.call(prompt, { speed: speed }).then(null, function (e) {
      if (e && RETRY[e.code]) return N.call(prompt, { speed: speed });
      throw e;
    });
  }
  /* Runs the batches CONC at a time; stops scheduling new ones after a fatal error (bad code, limit, network…). */
  function runBatches(batches, mk, speed) {
    return new Promise(function (resolve) {
      var results = [], next = 0, active = 0, firstErr = null, fatal = false, done = false;
      function finish() { if (!done && !active) { done = true; resolve({ results: results, error: firstErr }); } }
      function pump() {
        while (!fatal && active < CONC && next < batches.length) {
          (function (k) {
            active++;
            callRetry(mk(batches[k]), speed).then(function (d) { results[k] = { ok: true, data: d }; }, function (e) {
              results[k] = { ok: false, error: e };
              if (!firstErr) firstErr = e || { code: 'server_error' };
              if (e && FATAL[e.code]) fatal = true;
            }).then(function () { active--; pump(); });
          })(next++);
        }
        if (fatal || next >= batches.length) finish();
      }
      pump();
    });
  }
  function makeBatches(list) {
    var out = [], cur = [], size = 0;
    list.forEach(function (sg) {
      var len = Math.min(sg.s.length, SEG_CHARS) + Math.min(sg.t.length, SEG_CHARS) + 40;
      if (cur.length && (cur.length >= BATCH || size + len > BATCH_CHARS)) { out.push(cur); cur = []; size = 0; }
      cur.push(sg); size += len;
    });
    if (cur.length) out.push(cur);
    return out;
  }
  function readBatch(d, batch) {
    var byN = {}, issues = [], risky = [];
    batch.forEach(function (sg) { byN[sg.n] = sg; });
    var list = d && Array.isArray(d.issues) ? d.issues : Array.isArray(d) ? d : [];
    list.slice(0, 40).forEach(function (x) {
      if (!x || typeof x !== 'object') return;
      var rawWas = N.str(x.was != null ? x.was : x.wrong).trim();
      var sg = byN[parseInt(x.i != null ? x.i : x.seg != null ? x.seg : x.n, 10)];
      if (!sg && rawWas) {
        var hits = batch.filter(function (s2) { return locate(s2.t, rawWas); });
        if (hits.length === 1) sg = hits[0];
      }
      if (!sg || !sg.t) return;
      var type = normType(x.type);
      var was = locate(sg.t, rawWas) || '—';
      var now = clean(x.now != null ? x.now : x.fix != null ? x.fix : x.correct);
      var why = clean(x.why || x.text || x.reason || x.comment);
      if (was !== '—' && now === was) return;
      if (was === '—' && !now && !why) return;
      issues.push({ n: sg.n, type: type, severity: normSev(x.severity, type), was: was, now: now, why: why || WHY_DEF[type] });
    });
    N.arr(d && d.risky).forEach(function (r) {
      var k = parseInt(r && typeof r === 'object' ? r.i : r, 10);
      if (byN[k] && risky.indexOf(k) < 0) risky.push(k);
    });
    return { issues: issues, risky: risky };
  }

  function turkishLocal(t) {
    var out = [];
    TR_EXTRA.forEach(function (p) {
      var w = findPhrase(t, p[0]);
      if (w) out.push({ type: 'Türk forması', severity: 'mid', was: w, now: matchCase(w, p[1]), why: '«' + p[0] + '» türk dilinə məxsusdur; Azərbaycan ədəbi dilində «' + p[1] + '» işlənir.' });
    });
    TR_SUFFIX.forEach(function (rule) {
      rule.re.lastIndex = 0;
      var m, guard = 0;
      while ((m = rule.re.exec(t)) && guard++ < 20) {
        var w = m[2];
        if (!out.some(function (x) { return overlaps(x.was, w); })) out.push({ type: 'Türk forması', severity: 'mid', was: w, now: '', why: rule.why });
        if (rule.re.lastIndex === m.index) rule.re.lastIndex++;
      }
    });
    return out;
  }
  function localChecks(sg, P) {
    if (!sg.t) {
      return sg.s ? [{ type: 'Boş seqment', severity: 'high', was: '—', now: 'Seqmenti tərcümə edin', why: 'Seqment tərcümə edilməyib.' }] : [];
    }
    var out = [];
    function add(x) {
      if (!x.was) x.was = '—';
      if (x.was !== '—' && out.some(function (y) { return overlaps(y.was, x.was); })) return;
      out.push(x);
    }
    var c = mock('check', { src: sg.s, tgt: sg.t, from: P.from, to: P.to });
    if (c && Array.isArray(c.errors)) c.errors.forEach(function (e) {
      if (!e || !LOCAL_TYPES[e.type]) return;
      add({ type: e.type, severity: e.severity === 'high' || e.severity === 'low' ? e.severity : 'mid', was: N.str(e.was), now: N.str(e.now), why: N.str(e.why) || WHY_DEF[e.type] });
    });
    if (P.to === 'az') turkishLocal(sg.t).forEach(add);
    return out;
  }
  /* Local issues are exact and deterministic; the model's issue on the same fragment only fills a missing fix. */
  function mergeSeg(local, remote) {
    var out = local.slice();
    remote.forEach(function (r) {
      var dup = null;
      out.forEach(function (l) {
        if (dup) return;
        if (overlaps(l.was, r.was)) dup = l;
        else if (l.type === 'Rəqəm' && r.type === 'Rəqəm' && l.was === '—') dup = l;
      });
      if (!dup) { out.push(r); return; }
      if (!dup.now && r.now) dup.now = r.now;
      if (dup.was === '—' && r.was !== '—') { dup.was = r.was; if (r.now) dup.now = r.now; }
    });
    return out;
  }

  N.kinds.qa = function (input) {
    var inp = input && typeof input === 'object' ? input : {};
    var proj = inp.project && typeof inp.project === 'object' ? inp.project : inp;
    var name = projName(inp);
    var segs = readSegments(inp, proj);
    if (!segs.length) return Promise.resolve(fail('Yoxlamaq üçün seqment mətni tapılmadı — layihəni redaktorda açıb yenidən yoxlayın.'));
    var P = resolveQAPair(inp, proj, segs);
    var local = {};
    segs.forEach(function (sg) { local[sg.n] = localChecks(sg, P); });
    var deep = segs.filter(function (sg) { return sg.s && sg.t; });
    var skipped = Math.max(0, deep.length - MAX_DEEP);
    deep = deep.slice(0, MAX_DEEP);
    var ctx = contextLines(proj, P, name, segs);
    var batches = makeBatches(deep);
    var run = batches.length ? runBatches(batches, function (b) { return qaPrompt(b, P, ctx); }, 'normal') : Promise.resolve({ results: [], error: null });
    return run.then(function (res) {
      var remote = {}, risky = [], failed = 0, okN = 0;
      batches.forEach(function (b, k) {
        var r = res.results[k];
        if (!r || !r.ok) { failed += b.length; return; }
        okN++;
        var got = readBatch(r.data, b);
        got.issues.forEach(function (x) { (remote[x.n] = remote[x.n] || []).push(x); });
        got.risky.forEach(function (n) { if (risky.indexOf(n) < 0) risky.push(n); });
      });
      if (batches.length && !okN) throw res.error || { code: 'server_error' };

      var issues = [];
      segs.forEach(function (sg) {
        mergeSeg(local[sg.n] || [], remote[sg.n] || []).forEach(function (x) {
          var type = ELDER_BY_TYPE[x.type] ? x.type : normType(x.type);
          var sev = x.severity === 'high' || x.severity === 'mid' || x.severity === 'low' ? x.severity : (SEV_DEF[type] || 'mid');
          var was = clean(x.was) || '—', now = clean(x.now);
          issues.push({ id: '', type: type, severity: sev, seg: sg.n, src: sg.s, tgt: sg.t, was: was, now: now, fix: now, text: clean(x.why) || WHY_DEF[type] || '', elder: ELDER_BY_TYPE[type] || 'Mənaçı Mirzə' });
        });
      });
      var ord = { high: 0, mid: 1, low: 2 };
      issues.sort(function (a, b) { return ord[a.severity] - ord[b.severity] || a.seg - b.seg; });
      issues = issues.slice(0, 200);
      issues.forEach(function (q, i) { q.id = 'q' + (i + 1); });

      var pen = 0; issues.forEach(function (q) { pen += q.severity === 'high' ? 5 : q.severity === 'mid' ? 3 : 1; });
      var score = clamp(100 - pen, 40, 99);
      var counts = {}; issues.forEach(function (q) { counts[q.type] = (counts[q.type] || 0) + 1; });
      var checks = QA_CHECKS.map(function (c) {
        var n = issues.filter(function (q) { return c.types.indexOf(q.type) >= 0; }).length;
        return { key: c.key, label: c.label, issues: n, ok: n === 0 };
      });
      var high = issues.filter(function (q) { return q.severity === 'high'; }).length;
      var unchecked = failed + skipped, total = segs.length, checked = total - unchecked;
      var summary = '«' + name + '»: ' + checked + ' seqment yoxlandı, ' + issues.length + ' qeyd' + (high ? ', ' + high + ' kritik.' : ', kritik səhv yoxdur.');
      if (high) summary += ' Təhvildən əvvəl kritik qeydləri bağlayın.';
      else if (!unchecked) summary += ' Təhvilə hazırdır.';
      if (unchecked) summary += ' ' + unchecked + ' seqment dərin yoxlamadan keçmədi' + (failed ? ' — yenidən yoxlayın.' : ' (bir dəfədə ' + MAX_DEEP + ' seqment yoxlanır).');
      risky.sort(function (a, b) { return a - b; });
      return {
        score: score, grade: gradeOf(score), summary: summary, project: name, segments: total, checked: checked,
        issues: issues, counts: counts, checks: checks, verdict: { score: score, text: summary, seal: sealOf(score), grade: gradeOf(score) },
        risky: risky
      };
    });
  };

  /* =====================================================================
     ANALYZE
     ===================================================================== */
  function normKey(s) { return lower(s).replace(/[«»"“”'’`]/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim(); }
  /* Same counters as the demo, without the translation memory — used only if App.mockAI is unavailable. */
  function localStats(text) {
    var sents = sentencesOf(text), words = countWords(text), seen = {}, rep = 0;
    sents.forEach(function (s) { var k = normKey(s); if (seen[k]) rep += countWords(s); seen[k] = 1; });
    var fresh = Math.max(0, words - rep), weighted = fresh + rep * 0.1, rate = 0.06;
    try { var A = App(), pr = A && typeof A.profile === 'function' ? A.profile() : null; if (pr && Number(pr.rate) > 0) rate = Number(pr.rate); } catch (e) { /* ignore */ }
    var avgLen = words / Math.max(1, sents.length);
    var nums = (String(text).match(/\d+(?:[.,  ]\d+)*/g) || []).length, risks = [];
    if (nums) risks.push(nums + ' rəqəm və məbləğ — Möhürdar Mirzə hər birini yoxlayacaq');
    if (avgLen > 24) risks.push('Uzun cümlələr (orta ' + Math.round(avgLen) + ' söz) — söz sırasına diqqət');
    return {
      words: words, chars: text.length, sentences: sents.length, repetition: words ? Math.round(rep / words * 100) : 0,
      tm: { exact: 0, fuzzy: 0, fresh: fresh, repeats: rep }, from: detectLang(text),
      readability: avgLen > 24 ? 'Mürəkkəb' : avgLen > 14 ? 'Orta' : 'Sadə',
      estimate: { hours: Math.max(0.5, Math.round(weighted / 380 * 2) / 2), price: Math.round(weighted * rate * 100) / 100, currency: 'AZN', weightedWords: Math.round(weighted) },
      terms: [], risks: risks
    };
  }
  function analyzePrompt(P, sents, inp) {
    var lines = [], size = 0, shown = 0;
    for (var i = 0; i < sents.length; i++) {
      var line = i + ': ' + cut(sents[i], 2000);
      if (size + line.length > ANALYZE_CHARS && shown) break;
      lines.push(line); size += line.length + 1; shown++;
    }
    if (shown < sents.length) lines.push('(… ' + (sents.length - shown) + ' more segments not shown)');
    var reg = normReg(inp.register), genre = clean(inp.genre || inp.domain || inp.field);
    var sit = inp.situation && typeof inp.situation === 'object' ? [inp.situation.purpose, inp.situation.audience, inp.situation.note].map(clean).filter(Boolean).join('; ') : clean(inp.situation);
    return 'You are a senior translation project manager. Analyse this ' + P.A + ' document before it is translated into ' + P.B + '. ' +
      'Decide what it is for, who reads it, its subject field and register, which terms must stay consistent, and where a translator is likely to go wrong ' +
      '(numbers, dates, names, legal or fixed formulas, ambiguous references, idioms, false friends, long sentences).' +
      (genre ? ' GENRE: ' + genre + '.' : '') + (reg ? ' STYLE: ' + regDesc(reg, P) + '.' : '') + (sit ? ' CLIENT SITUATION: ' + cut(sit, 600) + '.' : '') + '\n' +
      (P.rules ? P.rules + '\n' : '') +
      N.ORTHO + '\n' + N.AZNOTES + '\n' +
      'NUMBERED SEGMENTS:\n' + lines.join('\n') + '\n' +
      'Reply with ONLY: {"brief": {"goal": what the translation is for, "audience": who will read it, "register": the register the translation needs, ' +
      '"domain": the subject field, "special": [up to 5 special requirements]}, ' +
      '"domain": EXACTLY one of ' + JSON.stringify(DOMAIN_LABELS) + ', ' +
      '"register": EXACTLY one of "danisiq" (casual spoken), "neytral" (neutral), "resmi" (formal official), "huquqi" (legal), ' +
      '"terms": [up to 15 {"a": the term exactly as written in the document, "b": the recommended ' + P.B + ' equivalent, "why": short note}], ' +
      '"special": integer count of legal or fixed expressions, ' +
      '"risks": [up to 5 short sentences, each naming the exact word, number or sentence at risk and why], ' +
      '"questions": [up to 2 {"q": a clarifying question for the client, "options": [2 or 3 short answers], "why": why the answer matters}]}';
  }
  function shapeAnalysis(base, d, P, text) {
    d = d && typeof d === 'object' && !Array.isArray(d) ? d : {};
    var brief0 = d.brief && typeof d.brief === 'object' ? d.brief : {};
    var regId = normReg(d.register) || normReg(brief0.register) || (REG_LABEL[base.registerId] ? base.registerId : null);
    if (!regId) { var A = App(); try { regId = A && A.detect ? A.detect.register(text).id : null; } catch (e) { regId = null; } }
    if (!REG_LABEL[regId]) regId = 'neytral';
    var dom = normDomain(d.domain) || normDomain(brief0.domain) || normDomain(base.domain) || 'Ümumi';

    var terms = [], seen = {};
    function addTerm(t) { var k = lower(t.a); if (!t.a || !t.b || seen[k] || terms.length >= 12) return; seen[k] = 1; terms.push(t); }
    N.arr(base.terms).forEach(function (g) {
      if (g && typeof g === 'object') addTerm({ a: clean(g.a), b: clean(g.b), domain: clean(g.domain) || dom, note: clean(g.note), enforced: !!g.enforced });
    });
    N.arr(d.terms).forEach(function (g) {
      if (!g || typeof g !== 'object') return;
      var a = clean(g.a || g.term || g.source), b = clean(g.b || g.target || g.translation);
      if (a && text.toLowerCase().indexOf(a.toLowerCase()) < 0 && lower(text).indexOf(lower(a)) < 0) return; /* only terms really in the text */
      addTerm({ a: a, b: b, domain: dom, note: clean(g.why || g.note), enforced: false });
    });

    var risks = [], rk = {};
    function addRisk(r) { r = clean(r && typeof r === 'object' ? (r.why || r.text || r.risk) : r); var k = lower(r); if (!r || rk[k] || risks.length >= 7) return; rk[k] = 1; risks.push(r); }
    N.arr(d.risks).slice(0, 5).forEach(addRisk);
    N.arr(base.risks).forEach(addRisk);

    var questions = N.arr(d.questions).map(function (q) {
      if (typeof q === 'string') return { q: clean(q), options: [], why: '' };
      if (!q || typeof q !== 'object') return null;
      var opts = N.arr(q.options || q.answers).map(clean).filter(Boolean).slice(0, 4);
      return { q: clean(q.q || q.question), options: opts, why: clean(q.why || q.reason) };
    }).filter(function (q) { return q && q.q; }).slice(0, 2);

    var tm = base.tm && typeof base.tm === 'object' ? base.tm : {};
    var est = base.estimate && typeof base.estimate === 'object' ? base.estimate : {};
    var special = parseInt(d.special, 10);
    return {
      words: Number(base.words) || 0, chars: Number(base.chars) || text.length, sentences: Number(base.sentences) || 0,
      repetition: clamp(Number(base.repetition) || 0, 0, 100),
      tm: { exact: Number(tm.exact) || 0, fuzzy: Number(tm.fuzzy) || 0, fresh: Number(tm.fresh) || 0, repeats: Number(tm.repeats) || 0 },
      domain: dom, register: REG_LABEL[regId], registerId: regId, from: P.from,
      readability: base.readability === 'Mürəkkəb' || base.readability === 'Orta' || base.readability === 'Sadə' ? base.readability : 'Orta',
      estimate: { hours: Number(est.hours) || 0.5, price: Number(est.price) || 0, currency: est.currency || 'AZN', weightedWords: Number(est.weightedWords) || 0 },
      terms: terms, risks: risks, questions: questions,
      brief: {
        goal: clean(brief0.goal), audience: clean(brief0.audience), register: clean(brief0.register) || REG_LABEL[regId],
        domain: clean(brief0.domain) || dom, special: N.arr(brief0.special).map(clean).filter(Boolean).slice(0, 5)
      },
      special: isFinite(special) && special > 0 ? special : 0
    };
  }

  N.kinds.analyze = function (input) {
    var inp = typeof input === 'string' ? { text: input } : (input && typeof input === 'object' ? input : {});
    var text = N.str(inp.text || inp.src || inp.source).trim();
    if (!text) return Promise.resolve(fail('Analiz üçün mətn daxil edin.'));
    var base = mock('analyze', { text: text });
    if (!base || typeof base !== 'object' || typeof base.words !== 'number') base = localStats(text);
    var from = N.LANG[inp.from] ? inp.from : (base.from && N.LANG[base.from] ? base.from : detectLang(text));
    var to = N.LANG[inp.to] && inp.to !== from ? inp.to : (from === 'az' ? 'en' : 'az');
    var P = N.pairOf({ from: from, to: to });
    var sents = sentencesOf(text);
    if (!sents.length) sents = [text];
    var speed = (Number(base.words) || countWords(text)) < 150 ? 'fast' : 'normal';
    return callRetry(analyzePrompt(P, sents, inp), speed).then(function (d) { return shapeAnalysis(base, d, P, text); });
  };
})();
