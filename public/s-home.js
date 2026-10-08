/* =====================================================================
   NUANZA — s-home.js
   Screen 'home' for both modes:
     • Peşəkar  → «İş masası»: aktiv layihə, sürətli əməliyyatlar, həftə ritmi,
                  yaxın təhvillər, «Nuanza deyir» təklifləri, son fəaliyyət.
     • Akademiya → «Masa»: xalça medalyonu kimi rütbə kartı, seriya, «Bu gün nə
                  işləyim?», əsas yol (6 addım), zəif tərəflər, missiyalar, alətlər.
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
  var WD_SHORT = ['B.', 'B.e.', 'Ç.a.', 'Ç.', 'C.a.', 'C.', 'Ş.'];

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
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function hm(d) { return pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  function sameDay(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
  function dayKey(d) { d = d || new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function weekKey(d) {
    d = d || new Date();
    var m = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
    return 'w' + dayKey(m);
  }
  function rel(msAgo) { return App.fmt && App.fmt.rel ? App.fmt.rel(new Date(Date.now() - msAgo)) : ''; }
  function sget(k, fb) { try { var v = App.store.get(k, fb); return v === undefined ? fb : v; } catch (e) { return fb; } }
  function sset(k, v) { try { App.store.set(k, v); } catch (e) { /* storage blocked */ } }
  function profile() { try { return App.profile(); } catch (e) { return { name: 'Aysel Məmmədova', firstName: 'Aysel', xp: 1840, streak: 12, bestStreak: 31, dailyGoal: 30, initials: 'AM', avatarColor: 'av-nar' }; } }
  function reduced() { try { return App.reducedMotion ? App.reducedMotion() : false; } catch (e) { return false; } }

  function dateLine(d) { return cap(WEEKDAYS[d.getDay()]) + ', ' + d.getDate() + ' ' + MONTHS[d.getMonth()]; }
  function greeting(d) {
    var hr = d.getHours();
    return hr >= 5 && hr < 12 ? 'Sabahınız xeyir' : hr >= 12 && hr < 18 ? 'Gününüz xeyir' : hr >= 18 && hr < 23 ? 'Axşamınız xeyir' : 'Gecəniz xeyir';
  }
  function dueLabel(d) {
    var now = new Date(), tm = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    if (sameDay(d, now)) return 'Bu gün, ' + hm(d);
    if (sameDay(d, tm)) return 'Sabah, ' + hm(d);
    return d.getDate() + ' ' + MONTHS[d.getMonth()] + ', ' + hm(d);
  }
  function leftLabel(ms) {
    if (ms <= 0) return 'vaxtı keçib';
    var m = Math.floor(ms / 60000), dd = Math.floor(m / 1440), hr = Math.floor((m % 1440) / 60), mi = m % 60;
    if (dd > 0) return dd + ' gün' + (hr ? ' ' + hr + ' saat' : '');
    if (hr > 0) return hr + ' saat' + (mi ? ' ' + mi + ' dəq' : '');
    return Math.max(1, mi) + ' dəq';
  }
  function durLabel(min) {
    min = Math.max(1, Math.round(min));
    var hr = Math.floor(min / 60), mi = min % 60;
    return hr ? hr + ' saat' + (mi ? ' ' + mi + ' dəq' : '') : mi + ' dəq';
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
  function burstAt(el, kind) { try { if (App.fx && App.fx.burstAt && el && el.isConnected) App.fx.burstAt(el, kind || 'stars'); } catch (e) { /* ignore */ } }
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
  function swapIn(el) { if (!el) return; el.classList.remove('home-swap'); void el.offsetWidth; el.classList.add('home-swap'); }
  function replaceNode(oldEl, newEl) { if (oldEl && oldEl.parentNode) oldEl.parentNode.replaceChild(newEl, oldEl); return newEl; }

  /* ------------------------------------------------------------------
     2. LIFECYCLE (timers + mini Nuanza instances are cleaned on leave)
     ------------------------------------------------------------------ */
  var live = { iv: [], to: [], minis: [] };
  var leftAt = 0;
  var waved = false;
  function later(fn, ms) { var t = setTimeout(fn, ms || 0); live.to.push(t); return t; }
  function every(fn, ms) { var t = setInterval(fn, ms); live.iv.push(t); return t; }
  function cleanup() {
    live.iv.forEach(clearInterval); live.to.forEach(clearTimeout);
    live.minis.forEach(function (m) { try { if (m && m.destroy) m.destroy(); } catch (e) { /* ignore */ } });
    live = { iv: [], to: [], minis: [] };
    dueRefs = [];
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
  var CSS = [
    /* header */
    '.home-h-actions{display:flex;gap:8px}',
    '.home-bell{position:relative}',
    '.home-dot{position:absolute;top:8px;right:9px;width:8px;height:8px;border-radius:50%;background:var(--nar);box-shadow:0 0 0 2px var(--surface);animation:pop-in .4s var(--ease-spring) both}',
    '.home-swap{animation:home-swap .32s var(--ease-out) both}',

    /* hero — active project on lacquer */
    '.home-hero{display:grid;gap:16px;padding:22px}',
    '@media (min-width:640px){.home-hero{padding:28px 30px;gap:18px}}',
    '.home-hero-gul{position:absolute;right:-64px;top:-64px;width:260px;height:260px;z-index:-1;pointer-events:none;background:var(--gold-hi);opacity:.11;-webkit-mask:var(--m-gul) center/contain no-repeat;mask:var(--m-gul) center/contain no-repeat;animation:home-spin 120s linear infinite}',
    '.home-hero-top{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px}',
    '.home-due{display:inline-flex;align-items:center;gap:7px;height:30px;padding:0 12px 0 10px;border-radius:var(--r-pill);background:color-mix(in srgb,var(--on-deep) 9%,transparent);border:1px solid color-mix(in srgb,var(--on-deep) 18%,transparent);color:var(--on-deep);font:600 var(--fs-xs)/1 var(--f-body);font-variant-numeric:tabular-nums;white-space:nowrap}',
    '.home-due svg{width:14px;height:14px;color:var(--gold-hi)}',
    '.home-due i{width:7px;height:7px;border-radius:50%;background:var(--gold-hi);animation:home-pulse 2s var(--ease-out) infinite}',
    '.home-hero-head{display:grid;gap:6px}',
    '.home-hero h2{font-size:clamp(1.375rem,1.1rem + 1.3vw,1.875rem);line-height:1.18;letter-spacing:-.01em}',
    '.home-hero-sub{font-size:var(--fs-sm)}',
    '.home-hero-meta{display:flex;flex-wrap:wrap;gap:6px}',
    '.card.lacquer .home-hero-meta .badge{background:color-mix(in srgb,var(--on-deep) 10%,transparent);color:var(--on-deep)}',
    '.card.lacquer .home-hero-meta .badge.home-qa{background:color-mix(in srgb,var(--zafaran) 30%,transparent);color:var(--gold-hi)}',
    '.home-qa.bump{animation:pop-in .5s var(--ease-spring) both}',
    '.home-hero-prog{display:grid;gap:8px}',
    '.home-prog-lbl{display:flex;justify-content:space-between;align-items:baseline;gap:12px;font-size:var(--fs-sm);color:var(--on-deep-soft);font-variant-numeric:tabular-nums}',
    '.home-prog-lbl b{color:var(--on-deep);font-weight:600}',
    '.home-hero .progress{height:10px}',
    '.home-hero-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:2px}',
    '.home-hero-actions .btn{min-width:0}',
    '.home-hero-actions .home-btn-gold{grid-column:1 / -1}',
    '@media (min-width:640px){.home-hero-actions{display:flex;flex-wrap:wrap;gap:10px}.home-hero-actions .home-btn-gold{margin-left:auto}}',
    '.home-btn-glass{--btn-bg:color-mix(in srgb,var(--on-deep) 8%,transparent);--btn-bg-h:color-mix(in srgb,var(--on-deep) 16%,transparent);--btn-ink:var(--on-deep);--btn-bd:color-mix(in srgb,var(--on-deep) 26%,transparent);box-shadow:none}',
    '.home-btn-gold{--btn-bg:var(--gold-hi);--btn-bg-h:color-mix(in srgb,var(--gold-hi) 78%,var(--zafaran));--btn-ink:var(--deep-2);--btn-bd:transparent;box-shadow:inset 0 1px 0 color-mix(in srgb,var(--ivory) 45%,transparent),0 10px 22px -12px var(--zafaran)}',

    /* quick actions */
    '@media (min-width:640px){.home-quick{grid-template-columns:repeat(4,minmax(0,1fr))}}',
    '.home-quick .tile{min-height:104px}',

    /* insight — Nuanza says */
    '.home-tip{display:grid;grid-template-columns:84px minmax(0,1fr);gap:14px;align-items:start}',
    '@media (min-width:640px){.home-tip{grid-template-columns:96px minmax(0,1fr);gap:20px;align-items:center}}',
    '.home-tip-art{position:relative;z-index:1;min-height:112px;display:grid;place-items:end center}',
    '.home-tip-body{position:relative;z-index:1;display:grid;gap:10px;min-width:0}',
    '.home-tip-text{font-size:var(--fs-base);line-height:1.6}',
    '.home-tip-text b{font-weight:600}',
    '.home-fixes{display:flex;flex-wrap:wrap;gap:6px}',
    '.home-fix{display:inline-flex;align-items:center;gap:6px;max-width:100%;padding:4px 10px;border-radius:var(--r-pill);background:var(--surface2);font-size:var(--fs-sm);line-height:1.4}',
    '.home-fix s{color:var(--nar);text-decoration-thickness:1.5px}',
    '.home-fix b{color:var(--ok);font-weight:600}',
    '.home-fix svg{width:14px;height:14px;color:var(--faint)}',
    '.home-tip-acts{display:flex;flex-wrap:wrap;align-items:center;gap:8px}',

    /* week rhythm + sparkline */
    '.home-week{display:flex;flex-direction:column}',
    '.home-week .stats{grid-template-columns:repeat(2,minmax(0,1fr));gap:16px 12px}',
    '.home-week .stats.home-swap{animation-duration:.24s}',
    '.home-spark-wrap{flex:1;display:flex;flex-direction:column;gap:6px;margin-top:16px;padding-top:14px;border-top:1px solid var(--line)}',
    '.home-spark-cap{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:4px 12px;font-size:var(--fs-xs);color:var(--soft)}',
    '.home-spark-cap b{color:var(--ink);font-weight:600;font-size:var(--fs-sm);font-variant-numeric:tabular-nums}',
    '.home-spark{position:relative;flex:1 1 64px;min-height:64px;max-height:150px;border-radius:var(--r-sm);touch-action:pan-y;cursor:crosshair}',
    '.home-spark:focus-visible{outline:2px solid var(--focus);outline-offset:4px}',
    '.home-spark svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}',
    '.home-spark .ln{fill:none;stroke:color-mix(in srgb,var(--lacquer) 62%,transparent);stroke-width:2;stroke-linejoin:round;stroke-linecap:round;vector-effect:non-scaling-stroke}',
    '.home-spark .ar{fill:var(--lac-t)}',
    '.home-spark .gl{stroke:var(--line);stroke-width:1;stroke-dasharray:2 3;vector-effect:non-scaling-stroke}',
    '.home-pt{position:absolute;width:8px;height:8px;margin:-4px 0 0 -4px;border-radius:50%;background:var(--surface);box-shadow:0 0 0 2px color-mix(in srgb,var(--lacquer) 62%,transparent);transition:transform var(--t-fast) var(--ease-out),box-shadow var(--t-fast);pointer-events:none}',
    '.home-pt.now{background:var(--nar);box-shadow:0 0 0 2px var(--surface),0 0 0 4px var(--nar-t)}',
    '.home-pt.on{transform:scale(1.45)}',
    '.home-spark-days{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));font-size:.6875rem;color:var(--faint);text-align:center}',
    '.home-spark-days span.on{color:var(--ink);font-weight:600}',

    /* deadlines */
    '.home-dl .list-row{align-items:flex-start}',
    '.home-dl .list-row .ic{margin-top:2px}',
    '.home-dl-bar{display:flex;align-items:center;gap:8px;margin-top:7px;font-size:var(--fs-xs);color:var(--soft);font-variant-numeric:tabular-nums}',
    '.home-dl-bar .progress{flex:1;max-width:150px}',
    '.home-dl .end{flex-direction:column;align-items:flex-end;gap:4px;padding-top:2px}',
    '.home-dl .end small{font-size:.72rem;color:var(--faint);white-space:nowrap}',

    /* activity */
    '.home-act .list-row .avatar{margin-inline:5px}',
    '.home-act .tx small{display:block}',

    /* sheets content */
    '.home-qt-out{min-height:92px;padding:14px 16px;border:1px solid var(--line);border-radius:var(--r-md);background:var(--surface2);display:grid;gap:10px;align-content:start}',
    '.home-qt-text{font-size:1rem;line-height:1.9;overflow-wrap:anywhere;white-space:pre-wrap}',
    '.home-qt-hint{display:flex;align-items:center;gap:10px;color:var(--soft);font-size:var(--fs-sm)}',
    '.home-qt-hint svg{width:18px;height:18px;color:var(--zafaran-ink)}',
    '.home-qa-top{display:grid;grid-template-columns:auto minmax(0,1fr);gap:16px;align-items:center}',
    '.home-qa-top p{font-size:var(--fs-sm);color:var(--soft)}',
    '.home-checks{display:flex;flex-wrap:wrap;gap:6px}',
    '.home-issue .tx b{font-weight:500;overflow-wrap:anywhere}',
    '.home-issue s{color:var(--nar);text-decoration-thickness:1.5px}',
    '.home-issue ins{color:var(--ok);text-decoration:none;font-weight:600}',
    '.home-file{display:flex;align-items:center;gap:12px;padding:12px;border:1px solid var(--line);border-radius:var(--r-md);background:var(--surface)}',
    '.home-file .tx{flex:1;min-width:0;display:grid}',
    '.home-file .tx b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.home-file .tx small{color:var(--soft)}',
    '.home-ex{display:grid;gap:6px;padding:14px 16px;border-radius:var(--r-md);background:var(--surface2)}',
    '.home-ex-src{color:var(--soft);font-size:var(--fs-sm)}',
    '.home-ex-tgt{font-family:var(--f-display);font-size:1.0625rem;line-height:1.45}',
    '.home-risks{margin:0;padding-left:1.1em;display:grid;gap:4px;font-size:var(--fs-sm)}',

    /* academy — top grid */
    '.home-top{display:grid;gap:16px}',
    '@media (min-width:760px){.home-top{grid-template-columns:minmax(0,1.55fr) minmax(0,1fr)}}',

    /* rank card as a carpet medallion */
    '.home-rank{display:grid;justify-items:center;text-align:center;gap:10px;padding:28px 22px 20px}',
    '.home-rank .eyebrow{justify-content:center}',
    '.home-corner{position:absolute;width:12px;height:12px;background:var(--gold-hi);opacity:.7;-webkit-mask:var(--m-star) center/contain no-repeat;mask:var(--m-star) center/contain no-repeat;pointer-events:none}',
    '.home-corner.tl{top:17px;left:17px}.home-corner.tr{top:17px;right:17px}.home-corner.bl{bottom:17px;left:17px}.home-corner.br{bottom:17px;right:17px}',
    '.home-medal{position:relative;display:grid;place-items:center;width:144px;height:144px;margin-block:2px;padding:0;border:0;border-radius:50%;background:none;color:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:transform var(--t-base) var(--ease-spring)}',
    '@media (hover:hover){.home-medal:hover{transform:scale(1.04)}}',
    '.home-medal:active{transform:scale(.96)}',
    '.home-medal:focus-visible{outline:2px solid var(--gold-hi);outline-offset:2px}',
    '.home-medal-glow{position:absolute;inset:16px;border-radius:50%;background:radial-gradient(circle,color-mix(in srgb,var(--gold-hi) 42%,transparent),transparent 70%);animation:home-breathe 4.5s var(--ease-in-out) infinite;pointer-events:none}',
    '.home-orbit{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none}',
    '.home-orbit .orb{fill:none;stroke:var(--gold-hi);stroke-width:1;stroke-dasharray:1.5 4.5;opacity:.6;transform-box:fill-box;transform-origin:center;animation:home-spin 70s linear infinite}',
    '.home-orbit .pip{fill:color-mix(in srgb,var(--on-deep) 24%,transparent)}',
    '.home-orbit .pip.on{fill:var(--gold-hi)}',
    '.home-orbit .pip.cur{fill:var(--gold-hi);stroke:var(--deep);stroke-width:1.5}',
    '.home-medal .medal{position:relative}',
    '.home-rank h2{font-size:clamp(1.875rem,1.5rem + 1.4vw,2.375rem);line-height:1.05}',
    '.home-xp{width:min(340px,100%);display:grid;gap:7px;margin-top:2px}',
    '.home-xp-lbl{display:flex;justify-content:space-between;gap:10px;font-size:var(--fs-xs);color:var(--on-deep-soft);font-variant-numeric:tabular-nums}',
    '.home-xp-lbl b{color:var(--on-deep);font-weight:600}',
    '.home-ladder{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:2px 6px;font-size:.72rem;color:var(--on-deep-soft)}',
    '.home-ladder span.cur{color:var(--gold-hi);font-weight:600}',
    '.home-ladder i{width:4px;height:4px;transform:rotate(45deg);background:color-mix(in srgb,var(--gold-hi) 55%,transparent)}',
    '.home-ladder-btn{margin-top:-2px;padding:4px 8px;border:0;border-radius:var(--r-sm);background:none;color:var(--gold-hi);font:600 var(--fs-xs)/1.2 var(--f-body);cursor:pointer}',
    '.home-ladder-btn:hover{background:color-mix(in srgb,var(--on-deep) 10%,transparent)}',
    '.home-rank-stats{width:100%;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:6px;padding-top:14px;border-top:1px solid color-mix(in srgb,var(--on-deep) 16%,transparent)}',
    '.home-rank-stats .stat{justify-items:center;text-align:center}',
    '.home-rank-stats .stat > b{justify-content:center;font-size:1.5rem}',

    /* streak */
    '.home-streak{display:flex;flex-direction:column;gap:14px}',
    '.home-goal{margin-top:auto}',
    '.home-mile{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:var(--r-md);background:var(--surface2)}',
    '.home-mile .medal{--size:40px}',
    '.home-mile .tx{flex:1;min-width:0;display:grid;gap:1px}',
    '.home-mile .tx b{font-size:var(--fs-sm);font-weight:600}',
    '.home-mile .tx small{color:var(--soft);font-size:var(--fs-xs)}',
    '.home-flame-row{display:flex;align-items:center;gap:14px}',
    '.home-flame{position:relative;flex:none;width:60px;height:68px;padding:0;border:0;background:none;cursor:pointer;-webkit-tap-highlight-color:transparent}',
    '.home-flame svg{width:100%;height:100%;overflow:visible;transform-origin:50% 92%;animation:home-flicker 2.6s var(--ease-in-out) infinite}',
    '.home-flame .f-out{fill:var(--nar)}.home-flame .f-mid{fill:var(--zafaran)}.home-flame .f-in{fill:var(--gold-hi)}',
    '.home-flame:active svg{transform:scale(.92)}',
    '.home-streak-n{display:grid;gap:2px;min-width:0}',
    '.home-streak-n b{font-family:var(--f-display);font-size:2.5rem;font-weight:600;line-height:1;font-variant-numeric:lining-nums}',
    '.home-streak-n span{font-weight:600}',
    '.home-streak-n small{color:var(--soft)}',
    '.home-wdays{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px}',
    '.home-wd{display:grid;justify-items:center;gap:5px;font-size:.6875rem;color:var(--soft)}',
    '.home-wd i{width:30px;height:30px;display:grid;place-items:center;border-radius:50%;background:var(--surface2);color:var(--faint)}',
    '.home-wd i svg{width:14px;height:14px}',
    '.home-wd.done i{background:linear-gradient(160deg,var(--zafaran),var(--nar));color:var(--on-nar)}',
    '.home-wd.today{color:var(--ink);font-weight:600}',
    '.home-wd.today:not(.done) i{background:var(--surface);color:var(--nar);animation:home-ring 2.2s var(--ease-out) infinite}',
    '.home-goal{display:grid;gap:8px}',
    '.home-goal .row{font-size:var(--fs-sm)}',

    /* CTA */
    '.home-cta{position:relative;isolation:isolate;overflow:hidden;display:flex;align-items:center;gap:16px;width:100%;min-width:0;padding:20px;border:0;border-radius:var(--r-lg);text-align:left;cursor:pointer;color:var(--on-nar);font:inherit;',
    '  background:radial-gradient(120% 160% at 0% 0%,color-mix(in srgb,var(--zafaran) 34%,transparent),transparent 55%),linear-gradient(135deg,var(--nar),color-mix(in srgb,var(--nar) 80%,var(--zafaran)));',
    '  box-shadow:var(--sh-2),inset 0 1px 0 color-mix(in srgb,var(--ivory) 22%,transparent);transition:transform var(--t-base) var(--ease-out),box-shadow var(--t-base)}',
    '@media (min-width:640px){.home-cta{padding:24px 26px}}',
    '.home-cta::before{content:"";position:absolute;inset:6px;z-index:-1;border:1px solid color-mix(in srgb,var(--on-nar) 22%,transparent);border-radius:13px;pointer-events:none}',
    '.home-cta::after{content:"";position:absolute;right:-44px;top:-50px;width:200px;height:200px;z-index:-1;background:var(--on-nar);opacity:.13;-webkit-mask:var(--m-gul) center/contain no-repeat;mask:var(--m-gul) center/contain no-repeat;animation:home-spin 90s linear infinite;pointer-events:none}',
    '@media (hover:hover){.home-cta:hover{transform:translateY(-2px);box-shadow:var(--sh-3)}.home-cta:hover .home-cta-go{transform:translateX(4px)}}',
    '.home-cta:active{transform:scale(.99)}',
    '.home-cta-ic{width:52px;height:52px;flex:none;display:grid;place-items:center;border-radius:16px;background:color-mix(in srgb,var(--on-nar) 14%,transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--on-nar) 22%,transparent)}',
    '.home-cta-ic svg{width:26px;height:26px}',
    '.home-cta-tx{flex:1;min-width:0;display:grid;gap:4px}',
    '.home-cta-tx b{font-family:var(--f-display);font-size:1.3rem;font-weight:600;line-height:1.2}',
    '.home-cta-tx span{font-size:var(--fs-sm);opacity:.9}',
    '.home-cta-go{width:40px;height:40px;flex:none;display:grid;place-items:center;border-radius:50%;background:color-mix(in srgb,var(--on-nar) 16%,transparent);transition:transform var(--t-base) var(--ease-spring)}',
    '.home-cta-go svg{width:20px;height:20px}',
    '.home-cta[aria-busy="true"]{pointer-events:none}',
    '.home-cta[aria-busy="true"] .home-cta-go svg{display:none}',
    '.home-cta[aria-busy="true"] .home-cta-go::after{content:"";width:18px;height:18px;border-radius:50%;border:2px solid currentColor;border-right-color:transparent;animation:spin .7s linear infinite}',

    /* learning path */
    '.home-path{list-style:none;margin:0;padding:0;display:grid}',
    '.home-step{position:relative}',
    '.home-step:not(:last-child)::after{content:"";position:absolute;left:23px;top:46px;bottom:-6px;width:2px;border-radius:2px;background:var(--line);pointer-events:none}',
    '.home-step.done:not(:last-child)::after{background:var(--lacquer)}',
    '.home-step-btn{display:grid;grid-template-columns:36px minmax(0,1fr) auto;align-items:center;gap:12px;width:100%;padding:8px 6px;border:0;border-radius:var(--r-md);background:none;color:inherit;text-align:left;font:inherit;cursor:pointer;transition:background var(--t-fast)}',
    '@media (hover:hover){.home-step-btn:hover{background:var(--surface2)}}',
    '.home-step-btn:active{background:var(--surface2)}',
    '.home-step-btn[aria-busy="true"]{pointer-events:none;opacity:.7}',
    '.home-oct{position:relative;width:36px;height:36px;display:grid;place-items:center;font:600 var(--fs-sm)/1 var(--f-body);color:var(--soft)}',
    '.home-oct svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}',
    '.home-oct .o{fill:var(--surface);stroke:var(--line-2);stroke-width:1.5}',
    '.home-oct .p{fill:none;stroke:var(--nar);stroke-width:1.5;opacity:0;transform-box:fill-box;transform-origin:center}',
    '.home-oct > span{position:relative;display:grid;place-items:center}',
    '.home-oct > span svg{position:static;width:16px;height:16px}',
    '.done .home-oct{color:var(--on-lacquer)}.done .home-oct .o{fill:var(--lacquer);stroke:var(--lacquer)}',
    '.next .home-oct{color:var(--nar)}.next .home-oct .o{fill:var(--nar-t);stroke:var(--nar);stroke-width:2}',
    '.next .home-oct .p{animation:home-oct 2s var(--ease-out) infinite}',
    '.home-step-tx{display:grid;gap:1px;min-width:0}',
    '.home-step-tx b{font-weight:600;line-height:1.35}',
    '.home-step-tx small{color:var(--soft);font-size:var(--fs-sm)}',
    '.next .home-step-tx b{color:var(--nar)}',
    '.locked .home-step-tx{opacity:.72}',
    '.home-lock{display:inline-grid;place-items:center;color:var(--faint)}',
    '.home-lock svg{width:16px;height:16px}',

    /* weakness */
    '.home-weak{display:grid;gap:2px}',
    '.home-weak-row{display:grid;grid-template-columns:minmax(0,120px) minmax(0,1fr) 40px;align-items:center;gap:12px;width:100%;padding:9px 6px;border:0;border-radius:var(--r-md);background:none;color:inherit;font:inherit;font-size:var(--fs-sm);text-align:left;cursor:pointer;transition:background var(--t-fast)}',
    '@media (hover:hover){.home-weak-row:hover{background:var(--surface2)}}',
    '.home-weak-row[aria-busy="true"]{pointer-events:none;opacity:.6}',
    '.home-weak-row .n{text-align:right;color:var(--soft);font-variant-numeric:tabular-nums}',
    '.home-weak-row span:first-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',

    /* missions */
    '.home-ms .tx .progress{margin-top:7px;max-width:240px}',
    '.home-ms .end .btn{white-space:nowrap}',

    /* keyframes */
    '@keyframes home-spin{to{transform:rotate(360deg)}}',
    '@keyframes home-pulse{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--gold-hi) 60%,transparent)}70%,100%{box-shadow:0 0 0 7px transparent}}',
    '@keyframes home-ring{0%{box-shadow:inset 0 0 0 2px var(--nar),0 0 0 0 color-mix(in srgb,var(--nar) 35%,transparent)}70%,100%{box-shadow:inset 0 0 0 2px var(--nar),0 0 0 8px transparent}}',
    '@keyframes home-flicker{0%,100%{transform:scale(1) rotate(0)}25%{transform:scale(1.03,.97) rotate(-1.6deg)}50%{transform:scale(.98,1.04) rotate(1.2deg)}75%{transform:scale(1.02,.98) rotate(-.6deg)}}',
    '@keyframes home-breathe{0%,100%{opacity:.55;transform:scale(.94)}50%{opacity:1;transform:scale(1.05)}}',
    '@keyframes home-swap{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}',
    '@keyframes home-oct{0%{opacity:.75;transform:scale(1)}100%{opacity:0;transform:scale(1.5)}}'
  ].join('\n');

  /* ------------------------------------------------------------------
     4. DATA (realistic demo content)
     ------------------------------------------------------------------ */
  var WPM = 9.8; /* user's measured speed, words per minute */
  function roundUp30(d) { var ms = 30 * 60000; return new Date(Math.ceil(d.getTime() / ms) * ms); }
  function projects() {
    var now = new Date();
    var kb = roundUp30(new Date(now.getTime() + 190 * 60000));
    var cl = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 18, 0, 0, 0);
    var sc = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 9, 12, 0, 0, 0);
    return [
      { id: 'kapital', name: 'Kredit müqaviləsi — əlavə №2', client: 'Kapital Bank', pair: 'RU → AZ', reg: 'Hüquqi', words: 1860, done: 22, segs: 74, due: kb, risk: 'high' },
      { id: 'caspian', name: 'Xidmət müqaviləsi', client: 'Caspian Logistics', pair: 'EN → AZ', reg: 'Hüquqi', words: 3420, done: 68, segs: 186, due: cl, risk: 'mid', terms: 48, tm: 23 },
      { id: 'socar', name: 'İllik hesabat 2025 — 3-cü fəsil', client: 'SOCAR', pair: 'EN → AZ', reg: 'Rəsmi', words: 12480, done: 41, segs: 512, due: sc, risk: 'low' }
    ];
  }
  var RISK = {
    high: { label: 'Risk yüksək', badge: 'red', ic: 'nar' },
    mid: { label: 'Nəzarətdə', badge: 'gold', ic: 'gold' },
    low: { label: 'Rahat', badge: 'green', ic: 'green' }
  };

  var WEEK = {
    cur: { vals: [1480, 2210, 1960, 2640, 1720, 980, 1850], words: 12840, hours: 21.8, wpm: 9.8, qa: 92, d: { words: '+18%', hours: '+14%', wpm: '+4%', qa: '+3' } },
    prev: { vals: [1320, 1890, 2050, 1610, 1980, 640, 1390], words: 10880, hours: 19.2, wpm: 9.4, qa: 89, d: {} }
  };

  var INSIGHTS = [
    { id: 'dates', html: 'Son 3 layihədə <b>tarix formatında 4 səhv</b> tapdım — ay adları böyük hərflə yazılıb. Playbook-a qayda əlavə edim?',
      fixes: [['15 Mart 2026', '15 mart 2026'], ['March 3, 2026', '3 mart 2026']], ok: 'Əlavə et',
      done: 'Qayda playbook-a əlavə olundu', sub: 'Tarix: gün, ay (kiçik hərflə), il — «3 mart 2026»' },
    { id: 'employer', html: '«Caspian Logistics» layihəsində «Employer» 6 seqmentdə <b>«İşəgötürən»</b>, 4 seqmentdə <b>«Sifarişçi»</b> kimi verilib. Lüğətdə «Sifarişçi» təsdiqlənib — hamısını eyniləşdirim?',
      fixes: [['İşəgötürən', 'Sifarişçi']], ok: 'Eyniləşdir',
      done: '6 seqment yeniləndi', sub: 'Lüğətçi Mirzə ardıcıllığı təsdiqlədi' },
    { id: 'turkish', html: 'Kapital Bank mətnində <b>2 türk forması</b> qalıb. Dilçi Nənə düzəlişləri hazırlayıb — tətbiq edim?',
      fixes: [['tarafından', 'tərəfindən'], ['gün içinde', 'gün ərzində']], ok: 'Tətbiq et',
      done: '2 düzəliş tətbiq edildi', sub: 'Dilçi Nənə: mətn ədəbi normaya uyğundur' }
  ];

  var PATH = [
    { t: 'Mətni alın', s: 'Səviyyənizə uyğun mətn' },
    { t: 'Tərcümə edin', s: 'Öz variantınız' },
    { t: 'Nuanza yoxlasın', s: 'Mirzə Məclisi bal verir' },
    { t: 'Səhvləri öyrənin', s: 'Hər səhvin səbəbi' },
    { t: 'Şəxsi məşq', s: 'Zəif yerinizə görə' },
    { t: 'İnkişafınızı görün', s: 'Həftəlik nəticə' }
  ];

  var WEAK = [
    { t: 'Yalançı dostlar', v: 38, lesson: 'false-friends', eg: '«actual» — «aktual» deyil, «faktiki»' },
    { t: 'Terminologiya', v: 24, lesson: 'legal-shall', eg: '«shall» — «edəcək» deyil, «etməlidir»' },
    { t: 'Türk formaları', v: 17, lesson: 'turkish-forms', eg: '«için» deyil, «üçün»' },
    { t: 'Rəqəm və tarix', v: 12, lesson: 'numbers', eg: '«12.4%» deyil, «12,4%»' },
    { t: 'Üslub', v: 9, lesson: 'register', eg: 'Danışıq sözü rəsmi məktubda' }
  ];

  var MISSIONS = [
    { id: 'login', t: 'Masaya baxın', s: 'Gündəlik giriş', cur: 1, max: 1, xp: 10, ic: 'home' },
    { id: 'lesson', t: 'Bir dərs bitirin', s: 'İstənilən mövzu, 5–7 dəqiqə', cur: 0, max: 1, xp: 30, ic: 'book', go: ['lessons', 'academy'] },
    { id: 'cards', t: '10 səhv kartını təkrarlayın', s: 'Səhv kartları', cur: 6, max: 10, xp: 20, ic: 'cards', go: ['cards', 'review', 'academy'] },
    { id: 'turk', t: 'Türk forması olmadan 3 cümlə', s: 'Dilçi Nənə izləyir', cur: 2, max: 3, xp: 25, ic: 'quill', go: ['practice', 'translate'] },
    { id: 'week', t: 'Həftəlik: 5 gün ardıcıl məşq', s: 'Bazar gününədək', cur: 4, max: 5, xp: 60, ic: 'flame', weekly: true, go: ['practice', 'academy'] }
  ];

  var RANK_NOTES = {
    'Şagird': 'Öyrənir, qaydaları tanıyır',
    'Katib': 'Səliqəli, səhvsiz yazır',
    'Münşi': 'Məktub və sənəd qurur',
    'Mirzə': 'Rəsmi sənədi təhvilə hazırlayır',
    'Dilmanc': 'Dillər arasında körpü olur',
    'Ustad': 'Başqalarını öyrədir'
  };

  function elder(name) {
    var E = (App.data && App.data.ELDERS) || App.ELDERS || [];
    for (var i = 0; i < E.length; i++) if (E[i].name === name) return E[i];
    return { name: name, short: name.charAt(0), av: 'av-lacquer' };
  }

  /* ------------------------------------------------------------------
     5. PRO MODE — «İş masası»
     ------------------------------------------------------------------ */
  var dueRefs = [];
  function tick() {
    var now = Date.now();
    dueRefs.forEach(function (r) { if (r.el && r.el.isConnected) r.el.textContent = r.pre + leftLabel(r.due.getTime() - now) + r.post; });
  }

  function renderPro(page, post) {
    var p = profile(), now = new Date(), P = projects(), act = P[1], first = P[0];

    var bellRead = sget('home:notifs-read', false);
    var bell = h('button', { class: 'icon-btn home-bell', type: 'button', 'aria-label': bellRead ? 'Bildirişlər' : 'Bildirişlər, 3 yeni' }, ie('bell'),
      bellRead ? null : h('span', { class: 'home-dot', 'aria-hidden': 'true' }));
    bell.addEventListener('click', function () { openNotifs(bell); });
    var search = h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Axtar və keç', onclick: function () { if (App.palette) App.palette(); } }, ie('search'));

    page.appendChild(h('div', { class: 'page-h' },
      h('div', null,
        h('span', { class: 'eyebrow', text: dateLine(now) }),
        h('h1', { html: esc(greeting(now)) + ', <em>' + esc(p.firstName || 'dostum') + '</em>' }),
        h('p', { text: 'Masada 3 aktiv layihə var. Ən yaxın təhvil — ' + first.client + ', ' + lcFirst(dueLabel(first.due)) + '.' })),
      h('div', { class: 'actions home-h-actions' }, search, bell)));

    page.appendChild(heroCard(act));
    page.appendChild(quickActions());
    var tip = insightCard(post);
    page.appendChild(tip);
    page.appendChild(h('div', { class: 'grid-2' }, weekCard(), deadlinesCard(P)));
    page.appendChild(activityCard());
    every(tick, 30000);
  }

  /* 5.1 hero — active project */
  function heroCard(pj) {
    var qa = sget('home:qa', 91);
    var approved = Math.round(pj.words * pj.done / 100);
    var left = h('span', { text: leftLabel(pj.due.getTime() - Date.now()) + ' qalıb' });
    dueRefs.push({ el: left, due: pj.due, pre: '', post: ' qalıb' });
    var due = h('span', { class: 'home-due', title: 'Təhvil: ' + dueLabel(pj.due) }, h('i', { 'aria-hidden': 'true' }), ie('clock'), left);
    var qaBadge = h('span', { class: 'badge home-qa', title: 'Son QA yoxlamasının balı' }, ie('shield'), h('span', { text: 'QA ' + qa }));

    var bEd = h('button', { class: 'btn btn-primary', type: 'button' }, ie('edit'), 'Redaktor');
    bEd.addEventListener('click', function () {
      goFirst(['editor', 'translate', 'projects'], { project: pj.id, name: pj.client + ' — ' + pj.name }, 'Redaktor hələ yüklənməyib');
    });
    var bQA = h('button', { class: 'btn home-btn-glass', type: 'button' }, ie('shield'), 'QA');
    bQA.addEventListener('click', function () { quickQA(pj, qaBadge); });
    var bMc = h('button', { class: 'btn home-btn-gold', type: 'button' }, ie('stamp'), 'Məclisə göndər');
    bMc.addEventListener('click', function () { sendToCouncil(pj, bMc, qaBadge); });

    return h('section', { class: 'card lacquer home-hero', 'aria-labelledby': 'home-hero-h' },
      h('span', { class: 'home-hero-gul', 'aria-hidden': 'true' }),
      h('div', { class: 'home-hero-top' }, h('span', { class: 'eyebrow', text: 'Aktiv layihə' }), due),
      h('div', { class: 'home-hero-head' },
        h('h2', { id: 'home-hero-h', html: esc(pj.name) + ' — <em>' + esc(pj.client) + '</em>' }),
        h('p', { class: 'home-hero-sub muted', text: 'Təhvil: ' + lcFirst(dueLabel(pj.due)) + ' · lüğətdən ' + pj.terms + ' termin qorunur · TM uyğunluğu ' + pj.tm + '%' })),
      h('div', { class: 'home-hero-meta' },
        badge(pj.pair, '', 'globe'),
        h('span', { class: 'badge', title: 'Üslub mətndən avtomatik tanındı' }, ie('sparkle'), pj.reg + ' · avto'),
        badge(num(pj.words) + ' söz', '', 'file'),
        badge(pj.segs + ' seqment'),
        qaBadge),
      h('div', { class: 'home-hero-prog' },
        h('div', { class: 'home-prog-lbl' },
          h('span', null, h('b', { text: num(approved) }), ' / ' + num(pj.words) + ' söz təsdiqlənib'),
          h('b', { text: pj.done + '%' })),
        h('div', { class: 'progress gold', role: 'progressbar', 'aria-label': 'Layihənin gedişi', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': pj.done },
          h('i', { style: 'width:' + pj.done + '%' }))),
      h('div', { class: 'home-hero-actions' }, bEd, bQA, bMc));
  }
  function setQA(qaBadge, score) {
    if (!qaBadge) return;
    var t = qaBadge.querySelector('span'); if (t) t.textContent = 'QA ' + score;
    qaBadge.classList.remove('bump'); void qaBadge.offsetWidth; qaBadge.classList.add('bump');
  }

  /* QA input: live engine checks the project's real segments (from the Projects screen); the demo keeps its sample input. */
  function isLive() { return !!(App.isLive && App.isLive()); }
  function qaInput(pj) {
    var pi = null;
    if (isLive() && App.projects && typeof App.projects.qaInput === 'function') { try { pi = App.projects.qaInput(pj.id); } catch (e) { pi = null; } }
    return { project: pi || { name: pj.client + ' — ' + pj.name, segments: pj.segs } };
  }

  /* 5.2 quick QA in a sheet (skeleton → ring + issues) */
  function quickQA(pj, qaBadge) {
    var body = h('div', { class: 'stack' }, skel(4), h('span', { class: 'skeleton block', style: 'height:150px' }));
    var s = App.sheet({ title: 'QA yoxlaması', body: body, wide: true, actions: [{ label: 'Bağla', kind: 'ghost' }] });
    nz('think', 'Rəqəmlərə, adlara, tarixlərə və terminlərə baxıram…', 2200);
    App.fakeAI('qa', qaInput(pj)).then(function (r) {
      if (!body.isConnected || !r) return;
      if (r.ok === false || !Array.isArray(r.issues)) {
        body.textContent = '';
        body.appendChild(h('div', { class: 'callout' }, ie('alert'), h('div', { text: r.error || 'Yoxlama alınmadı. Yenidən cəhd edin.' })));
        nz('sad', null, 1600);
        return;
      }
      body.textContent = '';
      var checks = h('div', { class: 'home-checks' }, (r.checks || []).map(function (c) {
        return c.ok ? badge(c.label, 'green', 'check') : badge(c.label + ' · ' + c.issues, c.key === 'complete' || c.key === 'numbers' ? 'red' : 'gold');
      }));
      body.appendChild(h('div', { class: 'home-qa-top' },
        App.ring(r.score, 'bal', null, { size: 'sm' }),
        h('div', { class: 'stack-sm' }, h('b', { text: r.issues.length + ' qeyd, ' + r.segments + ' seqment' }), h('p', { text: r.summary }), checks)));
      var sev = { high: ['Kritik', 'red'], mid: ['Orta', 'gold'], low: ['Kiçik', 'navy'] };
      body.appendChild(h('div', { class: 'list' }, r.issues.slice(0, 7).map(function (q) {
        var sv = sev[q.severity] || sev.low;
        return h('div', { class: 'list-row home-issue' },
          h('span', { class: 'ic ' + (q.severity === 'high' ? 'nar' : q.severity === 'mid' ? 'gold' : ''), html: App.icon(q.severity === 'high' ? 'alert' : 'edit'), 'aria-hidden': 'true' }),
          h('span', { class: 'tx' },
            h('b', null, h('s', { text: q.was }), ' → ', h('ins', { text: q.now })),
            h('small', { text: '#' + q.seg + ' · ' + q.type + ' · ' + q.text + (q.elder ? ' — ' + q.elder : '') })),
          h('span', { class: 'end' }, badge(sv[0], sv[1])));
      })));
      sset('home:qa', r.score); setQA(qaBadge, r.score);
      var fixedScore = Math.max(r.score, 96 + (r.issues.length % 3));
      s.setActions([
        { label: 'Bağla', kind: 'ghost' },
        /* Live: fixes are applied for real on the QA screen, never simulated here. */
        isLive() ? { label: 'QA-da düzəlt', kind: 'primary', icon: 'shield', onClick: function () {
          goFirst(['qa', 'projects'], { project: pj.id }, 'QA bölməsi hələ yüklənməyib');
        } } : { label: 'Hamısını düzəlt', kind: 'primary', icon: 'wand', onClick: function () {
          sset('home:qa', fixedScore); sset('home:qafixed', true); setQA(qaBadge, fixedScore);
          App.toast(r.issues.length + ' düzəliş tətbiq edildi', 'ok', { sub: 'Yeni QA balı: ' + fixedScore + ' · dəyişikliklər redaktorda görünür' });
          nz('success', 'Hazırdır! İndi Məclisə göndərmək olar.', 2600);
        } }
      ]);
      nz(r.score >= 85 ? 'success' : 'worried', r.score >= 85 ? 'Yaxşı görünür: ' + r.score + ' bal.' : r.score + ' bal — bir neçə yerə birlikdə baxaq.', 2600);
    });
  }

  /* 5.3 big job — the council */
  function sendToCouncil(pj, btn, qaBadge) {
    if (isBusy(btn)) return;
    busy(btn, true);
    var fixed = !isLive() && sget('home:qafixed', false);
    App.fakeAI('qa', qaInput(pj), 450).then(function (r) {
      busy(btn, false);
      if (r && r.ok === false) return null;
      var v = fixed
        ? { score: Math.max(sget('home:qa', 95), 95), text: 'Bütün QA qeydləri bağlanıb. Terminlər lüğətə uyğundur, rəqəmlər və tarixlər möhürləndi, Dilçi Nənə türk formasına rast gəlmədi.', seal: 'Təhvilə hazırdır' }
        : (r && r.verdict) || { score: 88, text: 'Məclis razıdır: mətn təhvilə hazırdır.' };
      return App.bigJob(pj.name + ' — dərin yoxlama', v);
    }).then(function (v) {
      if (!v || v.score == null) return;
      sset('home:qa', v.score); setQA(qaBadge, v.score);
      if (v.score >= 85) {
        App.toast('Təhvil paketi yığılsın?', 'info', { sub: 'DOCX, ikidilli XLSX, TMX və QA hesabatı', icon: 'stamp', action: { label: 'Yığ', onClick: function () {
          App.toast('Hazırdır', 'ok', { sub: 'Təhvil paketi yığıldı — 5 fayl, möhürlü QA hesabatı ilə' });
        } } });
      }
    }, function () { busy(btn, false); });
  }

  /* 5.4 quick actions */
  function quickActions() {
    var G = (App.data && App.data.GLOSSARY) || [];
    var items = [
      { t: 'Yeni layihə', s: 'Sənəd, müştəri, müddət', ic: 'plus', cls: 'nar', run: newProjectSheet },
      { t: 'Sürətli tərcümə', s: 'Üslub avtomatik tanınır', ic: 'zap', cls: 'gold', run: quickTranslateSheet },
      { t: 'Termin axtar', s: (G.length ? num(G.length) + ' termin lüğətdə' : 'Lüğət və yaddaş'), ic: 'search', cls: '', run: termSheet },
      { t: 'Fayl yüklə', s: 'Analiz, həcm və qiymət', ic: 'upload', cls: 'green', run: uploadSheet }
    ];
    return h('div', { class: 'tiles home-quick', role: 'group', 'aria-label': 'Sürətli əməliyyatlar' }, items.map(function (it) {
      return h('button', { class: 'tile', type: 'button', onclick: function () { it.run(); } },
        icTile(it.ic, it.cls), h('span', null, h('b', { text: it.t }), h('small', { text: it.s })));
    }));
  }

  /* 5.5 «Nuanza deyir» insight */
  function insightCard(post) {
    var art = h('div', { class: 'home-tip-art' });
    var body = h('div', { class: 'home-tip-body', 'aria-live': 'polite' });
    var sec = h('section', { class: 'card framed home-tip', 'aria-label': 'Nuanza deyir' }, art, body);
    var mini = null;
    function state() { var st = sget('home:insights', {}); return st && typeof st === 'object' ? st : {}; }
    function paint(anim) {
      var st = state();
      var open = INSIGHTS.filter(function (i) { return !st[i.id]; });
      var cur = open[0];
      body.textContent = '';
      if (anim) swapIn(body);
      if (!cur) {
        body.appendChild(h('span', { class: 'eyebrow', text: 'Nuanza deyir' }));
        body.appendChild(h('p', { class: 'home-tip-text', text: 'Hələlik yeni təklifim yoxdur — masanız səliqəlidir. Növbəti layihədə nəyəsə rast gəlsəm, ilk sizə deyəcəm.' }));
        body.appendChild(h('div', { class: 'home-tip-acts' }, h('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: function () { sset('home:insights', {}); paint(true); if (mini && mini.set) mini.set('wave', { ms: 1400 }); } }, ie('refresh'), 'Təklifləri yenidən göstər')));
        return;
      }
      var idx = INSIGHTS.indexOf(cur);
      var ok = h('button', { class: 'btn btn-primary btn-sm', type: 'button' }, ie('check'), cur.ok);
      var no = h('button', { class: 'btn btn-ghost btn-sm', type: 'button' }, 'Sonra');
      ok.addEventListener('click', function () {
        if (isBusy(ok)) return;
        busy(ok, true);
        burstAt(ok, 'stars');
        if (mini && mini.set) mini.set('celebrate', { ms: 1600 });
        App.toast(cur.done, 'ok', { sub: cur.sub });
        var s2 = state(); s2[cur.id] = 'ok'; sset('home:insights', s2);
        later(function () { paint(true); }, 950);
      });
      no.addEventListener('click', function () {
        var s2 = state(); s2[cur.id] = 'later'; sset('home:insights', s2);
        App.toast('Yaxşı, sonra qayıdarıq', 'info', { sub: 'Bu təklifi sabah yenidən xatırladacağam' });
        if (mini && mini.set) mini.set('idle', {});
        paint(true);
      });
      body.appendChild(h('div', { class: 'row between' },
        h('span', { class: 'eyebrow', text: 'Nuanza deyir' }),
        h('span', { class: 'small muted tnum', text: (idx + 1) + ' / ' + INSIGHTS.length })));
      body.appendChild(h('p', { class: 'home-tip-text', html: cur.html }));
      body.appendChild(h('div', { class: 'home-fixes' }, cur.fixes.map(function (f) {
        return h('span', { class: 'home-fix' }, h('s', { text: f[0] }), ie('arrow'), h('b', { text: f[1] }));
      })));
      body.appendChild(h('div', { class: 'home-tip-acts' }, ok, no));
    }
    paint(false);
    post.push(function () { mini = mountMini(art, 'point'); if (mini && mini.set) later(function () { mini.set('idle', {}); }, 1800); });
    return sec;
  }

  /* 5.6 week rhythm + sparkline */
  function weekCard() {
    var which = 'cur', active = 6;
    var segBtns = [['cur', 'Son 7 gün'], ['prev', 'Əvvəlki']].map(function (o) {
      var b = h('button', { type: 'button', 'aria-pressed': String(o[0] === which) }, o[1]);
      b.addEventListener('click', function () {
        if (which === o[0]) return;
        which = o[0]; active = 6;
        segBtns.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        paint(true);
      });
      return b;
    });
    var stats = h('div', { class: 'stats' });
    var spark = h('div', { class: 'home-spark', tabindex: '0', role: 'img' });
    var days = h('div', { class: 'home-spark-days', 'aria-hidden': 'true' });
    var capVal = h('b');
    var dots = [];

    function dayDate(i) { var n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate() - (6 - i) - (which === 'prev' ? 7 : 0)); }
    function stat(val, label, delta) {
      return h('div', { class: 'stat' }, h('b', null, val, delta ? h('span', { class: 'delta', text: delta }) : null), h('span', { text: label }));
    }
    function setActive(i) {
      active = clamp(i, 0, 6);
      dots.forEach(function (d, k) { d.classList.toggle('on', k === active); });
      Array.prototype.forEach.call(days.children, function (d, k) { d.classList.toggle('on', k === active); });
      var dd = dayDate(active), v = WEEK[which].vals[active];
      capVal.textContent = (which === 'cur' && active === 6 ? 'Bu gün' : cap(WEEKDAYS[dd.getDay()])) + ' · ' + num(v) + ' söz';
      capVal.title = dd.getDate() + ' ' + MONTHS[dd.getMonth()];
    }
    function paint(anim) {
      var w = WEEK[which];
      stats.textContent = '';
      stats.appendChild(stat(num(w.words), 'təsdiqlənmiş söz', w.d.words));
      stats.appendChild(stat(num(w.hours, 1), 'saat iş vaxtı', w.d.hours));
      stats.appendChild(stat(num(w.wpm, 1), 'söz / dəqiqə', w.d.wpm));
      stats.appendChild(stat(String(w.qa), 'orta QA balı', w.d.qa));
      if (anim) swapIn(stats);
      /* sparkline: x at day-column centres, y from a zero baseline */
      var max = Math.max.apply(null, w.vals) * 1.08, n = w.vals.length;
      var pts = w.vals.map(function (v, i) { return { x: (i + 0.5) / n * 100, y: 6 + (1 - v / max) * 54 }; });
      var line = pts.map(function (p, i) { return (i ? 'L' : 'M') + p.x.toFixed(2) + ' ' + p.y.toFixed(2); }).join(' ');
      var area = line + ' L' + pts[n - 1].x.toFixed(2) + ' 64 L' + pts[0].x.toFixed(2) + ' 64 Z';
      var avg = w.vals.reduce(function (s, v) { return s + v; }, 0) / n, ay = 6 + (1 - avg / max) * 54;
      spark.innerHTML = '<svg viewBox="0 0 100 64" preserveAspectRatio="none" aria-hidden="true" focusable="false">' +
        '<line class="gl" x1="0" x2="100" y1="' + ay.toFixed(2) + '" y2="' + ay.toFixed(2) + '"/>' +
        '<path class="ar" d="' + area + '"/><path class="ln" d="' + line + '"/></svg>';
      dots = pts.map(function (p, i) {
        var d = h('span', { class: 'home-pt' + (which === 'cur' && i === n - 1 ? ' now' : ''), style: 'left:' + p.x + '%;top:' + (p.y / 64 * 100) + '%', 'aria-hidden': 'true' });
        spark.appendChild(d); return d;
      });
      days.textContent = '';
      for (var i = 0; i < n; i++) days.appendChild(h('span', { text: which === 'cur' && i === n - 1 ? 'Bu gün' : WD_SHORT[dayDate(i).getDay()] }));
      spark.setAttribute('aria-label', 'Gündəlik təsdiqlənmiş sözlər: ' + w.vals.map(function (v, i) { return WD_SHORT[dayDate(i).getDay()] + ' ' + num(v); }).join(', ') + '. Orta: ' + num(Math.round(avg)) + ' söz. Oxlarla günləri seçin.');
      setActive(active);
    }
    spark.addEventListener('pointermove', function (e) {
      var r = spark.getBoundingClientRect(); if (!r.width) return;
      var i = Math.floor((e.clientX - r.left) / r.width * 7);
      if (i !== active) setActive(i);
    });
    spark.addEventListener('pointerleave', function () { setActive(6); });
    spark.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); setActive(active - 1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); setActive(active + 1); }
      else if (e.key === 'Home') { e.preventDefault(); setActive(0); }
      else if (e.key === 'End') { e.preventDefault(); setActive(6); }
    });
    paint(false);
    return h('section', { class: 'card home-week', 'aria-labelledby': 'home-week-h' },
      h('div', { class: 'card-h' },
        h('div', null, h('span', { class: 'eyebrow', text: 'Bu həftə' }), h('h2', { id: 'home-week-h', text: 'Ritminiz' })),
        h('div', { class: 'seg sm', role: 'group', 'aria-label': 'Dövr' }, segBtns)),
      stats,
      h('div', { class: 'home-spark-wrap' },
        h('div', { class: 'home-spark-cap' }, h('span', { text: 'Gündəlik söz' }), capVal),
        spark, days));
  }

  /* 5.7 deadlines */
  function deadlinesCard(P) {
    var rows = P.map(function (pj) {
      var R = RISK[pj.risk];
      var left = h('span', { class: 'badge ' + R.badge + ' dot', text: leftLabel(pj.due.getTime() - Date.now()) });
      dueRefs.push({ el: left, due: pj.due, pre: '', post: '' });
      return h('button', { class: 'list-row', type: 'button', 'aria-label': pj.client + ' — ' + pj.name + '. ' + R.label + '. Təhvil: ' + dueLabel(pj.due), onclick: function () { deadlineSheet(pj); } },
        icTile(pj.risk === 'high' ? 'alert' : 'clock', R.ic),
        h('span', { class: 'tx' },
          h('b', { text: pj.name }),
          h('small', { text: pj.client + ' · ' + pj.pair + ' · ' + num(pj.words) + ' söz' }),
          h('span', { class: 'home-dl-bar' },
            h('span', { class: 'progress thin' + (pj.risk === 'low' ? ' green' : pj.risk === 'mid' ? ' gold' : ''), 'aria-hidden': 'true' }, h('i', { style: 'width:' + pj.done + '%' })),
            h('span', { text: pj.done + '% · ' + R.label }))),
        h('span', { class: 'end' }, left, h('small', { text: dueLabel(pj.due) })));
    });
    return h('section', { class: 'card home-dl', 'aria-labelledby': 'home-dl-h' },
      h('div', { class: 'card-h' },
        h('div', null, h('span', { class: 'eyebrow', text: 'Təhvillər' }), h('h2', { id: 'home-dl-h', text: 'Yaxın müddətlər' })),
        h('button', { class: 'link small', type: 'button', onclick: function () { goFirst(['projects'], {}, 'Layihələr bölməsi hazırlanır'); } }, 'Hamısı')),
      h('div', { class: 'list' }, rows));
  }
  function deadlineSheet(pj) {
    var R = RISK[pj.risk];
    var rem = Math.round(pj.words * (1 - pj.done / 100));
    var need = rem / WPM, leftMs = pj.due.getTime() - Date.now();
    var daysLeft = Math.max(1, Math.ceil(leftMs / 86400000));
    var note = pj.risk === 'high'
      ? 'Vaxt sıxdır: qalan iş təxminən ' + durLabel(need) + ', təhvilə isə ' + leftLabel(leftMs) + ' qalıb. Fasilələri nəzərə alsaq, müştəriyə ara təhvil təklif etmək olar.'
      : pj.risk === 'mid'
        ? 'Qrafik üzrədir. Qalan iş təxminən ' + durLabel(need) + '. 6 seqmentdə termin seçimi gözləyir: «Employer» — «Sifarişçi».'
        : 'Ehtiyat vaxt var: gündə ' + num(Math.ceil(rem / daysLeft / 10) * 10) + ' söz kifayətdir.';
    var body = h('div', { class: 'stack' },
      h('div', { class: 'chips' }, badge(R.label, R.badge + ' dot'), badge(pj.pair, 'navy'), badge(pj.reg)),
      h('div', { class: 'stack-sm' },
        h('div', { class: 'row between small' }, h('span', { class: 'muted', text: num(pj.words - rem) + ' / ' + num(pj.words) + ' söz' }), h('b', { text: pj.done + '%' })),
        h('div', { class: 'progress' + (pj.risk === 'low' ? ' green' : pj.risk === 'mid' ? ' gold' : '') }, h('i', { style: 'width:' + pj.done + '%' }))),
      h('dl', { class: 'kv' },
        h('dt', { text: 'Müştəri' }), h('dd', { text: pj.client }),
        h('dt', { text: 'Həcm' }), h('dd', { text: num(pj.words) + ' söz · ' + pj.segs + ' seqment' }),
        h('dt', { text: 'Qalan iş' }), h('dd', { text: num(rem) + ' söz · ≈ ' + durLabel(need) }),
        h('dt', { text: 'Təhvil' }), h('dd', { text: dueLabel(pj.due) }),
        h('dt', { text: 'Qalan vaxt' }), h('dd', { text: leftLabel(leftMs) })),
      h('div', { class: 'callout' + (pj.risk === 'high' ? ' red' : pj.risk === 'low' ? ' green' : '') }, ie(pj.risk === 'high' ? 'alert' : 'bulb'), h('div', { text: note })));
    App.sheet({ title: pj.client + ' — ' + pj.name, body: body, actions: [
      { label: 'Bağla', kind: 'ghost' },
      { label: 'Redaktorda aç', kind: 'primary', icon: 'edit', onClick: function () { setTimeout(function () { goFirst(['editor', 'translate', 'projects'], { project: pj.id }, 'Redaktor hələ yüklənməyib'); }, 60); } }
    ] });
  }

  /* 5.8 recent activity */
  function activityCard() {
    var p = profile();
    var dil = elder('Dilçi Nənə'), lug = elder('Lüğətçi Mirzə'), moh = elder('Möhürdar Mirzə');
    var items = [
      { av: dil.av, init: dil.short, elder: dil.name, b: 'Dilçi Nənə 3 türk formasını düzəltdi', s: 'Kapital Bank — Kredit müqaviləsi', ago: 14 * 60000, run: turkishFixesSheet },
      { av: lug.av, init: lug.short, elder: lug.name, b: '«indemnity» termini təsdiqləndi: «zərərin ödənilməsi»', s: 'Lüğətçi Mirzə · Caspian Logistics', ago: 62 * 60000, run: termSheet },
      { av: p.avatarColor || 'av-nar', init: p.initials || 'AM', b: '1 240 söz təsdiqlədiniz', s: 'Xidmət müqaviləsi · 42 seqment', ago: 3 * 3600000, run: function () { goFirst(['editor', 'translate', 'projects'], { project: 'caspian' }, 'Redaktor hələ yüklənməyib'); } },
      { av: moh.av, init: moh.short, elder: moh.name, b: 'Möhür vuruldu: 94 bal', s: 'AzerGold — Təchizat müqaviləsi', ago: 26 * 3600000, run: function () { App.toast('Hazırdır', 'ok', { sub: 'QA hesabatı (PDF) möhürlə birlikdə paketdədir', icon: 'stamp' }); } },
      { ic: 'telegram', b: 'Telegram botu ilə 3 sürətli tərcümə', s: 'RU → AZ · 412 söz', ago: 30 * 3600000, run: function () { App.toast('Telegram botu qoşuludur', 'info', { sub: 'Mətni bota göndərin — tərcümə elə orada gəlir', icon: 'telegram' }); } }
    ];
    return h('section', { class: 'card home-act', 'aria-labelledby': 'home-act-h' },
      h('div', { class: 'card-h' }, h('div', null, h('span', { class: 'eyebrow', text: 'Son fəaliyyət' }), h('h2', { id: 'home-act-h', text: 'Masada nə baş verib' }))),
      h('div', { class: 'list' }, items.map(function (it) {
        return h('button', { class: 'list-row', type: 'button', onclick: function () { it.run(); } },
          it.ic ? icTile(it.ic) : (it.elder && App.elderFace && App.elderFace(it.elder, 'sm')) || h('span', { class: 'avatar sm ' + it.av, 'aria-hidden': 'true', text: it.init }),
          h('span', { class: 'tx' }, h('b', { text: it.b }), h('small', { text: it.s + ' · ' + rel(it.ago) })),
          h('span', { class: 'end', html: App.icon('chevron') }));
      })));
  }
  function turkishFixesSheet() {
    var fx = [
      ['tarafından imzalanır', 'tərəfindən imzalanır', 'Türk forması — ədəbi dildə «tərəfindən».'],
      ['30 gün içinde', '30 gün ərzində', '«içinde» türk formasıdır; «ərzində» işlənir.'],
      ['gerekli sənədlər', 'lazımi sənədlər', '«gerekli» Azərbaycan ədəbi dilinə aid deyil.']
    ];
    App.sheet({ title: 'Dilçi Nənənin düzəlişləri', body: h('div', { class: 'stack' },
      h('p', { class: 'muted', text: 'Kapital Bank — Kredit müqaviləsi, əlavə №2. Hər üç düzəliş tətbiq olunub, istəsəniz geri qaytara bilərsiniz.' }),
      h('div', { class: 'list' }, fx.map(function (f) {
        return h('div', { class: 'list-row home-issue' }, icTile('check', 'green'),
          h('span', { class: 'tx' }, h('b', null, h('s', { text: f[0] }), ' → ', h('ins', { text: f[1] })), h('small', { text: f[2] })));
      }))),
    actions: [{ label: 'Bağla', kind: 'primary' }] });
  }

  /* 5.9 notifications */
  function openNotifs(bell) {
    var N = [
      { ic: 'message', cls: 'nar', b: 'Kapital Bank əlavə №2-yə 2 yeni bənd göndərdi', s: 'Təhvil vaxtı dəyişmədi · ' + rel(14 * 60000) },
      { ic: 'stamp', cls: 'gold', b: 'AzerGold layihəsi möhürləndi: 94 bal', s: 'Möhürdar Mirzə · ' + rel(2 * 3600000) },
      { ic: 'card', cls: 'green', b: 'Ödəniş daxil oldu: ' + (App.fmt && App.fmt.money ? App.fmt.money(186) : '186 ₼'), s: 'ADA Universiteti — Tələbə bələdçisi · ' + rel(27 * 3600000) }
    ];
    App.sheet({ title: 'Bildirişlər', body: h('div', { class: 'list' }, N.map(function (n) {
      return h('div', { class: 'list-row' }, icTile(n.ic, n.cls), h('span', { class: 'tx' }, h('b', { text: n.b }), h('small', { text: n.s })));
    })), actions: [
      { label: 'Bağla', kind: 'ghost' },
      { label: 'Hamısı oxundu', kind: 'primary', icon: 'check', onClick: function () {
        sset('home:notifs-read', true);
        var dot = bell && bell.querySelector('.home-dot'); if (dot) dot.remove();
        if (bell) bell.setAttribute('aria-label', 'Bildirişlər');
        App.toast('Bildirişlər oxundu', 'ok');
      } }
    ] });
  }

  /* 5.10 sheets for quick actions */
  function pairSelect(id, val) {
    var pairs = (App.data && App.data.PAIRS) || App.PAIRS || [{ id: 'en-az', label: 'EN → AZ' }, { id: 'ru-az', label: 'RU → AZ' }, { id: 'tr-az', label: 'TR → AZ' }, { id: 'az-en', label: 'AZ → EN' }];
    return h('select', { class: 'select', id: id }, pairs.map(function (p) { return h('option', { value: p.id, selected: p.id === val }, p.label + (p.name ? ' · ' + p.name : '')); }));
  }
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

  function newProjectSheet() {
    var d = new Date(); d.setDate(d.getDate() + 3);
    var dVal = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    var reg = 'auto';
    var name = h('input', { class: 'input', id: 'home-np-name', placeholder: 'Məs.: Təchizat müqaviləsi — əlavə №3', autocomplete: 'off', autofocus: true });
    var err = h('span', { class: 'err', hidden: true }, ie('alert'), 'Layihənin adını yazın');
    var client = h('input', { class: 'input', id: 'home-np-client', placeholder: 'Məs.: AzerGold', autocomplete: 'off' });
    var due = h('input', { class: 'input', id: 'home-np-due', type: 'date', value: dVal });
    var body = h('div', { class: 'stack' },
      h('div', { class: 'field' }, h('label', { for: 'home-np-name' }, 'Layihənin adı'), name, err),
      h('div', { class: 'grid-2' },
        h('div', { class: 'field' }, h('label', { for: 'home-np-client' }, 'Müştəri ', h('span', { class: 'opt', text: 'istəyə görə' })), client),
        h('div', { class: 'field' }, h('label', { for: 'home-np-pair' }, 'Dil cütü'), pairSelect('home-np-pair', 'en-az'))),
      h('div', { class: 'field' }, h('label', { for: 'home-np-due' }, 'Təhvil tarixi'), due),
      h('div', { class: 'field' }, h('span', { class: 'label' }, 'Üslub'), regSeg(true, 'auto', function (r) { reg = r; }),
        h('span', { class: 'hint', text: '«Avto» seçilsə, Nuanza üslubu sənəddən özü tanıyacaq.' })));
    name.addEventListener('input', function () { if (name.value.trim()) { name.removeAttribute('aria-invalid'); err.hidden = true; } });
    App.sheet({ title: 'Yeni layihə', body: body, actions: [
      { label: 'Ləğv et', kind: 'ghost' },
      { label: 'Yarat', kind: 'primary', icon: 'plus', onClick: function () {
        var n = name.value.trim();
        if (!n) { name.setAttribute('aria-invalid', 'true'); err.hidden = false; name.focus(); return false; }
        var who = client.value.trim();
        App.toast('Layihə yaradıldı', 'ok', { sub: (who ? who + ' — ' : '') + n + (reg !== 'auto' ? ' · ' + reg : '') });
        nz('celebrate', 'Yeni layihə! Sənədi yükləyin, terminləri özüm çıxarım.', 2800);
        setTimeout(function () { if (hasScreen('projects')) App.go('projects', { created: n }); }, 500);
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
    var dz = h('label', { class: 'dropzone' }, file, h('span', { class: 'ic nar', html: App.icon('upload'), 'aria-hidden': 'true' }),
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
        var tm = a.tm || {}, est = a.estimate || {};
        res.appendChild(h('div', { class: 'home-file' }, icTile('file', 'nar'), h('span', { class: 'tx' }, h('b', { text: f.name }), h('small', { text: sizeLabel(f.size || 0) + ' · ' + num(a.words) + ' söz' })), badge('Analiz edildi', 'green', 'check')));
        res.appendChild(h('dl', { class: 'kv' },
          h('dt', { text: 'Sahə' }), h('dd', { text: a.domain }),
          h('dt', { text: 'Üslub' }), h('dd', { text: a.register + ' · avto' }),
          h('dt', { text: 'Cümlə' }), h('dd', { text: num(a.sentences) + ' · ' + lcFirst(a.readability || '') }),
          h('dt', { text: 'Tərcümə yaddaşı' }), h('dd', { text: num(tm.exact || 0) + ' tam · ' + num(tm.fuzzy || 0) + ' qismən · ' + num(tm.fresh || 0) + ' yeni' }),
          h('dt', { text: 'Təxmini vaxt' }), h('dd', { text: num(est.hours || 0, 1) + ' saat' }),
          h('dt', { text: 'Təxmini qiymət' }), h('dd', { text: num(est.price || 0, 2) + ' ' + (est.currency || 'AZN') })));
        if (a.risks && a.risks.length) res.appendChild(h('div', { class: 'callout' }, ie('alert'), h('div', null, h('b', { text: 'Məclis nəyə baxacaq' }), h('ul', { class: 'home-risks' }, a.risks.map(function (r) { return h('li', { text: r }); })))));
        if (s) s.setActions([
          { label: 'Başqa fayl', kind: 'ghost', keepOpen: true, onClick: function () { res.textContent = ''; dz.hidden = false; sampleBtn.hidden = false; file.value = ''; s.setActions(null); } },
          { label: 'Layihə yarat', kind: 'primary', icon: 'plus', onClick: function () {
            App.toast('Layihə yaradıldı', 'ok', { sub: f.name + ' · ' + num(a.words) + ' söz · ' + a.register });
            nz('celebrate', 'Layihə hazırdır! Terminləri lüğətə çıxardım.', 2600);
            setTimeout(function () { if (hasScreen('projects')) App.go('projects', { created: f.name }); }, 500);
          } }
        ]);
        nz('point', num(a.words) + ' söz, ' + lcFirst(a.domain || '') + '. Qiyməti hesabladım.', 2600);
      });
    }
    file.addEventListener('change', function () { analyze(file.files && file.files[0]); });
    ['dragenter', 'dragover'].forEach(function (ev) { dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.add('over'); }); });
    ['dragleave', 'dragend'].forEach(function (ev) { dz.addEventListener(ev, function () { dz.classList.remove('over'); }); });
    dz.addEventListener('drop', function (e) { e.preventDefault(); dz.classList.remove('over'); var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]; analyze(f); });
    sampleBtn.addEventListener('click', function () { analyze({ name: 'Caspian_Logistics_xidmet_muqavilesi.docx', size: 254000, type: '' }); });
    s = App.sheet({ title: 'Fayl yüklə', body: h('div', { class: 'stack' }, dz, h('p', { class: 'small muted' }, 'Faylınız yoxdur? ', sampleBtn), res) });
  }

  /* ------------------------------------------------------------------
     6. ACADEMY MODE — «Masa»
     ------------------------------------------------------------------ */
  var A = {};
  function todayXP() { var v = Number(sget('home:xp:' + dayKey(), 0)); return isFinite(v) ? v : 0; }
  function rankInfo(p) {
    if (p.rankInfo) return p.rankInfo;
    if (App.rank) return App.rank(p.xp);
    return { name: 'Münşi', index: 2, xp: p.xp || 1840, progress: 0.49, toNext: 660, nextName: 'Mirzə' };
  }
  function ranks() { return (App.data && App.data.RANKS) || App.RANKS || [{ name: 'Şagird', min: 0 }, { name: 'Katib', min: 400 }, { name: 'Münşi', min: 1200 }, { name: 'Mirzə', min: 2500 }, { name: 'Dilmanc', min: 5000 }, { name: 'Ustad', min: 10000 }]; }

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
    if (A.rank && A.rank.isConnected) A.rank = replaceNode(A.rank, rankCard(p));
    if (A.streak && A.streak.isConnected) A.streak = replaceNode(A.streak, streakCard(p));
    if (A.ms && A.ms.isConnected) A.ms = replaceNode(A.ms, missionsCard());
    if (A.sub && A.sub.isConnected) A.sub.textContent = academySub(p);
  }
  function academySub(p) {
    var t = todayXP(), g = p.dailyGoal || 30;
    return t >= g ? 'Bugünkü hədəf tamamdır: ' + t + ' XP. Seriya ' + (p.streak || 0) + ' gündür — əla gedirsiniz.'
      : 'Bu gün 15 dəqiqə ayıraq? Hədəfə ' + (g - t) + ' XP qalıb, seriya ' + (p.streak || 0) + ' gündür.';
  }

  function renderAcademy(page, post) {
    var p = profile(), now = new Date();
    A = {};
    A.sub = h('p', { text: academySub(p) });
    page.appendChild(h('div', { class: 'page-h' },
      h('div', null,
        h('span', { class: 'eyebrow', text: 'Akademiya · ' + dateLine(now) }),
        h('h1', { html: esc(greeting(now)) + ', <em>' + esc(p.firstName || 'dostum') + '</em>' }),
        A.sub)));
    A.rank = rankCard(p);
    A.streak = streakCard(p);
    page.appendChild(h('div', { class: 'home-top' }, A.rank, A.streak));
    A.cta = ctaButton();
    page.appendChild(A.cta);
    A.path = pathCard();
    page.appendChild(h('div', { class: 'grid-2' }, A.path, weaknessCard()));
    A.ms = missionsCard();
    page.appendChild(A.ms);
    page.appendChild(h('div', { class: 'sec-h' }, h('h2', { text: 'Alətlər' }), h('button', { class: 'link', type: 'button', onclick: function () { if (App.palette) App.palette(); else goFirst(['academy'], {}); } }, 'Bütün bölmələr')));
    page.appendChild(toolsGrid());
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
      nz('celebrate', r.name + ' rütbəsi sizə yaraşır! ' + (r.nextName ? r.nextName + ' yaxındır.' : ''), 2800);
    });
    var ladder = h('div', { class: 'home-ladder', 'aria-label': 'Rütbələr: ' + R.map(function (x) { return x.name; }).join(', ') });
    R.forEach(function (x, i) {
      if (i) ladder.appendChild(h('i', { 'aria-hidden': 'true' }));
      ladder.appendChild(h('span', { class: i === r.index ? 'cur' : '', text: x.name }));
    });
    var cardsDue = 14;
    return h('section', { class: 'card lacquer home-rank', 'aria-label': 'Rütbəniz: ' + r.name },
      h('span', { class: 'home-corner tl', 'aria-hidden': 'true' }), h('span', { class: 'home-corner tr', 'aria-hidden': 'true' }),
      h('span', { class: 'home-corner bl', 'aria-hidden': 'true' }), h('span', { class: 'home-corner br', 'aria-hidden': 'true' }),
      h('span', { class: 'eyebrow', text: 'Rütbəniz' }),
      medal,
      h('h2', { html: '<em>' + esc(r.name) + '</em>' }),
      h('div', { class: 'home-xp' },
        h('div', { class: 'progress gold', role: 'progressbar', 'aria-label': 'Növbəti rütbəyə qədər', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': pct }, h('i', { style: 'width:' + pct + '%' })),
        h('div', { class: 'home-xp-lbl' },
          h('span', null, h('b', { text: num(r.xp) }), ' XP'),
          h('span', { text: r.nextName ? r.nextName + ' üçün ' + num(r.toNext) + ' xal' : 'Ən yüksək rütbə' }))),
      ladder,
      h('button', { class: 'home-ladder-btn', type: 'button', onclick: function () { ranksSheet(r); } }, 'Rütbə yolu'),
      h('div', { class: 'home-rank-stats' },
        h('div', { class: 'stat' }, h('b', { text: '78' }), h('span', { text: 'orta bal' })),
        h('div', { class: 'stat' }, h('b', { text: String(p.streak || 0) }), h('span', { text: 'gün ardıcıl' })),
        h('div', { class: 'stat' }, h('b', { text: String(cardsDue) }), h('span', { text: 'kart təkrarda' }))));
  }
  function ranksSheet(r) {
    var R = ranks();
    App.sheet({ title: 'Rütbə yolu', body: h('div', { class: 'stack' },
      h('p', { class: 'muted', text: 'Rütbələr köhnə dəftərxana ənənəsindən gəlir: şagird öyrənir, katib yazır, münşi məktub qurur, mirzə sənəd hazırlayır, dilmanc dillər arasında körpü olur, ustad isə başqalarını öyrədir.' }),
      h('div', { class: 'list' }, R.map(function (x, i) {
        var state = i < r.index ? 'done' : i === r.index ? 'cur' : 'locked';
        return h('div', { class: 'list-row home-rank-row' },
          h('span', { class: 'medal sm' + (state === 'locked' ? ' locked' : state === 'cur' ? ' nar' : ''), 'aria-hidden': 'true' }, h('b', { text: x.name.charAt(0) })),
          h('span', { class: 'tx' }, h('b', { text: x.name }), h('small', { text: (RANK_NOTES[x.name] || '') + ' · ' + num(x.min) + ' XP' })),
          h('span', { class: 'end' }, state === 'done' ? badge('Keçildi', 'green', 'check') : state === 'cur' ? badge('Siz buradasınız', 'red') : h('span', { html: App.icon('lock'), class: 'home-lock', 'aria-label': 'Bağlıdır' })));
      }))), actions: [{ label: 'Bağla', kind: 'primary' }] });
  }

  /* 6.2 streak */
  var FLAME = '<svg viewBox="0 0 64 72" aria-hidden="true" focusable="false">' +
    '<path class="f-out" d="M32 2C36 14 52 22 52 42a20 20 0 0 1-40 0c0-9 4-15 9-20 0 7 3 11 7 13-1-12 1-23 4-33Z"/>' +
    '<path class="f-mid" d="M32 24c3 8 12 13 12 23a12 12 0 0 1-24 0c0-5 2-9 5-12 0 4 2 7 4 8 0-7 1-13 3-19Z"/>' +
    '<path class="f-in" d="M32 42c2 4 6 6 6 11a6 6 0 0 1-12 0c0-4 3-7 6-11Z"/></svg>';
  function streakCard(p) {
    var streak = Number(p.streak) || 0, best = Math.max(Number(p.bestStreak) || 0, streak), goal = p.dailyGoal || 30, t = todayXP();
    var now = new Date();
    var next = [3, 7, 14, 30, 60, 100, 365].filter(function (x) { return x > streak; })[0] || streak + 30;
    var flame = h('button', { class: 'home-flame', type: 'button', 'aria-label': streak + ' günlük seriya. Toxunun', html: FLAME });
    flame.addEventListener('click', function () {
      burstAt(flame, 'stars');
      nz('streak', streak + ' gün ardıcıl! ' + (t > 0 ? 'Bu gün də qorundu.' : 'Bu gün bir dərs seriyanı qoruyacaq.'), 2800);
    });
    var wd = [];
    for (var i = 6; i >= 0; i--) {
      var d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      var isToday = i === 0, done = isToday ? t > 0 : i <= streak;
      wd.push(h('span', { class: 'home-wd' + (done ? ' done' : '') + (isToday ? ' today' : ''), title: cap(WEEKDAYS[d.getDay()]) + (done ? ' — məşq edilib' : isToday ? ' — hələ məşq yoxdur' : '') },
        h('i', { html: done ? App.icon('check') : (isToday ? App.icon('flame') : '') }), WD_SHORT[d.getDay()]));
    }
    var gp = clamp(Math.round(t / goal * 100), 0, 100);
    return h('section', { class: 'card home-streak', 'aria-labelledby': 'home-streak-h' },
      h('div', { class: 'home-flame-row' }, flame,
        h('div', { class: 'home-streak-n' }, h('b', { id: 'home-streak-h', text: String(streak) }), h('span', { text: 'günlük seriya' }), h('small', { text: 'Ən uzun: ' + best + ' gün' }))),
      h('div', { class: 'home-wdays', 'aria-label': 'Son 7 gün' }, wd),
      h('div', { class: 'home-mile' },
        h('span', { class: 'medal sm' + (streak >= next ? '' : ' nar'), 'aria-hidden': 'true' }, h('b', { text: String(next) })),
        h('span', { class: 'tx' }, h('b', { text: 'Növbəti nişan: ' + next + ' gün' }), h('small', { text: (next - streak) + ' gün qalıb · +' + (next >= 30 ? 150 : 50) + ' XP' }))),
      h('div', { class: 'home-goal' },
        h('div', { class: 'row between' }, h('span', { class: 'muted', text: 'Bugünkü hədəf' }), h('b', { class: 'tnum', text: Math.min(t, 9999) + ' / ' + goal + ' XP' })),
        h('div', { class: 'progress' + (gp >= 100 ? ' green' : ''), role: 'progressbar', 'aria-label': 'Bugünkü hədəf', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': gp }, h('i', { style: 'width:' + gp + '%' })),
        t > 0 ? h('span', { class: 'badge green', style: 'justify-self:start' }, ie('check'), 'Seriya bu gün qorundu')
          : h('button', { class: 'btn btn-secondary btn-sm btn-block', type: 'button', onclick: function () { if (A.cta && A.cta.isConnected) lessonCTA(A.cta); } }, ie('flame'), 'Seriyanı bir dərslə qoru')));
  }

  /* 6.3 «Bu gün nə işləyim?» */
  function savedLesson() { var s = sget('home:lesson', null); return s && s.day === dayKey() && s.lesson ? s.lesson : null; }
  function ctaButton() {
    var L = savedLesson();
    var btn = h('button', { class: 'home-cta', type: 'button' },
      h('span', { class: 'home-cta-ic', html: App.icon(L ? 'book' : 'wand'), 'aria-hidden': 'true' }),
      h('span', { class: 'home-cta-tx' },
        h('b', { text: L ? 'Dərsiniz hazırdır' : 'Bu gün nə işləyim?' }),
        h('span', { text: L ? '«' + L.title + '» · ' + L.minutes + ' dəqiqə · +' + L.xp + ' XP' : 'Zəif yerinizə görə şəxsi dərs: yalançı dostlar · 6 dəqiqə · +30 XP' })),
      h('span', { class: 'home-cta-go', html: App.icon('arrow'), 'aria-hidden': 'true' }));
    btn.addEventListener('click', function () { lessonCTA(btn); });
    return btn;
  }
  function lessonCTA(btn) {
    var L0 = savedLesson();
    if (L0) { openLesson(L0, true); return; }
    if (isBusy(btn)) return;
    busy(btn, true);
    App.fakeAI('lesson', { id: WEAK[0].lesson }, 450).then(function (L) {
      busy(btn, false);
      if (L && L.ok === false) return null; /* live engine failed — fakeAI already showed the toast */
      if (!L || !L.title) throw new Error('lesson');
      var ex = (L.examples || []).length, qz = (L.quiz || []).length;
      return App.bigJob('Şəxsi dərs hazırlanır', {
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
      sset('home:lesson', null);
      if (A.cta && A.cta.isConnected) { A.cta = replaceNode(A.cta, ctaButton()); }
      App.toast('Yeni dərs üçün düyməyə toxunun', 'info', { sub: 'Məclis zəif yerinizə görə başqa mövzu seçəcək' });
    } });
    actions.push({ label: 'Dərsə başla', kind: 'primary', icon: 'play', onClick: function () {
      setTimeout(function () { goFirst(['lesson', 'lessons', 'academy'], { id: L.id, lesson: L.id }, 'Dərs ekranı hazırlanır'); }, 60);
    } });
    App.sheet({ title: L.title, body: body, actions: actions });
  }

  /* 6.4 learning path */
  var OCT = '<svg viewBox="0 0 36 36" aria-hidden="true" focusable="false"><polygon class="p" points="11,1 25,1 35,11 35,25 25,35 11,35 1,25 1,11"/><polygon class="o" points="11,1 25,1 35,11 35,25 25,35 11,35 1,25 1,11"/></svg>';
  function pathIdx() { var v = Number(sget('home:path', 2)); return isFinite(v) ? clamp(v, 0, PATH.length) : 2; }
  function pathCard() {
    var cur = pathIdx();
    var list = h('ol', { class: 'home-path' }, PATH.map(function (st, i) {
      var state = i < cur ? 'done' : i === cur ? 'next' : 'locked';
      var oct = h('span', { class: 'home-oct', html: OCT }, h('span', { html: state === 'done' ? App.icon('check') : '', text: state === 'done' ? null : String(i + 1) }));
      var end = state === 'done' ? badge('Hazır', 'green') : state === 'next' ? badge('İndi', 'red') : h('span', { class: 'home-lock', html: App.icon('lock'), 'aria-hidden': 'true' });
      var b = h('button', { class: 'home-step-btn', type: 'button', 'aria-label': (i + 1) + '. ' + st.t + ' — ' + (state === 'done' ? 'tamamlanıb' : state === 'next' ? 'növbəti addım' : 'bağlıdır') },
        oct, h('span', { class: 'home-step-tx' }, h('b', { text: st.t }), h('small', { text: st.s })), end);
      b.addEventListener('click', function () { stepClick(i, state, b); });
      return h('li', { class: 'home-step ' + state }, b);
    }));
    var done = cur >= PATH.length;
    return h('section', { class: 'card home-pathcard', 'aria-labelledby': 'home-path-h' },
      h('div', { class: 'card-h' },
        h('div', null, h('span', { class: 'eyebrow', text: 'Əsas yol' }), h('h2', { id: 'home-path-h', text: done ? 'Dövrə tamamlandı' : 'Mətndən inkişafa' })),
        h('span', { class: 'badge navy tnum', text: Math.min(cur, PATH.length) + ' / ' + PATH.length })),
      list,
      done ? h('button', { class: 'btn btn-secondary btn-sm', type: 'button', style: 'margin-top:10px', onclick: function () {
        sset('home:path', 0); A.path = replaceNode(A.path, pathCard());
        App.toast('Yeni dövrə başladı', 'ok', { sub: 'Növbəti mətn səviyyənizə görə seçiləcək' });
      } }, ie('refresh'), 'Yeni dövrə') : null);
  }
  function advancePath(to) {
    sset('home:path', to);
    if (A.path && A.path.isConnected) A.path = replaceNode(A.path, pathCard());
  }
  function stepClick(i, state, btn) {
    if (state === 'done') { App.toast('«' + PATH[i].t + '» tamamlanıb', 'ok', { sub: PATH[i].s }); return; }
    if (state === 'locked') { App.toast('Hələ bağlıdır', 'warn', { sub: 'Əvvəlcə «' + PATH[pathIdx()].t + '» addımını bitirin', icon: 'lock' }); return; }
    if (i === 0) {
      advancePath(1);
      App.toast('Mətn seçildi', 'ok', { sub: 'Kapital Bank — kredit şərtləri · 140 söz · B2 · Hüquqi üslub' });
      nz('read', 'Gözəl mətndir: «shall» və rəqəmlərə diqqət!', 2400);
      return;
    }
    if (i === 2) { gradeStep(btn); return; }
    var go = { 1: ['practice', 'translate'], 3: ['cards', 'review', 'academy'], 4: ['practice', 'academy'], 5: ['progress', 'stats', 'academy'] }[i] || ['academy'];
    advancePath(i + 1);
    if (i === PATH.length - 1) { var pt = pointOf(btn); addXP(50, pt); burstAt(btn, 'confetti'); }
    goFirst(go, { from: 'home', step: i + 1 }, 'Bu bölmə hazırlanır');
  }
  function gradeStep(btn) {
    if (isBusy(btn)) return;
    busy(btn, true);
    App.fakeAI('grade', {
      src: 'The Contractor shall notify the Employer within 14 days.',
      text: 'Podratçı 14 gün ərzində İşəgötürəni xəbərdar etməlidir.',
      model: 'Podratçı 14 gün ərzində Sifarişçini xəbərdar etməlidir.'
    }, 500).then(function (r) {
      busy(btn, false);
      if (!r || r.ok === false) throw new Error('grade'); /* live engine failed — fakeAI already showed the toast */
      var v = r.verdict || { score: r.score, text: 'Tapşırıq yoxlandı.' };
      return App.bigJob('Tapşırığınız yoxlanılır', v).then(function () { return r; });
    }).then(function (r) {
      advancePath(3);
      var gained = r.xp || Math.round((r.score || 80) / 2);
      var ms = sget('home:ms:' + dayKey(), {}) || {}; ms.turk = 3; sset('home:ms:' + dayKey(), ms);
      var node = A.path && A.path.querySelector('.home-step.done:nth-child(3) .home-oct');
      addXP(gained, pointOf(node || A.path));
      App.toast('+' + gained + ' XP', 'ok', { sub: 'Növbəti addım: «Səhvləri öyrənin»', icon: 'star' });
    }, function () { busy(btn, false); });
  }

  /* 6.5 weaknesses */
  function weaknessCard() {
    var rows = WEAK.map(function (w, i) {
      var b = h('button', { class: 'home-weak-row', type: 'button', 'aria-label': w.t + ': səhvlərin ' + w.v + '%-i. Bu mövzuda dərsə baxın' },
        h('span', { text: w.t }),
        h('span', { class: 'progress' + (i ? ' gold' : ''), 'aria-hidden': 'true' }, h('i', { style: 'width:' + Math.round(w.v / WEAK[0].v * 100) + '%' })),
        h('span', { class: 'n', text: w.v + '%' }));
      b.addEventListener('click', function () {
        if (isBusy(b)) return;
        busy(b, true);
        App.fakeAI('lesson', { id: w.lesson }, 500).then(function (L) {
          busy(b, false);
          if (!L || L.ok === false || !L.title) return; /* live engine failed — fakeAI already showed the toast */
          openLesson(L, false);
        }, function () { busy(b, false); });
      });
      return b;
    });
    return h('section', { class: 'card', 'aria-labelledby': 'home-weak-h' },
      h('div', { class: 'card-h' }, h('div', null, h('span', { class: 'eyebrow', text: 'Zəif tərəflər' }), h('h2', { id: 'home-weak-h', text: 'Səhvlərin xəritəsi' })),
        h('span', { class: 'small muted', text: 'son 30 gün' })),
      h('div', { class: 'home-weak' }, rows),
      h('div', { class: 'callout', style: 'margin-top:12px' }, ie('bulb'),
        h('div', null, 'Əsas zəifliyiniz: ', h('b', { text: 'yalançı dostlar' }), '. Məsələn, ' + WEAK[0].eg + ' deməkdir.')));
  }

  /* 6.6 missions */
  function msProgress(m) {
    var st = sget('home:ms:' + dayKey(), {}) || {};
    var v = st[m.id] != null ? Number(st[m.id]) : m.cur;
    if (m.id === 'lesson' && todayXP() >= 30) v = Math.max(v, 1);
    return clamp(isFinite(v) ? v : m.cur, 0, m.max);
  }
  function claimKey(m) { return 'home:claimed:' + (m.weekly ? weekKey() : dayKey()); }
  function isClaimed(m) { var c = sget(claimKey(m), {}) || {}; return !!c[m.id]; }
  function claim(m, btn) {
    if (isClaimed(m)) return;
    var c = sget(claimKey(m), {}) || {}; c[m.id] = true; sset(claimKey(m), c);
    burstAt(btn, 'stars');
    nz('success', '+' + m.xp + ' XP! Belə davam edək.', 2200);
    addXP(m.xp, pointOf(btn));
  }
  function missionsCard() {
    var done = 0;
    var rows = MISSIONS.map(function (m) {
      var cur = msProgress(m), complete = cur >= m.max, claimed = complete && isClaimed(m);
      if (claimed) done++;
      var pct = Math.round(cur / m.max * 100);
      var tx = h('span', { class: 'tx' },
        h('b', { text: m.t }),
        h('small', { text: m.s + ' · ' + cur + ' / ' + m.max }),
        h('span', { class: 'progress thin' + (complete ? ' green' : ' gold'), 'aria-hidden': 'true' }, h('i', { style: 'width:' + pct + '%' })));
      var ic = icTile(complete ? 'check' : m.ic, complete ? 'green' : m.weekly ? 'nar' : 'gold');
      if (claimed) return h('div', { class: 'list-row' }, ic, tx, h('span', { class: 'end' }, badge('Alındı', 'green', 'check')));
      if (complete) {
        var cb = h('button', { class: 'btn btn-primary btn-sm', type: 'button' }, ie('star'), '+' + m.xp + ' XP al');
        cb.addEventListener('click', function () { claim(m, cb); });
        return h('div', { class: 'list-row' }, ic, tx, h('span', { class: 'end' }, cb));
      }
      return h('button', { class: 'list-row', type: 'button', onclick: function () { goFirst(m.go || ['academy'], { mission: m.id }, 'Bu bölmə hazırlanır'); } },
        ic, tx, h('span', { class: 'end' }, badge('+' + m.xp + ' XP', 'gold'), h('span', { html: App.icon('chevron'), 'aria-hidden': 'true', style: 'display:inline-flex' })));
    });
    return h('section', { class: 'card home-ms', 'aria-labelledby': 'home-ms-h' },
      h('div', { class: 'card-h' },
        h('div', null, h('span', { class: 'eyebrow', text: 'Missiyalar' }), h('h2', { id: 'home-ms-h', text: 'Bugünkü tapşırıqlar' })),
        h('span', { class: 'badge navy tnum', text: done + ' / ' + MISSIONS.length })),
      h('div', { class: 'list' }, rows));
  }

  /* 6.7 tools */
  function toolsGrid() {
    var tools = [
      { t: 'Dərslər', s: 'Qısa, 5–7 dəqiqəlik', ic: 'book', cls: 'nar', go: ['lessons', 'academy'] },
      { t: 'Məşq', s: 'Zəif yerinizə görə', ic: 'target', cls: '', go: ['practice', 'academy'] },
      { t: 'Səhv kartları', s: '14 kart təkrarda', ic: 'cards', cls: 'gold', go: ['cards', 'review', 'academy'] },
      { t: 'Tərcüməçi', s: 'Üslub nəzarəti ilə', ic: 'translate', cls: '', go: ['translate'] },
      { t: 'Termin lüğəti', s: 'Hüquq, maliyyə, neft-qaz', ic: 'tag', cls: 'green', run: termSheet },
      { t: 'İmtahan', s: 'Məclis qiymət verir', ic: 'medal', cls: 'gold', go: ['exam', 'academy'] }
    ];
    return h('div', { class: 'tiles', role: 'group', 'aria-label': 'Alətlər' }, tools.map(function (t) {
      return h('button', { class: 'tile', type: 'button', onclick: function () { if (t.run) t.run(); else goFirst(t.go, {}, t.t + ' bölməsi hazırlanır'); } },
        icTile(t.ic, t.cls), h('span', null, h('b', { text: t.t }), h('small', { text: t.s })));
    }));
  }

  /* ------------------------------------------------------------------
     7. NUANZA REACTS ON ENTER
     ------------------------------------------------------------------ */
  function react(mode) {
    if (!sget('onboarded', false)) return;
    var p = profile();
    if (firstEnter()) {
      /* The shell greets with a wave right after start; only wave here when home is reached later. */
      var t = W.performance && W.performance.now ? W.performance.now() : 99999;
      if (t < 2600) return;
      later(function () {
        nz('wave', mode === 'academy' ? 'Salam, ' + p.firstName + '! Seriyanı qoruyaq — bu gün bir dərs?' : 'Salam, ' + p.firstName + '! Masanız hazırdır.', 3200);
      }, 450);
      return;
    }
    later(function () {
      if (mode === 'academy') {
        var tx = todayXP(), g = p.dailyGoal || 30;
        if (tx >= g) nz('success', 'Bugünkü hədəf tamamdır. Əla iş!', 2600);
        else nz('streak', (p.streak || 0) + ' günlük seriya! Hədəfə ' + (g - tx) + ' XP qalıb.', 2800);
      } else {
        var P = projects()[0];
        nz('point', P.client + ' təhvilinə ' + leftLabel(P.due.getTime() - Date.now()) + ' qalıb.', 2800);
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
