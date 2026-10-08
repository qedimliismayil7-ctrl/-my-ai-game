/* Nuanza — live adapters for kind 'lesson' (personal lesson on a weak point) and
   the smaller learning / prep kinds of the demo engine:
     'terms' / 'glossary' (key terms of a text), 'cards' (mistake flashcards),
     'detect' (language, register, domain), 'questions' (questions for the client),
   plus 'analysis' → 'analyze', 'review' → 'check', 'exam' → 'grade' aliases when the
   target adapter exists and the alias is not registered yet.
   Not registered on purpose: 'deliverables' (export file list) and 'tm' (translation
   memory lookup) are not AI tasks and the live site has no real data for them, so
   app.js keeps answering «Bu funksiya hələ hazırlanır» instead of showing demo data.

   'lesson' input {id} (or {topic} / a string; optional level, pair/from/to, register, domain)
   resolves to the demo AI.lesson shape (app.js aiLesson):
     { id, title, topic, level, minutes, xp, intro, rule,
       examples[{src,tgt,note}], pitfalls[{wrong,right,why}],
       quiz[{q,options[],answer: 0-based index,explain}], task{src,model,hints[]} | null,
       summary, generatedAt, elderNote }
     + live, from, to, pair
   The id is the student's weak point; the level comes from Akademiya (academy:level) or
   the profile rank, the direction from App.profile().pairs, and the student's own
   recent mistakes / error log / skills (Akademiya store) are passed to the model. */
