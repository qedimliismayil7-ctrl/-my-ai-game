/* =====================================================================
   TENSO — öyrənmə ekranları (s-tenso-learn.js), mode 'grammar'
   g-test      «Səviyyə testi»    adaptiv CEFR testi (data-placement.js), nəticə → 'tenso:level'
   g-practice  «Şəxsi məşq»       zəif qaydalar üzrə 10 tapşırıq (canlı AI → oflayn kurs tapşırıqları)
   g-cards     «Yaddaş kartları»  Leitner təkrarı (1, 3, 7, 16 gün) — səhv kartları
   g-map       «Mövzu xəritəsi»   kursun bütün vahidləri səviyyələr üzrə: boz / sarı / yaşıl

   ---------------------------------------------------------------------
   QLOBAL API — window.TensoLearn (core ekranları belə çağırsın)
   ---------------------------------------------------------------------
   Yoxlayıcı səhv tapanda (hər issue üçün bir dəfə, istifadəçi düzəlişi görəndə):
     if (window.TensoLearn) TensoLearn.addMistake({
       wrong: 'I am agree',            // səhv hissə (məcburi, yoxsa sentence)
       fix: 'I agree',                 // düzgün variant (məcburi)
       rule: 'en.be_agree',            // checker qaydası, kurs rule_id-si, unit id və ya mövzu açarı
       ruleTitle: '«be» + agree',      // qısa Azərbaycanca başlıq (istəyə bağlı)
       why: 'agree özü feldir…',       // Azərbaycanca izah (istəyə bağlı)
       sentence: 'I am agree with you.', // tam cümlə — kartın üzü (istəyə bağlı)
       lang: 'en'                      // istəyə bağlı
     });
     → saxlanır App.store 'tenso:mistakes' (500-ə qədər, təkrarlar birləşir) və
       'tenso:srs' kartı yaradılır / yenilənir (qutu 0, dərhal təkrara düşür).
   TensoLearn.mistakes()        → [{id, wrong, fix, rule, ruleTitle, why, sentence, n, first, last, unit}]
   TensoLearn.weakRules(n)      → [{rule, title, n, score, unit, examples}] — ən zəif qaydalar
   TensoLearn.dueCount()        → bu gün təkrar ediləcək kart sayı (drawer badge üçün)
   TensoLearn.level()           → 'A1'…'C1' və ya null (App.store 'tenso:level')
   TensoLearn.maybeOfferTest()  → səviyyə yoxdursa (3 gündə bir) test təklif edən toast; true/false
   TensoLearn.openUnit(id)      → kurs vahidini açır (aşağıya bax)
   TensoLearn.recordUnitScore(id, pct) → vahid tapşırıqlarının nəticəsi (0–100), xəritə üçün
   TensoLearn.unitStatus(id)    → 'new' | 'weak' | 'mid' | 'good'

   openUnit(id) ardıcıllığı: 1) TensoLearn.unitOpener = function (id) {…} (core təyin edə bilər);
   2) qeydiyyatda openUnit(id) metodu olan ekran; 3) 'g-unit' / 'grammar-unit' / 'g-lesson' ekranı
   varsa App.go(id, {id, unit}); 4) əks halda NUANZA_GRAMMAR-dan öz vərəqimiz (sheet).
   Vahid irəliləyişi: 'tenso:unit:<id>', 'tenso:units', 'grammar:unit:<id>', 'grammar:progress' oxunur
   (rəqəm 0–100 / 0–1 və ya {pct|percent|score|best, at} / {correct,total}); öz qeydimiz 'tenso:unitScore'.
   Core-un 'grammar:cards' kartları ('ai/grammar.js' addCard) bir dəfəlik idxal olunur.
   ===================================================================== */
