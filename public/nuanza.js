/* =====================================================================
   NUANZA — companion girl + NuanzaFX (nuanza.js)
   window.Nuanza.mount(el,{size:'full'|'dock'|'mini'}) -> instance
     instance.set(state,{say,ms}) · say(text,ms) · react('pet'|'hop'|'nod'|'shake') · destroy()
     states: idle wave think write read success celebrate streak worried sad sleep surprised point
   window.NuanzaFX.burst(x,y,kind) · xp(x,y,text) · medal(rankName)
   Hand-authored inline SVG, layered groups; all motion in injected CSS (nz- prefix).
   ===================================================================== */
(function () {
  'use strict';
  var SVGNS = 'http://www.w3.org/2000/svg';
  var uidSeq = 0;

  /* ---------- small helpers ---------- */
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function f2(n) { return Math.round(n * 100) / 100; }
  function store() { return (window.App && window.App.store) ? window.App.store : null; }
  function cfg() {
    var d = { show: true, size: 'md', chatty: true, motion: true };
    var s = store(), v = null;
    try { v = s ? s.get('companion', null) : null; } catch (e) { v = null; }
    if (v && typeof v === 'object') { for (var k in v) { if (Object.prototype.hasOwnProperty.call(v, k)) d[k] = v[k]; } }
    return d;
  }
  function reduced() {
    /* Only the in-app setting can calm her: html[data-motion="reduce"], or "system" while the
       OS asks to reduce motion. The default ("full") keeps her alive even with OS Reduce Motion on. */
    var r = false, dm = document.documentElement.getAttribute('data-motion');
    if (dm === 'reduce') r = true;
    else if (dm === 'system') {
      try { r = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { r = false; }
    }
    var m = cfg().motion;
    if (m === false || m === 'reduce' || m === 'calm' || m === 'off') r = true;
    return r;
  }
  /* «Animasiya intensivliyi» (Ayarlar → Nuanza köməkçisi, 0–100, 50 = təbii) → tempo multiplier
     for her idle loops: 10 → ~1.7× slower, 50 → 1, 100 → ~0.6× (livelier). 0 = calm (see reduced()). */
  function tempo() {
    var v = Number(cfg().intensity);
    if (!isFinite(v) || v <= 0) return 1;
    v = clamp(v, 10, 100);
    return f2(v <= 50 ? 1 + (50 - v) / 40 * 0.7 : 1 - (v - 50) / 50 * 0.4);
  }
  function chatty() { var c = cfg().chatty; return !(c === false || c === 'off' || c === 0); }
  function tok(name, fb) {
    try {
      var v = getComputedStyle(document.documentElement).getPropertyValue(name);
      v = v && v.trim();
      return v || fb;
    } catch (e) { return fb; }
  }
  function star8(cx, cy, R, r) {
    var p = [];
    for (var i = 0; i < 16; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 8, rr = (i % 2) ? r : R;
      p.push(f2(cx + rr * Math.cos(a)) + ',' + f2(cy + rr * Math.sin(a)));
    }
    return p.join(' ');
  }
  function spark(cx, cy, R) {
    var r = R * 0.26;
    return 'M' + cx + ' ' + (cy - R) + ' Q' + f2(cx + r) + ' ' + f2(cy - r) + ' ' + (cx + R) + ' ' + cy +
      ' Q' + f2(cx + r) + ' ' + f2(cy + r) + ' ' + cx + ' ' + (cy + R) +
      ' Q' + f2(cx - r) + ' ' + f2(cy + r) + ' ' + (cx - R) + ' ' + cy +
      ' Q' + f2(cx - r) + ' ' + f2(cy - r) + ' ' + cx + ' ' + (cy - R) + 'Z';
  }
  function qpt(p0, c, p2, t) {
    var u = 1 - t;
    return [u * u * p0[0] + 2 * u * t * c[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * c[1] + t * t * p2[1]];
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }

  /* ---------- CSS (injected once) ---------- */
  var CSS = [
    /* root + sizes */
    '.nz{--nz-w:min(240px,62vw);position:relative;display:inline-block;width:var(--nz-w);max-width:100%;line-height:0;vertical-align:bottom;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none}',
    '.nz[data-size="mini"]{--nz-w:84px}',
    '.nz[data-size="dock"]{--nz-w:var(--nz-dock,var(--dock,64px))}',
    '.nz-hit{display:block;width:100%;padding:0;margin:0;border:0;background:none;color:inherit;font:inherit;line-height:0;cursor:pointer;border-radius:22px;touch-action:manipulation;-webkit-tap-highlight-color:transparent}',
    '.nz-hit:focus-visible{outline:2px solid var(--focus,#9A6A14);outline-offset:3px}',
    '.nz svg.nz-svg{display:block;width:100%;height:auto;overflow:visible}',
    '.nz[data-hidden="1"]{display:none}',
    /* dock: floating disc, lift on hover, gentle entrance */
    '.nz[data-size="dock"] .nz-hit{border-radius:50%}',
    '.nz[data-size="dock"] svg.nz-svg{filter:drop-shadow(0 8px 14px rgba(16,19,42,.28)) drop-shadow(0 2px 3px rgba(16,19,42,.18));transition:transform .26s var(--ease-spring,cubic-bezier(.34,1.56,.64,1))}',
    '@media (hover:hover){.nz[data-size="dock"] .nz-hit:hover svg.nz-svg{transform:translateY(-3px) scale(1.04)}}',
    '.nz[data-size="dock"] .nz-hit:active svg.nz-svg{transform:scale(.94)}',
    '.nz[data-size="dock"]{animation:nz-dock-in .6s var(--ease-spring,cubic-bezier(.34,1.56,.64,1)) both}',
    '.nz-dot{position:absolute;top:2px;right:2px;width:12px;height:12px;border-radius:50%;background:var(--nar,#A3253A);box-shadow:0 0 0 2px var(--bg,#F6F2EA);transform:scale(0);transition:transform .3s var(--ease-spring,cubic-bezier(.34,1.56,.64,1))}',
    '.nz-dot.on{transform:scale(1)}',
    /* svg parts — illustration colours are fixed; dark mode only adds a soft rim */
    '.nz{--nz-rim:rgba(27,31,59,0)}',
    '@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .nz{--nz-rim:rgba(241,236,225,.22)}}',
    ':root[data-theme="dark"] .nz{--nz-rim:rgba(241,236,225,.22)}',
    '.nz-rim{stroke:var(--nz-rim);stroke-width:1.4}',
    '.nz-g{transform-box:view-box}',
    /* layered rig — origins in viewBox units */
    '.nz-fig{transform-origin:120px 294px}',
    '.nz-flipg{transform-origin:120px 200px;transition:transform .3s var(--ease-out,ease)}',
    '.nz.nz-flip .nz-flipg{transform:scaleX(-1)}',
    '.nz-shadow{transform-origin:120px 294px}',
    '.nz-body{transform-origin:120px 292px;animation:nz-breath calc(3.6s * var(--nz-tempo,1)) ease-in-out infinite}',
    '.nz-bob{animation:nz-bob calc(3.6s * var(--nz-tempo,1)) ease-in-out infinite}',
    '.nz-headpose{transform-origin:120px 170px;transform:var(--head,rotate(0deg));transition:transform .5s var(--ease-spring,cubic-bezier(.34,1.56,.64,1))}',
    '.nz-face{transition:transform .32s var(--ease-out,ease)}',
    '.nz-fringe{transition:transform .32s var(--ease-out,ease)}',
    '.nz-iris{transition:transform .2s var(--ease-out,ease)}',
    '.nz-eye{transition:transform 75ms ease-out}',
    '.nz.nz-blink .nz-eye{transform:scaleY(.08)}',
    '.nz-lid{transform:scaleY(var(--lid,0));transition:transform .28s var(--ease-out,ease)}',
    '.nz-braid{transform-origin:164px 142px;animation:nz-sway calc(3.4s * var(--nz-tempo,1)) ease-in-out infinite}',
    '.nz-braid2{transform-origin:172px 188px;animation:nz-sway2 calc(3.4s * var(--nz-tempo,1)) ease-in-out -.6s infinite}',
    '.nz-armR{transform-origin:150px 198px;transform:rotate(var(--r1,0deg))}',
    '.nz-foreR{transform-origin:158px 221px;transform:rotate(var(--r2,0deg))}',
    '.nz-handR{transform-origin:159px 243px;transform:rotate(var(--r3,0deg))}',
    '.nz-armL{transform-origin:90px 198px;transform:rotate(var(--l1,0deg))}',
    '.nz-foreL{transform-origin:82px 221px;transform:rotate(var(--l2,0deg))}',
    '.nz-handL{transform-origin:81px 243px;transform:rotate(var(--l3,0deg))}',
    '.nz-armR,.nz-foreR,.nz-handR,.nz-armL,.nz-foreL,.nz-handL{transition:transform .55s var(--ease-spring,cubic-bezier(.34,1.56,.64,1))}',
    '.nz-quill{transform-origin:159px 243px;animation:nz-flutter calc(5.2s * var(--nz-tempo,1)) ease-in-out infinite}',
    '.nz-vane{transform-origin:162px 232px;animation:nz-vane calc(2.6s * var(--nz-tempo,1)) ease-in-out infinite}',
    '.nz-m{opacity:0;transition:opacity .1s}',
    '.nz-cheek{opacity:.42;transition:opacity .4s}',
    '.nz.nz-blushing .nz-cheek{opacity:.85}',
    '.nz-xtra{opacity:0;transition:opacity .25s}',
    '.nz-eyeset{transition:opacity .12s}',
    '.nz-eyes-happy,.nz-eyes-closed{opacity:0;transition:opacity .12s}',
    '.nz[data-eyes="happy"] .nz-eyes-open,.nz[data-eyes="closed"] .nz-eyes-open{opacity:0}',
    '.nz[data-eyes="happy"] .nz-eyes-happy{opacity:1}',
    '.nz[data-eyes="closed"] .nz-eyes-closed{opacity:1}',
    '.nz[data-eyes="wide"] .nz-eye{transform:scale(1.07)}',
    '.nz[data-eyes="wide"] .nz-pupil{transform:scale(.72)}',
    '.nz-pupil{transition:transform .2s}',
    /* mouths by data-mouth */
    '.nz[data-mouth="smile"] .nz-m-smile,.nz[data-mouth="open"] .nz-m-open,.nz[data-mouth="o"] .nz-m-o,.nz[data-mouth="small"] .nz-m-small,',
    '.nz[data-mouth="tongue"] .nz-m-tongue,.nz[data-mouth="worry"] .nz-m-worry,.nz[data-mouth="sad"] .nz-m-sad,.nz[data-mouth="grin"] .nz-m-grin,',
    '.nz[data-mouth="sleep"] .nz-m-sleep,.nz[data-mouth="talk"] .nz-m-talk,.nz[data-mouth="hmm"] .nz-m-hmm{opacity:1}',
    /* paper (open scroll) for read / write */
    '.nz-paper{opacity:0;transform-origin:113px 240px;transform:scale(.4,.9);transition:opacity .2s,transform .35s var(--ease-spring,cubic-bezier(.34,1.56,.64,1))}',
    '.nz.nz-s-read .nz-paper,.nz.nz-s-write .nz-paper{opacity:1;transform:none}',
    '.nz-roll{transition:opacity .2s}',
    '.nz.nz-s-read .nz-roll,.nz.nz-s-write .nz-roll{opacity:0}',
    '.nz.nz-s-write .nz-ink path{stroke-dasharray:62;stroke-dashoffset:62;animation:nz-ink 2.7s linear infinite}',
    '.nz.nz-s-write .nz-ink path:nth-child(2){animation-delay:.9s}',
    '.nz.nz-s-write .nz-ink path:nth-child(3){animation-delay:1.8s}',
    '.nz.nz-s-write .nz-quill{animation:nz-scribble .3s linear infinite}',
    '.nz.nz-s-write .nz-foreR{animation:nz-writeline 1.35s ease-in-out infinite alternate}',
    '.nz.nz-s-read .nz-headpose{animation:nz-readscan 3.2s ease-in-out infinite}',
    /* wave: forearm swings, quill held high */
    '.nz.nz-s-wave .nz-foreR{animation:nz-wave .42s ease-in-out infinite alternate}',
    '.nz.nz-s-wave .nz-headpose{animation:nz-tilt-hi 2.6s ease-in-out}',
    /* think */
    '.nz.nz-s-think .nz-think{opacity:1}',
    '.nz-think circle{transform-box:fill-box;transform-origin:center}',
    '.nz.nz-s-think .nz-think circle{animation:nz-pulse 1.5s ease-in-out infinite}',
    '.nz.nz-s-think .nz-think circle:nth-child(2){animation-delay:.2s}',
    '.nz.nz-s-think .nz-think circle:nth-child(3){animation-delay:.4s}',
    '.nz.nz-s-think .nz-quill{animation:nz-tap 1.3s ease-in-out infinite}',
    /* success / celebrate: squash and stretch */
    '.nz.nz-s-success .nz-fig{animation:nz-hop .72s var(--ease-out,ease) 1}',
    '.nz.nz-s-success .nz-shadow,.nz.nz-s-celebrate .nz-shadow{animation:nz-shadow .72s var(--ease-out,ease) 1}',
    '.nz.nz-s-celebrate .nz-fig{animation:nz-hop .66s var(--ease-out,ease) 3}',
    '.nz.nz-s-celebrate .nz-shadow{animation-duration:.66s;animation-iteration-count:3}',
    '.nz.nz-s-celebrate .nz-foreR,.nz.nz-s-celebrate .nz-foreL{animation:nz-pump .33s ease-in-out infinite alternate}',
    '.nz.nz-s-success .nz-sparks,.nz.nz-s-celebrate .nz-sparks,.nz.nz-s-streak .nz-sparks{opacity:1}',
    '.nz-sparks path{transform-box:fill-box;transform-origin:center;transform:scale(0)}',
    '.nz.nz-s-success .nz-sparks path,.nz.nz-s-celebrate .nz-sparks path,.nz.nz-s-streak .nz-sparks path{animation:nz-twinkle 1.2s ease-in-out infinite}',
    '.nz-sparks path:nth-child(2){animation-delay:.3s!important}.nz-sparks path:nth-child(3){animation-delay:.6s!important}.nz-sparks path:nth-child(4){animation-delay:.9s!important}',
    /* streak: flame aura */
    '.nz-aura{opacity:0;transition:opacity .35s}',
    '.nz.nz-s-streak .nz-aura{opacity:1}',
    '.nz-flame1{transform-origin:120px 292px;animation:nz-flick 1.1s ease-in-out infinite alternate}',
    '.nz-flame2{transform-origin:120px 292px;animation:nz-flick2 .8s ease-in-out infinite alternate}',
    '.nz.nz-s-streak .nz-fig{animation:nz-hop .7s var(--ease-out,ease) 1}',
    '.nz.nz-s-streak .nz-foreR{animation:nz-pump .5s ease-in-out 4 alternate}',
    /* worried: sweat drop + shiver */
    '.nz.nz-s-worried .nz-sweat{opacity:1}',
    '.nz.nz-s-worried .nz-sweat path{animation:nz-drip 1.9s ease-in infinite}',
    '.nz.nz-s-worried .nz-fig{animation:nz-shiver .09s linear 8}',
    /* sad */
    '.nz.nz-s-sad .nz-braid{animation-duration:5s}',
    /* sleep */
    '.nz.nz-s-sleep .nz-zzz{opacity:1}',
    '.nz-zzz text{font-family:var(--f-display,Georgia,serif);font-style:italic;font-weight:600;fill:var(--lacquer,#1E2A5A);transform-box:fill-box;transform-origin:center}',
    '.nz.nz-s-sleep .nz-zzz text{animation:nz-z 2.7s ease-out infinite}',
    '.nz.nz-s-sleep .nz-zzz text:nth-child(2){animation-delay:.9s}',
    '.nz.nz-s-sleep .nz-zzz text:nth-child(3){animation-delay:1.8s}',
    '.nz.nz-s-sleep .nz-headpose{animation:nz-nod 3.8s ease-in-out infinite}',
    '.nz.nz-s-sleep .nz-body,.nz.nz-s-sleep .nz-bob{animation-duration:4.8s}',
    /* surprised */
    '.nz.nz-s-surprised .nz-fig{animation:nz-pop .5s var(--ease-out,ease) 1}',
    '.nz.nz-s-surprised .nz-shock{opacity:1}',
    '.nz.nz-s-surprised .nz-shock path{stroke-dasharray:14;animation:nz-shock .5s var(--ease-out,ease) both}',
    /* point */
    '.nz.nz-s-point .nz-foreR{animation:nz-jab 1.1s ease-in-out infinite}',
    /* reactions + idle variety */
    '.nz.nz-pet .nz-fig{animation:nz-pet .52s var(--ease-out,ease)}',
    '.nz-heart{opacity:0;transform-box:fill-box;transform-origin:center bottom}',
    '.nz.nz-pet .nz-heart{animation:nz-heart 1.15s var(--ease-out,ease)}',
    '.nz.nz-hopr .nz-fig{animation:nz-hop .6s var(--ease-out,ease)}',
    '.nz.nz-nod .nz-headpose{animation:nz-nodyes .7s ease-in-out}',
    '.nz.nz-shake .nz-headpose{animation:nz-nono .6s ease-in-out}',
    '.nz.nz-twirl .nz-quill{animation:nz-twirl .95s var(--ease-in-out,ease-in-out)}',
    '.nz.nz-stretch .nz-fig{animation:nz-stretch 1.3s var(--ease-in-out,ease-in-out)}',
    '.nz.nz-hum .nz-headpose{animation:nz-hum 1.8s ease-in-out}',
    '.nz.nz-flick .nz-braid{animation:nz-braidflick 1.2s var(--ease-out,ease)}',
    /* speech bubble */
    '.nz-bubble{position:absolute;z-index:3;width:max-content;max-width:min(244px,calc(100vw - 24px));padding:9px 13px;line-height:1.45;font:500 .875rem/1.45 var(--f-body,system-ui,sans-serif);color:var(--ink,#1B1F3B);',
    'background:var(--surface,#FFFDF8);border:1px solid var(--line,#E2D8C5);border-radius:16px;box-shadow:var(--sh-2,0 10px 30px -12px rgba(0,0,0,.35));text-align:left;white-space:normal;overflow-wrap:anywhere;',
    'opacity:0;visibility:hidden;pointer-events:none;transform:translate(var(--bx,0px),var(--by,0px)) translateY(6px) scale(.94);transform-origin:var(--bo,50% 100%);',
    'transition:opacity .18s var(--ease-out,ease),transform .26s var(--ease-spring,cubic-bezier(.34,1.56,.64,1)),visibility 0s linear .26s}',
    '.nz-bubble.on{opacity:1;visibility:visible;pointer-events:auto;transform:translate(var(--bx,0px),var(--by,0px));transition:opacity .18s var(--ease-out,ease),transform .3s var(--ease-spring,cubic-bezier(.34,1.56,.64,1)),visibility 0s}',
    '.nz-bubble::before{content:"";position:absolute;width:12px;height:12px;background:inherit;border:inherit;border-radius:0 0 3px 0;transform:rotate(45deg)}',
    '.nz-bubble.p-top::before{left:var(--tail,50%);bottom:-7px;margin-left:-6px;border-width:0 1px 1px 0}',
    '.nz-bubble.p-bottom::before{left:var(--tail,50%);top:-7px;margin-left:-6px;border-width:1px 0 0 1px}',
    '.nz-bubble.p-right::before{left:-7px;top:var(--tailY,26px);margin-top:-6px;border-width:0 0 1px 1px}',
    '.nz-bubble.p-left::before{right:-7px;top:var(--tailY,26px);margin-top:-6px;border-width:1px 1px 0 0}',
    '.nz-bubble b{color:var(--nar,#A3253A);font-weight:600}',
    '.nz-bubble .nz-caret{display:inline-block;width:2px;height:1em;margin-left:1px;vertical-align:-2px;background:var(--zafaran,#C58B2A);animation:nz-caret .7s steps(1) infinite}',
    '.nz-sr{position:absolute!important;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}',
    /* tips sheet content */
    '.nz-menu{display:grid;gap:14px}',
    '.nz-menu-hero{display:flex;align-items:center;gap:14px;padding:12px 14px;border-radius:var(--r-lg,18px);background:radial-gradient(120% 120% at 0% 0%,var(--zaf-t,rgba(197,139,42,.14)),transparent 70%),var(--surface2,#EFE8DA)}',
    '.nz-menu-hero .nz{flex:none}',
    '.nz-menu-hero p{margin:0;font-size:.9rem;line-height:1.5;color:var(--ink,#1B1F3B)}',
    '.nz-menu-hero small{display:block;color:var(--soft,#6A6577);font-size:.78rem;margin-top:2px}',
    '.nz-menu .list-row .ic svg{width:18px;height:18px}',
    '.nz-menu-acts{display:flex;flex-wrap:wrap;gap:8px}',
    /* keyframes */
    '@keyframes nz-dock-in{0%{opacity:0;transform:translateY(16px) scale(.6)}100%{opacity:1;transform:none}}',
    '@keyframes nz-breath{0%,100%{transform:scale(1,1)}50%{transform:scale(1.012,1.022)}}',
    '@keyframes nz-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-1.8px)}}',
    '@keyframes nz-sway{0%,100%{transform:rotate(-2.5deg)}50%{transform:rotate(3.5deg)}}',
    '@keyframes nz-sway2{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(5deg)}}',
    '@keyframes nz-flutter{0%,78%,100%{transform:rotate(0)}84%{transform:rotate(-7deg)}90%{transform:rotate(4deg)}95%{transform:rotate(-2deg)}}',
    '@keyframes nz-vane{0%,100%{transform:skewY(0)}50%{transform:skewY(-2deg)}}',
    '@keyframes nz-wave{from{transform:rotate(calc(var(--r2,0deg) + 16deg))}to{transform:rotate(calc(var(--r2,0deg) - 18deg))}}',
    '@keyframes nz-tilt-hi{0%,100%{transform:var(--head,rotate(0deg))}30%,70%{transform:rotate(-5deg)}}',
    '@keyframes nz-pulse{0%,100%{transform:scale(.82);opacity:.65}50%{transform:scale(1.08);opacity:1}}',
    '@keyframes nz-tap{0%,100%{transform:rotate(0)}50%{transform:rotate(-9deg)}}',
    '@keyframes nz-scribble{0%{transform:translate(0,0) rotate(-3deg)}25%{transform:translate(-1.6px,1px) rotate(2deg)}50%{transform:translate(-3px,0) rotate(-2deg)}75%{transform:translate(-1.6px,-1px) rotate(3deg)}100%{transform:translate(0,0) rotate(-3deg)}}',
    '@keyframes nz-writeline{from{transform:rotate(calc(var(--r2,0deg) - 7deg))}to{transform:rotate(calc(var(--r2,0deg) + 7deg))}}',
    '@keyframes nz-ink{0%{stroke-dashoffset:62}70%,100%{stroke-dashoffset:0}}',
    '@keyframes nz-readscan{0%,100%{transform:var(--head,rotate(0deg)) translateX(-1.5px)}50%{transform:var(--head,rotate(0deg)) translateX(1.5px)}}',
    '@keyframes nz-hop{0%{transform:none}16%{transform:scale(1.1,.86)}42%{transform:translateY(-30px) scale(.93,1.09)}62%{transform:translateY(-34px) scale(1,1)}82%{transform:translateY(0) scale(1.08,.9)}92%{transform:scale(.98,1.03)}100%{transform:none}}',
    '@keyframes nz-shadow{0%,100%{transform:none;opacity:1}16%{transform:scale(1.12,1)}50%{transform:scale(.62,.8);opacity:.45}82%{transform:scale(1.1,1)}}',
    '@keyframes nz-pump{from{transform:rotate(calc(var(--r2,0deg) + 10deg))}to{transform:rotate(calc(var(--r2,0deg) - 12deg))}}',
    '@keyframes nz-twinkle{0%,100%{transform:scale(0) rotate(0);opacity:0}45%{transform:scale(1.15) rotate(45deg);opacity:1}70%{transform:scale(.8) rotate(70deg);opacity:.9}}',
    '@keyframes nz-flick{from{transform:scale(1,1) skewX(-1.5deg)}to{transform:scale(1.03,1.06) skewX(1.5deg)}}',
    '@keyframes nz-flick2{from{transform:scale(1.02,1) skewX(2deg)}to{transform:scale(.98,1.08) skewX(-2deg)}}',
    '@keyframes nz-drip{0%{transform:translateY(-4px);opacity:0}15%{opacity:1}80%{transform:translateY(9px);opacity:1}100%{transform:translateY(12px);opacity:0}}',
    '@keyframes nz-shiver{0%,100%{transform:translateX(0)}25%{transform:translateX(-1.4px)}75%{transform:translateX(1.4px)}}',
    '@keyframes nz-z{0%{transform:translate(0,6px) scale(.5);opacity:0}25%{opacity:1}100%{transform:translate(10px,-16px) scale(1.1);opacity:0}}',
    '@keyframes nz-nod{0%,100%{transform:rotate(4deg) translateY(3px)}50%{transform:rotate(8deg) translateY(6px)}}',
    '@keyframes nz-pop{0%{transform:none}30%{transform:translateY(-12px) scale(.96,1.06)}65%{transform:translateY(0) scale(1.05,.95)}100%{transform:none}}',
    '@keyframes nz-shock{from{stroke-dashoffset:14;opacity:0}to{stroke-dashoffset:0;opacity:1}}',
    '@keyframes nz-jab{0%,100%{transform:rotate(var(--r2,0deg))}40%{transform:rotate(calc(var(--r2,0deg) - 9deg))}}',
    '@keyframes nz-pet{0%{transform:none}28%{transform:scale(1.08,.9)}58%{transform:scale(.95,1.06)}80%{transform:scale(1.02,.98)}100%{transform:none}}',
    '@keyframes nz-heart{0%{opacity:0;transform:translateY(8px) scale(.3)}30%{opacity:1;transform:translateY(-4px) scale(1.15)}75%{opacity:1;transform:translateY(-16px) scale(1)}100%{opacity:0;transform:translateY(-26px) scale(.9)}}',
    '@keyframes nz-nodyes{0%,100%{transform:var(--head,rotate(0deg))}30%{transform:rotate(3deg) translateY(4px)}65%{transform:rotate(-1deg) translateY(-1px)}}',
    '@keyframes nz-nono{0%,100%{transform:var(--head,rotate(0deg))}20%{transform:rotate(-6deg)}45%{transform:rotate(6deg)}70%{transform:rotate(-4deg)}}',
    '@keyframes nz-twirl{0%{transform:rotate(0)}100%{transform:rotate(-360deg)}}',
    '@keyframes nz-stretch{0%,100%{transform:none}35%,60%{transform:scale(.97,1.06)}75%{transform:scale(1.03,.97)}}',
    '@keyframes nz-hum{0%,100%{transform:var(--head,rotate(0deg))}25%{transform:rotate(-5deg)}75%{transform:rotate(5deg)}}',
    '@keyframes nz-braidflick{0%{transform:rotate(0)}30%{transform:rotate(14deg)}60%{transform:rotate(-7deg)}80%{transform:rotate(3deg)}100%{transform:rotate(0)}}',
    '@keyframes nz-caret{50%{opacity:0}}',
    /* reduced motion: hold poses, fade only */
    '.nz.nz-calm *{animation:none!important}',
    '.nz.nz-calm .nz-bubble{transition:opacity .2s,visibility 0s linear .2s!important;transform:translate(var(--bx,0px),var(--by,0px))!important}',
    '.nz.nz-calm .nz-bubble.on{transition:opacity .2s,visibility 0s!important}'
  ].join('\n');

  function injectCSS() {
    if (document.getElementById('nz-css')) return;
    var st = document.createElement('style');
    st.id = 'nz-css';
    st.textContent = CSS;
    (document.head || document.documentElement).appendChild(st);
  }

  /* ---------- palette (illustration — fixed in both themes) ---------- */
  var C = {
    skin: '#F6CFB2', skinSh: '#E9B391', skinDeep: '#D99A7C', lid: '#EFBFA0',
    hair: '#2B1B15', hairMid: '#3E281F', hairHi: '#7A5140',
    robe: '#24346F', robeDk: '#18234F', sleeve: '#26387A',
    nar: '#B3263A', narDk: '#8A1A2C', gold: '#D9A441', goldHi: '#F2D08A', goldDk: '#A8741B',
    ivory: '#FFF8EC', ivorySh: '#E9DCC3', parch: '#F7EBD2', parchSh: '#E2CFA8',
    lash: '#21140F', brow: '#3A251C', iris: '#5A331E', pupil: '#160C08',
    mouth: '#6E1E2C', tongue: '#EC7B87', blush: '#F2918A', ink: '#2A2F55'
  };

  /* ---------- SVG markup ---------- */
  var curU = '';
  function buildSVG(u, size) {
    curU = u;
    var dock = size === 'dock';
    var D = [];
    /* defs */
    D.push('<defs>',
      '<linearGradient id="' + u + 'robe" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2E418A"/><stop offset=".5" stop-color="' + C.robe + '"/><stop offset="1" stop-color="' + C.robeDk + '"/></linearGradient>',
      '<linearGradient id="' + u + 'robeSide" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".22"/><stop offset=".22" stop-color="#000" stop-opacity="0"/><stop offset=".78" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".26"/></linearGradient>',
      '<linearGradient id="' + u + 'hair" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="' + C.hairMid + '"/><stop offset="1" stop-color="' + C.hair + '"/></linearGradient>',
      '<radialGradient id="' + u + 'skin" cx=".42" cy=".36" r=".72"><stop offset="0" stop-color="#FBDCC4"/><stop offset=".7" stop-color="' + C.skin + '"/><stop offset="1" stop-color="#EDBB9A"/></radialGradient>',
      '<radialGradient id="' + u + 'iris" cx=".5" cy=".72" r=".62"><stop offset="0" stop-color="#A86C3E"/><stop offset=".55" stop-color="' + C.iris + '"/><stop offset="1" stop-color="#2C170D"/></radialGradient>',
      '<linearGradient id="' + u + 'sash" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#CB3449"/><stop offset="1" stop-color="' + C.narDk + '"/></linearGradient>',
      '<linearGradient id="' + u + 'gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + C.goldHi + '"/><stop offset=".5" stop-color="' + C.gold + '"/><stop offset="1" stop-color="' + C.goldDk + '"/></linearGradient>',
      '<radialGradient id="' + u + 'blush" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="' + C.blush + '"/><stop offset="1" stop-color="' + C.blush + '" stop-opacity="0"/></radialGradient>',
      '<linearGradient id="' + u + 'fl1" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#E8572E" stop-opacity="0"/><stop offset=".25" stop-color="#EE6B2F" stop-opacity=".75"/><stop offset=".7" stop-color="#F6A23A"/><stop offset="1" stop-color="#FFD36E"/></linearGradient>',
      '<linearGradient id="' + u + 'fl2" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#FFC24D" stop-opacity="0"/><stop offset=".35" stop-color="#FFC24D" stop-opacity=".8"/><stop offset="1" stop-color="#FFF0B8"/></linearGradient>',
      '<radialGradient id="' + u + 'disc" cx=".5" cy=".3" r=".75"><stop offset="0" stop-color="#34479A"/><stop offset=".65" stop-color="#1E2A5A"/><stop offset="1" stop-color="#141C42"/></radialGradient>',
      '<clipPath id="' + u + 'robeClip"><path d="M120 179 C102 179 92 185 86 197 C78 214 72 250 70 289 Q120 297 170 289 C168 250 162 214 154 197 C148 185 138 179 120 179Z"/></clipPath>',
      '<clipPath id="' + u + 'eyeL"><ellipse cx="99" cy="116" rx="12.5" ry="14.5"/></clipPath>',
      '<clipPath id="' + u + 'eyeR"><ellipse cx="141" cy="116" rx="12.5" ry="14.5"/></clipPath>',
      '<clipPath id="' + u + 'mOpen"><path d="M108 141 Q120 143.5 132 141 Q131 157.5 120 158.5 Q109 157.5 108 141Z"/></clipPath>',
      '<clipPath id="' + u + 'mGrin"><path d="M108.5 142 Q120 145 131.5 142 Q130 153 120 153.5 Q110 153 108.5 142Z"/></clipPath>',
      '<clipPath id="' + u + 'dock"><circle cx="120" cy="138" r="56.5"/><rect x="63.5" y="-40" width="113" height="178"/></clipPath>',
      '</defs>');

    var S = [];
    /* dock disc (behind her) */
    if (dock) {
      S.push('<g class="nz-disc"><circle cx="120" cy="138" r="58" fill="url(#' + u + 'disc)"/>',
        '<polygon points="' + star8(120, 136, 46, 33) + '" fill="' + C.gold + '" opacity=".13"/>',
        '<circle cx="120" cy="138" r="52.5" fill="none" stroke="' + C.gold + '" stroke-opacity=".5" stroke-width="1.3" stroke-dasharray="1.6 4.2"/>',
        '<circle cx="120" cy="138" r="57" fill="none" stroke="' + C.gold + '" stroke-width="2.6"/></g>');
      S.push('<g clip-path="url(#' + u + 'dock)"><g transform="translate(120 202) scale(.76) translate(-120 -202)">');
    }
    /* ground shadow */
    if (!dock) S.push('<ellipse class="nz-g nz-shadow" cx="120" cy="294" rx="58" ry="6.5" fill="#1B1F3B" opacity=".16"/>');
    S.push('<g class="nz-g nz-flipg"><g class="nz-g nz-fig">');

    /* --- streak aura (behind everything) --- */
    S.push('<g class="nz-aura"><g class="nz-g nz-flame1"><path d="' + flamePath(120, 252, 114, 236, 9, 0.8) + '" fill="url(#' + u + 'fl1)"/></g>',
      '<g class="nz-g nz-flame2"><path d="' + flamePath(120, 258, 88, 196, 7, 0.76) + '" fill="url(#' + u + 'fl2)" opacity=".75"/></g></g>');

    /* --- back layer that follows the head: long hair + braid --- */
    S.push('<g class="nz-g nz-headpose"><g class="nz-g nz-bob">');
    S.push('<path class="nz-rim" d="M58 118 C50 64 84 30 120 30 C156 30 190 64 182 118 C185 146 183 166 175 182 Q167 189 160 180 L158 150 L82 150 L80 180 Q73 189 65 182 C57 166 55 146 58 118Z" fill="url(#' + u + 'hair)"/>');
    /* braid: two jointed groups for secondary motion */
    S.push('<g class="nz-g nz-braid">', braidSeg(165, 148, 12.5, 1), braidSeg(167, 163, 12, -1), braidSeg(169, 177, 11.5, 1));
    S.push('<g class="nz-g nz-braid2">', braidSeg(171, 191, 11, -1), braidSeg(173, 204, 10.2, 1), braidSeg(174.5, 216, 9.2, -1),
      '<rect x="167" y="223" width="15" height="7" rx="3.5" fill="' + C.nar + '"/>',
      '<circle cx="174.5" cy="226.5" r="2" fill="' + C.goldHi + '"/>',
      '<path d="M168.5 230 Q166 241 170 249 Q174 244 175 238 Q176.5 245 180.5 248 Q183 240 180.5 230Z" fill="' + C.hairMid + '"/>',
      '<path d="M172 233 Q171 240 172.5 245 M177.5 233 Q178.5 239 178 244" stroke="' + C.hairHi + '" stroke-opacity=".5" stroke-width="1" fill="none" stroke-linecap="round"/>',
      '</g></g>');
    S.push('</g></g>');

    /* --- body (breathing) --- */
    S.push('<g class="nz-g nz-body">');
    /* slippers */
    S.push('<path d="M92 293 Q90 284 103 283.5 Q113 284 114 290 Q113 294 104 294 Q96 294.5 92 293Z" fill="' + C.nar + '"/>',
      '<path d="M92.5 292 Q86 292 85 286.5" fill="none" stroke="' + C.gold + '" stroke-width="2" stroke-linecap="round"/>',
      '<path d="M148 293 Q150 284 137 283.5 Q127 284 126 290 Q127 294 136 294 Q144 294.5 148 293Z" fill="' + C.nar + '"/>',
      '<path d="M147.5 292 Q154 292 155 286.5" fill="none" stroke="' + C.gold + '" stroke-width="2" stroke-linecap="round"/>');
    /* neck */
    S.push('<path d="M110.5 156 L110.5 182 Q120 189 129.5 182 L129.5 156Z" fill="' + C.skin + '"/>',
      '<path d="M110.5 160 Q120 170 129.5 160 L129.5 168 Q120 176 110.5 168Z" fill="' + C.skinSh + '" opacity=".75"/>');
    /* robe */
    S.push('<path class="nz-rim" d="M120 179 C102 179 92 185 86 197 C78 214 72 250 70 289 Q120 297 170 289 C168 250 162 214 154 197 C148 185 138 179 120 179Z" fill="url(#' + u + 'robe)"/>');
    S.push('<g clip-path="url(#' + u + 'robeClip)">',
      '<rect x="60" y="170" width="120" height="130" fill="url(#' + u + 'robeSide)"/>',
      '<ellipse cx="108" cy="214" rx="20" ry="26" fill="#fff" opacity=".05"/>',
      /* carpet-border hem */
      '<path d="M60 266 Q120 275 180 266 L180 300 L60 300Z" fill="' + C.nar + '"/>',
      '<path d="M60 268.5 Q120 277.5 180 268.5" fill="none" stroke="' + C.gold + '" stroke-width="1.6"/>',
      '<path d="M60 286 Q120 295 180 286" fill="none" stroke="' + C.gold + '" stroke-width="1.2" stroke-opacity=".8"/>',
      hemRow(),
      /* front trim */
      '<path d="M120 206 V229 M120 245 V268" stroke="' + C.gold + '" stroke-opacity=".6" stroke-width="1.3"/>',
      '</g>');
    /* inner V + collar */
    S.push('<path d="M107.5 181.5 L120 204 L132.5 181.5Z" fill="' + C.ivory + '"/>',
      '<path d="M106 182.5 L120 206.5 L134 182.5" fill="none" stroke="' + C.gold + '" stroke-width="1.8" stroke-linejoin="round"/>',
      '<path d="M119.5 192 Q109 200.5 97 193 Q96.5 184 106.5 180 Q112 186 119.5 192Z" fill="' + C.ivory + '" stroke="' + C.ivorySh + '" stroke-width=".9"/>',
      '<path d="M120.5 192 Q131 200.5 143 193 Q143.5 184 133.5 180 Q128 186 120.5 192Z" fill="' + C.ivory + '" stroke="' + C.ivorySh + '" stroke-width=".9"/>');
    /* sash with knot and tails */
    S.push('<path d="M84.6 229 Q120 238.5 155.4 229 L156.2 242 Q120 251.5 83.8 242Z" fill="url(#' + u + 'sash)"/>',
      '<path d="M84.8 233 Q120 242.5 155.6 233 M84.4 238.4 Q120 247.9 155.9 238.4" fill="none" stroke="' + C.goldHi + '" stroke-opacity=".65" stroke-width=".9"/>',
      '<path d="M97.5 243 Q94 254 90 265 L96.8 262.5 L99.5 267.5 Q103 255 105 244Z" fill="' + C.narDk + '"/>',
      '<path d="M104.5 244.5 Q106.5 256 108.5 266.5 L114.5 262.5 Q110.5 254 109.5 244.5Z" fill="#9E2135"/>',
      '<path d="M90.6 265.8 L91.4 268.6 M93.4 264.8 L94.4 267.6 M109.5 266.8 L109.6 269.6 M112.4 264.8 L113.6 267.4" stroke="' + C.gold + '" stroke-width="1.2" stroke-linecap="round"/>',
      '<rect x="98" y="236.5" width="11" height="10" rx="3.5" fill="' + C.nar + '" stroke="' + C.narDk + '" stroke-width=".8" transform="rotate(-8 103.5 241.5)"/>');
    /* brooch — gold 8-point star */
    S.push('<polygon points="' + star8(120, 214.5, 9, 6) + '" fill="url(#' + u + 'gold)" stroke="' + C.goldDk + '" stroke-width=".7" stroke-linejoin="round"/>',
      '<circle cx="120" cy="214.5" r="3.4" fill="' + C.nar + '" stroke="' + C.goldHi + '" stroke-width=".8"/>',
      '<circle cx="118.8" cy="213.3" r=".9" fill="#fff" opacity=".8"/>');
    S.push('</g>'); /* /body */

    /* --- arms (bob with breath) --- */
    S.push('<g class="nz-g nz-bob">');
    /* left arm (viewer's left) holding the rolled scroll */
    S.push('<g class="nz-g nz-armL">',
      '<path d="M90 198 L82 221" stroke="' + C.sleeve + '" stroke-width="17" stroke-linecap="round"/>',
      '<g class="nz-g nz-foreL">',
      '<path d="M82 221 L81 241" stroke="' + C.sleeve + '" stroke-width="15.5" stroke-linecap="round"/>',
      '<path d="M81.2 236 L81.05 239" stroke="' + C.gold + '" stroke-width="15.5"/>',
      '<g class="nz-g nz-handL">',
      '<g class="nz-roll" transform="rotate(-16 81 245)">',
      '<rect x="58" y="238.5" width="46" height="13" rx="6.5" fill="' + C.parch + '" stroke="' + C.parchSh + '" stroke-width="1.2"/>',
      '<ellipse cx="102.5" cy="245" rx="3" ry="6.3" fill="' + C.parchSh + '"/>',
      '<ellipse cx="102.5" cy="245" rx="1.2" ry="2.6" fill="#C9B38A"/>',
      '<rect x="66" y="238.5" width="4.5" height="13" fill="' + C.nar + '"/>',
      '<path d="M68 251 Q66 257 63 259 M68.5 251 Q70 256.5 72.5 258.5" stroke="' + C.nar + '" stroke-width="1.6" fill="none" stroke-linecap="round"/>',
      '</g>',
      '<circle cx="81" cy="244" r="7.6" fill="' + C.skin + '"/>',
      '<path d="M76.5 246 Q81 250 85.5 246" stroke="' + C.skinDeep + '" stroke-opacity=".55" stroke-width="1.1" fill="none" stroke-linecap="round"/>',
      '</g></g></g>');
    /* open scroll (read / write) */
    S.push('<g class="nz-g nz-paper">',
      '<path d="M78 225 L148 225 L150 253 L76 253Z" fill="' + C.parch + '" stroke="' + C.parchSh + '" stroke-width="1"/>',
      '<path d="M78 225 L148 225 L148.6 233 L77.4 233Z" fill="#fff" opacity=".35"/>',
      '<rect x="69" y="222" width="10" height="34" rx="5" fill="' + C.parch + '" stroke="' + C.parchSh + '" stroke-width="1.2"/>',
      '<rect x="147" y="222" width="10" height="34" rx="5" fill="' + C.parch + '" stroke="' + C.parchSh + '" stroke-width="1.2"/>',
      '<g class="nz-ink" stroke="' + C.ink + '" stroke-width="1.6" stroke-linecap="round" fill="none">',
      '<path d="M86 232.5 Q92 230.5 98 232.5 T110 232.5 T122 232.5 T134 232.5 T140 232"/>',
      '<path d="M86 239.5 Q92 237.5 98 239.5 T110 239.5 T122 239.5 T132 239"/>',
      '<path d="M86 246.5 Q92 244.5 98 246.5 T110 246.5 T120 246"/>',
      '</g>',
      '<polygon points="' + star8(141, 246, 4.2, 2.8) + '" fill="' + C.nar + '" opacity=".85"/>',
      '</g>');
    /* right arm (viewer's right) with the quill */
    S.push('<g class="nz-g nz-armR">',
      '<path d="M150 198 L158 221" stroke="' + C.sleeve + '" stroke-width="17" stroke-linecap="round"/>',
      '<g class="nz-g nz-foreR">',
      '<path d="M158 221 L159 241" stroke="' + C.sleeve + '" stroke-width="15.5" stroke-linecap="round"/>',
      '<path d="M158.8 236 L158.95 239" stroke="' + C.gold + '" stroke-width="15.5"/>',
      '<g class="nz-g nz-handR">',
      '<g class="nz-g nz-quill">',
      '<path d="M155.2 254 L158.6 246.5 L161 248Z" fill="' + C.goldDk + '"/>',
      '<path d="M156.2 252.6 L157.3 250" stroke="' + C.ink + '" stroke-width="1.3" stroke-linecap="round"/>',
      '<g class="nz-g nz-vane">',
      '<path d="M161 238 C163 222 172 196 192 162 C194 176 190 196 180 214 C175 224 168 233 162 240Z" fill="' + C.ivory + '" stroke="' + C.ivorySh + '" stroke-width="1.1"/>',
      '<path d="M186 172 C191 168 192 164 192 162 C194 176 191 186 188 194 C186 186 185 178 186 172Z" fill="' + C.nar + '" opacity=".9"/>',
      '<path d="M166 222 L174 215 M169 213 L178 206 M172 204 L182 196 M176 195 L185 187 M179 186 L187 180" stroke="' + C.ivorySh + '" stroke-width="1" stroke-linecap="round"/>',
      '</g>',
      '<path d="M158.6 247 C 166 222, 178 194, 191.5 163" fill="none" stroke="' + C.gold + '" stroke-width="1.5" stroke-linecap="round"/>',
      '</g>',
      '<circle cx="159" cy="244" r="7.6" fill="' + C.skin + '"/>',
      '<path d="M154.5 246 Q159 250 163.5 246" stroke="' + C.skinDeep + '" stroke-opacity=".55" stroke-width="1.1" fill="none" stroke-linecap="round"/>',
      '</g></g></g>');
    S.push('</g>'); /* /arms bob */

    /* --- head --- */
    S.push('<g class="nz-g nz-headpose"><g class="nz-g nz-bob">');
    /* ears + earrings */
    S.push('<circle cx="69" cy="119" r="8.6" fill="' + C.skin + '"/><path d="M66 115 Q70 118 67 123" stroke="' + C.skinDeep + '" stroke-width="1.4" fill="none" stroke-linecap="round"/>',
      '<circle cx="171" cy="119" r="8.6" fill="' + C.skin + '"/><path d="M174 115 Q170 118 173 123" stroke="' + C.skinDeep + '" stroke-width="1.4" fill="none" stroke-linecap="round"/>',
      '<circle cx="68.5" cy="129" r="2.2" fill="' + C.gold + '"/><path d="M68.5 131 Q65 136 68.5 139.5 Q72 136 68.5 131Z" fill="' + C.nar + '"/>',
      '<circle cx="171.5" cy="129" r="2.2" fill="' + C.gold + '"/><path d="M171.5 131 Q168 136 171.5 139.5 Q175 136 171.5 131Z" fill="' + C.nar + '"/>');
    /* face */
    S.push('<path d="M68 110 C68 74 92 58 120 58 C148 58 172 74 172 110 C172 142 150 165 120 165 C90 165 68 142 68 110Z" fill="url(#' + u + 'skin)"/>');
    /* face features (parallax group) */
    S.push('<g class="nz-g nz-face">');
    S.push('<ellipse class="nz-cheek" cx="84.5" cy="136" rx="11" ry="7" fill="url(#' + u + 'blush)"/>',
      '<ellipse class="nz-cheek" cx="155.5" cy="136" rx="11" ry="7" fill="url(#' + u + 'blush)"/>');
    S.push('<g class="nz-eyes-open nz-eyeset">', eye(u, 'L', 99, 116, -1), eye(u, 'R', 141, 116, 1), '</g>');
    S.push('<g class="nz-eyes-happy" stroke="' + C.lash + '" stroke-width="3.6" fill="none" stroke-linecap="round">',
      '<path d="M88 120 Q99 105 110 120"/><path d="M130 120 Q141 105 152 120"/></g>');
    S.push('<g class="nz-eyes-closed" stroke="' + C.lash + '" stroke-width="3.2" fill="none" stroke-linecap="round">',
      '<path d="M88 117 Q99 126 110 117"/><path d="M130 117 Q141 126 152 117"/>',
      '<path d="M88.5 117 L85 114.5 M151.5 117 L155 114.5" stroke-width="2.2"/></g>');
    S.push('<path class="nz-brow" data-side="L" d="M89 96 Q99 90.5 109 94" fill="none" stroke="' + C.brow + '" stroke-width="3.4" stroke-linecap="round"/>',
      '<path class="nz-brow" data-side="R" d="M131 94 Q141 90.5 151 96" fill="none" stroke="' + C.brow + '" stroke-width="3.4" stroke-linecap="round"/>');
    S.push('<path d="M117 129.5 Q120 132.5 123 129.5" fill="none" stroke="' + C.skinDeep + '" stroke-width="2" stroke-linecap="round"/>');
    S.push(mouths(u));
    S.push('</g>'); /* /face */
    /* fringe, side locks, headband */
    S.push('<g class="nz-g nz-fringe">');
    S.push('<path d="M66 113 C63 70 90 49 120 49 C150 49 177 70 174 113 C171 101 165 92 157 86 C156 96 148 101 139 99 C143 91 141 85 137 80 C129 92 113 99 96 97 C100 91 102 87 102 82 C92 88 80 99 66 113Z" fill="url(#' + u + 'hair)"/>',
      '<path d="M66.5 104 C61 122 63 142 72.5 153 C72 138 73.5 120 78.5 106Z" fill="' + C.hair + '"/>',
      '<path d="M173.5 104 C179 122 177 142 167.5 153 C168 138 166.5 120 161.5 106Z" fill="' + C.hair + '"/>',
      '<path d="M80 74 C90 60 106 54 124 54 C110 57 96 63 86 76 Q82 79 80 74Z" fill="#fff" opacity=".16"/>',
      '<path d="M104 84 Q112 74 118 62 M140 82 Q138 72 132 62 M156 87 Q156 78 152 70" fill="none" stroke="#120A07" stroke-opacity=".35" stroke-width="1.3" stroke-linecap="round"/>');
    /* headband with gold dots + rosette */
    S.push('<path d="M70.5 99 Q120 40 169.5 99" fill="none" stroke="' + C.narDk + '" stroke-width="10.5" stroke-linecap="round"/>',
      '<path d="M70.5 98 Q120 39 169.5 98" fill="none" stroke="' + C.nar + '" stroke-width="8.5" stroke-linecap="round"/>',
      '<path d="M73 95 Q120 41.5 167 95" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="1.4" stroke-linecap="round"/>');
    var P0 = [70.5, 98], PC = [120, 39], P2 = [169.5, 98];
    for (var i = 1; i < 8; i++) {
      var t = i / 8; if (i === 4) continue;
      var p = qpt(P0, PC, P2, t);
      S.push('<circle cx="' + f2(p[0]) + '" cy="' + f2(p[1]) + '" r="' + (i % 2 ? 2.1 : 1.6) + '" fill="' + C.goldHi + '"/>');
    }
    var top = qpt(P0, PC, P2, 0.5);
    S.push('<polygon points="' + star8(top[0], top[1], 6.6, 4.4) + '" fill="url(#' + u + 'gold)" stroke="' + C.goldDk + '" stroke-width=".6"/>',
      '<circle cx="' + f2(top[0]) + '" cy="' + f2(top[1]) + '" r="2" fill="' + C.nar + '"/>');
    S.push('</g>'); /* /fringe */
    S.push('</g></g>'); /* /head */

    /* --- extras --- */
    S.push('<g class="nz-xtra nz-think"><circle cx="180" cy="74" r="4" fill="' + C.ivory + '" stroke="' + C.gold + '" stroke-width="1.6"/>',
      '<circle cx="193" cy="57" r="6" fill="' + C.ivory + '" stroke="' + C.gold + '" stroke-width="1.6"/>',
      '<circle cx="209" cy="35" r="9" fill="' + C.ivory + '" stroke="' + C.gold + '" stroke-width="1.8"/></g>');
    S.push('<g class="nz-xtra nz-sweat"><path class="nz-g" d="M168 80 Q175 92 168 97.5 Q161 92 168 80Z" fill="#9CCCF2" stroke="#5B9BD5" stroke-width="1"/></g>');
    S.push('<g class="nz-xtra nz-zzz"><text x="170" y="70" font-size="16">z</text><text x="184" y="50" font-size="21">z</text><text x="199" y="28" font-size="27">Z</text></g>');
    S.push('<g class="nz-xtra nz-sparks" fill="' + C.gold + '"><path d="' + spark(44, 92, 9) + '"/><path d="' + spark(200, 120, 7) + '"/><path d="' + spark(56, 176, 6) + '"/><path d="' + spark(194, 52, 8) + '" fill="' + C.nar + '"/></g>');
    S.push('<g class="nz-xtra nz-shock" stroke="' + C.nar + '" stroke-width="3" stroke-linecap="round" fill="none"><path d="M172 54 L181 41"/><path d="M181 64 L194 58"/><path d="M162 46 L164 32"/></g>');
    S.push('<path class="nz-heart" d="M150 52 C150 46 157 44 159.5 49 C162 44 169 46 169 52 C169 58 162 62 159.5 65 C157 62 150 58 150 52Z" fill="' + C.nar + '"/>');

    S.push('</g></g>'); /* /fig /flipg */
    if (dock) S.push('</g></g>');

    var vb = dock ? '56 60 128 140' : (size === 'mini' ? '20 20 200 280' : '0 0 240 300');
    return '<svg class="nz-svg" viewBox="' + vb + '" xmlns="' + SVGNS + '" aria-hidden="true" focusable="false">' + D.join('') + S.join('') + '</svg>';
  }

  function braidSeg(cx, cy, w, s) {
    var rot = 24 * s;
    var rx = w * 0.62, ry = w * 0.78;
    return '<g transform="rotate(' + rot + ' ' + cx + ' ' + cy + ')">' +
      '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + f2(rx) + '" ry="' + f2(ry) + '" fill="url(#' + curU + 'hair)" stroke="#140B08" stroke-opacity=".45" stroke-width=".9"/>' +
      '<path d="M' + f2(cx - rx * 0.35) + ' ' + f2(cy - ry * 0.55) + ' Q' + f2(cx - rx * 0.1) + ' ' + f2(cy - ry * 0.05) + ' ' + f2(cx - rx * 0.4) + ' ' + f2(cy + ry * 0.45) + '" fill="none" stroke="' + C.hairHi + '" stroke-opacity=".55" stroke-width="1.4" stroke-linecap="round"/></g>';
  }
  function hemRow() {
    var out = [];
    for (var x = 76; x <= 164; x += 11) {
      var t = (x - 60) / 120, y = 277 + 2 * t * (1 - t) * 9 - 0.5;
      out.push('<path d="M' + x + ' ' + f2(y - 4.2) + ' L' + (x + 3.6) + ' ' + f2(y) + ' L' + x + ' ' + f2(y + 4.2) + ' L' + (x - 3.6) + ' ' + f2(y) + 'Z" fill="' + C.gold + '"/>');
      if (x < 164) out.push('<circle cx="' + (x + 5.5) + '" cy="' + f2(y + 0.2) + '" r="1.1" fill="' + C.ivory + '" opacity=".85"/>');
    }
    return out.join('');
  }
  function eye(u, side, cx, cy, s) {
    var lash = side === 'L'
      ? 'M86.6 113 Q87.6 100.8 99 100.4 Q110.4 100.8 111.6 111.5'
      : 'M153.4 113 Q152.4 100.8 141 100.4 Q129.6 100.8 128.4 111.5';
    var flick = side === 'L' ? 'M87.6 108 L83.2 104.2' : 'M152.4 108 L156.8 104.2';
    return '<g class="nz-g nz-eye" style="transform-origin:' + cx + 'px ' + cy + 'px">' +
      '<ellipse cx="' + cx + '" cy="' + cy + '" rx="12.5" ry="14.5" fill="#fff"/>' +
      '<g clip-path="url(#' + u + 'eye' + side + ')">' +
      '<ellipse cx="' + cx + '" cy="' + (cy - 9) + '" rx="13" ry="7" fill="#D9C9DD" opacity=".35"/>' +
      '<g class="nz-g nz-iris">' +
      '<circle cx="' + cx + '" cy="' + (cy + 1.5) + '" r="9.8" fill="url(#' + u + 'iris)"/>' +
      '<circle class="nz-g nz-pupil" style="transform-origin:' + cx + 'px ' + (cy + 1.5) + 'px" cx="' + cx + '" cy="' + (cy + 1.5) + '" r="5.2" fill="' + C.pupil + '"/>' +
      '<circle cx="' + (cx + 3.6) + '" cy="' + (cy - 2.4) + '" r="3.5" fill="#fff"/>' +
      '<circle cx="' + (cx - 3.4) + '" cy="' + (cy + 5.6) + '" r="1.6" fill="#fff" opacity=".85"/>' +
      '</g>' +
      '<rect class="nz-g nz-lid" style="transform-origin:' + cx + 'px ' + (cy - 15) + 'px" x="' + (cx - 14) + '" y="' + (cy - 15) + '" width="28" height="30.5" fill="' + C.lid + '"/>' +
      '</g>' +
      '<path d="' + lash + '" fill="none" stroke="' + C.lash + '" stroke-width="3.3" stroke-linecap="round"/>' +
      '<path d="' + flick + '" stroke="' + C.lash + '" stroke-width="2.6" stroke-linecap="round"/>' +
      '<path d="M' + (cx - 7) + ' ' + (cy + 15.6) + ' Q' + cx + ' ' + (cy + 18) + ' ' + (cx + 7) + ' ' + (cy + 15.6) + '" fill="none" stroke="' + C.skinDeep + '" stroke-opacity=".5" stroke-width="1.2" stroke-linecap="round"/>' +
      '</g>';
  }
  function mouths(u) {
    var st = ' fill="none" stroke="' + C.mouth + '" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"';
    return [
      '<path class="nz-m nz-m-smile" d="M110 143 Q120 152.5 130 143"' + st + '/>',
      '<g class="nz-m nz-m-open"><path d="M108 141 Q120 143.5 132 141 Q131 157.5 120 158.5 Q109 157.5 108 141Z" fill="' + C.mouth + '"/>',
      '<g clip-path="url(#' + u + 'mOpen)"><ellipse cx="120" cy="157" rx="8" ry="5" fill="' + C.tongue + '"/><path d="M108 140 Q120 143 132 140 L132 145 Q120 147.5 108 145Z" fill="#fff"/></g></g>',
      '<g class="nz-m nz-m-o"><ellipse cx="120" cy="148" rx="4.6" ry="5.8" fill="' + C.mouth + '"/><ellipse cx="120" cy="151.5" rx="3" ry="1.8" fill="' + C.tongue + '"/></g>',
      '<path class="nz-m nz-m-small" d="M114.5 146 Q120 149.5 125.5 146"' + st + '/>',
      '<g class="nz-m nz-m-tongue"><path d="M124 147.2 Q126.5 153.5 130 148.4 Q128.5 146.5 124 147.2Z" fill="' + C.tongue + '"/><path d="M113.5 145.5 Q120 149 127.5 146"' + st + '/></g>',
      '<path class="nz-m nz-m-worry" d="M111 149 Q115.5 145 120 148 Q124.5 151 129 147"' + st + '/>',
      '<path class="nz-m nz-m-sad" d="M112 151 Q120 143.5 128 151"' + st + '/>',
      '<path class="nz-m nz-m-hmm" d="M114 147.5 Q119 145.5 127 146.5"' + st + '/>',
      '<g class="nz-m nz-m-grin"><path d="M108.5 142 Q120 145 131.5 142 Q130 153 120 153.5 Q110 153 108.5 142Z" fill="' + C.mouth + '"/>',
      '<g clip-path="url(#' + u + 'mGrin)"><path d="M108 141 Q120 144 132 141 L132 147 Q120 149.5 108 147Z" fill="#fff"/></g></g>',
      '<g class="nz-m nz-m-sleep"><ellipse cx="121" cy="148" rx="2.6" ry="3.2" fill="' + C.mouth + '"/></g>',
      '<g class="nz-m nz-m-talk"><path d="M112.5 144 Q120 145.5 127.5 144 Q126.5 152.5 120 153 Q113.5 152.5 112.5 144Z" fill="' + C.mouth + '"/><ellipse cx="120" cy="151.5" rx="4" ry="2" fill="' + C.tongue + '"/></g>'
    ].join('');
  }
  /* flame halo around the figure: symmetric crown of tongues with concave sides */
  function flamePath(cx, cy, rx, ry, n, k) {
    var V = [], T = [], i, a;
    for (i = 0; i <= n; i++) {
      a = Math.PI + Math.PI * (i / n);
      V.push([cx + rx * k * Math.cos(a), cy + ry * k * Math.sin(a)]);
    }
    for (i = 0; i < n; i++) {
      a = Math.PI + Math.PI * ((i + 0.5) / n);
      var lean = Math.cos(a) * 6;
      T.push([cx + rx * Math.cos(a) + lean, cy + ry * Math.sin(a)]);
    }
    var d = 'M' + f2(V[0][0]) + ' 294 L' + f2(V[0][0]) + ' ' + f2(V[0][1]);
    for (i = 0; i < n; i++) {
      var v0 = V[i], t = T[i], v1 = V[i + 1];
      d += ' Q' + f2(v0[0]) + ' ' + f2((v0[1] + t[1]) / 2) + ' ' + f2(t[0]) + ' ' + f2(t[1]);
      d += ' Q' + f2(v1[0]) + ' ' + f2((v1[1] + t[1]) / 2) + ' ' + f2(v1[0]) + ' ' + f2(v1[1]);
    }
    d += ' L' + f2(V[n][0]) + ' 294 Q' + cx + ' 300 ' + f2(V[0][0]) + ' 294Z';
    return d;
  }

  /* ---------- expression + pose tables ---------- */
  var BROWS = {
    idle: ['M89 96 Q99 90.5 109 94', 'M131 94 Q141 90.5 151 96'],
    up: ['M89 92.5 Q99 85.5 109 90.5', 'M131 90.5 Q141 85.5 151 92.5'],
    high: ['M89 89 Q99 81.5 109 86.5', 'M131 86.5 Q141 81.5 151 89'],
    think: ['M89 95 Q99 90 109 94', 'M131 89.5 Q141 84.5 151 91'],
    focus: ['M90 96.5 Q100 93 109 95.5', 'M131 95.5 Q140 93 150 96.5'],
    worried: ['M89 96.5 Q100 95.5 109 89.5', 'M131 89.5 Q140 95.5 151 96.5'],
    sad: ['M89 98 Q100 96 109 91', 'M131 91 Q140 96 151 98'],
    determined: ['M90 91.5 Q100 93 110 97.5', 'M130 97.5 Q140 93 150 91.5'],
    calm: ['M89 97.5 Q99 94 109 96.5', 'M131 96.5 Q141 94 151 97.5']
  };
  /* arm poses: r = right (quill) arm, l = left (scroll) arm — shoulder / elbow / hand rotations */
  var POSES = {
    rest: [0, 0, 0, 0, 0, 0],
    wave: [-100, -82, 200, 0, 0, 0],
    think: [-14, -150, 112, 0, 0, 0],
    write: [30, 56, -78, -10, -22, 8],
    read: [26, 52, -40, -12, -42, 30],
    cheer: [-64, -62, 110, 8, -12, 0],
    celebrate: [-112, -64, 160, 112, 66, -150],
    streak: [-74, -104, 166, 0, 0, 0],
    worried: [22, 92, -96, -10, -48, 30],
    sad: [6, 8, 6, 4, -4, 0],
    surprised: [-40, -40, 70, 34, 30, -40],
    point: [-96, -26, 150, 0, 0, 0]
  };
  var STATES = {
    idle: { mouth: 'smile', brow: 'idle', eyes: 'open', lid: 0, pose: 'rest', head: 'rotate(0deg)', ms: 0 },
    wave: { mouth: 'open', brow: 'up', eyes: 'open', lid: 0, pose: 'wave', head: 'rotate(-3deg)', ms: 2600, blush: 1 },
    think: { mouth: 'hmm', brow: 'think', eyes: 'open', lid: 0.18, pose: 'think', head: 'rotate(-7deg)', ms: 0, gaze: [-0.75, -0.95], safety: 25000 },
    write: { mouth: 'tongue', brow: 'focus', eyes: 'open', lid: 0.38, pose: 'write', head: 'translateY(3px) rotate(2deg)', ms: 0, gaze: [-0.1, 1], safety: 25000 },
    read: { mouth: 'small', brow: 'idle', eyes: 'open', lid: 0.36, pose: 'read', head: 'translateY(3px) rotate(-2deg)', ms: 0, gaze: [-0.2, 1], safety: 25000 },
    success: { mouth: 'open', brow: 'up', eyes: 'open', lid: 0, pose: 'cheer', head: 'rotate(-3deg)', ms: 2400, blush: 1, fx: 'stars' },
    celebrate: { mouth: 'open', brow: 'up', eyes: 'happy', lid: 0, pose: 'celebrate', head: 'rotate(0deg)', ms: 3200, blush: 1, fx: 'confetti' },
    streak: { mouth: 'grin', brow: 'determined', eyes: 'open', lid: 0.16, pose: 'streak', head: 'rotate(-2deg)', ms: 3400 },
    worried: { mouth: 'worry', brow: 'worried', eyes: 'open', lid: 0.08, pose: 'worried', head: 'rotate(4deg)', ms: 3600, gaze: [0.8, 0.15] },
    sad: { mouth: 'sad', brow: 'sad', eyes: 'open', lid: 0.34, pose: 'sad', head: 'translateY(3px) rotate(5deg)', ms: 3600, gaze: [0.1, 0.85] },
    sleep: { mouth: 'sleep', brow: 'calm', eyes: 'closed', lid: 1, pose: 'rest', head: 'rotate(5deg)', ms: 0 },
    surprised: { mouth: 'o', brow: 'high', eyes: 'wide', lid: 0, pose: 'surprised', head: 'translateY(-2px)', ms: 1600 },
    point: { mouth: 'smile', brow: 'up', eyes: 'open', lid: 0, pose: 'point', head: 'rotate(-3deg)', ms: 3000, gaze: [0.95, -0.2] }
  };
  var STATE_NAMES = Object.keys(STATES);

  /* head anchor in root-relative fractions per size (viewBox mapping) */
  var ANCHOR = {
    full: { cx: 0.5, cy: 0.373, top: 0.1, l: 0.27, r: 0.73 },
    mini: { cx: 0.5, cy: 0.33, top: 0.04, l: 0.24, r: 0.76 },
    dock: { cx: 0.5, cy: 0.52, top: 0.05, l: 0.12, r: 0.88 }
  };

  var LINES = {
    pet: ['Hi-hi, qıdığım gəlir!', 'Mənanı tutaq, sözlər özü gələcək.', 'Qələmim hazırdır!', 'Bu gün çox yaxşı işləyirsiniz.', 'Bir fincan çay, sonra davam?', 'Mən buradayam, tələsmirik.'],
    wake: ['Ah, oyandım! Davam edək?', 'Mürgüləmişəm… Buradayam!', 'Oyağam, oyağam! Nə edirik?'],
    idle: ['Bir məsləhətim var — mənə toxunun.', 'Terminləri lüğətə əlavə etsəniz, hər dəfə yadımda qalacaq.', 'Uzun cümləni ikiyə bölmək çox vaxt daha təbii oxunur.', '«Actual» — «faktiki», «aktual» deyil. Unutmayaq!']
  };
  var TIPS = {
    general: [
      { t: 'Üslubu özüm tanıyıram', d: 'Danışıq · Neytral · Rəsmi · Hüquqi', s: 'Mətni yapışdırın — üslubunu özüm təyin edirəm. Razı deyilsinizsə, bir toxunuşla dəyişin.' },
      { t: 'Rəngli alt xətlər', d: 'Seqment üzrə əminlik', s: 'Yaşıl — əminəm, sarı — bir baxın, qırmızı — şübhəliyəm. Yoxlamanı qırmızıdan başlayın.' },
      { t: 'Türkcə formalar', d: 'Dilçi Nənə nəzarət edir', s: '«değil», «şimdi», «için» yox — «deyil», «indi», «üçün». Belə formaları QA dərhal tutur.' },
      { t: 'Böyük iş — Məclis', d: 'Beş mirzə, beş addım', s: 'Bütöv sənəd və dərin yoxlama üçün Mirzə Məclisi toplaşır: terminlər, məna, üslub, yazılış və möhür.' },
      { t: 'Qısayol', d: 'Ctrl + Enter', s: 'Ctrl + Enter seqmenti təsdiqləyir və növbətisinə keçir. Alt + ↓ — tərcümə yaddaşından uyğunluğu qoyur.' }
    ],
    home: [{ t: 'Bu günün planı', d: '2 təhvil yaxınlaşır', s: 'Bu gün iki təhvil var. Əvvəl son tarixi yaxın olanı bitirək, sonra QA-ya baxarıq.' }],
    translate: [{ t: 'Situasiya kartı', d: 'Məqsəd, auditoriya, üslub', s: 'Kimə və nə üçün yazdığımızı bilsəm, tərcümə daha dəqiq olur. Situasiya kartını doldurun — 20 saniyə çəkir.' },
      { t: 'Aydınlaşdırıcı suallar', d: 'İkimənalı yerlər', s: 'Cümlə iki cür başa düşülə bilsə, təxmin etmirəm — sizdən soruşuram.' }],
    projects: [{ t: 'Təhvil paketi', d: 'DOCX · TMX · QA hesabatı', s: 'Layihə bitəndə təhvil paketində tərcümə, TMX və QA hesabatı birlikdə yığılır.' }],
    academy: [{ t: 'Gündəlik seriya', d: '10 dəqiqə kifayətdir', s: 'Hər gün qısa məşq — seriyanız sönməsin! Səhv kartlarınızı təkrarlamaq ən sürətli yoldur.' },
      { t: 'Rütbələr', d: 'Şagird → Ustad', s: 'Şagird, Katib, Münşi, Mirzə, Dilmanc, Ustad. Hər rütbə yeni dərslər və çətin mətnlər açır.' }],
    settings: [{ t: 'Məni tənzimləyin', d: 'Görünüş, ölçü, danışıq', s: 'Bu səhifədə məni gizlədə, ölçümü və nə qədər danışdığımı dəyişə bilərsiniz.' }]
  };

  /* ---------- shared input tracking ---------- */
  var INSTS = [];
  var lastPt = null, lastPtAt = 0, lastInteract = Date.now(), rafQ = false, listening = false;
  function onPtr(e) {
    var p = (e.touches && e.touches[0]) || e;
    if (!p || p.clientX == null) return;
    lastPt = { x: p.clientX, y: p.clientY }; lastPtAt = Date.now();
    if (!rafQ) {
      rafQ = true;
      requestAnimationFrame(function () { rafQ = false; for (var i = 0; i < INSTS.length; i++) INSTS[i]._track(); });
    }
  }
  function onAct() {
    lastInteract = Date.now();
    for (var i = 0; i < INSTS.length; i++) INSTS[i]._activity();
  }
  function listen() {
    if (listening) return; listening = true;
    window.addEventListener('pointermove', onPtr, { passive: true });
    window.addEventListener('pointerdown', onPtr, { passive: true });
    window.addEventListener('touchstart', onPtr, { passive: true });
    ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(function (ev) { window.addEventListener(ev, onAct, { passive: true }); });
    var reflowAll = function () { for (var i = 0; i < INSTS.length; i++) INSTS[i]._reflow(); };
    window.addEventListener('resize', reflowAll);
    window.addEventListener('load', reflowAll);
    try { if (document.fonts && document.fonts.ready) document.fonts.ready.then(reflowAll); } catch (e) { /* no font loading API */ }
  }

  function dockPx(sz) {
    if (typeof sz === 'number' && isFinite(sz)) return clamp(sz, 44, 96);
    var s = String(sz || '').toLowerCase();
    if (s === 'sm' || s === 'small' || s === 'kiçik' || s === 'mini' || s === 's') return 52;
    if (s === 'lg' || s === 'large' || s === 'böyük' || s === 'full' || s === 'l') return 78;
    return 64;
  }
  function currentScreen() {
    var h = (location.hash || '').replace(/^#\/?/, '').split(/[?/]/)[0];
    return h || 'home';
  }

  /* ---------- instance ---------- */
  function Inst(host, opts) {
    var self = this;
    opts = opts || {};
    var size = opts.size === 'dock' || opts.size === 'mini' ? opts.size : 'full';
    var u = 'nz' + (++uidSeq) + '-';
    this.size = size;
    this.cur = 'idle';
    this.timers = {};
    this.dead = false;
    this.gazeLock = null;
    this.autoSlept = false;
    this.lastChat = 0;
    this.flipped = false;

    var root = document.createElement('div');
    root.className = 'nz';
    root.setAttribute('data-size', size);
    if (opts.width) root.style.setProperty('--nz-w', typeof opts.width === 'number' ? opts.width + 'px' : opts.width);
    var label = size === 'dock' ? 'Nuanza — köməkçi. Məsləhətləri aç' : (opts.label || 'Nuanza — köməkçi qız. Toxunun');
    root.innerHTML =
      '<div class="nz-bubble" aria-hidden="true" style="display:none"><span class="nz-btx"></span></div>' +
      '<span class="nz-sr" role="status" aria-live="polite"></span>' +
      '<button class="nz-hit" type="button" aria-label="' + esc(label) + '">' + buildSVG(u, size) + '</button>' +
      (size === 'dock' ? '<span class="nz-dot" aria-hidden="true"></span>' : '');
    this.root = this.el = root;
    this.bubble = root.querySelector('.nz-bubble');
    this.btx = root.querySelector('.nz-btx');
    this.sr = root.querySelector('.nz-sr');
    this.hit = root.querySelector('.nz-hit');
    this.svg = root.querySelector('svg');
    this.dot = root.querySelector('.nz-dot');
    this.irises = root.querySelectorAll('.nz-iris');
    this.face = root.querySelector('.nz-face');
    this.fringe = root.querySelector('.nz-fringe');
    this.brows = root.querySelectorAll('.nz-brow');
    if (opts.interactive === false) { this.hit.tabIndex = -1; this.hit.setAttribute('aria-hidden', 'true'); this.hit.style.cursor = 'default'; }

    this.hit.addEventListener('click', function (e) {
      if (opts.interactive === false) return;
      e.stopPropagation();
      if (size === 'dock') self.openMenu(); else self.react('pet');
    });

    if (host) host.appendChild(root);
    this._calmCheck();
    this._apply('idle');
    if (size === 'dock') this._applyCfg();
    INSTS.push(this);
    listen();
    this._blinkLoop();
    this._idleLoop();
    if (size === 'dock') this.timers.cfg = setInterval(function () { self._applyCfg(); }, 1500);
    if (opts.state && STATES[opts.state]) this.set(opts.state, { say: opts.say, ms: opts.ms });
    else if (opts.say) this.say(opts.say, opts.ms);
  }

  Inst.prototype._calmCheck = function () {
    var r = reduced();
    this.root.classList.toggle('nz-calm', r);
    this.root.style.setProperty('--nz-tempo', String(tempo()));
    return r;
  };

  Inst.prototype._apply = function (state) {
    var d = STATES[state], root = this.root, p = POSES[d.pose] || POSES.rest;
    root.setAttribute('data-mouth', d.mouth);
    root.setAttribute('data-eyes', d.eyes || 'open');
    var vars = ['--r1', '--r2', '--r3', '--l1', '--l2', '--l3'];
    for (var i = 0; i < 6; i++) root.style.setProperty(vars[i], p[i] + 'deg');
    root.style.setProperty('--lid', d.lid || 0);
    root.style.setProperty('--head', d.head || 'rotate(0deg)');
    this._brow(d.brow);
    root.classList.toggle('nz-blushing', !!d.blush);
  };

  Inst.prototype._brow = function (name) {
    var b = BROWS[name] || BROWS.idle;
    for (var i = 0; i < this.brows.length; i++) {
      var dd = b[this.brows[i].getAttribute('data-side') === 'L' ? 0 : 1];
      this.brows[i].setAttribute('d', dd);
      try { this.brows[i].style.d = 'path("' + dd + '")'; } catch (e) { /* d not supported as CSS */ }
    }
  };

  Inst.prototype.set = function (state, o) {
    if (this.dead) return this;
    if (typeof o === 'string') o = { say: o };
    o = o || {};
    if (!STATES[state]) state = 'idle';
    var self = this, d = STATES[state], root = this.root;
    clearTimeout(this.timers.state);
    if (state !== 'sleep') this.autoSlept = false;
    root.classList.remove('nz-s-' + this.cur);
    if (state === this.cur) void root.getBoundingClientRect(); /* restart one-shot animations */
    this.cur = state;
    root.classList.add('nz-s-' + state);
    this._apply(state);
    var calm = this._calmCheck();

    /* point toward the content: mirror when she stands on the right half */
    var flip = false;
    if (state === 'point') {
      var r = root.getBoundingClientRect(), vw = document.documentElement.clientWidth || window.innerWidth;
      flip = (r.left + r.width / 2) > vw * 0.55;
    }
    this.flipped = flip;
    root.classList.toggle('nz-flip', flip);

    this.gazeLock = d.gaze ? d.gaze.slice() : null;
    if (state === 'sleep') this.gazeLock = [0, 0.4];
    this._gaze(this.gazeLock ? this.gazeLock[0] : 0, this.gazeLock ? this.gazeLock[1] : 0.1);
    if (!this.gazeLock) this._track();

    if (d.fx && !calm && window.NuanzaFX) {
      this.timers.fx = setTimeout(function () {
        if (self.dead || self.cur !== state || !root.isConnected) return;
        var rr = self.svg.getBoundingClientRect();
        if (!rr.width) return;
        var a = ANCHOR[self.size];
        var big = self.size === 'full';
        window.NuanzaFX.burst(rr.left + rr.width / 2, rr.top + rr.height * (self.size === 'dock' ? 0.12 : a.top), d.fx,
          { count: big ? null : (d.fx === 'confetti' ? 34 : 10), spread: big ? 1 : 0.6 });
      }, state === 'success' || state === 'celebrate' ? 260 : 120);
    }
    if (o.say) this.say(o.say, o.sayMs);
    var ms = o.ms != null ? o.ms : (d.ms || d.safety || 0);
    if (o.ms === 0) ms = 0;
    if (ms > 0 && state !== 'idle') {
      this.timers.state = setTimeout(function () { if (!self.dead && self.cur === state) self.set('idle'); }, ms);
    }
    return this;
  };

  Inst.prototype.state = function () { return this.cur; };

  /* ---------- speech bubble ---------- */
  Inst.prototype.say = function (text, ms) {
    if (this.dead) return this;
    var self = this, b = this.bubble;
    clearTimeout(this.timers.bub); cancelAnimationFrame(this.timers.type); clearInterval(this.timers.talk);
    if (text == null || text === '') { this.hideBubble(); return this; }
    text = String(text);
    this.sr.textContent = '';
    this.sr.textContent = 'Nuanza: ' + text;
    if (this.dot) this.dot.classList.remove('on');
    var calm = this._calmCheck();
    /* full text reserved invisibly so the bubble keeps its final size while typing */
    this.btx.innerHTML = '<span class="nz-typed"></span><span class="nz-rest" style="visibility:hidden"></span>';
    var typed = this.btx.firstChild, rest = this.btx.lastChild;
    clearTimeout(this.timers.bubOff);
    b.style.display = '';
    typed.textContent = calm ? text : '';
    rest.textContent = calm ? '' : text;
    if (!b.classList.contains('on')) {
      /* measure + place before the entrance transition so it grows from the right spot */
      b.classList.add('on'); this._place(); b.classList.remove('on');
      void b.offsetWidth;
    }
    b.classList.add('on');
    this._place();
    if (!calm) {
      var per = clamp(900 / Math.max(text.length, 1), 9, 22), t0 = performance.now();
      var base = this.root.getAttribute('data-mouth');
      var flap = false;
      this.timers.talk = setInterval(function () {
        flap = !flap;
        if (self.cur === 'sleep') return;
        self.root.setAttribute('data-mouth', flap ? 'talk' : base);
      }, 95);
      var step = function (now) {
        var n = Math.min(text.length, Math.floor((now - t0) / per) + 1);
        typed.textContent = text.slice(0, n);
        rest.textContent = text.slice(n);
        if (n < text.length && !self.dead) self.timers.type = requestAnimationFrame(step);
        else { clearInterval(self.timers.talk); self.root.setAttribute('data-mouth', STATES[self.cur].mouth); }
      };
      this.timers.type = requestAnimationFrame(step);
    }
    var dur = ms != null ? ms : clamp(2400 + text.length * 48, 2800, 8000);
    if (dur > 0) this.timers.bub = setTimeout(function () { self.hideBubble(); }, dur);
    return this;
  };

  Inst.prototype.hideBubble = function () {
    clearTimeout(this.timers.bub); cancelAnimationFrame(this.timers.type); clearInterval(this.timers.talk);
    if (STATES[this.cur]) this.root.setAttribute('data-mouth', STATES[this.cur].mouth);
    var b = this.bubble;
    if (!b.classList.contains('on')) return;
    b.classList.remove('on');
    clearTimeout(this.timers.bubOff);
    /* take it out of layout once faded so a hidden bubble never widens the page */
    this.timers.bubOff = setTimeout(function () { if (!b.classList.contains('on')) b.style.display = 'none'; }, 320);
  };

  /* place the bubble beside / above her head and keep it inside the viewport (flips when needed) */
  Inst.prototype._place = function () {
    var b = this.bubble, root = this.root;
    if (!b.classList.contains('on')) return;
    var rr = root.getBoundingClientRect();
    var vw = document.documentElement.clientWidth || window.innerWidth, vh = window.innerHeight, m = 8;
    var W = rr.width, H = rr.height, a = ANCHOR[this.size];
    b.style.maxWidth = Math.min(244, vw - 2 * m) + 'px';
    var order = this.size === 'dock' ? ['top', 'left', 'bottom'] :
      this.size === 'mini' ? ['top', 'right', 'left', 'bottom'] : ['right', 'left', 'top', 'bottom'];
    var bw, bh, best = null;
    for (var i = 0; i < order.length; i++) {
      var p = order[i];
      b.className = 'nz-bubble on p-' + p;
      b.style.left = '0px'; b.style.top = '0px';
      bw = b.offsetWidth; bh = b.offsetHeight;
      var x, y;
      if (p === 'top') {
        x = this.size === 'dock' ? W - bw + 4 : W * a.cx - bw / 2;
        y = H * a.top - bh - 12;
      } else if (p === 'bottom') {
        x = W * a.cx - bw / 2; y = H + 10;
      } else if (p === 'right') {
        x = W * a.r + 10; y = H * a.cy - 40;
      } else {
        x = W * a.l - bw - 10; y = this.size === 'dock' ? H * 0.1 - bh / 2 : H * a.cy - 40;
      }
      var ax = rr.left + x, ay = rr.top + y;
      var fits = ax >= m && ax + bw <= vw - m && ay >= m && ay + bh <= vh - m;
      /* above the head may slide down onto the hair a little rather than jump below her feet */
      if (!fits && p === 'top' && this.size !== 'dock' && ax >= m && ax + bw <= vw - m && ay < m && (m - ay) <= H * 0.16) {
        y += m - ay; fits = true;
      }
      var cand = { p: p, x: x, y: y, fits: fits };
      if (!best) best = cand;
      if (fits) { best = cand; break; }
    }
    /* clamp the chosen placement into the viewport */
    var p2 = best.p, fx = best.x, fy = best.y;
    b.className = 'nz-bubble on p-' + p2;
    bw = b.offsetWidth; bh = b.offsetHeight;
    var absX = rr.left + fx, absY = rr.top + fy;
    if (absX < m) fx += m - absX;
    if (absX + bw > vw - m) fx -= (absX + bw) - (vw - m);
    absY = rr.top + fy;
    if (p2 === 'left' || p2 === 'right') {
      if (absY < m) fy += m - absY;
      if (absY + bh > vh - m) fy -= (absY + bh) - (vh - m);
    } else if (p2 === 'top' && absY < m && rr.top + H + 10 + bh <= vh - m) {
      p2 = 'bottom'; fy = H + 10; b.className = 'nz-bubble on p-bottom';
    }
    b.style.left = Math.round(fx) + 'px';
    b.style.top = Math.round(fy) + 'px';
    var anchorX = this.size === 'dock' ? W * 0.5 : W * a.cx;
    b.style.setProperty('--tail', clamp(anchorX - fx, 18, bw - 18) + 'px');
    b.style.setProperty('--tailY', clamp(H * a.cy - 12 - fy, 16, bh - 16) + 'px');
    b.style.setProperty('--bo', p2 === 'top' ? clamp(anchorX - fx, 18, bw - 18) + 'px 100%' :
      p2 === 'bottom' ? clamp(anchorX - fx, 18, bw - 18) + 'px 0%' : p2 === 'right' ? '0% 50%' : '100% 50%');
  };

  Inst.prototype._reflow = function () { if (this.bubble.classList.contains('on')) this._place(); };

  /* ---------- eyes ---------- */
  Inst.prototype._gaze = function (gx, gy) {
    gx = clamp(gx, -1, 1); gy = clamp(gy, -1, 1);
    if (this.flipped) gx = -gx;
    var t = 'translate(' + f2(gx * 4.2) + 'px,' + f2(gy * 3.6) + 'px)';
    for (var i = 0; i < this.irises.length; i++) this.irises[i].style.transform = t;
    this.face.style.transform = 'translate(' + f2(gx * 2.6) + 'px,' + f2(gy * 1.8) + 'px)';
    this.fringe.style.transform = 'translate(' + f2(gx * 1.1) + 'px,' + f2(gy * 0.7) + 'px)';
  };
  Inst.prototype._track = function () {
    if (this.dead || this.gazeLock || !lastPt || this.cur === 'sleep' || this.glancing) return;
    var r = this.svg.getBoundingClientRect();
    if (!r.width) return;
    var a = ANCHOR[this.size];
    var cx = r.left + r.width * a.cx, cy = r.top + r.height * a.cy;
    var dx = lastPt.x - cx, dy = lastPt.y - cy, dist = Math.hypot(dx, dy) || 1;
    var k = Math.min(1, dist / 180);
    this._gaze(dx / dist * k, dy / dist * k);
  };
  Inst.prototype._blinkLoop = function () {
    var self = this;
    this.timers.blink = setTimeout(function () {
      if (self.dead) return;
      if (!self.root.isConnected) { self.destroy(); return; }
      var e = self.root.getAttribute('data-eyes');
      if (self.cur !== 'sleep' && e !== 'closed' && e !== 'happy' && !document.hidden) {
        self._blink();
        if (Math.random() < 0.22) setTimeout(function () { self._blink(); }, 230);
      }
      self._blinkLoop();
    }, rnd(2200, 5600));
  };
  Inst.prototype._blink = function () {
    var root = this.root;
    root.classList.add('nz-blink');
    setTimeout(function () { root.classList.remove('nz-blink'); }, 120);
  };

  /* ---------- idle life: glances, quill twirls, stretches, sleepy dock ---------- */
  Inst.prototype._idleLoop = function () {
    var self = this;
    this.timers.idle = setTimeout(function () {
      if (self.dead) return;
      if (!self.root.isConnected) { self.destroy(); return; }
      var calm = self._calmCheck();
      if (self.cur === 'idle' && !document.hidden) {
        var since = Date.now() - lastInteract;
        if (self.size === 'dock' && since > 150000 && !calm) {
          self.set('sleep', { ms: 0 }); self.autoSlept = true;
        } else if (!calm) {
          var roll = Math.random();
          var pointerIdle = Date.now() - lastPtAt > 3500;
          if (roll < 0.3 || (pointerIdle && roll < 0.5)) self._glance();
          else if (roll < 0.48) self._flash('nz-twirl', 1000);
          else if (roll < 0.6) self._flash('nz-flick', 1250);
          else if (roll < 0.72) self._flash('nz-hum', 1850);
          else if (roll < 0.8) self._flash('nz-stretch', 1350);
          else if (roll < 0.9) { self.root.classList.add('nz-blushing'); self.root.setAttribute('data-mouth', 'open'); setTimeout(function () { if (self.cur === 'idle') { self.root.classList.remove('nz-blushing'); self.root.setAttribute('data-mouth', 'smile'); } }, 1400); }
          else if (self.size === 'dock' && chatty() && Date.now() - self.lastChat > 120000 && since > 20000 && !self.bubble.classList.contains('on')) {
            self.lastChat = Date.now();
            if (self.dot) self.dot.classList.add('on');
          }
        } else if (Math.random() < 0.4) self._glance();
      }
      self._idleLoop();
    }, rnd(5200, 9800) * tempo());
  };
  Inst.prototype._glance = function () {
    var self = this;
    if (this.gazeLock) return;
    clearTimeout(this.timers.glance);
    var spots = [[-0.9, -0.3], [0.9, -0.25], [-0.6, 0.6], [0.7, 0.55], [0, -0.8], [0.15, 0.2]];
    var s = pick(spots);
    this.glancing = true;
    this._gaze(s[0], s[1]);
    var back = function () { self.glancing = false; if (self.dead || self.gazeLock) return; self._gaze(0, 0.1); self._track(); };
    this.timers.glance = setTimeout(function () {
      if (self.dead) return;
      if (Math.random() < 0.5 && !self.gazeLock) { var s2 = pick(spots); self._gaze(s2[0], s2[1]); self.timers.glance = setTimeout(back, rnd(700, 1300)); }
      else back();
    }, rnd(900, 1800));
  };
  Inst.prototype._flash = function (cls, ms) {
    var root = this.root;
    root.classList.remove(cls); void root.getBoundingClientRect();
    root.classList.add(cls);
    clearTimeout(this.timers['f' + cls]);
    this.timers['f' + cls] = setTimeout(function () { root.classList.remove(cls); }, ms);
  };
  Inst.prototype._activity = function () {
    if (this.dead) return;
    if (this.autoSlept && this.cur === 'sleep') {
      var self = this;
      this.autoSlept = false;
      this.set('surprised');
      setTimeout(function () { if (!self.dead && self.cur === 'surprised') self.set('wave', chatty() ? { say: pick(LINES.wake) } : null); }, 650);
    }
  };

  /* ---------- reactions ---------- */
  Inst.prototype.react = function (kind) {
    if (this.dead) return this;
    var self = this;
    kind = kind || 'pet';
    if (this.cur === 'sleep') {
      this.autoSlept = false;
      this.set('surprised');
      setTimeout(function () { if (!self.dead) self.set('wave', { say: pick(LINES.wake) }); }, 650);
      return this;
    }
    if (kind === 'pet') {
      this._flash('nz-pet', 1150);
      this.root.classList.add('nz-blushing');
      clearTimeout(this.timers.blushOff);
      this.timers.blushOff = setTimeout(function () { if (!STATES[self.cur].blush) self.root.classList.remove('nz-blushing'); }, 1500);
      if (this.cur === 'idle') {
        this.root.setAttribute('data-mouth', 'open');
        this.root.setAttribute('data-eyes', 'happy');
        clearTimeout(this.timers.petFace);
        this.timers.petFace = setTimeout(function () { if (self.cur === 'idle') { self.root.setAttribute('data-mouth', 'smile'); self.root.setAttribute('data-eyes', 'open'); } }, 900);
      }
      var line = pick(LINES.pet);
      if (line === this._lastPet) line = pick(LINES.pet);
      this._lastPet = line;
      this.say(line, 2600);
    } else if (kind === 'hop') this._flash('nz-hopr', 650);
    else if (kind === 'nod') this._flash('nz-nod', 750);
    else if (kind === 'shake') this._flash('nz-shake', 650);
    else if (kind === 'twirl') this._flash('nz-twirl', 1000);
    return this;
  };

  /* ---------- dock: settings + tips menu ---------- */
  Inst.prototype._applyCfg = function () {
    var c = cfg();
    this.root.setAttribute('data-hidden', c.show === false ? '1' : '0');
    this.root.style.setProperty('--nz-dock', dockPx(c.size) + 'px');
    this._calmCheck();
  };

  Inst.prototype.openMenu = function () {
    var self = this, App = window.App;
    if (this.dot) this.dot.classList.remove('on');
    if (this.cur === 'sleep') { this.react('pet'); return; }
    if (!App || typeof App.sheet !== 'function' || typeof App.h !== 'function') {
      var tp = pick(TIPS.general); this.set('point', { say: tp.s }); return;
    }
    var h = App.h, scr = currentScreen();
    var tips = (TIPS[scr] || []).concat(TIPS.general).slice(0, 4);
    var hr = new Date().getHours();
    var greet = hr < 6 ? 'Gecəniz xeyrə qalsın' : hr < 12 ? 'Sabahınız xeyir' : hr < 18 ? 'Günortanız xeyir' : 'Axşamınız xeyir';
    var name = '';
    try { name = (App.profile && App.profile().name || '').split(' ')[0]; } catch (e) { name = ''; }
    var art = h('div', { class: 'nz-menu-art' });
    var ico = function (n) { try { return App.icon ? App.icon(n) : ''; } catch (e) { return ''; } };
    var sheet = null, mini = null;
    var close = function () { try { if (sheet) sheet.close(); } catch (e) { /* already closed */ } if (mini) mini.destroy(); mini = null; };
    var rows = tips.map(function (tp) {
      return h('button', {
        class: 'list-row', type: 'button',
        onclick: function () { close(); self.set('point', { say: tp.s, ms: 3200 }); }
      }, h('span', { class: 'ic gold', html: ico('sparkle') }),
        h('span', { class: 'tx' }, h('b', { text: tp.t }), h('small', { text: tp.d })),
        h('span', { class: 'end', html: ico('chevron') }));
    });
    var body = h('div', { class: 'nz-menu' },
      h('div', { class: 'nz-menu-hero' }, art,
        h('p', null, h('b', { text: greet + (name ? ', ' + name : '') + '!' }),
          h('small', { text: 'Mən Nuanzayam — tərcümədə köməkçiniz. Bu ekranda faydalı ola biləcək bir neçə şey:' }))),
      h('div', { class: 'list' }, rows));
    sheet = App.sheet({
      title: 'Nuanza məsləhət verir',
      body: body,
      actions: [
        { label: 'Gizlət', kind: 'ghost', onClick: function () { close(); self.hideDock(); } },
        { label: 'Köməkçi ayarları', kind: 'secondary', onClick: function () { close(); if (App.go) App.go('settings'); } }
      ]
    });
    mini = Nuanza.mount(art, { size: 'mini', width: 64, interactive: false });
    mini.set('wave', { ms: 1800 });
    this.set('wave', { ms: 1400 });
  };

  Inst.prototype.hideDock = function () {
    var c = cfg(); c.show = false;
    var s = store();
    try { if (s) s.set('companion', c); } catch (e) { /* storage blocked */ }
    this.root.setAttribute('data-hidden', '1');
    if (window.App && window.App.toast) window.App.toast('Nuanza gizləndi. Ayarlar › Köməkçi bölməsindən qaytara bilərsiniz.', 'info');
  };

  Inst.prototype.show = function () {
    var c = cfg(); c.show = true;
    var s = store();
    try { if (s) s.set('companion', c); } catch (e) { /* storage blocked */ }
    this.root.setAttribute('data-hidden', '0');
    this.set('wave', { say: 'Yenidən buradayam!' });
  };

  Inst.prototype.destroy = function () {
    if (this.dead) return;
    this.dead = true;
    for (var k in this.timers) { if (Object.prototype.hasOwnProperty.call(this.timers, k)) { clearTimeout(this.timers[k]); clearInterval(this.timers[k]); } }
    cancelAnimationFrame(this.timers.type);
    var i = INSTS.indexOf(this);
    if (i >= 0) INSTS.splice(i, 1);
    if (this.root.parentNode) this.root.parentNode.removeChild(this.root);
  };

  var Nuanza = {
    states: STATE_NAMES.slice(),
    tips: TIPS,
    mount: function (el, opts) {
      injectCSS();
      if (typeof el === 'string') el = document.querySelector(el);
      return new Inst(el || null, opts || {});
    },
    instances: function () { return INSTS.slice(); },
    applyConfig: function () { INSTS.forEach(function (x) { if (x.size === 'dock') x._applyCfg(); else x._calmCheck(); }); },
    config: cfg
  };

  /* =====================================================================
     NuanzaFX — one pointer-events:none canvas for bursts, XP and medals
     ===================================================================== */
  var NuanzaFX = (function () {
    var cv = null, ctx = null, dpr = 1, W = 0, H = 0;
    var parts = [], texts = [], medals = [], running = false, last = 0;

    function ensure() {
      if (cv && cv.isConnected && ctx) return true;
      if (!document.body) return false;
      cv = document.querySelector('canvas.fx-layer');
      if (!cv) {
        cv = document.createElement('canvas');
        cv.className = 'fx-layer';
        cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:100';
        document.body.appendChild(cv);
      }
      cv.setAttribute('aria-hidden', 'true');
      cv.style.pointerEvents = 'none';
      ctx = cv.getContext('2d');
      if (!ctx) return false;
      resize();
      return true;
    }
    function resize() {
      if (!cv || !ctx) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth; H = window.innerHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    window.addEventListener('resize', function () { if (cv) resize(); });

    function palette() {
      return {
        nar: tok('--nar', '#A3253A'), zaf: tok('--zafaran', '#C58B2A'), gold: tok('--gold-hi', '#F2D08A'),
        lac: tok('--lacquer', '#1E2A5A'), ok: tok('--ok', '#2E7D5B'), ivory: tok('--ivory', '#FFFDF8'),
        ink: tok('--ink', '#1B1F3B'), surface: tok('--surface', '#FFFDF8'), deep: tok('--deep', '#1E2A5A'),
        display: tok('--f-display', 'Georgia, serif'), body: tok('--f-body', 'system-ui, sans-serif')
      };
    }

    function start() {
      if (running) return;
      running = true; last = performance.now();
      requestAnimationFrame(frame);
    }
    function frame(now) {
      var dt = Math.min(50, now - last) / 16.667; last = now;
      ctx.clearRect(0, 0, W, H);
      var i;
      for (i = medals.length - 1; i >= 0; i--) { if (!drawMedal(medals[i], now)) medals.splice(i, 1); }
      for (i = parts.length - 1; i >= 0; i--) { if (!stepPart(parts[i], now, dt)) parts.splice(i, 1); }
      for (i = texts.length - 1; i >= 0; i--) { if (!drawText(texts[i], now)) texts.splice(i, 1); }
      if (parts.length || texts.length || medals.length) requestAnimationFrame(frame);
      else { ctx.clearRect(0, 0, W, H); running = false; }
    }

    /* ---- shapes ---- */
    function pathStar(c, r) {
      c.beginPath();
      for (var i = 0; i < 16; i++) {
        var a = -Math.PI / 2 + i * Math.PI / 8, rr = i % 2 ? r * 0.7 : r;
        if (i) c.lineTo(rr * Math.cos(a), rr * Math.sin(a)); else c.moveTo(rr * Math.cos(a), rr * Math.sin(a));
      }
      c.closePath();
    }
    function pathSpark(c, r) {
      var k = r * 0.26;
      c.beginPath(); c.moveTo(0, -r);
      c.quadraticCurveTo(k, -k, r, 0); c.quadraticCurveTo(k, k, 0, r);
      c.quadraticCurveTo(-k, k, -r, 0); c.quadraticCurveTo(-k, -k, 0, -r); c.closePath();
    }
    function pathDiamond(c, r) { c.beginPath(); c.moveTo(0, -r); c.lineTo(r * 0.68, 0); c.lineTo(0, r); c.lineTo(-r * 0.68, 0); c.closePath(); }
    function pathSeed(c, r) {
      c.beginPath(); c.moveTo(0, -r * 1.25);
      c.bezierCurveTo(r * 0.95, -r * 0.5, r, r * 0.65, 0, r);
      c.bezierCurveTo(-r, r * 0.65, -r * 0.95, -r * 0.5, 0, -r * 1.25); c.closePath();
    }

    function stepPart(p, now, dt) {
      var age = now - p.t0;
      if (age < 0) return true;
      if (age > p.life) return false;
      p.vx *= Math.pow(p.drag, dt); p.vy = p.vy * Math.pow(p.drag, dt) + p.g * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; p.ph += 0.18 * dt;
      var k = age / p.life;
      var alpha = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
      if (p.fadeIn) alpha *= Math.min(1, age / 160);
      var sc = p.grow ? 0.4 + Math.min(1, age / 220) * 0.6 : 1;
      ctx.save();
      ctx.globalAlpha = Math.max(0, alpha) * (p.a || 1);
      ctx.translate(p.x + (p.wob ? Math.sin(p.ph) * p.wob : 0), p.y);
      ctx.rotate(p.rot);
      if (p.shape === 'confetti') {
        ctx.scale(1, Math.cos(p.ph * 1.6));
        ctx.fillStyle = p.c; ctx.fillRect(-p.r * 0.5, -p.r, p.r, p.r * 2);
      } else if (p.shape === 'splat') {
        var rr = p.r * (0.6 + Math.min(1, age / 140) * 0.6);
        ctx.fillStyle = p.c; ctx.beginPath();
        for (var j = 0; j < 10; j++) {
          var aa = j / 10 * Math.PI * 2, q = rr * (j % 2 ? 0.72 : 1) * p.jag[j];
          if (j) ctx.lineTo(Math.cos(aa) * q, Math.sin(aa) * q); else ctx.moveTo(Math.cos(aa) * q, Math.sin(aa) * q);
        }
        ctx.closePath(); ctx.fill();
      } else {
        ctx.scale(sc, sc);
        if (p.shape === 'star') pathStar(ctx, p.r);
        else if (p.shape === 'spark') pathSpark(ctx, p.r);
        else if (p.shape === 'diamond') pathDiamond(ctx, p.r);
        else if (p.shape === 'seed') { ctx.rotate(Math.atan2(p.vy, p.vx) + Math.PI / 2 - p.rot); pathSeed(ctx, p.r); }
        else { ctx.beginPath(); ctx.arc(0, 0, p.r, 0, Math.PI * 2); }
        ctx.fillStyle = p.c; ctx.fill();
        if (p.stroke) { ctx.lineWidth = 1; ctx.strokeStyle = p.stroke; ctx.stroke(); }
        if (p.shape === 'seed' || p.shape === 'star') {
          ctx.globalAlpha *= 0.55; ctx.fillStyle = '#fff';
          ctx.beginPath(); ctx.arc(-p.r * 0.28, -p.r * 0.32, p.r * 0.22, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.restore();
      return true;
    }

    function add(o) {
      parts.push({
        x: o.x, y: o.y, vx: o.vx || 0, vy: o.vy || 0, g: o.g == null ? 0.15 : o.g, drag: o.drag || 0.97,
        rot: o.rot || 0, vr: o.vr || 0, ph: Math.random() * 6, wob: o.wob || 0,
        r: o.r || 5, c: o.c, stroke: o.stroke, a: o.a, shape: o.shape || 'star',
        life: o.life || 1000, t0: performance.now() + (o.delay || 0), grow: o.grow, fadeIn: o.fadeIn, jag: o.jag
      });
    }

    function burst(x, y, kind, opt) {
      if (!ensure()) return;
      opt = opt || {};
      kind = kind || 'stars';
      if (x == null || y == null) { x = W / 2; y = H / 2; }
      var P = palette(), calm = reduced(), i, a, sp;
      var spread = opt.spread || 1;
      var n = opt.count || { stars: 22, seeds: 26, diamonds: 22, ink: 18, confetti: 80 }[kind] || 20;
      if (calm) {
        /* reduced motion: a few still sparkles that simply fade */
        for (i = 0; i < 6; i++) {
          a = i / 6 * Math.PI * 2;
          add({ x: x + Math.cos(a) * 26 * spread, y: y + Math.sin(a) * 26 * spread, g: 0, shape: 'spark', r: 6, c: i % 2 ? P.zaf : P.nar, life: 700, fadeIn: true });
        }
        start(); return;
      }
      for (i = 0; i < n; i++) {
        a = Math.random() * Math.PI * 2;
        if (kind === 'stars') {
          sp = rnd(2.6, 7.2) * spread;
          add({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 2.2, g: 0.13, drag: 0.955, shape: i % 3 ? 'star' : 'spark',
            r: rnd(4, 8.5) * (0.7 + 0.3 * spread), c: [P.zaf, P.gold, P.nar, P.zaf][i % 4], vr: rnd(-0.18, 0.18), life: rnd(850, 1300), grow: true });
        } else if (kind === 'seeds') {
          a = -Math.PI / 2 + rnd(-1.25, 1.25);
          sp = rnd(4, 9) * spread;
          add({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 0.3, drag: 0.98, shape: 'seed', r: rnd(3.2, 5.2),
            c: ['#B3263A', '#D23B52', '#8A1A2C', '#E0506A'][i % 4], life: rnd(1000, 1500) });
        } else if (kind === 'diamonds') {
          sp = rnd(2.4, 7) * spread;
          add({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1.6, g: 0.1, drag: 0.96, shape: 'diamond', r: rnd(4, 7.5),
            c: [P.zaf, P.lac, P.nar, P.gold][i % 4], vr: rnd(-0.2, 0.2), life: rnd(900, 1400), grow: true });
        } else if (kind === 'ink') {
          sp = rnd(3, 10) * spread;
          add({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 0.2, drag: 0.9, shape: 'dot', r: rnd(1.6, 4.4),
            c: i % 4 ? P.nar : P.ink, life: rnd(450, 800) });
          if (i < 5) {
            var jag = []; for (var j = 0; j < 10; j++) jag.push(rnd(0.8, 1.15));
            var d0 = rnd(18, 46) * spread;
            add({ x: x + Math.cos(a) * d0, y: y + Math.sin(a) * d0, g: 0, shape: 'splat', r: rnd(3, 6.5), c: P.nar, a: 0.85, life: rnd(700, 1000), jag: jag, rot: rnd(0, 6) });
          }
        } else {
          a = -Math.PI / 2 + rnd(-1.15, 1.15);
          sp = rnd(6, 13) * spread;
          add({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 0.19, drag: 0.972, shape: 'confetti', r: rnd(4, 6.5),
            c: [P.nar, P.zaf, P.lac, P.ok, P.gold][i % 5], vr: rnd(-0.22, 0.22), wob: rnd(0.6, 2.2), life: rnd(1700, 2500), delay: rnd(0, 120) });
        }
      }
      start();
    }

    function xp(x, y, text) {
      if (!ensure()) return;
      if (x == null || y == null) { x = W / 2; y = H / 2; }
      texts.push({ x: x, y: y, text: String(text == null ? '+10 XP' : text), t0: performance.now(), life: 1400, calm: reduced() });
      if (!reduced()) {
        var P = palette();
        for (var i = 0; i < 7; i++) {
          var a = -Math.PI / 2 + rnd(-1.4, 1.4), sp = rnd(1.6, 4);
          add({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 0.06, drag: 0.95, shape: 'spark', r: rnd(3, 5.5), c: i % 2 ? P.zaf : P.gold, life: rnd(600, 900), grow: true });
        }
      }
      start();
    }
    function drawText(o, now) {
      var age = now - o.t0, k = age / o.life;
      if (k >= 1) return false;
      var P = palette();
      var e = 1 - Math.pow(1 - Math.min(1, k * 1.4), 3);
      var dy = o.calm ? 0 : -52 * e;
      var sc = o.calm ? 1 : (k < 0.12 ? 0.6 + k / 0.12 * 0.55 : k < 0.24 ? 1.15 - (k - 0.12) / 0.12 * 0.15 : 1);
      var al = k < 0.1 ? k / 0.1 : k > 0.65 ? 1 - (k - 0.65) / 0.35 : 1;
      ctx.save();
      ctx.globalAlpha = Math.max(0, al);
      ctx.translate(o.x, o.y + dy);
      ctx.scale(sc, sc);
      ctx.font = '700 22px ' + P.display;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      var w = ctx.measureText(o.text).width;
      ctx.translate(9, 0);
      ctx.lineJoin = 'round'; ctx.lineWidth = 5; ctx.strokeStyle = P.surface;
      ctx.strokeText(o.text, 0, 0);
      ctx.fillStyle = P.zaf; ctx.fillText(o.text, 0, 0);
      ctx.translate(-w / 2 - 14, 0);
      pathStar(ctx, 9); ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = P.nar; ctx.fill();
      ctx.beginPath(); ctx.arc(0, 0, 3.2, 0, Math.PI * 2); ctx.fillStyle = P.gold; ctx.fill();
      ctx.restore();
      return true;
    }

    /* ---- rank medal moment ---- */
    function medal(rankName) {
      return new Promise(function (resolve) {
        if (!ensure()) { resolve(); return; }
        var calm = reduced();
        var m = { name: String(rankName || 'Mirzə'), t0: performance.now(), life: calm ? 2200 : 3400, calm: calm, done: resolve, burst: false };
        medals.push(m);
        start();
      });
    }
    function ease(t) { return 1 - Math.pow(1 - t, 3); }
    function spring(t) { if (t >= 1) return 1; return 1 - Math.exp(-6 * t) * Math.cos(t * 11); }
    function drawMedal(m, now) {
      var age = now - m.t0, k = age / m.life;
      if (k >= 1) { if (m.done) m.done(); m.done = null; return false; }
      var P = palette();
      var cx = W / 2, cy = H * 0.42;
      var R = clamp(Math.min(W, H) * 0.17, 62, 112);
      var fadeOut = m.calm ? (k > 0.8 ? (1 - (k - 0.8) / 0.2) : 1) : (age > m.life - 520 ? (m.life - age) / 520 : 1);
      var fadeIn = Math.min(1, age / (m.calm ? 300 : 240));
      var A = Math.max(0, Math.min(fadeIn, fadeOut));
      if (!m.burst && !m.calm && age > 300) {
        m.burst = true;
        burst(cx, cy, 'confetti', { count: 70 });
        burst(cx, cy, 'stars', { count: 16, spread: 1.3 });
      }
      ctx.save();
      /* dim the page a little, then soft glow + rotating rays */
      ctx.globalAlpha = A * 0.55;
      ctx.fillStyle = tok('--scrim', 'rgba(16,19,42,.44)');
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = A * 0.9;
      var g = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 3.2);
      g.addColorStop(0, 'rgba(242,208,138,.55)'); g.addColorStop(1, 'rgba(242,208,138,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      if (!m.calm) {
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(age / 2600);
        ctx.globalAlpha = A * 0.22; ctx.fillStyle = P.zaf;
        for (var i = 0; i < 12; i++) {
          ctx.rotate(Math.PI / 6); ctx.beginPath(); ctx.moveTo(0, 0);
          ctx.lineTo(R * 3, -R * 0.24); ctx.lineTo(R * 3, R * 0.24); ctx.closePath(); ctx.fill();
        }
        ctx.restore();
      }
      /* medal */
      var s = m.calm ? 1 : spring(Math.min(1, age / 900));
      var rot = m.calm ? 0 : (1 - ease(Math.min(1, age / 800))) * -Math.PI / 2;
      ctx.translate(cx, cy); ctx.scale(Math.max(0.01, s), Math.max(0.01, s)); ctx.rotate(rot);
      ctx.globalAlpha = A;
      ctx.shadowColor = 'rgba(16,19,42,.35)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 10;
      var gg = ctx.createLinearGradient(-R, -R, R, R);
      gg.addColorStop(0, '#F7DE9E'); gg.addColorStop(0.45, '#D9A441'); gg.addColorStop(1, '#A8741B');
      pathStar(ctx, R); ctx.fillStyle = gg; ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.lineWidth = 2; ctx.strokeStyle = '#8A5D12'; ctx.stroke();
      var gd = ctx.createRadialGradient(-R * 0.2, -R * 0.25, R * 0.05, 0, 0, R * 0.64);
      gd.addColorStop(0, '#3A4C9A'); gd.addColorStop(1, '#16204A');
      ctx.beginPath(); ctx.arc(0, 0, R * 0.62, 0, Math.PI * 2); ctx.fillStyle = gd; ctx.fill();
      ctx.lineWidth = 2.5; ctx.strokeStyle = '#F2D08A'; ctx.stroke();
      ctx.setLineDash([3, 5]); ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(242,208,138,.7)';
      ctx.beginPath(); ctx.arc(0, 0, R * 0.52, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      ctx.rotate(-rot);
      ctx.fillStyle = '#F2D08A'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = '600 ' + Math.round(R * 0.56) + 'px ' + P.display;
      ctx.fillText(m.name.charAt(0).toLocaleUpperCase('az'), 0, R * 0.04);
      ctx.restore();
      /* captions */
      var ta = m.calm ? A : A * clamp((age - 450) / 350, 0, 1);
      if (ta > 0) {
        ctx.save();
        ctx.globalAlpha = ta;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        var ty = cy + R * 1.32 + (m.calm ? 0 : (1 - ease(clamp((age - 450) / 450, 0, 1))) * 12);
        ctx.font = '600 12px ' + P.body;
        if ('letterSpacing' in ctx) ctx.letterSpacing = '2px';
        ctx.lineJoin = 'round'; ctx.lineWidth = 4; ctx.strokeStyle = P.surface;
        ctx.strokeText('YENİ RÜTBƏ', cx, ty); ctx.fillStyle = P.nar; ctx.fillText('YENİ RÜTBƏ', cx, ty);
        if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
        ctx.font = '600 ' + Math.round(clamp(R * 0.42, 28, 44)) + 'px ' + P.display;
        ctx.lineWidth = 7; ctx.strokeText(m.name, cx, ty + 34);
        ctx.fillStyle = P.ink; ctx.fillText(m.name, cx, ty + 34);
        ctx.restore();
      }
      return true;
    }

    return { burst: burst, xp: xp, medal: medal };
  })();

  window.Nuanza = Nuanza;
  window.NuanzaFX = NuanzaFX;
  if (document.head) injectCSS();
})();
