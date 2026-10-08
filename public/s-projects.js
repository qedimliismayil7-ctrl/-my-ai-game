/* =====================================================================
   NUANZA — s-projects.js
   Peşəkar rejim ekranları:
     • 'projects' — layihə kartları / cədvəl, axtarış, filtrlər, «Yeni layihə» vərəqi
                    (fayl yükləmə, situasiya, tələblər, məxfilik qeydi).
     • 'editor'   — seqment redaktoru: AI ilkin tərcümə (Mirzə Məclisi), situasiya kartı,
                    lüğət çipləri, status və etibarlılıq, TM uyğunluğu, canlı yoxlama və
                    tez düzəlişlər, Nuanzanın sualı, klaviatura qısayolları.
     • 'qa'       — keyfiyyət yoxlaması: bal halqası, kateqoriyalar, qeydlər, türk formaları,
                    termin ardıcıllığı, müştəri tələbləri, təhvil faylları, Dərin QA.
   Plain browser JS. Uses App.* (app.js) and app.css components. Screen CSS: projects-/editor-/qa-.
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
  var MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avqust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'];
  var IS_MAC = /Mac|iPhone|iPad|iPod/.test((navigator.platform || '') + ' ' + (navigator.userAgent || ''));
  var MOD = IS_MAC ? '⌘' : 'Ctrl';
  var HOUR = 3600000, DAY = 86400000;

  function ie(name) {
    if (typeof App.iconEl === 'function') return App.iconEl(name);
    var t = D.createElement('template'); t.innerHTML = App.icon(name); return t.content.firstChild;
  }
  function icTile(name, cls) { return h('span', { class: 'ic' + (cls ? ' ' + cls : ''), html: App.icon(name), 'aria-hidden': 'true' }); }
  function badge(text, cls, ic) { return h('span', { class: 'badge' + (cls ? ' ' + cls : '') }, ic ? ie(ic) : null, text); }
  function num(n, dec) { return App.fmt && App.fmt.num ? App.fmt.num(n, dec) : String(n); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function lower(s) { s = String(s == null ? '' : s); try { return s.toLocaleLowerCase('az'); } catch (e) { return s.toLowerCase(); } }
  function upper(s) { s = String(s == null ? '' : s); try { return s.toLocaleUpperCase('az'); } catch (e) { return s.toUpperCase(); } }
  function cap(s) { s = String(s || ''); return s ? upper(s.charAt(0)) + s.slice(1) : s; }
  function lcFirst(s) { s = String(s || ''); return s ? lower(s.charAt(0)) + s.slice(1) : s; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function hm(d) { return pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  function reEsc(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function sget(k, fb) { try { var v = App.store.get(k, fb); return v === undefined || v === null ? fb : v; } catch (e) { return fb; } }
  function sset(k, v) { try { App.store.set(k, v); } catch (e) { /* storage blocked */ } }
  function getMap(k) { var m = sget(k, {}); return m && typeof m === 'object' && !Array.isArray(m) ? m : {}; }
  function setMap(k, id, v) { var m = getMap(k); if (v === undefined) delete m[id]; else m[id] = v; sset(k, m); }
  function reduced() { try { return App.reducedMotion ? App.reducedMotion() : false; } catch (e) { return false; } }
  function chatty() { try { var c = App.companionConfig ? App.companionConfig() : null; return !c || c.chatty !== false; } catch (e) { return true; } }
  function nz(state, text, ms) {
    var c = App.companion; if (!c || typeof c.set !== 'function') return;
    try { c.set(state, text && chatty() ? { say: text, ms: ms || 3000 } : { ms: ms || 1600 }); } catch (e) { /* ignore */ }
  }
  function toast(text, kind, o) { try { return App.toast(text, kind, o); } catch (e) { return null; } }
  function burstAt(el, kind) { try { if (App.fx && App.fx.burstAt && el && el.isConnected) App.fx.burstAt(el, kind || 'stars'); } catch (e) { /* ignore */ } }
  function xpAt(el, text) {
    try {
      if (!App.fx || !App.fx.xp || !el || !el.isConnected) return;
      var r = el.getBoundingClientRect(); App.fx.xp(r.left + r.width / 2, r.top, text);
    } catch (e) { /* ignore */ }
  }
  function pairLabel(id) { return App.pairLabel ? App.pairLabel(id) : String(id || ''); }
  function sameDay(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
  function dueLabel(d) {
    var now = new Date(), tm = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1), ys = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    if (sameDay(d, now)) return 'Bu gün, ' + hm(d);
    if (sameDay(d, tm)) return 'Sabah, ' + hm(d);
    if (sameDay(d, ys)) return 'Dünən, ' + hm(d);
    return d.getDate() + ' ' + MONTHS[d.getMonth()] + (d.getFullYear() !== now.getFullYear() ? ' ' + d.getFullYear() : '') + ', ' + hm(d);
  }
  function leftLabel(ms) {
    if (ms <= 0) { var lh = Math.round(-ms / HOUR); return lh < 1 ? 'vaxtı çatıb' : lh < 24 ? lh + ' saat gecikir' : Math.round(lh / 24) + ' gün gecikir'; }
    var m = Math.round(ms / 60000);
    if (m < 60) return m + ' dəq qalıb';
    var hr = Math.floor(m / 60), mm = m % 60;
    if (hr < 24) return hr + ' saat' + (mm && hr < 6 ? ' ' + mm + ' dəq' : '') + ' qalıb';
    return Math.round(hr / 24) + ' gün qalıb';
  }
  function sizeLabel(b) {
    b = Number(b) || 0;
    if (b < 1024) return b + ' B';
    if (b < 1048576) return Math.round(b / 1024) + ' KB';
    return num(Math.round(b / 104857.6) / 10, 1) + ' MB';
  }
  function wordsIn(s) { return (String(s || '').match(/[\p{L}\p{N}]+(?:[-'’][\p{L}\p{N}]+)*/gu) || []).length; }
  var TRANSLIT = { 'ə': 'e', 'Ə': 'E', 'ı': 'i', 'I': 'I', 'İ': 'I', 'ö': 'o', 'Ö': 'O', 'ü': 'u', 'Ü': 'U', 'ş': 's', 'Ş': 'S', 'ç': 'c', 'Ç': 'C', 'ğ': 'g', 'Ğ': 'G' };
  function slug(s) {
    return String(s || '').replace(/[əƏıİöÖüÜşŞçÇğĞ]/g, function (c) { return TRANSLIT[c] || c; })
      .replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 60) || 'Nuanza';
  }
  function fmtAz(v, raw) {
    var dec = 0, m = /[.,](\d+)$/.exec(String(raw || ''));
    if (m && !/^\d{1,3}([,  ]\d{3})+$/.test(String(raw))) dec = m[1].length;
    var s = Math.abs(v).toFixed(dec), parts = s.split('.');
    return (v < 0 ? '−' : '') + parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + (parts[1] ? ',' + parts[1] : '');
  }
  function matchCase(was, now) {
    var f = String(was || '').charAt(0);
    return f && f !== lower(f) ? cap(now) : now;
  }
  function wordRe(w, ci) { return new RegExp('(^|[^\\p{L}\\p{N}])(' + reEsc(w) + ')(?![\\p{L}\\p{N}])', ci ? 'iu' : 'u'); }
  function hasWord(text, w, ci) { return wordRe(w, ci).test(text); }
  function replaceWord(text, was, now, ci) { return text.replace(wordRe(was, ci), function (m, pre, hit) { return pre + matchCase(hit, now); }); }

  /* Per-screen scope: timers, listeners, mini companions — all torn down in leave(). */
  function scope() {
    var s = { dead: false, timers: [], ivs: [], offs: [], minis: [], finals: [] };
    s.later = function (fn, ms) { var t = setTimeout(function () { if (!s.dead) fn(); }, ms || 0); s.timers.push(t); return t; };
    s.every = function (fn, ms) { var t = setInterval(function () { if (s.dead) { clearInterval(t); return; } fn(); }, ms); s.ivs.push(t); return t; };
    s.on = function (tg, ev, fn, opt) { tg.addEventListener(ev, fn, opt); s.offs.push(function () { tg.removeEventListener(ev, fn, opt); }); };
    s.mini = function (host, state, width) {
      if (!W.Nuanza || typeof W.Nuanza.mount !== 'function' || !host) return null;
      try {
        var m = W.Nuanza.mount(host, { size: 'mini', width: width || 92, label: 'Nuanza' });
        if (m && state && typeof m.set === 'function') m.set(state, {});
        if (m) s.minis.push(m);
        return m;
      } catch (e) { return null; }
    };
    s.kill = function () {
      if (s.dead) return;
      s.finals.forEach(function (f) { try { f(); } catch (e) { /* ignore */ } });
      s.dead = true;
      s.timers.forEach(clearTimeout); s.ivs.forEach(clearInterval);
      s.offs.forEach(function (f) { try { f(); } catch (e) { /* ignore */ } });
      s.minis.forEach(function (m) { try { if (m && m.destroy) m.destroy(); } catch (e) { /* ignore */ } });
      s.timers = []; s.ivs = []; s.offs = []; s.minis = [];
    };
    return s;
  }
  var SC = { projects: null, editor: null, qa: null };
  function freshScope(id) { if (SC[id]) SC[id].kill(); SC[id] = scope(); return SC[id]; }
  function endScope(id) { if (SC[id]) { SC[id].kill(); SC[id] = null; } }
  function overlayOpen() { return !!D.querySelector('.sheet.on, .dialog.on, .onb, .scrim.top.on'); }

  /* ------------------------------------------------------------------
     2. REFERENCE DATA
     ------------------------------------------------------------------ */
  var REG = { danisiq: 'Danışıq', neytral: 'Neytral', resmi: 'Rəsmi', huquqi: 'Hüquqi' };
  var REG_IDS = ['danisiq', 'neytral', 'resmi', 'huquqi'];
  var FIELDS = ['Hüquq', 'Bank-maliyyə', 'Neft-qaz', 'Tibb', 'İnterfeys və IT', 'Marketinq', 'Turizm', 'Təhsil', 'Ümumi'];
  var SEV_W = { high: 4, mid: 2, low: 1 };
  var SEV_L = { high: ['Kritik', 'red'], mid: ['Orta', 'gold'], low: ['Kiçik', 'navy'] };
  var CONF_L = { high: 'Əmin', mid: 'Yoxlayın', low: 'Şübhəli' };
  var ELDER = {
    'Termin': 'Lüğətçi Mirzə', 'Məna': 'Mənaçı Mirzə', 'Boş seqment': 'Mənaçı Mirzə', 'Üslub': 'Üslubçu Mirzə', 'Ardıcıllıq': 'Üslubçu Mirzə',
    'Türk forması': 'Dilçi Nənə', 'Orfoqrafiya': 'Dilçi Nənə', 'Durğu': 'Dilçi Nənə', 'Rəqəm': 'Möhürdar Mirzə', 'Ad': 'Möhürdar Mirzə', 'Tarix': 'Möhürdar Mirzə'
  };
  var ELDER_AV = { 'Lüğətçi Mirzə': ['L', 'av-lacquer'], 'Mənaçı Mirzə': ['M', 'av-firuze'], 'Üslubçu Mirzə': ['Ü', 'av-nar'], 'Dilçi Nənə': ['D', 'av-benovse'], 'Möhürdar Mirzə': ['M', 'av-zafaran'] };
  var CATS = [
    { key: 'terms', label: 'Terminlər', types: ['Termin'] },
    { key: 'numbers', label: 'Rəqəm və tarix', types: ['Rəqəm', 'Tarix'] },
    { key: 'names', label: 'Adlar', types: ['Ad'] },
    { key: 'turkish', label: 'Türk formaları', types: ['Türk forması', 'Orfoqrafiya'] },
    { key: 'meaning', label: 'Məna', types: ['Məna'] },
    { key: 'punct', label: 'Durğu', types: ['Durğu'] },
    { key: 'style', label: 'Üslub', types: ['Üslub', 'Söz sırası', 'Ardıcıllıq'] },
    { key: 'complete', label: 'Tamlıq', types: ['Boş seqment'] }
  ];
  function catTypes(key) { for (var i = 0; i < CATS.length; i++) if (CATS[i].key === key) return CATS[i].types; return []; }

  /* Turkish forms Dilçi Nənə catches (longest first) */
  var TURK = [
    ['bilginiz için', 'məlumatınız üçün'], ['gerekli olan', 'lazım olan'], ['gün içinde', 'gün ərzində'], ['ile ilgili', 'ilə bağlı'],
    ['tarafından', 'tərəfindən'], ['sürdürülebilirlik', 'davamlı inkişaf'], ['için', 'üçün'], ['değil', 'deyil'], ['gerekli', 'lazımi'],
    ['şirket', 'şirkət'], ['sözleşme', 'müqavilə'], ['ödeme', 'ödəniş'], ['hakkında', 'haqqında'], ['olarak', 'olaraq'],
    ['şekilde', 'şəkildə'], ['yetkili', 'səlahiyyətli'], ['kadar', 'qədər'], ['göre', 'görə']
  ];

  /* Project glossaries (a: source term, hl: source highlight stem, b: approved target, stem: target match, bad: [wrong form, right form]) */
  var GL = {
    'legal-en': [
      { a: 'Employer', b: 'Sifarişçi', stem: 'sifarişçi', note: 'Bu müqavilədə «İşəgötürən» deyil', bad: [['İşəgötürənin', 'Sifarişçinin'], ['İşəgötürəni', 'Sifarişçini'], ['İşəgötürənə', 'Sifarişçiyə'], ['İşəgötürəndən', 'Sifarişçidən'], ['İşəgötürən', 'Sifarişçi']] },
      { a: 'Contractor', b: 'İcraçı', stem: 'icraçı', note: 'Xidmət müqaviləsi: ümumi lüğətdəki «Podratçı» yox', bad: [['Podratçının', 'İcraçının'], ['Podratçını', 'İcraçını'], ['Podratçıya', 'İcraçıya'], ['Podratçı', 'İcraçı']] },
      { a: 'Agreement', b: 'Müqavilə', stem: 'müqavilə', note: 'Müəyyən edilmiş termin — böyük hərflə' },
      { a: 'Services', b: 'Xidmətlər', stem: 'xidmət', ex: 'Freight Services' },
      { a: 'terminate', hl: 'terminat', b: 'xitam vermək', stem: 'xitam' },
      { a: 'Force Majeure', b: 'fors-major', stem: 'fors-major' },
      { a: 'Confidential Information', b: 'Məxfi məlumat', stem: 'məxfi məlumat' },
      { a: 'third party', b: 'üçüncü şəxs', stem: 'üçüncü şəxs', bad: [['üçüncü tərəfə', 'üçüncü şəxsə'], ['üçüncü tərəfin', 'üçüncü şəxsin'], ['üçüncü tərəf', 'üçüncü şəxs']] },
      { a: 'invoice', b: 'hesab-faktura', stem: 'hesab-faktura' },
      { a: 'customs clearance', b: 'gömrük rəsmiləşdirilməsi', stem: 'gömrük rəsmiləşdiril' }
    ],
    'legal-ru': [
      { a: 'Заёмщик', b: 'Borcalan', stem: 'borcalan', bad: [['Borc alanın', 'Borcalanın'], ['Borc alana', 'Borcalana'], ['Borc alan', 'Borcalan']] },
      { a: 'Банк', b: 'Bank', stem: 'bank' },
      { a: 'Кредитный договор', hl: 'Кредитн', b: 'Kredit müqaviləsi', stem: 'kredit müqavilə' },
      { a: 'Дополнительное соглашение', hl: 'Дополнительн', b: 'Əlavə saziş', stem: 'əlavə saziş' },
      { a: 'неустойка', hl: 'неустойк', b: 'dəbbə pulu', stem: 'dəbbə pulu', note: 'Mülki Məcəllə: «cərimə» yox', bad: [['cərimə', 'dəbbə pulu']] },
      { a: 'процентная ставка', hl: 'процентн', b: 'faiz dərəcəsi', stem: 'faiz dərəcə' }
    ],
    'report-en': [
      { a: 'crude oil', b: 'xam neft', stem: 'xam neft' },
      { a: 'net profit', b: 'xalis mənfəət', stem: 'xalis mənfəət', bad: [['Təmiz mənfəət', 'Xalis mənfəət'], ['təmiz mənfəət', 'xalis mənfəət']] },
      { a: 'capital expenditure', b: 'əsaslı xərclər', stem: 'əsaslı xərc', bad: [['kapital xərcləri', 'əsaslı xərclər']] },
      { a: 'upstream', b: 'hasilat', stem: 'hasilat' },
      { a: 'Southern Gas Corridor', b: 'Cənub Qaz Dəhlizi', stem: 'cənub qaz dəhlizi' },
      { a: 'Sustainability Report', b: 'Davamlı inkişaf hesabatı', stem: 'davamlı inkişaf hesabat' }
    ],
    'guide-en': [
      { a: 'student ID card', b: 'tələbə vəsiqəsi', stem: 'tələbə vəsiqə', bad: [['Tələbə kartınız', 'Tələbə vəsiqəniz'], ['tələbə kartı', 'tələbə vəsiqəsi']] },
      { a: 'Student Services', b: 'Tələbə xidmətləri', stem: 'tələbə xidmət' },
      { a: 'Course registration', b: 'kurslara qeydiyyat', stem: 'qeydiyyat' },
      { a: 'final exam', b: 'yekun imtahan', stem: 'yekun imtahan' },
      { a: 'student portal', b: 'tələbə portalı', stem: 'tələbə portal' }
    ],
    'nda-en': [
      { a: 'Confidential Information', b: 'Məxfi məlumat', stem: 'məxfi məlumat' },
      { a: 'Receiving Party', b: 'Qəbul edən Tərəf', stem: 'qəbul edən tərəf' },
      { a: 'Purpose', b: 'Məqsəd', stem: 'məqsəd' },
      { a: 'Agreement', b: 'Saziş', stem: 'saziş', note: 'NDA-da «Saziş»' },
      { a: 'termination', hl: 'terminat', b: 'xitam', stem: 'xitam' }
    ],
    'supply-en': [
      { a: 'Supplier', b: 'Təchizatçı', stem: 'təchizatçı' },
      { a: 'Buyer', b: 'Alıcı', stem: 'alıcı' },
      { a: 'Goods', b: 'Mallar', stem: 'mal' },
      { a: 'Specification', b: 'Spesifikasiya', stem: 'spesifikasiya' },
      { a: 'Contract', b: 'Müqavilə', stem: 'müqavilə' }
    ]
  };

  /* Segment sets. s: source · t: seeded target · ai: AI draft · o: origin (ai|tm|human) · ok: approved ·
     c: base confidence · tm: translation-memory match · alts: [[text, label]] · why: engine note · q: clarifying question */
  var SETS = {
    'legal-en': { src: 'en', title: 'Bölmə 1 · Ümumi müddəalar', names: [], segs: [
      { s: 'SERVICE AGREEMENT No. CL-2026/114', t: 'XİDMƏT MÜQAVİLƏSİ № CL-2026/114', o: 'tm', ok: true, c: 'high',
        tm: { pct: 96, src: 'SERVICE AGREEMENT No. CL-2025/087', tgt: 'XİDMƏT MÜQAVİLƏSİ № CL-2025/087', from: 'Caspian Logistics — Xidmət müqaviləsi (2025)', date: '2025-11-20' },
        why: 'Başlıq tərcümə yaddaşından götürüldü; müqavilənin nömrəsini Möhürdar Mirzə avtomatik yenilədi.',
        alts: [['XİDMƏTLƏRİN GÖSTƏRİLMƏSİ HAQQINDA MÜQAVİLƏ № CL-2026/114', 'Tam rəsmi forma']] },
      { s: 'This Agreement is made in Baku on 3 October 2026 between Caspian Logistics LLC (the "Employer") and Absheron Freight Services LLC (the "Contractor").',
        t: 'Bu Müqavilə 3 oktyabr 2026-cı il tarixində Bakı şəhərində «Caspian Logistics» MMC (bundan sonra — «Sifarişçi») ilə «Absheron Freight Services» MMC (bundan sonra — «İcraçı») arasında bağlanmışdır.',
        o: 'human', ok: true, c: 'high',
        why: 'Azərbaycan müqavilələrində tərəflər «bundan sonra — …» düsturu ilə təqdim olunur. Tarix müştərinin tələbinə görə sözlə yazılıb.',
        alts: [['Bakı şəhəri, 3 oktyabr 2026-cı il. «Caspian Logistics» MMC (bundan sonra — «Sifarişçi») və «Absheron Freight Services» MMC (bundan sonra — «İcraçı») aşağıdakılar barədə bu Müqaviləni bağladılar:', 'Klassik giriş düsturu']] },
      { s: 'This Agreement shall enter into force on the date of its signature.', t: 'Bu Müqavilə imzalandığı tarixdən qüvvəyə minir.', o: 'tm', c: 'high',
        tm: { pct: 87, src: 'This Contract shall enter into force on the date of its signing.', tgt: 'Bu Müqavilə imzalandığı tarixdən qüvvəyə minir.', from: 'AzerGold — Təchizat müqaviləsi', date: '2026-08-14', diff: '«Contract» → «Agreement», «signing» → «signature». Mənaya təsir etmir.' },
        why: '«shall» burada gələcək zaman deyil, hüquqi normadır — Azərbaycan dilində indiki zamanla verilir: «qüvvəyə minir».',
        alts: [['Bu Müqavilə Tərəflər tərəfindən imzalandığı gündən qüvvəyə minir.', 'Dəqiq: kim imzalayır'], ['Müqavilə imzalandığı tarixdən qüvvəyə minir.', 'Qısa']] },
      { s: 'The Contractor shall provide freight forwarding and customs brokerage services (the "Services") in accordance with Annex 1.',
        t: 'İcraçı Əlavə 1-ə uyğun olaraq ekspeditor və gömrük brokeri xidmətləri (bundan sonra — "Xidmətlər") göstərməlidir.', o: 'ai', c: 'high',
        why: '«freight forwarding» — «ekspeditor xidməti», «customs brokerage» — «gömrük brokeri xidməti». «shall» öhdəlik bildirir: «göstərməlidir».',
        alts: [['İcraçı Əlavə 1-də nəzərdə tutulmuş ekspeditor və gömrük brokeri xidmətlərini (bundan sonra — «Xidmətlər») göstərməlidir.', 'Söz sırası: əlavə əvvəldə']] },
      { s: 'The Employer shall provide the Contractor with all documents necessary for customs clearance.',
        t: 'Sifarişçi gömrük rəsmiləşdirilməsi için gerekli olan bütün sənədləri İcraçıya təqdim etməlidir.', o: 'ai', c: 'high',
        why: '«customs clearance» — «gömrük rəsmiləşdirilməsi». AI türk korpusundan iki forma gətirib: «için» və «gerekli». Dilçi Nənə «üçün» və «lazım» təklif edir.',
        alts: [['Sifarişçi gömrük rəsmiləşdirilməsi üçün lazım olan bütün sənədləri İcraçıya təqdim etməlidir.', 'Ədəbi norma'], ['Sifarişçi gömrük rəsmiləşdirilməsi üçün zəruri olan bütün sənədləri İcraçıya təqdim etməlidir.', 'Hüquqi: «zəruri»']] },
      { s: 'The Employer shall pay the Contractor a monthly fee of AZN 18,500 (eighteen thousand five hundred manats), exclusive of VAT.',
        t: 'Sifarişçi İcraçıya ƏDV nəzərə alınmadan aylıq 18 500 (on səkkiz min beş yüz) manat məbləğində haqq ödəməlidir.', o: 'ai', c: 'high',
        why: 'Məbləğ Azərbaycan normasına uyğundur: minliklər boşluqla, valyuta sözlə — «manat». «exclusive of VAT» — «ƏDV nəzərə alınmadan».',
        alts: [['Sifarişçi İcraçıya hər ay ƏDV daxil edilməməklə 18 500 (on səkkiz min beş yüz) manat məbləğində haqq ödəməlidir.', '«ƏDV daxil edilməməklə»']] },
      { s: 'The Contractor shall notify the Employer in writing within 14 days of any delay.',
        t: 'İcraçı hər hansı gecikmə barədə 14 gün ərzində İşəgötürəni yazılı şəkildə xəbərdar etməlidir.', o: 'ai', c: 'high',
        why: '«Employer» bu layihənin lüğətində «Sifarişçi»dir. AI ümumi korpusdan «İşəgötürən» seçib — Lüğətçi Mirzə bunu tutdu.',
        alts: [['İcraçı hər hansı gecikmə barədə 14 gün ərzində Sifarişçini yazılı şəkildə xəbərdar etməlidir.', 'Lüğətə uyğun'], ['İcraçı istənilən gecikmə barədə Sifarişçiyə 14 gün ərzində yazılı bildiriş göndərməlidir.', 'Rəsmi: «bildiriş göndərmək»']] },
      { s: 'If the Employer fails to pay any invoice within thirty (30) days, they shall be entitled to suspend the Services.',
        t: 'Sifarişçi hər hansı hesab-fakturanı otuz (30) gün ərzində ödəmədikdə, onlar Xidmətlərin göstərilməsini dayandırmaq hüququna malikdir.', o: 'ai', c: 'low',
        why: 'İngilis mətnində «they» hər iki tərəfə aid ola bilər. Azərbaycan hüquqi mətnində belə yerdə əvəzlik işlənmir — tərəfin adı açıq yazılır.',
        q: { word: 'they', bad: 'onlar', title: '«They» burada kimdir?', likely: 'İcraçı',
          text: 'Cümlədə iki tərəf var və seçim hüquqi mənanı dəyişir: ödəniş gecikəndə Xidmətləri kim dayandıra bilər?',
          opts: [['Sifarişçi', 'Sifarişçi hər hansı hesab-fakturanı otuz (30) gün ərzində ödəmədikdə, Sifarişçi Xidmətlərin göstərilməsini dayandırmaq hüququna malikdir.'],
                 ['İcraçı', 'Sifarişçi hər hansı hesab-fakturanı otuz (30) gün ərzində ödəmədikdə, İcraçı Xidmətlərin göstərilməsini dayandırmaq hüququna malikdir.']] } },
      { s: 'Either Party may terminate this Agreement by giving the other Party sixty (60) days\' prior written notice.',
        t: 'Tərəflərdən hər biri digər Tərəfə altmış (60) gün əvvəl yazılı bildiriş göndərməklə bu Müqaviləyə xitam verə bilər.', o: 'tm', c: 'high',
        tm: { pct: 92, src: 'Either Party may terminate this Contract by giving the other Party thirty (30) days\' prior written notice.', tgt: 'Tərəflərdən hər biri digər Tərəfə otuz (30) gün əvvəl yazılı bildiriş göndərməklə bu Müqaviləyə xitam verə bilər.', from: 'AzerGold — Təchizat müqaviləsi', date: '2026-08-14', diff: 'Yalnız müddət fərqlidir: Möhürdar Mirzə rəqəmi yenilədi (30 → 60).' },
        why: 'TM uyğunluğu 92%. «terminate» bütün sənəddə «xitam vermək» kimi verilir — ardıcıllıq qorunub.',
        alts: [['Hər bir Tərəf digər Tərəfə altmış (60) gün əvvəl yazılı bildiriş göndərməklə bu Müqaviləyə birtərəfli qaydada xitam verə bilər.', 'Dəqiq: «birtərəfli qaydada»']] },
      { s: 'Neither Party shall be liable for any failure to perform its obligations caused by Force Majeure.',
        t: 'Tərəflərdən heç biri fors-major hallarının səbəb olduğu öhdəliklərin icra edilməməsinə görə məsuliyyət daşımır.', o: 'ai', c: 'high',
        why: '«Neither Party shall be liable» — «Tərəflərdən heç biri məsuliyyət daşımır»: inkar fel ilə verilir.',
        alts: [['Fors-major halları nəticəsində öhdəliklərini yerinə yetirmədiyinə görə Tərəflərdən heç biri məsuliyyət daşımır.', 'Səbəb əvvəldə']] },
      { s: 'The Contractor shall keep all Confidential Information strictly confidential and shall not disclose it to any third party.',
        t: 'İcraçı bütün Məxfi məlumatı ciddi məxfilik şəraitində saxlamalı və onu heç bir üçüncü tərəfə açıqlamamalıdır.', o: 'ai', c: 'high',
        why: '«third party» hüquqi mətndə «üçüncü şəxs»dir; «üçüncü tərəf» danışıq dilinə yaxındır.',
        alts: [['İcraçı bütün Məxfi məlumatın ciddi məxfiliyini təmin etməli və onu heç bir üçüncü şəxsə açıqlamamalıdır.', 'Hüquqi']] },
      { s: 'The list of documents in Annex 2 is not exhaustive.', t: 'Əlavə 2-də göstərilən sənədlərin siyahısı tam değil.', o: 'ai', c: 'high',
        why: '«not exhaustive» — «tam deyil» və ya hüquqi dildə «qapalı deyil». «değil» türk formasıdır.',
        alts: [['Əlavə 2-də göstərilən sənədlərin siyahısı qapalı deyil.', 'Hüquqi termin'], ['Əlavə 2-də göstərilən sənədlərin siyahısı tam deyil.', 'Neytral']] },
      { s: 'The Employer\'s total liability under this Agreement shall not exceed AZN 250,000.',
        t: 'Bu Müqavilə üzrə Sifarişçinin ümumi məsuliyyəti 205 000 manatdan artıq ola bilməz.',
        ai: 'Bu Müqavilə üzrə Sifarişçinin ümumi məsuliyyəti 250 000 manatdan artıq ola bilməz.', o: 'human', c: 'high',
        why: 'Məbləğ əl ilə dəyişdirilib və mənbə ilə üst-üstə düşmür. Möhürdar Mirzə rəqəmləri hər dəfə mənbə ilə tutuşdurur.',
        alts: [['Bu Müqavilə üzrə Sifarişçinin ümumi məsuliyyəti 250 000 (iki yüz əlli min) manatdan artıq ola bilməz.', 'Rəqəm və sözlə']] },
      { s: 'This Agreement shall be governed by the laws of the Republic of Azerbaijan.', t: 'Bu Müqavilə Azərbaycan Respublikasının qanunvericiliyi ilə tənzimlənir.', o: 'tm', ok: true, c: 'high',
        tm: { pct: 100, src: 'This Agreement shall be governed by the laws of the Republic of Azerbaijan.', tgt: 'Bu Müqavilə Azərbaycan Respublikasının qanunvericiliyi ilə tənzimlənir.', from: 'AzerGold — Təchizat müqaviləsi', date: '2026-08-14' },
        why: 'Tərcümə yaddaşından tam uyğunluq. «laws» burada «qanunlar» yox, «qanunvericilik»dir.' },
      { s: 'Any dispute arising out of this Agreement shall be settled by the competent courts of the Republic of Azerbaijan.', t: '',
        ai: 'Bu Müqavilədən irəli gələn istənilən mübahisə Azərbaycan Respublikasının səlahiyyətli məhkəmələrində həll edilir.', c: 'high',
        why: '«competent courts» — «səlahiyyətli məhkəmələr». «arising out of» — «irəli gələn».',
        alts: [['Bu Müqavilə ilə bağlı yaranan bütün mübahisələrə Azərbaycan Respublikasının səlahiyyətli məhkəmələrində baxılır.', '«mübahisələrə baxılır»']] },
      { s: 'This Agreement is executed in two (2) counterparts in English and Azerbaijani, each having equal legal force.', t: '',
        ai: 'Bu Müqavilə ingilis və Azərbaycan dillərində, eyni hüquqi qüvvəyə malik iki (2) nüsxədə tərtib edilmişdir.', c: 'high',
        why: '«counterparts» — «nüsxə». Dillərin adı kiçik hərflə yazılır, «Azərbaycan» isə xüsusi isimdir.' }
    ] },
    'legal-ru': { src: 'ru', title: 'Əlavə saziş · əsas şərtlər', names: [['Gyandja', 'Gəncə'], ['Guseynov', 'Hüseynov'], ['Mamedov', 'Məmmədov']], segs: [
      { s: 'ДОПОЛНИТЕЛЬНОЕ СОГЛАШЕНИЕ № 2 к Кредитному договору № KB-0417/2025', t: 'KB-0417/2025 №-li Kredit müqaviləsinə 2 №-li Əlavə saziş', o: 'tm', ok: true, c: 'high',
        tm: { pct: 95, src: 'ДОПОЛНИТЕЛЬНОЕ СОГЛАШЕНИЕ № 1 к Кредитному договору № KB-0417/2025', tgt: 'KB-0417/2025 №-li Kredit müqaviləsinə 1 №-li Əlavə saziş', from: 'Kapital Bank — Əlavə saziş №1', date: '2026-02-09' },
        why: 'Rus başlığında nömrə əvvəldə gəlir; Azərbaycan dilində «…№-li … müqaviləsinə Əlavə saziş» düsturu işlənir.' },
      { s: 'г. Баку, 6 октября 2026 года', t: 'Bakı şəhəri, 6 oktyabr 2026-cı il', o: 'tm', ok: true, c: 'high', why: 'Tarix sözlə, ay adı kiçik hərflə yazılır.' },
      { s: 'Банк предоставляет Заёмщику кредит в размере 1 250 000,00 (один миллион двести пятьдесят тысяч) манатов.',
        t: 'Bank Borcalana 1 250 000,00 (bir milyon iki yüz əlli min) manat məbləğində kredit verir.', o: 'ai', ok: true, c: 'high',
        why: 'Məbləğ rəqəm və sözlə, mənbədəki kimi verilib. «Заёмщик» — «Borcalan».' },
      { s: 'Процентная ставка по кредиту составляет 14,5% годовых.', t: 'Kredit üzrə faiz dərəcəsi illik 14,5% təşkil edir.', o: 'tm', c: 'high',
        tm: { pct: 94, src: 'Процентная ставка по кредиту составляет 16% годовых.', tgt: 'Kredit üzrə faiz dərəcəsi illik 16% təşkil edir.', from: 'Kapital Bank — Kredit müqaviləsi', date: '2025-12-02', diff: 'Faiz dərəcəsi yeniləndi: 16% → 14,5%.' },
        why: '«годовых» — «illik». Onluq kəsr vergüllə qalır.' },
      { s: 'Заёмщик обязуется погашать кредит ежемесячно не позднее 25-го числа каждого месяца.', t: 'Borcalan krediti hər ay, ayın 25-dən gec olmayaraq ödəməyi öhdəsinə götürür.', o: 'ai', c: 'high',
        why: '«обязуется» — «öhdəsinə götürür»; «не позднее» — «…dən gec olmayaraq».',
        alts: [['Borcalan krediti hər ay ayın 25-i daxil olmaqla ödəməlidir.', 'Sadə, öhdəlik forması']] },
      { s: 'В случае просрочки платежа Заёмщик уплачивает Банку неустойку в размере 0,1% от суммы просроченной задолженности за каждый день просрочки.',
        t: 'Ödəniş gecikdirildikdə Borcalan hər gecikdirilmiş gün için gecikdirilmiş borc məbləğinin 0,1%-i miqdarında Banka cərimə ödəyir.', o: 'ai', c: 'high',
        why: '«неустойка» Mülki Məcəllədə «dəbbə pulu»dur; «cərimə» inzibati sanksiyadır. «için» türk formasıdır.',
        alts: [['Ödəniş gecikdirildikdə Borcalan gecikdirilmiş hər gün üçün gecikdirilmiş borc məbləğinin 0,1%-i miqdarında Banka dəbbə pulu ödəyir.', 'Düzəldilmiş']] },
      { s: 'Настоящее Дополнительное соглашение вступает в силу с момента его подписания Сторонами.', t: '',
        ai: 'Bu Əlavə saziş Tərəflər tərəfindən imzalandığı andan qüvvəyə minir.', c: 'high', why: '«с момента подписания» — «imzalandığı andan».' },
      { s: 'Все остальные условия Кредитного договора остаются неизменными.', t: 'Kredit müqaviləsinin bütün digər şərtləri dəyişməz qalır.', o: 'ai', c: 'high', why: 'Standart yekun müddəa.' },
      { s: 'Подписи Сторон: Банк — ОАО «Капитал Банк»; Заёмщик — ООО «Гянджа Агро».', t: 'Tərəflərin imzaları: Bank — «Kapital Bank» ASC; Borcalan — «Gyandja Aqro» MMC.', o: 'ai', c: 'high',
        why: 'Rus dilindən keçən Azərbaycan toponimləri orijinal yazılışa qaytarılır: «Гянджа» — «Gəncə». ОАО — ASC, ООО — MMC.' }
    ] },
    'report-en': { src: 'en', title: 'Fəsil 3 · Maliyyə göstəriciləri', names: [], segs: [
      { s: 'Chapter 3. Financial and Operational Performance', t: '3-cü fəsil. Maliyyə və əməliyyat göstəriciləri', o: 'tm', ok: true, c: 'high', why: 'Fəsil başlıqları hesabatın əvvəlki illərindən götürüldü.' },
      { s: 'In 2025, crude oil production totalled 29.6 million tonnes, up 1.4% year on year.',
        t: '2025-ci ildə xam neft hasilatı 29,6 milyon ton təşkil edib ki, bu da ötən illə müqayisədə 1,4% çoxdur.', o: 'ai', ok: true, c: 'high', why: 'Onluq kəsrlər vergüllə yazılıb.' },
      { s: 'Net profit increased by 12.4% to AZN 4.1 billion.', t: 'Təmiz mənfəət 12.4% artaraq 4,1 milyard manata çatıb.', o: 'ai', c: 'high',
        why: '«net profit» SOCAR lüğətində «xalis mənfəət»dir. «12.4%» ingilis yazılışıdır — vergüllə olmalıdır.',
        alts: [['Xalis mənfəət 12,4% artaraq 4,1 milyard manata çatıb.', 'Düzəldilmiş'], ['Xalis mənfəət 12,4% artımla 4,1 milyard manat təşkil edib.', 'Rəsmi hesabat dili']] },
      { s: 'Capital expenditure on upstream projects amounted to AZN 2.3 billion.', t: 'Hasilat layihələrinə yönəldilmiş əsaslı xərclər 2,3 milyard manat təşkil edib.', o: 'tm', c: 'high',
        tm: { pct: 89, src: 'Capital expenditure on upstream projects amounted to AZN 1.9 billion.', tgt: 'Hasilat layihələrinə yönəldilmiş əsaslı xərclər 1,9 milyard manat təşkil edib.', from: 'SOCAR — İllik hesabat 2024', date: '2025-05-30', diff: 'Yalnız məbləğ fərqlidir: 1,9 → 2,3.' },
        why: '«upstream» — «hasilat seqmenti»; «capital expenditure» — «əsaslı xərclər».' },
      { s: 'The Company continued to implement its 2035 Low-Carbon Development Strategy.', t: 'Şirkət 2035-ci ilədək Aşağı Karbonlu İnkişaf Strategiyasını həyata keçirməyə davam edib.', o: 'ai', c: 'mid',
        why: 'Strategiyanın rəsmi Azərbaycan adı lüğətdə yoxdur — müştəri ilə dəqiqləşdirin.',
        alts: [['Şirkət «2035-ci ilədək aşağı karbonlu inkişaf strategiyası»nı icra etməyə davam edib.', 'Ad dırnaqda']] },
      { s: 'Methane emissions intensity was reduced to 0.18%, ahead of the 2030 target.', t: '',
        ai: 'Metan emissiyalarının intensivliyi 0,18%-ə endirilib; bu, 2030-cu il üçün qoyulmuş hədəfdən əvvəl əldə olunub.', c: 'high', why: '«ahead of target» — «hədəfdən əvvəl əldə olunub».' },
      { s: 'Gas exports to Europe via the Southern Gas Corridor reached 12.9 bcm.', t: 'Cənub Qaz Dəhlizi ilə Avropaya qaz ixracı 12,9 milyard kubmetrə çatıb.', o: 'ai', c: 'high', why: '«bcm» — «milyard kubmetr».' },
      { s: 'Further details are provided in the Sustainability Report.', t: 'Ətraflı məlumat Sürdürülebilirlik hesabatında verilir.', o: 'ai', c: 'high',
        why: '«Sustainability Report» — «Davamlı inkişaf hesabatı». «Sürdürülebilirlik» türk terminidir.',
        alts: [['Ətraflı məlumat Davamlı inkişaf hesabatında verilir.', 'Lüğətə uyğun']] }
    ] },
    'guide-en': { src: 'en', title: 'Bölmə 1 · Kampusa xoş gəldiniz', names: [], segs: [
      { s: 'Welcome to ADA University!', t: 'ADA Universitetinə xoş gəlmisiniz!', o: 'tm', ok: true, c: 'high', why: 'Keçən ilin bələdçisindən tam uyğunluq.' },
      { s: 'Your student ID card gives you access to the library, sports centre and campus buildings.',
        t: 'Tələbə vəsiqəniz kitabxanaya, idman mərkəzinə və kampus binalarına giriş imkanı verir.', o: 'ai', ok: true, c: 'high', why: '«student ID card» — «tələbə vəsiqəsi».' },
      { s: 'Course registration opens on 1 September and closes on 12 September.', t: 'Kurslara qeydiyyat 1 sentyabrda başlayır və 12 sentyabrda başa çatır.', o: 'ai', ok: true, c: 'high', why: 'Tarixlər Azərbaycan qaydası ilə: gün, ay kiçik hərflə.' },
      { s: 'If you miss more than 20% of classes, you may not be allowed to sit the final exam.', t: 'Dərslərin 20%-dən çoxunu buraxsanız, yekun imtahana buraxılmaya bilərsiniz.', o: 'ai', c: 'mid',
        why: '«buraxmaq» cümlədə iki fərqli mənada işlənib. Məna düzgündür, amma oxucu çaşa bilər — üslubu yoxlayın.',
        alts: [['Dərslərin 20%-dən çoxunda iştirak etməsəniz, yekun imtahana buraxılmaya bilərsiniz.', 'Aydın'], ['Dərslərin 20%-dən çoxunu qaçırsanız, yekun imtahana qəbul edilməyə bilərsiniz.', 'Səmimi']] },
      { s: 'Need help? Contact the Student Services office on the ground floor of Building A.', t: 'Köməyə ehtiyacınız var? A binasının birinci mərtəbəsindəki Tələbə xidmətləri ofisinə müraciət edin.', o: 'tm', c: 'high',
        tm: { pct: 91, src: 'Need help? Contact the Student Services office on the ground floor of Building B.', tgt: 'Köməyə ehtiyacınız var? B binasının birinci mərtəbəsindəki Tələbə xidmətləri ofisinə müraciət edin.', from: 'ADA Universiteti — Tələbə bələdçisi 2025/26', date: '2025-08-21', diff: 'Bina dəyişib: B → A.' },
        why: '«ground floor» Azərbaycanda «birinci mərtəbə»dir.' },
      { s: 'Please keep your password safe and do not share it with anyone.', t: '', ai: 'Şifrənizi etibarlı yerdə saxlayın və heç kimlə paylaşmayın.', c: 'high', why: 'Təlimat üslubu: əmr forması, «siz» müraciəti.' },
      { s: 'Your timetable is available in the student portal for your own information.', t: 'Dərs cədvəliniz bilginiz için tələbə portalında yerləşdirilib.', o: 'ai', c: 'high',
        why: '«bilginiz için» türk ifadəsidir — «məlumatınız üçün».',
        alts: [['Dərs cədvəlinizlə tələbə portalında tanış ola bilərsiniz.', 'Təbii'], ['Dərs cədvəliniz məlumatınız üçün tələbə portalında yerləşdirilib.', 'Hərfi']] }
    ] },
    'nda-en': { src: 'en', title: 'Saziş · əsas müddəalar', names: [], segs: [
      { s: 'MUTUAL NON-DISCLOSURE AGREEMENT', t: 'QARŞILIQLI MƏXFİLİK SAZİŞİ', o: 'tm', ok: true, c: 'high', why: 'NDA Azərbaycan təcrübəsində «Məxfilik sazişi» adlanır.' },
      { s: '"Confidential Information" means any information disclosed by one Party to the other Party in connection with the Purpose.',
        t: '«Məxfi məlumat» — Məqsədlə əlaqədar bir Tərəfin digər Tərəfə açıqladığı istənilən məlumatdır.', o: 'ai', c: 'mid',
        why: 'Tərif cümləsi: «… means …» — «… — …dır». Uzun tərifdə söz sırasını yoxlayın.',
        alts: [['«Məxfi məlumat» dedikdə Məqsədlə bağlı bir Tərəfin digər Tərəfə açıqladığı istənilən məlumat başa düşülür.', 'Klassik tərif düsturu']] },
      { s: 'The Receiving Party shall use the Confidential Information solely for the Purpose.', t: 'Qəbul edən Tərəf Məxfi məlumatdan yalnız Məqsəd için istifadə etməlidir.', o: 'ai', c: 'high',
        why: '«solely for» — «yalnız … üçün». «için» türk formasıdır.',
        alts: [['Qəbul edən Tərəf Məxfi məlumatdan yalnız Məqsəd üçün istifadə etməlidir.', 'Düzəldilmiş']] },
      { s: 'This obligation shall survive for three (3) years after termination.', t: '', ai: 'Bu öhdəlik xitamdan sonra üç (3) il ərzində qüvvədə qalır.', c: 'high', why: '«shall survive» — «qüvvədə qalır».' },
      { s: 'Nothing in this Agreement grants any licence or other rights.', t: 'Bu Sazişin heç bir müddəası hər hansı lisenziya və ya digər hüquqlar vermir.', o: 'ai', c: 'high', why: '«Nothing in this Agreement» — «Bu Sazişin heç bir müddəası».' },
      { s: 'Each Party shall return or destroy all Confidential Information upon request.', t: '', ai: 'Hər bir Tərəf tələb olunduqda bütün Məxfi məlumatı qaytarmalı və ya məhv etməlidir.', c: 'high', why: '«upon request» — «tələb olunduqda».' }
    ] },
    'supply-en': { src: 'en', title: 'Müqavilə · əsas şərtlər', names: [], segs: [
      { s: 'SUPPLY CONTRACT No. AG-2026/031', t: 'TƏCHİZAT MÜQAVİLƏSİ № AG-2026/031', o: 'tm', ok: true, c: 'high', why: 'Başlıq TM-dən.' },
      { s: 'The Supplier shall deliver the Goods to the Buyer\'s warehouse in Gadabay.', t: 'Təchizatçı Malları Alıcının Gədəbəydəki anbarına çatdırmalıdır.', o: 'ai', ok: true, c: 'high', why: '«Gadabay» — «Gədəbəy».' },
      { s: 'This Contract shall enter into force on the date of its signing.', t: 'Bu Müqavilə imzalandığı tarixdən qüvvəyə minir.', o: 'human', ok: true, c: 'high', why: 'Bu tərcümə sonradan TM-ə əlavə olundu.' },
      { s: 'Payment shall be made within fifteen (15) banking days after delivery.', t: 'Ödəniş çatdırılmadan sonra on beş (15) bank günü ərzində həyata keçirilməlidir.', o: 'ai', ok: true, c: 'high', why: '«banking days» — «bank günü».' },
      { s: 'The Buyer may reject Goods that do not conform to the Specification.', t: 'Alıcı Spesifikasiyaya uyğun gəlməyən Malları qəbul etməkdən imtina edə bilər.', o: 'ai', ok: true, c: 'high', why: '«reject» — «qəbul etməkdən imtina etmək».' }
    ] }
  };

  var SIT = {
    caspian: { purpose: 'İmza üçün. Azərbaycan nüsxəsi ingilis nüsxəsi ilə eyni hüquqi qüvvəyə malikdir.', audience: 'Sifarişçinin hüquq şöbəsi və İcraçının rəhbərliyi', note: '«Tərəflərin adları bütün mətndə eyni yazılsın. Tarixləri sözlə verin.» — müştərinin hüquq şöbəsi' },
    kapital: { purpose: 'Kredit sənədləri paketinə əlavə; Borcalan imzalayır.', audience: 'Borcalanın direktoru və bankın kredit komitəsi', note: '«Məbləğlər rəqəm və sözlə, mənbədəki kimi.»' },
    socar: { purpose: 'İllik hesabatın Azərbaycan versiyası — saytda dərc olunacaq.', audience: 'İnvestorlar, tərəfdaşlar, geniş ictimaiyyət', note: '«Rəqəmlər ingilis versiyası ilə eyni olmalıdır. Onluq kəsr — vergüllə.»' },
    ada: { purpose: 'Birinci kurs tələbələri üçün bələdçi — çap və sayt.', audience: 'Yeni tələbələr və valideynlər', note: 'Səmimi ton, «siz» müraciəti; uzun cümlələrdən qaçın.' },
    'sim-nda': { purpose: 'Məşq: iki şirkət danışıqlardan əvvəl məxfilik sazişi imzalayır.', audience: 'Hüquq şöbəsi', note: 'Akademiya tapşırığı · Münşi səviyyəsi' },
    azergold: { purpose: 'Təchizat müqaviləsinin imza üçün nüsxəsi.', audience: 'Alıcının satınalma və hüquq şöbələri', note: 'Təhvil verilib, müştəri qəbul edib.' }
  };
  var REQS = {
    caspian: [['«Employer» — «Sifarişçi», «Contractor» — «İcraçı»', 'terms'], ['Dırnaq işarələri: «…»', 'punct'], ['Məbləğlər mənbə ilə eyni, rəqəm və sözlə', 'numbers'], ['Türk formaları olmamalıdır', 'turkish'], ['Bütün seqmentlər tərcümə edilməli', 'complete'], ['Əvəzlik yox — tərəfin adı yazılsın', 'meaning'], ['İki dilli cədvəl də təhvil verilsin', null]],
    kapital: [['«Заёмщик» — «Borcalan», «неустойка» — «dəbbə pulu»', 'terms'], ['Məbləğlər rəqəm və sözlə, mənbədəki kimi', 'numbers'], ['Adlar Azərbaycan yazılışında', 'names'], ['Türk formaları olmamalıdır', 'turkish'], ['Bütün seqmentlər tərcümə edilməli', 'complete'], ['Bankın şablonu: Times New Roman, 12 pt', null]],
    socar: [['Rəqəmlər ingilis versiyası ilə eyni', 'numbers'], ['Onluq kəsr vergüllə: 12,4%', 'punct'], ['Şirkət lüğəti məcburi', 'terms'], ['Türk formaları olmamalıdır', 'turkish'], ['Bütün seqmentlər tərcümə edilməli', 'complete'], ['Qrafik başlıqları da tərcümə edilsin', null]]
  };
  var DEFAULT_REQS = [['Layihə lüğəti məcburi', 'terms'], ['Rəqəm və tarixlər mənbə ilə eyni', 'numbers'], ['Türk formaları olmamalıdır', 'turkish'], ['Dırnaq və onluq kəsr Azərbaycan normasına uyğun', 'punct'], ['Bütün seqmentlər tərcümə edilməli', 'complete']];
  var REQ_CHIPS = [['Müştəri lüğəti məcburi', 'terms'], ['Rəqəmlər mənbədəki kimi', 'numbers'], ['Türk formaları olmasın', 'turkish'], ['Tarixlər sözlə', null], ['Formatı qoru', null], ['İki dilli cədvəl', null]];
  var SIT_CHIPS = ['İmza üçün', 'Məhkəməyə təqdim', 'Notarial təsdiq', 'Saytda dərc', 'Daxili istifadə'];

  /* ------------------------------------------------------------------
     3. PROJECTS MODEL
     ------------------------------------------------------------------ */
  function roundUp30(d) { var ms = 30 * 60000; return new Date(Math.ceil(d.getTime() / ms) * ms); }
  function at(daysFromToday, hour, minute) { var n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate() + daysFromToday, hour, minute || 0, 0, 0); }
  function baseProjects() {
    var now = new Date();
    return [
      { id: 'kapital', name: 'Kredit müqaviləsi — əlavə №2', client: 'Kapital Bank', pair: 'ru-az', field: 'Bank-maliyyə', reg: 'huquqi', words: 1860, segs: 74, done: 22, due: roundUp30(new Date(now.getTime() + 190 * 60000)), qa: 84, kind: 'real', set: 'legal-ru', status: 'active' },
      { id: 'caspian', name: 'Xidmət müqaviləsi', client: 'Caspian Logistics', pair: 'en-az', field: 'Hüquq', reg: 'huquqi', words: 3420, segs: 186, done: 68, due: at(1, 18), qa: 91, kind: 'real', set: 'legal-en', status: 'active' },
      { id: 'ada', name: 'Tələbə bələdçisi 2026/27', client: 'ADA Universiteti', pair: 'en-az', field: 'Təhsil', reg: 'neytral', words: 5240, segs: 188, done: 86, due: at(4, 17), qa: 94, kind: 'real', set: 'guide-en', status: 'active' },
      { id: 'sim-nda', name: 'Məxfilik sazişi (NDA)', client: 'Nuanza Akademiya', pair: 'en-az', field: 'Hüquq', reg: 'huquqi', words: 640, segs: 28, done: 35, due: at(5, 20), qa: null, kind: 'sim', set: 'nda-en', status: 'active' },
      { id: 'socar', name: 'İllik hesabat 2025 — 3-cü fəsil', client: 'SOCAR', pair: 'en-az', field: 'Neft-qaz', reg: 'resmi', words: 12480, segs: 512, done: 41, due: at(9, 12), qa: 88, kind: 'real', set: 'report-en', status: 'active' },
      { id: 'azergold', name: 'Təchizat müqaviləsi', client: 'AzerGold', pair: 'en-az', field: 'Hüquq', reg: 'huquqi', words: 2140, segs: 96, done: 100, due: at(-2, 16), qa: 97, kind: 'real', set: 'supply-en', status: 'delivered' }
    ];
  }
  function setKeyFor(pair, field, name) {
    if (/^ru-/.test(pair)) return 'legal-ru';
    if (/(^|[^a-z])nda([^a-z]|$)|non-disclosure|məxfilik|mexfilik|confidential/i.test(String(name || ''))) return 'nda-en';
    if (field === 'Neft-qaz' || field === 'Bank-maliyyə') return 'report-en';
    if (field === 'Təhsil' || field === 'Turizm' || field === 'İnterfeys və IT' || field === 'Marketinq') return 'guide-en';
    return 'legal-en';
  }
  function setWords(key) { var s = SETS[key]; var n = 0; if (s) s.segs.forEach(function (d) { n += wordsIn(d.s); }); return n; }
  function normCreated(c) {
    if (!c || typeof c !== 'object' || !c.id || !c.name) return null;
    var p = {};
    for (var k in c) if (Object.prototype.hasOwnProperty.call(c, k)) p[k] = c[k];
    p.due = new Date(c.due || Date.now() + 3 * DAY);
    if (isNaN(p.due)) p.due = new Date(Date.now() + 3 * DAY);
    if (!SETS[p.set]) p.set = setKeyFor(p.pair || 'en-az', p.field);
    p.segs = Math.max(SETS[p.set].segs.length, Math.round((Number(c.words) || 0) / 18));
    p.done = p.done || 0; p.status = p.status || 'active'; p.kind = p.kind === 'sim' ? 'sim' : 'real';
    p.reg = REG[p.reg] ? p.reg : 'resmi'; p.pair = p.pair || 'en-az'; p.client = p.client || 'Şəxsi sifariş';
    p.fresh = true; p.created = c.created || Date.now();
    return p;
  }
  function allProjects() {
    var removed = getMap('pj:removed'), prog = getMap('pj:prog'), qa = getMap('pj:qa'), status = getMap('pj:status');
    var created = sget('pj:created', []);
    if (!Array.isArray(created)) created = [];
    var list = created.map(normCreated).filter(Boolean).concat(baseProjects());
    return list.filter(function (p) { return !removed[p.id]; }).map(function (p) {
      p.done0 = p.done;
      if (typeof prog[p.id] === 'number') p.done = prog[p.id];
      if (typeof qa[p.id] === 'number') p.qa = qa[p.id];
      if (status[p.id] === 'delivered' || status[p.id] === 'active') p.status = status[p.id];
      return p;
    });
  }
  function findProject(id) { var l = allProjects(); for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i]; return null; }
  function resolveProject(params) {
    params = params || {};
    var id = params.project || params.id, p = id ? findProject(String(id)) : null;
    if (!p && params.name) {
      var nm = lower(params.name);
      allProjects().some(function (x) { if (lower(x.name) === nm || lower(x.client + ' — ' + x.name) === nm) { p = x; return true; } return false; });
    }
    if (!p) p = findProject(sget('pj:last', 'caspian')) || findProject('caspian') || allProjects()[0] || null;
    return p;
  }
  function setOf(p) { return SETS[p && p.set] || SETS['legal-en']; }
  function glossOf(p) {
    var base = (GL[p.set] || []).slice();
    var extra = sget('pj:gl:' + p.id, []);
    if (Array.isArray(extra)) extra.forEach(function (g) { if (g && g.a && g.b) base.push({ a: g.a, b: g.b, stem: lower(g.b).slice(0, Math.max(4, g.b.length - 2)), custom: true }); });
    return base;
  }
  function sitOf(p) {
    if (p.sit && (p.sit.purpose || p.sit.audience)) return p.sit;
    var saved = sget('pj:sit:' + p.id, null);
    if (saved && typeof saved === 'object' && (saved.purpose || saved.audience)) return saved;
    return SIT[p.id] || { purpose: p.field + ' sənədi — təyinatı göstərilməyib.', audience: 'Göstərilməyib', note: '' };
  }
  function reqsOf(p) {
    if (Array.isArray(p.reqs) && p.reqs.length) return p.reqs;
    return REQS[p.id] || DEFAULT_REQS;
  }
  /* Input for the QA engine (live adapter ai/qa.js): the real segments and the project context. */
  function qaInput(p, segs) {
    var set = setOf(p), sit = sitOf(p);
    segs = segs || loadSegs(p);
    return {
      id: p.id, name: p.client + ' — ' + p.name, pair: p.pair, register: p.reg, field: p.field,
      segments: set.segs.map(function (d, i) { return { n: i + 1, s: d.s, t: (segs[i] && segs[i].t) || '' }; }),
      terms: glossOf(p).map(function (g) { return { a: g.a, b: g.b, note: g.note || '' }; }),
      reqs: reqsOf(p).map(function (r) { return Array.isArray(r) ? r[0] : String(r); }),
      situation: { purpose: sit.purpose || '', audience: sit.audience || '', note: sit.note || '' }
    };
  }
  function seedState(d, p) {
    var delivered = p.status === 'delivered' && !p.fresh;
    if (p.fresh) return { t: '', o: null, ok: false, ed: false, ans: null, note: '' };
    return { t: d.t || '', o: d.t ? (d.o || 'ai') : null, ok: delivered ? !!d.t : !!d.ok, ed: d.o === 'human', ans: null, note: '' };
  }
  function loadSegs(p) {
    var set = setOf(p), saved = sget('pj:segs:' + p.id, null);
    return set.segs.map(function (d, i) {
      var st = seedState(d, p), s = Array.isArray(saved) ? saved[i] : null;
      if (s && typeof s === 'object') {
        if (typeof s.t === 'string') st.t = s.t;
        st.o = s.o === 'ai' || s.o === 'tm' || s.o === 'human' ? s.o : (st.t ? st.o : null);
        st.ok = !!s.ok && !!st.t; st.ed = !!s.ed; st.ans = s.ans || null; st.note = typeof s.note === 'string' ? s.note : '';
        if (st.o === 'ai' && (s.c === 'high' || s.c === 'mid' || s.c === 'low')) { st.c = s.c; st.cn = typeof s.cn === 'string' ? s.cn : ''; }
      }
      return st;
    });
  }
  function saveSegs(p, segs) {
    sset('pj:segs:' + p.id, segs.map(function (s) {
      var o = { t: s.t, o: s.o, ok: s.ok, ed: s.ed, ans: s.ans, note: s.note };
      if (s.c && s.o === 'ai') { o.c = s.c; o.cn = s.cn || ''; } /* the live engine's own confidence for its draft */
      return o;
    }));
  }
  function progressOf(p, segs) {
    var set = setOf(p), fragOk = 0, seedOk = 0;
    segs.forEach(function (s) { if (s.ok) fragOk++; });
    set.segs.forEach(function (d) { if (seedState(d, p).ok) seedOk++; });
    var total = Math.max(p.segs || 0, segs.length);
    var base = p.fresh ? 0 : Math.round(p.segs * (p.done0 != null ? p.done0 : p.done) / 100);
    var ok = clamp(base - seedOk + fragOk, 0, total);
    return { ok: ok, total: total, pct: Math.round(ok / total * 100) };
  }

  /* ------------------------------------------------------------------
     4. ANALYSIS ENGINE (live checks shared by editor + QA)
     ------------------------------------------------------------------ */
  function numsOf(text, style) {
    var re = style === 'en' ? /\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?/g : /\d{1,3}(?:[   ]\d{3})+(?:,\d+)?|\d+(?:[.,]\d+)?/g;
    var out = [], m;
    while ((m = re.exec(text))) {
      var raw = m[0], v = style === 'en' ? parseFloat(raw.replace(/,/g, '')) : parseFloat(raw.replace(/[   ]/g, '').replace(',', '.'));
      if (isFinite(v)) out.push({ raw: raw, v: v });
    }
    return out;
  }
  function analyze(d, st, ctx) {
    var t = String(st.t || ''), out = [];
    if (!t.trim()) { out.push({ type: 'Boş seqment', sev: 'high', was: '', now: d.ai || d.t || '', text: 'Seqment hələ tərcümə edilməyib.', fix: 'fill' }); return out; }
    if (d.q && !st.ans && hasWord(t, d.q.bad, true)) {
      out.push({ type: 'Məna', sev: 'high', was: d.q.bad, now: '', text: '«' + d.q.word + '» kimə aiddir? Hüquqi mətndə tərəfin adı açıq yazılmalıdır.', fix: 'ask' });
    }
    var A = numsOf(d.s, ctx.set.src === 'en' ? 'en' : 'eu'), B = numsOf(t, 'eu'), used = [], missing = [];
    A.forEach(function (x) {
      var j = -1;
      for (var k = 0; k < B.length; k++) if (!used[k] && Math.abs(B[k].v - x.v) < 1e-9) { j = k; break; }
      if (j >= 0) used[j] = true; else missing.push(x);
    });
    if (missing.length) {
      var extra = B.filter(function (y, k) { return !used[k]; }), x0 = missing[0], y0 = extra[0];
      if (y0) out.push({ type: 'Rəqəm', sev: 'high', was: y0.raw, now: fmtAz(x0.v, x0.raw), text: 'Mənbədə ' + x0.raw + ', tərcümədə ' + y0.raw + ' — rəqəm uyğun gəlmir.', fix: 'raw' });
      else out.push({ type: 'Rəqəm', sev: 'high', was: x0.raw, now: '', text: 'Mənbədəki «' + x0.raw + '» tərcümədə yoxdur.', fix: null });
    }
    ctx.gl.forEach(function (g) {
      (g.bad || []).some(function (pr) {
        if (hasWord(t, pr[0], false)) { out.push({ type: 'Termin', sev: 'mid', was: pr[0], now: pr[1], text: 'Lüğətə görə «' + g.a + '» — «' + g.b + '».', fix: 'word', term: g.a }); return true; }
        return false;
      });
    });
    var hits = [];
    TURK.forEach(function (pr) {
      if (hits.some(function (w) { return lower(w).indexOf(lower(pr[0])) >= 0; })) return;
      if (hasWord(t, pr[0], true)) { hits.push(pr[0]); out.push({ type: 'Türk forması', sev: 'mid', was: pr[0], now: pr[1], text: '«' + pr[0] + '» türk formasıdır — «' + pr[1] + '» yazın.', fix: 'word', ci: true }); }
    });
    (ctx.set.names || []).forEach(function (pr) {
      if (hasWord(t, pr[0], false)) out.push({ type: 'Ad', sev: 'mid', was: pr[0], now: pr[1], text: 'Ad rus transliterasiyasından keçib — Azərbaycan yazılışına qaytarın.', fix: 'word' });
    });
    var mq = /"([^"\n]{1,80})"/.exec(t);
    if (mq) out.push({ type: 'Durğu', sev: 'low', was: mq[0], now: '«' + mq[1] + '»', text: 'Azərbaycan mətnində «» dırnaqları işlənir.', fix: 'raw' });
    var md = /(^|[^\d.])(\d+)\.(\d+)(?![.\d])/.exec(t);
    if (md) out.push({ type: 'Durğu', sev: 'low', was: md[2] + '.' + md[3], now: md[2] + ',' + md[3], text: 'Onluq kəsr Azərbaycan dilində vergüllə yazılır.', fix: 'raw' });
    var ord = { high: 0, mid: 1, low: 2 };
    out.sort(function (a, b) { return ord[a.sev] - ord[b.sev]; });
    return out;
  }
  function applyFix(d, st, iss) {
    var t = String(st.t || '');
    if (iss.fix === 'fill') return d.ai || d.t || '';
    if (iss.fix === 'raw') { var i = t.indexOf(iss.was); return i < 0 ? null : t.slice(0, i) + iss.now + t.slice(i + iss.was.length); }
    if (iss.fix === 'word') { var n = replaceWord(t, iss.was, iss.now, !!iss.ci); return n === t ? null : n; }
    return null;
  }
  function confOf(d, st, issues) {
    if (!String(st.t || '').trim()) return null;
    if (issues.some(function (i) { return i.sev === 'high'; })) return 'low';
    if (issues.length) return 'mid';
    if (st.ed || st.ans) return 'high';
    if (st.c && st.o === 'ai') return st.c; /* a live AI draft: the engine's confidence, not the sample's */
    return d.c || 'high';
  }
  function scoreOf(issues) {
    var pen = 0, hi = 0; issues.forEach(function (i) { pen += SEV_W[i.sev] || 1; if (i.sev === 'high') hi++; });
    var sc = clamp(100 - pen, 40, 99);
    return hi ? Math.min(sc, 84 - Math.min(10, (hi - 1) * 2)) : sc; /* open critical issues never read as «ready» */
  }
  function sealOf(s) { return s >= 85 ? 'Təhvilə hazırdır' : s >= 70 ? 'Düzəlişlərlə qəbul' : 'Yenidən işlənməli'; }
  function gradeOf(s) { return s >= 90 ? 'Əla' : s >= 80 ? 'Yaxşı' : s >= 70 ? 'Orta' : s >= 60 ? 'Zəif' : 'Yenidən işlənməli'; }
  function qaCls(v) { return v == null ? '' : v >= 85 ? 'green' : v >= 70 ? 'gold' : 'red'; }
  function srcFor(s, g) { return g && g.ex ? String(s).split(g.ex).join(' ') : String(s); }
  function issKey(n, iss) { return n + '|' + iss.type + '|' + iss.was; }

  /* ------------------------------------------------------------------
     5. CSS (tokens only; prefixes projects-, editor-, qa-)
     ------------------------------------------------------------------ */
  var CSS = [
    /* projects — list */
    '.projects-statcard{padding:18px 20px}',
    '.projects-stats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px 20px}',
    '@media (min-width:640px){.projects-stats{grid-template-columns:repeat(4,minmax(0,1fr))}}',
    '.projects-stats .stat{padding-left:14px;border-left:2px solid var(--line)}',
    '.projects-stats .stat:first-child{border-left-color:var(--nar)}',
    '.projects-stats .stat > b{font-size:1.625rem}',
    '.projects-tools{display:grid;gap:10px}',
    '.projects-tools-row{display:flex;flex-wrap:wrap;align-items:center;gap:10px}',
    '.projects-tools .input-ic{flex:1 1 220px}',
    '.projects-tools .input[type=search]::-webkit-search-cancel-button{opacity:.5}',
    '.projects-grid{display:grid;gap:16px;grid-template-columns:minmax(0,1fr)}',
    '@media (min-width:720px){.projects-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}',
    '.projects-card{display:grid;gap:14px;align-content:start;transition:transform var(--t-base) var(--ease-out),box-shadow var(--t-base),border-color var(--t-base)}',
    '@media (hover:hover){.projects-card:hover{transform:translateY(-2px);box-shadow:var(--sh-2),inset 0 1px 0 var(--hl);border-color:color-mix(in srgb,var(--zafaran) 45%,var(--line))}}',
    '.projects-card:active{transform:scale(.995)}',
    '.projects-top{display:flex;align-items:center;gap:12px;min-width:0}',
    '.projects-who{flex:1;min-width:0;display:grid;gap:4px}',
    '.projects-who > span{font-size:var(--fs-sm);font-weight:600;color:var(--soft);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.projects-tags{display:flex;flex-wrap:wrap;gap:6px}',
    '.projects-open{display:block;width:100%;padding:0;border:0;background:none;color:inherit;font:inherit;text-align:left;cursor:pointer;outline:none}',
    '.projects-open::after{content:"";position:absolute;inset:0;z-index:0;border-radius:inherit}',
    '.projects-open:focus-visible::after{box-shadow:0 0 0 2px var(--focus)}',
    '.projects-card h3{font-size:1.1875rem;line-height:1.28;letter-spacing:-.005em}',
    '.projects-raise{position:relative;z-index:1}',
    '.projects-meta{display:flex;flex-wrap:wrap;gap:6px}',
    '.projects-prog{display:grid;gap:8px}',
    '.projects-prog-l{display:flex;align-items:baseline;justify-content:space-between;gap:8px;font-size:var(--fs-sm);color:var(--soft)}',
    '.projects-prog-l b{font-family:var(--f-display);font-size:1.125rem;color:var(--ink);font-variant-numeric:tabular-nums}',
    '.projects-prog-l b small,.editor-bar-prog b small{margin-left:1px;font-family:var(--f-body);font-size:.68em;font-weight:600;color:var(--soft)}',
    '.projects-foot{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;padding-top:12px;border-top:1px dashed var(--line)}',
    '.projects-due{display:inline-flex;align-items:center;gap:6px;min-height:28px;padding:0 10px;border-radius:var(--r-pill);background:var(--surface2);color:var(--soft);font:600 var(--fs-xs)/1.2 var(--f-body);font-variant-numeric:tabular-nums}',
    '.projects-due svg{width:14px;height:14px}',
    '.projects-due.late{background:var(--nar-t);color:var(--nar)}',
    '.projects-due.late::before{content:"";width:7px;height:7px;border-radius:50%;background:currentColor;animation:projects-pulse 1.6s var(--ease-out) infinite}',
    '.projects-due.soon{background:var(--zaf-t);color:var(--zafaran-ink)}',
    '.projects-due.ok{background:var(--ok-t);color:var(--ok)}',
    'button.projects-qa{border:0;cursor:pointer;height:28px;padding:0 10px;transition:transform var(--t-fast) var(--ease-out),box-shadow var(--t-fast)}',
    'button.projects-qa:hover{box-shadow:0 0 0 1px currentColor}',
    'button.projects-qa:active{transform:scale(.95)}',
    '.projects-card.is-new{border-color:var(--zafaran);animation:projects-glow 2.4s var(--ease-out) both}',
    '.projects-card.is-gone{opacity:0;transform:scale(.97);transition:opacity .22s,transform .22s}',
    '.projects-table td .tx{display:grid;gap:2px;min-width:0}',
    '.projects-table td .tx small{color:var(--soft)}',
    '.projects-mini{display:flex;align-items:center;gap:8px;min-width:120px}',
    '.projects-mini .progress{flex:1;min-width:60px}',
    '.projects-table tr:focus-visible{outline:2px solid var(--focus);outline-offset:-2px}',
    /* projects — new sheet */
    '.projects-new{display:grid;gap:18px}',
    '.projects-new .grid-2{gap:14px}',
    '.projects-sec{display:grid;gap:12px;padding-top:16px;border-top:1px solid var(--line)}',
    '.projects-sec > h3{display:flex;align-items:center;gap:8px;font:600 var(--fs-xs)/1.3 var(--f-body);letter-spacing:.12em;text-transform:uppercase;color:var(--soft)}',
    '.projects-sec > h3::before{content:"";width:8px;height:8px;background:var(--zafaran);-webkit-mask:var(--m-star) center/contain no-repeat;mask:var(--m-star) center/contain no-repeat}',
    '.projects-dz:focus-visible{outline:2px solid var(--focus);outline-offset:2px}',
    '.projects-dz .ic{width:46px;height:46px;border-radius:14px}',
    '.projects-files{display:grid;gap:8px}',
    '.projects-file{display:grid;grid-template-columns:auto minmax(0,1fr) auto auto;align-items:center;gap:10px;padding:10px 6px 10px 10px;border:1px solid var(--line);border-radius:var(--r-md);background:var(--surface);animation:rise .3s var(--ease-out) both}',
    '.projects-file .ic{width:34px;height:34px;border-radius:10px}',
    '.projects-file .ic svg{width:18px;height:18px}',
    '.projects-file-tx{min-width:0;display:grid;gap:5px}',
    '.projects-file-tx b{font-size:var(--fs-sm);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.projects-file-tx small{font-size:var(--fs-xs);color:var(--soft)}',
    '.projects-file-pct{min-width:40px;display:flex;justify-content:flex-end;font-size:var(--fs-xs);color:var(--soft);font-variant-numeric:tabular-nums}',
    '.projects-file-pct .spinner{width:14px;height:14px}',
    '.projects-sample{justify-self:start}',
    /* editor */
    '.editor-top{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:-8px}',
    '.editor-top .btn{margin-left:-10px}',
    '.editor .page-h h1{font-size:clamp(1.5rem,1.2rem + 1.3vw,2rem)}',
    '.editor-bar{position:sticky;top:calc(var(--hdr-h) + var(--band-h) + env(safe-area-inset-top,0px) + 8px);z-index:6;display:grid;gap:10px;padding:12px 14px;border:1px solid var(--line);border-radius:var(--r-lg);background:color-mix(in srgb,var(--surface) 90%,transparent);-webkit-backdrop-filter:blur(14px) saturate(1.4);backdrop-filter:blur(14px) saturate(1.4);box-shadow:var(--sh-1)}',
    '.editor-bar-top,.editor-bar-bot{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px 12px;min-width:0}',
    '.editor-sec{font:600 var(--fs-sm)/1.3 var(--f-body);color:var(--ink);min-width:0}',
    '.editor-bar-prog{display:flex;align-items:center;gap:12px}',
    '.editor-bar-prog .progress{flex:1}',
    '.editor-bar-prog b{font-family:var(--f-display);font-size:1.125rem;min-width:3ch;text-align:right}',
    '.editor-prog-tx{font-size:var(--fs-xs);color:var(--soft)}',
    '.editor-save{display:inline-flex;align-items:center;gap:6px;font-size:var(--fs-xs);color:var(--soft)}',
    '.editor-save i{width:7px;height:7px;border-radius:50%;background:var(--ok)}',
    '.editor-save.busy i{background:var(--zafaran);animation:editor-blink 1s ease-in-out infinite}',
    '.editor-filter .editor-fc{min-width:18px;height:18px;padding:0 5px;border-radius:var(--r-pill);background:color-mix(in srgb,var(--ink) 8%,transparent);font-size:.6875rem;line-height:18px;text-align:center}',
    '.editor-filter button[aria-pressed="true"] .editor-fc{background:var(--nar-t);color:var(--nar)}',
    '.editor-ctx{align-items:start}',
    '.editor-sit-h{display:flex;align-items:center;gap:12px;width:100%;padding:0;border:0;background:none;color:inherit;font:inherit;text-align:left;cursor:pointer}',
    '.editor-sit-h .tx{flex:1;min-width:0;display:grid;gap:2px}',
    '.editor-sit-h .tx b{font-family:var(--f-display);font-size:1.125rem;font-weight:600}',
    '.editor-sit-h .tx small{color:var(--soft);font-size:var(--fs-sm);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.editor-sit-h > svg:last-child{width:18px;height:18px;color:var(--faint);transition:transform var(--t-base) var(--ease-out)}',
    '.editor-sit-h[aria-expanded="true"] > svg:last-child{transform:rotate(90deg)}',
    '.editor-sit-h:focus-visible{outline:2px solid var(--focus);outline-offset:4px;border-radius:8px}',
    '.editor-sit-b{display:grid;gap:14px;margin-top:16px;padding-top:14px;border-top:1px solid var(--line);animation:rise .28s var(--ease-out) both}',
    '.editor-sit-row{display:grid;gap:2px}',
    '.editor-sit-row span{font-size:var(--fs-xs);font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--soft)}',
    '.editor-sit-row p{font-size:var(--fs-sm);line-height:1.5}',
    '.editor-gl .chips{gap:6px}',
    '.editor-gl .chip{min-height:30px;padding:0 10px;font-size:.78rem}',
    '.editor-gl .chip .editor-arrow{color:var(--faint)}',
    '.editor-gl .chip[aria-pressed="true"] .editor-arrow{color:inherit;opacity:.7}',
    '.editor-gl-bad{display:inline-grid;place-items:center;min-width:16px;height:16px;padding:0 4px;border-radius:var(--r-pill);background:var(--nar);color:var(--on-nar);font-size:.625rem;font-weight:700}',
    '.editor-gl-add{border-style:dashed}',
    'mark.editor-mark{background:var(--zaf-t);color:inherit;border-radius:4px;padding:0 2px;box-shadow:inset 0 -2px 0 var(--zafaran)}',
    '.editor-they{font-weight:600}',
    '.editor-start{display:grid;gap:14px}',
    '.editor-start-row{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:14px}',
    '.editor-list .seg-row{scroll-margin-top:calc(var(--hdr-h) + var(--band-h) + 170px);scroll-margin-bottom:120px}',
    '.editor-list .seg-row[hidden]{display:none}',
    '.editor-list textarea.seg-tgt{overflow:hidden;min-height:3.2em;line-height:1.65}',
    '.editor-list textarea.seg-tgt.editor-t-mid:not(:focus){box-shadow:inset 0 -2px 0 color-mix(in srgb,var(--conf-mid) 70%,transparent)}',
    '.editor-list textarea.seg-tgt.editor-t-low:not(:focus){box-shadow:inset 0 -2px 0 var(--conf-low)}',
    '.editor-list textarea.seg-tgt.editor-sk{color:transparent;pointer-events:none;background:linear-gradient(100deg,transparent 30%,var(--shimmer) 50%,transparent 70%) 0 0/250% 100% no-repeat,var(--surface2);animation:shimmer 1.3s linear infinite}',
    '.editor-list .seg-row.is-ok .seg-src{color:var(--soft)}',
    '.editor-list .seg-row.editor-flash{animation:editor-flash 1.6s var(--ease-out)}',
    '.editor-list .seg-st.ok svg{animation:pop-in .35s var(--ease-spring) both}',
    '.editor-list .seg-meta{gap:6px 6px;padding-top:2px}',
    '.editor-pill svg{width:12px;height:12px}',
    '.editor-conf{display:inline-flex;align-items:center;gap:6px;height:22px;padding:0 9px 0 8px;border-radius:var(--r-pill);background:var(--surface2);color:var(--soft);font:600 .6875rem/1 var(--f-body);cursor:help}',
    '.editor-bars{display:inline-flex;align-items:flex-end;gap:2px;height:11px}',
    '.editor-bars i{display:block;width:3px;border-radius:2px;background:var(--line-2)}',
    '.editor-bars i:nth-child(1){height:5px}.editor-bars i:nth-child(2){height:8px}.editor-bars i:nth-child(3){height:11px}',
    '.editor-conf.high{color:var(--ok)}.editor-conf.high i{background:var(--conf-high)}',
    '.editor-conf.mid{color:var(--zafaran-ink)}.editor-conf.mid i:nth-child(-n+2){background:var(--conf-mid)}',
    '.editor-conf.low{color:var(--nar)}.editor-conf.low i:nth-child(1){background:var(--conf-low)}',
    '.editor-tm{min-height:24px;height:24px;padding:0 9px;gap:5px;font-size:.6875rem;font-weight:600;background:var(--zaf-t);border-color:transparent;color:var(--zafaran-ink)}',
    '.editor-tm svg{width:12px;height:12px}',
    '.editor-actions{display:inline-flex;align-items:center;gap:4px;margin-left:auto}',
    '.editor-ok{min-height:30px;padding:0 10px}',
    '.editor-ok[aria-pressed="true"]{--btn-bg:var(--ok-t);--btn-bg-h:var(--ok-t);--btn-ink:var(--ok);--btn-bd:transparent;box-shadow:none}',
    '.editor-nzb .logo{width:18px;height:18px;transition:transform .6s var(--ease-spring)}',
    '.editor-nzb:hover .logo{transform:rotate(45deg)}',
    '.editor-hints{grid-column:3 / 4;display:grid;gap:6px;min-width:0}',
    '.editor-hint{display:flex;align-items:center;flex-wrap:wrap;gap:6px 10px;padding:6px 6px 6px 10px;border-radius:var(--r-sm);background:var(--zaf-t);font-size:var(--fs-sm);line-height:1.4;animation:rise .25s var(--ease-out) both}',
    '.editor-hint.high{background:var(--nar-t)}',
    '.editor-hint.low{background:var(--lac-t)}',
    '.editor-hint-tx{flex:1;min-width:0}',
    '.editor-hint-tx b{font-weight:600;margin-right:4px}',
    '.editor-hint s,.qa-diff s{color:var(--nar);text-decoration-thickness:1.5px}',
    '.editor-hint ins,.qa-diff ins{color:var(--ok);font-weight:600;text-decoration:none;background:var(--ok-t);border-radius:4px;padding:0 3px}',
    '.editor-hint .btn{min-height:28px;padding:0 10px}',
    '@media (max-width:639px){.editor-hints{grid-column:2 / -1;grid-row:3}.editor-list .seg-meta{grid-row:4}}',
    '.editor-ask{position:relative;display:grid;grid-template-columns:auto minmax(0,1fr);gap:12px;margin:0 14px 14px 60px;padding:14px 16px;border:1px solid color-mix(in srgb,var(--zafaran) 55%,var(--line));border-radius:var(--r-lg);background:linear-gradient(var(--zaf-t),var(--zaf-t)),var(--surface);box-shadow:var(--sh-1);animation:rise .3s var(--ease-out) both}',
    '.editor-ask::before{content:"";position:absolute;left:28px;top:-7px;width:12px;height:12px;transform:rotate(45deg);background:inherit;border-left:1px solid color-mix(in srgb,var(--zafaran) 55%,var(--line));border-top:1px solid color-mix(in srgb,var(--zafaran) 55%,var(--line))}',
    '.editor-ask[hidden]{display:none}',
    '.editor-ask-ic{width:40px;height:40px;display:grid;place-items:center;border-radius:12px;background:var(--surface);box-shadow:var(--sh-pop)}',
    '.editor-ask-ic .logo{width:26px;height:26px;animation:editor-spin 9s linear infinite}',
    '.editor-ask-b{display:grid;gap:8px;min-width:0}',
    '.editor-ask-b h3{font-size:1.0625rem}',
    '.editor-ask-b p{font-size:var(--fs-sm);color:var(--soft)}',
    '.editor-ask-q{font-size:var(--fs-sm);padding:8px 10px;border-radius:var(--r-sm);background:var(--surface);border-left:3px solid var(--zafaran)}',
    '.editor-ask-opts{display:flex;flex-wrap:wrap;align-items:center;gap:8px}',
    '.editor-ask.done{grid-template-columns:auto minmax(0,1fr) auto;align-items:center;background:linear-gradient(var(--ok-t),var(--ok-t)),var(--surface);border-color:color-mix(in srgb,var(--ok) 40%,var(--line))}',
    '.editor-ask.done .editor-ask-ic{color:var(--ok)}',
    '.editor-ask.mini{grid-template-columns:auto minmax(0,1fr) auto;align-items:center;padding:8px 12px}',
    '.editor-ask.mini .editor-ask-ic{width:30px;height:30px}',
    '.editor-ask.mini .editor-ask-ic .logo{width:20px;height:20px}',
    '@media (max-width:639px){.editor-ask{margin:0 12px 12px 12px}.editor-ask::before{left:20px}}',
    '.editor-empty{padding:16px}',
    '.editor-empty .empty{border:0;background:radial-gradient(60% 80% at 50% 0%,var(--zaf-t),transparent 70%)}',
    '.editor-foot{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px 18px;padding:12px 14px;border-top:1px solid var(--line);background:var(--surface2)}',
    '.editor-keys{display:flex;flex-wrap:wrap;align-items:center;gap:8px 16px;color:var(--soft);font-size:var(--fs-xs)}',
    '.editor-keys > span{display:inline-flex;align-items:center;gap:4px}',
    '.editor-quote{padding:10px 12px;border-left:3px solid var(--zafaran);border-radius:0 var(--r-sm) var(--r-sm) 0;background:var(--surface2);font-size:var(--fs-sm);line-height:1.6}',
    '.editor-quote.az{border-left-color:var(--lacquer)}',
    '.editor-nz{display:grid;gap:14px}',
    '.editor-nz .list-row.is-on::before{opacity:1}',
    '.editor-nz-out{display:grid;gap:10px}',
    '.editor-nz-out:empty{display:none}',
    '.editor-alt{display:grid;gap:4px;width:100%;padding:12px 14px;border:1.5px solid var(--line-2);border-radius:var(--r-md);background:var(--surface);color:var(--ink);font:inherit;text-align:left;cursor:pointer;transition:border-color var(--t-base),background var(--t-base),transform var(--t-fast)}',
    '.editor-alt:hover{border-color:var(--nar);background:linear-gradient(var(--nar-t),var(--nar-t)),var(--surface)}',
    '.editor-alt:active{transform:scale(.99)}',
    '.editor-alt small{color:var(--soft);font-size:var(--fs-xs);font-weight:600;letter-spacing:.04em}',
    '.editor-alt span{font-size:var(--fs-sm);line-height:1.55}',
    '.editor-check{display:flex;align-items:center;gap:16px}',
    '.editor-tmdiff mark{background:var(--zaf-t);color:inherit;border-radius:3px;padding:0 2px}',
    /* qa */
    '.qa-top{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:-8px}',
    '.qa-top .btn{margin-left:-10px}',
    '.qa-score{display:grid;grid-template-columns:auto minmax(0,1fr);gap:22px;align-items:center}',
    '@media (max-width:479px){.qa-score{grid-template-columns:minmax(0,1fr);justify-items:center;text-align:center}.qa-score .qa-sev{justify-content:center}}',
    '.qa-score-tx{display:grid;gap:10px;min-width:0}',
    '.qa-score-tx h2 em{font-style:italic}',
    '.qa-sev{display:flex;flex-wrap:wrap;gap:8px}',
    '.qa-sevbox{flex:1 1 0;min-width:76px;display:grid;gap:2px;padding:10px 12px;border-radius:var(--r-md);background:var(--surface2);text-align:left}',
    '.qa-sevbox b{font-family:var(--f-display);font-size:1.5rem;line-height:1.1;font-variant-numeric:tabular-nums}',
    '.qa-sevbox span{font-size:var(--fs-xs);color:var(--soft)}',
    '.qa-sevbox.high b{color:var(--nar)}.qa-sevbox.mid b{color:var(--zafaran-ink)}.qa-sevbox.low b{color:var(--lacquer)}',
    '.qa-seal{display:inline-flex;align-items:center;gap:8px;justify-self:start;padding:6px 12px 6px 6px;border-radius:var(--r-pill);background:var(--zaf-t);color:var(--zafaran-ink);font-size:var(--fs-sm);font-weight:600;animation:pop-in .5s var(--ease-spring) both}',
    '.qa-seal .medal{--size:30px;filter:none}',
    '.qa-cats{display:grid;gap:4px}',
    '.qa-cat{display:grid;grid-template-columns:minmax(0,8.5rem) minmax(0,1fr) 3.6rem;align-items:center;gap:12px;min-height:34px;padding:2px 0;border:0;background:none;color:inherit;font:inherit;text-align:left;cursor:pointer;border-radius:8px}',
    '.qa-cat:hover .qa-cat-l{color:var(--nar)}',
    '.qa-cat:focus-visible{outline:2px solid var(--focus);outline-offset:2px}',
    '.qa-cat-l{font-size:var(--fs-sm);font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;transition:color var(--t-fast)}',
    '.qa-cat-n{justify-self:end;font-size:var(--fs-xs);font-weight:600;color:var(--soft);font-variant-numeric:tabular-nums}',
    '.qa-cat-n.ok{display:inline-flex;align-items:center;gap:4px;color:var(--ok)}',
    '.qa-cat-n svg{width:14px;height:14px}',
    '.qa-issues-h{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px}',
    '.qa-issue{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:8px 14px;align-items:start;padding:14px 0;border-top:1px solid var(--line);transition:opacity .22s var(--ease-out),transform .22s var(--ease-out)}',
    '.qa-issue:first-child{border-top:0}',
    '.qa-issue.is-done{opacity:0;transform:translateX(14px)}',
    '.qa-issue.is-ign{opacity:.5}',
    '.qa-issue.is-ign .qa-diff{text-decoration:line-through}',
    '@media (max-width:639px){.qa-issue{grid-template-columns:auto minmax(0,1fr)}.qa-issue-act{grid-column:2}}',
    '.qa-segno{display:inline-grid;place-items:center;min-width:46px;height:32px;padding:0 8px;border:1px solid var(--line-2);border-radius:var(--r-sm);background:var(--surface);color:var(--lacquer);font:600 .78rem/1 var(--f-mono);cursor:pointer;transition:background var(--t-fast),transform var(--t-fast),border-color var(--t-fast)}',
    '.qa-segno:hover{background:var(--lac-t);border-color:var(--lacquer)}',
    '.qa-segno:active{transform:scale(.94)}',
    '.qa-issue-b{display:grid;gap:5px;min-width:0}',
    '.qa-issue-h{display:flex;flex-wrap:wrap;align-items:center;gap:6px 8px;font-size:var(--fs-sm);font-weight:600}',
    '.qa-issue-h .avatar{width:22px;height:22px;font-size:.625rem;box-shadow:none}',
    '.qa-issue-h small{color:var(--soft);font-weight:500}',
    '.qa-diff{font-size:var(--fs-base);line-height:1.5;overflow-wrap:anywhere}',
    '.qa-issue-b p{font-size:var(--fs-sm);color:var(--soft)}',
    '.qa-issue-act{display:flex;flex-wrap:wrap;gap:6px;align-items:center;justify-content:flex-end}',
    '.qa-turk{display:grid;gap:8px}',
    '.qa-turk-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:8px 8px 8px 12px;border-radius:var(--r-md);background:var(--surface2);animation:rise .25s var(--ease-out) both}',
    '.qa-turk-row .qa-diff{flex:1;min-width:0}',
    '.qa-term{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:6px 12px;padding:10px 0;border-top:1px solid var(--line)}',
    '.qa-term:first-child{border-top:0}',
    '.qa-term-t{font-size:var(--fs-sm);min-width:0}',
    '.qa-term-t b{font-weight:600}',
    '.qa-term-t span{color:var(--faint);margin:0 4px}',
    '.qa-term-bar{grid-column:1 / -1;display:flex;height:6px;border-radius:var(--r-pill);overflow:hidden;background:var(--surface2)}',
    '.qa-term-bar i{display:block;height:100%;background:var(--ok);transition:width .6s var(--ease-out)}',
    '.qa-term-bar i.bad{background:var(--nar)}',
    '.qa-term-end{display:flex;align-items:center;gap:6px}',
    '.qa-req{display:flex;align-items:center;gap:12px;width:100%;min-height:48px;padding:8px 0;border:0;border-top:1px solid var(--line);background:none;color:inherit;font:inherit;text-align:left;cursor:pointer}',
    '.qa-req:first-child{border-top:0}',
    '.qa-req:focus-visible{outline:2px solid var(--focus);outline-offset:2px;border-radius:8px}',
    '.qa-box{flex:none;width:22px;height:22px;display:grid;place-items:center;border:1.5px solid var(--line-2);border-radius:7px;background:var(--surface);transition:background var(--t-base),border-color var(--t-base)}',
    '.qa-box svg{width:14px;height:14px}',
    '.qa-req.ok .qa-box{background:var(--ok);border-color:var(--ok);color:var(--surface)}',
    '.qa-req.ok .qa-box svg{animation:pop-in .3s var(--ease-spring) both}',
    '.qa-req.fail .qa-box{background:var(--zaf-t);border-color:var(--zafaran);color:var(--zafaran-ink)}',
    '.qa-req-t{flex:1;min-width:0;font-size:var(--fs-sm);line-height:1.4}',
    '.qa-req.ok .qa-req-t{color:var(--soft)}',
    '.qa-deliv .tiles{grid-template-columns:repeat(auto-fill,minmax(168px,1fr))}',
    '.qa-tile{position:relative}',
    '.qa-tile[aria-busy="true"]{pointer-events:none}',
    '.qa-tile[aria-busy="true"] .ic{color:transparent}',
    '.qa-tile[aria-busy="true"] .ic::after{content:"";position:absolute;width:18px;height:18px;border-radius:50%;border:2px solid color-mix(in srgb,var(--lacquer) 25%,transparent);border-top-color:var(--lacquer);animation:spin .7s linear infinite}',
    '.qa-tile .badge{position:absolute;top:12px;right:12px}',
    '.qa-paper{display:grid;gap:12px;padding:26px 24px;border:1px solid var(--line);border-radius:var(--r-md);background:var(--surface);box-shadow:var(--sh-1);font-size:.875rem;line-height:1.7}',
    '.qa-paper h3{text-align:center;font-size:1rem;letter-spacing:.04em}',
    '.qa-paper .muted{font-size:var(--fs-xs)}',
    '.qa-loading{display:grid;gap:16px}',
    ':is(.projects,.projects-new,.editor,.editor-nz,.qa) .link.small{font-size:var(--fs-sm)}',
    '@media (max-width:639px){.editor-bar{gap:8px;padding:10px 12px}.editor-prog-tx{display:none}.editor-bar-bot{display:block}.editor-filter{display:flex;width:100%;gap:1px;padding:2px}.editor-filter button{flex:1 1 auto;padding:4px 4px;gap:3px}.editor-filter .editor-fc{min-width:16px;padding:0 4px}}',
    /* keyframes */
    '@keyframes projects-glow{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--zafaran) 60%,transparent),var(--sh-2)}60%{box-shadow:0 0 0 12px transparent,var(--sh-2)}100%{box-shadow:0 0 0 3px var(--zaf-t),var(--sh-1)}}',
    '@keyframes projects-pulse{0%{box-shadow:0 0 0 0 currentColor}70%,100%{box-shadow:0 0 0 6px transparent}}',
    '@keyframes editor-flash{0%,30%{background:var(--zaf-t)}100%{background:transparent}}',
    '@keyframes editor-blink{0%,100%{opacity:1}50%{opacity:.35}}',
    '@keyframes editor-spin{to{transform:rotate(360deg)}}'
  ].join('\n');
  function ensureCss() { App.css('projects', CSS); }

  /* ------------------------------------------------------------------
     6. SHARED UI BITS
     ------------------------------------------------------------------ */
  function dueTone(p) {
    if (p.status === 'delivered') return 'ok';
    var ms = p.due.getTime() - Date.now();
    if (ms < DAY) return 'late';
    if (ms < 3 * DAY) return 'soon';
    return '';
  }
  function dueChip(p, cls) {
    var tone = dueTone(p), ms = p.due.getTime() - Date.now();
    var txt = p.status === 'delivered' ? 'Təhvil verildi · ' + p.due.getDate() + ' ' + MONTHS[p.due.getMonth()]
      : dueLabel(p.due) + (ms < DAY ? ' · ' + leftLabel(ms) : '');
    return h('span', { class: 'projects-due' + (tone ? ' ' + tone : '') + (cls ? ' ' + cls : ''), title: 'Təhvil: ' + dueLabel(p.due) }, p.status === 'delivered' ? ie('check') : ie('clock'), h('span', { text: txt }));
  }
  function qaBadgeBtn(p, onClick) {
    var b = h('button', { class: 'badge projects-qa projects-raise ' + qaCls(p.qa), type: 'button', title: 'QA yoxlamasını aç', 'aria-label': p.qa == null ? 'QA hələ aparılmayıb — yoxla' : 'QA balı ' + p.qa + ' — hesabatı aç' }, ie('shield'), p.qa == null ? 'QA yoxdur' : 'QA ' + p.qa);
    b.addEventListener('click', function (e) { e.stopPropagation(); onClick(); });
    return b;
  }
  function kindTag(p) {
    return p.kind === 'sim'
      ? h('span', { class: 'badge navy', title: 'Məşq layihəsi: real müştəri yoxdur, təsdiqlər Akademiyada XP qazandırır' }, ie('cap'), 'Simulyasiya')
      : h('span', { class: 'badge green dot', title: 'Real müştəri sifarişi' }, 'Real');
  }
  function fieldIc(p) { return p.kind === 'sim' ? ['cap', ''] : p.status === 'delivered' ? ['stamp', 'green'] : p.field === 'Hüquq' || p.field === 'Bank-maliyyə' ? ['file', 'nar'] : p.field === 'Neft-qaz' ? ['chart', 'gold'] : ['book', 'gold']; }
  function emptyBox(S, o) {
    var art = h('div', { class: 'empty-art' });
    var box = h('div', { class: 'empty' }, art, h('h3', { text: o.title }), h('p', { text: o.text }), o.actions && o.actions.length ? h('div', { class: 'actions' }, o.actions) : null);
    S.later(function () { if (art.isConnected) S.mini(art, o.state || 'idle', 88); }, 40);
    return box;
  }

  /* ------------------------------------------------------------------
     7. SCREEN: PROJECTS
     ------------------------------------------------------------------ */
  var TABS = [{ id: 'all', label: 'Hamısı' }, { id: 'active', label: 'Aktiv' }, { id: 'delivered', label: 'Təhvil verilib' }, { id: 'sim', label: 'Simulyasiya' }];
  function ensureCreated(name) {
    var clean = String(name || '').trim(); if (!clean) return null;
    var nice = clean.replace(/\.(docx?|pdf|txt|xliff|xlf|sdlxliff)$/i, '').replace(/[_]+/g, ' ').trim() || clean;
    var list = sget('pj:created', []); if (!Array.isArray(list)) list = [];
    for (var i = 0; i < list.length; i++) if (list[i] && (list[i].name === nice || (list[i].files || []).indexOf(clean) >= 0)) return list[i];
    var prof = {}; try { prof = App.profile(); } catch (e) { /* ignore */ }
    var pair = (prof.pairs && prof.pairs[0]) || 'en-az';
    var field = /contract|agreement|müqavil|muqavil|saziş|nda|договор/i.test(clean) ? 'Hüquq' : 'Ümumi';
    var p = { id: 'u' + Date.now().toString(36), name: nice, client: 'Yeni müştəri', pair: pair, field: field, reg: field === 'Hüquq' ? 'huquqi' : 'resmi', kind: 'real',
      set: setKeyFor(pair, field, clean), due: new Date(Date.now() + 3 * DAY).toISOString(), qa: null, files: clean !== nice ? [clean] : [], created: Date.now() };
    p.words = setWords(p.set);
    list.unshift(p); sset('pj:created', list);
    return p;
  }

  function renderProjects(el, params) {
    ensureCss();
    var S = freshScope('projects');
    params = params || {};
    var hl = params.highlight || null;
    if (params.created && typeof params.created === 'string') { var cp = ensureCreated(params.created); if (cp) hl = cp.id; }
    var st = { q: '', tab: sget('projects:tab', 'all'), view: sget('projects:view', 'cards') };
    if (hl || !TABS.some(function (t) { return t.id === st.tab; })) st.tab = 'all';

    var page = h('div', { class: 'page projects' });
    el.appendChild(page);

    var newBtn = h('button', { class: 'btn btn-primary', type: 'button', onclick: function () { newProjectSheet(function (p) { hl = p.id; st.tab = 'all'; st.q = ''; search.value = ''; draw(); }); } }, ie('plus'), 'Yeni layihə');
    var subP = h('p');
    page.appendChild(h('div', { class: 'page-h' },
      h('div', null, h('span', { class: 'eyebrow', text: 'Peşəkar' }), h('h1', { html: 'Layihələr' }), subP),
      h('div', { class: 'actions' }, newBtn)));

    var stats = h('div', { class: 'stats projects-stats' });
    page.appendChild(h('section', { class: 'card projects-statcard', 'aria-label': 'Ümumi göstəricilər' }, stats));

    var search = h('input', { class: 'input', id: 'projects-q', type: 'search', placeholder: 'Layihə, müştəri və ya sahə axtar', autocomplete: 'off', 'aria-label': 'Layihə axtar' });
    var viewBtns = {};
    var viewSeg = h('div', { class: 'seg sm', role: 'group', 'aria-label': 'Görünüş' }, [['cards', 'grid', 'Kartlar'], ['table', 'list', 'Cədvəl']].map(function (v) {
      var b = h('button', { type: 'button', 'aria-pressed': st.view === v[0] ? 'true' : 'false', onclick: function () { st.view = v[0]; sset('projects:view', v[0]); syncView(); draw(); } }, ie(v[1]), v[2]);
      viewBtns[v[0]] = b; return b;
    }));
    var tabBtns = {};
    var tabs = h('div', { class: 'tabs', role: 'tablist', 'aria-label': 'Layihə filtri' }, TABS.map(function (t) {
      var c = h('span', { class: 'badge' });
      var b = h('button', { type: 'button', role: 'tab', 'aria-selected': st.tab === t.id ? 'true' : 'false', onclick: function () { st.tab = t.id; sset('projects:tab', t.id); syncTabs(); draw(); } }, t.label, c);
      tabBtns[t.id] = { b: b, c: c }; return b;
    }));
    page.appendChild(h('div', { class: 'projects-tools' },
      h('div', { class: 'projects-tools-row' }, h('label', { class: 'input-ic', html: App.icon('search') }, search), viewSeg),
      tabs));
    var host = h('div', { class: 'projects-host' });
    page.appendChild(host);

    var qT = 0;
    search.addEventListener('input', function () { clearTimeout(qT); qT = S.later(function () { st.q = search.value; draw(); }, 140); });
    function syncTabs() { TABS.forEach(function (t) { tabBtns[t.id].b.setAttribute('aria-selected', st.tab === t.id ? 'true' : 'false'); }); }
    function syncView() { Object.keys(viewBtns).forEach(function (k) { viewBtns[k].setAttribute('aria-pressed', st.view === k ? 'true' : 'false'); }); }
    function inTab(p, tab) {
      if (tab === 'active') return p.status !== 'delivered' && p.kind !== 'sim';
      if (tab === 'delivered') return p.status === 'delivered';
      if (tab === 'sim') return p.kind === 'sim';
      return true;
    }
    function matchQ(p, q) {
      if (!q) return true;
      var hay = lower([p.name, p.client, p.field, pairLabel(p.pair), REG[p.reg]].join(' '));
      return lower(q).split(/\s+/).every(function (w) { return !w || hay.indexOf(w) >= 0; });
    }
    function sortList(l) {
      return l.slice().sort(function (a, b) {
        if (hl && a.id === hl) return -1; if (hl && b.id === hl) return 1;
        var da = a.status === 'delivered' ? 1 : 0, db = b.status === 'delivered' ? 1 : 0;
        if (da !== db) return da - db;
        return da ? b.due - a.due : a.due - b.due;
      });
    }
    function draw() {
      var P = allProjects();
      var active = P.filter(function (p) { return p.status !== 'delivered'; });
      var week = active.filter(function (p) { return p.due.getTime() - Date.now() < 7 * DAY; }).length;
      var queue = 0; active.forEach(function (p) { queue += Math.round(p.words * (100 - p.done) / 100); });
      var qs = P.filter(function (p) { return p.qa != null; }), avg = qs.length ? Math.round(qs.reduce(function (s, p) { return s + p.qa; }, 0) / qs.length) : 0;
      var late = active.filter(function (p) { return p.due.getTime() - Date.now() < DAY; }).length;
      subP.textContent = P.length + ' layihə · ' + active.length + ' aktiv' + (late ? ' · ' + late + ' təhvil 24 saat ərzində' : '') + '. Gecikənlər yuxarıdadır.';
      stats.textContent = '';
      [[active.length, 'aktiv layihə'], [week, 'bu həftə təhvil'], [num(queue), 'söz növbədə'], [avg || '—', 'orta QA balı']].forEach(function (s) {
        stats.appendChild(h('div', { class: 'stat' }, h('b', { class: 'tnum', text: String(s[0]) }), h('span', { text: s[1] })));
      });
      TABS.forEach(function (t) { tabBtns[t.id].c.textContent = String(P.filter(function (p) { return inTab(p, t.id); }).length); });
      var list = sortList(P.filter(function (p) { return inTab(p, st.tab) && matchQ(p, st.q); }));
      host.textContent = '';
      if (!list.length) {
        host.appendChild(emptyBox(S, st.q
          ? { title: 'Heç nə tapılmadı', text: '«' + st.q + '» üzrə layihə yoxdur. Müştəri adını və ya dil cütünü yoxlayın.', state: 'think', actions: [h('button', { class: 'btn', type: 'button', onclick: function () { search.value = ''; st.q = ''; draw(); search.focus(); } }, 'Axtarışı təmizlə')] }
          : { title: 'Bu bölmədə layihə yoxdur', text: 'İlk sənədi yükləyin — terminləri və üslubu Nuanza özü tapacaq.', state: 'wave', actions: [h('button', { class: 'btn btn-primary', type: 'button', onclick: function () { newBtn.click(); } }, ie('plus'), 'Layihə yarat')] }));
        return;
      }
      if (st.view === 'table') host.appendChild(tableView(list)); else host.appendChild(h('div', { class: 'projects-grid' }, list.map(card)));
      if (hl) {
        var c = host.querySelector('[data-id="' + hl + '"]');
        if (c) { S.later(function () { try { c.scrollIntoView({ block: 'center', behavior: reduced() ? 'auto' : 'smooth' }); } catch (e) { /* ignore */ } burstAt(c, 'stars'); }, 260); }
        hl = null;
      }
    }
    function openEditor(p) { App.go('editor', { project: p.id }); }
    function card(p) {
      var pr = p.done;
      var fi = fieldIc(p);
      var more = h('button', { class: 'icon-btn ghost sm projects-raise', type: 'button', 'aria-label': 'Əməliyyatlar — ' + p.name, html: App.icon('more') });
      more.addEventListener('click', function (e) { e.stopPropagation(); moreSheet(p); });
      var open = h('button', { class: 'projects-open', type: 'button', 'aria-label': p.name + ' — redaktorda aç' }, h('h3', { text: p.name }));
      open.addEventListener('click', function () { openEditor(p); });
      var c = h('article', { class: 'card projects-card' + (hl === p.id ? ' is-new' : ''), 'data-id': p.id },
        h('div', { class: 'projects-top' }, icTile(fi[0], fi[1]),
          h('div', { class: 'projects-who' }, h('span', { text: p.client }), h('div', { class: 'projects-tags' }, kindTag(p), hl === p.id ? badge('Yeni', 'gold', 'sparkle') : null)),
          more),
        open,
        h('div', { class: 'projects-meta' }, badge(pairLabel(p.pair), 'navy', 'globe'), badge(p.field), badge(REG[p.reg] || 'Neytral', '', 'sliders')),
        h('div', { class: 'projects-prog' },
          h('div', { class: 'projects-prog-l' }, h('span', { text: num(p.words) + ' söz · ' + num(p.segs) + ' seqment' }), h('b', null, String(pr), h('small', { text: '%' }))),
          h('div', { class: 'progress' + (p.status === 'delivered' ? ' green' : pr >= 80 ? ' gold' : ''), role: 'progressbar', 'aria-label': 'Gediş', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(pr) }, h('i', { style: 'width:' + pr + '%' }))),
        h('div', { class: 'projects-foot' }, dueChip(p), qaBadgeBtn(p, function () { App.go('qa', { project: p.id }); })));
      return c;
    }
    function tableView(list) {
      var rows = list.map(function (p) {
        var tr = h('tr', { class: 'clickable', tabindex: '0', 'data-id': p.id, 'aria-label': p.name + ' — redaktorda aç' },
          h('td', null, h('span', { class: 'tx' }, h('b', { text: p.name }), h('small', { text: p.client + (p.kind === 'sim' ? ' · Simulyasiya' : '') }))),
          h('td', null, badge(pairLabel(p.pair), 'navy')),
          h('td', { class: 'num', text: num(p.words) }),
          h('td', null, h('div', { class: 'projects-mini' }, h('div', { class: 'progress thin' + (p.status === 'delivered' ? ' green' : '') }, h('i', { style: 'width:' + p.done + '%' })), h('span', { class: 'small tnum', text: p.done + '%' }))),
          h('td', null, dueChip(p)),
          h('td', null, qaBadgeBtn(p, function () { App.go('qa', { project: p.id }); })));
        tr.addEventListener('click', function () { openEditor(p); });
        tr.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); openEditor(p); } });
        return tr;
      });
      return h('div', { class: 'table-wrap' }, h('table', { class: 'table projects-table' },
        h('thead', null, h('tr', null, h('th', { text: 'Layihə' }), h('th', { text: 'Cüt' }), h('th', { class: 'num', text: 'Söz' }), h('th', { text: 'Gediş' }), h('th', { text: 'Təhvil' }), h('th', { text: 'QA' }))),
        h('tbody', null, rows)));
    }
    function moreSheet(p) {
      var s;
      var rows = [
        { ic: 'edit', cls: 'nar', b: 'Redaktorda aç', s: num(p.segs) + ' seqment · ' + p.done + '% təsdiqlənib', run: function () { openEditor(p); } },
        { ic: 'shield', b: 'QA yoxlaması', s: p.qa == null ? 'Hələ yoxlanmayıb' : 'Son bal: ' + p.qa, run: function () { App.go('qa', { project: p.id }); } },
        p.status === 'delivered'
          ? { ic: 'refresh', b: 'Yenidən aç', s: 'Müştəri düzəliş istəyibsə', run: function () { setMap('pj:status', p.id, 'active'); toast('Layihə yenidən açıldı', 'info', { sub: p.name }); draw(); } }
          : { ic: 'stamp', cls: 'gold', b: 'Təhvil verildi kimi qeyd et', s: 'Layihə arxivə keçir', run: function () {
            setMap('pj:status', p.id, 'delivered'); setMap('pj:prog', p.id, 100);
            toast('Təhvil verildi', 'ok', { sub: p.client + ' — ' + p.name });
            nz('celebrate', 'Təbriklər! Daha bir layihə təhvil verildi.', 2600); draw();
          } },
        { ic: 'trash', b: 'Layihəni sil', s: 'Geri qaytarmaq mümkündür', danger: true, run: function () {
          App.confirm({ title: 'Layihə silinsin?', text: '«' + p.client + ' — ' + p.name + '» və onun ' + num(p.segs) + ' seqmenti siyahıdan silinəcək.', okLabel: 'Sil', danger: true }).then(function (yes) {
            if (!yes) return;
            var node = host.querySelector('[data-id="' + p.id + '"]');
            if (node) node.classList.add('is-gone');
            S.later(function () {
              setMap('pj:removed', p.id, true); draw();
              toast('Layihə silindi', 'info', { sub: p.name, action: { label: 'Geri qaytar', onClick: function () { setMap('pj:removed', p.id); hl = p.id; if (!S.dead) draw(); } } });
            }, 200);
          });
        } }
      ];
      var list = h('div', { class: 'list' }, rows.map(function (r) {
        return h('button', { class: 'list-row' + (r.danger ? ' danger' : ''), type: 'button', onclick: function () { if (s) s.close(); S.later(r.run, 80); } },
          icTile(r.ic, r.cls), h('span', { class: 'tx' }, h('b', { text: r.b }), h('small', { text: r.s })), h('span', { class: 'end', html: App.icon('chevron') }));
      }));
      s = App.sheet({ title: p.name, body: h('div', { class: 'stack' }, h('div', { class: 'row' }, kindTag(p), badge(pairLabel(p.pair), 'navy', 'globe'), dueChip(p)), list) });
    }
    syncTabs(); syncView(); draw();
    if (hl) S.later(function () { nz('celebrate', 'Yeni layihə siyahıdadır! Açın, ilkin tərcüməni başladaq.', 2800); }, 700);
    S.every(function () { if (host.isConnected) { var ae = D.activeElement; if (!host.contains(ae) && !overlayOpen()) draw(); } }, 60000);
  }

  /* «Yeni layihə» sheet — shared with home via App.go('projects') */
  function newProjectSheet(onDone) {
    var timers = [], files = [], reg = 'auto', detected = 'huquqi', touchedName = false;
    var sitSel = {}, reqSel = { 'Türk formaları olmasın': true, 'Müştəri lüğəti məcburi': true };
    var prof = {}; try { prof = App.profile(); } catch (e) { /* ignore */ }
    var d0 = new Date(Date.now() + 3 * DAY);
    var name = h('input', { class: 'input', id: 'pj-new-name', placeholder: 'Məs.: Təchizat müqaviləsi — əlavə №3', autocomplete: 'off' });
    var nameErr = h('span', { class: 'err', hidden: true }, ie('alert'), 'Layihənin adını yazın');
    var client = h('input', { class: 'input', id: 'pj-new-client', placeholder: 'Məs.: AzerGold', autocomplete: 'off' });
    var pairSel = h('select', { class: 'select', id: 'pj-new-pair' }, (App.PAIRS || [{ id: 'en-az', label: 'EN → AZ' }, { id: 'ru-az', label: 'RU → AZ' }]).map(function (pp) { return h('option', { value: pp.id, text: pp.label + (pp.name ? ' · ' + pp.name : '') }); }));
    pairSel.value = (prof.pairs && prof.pairs[0]) || 'en-az';
    var fieldSel = h('select', { class: 'select', id: 'pj-new-field' }, FIELDS.map(function (f) { return h('option', { value: f, text: f }); }));
    fieldSel.value = 'Hüquq';
    var regBtns = {};
    var regSeg = h('div', { class: 'seg block', role: 'group', 'aria-label': 'Üslub' }, [['auto', 'Avto']].concat(REG_IDS.map(function (r) { return [r, REG[r]]; })).map(function (r) {
      var b = h('button', { type: 'button', 'aria-pressed': r[0] === reg ? 'true' : 'false', onclick: function () { reg = r[0]; syncReg(); } }, r[1]);
      regBtns[r[0]] = b; return b;
    }));
    var regHint = h('span', { class: 'hint' });
    function syncReg() {
      Object.keys(regBtns).forEach(function (k) { regBtns[k].setAttribute('aria-pressed', k === reg ? 'true' : 'false'); regBtns[k].classList.toggle('detected', k === detected); });
      regHint.textContent = reg === 'auto' ? 'Nuanza üslubu sənəddən özü tanıyacaq. Hazırda ehtimal: ' + REG[detected] + '.' : 'Üslub əl ilə seçildi: ' + REG[reg] + '.';
    }
    var sitTa = h('textarea', { class: 'textarea', id: 'pj-new-sit', rows: '3', placeholder: 'Sənəd nə üçündür, kim oxuyacaq?' });
    var sitChips = h('div', { class: 'chips' }, SIT_CHIPS.map(function (c) {
      return h('button', { class: 'chip', type: 'button', 'aria-pressed': 'false', onclick: function (e) { sitSel[c] = !sitSel[c]; e.currentTarget.setAttribute('aria-pressed', sitSel[c] ? 'true' : 'false'); } }, c);
    }));
    var reqTa = h('textarea', { class: 'textarea', id: 'pj-new-req', rows: '2', placeholder: 'Məs.: «Employer» — «Sifarişçi»; tarixlər sözlə; ölçü vahidləri SI' });
    var reqChips = h('div', { class: 'chips' }, REQ_CHIPS.map(function (c) {
      return h('button', { class: 'chip', type: 'button', 'aria-pressed': reqSel[c[0]] ? 'true' : 'false', onclick: function (e) { reqSel[c[0]] = !reqSel[c[0]]; e.currentTarget.setAttribute('aria-pressed', reqSel[c[0]] ? 'true' : 'false'); } }, c[0]);
    }));
    var dueD = h('input', { class: 'input', id: 'pj-new-due', type: 'date', value: d0.getFullYear() + '-' + pad(d0.getMonth() + 1) + '-' + pad(d0.getDate()) });
    var dueT = h('input', { class: 'input', id: 'pj-new-time', type: 'time', value: '18:00' });
    var simIn = h('input', { type: 'checkbox', id: 'pj-new-sim' });
    var fileIn = h('input', { type: 'file', id: 'pj-new-file', hidden: true, multiple: true, accept: '.docx,.doc,.pdf,.txt,.xliff,.xlf,.sdlxliff' });
    var dz = h('label', { class: 'dropzone projects-dz', for: 'pj-new-file', tabindex: '0', 'aria-describedby': 'pj-new-dzh' },
      fileIn, icTile('upload', 'nar'), h('b', { text: 'Faylı bura atın və ya seçin' }), h('span', { id: 'pj-new-dzh', text: 'DOCX, PDF, TXT, XLIFF · 50 MB-a qədər' }));
    var fl = h('div', { class: 'projects-files', 'aria-live': 'polite' });
    var sample = h('button', { class: 'link small projects-sample', type: 'button' }, 'Nümunə fayl əlavə et');
    sample.addEventListener('click', function () { addFile({ name: 'Caspian_Service_Agreement_v3.docx', size: 48213 }); });

    dz.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileIn.click(); } });
    ['dragenter', 'dragover'].forEach(function (ev) { dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.add('over'); }); });
    ['dragleave', 'dragend'].forEach(function (ev) { dz.addEventListener(ev, function () { dz.classList.remove('over'); }); });
    dz.addEventListener('drop', function (e) {
      e.preventDefault(); dz.classList.remove('over');
      var fs = e.dataTransfer && e.dataTransfer.files; if (fs) for (var i = 0; i < fs.length; i++) addFile(fs[i]);
    });
    fileIn.addEventListener('change', function () { var fs = fileIn.files; if (fs) for (var i = 0; i < fs.length; i++) addFile(fs[i]); fileIn.value = ''; });
    name.addEventListener('input', function () { touchedName = true; if (name.value.trim()) { name.removeAttribute('aria-invalid'); nameErr.hidden = true; } });

    function guessReg(fn) {
      if (/contract|agreement|müqavil|muqavil|saziş|sazis|nda|договор|соглашен|etibarnam/i.test(fn)) return 'huquqi';
      if (/report|hesabat|отчет|отчёт|letter|məktub/i.test(fn)) return 'resmi';
      if (/guide|bələdçi|beledci|app|ui|strings|manual|təlimat/i.test(fn)) return 'neytral';
      if (/post|social|chat/i.test(fn)) return 'danisiq';
      return 'resmi';
    }
    function addFile(f) {
      var ext = String(f.name || '').split('.').pop().toLowerCase();
      if (['docx', 'doc', 'pdf', 'txt', 'xliff', 'xlf', 'sdlxliff'].indexOf(ext) < 0) { toast('«' + f.name + '» dəstəklənmir', 'err', { sub: 'DOCX, PDF, TXT və ya XLIFF seçin' }); return; }
      if (files.length >= 5) { toast('Ən çox 5 fayl', 'warn', { sub: 'Böyük paketləri ZIP kimi Telegram botuna göndərin' }); return; }
      var words = clamp(Math.round((f.size || 30000) / (ext === 'pdf' ? 9 : ext === 'txt' ? 6 : 14) / 10) * 10, 240, 18000);
      var bi = h('i', { style: 'width:0%' });
      var bar = h('div', { class: 'progress thin', role: 'progressbar', 'aria-label': 'Yükləmə', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': '0' }, bi);
      var pct = h('span', { class: 'projects-file-pct', text: '0%' });
      var meta = h('small', { text: sizeLabel(f.size) + ' · yüklənir…' });
      var x = h('button', { class: 'icon-btn ghost sm', type: 'button', 'aria-label': 'Faylı sil — ' + f.name, html: App.icon('x') });
      var row = h('div', { class: 'projects-file' }, icTile(ext === 'pdf' ? 'file' : /^x|sdl/.test(ext) ? 'layers' : 'file', ext === 'pdf' ? 'nar' : 'gold'),
        h('div', { class: 'projects-file-tx' }, h('b', { text: f.name, title: f.name }), meta, bar), pct, x);
      var rec = { name: f.name, size: f.size || 0, ext: ext, words: words, done: false, row: row };
      files.push(rec); fl.appendChild(row);
      x.addEventListener('click', function () { rec.dead = true; files.splice(files.indexOf(rec), 1); if (row.parentNode) row.parentNode.removeChild(row); });
      var v = 0;
      var iv = setInterval(function () {
        if (rec.dead || !row.isConnected) { clearInterval(iv); return; }
        v = Math.min(100, v + 5 + Math.random() * 15);
        bi.style.width = v + '%'; pct.textContent = Math.round(v) + '%'; bar.setAttribute('aria-valuenow', String(Math.round(v)));
        if (v >= 100) {
          clearInterval(iv);
          meta.textContent = sizeLabel(f.size) + ' · analiz edilir…'; pct.textContent = ''; pct.appendChild(h('span', { class: 'spinner', 'aria-hidden': 'true' }));
          timers.push(setTimeout(function () {
            if (rec.dead) return;
            rec.done = true; detected = guessReg(f.name); syncReg();
            meta.textContent = sizeLabel(f.size) + ' · ~' + num(words) + ' söz · ' + REG[detected] + ' (avto)';
            pct.textContent = ''; pct.appendChild(badge('Hazır', 'green', 'check'));
            if (!touchedName && !name.value.trim()) name.value = f.name.replace(/\.[^.]+$/, '').replace(/[_]+/g, ' ').replace(/\s+/g, ' ').trim();
          }, 650));
        }
      }, 130);
      timers.push(iv);
    }

    var privacy = h('div', { class: 'callout navy' }, ie('lock'), h('div', null, h('b', { text: 'Məxfilik: ' }), 'fayllar şifrələnmiş saxlanılır, modelin öyrədilməsində istifadə edilmir və layihə bağlandıqdan 30 gün sonra avtomatik silinir. NDA tələb edən sənədlər üçün «Lokal rejim»i ayarlardan aktiv edin.'));
    var body = h('div', { class: 'projects-new' },
      h('div', { class: 'field' }, h('label', { for: 'pj-new-name' }, 'Layihənin adı'), name, nameErr),
      h('div', { class: 'grid-2' },
        h('div', { class: 'field' }, h('label', { for: 'pj-new-client' }, 'Müştəri ', h('span', { class: 'opt', text: 'istəyə görə' })), client),
        h('div', { class: 'field' }, h('label', { for: 'pj-new-pair' }, 'Dil cütü'), pairSel)),
      h('div', { class: 'grid-2' },
        h('div', { class: 'field' }, h('label', { for: 'pj-new-field' }, 'Sahə'), fieldSel),
        h('div', { class: 'field' }, h('span', { class: 'label' }, 'Təhvil'), h('div', { class: 'grid-2', style: 'gap:8px;grid-template-columns:minmax(0,1.4fr) minmax(0,1fr)' }, dueD, dueT))),
      h('div', { class: 'field' }, h('span', { class: 'label' }, 'Üslub'), regSeg, regHint),
      h('section', { class: 'projects-sec' }, h('h3', { text: 'Sənəd' }), dz, fl, sample),
      h('section', { class: 'projects-sec' }, h('h3', { text: 'Situasiya' }),
        h('div', { class: 'field' }, h('label', { for: 'pj-new-sit' }, 'Sənəd nə üçündür, kim oxuyacaq?'), sitChips, sitTa, h('span', { class: 'hint', text: 'Məqsəd və oxucu üslubu, termin seçimini və hətta söz sırasını dəyişir.' }))),
      h('section', { class: 'projects-sec' }, h('h3', { text: 'Müştərinin tələbləri' }), reqChips,
        h('div', { class: 'field' }, h('label', { class: 'sr-only', for: 'pj-new-req' }, 'Əlavə tələblər'), reqTa, h('span', { class: 'hint', text: 'Hər sətir ayrıca tələb kimi QA siyahısına düşür.' }))),
      h('div', { class: 'list' }, h('div', { class: 'list-row' }, icTile('cap'), h('span', { class: 'tx' }, h('b', { text: 'Məşq layihəsi (simulyasiya)' }), h('small', { text: 'Real müştəri yoxdur — təsdiqlər Akademiyada XP qazandırır' })), h('span', { class: 'end' }, h('label', { class: 'switch' }, simIn, h('span'))))),
      privacy);
    syncReg();

    function create() {
      var n = name.value.trim();
      if (!n) { name.setAttribute('aria-invalid', 'true'); nameErr.hidden = false; name.focus(); nz('worried', 'Layihəyə bir ad verək?', 1800); return false; }
      if (files.some(function (f) { return !f.done; })) { toast('Fayl hələ yüklənir…', 'info', { sub: 'Bir neçə saniyə gözləyin' }); return false; }
      var pair = pairSel.value || 'en-az', field = fieldSel.value || 'Hüquq', key = setKeyFor(pair, field, n + ' ' + files.map(function (f) { return f.name; }).join(' '));
      var due = new Date(dueD.value + 'T' + (dueT.value || '18:00'));
      if (isNaN(due)) due = new Date(Date.now() + 3 * DAY);
      var purposeBits = SIT_CHIPS.filter(function (c) { return sitSel[c]; });
      var purpose = (purposeBits.length ? purposeBits.join(', ') + '. ' : '') + sitTa.value.trim();
      var reqs = REQ_CHIPS.filter(function (c) { return reqSel[c[0]]; }).map(function (c) { return [c[0], c[1]]; });
      reqTa.value.split(/\n|;/).forEach(function (l) { l = l.trim(); if (l) reqs.push([l, null]); });
      reqs.push(['Bütün seqmentlər tərcümə edilməli', 'complete']);
      var words = files.reduce(function (s, f) { return s + f.words; }, 0) || setWords(key);
      var p = { id: 'u' + Date.now().toString(36), name: n, client: client.value.trim() || 'Şəxsi sifariş', pair: pair, field: field,
        reg: reg === 'auto' ? detected : reg, words: words, set: key, due: due.toISOString(), qa: null, kind: simIn.checked ? 'sim' : 'real',
        sit: { purpose: purpose || 'Göstərilməyib', audience: '', note: '' }, reqs: reqs, files: files.map(function (f) { return f.name; }), created: Date.now() };
      var list = sget('pj:created', []); if (!Array.isArray(list)) list = [];
      list.unshift(p); sset('pj:created', list);
      toast('Layihə yaradıldı', 'ok', { sub: p.client + ' — ' + n + ' · ' + REG[p.reg], action: { label: 'Redaktorda aç', onClick: function () { App.go('editor', { project: p.id }); } } });
      nz('celebrate', 'Yeni layihə! Redaktorda «AI ilkin tərcümə» ilə başlayaq.', 3000);
      if (typeof onDone === 'function') setTimeout(function () { onDone(p); }, 120);
      else setTimeout(function () { App.go('projects', { highlight: p.id }); }, 200);
      return true;
    }
    App.sheet({ title: 'Yeni layihə', body: body, wide: true,
      onClose: function () { timers.forEach(function (t) { clearTimeout(t); clearInterval(t); }); files.forEach(function (f) { f.dead = true; }); },
      actions: [{ label: 'Ləğv et', kind: 'ghost' }, { label: 'Layihə yarat', kind: 'primary', icon: 'plus', onClick: create }] });
    setTimeout(function () { try { name.focus(); } catch (e) { /* ignore */ } }, 120);
  }

  /* ------------------------------------------------------------------
     8. SCREEN: EDITOR
     ------------------------------------------------------------------ */
  var FILTERS = [{ id: 'all', label: 'Hamısı' }, { id: 'empty', label: 'Boş' }, { id: 'unrev', label: 'Yoxlanmamış' }, { id: 'risk', label: 'Riskli' }];
  var greeted = {};
  function noProject(S) {
    return h('div', { class: 'page' }, emptyBox(S, { title: 'Layihə tapılmadı', text: 'Bu layihə silinib və ya hələ yaradılmayıb.', state: 'sad',
      actions: [h('button', { class: 'btn btn-primary', type: 'button', onclick: function () { App.go('projects'); } }, 'Layihələrə qayıt')] }));
  }

  function renderEditor(el, params) {
    ensureCss();
    var S = freshScope('editor');
    params = params || {};
    var p = resolveProject(params);
    if (!p) { el.appendChild(noProject(S)); return; }
    sset('pj:last', p.id);
    var set = setOf(p), gl = glossOf(p), ctx = { set: set, gl: gl };
    var segs = loadSegs(p);
    var rows = [], filter = 'all', terms = {}, cur = null, allOkBefore = null, approvals = 0;
    var regNow = sget('pj:reg:' + p.id, p.reg);
    var page = h('div', { class: 'page editor' });
    el.appendChild(page);

    /* header */
    var aiBtn = h('button', { class: 'btn btn-secondary', type: 'button' }, ie('sparkle'), 'AI ilkin tərcümə');
    aiBtn.addEventListener('click', runAI);
    var qaBtn = h('button', { class: 'btn', type: 'button', onclick: function () { flushSave(); App.go('qa', { project: p.id }); } }, ie('shield'), 'QA');
    var dueTxt = p.status === 'delivered' ? 'təhvil verilib' : 'təhvil ' + lcFirst(dueLabel(p.due));
    page.appendChild(h('div', { class: 'editor-top' },
      h('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: function () { App.go('projects'); } }, ie('back'), 'Layihələr'),
      h('div', { class: 'row' }, kindTag(p), dueChip(p))));
    page.appendChild(h('div', { class: 'page-h' },
      h('div', null, h('span', { class: 'eyebrow', text: p.client + ' · ' + pairLabel(p.pair) }), h('h1', { text: p.name }),
        h('p', { text: (REG[regNow] || 'Neytral') + ' · ' + num(p.words) + ' söz · ' + num(p.segs) + ' seqment · ' + dueTxt })),
      h('div', { class: 'actions' }, qaBtn, aiBtn)));

    /* sticky bar */
    var progI = h('i', { style: 'width:0%' });
    var progBar = h('div', { class: 'progress', role: 'progressbar', 'aria-label': 'Layihənin gedişi', 'aria-valuemin': '0', 'aria-valuemax': '100' }, progI);
    var pctTx = h('b', { class: 'tnum' }), progTx = h('span', { class: 'editor-prog-tx tnum' });
    var saveTx = h('span', { text: 'Yadda saxlanıldı' }), saveEl = h('span', { class: 'editor-save', role: 'status' }, h('i', { 'aria-hidden': 'true' }), saveTx);
    var fBtns = {};
    var fSeg = h('div', { class: 'seg sm editor-filter', role: 'group', 'aria-label': 'Seqment filtri' }, FILTERS.map(function (f) {
      var c = h('span', { class: 'editor-fc' });
      var b = h('button', { type: 'button', 'aria-pressed': f.id === filter ? 'true' : 'false', onclick: function () { setFilter(f.id); } }, f.label, c);
      fBtns[f.id] = { b: b, c: c }; return b;
    }));
    var bar = h('div', { class: 'editor-bar' },
      h('div', { class: 'editor-bar-top' }, h('span', { class: 'editor-sec', text: set.title }), saveEl),
      h('div', { class: 'editor-bar-prog' }, progBar, pctTx),
      h('div', { class: 'editor-bar-bot' }, progTx, fSeg));
    page.appendChild(bar);

    /* fresh project: start card */
    var startCard = h('section', { class: 'card lacquer editor-start', hidden: true },
      h('span', { class: 'eyebrow', text: 'Başlayaq' }),
      h('div', { class: 'editor-start-row' },
        h('div', { class: 'stack-sm', style: 'max-width:46ch' }, h('h2', { html: 'Sənəd hazırdır — <em>' + set.segs.length + ' seqment</em> gözləyir' }),
          h('p', { class: 'muted', text: 'Mirzə Məclisi ilkin tərcüməni hazırlasın: lüğət, tərcümə yaddaşı və üslub nəzərə alınacaq. Sonra hər seqmenti siz təsdiqləyirsiniz.' })),
        h('button', { class: 'btn btn-primary btn-lg', type: 'button', onclick: runAI }, ie('sparkle'), 'AI ilkin tərcümə')));
    page.appendChild(startCard);

    /* context: situation + glossary */
    var sit = sitOf(p);
    var sitOpen = sget('editor:sit-open', null);
    if (sitOpen === null) sitOpen = !!(App.isDesktop && App.isDesktop());
    sitOpen = !!sitOpen;
    var sitSum = h('small');
    var sitBody = h('div', { class: 'editor-sit-b', id: 'editor-sit-b', hidden: !sitOpen });
    var sitBtn = h('button', { class: 'editor-sit-h', type: 'button', 'aria-expanded': sitOpen ? 'true' : 'false', 'aria-controls': 'editor-sit-b' },
      icTile('target', 'gold'), h('span', { class: 'tx' }, h('span', { class: 'eyebrow plain', text: 'Situasiya' }), h('b', { text: 'Kimə, nə üçün?' }), sitSum), ie('chevron'));
    sitBtn.addEventListener('click', function () {
      sitOpen = !sitOpen; sitBody.hidden = !sitOpen; sitBtn.setAttribute('aria-expanded', sitOpen ? 'true' : 'false'); sset('editor:sit-open', sitOpen);
    });
    var regBtns = {};
    var regSeg = h('div', { class: 'seg sm block', role: 'group', 'aria-label': 'Üslub' }, REG_IDS.map(function (r) {
      var b = h('button', { type: 'button', 'aria-pressed': r === regNow ? 'true' : 'false', class: r === p.reg ? 'detected' : null, title: r === p.reg ? 'Avtomatik tanındı' : null, onclick: function () { setReg(r); } }, REG[r]);
      regBtns[r] = b; return b;
    }));
    function setReg(r) {
      if (r === regNow) return;
      regNow = r; sset('pj:reg:' + p.id, r);
      Object.keys(regBtns).forEach(function (k) { regBtns[k].setAttribute('aria-pressed', k === r ? 'true' : 'false'); });
      drawSit();
      toast('Üslub: ' + REG[r], 'info', { sub: r === p.reg ? 'Avtomatik tanınan üsluba qayıtdınız' : 'Növbəti AI qaralamaları bu üsluba uyğunlaşacaq', icon: 'sliders' });
      nz('write', r === 'danisiq' && p.reg === 'huquqi' ? 'Müqavilədə danışıq üslubu? Əminsiniz?' : 'Üslubu ' + REG[r] + ' etdim.', 2400);
    }
    function drawSit() {
      sit = sitOf(p);
      sitSum.textContent = REG[regNow] + ' · ' + (sit.audience && sit.audience !== 'Göstərilməyib' ? sit.audience : sit.purpose);
      sitBody.textContent = '';
      sitBody.appendChild(h('div', { class: 'editor-sit-row' }, h('span', { text: 'Məqsəd' }), h('p', { text: sit.purpose || '—' })));
      if (sit.audience) sitBody.appendChild(h('div', { class: 'editor-sit-row' }, h('span', { text: 'Oxucu' }), h('p', { text: sit.audience })));
      if (sit.note) sitBody.appendChild(h('div', { class: 'callout' }, ie('message'), h('div', { text: sit.note })));
      sitBody.appendChild(h('div', { class: 'field' }, h('span', { class: 'label' }, 'Üslub', h('span', { class: 'opt', text: 'nöqtə — avtomatik tanınan' })), regSeg,
        h('span', { class: 'hint', text: p.reg === 'huquqi' ? 'Hüquqi tanındı: «shall» öhdəlikləri, müəyyən edilmiş terminlər, tərəflərin adları.' : 'Avtomatik tanındı: ' + REG[p.reg] + '.' })));
      sitBody.appendChild(h('button', { class: 'link small', type: 'button', style: 'justify-self:start', onclick: editSit }, 'Situasiyanı dəyiş'));
    }
    function editSit() {
      var pu = h('textarea', { class: 'textarea', id: 'editor-sit-pu', rows: '3', value: sit.purpose || '' });
      var au = h('input', { class: 'input', id: 'editor-sit-au', value: sit.audience || '' });
      App.sheet({ title: 'Situasiya', body: h('div', { class: 'stack' },
        h('div', { class: 'field' }, h('label', { for: 'editor-sit-pu' }, 'Sənəd nə üçündür?'), pu),
        h('div', { class: 'field' }, h('label', { for: 'editor-sit-au' }, 'Kim oxuyacaq?'), au, h('span', { class: 'hint', text: 'Nuanza bu məlumatla termin və üslub seçir.' }))),
        actions: [{ label: 'Ləğv et', kind: 'ghost' }, { label: 'Saxla', kind: 'primary', onClick: function () {
          var v = { purpose: pu.value.trim() || 'Göstərilməyib', audience: au.value.trim(), note: sit.note || '' };
          sset('pj:sit:' + p.id, v); p.sit = null; drawSit();
          toast('Situasiya yeniləndi', 'ok', { sub: 'Növbəti qaralamalar buna uyğunlaşacaq' }); nz('read', 'Aydındır, oxucunu nəzərə alıram.', 2200);
        } }] });
    }
    drawSit();
    var sitCard = h('section', { class: 'card framed editor-sit' }, sitBtn, sitBody);

    var glChips = h('div', { class: 'chips' });
    var glCount = h('span', { class: 'badge navy' });
    function drawGl() {
      glChips.textContent = '';
      glCount.textContent = gl.length + ' termin';
      gl.forEach(function (g) {
        var bad = h('span', { class: 'editor-gl-bad', hidden: true });
        var c = h('button', { class: 'chip', type: 'button', 'aria-pressed': terms[g.a] ? 'true' : 'false', title: g.note || ('«' + g.a + '» → «' + g.b + '»') },
          h('b', { text: g.a }), h('span', { class: 'editor-arrow', text: '→' }), h('span', { text: g.b }), bad);
        c._bad = bad; c._g = g;
        c.addEventListener('click', function () {
          terms[g.a] = !terms[g.a]; c.setAttribute('aria-pressed', terms[g.a] ? 'true' : 'false');
          rows.forEach(function (r) { r.src.innerHTML = srcHTML(r); });
          if (terms[g.a]) {
            var hits = rows.filter(function (r) { return srcHas(r.d.s, g); }).length;
            toast('«' + g.a + '» işarələndi', 'info', { sub: hits ? hits + ' seqmentdə · təsdiqlənmiş tərcümə: «' + g.b + '»' : 'Bu bölmədə rast gəlinmir', icon: 'book', ms: 2400 });
          }
        });
        glChips.appendChild(c);
      });
      glChips.appendChild(h('button', { class: 'chip editor-gl-add', type: 'button', onclick: addTerm }, ie('plus'), 'Termin'));
    }
    function addTerm() {
      var a = h('input', { class: 'input', id: 'editor-gl-a', placeholder: set.src === 'ru' ? 'Məs.: поручитель' : 'Məs.: Subcontractor', autocomplete: 'off' });
      var b = h('input', { class: 'input', id: 'editor-gl-b', placeholder: 'Məs.: Subpodratçı', autocomplete: 'off' });
      App.sheet({ title: 'Lüğətə termin', body: h('div', { class: 'stack' },
        h('div', { class: 'grid-2' }, h('div', { class: 'field' }, h('label', { for: 'editor-gl-a' }, 'Mənbə · ' + upper(set.src)), a), h('div', { class: 'field' }, h('label', { for: 'editor-gl-b' }, 'Tərcümə · AZ'), b)),
        h('p', { class: 'small muted', text: 'Lüğətçi Mirzə bu termini bütün layihədə qoruyacaq və uyğunsuzluqları QA-da göstərəcək.' })),
        actions: [{ label: 'Ləğv et', kind: 'ghost' }, { label: 'Əlavə et', kind: 'primary', icon: 'plus', onClick: function () {
          var av = a.value.trim(), bv = b.value.trim();
          if (!av || !bv) { (av ? b : a).setAttribute('aria-invalid', 'true'); (av ? b : a).focus(); return false; }
          var ex = sget('pj:gl:' + p.id, []); if (!Array.isArray(ex)) ex = [];
          ex.push({ a: av, b: bv }); sset('pj:gl:' + p.id, ex);
          gl = glossOf(p); ctx.gl = gl; drawGl(); refreshAll();
          toast('Termin lüğətə əlavə edildi', 'ok', { sub: '«' + av + '» → «' + bv + '»', icon: 'book' });
          nz('success', 'Yadda saxladım: «' + av + '» həmişə «' + bv + '» olacaq.', 2600);
        } }] });
    }
    drawGl();
    var glCard = h('section', { class: 'card editor-gl' },
      h('div', { class: 'card-h' }, h('div', null, h('span', { class: 'eyebrow', text: 'Lüğət' }), h('h2', { text: 'Layihə terminləri' })), glCount),
      glChips, h('p', { class: 'small muted', style: 'margin-top:10px', text: 'Termini seçin — mənbədə işarələnəcək. Qırmızı rəqəm lüğətə uyğun olmayan istifadəni göstərir.' }));
    page.appendChild(h('div', { class: 'grid-2 editor-ctx' }, sitCard, glCard));

    /* segment list */
    var listEl = h('div', { class: 'seg-editor editor-list', role: 'list', 'aria-label': 'Seqmentlər' });
    listEl.appendChild(h('div', { class: 'seg-head', 'aria-hidden': 'true' }, h('span', { text: '#' }), h('span', { text: 'Mənbə · ' + upper(set.src) }), h('span', { text: 'Tərcümə · AZ' }), h('span')));
    set.segs.forEach(function (d, i) {
      var r = buildRow(d, i); rows.push(r); listEl.appendChild(r.row);
      if (d.q) { r.ask = buildAsk(r); listEl.appendChild(r.ask); }
    });
    var emptyHost = h('div', { class: 'editor-empty', hidden: true });
    listEl.appendChild(emptyHost);
    var keys = h('div', { class: 'editor-keys', 'aria-label': 'Klaviatura qısayolları' },
      h('span', null, h('kbd', { class: 'kbd', text: MOD }), '+', h('kbd', { class: 'kbd', text: 'Enter' }), ' təsdiqlə'),
      h('span', null, h('kbd', { class: 'kbd', text: 'Alt' }), '+', h('kbd', { class: 'kbd', text: '↓' }), ' növbəti'),
      h('span', null, h('kbd', { class: 'kbd', text: 'Alt' }), '+', h('kbd', { class: 'kbd', text: '↑' }), ' əvvəlki'),
      h('span', null, h('kbd', { class: 'kbd', text: MOD }), '+', h('kbd', { class: 'kbd', text: 'K' }), ' axtar'));
    listEl.appendChild(h('div', { class: 'editor-foot' }, keys,
      h('div', { class: 'conf-legend' }, h('span', { class: 'conf-high', text: 'Əmin' }), h('span', { class: 'conf-mid', text: 'Yoxlayın' }), h('span', { class: 'conf-low', text: 'Şübhəli' }))));
    page.appendChild(listEl);

    /* --- rows --- */
    function srcHas(s, g) { return new RegExp('(^|[^\\p{L}])' + reEsc(g.hl || g.a), 'iu').test(srcFor(s, g)); }
    function srcHTML(r) {
      var s = esc(r.d.s), list = [];
      gl.forEach(function (g) { if (terms[g.a]) list.push(g.hl || g.a); });
      var qw = r.d.q && !r.st.ans ? r.d.q.word : null;
      if (qw) list.push(qw);
      if (!list.length) return s;
      var re = new RegExp('(^|[^\\p{L}])(' + list.map(reEsc).join('|') + ')(\\p{L}*)', 'giu');
      return s.replace(re, function (m, pre, w, suf) {
        if (qw && !suf && lower(w) === lower(qw)) return pre + '<span class="conf-low editor-they" title="Kimə aiddir? Nuanza soruşur">' + w + '</span>';
        return pre + '<mark class="editor-mark">' + w + suf + '</mark>';
      });
    }
    function fit(ta) { if (!ta.isConnected) return; ta.style.height = 'auto'; ta.style.height = (ta.scrollHeight + 2) + 'px'; }
    function buildRow(d, i) {
      var n = i + 1, st = segs[i];
      var r = { d: d, st: st, n: n, i: i, issues: [] };
      r.src = h('div', { class: 'seg-src', lang: set.src });
      r.ta = h('textarea', { class: 'seg-tgt', rows: '2', lang: 'az', spellcheck: 'true', placeholder: 'Tərcümə…', 'aria-label': 'Seqment ' + n + ' — tərcümə', value: st.t });
      r.stEl = h('span', { class: 'seg-st', 'aria-hidden': 'true' });
      r.hints = h('div', { class: 'editor-hints', hidden: true });
      r.pill = h('span', { class: 'badge editor-pill' });
      r.confTx = h('span');
      r.conf = h('span', { class: 'editor-conf' }, h('span', { class: 'editor-bars', 'aria-hidden': 'true' }, h('i'), h('i'), h('i')), r.confTx);
      r.tm = d.tm ? h('button', { class: 'chip editor-tm', type: 'button', title: 'Tərcümə yaddaşı: ' + d.tm.from, onclick: function () { tmSheet(r); } }, ie('database'), 'TM ' + d.tm.pct + '%') : null;
      r.note = h('span', { class: 'badge gold', hidden: !st.note, title: st.note || '' }, ie('message'), 'Qeyd');
      r.okTx = h('span', { text: 'Təsdiqlə' });
      r.okBtn = h('button', { class: 'btn btn-sm editor-ok', type: 'button', 'aria-pressed': 'false' }, ie('check'), r.okTx);
      r.nzBtn = h('button', { class: 'icon-btn sm ghost editor-nzb', type: 'button', title: 'Nuanza', 'aria-label': 'Nuanza menyusu — seqment ' + n, html: App.logo ? App.logo('logo') : App.icon('sparkle') });
      r.meta = h('div', { class: 'seg-meta' }, r.pill, r.conf, r.tm, r.note, h('span', { class: 'editor-actions' }, r.okBtn, r.nzBtn));
      r.row = h('div', { class: 'seg-row', role: 'listitem', 'data-n': String(n) }, h('span', { class: 'seg-n', text: String(n) }), r.src, r.ta, r.stEl, r.hints, r.meta);
      r.okBtn.addEventListener('click', function () { if (r.st.ok) unapprove(r); else approve(r); });
      r.nzBtn.addEventListener('click', function () { nzMenu(r); });
      var tmr = 0;
      r.ta.addEventListener('input', function () {
        fit(r.ta);
        r.st.t = r.ta.value; r.st.ed = true; r.st.c = null;
        if (!r.st.o) r.st.o = 'human';
        if (r.st.ok) r.st.ok = false;
        clearTimeout(tmr); tmr = S.later(function () { updateRow(r); updateAll(); }, 260);
        scheduleSave();
      });
      r.ta.addEventListener('focus', function () { setActive(r); });
      updateRow(r);
      return r;
    }
    function setActive(r) {
      if (cur && cur !== r) cur.row.classList.remove('active');
      cur = r; r.row.classList.add('active');
    }
    function pillOf(st) {
      if (!String(st.t || '').trim()) return ['Boş', 'badge', 'dot'];
      if (st.ok) return ['Təsdiq', 'badge green', 'check'];
      if (st.ed) return ['Redaktə', 'badge', 'edit'];
      if (st.o === 'tm') return ['Yaddaşdan', 'badge gold', 'copy'];
      return ['AI', 'badge navy', 'sparkle'];
    }
    function updateRow(r) {
      var st = r.st, t = String(st.t || '').trim();
      r.issues = analyze(r.d, st, ctx);
      var conf = confOf(r.d, st, r.issues);
      var pl = pillOf(st);
      r.pill.className = pl[1] + ' editor-pill'; r.pill.innerHTML = App.icon(pl[2]) + esc(pl[0]);
      r.conf.hidden = !conf;
      r.conf.className = 'editor-conf' + (conf ? ' ' + conf : '');
      r.confTx.textContent = conf ? CONF_L[conf] : '';
      var cnote = st.c && st.o === 'ai' ? st.cn || '' : '';
      r.conf.title = conf === 'high' ? 'Mühərrik əmindir' : conf === 'mid' ? 'Yoxlamağa dəyər: ' + (r.issues[0] ? r.issues[0].text : (cnote || r.d.why || '')) : conf === 'low' ? 'Şübhəli: ' + (r.issues[0] ? r.issues[0].text : cnote) : '';
      r.ta.classList.toggle('editor-t-mid', conf === 'mid' && !st.ok);
      r.ta.classList.toggle('editor-t-low', conf === 'low' && !st.ok);
      var high = r.issues.some(function (x) { return x.sev === 'high'; });
      r.stEl.className = 'seg-st' + (st.ok ? ' ok' : !t ? '' : high ? ' err' : r.issues.length ? ' warn' : '');
      r.stEl.innerHTML = st.ok ? App.icon('check') : t && r.issues.length ? App.icon('alert') : '';
      r.okBtn.setAttribute('aria-pressed', st.ok ? 'true' : 'false');
      r.okTx.textContent = st.ok ? 'Təsdiqləndi' : 'Təsdiqlə';
      r.okBtn.title = st.ok ? 'Təsdiqi geri al' : 'Təsdiqlə (' + MOD + ' + Enter)';
      r.row.classList.toggle('is-ok', !!st.ok);
      r.note.hidden = !st.note; r.note.title = st.note || '';
      drawHints(r);
      r.src.innerHTML = srcHTML(r);
      if (r.ask && r.ask._draw) r.ask._draw();
    }
    function drawHints(r) {
      var list = r.issues.filter(function (x) { return x.type !== 'Boş seqment'; });
      r.hints.textContent = '';
      r.hints.hidden = !list.length;
      list.slice(0, 3).forEach(function (iss) {
        var tx = h('span', { class: 'editor-hint-tx', title: iss.text }, h('b', { text: iss.type + ':' }));
        if (iss.was && iss.now) { tx.appendChild(h('s', { text: iss.was })); tx.appendChild(D.createTextNode(' → ')); tx.appendChild(h('ins', { text: iss.now })); }
        else tx.appendChild(D.createTextNode(iss.text));
        var act = null;
        if (iss.fix === 'word' || iss.fix === 'raw') {
          act = h('button', { class: 'btn btn-sm btn-ghost', type: 'button', 'aria-label': 'Düzəlt: ' + iss.was + ' → ' + iss.now }, ie('wand'), 'Düzəlt');
          act.addEventListener('click', function () { fixRow(r, iss, act); });
        } else if (iss.fix === 'ask' && r.ask) {
          act = h('button', { class: 'btn btn-sm btn-ghost', type: 'button' }, ie('help'), 'Cavabla');
          act.addEventListener('click', function () { r.ask._hide = false; r.ask.hidden = false; r.ask._mini = false; r.ask._draw(); var b = r.ask.querySelector('.editor-ask-opts .btn'); if (b) b.focus(); });
        }
        r.hints.appendChild(h('div', { class: 'editor-hint ' + iss.sev }, tx, act));
      });
      if (list.length > 3) r.hints.appendChild(h('span', { class: 'small muted', text: '+' + (list.length - 3) + ' qeyd daha — QA-da' }));
    }
    function setText(r, text, o) {
      if (text !== r.st.t) { r.st.c = null; r.st.cn = ''; } /* the engine's confidence described the old text */
      r.ta.value = text; r.st.t = text; fit(r.ta);
      if (o) { r.st.o = o.o || r.st.o; if (o.ed != null) r.st.ed = o.ed; }
      updateRow(r); updateAll(); scheduleSave();
    }
    function fixRow(r, iss, btn) {
      var nt = applyFix(r.d, r.st, iss);
      if (nt == null) { toast('Düzəliş tətbiq olunmadı', 'warn', { sub: 'Mətn artıq dəyişib' }); return; }
      burstAt(btn, iss.type === 'Türk forması' ? 'ink' : 'stars');
      setText(r, nt, { ed: true });
      var elder = ELDER[iss.type] || 'Nuanza';
      toast('Düzəldildi', 'ok', { sub: '#' + r.n + ' · ' + iss.was + ' → ' + iss.now + ' · ' + elder, ms: 2600 });
      if (!r.issues.length) nz('success', iss.type === 'Türk forması' ? 'Dilçi Nənə razıdır!' : 'Bu seqment artıq təmizdir.', 1800);
    }
    function approve(r, viaKey) {
      var st = r.st;
      if (!String(st.t || '').trim()) {
        toast('Boş seqment təsdiqlənmir', 'warn', { sub: 'Tərcüməni yazın və ya «AI ilkin tərcümə»ni işə salın' });
        try { r.ta.focus(); } catch (e) { /* ignore */ }
        return Promise.resolve(false);
      }
      if (st.ok) return Promise.resolve(true);
      var high = r.issues.filter(function (x) { return x.sev === 'high'; });
      var gate = high.length ? App.confirm({ title: 'Seqment #' + r.n + ' riskli görünür', text: high[0].text + ' Yenə də təsdiqlənsin?', okLabel: 'Yenə də təsdiqlə', icon: 'alert' }) : Promise.resolve(true);
      return gate.then(function (yes) {
        if (!yes || S.dead) return false;
        st.ok = true; approvals++;
        updateRow(r); updateAll(); scheduleSave();
        burstAt(r.okBtn, 'stars');
        if (p.kind === 'sim') xpAt(r.okBtn, '+5 XP');
        if (approvals === 1 && !viaKey) nz('success', 'Təsdiqləndi! ' + MOD + ' + Enter ilə daha sürətli olar.', 2600);
        else if (high.length) nz('worried', 'Təsdiqlədim, amma QA bu seqmentə yenə baxacaq.', 2200);
        return true;
      });
    }
    function unapprove(r) {
      r.st.ok = false; updateRow(r); updateAll(); scheduleSave();
      toast('Təsdiq geri alındı', 'info', { sub: 'Seqment #' + r.n + ' yenidən redaktədədir', ms: 2200 });
    }

    /* --- clarifying question card --- */
    function buildAsk(r) {
      var q = r.d.q;
      var box = h('div', { class: 'editor-ask', role: 'group', 'aria-label': 'Nuanzanın sualı — seqment ' + r.n });
      box._hide = false; box._mini = false;
      box._draw = function () {
        box.textContent = '';
        var ic = h('span', { class: 'editor-ask-ic', html: App.logo ? App.logo('logo') : App.icon('sparkle'), 'aria-hidden': 'true' });
        if (r.st.ans) {
          box.className = 'editor-ask done';
          ic.innerHTML = App.icon('check');
          box.appendChild(ic);
          box.appendChild(h('div', { class: 'editor-ask-b' }, h('b', { text: '«' + q.word + '» — ' + r.st.ans }), h('p', { text: 'Seqment #' + r.n + ' yeniləndi. Bu sənəddə oxşar yerlərdə də «' + r.st.ans + '» götürüləcək.' })));
          box.appendChild(h('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: function () { r.st.ans = null; setText(r, r.d.ai || r.d.t, { ed: false }); } }, 'Dəyiş'));
          return;
        }
        if (box._mini) {
          box.className = 'editor-ask mini';
          box.appendChild(ic);
          box.appendChild(h('span', { class: 'small', html: '<b>Sual açıqdır:</b> «' + esc(q.word) + '» kimə aiddir? · #' + r.n }));
          box.appendChild(h('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: function () { box._mini = false; box._draw(); } }, 'Aç'));
          return;
        }
        box.className = 'editor-ask';
        box.appendChild(ic);
        var srcQ = h('p', { class: 'editor-ask-q', lang: set.src, html: esc(r.d.s).replace(new RegExp('(^|[^\\p{L}])(' + reEsc(q.word) + ')(?![\\p{L}])', 'iu'), '$1<span class="conf-low editor-they">$2</span>') });
        var opts = h('div', { class: 'editor-ask-opts' }, q.opts.map(function (o) {
          return h('button', { class: 'btn btn-sm' + (o[0] === q.likely ? ' btn-secondary' : ''), type: 'button', onclick: function (e) { answer(r, o, e.currentTarget); } }, o[0]);
        }), h('button', { class: 'link small', type: 'button', onclick: function () { box._mini = true; box._draw(); nz('idle', 'Yaxşı, sonra soruşaram.', 1600); } }, 'Sonra'));
        box.appendChild(h('div', { class: 'editor-ask-b' },
          h('span', { class: 'eyebrow', text: 'Nuanza soruşur · #' + r.n }), h('h3', { text: q.title }), srcQ, h('p', { text: q.text }), opts));
      };
      box._draw();
      return box;
    }
    function answer(r, o, btn) {
      r.st.ans = o[0];
      burstAt(btn, 'stars');
      setText(r, o[1], { o: 'ai', ed: false });
      if (o[0] === r.d.q.likely) {
        toast('Cavab yadda saxlandı', 'ok', { sub: '«' + r.d.q.word + '» — ' + o[0] + ' · seqment #' + r.n + ' yeniləndi' });
        nz('success', 'Aydındır! «' + o[0] + '» — məntiqlidir.', 2400);
      } else {
        toast('Cavab yadda saxlandı', 'warn', { sub: 'Diqqət: adətən ödəniş gecikəndə Xidmətləri ' + r.d.q.likely + ' dayandırır' });
        nz('worried', 'Qəbul etdim. Amma bir də baxın: adətən bunu ' + r.d.q.likely + ' edir.', 3200);
      }
    }

    /* --- counts, filter, progress --- */
    function isRisk(r) { return !!String(r.st.t || '').trim() && !r.st.ok && r.issues.some(function (x) { return x.type !== 'Boş seqment'; }); }
    function matchF(r, f) {
      var t = String(r.st.t || '').trim();
      if (f === 'empty') return !t;
      if (f === 'unrev') return !!t && !r.st.ok;
      if (f === 'risk') return isRisk(r);
      return true;
    }
    function setFilter(f) {
      filter = f;
      FILTERS.forEach(function (x) { fBtns[x.id].b.setAttribute('aria-pressed', x.id === f ? 'true' : 'false'); });
      updateAll(true);
    }
    var emptyMini = null;
    function updateAll(refilter) {
      var c = { all: rows.length, empty: 0, unrev: 0, risk: 0 };
      rows.forEach(function (r) { if (matchF(r, 'empty')) c.empty++; if (matchF(r, 'unrev')) c.unrev++; if (isRisk(r)) c.risk++; });
      FILTERS.forEach(function (f) { fBtns[f.id].c.textContent = String(c[f.id]); });
      var vis = 0, ae = D.activeElement;
      rows.forEach(function (r) {
        var show = matchF(r, filter);
        if (!show && !refilter && !r.row.hidden && r.row.contains(ae)) show = true;
        if (!show && !refilter && !r.row.hidden && filter !== 'all') show = r === cur;
        r.row.hidden = !show;
        if (r.ask) r.ask.hidden = !show || r.ask._hide;
        if (show) vis++;
      });
      emptyHost.hidden = vis > 0;
      if (!vis) {
        var msg = filter === 'empty' ? ['Boş seqment qalmayıb', 'Bölmədəki bütün seqmentlər tərcümə olunub.'] : filter === 'risk' ? ['Riskli seqment yoxdur', 'Mirzələr bu bölmədə şübhəli yer tapmadı.'] : ['Hamısı yoxlanılıb', 'Bölmədəki bütün seqmentlər təsdiqlənib.'];
        if (!emptyHost._box) {
          emptyHost._h = h('h3'); emptyHost._p = h('p');
          var art = h('div', { class: 'empty-art' });
          emptyHost._box = h('div', { class: 'empty' }, art, emptyHost._h, emptyHost._p, h('div', { class: 'actions' }, h('button', { class: 'btn', type: 'button', onclick: function () { setFilter('all'); } }, 'Hamısını göstər')));
          emptyHost.appendChild(emptyHost._box);
          emptyMini = S.mini(art, 'celebrate', 88);
        } else if (emptyMini && emptyMini.set) { try { emptyMini.set('celebrate', {}); } catch (e) { /* ignore */ } }
        emptyHost._h.textContent = msg[0]; emptyHost._p.textContent = msg[1];
      }
      var pr = progressOf(p, segs);
      progI.style.width = pr.pct + '%'; progBar.setAttribute('aria-valuenow', String(pr.pct));
      pctTx.innerHTML = pr.pct + '<small>%</small>';
      progTx.textContent = num(pr.ok) + ' / ' + num(pr.total) + ' seqment təsdiqlənib';
      pctTx.title = progTx.textContent;
      if (!(p.status === 'delivered' && pr.pct === 100)) setMap('pj:prog', p.id, pr.pct);
      startCard.hidden = c.empty !== rows.length;
      gl.forEach(function (g, gi) {
        var chip = glChips.children[gi]; if (!chip || !chip._bad) return;
        var n = 0; rows.forEach(function (r) { r.issues.forEach(function (x) { if (x.type === 'Termin' && x.term === g.a) n++; }); });
        chip._bad.hidden = !n; chip._bad.textContent = String(n);
      });
      var allOk = rows.every(function (r) { return r.st.ok; });
      if (allOkBefore === false && allOk) {
        burstAt(bar, 'confetti');
        nz('celebrate', 'Bölmə tam təsdiqləndi! QA-ya baxaq?', 3200);
        toast('Bölmə təsdiqləndi', 'ok', { sub: rows.length + ' seqment · indi QA vaxtıdır', icon: 'stamp', action: { label: 'QA', onClick: function () { flushSave(); App.go('qa', { project: p.id }); } } });
      }
      allOkBefore = allOk;
    }
    function refreshAll() { rows.forEach(updateRow); updateAll(); }

    /* --- save --- */
    var saveT = 0;
    function scheduleSave() {
      saveEl.classList.add('busy'); saveTx.textContent = 'Saxlanılır…';
      clearTimeout(saveT); saveT = S.later(flushSave, 650);
    }
    function flushSave() {
      clearTimeout(saveT); saveSegs(p, segs);
      if (!S.dead) { saveEl.classList.remove('busy'); saveTx.textContent = 'Yadda saxlanıldı · ' + hm(new Date()); }
    }
    S.finals.push(flushSave);

    /* --- navigation --- */
    function visibleRows() { return rows.filter(function (r) { return !r.row.hidden; }); }
    function focusRow(r, flash) {
      if (!r) return;
      if (r.row.hidden) setFilter('all');
      try { r.row.scrollIntoView({ block: 'center', behavior: reduced() ? 'auto' : 'smooth' }); } catch (e) { /* ignore */ }
      S.later(function () { try { r.ta.focus({ preventScroll: true }); var L = r.ta.value.length; r.ta.setSelectionRange(L, L); } catch (e) { /* ignore */ } }, reduced() ? 0 : 260);
      if (flash) { r.row.classList.remove('editor-flash'); void r.row.offsetWidth; r.row.classList.add('editor-flash'); }
    }
    function step(r, dir, unOkOnly) {
      var v = visibleRows(), i = v.indexOf(r);
      for (var k = i + dir; k >= 0 && k < v.length; k += dir) { if (!unOkOnly || !v[k].st.ok) return focusRow(v[k]); }
      if (dir > 0) { toast(unOkOnly ? 'Bölmədə təsdiqlənməmiş seqment qalmadı' : 'Bölmənin sonu', 'info', { ms: 2000 }); }
    }
    function rowOf(node) { for (var i = 0; i < rows.length; i++) if (rows[i].row.contains(node)) return rows[i]; return null; }
    listEl.addEventListener('keydown', function (e) {
      var r = rowOf(e.target); if (!r) return;
      if ((e.ctrlKey || e.metaKey) && (e.key === 'Enter' || e.keyCode === 13)) {
        e.preventDefault();
        approve(r, true).then(function (ok) { if (ok && !S.dead) step(r, 1, true); });
      } else if (e.altKey && e.key === 'ArrowDown') { e.preventDefault(); step(r, 1, false); }
      else if (e.altKey && e.key === 'ArrowUp') { e.preventDefault(); step(r, -1, false); }
    });
    S.on(D, 'keydown', function (e) {
      if (!page.isConnected || overlayOpen() || !e.altKey || (e.key !== 'ArrowDown' && e.key !== 'ArrowUp')) return;
      if (listEl.contains(e.target)) return;
      var t = e.target && e.target.tagName;
      if (t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT') return;
      e.preventDefault();
      var v = visibleRows(); if (!v.length) return;
      focusRow(e.key === 'ArrowDown' ? (cur && v.indexOf(cur) >= 0 ? v[Math.min(v.length - 1, v.indexOf(cur) + 1)] : v[0]) : (cur && v.indexOf(cur) > 0 ? v[v.indexOf(cur) - 1] : v[0]));
    });
    var rz = 0;
    S.on(W, 'resize', function () { clearTimeout(rz); rz = S.later(function () { rows.forEach(function (r) { fit(r.ta); }); }, 120); });

    /* --- AI pre-translation (big job → Mirzə Məclisi) --- */
    function setBusy(r, on) {
      r.ta.classList.toggle('editor-sk', on); r.ta.readOnly = on;
      if (on) { r.ta.value = ''; r.stEl.className = 'seg-st busy'; r.stEl.innerHTML = ''; r.row.setAttribute('aria-busy', 'true'); }
      else r.row.removeAttribute('aria-busy');
    }
    function typeInto(r, text, done) {
      if (reduced()) { r.ta.value = text; fit(r.ta); done(); return; }
      var i = 0, stepN = Math.max(2, Math.ceil(text.length / 26));
      var iv = S.every(function () {
        i = Math.min(text.length, i + stepN); r.ta.value = text.slice(0, i); fit(r.ta);
        if (i >= text.length) { clearInterval(iv); done(); }
      }, 24);
    }
    function runAI() {
      if (aiBtn.getAttribute('aria-busy') === 'true') return;
      var todo = rows.filter(function (r) { return !String(r.st.t || '').trim(); });
      if (!todo.length) {
        toast('Boş seqment yoxdur', 'info', { sub: 'AI ilkin tərcümə yalnız boş seqmentləri doldurur' });
        nz('point', 'Hamısı doludur. Riskli seqmentlərə baxaq?', 2600);
        if (rows.some(isRisk)) setFilter('risk');
        return;
      }
      if (App.isLive && App.isLive()) { runLiveAI(todo); return; }
      aiBtn.setAttribute('aria-busy', 'true');
      todo.forEach(function (r) { setBusy(r, true); });
      var sim = todo.map(function (r) { return analyze(r.d, { t: r.d.ai || r.d.t, o: 'ai' }, ctx); });
      var flagged = sim.filter(function (x) { return x.length; }).length, turk = 0, tmN = 0;
      sim.forEach(function (x) { x.forEach(function (i) { if (i.type === 'Türk forması') turk++; }); });
      todo.forEach(function (r) { if (r.d.tm) tmN++; });
      var all = [];
      rows.forEach(function (r) { var j = todo.indexOf(r); all = all.concat(j >= 0 ? sim[j] : r.issues); });
      var score = scoreOf(all);
      var txt = todo.length + ' seqment tərcümə edildi: ' + (todo.length - flagged) + ' əmin, ' + flagged + ' yoxlanmalı. Lüğətdən ' + gl.length + ' termin qorundu' +
        (tmN ? ', ' + tmN + ' TM uyğunluğu tətbiq olundu' : '') + '. Üslub: ' + REG[regNow] + '.' + (turk ? ' Dilçi Nənə ' + turk + ' türk formasını qeyd etdi — redaktorda göstərilir.' : '');
      var job;
      try { job = App.bigJob('AI ilkin tərcümə — ' + p.name, { score: score, text: txt, seal: 'Qaralama hazırdır' }); } catch (e) { job = null; }
      Promise.resolve(job).then(function () {
        if (S.dead) return;
        aiBtn.removeAttribute('aria-busy');
        var k = 0;
        todo.forEach(function (r, idx) {
          S.later(function () {
            var text = r.d.ai || r.d.t || '';
            r.ta.classList.remove('editor-sk');
            typeInto(r, text, function () {
              r.st.t = text; r.st.o = r.d.tm && r.d.tm.pct >= 85 ? 'tm' : 'ai'; r.st.ed = false; r.st.ok = false;
              setBusy(r, false); updateRow(r);
              k++;
              if (k === todo.length) finish(); else updateAll();
            });
          }, idx * 140);
        });
      });
      function finish() {
        updateAll(); flushSave();
        toast('AI qaralaması hazırdır', 'ok', { sub: todo.length + ' seqment dolduruldu' + (flagged ? ' · ' + flagged + ' seqmentə baxın' : ' · riskli yer yoxdur'),
          action: flagged ? { label: 'Riskliləri göstər', onClick: function () { if (!S.dead) setFilter('risk'); } } : null });
        var first = rows.filter(function (r) { return !r.st.ok; })[0];
        if (first) S.later(function () { focusRow(first, true); }, 300);
      }
    }

    /* Live engine: the empty segments go to the translate adapter (ai/translate.js), one line per
       segment, with the project's register and approved terms; the answer comes back per line
       (segment[].para). Nothing from the sample data is typed in: a segment the engine did not
       translate stays empty, and a failed call leaves every segment as it was. */
    function runLiveAI(todo) {
      aiBtn.setAttribute('aria-busy', 'true');
      todo.forEach(function (r) { setBusy(r, true); });
      nz('write', 'Boş seqmentləri tərcümə edirəm…', 2400);
      var chunks = [], cur = [], size = 0;
      todo.forEach(function (r) {
        var len = String(r.d.s).length;
        if (cur.length && (cur.length >= 20 || size + len > 6000)) { chunks.push(cur); cur = []; size = 0; }
        cur.push(r); size += len;
      });
      if (cur.length) chunks.push(cur);
      var terms = gl.map(function (g) { return { a: g.a, b: g.b }; });
      var to = String(p.pair || '').split('-')[1] || 'az';
      var got = [], failed = false, seq = Promise.resolve();
      function same(a, b) { return lower(a).replace(/\s+/g, ' ').trim() === lower(b).replace(/\s+/g, ' ').trim(); }
      chunks.forEach(function (ch) {
        seq = seq.then(function () {
          if (failed || S.dead) return null;
          var text = ch.map(function (r) { return String(r.d.s).replace(/\s*\n+\s*/g, ' ').trim(); }).join('\n');
          return App.fakeAI('translate', { text: text, register: regNow, from: set.src, to: to, pair: set.src + '-' + to, terms: terms }).then(function (res) {
            if (!res || res.ok === false || !Array.isArray(res.segments)) { failed = true; return; }
            var by = {};
            res.segments.forEach(function (g) { if (g) (by[g.para] = by[g.para] || []).push(g); });
            ch.forEach(function (r, k) {
              var gs = by[k] || [];
              var t = gs.map(function (g) { return String(g.t || '').trim(); }).join(' ').replace(/\s+/g, ' ').trim();
              if (!t || same(t, r.d.s)) return;
              var c = 'high', note = '';
              gs.forEach(function (g) {
                if (g.confidence === 'low' && c !== 'low') { c = 'low'; note = g.note || note; }
                else if (g.confidence === 'mid' && c === 'high') { c = 'mid'; note = g.note || note; }
              });
              got.push({ r: r, t: t, c: c, note: note });
            });
          });
        });
      });
      function release(list) { list.forEach(function (r) { r.ta.classList.remove('editor-sk'); setBusy(r, false); updateRow(r); }); }
      seq.then(function () {
        if (S.dead) return;
        var done = got.map(function (x) { return x.r; });
        release(todo.filter(function (r) { return done.indexOf(r) < 0; }));
        if (!got.length) {
          aiBtn.removeAttribute('aria-busy'); updateAll();
          if (!failed) toast('Mühərrik tərcümə qaytarmadı', 'warn', { sub: 'Bir az sonra yenidən cəhd edin' });
          nz('sad', null, 1600);
          return;
        }
        var sim = got.map(function (x) { return analyze(x.r.d, { t: x.t, o: 'ai' }, ctx); });
        var flagged = 0, turk = 0, all = [];
        got.forEach(function (x, i) { if (sim[i].length || x.c !== 'high') flagged++; sim[i].forEach(function (iss) { if (iss.type === 'Türk forması') turk++; }); });
        rows.forEach(function (r) { var j = done.indexOf(r); all = all.concat(j >= 0 ? sim[j] : r.issues); });
        var left = todo.length - got.length, score = scoreOf(all);
        var txt = got.length + ' seqment tərcümə edildi: ' + (got.length - flagged) + ' əmin, ' + flagged + ' yoxlanmalı.' +
          (terms.length ? ' Layihə lüğəti (' + terms.length + ' termin) mühərrikə verildi.' : '') + ' Üslub: ' + REG[regNow] + '.' +
          (turk ? ' Dilçi Nənə ' + turk + ' türk formasını qeyd etdi — redaktorda göstərilir.' : '') +
          (left ? ' ' + left + ' seqment boş qaldı — «AI ilkin tərcümə»ni yenidən işə salın.' : '');
        var job;
        try { job = App.bigJob('AI ilkin tərcümə — ' + p.name, { score: score, text: txt, seal: left ? 'Qismən hazırdır' : 'Qaralama hazırdır' }); } catch (e) { job = null; }
        Promise.resolve(job).then(null, function () { return null; }).then(function () {
          if (S.dead) return;
          aiBtn.removeAttribute('aria-busy');
          var k = 0;
          got.forEach(function (x, idx) {
            S.later(function () {
              x.r.ta.classList.remove('editor-sk');
              typeInto(x.r, x.t, function () {
                x.r.st.t = x.t; x.r.st.o = 'ai'; x.r.st.ed = false; x.r.st.ok = false; x.r.st.c = x.c; x.r.st.cn = x.note;
                setBusy(x.r, false); updateRow(x.r);
                k++;
                if (k === got.length) finish(); else updateAll();
              });
            }, idx * 140);
          });
        });
        function finish() {
          updateAll(); flushSave();
          toast('AI qaralaması hazırdır', left ? 'warn' : 'ok', { sub: got.length + ' seqment dolduruldu' + (left ? ' · ' + left + ' seqment boş qaldı' : '') + (flagged ? ' · ' + flagged + ' seqmentə baxın' : ''),
            action: flagged ? { label: 'Riskliləri göstər', onClick: function () { if (!S.dead) setFilter('risk'); } } : null });
          var first = rows.filter(function (r) { return !r.st.ok; })[0];
          if (first) S.later(function () { focusRow(first, true); }, 300);
        }
      }, function (e) {
        if (S.dead) return;
        try { console.error('[Nuanza] AI ilkin tərcümə', e); } catch (x) { /* ignore */ }
        release(todo); aiBtn.removeAttribute('aria-busy'); updateAll();
      });
    }

    /* --- TM match sheet --- */
    function tmSheet(r) {
      var tm = r.d.tm;
      var srcW = {}; String(r.d.s).split(/\s+/).forEach(function (w) { srcW[lower(w.replace(/[^\p{L}\p{N}]/gu, ''))] = 1; });
      var diffHTML = String(tm.src).split(/(\s+)/).map(function (w) {
        var k = lower(w.replace(/[^\p{L}\p{N}]/gu, ''));
        return k && !srcW[k] ? '<mark>' + esc(w) + '</mark>' : esc(w);
      }).join('');
      var use = r.d.t || tm.tgt;
      var body = h('div', { class: 'stack' },
        h('div', { class: 'row' }, badge('Uyğunluq ' + tm.pct + '%', tm.pct >= 95 ? 'green' : 'gold', 'database'), badge(tm.from, '', 'folder'), tm.date ? badge(App.fmt ? App.fmt.date(tm.date) : tm.date, '', 'calendar') : null),
        h('div', { class: 'stack-sm' }, h('span', { class: 'eyebrow plain', text: 'Yaddaşdakı mənbə' }), h('p', { class: 'editor-quote editor-tmdiff', lang: set.src, html: diffHTML })),
        h('div', { class: 'stack-sm' }, h('span', { class: 'eyebrow plain', text: 'Yaddaşdakı tərcümə' }), h('p', { class: 'editor-quote az', text: tm.tgt })),
        tm.diff ? h('div', { class: 'callout' }, ie('info'), h('div', null, h('b', { text: 'Fərq: ' }), tm.diff)) : null,
        use !== tm.tgt ? h('div', { class: 'stack-sm' }, h('span', { class: 'eyebrow plain', text: 'Uyğunlaşdırılmış variant' }), h('p', { class: 'editor-quote az', text: use })) : null);
      App.sheet({ title: 'Tərcümə yaddaşı · #' + r.n, body: body, actions: [{ label: 'Bağla', kind: 'ghost' }, { label: 'Tətbiq et', kind: 'primary', icon: 'check', onClick: function () {
        setText(r, use, { o: 'tm', ed: false });
        toast('TM uyğunluğu tətbiq edildi', 'ok', { sub: '#' + r.n + ' · ' + tm.pct + '% · ' + tm.from, icon: 'database' });
        S.later(function () { focusRow(r, true); }, 200);
      } }] });
    }

    /* --- Nuanza per-segment menu --- */
    function nzMenu(r) {
      var d = r.d, st = r.st, sh = null;
      var out = h('div', { class: 'editor-nz-out', 'aria-live': 'polite' });
      var tgtQ = h('p', { class: 'editor-quote az', text: st.t || '—' });
      function done(msg, sub) { if (sh) sh.close(); toast(msg, 'ok', { sub: sub, ms: 2600 }); S.later(function () { focusRow(r, true); }, 260); }
      var alts = (d.q ? d.q.opts.map(function (o) { return [o[1], '«' + d.q.word + '» = ' + o[0], o[0]]; }) : []).concat(d.alts || []);
      var acts = [
        { ic: 'layers', cls: 'nar', b: 'Alternativ variantlar', s: alts.length ? alts.length + ' variant · üslub və söz sırası' : 'Mühərrik başqa variant təklif etmir', run: function () {
          out.textContent = '';
          if (!alts.length) { out.appendChild(h('div', { class: 'callout green' }, ie('check'), h('div', { text: 'Bu seqment tərcümə yaddaşı ilə tam uyğundur — mühərrik başqa variant görmür.' }))); return; }
          alts.forEach(function (a) {
            out.appendChild(h('button', { class: 'editor-alt', type: 'button', onclick: function () {
              if (a[2]) r.st.ans = a[2];
              setText(r, a[0], { ed: !a[2] });
              done('Variant tətbiq edildi', '#' + r.n + ' · ' + a[1]);
            } }, h('small', { text: a[1] }), h('span', { text: a[0] })));
          });
        } },
        { ic: 'help', b: 'Niyə belə tərcümə edildi?', s: 'Mühərrikin izahı', run: function () {
          out.textContent = '';
          out.appendChild(h('div', { class: 'callout navy' }, ie('bulb'), h('div', null, d.why || ('Üslub: ' + REG[regNow] + '. Lüğətdən ' + gl.length + ' termin qorundu.'))));
          var tl = gl.filter(function (g) { return srcHas(d.s, g); });
          if (tl.length) out.appendChild(h('div', { class: 'chips' }, tl.map(function (g) { return h('span', { class: 'chip' }, h('b', { text: g.a }), ' → ', g.b); })));
        } },
        { ic: 'shield', cls: 'gold', b: 'Mirzələrdən soruş', s: 'Bu seqmentin sürətli yoxlanışı', run: function () {
          out.textContent = '';
          out.appendChild(h('div', { class: 'sk-stack' }, h('span', { class: 'skeleton title' }), h('span', { class: 'skeleton text' }), h('span', { class: 'skeleton text', style: 'width:72%' })));
          nz('think', 'Mirzələr seqmenti oxuyur…', 1800);
          App.fakeAI('check', { src: d.s, tgt: st.t, pair: p.pair, register: regNow, domain: p.field, terms: gl }).then(function (c) {
            if (S.dead || !out.isConnected) return;
            var iss = analyze(d, r.st, ctx);
            var sc = !String(r.st.t || '').trim() ? 0 : clamp(98 - iss.reduce(function (s, x) { return s + (x.sev === 'high' ? 24 : x.sev === 'mid' ? 10 : 4); }, 0), 40, 98);
            var tx = String(r.st.t || '');
            if (tx.trim() && c && c.live && Array.isArray(c.errors)) { /* live engine: add what the reviser found to the local checks */
              c.errors.forEach(function (e) {
                if (!e || e.auto || iss.some(function (x) { return x.was && lower(x.was) === lower(e.was); })) return;
                var real = !!e.was && e.was !== '—' && tx.indexOf(e.was) >= 0;
                iss.push({ type: e.type, sev: e.severity || 'mid', was: real ? e.was : '', now: e.now || '', fix: real && e.now ? 'raw' : null,
                  text: (real ? '«' + e.was + '» → «' + (e.now || '—') + '». ' : e.now ? '→ «' + e.now + '». ' : '') + (e.why || '') });
              });
              if (c.score != null) sc = Math.min(sc, c.score);
            }
            /* live engine failed (fakeAI already showed why): say that only the local checks ran */
            var liveFail = !!(c && c.ok === false);
            out.textContent = '';
            out.appendChild(h('div', { class: 'editor-check' }, App.ring(sc, 'bal', null, { size: 'sm' }),
              h('div', { class: 'stack-sm' }, h('b', { text: iss.length ? iss.length + ' qeyd tapıldı' : liveFail ? 'Yerli yoxlamada qeyd yoxdur' : 'Mirzələr razıdır' }),
                h('p', { class: 'small muted', text: iss.length ? 'Düzəlişləri birbaşa buradan tətbiq edin.' : liveFail ? 'Rəqəmlər, terminlər və türk formaları yoxlandı.' : 'Məna, terminlər, rəqəmlər və orfoqrafiya qaydasındadır.' }))));
            if (liveFail) out.appendChild(h('div', { class: 'callout', role: 'note' }, ie('alert'),
              h('div', { text: 'Mirzələrin dərin yoxlaması alınmadı — burada yalnız yerli yoxlamalar var. Bir az sonra yenidən soruşun.' })));
            iss.forEach(function (x) {
              var b = (x.fix === 'word' || x.fix === 'raw' || x.fix === 'fill') ? h('button', { class: 'btn btn-sm', type: 'button', onclick: function () {
                var nt = applyFix(d, r.st, x); if (nt == null) return;
                setText(r, nt, { ed: x.fix !== 'fill', o: x.fix === 'fill' ? 'ai' : null });
                done('Düzəldildi', '#' + r.n + ' · ' + (ELDER[x.type] || 'Nuanza'));
              } }, ie('wand'), 'Düzəlt') : null;
              out.appendChild(h('div', { class: 'editor-hint ' + x.sev }, h('span', { class: 'editor-hint-tx' }, h('b', { text: (ELDER[x.type] || 'Nuanza') + ':' }), x.text), b));
            });
            if (liveFail) nz('sad', null, 1600);
            else nz(iss.length ? 'point' : 'success', iss.length ? 'Bax, bunları tapdıq.' : 'Təmizdir!', 1800);
          });
        } },
        { ic: 'book', b: 'Lüğəti tətbiq et', s: 'Layihə terminlərini qoru', run: function () {
          var t = r.st.t, n = 0;
          analyze(d, r.st, ctx).forEach(function (x) { if (x.type === 'Termin') { var nt = replaceWord(t, x.was, x.now, false); if (nt !== t) { t = nt; n++; } } });
          if (!n) { out.textContent = ''; out.appendChild(h('div', { class: 'callout green' }, ie('check'), h('div', { text: 'Terminlər artıq lüğətə uyğundur.' }))); return; }
          setText(r, t, { ed: true });
          done(n + ' termin düzəldildi', '#' + r.n + ' · Lüğətçi Mirzə');
        } },
        { ic: 'message', b: st.note ? 'Qeydi dəyiş' : 'Redaktora qeyd', s: 'Komanda və ya müştəri üçün şərh', run: function () {
          out.textContent = '';
          var ta = h('textarea', { class: 'textarea', id: 'editor-note-' + r.n, rows: '3', placeholder: 'Məs.: Müştəri ilə «Absheron» yazılışını dəqiqləşdirmək', value: r.st.note || '' });
          out.appendChild(h('div', { class: 'field' }, h('label', { for: 'editor-note-' + r.n }, 'Qeyd'), ta));
          out.appendChild(h('div', { class: 'row' },
            h('button', { class: 'btn btn-primary btn-sm', type: 'button', onclick: function () { r.st.note = ta.value.trim(); updateRow(r); scheduleSave(); done(r.st.note ? 'Qeyd saxlanıldı' : 'Qeyd silindi', '#' + r.n); } }, 'Saxla'),
            r.st.note ? h('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: function () { r.st.note = ''; updateRow(r); scheduleSave(); done('Qeyd silindi', '#' + r.n); } }, 'Sil') : null));
          S.later(function () { try { ta.focus(); } catch (e) { /* ignore */ } }, 60);
        } }
      ];
      var list = h('div', { class: 'list' }, acts.map(function (a) {
        var b = h('button', { class: 'list-row', type: 'button' }, icTile(a.ic, a.cls), h('span', { class: 'tx' }, h('b', { text: a.b }), h('small', { text: a.s })), h('span', { class: 'end', html: App.icon('chevron') }));
        b.addEventListener('click', function () { Array.prototype.forEach.call(list.children, function (x) { x.classList.toggle('is-on', x === b); }); a.run(); });
        return b;
      }));
      sh = App.sheet({ title: 'Nuanza · seqment #' + r.n, body: h('div', { class: 'editor-nz' },
        h('div', { class: 'stack-sm' }, h('span', { class: 'eyebrow plain', text: 'Mənbə · ' + upper(set.src) }), h('p', { class: 'editor-quote', lang: set.src, text: d.s }),
          h('span', { class: 'eyebrow plain', text: 'Tərcümə · AZ' }), tgtQ),
        list, out) });
      nz('point', 'Bu seqment haqqında nə bilmək istəyirsiniz?', 2000);
    }

    /* --- initial paint --- */
    refreshAll();
    allOkBefore = rows.every(function (r) { return r.st.ok; });
    function fitAll() { rows.forEach(function (r) { fit(r.ta); }); }
    if (W.requestAnimationFrame) W.requestAnimationFrame(fitAll); else fitAll();
    S.later(fitAll, 450);
    try { if (D.fonts && D.fonts.ready) D.fonts.ready.then(function () { if (!S.dead) fitAll(); }); } catch (e) { /* ignore */ }
    var target = parseInt(params.seg, 10);
    if (target && rows[target - 1]) S.later(function () { focusRow(rows[target - 1], true); }, 420);
    else if (!greeted[p.id]) {
      greeted[p.id] = 1;
      S.later(function () {
        var c = { empty: 0, risk: 0 }; rows.forEach(function (r) { if (!String(r.st.t).trim()) c.empty++; if (isRisk(r)) c.risk++; });
        if (c.empty === rows.length) nz('wave', 'Sənəd hazırdır! «AI ilkin tərcümə» ilə başlayaq?', 3200);
        else if (c.risk || c.empty) nz('read', set.title.split(' · ')[0] + ': ' + (c.empty ? c.empty + ' boş, ' : '') + c.risk + ' riskli seqment. Qeydlərdən başlayaq?', 3400);
        else nz('success', 'Bu bölmə qaydasındadır. QA-ya baxa bilərsiniz.', 2600);
      }, 900);
    }
  }

  /* ------------------------------------------------------------------
     9. SCREEN: QA
     ------------------------------------------------------------------ */
  function renderQA(el, params) {
    ensureCss();
    var S = freshScope('qa');
    params = params || {};
    var p = resolveProject(params);
    if (!p) { el.appendChild(noProject(S)); return; }
    sset('pj:last', p.id);
    var set = setOf(p), segs = loadSegs(p), gl = glossOf(p), ctx = { set: set, gl: gl };
    var ignored = getMap('pj:qaign:' + p.id), reqManual = getMap('pj:req:' + p.id);
    var M = null, sevF = 'all', ring = null, built = false;
    var aiIss = []; /* live engine issues (ai/qa.js); kept while their fragment is still in the segment */
    var page = h('div', { class: 'page qa' });
    el.appendChild(page);

    var deepBtn = h('button', { class: 'btn btn-secondary', type: 'button' }, ie('stamp'), 'Dərin QA (Mirzə Məclisi)');
    var againBtn = h('button', { class: 'btn', type: 'button' }, ie('refresh'), 'Yenidən yoxla');
    var subP = h('p', { text: p.name + ' — ' + num(p.segs) + ' seqment yoxlanılır…' });
    page.appendChild(h('div', { class: 'qa-top' },
      h('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: function () { App.go('editor', { project: p.id }); } }, ie('back'), 'Redaktor'),
      h('div', { class: 'row' }, kindTag(p), dueChip(p))));
    page.appendChild(h('div', { class: 'page-h' },
      h('div', null, h('span', { class: 'eyebrow', text: 'QA · ' + p.client + ' · ' + pairLabel(p.pair) }), h('h1', { html: 'Keyfiyyət <em>yoxlaması</em>' }), subP),
      h('div', { class: 'actions' }, againBtn, deepBtn)));
    var host = h('div', { class: 'stack-lg' });
    page.appendChild(host);

    function skeleton() {
      host.textContent = '';
      host.appendChild(h('div', { class: 'qa-loading', 'aria-busy': 'true', 'aria-label': 'Yoxlanılır' },
        h('div', { class: 'grid-2' },
          h('div', { class: 'card qa-score' }, h('span', { class: 'skeleton circle', style: 'width:132px;height:132px' }), h('div', { class: 'sk-stack' }, h('span', { class: 'skeleton title' }), h('span', { class: 'skeleton text' }), h('span', { class: 'skeleton text', style: 'width:70%' }), h('span', { class: 'skeleton block', style: 'height:56px' }))),
          h('div', { class: 'card sk-stack' }, h('span', { class: 'skeleton title', style: 'width:40%' }), [1, 2, 3, 4, 5, 6].map(function () { return h('span', { class: 'skeleton text' }); }))),
        h('span', { class: 'skeleton block', style: 'height:260px' })));
    }
    function liveIssue(q, st, mine) {
      var t = String(st.t || ''), was = q.was && q.was !== '—' ? String(q.was) : '';
      if (!t.trim() || q.type === 'Boş seqment' || (was && t.indexOf(was) < 0)) return null;
      var lw = lower(was);
      if (mine.some(function (x) { var lx = lower(x.was || ''); return was && lx ? lx.indexOf(lw) >= 0 || lw.indexOf(lx) >= 0 : x.type === q.type; })) return null;
      return { type: q.type, sev: q.severity === 'high' || q.severity === 'mid' ? q.severity : 'low', was: was, now: was ? q.now || '' : '',
        text: (q.text || '') + (!was && q.now ? ' Təklif: «' + q.now + '».' : ''), fix: was && q.now ? 'raw' : null, elder: q.elder };
    }
    function model() {
      var issues = [];
      segs.forEach(function (st, i) {
        var mine = analyze(set.segs[i], st, ctx);
        aiIss.forEach(function (q) { var x = q.seg === i + 1 ? liveIssue(q, st, mine) : null; if (x) mine.push(x); });
        mine.forEach(function (iss) {
          iss.n = i + 1; iss.key = issKey(iss.n, iss); iss.ign = !!ignored[iss.key]; iss.elder = ELDER[iss.type] || iss.elder || 'Nuanza';
          issues.push(iss);
        });
      });
      var ord = { high: 0, mid: 1, low: 2 };
      issues.sort(function (a, b) { return (a.ign - b.ign) || (ord[a.sev] - ord[b.sev]) || (a.n - b.n); });
      var act = issues.filter(function (x) { return !x.ign; });
      var sev = { high: 0, mid: 0, low: 0 }; act.forEach(function (x) { sev[x.sev]++; });
      return { issues: issues, act: act, sev: sev, score: scoreOf(act) };
    }
    function run(first) {
      skeleton();
      againBtn.setAttribute('aria-busy', 'true');
      nz('think', first ? 'Rəqəmlərə, adlara, terminlərə və türk formalarına baxıram…' : 'Yenidən yoxlayıram…', 2200);
      App.fakeAI('qa', { project: qaInput(p, segs) }).then(function (r) {
        if (S.dead) return;
        againBtn.removeAttribute('aria-busy');
        /* Only the live engine's issues describe these segments; the demo answer stays unused, and {ok:false} leaves the local checks. */
        var live = !!(App.isLive && App.isLive());
        aiIss = live && r && r.ok !== false && Array.isArray(r.issues) ? r.issues : [];
        segs = loadSegs(p); M = model(); build();
        var note = !live ? '' : !r || r.ok === false ? 'Mirzələrin dərin yoxlaması alınmadı — yalnız yerli yoxlamalar (rəqəm, termin, türk forması, durğu) göstərilir. Bir az sonra «Yenidən yoxla»ya basın.'
          : r.checked != null && r.segments != null && r.checked < r.segments ? (r.segments - r.checked) + ' seqment dərin yoxlamadan keçmədi — «Yenidən yoxla»ya basın.' : '';
        if (note) host.insertBefore(h('div', { class: 'callout', role: 'note' }, ie('alert'), h('div', { text: note })), host.firstChild);
        setMap('pj:qa', p.id, M.score);
        nz(M.score >= 85 ? 'success' : 'worried', M.score >= 85 ? M.score + ' bal — təhvilə az qalıb!' : M.score + ' bal. Kritik qeydlərdən başlayaq.', 2800);
      });
    }

    /* sections */
    var secScore, secCats, secIssues, secTurk, secTerms, secReqs, secDeliv, ringSub, scoreH, scoreP, sevRow, sealHost, issList, issTabs = {}, fixAllBtn, delivTiles = {};
    function build() {
      host.textContent = '';
      ring = App.ring(M.score, 'bal', sealOf(M.score), { size: 'lg' });
      ringSub = ring.querySelector('.ring-sub');
      scoreH = h('h2'); scoreP = h('p', { class: 'muted small' }); sevRow = h('div', { class: 'qa-sev' }); sealHost = h('div');
      secScore = h('section', { class: 'card pad-lg qa-score', 'aria-label': 'Ümumi bal' }, ring, h('div', { class: 'qa-score-tx' }, scoreH, scoreP, sevRow, sealHost));
      secCats = h('section', { class: 'card' }, h('div', { class: 'card-h' }, h('div', null, h('span', { class: 'eyebrow', text: 'Kateqoriyalar' }), h('h2', { text: 'Qeydlər harada?' }))), h('div', { class: 'qa-cats' }));
      host.appendChild(h('div', { class: 'grid-2' }, secScore, secCats));

      issList = h('div', { class: 'qa-list' });
      var tabs = h('div', { class: 'tabs', role: 'tablist', 'aria-label': 'Ciddilik' }, [['all', 'Hamısı'], ['high', 'Kritik'], ['mid', 'Orta'], ['low', 'Kiçik']].map(function (t) {
        var c = h('span', { class: 'badge' });
        var b = h('button', { type: 'button', role: 'tab', 'aria-selected': sevF === t[0] ? 'true' : 'false', onclick: function () { sevF = t[0]; drawIssues(); } }, t[1], c);
        issTabs[t[0]] = { b: b, c: c }; return b;
      }));
      fixAllBtn = h('button', { class: 'btn btn-primary btn-sm', type: 'button', onclick: fixAll }, ie('wand'), 'Hamısını düzəlt');
      secIssues = h('section', { class: 'card', id: 'qa-issues' },
        h('div', { class: 'card-h' }, h('div', null, h('span', { class: 'eyebrow', text: 'Qeydlər' }), h('h2', { text: 'Seqment üzrə' })), fixAllBtn),
        tabs, issList);
      host.appendChild(secIssues);

      secTurk = h('section', { class: 'card' });
      secTerms = h('section', { class: 'card' });
      host.appendChild(h('div', { class: 'grid-2' }, secTurk, secTerms));
      secReqs = h('section', { class: 'card' });
      secDeliv = h('section', { class: 'card framed qa-deliv' });
      host.appendChild(h('div', { class: 'grid-2' }, secReqs, secDeliv));
      buildDeliv();
      built = true;
      drawAll();
    }
    function drawAll() {
      M = model();
      if (ring && ring.setValue) ring.setValue(M.score);
      if (ringSub) ringSub.textContent = sealOf(M.score);
      setMap('pj:qa', p.id, M.score);
      subP.textContent = p.name + ' — ' + num(p.segs) + ' seqment yoxlanıldı · ' + set.title.split(' · ')[0] + ' ətraflı · ' + hm(new Date());
      scoreH.innerHTML = esc(gradeOf(M.score)) + ' — <em>' + M.act.length + ' qeyd</em>';
      scoreP.textContent = M.sev.high ? M.sev.high + ' kritik qeyd təhvildən əvvəl bağlanmalıdır. Seqment nömrəsinə toxunun — redaktorda açılacaq.' : M.act.length ? 'Kritik səhv yoxdur. Qalan qeydlər üslub və durğu ilə bağlıdır.' : 'Bütün yoxlamalar keçdi. Təhvil paketini hazırlaya bilərsiniz.';
      sevRow.textContent = '';
      [['high', 'Kritik'], ['mid', 'Orta'], ['low', 'Kiçik']].forEach(function (s) {
        sevRow.appendChild(h('div', { class: 'qa-sevbox ' + s[0] }, h('b', { text: String(M.sev[s[0]]) }), h('span', { text: s[1] })));
      });
      var deep = sget('pj:deep:' + p.id, null);
      sealHost.textContent = '';
      if (deep && deep.score != null) sealHost.appendChild(h('span', { class: 'qa-seal' }, h('span', { class: 'medal', 'aria-hidden': 'true' }, h('b', { text: 'M' })), 'Məclis möhürü · ' + deep.score + ' bal · ' + (App.fmt ? App.fmt.rel(deep.at) : '')));
      drawCats(); drawIssues(); drawTurk(); drawTerms(); drawReqs(); drawDelivBadges();
    }
    function drawCats() {
      var box = secCats.querySelector('.qa-cats'); box.textContent = '';
      var max = 1;
      var data = CATS.map(function (c) {
        var l = M.act.filter(function (x) { return c.types.indexOf(x.type) >= 0; });
        max = Math.max(max, l.length);
        var worst = l.some(function (x) { return x.sev === 'high'; }) ? 'high' : l.some(function (x) { return x.sev === 'mid'; }) ? 'mid' : l.length ? 'low' : null;
        return { c: c, n: l.length, worst: worst };
      });
      data.forEach(function (x) {
        var b = h('button', { class: 'qa-cat', type: 'button', title: x.n ? x.c.label + ': ' + x.n + ' qeyd — siyahıda göstər' : x.c.label + ': təmiz' },
          h('span', { class: 'qa-cat-l', text: x.c.label }),
          h('div', { class: 'progress' + (x.worst === 'mid' ? ' gold' : x.worst === 'low' ? ' navy' : '') }, h('i', { style: 'width:' + (x.n ? Math.max(8, Math.round(x.n / max * 100)) : 0) + '%' })),
          x.n ? h('span', { class: 'qa-cat-n', text: x.n + ' qeyd' }) : h('span', { class: 'qa-cat-n ok', html: App.icon('check') + ' ' }, 'Təmiz'));
        b.addEventListener('click', function () {
          if (!x.n) { toast(x.c.label + ': təmiz', 'ok', { sub: 'Bu kateqoriyada qeyd yoxdur', ms: 1800 }); return; }
          sevF = 'all'; drawIssues(x.c.types);
          try { secIssues.scrollIntoView({ block: 'start', behavior: reduced() ? 'auto' : 'smooth' }); } catch (e) { /* ignore */ }
        });
        box.appendChild(b);
      });
    }
    function goSeg(n) { App.go('editor', { project: p.id, seg: n }); }
    function fixIssue(iss, row, btn, silent) {
      var st = segs[iss.n - 1], nt = applyFix(set.segs[iss.n - 1], st, iss);
      if (nt == null) return false;
      st.t = nt; if (iss.fix === 'fill') { st.o = 'ai'; st.ed = false; } else st.ed = true;
      saveSegs(p, segs);
      if (!silent) {
        if (btn) burstAt(btn, iss.type === 'Türk forması' ? 'ink' : 'stars');
        var go = function () { drawAll(); celebrateMaybe(); };
        if (row && !reduced()) { row.classList.add('is-done'); S.later(go, 220); } else go();
        toast('Düzəldildi', 'ok', { sub: '#' + iss.n + ' · ' + (iss.was ? iss.was + ' → ' : '') + (iss.fix === 'fill' ? 'AI qaralaması' : iss.now) + ' · ' + iss.elder, ms: 2600 });
      }
      return true;
    }
    function celebrateMaybe() {
      if (!M.act.length) { burstAt(secScore, 'confetti'); nz('celebrate', 'Bir dənə də qeyd qalmadı! Təhvil paketi hazırlansın?', 3200); }
      else if (!M.sev.high) nz('success', 'Kritik qeyd qalmadı — ' + M.score + ' bal.', 2200);
    }
    function fixAll() {
      var list = M.act.filter(function (x) { return x.fix === 'word' || x.fix === 'raw' || x.fix === 'fill'; });
      if (!list.length) { toast('Avtomatik düzəliş qalmayıb', 'info', { sub: M.act.length ? 'Qalan qeydlər sizin qərarınızı tələb edir' : 'Hamısı təmizdir' }); return; }
      var n = 0;
      list.forEach(function (x) { if (fixIssue(x, null, null, true)) n++; });
      drawAll();
      burstAt(fixAllBtn, 'stars');
      toast(n + ' düzəliş tətbiq edildi', 'ok', { sub: 'Yeni bal: ' + M.score + (M.act.length ? ' · ' + M.act.length + ' qeyd sizin qərarınızı gözləyir' : ''), icon: 'wand' });
      celebrateMaybe();
    }
    function drawIssues(onlyTypes) {
      var cnt = { all: M.issues.length, high: 0, mid: 0, low: 0 };
      M.issues.forEach(function (x) { cnt[x.sev]++; });
      Object.keys(issTabs).forEach(function (k) { issTabs[k].b.setAttribute('aria-selected', k === sevF ? 'true' : 'false'); issTabs[k].c.textContent = String(cnt[k]); });
      var autoN = M.act.filter(function (x) { return x.fix === 'word' || x.fix === 'raw' || x.fix === 'fill'; }).length;
      fixAllBtn.disabled = !autoN;
      fixAllBtn.lastChild.textContent = autoN ? 'Hamısını düzəlt (' + autoN + ')' : 'Hamısını düzəlt';
      issList.textContent = '';
      var list = M.issues.filter(function (x) { return (sevF === 'all' || x.sev === sevF) && (!onlyTypes || onlyTypes.indexOf(x.type) >= 0); });
      if (onlyTypes) issList.appendChild(h('div', { class: 'row', style: 'padding:6px 0 4px' }, badge('Filtr: ' + onlyTypes.join(', '), 'navy'), h('button', { class: 'link small', type: 'button', onclick: function () { drawIssues(); } }, 'Hamısını göstər')));
      if (!list.length) {
        issList.appendChild(emptyBox(S, M.act.length ? { title: 'Bu səviyyədə qeyd yoxdur', text: 'Başqa tabı seçin.', state: 'idle' }
          : { title: 'Qeyd qalmadı', text: 'Bütün yoxlamalar keçdi. Möhür üçün Mirzə Məclisini çağırın.', state: 'celebrate', actions: [h('button', { class: 'btn btn-secondary', type: 'button', onclick: deepQA }, ie('stamp'), 'Dərin QA')] }));
        return;
      }
      list.forEach(function (x) {
        var sv = SEV_L[x.sev], ea = ELDER_AV[x.elder] || ['N', 'av-nar'];
        var row = h('div', { class: 'qa-issue' + (x.ign ? ' is-ign' : '') });
        var seg = h('button', { class: 'qa-segno', type: 'button', title: 'Redaktorda #' + x.n + ' seqmentini aç', 'aria-label': 'Seqment ' + x.n + ' — redaktorda aç', onclick: function () { goSeg(x.n); } }, '#' + x.n);
        var diff = x.was && x.now ? h('div', { class: 'qa-diff' }, h('s', { text: x.was }), ' → ', h('ins', { text: x.now }))
          : x.fix === 'fill' ? h('div', { class: 'qa-diff' }, h('ins', { text: x.now })) : x.was ? h('div', { class: 'qa-diff' }, h('s', { text: x.was })) : null;
        var acts = h('div', { class: 'qa-issue-act' });
        if (x.ign) acts.appendChild(h('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: function () { delete ignored[x.key]; sset('pj:qaign:' + p.id, ignored); drawAll(); } }, ie('refresh'), 'Qaytar'));
        else {
          if (x.fix === 'word' || x.fix === 'raw' || x.fix === 'fill') {
            var fb = h('button', { class: 'btn btn-sm', type: 'button' }, ie('wand'), x.fix === 'fill' ? 'AI ilə doldur' : 'Düzəlt');
            fb.addEventListener('click', function () { fixIssue(x, row, fb); });
            acts.appendChild(fb);
          } else if (x.fix === 'ask') acts.appendChild(h('button', { class: 'btn btn-sm btn-secondary', type: 'button', onclick: function () { goSeg(x.n); } }, ie('help'), 'Cavabla'));
          else acts.appendChild(h('button', { class: 'btn btn-sm', type: 'button', onclick: function () { goSeg(x.n); } }, ie('edit'), 'Redaktə'));
          acts.appendChild(h('button', { class: 'icon-btn ghost sm', type: 'button', title: 'Rədd et — qəbul edilir', 'aria-label': 'Qeydi rədd et', html: App.icon('x'), onclick: function () {
            ignored[x.key] = true; sset('pj:qaign:' + p.id, ignored);
            toast('Qeyd rədd edildi', 'info', { sub: '#' + x.n + ' · bal hesabından çıxarıldı', ms: 2200 }); drawAll();
          } }));
        }
        row.appendChild(seg);
        row.appendChild(h('div', { class: 'qa-issue-b' },
          h('div', { class: 'qa-issue-h' }, badge(sv[0], sv[1]), h('span', { text: x.type }), (App.elderFace && App.elderFace(x.elder, 'sm')) || h('span', { class: 'avatar sm ' + ea[1], 'aria-hidden': 'true', text: ea[0] }), h('small', { text: x.elder })),
          diff, h('p', { text: x.text })));
        row.appendChild(acts);
        issList.appendChild(row);
      });
    }
    function drawTurk() {
      secTurk.textContent = '';
      var list = M.act.filter(function (x) { return x.type === 'Türk forması'; });
      var fixBtn = list.length ? h('button', { class: 'btn btn-sm', type: 'button' }, ie('wand'), 'Hamısını düzəlt') : null;
      if (fixBtn) fixBtn.addEventListener('click', function () {
        list.forEach(function (x) { fixIssue(x, null, null, true); });
        burstAt(fixBtn, 'ink'); drawAll();
        toast(list.length + ' türk forması düzəldildi', 'ok', { sub: 'Dilçi Nənə: mətn ədəbi normaya uyğundur' });
        nz('success', 'Dilçi Nənə razıdır!', 2000);
      });
      secTurk.appendChild(h('div', { class: 'card-h' }, h('div', null, h('span', { class: 'eyebrow', text: 'Dilçi Nənə' }), h('h2', { text: 'Türk formaları' })), fixBtn));
      if (!list.length) { secTurk.appendChild(h('div', { class: 'callout green' }, ie('check'), h('div', null, h('b', { text: 'Tapılmadı. ' }), 'Mətn Azərbaycan ədəbi normasına uyğundur — «için», «değil», «tarafından» kimi formalar yoxdur.'))); return; }
      secTurk.appendChild(h('p', { class: 'small muted', style: 'margin-bottom:10px', text: 'Türk dilindən keçən formalar Azərbaycan oxucusuna dərhal «yad» görünür.' }));
      secTurk.appendChild(h('div', { class: 'qa-turk' }, list.map(function (x) {
        var row = h('div', { class: 'qa-turk-row' });
        var fb = h('button', { class: 'btn btn-ghost btn-sm', type: 'button', 'aria-label': 'Düzəlt: ' + x.was + ' → ' + x.now }, 'Düzəlt');
        fb.addEventListener('click', function () { fixIssue(x, null, fb); });
        row.appendChild(h('button', { class: 'qa-segno', type: 'button', 'aria-label': 'Seqment ' + x.n + ' — redaktorda aç', onclick: function () { goSeg(x.n); } }, '#' + x.n));
        row.appendChild(h('span', { class: 'qa-diff' }, h('s', { text: x.was }), ' → ', h('ins', { text: x.now })));
        row.appendChild(fb);
        return row;
      })));
    }
    function drawTerms() {
      secTerms.textContent = '';
      var rowsT = [];
      gl.forEach(function (g) {
        var re = new RegExp('(^|[^\\p{L}])' + reEsc(g.hl || g.a), 'iu');
        var src = 0, ok = 0, bad = 0, badSeg = [];
        segs.forEach(function (st, i) {
          var d = set.segs[i], t = String(st.t || ''), lt = lower(t);
          var isBad = (g.bad || []).some(function (pr) { return hasWord(t, pr[0], false); });
          if (isBad) { bad++; badSeg.push(i + 1); }
          if (re.test(srcFor(d.s, g))) { src++; if (!isBad && g.stem && lt.indexOf(g.stem) >= 0) ok++; }
        });
        if (src || bad) rowsT.push({ g: g, src: Math.max(src, ok + bad), ok: ok, bad: bad, badSeg: badSeg });
      });
      var badTotal = rowsT.reduce(function (s, x) { return s + x.bad; }, 0);
      secTerms.appendChild(h('div', { class: 'card-h' }, h('div', null, h('span', { class: 'eyebrow', text: 'Lüğətçi Mirzə' }), h('h2', { text: 'Termin ardıcıllığı' })),
        badTotal ? badge(badTotal + ' uyğunsuzluq', 'red') : badge('Ardıcıl', 'green', 'check')));
      if (!rowsT.length) { secTerms.appendChild(h('p', { class: 'muted small', text: 'Bu bölmədə lüğət terminlərinə rast gəlinmədi.' })); return; }
      secTerms.appendChild(h('div', null, rowsT.slice(0, 7).map(function (x) {
        var end = h('div', { class: 'qa-term-end' });
        if (x.bad) {
          end.appendChild(h('button', { class: 'link small', type: 'button', onclick: function () { goSeg(x.badSeg[0]); } }, '#' + x.badSeg.join(', #')));
          var eb = h('button', { class: 'btn btn-sm', type: 'button' }, 'Eyniləşdir');
          eb.addEventListener('click', function () {
            var n = 0;
            M.act.forEach(function (iss) { if (iss.type === 'Termin' && iss.term === x.g.a && fixIssue(iss, null, null, true)) n++; });
            burstAt(eb, 'stars'); drawAll();
            toast(n + ' seqment eyniləşdirildi', 'ok', { sub: '«' + x.g.a + '» → «' + x.g.b + '» · Lüğətçi Mirzə' });
          });
          end.appendChild(eb);
        } else end.appendChild(h('span', { class: 'small muted tnum', text: x.ok + '/' + x.src }));
        return h('div', { class: 'qa-term' },
          h('div', { class: 'qa-term-t' }, h('b', { text: x.g.a }), h('span', { text: '→' }), x.g.b),
          end,
          h('div', { class: 'qa-term-bar', role: 'img', 'aria-label': x.ok + ' düzgün, ' + x.bad + ' uyğunsuz, cəmi ' + x.src }, h('i', { style: 'width:' + (x.ok / x.src * 100) + '%' }), h('i', { class: 'bad', style: 'width:' + (x.bad / x.src * 100) + '%' })));
      })));
    }
    function drawReqs() {
      secReqs.textContent = '';
      var reqs = reqsOf(p), okN = 0;
      var list = reqs.map(function (rq, i) {
        var auto = !!rq[1], ok;
        if (auto) { var types = catTypes(rq[1]); ok = !M.act.some(function (x) { return types.indexOf(x.type) >= 0; }); }
        else ok = !!reqManual[i];
        if (ok) okN++;
        var b = h('button', { class: 'qa-req' + (ok ? ' ok' : auto ? ' fail' : ''), type: 'button', 'aria-pressed': ok ? 'true' : 'false' },
          h('span', { class: 'qa-box', html: ok ? App.icon('check') : auto ? App.icon('alert') : '' }),
          h('span', { class: 'qa-req-t', text: rq[0] }),
          auto ? badge('Avto', ok ? 'green' : 'gold') : badge('Əl ilə'));
        b.addEventListener('click', function () {
          if (auto) {
            if (ok) { toast('Avtomatik yoxlandı', 'ok', { sub: rq[0], ms: 2000 }); return; }
            sevF = 'all'; drawIssues(catTypes(rq[1]));
            try { secIssues.scrollIntoView({ block: 'start', behavior: reduced() ? 'auto' : 'smooth' }); } catch (e) { /* ignore */ }
            return;
          }
          reqManual[i] = !reqManual[i]; sset('pj:req:' + p.id, reqManual); drawReqs();
          if (reqManual[i]) burstAt(secReqs, 'stars');
        });
        return b;
      });
      secReqs.appendChild(h('div', { class: 'card-h' }, h('div', null, h('span', { class: 'eyebrow', text: 'Müştəri' }), h('h2', { text: 'Tələblər' })), badge(okN + ' / ' + reqs.length, okN === reqs.length ? 'green' : 'gold')));
      secReqs.appendChild(h('div', { class: 'progress thin' + (okN === reqs.length ? ' green' : ' gold'), style: 'margin-bottom:6px' }, h('i', { style: 'width:' + Math.round(okN / reqs.length * 100) + '%' })));
      secReqs.appendChild(h('div', null, list));
    }
    var DELIV = [
      { id: 'mono', ic: 'file', cls: 'nar', b: 'Word: yalnız tərcümə', s: 'DOCX · format qorunur', ext: 'AZ.docx' },
      { id: 'bi', ic: 'layers', cls: 'gold', b: 'Word: iki dilli', s: 'Cədvəl: mənbə | tərcümə', ext: upper(set.src) + '-AZ_ikidilli.docx' },
      { id: 'rep', ic: 'shield', cls: 'green', b: 'QA hesabatı', s: 'PDF · Məclis möhürü ilə', ext: 'QA_hesabati.pdf' }
    ];
    function buildDeliv() {
      secDeliv.textContent = '';
      secDeliv.appendChild(h('div', { class: 'card-h' }, h('div', null, h('span', { class: 'eyebrow', text: 'Təhvil' }), h('h2', { text: 'Təhvil faylları' }))));
      secDeliv.appendChild(h('p', { class: 'small muted', style: 'margin-bottom:12px', text: 'Fayl seçin — Nuanza formatı və tərcümə yaddaşını qoruyaraq hazırlayır.' }));
      secDeliv.appendChild(h('div', { class: 'tiles' }, DELIV.map(function (dv) {
        var bd = h('span', { class: 'badge green', hidden: true }, ie('check'), 'Hazır');
        var t = h('button', { class: 'tile qa-tile', type: 'button' }, icTile(dv.ic, dv.cls), h('span', null, h('b', { text: dv.b }), h('small', { text: dv.s })), bd);
        delivTiles[dv.id] = { t: t, bd: bd };
        t.addEventListener('click', function () { makeDeliv(dv, t, bd); });
        return t;
      })));
    }
    function drawDelivBadges() {
      var made = getMap('pj:deliv:' + p.id);
      Object.keys(delivTiles).forEach(function (k) { delivTiles[k].bd.hidden = !made[k]; });
    }
    function makeDeliv(dv, t, bd) {
      if (t.getAttribute('aria-busy') === 'true') return;
      t.setAttribute('aria-busy', 'true');
      nz('write', 'Faylı hazırlayıram…', 1400);
      S.later(function () {
        t.removeAttribute('aria-busy'); bd.hidden = false;
        var made = getMap('pj:deliv:' + p.id); made[dv.id] = Date.now(); sset('pj:deliv:' + p.id, made);
        var fname = slug(p.client) + '_' + slug(p.name) + '_' + dv.ext;
        var warn = M.sev.high ? ' · ' + M.sev.high + ' kritik qeyd açıqdır' : '';
        toast('Hazırdır', M.sev.high ? 'warn' : 'ok', { sub: fname + warn, icon: dv.ic, action: { label: 'Önizlə', onClick: function () { preview(dv, fname); } } });
        burstAt(t, 'stars');
        nz(M.sev.high ? 'worried' : 'success', M.sev.high ? 'Hazırdır, amma kritik qeydləri bağlamağı unutmayın.' : 'Təhvil faylı hazırdır!', 2400);
      }, 1100 + Math.round(Math.random() * 500));
    }
    function preview(dv, fname) {
      var body;
      if (dv.id === 'rep') {
        body = h('div', { class: 'qa-paper' }, h('h3', { text: 'KEYFİYYƏT YOXLAMASI HESABATI' }), h('p', { class: 'muted', style: 'text-align:center', text: p.client + ' — ' + p.name + ' · ' + (App.fmt ? App.fmt.date(new Date()) : '') }),
          h('div', { class: 'editor-check' }, App.ring(M.score, 'bal', null, { size: 'sm' }), h('dl', { class: 'kv', style: 'flex:1' },
            h('dt', { text: 'Qiymət' }), h('dd', { text: gradeOf(M.score) }),
            h('dt', { text: 'Kritik / orta / kiçik' }), h('dd', { text: M.sev.high + ' / ' + M.sev.mid + ' / ' + M.sev.low }),
            h('dt', { text: 'Möhür' }), h('dd', { text: sealOf(M.score) }))),
          h('div', { class: 'divider orn' }),
          CATS.map(function (c) { var n = M.act.filter(function (x) { return c.types.indexOf(x.type) >= 0; }).length; return h('div', { class: 'row between small' }, h('span', { text: c.label }), h('b', { text: n ? n + ' qeyd' : 'təmiz' })); }));
      } else if (dv.id === 'bi') {
        body = h('div', { class: 'table-wrap' }, h('table', { class: 'table compact' },
          h('thead', null, h('tr', null, h('th', { text: '#' }), h('th', { text: upper(set.src) }), h('th', { text: 'AZ' }))),
          h('tbody', null, set.segs.slice(0, 6).map(function (d, i) { return h('tr', null, h('td', { class: 'muted', text: String(i + 1) }), h('td', { text: d.s }), h('td', { text: segs[i].t || '—' })); }))));
      } else {
        body = h('div', { class: 'qa-paper' }, segs.slice(0, 7).map(function (st, i) { return h('p', { text: st.t || '[' + (i + 1) + ' — tərcümə edilməyib]', style: i === 0 ? 'text-align:center;font-weight:600' : null }); }),
          h('p', { class: 'muted', text: '… və daha ' + num(Math.max(0, p.segs - 7)) + ' seqment' }));
      }
      App.sheet({ title: fname, wide: true, body: h('div', { class: 'stack' }, h('div', { class: 'row' }, badge('Önizləmə', 'navy', 'eye'), badge(dv.b)), body),
        actions: [{ label: 'Bağla', kind: 'ghost' }, { label: 'Müştəriyə göndər', kind: 'primary', icon: 'send', onClick: function () {
          toast('Göndərildi', 'ok', { sub: fname + ' · ' + p.client + ' · Telegram və e-poçt', icon: 'send' });
          nz('celebrate', 'Göndərildi! Müştəri təsdiqləyəndə xəbər verəcəyəm.', 2800);
        } }] });
    }
    function deepQA() {
      if (deepBtn.getAttribute('aria-busy') === 'true') return;
      if (!M) { toast('Yoxlama hələ gedir', 'info', { ms: 1800 }); return; }
      deepBtn.setAttribute('aria-busy', 'true');
      var cnt = function (t) { return M.act.filter(function (x) { return x.type === t; }).length; };
      var hi = M.sev.high, turk = cnt('Türk forması'), terms = cnt('Termin'), numsN = cnt('Rəqəm');
      var text = (hi ? 'Məclis ' + hi + ' kritik qeyd tapdı' + (numsN ? ' (rəqəm uyğunsuzluğu daxil)' : '') + '. Təhvildən əvvəl bağlayın. ' : 'Məna mənbə ilə üst-üstə düşür, rəqəmlər və tarixlər möhürləndi. ') +
        (terms ? 'Lüğətçi Mirzə ' + terms + ' termin uyğunsuzluğu qeyd etdi. ' : 'Terminlər lüğətə uyğundur. ') +
        (turk ? 'Dilçi Nənə ' + turk + ' türk forması tapdı.' : 'Dilçi Nənə türk formasına rast gəlmədi.');
      var v = { score: M.score, text: text, seal: sealOf(M.score) };
      Promise.resolve(App.bigJob('Dərin QA — ' + p.name, v)).then(function () {
        if (S.dead) return;
        deepBtn.removeAttribute('aria-busy');
        sset('pj:deep:' + p.id, { score: v.score, at: Date.now() });
        setMap('pj:qa', p.id, v.score);
        drawAll();
        burstAt(sealHost, 'stars');
      }, function () { deepBtn.removeAttribute('aria-busy'); });
    }
    deepBtn.addEventListener('click', deepQA);
    againBtn.addEventListener('click', function () { if (againBtn.getAttribute('aria-busy') !== 'true') run(false); });
    run(true);
    S.finals.push(function () { if (built) saveSegs(p, segs); });
  }

  /* ------------------------------------------------------------------
     10. REGISTER
     ------------------------------------------------------------------ */
  App.register('projects', {
    title: 'Layihələr', icon: 'folder', group: 'Peşəkar', mode: 'pro', order: 2,
    badge: function () {
      try { return allProjects().filter(function (p) { return p.status !== 'delivered' && p.due.getTime() - Date.now() < 2 * DAY; }).length || null; } catch (e) { return null; }
    },
    render: renderProjects,
    leave: function () { endScope('projects'); }
  });
  App.register('editor', {
    title: 'Redaktor', icon: 'edit', group: 'Peşəkar', mode: 'pro', order: 3,
    render: renderEditor,
    leave: function () { endScope('editor'); }
  });
  App.register('qa', {
    title: 'QA yoxlaması', icon: 'shield', group: 'Peşəkar', mode: 'pro', order: 4,
    render: renderQA,
    leave: function () { endScope('qa'); }
  });

  /* Small public hook so other screens can open the same «Yeni layihə» sheet. */
  App.projects = { open: function (id) { App.go('editor', { project: id }); }, create: function () { newProjectSheet(null); }, list: allProjects,
    qaInput: function (id) { var p = id ? findProject(String(id)) : null; return p ? qaInput(p, loadSegs(p)) : null; } };
})();
