/* =====================================================================
   NUANZA — s-projects.js
   Peşəkar rejim ekranları:
     • 'projects' — layihə cədvəli (layihə · müştəri · dil cütü · hazırlıq · status · təhvil),
                    axtarış + status filtri, «Yeni layihə» vərəqi (fayl, situasiya, tələblər).
     • 'editor'   — CAT redaktoru, üç panel: seqment naviqatoru (filtr, status nöqtələri) ·
                    mənbə + tərcümə (təsdiq, ilkin tərcümə — Mirzə Məclisi, sual, tez düzəlişlər) ·
                    inspektor (Kontekst · Lüğət · TM · Təklif · Yoxlama). Planşetdə inspektor yan
                    vərəq, mobildə naviqator çəkməcə, inspektor alt vərəqdir.
     • 'qa'       — rəyçi interfeysi: bal xülasəsi, ciddilik (Kritik/Əsas/Kiçik) və növ filtrləri,
                    Mənbə · Tərcümə · Düzəliş · Problem · Yoxlayan cədvəli, türk formaları,
                    termin ardıcıllığı, müştəri tələbləri, təhvil faylları, dərin yoxlama.
   Plain browser JS. Uses App.* (app.js) and app.css components. Screen CSS: pj-/projects-/editor-/qa-.
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
  function toast(text, kind, o) { try { return App.toast(text, kind, o); } catch (e) { return null; } }
  /* Work screens stay calm: state changes (dot, label) are the feedback — no particle bursts. */
  function burstAt(el, kind) { return el && kind ? null : null; }
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
      /* the companion lives only in the corner dock — empty states keep their quiet icon */
      if (host) return null;
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
  var SEV_L = { high: ['Kritik', 'red'], mid: ['Əsas', 'gold'], low: ['Kiçik', 'navy'] };
  var CONF_L = { high: 'Əmin', mid: 'Yoxlayın', low: 'Şübhəli' };
  var ELDER = {
    'Termin': 'Lüğətçi Mirzə', 'Məna': 'Mənaçı Mirzə', 'Boş seqment': 'Mənaçı Mirzə', 'Üslub': 'Üslubçu Mirzə', 'Ardıcıllıq': 'Üslubçu Mirzə',
    'Türk forması': 'Dilçi Nənə', 'Orfoqrafiya': 'Dilçi Nənə', 'Durğu': 'Dilçi Nənə', 'Rəqəm': 'Möhürdar Mirzə', 'Ad': 'Möhürdar Mirzə', 'Tarix': 'Möhürdar Mirzə'
  };
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
        tm: { pct: 96, src: 'SERVICE AGREEMENT No. CL-2025/087', tgt: 'XİDMƏT MÜQAVİLƏSİ № CL-2025/087', from: 'Nümunə TM — xidmət müqaviləsi (2025)', date: '2025-11-20' },
        why: 'Başlıq tərcümə yaddaşından götürüldü; müqavilənin nömrəsini Möhürdar Mirzə avtomatik yenilədi.',
        alts: [['XİDMƏTLƏRİN GÖSTƏRİLMƏSİ HAQQINDA MÜQAVİLƏ № CL-2026/114', 'Tam rəsmi forma']] },
      { s: 'This Agreement is made in Baku on 3 October 2026 between Orion Logistics LLC (the "Employer") and Delta Freight Services LLC (the "Contractor").',
        t: 'Bu Müqavilə 3 oktyabr 2026-cı il tarixində Bakı şəhərində «Orion Logistics» MMC (bundan sonra — «Sifarişçi») ilə «Delta Freight Services» MMC (bundan sonra — «İcraçı») arasında bağlanmışdır.',
        o: 'human', ok: true, c: 'high',
        why: 'Azərbaycan müqavilələrində tərəflər «bundan sonra — …» düsturu ilə təqdim olunur. Tarix müştərinin tələbinə görə sözlə yazılıb.',
        alts: [['Bakı şəhəri, 3 oktyabr 2026-cı il. «Orion Logistics» MMC (bundan sonra — «Sifarişçi») və «Delta Freight Services» MMC (bundan sonra — «İcraçı») aşağıdakılar barədə bu Müqaviləni bağladılar:', 'Klassik giriş düsturu']] },
      { s: 'This Agreement shall enter into force on the date of its signature.', t: 'Bu Müqavilə imzalandığı tarixdən qüvvəyə minir.', o: 'tm', c: 'high',
        tm: { pct: 87, src: 'This Contract shall enter into force on the date of its signing.', tgt: 'Bu Müqavilə imzalandığı tarixdən qüvvəyə minir.', from: 'Nümunə TM — təchizat müqaviləsi', date: '2026-08-14', diff: '«Contract» → «Agreement», «signing» → «signature». Mənaya təsir etmir.' },
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
        tm: { pct: 92, src: 'Either Party may terminate this Contract by giving the other Party thirty (30) days\' prior written notice.', tgt: 'Tərəflərdən hər biri digər Tərəfə otuz (30) gün əvvəl yazılı bildiriş göndərməklə bu Müqaviləyə xitam verə bilər.', from: 'Nümunə TM — təchizat müqaviləsi', date: '2026-08-14', diff: 'Yalnız müddət fərqlidir: Möhürdar Mirzə rəqəmi yenilədi (30 → 60).' },
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
        tm: { pct: 100, src: 'This Agreement shall be governed by the laws of the Republic of Azerbaijan.', tgt: 'Bu Müqavilə Azərbaycan Respublikasının qanunvericiliyi ilə tənzimlənir.', from: 'Nümunə TM — təchizat müqaviləsi', date: '2026-08-14' },
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
        tm: { pct: 95, src: 'ДОПОЛНИТЕЛЬНОЕ СОГЛАШЕНИЕ № 1 к Кредитному договору № KB-0417/2025', tgt: 'KB-0417/2025 №-li Kredit müqaviləsinə 1 №-li Əlavə saziş', from: 'Nümunə TM — əlavə saziş №1', date: '2026-02-09' },
        why: 'Rus başlığında nömrə əvvəldə gəlir; Azərbaycan dilində «…№-li … müqaviləsinə Əlavə saziş» düsturu işlənir.' },
      { s: 'г. Баку, 6 октября 2026 года', t: 'Bakı şəhəri, 6 oktyabr 2026-cı il', o: 'tm', ok: true, c: 'high', why: 'Tarix sözlə, ay adı kiçik hərflə yazılır.' },
      { s: 'Банк предоставляет Заёмщику кредит в размере 1 250 000,00 (один миллион двести пятьдесят тысяч) манатов.',
        t: 'Bank Borcalana 1 250 000,00 (bir milyon iki yüz əlli min) manat məbləğində kredit verir.', o: 'ai', ok: true, c: 'high',
        why: 'Məbləğ rəqəm və sözlə, mənbədəki kimi verilib. «Заёмщик» — «Borcalan».' },
      { s: 'Процентная ставка по кредиту составляет 14,5% годовых.', t: 'Kredit üzrə faiz dərəcəsi illik 14,5% təşkil edir.', o: 'tm', c: 'high',
        tm: { pct: 94, src: 'Процентная ставка по кредиту составляет 16% годовых.', tgt: 'Kredit üzrə faiz dərəcəsi illik 16% təşkil edir.', from: 'Nümunə TM — kredit müqaviləsi', date: '2025-12-02', diff: 'Faiz dərəcəsi yeniləndi: 16% → 14,5%.' },
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
      { s: 'Подписи Сторон: Банк — ОАО «Орион Банк»; Заёмщик — ООО «Гянджа Агро».', t: 'Tərəflərin imzaları: Bank — «Orion Bank» ASC; Borcalan — «Gyandja Aqro» MMC.', o: 'ai', c: 'high',
        why: 'Rus dilindən keçən Azərbaycan toponimləri orijinal yazılışa qaytarılır: «Гянджа» — «Gəncə». ОАО — ASC, ООО — MMC.' }
    ] },
    'report-en': { src: 'en', title: 'Fəsil 3 · Maliyyə göstəriciləri', names: [], segs: [
      { s: 'Chapter 3. Financial and Operational Performance', t: '3-cü fəsil. Maliyyə və əməliyyat göstəriciləri', o: 'tm', ok: true, c: 'high', why: 'Fəsil başlıqları hesabatın əvvəlki illərindən götürüldü.' },
      { s: 'In 2025, crude oil production totalled 29.6 million tonnes, up 1.4% year on year.',
        t: '2025-ci ildə xam neft hasilatı 29,6 milyon ton təşkil edib ki, bu da ötən illə müqayisədə 1,4% çoxdur.', o: 'ai', ok: true, c: 'high', why: 'Onluq kəsrlər vergüllə yazılıb.' },
      { s: 'Net profit increased by 12.4% to AZN 4.1 billion.', t: 'Təmiz mənfəət 12.4% artaraq 4,1 milyard manata çatıb.', o: 'ai', c: 'high',
        why: '«net profit» şirkət lüğətində «xalis mənfəət»dir. «12.4%» ingilis yazılışıdır — vergüllə olmalıdır.',
        alts: [['Xalis mənfəət 12,4% artaraq 4,1 milyard manata çatıb.', 'Düzəldilmiş'], ['Xalis mənfəət 12,4% artımla 4,1 milyard manat təşkil edib.', 'Rəsmi hesabat dili']] },
      { s: 'Capital expenditure on upstream projects amounted to AZN 2.3 billion.', t: 'Hasilat layihələrinə yönəldilmiş əsaslı xərclər 2,3 milyard manat təşkil edib.', o: 'tm', c: 'high',
        tm: { pct: 89, src: 'Capital expenditure on upstream projects amounted to AZN 1.9 billion.', tgt: 'Hasilat layihələrinə yönəldilmiş əsaslı xərclər 1,9 milyard manat təşkil edib.', from: 'Nümunə TM — illik hesabat 2024', date: '2025-05-30', diff: 'Yalnız məbləğ fərqlidir: 1,9 → 2,3.' },
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
      { s: 'Welcome to the University!', t: 'Universitetə xoş gəlmisiniz!', o: 'tm', ok: true, c: 'high', why: 'Keçən ilin bələdçisindən tam uyğunluq.' },
      { s: 'Your student ID card gives you access to the library, sports centre and campus buildings.',
        t: 'Tələbə vəsiqəniz kitabxanaya, idman mərkəzinə və kampus binalarına giriş imkanı verir.', o: 'ai', ok: true, c: 'high', why: '«student ID card» — «tələbə vəsiqəsi».' },
      { s: 'Course registration opens on 1 September and closes on 12 September.', t: 'Kurslara qeydiyyat 1 sentyabrda başlayır və 12 sentyabrda başa çatır.', o: 'ai', ok: true, c: 'high', why: 'Tarixlər Azərbaycan qaydası ilə: gün, ay kiçik hərflə.' },
      { s: 'If you miss more than 20% of classes, you may not be allowed to sit the final exam.', t: 'Dərslərin 20%-dən çoxunu buraxsanız, yekun imtahana buraxılmaya bilərsiniz.', o: 'ai', c: 'mid',
        why: '«buraxmaq» cümlədə iki fərqli mənada işlənib. Məna düzgündür, amma oxucu çaşa bilər — üslubu yoxlayın.',
        alts: [['Dərslərin 20%-dən çoxunda iştirak etməsəniz, yekun imtahana buraxılmaya bilərsiniz.', 'Aydın'], ['Dərslərin 20%-dən çoxunu qaçırsanız, yekun imtahana qəbul edilməyə bilərsiniz.', 'Səmimi']] },
      { s: 'Need help? Contact the Student Services office on the ground floor of Building A.', t: 'Köməyə ehtiyacınız var? A binasının birinci mərtəbəsindəki Tələbə xidmətləri ofisinə müraciət edin.', o: 'tm', c: 'high',
        tm: { pct: 91, src: 'Need help? Contact the Student Services office on the ground floor of Building B.', tgt: 'Köməyə ehtiyacınız var? B binasının birinci mərtəbəsindəki Tələbə xidmətləri ofisinə müraciət edin.', from: 'Nümunə TM — tələbə bələdçisi', date: '2025-08-21', diff: 'Bina dəyişib: B → A.' },
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

  /* Situation + requirements of the one built-in sample project (generic, no real client). */
  var SIT = {
    sample: { purpose: 'İmza üçün. Azərbaycan nüsxəsi ingilis nüsxəsi ilə eyni hüquqi qüvvəyə malikdir.', audience: 'Sifarişçinin hüquq şöbəsi və İcraçının rəhbərliyi', note: '«Tərəflərin adları bütün mətndə eyni yazılsın. Tarixləri sözlə verin.»' }
  };
  var REQS = {
    sample: [['«Employer» — «Sifarişçi», «Contractor» — «İcraçı»', 'terms'], ['Dırnaq işarələri: «…»', 'punct'], ['Məbləğlər mənbə ilə eyni, rəqəm və sözlə', 'numbers'], ['Türk formaları olmamalıdır', 'turkish'], ['Bütün seqmentlər tərcümə edilməli', 'complete'], ['Əvəzlik yox — tərəfin adı yazılsın', 'meaning']]
  };
  var DEFAULT_REQS = [['Layihə lüğəti məcburi', 'terms'], ['Rəqəm və tarixlər mənbə ilə eyni', 'numbers'], ['Türk formaları olmamalıdır', 'turkish'], ['Dırnaq və onluq kəsr Azərbaycan normasına uyğun', 'punct'], ['Bütün seqmentlər tərcümə edilməli', 'complete']];
  var REQ_CHIPS = [['Müştəri lüğəti məcburi', 'terms'], ['Rəqəmlər mənbədəki kimi', 'numbers'], ['Türk formaları olmasın', 'turkish'], ['Tarixlər sözlə', null], ['Formatı qoru', null], ['İki dilli cədvəl', null]];
  var SIT_CHIPS = ['İmza üçün', 'Məhkəməyə təqdim', 'Notarial təsdiq', 'Saytda dərc', 'Daxili istifadə'];

  /* ------------------------------------------------------------------
     3. PROJECTS MODEL
     ------------------------------------------------------------------ */
  /* The user's projects live in store key 'pj:created' (nuanza2:pj:created). The single sample
     («Nümunə layihə») is not stored as a project: it is shown only while 'pj:sample' is true —
     switched on by «Nümunəyə bax», off when the user deletes it. It never counts in stats. */
  var SAMPLE_ID = 'sample';
  function sampleOn() { return sget('pj:sample', false) === true; }
  function sampleProject() {
    var set = SETS['legal-en'], ok = 0;
    set.segs.forEach(function (d) { if (d.ok) ok++; });
    return { id: SAMPLE_ID, name: 'Xidmət müqaviləsi', client: 'Nümunə müştəri', pair: 'en-az', field: 'Hüquq', reg: 'huquqi', words: setWords('legal-en'),
      segs: set.segs.length, done: Math.round(ok / set.segs.length * 100), due: null, qa: null, kind: 'real', set: 'legal-en', status: 'active', sample: true };
  }
  function openSample() {
    sset('pj:sample', true); setMap('pj:removed', SAMPLE_ID);
    App.go('editor', { project: SAMPLE_ID });
  }
  function removeSample() {
    sset('pj:sample', false);
    ['pj:segs:', 'pj:reg:', 'pj:sit:', 'pj:gl:', 'pj:qaign:', 'pj:req:', 'pj:deliv:', 'pj:deep:'].forEach(function (k) { try { App.store.remove(k + SAMPLE_ID); } catch (e) { /* storage blocked */ } });
    ['pj:prog', 'pj:qa', 'pj:status'].forEach(function (k) { setMap(k, SAMPLE_ID); });
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
  function allProjects(noSample) {
    var removed = getMap('pj:removed'), prog = getMap('pj:prog'), qa = getMap('pj:qa'), status = getMap('pj:status');
    var created = sget('pj:created', []);
    if (!Array.isArray(created)) created = [];
    var list = created.map(normCreated).filter(Boolean);
    if (!noSample && sampleOn()) list.push(sampleProject());
    return list.filter(function (p) { return !removed[p.id]; }).map(function (p) {
      p.done0 = p.done;
      if (typeof prog[p.id] === 'number') p.done = prog[p.id];
      if (typeof qa[p.id] === 'number') p.qa = qa[p.id];
      if (status[p.id] === 'delivered' || status[p.id] === 'active') p.status = status[p.id];
      return p;
    });
  }
  /* Real user projects only (no sample) — what stats and other screens should count. */
  function realProjects() { return allProjects(true); }
  function findProject(id) { var l = allProjects(); for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i]; return null; }
  function resolveProject(params) {
    params = params || {};
    var id = params.project || params.id;
    if (id === SAMPLE_ID && !sampleOn()) { sset('pj:sample', true); setMap('pj:removed', SAMPLE_ID); }
    var p = id ? findProject(String(id)) : null;
    if (!p && params.name) {
      var nm = lower(params.name);
      allProjects().some(function (x) { if (lower(x.name) === nm || lower(x.client + ' — ' + x.name) === nm) { p = x; return true; } return false; });
    }
    if (!p) { var last = sget('pj:last', null); p = (last && findProject(last)) || realProjects()[0] || null; }
    return p;
  }
  /* User projects reuse a segment set as their working text; the sample's translation-memory
     matches are sample content, so they are stripped for user projects (no invented TM history). */
  var PLAIN = {};
  function setOf(p) {
    var key = SETS[p && p.set] ? p.set : 'legal-en', s = SETS[key];
    if (p && p.sample) return s;
    if (!PLAIN[key]) {
      PLAIN[key] = { src: s.src, title: s.title, names: s.names, segs: s.segs.map(function (d) {
        var c = {}; for (var k in d) if (k !== 'tm' && Object.prototype.hasOwnProperty.call(d, k)) c[k] = d[k]; return c;
      }) };
    }
    return PLAIN[key];
  }
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
    if (!p.sample) return { t: '', o: null, ok: false, ed: false, ans: null, note: '' };
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
      out.push({ type: 'Məna', sev: 'high', was: d.q.bad, now: '', src: d.q.word, text: '«' + d.q.word + '» kimə aiddir? Hüquqi mətndə tərəfin adı açıq yazılmalıdır.', fix: 'ask' });
    }
    var A = numsOf(d.s, ctx.set.src === 'en' ? 'en' : 'eu'), B = numsOf(t, 'eu'), used = [], missing = [];
    A.forEach(function (x) {
      var j = -1;
      for (var k = 0; k < B.length; k++) if (!used[k] && Math.abs(B[k].v - x.v) < 1e-9) { j = k; break; }
      if (j >= 0) used[j] = true; else missing.push(x);
    });
    if (missing.length) {
      var extra = B.filter(function (y, k) { return !used[k]; }), x0 = missing[0], y0 = extra[0];
      if (y0) out.push({ type: 'Rəqəm', sev: 'high', was: y0.raw, now: fmtAz(x0.v, x0.raw), src: x0.raw, text: 'Mənbədə ' + x0.raw + ', tərcümədə ' + y0.raw + ' — rəqəm uyğun gəlmir.', fix: 'raw' });
      else out.push({ type: 'Rəqəm', sev: 'high', was: x0.raw, now: '', src: x0.raw, text: 'Mənbədəki «' + x0.raw + '» tərcümədə yoxdur.', fix: null });
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
     5. CSS (tokens only; prefixes pj- (shared), projects-, editor-, qa-)
     ------------------------------------------------------------------ */
  var CSS = [
    /* shared */
    '.pj-mono{font-family:var(--f-mono);font-variant-numeric:tabular-nums;letter-spacing:0}',
    '.pj-cap{font:600 var(--t-caption)/1.3333 var(--f-body);letter-spacing:.04em;text-transform:uppercase;color:var(--text-2)}',
    '.pj-dot{flex:none;display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--text-3);transition:background var(--t-fast),box-shadow var(--t-fast)}',
    '.pj-dot.is-empty{background:transparent;box-shadow:inset 0 0 0 1.5px var(--border-2)}',
    '.pj-dot.is-draft{background:var(--text-3)}',
    '.pj-dot.is-edit{background:var(--accent)}',
    '.pj-dot.is-ok{background:var(--success)}',
    '.pj-dot.is-warn{background:var(--warning)}',
    '.pj-dot.is-err{background:var(--danger)}',
    '.pj-dot.is-busy{background:transparent;box-shadow:inset 0 0 0 1.5px var(--accent);animation:pj-pulse 1.1s ease-in-out infinite}',
    '.pj-track{position:relative;display:block;height:4px;border-radius:2px;background:var(--sunken);box-shadow:inset 0 0 0 1px var(--border);overflow:hidden}',
    '.pj-track > i{display:block;height:100%;width:0;background:var(--accent);transition:width 180ms ease}',
    '.pj-track.ok > i,.pj-track.green > i{background:var(--success)}',
    '.pj-track.gold > i{background:var(--warning)}',
    '.pj-track.red > i{background:var(--danger)}',
    '.pj-tag{display:inline-flex;align-items:center;height:18px;padding:0 6px;border:1px solid var(--border);border-radius:4px;color:var(--text-2);font:500 var(--t-micro)/1 var(--f-body);white-space:nowrap}',
    '.pj-tag.new{border-color:var(--accent-line);color:var(--accent)}',
    '.pj-av{flex:none;display:inline-grid;place-items:center;width:22px;height:22px;border-radius:50%;border:1px solid var(--border-2);background:var(--panel);color:var(--text-2);font:600 10px/1 var(--f-body);letter-spacing:.01em}',
    '.pj-sk{display:block;height:10px;border-radius:4px;background:var(--sunken);animation:pj-pulse 1.2s ease-in-out infinite}',
    '.pj-sk-stack{display:grid;gap:10px;align-content:start}',
    '.pj-spin{flex:none;display:inline-block;width:12px;height:12px;border-radius:50%;border:1.5px solid var(--border-2);border-top-color:var(--accent);animation:spin .8s linear infinite}',
    '.pj-empty{display:flex;flex-wrap:wrap;align-items:center;gap:12px 16px;padding:20px 16px}',
    '.pj-empty-ic{flex:none;width:32px;height:32px;display:grid;place-items:center;border-radius:6px;background:var(--sunken);color:var(--text-2)}',
    '.pj-empty-ic svg{width:16px;height:16px}',
    '.pj-empty-tx{flex:1 1 240px;min-width:0;display:grid;gap:2px}',
    '.pj-empty-tx b{font:600 var(--t-body)/1.5 var(--f-body);color:var(--text)}',
    '.pj-empty-tx span{font-size:var(--t-small);line-height:1.4;color:var(--text-2)}',
    '.pj-empty-act{display:flex;flex-wrap:wrap;align-items:center;gap:8px 16px}',
    '.pj-empty.block{border:1px solid var(--border);border-radius:8px;background:var(--panel)}',
    '.pj-x .btn{min-height:28px;padding:0 10px;font-size:var(--t-small)}',
    ':is(.projects,.editor,.qa) .page-h h1{font:600 var(--t-h1)/1.2727 var(--f-display);letter-spacing:-.01em}',
    ':is(.projects,.projects-new,.editor,.qa) .link.small{font-size:var(--t-small)}',
    /* projects — list */
    '.projects{gap:16px}',
    '.projects-sum{display:flex;flex-wrap:wrap;gap:8px 0}',
    '.projects-sum > div{display:grid;gap:1px;padding:0 20px;border-left:1px solid var(--border)}',
    '.projects-sum > div:first-child{padding-left:0;border-left:0}',
    '.projects-sum b{font:600 var(--t-h2)/1.4 var(--f-display);font-variant-numeric:tabular-nums}',
    '.projects-sum span{font-size:var(--t-caption);color:var(--text-2)}',
    '@media (max-width:559px){.projects-sum{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px 16px}.projects-sum > div{padding:0 0 0 12px;border-left:1px solid var(--border)}.projects-sum > div:first-child{padding-left:12px;border-left:1px solid var(--border)}}',
    '.projects-bar{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px}',
    '.projects-bar .input-ic{flex:1 1 220px;max-width:340px}',
    '.projects-bar .input{height:32px;min-height:32px;font-size:var(--t-small)}',
    '.projects-bar .input[type=search]::-webkit-search-cancel-button{opacity:.5}',
    '.projects-filter{max-width:100%}',
    '.projects-filter .projects-fc{font:500 var(--t-micro)/1 var(--f-mono);color:var(--text-3)}',
    '.projects-filter button[aria-pressed="true"] .projects-fc{color:var(--text-2)}',
    '.projects-list{container-type:inline-size;border:1px solid var(--border);border-radius:8px;background:var(--panel);overflow:hidden}',
    '.projects-tr{position:relative;display:grid;grid-template-columns:minmax(0,2.3fr) minmax(0,1.2fr) 76px minmax(104px,1fr) 136px 124px 84px;align-items:center;gap:16px;padding:10px 12px 10px 16px}',
    '.projects-th{padding-block:8px;background:var(--sunken);border-bottom:1px solid var(--border);color:var(--text-2);font:500 var(--t-caption)/1.3333 var(--f-body)}',
    '.projects-row{transition:background var(--t-fast),opacity 160ms ease}',
    '.projects-row + .projects-row{border-top:1px solid var(--border)}',
    '@media (hover:hover){.projects-row:hover{background:var(--hover)}}',
    '.projects-row:focus-within{background:var(--hover)}',
    '.projects-row.is-new{box-shadow:inset 2px 0 0 var(--accent)}',
    '.projects-row.is-gone{opacity:0}',
    '.projects-c-name{min-width:0;display:grid;gap:2px}',
    '.projects-open{display:block;width:100%;min-width:0;padding:0;border:0;background:none;color:inherit;font:inherit;text-align:left;cursor:pointer;outline:none}',
    '.projects-open::after{content:"";position:absolute;inset:0;z-index:0}',
    '.projects-open:focus-visible::after{box-shadow:inset 0 0 0 2px var(--focus)}',
    '.projects-name{display:block;font:600 var(--t-body)/1.5 var(--f-body);color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.projects-sub{display:flex;align-items:center;gap:6px;min-width:0;font-size:var(--t-caption);line-height:1.3333;color:var(--text-2)}',
    '.projects-sub > .m{min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.projects-xs{display:none}',
    '.projects-c-client{min-width:0;font-size:var(--t-small);color:var(--text-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.projects-c-pair{font:500 var(--t-caption)/1 var(--f-mono);color:var(--text-2);white-space:nowrap}',
    '.projects-th .projects-c-pair{font:inherit}',
    '.projects-c-prog{display:flex;align-items:center;gap:10px;min-width:0}',
    '.projects-c-prog .pj-track{flex:1;min-width:40px}',
    '.projects-pct{min-width:4ch;text-align:right;font:500 var(--t-caption)/1 var(--f-mono);color:var(--text-2)}',
    '.projects-st{display:inline-flex;align-items:center;gap:8px;font-size:var(--t-small);color:var(--text);white-space:nowrap}',
    '.projects-c-due{display:grid;gap:1px;min-width:0;font-size:var(--t-small);line-height:1.35;font-variant-numeric:tabular-nums;white-space:nowrap}',
    '.projects-c-due small{font-size:var(--t-caption);color:var(--text-2)}',
    '.projects-c-due small.late{color:var(--danger)}',
    '.projects-c-due small.soon{color:var(--warning)}',
    '.projects-c-act{display:flex;align-items:center;justify-content:flex-end;gap:2px}',
    '.projects-raise{position:relative;z-index:1}',
    '.projects-qa{display:inline-flex;align-items:center;gap:4px;height:28px;padding:0 8px;border:0;border-radius:6px;background:transparent;color:var(--text-3);font:500 var(--t-caption)/1 var(--f-mono);cursor:pointer;transition:background var(--t-fast),color var(--t-fast)}',
    '.projects-qa:hover{background:var(--sunken);color:var(--text)}',
    '.projects-qa.green{color:var(--success)}.projects-qa.gold{color:var(--warning)}.projects-qa.red{color:var(--danger)}',
    '@media (hover:hover){.projects-row:not(:hover):not(:focus-within) .projects-more{opacity:0}}',
    '.projects-more{transition:opacity var(--t-fast)}',
    '@container (max-width:920px){.projects-tr{grid-template-columns:minmax(0,2.4fr) 76px minmax(96px,1fr) 128px 116px 76px}.projects-c-client{display:none}.projects-xs.c{display:inline}}',
    '@container (max-width:640px){',
    '  .projects-th{display:none}',
    '  .projects-tr{grid-template-columns:minmax(0,1fr) auto;grid-template-areas:"name act" "prog prog" "st due";gap:8px 12px;padding:12px 8px 12px 14px}',
    '  .projects-c-name{grid-area:name}.projects-c-act{grid-area:act;align-self:start}.projects-c-prog{grid-area:prog;padding-right:6px}',
    '  .projects-c-status{grid-area:st}.projects-c-due{grid-area:due;justify-self:end;text-align:right;padding-right:6px}',
    '  .projects-c-pair,.projects-c-client{display:none}.projects-xs{display:inline}',
    '  .projects-name{white-space:normal}',
    '}',
    /* projects — «Yeni layihə» sheet */
    '.projects-new{display:grid;gap:18px}',
    '.projects-new .grid-2{gap:14px}',
    '.projects-sec{display:grid;gap:12px;padding-top:16px;border-top:1px solid var(--border)}',
    '.projects-sec > h3{font:600 var(--t-caption)/1.3333 var(--f-body);letter-spacing:.04em;text-transform:uppercase;color:var(--text-2)}',
    '.projects-dz:focus-visible{outline:2px solid var(--focus);outline-offset:2px}',
    '.projects-dz .ic{width:32px;height:32px;border-radius:6px}',
    '.projects-files{display:grid;gap:8px}',
    '.projects-file{display:grid;grid-template-columns:auto minmax(0,1fr) auto auto;align-items:center;gap:10px;padding:8px 6px 8px 10px;border:1px solid var(--border);border-radius:6px;background:var(--panel)}',
    '.projects-file .ic{width:28px;height:28px;border-radius:6px}',
    '.projects-file .ic svg{width:16px;height:16px}',
    '.projects-file-tx{min-width:0;display:grid;gap:5px}',
    '.projects-file-tx b{font-size:var(--t-small);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.projects-file-tx small{font-size:var(--t-caption);color:var(--text-2)}',
    '.projects-file-pct{min-width:40px;display:flex;justify-content:flex-end;font:500 var(--t-caption)/1 var(--f-mono);color:var(--text-2)}',
    '.projects-file-pct .spinner{width:14px;height:14px}',
    /* editor — frame */
    '.page.editor{display:flex;flex-direction:column;max-width:none;margin:0;padding:0;gap:0}',
    '.editor[data-layout="wide"],.editor[data-layout="mid"]{height:calc(100dvh - var(--hdr-h) - 1px - env(safe-area-inset-top,0px));overflow:hidden}',
    '.editor-head{flex:none;display:grid;gap:6px;padding:10px 20px 10px 12px;border-bottom:1px solid var(--border);background:var(--canvas)}',
    '.editor-head-r1{display:flex;align-items:center;gap:8px 12px;min-width:0}',
    '.editor-title{flex:1;min-width:0;display:flex;align-items:center;gap:8px}',
    '.editor-title h1{min-width:0;margin:0;font:600 var(--t-h2)/1.4118 var(--f-display);letter-spacing:-.005em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.editor-crumb{flex:none;max-width:30%;font-size:var(--t-small);color:var(--text-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.editor-crumb-sep{flex:none;color:var(--text-3)}',
    '.editor-head-acts{flex:none;display:flex;align-items:center;gap:6px}',
    '.editor-head-r2{display:flex;flex-wrap:wrap;align-items:center;gap:6px 16px;padding-left:38px;font-size:var(--t-caption);line-height:1.3333;color:var(--text-2)}',
    '.editor-meta{display:flex;flex-wrap:wrap;align-items:center;gap:2px 0;min-width:0}',
    '.editor-meta > span + span::before{content:"·";margin:0 8px;color:var(--text-3)}',
    '.editor-meta .is-late{color:var(--danger)}',
    '.editor-prog{display:flex;align-items:center;gap:10px;margin-left:auto}',
    '.editor-prog .pj-track{width:140px}',
    '.editor-prog-tx{font-variant-numeric:tabular-nums}',
    '.editor-prog b{min-width:4ch;text-align:right;font:500 var(--t-caption)/1 var(--f-mono);color:var(--text)}',
    '.editor-busy{display:inline-flex;align-items:center;gap:8px;color:var(--text-2)}',
    '.editor-save{display:inline-flex;align-items:center;gap:6px;margin-right:4px;font-size:var(--t-caption);color:var(--text-2);white-space:nowrap}',
    '.editor-save i{width:6px;height:6px;border-radius:50%;background:var(--success)}',
    '.editor-save.busy i{background:var(--warning);animation:pj-pulse 1s ease-in-out infinite}',
    '.editor-head .btn-sm{min-height:30px}',
    '.editor-panel-btn[aria-pressed="true"]{background:var(--accent-t);color:var(--accent);border-color:transparent}',
    '.editor-ws{position:relative;flex:1;min-height:0;display:grid;grid-template-columns:268px minmax(0,1fr) 360px;background:var(--canvas)}',
    '.editor.insp-off .editor-ws{grid-template-columns:268px minmax(0,1fr)}',
    '.editor.insp-off[data-layout="wide"] .editor-insp{display:none}',
    '.editor[data-layout="mid"] .editor-ws{grid-template-columns:232px minmax(0,1fr)}',
    '.editor[data-layout="narrow"] .editor-ws{display:block}',
    /* editor — navigator */
    '.editor-nav{min-width:0;min-height:0;display:flex;flex-direction:column;border-right:1px solid var(--border);background:var(--canvas)}',
    '.editor-nav-h{flex:none;display:grid;gap:10px;padding:12px 12px 10px;border-bottom:1px solid var(--border)}',
    '.editor-nav-t{display:flex;align-items:center;gap:8px;min-height:24px}',
    '.editor-nav-count{font:500 var(--t-caption)/1 var(--f-mono);color:var(--text-3)}',
    '.editor-ov-x{margin-left:auto;display:none}',
    '.editor-filter{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:2px}',
    '.editor-filter button{display:flex;align-items:center;justify-content:space-between;gap:6px;min-width:0;height:26px;padding:0 8px;border:1px solid transparent;border-radius:6px;background:none;color:var(--text-2);font:500 var(--t-caption)/1 var(--f-body);cursor:pointer;transition:background var(--t-fast),color var(--t-fast),border-color var(--t-fast)}',
    '.editor-filter button:hover{background:var(--hover);color:var(--text)}',
    '.editor-filter button[aria-pressed="true"]{background:var(--panel);border-color:var(--border);color:var(--text)}',
    '.editor-fc{font:500 var(--t-micro)/1 var(--f-mono);color:var(--text-3)}',
    '.editor-nav-sec{font-size:var(--t-caption);color:var(--text-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.editor-nav-list{position:relative;flex:1;min-height:0;overflow-y:auto;padding:4px 0 12px}',
    '.editor-nav-item{position:relative;display:grid;grid-template-columns:26px 8px minmax(0,1fr) auto;align-items:center;gap:8px;width:100%;min-height:32px;padding:4px 12px;border:0;background:none;color:var(--text-2);font:400 var(--t-small)/1.35 var(--f-body);text-align:left;cursor:pointer;transition:background var(--t-fast),color var(--t-fast)}',
    '.editor-nav-item:hover{background:var(--hover);color:var(--text)}',
    '.editor-nav-item:focus-visible{outline:2px solid var(--focus);outline-offset:-2px}',
    '.editor-nav-item[aria-current="true"]{background:var(--selected);color:var(--text)}',
    '.editor-nav-item[aria-current="true"]::before{content:"";position:absolute;left:0;top:4px;bottom:4px;width:2px;border-radius:0 2px 2px 0;background:var(--accent)}',
    '.editor-nav-item .n{font:500 var(--t-micro)/1 var(--f-mono);color:var(--text-3)}',
    '.editor-nav-item[aria-current="true"] .n{color:var(--accent)}',
    '.editor-nav-item .s{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.editor-nav-item .f{font:500 var(--t-micro)/1 var(--f-mono);color:var(--text-3)}',
    '.editor-nav-legend{flex:none;display:flex;flex-wrap:wrap;gap:6px 12px;padding:10px 12px;border-top:1px solid var(--border);font-size:var(--t-micro);color:var(--text-2)}',
    '.editor-nav-legend span{display:inline-flex;align-items:center;gap:5px}',
    '.editor-nav-legend .pj-dot{width:7px;height:7px}',
    /* editor — center */
    '.editor-center{min-width:0;min-height:0;overflow-y:auto;background:var(--panel)}',
    '.editor-mbar{display:none}',
    '.editor-center-h{position:sticky;top:0;z-index:3;display:flex;align-items:center;gap:8px 12px;min-height:40px;padding:8px 24px;border-bottom:1px solid var(--border);background:var(--panel)}',
    '.editor-center-t{flex:1;min-width:0;font:600 var(--t-small)/1.4 var(--f-body);color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.editor-finfo{display:inline-flex;align-items:center;gap:10px;font-size:var(--t-caption);color:var(--text-2);white-space:nowrap}',
    '.editor-start{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px 20px;margin:16px 24px 4px;padding:14px 16px;border:1px solid var(--border);border-radius:8px;background:var(--sunken)}',
    '.editor-start > div{display:grid;gap:2px;max-width:56ch}',
    '.editor-start b{font:600 var(--t-body)/1.5 var(--f-body)}',
    '.editor-start span{font-size:var(--t-small);line-height:1.4;color:var(--text-2)}',
    '.editor-seg{position:relative;padding:12px 20px 14px 22px;border-bottom:1px solid var(--border);scroll-margin:56px 0 24px;transition:background var(--t-fast)}',
    '.editor-seg::before{content:"";position:absolute;left:0;top:0;bottom:0;width:2px;background:transparent;transition:background 160ms ease}',
    '.editor-seg.active{background:color-mix(in srgb,var(--accent) 3%,var(--panel))}',
    '.editor-seg.active::before{background:var(--accent)}',
    '.editor-seg.editor-flash{animation:editor-flash 1.2s ease-out}',
    '.editor-seg-h{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;min-height:28px;margin-bottom:4px}',
    '.editor-segno{font:500 var(--t-micro)/1 var(--f-mono);letter-spacing:.06em;color:var(--text-3)}',
    '.editor-seg.active .editor-segno{color:var(--accent)}',
    '.editor-pill{font-size:var(--t-caption);color:var(--text-2)}',
    '.editor-pill.ok{color:var(--success)}',
    '.editor-conf{display:inline-flex;align-items:center;gap:5px;font-size:var(--t-caption);color:var(--text-2);cursor:help}',
    '.editor-bars{display:inline-flex;align-items:flex-end;gap:2px;height:10px}',
    '.editor-bars i{display:block;width:3px;border-radius:1px;background:var(--border-2)}',
    '.editor-bars i:nth-child(1){height:4px}.editor-bars i:nth-child(2){height:7px}.editor-bars i:nth-child(3){height:10px}',
    '.editor-conf.high i{background:var(--success)}',
    '.editor-conf.mid i:nth-child(-n+2){background:var(--warning)}',
    '.editor-conf.low i:nth-child(1){background:var(--danger)}',
    '.editor-conf.low{color:var(--danger)}',
    '.editor-chip{display:inline-flex;align-items:center;gap:4px;height:22px;padding:0 7px;border:1px solid var(--border);border-radius:4px;background:var(--panel);color:var(--text-2);font:500 var(--t-micro)/1 var(--f-body);cursor:pointer;transition:border-color var(--t-fast),color var(--t-fast)}',
    '.editor-chip svg{width:12px;height:12px}',
    '.editor-chip:hover{border-color:var(--border-2);color:var(--text)}',
    '.editor-chip.warn{color:var(--warning);border-color:color-mix(in srgb,var(--warning) 35%,var(--border))}',
    '.editor-chip.err{color:var(--danger);border-color:color-mix(in srgb,var(--danger) 35%,var(--border))}',
    'span.editor-chip{cursor:default}',
    '.editor-seg-acts{display:flex;align-items:center;gap:4px;margin-left:auto}',
    '.editor-ok{min-height:28px;padding:0 10px;gap:6px;font-size:var(--t-small)}',
    '.editor-ok svg{width:14px;height:14px}',
    '.editor-okkbd{display:none;align-items:center;gap:2px;margin-left:2px}',
    '.editor-okkbd .kbd{min-width:18px;height:18px;padding:0 4px;font-size:10px}',
    '.editor-seg.active .editor-ok:not([aria-pressed="true"]){--btn-bg:var(--accent);--btn-bg-h:var(--accent-h);--btn-ink:var(--on-accent);--btn-bd:transparent}',
    '.editor-seg.active .editor-ok:not([aria-pressed="true"]) svg{color:var(--on-accent)}',
    '.editor-seg.active .editor-ok:not([aria-pressed="true"]) .editor-okkbd{display:inline-flex}',
    '.editor-seg.active .editor-ok .kbd{background:transparent;border-color:color-mix(in srgb,var(--on-accent) 45%,transparent);color:var(--on-accent);box-shadow:none}',
    '.editor-ok[aria-pressed="true"]{--btn-bg:transparent;--btn-bg-h:var(--success-t);--btn-ink:var(--success);--btn-bd:color-mix(in srgb,var(--success) 32%,transparent)}',
    '.editor-ok[aria-pressed="true"] svg{color:var(--success)}',
    '@media (hover:hover){.editor-seg:not(.active):not(:hover):not(:focus-within) .editor-ok:not([aria-pressed="true"]),.editor-seg:not(.active):not(:hover):not(:focus-within) .editor-nzb{opacity:0}}',
    '.editor-ok,.editor-nzb{transition:opacity var(--t-fast),background-color var(--t-fast),border-color var(--t-fast)}',
    '.editor-pair{display:grid;grid-template-columns:22px minmax(0,1fr);gap:6px 8px;align-items:start}',
    '.editor-lang{padding-top:4px;font:500 10px/1.4 var(--f-mono);letter-spacing:.04em;color:var(--text-3)}',
    '.editor-src{min-width:0;font-size:var(--t-body);line-height:1.6;color:var(--text-2);overflow-wrap:anywhere}',
    '.editor-seg.active .editor-src{color:var(--text)}',
    'mark.editor-mark{background:var(--accent-t);color:inherit;border-radius:3px;padding:0 2px;box-shadow:inset 0 -1.5px 0 var(--accent-line)}',
    '.editor-they{font-weight:600;text-decoration:underline wavy var(--danger);text-decoration-thickness:1.5px;text-underline-offset:3px}',
    'textarea.editor-ta{display:block;width:calc(100% + 18px);min-height:2.25em;margin:-5px -9px;padding:4px 8px;border:1px solid transparent;border-radius:6px;background:transparent;color:var(--text);font:400 var(--t-body)/1.6 var(--f-body);resize:none;overflow:hidden;transition:border-color var(--t-fast),background var(--t-fast),box-shadow var(--t-fast)}',
    'textarea.editor-ta::placeholder{color:var(--text-3)}',
    '@media (hover:hover){textarea.editor-ta:hover{background:var(--sunken)}}',
    'textarea.editor-ta:focus{outline:none;background:var(--panel);border-color:var(--accent-line);box-shadow:0 0 0 3px var(--accent-t)}',
    'textarea.editor-ta.editor-t-mid:not(:focus){box-shadow:inset 0 -1.5px 0 color-mix(in srgb,var(--warning) 75%,transparent)}',
    'textarea.editor-ta.editor-t-low:not(:focus){box-shadow:inset 0 -1.5px 0 var(--danger)}',
    'textarea.editor-ta.editor-sk{color:transparent;pointer-events:none;background:var(--sunken);animation:pj-pulse 1.2s ease-in-out infinite}',
    '.editor-hints{display:grid;gap:4px;margin:10px 0 0 30px}',
    '.editor-seg:not(.active) .editor-hints{display:none}',
    '.editor-hint{display:flex;flex-wrap:wrap;align-items:center;gap:4px 10px;min-height:30px;padding:3px 4px 3px 10px;border-left:2px solid var(--warning);border-radius:0 6px 6px 0;background:var(--warning-t);font-size:var(--t-small);line-height:1.45}',
    '.editor-hint.high{border-left-color:var(--danger);background:var(--danger-t)}',
    '.editor-hint.low{border-left-color:var(--border-2);background:var(--sunken)}',
    '.editor-hint-tx{flex:1;min-width:0}',
    '.editor-hint-tx > b{font-weight:600;margin-right:6px}',
    '.editor-hint .btn{min-height:26px;padding:0 8px;font-size:var(--t-caption)}',
    ':is(.editor,.qa,.editor-menu) s{color:var(--danger);text-decoration-thickness:1px}',
    ':is(.editor,.qa) ins{color:var(--success);font-weight:600;text-decoration:none}',
    '.editor-ask{display:grid;gap:8px;margin:10px 0 0 30px;padding:10px 12px;border:1px solid var(--border);border-left:2px solid var(--accent);border-radius:0 6px 6px 0;background:var(--panel)}',
    '.editor-seg:not(.active) .editor-ask{display:none}',
    '.editor-ask h3{font:600 var(--t-small)/1.4 var(--f-body)}',
    '.editor-ask p{font-size:var(--t-small);line-height:1.5;color:var(--text-2)}',
    '.editor-ask-q{padding:6px 10px;border-radius:6px;background:var(--sunken);color:var(--text)!important}',
    '.editor-ask-opts{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px}',
    '.editor-ask-opts .btn{min-height:28px}',
    '.editor-ask.done,.editor-ask.mini{grid-template-columns:minmax(0,1fr) auto;align-items:center;border-left-color:var(--success)}',
    '.editor-ask.mini{border-left-color:var(--warning)}',
    '.editor-ask.done b{font-size:var(--t-small)}',
    '.editor-empty{padding:16px 24px}',
    '.editor-foot{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px 20px;padding:14px 24px 88px;color:var(--text-2);font-size:var(--t-caption)}',
    '.editor-keys{display:flex;flex-wrap:wrap;align-items:center;gap:8px 16px}',
    '.editor-keys > span{display:inline-flex;align-items:center;gap:4px}',
    '.editor-legend{display:flex;flex-wrap:wrap;gap:6px 14px}',
    /* editor — inspector */
    '.editor-insp{min-width:0;min-height:0;display:flex;flex-direction:column;border-left:1px solid var(--border);background:var(--panel)}',
    '.editor-grab{display:none}',
    '.editor-insp-h{flex:none;display:flex;align-items:center;gap:4px;padding:0 8px 0 4px;border-bottom:1px solid var(--border)}',
    '.editor-tabs{flex:1;min-width:0;display:flex;overflow-x:auto;scrollbar-width:none}',
    '.editor-tabs::-webkit-scrollbar{display:none}',
    '.editor-tabs button{position:relative;flex:none;display:inline-flex;align-items:center;gap:5px;height:40px;padding:0 9px;border:0;background:none;color:var(--text-2);font:500 var(--t-small)/1 var(--f-body);white-space:nowrap;cursor:pointer;transition:color var(--t-fast)}',
    '.editor-tabs button:hover{color:var(--text)}',
    '.editor-tabs button::after{content:"";position:absolute;left:9px;right:9px;bottom:-1px;height:2px;border-radius:2px 2px 0 0;background:var(--accent);opacity:0;transition:opacity var(--t-fast)}',
    '.editor-tabs button[aria-selected="true"]{color:var(--text)}',
    '.editor-tabs button[aria-selected="true"]::after{opacity:1}',
    '.editor-tabs button:focus-visible{outline:2px solid var(--focus);outline-offset:-4px;border-radius:6px}',
    '.editor-tabs .c{font:500 10px/1 var(--f-mono);color:var(--text-3)}',
    '.editor-tabs .c.warn{color:var(--warning)}.editor-tabs .c.err{color:var(--danger)}',
    '.editor-insp-sub{flex:none;display:flex;align-items:center;gap:8px;min-height:36px;padding:8px 16px 0}',
    '.editor-insp-sub .st{font-size:var(--t-caption);color:var(--text-2)}',
    '.editor-insp-b{flex:1;min-height:0;overflow-y:auto;padding:4px 16px 88px}',
    '.editor-insp-b:focus{outline:none}',
    '.editor-sec{display:grid;gap:8px;padding:14px 0;border-top:1px solid var(--border)}',
    '.editor-sec:first-child{border-top:0}',
    '.editor-sec-h{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:20px}',
    '.editor-p{font-size:var(--t-small);line-height:1.5;color:var(--text-2)}',
    '.editor-p b{color:var(--text);font-weight:600}',
    '.editor-kv{display:grid;grid-template-columns:96px minmax(0,1fr);gap:6px 12px;margin:0;font-size:var(--t-small);line-height:1.45}',
    '.editor-kv dt{color:var(--text-2)}',
    '.editor-kv dd{margin:0;min-width:0;color:var(--text);overflow-wrap:anywhere}',
    '.editor-quote{margin:0;padding:6px 10px;border-left:2px solid var(--border-2);font-size:var(--t-small);line-height:1.5;color:var(--text)}',
    '.editor-nb{display:grid;grid-template-columns:34px minmax(0,1fr);gap:8px;width:100%;padding:6px 8px;margin:0 -8px;border:0;border-radius:6px;background:none;color:var(--text-2);font:400 var(--t-small)/1.45 var(--f-body);text-align:left;cursor:pointer;width:calc(100% + 16px)}',
    '.editor-nb:hover{background:var(--hover);color:var(--text)}',
    '.editor-nb .n{padding-top:2px;font:500 var(--t-micro)/1.3 var(--f-mono);color:var(--text-3)}',
    '.editor-nb .t{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
    '.editor-row{display:flex;flex-wrap:wrap;align-items:center;gap:6px 8px}',
    '.editor-insp .seg.block button{font-size:var(--t-caption)}',
    '.editor-note-ta{min-height:72px;font-size:var(--t-small)}',
    '.editor-gl{display:grid}',
    '.editor-gl-r{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1.2fr) minmax(56px,.7fr);gap:10px;align-items:start;width:100%;padding:7px 8px;margin:0 -8px;width:calc(100% + 16px);border:0;border-top:1px solid var(--border);border-radius:0;background:none;color:var(--text);font:400 var(--t-small)/1.4 var(--f-body);text-align:left;cursor:pointer;transition:background var(--t-fast)}',
    '.editor-gl-r:hover{background:var(--hover)}',
    '.editor-gl-r[aria-pressed="true"]{background:var(--accent-t)}',
    '.editor-gl-r:focus-visible{outline:2px solid var(--focus);outline-offset:-2px;border-radius:6px}',
    '.editor-gl-th{padding-block:4px 6px;border-top:0;cursor:default;color:var(--text-3);font-size:var(--t-micro)}',
    '.editor-gl-th:hover{background:none}',
    '.editor-gl-r .a{font-weight:600;overflow-wrap:anywhere}',
    '.editor-gl-r .b{overflow-wrap:anywhere}',
    '.editor-gl-r small{display:block;margin-top:2px;font-size:var(--t-micro);line-height:1.35;color:var(--text-2);font-weight:400}',
    '.editor-gl-r .f{font-size:var(--t-caption);color:var(--text-2)}',
    '.editor-gl-r .bad{display:inline-block;margin-top:3px;font:500 var(--t-micro)/1.2 var(--f-body);color:var(--danger)}',
    '.editor-tm{display:grid;grid-template-columns:44px minmax(0,1fr);gap:6px 10px;padding:4px 0}',
    '.editor-tm-pct{padding-top:1px;font:600 var(--t-body)/1.5 var(--f-mono);color:var(--text)}',
    '.editor-tm-pct.hi{color:var(--success)}.editor-tm-pct.mid{color:var(--warning)}',
    '.editor-tm-src{font-size:var(--t-small);line-height:1.5;color:var(--text-2)}',
    '.editor-tm-src mark{background:var(--warning-t);color:var(--text);border-radius:2px;padding:0 1px}',
    '.editor-tm-tgt{font-size:var(--t-small);line-height:1.5;color:var(--text)}',
    '.editor-sug{display:grid;gap:8px;padding:12px;border:1px solid var(--border);border-radius:8px;background:var(--panel)}',
    '.editor-sug-h{display:flex;align-items:center;justify-content:space-between;gap:8px}',
    '.editor-sug-h .pj-cap{color:var(--accent)}',
    '.editor-sug-k{font-size:var(--t-caption);color:var(--text-2)}',
    '.editor-sug-t{font-size:var(--t-body);line-height:1.6;color:var(--text);overflow-wrap:anywhere}',
    '.editor-sug-why{font-size:var(--t-small);line-height:1.5;color:var(--text-2)}',
    '.editor-sug-why b{font-weight:600;color:var(--text)}',
    '.editor-alt{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:4px 10px;align-items:start;padding:10px 0;border-top:1px solid var(--border)}',
    '.editor-alt:first-of-type{border-top:0}',
    '.editor-alt small{grid-column:1 / -1;font-size:var(--t-caption);color:var(--text-2)}',
    '.editor-alt span{font-size:var(--t-small);line-height:1.5;overflow-wrap:anywhere}',
    '.editor-qa-h{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:12px 0 4px}',
    '.editor-qa-h b{font:600 var(--t-small)/1.4 var(--f-body)}',
    '.editor-qa-h small{display:block;font-size:var(--t-caption);color:var(--text-2);font-weight:400}',
    '.editor-grp{display:flex;align-items:center;gap:8px;margin-top:12px;padding-bottom:2px}',
    '.editor-iss{display:grid;gap:4px;padding:10px 0;border-top:1px solid var(--border)}',
    '.editor-grp + .editor-iss{border-top:0}',
    '.editor-iss-h{display:flex;align-items:center;gap:8px;font:600 var(--t-small)/1.4 var(--f-body)}',
    '.editor-iss-h .who{margin-left:auto;display:inline-flex;align-items:center;gap:6px;font-weight:400;font-size:var(--t-caption);color:var(--text-2);white-space:nowrap}',
    '.editor-iss .d{font-size:var(--t-small);line-height:1.5;overflow-wrap:anywhere}',
    '.editor-iss p{font-size:var(--t-small);line-height:1.5;color:var(--text-2)}',
    '.editor-iss .editor-row{margin-top:4px}',
    '.editor-clean{display:flex;align-items:flex-start;gap:8px;padding:10px 0;font-size:var(--t-small);line-height:1.5;color:var(--text-2)}',
    '.editor-clean svg{width:16px;height:16px;margin-top:2px;color:var(--success)}',
    '.editor-note{display:flex;gap:8px;padding:8px 10px;border-radius:6px;background:var(--warning-t);font-size:var(--t-small);line-height:1.5}',
    '.editor-note svg{flex:none;width:16px;height:16px;margin-top:2px;color:var(--warning)}',
    '.qa-sdot,.editor-sdot{flex:none;display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--text-3)}',
    ':is(.qa-sdot,.editor-sdot).high{background:var(--danger)}:is(.qa-sdot,.editor-sdot).mid{background:var(--warning)}',
    /* editor — popover menu */
    '.editor-menu{position:fixed;z-index:58;display:grid;min-width:236px;max-width:calc(100vw - 16px);padding:4px;border:1px solid var(--border);border-radius:8px;background:var(--panel);box-shadow:var(--sh-2);animation:fade-in 120ms ease both}',
    '.editor-menu-i{display:flex;align-items:center;gap:10px;min-height:32px;padding:0 10px;border:0;border-radius:6px;background:none;color:var(--text);font:400 var(--t-small)/1.3 var(--f-body);text-align:left;cursor:pointer}',
    '.editor-menu-i svg{width:16px;height:16px;color:var(--text-2)}',
    '.editor-menu-i:hover,.editor-menu-i:focus-visible{background:var(--hover);outline:none}',
    '.editor-menu-i .k{margin-left:auto;font-size:var(--t-micro);color:var(--text-3)}',
    /* editor — overlays (mid: side sheet · narrow: drawer + bottom sheet) */
    '.editor-scrim{position:fixed;inset:0;z-index:56;background:var(--scrim);opacity:0;visibility:hidden;transition:opacity 160ms ease,visibility 0s linear 160ms}',
    '.editor-scrim.on{opacity:1;visibility:visible;transition:opacity 160ms ease}',
    '.editor[data-layout="mid"] .editor-insp,.editor[data-layout="narrow"] .editor-insp{position:fixed;z-index:57;visibility:hidden;transition:transform 180ms ease,visibility 0s linear 180ms}',
    '.editor[data-layout="mid"] .editor-insp{position:absolute;top:0;right:0;bottom:0;width:min(380px,92vw);box-shadow:var(--sh-3);transform:translateX(104%)}',
    '.editor[data-layout="mid"] .editor-insp.on,.editor[data-layout="narrow"] .editor-insp.on,.editor[data-layout="narrow"] .editor-nav.on{visibility:visible;transform:none;transition:transform 180ms ease}',
    '.editor:is([data-layout="mid"],[data-layout="narrow"]) .editor-insp .editor-ov-x{display:inline-grid}',
    '.editor[data-layout="narrow"] .editor-insp{left:0;right:0;bottom:var(--bnav-h);height:min(calc(100dvh - var(--hdr-h) - var(--bnav-h) - 48px),640px);border:1px solid var(--border);border-bottom:0;border-radius:12px 12px 0 0;box-shadow:var(--sh-3);transform:translateY(104%);padding-bottom:env(safe-area-inset-bottom,0px)}',
    '.editor[data-layout="narrow"] .editor-grab{display:block;flex:none;width:36px;height:4px;margin:8px auto 0;border-radius:2px;background:var(--border-2)}',
    '.editor[data-layout="narrow"] .editor-insp-b{padding-bottom:24px}',
    '.editor[data-layout="narrow"] .editor-nav{position:fixed;z-index:57;top:calc(var(--hdr-h) + env(safe-area-inset-top,0px));left:0;bottom:var(--bnav-h);width:min(320px,86vw);border-right:1px solid var(--border);box-shadow:var(--sh-3);visibility:hidden;transform:translateX(-104%);transition:transform 180ms ease,visibility 0s linear 180ms}',
    '.editor[data-layout="narrow"] .editor-nav .editor-ov-x{display:inline-grid}',
    '.editor[data-layout="narrow"] .editor-mbar{position:sticky;top:calc(var(--hdr-h) + env(safe-area-inset-top,0px));z-index:5;display:flex;align-items:center;gap:8px;padding:8px 12px;border-bottom:1px solid var(--border);background:var(--canvas)}',
    '.editor-mbar .btn{min-height:32px}',
    '.editor-mbar .sp{flex:1}',
    '.editor-mcount{margin-left:2px;font:500 var(--t-micro)/1 var(--f-mono);color:var(--text-2)}',
    '.editor[data-layout="narrow"] .editor-head{padding:10px 12px}',
    '.editor[data-layout="narrow"] .editor-head-r2{padding-left:0}',
    '.editor[data-layout="narrow"] .editor-prog{margin-left:0;width:100%}',
    '.editor[data-layout="narrow"] .editor-prog .pj-track{flex:1;width:auto}',
    '.editor[data-layout="narrow"] .editor-save .tx,.editor[data-layout="narrow"] .editor-hide-xs{display:none}',
    '.editor[data-layout="narrow"] .editor-crumb,.editor[data-layout="narrow"] .editor-crumb-sep{display:none}',
    '.editor[data-layout="narrow"] .editor-center-h{display:none}',
    '.editor[data-layout="narrow"] .editor-center{overflow:visible}',
    '.editor[data-layout="narrow"] .editor-seg{padding:12px 12px 14px 14px;scroll-margin:calc(var(--hdr-h) + 64px) 0 calc(var(--bnav-h) + 24px)}',
    '.editor[data-layout="narrow"] textarea.editor-ta{font-size:1rem}',
    '.editor[data-layout="narrow"] .editor-hints,.editor[data-layout="narrow"] .editor-ask{margin-left:0}',
    '.editor[data-layout="narrow"] .editor-start{margin:12px}',
    '.editor[data-layout="narrow"] .editor-foot{padding:14px 12px calc(var(--bnav-h) + 72px)}',
    '.editor[data-layout="narrow"] .editor-keys{display:none}',
    '.editor[data-layout="narrow"] .editor-okkbd{display:none!important}',
    '@media (hover:none){.editor-okkbd{display:none!important}}',
    /* qa */
    '.page.qa{max-width:1280px;gap:20px}',
    '.qa-crumbs{display:flex;align-items:center;gap:8px;min-width:0;margin-bottom:-8px;font-size:var(--t-small);color:var(--text-2)}',
    '.qa-crumbs .btn{margin-left:-10px}',
    '.qa-crumb{min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.qa-sum{display:grid;grid-template-columns:minmax(180px,.8fr) minmax(0,1fr) minmax(0,1.3fr);gap:20px 32px;padding:16px 20px;border:1px solid var(--border);border-radius:8px;background:var(--panel)}',
    '.qa-sum > div{display:grid;gap:8px;align-content:start;min-width:0}',
    '.qa-sum > div + div{padding-left:32px;border-left:1px solid var(--border)}',
    '.qa-score-line{display:flex;align-items:baseline;gap:6px}',
    '.qa-score-n{font:600 var(--t-display)/1.2143 var(--f-display);font-variant-numeric:tabular-nums;letter-spacing:-.01em}',
    '.qa-score-of{font-size:var(--t-caption);color:var(--text-3)}',
    '.qa-grade{margin-left:6px;font-size:var(--t-small);color:var(--text-2)}',
    '.qa-meter{width:100%;max-width:220px}',
    '.qa-seal{display:inline-flex;align-items:center;gap:6px;font-size:var(--t-small);color:var(--text)}',
    '.qa-seal::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--text-3)}',
    '.qa-seal.green::before{background:var(--success)}.qa-seal.gold::before{background:var(--warning)}.qa-seal.red::before{background:var(--danger)}',
    '.qa-deep{display:flex;align-items:center;gap:6px;font-size:var(--t-caption);color:var(--text-2)}',
    '.qa-deep svg{width:14px;height:14px;color:var(--accent)}',
    '.qa-sevs{display:flex;flex-wrap:wrap;gap:4px 20px}',
    '.qa-sevs-i{display:grid;grid-template-columns:auto auto;align-items:center;gap:2px 8px;padding:4px 6px;margin:-4px -6px;border:0;border-radius:6px;background:none;color:inherit;font:inherit;text-align:left;cursor:pointer}',
    '.qa-sevs-i:hover{background:var(--hover)}',
    '.qa-sevs-i b{font:600 var(--t-h2)/1.3 var(--f-display);font-variant-numeric:tabular-nums}',
    '.qa-sevs-i span{grid-column:2;font-size:var(--t-caption);color:var(--text-2)}',
    '.qa-sevs-i .qa-sdot{grid-row:1}',
    '.qa-sum-note{font-size:var(--t-small);line-height:1.5;color:var(--text-2)}',
    '.qa-cats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 20px}',
    '.qa-cat{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:28px;padding:0 6px;margin:0 -6px;border:0;border-radius:6px;background:none;color:var(--text);font:400 var(--t-small)/1.3 var(--f-body);text-align:left;cursor:pointer}',
    '.qa-cat:hover{background:var(--hover)}',
    '.qa-cat[aria-pressed="true"]{background:var(--accent-t)}',
    '.qa-cat .n{font:500 var(--t-caption)/1 var(--f-mono);color:var(--text-2)}',
    '.qa-cat .n.high{color:var(--danger)}.qa-cat .n.mid{color:var(--warning)}',
    '.qa-cat .ok{display:inline-flex;align-items:center;gap:3px;font-size:var(--t-caption);color:var(--success)}',
    '.qa-cat .ok svg{width:13px;height:13px}',
    '.qa-issues{display:grid;gap:12px}',
    '.qa-sec-h{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px 12px}',
    '.qa-sec-h h2{font:600 var(--t-h2)/1.4118 var(--f-display)}',
    '.qa-sec-h small{font-size:var(--t-caption);color:var(--text-2)}',
    '.qa-bar{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px}',
    '.qa-bar .seg button .c{font:500 var(--t-micro)/1 var(--f-mono);color:var(--text-3)}',
    '.qa-bar .select{width:auto;min-width:180px;height:32px;min-height:32px;font-size:var(--t-small)}',
    '.qa-bar .sp{flex:1}',
    '.qa-table{container-type:inline-size;border:1px solid var(--border);border-radius:8px;background:var(--panel);overflow:hidden}',
    '.qa-tr{display:grid;grid-template-columns:52px minmax(0,1fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1.6fr) 152px 112px;gap:14px;align-items:start;padding:10px 12px 10px 16px}',
    '.qa-th{padding-block:8px;background:var(--sunken);border-bottom:1px solid var(--border);color:var(--text-2);font:500 var(--t-caption)/1.3333 var(--f-body)}',
    '.qa-grp{display:flex;align-items:center;gap:8px;padding:8px 16px;background:var(--sunken);border-top:1px solid var(--border);border-bottom:1px solid var(--border)}',
    '.qa-th + .qa-grp{border-top:0}',
    '.qa-grp .pj-mono{font-size:var(--t-caption);color:var(--text-3)}',
    '.qa-row{font-size:var(--t-small);line-height:1.5;transition:background var(--t-fast),opacity 160ms ease}',
    '.qa-row + .qa-row{border-top:1px solid var(--border)}',
    '@media (hover:hover){.qa-row:hover{background:var(--hover)}}',
    '.qa-row.is-done{opacity:0}',
    '.qa-row.is-ign{opacity:.55}',
    '.qa-row.is-ign .qa-was,.qa-row.is-ign .qa-now{text-decoration:line-through}',
    '.qa-segno{justify-self:start;height:24px;padding:0 6px;margin-top:-1px;border:1px solid var(--border);border-radius:4px;background:var(--panel);color:var(--text-2);font:500 var(--t-caption)/1 var(--f-mono);cursor:pointer;transition:border-color var(--t-fast),color var(--t-fast)}',
    '.qa-segno:hover{border-color:var(--accent-line);color:var(--accent)}',
    '.qa-frag{color:var(--text);overflow-wrap:anywhere}',
    '.qa-ctx{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;color:var(--text-3)}',
    '.qa-was{color:var(--text);text-decoration:underline;text-decoration-color:var(--danger);text-decoration-thickness:1.5px;text-underline-offset:3px;overflow-wrap:anywhere}',
    '.qa-now{color:var(--success);font-weight:500;overflow-wrap:anywhere}',
    '.qa-now.long{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}',
    '.qa-none{color:var(--text-3)}',
    '.qa-prob{display:grid;gap:2px;min-width:0}',
    '.qa-prob b{display:flex;align-items:center;gap:6px;font-weight:600;color:var(--text)}',
    '.qa-prob span{color:var(--text-2)}',
    '.qa-who{display:flex;align-items:center;gap:8px;min-width:0;font-size:var(--t-caption);color:var(--text-2)}',
    '.qa-who-n{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.qa-act{display:flex;align-items:center;justify-content:flex-end;gap:2px}',
    '.qa-act .btn{min-height:28px;padding:0 10px;font-size:var(--t-small)}',
    '.qa-mlab{display:none}',
    '.qa-frags{display:contents}',
    '@container (max-width:1000px){.qa-tr{grid-template-columns:52px minmax(0,1fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1.5fr) 28px 104px}.qa-who-n{display:none}}',
    '@container (max-width:760px){',
    '  .qa-th{display:none}',
    '  .qa-tr{grid-template-columns:52px minmax(0,1fr) auto;grid-template-areas:"seg prob who" "seg frag frag" "seg act act";gap:8px 12px;padding:12px 12px 12px 14px}',
    '  .qa-c-seg{grid-area:seg}.qa-c-prob{grid-area:prob}.qa-c-who{grid-area:who}.qa-c-act{grid-area:act}.qa-act{justify-content:flex-start}',
    '  .qa-frags{grid-area:frag;display:grid;gap:4px}',
    '  .qa-mlab{display:inline;margin-right:6px;color:var(--text-3);font-size:var(--t-caption)}',
    '}',
    '.qa-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 40px}',
    '.qa-sec{display:grid;gap:4px;align-content:start;padding-top:16px;border-top:1px solid var(--border)}',
    '.qa-sec .qa-sec-h{margin-bottom:6px}',
    '.qa-sec-h .who{display:inline-flex;align-items:center;gap:6px;font-size:var(--t-caption);color:var(--text-2)}',
    '.qa-line{display:flex;flex-wrap:wrap;align-items:center;gap:6px 12px;min-height:40px;padding:6px 0;border-top:1px solid var(--border);font-size:var(--t-small)}',
    '.qa-line:first-of-type{border-top:0}',
    '.qa-line .grow{flex:1;min-width:0}',
    '.qa-line .btn{min-height:28px;padding:0 10px;font-size:var(--t-small)}',
    '.qa-term{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px 12px;align-items:center;padding:8px 0;border-top:1px solid var(--border);font-size:var(--t-small)}',
    '.qa-term:first-of-type{border-top:0}',
    '.qa-term-t b{font-weight:600}',
    '.qa-term-t span{margin:0 6px;color:var(--text-3)}',
    '.qa-term-bar{grid-column:1 / -1;display:flex;height:3px;border-radius:2px;overflow:hidden;background:var(--sunken)}',
    '.qa-term-bar i{display:block;height:100%;background:var(--success);transition:width 180ms ease}',
    '.qa-term-bar i.bad{background:var(--danger)}',
    '.qa-term-end{display:flex;align-items:center;gap:8px}',
    '.qa-term-end .btn{min-height:28px;padding:0 10px}',
    '.qa-req{display:flex;align-items:center;gap:12px;width:100%;min-height:40px;padding:6px 0;border:0;border-top:1px solid var(--border);background:none;color:inherit;font:inherit;font-size:var(--t-small);text-align:left;cursor:pointer}',
    '.qa-req:first-of-type{border-top:0}',
    '.qa-req:focus-visible{outline:2px solid var(--focus);outline-offset:2px;border-radius:6px}',
    '.qa-box{flex:none;width:18px;height:18px;display:grid;place-items:center;border:1.5px solid var(--border-2);border-radius:4px;background:var(--panel);transition:background var(--t-fast),border-color var(--t-fast)}',
    '.qa-box svg{width:12px;height:12px}',
    '.qa-req.ok .qa-box{background:var(--success);border-color:var(--success);color:var(--panel)}',
    '.qa-req.fail .qa-box{border-color:var(--warning);color:var(--warning)}',
    '.qa-req-t{flex:1;min-width:0;line-height:1.4}',
    '.qa-req.ok .qa-req-t{color:var(--text-2)}',
    '.qa-req .k{font-size:var(--t-caption);color:var(--text-3)}',
    '.qa-dv{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:4px 12px;min-height:52px;padding:8px 0;border-top:1px solid var(--border)}',
    '.qa-dv:first-of-type{border-top:0}',
    '.qa-dv > svg{width:18px;height:18px;color:var(--text-2)}',
    '.qa-dv-tx{min-width:0;display:grid;gap:1px}',
    '.qa-dv-tx b{font:600 var(--t-small)/1.4 var(--f-body)}',
    '.qa-dv-tx small{font-size:var(--t-caption);color:var(--text-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.qa-dv-tx .st{color:var(--success)}',
    '.qa-dv-act{display:flex;gap:4px}',
    '.qa-dv-act .btn{min-height:28px;padding:0 10px;font-size:var(--t-small)}',
    '.qa-clean{display:flex;align-items:flex-start;gap:8px;padding:6px 0;font-size:var(--t-small);line-height:1.5;color:var(--text-2)}',
    '.qa-clean svg{flex:none;width:16px;height:16px;margin-top:2px;color:var(--success)}',
    '.qa-paper{display:grid;gap:12px;padding:24px;border:1px solid var(--border);border-radius:8px;background:var(--panel);font-size:var(--t-small);line-height:1.7}',
    '.qa-paper h3{text-align:center;font:600 var(--t-body)/1.5 var(--f-body);letter-spacing:.04em}',
    '.qa-paper .muted{font-size:var(--t-caption)}',
    '.qa-loading{display:grid;gap:20px}',
    '.qa-skrow{border-top:1px solid var(--border)}',
    '@media (max-width:899px){.qa-sum{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}.qa-sum > div:nth-child(3){grid-column:1 / -1;padding-left:0;border-left:0;padding-top:16px;border-top:1px solid var(--border)}}',
    '@media (max-width:767px){.qa-grid{grid-template-columns:minmax(0,1fr)}}',
    '@media (max-width:559px){.qa-sum{grid-template-columns:minmax(0,1fr);padding:14px 16px}.qa-sum > div + div{padding-left:0;border-left:0;padding-top:14px;border-top:1px solid var(--border)}.qa-cats{grid-template-columns:minmax(0,1fr)}.qa-bar .select{flex:1 1 100%}}',
    /* keyframes */
    '@keyframes pj-pulse{0%,100%{opacity:1}50%{opacity:.55}}',
    '@keyframes editor-flash{0%,35%{background:var(--accent-t)}100%{background:transparent}}'
  ].join('\n');
  function ensureCss() { App.css('projects', CSS); }

  /* ------------------------------------------------------------------
     6. SHARED UI BITS
     ------------------------------------------------------------------ */
  function pad3(n) { n = Number(n) || 0; return (n < 10 ? '00' : n < 100 ? '0' : '') + n; }
  function clip(s, n) { s = String(s || ''); return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s; }
  function put(el) { for (var i = 1; i < arguments.length; i++) { var c = arguments[i]; if (c == null || c === false) continue; if (Array.isArray(c)) c.forEach(function (x) { put(el, x); }); else el.appendChild(c.nodeType ? c : D.createTextNode(String(c))); } return el; }
  function dueTone(p) {
    if (p.status === 'delivered') return 'ok';
    if (!p.due) return '';
    var ms = p.due.getTime() - Date.now();
    if (ms < DAY) return 'late';
    if (ms < 3 * DAY) return 'soon';
    return '';
  }
  function dueChip(p, cls) {
    if (!p.due) return null;
    var tone = dueTone(p), ms = p.due.getTime() - Date.now();
    var txt = p.status === 'delivered' ? 'Təhvil verildi · ' + p.due.getDate() + ' ' + MONTHS[p.due.getMonth()]
      : dueLabel(p.due) + (ms < DAY ? ' · ' + leftLabel(ms) : '');
    return h('span', { class: 'badge' + (tone === 'late' ? ' red' : tone === 'soon' ? ' gold' : tone === 'ok' ? ' green' : '') + (cls ? ' ' + cls : ''), title: 'Təhvil: ' + dueLabel(p.due) }, p.status === 'delivered' ? ie('check') : ie('clock'), h('span', { text: txt }));
  }
  function qaBadgeBtn(p, onClick) {
    var b = h('button', { class: 'projects-qa projects-raise ' + qaCls(p.qa), type: 'button', title: p.qa == null ? 'Keyfiyyət yoxlaması hələ aparılmayıb' : 'Keyfiyyət balı ' + p.qa + ' — hesabatı aç', 'aria-label': p.qa == null ? 'Keyfiyyət yoxlaması hələ aparılmayıb — yoxla' : 'Keyfiyyət balı ' + p.qa + ' — hesabatı aç' }, 'QA ', p.qa == null ? '—' : String(p.qa));
    b.addEventListener('click', function (e) { e.stopPropagation(); onClick(); });
    return b;
  }
  function kindTag(p) {
    if (p.sample) return h('span', { class: 'pj-tag', title: 'Nümunə layihə: redaktor və yoxlamanı sınamaq üçün. Statistikaya düşmür, silə bilərsiniz.' }, 'Nümunə');
    return p.kind === 'sim'
      ? h('span', { class: 'pj-tag', title: 'Məşq layihəsi: real müştəri yoxdur, təsdiqlər Akademiyada XP qazandırır' }, 'Simulyasiya')
      : null;
  }
  /* Contextual empty state: a quiet line, no illustration. */
  function emptyBox(S, o) {
    return h('div', { class: 'pj-empty' + (o.block ? ' block' : '') },
      h('span', { class: 'pj-empty-ic', html: App.icon(o.icon || 'folder'), 'aria-hidden': 'true' }),
      h('div', { class: 'pj-empty-tx' }, h('b', { text: o.title }), o.text ? h('span', { text: o.text }) : null),
      o.actions && o.actions.length ? h('div', { class: 'pj-empty-act' }, o.actions) : null);
  }
  /* Reviewer monogram — two letters, neutral, no portrait. */
  var MONO = { 'Lüğətçi Mirzə': 'Lü', 'Mənaçı Mirzə': 'Mə', 'Üslubçu Mirzə': 'Üs', 'Dilçi Nənə': 'Di', 'Möhürdar Mirzə': 'Mö' };
  function monoAv(name) {
    var t = MONO[name] || cap(String(name || 'Yoxlama').trim().slice(0, 2));
    return h('span', { class: 'pj-av', 'aria-hidden': 'true', text: t });
  }
  /* Minimal project status: [label, dot tone]. */
  function statusOf(p) {
    if (p.status === 'delivered') return ['Təhvil verilib', 'ok'];
    if (p.sample) return ['Nümunə', 'draft'];
    var ms = p.due ? p.due.getTime() - Date.now() : Infinity;
    if (ms < 0) return ['Gecikir', 'err'];
    if (ms < DAY) return ['Təcili', 'warn'];
    if (p.done >= 100) return ['Yoxlamaya hazır', 'ok'];
    if (!p.done) return ['Başlanmayıb', 'empty'];
    return ['İcrada', 'edit'];
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
    var st = { q: '', tab: sget('projects:tab', 'all') };
    if (hl || !TABS.some(function (t) { return t.id === st.tab; })) st.tab = 'all';

    var page = h('div', { class: 'page projects' });
    el.appendChild(page);

    var newBtn = h('button', { class: 'btn btn-primary', type: 'button', onclick: function () { newProjectSheet(function (p) { hl = p.id; st.tab = 'all'; st.q = ''; search.value = ''; syncTabs(); draw(); }); } }, ie('plus'), 'Yeni layihə');
    var subP = h('p');
    page.appendChild(h('div', { class: 'page-h' },
      h('div', null, h('h1', { text: 'Layihələr' }), subP),
      h('div', { class: 'actions' }, newBtn)));

    var sum = h('div', { class: 'projects-sum', role: 'group', 'aria-label': 'Ümumi göstəricilər', hidden: true });
    page.appendChild(sum);

    var search = h('input', { class: 'input', id: 'projects-q', type: 'search', placeholder: 'Layihə, müştəri və ya sahə', autocomplete: 'off', 'aria-label': 'Layihə axtar' });
    var tabBtns = {};
    var tabs = h('div', { class: 'seg sm projects-filter', role: 'group', 'aria-label': 'Status filtri' }, TABS.map(function (t) {
      var c = h('span', { class: 'projects-fc' });
      var b = h('button', { type: 'button', 'aria-pressed': st.tab === t.id ? 'true' : 'false', onclick: function () { st.tab = t.id; sset('projects:tab', t.id); syncTabs(); draw(); } }, t.label, c);
      tabBtns[t.id] = { b: b, c: c }; return b;
    }));
    var tools = h('div', { class: 'projects-bar', hidden: true }, h('label', { class: 'input-ic', html: App.icon('search') }, search), tabs);
    page.appendChild(tools);
    var host = h('div', { class: 'projects-host' });
    page.appendChild(host);

    var qT = 0;
    search.addEventListener('input', function () { clearTimeout(qT); qT = S.later(function () { st.q = search.value; draw(); }, 140); });
    function syncTabs() { TABS.forEach(function (t) { tabBtns[t.id].b.setAttribute('aria-pressed', st.tab === t.id ? 'true' : 'false'); }); }
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
        if (!!a.sample !== !!b.sample) return a.sample ? 1 : -1;
        var da = a.status === 'delivered' ? 1 : 0, db = b.status === 'delivered' ? 1 : 0;
        if (da !== db) return da - db;
        var ta = a.due ? a.due.getTime() : Infinity, tb = b.due ? b.due.getTime() : Infinity;
        return da ? tb - ta : ta - tb;
      });
    }
    function headRow() {
      return h('div', { class: 'projects-tr projects-th', 'aria-hidden': 'true' },
        h('span', { text: 'Layihə' }), h('span', { class: 'projects-c-client', text: 'Müştəri' }), h('span', { class: 'projects-c-pair', text: 'Dil cütü' }),
        h('span', { text: 'Hazırlıq' }), h('span', { text: 'Status' }), h('span', { text: 'Təhvil' }), h('span'));
    }
    function draw() {
      var P = allProjects();
      var R = P.filter(function (p) { return !p.sample; }); /* real projects — the only ones that count */
      var active = R.filter(function (p) { return p.status !== 'delivered'; });
      var delivered = R.length - active.length;
      var week = active.filter(function (p) { return p.due && p.due.getTime() - Date.now() < 7 * DAY; }).length;
      var queue = 0; active.forEach(function (p) { queue += Math.round((p.words || 0) * (100 - p.done) / 100); });
      var qs = R.filter(function (p) { return p.qa != null; }), avg = qs.length ? Math.round(qs.reduce(function (s, p) { return s + p.qa; }, 0) / qs.length) : 0;
      var late = active.filter(function (p) { return p.due && p.due.getTime() - Date.now() < DAY; }).length;
      subP.textContent = !R.length ? 'Sənədi yükləyin — terminlər və üslub avtomatik müəyyənləşir.'
        : R.length + ' layihə' + (active.length && active.length !== R.length ? ' · ' + active.length + ' aktiv' : '') + (late ? ' · ' + late + ' təhvil 24 saat ərzində' : '');
      newBtn.hidden = !P.length;
      /* summary: only from real projects, only non-zero values */
      sum.textContent = '';
      var items = [[active.length, 'aktiv layihə'], [delivered, 'təhvil verilib'], [week, 'bu həftə təhvil'], [queue, 'söz növbədə'], [avg, 'orta QA balı']]
        .filter(function (x) { return x[0] > 0; }).slice(0, 4);
      items.forEach(function (x) { sum.appendChild(h('div', null, h('b', { text: num(x[0]) }), h('span', { text: x[1] }))); });
      sum.hidden = !R.length || items.length < 2;
      tools.hidden = !P.length;
      TABS.forEach(function (t) {
        var n = P.filter(function (p) { return inTab(p, t.id); }).length;
        tabBtns[t.id].c.textContent = String(n);
        tabBtns[t.id].b.hidden = t.id !== 'all' && !n;
      });
      if (tools.hidden || tabBtns[st.tab].b.hidden) { st.tab = 'all'; syncTabs(); }
      var list = sortList(P.filter(function (p) { return inTab(p, st.tab) && matchQ(p, st.q); }));
      host.textContent = '';
      var frame = h('div', { class: 'projects-list' }, headRow());
      host.appendChild(frame);
      if (!P.length) {
        frame.appendChild(emptyBox(S, { title: 'Layihə yoxdur', text: 'İlk layihənizi yaradın və tərcüməyə başlayın.',
          actions: [h('button', { class: 'btn btn-primary btn-sm', type: 'button', onclick: function () { newBtn.click(); } }, ie('plus'), 'Yeni layihə'),
            h('button', { class: 'link small', type: 'button', onclick: openSample }, 'Nümunə layihəyə baxın')] }));
        return;
      }
      if (!list.length) {
        frame.appendChild(emptyBox(S, st.q
          ? { icon: 'search', title: 'Heç nə tapılmadı', text: '«' + st.q + '» üzrə layihə yoxdur.', actions: [h('button', { class: 'btn btn-secondary btn-sm', type: 'button', onclick: function () { search.value = ''; st.q = ''; draw(); search.focus(); } }, 'Axtarışı təmizlə')] }
          : { title: 'Bu bölmədə layihə yoxdur', text: 'Başqa filtr seçin və ya yeni layihə yaradın.', actions: [h('button', { class: 'btn btn-secondary btn-sm', type: 'button', onclick: function () { st.tab = 'all'; syncTabs(); draw(); } }, 'Hamısını göstər')] }));
        return;
      }
      frame.appendChild(h('div', { role: 'list', 'aria-label': 'Layihələr' }, list.map(row)));
      if (hl) {
        var c = host.querySelector('[data-id="' + hl + '"]');
        if (c) { S.later(function () { try { c.scrollIntoView({ block: 'center', behavior: reduced() ? 'auto' : 'smooth' }); } catch (e) { /* ignore */ } }, 200); }
        hl = null;
      }
    }
    function openEditor(p) { App.go('editor', { project: p.id }); }
    function dueCell(p) {
      var box = h('div', { class: 'projects-c-due' });
      if (p.status === 'delivered') {
        box.appendChild(h('span', { text: p.due ? p.due.getDate() + ' ' + MONTHS[p.due.getMonth()] : '—' }));
        box.appendChild(h('small', { text: 'təhvil verildi' }));
        return box;
      }
      if (!p.due) { box.appendChild(h('span', { class: 'muted', text: '—' })); return box; }
      var ms = p.due.getTime() - Date.now(), tone = ms < 0 ? 'late' : ms < 3 * DAY ? 'soon' : '';
      box.title = 'Təhvil: ' + dueLabel(p.due);
      box.appendChild(h('span', { text: dueLabel(p.due) }));
      box.appendChild(h('small', { class: tone, text: leftLabel(ms) }));
      return box;
    }
    function row(p) {
      var stt = statusOf(p), isNew = hl === p.id && !p.sample;
      var open = h('button', { class: 'projects-open', type: 'button', 'aria-label': p.name + ' — redaktorda aç' }, h('span', { class: 'projects-name', text: p.name }));
      open.addEventListener('click', function () { openEditor(p); });
      var more = h('button', { class: 'icon-btn ghost sm projects-raise projects-more', type: 'button', 'aria-label': 'Əməliyyatlar — ' + p.name, title: 'Əməliyyatlar', html: App.icon('more') });
      more.addEventListener('click', function (e) { e.stopPropagation(); moreSheet(p); });
      var sub = h('div', { class: 'projects-sub' },
        h('span', { class: 'm' },
          h('span', { class: 'projects-xs c', text: p.client + ' · ' }),
          h('span', { class: 'projects-xs pj-mono', text: pairLabel(p.pair) + ' · ' }),
          p.field + ' · ' + num(p.words) + ' söz'),
        kindTag(p), isNew ? h('span', { class: 'pj-tag new', text: 'Yeni' }) : null);
      var pr = clamp(Number(p.done) || 0, 0, 100);
      return h('div', { class: 'projects-tr projects-row' + (isNew ? ' is-new' : ''), role: 'listitem', 'data-id': p.id },
        h('div', { class: 'projects-c-name' }, open, sub),
        h('div', { class: 'projects-c-client', text: p.client, title: p.client }),
        h('div', { class: 'projects-c-pair', text: pairLabel(p.pair) }),
        h('div', { class: 'projects-c-prog' },
          h('span', { class: 'pj-track' + (p.status === 'delivered' ? ' ok' : ''), role: 'progressbar', 'aria-label': 'Hazırlıq', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(pr) }, h('i', { style: 'width:' + pr + '%' })),
          h('span', { class: 'projects-pct', text: pr + '%' })),
        h('div', { class: 'projects-c-status' }, h('span', { class: 'projects-st' }, h('i', { class: 'pj-dot is-' + stt[1], 'aria-hidden': 'true' }), stt[0])),
        dueCell(p),
        h('div', { class: 'projects-c-act' }, qaBadgeBtn(p, function () { App.go('qa', { project: p.id }); }), more));
    }
    function moreSheet(p) {
      var s;
      var rows = [
        { ic: 'edit', b: 'Redaktorda aç', s: num(p.segs) + ' seqment · ' + p.done + '% təsdiqlənib', run: function () { openEditor(p); } },
        { ic: 'shield', b: 'Keyfiyyət yoxlaması', s: p.qa == null ? 'Hələ yoxlanmayıb' : 'Son bal: ' + p.qa, run: function () { App.go('qa', { project: p.id }); } },
        p.sample ? null : p.status === 'delivered'
          ? { ic: 'refresh', b: 'Yenidən aç', s: 'Müştəri düzəliş istəyibsə', run: function () { setMap('pj:status', p.id, 'active'); toast('Layihə yenidən açıldı', 'info', { sub: p.name }); draw(); } }
          : { ic: 'stamp', b: 'Təhvil verildi kimi qeyd et', s: 'Layihə arxivə keçir', run: function () {
            setMap('pj:status', p.id, 'delivered'); setMap('pj:prog', p.id, 100);
            toast('Təhvil verildi', 'ok', { sub: p.client + ' — ' + p.name });
            nz('celebrate', 'Təbriklər! Daha bir layihə təhvil verildi.', 2600); draw();
          } },
        p.sample ? { ic: 'trash', b: 'Nümunəni sil', s: 'İstənilən vaxt yenidən baxa bilərsiniz', danger: true, run: function () {
          var node = host.querySelector('[data-id="' + p.id + '"]');
          if (node) node.classList.add('is-gone');
          S.later(function () {
            removeSample(); draw();
            toast('Nümunə silindi', 'info', { action: { label: 'Geri qaytar', onClick: function () { sset('pj:sample', true); if (!S.dead) draw(); } } });
          }, 180);
        } } : { ic: 'trash', b: 'Layihəni sil', s: 'Geri qaytarmaq mümkündür', danger: true, run: function () {
          App.confirm({ title: 'Layihə silinsin?', text: '«' + p.client + ' — ' + p.name + '» və onun ' + num(p.segs) + ' seqmenti siyahıdan silinəcək.', okLabel: 'Sil', danger: true }).then(function (yes) {
            if (!yes) return;
            var node = host.querySelector('[data-id="' + p.id + '"]');
            if (node) node.classList.add('is-gone');
            S.later(function () {
              setMap('pj:removed', p.id, true); draw();
              toast('Layihə silindi', 'info', { sub: p.name, action: { label: 'Geri qaytar', onClick: function () { setMap('pj:removed', p.id); hl = p.id; if (!S.dead) draw(); } } });
            }, 180);
          });
        } }
      ];
      rows = rows.filter(Boolean);
      var list = h('div', { class: 'list' }, rows.map(function (r) {
        return h('button', { class: 'list-row' + (r.danger ? ' danger' : ''), type: 'button', onclick: function () { if (s) s.close(); S.later(r.run, 80); } },
          icTile(r.ic), h('span', { class: 'tx' }, h('b', { text: r.b }), h('small', { text: r.s })), h('span', { class: 'end', html: App.icon('chevron') }));
      }));
      s = App.sheet({ title: p.name, body: h('div', { class: 'stack' }, h('div', { class: 'row' }, kindTag(p), h('span', { class: 'pj-tag pj-mono', text: pairLabel(p.pair) }), dueChip(p)), list) });
    }
    syncTabs(); draw();
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
    var client = h('input', { class: 'input', id: 'pj-new-client', placeholder: 'Məs.: müştərinin adı', autocomplete: 'off' });
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
      regHint.textContent = reg === 'auto' ? 'Üslub sənəddən avtomatik tanınacaq. Ehtimal: ' + REG[detected] + '.' : 'Üslub əl ilə seçildi: ' + REG[reg] + '.';
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
      fileIn, icTile('upload', 'projects-fir'), h('b', { text: 'Faylı bura atın və ya seçin' }), h('span', { id: 'pj-new-dzh', text: 'DOCX, PDF, TXT, XLIFF · 50 MB-a qədər' }));
    var fl = h('div', { class: 'projects-files', 'aria-live': 'polite' });

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
      var row = h('div', { class: 'projects-file' }, icTile(ext === 'pdf' ? 'file' : /^x|sdl/.test(ext) ? 'layers' : 'file', ext === 'pdf' ? 'projects-fir' : 'gold'),
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
      h('section', { class: 'projects-sec' }, h('h3', { text: 'Sənəd' }), dz, fl),
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
      nz('success', 'Layihə yaradıldı. Redaktorda «İlkin tərcümə» ilə başlaya bilərsiniz.', 3000);
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
     8. SCREEN: EDITOR — three panes: segment navigator · source/target · inspector
     ------------------------------------------------------------------ */
  var FILTERS = [{ id: 'all', label: 'Hamısı' }, { id: 'empty', label: 'Boş' }, { id: 'unrev', label: 'Yoxlanmamış' }, { id: 'risk', label: 'Riskli' }];
  var INSP_TABS = [['ctx', 'Kontekst'], ['gl', 'Lüğət'], ['tm', 'TM'], ['sug', 'Təklif'], ['qa', 'Yoxlama']];
  var UI = { tab: 'sug', insp: true }; /* session-only view state (inspector tab, inspector shown on wide screens) */
  var greeted = {};
  function noProject(S) {
    var none = !realProjects().length;
    return h('div', { class: 'page' }, emptyBox(S, none
      ? { block: true, title: 'Layihə yoxdur', text: 'Redaktor və yoxlama layihə daxilində işləyir. İlk layihənizi yaradın və ya nümunəyə baxın.',
        actions: [h('button', { class: 'btn btn-primary btn-sm', type: 'button', onclick: function () { newProjectSheet(null); } }, ie('plus'), 'Yeni layihə'),
          h('button', { class: 'link small', type: 'button', onclick: openSample }, 'Nümunə layihəyə baxın')] }
      : { block: true, icon: 'search', title: 'Layihə tapılmadı', text: 'Bu layihə silinib və ya hələ yaradılmayıb.',
        actions: [h('button', { class: 'btn btn-secondary btn-sm', type: 'button', onclick: function () { App.go('projects'); } }, 'Layihələrə qayıt')] }));
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
    var layout = '', insOpen = false, navOpen = false, menuEl = null;
    var page = h('div', { class: 'page editor', 'data-layout': 'wide' });
    el.appendChild(page);

    /* --- head: project, save state, main actions, progress --- */
    var aiBtn = h('button', { class: 'btn btn-secondary btn-sm', type: 'button', title: 'Boş seqmentlərin ilkin tərcüməsi (Mirzə Məclisi)' }, ie('translate'), h('span', { class: 'editor-hide-xs', text: 'İlkin tərcümə' }));
    aiBtn.addEventListener('click', runAI);
    var qaBtn = h('button', { class: 'btn btn-secondary btn-sm', type: 'button', title: 'Layihənin keyfiyyət yoxlaması', onclick: function () { flushSave(); App.go('qa', { project: p.id }); } }, ie('shield'), h('span', { class: 'editor-hide-xs', text: 'Yoxlama' }));
    var panelBtn = h('button', { class: 'icon-btn sm editor-panel-btn', type: 'button', 'aria-label': 'Məlumat paneli', title: 'Məlumat paneli', 'aria-pressed': 'false', html: App.icon('sliders') });
    panelBtn.addEventListener('click', toggleInsp);
    var saveTx = h('span', { class: 'tx', text: 'Yadda saxlanıldı' }), saveEl = h('span', { class: 'editor-save', role: 'status' }, h('i', { 'aria-hidden': 'true' }), saveTx);
    var dueTxt = p.status === 'delivered' ? 'Təhvil verilib' : p.due ? 'Təhvil: ' + lcFirst(dueLabel(p.due)) : 'Nümunə layihə';
    var regMeta = h('span', { text: REG[regNow] || 'Neytral' });
    var progI = h('i', { style: 'width:0%' });
    var progBar = h('span', { class: 'pj-track', role: 'progressbar', 'aria-label': 'Layihənin gedişi', 'aria-valuemin': '0', 'aria-valuemax': '100' }, progI);
    var pctTx = h('b'), progTx = h('span', { class: 'editor-prog-tx' });
    var busyTx = h('span'), busyEl = h('span', { class: 'editor-busy', role: 'status', hidden: true }, h('span', { class: 'pj-spin', 'aria-hidden': 'true' }), busyTx);
    page.appendChild(h('header', { class: 'editor-head' },
      h('div', { class: 'editor-head-r1' },
        h('button', { class: 'icon-btn ghost sm', type: 'button', 'aria-label': 'Layihələrə qayıt', title: 'Layihələr', html: App.icon('back'), onclick: function () { App.go('projects'); } }),
        h('div', { class: 'editor-title' }, h('span', { class: 'editor-crumb', text: p.client, title: p.client }), h('span', { class: 'editor-crumb-sep', 'aria-hidden': 'true', text: '/' }), h('h1', { text: p.name, title: p.name }), kindTag(p)),
        h('div', { class: 'editor-head-acts' }, saveEl, qaBtn, aiBtn, panelBtn)),
      h('div', { class: 'editor-head-r2' },
        h('div', { class: 'editor-meta' }, h('span', { class: 'pj-mono', text: pairLabel(p.pair) }), regMeta, h('span', { text: num(p.words) + ' söz' }), h('span', { text: num(p.segs) + ' seqment' }),
          h('span', { class: dueTone(p) === 'late' && p.status !== 'delivered' ? 'is-late' : null, text: dueTxt })),
        busyEl,
        h('div', { class: 'editor-prog' }, progTx, progBar, pctTx))));

    var ws = h('div', { class: 'editor-ws' });
    page.appendChild(ws);
    var scrim = h('div', { class: 'editor-scrim', 'aria-hidden': 'true' });
    scrim.addEventListener('click', function () { closeNav(); closeInsp(); });
    page.appendChild(scrim);

    /* --- left: segment navigator --- */
    var fBtns = {};
    var fSeg = h('div', { class: 'editor-filter', role: 'group', 'aria-label': 'Seqment filtri' }, FILTERS.map(function (f) {
      var c = h('span', { class: 'editor-fc' });
      var b = h('button', { type: 'button', 'aria-pressed': f.id === filter ? 'true' : 'false', onclick: function () { setFilter(f.id); } }, f.label, c);
      fBtns[f.id] = { b: b, c: c }; return b;
    }));
    var navCount = h('span', { class: 'editor-nav-count' });
    var navList = h('div', { class: 'editor-nav-list', role: 'list', 'aria-label': 'Seqment siyahısı' });
    var legend = [['empty', 'Boş'], ['draft', 'Qaralama'], ['edit', 'Redaktə'], ['ok', 'Təsdiq'], ['warn', 'Qeyd']];
    var nav = h('aside', { class: 'editor-nav', 'aria-label': 'Seqmentlər' },
      h('div', { class: 'editor-nav-h' },
        h('div', { class: 'editor-nav-t' }, h('span', { class: 'pj-cap', text: 'Seqmentlər' }), navCount,
          h('button', { class: 'icon-btn ghost sm editor-ov-x', type: 'button', 'aria-label': 'Seqment siyahısını bağla', html: App.icon('x'), onclick: function () { closeNav(); } })),
        fSeg, h('span', { class: 'editor-nav-sec', text: set.title, title: set.title })),
      navList,
      h('div', { class: 'editor-nav-legend', 'aria-hidden': 'true' }, legend.map(function (l) { return h('span', null, h('i', { class: 'pj-dot is-' + l[0] }), l[1]); })));
    ws.appendChild(nav);
    navList.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      var items = rows.filter(function (r) { return !r.navLi.hidden; }).map(function (r) { return r.nav; });
      var i = items.indexOf(D.activeElement); if (i < 0) return;
      e.preventDefault();
      var nx = items[clamp(i + (e.key === 'ArrowDown' ? 1 : -1), 0, items.length - 1)];
      if (nx) nx.focus();
    });

    /* --- center: source + target --- */
    var mCount = h('span', { class: 'editor-mcount' });
    var mbar = h('div', { class: 'editor-mbar' },
      h('button', { class: 'btn btn-secondary btn-sm', type: 'button', onclick: function () { openNav(); } }, ie('list'), 'Seqmentlər', mCount),
      h('span', { class: 'sp' }),
      h('button', { class: 'btn btn-secondary btn-sm', type: 'button', onclick: function () { openInsp(); } }, ie('sliders'), 'Panel'));
    var fInfo = h('span', { class: 'editor-finfo' });
    var startCard = h('div', { class: 'editor-start', hidden: true },
      h('div', null, h('b', { text: 'Sənəd hazırdır — ' + set.segs.length + ' seqment tərcümə gözləyir' }),
        h('span', { text: 'İlkin tərcümə layihə lüğətini, tərcümə yaddaşını və üslubu nəzərə alır. Sonra hər seqmenti siz təsdiqləyirsiniz.' })),
      h('button', { class: 'btn btn-primary btn-sm', type: 'button', onclick: runAI }, ie('translate'), 'İlkin tərcümə'));
    var listEl = h('div', { class: 'editor-list', role: 'list', 'aria-label': 'Seqmentlər' });
    var emptyHost = h('div', { class: 'editor-empty', hidden: true });
    function kb(keys, label) { return h('span', null, keys.map(function (k) { return h('kbd', { class: 'kbd', text: k }); }), ' ' + label); }
    var foot = h('div', { class: 'editor-foot' },
      h('div', { class: 'editor-keys', 'aria-label': 'Klaviatura qısayolları' }, kb([MOD, 'Enter'], 'təsdiqlə'), kb(['Alt', '↓'], 'növbəti'), kb(['Alt', '↑'], 'əvvəlki'), kb([MOD, 'K'], 'axtar')),
      h('div', { class: 'editor-legend' }, ['high', 'mid', 'low'].map(function (c) { return h('span', { class: 'editor-conf ' + c }, h('span', { class: 'editor-bars', 'aria-hidden': 'true' }, h('i'), h('i'), h('i')), CONF_L[c]); })));
    var center = h('div', { class: 'editor-center', role: 'region', 'aria-label': 'Tərcümə sahəsi' },
      mbar, h('div', { class: 'editor-center-h' }, h('span', { class: 'editor-center-t', text: set.title }), fInfo), startCard, listEl, emptyHost, foot);
    ws.appendChild(center);

    /* --- right: inspector --- */
    var tabBtns = {};
    var tabsEl = h('div', { class: 'editor-tabs', role: 'tablist', 'aria-label': 'Məlumat paneli' }, INSP_TABS.map(function (t) {
      var c = h('span', { class: 'c' });
      var b = h('button', { type: 'button', role: 'tab', id: 'editor-tab-' + t[0], 'aria-controls': 'editor-insp-b', 'aria-selected': UI.tab === t[0] ? 'true' : 'false', tabindex: UI.tab === t[0] ? '0' : '-1', onclick: function () { setTab(t[0]); } }, t[1], c);
      tabBtns[t[0]] = { b: b, c: c }; return b;
    }));
    tabsEl.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      var ids = INSP_TABS.map(function (t) { return t[0]; }), i = ids.indexOf(UI.tab);
      var nx = ids[(i + (e.key === 'ArrowRight' ? 1 : ids.length - 1)) % ids.length];
      setTab(nx); try { tabBtns[nx].b.focus(); } catch (x) { /* ignore */ }
    });
    var inspSub = h('div', { class: 'editor-insp-sub' });
    var inspB = h('div', { class: 'editor-insp-b', id: 'editor-insp-b', role: 'tabpanel', tabindex: '-1' });
    var insp = h('aside', { class: 'editor-insp', 'aria-label': 'Məlumat paneli' },
      h('div', { class: 'editor-grab', 'aria-hidden': 'true' }),
      h('div', { class: 'editor-insp-h' }, tabsEl, h('button', { class: 'icon-btn ghost sm editor-ov-x', type: 'button', 'aria-label': 'Paneli bağla', html: App.icon('x'), onclick: function () { closeInsp(); } })),
      inspSub, inspB);
    ws.appendChild(insp);

    /* --- situation + register (shown in the «Kontekst» tab) --- */
    var sit = sitOf(p);
    var regBtns = {};
    var regSeg = h('div', { class: 'seg sm block', role: 'group', 'aria-label': 'Üslub' }, REG_IDS.map(function (r) {
      var b = h('button', { type: 'button', 'aria-pressed': r === regNow ? 'true' : 'false', class: r === p.reg ? 'detected' : null, title: r === p.reg ? 'Avtomatik tanındı' : null, onclick: function () { setReg(r); } }, REG[r]);
      regBtns[r] = b; return b;
    }));
    function setReg(r) {
      if (r === regNow) return;
      regNow = r; sset('pj:reg:' + p.id, r);
      Object.keys(regBtns).forEach(function (k) { regBtns[k].setAttribute('aria-pressed', k === r ? 'true' : 'false'); });
      regMeta.textContent = REG[r];
      toast('Üslub: ' + REG[r], 'info', { sub: r === p.reg ? 'Avtomatik tanınan üsluba qayıtdınız' : 'Növbəti qaralamalar bu üsluba uyğunlaşacaq', icon: 'sliders' });
      nz('write', r === 'danisiq' && p.reg === 'huquqi' ? 'Müqavilədə danışıq üslubu? Əminsiniz?' : 'Üslubu ' + REG[r] + ' etdim.', 2400);
    }
    function editSit() {
      var pu = h('textarea', { class: 'textarea', id: 'editor-sit-pu', rows: '3', value: sit.purpose || '' });
      var au = h('input', { class: 'input', id: 'editor-sit-au', value: sit.audience || '' });
      App.sheet({ title: 'Situasiya', body: h('div', { class: 'stack' },
        h('div', { class: 'field' }, h('label', { for: 'editor-sit-pu' }, 'Sənəd nə üçündür?'), pu),
        h('div', { class: 'field' }, h('label', { for: 'editor-sit-au' }, 'Kim oxuyacaq?'), au, h('span', { class: 'hint', text: 'Termin və üslub bu məlumata görə seçilir.' }))),
        actions: [{ label: 'Ləğv et', kind: 'ghost' }, { label: 'Saxla', kind: 'primary', onClick: function () {
          var v = { purpose: pu.value.trim() || 'Göstərilməyib', audience: au.value.trim(), note: sit.note || '' };
          sset('pj:sit:' + p.id, v); p.sit = null; sit = sitOf(p); renderInsp(true);
          toast('Situasiya yeniləndi', 'ok', { sub: 'Növbəti qaralamalar buna uyğunlaşacaq' }); nz('read', 'Aydındır, oxucunu nəzərə alıram.', 2200);
        } }] });
    }
    /* --- glossary actions --- */
    function toggleTerm(g) {
      terms[g.a] = !terms[g.a];
      rows.forEach(function (r) { r.src.innerHTML = srcHTML(r); });
      if (terms[g.a]) {
        var hits = rows.filter(function (r) { return srcHas(r.d.s, g); }).length;
        toast('«' + g.a + '» işarələndi', 'info', { sub: hits ? hits + ' seqmentdə · təsdiqlənmiş tərcümə: «' + g.b + '»' : 'Bu bölmədə rast gəlinmir', icon: 'book', ms: 2400 });
      }
      renderInsp(true);
    }
    function addTerm() {
      var a = h('input', { class: 'input', id: 'editor-gl-a', placeholder: set.src === 'ru' ? 'Məs.: поручитель' : 'Məs.: Subcontractor', autocomplete: 'off' });
      var b = h('input', { class: 'input', id: 'editor-gl-b', placeholder: 'Məs.: Subpodratçı', autocomplete: 'off' });
      App.sheet({ title: 'Lüğətə termin', body: h('div', { class: 'stack' },
        h('div', { class: 'grid-2' }, h('div', { class: 'field' }, h('label', { for: 'editor-gl-a' }, 'Mənbə · ' + upper(set.src)), a), h('div', { class: 'field' }, h('label', { for: 'editor-gl-b' }, 'Tərcümə · AZ'), b)),
        h('p', { class: 'small muted', text: 'Lüğətçi Mirzə bu termini bütün layihədə qoruyacaq və uyğunsuzluqları yoxlamada göstərəcək.' })),
        actions: [{ label: 'Ləğv et', kind: 'ghost' }, { label: 'Əlavə et', kind: 'primary', icon: 'plus', onClick: function () {
          var av = a.value.trim(), bv = b.value.trim();
          if (!av || !bv) { (av ? b : a).setAttribute('aria-invalid', 'true'); (av ? b : a).focus(); return false; }
          var ex = sget('pj:gl:' + p.id, []); if (!Array.isArray(ex)) ex = [];
          ex.push({ a: av, b: bv }); sset('pj:gl:' + p.id, ex);
          gl = glossOf(p); ctx.gl = gl; refreshAll(); renderInsp(true);
          toast('Termin lüğətə əlavə edildi', 'ok', { sub: '«' + av + '» → «' + bv + '»', icon: 'book' });
          nz('success', 'Yadda saxladım: «' + av + '» həmişə «' + bv + '» olacaq.', 2600);
        } }] });
    }
    function applyGloss(r) {
      var t = r.st.t, n = 0;
      analyze(r.d, r.st, ctx).forEach(function (x) { if (x.type === 'Termin') { var nt = replaceWord(t, x.was, x.now, false); if (nt !== t) { t = nt; n++; } } });
      if (!n) { toast('Terminlər artıq lüğətə uyğundur', 'ok', { sub: 'Seqment ' + pad3(r.n), icon: 'book', ms: 2000 }); return; }
      setText(r, t, { ed: true });
      toast(n + ' termin düzəldildi', 'ok', { sub: 'Seqment ' + pad3(r.n) + ' · Lüğətçi Mirzə', ms: 2600 });
    }

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
        if (qw && !suf && lower(w) === lower(qw)) return pre + '<span class="editor-they" title="Kimə aiddir? Dəqiqləşdirin">' + w + '</span>';
        return pre + '<mark class="editor-mark">' + w + suf + '</mark>';
      });
    }
    function fit(ta) { if (!ta.isConnected) return; ta.style.height = 'auto'; ta.style.height = (ta.scrollHeight + 2) + 'px'; }
    function buildRow(d, i) {
      var n = i + 1, st = segs[i];
      var r = { d: d, st: st, n: n, i: i, issues: [] };
      r.src = h('div', { class: 'editor-src', lang: set.src });
      r.ta = h('textarea', { class: 'editor-ta', rows: '1', lang: 'az', spellcheck: 'true', placeholder: 'Tərcümə…', 'aria-label': 'Seqment ' + n + ' — tərcümə', value: st.t });
      r.stEl = h('span', { class: 'pj-dot', 'aria-hidden': 'true' });
      r.hints = h('div', { class: 'editor-hints', hidden: true });
      r.pill = h('span', { class: 'editor-pill' });
      r.confTx = h('span');
      r.conf = h('span', { class: 'editor-conf' }, h('span', { class: 'editor-bars', 'aria-hidden': 'true' }, h('i'), h('i'), h('i')), r.confTx);
      r.tm = d.tm ? h('button', { class: 'editor-chip', type: 'button', title: 'Tərcümə yaddaşı: ' + d.tm.from, onclick: function () { setActive(r); openInsp('tm'); } }, h('span', { class: 'pj-mono', text: 'TM ' + d.tm.pct + '%' })) : null;
      r.note = h('button', { class: 'editor-chip', type: 'button', hidden: !st.note, title: st.note || '', onclick: function () { setActive(r); openInsp('ctx'); } }, ie('message'), 'Qeyd');
      r.issBtn = h('button', { class: 'editor-chip', type: 'button', hidden: true, onclick: function () { setActive(r); openInsp('qa'); } });
      r.qTag = d.q ? h('span', { class: 'editor-chip warn', hidden: true, title: d.q.title }, ie('help'), 'Sual') : null;
      r.okTx = h('span', { text: 'Təsdiqlə' });
      r.okBtn = h('button', { class: 'btn btn-sm editor-ok', type: 'button', 'aria-pressed': 'false' }, ie('check'), r.okTx,
        h('span', { class: 'editor-okkbd', 'aria-hidden': 'true' }, h('kbd', { class: 'kbd', text: MOD }), h('kbd', { class: 'kbd', text: '↵' })));
      r.nzBtn = h('button', { class: 'icon-btn sm ghost editor-nzb', type: 'button', title: 'Seqment menyusu', 'aria-label': 'Seqment menyusu — ' + pad3(n), 'aria-haspopup': 'menu', html: App.icon('more') });
      r.meta = h('div', { class: 'editor-seg-h' }, r.stEl, h('span', { class: 'editor-segno', text: 'SEQMENT ' + pad3(n) }), r.pill, r.conf, r.tm, r.note, r.issBtn, r.qTag,
        h('span', { class: 'editor-seg-acts' }, r.okBtn, r.nzBtn));
      r.row = h('div', { class: 'editor-seg', role: 'listitem', 'data-n': String(n) }, r.meta,
        h('div', { class: 'editor-pair' }, h('span', { class: 'editor-lang', text: upper(set.src), title: 'Mənbə' }), r.src, h('span', { class: 'editor-lang', text: 'AZ', title: 'Tərcümə' }), r.ta),
        r.hints);
      r.navDot = h('span', { class: 'pj-dot', 'aria-hidden': 'true' });
      r.navFlag = h('span', { class: 'f' });
      r.nav = h('button', { class: 'editor-nav-item', type: 'button', title: d.s }, h('span', { class: 'n', text: pad3(n) }), r.navDot, h('span', { class: 's', lang: set.src, text: d.s }), r.navFlag);
      r.navLi = h('div', { role: 'listitem' }, r.nav);
      r.nav.addEventListener('click', function () { focusRow(r); if (layout === 'narrow') closeNav(); });
      r.okBtn.addEventListener('click', function () { if (r.st.ok) unapprove(r); else approve(r); });
      r.nzBtn.addEventListener('click', function () { nzMenu(r); });
      r.row.addEventListener('click', function (e) {
        if (e.target.closest && e.target.closest('button, a, textarea, input, select')) return;
        var sel = ''; try { sel = String(W.getSelection ? W.getSelection() : ''); } catch (x) { sel = ''; }
        if (sel) return; /* the user is selecting source text */
        setActive(r); try { r.ta.focus({ preventScroll: true }); } catch (x) { /* ignore */ }
      });
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
    function scrollNavTo(r) {
      var L = navList, it = r.navLi;
      if (!it || it.hidden || !L.clientHeight) return;
      var top = it.offsetTop, bot = top + it.offsetHeight;
      if (top < L.scrollTop + 4) L.scrollTop = Math.max(0, top - 8);
      else if (bot > L.scrollTop + L.clientHeight - 4) L.scrollTop = bot - L.clientHeight + 8;
    }
    function setActive(r, quiet) {
      if (!r) return;
      if (cur !== r) {
        if (cur) { cur.row.classList.remove('active'); cur.nav.removeAttribute('aria-current'); }
        cur = r; r.row.classList.add('active'); r.nav.setAttribute('aria-current', 'true');
        scrollNavTo(r);
      }
      if (!quiet) renderInsp(true);
    }
    function pillOf(st) {
      if (!String(st.t || '').trim()) return ['Boş', 'blank'];
      if (st.ok) return ['Təsdiqləndi', 'ok'];
      if (st.ed) return ['Redaktə', 'edit'];
      if (st.o === 'tm') return ['Yaddaşdan', 'draft'];
      return ['MT', 'draft'];
    }
    function dotOf(r) {
      var st = r.st;
      if (!String(st.t || '').trim()) return 'empty';
      if (st.ok) return 'ok';
      if (r.issues.some(function (x) { return x.sev === 'high'; })) return 'err';
      if (r.issues.length) return 'warn';
      return st.ed ? 'edit' : 'draft';
    }
    var DOT_T = { empty: 'Boş', ok: 'Təsdiqlənib', err: 'Kritik qeyd var', warn: 'Qeyd var', edit: 'Redaktə edilib', draft: 'Qaralama' };
    function updateRow(r) {
      var st = r.st;
      r.issues = analyze(r.d, st, ctx);
      if (r.extra && r.extraFor !== st.t) { r.extra = null; r.checkNote = ''; r.checkScore = null; }
      var conf = confOf(r.d, st, r.issues);
      var pl = pillOf(st);
      r.pill.textContent = pl[0]; r.pill.className = 'editor-pill ' + pl[1];
      r.conf.hidden = !conf;
      r.conf.className = 'editor-conf' + (conf ? ' ' + conf : '');
      r.confTx.textContent = conf ? CONF_L[conf] : '';
      var cnote = st.c && st.o === 'ai' ? st.cn || '' : '';
      r.conf.title = conf === 'high' ? 'Mühərrik əmindir' : conf === 'mid' ? 'Yoxlamağa dəyər: ' + (r.issues[0] ? r.issues[0].text : (cnote || r.d.why || '')) : conf === 'low' ? 'Şübhəli: ' + (r.issues[0] ? r.issues[0].text : cnote) : '';
      r.ta.classList.toggle('editor-t-mid', conf === 'mid' && !st.ok);
      r.ta.classList.toggle('editor-t-low', conf === 'low' && !st.ok);
      var dc = dotOf(r);
      r.stEl.className = 'pj-dot is-' + dc; r.navDot.className = 'pj-dot is-' + dc; r.stEl.title = DOT_T[dc];
      var list = r.issues.filter(function (x) { return x.type !== 'Boş seqment'; });
      var high = list.some(function (x) { return x.sev === 'high'; });
      r.issBtn.hidden = !list.length;
      r.issBtn.className = 'editor-chip ' + (high ? 'err' : 'warn');
      r.issBtn.textContent = list.length + ' qeyd';
      r.issBtn.title = list.length ? list[0].text : '';
      if (r.qTag) r.qTag.hidden = !!st.ans;
      r.okBtn.setAttribute('aria-pressed', st.ok ? 'true' : 'false');
      r.okTx.textContent = st.ok ? 'Təsdiqləndi' : 'Təsdiqlə';
      r.okBtn.title = st.ok ? 'Təsdiqi geri al' : 'Təsdiqlə (' + MOD + ' + Enter)';
      r.row.classList.toggle('is-ok', !!st.ok);
      r.note.hidden = !st.note; r.note.title = st.note || '';
      r.navFlag.textContent = r.d.q && !st.ans ? '?' : r.d.tm ? r.d.tm.pct + '%' : '';
      drawHints(r);
      r.src.innerHTML = srcHTML(r);
      if (r.ask && r.ask._draw) r.ask._draw();
      if (r === cur) renderInsp();
    }
    function drawHints(r) {
      var list = r.issues.filter(function (x) { return x.type !== 'Boş seqment'; });
      r.hints.textContent = '';
      r.hints.hidden = !list.length;
      list.slice(0, 3).forEach(function (iss) {
        var tx = h('span', { class: 'editor-hint-tx', title: iss.text }, h('b', { text: iss.type }));
        if (iss.was && iss.now) { tx.appendChild(h('s', { text: iss.was })); tx.appendChild(D.createTextNode(' → ')); tx.appendChild(h('ins', { text: iss.now })); }
        else tx.appendChild(D.createTextNode(iss.text));
        var act = null;
        if (iss.fix === 'word' || iss.fix === 'raw') {
          act = h('button', { class: 'btn btn-sm btn-ghost', type: 'button', 'aria-label': 'Düzəlt: ' + iss.was + ' → ' + iss.now }, 'Düzəlt');
          act.addEventListener('click', function () { fixRow(r, iss, act); });
        } else if (iss.fix === 'ask' && r.ask) {
          act = h('button', { class: 'btn btn-sm btn-ghost', type: 'button' }, 'Cavabla');
          act.addEventListener('click', function () { openAsk(r); });
        }
        r.hints.appendChild(h('div', { class: 'editor-hint ' + iss.sev }, tx, act));
      });
      if (list.length > 3) r.hints.appendChild(h('button', { class: 'link small', type: 'button', style: 'justify-self:start', onclick: function () { setActive(r); openInsp('qa'); } }, '+' + (list.length - 3) + ' qeyd daha'));
    }
    function openAsk(r) {
      if (!r.ask) return;
      setActive(r);
      r.ask._hide = false; r.ask.hidden = false; r.ask._mini = false; r.ask._draw();
      var b = r.ask.querySelector('.editor-ask-opts .btn'); if (b) try { b.focus(); } catch (e) { /* ignore */ }
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
      setText(r, nt, iss.fix === 'fill' ? { ed: false, o: 'ai' } : { ed: true });
      var elder = ELDER[iss.type] || iss.elder || 'Yoxlama';
      toast('Düzəldildi', 'ok', { sub: 'Seqment ' + pad3(r.n) + ' · ' + (iss.was ? iss.was + ' → ' : '') + (iss.fix === 'fill' ? 'qaralama' : iss.now) + ' · ' + elder, ms: 2600 });
      if (!r.issues.length) nz('success', iss.type === 'Türk forması' ? 'Dilçi Nənə razıdır!' : 'Bu seqment artıq təmizdir.', 1800);
    }
    function approve(r, viaKey) {
      var st = r.st;
      if (!String(st.t || '').trim()) {
        toast('Boş seqment təsdiqlənmir', 'warn', { sub: 'Tərcüməni yazın və ya «İlkin tərcümə»ni işə salın' });
        try { r.ta.focus(); } catch (e) { /* ignore */ }
        return Promise.resolve(false);
      }
      if (st.ok) return Promise.resolve(true);
      var high = r.issues.filter(function (x) { return x.sev === 'high'; });
      var gate = high.length ? App.confirm({ title: 'Seqment ' + pad3(r.n) + ' riskli görünür', text: high[0].text + ' Yenə də təsdiqlənsin?', okLabel: 'Yenə də təsdiqlə', icon: 'alert' }) : Promise.resolve(true);
      return gate.then(function (yes) {
        if (!yes || S.dead) return false;
        st.ok = true; approvals++;
        updateRow(r); updateAll(); scheduleSave();
        burstAt(r.okBtn, 'stars');
        if (p.kind === 'sim') xpAt(r.okBtn, '+5 XP');
        if (approvals === 1 && !viaKey) nz('success', 'Təsdiqləndi! ' + MOD + ' + Enter ilə daha sürətli olar.', 2600);
        else if (high.length) nz('worried', 'Təsdiqlədim, amma yoxlama bu seqmentə yenə baxacaq.', 2200);
        return true;
      });
    }
    function unapprove(r) {
      r.st.ok = false; updateRow(r); updateAll(); scheduleSave();
      toast('Təsdiq geri alındı', 'info', { sub: 'Seqment ' + pad3(r.n) + ' yenidən redaktədədir', ms: 2200 });
    }

    /* --- clarifying question (inside the active segment) --- */
    function buildAsk(r) {
      var q = r.d.q;
      var box = h('div', { class: 'editor-ask', role: 'group', 'aria-label': 'Dəqiqləşdirmə sualı — seqment ' + pad3(r.n) });
      box._hide = false; box._mini = false;
      box._draw = function () {
        box.textContent = '';
        if (r.st.ans) {
          box.className = 'editor-ask done';
          box.appendChild(h('div', { class: 'stack-sm' }, h('b', { text: '«' + q.word + '» — ' + r.st.ans }), h('p', { text: 'Seqment yeniləndi. Bu sənəddə oxşar yerlərdə də «' + r.st.ans + '» götürüləcək.' })));
          box.appendChild(h('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: function () { r.st.ans = null; setText(r, r.d.ai || r.d.t, { ed: false }); } }, 'Dəyiş'));
          return;
        }
        if (box._mini) {
          box.className = 'editor-ask mini';
          box.appendChild(h('span', { class: 'editor-p', html: '<b>Sual açıqdır:</b> «' + esc(q.word) + '» kimə aiddir?' }));
          box.appendChild(h('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: function () { box._mini = false; box._draw(); } }, 'Aç'));
          return;
        }
        box.className = 'editor-ask';
        var srcQ = h('p', { class: 'editor-ask-q', lang: set.src, html: esc(r.d.s).replace(new RegExp('(^|[^\\p{L}])(' + reEsc(q.word) + ')(?![\\p{L}])', 'iu'), '$1<span class="editor-they">$2</span>') });
        var opts = h('div', { class: 'editor-ask-opts' }, q.opts.map(function (o) {
          return h('button', { class: 'btn btn-sm' + (o[0] === q.likely ? ' btn-secondary' : ' btn-ghost'), type: 'button', onclick: function (e) { answer(r, o, e.currentTarget); } }, o[0]);
        }), h('button', { class: 'link small', type: 'button', onclick: function () { box._mini = true; box._draw(); nz('idle', 'Yaxşı, sonra soruşaram.', 1600); } }, 'Sonra'));
        box.appendChild(h('span', { class: 'pj-cap', text: 'Dəqiqləşdirmə' }));
        box.appendChild(h('h3', { text: q.title }));
        box.appendChild(srcQ);
        box.appendChild(h('p', { text: q.text }));
        box.appendChild(opts);
      };
      box._draw();
      return box;
    }
    function answer(r, o, btn) {
      r.st.ans = o[0];
      burstAt(btn, 'stars');
      setText(r, o[1], { o: 'ai', ed: false });
      if (o[0] === r.d.q.likely) {
        toast('Cavab yadda saxlandı', 'ok', { sub: '«' + r.d.q.word + '» — ' + o[0] + ' · seqment ' + pad3(r.n) + ' yeniləndi' });
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
    function updateAll(refilter) {
      var c = { all: rows.length, empty: 0, unrev: 0, risk: 0 };
      rows.forEach(function (r) { if (matchF(r, 'empty')) c.empty++; if (matchF(r, 'unrev')) c.unrev++; if (isRisk(r)) c.risk++; });
      FILTERS.forEach(function (f) { fBtns[f.id].c.textContent = String(c[f.id]); });
      var vis = 0, ae = D.activeElement;
      rows.forEach(function (r) {
        var show = matchF(r, filter);
        if (!show && !refilter && !r.row.hidden && r.row.contains(ae)) show = true;
        if (!show && !refilter && !r.row.hidden && filter !== 'all') show = r === cur;
        r.row.hidden = !show; r.navLi.hidden = !show;
        if (r.ask) r.ask.hidden = !show || r.ask._hide;
        if (show) vis++;
      });
      navCount.textContent = filter === 'all' ? String(rows.length) : vis + ' / ' + rows.length;
      fInfo.textContent = '';
      if (filter !== 'all') {
        var fl = FILTERS.filter(function (f) { return f.id === filter; })[0];
        fInfo.appendChild(h('span', { text: 'Filtr: ' + fl.label + ' · ' + vis }));
        fInfo.appendChild(h('button', { class: 'link small', type: 'button', onclick: function () { setFilter('all'); } }, 'Hamısını göstər'));
      } else fInfo.appendChild(h('span', { text: rows.length + ' seqment' }));
      emptyHost.hidden = vis > 0;
      if (!vis) {
        var msg = filter === 'empty' ? ['Boş seqment qalmayıb', 'Bölmədəki bütün seqmentlər tərcümə olunub.'] : filter === 'risk' ? ['Riskli seqment yoxdur', 'Mirzələr bu bölmədə şübhəli yer tapmadı.'] : ['Hamısı yoxlanılıb', 'Bölmədəki bütün seqmentlər təsdiqlənib.'];
        emptyHost.textContent = '';
        emptyHost.appendChild(emptyBox(S, { block: true, icon: 'check', title: msg[0], text: msg[1], actions: [h('button', { class: 'btn btn-secondary btn-sm', type: 'button', onclick: function () { setFilter('all'); } }, 'Hamısını göstər')] }));
      }
      var pr = progressOf(p, segs);
      progI.style.width = pr.pct + '%'; progBar.setAttribute('aria-valuenow', String(pr.pct));
      pctTx.textContent = pr.pct + '%';
      progTx.textContent = num(pr.ok) + ' / ' + num(pr.total) + ' təsdiqlənib';
      mCount.textContent = pr.ok + '/' + pr.total;
      if (!(p.status === 'delivered' && pr.pct === 100)) setMap('pj:prog', p.id, pr.pct);
      startCard.hidden = c.empty !== rows.length;
      var allOk = rows.every(function (r) { return r.st.ok; });
      if (allOkBefore === false && allOk) {
        nz('celebrate', 'Bölmə tam təsdiqləndi! Yoxlamaya baxaq?', 3200);
        toast('Bölmə təsdiqləndi', 'ok', { sub: rows.length + ' seqment · indi yoxlama vaxtıdır', icon: 'stamp', action: { label: 'Yoxlama', onClick: function () { flushSave(); App.go('qa', { project: p.id }); } } });
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
      setActive(r);
      try { r.row.scrollIntoView({ block: 'center', behavior: reduced() ? 'auto' : 'smooth' }); } catch (e) { /* ignore */ }
      S.later(function () { try { r.ta.focus({ preventScroll: true }); var L = r.ta.value.length; r.ta.setSelectionRange(L, L); } catch (e) { /* ignore */ } }, reduced() ? 0 : 200);
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
      if (!page.isConnected) return;
      if (e.key === 'Escape' && !overlayOpen() && !menuEl && (navOpen || insOpen)) { e.preventDefault(); if (navOpen) closeNav(); else closeInsp(); return; }
      if (overlayOpen() || navOpen || !e.altKey || (e.key !== 'ArrowDown' && e.key !== 'ArrowUp')) return;
      if (listEl.contains(e.target)) return;
      var t = e.target && e.target.tagName;
      if (t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT') return;
      e.preventDefault();
      var v = visibleRows(); if (!v.length) return;
      focusRow(e.key === 'ArrowDown' ? (cur && v.indexOf(cur) >= 0 ? v[Math.min(v.length - 1, v.indexOf(cur) + 1)] : v[0]) : (cur && v.indexOf(cur) > 0 ? v[v.indexOf(cur) - 1] : v[0]));
    });

    /* --- layout: wide (3 panes) · mid (inspector = side sheet) · narrow (single column, drawer + bottom sheet) --- */
    function syncPanelBtn() { panelBtn.setAttribute('aria-pressed', (layout === 'wide' ? UI.insp : insOpen) ? 'true' : 'false'); }
    function applyLayout() {
      var w = page.getBoundingClientRect().width || W.innerWidth;
      var L = w >= 1120 ? 'wide' : w >= 700 ? 'mid' : 'narrow';
      if (L !== layout) {
        layout = L; page.setAttribute('data-layout', L);
        closeNav(true); closeInsp(true);
        insp.setAttribute('role', L === 'wide' ? 'complementary' : 'dialog');
        nav.setAttribute('role', L === 'narrow' ? 'dialog' : 'complementary');
        S.later(function () { rows.forEach(function (r) { fit(r.ta); }); }, 30);
      }
      page.classList.toggle('insp-off', layout === 'wide' && !UI.insp);
      syncPanelBtn();
    }
    function toggleInsp() {
      if (layout === 'wide') { UI.insp = !UI.insp; applyLayout(); if (UI.insp) renderInsp(true); return; }
      if (insOpen) closeInsp(); else openInsp();
    }
    function openInsp(tab) {
      if (tab) setTab(tab, true);
      if (layout === 'wide') { if (!UI.insp) { UI.insp = true; applyLayout(); } }
      else {
        if (layout === 'narrow') { closeNav(true); scrim.classList.add('on'); }
        insOpen = true; insp.classList.add('on');
        S.later(function () { try { inspB.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }, 40);
      }
      syncPanelBtn(); renderInsp(true);
    }
    function closeInsp(silent) {
      if (!insOpen) return;
      insOpen = false; insp.classList.remove('on');
      if (!navOpen) scrim.classList.remove('on');
      syncPanelBtn();
      if (!silent && cur && insp.contains(D.activeElement)) { try { cur.ta.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }
    }
    function openNav() {
      if (layout !== 'narrow') return;
      closeInsp(true);
      navOpen = true; nav.classList.add('on'); scrim.classList.add('on');
      if (cur) scrollNavTo(cur);
      S.later(function () { try { (cur ? cur.nav : fBtns.all.b).focus({ preventScroll: true }); } catch (e) { /* ignore */ } }, 40);
    }
    function closeNav(silent) {
      if (!navOpen) return;
      navOpen = false; nav.classList.remove('on');
      if (!insOpen || layout !== 'narrow') scrim.classList.remove('on');
      if (!silent && nav.contains(D.activeElement) && cur) { try { cur.ta.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }
    }

    /* --- inspector --- */
    function altsOf(r) {
      var d = r.d;
      return (d.q ? d.q.opts.map(function (o) { return [o[1], '«' + d.q.word + '» = ' + o[0], o[0]]; }) : []).concat(d.alts || []);
    }
    function issuesOf(r) {
      var extra = r.extra && r.extraFor === r.st.t ? r.extra : [];
      return r.issues.concat(extra);
    }
    function setTab(t, noRender) {
      UI.tab = t;
      INSP_TABS.forEach(function (x) { var on = x[0] === t; tabBtns[x[0]].b.setAttribute('aria-selected', on ? 'true' : 'false'); tabBtns[x[0]].b.setAttribute('tabindex', on ? '0' : '-1'); });
      inspB.setAttribute('aria-labelledby', 'editor-tab-' + t);
      if (!noRender) renderInsp(true);
    }
    function tabCounts(r) {
      var c = {}, cls = {};
      if (r) {
        var hits = gl.filter(function (g) { return srcHas(r.d.s, g); }).length;
        c.gl = hits ? String(hits) : '';
        c.tm = r.d.tm ? r.d.tm.pct + '%' : '';
        var al = altsOf(r).length; c.sug = al ? String(al) : '';
        var iss = issuesOf(r); c.qa = iss.length ? String(iss.length) : '';
        cls.qa = iss.some(function (x) { return x.sev === 'high'; }) ? 'err' : iss.length ? 'warn' : '';
        c.ctx = r.st.note ? '1' : '';
      }
      INSP_TABS.forEach(function (t) { var o = tabBtns[t[0]]; o.c.textContent = c[t[0]] || ''; o.c.className = 'c pj-mono' + (cls[t[0]] ? ' ' + cls[t[0]] : ''); });
    }
    function sec(title, kids, right) { return put(h('section', { class: 'editor-sec' }, h('div', { class: 'editor-sec-h' }, h('h4', { class: 'pj-cap', text: title }), right || null)), kids); }
    function confEl(conf) { return conf ? h('span', { class: 'editor-conf ' + conf }, h('span', { class: 'editor-bars', 'aria-hidden': 'true' }, h('i'), h('i'), h('i')), CONF_L[conf]) : h('span', { class: 'editor-p', text: '—' }); }
    function renderInsp(force) {
      var r = cur;
      tabCounts(r);
      if (layout === 'wide' && !UI.insp) return;
      if (layout !== 'wide' && !insOpen && !force) return;
      var ae = D.activeElement;
      if (!force && insp.contains(ae) && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)) return;
      var hadFocus = inspB.contains(ae);
      inspSub.textContent = ''; inspB.textContent = '';
      if (!r) { inspB.appendChild(h('p', { class: 'editor-p', style: 'padding-top:12px', text: 'Seqment seçin — kontekst, lüğət, tərcümə yaddaşı və təkliflər burada görünəcək.' })); return; }
      put(inspSub, h('span', { class: 'pj-dot is-' + dotOf(r), 'aria-hidden': 'true' }), h('span', { class: 'editor-segno', text: 'SEQMENT ' + pad3(r.n) }), h('span', { class: 'st', text: pillOf(r.st)[0] }));
      ({ ctx: inspCtx, gl: inspGl, tm: inspTm, sug: inspSug, qa: inspQa }[UI.tab] || inspSug)(r, inspB);
      if (hadFocus) { try { tabBtns[UI.tab].b.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }
    }
    function originOf(st) {
      var o = st.o === 'tm' ? 'Tərcümə yaddaşı' : st.o === 'ai' ? 'Maşın tərcüməsi' : st.o === 'human' ? 'Tərcüməçi' : '—';
      return o + (st.ed && st.o !== 'human' ? ' · redaktə edilib' : '');
    }
    function inspCtx(r, box) {
      var d = r.d, st = r.st, conf = confOf(d, st, r.issues);
      box.appendChild(sec('Seqment', h('dl', { class: 'editor-kv' },
        h('dt', { text: 'Mənşə' }), h('dd', { text: originOf(st) }),
        h('dt', { text: 'Etibarlılıq' }), h('dd', null, confEl(conf)),
        h('dt', { text: 'Söz sayı' }), h('dd', { class: 'pj-mono', text: String(wordsIn(d.s)) }),
        h('dt', { text: 'Bölmə' }), h('dd', { text: set.title }))));
      var prev = rows[r.i - 1], next = rows[r.i + 1];
      function nb(x) { return h('button', { class: 'editor-nb', type: 'button', onclick: function () { focusRow(x); } }, h('span', { class: 'n', text: pad3(x.n) }), h('span', { class: 't', lang: set.src, text: x.d.s })); }
      if (prev || next) box.appendChild(sec('Sənəddə', [prev ? nb(prev) : null, next ? nb(next) : null]));
      sit = sitOf(p);
      box.appendChild(sec('Situasiya', [
        h('dl', { class: 'editor-kv' }, h('dt', { text: 'Məqsəd' }), h('dd', { text: sit.purpose || '—' }), sit.audience ? [h('dt', { text: 'Oxucu' }), h('dd', { text: sit.audience })] : null),
        sit.note ? h('p', { class: 'editor-quote', text: sit.note }) : null,
        h('button', { class: 'link small', type: 'button', style: 'justify-self:start', onclick: editSit }, 'Situasiyanı dəyiş')]));
      box.appendChild(sec('Üslub', [regSeg, h('p', { class: 'editor-p', text: p.reg === 'huquqi' ? 'Avtomatik tanındı: hüquqi — «shall» öhdəlikləri, müəyyən edilmiş terminlər, tərəflərin adları.' : 'Avtomatik tanındı: ' + REG[p.reg] + '. Nöqtə tanınan üslubu göstərir.' })]));
      var ta = h('textarea', { class: 'textarea editor-note-ta', id: 'editor-note', rows: '3', placeholder: 'Məs.: Müştəri ilə «Delta» yazılışını dəqiqləşdirmək', value: st.note || '' });
      var saveN = h('button', { class: 'btn btn-secondary btn-sm', type: 'button' }, 'Qeydi saxla');
      saveN.addEventListener('click', function () {
        r.st.note = ta.value.trim(); updateRow(r); scheduleSave(); renderInsp(true);
        toast(r.st.note ? 'Qeyd saxlanıldı' : 'Qeyd silindi', 'ok', { sub: 'Seqment ' + pad3(r.n), ms: 2200 });
      });
      var delN = st.note ? h('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: function () { r.st.note = ''; updateRow(r); scheduleSave(); renderInsp(true); toast('Qeyd silindi', 'ok', { sub: 'Seqment ' + pad3(r.n), ms: 2200 }); } }, 'Sil') : null;
      box.appendChild(sec('Redaktor qeydi', [h('label', { class: 'sr-only', for: 'editor-note' }, 'Redaktor qeydi'), ta, h('div', { class: 'editor-row' }, saveN, delN)]));
    }
    function inspGl(r, box) {
      var hit = gl.filter(function (g) { return srcHas(r.d.s, g); }), rest = gl.filter(function (g) { return !srcHas(r.d.s, g); });
      var bad = {}, badHere = {};
      rows.forEach(function (x) { x.issues.forEach(function (i) { if (i.type === 'Termin') { bad[i.term] = (bad[i.term] || 0) + 1; if (x === r) badHere[i.term] = true; } }); });
      function table(list) {
        return h('div', { class: 'editor-gl' },
          h('div', { class: 'editor-gl-r editor-gl-th', 'aria-hidden': 'true' }, h('span', { text: 'Termin' }), h('span', { text: 'Tərcümə' }), h('span', { text: 'Sahə' })),
          list.map(function (g) {
            var b = h('button', { class: 'editor-gl-r', type: 'button', 'aria-pressed': terms[g.a] ? 'true' : 'false', title: terms[g.a] ? 'Mənbədə işarələnib — söndür' : 'Mənbədə işarələ' },
              h('span', { class: 'a', lang: set.src }, g.a),
              h('span', { class: 'b' }, g.b, g.note ? h('small', { text: g.note }) : null, bad[g.a] ? h('span', { class: 'bad', text: (badHere[g.a] ? 'bu seqmentdə uyğunsuz' : bad[g.a] + ' uyğunsuz istifadə') }) : null),
              h('span', { class: 'f', text: g.custom ? 'Əlavə edilib' : p.field }));
            b.addEventListener('click', function () { toggleTerm(g); });
            return b;
          }));
      }
      var hasBad = r.issues.some(function (x) { return x.type === 'Termin'; });
      box.appendChild(sec('Bu seqmentdə', hit.length ? table(hit) : h('p', { class: 'editor-p', text: 'Seqmentdə lüğət termini yoxdur.' }), h('span', { class: 'editor-nav-count', text: String(hit.length) })));
      box.appendChild(sec('Layihə lüğəti', [rest.length ? table(rest) : null, h('div', { class: 'editor-row' },
        h('button', { class: 'btn btn-secondary btn-sm', type: 'button', onclick: addTerm }, ie('plus'), 'Termin əlavə et'),
        h('button', { class: 'btn btn-ghost btn-sm', type: 'button', disabled: !hasBad, title: hasBad ? 'Lüğətə uyğun olmayan terminləri düzəlt' : 'Uyğunsuzluq yoxdur', onclick: function () { applyGloss(r); } }, 'Seqmentə tətbiq et'))],
        h('span', { class: 'editor-nav-count', text: String(gl.length) })));
      box.appendChild(h('p', { class: 'editor-p', text: 'Termini seçin — bütün seqmentlərdə mənbədə işarələnəcək.' }));
    }
    function inspTm(r, box) {
      var tm = r.d.tm;
      if (!tm) {
        box.appendChild(sec('Tərcümə yaddaşı', [h('p', { class: 'editor-p', text: 'Bu seqment üçün tərcümə yaddaşında uyğunluq tapılmadı.' }),
          h('p', { class: 'editor-p', text: 'Uyğunluq olduqda faiz, yaddaşdakı mənbə və tərcümə burada göstərilir.' })]));
        return;
      }
      var srcW = {}; String(r.d.s).split(/\s+/).forEach(function (w) { srcW[lower(w.replace(/[^\p{L}\p{N}]/gu, ''))] = 1; });
      var diffHTML = String(tm.src).split(/(\s+)/).map(function (w) {
        var k = lower(w.replace(/[^\p{L}\p{N}]/gu, ''));
        return k && !srcW[k] ? '<mark>' + esc(w) + '</mark>' : esc(w);
      }).join('');
      var use = r.d.t || tm.tgt;
      var applied = String(r.st.t || '') === use;
      var apply = h('button', { class: 'btn btn-primary btn-sm', type: 'button', disabled: applied }, ie('check'), applied ? 'Tətbiq edilib' : 'Tətbiq et');
      apply.addEventListener('click', function () {
        setText(r, use, { o: 'tm', ed: false });
        toast('TM uyğunluğu tətbiq edildi', 'ok', { sub: 'Seqment ' + pad3(r.n) + ' · ' + tm.pct + '% · ' + tm.from, icon: 'database' });
        if (layout === 'narrow') closeInsp();
        S.later(function () { focusRow(r, true); }, 120);
      });
      box.appendChild(sec('Uyğunluq', [h('div', { class: 'editor-tm' },
        h('span', { class: 'editor-tm-pct' + (tm.pct >= 95 ? ' hi' : tm.pct < 85 ? ' mid' : ''), text: tm.pct + '%' }),
        h('div', { class: 'stack-sm' }, h('p', { class: 'editor-tm-src', lang: set.src, html: diffHTML }), h('p', { class: 'editor-tm-tgt', lang: 'az', text: tm.tgt }))),
        h('dl', { class: 'editor-kv' }, h('dt', { text: 'Mənbə' }), h('dd', { text: tm.from }), tm.date ? [h('dt', { text: 'Tarix' }), h('dd', { text: App.fmt ? App.fmt.date(tm.date) : tm.date })] : null,
          tm.diff ? [h('dt', { text: 'Fərq' }), h('dd', { text: tm.diff })] : null)]));
      if (use !== tm.tgt) box.appendChild(sec('Uyğunlaşdırılmış variant', h('p', { class: 'editor-tm-tgt', lang: 'az', text: use })));
      box.appendChild(h('div', { class: 'editor-row', style: 'padding-top:4px' }, apply));
    }
    function applyAlt(r, a, edit) {
      if (a[2]) r.st.ans = a[2];
      setText(r, a[0], { ed: !a[2] });
      toast('Variant tətbiq edildi', 'ok', { sub: 'Seqment ' + pad3(r.n) + ' · ' + a[1], ms: 2400 });
      if (layout === 'narrow') closeInsp(true);
      if (edit || layout === 'narrow') S.later(function () { focusRow(r, !edit); }, 120);
    }
    function sugConf(r, a) {
      var st = { t: a[0], o: 'ai', ed: false, ans: a[2] || r.st.ans || null };
      return confOf(r.d, st, analyze(r.d, st, ctx));
    }
    function inspSug(r, box) {
      var d = r.d, alts = altsOf(r);
      if (!alts.length && !String(r.st.t || '').trim() && (d.ai || d.t) && (p.sample || !(App.isLive && App.isLive()))) alts = [[d.ai || d.t, 'İlkin qaralama', null]];
      if (!alts.length) {
        box.appendChild(sec('Mirzə təklifi', h('p', { class: 'editor-p', text: 'Bu seqment üçün əlavə variant yoxdur — cari tərcümə tərcümə yaddaşı və lüğətlə uyğundur.' })));
        if (d.why) box.appendChild(sec('İzah', h('p', { class: 'editor-p', text: d.why })));
        return;
      }
      var top = alts[0], same = String(r.st.t || '') === top[0];
      var apply = h('button', { class: 'btn btn-primary btn-sm', type: 'button', disabled: same }, same ? 'Tətbiq edilib' : 'Tətbiq et');
      apply.addEventListener('click', function () { applyAlt(r, top, false); });
      var edit = h('button', { class: 'btn btn-secondary btn-sm', type: 'button' }, 'Redaktə et');
      edit.addEventListener('click', function () { applyAlt(r, top, true); });
      box.appendChild(h('div', { class: 'editor-sec' }, h('div', { class: 'editor-sug' },
        h('div', { class: 'editor-sug-h' }, h('span', { class: 'pj-cap', text: 'Mirzə təklifi' }), confEl(sugConf(r, top))),
        h('span', { class: 'editor-sug-k', text: top[1] }),
        h('p', { class: 'editor-sug-t', lang: 'az', text: top[0] }),
        d.why ? h('p', { class: 'editor-sug-why' }, h('b', { text: 'Səbəb: ' }), d.why) : null,
        h('div', { class: 'editor-row' }, apply, edit))));
      if (alts.length > 1) box.appendChild(sec('Digər variantlar', alts.slice(1).map(function (a) {
        var b = h('button', { class: 'btn btn-ghost btn-sm', type: 'button', disabled: String(r.st.t || '') === a[0] }, 'Tətbiq et');
        b.addEventListener('click', function () { applyAlt(r, a, false); });
        return h('div', { class: 'editor-alt' }, h('small', { text: a[1] }), h('span', { lang: 'az', text: a[0] }), b);
      })));
    }
    function issueItem(r, x) {
      var who = ELDER[x.type] || x.elder || 'Yoxlama';
      var d = x.was && x.now ? h('div', { class: 'd' }, h('s', { text: x.was }), ' → ', h('ins', { text: x.now }))
        : x.fix === 'fill' ? h('div', { class: 'd' }, h('ins', { text: clip(x.now, 140) })) : null;
      var act = null;
      if (x.fix === 'word' || x.fix === 'raw' || x.fix === 'fill') {
        act = h('button', { class: 'btn btn-secondary btn-sm', type: 'button' }, x.fix === 'fill' ? 'Qaralama ilə doldur' : 'Düzəlt');
        act.addEventListener('click', function () { fixRow(r, x, act); });
      } else if (x.fix === 'ask' && r.ask) {
        act = h('button', { class: 'btn btn-secondary btn-sm', type: 'button' }, 'Cavabla');
        act.addEventListener('click', function () { if (layout === 'narrow') closeInsp(true); openAsk(r); });
      }
      return h('div', { class: 'editor-iss' },
        h('div', { class: 'editor-iss-h' }, h('span', { text: x.type }), h('span', { class: 'who' }, monoAv(who), who)),
        d, h('p', { text: x.text }), act ? h('div', { class: 'editor-row' }, act) : null);
    }
    function inspQa(r, box) {
      var list = issuesOf(r);
      var chk = h('button', { class: 'btn btn-secondary btn-sm', type: 'button', disabled: !!r.checking }, ie('shield'), r.checked ? 'Yenidən soruş' : 'Mirzələrdən soruş');
      chk.addEventListener('click', function () { runCheck(r); });
      box.appendChild(h('div', { class: 'editor-qa-h' },
        h('div', null, h('b', { text: list.length ? list.length + ' qeyd' : 'Qeyd yoxdur' }),
          h('small', { text: r.checkScore != null ? (r.checkLive ? 'Mirzələr yoxladı' : 'Yerli yoxlama') + ' · bal ' + r.checkScore : 'Yerli yoxlama: rəqəm, termin, türk forması, durğu' })),
        chk));
      if (r.checking) {
        box.appendChild(h('div', { class: 'pj-sk-stack', 'aria-busy': 'true', 'aria-label': 'Yoxlanılır', style: 'padding:12px 0' }, h('span', { class: 'pj-sk', style: 'width:45%' }), h('span', { class: 'pj-sk', style: 'width:90%' }), h('span', { class: 'pj-sk', style: 'width:70%' })));
      }
      if (r.checkNote) box.appendChild(h('div', { class: 'editor-note', role: 'note' }, ie('alert'), h('div', { text: r.checkNote })));
      if (!list.length && !r.checking) {
        box.appendChild(h('div', { class: 'editor-clean' }, ie('check'), h('span', { text: String(r.st.t || '').trim() ? 'Rəqəmlər, terminlər, türk formaları və durğu qaydasındadır.' : 'Seqment boşdur.' })));
      }
      [['high', 'Kritik'], ['mid', 'Əsas'], ['low', 'Kiçik']].forEach(function (g) {
        var l = list.filter(function (x) { return x.sev === g[0]; });
        if (!l.length) return;
        box.appendChild(h('div', { class: 'editor-grp' }, h('i', { class: 'editor-sdot ' + g[0], 'aria-hidden': 'true' }), h('span', { class: 'pj-cap', text: g[1] }), h('span', { class: 'editor-nav-count', text: String(l.length) })));
        l.forEach(function (x) { box.appendChild(issueItem(r, x)); });
      });
      box.appendChild(h('div', { class: 'editor-sec' }, h('button', { class: 'link small', type: 'button', style: 'justify-self:start', onclick: function () { flushSave(); App.go('qa', { project: p.id }); } }, 'Bütün layihə üzrə yoxlama →')));
    }
    function runCheck(r) {
      if (r.checking) return;
      r.checking = true; r.checkNote = '';
      if (cur === r) renderInsp(true);
      nz('think', 'Mirzələr seqmenti oxuyur…', 1800);
      App.fakeAI('check', { src: r.d.s, tgt: r.st.t, pair: p.pair, register: regNow, domain: p.field, terms: gl }).then(function (c) {
        if (S.dead) return;
        r.checking = false;
        var tx = String(r.st.t || ''), iss = analyze(r.d, r.st, ctx), extra = [];
        var sc = !tx.trim() ? 0 : clamp(98 - iss.reduce(function (s, x) { return s + (x.sev === 'high' ? 24 : x.sev === 'mid' ? 10 : 4); }, 0), 40, 98);
        if (tx.trim() && c && c.live && Array.isArray(c.errors)) { /* live engine: add what the reviser found to the local checks */
          c.errors.forEach(function (e) {
            if (!e || e.auto || iss.some(function (x) { return x.was && lower(x.was) === lower(e.was); })) return;
            var real = !!e.was && e.was !== '—' && tx.indexOf(e.was) >= 0;
            extra.push({ type: e.type, sev: e.severity || 'mid', was: real ? e.was : '', now: e.now || '', fix: real && e.now ? 'raw' : null,
              text: (real ? '«' + e.was + '» → «' + (e.now || '—') + '». ' : e.now ? '→ «' + e.now + '». ' : '') + (e.why || '') });
          });
          if (c.score != null) sc = Math.min(sc, c.score);
        }
        /* live engine failed (fakeAI already showed why): say that only the local checks ran */
        var liveFail = !!(c && c.ok === false);
        r.extra = extra; r.extraFor = r.st.t; r.checked = Date.now(); r.checkScore = tx.trim() ? sc : null; r.checkLive = !liveFail;
        r.checkNote = liveFail ? 'Dərin yoxlama alınmadı — burada yalnız yerli yoxlamalar göstərilir. Bağlantını yoxlayın və bir az sonra yenidən cəhd edin.' : '';
        if (cur === r) renderInsp(true); else tabCounts(cur);
        var n = iss.length + extra.length;
        if (liveFail) nz('sad', null, 1600);
        else nz(n ? 'point' : 'success', n ? 'Bax, bunları tapdıq.' : 'Qeyd yoxdur.', 1800);
      }, function () {
        if (S.dead) return;
        r.checking = false; r.checkNote = 'Yoxlama tamamlanmadı — bağlantını yoxlayın və yenidən cəhd edin.';
        if (cur === r) renderInsp(true);
      });
    }

    /* --- segment menu (popover) --- */
    function closeMenu(focusBack) {
      if (!menuEl) return;
      var m = menuEl; menuEl = null;
      if (m.parentNode) m.parentNode.removeChild(m);
      D.removeEventListener('mousedown', m._out, true); D.removeEventListener('keydown', m._key, true);
      if (focusBack && m._anchor) { try { m._anchor.focus(); } catch (e) { /* ignore */ } }
    }
    S.finals.push(function () { closeMenu(false); });
    function popMenu(anchor, items) {
      closeMenu(false);
      var m = h('div', { class: 'editor-menu', role: 'menu', 'aria-label': 'Seqment menyusu' }, items.filter(Boolean).map(function (it) {
        var b = h('button', { class: 'editor-menu-i', type: 'button', role: 'menuitem' }, ie(it.ic), h('span', { text: it.b }), it.k ? h('span', { class: 'k', text: it.k }) : null);
        b.addEventListener('click', function () { closeMenu(false); it.run(); });
        return b;
      }));
      m._anchor = anchor; menuEl = m;
      page.appendChild(m);
      var rc = anchor.getBoundingClientRect(), mw = m.offsetWidth, mh = m.offsetHeight;
      var left = Math.max(8, Math.min(W.innerWidth - mw - 8, rc.right - mw));
      var top = rc.bottom + 4; if (top + mh > W.innerHeight - 8) top = Math.max(8, rc.top - mh - 4);
      m.style.left = left + 'px'; m.style.top = top + 'px';
      m._out = function (e) { if (!m.contains(e.target) && !anchor.contains(e.target)) closeMenu(false); };
      m._key = function (e) {
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeMenu(true); return; }
        if (e.key === 'Tab') { closeMenu(false); return; }
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          var bs = Array.prototype.slice.call(m.querySelectorAll('button')), i = bs.indexOf(D.activeElement);
          i = e.key === 'ArrowDown' ? (i + 1) % bs.length : (i <= 0 ? bs.length - 1 : i - 1);
          bs[i].focus();
        }
      };
      D.addEventListener('mousedown', m._out, true); D.addEventListener('keydown', m._key, true);
      var first = m.querySelector('button'); if (first) first.focus();
    }
    S.on(center, 'scroll', function () { closeMenu(false); }, { passive: true });
    S.on(W, 'scroll', function () { closeMenu(false); }, { passive: true });
    function nzMenu(r) {
      if (menuEl && menuEl._anchor === r.nzBtn) { closeMenu(true); return; }
      setActive(r);
      var alts = altsOf(r);
      popMenu(r.nzBtn, [
        { ic: 'layers', b: 'Alternativ variantlar', k: alts.length ? String(alts.length) : '', run: function () { openInsp('sug'); } },
        { ic: 'help', b: 'Niyə belə tərcümə edildi?', run: function () { openInsp('sug'); } },
        r.d.tm ? { ic: 'database', b: 'Tərcümə yaddaşı', k: r.d.tm.pct + '%', run: function () { openInsp('tm'); } } : null,
        { ic: 'shield', b: 'Mirzələrdən soruş', run: function () { openInsp('qa'); runCheck(r); } },
        { ic: 'book', b: 'Lüğəti tətbiq et', run: function () { applyGloss(r); } },
        { ic: 'message', b: r.st.note ? 'Qeydi dəyiş' : 'Redaktora qeyd', run: function () { openInsp('ctx'); S.later(function () { var n = D.getElementById('editor-note'); if (n) { try { n.focus(); } catch (e) { /* ignore */ } } }, 80); } },
        r.st.ok ? { ic: 'refresh', b: 'Təsdiqi geri al', run: function () { unapprove(r); } } : null
      ]);
      nz('point', 'Bu seqment haqqında nə bilmək istəyirsiniz?', 2000);
    }

    /* --- AI pre-translation (big job → Mirzə Məclisi) --- */
    function aiBusy(on, n) {
      if (on) aiBtn.setAttribute('aria-busy', 'true'); else aiBtn.removeAttribute('aria-busy');
      if (on) { busyTx.textContent = 'İlkin tərcümə · ' + n + ' seqment hazırlanır…'; busyEl.hidden = false; }
    }
    function aiDone() { busyEl.hidden = true; }
    function setBusy(r, on) {
      r.ta.classList.toggle('editor-sk', on); r.ta.readOnly = on;
      if (on) { r.ta.value = ''; r.stEl.className = 'pj-dot is-busy'; r.navDot.className = 'pj-dot is-busy'; r.row.setAttribute('aria-busy', 'true'); }
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
      if (aiBtn.getAttribute('aria-busy') === 'true' || !busyEl.hidden) return;
      var todo = rows.filter(function (r) { return !String(r.st.t || '').trim(); });
      if (!todo.length) {
        toast('Boş seqment yoxdur', 'info', { sub: 'İlkin tərcümə yalnız boş seqmentləri doldurur' });
        nz('point', 'Hamısı doludur. Riskli seqmentlərə baxaq?', 2600);
        if (rows.some(isRisk)) setFilter('risk');
        return;
      }
      if (App.isLive && App.isLive()) { runLiveAI(todo); return; }
      aiBusy(true, todo.length);
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
      try { job = App.bigJob('İlkin tərcümə — ' + p.name, { score: score, text: txt, seal: 'Qaralama hazırdır' }); } catch (e) { job = null; }
      Promise.resolve(job).then(function () {
        if (S.dead) return;
        aiBusy(false);
        busyTx.textContent = 'Seqmentlər doldurulur…';
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
        updateAll(); flushSave(); aiDone();
        toast('Qaralama hazırdır', 'ok', { sub: todo.length + ' seqment dolduruldu' + (flagged ? ' · ' + flagged + ' seqmentə baxın' : ' · riskli yer yoxdur'),
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
      aiBusy(true, todo.length);
      todo.forEach(function (r) { setBusy(r, true); });
      nz('write', 'Boş seqmentləri tərcümə edirəm…', 2400);
      var chunks = [], curC = [], size = 0;
      todo.forEach(function (r) {
        var len = String(r.d.s).length;
        if (curC.length && (curC.length >= 20 || size + len > 6000)) { chunks.push(curC); curC = []; size = 0; }
        curC.push(r); size += len;
      });
      if (curC.length) chunks.push(curC);
      var tterms = gl.map(function (g) { return { a: g.a, b: g.b }; });
      var to = String(p.pair || '').split('-')[1] || 'az';
      var got = [], failed = false, seq = Promise.resolve();
      function same(a, b) { return lower(a).replace(/\s+/g, ' ').trim() === lower(b).replace(/\s+/g, ' ').trim(); }
      chunks.forEach(function (ch) {
        seq = seq.then(function () {
          if (failed || S.dead) return null;
          var text = ch.map(function (r) { return String(r.d.s).replace(/\s*\n+\s*/g, ' ').trim(); }).join('\n');
          return App.fakeAI('translate', { text: text, register: regNow, from: set.src, to: to, pair: set.src + '-' + to, terms: tterms }).then(function (res) {
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
          aiBusy(false); aiDone(); updateAll();
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
          (tterms.length ? ' Layihə lüğəti (' + tterms.length + ' termin) mühərrikə verildi.' : '') + ' Üslub: ' + REG[regNow] + '.' +
          (turk ? ' Dilçi Nənə ' + turk + ' türk formasını qeyd etdi — redaktorda göstərilir.' : '') +
          (left ? ' ' + left + ' seqment boş qaldı — «İlkin tərcümə»ni yenidən işə salın.' : '');
        var job;
        try { job = App.bigJob('İlkin tərcümə — ' + p.name, { score: score, text: txt, seal: left ? 'Qismən hazırdır' : 'Qaralama hazırdır' }); } catch (e) { job = null; }
        Promise.resolve(job).then(null, function () { return null; }).then(function () {
          if (S.dead) return;
          aiBusy(false);
          busyTx.textContent = 'Seqmentlər doldurulur…';
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
          updateAll(); flushSave(); aiDone();
          toast('Qaralama hazırdır', left ? 'warn' : 'ok', { sub: got.length + ' seqment dolduruldu' + (left ? ' · ' + left + ' seqment boş qaldı' : '') + (flagged ? ' · ' + flagged + ' seqmentə baxın' : ''),
            action: flagged ? { label: 'Riskliləri göstər', onClick: function () { if (!S.dead) setFilter('risk'); } } : null });
          var first = rows.filter(function (r) { return !r.st.ok; })[0];
          if (first) S.later(function () { focusRow(first, true); }, 300);
        }
      }, function (e) {
        if (S.dead) return;
        try { console.error('[Nuanza] AI ilkin tərcümə', e); } catch (x) { /* ignore */ }
        release(todo); aiBusy(false); aiDone(); updateAll();
        toast('İlkin tərcümə tamamlanmadı', 'warn', { sub: 'Bağlantını yoxlayın və yenidən cəhd edin' });
      });
    }

    /* --- build rows + initial paint --- */
    set.segs.forEach(function (d, i) {
      var r = buildRow(d, i); rows.push(r); listEl.appendChild(r.row); navList.appendChild(r.navLi);
      if (d.q) { r.ask = buildAsk(r); r.row.appendChild(r.ask); }
    });
    applyLayout();
    setTab(UI.tab, true);
    refreshAll();
    allOkBefore = rows.every(function (r) { return r.st.ok; });
    function fitAll() { rows.forEach(function (r) { fit(r.ta); }); }
    if (W.requestAnimationFrame) W.requestAnimationFrame(fitAll); else fitAll();
    S.later(fitAll, 450);
    try { if (D.fonts && D.fonts.ready) D.fonts.ready.then(function () { if (!S.dead) fitAll(); }); } catch (e) { /* ignore */ }
    var rz = 0;
    S.on(W, 'resize', function () { clearTimeout(rz); rz = S.later(function () { applyLayout(); fitAll(); }, 120); });
    if (W.ResizeObserver) {
      var lastW = 0, ro = new W.ResizeObserver(function () { var w = Math.round(page.getBoundingClientRect().width); if (w && w !== lastW) { lastW = w; applyLayout(); } });
      ro.observe(page); S.finals.push(function () { try { ro.disconnect(); } catch (e) { /* ignore */ } });
    }
    var target = parseInt(params.seg, 10);
    if (target && rows[target - 1]) S.later(function () { focusRow(rows[target - 1], true); }, 360);
    else {
      setActive(rows.filter(function (r) { return !r.st.ok; })[0] || rows[0]);
      if (!greeted[p.id]) {
        greeted[p.id] = 1;
        S.later(function () {
          var c = { empty: 0, risk: 0 }; rows.forEach(function (r) { if (!String(r.st.t).trim()) c.empty++; if (isRisk(r)) c.risk++; });
          if (c.empty === rows.length) nz('point', 'Sənəd hazırdır. «İlkin tərcümə» ilə başlaya bilərsiniz.', 3200);
          else if (c.risk || c.empty) nz('read', set.title.split(' · ')[0] + ': ' + (c.empty ? c.empty + ' boş, ' : '') + c.risk + ' riskli seqment. Qeydlərdən başlayaq?', 3400);
          else nz('success', 'Bu bölmə qaydasındadır. Yoxlamaya baxa bilərsiniz.', 2600);
        }, 900);
      }
    }
  }

  /* ------------------------------------------------------------------
     9. SCREEN: QA — reviewer interface
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
    var M = null, sevF = 'all', typeF = null, built = false;
    var aiIss = []; /* live engine issues (ai/qa.js); kept while their fragment is still in the segment */
    var page = h('div', { class: 'page qa' });
    el.appendChild(page);

    var deepBtn = h('button', { class: 'btn btn-secondary btn-sm', type: 'button', title: 'Mirzə Məclisinin dərin yoxlaması və möhürü' }, ie('stamp'), 'Dərin yoxlama');
    var againBtn = h('button', { class: 'btn btn-secondary btn-sm', type: 'button' }, ie('refresh'), 'Yenidən yoxla');
    var subP = h('p', { text: p.name + ' — ' + num(p.segs) + ' seqment yoxlanılır…' });
    page.appendChild(h('div', { class: 'qa-crumbs' },
      h('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: function () { App.go('editor', { project: p.id }); } }, ie('back'), 'Redaktor'),
      h('span', { class: 'qa-crumb', text: p.client + ' · ' + pairLabel(p.pair) }), kindTag(p)));
    page.appendChild(h('div', { class: 'page-h' },
      h('div', null, h('h1', { text: 'Keyfiyyət yoxlaması' }), subP),
      h('div', { class: 'actions' }, againBtn, deepBtn)));
    var host = h('div', { class: 'stack-lg' });
    page.appendChild(host);

    function sk(w, hgt) { return h('span', { class: 'pj-sk', style: 'width:' + (w || '100%') + (hgt ? ';height:' + hgt : '') }); }
    function skeleton() {
      host.textContent = '';
      host.appendChild(h('div', { class: 'qa-loading', 'aria-busy': 'true', 'aria-label': 'Yoxlanılır' },
        h('div', { class: 'qa-sum' },
          h('div', { class: 'pj-sk-stack' }, sk('40%'), sk('72px', '28px'), sk('60%')),
          h('div', { class: 'pj-sk-stack' }, sk('40%'), sk('80%', '20px'), sk('90%')),
          h('div', { class: 'pj-sk-stack' }, sk('30%'), sk('100%'), sk('100%'), sk('70%'))),
        h('div', { class: 'qa-table' }, h('div', { class: 'qa-tr qa-th' }, sk('60%'), sk('50%'), sk('50%'), sk('40%'), sk('50%'), sk('60%'), sk('40%')),
          [0, 1, 2, 3, 4].map(function () { return h('div', { class: 'qa-tr qa-skrow' }, sk('32px', '20px'), sk('80%'), sk('70%'), sk('95%'), sk('60%'), sk('80%'), sk('60px', '24px')); }))));
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
          iss.n = i + 1; iss.key = issKey(iss.n, iss); iss.ign = !!ignored[iss.key]; iss.elder = ELDER[iss.type] || iss.elder || 'Yoxlama';
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
        var note = !live ? '' : !r || r.ok === false ? 'Dərin yoxlama tamamlanmadı — yalnız yerli yoxlamalar (rəqəm, termin, türk forması, durğu) göstərilir. Bağlantını yoxlayın və «Yenidən yoxla»ya basın.'
          : r.checked != null && r.segments != null && r.checked < r.segments ? (r.segments - r.checked) + ' seqment dərin yoxlamadan keçmədi — «Yenidən yoxla»ya basın.' : '';
        if (note) host.insertBefore(h('div', { class: 'callout', role: 'note' }, ie('alert'), h('div', { text: note })), host.firstChild);
        /* an untranslated project has nothing to score — keep it out of «orta QA balı» */
        if (segs.some(function (x) { return x && String(x.t || '').trim(); })) setMap('pj:qa', p.id, M.score);
        nz(M.score >= 85 ? 'success' : 'worried', M.score >= 85 ? M.score + ' bal — təhvilə az qalıb.' : M.score + ' bal. Kritik qeydlərdən başlayaq.', 2800);
      }, function () {
        if (S.dead) return;
        againBtn.removeAttribute('aria-busy');
        segs = loadSegs(p); M = model(); build();
        host.insertBefore(h('div', { class: 'callout', role: 'note' }, ie('alert'), h('div', { text: 'Yoxlama tamamlanmadı — bağlantını yoxlayın və yenidən cəhd edin. Aşağıda yerli yoxlamaların nəticəsi var.' })), host.firstChild);
      });
    }

    /* sections */
    var scoreN, gradeEl, sealEl, meter, sevEls = {}, sumNote, deepEl, catBox, secIssues, issHost, sevBtns = {}, typeSel, fixAllBtn, secTurk, secTerms, secReqs, secDeliv, delivRows = {};
    var SEVS = [['high', 'Kritik'], ['mid', 'Əsas'], ['low', 'Kiçik']];
    function scrollToIssues() { try { secIssues.scrollIntoView({ block: 'start', behavior: reduced() ? 'auto' : 'smooth' }); } catch (e) { /* ignore */ } }
    function build() {
      host.textContent = '';
      scoreN = h('b', { class: 'qa-score-n' }); gradeEl = h('span', { class: 'qa-grade' }); sealEl = h('span', { class: 'qa-seal' });
      meter = h('span', { class: 'pj-track qa-meter', role: 'img' }, h('i'));
      deepEl = h('div', { class: 'qa-deep', hidden: true });
      sumNote = h('p', { class: 'qa-sum-note' });
      catBox = h('div', { class: 'qa-cats' });
      host.appendChild(h('section', { class: 'qa-sum', 'aria-label': 'Ümumi nəticə' },
        h('div', null, h('span', { class: 'pj-cap', text: 'Keyfiyyət balı' }), h('div', { class: 'qa-score-line' }, scoreN, h('span', { class: 'qa-score-of pj-mono', text: '/100' }), gradeEl), meter, sealEl, deepEl),
        h('div', null, h('span', { class: 'pj-cap', text: 'Açıq qeydlər' }),
          h('div', { class: 'qa-sevs' }, SEVS.map(function (s) {
            var b = h('b'); sevEls[s[0]] = b;
            return h('button', { class: 'qa-sevs-i', type: 'button', title: s[1] + ' qeydləri göstər', onclick: function () { sevF = s[0]; typeF = null; drawIssues(); scrollToIssues(); } }, h('i', { class: 'qa-sdot ' + s[0], 'aria-hidden': 'true' }), b, h('span', { text: s[1] }));
          })), sumNote),
        h('div', null, h('span', { class: 'pj-cap', text: 'Kateqoriyalar' }), catBox)));

      issHost = h('div');
      var sevSeg = h('div', { class: 'seg sm', role: 'group', 'aria-label': 'Ciddilik' }, [['all', 'Hamısı']].concat(SEVS).map(function (t) {
        var c = h('span', { class: 'c' });
        var b = h('button', { type: 'button', 'aria-pressed': sevF === t[0] ? 'true' : 'false', onclick: function () { sevF = t[0]; drawIssues(); } }, t[1], c);
        sevBtns[t[0]] = { b: b, c: c }; return b;
      }));
      typeSel = h('select', { class: 'select', 'aria-label': 'Növ' });
      typeSel.addEventListener('change', function () { typeF = typeSel.value || null; drawIssues(); drawCats(); });
      fixAllBtn = h('button', { class: 'btn btn-primary btn-sm', type: 'button', onclick: fixAll }, ie('check'), h('span', { text: 'Hamısını düzəlt' }));
      secIssues = h('section', { class: 'qa-issues', id: 'qa-issues', 'aria-label': 'Qeydlər' },
        h('div', { class: 'qa-sec-h' }, h('div', null, h('h2', { text: 'Qeydlər' }), h('small', { text: 'Seqment nömrəsinə basın — redaktorda açılacaq.' }))),
        h('div', { class: 'qa-bar' }, sevSeg, typeSel, h('span', { class: 'sp' }), fixAllBtn),
        issHost);
      host.appendChild(secIssues);

      secReqs = h('section', { class: 'qa-sec' });
      secTerms = h('section', { class: 'qa-sec' });
      host.appendChild(h('div', { class: 'qa-grid' }, secReqs, secTerms));
      secTurk = h('section', { class: 'qa-sec' });
      secDeliv = h('section', { class: 'qa-sec' });
      host.appendChild(h('div', { class: 'qa-grid' }, secTurk, secDeliv));
      buildDeliv();
      built = true;
      drawAll();
    }
    function drawAll() {
      M = model();
      var tone = qaCls(M.score);
      scoreN.textContent = String(M.score);
      gradeEl.textContent = gradeOf(M.score);
      sealEl.textContent = sealOf(M.score); sealEl.className = 'qa-seal ' + tone;
      meter.className = 'pj-track qa-meter ' + tone; meter.firstChild.style.width = M.score + '%'; meter.setAttribute('aria-label', 'Bal: ' + M.score + ' / 100');
      if (segs.some(function (x) { return x && String(x.t || '').trim(); })) setMap('pj:qa', p.id, M.score);
      subP.textContent = p.name + ' — ' + num(p.segs) + ' seqment yoxlanıldı · ' + set.title.split(' · ')[0] + ' ətraflı · ' + hm(new Date());
      SEVS.forEach(function (s) { sevEls[s[0]].textContent = String(M.sev[s[0]]); });
      sumNote.textContent = M.sev.high ? M.sev.high + ' kritik qeyd təhvildən əvvəl bağlanmalıdır.' : M.act.length ? 'Kritik səhv yoxdur. Qalan qeydlər üslub və durğu ilə bağlıdır.' : 'Bütün yoxlamalar keçdi. Təhvil fayllarını hazırlaya bilərsiniz.';
      var deep = sget('pj:deep:' + p.id, null);
      deepEl.textContent = '';
      deepEl.hidden = !(deep && deep.score != null);
      if (!deepEl.hidden) put(deepEl, ie('stamp'), 'Məclis möhürü · ' + deep.score + ' bal' + (App.fmt ? ' · ' + App.fmt.rel(deep.at) : ''));
      drawCats(); drawIssues(); drawTurk(); drawTerms(); drawReqs(); drawDelivBadges();
    }
    function drawCats() {
      catBox.textContent = '';
      CATS.forEach(function (c) {
        var l = M.act.filter(function (x) { return c.types.indexOf(x.type) >= 0; });
        var worst = l.some(function (x) { return x.sev === 'high'; }) ? 'high' : l.some(function (x) { return x.sev === 'mid'; }) ? 'mid' : '';
        var b = h('button', { class: 'qa-cat', type: 'button', 'aria-pressed': typeF === c.key ? 'true' : 'false', title: l.length ? c.label + ': ' + l.length + ' qeyd — siyahıda göstər' : c.label + ': təmiz' },
          h('span', { text: c.label }),
          l.length ? h('span', { class: 'n ' + worst, text: String(l.length) }) : h('span', { class: 'ok', html: App.icon('check') }, 'Təmiz'));
        b.addEventListener('click', function () {
          if (!l.length) { toast(c.label + ': təmiz', 'ok', { sub: 'Bu kateqoriyada qeyd yoxdur', ms: 1800 }); return; }
          typeF = typeF === c.key ? null : c.key; sevF = 'all'; drawIssues(); drawCats();
          if (typeF) scrollToIssues();
        });
        catBox.appendChild(b);
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
        if (row && !reduced()) { row.classList.add('is-done'); S.later(go, 170); } else go();
        toast('Düzəldildi', 'ok', { sub: 'Seqment ' + pad3(iss.n) + ' · ' + (iss.was ? iss.was + ' → ' : '') + (iss.fix === 'fill' ? 'qaralama' : iss.now) + ' · ' + iss.elder, ms: 2600 });
      }
      return true;
    }
    function celebrateMaybe() {
      if (!M.act.length) nz('celebrate', 'Bir dənə də qeyd qalmadı! Təhvil faylları hazırlansın?', 3200);
      else if (!M.sev.high) nz('success', 'Kritik qeyd qalmadı — ' + M.score + ' bal.', 2200);
    }
    function fixAll() {
      var list = M.act.filter(function (x) { return x.fix === 'word' || x.fix === 'raw' || x.fix === 'fill'; });
      if (!list.length) { toast('Avtomatik düzəliş qalmayıb', 'info', { sub: M.act.length ? 'Qalan qeydlər sizin qərarınızı tələb edir' : 'Hamısı təmizdir' }); return; }
      var n = 0;
      list.forEach(function (x) { if (fixIssue(x, null, null, true)) n++; });
      drawAll();
      toast(n + ' düzəliş tətbiq edildi', 'ok', { sub: 'Yeni bal: ' + M.score + (M.act.length ? ' · ' + M.act.length + ' qeyd sizin qərarınızı gözləyir' : '') });
      celebrateMaybe();
    }
    function cell(cls, kid, label) { return h('div', { class: cls, role: 'cell' }, label ? h('span', { class: 'qa-mlab', text: label }) : null, kid); }
    function issueRow(x) {
      var d = set.segs[x.n - 1];
      var row = h('div', { class: 'qa-tr qa-row' + (x.ign ? ' is-ign' : ''), role: 'row' });
      var seg = h('button', { class: 'qa-segno', type: 'button', title: 'Redaktorda aç: ' + d.s, 'aria-label': 'Seqment ' + x.n + ' — redaktorda aç', onclick: function () { goSeg(x.n); } }, pad3(x.n));
      var frag = x.term || x.src || '';
      var srcK = frag ? h('span', { class: 'qa-frag', lang: set.src, text: frag }) : h('span', { class: 'qa-ctx', lang: set.src, title: d.s, text: d.s });
      var missing = !!x.src && x.was === x.src && !x.now; /* a source number that is absent from the target */
      var tgtK = x.was && !missing ? h('span', { class: 'qa-was', text: x.was }) : h('span', { class: 'qa-none', text: x.type === 'Boş seqment' || missing ? 'tərcümədə yoxdur' : '—' });
      var fixK = x.now ? h('span', { class: 'qa-now' + (x.now.length > 60 ? ' long' : ''), title: x.now.length > 60 ? x.now : null, text: x.now })
        : h('span', { class: 'qa-none', text: x.fix === 'ask' ? 'Cavabınız lazımdır' : '—' });
      var acts = h('div', { class: 'qa-act' });
      if (x.ign) acts.appendChild(h('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: function () { delete ignored[x.key]; sset('pj:qaign:' + p.id, ignored); drawAll(); } }, 'Qaytar'));
      else {
        if (x.fix === 'word' || x.fix === 'raw' || x.fix === 'fill') {
          var fb = h('button', { class: 'btn btn-secondary btn-sm', type: 'button', title: x.fix === 'fill' ? 'Boş seqmenti qaralama ilə doldur' : 'Düzəlişi tətbiq et' }, x.fix === 'fill' ? 'Doldur' : 'Düzəlt');
          fb.addEventListener('click', function () { fixIssue(x, row, fb); });
          acts.appendChild(fb);
        } else if (x.fix === 'ask') acts.appendChild(h('button', { class: 'btn btn-secondary btn-sm', type: 'button', onclick: function () { goSeg(x.n); } }, 'Cavabla'));
        else acts.appendChild(h('button', { class: 'btn btn-secondary btn-sm', type: 'button', onclick: function () { goSeg(x.n); } }, 'Redaktə'));
        acts.appendChild(h('button', { class: 'icon-btn ghost sm', type: 'button', title: 'Rədd et — qeyd qəbul edilir', 'aria-label': 'Qeydi rədd et', html: App.icon('x'), onclick: function () {
          ignored[x.key] = true; sset('pj:qaign:' + p.id, ignored);
          toast('Qeyd rədd edildi', 'info', { sub: 'Seqment ' + pad3(x.n) + ' · bal hesabından çıxarıldı', ms: 2200 }); drawAll();
        } }));
      }
      put(row,
        cell('qa-c-seg', seg),
        h('div', { class: 'qa-frags' }, cell('qa-c-src', srcK, 'Mənbə'), cell('qa-c-tgt', tgtK, 'Tərcümə'), cell('qa-c-fix', fixK, 'Düzəliş')),
        cell('qa-c-prob qa-prob', [h('b', null, h('i', { class: 'qa-sdot ' + x.sev, 'aria-hidden': 'true' }), x.type), h('span', { text: x.text })]),
        cell('qa-c-who qa-who', [monoAv(x.elder), h('span', { class: 'qa-who-n', text: x.elder })]),
        cell('qa-c-act', acts));
      row.querySelector('.qa-c-who').title = x.elder;
      return row;
    }
    function drawIssues() {
      var types = typeF ? catTypes(typeF) : null;
      var base = M.issues.filter(function (x) { return !types || types.indexOf(x.type) >= 0; });
      var cnt = { all: base.length, high: 0, mid: 0, low: 0 };
      base.forEach(function (x) { cnt[x.sev]++; });
      Object.keys(sevBtns).forEach(function (k) { sevBtns[k].b.setAttribute('aria-pressed', k === sevF ? 'true' : 'false'); sevBtns[k].c.textContent = String(cnt[k]); });
      typeSel.textContent = '';
      typeSel.appendChild(h('option', { value: '', text: 'Bütün növlər' }));
      CATS.forEach(function (c) {
        var n = M.issues.filter(function (x) { return c.types.indexOf(x.type) >= 0; }).length;
        if (n || typeF === c.key) typeSel.appendChild(h('option', { value: c.key, text: c.label + ' · ' + n }));
      });
      typeSel.value = typeF || '';
      var autoN = M.act.filter(function (x) { return x.fix === 'word' || x.fix === 'raw' || x.fix === 'fill'; }).length;
      fixAllBtn.disabled = !autoN;
      fixAllBtn.lastChild.textContent = autoN ? 'Hamısını düzəlt · ' + autoN : 'Hamısını düzəlt';
      issHost.textContent = '';
      var list = base.filter(function (x) { return sevF === 'all' || x.sev === sevF; });
      var tbl = h('div', { class: 'qa-table', role: 'table', 'aria-label': 'Qeydlər' },
        h('div', { class: 'qa-tr qa-th', role: 'row' }, ['Seq.', 'Mənbə', 'Tərcümə', 'Düzəliş', 'Problem', 'Yoxlayan', ''].map(function (t) { return h('span', { role: 'columnheader', text: t }); })));
      issHost.appendChild(tbl);
      if (!list.length) {
        tbl.appendChild(emptyBox(S, M.act.length || typeF || sevF !== 'all'
          ? { icon: 'filter', title: 'Bu filtrdə qeyd yoxdur', text: 'Başqa ciddilik və ya növ seçin.', actions: [h('button', { class: 'btn btn-secondary btn-sm', type: 'button', onclick: function () { sevF = 'all'; typeF = null; drawIssues(); drawCats(); } }, 'Filtri sıfırla')] }
          : { icon: 'check', title: 'Qeyd qalmadı', text: 'Bütün yoxlamalar keçdi. Möhür üçün Mirzə Məclisinin dərin yoxlamasını işə salın.', actions: [h('button', { class: 'btn btn-secondary btn-sm', type: 'button', onclick: deepQA }, ie('stamp'), 'Dərin yoxlama')] }));
        return;
      }
      SEVS.forEach(function (sv) {
        var g = list.filter(function (x) { return x.sev === sv[0]; }); if (!g.length) return;
        tbl.appendChild(h('div', { class: 'qa-grp', role: 'row' }, h('span', { role: 'cell', class: 'editor-row' }, h('i', { class: 'qa-sdot ' + sv[0], 'aria-hidden': 'true' }), h('span', { class: 'pj-cap', text: sv[1] }), h('span', { class: 'pj-mono', text: String(g.length) }))));
        g.forEach(function (x) { tbl.appendChild(issueRow(x)); });
      });
    }
    function drawTurk() {
      secTurk.textContent = '';
      var list = M.act.filter(function (x) { return x.type === 'Türk forması'; });
      var fixBtn = list.length ? h('button', { class: 'btn btn-secondary btn-sm', type: 'button' }, 'Hamısını düzəlt') : null;
      if (fixBtn) fixBtn.addEventListener('click', function () {
        list.forEach(function (x) { fixIssue(x, null, null, true); });
        drawAll();
        toast(list.length + ' türk forması düzəldildi', 'ok', { sub: 'Dilçi Nənə: mətn ədəbi normaya uyğundur' });
        nz('success', 'Dilçi Nənə razıdır!', 2000);
      });
      secTurk.appendChild(h('div', { class: 'qa-sec-h' }, h('div', { class: 'stack-sm' }, h('h2', { text: 'Türk formaları' }), h('span', { class: 'who' }, monoAv('Dilçi Nənə'), 'Dilçi Nənə')), fixBtn));
      if (!list.length) { secTurk.appendChild(h('div', { class: 'qa-clean' }, ie('check'), h('span', { text: 'Tapılmadı — mətn Azərbaycan ədəbi normasına uyğundur; «için», «değil», «tarafından» kimi formalar yoxdur.' }))); return; }
      list.forEach(function (x) {
        var fb = h('button', { class: 'btn btn-ghost btn-sm', type: 'button', 'aria-label': 'Düzəlt: ' + x.was + ' → ' + x.now }, 'Düzəlt');
        fb.addEventListener('click', function () { fixIssue(x, null, fb); });
        secTurk.appendChild(h('div', { class: 'qa-line' },
          h('button', { class: 'qa-segno', type: 'button', 'aria-label': 'Seqment ' + x.n + ' — redaktorda aç', onclick: function () { goSeg(x.n); } }, pad3(x.n)),
          h('span', { class: 'grow' }, h('s', { text: x.was }), ' → ', h('ins', { text: x.now })), fb));
      });
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
      secTerms.appendChild(h('div', { class: 'qa-sec-h' }, h('div', { class: 'stack-sm' }, h('h2', { text: 'Termin ardıcıllığı' }), h('span', { class: 'who' }, monoAv('Lüğətçi Mirzə'), 'Lüğətçi Mirzə')),
        badTotal ? h('span', { class: 'pj-tag', style: 'color:var(--danger)', text: badTotal + ' uyğunsuzluq' }) : h('span', { class: 'pj-tag', text: 'Ardıcıl' })));
      if (!rowsT.length) { secTerms.appendChild(h('p', { class: 'qa-sum-note', text: 'Bu bölmədə lüğət terminlərinə rast gəlinmədi.' })); return; }
      rowsT.slice(0, 7).forEach(function (x) {
        var end = h('div', { class: 'qa-term-end' });
        if (x.bad) {
          end.appendChild(h('button', { class: 'link small pj-mono', type: 'button', onclick: function () { goSeg(x.badSeg[0]); } }, x.badSeg.map(pad3).join(', ')));
          var eb = h('button', { class: 'btn btn-secondary btn-sm', type: 'button' }, 'Eyniləşdir');
          eb.addEventListener('click', function () {
            var n = 0;
            M.act.forEach(function (iss) { if (iss.type === 'Termin' && iss.term === x.g.a && fixIssue(iss, null, null, true)) n++; });
            drawAll();
            toast(n + ' seqment eyniləşdirildi', 'ok', { sub: '«' + x.g.a + '» → «' + x.g.b + '» · Lüğətçi Mirzə' });
          });
          end.appendChild(eb);
        } else end.appendChild(h('span', { class: 'pj-mono qa-score-of', text: x.ok + '/' + x.src }));
        secTerms.appendChild(h('div', { class: 'qa-term' },
          h('div', { class: 'qa-term-t' }, h('b', { lang: set.src, text: x.g.a }), h('span', { text: '→' }), x.g.b),
          end,
          h('div', { class: 'qa-term-bar', role: 'img', 'aria-label': x.ok + ' düzgün, ' + x.bad + ' uyğunsuz, cəmi ' + x.src }, h('i', { style: 'width:' + (x.ok / x.src * 100) + '%' }), h('i', { class: 'bad', style: 'width:' + (x.bad / x.src * 100) + '%' }))));
      });
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
          h('span', { class: 'k', text: auto ? 'avtomatik' : 'əl ilə' }));
        b.addEventListener('click', function () {
          if (auto) {
            if (ok) { toast('Avtomatik yoxlandı', 'ok', { sub: rq[0], ms: 2000 }); return; }
            sevF = 'all'; typeF = rq[1]; drawIssues(); drawCats(); scrollToIssues();
            return;
          }
          reqManual[i] = !reqManual[i]; sset('pj:req:' + p.id, reqManual); drawReqs();
        });
        return b;
      });
      secReqs.appendChild(h('div', { class: 'qa-sec-h' }, h('div', { class: 'stack-sm' }, h('h2', { text: 'Müştəri tələbləri' }), h('span', { class: 'who', text: 'Avtomatik bəndlər yoxlamaya görə işarələnir' })),
        h('span', { class: 'pj-mono qa-score-of', text: okN + ' / ' + reqs.length })));
      put(secReqs, list);
    }
    var DELIV = [
      { id: 'mono', ic: 'file', b: 'Word: yalnız tərcümə', s: 'DOCX · format qorunur', ext: 'AZ.docx' },
      { id: 'bi', ic: 'layers', b: 'Word: iki dilli', s: 'Cədvəl: mənbə | tərcümə', ext: upper(set.src) + '-AZ_ikidilli.docx' },
      { id: 'rep', ic: 'shield', b: 'Yoxlama hesabatı', s: 'PDF · Məclis möhürü ilə', ext: 'QA_hesabati.pdf' }
    ];
    function fnameOf(dv) { return slug(p.client) + '_' + slug(p.name) + '_' + dv.ext; }
    function buildDeliv() {
      secDeliv.textContent = '';
      secDeliv.appendChild(h('div', { class: 'qa-sec-h' }, h('div', { class: 'stack-sm' }, h('h2', { text: 'Təhvil faylları' }), h('span', { class: 'who', text: 'Format və tərcümə yaddaşı qorunur' }))));
      DELIV.forEach(function (dv) {
        var stEl = h('small');
        var mk = h('button', { class: 'btn btn-secondary btn-sm', type: 'button' }, 'Hazırla');
        var pv = h('button', { class: 'btn btn-ghost btn-sm', type: 'button', hidden: true }, 'Önizlə');
        var o = { btn: mk, st: stEl, pv: pv };
        delivRows[dv.id] = o;
        mk.addEventListener('click', function () { makeDeliv(dv, o); });
        pv.addEventListener('click', function () { preview(dv, fnameOf(dv)); });
        secDeliv.appendChild(h('div', { class: 'qa-dv' }, ie(dv.ic), h('div', { class: 'qa-dv-tx' }, h('b', { text: dv.b }), stEl), h('div', { class: 'qa-dv-act' }, pv, mk)));
      });
    }
    function drawDelivBadges() {
      var made = getMap('pj:deliv:' + p.id);
      DELIV.forEach(function (dv) {
        var o = delivRows[dv.id]; if (!o) return;
        o.st.textContent = '';
        if (made[dv.id]) { put(o.st, h('span', { class: 'st', text: 'Hazırdır' }), ' · ' + (App.fmt ? App.fmt.rel(made[dv.id]) : '') + ' · ', h('span', { class: 'pj-mono', text: fnameOf(dv) })); o.st.title = fnameOf(dv); }
        else o.st.textContent = dv.s;
        o.pv.hidden = !made[dv.id];
        o.btn.lastChild.textContent = made[dv.id] ? 'Yenilə' : 'Hazırla';
      });
    }
    function makeDeliv(dv, o) {
      if (o.btn.getAttribute('aria-busy') === 'true') return;
      o.btn.setAttribute('aria-busy', 'true');
      nz('write', 'Faylı hazırlayıram…', 1400);
      S.later(function () {
        o.btn.removeAttribute('aria-busy');
        var made = getMap('pj:deliv:' + p.id); made[dv.id] = Date.now(); sset('pj:deliv:' + p.id, made);
        drawDelivBadges();
        var fname = fnameOf(dv);
        var warn = M.sev.high ? ' · ' + M.sev.high + ' kritik qeyd açıqdır' : '';
        toast('Hazırdır', M.sev.high ? 'warn' : 'ok', { sub: fname + warn, icon: dv.ic, action: { label: 'Önizlə', onClick: function () { preview(dv, fname); } } });
        nz(M.sev.high ? 'worried' : 'success', M.sev.high ? 'Hazırdır, amma kritik qeydləri bağlamağı unutmayın.' : 'Təhvil faylı hazırdır.', 2400);
      }, 1100 + Math.round(Math.random() * 500));
    }
    function preview(dv, fname) {
      var body;
      if (dv.id === 'rep') {
        body = h('div', { class: 'qa-paper' }, h('h3', { text: 'KEYFİYYƏT YOXLAMASI HESABATI' }), h('p', { class: 'muted', style: 'text-align:center', text: p.client + ' — ' + p.name + ' · ' + (App.fmt ? App.fmt.date(new Date()) : '') }),
          h('dl', { class: 'kv' },
            h('dt', { text: 'Bal' }), h('dd', { class: 'pj-mono', text: M.score + ' / 100' }),
            h('dt', { text: 'Qiymət' }), h('dd', { text: gradeOf(M.score) }),
            h('dt', { text: 'Kritik / əsas / kiçik' }), h('dd', { class: 'pj-mono', text: M.sev.high + ' / ' + M.sev.mid + ' / ' + M.sev.low }),
            h('dt', { text: 'Möhür' }), h('dd', { text: sealOf(M.score) })),
          h('div', { class: 'divider' }),
          CATS.map(function (c) { var n = M.act.filter(function (x) { return c.types.indexOf(x.type) >= 0; }).length; return h('div', { class: 'row between small' }, h('span', { text: c.label }), h('b', { text: n ? n + ' qeyd' : 'təmiz' })); }));
      } else if (dv.id === 'bi') {
        body = h('div', { class: 'table-wrap' }, h('table', { class: 'table compact' },
          h('thead', null, h('tr', null, h('th', { text: '#' }), h('th', { text: upper(set.src) }), h('th', { text: 'AZ' }))),
          h('tbody', null, set.segs.slice(0, 6).map(function (d, i) { return h('tr', null, h('td', { class: 'muted pj-mono', text: pad3(i + 1) }), h('td', { text: d.s }), h('td', { text: segs[i].t || '—' })); }))));
      } else {
        body = h('div', { class: 'qa-paper' }, segs.slice(0, 7).map(function (st, i) { return h('p', { text: st.t || '[' + (i + 1) + ' — tərcümə edilməyib]', style: i === 0 ? 'text-align:center;font-weight:600' : null }); }),
          h('p', { class: 'muted', text: '… və daha ' + num(Math.max(0, p.segs - 7)) + ' seqment' }));
      }
      App.sheet({ title: fname, wide: true, body: h('div', { class: 'stack' }, h('div', { class: 'row' }, h('span', { class: 'pj-tag', text: 'Önizləmə' }), h('span', { class: 'pj-tag', text: dv.b })), body),
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
      var hi = M.sev.high, turk = cnt('Türk forması'), termsN = cnt('Termin'), numsN = cnt('Rəqəm');
      var text = (hi ? 'Məclis ' + hi + ' kritik qeyd tapdı' + (numsN ? ' (rəqəm uyğunsuzluğu daxil)' : '') + '. Təhvildən əvvəl bağlayın. ' : 'Məna mənbə ilə üst-üstə düşür, rəqəmlər və tarixlər möhürləndi. ') +
        (termsN ? 'Lüğətçi Mirzə ' + termsN + ' termin uyğunsuzluğu qeyd etdi. ' : 'Terminlər lüğətə uyğundur. ') +
        (turk ? 'Dilçi Nənə ' + turk + ' türk forması tapdı.' : 'Dilçi Nənə türk formasına rast gəlmədi.');
      var v = { score: M.score, text: text, seal: sealOf(M.score) };
      Promise.resolve(App.bigJob('Dərin yoxlama — ' + p.name, v)).then(function () {
        if (S.dead) return;
        deepBtn.removeAttribute('aria-busy');
        sset('pj:deep:' + p.id, { score: v.score, at: Date.now() });
        setMap('pj:qa', p.id, v.score);
        drawAll();
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
      try { return realProjects().filter(function (p) { return p.status !== 'delivered' && p.due && p.due.getTime() - Date.now() < 2 * DAY; }).length || null; } catch (e) { return null; }
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

  /* Public hook for other screens (home etc.).
     App.projects()            → the user's REAL projects (sample excluded), newest first:
                                 [{ id, name, client, pair, field, reg, words, segs, done (0-100), due (Date), qa (number|null), status ('active'|'delivered'), kind ('real'|'sim'), created }]
     App.projects.list()       → same as App.projects()
     App.projects.count()      → number of real projects
     App.projects.create()     → opens the «Yeni layihə» sheet
     App.projects.open(id)     → opens a project in the editor
     App.projects.openSample() → shows the «Nümunə» project and opens it in the editor
     App.projects.qaInput(id)  → QA-engine input for a project
     Raw storage: App.store key 'pj:created' (localStorage 'nuanza2:pj:created'), minus ids in 'pj:removed'. */
  var api = function () { return realProjects(); };
  api.list = realProjects;
  api.count = function () { try { return realProjects().length; } catch (e) { return 0; } };
  api.all = function () { return allProjects(); };
  api.open = function (id) { App.go('editor', { project: id }); };
  api.create = function () { newProjectSheet(null); };
  api.openSample = openSample;
  api.qaInput = function (id) { var p = id ? findProject(String(id)) : null; return p ? qaInput(p, loadSegs(p)) : null; };
  App.projects = api;
})();
