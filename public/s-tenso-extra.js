/* =====================================================================
   TENSO — s-tenso-extra.js  (English grammar product, <html data-mode="grammar">)
   window.TensoExtra
     .ask({sentence, wrong, fix, rule, ruleTitle, why, lang})  → «Tensodan soruş» bottom sheet chat
     .addXP(n, reason, {el|x,y})  → {total, today, week, goal, streak, newDay, reachedGoal}
     .streak()   → {current, best, last, activeToday, atRisk}
     .weekly()   → {xp, goal, pct, left, days:[{date,label,xp,today,future}], start}
     .setGoal(n) · .challenge() · .renderStreakCard(el, {compact})
   Screens (mode 'grammar'):
     'g-rewrite'   «Yenidən yaz» — style rewrite with highlighted changes (live only)
     'g-dictation' «Diktant»     — speechSynthesis dictation + word-by-word diff (offline)
   Store: 'tenso:xp', 'tenso:streak', 'tenso:level', 'tenso:dict-rate', 'tenso:dict-voice'
   Screen CSS is prefixed .tx- ; colours come only from app.css tokens.
   ===================================================================== */
(function () {
  'use strict';
  var W = window, D = document;
  var App = W.App;
  if (!App || typeof App.h !== 'function') return;
  var h = App.h;

  /* ------------------------------------------------------------------
     1. HELPERS
     ------------------------------------------------------------------ */
  function has(o, k) { return o != null && Object.prototype.hasOwnProperty.call(o, k); }
  function ie(name) { try { return App.iconEl(name); } catch (e) { return null; } }
  function sget(k, fb) { try { var v = App.store.get(k, fb); return v === undefined || v === null ? fb : v; } catch (e) { return fb; } }
  function sset(k, v) { try { App.store.set(k, v); } catch (e) { /* storage blocked */ } }
  function str(v) { return v == null ? '' : String(v); }
  function trim(s) { return str(s).replace(/\s+/g, ' ').trim(); }
  function short(s, n) { s = trim(s); return s.length > n ? s.slice(0, n - 1).trim() + '…' : s; }
  function arr(v) { return Array.isArray(v) ? v.filter(function (x) { return x != null && x !== ''; }) : []; }
  function num(n) { try { return App.fmt && App.fmt.num ? App.fmt.num(n) : String(n); } catch (e) { return String(n); } }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function log(e) { try { console.error('[Tenso]', e); } catch (x) { /* ignore */ } }
  function toast(t, kind, o) { try { return App.toast(t, kind, o); } catch (e) { return null; } }
  function online() { return !(W.navigator && W.navigator.onLine === false); }
  function liveAI() { return !!(W.NuanzaAI && typeof W.NuanzaAI.call === 'function' && W.NUANZA_LIVE !== false && online()); }
  function errText(e) { try { return W.NuanzaAI && W.NuanzaAI.errText ? W.NuanzaAI.errText(e) : 'Xəta baş verdi. Yenidən cəhd edin.'; } catch (x) { return 'Xəta baş verdi.'; } }
  function q(t) { return W.NuanzaAI && W.NuanzaAI.q ? W.NuanzaAI.q(t) : '"""' + str(t).replace(/"""/g, '"') + '"""'; }
  function ORTHO() { return (W.NuanzaAI && W.NuanzaAI.ORTHO) || 'All Azerbaijani text must use standard Azerbaijani Latin orthography with ə ğ ı ö ü ş ç — never Turkish words or spellings.'; }
  function parsed(v) {
    if (v && typeof v === 'string') { try { v = JSON.parse(v.replace(/^```(?:json)?|```$/g, '').trim()); } catch (e) { return null; } }
    return v && typeof v === 'object' ? v : null;
  }
  function burstAt(el, kind) { try { if (App.fx && el && el.isConnected) App.fx.burstAt(el, kind || 'stars'); } catch (e) { /* ignore */ } }
  function lowerEn(s) { return str(s).toLowerCase(); }
  function busy(btn, on) { if (!btn) return; if (on) { btn.setAttribute('aria-busy', 'true'); btn.disabled = true; } else { btn.removeAttribute('aria-busy'); btn.disabled = false; } }

  /* Tenso (mini) — one instance per host, destroyed with it. */
  function mountTenso(host, state, width) {
    host.textContent = '';
    if (W.Nuanza && typeof W.Nuanza.mount === 'function') {
      try {
        var m = W.Nuanza.mount(host, { size: 'mini', who: 'tenso', width: width || 64, interactive: false, label: 'Tenso' });
        if (m && state && m.set) m.set(state, {});
        if (m) return m;
      } catch (e) { log(e); }
    }
    host.appendChild(h('span', { class: 'medal sm', 'aria-hidden': 'true' }, h('b', { text: 'T' })));
    return null;
  }
  function tset(inst, state, ms) { if (inst && inst.set) { try { inst.set(state, ms ? { ms: ms } : {}); } catch (e) { /* ignore */ } } }
  function dock(state, text, ms) {
    var c = App.companion; if (!c || typeof c.set !== 'function') return;
    var o = {}; if (ms) o.ms = ms; if (text) o.say = text;
    try { c.set(state, o); } catch (e) { /* ignore */ }
  }

  /* ------------------------------------------------------------------
     2. CSS
     ------------------------------------------------------------------ */
  var CSS = [
    /* shared */
    '.tx-page .page-h h1 em{color:var(--heading-em)}',
    '.tx-hero,.page-h > .tx-hero{display:flex;align-items:flex-end;gap:14px;min-width:0}',
    '.tx-rw .seg.wrap{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}',
    '@media (min-width:640px){.tx-rw .seg.wrap{grid-template-columns:repeat(4,minmax(0,1fr))}}',
    '.tx-hero > div:last-child{min-width:0;display:grid;gap:6px}',
    '.tx-art{flex:none;width:64px;min-height:64px;display:grid;place-items:end center}',
    '.tx-row{display:flex;flex-wrap:wrap;align-items:center;gap:8px;min-width:0}',
    '.tx-row.end{justify-content:flex-end}',
    '.tx-sp{flex:1 1 auto}',
    '.tx-note{color:var(--soft);font-size:var(--fs-sm);line-height:1.5}',
    '.tx-count{color:var(--faint);font-size:var(--fs-xs);font-variant-numeric:tabular-nums}',
    '.tx-ins{background:var(--ok-t);color:var(--ink);border-radius:4px;padding:0 2px;box-shadow:inset 0 -2px 0 color-mix(in srgb,var(--ok) 60%,transparent)}',
    '.tx-del{color:var(--nar);text-decoration:line-through;text-decoration-thickness:2px;opacity:.85}',
    '.tx-mis{color:var(--ok);border-bottom:2px dashed var(--ok);padding:0 1px}',
    '.tx-wrong{display:inline-flex;flex-wrap:wrap;align-items:baseline;gap:3px}',
    '.tx-dots{display:inline-flex;gap:4px;padding:4px 2px}',
    '.tx-dots i{width:7px;height:7px;border-radius:50%;background:var(--faint);animation:tx-dot 1s var(--ease-in-out) infinite}',
    '.tx-dots i:nth-child(2){animation-delay:.15s}.tx-dots i:nth-child(3){animation-delay:.3s}',
    '@keyframes tx-dot{0%,80%,100%{opacity:.3;transform:translateY(0)}40%{opacity:1;transform:translateY(-3px)}}',
    '@keyframes tx-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}',
    /* ask sheet */
    '.tx-ask .sheet-b{display:grid;gap:12px;align-content:start;padding-bottom:12px}',
    '.tx-ctx{display:flex;align-items:flex-end;gap:12px;min-width:0}',
    '.tx-ctx .tx-art{width:56px;min-height:56px}',
    '.tx-ctx-card{flex:1;min-width:0;padding:10px 12px;border:1px solid var(--line);border-radius:var(--r-md);background:var(--surface2);font-size:var(--fs-sm);line-height:1.55;overflow-wrap:anywhere}',
    '.tx-ctx-card .lbl{display:block;color:var(--faint);font-size:.6875rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:2px}',
    '.tx-ctx-card .fix{margin-top:4px;color:var(--soft)}',
    '.tx-chat{display:grid;gap:10px;min-width:0}',
    '.tx-msg{max-width:92%;padding:10px 13px;border-radius:16px;font-size:var(--fs-base);line-height:1.55;overflow-wrap:anywhere;animation:tx-in .28s var(--ease-out) both}',
    '.tx-msg.me{justify-self:end;background:var(--firuze);color:var(--on-firuze);border-radius:16px 16px 4px 16px}',
    '.tx-msg.t{justify-self:start;background:var(--surface2);color:var(--ink);border:1px solid var(--line);border-radius:16px 16px 16px 4px}',
    '.tx-msg.t p + p{margin-top:6px}',
    '.tx-msg .tx-off{display:flex;gap:6px;align-items:center;margin-top:8px;color:var(--soft);font-size:var(--fs-xs)}',
    '.tx-msg .tx-off svg{width:14px;height:14px;flex:none}',
    '.tx-ex{display:grid;gap:6px;margin-top:8px;padding:0;list-style:none}',
    '.tx-ex li{padding:7px 10px;border-radius:var(--r-sm);background:var(--surface);border:1px solid var(--line);font-size:var(--fs-sm)}',
    '.tx-ex li b{display:block;font-weight:600;color:var(--ink)}',
    '.tx-ex li span{color:var(--soft)}',
    '.tx-quiz{display:grid;gap:8px;margin-top:8px}',
    '.tx-qi{display:grid;gap:6px;padding:9px 10px;border-radius:var(--r-sm);background:var(--surface);border:1px solid var(--line);font-size:var(--fs-sm)}',
    '.tx-qi.ok{border-color:color-mix(in srgb,var(--ok) 55%,var(--line));background:var(--ok-t)}',
    '.tx-qi.bad{border-color:color-mix(in srgb,var(--nar) 45%,var(--line))}',
    '.tx-qi .q{font-weight:600}',
    '.tx-qi .tx-row .input{flex:1 1 140px;min-height:38px}',
    '.tx-qi .res{font-size:var(--fs-xs);color:var(--soft)}',
    '.tx-qi.ok .res{color:var(--ok)}.tx-qi.bad .res{color:var(--nar)}',
    '.tx-qi .chip[data-st="ok"]{background:var(--ok);border-color:var(--ok);color:var(--surface)}',
    '.tx-qi .chip[data-st="bad"]{border-color:var(--nar);color:var(--nar)}',
    '.tx-quick{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;padding-bottom:2px}',
    '.tx-quick::-webkit-scrollbar{display:none}',
    '.tx-quick .chip{flex:none;cursor:pointer}',
    '.tx-ask-f{flex-direction:column;gap:8px}',
    '.tx-ask-f form{display:flex;gap:8px;min-width:0}',
    '.tx-ask-f .input{flex:1;min-width:0}',
    '.tx-ask-f .btn{flex:none}',
    /* rewrite */
    '.tx-rw-out{font-size:var(--fs-md);line-height:1.7;overflow-wrap:anywhere;white-space:pre-wrap}',
    '.tx-chg{display:grid;gap:8px;margin:0;padding:0;list-style:none}',
    '.tx-chg li{display:grid;gap:4px;padding:10px 12px;border-radius:var(--r-md);background:var(--surface2);font-size:var(--fs-sm);line-height:1.5;animation:tx-in .3s var(--ease-out) both}',
    '.tx-chg .pair{display:flex;flex-wrap:wrap;align-items:baseline;gap:6px;font-weight:600}',
    '.tx-chg .pair svg{width:14px;height:14px;color:var(--faint);flex:none;align-self:center}',
    '.tx-chg .why{color:var(--soft)}',
    /* dictation */
    '.tx-dict-stage{display:flex;align-items:center;gap:14px;min-width:0}',
    '.tx-play{flex:none;width:64px;height:64px;border-radius:50%;border:0;display:grid;place-items:center;cursor:pointer;background:var(--firuze);color:var(--on-firuze);box-shadow:var(--sh-2);transition:transform var(--t-fast) var(--ease-out)}',
    '.tx-play svg{width:28px;height:28px}',
    '.tx-play:active{transform:scale(.94)}',
    '.tx-play:focus-visible{outline:2px solid var(--focus);outline-offset:3px}',
    '.tx-play.on{animation:tx-pulse 1.1s var(--ease-in-out) infinite}',
    '@keyframes tx-pulse{0%,100%{box-shadow:0 0 0 0 color-mix(in srgb,var(--firuze) 45%,transparent)}50%{box-shadow:0 0 0 10px color-mix(in srgb,var(--firuze) 0%,transparent)}}',
    '.tx-rate{display:grid;gap:4px;flex:1;min-width:0}',
    '.tx-rate label{display:flex;justify-content:space-between;font-size:var(--fs-xs);color:var(--soft)}',
    '.tx-rate input{width:100%;accent-color:var(--firuze)}',
    '.tx-blur{position:relative;padding:14px;border-radius:var(--r-md);background:var(--surface2);font-size:var(--fs-md);line-height:1.6;overflow-wrap:anywhere;user-select:none;-webkit-user-select:none}',
    '.tx-blur span{filter:blur(7px);transition:filter var(--t-slow) var(--ease-out)}',
    '.tx-blur.show span{filter:none}',
    '.tx-diff{font-size:var(--fs-md);line-height:2;overflow-wrap:anywhere}',
    '.tx-diff .w{display:inline;padding:1px 2px;border-radius:4px}',
    '.tx-diff .w.ok{color:var(--ink)}',
    '.tx-diff .w.extra{color:var(--nar);text-decoration:line-through;text-decoration-thickness:2px;background:var(--nar-t)}',
    '.tx-diff .w.bad{color:var(--nar);text-decoration:line-through;text-decoration-thickness:2px}',
    '.tx-diff .w.fix{color:var(--ok);background:var(--ok-t)}',
    '.tx-diff .w.miss{color:var(--ok);border-bottom:2px dashed var(--ok);border-radius:0}',
    '.tx-legend{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:var(--fs-xs);color:var(--soft)}',
    '.tx-legend span{display:inline-flex;align-items:center;gap:6px}',
    '.tx-legend i{width:10px;height:10px;border-radius:3px;flex:none}',
    '.tx-score{display:flex;align-items:center;gap:12px}',
    '.tx-score b{font-family:var(--f-display);font-size:1.75rem;font-weight:600;line-height:1;font-variant-numeric:tabular-nums}',
    '.tx-score.good b{color:var(--ok)}.tx-score.mid b{color:var(--zafaran-ink)}.tx-score.low b{color:var(--nar)}',
    '.tx-pts{display:grid;gap:6px;margin:0;padding:0;list-style:none}',
    '.tx-pts li{display:flex;gap:8px;align-items:flex-start;font-size:var(--fs-sm);line-height:1.5}',
    '.tx-pts li svg{width:16px;height:16px;flex:none;margin-top:2px;color:var(--firuze)}',
    /* streak card */
    '.tx-sc{display:grid;gap:14px}',
    '.tx-sc-top{display:flex;align-items:center;gap:14px;min-width:0}',
    '.tx-flame{flex:none;width:52px;height:52px;border-radius:16px;display:grid;place-items:center;background:var(--zaf-t);color:var(--zafaran-ink)}',
    '.tx-flame svg{width:26px;height:26px}',
    '.tx-flame.off{background:var(--surface2);color:var(--faint)}',
    '.tx-sc-top .tx-sc-t{flex:1;min-width:0;display:grid;gap:2px}',
    '.tx-sc-top .tx-sc-t b{font-family:var(--f-display);font-size:1.125rem;font-weight:600}',
    '.tx-sc-top .tx-sc-t small{color:var(--soft)}',
    '.tx-sc-xp{display:flex;align-items:baseline;justify-content:space-between;gap:8px;font-size:var(--fs-sm);color:var(--soft)}',
    '.tx-sc-xp b{color:var(--ink);font-variant-numeric:tabular-nums}',
    '.tx-week{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:6px}',
    '.tx-day{display:grid;justify-items:center;gap:4px;font-size:.6875rem;color:var(--faint)}',
    '.tx-day i{width:100%;max-width:34px;height:34px;border-radius:10px;display:grid;place-items:center;background:var(--surface2);border:1px solid var(--line);font-style:normal;font-weight:600;font-size:.6875rem;color:var(--faint);font-variant-numeric:tabular-nums}',
    '.tx-day.done i{background:var(--firuze);border-color:var(--firuze);color:var(--on-firuze)}',
    '.tx-day.today{color:var(--ink);font-weight:700}',
    '.tx-day.today i{box-shadow:0 0 0 2px var(--bg),0 0 0 4px color-mix(in srgb,var(--firuze) 55%,transparent)}',
    '.tx-day.future i{opacity:.55}',
    '.tx-sc.compact .tx-week{display:none}',
    '.tx-sc .progress > i{transition:width .6s var(--ease-out)}',
    '.tx-goal-opts{display:flex;flex-wrap:wrap;gap:8px}'
  ].join('\n');
  function css() { try { App.css('tenso-extra', CSS); } catch (e) { /* ignore */ } }

  /* ------------------------------------------------------------------
     3. XP · STREAK · WEEKLY GOAL
     ------------------------------------------------------------------ */
  var GOAL_DEF = 150;
  var DAY_AZ = ['B.e', 'Ç.a', 'Ç', 'C.a', 'C', 'Ş', 'B'];
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function dkey(d) { d = d || new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function addDays(d, n) { var x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() + n); return x; }
  function weekStart(d) { d = d || new Date(); var dow = (d.getDay() + 6) % 7; return addDays(d, -dow); }
  function xpData() {
    var v = sget('tenso:xp', null);
    if (!v || typeof v !== 'object') v = {};
    if (!v.days || typeof v.days !== 'object') v.days = {};
    v.total = Math.max(0, Number(v.total) || 0);
    var g = Number(v.goal); v.goal = g >= 10 && g <= 5000 ? Math.round(g) : GOAL_DEF;
    if (!Array.isArray(v.log)) v.log = [];
    return v;
  }
  function stData() {
    var v = sget('tenso:streak', null);
    if (!v || typeof v !== 'object') v = {};
    return { cur: Math.max(0, Number(v.cur) || 0), best: Math.max(0, Number(v.best) || 0), last: v.last || null, goalWeek: v.goalWeek || null };
  }
  function weekXP(v, start) {
    var s = 0; for (var i = 0; i < 7; i++) s += Number(v.days[dkey(addDays(start, i))]) || 0; return s;
  }
  function streak() {
    var s = stData(), today = dkey(), yest = dkey(addDays(new Date(), -1));
    var cur = s.last === today || s.last === yest ? s.cur : 0;
    return { current: cur, best: Math.max(s.best, cur), last: s.last, activeToday: s.last === today, atRisk: s.last === yest && cur > 0 };
  }
  function weekly() {
    var v = xpData(), now = new Date(), st = weekStart(now), today = dkey(now), days = [];
    for (var i = 0; i < 7; i++) {
      var d = addDays(st, i), k = dkey(d);
      days.push({ date: k, label: DAY_AZ[i], xp: Number(v.days[k]) || 0, today: k === today, future: d > now && k !== today });
    }
    var xp = weekXP(v, st);
    return { xp: xp, goal: v.goal, pct: Math.min(100, Math.round(xp / v.goal * 100)), left: Math.max(0, v.goal - xp), days: days, start: dkey(st), total: v.total };
  }
  function prune(days) {
    var cut = dkey(addDays(new Date(), -120)), out = {};
    for (var k in days) if (has(days, k) && k >= cut) out[k] = days[k];
    return out;
  }
  function celebrate(el, text) {
    try {
      var x = W.innerWidth / 2, y = W.innerHeight / 3;
      if (el && el.getBoundingClientRect && el.isConnected) { var r = el.getBoundingClientRect(); x = r.left + r.width / 2; y = r.top + r.height / 2; }
      if (W.NuanzaFX && typeof W.NuanzaFX.burst === 'function') W.NuanzaFX.burst(x, y, 'stars');
      else if (App.fx) App.fx.burst(x, y, 'stars');
    } catch (e) { /* ignore */ }
    dock('celebrate', text, 2600);
  }
  function addXP(n, reason, opts) {
    opts = opts || {};
    n = Math.round(Number(n) || 0);
    if (n <= 0 || n > 1000) return null;
    var v = xpData(), now = new Date(), today = dkey(now), st = weekStart(now);
    var before = weekXP(v, st);
    v.days[today] = (Number(v.days[today]) || 0) + n;
    v.days = prune(v.days);
    v.total += n;
    v.log.unshift({ t: Date.now(), n: n, r: short(reason || 'XP', 60) });
    v.log = v.log.slice(0, 40);
    sset('tenso:xp', v);
    /* streak — any XP that day counts */
    var s = stData(), yest = dkey(addDays(now, -1)), newDay = s.last !== today;
    if (newDay) { s.cur = s.last === yest ? s.cur + 1 : 1; s.last = today; s.best = Math.max(s.best, s.cur); }
    var after = before + n, reached = before < v.goal && after >= v.goal && s.goalWeek !== dkey(st);
    if (reached) s.goalWeek = dkey(st);
    sset('tenso:streak', s);
    /* feedback */
    try {
      var x = opts.x, y = opts.y;
      if ((x == null || y == null) && opts.el && opts.el.getBoundingClientRect && opts.el.isConnected) { var r = opts.el.getBoundingClientRect(); x = r.left + r.width / 2; y = r.top; }
      if (x != null && y != null) {
        if (W.NuanzaFX && typeof W.NuanzaFX.xp === 'function') W.NuanzaFX.xp(x, y, '+' + n + ' XP');
        else if (App.fx) App.fx.xp(x, y, '+' + n + ' XP');
      }
    } catch (e) { /* ignore */ }
    if (reached) {
      celebrate(opts.el, 'Həftəlik hədəf tamam! ' + num(after) + ' XP');
      toast('Həftəlik hədəfə çatdınız!', 'ok', { sub: num(after) + ' / ' + num(v.goal) + ' XP — Tenso fəxr edir.', icon: 'trophy' });
    } else if (newDay && s.cur > 1 && opts.quiet !== true) {
      dock('streak', s.cur + ' günlük seriya!', 2200);
    }
    var res = { added: n, total: v.total, today: v.days[today], week: after, goal: v.goal, streak: s.cur, newDay: newDay, reachedGoal: reached };
    try { if (App.emit) App.emit('tenso:xp', res); } catch (e) { /* ignore */ }
    return res;
  }
  function setGoal(n) {
    n = Math.round(Number(n) || 0); if (n < 10 || n > 5000) return false;
    var v = xpData(); v.goal = n; sset('tenso:xp', v);
    try { if (App.emit) App.emit('tenso:xp', { goal: n }); } catch (e) { /* ignore */ }
    return true;
  }

  /* «Dostla yarış» — share a challenge (no server league yet). */
  function challengeText() {
    var w = weekly(), s = streak();
    var url = '';
    try { url = W.location.origin + W.location.pathname + '#g-dictation'; } catch (e) { url = ''; }
    var t = 'Tenso ilə ingilis qrammatikası: bu həftə ' + num(w.xp) + ' XP topladım' + (s.current > 1 ? ', ' + s.current + ' günlük seriyam var' : '') + '. Bu həftə məni keçə bilərsən? 💪';
    return { text: t, url: url };
  }
  function challenge() {
    var c = challengeText(), full = c.text + (c.url ? '\n' + c.url : '');
    function copySheet() {
      var ta = h('textarea', { class: 'textarea', rows: 4, readonly: true, value: full, 'aria-label': 'Çağırış mətni' });
      App.sheet({
        title: 'Dostla yarış', cls: 'tx-share',
        body: h('div', { class: 'stack' }, h('p', { class: 'muted', text: 'Mətni kopyalayıb dostunuza göndərin. Hər kəs öz həftəlik XP-sini yazsın — bazar günü kim öndədir?' }), ta),
        actions: [{ label: 'Kopyala', kind: 'primary', icon: 'copy', onClick: function () { try { ta.select(); D.execCommand('copy'); toast('Kopyalandı', 'ok'); } catch (e) { /* ignore */ } } }]
      });
    }
    try {
      if (W.navigator.share) {
        return W.navigator.share({ title: 'Tenso çağırışı', text: c.text, url: c.url || undefined }).then(function () { return true; }, function (e) { if (!e || e.name !== 'AbortError') copySheet(); return false; });
      }
    } catch (e) { /* fall through */ }
    try {
      if (W.navigator.clipboard && W.navigator.clipboard.writeText) {
        return W.navigator.clipboard.writeText(full).then(function () { toast('Çağırış kopyalandı', 'ok', { sub: 'Dostunuza göndərin — bu həftə kim çox XP toplayacaq?' }); return true; }, function () { copySheet(); return false; });
      }
    } catch (e) { /* fall through */ }
    copySheet();
    return Promise.resolve(false);
  }

  function goalSheet() {
    var cur = xpData().goal, pick = cur;
    var opts = [50, 100, 150, 250, 400];
    var inp = h('input', { class: 'input', type: 'number', min: 10, max: 5000, step: 10, value: String(cur), inputmode: 'numeric', 'aria-label': 'Həftəlik XP hədəfi' });
    var chips = h('div', { class: 'tx-goal-opts' });
    function paint() { Array.prototype.forEach.call(chips.children, function (c) { c.setAttribute('aria-pressed', String(Number(c.dataset.v) === pick)); }); }
    opts.forEach(function (o) {
      chips.appendChild(h('button', { class: 'chip', type: 'button', 'data-v': o, 'aria-pressed': String(o === pick), onclick: function () { pick = o; inp.value = String(o); paint(); } }, o + ' XP'));
    });
    inp.addEventListener('input', function () { pick = Math.round(Number(inp.value) || 0); paint(); });
    App.sheet({
      title: 'Həftəlik hədəf',
      body: h('div', { class: 'stack' },
        h('p', { class: 'muted', text: 'Hər yoxlama, düzəliş, diktant və məşq XP gətirir. Gündə 20–30 XP — həftədə təxminən 150.' }),
        chips,
        h('div', { class: 'field' }, h('label', { text: 'Öz hədəfiniz' }), inp, h('span', { class: 'hint', text: '10 – 5000 XP arası' }))),
      actions: [
        { label: 'Ləğv et', kind: 'ghost' },
        { label: 'Yadda saxla', kind: 'primary', onClick: function () { if (!setGoal(pick)) { inp.setAttribute('aria-invalid', 'true'); toast('10 ilə 5000 arasında rəqəm yazın', 'warn'); return false; } toast('Hədəf: həftədə ' + pick + ' XP', 'ok'); } }
      ]
    });
  }

  /* Compact «Bu həftə» card — any screen may host it; re-renders on XP changes while attached. */
  function renderStreakCard(el, opts) {
    if (!el) return null;
    css(); opts = opts || {};
    var off = null;
    function paint() {
      if (!el.isConnected && off) { off(); off = null; return; }
      var w = weekly(), s = streak();
      el.textContent = '';
      var bar = h('i', { style: { width: '0%' } });
      var card = h('section', { class: 'card tx-sc' + (opts.compact ? ' compact' : ''), 'aria-label': 'Bu həftə' },
        h('div', { class: 'tx-sc-top' },
          h('span', { class: 'tx-flame' + (s.current ? '' : ' off'), 'aria-hidden': 'true' }, ie('flame')),
          h('div', { class: 'tx-sc-t' },
            h('span', { class: 'eyebrow', text: 'Bu həftə' }),
            h('b', { text: s.current ? s.current + ' günlük seriya' : 'Seriyaya başlayın' }),
            h('small', { text: s.activeToday ? 'Bu gün artıq məşq etdiniz — əla!' : s.atRisk ? 'Seriyanı qorumaq üçün bu gün azı 1 XP qazanın.' : 'Bu gün bir yoxlama və ya diktant edin.' })),
          h('button', { class: 'icon-btn ghost sm', type: 'button', 'aria-label': 'Həftəlik hədəfi dəyiş', onclick: goalSheet }, ie('target'))),
        h('div', { class: 'stack-sm' },
          h('div', { class: 'tx-sc-xp' }, h('span', null, h('b', { text: num(w.xp) }), ' / ' + num(w.goal) + ' XP'), h('span', { text: w.left ? w.left + ' XP qaldı' : 'Hədəf tamam!' })),
          h('div', { class: 'progress' + (w.left ? '' : ' green'), role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': w.pct, 'aria-label': 'Həftəlik hədəf' }, bar)),
        h('div', { class: 'tx-week', 'aria-label': 'Həftənin günləri' }, w.days.map(function (d) {
          return h('div', { class: 'tx-day' + (d.xp ? ' done' : '') + (d.today ? ' today' : '') + (d.future ? ' future' : ''), title: d.date + ': ' + d.xp + ' XP' },
            h('i', { text: d.xp ? String(d.xp) : '·' }), h('span', { text: d.label }));
        })),
        h('div', { class: 'tx-row' },
          h('button', { class: 'btn btn-sm btn-secondary', type: 'button', onclick: function () { challenge(); } }, ie('users'), 'Dostla yarış'),
          h('span', { class: 'tx-sp' }),
          h('span', { class: 'tx-count', text: 'Cəmi ' + num(w.total) + ' XP · rekord ' + s.best + ' gün' })));
      el.appendChild(card);
      requestAnimationFrame(function () { bar.style.width = w.pct + '%'; });
    }
    paint();
    try { if (App.on) off = App.on('tenso:xp', function () { if (el.isConnected) paint(); else if (off) { off(); off = null; } }); } catch (e) { /* ignore */ }
    return { refresh: paint, destroy: function () { if (off) off(); off = null; } };
  }

  /* ------------------------------------------------------------------
     4. OFFLINE KNOWLEDGE — generic examples + mini exercises by topic
     ------------------------------------------------------------------ */
  var TOPICS = [
    { id: 'article', re: /\b(article|artikl|the|a\/an|an?\b|definite|indefinite)\b/i,
      ex: [{ en: 'I bought a book. The book is about Baku.', az: 'Bir kitab aldım. Həmin kitab Bakı haqqındadır — ikinci dəfə the.' }, { en: 'She is an engineer.', az: 'Peşədən əvvəl a/an lazımdır.' }],
      quiz: [{ q: 'I saw ___ elephant at the zoo.', a: ['an'], options: ['a', 'an', 'the'] }, { q: '___ sun rises in the east.', a: ['The'], options: ['A', 'The', '—'] }, { q: 'My father is ___ doctor.', a: ['a'], options: ['a', 'the', '—'] }] },
    { id: 'perfect', re: /present perfect|since|for\b|already|yet|have \w+ed|perfect/i,
      ex: [{ en: 'I have lived here since 2019.', az: 'Keçmişdə başlayıb indi də davam edir.' }, { en: 'She has already finished her work.', az: 'Nəticə indi vacibdir.' }],
      quiz: [{ q: 'I ___ (know) him for ten years.', a: ['have known', "'ve known"] }, { q: 'She ___ (live) here since 2020.', a: ['has lived', 'has been living'] }, { q: '___ you ever ___ (be) to Paris?', a: ['have, been', 'have been'] }] },
    { id: 'past', re: /past simple|past tense|keçmiş|yesterday|ago|-ed\b|went|irregular/i,
      ex: [{ en: 'We visited Gəncə last summer.', az: 'Bitmiş keçmiş vaxt — Past Simple.' }, { en: 'He went home two hours ago.', az: 'go → went (qeyri-müntəzəm fel).' }],
      quiz: [{ q: 'Yesterday I ___ (go) to the market.', a: ['went'] }, { q: 'She ___ (not / call) me last night.', a: ["didn't call", 'did not call'] }, { q: '___ you ___ (see) the match?', a: ['did, see', 'did see'] }] },
    { id: 'agree', re: /agreement|3rd person|third person|subject.verb|-s\b|does|doesn|uzlaşma|şəxs/i,
      ex: [{ en: 'She works in a bank.', az: 'he/she/it ilə felə -s artırılır.' }, { en: 'My friends live in Sumqayıt.', az: 'Cəm mübtəda — fel -s almır.' }],
      quiz: [{ q: 'He ___ (play) tennis every Sunday.', a: ['plays'] }, { q: 'My parents ___ (work) in Baku.', a: ['work'] }, { q: 'She ___ (not / like) fish.', a: ["doesn't like", 'does not like'] }] },
    { id: 'prep', re: /preposition|ön söz|\b(in|on|at|to|for|of)\b/i,
      ex: [{ en: 'The meeting is on Monday at 10 am.', az: 'Günlər — on, saat — at.' }, { en: 'I live in Baku.', az: 'Şəhər, ölkə — in.' }],
      quiz: [{ q: 'I was born ___ 1998.', a: ['in'], options: ['in', 'on', 'at'] }, { q: 'See you ___ Friday!', a: ['on'], options: ['in', 'on', 'at'] }, { q: 'The class starts ___ 9 o\'clock.', a: ['at'], options: ['in', 'on', 'at'] }] },
    { id: 'plural', re: /plural|cəm|countable|uncountable|much|many|informat/i,
      ex: [{ en: 'I need some information.', az: 'information sayılmayan isimdir — -s almır.' }, { en: 'There are three children in the room.', az: 'child → children (qeyri-müntəzəm cəm).' }],
      quiz: [{ q: 'How ___ money do you have?', a: ['much'], options: ['much', 'many'] }, { q: 'I have two ___ (child).', a: ['children'] }, { q: 'She gave me some good ___ (advice).', a: ['advice'] }] },
    { id: 'order', re: /word order|söz sırası|question|sual|inversion/i,
      ex: [{ en: 'I often drink tea in the evening.', az: 'Mübtəda + tezlik zərfi + fel + tamamlıq + vaxt.' }, { en: 'Where do you live?', az: 'Sualda köməkçi fel mübtədadan əvvəl gəlir.' }],
      quiz: [{ q: 'Order: (always / she / late / is)', a: ['she is always late', 'she is always late.'] }, { q: 'Where ___ you work?', a: ['do'], options: ['do', 'are', 'does'] }, { q: 'Can you tell me where the station ___?', a: ['is'], options: ['is', 'does', 'are'] }] }
  ];
  var DEF_TOPIC = { id: 'gen',
    ex: [{ en: 'I have been studying English for two years.', az: 'Müddət + davam: have been + -ing.' }, { en: 'If I had more time, I would read more.', az: '2-ci tip şərt: if + Past Simple, would + fel.' }],
    quiz: [{ q: 'She ___ (be) a teacher.', a: ['is'] }, { q: 'They ___ (not / come) yesterday.', a: ["didn't come", 'did not come'] }, { q: 'I am interested ___ music.', a: ['in'], options: ['in', 'on', 'at'] }] };
  function topicFor(issue) {
    var hay = [issue.rule, issue.ruleTitle, issue.why, issue.wrong, issue.fix].join(' ');
    for (var i = 0; i < TOPICS.length; i++) if (TOPICS[i].re.test(hay)) return TOPICS[i];
    return DEF_TOPIC;
  }

  /* ------------------------------------------------------------------
     5. «TENSODAN SORUŞ» — chat sheet about one issue
     ------------------------------------------------------------------ */
  var MAX_TURNS = 6;
  var QUICK = [
    { id: 'example', label: 'Başqa nümunə', ask: 'Başqa nümunə göstər.' },
    { id: 'simple', label: 'Sadə izah et', ask: 'Bunu daha sadə izah et.' },
    { id: 'drill', label: 'Məşq ver', ask: 'Mənə bu qayda üzrə məşq ver.' }
  ];
  function normIssue(o) {
    o = o || {};
    return {
      sentence: trim(o.sentence || o.text || o.context), wrong: trim(o.wrong || o.bad || o.from), fix: trim(o.fix || o.good || o.to || o.suggestion),
      rule: trim(o.rule || o.ruleId), ruleTitle: trim(o.ruleTitle || o.title), why: trim(o.why || o.explanation || o.note), lang: o.lang || 'en'
    };
  }
  function normAnswer(v) {
    v = parsed(v) || {};
    var ex = arr(v.examples).map(function (e) {
      if (typeof e === 'string') return { en: e, az: '' };
      return { en: trim(e.en || e.sentence || e.text), az: trim(e.az || e.note || e.why || e.translation) };
    }).filter(function (e) { return e.en; }).slice(0, 3);
    var qz = arr(v.exercise || v.exercises).map(function (x) {
      if (!x || typeof x !== 'object') return null;
      var a = x.a != null ? x.a : (x.answer != null ? x.answer : x.answers);
      a = (Array.isArray(a) ? a : [a]).map(trim).filter(Boolean);
      var o = arr(x.options).map(trim).filter(Boolean);
      var qq = trim(x.q || x.question || x.prompt);
      if (!qq || !a.length) return null;
      return { q: qq, a: a, options: o.length >= 2 ? o.slice(0, 4) : null, hint: trim(x.hint || x.why) };
    }).filter(Boolean).slice(0, 3);
    return { answer: trim(v.answer || v.text || v.explanation), examples: ex, exercise: qz };
  }
  function askPrompt(issue, history, mode, question) {
    var hist = history.slice(-6).map(function (m) { return (m.role === 'user' ? 'Student: ' : 'Tenso: ') + short(m.text, 280); }).join('\n');
    var task = {
      ask: 'Answer the student\'s question.',
      example: 'Give 2 NEW, different example sentences for the same rule (not repeated from the chat), each with a one-line Azerbaijani note. Keep "answer" to one short sentence.',
      simple: 'Re-explain the rule much more simply, as to a 12-year-old, in 2–3 short sentences, using the student\'s own sentence. 1 example.',
      drill: 'Create exactly 3 short practice items on this rule (fill-in-the-blank with ___ or multiple choice with 2–3 options). Put them in "exercise". Keep "answer" to one short encouraging sentence.'
    }[mode] || 'Answer the student\'s question.';
    return [
      'You are Tenso, a friendly English grammar tutor for Azerbaijani speakers inside the Nuanza app.',
      'The student wrote this English sentence:', q(issue.sentence || issue.wrong),
      'Tenso flagged: ' + q(issue.wrong) + ' → should be ' + q(issue.fix) + (issue.ruleTitle || issue.rule ? ' (rule: ' + (issue.ruleTitle || issue.rule) + ')' : '') + '.',
      issue.why ? 'Stored explanation: ' + q(issue.why) : '',
      hist ? 'Conversation so far:\n' + hist : '',
      'Student now asks: ' + q(question),
      'TASK: ' + task,
      'Explain in simple Azerbaijani, refer to the student\'s own sentence, keep the answer under 90 words. English examples stay in English. ' + ORTHO(),
      'Never invent a different correction than the one above unless it is clearly wrong; if so, say so politely.',
      'Return ONLY strict JSON: {"answer": "Azerbaijani text", "examples": [{"en": "English sentence", "az": "short Azerbaijani note"}], "exercise": [{"q": "sentence with ___", "options": ["opt1","opt2"] or [], "a": ["accepted answer"], "hint": "short Azerbaijani hint"}]}',
      '"examples" has 1–2 items (0 for drill), "exercise" is [] unless the task asks for practice.'
    ].filter(Boolean).join('\n');
  }
  function offlineAnswer(issue, mode, round) {
    var tp = topicFor(issue), ex = tp.ex.slice();
    if (round % 2 === 0) ex = ex.reverse();
    if (mode === 'drill') return { answer: 'Bu qayda üzrə 3 kiçik məşq — yazın və yoxlayın.', examples: [], exercise: tp.quiz, offline: true };
    var parts = [];
    if (mode === 'simple') parts.push('Qısaca: «' + (issue.wrong || '…') + '» əvəzinə «' + (issue.fix || '…') + '» yazılır.');
    else if (issue.fix) parts.push('Burada «' + issue.fix + '» lazımdır' + (issue.wrong ? ', «' + issue.wrong + '» yox.' : '.'));
    if (issue.why) parts.push(issue.why);
    if (issue.ruleTitle || issue.rule) parts.push('Qayda: ' + (issue.ruleTitle || issue.rule) + '.');
    if (mode === 'example') parts = ['Bu qayda üçün daha iki nümunə:'];
    return { answer: parts.join(' ') || 'Bu səhvin izahı burada saxlanmayıb.', examples: ex.slice(0, 2), exercise: [], offline: true };
  }

  function checkAns(given, accepted) {
    function n(s) { return lowerEn(s).replace(/[’‘`]/g, "'").replace(/[.,!?;:"]/g, '').replace(/\s*,\s*/g, ' ').replace(/\s+/g, ' ').trim(); }
    var g = n(given); if (!g) return null;
    for (var i = 0; i < accepted.length; i++) if (n(accepted[i]) === g) return true;
    return false;
  }
  function quizEl(items, onRight) {
    var box = h('div', { class: 'tx-quiz' });
    items.forEach(function (it, i) {
      var res = h('div', { class: 'res', 'aria-live': 'polite' });
      var row = h('div', { class: 'tx-qi' }, h('div', { class: 'q', text: (i + 1) + '. ' + it.q }));
      var done = false;
      function mark(ok, given, btn) {
        if (done && ok) return;
        row.classList.toggle('ok', ok); row.classList.toggle('bad', !ok);
        res.textContent = ok ? 'Düzdür! +2 XP' : 'Hələ yox' + (it.hint ? ' — ' + it.hint : '') + '. Düzgün cavab: ' + it.a[0];
        if (ok) { done = true; if (onRight) onRight(btn || row); }
      }
      if (it.options) {
        var chips = h('div', { class: 'chips' });
        it.options.forEach(function (o) {
          var b = h('button', { class: 'chip', type: 'button', text: o });
          b.addEventListener('click', function () {
            if (done) return;
            var ok = checkAns(o, it.a); b.dataset.st = ok ? 'ok' : 'bad'; mark(!!ok, o, b);
          });
          chips.appendChild(b);
        });
        row.appendChild(chips);
      } else {
        var inp = h('input', { class: 'input', type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', 'aria-label': 'Cavab ' + (i + 1), placeholder: 'Cavabınız' });
        var btn = h('button', { class: 'btn btn-sm', type: 'button' }, 'Yoxla');
        function go() { var ok = checkAns(inp.value, it.a); if (ok === null) { inp.focus(); return; } mark(ok, inp.value, btn); if (ok) { inp.readOnly = true; btn.disabled = true; } }
        btn.addEventListener('click', go);
        inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); go(); } });
        row.appendChild(h('div', { class: 'tx-row' }, inp, btn));
      }
      row.appendChild(res);
      box.appendChild(row);
    });
    return box;
  }

  function ask(raw) {
    css();
    var issue = normIssue(raw);
    var history = [], turns = 0, pending = false, tenso = null, round = 0;
    var chat = h('div', { class: 'tx-chat', 'aria-live': 'polite' });
    var art = h('div', { class: 'tx-art', 'aria-hidden': 'true' });
    var sentence = issue.sentence || issue.wrong || '';
    var sentEl = h('div');
    if (issue.wrong && sentence.indexOf(issue.wrong) >= 0) {
      var i0 = sentence.indexOf(issue.wrong);
      sentEl.appendChild(D.createTextNode(sentence.slice(0, i0)));
      sentEl.appendChild(h('span', { class: 'tx-del', text: issue.wrong }));
      sentEl.appendChild(D.createTextNode(sentence.slice(i0 + issue.wrong.length)));
    } else sentEl.textContent = sentence || '—';
    var ctx = h('div', { class: 'tx-ctx' }, art,
      h('div', { class: 'tx-ctx-card' }, h('span', { class: 'lbl', text: 'Sizin cümlə' }), sentEl,
        issue.fix ? h('div', { class: 'fix' }, 'Düzəliş: ', h('span', { class: 'tx-ins', text: issue.fix }), issue.ruleTitle ? ' · ' + issue.ruleTitle : '') : null));
    var quick = h('div', { class: 'tx-quick', role: 'group', 'aria-label': 'Tez suallar' });
    var inp = h('input', { class: 'input', type: 'text', maxlength: 240, autocomplete: 'off', placeholder: 'Sualınızı yazın…', 'aria-label': 'Tensoya sual' });
    var send = h('button', { class: 'btn btn-primary', type: 'submit', 'aria-label': 'Göndər' }, ie('send'));
    var form = h('form', { novalidate: true }, inp, send);
    var left = h('span', { class: 'tx-count' });
    var foot = h('div', { class: 'sheet-f tx-ask-f' }, quick, form, left);

    var sh = App.sheet({
      title: 'Tensodan soruş', cls: 'tx-ask',
      body: h('div', { class: 'stack' }, ctx, chat),
      onClose: function () { try { if (tenso && tenso.destroy) tenso.destroy(); } catch (e) { /* ignore */ } }
    });
    sh.el.appendChild(foot);
    tenso = mountTenso(art, 'wave', 56);

    QUICK.forEach(function (qk) {
      quick.appendChild(h('button', { class: 'chip', type: 'button', onclick: function () { submit(qk.ask, qk.id); } }, qk.label));
    });
    form.addEventListener('submit', function (e) { e.preventDefault(); var t = trim(inp.value); if (t) { inp.value = ''; submit(t, 'ask'); } });

    function scrollEnd() { try { sh.body.scrollTo({ top: sh.body.scrollHeight, behavior: 'smooth' }); } catch (e) { sh.body.scrollTop = sh.body.scrollHeight; } }
    function syncLeft() {
      var n = MAX_TURNS - turns;
      left.textContent = n > 0 ? n + ' sual qaldı' : 'Sual limiti doldu — yeni səhvdə yenidən soruşun.';
      var off = n <= 0 || pending;
      inp.disabled = n <= 0; send.disabled = off;
      Array.prototype.forEach.call(quick.children, function (b) { b.disabled = off; });
    }
    function tensoMsg(ans, err) {
      var m = h('div', { class: 'tx-msg t' });
      if (ans.answer) str(ans.answer).split(/\n{1,}/).forEach(function (p) { if (trim(p)) m.appendChild(h('p', { text: trim(p) })); });
      if (ans.examples && ans.examples.length) {
        m.appendChild(h('ul', { class: 'tx-ex' }, ans.examples.map(function (e) { return h('li', null, h('b', { text: e.en }), e.az ? h('span', { text: e.az }) : null); })));
      }
      if (ans.exercise && ans.exercise.length) {
        m.appendChild(quizEl(ans.exercise, function (el) { addXP(2, 'Tenso məşqi', { el: el }); tset(tenso, 'success', 1600); }));
      }
      if (ans.offline) {
        m.appendChild(h('div', { class: 'tx-off' }, ie('info'), err ? err + ' Saxlanmış izah göstərilir.' : 'Oflayn izah. Canlı cavab üçün internet lazımdır.'));
      }
      return m;
    }
    function submit(question, mode) {
      if (pending || turns >= MAX_TURNS) return;
      turns++; pending = true; round++;
      history.push({ role: 'user', text: question });
      chat.appendChild(h('div', { class: 'tx-msg me', text: question }));
      var typing = h('div', { class: 'tx-msg t', 'aria-label': 'Tenso düşünür' }, h('span', { class: 'tx-dots' }, h('i'), h('i'), h('i')));
      chat.appendChild(typing);
      syncLeft(); scrollEnd();
      tset(tenso, 'think');
      function done(ans, err) {
        pending = false;
        if (typing.parentNode) typing.parentNode.removeChild(typing);
        var said = ans.answer + (ans.examples.length ? ' Nümunə: ' + ans.examples.map(function (e) { return e.en; }).join(' / ') : '');
        history.push({ role: 'tenso', text: said });
        chat.appendChild(tensoMsg(ans, err));
        tset(tenso, err ? 'worried' : ans.exercise.length ? 'point' : 'read', 2400);
        syncLeft(); scrollEnd();
      }
      if (!liveAI()) { setTimeout(function () { done(offlineAnswer(issue, mode, round), online() ? null : 'İnternet yoxdur.'); }, 450); return; }
      W.NuanzaAI.call(askPrompt(issue, history.slice(0, -1), mode, question), { speed: 'fast', timeout: 45000 }).then(function (v) {
        var a = normAnswer(v);
        if (!a.answer && !a.examples.length && !a.exercise.length) throw { code: 'invalid_json' };
        if (mode === 'drill' && !a.exercise.length) a.exercise = topicFor(issue).quiz;
        done(a);
      }).catch(function (e) {
        if (!e || e.code !== 'network') log(e);
        var off = offlineAnswer(issue, mode, round);
        done(off, errText(e));
      });
    }
    syncLeft();
    submit(issue.fix ? 'Niyə burada «' + issue.fix + '» lazımdır?' : 'Bu cümlədə nə səhvdir?', 'ask');
    return sh;
  }

  /* ------------------------------------------------------------------
     6. WORD DIFF (shared by rewrite + dictation)
     ------------------------------------------------------------------ */
  function tokens(s) { return str(s).match(/[A-Za-z0-9À-ÿĀ-ɏ]+(?:['’][A-Za-z]+)*|[^\sA-Za-z0-9À-ÿĀ-ɏ]/g) || []; }
  function wordToks(s) { return str(s).match(/[A-Za-z0-9À-ÿĀ-ɏ]+(?:['’\-][A-Za-z0-9]+)*/g) || []; }
  function nw(w) { return lowerEn(w).replace(/[’‘`]/g, "'"); }
  /* LCS ops over a/b token arrays: {t:'eq'|'del'|'ins', a, b} — del = only in a, ins = only in b */
  function diff(a, b, key) {
    key = key || nw;
    var n = a.length, m = b.length, i, j;
    if (n * m > 250000) return a.map(function (x) { return { t: 'del', a: x }; }).concat(b.map(function (x) { return { t: 'ins', b: x }; }));
    var L = []; for (i = 0; i <= n; i++) { L.push(new Array(m + 1).fill(0)); }
    for (i = n - 1; i >= 0; i--) for (j = m - 1; j >= 0; j--) L[i][j] = key(a[i]) === key(b[j]) ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    var out = []; i = 0; j = 0;
    while (i < n && j < m) {
      if (key(a[i]) === key(b[j])) { out.push({ t: 'eq', a: a[i], b: b[j] }); i++; j++; }
      else if (L[i + 1][j] >= L[i][j + 1]) { out.push({ t: 'del', a: a[i] }); i++; }
      else { out.push({ t: 'ins', b: b[j] }); j++; }
    }
    while (i < n) out.push({ t: 'del', a: a[i++] });
    while (j < m) out.push({ t: 'ins', b: b[j++] });
    return out;
  }

  /* ------------------------------------------------------------------
     7. SCREEN 'g-rewrite' — «Yenidən yaz»
     ------------------------------------------------------------------ */
  var STYLES = [
    { id: 'sade', label: 'Sadə', desc: 'Qısa cümlələr, gündəlik sözlər — B1 səviyyəsində aydın.', p: 'Plain, simple English at B1 level: short sentences, common words, active voice, no idioms.' },
    { id: 'resmi', label: 'Rəsmi', desc: 'İşgüzar məktub və e-poçt üçün nəzakətli, dəqiq dil.', p: 'Formal, polite business English suitable for professional emails and letters; no contractions or slang.' },
    { id: 'ielts', label: 'Akademik (IELTS)', desc: 'IELTS Writing 7+: bağlayıcılar, dəqiq lüğət, ixtisarsız.', p: 'Academic English for IELTS Writing Task 2 (band 7+): precise vocabulary, cohesive devices, hedging where appropriate, varied complex sentences, no contractions, no clichés.' },
    { id: 'semimi', label: 'Səmimi', desc: 'Dosta yazılan kimi isti və təbii, amma qrammatik düzgün.', p: 'Warm, friendly informal English as written to a friend; contractions are fine; still grammatically correct.' }
  ];
  var RW_SAMPLE = 'I want to say that the internet is very good for students because they can find many informations. But also it have some bad sides, for example students copy everything and dont think.';
  var RW_MAX = 1500;

  function rwPrompt(text, st) {
    return [
      'You are Tenso, an English writing coach for Azerbaijani learners.',
      'Rewrite the student\'s English text in this target style: ' + st.p,
      'Fix every grammar, spelling and punctuation mistake. Keep the meaning, keep roughly the same length, do not add new ideas.',
      'Text:', q(text),
      'Then list the most useful changes (max 8). For each: "from" = exact original words, "to" = the new words, "why" = one short simple Azerbaijani sentence explaining the reason (grammar fix or style choice). Example: {"from":"I want to say","to":"I would like to point out","why":"Rəsmi üslubda would like daha nəzakətlidir."}',
      'Also give "tip": one short Azerbaijani sentence with the main lesson. ' + ORTHO(),
      'Return ONLY strict JSON: {"rewritten": "...", "changes": [{"from": "...", "to": "...", "why": "..."}], "tip": "..."}'
    ].join('\n');
  }
  function normRw(v) {
    v = parsed(v) || {};
    return {
      text: str(v.rewritten || v.text || v.result).trim(),
      changes: arr(v.changes).map(function (c) { return { from: trim(c.from || c.original), to: trim(c.to || c.new || c.rewrite), why: trim(c.why || c.note || c.reason) }; }).filter(function (c) { return c.to || c.from; }).slice(0, 8),
      tip: trim(v.tip || v.summary)
    };
  }
  /* rewritten text with inserted/changed words highlighted; deletions inline when showDel */
  function diffView(orig, next, showDel) {
    var ops = diff(tokens(orig), tokens(next)), segs = [];
    ops.forEach(function (op) {
      if (op.t === 'del' && !showDel) return;
      var t = op.t === 'del' ? op.a : op.b, last = segs[segs.length - 1];
      if (last && last.t === op.t) last.toks.push(t); else segs.push({ t: op.t, toks: [t] });
    });
    var box = h('div', { class: 'tx-rw-out' }), prev = null;
    function glue(tok) { return prev === null || /^[.,;:!?)\]}”’»%]$/.test(tok) || /^[(\[{“‘«]$/.test(prev) || /^['’]/.test(tok) ? '' : ' '; }
    segs.forEach(function (sg) {
      var lead = glue(sg.toks[0]), inner = '';
      sg.toks.forEach(function (tok, i) { if (i) { var g = glue(tok); inner += g; } inner += tok; prev = tok; });
      if (lead) box.appendChild(D.createTextNode(lead));
      if (sg.t === 'eq') box.appendChild(D.createTextNode(inner));
      else box.appendChild(h(sg.t === 'ins' ? 'mark' : 'del', { class: sg.t === 'ins' ? 'tx-ins' : 'tx-del', text: inner }));
    });
    return box;
  }

  var RW = { minis: [] };
  function rwCleanup() { RW.minis.forEach(function (m) { try { if (m && m.destroy) m.destroy(); } catch (e) { /* ignore */ } }); RW.minis = []; }

  function renderRewrite(el) {
    css(); rwCleanup();
    var style = sget('tenso:rw-style', 'resmi');
    if (!STYLES.some(function (s) { return s.id === style; })) style = 'resmi';
    var last = null;
    var art = h('div', { class: 'tx-art', 'aria-hidden': 'true' });
    var ta = h('textarea', { class: 'textarea', rows: 6, maxlength: RW_MAX, spellcheck: 'false', placeholder: 'İngiliscə mətni bura yapışdırın…', 'aria-label': 'İngiliscə mətn', value: sget('tenso:rw-draft', '') });
    var count = h('span', { class: 'tx-count' });
    var seg = h('div', { class: 'seg wrap', role: 'group', 'aria-label': 'Üslub' });
    var desc = h('p', { class: 'tx-note' });
    var goBtn = h('button', { class: 'btn btn-primary', type: 'button' }, ie('wand'), 'Yenidən yaz');
    var out = h('div', { class: 'stack', 'aria-live': 'polite' });

    function syncCount() { count.textContent = num(ta.value.length) + ' / ' + num(RW_MAX); try { sset('tenso:rw-draft', ta.value.slice(0, RW_MAX)); } catch (e) { /* ignore */ } }
    function paintSeg() {
      Array.prototype.forEach.call(seg.children, function (b) { b.setAttribute('aria-pressed', String(b.dataset.id === style)); });
      desc.textContent = STYLES.filter(function (s) { return s.id === style; })[0].desc;
    }
    STYLES.forEach(function (s) {
      seg.appendChild(h('button', { type: 'button', 'data-id': s.id, onclick: function () { style = s.id; sset('tenso:rw-style', style); paintSeg(); } }, s.label));
    });
    ta.addEventListener('input', syncCount);
    ta.addEventListener('keydown', function (e) { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); run(); } });
    goBtn.addEventListener('click', run);

    function offlineView(msg) {
      out.textContent = '';
      out.appendChild(h('div', { class: 'callout red' }, ie('alert'), h('div', null,
        h('b', { text: 'Yenidən yazmaq üçün canlı bağlantı lazımdır.' }), h('br'),
        h('span', { text: msg || 'İnternetə qoşulun və yenidən cəhd edin. Diktant və yoxlama oflayn da işləyir.' }),
        h('div', { class: 'tx-row', style: 'margin-top:10px' },
          h('button', { class: 'btn btn-sm', type: 'button', onclick: run }, ie('refresh'), 'Yenidən cəhd et'),
          App.go ? h('button', { class: 'btn btn-sm btn-ghost', type: 'button', onclick: function () { App.go('g-dictation'); } }, 'Diktanta keç') : null))));
    }
    function showResult(orig, r, st) {
      out.textContent = '';
      var showDel = false;
      var view = h('div');
      function paintView() { view.textContent = ''; view.appendChild(diffView(orig, r.text, showDel)); }
      paintView();
      var delBtn = h('button', { class: 'chip', type: 'button', 'aria-pressed': 'false' }, 'Silinənləri göstər');
      delBtn.addEventListener('click', function () { showDel = !showDel; delBtn.setAttribute('aria-pressed', String(showDel)); paintView(); });
      var copyBtn = h('button', { class: 'btn btn-sm', type: 'button' }, ie('copy'), 'Kopyala');
      copyBtn.addEventListener('click', function () {
        var done = function () { toast('Kopyalandı', 'ok'); };
        try { W.navigator.clipboard.writeText(r.text).then(done, function () { toast('Kopyalanmadı', 'warn'); }); } catch (e) { toast('Kopyalanmadı', 'warn'); }
      });
      var card = h('section', { class: 'card' },
        h('div', { class: 'card-h' }, h('div', null, h('span', { class: 'eyebrow', text: st.label + ' üslub' }), h('h2', { text: 'Yeni mətn' })),
          h('div', { class: 'actions' }, copyBtn)),
        view,
        h('div', { class: 'tx-row', style: 'margin-top:12px' }, delBtn,
          h('span', { class: 'tx-legend' }, h('span', null, h('i', { style: 'background:var(--ok-t);box-shadow:inset 0 -2px 0 var(--ok)' }), 'dəyişən / yeni'))));
      out.appendChild(card);
      if (r.changes.length || r.tip) {
        out.appendChild(h('section', { class: 'card' },
          h('div', { class: 'card-h' }, h('div', null, h('span', { class: 'eyebrow', text: 'Niyə belə?' }), h('h2', { text: 'Dəyişikliklər' }))),
          r.changes.length ? h('ul', { class: 'tx-chg' }, r.changes.map(function (c, i) {
            return h('li', { style: { animationDelay: (i * 40) + 'ms' } },
              h('div', { class: 'pair' }, c.from ? h('span', { class: 'tx-del', text: c.from }) : null, c.from ? ie('arrow') : null, h('span', { class: 'tx-ins', text: c.to || '—' })),
              c.why ? h('div', { class: 'why', text: c.why }) : null);
          })) : null,
          r.tip ? h('div', { class: 'callout fir', style: 'margin-top:12px' }, ie('bulb'), h('div', { text: r.tip })) : null));
      }
      out.appendChild(h('div', { class: 'tx-row' }, h('span', { class: 'tx-note', text: 'Başqa üslubda:' }),
        STYLES.filter(function (s) { return s.id !== st.id; }).map(function (s) {
          return h('button', { class: 'chip', type: 'button', onclick: function () { style = s.id; sset('tenso:rw-style', style); paintSeg(); run(); } }, s.label);
        })));
    }
    function run() {
      var text = trim(ta.value);
      if (text.length < 8) { ta.setAttribute('aria-invalid', 'true'); toast('Ən azı bir cümlə yazın', 'warn'); ta.focus(); return; }
      ta.removeAttribute('aria-invalid');
      var st = STYLES.filter(function (s) { return s.id === style; })[0];
      if (!liveAI()) { offlineView(online() ? null : 'İnternet bağlantısı yoxdur.'); tset(RW.t, 'sad', 2000); return; }
      busy(goBtn, true); tset(RW.t, 'think');
      out.textContent = '';
      out.appendChild(h('section', { class: 'card' }, h('div', { class: 'sk-stack' }, h('div', { class: 'skeleton', style: 'height:14px;width:92%' }), h('div', { class: 'skeleton', style: 'height:14px;width:78%' }), h('div', { class: 'skeleton', style: 'height:14px;width:85%' }))));
      var orig = text;
      W.NuanzaAI.call(rwPrompt(orig, st), { speed: 'normal', timeout: 60000 }).then(function (v) {
        var r = normRw(v);
        if (!r.text) throw { code: 'invalid_json' };
        if (!el.isConnected) return;
        last = r;
        showResult(orig, r, st);
        tset(RW.t, 'success', 2000);
        addXP(5, 'Yenidən yazma: ' + st.label, { el: goBtn });
      }).catch(function (e) {
        log(e);
        if (!el.isConnected) return;
        if (e && e.code === 'network') offlineView('İnternet bağlantısını yoxlayın.');
        else { out.textContent = ''; out.appendChild(h('div', { class: 'callout red' }, ie('alert'), h('div', { text: errText(e) }))); }
        tset(RW.t, 'worried', 2000);
      }).then(function () { busy(goBtn, false); });
    }

    el.appendChild(h('div', { class: 'page tx-page tx-rw' },
      h('div', { class: 'page-h' }, h('div', { class: 'tx-hero' }, art, h('div', null,
        h('span', { class: 'eyebrow', text: 'Tenso · Yazı' }),
        h('h1', { html: 'Yenidən <em>yaz</em>' }),
        h('p', { text: 'Mətni yapışdırın, üslubu seçin — Tenso onu yenidən yazacaq və hər dəyişikliyi Azərbaycan dilində izah edəcək.' })))),
      h('section', { class: 'card stack' },
        h('div', { class: 'field' }, h('div', { class: 'label' }, h('span', { text: 'İngiliscə mətn' }), count), ta),
        h('div', { class: 'field' }, h('span', { class: 'label', text: 'Hədəf üslub' }), seg, desc),
        h('div', { class: 'tx-row' },
          h('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: function () { ta.value = RW_SAMPLE; syncCount(); ta.focus(); } }, 'Nümunə mətn'),
          h('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: function () { ta.value = ''; syncCount(); out.textContent = ''; ta.focus(); } }, 'Təmizlə'),
          h('span', { class: 'tx-sp' }), goBtn),
        liveAI() ? null : h('div', { class: 'callout' }, ie('info'), h('div', { text: 'Bu funksiya canlı süni intellektlə işləyir — internet olmadan nəticə göstərilməyəcək.' }))),
      out));
    RW.t = mountTenso(art, 'wave', 64); if (RW.t) RW.minis.push(RW.t);
    syncCount(); paintSeg();
  }

  /* ------------------------------------------------------------------
     8. SCREEN 'g-dictation' — «Diktant»
     ------------------------------------------------------------------ */
  var LEVELS = ['A2', 'B1', 'B2', 'C1'];
  var BUILTIN = [
    { l: 'A2', en: "She doesn't like coffee in the morning.", az: 'O, səhərlər qəhvəni sevmir.', note: "Present Simple inkarı: doesn't + felin əsas forması (likes yox, like)." },
    { l: 'A2', en: 'We went to the cinema last night.', az: 'Dünən axşam kinoya getdik.', note: 'go → went: qeyri-müntəzəm fellərin keçmiş forması əzbərlənir.' },
    { l: 'A2', en: 'There are two apples on the table.', az: 'Masanın üstündə iki alma var.', note: 'Cəm isimlə There are, tək isimlə There is.' },
    { l: 'A2', en: 'My brother is taller than me.', az: 'Qardaşım məndən hündürdür.', note: 'Qısa sifətlərdə müqayisə: -er + than.' },
    { l: 'A2', en: 'I am going to visit my grandmother tomorrow.', az: 'Sabah nənəmə baş çəkəcəyəm.', note: 'be going to + fel — əvvəlcədən qurulmuş plan.' },
    { l: 'A2', en: 'Did you finish your homework?', az: 'Ev tapşırığını bitirdin?', note: 'Did ilə sualda fel əsas formada qalır (finished yox, finish).' },
    { l: 'A2', en: 'He can speak three languages.', az: 'O, üç dildə danışa bilir.', note: 'can-dan sonra fel to-suz gəlir.' },
    { l: 'A2', en: 'They were watching TV when I called.', az: 'Mən zəng edəndə onlar televizora baxırdılar.', note: 'Past Continuous (davam edən) + Past Simple (araya girən hərəkət).' },
    { l: 'B1', en: 'I have lived in Baku since 2015.', az: '2015-ci ildən Bakıda yaşayıram.', note: 'Present Perfect + since: keçmişdən indiyə davam edən vəziyyət.' },
    { l: 'B1', en: 'If it rains tomorrow, we will stay at home.', az: 'Sabah yağış yağsa, evdə qalacağıq.', note: '1-ci tip şərt: if + Present Simple, will + fel.' },
    { l: 'B1', en: 'The letter was written by my teacher.', az: 'Məktub müəllimim tərəfindən yazılıb.', note: 'Passiv: was/were + III forma (written).' },
    { l: 'B1', en: 'She asked me where I lived.', az: 'O, məndən harada yaşadığımı soruşdu.', note: 'Dolayı sualda söz sırası təsdiq cümləsi kimidir: where I lived.' },
    { l: 'B1', en: 'I used to play football every weekend.', az: 'Əvvəllər hər həftəsonu futbol oynayırdım.', note: 'used to + fel — keçmişdəki vərdiş.' },
    { l: 'B1', en: 'This is the book that I told you about.', az: 'Bu, sənə danışdığım kitabdır.', note: 'Nisbi cümlə: that ilə, ön söz (about) sonda qalır.' },
    { l: 'B1', en: 'You should see a doctor about that cough.', az: 'O öskürəyə görə həkimə getməlisən.', note: 'should + fel — məsləhət.' },
    { l: 'B1', en: 'I have never been to London.', az: 'Heç vaxt Londonda olmamışam.', note: 'have been to — təcrübə; never felin önündə.' },
    { l: 'B2', en: 'By the time we arrived, the film had already started.', az: 'Biz çatanda film artıq başlamışdı.', note: 'Past Perfect: keçmişdəki başqa hərəkətdən əvvəl bitən hərəkət.' },
    { l: 'B2', en: 'If I had known, I would have helped you.', az: 'Bilsəydim, sənə kömək edərdim.', note: '3-cü tip şərt: if + had + III forma, would have + III forma.' },
    { l: 'B2', en: 'He denied taking the money from the drawer.', az: 'O, pulu çekmecədən götürdüyünü inkar etdi.', note: 'deny + -ing (to take yox).' },
    { l: 'B2', en: "I'm not used to getting up so early.", az: 'Bu qədər tez durmağa öyrəşməmişəm.', note: 'be used to + -ing — öyrəşmək (used to + fel ilə qarışdırmayın).' },
    { l: 'B2', en: 'The report needs to be finished by Friday.', az: 'Hesabat cüməyə qədər bitirilməlidir.', note: 'Passiv məsdər: to be + III forma; by Friday — «cüməyədək».' },
    { l: 'B2', en: 'Not only did she pass, but she also got the highest score.', az: 'O, təkcə keçmədi, həm də ən yüksək balı aldı.', note: 'Not only ilə başlayanda inversiya: did she pass.' },
    { l: 'B2', en: 'I wish I had more free time.', az: 'Kaş daha çox boş vaxtım olaydı.', note: 'wish + Past Simple — indiki arzu.' },
    { l: 'C1', en: 'Had I known about the risks, I would never have agreed.', az: 'Risklərdən xəbərim olsaydı, heç vaxt razılaşmazdım.', note: 'Şərtdə inversiya: If I had known → Had I known.' },
    { l: 'C1', en: 'Hardly had we sat down when the phone rang.', az: 'Təzəcə oturmuşduq ki, telefon zəng çaldı.', note: 'Hardly ... when: inversiya + Past Perfect.' },
    { l: 'C1', en: 'It is essential that every student submit the form on time.', az: 'Hər tələbənin formanı vaxtında təqdim etməsi vacibdir.', note: 'Subjunktiv: essential that + felin əsas forması (submits yox).' },
    { l: 'C1', en: 'The more you practice, the more confident you become.', az: 'Nə qədər çox məşq etsən, bir o qədər özünə inamlı olarsan.', note: 'the more ..., the more ... — paralel müqayisə.' },
    { l: 'C1', en: 'She is said to have been working on the project for years.', az: 'Deyilənə görə, o, illərdir bu layihə üzərində işləyir.', note: 'Passiv xəbər: is said + to have been + -ing.' },
    { l: 'C1', en: 'Were it not for your help, we would have failed.', az: 'Sənin köməyin olmasaydı, uğursuz olardıq.', note: 'Were it not for — «əgər ... olmasaydı» (rəsmi inversiya).' },
    { l: 'C1', en: 'What surprised me most was how calm he remained.', az: 'Məni ən çox təəccübləndirən onun necə sakit qalması idi.', note: 'What ... was — vurğulayıcı (cleft) quruluş.' }
  ];
  function unitPool(level) {
    var G = W.NUANZA_GRAMMAR, out = [];
    if (!G || !Array.isArray(G.units)) return out;
    G.units.forEach(function (u) {
      if (!u || (level && u.level && u.level !== level)) return;
      var rule = arr(u.rules)[0] || u.when || '';
      arr(u.examples).forEach(function (e) {
        var en = trim(e && e.en);
        var wc = wordToks(en).length;
        if (!en || wc < 3 || wc > 18) return;
        out.push({ l: u.level || level, en: en, az: trim(e.az), note: (u.title ? u.title + (u.az ? ' (' + u.az + ')' : '') + ': ' : '') + short(rule, 170), unit: u.id });
      });
    });
    return out;
  }
  function poolFor(level) {
    var p = unitPool(level).concat(BUILTIN.filter(function (s) { return s.l === level; }));
    if (p.length < 6) p = p.concat(BUILTIN.filter(function (s) { return s.l !== level; }));
    var seen = {};
    return shuffle(p.filter(function (s) { var k = nw(s.en); if (seen[k]) return false; seen[k] = 1; return true; }));
  }

  var ARTICLES = { a: 1, an: 1, the: 1 };
  var PREPS = { in: 1, on: 1, at: 1, to: 1, for: 1, of: 1, from: 1, by: 1, with: 1, about: 1, since: 1, into: 1, than: 1 };
  var AUX = { am: 1, is: 1, are: 1, was: 1, were: 1, be: 1, been: 1, being: 1, have: 1, has: 1, had: 1, do: 1, does: 1, did: 1, will: 1, would: 1, can: 1, could: 1, should: 1, must: 1, might: 1, may: 1 };
  function lev(a, b) {
    if (a === b) return 0; if (Math.abs(a.length - b.length) > 3) return 9;
    var p = [], i, j; for (j = 0; j <= b.length; j++) p[j] = j;
    for (i = 1; i <= a.length; i++) { var c = [i]; for (j = 1; j <= b.length; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); p = c; }
    return p[b.length];
  }
  function pointFor(want, got) {
    var w = nw(want), g = got == null ? null : nw(got);
    if (g && /ed$/.test(w) && (w.indexOf(g) === 0 || g + 'd' === w)) return 'Keçmiş zaman sonluğu: «' + want + '» — -ed yazılır, tələffüzdə zəif eşidilir.';
    if (g && (w === g + 's' || w === g + 'es' || g === w + 's')) return '-s sonluğu: «' + want + '» — 3-cü şəxs tək və ya cəm forması.';
    if ((ARTICLES[w] && (!g || ARTICLES[g])) || (g && ARTICLES[g] && !ARTICLES[w] && lev(w, g) > 2)) return 'Artikl: ' + (g ? '«' + got + '» yox, ' : '') + '«' + want + '» — a/an/the hər isimdən əvvəl ayrıca seçilir.';
    if (g && PREPS[w] && PREPS[g]) return 'Ön söz: «' + want + '» («' + got + '» yox) — ön sözləri birləşmə kimi əzbərləyin.';
    if (g && lev(w, g) <= (w.length > 4 ? 2 : 1)) return 'Yazılış: «' + got + '» → «' + want + '».';
    if (PREPS[w] || (g && PREPS[g])) return 'Ön söz: «' + want + '»' + (g ? ' («' + got + '» yox)' : '') + ' — ön sözləri birləşmə kimi əzbərləyin.';
    if (AUX[w] || (g && AUX[g])) return 'Köməkçi fel: «' + want + '» — zamanı və şəxsi bu söz göstərir, buraxılmamalıdır.';
    if (g && /n't$/.test(w) !== /n't$/.test(g)) return 'İnkar: «' + want + '» — ixtisarlı forma (n\'t) diqqətlə eşidilməlidir.';
    if (!g) return 'Buraxılmış söz: «' + want + '».';
    return 'Söz: «' + got + '» yox, «' + want + '».';
  }
  /* compare typed text to the target sentence */
  function grade(target, typed) {
    var a = wordToks(target), b = wordToks(typed), ops = diff(a, b), items = [], pts = [];
    for (var i = 0; i < ops.length; i++) {
      var op = ops[i];
      if (op.t === 'eq') { items.push({ k: 'ok', w: op.a }); continue; }
      /* pair a run of dels with a run of ins → wrong words */
      var dels = [], ins = [];
      while (i < ops.length && ops[i].t !== 'eq') { if (ops[i].t === 'del') dels.push(ops[i].a); else ins.push(ops[i].b); i++; }
      i--;
      var n = Math.max(dels.length, ins.length);
      for (var k = 0; k < n; k++) {
        if (k < dels.length && k < ins.length) { items.push({ k: 'bad', w: dels[k], got: ins[k] }); pts.push(pointFor(dels[k], ins[k])); }
        else if (k < dels.length) { items.push({ k: 'miss', w: dels[k] }); pts.push(pointFor(dels[k], null)); }
        else { items.push({ k: 'extra', got: ins[k] }); pts.push('Artıq söz: «' + ins[k] + '» — cümlədə yoxdur.'); }
      }
    }
    var ok = items.filter(function (x) { return x.k === 'ok'; }).length;
    var score = a.length ? Math.max(0, Math.round((ok - items.filter(function (x) { return x.k === 'extra'; }).length * 0.5) / a.length * 100)) : 0;
    var seen = {};
    pts = pts.filter(function (p) { if (seen[p]) return false; seen[p] = 1; return true; }).slice(0, 5);
    return { items: items, score: Math.min(100, score), points: pts, total: a.length, ok: ok };
  }

  var DS = null; /* dictation state */
  function ttsOK() { return !!(W.speechSynthesis && typeof W.SpeechSynthesisUtterance === 'function'); }
  function enVoices() {
    try { return W.speechSynthesis.getVoices().filter(function (v) { return /^en[-_]/i.test(v.lang || ''); }); } catch (e) { return []; }
  }
  function pickVoice(pref) {
    var vs = enVoices(); if (!vs.length) return null;
    var want = pref === 'uk' ? /en[-_]GB/i : /en[-_]US/i;
    var m = vs.filter(function (v) { return want.test(v.lang); });
    var best = (m.length ? m : vs);
    return best.filter(function (v) { return /natural|google|samantha|daniel|serena|premium|enhanced/i.test(v.name); })[0] || best[0];
  }
  function dictCleanup() {
    if (!DS) return;
    try { if (ttsOK()) W.speechSynthesis.cancel(); } catch (e) { /* ignore */ }
    (DS.timers || []).forEach(clearTimeout);
    try { if (DS.t && DS.t.destroy) DS.t.destroy(); } catch (e) { /* ignore */ }
    try { if (ttsOK() && DS.onVoices) W.speechSynthesis.removeEventListener('voiceschanged', DS.onVoices); } catch (e) { /* ignore */ }
    DS = null;
  }

  function renderDictation(el) {
    css(); dictCleanup();
    var level = sget('tenso:level', 'B1'); if (LEVELS.indexOf(level) < 0) level = 'B1';
    var S = DS = {
      level: level, pool: poolFor(level), i: 0, checked: false, speaking: false, timers: [],
      text: !ttsOK() || sget('tenso:dict-text', false) === true,
      rate: Math.min(1.3, Math.max(0.5, Number(sget('tenso:dict-rate', 0.9)) || 0.9)),
      accent: sget('tenso:dict-voice', 'us') === 'uk' ? 'uk' : 'us', plays: 0, session: { n: 0, sum: 0 }
    };
    var art = h('div', { class: 'tx-art', 'aria-hidden': 'true' });
    var lvlSeg = h('div', { class: 'seg sm', role: 'group', 'aria-label': 'Səviyyə' });
    LEVELS.forEach(function (l) {
      lvlSeg.appendChild(h('button', { type: 'button', 'aria-pressed': String(l === S.level), onclick: function () {
        sset('tenso:level', l); S.level = l; S.pool = poolFor(l); S.i = 0;
        Array.prototype.forEach.call(lvlSeg.children, function (b) { b.setAttribute('aria-pressed', String(b.textContent === l)); });
        loadSentence();
      } }, l));
    });
    var counter = h('span', { class: 'tx-count' });
    var stageBox = h('div');
    var input = h('textarea', { class: 'textarea', rows: 2, spellcheck: 'false', autocapitalize: 'sentences', autocomplete: 'off', placeholder: 'Eşitdiyinizi yazın…', 'aria-label': 'Eşitdiyiniz cümlə', style: 'min-height:84px' });
    var checkBtn = h('button', { class: 'btn btn-primary', type: 'button' }, ie('check'), 'Yoxla');
    var skipBtn = h('button', { class: 'btn btn-ghost', type: 'button' }, 'Keç');
    var result = h('div', { class: 'stack', 'aria-live': 'polite' });
    var modeBtn = h('button', { class: 'btn btn-ghost btn-sm', type: 'button' });

    function t(fn, ms) { var id = setTimeout(fn, ms); S.timers.push(id); return id; }
    function cur() { return S.pool[S.i % S.pool.length]; }
    function speak() {
      if (!ttsOK()) { switchText(true); return; }
      var s = cur(); if (!s) return;
      try {
        W.speechSynthesis.cancel();
        var u = new W.SpeechSynthesisUtterance(s.en);
        var v = pickVoice(S.accent);
        if (v) { u.voice = v; u.lang = v.lang; } else u.lang = S.accent === 'uk' ? 'en-GB' : 'en-US';
        u.rate = S.rate; u.pitch = 1;
        var started = false;
        u.onstart = function () { started = true; S.speaking = true; paintPlay(); tset(S.t, 'read'); };
        u.onend = function () { S.speaking = false; paintPlay(); tset(S.t, 'idle'); try { input.focus({ preventScroll: true }); } catch (e) { /* ignore */ } };
        u.onerror = function (e) {
          S.speaking = false; paintPlay();
          if (e && (e.error === 'interrupted' || e.error === 'canceled')) return;
          toast('Səsləndirmə alınmadı', 'warn', { sub: 'Mətn rejiminə keçdik — cümlə bulanıq göstərilir.' });
          switchText(true);
        };
        S.plays++;
        W.speechSynthesis.speak(u);
        /* some engines never fire onstart (no voices) — fall back after a while */
        t(function () { if (!started && DS === S && !S.text && !W.speechSynthesis.speaking) { toast('Bu cihazda ingilis səsi tapılmadı', 'warn', { sub: 'Mətn rejimi açıldı.' }); switchText(true); } }, 2500);
      } catch (e) { log(e); switchText(true); }
    }
    var playBtn = h('button', { class: 'tx-play', type: 'button', 'aria-label': 'Cümləni dinlə' });
    playBtn.addEventListener('click', function () { if (S.speaking) { try { W.speechSynthesis.cancel(); } catch (e) { /* ignore */ } S.speaking = false; paintPlay(); } else speak(); });
    function paintPlay() { playBtn.textContent = ''; playBtn.appendChild(ie(S.speaking ? 'pause' : 'play')); playBtn.classList.toggle('on', S.speaking); playBtn.setAttribute('aria-label', S.speaking ? 'Dayandır' : (S.plays ? 'Yenidən dinlə' : 'Cümləni dinlə')); }

    function stageAudio() {
      var rate = h('input', { type: 'range', min: 0.5, max: 1.3, step: 0.1, value: String(S.rate), 'aria-label': 'Sürət' });
      var rv = h('span', { text: S.rate.toFixed(1).replace('.', ',') + '×' });
      rate.addEventListener('input', function () { S.rate = Number(rate.value) || 0.9; rv.textContent = S.rate.toFixed(1).replace('.', ',') + '×'; sset('tenso:dict-rate', S.rate); });
      var acc = h('div', { class: 'seg sm', role: 'group', 'aria-label': 'Aksent' });
      [['us', 'US'], ['uk', 'UK']].forEach(function (p) {
        acc.appendChild(h('button', { type: 'button', 'aria-pressed': String(S.accent === p[0]), onclick: function () {
          S.accent = p[0]; sset('tenso:dict-voice', p[0]);
          Array.prototype.forEach.call(acc.children, function (b, i) { b.setAttribute('aria-pressed', String((i ? 'uk' : 'us') === S.accent)); });
        } }, p[1]));
      });
      var replay = h('button', { class: 'btn btn-sm', type: 'button', onclick: function () { speak(); } }, ie('refresh'), 'Təkrar');
      var slow = h('button', { class: 'btn btn-sm btn-ghost', type: 'button', onclick: function () { var r0 = S.rate; S.rate = 0.6; speak(); S.rate = r0; } }, 'Yavaş');
      paintPlay();
      return h('div', { class: 'stack' },
        h('div', { class: 'tx-dict-stage' }, playBtn,
          h('div', { class: 'tx-rate' }, h('label', null, h('span', { text: 'Sürət' }), rv), rate)),
        h('div', { class: 'tx-row' }, replay, slow, h('span', { class: 'tx-sp' }), acc));
    }
    function stageText() {
      var s = cur();
      var blur = h('div', { class: 'tx-blur', 'aria-label': 'Bulanıq cümlə' }, h('span', { text: s ? s.en : '' }));
      var peek = h('button', { class: 'btn btn-sm', type: 'button' }, ie('eye'), '3 saniyə göstər');
      var peeks = 0;
      peek.addEventListener('click', function () {
        if (blur.classList.contains('show')) return;
        peeks++; blur.classList.add('show'); tset(S.t, 'read');
        t(function () { blur.classList.remove('show'); tset(S.t, 'idle'); try { input.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }, 3000);
      });
      S.peekCount = function () { return peeks; };
      return h('div', { class: 'stack' },
        h('div', { class: 'callout' }, ie('info'), h('div', { text: ttsOK() ? 'Mətn rejimi: cümlə bulanıqdır. 3 saniyəlik baxın, sonra yaddaşdan yazın.' : 'Bu brauzer səsləndirməni dəstəkləmir — mətn rejimi: cümləni 3 saniyəlik açın, sonra yaddaşdan yazın.' })),
        blur, h('div', { class: 'tx-row' }, peek));
    }
    function paintStage() {
      stageBox.textContent = '';
      stageBox.appendChild(S.text ? stageText() : stageAudio());
      modeBtn.textContent = '';
      if (ttsOK()) { modeBtn.hidden = false; modeBtn.appendChild(D.createTextNode(S.text ? 'Səsli rejimə qayıt' : 'Səs yoxdur? Mətn rejimi')); }
      else modeBtn.hidden = true;
    }
    function switchText(on, manual) {
      if (DS !== S) return;
      if (S.text === on) return;
      S.text = on; if (manual) sset('tenso:dict-text', on);
      try { if (ttsOK()) W.speechSynthesis.cancel(); } catch (e) { /* ignore */ }
      S.speaking = false;
      paintStage();
    }
    modeBtn.addEventListener('click', function () { switchText(!S.text, true); });

    function loadSentence() {
      S.checked = false; S.plays = 0;
      try { if (ttsOK()) W.speechSynthesis.cancel(); } catch (e) { /* ignore */ }
      S.speaking = false;
      input.value = ''; input.readOnly = false;
      result.textContent = '';
      checkBtn.disabled = false; checkBtn.textContent = ''; checkBtn.appendChild(ie('check')); checkBtn.appendChild(D.createTextNode('Yoxla'));
      skipBtn.hidden = false;
      counter.textContent = 'Cümlə ' + ((S.i % S.pool.length) + 1) + ' / ' + S.pool.length + ' · ' + S.level;
      paintStage();
    }
    function next() { S.i++; if (S.i % S.pool.length === 0) S.pool = poolFor(S.level); loadSentence(); }
    function check() {
      if (S.checked) { next(); return; }
      var typed = trim(input.value);
      if (!typed) { input.setAttribute('aria-invalid', 'true'); toast('Əvvəlcə eşitdiyinizi yazın', 'warn'); input.focus(); return; }
      input.removeAttribute('aria-invalid');
      var s = cur(), g = grade(s.en, typed);
      S.checked = true; input.readOnly = true; skipBtn.hidden = true;
      try { if (ttsOK()) W.speechSynthesis.cancel(); } catch (e) { /* ignore */ }
      checkBtn.textContent = ''; checkBtn.appendChild(D.createTextNode('Növbəti')); checkBtn.appendChild(ie('arrow'));
      var xp = g.score === 100 ? 10 : g.score >= 80 ? 6 : g.score >= 50 ? 3 : 1;
      S.session.n++; S.session.sum += g.score;
      var diffBox = h('div', { class: 'tx-diff' });
      g.items.forEach(function (it, i) {
        if (i) diffBox.appendChild(D.createTextNode(' '));
        if (it.k === 'ok') diffBox.appendChild(h('span', { class: 'w ok', text: it.w }));
        else if (it.k === 'miss') diffBox.appendChild(h('span', { class: 'w miss', title: 'Buraxılıb', text: it.w }));
        else if (it.k === 'extra') diffBox.appendChild(h('span', { class: 'w extra', title: 'Artıq söz', text: it.got }));
        else diffBox.appendChild(h('span', { class: 'tx-wrong' }, h('span', { class: 'w bad', title: 'Səhv yazılıb', text: it.got }), h('span', { class: 'w fix', text: it.w })));
      });
      var cls = g.score >= 90 ? 'good' : g.score >= 60 ? 'mid' : 'low';
      var verdict = g.score === 100 ? 'Mükəmməl! Hər söz yerindədir.' : g.score >= 80 ? 'Çox yaxşı — bir-iki xırda səhv.' : g.score >= 50 ? 'Pis deyil. Fərqlərə baxın və yenidən dinləyin.' : 'Çətin cümlə idi. Yavaş rejimdə yenidən cəhd edin.';
      var card = h('section', { class: 'card stack' },
        h('div', { class: 'tx-score ' + cls }, h('b', { text: g.score + '%' }), h('div', null, h('div', { text: verdict }), h('small', { class: 'muted', text: g.ok + ' / ' + g.total + ' söz düz · +' + xp + ' XP' }))),
        diffBox,
        h('div', { class: 'tx-legend' },
          h('span', null, h('i', { style: 'background:var(--ok-t);border:1px solid var(--ok)' }), 'düzgün forma'),
          h('span', null, h('i', { style: 'background:var(--nar-t);border:1px solid var(--nar)' }), 'səhv / artıq'),
          h('span', null, h('i', { style: 'border-bottom:2px dashed var(--ok)' }), 'buraxılıb')),
        h('div', { class: 'divider' }),
        h('div', { class: 'stack-sm' },
          h('b', { text: s.en }),
          s.az ? h('span', { class: 'muted', text: s.az }) : null),
        h('ul', { class: 'tx-pts' },
          s.note ? h('li', null, ie('bulb'), h('span', { text: s.note })) : null,
          g.points.map(function (p) { return h('li', null, ie('dot'), h('span', { text: p })); })),
        h('div', { class: 'tx-row' },
          h('button', { class: 'btn btn-sm btn-ghost', type: 'button', onclick: function () { S.checked = false; input.readOnly = false; input.value = ''; result.textContent = ''; skipBtn.hidden = false; checkBtn.textContent = ''; checkBtn.appendChild(ie('check')); checkBtn.appendChild(D.createTextNode('Yoxla')); paintStage(); input.focus(); } }, ie('refresh'), 'Yenidən yaz'),
          W.TensoExtra && g.score < 100 && g.points.length ? h('button', { class: 'btn btn-sm btn-ghost', type: 'button', onclick: function () {
            var firstBad = g.items.filter(function (x) { return x.k !== 'ok'; })[0] || {};
            ask({ sentence: typed, wrong: firstBad.got || '', fix: firstBad.w || '', ruleTitle: 'Diktant', why: (s.note || '') + ' ' + (g.points[0] || ''), lang: 'en' });
          } }, ie('help'), 'Tensodan soruş') : null));
      result.textContent = ''; result.appendChild(card);
      addXP(xp, 'Diktant ' + g.score + '%', { el: checkBtn });
      if (g.score === 100) { tset(S.t, 'success', 2200); burstAt(card.querySelector('.tx-score b'), 'stars'); }
      else if (g.score >= 60) tset(S.t, 'read', 1800);
      else tset(S.t, 'worried', 2000);
      try { card.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (e) { /* ignore */ }
    }
    checkBtn.addEventListener('click', check);
    skipBtn.addEventListener('click', next);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); check(); } });

    var streakHost = h('div');
    el.appendChild(h('div', { class: 'page tx-page tx-dict' },
      h('div', { class: 'page-h' }, h('div', { class: 'tx-hero' }, art, h('div', null,
        h('span', { class: 'eyebrow', text: 'Tenso · Dinləmə' }),
        h('h1', { html: 'Dik<em>tant</em>' }),
        h('p', { text: 'Tenso cümləni oxuyur, siz yazırsınız. Hər söz yoxlanır, səhvlərin qrammatikası izah olunur.' })))),
      h('section', { class: 'card stack' },
        h('div', { class: 'tx-row' }, lvlSeg, h('span', { class: 'tx-sp' }), counter),
        stageBox,
        h('div', { class: 'field' }, h('label', { text: 'Sizin yazdığınız' }), input),
        h('div', { class: 'tx-row' }, modeBtn, h('span', { class: 'tx-sp' }), skipBtn, checkBtn)),
      result,
      streakHost));
    S.t = mountTenso(art, 'wave', 64);
    renderStreakCard(streakHost, { compact: false });
    if (ttsOK()) {
      S.onVoices = function () { /* voices load async in Chrome; nothing to repaint unless empty */ };
      try { W.speechSynthesis.addEventListener('voiceschanged', S.onVoices); W.speechSynthesis.getVoices(); } catch (e) { /* ignore */ }
    }
    loadSentence();
  }

  /* ------------------------------------------------------------------
     9. REGISTRATION + PUBLIC API
     ------------------------------------------------------------------ */
  if (typeof App.register === 'function') {
    App.register('g-rewrite', {
      title: 'Yenidən yaz', icon: 'wand', group: 'Tenso', mode: 'grammar',
      render: function (el) { renderRewrite(el); },
      leave: function () { rwCleanup(); }
    });
    App.register('g-dictation', {
      title: 'Diktant', icon: 'quill', group: 'Tenso', mode: 'grammar',
      render: function (el) { renderDictation(el); },
      leave: function () { dictCleanup(); }
    });
  }

  W.TensoExtra = {
    ask: ask,
    addXP: addXP,
    streak: streak,
    weekly: weekly,
    setGoal: setGoal,
    goalSheet: goalSheet,
    challenge: challenge,
    renderStreakCard: renderStreakCard,
    grade: grade,
    sentences: function (level) { return poolFor(level || sget('tenso:level', 'B1')); }
  };
})();
