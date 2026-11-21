/* =====================================================================
   NUANZA — s-translate.js
   Screen 'translate' («Tərcümə», both modes) — tez tərcümə aləti.
     • Yığcam alət paneli: dil cütü + dəyiş, üslub (Avto/Danışıq/Neytral/Rəsmi/Hüquqi), keyfiyyət
     • Mənbə | tərcümə — geniş ekranda yan-yana, telefonda alt-alta
     • Nəticə: əminlik xətləri, qeydlər, alternativlər, terminlər cədvəli, Məclis rəyi sətirlərlə
     • Dil cütü (EN · RU · TR · AZ) + dəyişmə düyməsi, avtomatik dil tanıma
     • Üslub: Avtomatik / Danışıq / Neytral / Rəsmi / Hüquqi + dəyişən izah sətri
     • Keyfiyyət: Sürətli / Dəqiq / Mirzə Məclisi
     • Mənbə mətn (sayğac, yapışdır, təmizlə, Ctrl+Enter) → skelet → nəticə kartı
     • Nəticədə hər hissə əminlik xətti ilə (əmin — xəttsiz, yoxlayın — sarı
       nöqtəli, şübhəli — qırmızı dalğalı); toxunanda qeyd popoveri açılır
     • Kopyala · 3 variant (Hərfi / Təbii / Peşəkar) · Üslubu dəyiş ·
       Nuanza yaxşı baxsın (Mirzə Məclisi → düzəldilmiş səhvlər) · Lüğətə əlavə et
     • İşlənmiş nümunə: «Sorry, I'm gonna be late — can you send me the contract ASAP?»
   Plain browser JS. Uses App.* from app.js and app.css components.
   Screen CSS is prefixed .translate-*.
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
  function frag(html) { var t = D.createElement('template'); t.innerHTML = String(html).trim(); return t.content.firstChild; }
  function ie(name) { return typeof App.iconEl === 'function' ? App.iconEl(name) : frag(App.icon(name)); }
  function ext(t) {
    for (var i = 1; i < arguments.length; i++) { var s = arguments[i]; if (s) for (var k in s) if (Object.prototype.hasOwnProperty.call(s, k)) t[k] = s[k]; }
    return t;
  }
  function clone(v) { if (v === null || v === undefined || typeof v !== 'object') return v; try { return JSON.parse(JSON.stringify(v)); } catch (e) { return v; } }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function num(n) { return App.fmt && App.fmt.num ? App.fmt.num(n) : String(n); }
  function lower(s) { s = String(s == null ? '' : s); try { return s.toLocaleLowerCase('az'); } catch (e) { return s.toLowerCase(); } }
  function norm(s) { return lower(s).replace(/[’‘`´]/g, "'").replace(/[—–]/g, '-').replace(/\s+/g, ' ').trim(); }
  function short(s, n) { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1).trim() + '…' : s; }
  function wordsOf(s) { return String(s || '').match(/[\p{L}\p{N}]+(?:[-'’][\p{L}\p{N}]+)*/gu) || []; }
  function sget(k, fb) { try { var v = App.store.get(k, fb); return v === undefined || v === null ? fb : v; } catch (e) { return fb; } }
  function sset(k, v) { try { App.store.set(k, v); } catch (e) { /* storage blocked */ } }
  function reduced() { try { return App.reducedMotion ? App.reducedMotion() : false; } catch (e) { return false; } }
  function finePointer() { try { return W.matchMedia('(hover:hover) and (pointer:fine)').matches; } catch (e) { return false; } }
  function wide() { return (W.innerWidth || 0) >= 760; }
  function rel(at) { try { return App.fmt && App.fmt.rel ? App.fmt.rel(new Date(at)) : ''; } catch (e) { return ''; } }
  function secs(ms) { return (Math.max(0.1, ms / 1000)).toFixed(1).replace('.', ',') + ' san'; }
  var MOD = /Mac|iPhone|iPad|iPod/.test((navigator.platform || '') + ' ' + (navigator.userAgent || '')) ? '⌘' : 'Ctrl';

  function hasScreen(id) {
    try { var l = App.screens ? App.screens() : []; for (var i = 0; i < l.length; i++) if (l[i] && l[i].id === id) return true; } catch (e) { /* ignore */ }
    return false;
  }
  /* Speech policy: «Normal» (default) — only outcomes (done, problem found); «Çox» — everything; «Sakit» — nothing. */
  function chatty(state) {
    var c = null; try { c = App.companionConfig ? App.companionConfig() : null; } catch (e) { c = null; }
    if (c && c.chatty === false) return false;
    var t = (c && c.talk) || 'normal';
    return t === 'cox' || (t !== 'sakit' && /^(success|worried|sad|celebrate)$/.test(state || ''));
  }
  /* Nuanza (dock) reacts. ms = how long the state lasts (omit for the state's own default). */
  function nz(state, text, ms) {
    var c = App.companion; if (!c || typeof c.set !== 'function') return;
    var o = {}; if (ms != null) o.ms = ms;
    if (text && chatty(state)) o.say = text;
    try { c.set(state, o); } catch (e) { /* ignore */ }
  }
  function burstAt(el, kind) { try { if (App.fx && App.fx.burstAt && el && el.isConnected) App.fx.burstAt(el, kind || 'diamonds'); } catch (e) { /* ignore */ } }
  function busyBtn(btn, on) { if (!btn) return; if (on) btn.setAttribute('aria-busy', 'true'); else btn.removeAttribute('aria-busy'); }
  function restartClass(el, cls, ms) { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); later(function () { el.classList.remove(cls); }, ms || 900); }

  var SWAP_SVG = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 8h15"/><path d="m15 4 4 4-4 4"/><path d="M20 16H5"/><path d="m9 12-4 4 4 4"/></svg>';
  var CLIP_SVG = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="5.5" y="4.5" width="13" height="16.5" rx="2"/><path d="M9 4.5v-.7A1.3 1.3 0 0 1 10.3 2.5h3.4A1.3 1.3 0 0 1 15 3.8v.7"/><path d="M9 11h6M9 15h4"/></svg>';

  /* ------------------------------------------------------------------
     2. LIFECYCLE — timers and mini Nuanza instances are dropped on leave
     ------------------------------------------------------------------ */
  var live = { to: [], iv: [], minis: [] };
  function later(fn, ms) { var t = setTimeout(fn, ms || 0); live.to.push(t); return t; }
  function every(fn, ms) { var t = setInterval(fn, ms); live.iv.push(t); return t; }
  function cleanup() {
    live.to.forEach(clearTimeout); live.iv.forEach(clearInterval);
    live.minis.forEach(function (m) { try { if (m && m.destroy) m.destroy(); } catch (e) { /* ignore */ } });
    live = { to: [], iv: [], minis: [] };
  }
  function mountMini(el, state) {
    /* the companion lives only in the corner dock; panes keep a quiet icon */
    if (el && (state || !state)) return null;
    if (W.Nuanza && typeof W.Nuanza.mount === 'function') {
      try {
        var m = W.Nuanza.mount(el, { size: 'mini', label: 'Nuanza — toxunun' });
        if (m) { live.minis.push(m); if (state && m.set) m.set(state, {}); return m; }
      } catch (e) { /* fall through to the medal */ }
    }
    el.textContent = '';
    el.appendChild(h('span', { class: 'medal sm', 'aria-hidden': 'true' }, h('b', { text: 'N' })));
    return null;
  }

  /* ------------------------------------------------------------------
     3. REFERENCE DATA
     ------------------------------------------------------------------ */
  var LANGS = [{ id: 'en', name: 'İngilis' }, { id: 'ru', name: 'Rus' }, { id: 'tr', name: 'Türk' }, { id: 'az', name: 'Azərbaycan' }];
  var LANG_NAME = { en: 'İngilis', ru: 'Rus', tr: 'Türk', az: 'Azərbaycan' };
  var CODE = { en: 'EN', ru: 'RU', tr: 'TR', az: 'AZ' };
  var LANG_LIKE = { en: 'İngilis dilinə oxşayır', ru: 'Rus dilinə oxşayır', tr: 'Türk dilinə oxşayır', az: 'Azərbaycan dilinə oxşayır' };

  var REG_LABEL = { auto: 'Avtomatik', danisiq: 'Danışıq', neytral: 'Neytral', resmi: 'Rəsmi', huquqi: 'Hüquqi' };
  var REGS = [
    { id: 'auto' },
    { id: 'danisiq', explain: 'Dost, həmkar, mesajlaşma: «sən» müraciəti, qısa və canlı cümlələr, gündəlik söz seçimi.' },
    { id: 'neytral', explain: 'İnterfeys, xəbər, təlimat: «siz» müraciəti, bəzəksiz və aydın cümlələr.' },
    { id: 'resmi', explain: 'İşgüzar məktub, hesabat: nəzakət formulları, tam cümlələr, abreviatura yox — «ASAP» yerinə «ən qısa müddətdə».' },
    { id: 'huquqi', explain: 'Müqavilə, qanun, etibarnamə: terminlər lüğətdən, birmənalı quruluş, öhdəlik forması («-malıdır»).' }
  ];
  var REG_EXPLAIN = {}; REGS.forEach(function (r) { REG_EXPLAIN[r.id] = r.explain; });
  /* «Danışıq üslubu» (noun + noun) but «Rəsmi üslub» (adjective + noun) */
  function regWord(id, cas) {
    var n = id === 'danisiq';
    return cas === 'loc' ? (n ? 'üslubunda' : 'üslubda') : cas === 'dat' ? (n ? 'üslubuna' : 'üsluba') : (n ? 'üslubu' : 'üslub');
  }

  var QUALITY = [
    { id: 'fast', label: 'Sürətli', ic: 'zap', hint: 'Təxminən 1 saniyə · bir keçid. Qısa mesajlar və çat üçün.', ms: 650 },
    { id: 'exact', label: 'Dəqiq', ic: 'target', hint: 'Lüğət, tərcümə yaddaşı və hər hissə üçün əminlik yoxlaması.', ms: null },
    { id: 'meclis', label: 'Mirzə Məclisi', ic: 'shield', hint: 'Tərcümədən sonra beş mirzə yoxlayır və səhvləri özləri düzəldir.', ms: 1100 }
  ];
  var QMAP = {}; QUALITY.forEach(function (q) { QMAP[q.id] = q; });

  var CONF_LABEL = { high: 'Əmin', mid: 'Yoxlayın', low: 'Şübhəli' };

  var AUD = [
    { id: 'danisiq', aud: 'Həmkar, dost · mesajlaşma, çat', ic: 'message', cls: ' navy' },
    { id: 'neytral', aud: 'Geniş auditoriya · təlimat, interfeys, xəbər', ic: 'globe', cls: '' },
    { id: 'resmi', aud: 'Müştəri, rəhbər · işgüzar məktub, hesabat', ic: 'mail', cls: ' gold' },
    { id: 'huquqi', aud: 'Hüquq şöbəsi, qarşı tərəf · müqavilə, etibarnamə', ic: 'shield', cls: ' fir' }
  ];

  /* the five elders — who catches what (index matches Meclis.portrait) */
  var ELD = [
    { name: 'Lüğətçi Mirzə', short: 'L', av: 'av-lacquer', check: 'Terminlər' },
    { name: 'Mənaçı Mirzə', short: 'M', av: 'av-firuze', check: 'Məna' },
    { name: 'Üslubçu Mirzə', short: 'Ü', av: 'av-nar', check: 'Üslub' },
    { name: 'Dilçi Nənə', short: 'D', av: 'av-benovse', check: 'Yazılış' },
    { name: 'Möhürdar Mirzə', short: 'M', av: 'av-zafaran', check: 'Rəqəm və adlar' }
  ];
  var TYPE_IDX = {
    'Termin': 0, 'Terminologiya': 0, 'Lüğət': 0, 'Məna': 1, 'Boş seqment': 1, 'Əlavə': 1, 'Buraxılma': 1,
    'Üslub': 2, 'Söz sırası': 2, 'Ardıcıllıq': 2, 'Registr': 2, 'Türk forması': 3, 'Orfoqrafiya': 3, 'Durğu': 3,
    'Rəqəm': 4, 'Ad': 4, 'Tarix': 4
  };
  function elderIdx(type) { var i = TYPE_IDX[type]; return i == null ? 1 : i; }
  function sealOf(s) { return s >= 85 ? 'Təhvilə hazırdır' : s >= 70 ? 'Düzəlişlərlə qəbul' : 'Yenidən işlənməli'; }

  var GLOSS_DOMAINS = ['Ümumi', 'İşgüzar yazışma', 'Hüquq', 'Maliyyə', 'Neft-qaz', 'İnterfeys', 'Turizm', 'Tibb'];

  var VAR_META = {
    herfi: { label: 'Hərfi', note: 'Söz-söz: quruluş və əvəzliklər saxlanılır. Mənbə ilə tutuşdurmaq üçün faydalıdır, oxucuya ağır gəlir.' },
    tebii: { label: 'Təbii', note: 'Azərbaycan dilində necə deyərdiksə, elə. Axıcıdır, amma mənbədən bir qədər uzaqlaşır.' },
    pesekar: { label: 'Peşəkar', note: 'Məna tam, üslub ardıcıl, ədəbi norma qorunur. Təhvil üçün tövsiyə olunur.' }
  };

  /* ------------------------------------------------------------------
     3.1 The worked example — curated per register
     ------------------------------------------------------------------ */
  var S_SORRY = "Sorry, I'm gonna be late";
  var EX = {
    src: "Sorry, I'm gonna be late — can you send me the contract ASAP?",
    rev: {
      en: "Sorry, I'm gonna be late — can you send me the contract ASAP?",
      ru: 'Извини, я опоздаю — можешь скинуть мне договор как можно скорее?',
      tr: 'Kusura bakma, biraz gecikeceğim — sözleşmeyi en kısa sürede gönderebilir misin?'
    },
    termByLang: { en: 'contract', ru: 'договор', tr: 'sözleşme' },
    purpose: 'Gecikməni bildirmək və müqaviləni tez almaq',
    aud: { danisiq: 'Həmkar, tanış adam', neytral: 'Tərəfdaş, ümumi ünvan', resmi: 'Müştəri, rəhbər', huquqi: 'Hüquq şöbəsi, qarşı tərəf' },
    tone: { danisiq: 'Səmimi, yüngül', neytral: 'Sakit, aydın', resmi: 'Nəzakətli, işgüzar', huquqi: 'Rəsmi, birmənalı' },
    reg: {
      danisiq: {
        segs: [
          { t: 'Bağışla, bir az gecikəcəm', c: 'high', src: S_SORRY, note: '«Sorry» danışıqda — «Bağışla», «gonna be late» — «gecikəcəm». «bir az» mənbədə yoxdur, amma üzrü yumşaldır və danışıqda təbii səslənir.' },
          { t: ' — müqaviləni ', c: 'high', src: 'the contract', note: '«contract» → «müqavilə»: lüğətdə təsdiqlənmiş termin.' },
          { t: 'tez', c: 'mid', src: 'ASAP', alt: 'mümkün qədər tez', note: '«ASAP» — «as soon as possible». «tez» qısa və təbiidir, amma təcililik çaları zəifləyir.' },
          { t: ' ata bilərsən?', c: 'low', src: 'can you send me', alt: ' göndərə bilərsən?', note: '«atmaq» burada «göndərmək» mənasında çat jarqonudur. Həmkara yazırsınızsa, olar; rəhbər və ya müştəri üçün «göndərə bilərsən» seçin.' }
        ],
        fixedSegs: [
          { t: 'Bağışla, bir az ', c: 'high', src: S_SORRY, note: '«Sorry» danışıqda — «Bağışla». «bir az» üzrü yumşaldır.' },
          { t: 'gecikəcəyəm', c: 'high', fixed: true, src: "I'm gonna be late", note: 'Dilçi Nənə düzəltdi: «gecikəcəm» → «gecikəcəyəm». Yazılı mesajda ədəbi forma.' },
          { t: ' — müqaviləni ', c: 'high', src: 'the contract', note: '«contract» → «müqavilə»: lüğətdə təsdiqlənmiş termin.' },
          { t: 'mümkün qədər tez', c: 'high', fixed: true, src: 'ASAP', note: 'Mənaçı Mirzə düzəltdi: «ASAP»ın təcililik çaları qaytarıldı.' },
          { t: ' göndərə bilərsən?', c: 'high', fixed: true, src: 'can you send me', note: 'Üslubçu Mirzə düzəltdi: çat jarqonu «atmaq» → «göndərmək».' }
        ],
        fixes: [
          { was: 'gecikəcəm', now: 'gecikəcəyəm', type: 'Orfoqrafiya', why: '«gecikəcəm» danışıq tələffüzüdür. Yazılı mesajda ədəbi forma — «gecikəcəyəm» — səliqəli görünür, ton isə səmimi qalır.' },
          { was: 'tez', now: 'mümkün qədər tez', type: 'Məna', why: '«ASAP» təcililik bildirir. Tək «tez» bu çaları zəiflədir — «mümkün qədər tez» mənbəyə daha yaxındır.' },
          { was: 'ata bilərsən', now: 'göndərə bilərsən', type: 'Üslub', why: '«atmaq» çat jarqonudur. Söhbət müqavilədən gedir — danışıq üslubunda da «göndərmək» daha münasibdir.' }
        ],
        score: 96, seal: 'Göndərməyə hazırdır',
        verdict: '3 düzəliş: məna, üslub və yazılış. Mesaj səmimi qaldı, amma indi həm dəqiq, həm də səliqəlidir.',
        variants: {
          herfi: 'Bağışla, mən gecikəcəyəm — sən mənə müqaviləni mümkün qədər tez göndərə bilərsən?',
          tebii: 'Bağışla, bir az gecikəcəm — müqaviləni tez ata bilərsən?',
          pesekar: 'Bağışla, bir az gecikəcəyəm — müqaviləni mümkün qədər tez göndərə bilərsən?'
        }
      },
      neytral: {
        segs: [
          { t: 'Üzr istəyirəm, gecikəcəyəm.', c: 'high', src: S_SORRY, note: 'Neytral üslub: «Bağışla» əvəzinə «Üzr istəyirəm», danışıq forması işlənmir.' },
          { t: ' Müqaviləni ', c: 'high', src: 'the contract', note: '«contract» → «müqavilə»: lüğətdə təsdiqlənmiş termin.' },
          { t: 'mümkün qədər tez', c: 'high', src: 'ASAP', note: '«ASAP» → «mümkün qədər tez»: abreviatura açılır.' },
          { t: ' göndərə bilərsiniz?', c: 'mid', src: 'can you send me', alt: ' göndərə bilərsinizmi?', note: 'Sual yalnız intonasiya ilə verilib. Yazılı mətndə «-mı» ədatı sualı daha aydın edir.' }
        ],
        fixedSegs: [
          { t: 'Üzr istəyirəm, gecikəcəyəm.', c: 'high', src: S_SORRY, note: 'Neytral üslub: «Üzr istəyirəm», danışıq forması işlənmir.' },
          { t: ' Müqaviləni ', c: 'high', src: 'the contract', note: '«contract» → «müqavilə».' },
          { t: 'mümkün qədər tez', c: 'high', src: 'ASAP', note: '«ASAP» → «mümkün qədər tez».' },
          { t: ' göndərə bilərsinizmi?', c: 'high', fixed: true, src: 'can you send me', note: 'Dilçi Nənə düzəltdi: sual ədatı «-mı» əlavə olundu.' }
        ],
        fixes: [
          { was: 'göndərə bilərsiniz?', now: 'göndərə bilərsinizmi?', type: 'Orfoqrafiya', why: 'Yazılı neytral mətndə sual ədatı «-mı» sualı intonasiyasız da aydın edir.' }
        ],
        score: 97, seal: 'Təhvilə hazırdır',
        verdict: '1 düzəliş: sual ədatı. Terminlər, məna və üslub qaydasındadır.',
        variants: {
          herfi: 'Üzr istəyirəm, mən gecikəcəyəm — siz mənə müqaviləni mümkün qədər tez göndərə bilərsiniz?',
          tebii: 'Üzr istəyirəm, bir az gecikirəm. Müqaviləni tez göndərə bilərsiniz?',
          pesekar: 'Üzr istəyirəm, gecikəcəyəm. Müqaviləni mümkün qədər tez göndərə bilərsinizmi?'
        }
      },
      resmi: {
        segs: [
          { t: 'Gecikəcəyim üçün üzr istəyirəm.', c: 'high', src: S_SORRY, note: 'Rəsmi üslubda üzr tam cümlə ilə verilir; danışıq forması («gonna») izsiz qalır.' },
          { t: ' Zəhmət olmasa, müqaviləni ', c: 'high', src: 'can you send me the contract', note: '«can you…?» sualı rəsmi yazışmada nəzakətli xahişə çevrilir: «Zəhmət olmasa…».' },
          { t: 'ən qısa müddətdə', c: 'high', src: 'ASAP', note: '«ASAP» rəsmi mətndə — «ən qısa müddətdə». Abreviatura saxlanmır.' },
          { t: ' göndərin.', c: 'mid', src: 'send me', alt: ' göndərməyinizi xahiş edirəm.', note: 'Əmr forması düzgündür, amma bir az quru səslənir. Daha yumşaq variant: «göndərməyinizi xahiş edirəm».' }
        ],
        fixedSegs: [
          { t: 'Gecikəcəyim üçün üzr istəyirəm.', c: 'high', src: S_SORRY, note: 'Rəsmi üslubda üzr tam cümlə ilə verilir.' },
          { t: ' Müqaviləni ', c: 'high', fixed: true, src: 'the contract', note: 'Üslubçu Mirzə düzəltdi: «Zəhmət olmasa» çıxarıldı — xahiş forması onsuz da nəzakətlidir.' },
          { t: 'ən qısa müddətdə', c: 'high', src: 'ASAP', note: '«ASAP» rəsmi mətndə — «ən qısa müddətdə».' },
          { t: ' göndərməyinizi xahiş edirəm.', c: 'high', fixed: true, src: 'can you send me', note: 'Üslubçu Mirzə düzəltdi: əmr forması nəzakətli xahişlə əvəzləndi.' }
        ],
        fixes: [
          { was: 'Zəhmət olmasa, … göndərin', now: '… göndərməyinizi xahiş edirəm', type: 'Üslub', why: 'Rəsmi məktubda birbaşa əmr forması quru səslənir. Xahiş forması nəzakətlidir və «Zəhmət olmasa» təkrarına ehtiyac qalmır.' }
        ],
        score: 98, seal: 'Təhvilə hazırdır',
        verdict: '1 üslub düzəlişi. Terminlər, məna və yazılış qaydasındadır — məktub göndərilə bilər.',
        variants: {
          herfi: 'Üzr istəyirəm, mən gecikəcəyəm. Siz mənə müqaviləni mümkün qədər tez göndərə bilərsinizmi?',
          tebii: 'Gecikəcəyim üçün üzr istəyirəm. Zəhmət olmasa, müqaviləni ən qısa müddətdə göndərin.',
          pesekar: 'Gecikəcəyim üçün üzr istəyirəm. Müqaviləni ən qısa müddətdə göndərməyinizi xahiş edirəm.'
        }
      },
      huquqi: {
        warn: 'Mənbə danışıq üslubundadır. Hüquqi üslub bu mesaj üçün ağır səslənir — Rəsmi kifayət edər.',
        segs: [
          { t: 'Gecikəcəyimlə bağlı üzr istəyirəm.', c: 'high', src: S_SORRY, note: 'Rəsmi-hüquqi üslub: üzr «ilə bağlı» quruluşu ilə verilir.' },
          { t: ' Müqavilənin ', c: 'high', src: 'the contract', note: '«contract» → «Müqavilə». Hüquqi mətndə müəyyən edilmiş termin kimi böyük hərflə yazıla bilər.' },
          { t: 'ən qısa müddətdə', c: 'high', src: 'ASAP', note: '«ASAP» → «ən qısa müddətdə».' },
          { t: ' tərəfimə', c: 'low', src: 'me', alt: ' ünvanıma', note: 'Mənbədə alıcı sadəcə «me»dir. «tərəfimə göndərilməsi» kanselyarizmdir; şirkət adından yazırsınızsa — «ünvanımıza». Kimin adından yazdığınızı dəqiqləşdirin.' },
          { t: ' göndərilməsini xahiş edirəm.', c: 'high', src: 'can you send', note: 'Feili isim və «xahiş edirəm»: rəsmi-hüquqi yazışmada qəbul olunmuş quruluş.' }
        ],
        fixedSegs: [
          { t: 'Gecikəcəyimlə bağlı üzr istəyirəm.', c: 'high', src: S_SORRY, note: 'Rəsmi-hüquqi üslub: üzr «ilə bağlı» quruluşu ilə verilir.' },
          { t: ' Müqavilənin ', c: 'high', src: 'the contract', note: '«contract» → «Müqavilə».' },
          { t: 'ən qısa müddətdə', c: 'high', src: 'ASAP', note: '«ASAP» → «ən qısa müddətdə».' },
          { t: ' ünvanıma', c: 'high', fixed: true, src: 'me', note: 'Üslubçu Mirzə düzəltdi: kanselyarizm «tərəfimə» sadələşdirildi.' },
          { t: ' göndərilməsini xahiş edirəm.', c: 'high', src: 'can you send', note: 'Feili isim və «xahiş edirəm».' }
        ],
        fixes: [
          { was: 'tərəfimə', now: 'ünvanıma', type: 'Üslub', why: '«tərəfimə göndərilməsi» kanselyarizmdir. «ünvanıma» eyni mənanı sadə və dəqiq verir.' }
        ],
        score: 88, seal: 'Düzəlişlərlə qəbul',
        verdict: '1 üslub düzəlişi. Qeyd: mənbə danışıq üslubundadır — Üslubçu Mirzə bu mesaj üçün Rəsmi üslubu tövsiyə edir.',
        variants: {
          herfi: 'Üzr istəyirəm, mən gecikəcəyəm. Müqavilənin mənə mümkün qədər tez göndərilməsini xahiş edirəm.',
          tebii: 'Gecikəcəyimə görə üzr istəyirəm. Müqaviləni ən qısa müddətdə göndərməyinizi xahiş edirəm.',
          pesekar: 'Gecikəcəyimlə bağlı üzr istəyirəm. Müqavilənin ən qısa müddətdə ünvanıma göndərilməsini xahiş edirəm.'
        }
      }
    }
  };
  function joinSegs(a) { return (a || []).map(function (s) { return s.t; }).join(''); }

  /* every Azerbaijani version of the example → its register (for AZ → EN/RU/TR) */
  var AZ_SET = null;
  function azSet() {
    if (AZ_SET) return AZ_SET;
    AZ_SET = {};
    Object.keys(EX.reg).forEach(function (k) {
      var E = EX.reg[k];
      [joinSegs(E.segs), joinSegs(E.fixedSegs), E.variants.herfi, E.variants.tebii, E.variants.pesekar].forEach(function (t) { var n = norm(t); if (n && !AZ_SET[n]) AZ_SET[n] = k; });
    });
    return AZ_SET;
  }
  function exFwd(text) { var n = norm(text); if (!n) return null; for (var k in EX.rev) if (norm(EX.rev[k]) === n) return k; return null; }
  function exRev(text) { var n = norm(text); return n ? (azSet()[n] || null) : null; }
  function exMatch(text, from, to) {
    var l = to === 'az' ? exFwd(text) : null;
    if (l) return { dir: 'fwd', lang: l };
    var r = from === 'az' && to !== 'az' ? exRev(text) : null;
    if (r) return { dir: 'rev', lang: to, reg: r };
    return null;
  }

  /* sample texts for the «Nümunələr» sheet (texts come from the engine's corpus) */
  function sampleText(key) {
    var S0 = App.samples || (App.data && App.data.SAMPLES) || {};
    return S0[key] || '';
  }
  var SAMPLES = [
    { id: 'ex', t: 'Gecikmə mesajı', s: 'Danışıqdan rəsmiyə — canlı nümunə', ic: 'message', cls: ' fir', get: function () { return EX.src; } },
    { id: 'legal', t: 'Müqavilə bəndləri', s: '«shall», «Employer», xitam — hüquqi terminlər', ic: 'shield', cls: '', get: function () { return sampleText('legal'); } },
    { id: 'report', t: 'İllik hesabat', s: 'Xalis mənfəət, gəlir, dividend', ic: 'chart', cls: ' gold', get: function () { return sampleText('report'); } },
    { id: 'letter', t: 'İşgüzar məktub', s: '«Dear Mr. Aliyev» — adlar və nəzakət', ic: 'mail', cls: ' navy', get: function () { return sampleText('letter'); } },
    { id: 'casual', t: 'Həmkara mesaj', s: 'Faylı bu axşama qədər…', ic: 'message', cls: '', get: function () { return sampleText('casual'); } },
    { id: 'tourism', t: 'Turist bələdçisi', s: 'İçərişəhər, bulvar, Xəzər', ic: 'globe', cls: ' green', get: function () { return sampleText('tourism'); } },
    { id: 'ru', t: 'Rus dilindən: müqavilə', s: 'Договор, поставка, оплата', ic: 'file', cls: '', get: function () { return sampleText('ru'); } },
    { id: 'tr', t: 'Türk dilindən: iclas', s: 'Türk formalarına diqqət', ic: 'file', cls: ' gold', get: function () { return sampleText('tr'); } }
  ];


  /* ------------------------------------------------------------------
     4. CSS (tokens only, prefixed .translate-)
     ------------------------------------------------------------------ */
  var CSS = [
    '.translate-page{--tr-ease:cubic-bezier(.2,.8,.2,1)}',
    '.translate-head h1{font:600 var(--t-h1,1.375rem)/1.27 var(--f-display);letter-spacing:-.01em}',
    '.translate-head p{font-size:var(--t-small,.8125rem);color:var(--text-2,var(--soft))}',
    '.translate-head .actions .btn{min-height:32px}',
    /* one bordered workspace: toolbar · info line · source | target */
    '.translate-work{min-width:0;background:var(--panel,var(--surface));border:1px solid var(--border,var(--line));border-radius:8px}',
    '.translate-tb{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;padding:8px 12px;border-bottom:1px solid var(--border,var(--line))}',
    '.translate-pair{display:flex;align-items:center;gap:4px;min-width:0}',
    '.translate-lang{display:block;min-width:0;cursor:pointer}',
    '.translate-lang > span{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}',
    '.translate-lang .select,.translate-qsel{height:32px;min-height:32px;padding-block:0;padding-left:10px;padding-right:30px;font-size:var(--t-body,.875rem);font-weight:500;background-color:transparent;border-color:transparent;background-position:calc(100% - 16px) 52%,calc(100% - 11px) 52%}',
    '.translate-lang .select{width:128px}',
    '@media (hover:hover){.translate-lang .select:hover,.translate-qsel:hover{background-color:var(--hover);border-color:transparent}}',
    '.translate-lang .select:focus,.translate-qsel:focus{border-color:var(--accent,var(--firuze))}',
    '.translate-swap{width:32px;height:32px;border-color:transparent;color:var(--text-2,var(--soft))}',
    '.translate-swap svg{width:16px;height:16px;transition:transform 160ms var(--tr-ease)}',
    '@media (hover:hover){.translate-swap:hover{color:var(--text,var(--ink))}}',
    '.translate-sep{flex:none;width:1px;height:20px;background:var(--border,var(--line))}',
    '.translate-reg{min-width:0}',
    '.translate-reg .seg button{min-height:26px;padding:3px 10px;font-size:var(--t-small,.8125rem)}',
    '.translate-reg .seg button.detected::after{width:5px;height:5px;background:var(--accent,var(--firuze))}',
    '.translate-quality{display:flex;align-items:center;gap:4px;margin-left:auto;min-width:0}',
    '.translate-quality > span{font-size:var(--t-caption,.75rem);color:var(--text-2,var(--soft))}',
    '.translate-qsel{width:auto}',
    '.translate-short{display:none}',
    '.translate-info{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:4px 24px;padding:8px 16px;border-bottom:1px solid var(--border,var(--line));font-size:var(--t-caption,.75rem);line-height:16px;color:var(--text-2,var(--soft))}',
    '.translate-explain{flex:1 1 320px;min-width:0}',
    '.translate-explain b{color:var(--text,var(--ink));font-weight:600}',
    '.translate-cue{color:var(--text,var(--ink));font-family:var(--f-mono);font-size:.6875rem}',
    '.translate-explain.swap > span{animation:translate-fade 160ms var(--tr-ease)}',
    '.translate-qhint{flex:0 1 auto;color:var(--text-3,var(--faint))}',
    '@media (max-width:759px){.translate-quality{margin-left:0}.translate-sep{display:none}.translate-pair{flex:1 1 100%}.translate-pair .translate-lang{flex:1 1 0}.translate-lang .select{width:100%}.translate-reg,.translate-reg .seg{width:100%}.translate-reg .seg button{flex:1 1 0;min-width:0;padding-inline:4px}.translate-full{display:none}.translate-short{display:inline}}',
    /* panes */
    '.translate-panes{display:grid;grid-template-columns:minmax(0,1fr)}',
    '@media (min-width:760px){.translate-panes{grid-template-columns:repeat(2,minmax(0,1fr))}.translate-out{border-left:1px solid var(--border,var(--line))}}',
    '@media (max-width:759px){.translate-out{border-top:1px solid var(--border,var(--line))}}',
    '.translate-pane{display:flex;flex-direction:column;min-width:0}',
    '@media (min-width:760px){.translate-pane{min-height:380px}}',
    '.translate-pane-h{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:6px 10px;min-width:0;min-height:40px;padding:8px 16px 0}',
    '.translate-pane-h > label{cursor:text}',
    '.translate-pane-h .eyebrow{font:600 var(--t-caption,.75rem)/16px var(--f-body);letter-spacing:.04em;text-transform:uppercase;color:var(--text-2,var(--soft))}',
    '.translate-badges{display:flex;flex-wrap:wrap;gap:4px}',
    '.translate-detect{display:inline-flex;min-width:0}',
    '.translate-detect .chip{min-height:24px;padding:0 8px;font-size:var(--t-caption,.75rem)}',
    '.translate-src.translate-shake .translate-ta::placeholder{color:var(--danger,var(--nar))}',
    '.translate-ta{flex:1;min-height:200px;padding:8px 16px 16px;border:0;border-radius:0;background:transparent;box-shadow:none;font-size:1rem;line-height:1.65;resize:none}',
    '.translate-ta:hover,.translate-ta:focus{border:0;box-shadow:none;background:transparent}',
    '.translate-src-f{display:flex;flex-wrap:wrap;align-items:center;gap:4px;padding:8px 12px 8px 16px;border-top:1px solid var(--border,var(--line))}',
    '.translate-count{margin-right:auto;font-size:var(--t-caption,.75rem);color:var(--text-2,var(--soft));font-variant-numeric:tabular-nums}',
    '.translate-count.warn{color:var(--warning,var(--zafaran-ink));font-weight:600}',
    '.translate-src-f .icon-btn{width:32px;height:32px}',
    '.translate-go{flex:none;margin-left:4px}',
    '@media (max-width:479px){.translate-go{flex:1 1 100%;margin-left:0;margin-top:4px}}',
    '.translate-kbd{display:none;gap:2px;margin-left:2px}',
    '@media (hover:hover) and (pointer:fine){.translate-kbd{display:inline-flex}}',
    '.translate-go .kbd{min-width:18px;height:18px;background:transparent;border-color:color-mix(in srgb,currentColor 35%,transparent);color:inherit;opacity:.85}',
    '.translate-go[aria-busy="true"] .translate-kbd{visibility:hidden}',
    /* result */
    '.translate-out-b{flex:1;display:grid;align-content:start;gap:16px;min-width:0;padding:8px 16px 16px}',
    '.translate-text{font-size:1rem;line-height:1.65;white-space:pre-wrap;overflow-wrap:anywhere;color:var(--text,var(--ink));transition:opacity 160ms ease}',
    '.translate-out.is-stale .translate-text{opacity:.5}',
    '.translate-s{padding:1px 0;border-radius:2px;cursor:pointer;-webkit-box-decoration-break:clone;box-decoration-break:clone;outline:none;text-underline-offset:.28em}',
    '.translate-s:focus-visible{box-shadow:0 0 0 2px var(--focus)}',
    '.translate-text .conf-high{text-decoration-color:transparent}',
    '.translate-text .conf-high:hover{background:var(--hover)}',
    '.translate-text .conf-mid,.translate-legend .conf-mid{text-decoration-style:dotted;text-decoration-thickness:2px}',
    '.translate-s[aria-expanded="true"]{background:var(--sunken,var(--surface2))}',
    '.translate-s.conf-mid[aria-expanded="true"]{background:var(--warning-t,var(--zaf-t))}',
    '.translate-s.conf-low[aria-expanded="true"]{background:var(--danger-t,var(--nar-t))}',
    '.translate-text.reveal .translate-s{animation:translate-in 160ms ease both}',
    '.translate-text .translate-s.is-fixed{text-decoration-line:underline;text-decoration-style:solid;text-decoration-color:color-mix(in srgb,var(--success,var(--ok)) 60%,transparent);text-decoration-thickness:1.5px}',
    '.translate-meta{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:6px 16px;padding-top:8px;border-top:1px solid var(--border,var(--line))}',
    '.translate-legend{font-size:var(--t-caption,.75rem)}',
    '.translate-legend .translate-leg-fix{text-decoration:underline solid color-mix(in srgb,var(--success,var(--ok)) 60%,transparent);text-decoration-thickness:1.5px;text-underline-offset:.3em}',
    '.translate-stats{font-size:var(--t-caption,.75rem);color:var(--text-2,var(--soft));font-variant-numeric:tabular-nums}',
    /* result blocks: annotations · alternatives · terms */
    '.translate-block{display:grid;gap:6px;min-width:0}',
    '.translate-block > h3{display:flex;align-items:baseline;justify-content:space-between;gap:8px;font:600 var(--t-caption,.75rem)/16px var(--f-body);letter-spacing:.04em;text-transform:uppercase;color:var(--text-2,var(--soft))}',
    '.translate-block > h3 .link{font-size:var(--t-caption,.75rem);letter-spacing:0;text-transform:none}',
    '.translate-anns,.translate-alts{display:grid;min-width:0}',
    '.translate-ann{display:grid;grid-template-columns:8px minmax(0,1fr);gap:2px 10px;align-items:baseline;width:100%;padding:6px 0;border:0;border-top:1px solid var(--border,var(--line));background:none;color:inherit;font:inherit;text-align:left;cursor:pointer;transition:background-color 120ms ease}',
    '.translate-ann:first-child{border-top:0}',
    '@media (hover:hover){.translate-ann:hover b{text-decoration:underline;text-decoration-color:var(--border-2,var(--line-2));text-underline-offset:3px}}',
    '.translate-ann > i{width:6px;height:6px;border-radius:50%;background:var(--border-2,var(--line-2));transform:translateY(-1px)}',
    '.translate-ann.mid > i{background:var(--warning,var(--zafaran))}',
    '.translate-ann.low > i{background:var(--danger,var(--nar))}',
    '.translate-ann.fixed > i{background:var(--success,var(--ok))}',
    '.translate-ann b{font-size:var(--t-small,.8125rem);font-weight:500;color:var(--text,var(--ink))}',
    '.translate-ann small{grid-column:2;font-size:var(--t-caption,.75rem);line-height:16px;color:var(--text-2,var(--soft))}',
    '.translate-alt{display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px;padding:6px 0;border-top:1px solid var(--border,var(--line));font-size:var(--t-small,.8125rem)}',
    '.translate-alt:first-child{border-top:0}',
    '.translate-alt .cur{color:var(--text-2,var(--soft))}',
    '.translate-alt .arr{color:var(--text-3,var(--faint))}',
    '.translate-alt .alt{color:var(--text,var(--ink));font-weight:500}',
    '.translate-alt .btn{margin-left:auto}',
    '.translate-tt{width:100%;border-collapse:collapse;font-size:var(--t-small,.8125rem)}',
    '.translate-tt th{padding:0 8px 4px 0;text-align:left;font:500 var(--t-caption,.75rem)/16px var(--f-body);color:var(--text-3,var(--faint))}',
    '.translate-tt td{padding:6px 8px 6px 0;border-top:1px solid var(--border,var(--line));vertical-align:baseline;overflow-wrap:anywhere}',
    '.translate-tt td:last-child,.translate-tt th:last-child{padding-right:0;text-align:right;white-space:nowrap}',
    '.translate-tt .st{font-size:var(--t-caption,.75rem);color:var(--success,var(--ok))}',
    '.translate-tt .st.new{color:var(--accent,var(--firuze))}',
    '.translate-out .callout{font-size:var(--t-small,.8125rem)}',
    '.translate-out .callout .link{font-size:inherit}',
    '.translate-actions{display:flex;flex-wrap:wrap;align-items:center;gap:4px;padding:8px 12px;border-top:1px solid var(--border,var(--line))}',
    '.translate-actions .btn{min-width:0}',
    '.translate-actions .translate-deep{margin-left:auto}',
    '@media (max-width:479px){.translate-actions .translate-deep{margin-left:0}}',
    '.translate-actions .btn.is-done{color:var(--success,var(--ok))}',
    /* calm inline loading */
    '.translate-load{display:grid;gap:12px}',
    '.translate-load-art{display:none}',
    '.translate-load-cap{display:flex;align-items:center;gap:8px;font-size:var(--t-small,.8125rem);color:var(--text-2,var(--soft))}',
    '.translate-load-cap .spinner{width:12px;height:12px;border-width:1.5px;color:var(--accent,var(--firuze))}',
    '.translate-dots{display:none}',
    '.translate-steps{display:flex;flex-wrap:wrap;gap:4px 12px;font-size:var(--t-caption,.75rem);color:var(--text-3,var(--faint))}',
    '.translate-step{display:inline-flex;align-items:center;gap:4px;transition:color 160ms ease}',
    '.translate-step-ic{display:inline-grid;opacity:0;transition:opacity 160ms ease}',
    '.translate-step-ic svg{width:12px;height:12px}',
    '.translate-step.on{color:var(--text,var(--ink))}',
    '.translate-step.done{color:var(--text-2,var(--soft))}',
    '.translate-step.done .translate-step-ic{opacity:1;color:var(--success,var(--ok))}',
    /* empty / error — small, contextual */
    '.translate-note{display:grid;gap:6px;justify-items:start;padding:8px 0;max-width:46ch}',
    '.translate-note h3{font:600 var(--t-h3,.9375rem)/20px var(--f-body)}',
    '.translate-note p{font-size:var(--t-small,.8125rem);color:var(--text-2,var(--soft))}',
    '.translate-note .actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:4px}',
    '.translate-note.err h3{color:var(--text,var(--ink))}',
    '.translate-note.err h3::before{content:"";display:inline-block;width:6px;height:6px;margin-right:8px;border-radius:50%;background:var(--danger,var(--nar));vertical-align:2px}',
    '.translate-note .kbd{margin:0 2px}',
    /* note popover (appended to body) */
    '.translate-pop{position:fixed;left:0;top:0;z-index:50;width:min(320px,calc(100vw - 24px));display:grid;gap:8px;padding:10px 12px 12px;border:1px solid var(--border-2,var(--line-2));border-radius:8px;background:var(--panel,var(--surface));color:var(--text,var(--ink));box-shadow:var(--sh-3);animation:translate-pop 120ms ease both}',
    '.translate-pop-h{display:flex;align-items:center;gap:8px;margin-right:-6px;font:600 var(--t-caption,.75rem)/16px var(--f-body);letter-spacing:.04em;text-transform:uppercase;color:var(--text-2,var(--soft))}',
    '.translate-pop-h > i{width:6px;height:6px;flex:none;border-radius:50%;background:var(--conf-high)}',
    '.translate-pop.mid .translate-pop-h > i{background:var(--conf-mid)}',
    '.translate-pop.low .translate-pop-h > i{background:var(--conf-low)}',
    '.translate-pop-h .icon-btn{margin-left:auto}',
    '.translate-pop > p{font-size:var(--t-small,.8125rem);line-height:1.5}',
    '.translate-pop > p.translate-pop-src{font-size:var(--t-caption,.75rem);color:var(--text-2,var(--soft))}',
    '.translate-pop-f{display:flex;flex-wrap:wrap;gap:6px;padding-top:2px}',
    '.translate-pop-f .btn{white-space:normal;text-align:left;height:auto;padding-block:4px}',
    /* Mirzə Məclisi review: reviewer rows */
    '.translate-review{display:grid;gap:10px;padding-top:12px;border-top:1px solid var(--border,var(--line));animation:translate-in 160ms ease both}',
    '.translate-review-h{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 12px;min-width:0}',
    '.translate-review-h .eyebrow{font:600 var(--t-caption,.75rem)/16px var(--f-body);letter-spacing:.04em;text-transform:uppercase;color:var(--text-2,var(--soft))}',
    '.translate-score{font:600 var(--t-h2,1.0625rem)/1 var(--f-body);font-variant-numeric:tabular-nums}',
    '.translate-score small{font-size:var(--t-caption,.75rem);font-weight:400;color:var(--text-3,var(--faint))}',
    '.translate-seal{font-size:var(--t-caption,.75rem);font-weight:600}',
    '.translate-seal.ok{color:var(--success,var(--ok))}.translate-seal.mid{color:var(--warning,var(--zafaran-ink))}.translate-seal.bad{color:var(--danger,var(--nar))}',
    '.translate-review-t{font-size:var(--t-small,.8125rem);color:var(--text-2,var(--soft));line-height:1.5}',
    '.translate-fixes{display:grid;border:1px solid var(--border,var(--line));border-radius:6px}',
    '.translate-fix{display:grid;grid-template-columns:64px minmax(0,1fr) auto;gap:4px 12px;align-items:start;padding:10px 12px}',
    '.translate-fix + .translate-fix{border-top:1px solid var(--border,var(--line))}',
    '.translate-sev{display:inline-flex;align-items:center;gap:6px;font-size:var(--t-caption,.75rem);font-weight:600;line-height:20px;color:var(--text-2,var(--soft))}',
    '.translate-sev::before{content:"";width:6px;height:6px;border-radius:50%;background:currentColor}',
    '.translate-sev.high{color:var(--danger,var(--nar))}.translate-sev.mid{color:var(--warning,var(--zafaran-ink))}',
    '.translate-fix-b{display:grid;gap:2px;min-width:0}',
    '.translate-fix-type{font-size:var(--t-caption,.75rem);color:var(--text-3,var(--faint))}',
    '.translate-wn{display:flex;flex-wrap:wrap;align-items:baseline;gap:2px 6px;font-size:var(--t-small,.8125rem);line-height:20px}',
    '.translate-wn svg{width:12px;height:12px;color:var(--text-3,var(--faint));align-self:center}',
    '.translate-was{color:var(--text-2,var(--soft));text-decoration:line-through;text-decoration-color:color-mix(in srgb,var(--danger,var(--nar)) 55%,transparent);overflow-wrap:anywhere}',
    '.translate-now{color:var(--text,var(--ink));font-weight:500;overflow-wrap:anywhere}',
    '.translate-fix p{font-size:var(--t-caption,.75rem);color:var(--text-2,var(--soft));line-height:16px}',
    '.translate-who{display:flex;align-items:center;gap:6px;font-size:var(--t-caption,.75rem);color:var(--text-2,var(--soft));white-space:nowrap}',
    '.translate-mono{flex:none;width:18px;height:18px;display:grid;place-items:center;border-radius:50%;box-shadow:inset 0 0 0 1px var(--border-2,var(--line-2));font:600 .625rem/1 var(--f-body);color:var(--text,var(--ink))}',
    '@media (max-width:559px){.translate-fix{grid-template-columns:minmax(0,1fr) auto}.translate-fix-b{grid-column:1 / -1;grid-row:2}}',
    '.translate-checks{display:flex;flex-wrap:wrap;gap:4px 12px;font-size:var(--t-caption,.75rem);color:var(--text-2,var(--soft))}',
    '.translate-checks span b{font-weight:600;color:var(--warning,var(--zafaran-ink))}',
    '.translate-checks span.ok::before{content:"✓ ";color:var(--success,var(--ok))}',
    '.translate-review .row .btn{min-height:28px}',
    /* lower sections: example · context · history */
    '.translate-sec{display:grid;gap:8px;min-width:0}',
    '.translate-sec-h{display:flex;align-items:baseline;justify-content:space-between;gap:12px;padding:0 4px}',
    '.translate-sec-h h2{font:600 var(--t-caption,.75rem)/16px var(--f-body);letter-spacing:.04em;text-transform:uppercase;color:var(--text-2,var(--soft))}',
    '.translate-box{min-width:0;background:var(--panel,var(--surface));border:1px solid var(--border,var(--line));border-radius:8px}',
    '.translate-lower{display:grid;gap:24px;grid-template-columns:minmax(0,1fr)}',
    '@media (min-width:900px){.translate-lower.two{grid-template-columns:minmax(0,1fr) minmax(0,1.3fr)}}',
    '.translate-sit dl{display:grid;grid-template-columns:minmax(0,96px) minmax(0,1fr);margin:0}',
    '.translate-sit dt,.translate-sit dd{margin:0;padding:8px 16px;border-top:1px solid var(--border,var(--line));font-size:var(--t-small,.8125rem)}',
    '.translate-sit dt{padding-right:0;color:var(--text-2,var(--soft))}',
    '.translate-sit dd{overflow-wrap:anywhere}',
    '.translate-sit dt:first-of-type,.translate-sit dd:first-of-type{border-top:0}',
    '.translate-sit .empty-tx{padding:12px 16px;font-size:var(--t-small,.8125rem);color:var(--text-2,var(--soft))}',
    '.translate-hrow{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:baseline;gap:2px 12px;width:100%;padding:8px 16px;border:0;border-top:1px solid var(--border,var(--line));background:none;color:inherit;font:inherit;text-align:left;cursor:pointer;transition:background-color 120ms ease}',
    '.translate-hrow:first-child{border-top:0;border-radius:8px 8px 0 0}',
    '.translate-hrow:last-child{border-radius:0 0 8px 8px}',
    '.translate-hrow:only-child{border-radius:8px}',
    '@media (hover:hover){.translate-hrow:hover{background:var(--hover)}}',
    '.translate-hrow:focus-visible{outline:2px solid var(--focus);outline-offset:-2px}',
    '.translate-hrow .pair{font:500 .6875rem/16px var(--f-mono);color:var(--text-2,var(--soft))}',
    '.translate-hrow .tx{display:grid;gap:1px;min-width:0}',
    '.translate-hrow .tx b{font-size:var(--t-small,.8125rem);font-weight:500}',
    '.translate-hrow .tx small{font-size:var(--t-caption,.75rem);color:var(--text-2,var(--soft))}',
    '.translate-hrow .meta{font-size:var(--t-caption,.75rem);color:var(--text-3,var(--faint));white-space:nowrap}',
    '.translate-ex-src{padding:10px 16px;font-size:var(--t-small,.8125rem);color:var(--text-2,var(--soft))}',
    '.translate-ex{display:grid;grid-template-columns:minmax(0,1fr);border-top:1px solid var(--border,var(--line))}',
    '@media (min-width:760px){.translate-ex{grid-template-columns:repeat(2,minmax(0,1fr))}.translate-ex-row + .translate-ex-row{border-left:1px solid var(--border,var(--line))}}',
    '@media (max-width:759px){.translate-ex-row + .translate-ex-row{border-top:1px solid var(--border,var(--line))}}',
    '.translate-ex-row{position:relative;display:grid;gap:4px;align-content:start;width:100%;min-width:0;padding:12px 16px;border:0;background:none;color:var(--text,var(--ink));text-align:left;font:inherit;cursor:pointer;transition:background-color 120ms ease}',
    '@media (hover:hover){.translate-ex-row:hover{background:var(--hover)}}',
    '.translate-ex-row:focus-visible{outline:2px solid var(--focus);outline-offset:-2px}',
    '.translate-ex-row[aria-pressed="true"]{background:var(--selected,var(--fir-t))}',
    '.translate-ex-row[aria-pressed="true"]::before{content:"";position:absolute;left:0;top:0;bottom:0;width:2px;background:var(--accent,var(--firuze))}',
    '.translate-ex-row .t{font-size:var(--t-body,.875rem);line-height:1.5}',
    '.translate-ex-row small{color:var(--text-2,var(--soft));font-size:var(--t-caption,.75rem)}',
    '.translate-ex-row .reg{font-size:var(--t-caption,.75rem);font-weight:600;color:var(--text,var(--ink))}',
    '.translate-ex-diff{padding:10px 16px;border-top:1px solid var(--border,var(--line));font-size:var(--t-caption,.75rem);color:var(--text-2,var(--soft));line-height:1.5}',
    /* sheets */
    '.translate-styles{display:grid;gap:8px}',
    '.translate-style-tx{display:grid;gap:2px;min-width:0}',
    '.translate-style-pv{display:block;margin-top:4px;font-size:var(--t-small,.8125rem);line-height:1.45;color:var(--text,var(--ink))}',
    '.translate-style-pv .skeleton{width:100%}',
    '.translate-vars{display:grid;gap:0;border:1px solid var(--border,var(--line));border-radius:8px}',
    '@media (min-width:700px){.translate-vars{grid-template-columns:repeat(3,minmax(0,1fr))}.translate-var + .translate-var{border-left:1px solid var(--border,var(--line))}}',
    '@media (max-width:699px){.translate-var + .translate-var{border-top:1px solid var(--border,var(--line))}}',
    '.translate-var{display:flex;flex-direction:column;gap:10px;min-width:0;padding:14px 16px}',
    '.translate-var.rec .eyebrow{color:var(--accent,var(--firuze))}',
    '.translate-var.cur{background:var(--selected,var(--fir-t))}',
    '.translate-var-t{font-size:var(--t-body,.875rem);line-height:1.6}',
    '.translate-var-n{font-size:var(--t-caption,.75rem);color:var(--text-2,var(--soft));line-height:1.5}',
    '.translate-var .row{margin-top:auto}',
    '.translate-bar{display:grid;grid-template-columns:minmax(0,1fr) 38px;gap:4px 8px;align-items:center;font-size:var(--t-caption,.75rem);color:var(--text-2,var(--soft))}',
    '.translate-bar .progress{grid-column:1 / -1;grid-row:2;height:3px}',
    '.translate-bar .progress > i{background:var(--text-3,var(--faint))}',
    '.translate-bar b{text-align:right;color:var(--text,var(--ink));font-weight:500;font-variant-numeric:tabular-nums}',
    '.translate-var-src{display:grid;gap:4px;padding:10px 12px;border-radius:6px;background:var(--sunken,var(--surface2));font-size:var(--t-small,.8125rem)}',
    '.translate-sample .tx b{font-size:var(--t-body,.875rem)}',
    /* keyframes */
    '@keyframes translate-fade{from{opacity:0}to{opacity:1}}',
    '@keyframes translate-in{from{opacity:0}to{opacity:1}}',
    '@keyframes translate-pop{from{opacity:0;transform:translateY(-2px)}to{opacity:1;transform:none}}',
    '@media (prefers-reduced-motion:reduce){.translate-text.reveal .translate-s,.translate-review,.translate-pop,.translate-explain.swap > span{animation:none}}'
  ].join('\n');

  /* ------------------------------------------------------------------
     5. STATE
     ------------------------------------------------------------------ */
  var S = null;          /* {src, from, to, reg, quality} — persisted */
  var R = null;          /* current result */
  var V = {};            /* DOM refs of the mounted screen */
  var reqId = 0, busy = false, reviewing = false, pop = null, inited = false, helloDone = false, swapRot = 0;

  function init() {
    if (inited) return;
    inited = true;
    S = { src: EX.src, from: 'en', to: 'az', reg: 'auto', quality: 'exact' };
    var st = sget('translate-state', null);
    if (st && typeof st === 'object') {
      if (typeof st.src === 'string') S.src = st.src.slice(0, 5000);
      if (LANG_NAME[st.from]) S.from = st.from;
      if (LANG_NAME[st.to]) S.to = st.to;
      if (REG_LABEL[st.reg]) S.reg = st.reg;
      if (QMAP[st.quality]) S.quality = st.quality;
    }
    if (S.from === S.to || (S.from !== 'az' && S.to !== 'az')) { S.from = 'en'; S.to = 'az'; }
    var last = sget('translate-last', null);
    if (last && typeof last === 'object' && Array.isArray(last.segs) && typeof last.src === 'string' && norm(last.src) === norm(S.src) && !(last.example && isLive())) R = last;
  }
  /* Live engine: successful answers are kept for this session (text + pair + register + variant),
     so switching back to a register, the four register previews and the variants do not pay for
     the same Gemini call twice. An explicit «Tərcümə et» / retry always asks the engine again. */
  var LIVE = [], LIVE_MAX = 24;
  function isLive() { return !!(App.isLive && App.isLive()); }
  function liveKey(inp, reg) { return [inp.from || '', inp.to || '', reg || 'auto', inp.style || '', norm(inp.text)].join('|'); }
  function livePut(k, v) {
    LIVE = LIVE.filter(function (x) { return x.k !== k; });
    LIVE.push({ k: k, v: v });
    if (LIVE.length > LIVE_MAX) LIVE.shift();
  }
  function trAI(inp, ms, fresh) {
    if (!isLive()) return App.fakeAI('translate', inp, ms);
    var k = liveKey(inp, inp.register);
    if (!fresh) for (var i = 0; i < LIVE.length; i++) if (LIVE[i].k === k) return Promise.resolve(LIVE[i].v);
    return App.fakeAI('translate', inp, ms).then(function (res) {
      if (res && res.ok !== false && String(res.text || '').trim()) {
        livePut(k, res);
        if (!inp.register && REG_LABEL[res.registerId]) livePut(liveKey(inp, res.registerId), res); /* auto = the detected register */
      }
      return res;
    });
  }
  function saveState() { if (S) sset('translate-state', { src: S.src, from: S.from, to: S.to, reg: S.reg, quality: S.quality }); }
  function saveLast() { if (R) sset('translate-last', R); }
  function alive() { return !!(V.page && V.page.isConnected); }
  function textOf(r) { return r ? joinSegs(r.segs) : ''; }

  /* ------------------------------------------------------------------
     6. DETECTION (register + language)
     ------------------------------------------------------------------ */
  var EXTRA_CUES = [
    { reg: 'danisiq', re: /\bASAP\b/, cue: 'ASAP' },
    { reg: 'danisiq', re: /\bgonna\b/i, cue: 'gonna' },
    { reg: 'danisiq', re: /\bwanna\b/i, cue: 'wanna' },
    { reg: 'resmi', re: /\bDear\b/, cue: 'Dear' },
    { reg: 'huquqi', re: /\bshall\b/i, cue: 'shall' }
  ];
  function detectReg(text) {
    var f = exFwd(text);
    if (f) return { id: 'danisiq', label: 'Danışıq', confidence: 0.88, cues: f === 'en' ? ['Sorry', 'gonna', 'ASAP'] : [] };
    var rv = exRev(text);
    if (rv) return { id: rv, label: REG_LABEL[rv], confidence: 0.84, cues: [] };
    var d = null;
    try { d = App.detect && App.detect.register ? App.detect.register(text) : null; } catch (e) { d = null; }
    if (!d || !REG_LABEL[d.id]) d = { id: 'neytral', label: 'Neytral', confidence: 0.6, reasons: [] };
    var cues = [], seen = {};
    (d.reasons || []).forEach(function (r) { var c = String(r.cue || '').trim(); if (c && !seen[lower(c)]) { seen[lower(c)] = 1; cues.push(c); } });
    EXTRA_CUES.forEach(function (x) { if (x.reg === d.id && x.re.test(text) && !seen[lower(x.cue)]) { seen[lower(x.cue)] = 1; cues.push(x.cue); } });
    return { id: d.id, label: REG_LABEL[d.id], confidence: d.confidence || 0.6, cues: cues.slice(0, 3) };
  }
  function detectLang(text) {
    try { return App.detect && App.detect.lang ? App.detect.lang(text) : null; } catch (e) { return null; }
  }

  /* ------------------------------------------------------------------
     7. RESULT BUILDERS
     ------------------------------------------------------------------ */
  function sitFor(reg) {
    return { domain: 'İşgüzar yazışma', purpose: EX.purpose, audience: EX.aud[reg] || EX.aud.neytral, register: REG_LABEL[reg], tone: EX.tone[reg] || EX.tone.neytral };
  }
  function exResult(text, m, regReq, from, to) {
    if (m.dir === 'rev') {
      var reg0 = regReq || m.reg || 'neytral';
      return {
        src: text, from: 'az', to: m.lang, reg: reg0, auto: !regReq, detected: m.reg, example: false, pristine: false, tm: 100,
        segs: [{ t: EX.rev[m.lang], c: 'high', note: 'Tərcümə yaddaşı: 100% uyğunluq. Bu cümlə «Nümunə» layihəsinin yaddaşından götürüldü.', src: short(text, 90) }],
        situation: sitFor(reg0), terms: []
      };
    }
    var reg = regReq || 'danisiq';
    var E = EX.reg[reg];
    var segs = clone(E.segs);
    if (m.lang !== 'en') segs.forEach(function (s) { delete s.src; });
    return {
      src: text, from: m.lang || from, to: 'az', reg: reg, auto: !regReq, detected: 'danisiq', example: true, pristine: true, tm: 0,
      segs: segs, situation: sitFor(reg), terms: [{ a: EX.termByLang[m.lang] || 'contract', b: 'müqavilə' }], warn: E.warn || null
    };
  }
  function buildResult(text, res, regReq, from, to) {
    /* live: the engine's answer is the result, even for the sample sentence (its canned answers are demo data) */
    var m = isLive() ? null : exMatch(text, from, to);
    if (m) return exResult(text, m, regReq, from, to);
    res = res || {};
    var segs = [], tm = 0;
    (res.segments || []).forEach(function (g) {
      if (g.tm) tm = Math.max(tm, g.tm);
      var spans = g.spans && g.spans.length ? g.spans : [{ t: g.t, confidence: g.confidence, note: g.note }];
      spans.forEach(function (sp) {
        segs.push({ t: String(sp.t == null ? '' : sp.t), c: CONF_LABEL[sp.confidence] ? sp.confidence : 'high', note: sp.note || '', src: g.src || '', tm: g.tm || 0 });
      });
    });
    if (!segs.length) segs.push({ t: String(res.text || ''), c: 'low', note: 'Mühərrik bu mətn üçün nəticə qaytarmadı.' });
    return {
      src: text, from: res.from || from, to: res.to || to, reg: REG_LABEL[res.registerId] ? res.registerId : (regReq || 'neytral'),
      auto: !regReq, detected: res.detectedId || null, example: false, pristine: false, tm: tm, segs: segs,
      situation: res.situation || null,
      terms: (res.terms || []).slice(0, 4).map(function (t) { return { a: t.a, b: t.b }; })
    };
  }
  function confStats(segs) {
    var c = { high: 0, mid: 0, low: 0, fixed: 0 }, tot = 0, sc = 0;
    segs.forEach(function (s) {
      var n = wordsOf(s.t).length; if (!n) return;
      c[s.c] = (c[s.c] || 0) + 1; if (s.fixed) c.fixed++;
      tot += n; sc += n * (s.c === 'high' ? 1 : s.c === 'mid' ? 0.72 : 0.38);
    });
    c.pct = tot ? Math.round(sc / tot * 100) : 0; c.words = tot;
    return c;
  }
  function defaultNote(sg) {
    if (sg.c === 'high') return sg.tm ? 'Əmin: tərcümə yaddaşında ' + sg.tm + '% uyğunluq var, terminlər lüğətlə üst-üstə düşür.' : 'Əmin: məna, termin və üslub mənbəyə uyğundur.';
    if (sg.c === 'mid') return 'Bu hissəni bir də oxuyun — kontekstdən asılı olaraq başqa variant daha uyğun ola bilər.';
    return 'Burada əmin deyiləm — mənbə ilə tutuşdurun və lazım olsa, əl ilə düzəldin.';
  }

  /* ------------------------------------------------------------------
     8. RENDER — page sections
     ------------------------------------------------------------------ */
  function header() {
    var acad = App.mode && App.mode() === 'academy';
    return h('div', { class: 'page-h translate-head' },
      h('div', null,
        h('h1', { text: 'Tərcümə' }),
        h('p', { text: acad ?
          'Tərcümə edin, işarələnmiş yerlərə toxunun və səbəbini öyrənin. Dərin yoxlama +15 XP verir.' :
          'Üslub avtomatik tanınır; əminliyi aşağı olan yerlər xətlə işarələnir. Son qərar sizindir.' })),
      h('div', { class: 'actions' },
        h('button', { class: 'btn btn-sm btn-secondary', type: 'button', onclick: openSamples }, 'Nümunələr'),
        h('button', { class: 'btn btn-sm btn-secondary', type: 'button', onclick: docUpload }, ie('upload'), 'Sənəd yüklə')));
  }
  function langSelect(side) {
    var id = 'tr-' + side;
    var sel = h('select', {
      class: 'select', id: id, 'aria-label': side === 'from' ? 'Mənbə dili' : 'Hədəf dili',
      onchange: function (e) { onLang(side, e.target.value); }
    }, LANGS.map(function (l) { return h('option', { value: l.id, text: l.name }); }));
    sel.value = S[side];
    if (side === 'from') V.fromSel = sel; else V.toSel = sel;
    return h('label', { class: 'translate-lang', for: id }, h('span', { text: side === 'from' ? 'Mənbə' : 'Hədəf' }), sel);
  }

  function ctrlCard() {
    var swap = h('button', { class: 'icon-btn translate-swap', type: 'button', 'aria-label': 'Dilləri yerdəyiş et', title: 'Dilləri yerdəyiş et', html: SWAP_SVG, onclick: swapLangs });
    V.seg = h('div', { class: 'seg', role: 'group', 'aria-label': 'Üslub' }, REGS.map(function (r) {
      return h('button', {
        type: 'button', 'data-reg': r.id, 'aria-pressed': String(S.reg === r.id), 'aria-label': r.id === 'auto' ? 'Avtomatik' : null,
        title: r.id === 'auto' ? 'Üslub mətndən tanınsın' : REG_EXPLAIN[r.id],
        onclick: function () { setRegister(r.id, true); }
      }, r.id === 'auto' ? [
        h('span', { class: 'translate-full', text: 'Avto' }),
        h('span', { class: 'translate-short', text: 'Avto', 'aria-hidden': 'true' })
      ] : REG_LABEL[r.id]);
    }));
    V.explain = h('p', { class: 'translate-explain', 'aria-live': 'polite' });
    V.chips = h('select', { class: 'select translate-qsel', id: 'tr-quality', 'aria-label': 'Keyfiyyət rejimi', onchange: function (e) { setQuality(e.target.value, true); } },
      QUALITY.map(function (q) { return h('option', { value: q.id, text: q.label }); }));
    V.chips.value = S.quality;
    V.qhint = h('p', { class: 'translate-qhint' });
    V.ctrl = h('div', { class: 'translate-ctrl' },
      h('div', { class: 'translate-tb', role: 'toolbar', 'aria-label': 'Tərcümə ayarları' },
        h('div', { class: 'translate-pair' }, langSelect('from'), swap, langSelect('to')),
        h('span', { class: 'translate-sep', 'aria-hidden': 'true' }),
        h('div', { class: 'translate-reg' }, V.seg),
        h('label', { class: 'translate-quality', for: 'tr-quality' }, h('span', { text: 'Keyfiyyət' }), V.chips)),
      h('div', { class: 'translate-info' }, V.explain, V.qhint));
    return V.ctrl;
  }
  function srcPane() {
    V.srcEyebrow = h('span', { class: 'eyebrow' });
    V.detect = h('span', { class: 'translate-detect' });
    V.ta = h('textarea', {
      class: 'textarea translate-ta', id: 'tr-src', maxlength: '5000', rows: '4', spellcheck: 'true', lang: S.from,
      placeholder: 'Mətni yazın və ya yapışdırın — məsələn: «Please find attached the signed copy of the contract.»',
      value: S.src, oninput: onInput, onkeydown: onKey
    });
    V.count = h('span', { class: 'translate-count', 'aria-live': 'off' });
    V.paste = h('button', { class: 'icon-btn ghost', type: 'button', 'aria-label': 'Buferdən yapışdır', title: 'Yapışdır', html: CLIP_SVG, onclick: pasteText });
    V.clear = h('button', { class: 'icon-btn ghost', type: 'button', 'aria-label': 'Mətni təmizlə', title: 'Təmizlə', html: App.icon('x'), onclick: clearSource });
    V.go = h('button', { class: 'btn btn-primary translate-go', type: 'button', onclick: function () { translate({ reason: 'button' }); } },
      h('span', { text: 'Tərcümə et' }),
      h('span', { class: 'translate-kbd', 'aria-hidden': 'true' }, h('kbd', { class: 'kbd', text: MOD }), h('kbd', { class: 'kbd', text: '↵' })));
    V.srcCard = h('section', { class: 'translate-pane translate-src', 'aria-label': 'Mənbə mətn' },
      h('div', { class: 'translate-pane-h' }, h('label', { for: 'tr-src' }, V.srcEyebrow), V.detect),
      V.ta,
      h('div', { class: 'translate-src-f' }, V.count, V.paste, V.clear, V.go));
    return V.srcCard;
  }
  function outPane() {
    V.outEyebrow = h('span', { class: 'eyebrow' });
    V.outBadges = h('div', { class: 'translate-badges' });
    V.outBody = h('div', { class: 'translate-out-b' });
    V.acts = {
      copy: h('button', { class: 'btn btn-sm btn-secondary', type: 'button', onclick: function (e) { copyResult(e.currentTarget); } }, ie('copy'), 'Kopyala'),
      vars: h('button', { class: 'btn btn-sm btn-ghost', type: 'button', onclick: openVariants }, '3 variant'),
      style: h('button', { class: 'btn btn-sm btn-ghost', type: 'button', onclick: function () { openStyle(); } }, 'Üslub'),
      gloss: h('button', { class: 'btn btn-sm btn-ghost', type: 'button', onclick: function () { openGlossary(); } }, 'Lüğətə əlavə et'),
      deep: h('button', { class: 'btn btn-sm btn-secondary translate-deep', type: 'button', onclick: deepReview }, 'Dərin yoxlama')
    };
    V.out = h('section', { class: 'translate-pane translate-out', 'aria-label': 'Tərcümə nəticəsi' },
      h('div', { class: 'translate-pane-h' }, V.outEyebrow, V.outBadges),
      V.outBody,
      h('div', { class: 'translate-actions' }, V.acts.copy, V.acts.vars, V.acts.style, V.acts.gloss, V.acts.deep));
    return V.out;
  }
  function exampleCard() {
    var rows = [
      { reg: 'danisiq', who: 'Həmkara · çatda' },
      { reg: 'resmi', who: 'Müştəriyə · e-poçtda' }
    ];
    V.exRows = rows.map(function (r) {
      return h('button', {
        class: 'translate-ex-row', type: 'button', 'data-reg': r.reg, 'aria-pressed': 'false',
        onclick: function () { setRegister(r.reg, false); translate({ reason: 'example' }); if (!wide()) scrollToEl(V.out); }
      },
        h('span', { class: 'row between' }, h('span', { class: 'reg', text: REG_LABEL[r.reg] }), h('small', { text: r.who })),
        h('span', { class: 't', lang: 'az', text: joinSegs(EX.reg[r.reg].segs) }));
    });
    V.exCard = h('section', { class: 'translate-sec translate-excard' },
      h('div', { class: 'translate-sec-h' }, h('h2', { text: 'Nümunə · bir cümlə, iki üslub' }),
        h('button', { class: 'link small', type: 'button', onclick: function () { openStyle(); } }, 'Dörd üslubu müqayisə et')),
      h('div', { class: 'translate-box' },
        h('p', { class: 'translate-ex-src', lang: 'en', text: '«' + EX.src + '»' }),
        h('div', { class: 'translate-ex' }, V.exRows),
        h('p', { class: 'translate-ex-diff', text: 'Fərq: «sən» → «siz», «ASAP» → «ən qısa müddətdə», sual → nəzakətli xahiş. Sətri seçin — tərcümə həmin üslubda yenidən yazılacaq.' })));
    return V.exCard;
  }
  function lowerGrid() {
    V.sitBody = h('div', { class: 'translate-box translate-sit' });
    var sit = h('section', { class: 'translate-sec' },
      h('div', { class: 'translate-sec-h' }, h('h2', { text: 'Kontekst' }),
        h('button', { class: 'link small', type: 'button', onclick: function () { openStyle(); } }, 'Üslubu dəyiş')),
      V.sitBody);
    V.hist = h('div', { class: 'translate-box' });
    V.histClear = h('button', { class: 'link small', type: 'button', onclick: clearHistory }, 'Təmizlə');
    V.histCard = h('section', { class: 'translate-sec', hidden: true },
      h('div', { class: 'translate-sec-h' }, h('h2', { text: 'Son tərcümələr' }), V.histClear),
      V.hist);
    V.lower = h('div', { class: 'translate-lower' }, sit, V.histCard);
    return V.lower;
  }
  /* ------------------------------------------------------------------
     9. CONTROLS — register, quality, languages
     ------------------------------------------------------------------ */
  function renderExplain() {
    var el = V.explain; if (!el) return;
    var d = V.det, kids;
    if (S.reg === 'auto') {
      if (!d) kids = ['Üslub mətnin özündən tanınır: müraciət formasına, sözlərə və durğu işarələrinə baxılır.'];
      else if (d.cues.length) {
        kids = ['Mətndə '];
        d.cues.forEach(function (c, i) { if (i) kids.push(i === d.cues.length - 1 ? ' və ' : ', '); kids.push(h('span', { class: 'translate-cue', text: c })); });
        kids.push(' var — ', h('b', { text: d.label }), ' ' + regWord(d.id) + ' tanındı · ' + Math.round(d.confidence * 100) + '% əmin.');
      } else kids = [h('b', { text: d.label }), ' üslub tanındı — xüsusi işarə tapılmadı. Lazım olsa, əl ilə seçin.'];
    } else {
      kids = [h('b', { text: REG_LABEL[S.reg] + ': ' }), REG_EXPLAIN[S.reg]];
      if (d && d.id !== S.reg) kids.push(' Mətnin özü ', h('b', { text: d.label }), ' ' + regWord(d.id, 'dat') + ' oxşayır.');
    }
    var sig = S.reg + '|' + (d ? d.id + d.cues.join(',') : '');
    if (el._sig === sig) return;
    el._sig = sig;
    el.textContent = '';
    el.appendChild(h('span', null, kids));
    el.classList.remove('swap'); void el.offsetWidth; el.classList.add('swap');
  }
  function syncSeg() {
    if (!V.seg) return;
    Array.prototype.forEach.call(V.seg.querySelectorAll('button'), function (b) {
      var id = b.getAttribute('data-reg');
      b.setAttribute('aria-pressed', String(id === S.reg));
      b.classList.toggle('detected', !!V.det && id === V.det.id);
    });
  }
  function setRegister(id, user) {
    if (!REG_LABEL[id]) return;
    var changed = S.reg !== id;
    S.reg = id; saveState();
    syncSeg(); renderExplain();
    if (!user || !changed) return;
    var has = V.ta && V.ta.value.trim();
    if (has && (V.showing === 'result' || V.showing === 'loading')) translate({ reason: 'reg' });
    else nz('think', id === 'auto' ? 'Üslubu mətndən özüm tanıyacağam.' : REG_LABEL[id] + ' ' + regWord(id) + ' — yadda saxladım.', 1800);
  }
  function renderQHint() {
    var q = QMAP[S.quality]; if (!V.qhint || !q) return;
    V.qhint.textContent = q.label + ': ' + q.hint;
  }
  function setQuality(id, user) {
    if (!QMAP[id]) return;
    var changed = S.quality !== id;
    S.quality = id; saveState();
    if (V.chips) { if (V.chips.tagName === 'SELECT') V.chips.value = id; else Array.prototype.forEach.call(V.chips.querySelectorAll('.chip'), function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-q') === id)); }); }
    renderQHint();
    if (!user || !changed) return;
    if (id === 'meclis') nz('point', 'Məclis rejimi: tərcümədən sonra beş mirzə yoxlayıb düzəldəcək.', 3000);
    else if (id === 'fast') nz('success', 'Sürətli rejim — qısa mesajlar üçün ideal.', 2200);
    else nz('think', 'Dəqiq rejim: lüğət, yaddaş və əminlik yoxlaması.', 2200);
  }
  function syncLangs() {
    if (!V.fromSel) return;
    V.fromSel.value = S.from; V.toSel.value = S.to;
    V.srcEyebrow.textContent = 'Mənbə · ' + LANG_NAME[S.from];
    V.ta.setAttribute('lang', S.from);
    if (V.showing !== 'result') V.outEyebrow.textContent = 'Tərcümə · ' + LANG_NAME[S.to];
  }
  function onLang(side, val) {
    if (!LANG_NAME[val]) return;
    var other = side === 'from' ? 'to' : 'from';
    if (val === S[other]) S[other] = S[side];
    S[side] = val;
    if (S.from !== 'az' && S.to !== 'az') {
      S[other] = 'az';
      App.toast('Cütün bir tərəfi Azərbaycan dilidir', 'info', { sub: 'Mirzə AZ ↔ EN, RU, TR istiqamətlərində işləyir' });
    }
    syncLangs(); syncDetect(); saveState();
    if (V.showing === 'result' && V.ta.value.trim()) translate({ reason: 'lang' });
  }
  function fixLang(dl, announce) {
    if (!LANG_NAME[dl] || dl === S.from) return false;
    var pf = S.from, pt = S.to;
    S.from = dl;
    if (dl === 'az') S.to = pf !== 'az' ? pf : (pt !== 'az' ? pt : 'en');
    else S.to = 'az';
    syncLangs(); syncDetect(); saveState();
    if (announce) App.toast('Dil cütü: ' + CODE[S.from] + ' → ' + CODE[S.to], 'info', { sub: LANG_NAME[dl] + ' dili avtomatik tanındı', icon: 'globe' });
    return true;
  }
  function swapLangs(e) {
    var btn = e && e.currentTarget, svg = btn && btn.querySelector('svg');
    swapRot += 180; if (svg) svg.style.transform = 'rotate(' + swapRot + 'deg)';
    var carry = V.showing === 'result' && R && !V.out.classList.contains('is-stale') ? textOf(R).trim() : '';
    var f = S.from; S.from = S.to; S.to = f;
    syncLangs(); saveState();
    if (carry) { setSource(carry); translate({ reason: 'swap' }); }
    else syncDetect();
  }
  function syncDetect() {
    if (!V.ta) return;
    var text = V.ta.value.trim();
    V.det = text ? detectReg(text) : null;
    syncSeg(); renderExplain();
    V.detect.textContent = '';
    var dl = text.length >= 4 ? detectLang(text) : null;
    if (!dl) return;
    if (dl === S.from) V.detect.appendChild(h('span', { class: 'badge', text: 'Dil tanındı' }));
    else V.detect.appendChild(h('button', { class: 'chip', type: 'button', title: 'Mənbə dilini dəyiş', onclick: function () { fixLang(dl, true); if (V.showing === 'result') translate({ reason: 'lang' }); } }, LANG_LIKE[dl] + ' · dəyiş'));
  }

  /* ------------------------------------------------------------------
     10. SOURCE — input, counter, paste, clear
     ------------------------------------------------------------------ */
  function updateCount() {
    var t = V.ta.value, n = t.length, w = wordsOf(t).length;
    V.count.textContent = num(n) + ' / 5 000 · ' + num(w) + ' söz';
    V.count.classList.toggle('warn', n > 4500);
    V.clear.disabled = !n;
  }
  function onInput() {
    S.src = V.ta.value;
    updateCount();
    var has = !!V.ta.value.trim();
    if (!has && V.showing !== 'loading' && V.showing !== 'empty') { renderEmpty('empty'); renderSituation(null); }
    else if (has && V.showing === 'empty') renderEmpty('ready');
    else markStale();
    syncExampleCard();
    clearTimeout(V.detT);
    V.detT = later(function () { if (alive()) { syncDetect(); saveState(); } }, 260);
  }
  function onKey(e) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); translate({ reason: 'button' }); }
  }
  function setSource(t) {
    V.ta.value = t;
    onInput();
    clearTimeout(V.detT); syncDetect(); saveState();
  }
  function pasteText() {
    var fail = function () {
      App.toast('Bufer əlçatan deyil', 'info', { sub: MOD + ' + V ilə yapışdırın' });
      try { V.ta.focus(); } catch (e) { /* ignore */ }
    };
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        navigator.clipboard.readText().then(function (t) {
          if (!alive()) return;
          t = String(t || '');
          if (!t.trim()) { App.toast('Bufer boşdur', 'info', { sub: 'Əvvəlcə mətni kopyalayın' }); return; }
          setSource(t.slice(0, 5000));
          var lbl = V.det ? V.det.label : 'Neytral';
          App.toast('Mətn yapışdırıldı', 'ok', { sub: num(wordsOf(t).length) + ' söz · üslub: ' + lbl });
          nz('read', 'Oxudum! Üslub: ' + lbl + '. Tərcümə edək?');
          restartClass(V.go, 'translate-pulse', 2100);
        }, fail);
        return;
      }
    } catch (e) { /* fall through */ }
    fail();
  }
  function clearSource() {
    var prev = V.ta.value; if (!prev) return;
    setSource('');
    try { V.ta.focus(); } catch (e) { /* ignore */ }
    nz('idle');
    App.toast('Mətn silindi', 'info', {
      action: { label: 'Geri qaytar', onClick: function () {
        if (!alive()) return;
        setSource(prev);
        if (R && norm(R.src) === norm(prev)) renderResult(R, {});
      } }
    });
  }
  function loadExample() {
    S.reg = 'auto'; syncSeg();
    S.from = 'en'; S.to = 'az'; syncLangs();
    setSource(EX.src);
    translate({ reason: 'example' });
  }

  /* ------------------------------------------------------------------
     11. TRANSLATE
     ------------------------------------------------------------------ */
  function translate(o) {
    o = o || {};
    if (!V.ta) return;
    var text = V.ta.value.trim();
    if (!text) {
      restartClass(V.srcCard, 'translate-shake', 500);
      try { V.ta.focus(); } catch (e) { /* ignore */ }
      App.toast('Əvvəlcə mətn yazın', 'info', { sub: 'və ya «Nümunələr»dən birini seçin' });
      nz('point', 'Mətni bura yazın — qalanını mən edərəm.');
      return;
    }
    if (busy && o.reason === 'button') return;
    var dl = text.length >= 8 ? detectLang(text) : null;
    if (dl && dl !== S.from) fixLang(dl, true);
    var token = ++reqId;
    busy = true;
    busyBtn(V.go, true);
    var regReq = S.reg === 'auto' ? null : S.reg;
    var det = detectReg(text);
    var regEff = regReq || det.id;
    var from = S.from, to = S.to;
    renderLoading(regEff);
    nz('write', 'Yazıram… ' + REG_LABEL[regEff] + ' ' + regWord(regEff, 'loc') + '.');
    var q = QMAP[S.quality] || QMAP.exact;
    var t0 = Date.now();
    var inp = { text: text, register: regReq, from: from, to: to, pair: from + '-' + to };
    if (S.quality === 'fast') inp.speed = 'fast';
    trAI(inp, q.ms == null ? undefined : q.ms, o.reason === 'button' || o.reason === 'retry').then(function (res) {
      if (token !== reqId) return;
      busy = false;
      if (!alive()) return;
      busyBtn(V.go, false);
      if (res && res.ok === false) {
        renderEmpty('error');
        /* In live mode App.fakeAI has already shown this error as a toast. */
        if (!(App.isLive && App.isLive())) App.toast('Tərcümə alınmadı', 'err', { sub: 'Bağlantını yoxlayın və yenidən cəhd edin.' });
        nz('sad', 'Alınmadı… bir də cəhd edək?');
        return;
      }
      var r = buildResult(text, res, regReq, from, to);
      r.ms = Date.now() - t0; r.quality = S.quality; r.at = Date.now();
      R = r; saveLast(); pushHistory(r);
      renderResult(r, { reveal: true });
      reactTo(r);
      if (!wide()) later(function () { if (alive()) scrollToEl(V.out, true); }, 60);
      if (S.quality === 'meclis' && !o.noMeclis) later(function () { if (R === r && alive()) deepReview(); }, 1200);
    }, function () {
      if (token !== reqId) return;
      busy = false;
      if (!alive()) return;
      busyBtn(V.go, false);
      renderEmpty('error');
    });
  }
  function reactTo(r) {
    var c = confStats(r.segs);
    var pre = r.auto ? 'Üslubu ' + REG_LABEL[r.reg] + ' kimi tanıdım. ' : '';
    if (r.warn) nz('worried', 'Hüquqi üslub bu mesaj üçün ağırdır — Rəsmi kifayət edər.');
    else if (c.low) nz('point', pre + 'Bir yerdə əmin deyiləm — dalğalı xəttə toxunun.');
    else if (c.mid) nz('point', pre + 'Sarı nöqtəli yerə bir də baxın.');
    else nz('success', pre + 'Hazırdır — hər hissədə əminəm.');
  }

  /* ------------------------------------------------------------------
     12. RESULT CARD — loading / empty / result
     ------------------------------------------------------------------ */
  function dropMini() {
    if (V.outMini) { try { V.outMini.destroy(); } catch (e) { /* ignore */ } V.outMini = null; }
  }
  function clearLoad() { if (V.loadIv) { clearInterval(V.loadIv); V.loadIv = null; } }
  function setActs(on) {
    if (!V.acts) return;
    Object.keys(V.acts).forEach(function (k) { V.acts[k].disabled = !on; });
  }
  function renderLoading(reg) {
    V.showing = 'loading';
    clearLoad(); closeNote(); dropMini();
    V.out.classList.remove('is-stale');
    setActs(false);
    var body = V.outBody;
    body.textContent = '';
    body.setAttribute('aria-busy', 'true');
    V.outEyebrow.textContent = 'Tərcümə · ' + LANG_NAME[S.to];
    V.outBadges.textContent = '';
    V.outBadges.appendChild(h('span', { class: 'badge', text: REG_LABEL[reg] }));
    var names = S.quality === 'fast' ? ['Üslub', 'Tərcümə'] :
      S.quality === 'meclis' ? ['Üslub tanınır', 'Lüğət və yaddaş', 'Qaralama', 'Məclisə hazırlıq'] :
        ['Üslub tanınır', 'Lüğət və yaddaş', 'Cümlələr yazılır', 'Əminlik ölçülür'];
    var steps = names.map(function (s) { return h('span', { class: 'translate-step' }, h('span', { class: 'translate-step-ic', html: App.icon('check') }), s); });
    var art = h('div', { class: 'translate-load-art', 'aria-hidden': 'true' });
    body.appendChild(h('div', { class: 'translate-load', role: 'status' },
      art,
      h('p', { class: 'translate-load-cap' }, h('span', { class: 'spinner', 'aria-hidden': 'true' }), h('span', { text: 'Tərcümə edilir · ' + REG_LABEL[reg] + ' ' + regWord(reg) })),
      h('div', { class: 'sk-stack' },
        h('span', { class: 'skeleton text', style: 'width:96%' }),
        h('span', { class: 'skeleton text', style: 'width:88%' }),
        h('span', { class: 'skeleton text', style: 'width:61%' })),
      h('div', { class: 'translate-steps' }, steps)));
    V.outMini = mountMini(art, 'write');
    var k = 0;
    steps[0].classList.add('on');
    V.loadIv = every(function () {
      if (k >= steps.length - 1) return;
      steps[k].classList.remove('on'); steps[k].classList.add('done');
      k++; steps[k].classList.add('on');
    }, S.quality === 'fast' ? 240 : 420);
  }
  function kbdEl(t) { return h('kbd', { class: 'kbd', text: t }); }
  function renderEmpty(kind) {
    clearLoad(); closeNote(); dropMini();
    V.showing = kind === 'ready' ? 'ready' : kind === 'error' ? 'error' : 'empty';
    V.out.classList.remove('is-stale');
    setActs(false);
    var body = V.outBody;
    body.textContent = '';
    body.removeAttribute('aria-busy');
    V.outEyebrow.textContent = 'Tərcümə · ' + LANG_NAME[S.to];
    V.outBadges.textContent = '';
    var art = h('div', { class: 'translate-load-art', 'aria-hidden': 'true' });
    var box;
    if (kind === 'ready') {
      box = h('div', { class: 'translate-note' }, art,
        h('h3', { text: 'Tərcüməyə hazırdır' }),
        h('p', null, '«Tərcümə et» düyməsinə basın', finePointer() ? [' və ya ', kbdEl(MOD), '+', kbdEl('Enter')] : null, '. Üslub avtomatik tanınacaq.'));
    } else if (kind === 'error') {
      box = h('div', { class: 'translate-note err', role: 'alert' }, art,
        h('h3', { text: 'Tərcümə alınmadı' }),
        h('p', { text: 'Bağlantını yoxlayın və yenidən cəhd edin. Mətniniz yerindədir.' }),
        h('div', { class: 'actions' }, h('button', { class: 'btn btn-sm btn-secondary', type: 'button', onclick: function () { translate({ reason: 'retry' }); } }, ie('refresh'), 'Yenidən cəhd et')));
    } else {
      box = h('div', { class: 'translate-note' }, art,
        h('h3', { text: 'Tərcümə burada görünəcək' }),
        h('p', { text: 'Mətni yazın və ya yapışdırın. Əminliyi aşağı olan yerlər nöqtəli və ya dalğalı xətlə işarələnəcək.' }),
        h('div', { class: 'actions' },
          h('button', { class: 'btn btn-sm btn-secondary', type: 'button', onclick: loadExample }, 'Nümunəni yüklə'),
          h('button', { class: 'btn btn-sm btn-ghost', type: 'button', onclick: openSamples }, 'Başqa nümunələr')));
    }
    body.appendChild(box);
    V.outMini = mountMini(art, kind === 'ready' ? 'point' : kind === 'error' ? 'sad' : 'idle');
    syncExampleCard();
  }
  function renderResult(r, o) {
    o = o || {};
    V.showing = 'result';
    clearLoad(); closeNote(); dropMini();
    V.out.classList.remove('is-stale');
    var body = V.outBody;
    body.textContent = '';
    body.removeAttribute('aria-busy');

    V.outEyebrow.textContent = 'Tərcümə · ' + LANG_NAME[r.to];
    V.outBadges.textContent = '';
    V.outBadges.appendChild(h('span', { class: 'badge', text: (REG_LABEL[r.reg] || 'Neytral') + (r.auto ? ' · avtomatik' : '') }));
    if (r.variant && VAR_META[r.variant]) V.outBadges.appendChild(h('span', { class: 'badge', text: VAR_META[r.variant].label + ' variant' }));
    if (r.reviewed) V.outBadges.appendChild(h('span', { class: 'badge green', text: 'Məclis yoxladı' }));

    if (r.warn) {
      body.appendChild(h('div', { class: 'callout red', role: 'note' }, ie('alert'),
        h('div', null, r.warn + ' ', h('button', { class: 'link', type: 'button', onclick: function () { setRegister('resmi', true); } }, 'Rəsmiyə keç'))));
    }

    var tx = h('div', { class: 'translate-text' + (o.reveal && !reduced() ? ' reveal' : ''), lang: r.to });
    r.segs.forEach(function (sg, i) {
      var t = String(sg.t == null ? '' : sg.t);
      if (!t.trim()) { tx.appendChild(D.createTextNode(t)); return; }
      var m = /^(\s*)([\s\S]*?)(\s*)$/.exec(t);
      if (m[1]) tx.appendChild(D.createTextNode(m[1]));
      tx.appendChild(h('span', {
        class: 'translate-s conf-' + sg.c + (sg.fixed ? ' is-fixed' : ''), role: 'button', tabindex: '0',
        'aria-haspopup': 'dialog', 'aria-expanded': 'false', 'aria-label': m[2] + ' — ' + (sg.fixed ? 'düzəldildi' : CONF_LABEL[sg.c].toLocaleLowerCase('az')),
        'data-i': String(i), style: '--i:' + i
      }, m[2]));
      if (m[3]) tx.appendChild(D.createTextNode(m[3]));
    });
    tx.addEventListener('click', onTextClick);
    tx.addEventListener('keydown', onTextKey);
    V.text = tx;
    body.appendChild(tx);
    body.appendChild(metaRow(r));
    var alts = altBlock(r); if (alts) body.appendChild(alts);
    var anns = annBlock(r); if (anns) body.appendChild(anns);
    var terms = termBlock(r); if (terms) body.appendChild(terms);
    if (r.reviewed && r.review) body.appendChild(reviewPanel(r));

    setActs(true);
    renderSituation(r);
    syncExampleCard();
    markStale();
  }

  function metaRow(r) {
    var st = confStats(r.segs);
    var legend = h('div', { class: 'conf-legend translate-legend' },
      h('span', { class: 'conf-mid', text: 'Yoxlayın' }),
      h('span', { class: 'conf-low', text: 'Şübhəli' }),
      st.fixed ? h('span', { class: 'translate-leg-fix', text: 'Düzəldildi' }) : null);
    var parts = [num(st.words) + ' söz', 'əminlik ' + st.pct + '%'];
    if (r.tm) parts.push('yaddaş ' + r.tm + '%');
    if (r.ms) parts.push(secs(r.ms));
    return h('div', { class: 'translate-meta' }, legend, h('span', { class: 'translate-stats', text: parts.join(' · ') }));
  }
  /* alternatives: segments that carry another wording — a compact list with «Tətbiq et» */
  function altBlock(r) {
    var rows = [];
    r.segs.forEach(function (sg, i) {
      if (!sg.alt || sg.fixed) return;
      rows.push(h('div', { class: 'translate-alt' },
        h('span', { class: 'cur', text: String(sg.t).trim() }), h('span', { class: 'arr', 'aria-hidden': 'true', text: '→' }),
        h('span', { class: 'alt', lang: r.to, text: String(sg.alt).trim() }),
        h('button', { class: 'btn btn-sm btn-ghost', type: 'button', onclick: function () { applyAlt(i); } }, 'Tətbiq et')));
    });
    if (!rows.length) return null;
    return h('div', { class: 'translate-block' },
      h('h3', null, h('span', { text: 'Alternativlər' }), h('button', { class: 'link', type: 'button', onclick: openVariants }, 'Bütöv variantlar')),
      h('div', { class: 'translate-alts' }, rows));
  }
  /* translator notes: quiet annotations, one per marked span (technique, doubt, fix) */
  function annBlock(r) {
    var rows = [];
    r.segs.forEach(function (sg, i) {
      var t = String(sg.t == null ? '' : sg.t).trim();
      if (!t || !sg.note) return;
      if (sg.c === 'high' && !sg.fixed && !r.example) return;
      rows.push(h('button', { class: 'translate-ann ' + (sg.fixed ? 'fixed' : sg.c), type: 'button', onclick: function () {
        var sp = V.text && V.text.querySelector('.translate-s[data-i="' + i + '"]');
        if (sp) openNote(sp, i, false);
      } }, h('i', { 'aria-hidden': 'true' }), h('b', { lang: r.to, text: short(t, 60) }), h('small', { text: sg.note })));
    });
    if (!rows.length) return null;
    return h('div', { class: 'translate-block' }, h('h3', { text: 'Qeydlər · ' + rows.length }), h('div', { class: 'translate-anns' }, rows.slice(0, 8)));
  }
  /* terminology kept in this translation: a small table */
  function termBlock(r) {
    var terms = r.terms || [];
    if (!terms.length) return null;
    return h('div', { class: 'translate-block' }, h('h3', { text: 'Terminlər' }),
      h('table', { class: 'translate-tt' },
        h('thead', null, h('tr', null, h('th', { text: 'Mənbə · ' + (CODE[r.from] || '') }), h('th', { text: 'Tərcümə · ' + (CODE[r.to] || '') }), h('th', { text: 'Status' }))),
        h('tbody', null, terms.map(function (t) {
          return h('tr', null, h('td', { lang: r.from, text: t.a }), h('td', { lang: r.to, text: t.b }),
            h('td', null, h('span', { class: 'st' + (t.fresh ? ' new' : ''), text: t.fresh ? 'Yeni əlavə olundu' : 'Lüğətə uyğun' })));
        }))));
  }
  function markStale() {
    if (V.showing !== 'result' || !R || !V.out) return;
    var stale = norm(V.ta.value) !== norm(R.src);
    if (stale === V.out.classList.contains('is-stale')) return;
    V.out.classList.toggle('is-stale', stale);
    var old = V.outBody.querySelector('.translate-stale');
    if (old) old.parentNode.removeChild(old);
    if (stale) {
      closeNote();
      V.outBody.insertBefore(h('div', { class: 'callout translate-stale', role: 'status' }, ie('refresh'),
        h('div', null, h('b', { text: 'Mənbə dəyişdi. ' }), 'Tərcüməni yeniləmək üçün ',
          h('button', { class: 'link', type: 'button', onclick: function () { translate({ reason: 'stale' }); } }, 'yenidən tərcümə edin'), '.')), V.outBody.firstChild);
    }
  }

  function syncExampleCard() {
    if (!V.exCard) return;
    var on = !!exFwd(V.ta.value);
    V.exCard.hidden = !on;
    if (!on) return;
    V.exRows.forEach(function (b) {
      var p = !!(R && R.example && V.showing === 'result' && R.reg === b.getAttribute('data-reg'));
      b.setAttribute('aria-pressed', String(p));
    });
  }

  function renderSituation(r) {
    var b = V.sitBody; if (!b) return;
    b.textContent = '';
    var s = r && r.situation;
    if (!s) {
      b.appendChild(h('p', { class: 'empty-tx', text: 'Tərcümədən sonra sahə, məqsəd, oxucu və ton avtomatik doldurulacaq.' }));
      return;
    }
    function kv(k, v) { return [h('dt', { text: k }), h('dd', { text: v || '—' })]; }
    b.appendChild(h('dl', null,
      kv('Sahə', s.domain), kv('Məqsəd', s.purpose), kv('Oxucu', s.audience),
      kv('Üslub', (REG_LABEL[r.reg] || s.register) + (r.auto ? ' · avtomatik' : '')), kv('Ton', s.tone)));
  }
  /* ------------------------------------------------------------------
     13. CONFIDENCE NOTE POPOVER
     ------------------------------------------------------------------ */
  function onTextClick(e) {
    var sp = e.target && e.target.closest ? e.target.closest('.translate-s') : null;
    if (!sp) return;
    openNote(sp, +sp.getAttribute('data-i'), false);
  }
  function onTextKey(e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var sp = e.target && e.target.closest ? e.target.closest('.translate-s') : null;
    if (!sp) return;
    e.preventDefault();
    openNote(sp, +sp.getAttribute('data-i'), true);
  }
  function openNote(el, i, kb) {
    if (!R || !R.segs[i]) return;
    if (pop && pop.anchor === el) { closeNote(kb); return; }
    closeNote();
    var sg = R.segs[i];
    var lab = sg.fixed ? 'Düzəldildi' : CONF_LABEL[sg.c];
    var closeB = h('button', { class: 'icon-btn sm ghost', type: 'button', 'aria-label': 'Bağla', html: App.icon('x'), onclick: function () { closeNote(true); } });
    var acts = [];
    if (sg.alt && !sg.fixed) acts.push(h('button', { class: 'btn btn-sm btn-secondary', type: 'button', onclick: function () { applyAlt(i); } }, ie('wand'), '«' + sg.alt.trim() + '» qoy'));
    if (sg.c !== 'high' && !sg.fixed) acts.push(h('button', { class: 'btn btn-sm', type: 'button', onclick: function () { acceptSeg(i); } }, ie('check'), 'Qəbul et'));
    if (sg.src && sg.src.length <= 48 && R.from !== 'az') {
      acts.push(h('button', { class: 'btn btn-sm btn-ghost', type: 'button', onclick: function () { var a = sg.src, b = String(sg.t).trim(); closeNote(); openGlossary({ a: a, b: b }); } }, ie('book'), 'Lüğətə'));
    }
    var p = h('div', { class: 'translate-pop ' + (sg.fixed ? 'high' : sg.c), role: 'dialog', 'aria-label': 'Qeyd: ' + lab, tabindex: '-1' },
      h('div', { class: 'translate-pop-h' }, h('i', { 'aria-hidden': 'true' }), h('span', { text: lab }), closeB),
      h('p', { text: sg.note || defaultNote(sg) }),
      sg.src ? h('p', { class: 'translate-pop-src' }, 'Mənbə: ', h('span', { lang: R.from, text: '«' + short(sg.src, 120) + '»' })) : null,
      acts.length ? h('div', { class: 'translate-pop-f' }, acts) : null);
    D.body.appendChild(p);
    pop = { el: p, anchor: el, i: i };
    el.setAttribute('aria-expanded', 'true');
    placePop();
    D.addEventListener('pointerdown', popOutside, true);
    D.addEventListener('keydown', popKey, true);
    W.addEventListener('scroll', placePop, true);
    W.addEventListener('resize', placePop);
    if (kb) setTimeout(function () { try { (p.querySelector('.translate-pop-f button') || closeB).focus({ preventScroll: true }); } catch (e) { /* ignore */ } }, 30);
    if (sg.c === 'low' && !sg.fixed) nz('think', null, 1600);
  }
  function placePop() {
    if (!pop) return;
    var p = pop.el, a = pop.anchor;
    if (!a.isConnected) { closeNote(); return; }
    var rects = a.getClientRects(), r = rects.length ? rects[0] : a.getBoundingClientRect();
    var vw = D.documentElement.clientWidth || W.innerWidth, vh = W.innerHeight;
    if (r.bottom < 0 || r.top > vh) { closeNote(); return; }
    var pw = p.offsetWidth, ph = p.offsetHeight;
    var cx = r.left + r.width / 2;
    var left = clamp(cx - pw / 2, 12, Math.max(12, vw - pw - 12));
    var top = r.bottom + 10, above = false;
    if (top + ph > vh - 12 && r.top - 10 - ph > 12) { top = r.top - 10 - ph; above = true; }
    p.style.left = Math.round(left) + 'px';
    p.style.top = Math.round(top) + 'px';
    p.style.setProperty('--ax', Math.round(clamp(cx - left, 18, pw - 18)) + 'px');
    p.classList.toggle('above', above);
  }
  function popOutside(e) {
    if (!pop) return;
    if (pop.el.contains(e.target) || pop.anchor.contains(e.target)) return;
    closeNote();
  }
  function popKey(e) {
    if (!pop || e.key !== 'Escape') return;
    e.stopPropagation();
    closeNote(true);
  }
  function closeNote(refocus) {
    if (!pop) return;
    var p = pop; pop = null;
    D.removeEventListener('pointerdown', popOutside, true);
    D.removeEventListener('keydown', popKey, true);
    W.removeEventListener('scroll', placePop, true);
    W.removeEventListener('resize', placePop);
    if (p.anchor) p.anchor.setAttribute('aria-expanded', 'false');
    if (p.el.parentNode) p.el.parentNode.removeChild(p.el);
    if (refocus && p.anchor && p.anchor.isConnected) { try { p.anchor.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }
  }
  function applyAlt(i) {
    var sg = R && R.segs[i]; if (!sg || !sg.alt) return;
    var old = String(sg.t).trim();
    sg.t = sg.alt; sg.c = 'high'; sg.fixed = true;
    sg.note = 'Variant qoyuldu: «' + old + '» → «' + String(sg.alt).trim() + '». ' + (sg.note || '');
    delete sg.alt;
    R.pristine = false;
    saveLast(); updateHistoryOut(R);
    closeNote();
    renderResult(R, {});
    App.toast('Variant qoyuldu', 'ok', { sub: '«' + old + '» → «' + String(sg.t).trim() + '»' });
    nz('success', 'Düzəliş tətbiq olundu.');
  }
  function acceptSeg(i) {
    var sg = R && R.segs[i]; if (!sg) return;
    sg.c = 'high'; sg.accepted = true;
    sg.note = 'Siz təsdiqlədiniz. ' + (sg.note || '');
    R.pristine = false;
    saveLast();
    closeNote();
    renderResult(R, {});
    App.toast('Qeyd bağlandı', 'ok', { sub: '«' + short(String(sg.t).trim(), 40) + '» təsdiqləndi' });
    nz('success', null, 1400);
  }

  /* ------------------------------------------------------------------
     14. ACTIONS — copy, variants, style, deep review, glossary
     ------------------------------------------------------------------ */
  function legacyCopy(t) {
    var ok = false;
    var ta = h('textarea', { readonly: 'readonly', style: 'position:fixed;top:-1000px;left:0;opacity:0', 'aria-hidden': 'true' });
    ta.value = t;
    D.body.appendChild(ta);
    try { ta.select(); ok = D.execCommand('copy'); } catch (e) { ok = false; }
    D.body.removeChild(ta);
    return ok;
  }
  function copyText(t, label, btn) {
    var done = function (ok) {
      if (!ok) { App.toast('Kopyalamaq alınmadı', 'warn', { sub: 'Mətni seçib ' + MOD + ' + C basın' }); return; }
      App.toast(label || 'Kopyalandı', 'ok', { sub: short(t, 64), icon: 'copy' });
      nz('success', 'Kopyalandı.');
      if (btn && btn.isConnected) {
        if (!btn._orig) btn._orig = btn.innerHTML;
        btn.innerHTML = App.icon('check') + 'Kopyalandı';
        btn.classList.add('is-done');
        clearTimeout(btn._t);
        btn._t = setTimeout(function () { if (btn._orig) { btn.innerHTML = btn._orig; btn._orig = null; } btn.classList.remove('is-done'); }, 1500);
      }
    };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(t).then(function () { done(true); }, function () { done(legacyCopy(t)); });
        return;
      }
    } catch (e) { /* fall through */ }
    done(legacyCopy(t));
  }
  function copyResult(btn) { if (R) copyText(textOf(R).trim(), 'Tərcümə kopyalandı', btn); }

  /* 3 variants */
  function getVariants(r) {
    if (r.example && EX.reg[r.reg]) {
      var vv = EX.reg[r.reg].variants;
      return Promise.resolve([
        { key: 'herfi', t: vv.herfi, near: 96, nat: 48 },
        { key: 'tebii', t: vv.tebii, near: 74, nat: 95 },
        { key: 'pesekar', t: vv.pesekar, near: 90, nat: 91, rec: true }
      ]);
    }
    var base = { text: r.src, from: r.from, to: r.to };
    if (isLive()) {
      /* Live: two real variants of the same register — a close one and a free one — next to the current
         translation. No closeness / naturalness percentages: nothing measures them. */
      return Promise.all([
        trAI(ext({ register: r.reg, style: 'literal' }, base)),
        trAI(ext({ register: r.reg, style: 'natural' }, base))
      ]).then(function (a) {
        var out = [], failed = 0;
        [['herfi', a[0]], ['tebii', a[1]]].forEach(function (x) {
          var t = x[1] && x[1].ok !== false ? String(x[1].text || '').trim() : '';
          if (t) out.push({ key: x[0], t: t }); else failed++;
        });
        out.push({ key: 'pesekar', t: textOf(r).trim(), rec: true });
        out.failed = failed;
        return out;
      });
    }
    return Promise.all([
      App.fakeAI('translate', ext({ register: r.reg === 'neytral' ? 'resmi' : 'neytral' }, base), 600),
      App.fakeAI('translate', ext({ register: 'danisiq' }, base), 800)
    ]).then(function (a) {
      return [
        { key: 'herfi', t: (a[0] && a[0].text) || textOf(r), near: 92, nat: 63 },
        { key: 'tebii', t: (a[1] && a[1].text) || textOf(r), near: 71, nat: 93 },
        { key: 'pesekar', t: textOf(r).trim(), near: 89, nat: 88, rec: true }
      ];
    });
  }
  function bar(label, val, cls) {
    return h('div', { class: 'translate-bar' },
      h('span', { text: label }), h('b', { text: val + '%' }),
      h('div', { class: 'progress thin ' + cls, role: 'img', 'aria-label': label + ': ' + val + '%' }, h('i', { style: 'width:' + val + '%' })));
  }
  function varSkeleton(k) {
    return h('article', { class: 'translate-var' },
      h('span', { class: 'eyebrow', text: VAR_META[k].label }),
      h('div', { class: 'sk-stack' }, h('span', { class: 'skeleton text' }), h('span', { class: 'skeleton text', style: 'width:84%' }), h('span', { class: 'skeleton text', style: 'width:58%' })),
      h('span', { class: 'skeleton text', style: 'width:100%;height:8px' }),
      h('span', { class: 'skeleton text', style: 'width:100%;height:8px' }));
  }
  function openVariants() {
    if (!R) return;
    closeNote();
    var r = R;
    var grid = h('div', { class: 'translate-vars' }, ['herfi', 'tebii', 'pesekar'].map(varSkeleton));
    var s = App.sheet({
      title: '3 variant', wide: true,
      body: h('div', { class: 'stack' },
        h('p', { class: 'muted small', text: 'Eyni məna — üç yanaşma. Mənbəyə yaxınlıq ilə təbiilik arasında balansı oxucuya görə seçin.' }),
        h('div', { class: 'translate-var-src' }, h('span', { class: 'eyebrow plain', text: 'Mənbə · ' + LANG_NAME[r.from] }), h('span', { lang: r.from, text: short(r.src, 220) })),
        grid),
      actions: [{ label: 'Bağla', kind: 'ghost' }]
    });
    nz('think', 'Üç yol var — hansı oxucuya uyğundur?', 2400);
    getVariants(r).then(function (vs) {
      if (!grid.isConnected) return;
      grid.textContent = '';
      var cur = norm(textOf(r));
      vs.forEach(function (v) {
        var M = VAR_META[v.key], isCur = norm(v.t) === cur;
        grid.appendChild(h('article', { class: 'translate-var' + (v.rec ? ' rec' : '') + (isCur ? ' cur' : '') },
          h('div', { class: 'row between' }, h('span', { class: 'eyebrow', text: M.label }),
            h('span', { class: 'row', style: 'gap:4px' },
              v.rec ? h('span', { class: 'badge', text: 'Tövsiyə' }) : null,
              isCur ? h('span', { class: 'badge', text: 'Hazırkı' }) : null)),
          h('p', { class: 'translate-var-t', lang: r.to, text: v.t }),
          v.near != null ? bar('Mənbəyə yaxınlıq', v.near, 'navy') : null,
          v.nat != null ? bar('Təbiilik', v.nat, '') : null,
          h('p', { class: 'translate-var-n', text: M.note }),
          h('div', { class: 'row' },
            h('button', { class: 'btn btn-sm btn-secondary', type: 'button', disabled: isCur, onclick: function () { chooseVariant(r, v); s.close(); } }, isCur ? 'Seçilib' : 'Bunu seç'),
            h('button', { class: 'icon-btn sm ghost', type: 'button', 'aria-label': M.label + ' variantı kopyala', title: 'Kopyala', html: App.icon('copy'), onclick: function () { copyText(v.t, M.label + ' variant kopyalandı'); } }))));
      });
      if (vs.failed) {
        grid.appendChild(h('div', { class: 'callout', role: 'note' }, ie('alert'),
          h('div', { text: (vs.failed > 1 ? 'Hərfi və təbii variantlar' : 'Bir variant') + ' hazırlanmadı — bir az sonra «3 variant»ı yenidən açın.' })));
        nz('sad', null, 1600);
      }
    });
  }
  function chooseVariant(r, v) {
    if (R !== r || !alive()) return;
    var M = VAR_META[v.key];
    r.segs = [{ t: v.t, c: 'high', note: '«' + M.label + '» variant seçildi. ' + M.note, src: short(r.src, 120) }];
    r.variant = v.key; r.pristine = false; r.reviewed = false; r.review = null; r.prevSegs = null;
    saveLast(); updateHistoryOut(r);
    renderResult(r, { reveal: true });
    App.toast('«' + M.label + '» variant seçildi', 'ok', { sub: short(v.t, 64) });
    nz('success', v.key === 'pesekar' ? 'Yaxşı seçim — təhvilə hazırdır.' : 'Oldu! Lazım olsa, yenə dəyişərik.');
  }

  /* style / audience */
  function openStyle() {
    closeNote();
    var text = V.ta ? V.ta.value.trim() : '';
    var cur = R && V.showing === 'result' ? R.reg : (S.reg === 'auto' ? (V.det ? V.det.id : 'neytral') : S.reg);
    var s = null, previews = {};
    function pick(id) {
      if (s) s.close();
      setTimeout(function () {
        if (!alive()) return;
        setRegister(id, false);
        if (text) translate({ reason: 'style' });
        if (!wide()) scrollToEl(V.out, true);
      }, 140);
    }
    var autoRow = h('button', { class: 'choice', type: 'button', 'aria-pressed': String(S.reg === 'auto'), onclick: function () { pick('auto'); } },
      h('span', { class: 'translate-style-tx' }, h('b', { text: 'Avtomatik' }), h('small', { text: 'Mətnə görə seçilsin' + (V.det ? ' · indi: ' + V.det.label : '') })));
    var list = h('div', { class: 'translate-styles' }, AUD.map(function (a) {
      var pv = h('span', { class: 'translate-style-pv', lang: S.to }, h('span', { class: 'skeleton text', style: 'width:94%' }), h('span', { class: 'skeleton text', style: 'width:66%' }));
      previews[a.id] = pv;
      return h('button', { class: 'choice', type: 'button', 'aria-pressed': String(S.reg !== 'auto' && cur === a.id), onclick: function () { pick(a.id); } },
        h('span', { class: 'translate-style-tx' }, h('b', { text: REG_LABEL[a.id] + (S.reg === 'auto' && cur === a.id ? ' · indi' : '') }), h('small', { text: a.aud }), pv));
    }));
    s = App.sheet({
      title: 'Üslubu dəyiş',
      body: h('div', { class: 'stack' },
        h('p', { class: 'muted small', text: 'Kim oxuyacaq? Üslubu oxucuya görə seçin — tərcümə həmin üslubda yenidən yazılacaq.' }),
        autoRow, list)
    });
    nz('think', 'Kim oxuyacaq — həmkar, yoxsa müştəri?', 2400);
    AUD.forEach(function (a) {
      var p;
      if (!text) p = Promise.resolve(REG_EXPLAIN[a.id]);
      else if (!isLive() && exFwd(text) && S.to === 'az') p = Promise.resolve('«' + joinSegs(EX.reg[a.id].segs) + '»');
      else p = trAI({ text: text, register: a.id, from: S.from, to: S.to }, 300 + Math.round(Math.random() * 500)).then(function (res) { return res && res.ok !== false && res.text ? '«' + short(res.text, 120) + '»' : REG_EXPLAIN[a.id]; });
      p.then(function (t) { var pv = previews[a.id]; if (!pv || !pv.isConnected) return; pv.textContent = t; });
    });
  }

  /* deep review — Mirzə Məclisi */
  function exReview(reg) {
    var E = EX.reg[reg];
    return { score: E.score, text: E.verdict, seal: E.seal, fixes: clone(E.fixes), fixedSegs: clone(E.fixedSegs) };
  }
  function applyFixes(segs, fixes) {
    var out = clone(segs);
    fixes.forEach(function (f) {
      if (!f.was || !f.now || f.was === '—' || f.was === '…' || f.was.indexOf('«ə»') >= 0) return;
      for (var i = 0; i < out.length; i++) {
        var t = String(out[i].t), k = t.indexOf(f.was);
        if (k < 0) continue;
        var parts = [];
        if (k > 0) parts.push(ext(clone(out[i]), { t: t.slice(0, k) }));
        parts.push({ t: f.now, c: 'high', fixed: true, src: out[i].src, note: ELD[elderIdx(f.type)].name + ' düzəltdi: «' + f.was + '» → «' + f.now + '». ' + (f.why || '') });
        if (k + f.was.length < t.length) parts.push(ext(clone(out[i]), { t: t.slice(k + f.was.length) }));
        out.splice.apply(out, [i, 1].concat(parts));
        break;
      }
    });
    return out;
  }
  function deepBusy(on) { if (V.acts) busyBtn(V.acts.deep, on); }
  function deepReview() {
    if (!R || reviewing) return;
    if (V.showing !== 'result') { App.toast('Əvvəlcə tərcümə edin', 'info'); return; }
    var r = R;
    reviewing = true; deepBusy(true); closeNote();
    nz('read', 'Mirzələrə göstərirəm — bir az səbr.');
    var tgt = textOf(r).trim();
    var p = r.example && r.pristine && EX.reg[r.reg] ?
      Promise.resolve(exReview(r.reg)) :
      App.fakeAI('check', { src: r.src, tgt: tgt, from: r.from, to: r.to, register: r.reg, domain: r.situation && r.situation.domain }, 500).then(function (c) {
        if (c && c.ok === false) throw c; /* live engine failed — fakeAI already showed the toast */
        c = c || {};
        return {
          score: c.score != null ? c.score : 92, text: c.summary || 'Məclis işini bitirdi.', seal: (c.verdict && c.verdict.seal) || null,
          fixes: (c.errors || []).map(function (e) { return { was: e.was, now: e.now, type: e.type, why: e.why, severity: e.severity, elder: e.elder }; })
        };
      });
    p.then(function (rv) {
      if (R !== r) return null;
      return App.bigJob('Tərcümənin dərin yoxlanışı', { score: rv.score, text: rv.text, seal: rv.seal, errors: rv.fixes }).then(function () { return rv; });
    }).then(function (rv) {
      reviewing = false; deepBusy(false);
      if (!rv || R !== r || !alive()) return;
      r.prevSegs = clone(r.segs); r.prevPristine = r.pristine;
      r.segs = rv.fixedSegs ? clone(rv.fixedSegs) : applyFixes(r.segs, rv.fixes);
      r.review = { score: rv.score, text: rv.text, seal: rv.seal || sealOf(rv.score), fixes: rv.fixes };
      r.reviewed = true; r.pristine = false;
      saveLast(); updateHistoryOut(r);
      renderResult(r, {});
      setTimeout(function () {
        if (!alive()) return;
        var pnl = V.outBody.querySelector('.translate-review');
        if (pnl) { burstAt(pnl.querySelector('.ring') || pnl, 'diamonds'); if (!wide()) scrollToEl(pnl, true); }
        if (App.mode && App.mode() === 'academy') {
          try {
            var rr = (pnl || V.out).getBoundingClientRect();
            if (App.fx && App.fx.xp) App.fx.xp(rr.left + rr.width / 2, rr.top + 20, '+15 XP');
            var pf = App.profile(); App.setProfile({ xp: (Number(pf.xp) || 0) + 15 });
          } catch (e) { /* ignore */ }
        }
      }, 320);
    }, function () { reviewing = false; deepBusy(false); nz('idle'); });
  }
  function undoReview() {
    if (!R || !R.prevSegs) return;
    R.segs = R.prevSegs; R.prevSegs = null; R.reviewed = false; R.review = null;
    R.pristine = !!R.prevPristine;
    saveLast(); updateHistoryOut(R);
    renderResult(R, {});
    App.toast('Düzəlişlər geri qaytarıldı', 'info', { sub: 'Mətn Məclisdən əvvəlki halındadır' });
    nz('idle');
  }
  /* an elder's face from the Məclis art (App.elderFace → Meclis.portrait); initials only if that art is missing */
  function elderFace(i) {
    var el = null;
    try { if (App.elderFace) el = App.elderFace(ELD[i].name, 'translate-elder'); } catch (e) { el = null; }
    if (el) return el;
    var svg = null;
    try { if (W.Meclis && typeof W.Meclis.portrait === 'function') svg = W.Meclis.portrait(i); } catch (e) { svg = null; }
    if (svg) return h('span', { class: 'translate-elder', html: svg, 'aria-hidden': 'true' });
    return h('span', { class: 'avatar sm ' + ELD[i].av, 'aria-hidden': 'true', text: ELD[i].short });
  }
  /* severity: from the check engine (high/mid/low, critical/major/minor) or from the error type */
  var SEV_OF = { critical: 'high', high: 'high', major: 'mid', mid: 'mid', minor: 'low', low: 'low' };
  var SEV_LABEL = { high: 'Kritik', mid: 'Əsas', low: 'Kiçik' };
  var SEV_BY_TYPE = { 'Məna': 'mid', 'Termin': 'mid', 'Terminologiya': 'mid', 'Rəqəm': 'high', 'Buraxılma': 'high', 'Ad': 'mid', 'Tarix': 'mid' };
  function sevOf(f) { return SEV_OF[f.severity] || SEV_BY_TYPE[f.type] || 'low'; }
  function reviewPanel(r) {
    var rv = r.review;
    var sc = rv.score;
    var head = h('div', { class: 'translate-review-h' },
      h('span', { class: 'eyebrow', text: 'Mirzə Məclisinin rəyi' }),
      h('span', { class: 'translate-score' }, String(sc), h('small', { text: ' / 100' })),
      h('span', { class: 'translate-seal ' + (sc >= 85 ? 'ok' : sc >= 70 ? 'mid' : 'bad'), text: rv.seal }));
    var fixes = rv.fixes || [];
    var list = fixes.length ?
      h('div', { class: 'translate-fixes', role: 'list' }, fixes.map(function (f, i) {
        var ei = elderIdx(f.type), sv = sevOf(f);
        var who = f.elder || ELD[ei].name;
        return h('div', { class: 'translate-fix', role: 'listitem', style: '--i:' + i },
          h('span', { class: 'translate-sev ' + sv, text: SEV_LABEL[sv] }),
          h('div', { class: 'translate-fix-b' },
            h('div', { class: 'translate-wn' }, h('span', { class: 'translate-was', text: f.was || '—' }), ie('arrow'), h('span', { class: 'translate-now', text: f.now || '—' })),
            f.why ? h('p', { text: f.why }) : null,
            h('span', { class: 'translate-fix-type', text: f.type || 'Qeyd' })),
          h('span', { class: 'translate-who' }, h('span', { class: 'translate-mono', 'aria-hidden': 'true', text: String(who).charAt(0) }), who));
      })) :
      h('p', { class: 'translate-review-t' }, h('b', { text: 'Düzəliş lazım olmadı. ' }), 'Terminlər, məna, üslub, yazılış, rəqəm və adlar yoxlanıldı.');
    var checks = h('div', { class: 'translate-checks', 'aria-label': 'Yoxlamalar' }, ELD.map(function (e, i) {
      var n = fixes.filter(function (f) { return elderIdx(f.type) === i; }).length;
      return h('span', { class: n ? '' : 'ok', title: e.name }, e.check, n ? [' · ', h('b', { text: String(n) })] : null);
    }));
    var foot = h('div', { class: 'row' },
      fixes.length && r.prevSegs ? h('button', { class: 'btn btn-sm btn-ghost', type: 'button', onclick: undoReview }, 'Düzəlişləri geri qaytar') : null,
      h('button', { class: 'btn btn-sm btn-secondary', type: 'button', onclick: function () { copyText(textOf(R).trim(), 'Yekun mətn kopyalandı', null); } }, ie('copy'), 'Yekun mətni kopyala'));
    return h('div', { class: 'translate-review' },
      head,
      h('p', { class: 'translate-review-t', text: rv.text }),
      list, checks, foot);
  }
  /* glossary */
  function glossSuggestions() {
    var out = [];
    if (R && R.example) {
      if (R.from === 'en') out.push({ a: 'ASAP', b: R.reg === 'danisiq' ? 'mümkün qədər tez' : R.reg === 'neytral' ? 'mümkün qədər tez' : 'ən qısa müddətdə', d: 'İşgüzar yazışma', note: 'Rəsmi mətndə abreviatura saxlanmır' });
      out.push({ a: EX.termByLang[R.from] || 'contract', b: 'müqavilə', d: 'Hüquq' });
    } else if (R && R.terms) {
      R.terms.forEach(function (t) { out.push({ a: t.a, b: t.b, d: R.situation && GLOSS_DOMAINS.indexOf(R.situation.domain) >= 0 ? R.situation.domain : 'Ümumi' }); });
    }
    var mine = sget('glossary-user', []);
    if (!Array.isArray(mine)) mine = [];
    return out.filter(function (g) { return !mine.some(function (m) { return m && lower(m.a) === lower(g.a) && lower(m.b) === lower(g.b); }); }).slice(0, 4);
  }
  function selectionInResult() {
    try {
      var sel = W.getSelection();
      if (!sel || sel.isCollapsed || !V.text || !V.text.contains(sel.anchorNode)) return null;
      var t = String(sel).trim();
      if (!t || t.length > 80) return null;
      var pe = sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement;
      var sp = pe && pe.closest ? pe.closest('.translate-s') : null;
      var sg = sp && R ? R.segs[+sp.getAttribute('data-i')] : null;
      return { t: t, src: sg && sg.src && sg.src.length <= 48 ? sg.src : '' };
    } catch (e) { return null; }
  }
  function openGlossary(pre) {
    closeNote();
    pre = pre || {};
    var sugg = glossSuggestions();
    var picked = selectionInResult();
    var first = sugg[0] || null;
    var a0 = pre.a != null ? pre.a : (picked ? picked.src : (first ? first.a : ''));
    var b0 = pre.b != null ? pre.b : (picked ? picked.t : (first ? first.b : ''));
    var fromL = R ? R.from : S.from, toL = R ? R.to : S.to;
    var ia = h('input', { class: 'input', id: 'tg-a', autocomplete: 'off', spellcheck: 'false', lang: fromL, placeholder: 'məs. ASAP', value: a0 });
    var ib = h('input', { class: 'input', id: 'tg-b', autocomplete: 'off', lang: toL, placeholder: 'məs. ən qısa müddətdə', value: b0 });
    var dm = h('select', { class: 'select', id: 'tg-d' }, GLOSS_DOMAINS.map(function (d) { return h('option', { value: d, text: d }); }));
    var d0 = pre.d || (first && !pre.a ? first.d : null) || (R && R.situation && R.situation.domain) || 'Ümumi';
    dm.value = GLOSS_DOMAINS.indexOf(d0) >= 0 ? d0 : 'Ümumi';
    var nt = h('input', { class: 'input', id: 'tg-n', autocomplete: 'off', placeholder: 'məs. Rəsmi mətndə abreviatura saxlanmır', value: pre.note || (first && !pre.a && !picked ? first.note || '' : '') });
    var errA = h('span', { class: 'err', hidden: true }, ie('alert'), 'Mənbə terminini yazın');
    var errB = h('span', { class: 'err', hidden: true }, ie('alert'), 'Tərcüməni yazın');
    function field(id, label, ctl, err, opt) {
      return h('div', { class: 'field' }, h('label', { for: id }, label, opt ? h('span', { class: 'opt', text: opt }) : null), ctl, err || null);
    }
    var chips = sugg.length ? h('div', { class: 'stack-sm' },
      h('div', { class: 'translate-lab' }, h('span', { text: 'Təklif' }), h('small', { text: 'toxunun — sahələr dolacaq' })),
      h('div', { class: 'chips' }, sugg.map(function (g) {
        return h('button', { class: 'chip', type: 'button', onclick: function () { ia.value = g.a; ib.value = g.b; if (g.d && GLOSS_DOMAINS.indexOf(g.d) >= 0) dm.value = g.d; nt.value = g.note || ''; validate(true); try { ib.focus(); } catch (e) { /* ignore */ } } }, g.a + ' → ' + g.b);
      }))) : null;
    var mine = sget('glossary-user', []);
    var count = Array.isArray(mine) ? mine.length : 0;
    function validate(quiet) {
      var okA = !!ia.value.trim(), okB = !!ib.value.trim();
      if (!quiet || okA) { errA.hidden = okA; ia.setAttribute('aria-invalid', String(!okA)); }
      if (!quiet || okB) { errB.hidden = okB; ib.setAttribute('aria-invalid', String(!okB)); }
      return okA && okB;
    }
    ia.addEventListener('input', function () { validate(true); });
    ib.addEventListener('input', function () { validate(true); });
    var body = h('div', { class: 'stack' },
      h('p', { class: 'muted small', text: 'Lüğətdəki termini bütün tərcümə və layihələrdə qoruyuram — Lüğətçi Mirzə hər dəfə yoxlayacaq.' }),
      chips,
      h('div', { class: 'grid-2' }, field('tg-a', 'Mənbə termin · ' + CODE[fromL], ia, errA), field('tg-b', 'Tərcümə · ' + CODE[toL], ib, errB)),
      h('div', { class: 'grid-2' }, field('tg-d', 'Sahə', dm), field('tg-n', 'Qeyd', nt, null, 'istəyə bağlı')),
      count ? h('p', { class: 'small muted', text: 'Sizin lüğətdə artıq ' + count + ' yeni termin var.' }) : null);
    App.sheet({
      title: 'Lüğətə əlavə et', body: body,
      actions: [
        { label: 'Ləğv et', kind: 'ghost' },
        { label: 'Əlavə et', kind: 'primary', icon: 'plus', onClick: function () { return saveTerm(); } }
      ]
    });
    function saveTerm() {
      if (!validate(false)) { try { (ia.value.trim() ? ib : ia).focus(); } catch (e) { /* ignore */ } return false; }
      var a = ia.value.trim(), b = ib.value.trim();
      var list = sget('glossary-user', []);
      if (!Array.isArray(list)) list = [];
      var idx = -1;
      list.forEach(function (x, i) { if (idx < 0 && x && lower(x.a) === lower(a) && x.from === fromL && x.to === toL) idx = i; });
      var item = { a: a, b: b, d: dm.value, note: nt.value.trim(), from: fromL, to: toL, at: Date.now() };
      if (idx >= 0) list[idx] = item; else list.unshift(item);
      sset('glossary-user', list.slice(0, 500));
      App.toast(idx >= 0 ? 'Termin yeniləndi' : 'Lüğətə əlavə olundu', 'ok', { sub: a + ' → ' + b + ' · bütün layihələrdə qorunacaq', icon: 'book' });
      nz('success', 'Yadda saxladım: «' + short(a, 24) + '» hər yerdə «' + short(b, 28) + '» olacaq.');
      if (R && alive() && V.showing === 'result') {
        R.terms = (R.terms || []).filter(function (t) { return lower(t.a) !== lower(a); });
        R.terms.unshift({ a: a, b: b, fresh: true });
        renderResult(R, {});
        R.terms.forEach(function (t) { delete t.fresh; });
        saveLast();
      }
      return true;
    }
  }

  /* samples + document */
  function openSamples() {
    closeNote();
    var s = null;
    var list = h('div', { class: 'list' }, SAMPLES.map(function (it) {
      var txt = it.get();
      if (!txt) return null;
      var l = detectLang(txt) || 'en';
      return h('button', { class: 'list-row translate-sample', type: 'button', onclick: function () { if (s) s.close(); setTimeout(function () { loadSample(txt); }, 120); } },
        h('span', { class: 'tx' }, h('b', { text: it.t }), h('small', { class: 'truncate', text: it.s })),
        h('span', { class: 'end' }, h('span', { class: 'badge', text: CODE[l] + ' → ' + (l === 'az' ? 'EN' : 'AZ') }), App.icon ? frag(App.icon('chevron')) : null));
    }));
    s = App.sheet({ title: 'Nümunələr', body: h('div', { class: 'stack' }, h('p', { class: 'muted small', text: 'Real layihələrdən götürülmüş parçalar. Seçin — dil və üslubu özüm tanıyacağam.' }), list) });
  }
  function loadSample(txt) {
    if (!alive()) return;
    S.reg = 'auto'; syncSeg();
    setSource(String(txt).slice(0, 5000));
    var dl = detectLang(txt);
    if (dl) fixLang(dl, false);
    translate({ reason: 'sample' });
    scrollToEl(V.srcCard, true);
  }
  function docUpload() {
    if (hasScreen('projects')) {
      App.toast('Bütöv sənəd layihə kimi açılır', 'info', { sub: 'DOCX, PDF, XLIFF — Layihələr bölməsində yükləyin', icon: 'upload', action: { label: 'Keç', onClick: function () { App.go('projects'); } } });
    } else {
      App.toast('Sənəd tərcüməsi hazırlanır', 'info', { sub: 'Hələlik mətni bura yapışdırın', icon: 'upload' });
    }
    nz('point', 'Böyük sənədlərdə Mirzə Məclisi bütün seqmentləri yoxlayır.', 2600);
  }

  /* ------------------------------------------------------------------
     15. HISTORY
     ------------------------------------------------------------------ */
  function histList() { var l = sget('translate-history', []); return Array.isArray(l) ? l : []; }
  function pushHistory(r) {
    var list = histList();
    var item = { src: r.src, out: textOf(r).trim(), reg: r.reg, from: r.from, to: r.to, at: Date.now() };
    list = list.filter(function (x) { return !(x && norm(x.src) === norm(item.src) && x.to === item.to); });
    list.unshift(item);
    sset('translate-history', list.slice(0, 8));
    renderHistory();
  }
  function updateHistoryOut(r) {
    var list = histList(), ch = false;
    list.forEach(function (x) { if (!ch && x && norm(x.src) === norm(r.src) && x.to === r.to) { x.out = textOf(r).trim(); x.reg = r.reg; ch = true; } });
    if (ch) { sset('translate-history', list); renderHistory(); }
  }
  function renderHistory() {
    if (!V.hist) return;
    /* only the user's own translations — the section stays hidden until there is one */
    var items = histList().filter(function (x) { return x && x.src; }).slice(0, 4);
    if (V.histCard) V.histCard.hidden = !items.length;
    if (V.lower) V.lower.className = 'translate-lower' + (items.length ? ' two' : '');
    V.hist.textContent = '';
    items.forEach(function (it) {
      if (!it || !it.src) return;
      V.hist.appendChild(h('button', { class: 'translate-hrow', type: 'button', onclick: function () { loadHistory(it); } },
        h('span', { class: 'pair', text: (CODE[it.from] || '?') + '→' + (CODE[it.to] || '?') }),
        h('span', { class: 'tx' }, h('b', { class: 'truncate', lang: it.from, text: it.src }), h('small', { class: 'truncate', lang: it.to, text: it.out })),
        h('span', { class: 'meta', text: (REG_LABEL[it.reg] || '') + ' · ' + rel(it.at) })));
    });
    V.histClear.hidden = !items.length;
  }
  function loadHistory(it) {
    if (LANG_NAME[it.from] && LANG_NAME[it.to] && it.from !== it.to) { S.from = it.from; S.to = it.to; syncLangs(); }
    if (REG_LABEL[it.reg] && it.reg !== 'auto') { S.reg = it.reg; syncSeg(); }
    setSource(String(it.src).slice(0, 5000));
    translate({ reason: 'history' });
    scrollToEl(V.srcCard, true);
  }
  function clearHistory() {
    App.confirm({ title: 'Tarixçə silinsin?', text: 'Son tərcümələr siyahısı təmizlənəcək. Lüğət və tərcümə yaddaşı toxunulmaz qalır.', okLabel: 'Təmizlə', danger: true }).then(function (ok) {
      if (!ok) return;
      sset('translate-history', []);
      if (alive()) renderHistory();
      App.toast('Tarixçə təmizləndi', 'ok');
    });
  }

  function scrollToEl(el, onlyIfHidden) {
    if (!el || !el.getBoundingClientRect || !el.isConnected) return;
    var r = el.getBoundingClientRect(), off = 84;
    if (onlyIfHidden && r.top >= off && r.top < W.innerHeight * 0.62) return;
    var y = Math.max(0, r.top + (W.pageYOffset || 0) - off);
    try { W.scrollTo({ top: y, behavior: reduced() ? 'auto' : 'smooth' }); } catch (e) { W.scrollTo(0, y); }
  }

  /* ------------------------------------------------------------------
     16. REGISTER
     ------------------------------------------------------------------ */
  App.register('translate', {
    title: 'Tərcümə',
    icon: 'translate',
    group: 'Peşəkar',
    mode: 'both',
    render: function (el, params) {
      cleanup();
      closeNote();
      App.css('translate', CSS);
      init();
      params = params || {};
      V = { showing: null };
      busy = false; reviewing = false;

      /* incoming params: {text, register, pair} */
      var autoGo = false;
      if (typeof params.pair === 'string' && /^[a-z]{2}-[a-z]{2}$/.test(params.pair)) {
        var pp = params.pair.split('-');
        if (LANG_NAME[pp[0]] && LANG_NAME[pp[1]] && pp[0] !== pp[1] && (pp[0] === 'az' || pp[1] === 'az')) { S.from = pp[0]; S.to = pp[1]; }
      }
      if (params.register && REG_LABEL[params.register]) S.reg = params.register;
      if (typeof params.text === 'string' && params.text.trim()) { S.src = params.text.slice(0, 5000); R = null; autoGo = true; }
      saveState();

      var page = h('div', { class: 'page translate-page' });
      V.page = page;
      page.appendChild(header());
      page.appendChild(h('section', { class: 'translate-work', 'aria-label': 'Tərcümə' }, ctrlCard(), h('div', { class: 'translate-panes' }, srcPane(), outPane())));
      page.appendChild(exampleCard());
      page.appendChild(lowerGrid());
      el.appendChild(page);

      syncLangs();
      updateCount();
      syncDetect();
      renderQHint();
      renderHistory();

      var text = S.src || '';
      var m = text.trim() && !autoGo ? exMatch(text, S.from, S.to) : null;
      if (!autoGo && R && norm(R.src) === norm(text) && text.trim()) renderResult(R, { reveal: false });
      else if (m && m.dir === 'fwd') {
        R = exResult(text.trim(), m, S.reg === 'auto' ? null : S.reg, S.from, S.to);
        R.ms = 0; R.quality = S.quality;
        saveLast();
        renderResult(R, { reveal: true });
      } else if (text.trim()) renderEmpty('ready');
      else { renderEmpty('empty'); renderSituation(null); }
      syncExampleCard();

      if (autoGo) later(function () { if (alive()) translate({ reason: 'param' }); }, 380);
      else if (!helloDone && R && R.example) {
        helloDone = true;
        later(function () {
          if (alive() && R && R.example && V.showing === 'result') nz('point', 'Bu nümunədə üslubu Danışıq kimi tanıdım. «Rəsmi»ni seçin — fərqi görün.');
        }, 5200);
      }
    },
    leave: function () {
      reqId++;
      busy = false; reviewing = false;
      closeNote(); clearLoad(); dropMini();
      cleanup();
      V = {};
    }
  });
})();
