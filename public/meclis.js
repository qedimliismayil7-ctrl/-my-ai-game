/* =====================================================================
   NUANZA — Mirzə Məclisi (meclis.js)
   The council of five elder editors that gathers for big jobs.
   window.Meclis.run({title, durations?, verdict:{score?, text, seal?, errors?}}) -> Promise (resolves on close)
   window.Meclis.elders — the five elders (data). Meclis.portrait(i) / Meclis.figure(i) -> SVG strings.
   Overlay: a modern studio — the kilim unrolls on the wall, the elders take their seats behind the desk,
   Nuanza brings the document in, each elder works in turn, verdict with an animated score ring and a stamp.
   «Bağla» button and Escape close it. CSS prefix: mc- (injected once). Reduced motion: fades only.
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
  /* göl — the stepped carpet diamond (same outline as the logo and --m-star), radius R */
  var GUL = [[50, 0], [61.11, 11.11], [61.11, 19.44], [69.44, 19.44], [80.56, 30.56], [80.56, 38.89], [88.89, 38.89], [100, 50], [88.89, 61.11], [80.56, 61.11], [80.56, 69.44], [69.44, 80.56], [61.11, 80.56], [61.11, 88.89],
    [50, 100], [38.89, 88.89], [38.89, 80.56], [30.56, 80.56], [19.44, 69.44], [19.44, 61.11], [11.11, 61.11], [0, 50], [11.11, 38.89], [19.44, 38.89], [19.44, 30.56], [30.56, 19.44], [38.89, 19.44], [38.89, 11.11]];
  function gulPts(cx, cy, R) { return GUL.map(function (p) { return r2(cx + (p[0] - 50) / 50 * R) + ',' + r2(cy + (p[1] - 50) / 50 * R); }).join(' '); }
  function diaPts(cx, cy, R) { return r2(cx) + ',' + r2(cy - R) + ' ' + r2(cx + R) + ',' + r2(cy) + ' ' + r2(cx) + ',' + r2(cy + R) + ' ' + r2(cx - R) + ',' + r2(cy); }
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
     art — five hand-authored elders (viewBox 0 0 120 140), seated behind the desk:
     the desk's back edge meets each figure at y≈106; hands and props lie on the desk below it
     ------------------------------------------------------------------ */
  var CHAIR =
    '<path class="k-chr" d="M23 110 V70 Q23 56 37 56 H83 Q97 56 97 70 V110Z"/>' +
    '<path class="k-chr2" d="M29 61.6 Q31 59.6 37 59.6 H83 Q89 59.6 91 61.6"/>';
  var TORSO = '<path class="k-r1" d="M28.6 109 Q27.6 89 41 80 Q60 72 79 80 Q92.4 89 91.4 109Z"/>';
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

  /* 1 · Lüğətçi Mirzə — swept-back white hair, trimmed white beard, rectangular glasses, green cardigan; flips the dictionary */
  function artLugetci() {
    return '<g class="mc-fig">' +
      '<g class="mc-body">' + TORSO +
        '<path class="k-iv" d="M50.5 78.5 Q60 74.5 69.5 78.5 L60 97Z"/>' +
        '<path class="k-col" d="M51 78.4 L55.8 85.6 L60 79.2Z M69 78.4 L64.2 85.6 L60 79.2Z"/>' +
        '<path class="k-rib" d="M50.5 78.5 L60 97 L69.5 78.5"/>' +
        '<path class="k-rib2" d="M70.6 89.4 H80.4"/><rect class="k-clipf" x="73.4" y="84.4" width="1.8" height="5.2" rx=".9"/>' +
      '</g>' +
      '<path class="k-sv" d="M41.5 85 Q29.5 96 31.5 106.5"/><path class="k-sv" d="M78.5 85 Q90.5 96 88.5 106.5"/>' +
      '<g class="mc-head">' + earsFace() +
        '<path class="k-hw" d="M36.2 47 Q33.6 30 42 23.4 Q51 17 62 17.6 Q76 18.4 82.4 27 Q86.6 34 83.8 47 Q82 36.6 75 32.6 Q66 28.4 56 30 Q44 31.6 38.6 38.6 Q36.8 42 36.2 47Z"/>' +
        '<path class="k-hwl" d="M44 27.6 Q54 22.6 66 23.6 M41.4 33.4 Q50 27.4 61 27.6 M70.6 24.8 Q77 27.4 80.6 32.6"/>' +
        eyes() +
        '<path class="k-bwl" d="M44.5 41.4 Q50 37.4 55.6 40.4 M64.4 40.4 Q70 37.4 75.5 41.4"/>' + CROW + CHEEKS +
        '<path class="k-bw" d="M37.6 52 Q36.6 68 44.6 78.4 Q51.6 86.6 60 88 Q68.4 86.6 75.4 78.4 Q83.4 68 82.4 52 Q78.8 60 71 61.2 Q60 65.2 49 61.2 Q41.2 60 37.6 52Z"/>' +
        '<path class="k-bwd" d="M50 70 Q53 77 57 82 M70 70 Q67 77 63 82 M60 69.6 V85 M44 64 Q45.4 71 48.6 75.6 M76 64 Q74.6 71 71.4 75.6"/>' +
        '<path class="k-mo" d="M56.6 66.6 Q60 68.4 63.4 66.6"/>' +
        '<path class="k-bw" d="M60 58.6 Q53 55.4 46.6 59.4 Q45.2 62 48.2 62.4 Q54 63.2 60 60.9 Q66 63.2 71.8 62.4 Q74.8 62 73.4 59.4 Q67 55.4 60 58.6Z"/>' +
        '<path class="k-bwd" d="M52 61.4 Q56.5 61.6 60 60.2 Q63.5 61.6 68 61.4"/>' + NOSE +
        '<g class="k-gl"><rect x="44.2" y="44.4" width="13.6" height="9.6" rx="3"/><rect x="62.2" y="44.4" width="13.6" height="9.6" rx="3"/><path d="M57.8 48.4 Q60 47 62.2 48.4 M44.2 47.4 L37.4 46 M75.8 47.4 L82.6 46"/></g>' +
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

  /* 2 · Mənaçı Mirzə — thinning white hair, round glasses, grey moustache, indigo blazer; magnifier over a document */
  function artMenaci() {
    return '<g class="mc-fig">' +
      '<g class="mc-body">' + TORSO +
        '<path class="k-iv" d="M51 78.4 Q60 74.8 69 78.4 L60 96Z"/>' +
        '<path class="k-col" d="M51 78.4 L55.6 84.8 L60 79.4Z M69 78.4 L64.4 84.8 L60 79.4Z"/>' +
        '<path class="k-lap" d="M51 78.4 L46.4 86.2 L57.4 100 M69 78.4 L73.6 86.2 L62.6 100"/>' +
        '<path class="k-rib2" d="M71 90 H80.6"/><path class="k-psq" d="M71.8 90 L73.8 86.6 L75.8 88.8 L78.2 86.4 L79.8 90Z"/>' +
      '</g>' +
      '<path class="k-sv" d="M41.5 85 Q30 96 29.5 105.5"/>' +
      '<g class="mc-head">' + earsFace() +
        '<path class="k-hs" d="M35.2 52 Q33 40.6 38.6 33.6 Q41.6 35.4 41.6 38.4 Q38.8 43.6 39.8 50.8Z M84.8 52 Q87 40.6 81.4 33.6 Q78.4 35.4 78.4 38.4 Q81.2 43.6 80.2 50.8Z"/>' +
        '<path class="k-wisp" d="M56.4 25.2 Q58.2 21.2 62 21.8 M60.8 25.4 Q63.6 22.2 66.8 23.6"/>' +
        '<path class="k-shine" d="M45.6 31.4 Q52.4 27.4 60.4 27.6"/>' +
        eyes() +
        '<path class="k-gbr" d="M44 40.4 Q50 36.8 56 39.8 M64 39.8 Q70 36.8 76 40.4"/>' + CROW + CHEEKS +
        '<path class="k-mo" d="M56.4 66.4 Q60 68.4 63.6 66.4"/>' +
        '<path class="k-gb" d="M60 58.8 Q54 56.4 48.8 59.8 Q50.6 63.2 55.6 62.2 Q58.6 61.6 60 60.8 Q61.4 61.6 64.4 62.2 Q69.4 63.2 71.2 59.8 Q66 56.4 60 58.8Z"/>' + NOSE +
        '<g class="k-gl"><circle cx="51" cy="49" r="6.3"/><circle cx="69" cy="49" r="6.3"/><path d="M57.3 48.4 Q60 46.6 62.7 48.4 M44.7 47.6 L37.5 46 M75.3 47.6 L82.5 46"/></g>' +
        '<path class="mc-glint" d="M47.2 46.4 L50.4 43.6 M65.2 46.4 L68.4 43.6"/>' +
      '</g>' +
      '<g class="mc-doc">' +
        '<path class="k-pg" d="M31.4 99.4 L86.6 98.2 L89 117.4 L29 118.6Z"/>' +
        '<path class="k-fl" d="M36 102.8 H52"/>' +
        '<path class="k-pl" d="M35.6 106.8 H58 M62 106.6 H83.6 M35.2 110.9 H48 M52 110.7 H84.2 M34.8 115 H70"/>' +
      '</g>' +
      hand(30.4, 109) +
      '<g class="mc-arm">' +
        '<path class="k-sv" d="M78.5 85 Q90 96 84.5 111.5"/>' +
        '<path class="k-hd" d="M77 112.5 L84.6 120.2"/>' +
        '<circle class="k-lens" cx="71" cy="106" r="8.2"/><circle class="k-rim" cx="71" cy="106" r="8.2"/>' +
        '<path class="k-lhl" d="M66 103.2 Q67.4 100.2 70.6 99.7"/>' +
        hand(84, 116) +
      '</g>' +
    '</g>';
  }

  /* 3 · Üslubçu Mirzə — silver side-parted quiff, curled moustache, red bow tie, camel blazer; fountain-pen flourish on the shared document */
  function artUslubcu() {
    return '<g class="mc-fig">' +
      '<g class="mc-body">' + TORSO +
        '<path class="k-iv" d="M52.4 78.4 Q60 75.2 67.6 78.4 L60 95Z"/>' +
        '<path class="k-lap" d="M52.4 78.4 L47.6 86.4 L57.6 100 M67.6 78.4 L72.4 86.4 L62.4 100"/>' +
        '<path class="k-bt" d="M60 80.8 L53 77.2 Q52 80.8 53 84.4Z M60 80.8 L67 77.2 Q68 80.8 67 84.4Z"/><rect class="k-btk" x="58" y="78.8" width="4" height="4" rx="1.2"/>' +
        '<polygon class="k-zf" points="' + diaPts(74.4, 90, 2.2) + '"/>' +
      '</g>' +
      '<g class="mc-head">' + earsFace() +
        '<path class="k-hr" d="M36.6 36 Q33 44.5 35.6 53 L39.6 51.6 Q37.8 43.5 40.6 36.6Z M83.4 36 Q87 44.5 84.4 53 L80.4 51.6 Q82.2 43.5 79.4 36.6Z"/>' +
        '<path class="k-hr" d="M36.4 46 Q33 30 42 22.6 Q50 16.6 61 15.8 Q70 15 76.4 18.6 Q83 22.4 84 29 Q86 36 84.2 45.6 Q83 38.4 79 34.6 Q74.4 30.4 66 31.4 Q57 32.6 50.6 30 Q47.6 33.8 43.4 35.8 Q38.6 39 36.4 46Z"/>' +
        '<path class="k-hrl" d="M52 21.4 Q64 16.8 77 21.8 M54.6 26.6 Q65 22.4 76.6 27.2 M50.6 30 Q48.8 24.4 51.6 18.6"/>' +
        eyes() +
        '<path class="k-dbr" d="M44.5 42.6 Q50 39.6 55.5 42.2 M64.5 40.4 Q70 35.8 75.5 39.4"/>' + CROW + CHEEKS +
        '<path class="k-mo" d="M55.2 66.4 Q60 69.6 64.8 66.4"/>' +
        '<path class="k-ms mc-mst" d="M60 59.2 C55.5 56.6 50 57 46.6 59.6 C44.2 61.4 41.6 61.2 40.6 58.8 C40 57.2 41 55.7 42.6 55.9 C41.7 56.9 42.1 58.3 43.4 58.4 C46.2 58.5 48.6 54.5 54 55.6 C57 56.2 59 57.4 60 58.2 C61 57.4 63 56.2 66 55.6 C71.4 54.5 73.8 58.5 76.6 58.4 C77.9 58.3 78.3 56.9 77.4 55.9 C79 55.7 80 57.2 79.4 58.8 C78.4 61.2 75.8 61.4 73.4 59.6 C70 57 64.5 56.6 60 59.2Z"/>' +
        '<path class="k-ms" d="M58 70.6 Q60 75.4 62 70.6 Q60 71.8 58 70.6Z"/>' + NOSE +
      '</g>' +
      '<g transform="rotate(-4 57 108)">' +
        '<path class="k-ink mc-flo" pathLength="1" d="M39 113.6 C42.5 109.2 45.6 116.2 49.4 112 S56.6 109 59.6 112.6 C62 115.6 65.6 111 69.4 112.2 C72.4 113.2 73.6 110.8 75.4 109.2"/>' +
      '</g>' +
      '<path class="k-sv" d="M41.5 85 Q31 97 35.5 108.6"/>' + hand(35.5, 111) +
      '<g class="mc-arm">' +
        '<path class="k-sv" d="M78.5 85 Q91 96 77.6 106"/>' +
        '<path class="k-fpb" d="M72.6 109.8 L92.4 83.2"/>' +
        '<path class="k-fpc" d="M87.4 89.8 L89.4 87.1"/>' +
        '<path class="k-nib" d="M69.8 113.6 L70.6 109.2 L73.8 111.6Z"/>' +
        hand(75.5, 108.4) +
      '</g>' +
    '</g>';
  }

  /* 4 · Dilçi Nənə — grey hair in a bun, red-framed glasses, pearls, raspberry cardigan; red-pen correction */
  function artDilci() {
    var pearls = [[51.2, 81], [53.8, 83.4], [56.8, 85], [60, 85.6], [63.2, 85], [66.2, 83.4], [68.8, 81]].map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="1.25"/>'; }).join('');
    return '<g class="mc-fig">' +
      '<g class="mc-body">' + TORSO +
        '<path class="k-iv" d="M48.6 78.8 Q60 74.4 71.4 78.8 Q66.4 87.4 60 87.6 Q53.6 87.4 48.6 78.8Z"/>' +
        '<path class="k-rib" d="M48.6 79 Q52 93 53.6 109 M71.4 79 Q68 93 66.4 109"/>' +
        '<g class="k-prl">' + pearls + '</g>' +
        '<polygon class="k-zf" points="' + gulPts(74.2, 92.4, 3) + '"/>' +
      '</g>' +
      '<g class="mc-head">' +
        '<circle class="k-hgy" cx="60" cy="20.4" r="8.8"/>' +
        '<path class="k-hgl" d="M54.4 19 Q60 14.8 65.6 19 M55.2 23 Q60 19.8 64.8 23"/>' +
        earsFace() +
        '<path class="k-hgy" d="M36 50 Q33.6 31.6 44 25 Q52 20.6 60 21 Q68 20.6 76 25 Q86.4 31.6 84 50 Q82.6 40 76.8 35.4 Q70.4 30.8 63.8 33.2 Q61.6 31.6 60 30.6 Q58.4 31.6 56.2 33.2 Q49.6 30.8 43.2 35.4 Q37.4 40 36 50Z"/>' +
        '<path class="k-hgl" d="M41.6 31.4 Q48 27.4 55.4 28.4 M64.6 28.4 Q72 27.4 78.4 31.4 M38.6 40.6 Q40.6 36.4 44.4 34"/>' +
        '<circle class="k-ear" cx="36" cy="55.6" r="1.9"/><circle class="k-ear" cx="84" cy="55.6" r="1.9"/>' +
        eyes() +
        '<path class="k-gbr" d="M45.5 42.4 Q50.5 40 55.5 42 M64.5 42 Q69.5 40 74.5 42.4"/>' + CROW +
        '<circle class="k-ck" cx="45" cy="57.4" r="5.4"/><circle class="k-ck" cx="75" cy="57.4" r="5.4"/>' +
        '<ellipse class="k-sk2" cx="60" cy="55" rx="3.2" ry="2.7"/><ellipse class="k-nh" cx="59" cy="54.1" rx="1" ry=".7"/>' +
        '<path class="k-mo2" d="M53.4 61.4 Q60 68.6 66.6 61.4 Q60 64.2 53.4 61.4Z"/>' +
        '<path class="k-wr" d="M50.6 60 Q49.6 62.5 51 64.5 M69.4 60 Q70.4 62.5 69 64.5"/>' +
        '<g class="k-gl k-glr"><circle cx="51" cy="49.2" r="6"/><circle cx="69" cy="49.2" r="6"/><path d="M57 48.6 Q60 46.8 63 48.6 M45 47.8 L37.6 46.4 M75 47.8 L82.4 46.4"/></g>' +
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

  /* 5 · Möhürdar Mirzə — short receding grey hair, trimmed salt-and-pepper beard, black turtleneck, slate jacket; desk stamp */
  function artMohurdar() {
    return '<g class="mc-fig">' +
      '<g class="mc-body">' + TORSO +
        '<path class="k-tn" d="M48.6 78.6 Q60 74 71.4 78.6 L66.4 109 H53.6Z"/>' +
        '<path class="k-lap" d="M48.6 78.6 L44 87 L53.6 109 M71.4 78.6 L76 87 L66.4 109"/>' +
      '</g>' +
      '<path class="k-sv" d="M41.5 85 Q30 95 33 105.5"/>' +
      '<path class="k-pg" d="M70 111 L104 108.6 L105.6 121.4 L71.6 123.6Z"/>' +
      '<path class="k-pl" d="M74 115 L86 114.2 M74 119 L84 118.4"/>' +
      '<g class="mc-imp"><rect class="k-stmo" x="88.4" y="111.2" width="12.4" height="9.6" rx="1.6" transform="rotate(-4 94.6 116)"/><polygon class="k-stm" points="' + gulPts(94.6, 116, 3.4) + '"/></g>' +
      '<g class="mc-arm">' +
        '<path class="k-sv" d="M78 88 Q91 95 92.6 98.6"/>' +
        '<g class="mc-stp">' +
          '<circle class="k-stk" cx="94" cy="91.4" r="3.8"/><circle class="k-wdh" cx="92.7" cy="90.1" r="1.2"/>' +
          '<rect class="k-stb" x="92.2" y="93.6" width="3.6" height="6.4" rx="1.2"/>' +
          '<path class="k-stb" d="M87.6 99.4 H100.4 Q101.6 99.4 101.8 100.6 L102.6 106.4 H85.4 L86.2 100.6 Q86.4 99.4 87.6 99.4Z"/>' +
          '<rect class="k-zf" x="86" y="102.2" width="16" height="1.6"/>' +
          '<rect class="k-stm" x="85.4" y="106.4" width="17.2" height="2.6" rx="1"/>' +
        '</g>' +
        hand(93.6, 99.8) +
      '</g>' +
      '<g class="mc-head">' + earsFace() +
        '<path class="k-tn" d="M50.4 71 Q60 74.4 69.6 71 L70.4 79.4 Q60 83.4 49.6 79.4Z"/>' +
        '<path class="k-tnl" d="M50.8 75.4 Q60 78.8 69.2 75.4"/>' +
        '<circle class="k-ck" cx="46" cy="55.4" r="3.8"/><circle class="k-ck" cx="74" cy="55.4" r="3.8"/>' +
        '<path class="k-db" d="M36 44 Q34.6 63 41.4 76 Q48.6 86.4 60 87.6 Q71.4 86.4 78.6 76 Q85.4 63 84 44 L80.6 45 Q81.6 55 77.2 59.6 Q69.4 61.8 60 64.4 Q50.6 61.8 42.8 59.6 Q38.4 55 39.4 45Z"/>' +
        '<path class="k-dbt" d="M47.6 70 Q50.6 77 55 82.6 M60 68.6 V85 M72.4 70 Q69.4 77 65 82.6 M43 63 Q44 70 47.6 75.6 M77 63 Q76 70 72.4 75.6"/>' +
        '<path class="k-gs" d="M52.4 68.6 Q54 75 57.4 80 M67.6 68.6 Q66 75 62.6 80"/>' +
        eyes() +
        '<path class="k-dbr2" d="M43.6 41.8 Q49.6 39.2 56 40.8 M64 40.8 Q70.4 39.2 76.4 41.8"/>' +
        '<path class="k-mo" d="M56.2 66.8 Q60 69.2 63.8 66.8"/>' +
        '<path class="k-db" d="M60 57.8 Q50.6 53.8 44.4 59.4 Q43.4 63.6 49 63 Q55 62.4 60 60.4 Q65 62.4 71 63 Q76.6 63.6 75.6 59.4 Q69.4 53.8 60 57.8Z"/>' +
        '<path class="k-dbt" d="M50 59.6 Q55 59.4 59 58.8 M61 58.8 Q65 59.4 70 59.6"/>' + NOSE +
        '<path class="k-hc" d="M36 43 Q35 26 47.6 20.6 Q60 16.8 72.4 20.6 Q85 26 84 43 Q82.6 34 77.4 31 Q74 33.4 69.6 31.4 Q60 28.6 50.4 31.4 Q46 33.4 42.6 31 Q37.4 34 36 43Z"/>' +
        '<path class="k-hct" d="M47 24.6 l1.4 -1.6 M53 22.4 l1.4 -1.6 M59.2 21.6 l1.4 -1.6 M65.4 22.4 l1.4 -1.6 M71.4 24.6 l1.4 -1.6"/>' +
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
      '<polygon class="k-gd" points="' + gulPts(50, 88, 4.4) + '"/>' +
      '<path class="k-nza" d="M38 79 Q31 88 39 96"/><path class="k-nza" d="M62 79 Q69 88 61 96"/>' +
      '<circle class="k-sk" cx="39.5" cy="96.5" r="3.6"/><circle class="k-sk" cx="60.5" cy="96.5" r="3.6"/>' +
      '<rect class="k-sk2" x="46" y="62" width="8" height="11" rx="3"/>' +
      '<g class="mc-nh">' +
        '<path class="k-hrn" d="M27.5 44 C25.5 18 40 10 50 10 C60 10 74.5 18 72.5 44 L71 61 Q50 67 29 61Z"/>' +
        '<circle class="k-sk" cx="50" cy="42" r="21"/>' +
        '<path class="k-hrn" d="M29 41 Q30.5 20 50 18 Q69.5 20 71 41 Q64 30 56 29 Q50.5 36 40 32.5 Q33.5 35.5 29 41Z"/>' +
        '<path class="k-nzb" d="M31 30.5 Q50 12.5 69 30.5"/>' +
        '<g class="mc-eye"><ellipse class="k-ew" cx="42" cy="44" rx="5" ry="6"/><circle class="k-ir" cx="42.5" cy="44.8" r="3.7"/><circle class="k-ey" cx="42.5" cy="44.8" r="1.9"/><circle class="k-hl" cx="43.9" cy="43.1" r="1.25"/></g>' +
        '<g class="mc-eye"><ellipse class="k-ew" cx="58" cy="44" rx="5" ry="6"/><circle class="k-ir" cx="57.5" cy="44.8" r="3.7"/><circle class="k-ey" cx="57.5" cy="44.8" r="1.9"/><circle class="k-hl" cx="58.9" cy="43.1" r="1.25"/></g>' +
        '<path class="k-lash" d="M37.2 40.4 l-2.2 -1.6 M62.8 40.4 l2.2 -1.6"/>' +
        '<path class="k-nbr" d="M38 35.8 Q42 33.8 46 35.4 M54 35.4 Q58 33.8 62 35.8"/>' +
        '<circle class="k-ck" cx="36" cy="52" r="3.6"/><circle class="k-ck" cx="64" cy="52" r="3.6"/>' +
        '<path class="k-nzm" d="M45.6 54 Q50 58.6 54.4 54 Q50 55.6 45.6 54Z"/>' +
      '</g>' +
    '</g>';
  /* the document Nuanza carries in (a printed page with a clip) */
  var NZ_DOC = '<svg class="mc-art" viewBox="0 0 60 26" aria-hidden="true"><rect class="k-pg" x="8" y="3.4" width="44" height="21" rx="1.6"/><path class="k-fl" d="M13 8.4 H29"/><path class="k-pl" d="M13 12.8 H47 M13 16.6 H47 M13 20.4 H37"/><rect class="k-bind" x="25" y="1.2" width="10" height="4.4" rx="1.2"/></svg>';

  /* ------------------------------------------------------------------
     the five elders (public data)
     ------------------------------------------------------------------ */
  var ELDERS = [
    { id: 'lugetci', n: 1, name: 'Lüğətçi Mirzə', short: 'Lüğətçi', role: 'Terminologiya', look: 'Ağ saç, səliqəli ağ saqqal, düzbucaq eynək, yaşıl jaket, qalın lüğət',
      work: 'Lüğəti vərəqləyir',
      doing: 'Lüğəti vərəqləyirəm: hər termin lüğət və tərcümə yaddaşı ilə tutuşdurulur',
      done: 'Terminlər lüğətə uyğundur — hamısı yerindədir.',
      warn: 'Üç termin lüğətdən fərqlidir — qeyd etdim.',
      warnN: function (n) { return n + ' termin lüğətdən fərqlidir'; },
      quip: 'Lüğətsiz tərcümə xəritəsiz səfərə bənzəyir.' },
    { id: 'menaci', n: 2, name: 'Mənaçı Mirzə', short: 'Mənaçı', role: 'Məna və mənbə', look: 'Seyrək ağ saç, girdə eynək, boz bığ, göy pencək, böyüdücü şüşə',
      work: 'Böyüdücü ilə sənədi oxuyur',
      doing: 'Hər cümləni mənbə ilə yan-yana oxuyuram',
      done: 'Məna mənbə ilə üst-üstə düşür, heç nə buraxılmayıb.',
      warn: 'Bir cümlədə məna daralıb — mənbəyə qayıdın.',
      warnN: function (n) { return n + ' yerdə məna mənbədən uzaqlaşıb'; },
      quip: 'Sözə yox, mənaya bax, övladım.' },
    { id: 'uslubcu', n: 3, name: 'Üslubçu Mirzə', short: 'Üslubçu', role: 'Üslub, registr, söz sırası', look: 'Gümüşü saç, burma bığ, qırmızı kəpənək qalstuk, mürəkkəbli qələm',
      work: 'Mürəkkəbli qələmlə naxış vurur',
      doing: 'Registri və söz sırasını cilalayıram',
      done: 'Üslub ardıcıldır, cümlələr səlis oxunur.',
      warn: 'İki cümlədə söz sırası ingiliscəyə bənzəyir.',
      warnN: function (n) { return n + ' cümlədə üslub və ya söz sırası axsayır'; },
      quip: 'Cümlə də xalça kimidir: hər naxış öz yerində olmalıdır.' },
    { id: 'dilci', n: 4, name: 'Dilçi Nənə', short: 'Dilçi Nənə', role: 'Orfoqrafiya, türk formaları', look: 'Topuz edilmiş çal saç, qırmızı çərçivəli eynək, mirvari boyunbağı, qırmızı qələm',
      work: 'Qırmızı qələmlə düzəliş edir',
      doing: 'Yazılışa baxıram — «değil», «şimdi» kimi türk formaları qalmasın',
      done: 'Yazılış ədəbi normaya uyğundur.',
      warn: 'İki türk forması tapdım: «değil» → «deyil», «şimdi» → «indi».',
      warnN: function (n) { return n + ' yazılış səhvi və ya türk forması'; },
      quip: '«Şimdi» yox, «indi», qızım! Dilimizi qoruyaq.' },
    { id: 'mohurdar', n: 5, name: 'Möhürdar Mirzə', short: 'Möhürdar', role: 'Rəqəm, ad, tarix · möhür', look: 'Qısa çal saç, qalın çal saqqal, qara boğazlı sviter, masa möhürü',
      work: 'Möhürü qaldırıb vurur',
      doing: 'Rəqəmləri, adları və tarixləri sayıram. Sonra möhür',
      done: 'Rəqəmlər, adlar və tarixlər yerindədir. Möhür vuruldu!',
      warn: 'Bir tarix mənbə ilə üst-üstə düşmür — yoxlayın.',
      warnN: function (n) { return n + ' rəqəm, ad və ya tarix uyğun gəlmir'; },
      quip: 'Rəqəm yalan deməz, amma səhv yazıla bilər.' }
  ];
  /* seats along the desk: x (center %), bottom % of the figure, scale, z-index, entrance order (center first) */
  var SEATS = [
    { x: 10, b: 20.8, s: 1, z: 3, i: 3 },
    { x: 26.5, b: 20.8, s: 1, z: 3, i: 1 },
    { x: 43, b: 20.8, s: 1, z: 3, i: 0 },
    { x: 59.5, b: 20.8, s: 1, z: 3, i: 2 },
    { x: 76, b: 20.8, s: 1, z: 3, i: 4 }
  ];
  var TYPE_TO = {
    'Termin': 0, 'Terminologiya': 0, 'Lüğət': 0, 'Qlossari': 0,
    'Məna': 1, 'Boş seqment': 1, 'Buraxılma': 1, 'Əlavə': 1,
    'Üslub': 2, 'Söz sırası': 2, 'Ardıcıllıq': 2, 'Registr': 2,
    'Türk forması': 3, 'Orfoqrafiya': 3, 'Durğu': 3, 'Yazılış': 3,
    'Rəqəm': 4, 'Ad': 4, 'Tarix': 4, 'Say': 4
  };

  function figure(i) { injectCss(); return '<svg class="mc-art e' + (i + 1) + '" viewBox="0 0 120 140" aria-hidden="true" focusable="false">' + CHAIR + ART[i] + '</svg>'; }
  function portrait(i) { injectCss(); return '<svg class="mc-art e' + (i + 1) + '" viewBox="23 8 74 74" aria-hidden="true" focusable="false">' + ART[i] + '</svg>'; }
  function nzPortrait() { return '<svg class="mc-art" viewBox="22 8 56 56" aria-hidden="true" focusable="false">' + NZ_ART + '</svg>'; }
  function gulAvatar() {
    return '<svg class="mc-gul-av" viewBox="-20 -20 40 40" aria-hidden="true" focusable="false"><polygon class="s1" points="' + gulPts(0, 0, 15) + '"/><polygon class="s2" points="' + diaPts(0, 0, 8) + '"/><polygon class="s3" points="' + diaPts(0, 0, 4) + '"/></svg>';
  }
  /* the verdict stamp: ring text around a göl, coloured by the verdict tone */
  function sealSvg() {
    var id = 'mcSA' + (++UID);
    return '<svg class="mc-art" viewBox="-50 -50 100 100" aria-hidden="true" focusable="false">' +
      '<circle class="s-bg" r="47"/>' +
      '<circle class="s-ring" r="45"/>' +
      '<circle class="s-ring2" r="30.5"/>' +
      '<defs><path id="' + id + '" d="M -37.5 0 a 37.5 37.5 0 1 1 75 0 a 37.5 37.5 0 1 1 -75 0"/></defs>' +
      '<text class="s-tx"><textPath href="#' + id + '" xlink:href="#' + id + '" textLength="228" lengthAdjust="spacing">MİRZƏ MƏCLİSİ · NUANZA · BAKI ·</textPath></text>' +
      '<polygon class="s-gul" points="' + gulPts(0, 0, 22) + '"/>' +
      '<polygon class="s-gul2" points="' + gulPts(0, 0, 12.5) + '"/>' +
      '<polygon class="s-core" points="' + diaPts(0, 0, 6) + '"/>' +
    '</svg>';
  }
  /* the shared document on the desk (the class names stay "tumar" for the ceremony code) */
  function tumarSvg() {
    return '<svg class="mc-art mc-tsvg" viewBox="0 0 200 100" aria-hidden="true" focusable="false">' +
      '<ellipse class="k-sh" cx="100" cy="94" rx="86" ry="5"/>' +
      '<g class="t-rl"><rect class="k-pg2" x="20" y="10" width="150" height="80" rx="3" transform="rotate(-4 95 50)"/></g>' +
      '<g class="t-pg">' +
        '<rect class="k-pg" x="28" y="8" width="150" height="82" rx="3"/>' +
        '<path class="t-ttl" d="M42 21 H92"/>' +
        '<path class="k-pl" d="M42 33 H86 M92 33 H130 M136 33 H164 M42 43 H74 M80 43 H146 M42 53 H112 M118 53 H140 M146 53 H164 M42 63 H66 M72 63 H100 M106 63 H146 M42 73 H120"/>' +
        '<path class="mk mk1" pathLength="1" d="M92 37 H130"/>' +
        '<path class="mk mk2" pathLength="1" d="M151 42.6 l4.4 4.4 l9.4 -10.4"/>' +
        '<path class="mk mk4" pathLength="1" d="M117 53 H141"/>' +
        '<path class="mk mk4" pathLength="1" d="M124.6 49.6 l4.4 -6.4 l4.4 6.4"/>' +
        '<path class="mk mk3" pathLength="1" d="M58 78 q8 -7 16 0 t16 0 q7 -5 12 1"/>' +
        '<g class="mk5"><rect class="t-stmo" x="146" y="62" width="24" height="20" rx="3" transform="rotate(-6 158 72)"/><polygon class="t-stm" points="' + gulPts(158, 72, 7) + '"/></g>' +
      '</g>' +
      '<g class="t-rr"><rect class="k-bind" x="91" y="3" width="22" height="9" rx="2.2"/><path class="t-clip" d="M95 7.5 H109"/></g>' +
    '</svg>';
  }

  /* ------------------------------------------------------------------
     the studio — window, kilim, shelf, plant, desk items (decor; colours from tokens)
     ------------------------------------------------------------------ */
  function windowSvg() {
    var id = 'mcSky' + (++UID);
    return '<svg class="mc-win" viewBox="0 0 60 110" aria-hidden="true" focusable="false">' +
      '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop class="w-s1" offset="0"/><stop class="w-s2" offset="1"/></linearGradient></defs>' +
      '<rect class="w-fr" x="0" y="0" width="60" height="110" rx="5"/>' +
      '<rect x="3.5" y="3.5" width="53" height="103" rx="2.5" fill="url(#' + id + ')"/>' +
      '<path class="w-city" d="M3.5 106.5 V88 H10 V80 H15 V92 H20 V72 H27 V84 H31 V90 H36 V76 H42 V86 H47 V68 H53 V82 H56.5 V106.5Z"/>' +
      '<path class="w-lit" d="M22.5 76 h1.6 M22.5 80 h1.6 M49 72 h1.6 M49 77 h1.6 M38.4 80 h1.6 M11.6 84 h1.6"/>' +
      '<path class="w-fr2" d="M30 3.5 V106.5 M3.5 46 H56.5"/>' +
      '<path class="w-hl" d="M9 12 L20 6 M9 20 L28 10"/>' +
      '<rect class="w-sill" x="-3" y="106" width="66" height="4" rx="1.6"/>' +
    '</svg>';
  }
  function kilimSvg() {
    var s = '<svg class="mc-kil" viewBox="0 0 120 72" aria-hidden="true" focusable="false"><rect class="kl-f" width="120" height="72"/>', k, x;
    for (k = 0; k < 14; k++) {
      x = 4 + k * 8;
      s += '<path class="' + (k % 2 ? 'kl-b' : 'kl-a') + '" d="M' + x + ' 9.5 L' + (x + 4) + ' 3.5 L' + (x + 8) + ' 9.5Z M' + x + ' 62.5 L' + (x + 4) + ' 68.5 L' + (x + 8) + ' 62.5Z"/>';
    }
    s += '<path class="kl-ln" d="M4 12 H116 M4 60 H116"/>';
    [[24, 'kl-a', 'kl-c', 'kl-b'], [60, 'kl-b', 'kl-a', 'kl-c'], [96, 'kl-a', 'kl-c', 'kl-b']].forEach(function (g) {
      s += '<polygon class="' + g[1] + '" points="' + gulPts(g[0], 36, 17) + '"/>' +
        '<polygon class="kl-f" points="' + gulPts(g[0], 36, 11.6) + '"/>' +
        '<polygon class="' + g[2] + '" points="' + gulPts(g[0], 36, 7.6) + '"/>' +
        '<polygon class="' + g[3] + '" points="' + diaPts(g[0], 36, 3) + '"/>';
    });
    [[42, 21], [42, 51], [78, 21], [78, 51], [6.6, 21], [6.6, 51], [113.4, 21], [113.4, 51]].forEach(function (p) {
      s += '<polygon class="kl-c" points="' + diaPts(p[0], p[1], 3.2) + '"/>';
    });
    return s + '</svg>';
  }
  function shelfSvg() {
    return '<svg class="mc-shelf" viewBox="0 0 80 30" aria-hidden="true" focusable="false">' +
      '<rect class="sh-b1" x="6" y="8" width="5" height="18" rx=".8"/><rect class="sh-b2" x="11.6" y="11" width="4.4" height="15" rx=".8"/>' +
      '<rect class="sh-b3" x="16.6" y="6" width="5.4" height="20" rx=".8"/><rect class="sh-b4" x="22.6" y="10" width="4" height="16" rx=".8"/>' +
      '<rect class="sh-b5" x="28" y="9" width="4.4" height="17" rx=".8" transform="rotate(16 32.4 26)"/>' +
      '<path class="sh-v" d="M58 26 Q54.4 26 54.4 21.4 Q54.4 15 61 15 Q67.6 15 67.6 21.4 Q67.6 26 64 26Z"/>' +
      '<path class="sh-lf" d="M61 15 Q59 9 55 6 M61 15 Q62 8 66 4.4 M61 15 Q64.6 11 69.6 10"/>' +
      '<rect class="sh-pl" x="0" y="26" width="80" height="3" rx="1.2"/>' +
    '</svg>';
  }
  function plantSvg() {
    return '<svg class="mc-plnt" viewBox="0 0 60 120" aria-hidden="true" focusable="false">' +
      '<path class="p-l2" d="M22 92 Q8 68 5 40 Q17 62 28 92Z"/>' +
      '<path class="p-l1" d="M25 92 Q18 52 22 14 Q29 52 31 92Z"/>' +
      '<path class="p-l2" d="M30 92 Q28 42 34 2 Q39 46 36 92Z"/>' +
      '<path class="p-l1" d="M35 92 Q40 56 47 22 Q47 60 41 92Z"/>' +
      '<path class="p-l2" d="M39 92 Q51 70 56 46 Q53 72 45 92Z"/>' +
      '<path class="p-ln" d="M22 30 Q24 56 28 88 M34 14 Q33 50 33.6 88 M45 34 Q42 60 38 88"/>' +
      '<rect class="p-rim" x="12" y="88" width="36" height="6" rx="2"/>' +
      '<path class="p-pot" d="M14 94 H46 L42.4 117.6 Q42 120 39.6 120 H20.4 Q18 120 17.6 117.6Z"/>' +
      '<path class="p-band" d="M15.4 102 H44.6"/>' +
    '</svg>';
  }
  function laptopSvg() {
    return '<svg viewBox="0 0 60 40" aria-hidden="true" focusable="false">' +
      '<rect class="lp-lid" x="6" y="2" width="48" height="31" rx="3"/>' +
      '<polygon class="lp-g" points="' + gulPts(30, 17.5, 6) + '"/><polygon class="lp-r" points="' + diaPts(30, 17.5, 3.2) + '"/><polygon class="lp-d" points="' + diaPts(30, 17.5, 1.6) + '"/>' +
      '<rect class="lp-base" x="1" y="33" width="58" height="4.4" rx="2.2"/>' +
    '</svg>';
  }
  function mugSvg() {
    return '<svg viewBox="0 0 24 34" aria-hidden="true" focusable="false">' +
      '<path class="mg-st" d="M8 12 Q5.6 8.6 8 5.6 Q10.4 2.6 8 0 M13.6 12 Q11.2 8.6 13.6 5.6 Q16 2.6 13.6 0"/>' +
      '<path class="mg-h" d="M17.6 18.4 Q23 18.4 23 22.8 Q23 27.2 17.6 27.2"/>' +
      '<rect class="mg-c" x="2" y="14" width="17" height="19" rx="3.2"/>' +
      '<polygon class="mg-g" points="' + diaPts(10.5, 23.5, 3.4) + '"/>' +
    '</svg>';
  }

  /* ------------------------------------------------------------------
     CSS (injected once)
     ------------------------------------------------------------------ */
  var CSS = `
.mc,.mc-art{--mc-skin:#F1C9A5;--mc-skin2:#DCA482;--mc-cheek:#EC8B7E;--mc-eye:#1E1B2E;
  --mc-white:#F4F2EE;--mc-white2:#CEC8BF;--mc-silver:#CAC5BE;--mc-silver2:#A29C94;
  --mc-paper:#FBFAF7;--mc-paper2:#E1E4E9;--mc-pline:#AEB5C0;--mc-red:#E2334A;--mc-red2:#B3263B;
  --mc-fir:#1FB5A8;--mc-fir2:#0E8F85;--mc-zaf:#E9A72A;--mc-ind:#3A48A8;--mc-ink:#1A1C23;--mc-steel:#3A3F4B;
  --mc-ivory:#FBF8F2;--mc-chair:#3B424E;--mc-chair2:#4C5462;--mc-leaf:#3FA77A;--mc-leaf2:#2C8460;--mc-hair:#2E1F1A}
.mc-art{--robe:#2F7A63;--robe2:#225846;--shirt:var(--mc-ivory)}
.mc-art.e2{--robe:#3446A0;--robe2:#26357C;--shirt:#DCE8F5}
.mc-art.e3{--robe:#A8733F;--robe2:#83582E}
.mc-art.e4{--robe:#B8345A;--robe2:#8E2645}
.mc-art.e5{--robe:#5A6170;--robe2:#434956}
.mc-art .k-sh{fill:#000;opacity:.26}
.mc-art .k-chr{fill:var(--mc-chair)}
.mc-art .k-chr2{fill:none;stroke:var(--mc-chair2);stroke-width:2;stroke-linecap:round}
.mc-art .k-r1{fill:var(--robe)}
.mc-art .k-sv{fill:none;stroke:var(--robe);stroke-width:12;stroke-linecap:round}
.mc-art .k-rib{fill:none;stroke:var(--robe2);stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}
.mc-art .k-rib2{fill:none;stroke:var(--robe2);stroke-width:1.5;stroke-linecap:round}
.mc-art .k-lap{fill:none;stroke:var(--robe2);stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.mc-art .k-iv,.mc-art .k-cf{fill:var(--shirt)}
.mc-art .k-col{fill:var(--shirt);stroke:rgba(0,0,0,.16);stroke-width:.8;stroke-linejoin:round}
.mc-art .k-sk{fill:var(--mc-skin)}
.mc-art .k-sk2{fill:var(--mc-skin2)}
.mc-art .k-ck{fill:var(--mc-cheek);opacity:.5}
.mc-art .k-ey{fill:var(--mc-eye)}
.mc-art .k-hl{fill:#fff}
.mc-art .k-nh{fill:#fff;opacity:.42}
.mc-art .k-wr{fill:none;stroke:var(--mc-skin2);stroke-width:1.1;stroke-linecap:round}
.mc-art .k-hw,.mc-art .k-bw{fill:var(--mc-white)}
.mc-art .k-hwl,.mc-art .k-bwd{fill:none;stroke:var(--mc-white2);stroke-width:1.3;stroke-linecap:round}
.mc-art .k-bwl{fill:none;stroke:var(--mc-white);stroke-width:3.4;stroke-linecap:round}
.mc-art .k-hs,.mc-art .k-hgy,.mc-art .k-gb{fill:var(--mc-silver)}
.mc-art .k-hgl{fill:none;stroke:var(--mc-silver2);stroke-width:1.2;stroke-linecap:round}
.mc-art .k-wisp{fill:none;stroke:var(--mc-silver);stroke-width:1.4;stroke-linecap:round}
.mc-art .k-shine{fill:none;stroke:#fff;stroke-opacity:.34;stroke-width:2.4;stroke-linecap:round}
.mc-art .k-gbr{fill:none;stroke:#ABA399;stroke-width:2.6;stroke-linecap:round;transition:transform .3s var(--ease-out,ease)}
.mc-art .k-hr{fill:#A8A29B}
.mc-art .k-hrl{fill:none;stroke:#C9C3BC;stroke-width:1.3;stroke-linecap:round}
.mc-art .k-hc{fill:#99928A}
.mc-art .k-hct{fill:none;stroke:#B4ADA5;stroke-width:1.1;stroke-linecap:round}
.mc-art .k-ear,.mc-art .k-prl circle{fill:#fff;stroke:#CFC9C0;stroke-width:.5}
.mc-art .k-mo{fill:none;stroke:#7A3B36;stroke-width:1.8;stroke-linecap:round}
.mc-art .k-mo2{fill:#A8434F}
.mc-art .k-gl{fill:rgba(255,255,255,.14);stroke:var(--mc-ink);stroke-width:1.6;stroke-linecap:round}
.mc-art.e2 .k-gl{stroke:#6B4A2E;stroke-width:1.7}
.mc-art .k-gl.k-glr{stroke:var(--mc-red)}
.mc-art .mc-glint{fill:none;stroke:#fff;stroke-width:1.4;stroke-linecap:round;opacity:0}
.mc-art .k-psq,.mc-art .k-clipf{fill:var(--mc-fir)}
.mc-art .k-zf{fill:var(--mc-zaf)}
.mc-art .k-bt{fill:var(--mc-red)}
.mc-art .k-btk{fill:var(--mc-red2)}
.mc-art .k-dbr{fill:none;stroke:#4A4440;stroke-width:2.6;stroke-linecap:round}
.mc-art .k-ms{fill:#5E5853}
.mc-art .k-tn{fill:var(--mc-ink)}
.mc-art .k-tnl{fill:none;stroke:#2E313A;stroke-width:1.2;stroke-linecap:round}
.mc-art .k-db{fill:#857D75}
.mc-art .k-dbt{fill:none;stroke:#ABA39B;stroke-width:1.3;stroke-linecap:round}
.mc-art .k-gs{fill:none;stroke:#5E5751;stroke-width:1.3;stroke-linecap:round}
.mc-art .k-dbr2{fill:none;stroke:#4A433E;stroke-width:3.4;stroke-linecap:round}
.mc-art .k-pg{fill:var(--mc-paper)}
.mc-art .k-pg2{fill:var(--mc-paper2)}
.mc-art .k-pl{fill:none;stroke:var(--mc-pline);stroke-width:1.4;stroke-linecap:round}
.mc-art .k-pl2{fill:none;stroke:var(--mc-paper2);stroke-width:1.6}
.mc-art .k-ple{fill:none;stroke:#7D8592;stroke-width:1.8;stroke-linecap:round}
.mc-art .k-fl{fill:none;stroke:var(--mc-fir);stroke-width:2.2;stroke-linecap:round}
.mc-art .k-bk{fill:var(--mc-red)}
.mc-art .k-rb{fill:var(--mc-zaf)}
.mc-art .k-bind{fill:var(--mc-steel)}
.mc-art .k-hd{fill:none;stroke:var(--mc-ink);stroke-width:3.6;stroke-linecap:round}
.mc-art .k-lens{fill:rgba(190,235,240,.5)}
.mc-art .k-rim{fill:none;stroke:var(--mc-steel);stroke-width:2.4}
.mc-art .k-lhl{fill:none;stroke:#fff;stroke-width:1.4;stroke-linecap:round;opacity:.85}
.mc-art .k-ink{fill:none;stroke:var(--mc-ind);stroke-width:1.5;stroke-linecap:round}
.mc-art .k-fpb{fill:none;stroke:var(--mc-ink);stroke-width:4.4;stroke-linecap:round}
.mc-art .k-fpc{fill:none;stroke:var(--mc-zaf);stroke-width:4.8}
.mc-art .k-nib{fill:var(--mc-zaf)}
.mc-art .k-red{fill:none;stroke:var(--mc-red);stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
.mc-art .k-pen{fill:none;stroke:var(--mc-red);stroke-width:3.6;stroke-linecap:round}
.mc-art .k-pnc{fill:none;stroke:#fff;stroke-width:3.8}
.mc-art .k-pnt{fill:#3A2A2A}
.mc-art .k-stk,.mc-art .k-stm{fill:var(--mc-fir)}
.mc-art .k-stmo{fill:none;stroke:var(--mc-fir);stroke-width:1.4}
.mc-art .k-stb{fill:var(--mc-steel)}
.mc-art .k-wdh{fill:#fff;opacity:.3}
.mc-art .k-hrn{fill:var(--mc-hair)}
.mc-art .k-nr{fill:var(--mc-red)}
.mc-art .k-gd{fill:var(--mc-zaf)}
.mc-art .k-nzr{fill:#135E59}
.mc-art .k-nzh{fill:var(--mc-red)}
.mc-art .k-nza{fill:none;stroke:#135E59;stroke-width:7;stroke-linecap:round}
.mc-art .k-ew{fill:#fff}
.mc-art .k-ir{fill:#4A2C1C}
.mc-art .k-lash{fill:none;stroke:var(--mc-hair);stroke-width:1.4;stroke-linecap:round}
.mc-art .k-nbr{fill:none;stroke:var(--mc-hair);stroke-width:1.8;stroke-linecap:round}
.mc-art .k-nzm{fill:#8E3442}
.mc-art .k-nzb{fill:none;stroke:var(--mc-fir);stroke-width:4.6;stroke-linecap:round}
.mc-art .mc-eye{transform-box:fill-box;transform-origin:center;transition:transform .07s}
.mc-art .mc-eyes{transition:transform .5s var(--ease-out,ease)}
.mc-art .mc-flo,.mc-art .mc-strk,.mc-art .mc-care{stroke-dasharray:1;stroke-dashoffset:1}
.mc-art .mc-imp{opacity:0;transform-box:fill-box;transform-origin:center}
.mc-art .mc-flip{transform-box:fill-box;transform-origin:0% 50%}
.mc-art .mc-mst{transform-box:fill-box;transform-origin:50% 40%}
.mc-art .mc-fig{transform-box:view-box;transform-origin:60px 108px}
.mc-art .mc-body{transform-box:view-box;transform-origin:60px 108px}
.mc-art .mc-head{transform-box:view-box;transform-origin:60px 74px}
.mc-art .mc-arm{transform-box:view-box;transform-origin:79px 85px}
.mc-art.e4 .mc-arm{transform-origin:79px 86px}
.mc-art.e5 .mc-arm{transform-origin:93px 100px}
.mc-art .mc-stp{transform-box:fill-box;transform-origin:50% 100%}
.mc-art .mc-nf{transform-box:view-box;transform-origin:50px 120px}
.mc-art .mc-nh{transform-box:view-box;transform-origin:50px 64px;transition:transform .4s var(--ease-out,ease)}
.mc-art .mc-nb{transform-box:view-box;transform-origin:71px 50px;animation:mc-sway 3.2s ease-in-out infinite}

/* overlay shell — dark in both themes; --mc-acc is firuzə lifted for text on the dark panels */
.mc{--mc-acc:color-mix(in srgb,var(--firuze) 80%,white);
  position:fixed;inset:0;z-index:var(--z-meclis,70);overflow-x:hidden;overflow-y:auto;overscroll-behavior:contain;color:var(--on-deep);
  display:grid;justify-items:center;align-content:start;
  padding:max(14px,env(safe-area-inset-top,0px)) var(--gutter,16px) max(20px,env(safe-area-inset-bottom,0px));
  font-family:var(--f-body);animation:mc-in .3s var(--ease-out) both}
@media (min-height:700px){.mc{align-content:center}}
.mc.out{animation:mc-out .28s var(--ease-in-out) forwards;pointer-events:none}
.mc-bg{position:fixed;inset:0;z-index:-1;pointer-events:none;
  background:radial-gradient(70% 46% at 50% 22%,color-mix(in srgb,var(--firuze) 12%,transparent),transparent 72%),
    linear-gradient(180deg,var(--deep) 0%,var(--deep-2) 100%)}
.mc-bg::before{content:"";position:absolute;inset:0;background:var(--firuze);opacity:.035;-webkit-mask:var(--m-field) 0 0/56px 56px repeat;mask:var(--m-field) 0 0/56px 56px repeat}
.mc-bg::after{content:"";position:absolute;inset:0;background:radial-gradient(120% 90% at 50% 40%,transparent 55%,rgba(0,0,0,.38))}
.mc-in{position:relative;width:min(760px,100%);min-width:0;display:grid;gap:14px}
.mc-h{display:flex;align-items:flex-start;gap:12px;min-width:0;animation:mc-rise .45s var(--ease-out) .05s both}
.mc-ht{flex:1;min-width:0;display:grid;gap:3px}
.mc-h .eyebrow{color:var(--mc-acc)}
.mc-h h2{margin:0;font-family:var(--f-display);font-weight:600;font-style:normal;font-size:clamp(1.25rem,1.05rem + 1vw,1.75rem);line-height:1.15;letter-spacing:-.01em;color:var(--on-deep);text-wrap:balance;overflow-wrap:anywhere}
.mc .mc-x{flex:none;color:var(--on-deep);background:color-mix(in srgb,var(--on-deep) 8%,transparent);border-color:color-mix(in srgb,var(--on-deep) 18%,transparent)}
@media (hover:hover){.mc .mc-x:hover{background:color-mix(in srgb,var(--on-deep) 16%,transparent)}}
.mc :focus-visible{outline:2px solid var(--mc-acc);outline-offset:2px}
.mc:focus,.mc:focus-visible{outline:none}

/* stage — a modern studio: wall with window, kilim and shelf; the desk across the front */
.mc-stage{--k:.92;--mc-wallc:color-mix(in srgb,var(--deep) 90%,white);--mc-desk:color-mix(in srgb,var(--deep) 68%,white);
  position:relative;justify-self:center;width:min(100%,max(300px,calc((100vh - 330px) * 1.5)));aspect-ratio:3/2;border-radius:var(--r-xl,24px);overflow:hidden;isolation:isolate;
  background:
    radial-gradient(30% 44% at 11% 30%,color-mix(in srgb,var(--mc-acc) 16%,transparent),transparent 72%),
    linear-gradient(180deg,transparent 70%,color-mix(in srgb,var(--on-deep) 12%,transparent) 70%,color-mix(in srgb,var(--on-deep) 12%,transparent) calc(70% + 1px),transparent calc(70% + 1px)),
    linear-gradient(180deg,var(--mc-wallc) 0%,color-mix(in srgb,var(--mc-wallc) 80%,black) 70%,color-mix(in srgb,var(--deep-2) 86%,black) 70%,var(--deep-2) 100%);
  box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--on-deep) 12%,transparent),0 30px 60px -30px rgba(0,0,0,.6);
  animation:mc-rise .5s var(--ease-out) .08s both}
@supports (height:100dvh){.mc-stage{width:min(100%,max(300px,calc((100dvh - 330px) * 1.5)))}}
.mc-stage::after{content:"";position:absolute;inset:0;z-index:8;pointer-events:none;border-radius:inherit;box-shadow:inset 0 0 calc(var(--k) * 56px) rgba(0,0,0,.32)}
.mc-wall{position:absolute;inset:0;pointer-events:none}
.mc-win{position:absolute;left:3%;top:8%;z-index:1;width:15%;height:auto;overflow:visible}
.mc-win .w-fr{fill:color-mix(in srgb,var(--on-deep) 16%,var(--deep))}
.mc-win .w-s1{stop-color:color-mix(in srgb,var(--mc-acc) 46%,var(--deep))}
.mc-win .w-s2{stop-color:color-mix(in srgb,var(--mc-acc) 12%,var(--deep))}
.mc-win .w-city{fill:color-mix(in srgb,var(--deep-2) 84%,var(--mc-acc))}
.mc-win .w-lit{fill:none;stroke:var(--zafaran);stroke-width:1.6;opacity:.85}
.mc-win .w-fr2{fill:none;stroke:color-mix(in srgb,var(--on-deep) 16%,var(--deep));stroke-width:3}
.mc-win .w-hl{fill:none;stroke:#fff;stroke-opacity:.16;stroke-width:2;stroke-linecap:round}
.mc-win .w-sill{fill:color-mix(in srgb,var(--on-deep) 26%,var(--deep))}
.mc-shelf{position:absolute;left:63%;top:14%;z-index:1;width:20%;height:auto}
.mc-shelf .sh-pl{fill:color-mix(in srgb,var(--on-deep) 24%,var(--deep))}
.mc-shelf .sh-b1{fill:color-mix(in srgb,var(--lacquer) 72%,var(--deep))}
.mc-shelf .sh-b2{fill:color-mix(in srgb,var(--zafaran) 78%,var(--deep))}
.mc-shelf .sh-b3{fill:color-mix(in srgb,var(--mc-acc) 58%,var(--deep))}
.mc-shelf .sh-b4{fill:color-mix(in srgb,var(--nar) 74%,var(--deep))}
.mc-shelf .sh-b5{fill:color-mix(in srgb,var(--on-deep) 56%,var(--deep))}
.mc-shelf .sh-v{fill:color-mix(in srgb,var(--on-deep) 72%,var(--deep))}
.mc-shelf .sh-lf{fill:none;stroke:var(--mc-leaf);stroke-width:1.6;stroke-linecap:round}
.mc-plant{position:absolute;left:86.5%;bottom:1%;z-index:2;width:13%;pointer-events:none}
.mc-plnt{display:block;width:100%;height:auto}
.mc-plnt .p-l1{fill:var(--mc-leaf)}
.mc-plnt .p-l2{fill:var(--mc-leaf2)}
.mc-plnt .p-ln{fill:none;stroke:#fff;stroke-opacity:.18;stroke-width:1;stroke-linecap:round}
.mc-plnt .p-pot{fill:var(--zafaran)}
.mc-plnt .p-rim{fill:color-mix(in srgb,var(--zafaran) 76%,black)}
.mc-plnt .p-band{fill:none;stroke:color-mix(in srgb,var(--zafaran) 72%,black);stroke-width:1.4}

/* kilim on the wall — unrolls downward from its rod */
.mc-rug{position:absolute;left:27%;top:6%;z-index:1;width:32%;pointer-events:none}
.mc-rug-in{position:relative;clip-path:inset(0 0 100% 0)}
.mc-kil{display:block;width:100%;height:auto}
.mc-kil .kl-f{fill:color-mix(in srgb,var(--deep-2) 78%,black)}
.mc-kil .kl-a{fill:var(--nar)}
.mc-kil .kl-b{fill:var(--mc-acc)}
.mc-kil .kl-c{fill:var(--zafaran)}
.mc-kil .kl-ln{fill:none;stroke:var(--zafaran);stroke-width:.8;opacity:.7}
.mc-rod{position:absolute;left:-5%;right:-5%;top:calc(var(--k) * -4px);z-index:2;height:calc(var(--k) * 4px);border-radius:999px;background:color-mix(in srgb,var(--on-deep) 34%,var(--deep))}
.mc-rod::before,.mc-rod::after{content:"";position:absolute;top:50%;width:calc(var(--k) * 7px);aspect-ratio:1;border-radius:50%;transform:translateY(-50%);background:inherit}
.mc-rod::before{left:-2px}
.mc-rod::after{right:-2px}
.mc-rug-roll{position:absolute;left:-1.5%;right:-1.5%;top:0;height:9%;border-radius:999px;transform:translateY(-50%);opacity:0;
  background:linear-gradient(180deg,color-mix(in srgb,var(--rug) 55%,black),var(--rug) 32%,color-mix(in srgb,var(--rug) 62%,white) 50%,var(--rug) 68%,color-mix(in srgb,var(--rug) 55%,black))}
.mc-rug-fr{position:absolute;left:3%;right:3%;top:100%;height:calc(var(--k) * 6px);opacity:0;transition:opacity .4s ease .85s;
  background:repeating-linear-gradient(90deg,color-mix(in srgb,var(--on-deep) 46%,transparent) 0 1.5px,transparent 1.5px 4.5px)}
.mc.is-rug .mc-rug-in{clip-path:inset(0);transition:clip-path 1.05s var(--ease-out)}
.mc.is-rug .mc-rug-roll{animation:mc-roll 1.05s var(--ease-out) both}
.mc.is-rug .mc-rug-fr{opacity:.8}

/* desk: the top surface sits behind the elders, the front panel (with name plates) in front */
.mc-dtop{position:absolute;left:1.5%;right:13.5%;bottom:19.5%;z-index:1;height:11.5%;pointer-events:none;clip-path:polygon(1.2% 0,98.8% 0,100% 100%,0 100%);
  background:linear-gradient(180deg,color-mix(in srgb,var(--mc-desk) 74%,black),var(--mc-desk) 40%,color-mix(in srgb,var(--mc-desk) 88%,white))}
.mc-dfront{position:absolute;left:1.5%;right:13.5%;bottom:2%;z-index:5;height:17.5%;pointer-events:none;border-radius:0 0 calc(var(--k) * 6px) calc(var(--k) * 6px);
  background:linear-gradient(180deg,color-mix(in srgb,var(--mc-desk) 58%,black),color-mix(in srgb,var(--mc-desk) 44%,black));
  box-shadow:inset 0 calc(var(--k) * 2.5px) 0 var(--mc-acc)}
.mc-dfront::before{content:"";position:absolute;left:2.5%;right:2.5%;bottom:calc(var(--k) * 5px);height:calc(var(--k) * 6px);opacity:.75;
  background:linear-gradient(90deg,var(--nar) 0 50%,var(--mc-acc) 50% 100%) 0 0/calc(var(--k) * 16px) 100% repeat-x;
  -webkit-mask:var(--m-band) 0 0/calc(var(--k) * 16px) 100% repeat-x,var(--m-band2) 0 0/calc(var(--k) * 16px) 100% repeat-x;
  mask:var(--m-band) 0 0/calc(var(--k) * 16px) 100% repeat-x,var(--m-band2) 0 0/calc(var(--k) * 16px) 100% repeat-x}
.mc-stage.mc-two .mc-dfront::before{display:none}
.mc-dfront::after{content:"";position:absolute;left:1%;right:1%;top:100%;height:calc(var(--k) * 7px);background:radial-gradient(closest-side,rgba(0,0,0,.55),transparent)}
.mc-lap{position:absolute;left:5.6%;bottom:19.9%;z-index:4;width:8.6%;pointer-events:none}
.mc-mug{position:absolute;left:66.8%;bottom:20.2%;z-index:4;width:3.4%;min-width:12px;pointer-events:none}
.mc-lap svg,.mc-mug svg{display:block;width:100%;height:auto;overflow:visible}
.mc-lap .lp-lid{fill:color-mix(in srgb,var(--on-deep) 30%,var(--deep))}
.mc-lap .lp-base{fill:color-mix(in srgb,var(--on-deep) 44%,var(--deep))}
.mc-lap .lp-g{fill:var(--nar)}
.mc-lap .lp-r{fill:var(--ivory)}
.mc-lap .lp-d{fill:var(--firuze)}
.mc-mug .mg-c{fill:var(--mc-acc)}
.mc-mug .mg-h{fill:none;stroke:var(--mc-acc);stroke-width:2.6}
.mc-mug .mg-g{fill:var(--deep-2)}
.mc-mug .mg-st{fill:none;stroke:var(--on-deep);stroke-opacity:.5;stroke-width:1.4;stroke-linecap:round;animation:mc-steam 3.2s ease-in-out infinite}

/* elders */
.mc-elder{position:absolute;left:var(--x);bottom:var(--b);z-index:var(--z);width:24%;margin:0;padding:0;border:0;border-radius:14px;background:none;color:inherit;font:inherit;
  display:grid;justify-items:center;cursor:pointer;isolation:isolate;-webkit-tap-highlight-color:transparent;
  transform-origin:50% 75.7%;transform:translate(-50%,7%) scale(var(--s));opacity:0;
  transition:opacity .5s var(--ease-out),transform .55s var(--ease-spring)}
.mc-elder svg{display:block;width:100%;height:auto;overflow:visible;transition:filter .45s var(--ease-out)}
.mc-elder::before{content:"";position:absolute;left:50%;bottom:14%;z-index:-1;width:120%;height:96%;transform:translateX(-50%);border-radius:50%;pointer-events:none;
  background:radial-gradient(closest-side,color-mix(in srgb,var(--mc-acc) 34%,transparent),transparent);opacity:0;transition:opacity .4s var(--ease-out)}
.mc.is-elders .mc-elder{opacity:1;transform:translate(-50%,0) scale(var(--s))}
.mc.is-elders:not(.is-ready) .mc-elder{transition-delay:calc(var(--i) * 110ms)}
.mc.is-elders .mc-elder.is-on{transform:translate(-50%,0) scale(calc(var(--s) * 1.06))}
.mc-elder.is-on::before{opacity:1}
.mc.is-work .mc-elder:not(.is-on) svg{filter:brightness(.74) saturate(.86)}
.mc-plate{position:absolute;left:var(--x);bottom:8.2%;z-index:7;transform:translateX(-50%);display:inline-flex;align-items:center;padding:.3em .62em;border-radius:999px;white-space:nowrap;pointer-events:none;
  font:600 clamp(10.5px,var(--k) * 11.5px,13.5px)/1.15 var(--f-body);letter-spacing:.01em;color:var(--on-deep-soft);
  background:color-mix(in srgb,var(--deep-2) 78%,transparent);border:1px solid color-mix(in srgb,var(--on-deep) 16%,transparent);opacity:0;
  transition:opacity .5s var(--ease-out),color .3s,background .3s,border-color .3s,box-shadow .3s}
.mc-stage.mc-two .mc-plate{bottom:2.2%;padding:.22em .56em;font-size:clamp(9.5px,var(--k) * 10.5px,13.5px)}
.mc-stage.mc-two .mc-plate.p2,.mc-stage.mc-two .mc-plate.p4{bottom:10.2%}
.mc-plate b{font-weight:600}
.mc.is-elders .mc-plate{opacity:1}
.mc.is-elders:not(.is-ready) .mc-plate{transition-delay:calc(var(--i) * 110ms + .15s)}
.mc-plate.is-on{color:var(--deep-2);background:var(--mc-acc);border-color:var(--mc-acc);box-shadow:0 0 16px color-mix(in srgb,var(--mc-acc) 45%,transparent)}
.mc-plate.is-done,.mc-plate.is-warn{color:var(--on-deep)}
.mc-tick{position:absolute;top:-.66em;right:-.82em;display:none;width:1.32em;height:1.32em;border-radius:50%;place-items:center;background:var(--mc-acc);color:var(--deep-2);
  box-shadow:0 0 0 2px color-mix(in srgb,var(--mc-desk) 50%,black);font-style:normal;font-weight:800;font-size:1em;line-height:1}
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
/* 5 Möhürdar raises and stamps */
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

/* the shared document — flies in above everything, then lies on the desk under Üslubçu's pen (class "tumar" kept for the ceremony code) */
.mc-tumar{position:absolute;left:43%;bottom:19.9%;z-index:7;width:24%;pointer-events:none;opacity:0;transform-origin:50% 100%;
  transform:translate(-50%,0) perspective(var(--mc-p,600px)) rotateX(50deg) scale(1)}
.mc-tumar.is-open{z-index:2}
.mc-tumar svg{display:block;width:100%;height:auto;overflow:visible}
.mc-tumar.is-in{animation:mc-tumar-in .7s var(--ease-out) both}
.mc-tsvg .k-pl{stroke-width:2.4}
.mc-tsvg .t-pg,.mc-tsvg .t-rl{transform-box:fill-box;transform-origin:50% 0;transform:scaleY(.34);transition:transform .75s var(--ease-out)}
.mc-tsvg .t-rl{transition-delay:.06s}
.mc-tumar.is-open .t-pg,.mc-tumar.is-open .t-rl{transform:none}
.mc-tsvg .t-ttl{fill:none;stroke:var(--mc-fir);stroke-width:3.6;stroke-linecap:round}
.mc-tsvg .t-clip{fill:none;stroke:#fff;stroke-opacity:.35;stroke-width:1.6;stroke-linecap:round}
.mc-tsvg .mk{fill:none;stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1;stroke-dashoffset:1;transition:stroke-dashoffset .6s var(--ease-out)}
.mc-tsvg .mk1{stroke:var(--mc-zaf)}
.mc-tsvg .mk2{stroke:var(--mc-fir2)}
.mc-tsvg .mk3{stroke:var(--mc-ind)}
.mc-tsvg .mk4{stroke:var(--mc-red)}
.mc-tsvg .mk5{opacity:0;transform-box:fill-box;transform-origin:center;transform:scale(1.9);transition:opacity .2s,transform .4s var(--ease-spring)}
.mc-tsvg .t-stmo{fill:none;stroke:var(--mc-fir);stroke-width:2.2}
.mc-tsvg .t-stm{fill:var(--mc-fir)}
.mc-tumar.m1 .mk1,.mc-tumar.m2 .mk2,.mc-tumar.m3 .mk3,.mc-tumar.m4 .mk4{stroke-dashoffset:0}
.mc-tumar.m5 .mk5{opacity:1;transform:none}

/* Nuanza — stands beside the end of the desk */
.mc-nz{position:absolute;left:93%;bottom:1.5%;z-index:6;width:12%;min-width:44px;opacity:0;transform:translateX(-50%);cursor:pointer;-webkit-tap-highlight-color:transparent}
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
.mc-bub b{display:block;margin-bottom:1px;font-size:var(--fs-xs,.75rem);font-weight:600;color:var(--firuze)}
.mc-bub::after{content:"";position:absolute;top:calc(100% - 1px);left:var(--ax,50%);width:12px;height:7px;transform:translateX(-50%);background:var(--surface);clip-path:polygon(0 0,100% 0,50% 100%)}

/* status panel */
.mc-panel{display:grid;gap:12px;min-width:0}
.mc-run{display:grid;gap:12px;padding:14px 16px;border-radius:var(--r-lg,18px);
  background:color-mix(in srgb,var(--deep-2) 74%,transparent);border:1px solid color-mix(in srgb,var(--on-deep) 13%,transparent);
  box-shadow:0 18px 40px -24px rgba(0,0,0,.6);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);animation:mc-rise .5s var(--ease-out) .16s both}
.mc-prog{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px}
.mc-prog i{display:block;height:4px;border-radius:999px;overflow:hidden;background:color-mix(in srgb,var(--on-deep) 14%,transparent)}
.mc-prog b{display:block;width:0;height:100%;border-radius:inherit;background:var(--mc-acc)}
.mc-prog i.ok b{width:100%;background:var(--mc-acc)}
.mc-prog i.warn b{width:100%;background:var(--zafaran)}
.mc-now{display:flex;align-items:center;gap:12px;min-width:0}
.mc-av{flex:none;width:46px;height:46px;border-radius:50%;overflow:hidden;display:grid;place-items:center;
  background:radial-gradient(circle at 50% 30%,color-mix(in srgb,var(--mc-acc) 18%,transparent),color-mix(in srgb,var(--on-deep) 6%,transparent));
  box-shadow:inset 0 0 0 1.5px color-mix(in srgb,var(--mc-acc) 60%,transparent)}
.mc-av svg{display:block;width:100%;height:100%}
.mc-av.pop{animation:mc-pop .45s var(--ease-spring)}
.mc-gul-av{width:70%!important;height:70%!important}
.mc-gul-av .s1{fill:var(--nar)}
.mc-gul-av .s2{fill:var(--ivory)}
.mc-gul-av .s3{fill:var(--firuze)}
.mc-now-tx{flex:1;min-width:0;display:grid;gap:1px}
.mc-now-tx b{font-family:var(--f-display);font-size:var(--fs-md,1.0625rem);font-weight:600;line-height:1.2;color:var(--on-deep)}
.mc-now-tx small{font-size:var(--fs-xs,.75rem);color:var(--on-deep-soft);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mc-cnt{flex:none;font-size:var(--fs-sm,.8125rem);font-weight:600;color:var(--mc-acc);font-variant-numeric:tabular-nums}
.mc-line{display:flex;align-items:flex-start;gap:9px;min-height:2.95em;margin:0;font-size:var(--fs-base,.9375rem);line-height:1.45;color:var(--on-deep)}
.mc-li{display:none;flex:none;width:20px;height:20px;margin-top:1px;border-radius:50%;place-items:center;color:var(--deep-2);font-weight:800;font-size:.8rem}
.mc-li svg{width:13px;height:13px}
.mc-line.ok .mc-li{display:grid;background:var(--mc-acc);animation:mc-pop .4s var(--ease-spring) both}
.mc-line.warn .mc-li{display:grid;background:var(--zafaran);animation:mc-pop .4s var(--ease-spring) both}
.mc-line.warn .mc-li svg{display:none}
.mc-line.warn .mc-li::after{content:"!"}
.mc-lt{min-width:0}
.mc-dots{display:inline-flex;gap:3px;margin-left:5px;vertical-align:middle;white-space:nowrap}
.mc-dots i{width:4px;height:4px;border-radius:50%;background:var(--mc-acc);animation:mc-dot 1.1s ease-in-out infinite}
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
.mc-v-h{margin:0;font-family:var(--f-display);font-size:var(--fs-xl,1.5rem);font-weight:600;font-style:normal;line-height:1.15;letter-spacing:-.01em;color:var(--ok)}
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
.mc-seal{position:absolute;top:-22px;right:-8px;width:88px;height:88px;opacity:0;transform:rotate(-12deg);pointer-events:none;color:var(--firuze)}
.mc-seal.t-mid{color:var(--zafaran-ink)}
.mc-seal.t-low{color:var(--nar)}
.mc-seal svg{display:block;width:100%;height:100%;overflow:visible}
.mc-seal::before{content:"";position:absolute;inset:-18%;border-radius:50%;background:radial-gradient(closest-side,color-mix(in srgb,currentColor 34%,transparent),transparent);opacity:0;transform:scale(.4)}
.mc-seal.is-stamp{animation:mc-stamp .62s cubic-bezier(.5,0,.25,1) both}
.mc-seal.is-stamp::before{animation:mc-splash .7s ease-out .3s backwards}
.mc-seal .s-bg{fill:var(--surface)}
.mc-seal .s-ring{fill:none;stroke:currentColor;stroke-width:3.4}
.mc-seal .s-ring2{fill:none;stroke:currentColor;stroke-width:1.4}
.mc-seal .s-tx{fill:currentColor;font:700 8.2px/1 var(--f-body);letter-spacing:.06em}
.mc-seal .s-gul,.mc-seal .s-core{fill:currentColor}
.mc-seal .s-gul2{fill:var(--surface)}
.mc-v-act{display:flex;justify-content:flex-end;gap:10px;animation:mc-rise .5s var(--ease-out) .25s both}
.mc-v-act .btn{min-width:168px}
@media (max-width:520px){.mc-v-act .btn{flex:1}}
@media (max-width:420px){.mc-seal{width:74px;height:74px;top:-18px;right:-6px}.mc-v-top{padding-right:62px}.mc-v-score .ring{--size:100px}}
.mc-pt{position:fixed;z-index:12;width:9px;height:9px;margin:-4.5px 0 0 -4.5px;border-radius:50%;pointer-events:none;background:var(--mc-acc);animation:mc-pt .8s var(--ease-out) forwards}
.mc-pt.star{width:12px;height:12px;margin:-6px 0 0 -6px;border-radius:0;background:var(--zafaran);-webkit-mask:var(--m-star) center/contain no-repeat;mask:var(--m-star) center/contain no-repeat}

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
.mc.mc-rm .mg-st{animation:none}
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
@keyframes mc-steam{0%,100%{opacity:.25;transform:translateY(1px)}50%{opacity:.8;transform:translateY(-1.5px)}}
@keyframes mc-tumar-in{
  0%{opacity:0;transform:translate(calc(-50% + var(--fx,0px)),var(--fy,0px)) perspective(var(--mc-p,600px)) rotateX(0deg) scale(.3)}
  18%{opacity:1}
  55%{transform:translate(calc(-50% + var(--fx,0px) * .38),calc(var(--fy,0px) * .38 - 26px)) perspective(var(--mc-p,600px)) rotateX(20deg) scale(.6)}
  100%{opacity:1;transform:translate(-50%,0) perspective(var(--mc-p,600px)) rotateX(50deg) scale(1)}}
@keyframes mc-roll{0%{top:0;height:10%;opacity:1}86%{opacity:1}100%{top:100%;height:3%;opacity:0}}
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
    /* name plates on the desk front: two staggered rows when neighbours would touch */
    var two = false, pl = S.plates || [];
    for (var i = 0; i + 1 < pl.length; i++) {
      if ((pl[i].offsetWidth + pl[i + 1].offsetWidth) / 2 + 6 > (SEATS[i + 1].x - SEATS[i].x) / 100 * w) { two = true; break; }
    }
    S.stage.classList.toggle('mc-two', two);
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
      return '<span class="mc-plate p' + (i + 1) + ' motion-safe" aria-hidden="true" style="--x:' + p.x + '%;--i:' + p.i + '"><i class="mc-tick">' + IC.check + '</i><b>' + esc(e.short) + '</b></span>';
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
          '<div class="mc-wall" aria-hidden="true">' + windowSvg() + shelfSvg() +
            '<div class="mc-rug motion-safe"><i class="mc-rod"></i><div class="mc-rug-in">' + kilimSvg() + '</div><i class="mc-rug-roll"></i><i class="mc-rug-fr"></i></div>' +
            '<span class="mc-plant">' + plantSvg() + '</span></div>' +
          '<span class="mc-dtop" aria-hidden="true"></span>' +
          elders +
          '<span class="mc-lap" aria-hidden="true">' + laptopSvg() + '</span><span class="mc-mug motion-safe" aria-hidden="true">' + mugSvg() + '</span>' +
          '<div class="mc-tumar motion-safe" aria-hidden="true">' + tumarSvg() + '</div>' +
          '<span class="mc-dfront" aria-hidden="true"></span>' +
          plates +
          '<div class="mc-nz motion-safe" aria-hidden="true"><div class="mc-nz-in"><div class="mc-mc-nf"></div><div class="mc-nz-scr">' + NZ_DOC + '</div></div></div>' +
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
    if (k === 'intro') { av = gulAvatar(); nm = 'Mirzə Məclisi'; rl = 'Beş qoca mirzə · beş yoxlama'; line = 'Divarda xalça açılır, mirzələr yerini tutur'; }
    else if (k === 'nuanza') { av = nzPortrait(); nm = 'Nuanza'; rl = 'Köməkçi'; line = 'Nuanza sənədi Məclisə gətirir'; }
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
      '<div class="mc-seal t-' + tone + ' motion-safe" aria-hidden="true">' + sealSvg() + '</div>';
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
      try { if (D.fonts && D.fonts.ready) D.fonts.ready.then(function () { if (!S.closed) fit(S); }); } catch (e) { /* ignore */ }

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
            : ['Mirzələr tələsməyi sevmir, amma heç nə qaçırmırlar.', 'Sənədi özüm gətirdim!', 'Bir az səbr — Məclis işləyir.'];
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
