/* =====================================================================
   NUANZA — s-library.js
   Screen 'library' («Kitabxana», both modes) — redaksiya üslublu oxu aləti.
     • Axtarış sətri + dil seçimi (AZ/EN), nəticələr sıx siyahı kimi
     • Oxu: ~68 simvolluq sətir, 1.6 sətir aralığı, nəzmdə sətirlər qorunur
     • Seçim əməliyyatları sakit yapışqan paneldə; mənbə və lisenziya kiçik sətirdə
     • Vikimənbə (az/en.wikisource.org) axtarışı Worker-in GET /lib proksisi ilə
       (?op=search|cat|page&lang=az|en) — başlıq x-access-code (App.store 'code')
     • Mövzu çipləri: Füzuli, Nəsimi, Nizami Gəncəvi, Sabir, Mirzə Cəlil,
       Konstitusiya, Mülki Məcəllə, İnsan hüquqları (EN üçün öz siyahısı)
     • Oxu görünüşü: təmiz mətn abzas/bənd-bənd; 1–5 abzası toxunaraq seçin →
       «Tapşırığa çevir» (App.store 'academy:custom' + App.go('task', {custom:true}))
       və ya «Tərcüməçidə aç» (App.go('translate', {text, pair}))
     • Mənbə + lisenziya sətri, Vikimənbə keçidi; son 10 səhifə App.store-da
     • Vəziyyətlər: skelet, boş nəticə, canlı sayt yoxdur, giriş kodu xətası
   Plain browser JS. Uses App.* from app.js and app.css components.
   Screen CSS is prefixed .library-*.
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
  function frag(html) { var t = D.createElement('template'); t.innerHTML = String(html).trim(); return t.content.firstChild; }
  function ie(name) { return typeof App.iconEl === 'function' ? App.iconEl(name) : frag(App.icon(name)); }
  function sget(k, fb) { try { var v = App.store.get(k, fb); return v === undefined || v === null ? fb : v; } catch (e) { return fb; } }
  function sset(k, v) { try { App.store.set(k, v); } catch (e) { /* storage blocked */ } }
  function num(n) { return App.fmt && typeof App.fmt.num === 'function' ? App.fmt.num(n) : String(n); }
  function short(s, n) { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1).trim() + '…' : s; }
  function words(s) { return (String(s || '').match(/[\p{L}\p{N}]+(?:[-'’][\p{L}\p{N}]+)*/gu) || []).length; }
  function toast(msg, kind, opts) { try { App.toast(msg, kind || 'info', opts); } catch (e) { /* not ready */ } }
  function say(text, ms) { try { if (typeof App.say === 'function') App.say(text, ms || 2600); } catch (e) { /* companion off */ } }

  var LANGS = { az: 'Azərbaycanca', en: 'İngiliscə' };
  var MAX_SEL = 5, MAX_SEL_CHARS = 5000, MAX_RECENT = 10, RECENT_BUDGET = 260000;
  var TOPICS = {
    az: [
      { label: 'Füzuli', q: 'Füzuli' },
      { label: 'Nəsimi', q: 'Nəsimi' },
      { label: 'Nizami Gəncəvi', q: 'Nizami Gəncəvi' },
      { label: 'Sabir', q: 'Sabir' },
      { label: 'Mirzə Cəlil', q: 'Cəlil Məmmədquluzadə' },
      { label: 'Konstitusiya', q: 'Azərbaycan Respublikasının Konstitusiyası' },
      { label: 'Mülki Məcəllə', q: 'Mülki Məcəllə' },
      { label: 'İnsan hüquqları', q: 'İnsan hüquqları haqqında Ümumi Bəyannamə' }
    ],
    en: [
      { label: 'Shakespeare', q: 'Shakespeare sonnet' },
      { label: 'İnsan hüquqları', q: 'Universal Declaration of Human Rights' },
      { label: 'ABŞ Konstitusiyası', q: 'Constitution of the United States of America' },
      { label: 'Edgar Allan Poe', q: 'Edgar Allan Poe' },
      { label: 'Oscar Wilde', q: 'Oscar Wilde fairy tales' },
      { label: 'Müqavilələr', q: 'treaty' }
    ]
  };

  /* Worker cavabı olmayanda (statik baxış) və ya şəbəkə xətasında göstərilən mətnlər.
     Giriş kodu və limit mesajları ai/core.js errText ilə eynidir. */
  var ERR = {
    unavailable: 'Kitabxana yalnız canlı saytda işləyir.',
    network: 'İnternet bağlantısını yoxlayın.',
    bad_code: 'Giriş kodu yanlışdır — Ayarlar → Hesab bölməsində kodu daxil edin.',
    rate_limited: 'Limit doldu. Bir dəqiqə gözləyib yenidən cəhd edin.',
    not_found: 'Bu səhifə Vikimənbədə tapılmadı.',
    timeout: 'Vikimənbə vaxtında cavab vermədi. Yenidən cəhd edin.',
    upstream_error: 'Vikimənbə hazırda cavab vermir. Bir az sonra yenidən cəhd edin.',
    prompt_too_large: 'Sorğu çox uzundur. Qısaldıb yenidən cəhd edin.',
    invalid_request: 'Sorğu düzgün deyil.',
    server_error: 'Xəta baş verdi. Yenidən cəhd edin.'
  };
  function errText(e) {
    var c = e && e.code;
    if (ERR[c]) return c === 'unavailable' || c === 'not_found' || c === 'timeout' || c === 'upstream_error' || c === 'invalid_request' ? ERR[c]
      : ((W.NuanzaAI && typeof W.NuanzaAI.errText === 'function' && W.NuanzaAI.errText(e)) || ERR[c]);
    return ERR.server_error;
  }

  function accessCode() {
    var c = sget('code', '');
    if (c == null || c === '') { try { var v = W.localStorage.getItem('nuanza2:code'); c = v ? JSON.parse(v) : ''; } catch (e) { c = ''; } }
    return c == null ? '' : String(c).trim();
  }

  /* GET /lib. Throws {code}. */
  var memo = {};
  function lib(params) {
    var qs = Object.keys(params).map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]); }).join('&');
    if (memo[qs]) return Promise.resolve(memo[qs]);
    var code = accessCode();
    if (/[^\x20-\x7e]/.test(code)) return Promise.reject({ code: 'bad_code' });
    var ctl = typeof AbortController === 'function' ? new AbortController() : null;
    var timer = ctl ? setTimeout(function () { ctl.abort(); }, 25000) : null;
    return fetch('/lib?' + qs, { headers: { 'x-access-code': code, accept: 'application/json' }, signal: ctl ? ctl.signal : undefined })
      .then(function (r) {
        var isJson = /json/i.test(r.headers.get('content-type') || '');
        return (isJson ? r.json().catch(function () { return null; }) : Promise.resolve(null)).then(function (j) {
          if (timer) clearTimeout(timer);
          /* no JSON at all → the page is not served by the Nuanza Worker (static preview) */
          if (!j) throw { code: r.status >= 500 && W.NUANZA_LIVE ? 'upstream_error' : 'unavailable' };
          if (!r.ok || !j.ok) throw { code: j.error || 'server_error' };
          memo[qs] = j.data;
          return j.data;
        });
      }, function (e) {
        if (timer) clearTimeout(timer);
        if (e && e.name === 'AbortError') throw { code: 'timeout' };
        throw { code: W.navigator && W.navigator.onLine === false ? 'network' : (W.NUANZA_LIVE ? 'network' : 'unavailable') };
      });
  }

  /* Son səhifələr: ən çox 10, ümumi həcm büdcəsi ilə (localStorage dolmasın). */
  function recent() { var r = sget('library:recent', []); return Array.isArray(r) ? r.filter(function (x) { return x && x.title && typeof x.text === 'string'; }) : []; }
  function remember(lang, d) {
    var list = recent().filter(function (x) { return !(x.lang === lang && x.title === d.title); });
    list.unshift({ lang: lang, title: d.title, displaytitle: d.displaytitle || d.title, text: d.text, url: d.url, licence: d.licence, links: (d.links || []).slice(0, 120), truncated: !!d.truncated, at: Date.now() });
    list = list.slice(0, MAX_RECENT);
    var total = 0;
    list = list.filter(function (x, i) { total += x.text.length; return i === 0 || total <= RECENT_BUDGET; });
    sset('library:recent', list);
  }
  function cachedPage(lang, title) {
    var r = recent();
    for (var i = 0; i < r.length; i++) if (r[i].lang === lang && r[i].title === title) return r[i];
    return null;
  }

  /* Mətni abzaslara/bəndlərə bölür. Çox uzun nəsr abzasları olduğu kimi qalır. */
  function blocksOf(text) {
    return String(text || '').split(/\n{2,}/).map(function (b) { return b.replace(/^\n+|\n+$/g, ''); }).filter(function (b) { return /\S/.test(b); });
  }

  /* ------------------------------------------------------------------
     2. CSS (tokens only)
     ------------------------------------------------------------------ */
  var CSS = [
    '.library-page{padding-bottom:calc(var(--s-12,48px) + var(--s-12,48px))}',
    '.library-head h1{font:600 var(--t-h1,1.375rem)/1.27 var(--f-display);letter-spacing:-.01em}',
    '.library-head p{font-size:var(--t-small,.8125rem);color:var(--text-2,var(--soft));max-width:68ch}',
    /* search: one row, quiet topic links below */
    '.library-search{display:grid;gap:10px}',
    '.library-search-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}',
    '.library-search-row .input-ic{flex:1 1 240px;min-width:0}',
    '.library-search-row .input{height:36px;min-height:36px;padding-block:0;font-size:var(--t-body,.875rem);background-color:var(--panel,var(--surface))}',
    '.library-search-row .seg{flex:none}',
    '.library-search-row .seg button{min-height:28px;padding:3px 12px;font-family:var(--f-mono);font-size:.75rem}',
    '.library-search-row .btn{min-height:36px}',
    '.library-chips{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 14px;font-size:var(--t-small,.8125rem)}',
    '.library-chips > span{font-size:var(--t-caption,.75rem);color:var(--text-3,var(--faint))}',
    '.library-chips .chip{min-height:0;padding:0;border:0;background:none;color:var(--text-2,var(--soft));font-weight:500;font-size:var(--t-small,.8125rem)}',
    '@media (hover:hover){.library-chips .chip:hover{background:none;color:var(--text,var(--ink));text-decoration:underline;text-underline-offset:3px}}',
    '.library-chips .chip[aria-pressed="true"]{background:none;color:var(--accent,var(--firuze))}',
    '.library-chips .chip[aria-pressed="true"]::before{content:none}',
    /* sections: caption + dense bordered list */
    '.library-sec{display:grid;gap:8px;margin-top:8px}',
    '.library-sec > h2{display:flex;align-items:baseline;justify-content:space-between;gap:12px;padding:0 4px;margin:0;font:600 var(--t-caption,.75rem)/16px var(--f-body);letter-spacing:.04em;text-transform:uppercase;color:var(--text-2,var(--soft))}',
    '.library-list{min-width:0;background:var(--panel,var(--surface));border:1px solid var(--border,var(--line));border-radius:8px}',
    '.library-row{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:2px 16px;width:100%;min-height:44px;padding:8px 16px;border:0;border-top:1px solid var(--border,var(--line));background:none;color:inherit;font:inherit;text-align:left;cursor:pointer;transition:background-color 120ms ease}',
    '.library-row:first-child{border-top:0;border-radius:8px 8px 0 0}',
    '.library-row:last-child{border-radius:0 0 8px 8px}',
    '.library-row:only-child{border-radius:8px}',
    '@media (hover:hover){.library-row:hover{background:var(--hover)}}',
    '.library-row:focus-visible{outline:2px solid var(--focus);outline-offset:-2px}',
    '.library-row .tx{display:grid;gap:2px;min-width:0}',
    '.library-row .tx b{font-size:var(--t-body,.875rem);font-weight:500;line-height:20px;overflow-wrap:anywhere}',
    '.library-row .tx small{font-size:var(--t-caption,.75rem);line-height:16px;color:var(--text-2,var(--soft));display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
    '.library-row .kind{font:500 .6875rem/16px var(--f-mono);color:var(--text-3,var(--faint));text-transform:uppercase;letter-spacing:.04em}',
    '.library-row .end{display:flex;align-items:center;gap:8px;color:var(--text-3,var(--faint));font-size:var(--t-caption,.75rem);white-space:nowrap}',
    '.library-row .end svg{width:16px;height:16px}',
    '.library-sk{display:grid}',
    '.library-sk-row{display:grid;gap:6px;padding:12px 16px;border-top:1px solid var(--border,var(--line))}',
    '.library-sk-row:first-child{border-top:0}',
    '.library-sk-row .skeleton{margin:0}',
    /* states: small and contextual */
    '.library-state{display:grid;gap:6px;justify-items:start;padding:16px;background:var(--panel,var(--surface));border:1px solid var(--border,var(--line));border-radius:8px}',
    '.library-state h3{display:flex;align-items:center;gap:8px;font:600 var(--t-h3,.9375rem)/20px var(--f-body)}',
    '.library-state h3 svg{width:16px;height:16px;color:var(--text-3,var(--faint))}',
    '.library-state p{font-size:var(--t-small,.8125rem);color:var(--text-2,var(--soft));max-width:60ch}',
    '.library-state .actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:6px}',
    /* reader: editorial column */
    '.library-reader{width:100%;max-width:calc(68ch + 48px);margin-inline:auto;display:grid;gap:16px;min-width:0}',
    '.library-reader-h{display:grid;gap:6px}',
    '.library-back{justify-self:start;margin-left:-8px}',
    '.library-reader-h .eyebrow{font:600 var(--t-caption,.75rem)/16px var(--f-body);letter-spacing:.04em;text-transform:uppercase;color:var(--text-2,var(--soft))}',
    '.library-reader-h h1{font:600 var(--t-display,1.75rem)/1.22 var(--f-display);letter-spacing:-.015em;margin:0;overflow-wrap:anywhere}',
    '.library-reader-h .meta{display:flex;flex-wrap:wrap;gap:2px 12px;font-size:var(--t-small,.8125rem);color:var(--text-2,var(--soft));font-variant-numeric:tabular-nums}',
    '.library-reader-h .meta .warn{color:var(--warning,var(--zafaran-ink))}',
    '.library-hint{font-size:var(--t-small,.8125rem);color:var(--text-2,var(--soft));margin:0;padding-bottom:12px;border-bottom:1px solid var(--border,var(--line))}',
    '.library-text{display:grid;gap:2px;min-width:0}',
    '.library-p{position:relative;max-width:calc(68ch + 48px);margin:0 -16px;padding:8px 40px 8px 16px;border-radius:6px;white-space:pre-line;overflow-wrap:anywhere;font-size:1.0625rem;line-height:1.6;color:var(--text,var(--ink));cursor:pointer;',
    '  transition:background-color 120ms ease;-webkit-tap-highlight-color:transparent;font-feature-settings:"kern","liga"}',
    '.library-p + .library-p{margin-top:6px}',
    '.library-p.verse{line-height:1.6}',
    '.library-p.verse + .library-p.verse{margin-top:14px}',
    '@media (hover:hover){.library-p:hover{background:var(--hover)}}',
    '.library-p:focus-visible{outline:2px solid var(--focus);outline-offset:0}',
    '.library-p[aria-checked="true"]{background:var(--selected,var(--fir-t))}',
    '.library-p[aria-checked="true"]::before{content:"";position:absolute;left:0;top:8px;bottom:8px;width:2px;border-radius:1px;background:var(--accent,var(--firuze))}',
    '.library-p .n{position:absolute;right:8px;top:8px;min-width:18px;height:18px;padding:0 4px;border-radius:4px;background:var(--accent,var(--firuze));color:var(--on-accent,var(--on-firuze));font:600 .6875rem/18px var(--f-mono);text-align:center}',
    '@media (max-width:639px){.library-p{margin:0 -8px;padding:8px 32px 8px 12px;font-size:1rem}.library-bar{margin-right:64px}}',
    '.library-more{display:flex;justify-content:center;margin-top:8px}',
    '.library-src{display:flex;flex-wrap:wrap;gap:2px 16px;padding-top:12px;border-top:1px solid var(--border,var(--line));font-size:var(--t-caption,.75rem);line-height:16px;color:var(--text-2,var(--soft))}',
    '.library-src a{color:var(--text-2,var(--soft));text-decoration:underline;text-decoration-color:var(--border-2,var(--line-2));text-underline-offset:2px;overflow-wrap:anywhere}',
    '.library-src a:hover{color:var(--text,var(--ink))}',
    '.library-src a svg{width:12px;height:12px;vertical-align:-1px;margin-left:3px}',
    /* selection actions: a quiet sticky bar */
    '.library-bar{position:sticky;bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:5;display:flex;flex-wrap:wrap;align-items:center;gap:8px;',
    '  padding:8px 8px 8px 16px;border:1px solid var(--border-2,var(--line-2));border-radius:8px;background:var(--panel,var(--surface));box-shadow:var(--sh-2);animation:library-in 160ms ease both}',
    '.library-bar[hidden]{display:none}',
    '.library-bar .cnt{flex:1 1 auto;min-width:0;display:flex;flex-wrap:wrap;gap:0 12px;font-size:var(--t-small,.8125rem);color:var(--text-2,var(--soft));font-variant-numeric:tabular-nums}',
    '.library-bar .cnt b{color:var(--text,var(--ink));font-weight:600}',
    '.library-bar .cnt .warn{color:var(--warning,var(--zafaran-ink))}',
    '.library-bar .btn{flex:0 0 auto}',
    '@media (max-width:479px){.library-bar .cnt{flex:1 1 100%}.library-bar .btn:not(.btn-ghost){flex:1 1 0}}',
    '.library-links .library-row{min-height:40px}',
    '@keyframes library-in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}',
    '@media (prefers-reduced-motion:reduce){.library-bar{animation:none}}'
  ].join('\n');

  /* ------------------------------------------------------------------
     3. SCREEN
     ------------------------------------------------------------------ */
  var V = null, gen = 0;

  function alive(g) { return V && g === gen; }

  function header() {
    return h('div', { class: 'page-h library-head' },
      h('div', null,
        h('h1', { text: 'Kitabxana' }),
        h('p', { text: 'Vikimənbədən klassik ədəbiyyat, qanunlar və sənədlər. Oxuyun, bir parça seçin və tərcüməyə və ya tapşırığa göndərin.' })));
  }

  function searchCard() {
    var input = h('input', { class: 'input', type: 'search', name: 'q', placeholder: V.lang === 'az' ? 'Müəllif, əsər və ya qanun' : 'Author, work or document', 'aria-label': 'Kitabxanada axtar', autocomplete: 'off', enterkeyhint: 'search', maxlength: '200', value: V.q || '' });
    var seg = h('div', { class: 'seg', role: 'group', 'aria-label': 'Vikimənbə dili' },
      Object.keys(LANGS).map(function (l) {
        return h('button', { type: 'button', 'aria-pressed': String(V.lang === l), title: LANGS[l], onclick: function () {
          if (V.lang === l) return;
          V.lang = l; sset('library:lang', l);
          paintHome(true);
        } }, l.toUpperCase());
      }));
    var form = h('form', { class: 'library-search', role: 'search', onsubmit: function (e) { e.preventDefault(); search(input.value); } },
      h('div', { class: 'library-search-row' },
        h('label', { class: 'input-ic' }, ie('search'), input),
        seg,
        h('button', { class: 'btn btn-primary', type: 'submit' }, 'Axtar')),
      h('div', { class: 'chips library-chips', role: 'group', 'aria-label': 'Tez mövzular' },
        h('span', { text: 'Tez mövzular' }),
        (TOPICS[V.lang] || []).map(function (t) {
          return h('button', { class: 'chip', type: 'button', 'aria-pressed': String(V.q === t.q), onclick: function () { input.value = t.q; search(t.q); } }, t.label);
        })));
    V.input = input;
    return h('section', { 'aria-label': 'Axtarış' }, form);
  }

  function skeletonList(n) {
    var rows = [];
    for (var i = 0; i < n; i++) rows.push(h('div', { class: 'library-sk-row' }, h('span', { class: 'skeleton text', style: 'width:' + (30 + (i * 17) % 35) + '%' }), h('span', { class: 'skeleton text', style: 'width:' + (60 + (i * 11) % 30) + '%;height:.7em' })));
    return h('div', { class: 'library-sk', 'aria-busy': 'true', 'aria-label': 'Yüklənir' }, rows);
  }

  function stateView(e, retry) {
    var code = e && e.code, title, ic = 'alert';
    if (code === 'unavailable') { title = 'Kitabxana yalnız canlı saytda işləyir'; ic = 'globe'; }
    else if (code === 'bad_code') { title = 'Giriş kodu lazımdır'; ic = 'lock'; }
    else if (code === 'network') { title = 'Bağlantı yoxdur'; ic = 'globe'; }
    else if (code === 'not_found') { title = 'Səhifə tapılmadı'; ic = 'search'; }
    else title = 'Kitabxana cavab vermədi';
    var actions = [];
    if (code === 'bad_code') actions.push(h('button', { class: 'btn btn-sm btn-primary', type: 'button', onclick: function () { App.go('settings', { s: 'account', opt: 'code' }); } }, 'Ayarlarda kodu daxil et'));
    if (retry && code !== 'unavailable' && code !== 'not_found') actions.push(h('button', { class: code === 'bad_code' ? 'btn btn-sm btn-secondary' : 'btn btn-sm btn-primary', type: 'button', onclick: retry }, ie('refresh'), 'Yenidən cəhd et'));
    var p = code === 'unavailable'
      ? 'Mətnlər Vikimənbədən Mirzə serveri vasitəsilə gətirilir; bu ünvan statik baxışdır. Saytın canlı versiyasını açın.' + (recent().length ? ' Son açdığınız səhifələr aşağıda oflayn oxunur.' : '')
      : errText(e);
    return h('div', { class: 'library-state', role: 'status' },
      h('h3', null, h('span', { html: App.icon(ic), 'aria-hidden': 'true', style: 'display:inline-grid' }), title),
      h('p', { text: p }),
      actions.length ? h('div', { class: 'actions' }, actions) : null);
  }

  function recentSection() {
    var list = recent();
    if (!list.length) return null;
    return h('section', { class: 'library-sec library-recent', 'aria-labelledby': 'library-recent-h' },
      h('h2', { id: 'library-recent-h', text: 'Son açdıqlarınız' }),
      h('div', { class: 'library-list' }, list.map(function (x) {
        return h('button', { class: 'library-row', type: 'button', onclick: function () { openPage(x.lang, x.title); } },
          h('span', { class: 'tx' }, h('b', { text: x.displaytitle || x.title }), h('small', { text: LANGS[x.lang] + ' · ' + num(words(x.text)) + ' söz · oflayn oxunur' })),
          h('span', { class: 'end', html: App.icon('chevron', 'chev') }));
      })));
  }

  function paintHome(focusInput) {
    V.view = 'home';
    V.page.textContent = '';
    V.page.appendChild(header());
    V.page.appendChild(searchCard());
    V.results = h('div', { class: 'library-sec library-res', 'aria-live': 'polite' });
    V.page.appendChild(V.results);
    var rs = recentSection();
    if (rs) V.page.appendChild(rs);
    if (V.lastResults && V.lastResults.lang === V.lang) paintResults(V.lastResults);
    if (focusInput && V.input) { try { V.input.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }
  }

  function search(q) {
    q = String(q || '').replace(/\s+/g, ' ').trim();
    if (!q) { if (V.input) V.input.focus(); return; }
    if (q.length < 2) { toast('Ən azı 2 hərf yazın', 'info'); return; }
    V.q = q;
    if (V.view !== 'home') paintHome(false);
    // aktiv çipi yenilə
    Array.prototype.forEach.call(V.page.querySelectorAll('.library-chips .chip'), function (c) {
      var t = (TOPICS[V.lang] || []).filter(function (x) { return x.label === c.textContent; })[0];
      c.setAttribute('aria-pressed', String(!!t && t.q === q));
    });
    var g = gen, lang = V.lang, slot = V.results;
    slot.textContent = '';
    slot.appendChild(h('h2', { text: 'Axtarılır…' }));
    slot.appendChild(h('div', { class: 'library-list' }, skeletonList(5)));
    var isCat = /^(kateqoriya|category)\s*:/i.test(q);
    lib(isCat ? { op: 'cat', lang: lang, title: q } : { op: 'search', lang: lang, q: q }).then(function (items) {
      if (!alive(g) || V.results !== slot) return;
      V.lastResults = { lang: lang, q: q, cat: isCat, items: Array.isArray(items) ? items : [] };
      paintResults(V.lastResults);
    }, function (e) {
      if (!alive(g) || V.results !== slot) return;
      slot.textContent = '';
      slot.appendChild(stateView(e, function () { search(q); }));
    });
  }

  function paintResults(R) {
    var slot = V.results; if (!slot) return;
    slot.textContent = '';
    if (!R.items.length) {
      slot.appendChild(h('div', { class: 'library-state', role: 'status' },
        h('h3', { text: 'Heç nə tapılmadı' }),
        h('p', { text: '«' + short(R.q, 60) + '» üzrə ' + (R.lang === 'az' ? 'azərbaycanca' : 'ingiliscə') + ' Vikimənbədə nəticə yoxdur. Yazılışı yoxlayın, daha qısa söz yazın və ya digər dildə axtarın.' }),
        h('div', { class: 'actions' },
          h('button', { class: 'btn btn-sm btn-secondary', type: 'button', onclick: function () { V.lang = R.lang === 'az' ? 'en' : 'az'; sset('library:lang', V.lang); paintHome(false); search(R.q); } }, (R.lang === 'az' ? 'EN' : 'AZ') + ' Vikimənbədə axtar'))));
      return;
    }
    slot.appendChild(h('h2', null, h('span', { text: (R.cat ? 'Kateqoriya' : 'Nəticələr') + ' · ' + num(R.items.length) }), h('span', { style: 'text-transform:none;letter-spacing:0;font-weight:400', text: '«' + short(R.q, 40) + '»' })));
    slot.appendChild(h('div', { class: 'library-list' }, R.items.map(function (it) {
      var isCat = it.ns === 14;
      return h('button', { class: 'library-row', type: 'button', onclick: function () {
        if (isCat) { if (V.input) V.input.value = it.title; search(it.title); }
        else openPage(R.lang, it.title);
      } },
        h('span', { class: 'tx' }, isCat ? h('span', { class: 'kind', text: 'Kateqoriya' }) : null, h('b', { text: it.title }), it.snippet ? h('small', { text: it.snippet }) : null),
        h('span', { class: 'end', html: App.icon('chevron', 'chev') }));
    })));
  }

  function openPage(lang, title) {
    var g = gen;
    V.view = 'reader';
    V.sel = [];
    V.page.textContent = '';
    var back = h('button', { class: 'btn btn-ghost btn-sm library-back', type: 'button', 'aria-label': 'Nəticələrə qayıt', onclick: function () { paintHome(false); } }, ie('back'), 'Kitabxana');
    var reader = h('article', { class: 'library-reader' });
    V.page.appendChild(reader);
    reader.appendChild(h('header', { class: 'library-reader-h' }, back, h('div', { style: 'display:grid;gap:6px;min-width:0' },
      h('span', { class: 'eyebrow', text: 'Vikimənbə · ' + LANGS[lang] }),
      h('h1', { text: title }))));
    var body = h('div', { 'aria-live': 'polite', style: 'display:grid;gap:16px;min-width:0' });
    reader.appendChild(body);
    try { back.focus({ preventScroll: true, focusVisible: false }); } catch (e) { /* ignore */ }
    var hit = cachedPage(lang, title);
    if (hit) { paintReader(lang, hit, body); return; }
    body.appendChild(h('div', { 'aria-busy': 'true', 'aria-label': 'Mətn yüklənir' },
      h('div', { class: 'sk-stack' }, [80, 92, 64, 0, 88, 76, 95, 58, 0, 84, 70].map(function (w) { return w ? h('span', { class: 'skeleton text', style: 'width:' + w + '%' }) : h('span', { style: 'display:block;height:var(--s-3,12px)' }); }))));
    lib({ op: 'page', lang: lang, title: title }).then(function (d) {
      if (!alive(g) || V.view !== 'reader') return;
      if (d && d.text) remember(lang, d);
      paintReader(lang, d || {}, body);
    }, function (e) {
      if (!alive(g) || V.view !== 'reader') return;
      body.textContent = '';
      body.appendChild(stateView(e, function () { openPage(lang, title); }));
      body.appendChild(h('div', null, h('button', { class: 'btn btn-sm btn-ghost', type: 'button', onclick: function () { paintHome(false); } }, ie('back'), 'Axtarışa qayıt')));
    });
  }

  function paintReader(lang, d, body) {
    var g = gen;
    V.doc = { lang: lang, title: d.title, displaytitle: d.displaytitle || d.title, url: d.url, licence: d.licence || 'CC BY-SA 4.0 / ictimai mülkiyyət (Vikimənbə)' };
    var h1 = V.page.querySelector('.library-reader-h h1');
    if (h1) h1.textContent = V.doc.displaytitle;
    var blocks = blocksOf(d.text);
    var verse = blocks.filter(function (b) { return b.indexOf('\n') >= 0; }).length >= Math.max(2, blocks.length / 3);
    body.textContent = '';
    var meta = V.page.querySelector('.library-reader-h .meta');
    if (!meta && blocks.length) {
      meta = h('div', { class: 'meta' },
        h('span', { text: verse ? 'Nəzm' : 'Nəsr' }),
        h('span', { text: num(words(d.text)) + ' söz' }),
        h('span', { text: num(blocks.length) + (verse ? ' bənd' : ' abzas') }),
        d.truncated ? h('span', { class: 'warn', text: 'Qısaldılıb' }) : null);
      V.page.querySelector('.library-reader-h > div').appendChild(meta);
    }

    if (blocks.length) {
      body.appendChild(h('p', { class: 'library-hint', text: 'Tərcümə və ya tapşırıq üçün 1–' + MAX_SEL + ' ' + (verse ? 'bəndə' : 'abzasa') + ' toxunub seçin.' }));
      var wrap = h('div', { class: 'library-text', role: 'group', 'aria-label': 'Mətn — seçmək üçün abzasa toxunun' });
      body.appendChild(wrap);
      var shown = 0, STEP = 120;
      var more = h('div', { class: 'library-more' });
      var addMore = function () {
        var end = Math.min(blocks.length, shown + STEP);
        for (var i = shown; i < end; i++) wrap.appendChild(para(blocks[i], i, verse));
        shown = end;
        more.textContent = '';
        if (shown < blocks.length) more.appendChild(h('button', { class: 'btn btn-sm btn-secondary', type: 'button', onclick: addMore }, 'Davamını göstər (' + num(blocks.length - shown) + ')'));
      };
      addMore();
      body.appendChild(more);
    }

    var links = (d.links || []).filter(function (t) { return t !== d.title; });
    if (links.length && blocks.length < 40) {
      body.appendChild(h('section', { class: 'library-sec library-links', 'aria-labelledby': 'library-links-h' },
        h('h2', { id: 'library-links-h', text: 'Bu səhifədəki əsərlər' }),
        h('div', { class: 'library-list' }, links.slice(0, 60).map(function (t) {
          return h('button', { class: 'library-row', type: 'button', onclick: function () { openPage(lang, t); } },
            h('span', { class: 'tx' }, h('b', { text: t })), h('span', { class: 'end', html: App.icon('chevron', 'chev') }));
        }))));
    }
    if (!blocks.length && !links.length) {
      body.appendChild(h('div', { class: 'library-state' }, h('h3', { text: 'Bu səhifədə mətn yoxdur' }),
        h('p', { text: 'Bəzən Vikimənbə səhifəsi yalnız başlıq və ya keçidlərdən ibarət olur. Səhifəni Vikimənbədə açıb baxın.' })));
    }

    var src = h('div', { class: 'library-src' },
      h('span', null, 'Mənbə: ', h('a', { href: V.doc.url || '#', target: '_blank', rel: 'noopener noreferrer' }, (lang === 'az' ? 'az' : 'en') + '.wikisource.org — ' + (V.doc.title || ''), ie('external'))),
      h('span', { text: 'Lisenziya: ' + V.doc.licence }),
      d.truncated ? h('span', { text: 'Səhifə çox uzundur — ilk 60 000 simvol göstərilir.' }) : null);
    V.bar = h('div', { class: 'library-bar', hidden: true, role: 'region', 'aria-label': 'Seçilmiş parça' });
    body.appendChild(V.bar);
    body.appendChild(src);
    paintBar();
    if (blocks.length && !sget('library:hinted', false)) { sset('library:hinted', true); setTimeout(function () { if (alive(g)) say('Bir və ya bir neçə bəndə toxunun — onu tərcümə tapşırığına çevirərik.', 3200); }, 900); }
  }

  function para(text, i, verse) {
    var el = h('div', { class: 'library-p' + (verse ? ' verse' : ''), role: 'checkbox', tabindex: '0', 'aria-checked': 'false', 'data-i': String(i) }, text);
    var toggle = function () {
      var at = V.sel.indexOf(i);
      if (at >= 0) V.sel.splice(at, 1);
      else {
        if (V.sel.length >= MAX_SEL) { toast('Ən çox ' + MAX_SEL + ' abzas seçmək olar', 'info', { sub: 'Birini çıxarın və ya seçimi təmizləyin' }); return; }
        V.sel.push(i);
      }
      paintSel();
    };
    el.addEventListener('click', function () {
      // istifadəçi mətni sürüşdürüb seçirsə (kopyalamaq üçün), toxunuş sayılmasın
      var s = W.getSelection && W.getSelection();
      if (s && String(s).length > 2 && el.contains(s.anchorNode)) return;
      toggle();
    });
    el.addEventListener('keydown', function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(); } });
    el._text = text;
    return el;
  }

  function selected() {
    var order = V.sel.slice().sort(function (a, b) { return a - b; });
    var map = {};
    Array.prototype.forEach.call(V.page.querySelectorAll('.library-p'), function (el) { map[el.getAttribute('data-i')] = el; });
    return order.map(function (i) { return map[i] ? map[i]._text : ''; }).filter(Boolean);
  }

  function paintSel() {
    var order = V.sel.slice().sort(function (a, b) { return a - b; });
    Array.prototype.forEach.call(V.page.querySelectorAll('.library-p'), function (el) {
      var i = Number(el.getAttribute('data-i')), at = order.indexOf(i);
      el.setAttribute('aria-checked', String(at >= 0));
      var n = el.querySelector('.n');
      if (at >= 0) { if (!n) { n = h('span', { class: 'n', 'aria-hidden': 'true' }); el.appendChild(n); } n.textContent = String(at + 1); }
      else if (n) n.remove();
    });
    paintBar();
  }

  function paintBar() {
    var bar = V.bar; if (!bar) return;
    var parts = selected(), text = parts.join('\n\n');
    bar.textContent = '';
    bar.hidden = !parts.length;
    if (!parts.length) return;
    var long = text.length > MAX_SEL_CHARS;
    var acad = App.mode && App.mode() === 'academy';
    bar.appendChild(h('div', { class: 'cnt' },
      h('span', null, h('b', { text: parts.length + ' / ' + MAX_SEL }), ' seçildi'),
      h('span', { class: long ? 'warn' : null, text: num(words(text)) + ' söz' + (long ? ' · çox uzundur' : '') })));
    bar.appendChild(h('button', { class: 'btn btn-sm ' + (acad ? 'btn-primary' : 'btn-secondary'), type: 'button', disabled: long, onclick: function () { toTask(text); } }, 'Tapşırığa çevir'));
    bar.appendChild(h('button', { class: 'btn btn-sm ' + (acad ? 'btn-secondary' : 'btn-primary'), type: 'button', disabled: long, onclick: function () { toTranslate(text); } }, 'Tərcümədə aç'));
    bar.appendChild(h('button', { class: 'btn btn-sm btn-ghost', type: 'button', 'aria-label': 'Seçimi təmizlə', title: 'Seçimi təmizlə', onclick: function () { V.sel = []; paintSel(); } }, ie('x')));
  }

  function toTask(text) {
    var d = V.doc || {};
    var custom = {
      src: text,
      srcLang: d.lang || 'az',
      title: d.displaytitle || d.title || 'Vikimənbə mətni',
      source: 'Vikimənbə — ' + (d.title || ''),
      url: d.url || '',
      licence: d.licence || '',
      at: Date.now()
    };
    sset('academy:custom', custom);
    toast('Tapşırıq hazırdır', 'ok', { sub: '«' + short(custom.title, 48) + '» · ' + num(words(text)) + ' söz', icon: 'cap' });
    App.go('task', { custom: true });
  }

  function toTranslate(text) {
    var lang = (V.doc && V.doc.lang) || 'az';
    App.go('translate', { text: text, pair: lang === 'az' ? 'az-en' : 'en-az' });
  }

  /* ------------------------------------------------------------------
     4. REGISTER
     ------------------------------------------------------------------ */
  App.register('library', {
    title: 'Kitabxana',
    icon: 'book',
    group: 'Peşəkar',
    mode: 'both',
    order: 5,
    render: function (el, params) {
      gen++;
      App.css('library', CSS);
      params = params || {};
      var lang = params.lang === 'en' || params.lang === 'az' ? params.lang : sget('library:lang', 'az');
      V = { lang: lang === 'en' ? 'en' : 'az', q: '', view: 'home', sel: [], lastResults: null };
      V.page = h('div', { class: 'page library-page' });
      el.appendChild(V.page);
      if (typeof params.title === 'string' && params.title.trim()) openPage(V.lang, params.title.trim());
      else {
        paintHome(false);
        if (typeof params.q === 'string' && params.q.trim()) { V.input.value = params.q.trim(); search(params.q); }
      }
    },
    leave: function () { gen++; V = null; }
  });
})();