(function () {
  'use strict';
  var W = window, D = document, App = W.App;
  if (!App || typeof App.register !== 'function') return;
  var h = App.h;

  /* ------------------------------------------------------------------
     0. UTILITIES
     ------------------------------------------------------------------ */
  var LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];
  var LEVEL_AZ = { A1: 'Başlanğıc', A2: 'Elementar', B1: 'Orta', B2: 'Orta-yuxarı', C1: 'İrəli' };
  var DAY = 864e5, INTERVAL = [0, 1, 3, 7, 16];
  var K = { mist: 'tenso:mistakes', srs: 'tenso:srs', level: 'tenso:level', test: 'tenso:test', score: 'tenso:unitScore', offer: 'tenso:testOffer', imp: 'tenso:imported' };

  function log(e) { try { console.error('[Tenso]', e); } catch (x) { /* ignore */ } }
  function sget(k, fb) { try { var v = App.store.get(k, fb); return v == null ? fb : v; } catch (e) { return fb; } }
  function sset(k, v) { try { App.store.set(k, v); } catch (e) { /* ignore */ } }
  function str(v) { return v == null ? '' : String(v); }
  function lower(s) { return str(s).toLowerCase(); }
  function hashStr(s) { var x = 2166136261; s = str(s); for (var i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); } return (x >>> 0).toString(36); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function ic(name) { return App.iconEl(name); }
  function lvlIdx(l) { var i = LEVELS.indexOf(str(l).toUpperCase().slice(0, 2)); return i; }
  function plural(n, w) { return n + ' ' + w; }
  function badge(text, kind, icon) { return h('span', { class: 'badge' + (kind ? ' ' + kind : '') }, icon ? ic(icon) : null, text); }
  function progressBar(pct, label) {
    return h('div', { class: 'progress', role: 'progressbar', 'aria-label': label || 'Gediş', 'aria-valuenow': pct, 'aria-valuemin': 0, 'aria-valuemax': 100 }, h('i', { style: 'width:' + pct + '%' }));
  }

  /* text normalisation for dedupe and tolerant answer checks */
  function canon(s) {
    s = lower(s).replace(/[’‘`´]/g, "'").replace(/[“”«»"]/g, '').replace(/…/g, ' ').replace(/\.\.\./g, ' ');
    s = s.replace(/\bcan't\b/g, 'cannot').replace(/\bcan not\b/g, 'cannot').replace(/\bwon't\b/g, 'will not').replace(/\bshan't\b/g, 'shall not')
      .replace(/n't\b/g, ' not').replace(/'m\b/g, ' am').replace(/'re\b/g, ' are').replace(/'ve\b/g, ' have').replace(/'ll\b/g, ' will');
    s = s.replace(/[,;:!?.]+/g, ' ').replace(/\s+/g, ' ').trim();
    return s;
  }
  function variants(s) {
    var c = canon(s), out = [c];
    if (/'d\b/.test(c)) { out = [c.replace(/'d\b/g, ' would'), c.replace(/'d\b/g, ' had')]; }
    var more = [];
    out.forEach(function (v) { if (/'s\b/.test(v)) { more.push(v.replace(/'s\b/g, ' is')); more.push(v.replace(/'s\b/g, ' has')); } else more.push(v); });
    return more.map(function (v) { return v.replace(/\s+/g, ' ').trim(); });
  }
  function lev(a, b) {
    if (a === b) return 0;
    var m = a.length, n = b.length; if (!m || !n) return m || n;
    var prev = [], cur = [], i, j;
    for (j = 0; j <= n; j++) prev[j] = j;
    for (i = 1; i <= m; i++) {
      cur = [i];
      for (j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1));
      prev = cur;
    }
    return prev[n];
  }
  /* a one-letter slip inside a long word counts, a changed ending (-s, -ed, -ing, had/has) never does */
  function typoOk(input, answer) {
    var a = input.split(' '), b = answer.split(' ');
    if (a.length !== b.length) return false;
    var diff = -1;
    for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) { if (diff >= 0) return false; diff = i; }
    if (diff < 0) return true;
    var x = a[diff], y = b[diff];
    if (y.length < 6 || lev(x, y) !== 1) return false;
    var tail = 3;
    return x.slice(-tail) === y.slice(-tail);
  }
  function stripLead(q) { return str(q).replace(/^\s*(choose|seçin|select)\s*[:.-]\s*/i, ''); }
  function fill(q, ans) {
    var parts = stripLead(q).split(/_{2,}/);
    if (parts.length < 2) return stripLead(q);
    var gaps = parts.length - 1, bits;
    ans = str(ans).trim();
    if (gaps === 1) bits = [ans];
    else {
      bits = ans.indexOf(',') >= 0 ? ans.split(',').map(function (x) { return x.trim(); }) : ans.split(/\s+/);
      if (bits.length > gaps) bits = bits.slice(0, gaps - 1).concat([bits.slice(gaps - 1).join(' ')]);
    }
    var out = parts[0];
    for (var i = 1; i < parts.length; i++) {
      var rest = parts[i].replace(/^\s*\([^()]{1,30}\)/, '');
      out += (bits[i - 1] || '') + rest;
    }
    return out.replace(/\s+/g, ' ').replace(/\s+([,.?!])/g, '$1').trim();
  }
  function checkAnswer(input, answers, q) {
    var ins = variants(input);
    if (!ins[0]) return { ok: false };
    var list = (answers || []).map(str).filter(Boolean);
    for (var i = 0; i < list.length; i++) {
      var as = variants(list[i]);
      for (var x = 0; x < ins.length; x++) for (var y = 0; y < as.length; y++) {
        if (ins[x] === as[y]) return { ok: true };
        if (q && canon(fill(q, list[i])) === ins[x]) return { ok: true };
      }
    }
    for (i = 0; i < list.length; i++) if (typoOk(canon(input), canon(list[i]))) return { ok: true, close: true, right: list[i] };
    return { ok: false };
  }

  /* ------------------------------------------------------------------
     1. COURSE DATA + TOPICS
     ------------------------------------------------------------------ */
  function units() { var G = W.NUANZA_GRAMMAR; return G && Array.isArray(G.units) ? G.units.filter(function (u) { return u && u.id && u.title; }) : []; }
  function unitById(id) { if (!id) return null; var u = units(); for (var i = 0; i < u.length; i++) if (u[i].id === id) return u[i]; return null; }
  function placement() { var P = W.NUANZA_PLACEMENT; return P && Array.isArray(P.questions) ? P.questions.filter(function (q) { return q && q.q && Array.isArray(q.options); }) : []; }

  var TOPICS = {
    'articles': { t: 'Artikllər (a / an / the)', u: ['articles', 'articles-a-an-the', 'a-an-the', 'article-a-an', 'articles-the', 'articles-advanced'], k: ['article'] },
    'to-be': { t: '«to be» feli', u: ['to-be', 'verb-to-be', 'am-is-are', 'be-forms'], k: ['to-be', 'verb-be'] },
    'present-simple': { t: 'Present Simple', u: ['present-simple', 'present-simple-s', 'third-person-s'], k: ['present-simple'] },
    'present-continuous': { t: 'Present Continuous', u: ['present-continuous', 'present-simple-continuous'], k: ['present-continuous'] },
    'past-simple': { t: 'Past Simple', u: ['past-simple', 'past-simple-regular', 'past-simple-irregular'], k: ['past-simple'] },
    'present-perfect': { t: 'Present Perfect', u: ['present-perfect', 'present-perfect-past', 'present-perfect-vs-past', 'present-perfect-continuous'], k: ['present-perfect'] },
    'past-habits': { t: 'used to — keçmiş vərdişlər', u: ['used-to', 'past-habits'], k: ['used-to', 'habit'] },
    'future': { t: 'Gələcək zaman (will / going to)', u: ['future', 'will-going-to', 'future-will', 'future-forms', 'future-continuous-perfect'], k: ['future', 'going-to'] },
    'prepositions': { t: 'Ön sözlər (in / on / at, asılı ön sözlər)', u: ['prepositions-time', 'in-on-at', 'prepositions-place', 'prepositions', 'dependent-prepositions'], k: ['preposition'] },
    'questions': { t: 'Sual cümlələri', u: ['questions', 'question-order', 'question-words', 'do-support'], k: ['question'] },
    'pronouns': { t: 'Əvəzliklər (he / she, his / her)', u: ['pronouns', 'subject-pronouns', 'possessives', 'possessive-adjectives'], k: ['pronoun', 'possessive'] },
    'modals': { t: 'Modal fellər', u: ['modals', 'modal-verbs', 'can-cant', 'must-have-to', 'should', 'modals-deduction-past', 'modals-past-obligation'], k: ['modal'] },
    'comparatives': { t: 'Müqayisə dərəcələri', u: ['comparatives', 'comparatives-superlatives', 'superlatives'], k: ['compar', 'superlative'] },
    'quantifiers': { t: 'Sayılan / sayılmayan, much / many', u: ['much-many', 'countable-uncountable', 'quantifiers', 'some-any', 'quantifiers-advanced'], k: ['quantif', 'countable', 'much-many'] },
    'there-is-are': { t: 'There is / There are', u: ['there-is-are', 'there-is'], k: ['there-is'] },
    'word-order': { t: 'Söz sırası', u: ['word-order', 'adverbs-frequency', 'indirect-questions', 'inversion', 'cleft-sentences'], k: ['word-order', 'inversion', 'cleft'] },
    'conditionals': { t: 'Şərt cümlələri', u: ['zero-first-conditional', 'first-conditional', 'second-conditional', 'third-conditional', 'mixed-conditionals', 'wish-if-only'], k: ['conditional', 'wish'] },
    'passive': { t: 'Məchul növ', u: ['passive', 'passive-present-past', 'passive-voice', 'passive-all-tenses', 'passive-reporting'], k: ['passive'] },
    'reported-speech': { t: 'Vasitəli nitq', u: ['reported-speech', 'reported-statements', 'reported-questions', 'reported-commands', 'reporting-verbs'], k: ['reported', 'reporting'] },
    'relative-clauses': { t: 'Təyin budaq cümlələri (who / which)', u: ['relative-clauses', 'relative-clauses-defining'], k: ['relative'] },
    'gerund-infinitive': { t: 'Gerund və infinitiv (-ing / to)', u: ['gerund-infinitive', 'verb-patterns', 'gerund-infinitive-meaning'], k: ['gerund', 'infinitive'] },
    'subjunctive': { t: 'Subjunktiv', u: ['subjunctive'], k: ['subjunctive'] },
    'participle-clauses': { t: 'Feli sifət tərkibləri', u: ['participle-clauses'], k: ['participle'] }
  };
  /* ai/grammar.js checker rules → topics */
  var CHECKER = {
    'en.article': 'articles', 'en.a_an': 'articles', 'en.zero_article': 'articles', 'en.be_agree': 'to-be', 'en.be_verb': 'to-be',
    'en.sv_agreement': 'present-simple', 'en.third_person_s': 'present-simple', 'en.did_base': 'past-simple', 'en.modal_base': 'modals',
    'en.past_simple': 'past-simple', 'en.present_perfect': 'present-perfect', 'en.continuous': 'present-continuous', 'en.future': 'future',
    'en.comparative': 'comparatives', 'en.plural': 'quantifiers', 'en.uncountable': 'quantifiers', 'en.preposition': 'prepositions',
    'en.verb_pattern': 'prepositions', 'en.word_order': 'word-order', 'en.questions': 'questions', 'en.pronoun': 'pronouns'
  };

  function nearest(list, level) {
    if (!list.length) return null;
    var li = lvlIdx(level);
    if (li < 0) return list[0];
    return list.slice().sort(function (a, b) { return Math.abs(lvlIdx(a.level) - li) - Math.abs(lvlIdx(b.level) - li); })[0];
  }
  function unitForTopic(topic, level) {
    var T = TOPICS[topic];
    var direct = unitById(topic);
    if (direct) return direct;
    if (!T) return null;
    var found = T.u.map(unitById).filter(Boolean);
    if (found.length) return nearest(found, level || currentLevel());
    var all = units();
    var fuzzy = all.filter(function (u) {
      var hay = lower(u.id + ' ' + u.title);
      return T.k.some(function (k) { return hay.indexOf(k) >= 0; }) || (u.rule_ids || []).some(function (r) { return T.k.some(function (k) { return r.indexOf(k) >= 0; }); });
    });
    return nearest(fuzzy, level || currentLevel());
  }
  function topicOfRule(rule) {
    if (!rule) return null;
    if (TOPICS[rule]) return rule;
    if (CHECKER[rule]) return CHECKER[rule];
    var u = unitByRule(rule);
    if (u) for (var t in TOPICS) if (TOPICS[t].u.indexOf(u.id) >= 0) return t;
    return null;
  }
  function unitByRule(rule) {
    var u = unitById(rule); if (u) return u;
    var all = units();
    for (var i = 0; i < all.length; i++) if ((all[i].rule_ids || []).indexOf(rule) >= 0) return all[i];
    return null;
  }
  function unitForRule(rule, wrong) {
    if (!rule) return null;
    var u = unitByRule(rule); if (u) return u;
    if (TOPICS[rule]) return unitForTopic(rule);
    try { if (W.NuanzaGrammar && typeof W.NuanzaGrammar.lessonFor === 'function') { u = W.NuanzaGrammar.lessonFor({ rule: rule, wrong: wrong || '' }); if (u && u.id) return u; } } catch (e) { /* ignore */ }
    if (CHECKER[rule]) return unitForTopic(CHECKER[rule]);
    return null;
  }
  function ruleTitle(rule, fb) {
    if (!rule) return fb || 'Qrammatika';
    if (TOPICS[rule]) return TOPICS[rule].t;
    var u = unitById(rule); if (u) return u.title;
    try { var R = W.NuanzaGrammarRules; if (R && R.RULES && R.RULES[rule] && R.RULES[rule].t) return R.RULES[rule].t; } catch (e) { /* ignore */ }
    if (fb) return fb;
    if (CHECKER[rule]) return TOPICS[CHECKER[rule]].t;
    u = unitByRule(rule); if (u) return u.title;
    return rule;
  }

  /* ------------------------------------------------------------------
     2. MISTAKES + SRS + LEVEL + UNIT PROGRESS
     ------------------------------------------------------------------ */
  function mkey(m) { return canon(m.wrong) + '|' + canon(m.fix) + (m.sentence ? '|' + canon(m.sentence) : ''); }
  function rawMistakes() { var a = sget(K.mist, []); return Array.isArray(a) ? a.filter(function (m) { return m && m.id && (m.wrong || m.sentence); }) : []; }
  var synced = false;
  function syncCore() {
    if (synced) return; synced = true;
    var cards = sget('grammar:cards', []);
    if (!Array.isArray(cards) || !cards.length) return;
    var done = sget(K.imp, []); if (!Array.isArray(done)) done = [];
    var seen = {}; done.forEach(function (x) { seen[x] = 1; });
    cards.slice().reverse().forEach(function (c) {
      if (!c || !c.id || seen[c.id] || !c.bad || !c.good) return;
      addMistake({ wrong: c.bad, fix: c.good, why: c.why, rule: c.rule, ruleTitle: c.title, src: 'checker', _keepSrs: true });
      done.push(c.id);
    });
    sset(K.imp, done.slice(-600));
  }
  function mistakes() { syncCore(); return rawMistakes(); }
  function srsAll() { var s = sget(K.srs, {}); return s && typeof s === 'object' && !Array.isArray(s) ? s : {}; }

  function addMistake(m) {
    if (!m || typeof m !== 'object') return null;
    var wrong = str(m.wrong).trim(), fix = str(m.fix).trim(), sentence = str(m.sentence).trim();
    if (!wrong && sentence) wrong = sentence;
    if (!wrong || !fix || canon(wrong) === canon(fix)) return null;
    var now = Date.now();
    var rec = { wrong: wrong.slice(0, 400), fix: fix.slice(0, 400), sentence: sentence.slice(0, 600), rule: str(m.rule).slice(0, 80), ruleTitle: str(m.ruleTitle).slice(0, 120), why: str(m.why).slice(0, 600), lang: str(m.lang || 'en').slice(0, 8), src: str(m.src).slice(0, 20) };
    rec.id = 'm' + hashStr(mkey(rec));
    var u = unitForRule(rec.rule, rec.wrong) || (m.unit ? unitById(m.unit) : null);
    if (u) rec.unit = u.id;
    if (!rec.ruleTitle) rec.ruleTitle = ruleTitle(rec.rule, u ? u.title : '');
    var list = rawMistakes(), old = null;
    for (var i = 0; i < list.length; i++) if (list[i].id === rec.id) { old = list.splice(i, 1)[0]; break; }
    if (old) { rec.n = (old.n || 1) + 1; rec.first = old.first || now; if (!rec.why) rec.why = old.why; if (!rec.sentence) rec.sentence = old.sentence; }
    else { rec.n = 1; rec.first = now; }
    rec.last = now;
    list.unshift(rec);
    if (list.length > 500) list = list.sort(function (a, b) { return (b.last || 0) - (a.last || 0); }).slice(0, 500);
    sset(K.mist, list);
    /* SRS: a new mistake — or the same mistake made again — goes back to box 0, due now */
    var s = srsAll(), card = s[rec.id];
    if (!card || !m._keepSrs) s[rec.id] = { box: 0, due: now, n: card ? card.n || 0 : 0, lapses: card ? (card.lapses || 0) + 1 : 0, at: now };
    var ids = {}; list.forEach(function (x) { ids[x.id] = 1; });
    Object.keys(s).forEach(function (k) { if (!ids[k]) delete s[k]; });
    sset(K.srs, s);
    try { App.refreshNav(); } catch (e) { /* ignore */ }
    return rec;
  }
  function cardOf(m, s) { var c = (s || srsAll())[m.id]; return c && typeof c === 'object' ? c : { box: 0, due: 0, n: 0 }; }
  function dueCount() {
    var s = srsAll(), now = Date.now();
    return rawMistakes().filter(function (m) { return (cardOf(m, s).due || 0) <= now; }).length;
  }
  function currentLevel() { var l = sget(K.level, null); if (l && typeof l === 'object') l = l.level; l = str(l).toUpperCase(); return LEVELS.indexOf(l) >= 0 ? l : null; }

  function weakRules(n) {
    var s = srsAll(), now = Date.now(), g = {};
    mistakes().forEach(function (m) {
      var r = m.rule || m.unit || 'misc';
      var x = g[r] || (g[r] = { rule: r, title: m.ruleTitle || ruleTitle(r), n: 0, score: 0, unit: m.unit || null, examples: [] });
      var age = Math.max(0, now - (m.last || now)) / DAY;
      var box = cardOf(m, s).box || 0;
      x.n += m.n || 1;
      x.score += (m.n || 1) * (1 + Math.max(0, 1 - age / 30)) * (1 - Math.min(4, box) * 0.18);
      if (x.examples.length < 3) x.examples.push({ wrong: m.wrong, fix: m.fix });
      if (!x.unit && m.unit) x.unit = m.unit;
    });
    var book = sget('grammar:book', {});
    if (book && typeof book === 'object') Object.keys(book).forEach(function (r) {
      var b = book[r]; if (!b || !b.n) return;
      var x = g[r] || (g[r] = { rule: r, title: b.title || ruleTitle(r), n: 0, score: 0, unit: null, examples: [] });
      x.score += b.n * 0.6; if (!x.n) x.n = b.n;
      (b.ex || []).forEach(function (e) { if (x.examples.length < 3 && e && e.bad) x.examples.push({ wrong: e.bad, fix: e.good }); });
    });
    return Object.keys(g).map(function (k) {
      var x = g[k];
      if (!x.unit) { var u = unitForRule(x.rule, x.examples[0] && x.examples[0].wrong); x.unit = u ? u.id : null; }
      x.score = Math.round(x.score * 100) / 100;
      return x;
    }).filter(function (x) { return x.score > 0.05; }).sort(function (a, b) { return b.score - a.score; }).slice(0, n || 5);
  }

  function pctOf(v) {
    if (v == null) return null;
    if (typeof v === 'number' && isFinite(v)) return v <= 1 && v > 0 ? Math.round(v * 100) : Math.round(v);
    if (typeof v === 'object') {
      var keys = ['pct', 'percent', 'score', 'best', 'last'];
      for (var i = 0; i < keys.length; i++) if (typeof v[keys[i]] === 'number') return pctOf(v[keys[i]]);
      if (typeof v.correct === 'number' && v.total > 0) return Math.round(v.correct / v.total * 100);
    }
    return null;
  }
  function unitScore(id) {
    var out = [], own = sget(K.score, {}) || {};
    if (own[id]) out.push({ pct: pctOf(own[id]), at: own[id].at || 0 });
    [sget('tenso:unit:' + id, null), sget('grammar:unit:' + id, null), (sget('tenso:units', {}) || {})[id], (sget('grammar:progress', {}) || {})[id]].forEach(function (v) {
      var p = pctOf(v); if (p != null) out.push({ pct: Math.max(0, Math.min(100, p)), at: (v && v.at) || (v && v.ts) || 0 });
    });
    out = out.filter(function (x) { return x.pct != null; });
    if (!out.length) return null;
    out.sort(function (a, b) { return (b.at || 0) - (a.at || 0) || b.pct - a.pct; });
    return out[0];
  }
  function recordUnitScore(id, pct) {
    if (!id) return;
    pct = Math.max(0, Math.min(100, Math.round(Number(pct) || 0)));
    var all = sget(K.score, {}) || {}, prev = all[id] || {};
    all[id] = { last: pct, best: Math.max(pct, prev.best || 0), pct: pct, n: (prev.n || 0) + 1, at: Date.now() };
    sset(K.score, all);
  }
  function unitMistakeIndex() {
    var idx = {};
    rawMistakes().forEach(function (m) {
      var uid = m.unit || (function () { var u = unitForRule(m.rule, m.wrong); return u ? u.id : null; })();
      if (!uid) return;
      var x = idx[uid] || (idx[uid] = { n: 0, last: 0 });
      x.n += m.n || 1; x.last = Math.max(x.last, m.last || 0);
    });
    return idx;
  }
  function unitStatus(id, idx) {
    idx = idx || unitMistakeIndex();
    var sc = unitScore(id), mi = idx[id];
    var mistakesSince = mi && (!sc || (sc.at || 0) < mi.last);
    if (mistakesSince) return 'weak';
    if (!sc) return 'new';
    if (sc.pct >= 80) return 'good';
    if (sc.pct < 60) return 'weak';
    return 'mid';
  }

  /* ------------------------------------------------------------------
     3. COMPANION + LIFECYCLE
     ------------------------------------------------------------------ */
  var live = { to: [], off: [], minis: [] }, gen = 0;
  function later(fn, ms) { var t = setTimeout(fn, ms || 0); live.to.push(t); return t; }
  function listen(target, ev, fn) { target.addEventListener(ev, fn); live.off.push(function () { target.removeEventListener(ev, fn); }); }
  function cleanup() {
    live.to.forEach(clearTimeout);
    live.off.forEach(function (f) { try { f(); } catch (e) { /* ignore */ } });
    live.minis.forEach(function (m) { try { if (m && m.destroy) m.destroy(); } catch (e) { /* ignore */ } });
    live = { to: [], off: [], minis: [] };
  }
  function tenso(state, say, ms) {
    try { if (App.companion && typeof App.companion.set === 'function') App.companion.set(state || 'idle', say ? { say: say, ms: ms || 3200 } : { ms: ms || 1400 }); } catch (e) { /* ignore */ }
  }
  function mini(state) {
    var el = h('div', { class: 'tl-mini', 'aria-hidden': 'true' });
    if (W.Nuanza && typeof W.Nuanza.mount === 'function') {
      try { var m = W.Nuanza.mount(el, { size: 'mini', who: 'tenso', interactive: false }); if (m) { live.minis.push(m); if (state && m.set) m.set(state, {}); return el; } } catch (e) { /* fall through */ }
    }
    el.appendChild(h('span', { class: 'medal sm' }, h('b', { text: 'T' })));
    return el;
  }
  function focusSoft(el) { if (!el) return; later(function () { try { el.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }, 60); }
  function isTyping(el) { return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable); }

  var SCREENS = [
    { id: 'g-test', t: 'Səviyyə testi', icon: 'target' },
    { id: 'g-practice', t: 'Şəxsi məşq', icon: 'sparkle' },
    { id: 'g-cards', t: 'Yaddaş kartları', icon: 'cards' },
    { id: 'g-map', t: 'Mövzu xəritəsi', icon: 'chart' }
  ];
  function subnav(cur) {
    var due = dueCount();
    return h('nav', { class: 'tl-nav', 'aria-label': 'Öyrənmə bölmələri' }, SCREENS.map(function (s) {
      return h('button', { class: 'chip', type: 'button', 'aria-pressed': s.id === cur ? 'true' : 'false', onclick: function () { if (s.id !== cur) App.go(s.id); } },
        ic(s.icon), s.t, s.id === 'g-cards' && due ? h('span', { class: 'tl-dot', text: String(due) }) : null);
    }));
  }
  function pageHead(eyebrow, title, sub, extra) {
    return h('div', { class: 'page-h' }, h('div', null, h('span', { class: 'eyebrow', text: eyebrow }), h('h1', { html: title }), sub ? h('p', { text: sub }) : null), extra || null);
  }
  /* question text with styled blanks */
  function qText(q, cls) {
    var parts = stripLead(q).split(/_{2,}/), kids = [];
    parts.forEach(function (p, i) { if (i) kids.push(h('span', { class: 'tl-blank', 'aria-label': 'boşluq' }, '  ')); kids.push(p); });
    return h('p', { class: cls || 'tl-q', lang: 'en' }, kids);
  }

  /* ------------------------------------------------------------------
     4. UNIT OPENING (course screen if the core agent has one, else our sheet)
     ------------------------------------------------------------------ */
  function screenDefs() { try { return typeof App.screens === 'function' ? App.screens() : []; } catch (e) { return []; } }
  function openUnit(id) {
    var u = unitById(id);
    try { if (typeof TL.unitOpener === 'function') { var r = TL.unitOpener(id); if (r !== false) return true; } } catch (e) { log(e); }
    var defs = screenDefs(), i;
    for (i = 0; i < defs.length; i++) if (defs[i] && defs[i].id !== 'g-map' && typeof defs[i].openUnit === 'function') { try { defs[i].openUnit(id); return true; } catch (e) { log(e); } }
    var cand = ['g-unit', 'grammar-unit', 'g-lesson', 'tenso-unit'];
    for (i = 0; i < defs.length; i++) if (defs[i] && cand.indexOf(defs[i].id) >= 0) { App.go(defs[i].id, { id: id, unit: id }); return true; }
    if (!u) { App.toast('Bu dərs hələ hazır deyil', 'info', { sub: 'Mövzu üzrə şəxsi məşq edə bilərsiniz' }); return false; }
    unitSheet(u);
    return true;
  }

  function exerciseRow(ex, idx, u) {
    var row = h('div', { class: 'tl-ex' });
    var state = { ex: ex, row: row, val: null };
    row.appendChild(h('div', { class: 'tl-ex-n', text: String(idx + 1) }));
    var body = h('div', { class: 'tl-ex-b' }, qText(ex.q, 'tl-ex-q'));
    if (Array.isArray(ex.options) && ex.options.length) {
      var opts = h('div', { class: 'chips' });
      shuffle(ex.options).forEach(function (o) {
        var b = h('button', { class: 'chip', type: 'button', 'aria-pressed': 'false', lang: 'en', text: o });
        b.addEventListener('click', function () {
          if (state.done) return;
          Array.prototype.forEach.call(opts.children, function (x) { x.setAttribute('aria-pressed', 'false'); });
          b.setAttribute('aria-pressed', 'true'); state.val = o;
        });
        opts.appendChild(b);
      });
      body.appendChild(opts);
    } else {
      var inp = h('input', { class: 'input', type: 'text', lang: 'en', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', placeholder: 'Cavabınız', 'aria-label': 'Cavab ' + (idx + 1) });
      inp.addEventListener('input', function () { state.val = inp.value; });
      body.appendChild(inp); state.inp = inp;
    }
    state.fb = h('div', { class: 'tl-ex-fb', hidden: true });
    body.appendChild(state.fb);
    row.appendChild(body);
    state.check = function () {
      state.done = true;
      var right = (ex.a || [])[0] || '';
      var r = state.val ? checkAnswer(state.val, ex.a || [], ex.q) : { ok: false };
      row.classList.add(r.ok ? 'ok' : 'bad');
      if (state.inp) state.inp.disabled = true;
      state.fb.hidden = false;
      state.fb.textContent = '';
      state.fb.appendChild(r.ok ? h('span', { class: 'tl-ok' }, ic('check'), r.close ? 'Düzdür (yazılış: ' + r.right + ')' : 'Düzdür') :
        h('span', { class: 'tl-bad' }, ic('x'), 'Düzgün: ', h('b', { lang: 'en', text: right }), ex.hint ? ' — ' + ex.hint : ''));
      if (!r.ok && state.val) addMistake({ wrong: fill(ex.q, state.val), fix: fill(ex.q, right), rule: (u.rule_ids || [])[0] || u.id, ruleTitle: u.title, why: ex.hint || '', unit: u.id, src: 'unit' });
      return r.ok;
    };
    return state;
  }
  function unitSheet(u) {
    var body = h('div', { class: 'tl-unit stack' });
    body.appendChild(h('div', { class: 'row' }, badge(u.level || '—', 'fir'), u.group ? badge(u.group) : null, statusBadge(unitStatus(u.id))));
    if (u.az) body.appendChild(h('p', { class: 'tl-unit-az', text: u.az }));
    if (u.when) body.appendChild(h('p', { text: u.when }));
    if (Array.isArray(u.form) && u.form.length) body.appendChild(h('div', { class: 'card flat tl-form' }, h('span', { class: 'tl-lbl', text: 'Forma' }), h('ul', null, u.form.map(function (f) { return h('li', { lang: 'en', text: f }); }))));
    if (Array.isArray(u.rules) && u.rules.length) body.appendChild(h('div', { class: 'stack-sm' }, h('span', { class: 'tl-lbl', text: 'Qaydalar' }), h('ul', { class: 'tl-ul' }, u.rules.map(function (r) { return h('li', { text: r }); }))));
    if (u.azTrap) body.appendChild(h('div', { class: 'callout red' }, ic('alert'), h('div', null, h('b', { text: 'Azərbaycanca düşünəndə: ' }), u.azTrap)));
    if (Array.isArray(u.examples) && u.examples.length) body.appendChild(h('div', { class: 'stack-sm' }, h('span', { class: 'tl-lbl', text: 'Nümunələr' }),
      h('div', { class: 'tl-exs' }, u.examples.map(function (e) { return h('div', { class: 'tl-exm' }, h('b', { lang: 'en', text: e.en || e }), e.az ? h('small', { text: e.az }) : null); }))));
    if (Array.isArray(u.wrong) && u.wrong.length) body.appendChild(h('div', { class: 'stack-sm' }, h('span', { class: 'tl-lbl', text: 'Tipik səhvlər' }),
      h('div', { class: 'tl-exs' }, u.wrong.map(function (w) { return h('div', { class: 'tl-exm' }, h('s', { class: 'tl-strike', lang: 'en', text: w.bad }), h('b', { lang: 'en', text: w.good }), w.why ? h('small', { text: w.why }) : null); }))));
    var rows = [];
    var exs = Array.isArray(u.exercise) ? u.exercise.filter(function (e) { return e && e.q && Array.isArray(e.a); }) : [];
    var result = h('div', { class: 'tl-unit-res', hidden: true });
    if (exs.length) {
      body.appendChild(h('span', { class: 'tl-lbl', text: 'Tapşırıqlar' }));
      var list = h('div', { class: 'tl-exlist' });
      exs.forEach(function (e, i) { var st = exerciseRow(e, i, u); rows.push(st); list.appendChild(st.row); });
      body.appendChild(list);
      body.appendChild(result);
    }
    var sh = App.sheet({
      title: u.title, wide: true, body: body, cls: 'tl-sheet',
      actions: exs.length ? [{ label: 'Bağla', kind: 'ghost' }, {
        label: 'Yoxla', kind: 'primary', icon: 'check', keepOpen: true, onClick: function (e, api) {
          if (rows.some(function (r) { return r.done; })) { api.close(); return; }
          var ok = rows.filter(function (r) { return r.check(); }).length, pct = Math.round(ok / rows.length * 100);
          recordUnitScore(u.id, pct);
          result.hidden = false; result.textContent = '';
          result.appendChild(h('div', { class: 'callout ' + (pct >= 80 ? 'green' : pct >= 60 ? '' : 'red') }, ic(pct >= 80 ? 'trophy' : 'bulb'),
            h('div', null, h('b', { text: ok + ' / ' + rows.length + ' düz · ' + pct + '%' }), ' ', pct >= 80 ? 'Mövzu mənimsənilib — xəritədə yaşıl oldu.' : 'Səhvlər yaddaş kartlarına əlavə olundu.')));
          tenso(pct >= 80 ? 'celebrate' : 'worried', pct >= 80 ? 'Əla! ' + u.title + ' artıq sizindir.' : 'Bu mövzunu kartlarla bir də təkrar edək.');
          api.setActions([{ label: 'Bağla', kind: 'primary' }]);
          try { result.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (x) { /* ignore */ }
          return false;
        }
      }] : [{ label: 'Bağla', kind: 'primary' }],
      onClose: function () { if (App.current && App.current() === 'g-map') { try { App.rerender(); } catch (e) { /* ignore */ } } }
    });
    return sh;
  }
  function statusBadge(st) {
    var m = { 'new': ['Başlanmayıb', ''], weak: ['Zəif', 'gold'], mid: ['Davam edir', 'gold'], good: ['Mənimsənib', 'green'] }[st] || ['', ''];
    return badge(m[0], m[1] + ' dot');
  }

  /* ------------------------------------------------------------------
     5. g-test — ADAPTIVE PLACEMENT
     ------------------------------------------------------------------ */
  var TEST_N = 20;
  var T = null;
  function renderTest(el) {
    el.textContent = '';
    var page = h('div', { class: 'page tl-page' });
    el.appendChild(page);
    page.appendChild(subnav('g-test'));
    T = { page: page, box: h('div', { class: 'tl-box' }) };
    page.appendChild(pageHead('Tenso · Səviyyə testi', 'Səviyyənizi <em>bilək</em>', 'Adaptiv test: B1-dən başlayır, cavablarınıza görə çətinləşir və ya asanlaşır. ' + TEST_N + ' sual, təxminən 5 dəqiqə.'));
    page.appendChild(T.box);
    var qs = placement();
    if (!qs.length) { T.box.appendChild(h('div', { class: 'empty' }, h('div', { class: 'empty-art' }), h('h3', { text: 'Test sualları yüklənmədi' }), h('p', { text: 'Səhifəni yeniləyin.' }))); return; }
    testIntro();
  }
  function testIntro() {
    var box = T.box; box.textContent = '';
    var prev = sget(K.test, null), lvl = currentLevel();
    var card = h('div', { class: 'card tl-intro' },
      h('div', { class: 'tl-intro-in' }, mini('wave'),
        h('div', { class: 'stack-sm' },
          h('h2', { text: lvl ? 'Sizin səviyyəniz: ' + lvl : 'Haradan başlayaq?' }),
          h('p', { class: 'muted', text: lvl ? (prev && prev.at ? 'Son test: ' + new Date(prev.at).toLocaleDateString('az') + '. ' : '') + 'Yenidən keçib irəliləyişinizi yoxlayın.' : 'Tenso sizə uyğun dərsləri və məşqləri seçmək üçün səviyyənizi bilməlidir.' }))),
      h('ul', { class: 'tl-ul tl-facts' },
        h('li', { text: 'Hər sualdan sonra qısa izah görəcəksiniz.' }),
        h('li', { text: 'Düz cavab — növbəti sual çətinləşir, səhv — asanlaşır.' }),
        h('li', { text: 'Sonda CEFR səviyyəniz (A1–C1) və 3 zəif mövzu.' })),
      h('div', { class: 'row' },
        h('button', { class: 'btn btn-primary btn-lg', type: 'button', onclick: testStart }, ic('play'), lvl ? 'Yenidən başla' : 'Testə başla'),
        prev && prev.weak && prev.weak.length ? h('button', { class: 'btn btn-ghost', type: 'button', onclick: function () { testResult(prev, true); } }, 'Son nəticə') : null));
    box.appendChild(card);
    focusSoft(card.querySelector('.btn-primary'));
  }
  function testStart() {
    T.idx = 2; T.asked = []; T.used = {}; T.ans = null;
    tenso('think', 'Başlayaq! Tələsməyin — ilk ağlınıza gələni seçin.');
    testNext();
  }
  function pickQ() {
    var qs = placement(), li = T.idx;
    for (var d = 0; d < 5; d++) {
      var tries = d === 0 ? [li] : [li + d, li - d];
      for (var t = 0; t < tries.length; t++) {
        var L = LEVELS[tries[t]]; if (!L) continue;
        var pool = qs.filter(function (q) { return q.level === L && !T.used[q.id]; });
        if (!pool.length) continue;
        var lastTopic = T.asked.length ? T.asked[T.asked.length - 1].q.topic : null;
        var fresh = pool.filter(function (q) { return q.topic !== lastTopic; });
        var arr = fresh.length ? fresh : pool;
        return arr[Math.floor(Math.random() * arr.length)];
      }
    }
    return null;
  }
  function testNext() {
    if (T.asked.length >= TEST_N) { testFinish(); return; }
    var q = pickQ();
    if (!q) { testFinish(); return; }
    T.used[q.id] = 1;
    var cur = { q: q, pick: null, ok: null };
    T.cur = cur;
    var n = T.asked.length + 1, pct = Math.round((n - 1) / TEST_N * 100);
    var box = T.box; box.textContent = '';
    var order = q.options.map(function (_, i) { return i; });
    var dash = order.filter(function (i) { return q.options[i] === '—'; });
    order = shuffle(order.filter(function (i) { return q.options[i] !== '—'; })).concat(dash);
    var opts = h('div', { class: 'tl-opts', role: 'group', 'aria-label': 'Variantlar' });
    var fb = h('div', { class: 'tl-fb', 'aria-live': 'polite' });
    var next = h('button', { class: 'btn btn-primary btn-lg btn-block', type: 'button', hidden: true, onclick: testNext }, n >= TEST_N ? 'Nəticəni gör' : 'Növbəti', ic('arrow'));
    order.forEach(function (oi, k) {
      var b = h('button', { class: 'tl-opt', type: 'button', lang: 'en', 'data-k': String(k + 1) }, h('span', { class: 'tl-key', text: String(k + 1) }), h('span', { text: q.options[oi] === '—' ? '— (artikl lazım deyil)' : q.options[oi] }));
      b.addEventListener('click', function () { testAnswer(oi, b, opts, fb, next); });
      opts.appendChild(b);
    });
    box.appendChild(h('div', { class: 'card tl-qcard' },
      h('div', { class: 'tl-qtop' }, h('span', { class: 'small muted' }, 'Sual ', h('b', { class: 'tnum', text: String(n) }), ' / ' + TEST_N), badge(q.level, 'fir')),
      progressBar(pct, 'Test gedişi'),
      qText(q.q), opts, fb, next));
    focusSoft(opts.firstChild);
  }
  function testAnswer(oi, btn, opts, fb, next) {
    var cur = T.cur; if (!cur || cur.pick !== null) return;
    var q = cur.q; cur.pick = oi; cur.ok = oi === q.a;
    Array.prototype.forEach.call(opts.children, function (b) { b.disabled = true; });
    btn.classList.add(cur.ok ? 'ok' : 'bad');
    if (!cur.ok) Array.prototype.forEach.call(opts.children, function (b) { if (b.lastChild.textContent.indexOf(q.options[q.a]) === 0) b.classList.add('ok'); });
    fb.appendChild(h('div', { class: 'callout ' + (cur.ok ? 'green' : 'red') }, ic(cur.ok ? 'check' : 'bulb'), h('div', null, h('b', { text: cur.ok ? 'Düzdür. ' : 'Düzgün cavab: ' + q.options[q.a] + '. ' }), q.why || '')));
    T.asked.push(cur);
    T.idx = cur.ok ? Math.min(LEVELS.length - 1, T.idx + 1) : Math.max(0, T.idx - 1);
    tenso(cur.ok ? 'success' : 'worried', null, 1100);
    next.hidden = false;
    focusSoft(next);
  }
  function estimate(asked) {
    var st = LEVELS.map(function () { return { n: 0, ok: 0 }; });
    asked.forEach(function (a) { var i = lvlIdx(a.q.level); if (i >= 0) { st[i].n++; if (a.ok) st[i].ok++; } });
    var best = -1;
    for (var i = 0; i < LEVELS.length; i++) if (st[i].n >= 2 && st[i].ok / st[i].n >= 0.6) best = i;
    /* one clean answer at the top level when everything below was passed */
    if (best === LEVELS.length - 2 && st[best + 1].n === 1 && st[best + 1].ok === 1) best++;
    return LEVELS[Math.max(0, best)];
  }
  function testFinish() {
    var asked = T.asked, level = estimate(asked), li = lvlIdx(level);
    var ok = asked.filter(function (a) { return a.ok; }).length;
    var wt = {};
    asked.forEach(function (a) {
      if (a.ok) return;
      var t = a.q.topic, x = wt[t] || (wt[t] = { topic: t, n: 0, w: 0, level: a.q.level });
      x.n++; x.w += 1 + (lvlIdx(a.q.level) <= li ? 1 : 0);
      if (lvlIdx(a.q.level) < lvlIdx(x.level)) x.level = a.q.level;
    });
    var weak = Object.keys(wt).map(function (k) { return wt[k]; }).sort(function (a, b) { return b.w - a.w || b.n - a.n; }).slice(0, 3)
      .map(function (x) { var u = unitForTopic(x.topic, x.level); return { topic: x.topic, title: ruleTitle(x.topic), n: x.n, unit: u ? u.id : null }; });
    var res = { level: level, at: Date.now(), correct: ok, total: asked.length, weak: weak };
    sset(K.level, level);
    sset(K.test, res);
    asked.forEach(function (a) {
      if (a.ok) return;
      var q = a.q;
      addMistake({ wrong: fill(q.q, q.options[a.pick]), fix: fill(q.q, q.options[q.a]), rule: q.topic, ruleTitle: ruleTitle(q.topic), why: q.why, src: 'test' });
    });
    testResult(res, false);
  }
  function testResult(res, old) {
    var box = T.box; box.textContent = '';
    var pct = res.total ? Math.round(res.correct / res.total * 100) : 0;
    var hero = h('div', { class: 'card tl-res' },
      h('div', { class: 'tl-res-top' }, mini(old ? 'idle' : lvlIdx(res.level) >= 3 ? 'celebrate' : 'success'),
        h('div', { class: 'tl-lvl' }, h('span', { class: 'tl-lbl', text: 'Sizin səviyyəniz' }), h('b', { class: 'tl-lvl-big', text: res.level }), h('span', { class: 'muted', text: LEVEL_AZ[res.level] || '' }))),
      h('div', { class: 'tl-ladder', 'aria-hidden': 'true' }, LEVELS.map(function (L) { return h('span', { class: lvlIdx(L) <= lvlIdx(res.level) ? 'on' : '', text: L }); })),
      h('div', { class: 'stats' },
        h('div', { class: 'stat' }, h('b', { class: 'tnum', text: res.correct + '/' + res.total }), h('span', { text: 'düz cavab' })),
        h('div', { class: 'stat' }, h('b', { class: 'tnum', text: pct + '%' }), h('span', { text: 'nəticə' })),
        h('div', { class: 'stat' }, h('b', { class: 'tnum', text: String((res.weak || []).length) }), h('span', { text: 'zəif mövzu' }))));
    box.appendChild(hero);
    var weakCard = h('div', { class: 'card' }, h('div', { class: 'card-h' }, h('div', null, h('h3', { text: 'Üzərində işləyək' }), h('span', { class: 'small muted', text: 'Testdə ən çox çətinlik çəkdiyiniz mövzular' }))));
    var list = h('div', { class: 'list' });
    if (!res.weak || !res.weak.length) list.appendChild(h('p', { class: 'muted', text: 'Heç bir mövzuda ciddi çətinlik görmədim. Mövzu xəritəsindən növbəti səviyyəyə keçin!' }));
    (res.weak || []).forEach(function (w, i) {
      var u = w.unit ? unitById(w.unit) : null;
      list.appendChild(h('div', { class: 'list-row' },
        h('span', { class: 'ic ' + (i === 0 ? 'nar' : 'gold'), html: App.icon(i === 0 ? 'alert' : 'target') }),
        h('div', { class: 'tx' }, h('b', { text: w.title }), h('small', { text: u ? 'Dərs: ' + u.title + (u.level ? ' · ' + u.level : '') : w.n + ' səhv · şəxsi məşqlə möhkəmləndirin' })),
        h('div', { class: 'end' },
          u ? h('button', { class: 'btn btn-sm btn-secondary', type: 'button', onclick: function () { openUnit(u.id); } }, 'Dərsə keç') :
            h('button', { class: 'btn btn-sm btn-secondary', type: 'button', onclick: function () { App.go('g-practice', { topic: w.topic }); } }, 'Məşq et'))));
    });
    weakCard.appendChild(list);
    box.appendChild(weakCard);
    box.appendChild(h('div', { class: 'row tl-actions' },
      h('button', { class: 'btn btn-primary', type: 'button', onclick: function () { App.go('g-practice'); } }, ic('sparkle'), 'Şəxsi məşqə başla'),
      h('button', { class: 'btn btn-secondary', type: 'button', onclick: function () { App.go('g-map'); } }, ic('chart'), 'Mövzu xəritəsi'),
      h('button', { class: 'btn btn-ghost', type: 'button', onclick: testStart }, ic('refresh'), 'Yenidən keç')));
    if (!old) {
      tenso(lvlIdx(res.level) >= 2 ? 'celebrate' : 'success', 'Səviyyəniz ' + res.level + '! Zəif mövzularınızı yadda saxladım — məşqləri onlara görə seçəcəyəm.', 4200);
      try { if (App.fx && lvlIdx(res.level) >= 2) App.fx.burstAt(hero.querySelector('.tl-lvl-big'), 'stars'); } catch (e) { /* ignore */ }
    }
  }

  /* ------------------------------------------------------------------
     6. g-practice — PERSONAL PRACTICE
     ------------------------------------------------------------------ */
  var P = null;
  function toItem(ex, unit, rule) {
    if (!ex || !ex.q || !Array.isArray(ex.a) || !ex.a.length) return null;
    var it = { q: str(ex.q), a: ex.a.map(str).filter(Boolean), hint: str(ex.hint), why: str(ex.why), rule: rule || (unit && ((unit.rule_ids || [])[0] || unit.id)) || '', unit: unit ? unit.id : null };
    if (Array.isArray(ex.options) && ex.options.length >= 2) { it.type = 'choice'; it.options = ex.options.map(str); }
    else it.type = 'gap';
    if (!it.a.length) return null;
    return it;
  }
  function placeItem(q) {
    return { type: 'choice', q: q.q, options: q.options.slice(), a: [q.options[q.a]], hint: '', why: q.why || '', rule: q.topic, unit: null };
  }
  function itemsForRule(w) {
    var out = [], u = w.unit ? unitById(w.unit) : unitForRule(w.rule);
    if (u && Array.isArray(u.exercise)) u.exercise.forEach(function (ex) { var it = toItem(ex, u, w.rule); if (it) out.push(it); });
    var topic = topicOfRule(w.rule) || w.rule;
    placement().forEach(function (q) { if (q.topic === topic || (u && q.topic === u.id)) out.push(placeItem(q)); });
    if (!out.length && topic && TOPICS[topic]) { var u2 = unitForTopic(topic); if (u2 && u2 !== u) (u2.exercise || []).forEach(function (ex) { var it = toItem(ex, u2, w.rule); if (it) out.push(it); }); }
    return shuffle(out);
  }
  function fillerItems() {
    var lvl = currentLevel() || 'B1', li = lvlIdx(lvl), out = [];
    var us = units().filter(function (u) { return Math.abs(lvlIdx(u.level) - li) <= 0; });
    if (!us.length) us = units().filter(function (u) { return Math.abs(lvlIdx(u.level) - li) <= 1; });
    if (!us.length) us = units();
    shuffle(us).slice(0, 6).forEach(function (u) { (u.exercise || []).forEach(function (ex) { var it = toItem(ex, u); if (it) out.push(it); }); });
    placement().filter(function (q) { return Math.abs(lvlIdx(q.level) - li) <= 1; }).forEach(function (q) { out.push(placeItem(q)); });
    return shuffle(out);
  }
  function offlineSession(weak, n) {
    n = n || 10;
    var pools = weak.map(itemsForRule).filter(function (p) { return p.length; });
    var out = [], seen = {}, guard = 0;
    while (out.length < n && pools.some(function (p) { return p.length; }) && guard++ < 400) {
      pools.forEach(function (p) {
        if (out.length >= n || !p.length) return;
        var it = p.shift(), k = canon(it.q);
        if (!seen[k]) { seen[k] = 1; out.push(it); }
      });
    }
    if (out.length < n) fillerItems().forEach(function (it) { var k = canon(it.q); if (out.length < n && !seen[k]) { seen[k] = 1; out.push(it); } });
    return out;
  }
  function parseJSON(d) {
    if (d && typeof d === 'object') return d;
    var s = str(d), a = s.indexOf('{'), b = s.lastIndexOf('}');
    if (a < 0 || b <= a) return null;
    try { return JSON.parse(s.slice(a, b + 1)); } catch (e) { return null; }
  }
  function liveItems(weak, lvl) {
    var A = W.NuanzaAI;
    if (!W.NUANZA_LIVE || !A || typeof A.call !== 'function') return Promise.reject({ code: 'offline' });
    var keys = weak.map(function (w) { return w.rule; });
    var lines = weak.map(function (w, i) {
      var ex = (w.examples || []).filter(function (e) { return e.wrong && e.fix; }).slice(0, 2).map(function (e) { return '"' + e.wrong + '" → "' + e.fix + '"'; }).join('; ');
      return (i + 1) + '. rule key "' + w.rule + '" — ' + w.title + (ex ? ' — learner mistakes: ' + ex : '');
    }).join('\n');
    var prompt = [
      'You are Tenso, a friendly English grammar tutor for Azerbaijani speakers.',
      'Write exactly 10 NEW short practice exercises for a learner at CEFR level ' + lvl + ' that target these weak areas (spread the exercises across them, more for the first ones):',
      lines,
      'Mix two types: about 6 "gap" items (exactly one blank written as ___, you may give the base verb in brackets right after the blank, e.g. "She ___ (live) here since 2019.") and about 4 "choice" items (3 options, exactly one correct, the sentence has one ___).',
      'Every exercise must have exactly ONE unambiguous correct answer. Natural modern English, max 16 words, everyday topics (Baku, work, family, travel). Do not reuse the learner\'s own sentences.',
      '"a" is an array of ALL accepted answers for the blank (add contraction variants like "has not" / "hasn\'t"); for "choice", a[0] must be exactly one of the options.',
      '"hint": a short Azerbaijani hint (max 10 words) that does not give the answer away. "why": one short Azerbaijani sentence explaining the rule behind the correct answer.',
      '"rule": copy the rule key of the weak area this item trains (one of: ' + keys.map(function (k) { return '"' + k + '"'; }).join(', ') + ').',
      (A.ORTHO || '') + ' ' + (A.AZNOTES || ''),
      'Return ONLY strict JSON, no markdown: {"items":[{"type":"gap","q":"...","a":["..."],"hint":"...","why":"...","rule":"..."},{"type":"choice","q":"...","options":["...","...","..."],"a":["..."],"hint":"...","why":"...","rule":"..."}]}'
    ].join('\n');
    return A.call(prompt, { speed: 'fast', timeout: 30000 }).then(function (data) {
      var j = parseJSON(data), raw = j && Array.isArray(j.items) ? j.items : (Array.isArray(j) ? j : []);
      var out = [];
      raw.forEach(function (x) {
        if (!x || typeof x.q !== 'string' || x.q.length < 5 || x.q.length > 260 || !/_{2,}/.test(x.q)) return;
        var a = Array.isArray(x.a) ? x.a.map(str).filter(Boolean) : (x.a ? [str(x.a)] : []);
        if (!a.length) return;
        var rule = keys.indexOf(x.rule) >= 0 ? x.rule : keys[0];
        var w = weak[keys.indexOf(rule)] || weak[0];
        var it = { q: x.q, a: a, hint: str(x.hint).slice(0, 160), why: str(x.why).slice(0, 300), rule: rule, ruleTitle: w ? w.title : '', unit: w ? w.unit : null, ai: true };
        if (x.type === 'choice' || Array.isArray(x.options)) {
          var opts = Array.isArray(x.options) ? x.options.map(str).filter(Boolean).slice(0, 5) : [];
          var hit = opts.filter(function (o) { return canon(o) === canon(a[0]); })[0];
          if (opts.length < 2 || !hit) return;
          it.type = 'choice'; it.options = opts; it.a = [hit];
        } else it.type = 'gap';
        out.push(it);
      });
      if (out.length < 5) throw { code: 'invalid_json' };
      return out.slice(0, 10);
    });
  }

  function renderPractice(el, params) {
    el.textContent = '';
    var page = h('div', { class: 'page tl-page' });
    el.appendChild(page);
    page.appendChild(subnav('g-practice'));
    page.appendChild(pageHead('Tenso · Şəxsi məşq', 'Səhvlərinizdən <em>məşq</em>', 'Ən çox səhv etdiyiniz qaydalar üzrə 10 tapşırıq. Hər cavabdan sonra izah.'));
    P = { page: page, box: h('div', { class: 'tl-box' }), focus: params && (params.topic || params.rule) ? String(params.topic || params.rule) : null, g: ++gen };
    page.appendChild(P.box);
    practiceIntro();
  }
  function practiceWeak() {
    if (P.focus) { var u = unitForRule(P.focus); return [{ rule: P.focus, title: ruleTitle(P.focus), n: 0, score: 1, unit: u ? u.id : null, examples: [] }]; }
    return weakRules(4);
  }
  function practiceIntro() {
    var box = P.box; box.textContent = '';
    var weak = practiceWeak(), lvl = currentLevel();
    var card = h('div', { class: 'card tl-intro' },
      h('div', { class: 'tl-intro-in' }, mini('point'),
        h('div', { class: 'stack-sm' },
          h('h2', { text: weak.length ? (P.focus ? 'Mövzu: ' + weak[0].title : 'Zəif qaydalarınız') : 'Hələ səhv qeyd olunmayıb' }),
          h('p', { class: 'muted', text: weak.length ? 'Tapşırıqları bu qaydalar üzrə seçirəm' + (W.NUANZA_LIVE ? ' — süni intellekt yeni cümlələr yazacaq.' : '.') : 'Səviyyənizə (' + (lvl || 'B1') + ') uyğun qarışıq məşq edək. Mətn yoxlayanda səhvlər buraya düşəcək.' }))));
    if (weak.length) card.appendChild(h('div', { class: 'list' }, weak.map(function (w) {
      var u = w.unit ? unitById(w.unit) : null;
      return h('div', { class: 'list-row' }, h('span', { class: 'ic gold', html: App.icon('target') }),
        h('div', { class: 'tx' }, h('b', { text: w.title }), h('small', { text: (w.n ? w.n + ' səhv' : 'seçilmiş mövzu') + (u ? ' · ' + u.title : '') })),
        w.examples && w.examples[0] ? h('span', { class: 'end tl-ex-sample', lang: 'en', text: w.examples[0].fix }) : null);
    })));
    card.appendChild(h('div', { class: 'row' },
      h('button', { class: 'btn btn-primary btn-lg', type: 'button', onclick: function () { practiceStart(weak); } }, ic('play'), '10 tapşırığa başla'),
      P.focus ? h('button', { class: 'btn btn-ghost', type: 'button', onclick: function () { P.focus = null; practiceIntro(); } }, 'Bütün zəif qaydalar') : null,
      !lvl ? h('button', { class: 'btn btn-ghost', type: 'button', onclick: function () { App.go('g-test'); } }, 'Əvvəl səviyyə testi') : null));
    box.appendChild(card);
    focusSoft(card.querySelector('.btn-primary'));
  }
  function practiceStart(weak) {
    var g = P.g, box = P.box, lvl = currentLevel() || 'B1';
    box.textContent = '';
    box.appendChild(h('div', { class: 'card tl-loading' }, mini('think'), h('div', { class: 'stack-sm' }, h('b', { text: 'Tenso tapşırıqları hazırlayır…' }), h('div', { class: 'progress indet' }, h('i')))));
    tenso('think', null, 2000);
    var done = function (items, src) {
      if (!P || P.g !== g) return;
      if (items.length < 10) offlineSession(weak, 10).forEach(function (it) { if (items.length < 10 && !items.some(function (x) { return canon(x.q) === canon(it.q); })) items.push(it); });
      if (!items.length) {
        box.textContent = '';
        box.appendChild(h('div', { class: 'empty' }, h('div', { class: 'empty-art' }), h('h3', { text: 'Tapşırıq tapılmadı' }), h('p', { text: 'Kurs materialları hələ yüklənməyib. Bir az sonra yenidən cəhd edin.' })));
        return;
      }
      P.items = items; P.i = 0; P.ok = 0; P.res = []; P.src = src;
      practiceItem();
    };
    if (weak.length && W.NUANZA_LIVE) {
      liveItems(weak, lvl).then(function (items) { done(items, 'ai'); }, function () { done(offlineSession(weak, 10), 'offline'); });
    } else later(function () { done(offlineSession(weak, 10), 'offline'); }, 250);
  }
  function practiceItem() {
    var it = P.items[P.i], box = P.box, n = P.i + 1, total = P.items.length;
    box.textContent = '';
    var cur = { it: it, answered: false };
    P.cur = cur;
    var fb = h('div', { class: 'tl-fb', 'aria-live': 'polite' });
    var next = h('button', { class: 'btn btn-primary btn-lg btn-block', type: 'button', hidden: true, onclick: function () { P.i++; if (P.i >= P.items.length) practiceSummary(); else practiceItem(); } }, n >= total ? 'Yekunu gör' : 'Növbəti', ic('arrow'));
    var ui;
    if (it.type === 'choice') {
      ui = h('div', { class: 'tl-opts', role: 'group', 'aria-label': 'Variantlar' });
      shuffle(it.options).forEach(function (o, k) {
        var b = h('button', { class: 'tl-opt', type: 'button', lang: 'en' }, h('span', { class: 'tl-key', text: String(k + 1) }), h('span', { text: o === '—' ? '— (artikl lazım deyil)' : o }));
        b._val = o;
        b.addEventListener('click', function () { practiceAnswer(o, b, ui, fb, next); });
        ui.appendChild(b);
      });
    } else {
      var inp = h('input', { class: 'input tl-input', type: 'text', lang: 'en', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', placeholder: 'Boşluğa nə yazılmalıdır?', 'aria-label': 'Cavabınız' });
      var go = h('button', { class: 'btn btn-primary', type: 'button' }, 'Yoxla');
      var submit = function () { if (cur.answered) { next.click(); return; } if (!inp.value.trim()) { inp.setAttribute('aria-invalid', 'true'); inp.focus(); return; } practiceAnswer(inp.value, null, ui, fb, next); };
      go.addEventListener('click', submit);
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); submit(); } });
      inp.addEventListener('input', function () { inp.removeAttribute('aria-invalid'); });
      ui = h('div', { class: 'tl-gapin' }, inp, go);
      cur.inp = inp; cur.go = go;
    }
    box.appendChild(h('div', { class: 'card tl-qcard' },
      h('div', { class: 'tl-qtop' }, h('span', { class: 'small muted' }, 'Tapşırıq ', h('b', { class: 'tnum', text: String(n) }), ' / ' + total),
        h('span', { class: 'row' }, it.ai ? badge('AI', 'navy', 'sparkle') : null, badge(it.ruleTitle || ruleTitle(it.rule), 'gold'))),
      progressBar(Math.round((n - 1) / total * 100), 'Məşq gedişi'),
      qText(it.q),
      it.hint && it.type === 'gap' ? h('p', { class: 'small muted tl-hint' }, ic('bulb'), it.hint) : null,
      ui, fb, next));
    focusSoft(cur.inp || ui.firstChild);
  }
  function practiceAnswer(val, btn, ui, fb, next) {
    var cur = P.cur; if (!cur || cur.answered) return;
    cur.answered = true;
    var it = cur.it, r = checkAnswer(val, it.a, it.q), right = it.a[0];
    if (it.type === 'choice') {
      Array.prototype.forEach.call(ui.children, function (b) { b.disabled = true; if (canon(b._val) === canon(right)) b.classList.add('ok'); });
      if (btn && !r.ok) btn.classList.add('bad');
    } else {
      cur.inp.disabled = true; cur.go.hidden = true;
      cur.inp.classList.add(r.ok ? 'tl-in-ok' : 'tl-in-bad');
    }
    if (r.ok) P.ok++;
    P.res.push({ it: it, val: val, ok: r.ok });
    var why = it.why || it.hint || '';
    fb.appendChild(h('div', { class: 'callout ' + (r.ok ? 'green' : 'red') }, ic(r.ok ? 'check' : 'bulb'),
      h('div', null,
        h('b', { text: r.ok ? (r.close ? 'Düzdür — yalnız yazılışa diqqət: ' + r.right + '. ' : 'Düzdür! ') : 'Düzgün cavab: ' }),
        !r.ok ? h('b', { lang: 'en', class: 'tl-right', text: right }) : null, !r.ok ? '. ' : null,
        why,
        !r.ok ? h('span', { class: 'tl-full', lang: 'en', text: fill(it.q, right) }) : null)));
    if (!r.ok) addMistake({ wrong: fill(it.q, val), fix: fill(it.q, right), rule: it.rule, ruleTitle: it.ruleTitle || ruleTitle(it.rule), why: why, unit: it.unit, src: 'practice' });
    var streak = 0; for (var i = P.res.length - 1; i >= 0 && P.res[i].ok; i--) streak++;
    if (r.ok && streak === 3) tenso('streak', 'Üç düz cavab ardıcıl!', 1800); else tenso(r.ok ? 'success' : 'worried', null, 1100);
    next.hidden = false;
    focusSoft(next);
  }
  function practiceSummary() {
    var box = P.box, total = P.res.length, pct = total ? Math.round(P.ok / total * 100) : 0;
    box.textContent = '';
    /* per-unit score from this session → the topic map */
    var per = {};
    P.res.forEach(function (r) { var u = r.it.unit; if (!u) return; var x = per[u] || (per[u] = { ok: 0, n: 0 }); x.n++; if (r.ok) x.ok++; });
    Object.keys(per).forEach(function (u) { if (per[u].n >= 2) recordUnitScore(u, per[u].ok / per[u].n * 100); });
    var wrong = P.res.filter(function (r) { return !r.ok; });
    var head = h('div', { class: 'card tl-res' },
      h('div', { class: 'tl-res-top' }, mini(pct >= 80 ? 'celebrate' : pct >= 50 ? 'success' : 'worried'),
        h('div', { class: 'stack-sm' }, h('h2', { text: pct >= 80 ? 'Əla nəticə!' : pct >= 50 ? 'Yaxşı gedir' : 'Bu qaydaları təkrar edək' }),
          h('p', { class: 'muted', text: P.ok + ' / ' + total + ' düz. ' + (wrong.length ? wrong.length + ' səhv yaddaş kartlarına əlavə olundu.' : 'Səhv yoxdur!') + (P.src === 'ai' ? ' Tapşırıqları süni intellekt hazırladı.' : '') }))),
      App.ring(pct, 'nəticə'));
    box.appendChild(head);
    if (wrong.length) box.appendChild(h('div', { class: 'card' }, h('div', { class: 'card-h' }, h('h3', { text: 'Səhvlər' })),
      h('div', { class: 'list' }, wrong.map(function (r) {
        return h('div', { class: 'list-row' }, h('span', { class: 'ic nar', html: App.icon('x') }),
          h('div', { class: 'tx' }, h('b', { lang: 'en', text: fill(r.it.q, r.it.a[0]) }), h('small', null, 'Sizin cavab: ', h('s', { lang: 'en', text: r.val }))));
      }))));
    box.appendChild(h('div', { class: 'row tl-actions' },
      h('button', { class: 'btn btn-primary', type: 'button', onclick: function () { practiceStart(practiceWeak()); } }, ic('refresh'), 'Yenə 10 tapşırıq'),
      wrong.length ? h('button', { class: 'btn btn-secondary', type: 'button', onclick: function () { App.go('g-cards'); } }, ic('cards'), 'Kartları təkrarla') : null,
      h('button', { class: 'btn btn-ghost', type: 'button', onclick: function () { App.go('g-map'); } }, 'Mövzu xəritəsi')));
    tenso(pct >= 80 ? 'celebrate' : pct >= 50 ? 'success' : 'worried', pct >= 80 ? 'Möhtəşəm! ' + P.ok + ' / ' + total + '.' : pct >= 50 ? 'Pis deyil — kartlarla səhvləri bərkidək.' : 'Narahat olmayın, səhv öyrənməyin bir hissəsidir.', 3600);
    try { if (pct >= 80 && App.fx) App.fx.burstAt(head.querySelector('.ring') || head, 'stars'); } catch (e) { /* ignore */ }
    try { App.refreshNav(); } catch (e) { /* ignore */ }
  }

  /* ------------------------------------------------------------------
     7. g-cards — LEITNER REVIEW
     ------------------------------------------------------------------ */
  var C = null;
  function dueIn(ms) {
    var d = Math.ceil(ms / DAY);
    if (ms <= 0) return 'indi';
    if (ms < DAY) return Math.max(1, Math.round(ms / 36e5)) + ' saat sonra';
    return d === 1 ? 'sabah' : d + ' gün sonra';
  }
  function renderCards(el) {
    el.textContent = '';
    var page = h('div', { class: 'page tl-page' });
    el.appendChild(page);
    page.appendChild(subnav('g-cards'));
    page.appendChild(pageHead('Tenso · Yaddaş kartları', 'Səhvlər <em>yadda qalsın</em>', 'Leitner üsulu: bildiyiniz kart 1, 3, 7, 16 gündən sonra qayıdır; bilmədiyiniz — dərhal.'));
    C = { page: page, stats: h('div'), box: h('div', { class: 'tl-box' }), g: ++gen };
    page.appendChild(C.stats);
    page.appendChild(C.box);
    listen(D, 'keydown', function (e) {
      if (!C || !C.cur || isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === ' ' || e.key === 'Enter') { if (e.target && e.target.tagName === 'BUTTON' && e.target !== C.cur.card) return; e.preventDefault(); cardsFlip(); }
      else if (e.key === '1' && C.flipped) cardsAnswer(false);
      else if (e.key === '2' && C.flipped) cardsAnswer(true);
    });
    cardsStart(false);
  }
  function cardsStats() {
    var s = srsAll(), now = Date.now(), all = mistakes();
    var due = all.filter(function (m) { return (cardOf(m, s).due || 0) <= now; }).length;
    var mastered = all.filter(function (m) { return (cardOf(m, s).box || 0) >= 4; }).length;
    C.stats.textContent = '';
    C.stats.appendChild(h('div', { class: 'card flat tl-cstats' }, h('div', { class: 'stats' },
      h('div', { class: 'stat' }, h('b', { class: 'tnum', text: String(due) }), h('span', { text: 'bu gün' })),
      h('div', { class: 'stat' }, h('b', { class: 'tnum', text: String(all.length) }), h('span', { text: 'cəmi kart' })),
      h('div', { class: 'stat' }, h('b', { class: 'tnum', text: String(mastered) }), h('span', { text: 'mənimsənib' })))));
  }
  function cardsStart(all) {
    var s = srsAll(), now = Date.now(), list = mistakes();
    cardsStats();
    var due = all ? list.slice() : list.filter(function (m) { return (cardOf(m, s).due || 0) <= now; });
    due.sort(function (a, b) { var ra = cardOf(a, s), rb = cardOf(b, s); return (ra.box || 0) - (rb.box || 0) || (ra.due || 0) - (rb.due || 0); });
    C.queue = due.slice(0, 20); C.done = 0; C.knew = 0; C.miss = 0; C.again = {}; C.flipped = false; C.cur = null;
    if (!C.queue.length) cardsEmpty(list, s);
    else cardsShow();
  }
  function cardsEmpty(list, s) {
    var box = C.box; box.textContent = '';
    if (!list.length) {
      box.appendChild(h('div', { class: 'empty' }, mini('idle'), h('h3', { text: 'Hələ kart yoxdur' }),
        h('p', { text: 'Mətn yoxlayanda, testdə və məşqdə etdiyiniz səhvlər burada kart olacaq.' }),
        h('div', { class: 'actions' }, h('button', { class: 'btn btn-primary', type: 'button', onclick: function () { App.go('g-practice'); } }, 'Şəxsi məşq'), h('button', { class: 'btn btn-secondary', type: 'button', onclick: function () { App.go('g-test'); } }, 'Səviyyə testi'))));
      return;
    }
    var now = Date.now(), next = Math.min.apply(null, list.map(function (m) { return cardOf(m, s).due || now; }));
    box.appendChild(h('div', { class: 'empty' }, mini('success'), h('h3', { text: 'Bu günlük hamısı təkrarlandı' }),
      h('p', { text: 'Növbəti kart ' + dueIn(next - now) + '. İstəsəniz, bütün kartları indi bir də keçin.' }),
      h('div', { class: 'actions' }, h('button', { class: 'btn btn-secondary', type: 'button', onclick: function () { cardsStart(true); } }, ic('refresh'), 'Hamısını təkrarla'),
        h('button', { class: 'btn btn-ghost', type: 'button', onclick: function () { App.go('g-practice'); } }, 'Şəxsi məşq'))));
  }
  function markIn(sentence, part, tag, cls) {
    var i = part ? sentence.indexOf(part) : -1;
    if (i < 0 || part === sentence) return [h(tag, { class: cls, text: sentence })];
    return [sentence.slice(0, i), h(tag, { class: cls, text: part }), sentence.slice(i + part.length)];
  }
  function cardsShow() {
    var m = C.queue[0], s = srsAll(), rec = cardOf(m, s), box = C.box;
    box.textContent = '';
    C.flipped = false;
    var total = C.done + C.queue.length, pct = total ? Math.round(C.done / total * 100) : 0;
    var sent = m.sentence && m.sentence.indexOf(m.wrong) >= 0 ? m.sentence : '';
    var front = h('div', { class: 'tl-face tl-front' },
      h('div', { class: 'tl-face-top' }, badge(m.ruleTitle || ruleTitle(m.rule), 'gold'), h('span', { class: 'tl-pips', title: 'Qutu ' + (rec.box || 0) + ' / 4' }, [1, 2, 3, 4].map(function (i) { return h('i', { class: i <= (rec.box || 0) ? 'on' : '' }); }))),
      h('span', { class: 'tl-lbl', text: 'Sizin cümləniz' }),
      h('p', { class: 'tl-sent', lang: 'en' }, sent ? markIn(sent, m.wrong, 's', 'tl-strike') : h('s', { class: 'tl-strike', text: m.wrong })),
      h('p', { class: 'small muted tl-face-hint' }, ic('refresh'), 'Düzgün variantı xatırlayın, sonra kartı çevirin'));
    var fixed = sent ? sent.replace(m.wrong, m.fix) : m.fix;
    var back = h('div', { class: 'tl-face tl-back', hidden: true },
      h('div', { class: 'tl-face-top' }, badge('Düzgün variant', 'green', 'check'), m.n > 1 ? badge(m.n + ' dəfə', 'red') : null),
      h('p', { class: 'tl-sent', lang: 'en' }, sent ? markIn(fixed, m.fix, 'mark', 'tl-good') : h('mark', { class: 'tl-good', text: m.fix })),
      h('div', { class: 'callout navy' }, ic('bulb'), h('div', null, h('b', { text: (m.ruleTitle || ruleTitle(m.rule)) + '. ' }), m.why || 'Qaydanı kurs vahidində təkrar edin.')),
      m.unit && unitById(m.unit) ? h('button', { class: 'btn btn-sm btn-ghost tl-unit-link', type: 'button', onclick: function (e) { e.stopPropagation(); openUnit(m.unit); } }, ic('book'), 'Dərs: ' + unitById(m.unit).title) : null);
    var card = h('div', { class: 'tl-card', role: 'button', tabindex: '0', 'aria-label': 'Kart: ' + m.wrong + '. Çevirmək üçün basın' }, front, back);
    card.addEventListener('click', function (e) { if (e.target.closest('.tl-unit-link')) return; cardsFlip(); });
    var flipBtn = h('button', { class: 'btn btn-secondary btn-lg btn-block', type: 'button', onclick: cardsFlip }, ic('eye'), 'Cavabı göstər');
    var acts = h('div', { class: 'tl-cacts', hidden: true },
      h('button', { class: 'btn btn-danger btn-lg', type: 'button', onclick: function () { cardsAnswer(false); } }, ic('x'), 'Bilmirdim'),
      h('button', { class: 'btn btn-secondary btn-lg tl-knew', type: 'button', onclick: function () { cardsAnswer(true); } }, ic('check'), 'Bilirdim'));
    var nextBox = Math.min(4, (rec.box || 0) + 1);
    box.appendChild(h('div', { class: 'tl-cwrap' },
      h('div', { class: 'tl-qtop' }, h('span', { class: 'small muted' }, h('b', { class: 'tnum', text: String(C.done) }), ' / ' + total + ' kart'),
        h('span', { class: 'row' }, badge('Bilirdim ' + C.knew, 'green'), badge('Bilmirdim ' + C.miss, 'red'))),
      progressBar(pct, 'Təkrar gedişi'),
      card, flipBtn, acts,
      h('p', { class: 'small muted tl-center', text: 'Bilirdim → ' + (INTERVAL[nextBox] === 1 ? 'sabah' : INTERVAL[nextBox] + ' gün sonra') + ' · Bilmirdim → bu sessiyada yenə' })));
    C.cur = { m: m, card: card, front: front, back: back, flipBtn: flipBtn, acts: acts };
    focusSoft(card);
  }
  function cardsFlip() {
    if (!C || !C.cur) return;
    var k = C.cur;
    C.flipped = !C.flipped;
    k.front.hidden = C.flipped; k.back.hidden = !C.flipped;
    k.card.classList.toggle('flipped', C.flipped);
    if (C.flipped) { k.flipBtn.hidden = true; k.acts.hidden = false; focusSoft(k.acts.querySelector('.tl-knew')); }
  }
  function cardsAnswer(knew) {
    if (!C || !C.cur) return;
    if (!C.flipped) { cardsFlip(); return; }
    var m = C.queue.shift(), s = srsAll(), now = Date.now(), rec = cardOf(m, s);
    rec = { box: rec.box || 0, due: rec.due || 0, n: (rec.n || 0) + 1, lapses: rec.lapses || 0, at: rec.at || now, last: now };
    if (knew) {
      if (!C.again[m.id]) { rec.box = Math.min(4, rec.box + 1); rec.due = now + INTERVAL[rec.box] * DAY; }
      else { rec.box = Math.max(1, rec.box); rec.due = now + INTERVAL[rec.box] * DAY; }
      C.knew++;
    } else {
      rec.box = 0; rec.due = now; rec.lapses++;
      C.miss++;
      if (!C.again[m.id]) { C.again[m.id] = 1; C.queue.push(m); }
    }
    s[m.id] = rec; sset(K.srs, s);
    C.done++;
    tenso(knew ? 'success' : 'worried', null, 900);
    try { App.refreshNav(); } catch (e) { /* ignore */ }
    if (!C.queue.length) cardsDone(); else cardsShow();
  }
  function cardsDone() {
    cardsStats();
    var box = C.box; box.textContent = '';
    C.cur = null;
    var pct = C.done ? Math.round(C.knew / C.done * 100) : 0;
    box.appendChild(h('div', { class: 'card tl-res' },
      h('div', { class: 'tl-res-top' }, mini(pct >= 70 ? 'celebrate' : 'success'),
        h('div', { class: 'stack-sm' }, h('h2', { text: 'Təkrar bitdi' }),
          h('p', { class: 'muted', text: C.knew + ' kartı bildiniz, ' + C.miss + ' kartı yenidən öyrəndiniz. Bildikləriniz vaxtı çatanda qayıdacaq.' }))),
      h('div', { class: 'row tl-actions' },
        h('button', { class: 'btn btn-primary', type: 'button', onclick: function () { App.go('g-practice'); } }, ic('sparkle'), 'Şəxsi məşq'),
        h('button', { class: 'btn btn-ghost', type: 'button', onclick: function () { cardsStart(true); } }, ic('refresh'), 'Hamısını təkrarla'))));
    tenso(pct >= 70 ? 'celebrate' : 'success', pct >= 70 ? 'Yaddaşınız güclənir!' : 'Çətin kartlar sabah yenə gələcək.', 2600);
  }

  /* ------------------------------------------------------------------
     8. g-map — TOPIC MAP
     ------------------------------------------------------------------ */
  var ST_LABEL = { 'new': 'Başlanmayıb', weak: 'Zəif', mid: 'Davam edir', good: 'Mənimsənib' };
  function renderMap(el) {
    el.textContent = '';
    var page = h('div', { class: 'page tl-page' });
    el.appendChild(page);
    page.appendChild(subnav('g-map'));
    var lvl = currentLevel();
    page.appendChild(pageHead('Tenso · Mövzu xəritəsi', 'Qrammatika <em>xəritəsi</em>', 'Kursun bütün mövzuları. Boz — başlanmayıb, sarı — zəif, yaşıl — mənimsənib. Mövzuya toxunun.',
      h('div', { class: 'actions' }, lvl ? badge('Səviyyəniz: ' + lvl, 'fir') : h('button', { class: 'btn btn-sm btn-primary', type: 'button', onclick: function () { App.go('g-test'); } }, ic('target'), 'Səviyyəni bil'))));
    var all = units(), idx = unitMistakeIndex(), cnt = { 'new': 0, weak: 0, mid: 0, good: 0 };
    var st = {};
    all.forEach(function (u) { st[u.id] = unitStatus(u.id, idx); cnt[st[u.id]]++; });
    page.appendChild(h('div', { class: 'card flat tl-legend' },
      h('div', { class: 'stats' },
        h('div', { class: 'stat' }, h('b', { class: 'tnum', text: String(all.length) }), h('span', { text: 'mövzu' })),
        h('div', { class: 'stat tl-s-good' }, h('b', { class: 'tnum', text: String(cnt.good) }), h('span', { text: 'mənimsənib' })),
        h('div', { class: 'stat tl-s-weak' }, h('b', { class: 'tnum', text: String(cnt.weak + cnt.mid) }), h('span', { text: 'üzərində işləyin' })),
        h('div', { class: 'stat' }, h('b', { class: 'tnum', text: String(cnt['new']) }), h('span', { text: 'başlanmayıb' }))),
      all.length ? progressBar(Math.round(cnt.good / all.length * 100), 'Mənimsənilmiş mövzular') : null));
    if (!all.length) { page.appendChild(h('div', { class: 'empty' }, h('div', { class: 'empty-art' }), h('h3', { text: 'Kurs yüklənmədi' }), h('p', { text: 'Səhifəni yeniləyin.' }))); return; }
    LEVELS.forEach(function (L) {
      var list = all.filter(function (u) { return str(u.level).toUpperCase() === L; });
      var sec = h('section', { class: 'tl-lvl-sec' + (L === lvl ? ' cur' : ''), 'aria-label': L + ' səviyyəsi' },
        h('div', { class: 'sec-h' }, h('h2', null, h('span', { class: 'tl-lvl-tag', text: L }), ' ', LEVEL_AZ[L]), L === lvl ? badge('Sizin səviyyə', 'fir') : h('span', { class: 'small muted', text: list.length ? list.length + ' mövzu' : '' })));
      if (!list.length) sec.appendChild(h('p', { class: 'small muted tl-soon', text: 'Bu səviyyənin dərsləri tezliklə əlavə olunacaq.' }));
      else {
        var groups = {}, gOrder = [];
        list.forEach(function (u) { var g = u.group || 'Digər'; if (!groups[g]) { groups[g] = []; gOrder.push(g); } groups[g].push(u); });
        var grid = h('div', { class: 'tl-tiles' });
        gOrder.forEach(function (g) {
          groups[g].forEach(function (u) {
            var s = st[u.id];
            grid.appendChild(h('button', { class: 'tl-tile', type: 'button', 'data-st': s, 'aria-label': u.title + ' — ' + ST_LABEL[s], onclick: function () { openUnit(u.id); } },
              h('span', { class: 'tl-tile-top' }, h('span', { class: 'tl-tile-g', text: g }), h('i', { class: 'tl-st', 'aria-hidden': 'true' })),
              h('b', { lang: 'en', text: u.title }),
              u.az ? h('small', { text: u.az }) : null,
              h('span', { class: 'tl-tile-st', text: ST_LABEL[s] })));
          });
        });
        sec.appendChild(grid);
      }
      page.appendChild(sec);
    });
  }

  /* ------------------------------------------------------------------
     9. STYLES (tokens only)
     ------------------------------------------------------------------ */
  App.css('s-tenso-learn', [
    '.tl-page{display:grid;gap:20px;min-width:0}',
    '.tl-nav{display:flex;flex-wrap:wrap;gap:8px}',
    '@media (max-width:639px){.tl-nav{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;margin-inline:calc(var(--gutter) * -1);padding:2px var(--gutter) 4px}.tl-nav::-webkit-scrollbar{display:none}.tl-nav .chip{flex:none}}',
    '.tl-dot{display:inline-grid;place-items:center;min-width:18px;height:18px;padding:0 5px;border-radius:var(--r-pill);background:var(--zafaran);color:var(--on-zafaran);font-size:.6875rem;font-weight:700}',
    '.tl-box{display:grid;gap:16px;min-width:0}',
    '.tl-intro{display:grid;gap:16px}',
    '.tl-intro-in,.tl-res-top{display:flex;align-items:center;gap:16px;min-width:0}',
    '.tl-intro-in > .stack-sm,.tl-res-top > .stack-sm{flex:1;min-width:0}',
    '.tl-intro h2,.tl-res h2{font-size:var(--fs-lg)}',
    '.tl-mini{flex:none;width:72px;min-height:72px;display:grid;place-items:end center}',
    '.tl-mini .medal{--size:56px}',
    '.tl-ul{display:grid;gap:6px;margin:0;padding-left:20px;color:var(--ink)}',
    '.tl-ul li::marker{color:var(--firuze)}',
    '.tl-facts{color:var(--soft);font-size:var(--fs-sm)}',
    '.tl-qcard{display:grid;gap:14px}',
    '.tl-qtop{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px}',
    '.tl-qtop b{color:var(--ink);font-family:var(--f-display)}',
    '.tl-q{font-family:var(--f-display);font-size:var(--fs-lg);line-height:1.5;letter-spacing:-.005em;overflow-wrap:anywhere;color:var(--ink)}',
    '@media (min-width:640px){.tl-q{font-size:var(--fs-xl)}}',
    '.tl-blank{display:inline-block;min-width:3em;margin:0 .15em;border-bottom:2px solid var(--firuze);line-height:1}',
    '.tl-opts{display:grid;gap:10px}',
    '.tl-opt{position:relative;display:flex;align-items:center;gap:12px;width:100%;min-height:52px;padding:10px 14px;border:1.5px solid var(--line-2);border-radius:var(--r-md);background:var(--surface);color:var(--ink);font:500 var(--fs-base)/1.4 var(--f-body);text-align:left;cursor:pointer;transition:border-color var(--t-base),background var(--t-base),transform var(--t-fast) var(--ease-out)}',
    '@media (hover:hover){.tl-opt:not(:disabled):hover{border-color:color-mix(in srgb,var(--firuze) 50%,var(--line-2))}}',
    '.tl-opt:active:not(:disabled){transform:scale(.99)}',
    '.tl-opt:focus-visible{outline:2px solid var(--focus);outline-offset:2px}',
    '.tl-opt:disabled{cursor:default}',
    '.tl-opt > span:last-child{min-width:0;overflow-wrap:anywhere}',
    '.tl-key{flex:none;display:grid;place-items:center;width:26px;height:26px;border-radius:8px;background:var(--surface2);color:var(--soft);font-size:var(--fs-xs);font-weight:700}',
    '.tl-opt.ok{border-color:var(--ok);background:linear-gradient(var(--ok-t),var(--ok-t)),var(--surface)}',
    '.tl-opt.ok .tl-key{background:var(--ok);color:var(--surface)}',
    '.tl-opt.bad{border-color:var(--nar);background:linear-gradient(var(--nar-t),var(--nar-t)),var(--surface)}',
    '.tl-opt.bad .tl-key{background:var(--nar);color:var(--surface)}',
    '.tl-fb:empty{display:none}',
    '.tl-fb .callout{animation:rise .3s var(--ease-out) both}',
    '.tl-right{color:var(--ink)}',
    '.tl-full{display:block;margin-top:6px;font-weight:600;color:var(--ink)}',
    '.tl-hint{display:flex;align-items:center;gap:6px}.tl-hint svg{width:14px;height:14px;flex:none;color:var(--zafaran-ink)}',
    '.tl-gapin{display:flex;gap:8px;min-width:0}',
    '.tl-gapin .input{flex:1;min-width:0;font-size:1rem}',
    '.tl-in-ok{border-color:var(--ok)!important;box-shadow:0 0 0 3px var(--ok-t)!important}',
    '.tl-in-bad{border-color:var(--nar)!important;box-shadow:0 0 0 3px var(--nar-t)!important;text-decoration:line-through}',
    '.tl-loading{display:flex;align-items:center;gap:16px}.tl-loading > .stack-sm{flex:1;min-width:0}',
    '.tl-res{display:grid;gap:18px}',
    '.tl-res .ring-wrap{justify-self:center}',
    '.tl-lvl{display:grid;gap:2px}',
    '.tl-lvl-big{font-family:var(--f-display);font-size:var(--fs-3xl);line-height:1;color:var(--heading)}',
    '.tl-lbl{color:var(--soft);font:600 .6875rem/1.3 var(--f-body);letter-spacing:.12em;text-transform:uppercase}',
    '.tl-ladder{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px}',
    '.tl-ladder span{display:grid;place-items:center;height:30px;border-radius:var(--r-sm);background:var(--surface2);color:var(--faint);font-size:var(--fs-xs);font-weight:700}',
    '.tl-ladder span.on{background:var(--firuze);color:var(--on-firuze)}',
    '.tl-actions{gap:10px}',
    '.tl-ex-sample{max-width:40%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--ok)}',
    '@media (max-width:479px){.tl-ex-sample{display:none}}',
    /* cards */
    '.tl-cstats .stats{grid-template-columns:repeat(3,minmax(0,1fr))}',
    '.tl-cwrap{display:grid;gap:14px;width:100%;max-width:640px;margin-inline:auto;min-width:0}',
    '.tl-card{position:relative;display:grid;min-height:280px;padding:22px 20px;border:1px solid var(--line);border-radius:var(--r-xl);background:var(--surface);box-shadow:var(--sh-2);cursor:pointer;overflow:hidden;-webkit-tap-highlight-color:transparent}',
    '.tl-card:focus-visible{outline:2px solid var(--focus);outline-offset:4px}',
    '.tl-card.flipped{background:linear-gradient(180deg,var(--ok-t),transparent 55%),var(--surface)}',
    '.tl-face{display:flex;flex-direction:column;gap:14px;min-width:0;animation:rise .28s var(--ease-out) both}',
    '.tl-face[hidden]{display:none}',
    '.tl-face-top{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px}',
    '.tl-face-top .badge{max-width:100%;overflow:hidden;text-overflow:ellipsis}',
    '.tl-sent{font-family:var(--f-display);font-size:1.25rem;line-height:1.5;overflow-wrap:anywhere}',
    '@media (min-width:640px){.tl-sent{font-size:1.4rem}}',
    '.tl-strike{color:var(--nar);text-decoration:line-through;text-decoration-thickness:2px}',
    'mark.tl-good{padding:0 .18em;border-radius:6px;background:var(--ok-t);color:var(--ok);font-weight:600}',
    '.tl-face-hint{display:flex;align-items:center;gap:6px;margin-top:auto}.tl-face-hint svg{width:14px;height:14px}',
    '.tl-pips{display:inline-flex;gap:4px}',
    '.tl-pips i{width:8px;height:8px;border-radius:2px;background:var(--line-2);transform:rotate(45deg)}',
    '.tl-pips i.on{background:var(--firuze)}',
    '.tl-cacts{display:grid;grid-template-columns:1fr 1fr;gap:10px}',
    '.tl-cacts[hidden]{display:none}',
    '.tl-center{text-align:center}',
    '.tl-unit-link{justify-self:start;max-width:100%}',
    /* map */
    '.tl-legend{display:grid;gap:12px}',
    '.tl-s-good > b{color:var(--ok)}.tl-s-weak > b{color:var(--zafaran-ink)}',
    '.tl-lvl-sec{display:grid;gap:12px;min-width:0}',
    '.tl-lvl-sec .sec-h h2{display:flex;align-items:center;gap:8px}',
    '.tl-lvl-tag{display:inline-grid;place-items:center;min-width:38px;height:28px;padding:0 8px;border-radius:var(--r-sm);background:var(--surface2);color:var(--ink);font:700 var(--fs-sm)/1 var(--f-display)}',
    '.tl-lvl-sec.cur .tl-lvl-tag{background:var(--firuze);color:var(--on-firuze)}',
    '.tl-soon{padding:12px 14px;border:1px dashed var(--line-2);border-radius:var(--r-md)}',
    '.tl-tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}',
    '@media (max-width:420px){.tl-tiles{grid-template-columns:repeat(2,minmax(0,1fr))}}',
    '.tl-tile{--st:var(--line-2);--st-bg:var(--surface);display:flex;flex-direction:column;align-items:stretch;gap:6px;min-width:0;min-height:120px;padding:12px;border:1.5px solid var(--line);border-radius:var(--r-lg);background:var(--st-bg);color:var(--ink);text-align:left;font:inherit;cursor:pointer;transition:border-color var(--t-base),transform var(--t-fast) var(--ease-out),box-shadow var(--t-base)}',
    '@media (hover:hover){.tl-tile:hover{border-color:var(--st);box-shadow:var(--sh-1)}}',
    '.tl-tile:active{transform:scale(.98)}',
    '.tl-tile:focus-visible{outline:2px solid var(--focus);outline-offset:2px}',
    '.tl-tile b{font-size:var(--fs-sm);font-weight:700;line-height:1.3;overflow-wrap:anywhere}',
    '.tl-tile small{color:var(--soft);font-size:var(--fs-xs);line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
    '.tl-tile-top{display:flex;align-items:center;justify-content:space-between;gap:6px;min-width:0}',
    '.tl-tile-g{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--faint);font-size:.6875rem;font-weight:600;letter-spacing:.04em;text-transform:uppercase}',
    '.tl-st{flex:none;width:10px;height:10px;border-radius:50%;background:var(--st)}',
    '.tl-tile-st{margin-top:auto;font-size:.6875rem;font-weight:700;letter-spacing:.04em;color:var(--soft)}',
    '.tl-tile[data-st="new"]{--st:var(--line-2);--st-bg:var(--surface2)}',
    '.tl-tile[data-st="weak"],.tl-tile[data-st="mid"]{--st:var(--zafaran);--st-bg:linear-gradient(var(--zaf-t),var(--zaf-t)),var(--surface);border-color:color-mix(in srgb,var(--zafaran) 45%,var(--line))}',
    '.tl-tile[data-st="weak"] .tl-tile-st,.tl-tile[data-st="mid"] .tl-tile-st{color:var(--zafaran-ink)}',
    '.tl-tile[data-st="good"]{--st:var(--ok);--st-bg:linear-gradient(var(--ok-t),var(--ok-t)),var(--surface);border-color:color-mix(in srgb,var(--ok) 45%,var(--line))}',
    '.tl-tile[data-st="good"] .tl-tile-st{color:var(--ok)}',
    /* unit sheet */
    '.tl-unit p{color:var(--ink)}',
    '.tl-unit-az{font-weight:600}',
    '.tl-form{display:grid;gap:6px}.tl-form ul{display:grid;gap:4px;margin:0;padding-left:18px;font-family:var(--f-mono);font-size:var(--fs-sm)}',
    '.tl-exs{display:grid;gap:8px}',
    '.tl-exm{display:grid;gap:2px;padding:10px 12px;border-radius:var(--r-md);background:var(--surface2);min-width:0;overflow-wrap:anywhere}',
    '.tl-exm small{color:var(--soft)}',
    '.tl-exlist{display:grid;gap:10px}',
    '.tl-ex{display:flex;gap:10px;padding:12px;border:1px solid var(--line);border-radius:var(--r-md);min-width:0}',
    '.tl-ex.ok{border-color:var(--ok);background:var(--ok-t)}.tl-ex.bad{border-color:var(--nar);background:var(--nar-t)}',
    '.tl-ex-n{flex:none;display:grid;place-items:center;width:24px;height:24px;border-radius:50%;background:var(--surface2);font-size:var(--fs-xs);font-weight:700}',
    '.tl-ex-b{flex:1;display:grid;gap:8px;min-width:0}',
    '.tl-ex-q{overflow-wrap:anywhere}',
    '.tl-ex-b .chips .chip{white-space:normal;text-align:left;min-height:34px;height:auto;padding:4px 12px}',
    '.tl-ex-fb{font-size:var(--fs-sm)}',
    '.tl-ex-fb span{display:inline-flex;flex-wrap:wrap;align-items:center;gap:4px}.tl-ex-fb svg{width:14px;height:14px}',
    '.tl-ok{color:var(--ok);font-weight:600}.tl-bad{color:var(--nar)}.tl-bad b{color:var(--ink)}'
  ].join('\n'));

  /* ------------------------------------------------------------------
     10. REGISTER + API
     ------------------------------------------------------------------ */
  function leave() { cleanup(); gen++; T = null; P = null; C = null; }
  function wrap(fn) { return function (el, params) { cleanup(); try { fn(el, params || {}); } catch (e) { log(e); throw e; } }; }
  var GROUP = 'Məşq və təkrar';
  App.register('g-test', { title: 'Səviyyə testi', icon: 'target', group: GROUP, mode: 'grammar', order: 10, render: wrap(renderTest), leave: leave });
  App.register('g-practice', { title: 'Şəxsi məşq', icon: 'sparkle', group: GROUP, mode: 'grammar', order: 11, render: wrap(renderPractice), leave: leave });
  App.register('g-cards', {
    title: 'Yaddaş kartları', icon: 'cards', group: GROUP, mode: 'grammar', order: 12, badgeKind: 'gold',
    badge: function () { var n = dueCount(); return n ? String(n) : null; },
    render: wrap(renderCards), leave: leave
  });
  App.register('g-map', { title: 'Mövzu xəritəsi', icon: 'chart', group: GROUP, mode: 'grammar', order: 13, render: wrap(renderMap), leave: leave });

  function maybeOfferTest() {
    if (currentLevel()) return false;
    var last = Number(sget(K.offer, 0)) || 0;
    if (Date.now() - last < 3 * DAY) return false;
    var cur = App.current ? App.current() : null;
    if (cur === 'g-test') return false;
    sset(K.offer, Date.now());
    App.toast('Səviyyənizi bilək?', 'info', { sub: '20 suallıq adaptiv test — təxminən 5 dəqiqə', icon: 'target', ms: 8000, action: { label: 'Başla', onClick: function () { App.go('g-test'); } } });
    tenso('wave', 'Səviyyənizi bilsəm, dərsləri daha dəqiq seçərəm. Qısa test edək?', 4000);
    return true;
  }

  var TL = W.TensoLearn = {
    addMistake: addMistake,
    mistakes: mistakes,
    weakRules: weakRules,
    dueCount: dueCount,
    level: currentLevel,
    maybeOfferTest: maybeOfferTest,
    openUnit: openUnit,
    recordUnitScore: recordUnitScore,
    unitStatus: function (id) { return unitStatus(id); },
    unitForRule: unitForRule,
    unitForTopic: unitForTopic,
    checkAnswer: checkAnswer,
    unitOpener: (W.TensoLearn && W.TensoLearn.unitOpener) || null
  };
})();
