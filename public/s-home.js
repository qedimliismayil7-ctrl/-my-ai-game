/* =====================================================================
   NUANZA — s-home.js
   Screen 'home' for both modes — a new user's real, empty workspace:
     • Peşəkar  → «İş masası»: salam, bir əsas əməliyyat (tərcümə), «Son işlər»
                  (yalnız real layihələr varsa), kiçik alətlər şəbəkəsi.
     • Akademiya → «Masa»: salam, bugünkü dərs, real XP-dən rütbə kartı
                  (0 XP-də «İlk dərsinizi edin»), alətlər.
   Plain browser JS. Uses App.* from app.js and app.css components.
   ===================================================================== */
(function () {
  'use strict';
  var W = window, D = document;
  var App = W.App;
  if (!App || typeof App.register !== 'function') return;

  var h = App.h;

  /* ------------------------------------------------------------------
     1. SMALL HELPERS
     ------------------------------------------------------------------ */
  var MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avqust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'];
  var WEEKDAYS = ['bazar', 'bazar ertəsi', 'çərşənbə axşamı', 'çərşənbə', 'cümə axşamı', 'cümə', 'şənbə'];

  function ie(name) {
    if (typeof App.iconEl === 'function') return App.iconEl(name);
    var t = D.createElement('template'); t.innerHTML = App.icon(name); return t.content.firstChild;
  }
  function icTile(name, cls) { return h('span', { class: 'ic' + (cls ? ' ' + cls : ''), html: App.icon(name), 'aria-hidden': 'true' }); }
  function num(n, dec) { return App.fmt && App.fmt.num ? App.fmt.num(n, dec) : String(n); }
  function esc(s) { return App.esc ? App.esc(s) : String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fold(s) { if (App.fold) return App.fold(s); s = String(s == null ? '' : s); try { return s.toLocaleLowerCase('az'); } catch (e) { return s.toLowerCase(); } }
  function cap(s) { s = String(s || ''); var f = s.charAt(0); try { f = f.toLocaleUpperCase('az'); } catch (e) { f = f.toUpperCase(); } return f + s.slice(1); }
  function lcFirst(s) { s = String(s || ''); var f = s.charAt(0); try { f = f.toLocaleLowerCase('az'); } catch (e) { f = f.toLowerCase(); } return f + s.slice(1); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function dayKey(d) { d = d || new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function relTime(ts) { try { return App.fmt && App.fmt.rel ? App.fmt.rel(new Date(ts)) : ''; } catch (e) { return ''; } }
  function sget(k, fb) { try { var v = App.store.get(k, fb); return v === undefined ? fb : v; } catch (e) { return fb; } }
  function sset(k, v) { try { App.store.set(k, v); } catch (e) { /* storage blocked */ } }
  function profile() { try { return App.profile() || {}; } catch (e) { return { name: '', firstName: '', xp: 0, streak: 0, bestStreak: 0, dailyGoal: 30, initials: '', avatarColor: 'av-firuze' }; } }
  function firstName(p) { return String((p && (p.firstName || String(p.name || '').trim().split(/\s+/)[0])) || '').trim(); }
  /* «Sabahınız xeyir, <ad>» when a name is set; otherwise a plain «Xoş gəldiniz!» */
  function helloHtml(p, now) { var n = firstName(p); return n ? esc(greeting(now)) + ', <em>' + esc(n) + '</em>' : 'Xoş gəldiniz!'; }

  function dateLine(d) { return cap(WEEKDAYS[d.getDay()]) + ', ' + d.getDate() + ' ' + MONTHS[d.getMonth()]; }
  function greeting(d) {
    var hr = d.getHours();
    return hr >= 5 && hr < 12 ? 'Sabahınız xeyir' : hr >= 12 && hr < 18 ? 'Gününüz xeyir' : hr >= 18 && hr < 23 ? 'Axşamınız xeyir' : 'Gecəniz xeyir';
  }

  /* screens registered by other files — resolved at click time */
  function hasScreen(id) {
    try { var l = App.screens ? App.screens() : []; for (var i = 0; i < l.length; i++) if (l[i] && l[i].id === id) return true; } catch (e) { /* ignore */ }
    return false;
  }
  function goFirst(ids, params, miss) {
    for (var i = 0; i < ids.length; i++) if (ids[i] !== 'home' && hasScreen(ids[i])) { App.go(ids[i], params || {}); return true; }
    App.toast(miss || 'Bu bölmə hazırlanır', 'info', { sub: 'Prototipdə hələ açılmayıb' });
    return false;
  }

  /* companion + fx (all guarded) */
  function chatty() { try { return App.companionConfig ? App.companionConfig().chatty !== false : true; } catch (e) { return true; } }
  function nz(state, text, ms) {
    var c = App.companion; if (!c || typeof c.set !== 'function') return;
    try { c.set(state, text && chatty() ? { say: text, ms: ms || 3000 } : { ms: ms || 1600 }); } catch (e) { /* ignore */ }
  }
  function burstAt(el, kind) { try { if (App.fx && App.fx.burstAt && el && el.isConnected) App.fx.burstAt(el, kind || 'diamonds'); } catch (e) { /* ignore */ } }
  function pointOf(el) {
    try { if (el && el.isConnected) { var r = el.getBoundingClientRect(); if (r.width || r.height) return { x: r.left + r.width / 2, y: r.top + 4 }; } } catch (e) { /* ignore */ }
    return { x: W.innerWidth / 2, y: W.innerHeight * 0.4 };
  }
  function xpFly(pt, text) { try { if (App.fx && App.fx.xp) App.fx.xp(pt.x, pt.y, text); } catch (e) { /* ignore */ } }
  function medalFx(name) { try { if (App.fx && App.fx.medal) App.fx.medal(name); } catch (e) { /* ignore */ } }
  function busy(btn, on) { if (!btn) return; if (on) btn.setAttribute('aria-busy', 'true'); else btn.removeAttribute('aria-busy'); }
  function isBusy(btn) { return btn && btn.getAttribute('aria-busy') === 'true'; }

  function badge(text, cls, iconName) { return h('span', { class: 'badge' + (cls ? ' ' + cls : '') }, iconName ? ie(iconName) : null, text); }
  function skel(lines) {
    var kids = [h('span', { class: 'skeleton title' })];
    for (var i = 0; i < (lines || 3); i++) kids.push(h('span', { class: 'skeleton text', style: 'width:' + [100, 92, 78, 86, 64][i % 5] + '%' }));
    return h('div', { class: 'sk-stack', role: 'status' }, h('span', { class: 'sr-only', text: 'Yüklənir…' }), kids);
  }
  function replaceNode(oldEl, newEl) { if (oldEl && oldEl.parentNode) oldEl.parentNode.replaceChild(newEl, oldEl); return newEl; }

  /* ------------------------------------------------------------------
     2. LIFECYCLE (timers + mini Nuanza instances are cleaned on leave)
     ------------------------------------------------------------------ */
  var live = { iv: [], to: [], minis: [] };
  var leftAt = 0;
  var waved = false;
  function later(fn, ms) { var t = setTimeout(fn, ms || 0); live.to.push(t); return t; }
  function cleanup() {
    live.iv.forEach(clearInterval); live.to.forEach(clearTimeout);
    live.minis.forEach(function (m) { try { if (m && m.destroy) m.destroy(); } catch (e) { /* ignore */ } });
    live = { iv: [], to: [], minis: [] };
  }
  function mountMini(el, state) {
    if (W.Nuanza && typeof W.Nuanza.mount === 'function') {
      try {
        var m = W.Nuanza.mount(el, { size: 'mini', label: 'Nuanza — toxunun' });
        if (m) { live.minis.push(m); if (state && m.set) m.set(state, {}); return m; }
      } catch (e) { /* fall through */ }
    }
    el.textContent = '';
    el.appendChild(h('span', { class: 'medal sm', 'aria-hidden': 'true' }, h('b', { text: 'N' })));
    return null;
  }
  function firstEnter() {
    if (waved) return false;
    waved = true;
    var k = 'nuanza2:home-waved';
    try { if (W.sessionStorage.getItem(k)) return false; W.sessionStorage.setItem(k, '1'); } catch (e) { /* private mode */ }
    return true;
  }

  /* ------------------------------------------------------------------
     3. CSS (screen-scoped, tokens only)
     ------------------------------------------------------------------ */
  /* ------------------------------------------------------------------
     3. CSS (screen-scoped, tokens only)
     ------------------------------------------------------------------ */
  var CSS = [
    '.home-swap{animation:home-swap .32s var(--ease-out) both}',

    /* start card — Nuanza + one primary action */
    '.home-start{display:grid;grid-template-columns:84px minmax(0,1fr);gap:14px;align-items:center}',
    '@media (min-width:640px){.home-start{grid-template-columns:104px minmax(0,1fr);gap:22px;padding:26px 28px}}',
    '.home-start-art{position:relative;z-index:1;min-height:104px;display:grid;place-items:end center}',
    '.home-start-body{position:relative;z-index:1;display:grid;gap:8px;min-width:0}',
    '.home-start-body h2{font-size:clamp(1.25rem,1.1rem + .8vw,1.5rem);line-height:1.2}',
    '.home-start-body p{color:var(--soft);font-size:var(--fs-sm);line-height:1.55}',
    '.home-start-body .btn{justify-self:start;margin-top:4px;max-width:100%}',
    '@media (max-width:340px){.home-start{grid-template-columns:1fr}.home-start-art{min-height:0;justify-items:start}.home-start-body .btn{justify-self:stretch}}',

    /* recent work + empty state */
    '.home-recent .list-row .tx small{display:block}',
    '.home-recent .end{gap:8px}',
    '.home-recent .progress{width:64px}',
    '.home-empty{display:flex;align-items:center;gap:14px;padding:18px 20px;border:1px dashed var(--line-2);border-radius:var(--r-lg);background:transparent}',
    '.home-empty .tx{flex:1;min-width:0;display:grid;gap:2px}',
    '.home-empty .tx b{font-weight:600}',
    '.home-empty .tx small{color:var(--soft);font-size:var(--fs-sm)}',
    '.home-empty-acts{display:flex;flex-wrap:wrap;align-items:center;gap:6px 12px}',
    '@media (max-width:520px){.home-empty{flex-wrap:wrap}.home-empty-acts{width:100%}}',

    /* compact tools */
    '.home-tools{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}',
    '@media (min-width:760px){.home-tools{grid-template-columns:repeat(4,minmax(0,1fr))}}',
    '.home-tools .tile{min-height:0;padding:14px}',

    /* sheets content */
    '.home-qt-out{min-height:92px;padding:14px 16px;border:1px solid var(--line);border-radius:var(--r-md);background:var(--surface2);display:grid;gap:10px;align-content:start}',
    '.home-qt-text{font-size:1rem;line-height:1.9;overflow-wrap:anywhere;white-space:pre-wrap}',
    '.home-qt-hint{display:flex;align-items:center;gap:10px;color:var(--soft);font-size:var(--fs-sm)}',
    '.home-qt-hint svg{width:18px;height:18px;color:var(--zafaran-ink)}',
    '.home-qa-top{display:grid;grid-template-columns:auto minmax(0,1fr);gap:16px;align-items:center}',
    '.home-qa-top p{font-size:var(--fs-sm);color:var(--soft)}',
    '.home-file{display:flex;align-items:center;gap:12px;padding:12px;border:1px solid var(--line);border-radius:var(--r-md);background:var(--surface)}',
    '.home-file .tx{flex:1;min-width:0;display:grid}',
    '.home-file .tx b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.home-file .tx small{color:var(--soft)}',
    '.home-ex{display:grid;gap:6px;padding:14px 16px;border-radius:var(--r-md);background:var(--surface2)}',
    '.home-ex-src{color:var(--soft);font-size:var(--fs-sm)}',
    '.home-ex-tgt{font-family:var(--f-body);font-weight:600;font-size:1.0625rem;line-height:1.45}',
    '.home-risks{margin:0;padding-left:1.1em;display:grid;gap:4px;font-size:var(--fs-sm)}',
    /* the whole lesson sheet */
    '.home-ls{display:grid;gap:18px}',
    '.home-ls-sec{display:grid;gap:10px}',
    '.home-ls-pit{display:grid;gap:4px;padding:12px 14px;border-radius:var(--r-md);border:1px solid var(--line);background:var(--surface)}',
    '.home-ls-pit s{color:var(--nar);text-decoration-thickness:1.5px}',
    '.home-ls-pit ins{color:var(--ok);text-decoration:none;font-weight:600}',
    '.home-lq-q{font-weight:600;line-height:1.45}',
    '.home-lq-opts{display:grid;gap:8px}',
    '.home-lq-opts.locked .choice{pointer-events:none}',
    '.choice.home-lq-opt{align-items:center;padding-block:12px}',
    '.choice.home-lq-opt b{font-weight:500;line-height:1.45}',
    '.home-lq-k{flex:none;width:26px;height:26px;display:grid;place-items:center;border-radius:8px;background:var(--surface2);color:var(--soft);font:700 var(--fs-sm)/1 var(--f-body)}',
    '.choice.home-lq-opt.right{border-color:var(--ok);background:linear-gradient(var(--ok-t),var(--ok-t)),var(--surface);box-shadow:0 0 0 3px var(--ok-t)}',
    '.choice.home-lq-opt.right::after{background:var(--ok);border-color:var(--ok)}',
    '.choice.home-lq-opt.wrong{border-color:var(--nar);background:linear-gradient(var(--nar-t),var(--nar-t)),var(--surface)}',
    '.choice.home-lq-opt.wrong::after{background:var(--nar);border-color:var(--nar)}',
    '.choice.home-lq-opt.dim{opacity:.55}',

    /* academy — first-lesson card (0 XP) */
    '.home-first{display:flex;align-items:center;gap:14px;padding:16px 18px}',
    '.home-first .medal{--size:44px;flex:none}',
    '.home-first .tx{flex:1;min-width:0;display:grid;gap:2px}',
    '.home-first .tx b{font-weight:600}',
    '.home-first .tx small{color:var(--soft);font-size:var(--fs-sm);line-height:1.5}',

    /* rank card — göl medal on the deep panel (only from real XP) */
    '.home-rank{display:grid;justify-items:center;text-align:center;gap:10px;padding:24px 22px 18px}',
    '.home-rank .eyebrow{justify-content:center}',
    '.home-medal{position:relative;display:grid;place-items:center;width:128px;height:128px;margin-block:2px;padding:0;border:0;border-radius:50%;background:none;color:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:transform var(--t-base) var(--ease-spring)}',
    '@media (hover:hover){.home-medal:hover{transform:scale(1.04)}}',
    '.home-medal:active{transform:scale(.96)}',
    '.home-medal:focus-visible{outline:2px solid var(--focus);outline-offset:2px}',
    '.home-medal-glow{position:absolute;inset:16px;border-radius:50%;background:radial-gradient(circle,color-mix(in srgb,var(--firuze) 34%,transparent),transparent 70%);animation:home-breathe 4.5s var(--ease-in-out) infinite;pointer-events:none}',
    '.home-orbit{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none}',
    '.home-orbit .orb{fill:none;stroke:var(--firuze);stroke-width:1;stroke-dasharray:1.5 4.5;opacity:.5;transform-box:fill-box;transform-origin:center;animation:home-spin 70s linear infinite}',
    '.home-orbit .pip{fill:color-mix(in srgb,var(--on-deep) 24%,transparent)}',
    '.home-orbit .pip.on{fill:color-mix(in srgb,var(--firuze) 70%,transparent)}',
    '.home-orbit .pip.cur{fill:var(--deep-acc,var(--firuze));stroke:var(--deep);stroke-width:1.5}',
    '.home-medal .medal{position:relative}',
    '.home-rank h2{font-size:clamp(1.625rem,1.4rem + 1vw,2rem);line-height:1.05}',
    '.home-xp{width:min(340px,100%);display:grid;gap:7px;margin-top:2px}',
    '.home-xp-lbl{display:flex;justify-content:space-between;gap:10px;font-size:var(--fs-xs);color:var(--on-deep-soft);font-variant-numeric:tabular-nums}',
    '.home-xp-lbl b{color:var(--on-deep);font-weight:600}',
    '.home-ladder-btn{margin-top:-2px;padding:4px 8px;border:0;border-radius:var(--r-sm);background:none;color:var(--deep-acc,var(--firuze));font:600 var(--fs-xs)/1.2 var(--f-body);cursor:pointer}',
    '.home-ladder-btn:hover{background:color-mix(in srgb,var(--on-deep) 10%,transparent)}',
    '.home-first .home-ladder-btn{color:var(--firuze);justify-self:start;padding-inline:0}',
    '.home-first .home-ladder-btn:hover{background:none;text-decoration:underline}',
    '.card.lacquer .home-rank-chips .badge{background:color-mix(in srgb,var(--on-deep) 10%,transparent);color:var(--on-deep)}',
    '.home-lock{display:inline-grid;place-items:center;color:var(--faint)}',
    '.home-lock svg{width:16px;height:16px}',

    /* CTA — firuzə panel with a flat göl and a kilim edge */
    '.home-cta{position:relative;isolation:isolate;overflow:hidden;display:flex;align-items:center;gap:16px;width:100%;min-width:0;padding:20px;border:0;border-radius:var(--r-lg);text-align:left;cursor:pointer;color:var(--on-firuze);font:inherit;',
    '  background:radial-gradient(120% 160% at 0% 0%,color-mix(in srgb,var(--on-firuze) 10%,transparent),transparent 55%),linear-gradient(135deg,var(--firuze),color-mix(in srgb,var(--firuze) 78%,var(--lacquer)));',
    '  box-shadow:var(--sh-2);transition:transform var(--t-base) var(--ease-out),box-shadow var(--t-base)}',
    '@media (min-width:640px){.home-cta{padding:24px 26px}}',
    '.home-cta::before{content:"";position:absolute;left:0;right:0;bottom:0;height:6px;z-index:-1;pointer-events:none;background:var(--on-firuze);opacity:.22;-webkit-mask:var(--m-band) 0 100%/22px 6px repeat-x;mask:var(--m-band) 0 100%/22px 6px repeat-x}',
    '.home-cta::after{content:"";position:absolute;right:-48px;top:-54px;width:196px;height:196px;z-index:-1;background:var(--on-firuze);opacity:.12;-webkit-mask:var(--m-gul) center/contain no-repeat;mask:var(--m-gul) center/contain no-repeat;pointer-events:none}',
    '@media (hover:hover){.home-cta:hover{transform:translateY(-2px);box-shadow:var(--sh-3)}.home-cta:hover .home-cta-go{transform:translateX(4px)}}',
    '.home-cta:active{transform:scale(.99)}',
    '.home-cta-ic{width:52px;height:52px;flex:none;display:grid;place-items:center;border-radius:16px;background:color-mix(in srgb,var(--on-firuze) 12%,transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--on-firuze) 20%,transparent)}',
    '.home-cta-ic svg{width:26px;height:26px}',
    '.home-cta-tx{flex:1;min-width:0;display:grid;gap:4px}',
    '.home-cta-tx small{font-size:var(--fs-xs);font-weight:600;letter-spacing:.06em;text-transform:uppercase;opacity:.8}',
    '.home-cta-tx b{font-family:var(--f-display);font-size:1.125rem;font-weight:600;line-height:1.25}',
    '@media (min-width:640px){.home-cta-tx b{font-size:1.3rem}}',
    '.home-cta-tx span{font-size:var(--fs-sm);opacity:.9}',
    '.home-cta-go{width:40px;height:40px;flex:none;display:grid;place-items:center;border-radius:50%;background:color-mix(in srgb,var(--on-firuze) 14%,transparent);transition:transform var(--t-base) var(--ease-spring)}',
    '.home-cta-go svg{width:20px;height:20px}',
    '.home-cta[aria-busy="true"]{pointer-events:none}',
    '.home-cta[aria-busy="true"] .home-cta-go svg{display:none}',
    '.home-cta[aria-busy="true"] .home-cta-go::after{content:"";width:18px;height:18px;border-radius:50%;border:2px solid currentColor;border-right-color:transparent;animation:spin .7s linear infinite}',

    /* keyframes */
    '@keyframes home-spin{to{transform:rotate(360deg)}}',
    '@keyframes home-breathe{0%,100%{opacity:.55;transform:scale(.94)}50%{opacity:1;transform:scale(1.05)}}',
    '@keyframes home-swap{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}'
  ].join('\n');

  /* ------------------------------------------------------------------
     4. DATA — only real, stored user data (nothing invented)
     ------------------------------------------------------------------ */
  var RANK_NOTES = {
    'Şagird': 'Öyrənir, qaydaları tanıyır',
    'Katib': 'Səliqəli, səhvsiz yazır',
    'Münşi': 'Məktub və sənəd qurur',
    'Mirzə': 'Rəsmi sənədi təhvilə hazırlayır',
    'Dilmanc': 'Dillər arasında körpü olur',
    'Ustad': 'Başqalarını öyrədir'
  };

  function pairLabel(id) {
    var pairs = (App.data && App.data.PAIRS) || App.PAIRS || [];
    for (var i = 0; i < pairs.length; i++) if (pairs[i] && pairs[i].id === id) return pairs[i].label;
    var m = String(id || '').split('-');
    return m.length === 2 ? m[0].toUpperCase() + ' → ' + m[1].toUpperCase() : String(id || '');
  }

  /* Real projects, read exactly the way s-projects.js stores them: the 'pj:created' list
     minus 'pj:removed', with 'pj:prog' / 'pj:status' overrides. The labelled sample
     («Nümunə layihə») never counts here. */
  function isSample(p) { return !!(p && (p.sample || p.isSample || p.demo || p.kind === 'sample' || /^(sample|demo|numune)/i.test(String(p.id || '')))); }
  function pjApi(name) { return typeof App.projects === 'function' && typeof App.projects[name] === 'function' ? App.projects[name] : null; }
  function realProjects() {
    var list = null;
    /* preferred: the Projects screen's own API (sample already excluded) */
    if (typeof App.projects === 'function') { try { list = App.projects(); } catch (e) { list = null; } }
    if (!Array.isArray(list)) { list = sget('pj:created', []); if (!Array.isArray(list)) list = []; }
    var removed = sget('pj:removed', {}) || {}, prog = sget('pj:prog', {}) || {}, status = sget('pj:status', {}) || {};
    var last = sget('pj:last', null);
    var out = list.filter(function (p) { return p && p.id && p.name && !removed[p.id] && !isSample(p); }).map(function (p) {
      var done = typeof prog[p.id] === 'number' ? prog[p.id] : (Number(p.done) || 0);
      return { id: String(p.id), name: String(p.name), pair: p.pair || 'en-az', words: Number(p.words) || 0,
        done: clamp(Math.round(done), 0, 100), status: status[p.id] || p.status || 'active', created: Number(p.created) || 0 };
    });
    /* the project opened last comes first, the rest newest first */
    out.sort(function (a, b) { return (b.id === last) - (a.id === last) || b.created - a.created; });
    return out;
  }

  /* ------------------------------------------------------------------
     5. PRO MODE — «İş masası»
     ------------------------------------------------------------------ */
  function isLive() { return !!(App.isLive && App.isLive()); }

  function renderPro(page, post) {
    var p = profile(), now = new Date(), P = realProjects();
    var search = h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Axtar və keç', onclick: function () { if (App.palette) App.palette(); } }, ie('search'));
    page.appendChild(h('div', { class: 'page-h' },
      h('div', null,
        h('span', { class: 'eyebrow', text: dateLine(now) }),
        h('h1', { html: helloHtml(p, now) }),
        h('p', { text: P.length ? 'Qaldığınız yerdən davam edin və ya yeni mətnə başlayın.' : 'Mətni yapışdırın və ya sənəd yükləyin — qalanını birlikdə edək.' })),
      h('div', { class: 'actions' }, search)));

    page.appendChild(startCard(post));
    page.appendChild(P.length ? recentCard(P) : emptyProjects());
    page.appendChild(h('div', { class: 'sec-h' }, h('h2', { text: 'Alətlər' })));
    page.appendChild(proTools());
  }

  /* 5.1 the one primary action — with Nuanza beside it */
  function startCard(post) {
    var art = h('div', { class: 'home-start-art' });
    var go = h('button', { class: 'btn btn-primary', type: 'button' }, ie('translate'), 'Tərcüməyə başla');
    go.addEventListener('click', function () { goFirst(['translate'], {}, 'Tərcümə ekranı hazırlanır'); });
    post.push(function () { var m = mountMini(art, 'point'); if (m && m.set) later(function () { m.set('idle', {}); }, 1800); });
    return h('section', { class: 'card framed home-start', 'aria-labelledby': 'home-start-h' }, art,
      h('div', { class: 'home-start-body' },
        h('h2', { id: 'home-start-h', text: 'Mətni tərcümə edin' }),
        h('p', { text: 'Mətni yapışdırın və ya fayl atın. Üslubu özüm tanıyacağam, Mirzə Məclisi isə yoxlayacaq.' }),
        go));
  }

  /* 5.2 «Son işlər» — only real projects */
  function recentCard(P) {
    var rows = P.slice(0, 4).map(function (pj) {
      var delivered = pj.status === 'delivered';
      var meta = [pairLabel(pj.pair), pj.words ? num(pj.words) + ' söz' : '', pj.created ? relTime(pj.created) : ''].filter(Boolean).join(' · ');
      return h('button', { class: 'list-row', type: 'button', 'aria-label': pj.name + ' — ' + (delivered ? 'təhvil verilib' : pj.done + '% hazır') + '. Redaktorda aç',
        onclick: function () { var o = pjApi('open'); if (o) o(pj.id); else goFirst(['editor', 'projects'], { project: pj.id }, 'Redaktor hələ yüklənməyib'); } },
        icTile(delivered ? 'check' : 'file', delivered ? 'green' : 'fir'),
        h('span', { class: 'tx' }, h('b', { text: pj.name }), h('small', { text: meta })),
        h('span', { class: 'end' }, delivered ? badge('Təhvil verilib', 'green') :
          [h('span', { class: 'progress thin', 'aria-hidden': 'true' }, h('i', { style: 'width:' + pj.done + '%' })), h('span', { class: 'small muted tnum', text: pj.done + '%' })]));
    });
    return h('section', { class: 'card home-recent', 'aria-labelledby': 'home-recent-h' },
      h('div', { class: 'card-h' },
        h('div', null, h('h2', { id: 'home-recent-h', text: 'Son işlər' })),
        h('button', { class: 'link small', type: 'button', onclick: function () { goFirst(['projects'], {}, 'Layihələr bölməsi hazırlanır'); } }, 'Hamısı')),
      h('div', { class: 'list' }, rows));
  }
  function emptyProjects() {
    return h('section', { class: 'home-empty', 'aria-label': 'Layihələr' },
      icTile('folder'),
      h('span', { class: 'tx' }, h('b', { text: 'Hələ layihə yoxdur' }), h('small', { text: 'İlk layihənizi yaradın — sənəd, dil cütü və hazırdır.' })),
      h('span', { class: 'home-empty-acts' },
        h('button', { class: 'btn btn-secondary btn-sm', type: 'button', onclick: function () { var c = pjApi('create'); if (c) c(); else newProjectSheet(); } }, ie('plus'), 'Layihə yarat'),
        h('button', { class: 'link small', type: 'button', onclick: function () { var o = pjApi('openSample'); if (o) o(); else goFirst(['projects'], {}, 'Layihələr bölməsi hazırlanır'); } }, 'Nümunəyə baxın')));
  }

  /* 5.3 compact tools */
  function proTools() {
    var items = [
      { t: 'Sürətli tərcümə', s: 'Bir-iki cümlə', ic: 'zap', cls: 'gold', run: quickTranslateSheet },
      { t: 'Fayl yüklə', s: 'Həcm və üslub', ic: 'upload', cls: 'green', run: uploadSheet },
      { t: 'Termin axtar', s: 'Lüğət', ic: 'search', cls: 'navy', run: termSheet },
      { t: 'Layihələr', s: 'Bütün işlər', ic: 'folder', cls: 'fir', run: function () { goFirst(['projects'], {}, 'Layihələr bölməsi hazırlanır'); } }
    ];
    return toolTiles(items, 'Alətlər');
  }
  function toolTiles(items, label) {
    return h('div', { class: 'tiles home-tools', role: 'group', 'aria-label': label }, items.map(function (it) {
      return h('button', { class: 'tile', type: 'button', onclick: function () { it.run(); } },
        icTile(it.ic, it.cls), h('span', null, h('b', { text: it.t }), h('small', { text: it.s })));
    }));
  }

  /* 5.4 sheets for the tools */
  function regSeg(withAuto, initial, onPick) {
    var regs = (App.data && App.data.REGISTERS) || App.REGISTERS || [{ id: 'danisiq', label: 'Danışıq' }, { id: 'neytral', label: 'Neytral' }, { id: 'resmi', label: 'Rəsmi' }, { id: 'huquqi', label: 'Hüquqi' }];
    var opts = (withAuto ? [{ id: 'auto', label: 'Avto' }] : []).concat(regs);
    var btns = opts.map(function (r) {
      var b = h('button', { type: 'button', 'aria-pressed': String(r.id === initial), title: r.hint || (r.id === 'auto' ? 'Üslubu mətndən özüm tanıyım' : null), 'data-reg': r.id }, r.label);
      b.addEventListener('click', function () { btns.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); onPick(r.id); });
      return b;
    });
    var el = h('div', { class: 'seg sm', role: 'group', 'aria-label': 'Üslub' }, btns);
    el.markDetected = function (id) { btns.forEach(function (x) { x.classList.toggle('detected', x.getAttribute('data-reg') === id); }); };
    return el;
  }

  /* Creation itself is done by the Projects screen (params.created → a real entry in 'pj:created'). */
  function newProjectSheet() {
    var name = h('input', { class: 'input', id: 'home-np-name', placeholder: 'Məs.: Xidmət müqaviləsi', autocomplete: 'off', autofocus: true });
    var err = h('span', { class: 'err', hidden: true }, ie('alert'), 'Layihənin adını yazın');
    name.addEventListener('input', function () { if (name.value.trim()) { name.removeAttribute('aria-invalid'); err.hidden = true; } });
    App.sheet({ title: 'Yeni layihə', body: h('div', { class: 'stack' },
      h('div', { class: 'field' }, h('label', { for: 'home-np-name' }, 'Layihənin adı'), name, err),
      h('p', { class: 'small muted', text: 'Sənədi və dil cütünü layihənin içində əlavə edəcəksiniz.' })), actions: [
      { label: 'Ləğv et', kind: 'ghost' },
      { label: 'Yarat', kind: 'primary', icon: 'plus', onClick: function () {
        var n = name.value.trim();
        if (!n) { name.setAttribute('aria-invalid', 'true'); err.hidden = false; name.focus(); return false; }
        nz('celebrate', 'Yeni layihə! Sənədi əlavə edin, terminləri özüm çıxarım.', 2800);
        setTimeout(function () { goFirst(['projects'], { created: n }, 'Layihələr bölməsi hazırlanır'); }, 200);
      } }
    ] });
  }

  function firstSentences(t, n) { var m = String(t || '').match(/[^.!?]+[.!?]+/g); return m ? m.slice(0, n).join('').trim() : String(t || ''); }
  function quickTranslateSheet() {
    var S = (App.data && App.data.SAMPLES) || App.samples || {};
    var reg = 'auto';
    var ta = h('textarea', { class: 'textarea', id: 'home-qt-src', rows: '5', placeholder: 'Mətni yapışdırın — üslubu özüm tanıyacağam', value: firstSentences(S.legal || 'The Contractor shall notify the Employer within 14 days.', 2) });
    var seg = regSeg(true, 'auto', function (r) { reg = r; });
    var out = h('div', { class: 'home-qt-out', 'aria-live': 'polite' },
      h('div', { class: 'home-qt-hint' }, ie('sparkle'), 'Tərcümə burada görünəcək. Sarı xətt — «yoxlayın», dalğalı qırmızı — «şübhəli».'));
    var samples = [['Müqavilə', S.legal, 2], ['Hesabat', S.report, 2], ['Məktub', S.letter, 3], ['Danışıq', S.casual, 3], ['Rusca', S.ru, 3]].filter(function (x) { return x[1]; });
    var chips = h('div', { class: 'chips', role: 'group', 'aria-label': 'Nümunə mətnlər' }, samples.map(function (x, i) {
      var c = h('button', { class: 'chip', type: 'button', 'aria-pressed': String(i === 0) }, x[0]);
      c.addEventListener('click', function () {
        Array.prototype.forEach.call(chips.children, function (k) { k.setAttribute('aria-pressed', String(k === c)); });
        ta.value = firstSentences(x[1], x[2]); ta.removeAttribute('aria-invalid');
      });
      return c;
    }));
    function run() {
      var text = ta.value.trim();
      if (!text) { ta.setAttribute('aria-invalid', 'true'); ta.focus(); App.toast('Mətn boşdur', 'warn', { sub: 'Bir-iki cümlə yapışdırın və ya nümunə seçin' }); return false; }
      ta.removeAttribute('aria-invalid');
      out.textContent = ''; out.appendChild(skel(3));
      nz('write', null, 1600);
      return App.fakeAI('translate', { text: text, register: reg === 'auto' ? null : reg }).then(function (r) {
        if (!out.isConnected || !r) return;
        out.textContent = '';
        if (r.ok === false) {
          out.appendChild(h('div', { class: 'home-qt-hint' }, ie('alert'), r.error || 'Mühərrik cavab vermədi. Yenidən cəhd edin.'));
          nz('sad', null, 1600);
          return;
        }
        seg.markDetected(r.detectedId || r.registerId);
        var st = r.stats || {};
        out.appendChild(h('div', { class: 'chips' },
          badge(r.pairLabel || '', 'navy', 'globe'),
          h('span', { class: 'badge gold', title: r.auto ? 'Avtomatik tanındı' : 'Əl ilə seçildi' }, ie('sparkle'), 'Üslub: ' + (r.register || '') + (r.auto ? ' · avto' : '')),
          st.high != null ? badge(st.high + ' əmin · ' + (st.mid || 0) + ' yoxlayın · ' + (st.low || 0) + ' şübhəli') : null));
        var p = h('p', { class: 'home-qt-text' });
        (r.segments || []).forEach(function (g) {
          (g.spans && g.spans.length ? g.spans : [{ t: g.t, confidence: g.confidence, note: g.note }]).forEach(function (sp) {
            p.appendChild(h('span', { class: 'conf-' + (sp.confidence || 'high'), title: sp.note || null }, sp.t));
          });
        });
        out.appendChild(p);
        out.appendChild(h('div', { class: 'conf-legend' }, h('span', { class: 'conf-high', text: 'Əmin' }), h('span', { class: 'conf-mid', text: 'Yoxlayın' }), h('span', { class: 'conf-low', text: 'Şübhəli' })));
        nz('success', 'Üslub: ' + (r.register || 'Neytral') + '. Sarı yerlərə bir də baxın.', 2600);
      });
    }
    App.sheet({ title: 'Sürətli tərcümə', wide: true, body: h('div', { class: 'stack' },
      chips,
      h('div', { class: 'field' }, h('label', { for: 'home-qt-src' }, 'Mənbə mətn'), ta),
      h('div', { class: 'field' }, h('span', { class: 'label' }, 'Üslub'), seg),
      out), actions: [
      { label: 'Redaktorda aç', kind: 'ghost', onClick: function () { var t = ta.value; setTimeout(function () { goFirst(['translate'], { text: t }, 'Tərcümə ekranı hazırlanır'); }, 60); } },
      { label: 'Tərcümə et', kind: 'primary', icon: 'translate', keepOpen: true, onClick: function () { return run(); } }
    ] });
  }

  function termSheet() {
    var G = ((App.data && App.data.GLOSSARY) || []).slice();
    var q = h('input', { class: 'input', type: 'search', placeholder: '«Employer», «Sifarişçi», «fors-major»…', 'aria-label': 'Termin axtar', autocomplete: 'off', spellcheck: 'false', autofocus: true });
    var count = h('p', { class: 'small muted', 'aria-live': 'polite' });
    var list = h('div', { class: 'list' });
    function copy(text) {
      var done = function () { App.toast('Kopyalandı', 'ok', { sub: '«' + text + '»', icon: 'copy' }); };
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, function () { App.toast('«' + text + '»', 'info', { sub: 'Brauzer buferə icazə vermədi — mətni əl ilə seçin' }); });
          return;
        }
      } catch (e) { /* fall through */ }
      App.toast('«' + text + '»', 'info', { sub: 'Bufer əlçatan deyil — mətni əl ilə seçin' });
    }
    function paint() {
      var raw = q.value.trim(), f = fold(raw);
      var res = G.filter(function (g) { return !f || fold(g.a + ' ' + g.b + ' ' + (g.d || '') + ' ' + (g.note || '')).indexOf(f) >= 0; }).slice(0, 40);
      list.textContent = '';
      if (!res.length) {
        count.textContent = 'Heç nə tapılmadı';
        list.appendChild(h('div', { class: 'empty' }, h('div', { class: 'empty-art' }),
          h('h3', { text: 'Termin tapılmadı' }),
          h('p', { text: '«' + raw + '» lüğətdə yoxdur. Əlavə etsəniz, bütün layihələrdə qoruyacağam.' }),
          h('div', { class: 'actions' }, h('button', { class: 'btn btn-primary btn-sm', type: 'button', onclick: function () {
            App.toast('Termin lüğətə əlavə olundu', 'ok', { sub: '«' + raw + '» — tərcüməsini redaktorda təsdiqləyin' });
            nz('success', 'Bu termini artıq qoruyuram.', 2200);
          } }, ie('plus'), 'Lüğətə əlavə et'))));
        return;
      }
      count.textContent = f ? res.length + ' termin tapıldı' : 'Lüğətdə ' + G.length + ' termin · yazmağa başlayın';
      res.forEach(function (g) {
        list.appendChild(h('div', { class: 'list-row' }, icTile('tag', 'gold'),
          h('span', { class: 'tx' }, h('b', null, g.a, ' → ', g.b), h('small', { text: (g.d || '') + (g.note ? ' · ' + g.note : '') })),
          h('span', { class: 'end' }, h('button', { class: 'icon-btn sm ghost', type: 'button', 'aria-label': 'Kopyala: ' + g.b, onclick: function () { copy(g.b); } }, ie('copy')))));
      });
    }
    q.addEventListener('input', paint);
    paint();
    App.sheet({ title: 'Termin axtar', body: h('div', { class: 'stack' }, h('label', { class: 'input-ic' }, ie('search'), q), count, list) });
  }

  function uploadSheet() {
    var S = (App.data && App.data.SAMPLES) || App.samples || {};
    var file = h('input', { type: 'file', hidden: true, accept: '.docx,.doc,.pdf,.xliff,.xlf,.xlsx,.pptx,.txt' });
    var dz = h('label', { class: 'dropzone' }, file, h('span', { class: 'ic fir', html: App.icon('upload'), 'aria-hidden': 'true' }),
      h('b', null, 'Faylı bura atın və ya seçin'), h('span', null, 'DOCX, PDF, XLIFF, XLSX, TXT · 20 MB-a qədər'));
    var res = h('div', { class: 'stack', 'aria-live': 'polite' });
    var sampleBtn = h('button', { class: 'link small', type: 'button' }, 'Nümunə sənədlə sınayın');
    var s;
    function sizeLabel(b) { return b > 1048576 ? num(b / 1048576, 1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB'; }
    function analyze(f) {
      if (!f) return;
      dz.hidden = true; sampleBtn.hidden = true;
      res.textContent = '';
      var st = h('span', { class: 'spinner', 'aria-hidden': 'true' });
      res.appendChild(h('div', { class: 'home-file' }, icTile('file', 'nar'), h('span', { class: 'tx' }, h('b', { text: f.name }), h('small', { text: sizeLabel(f.size || 0) + ' · analiz olunur…' })), st));
      res.appendChild(skel(4));
      nz('read', 'Sənədi oxuyuram: həcm, sahə, üslub…', 2200);
      var textP = new Promise(function (resolve) {
        var isTxt = /\.txt$/i.test(f.name) || /^text\//.test(f.type || '');
        if (isTxt && W.FileReader && f instanceof W.Blob) {
          try { var fr = new FileReader(); fr.onload = function () { resolve(String(fr.result || '').slice(0, 20000)); }; fr.onerror = function () { resolve(''); }; fr.readAsText(f); return; } catch (e) { /* fall through */ }
        }
        resolve('');
      });
      textP.then(function (txt) {
        /* Live: never present the sample text's analysis as the analysis of a real file we could not read. */
        if (!String(txt || '').trim() && W.Blob && f instanceof W.Blob && isLive()) return { ok: false, error: 'Bu faylın mətnini oxuya bilmədim — hələlik yalnız mətnli .txt faylları analiz olunur.' };
        return App.fakeAI('analyze', { text: txt || ((S.legal || '') + '\n' + (S.report || '')) });
      }).then(function (a) {
        if (!res.isConnected || !a) return;
        res.textContent = '';
        if (a.ok === false) {
          res.appendChild(h('div', { class: 'callout' }, ie('alert'), h('div', { text: a.error || 'Analiz alınmadı. Yenidən cəhd edin.' })));
          dz.hidden = false; sampleBtn.hidden = false; file.value = '';
          nz('sad', null, 1600);
          return;
        }
        var est = a.estimate || {};
        res.appendChild(h('div', { class: 'home-file' }, icTile('file', 'nar'), h('span', { class: 'tx' }, h('b', { text: f.name }), h('small', { text: sizeLabel(f.size || 0) + ' · ' + num(a.words) + ' söz' })), badge('Analiz edildi', 'green', 'check')));
        res.appendChild(h('dl', { class: 'kv' },
          h('dt', { text: 'Sahə' }), h('dd', { text: a.domain }),
          h('dt', { text: 'Üslub' }), h('dd', { text: a.register + ' · avto' }),
          h('dt', { text: 'Cümlə' }), h('dd', { text: num(a.sentences) + ' · ' + lcFirst(a.readability || '') }),
          h('dt', { text: 'Təxmini vaxt' }), h('dd', { text: num(est.hours || 0, 1) + ' saat' })));
        if (a.risks && a.risks.length) res.appendChild(h('div', { class: 'callout' }, ie('alert'), h('div', null, h('b', { text: 'Məclis nəyə baxacaq' }), h('ul', { class: 'home-risks' }, a.risks.map(function (r) { return h('li', { text: r }); })))));
        if (s) s.setActions([
          { label: 'Başqa fayl', kind: 'ghost', keepOpen: true, onClick: function () { res.textContent = ''; dz.hidden = false; sampleBtn.hidden = false; file.value = ''; s.setActions(null); } },
          { label: 'Layihə yarat', kind: 'primary', icon: 'plus', onClick: function () {
            App.toast('Layihə yaradıldı', 'ok', { sub: f.name + ' · ' + num(a.words) + ' söz · ' + a.register });
            nz('celebrate', 'Layihə hazırdır! Terminləri lüğətə çıxardım.', 2600);
            setTimeout(function () { if (hasScreen('projects')) App.go('projects', { created: f.name }); }, 500);
          } }
        ]);
        nz('point', num(a.words) + ' söz, ' + lcFirst(a.domain || '') + '. Həcmi hesabladım.', 2600);
      });
    }
    file.addEventListener('change', function () { analyze(file.files && file.files[0]); });
    ['dragenter', 'dragover'].forEach(function (ev) { dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.add('over'); }); });
    ['dragleave', 'dragend'].forEach(function (ev) { dz.addEventListener(ev, function () { dz.classList.remove('over'); }); });
    dz.addEventListener('drop', function (e) { e.preventDefault(); dz.classList.remove('over'); var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]; analyze(f); });
    sampleBtn.addEventListener('click', function () { analyze({ name: 'numune-muqavile.docx', size: 254000, type: '' }); });
    s = App.sheet({ title: 'Fayl yüklə', body: h('div', { class: 'stack' }, dz, h('p', { class: 'small muted' }, 'Faylınız yoxdur? ', sampleBtn), res) });
  }

  /* ------------------------------------------------------------------
     6. ACADEMY MODE — «Masa»
     ------------------------------------------------------------------ */
  var A = {};
  function todayXP() { var v = Number(sget('home:xp:' + dayKey(), 0)); return isFinite(v) ? v : 0; }
  function ranks() { return (App.data && App.data.RANKS) || App.RANKS || [{ name: 'Şagird', min: 0 }, { name: 'Katib', min: 400 }, { name: 'Münşi', min: 1200 }, { name: 'Mirzə', min: 2500 }, { name: 'Dilmanc', min: 5000 }, { name: 'Ustad', min: 10000 }]; }
  function rankInfo(p) {
    if (p.rankInfo) return p.rankInfo;
    if (App.rank) return App.rank(p.xp);
    var R = ranks(), xp = Number(p.xp) || 0, i = 0;
    for (var k = 0; k < R.length; k++) if (xp >= R[k].min) i = k;
    var nx = R[i + 1] || null;
    return { name: R[i].name, index: i, xp: xp, nextName: nx ? nx.name : null, toNext: nx ? nx.min - xp : 0, progress: nx ? (xp - R[i].min) / (nx.min - R[i].min) : 1 };
  }

  function addXP(n, pt) {
    var p = profile(), before = rankInfo(p).name;
    var np = null;
    try { np = App.setProfile({ xp: (Number(p.xp) || 0) + n }); } catch (e) { /* ignore */ }
    sset('home:xp:' + dayKey(), todayXP() + n);
    xpFly(pt, '+' + n + ' XP');
    var after = np ? rankInfo(np).name : before;
    if (after !== before) setTimeout(function () { medalFx(after); nz('celebrate', 'Yeni rütbə: ' + after + '!', 3400); }, 700);
    refreshAcademy();
  }
  function refreshAcademy() {
    var p = profile();
    if (A.rank && A.rank.isConnected) A.rank = replaceNode(A.rank, rankBlock(p));
    if (A.cta && A.cta.isConnected) A.cta = replaceNode(A.cta, ctaButton());
    if (A.sub && A.sub.isConnected) A.sub.textContent = academySub(p);
  }
  function academySub(p) {
    var t = todayXP(), g = p.dailyGoal || 30, s = Number(p.streak) || 0;
    if (!(Number(p.xp) > 0)) return 'Gündə bir qısa dərs kifayətdir. Başlayaq?';
    if (t >= g) return 'Bugünkü hədəf tamamdır: ' + t + ' XP.' + (s > 1 ? ' Seriya: ' + s + ' gün.' : '');
    return 'Bugünkü hədəf: ' + t + ' / ' + g + ' XP.' + (s > 1 ? ' Seriya: ' + s + ' gün.' : '');
  }

  function renderAcademy(page, post) {
    var p = profile(), now = new Date();
    A = {};
    A.sub = h('p', { text: academySub(p) });
    page.appendChild(h('div', { class: 'page-h' },
      h('div', null,
        h('span', { class: 'eyebrow', text: 'Akademiya · ' + dateLine(now) }),
        h('h1', { html: helloHtml(p, now) }),
        A.sub)));
    A.cta = ctaButton();
    page.appendChild(A.cta);
    A.rank = rankBlock(p);
    page.appendChild(A.rank);
    page.appendChild(h('div', { class: 'sec-h' }, h('h2', { text: 'Alətlər' })));
    page.appendChild(toolsGrid());
  }

  /* 6.1 rank — only from real XP; at 0 XP a small «İlk dərsinizi edin» card */
  function rankBlock(p) { return Number(p.xp) > 0 ? rankCard(p) : firstLessonCard(); }
  function firstLessonCard() {
    var R = ranks(), r = rankInfo({ xp: 0 });
    return h('section', { class: 'card home-first', 'aria-labelledby': 'home-first-h' },
      h('span', { class: 'medal sm', 'aria-hidden': 'true' }, h('b', { text: R[0].name.charAt(0) })),
      h('span', { class: 'tx' },
        h('b', { id: 'home-first-h', text: 'İlk dərsinizi edin' }),
        h('small', { text: 'Hər dərs XP gətirir. İlk XP ilə «' + R[0].name + '» rütbəsindən yolunuz başlayır.' }),
        h('button', { class: 'home-ladder-btn', type: 'button', onclick: function () { ranksSheet(r); } }, 'Rütbə yolu')));
  }

  /* 6.1 rank — carpet medallion */
  function orbitSvg(n, cur) {
    var R = 66, s = '<svg class="home-orbit" viewBox="-72 -72 144 144" aria-hidden="true" focusable="false"><circle class="orb" r="' + R + '"/>';
    for (var i = 0; i < n; i++) {
      var a = -Math.PI / 2 + i * 2 * Math.PI / n, x = (R * Math.cos(a)).toFixed(2), y = (R * Math.sin(a)).toFixed(2), k = i === cur ? 6 : 4.2;
      s += '<rect class="pip' + (i < cur ? ' on' : i === cur ? ' cur' : '') + '" x="' + (-k / 2) + '" y="' + (-k / 2) + '" width="' + k + '" height="' + k +
        '" transform="translate(' + x + ' ' + y + ') rotate(45)"/>';
    }
    return s + '</svg>';
  }
  function rankCard(p) {
    var r = rankInfo(p), R = ranks();
    var pct = Math.round((r.progress || 0) * 100);
    var medal = h('button', { class: 'home-medal', type: 'button', 'aria-label': 'Rütbə medalı: ' + r.name + '. Toxunun' },
      h('span', { class: 'home-medal-glow', 'aria-hidden': 'true' }),
      h('span', { html: orbitSvg(R.length, r.index), style: 'display:contents' }),
      h('span', { class: 'medal lg', 'aria-hidden': 'true' }, h('b', { text: r.name.charAt(0) })));
    medal.addEventListener('click', function () {
      medalFx(r.name);
      burstAt(medal, 'diamonds');
      nz('celebrate', r.name + ' rütbəsi! ' + (r.nextName ? r.nextName + ' üçün ' + num(r.toNext) + ' XP qalıb.' : ''), 2800);
    });
    var streak = Number(p.streak) || 0, t = todayXP(), g = p.dailyGoal || 30;
    var chips = [];
    if (streak > 0) chips.push(badge(streak + ' gün ardıcıl', '', 'flame'));
    if (t > 0) chips.push(badge('Bu gün ' + Math.min(t, 9999) + ' / ' + g + ' XP', '', t >= g ? 'check' : 'star'));
    return h('section', { class: 'card lacquer home-rank', 'aria-label': 'Rütbəniz: ' + r.name },
      h('span', { class: 'eyebrow', text: 'Rütbəniz' }),
      medal,
      h('h2', { html: '<em>' + esc(r.name) + '</em>' }),
      h('div', { class: 'home-xp' },
        h('div', { class: 'progress', role: 'progressbar', 'aria-label': 'Növbəti rütbəyə qədər', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': pct }, h('i', { style: 'width:' + pct + '%' })),
        h('div', { class: 'home-xp-lbl' },
          h('span', null, h('b', { text: num(r.xp) }), ' XP'),
          h('span', { text: r.nextName ? r.nextName + ' üçün ' + num(r.toNext) + ' xal' : 'Ən yüksək rütbə' }))),
      chips.length ? h('div', { class: 'chips home-rank-chips' }, chips) : null,
      h('button', { class: 'home-ladder-btn', type: 'button', onclick: function () { ranksSheet(r); } }, 'Rütbə yolu'));
  }
  function ranksSheet(r) {
    var R = ranks();
    App.sheet({ title: 'Rütbə yolu', body: h('div', { class: 'stack' },
      h('p', { class: 'muted', text: 'Rütbələr köhnə dəftərxana ənənəsindən gəlir: şagird öyrənir, katib yazır, münşi məktub qurur, mirzə sənəd hazırlayır, dilmanc dillər arasında körpü olur, ustad isə başqalarını öyrədir.' }),
      h('div', { class: 'list' }, R.map(function (x, i) {
        var state = i < r.index ? 'done' : i === r.index ? 'cur' : 'locked';
        return h('div', { class: 'list-row home-rank-row' },
          h('span', { class: 'medal sm' + (state === 'locked' ? ' locked' : state === 'cur' ? ' pop' : ''), 'aria-hidden': 'true' }, h('b', { text: x.name.charAt(0) })),
          h('span', { class: 'tx' }, h('b', { text: x.name }), h('small', { text: (RANK_NOTES[x.name] || '') + ' · ' + num(x.min) + ' XP' })),
          h('span', { class: 'end' }, state === 'done' ? badge('Keçildi', 'green', 'check') : state === 'cur' ? badge('Siz buradasınız', 'fir') : h('span', { html: App.icon('lock'), class: 'home-lock', 'aria-label': 'Bağlıdır' })));
      }))), actions: [{ label: 'Bağla', kind: 'primary' }] });
  }


  /* 6.2 today's lesson — the first lesson not finished yet (learning material, not user data) */
  function lessonList() { var L = (App.data && App.data.LESSONS) || []; return Array.isArray(L) ? L.filter(function (x) { return x && x.id && x.title; }) : []; }
  function doneLessons() { var d = sget('home:lessons-done', {}); return d && typeof d === 'object' ? d : {}; }
  function todayLesson() {
    var L = lessonList(); if (!L.length) return null;
    var done = doneLessons(), off = Number(sget('home:lesson-off', 0)) || 0;
    var open = L.filter(function (x) { return !done[x.id]; });
    var pool = open.length ? open : L;
    return pool[((off % pool.length) + pool.length) % pool.length];
  }
  function savedLesson() { var s = sget('home:lesson', null); return s && s.day === dayKey() && s.lesson ? s.lesson : null; }
  function ctaButton() {
    var L = savedLesson(), T = L || todayLesson(), first = !(Number(profile().xp) > 0);
    var btn = h('button', { class: 'home-cta', type: 'button' },
      h('span', { class: 'home-cta-ic', html: App.icon(L ? 'book' : 'play'), 'aria-hidden': 'true' }),
      h('span', { class: 'home-cta-tx' },
        h('small', { text: L ? 'Dərsiniz hazırdır' : first ? 'İlk dərs' : 'Bugünkü dərs' }),
        h('b', { text: T ? T.title : 'Qısa dərsə başlayın' }),
        h('span', { text: T ? [T.topic, T.minutes ? T.minutes + ' dəqiqə' : '', T.xp ? '+' + T.xp + ' XP' : ''].filter(Boolean).join(' · ') : '5–7 dəqiqə' })),
      h('span', { class: 'home-cta-go', html: App.icon('arrow'), 'aria-hidden': 'true' }));
    btn.addEventListener('click', function () { lessonCTA(btn); });
    return btn;
  }
  function lessonCTA(btn) {
    var L0 = savedLesson();
    if (L0) { openLesson(L0, true); return; }
    if (isBusy(btn)) return;
    var T = todayLesson();
    busy(btn, true);
    App.fakeAI('lesson', T ? { id: T.id } : {}, 450).then(function (L) {
      busy(btn, false);
      if (L && L.ok === false) return null; /* live engine failed — fakeAI already showed the toast */
      if (!L || !L.title) throw new Error('lesson');
      var ex = (L.examples || []).length, qz = (L.quiz || []).length;
      return App.bigJob('Dərs hazırlanır', {
        text: '«' + L.title + '» — ' + L.minutes + ' dəqiqəlik dərs: ' + ex + ' nümunə, ' + qz + ' sual' + (L.task ? ' və bir tapşırıq' : '') + '. ' + (L.elderNote || ''),
        seal: 'Dərs hazırdır'
      }).then(function () { return L; });
    }).then(function (L) {
      if (!L) return;
      sset('home:lesson', { day: dayKey(), lesson: L });
      if (A.cta && A.cta.isConnected) A.cta = replaceNode(A.cta, ctaButton());
      setTimeout(function () { openLesson(L, false); }, 350);
    }, function () {
      busy(btn, false);
      App.toast('Dərs hazırlanmadı', 'err', { sub: 'Bir az sonra yenidən cəhd edin' });
    });
  }
  function openLesson(L, allowNew) {
    if (!L) return;
    var ex = (L.examples || [])[0];
    var body = h('div', { class: 'stack' },
      h('div', { class: 'chips' }, badge(L.topic || 'Dərs', 'navy'), L.level ? badge(L.level) : null, badge(L.minutes + ' dəqiqə', '', 'clock'), badge('+' + L.xp + ' XP', 'gold', 'star')),
      L.intro ? h('p', { text: L.intro }) : null,
      L.rule ? h('div', { class: 'callout' }, ie('bulb'), h('div', null, h('b', { text: 'Qayda: ' }), L.rule)) : null,
      ex ? h('div', { class: 'home-ex' }, h('span', { class: 'eyebrow plain', text: 'Nümunə' }), h('p', { class: 'home-ex-src', text: ex.src }), h('p', { class: 'home-ex-tgt', text: ex.tgt }), ex.note ? h('p', { class: 'small muted', text: ex.note }) : null) : null,
      L.elderNote ? h('p', { class: 'small muted', text: L.elderNote }) : null);
    var actions = [{ label: 'Sonra', kind: 'ghost' }];
    if (allowNew) actions.push({ label: 'Başqa mövzu', kind: 'neutral', onClick: function () {
      sset('home:lesson', null); sset('home:lesson-off', (Number(sget('home:lesson-off', 0)) || 0) + 1);
      if (A.cta && A.cta.isConnected) { A.cta = replaceNode(A.cta, ctaButton()); }
      App.toast('Başqa mövzu seçildi', 'info', { sub: 'Başlamaq üçün düyməyə toxunun' });
    } });
    actions.push({ label: 'Dərsə başla', kind: 'primary', icon: 'play', onClick: function () {
      setTimeout(function () {
        if (hasScreen('lesson') || hasScreen('lessons')) goFirst(['lesson', 'lessons'], { id: L.id, lesson: L.id }, 'Dərs ekranı hazırlanır');
        else lessonSheet(L);
      }, 60);
    } });
    App.sheet({ title: L.title, body: body, actions: actions });
  }

  /* 6.3b the whole lesson: examples, typical mistakes, a quiz with answers and a task the
     Mirzə Məclisi checks (the live engine's lesson or the demo one — same shape). */
  function lessonSheet(L) {
    var exs = (L.examples || []).filter(function (e) { return e && e.src && e.tgt; });
    var pits = (L.pitfalls || []).filter(function (x) { return x && x.wrong && x.right; });
    var qz = (L.quiz || []).filter(function (q) { return q && q.q && Array.isArray(q.options) && q.options.length >= 2 && q.answer >= 0 && q.answer < q.options.length; });
    var task = L.task && L.task.src ? L.task : null;
    var right = 0, answered = 0;
    var status = h('p', { class: 'small muted', 'aria-live': 'polite', text: qz.length + ' sual · hər birində bir cavab seçin' });
    function sec(title, kids) { return h('section', { class: 'home-ls-sec' }, h('span', { class: 'eyebrow plain', text: title }), kids); }
    function quizRow(q, i) {
      var fb = h('div', { 'aria-live': 'polite' });
      var wrap = h('div', { class: 'home-lq-opts', role: 'group', 'aria-label': 'Sual ' + (i + 1) + ' — variantlar' });
      var btns = q.options.map(function (o, k) {
        var b = h('button', { class: 'choice home-lq-opt', type: 'button' },
          h('span', { class: 'home-lq-k', 'aria-hidden': 'true', text: 'ABCDE'.charAt(k) }), h('span', null, h('b', { text: o })));
        b.addEventListener('click', function () {
          if (wrap.classList.contains('locked')) return;
          wrap.classList.add('locked');
          var ok = k === q.answer;
          btns.forEach(function (x, j) { x.setAttribute('aria-disabled', 'true'); x.classList.add(j === q.answer ? 'right' : j === k ? 'wrong' : 'dim'); });
          fb.appendChild(h('div', { class: 'callout ' + (ok ? 'green' : 'red') }, ie(ok ? 'check' : 'info'),
            h('div', null, h('b', { text: ok ? 'Düzdür! ' : 'Düzgün cavab: ' + 'ABCDE'.charAt(q.answer) + '. ' }), q.explain || '')));
          answered++; if (ok) right++;
          status.textContent = right + ' / ' + qz.length + ' düzgün' + (answered < qz.length ? ' · ' + (qz.length - answered) + ' sual qalıb' : '');
          if (answered === qz.length) quizDone(status);
        });
        wrap.appendChild(b);
        return b;
      });
      return h('div', { class: 'stack-sm' }, h('p', { class: 'home-lq-q', text: (i + 1) + '. ' + q.q }), wrap, fb);
    }
    function quizDone(el) {
      var key = 'home:lessondone:' + dayKey(), done = sget(key, {}) || {};
      if (done[L.id] != null) { App.toast('Dərs təkrarlandı', 'info', { sub: right + ' / ' + qz.length + ' düzgün · XP yalnız ilk dəfə verilir' }); return; }
      done[L.id] = right; sset(key, done);
      var all = doneLessons(); all[L.id] = true; sset('home:lessons-done', all);
      var xp = Math.max(5, Math.round((L.xp || 30) * (qz.length ? 0.5 + 0.5 * right / qz.length : 1)));
      addXP(xp, pointOf(el));
      nz(right === qz.length ? 'celebrate' : 'success', right === qz.length ? 'Hamısı düzdür — afərin!' : right + ' / ' + qz.length + '. Səhv olanlara bir də baxın.', 2600);
    }
    function taskBox() {
      var ta = h('textarea', { class: 'textarea', id: 'home-ls-ta', rows: '3', lang: L.to || 'az', placeholder: 'Tərcüməniz…' });
      var hintsBox = h('div', { class: 'stack-sm' }), res = h('div', { class: 'stack-sm', 'aria-live': 'polite' }), shown = 0;
      var hints = task.hints || [];
      var hintBtn = hints.length ? h('button', { class: 'btn btn-ghost btn-sm', type: 'button' }, ie('bulb'), 'İpucu') : null;
      if (hintBtn) hintBtn.addEventListener('click', function () {
        if (shown >= hints.length) return;
        hintsBox.appendChild(h('p', { class: 'small', text: '• ' + hints[shown++] }));
        if (shown >= hints.length) hintBtn.disabled = true;
      });
      var modelBtn = task.model ? h('button', { class: 'btn btn-ghost btn-sm', type: 'button' }, ie('eye'), 'Nümunə') : null;
      if (modelBtn) modelBtn.addEventListener('click', function () {
        modelBtn.disabled = true;
        res.appendChild(h('div', { class: 'home-ex' }, h('span', { class: 'eyebrow plain', text: 'Nümunə tərcümə' }), h('p', { class: 'home-ex-tgt', text: task.model })));
      });
      var check = h('button', { class: 'btn btn-secondary btn-sm', type: 'button' }, ie('shield'), 'Yoxla');
      check.addEventListener('click', function () {
        var text = ta.value.trim();
        if (isBusy(check)) return;
        if (text.split(/\s+/).length < 2) { ta.setAttribute('aria-invalid', 'true'); try { ta.focus(); } catch (e) { /* ignore */ } return; }
        ta.removeAttribute('aria-invalid');
        busy(check, true);
        res.textContent = ''; res.appendChild(skel(2));
        App.fakeAI('grade', { src: task.src, text: text, model: task.model || '', level: L.level, from: L.from, to: L.to }, 600).then(function (r) {
          busy(check, false);
          if (!res.isConnected) return;
          res.textContent = '';
          if (!r || r.ok === false || r.score == null) {
            res.appendChild(h('div', { class: 'callout' }, ie('alert'), h('div', { text: (r && r.error) || 'Yoxlama alınmadı. Yenidən cəhd edin.' })));
            return;
          }
          res.appendChild(h('div', { class: 'home-qa-top' }, App.ring(r.score, 'bal', null, { size: 'sm' }),
            h('div', { class: 'stack-sm' }, h('b', { text: (r.errors || []).length ? r.errors.length + ' qeyd' : 'Səhv tapılmadı' }), r.summary ? h('p', { class: 'small', text: r.summary }) : null)));
          (r.errors || []).slice(0, 3).forEach(function (e) {
            res.appendChild(h('div', { class: 'home-ls-pit' }, h('b', null, h('s', { text: e.was }), ' → ', h('ins', { text: e.now || '—' })), e.why ? h('small', { class: 'muted', text: e.why }) : null));
          });
          if (task.model && modelBtn && !modelBtn.disabled) modelBtn.click();
        }, function () { busy(check, false); res.textContent = ''; });
      });
      return sec('Tapşırıq', [
        h('p', { class: 'home-ex-src', lang: L.from || 'en', text: task.src }),
        h('div', { class: 'field' }, h('label', { class: 'sr-only', for: 'home-ls-ta', text: 'Tərcüməniz' }), ta),
        hintsBox,
        h('div', { class: 'row' }, check, hintBtn, modelBtn),
        res]);
    }
    var body = h('div', { class: 'home-ls' },
      h('div', { class: 'chips' }, badge(L.topic || 'Dərs', 'navy'), L.level ? badge(L.level) : null, badge(L.minutes + ' dəqiqə', '', 'clock'), badge('+' + L.xp + ' XP', 'gold', 'star')),
      L.intro ? h('p', { text: L.intro }) : null,
      L.rule ? h('div', { class: 'callout' }, ie('bulb'), h('div', null, h('b', { text: 'Qayda: ' }), L.rule)) : null,
      exs.length ? sec('Nümunələr', exs.map(function (e) {
        return h('div', { class: 'home-ex' }, h('p', { class: 'home-ex-src', lang: L.from || 'en', text: e.src }), h('p', { class: 'home-ex-tgt', lang: L.to || 'az', text: e.tgt }), e.note ? h('p', { class: 'small muted', text: e.note }) : null);
      })) : null,
      pits.length ? sec('Tipik səhvlər', pits.map(function (x) {
        return h('div', { class: 'home-ls-pit' }, h('b', null, h('s', { text: x.wrong }), ' → ', h('ins', { text: x.right })), x.why ? h('small', { class: 'muted', text: x.why }) : null);
      })) : null,
      qz.length ? sec('Suallar', [status].concat(qz.map(quizRow))) : null,
      task ? taskBox() : null,
      L.summary ? h('div', { class: 'callout green' }, ie('star'), h('div', null, h('b', { text: 'Yadda saxlayın: ' }), L.summary)) : null);
    App.sheet({ title: L.title, wide: true, body: body, actions: [{ label: 'Bağla', kind: 'ghost' }] });
    nz('read', 'Nümunələrə baxın, sonra suallara keçin.', 2200);
  }

  /* 6.3 tools */
  function toolsGrid() {
    return toolTiles([
      { t: 'Tapşırıq', s: 'Mətn tərcümə edin', ic: 'edit', cls: 'fir', run: function () { goFirst(['task', 'practice'], {}, 'Tapşırıq bölməsi hazırlanır'); } },
      { t: 'Məşq', s: 'Qısa oyunlar', ic: 'target', cls: 'navy', run: function () { goFirst(['practice'], {}, 'Məşq bölməsi hazırlanır'); } },
      { t: 'Səhv kartları', s: 'Təkrar', ic: 'cards', cls: 'gold', run: function () { goFirst(['cards'], {}, 'Kartlar bölməsi hazırlanır'); } },
      { t: 'Termin lüğəti', s: 'Axtarış', ic: 'tag', cls: 'green', run: termSheet }
    ], 'Alətlər');
  }

  /* ------------------------------------------------------------------
     7. NUANZA REACTS ON ENTER — greets by name only when one is set
     ------------------------------------------------------------------ */
  function react(mode) {
    if (!sget('onboarded', false)) return;
    var p = profile(), n = firstName(p), hi = n ? 'Salam, ' + n + '!' : 'Salam!';
    var fresh = !(Number(p.xp) > 0);
    if (firstEnter()) {
      /* The shell greets with a wave right after start; only wave here when home is reached later. */
      var t = W.performance && W.performance.now ? W.performance.now() : 99999;
      if (t < 2600) return;
      later(function () {
        nz('wave', mode === 'academy' ? hi + (fresh ? ' İlk dərsə hazırsınız?' : ' Bu gün bir dərs?') : hi + ' Masanız hazırdır.', 3200);
      }, 450);
      return;
    }
    later(function () {
      if (mode === 'academy') {
        var tx = todayXP(), g = p.dailyGoal || 30;
        if (fresh) nz('point', 'İlk dərs 5–7 dəqiqədir. Başlayaq?', 2600);
        else if (tx >= g) nz('success', 'Bugünkü hədəf tamamdır. Əla iş!', 2600);
        else nz('idle', 'Hədəfə ' + (g - tx) + ' XP qalıb.', 2400);
      } else {
        nz('point', realProjects().length ? 'Qaldığınız yerdən davam edək?' : 'Mətni yapışdırın — üslubu özüm tanıyacağam.', 2600);
      }
    }, 380);
  }

  /* ------------------------------------------------------------------
     8. REGISTER
     ------------------------------------------------------------------ */
  App.register('home', {
    title: function (m) { return m === 'academy' ? 'Masa' : 'İş masası'; },
    icon: 'home',
    group: 'Peşəkar',
    mode: 'both',
    render: function (el, params) {
      var rerender = leftAt && Date.now() - leftAt < 150;
      leftAt = 0;
      cleanup();
      App.css('home', CSS);
      var m = App.mode ? App.mode() : 'pro';
      var page = h('div', { class: 'page home-' + m });
      el.appendChild(page);
      var post = [];
      if (m === 'academy') renderAcademy(page, post, params || {});
      else renderPro(page, post, params || {});
      post.forEach(function (fn) { try { fn(); } catch (e) { /* ignore */ } });
      if (!rerender) react(m);
    },
    leave: function () { leftAt = Date.now(); cleanup(); A = {}; }
  });
})();