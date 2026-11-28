/* =====================================================================
   MIRZƏ — s-home.js
   Screen 'home' for both modes, built only from the user's real data:
     • İş masası  → greeting + one question; «Davam et» (the last edited project, one primary
                    action), «Son layihələr» (list-table), «Yoxlama növbəsi» (open QA notes / not yet
                    checked), «Akademiya vəziyyəti» (one progress line, weak areas), compact tools.
     • Akademiya → greeting; next lesson, progress line, weak areas (analytic list), cards due, practice.
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
  /* Speech policy: «Normal» (default) — only outcomes (done, problem found); «Çox» — everything; «Sakit» — nothing. */
  function chatty(state) {
    var c = null; try { c = App.companionConfig ? App.companionConfig() : null; } catch (e) { c = null; }
    if (c && c.chatty === false) return false;
    var t = (c && c.talk) || 'normal';
    return t === 'cox' || (t !== 'sakit' && /^(success|worried|sad|celebrate)$/.test(state || ''));
  }
  function nz(state, text, ms) {
    var c = App.companion; if (!c || typeof c.set !== 'function') return;
    try { c.set(state, text && chatty(state || 'idle') ? { say: text, ms: ms || 3000 } : { ms: ms || 1600 }); } catch (e) { /* ignore */ }
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
    '.home-page{container-type:inline-size;gap:0}',
    '.home-swap{animation:fade-in var(--t-slow) var(--ease-out) both}',
    /* hero — a greeting and one question, nothing else */
    '.home-hero{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:12px 24px;padding:8px 0 24px}',
    '.home-hero-tx{display:grid;gap:4px;min-width:0}',
    '.home-hello{font-family:var(--f-display);font-size:var(--t-h1);line-height:1.2727;font-weight:600;letter-spacing:-.016em;color:var(--ink)}',
    '@media (min-width:768px){.home-hello{font-size:var(--t-display);line-height:1.2143}}',
    '.home-q{font-size:var(--t-h3);line-height:1.3333;color:var(--soft)}',
    '.home-hero-acts{display:flex;flex-wrap:wrap;gap:8px}',
    /* layout: main column + side column on wide containers */
    '.home-grid{display:grid;gap:28px;align-items:start}',
    '@container (min-width:860px){.home-grid{grid-template-columns:minmax(0,1fr) 300px;gap:32px 40px}}',
    '.home-col{display:grid;gap:28px;min-width:0;align-content:start}',
    '.home-sec{display:grid;gap:10px;min-width:0}',
    '.home-sec-h{display:flex;align-items:baseline;justify-content:space-between;gap:12px;min-width:0;padding-bottom:8px;border-bottom:1px solid var(--line)}',
    '.home-sec-h h2{font:600 var(--t-caption)/1.3333 var(--f-body);letter-spacing:.04em;text-transform:uppercase;color:var(--soft)}',
    '.home-sec-h .meta{font-size:var(--t-caption);color:var(--faint);font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.home-sec-h .link{font-size:var(--t-caption)}',
    '.home-sec-h + .home-list,.home-sec-h + .home-tbl{margin-top:-10px}',
    /* «Davam et» — the one card on the page */
    '.home-cont{display:flex;flex-wrap:wrap;align-items:center;gap:16px 24px;padding:16px 20px;border:1px solid var(--line);border-radius:var(--r-lg);background:var(--surface)}',
    '.home-cont-tx{flex:1 1 280px;min-width:0;display:grid;gap:6px}',
    '.home-cont-tx h3{font-size:var(--t-h3);line-height:1.3333;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.home-cont-meta{display:flex;flex-wrap:wrap;align-items:center;gap:4px 10px;color:var(--soft);font-size:var(--t-small)}',
    '.home-cont-meta .sep{width:3px;height:3px;border-radius:50%;background:var(--line-2)}',
    '.home-cont-bar{display:flex;align-items:center;gap:10px;max-width:360px}',
    '.home-cont-bar .progress{flex:1}',
    '.home-cont-bar span{font-size:var(--t-caption);color:var(--soft);font-variant-numeric:tabular-nums;min-width:32px;text-align:right}',
    '@media (max-width:520px){.home-cont{padding:14px 16px}.home-cont .btn{flex:1}}',
    '.home-mono{font-family:var(--f-mono);font-size:var(--t-caption);letter-spacing:.01em}',
    /* empty line */
    '.home-empty{display:flex;flex-wrap:wrap;align-items:center;gap:8px 16px;padding:14px 16px;border:1px dashed var(--line-2);border-radius:var(--r-lg)}',
    '.home-empty .tx{flex:1 1 260px;min-width:0;font-size:var(--t-small);color:var(--soft);line-height:1.5}',
    '.home-empty .tx b{color:var(--ink);font-weight:600}',
    '.home-empty-acts{display:flex;flex-wrap:wrap;align-items:center;gap:8px 14px}',
    '.home-none{padding:10px 0 0;font-size:var(--t-small);color:var(--soft);line-height:1.5}',
    '.home-none b{color:var(--ink);font-weight:500}',
    /* list-table hybrid (recent projects) */
    '.home-tbl{display:grid;min-width:0}',
    '.home-tr{position:relative;isolation:isolate;display:grid;grid-template-columns:minmax(0,1fr) 76px 64px 120px 92px;gap:16px;align-items:center;padding:0}',
    '.home-th{min-height:32px;color:var(--faint);font:500 var(--t-micro)/1.2 var(--f-body);letter-spacing:.04em;text-transform:uppercase;border-bottom:1px solid var(--line)}',
    '.home-th .r,.home-tr .r{text-align:right}',
    'button.home-tr{width:100%;min-height:48px;padding-block:6px;border:0;border-bottom:1px solid var(--line);border-radius:0;background:none;color:inherit;text-align:left;font:inherit;cursor:pointer}',
    'button.home-tr::before,button.home-row::before{content:"";position:absolute;inset:1px -8px;z-index:-1;border-radius:var(--r-sm);background:var(--hover);opacity:0;transition:opacity var(--t-fast)}',
    'button.home-tr:last-child{border-bottom:0}',
    '@media (hover:hover){button.home-tr:hover::before,button.home-row:hover::before{opacity:1}}',
    'button.home-tr:focus-visible{outline:2px solid var(--focus);outline-offset:-2px;border-radius:var(--r-sm)}',
    '.home-nm{display:grid;gap:1px;min-width:0}',
    '.home-nm b{font-size:var(--t-body);font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.home-nm small{font-size:var(--t-caption);color:var(--soft);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.home-cell{font-size:var(--t-small);color:var(--soft);font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.home-prog{display:flex;align-items:center;gap:8px}',
    '.home-prog .progress{flex:1}',
    '.home-prog span{width:32px;text-align:right;font-size:var(--t-caption);color:var(--soft);font-variant-numeric:tabular-nums}',
    '.home-due.late{color:var(--danger);font-weight:500}',
    '.home-due.soon{color:var(--zafaran-ink);font-weight:500}',
    '@container (max-width:599px){',
    '  .home-th{display:none}',
    '  .home-tr{grid-template-columns:minmax(0,1fr) 84px;gap:2px 12px}',
    '  .home-tr .c-pair,.home-tr .c-words{display:none}',
    '  .home-tr .home-due{grid-column:1;grid-row:2;font-size:var(--t-caption)}',
    '  .home-tr .home-prog{grid-column:2;grid-row:1 / span 2}',
    '  button.home-tr .home-nm small{display:none}',
    '}',
    /* compact rows (queue, academy, tools) */
    '.home-list{display:grid;min-width:0}',
    '.home-row{position:relative;isolation:isolate;display:flex;align-items:center;gap:12px;width:100%;min-width:0;min-height:44px;padding:6px 0;border:0;border-bottom:1px solid var(--line);background:none;color:inherit;text-align:left;font:inherit}',
    '.home-row:last-child{border-bottom:0}',
    'button.home-row{cursor:pointer}',
    'button.home-row:focus-visible{outline:2px solid var(--focus);outline-offset:-2px;border-radius:var(--r-sm)}',
    '.home-row > svg{width:16px;height:16px;color:var(--soft);flex:none}',
    '.home-row .tx{flex:1;min-width:0;display:grid;gap:1px}',
    '.home-row .tx b{font-size:var(--t-small);font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.home-row .tx small{font-size:var(--t-caption);color:var(--soft);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.home-row .end{flex:none;display:flex;align-items:center;gap:8px;color:var(--soft);font-size:var(--t-caption);font-variant-numeric:tabular-nums}',
    '.home-row .chev{width:14px;height:14px;color:var(--faint)}',
    /* academy status line */
    '.home-ac{display:grid;gap:8px;padding-top:2px}',
    '.home-ac-top{display:flex;align-items:baseline;justify-content:space-between;gap:12px;font-size:var(--t-small)}',
    '.home-ac-top b{font-weight:600}',
    '.home-ac-top span{color:var(--soft);font-variant-numeric:tabular-nums}',
    '.home-ac-sub{display:flex;flex-wrap:wrap;justify-content:space-between;gap:4px 12px;font-size:var(--t-caption);color:var(--soft);font-variant-numeric:tabular-nums}',
    /* weak areas — an analytic list */
    '.home-weak{display:grid;gap:8px;padding-top:4px;max-width:560px}',
    '.home-wk{display:grid;grid-template-columns:minmax(0,1fr) 88px 36px;align-items:center;gap:10px;font-size:var(--t-small)}',
    '.home-wk > span:first-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.home-wk b{font-weight:500;text-align:right;font-variant-numeric:tabular-nums;color:var(--soft)}',
    /* tools */
    '.home-tools{display:flex;flex-wrap:wrap;gap:8px}',
    /* sheets content */
    '.home-qt-out{min-height:92px;padding:12px 14px;border:1px solid var(--line);border-radius:var(--r-md);background:var(--surface2);display:grid;gap:10px;align-content:start}',
    '.home-qt-text{font-size:var(--t-body);line-height:1.9;overflow-wrap:anywhere;white-space:pre-wrap}',
    '.home-qt-hint{display:flex;align-items:center;gap:10px;color:var(--soft);font-size:var(--t-small)}',
    '.home-qt-hint svg{width:16px;height:16px;color:var(--soft)}',
    '.home-qa-top{display:grid;grid-template-columns:auto minmax(0,1fr);gap:16px;align-items:center}',
    '.home-qa-top p{font-size:var(--t-small);color:var(--soft)}',
    '.home-file{display:flex;align-items:center;gap:12px;padding:10px 12px;border:1px solid var(--line);border-radius:var(--r-md);background:var(--surface)}',
    '.home-file .tx{flex:1;min-width:0;display:grid}',
    '.home-file .tx b{font-size:var(--t-small);font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.home-file .tx small{color:var(--soft)}',
    '.home-ex{display:grid;gap:6px;padding:12px 14px;border-radius:var(--r-md);background:var(--surface2)}',
    '.home-ex-src{color:var(--soft);font-size:var(--t-small)}',
    '.home-ex-tgt{font-weight:500;font-size:var(--t-body);line-height:1.5}',
    '.home-risks{margin:0;padding-left:1.1em;display:grid;gap:4px;font-size:var(--t-small)}',
    '.home-ls{display:grid;gap:18px}',
    '.home-ls-sec{display:grid;gap:10px}',
    '.home-ls-pit{display:grid;gap:4px;padding:10px 12px;border-radius:var(--r-md);border:1px solid var(--line);background:var(--surface)}',
    '.home-ls-pit s{color:var(--nar);text-decoration-thickness:1.5px}',
    '.home-ls-pit ins{color:var(--ok);text-decoration:none;font-weight:600}',
    '.home-lq-q{font-weight:600;line-height:1.45}',
    '.home-lq-opts{display:grid;gap:8px}',
    '.home-lq-opts.locked .choice{pointer-events:none}',
    '.choice.home-lq-opt{align-items:center;padding-block:10px}',
    '.choice.home-lq-opt b{font-weight:500;line-height:1.45}',
    '.home-lq-k{flex:none;width:22px;height:22px;display:grid;place-items:center;border-radius:var(--r-xs);background:var(--surface2);color:var(--soft);font:500 var(--t-micro)/1 var(--f-mono)}',
    '.choice.home-lq-opt.right{border-color:var(--ok);background:color-mix(in srgb,var(--ok) 7%,var(--surface))}',
    '.choice.home-lq-opt.right::after{background:var(--ok);border-color:var(--ok)}',
    '.choice.home-lq-opt.wrong{border-color:var(--nar);background:color-mix(in srgb,var(--nar) 6%,var(--surface))}',
    '.choice.home-lq-opt.wrong::after{background:var(--nar);border-color:var(--nar)}',
    '.choice.home-lq-opt.dim{opacity:.55}',
    '.home-lock{display:inline-grid;place-items:center;color:var(--faint)}',
    '.home-lock svg{width:15px;height:15px}',
    '.home-cta[aria-busy="true"]{pointer-events:none}'
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
      var due = p.due ? new Date(p.due) : null;
      return { id: String(p.id), name: String(p.name), pair: p.pair || 'en-az', words: Number(p.words) || 0,
        done: clamp(Math.round(done), 0, 100), status: status[p.id] || p.status || 'active', created: Number(p.created) || 0,
        due: due && !isNaN(due) ? due : null, client: p.client ? String(p.client) : '', qa: typeof p.qa === 'number' ? p.qa : null };
    });
    /* the project opened last comes first, the rest newest first */
    out.sort(function (a, b) { return (b.id === last) - (a.id === last) || b.created - a.created; });
    return out;
  }

  /* ------------------------------------------------------------------
     5. PRO MODE — «İş masası»
     ------------------------------------------------------------------ */
  function isLive() { return !!(App.isLive && App.isLive()); }

  /* hero: «Sabahınız xeyir, <ad>.» (no name → «Xoş gəldiniz.») + one question */
  function helloText(p, now) { var n = firstName(p); return n ? greeting(now) + ', ' + n + '.' : 'Xoş gəldiniz.'; }
  function hero(p, now, question, acts) {
    return h('header', { class: 'home-hero' },
      h('div', { class: 'home-hero-tx' },
        h('h1', { class: 'home-hello', text: helloText(p, now) }),
        h('p', { class: 'home-q', text: question })),
      acts && acts.length ? h('div', { class: 'home-hero-acts' }, acts) : null);
  }
  function secHead(id, title, right) {
    return h('div', { class: 'home-sec-h' }, h('h2', { id: id, text: title }), right || null);
  }
  function sec(id, title, right, body) {
    return h('section', { class: 'home-sec', 'aria-labelledby': id }, secHead(id, title, right), body);
  }
  function chev() { return ie('chevron'); }

  function openProject(id) { var o = pjApi('open'); if (o) o(id); else goFirst(['editor', 'projects'], { project: id }, 'Redaktor hələ yüklənməyib'); }
  function createProject() { var c = pjApi('create'); if (c) c(); else newProjectSheet(); }
  function allProjectsRaw() {
    var a = pjApi('all');
    if (a) { try { var l = a(); if (Array.isArray(l)) return l; } catch (e) { /* ignore */ } }
    return null;
  }

  function renderPro(page) {
    var now = new Date(), p = profile(), P = realProjects();
    page.appendChild(hero(p, now, 'Bu gün haradan davam edirsiniz?', [
      h('button', { class: 'btn btn-secondary', type: 'button', onclick: createProject }, ie('plus'), 'Yeni layihə')
    ]));
    var main = h('div', { class: 'home-col' },
      sec('home-cont-h', 'Davam et', null, continueBlock(P)),
      sec('home-recent-h', 'Son layihələr', recentMeta(P), P.length ? recentTable(P) : h('p', { class: 'home-none' }, h('b', { text: 'Layihə yoxdur' }), ' · Yaratdığınız layihələr burada siyahı kimi görünəcək.')),
      sec('home-tools-h', 'Alətlər', null, proTools()));
    var side = h('div', { class: 'home-col' },
      sec('home-queue-h', 'Yoxlama növbəsi', null, reviewQueue(P)),
      sec('home-ac-h', 'Akademiya vəziyyəti', h('button', { class: 'link', type: 'button', onclick: function () { toAcademy(); } }, 'Akademiya'), academyStatus(p)));
    page.appendChild(h('div', { class: 'home-grid' }, main, side));
  }
  function toAcademy() {
    try { if (App.setMode) { App.setMode('academy', { silent: true }); if (App.current && App.current() !== 'home') App.go('home'); return; } } catch (e) { /* ignore */ }
    App.go('home');
  }

  /* 5.1 «Davam et» — the most recently edited project, with one primary action */
  var DAY_MS = 86400000;
  function lastProject(P) {
    var last = sget('pj:last', null), all = allProjectsRaw() || P, pick = null;
    if (last) all.forEach(function (x) { if (x && String(x.id) === String(last) && !pick) pick = x; });
    if (!pick) P.forEach(function (x) { if (!pick && x.status !== 'delivered') pick = x; });
    return pick;
  }
  function segInfo(pj) {
    var total = Number(pj.segs) || 0, saved = sget('pj:segs:' + pj.id, null);
    if (!total) return '';
    if (Array.isArray(saved) && saved.length) {
      var next = -1;
      for (var i = 0; i < total; i++) { var s = saved[i]; if (!(s && s.ok)) { next = i; break; } }
      return next < 0 ? 'Bütün seqmentlər təsdiqlənib' : 'Seqment ' + (next + 1) + ' / ' + total;
    }
    return total + ' seqment';
  }
  function continueBlock(P) {
    var pj = lastProject(P);
    if (!pj) {
      return h('div', { class: 'home-empty' },
        h('span', { class: 'tx' }, h('b', { text: 'Layihə yoxdur' }), ' · İlk layihənizi yaradın və tərcüməyə başlayın.'),
        h('span', { class: 'home-empty-acts' },
          h('button', { class: 'btn btn-primary btn-sm', type: 'button', onclick: createProject }, ie('plus'), 'Layihə yarat'),
          h('button', { class: 'link small', type: 'button', onclick: function () { var o = pjApi('openSample'); if (o) o(); else goFirst(['projects'], {}, 'Layihələr bölməsi hazırlanır'); } }, 'Nümunə layihəni açın')));
    }
    var delivered = pj.status === 'delivered', done = clamp(Math.round(Number(pj.done) || 0), 0, 100);
    var meta = [h('span', { class: 'home-mono', text: pairLabel(pj.pair) })];
    [pj.field || pj.client || '', segInfo(pj), pj.sample ? 'Nümunə' : ''].filter(Boolean).forEach(function (t) { meta.push(h('i', { class: 'sep', 'aria-hidden': 'true' })); meta.push(h('span', { text: t })); });
    return h('div', { class: 'home-cont' },
      h('div', { class: 'home-cont-tx' },
        h('h3', { text: pj.name }),
        h('div', { class: 'home-cont-meta' }, meta),
        h('div', { class: 'home-cont-bar' },
          h('span', { class: 'progress' + (delivered ? ' green' : ''), role: 'progressbar', 'aria-label': 'Hazırlıq', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': delivered ? 100 : done }, h('i', { style: 'width:' + (delivered ? 100 : done) + '%' })),
          h('span', { text: (delivered ? 100 : done) + '%' }))),
      h('button', { class: 'btn btn-primary', type: 'button', onclick: function () { openProject(pj.id); } }, delivered ? 'Redaktorda aç' : 'Redaktorda davam et', ie('arrow')));
  }

  /* 5.2 recent projects — compact list-table */
  function recentMeta(P) {
    if (!P.length) return null;
    var active = P.filter(function (p) { return p.status !== 'delivered'; });
    var left = active.reduce(function (s, p) { return s + Math.round(p.words * (100 - p.done) / 100); }, 0);
    var qa = P.filter(function (p) { return typeof p.qa === 'number'; });
    var avg = qa.length ? Math.round(qa.reduce(function (s, p) { return s + p.qa; }, 0) / qa.length) : null;
    var bits = [active.length + ' aktiv', num(left) + ' söz qalır'];
    if (avg != null) bits.push('orta QA ' + avg);
    var wrap = h('span', { class: 'row', style: 'gap:12px;flex-wrap:nowrap;min-width:0' },
      h('span', { class: 'meta', text: bits.join(' · ') }),
      P.length > 6 ? h('button', { class: 'link', type: 'button', onclick: function () { goFirst(['projects'], {}, 'Layihələr bölməsi hazırlanır'); } }, 'Hamısı') : null);
    return wrap;
  }
  function dueInfo(pj) {
    if (pj.status === 'delivered') return { t: 'Təhvil verilib', c: '' };
    if (!pj.due || isNaN(pj.due)) return { t: '—', c: '' };
    var d = pj.due, now = new Date(), ms = d.getTime() - now.getTime();
    var start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    var days = Math.floor((d.getTime() - start) / DAY_MS);
    var hhmm = (d.getHours() < 10 ? '0' : '') + d.getHours() + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
    if (ms < 0) return { t: 'Gecikir', c: 'late' };
    if (days === 0) return { t: 'Bu gün ' + hhmm, c: 'late' };
    if (days === 1) return { t: 'Sabah ' + hhmm, c: 'soon' };
    return { t: d.getDate() + ' ' + MONTHS[d.getMonth()], c: '' };
  }
  function recentTable(P) {
    var rows = P.slice(0, 6).map(function (pj) {
      var delivered = pj.status === 'delivered', due = dueInfo(pj), pct = delivered ? 100 : pj.done;
      return h('button', { class: 'home-tr', type: 'button', 'aria-label': pj.name + ' — ' + (delivered ? 'təhvil verilib' : pj.done + '% hazır') + '. Redaktorda aç',
        onclick: function () { openProject(pj.id); } },
        h('span', { class: 'home-nm' }, h('b', { text: pj.name }), h('small', { text: pj.client || (pj.created ? relTime(pj.created) : '') })),
        h('span', { class: 'home-cell home-mono c-pair', text: pairLabel(pj.pair) }),
        h('span', { class: 'home-cell c-words r', text: pj.words ? num(pj.words) : '—' }),
        h('span', { class: 'home-prog' },
          h('span', { class: 'progress thin' + (delivered ? ' green' : ''), 'aria-hidden': 'true' }, h('i', { style: 'width:' + pct + '%' })),
          h('span', { text: pct + '%' })),
        h('span', { class: 'home-cell home-due ' + due.c, text: due.t }));
    });
    return h('div', { class: 'home-tbl', role: 'group', 'aria-labelledby': 'home-recent-h' },
      h('div', { class: 'home-tr home-th', 'aria-hidden': 'true' },
        h('span', { text: 'Layihə' }), h('span', { text: 'Cüt' }), h('span', { class: 'r', text: 'Söz' }), h('span', { text: 'Hazırlıq' }), h('span', { text: 'Təhvil' })),
      rows);
  }

  /* 5.3 review queue — projects with open QA notes or a finished translation not checked yet */
  function reviewQueue(P) {
    var q = P.filter(function (p) {
      if (p.status === 'delivered') return false;
      return (typeof p.qa === 'number' && p.qa < 85) || (p.qa == null && p.done >= 100);
    }).sort(function (a, b) { return (a.qa == null ? 101 : a.qa) - (b.qa == null ? 101 : b.qa); });
    if (!q.length) {
      return h('p', { class: 'home-none' }, h('b', { text: 'Növbə boşdur' }), P.length ? ' · Açıq qeydi və ya yoxlama gözləyən layihə yoxdur.' : ' · Layihələr yoxlamaya hazır olanda burada görünəcək.');
    }
    return h('div', { class: 'home-list' }, q.slice(0, 5).map(function (pj) {
      var pending = pj.qa == null;
      var why = pending ? 'Tərcümə bitib · yoxlanmayıb' : (pj.qa < 70 ? 'Kritik qeydlər var' : 'Düzəlişlər gözləyir');
      return h('button', { class: 'home-row', type: 'button', onclick: function () { goFirst(['qa', 'editor'], { project: pj.id }, 'Yoxlama bölməsi hazırlanır'); } },
        h('span', { class: 'tx' }, h('b', { text: pj.name }), h('small', { text: why })),
        h('span', { class: 'end' }, pending ? badge('Gözləyir') : badge('QA ' + pj.qa, pj.qa < 70 ? 'red' : 'gold'), chev()));
    }));
  }

  /* 5.4 academy status — one line with a progress bar; weak areas when there is data */
  var AXES = ['Məna', 'Terminologiya', 'Üslub', 'Ədəbi norma', 'Format'];
  function weakAreas() {
    var s = sget('academy:skills', null);
    if (!Array.isArray(s) || s.length < AXES.length) return [];
    return AXES.map(function (a, i) { return { t: a, v: clamp(Math.round(Number(s[i]) || 0), 0, 100) }; })
      .sort(function (a, b) { return a.v - b.v; }).filter(function (x) { return x.v < 85; }).slice(0, 3);
  }
  function weakList(list) {
    return h('div', { class: 'home-weak', role: 'list', 'aria-label': 'Zəif tərəflər' }, list.map(function (w) {
      return h('div', { class: 'home-wk', role: 'listitem' },
        h('span', { text: w.t }),
        h('span', { class: 'progress thin' + (w.v < 60 ? ' red' : w.v < 75 ? ' gold' : ''), 'aria-hidden': 'true' }, h('i', { style: 'width:' + w.v + '%' })),
        h('b', { text: w.v + '%' }));
    }));
  }
  function academyStatus(p) {
    var r = rankInfo(p), xp = Number(p.xp) || 0;
    if (!(xp > 0)) {
      return h('p', { class: 'home-none' }, h('b', { text: 'Hələ dərs keçilməyib' }), ' · Qısa dərslə başlayın — irəliləyiş burada görünəcək.');
    }
    var pct = Math.round((r.progress || 0) * 100), weak = weakAreas();
    return h('div', { class: 'home-ac' },
      h('div', { class: 'home-ac-top' }, h('b', { text: r.name }), h('span', { text: num(xp) + ' XP' })),
      h('span', { class: 'progress', role: 'progressbar', 'aria-label': 'Növbəti rütbəyə qədər', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': pct }, h('i', { style: 'width:' + pct + '%' })),
      h('div', { class: 'home-ac-sub' }, h('span', { text: r.nextName ? r.nextName + ' rütbəsinə ' + num(r.toNext) + ' XP' : 'Ən yüksək rütbə' }), h('span', { text: 'Bu gün ' + todayXP() + ' / ' + (p.dailyGoal || 30) + ' XP' })),
      weak.length ? h('div', { class: 'stack-sm', style: 'margin-top:6px' }, h('span', { class: 'caption', style: 'font-size:var(--t-micro)' }, 'Zəif tərəflər'), weakList(weak)) : null);
  }

  /* 5.5 compact tools */
  function proTools() {
    var items = [
      { t: 'Sürətli tərcümə', ic: 'zap', run: quickTranslateSheet },
      { t: 'Fayl analizi', ic: 'upload', run: uploadSheet },
      { t: 'Termin axtarışı', ic: 'search', run: termSheet },
      { t: 'QA yoxlaması', ic: 'shield', run: function () { goFirst(['qa'], {}, 'QA bölməsi hazırlanır'); } }
    ];
    return h('div', { class: 'home-tools', role: 'group', 'aria-label': 'Alətlər' }, items.map(function (it) {
      return h('button', { class: 'btn btn-secondary btn-sm', type: 'button', onclick: function () { it.run(); } }, ie(it.ic), it.t);
    }));
  }

  /* 5.6 sheets for the tools */
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
        nz('success', 'Layihə yaradıldı.', 2400);
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
      h('div', { class: 'home-qt-hint' }, ie('info'), 'Tərcümə burada görünəcək. Sarı xətt — «yoxlayın», dalğalı qırmızı — «şübhəli».'));
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
          h('span', { class: 'badge gold', title: r.auto ? 'Avtomatik tanındı' : 'Əl ilə seçildi' }, 'Üslub: ' + (r.register || '') + (r.auto ? ' · avto' : '')),
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
            nz('success', 'Layihə hazırdır. Terminlər lüğətə çıxarıldı.', 2600);
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
    if (!(Number(p.xp) > 0)) return 'Gündəlik hədəf: ' + g + ' XP';
    if (t >= g) return 'Bugünkü hədəf tamamdır: ' + t + ' XP.' + (s > 1 ? ' Seriya: ' + s + ' gün.' : '');
    return 'Bugünkü hədəf: ' + t + ' / ' + g + ' XP.' + (s > 1 ? ' Seriya: ' + s + ' gün.' : '');
  }

  function renderAcademy(page) {
    var p = profile(), now = new Date();
    A = {};
    A.sub = h('span', { class: 'meta', text: academySub(p) });
    page.appendChild(hero(p, now, 'Bu gün nə öyrənirik?', null));
    A.cta = ctaButton();
    A.rank = rankBlock(p);
    var weak = weakAreas();
    var main = h('div', { class: 'home-col' },
      sec('home-next-h', 'Növbəti dərs', null, A.cta),
      sec('home-prog-h', 'İrəliləyiş', A.sub, A.rank),
      sec('home-weak-h', 'Zəif tərəflər', hasScreen('progress') ? h('button', { class: 'link', type: 'button', onclick: function () { App.go('progress'); } }, 'Ətraflı') : null,
        weak.length ? weakList(weak) : h('p', { class: 'home-none' }, h('b', { text: 'Hələ məlumat yoxdur' }), ' · Yoxlanan ilk tapşırıqdan sonra məna, terminologiya və üslub üzrə göstəricilər görünəcək.')));
    var side = h('div', { class: 'home-col' },
      sec('home-rev-h', 'Təkrar', null, reviewCards()),
      sec('home-tools-h', 'Məşq', null, toolsGrid()));
    page.appendChild(h('div', { class: 'home-grid' }, main, side));
  }

  /* 6.1 progress — only from real XP; a simple bar, no giant numbers */
  function rankBlock(p) { return Number(p.xp) > 0 ? rankCard(p) : firstLessonCard(); }
  function firstLessonCard() {
    var R = ranks(), r = rankInfo({ xp: 0 });
    return h('div', { class: 'home-ac' },
      h('div', { class: 'home-ac-top' }, h('b', { text: R[0].name }), h('span', { text: '0 XP' })),
      h('span', { class: 'progress', 'aria-hidden': 'true' }, h('i', { style: 'width:0%' })),
      h('div', { class: 'home-ac-sub' },
        h('span', { text: 'Hər dərs və tapşırıq XP gətirir' }),
        h('button', { class: 'link', type: 'button', onclick: function () { ranksSheet(r); } }, 'Rütbə yolu')));
  }
  function rankCard(p) {
    var r = rankInfo(p);
    var pct = Math.round((r.progress || 0) * 100);
    var streak = Number(p.streak) || 0;
    return h('div', { class: 'home-ac', 'aria-label': 'Rütbəniz: ' + r.name },
      h('div', { class: 'home-ac-top' }, h('b', { text: r.name }), h('span', { text: num(r.xp) + ' XP' + (streak > 1 ? ' · ' + streak + ' gün ardıcıl' : '') })),
      h('span', { class: 'progress', role: 'progressbar', 'aria-label': 'Növbəti rütbəyə qədər', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': pct }, h('i', { style: 'width:' + pct + '%' })),
      h('div', { class: 'home-ac-sub' },
        h('span', { text: r.nextName ? r.nextName + ' rütbəsinə ' + num(r.toNext) + ' XP' : 'Ən yüksək rütbə' }),
        h('button', { class: 'link', type: 'button', onclick: function () { ranksSheet(r); } }, 'Rütbə yolu')));
  }
  /* cards due for review (the Kartlar screen's own count) */
  function dueCards() {
    try { var l = App.screens ? App.screens() : []; for (var i = 0; i < l.length; i++) if (l[i] && l[i].id === 'cards' && typeof l[i].badge === 'function') return Number(l[i].badge()) || 0; } catch (e) { /* ignore */ }
    return 0;
  }
  function reviewCards() {
    var n = dueCards();
    if (!n) return h('p', { class: 'home-none' }, h('b', { text: 'Təkrar gözləyən kart yoxdur' }), ' · Səhv etdiyiniz ifadələr kart olub burada növbəyə düşür.');
    return h('div', { class: 'home-list' }, h('button', { class: 'home-row', type: 'button', onclick: function () { goFirst(['cards'], {}, 'Kartlar bölməsi hazırlanır'); } },
      ie('cards'), h('span', { class: 'tx' }, h('b', { text: n + ' kart təkrar gözləyir' }), h('small', { text: 'Aralıqlı təkrar · bir neçə dəqiqə' })), h('span', { class: 'end' }, chev())));
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
    var meta = [];
    (T ? [T.topic, T.level, T.minutes ? T.minutes + ' dəqiqə' : '', T.xp ? '+' + T.xp + ' XP' : ''] : ['5–7 dəqiqə']).filter(Boolean).forEach(function (t, i) {
      if (i) meta.push(h('i', { class: 'sep', 'aria-hidden': 'true' }));
      meta.push(h('span', { text: t }));
    });
    var btn = h('button', { class: 'btn btn-primary', type: 'button' }, L ? 'Dərsi aç' : first ? 'İlk dərsə başla' : 'Dərsə başla', ie('arrow'));
    btn.addEventListener('click', function () { lessonCTA(btn); });
    return h('div', { class: 'home-cont home-cta' },
      h('div', { class: 'home-cont-tx' },
        h('span', { class: 'caption', style: 'font-size:var(--t-micro)', text: L ? 'Dərsiniz hazırdır' : first ? 'İlk dərs' : 'Bugünkü dərs' }),
        h('h3', { text: T ? T.title : 'Qısa dərsə başlayın' }),
        h('div', { class: 'home-cont-meta' }, meta)),
      btn);
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
      nz(right === qz.length ? 'celebrate' : 'success', right === qz.length ? 'Hamısı düzdür.' : right + ' / ' + qz.length + '. Səhv olanlara bir də baxın.', 2600);
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
    var items = [
      { t: 'Tapşırıq', s: 'Mətn tərcümə edin, Məclis yoxlasın', ic: 'edit', ids: ['task', 'practice'] },
      { t: 'Məşq', s: 'Qısa çalışmalar', ic: 'target', ids: ['practice'] },
      { t: 'Səhv kartları', s: 'Aralıqlı təkrar', ic: 'cards', ids: ['cards'] },
      { t: 'Lüğət', s: 'Sahələr üzrə terminlər', ic: 'type', run: function () { if (hasScreen('glossary')) App.go('glossary'); else if (App.academyGlossary) App.academyGlossary(''); else termSheet(); } },
      { t: 'İnkişaf', s: 'Ballar və zəif tərəflər', ic: 'chart', ids: ['progress'] }
    ].filter(function (it) { return it.run || it.ids.some(hasScreen); });
    return h('div', { class: 'home-list', role: 'group', 'aria-label': 'Məşq' }, items.map(function (it) {
      return h('button', { class: 'home-row', type: 'button', onclick: function () { if (it.run) it.run(); else goFirst(it.ids, {}, it.t + ' bölməsi hazırlanır'); } },
        ie(it.ic), h('span', { class: 'tx' }, h('b', { text: it.t }), h('small', { text: it.s })), h('span', { class: 'end' }, chev()));
    }));
  }

  /* ------------------------------------------------------------------
     7. NUANZA REACTS ON ENTER — greets by name only when one is set
     ------------------------------------------------------------------ */
  function react(mode) {
    /* Quiet by design: Nuanza does not greet on screen entry. She speaks when tapped or when
       real work finishes (checks, QA, the Məclis). */
    return mode;
  }

  /* ------------------------------------------------------------------
     8. REGISTER
     ------------------------------------------------------------------ */
  App.register('home', {
    title: function (m) { return m === 'academy' ? 'Akademiya' : 'İş masası'; },
    icon: 'home',
    group: 'Peşəkar',
    mode: 'both',
    render: function (el, params) {
      var rerender = leftAt && Date.now() - leftAt < 150;
      leftAt = 0;
      cleanup();
      App.css('home', CSS);
      var m = App.mode ? App.mode() : 'pro';
      var page = h('div', { class: 'page home-page home-' + m });
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