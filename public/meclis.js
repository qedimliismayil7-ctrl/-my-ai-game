/* =====================================================================
   NUANZA — Mirzə Məclisi (meclis.js)
   The council of five elder scribes that gathers for big jobs.
   window.Meclis.run({title, durations?, verdict:{score?, text, seal?, errors?}}) -> Promise (resolves on close)
   window.Meclis.elders — the five elders (data). Meclis.portrait(i) / Meclis.figure(i) -> SVG strings.
   Overlay: rug unrolls, elders gather in an arc, Nuanza carries the scroll in, each elder works in turn,
   verdict with an animated score ring and a wax seal stamp. «Bağla» button and Escape close it.
   CSS prefix: mc- (injected once). Reduced motion: fades only.
   ===================================================================== */
(function () {
  'use strict';
  var W = window, D = document;
  var CUR = null, UID = 0;

  /* ------------------------------------------------------------------
     helpers
     ------------------------------------------------------------------ */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function r2(n) { return Math.round(n * 100) / 100; }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function starPts(cx, cy, R) {
    var o = [], k, a, rr;
    for (k = 0; k < 16; k++) {
      a = (k * 22.5 - 90) * Math.PI / 180; rr = k % 2 ? R * 0.765 : R;
      o.push(r2(cx + rr * Math.cos(a)) + ',' + r2(cy + rr * Math.sin(a)));
    }
    return o.join(' ');
  }
  function blobPath(R, ph) {
    var n = 22, pts = [], k, a, r, d = '';
    for (k = 0; k < n; k++) {
      a = k / n * Math.PI * 2;
      r = R * (1 + 0.05 * Math.sin(a * 5 + ph) + 0.028 * Math.cos(a * 3 + ph * 2));
      pts.push([r * Math.cos(a), r * Math.sin(a)]);
    }
    for (k = 0; k < n; k++) {
      var p = pts[k], q = pts[(k + 1) % n];
      if (k === 0) { var z = pts[n - 1]; d += 'M' + r2((z[0] + p[0]) / 2) + ' ' + r2((z[1] + p[1]) / 2); }
      d += ' Q' + r2(p[0]) + ' ' + r2(p[1]) + ' ' + r2((p[0] + q[0]) / 2) + ' ' + r2((p[1] + q[1]) / 2);
    }
    return d + 'Z';
  }
  function reduced() {
    try { if (W.App && typeof W.App.reducedMotion === 'function') return !!W.App.reducedMotion(); } catch (e) { /* ignore */ }
    var dm = D.documentElement.getAttribute('data-motion');
    if (dm === 'reduce') return true;
    if (dm !== 'system') return false;
    try { return !!W.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
  }
  var IC = {
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
    ffwd: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 6l7 6-7 6zM13 6l7 6-7 6z"/></svg>'
  };
  function icon(n) {
    if (n === 'x' || n === 'chevron') {
      try { if (W.App && typeof W.App.icon === 'function') { var s = W.App.icon(n); if (s) return s; } } catch (e) { /* ignore */ }
    }
    return IC[n] || '';
  }
  var MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avqust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'];
  function azDate(d) {
    function p(n) { return (n < 10 ? '0' : '') + n; }
    return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear() + ', ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }

  /* ------------------------------------------------------------------
     art — five hand-authored elders (viewBox 0 0 120 140, seated on cushions)
     ------------------------------------------------------------------ */
  var BASE =
    '<ellipse class="k-sh" cx="60" cy="135.6" rx="54" ry="3.6"/>' +
    '<path class="k-cu" d="M7 126 Q7 116.5 19 116 H101 Q113 116.5 113 126 V128 Q113 136 101 136 H19 Q7 136 7 128Z"/>' +
    '<path class="k-cu2" d="M13 119.6 Q15 117.6 20 117.6 H100 Q105 117.6 107 119.6"/>' +
    '<path class="k-pip" d="M10 126.4 H110"/>' +
    '<circle class="k-ta" cx="8.6" cy="132" r="2.4"/><circle class="k-ta" cx="111.4" cy="132" r="2.4"/>';
  var LAP =
    '<path class="k-r2" d="M13 124 Q12 104.5 35 100.5 Q60 96.5 85 100.5 Q108 104.5 107 124 Q107 129.5 99 129.5 H21 Q13 129.5 13 124Z"/>' +
    '<path class="k-fold" d="M27 119 Q42 112.5 57 116 M63 116 Q78 112.5 93 119"/>';
  var TORSO = '<path class="k-r1" d="M29 117 Q27 89 41 80 Q60 72 79 80 Q93 89 91 117Z"/>';
  function earsFace() {
    return '<rect class="k-sk2" x="53" y="62" width="14" height="15" rx="5"/>' +
      '<circle class="k-sk" cx="36.5" cy="50" r="5.5"/><circle class="k-sk" cx="83.5" cy="50" r="5.5"/>' +
      '<circle class="k-sk2" cx="36.9" cy="50.5" r="2.3"/><circle class="k-sk2" cx="83.1" cy="50.5" r="2.3"/>' +
      '<circle class="k-sk" cx="60" cy="48" r="23.5"/>';
  }
  function eyes() {
    return '<g class="mc-eyes">' +
      '<g class="mc-eye"><ellipse class="k-ey" cx="51" cy="49" rx="2.6" ry="3.1"/><circle class="k-hl" cx="51.9" cy="47.9" r=".95"/></g>' +
      '<g class="mc-eye"><ellipse class="k-ey" cx="69" cy="49" rx="2.6" ry="3.1"/><circle class="k-hl" cx="69.9" cy="47.9" r=".95"/></g></g>';
  }
  var CROW = '<path class="k-wr" d="M46.4 46.8 l-3 -1.4 M46.5 50.2 l-3 .9 M73.6 46.8 l3 -1.4 M73.5 50.2 l3 .9"/>';
  var CHEEKS = '<circle class="k-ck" cx="45" cy="57" r="4.6"/><circle class="k-ck" cx="75" cy="57" r="4.6"/>';
  var NOSE = '<ellipse class="k-sk2" cx="60" cy="55.4" rx="4.3" ry="3.6"/><ellipse class="k-nh" cx="58.6" cy="54.1" rx="1.4" ry="1"/>';
  function hand(x, y) { return '<circle class="k-cf" cx="' + x + '" cy="' + r2(y - 2.4) + '" r="5.6"/><circle class="k-sk" cx="' + x + '" cy="' + y + '" r="4.9"/>'; }
  function curls(rows) {
    var d = '';
    rows.forEach(function (row) { row[2].forEach(function (x) { d += 'M' + x + ' ' + row[0] + ' q' + row[1] + ' -2.8 ' + (row[1] * 2) + ' 0 '; }); });
    return '<path class="k-htc" d="' + d.trim() + '"/>';
  }

  /* 1 · Lüğətçi Mirzə — grey papaq, white beard, big dictionary (flips pages) */
  function artLugetci() {
    return BASE + '<g class="mc-fig">' + LAP +
      '<g class="mc-body">' + TORSO +
        '<path class="k-iv" d="M50.5 78.5 Q60 74.5 69.5 78.5 L64 117 H56Z"/>' +
        '<path class="k-trim" d="M50.5 78.5 L56 117 M69.5 78.5 L64 117"/>' +
        '<path class="k-sa" d="M30 105 Q60 111 90 105 L90.6 111.5 Q60 117.5 29.4 111.5Z"/>' +
      '</g>' +
      '<path class="k-sv" d="M41.5 85 Q29.5 96 31.5 106.5"/><path class="k-sv" d="M78.5 85 Q90.5 96 88.5 106.5"/>' +
      '<g class="mc-head">' + earsFace() + eyes() +
        '<path class="k-bwl" d="M44.5 42.6 Q50 38.6 55.6 41.6 M64.4 41.6 Q70 38.6 75.5 42.6"/>' + CROW + CHEEKS +
        '<path class="k-bw" d="M37 51 Q35.5 70 45 83 Q52 93 60 95.5 Q68 93 75 83 Q84.5 70 83 51 Q79 59.5 71 60.8 Q60 65 49 60.8 Q41 59.5 37 51Z"/>' +
        '<path class="k-bwd" d="M50 70 Q53 80 58 88 M70 70 Q67 80 62 88 M60 68 V91 M43.5 64 Q45 73 49 79 M76.5 64 Q75 73 71 79"/>' +
        '<path class="k-bw" d="M60 58.6 Q53 55.4 46.6 59.4 Q45.2 62 48.2 62.4 Q54 63.2 60 60.9 Q66 63.2 71.8 62.4 Q74.8 62 73.4 59.4 Q67 55.4 60 58.6Z"/>' +
        '<path class="k-bwd" d="M52 61.4 Q56.5 61.6 60 60.2 Q63.5 61.6 68 61.4"/>' + NOSE +
        '<path class="k-ht" d="M35.5 35 Q33 19 38 9.5 Q60 2.5 82 9.5 Q87 19 84.5 35 Q60 29.5 35.5 35Z"/>' +
        curls([[13, 2.6, [40.5, 49.5, 58.5, 67.5, 75.5]], [21, 2.6, [38.5, 47.5, 56.5, 65.5, 74.5]], [28.6, 2.6, [41.5, 51, 60.5, 70]]]) +
        '<path class="k-ht2" d="M35.5 35 Q60 29.5 84.5 35 L84.9 31 Q60 25.5 35.1 31Z"/>' +
        '<path class="k-hthl" d="M42 9.4 Q60 4.4 78 9.4"/>' +
      '</g>' +
      '<g class="mc-book">' +
        '<path class="k-bk" d="M29 99 L60 103.5 L91 99 L91 116 L60 121 L29 116Z"/>' +
        '<path class="k-pg" d="M31.5 98 L60 101.5 L60 118 L31.5 114.5Z"/>' +
        '<path class="k-pg" d="M88.5 98 L60 101.5 L60 118 L88.5 114.5Z"/>' +
        '<path class="k-pl" d="M35 103 L56 105.5 M35 107 L56 109.5 M35 111 L50 112.8 M64 105.5 L85 103 M64 109.5 L85 107 M64 113.5 L78 111.8"/>' +
        '<path class="k-pl2" d="M60 101.5 V118"/>' +
        '<path class="k-pg mc-flip" d="M60 101.5 L88.5 98 L88.5 114.5 L60 118Z"/>' +
        '<path class="k-rb" d="M65 117.6 L65 126 L67 124 L69 126 L69 117.1Z"/>' +
      '</g>' +
      hand(31.5, 109) + hand(88.5, 109) +
    '</g>';
  }

  /* 2 · Mənaçı Mirzə — white çalma, round glasses, magnifier over a scroll */
  function artMenaci() {
    return BASE + '<g class="mc-fig">' + LAP +
      '<g class="mc-body">' + TORSO +
        '<path class="k-iv" d="M52 78 L60 93 L68 78 Q60 74.8 52 78Z"/>' +
        '<path class="k-trim" d="M52 78 L60 93 L68 78"/><path class="k-fold" d="M60 93 V117"/>' +
        '<path class="k-sa" d="M30 104.5 Q60 110.5 90 104.5 L90.6 111 Q60 117 29.4 111Z"/>' +
      '</g>' +
      '<path class="k-sv" d="M41.5 85 Q30 96 29.5 105.5"/>' +
      '<g class="mc-head">' + earsFace() + eyes() +
        '<path class="k-gbr" d="M44 40.4 Q50 36.8 56 39.8 M64 39.8 Q70 36.8 76 40.4"/>' + CROW + CHEEKS +
        '<path class="k-gb" d="M39 54 Q40 71 49.5 78.5 Q55 83 60 83 Q65 83 70.5 78.5 Q80 71 81 54 Q77 61.5 69 62.6 Q60 66 51 62.6 Q43 61.5 39 54Z"/>' +
        '<path class="k-gbt" d="M50 70 Q53 76 57 80 M70 70 Q67 76 63 80 M60 68 V81"/>' +
        '<path class="k-gb" d="M60 58.8 Q54 56.4 48.8 59.8 Q50.6 63.2 55.6 62.2 Q58.6 61.6 60 60.8 Q61.4 61.6 64.4 62.2 Q69.4 63.2 71.2 59.8 Q66 56.4 60 58.8Z"/>' +
        '<path class="k-mo" d="M56.6 66 Q60 67.8 63.4 66"/>' + NOSE +
        '<g class="k-gl"><circle cx="51" cy="49" r="6.3"/><circle cx="69" cy="49" r="6.3"/><path d="M57.3 48.4 Q60 46.6 62.7 48.4 M44.7 47.6 L37.5 46 M75.3 47.6 L82.5 46"/></g>' +
        '<path class="mc-glint" d="M47.2 46.4 L50.4 43.6 M65.2 46.4 L68.4 43.6"/>' +
        '<path class="k-tb" d="M33 39 Q27 20 41 11.5 Q60 4 79 11.5 Q93 20 87 39 Q74 32.5 60 32.5 Q46 32.5 33 39Z"/>' +
        '<path class="k-tbl" d="M35 31 Q50 21 70 23.5 Q80 25 85.5 30.5 M37.5 22.5 Q52 12.5 74 15.5 Q80.5 17 83.5 21.5 M45 12.5 Q58 19 69 29.5"/>' +
        '<path class="k-tb2" d="M33 39 Q46 32.5 60 32.5 Q74 32.5 87 39 L86.2 35 Q74 29 60 29 Q46 29 33.8 35Z"/>' +
        '<path class="k-plm" d="M60 28 Q55.4 18.6 60.6 11 Q63.6 19.4 60 28Z"/>' +
        '<circle class="k-gd" cx="60" cy="30.6" r="3.4"/><circle class="k-nr" cx="60" cy="30.6" r="1.6"/>' +
      '</g>' +
      '<g class="mc-scroll">' +
        '<rect class="k-pg" x="30" y="101" width="58" height="13" rx="1.5"/>' +
        '<path class="k-pl" d="M35 105 H58 M62 105 H83 M35 109.6 H48 M52 109.6 H80"/>' +
        '<rect class="k-wd" x="26" y="99" width="6" height="17" rx="3"/><rect class="k-wd" x="86" y="99" width="6" height="17" rx="3"/>' +
        '<rect class="k-gd" x="27" y="97.6" width="4" height="2.4" rx="1"/><rect class="k-gd" x="87" y="97.6" width="4" height="2.4" rx="1"/>' +
      '</g>' +
      hand(29, 108) +
      '<g class="mc-arm">' +
        '<path class="k-sv" d="M78.5 85 Q90 96 84.5 111.5"/>' +
        '<path class="k-hd" d="M77 112.5 L84.6 120.2"/>' +
        '<circle class="k-lens" cx="71" cy="106" r="8.2"/><circle class="k-rim" cx="71" cy="106" r="8.2"/>' +
        '<path class="k-lhl" d="M66 103.2 Q67.4 100.2 70.6 99.7"/>' +
        hand(84, 116) +
      '</g>' +
    '</g>';
  }

  /* 3 · Üslubçu Mirzə — red araqçın with gold zigzag, curled moustache, quill flourish */
  function artUslubcu() {
    return BASE + '<g class="mc-fig">' + LAP +
      '<g class="mc-body">' + TORSO +
        '<path class="k-vest" d="M42.5 80.5 Q60 74 77.5 80.5 L73 117 H47Z"/>' +
        '<path class="k-iv" d="M53 78.5 L60 91 L67 78.5 Q60 75.6 53 78.5Z"/>' +
        '<path class="k-trim" d="M53 78.5 L60 91 L67 78.5 M47 117 L42.5 80.5 M73 117 L77.5 80.5"/>' +
        '<circle class="k-gd" cx="60" cy="97" r="1.5"/><circle class="k-gd" cx="60" cy="103.5" r="1.5"/><circle class="k-gd" cx="60" cy="110" r="1.5"/>' +
      '</g>' +
      '<g class="mc-head">' + earsFace() +
        '<path class="k-hr" d="M36.6 36 Q33 44.5 35.6 53 L39.6 51.6 Q37.8 43.5 40.6 36.6Z M83.4 36 Q87 44.5 84.4 53 L80.4 51.6 Q82.2 43.5 79.4 36.6Z"/>' +
        eyes() +
        '<path class="k-dbr" d="M44.5 42.6 Q50 39.6 55.5 42.2 M64.5 40.4 Q70 35.8 75.5 39.4"/>' + CROW + CHEEKS +
        '<path class="k-mo" d="M55.2 66.4 Q60 69.6 64.8 66.4"/>' +
        '<path class="k-ms mc-mst" d="M60 59.2 C55.5 56.6 50 57 46.6 59.6 C44.2 61.4 41.6 61.2 40.6 58.8 C40 57.2 41 55.7 42.6 55.9 C41.7 56.9 42.1 58.3 43.4 58.4 C46.2 58.5 48.6 54.5 54 55.6 C57 56.2 59 57.4 60 58.2 C61 57.4 63 56.2 66 55.6 C71.4 54.5 73.8 58.5 76.6 58.4 C77.9 58.3 78.3 56.9 77.4 55.9 C79 55.7 80 57.2 79.4 58.8 C78.4 61.2 75.8 61.4 73.4 59.6 C70 57 64.5 56.6 60 59.2Z"/>' +
        '<path class="k-ms" d="M57.6 70.8 Q60 79 62.4 70.8 Q60 72.3 57.6 70.8Z"/>' + NOSE +
        '<path class="k-ht" d="M37 34.5 Q36.5 15.5 60 13.5 Q83.5 15.5 83 34.5 Q60 30 37 34.5Z"/>' +
        '<path class="k-ht2" d="M37 34.5 Q60 30 83 34.5 L83.2 30.2 Q60 25.6 36.8 30.2Z"/>' +
        '<path class="k-zz" d="M39.5 25.5 L43.4 20.6 L47.2 25 L51.2 19.8 L55.4 24.6 L60 19.2 L64.6 24.6 L68.8 19.8 L72.8 25 L76.6 20.6 L80.5 25.5"/>' +
        '<circle class="k-gd" cx="60" cy="14.8" r="1.8"/>' +
        '<path class="k-hthl" d="M45 17.6 Q60 13.8 75 17.6"/>' +
      '</g>' +
      '<g transform="rotate(-5 57 108)">' +
        '<rect class="k-wd" x="33" y="99" width="48" height="19" rx="2.5"/>' +
        '<rect class="k-pg" x="35.5" y="101" width="43" height="15" rx="1"/>' +
        '<path class="k-pl" d="M39 104.6 H64 M39 108.4 H56"/>' +
        '<path class="k-ink mc-flo" pathLength="1" d="M39 113 C42.5 108.6 45.6 115.6 49.4 111.4 S56.6 108.4 59.6 112 C62 115 65.6 110.4 69.4 111.6 C72.4 112.6 73.6 110.2 75.4 108.6"/>' +
      '</g>' +
      '<path class="k-sv" d="M41.5 85 Q31 97 35.5 108.6"/>' + hand(35.5, 111) +
      '<g class="mc-arm">' +
        '<path class="k-sv" d="M78.5 85 Q91 96 77.6 106"/>' +
        '<path class="k-qf" d="M70.6 112.4 C75.6 102 85.6 88 99 75.6 C91.6 90 82.6 101.6 70.6 112.4Z"/>' +
        '<path class="k-qs" d="M70.6 112.4 L96.6 78.4"/>' +
        '<path class="k-qb" d="M80 99.5 L84.5 97 M84 94 L88.8 91.4 M88 88.6 L92.6 86 M78.6 97.8 L77 93.6 M82.6 92.4 L81.4 88.4"/>' +
        '<path class="k-gd" d="M69.2 115 L70.4 111.4 L72.6 112.8Z"/>' +
        hand(75.5, 108.4) +
      '</g>' +
    '</g>';
  }

  /* 4 · Dilçi Nənə — white kəlağayı with red dots, red-ink pen marking a correction */
  function artDilci() {
    return BASE + '<g class="mc-fig">' + LAP +
      '<g class="mc-body">' + TORSO +
        '<path class="k-kl" d="M31 50 Q27 22 60 17 Q93 22 89 50 Q91 70 99 96 Q86 94.5 77 84 Q70 77 60 77 Q50 77 43 84 Q34 94.5 21 96 Q29 70 31 50Z"/>' +
        '<g class="k-kd"><circle cx="27" cy="83" r="1.8"/><circle cx="31.5" cy="70" r="1.8"/><circle cx="93" cy="83" r="1.8"/><circle cx="88.5" cy="70" r="1.8"/><circle cx="25" cy="92" r="1.6"/><circle cx="95" cy="92" r="1.6"/><circle cx="35.4" cy="88" r="1.6"/><circle cx="84.6" cy="88" r="1.6"/></g>' +
        '<path class="k-klb" d="M21 96 Q34 94.5 43 84 M99 96 Q86 94.5 77 84"/>' +
        '<path class="k-iv" d="M48 80 Q60 75.5 72 80 L68 87 Q60 84.5 52 87Z"/>' +
      '</g>' +
      '<g class="mc-head">' +
        '<circle class="k-sk" cx="60" cy="48" r="23.5"/>' +
        '<path class="k-hg" d="M39.5 40 Q47 33.6 60 34.6 Q73 33.6 80.5 40 Q74 37.6 66 38.6 Q60 36.2 54 38.6 Q46 37.6 39.5 40Z"/>' +
        eyes() +
        '<path class="k-gbr" d="M45.5 42.8 Q50.5 40.4 55.5 42.4 M64.5 42.4 Q69.5 40.4 74.5 42.8"/>' + CROW +
        '<circle class="k-ck" cx="45" cy="57.4" r="5.4"/><circle class="k-ck" cx="75" cy="57.4" r="5.4"/>' +
        '<ellipse class="k-sk2" cx="60" cy="55" rx="3.2" ry="2.7"/><ellipse class="k-nh" cx="59" cy="54.1" rx="1" ry=".7"/>' +
        '<path class="k-mo2" d="M53.4 61.4 Q60 68.6 66.6 61.4 Q60 64.2 53.4 61.4Z"/>' +
        '<path class="k-wr" d="M50.6 60 Q49.6 62.5 51 64.5 M69.4 60 Q70.4 62.5 69 64.5"/>' +
        '<path class="k-kl" d="M35 50 Q33 25 60 22.5 Q87 25 85 50 Q81.5 36 60 34.4 Q38.5 36 35 50Z"/>' +
        '<g class="k-kd"><circle cx="42" cy="31" r="1.7"/><circle cx="50.5" cy="26.4" r="1.7"/><circle cx="60" cy="25" r="1.7"/><circle cx="69.5" cy="26.4" r="1.7"/><circle cx="78" cy="31" r="1.7"/><circle cx="37.6" cy="41" r="1.5"/><circle cx="82.4" cy="41" r="1.5"/></g>' +
        '<path class="k-klb" d="M36.6 47 Q40.5 37.2 60 35.8 Q79.5 37.2 83.4 47"/>' +
        '<path class="k-hthl" d="M44 24.6 Q60 19.6 76 24.6"/>' +
        '<path class="k-kl" d="M51.5 73.5 Q60 80 68.5 73.5 L66.5 83 Q60 86.5 53.5 83Z"/>' +
        '<circle class="k-kd2" cx="57" cy="79" r="1.4"/><circle class="k-kd2" cx="63" cy="79" r="1.4"/>' +
      '</g>' +
      '<path class="k-pg" d="M35 99 L82 96.5 L84 118 L37 120.5Z"/>' +
      '<path class="k-pl" d="M40 104 L77 102 M40 108.6 L58 107.7 M40 113.2 L72 111.5"/>' +
      '<path class="k-ple" d="M62 107.5 L77 106.7"/>' +
      '<path class="k-red mc-strk" pathLength="1" d="M61 107.6 L78.5 106.6"/>' +
      '<path class="k-red mc-care" pathLength="1" d="M66 105 L69 100.5 L72 104.6"/>' +
      '<path class="k-sv" d="M41.5 86 Q31 98 37.5 109"/>' + hand(37.5, 111.5) +
      '<g class="mc-arm">' +
        '<path class="k-sv" d="M78.5 86 Q89 95 77.5 100.5"/>' +
        '<path class="k-pen" d="M66.4 104.2 L80.4 91.4"/>' +
        '<path class="k-pnc" d="M77.6 94 L79.8 92"/>' +
        '<path class="k-pnt" d="M64.6 106 L66.2 103 L67.8 104.6Z"/>' +
        hand(74.5, 99.5) +
      '</g>' +
    '</g>';
  }

  /* 5 · Möhürdar Mirzə — black papaq, thick dark beard, raises and stamps the wax seal */
  function artMohurdar() {
    return BASE + '<g class="mc-fig">' + LAP +
      '<g class="mc-body">' + TORSO +
        '<path class="k-in2" d="M50 79 Q60 75 70 79 L64.5 117 H55.5Z"/>' +
        '<path class="k-trim" d="M50 79 L55.5 117 M70 79 L64.5 117 M41 80.4 Q30 88 29.2 116 M79 80.4 Q90 88 90.8 116"/>' +
        '<path class="k-gdf" d="M30 104.5 Q60 110.5 90 104.5 L90.6 110.8 Q60 116.8 29.4 110.8Z"/>' +
        '<rect class="k-bkl" x="55.5" y="106.6" width="9" height="6.4" rx="1.4"/>' +
      '</g>' +
      '<path class="k-sv" d="M41.5 85 Q30 95 33 105.5"/>' +
      '<path class="k-pg" d="M70 111 L104 108.6 L105.6 121.4 L71.6 123.6Z"/>' +
      '<path class="k-pl" d="M74 115 L88 114.1 M74 119 L86 118.2"/>' +
      '<g class="mc-imp"><circle class="k-wx" cx="94.4" cy="116.2" r="4.8"/><polygon class="k-wx2" points="' + starPts(94.4, 116.2, 2.9) + '"/></g>' +
      '<g class="mc-arm">' +
        '<path class="k-sv" d="M78 88 Q91 95 92.6 98.6"/>' +
        '<g class="mc-stp">' +
          '<circle class="k-wd" cx="94" cy="91.6" r="4.3"/><circle class="k-wdh" cx="92.6" cy="90.2" r="1.3"/>' +
          '<rect class="k-wd" x="91.8" y="93.6" width="4.4" height="8.6" rx="1.6"/>' +
          '<path class="k-br" d="M87 102 H101 L102.6 107.6 H85.4Z"/>' +
          '<rect class="k-wx" x="85.4" y="107.4" width="17.2" height="2.4" rx="1"/>' +
        '</g>' +
        hand(93.6, 99.8) +
      '</g>' +
      '<g class="mc-head">' + earsFace() +
        '<circle class="k-ck" cx="46" cy="55.4" r="3.8"/><circle class="k-ck" cx="74" cy="55.4" r="3.8"/>' +
        '<path class="k-db" d="M35.5 40 Q33 66 41 84 Q49 99 60 101 Q71 99 79 84 Q87 66 84.5 40 L80.8 41 Q82 54 77.5 59.5 Q69.5 61.6 60 64.6 Q50.5 61.6 42.5 59.5 Q38 54 39.2 41Z"/>' +
        '<path class="k-dbt" d="M47 71 Q50 83 55 92 M60 69 V97 M73 71 Q70 83 65 92 M42.5 63 Q43.5 73 47.5 82 M77.5 63 Q76.5 73 72.5 82"/>' +
        '<path class="k-gs" d="M58.6 75 Q60.8 84 59.4 93"/>' +
        eyes() +
        '<path class="k-dbr2" d="M43.4 42 L56 44 M64 44 L76.6 42"/>' +
        '<path class="k-db" d="M60 57.8 Q50.6 53.8 44.4 59.4 Q43.4 63.6 49 63 Q55 62.4 60 60.4 Q65 62.4 71 63 Q76.6 63.6 75.6 59.4 Q69.4 53.8 60 57.8Z"/>' +
        '<path class="k-dbt" d="M50 59.6 Q55 59.4 59 58.8 M61 58.8 Q65 59.4 70 59.6"/>' + NOSE +
        '<path class="k-ht" d="M34.5 36 Q31 16 36 4 Q60 -1 84 4 Q89 16 85.5 36 Q60 30.5 34.5 36Z"/>' +
        curls([[10, 2.6, [39, 48, 57.4, 67, 75.6]], [18, 2.6, [37.6, 46.6, 56, 65.6, 75]], [26.4, 2.6, [39, 49, 59, 69, 77.6]]]) +
        '<path class="k-ht2" d="M34.5 36 Q60 30.5 85.5 36 L85.9 31.6 Q60 26 34.1 31.6Z"/>' +
        '<path class="k-hthl" d="M40.5 6.2 Q60 1.8 79.5 6.2"/>' +
      '</g>' +
      hand(33, 107.6) +
    '</g>';
  }

  var ART = [artLugetci(), artMenaci(), artUslubcu(), artDilci(), artMohurdar()];

  /* Nuanza (fallback mini figure, used when nuanza.js is not available) */
  var NZ_ART =
    '<ellipse class="k-sh" cx="50" cy="121" rx="25" ry="3"/>' +
    '<g class="mc-nf">' +
      '<g class="mc-nb"><ellipse class="k-hrn" cx="71" cy="55" rx="6" ry="5.5"/><ellipse class="k-hrn" cx="73" cy="64" rx="5.8" ry="5.3"/><ellipse class="k-hrn" cx="74.6" cy="73" rx="5.4" ry="5"/><ellipse class="k-hrn" cx="75.6" cy="81.4" rx="5" ry="4.6"/><rect class="k-nr" x="71.2" y="85.2" width="9" height="4" rx="2"/><path class="k-hrn" d="M72.4 89.2 Q76 98 79.6 89.2Z"/></g>' +
      '<path class="k-nzr" d="M28 118 Q26 87 38 75 Q50 69 62 75 Q74 87 72 118Z"/>' +
      '<path class="k-nzh" d="M28.6 109 Q50 115 71.4 109 L72 118 H28Z"/>' +
      '<g class="k-gd"><path d="M34 114 l2 -2 2 2 -2 2z M42 115 l2 -2 2 2 -2 2z M50 115.4 l2 -2 2 2 -2 2z M58 115 l2 -2 2 2 -2 2z M66 114 l2 -2 2 2 -2 2z"/></g>' +
      '<path class="k-iv" d="M42.5 74 L50 83 L57.5 74 Q50 71 42.5 74Z"/>' +
      '<rect class="k-nr" x="32" y="96" width="36" height="5" rx="2.5"/>' +
      '<polygon class="k-gd" points="' + starPts(50, 88, 4) + '"/>' +
      '<path class="k-nza" d="M38 79 Q31 88 39 96"/><path class="k-nza" d="M62 79 Q69 88 61 96"/>' +
      '<circle class="k-sk" cx="39.5" cy="96.5" r="3.6"/><circle class="k-sk" cx="60.5" cy="96.5" r="3.6"/>' +
      '<rect class="k-sk2" x="46" y="62" width="8" height="11" rx="3"/>' +
      '<g class="mc-nh">' +
        '<path class="k-hrn" d="M27.5 44 C25.5 18 40 10 50 10 C60 10 74.5 18 72.5 44 L71 61 Q50 67 29 61Z"/>' +
        '<circle class="k-sk" cx="50" cy="42" r="21"/>' +
        '<path class="k-hrn" d="M29 41 Q30.5 20 50 18 Q69.5 20 71 41 Q64 30 56 29 Q50.5 36 40 32.5 Q33.5 35.5 29 41Z"/>' +
        '<path class="k-nzb" d="M31 30.5 Q50 12.5 69 30.5"/>' +
        '<g class="k-gd"><circle cx="37" cy="24.6" r="1.3"/><circle cx="43.5" cy="20.6" r="1.3"/><circle cx="50" cy="19.3" r="1.3"/><circle cx="56.5" cy="20.6" r="1.3"/><circle cx="63" cy="24.6" r="1.3"/></g>' +
        '<g class="mc-eye"><ellipse class="k-ew" cx="42" cy="44" rx="5" ry="6"/><circle class="k-ir" cx="42.5" cy="44.8" r="3.7"/><circle class="k-ey" cx="42.5" cy="44.8" r="1.9"/><circle class="k-hl" cx="43.9" cy="43.1" r="1.25"/></g>' +
        '<g class="mc-eye"><ellipse class="k-ew" cx="58" cy="44" rx="5" ry="6"/><circle class="k-ir" cx="57.5" cy="44.8" r="3.7"/><circle class="k-ey" cx="57.5" cy="44.8" r="1.9"/><circle class="k-hl" cx="58.9" cy="43.1" r="1.25"/></g>' +
        '<path class="k-lash" d="M37.2 40.4 l-2.2 -1.6 M62.8 40.4 l2.2 -1.6"/>' +
        '<path class="k-nbr" d="M38 35.8 Q42 33.8 46 35.4 M54 35.4 Q58 33.8 62 35.8"/>' +
        '<circle class="k-ck" cx="36" cy="52" r="3.6"/><circle class="k-ck" cx="64" cy="52" r="3.6"/>' +
        '<path class="k-nzm" d="M45.6 54 Q50 58.6 54.4 54 Q50 55.6 45.6 54Z"/>' +
        '<circle class="k-gd" cx="29.4" cy="50" r="1.8"/><circle class="k-gd" cx="70.6" cy="50" r="1.8"/>' +
      '</g>' +
    '</g>';
  var NZ_SCROLL = '<svg class="mc-art" viewBox="0 0 60 20" aria-hidden="true"><rect class="k-pg" x="4" y="4" width="52" height="12" rx="6"/><path class="k-pl" d="M9 7.4 H51 M9 12.6 H51"/><circle class="k-wd" cx="4.6" cy="10" r="4.2"/><circle class="k-wd" cx="55.4" cy="10" r="4.2"/><rect class="k-nr" x="27" y="3" width="6" height="14" rx="1.2"/><path class="k-rbn" d="M30 17 l-3.4 3 M30 17 l3.4 3"/></svg>';

  /* ------------------------------------------------------------------
     the five elders (public data)
     ------------------------------------------------------------------ */
  var ELDERS = [
    { id: 'lugetci', n: 1, name: 'Lüğətçi Mirzə', short: 'Lüğətçi', role: 'Terminologiya', look: 'Boz papaq, ağ saqqal, qalın lüğət',
      work: 'Lüğəti vərəqləyir',
      doing: 'Lüğəti vərəqləyirəm: hər termin lüğət və tərcümə yaddaşı ilə tutuşdurulur',
      done: 'Terminlər lüğətə uyğundur — hamısı yerindədir.',
      warn: 'Üç termin lüğətdən fərqlidir — qeyd etdim.',
      warnN: function (n) { return n + ' termin lüğətdən fərqlidir'; },
      quip: 'Lüğətsiz tərcümə xəritəsiz səfərə bənzəyir.' },
    { id: 'menaci', n: 2, name: 'Mənaçı Mirzə', short: 'Mənaçı', role: 'Məna və mənbə', look: 'Ağ çalma, girdə eynək, böyüdücü şüşə',
      work: 'Böyüdücü ilə tumarı oxuyur',
      doing: 'Hər cümləni mənbə ilə yan-yana oxuyuram',
      done: 'Məna mənbə ilə üst-üstə düşür, heç nə buraxılmayıb.',
      warn: 'Bir cümlədə məna daralıb — mənbəyə qayıdın.',
      warnN: function (n) { return n + ' yerdə məna mənbədən uzaqlaşıb'; },
      quip: 'Sözə yox, mənaya bax, övladım.' },
    { id: 'uslubcu', n: 3, name: 'Üslubçu Mirzə', short: 'Üslubçu', role: 'Üslub, registr, söz sırası', look: 'Qızılı ziqzaqlı qırmızı araqçın, burma bığ, lələk',
      work: 'Lələklə naxış vurur',
      doing: 'Registri və söz sırasını cilalayıram',
      done: 'Üslub ardıcıldır, cümlələr səlis oxunur.',
      warn: 'İki cümlədə söz sırası ingiliscəyə bənzəyir.',
      warnN: function (n) { return n + ' cümlədə üslub və ya söz sırası axsayır'; },
      quip: 'Cümlə də xalça kimidir: hər naxış öz yerində olmalıdır.' },
    { id: 'dilci', n: 4, name: 'Dilçi Nənə', short: 'Dilçi Nənə', role: 'Orfoqrafiya, türk formaları', look: 'Qırmızı xallı ağ kəlağayı, qırmızı qələm',
      work: 'Qırmızı qələmlə düzəliş edir',
      doing: 'Yazılışa baxıram — «değil», «şimdi» kimi türk formaları qalmasın',
      done: 'Yazılış ədəbi normaya uyğundur.',
      warn: 'İki türk forması tapdım: «değil» → «deyil», «şimdi» → «indi».',
      warnN: function (n) { return n + ' yazılış səhvi və ya türk forması'; },
      quip: '«Şimdi» yox, «indi», qızım! Dilimizi qoruyaq.' },
    { id: 'mohurdar', n: 5, name: 'Möhürdar Mirzə', short: 'Möhürdar', role: 'Rəqəm, ad, tarix · möhür', look: 'Qara papaq, qalın tünd saqqal, mum möhür',
      work: 'Möhürü qaldırıb vurur',
      doing: 'Rəqəmləri, adları və tarixləri sayıram. Sonra möhür',
      done: 'Rəqəmlər, adlar və tarixlər yerindədir. Möhür vuruldu!',
      warn: 'Bir tarix mənbə ilə üst-üstə düşmür — yoxlayın.',
      warnN: function (n) { return n + ' rəqəm, ad və ya tarix uyğun gəlmir'; },
      quip: 'Rəqəm yalan deməz, amma səhv yazıla bilər.' }
  ];
  /* seat positions in the arc: x (center %), bottom %, scale, z-index, entrance order */
  var SEATS = [
    { x: 12, b: 14, s: 1, z: 5, i: 3 },
    { x: 30, b: 33, s: 0.9, z: 3, i: 1 },
    { x: 50, b: 41, s: 0.84, z: 2, i: 0 },
    { x: 70, b: 33, s: 0.9, z: 3, i: 2 },
    { x: 88, b: 14, s: 1, z: 5, i: 4 }
  ];
  var TYPE_TO = {
    'Termin': 0, 'Terminologiya': 0, 'Lüğət': 0, 'Qlossari': 0,
    'Məna': 1, 'Boş seqment': 1, 'Buraxılma': 1, 'Əlavə': 1,
    'Üslub': 2, 'Söz sırası': 2, 'Ardıcıllıq': 2, 'Registr': 2,
    'Türk forması': 3, 'Orfoqrafiya': 3, 'Durğu': 3, 'Yazılış': 3,
    'Rəqəm': 4, 'Ad': 4, 'Tarix': 4, 'Say': 4
  };

  function figure(i) { injectCss(); return '<svg class="mc-art e' + (i + 1) + '" viewBox="0 0 120 140" aria-hidden="true" focusable="false">' + ART[i] + '</svg>'; }
  function portrait(i) { injectCss(); return '<svg class="mc-art e' + (i + 1) + '" viewBox="23 1 74 74" aria-hidden="true" focusable="false">' + ART[i] + '</svg>'; }
  function nzPortrait() { return '<svg class="mc-art" viewBox="22 8 56 56" aria-hidden="true" focusable="false">' + NZ_ART + '</svg>'; }
  function starAvatar() {
    return '<svg class="mc-star-av" viewBox="-20 -20 40 40" aria-hidden="true" focusable="false"><polygon class="s1" points="' + starPts(0, 0, 13) + '"/><circle class="s2" r="5.4"/><circle class="s3" r="1.8"/></svg>';
  }
  function sealSvg() {
    var id = 'mcSA' + (++UID);
    return '<svg class="mc-art" viewBox="-50 -50 100 100" aria-hidden="true" focusable="false">' +
      '<path class="s-blob" d="' + blobPath(46, 0.6) + '"/>' +
      '<path class="s-pool" d="' + blobPath(39, 2.1) + '"/>' +
      '<circle class="s-ring" r="31.5"/>' +
      '<defs><path id="' + id + '" d="M -37.5 0 a 37.5 37.5 0 1 1 75 0 a 37.5 37.5 0 1 1 -75 0"/></defs>' +
      '<text class="s-tx"><textPath href="#' + id + '" xlink:href="#' + id + '" textLength="228" lengthAdjust="spacing">MİRZƏ MƏCLİSİ · NUANZA · BAKI ·</textPath></text>' +
      '<polygon class="s-star" points="' + starPts(0, 0, 22) + '"/>' +
      '<circle class="s-core" r="8.6"/>' +
      '<polygon class="s-star2" points="' + starPts(0, 0, 5.6) + '"/>' +
      '<ellipse class="s-hl" cx="-17" cy="-25" rx="13" ry="5.4" transform="rotate(-32 -17 -25)"/>' +
    '</svg>';
  }
  function tumarSvg() {
    return '<svg class="mc-art mc-tsvg" viewBox="0 0 200 84" aria-hidden="true" focusable="false">' +
      '<ellipse class="k-sh" cx="100" cy="79" rx="92" ry="4.6"/>' +
      '<g class="t-pg">' +
        '<rect class="k-pg" x="18" y="10" width="164" height="62" rx="2"/>' +
        '<path class="t-edge" d="M18 13.5 H182 M18 68.5 H182"/>' +
        '<path class="t-ttl" d="M74 22 H126"/>' +
        '<path class="k-pl" d="M32 32 H76 M82 32 H120 M126 32 H168 M32 40 H64 M70 40 H146 M32 48 H104 M110 48 H138 M144 48 H168 M32 56 H58 M64 56 H92 M98 56 H146 M32 63 H118"/>' +
        '<path class="mk mk1" pathLength="1" d="M82 35.6 H120"/>' +
        '<path class="mk mk2" pathLength="1" d="M151 39.6 l4.4 4.4 l9.4 -10.4"/>' +
        '<path class="mk mk4" pathLength="1" d="M108 48 H140"/>' +
        '<path class="mk mk4" pathLength="1" d="M119 44.6 l4.4 -6.4 l4.4 6.4"/>' +
        '<path class="mk mk3" pathLength="1" d="M60 67 q8 -7 16 0 t16 0 q7 -5 12 1"/>' +
        '<g class="mk5"><circle class="k-wx" cx="161" cy="60" r="9.4"/><polygon class="k-wx2" points="' + starPts(161, 60, 5.8) + '"/></g>' +
      '</g>' +
      '<g class="t-rl"><rect class="k-wd" x="8" y="5" width="14" height="72" rx="7"/><rect class="t-cap" x="10.5" y="1.6" width="9" height="5.4" rx="2"/><rect class="t-cap" x="10.5" y="75" width="9" height="5.4" rx="2"/></g>' +
      '<g class="t-rr"><rect class="k-wd" x="178" y="5" width="14" height="72" rx="7"/><rect class="t-cap" x="180.5" y="1.6" width="9" height="5.4" rx="2"/><rect class="t-cap" x="180.5" y="75" width="9" height="5.4" rx="2"/></g>' +
    '</svg>';
  }
  function archSvg() {
    return '<svg class="mc-arch" viewBox="0 0 200 240" aria-hidden="true" focusable="false">' +
      '<defs><pattern id="mcLattice" width="18" height="18" patternUnits="userSpaceOnUse"><polygon class="a-st" points="' + starPts(9, 9, 6.4) + '"/><path class="a-ln" d="M0 9 H2.6 M15.4 9 H18 M9 0 V2.6 M9 15.4 V18"/></pattern></defs>' +
      '<path class="a-gl" d="M24 240 V118 Q24 46 100 10 Q176 46 176 118 V240Z"/>' +
      '<path class="a-lat" fill="url(#mcLattice)" d="M36 240 V122 Q36 60 100 26 Q164 60 164 122 V240Z"/>' +
      '<path class="a-fr" d="M24 240 V118 Q24 46 100 10 Q176 46 176 118 V240"/>' +
      '<path class="a-fr2" d="M36 240 V122 Q36 60 100 26 Q164 60 164 122 V240"/>' +
    '</svg>';
  }
  function lampSvg() {
    return '<svg viewBox="0 0 30 72" aria-hidden="true" focusable="false">' +
      '<path class="l-ch" d="M15 0 V22"/>' +
      '<path class="l-cap" d="M9 22 H21 L19 26.5 H11Z"/>' +
      '<path class="l-body" d="M8.5 26.5 H21.5 Q25 38.5 21.5 50.5 H8.5 Q5 38.5 8.5 26.5Z"/>' +
      '<path class="l-fr" d="M15 26.5 V50.5 M8.5 26.5 Q11.6 38.5 8.5 50.5 M21.5 26.5 Q18.4 38.5 21.5 50.5"/>' +
      '<path class="l-cap" d="M11 50.5 H19 L21 55 H9Z"/>' +
      '<path class="l-ch" d="M15 55 V60"/><circle class="l-cap" cx="15" cy="62" r="2"/>' +
    '</svg>';
  }

  /* ------------------------------------------------------------------
     CSS (injected once)
     ------------------------------------------------------------------ */
  var CSS = `
.mc,.mc-art{--mc-skin:#F1C9A5;--mc-skin2:#DCA482;--mc-cheek:#EC8B7E;--mc-eye:#1E1B2E;--mc-beard:#F5F1EA;--mc-beard2:#D2C9BC;
  --mc-grey:#CEC7BB;--mc-grey2:#A69E92;--mc-paper:#FFF8EA;--mc-paper2:#E4D6BA;--mc-pline:#BBA988;--mc-wood:#8B5A33;--mc-wood2:#6A4226;
  --mc-red:#C8283F;--mc-wax:#A3253A;--mc-wax2:#78192A;--mc-wax3:#C9405A;--mc-ivory:#FFF9EE;--mc-cush:#761B2E;--mc-cush2:#93283E;
  --mc-gold:#D9A441;--mc-gold2:#A97A22;--mc-ink:#22336E;--mc-ok:#4CC38A;--mc-okd:#2E8A5E;--mc-navy:#22306B;--mc-hair:#2E1F1A}
.mc-art{--robe:#2E6A58;--robe2:#22503F;--sash:var(--mc-gold);--hat:#9A9590;--hat2:#7A7571;--hatc:#68635F}
.mc-art.e1{--robe:#2E6A58;--robe2:#22503F}
.mc-art.e2{--robe:#7C5434;--robe2:#5E3E25;--sash:#2E6A58}
.mc-art.e3{--robe:#2A3C7E;--robe2:#1F2D62;--hat:#B3263A;--hat2:#8E1C2E}
.mc-art.e4{--robe:#6E2C47;--robe2:#552138}
.mc-art.e5{--robe:#262A44;--robe2:#1A1D30;--hat:#2A2322;--hat2:#1B1615;--hatc:#4E4440}
.mc-art .k-sh{fill:#000;opacity:.26}
.mc-art .k-cu{fill:var(--mc-cush)}
.mc-art .k-cu2{fill:none;stroke:var(--mc-cush2);stroke-width:2;stroke-linecap:round}
.mc-art .k-pip{fill:none;stroke:var(--mc-gold);stroke-width:1.2;stroke-dasharray:2 2.4;opacity:.9}
.mc-art .k-ta{fill:var(--mc-gold)}
.mc-art .k-r1{fill:var(--robe)}
.mc-art .k-r2{fill:var(--robe2)}
.mc-art .k-sv{fill:none;stroke:var(--robe);stroke-width:12;stroke-linecap:round}
.mc-art .k-fold{fill:none;stroke:rgba(0,0,0,.24);stroke-width:1.4;stroke-linecap:round}
.mc-art .k-sk{fill:var(--mc-skin)}
.mc-art .k-sk2{fill:var(--mc-skin2)}
.mc-art .k-ck{fill:var(--mc-cheek);opacity:.5}
.mc-art .k-ey{fill:var(--mc-eye)}
.mc-art .k-hl{fill:#fff}
.mc-art .k-nh{fill:#fff;opacity:.42}
.mc-art .k-wr{fill:none;stroke:var(--mc-skin2);stroke-width:1.1;stroke-linecap:round}
.mc-art .k-iv,.mc-art .k-cf{fill:var(--mc-ivory)}
.mc-art .k-in2{fill:#5B1A28}
.mc-art .k-sa{fill:var(--sash)}
.mc-art .k-trim{fill:none;stroke:var(--mc-gold);stroke-width:1.3;opacity:.85}
.mc-art .k-bw{fill:var(--mc-beard)}
.mc-art .k-bwd{fill:none;stroke:var(--mc-beard2);stroke-width:1.3;stroke-linecap:round}
.mc-art .k-bwl{fill:none;stroke:var(--mc-beard);stroke-width:3.4;stroke-linecap:round}
.mc-art .k-gb{fill:var(--mc-grey)}
.mc-art .k-gbt{fill:none;stroke:var(--mc-grey2);stroke-width:1.2;stroke-linecap:round}
.mc-art .k-gbr{fill:none;stroke:#B5ADA3;stroke-width:2.6;stroke-linecap:round;transition:transform .3s var(--ease-out,ease)}
.mc-art .k-mo{fill:none;stroke:#7A3B36;stroke-width:1.8;stroke-linecap:round}
.mc-art .k-mo2{fill:#A8434F}
.mc-art .k-ht{fill:var(--hat)}
.mc-art .k-ht2{fill:var(--hat2)}
.mc-art .k-htc{fill:none;stroke:var(--hatc);stroke-width:1.4;stroke-linecap:round}
.mc-art .k-hthl{fill:none;stroke:#fff;stroke-opacity:.24;stroke-width:2;stroke-linecap:round}
.mc-art .k-pg{fill:var(--mc-paper)}
.mc-art .k-pl{fill:none;stroke:var(--mc-pline);stroke-width:1.4;stroke-linecap:round}
.mc-art .k-pl2{fill:none;stroke:var(--mc-paper2);stroke-width:1.6}
.mc-art .k-ple{fill:none;stroke:#8E7E62;stroke-width:1.8;stroke-linecap:round}
.mc-art .k-bk{fill:var(--mc-wax)}
.mc-art .k-rb,.mc-art .k-gd,.mc-art .k-ta{fill:var(--mc-gold)}
.mc-art .k-gdf{fill:var(--mc-gold)}
.mc-art .k-bkl{fill:var(--mc-gold2);stroke:#F2D08A;stroke-width:1}
.mc-art .k-wd{fill:var(--mc-wood)}
.mc-art .k-wdh{fill:#fff;opacity:.3}
.mc-art .k-nr{fill:var(--mc-red)}
.mc-art .k-tb{fill:#FBF6EC}
.mc-art .k-tb2{fill:#E9E0CF}
.mc-art .k-tbl{fill:none;stroke:#D7CBB5;stroke-width:1.6;stroke-linecap:round}
.mc-art .k-plm{fill:var(--mc-ivory);stroke:var(--mc-gold);stroke-width:.9}
.mc-art .k-gl{fill:rgba(255,255,255,.14);stroke:#3A2A1A;stroke-width:1.7;stroke-linecap:round}
.mc-art .mc-glint{fill:none;stroke:#fff;stroke-width:1.4;stroke-linecap:round;opacity:.0}
.mc-art .k-hd{fill:none;stroke:var(--mc-wood);stroke-width:3.6;stroke-linecap:round}
.mc-art .k-lens{fill:rgba(190,225,245,.5)}
.mc-art .k-rim{fill:none;stroke:var(--mc-gold);stroke-width:2.4}
.mc-art .k-lhl{fill:none;stroke:#fff;stroke-width:1.4;stroke-linecap:round;opacity:.85}
.mc-art .k-vest{fill:var(--mc-wax)}
.mc-art .k-hr{fill:#5A5552}
.mc-art .k-dbr{fill:none;stroke:#4A4440;stroke-width:2.6;stroke-linecap:round}
.mc-art .k-ms{fill:#4E4844}
.mc-art .k-zz{fill:none;stroke:var(--mc-gold);stroke-width:1.5;stroke-linejoin:round}
.mc-art .k-ink{fill:none;stroke:var(--mc-ink);stroke-width:1.5;stroke-linecap:round}
.mc-art .k-qf{fill:var(--mc-ivory);stroke:#CFC3AE;stroke-width:1}
.mc-art .k-qs{fill:none;stroke:#BDAF96;stroke-width:1.1}
.mc-art .k-qb{fill:none;stroke:#D8CDB9;stroke-width:.9;stroke-linecap:round}
.mc-art .k-kl{fill:#FBF7F0}
.mc-art .k-kd circle{fill:var(--mc-red)}
.mc-art .k-kd2{fill:var(--mc-red)}
.mc-art .k-klb{fill:none;stroke:var(--mc-gold);stroke-width:1.2;stroke-dasharray:1.4 1.8;stroke-linecap:round}
.mc-art .k-hg{fill:#D8D2CA}
.mc-art .k-red{fill:none;stroke:var(--mc-red);stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
.mc-art .k-pen{fill:none;stroke:var(--mc-red);stroke-width:3.6;stroke-linecap:round}
.mc-art .k-pnc{fill:none;stroke:var(--mc-gold);stroke-width:3.8}
.mc-art .k-pnt{fill:#3A2A2A}
.mc-art .k-db{fill:#3A2F29}
.mc-art .k-dbt{fill:none;stroke:#54473F;stroke-width:1.3;stroke-linecap:round}
.mc-art .k-gs{fill:none;stroke:#A59C93;stroke-width:1.8;stroke-linecap:round}
.mc-art .k-dbr2{fill:none;stroke:#231C19;stroke-width:3.8;stroke-linecap:round}
.mc-art .k-br{fill:var(--mc-gold2)}
.mc-art .k-wx{fill:var(--mc-wax)}
.mc-art .k-wx2{fill:var(--mc-wax2)}
.mc-art .k-hrn{fill:var(--mc-hair)}
.mc-art .k-nzr{fill:var(--mc-navy)}
.mc-art .k-nzh{fill:var(--mc-wax)}
.mc-art .k-nza{fill:none;stroke:var(--mc-navy);stroke-width:7;stroke-linecap:round}
.mc-art .k-ew{fill:#fff}
.mc-art .k-ir{fill:#4A2C1C}
.mc-art .k-lash{fill:none;stroke:var(--mc-hair);stroke-width:1.4;stroke-linecap:round}
.mc-art .k-nbr{fill:none;stroke:var(--mc-hair);stroke-width:1.8;stroke-linecap:round}
.mc-art .k-nzm{fill:#8E3442}
.mc-art .k-nzb{fill:none;stroke:var(--mc-red);stroke-width:4.6;stroke-linecap:round}
.mc-art .k-rbn{fill:none;stroke:var(--mc-red);stroke-width:1.6;stroke-linecap:round}
.mc-art .mc-eye{transform-box:fill-box;transform-origin:center;transition:transform .07s}
.mc-art .mc-eyes{transition:transform .5s var(--ease-out,ease)}
.mc-art .mc-flo,.mc-art .mc-strk,.mc-art .mc-care{stroke-dasharray:1;stroke-dashoffset:1}
.mc-art .mc-imp{opacity:0;transform-box:fill-box;transform-origin:center}
.mc-art .mc-flip{transform-box:fill-box;transform-origin:0% 50%}
.mc-art .mc-mst{transform-box:fill-box;transform-origin:50% 40%}
.mc-art .mc-fig{transform-box:view-box;transform-origin:60px 136px}
.mc-art .mc-body{transform-box:view-box;transform-origin:60px 128px}
.mc-art .mc-head{transform-box:view-box;transform-origin:60px 74px}
.mc-art .mc-arm{transform-box:view-box;transform-origin:79px 85px}
.mc-art.e4 .mc-arm{transform-origin:79px 86px}
.mc-art.e5 .mc-arm{transform-origin:93px 100px}
.mc-art .mc-stp{transform-box:fill-box;transform-origin:50% 100%}
.mc-art .mc-nf{transform-box:view-box;transform-origin:50px 120px}
.mc-art .mc-nh{transform-box:view-box;transform-origin:50px 64px;transition:transform .4s var(--ease-out,ease)}
.mc-art .mc-nb{transform-box:view-box;transform-origin:71px 50px;animation:mc-sway 3.2s ease-in-out infinite}

/* overlay shell */
.mc{position:fixed;inset:0;z-index:var(--z-meclis,70);overflow-x:hidden;overflow-y:auto;overscroll-behavior:contain;color:var(--on-deep);
  display:grid;justify-items:center;align-content:start;
  padding:max(14px,env(safe-area-inset-top,0px)) var(--gutter,16px) max(20px,env(safe-area-inset-bottom,0px));
  font-family:var(--f-body);animation:mc-in .3s var(--ease-out) both}
@media (min-height:700px){.mc{align-content:center}}
.mc.out{animation:mc-out .28s var(--ease-in-out) forwards;pointer-events:none}
.mc-bg{position:fixed;inset:0;z-index:-1;pointer-events:none;
  background:radial-gradient(70% 48% at 50% 26%,color-mix(in srgb,var(--zafaran) 20%,transparent),transparent 72%),
    radial-gradient(130% 70% at 50% 120%,var(--deep-2),transparent 70%),linear-gradient(180deg,var(--deep) 0%,var(--deep-2) 100%)}
.mc-bg::before{content:"";position:absolute;inset:0;background:var(--gold-hi);opacity:.05;-webkit-mask:var(--m-field) 0 0/56px 56px repeat;mask:var(--m-field) 0 0/56px 56px repeat}
.mc-bg::after{content:"";position:absolute;inset:0;background:radial-gradient(120% 90% at 50% 40%,transparent 55%,rgba(0,0,0,.38))}
.mc-in{position:relative;width:min(760px,100%);min-width:0;display:grid;gap:14px}
.mc-h{display:flex;align-items:flex-start;gap:12px;min-width:0;animation:mc-rise .45s var(--ease-out) .05s both}
.mc-ht{flex:1;min-width:0;display:grid;gap:3px}
.mc-h .eyebrow{color:var(--gold-hi)}
.mc-h h2{margin:0;font-family:var(--f-display);font-weight:600;font-size:clamp(1.25rem,1.05rem + 1vw,1.75rem);line-height:1.15;letter-spacing:-.01em;color:var(--on-deep);text-wrap:balance;overflow-wrap:anywhere}
.mc .mc-x{flex:none;color:var(--on-deep);background:color-mix(in srgb,var(--on-deep) 8%,transparent);border-color:color-mix(in srgb,var(--on-deep) 18%,transparent)}
@media (hover:hover){.mc .mc-x:hover{background:color-mix(in srgb,var(--on-deep) 16%,transparent)}}
.mc :focus-visible{outline:2px solid var(--gold-hi);outline-offset:2px}
.mc:focus,.mc:focus-visible{outline:none}

/* stage */
.mc-stage{--k:.92;--ph:calc(clamp(10.5px,var(--k) * 11.5px,13.5px) * 1.75 + 2px);position:relative;justify-self:center;width:min(100%,max(300px,calc((100vh - 330px) * 1.5)));aspect-ratio:3/2;border-radius:var(--r-xl,24px);overflow:hidden;isolation:isolate;
  background:
    linear-gradient(180deg,transparent 54%,color-mix(in srgb,var(--gold-hi) 24%,transparent) 54%,color-mix(in srgb,var(--gold-hi) 24%,transparent) calc(54% + 1px),rgba(0,0,0,.14) calc(54% + 1px),rgba(0,0,0,.34) 100%),
    radial-gradient(44% 56% at 50% 36%,color-mix(in srgb,var(--zafaran) 30%,transparent),transparent 72%),
    linear-gradient(180deg,var(--deep-2),var(--deep));
  box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--zafaran) 34%,transparent),0 30px 60px -30px rgba(0,0,0,.6);
  animation:mc-rise .5s var(--ease-out) .08s both}
@supports (height:100dvh){.mc-stage{width:min(100%,max(300px,calc((100dvh - 330px) * 1.5)))}}
.mc-stage::before{content:"";position:absolute;inset:0 0 46% 0;z-index:-1;background:var(--gold-hi);opacity:.05;-webkit-mask:var(--m-field) 0 0/44px 44px repeat;mask:var(--m-field) 0 0/44px 44px repeat}
.mc-stage::after{content:"";position:absolute;inset:0;z-index:8;pointer-events:none;border-radius:inherit;box-shadow:inset 0 0 calc(var(--k) * 60px) rgba(0,0,0,.36)}
.mc-wall{position:absolute;inset:0 0 46% 0;pointer-events:none}
.mc-arch{position:absolute;left:50%;bottom:0;width:30%;height:auto;transform:translateX(-50%);opacity:0;transition:opacity .9s var(--ease-out)}
.mc.is-in .mc-arch{opacity:1}
.mc-arch .a-gl{fill:var(--gold-hi);opacity:.07}
.mc-arch .a-st{fill:none;stroke:var(--gold-hi);stroke-width:.9;opacity:.4}
.mc-arch .a-ln{fill:none;stroke:var(--gold-hi);stroke-width:.9;opacity:.4}
.mc-arch .a-lat{opacity:.55}
.mc-arch .a-fr{fill:none;stroke:var(--gold-hi);stroke-width:2.2;opacity:.42}
.mc-arch .a-fr2{fill:none;stroke:var(--gold-hi);stroke-width:1;opacity:.3}
.mc-lamp{position:absolute;top:0;width:6.5%;transform-origin:50% 0;animation:mc-swing 4.8s ease-in-out infinite}
.mc-lamp.l{left:13%}
.mc-lamp.r{right:13%;animation-delay:-2.4s}
.mc-lamp svg{display:block;width:100%;height:auto;overflow:visible}
.mc-lamp::after{content:"";position:absolute;left:50%;top:54%;width:300%;aspect-ratio:1;transform:translate(-50%,-50%);border-radius:50%;
  background:radial-gradient(closest-side,color-mix(in srgb,var(--gold-hi) 34%,transparent),transparent);animation:mc-flicker 2.8s ease-in-out infinite}
.mc-lamp .l-ch{fill:none;stroke:var(--gold-hi);stroke-width:1;opacity:.6}
.mc-lamp .l-cap{fill:var(--zafaran)}
.mc-lamp .l-body{fill:var(--gold-hi);opacity:.92}
.mc-lamp .l-fr{fill:none;stroke:var(--mc-gold2);stroke-width:1.1}

/* rug */
.mc-rug{position:absolute;left:5%;right:5%;bottom:2%;height:120%;z-index:1;pointer-events:none;transform-origin:50% 100%;transform:perspective(var(--mc-p,600px)) rotateX(61deg)}
.mc-rug-in{position:absolute;inset:0;border-radius:6px;overflow:hidden;clip-path:inset(0 0 100% 0);
  background:
    linear-gradient(var(--gold-hi),var(--gold-hi)) 0 3.4%/100% 2px no-repeat,
    linear-gradient(var(--gold-hi),var(--gold-hi)) 0 96.6%/100% 2px no-repeat,
    linear-gradient(var(--gold-hi),var(--gold-hi)) 2.4% 0/2px 100% no-repeat,
    linear-gradient(var(--gold-hi),var(--gold-hi)) 97.6% 0/2px 100% no-repeat,
    var(--rug);
  box-shadow:inset 0 0 0 3px color-mix(in srgb,var(--rug) 72%,#000)}
.mc-rug-in::before,.mc-rug-in::after{content:"";position:absolute;left:3.6%;right:3.6%;height:4.4%;background:var(--gold-hi);opacity:.62;
  -webkit-mask:var(--m-band) 0 50%/calc(var(--k) * 22px) 100% repeat-x;mask:var(--m-band) 0 50%/calc(var(--k) * 22px) 100% repeat-x}
.mc-rug-in::before{top:4.6%}
.mc-rug-in::after{bottom:4.6%}
.mc-rug-f{position:absolute;inset:10.5% 6.5%;border-radius:3px;background:color-mix(in srgb,var(--rug) 76%,var(--deep-2));box-shadow:0 0 0 1.5px color-mix(in srgb,var(--gold-hi) 55%,transparent),0 0 0 5px color-mix(in srgb,var(--rug) 90%,#000)}
.mc-rug-f::before{content:"";position:absolute;inset:0;background:var(--gold-hi);opacity:.2;-webkit-mask:var(--m-field) 50% 50%/calc(var(--k) * 36px) calc(var(--k) * 36px) repeat;mask:var(--m-field) 50% 50%/calc(var(--k) * 36px) calc(var(--k) * 36px) repeat}
.mc-rug-g{position:absolute;left:50%;top:50%;width:34%;aspect-ratio:1;transform:translate(-50%,-50%);background:var(--gold-hi);opacity:.6;-webkit-mask:var(--m-gul) center/contain no-repeat;mask:var(--m-gul) center/contain no-repeat}
.mc-rug-roll{position:absolute;left:-1.2%;right:-1.2%;top:0;height:8%;border-radius:999px;transform:translateY(-50%);opacity:0;
  background:linear-gradient(180deg,color-mix(in srgb,var(--rug) 55%,#000),var(--rug) 32%,color-mix(in srgb,var(--rug) 62%,var(--gold-hi)) 50%,var(--rug) 68%,color-mix(in srgb,var(--rug) 55%,#000))}
.mc-rug-fr{position:absolute;left:4.5%;right:4.5%;height:4%;opacity:0;transition:opacity .4s ease .85s;
  background:repeating-linear-gradient(90deg,color-mix(in srgb,var(--ivory) 70%,transparent) 0 1.5px,transparent 1.5px 4.5px)}
.mc-rug-fr.t{bottom:100%}
.mc-rug-fr.b{top:100%}
.mc.is-rug .mc-rug-in{clip-path:inset(0);transition:clip-path 1.05s var(--ease-out)}
.mc.is-rug .mc-rug-roll{animation:mc-roll 1.05s var(--ease-out) both}
.mc.is-rug .mc-rug-fr{opacity:.75}

/* elders */
.mc-elder{position:absolute;left:var(--x);bottom:calc(var(--b) + var(--ph) * .6);z-index:var(--z);width:22%;margin:0;padding:0;border:0;border-radius:14px;background:none;color:inherit;font:inherit;
  display:grid;justify-items:center;cursor:pointer;isolation:isolate;-webkit-tap-highlight-color:transparent;
  transform-origin:50% 100%;transform:translate(-50%,12%) scale(var(--s));opacity:0;
  transition:opacity .5s var(--ease-out),transform .55s var(--ease-spring)}
.mc-elder svg{display:block;width:100%;height:auto;overflow:visible;transition:filter .45s var(--ease-out)}
.mc-elder::before{content:"";position:absolute;left:50%;bottom:4%;z-index:-1;width:136%;height:46%;transform:translateX(-50%);border-radius:50%;pointer-events:none;
  background:radial-gradient(closest-side,color-mix(in srgb,var(--gold-hi) 50%,transparent),transparent);opacity:0;transition:opacity .4s var(--ease-out)}
.mc.is-elders .mc-elder{opacity:1;transform:translate(-50%,0) scale(var(--s))}
.mc.is-elders:not(.is-ready) .mc-elder{transition-delay:calc(var(--i) * 110ms)}
.mc.is-elders .mc-elder.is-on{transform:translate(-50%,-3%) scale(calc(var(--s) * 1.07))}
.mc-elder.is-on::before{opacity:1}
.mc.is-work .mc-elder:not(.is-on) svg{filter:brightness(.74) saturate(.86)}
.mc-plate{position:absolute;left:var(--x);bottom:var(--b);z-index:7;transform:translateX(-50%);display:inline-flex;align-items:center;gap:.35em;padding:.3em .66em;border-radius:999px;white-space:nowrap;pointer-events:none;
  font:600 clamp(10.5px,var(--k) * 11.5px,13.5px)/1.15 var(--f-body);letter-spacing:.01em;color:var(--on-deep-soft);
  background:color-mix(in srgb,var(--deep-2) 86%,transparent);border:1px solid color-mix(in srgb,var(--zafaran) 32%,transparent);opacity:0;
  transition:opacity .5s var(--ease-out),color .3s,background .3s,border-color .3s,box-shadow .3s}
.mc-plate b{font-weight:600}
.mc.is-elders .mc-plate{opacity:1}
.mc.is-elders:not(.is-ready) .mc-plate{transition-delay:calc(var(--i) * 110ms + .15s)}
@media (max-width:560px){.mc-plate.p1{transform:translateX(-38%)}.mc-plate.p5{transform:translateX(-62%)}}
.mc-plate.is-on{color:var(--deep-2);background:var(--gold-hi);border-color:var(--gold-hi);box-shadow:0 0 18px color-mix(in srgb,var(--gold-hi) 55%,transparent)}
.mc-plate.is-done,.mc-plate.is-warn{color:var(--on-deep)}
.mc-tick{display:none;width:1.3em;height:1.3em;flex:none;border-radius:50%;place-items:center;background:var(--mc-ok);color:var(--deep-2);font-style:normal;font-weight:800;font-size:1em;line-height:1}
.mc-tick svg{width:72%;height:72%}
.mc-plate.is-done .mc-tick,.mc-plate.is-warn .mc-tick{display:grid;animation:mc-pop .5s var(--ease-spring) both}
.mc-plate.is-warn .mc-tick{background:var(--zafaran)}
.mc-plate.is-warn .mc-tick svg{display:none}
.mc-plate.is-warn .mc-tick::after{content:"!";font-size:.82em}

/* idle life */
.mc-elder .mc-body{animation:mc-breath 4.2s ease-in-out infinite;animation-delay:calc(var(--i) * -.83s)}
.mc-elder .mc-head{animation:mc-bob 4.2s ease-in-out infinite;animation-delay:calc(var(--i) * -.83s)}
.mc-elder.blink .mc-eye,.mc-nz.blink .mc-eye{transform:scaleY(.12)}
.mc-elder.mc-e1 .mc-eyes{transform:translate(1.1px,.5px)}
.mc-elder.mc-e2 .mc-eyes{transform:translate(.7px,.6px)}
.mc-elder.mc-e3 .mc-eyes{transform:translate(0,1px)}
.mc-elder.mc-e4 .mc-eyes{transform:translate(-.7px,.6px)}
.mc-elder.mc-e5 .mc-eyes{transform:translate(-1.1px,.5px)}
.mc.is-elders .mc-elder .mc-fig{animation:mc-bow .9s ease-in-out both;animation-delay:calc(var(--i) * 110ms + .4s)}
.mc.is-ready .mc-elder .mc-fig{animation:none}

/* work — 1 Lüğətçi flips pages */
.mc .mc-e1.is-on .mc-flip{animation:mc-flip .9s var(--ease-in-out) infinite}
.mc .mc-e1.is-on .mc-head{animation:mc-read 1.8s ease-in-out infinite}
.mc .mc-e1.is-on .mc-eyes{transform:translate(.5px,1.7px)}
/* 2 Mənaçı sweeps the magnifier */
.mc .mc-e2.is-on .mc-arm{animation:mc-sweep 1.6s ease-in-out infinite}
.mc .mc-e2.is-on .mc-glint{animation:mc-glint 1.6s ease-in-out infinite}
.mc .mc-e2.is-on .k-gbr{transform:translateY(-1.6px)}
.mc .mc-e2.is-on .mc-eyes{transform:translate(.6px,1.4px)}
/* 3 Üslubçu writes with a flourish */
.mc .mc-e3.is-on .mc-arm{animation:mc-write 1.7s ease-in-out infinite}
.mc .mc-e3.is-on .mc-flo{animation:mc-draw 1.7s ease-out infinite}
.mc .mc-e3.is-on .mc-mst{animation:mc-twitch 1.7s ease-in-out infinite}
.mc .mc-e3.is-on .mc-eyes{transform:translate(-.4px,1.5px)}
.mc .mc-e3.is-done .mc-flo,.mc .mc-e3.is-warn .mc-flo{stroke-dashoffset:0}
/* 4 Dilçi Nənə marks a red correction */
.mc .mc-e4.is-on .mc-arm{animation:mc-mark 2.2s ease-in-out infinite}
.mc .mc-e4.is-on .mc-strk{animation:mc-strk 2.2s ease-in-out infinite}
.mc .mc-e4.is-on .mc-care{animation:mc-care 2.2s ease-in-out infinite}
.mc .mc-e4.is-on .mc-head{animation:mc-peer 2.2s ease-in-out infinite}
.mc .mc-e4.is-on .mc-eyes{transform:translate(.3px,1.6px)}
.mc .mc-e4.is-done .mc-strk,.mc .mc-e4.is-done .mc-care,.mc .mc-e4.is-warn .mc-strk,.mc .mc-e4.is-warn .mc-care{stroke-dashoffset:0}
/* 5 Möhürdar raises and stamps the seal */
.mc .mc-e5.is-on .mc-arm{animation:mc-raise 1.9s cubic-bezier(.5,0,.3,1) infinite}
.mc .mc-e5.is-on .mc-stp{animation:mc-squash 1.9s ease-out infinite}
.mc .mc-e5.is-on .mc-fig{animation:mc-thud 1.9s ease-out infinite}
.mc .mc-e5.is-on .mc-imp{animation:mc-imp .5s var(--ease-spring) 1.37s both}
.mc .mc-e5.is-on .mc-eyes{transform:translate(.8px,1.2px)}
.mc .mc-e5.is-done .mc-imp,.mc .mc-e5.is-warn .mc-imp{opacity:1}
/* tap + verdict */
.mc .mc-elder.is-poke .mc-fig{animation:mc-poke .5s var(--ease-spring)}
.mc.is-verdict .mc-elder .mc-head{animation:mc-nod .75s ease-in-out 2,mc-bob 4.2s ease-in-out 1.6s infinite}
.mc.is-verdict .mc-elder .mc-eyes{transform:translate(0,0)}

/* tumar (the scroll on the rug) */
.mc-tumar{position:absolute;left:50%;bottom:16%;z-index:4;width:33%;pointer-events:none;opacity:0;transform-origin:50% 100%;
  transform:translate(-50%,0) perspective(var(--mc-p,600px)) rotateX(40deg) scale(1)}
.mc-tumar svg{display:block;width:100%;height:auto;overflow:visible}
.mc-tumar.is-in{animation:mc-tumar-in .7s var(--ease-out) both}
.mc-tsvg .k-pl{stroke-width:2.2}
.mc-tsvg .t-pg{transform-box:fill-box;transform-origin:50% 50%;transform:scaleX(.05);transition:transform .75s var(--ease-out)}
.mc-tsvg .t-rl{transform:translateX(84px);transition:transform .75s var(--ease-out)}
.mc-tsvg .t-rr{transform:translateX(-84px);transition:transform .75s var(--ease-out)}
.mc-tumar.is-open .t-pg,.mc-tumar.is-open .t-rl,.mc-tumar.is-open .t-rr{transform:none}
.mc-tsvg .t-edge{fill:none;stroke:var(--mc-paper2);stroke-width:3}
.mc-tsvg .t-ttl{fill:none;stroke:var(--mc-wax);stroke-width:3.4;stroke-linecap:round}
.mc-tsvg .t-cap{fill:var(--mc-gold)}
.mc-tsvg .mk{fill:none;stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1;stroke-dashoffset:1;transition:stroke-dashoffset .6s var(--ease-out)}
.mc-tsvg .mk1{stroke:var(--mc-gold2)}
.mc-tsvg .mk2{stroke:var(--mc-okd)}
.mc-tsvg .mk3{stroke:var(--mc-ink)}
.mc-tsvg .mk4{stroke:var(--mc-red)}
.mc-tsvg .mk5{opacity:0;transform-box:fill-box;transform-origin:center;transform:scale(1.9);transition:opacity .2s,transform .4s var(--ease-spring)}
.mc-tumar.m1 .mk1,.mc-tumar.m2 .mk2,.mc-tumar.m3 .mk3,.mc-tumar.m4 .mk4{stroke-dashoffset:0}
.mc-tumar.m5 .mk5{opacity:1;transform:none}

/* Nuanza */
.mc-nz{position:absolute;left:69%;bottom:1.5%;z-index:6;width:13%;min-width:44px;opacity:0;transform:translateX(-50%);cursor:pointer;-webkit-tap-highlight-color:transparent}
.mc.is-nz .mc-nz{opacity:1;animation:mc-walkin 1.35s var(--ease-out) both}
.mc-nz::after{content:"";position:absolute;left:14%;right:14%;bottom:-1.5%;height:6%;z-index:-1;border-radius:50%;background:rgba(0,0,0,.32)}
.mc-nz-in{position:relative;transform-origin:50% 100%}
.mc.is-nz .mc-nz-in{animation:mc-step .34s ease-in-out 4 alternate}
.mc-mc-nf{position:relative;width:100%;aspect-ratio:100/124;display:flex;align-items:flex-end;justify-content:center}
.mc-mc-nf > *{position:relative!important;inset:auto!important;width:100%!important;max-width:none!important;margin:0!important}
.mc-mc-nf > svg{display:block;height:auto}
.mc-mc-nf.has-nz{aspect-ratio:auto;display:block}
.mc-mc-nf.has-nz + .mc-nz-scr{top:72%}
.mc-nzfb.st-celebrate .mc-nf,.mc-nzfb.st-success .mc-nf{animation:mc-jump .7s var(--ease-spring) 2}
.mc-nzfb.st-read .mc-nh,.mc-nzfb.st-think .mc-nh{transform:rotate(-5deg)}
.mc-nzfb.st-point .mc-nh{transform:rotate(4deg)}
.mc-nzfb.st-worried .mc-nh{transform:rotate(6deg) translateY(1px)}
.mc-nz-scr{position:absolute;left:6%;right:6%;top:69%;z-index:2;transition:opacity .25s,transform .3s var(--ease-out)}
.mc-nz-scr svg{display:block;width:100%;height:auto}
.mc-nz.gave .mc-nz-scr{opacity:0;transform:translateY(-40%) scale(.5)}
.mc-nz.is-poke .mc-nz-in{animation:mc-poke .5s var(--ease-spring)}

/* bubble */
.mc-bub{position:absolute;left:0;top:0;z-index:9;max-width:min(250px,74%);padding:8px 12px;border-radius:14px;background:var(--surface);color:var(--ink);
  font-size:var(--fs-sm,.8125rem);line-height:1.4;box-shadow:var(--sh-2);pointer-events:none;opacity:0;transform:translateY(4px) scale(.96);transform-origin:var(--ax,50%) 100%;
  transition:opacity .18s,transform .24s var(--ease-spring)}
.mc-bub.on{opacity:1;transform:none}
.mc-bub b{display:block;margin-bottom:1px;font-size:var(--fs-xs,.75rem);font-weight:600;color:var(--nar)}
.mc-bub::after{content:"";position:absolute;top:calc(100% - 1px);left:var(--ax,50%);width:12px;height:7px;transform:translateX(-50%);background:var(--surface);clip-path:polygon(0 0,100% 0,50% 100%)}

/* status panel */
.mc-panel{display:grid;gap:12px;min-width:0}
.mc-run{display:grid;gap:12px;padding:14px 16px;border-radius:var(--r-lg,18px);
  background:color-mix(in srgb,var(--deep-2) 74%,transparent);border:1px solid color-mix(in srgb,var(--zafaran) 30%,transparent);
  box-shadow:0 18px 40px -24px rgba(0,0,0,.6);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);animation:mc-rise .5s var(--ease-out) .16s both}
.mc-prog{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px}
.mc-prog i{display:block;height:4px;border-radius:999px;overflow:hidden;background:color-mix(in srgb,var(--on-deep) 14%,transparent)}
.mc-prog b{display:block;width:0;height:100%;border-radius:inherit;background:var(--gold-hi)}
.mc-prog i.ok b{width:100%;background:var(--mc-ok)}
.mc-prog i.warn b{width:100%;background:var(--zafaran)}
.mc-now{display:flex;align-items:center;gap:12px;min-width:0}
.mc-av{flex:none;width:46px;height:46px;border-radius:50%;overflow:hidden;display:grid;place-items:center;
  background:radial-gradient(circle at 50% 30%,color-mix(in srgb,var(--gold-hi) 22%,transparent),color-mix(in srgb,var(--on-deep) 6%,transparent));
  box-shadow:inset 0 0 0 1.5px color-mix(in srgb,var(--gold-hi) 60%,transparent)}
.mc-av svg{display:block;width:100%;height:100%}
.mc-av.pop{animation:mc-pop .45s var(--ease-spring)}
.mc-star-av{width:70%!important;height:70%!important}
.mc-star-av .s1{fill:var(--nar);stroke:var(--zafaran);stroke-width:1.2;stroke-linejoin:round}
.mc-star-av .s2{fill:var(--ivory);stroke:var(--zafaran);stroke-width:1.2}
.mc-star-av .s3{fill:var(--deep)}
.mc-now-tx{flex:1;min-width:0;display:grid;gap:1px}
.mc-now-tx b{font-family:var(--f-display);font-size:var(--fs-md,1.0625rem);font-weight:600;line-height:1.2;color:var(--on-deep)}
.mc-now-tx small{font-size:var(--fs-xs,.75rem);color:var(--on-deep-soft);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mc-cnt{flex:none;font-size:var(--fs-sm,.8125rem);font-weight:600;color:var(--gold-hi);font-variant-numeric:tabular-nums}
.mc-line{display:flex;align-items:flex-start;gap:9px;min-height:2.95em;margin:0;font-size:var(--fs-base,.9375rem);line-height:1.45;color:var(--on-deep)}
.mc-li{display:none;flex:none;width:20px;height:20px;margin-top:1px;border-radius:50%;place-items:center;color:var(--deep-2);font-weight:800;font-size:.8rem}
.mc-li svg{width:13px;height:13px}
.mc-line.ok .mc-li{display:grid;background:var(--mc-ok);animation:mc-pop .4s var(--ease-spring) both}
.mc-line.warn .mc-li{display:grid;background:var(--zafaran);animation:mc-pop .4s var(--ease-spring) both}
.mc-line.warn .mc-li svg{display:none}
.mc-line.warn .mc-li::after{content:"!"}
.mc-lt{min-width:0}
.mc-dots{display:inline-flex;gap:3px;margin-left:5px;vertical-align:middle;white-space:nowrap}
.mc-dots i{width:4px;height:4px;border-radius:50%;background:var(--gold-hi);animation:mc-dot 1.1s ease-in-out infinite}
.mc-dots i:nth-child(2){animation-delay:.15s}
.mc-dots i:nth-child(3){animation-delay:.3s}
.mc-line.ok .mc-dots,.mc-line.warn .mc-dots{display:none}
.mc-run-f{display:flex;align-items:center;justify-content:space-between;gap:10px}
.mc-hint{font-size:var(--fs-xs,.75rem);color:var(--on-deep-soft)}
.mc .mc-hint .kbd{background:transparent;color:var(--on-deep-soft);border-color:color-mix(in srgb,var(--on-deep) 24%,transparent);box-shadow:none}
@media (hover:none){.mc-hint{visibility:hidden}}
.mc .mc-skip{--btn-bg:transparent;--btn-bg-h:color-mix(in srgb,var(--on-deep) 12%,transparent);--btn-ink:var(--on-deep);--btn-bd:color-mix(in srgb,var(--on-deep) 22%,transparent);box-shadow:none}

/* verdict */
.mc-v{position:relative;overflow:visible;display:grid;gap:14px;padding:22px 20px 18px;color:var(--ink);text-align:left;animation:mc-rise .5s var(--ease-out) both}
.mc-v.is-hit{animation:mc-hit .34s ease-out}
.mc-v-top{display:flex;flex-wrap:wrap;align-items:center;gap:4px 12px;padding-right:74px}
.mc-v-dt{font-size:var(--fs-xs,.75rem);color:var(--soft);font-variant-numeric:tabular-nums}
.mc-v-main{display:flex;flex-wrap:wrap;align-items:center;gap:16px 20px}
.mc-v-score{flex:none;display:grid;place-items:center}
.mc-v-score .ring{--size:112px}
.mc-v-tx{flex:1 1 190px;min-width:0;display:grid;gap:6px}
.mc-v-h{margin:0;font-family:var(--f-display);font-size:var(--fs-xl,1.5rem);font-weight:600;line-height:1.15;letter-spacing:-.01em;color:var(--ok)}
.mc-v-h.mid{color:var(--zafaran-ink)}
.mc-v-h.low{color:var(--nar)}
.mc-v-tx p{margin:0;color:var(--soft);line-height:1.5}
.mc-v-sig{display:flex;flex-wrap:wrap;align-items:center;gap:10px 14px;padding-top:12px;border-top:1px dashed var(--line-2,var(--line))}
.mc-v-sl{font-size:.6875rem;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--soft)}
.mc-v-avs{display:flex;flex-wrap:wrap;gap:8px}
.mc-sig{position:relative;width:36px;height:36px;border-radius:50%;background:var(--surface2);box-shadow:inset 0 0 0 1px var(--line);animation:mc-pop .45s var(--ease-spring) both;animation-delay:calc(var(--i) * 80ms + .35s)}
.mc-sig > svg{display:block;width:100%;height:100%;border-radius:50%}
.mc-sig i{position:absolute;right:-3px;bottom:-3px;width:16px;height:16px;border-radius:50%;display:grid;place-items:center;background:var(--ok);color:var(--surface);box-shadow:0 0 0 2px var(--surface);font-style:normal;font-weight:800;font-size:.66rem;line-height:1}
.mc-sig i svg{width:10px;height:10px}
.mc-sig.warn i{background:var(--zafaran)}
.mc-seal{position:absolute;top:-24px;right:-10px;width:92px;height:92px;opacity:0;transform:rotate(-12deg);pointer-events:none;filter:drop-shadow(0 6px 8px rgba(0,0,0,.32))}
.mc-seal svg{display:block;width:100%;height:100%;overflow:visible}
.mc-seal::before{content:"";position:absolute;inset:-18%;border-radius:50%;background:radial-gradient(closest-side,color-mix(in srgb,var(--mc-wax) 42%,transparent),transparent);opacity:0;transform:scale(.4)}
.mc-seal.is-stamp{animation:mc-stamp .62s cubic-bezier(.5,0,.25,1) both}
.mc-seal.is-stamp::before{animation:mc-splash .7s ease-out .3s backwards}
.mc-seal .s-blob{fill:var(--mc-wax)}
.mc-seal .s-pool{fill:#B32D45}
.mc-seal .s-ring{fill:none;stroke:var(--mc-wax2);stroke-width:2}
.mc-seal .s-tx{fill:var(--mc-wax2);font:700 8.2px/1 var(--f-body);letter-spacing:.06em}
.mc-seal .s-star{fill:var(--mc-wax2);stroke:var(--mc-wax3);stroke-width:1.1;stroke-linejoin:round}
.mc-seal .s-core{fill:#B32D45;stroke:var(--mc-wax2);stroke-width:1.2}
.mc-seal .s-star2{fill:var(--mc-wax2)}
.mc-seal .s-hl{fill:#fff;opacity:.2}
.mc-v-act{display:flex;justify-content:flex-end;gap:10px;animation:mc-rise .5s var(--ease-out) .25s both}
.mc-v-act .btn{min-width:168px}
@media (max-width:520px){.mc-v-act .btn{flex:1}}
@media (max-width:420px){.mc-seal{width:76px;height:76px;top:-20px;right:-6px}.mc-v-top{padding-right:62px}.mc-v-score .ring{--size:100px}}
.mc-pt{position:fixed;z-index:12;width:9px;height:9px;margin:-4.5px 0 0 -4.5px;border-radius:50%;pointer-events:none;background:var(--mc-wax);animation:mc-pt .8s var(--ease-out) forwards}
.mc-pt.star{width:12px;height:12px;margin:-6px 0 0 -6px;border-radius:0;background:var(--gold-hi);-webkit-mask:var(--m-star) center/contain no-repeat;mask:var(--m-star) center/contain no-repeat}

/* desktop: scene + side panel */
@media (min-width:1080px){
  .mc-in{width:min(1140px,100%);grid-template-columns:minmax(0,1fr) 360px;grid-template-areas:"h h" "s p";column-gap:24px;row-gap:16px}
  .mc-h{grid-area:h}
  .mc-stage{grid-area:s;width:min(100%,max(300px,calc((100vh - 150px) * 1.5)))}
  .mc-panel{grid-area:p;align-self:center}
  .mc-v-act .btn{flex:1}
}
@supports (height:100dvh){@media (min-width:1080px){.mc-stage{width:min(100%,max(300px,calc((100dvh - 150px) * 1.5)))}}}

/* reduced motion — fades only */
.mc.mc-rm .mc-elder{transform:translate(-50%,0) scale(var(--s))!important;transition:opacity .45s ease!important}
.mc.mc-rm .mc-nz{animation:none!important;transition:opacity .45s ease}
.mc.mc-rm .mc-rug{opacity:0;transition:opacity .5s ease}
.mc.mc-rm.is-rug .mc-rug{opacity:1}
.mc.mc-rm .mc-rug-in{clip-path:none!important}
.mc.mc-rm .mc-rug-roll{display:none}
.mc.mc-rm .mc-tumar.is-in{animation:mc-fade .45s ease both!important}
.mc.mc-rm .mc-seal.is-stamp{animation:mc-fade .45s ease both!important}
.mc.mc-rm .mc-v,.mc.mc-rm .mc-v.is-hit{animation:mc-fade .4s ease both!important}

@keyframes mc-in{from{opacity:0}to{opacity:1}}
@keyframes mc-out{to{opacity:0}}
@keyframes mc-fade{from{opacity:0}to{opacity:1}}
@keyframes mc-rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
@keyframes mc-pop{0%{opacity:0;transform:scale(.3)}100%{opacity:1;transform:scale(1)}}
@keyframes mc-breath{0%,100%{transform:scale(1,1)}50%{transform:scale(1.012,1.022)}}
@keyframes mc-bob{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(.8px) rotate(-1.2deg)}}
@keyframes mc-bow{0%,100%{transform:none}38%{transform:translateY(2px) scale(1.02,.95)}62%{transform:translateY(-1px) scale(.99,1.02)}}
@keyframes mc-read{0%,100%{transform:rotate(1deg) translateY(1px)}50%{transform:rotate(3deg) translateY(2px)}}
@keyframes mc-flip{0%{transform:scaleX(1);fill:var(--mc-paper);opacity:1}46%{transform:scaleX(.08) skewY(-9deg);fill:var(--mc-paper2)}54%{transform:scaleX(-.08) skewY(9deg);fill:var(--mc-paper2)}90%{transform:scaleX(-1);fill:var(--mc-paper);opacity:1}100%{transform:scaleX(-1);opacity:0}}
@keyframes mc-sweep{0%,100%{transform:rotate(-8deg)}50%{transform:translateX(-9px) rotate(14deg)}}
@keyframes mc-glint{0%,30%,100%{opacity:0}45%{opacity:.95}60%{opacity:0}}
@keyframes mc-write{0%{transform:none}12%{transform:translate(-6px,1px) rotate(4deg)}24%{transform:translate(-3px,0) rotate(-3deg)}36%{transform:translate(-1px,1px) rotate(4deg)}48%{transform:translate(1px,0) rotate(-2deg)}60%{transform:translate(2px,-1px) rotate(3deg)}72%{transform:translate(3px,-5px) rotate(-16deg)}86%{transform:translate(0,-1px) rotate(-4deg)}100%{transform:none}}
@keyframes mc-draw{0%,6%{stroke-dashoffset:1}68%,100%{stroke-dashoffset:0}}
@keyframes mc-twitch{0%,60%,100%{transform:none}68%{transform:scaleX(1.07) rotate(-2deg)}76%{transform:scaleX(.97) rotate(2deg)}}
@keyframes mc-mark{0%{transform:translate(0,-3px)}14%{transform:translate(-4px,2.1px)}34%{transform:translate(13.5px,1.1px)}42%{transform:translate(13px,-3px)}52%{transform:translate(1px,-.5px)}61%{transform:translate(4px,-5px)}70%{transform:translate(7px,-.9px)}80%{transform:translate(8px,-6px)}100%{transform:translate(0,-3px)}}
@keyframes mc-strk{0%,14%{stroke-dashoffset:1}34%,100%{stroke-dashoffset:0}}
@keyframes mc-care{0%,52%{stroke-dashoffset:1}70%,100%{stroke-dashoffset:0}}
@keyframes mc-peer{0%,100%{transform:rotate(2deg) translateY(1px)}50%{transform:rotate(4deg) translateY(2px)}}
@keyframes mc-raise{0%{transform:none}20%{transform:translateY(2.5px)}46%{transform:translateY(-18px) rotate(-5deg)}64%{transform:translateY(-19px) rotate(-3deg)}72%{transform:translateY(5px)}78%{transform:translateY(3px)}90%,100%{transform:none}}
@keyframes mc-squash{0%,70%{transform:none}73%{transform:scale(1.14,.84)}82%{transform:scale(.97,1.04)}90%,100%{transform:none}}
@keyframes mc-thud{0%,70%,100%{transform:none}73%{transform:translateY(1.2px) scale(1.006,.99)}80%{transform:none}}
@keyframes mc-imp{0%{opacity:0;transform:scale(.4)}100%{opacity:1;transform:scale(1)}}
@keyframes mc-nod{0%,100%{transform:none}40%{transform:translateY(2.4px) rotate(1deg)}}
@keyframes mc-poke{0%,100%{transform:none}30%{transform:scale(1.05,.93)}65%{transform:scale(.97,1.04)}}
@keyframes mc-walkin{from{transform:translateX(calc(-50% + 340%))}to{transform:translateX(-50%)}}
@keyframes mc-step{from{transform:translateY(0) rotate(-2.5deg)}to{transform:translateY(-6%) rotate(2.5deg)}}
@keyframes mc-jump{0%{transform:none}20%{transform:scale(1.06,.92)}50%{transform:translateY(-16px) scale(.96,1.05)}80%{transform:scale(1.03,.97)}100%{transform:none}}
@keyframes mc-sway{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(4deg)}}
@keyframes mc-tumar-in{
  0%{opacity:0;transform:translate(calc(-50% + var(--fx,0px)),var(--fy,0px)) perspective(var(--mc-p,600px)) rotateX(0deg) scale(.3)}
  18%{opacity:1}
  55%{transform:translate(calc(-50% + var(--fx,0px) * .38),calc(var(--fy,0px) * .38 - 26px)) perspective(var(--mc-p,600px)) rotateX(16deg) scale(.6)}
  100%{opacity:1;transform:translate(-50%,0) perspective(var(--mc-p,600px)) rotateX(40deg) scale(1)}}
@keyframes mc-roll{0%{top:0;height:10%;opacity:1}86%{opacity:1}100%{top:100%;height:3%;opacity:0}}
@keyframes mc-swing{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}
@keyframes mc-flicker{0%,100%{opacity:.85}30%{opacity:1}55%{opacity:.75}80%{opacity:.95}}
@keyframes mc-dot{0%,100%{opacity:.3;transform:translateY(0)}40%{opacity:1;transform:translateY(-2px)}}
@keyframes mc-stamp{0%{opacity:0;transform:translate(-14px,-70px) scale(2.3) rotate(-30deg)}55%{opacity:1;transform:translate(0,0) scale(.9,.78) rotate(-12deg)}74%{transform:scale(1.07,1.03) rotate(-12deg)}100%{opacity:1;transform:rotate(-12deg)}}
@keyframes mc-splash{0%{opacity:.9;transform:scale(.4)}100%{opacity:0;transform:scale(1.5)}}
@keyframes mc-hit{0%,100%{transform:none}30%{transform:translateY(3px)}60%{transform:translateY(-1px)}}
@keyframes mc-pt{from{opacity:1;transform:translate(0,0) scale(1)}to{opacity:0;transform:translate(var(--dx),var(--dy)) scale(.4) rotate(var(--r,0deg))}}
`;
  function injectCss() {
    if (D.getElementById('css-meclis')) return;
    try { if (W.App && typeof W.App.css === 'function') { W.App.css('meclis', CSS); if (D.getElementById('css-meclis')) return; } } catch (e) { /* fall through */ }
    var st = D.createElement('style'); st.id = 'css-meclis'; st.textContent = CSS;
    (D.head || D.documentElement).appendChild(st);
  }

  /* ------------------------------------------------------------------
     verdict + per-elder results
     ------------------------------------------------------------------ */
  function sealOf(s) { return s >= 85 ? 'Təhvilə hazırdır' : s >= 70 ? 'Düzəlişlərlə qəbul' : 'Yenidən işlənməli'; }
  function normVerdict(v) {
    v = v && typeof v === 'object' ? v : (typeof v === 'string' ? { text: v } : {});
    var out = {}, k;
    for (k in v) if (Object.prototype.hasOwnProperty.call(v, k)) out[k] = v[k];
    if (out.score == null && v.verdict && v.verdict.score != null) out.score = v.verdict.score;
    if (out.score != null && out.score !== '') out.score = clamp(Math.round(Number(out.score) || 0), 0, 100); else out.score = null;
    if (!out.text) out.text = v.summary || (out.score != null ? (out.score >= 85 ? 'Məclis razıdır: mətn təhvilə hazırdır.' : out.score >= 70 ? 'Bir neçə düzəlişdən sonra təhvil verilə bilər.' : 'Məclis yenidən işlənməsini tövsiyə edir.') : 'Məclis işini bitirdi.');
    if (!out.seal) out.seal = out.score != null ? sealOf(out.score) : 'Təsdiq olundu';
    return out;
  }
  function results(v) {
    var out = ELDERS.map(function (e) { return { warn: false, line: e.done }; });
    var errs = Array.isArray(v.errors) ? v.errors : (Array.isArray(v.issues) ? v.issues : null);
    if (errs && errs.length) {
      var buckets = [[], [], [], [], []];
      errs.forEach(function (er) {
        if (!er || typeof er !== 'object') return;
        var k = TYPE_TO[er.type || er.kind || er.category];
        if (k == null) k = 1;
        buckets[k].push(er);
      });
      buckets.forEach(function (b, i) {
        if (!b.length) return;
        var f = b[0], ex = (f.was && f.now) ? ': «' + f.was + '» → «' + f.now + '»' : '.';
        out[i] = { warn: true, line: ELDERS[i].warnN(b.length) + ex };
      });
      return out;
    }
    var s = v.score;
    if (s == null || s >= 85) return out;
    out[1] = { warn: true, line: ELDERS[1].warn };
    out[3] = { warn: true, line: ELDERS[3].warn };
    if (s < 70) {
      out[0] = { warn: true, line: ELDERS[0].warn };
      out[2] = { warn: true, line: ELDERS[2].warn };
      out[4] = { warn: false, line: 'Rəqəmləri saydım. Möhür vuruldu: «Yenidən işlənməli».' };
    }
    return out;
  }
  function durationsOf(d, rm) {
    var def = rm ? [650, 650, 650, 650, 650] : [1500, 1450, 1550, 2000, 1800];
    if (typeof d === 'number' && isFinite(d)) return def.map(function () { return clamp(d, 300, 8000); });
    if (Array.isArray(d) && d.length) return def.map(function (x, i) { var n = Number(d[i]); return isFinite(n) && n > 0 ? clamp(n, 300, 8000) : x; });
    return def;
  }

  /* ------------------------------------------------------------------
     session plumbing
     ------------------------------------------------------------------ */
  function later(S, fn, ms) { var t = setTimeout(function () { if (!S.closed) fn(); }, ms); S.timers.push(t); return t; }
  function wait(S, ms) {
    return new Promise(function (res) {
      if (S.closed || S.skip || ms <= 0) { res(); return; }
      var w = { r: res };
      w.t = setTimeout(function () { var i = S.waits.indexOf(w); if (i >= 0) S.waits.splice(i, 1); res(); }, ms);
      S.waits.push(w);
    });
  }
  function flush(S) { S.waits.splice(0).forEach(function (w) { clearTimeout(w.t); w.r(); }); }
  function frame() { return new Promise(function (r) { (W.requestAnimationFrame || setTimeout)(function () { (W.requestAnimationFrame || setTimeout)(r); }); }); }
  function q(root, sel) { return root.querySelector(sel); }

  function fit(S) {
    var w = S.stage.clientWidth || 360;
    S.stage.style.setProperty('--k', (w / 400).toFixed(3));
    S.stage.style.setProperty('--mc-p', Math.round(w * 1.5) + 'px');
  }

  function build(S) {
    var tid = 'mc-t-' + S.id;
    var elders = ELDERS.map(function (e, i) {
      var p = SEATS[i];
      return '<button type="button" class="mc-elder mc-e' + (i + 1) + ' motion-safe" data-i="' + i + '" style="--x:' + p.x + '%;--b:' + p.b + '%;--s:' + p.s + ';--z:' + p.z + ';--i:' + p.i + '" aria-label="' + esc(e.name + ' — ' + e.role) + '">' +
        figure(i) + '</button>';
    }).join('');
    var plates = ELDERS.map(function (e, i) {
      var p = SEATS[i];
      return '<span class="mc-plate p' + (i + 1) + ' motion-safe" aria-hidden="true" style="--x:' + p.x + '%;--b:' + p.b + '%;--i:' + p.i + '"><i class="mc-tick">' + IC.check + '</i><b>' + esc(e.short) + '</b></span>';
    }).join('');
    var root = D.createElement('div');
    root.className = 'mc motion-safe' + (S.rm ? ' mc-rm' : '');
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-labelledby', tid);
    root.setAttribute('tabindex', '-1');
    root.innerHTML =
      '<div class="mc-bg" aria-hidden="true"></div>' +
      '<div class="mc-in">' +
        '<header class="mc-h"><div class="mc-ht"><span class="eyebrow">Mirzə Məclisi</span><h2 id="' + tid + '">' + esc(S.title) + '</h2></div>' +
          '<button type="button" class="icon-btn mc-x" aria-label="Bağla">' + icon('x') + '</button></header>' +
        '<div class="mc-stage">' +
          '<div class="mc-wall" aria-hidden="true">' + archSvg() + '<span class="mc-lamp l">' + lampSvg() + '</span><span class="mc-lamp r">' + lampSvg() + '</span></div>' +
          '<div class="mc-rug motion-safe" aria-hidden="true"><div class="mc-rug-in"><i class="mc-rug-f"></i><i class="mc-rug-g"></i></div><i class="mc-rug-roll"></i><i class="mc-rug-fr t"></i><i class="mc-rug-fr b"></i></div>' +
          elders + plates +
          '<div class="mc-tumar motion-safe" aria-hidden="true">' + tumarSvg() + '</div>' +
          '<div class="mc-nz motion-safe" aria-hidden="true"><div class="mc-nz-in"><div class="mc-mc-nf"></div><div class="mc-nz-scr">' + NZ_SCROLL + '</div></div></div>' +
          '<div class="mc-bub" aria-hidden="true"></div>' +
        '</div>' +
        '<div class="mc-panel">' +
          '<div class="mc-run">' +
            '<div class="mc-prog" aria-hidden="true"><i><b></b></i><i><b></b></i><i><b></b></i><i><b></b></i><i><b></b></i></div>' +
            '<div class="mc-now"><span class="mc-av" aria-hidden="true"></span><span class="mc-now-tx"><b></b><small></small></span><span class="mc-cnt"></span></div>' +
            '<p class="mc-line" role="status" aria-live="polite"><span class="mc-li" aria-hidden="true">' + IC.check + '</span><span class="mc-lt"><span class="mc-tx"></span><span class="mc-dots" aria-hidden="true"><i></i><i></i><i></i></span></span></p>' +
            '<div class="mc-run-f"><span class="mc-hint"><kbd class="kbd">Esc</kbd> bağlayır</span>' +
              '<button type="button" class="btn btn-sm mc-skip">Nəticəyə keç ' + IC.ffwd + '</button></div>' +
          '</div>' +
        '</div>' +
      '</div>';
    D.body.appendChild(root);
    S.el = root;
    S.stage = q(root, '.mc-stage');
    S.panel = q(root, '.mc-panel');
    S.run = q(root, '.mc-run');
    S.eld = Array.prototype.slice.call(root.querySelectorAll('.mc-elder'));
    S.plates = Array.prototype.slice.call(root.querySelectorAll('.mc-plate'));
    S.tumar = q(root, '.mc-tumar');
    S.nzEl = q(root, '.mc-nz');
    S.nzFig = q(root, '.mc-mc-nf');
    S.bub = q(root, '.mc-bub');
    S.prog = Array.prototype.slice.call(root.querySelectorAll('.mc-prog i'));
    S.av = q(root, '.mc-av');
    S.nm = q(root, '.mc-now-tx b');
    S.rl = q(root, '.mc-now-tx small');
    S.cnt = q(root, '.mc-cnt');
    S.line = q(root, '.mc-line');
    S.lt = q(root, '.mc-tx');
    S.skipBtn = q(root, '.mc-skip');
    S.xBtn = q(root, '.mc-x');
    fit(S);
    mountNz(S);
  }

  function mountNz(S) {
    var fig = S.nzFig;
    if (W.Nuanza && typeof W.Nuanza.mount === 'function') {
      try {
        S.nz = W.Nuanza.mount(fig, { size: 'mini', width: '100%', interactive: false, label: 'Nuanza' });
        if (S.nz) { fig.classList.add('has-nz'); return; }
      } catch (e) { S.nz = null; fig.innerHTML = ''; }
    }
    fig.innerHTML = '<svg class="mc-art mc-nzfb st-idle" viewBox="0 0 100 124" aria-hidden="true" focusable="false">' + NZ_ART + '</svg>';
    S.nzFb = fig.firstChild;
  }
  function nzSet(S, st, ms) {
    if (S.nz && typeof S.nz.set === 'function') { try { S.nz.set(st, ms ? { ms: ms } : {}); } catch (e) { /* ignore */ } return; }
    if (S.nzFb) S.nzFb.setAttribute('class', 'mc-art mc-nzfb st-' + st);
  }

  function burst(S, el, kind) {
    if (S.rm || !el || S.closed) return;
    var r = el.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    if (W.NuanzaFX && typeof W.NuanzaFX.burst === 'function') { try { W.NuanzaFX.burst(x, y, kind); return; } catch (e) { /* fall through */ } }
    var n = kind === 'ink' ? 16 : kind === 'confetti' ? 22 : 10;
    for (var k = 0; k < n; k++) {
      var p = D.createElement('i'), a = Math.random() * Math.PI * 2, d = (kind === 'ink' ? 40 : 30) + Math.random() * (kind === 'confetti' ? 120 : 60);
      p.className = 'mc-pt' + (kind === 'ink' ? '' : ' star');
      p.style.left = x + 'px'; p.style.top = y + 'px';
      p.style.setProperty('--dx', r2(Math.cos(a) * d) + 'px');
      p.style.setProperty('--dy', r2(Math.sin(a) * d - (kind === 'ink' ? 0 : 20)) + 'px');
      p.style.setProperty('--r', Math.round(Math.random() * 360) + 'deg');
      S.el.appendChild(p);
      (function (node) { setTimeout(function () { if (node.parentNode) node.parentNode.removeChild(node); }, 900); })(p);
    }
  }

  function bubble(S, anchor, who, text) {
    if (!anchor || S.closed) return;
    var b = S.bub, st = S.stage;
    b.innerHTML = '<b>' + esc(who) + '</b>' + esc(text);
    var sr = st.getBoundingClientRect(), ar = anchor.getBoundingClientRect();
    var bw = b.offsetWidth, bh = b.offsetHeight, cx = ar.left + ar.width / 2 - sr.left;
    var left = clamp(cx - bw / 2, 8, Math.max(8, sr.width - bw - 8));
    var top = Math.max(6, ar.top - sr.top - bh - 4);
    b.style.left = r2(left) + 'px'; b.style.top = r2(top) + 'px';
    b.style.setProperty('--ax', r2(clamp(cx - left, 16, bw - 16)) + 'px');
    b.classList.remove('on'); void b.offsetWidth; b.classList.add('on');
    clearTimeout(S.bubT);
    S.bubT = setTimeout(function () { b.classList.remove('on'); }, 2800);
  }

  function pop(el) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
  function setLine(S, text, kind) {
    S.line.className = 'mc-line ' + (kind || 'doing');
    S.lt.textContent = text;
  }
  function setNow(S, k) {
    var av, nm, rl, cnt = '', line;
    if (k === 'intro') { av = starAvatar(); nm = 'Mirzə Məclisi'; rl = 'Beş qoca mirzə · beş yoxlama'; line = 'Xalça sərilir, mirzələr yerini tutur'; }
    else if (k === 'nuanza') { av = nzPortrait(); nm = 'Nuanza'; rl = 'Köməkçi'; line = 'Nuanza tumarı Məclisə gətirir'; }
    else { var e = ELDERS[k]; av = portrait(k); nm = e.name; rl = e.role + ' · ' + e.work; cnt = (k + 1) + ' / 5'; line = e.doing; }
    S.av.innerHTML = av; pop(S.av);
    S.nm.textContent = nm; S.rl.textContent = rl; S.cnt.textContent = cnt;
    setLine(S, line, 'doing');
  }
  function progStart(S, i, d) {
    var b = S.prog[i].firstChild;
    b.style.transition = 'none'; b.style.width = '0%'; void b.offsetWidth;
    b.style.transition = 'width ' + d + 'ms linear'; b.style.width = '100%';
  }
  function progEnd(S, i, warn) {
    var it = S.prog[i], b = it.firstChild;
    b.style.transition = 'none'; b.style.width = '';
    it.classList.add(warn ? 'warn' : 'ok');
  }
  function settle(S, i) {
    var E = S.eld[i], r = S.res[i];
    E.classList.remove('is-on'); S.plates[i].classList.remove('is-on');
    E.classList.add(r.warn ? 'is-warn' : 'is-done'); S.plates[i].classList.add(r.warn ? 'is-warn' : 'is-done');
    S.tumar.classList.add('m' + (i + 1));
    progEnd(S, i, r.warn);
  }

  /* ------------------------------------------------------------------
     the ceremony
     ------------------------------------------------------------------ */
  function placeTumar(S) {
    var t = S.tumar, src = q(S.nzEl, '.mc-nz-scr');
    try {
      var a = src.getBoundingClientRect(), b = t.getBoundingClientRect();
      if (a.width && b.width) {
        t.style.setProperty('--fx', Math.round((a.left + a.width / 2) - (b.left + b.width / 2)) + 'px');
        t.style.setProperty('--fy', Math.round((a.top + a.height / 2) - (b.top + b.height * 0.75)) + 'px');
      }
    } catch (e) { /* ignore */ }
    t.classList.add('is-in');
    S.nzEl.classList.add('gave');
  }

  async function step(S, i) {
    var E = S.eld[i], d = S.dur[i], r = S.res[i];
    if (!S.skip) {
      E.classList.add('is-on'); S.plates[i].classList.add('is-on');
      setNow(S, i);
      progStart(S, i, d);
      await wait(S, d);
      if (S.closed) return;
    }
    settle(S, i);
    if (!S.skip) {
      setLine(S, r.line, r.warn ? 'warn' : 'ok');
      burst(S, q(S.plates[i], '.mc-tick') || E, r.warn ? 'seeds' : 'stars');
      await wait(S, S.rm ? 220 : 440);
    }
  }

  async function sequence(S) {
    var el = S.el, rm = S.rm;
    await frame();
    if (S.closed) return;
    el.classList.add('is-in');
    setNow(S, 'intro');
    await wait(S, rm ? 120 : 260); if (S.closed) return;
    el.classList.add('is-rug');
    await wait(S, rm ? 200 : 480); if (S.closed) return;
    el.classList.add('is-elders');
    later(S, function () { el.classList.add('is-ready'); }, rm ? 500 : 1500);
    await wait(S, rm ? 350 : 900); if (S.closed) return;
    setNow(S, 'nuanza');
    el.classList.add('is-nz');
    nzSet(S, 'idle');
    await wait(S, rm ? 300 : 1380); if (S.closed) return;
    nzSet(S, 'point', 1200);
    placeTumar(S);
    await wait(S, rm ? 250 : 640); if (S.closed) return;
    S.tumar.classList.add('is-open');
    nzSet(S, 'read', 60000);
    await wait(S, rm ? 200 : 600); if (S.closed) return;
    el.classList.add('is-work');
    for (var i = 0; i < 5; i++) {
      await step(S, i);
      if (S.closed) return;
    }
    el.classList.remove('is-work');
    await wait(S, rm ? 100 : 260); if (S.closed) return;
    showVerdict(S);
  }

  function skip(S) {
    if (S.closed || S.verdictShown) return;
    S.skip = true;
    flush(S);
  }

  function ringNode(v) {
    try { if (W.App && typeof W.App.ring === 'function') return W.App.ring(v, 'bal'); } catch (e) { /* fall through */ }
    var d = D.createElement('div'), cls = v < 60 ? ' low' : v < 80 ? ' mid' : '';
    d.className = 'ring-wrap';
    d.innerHTML = '<div class="ring' + cls + '" style="--v:' + v + '" role="img" aria-label="bal: ' + v + '"><svg viewBox="0 0 120 120" aria-hidden="true"><circle class="ring-orn" cx="60" cy="60" r="59" pathLength="100"/><circle class="ring-track" cx="60" cy="60" r="50" pathLength="100"/><circle class="ring-val" cx="60" cy="60" r="50" pathLength="100"/></svg><div class="ring-txt"><b class="tnum">' + v + '</b><span>bal</span></div></div>';
    return d;
  }

  function showVerdict(S) {
    if (S.closed || S.verdictShown) return;
    S.verdictShown = true;
    S.skip = false;
    var el = S.el, v = S.v, sc = v.score, rm = S.rm;
    for (var i = 0; i < 5; i++) { if (!S.eld[i].classList.contains('is-done') && !S.eld[i].classList.contains('is-warn')) settle(S, i); }
    el.classList.remove('is-work');
    el.classList.add('is-in', 'is-rug', 'is-elders', 'is-nz', 'is-ready', 'is-verdict');
    S.tumar.classList.add('is-in', 'is-open');
    S.nzEl.classList.add('gave');

    var tone = sc == null || sc >= 85 ? 'ok' : sc >= 70 ? 'mid' : 'low';
    var sigs = ELDERS.map(function (e, k) {
      var w = S.res[k].warn;
      return '<span class="mc-sig ' + (w ? 'warn' : 'ok') + '" style="--i:' + k + '" title="' + esc(e.name + (w ? ' — qeyd var' : ' — təsdiq')) + '">' + portrait(k) + '<i aria-hidden="true">' + (w ? '!' : IC.check) + '</i></span>';
    }).join('');
    var warns = S.res.filter(function (r) { return r.warn; }).length;
    var card = D.createElement('section');
    card.className = 'card framed mc-v motion-safe';
    card.setAttribute('aria-labelledby', 'mc-vt-' + S.id);
    card.innerHTML =
      '<div class="mc-v-top"><span class="eyebrow">Məclisin hökmü</span><span class="mc-v-dt">' + esc(azDate(new Date())) + '</span></div>' +
      '<div class="mc-v-main"><div class="mc-v-score"></div><div class="mc-v-tx"><h3 class="mc-v-h ' + tone + '" id="mc-vt-' + S.id + '">' + esc(v.seal) + '</h3><p>' + esc(v.text) + '</p></div></div>' +
      '<div class="mc-v-sig"><span class="mc-v-sl">İmzalar</span><span class="mc-v-avs" aria-label="' + esc((5 - warns) + ' mirzə təsdiq etdi' + (warns ? ', ' + warns + ' mirzənin qeydi var' : '')) + '">' + sigs + '</span></div>' +
      '<div class="mc-seal motion-safe" aria-hidden="true">' + sealSvg() + '</div>';
    var score = q(card, '.mc-v-score');
    if (sc != null) score.appendChild(ringNode(sc));
    else score.innerHTML = '<span class="medal" aria-hidden="true">' + IC.check + '</span>';
    var act = D.createElement('div');
    act.className = 'mc-v-act';
    act.innerHTML = '<button type="button" class="btn btn-primary btn-lg mc-done">Bağla</button>';

    S.panel.innerHTML = '';
    S.panel.appendChild(card);
    S.panel.appendChild(act);
    S.card = card;

    var live = D.createElement('p');
    live.className = 'sr-only'; live.setAttribute('role', 'status');
    live.textContent = 'Məclisin hökmü: ' + (sc != null ? sc + ' bal. ' : '') + v.seal + '. ' + v.text;
    S.panel.appendChild(live);

    nzSet(S, tone === 'ok' ? 'celebrate' : tone === 'mid' ? 'success' : 'worried', 4200);

    var doneBtn = q(act, '.mc-done');
    later(S, function () {
      var tgt = S.kbd ? doneBtn : S.el;
      if (S.kbd || !S.el.contains(D.activeElement) || D.activeElement === S.el) { try { tgt.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }
      try { card.scrollIntoView({ block: 'nearest', behavior: rm ? 'auto' : 'smooth' }); } catch (e) { /* ignore */ }
    }, 120);

    var seal = q(card, '.mc-seal');
    later(S, function () {
      seal.classList.add('is-stamp');
      later(S, function () {
        if (!rm) { card.classList.add('is-hit'); burst(S, seal, 'ink'); }
        later(S, function () { card.classList.remove('is-hit'); }, 360);
        if (tone === 'ok' && !S.nz) later(S, function () { burst(S, q(card, '.mc-v-score') || card, 'confetti'); }, 380);
      }, rm ? 60 : 340);
    }, rm ? 250 : 700);
  }

  /* ------------------------------------------------------------------
     open / close
     ------------------------------------------------------------------ */
  function lockScroll(on) {
    if (!D.body) return;
    if (on) { D.body.classList.add('no-scroll'); return; }
    if (!D.querySelector('.sheet.on,.sheet.open,.dialog.on,.dialog.open,.onb')) D.body.classList.remove('no-scroll');
  }
  function focusables(root) {
    return Array.prototype.slice.call(root.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),[tabindex]:not([tabindex="-1"])')).filter(function (n) {
      return !n.closest('[hidden]') && n.getClientRects().length > 0;
    });
  }
  function close(S) {
    if (!S || S.closed) return;
    S.closed = true;
    flush(S);
    S.timers.forEach(clearTimeout);
    clearInterval(S.blinkT); clearTimeout(S.bubT);
    W.removeEventListener('keydown', S.onKey, true);
    W.removeEventListener('resize', S.onResize);
    if (S.ro) { try { S.ro.disconnect(); } catch (e) { /* ignore */ } }
    if (S.nz && typeof S.nz.destroy === 'function') { try { S.nz.destroy(); } catch (e) { /* ignore */ } }
    var el = S.el;
    if (el) {
      el.classList.add('out');
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); lockScroll(false); }, S.rm ? 120 : 300);
    }
    if (CUR === S) CUR = null;
    if (S.prevFocus && S.prevFocus.focus && D.contains(S.prevFocus)) { try { S.prevFocus.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }
    S.resolve(S.v);
  }

  function run(opts) {
    opts = opts || {};
    if (CUR) close(CUR);
    var rm = reduced();
    var S = {
      id: ++UID, closed: false, skip: false, verdictShown: false, timers: [], waits: [],
      rm: rm, title: String(opts.title || 'Mirzə Məclisi'), v: normVerdict(opts.verdict),
      prevFocus: D.activeElement
    };
    S.dur = durationsOf(opts.durations, rm);
    S.res = results(S.v);
    return new Promise(function (resolve) {
      S.resolve = resolve;
      try {
        injectCss();
        build(S);
      } catch (e) {
        try { if (S.el && S.el.parentNode) S.el.parentNode.removeChild(S.el); } catch (e2) { /* ignore */ }
        try { console.error(e); } catch (e3) { /* ignore */ }
        resolve(S.v);
        return;
      }
      CUR = S;
      lockScroll(true);

      S.el.addEventListener('click', function (e) {
        var t = e.target;
        if (!t || !t.closest) return;
        if (t.closest('.mc-x') || t.closest('.mc-done')) { close(S); return; }
        if (t.closest('.mc-skip')) { skip(S); return; }
        var E = t.closest('.mc-elder');
        if (E) {
          var i = +E.getAttribute('data-i');
          E.classList.remove('is-poke'); void E.offsetWidth; E.classList.add('is-poke');
          later(S, function () { E.classList.remove('is-poke'); }, 520);
          bubble(S, q(E, 'svg'), ELDERS[i].name, ELDERS[i].quip);
          return;
        }
        if (t.closest('.mc-nz')) {
          var nz = S.nzEl;
          if (S.nz && typeof S.nz.react === 'function') { try { S.nz.react('pet'); } catch (err) { /* ignore */ } }
          nz.classList.remove('is-poke'); void nz.offsetWidth; nz.classList.add('is-poke');
          later(S, function () { nz.classList.remove('is-poke'); }, 520);
          var lines = S.verdictShown ? ['Hökm hazırdır! «Bağla»ya toxunub işə qayıdaq.', 'Möhür vuruldu — afərin bizə!']
            : ['Mirzələr tələsməyi sevmir, amma heç nə qaçırmırlar.', 'Tumarı özüm gətirdim!', 'Bir az səbr — Məclis işləyir.'];
          bubble(S, q(nz, '.mc-mc-nf'), 'Nuanza', lines[Math.floor(Math.random() * lines.length)]);
        }
      });

      S.onKey = function (e) {
        if (S.closed) return;
        S.kbd = true;
        if (e.key === 'Escape' || e.key === 'Esc') { e.preventDefault(); e.stopPropagation(); close(S); return; }
        if (e.key === 'Tab') {
          e.stopPropagation();
          var f = focusables(S.el);
          if (!f.length) { e.preventDefault(); return; }
          var a = D.activeElement, first = f[0], last = f[f.length - 1];
          if (!S.el.contains(a)) { e.preventDefault(); (e.shiftKey ? last : first).focus(); }
          else if (e.shiftKey && a === first) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && a === last) { e.preventDefault(); first.focus(); }
          return;
        }
        e.stopPropagation();
      };
      W.addEventListener('keydown', S.onKey, true);

      S.onResize = function () { if (!S.closed) fit(S); };
      if (typeof W.ResizeObserver === 'function') { try { S.ro = new W.ResizeObserver(S.onResize); S.ro.observe(S.stage); } catch (e) { S.ro = null; } }
      W.addEventListener('resize', S.onResize);

      if (!rm) {
        S.blinkT = setInterval(function () {
          if (S.closed) return;
          var k = Math.floor(Math.random() * 6), t = k < 5 ? S.eld[k] : S.nzEl;
          if (!t) return;
          t.classList.add('blink');
          setTimeout(function () { t.classList.remove('blink'); }, 150);
        }, 650);
      }

      later(S, function () { try { S.el.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }, 60);

      sequence(S).catch(function (e) {
        try { console.error(e); } catch (e2) { /* ignore */ }
        if (!S.closed) showVerdict(S);
      });
    });
  }

  W.Meclis = {
    run: run,
    elders: ELDERS,
    seats: SEATS,
    figure: figure,
    portrait: portrait,
    close: function () { if (CUR) close(CUR); },
    isOpen: function () { return !!CUR; },
    skip: function () { if (CUR) skip(CUR); }
  };
})();
