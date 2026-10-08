/* Nuanza — live adapters for kinds 'check' (review a translation) and 'grade'
   (Akademiya: grade a student translation).
   Like the original Nuanza, each kind makes two independent Gemini calls in
   parallel — an examiner that only gives a score (speed fast) and a reviser /
   coach that finds, fixes and explains the errors (speed normal) — and averages
   the two scores. The only non-AI part is a number check computed from the
   actual source and translation (a number of the source that is missing or
   changed in the translation).
   'check' resolves to the demo AI.check shape (app.js aiCheck):
     { score, grade, summary, errors[{was,now,type,why,severity,elder}], fixed, src, tgt,
       from, to, counts, elders[{id,name,ok,count,text}], demo, verdict{score,text,seal,grade} }
     + live, scores{grader,reviewer}, disagree, unsure[{span,why}]
   'grade' resolves to the demo AI.grade shape (app.js aiGrade):
     { score, grade, passed, xp, rubric[{name,max,score}], feedback[{kind,text}], errors,
       verdict{score,text,seal,grade} }
     + live, letter, letterName, summary, strengths, skills, corrected, scores{grader,coach},
       disagree, from, to */
(function () {
  'use strict';
  var W = window, N = W.NuanzaAI;
  if (!N || !N.kinds) return;

  /* ---------- vocabulary the screens switch on (mirrors app.js / s-*.js) ---------- */
  var TYPES_HELP = '"Məna" (mistranslation, omission, addition, changed meaning), "Termin" (terminology, a key term), ' +
    '"Üslub" (register, style, unnatural calque, word choice), "Söz sırası" (word order), ' +
    '"Ardıcıllıq" (the same thing rendered inconsistently), "Türk forması" (a Turkish word, suffix or spelling in Azerbaijani text), ' +
    '"Orfoqrafiya" (spelling, capitalisation, grammar endings, agreement), "Durğu" (punctuation, quotation marks, number format), ' +
    '"Rəqəm" (wrong or missing number or amount), "Ad" (proper name), "Tarix" (date or time)';
  var TYPE_ALIAS = {
    'məna': 'Məna', 'məna təhrifi': 'Məna', 'buraxma': 'Məna', 'buraxılma': 'Məna', 'əlavə': 'Məna', 'yalançı dost': 'Məna',
    'boş seqment': 'Boş seqment', 'termin': 'Termin', 'terminologiya': 'Termin', 'lüğət': 'Termin',
    'üslub': 'Üslub', 'söz seçimi': 'Üslub', 'kalka': 'Üslub', 'mədəni uyğunsuzluq': 'Üslub', 'registr': 'Üslub',
    'söz sırası': 'Söz sırası', 'ardıcıllıq': 'Ardıcıllıq', 'türk forması': 'Türk forması',
    'orfoqrafiya': 'Orfoqrafiya', 'qrammatika': 'Orfoqrafiya', 'yazılış': 'Orfoqrafiya', 'durğu': 'Durğu',
    'rəqəm': 'Rəqəm', 'rəqəm/tarix': 'Rəqəm', 'say': 'Rəqəm', 'ad': 'Ad', 'xüsusi ad': 'Ad', 'tarix': 'Tarix',
    mistranslation: 'Məna', omission: 'Məna', addition: 'Məna', meaning: 'Məna', accuracy: 'Məna', 'false friend': 'Məna',
    terminology: 'Termin', term: 'Termin', style: 'Üslub', register: 'Üslub', calque: 'Üslub', 'word choice': 'Üslub',
    'word order': 'Söz sırası', consistency: 'Ardıcıllıq', grammar: 'Orfoqrafiya', spelling: 'Orfoqrafiya',
    orthography: 'Orfoqrafiya', punctuation: 'Durğu', number: 'Rəqəm', numbers: 'Rəqəm', name: 'Ad', 'proper name': 'Ad', date: 'Tarix'
  };
  var SEV = { 'Türk forması': 'mid', 'Rəqəm': 'high', 'Termin': 'mid', 'Məna': 'high', 'Orfoqrafiya': 'mid', 'Üslub': 'low', 'Durğu': 'low', 'Ad': 'mid', 'Tarix': 'high', 'Söz sırası': 'low', 'Ardıcıllıq': 'mid', 'Boş seqment': 'high' };
  var SEV_ORDER = { high: 0, mid: 1, low: 2 };
  var TYPE_NOUN = { 'Türk forması': 'türk forması', 'Rəqəm': 'rəqəm səhvi', 'Termin': 'termin', 'Məna': 'məna riski', 'Orfoqrafiya': 'orfoqrafiya səhvi', 'Üslub': 'üslub qeydi', 'Durğu': 'durğu qeydi', 'Ad': 'ad', 'Tarix': 'tarix', 'Söz sırası': 'söz sırası', 'Ardıcıllıq': 'ardıcıllıq qeydi', 'Boş seqment': 'boş seqment' };
  var ELDERS = [
    { id: 'lugetci', name: 'Lüğətçi Mirzə', done: 'Terminlər lüğətə uyğundur' },
    { id: 'menaci', name: 'Mənaçı Mirzə', done: 'Məna itkisi yoxdur' },
    { id: 'uslubcu', name: 'Üslubçu Mirzə', done: 'Üslub ardıcıldır' },
    { id: 'dilci', name: 'Dilçi Nənə', done: 'Ədəbi normaya uyğundur' },
    { id: 'mohurdar', name: 'Möhürdar Mirzə', done: 'Möhür vuruldu' }
  ];
  var ELDER_BY_TYPE = {
    'Termin': 'Lüğətçi Mirzə', 'Məna': 'Mənaçı Mirzə', 'Boş seqment': 'Mənaçı Mirzə', 'Üslub': 'Üslubçu Mirzə', 'Söz sırası': 'Üslubçu Mirzə',
    'Ardıcıllıq': 'Üslubçu Mirzə', 'Türk forması': 'Dilçi Nənə', 'Orfoqrafiya': 'Dilçi Nənə', 'Durğu': 'Dilçi Nənə',
    'Rəqəm': 'Möhürdar Mirzə', 'Ad': 'Möhürdar Mirzə', 'Tarix': 'Möhürdar Mirzə'
  };
  /* Akademiya rubric (same names and maxima as the demo; the five parts add up to the score) */
  var RUBRIC = [['Məna dəqiqliyi', 40], ['Terminologiya', 20], ['Üslub və axıcılıq', 20], ['Ədəbi norma', 10], ['Format (rəqəm, tarix, ad)', 10]];
  var SKILL_KEYS = ['terminologiya', 'qrammatika', 'üslub', 'məna', 'söz seçimi', 'kontekst', 'format'];
  var LETTERS = [[91, 'A', 'Əla'], [81, 'B', 'Çox yaxşı'], [71, 'C', 'Yaxşı'], [61, 'D', 'Kafi'], [51, 'E', 'Qənaətbəxş'], [0, 'F', 'Qeyri-kafi']];

  /* ---------- small helpers ---------- */
  var str = N.str, arr = N.arr, q = N.q;
  function lower(s) { s = str(s); try { return s.toLocaleLowerCase('az'); } catch (e) { return s.toLowerCase(); } }
  function key(s) { return lower(s).trim().replace(/\s+/g, ' '); }
  function fold(s) {
    return key(s).replace(/ə/g, 'e').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ü/g, 'u')
      .replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/\u0307/g, '');
  }
  function isObj(v) { return !!v && typeof v === 'object' && !Array.isArray(v); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function speedOf(v, def) { return v === 'fast' || v === 'normal' || v === 'deep' ? v : def; }
  /* 0-100 score or null; tolerates "85", 85.4 and 0.85 */
  function scoreOf(v) {
    if (isObj(v)) v = v.score;
    var n = parseFloat(v);
    if (!isFinite(n)) return null;
    if (n > 0 && n < 1) n *= 100;
    return clamp(Math.round(n), 0, 100);
  }
  function gradeWord(s) { return s >= 90 ? 'Əla' : s >= 80 ? 'Yaxşı' : s >= 70 ? 'Orta' : s >= 60 ? 'Zəif' : 'Yenidən işlənməli'; }
  function sealOf(s) { return s >= 85 ? 'Təhvilə hazırdır' : s >= 70 ? 'Düzəlişlərlə qəbul' : 'Yenidən işlənməli'; }
  function letterOf(s) { for (var i = 0; i < LETTERS.length; i++) if (s >= LETTERS[i][0]) return LETTERS[i]; return LETTERS[LETTERS.length - 1]; }
  function sentence(s) { s = str(s).trim(); return s && !/[.!?…]$/.test(s) ? s + '.' : s; }

  function detectLang(t) {
    t = str(t);
    if (/[\u0400-\u04FF]/.test(t)) return 'ru';
    if (/[əƏ]/.test(t)) return 'az';
    if (/[ğışçöüİĞŞÇÖÜ]/.test(t)) return /[xqXQ]/.test(t) ? 'az' : 'tr';
    if (/(^|\s)(ve|için|bir|ile|olarak|değil)(\s|$)/i.test(t)) return 'tr';
    return 'en';
  }
  function pairFor(inp, src, tgt) {
    var from = inp.from || (src ? detectLang(src) : ''), to = inp.to || (tgt ? detectLang(tgt) : '');
    if (!inp.to && tgt && to !== 'az' && from !== 'az' && /[ğışçöü]/i.test(tgt)) to = 'az';
    if (!from) from = to === 'en' ? 'az' : 'en';
    if (!to || to === from) to = from === 'az' ? 'en' : 'az';
    return N.pairOf({ from: from, to: to, pair: inp.pair });
  }
  function regKey(v) {
    var f = fold(v);
    if (!f) return '';
    if (N.REGISTER[f]) return f;
    if (/danis|casual|informal|spoken/.test(f)) return 'danisiq';
    if (/huquq|legal/.test(f)) return 'huquqi';
    if (/resmi|formal|official/.test(f)) return 'resmi';
    if (/neytral|neutral/.test(f)) return 'neytral';
    return '';
  }
  /* GENRE / REGISTER / LEVEL / pair rules / project terminology */
  function context(P, inp) {
    var L = [], genre = str(inp.genre || inp.domain || inp.field).trim(), reg = regKey(inp.register || inp.reg || inp.style);
    if (genre) L.push('GENRE: ' + genre + '.');
    if (reg) L.push('REGISTER: ' + N.REGISTER[reg] + '.');
    if (P.rules) L.push(P.rules);
    var terms = arr(inp.terms || inp.glossary).filter(function (t) { return isObj(t) && str(t.a).trim() && str(t.b).trim(); })
      .slice(0, 30).map(function (t) { return str(t.a).trim() + ' = ' + str(t.b).trim(); });
    if (terms.length) L.push('PROJECT TERMINOLOGY (approved by the client — the translation must follow it): ' + terms.join('; ') + '.');
    return L;
  }
  function srcLine(P, src) {
    return src ? 'SOURCE (' + P.A + '): ' + q(src) : 'SOURCE: not given — judge only the language quality of the translation.';
  }

  /* ---------- prompts (wording from docs/PROMPTS.md) ---------- */
  function graderPrompt(P, inp, src, tgt, ref, student) {
    var who = student ? 'STUDENT TRANSLATION' : 'TRANSLATION';
    return [(student ? 'You are a strict university translation examiner marking independently.' : 'You are a strict senior translation examiner marking independently.') +
      ' Score the ' + who + ' on a 100-point scale: accuracy of meaning first, then terminology, grammar, style and register.']
      .concat(context(P, inp), [
        N.ORTHO,
        ref ? 'REFERENCE TRANSLATION (one acceptable version, not the only correct one): ' + q(ref) : '',
        srcLine(P, src),
        who + ' (' + P.B + '): ' + q(tgt),
        'Reply with ONLY: {"score": integer 0-100}'
      ]).filter(Boolean).join('\n');
  }
  function reviewerPrompt(P, inp, src, tgt) {
    return ['You are a strict senior reviser who did NOT produce this translation. Check it against the SOURCE for real errors ' +
      '(mistranslation, omission, addition, terminology, grammar, register, unnatural calques, numbers, names, dates), fix them and ' +
      'score the TRANSLATION as submitted on a 100-point scale: accuracy of meaning first, then terminology, grammar, style and register. ' +
      'Change nothing that is already right and do not report mere preferences.']
      .concat(context(P, inp), [
        N.ORTHO,
        N.AZNOTES,
        srcLine(P, src),
        'TRANSLATION (' + P.B + '): ' + q(tgt),
        'Reply with ONLY: {"final": the full corrected translation, "errors": [up to 8 {"was": the shortest exact text copied from the TRANSLATION that contains the error ("" when something is missing), ' +
        '"now": the corrected text that replaces exactly that text, "type": EXACTLY one of ' + TYPES_HELP + ', ' +
        '"severity": "critical" or "major" or "minor", "why": one short sentence}], "score": integer 0-100, "summary": two short sentences, ' +
        '"unsure": [up to 4 {"span": exact text from the corrected translation, "why": "..."}]}'
      ]).join('\n');
  }
  function coachPrompt(P, inp, src, text, ref) {
    return ['You are an experienced translation teacher and coach at a university. Mark the STUDENT TRANSLATION on a 100-point scale and teach from the errors.']
      .concat(context(P, inp), [
        N.ORTHO,
        ref ? 'REFERENCE TRANSLATION (one good version, not the only correct one — accept other correct renderings): ' + q(ref) : '',
        inp.level ? 'STUDENT LEVEL: ' + str(inp.level).trim() + ' — pitch the explanations at this level, but mark the translation on its own merits.' : '',
        N.AZNOTES + " Quote the student's exact words. For every error name its root cause, explain WHY it is wrong in this context, and give one short correct example of the same point in a different sentence.",
        'Also rate these skills from 0 to 100: terminologiya, qrammatika, üslub, məna, söz seçimi, kontekst, format (numbers, dates and names).',
        srcLine(P, src),
        'STUDENT TRANSLATION (' + P.B + '): ' + q(text),
        'Reply with ONLY: {"score": integer 0-100, "summary": two short sentences, "strengths": [up to 3 short phrases], ' +
        '"skills": {"terminologiya": int, "qrammatika": int, "üslub": int, "məna": int, "söz seçimi": int, "kontekst": int, "format": int}, ' +
        '"errors": [up to 8 {"src": source fragment, "was": exact student text, "now": corrected text, "type": EXACTLY one of ' + TYPES_HELP + ', ' +
        '"cause": EXACTLY one of ' + N.CAUSES.map(function (c) { return JSON.stringify(c); }).join(', ') + ', ' +
        '"severity": "critical" or "major" or "minor", "why": "...", "example": {"src": "...", "tgt": "..."}}], "corrected": the full corrected translation}'
      ]).filter(Boolean).join('\n');
  }
  /* the independent examiner: a score or null (its failure never sinks the review) */
  function examiner(prompt) {
    return N.call(prompt, { speed: 'fast' }).then(scoreOf, function () { return null; });
  }

  /* ---------- normalising the model's errors ---------- */
  var ALIAS = {};
  Object.keys(TYPE_ALIAS).forEach(function (k) { ALIAS[fold(k)] = TYPE_ALIAS[k]; });
  function typeOf(t) {
    var k = fold(t);
    if (ALIAS[k]) return ALIAS[k];
    if (k.indexOf('turk') >= 0) return 'Türk forması';
    if (k.indexOf('termin') >= 0) return 'Termin';
    if (k.indexOf('reqem') >= 0 || k.indexOf('number') >= 0) return 'Rəqəm';
    return 'Məna';
  }
  function sevOf(s, type) {
    var k = fold(s);
    if (/^(critical|high|kritik|yuksek|ciddi)/.test(k)) return 'high';
    if (/^(major|mid|medium|orta|vacib)/.test(k)) return 'mid';
    if (/^(minor|low|kicik|asagi)/.test(k)) return 'low';
    return SEV[type] || 'mid';
  }
  function causeOf(c) {
    var k = fold(c);
    for (var i = 0; i < N.CAUSES.length; i++) if (k && fold(N.CAUSES[i]) === k) return N.CAUSES[i];
    return '';
  }
  var QUOTED = /^[«"“„'‘](.*)[»"”'’]$/;
  function unquote(s) { var m = QUOTED.exec(s); return m ? m[1].trim() : s; }
  function blank(s) { return s === '—' || s === '-' || s === '…' ? '' : s; }
  /* the exact spelling of a span inside the translation (case may differ in the model's quote) */
  function locate(text, w) {
    if (!w || !text || text.indexOf(w) >= 0) return w;
    var lt = lower(text), lw = lower(w), i = lt.indexOf(lw);
    return i >= 0 && lt.length === text.length ? text.substr(i, w.length) : w;
  }
  function normErrors(list, tgt) {
    var out = [], seen = {};
    arr(list).forEach(function (e) {
      if (!isObj(e) || out.length >= 10) return;
      var type = typeOf(e.type), was = blank(str(e.was).trim()), now = blank(str(e.now).trim()), why = str(e.why).trim();
      /* the model sometimes wraps both spans in quotes: keep real quotation marks (a «» fix), drop decorative ones */
      if (was && tgt.indexOf(was) < 0 && QUOTED.test(was)) {
        if (QUOTED.test(now)) now = unquote(now);
        was = unquote(was);
      }
      was = locate(tgt, was);
      if (!now && !why) return;
      if (was && was === now) return;
      if (was && seen[lower(was)]) return;
      if (was) seen[lower(was)] = 1;
      var o = { was: was || '—', now: now, type: type, why: why, severity: sevOf(e.severity, type), elder: ELDER_BY_TYPE[type] || 'Mənaçı Mirzə' };
      var cause = causeOf(e.cause);
      if (cause) o.cause = cause;
      if (str(e.src).trim()) o.src = str(e.src).trim();
      var ex = isObj(e.example) ? e.example : null;
      if (ex && (str(ex.src).trim() || str(ex.tgt).trim())) {
        o.example = { src: str(ex.src).trim(), tgt: str(ex.tgt).trim() };
        o.ex = o.example.src && o.example.tgt ? o.example.src + ' → ' + o.example.tgt : (o.example.tgt || o.example.src);
      }
      out.push(o);
    });
    return out;
  }
  function sortErrors(errors) {
    return errors.map(function (e, i) { return [e, i]; })
      .sort(function (a, b) { return (SEV_ORDER[a[0].severity] - SEV_ORDER[b[0].severity]) || (a[1] - b[1]); })
      .map(function (x) { return x[0]; });
  }

  /* ---------- deterministic number check (from the actual source and translation) ---------- */
  var NUM_RE = /\d{1,3}(?:[ \u00A0\u202F]\d{3})+(?:[.,]\d+)?|\d+(?:[.,]\d+)*/g;
  var MULT = [[/^\s*(min|bin|thousand|тыс)/i, 1e3], [/^\s*(milyon|million|mln|млн|миллион)/i, 1e6], [/^\s*(milyard|billion|bn|mlrd|млрд|миллиард)/i, 1e9]];
  function parseNum(raw, style) {
    var s = str(raw).replace(/[ \u00A0\u202F]/g, '');
    if (style === 'en') return parseFloat(s.replace(/,/g, ''));
    var t = s.replace(/\.(?=\d{3}(\D|$))/g, '');
    if (t.indexOf('.') >= 0) return NaN;
    return parseFloat(t.replace(',', '.'));
  }
  function digitsOf(s) { return str(s).replace(/\D/g, '').replace(/^0+(?=\d)/, ''); }
  function numbersIn(text) {
    var out = [], m;
    NUM_RE.lastIndex = 0;
    while ((m = NUM_RE.exec(text))) {
      var prev = m.index > 0 ? text.charAt(m.index - 1) : '';
      if (prev && /\p{L}/u.test(prev)) continue; /* codes such as A4, ISO9001 */
      var raw = m[0], after = text.slice(m.index + raw.length, m.index + raw.length + 14), mult = 1, vals = [];
      MULT.forEach(function (x) { if (x[0].test(after)) mult = x[1]; });
      [parseNum(raw, 'en'), parseNum(raw, 'eu')].forEach(function (v) { if (isFinite(v)) { vals.push(v); if (mult !== 1) vals.push(v * mult); } });
      out.push({ raw: raw, digits: digitsOf(raw), vals: vals });
    }
    return out;
  }
  function near(a, b) { return Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a)); }
  function same(x, y) {
    if (x.digits === y.digits) return true;
    return x.vals.some(function (v) { return y.vals.some(function (w) { return near(v, w); }); });
  }
  function sorted(d) { return d.split('').sort().join(''); }
  /* number words from ten up: a number may be written out in the translation («qırx beş gün») */
  var WORDNUM = {
    az: /(^|[^\p{L}])(on|iyirmi|otuz|qırx|əlli|altmış|yetmiş|səksən|doxsan|yüz|min|milyon|milyard)(?![\p{L}])/iu,
    tr: /(^|[^\p{L}])(on|yirmi|otuz|kırk|elli|altmış|yetmiş|seksen|doksan|yüz|bin|milyon|milyar)(?![\p{L}])/iu,
    en: /(^|[^\p{L}])(ten|eleven|twelve|\p{L}+teen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|million|billion)(?![\p{L}])/iu,
    ru: /(^|[^\p{L}])(десят|одиннадцат|двенадцат|\p{L}+надцат|двадцат|тридцат|сорок|пятьдесят|шестьдесят|семьдесят|восемьдесят|девяност|сто|двест|трист|\p{L}+сот|тысяч|миллион|миллиард)/iu
  };
  /* the source number written the way the target language writes numbers */
  function fmtNum(raw, from, to) {
    var st = from === 'en' ? 'en' : 'eu', v = parseNum(raw, st);
    if (!isFinite(v)) { st = st === 'en' ? 'eu' : 'en'; v = parseNum(raw, st); }
    if (!isFinite(v)) return raw;
    var mark = st === 'en' ? '.' : ',', s = str(raw).replace(/[ \u00A0\u202F]/g, ''), i = s.lastIndexOf(mark);
    var dec = i >= 0 ? s.length - i - 1 : 0;
    var intRaw = dec ? raw.slice(0, raw.lastIndexOf(mark)) : raw, grouped = /\D/.test(intRaw);
    var parts = Math.abs(v).toFixed(dec).split('.'), sep = to === 'en' ? ',' : to === 'tr' ? '.' : ' ';
    var int = grouped ? parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, sep) : parts[0];
    return int + (parts[1] ? (to === 'en' ? '.' : ',') + parts[1] : '');
  }
  function numberErrors(src, tgt, P, known) {
    if (!src || !tgt) return [];
    var A = numbersIn(src), B = numbersIn(tgt), out = [], seen = {}, spelled = WORDNUM[P.to] ? WORDNUM[P.to].test(tgt) : true;
    var knownDigits = '|' + known.map(function (e) { return digitsOf(e.was) + '|' + digitsOf(e.now); }).join('|') + '|';
    A.forEach(function (a) {
      if (out.length >= 4 || a.digits.length < 2 || seen[a.digits]) return; /* single digits are often spelled out */
      if (/^\d{1,4}[.\/-]\d{1,2}[.\/-]\d{1,4}$/.test(a.raw)) return;        /* dates: month names vary, the reviewer checks them */
      seen[a.digits] = 1;
      if (B.some(function (b) { return same(a, b); })) return;
      var swap = B.filter(function (b) {
        return b.digits.length >= 2 && sorted(b.digits) === sorted(a.digits) && !A.some(function (x) { return same(x, b); });
      })[0];
      if (knownDigits.indexOf('|' + a.digits + '|') >= 0 || (swap && knownDigits.indexOf('|' + swap.digits + '|') >= 0)) return; /* the reviewer already caught it */
      if (!swap && spelled) return; /* possibly written out in words — left to the reviewer */
      var now = fmtNum(a.raw, P.from, P.to);
      out.push(swap ?
        { was: swap.raw, now: now, type: 'Rəqəm', why: 'Mənbədə «' + a.raw + '», tərcümədə «' + swap.raw + '» — rəqəm uyğun gəlmir.', severity: 'high', elder: ELDER_BY_TYPE['Rəqəm'], auto: true } :
        { was: '—', now: now, type: 'Rəqəm', why: 'Mənbədəki «' + a.raw + '» tərcümədə tapılmadı.', severity: 'high', elder: ELDER_BY_TYPE['Rəqəm'], auto: true });
    });
    return out;
  }

  /* ---------- combining the two scores ---------- */
  function combine(a, b, errors) {
    if (a != null && b != null) return Math.round((a + b) / 2);
    if (a != null) return a;
    if (b != null) return b;
    if (!errors.length) throw { code: 'invalid_json' };
    var pen = 0;
    errors.forEach(function (e) { pen += e.severity === 'high' ? 15 : e.severity === 'mid' ? 7 : 3; });
    return clamp(100 - pen, 0, 100);
  }
  function disagreeNote(a, b) {
    return a != null && b != null && Math.abs(a - b) >= 12 ?
      'İki müstəqil yoxlayıcının balı xeyli fərqlidir (' + a + ' və ' + b + ') — nəticəyə diqqətlə baxın.' : '';
  }
  function countsOf(errors) {
    var c = {};
    errors.forEach(function (e) { c[e.type] = (c[e.type] || 0) + 1; });
    return c;
  }

  /* ================================================================
     kind 'check' — review a translation against its source
     ================================================================ */
  function checkResult(o) {
    var errors = o.errors, score = o.score, counts = countsOf(errors), summary = o.summary;
    if (!summary) {
      summary = !errors.length ? 'Ciddi səhv tapılmadı. Terminlər, rəqəmlər və ədəbi norma qaydasındadır.' :
        errors.length + ' düzəliş: ' + Object.keys(counts).map(function (k) { return counts[k] + ' ' + (TYPE_NOUN[k] || lower(k)); }).join(', ') + '.';
    }
    var elders = ELDERS.map(function (el) {
      var mine = errors.filter(function (e) { return e.elder === el.name; });
      return { id: el.id, name: el.name, ok: !mine.length, count: mine.length,
        text: mine.length ? mine.length + ' qeyd: ' + mine.slice(0, 2).map(function (e) { return '«' + e.was + '» → «' + e.now + '»'; }).join('; ') : el.done };
    });
    var g = gradeWord(score);
    return {
      score: score, grade: g, summary: summary, errors: errors, fixed: o.fixed, src: o.src, tgt: o.tgt, from: o.from, to: o.to,
      counts: counts, elders: elders, demo: false,
      verdict: { score: score, text: summary, seal: sealOf(score), grade: g },
      live: true, scores: o.scores || { grader: null, reviewer: null }, disagree: !!o.disagree, unsure: o.unsure || []
    };
  }
  function applyAll(text, errors) {
    errors.forEach(function (e) {
      if (e.was && e.was !== '—' && e.now && text.indexOf(e.was) >= 0) text = text.replace(e.was, e.now);
    });
    return text;
  }
  function check(inp) {
    if (typeof inp === 'string') inp = { tgt: inp };
    inp = inp || {};
    var src = str(inp.src || inp.source).trim();
    var tgt = str(inp.tgt || inp.target || inp.translation || inp.text).trim();
    var P = pairFor(inp, src, tgt);
    if (!tgt) {
      return Promise.resolve(checkResult({
        score: 0, src: src, tgt: '', from: P.from, to: P.to, fixed: '', summary: 'Tərcümə boşdur — yoxlamaq üçün mətn daxil edin.',
        errors: [{ was: '—', now: 'Tərcüməni daxil edin', type: 'Məna', why: 'Tərcümə mətni boşdur.', severity: 'high', elder: ELDER_BY_TYPE['Məna'] }]
      }));
    }
    var main = N.call(reviewerPrompt(P, inp, src, tgt), { speed: speedOf(inp.speed, 'normal') });
    var grader = examiner(graderPrompt(P, inp, src, tgt, str(inp.model).trim(), false));
    return Promise.all([main, grader]).then(function (res) {
      var j = res[0], g = res[1];
      if (!isObj(j)) throw { code: 'invalid_json' };
      var errors = normErrors(j.errors, tgt);
      var auto = numberErrors(src, tgt, P, errors);
      var r = scoreOf(j.score);
      var score = combine(r, g, errors.concat(auto));
      if (auto.length) score = Math.min(score, 84); /* an amount that does not match the source is never «ready» */
      errors = sortErrors(errors.concat(auto));
      var summary = (typeof j.summary === 'string' ? j.summary : typeof j.verdict === 'string' ? j.verdict : '').trim(), note = disagreeNote(r, g);
      if (note) summary = (summary ? sentence(summary) + ' ' : '') + note;
      var unsure = arr(j.unsure).filter(isObj).map(function (u) { return { span: str(u.span).trim(), why: str(u.why).trim() }; })
        .filter(function (u) { return u.span; }).slice(0, 4);
      var fixed = typeof j.final === 'string' && j.final.trim() ? j.final.trim() : applyAll(tgt, errors);
      return checkResult({
        score: score, errors: errors, summary: summary, fixed: fixed, src: src, tgt: tgt, from: P.from, to: P.to,
        scores: { grader: g, reviewer: r }, disagree: !!note, unsure: unsure
      });
    });
  }

  /* ================================================================
     kind 'grade' — Akademiya: grade a student's translation
     ================================================================ */
  function skillsOf(raw, fallback) {
    var by = {}, out = {};
    if (isObj(raw)) Object.keys(raw).forEach(function (k) { by[fold(k)] = scoreOf(raw[k]); });
    SKILL_KEYS.forEach(function (k) { var v = by[fold(k)]; out[k] = v == null ? fallback : v; });
    return out;
  }
  /* Spread the score over the five rubric parts in proportion to the coach's skill
     ratings, so that the parts add up exactly to the score (the screen sums them). */
  function fitRubric(pcts, S) {
    var max = RUBRIC.map(function (r) { return r[1]; });
    var loss = max.map(function (m, i) { return m * (100 - clamp(pcts[i], 0, 100)) / 100; });
    var need = 100 - S, capped = [];
    for (var it = 0; it < 6; it++) {
      var free = [], fixedLoss = 0, base = 0, maxFree = 0, over = false;
      max.forEach(function (m, i) { if (capped[i]) fixedLoss += loss[i]; else { free.push(i); base += loss[i]; maxFree += m; } });
      if (!free.length) break;
      var rest = Math.max(0, need - fixedLoss);
      free.forEach(function (i) {
        loss[i] = rest * (base > 0 ? loss[i] / base : max[i] / maxFree);
        if (loss[i] > max[i]) { loss[i] = max[i]; capped[i] = true; over = true; }
      });
      if (!over) break;
    }
    var sc = max.map(function (m, i) { return clamp(Math.round(m - loss[i]), 0, m); });
    var drift = S - sc.reduce(function (s, v) { return s + v; }, 0), guard = 0;
    while (drift !== 0 && guard++ < 50) {
      var step = drift > 0 ? 1 : -1, moved = false;
      for (var i = 0; i < sc.length && drift !== 0; i++) {
        if (sc[i] + step >= 0 && sc[i] + step <= max[i]) { sc[i] += step; drift -= step; moved = true; }
      }
      if (!moved) break;
    }
    return RUBRIC.map(function (r, i) { return { name: r[0], max: r[1], score: sc[i] }; });
  }
  function gradeResult(o) {
    var rub = o.rubric, errors = o.errors;
    var score = rub.reduce(function (s, r) { return s + r.score; }, 0);
    var g = gradeWord(score), L = letterOf(score), passed = score >= 70;
    var strong = [], improve = [];
    rub.forEach(function (r) { (r.max && r.score / r.max >= 0.85 ? strong : improve).push(r.name); });
    var feedback = [];
    var good = o.strengths && o.strengths.length ? o.strengths : strong;
    if (good.length) feedback.push({ kind: 'ok', text: 'Güclü tərəflər: ' + good.map(function (s) { return str(s).replace(/[.\s]+$/, ''); }).join(', ') + '.' });
    if (improve.length) feedback.push({ kind: 'warn', text: 'Üzərində işləyin: ' + lower(improve.join(', ')) + '.' });
    errors.slice(0, 3).forEach(function (e) { feedback.push({ kind: 'err', text: '«' + e.was + '» → «' + (e.now || '—') + '»' + (e.why ? ': ' + e.why : '') }); });
    if (o.summary) feedback.push({ kind: 'info', text: o.summary });
    var text = passed ?
      'İmtahan uğurla verildi. ' + (o.summary || (improve.length ? improve[0] + ' üzərində bir az da çalışın.' : 'Möhtəşəm nəticə!')) :
      'Bu dəfə alınmadı. ' + (o.summary || 'Səhv kartlarını təkrar edin və yenidən cəhd edin.');
    return {
      score: score, grade: g, passed: passed, xp: Math.round(score / 2), rubric: rub, feedback: feedback, errors: errors,
      verdict: { score: score, text: text, seal: passed ? 'Keçdi' : 'Təkrar', grade: g },
      live: true, letter: L[1], letterName: L[2], summary: o.summary || '', strengths: o.strengths || [], skills: o.skills || null,
      corrected: o.corrected || '', scores: o.scores || { grader: null, coach: null }, disagree: !!o.disagree, from: o.from, to: o.to
    };
  }
  function grade(inp) {
    if (typeof inp === 'string') inp = { text: inp };
    inp = inp || {};
    var text = str(inp.text || inp.answer || inp.tgt).trim(), ref = str(inp.model).trim(), src = str(inp.src || inp.source).trim();
    var P = pairFor(inp, src, text || ref);
    if (!text) {
      return Promise.resolve(gradeResult({
        rubric: RUBRIC.map(function (r) { return { name: r[0], max: r[1], score: 0 }; }), from: P.from, to: P.to,
        summary: 'Tərcümə boşdur — qiymət almaq üçün tərcüməni yazın.',
        errors: [{ was: '—', now: 'Tərcüməni daxil edin', type: 'Məna', why: 'Tərcümə mətni boşdur.', severity: 'high', elder: ELDER_BY_TYPE['Məna'] }]
      }));
    }
    var main = N.call(coachPrompt(P, inp, src, text, ref), { speed: speedOf(inp.speed, 'normal') });
    var grader = examiner(graderPrompt(P, inp, src, text, ref, true));
    return Promise.all([main, grader]).then(function (res) {
      var j = res[0], g = res[1];
      if (!isObj(j)) throw { code: 'invalid_json' };
      var errors = normErrors(j.errors, text);
      var auto = numberErrors(src, text, P, errors);
      var c = scoreOf(j.score);
      var S = combine(c, g, errors.concat(auto));
      var sk = skillsOf(j.skills, S);
      var rub = fitRubric([
        Math.round((sk['məna'] + sk.kontekst) / 2), sk.terminologiya, Math.round((sk['üslub'] + sk['söz seçimi']) / 2), sk.qrammatika, sk.format
      ], S);
      auto.forEach(function () { rub[4].score = Math.max(0, rub[4].score - 4); }); /* a number missing from the translation */
      var summary = (typeof j.summary === 'string' ? j.summary : '').trim(), note = disagreeNote(c, g);
      if (note) summary = (summary ? sentence(summary) + ' ' : '') + note;
      var strengths = arr(j.strengths).map(function (s) { return str(isObj(s) ? s.text : s).trim(); }).filter(Boolean).slice(0, 3);
      return gradeResult({
        rubric: rub, errors: sortErrors(errors.concat(auto)), summary: summary, strengths: strengths, skills: sk,
        corrected: str(j.corrected).trim(), scores: { grader: g, coach: c }, disagree: !!note, from: P.from, to: P.to
      });
    });
  }

  N.kinds.check = check;
  N.kinds.review = check;
  N.kinds.grade = grade;
  N.kinds.exam = grade;
})();
