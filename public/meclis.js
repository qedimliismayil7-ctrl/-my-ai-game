/* =====================================================================
   NUANZA — Mirzə Məclisi (meclis.js)
   The council of five elder editors that gathers for big jobs.
   window.Meclis.run({title, durations?, verdict:{score?, text, seal?, errors?}}) -> Promise (resolves on close)
   window.Meclis.elders — the five elders (data). Meclis.portrait(i) / Meclis.figure(i) -> SVG strings.
   Overlay: a calm review panel — the document under review, five reviewers shown as restrained monograms,
   each check runs in turn (same timings), then the verdict with a score ring, signatures and a quiet seal.
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

  /* restrained monograms (two letters in a hairline circle) — the reviewers' marks everywhere */
  var MONO = ['Lü', 'Mə', 'Üs', 'Dn', 'Mö'];
  function monogram(txt, cls) {
    return '<svg class="mc-art mc-mono-svg' + (cls ? ' ' + cls : '') + '" viewBox="0 0 40 40" aria-hidden="true" focusable="false">' +
      '<circle class="mo-bg" cx="20" cy="20" r="19.5"/><text class="mo-tx" x="20" y="20.5" text-anchor="middle" dominant-baseline="central">' + esc(txt) + '</text></svg>';
  }
  function figure(i) { injectCss(); return monogram(MONO[i] || '·', 'e' + (i + 1)); }
  function portrait(i) { injectCss(); return monogram(MONO[i] || '·', 'e' + (i + 1)); }
  function nzPortrait() { return monogram('N', 'nz'); }
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
/* monograms — the reviewers' marks (Meclis.portrait / figure; also used by App.elderFace) */
.mc-art.mc-mono-svg{display:block;width:100%;height:100%;overflow:visible}
.mc-mono-svg .mo-bg{fill:var(--surface2,#F1EEE7);stroke:var(--line-2,#D3CEC4);stroke-width:1}
.mc-mono-svg .mo-tx{fill:var(--soft,#62676C);font:600 13px/1 var(--f-body,Inter,system-ui,sans-serif);letter-spacing:-.01em}
.mc-mono-svg.nz .mo-bg{fill:var(--accent-t,rgba(47,90,85,.1));stroke:var(--accent-line,rgba(47,90,85,.45))}
.mc-mono-svg.nz .mo-tx{fill:var(--accent,#2F5A55)}
.mc-gul-av{width:62%!important;height:62%!important}
.mc-gul-av .s1{fill:var(--accent)}
.mc-gul-av .s2{fill:var(--surface)}
.mc-gul-av .s3{fill:var(--accent)}

/* overlay — a neutral studio panel over a quiet scrim, same palette in both themes' tokens */
.mc{position:fixed;inset:0;z-index:var(--z-meclis,70);overflow-x:hidden;overflow-y:auto;overscroll-behavior:contain;color:var(--ink);
  display:grid;justify-items:center;align-content:start;
  padding:max(12px,env(safe-area-inset-top,0px)) 12px max(16px,env(safe-area-inset-bottom,0px));
  font-family:var(--f-body);animation:mc-in .18s var(--ease-out) both}
@media (min-height:640px) and (min-width:640px){.mc{align-content:center;padding:24px}}
.mc.out{animation:mc-out .18s var(--ease-in-out) forwards;pointer-events:none}
.mc-bg{position:fixed;inset:0;z-index:-1;pointer-events:none;background:var(--scrim)}
.mc-in{position:relative;width:min(960px,100%);min-width:0;display:grid;grid-template-columns:minmax(0,1fr);
  background:var(--surface);border:1px solid var(--line);border-radius:var(--r-lg,8px);box-shadow:var(--sh-3);overflow:hidden;animation:mc-rise .18s var(--ease-out) both}
.mc-h{display:flex;align-items:center;gap:12px;min-width:0;padding:14px 12px 14px 20px;border-bottom:1px solid var(--line)}
.mc-ht{flex:1;min-width:0;display:grid;gap:2px}
.mc-h .eyebrow{color:var(--soft);font-size:var(--t-micro,.6875rem)}
.mc-h h2{margin:0;font-family:var(--f-display);font-size:var(--t-h3,.9375rem);font-weight:600;line-height:1.3333;letter-spacing:-.006em;color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mc .mc-x{flex:none;border-color:transparent;color:var(--soft)}
.mc .mc-x:hover{color:var(--ink)}
.mc :focus-visible{outline:2px solid var(--focus);outline-offset:2px}
.mc:focus,.mc:focus-visible{outline:none}
.mc-body{display:grid;grid-template-columns:minmax(0,1fr);min-width:0}
@media (min-width:860px){.mc-body{grid-template-columns:minmax(0,1fr) 340px}}

/* stage — the document under review and the five reviewers */
.mc-stage{position:relative;display:grid;gap:16px;align-content:start;min-width:0;padding:20px;background:var(--bg)}
@media (min-width:860px){.mc-stage{border-right:1px solid var(--line)}}
.mc-wall,.mc-dtop,.mc-dfront,.mc-lap,.mc-mug,.mc-rug,.mc-plant{display:none}
.mc-doc-h{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:var(--t-caption,.75rem);color:var(--soft)}
.mc-doc-h b{font-weight:600;color:var(--ink)}
.mc-doc-h .mono{font-family:var(--f-mono);font-size:var(--t-micro,.6875rem);color:var(--faint)}
.mc-tumar{position:relative;opacity:0;transition:opacity .18s var(--ease-out)}
.mc-tumar.is-in,.mc-tumar.is-open{opacity:1}
.mc-tumar svg{display:block;width:100%;height:auto;max-height:200px}
.mc-tsvg .k-sh,.mc-tsvg .t-rl,.mc-tsvg .t-rr{display:none}
.mc-tsvg .k-pg{fill:var(--surface);stroke:var(--line);stroke-width:1}
.mc-tsvg .t-ttl{fill:none;stroke:var(--ink);stroke-opacity:.7;stroke-width:3;stroke-linecap:round}
.mc-tsvg .k-pl{fill:none;stroke:var(--line-2);stroke-width:2.2;stroke-linecap:round}
.mc-tsvg .t-pg{opacity:.55;transition:opacity .18s}
.mc-tumar.is-open .t-pg{opacity:1}
.mc-tsvg .mk{fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1;stroke-dashoffset:1;transition:stroke-dashoffset .18s var(--ease-out)}
.mc-tsvg .mk1{stroke:var(--accent)}
.mc-tsvg .mk2{stroke:var(--success)}
.mc-tsvg .mk3{stroke:var(--accent)}
.mc-tsvg .mk4{stroke:var(--danger)}
.mc-tsvg .mk5{opacity:0;transition:opacity .18s}
.mc-tsvg .t-stmo{fill:none;stroke:var(--accent);stroke-width:1.6}
.mc-tsvg .t-stm{fill:var(--accent)}
.mc-tumar.m1 .mk1,.mc-tumar.m2 .mk2,.mc-tumar.m3 .mk3,.mc-tumar.m4 .mk4{stroke-dashoffset:0}
.mc-tumar.m5 .mk5{opacity:1}

.mc-seats{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;min-width:0}
@media (max-width:559px){.mc-seats{grid-template-columns:repeat(5,minmax(0,1fr));gap:4px}}
.mc-elder{position:relative;display:grid;justify-items:center;align-content:start;gap:6px;min-width:0;padding:10px 4px 8px;margin:0;
  border:1px solid var(--line);border-radius:var(--r-lg,8px);background:var(--surface);color:inherit;font:inherit;text-align:center;cursor:pointer;
  opacity:0;transition:opacity .18s var(--ease-out),border-color .16s,background .16s;-webkit-tap-highlight-color:transparent}
.mc.is-elders .mc-elder{opacity:1}
.mc.is-elders:not(.is-ready) .mc-elder{transition-delay:calc(var(--i) * 60ms)}
.mc-elder .mc-mono{width:36px;height:36px;border-radius:50%;display:block}
.mc-elder .mc-mono svg{width:100%;height:100%}
.mc-elder small{display:block;max-width:100%;font-size:var(--t-micro,.6875rem);line-height:1.3;color:var(--faint);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
@media (max-width:559px){.mc-elder small{display:none}.mc-elder .mc-mono{width:30px;height:30px}}
.mc.is-work .mc-elder:not(.is-on){opacity:.62}
.mc .mc-elder.is-done,.mc .mc-elder.is-warn{opacity:1}
.mc-elder.is-on{border-color:var(--accent);background:var(--selected)}
.mc-elder.is-on .mo-bg{stroke:var(--accent)}
.mc-elder.is-on .mo-tx{fill:var(--accent)}
.mc-elder.is-warn{border-color:color-mix(in srgb,var(--warning) 45%,var(--line))}
.mc-plate{position:relative;display:inline-flex;align-items:center;gap:4px;max-width:100%;font:500 var(--t-caption,.75rem)/1.3 var(--f-body);color:var(--ink);white-space:nowrap}
.mc-plate b{font-weight:500;overflow:hidden;text-overflow:ellipsis}
.mc-tick{flex:none;display:none;width:14px;height:14px;border-radius:50%;place-items:center;background:var(--success);color:var(--surface);font-style:normal;font-weight:700;font-size:9px;line-height:1}
.mc-tick svg{width:9px;height:9px}
.mc-plate.is-done .mc-tick,.mc-plate.is-warn .mc-tick{display:grid;animation:mc-fade .16s var(--ease-out) both}
.mc-plate.is-warn .mc-tick{background:var(--warning)}
.mc-plate.is-warn .mc-tick svg{display:none}
.mc-plate.is-warn .mc-tick::after{content:"!"}
.mc-nz{display:none}

/* small note when a reviewer is tapped */
.mc-bub{position:absolute;left:0;top:0;z-index:9;max-width:min(260px,80%);padding:8px 10px;border:1px solid var(--line);border-radius:var(--r-lg,8px);background:var(--surface);color:var(--ink);
  font-size:var(--t-small,.8125rem);line-height:1.45;box-shadow:var(--sh-2);pointer-events:none;opacity:0;transform:translateY(4px);transition:opacity .16s,transform .16s var(--ease-out)}
.mc-bub.on{opacity:1;transform:none}
.mc-bub b{display:block;margin-bottom:1px;font-size:var(--t-caption,.75rem);font-weight:600;color:var(--ink)}

/* status panel */
.mc-panel{display:grid;gap:12px;align-content:start;min-width:0;padding:20px}
.mc-run{display:grid;gap:14px}
.mc-prog{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:4px}
.mc-prog i{display:block;height:3px;border-radius:2px;overflow:hidden;background:var(--surface2)}
.mc-prog b{display:block;width:0;height:100%;border-radius:inherit;background:var(--accent)}
.mc-prog i.ok b{width:100%;background:var(--accent)}
.mc-prog i.warn b{width:100%;background:var(--warning)}
.mc-now{display:flex;align-items:center;gap:10px;min-width:0}
.mc-av{flex:none;width:36px;height:36px;border-radius:50%;overflow:hidden;display:grid;place-items:center;background:var(--surface2);box-shadow:inset 0 0 0 1px var(--line)}
.mc-av svg{display:block;width:100%;height:100%}
.mc-av.pop{animation:mc-fade .16s var(--ease-out)}
.mc-now-tx{flex:1;min-width:0;display:grid;gap:1px}
.mc-now-tx b{font-size:var(--t-body,.875rem);font-weight:600;line-height:1.3;color:var(--ink)}
.mc-now-tx small{font-size:var(--t-caption,.75rem);color:var(--soft);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mc-cnt{flex:none;font:500 var(--t-caption,.75rem)/1 var(--f-mono);color:var(--soft);font-variant-numeric:tabular-nums}
.mc-line{display:flex;align-items:flex-start;gap:8px;min-height:3em;margin:0;padding:10px 12px;border-radius:var(--r-md,6px);background:var(--surface2);font-size:var(--t-small,.8125rem);line-height:1.5;color:var(--ink)}
.mc-li{display:none;flex:none;width:16px;height:16px;margin-top:2px;border-radius:50%;place-items:center;color:var(--surface);font-weight:700;font-size:10px}
.mc-li svg{width:10px;height:10px}
.mc-line.ok .mc-li{display:grid;background:var(--success)}
.mc-line.warn .mc-li{display:grid;background:var(--warning)}
.mc-line.warn .mc-li svg{display:none}
.mc-line.warn .mc-li::after{content:"!"}
.mc-lt{min-width:0}
.mc-dots{display:inline-flex;gap:3px;margin-left:6px;vertical-align:middle;white-space:nowrap}
.mc-dots i{width:3px;height:3px;border-radius:50%;background:var(--soft);animation:mc-dot 1.2s ease-in-out infinite}
.mc-dots i:nth-child(2){animation-delay:.15s}
.mc-dots i:nth-child(3){animation-delay:.3s}
.mc-line.ok .mc-dots,.mc-line.warn .mc-dots{display:none}
.mc-run-f{display:flex;align-items:center;justify-content:space-between;gap:10px}
.mc-hint{display:inline-flex;align-items:center;gap:6px;font-size:var(--t-caption,.75rem);color:var(--faint)}
@media (hover:none){.mc-hint{visibility:hidden}}
.mc .mc-skip svg{width:14px;height:14px}

/* verdict */
.mc-v{position:relative;overflow:visible;display:grid;gap:14px;padding:0;border:0;background:none;color:var(--ink);text-align:left;animation:mc-fade .18s var(--ease-out) both}
.mc-v-top{display:flex;flex-wrap:wrap;align-items:center;gap:4px 12px;padding-right:72px}
.mc-v-dt{font:500 var(--t-micro,.6875rem)/1.3 var(--f-mono);color:var(--faint);font-variant-numeric:tabular-nums}
.mc-v-main{display:flex;flex-wrap:wrap;align-items:center;gap:14px 18px}
.mc-v-score{flex:none;display:grid;place-items:center}
.mc-v-score .ring{--size:88px}
.mc-v-tx{flex:1 1 170px;min-width:0;display:grid;gap:4px}
.mc-v-h{margin:0;font-family:var(--f-display);font-size:var(--t-h2,1.0625rem);font-weight:600;line-height:1.35;letter-spacing:-.01em;color:var(--success)}
.mc-v-h.mid{color:var(--zafaran-ink)}
.mc-v-h.low{color:var(--danger)}
.mc-v-tx p{margin:0;color:var(--soft);font-size:var(--t-small,.8125rem);line-height:1.5}
.mc-v-sig{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;padding-top:12px;border-top:1px solid var(--line)}
.mc-v-sl{font:500 var(--t-micro,.6875rem)/1.3 var(--f-body);letter-spacing:.04em;text-transform:uppercase;color:var(--faint)}
.mc-v-avs{display:flex;flex-wrap:wrap;gap:6px}
.mc-sig{position:relative;width:28px;height:28px;border-radius:50%;animation:mc-fade .18s var(--ease-out) both;animation-delay:calc(var(--i) * 40ms)}
.mc-sig > svg{display:block;width:100%;height:100%;border-radius:50%}
.mc-sig i{position:absolute;right:-3px;bottom:-3px;width:13px;height:13px;border-radius:50%;display:grid;place-items:center;background:var(--success);color:var(--surface);box-shadow:0 0 0 2px var(--surface);font-style:normal;font-weight:700;font-size:.5625rem;line-height:1}
.mc-sig i svg{width:8px;height:8px}
.mc-sig.warn i{background:var(--warning)}
.mc-seal{position:absolute;top:-10px;right:-4px;width:68px;height:68px;opacity:0;transform:rotate(-8deg) scale(1.04);pointer-events:none;color:var(--accent)}
.mc-seal.t-mid{color:var(--zafaran-ink)}
.mc-seal.t-low{color:var(--danger)}
.mc-seal svg{display:block;width:100%;height:100%;overflow:visible}
.mc-seal.is-stamp{opacity:.9;transform:rotate(-8deg);transition:opacity .18s var(--ease-out),transform .18s var(--ease-out)}
.mc-seal .s-bg{fill:var(--surface)}
.mc-seal .s-ring{fill:none;stroke:currentColor;stroke-width:2.4}
.mc-seal .s-ring2{fill:none;stroke:currentColor;stroke-width:1}
.mc-seal .s-tx{fill:currentColor;font:600 8px/1 var(--f-body);letter-spacing:.06em}
.mc-seal .s-gul,.mc-seal .s-core{fill:currentColor}
.mc-seal .s-gul2{fill:var(--surface)}
.mc-v-act{display:flex;justify-content:flex-end;gap:8px;padding-top:4px}
@media (max-width:520px){.mc-v-act .btn{flex:1}}

/* reduced motion — fades only */
.mc.mc-rm .mc-elder{transition:opacity .16s ease!important}
.mc.mc-rm .mc-dots i{animation:none}

@keyframes mc-in{from{opacity:0}to{opacity:1}}
@keyframes mc-out{to{opacity:0}}
@keyframes mc-fade{from{opacity:0}to{opacity:1}}
@keyframes mc-rise{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@keyframes mc-dot{0%,100%{opacity:.3}40%{opacity:1}}
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
      return '<button type="button" class="mc-elder mc-e' + (i + 1) + ' motion-safe" data-i="' + i + '" style="--i:' + i + '" aria-label="' + esc(e.name + ' — ' + e.role) + '">' +
        '<span class="mc-mono" aria-hidden="true">' + portrait(i) + '</span>' +
        '<span class="mc-plate p' + (i + 1) + '" aria-hidden="true"><i class="mc-tick">' + IC.check + '</i><b>' + esc(e.short) + '</b></span>' +
        '<small aria-hidden="true">' + esc(e.role.split(/[,·]/)[0]) + '</small></button>';
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
        '<div class="mc-body">' +
          '<div class="mc-stage">' +
            '<div class="mc-doc-h" aria-hidden="true"><b>Sənəd</b><span class="mono">' + esc(azDate(new Date())) + '</span></div>' +
            '<div class="mc-tumar motion-safe" aria-hidden="true">' + tumarSvg() + '</div>' +
            '<div class="mc-seats">' + elders + '</div>' +
            '<div class="mc-nz motion-safe" aria-hidden="true"><div class="mc-nz-in"><div class="mc-mc-nf"></div><div class="mc-nz-scr"></div></div></div>' +
            '<div class="mc-bub" aria-hidden="true"></div>' +
          '</div>' +
          '<div class="mc-panel">' +
            '<div class="mc-run">' +
              '<div class="mc-prog" aria-hidden="true"><i><b></b></i><i><b></b></i><i><b></b></i><i><b></b></i><i><b></b></i></div>' +
              '<div class="mc-now"><span class="mc-av" aria-hidden="true"></span><span class="mc-now-tx"><b></b><small></small></span><span class="mc-cnt"></span></div>' +
              '<p class="mc-line" role="status" aria-live="polite"><span class="mc-li" aria-hidden="true">' + IC.check + '</span><span class="mc-lt"><span class="mc-tx"></span><span class="mc-dots" aria-hidden="true"><i></i><i></i><i></i></span></span></p>' +
              '<div class="mc-run-f"><span class="mc-hint"><kbd class="kbd">Esc</kbd> bağlayır</span>' +
                '<button type="button" class="btn btn-secondary btn-sm mc-skip">Nəticəyə keç ' + IC.ffwd + '</button></div>' +
            '</div>' +
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

  /* Nuanza stays on her dock during the Məclis — the panel shows only the reviewers */
  function mountNz(S) { S.nz = null; S.nzFb = null; }
  function nzSet(S, st, ms) {
    if (S.nz && typeof S.nz.set === 'function') { try { S.nz.set(st, ms ? { ms: ms } : {}); } catch (e) { /* ignore */ } return; }
    if (S.nzFb) S.nzFb.setAttribute('class', 'mc-art mc-nzfb st-' + st);
  }

  function burst(S, el, kind) {
    if (S.rm || !el || S.closed) return;
    var r = el.getBoundingClientRect();
    if (!r.width) return;
    if (W.NuanzaFX && typeof W.NuanzaFX.burst === 'function') { try { W.NuanzaFX.burst(r.left + r.width / 2, r.top + r.height / 2, kind); } catch (e) { /* ignore */ } }
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
    if (k === 'intro') { av = gulAvatar(); nm = 'Mirzə Məclisi'; rl = 'Beş yoxlama · ardıcıl'; line = 'Məclis toplanır: terminologiya, məna, üslub, norma və rəqəmlər'; }
    else if (k === 'nuanza') { av = nzPortrait(); nm = 'Sənəd'; rl = 'Yoxlamaya təqdim olunur'; line = 'Sənəd Məclisə təqdim olunur'; }
    else { var e = ELDERS[k]; av = portrait(k); nm = e.name; rl = e.role; cnt = (k + 1) + ' / 5'; line = e.doing; }
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
    card.className = 'mc-v motion-safe';
    card.setAttribute('aria-labelledby', 'mc-vt-' + S.id);
    card.innerHTML =
      '<div class="mc-v-top"><span class="eyebrow">Məclisin hökmü</span><span class="mc-v-dt">' + esc(azDate(new Date())) + '</span></div>' +
      '<div class="mc-v-main"><div class="mc-v-score"></div><div class="mc-v-tx"><h3 class="mc-v-h ' + tone + '" id="mc-vt-' + S.id + '">' + esc(v.seal) + '</h3><p>' + esc(v.text) + '</p></div></div>' +
      '<div class="mc-v-sig"><span class="mc-v-sl">İmzalar</span><span class="mc-v-avs" aria-label="' + esc((5 - warns) + ' mirzə təsdiq etdi' + (warns ? ', ' + warns + ' mirzənin qeydi var' : '')) + '">' + sigs + '</span></div>' +
      '<div class="mc-seal t-' + tone + ' motion-safe" aria-hidden="true">' + sealSvg() + '</div>';
    var score = q(card, '.mc-v-score');
    if (sc != null) score.appendChild(ringNode(sc));
    else score.innerHTML = '<span class="medal lg" aria-hidden="true">' + IC.check + '</span>';
    var act = D.createElement('div');
    act.className = 'mc-v-act';
    act.innerHTML = '<button type="button" class="btn btn-primary mc-done">Bağla</button>';

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
        /* the seal settles quietly — no shake, no ink */
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