(function () {
  'use strict';
  var W = window, N = W.NuanzaAI;
  if (!N || !N.kinds) return;

  var str = N.str, arr = N.arr, q = N.q;

  /* ---------- vocabulary (mirrors app.js / s-*.js) ---------- */
  var REG_LABEL = { danisiq: 'Danışıq', neytral: 'Neytral', resmi: 'Rəsmi', huquqi: 'Hüquqi' };
  var REG_USE = {
    danisiq: 'casual / spoken — friends, colleagues, chats, social media',
    neytral: 'neutral — interface text, news, instructions',
    resmi: 'formal official — business letters, reports, official notices',
    huquqi: 'legal — contracts, laws, powers of attorney'
  };
  var DOMAINS = ['Hüquq', 'Maliyyə', 'Neft-qaz', 'İşgüzar yazışma', 'İnterfeys', 'Turizm', 'Tibb', 'Gündəlik yazışma', 'Ümumi'];
  var TAGS = ['Yalançı dost', 'Türk forması', 'Rəqəm', 'Termin', 'Hüquqi', 'Orfoqrafiya', 'Üslub', 'Məna', 'Leksika', 'Ədəbi norma'];
  /* s-academy TAG_OF: error type → card tag */
  var TYPE_TAG = { 'Türk forması': 'Türk forması', 'Termin': 'Termin', 'Rəqəm': 'Rəqəm', 'Tarix': 'Rəqəm', 'Durğu': 'Orfoqrafiya', 'Orfoqrafiya': 'Orfoqrafiya', 'Ad': 'Orfoqrafiya', 'Üslub': 'Üslub', 'Söz sırası': 'Üslub', 'Ardıcıllıq': 'Üslub', 'Məna': 'Məna' };
  var SKILLS = ['Məna', 'Terminologiya', 'Üslub', 'Ədəbi norma', 'Format']; /* s-academy AXES without «Sürət» */
  var CEFR = /^(A1|A2|B1|B2|C1|C2)$/;
  var RANK_LEVEL = ['A2', 'B1', 'B2', 'C1', 'C1', 'C2']; /* Şagird … Ustad */
  var LEVEL_DESC = {
    A1: 'beginner — very short everyday sentences and common words',
    A2: 'elementary — short everyday sentences and common words',
    B1: 'intermediate — simple business sentences',
    B2: 'upper-intermediate — contract and report fragments with some terminology and one idiom',
    C1: 'advanced — complex legal and technical sentences with dense terminology',
    C2: 'proficient — dense, nuanced professional text'
  };

  /* Weak points the screens ask for (s-home WEAK[].lesson ids = demo LESSONS ids). */
  var TOPICS = {
    'false-friends': {
      label: 'Leksika', title: 'Yalançı dostlar', match: /false|yalanci|friend|leksika/,
      en: 'false friends — source words that look or sound like Azerbaijani or international words but mean something else (English: actual, eventually, sympathetic, accurate, fabric, magazine; Russian: interlingual homonyms; Turkish: Turkish–Azerbaijani false friends)'
    },
    'legal-shall': {
      label: 'Hüquqi tərcümə', title: 'Müqavilədə öhdəlik: «shall»', match: /shall|legal|huquq|ohdelik|muqavile|contract/,
      prefer: ['en-az', 'az-en', 'ru-az', 'az-ru'], fallback: 'en-az',
      en: "obligation and legal-fact formulas in contracts — English 'shall', 'shall not', 'may', 'must' (Russian 'обязуется', 'должен', 'вправе'): obligations become -malıdır / -məlidir, legal facts and definitions take the present tense (qüvvəyə minir), never a plain future tense; and the reverse when translating into English"
    },
    'turkish-forms': {
      label: 'Ədəbi norma', title: 'Türk formalarından qaçmaq', match: /turk/,
      prefer: ['tr-az'], fallback: 'tr-az', strict: true, /* the trap is clearest from Turkish sources */
      en: 'avoiding Turkish words, suffixes and spellings in Azerbaijani text (için → üçün, tarafından → tərəfindən, şirket → şirkət, gerekli → lazımi, içinde → ərzində, Sayın → Hörmətli, -yor → -ır/-ir)'
    },
    numbers: {
      label: 'Lokallaşdırma', title: 'Rəqəm, tarix və valyuta', match: /number|reqem|tarix|valyuta|date|currency|durgu|format/,
      en: 'numbers, dates and currencies — decimal comma in Azerbaijani (12,4%), thousands separated by spaces (1 250 000), month names in lower case (15 mart 2026-cı il), currency (AZN 500 → 500 manat), amounts in words in legal texts; and the reverse conventions when translating out of Azerbaijani'
    },
    register: {
      label: 'Üslub', title: 'Üslub: danışıqdan hüquqiyə', match: /register|registr|uslub|style/,
      en: 'register — casual, neutral, formal and legal style; sən / siz address; choosing the style from the reader and the purpose; never mixing registers in one text'
    }
  };
  var TOPIC_IDS = ['false-friends', 'turkish-forms', 'legal-shall', 'register', 'numbers'];
  /* Error types of the Akademiya error log that are not one of the TOPICS. */
  var TYPE_EN = {
    'termin': 'terminology — choosing the right term for the field and keeping it consistent',
    'məna': 'accuracy of meaning — no omissions, additions or distortions',
    'söz sırası': 'word order — rebuilding sentences in natural target-language order',
    'orfoqrafiya': 'spelling, grammar endings and agreement',
    'ad': 'proper names — transliteration and official names',
    'ardıcıllıq': 'consistency — the same thing rendered the same way throughout',
    'yalançı dost': TOPICS['false-friends'].en
  };

  /* ---------- small helpers ---------- */
  function App() { return W.App || null; }
  function lower(s) { s = str(s); try { return s.toLocaleLowerCase('az'); } catch (e) { return s.toLowerCase(); } }
  function key(s) { return lower(s).trim().replace(/\s+/g, ' '); }
  function fold(s) {
    return key(s).replace(/ə/g, 'e').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ü/g, 'u')
      .replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/̇/g, '');
  }
  function isObj(v) { return !!v && typeof v === 'object' && !Array.isArray(v); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function int(v, def) { var n = parseInt(v, 10); return isFinite(n) ? n : def; }
  function speedOf(v, def) { return v === 'fast' || v === 'normal' || v === 'deep' ? v : def; }
  function clean(s, max) {
    s = str(isObj(s) ? (s.text || s.value || '') : s).replace(/\s+/g, ' ').trim();
    return max && s.length > max ? s.slice(0, max).trim() : s;
  }
  /* First non-empty plain value among the keys (models rename fields). */
  function pick(o, keys) {
    for (var i = 0; i < keys.length; i++) {
      var v = o[keys[i]];
      if (Array.isArray(v)) v = v.map(function (x) { return clean(x); }).filter(Boolean).join(' ');
      v = clean(v);
      if (v) return v;
    }
    return '';
  }
  function upper(s) { s = str(s); try { return s.toLocaleUpperCase('az'); } catch (e) { return s.toUpperCase(); } }
  function pairText(P) { return upper(P.from) + ' → ' + upper(P.to); }
  function sget(k) {
    var A = App();
    try { var v = A && A.store ? A.store.get(k, null) : null; return v === undefined ? null : v; } catch (e) { return null; }
  }
  function profile() {
    var A = App();
    try { var p = A && typeof A.profile === 'function' ? A.profile() : null; return isObj(p) ? p : {}; } catch (e) { return {}; }
  }
  function mock(kind, input) {
    var A = App();
    try { return A && typeof A.mockAI === 'function' ? A.mockAI(kind, input) : null; } catch (e) { return null; }
  }
  function detectLang(t) {
    t = str(t);
    if (/[Ѐ-ӿ]/.test(t)) return 'ru';
    if (/[əƏ]/.test(t)) return 'az';
    if (/[ğışçöüİĞŞÇÖÜ]/.test(t)) return /[xqXQ]/.test(t) ? 'az' : 'tr';
    if (/(^|\s)(ve|için|bir|ile|olarak|değil)(\s|$)/i.test(t)) return 'tr';
    return 'en';
  }
  function regKey(v) {
    var f = fold(v);
    if (!f) return '';
    if (N.REGISTER[f]) return f;
    if (/danis|casual|informal|spoken|colloq/.test(f)) return 'danisiq';
    if (/huquq|legal|law/.test(f)) return 'huquqi';
    if (/resmi|formal|official/.test(f)) return 'resmi';
    if (/neytral|neutral/.test(f)) return 'neytral';
    return '';
  }
  function domainOf(v, def) {
    var f = fold(v);
    for (var i = 0; i < DOMAINS.length; i++) if (fold(DOMAINS[i]) === f) return DOMAINS[i];
    return def;
  }
  function tagOf(v) {
    var f = fold(v);
    for (var t in TYPE_TAG) if (Object.prototype.hasOwnProperty.call(TYPE_TAG, t) && fold(t) === f) return TYPE_TAG[t];
    for (var i = 0; i < TAGS.length; i++) if (fold(TAGS[i]) === f) return TAGS[i];
    if (/turk/.test(f)) return 'Türk forması';
    if (/reqem|number|tarix|date/.test(f)) return 'Rəqəm';
    if (/termin|term/.test(f)) return 'Termin';
    if (/false|yalanci/.test(f)) return 'Yalançı dost';
    if (/orfo|spell|durgu|punct|qramm|grammar/.test(f)) return 'Orfoqrafiya';
    if (/uslub|style|register|soz sirasi|order|kalka|calque/.test(f)) return 'Üslub';
    if (/mena|meaning|buraxma|elave|omission|addition/.test(f)) return 'Məna';
    if (/huquq|legal|shall/.test(f)) return 'Hüquqi';
    return clean(v, 24) || 'Leksika';
  }
  function okPair(k) { k = str(k); return /^[a-z]{2}-[a-z]{2}$/.test(k) && !!N.LANG[k.slice(0, 2)] && !!N.LANG[k.slice(3)] && k.slice(0, 2) !== k.slice(3); }
  function hasPairInput(inp) { return okPair(inp.pair) || !!(inp.from && N.LANG[inp.from]) || !!(inp.to && N.LANG[inp.to]); }
  /* Direction given by the caller (pair wins over from / to, like NuanzaAI.pairOf); never X → X. */
  function explicitPair(inp, text) {
    var pr = okPair(inp.pair) ? str(inp.pair) : '';
    var from = pr ? pr.slice(0, 2) : N.LANG[inp.from] ? inp.from : text ? detectLang(text) : '';
    var to = pr ? pr.slice(3) : N.LANG[inp.to] ? inp.to : '';
    if (!from) from = to && to !== 'az' ? 'az' : 'en';
    if (!to || to === from) to = from === 'az' ? 'en' : 'az';
    return N.pairOf({ from: from, to: to });
  }

  /* ---------- the student ---------- */
  function userPairs() { return arr(profile().pairs).map(str).filter(okPair); }
  /* Direction: explicit input, else the student's pair that suits the topic, else their main pair. */
  function studentPair(inp, T) {
    if (hasPairInput(inp)) return explicitPair(inp, '');
    var list = userPairs(), pickd = '', i;
    if (T && T.prefer) for (i = 0; i < T.prefer.length && !pickd; i++) if (list.indexOf(T.prefer[i]) >= 0) pickd = T.prefer[i];
    if (!pickd && T && T.target) for (i = 0; i < list.length && !pickd; i++) if (list[i].slice(3) === T.target) pickd = list[i];
    if (!pickd && T && T.strict) pickd = T.fallback;
    return N.pairOf({ pair: pickd || list[0] || (T && T.fallback) || 'en-az' });
  }
  function studentLevel(inp) {
    var v = upper(str(inp.level).trim());
    if (CEFR.test(v)) return v;
    v = upper(str(sget('academy:level')).trim());
    if (CEFR.test(v)) return v;
    var p = profile();
    v = upper(str(p.level).trim());
    if (CEFR.test(v)) return v;
    var ri = p.rankInfo ? int(p.rankInfo.index, -1) : -1;
    return ri >= 0 ? RANK_LEVEL[Math.min(ri, RANK_LEVEL.length - 1)] : 'B2';
  }
  /* Only data the student really produced (Akademiya store) — nothing seeded. */
  function studentData() {
    var D = { mistakes: [], types: [], weakest: '' };
    arr(sget('academy:mycards')).filter(function (c) { return isObj(c) && c.mine && clean(c.bad) && clean(c.good); }).slice(0, 6).forEach(function (c) {
      D.mistakes.push({ was: clean(c.bad, 80), now: clean(c.good, 80), type: clean(c.tag, 30), why: clean(c.why, 160) });
    });
    var lg = sget('academy:errlog');
    if (isObj(lg)) {
      D.types = Object.keys(lg).filter(function (k) { return int(lg[k], 0) > 0; })
        .sort(function (a, b) { return int(lg[b], 0) - int(lg[a], 0); }).slice(0, 3);
    }
    var sk = sget('academy:skills');
    if (Array.isArray(sk) && sk.length >= SKILLS.length) {
      var lo = -1;
      for (var i = 0; i < SKILLS.length; i++) { var v = Number(sk[i]); if (isFinite(v) && (lo < 0 || v < Number(sk[lo]))) lo = i; }
      if (lo >= 0) D.weakest = SKILLS[lo] + ' (' + clamp(Math.round(Number(sk[lo])), 0, 100) + '/100)';
    }
    return D;
  }
  function topicOf(id, raw) {
    var T = TOPICS[id], o = { id: id };
    for (var k in T) if (Object.prototype.hasOwnProperty.call(T, k)) o[k] = T[k];
    if (raw) o.raw = raw;
    return o;
  }
  function matchTopic(raw) {
    var f = fold(raw);
    if (!f) return null;
    if (TOPICS[f]) return topicOf(f, raw);
    for (var i = 0; i < TOPIC_IDS.length; i++) {
      var id = TOPIC_IDS[i], T = TOPICS[id];
      if (f.indexOf(id) >= 0 || T.match.test(f) || (f.length >= 4 && fold(T.title).indexOf(f) >= 0)) return topicOf(id, raw);
    }
    return null;
  }
  function customTopic(raw, why) {
    var t = clean(raw, 60), f = key(raw);
    return {
      id: fold(t).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'lesson',
      label: t.length <= 30 ? t : 'Dərs', title: '', custom: true,
      en: (why || "the student's weak point") + ': «' + t + '»' + (TYPE_EN[f] ? ' — ' + TYPE_EN[f] : '')
    };
  }
  /* The id is the weak point; without one, the student's most frequent logged error, else a daily topic. */
  function lessonTopic(inp, D) {
    var raw = clean(inp.id || inp.topic || inp.title || inp.weakness, 80);
    if (raw) return matchTopic(raw) || customTopic(raw);
    if (D.types.length) return matchTopic(D.types[0]) || customTopic(D.types[0], "the student's most frequent error type");
    var day = Math.floor(Date.now() / 86400000), i = inp.index != null ? int(inp.index, day) : day;
    return topicOf(TOPIC_IDS[((i % TOPIC_IDS.length) + TOPIC_IDS.length) % TOPIC_IDS.length]);
  }

  /* ---------- lesson ---------- */
  function lessonPrompt(P, T, level, D, inp) {
    var fields = arr(profile().specialties).map(function (s) { return clean(s, 30); }).filter(Boolean).slice(0, 4);
    var genre = clean(inp.genre || inp.domain || inp.field, 60), reg = regKey(inp.register || inp.reg || inp.style);
    var A = P.A, B = P.B;
    var L = [
      'Create a personal 5-7 minute translation lesson for an Azerbaijani university translation student.',
      "TOPIC (the student's weak point): " + T.en + '.',
      'DIRECTION: ' + A + ' → ' + B + '. LEVEL: ' + level + ' — ' + (LEVEL_DESC[level] || LEVEL_DESC.B2) + '.'
    ];
    if (D.weakest) L.push('WEAKEST SKILL: ' + D.weakest + '.');
    if (D.types.length) L.push('MOST FREQUENT ERROR TYPES: ' + D.types.join(', ') + '.');
    if (D.mistakes.length) L.push('RECENT REPEATED MISTAKES (build on the ones that fit the TOPIC, ignore the rest): ' + JSON.stringify(D.mistakes));
    if (fields.length) L.push("Where it fits the TOPIC, take the example sentences from the student's fields: " + fields.join(', ') + '.');
    if (genre) L.push('GENRE: ' + genre + '.');
    if (reg) L.push('REGISTER: ' + N.REGISTER[reg] + '.');
    if (P.rules) L.push(P.rules);
    L.push(N.ORTHO, N.AZNOTES,
      'Teach only the TOPIC, with fresh, realistic sentences — never repeat a sentence. Source sentences are in ' + A + ', translations in ' + B +
      '. Quote words and phrases in «». Questions and hints never give away more than they must. Vary the position of the correct quiz option.',
      'Reply with ONLY: {"title": short Azerbaijani title of the lesson, "topic": Azerbaijani topic label of 1-3 words, "minutes": integer 4-8, ' +
      '"intro": 2-3 short sentences, "rule": the rule to remember in 1-2 sentences, ' +
      '"examples": [3 {"src": a sentence in ' + A + ', "tgt": its correct ' + B + ' translation, "note": one short sentence on the point}], ' +
      '"pitfalls": [2-3 {"wrong": a typical wrong ' + B + ' rendering, "right": the correct ' + B + ' rendering, "why": one short sentence}], ' +
      '"quiz": [3 {"q": the question (it may quote a sentence in ' + A + '), "options": [3-4 answer options], "answer": 0-based index of the correct option, "explain": one short sentence}], ' +
      '"task": {"src": one sentence in ' + A + ' of 12-25 words for the student to translate, "model": a model ' + B + ' translation, "hints": [2-3 short hints that do not give the whole translation]}, ' +
      '"summary": one sentence to remember}');
    return L.join('\n');
  }
  function normExamples(v) {
    return arr(v).filter(isObj).map(function (e) {
      return { src: pick(e, ['src', 'source', 'original', 'a']), tgt: pick(e, ['tgt', 'target', 'translation', 'good', 'correct', 'b']), note: pick(e, ['note', 'why', 'explain', 'comment']) };
    }).filter(function (e) { return e.src && e.tgt; }).slice(0, 5);
  }
  function normPitfalls(v) {
    return arr(v).filter(isObj).map(function (e) {
      return { wrong: pick(e, ['wrong', 'bad', 'was', 'incorrect']), right: pick(e, ['right', 'good', 'now', 'correct']), why: pick(e, ['why', 'note', 'explain']) };
    }).filter(function (e) { return e.wrong && e.right && key(e.wrong) !== key(e.right); }).slice(0, 4);
  }
  /* 0-based index of the correct option, or -1. Accepts 1, "1", "B", "B) …" and the option text. */
  function answerText(a, opts) {
    if (isObj(a)) a = a.text != null ? a.text : a.index;
    if (typeof a === 'number' || /^\s*\d+\s*$/.test(str(a))) {
      var n = int(a, -1);
      if (n >= 0 && n < opts.length) return opts[n];
      if (n === opts.length && n > 0) return opts[n - 1]; /* 1-based */
      return '';
    }
    var s = clean(a);
    if (!s) return '';
    var m = /^([A-Ea-e])(?:[).:]|\s*$)/.exec(s);
    if (m && s.length <= 3) { var li = upper(m[1]).charCodeAt(0) - 65; return li < opts.length ? opts[li] : ''; }
    for (var i = 0; i < opts.length; i++) if (key(opts[i]) === key(s)) return opts[i];
    for (i = 0; i < opts.length; i++) if (key(opts[i]).replace(/^[a-e][).]\s*/, '') === key(s).replace(/^[a-e][).]\s*/, '')) return opts[i];
    return '';
  }
  function normQuiz(v) {
    return arr(v).filter(isObj).map(function (x) {
      var raw = arr(x.options || x.choices || x.variants).map(function (o) { return clean(isObj(o) ? (o.text || o.t) : o); }).filter(Boolean);
      var right = answerText(x.answer != null ? x.answer : x.correct != null ? x.correct : x.ans, raw);
      var opts = [], seen = {};
      raw.forEach(function (o) { var k = key(o); if (!seen[k] && opts.length < 5) { seen[k] = 1; opts.push(o); } });
      var ans = -1;
      for (var i = 0; i < opts.length && ans < 0; i++) if (right && key(opts[i]) === key(right)) ans = i;
      return { q: pick(x, ['q', 'question', 'text']), options: opts, answer: ans, explain: pick(x, ['explain', 'why', 'explanation', 'note']) };
    }).filter(function (x) { return x.q && x.options.length >= 2 && x.answer >= 0; }).slice(0, 5);
  }
  function normTask(t, final) {
    if (!isObj(t)) t = typeof t === 'string' ? { src: t } : {};
    var src = pick(t, ['src', 'source', 'text']) || clean(final);
    if (!src) return null;
    var hints = Array.isArray(t.hints) ? t.hints : t.hints != null ? [t.hints] : t.hint != null ? [t.hint] : [];
    return {
      src: src,
      model: pick(t, ['model', 'tgt', 'target', 'translation', 'answer']),
      hints: hints.map(function (h) { return clean(h, 160); }).filter(Boolean).slice(0, 4)
    };
  }
  function lesson(inp) {
    if (typeof inp === 'string') inp = { topic: inp };
    inp = isObj(inp) ? inp : {};
    var D = studentData(), T = lessonTopic(inp, D), P = studentPair(inp, T), level = studentLevel(inp);
    return N.call(lessonPrompt(P, T, level, D, inp), { speed: speedOf(inp.speed, 'normal') }).then(function (j) {
      if (!isObj(j)) throw { code: 'invalid_json' };
      if (isObj(j.lesson)) j = j.lesson;
      var examples = normExamples(j.examples), pitfalls = normPitfalls(j.pitfalls || j.mistakes), quiz = normQuiz(j.quiz || j.practice || j.questions);
      var intro = pick(j, ['intro', 'explain', 'introduction', 'explanation']), rule = pick(j, ['rule', 'goal']);
      if (!examples.length && !quiz.length && !rule) throw { code: 'invalid_json' };
      var task = normTask(j.task, j.final);
      var topic = T.custom ? (clean(j.topic, 40) || T.label) : T.label;
      var est = Math.round(2 + examples.length * 0.5 + pitfalls.length * 0.3 + quiz.length * 0.7 + (task ? 1.5 : 0));
      var minutes = clamp(int(j.minutes, est), 3, 10);
      return {
        id: T.id,
        title: clean(j.title, 120) || T.title || topic || 'Şəxsi dərs',
        topic: topic || 'Dərs',
        level: level,
        minutes: minutes,
        xp: minutes * 5,
        intro: intro,
        rule: rule,
        examples: examples,
        pitfalls: pitfalls,
        quiz: quiz,
        task: task,
        summary: pick(j, ['summary', 'remember', 'takeaway']),
        generatedAt: new Date().toISOString(),
        elderNote: 'Məclis bu dərsi ' + (D.mistakes.length ? 'son səhvləriniz əsasında, ' : lower(topic || 'tərcümə') + ' üzrə, ') +
          pairText(P) + ' istiqaməti və ' + level + ' səviyyəsi üçün hazırladı.',
        live: true, from: P.from, to: P.to, pair: P.key
      };
    });
  }

  /* ---------- terms / glossary ---------- */
  function textPair(inp, text) {
    if (hasPairInput(inp)) return explicitPair(inp, text);
    if (!text) return studentPair(inp, null);
    var f = detectLang(text), list = userPairs(), k = '';
    for (var i = 0; i < list.length && !k; i++) if (list[i].slice(0, 2) === f) k = list[i];
    return N.pairOf({ pair: k || (f === 'az' ? 'az-en' : f + '-az') });
  }
  function countIn(text, term) {
    var t = lower(text), a = lower(term);
    if (!a) return 0;
    return t.split(a).length - 1;
  }
  /* The user's own approved glossary (Ayarlar / translator) — real data, enforced like the demo glossary hits. */
  function userGlossary(text, P) {
    var out = [], mine = sget('glossary-user'), t = lower(text);
    arr(mine).filter(isObj).forEach(function (g) {
      var a = clean(g.a), b = clean(g.b);
      if (!a || !b || (g.from || 'en') !== P.from || (g.to || 'az') !== P.to || t.indexOf(lower(a)) < 0) return;
      out.push({ a: a, b: b, domain: clean(g.d || g.domain) || 'Ümumi', note: clean(g.note), enforced: true, count: Math.max(1, countIn(text, a)) });
    });
    return out.slice(0, 16);
  }
  function terms(inp) {
    if (typeof inp === 'string') inp = { text: inp };
    inp = isObj(inp) ? inp : {};
    var text = str(inp.text || inp.src).trim().slice(0, 12000), P = textPair(inp, text);
    var field = clean(inp.domain || inp.field || inp.genre, 40);
    if (!text && !field) field = clean(arr(profile().specialties)[0], 40) || 'Hüquq';
    var mine = text ? userGlossary(text, P) : [];
    var L = text
      ? ['You are a senior terminologist preparing a project glossary. Extract the key terms of this ' + P.A + ' TEXT that a translator into ' + P.B +
          ' must render consistently: domain terms, defined terms, fixed legal or technical expressions and official names — not ordinary words.']
      : ['You are a senior terminologist. List the 8 most important ' + P.A + ' terms of the field «' + field + '» that translation students must know, with their standard ' + P.B + ' equivalents.'];
    if (text && field) L.push('GENRE: ' + field + '.');
    if (mine.length) L.push('Already in the client glossary (do not list them again): ' + mine.map(function (g) { return g.a; }).join('; ') + '.');
    if (P.rules) L.push(P.rules);
    L.push(N.ORTHO, N.AZNOTES,
      'Reply with ONLY: {"terms": [' + (text ? 'up to 16' : '8') + ' {"a": the ' + P.A + ' term' + (text ? ' exactly as written in the TEXT' : '') +
      ', "b": the standard ' + P.B + ' equivalent, "domain": EXACTLY one of ' + JSON.stringify(DOMAINS) + ', "note": one short note on usage, or ""}]}');
    if (text) L.push('TEXT:', q(text));
    return N.call(L.join('\n'), { speed: speedOf(inp.speed, 'normal') }).then(function (j) {
      var list = Array.isArray(j) ? j : isObj(j) ? (j.terms || j.glossary) : null;
      if (!Array.isArray(list)) throw { code: 'invalid_json' };
      var seen = {}, out = mine.slice();
      mine.forEach(function (g) { seen[key(g.a)] = 1; });
      list.filter(isObj).forEach(function (g) {
        var a = pick(g, ['a', 'term', 'source', 'src']), b = pick(g, ['b', 'equivalent', 'target', 'tgt', 'translation']);
        if (!a || !b || seen[key(a)] || out.length >= 16) return;
        seen[key(a)] = 1;
        var item = { a: clean(a, 120), b: clean(b, 160), domain: domainOf(g.domain || g.d, domainOf(field, field || 'Ümumi')), note: pick(g, ['note', 'why', 'comment']), suggested: true };
        if (text) item.count = Math.max(1, countIn(text, a));
        out.push(item);
      });
      return out;
    });
  }

  /* ---------- detect ---------- */
  function detect(inp) {
    var t = clean(typeof inp === 'string' ? inp : isObj(inp) ? (inp.text || inp.src) : '').slice(0, 4000);
    if (!t) return Promise.resolve(mock('detect', '') || { id: 'neytral', label: REG_LABEL.neytral, confidence: 0.42, reasons: [], lang: 'en', domain: 'Ümumi' });
    var regs = Object.keys(REG_USE).map(function (k) { return '"' + k + '" (' + REG_USE[k] + ')'; }).join(', ');
    var prompt = [
      'Identify the language, the register and the domain of the TEXT. Registers: ' + regs + '.',
      'Reply with ONLY: {"lang": "en" or "az" or "ru" or "tr", "register": EXACTLY one of "danisiq", "neytral", "resmi", "huquqi", ' +
      '"confidence": number 0-1, "cues": [up to 4 exact words or short phrases copied from the TEXT that show the register], "domain": EXACTLY one of ' + JSON.stringify(DOMAINS) + '}',
      'TEXT:', q(t)
    ].join('\n');
    return N.call(prompt, { speed: speedOf(isObj(inp) ? inp.speed : '', 'fast') }).then(function (j) {
      if (!isObj(j)) throw { code: 'invalid_json' };
      var id = regKey(j.register || j.reg) || 'neytral';
      var c = parseFloat(j.confidence);
      if (!isFinite(c)) c = 0.7;
      if (c > 1) c /= 100;
      var low = lower(t), seen = {};
      var reasons = arr(j.cues || j.reasons).map(function (x) { return clean(isObj(x) ? (x.cue || x.text) : x, 40); })
        .filter(function (x) { var k = lower(x); if (!x || seen[k] || low.indexOf(k) < 0) return false; seen[k] = 1; return true; })
        .slice(0, 4).map(function (x) { return { reg: id, cue: x }; });
      var lang = str(j.lang || j.language).toLowerCase().slice(0, 2);
      return {
        id: id, label: REG_LABEL[id], confidence: Math.round(clamp(c, 0.3, 0.99) * 100) / 100, reasons: reasons,
        lang: N.LANG[lang] ? lang : detectLang(t), domain: domainOf(j.domain, 'Ümumi'), live: true
      };
    });
  }

  /* ---------- questions for the client ---------- */
  function questions(inp) {
    if (typeof inp === 'string') inp = { text: inp };
    inp = isObj(inp) ? inp : {};
    var t = str(inp.text || inp.src).trim().slice(0, 8000);
    if (!t) return Promise.resolve([]);
    var P = textPair(inp, t), L = [
      'You are a senior translator about to translate this ' + P.A + ' TEXT into ' + P.B + '. List up to 3 short questions you would ask the client first — ' +
      'only about choices that really change this translation (a term with two accepted equivalents, sən / siz address, how to write amounts, currency, dates or names, register). ' +
      'Each question has 2-3 concrete answer options and a short reason. Ask nothing the TEXT already answers.'
    ];
    var reg = regKey(inp.register || inp.reg);
    if (reg) L.push('REGISTER: ' + N.REGISTER[reg] + '.');
    if (inp.domain) L.push('GENRE: ' + clean(inp.domain, 60) + '.');
    L.push(N.ORTHO, N.AZNOTES,
      'Reply with ONLY: {"questions": [up to 3 {"q": the question, "options": [2-3 short options], "why": one short sentence}]}',
      'TEXT:', q(t));
    return N.call(L.join('\n'), { speed: speedOf(inp.speed, 'fast') }).then(function (j) {
      var list = Array.isArray(j) ? j : isObj(j) ? j.questions : null;
      if (!Array.isArray(list)) throw { code: 'invalid_json' };
      return list.filter(isObj).map(function (x) {
        var seen = {}, opts = arr(x.options || x.choices).map(function (o) { return clean(o, 80); })
          .filter(function (o) { var k = key(o); if (!o || seen[k]) return false; seen[k] = 1; return true; }).slice(0, 4);
        return { q: pick(x, ['q', 'question']), options: opts, why: pick(x, ['why', 'reason', 'note']) };
      }).filter(function (x) { return x.q && x.options.length >= 2; }).slice(0, 3);
    });
  }

  /* ---------- mistake cards ---------- */
  function cards(inp) {
    inp = isObj(inp) ? inp : {};
    var want = clamp(int(inp.count, 10), 1, 20), out = [], seen = {};
    function add(c) {
      if (!c.front || !c.back || key(c.front) === key(c.back) || seen[key(c.front)] || out.length >= want) return;
      seen[key(c.front)] = 1;
      out.push(c);
    }
    /* 1. errors handed in by the caller (e.g. a check / grade result) and 2. the student's own saved cards */
    arr(inp.errors).filter(isObj).forEach(function (e) {
      add({ front: clean(e.was || e.bad || e.wrong, 120), back: clean(e.now || e.good || e.right, 120), note: clean(e.why || e.note, 200), tag: tagOf(e.type || e.tag) });
    });
    arr(sget('academy:mycards')).filter(function (c) { return isObj(c) && c.mine; }).forEach(function (c) {
      add({ front: clean(c.bad, 120), back: clean(c.good, 120), note: clean(c.why, 200), tag: tagOf(c.tag) });
    });
    if (out.length >= want || inp.generate === false) return Promise.resolve(out);
    /* 3. fill up with new cards on the student's weak points */
    var D = studentData(), P = studentPair(inp, null), level = studentLevel(inp), n = want - out.length;
    var L = [
      'Create ' + n + ' review flashcards for an Azerbaijani university translation student. DIRECTION: ' + P.A + ' → ' + P.B + '. LEVEL: ' + level + ' — ' + (LEVEL_DESC[level] || LEVEL_DESC.B2) + '.',
      'Each card shows a typical WRONG ' + P.B + ' rendering that students at this level really produce (front) and the correct form (back), with a short note naming the point. ' +
      'Mix false friends, calques, terminology, number and date format, register' + (P.to === 'az' ? ' and Turkish forms' : '') + '.'
    ];
    if (D.types.length) L.push('Focus first on the MOST FREQUENT ERROR TYPES: ' + D.types.join(', ') + '.');
    if (D.weakest) L.push('WEAKEST SKILL: ' + D.weakest + '.');
    if (out.length) L.push('The student already has these cards — make new ones on the same points: ' + JSON.stringify(out.map(function (c) { return c.front + ' → ' + c.back; })));
    if (P.rules) L.push(P.rules);
    L.push(N.ORTHO, N.AZNOTES,
      'Reply with ONLY: {"cards": [' + n + ' {"front": the wrong form (a word or short phrase; add the source word in brackets when it helps), "back": the correct form, ' +
      '"note": one short sentence, "tag": EXACTLY one of ' + JSON.stringify(TAGS) + '}]}');
    return N.call(L.join('\n'), { speed: speedOf(inp.speed, 'normal') }).then(function (j) {
      var list = Array.isArray(j) ? j : isObj(j) ? j.cards : null;
      if (!Array.isArray(list)) throw { code: 'invalid_json' };
      list.filter(isObj).forEach(function (c) {
        add({ front: pick(c, ['front', 'wrong', 'bad', 'was']).slice(0, 120), back: pick(c, ['back', 'right', 'good', 'now']).slice(0, 120), note: pick(c, ['note', 'why']).slice(0, 200), tag: tagOf(c.tag || c.type) });
      });
      if (!out.length) throw { code: 'invalid_json' };
      return out;
    });
  }

  N.kinds.lesson = lesson;
  N.kinds.terms = terms;
  N.kinds.glossary = terms;
  N.kinds.cards = cards;
  N.kinds.detect = detect;
  N.kinds.questions = questions;

  /* Demo aliases: forward to the real adapter at call time, only where one exists. */
  function alias(name, target) {
    if (typeof N.kinds[name] === 'function' || typeof N.kinds[target] !== 'function') return;
    N.kinds[name] = function (inp) { return N.kinds[target](inp); };
  }
  function aliases() { alias('analysis', 'analyze'); alias('review', 'check'); alias('exam', 'grade'); }
  aliases();
  try { W.addEventListener('DOMContentLoaded', aliases); } catch (e) { /* old browser */ }
})();
