/* =====================================================================
   TENSO — s-grammar.js  (English grammar product, <html data-mode="grammar">)
   Ekranlar (mode 'grammar', qrup 'Tenso'):
     'grammar'     «Yoxla»            — redaktor, Yoxla, dil seçimi, altı xətli səhvlər, qeyd kartı
                                        (Düzəlt / Keç / ? / Bu qaydanı öyrən), Hamısını düzəlt, bal, CEFR
     'g-course'    «Qrammatika kursu» — A1–C1 səviyyə tabları, qruplar, vahid səhifəsi + tapşırıqlar
     'g-daily'     «Gündəlik yazı»    — səviyyəyə uyğun günün mövzusu, IELTS, Real həyat; seriya
     'g-notebook'  «Səhv dəftərim»    — ən çox təkrarlanan səhvlər + uyğun dərslər
     'g-history'   «Tarixçə»          — son 20 yoxlama
   Asılılıqlar: ai/grammar.js (NuanzaGrammar), ai/grammar-rules.js (NuanzaGrammarRules),
   data-grammar-*.js (NUANZA_GRAMMAR), data-prompts.js (NUANZA_PROMPTS).
   İstəyə bağlı: window.TensoLearn (s-tenso-learn.js), window.TensoExtra (s-tenso-extra.js).
   Store: 'tenso:lang', 'tenso:draft', 'tenso:history', 'tenso:level', 'tenso:unit:<id>',
          'tenso:course-tab', 'tenso:daily', 'tenso:daily-draft', 'tenso:daily-tab'
   CSS prefiksi: .g-  (rənglər yalnız app.css tokenlərindən)
   ===================================================================== */
