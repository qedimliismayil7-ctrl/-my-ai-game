/* =====================================================================
   MIRZƏ — s-resources.js
   «Resurslar» qrupunun iki oxu-ekranı (hər iki rejimdə açılır):
     • 'tm'          — Tərcümə yaddaşı (Translation Memory): istifadəçinin layihələrində
                       redaktorun saxladığı seqmentlər (App.store 'pj:segs:<id>'), mənbə mətni
                       App.projects.qaInput(id).segments-dən. Axtarış, dil cütü / layihə / status
                       filtrləri; sətrə klik → həmin seqment redaktorda açılır.
     • 'terminology' — İşçi termin bazası: App.data.GLOSSARY (Mirzənin ümumi lüğəti),
                       layihə lüğətləri (App.projects.qaInput(id).terms + 'pj:gl:<id>' əlavələri),
                       peşəkar sahə lüğətləri (window.NUANZA_DOMAINS[*].glossary). Axtarış,
                       mənbə və sahə filtrləri, hər sətirdə tərcüməni kopyalama.
   Yalnız oxuyur: heç bir store açarı yazılmır, məlumat formaları dəyişmir.
   Plain browser JS. Uses App.* from app.js. Screen CSS is prefixed .rs-*.
   ===================================================================== */
(function () {
  'use strict';
  var W = window, D = document;
  var App = W.App;
  if (!App || typeof App.register !== 'function') return;
  var h = App.h;

  /* ------------------------------------------------------------------
     1. HELPERS
     ------------------------------------------------------------------ */
  function ie(name) {
    if (typeof App.iconEl === 'function') return App.iconEl(name);
    var t = D.createElement('template'); t.innerHTML = App.icon(name); return t.content.firstChild;
  }
  function sget(k, fb) { try { var v = App.store.get(k, fb); return v === undefined || v === null ? fb : v; } catch (e) { return fb; } }
  function num(n) { return App.fmt && typeof App.fmt.num === 'function' ? App.fmt.num(n) : String(n); }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function short(s, n) { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1).trim() + '…' : s; }
  function upper(s) { s = String(s == null ? '' : s); try { return s.toLocaleUpperCase('az'); } catch (e) { return s.toUpperCase(); } }
  function toast(msg, kind, opts) { try { App.toast(msg, kind || 'info', opts); } catch (e) { /* not ready */ } }
  function later(fn) {
    if (typeof W.requestAnimationFrame === 'function') W.requestAnimationFrame(function () { setTimeout(fn, 0); });
    else setTimeout(fn, 0);
  }
  /* dd.mm.yyyy — compact, tabular; '' when unknown */
  function dnum(ts) {
    if (!ts) return '';
    var d = new Date(ts); if (isNaN(d)) return '';
    return pad2(d.getDate()) + '.' + pad2(d.getMonth() + 1) + '.' + d.getFullYear();
  }
  function langsOf(pair) { var p = String(pair || '').split('-'); return p.length === 2 ? [p[0], p[1]] : ['', '']; }
  function pairCode(pair) { var l = langsOf(pair); return l[0] ? upper(l[0]) + '→' + upper(l[1]) : '—'; }

  /* Search folding: case + Azerbaijani diacritics, one UTF-16 unit in → one out,
     so match offsets in the folded text are valid offsets in the original. */
  var FOLD = { 'ə': 'e', 'Ə': 'e', 'ı': 'i', 'I': 'i', 'İ': 'i', 'ö': 'o', 'Ö': 'o', 'ü': 'u', 'Ü': 'u', 'ş': 's', 'Ş': 's', 'ç': 'c', 'Ç': 'c', 'ğ': 'g', 'Ğ': 'g', 'ё': 'е', 'Ё': 'е', '’': "'", '‘': "'" };
  function fold(s) {
    s = String(s == null ? '' : s);
    var out = '';
    for (var i = 0; i < s.length; i++) {
      var c = s.charAt(i), f = FOLD[c];
      if (!f) { f = c.toLowerCase(); if (f.length !== 1) f = c; }
      out += f;
    }
    return out;
  }
  function tokens(q) { return fold(String(q || '').trim()).split(/\s+/).filter(Boolean); }
  function hits(hay, toks) { for (var i = 0; i < toks.length; i++) if (hay.indexOf(toks[i]) < 0) return false; return true; }
  /* Text with <mark> around every token match (fold-insensitive). */
  function hl(text, toks) {
    text = String(text == null ? '' : text);
    if (!toks || !toks.length || !text) return D.createTextNode(text);
    var f = fold(text), marks = [];
    toks.forEach(function (t) { var i = 0; while (t && (i = f.indexOf(t, i)) >= 0) { marks.push([i, i + t.length]); i += t.length; } });
    if (!marks.length) return D.createTextNode(text);
    marks.sort(function (a, b) { return a[0] - b[0] || b[1] - a[1]; });
    var merged = [];
    marks.forEach(function (m) { var last = merged[merged.length - 1]; if (last && m[0] <= last[1]) last[1] = Math.max(last[1], m[1]); else merged.push([m[0], m[1]]); });
    var fr = D.createDocumentFragment(), pos = 0;
    merged.forEach(function (m) {
      if (m[0] > pos) fr.appendChild(D.createTextNode(text.slice(pos, m[0])));
      fr.appendChild(h('mark', null, text.slice(m[0], m[1])));
      pos = m[1];
    });
    if (pos < text.length) fr.appendChild(D.createTextNode(text.slice(pos)));
    return fr;
  }
  function byAz(a, b) { try { return String(a).localeCompare(String(b), 'az', { sensitivity: 'base' }); } catch (e) { return a < b ? -1 : a > b ? 1 : 0; } }

  function copyText(text, btn, live) {
    text = String(text || '');
    function legacy() {
      try {
        var ta = h('textarea', { readonly: '', 'aria-hidden': 'true', style: 'position:fixed;left:-9999px;top:0;opacity:0' });
        ta.value = text; D.body.appendChild(ta); ta.select();
        var ok = D.execCommand && D.execCommand('copy'); ta.remove(); return !!ok;
      } catch (e) { return false; }
    }
    function done() {
      if (live) { live.textContent = ''; live.textContent = 'Kopyalandı: ' + text; }
      if (btn && btn.isConnected) {
        btn.classList.add('done'); btn.innerHTML = App.icon('check'); btn.title = 'Kopyalandı';
        setTimeout(function () { btn.classList.remove('done'); btn.innerHTML = App.icon('copy'); btn.title = 'Tərcüməni kopyala'; }, 1400);
      }
    }
    function fail() { toast('Kopyalanmadı', 'warn', { sub: 'Brauzer buferə icazə vermədi — mətni əl ilə seçin: «' + short(text, 60) + '»' }); }
    try {
      if (W.navigator.clipboard && W.navigator.clipboard.writeText) {
        W.navigator.clipboard.writeText(text).then(done, function () { if (legacy()) done(); else fail(); });
        return;
      }
    } catch (e) { /* fall through */ }
    if (legacy()) done(); else fail();
  }

  /* «/» focuses the screen's search field (outside text inputs). */
  function bindSlash(input) {
    function onKey(e) {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return;
      var t = e.target, tag = t && t.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (t && t.isContentEditable)) return;
      if (!input || !input.isConnected || input.offsetParent === null) return;
      e.preventDefault();
      try { input.focus({ preventScroll: false }); input.select(); } catch (e2) { /* ignore */ }
    }
    D.addEventListener('keydown', onKey);
    return function () { D.removeEventListener('keydown', onKey); };
  }

  /* ------------------------------------------------------------------
     2. CSS (tokens only; light + dark come from app.css)
     ------------------------------------------------------------------ */
  var CSS = [
    '.rs-page{gap:16px}',
    '.rs-head{display:grid;gap:4px;min-width:0}',
    '.rs-eyebrow{font:600 11px/14px var(--f-body);letter-spacing:.04em;text-transform:uppercase;color:var(--text-2)}',
    '.rs-title{display:flex;align-items:center;flex-wrap:wrap;gap:8px}',
    '.rs-title h1{margin:0;font:600 var(--t-h1)/28px var(--f-display);letter-spacing:-.01em;color:var(--text)}',
    '.rs-code{display:inline-flex;align-items:center;height:20px;padding:0 6px;border:1px solid var(--border-2);border-radius:4px;font:500 11px/1 var(--f-mono);color:var(--text-2)}',
    '.rs-desc{margin:2px 0 0;max-width:78ch;font-size:var(--t-small);line-height:18px;color:var(--text-2)}',
    '.rs-stats{display:flex;flex-wrap:wrap;gap:4px 20px;margin:8px 0 0;padding:0;list-style:none;font-size:12px;line-height:16px;color:var(--text-2)}',
    '.rs-stats li{display:inline-flex;align-items:baseline;gap:6px;min-height:16px}',
    '.rs-stats b{font:500 13px/16px var(--f-mono);font-variant-numeric:tabular-nums;color:var(--text)}',
    '.rs-stats li.warn b{color:var(--warning)}',
    '.rs-stats .rs-sk{width:72px;height:10px;margin-top:3px}',
    '.rs-stats:empty{display:none}',

    /* toolbar */
    '.rs-bar{display:flex;flex-wrap:wrap;align-items:center;gap:8px;min-width:0}',
    '.rs-search{position:relative;flex:1 1 260px;min-width:0}',
    '.rs-search > svg{position:absolute;left:10px;top:50%;width:16px;height:16px;margin-top:-8px;color:var(--text-3);pointer-events:none}',
    '.rs-search input{display:block;width:100%;height:32px;margin:0;padding:0 40px 0 32px;border:1px solid var(--border-2);border-radius:6px;background:var(--panel);color:var(--text);',
    '  font:400 14px/20px var(--f-body);-webkit-appearance:none;appearance:none;box-shadow:none;transition:border-color 120ms ease,box-shadow 120ms ease}',
    '.rs-search input::placeholder{color:var(--text-3);opacity:1}',
    '.rs-search input::-webkit-search-cancel-button,.rs-search input::-webkit-search-decoration{-webkit-appearance:none;appearance:none;display:none}',
    '@media (hover:hover){.rs-search input:hover{border-color:color-mix(in srgb,var(--text) 22%,var(--border-2))}}',
    '.rs-search input:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-t)}',
    '.rs-kbd{display:inline-grid;place-items:center;min-width:18px;height:18px;padding:0 4px;border:1px solid var(--border);border-bottom-color:var(--border-2);border-radius:4px;background:var(--canvas);font:500 11px/1 var(--f-mono);color:var(--text-2)}',
    '.rs-search .rs-kbd{position:absolute;right:8px;top:50%;margin-top:-9px;pointer-events:none}',
    '.rs-search input:focus ~ .rs-kbd,.rs-search.has .rs-kbd{display:none}',
    '.rs-clr{position:absolute;right:4px;top:50%;width:24px;height:24px;margin-top:-12px;display:grid;place-items:center;padding:0;border:0;border-radius:4px;background:transparent;color:var(--text-2);cursor:pointer;transition:background-color 120ms ease,color 120ms ease}',
    '.rs-clr svg{width:14px;height:14px}',
    '.rs-clr:hover{background:var(--hover);color:var(--text)}',
    '.rs-search:not(.has) .rs-clr{display:none}',
    '.rs-sel{position:relative;flex:0 1 auto;min-width:0;max-width:240px}',
    '.rs-sel select{display:block;width:100%;height:32px;margin:0;padding:0 28px 0 10px;border:1px solid var(--border-2);border-radius:6px;background:var(--panel);color:var(--text);',
    '  font:500 13px/30px var(--f-body);-webkit-appearance:none;appearance:none;box-shadow:none;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:border-color 120ms ease,box-shadow 120ms ease,background-color 120ms ease}',
    '@media (hover:hover){.rs-sel select:hover{border-color:color-mix(in srgb,var(--text) 22%,var(--border-2))}}',
    '.rs-sel select:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-t)}',
    '.rs-sel.on select{border-color:var(--accent-line);background-color:var(--accent-t)}',
    '.rs-sel select option,.rs-sel select optgroup{background:var(--panel);color:var(--text)}',
    '.rs-sel > svg{position:absolute;right:9px;top:50%;width:14px;height:14px;margin-top:-7px;transform:rotate(90deg);color:var(--text-2);pointer-events:none}',
    '.rs-seg{display:inline-flex;flex:none;gap:2px;max-width:100%;padding:2px;border:1px solid var(--border);border-radius:6px;background:var(--sunken);overflow-x:auto;scrollbar-width:none}',
    '.rs-seg::-webkit-scrollbar{display:none}',
    '.rs-seg button{display:inline-flex;align-items:center;justify-content:center;gap:6px;height:26px;padding:0 10px;border:0;border-radius:4px;background:transparent;color:var(--text-2);',
    '  font:500 13px/1 var(--f-body);white-space:nowrap;cursor:pointer;transition:background-color 120ms ease,color 120ms ease,box-shadow 120ms ease}',
    '.rs-seg button:hover{color:var(--text)}',
    '.rs-seg button[aria-pressed="true"]{background:var(--panel);color:var(--text);box-shadow:0 0 0 1px var(--border-2)}',
    '.rs-seg button:focus-visible{outline:2px solid var(--focus);outline-offset:-2px}',
    '.rs-seg .n{font:500 11px/1 var(--f-mono);font-variant-numeric:tabular-nums;color:var(--text-3)}',
    '.rs-seg button[aria-pressed="true"] .n{color:var(--text-2)}',
    '.rs-seg .s{display:none}',

    /* result line + footnote */
    '.rs-meta{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:4px 12px;min-height:20px;margin-top:-4px;font-size:12px;line-height:16px;color:var(--text-2)}',
    '.rs-meta b{font:500 12px/16px var(--f-mono);font-variant-numeric:tabular-nums;color:var(--text)}',
    '.rs-link{display:inline-flex;align-items:center;gap:4px;padding:2px 0;border:0;background:none;color:var(--accent);font:500 12px/16px var(--f-body);cursor:pointer;text-decoration:underline;text-decoration-color:var(--accent-line);text-underline-offset:2px}',
    '.rs-link:hover{text-decoration-color:currentColor}',
    '.rs-foot{display:flex;align-items:flex-start;gap:8px;margin:0;font-size:12px;line-height:16px;color:var(--text-2)}',
    '.rs-foot svg{flex:none;width:14px;height:14px;margin-top:1px;color:var(--text-3)}',
    '.rs-sr{position:absolute!important;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}',

    /* table (CSS grid rows; layout follows the table\'s own width) */
    '.rs-tbl{container-type:inline-size;container-name:rs;min-width:0;border-top:1px solid var(--border-2)}',
    '.rs-row{display:grid;column-gap:16px;row-gap:2px;align-items:start;padding:9px 8px;border-bottom:1px solid var(--border)}',
    '.rs-hd{padding-block:7px;border-bottom-color:var(--border-2)}',
    '.rs-hd > *{font:600 11px/16px var(--f-body);letter-spacing:.04em;text-transform:uppercase;color:var(--text-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.rs-c{min-width:0;font-size:14px;line-height:21px;color:var(--text);overflow-wrap:anywhere}',
    '.rs-tx{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:4;overflow:hidden}',
    '.rs-mono{font-family:var(--f-mono);font-size:12px;font-variant-numeric:tabular-nums;color:var(--text-2);white-space:nowrap}',
    '.rs-1l{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.rs-cl2{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;overflow-wrap:anywhere}',
    '.rs-sm{font-size:13px}',
    '.rs-sub{display:block;font-size:12px;line-height:16px;color:var(--text-2);margin-top:1px}',
    '.rs-sub .rs-mono{font-size:11px}',
    '.rs-faint{color:var(--text-3)}',
    '.rs-lc{display:none;margin-right:8px;font:500 10px/21px var(--f-mono);letter-spacing:.04em;color:var(--text-3);vertical-align:top}',
    '.rs-c mark{background:var(--accent-t);color:inherit;border-radius:2px;box-shadow:inset 0 -1px 0 var(--accent-line)}',
    '.rs-row.go{cursor:pointer;transition:background-color 120ms ease}',
    '@media (hover:hover){.rs-row.go:hover{background:var(--hover)}}',
    '.rs-row.go:active{background:var(--selected)}',
    '.rs-row.go:focus-visible{outline:2px solid var(--focus);outline-offset:-2px}',
    '.rs-tags{display:flex;flex-wrap:wrap;gap:4px;margin-top:4px}',
    '.rs-tags .rs-tag{margin-left:0}',
    '.rs-tag{display:inline-flex;align-items:center;height:18px;margin-left:6px;padding:0 6px;border-radius:999px;font:600 11px/1 var(--f-body);white-space:nowrap;vertical-align:1px}',
    '.rs-tag.draft{background:var(--sunken);color:var(--text-2);box-shadow:inset 0 0 0 1px var(--border)}',
    '.rs-tag.own{background:var(--accent-t);color:var(--accent)}',
    '.rs-tag.prj{color:var(--text-2);box-shadow:inset 0 0 0 1px var(--border-2)}',
    '.rs-lcode{display:inline-block;margin-right:6px;padding:0 4px;border-radius:3px;background:var(--sunken);font:500 10px/16px var(--f-mono);letter-spacing:.04em;color:var(--text-2);vertical-align:1px}',
    'button.rs-tag{border:0;cursor:pointer;font-family:var(--f-body)}',
    '.rs-tag.var{background:var(--warning-t);color:var(--warning)}',
    'button.rs-tag.var:hover{box-shadow:inset 0 0 0 1px var(--warning)}',
    '.rs-tag:focus-visible{outline:2px solid var(--focus);outline-offset:1px}',
    '.rs-copy{width:30px;height:30px;margin:-4px 0;display:grid;place-items:center;padding:0;border:0;border-radius:6px;background:transparent;color:var(--text-3);cursor:pointer;transition:background-color 120ms ease,color 120ms ease}',
    '.rs-copy svg{width:16px;height:16px}',
    '.rs-copy:hover{background:var(--hover);color:var(--text)}',
    '.rs-copy:focus-visible{outline:2px solid var(--focus);outline-offset:-2px}',
    '.rs-copy.done{color:var(--success)}',
    '.rs-term{font-weight:500}',
    '.rs-more{display:flex;justify-content:center;padding:12px 0 0}',
    '.rs-more[hidden]{display:none}',

    /* TM columns: # · Mənbə · Tərcümə · Layihə · Dil cütü · Tarix */
    '.rs-tm{grid-template-columns:40px minmax(0,1fr) minmax(0,1fr) minmax(112px,168px) 58px 84px;grid-template-areas:"n src tgt proj pair date"}',
    '.rs-tm .a-n{grid-area:n}.rs-tm .a-src{grid-area:src}.rs-tm .a-tgt{grid-area:tgt}.rs-tm .a-proj{grid-area:proj}.rs-tm .a-pair{grid-area:pair}.rs-tm .a-date{grid-area:date}',
    '.rs-tm .a-date{text-align:right}',
    '.rs-tm .a-n,.rs-tm .a-pair,.rs-tm .a-date{line-height:21px}',
    /* Terminology columns: Termin · Tərcümə · Sahə · Qeyd · copy */
    '.rs-tb{grid-template-columns:minmax(0,1fr) minmax(0,1fr) minmax(128px,184px) minmax(0,1.1fr) 30px;grid-template-areas:"term tr area note act"}',
    '.rs-tb .a-term{grid-area:term}.rs-tb .a-tr{grid-area:tr}.rs-tb .a-area{grid-area:area}.rs-tb .a-note{grid-area:note}.rs-tb .a-act{grid-area:act}',
    '.rs-tb .a-note{font-size:13px;color:var(--text-2)}',

    /* medium width */
    '@container rs (max-width:820px){',
    '  .rs-tm{grid-template-columns:36px minmax(0,1fr) minmax(0,1fr) 128px;grid-template-areas:"n src tgt proj" "n src tgt pair" "n src tgt date";grid-template-rows:auto auto 1fr;column-gap:14px}',
    '  .rs-tm.rs-hd{grid-template-areas:"n src tgt proj";grid-template-rows:auto}',
    '  .rs-hd .a-pair,.rs-hd .a-date{display:none}',
    '  .rs-tm .a-pair,.rs-tm .a-date{line-height:16px;text-align:left}',
    '}',
    '@container rs (max-width:760px){',
    '  .rs-tb{grid-template-columns:minmax(0,1fr) minmax(0,1fr) 132px 30px;grid-template-areas:"term tr area act" "term note note act";column-gap:14px}',
    '  .rs-tb.rs-hd{grid-template-areas:"term tr area act"}',
    '  .rs-hd .a-note{display:none}',
    '  .rs-tb .a-note{font-size:12px;line-height:16px}',
    '}',
    /* narrow: stacked rows */
    '@container rs (max-width:540px){',
    '  .rs-hd{display:none}',
    '  .rs-row{padding:12px 2px;row-gap:4px}',
    '  .rs-tm{grid-template-columns:auto minmax(0,1fr) auto auto;grid-template-areas:"n proj pair date" "src src src src" "tgt tgt tgt tgt";grid-template-rows:auto;column-gap:10px}',
    '  .rs-tm .a-n,.rs-tm .a-pair,.rs-tm .a-date,.rs-tm .a-proj{font-size:12px;line-height:16px}',
    '  .rs-tm .a-proj .rs-sm{font-size:12px;color:var(--text-2);-webkit-line-clamp:1}',
    '  .rs-tm .a-date.nil{display:none}',
    '  .rs-tm .rs-lc{display:inline-block}',
    '  .rs-tb{grid-template-columns:minmax(0,1fr) 30px;grid-template-areas:"term act" "tr act" "area area" "note note";column-gap:8px;row-gap:2px}',
    '  .rs-tb .a-area{margin-top:2px;font-size:12px;line-height:16px;color:var(--text-2)}',
    '  .rs-tb .a-note{font-size:12px;line-height:16px}',
    '}',
    /* fallback for browsers without container queries */
    '@supports not (container-type:inline-size){@media (max-width:600px){',
    '  .rs-hd{display:none}',
    '  .rs-tm{grid-template-columns:auto minmax(0,1fr) auto auto;grid-template-areas:"n proj pair date" "src src src src" "tgt tgt tgt tgt"}',
    '  .rs-tb{grid-template-columns:minmax(0,1fr) 30px;grid-template-areas:"term act" "tr act" "area area" "note note"}',
    '}}',

    /* skeleton + empty */
    '.rs-sk{display:block;height:10px;border-radius:4px;background:var(--border);animation:rs-pulse 1.1s ease-in-out infinite alternate}',
    '.rs-row .rs-sk{margin-top:6px}',
    '.rs-row .rs-sk + .rs-sk{margin-top:7px}',
    '@keyframes rs-pulse{from{opacity:.45}to{opacity:1}}',
    '@media (prefers-reduced-motion:reduce){.rs-sk{animation:none}}',
    ':root[data-motion="reduce"] .rs-sk{animation:none}',
    '.rs-empty{display:grid;justify-items:center;gap:6px;padding:40px 16px 44px;text-align:center;border-bottom:1px solid var(--border)}',
    '.rs-empty > svg{width:20px;height:20px;margin-bottom:4px;color:var(--text-3)}',
    '.rs-empty h3{margin:0;font:600 15px/20px var(--f-display);color:var(--text)}',
    '.rs-empty p{margin:0;max-width:54ch;font-size:13px;line-height:18px;color:var(--text-2)}',
    '.rs-empty .acts{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:10px}',
    '.rs-tbl.is-empty{border-top-color:var(--border)}',

    /* small screens: full-width toolbar controls, touch heights */
    '@media (max-width:640px){',
    '  .rs-search{flex-basis:100%}',
    '  .rs-search input{height:36px;font-size:16px}',
    '  .rs-sel{flex:1 1 0;max-width:none}',
    '  .rs-sel select{height:36px;line-height:34px}',
    '  .rs-seg{flex:1 1 100%}',
    '  .rs-seg button{flex:1 0 auto;height:30px;padding:0 8px}',
    '  .rs-seg .l.has-s{display:none}',
    '  .rs-seg .s{display:inline}',
    '}',
    '@media (hover:none){.rs-search .rs-kbd{display:none}}',
    '@media (prefers-reduced-motion:reduce){.rs-row.go,.rs-seg button,.rs-copy,.rs-search input,.rs-sel select{transition:none}}'
  ].join('\n');

  /* ------------------------------------------------------------------
     3. SHARED UI PIECES
     ------------------------------------------------------------------ */
  function pageHead(o) {
    var stats = h('ul', { class: 'rs-stats', 'aria-label': 'Xülasə' },
      h('li', null, h('span', { class: 'rs-sk' })), h('li', null, h('span', { class: 'rs-sk', style: 'width:56px' })), h('li', null, h('span', { class: 'rs-sk', style: 'width:64px' })));
    var el = h('header', { class: 'rs-head' },
      h('span', { class: 'rs-eyebrow', text: 'Resurslar' }),
      h('div', { class: 'rs-title' }, h('h1', { text: o.title }), o.code ? h('span', { class: 'rs-code', title: o.codeTitle || null, text: o.code }) : null),
      h('p', { class: 'rs-desc', text: o.desc }),
      stats);
    return {
      el: el,
      stats: function (items) {
        stats.textContent = '';
        items.forEach(function (it) {
          if (!it) return;
          stats.appendChild(h('li', { class: it.warn ? 'warn' : null, title: it.title || null }, h('b', { text: num(it.n) }), h('span', { text: it.l })));
        });
      }
    };
  }

  function searchBox(o) {
    var input = h('input', { type: 'search', placeholder: o.placeholder, 'aria-label': o.label, autocomplete: 'off', spellcheck: 'false', enterkeyhint: 'search', maxlength: '120', value: o.value || '' });
    var clr = h('button', { type: 'button', class: 'rs-clr', 'aria-label': 'Axtarışı təmizlə', title: 'Təmizlə (Esc)', html: App.icon('x') });
    var wrap = h('div', { class: 'rs-search', role: 'search' }, ie('search'), input, h('kbd', { class: 'rs-kbd', 'aria-hidden': 'true', title: 'Axtarışa keç', text: '/' }), clr);
    var t = 0;
    function sync() { wrap.classList.toggle('has', !!input.value); }
    function fire() { clearTimeout(t); o.onInput(input.value); }
    input.addEventListener('input', function () { sync(); clearTimeout(t); t = setTimeout(fire, 90); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && input.value) { e.preventDefault(); e.stopPropagation(); input.value = ''; sync(); fire(); }
      else if (e.key === 'Enter') { e.preventDefault(); fire(); }
      else if (e.key === 'ArrowDown' && o.onDown) { e.preventDefault(); o.onDown(); }
    });
    clr.addEventListener('click', function () { input.value = ''; sync(); fire(); input.focus(); });
    sync();
    return { el: wrap, input: input, set: function (v) { input.value = v || ''; sync(); } };
  }

  function selectBox(o) {
    var sel = h('select', { 'aria-label': o.label, title: o.label });
    var wrap = h('div', { class: 'rs-sel' }, sel, ie('chevron'));
    function opt(x) { return h('option', { value: x.v, text: x.l + (x.n != null ? ' · ' + num(x.n) : '') }); }
    function fill(items, value) {
      sel.textContent = '';
      items.forEach(function (x) {
        if (x.group) { var og = h('optgroup', { label: x.group }); x.items.forEach(function (y) { og.appendChild(opt(y)); }); sel.appendChild(og); }
        else sel.appendChild(opt(x));
      });
      sel.value = value || '';
      if (sel.value !== (value || '')) sel.value = '';
      wrap.classList.toggle('on', !!sel.value);
      return sel.value;
    }
    sel.addEventListener('change', function () { wrap.classList.toggle('on', !!sel.value); o.onChange(sel.value); });
    return { el: wrap, sel: sel, fill: fill, set: function (v) { sel.value = v || ''; wrap.classList.toggle('on', !!sel.value); } };
  }

  function segBox(o) {
    var el = h('div', { class: 'rs-seg', role: 'group', 'aria-label': o.label });
    var btns = {}, cur = o.value;
    o.items.forEach(function (it) {
      var n = h('span', { class: 'n' });
      var b = h('button', { type: 'button', 'aria-pressed': String(cur === it.v), title: it.title || null, 'aria-label': it.s ? it.l : null, onclick: function () { if (cur === it.v) return; set(it.v); o.onChange(it.v); } },
        h('span', { class: 'l' + (it.s ? ' has-s' : ''), text: it.l }), it.s ? h('span', { class: 's', 'aria-hidden': 'true', text: it.s }) : null, n);
      btns[it.v] = { b: b, n: n };
      el.appendChild(b);
    });
    function set(v) { cur = v; Object.keys(btns).forEach(function (k) { btns[k].b.setAttribute('aria-pressed', String(k === v)); }); }
    function counts(map) { Object.keys(btns).forEach(function (k) { btns[k].n.textContent = map && map[k] != null ? num(map[k]) : ''; }); }
    return { el: el, set: set, counts: counts };
  }

  function emptyBlock(o) {
    return h('div', { class: 'rs-empty', role: 'status' },
      ie(o.icon || 'info'),
      h('h3', { text: o.title }),
      o.text ? h('p', { text: o.text }) : null,
      o.actions && o.actions.length ? h('div', { class: 'acts' }, o.actions) : null);
  }

  function skRows(cls, cells, n) {
    var out = [];
    for (var i = 0; i < n; i++) {
      out.push(h('div', { class: 'rs-row ' + cls, 'aria-hidden': 'true' }, cells.map(function (c, j) {
        var w = c.w + ((i * 13 + j * 7) % 24);
        return h('div', { class: 'rs-c ' + c.a },
          h('span', { class: 'rs-sk', style: 'width:' + Math.min(w, 100) + '%' }),
          c.two ? h('span', { class: 'rs-sk', style: 'width:' + Math.max(28, w - 30) + '%' }) : null);
      })));
    }
    return out;
  }

  function projectsAll() {
    var P = App.projects; if (!P) return [];
    try { var l = typeof P.all === 'function' ? P.all() : P(); return Array.isArray(l) ? l : []; } catch (e) { return []; }
  }
  function qaInputOf(id) {
    var P = App.projects;
    try { return P && typeof P.qaInput === 'function' ? P.qaInput(id) : null; } catch (e) { return null; }
  }

  /* ------------------------------------------------------------------
     4. TRANSLATION MEMORY — data (read-only)
     Unit = a segment the editor saved with a non-empty target ('pj:segs:<id>'),
     source text from App.projects.qaInput(id).segments[i].s.
     Date = the project's creation time (raw 'pj:created'); segments carry no timestamp.
     ------------------------------------------------------------------ */
  function collectTM() {
    var created = {}, raw = sget('pj:created', []), units = [];
    if (Array.isArray(raw)) raw.forEach(function (c) { if (c && c.id && typeof c.created === 'number') created[c.id] = c.created; });
    projectsAll().forEach(function (p) {
      if (!p || !p.id) return;
      var saved = sget('pj:segs:' + p.id, null);
      if (!Array.isArray(saved) || !saved.length) return;
      var qi = qaInputOf(p.id);
      var segs = qi && Array.isArray(qi.segments) ? qi.segments : [];
      var pair = String(p.pair || (qi && qi.pair) || '');
      saved.forEach(function (s, i) {
        if (!s || typeof s !== 'object' || typeof s.t !== 'string' || !s.t.trim()) return;
        var sd = segs[i] || null, src = sd && typeof sd.s === 'string' ? sd.s : '';
        var u = {
          pid: String(p.id), n: sd && sd.n ? sd.n : i + 1, src: src, tgt: s.t, ok: !!s.ok,
          proj: String(p.name || p.id), client: String(p.client || ''), sample: !!p.sample,
          pair: pair, at: created[p.id] || 0
        };
        u.f = fold(u.src + '\n' + u.tgt + '\n' + u.proj + '\n' + u.client);
        u.fs = fold(u.src).replace(/\s+/g, ' ').trim();
        u.ft = fold(u.tgt).replace(/\s+/g, ' ').trim();
        units.push(u);
      });
    });
    units.sort(function (a, b) { return (b.at - a.at) || byAz(a.proj, b.proj) || (a.n - b.n); });
    return units;
  }

  /* ------------------------------------------------------------------
     5. TRANSLATION MEMORY — screen
     ------------------------------------------------------------------ */
  var TMS = { q: '', pair: '', project: '', status: 'ok' };   /* filters survive navigation (memory only) */
  var PAGE = 120;
  var gen = 0, V = null;

  function cleanup() { if (V && V.off) V.off.forEach(function (f) { try { f(); } catch (e) { /* ignore */ } }); V = null; }

  function renderTM(el, params) {
    App.css('resources', CSS);
    cleanup();
    var g = ++gen;
    params = params || {};
    if (typeof params.q === 'string') TMS.q = params.q;
    if (params.project) TMS.project = String(params.project);
    if (params.pair) TMS.pair = String(params.pair);
    if (params.status === 'all' || params.status === 'ok') TMS.status = params.status;

    var v = V = { kind: 'tm', off: [], limit: PAGE, units: null };
    var page = h('div', { class: 'page rs-page' });
    el.appendChild(page);

    v.head = pageHead({ title: 'Tərcümə yaddaşı', code: 'TM', codeTitle: 'Translation Memory',
      desc: 'Layihələrinizdə saxlanmış seqmentlər — mənbə və tərcümə cütləri. Sətrə klikləyin: seqment redaktorda açılır.' });
    page.appendChild(v.head.el);

    v.search = searchBox({ placeholder: 'Mənbədə və tərcümədə axtar…', label: 'Tərcümə yaddaşında axtar', value: TMS.q,
      onInput: function (q) { TMS.q = q; v.limit = PAGE; drawTM(); },
      onDown: function () { var r = v.body && v.body.querySelector('.rs-row.go'); if (r) r.focus(); } });
    v.pairSel = selectBox({ label: 'Dil cütü', onChange: function (x) { TMS.pair = x; v.limit = PAGE; drawTM(); } });
    v.projSel = selectBox({ label: 'Layihə', onChange: function (x) { TMS.project = x; v.limit = PAGE; drawTM(); } });
    v.seg = segBox({ label: 'Seqment statusu', value: TMS.status, items: [
      { v: 'ok', l: 'Təsdiqlənmiş', title: 'Yalnız təsdiqlənmiş seqmentlər' },
      { v: 'all', l: 'Hamısı', title: 'Təsdiqlənmiş seqmentlər və qaralamalar' }
    ], onChange: function (x) { TMS.status = x; v.limit = PAGE; drawTM(); } });
    v.bar = h('div', { class: 'rs-bar', role: 'toolbar', 'aria-label': 'Filtrlər' }, v.search.el, v.pairSel.el, v.projSel.el, v.seg.el);
    page.appendChild(v.bar);

    v.meta = h('div', { class: 'rs-meta', 'aria-live': 'polite' });
    page.appendChild(v.meta);

    v.hd = h('div', { class: 'rs-row rs-tm rs-hd', role: 'row' },
      h('div', { class: 'a-n', role: 'columnheader', text: '#' }),
      h('div', { class: 'a-src', role: 'columnheader', text: 'Mənbə' }),
      h('div', { class: 'a-tgt', role: 'columnheader', text: 'Tərcümə' }),
      h('div', { class: 'a-proj', role: 'columnheader', text: 'Layihə' }),
      h('div', { class: 'a-pair', role: 'columnheader', text: 'Dil cütü' }),
      h('div', { class: 'a-date', role: 'columnheader', text: 'Tarix' }));
    v.body = h('div', { role: 'rowgroup' }, skRows('rs-tm', [
      { a: 'a-n', w: 40 }, { a: 'a-src', w: 70, two: true }, { a: 'a-tgt', w: 66, two: true }, { a: 'a-proj', w: 60 }, { a: 'a-pair', w: 70 }, { a: 'a-date', w: 70 }
    ], 7));
    v.tbl = h('div', { class: 'rs-tbl', role: 'table', 'aria-label': 'Tərcümə vahidləri', 'aria-busy': 'true' }, h('div', { role: 'rowgroup' }, v.hd), v.body);
    page.appendChild(v.tbl);
    v.state = h('div', { hidden: true });
    page.appendChild(v.state);
    v.more = h('div', { class: 'rs-more', hidden: true });
    page.appendChild(v.more);
    v.foot = h('p', { class: 'rs-foot' }, ie('info'),
      h('span', { text: 'Yaddaş redaktorda saxlanan seqmentlərdən avtomatik yığılır. «Tarix» — layihənin yaradılma tarixi: seqmentlər üçün ayrıca vaxt saxlanmır.' }));
    page.appendChild(v.foot);
    v.live = h('div', { class: 'rs-sr', 'aria-live': 'polite' });
    page.appendChild(v.live);

    /* keyboard: ↑/↓ between rows, Enter opens */
    v.body.addEventListener('keydown', function (e) {
      var row = e.target && e.target.closest ? e.target.closest('.rs-row.go') : null;
      if (!row) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        var sib = e.key === 'ArrowDown' ? row.nextElementSibling : row.previousElementSibling;
        if (sib && sib.classList.contains('go')) sib.focus();
        else if (e.key === 'ArrowUp') v.search.input.focus();
      } else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); row.click(); }
    });
    v.off.push(bindSlash(v.search.input));

    later(function () {
      if (g !== gen || V !== v) return;
      v.units = collectTM();
      fillTMFilters();
      drawTM();
      v.tbl.removeAttribute('aria-busy');
    });
  }

  function fillTMFilters() {
    var v = V, pairs = {}, projs = {}, pOrder = [];
    v.units.forEach(function (u) {
      pairs[u.pair] = (pairs[u.pair] || 0) + 1;
      if (!projs[u.pid]) { projs[u.pid] = { v: u.pid, l: u.proj + (u.sample ? ' (nümunə)' : ''), n: 0 }; pOrder.push(u.pid); }
      projs[u.pid].n++;
    });
    var pairItems = [{ v: '', l: 'Bütün dil cütləri' }].concat(Object.keys(pairs).sort().map(function (k) { return { v: k, l: pairCode(k), n: pairs[k] }; }));
    var projItems = [{ v: '', l: 'Bütün layihələr' }].concat(pOrder.map(function (k) { return projs[k]; }));
    TMS.pair = v.pairSel.fill(pairItems, TMS.pair);
    TMS.project = v.projSel.fill(projItems, TMS.project);
  }

  function resetTM() {
    TMS.q = ''; TMS.pair = ''; TMS.project = '';
    V.search.set(''); V.pairSel.set(''); V.projSel.set('');
    V.limit = PAGE; drawTM();
  }

  function openUnit(u) {
    try { App.go('editor', { project: u.pid, seg: u.n }); }
    catch (e) { if (App.projects && App.projects.open) App.projects.open(u.pid); }
  }

  function tmRow(u, toks, variants) {
    var L = langsOf(u.pair), date = dnum(u.at);
    var tags = [];
    if (!u.ok) tags.push(h('span', { class: 'rs-tag draft', title: 'Tərcümə edilib, hələ təsdiqlənməyib', text: 'Qaralama' }));
    if (variants > 1) tags.push(h('span', { class: 'rs-tag var', title: 'Yaddaşda bu mənbə üçün ' + variants + ' fərqli tərcümə var', text: variants + ' variant' }));
    var row = h('div', { class: 'rs-row rs-tm go', role: 'row', tabindex: '0',
      'aria-label': 'Seqment #' + u.n + ', ' + u.proj + (u.ok ? '' : ', qaralama') + ' — redaktorda aç',
      onclick: function () {
        var s = W.getSelection && W.getSelection();
        if (s && String(s).length > 1 && row.contains(s.anchorNode)) return;   /* user is selecting text to copy */
        openUnit(u);
      } },
      h('div', { class: 'rs-c a-n rs-mono', role: 'cell', text: '#' + u.n }),
      h('div', { class: 'rs-c a-src', role: 'cell', lang: L[0] || null },
        h('div', { class: 'rs-tx' }, h('span', { class: 'rs-lc', 'aria-hidden': 'true', text: upper(L[0]) }),
          u.src ? hl(u.src, toks) : h('span', { class: 'rs-faint', text: 'Mənbə mətni əlçatan deyil' }))),
      h('div', { class: 'rs-c a-tgt', role: 'cell', lang: L[1] || null },
        h('div', { class: 'rs-tx' }, h('span', { class: 'rs-lc', 'aria-hidden': 'true', text: upper(L[1]) }), hl(u.tgt, toks)),
        tags.length ? h('div', { class: 'rs-tags' }, tags) : null),
      h('div', { class: 'rs-c a-proj', role: 'cell', title: u.proj + (u.client ? ' — ' + u.client : '') },
        h('div', { class: 'rs-sm rs-cl2' }, hl(u.proj, toks), u.sample ? h('span', { class: 'rs-faint', text: ' · nümunə' }) : null)),
      h('div', { class: 'rs-c a-pair rs-mono', role: 'cell', title: App.pairLabel ? App.pairLabel(u.pair) : null, text: pairCode(u.pair) }),
      h('div', { class: 'rs-c a-date rs-mono' + (date ? '' : ' nil'), role: 'cell', title: date ? 'Layihə yaradılıb: ' + date : 'Nümunə layihənin tarixi yoxdur', text: date || '—' }));
    return row;
  }

  function drawTM() {
    var v = V; if (!v || v.kind !== 'tm' || !v.units) return;
    var all = v.units, toks = tokens(TMS.q);
    var filtered = TMS.pair || TMS.project || toks.length;

    /* header stats (whole memory) */
    var okAll = 0, projSet = {}, pairSet = {};
    all.forEach(function (u) { if (u.ok) okAll++; projSet[u.pid] = 1; pairSet[u.pair] = 1; });
    v.head.stats([
      { n: okAll, l: 'təsdiqlənmiş vahid' },
      all.length - okAll ? { n: all.length - okAll, l: 'qaralama' } : null,
      { n: Object.keys(projSet).length, l: 'layihə' },
      { n: Object.keys(pairSet).length, l: 'dil cütü' }
    ]);

    v.body.textContent = '';
    v.state.textContent = '';
    v.more.textContent = '';
    v.more.hidden = true;

    /* nothing stored at all */
    if (!all.length) {
      v.head.stats([]);
      v.bar.hidden = true; v.meta.hidden = true; v.tbl.hidden = true; v.foot.hidden = true;
      v.state.hidden = false;
      var hasProjects = projectsAll().length > 0, acts = [];
      if (hasProjects) acts.push(h('button', { class: 'btn btn-primary', type: 'button', onclick: function () { App.go('editor'); } }, ie('edit'), 'Redaktoru aç'));
      else {
        if (App.projects && typeof App.projects.create === 'function') acts.push(h('button', { class: 'btn btn-primary', type: 'button', onclick: function () { App.projects.create(); } }, ie('plus'), 'Layihə yarat'));
        if (App.projects && typeof App.projects.openSample === 'function') acts.push(h('button', { class: 'btn btn-secondary', type: 'button', onclick: function () { App.projects.openSample(); } }, 'Nümunəyə bax'));
      }
      v.state.appendChild(h('div', { class: 'rs-tbl is-empty' }, emptyBlock({ icon: 'database', title: 'Tərcümə yaddaşı boşdur',
        text: 'Təsdiqlədiyiniz seqmentlər burada toplanacaq. Redaktorda seqmenti təsdiqləyin — o, yaddaşa avtomatik düşəcək.', actions: acts })));
      return;
    }
    v.bar.hidden = false; v.meta.hidden = false; v.foot.hidden = false;

    var scoped = all.filter(function (u) {
      return (!TMS.pair || u.pair === TMS.pair) && (!TMS.project || u.pid === TMS.project) && (!toks.length || hits(u.f, toks));
    });
    var nOk = 0; scoped.forEach(function (u) { if (u.ok) nOk++; });
    v.seg.counts({ ok: nOk, all: scoped.length });
    var rows = TMS.status === 'ok' ? scoped.filter(function (u) { return u.ok; }) : scoped;

    /* same source with different targets (within the visible status scope of the whole memory) */
    var vmap = {};
    all.forEach(function (u) {
      if (!u.fs || (TMS.status === 'ok' && !u.ok)) return;
      var m = vmap[u.fs] || (vmap[u.fs] = {}); m[u.ft] = 1;
    });

    /* result line */
    v.meta.textContent = '';
    var total = TMS.status === 'ok' ? okAll : all.length;
    v.meta.appendChild(h('span', null, h('b', { text: num(rows.length) }), filtered ? h('span', { text: ' / ' + num(total) }) : null, ' vahid'));
    if (filtered) v.meta.appendChild(h('button', { class: 'rs-link', type: 'button', onclick: resetTM }, 'Filtrləri sıfırla'));

    if (!rows.length) {
      v.tbl.hidden = true; v.state.hidden = false;
      var e;
      if (!filtered && TMS.status === 'ok') {
        e = emptyBlock({ icon: 'database', title: 'Təsdiqlənmiş seqment yoxdur',
          text: 'Yaddaşda ' + num(all.length) + ' qaralama var. Onları redaktorda təsdiqləyin və ya qaralamaları da göstərin.',
          actions: [h('button', { class: 'btn btn-secondary', type: 'button', onclick: function () { TMS.status = 'all'; v.seg.set('all'); drawTM(); } }, 'Qaralamaları göstər')] });
      } else {
        var acts2 = [h('button', { class: 'btn btn-secondary', type: 'button', onclick: resetTM }, 'Filtrləri sıfırla')];
        if (TMS.status === 'ok' && scoped.length) acts2.push(h('button', { class: 'btn btn-ghost', type: 'button', onclick: function () { TMS.status = 'all'; v.seg.set('all'); drawTM(); } }, 'Qaralamaları göstər · ' + num(scoped.length)));
        e = emptyBlock({ icon: 'search', title: 'Uyğun vahid tapılmadı',
          text: (toks.length ? '«' + short(TMS.q, 48) + '» üzrə nəticə yoxdur. ' : 'Seçilmiş filtrlərə uyğun vahid yoxdur. ') + 'Axtarışı qısaldın və ya filtrləri sıfırlayın.', actions: acts2 });
      }
      v.state.appendChild(h('div', { class: 'rs-tbl is-empty' }, e));
      return;
    }
    v.tbl.hidden = false; v.state.hidden = true;

    var shown = rows.slice(0, v.limit), fr = D.createDocumentFragment();
    shown.forEach(function (u) {
      var vm = u.fs && vmap[u.fs] ? Object.keys(vmap[u.fs]).length : 0;
      fr.appendChild(tmRow(u, toks, vm));
    });
    v.body.appendChild(fr);
    if (rows.length > shown.length) {
      v.more.hidden = false;
      v.more.appendChild(h('button', { class: 'btn btn-secondary', type: 'button', onclick: function () { v.limit += PAGE; drawTM(); } },
        'Daha çox göstər · ' + num(Math.min(PAGE, rows.length - shown.length)) + ' / ' + num(rows.length - shown.length)));
    }
  }

  /* ------------------------------------------------------------------
     6. TERMINOLOGY — data (read-only)
     ------------------------------------------------------------------ */
  var SRC_LABEL = { core: 'Termin bazası', project: 'Layihə lüğəti', domain: 'Sahə lüğəti' };
  var SRC_ORDER = { core: 0, project: 1, domain: 2 };

  function collectTerms() {
    var rows = [];
    var G = App.data && Array.isArray(App.data.GLOSSARY) ? App.data.GLOSSARY : [];
    G.forEach(function (g) {
      if (!g || !g.a || !g.b) return;
      rows.push({ term: String(g.a), tr: String(g.b), area: String(g.d || 'Ümumi'), note: String(g.note || ''), src: 'core', pair: 'en-az' });
    });

    /* project glossaries: set glossary + the user's own additions ('pj:gl:<id>'), merged across projects */
    var map = {};
    projectsAll().forEach(function (p) {
      if (!p || !p.id) return;
      var qi = qaInputOf(p.id), terms = qi && Array.isArray(qi.terms) ? qi.terms : [];
      var own = sget('pj:gl:' + p.id, []); if (!Array.isArray(own)) own = [];
      terms.forEach(function (t) {
        if (!t || !t.a || !t.b) return;
        var pair = String(p.pair || 'en-az'), key = fold(t.a) + '|' + fold(t.b) + '|' + pair;
        var isOwn = own.some(function (o) { return o && o.a === t.a && o.b === t.b; });
        var r = map[key];
        if (!r) { r = map[key] = { term: String(t.a), tr: String(t.b), area: String(p.field || 'Layihə'), note: String(t.note || ''), src: 'project', pair: pair, projects: [], own: false }; rows.push(r); }
        var nm = String(p.name || p.id) + (p.sample ? ' (nümunə)' : '');
        if (r.projects.indexOf(nm) < 0) r.projects.push(nm);
        if (isOwn) r.own = true;
        if (!r.note && t.note) r.note = String(t.note);
      });
    });

    var DM = W.NUANZA_DOMAINS && typeof W.NUANZA_DOMAINS === 'object' ? W.NUANZA_DOMAINS : {};
    Object.keys(DM).forEach(function (k) {
      var d = DM[k]; if (!d || !Array.isArray(d.glossary)) return;
      d.glossary.forEach(function (g) {
        if (!g || !g.en || !g.az) return;
        rows.push({ term: String(g.en), tr: String(g.az), area: String(d.name || k), note: String(g.note || ''), src: 'domain', pair: 'en-az', dkey: k });
      });
    });

    var vmap = {};
    rows.forEach(function (r) {
      r.ft = fold(r.term).replace(/\s+/g, ' ').trim();
      r.f = fold(r.term + '\n' + r.tr + '\n' + r.note + '\n' + r.area + '\n' + (r.projects ? r.projects.join('\n') : ''));
      var m = vmap[r.ft] || (vmap[r.ft] = {}); m[fold(r.tr).replace(/\s+/g, ' ').trim()] = 1;
    });
    var conflicts = 0;
    Object.keys(vmap).forEach(function (k) { var n = Object.keys(vmap[k]).length; if (n > 1) conflicts++; });
    rows.forEach(function (r) { r.variants = Object.keys(vmap[r.ft]).length; });
    rows.sort(function (a, b) { return byAz(a.ft, b.ft) || (SRC_ORDER[a.src] - SRC_ORDER[b.src]) || byAz(a.tr, b.tr); });
    return { rows: rows, conflicts: conflicts };
  }

  /* ------------------------------------------------------------------
     7. TERMINOLOGY — screen
     ------------------------------------------------------------------ */
  var TBS = { q: '', src: 'all', area: '' };

  function renderTerms(el, params) {
    App.css('resources', CSS);
    cleanup();
    var g = ++gen;
    params = params || {};
    if (typeof params.q === 'string') TBS.q = params.q;
    if (params.src && (params.src === 'all' || SRC_LABEL[params.src])) TBS.src = params.src;
    if (typeof params.area === 'string') TBS.area = params.area;

    var v = V = { kind: 'tb', off: [], limit: PAGE, data: null };
    var page = h('div', { class: 'page rs-page' });
    el.appendChild(page);

    v.head = pageHead({ title: 'Terminologiya',
      desc: 'İşçi termin bazası: Mirzənin ümumi lüğəti, layihə lüğətləri və peşəkar sahə lüğətləri. Terminə görə axtarın, tərcüməni bir kliklə kopyalayın.' });
    page.appendChild(v.head.el);

    v.search = searchBox({ placeholder: 'Termin, tərcümə və ya qeyd…', label: 'Terminlərdə axtar', value: TBS.q,
      onInput: function (q) { TBS.q = q; v.limit = PAGE; drawTerms(); },
      onDown: function () { var b = v.body && v.body.querySelector('.rs-copy'); if (b) b.focus(); } });
    v.seg = segBox({ label: 'Mənbə', value: TBS.src, items: [
      { v: 'all', l: 'Hamısı' },
      { v: 'core', l: 'Termin bazası', s: 'Baza', title: 'Mirzənin ümumi termin bazası' },
      { v: 'project', l: 'Layihələr', s: 'Layihə', title: 'Layihə lüğətləri və sizin əlavələriniz' },
      { v: 'domain', l: 'Sahə lüğətləri', s: 'Sahə', title: 'Peşəkar sahə lüğətləri' }
    ], onChange: function (x) { TBS.src = x; v.limit = PAGE; fillAreas(); drawTerms(); } });
    v.areaSel = selectBox({ label: 'Sahə', onChange: function (x) { TBS.area = x; v.limit = PAGE; drawTerms(); } });
    v.bar = h('div', { class: 'rs-bar', role: 'toolbar', 'aria-label': 'Filtrlər' }, v.search.el, v.seg.el, v.areaSel.el);
    page.appendChild(v.bar);

    v.meta = h('div', { class: 'rs-meta', 'aria-live': 'polite' });
    page.appendChild(v.meta);

    v.hd = h('div', { class: 'rs-row rs-tb rs-hd', role: 'row' },
      h('div', { class: 'a-term', role: 'columnheader', text: 'Termin' }),
      h('div', { class: 'a-tr', role: 'columnheader', text: 'Tərcümə' }),
      h('div', { class: 'a-area', role: 'columnheader', text: 'Sahə' }),
      h('div', { class: 'a-note', role: 'columnheader', text: 'Qeyd' }),
      h('div', { class: 'a-act', role: 'columnheader' }, h('span', { class: 'rs-sr', text: 'Əməliyyat' })));
    v.body = h('div', { role: 'rowgroup' }, skRows('rs-tb', [
      { a: 'a-term', w: 52 }, { a: 'a-tr', w: 58 }, { a: 'a-area', w: 60, two: true }, { a: 'a-note', w: 50 }, { a: 'a-act', w: 0 }
    ], 9));
    v.tbl = h('div', { class: 'rs-tbl', role: 'table', 'aria-label': 'Terminlər', 'aria-busy': 'true' }, h('div', { role: 'rowgroup' }, v.hd), v.body);
    page.appendChild(v.tbl);
    v.state = h('div', { hidden: true });
    page.appendChild(v.state);
    v.more = h('div', { class: 'rs-more', hidden: true });
    page.appendChild(v.more);
    v.foot = h('p', { class: 'rs-foot' }, ie('info'),
      h('span', { text: 'Yalnız baxış. Layihə lüğətinə termin redaktorda əlavə olunur; «variant» nişanı eyni terminin mənbələrdə fərqli tərcüməsini göstərir.' }));
    page.appendChild(v.foot);
    v.live = h('div', { class: 'rs-sr', 'aria-live': 'polite' });
    page.appendChild(v.live);
    v.off.push(bindSlash(v.search.input));

    later(function () {
      if (g !== gen || V !== v) return;
      v.data = collectTerms();
      fillAreas();
      drawTerms();
      v.tbl.removeAttribute('aria-busy');
    });
  }

  function fillAreas() {
    var v = V; if (!v || v.kind !== 'tb' || !v.data) return;
    var counts = {}, order = [];
    v.data.rows.forEach(function (r) {
      if (TBS.src !== 'all' && r.src !== TBS.src) return;
      if (!counts[r.area]) { counts[r.area] = 0; order.push(r.area); }
      counts[r.area]++;
    });
    order.sort(byAz);
    TBS.area = v.areaSel.fill([{ v: '', l: 'Bütün sahələr' }].concat(order.map(function (a) { return { v: a, l: a, n: counts[a] }; })), TBS.area);
  }

  function resetTerms() {
    TBS.q = ''; TBS.src = 'all'; TBS.area = '';
    V.search.set(''); V.seg.set('all');
    V.limit = PAGE; fillAreas(); drawTerms();
  }

  function showVariants(r) {
    TBS.q = r.term; TBS.src = 'all'; TBS.area = '';
    V.search.set(r.term); V.seg.set('all');
    V.limit = PAGE; fillAreas(); drawTerms();
    try { V.search.input.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
  }

  function termRow(r, toks) {
    var srcText = r.src === 'project'
      ? (r.projects.length === 1 ? 'Layihə: ' + r.projects[0] : num(r.projects.length) + ' layihə')
      : SRC_LABEL[r.src];
    var copyBtn = h('button', { class: 'rs-copy', type: 'button', title: 'Tərcüməni kopyala', 'aria-label': 'Tərcüməni kopyala: ' + r.tr, html: App.icon('copy') });
    copyBtn.addEventListener('click', function () { copyText(r.tr, copyBtn, V && V.live); });
    var L = langsOf(r.pair), prjTitle = r.projects ? 'Layihə lüğəti: ' + r.projects.join(', ') : '';
    return h('div', { class: 'rs-row rs-tb', role: 'row' },
      h('div', { class: 'rs-c a-term rs-term', role: 'cell', lang: L[0] || null },
        L[0] && L[0] !== 'en' ? h('span', { class: 'rs-lcode', title: pairCode(r.pair), text: upper(L[0]) }) : null,
        hl(r.term, toks)),
      h('div', { class: 'rs-c a-tr', role: 'cell', lang: L[1] || null },
        hl(r.tr, toks),
        r.own ? h('span', { class: 'rs-tag own', title: 'Bu termini redaktorda siz əlavə etmisiniz · ' + prjTitle, text: 'Öz əlavəniz' })
          : r.src === 'project' ? h('span', { class: 'rs-tag prj', title: prjTitle, text: r.projects.length > 1 ? num(r.projects.length) + ' layihə' : 'Layihə' }) : null,
        r.variants > 1 ? h('button', { class: 'rs-tag var', type: 'button', title: 'Bu terminin mənbələrdə ' + r.variants + ' fərqli tərcüməsi var — hamısını göstər', 'aria-label': r.variants + ' variant — hamısını göstər', onclick: function () { showVariants(r); } }, r.variants + ' variant') : null),
      h('div', { class: 'rs-c a-area rs-sm', role: 'cell', title: r.area + ' · ' + srcText }, hl(r.area, toks), h('span', { class: 'rs-sr', text: ' · ' + srcText })),
      h('div', { class: 'rs-c a-note', role: 'cell' }, r.note ? hl(r.note, toks) : null),
      h('div', { class: 'rs-c a-act', role: 'cell' }, copyBtn));
  }

  function drawTerms() {
    var v = V; if (!v || v.kind !== 'tb' || !v.data) return;
    var all = v.data.rows, toks = tokens(TBS.q);
    var areas = {}; all.forEach(function (r) { areas[r.area] = 1; });
    v.head.stats([
      { n: all.length, l: 'termin' },
      { n: Object.keys(areas).length, l: 'sahə' },
      v.data.conflicts ? { n: v.data.conflicts, l: 'fərqli tərcümə', warn: true, title: 'Mənbələrdə fərqli tərcümə olunan terminlər' } : null
    ]);

    v.body.textContent = ''; v.state.textContent = ''; v.more.textContent = ''; v.more.hidden = true;
    if (!all.length) {
      v.bar.hidden = true; v.meta.hidden = true; v.tbl.hidden = true; v.foot.hidden = true; v.state.hidden = false;
      v.state.appendChild(h('div', { class: 'rs-tbl is-empty' }, emptyBlock({ icon: 'tag', title: 'Termin bazası yüklənmədi',
        text: 'Lüğət məlumatları tapılmadı. Səhifəni yeniləyin; problem davam edərsə, bir az sonra yenidən cəhd edin.' })));
      return;
    }
    v.bar.hidden = false; v.meta.hidden = false; v.foot.hidden = false;

    var bySearch = toks.length ? all.filter(function (r) { return hits(r.f, toks); }) : all;
    var c = { all: bySearch.length, core: 0, project: 0, domain: 0 };
    bySearch.forEach(function (r) { c[r.src]++; });
    v.seg.counts(c);
    var rows = bySearch.filter(function (r) { return (TBS.src === 'all' || r.src === TBS.src) && (!TBS.area || r.area === TBS.area); });
    var filtered = toks.length || TBS.src !== 'all' || TBS.area;

    v.meta.textContent = '';
    v.meta.appendChild(h('span', null, h('b', { text: num(rows.length) }), filtered ? h('span', { text: ' / ' + num(all.length) }) : null, ' termin'));
    if (filtered) v.meta.appendChild(h('button', { class: 'rs-link', type: 'button', onclick: resetTerms }, 'Filtrləri sıfırla'));

    if (!rows.length) {
      v.tbl.hidden = true; v.state.hidden = false;
      var acts = [h('button', { class: 'btn btn-secondary', type: 'button', onclick: resetTerms }, 'Filtrləri sıfırla')];
      if (toks.length && (TBS.src !== 'all' || TBS.area) && bySearch.length) {
        acts.push(h('button', { class: 'btn btn-ghost', type: 'button', onclick: function () { TBS.src = 'all'; TBS.area = ''; v.seg.set('all'); fillAreas(); drawTerms(); } }, 'Bütün mənbələrdə · ' + num(bySearch.length)));
      }
      v.state.appendChild(h('div', { class: 'rs-tbl is-empty' }, emptyBlock({ icon: 'search', title: 'Termin tapılmadı',
        text: (toks.length ? '«' + short(TBS.q, 48) + '» üzrə uyğunluq yoxdur. ' : 'Seçilmiş mənbədə və sahədə termin yoxdur. ') + 'Yazılışı yoxlayın və ya başqa mənbəni seçin.', actions: acts })));
      return;
    }
    v.tbl.hidden = false; v.state.hidden = true;

    var shown = rows.slice(0, v.limit), fr = D.createDocumentFragment();
    shown.forEach(function (r) { fr.appendChild(termRow(r, toks)); });
    v.body.appendChild(fr);
    if (rows.length > shown.length) {
      v.more.hidden = false;
      v.more.appendChild(h('button', { class: 'btn btn-secondary', type: 'button', onclick: function () { v.limit += PAGE; drawTerms(); } },
        'Daha çox göstər · ' + num(Math.min(PAGE, rows.length - shown.length)) + ' / ' + num(rows.length - shown.length)));
    }
  }

  /* ------------------------------------------------------------------
     8. REGISTER
     mode 'both' = available in either mode without switching (the router's any-mode value).
     ------------------------------------------------------------------ */
  App.register('tm', {
    title: 'Translation Memory',
    icon: 'database',
    group: 'Resurslar',
    mode: 'both',
    order: 6,
    render: renderTM,
    leave: function () { gen++; cleanup(); }
  });
  App.register('terminology', {
    title: 'Terminologiya',
    icon: 'tag',
    group: 'Resurslar',
    mode: 'both',
    order: 7,
    render: renderTerms,
    leave: function () { gen++; cleanup(); }
  });
})();
