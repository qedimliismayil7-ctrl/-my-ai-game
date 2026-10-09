/* =====================================================================
   NUANZA QRAMMATİKA — ai/grammar.js  (müştəri)
   NuanzaGrammar.check(text, {lang:'en'|'az'|'auto', mode:'fast'|'deep'})
     → Promise<{lang, score, level:{cefr,why}|null, issues[], corrected, summary,
                source:'ai'|'local', offline:bool, reason:code|null, reasonText}>
   • Əvvəl oflayn qaydalar (ai/grammar-rules.js) dərhal işləyir, sonra POST /grammar.
   • Birləşdirmə: eyni parça → AI-ın düzəlişi; üst-üstə düşən → AI qalır; yalnız
     yerli qaydanın tapdığı → əlavə olunur.
   • Saytda Worker yoxdursa / şəbəkə, kod, limit xətası → yalnız oflayn nəticə + səbəb.
   • lessonFor(issue) → NUANZA_GRAMMAR kurs vahidi (unit.rule_ids, sonra ehtiyat cədvəl).
   • notebook: «Səhv dəftərim» — qayda üzrə sayğac (App.store 'grammar:book').
   ===================================================================== */
(function () {
  'use strict';
  var W = window;
  function rules() { return W.NuanzaGrammarRules; }

  var ERR = {
    static: 'Bu baxışda server yoxdur — yalnız oflayn qaydalar işlədi.',
    network: 'İnternet yoxdur — yalnız oflayn qaydalar işlədi.',
    not_configured: 'Süni intellekt hələ qurulmayıb — yalnız oflayn qaydalar işlədi.',
    bad_code: 'Giriş kodu yanlışdır (Ayarlar → Hesab) — yalnız oflayn qaydalar işlədi.',
    rate_limited: 'Limit doldu — bir az sonra yenidən yoxlayın. İndilik oflayn qaydalar işlədi.',
    text_too_large: 'Mətn 20 000 simvoldan uzundur — yalnız oflayn qaydalar işlədi.',
    timeout: 'Server vaxtında cavab vermədi — yalnız oflayn qaydalar işlədi.',
    server_error: 'Süni intellekt cavab vermədi — yalnız oflayn qaydalar işlədi.'
  };
  function reasonText(c) { return ERR[c] || ERR.server_error; }

  function accessCode() {
    try { if (W.App && W.App.store) { var c = W.App.store.get('code', ''); return c == null ? '' : String(c).trim(); } } catch (e) { /* ignore */ }
    try { var v = W.localStorage.getItem('nuanza2:code'); v = v ? JSON.parse(v) : ''; return v == null ? '' : String(v).trim(); } catch (e) { return ''; }
  }

  /* POST /grammar. Throws {code}. */
  function remote(text, lang, mode) {
    var code = accessCode();
    if (/[^\x20-\x7e]/.test(code)) return Promise.reject({ code: 'bad_code' });
    var ctl = typeof AbortController === 'function' ? new AbortController() : null;
    var timer = ctl ? setTimeout(function () { ctl.abort(); }, 75000) : null;
    return fetch('/grammar', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-access-code': code },
      body: JSON.stringify({ text: text, lang: lang, mode: mode === 'deep' ? 'deep' : 'fast' }),
      signal: ctl ? ctl.signal : undefined
    }).then(function (r) {
      var isJson = /json/i.test(r.headers.get('content-type') || '');
      return (isJson ? r.json().catch(function () { return null; }) : Promise.resolve(null)).then(function (j) {
        if (timer) clearTimeout(timer);
        if (!j) throw { code: W.NUANZA_LIVE ? 'server_error' : 'static' };
        if (!r.ok || !j.ok) throw { code: j.error || 'server_error' };
        return j.data;
      });
    }, function (e) {
      if (timer) clearTimeout(timer);
      throw { code: e && e.name === 'AbortError' ? 'timeout' : (W.navigator && W.navigator.onLine === false ? 'network' : (W.NUANZA_LIVE ? 'network' : 'static')) };
    });
  }

  /* serverdən gələn qeydləri yoxla (ofsetlər mətnlə uyğun olmalıdır) */
  function sane(text, list) {
    var R = rules(), cat = (R && R.RULES) || {};
    return (Array.isArray(list) ? list : []).filter(function (x) {
      return x && typeof x.start === 'number' && typeof x.end === 'number' && x.end > x.start && text.slice(x.start, x.end) === x.wrong && typeof x.fix === 'string';
    }).map(function (x) {
      var r = cat[x.rule];
      return { start: x.start, end: x.end, wrong: x.wrong, fix: x.fix, type: x.type || (r && r.type) || 'Grammar', why: x.why || (r && r.note) || '', sev: x.sev === 'high' || x.sev === 'low' ? x.sev : 'mid',
        rule: x.rule || '', ruleTitle: x.ruleTitle || (r && r.t) || '', src: 'ai' };
    });
  }

  /* yerli + AI birləşməsi */
  function merge(local, ai) {
    var out = ai.slice();
    local.forEach(function (l) {
      var same = null, overlap = false;
      out.forEach(function (a) {
        if (a.start === l.start && a.end === l.end) same = a;
        else if (l.start < a.end && l.end > a.start) overlap = true;
      });
      if (same) {
        same.src = 'both';
        if (!same.why) same.why = l.why;
        if (!same.rule || /\.style$/.test(same.rule)) { same.rule = l.rule; same.ruleTitle = l.ruleTitle; }
        return;
      }
      if (!overlap) out.push(l);
    });
    return out.sort(function (a, b) { return a.start - b.start; });
  }

  function summaryOf(issues, lang) {
    if (!issues.length) return lang === 'en' ? 'Səhv tapılmadı — əla yazmısınız!' : 'Səhv tapılmadı — mətn səliqəlidir.';
    var high = issues.filter(function (x) { return x.sev === 'high'; }).length;
    return issues.length + ' qeyd' + (high ? ', onlardan ' + high + '-i vacib' : '') + '. Hər birinə toxunun — səbəbini və qaydasını göstərirəm.';
  }

  function check(text, opts) {
    opts = opts || {};
    text = String(text == null ? '' : text);
    var R = rules();
    var want = opts.lang === 'en' || opts.lang === 'az' ? opts.lang : 'auto';
    var lang = want === 'auto' ? (R ? R.detect(text) : 'en') : want;
    var loc = R ? R.check(text, { lang: lang }).issues : [];
    function localResult(code) {
      var lvl = lang === 'en' && R ? R.level(text, loc) : null;
      return { lang: lang, score: R ? R.score(text, loc) : 100, level: lvl, issues: loc, corrected: R ? R.apply(text, loc) : text,
        summary: summaryOf(loc, lang), source: 'local', offline: true, reason: code, reasonText: reasonText(code) };
    }
    if (opts.localOnly) return Promise.resolve(localResult('static'));
    if (text.length > 20000) return Promise.resolve(localResult('text_too_large'));
    return remote(text, want, opts.mode).then(function (d) {
      var dl = d && (d.lang === 'az' || d.lang === 'en') ? d.lang : lang;
      if (dl !== lang && R) { lang = dl; loc = R.check(text, { lang: lang }).issues; }
      var issues = merge(loc, sane(text, d && d.issues));
      var lvl = d && d.level && d.level.cefr ? d.level : (lang === 'en' && R ? R.level(text, issues) : null);
      return {
        lang: lang, score: R ? R.score(text, issues) : (d.score || 0), level: lang === 'en' ? lvl : null, issues: issues,
        corrected: R ? R.apply(text, issues) : d.corrected, summary: (d && d.summary) || summaryOf(issues, lang),
        source: 'ai', offline: false, reason: null, reasonText: ''
      };
    }, function (e) { return localResult((e && e.code) || 'server_error'); });
  }

  /* ------------------------------------------------------------------
     Kurs vahidləri (NUANZA_GRAMMAR) və qayda → vahid xəritəsi
     ------------------------------------------------------------------ */
  /* checker qaydası → kursun rule_ids / unit id namizədləri (ardıcıllıq vacibdir) */
  var MAP = {
    'en.article': ['article-missing', 'articles', 'articles-a-an-the', 'a-an-the', 'article-generic', 'articles-advanced'],
    'en.a_an': ['a-an', 'article-a-an', 'articles-a-an', 'articles', 'article-missing'],
    'en.zero_article': ['article-generic', 'article-geographic', 'zero-article', 'the-general', 'articles-the', 'articles-advanced'],
    'en.be_agree': ['be-agree', 'am-agree', 'az-calques'],
    'en.be_verb': ['to-be', 'be-forms', 'verb-to-be', 'am-is-are', 'was-were'],
    'en.sv_agreement': ['people-plural', 'every-singular', 'subject-verb-agreement', 'sv-agreement', 'people-are', 'every-singular', 'third-person-s'],
    'en.third_person_s': ['third-person-s', 'do-does-base', 'present-simple-s', 'present-simple'],
    'en.did_base': ['did-past-verb', 'did-base', 'past-simple-negative', 'past-simple-questions', 'past-simple'],
    'en.modal_base': ['modal-to', 'modal-base', 'can-to', 'can-cant', 'modals', 'modal-verbs'],
    'en.past_simple': ['irregular-past', 'past-simple', 'when-past-simple', 'past-time-marker', 'irregular-v2', 'past-simple-regular', 'past-simple-irregular'],
    'en.present_perfect': ['present-perfect-definite-time', 'tense-since-for', 'yet-present-perfect', 'since-for', 'present-perfect', 'present-perfect-past', 'present-perfect-vs-past'],
    'en.continuous': ['stative-continuous', 'present-continuous', 'present-simple-continuous'],
    'en.future': ['will-to', 'future-will', 'future-will', 'will-going-to', 'future', 'will-after-if'],
    'en.comparative': ['double-comparative', 'more-better', 'comparatives', 'comparative', 'superlatives'],
    'en.plural': ['plural-after-number', 'irregular-plural', 'plural-nouns', 'plural', 'plurals'],
    'en.uncountable': ['uncountable-plural', 'advice-information', 'uncountable-article', 'much-many', 'uncountable', 'much-many', 'countable-uncountable', 'quantifiers'],
    'en.preposition': ['prep-time', 'prep-place', 'prep-next-last', 'in-on-at', 'prepositions-time', 'time-prepositions', 'prepositions-place', 'preposition'],
    'en.verb_pattern': ['married-with', 'explain-to', 'discuss-about', 'call-to', 'dependent-preposition', 'gerund-infinitive', 'want-to', 'dependent-prepositions'],
    'en.word_order': ['word-order-svo', 'adverb-position', 'adverb-between-verb-object', 'place-time-order', 'word-order', 'adverb-position', 'very-like', 'adverbs-frequency'],
    'en.questions': ['question-word-order', 'question-aux', 'question-order', 'do-support', 'questions', 'question-words'],
    'en.pronoun': ['pronoun-gender', 'his-her', 'he-she', 'pronoun-gender', 'subject-pronouns', 'pronouns'],
    'en.false_friend': ['false-friends'],
    'en.calque': ['make-photo', 'make-do', 'age-have', 'az-calques', 'make-do', 'make-photo', 'calque'],
    'en.capital': ['capital-i', 'capitals', 'capital-letters'],
    'en.punctuation': ['comma-splice', 'however-comma', 'conditional-comma', 'punctuation', 'comma-splice', 'punctuation-comma-splice'],
    'en.style': ['register-informal', 'hedging']
  };
  /* daha dəqiq: səhv mətnindəki açar söz → konkret rule_id */
  var BY_TEXT = [
    [/married\s+with/i, 'married-with'], [/married\s+with/i, 'married-to'], [/discuss\w*\s+about/i, 'discuss-about'], [/explain/i, 'explain-to'], [/\b(said|say|says)\s+me\b/i, 'say-tell'],
    [/\b(make|makes|made|making)\b.*\b(photo|picture)/i, 'make-photo'], [/\b(have|has)\s+\d+\s+years\b/i, 'age-have'], [/\bin\s+the\s+(last|next)\s+(year|week|month)\b/i, 'prep-next-last'], [/\bmore\s+\w+er\b|\bmost\s+best\b/i, 'double-comparative'], [/\b(can|must|should|could)\s+to\b/i, 'modal-to'], [/\bwill\s+to\b/i, 'will-to'], [/\b(people|police|children)\s+(is|was|has)\b/i, 'people-plural'], [/\bsince\b/i, 'tense-since-for'], [/\bagree\b/i, 'be-agree'], [/\bagree\b/i, 'am-agree'],
    [/\b(actual|actually|magazine|fabric|sympathetic|eventually|accurate|artist|decade)\b/i, 'false-friends']
  ];
  function units() { var G = W.NUANZA_GRAMMAR; return G && Array.isArray(G.units) ? G.units.filter(function (u) { return u && u.id && u.title; }) : []; }
  function unitById(id) { var u = units(); for (var i = 0; i < u.length; i++) if (u[i].id === id) return u[i]; return null; }
  function unitByTag(tag) {
    var u = units(), i;
    for (i = 0; i < u.length; i++) if ((u[i].rule_ids || []).indexOf(tag) >= 0) return u[i];
    for (i = 0; i < u.length; i++) if (u[i].id === tag) return u[i];
    return null;
  }
  function lessonFor(issue) {
    if (!issue) return null;
    var rule = typeof issue === 'string' ? issue : issue.rule, wrong = typeof issue === 'string' ? '' : String(issue.wrong || '');
    if (!rule || rule.indexOf('en.') !== 0) return null;
    var tags = [];
    if (wrong) BY_TEXT.forEach(function (p) { if (p[0].test(wrong)) tags.push(p[1]); });
    tags = tags.concat(MAP[rule] || []);
    for (var i = 0; i < tags.length; i++) { var u = unitByTag(tags[i]); if (u) return u; }
    /* son ehtiyat: qayda açar sözləri vahid id/başlığında */
    if (rule === 'en.capital' || rule === 'en.spelling') return null;
    var R = rules(), keys = (R && R.RULES[rule] && R.RULES[rule].keys) || [];
    var all = units();
    for (var k = 0; k < keys.length; k++) for (var j = 0; j < all.length; j++) if (all[j].id.indexOf(keys[k]) >= 0) return all[j];
    return null;
  }

  /* ------------------------------------------------------------------
     Səhv dəftəri: qayda üzrə sayğac + kartlar
     ------------------------------------------------------------------ */
  function sget(k, fb) { try { var v = W.App.store.get(k, fb); return v == null ? fb : v; } catch (e) { return fb; } }
  function sset(k, v) { try { W.App.store.set(k, v); } catch (e) { /* ignore */ } }
  function record(issues) {
    var book = sget('grammar:book', {});
    if (!book || typeof book !== 'object') book = {};
    var seen = {};
    (issues || []).forEach(function (x) {
      if (!x.rule || seen[x.rule]) return; seen[x.rule] = 1;
      var b = book[x.rule] || { n: 0, title: x.ruleTitle || x.rule, last: 0, ex: [] };
      b.n++; b.last = Date.now(); b.title = x.ruleTitle || b.title;
      if (x.fix && !x.manual) { b.ex.unshift({ bad: x.wrong, good: x.fix }); b.ex = b.ex.slice(0, 3); }
      book[x.rule] = b;
    });
    sset('grammar:book', book);
    return book;
  }
  function top(n) {
    var book = sget('grammar:book', {}) || {};
    return Object.keys(book).map(function (k) { var b = book[k]; return { rule: k, n: b.n, title: b.title, last: b.last, ex: b.ex || [] }; })
      .sort(function (a, b) { return b.n - a.n || b.last - a.last; }).slice(0, n || 3);
  }
  function addCard(issue) {
    var cards = sget('grammar:cards', []);
    if (!Array.isArray(cards)) cards = [];
    if (cards.some(function (c) { return c.bad === issue.wrong && c.good === issue.fix; })) return false;
    cards.unshift({ id: 'g' + Date.now().toString(36), bad: issue.wrong, good: issue.fix, why: issue.why, rule: issue.rule, title: issue.ruleTitle, box: 0, due: 0, at: Date.now() });
    sset('grammar:cards', cards.slice(0, 300));
    return true;
  }

  W.NuanzaGrammar = {
    check: check, merge: merge, remote: remote, reasonText: reasonText,
    units: units, unitById: unitById, lessonFor: lessonFor,
    record: record, top: top, addCard: addCard,
    MAP: MAP
  };
})();
