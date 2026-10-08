/* Nuanza — live adapter for kind 'translate'.
   One Gemini call (speed normal): detects the source register, translates
   sentence by sentence in the requested (or detected) register, rates each
   sentence high / mid / low with a short Azerbaijani note, and fills the
   situation card. Resolves to the same shape as the demo AI.translate in app.js:
   { text, register, registerId, detected, detectedId, auto, registerConfidence,
     from, to, pair, pairLabel, segments[{src,t,confidence,note?,spans,para,n}],
     situation{domain,purpose,audience,register,tone}, terms[{a,b,domain,note,enforced}],
     questions[{q,options,why}], stats{words,outWords,segments,high,mid,low,tm}, demo }
   Input: { text, register?, from?, to?, pair?, terms?: [{a,b}] (a project's approved terms, used first),
            style?: 'literal' | 'natural' (the «3 variant» sheet), speed?: 'fast' }.
   Every non-empty line of the text is its own paragraph (segment[].para), so a caller can
   send several editor segments at once and put the translations back by paragraph. */
(function () {
  'use strict';
  var W = window, N = W.NuanzaAI;
  if (!N || !N.kinds) return;

  var REG_IDS = ['danisiq', 'neytral', 'resmi', 'huquqi'];
  var REG_LABEL = { danisiq: 'Danışıq', neytral: 'Neytral', resmi: 'Rəsmi', huquqi: 'Hüquqi' };
  var REG_USE = {
    danisiq: 'casual / spoken — friends, colleagues, chats, social media',
    neytral: 'neutral — interface text, news, instructions',
    resmi: 'formal official — business letters, reports, official notices',
    huquqi: 'legal — contracts, laws, powers of attorney'
  };
  var DOMAINS = ['Hüquq', 'Maliyyə', 'Neft-qaz', 'İşgüzar yazışma', 'İnterfeys', 'Turizm', 'Tibb', 'Gündəlik yazışma', 'Ümumi'];
  var RANK = { low: 0, mid: 1, high: 2 };
  var NOTE_MID = 'Bu hissəni bir də yoxlayın — kontekstdən asılı olaraq başqa variant daha uyğun ola bilər.';
  var NOTE_LOW = 'Burada əmin deyiləm — mənbə ilə tutuşdurun və lazım olsa, əl ilə düzəldin.';
  var NOTE_MISSING = 'Bu cümlənin tərcüməsi gəlmədi — mənbə olduğu kimi saxlanıb. Yenidən tərcümə edin.';

  /* ---------- small helpers (mirror app.js so the shape is identical) ---------- */
  function App() { return W.App || null; }
  function lower(s) { s = String(s == null ? '' : s); try { return s.toLocaleLowerCase('az'); } catch (e) { return s.toLowerCase(); } }
  function fold(s) {
    return lower(s).replace(/ə/g, 'e').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ü/g, 'u')
      .replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/̇/g, '');
  }
  /* Matching key: lower-case, dotless ı folded to i so «Information» and «information» meet. */
  function mkey(s) { return lower(s).replace(/ı/g, 'i').replace(/\u0307/g, ''); }
  function reEsc(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function countWords(s) { return (String(s || '').match(/[\p{L}\p{N}]+(?:[-'’][\p{L}\p{N}]+)*/gu) || []).length; }
  function upper(s) { s = String(s == null ? '' : s); try { return s.toLocaleUpperCase('az'); } catch (e) { return s.toUpperCase(); } }
  function pairLabel(id) {
    var A = App();
    if (A && typeof A.pairLabel === 'function') { try { return A.pairLabel(id); } catch (e) { /* fall through */ } }
    var p = String(id || '').split('-');
    return p.length === 2 ? upper(p[0]) + ' → ' + upper(p[1]) : String(id || '');
  }
  function detectLang(t) {
    var A = App();
    if (A && A.detect && typeof A.detect.lang === 'function') { try { return A.detect.lang(t); } catch (e) { /* fall through */ } }
    t = String(t || '');
    if (/[Ѐ-ӿ]/.test(t)) return 'ru';
    if (/[əƏ]/.test(t)) return 'az';
    if (/[ğışçöüİĞŞÇÖÜ]/.test(t)) return /[xqXQ]/.test(t) ? 'az' : 'tr';
    if (/(^|\s)(ve|için|bir|ile|olarak|değil)(\s|$)/i.test(t)) return 'tr';
    return 'en';
  }
  /* Heuristic register guess from the source — only a fallback when the model omits "detected". */
  function heuristicRegister(t) {
    var A = App();
    if (A && A.detect && typeof A.detect.register === 'function') {
      try { var r = A.detect.register(t); if (r && REG_LABEL[r.id]) return r; } catch (e) { /* ignore */ }
    }
    return { id: 'neytral', confidence: 0.5 };
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
  function normConf(c, hasNote) {
    if (typeof c === 'number' && isFinite(c)) { var n = c <= 1 ? c * 100 : c; return n >= 80 ? 'high' : n >= 55 ? 'mid' : 'low'; }
    var f = fold(c || '').trim();
    if (/^(high|yuks|emin|sure|certain)/.test(f)) return 'high';
    if (/^(mid|med|orta|check|yoxla)/.test(f)) return 'mid';
    if (/^(low|asag|zeif|subhe|unsure|doubt)/.test(f)) return 'low';
    return hasNote ? 'mid' : 'high';
  }
  function clean(s) { return N.str(s).replace(/\s+/g, ' ').trim(); }

  /* Same sentence splitter as the demo (app.js 10.4). */
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

  /* Same pair logic as the demo: one side is always Azerbaijani. */
  function resolvePair(inp, text) {
    var pair = inp.pair && /^[a-z]{2}-[a-z]{2}$/.test(String(inp.pair)) ? String(inp.pair).split('-') : null;
    var from = inp.from || (pair && pair[0]) || detectLang(text);
    var to = inp.to || (pair && pair[1]) || (from === 'az' ? 'en' : 'az');
    if (!N.LANG[from]) from = detectLang(text);
    if (!N.LANG[to]) to = from === 'az' ? 'en' : 'az';
    if (from !== 'az' && to !== 'az') to = 'az';
    if (to === from) to = from === 'az' ? 'en' : 'az';
    return N.pairOf({ from: from, to: to });
  }

  /* Register wording for the target language. */
  function regDesc(reg, P) {
    if (P.to === 'az') return N.REGISTER[reg];
    if (reg === 'danisiq') return 'casual spoken register — how people really talk in everyday ' + P.B + ' (informal address, contractions and everyday words), still correct';
    if (reg === 'resmi') return 'formal official register (polite address, complete sentences)';
    if (reg === 'huquqi') return 'legal register — precise, conservative, standard ' + P.B + ' legal formulas' + (P.to === 'en' ? ', obligations with shall' : '');
    return 'neutral register';
  }

  /* ---------- terminology: built-in glossary (EN→AZ) + the user's own terms ---------- */
  function termRe(term, lang) {
    var t = reEsc(mkey(term));
    /* Azerbaijani / Turkish / Russian words take suffixes, so only the start is anchored. */
    var tail = lang === 'en' ? '(?:s|es|d|ed|ing)?(?=$|[^\\p{L}])' : '';
    try { return new RegExp('(^|[^\\p{L}])' + t + tail, 'u'); } catch (e) { return null; }
  }
  function glossaryHits(text, P, extra) {
    var A = App(), src = ' ' + mkey(text) + ' ', out = [], seen = {};
    function add(a, b, d, note, user) {
      a = clean(a); b = clean(b);
      if (!a || !b || seen[mkey(a)] || out.length >= 25) return;
      var re = termRe(a, P.from);
      if (!re || !re.test(src)) return;
      seen[mkey(a)] = 1;
      out.push({ a: a, b: b, domain: d || 'Ümumi', note: note || '', user: !!user });
    }
    /* the caller's terms first (a project's approved glossary), then the user's own, then the built-in one */
    N.arr(extra).forEach(function (g) { if (g && typeof g === 'object') add(g.a, g.b, g.d || g.domain, g.note, true); });
    var mine = [];
    try { mine = A && A.store ? A.store.get('glossary-user', []) : []; } catch (e) { mine = []; }
    if (Array.isArray(mine)) mine.forEach(function (g) {
      if (!g || typeof g !== 'object') return;
      var gf = g.from || 'en', gt = g.to || 'az';
      if (gf === P.from && gt === P.to) add(g.a, g.b, g.d, g.note, true);
      else if (gf === P.to && gt === P.from) add(g.b, g.a, g.d, g.note, true);
    });
    var G = (A && A.data && Array.isArray(A.data.GLOSSARY)) ? A.data.GLOSSARY : [];
    G.forEach(function (g) {
      if (!g) return;
      if (P.from === 'en' && P.to === 'az') add(g.a, g.b, g.d, g.note, false);
      else if (P.from === 'az' && P.to === 'en') add(g.b, g.a, g.d, g.note, false);
    });
    return out;
  }
  /* A term counts as kept only when its target form really appears in the translation. */
  function stemOf(w) {
    w = w.replace(/(maq|mək)$/, '');
    return w.length > 5 ? w.slice(0, w.length - 2) : w;
  }
  function termKept(b, outKey) {
    var words = mkey(b).split(/[^\p{L}\p{N}]+/u).filter(Boolean);
    if (!words.length) return false;
    for (var i = 0; i < words.length; i++) if (outKey.indexOf(stemOf(words[i])) < 0) return false;
    return true;
  }

  /* ---------- prompt ---------- */
  var STYLE = {
    literal: function (P) { return 'VARIANT: a close, literal translation — keep the SOURCE sentence structure, the order of ideas and every pronoun wherever ' + P.B + ' grammar allows, and prefer direct equivalents to idioms. It must still be grammatical and correct.'; },
    natural: function (P) { return 'VARIANT: a free, natural translation — say it the way a native ' + P.B + ' speaker would, restructure sentences and use idiomatic phrasing where it reads better; keep the meaning, numbers and names exactly.'; }
  };
  function buildPrompt(P, req, sents, terms, style) {
    var L = [];
    L.push('Translate the SOURCE from ' + P.A + ' to ' + P.B + ': translate meaning, not words — understand each sentence, then rebuild it in natural ' + P.B + ' word order. ' + P.rules);
    if (STYLE[style]) L.push(STYLE[style](P));
    if (req) {
      L.push('REGISTER: write the whole translation in the ' + regDesc(req, P) + ', even if the SOURCE is written in another register.');
    } else {
      L.push('REGISTER: first decide the register of the SOURCE, then write the whole translation in that same register. Registers: ' +
        REG_IDS.map(function (k) { return '"' + k + '" (' + REG_USE[k] + ') → ' + regDesc(k, P); }).join('; ') + '.');
    }
    if (terms.length) {
      L.push('TERMINOLOGY — use exactly these ' + P.B + ' terms, inflected as the grammar needs: ' +
        terms.map(function (t) { return '"' + t.a + '" = "' + t.b + '"'; }).join('; ') + '.');
    }
    L.push('Keep every number, date, amount and proper name exactly as in the SOURCE; add nothing and omit nothing.');
    L.push(N.ORTHO);
    L.push(N.AZNOTES);
    L.push('The SOURCE is split into numbered sentences (a blank line starts a new paragraph). Translate every number separately and in order, using the whole text as context; never merge two numbers and never skip one (a very long sentence may become two sentences inside its own number).');
    L.push('CONFIDENCE for each number: "high" — meaning, terms and register are certain; "mid" — a term, idiom or nuance where another reading is plausible, so the translator should check it; "low" — the SOURCE is ambiguous, unclear or possibly mistyped, or you are unsure of the meaning. Be honest and selective: clear sentences are "high".');
    L.push('For "mid" and "low" also give "span": the exact uncertain words copied from your "t", and "note": one short Azerbaijani sentence on what is uncertain and what to check, naming the alternative if there is one.');
    L.push('Reply with ONLY: {"detected": the register of the SOURCE — EXACTLY one of "danisiq", "neytral", "resmi", "huquqi", ' +
      '"detectedConfidence": integer 0-100, ' +
      '"segments": [one per number {"i": the number, "t": the translation, "confidence": "high" or "mid" or "low", "span": exact uncertain words from "t" (mid/low only), "note": short Azerbaijani note (mid/low only)}], ' +
      '"situation": {"domain": EXACTLY one of ' + DOMAINS.map(function (d) { return '"' + d + '"'; }).join(', ') + ', "purpose": short Azerbaijani phrase, "audience": short Azerbaijani phrase, "tone": two or three Azerbaijani words}, ' +
      '"questions": [0 to 2 {"q": an Azerbaijani question to the client about a real ambiguity that changes the translation, "options": [2 or 3 short Azerbaijani answers], "why": one short Azerbaijani sentence}]}');
    L.push('SOURCE (' + P.A + '):');
    var lastPara = 0, body = [];
    sents.forEach(function (s, i) {
      if (i > 0 && s.para !== lastPara) body.push('');
      lastPara = s.para;
      body.push(i + ': ' + N.q(s.src));
    });
    return L.join('\n') + '\n' + body.join('\n');
  }

  /* ---------- normalise the model's answer ---------- */
  function pickSegments(data) {
    if (Array.isArray(data)) return data;
    if (!data || typeof data !== 'object') return [];
    var s = data.segments || data.sentences || data.items;
    return Array.isArray(s) ? s : [];
  }
  function segText(x) {
    if (typeof x === 'string') return x;
    if (!x || typeof x !== 'object') return '';
    return N.str(x.t != null ? x.t : x.text != null ? x.text : x.translation != null ? x.translation : x.target);
  }
  /* Put the model's items back on the numbered sentences. When every item carries a
     valid number, use it (two items with one number are joined); otherwise use the order. */
  function alignSegments(raw, n) {
    var out = new Array(n), ok = raw.length > 0;
    raw.forEach(function (x) {
      var i = x && typeof x === 'object' ? parseInt(x.i != null ? x.i : x.n, 10) : NaN;
      if (!isFinite(i) || i < 0 || i >= n) ok = false;
    });
    if (!ok) {
      for (var k = 0; k < n && k < raw.length; k++) out[k] = raw[k];
      return out;
    }
    raw.forEach(function (x) {
      var i = parseInt(x.i != null ? x.i : x.n, 10), prev = out[i];
      if (!prev) { out[i] = x; return; }
      var ca = normConf(prev.confidence, !!prev.note), cb = normConf(x.confidence, !!x.note);
      var worse = RANK[cb] < RANK[ca] ? x : prev;
      out[i] = { i: i, t: (segText(prev) + ' ' + segText(x)).trim(), confidence: worse === x ? cb : ca, note: worse.note, span: worse.span };
    });
    return out;
  }
  function spansFor(t, span, conf, note) {
    span = clean(span).replace(/^[«"“'„]+|[»"”']+$/g, '');
    if (span && span.length < t.length) {
      var i = t.indexOf(span), len = span.length;
      if (i < 0) {
        var lt = lower(t), ls = lower(span);
        if (lt.length === t.length && ls.length === span.length) i = lt.indexOf(ls);
      }
      if (i >= 0) {
        var out = [];
        if (i > 0) out.push({ t: t.slice(0, i), confidence: 'high' });
        out.push({ t: t.slice(i, i + len), confidence: conf, note: note });
        if (i + len < t.length) out.push({ t: t.slice(i + len), confidence: 'high' });
        return out;
      }
    }
    return [{ t: t, confidence: conf, note: note }];
  }
  function normSituation(s, reg) {
    s = s && typeof s === 'object' ? s : {};
    var d = clean(s.domain), dom = 'Ümumi';
    DOMAINS.forEach(function (x) { if (fold(x) === fold(d)) dom = x; });
    return { domain: dom, purpose: clean(s.purpose), audience: clean(s.audience), register: REG_LABEL[reg], tone: clean(s.tone) };
  }
  function normQuestions(qs) {
    var out = [];
    N.arr(qs).forEach(function (x) {
      if (out.length >= 2 || !x || typeof x !== 'object') return;
      var q = clean(x.q || x.question), opts = N.arr(x.options).map(clean).filter(Boolean).slice(0, 3);
      if (q && opts.length >= 2) out.push({ q: q, options: opts, why: clean(x.why) });
    });
    return out;
  }

  function emptyResult(P, req) {
    var reg = req || 'neytral';
    return {
      text: '', register: REG_LABEL[reg], registerId: reg, detected: REG_LABEL.neytral, detectedId: 'neytral', auto: !req,
      registerConfidence: 0, from: P.from, to: P.to, pair: P.key, pairLabel: pairLabel(P.key),
      segments: [], situation: normSituation(null, reg), terms: [], questions: [],
      stats: { words: 0, outWords: 0, segments: 0, high: 0, mid: 0, low: 0, tm: 0 }, demo: false
    };
  }

  N.kinds.translate = function (inp) {
    if (typeof inp === 'string') inp = { text: inp };
    inp = inp || {};
    var text = String(inp.text || inp.src || inp.source || '').trim();
    var P = resolvePair(inp, text);
    var req = normReg(inp.register);
    if (!text) return Promise.resolve(emptyResult(P, req));

    var sents = [];
    text.split(/\n+/).map(function (p) { return p.trim(); }).filter(Boolean).forEach(function (p, pi) {
      splitSentences(p).forEach(function (s) { sents.push({ src: s, para: pi }); });
    });
    var terms = glossaryHits(text, P, inp.terms);
    var style = inp.style === 'literal' || inp.style === 'natural' ? inp.style : '';

    return N.call(buildPrompt(P, req, sents, terms, style), { speed: inp.speed === 'fast' ? 'fast' : 'normal' }).then(function (data) {
      data = data && typeof data === 'object' ? data : {};
      var raw = pickSegments(data);
      var whole = Array.isArray(data) ? '' : N.str(data.final || data.translation || data.text).trim();

      var aligned = alignSegments(raw, sents.length), got = 0;
      aligned.forEach(function (x) { if (segText(x).trim()) got++; });
      if (!got && !whole) throw { code: 'invalid_json' };

      var segs = [];
      if (!got) {
        /* No per-sentence answer, only a whole translation: keep it, but do not claim certainty. */
        segs.push({ src: text, t: whole, confidence: 'mid', note: 'Cümlə-cümlə əminlik ölçülmədi — mətni bir də oxuyun.', para: 0 });
      } else {
        sents.forEach(function (s, i) {
          var x = aligned[i], t = segText(x).replace(/\s+/g, ' ').trim();
          if (!t) { segs.push({ src: s.src, t: s.src, confidence: 'low', note: NOTE_MISSING, para: s.para }); return; }
          var o = x && typeof x === 'object' ? x : {};
          var note = clean(o.note || o.why), conf = normConf(o.confidence, !!note);
          var g = { src: s.src, t: t, confidence: conf, para: s.para };
          if (conf !== 'high') g.note = note || (conf === 'low' ? NOTE_LOW : NOTE_MID);
          g._span = conf !== 'high' ? N.str(o.span || o.hl) : '';
          segs.push(g);
        });
      }

      segs.forEach(function (g) {
        g.spans = spansFor(g.t, g._span, g.confidence, g.note);
        delete g._span;
        if (g.confidence === 'high') g.spans = [{ t: g.t, confidence: 'high' }];
      });

      /* Separators and the joined text exactly like the demo. */
      var outParas = [];
      segs.forEach(function (g, i) {
        g.n = i + 1;
        (outParas[g.para] = outParas[g.para] || []).push(g.t);
        var nx = segs[i + 1];
        var sep = !nx ? '' : (nx.para !== g.para ? '\n\n' : ' ');
        if (sep) { g.t += sep; if (g.spans && g.spans.length) g.spans[g.spans.length - 1].t += sep; }
      });
      var outText = outParas.filter(Boolean).map(function (a) { return a.join(' '); }).join('\n\n');

      var hr = null;
      var det = normReg(data.detected || data.register || data.sourceRegister);
      var detConf = data.detectedConfidence != null ? N.clamp100(data.detectedConfidence) / 100 : null;
      if (!det) { hr = heuristicRegister(text); det = hr.id; }
      if (detConf == null) { hr = hr || heuristicRegister(text); detConf = typeof hr.confidence === 'number' ? hr.confidence : 0.5; }
      var reg = req || det;

      var outKey = mkey(outText);
      var keptTerms = terms.filter(function (t) { return termKept(t.b, outKey); }).slice(0, 8)
        .map(function (t) { return { a: t.a, b: t.b, domain: t.domain, note: t.note, enforced: true }; });

      var cnt = { high: 0, mid: 0, low: 0 };
      segs.forEach(function (g) { cnt[g.confidence] = (cnt[g.confidence] || 0) + 1; });

      return {
        text: outText, register: REG_LABEL[reg], registerId: reg, detected: REG_LABEL[det], detectedId: det, auto: !req,
        registerConfidence: Math.round(Math.max(0, Math.min(1, detConf)) * 100) / 100,
        from: P.from, to: P.to, pair: P.key, pairLabel: pairLabel(P.key),
        segments: segs,
        situation: normSituation(data.situation, reg),
        terms: keptTerms,
        questions: normQuestions(data.questions),
        stats: { words: countWords(text), outWords: countWords(outText), segments: segs.length, high: cnt.high, mid: cnt.mid, low: cnt.low, tm: 0 },
        demo: false
      };
    });
  };
})();