(function () {
  'use strict';
  var W = window, D = document, App = W.App;
  if (!App || typeof App.register !== 'function') return;
  var h = App.h;

  /* ------------------------------------------------------------------
     0. HELPERS
     ------------------------------------------------------------------ */
  var LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];
  var LEVEL_AZ = { A1: 'Başlanğıc', A2: 'Elementar', B1: 'Orta', B2: 'Orta-yuxarı', C1: 'İrəli' };
  var SEV_AZ = { high: 'Vacib', mid: 'Səhv', low: 'Kiçik' };
  var GROUP = 'Tenso';

  function log(e) { try { console.error('[Tenso]', e); } catch (x) { /* ignore */ } }
  function sget(k, fb) { try { var v = App.store.get(k, fb); return v == null ? fb : v; } catch (e) { return fb; } }
  function sset(k, v) { try { App.store.set(k, v); } catch (e) { /* ignore */ } }
  function str(v) { return v == null ? '' : String(v); }
  function ic(name) { try { return App.iconEl(name); } catch (e) { return null; } }
  function toast(t, kind, o) { try { return App.toast(t, kind, o); } catch (e) { return null; } }
  function say(state, text, ms) { try { App.companion.set(state, text ? { say: text, ms: ms || 3000 } : { ms: ms || 1400 }); } catch (e) { /* ignore */ } }
  function G() { return W.NuanzaGrammar || null; }
  function R() { return W.NuanzaGrammarRules || null; }
  function TL(fn) { var t = W.TensoLearn; return t && typeof t[fn] === 'function' ? t : null; }
  function TX(fn) { var t = W.TensoExtra; return t && typeof t[fn] === 'function' ? t : null; }
  function hasScreen(id) { try { return App.screens().some(function (d) { return d && d.id === id; }); } catch (e) { return false; } }
  function words(t) { return (str(t).match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) || []).length; }
  function dkey(d) { d = d || new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function dayNo(d) { d = d || new Date(); return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5); }
  function myLevel() { var l = sget('tenso:level', ''); return LEVELS.indexOf(l) >= 0 ? l : ''; }
  function setLevel(l) { if (LEVELS.indexOf(l) >= 0) { sset('tenso:level', l); try { App.refreshNav(); } catch (e) { /* ignore */ } } }
  function typeAz(t) { var r = R(); return (r && r.TYPE_AZ && r.TYPE_AZ[t]) || t || 'Qrammatika'; }
  function units() {
    var g = G();
    if (g && typeof g.units === 'function') return g.units();
    var N = W.NUANZA_GRAMMAR; return N && Array.isArray(N.units) ? N.units.filter(function (u) { return u && u.id && u.title; }) : [];
  }
  function unitById(id) { var u = units(); for (var i = 0; i < u.length; i++) if (u[i].id === id) return u[i]; return null; }
  function lessonFor(issue) {
    var g = G(), u = null;
    try { u = g && g.lessonFor ? g.lessonFor(issue) : null; } catch (e) { log(e); }
    if (!u) { var t = TL('unitForRule'); try { var r = t ? t.unitForRule(issue.rule) : null; u = r && r.id ? r : (typeof r === 'string' ? unitById(r) : null); } catch (e) { /* ignore */ } }
    return u;
  }
  function openUnit(id) { App.go('g-course', { id: id }); }
  function sentenceAt(text, start, end) {
    var a = start, b = end;
    while (a > 0 && !/[.!?\n]/.test(text.charAt(a - 1))) a--;
    while (b < text.length && !/[.!?\n]/.test(text.charAt(b))) b++;
    return text.slice(a, Math.min(text.length, b + 1)).trim();
  }
  function addXP(n, reason, el) { var t = TX('addXP'); if (!t) return null; try { return t.addXP(n, reason, el ? { el: el } : {}); } catch (e) { log(e); return null; } }
  function copyText(t) {
    function done() { toast('Kopyalandı', 'ok', { sub: 'Düzəldilmiş mətn buferdədir', icon: 'copy' }); }
    try {
      if (W.navigator.clipboard && W.navigator.clipboard.writeText) { W.navigator.clipboard.writeText(t).then(done, fallback); return; }
    } catch (e) { /* ignore */ }
    fallback();
    function fallback() {
      try { var ta = h('textarea', { style: 'position:fixed;opacity:0;left:0;top:0' }); ta.value = t; D.body.appendChild(ta); ta.select(); D.execCommand('copy'); ta.remove(); done(); }
      catch (e) { toast('Kopyalanmadı', 'warn'); }
    }
  }
  function mountTenso(slot, state) {
    if (!slot || !W.Nuanza || typeof W.Nuanza.mount !== 'function') return null;
    try { var m = W.Nuanza.mount(slot, { size: 'mini', who: 'tenso' }); if (m && m.set && state) m.set(state, {}); return m; } catch (e) { log(e); return null; }
  }
  var mounts = [];
  function cleanup() { mounts.forEach(function (m) { try { if (m && m.destroy) m.destroy(); } catch (e) { /* ignore */ } }); mounts = []; }
  function heroArt(state) { var art = h('span', { class: 'g-art', 'aria-hidden': 'true' }); var m = mountTenso(art, state || 'wave'); if (m) mounts.push(m); return art; }
  function pageHead(eyebrow, titleHtml, sub, state, extra) {
    return h('div', { class: 'page-h' }, h('div', { class: 'g-hero' }, heroArt(state), h('div', { class: 'g-hero-tx' },
      h('span', { class: 'eyebrow', text: eyebrow }), h('h1', { html: titleHtml }), sub ? h('p', { text: sub }) : null)), extra || null);
  }

  /* history (last 20 checks) */
  function pushHistory(text, res, kind) {
    var list = sget('tenso:history', []); if (!Array.isArray(list)) list = [];
    list.unshift({ id: 'h' + Date.now().toString(36), at: Date.now(), kind: kind || 'check', lang: res.lang, score: res.score, n: res.issues.length,
      level: res.level && res.level.cefr ? res.level.cefr : '', src: res.source, text: str(text).slice(0, 4000),
      top: res.issues.slice(0, 3).map(function (x) { return x.ruleTitle || typeAz(x.type); }) });
    sset('tenso:history', list.slice(0, 20));
  }
  function feedLearn(text, issues, lang) {
    var t = TL('addMistake');
    if (!t) return;
    issues.forEach(function (x) {
      if (x.manual || !x.fix || x.status === 'skipped') return;
      try { t.addMistake({ wrong: x.wrong, fix: x.fix, rule: x.rule, ruleTitle: x.ruleTitle, why: x.why, sentence: sentenceAt(text, x.start, x.end), lang: lang, src: 'checker' }); } catch (e) { log(e); }
    });
  }

  /* ------------------------------------------------------------------
     1. CSS
     ------------------------------------------------------------------ */
  var CSS = [
    '.g-page{--g-hi:var(--sev-high);--g-mid:var(--sev-mid);--g-low:var(--sev-low)}',
    '.page-h > .g-hero{display:flex;align-items:center;gap:12px;min-width:0}',
    '.g-hero-tx{display:grid;gap:6px;min-width:0}',
    '.g-art{display:block;flex:none;width:84px;min-height:84px;margin:-6px -4px -6px -8px}',
    '.g-top{display:flex;flex-wrap:wrap;gap:12px;align-items:stretch}',
    '.g-top > *{flex:1 1 260px;min-width:0}',
    '.g-top .g-due{display:flex;align-items:center;gap:12px;width:100%;text-align:left}',
    '.g-due b{font-size:var(--fs-base)}',
    '.g-due small{display:block;color:var(--soft);font-size:var(--fs-sm)}',
    '.g-ed{display:grid;gap:12px}',
    '.g-ed .textarea{min-height:168px;font-size:1rem;line-height:1.65}',
    '.g-bar{display:flex;flex-wrap:wrap;align-items:center;gap:8px;min-width:0}',
    '.g-sp{flex:1}',
    '.g-count{font-size:var(--fs-sm);color:var(--soft);font-variant-numeric:tabular-nums}',
    '.g-note{display:flex;gap:10px;align-items:flex-start;padding:10px 12px;border-radius:var(--r-md);background:var(--surface2);color:var(--soft);font-size:var(--fs-sm);line-height:1.45}',
    '.g-note svg{flex:none;width:18px;height:18px;color:var(--sev-high)}',
    '.g-sum{display:flex;flex-wrap:wrap;gap:16px;align-items:center}',
    '.g-sum .ring.low{--ring-c:var(--sev-high)}',
    '.g-sum-tx{flex:1 1 220px;min-width:0;display:grid;gap:6px}',
    '.g-sum-tx h2{font-size:var(--fs-lg)}',
    '.g-lvl{display:flex;flex-wrap:wrap;align-items:baseline;gap:6px 8px;font-size:var(--fs-sm);color:var(--soft)}',
    '.g-lvl b{display:inline-grid;place-items:center;min-width:34px;height:24px;padding:0 8px;border-radius:var(--r-pill);background:var(--fir-t);color:var(--firuze);font-weight:700}',
    '.g-sevs{display:flex;flex-wrap:wrap;gap:6px}',
    '.g-sev{display:inline-flex;align-items:center;gap:6px;height:24px;padding:0 10px;border-radius:var(--r-pill);font-size:var(--fs-xs);font-weight:700;background:var(--surface2);color:var(--soft)}',
    '.g-sev::before{content:"";width:8px;height:8px;border-radius:50%;background:currentColor}',
    '.g-sev.high{background:var(--sev-high-t);color:var(--sev-high)}',
    '.g-sev.mid{background:var(--sev-mid-t);color:var(--sev-mid)}',
    '.g-sev.low{color:var(--sev-low)}',
    '.g-sev.ok{background:var(--ok-t);color:var(--ok)}',
    '.g-text{font-size:1rem;line-height:1.9;white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word}',
    '.g-mk{padding:1px 1px;border:0;border-radius:4px;background:transparent;color:inherit;font:inherit;line-height:inherit;cursor:pointer;text-decoration-line:underline;text-decoration-thickness:2px;text-underline-offset:4px}',
    '.g-mk.high{text-decoration-color:var(--sev-high);background:var(--sev-high-t)}',
    '.g-mk.mid{text-decoration-color:var(--sev-mid);background:var(--sev-mid-t)}',
    '.g-mk.low{text-decoration-color:var(--sev-low);text-decoration-style:dotted}',
    '.g-mk.on{outline:2px solid var(--focus);outline-offset:1px}',
    '.g-mk.fixed{cursor:default;text-decoration-color:var(--ok);text-decoration-style:solid;background:var(--ok-t);color:var(--ok);font-weight:600}',
    '.g-mk.skipped{text-decoration:none;background:transparent;cursor:pointer}',
    '.g-iss-list{display:grid;gap:10px}',
    '.g-iss{position:relative;display:grid;gap:8px;padding:14px 14px 14px 16px;border:1px solid var(--line);border-radius:var(--r-lg);background:var(--surface);min-width:0}',
    '.g-iss::before{content:"";position:absolute;left:0;top:12px;bottom:12px;width:3px;border-radius:0 3px 3px 0;background:var(--sev-low)}',
    '.g-iss.high::before{background:var(--sev-high)}',
    '.g-iss.mid::before{background:var(--sev-mid)}',
    '.g-iss.on{border-color:var(--focus);box-shadow:0 0 0 3px var(--fir-t)}',
    '.g-iss.fixed{background:var(--ok-t);border-color:transparent}',
    '.g-iss.fixed::before{background:var(--ok)}',
    '.g-iss.skipped{opacity:.6}',
    '.g-iss-h{display:flex;flex-wrap:wrap;align-items:center;gap:6px}',
    '.g-iss-h .badge{height:22px}',
    '.g-fix{display:flex;flex-wrap:wrap;align-items:baseline;gap:6px 10px;font-size:1.0625rem;min-width:0;overflow-wrap:anywhere}',
    '.g-bad{color:var(--soft);text-decoration:line-through;text-decoration-color:var(--sev-high);text-decoration-thickness:2px}',
    '.g-good{color:var(--ok);font-weight:700}',
    '.g-arrow{color:var(--faint)}',
    '.g-why{color:var(--ink);line-height:1.55}',
    '.g-acts{display:flex;flex-wrap:wrap;gap:6px}',
    '.g-q{min-width:34px;padding:0 10px;font-weight:800}',
    '.g-empty{display:grid;justify-items:center;gap:8px;padding:12px 4px;text-align:center}',
    '.g-empty b{font-size:var(--fs-lg)}',
    /* course */
    '.g-lvtabs{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;padding:2px}',
    '.g-lvtabs::-webkit-scrollbar{display:none}',
    '.g-lvtab{flex:1 0 64px;display:grid;justify-items:center;gap:2px;min-height:58px;padding:8px 6px;border:1px solid var(--line);border-radius:var(--r-md);background:var(--surface);color:var(--soft);font:inherit;cursor:pointer}',
    '.g-lvtab b{font-family:var(--f-display);font-size:1.0625rem;color:var(--ink)}',
    '.g-lvtab small{font-size:.6875rem}',
    '.g-lvtab[aria-selected="true"]{border-color:var(--firuze);background:var(--fir-t);color:var(--firuze)}',
    '.g-lvtab[aria-selected="true"] b{color:var(--firuze)}',
    '.g-lvtab .g-me{font-size:.625rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--zafaran-ink)}',
    '.g-mylvl{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px}',
    '.g-grp-h{margin-top:6px;font-size:var(--fs-md)}',
    '.g-unit .tx small{display:block}',
    '.g-prog{flex:none;display:inline-grid;place-items:center;min-width:42px;height:24px;padding:0 8px;border-radius:var(--r-pill);background:var(--surface2);color:var(--soft);font-size:var(--fs-xs);font-weight:700;font-variant-numeric:tabular-nums}',
    '.g-prog.part{background:var(--zaf-t);color:var(--zafaran-ink)}',
    '.g-prog.done{background:var(--ok-t);color:var(--ok)}',
    '.g-sec{display:grid;gap:10px}',
    '.g-sec h2{font-size:var(--fs-lg)}',
    '.g-ul{margin:0;padding-left:1.2em;display:grid;gap:6px;line-height:1.55}',
    '.g-form{display:grid;gap:6px}',
    '.g-form code{display:block;padding:8px 10px;border-radius:var(--r-sm);background:var(--surface2);font-family:var(--f-mono);font-size:var(--fs-sm);white-space:normal;overflow-wrap:anywhere}',
    '.g-trap{border-color:color-mix(in srgb,var(--sev-high) 40%,var(--line));background:linear-gradient(var(--sev-high-t),var(--sev-high-t)),var(--surface)}',
    '.g-trap h2{color:var(--sev-high)}',
    '.g-ex{display:grid;gap:2px;padding:10px 0}',
    '.g-ex + .g-ex{border-top:1px solid var(--line)}',
    '.g-ex b{font-weight:600;overflow-wrap:anywhere}',
    '.g-ex span{color:var(--soft);font-size:var(--fs-sm)}',
    '.g-wr{display:grid;gap:4px;padding:10px 0}',
    '.g-wr + .g-wr{border-top:1px solid var(--line)}',
    '.g-wr small{color:var(--soft);line-height:1.45}',
    '.g-task{display:grid;gap:8px;padding:12px 0}',
    '.g-task + .g-task{border-top:1px solid var(--line)}',
    '.g-task-q{font-weight:600;line-height:1.5;overflow-wrap:anywhere}',
    '.g-task-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}',
    '.g-task-row .input{flex:1 1 180px;min-width:0}',
    '.g-opts{display:flex;flex-wrap:wrap;gap:8px}',
    '.g-opt{min-height:40px}',
    '.g-opt[aria-pressed="true"]{border-color:var(--firuze)}',
    '.g-opt.ok{background:var(--ok-t);border-color:var(--ok);color:var(--ok)}',
    '.g-opt.no{border-color:var(--sev-high);color:var(--sev-high)}',
    '.g-res{font-size:var(--fs-sm);line-height:1.45}',
    '.g-res.ok{color:var(--ok);font-weight:600}',
    '.g-res.no{color:var(--sev-high)}',
    '.g-task.done .g-task-q::after{content:" ✓";color:var(--ok)}',
    /* daily */
    '.g-prompt{display:grid;gap:10px}',
    '.g-prompt h2{font-size:var(--fs-lg);line-height:1.35;overflow-wrap:anywhere}',
    '.g-meta{display:flex;flex-wrap:wrap;gap:6px}',
    '.g-tip{display:flex;gap:8px;align-items:flex-start;font-size:var(--fs-sm);color:var(--soft);line-height:1.45}',
    '.g-tip svg{flex:none;width:16px;height:16px;color:var(--zafaran-ink);margin-top:2px}',
    '.g-wbar{position:relative;height:6px;border-radius:var(--r-pill);background:var(--surface2);overflow:hidden}',
    '.g-wbar i{position:absolute;left:0;top:0;bottom:0;border-radius:inherit;background:var(--firuze);transition:width var(--t-base)}',
    '.g-wbar i.ok{background:var(--ok)}',
    '.g-streak{display:flex;align-items:center;gap:12px}',
    '.g-streak b{font-family:var(--f-display);font-size:1.5rem;color:var(--firuze)}',
    /* notebook + history */
    '.g-top3{display:grid;gap:10px;grid-template-columns:repeat(auto-fit,minmax(200px,1fr))}',
    '.g-topc{display:grid;gap:6px;align-content:start}',
    '.g-topc .n{font-family:var(--f-display);font-size:1.75rem;font-weight:600;color:var(--sev-high);line-height:1}',
    '.g-topc h3{font-size:var(--fs-base)}',
    '.g-exs{display:grid;gap:4px;font-size:var(--fs-sm)}',
    '.g-hrow .tx b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.g-score{flex:none;display:inline-grid;place-items:center;width:42px;height:42px;border-radius:50%;background:var(--surface2);font-family:var(--f-display);font-weight:600;font-size:var(--fs-sm)}',
    '.g-score.good{background:var(--ok-t);color:var(--ok)}',
    '.g-score.mid{background:var(--sev-mid-t);color:var(--sev-mid)}',
    '.g-score.bad{background:var(--sev-high-t);color:var(--sev-high)}'
  ].join('\n');
  function css() { try { App.css('g-grammar', CSS); } catch (e) { /* ignore */ } }

  /* ------------------------------------------------------------------
     2. «YOXLA» — main checker screen
     ------------------------------------------------------------------ */
  var SAMPLE = 'Yesterday I go to university and I am agree with my teacher that the education is very important for the people. I married with him in the last year.';
  var S = null; /* checker state */
  var offeredTest = false;

  function renderCheck(el, params) {
    css(); cleanup();
    params = params || {};
    var lang = sget('tenso:lang', 'en'); if (['en', 'az', 'auto'].indexOf(lang) < 0) lang = 'en';
    S = { lang: lang, res: null, issues: [], text: '', sel: -1, busy: false, fixedXP: 0 };
    var draft = params.text != null ? str(params.text) : str(sget('tenso:draft', ''));

    var ta = h('textarea', {
      class: 'textarea', id: 'g-input', rows: '7', spellcheck: 'false', autocapitalize: 'sentences',
      placeholder: 'İngiliscə yazın — məsələn, bir neçə cümlə özünüz haqqında…', 'aria-label': 'Yoxlanacaq mətn', maxlength: '20000'
    });
    ta.value = draft;
    var count = h('span', { class: 'g-count', 'aria-live': 'polite' });
    function upd() { var n = words(ta.value); count.textContent = n + ' söz · ' + ta.value.length + ' simvol'; }
    ta.addEventListener('input', function () { upd(); sset('tenso:draft', ta.value.slice(0, 20000)); if (S.res) { S.stale = true; } });
    ta.addEventListener('keydown', function (e) { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); run(); } });
    upd();

    var seg = h('div', { class: 'seg sm', role: 'group', 'aria-label': 'Mətnin dili' }, [['en', 'İngilis'], ['az', 'Azərbaycan'], ['auto', 'Avto']].map(function (p) {
      return h('button', { type: 'button', 'data-l': p[0], 'aria-pressed': String(S.lang === p[0]), onclick: function () {
        S.lang = p[0]; sset('tenso:lang', p[0]);
        Array.prototype.forEach.call(seg.children, function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-l') === p[0])); });
        ta.setAttribute('placeholder', p[0] === 'az' ? 'Azərbaycanca mətni yapışdırın — orfoqrafiya, türk formaları, durğu işarələri…' : 'İngiliscə yazın — məsələn, bir neçə cümlə özünüz haqqında…');
      } }, p[1]);
    }));
    var btn = h('button', { class: 'btn btn-primary', type: 'button', onclick: function () { run(); } }, ic('check'), 'Yoxla');
    var bar = h('div', { class: 'g-bar' },
      seg, h('span', { class: 'g-sp' }), count);
    var bar2 = h('div', { class: 'g-bar' },
      h('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: function () { ta.value = SAMPLE; upd(); sset('tenso:draft', SAMPLE); ta.focus(); } }, ic('sparkle'), 'Nümunə'),
      h('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: function () { ta.value = ''; upd(); sset('tenso:draft', ''); out.textContent = ''; S.res = null; ta.focus(); } }, ic('x'), 'Təmizlə'),
      h('span', { class: 'g-sp' }), btn);

    var top = h('div', { class: 'g-top' });
    var out = h('div', { class: 'stack-lg', 'aria-live': 'polite' });
    el.appendChild(h('div', { class: 'page g-page' },
      pageHead('Tenso · Qrammatika', 'Yaz, <em>yoxla</em>, öyrən', 'İngiliscə yazın — səhvləri tapım, hər birinin qaydasını sadə dildə izah edim.', 'wave'),
      top,
      h('section', { class: 'card g-ed', 'aria-label': 'Redaktor' }, bar, ta, bar2),
      out));
    S.ta = ta; S.out = out; S.btn = btn; S.upd = upd;

    /* streak card + due cards */
    var tx = TX('renderStreakCard');
    if (tx) { var sh = h('div', { class: 'g-streak-host' }); top.appendChild(sh); try { tx.renderStreakCard(sh, { compact: true }); } catch (e) { log(e); sh.remove(); } }
    var tl = TL('dueCount');
    if (tl) {
      var n = 0; try { n = Number(tl.dueCount()) || 0; } catch (e) { log(e); }
      var target = hasScreen('g-cards') ? 'g-cards' : hasScreen('g-practice') ? 'g-practice' : null;
      if (target) top.appendChild(h('button', { class: 'card clickable g-due', type: 'button', onclick: function () { App.go(target); } },
        h('span', { class: 'ic gold', html: App.icon('cards') }),
        h('span', { class: 'grow' }, h('b', { text: n ? n + ' kart təkrar gözləyir' : 'Bu gün təkrar yoxdur' }), h('small', { text: n ? 'Öz səhvlərinizdən yaranan kartlar — 2 dəqiqəlik təkrar' : 'Səhvləriniz kart olub bura düşəcək' })),
        h('span', { html: App.icon('chevron') })));
    }
    if (!top.children.length) top.remove();

    if (!offeredTest) {
      offeredTest = true;
      var t2 = TL('maybeOfferTest');
      if (t2) setTimeout(function () { try { if (App.current() === 'grammar') t2.maybeOfferTest(); } catch (e) { log(e); } }, 1400);
    }
    if (params.text != null && draft.trim()) setTimeout(run, 50);
  }

  function run() {
    var s = S; if (!s || s.busy) return;
    var text = s.ta.value;
    if (!text.trim()) { toast('Əvvəlcə mətn yazın', 'info', { sub: 'Bir-iki cümlə kifayətdir' }); s.ta.focus(); say('point', 'Bir cümlə yaz — yoxlayaq!', 2200); return; }
    var g = G();
    if (!g) { toast('Yoxlayıcı yüklənmədi', 'warn', { sub: 'Səhifəni yeniləyin' }); return; }
    s.busy = true; s.btn.setAttribute('aria-busy', 'true'); s.btn.disabled = true;
    say('read', 'Oxuyuram…', 1800);
    g.check(text, { lang: s.lang }).then(function (res) {
      if (S !== s) return;
      s.busy = false; s.btn.removeAttribute('aria-busy'); s.btn.disabled = false;
      s.text = text; s.res = res; s.sel = -1; s.stale = false;
      s.issues = res.issues.map(function (x, i) { var c = {}; for (var k in x) c[k] = x[k]; c.i = i; c.status = 'open'; return c; });
      try { g.record(res.issues); } catch (e) { log(e); }
      pushHistory(text, res, 'check');
      feedLearn(text, s.issues, res.lang);
      if (words(text) >= 5) addXP(5, 'Yoxlama', s.btn);
      paint();
      var n = res.issues.length;
      if (!n) say('celebrate', 'Səhv tapmadım — əla yazmısan!', 2800);
      else say(res.score >= 80 ? 'success' : 'point', n + ' qeyd tapdım. Hər birinə toxun — qaydasını izah edirəm.', 3000);
    }, function (e) {
      log(e);
      if (S !== s) return;
      s.busy = false; s.btn.removeAttribute('aria-busy'); s.btn.disabled = false;
      toast('Yoxlama alınmadı', 'warn', { sub: 'Bir az sonra yenidən cəhd edin' });
    });
  }

  function openIssues() { return S.issues.filter(function (x) { return x.status === 'open'; }); }
  function currentCorrected() {
    var t = S.ta.value, list = S.stale ? [] : openIssues().filter(function (x) { return !x.manual && x.fix; });
    list.slice().sort(function (a, b) { return b.start - a.start; }).forEach(function (x) { t = t.slice(0, x.start) + x.fix + t.slice(x.end); });
    return t;
  }
  function applyFix(x, quiet) {
    if (!x || x.status !== 'open' || x.manual || !x.fix) return false;
    var t = S.ta.value;
    if (t.slice(x.start, x.end) !== x.wrong) { if (!quiet) toast('Mətn dəyişib', 'info', { sub: 'Yenidən yoxlayın' }); return false; }
    var e0 = x.end, delta = x.fix.length - (x.end - x.start);
    S.ta.value = t.slice(0, x.start) + x.fix + t.slice(x.end);
    x.status = 'fixed'; x.end = x.start + x.fix.length;
    S.issues.forEach(function (y) { if (y !== x && y.start >= e0) { y.start += delta; y.end += delta; } });
    S.text = S.ta.value; sset('tenso:draft', S.ta.value); S.upd();
    return true;
  }
  function paint() {
    var s = S, res = s.res, out = s.out;
    out.textContent = '';
    if (!res) return;
    var issues = s.issues, open = openIssues(), fixed = issues.filter(function (x) { return x.status === 'fixed'; }).length;
    var cnt = { high: 0, mid: 0, low: 0 }; open.forEach(function (x) { cnt[x.sev] = (cnt[x.sev] || 0) + 1; });

    if (res.offline) out.appendChild(h('div', { class: 'g-note', role: 'status' }, ic('info'), h('span', null, h('b', { text: 'Oflayn yoxlama. ' }), res.reasonText || 'Yalnız yerli qaydalar işlədi — bəzi səhvlər görünməyə bilər.')));

    /* summary */
    var score = fixed && !open.length ? Math.max(res.score, 96) : res.score;
    var ringEl = null; try { ringEl = App.ring(score, 'bal', null, { size: 'sm' }); } catch (e) { ringEl = h('b', { text: String(score) }); }
    var lv = res.lang === 'en' && res.level && res.level.cefr ? res.level : null;
    var copyBtn = h('button', { class: 'btn btn-sm', type: 'button', onclick: function () { copyText(currentCorrected()); } }, ic('copy'), 'Düzəldilmişi kopyala');
    var allBtn = h('button', { class: 'btn btn-primary btn-sm', type: 'button', disabled: !open.some(function (x) { return !x.manual && x.fix; }), onclick: function (e) {
      var n = 0;
      openIssues().slice().sort(function (a, b) { return b.start - a.start; }).forEach(function (x) { if (applyFix(x, true)) n++; });
      if (n) { addXP(Math.min(10, 2 + n), 'Düzəlişlər', e.currentTarget); toast(n + ' düzəliş tətbiq olundu', 'ok', { sub: 'Mətn redaktorda yeniləndi', icon: 'check' }); say('celebrate', 'Hazırdır! İndi düzgün variantı bir də oxu — yadda qalsın.', 3000); }
      paint();
    } }, ic('wand'), 'Hamısını düzəlt');
    out.appendChild(h('section', { class: 'card g-sum', 'aria-label': 'Nəticə' },
      ringEl,
      h('div', { class: 'g-sum-tx' },
        h('h2', { text: !issues.length ? 'Səhv tapılmadı' : open.length ? open.length + ' qeyd' + (fixed ? ' · ' + fixed + ' düzəldildi' : '') : 'Hamısı düzəldildi!' }),
        lv ? h('div', { class: 'g-lvl' }, h('span', { text: 'Təxmini səviyyə' }), h('b', { text: lv.cefr }), lv.why ? h('span', { text: lv.why }) : null) : (res.lang === 'az' ? h('div', { class: 'g-lvl' }, h('span', { text: 'Azərbaycan dili yoxlaması' })) : null),
        h('p', { class: 'muted small', text: res.summary || '' }),
        h('div', { class: 'g-sevs' },
          cnt.high ? h('span', { class: 'g-sev high', text: cnt.high + ' vacib' }) : null,
          cnt.mid ? h('span', { class: 'g-sev mid', text: cnt.mid + ' səhv' }) : null,
          cnt.low ? h('span', { class: 'g-sev low', text: cnt.low + ' kiçik' }) : null,
          fixed ? h('span', { class: 'g-sev ok', text: fixed + ' düzəldildi' }) : null),
        h('div', { class: 'g-acts' }, allBtn, copyBtn))));

    if (!issues.length) {
      out.appendChild(h('div', { class: 'card g-empty' }, h('b', { text: 'Əla!' }), h('p', { class: 'muted', text: res.lang === 'en' ? 'Bu mətndə səhv görmədim. Daha uzun mətn yazıb yenə yoxlaya bilərsiniz — ya da «Gündəlik yazı» mövzusunu sınayın.' : 'Mətn səliqəlidir.' }),
        hasScreen('g-daily') && res.lang === 'en' ? h('button', { class: 'btn btn-sm', type: 'button', onclick: function () { App.go('g-daily'); } }, ic('edit'), 'Gündəlik yazı') : null));
      return;
    }

    /* marked text */
    var tv = h('div', { class: 'g-text', lang: res.lang === 'az' ? 'az' : 'en' });
    var t = s.stale ? s.text : s.ta.value, pos = 0;
    issues.slice().sort(function (a, b) { return a.start - b.start; }).forEach(function (x) {
      if (x.start < pos || x.end > t.length) return;
      tv.appendChild(D.createTextNode(t.slice(pos, x.start)));
      var cls = 'g-mk ' + (x.status === 'fixed' ? 'fixed' : x.status === 'skipped' ? 'skipped' : x.sev) + (s.sel === x.i ? ' on' : '');
      var label = x.status === 'fixed' ? 'Düzəldildi: ' + x.fix : 'Səhv: ' + x.wrong + (x.fix ? ' → ' + x.fix : '');
      tv.appendChild(h('button', { class: cls, type: 'button', 'aria-label': label, onclick: function () { select(x.i, true); } }, t.slice(x.start, x.end)));
      pos = x.end;
    });
    tv.appendChild(D.createTextNode(t.slice(pos)));
    out.appendChild(h('section', { class: 'card stack', 'aria-label': 'Qeydlər mətndə' },
      h('div', { class: 'card-h' }, h('div', null, h('h2', { text: 'Mətndə' }), h('small', { class: 'muted', text: 'Altından xətt çəkilmiş hissəyə toxunun' }))),
      tv,
      s.stale ? h('div', { class: 'g-note' }, ic('refresh'), h('span', { text: 'Mətni dəyişdiniz — dəqiq nəticə üçün yenidən yoxlayın.' })) : null));

    /* issue cards */
    var list = h('div', { class: 'g-iss-list' });
    issues.forEach(function (x) { list.appendChild(issueCard(x)); });
    out.appendChild(h('section', { class: 'stack', 'aria-label': 'Qeydlər' }, h('div', { class: 'sec-h' }, h('h2', { text: 'Qeydlər' })), list));
  }
  function select(i, scroll) {
    S.sel = i; paint();
    if (scroll) { var c = S.out.querySelector('.g-iss[data-i="' + i + '"]'); if (c) { try { c.scrollIntoView({ block: 'center', behavior: App.reducedMotion() ? 'auto' : 'smooth' }); } catch (e) { /* ignore */ } } }
  }
  function issueCard(x) {
    var unit = x.status === 'open' || x.status === 'fixed' ? lessonFor(x) : null;
    var cls = 'g-iss ' + (x.status === 'fixed' ? 'fixed' : x.status === 'skipped' ? 'skipped' : x.sev) + (S.sel === x.i ? ' on' : '');
    var acts = h('div', { class: 'g-acts' });
    if (x.status === 'open') {
      if (!x.manual && x.fix) acts.appendChild(h('button', { class: 'btn btn-primary btn-sm', type: 'button', onclick: function (e) {
        if (applyFix(x)) { S.fixedXP++; if (S.fixedXP <= 5) addXP(1, 'Düzəliş', e.currentTarget); }
        if (!openIssues().length) { say('celebrate', 'Hamısı düzəldi! Afərin.', 2600); }
        paint();
      } }, ic('check'), 'Düzəlt'));
      acts.appendChild(h('button', { class: 'btn btn-sm', type: 'button', onclick: function () { x.status = 'skipped'; paint(); } }, 'Keç'));
    } else if (x.status === 'skipped') {
      acts.appendChild(h('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: function () { x.status = 'open'; paint(); } }, ic('refresh'), 'Geri qaytar'));
    }
    var tx = TX('ask');
    if (tx && x.status !== 'skipped') acts.appendChild(h('button', { class: 'btn btn-sm g-q', type: 'button', 'aria-label': 'Tensodan soruş: niyə belədir?', title: 'Tensodan soruş', onclick: function () {
      try { tx.ask({ sentence: sentenceAt(S.ta.value, x.start, x.end), wrong: x.wrong, fix: x.fix, rule: x.rule, ruleTitle: x.ruleTitle, why: x.why, lang: S.res && S.res.lang }); } catch (e) { log(e); }
    } }, '?'));
    if (unit) acts.appendChild(h('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: function () { openUnit(unit.id); } }, ic('book'), 'Bu qaydanı öyrən'));
    return h('article', { class: cls, 'data-i': String(x.i), onclick: function (e) { if (!e.target.closest('button') && S.sel !== x.i) select(x.i, false); } },
      h('div', { class: 'g-iss-h' },
        x.status === 'fixed' ? h('span', { class: 'g-sev ok', text: 'Düzəldildi' }) : h('span', { class: 'g-sev ' + x.sev, text: SEV_AZ[x.sev] || 'Səhv' }),
        h('span', { class: 'badge', text: typeAz(x.type) }),
        x.ruleTitle ? h('span', { class: 'small muted', text: x.ruleTitle }) : null),
      h('div', { class: 'g-fix' },
        h('span', { class: 'g-bad', text: x.wrong }),
        x.fix ? h('span', { class: 'g-arrow', 'aria-hidden': 'true', text: '→' }) : null,
        x.fix ? h('span', { class: 'g-good', text: x.fix }) : h('span', { class: 'small muted', text: 'özünüz düzəldin' })),
      x.why && x.status !== 'skipped' ? h('p', { class: 'g-why', text: x.why }) : null,
      acts);
  }

  /* ------------------------------------------------------------------
     3. QRAMMATİKA KURSU
     ------------------------------------------------------------------ */
  function norm(s) {
    return str(s).toLowerCase().replace(/[’‘`´]/g, "'").replace(/[“”]/g, '"').replace(/[.,!?;:"]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function unitProg(u) {
    var p = sget('tenso:unit:' + u.id, null);
    var total = (u.exercise || []).length;
    var done = p && Array.isArray(p.done) ? p.done.length : 0;
    return { done: Math.min(done, total), total: total, pct: total ? Math.round(100 * Math.min(done, total) / total) : 0, raw: p };
  }
  function saveProg(u, doneIdx) {
    var p = sget('tenso:unit:' + u.id, null) || {};
    var set = Array.isArray(p.done) ? p.done.slice() : [];
    if (set.indexOf(doneIdx) < 0) set.push(doneIdx);
    var total = (u.exercise || []).length, pct = total ? Math.round(100 * set.length / total) : 0;
    sset('tenso:unit:' + u.id, { done: set, pct: pct, at: Date.now() });
    var t = TL('recordUnitScore'); if (t) { try { t.recordUnitScore(u.id, pct); } catch (e) { log(e); } }
    return pct;
  }
  function renderCourse(el, params) {
    css(); cleanup();
    params = params || {};
    if (params.id && unitById(params.id)) return renderUnit(el, unitById(params.id));
    var all = units();
    var byLvl = {}; LEVELS.forEach(function (l) { byLvl[l] = []; });
    all.forEach(function (u) { if (byLvl[u.level]) byLvl[u.level].push(u); });
    var me = myLevel();
    var tab = params.level || sget('tenso:course-tab', '') || me;
    if (!byLvl[tab] || (!byLvl[tab].length && !params.level)) tab = me && byLvl[me].length ? me : (LEVELS.filter(function (l) { return byLvl[l].length; })[0] || 'A1');

    var tabs = h('div', { class: 'g-lvtabs', role: 'tablist', 'aria-label': 'Səviyyələr' });
    var body = h('div', { class: 'stack-lg', role: 'tabpanel' });
    function paintTabs() {
      tabs.textContent = '';
      LEVELS.forEach(function (l) {
        var list = byLvl[l], done = list.filter(function (u) { var p = unitProg(u); return p.total && p.done >= p.total; }).length;
        tabs.appendChild(h('button', { class: 'g-lvtab', type: 'button', role: 'tab', 'aria-selected': String(l === tab), onclick: function () { tab = l; sset('tenso:course-tab', l); paintTabs(); paintBody(); } },
          h('b', { text: l }), h('small', { text: list.length ? done + '/' + list.length + ' dərs' : 'tezliklə' }), l === me ? h('span', { class: 'g-me', text: 'mənim' }) : null));
      });
    }
    function paintBody() {
      body.textContent = '';
      var list = byLvl[tab];
      body.appendChild(h('p', { class: 'muted', text: tab + ' · ' + LEVEL_AZ[tab] + (list.length ? ' — ' + list.length + ' dərs' : '') }));
      if (!list.length) {
        body.appendChild(h('div', { class: 'card g-empty' }, h('b', { text: 'Bu səviyyənin dərsləri hazırlanır' }), h('p', { class: 'muted', text: 'Hələlik digər səviyyələrə baxın və ya «Yoxla» ekranında yazdıqlarınızı yoxlayın.' })));
        return;
      }
      var groups = {}, gord = [];
      list.forEach(function (u) { var g = u.group || 'Digər'; if (!groups[g]) { groups[g] = []; gord.push(g); } groups[g].push(u); });
      gord.forEach(function (g) {
        body.appendChild(h('section', { class: 'stack-sm' },
          h('h2', { class: 'g-grp-h', text: g }),
          h('div', { class: 'card list' }, groups[g].map(function (u) {
            var p = unitProg(u);
            return h('button', { class: 'list-row g-unit', type: 'button', onclick: function () { openUnit(u.id); } },
              h('span', { class: 'tx' }, h('b', { text: u.title }), h('small', { text: u.az || '' })),
              h('span', { class: 'g-prog' + (p.total && p.done >= p.total ? ' done' : p.done ? ' part' : ''), text: p.total ? (p.done >= p.total ? '✓' : p.done + '/' + p.total) : '—' }),
              h('span', { class: 'chev', html: App.icon('chevron') }));
          }))));
      });
    }
    var lvlSeg = h('div', { class: 'seg sm', role: 'group', 'aria-label': 'Mənim səviyyəm' }, LEVELS.map(function (l) {
      return h('button', { type: 'button', 'aria-pressed': String(l === me), onclick: function (e) {
        me = l; setLevel(l);
        Array.prototype.forEach.call(lvlSeg.children, function (b) { b.setAttribute('aria-pressed', String(b === e.currentTarget)); });
        tab = byLvl[l].length ? l : tab; paintTabs(); paintBody();
        toast('Səviyyəniz: ' + l, 'ok', { sub: LEVEL_AZ[l] + ' — gündəlik mövzular buna uyğun seçiləcək' });
      } }, l);
    }));
    el.appendChild(h('div', { class: 'page g-page' },
      pageHead('Tenso · Kurs', 'Qrammatika <em>kursu</em>', 'Hər dərs: nə vaxt işlənir, forma, qaydalar, azərbaycanlıların tələsi, nümunələr və məşq.', 'read'),
      h('section', { class: 'card g-mylvl' },
        h('b', { text: 'Mənim səviyyəm' }), lvlSeg,
        hasScreen('g-test') ? h('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: function () { App.go('g-test'); } }, ic('target'), me ? 'Testi yenidən keç' : 'Səviyyəni testlə tap') : null),
      tabs, body));
    paintTabs(); paintBody();
  }

  function renderUnit(el, u) {
    var prog = unitProg(u);
    var tasks = h('div', null);
    var progLbl = h('span', { class: 'g-prog' + (prog.total && prog.done >= prog.total ? ' done' : prog.done ? ' part' : '') });
    function paintProg() { var p = unitProg(u); progLbl.textContent = p.total ? p.done + '/' + p.total : '—'; progLbl.className = 'g-prog' + (p.total && p.done >= p.total ? ' done' : p.done ? ' part' : ''); }
    paintProg();
    var doneSet = (prog.raw && Array.isArray(prog.raw.done)) ? prog.raw.done : [];
    (u.exercise || []).forEach(function (ex, i) {
      var res = h('div', { class: 'g-res', 'aria-live': 'polite' });
      var row = h('div', { class: 'g-task' + (doneSet.indexOf(i) >= 0 ? ' done' : '') });
      var answers = (Array.isArray(ex.a) ? ex.a : [ex.a]).map(str);
      function ok(val) { var n = norm(val); return answers.some(function (a) { return norm(a) === n; }); }
      function win(target) {
        res.className = 'g-res ok'; res.textContent = 'Düzdür! ' + (answers[0] && ex.options ? '' : '«' + answers[0] + '»');
        if (!row.classList.contains('done')) {
          row.classList.add('done');
          var before = unitProg(u).pct, pct = saveProg(u, i); paintProg();
          if (pct >= 100 && before < 100) { addXP(10, 'Dərs: ' + u.title, target); toast('Dərs tamamlandı!', 'ok', { sub: u.title, icon: 'trophy' }); say('celebrate', 'Bu dərsi bitirdin — afərin!', 2600); try { App.fx.burstAt(target, 'stars'); } catch (e) { /* ignore */ } }
        }
      }
      function lose(val) {
        res.className = 'g-res no';
        res.textContent = 'Hələ yox. ' + (ex.hint ? 'İpucu: ' + ex.hint : '') ;
        var t = TL('addMistake');
        if (t && val) { try { t.addMistake({ wrong: str(ex.q).replace(/_{2,}/, val), fix: str(ex.q).replace(/_{2,}/, answers[0]), rule: (u.rule_ids || [])[0] || u.id, ruleTitle: u.title, why: ex.hint || '', unit: u.id, src: 'unit' }); } catch (e) { log(e); } }
      }
      row.appendChild(h('div', { class: 'g-task-q', text: (i + 1) + '. ' + str(ex.q) }));
      if (Array.isArray(ex.options) && ex.options.length) {
        var opts = h('div', { class: 'g-opts', role: 'group', 'aria-label': 'Variantlar' });
        ex.options.forEach(function (o) {
          opts.appendChild(h('button', { class: 'btn btn-sm g-opt', type: 'button', onclick: function (e) {
            var b = e.currentTarget;
            Array.prototype.forEach.call(opts.children, function (x) { x.classList.remove('no'); });
            if (ok(o)) { b.classList.add('ok'); win(b); } else { b.classList.add('no'); lose(o); }
          } }, str(o)));
        });
        row.appendChild(opts);
      } else {
        var inp = h('input', { class: 'input', type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', 'aria-label': 'Cavab: ' + str(ex.q), placeholder: 'Cavabınız' });
        var chk = h('button', { class: 'btn btn-sm', type: 'button', onclick: function (e) { if (!inp.value.trim()) { inp.focus(); return; } if (ok(inp.value)) win(e.currentTarget); else lose(inp.value.trim()); } }, 'Yoxla');
        var show = h('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: function () { res.className = 'g-res'; res.textContent = 'Cavab: ' + answers.join(' / '); } }, 'Cavabı göstər');
        inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); chk.click(); } });
        row.appendChild(h('div', { class: 'g-task-row' }, inp, chk, show));
      }
      row.appendChild(res);
      tasks.appendChild(row);
    });
    function sec(title, kids, cls) { return h('section', { class: 'card g-sec' + (cls ? ' ' + cls : '') }, h('h2', { text: title }), kids); }
    el.appendChild(h('div', { class: 'page g-page g-unitpage' },
      h('div', { class: 'row' }, h('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: function () { App.go('g-course', { level: u.level }); } }, ic('back'), 'Kurs · ' + u.level)),
      pageHead(u.level + ' · ' + (u.group || 'Qrammatika'), App.esc(u.title), u.az || '', 'point', h('div', { class: 'actions' }, progLbl)),
      u.when ? sec('Nə vaxt işlənir?', h('p', { text: u.when })) : null,
      (u.form || []).length ? sec('Forma', h('div', { class: 'g-form' }, u.form.map(function (f) { return h('code', { text: f }); }))) : null,
      (u.rules || []).length ? sec('Qaydalar', h('ul', { class: 'g-ul' }, u.rules.map(function (r) { return h('li', { text: r }); }))) : null,
      u.azTrap ? sec('Azərbaycanlıların tələsi', h('p', { text: u.azTrap }), 'g-trap') : null,
      (u.examples || []).length ? sec('Nümunələr', h('div', null, u.examples.map(function (e) { return h('div', { class: 'g-ex' }, h('b', { lang: 'en', text: e.en }), h('span', { text: e.az })); }))) : null,
      (u.wrong || []).length ? sec('Tipik səhvlər', h('div', null, u.wrong.map(function (w) {
        return h('div', { class: 'g-wr' }, h('div', { class: 'g-fix' }, h('span', { class: 'g-bad', text: w.bad }), h('span', { class: 'g-arrow', text: '→' }), h('span', { class: 'g-good', text: w.good })), w.why ? h('small', { text: w.why }) : null);
      }))) : null,
      (u.exercise || []).length ? sec('Məşq', tasks) : null,
      h('div', { class: 'row' },
        h('button', { class: 'btn', type: 'button', onclick: function () { App.go('grammar'); } }, ic('check'), 'Öz mətnimi yoxla'),
        nextUnitBtn(u))));
    try { W.scrollTo(0, 0); } catch (e) { /* ignore */ }
  }
  function nextUnitBtn(u) {
    var list = units().filter(function (x) { return x.level === u.level; }), i = list.indexOf(u);
    var nx = i >= 0 ? list[i + 1] : null;
    return nx ? h('button', { class: 'btn btn-primary', type: 'button', onclick: function () { openUnit(nx.id); } }, 'Növbəti: ' + nx.title, ic('arrow')) : null;
  }

  /* ------------------------------------------------------------------
     4. GÜNDƏLİK YAZI
     ------------------------------------------------------------------ */
  function prompts() { return W.NUANZA_PROMPTS || null; }
  function pool(tab) {
    var P = prompts(); if (!P) return [];
    if (tab === 'ielts') return Array.isArray(P.ielts) ? P.ielts : [];
    if (tab === 'cv') return Array.isArray(P.cv) ? P.cv : [];
    var l = myLevel() || 'B1', lv = P.levels || {};
    return Array.isArray(lv[l]) && lv[l].length ? lv[l] : (lv.B1 || []);
  }
  function todayPrompt(tab) {
    var list = pool(tab); if (!list.length) return null;
    var skip = sget('tenso:daily-skip', {}); if (!skip || skip.d !== dkey()) skip = { d: dkey() };
    var off = Number(skip[tab] || 0);
    return list[(dayNo() * 7 + off + (tab === 'ielts' ? 3 : tab === 'cv' ? 5 : 0)) % list.length];
  }
  function dailyState() {
    var d = sget('tenso:daily', null);
    if (!d || typeof d !== 'object') d = { last: '', streak: 0, best: 0, n: 0 };
    var y = new Date(); y.setDate(y.getDate() - 1);
    if (d.last && d.last !== dkey() && d.last !== dkey(y)) d.streak = 0;
    return d;
  }
  function markDaily() {
    var d = dailyState(), t = dkey(), first = d.last !== t;
    if (first) { var y = new Date(); y.setDate(y.getDate() - 1); d.streak = d.last === dkey(y) ? (d.streak || 0) + 1 : 1; d.last = t; }
    d.n = (d.n || 0) + 1; d.best = Math.max(d.best || 0, d.streak);
    sset('tenso:daily', d);
    return { d: d, first: first };
  }
  function renderDaily(el, params) {
    css(); cleanup();
    var tab = (params && params.tab) || sget('tenso:daily-tab', 'level'); if (['level', 'ielts', 'cv'].indexOf(tab) < 0) tab = 'level';
    var tabs = h('div', { class: 'tabs', role: 'tablist', 'aria-label': 'Yazı növü' });
    var body = h('div', { class: 'stack-lg' });
    var streakTx = h('span');
    function paintStreak() { var d = dailyState(); streakTx.textContent = ''; streakTx.appendChild(h('span', { class: 'g-streak' }, h('b', { text: String(d.streak || 0) }), h('span', { class: 'small muted', text: (d.streak ? 'günlük yazı seriyası' : 'Bu gün ilk mətni yaz — seriya başlasın') + (d.best ? ' · rekord ' + d.best : '') }))); }
    paintStreak();
    [['level', 'Gündəlik'], ['ielts', 'IELTS'], ['cv', 'Real həyat']].forEach(function (t) {
      tabs.appendChild(h('button', { type: 'button', role: 'tab', 'aria-selected': String(t[0] === tab), onclick: function () {
        tab = t[0]; sset('tenso:daily-tab', tab);
        Array.prototype.forEach.call(tabs.children, function (b) { b.setAttribute('aria-selected', String(b === this)); }, this);
        paint();
      } }, t[1]));
    });
    function paint() {
      body.textContent = '';
      var p = todayPrompt(tab);
      if (!p) { body.appendChild(h('div', { class: 'card g-empty' }, h('b', { text: 'Mövzular yüklənmədi' }), h('p', { class: 'muted', text: 'Səhifəni yeniləyin.' }))); return; }
      var drafts = sget('tenso:daily-draft', {}); if (!drafts || typeof drafts !== 'object') drafts = {};
      var ta = h('textarea', { class: 'textarea', rows: '9', spellcheck: 'false', 'aria-label': 'Sizin mətniniz', placeholder: p.starter ? 'Başlanğıc: ' + p.starter : 'Burada yazın…' });
      ta.value = str(drafts[p.id] || '');
      var wbar = h('i'), wtx = h('span', { class: 'g-count' });
      var minW = Number(p.minWords) || 0, maxW = Number(p.maxWords) || 0;
      function upd() {
        var n = words(ta.value);
        wtx.textContent = n + ' söz' + (minW ? ' · hədəf ' + minW + (maxW ? '–' + maxW : '+') : '');
        var pct = minW ? Math.min(100, Math.round(100 * n / minW)) : 0;
        wbar.style.width = pct + '%'; wbar.className = n >= minW ? 'ok' : '';
      }
      ta.addEventListener('input', function () { upd(); var dd = {}; dd[p.id] = ta.value.slice(0, 20000); sset('tenso:daily-draft', dd); });
      upd();
      var res = h('div', { class: 'stack-lg', 'aria-live': 'polite' });
      var btn = h('button', { class: 'btn btn-primary', type: 'button', onclick: function () { check(); } }, ic('check'), 'Yoxla və rəy al');
      function check() {
        var text = ta.value;
        if (words(text) < 5) { toast('Bir az daha yazın', 'info', { sub: 'Ən azı bir-iki cümlə' }); ta.focus(); return; }
        var g = G(); if (!g) return;
        btn.setAttribute('aria-busy', 'true'); btn.disabled = true;
        say('read', 'Oxuyuram…', 1600);
        g.check(text, { lang: 'en' }).then(function (r) {
          btn.removeAttribute('aria-busy'); btn.disabled = false;
          try { g.record(r.issues); } catch (e) { log(e); }
          pushHistory(text, r, 'daily');
          feedLearn(text, r.issues, 'en');
          var m = markDaily(); paintStreak();
          if (m.first) { addXP(15, 'Gündəlik yazı', btn); toast(m.d.streak > 1 ? m.d.streak + ' günlük seriya!' : 'Seriya başladı!', 'ok', { sub: 'Sabah yeni mövzu səni gözləyir', icon: 'flame' }); }
          feedback(r, text, p);
          say(r.score >= 80 ? 'celebrate' : 'point', r.issues.length ? 'Yaxşı iş! ' + r.issues.length + ' qeyd var — bax, öyrən.' : 'Əla mətn! Səhv görmədim.', 3000);
        }, function () { btn.removeAttribute('aria-busy'); btn.disabled = false; toast('Yoxlama alınmadı', 'warn'); });
      }
      function feedback(r, text, p) {
        res.textContent = '';
        var n = words(text), lenMsg = minW && n < minW ? 'Mətn qısadır: ' + n + ' söz (hədəf ' + minW + '+). Bir-iki fikir əlavə edin.' : maxW && n > maxW * 1.25 ? 'Mətn uzundur: ' + n + ' söz. Hədəf ' + minW + '–' + maxW + '.' : 'Həcm yaxşıdır: ' + n + ' söz.';
        var rg = null; try { rg = App.ring(r.score, 'bal', null, { size: 'sm' }); } catch (e) { rg = null; }
        if (r.offline) res.appendChild(h('div', { class: 'g-note' }, ic('info'), h('span', { text: 'Oflayn yoxlama — ' + (r.reasonText || 'yalnız yerli qaydalar işlədi.') })));
        res.appendChild(h('section', { class: 'card g-sum' }, rg,
          h('div', { class: 'g-sum-tx' },
            h('h2', { text: r.issues.length ? r.issues.length + ' qeyd' : 'Səhv tapılmadı' }),
            r.level && r.level.cefr ? h('div', { class: 'g-lvl' }, h('span', { text: 'Təxmini səviyyə' }), h('b', { text: r.level.cefr }), r.level.why ? h('span', { text: r.level.why }) : null) : null,
            h('p', { class: 'small muted', text: lenMsg }),
            r.issues.length ? h('div', { class: 'g-acts' },
              h('button', { class: 'btn btn-sm', type: 'button', onclick: function () { App.go('grammar', { text: text }); } }, ic('edit'), 'Yoxla ekranında düzəlt'),
              h('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: function () { copyText(r.corrected); } }, ic('copy'), 'Düzəldilmişi kopyala')) : null)));
        if (r.issues.length) res.appendChild(h('div', { class: 'g-iss-list' }, r.issues.slice(0, 30).map(function (x) {
          var u = lessonFor(x);
          return h('article', { class: 'g-iss ' + x.sev },
            h('div', { class: 'g-iss-h' }, h('span', { class: 'g-sev ' + x.sev, text: SEV_AZ[x.sev] }), h('span', { class: 'badge', text: typeAz(x.type) })),
            h('div', { class: 'g-fix' }, h('span', { class: 'g-bad', text: x.wrong }), x.fix ? h('span', { class: 'g-arrow', text: '→' }) : null, x.fix ? h('span', { class: 'g-good', text: x.fix }) : null),
            x.why ? h('p', { class: 'g-why', text: x.why }) : null,
            u ? h('div', { class: 'g-acts' }, h('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: function () { openUnit(u.id); } }, ic('book'), 'Bu qaydanı öyrən')) : null);
        })));
      }
      var focus = (p.focus || []).map(function (f) { var u = unitById(f); if (!u) { var all = units(); for (var k = 0; k < all.length && !u; k++) if ((all[k].rule_ids || []).indexOf(f) >= 0) u = all[k]; } return { f: f, u: u }; });
      var label = tab === 'ielts' ? 'IELTS ' + (/t1/.test(p.id) ? 'Task 1' : 'Task 2') : tab === 'cv' ? 'Real həyat' : (myLevel() || 'B1') + ' · ' + LEVEL_AZ[myLevel() || 'B1'];
      body.appendChild(h('section', { class: 'card g-prompt', 'aria-label': 'Günün mövzusu' },
        h('div', { class: 'g-meta' }, h('span', { class: 'badge fir', text: label }), p.topic ? h('span', { class: 'badge', text: p.topic }) : null, minW ? h('span', { class: 'badge', text: minW + (maxW ? '–' + maxW : '+') + ' söz' }) : null),
        h('h2', { lang: 'en', text: p.prompt }),
        p.az ? h('p', { class: 'muted', text: p.az }) : null,
        focus.length ? h('div', { class: 'g-meta' }, h('span', { class: 'small muted', text: 'Fokus:' }), focus.map(function (x) {
          return x.u ? h('button', { class: 'chip', type: 'button', onclick: function () { openUnit(x.u.id); } }, x.u.title) : h('span', { class: 'chip', text: x.f.replace(/-/g, ' ') });
        })) : null,
        p.tip ? h('div', { class: 'g-tip' }, ic('bulb'), h('span', { text: p.tip })) : null,
        h('div', { class: 'g-bar' },
          p.starter ? h('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: function () { if (!ta.value.trim()) { ta.value = p.starter + ' '; upd(); } ta.focus(); } }, ic('quill'), 'Başlanğıcı yaz') : null,
          h('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: function () {
            var sk = sget('tenso:daily-skip', {}); if (!sk || sk.d !== dkey()) sk = { d: dkey() }; sk[tab] = Number(sk[tab] || 0) + 1; sset('tenso:daily-skip', sk); paint();
          } }, ic('refresh'), 'Başqa mövzu'))));
      body.appendChild(h('section', { class: 'card stack' }, ta, h('div', { class: 'g-wbar', 'aria-hidden': 'true' }, wbar), h('div', { class: 'g-bar' }, wtx, h('span', { class: 'g-sp' }), btn)));
      body.appendChild(res);
    }
    el.appendChild(h('div', { class: 'page g-page' },
      pageHead('Tenso · Yazı', 'Gündəlik <em>yazı</em>', 'Hər gün səviyyənizə uyğun yeni mövzu. Yazın, yoxlayın, seriyanı qoruyun.', 'write', h('div', { class: 'actions' }, streakTx)),
      tabs, body));
    paint();
  }

  /* ------------------------------------------------------------------
     5. SƏHV DƏFTƏRİM
     ------------------------------------------------------------------ */
  function renderNotebook(el) {
    css(); cleanup();
    var g = G(), top = [];
    try { top = g ? g.top(12) : []; } catch (e) { log(e); }
    var page = h('div', { class: 'page g-page' },
      pageHead('Tenso · Dəftər', 'Səhv <em>dəftərim</em>', 'Ən çox təkrarlanan səhvləriniz və onları aradan qaldıran dərslər.', 'read'));
    el.appendChild(page);
    if (!top.length) {
      page.appendChild(h('div', { class: 'card g-empty' }, h('b', { text: 'Dəftər hələ boşdur' }), h('p', { class: 'muted', text: 'Mətn yoxladıqca səhvləriniz burada toplanacaq — hansı qaydanı təkrar etməli olduğunuzu görəcəksiniz.' }),
        h('button', { class: 'btn btn-primary btn-sm', type: 'button', onclick: function () { App.go('grammar'); } }, ic('check'), 'Mətn yoxla')));
      return;
    }
    function unitOf(b) { return lessonFor({ rule: b.rule, wrong: b.ex && b.ex[0] ? b.ex[0].bad : '' }); }
    page.appendChild(h('section', { class: 'stack' }, h('div', { class: 'sec-h' }, h('h2', { text: 'Ən çox təkrarlananlar' })),
      h('div', { class: 'g-top3' }, top.slice(0, 3).map(function (b) {
        var u = unitOf(b);
        return h('div', { class: 'card g-topc' }, h('span', { class: 'n', text: b.n + '×' }), h('h3', { text: b.title || b.rule }),
          b.ex && b.ex.length ? h('div', { class: 'g-exs' }, b.ex.slice(0, 2).map(function (e) { return h('div', { class: 'g-fix' }, h('span', { class: 'g-bad', text: e.bad }), h('span', { class: 'g-arrow', text: '→' }), h('span', { class: 'g-good', text: e.good })); })) : null,
          u ? h('button', { class: 'btn btn-sm', type: 'button', onclick: function () { openUnit(u.id); } }, ic('book'), u.title) : null);
      }))));
    if (top.length > 3) page.appendChild(h('section', { class: 'stack' }, h('div', { class: 'sec-h' }, h('h2', { text: 'Digər səhvlər' })),
      h('div', { class: 'card list' }, top.slice(3).map(function (b) {
        var u = unitOf(b);
        return h('button', { class: 'list-row', type: 'button', disabled: !u, onclick: function () { if (u) openUnit(u.id); } },
          h('span', { class: 'tx' }, h('b', { text: b.title || b.rule }), h('small', { text: (b.ex && b.ex[0] ? b.ex[0].bad + ' → ' + b.ex[0].good + ' · ' : '') + (u ? 'Dərs: ' + u.title : 'Dərs tezliklə') })),
          h('span', { class: 'g-prog part', text: b.n + '×' }));
      }))));
    var acts = h('div', { class: 'row' });
    if (hasScreen('g-practice')) acts.appendChild(h('button', { class: 'btn btn-primary', type: 'button', onclick: function () { App.go('g-practice'); } }, ic('sparkle'), 'Zəif qaydalarla məşq'));
    if (hasScreen('g-cards')) acts.appendChild(h('button', { class: 'btn', type: 'button', onclick: function () { App.go('g-cards'); } }, ic('cards'), 'Yaddaş kartları'));
    if (acts.children.length) page.appendChild(acts);
  }

  /* ------------------------------------------------------------------
     6. TARİXÇƏ
     ------------------------------------------------------------------ */
  function renderHistory(el) {
    css(); cleanup();
    var list = sget('tenso:history', []); if (!Array.isArray(list)) list = [];
    var page = h('div', { class: 'page g-page' },
      pageHead('Tenso · Tarixçə', 'Tarix<em>çə</em>', 'Son 20 yoxlama. Birinə toxunun — mətn redaktora qayıdır.', 'idle',
        list.length ? h('div', { class: 'actions' }, h('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: function () {
          var go = function () { sset('tenso:history', []); App.rerender(); };
          try { var p = App.confirm({ title: 'Tarixçə silinsin?', text: 'Son yoxlamaların siyahısı təmizlənəcək.', ok: 'Sil', danger: true }); if (p && p.then) p.then(function (y) { if (y) go(); }); else go(); } catch (e) { go(); }
        } }, ic('trash'), 'Təmizlə')) : null));
    el.appendChild(page);
    if (!list.length) {
      page.appendChild(h('div', { class: 'card g-empty' }, h('b', { text: 'Hələ yoxlama yoxdur' }), h('p', { class: 'muted', text: 'İlk mətninizi yoxlayın — burada görünəcək.' }),
        h('button', { class: 'btn btn-primary btn-sm', type: 'button', onclick: function () { App.go('grammar'); } }, ic('check'), 'Yoxla')));
      return;
    }
    page.appendChild(h('div', { class: 'card list' }, list.map(function (it) {
      var sc = Number(it.score) || 0, d = new Date(it.at);
      var when = ''; try { when = App.fmt && App.fmt.rel ? App.fmt.rel(it.at) : d.toLocaleString('az'); } catch (e) { when = dkey(d); }
      return h('button', { class: 'list-row g-hrow', type: 'button', onclick: function () { App.go('grammar', { text: it.text }); } },
        h('span', { class: 'g-score ' + (sc >= 85 ? 'good' : sc >= 60 ? 'mid' : 'bad'), text: String(sc) }),
        h('span', { class: 'tx' }, h('b', { text: str(it.text).replace(/\s+/g, ' ').slice(0, 90) }),
          h('small', { text: [when, it.kind === 'daily' ? 'Gündəlik yazı' : 'Yoxlama', it.lang === 'az' ? 'AZ' : 'EN', it.n + ' qeyd', it.level ? it.level : ''].filter(Boolean).join(' · ') })),
        h('span', { class: 'chev', html: App.icon('chevron') }));
    })));
  }

  /* ------------------------------------------------------------------
     7. REGISTRATION
     ------------------------------------------------------------------ */
  App.register('grammar', { title: 'Yoxla', icon: 'check', group: GROUP, mode: 'grammar', render: renderCheck, leave: function () { cleanup(); S = null; } });
  App.register('g-course', { title: 'Qrammatika kursu', icon: 'book', group: GROUP, mode: 'grammar', render: renderCourse, leave: cleanup, openUnit: openUnit });
  App.register('g-daily', { title: 'Gündəlik yazı', icon: 'edit', group: GROUP, mode: 'grammar', render: renderDaily, leave: cleanup,
    badgeKind: 'gold', badge: function () { var d = dailyState(); return d.last === dkey() ? null : (d.streak ? String(d.streak) : null); } });
  App.register('g-notebook', { title: 'Səhv dəftərim', icon: 'glossary', group: GROUP, mode: 'grammar', render: renderNotebook, leave: cleanup });
  App.register('g-history', { title: 'Tarixçə', icon: 'clock', group: GROUP, mode: 'grammar', render: renderHistory, leave: cleanup });

  /* s-tenso-learn.js keeps an existing unitOpener when it defines window.TensoLearn */
  W.TensoLearn = W.TensoLearn || {};
  W.TensoLearn.unitOpener = openUnit;

  W.TensoCore = { openUnit: openUnit, check: function (t) { App.go('grammar', { text: t }); }, units: units, lessonFor: lessonFor };
})();
