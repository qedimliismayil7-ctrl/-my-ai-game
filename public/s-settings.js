/* =====================================================================
   NUANZA — s-settings.js
   'settings' — Ayarlar (hər iki rejim).
     • Geniş ekranda: solda bölmə naviqasiyası, sağda bölmənin məzmunu.
     • Telefonda: bölmələr siyahısı → geri düyməli alt səhifə.
     • Bölmələr: Hesab · Görünüş · Dil · Tərcümə · AI · Məxfilik ·
       Klaviatura qısayolları · Məlumatlar · Haqqında.
     • Sətirlər: solda ad + izah, sağda idarəetmə; qruplar kiçik başlıqla.
     • Formlar qaralama kimi saxlanılır: «Yadda saxlanılmamış dəyişikliklər» paneli,
       Ctrl/⌘+S, doğrulama. Tema, şrift, sıxlıq və köməkçi dərhal tətbiq olunur.
   Store: profile (App.setProfile), prefs, ui, companion, tg-link, code.
   Plain browser JS. Screen CSS prefix: settings-.
   ===================================================================== */
(function () {
  'use strict';
  var W = window, D = document, R = D.documentElement;
  var App = W.App;
  if (!App || typeof App.register !== 'function') return;
  var h = App.h;

  /* ------------------------------------------------------------------
     1. HELPERS
     ------------------------------------------------------------------ */
  var IS_MAC = /Mac|iPhone|iPad|iPod/.test((navigator.platform || '') + ' ' + (navigator.userAgent || ''));
  var MOD = IS_MAC ? '⌘' : 'Ctrl';
  var MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avqust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'];
  var MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var seq = 0;

  function uid(p) { seq += 1; return (p || 'st') + '-' + seq; }
  function each(list, fn) { Array.prototype.forEach.call(list || [], fn); }
  function ie(name, cls) {
    if (typeof App.iconEl === 'function') return App.iconEl(name, cls);
    var t = D.createElement('template'); t.innerHTML = App.icon(name, cls); return t.content.firstChild;
  }
  function icTile(name, cls) { return h('span', { class: 'ic' + (cls ? ' ' + cls : ''), html: App.icon(name), 'aria-hidden': 'true' }); }
  function lower(s) { s = String(s == null ? '' : s); try { return s.toLocaleLowerCase('az'); } catch (e) { return s.toLowerCase(); } }
  function upper(s) { s = String(s == null ? '' : s); try { return s.toLocaleUpperCase('az'); } catch (e) { return s.toUpperCase(); } }
  function fold(s) { if (typeof App.fold === 'function') return App.fold(s); return lower(s); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function clone(v) { if (v === undefined || v === null || typeof v !== 'object') return v; try { return JSON.parse(JSON.stringify(v)); } catch (e) { return v; } }
  function same(a, b) { return JSON.stringify(a === undefined ? null : a) === JSON.stringify(b === undefined ? null : b); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function later(fn, ms) { return setTimeout(fn, ms || 0); }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function byId(id) { return D.getElementById(id); }
  function sget(k, fb) { try { var v = App.store.get(k, fb); return v === undefined || v === null ? fb : v; } catch (e) { return fb; } }
  function sset(k, v) { try { App.store.set(k, v); } catch (e) { /* storage blocked */ } }
  function num(n, dec) {
    if (App.fmt && typeof App.fmt.num === 'function') return App.fmt.num(n, dec);
    n = Number(n); if (!isFinite(n)) return '—';
    var s = dec != null ? n.toFixed(dec) : String(Math.round(n * 100) / 100), p = s.split('.');
    return p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + (p[1] ? ',' + p[1] : '');
  }
  function money(n) { n = Number(n); if (!isFinite(n)) return '—'; return num(n, 2) + '\u00a0AZN'; }
  function parseDec(s) {
    var t = String(s == null ? '' : s).replace(/[\s ]/g, '').replace(',', '.');
    if (!/^\d*\.?\d+$/.test(t)) return NaN;
    return parseFloat(t);
  }
  /* empty when not set (a new user has no rate) */
  function optDec(n) { var v = Number(n); return n === null || n === undefined || n === '' || !isFinite(v) ? '' : num(v); }
  function decStr(n, fb) { var v = Number(n); if (!isFinite(v) || n === null || n === '') v = fb; return num(v); }
  function dateAz(d) { return d.getDate() + '\u00a0' + MONTHS[d.getMonth()] + '\u00a0' + d.getFullYear(); }
  function fmtDate(v) { var d = v instanceof Date ? v : new Date(v); if (isNaN(d)) return '—'; return dateAz(d); }
  /* Azerbaijani ordinal suffix for numerals: 2026 → «2026-cı» */
  function ordSuffix(n) {
    n = Math.abs(Math.floor(Number(n) || 0));
    var ONE = { 1: 'ci', 2: 'ci', 3: 'cü', 4: 'cü', 5: 'ci', 6: 'cı', 7: 'ci', 8: 'ci', 9: 'cu' };
    var TEN = { 1: 'cu', 2: 'ci', 3: 'cu', 4: 'cı', 5: 'ci', 6: 'cı', 7: 'ci', 8: 'ci', 9: 'cı' };
    var d = n % 10, t = Math.floor(n / 10) % 10;
    if (d) return ONE[d];
    if (t) return TEN[t];
    if (Math.floor(n / 100) % 10) return 'cü';
    return 'ci';
  }
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
  function burstAt(el, kind) { try { if (App.fx && App.fx.burstAt && el && el.isConnected) App.fx.burstAt(el, kind || 'stars'); } catch (e) { /* ignore */ } }
  function isTyping(el) { if (!el || el === D.body) return false; var t = el.tagName; return t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT' || !!el.isContentEditable; }
  function overlayOpen() { return !!D.querySelector('.sheet.on, .dialog.on, .onb, .mc'); }
  function focusEl(el) { if (!el) return; try { el.focus({ preventScroll: true }); } catch (e) { try { el.focus(); } catch (e2) { /* ignore */ } } }
  function pairLabel(id) { return App.pairLabel ? App.pairLabel(id) : String(id || ''); }
  function pairsShort(arr) { return App.pairsShort ? App.pairsShort(arr) : (arr || []).map(pairLabel).join(', '); }
  function initials(name) { return App.initials ? App.initials(name) : upper(String(name || 'N').charAt(0)); }
  function busy(btn, on) { if (!btn) return; if (on) btn.setAttribute('aria-busy', 'true'); else btn.removeAttribute('aria-busy'); }

  /* ------------------------------------------------------------------
     2. REFERENCE DATA
     ------------------------------------------------------------------ */
  /* Nine sections, in this order. Groups only add spacing in the navigation. */
  var GROUPS = ['Profil', 'Tətbiq', 'İş', 'Sistem'];
  var SECTIONS = [
    { id: 'account', title: 'Hesab', icon: 'user', grp: 'Profil', kw: 'profil şəxsi ad e-poçt telefon rol iş profili dil cüt ixtisas tarif qiymət imza möhür faktura vöen bank iban bildiriş xatırlatma telegram bot e-poçt hesabat',
      desc: 'Şəxsi məlumatlar, iş profili, tariflər, rekvizitlər və bildirişlər.' },
    { id: 'appearance', title: 'Görünüş', icon: 'palette', grp: 'Tətbiq', kw: 'tema qaranlıq işıqlı sistem şrift kompakt sıxlıq animasiya hərəkət', live: true,
      desc: 'Tema, mətn ölçüsü, sıxlıq və animasiyalar.' },
    { id: 'language', title: 'Dil', icon: 'globe', grp: 'Tətbiq', kw: 'interfeys dil english русский müraciət sən siz tarix rəqəm format transliterasiya',
      desc: 'İnterfeys dili, müraciət forması, tarix, rəqəm və adların yazılışı.' },
    { id: 'translation', title: 'Tərcümə', icon: 'translate', grp: 'İş', kw: 'üslub register danışıq neytral rəsmi hüquqi termin lüğət türk forması yoxlama sual',
      desc: 'Əsas üslub, terminologiya və avtomatik yoxlamalar.' },
    { id: 'ai', title: 'AI', icon: 'sliders', grp: 'İş', kw: 'süni intellekt keyfiyyət sürətli dəqiq mirzə məclisi giriş kod açar köməkçi nuanza danışıq ölçü animasiya',
      desc: 'Keyfiyyət rejimi, sayt giriş kodu və köməkçi Nuanza.' },
    { id: 'privacy', title: 'Məxfilik', icon: 'lock', grp: 'Sistem', kw: 'məxfilik lokal bulud maska anonim saxlama müddət sil',
      desc: 'Məlumatın harada saxlandığı, maskalama və saxlama müddəti.' },
    { id: 'shortcuts', title: 'Klaviatura qısayolları', icon: 'keyboard', grp: 'Sistem', kw: 'qısayol klaviatura düymə ctrl alt',
      desc: 'Siçana əl atmadan, daha sürətli işləmək üçün.' },
    { id: 'data', title: 'Məlumatlar', icon: 'database', grp: 'Sistem', kw: 'ixrac json yüklə sil hamısını təhlükəli',
      desc: 'Məlumatların ixracı və bu cihazdan silinməsi.' },
    { id: 'about', title: 'Haqqında', icon: 'info', grp: 'Sistem', kw: 'versiya yenilik rəy şərtlər siyasət lisenziya giriş tanışlıq',
      desc: 'Versiya, yeniliklər, rəy və hüquqi sənədlər.' }
  ];
  var SEC = {}; SECTIONS.forEach(function (s) { SEC[s.id] = s; });
  /* earlier section ids still open the right place (links, saved drafts, history) */
  var SEC_ALIAS = { work: 'account', notifications: 'account', companion: 'ai' };
  function secId(id) { id = SEC_ALIAS[id] || id; return SEC[id] ? id : null; }

  /* searchable options: [section, data-opt key, label, keywords] */
  var OPTS = [
    ['account', 'first', 'Ad və soyad', 'ad soyad adı imza'],
    ['account', 'email', 'E-poçt ünvanı', 'email mail poçt'],
    ['account', 'phone', 'Telefon nömrəsi', 'nömrə mobil əlaqə'],
    ['account', 'role', 'Rol', 'freelance büro şirkətdaxili tələbə vəzifə'],
    ['account', 'pairs', 'Dil cütləri', 'ingilis rus türk en ru tr az dil'],
    ['account', 'specialties', 'İxtisas sahələri', 'hüquq maliyyə neft tibb sahə'],
    ['account', 'rates', 'Tariflər', 'qiymət söz səhifə azn manat notarial'],
    ['account', 'sign', 'İmza və möhür', 'imza möhür ştamp bəyan'],
    ['account', 'invoice', 'Hesab-faktura məlumatları', 'vöen ünvan bank iban faktura rekvizit'],
    ['account', 'nDeadline', 'Son tarix xatırlatması', 'deadline müddət xatırlat bildiriş'],
    ['account', 'telegram', 'Telegram botu qoş', 'bot bağla kod telegram'],
    ['account', 'nWeekly', 'Həftəlik e-poçt hesabatı', 'e-poçt hesabat həftəlik'],
    ['appearance', 'theme', 'Tema', 'işıqlı qaranlıq sistem rəng gecə'],
    ['appearance', 'fontScale', 'Şrift ölçüsü', 'şrift yazı böyüt kiçilt'],
    ['appearance', 'compact', 'Kompakt rejim', 'sıx kompakt sıxlıq'],
    ['appearance', 'motion', 'Animasiyalar', 'animasiya hərəkət azalt həmişə tam sistem sakit'],
    ['language', 'lang', 'İnterfeys dili', 'english русский dil azərbaycan'],
    ['language', 'address', 'Müraciət forması', 'sən siz you'],
    ['language', 'dateFmt', 'Tarix formatı', 'tarix gün ay il'],
    ['language', 'numFmt', 'Rəqəm formatı', 'rəqəm vergül nöqtə onluq kəsr'],
    ['language', 'translit', 'Adların transliterasiyası', 'ad soyad transliterasiya kiril latın'],
    ['translation', 'register', 'Əsas üslub', 'register danışıq neytral rəsmi hüquqi defolt'],
    ['translation', 'enforceTerms', 'Termin bazası məcburidir', 'lüğət glossary termin'],
    ['translation', 'turkic', 'Türk formalarını yoxla', 'türkcə türk forması dilçi nənə'],
    ['translation', 'clarify', 'Dəqiqləşdirici suallar', 'klarifikasiya sual soruş'],
    ['ai', 'quality', 'Keyfiyyət rejimi', 'sürətli dəqiq mirzə məclisi'],
    ['ai', 'code', 'Sayt giriş kodu', 'kod giriş açar parol şifrə access ai süni intellekt'],
    ['ai', 'cShow', 'Nuanzanı göstər', 'köməkçi gizlət göstər'],
    ['ai', 'cSize', 'Köməkçinin ölçüsü', 'kiçik böyük ölçü'],
    ['ai', 'cTalk', 'Danışma tezliyi', 'sakit normal çox danış'],
    ['ai', 'cMotion', 'Animasiya intensivliyi', 'hərəkət animasiya canlı'],
    ['privacy', 'local', 'Lokal rejim', 'lokal cihaz oflayn'],
    ['privacy', 'mask', 'Adları və rəqəmləri maskala', 'maska anonim gizlət ai'],
    ['privacy', 'retention', 'Avtomatik silmə müddəti', 'sil müddət saxlama'],
    ['shortcuts', 'keys', 'Qısayolların siyahısı', 'qısayol ctrl alt düymə'],
    ['data', 'export', 'Məlumatlarımı ixrac et', 'json ixrac yüklə'],
    ['data', 'wipe', 'Hər şeyi sil', 'sil hesab təhlükəli zona'],
    ['about', 'version', 'Versiya', 'versiya yenilik buraxılış'],
    ['about', 'feedback', 'Rəy göndər', 'rəy təklif xəta əlaqə'],
    ['about', 'intro', 'Girişi yenidən göstər', 'tanışlıq onboarding giriş'],
    ['about', 'legal', 'Məxfilik siyasəti və istifadə şərtləri', 'şərtlər siyasət lisenziya']
  ];
  var OPT_SEC = {}; OPTS.forEach(function (o) { if (!OPT_SEC[o[1]]) OPT_SEC[o[1]] = o[0]; });

  var ROLES = [
    { id: '', label: 'Seçilməyib', hint: '' },
    { id: 'Freelance tərcüməçi', label: 'Freelance tərcüməçi', hint: 'Layihələr, tariflər və hesab-faktura sizin üçün açıqdır.' },
    { id: 'Tərcümə bürosu', label: 'Büro — tərcümə bürosu', hint: 'Komanda ilə paylaşılan lüğət və yaddaş önə çıxır.' },
    { id: 'Şirkətdaxili tərcüməçi', label: 'Şirkətdaxili tərcüməçi', hint: 'Şirkət lüğəti və daxili üslub bələdçisi önə çıxır.' },
    { id: 'Tələbə', label: 'Tələbə', hint: 'Akademiya rejimi tövsiyə olunur: dərslər, XP və rütbələr.' }
  ];
  var LANG_NAMES = { az: 'Azərbaycan', en: 'İngilis', ru: 'Rus', tr: 'Türk', de: 'Alman', fr: 'Fransız' };
  var EXTRA_PAIRS = [
    { id: 'de-az', label: 'DE → AZ', name: 'Alman → Azərbaycan', beta: true },
    { id: 'fr-az', label: 'FR → AZ', name: 'Fransız → Azərbaycan', beta: true }
  ];
  function allPairs() {
    var base = (App.data && App.data.PAIRS) || App.PAIRS || [];
    return base.concat(EXTRA_PAIRS);
  }
  function pairName(id) {
    var p = String(id || '').split('-');
    return p.length === 2 ? (LANG_NAMES[p[0]] || upper(p[0])) + ' → ' + (LANG_NAMES[p[1]] || upper(p[1])) : String(id || '');
  }
  var SPECS = ['Hüquq', 'Maliyyə', 'Neft-qaz', 'Bank işi', 'Tibb və əczaçılıq', 'İT və lokalizasiya', 'Marketinq', 'Texniki sənədlər',
    'Diplomatiya', 'Sığorta', 'Təhsil', 'Turizm', 'Enerji', 'Ədəbi tərcümə'];
  var BANKS = ['Kapital Bank', 'PAŞA Bank', 'ABB', 'Bank Respublika', 'Xalq Bank', 'Unibank', 'Yelo Bank', 'AccessBank', 'Rabitəbank'];

  var REGS = [
    { id: 'auto', label: 'Avto' },
    { id: 'danisiq', label: 'Danışıq' },
    { id: 'neytral', label: 'Neytral' },
    { id: 'resmi', label: 'Rəsmi' },
    { id: 'huquqi', label: 'Hüquqi' }
  ];
  var REG_EX = {
    auto: 'Üslub hər mətndə ayrıca tanınır: müqavilədə «Hüquqi», işgüzar məktubda «Rəsmi», çatda «Danışıq».',
    danisiq: 'Sənədləri cüməyə qədər göndərərsən?',
    neytral: 'Sənədləri cümə gününə qədər göndərin.',
    resmi: 'Xahiş edirik, sənədləri cümə gününədək təqdim edəsiniz.',
    huquqi: 'Sənədlər cümə günündən gec olmayaraq təqdim edilməlidir.'
  };
  var REG_HINT = {
    auto: 'Hər mətndə üslub ayrıca müəyyən olunur; tərcümə ekranında istənilən vaxt dəyişə bilərsiniz.',
    danisiq: 'Dost, həmkar, sosial şəbəkə və mesajlaşma üçün.',
    neytral: 'İnterfeys, xəbər, təlimat və geniş auditoriya üçün.',
    resmi: 'İşgüzar məktub, hesabat və rəsmi müraciət üçün.',
    huquqi: 'Müqavilə, qanun, etibarnamə və notarial sənədlər üçün.'
  };
  var REG_SHORT = { auto: 'Avtomatik üslub', danisiq: 'Danışıq', neytral: 'Neytral', resmi: 'Rəsmi', huquqi: 'Hüquqi' };
  var QUALITY = [
    { id: 'fast', label: 'Sürətli', hint: 'Təxminən 1 saniyə, bir keçid. Qısa mesajlar və çat üçün.' },
    { id: 'exact', label: 'Dəqiq', hint: 'Lüğət, tərcümə yaddaşı və hər seqment üçün əminlik yoxlaması.' },
    { id: 'meclis', label: 'Mirzə Məclisi', hint: 'Tərcümədən sonra beş redaktor yoxlayır və tapılan səhvləri düzəldir.' }
  ];
  var Q_SHORT = { fast: 'Sürətli', exact: 'Dəqiq', meclis: 'Mirzə Məclisi' };
  var ADDRS = [
    { id: 'siz', label: 'Siz', ex: 'Parolunuzu istənilən vaxt dəyişə bilərsiniz.' },
    { id: 'sen', label: 'Sən', ex: 'Parolunu istənilən vaxt dəyişə bilərsən.' },
    { id: 'auto', label: 'Mətnə görə', ex: 'İnterfeysdə və rəsmi mətnlərdə «siz», dost yazışmasında «sən» seçilir.' }
  ];
  var DATE_FMTS = [
    { id: 'long', fn: function (d) { return dateAz(d); }, note: 'rəsmi sənədlər üçün tövsiyə olunur' },
    { id: 'longy', fn: function (d) { return dateAz(d) + '-' + ordSuffix(d.getFullYear()) + ' il'; }, note: 'hüquqi mətnlərdə ənənəvi forma' },
    { id: 'dots', fn: function (d) { return pad2(d.getDate()) + '.' + pad2(d.getMonth() + 1) + '.' + d.getFullYear(); }, note: 'cədvəl və arayışlar üçün' },
    { id: 'iso', fn: function (d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }, note: 'ISO 8601, texniki sənədlər' }
  ];
  var NUM_FMTS = [
    { id: 'az', label: '12 480,50 — Azərbaycan standartı', ex: '12 480,50 USD' },
    { id: 'src', label: '12,480.50 — mənbədəki kimi saxla', ex: '12,480.50 USD' },
    { id: 'plain', label: '12480,50 — boşluqsuz', ex: '12480,50 USD' }
  ];
  var TRANSLIT = [
    { id: 'az', label: 'Azərbaycan qaydası (pasport)', ex: 'Şerbakov Yuri Alekseyeviç' },
    { id: 'bgn', label: 'BGN/PCGN (beynəlxalq)', ex: 'Shcherbakov Yuriy Alekseyevich' },
    { id: 'iso9', label: 'ISO 9 (elmi)', ex: 'Ŝerbakov Ûrij Alekseevič' },
    { id: 'keep', label: 'Mənbədəki kimi saxla', ex: 'Щербаков Юрий Алексеевич' }
  ];
  var TURKIC = [['tarafından', 'tərəfindən'], ['için', 'üçün'], ['şirket', 'şirkət'], ['gerekiyor', 'lazımdır']];
  var LEADS = [{ id: '24', label: '1 gün əvvəl' }, { id: '3', label: '3 saat' }, { id: '1', label: '1 saat' }];
  var WEEK_DAYS = [{ id: 'mon', label: 'Bazar ertəsi, 09:00' }, { id: 'fri', label: 'Cümə, 17:00' }, { id: 'sun', label: 'Bazar, 19:00' }];
  var RETENTION = [
    { id: 'never', label: 'Heç vaxt silinməsin' },
    { id: '30', label: 'Tamamlandıqdan 30 gün sonra' },
    { id: '90', label: 'Tamamlandıqdan 90 gün sonra' },
    { id: '365', label: 'Tamamlandıqdan 1 il sonra' }
  ];
  var AV_COLORS = [
    { id: 'av-nar', name: 'Nar', note: 'isti' },
    { id: 'av-lacquer', name: 'Lacivərt', note: 'sakit' },
    { id: 'av-zafaran', name: 'Zəfəran', note: 'günəşli' },
    { id: 'av-firuze', name: 'Firuzə', note: 'təravətli' },
    { id: 'av-benovse', name: 'Bənövşə', note: 'zərif' },
    { id: 'av-zeytun', name: 'Zeytun', note: 'təmkinli' }
  ];
  /* light is the default theme */
  var THEMES = [
    { id: 'light', label: 'İşıqlı' },
    { id: 'dark', label: 'Qaranlıq' },
    { id: 'system', label: 'Sistem' }
  ];
  var LANGS_UI = [{ id: 'az', label: 'Azərbaycan' }, { id: 'en', label: 'English' }, { id: 'ru', label: 'Русский' }];
  var SHORTCUTS = [
    { grp: 'Ümumi', rows: [
      [[MOD, 'K'], 'Axtar və istənilən ekrana keç'],
      [['Alt', 'M'], 'Peşəkar ↔ Akademiya rejimi'],
      [['Alt', 'T'], 'İşıqlı ↔ qaranlıq tema'],
      [['?'], 'Qısayolların siyahısı'],
      [['Esc'], 'Pəncərəni, vərəqi və ya menyunu bağla']] },
    { grp: 'Tərcümə və redaktor', rows: [
      [[MOD, 'Enter'], 'Tərcümə et · seqmenti təsdiqlə'],
      [['Alt', '↓'], 'Növbəti seqment'],
      [['Alt', '↑'], 'Əvvəlki seqment']] },
    { grp: 'Ayarlar', rows: [
      [[MOD, 'S'], 'Dəyişiklikləri yadda saxla'],
      [['/'], 'Ayarlarda axtar']] }
  ];
  var FIELD_SEC = {
    first: 'account', last: 'account', email: 'account', phone: 'account', role: 'account',
    pairs: 'account', specialties: 'account', rate: 'account', ratePage: 'account', notarial: 'account', signName: 'account', voen: 'account', addr: 'account', bank: 'account', iban: 'account',
    nDeadline: 'account', nLead: 'account', nMeclis: 'account', nComments: 'account', nStreak: 'account', nWeekly: 'account', nWeeklyDay: 'account',
    address: 'language', dateFmt: 'language', numFmt: 'language', translit: 'language',
    register: 'translation', enforceTerms: 'translation', turkic: 'translation', clarify: 'translation',
    quality: 'ai',
    local: 'privacy', mask: 'privacy', retention: 'privacy'
  };
  var PREF_DEF = {
    register: 'auto', quality: 'exact', enforceTerms: true, address: 'siz', dateFmt: 'long', numFmt: 'az', translit: 'az', turkic: true, clarify: true,
    nDeadline: true, nLead: '24', nMeclis: true, nComments: true, nStreak: false, nWeekly: true, nWeeklyDay: 'mon',
    local: false, mask: true, retention: '90'
  };
  var PREF_KEYS = Object.keys(PREF_DEF);
  var TEXT_KEYS = ['first', 'last', 'email', 'phone', 'signName', 'voen', 'addr', 'bank', 'iban'];
  var COMPLETE = [
    ['first', 'Ad'], ['email', 'E-poçt'], ['pairs', 'Dil cütləri'], ['specialties', 'İxtisas'], ['rate', 'Tarif']
  ];
  var KEY_LABEL = {
    first: 'Ad', last: 'Soyad', email: 'E-poçt', phone: 'Telefon', role: 'Rol', pairs: 'Dil cütləri', specialties: 'İxtisas sahələri',
    rate: 'Söz tarifi', ratePage: 'Səhifə tarifi', signName: 'İmza adı', voen: 'VÖEN', addr: 'Ünvan', bank: 'Bank', iban: 'IBAN'
  };

  /* ------------------------------------------------------------------
     3. PERSISTED CONFIG (prefs, ui, companion, misc)
     ------------------------------------------------------------------ */
  function prefs() {
    var p = sget('prefs', {}), out = {};
    p = p && typeof p === 'object' ? p : {};
    PREF_KEYS.forEach(function (k) { out[k] = p[k] !== undefined ? p[k] : PREF_DEF[k]; });
    return out;
  }
  var UI_DEF = { fontScale: 100, compact: false, lang: 'az' };
  function uiCfg() {
    var u = sget('ui', {}), out = {};
    u = u && typeof u === 'object' ? u : {};
    for (var k in UI_DEF) out[k] = u[k] !== undefined ? u[k] : UI_DEF[k];
    out.fontScale = clamp(Number(out.fontScale) || 100, 85, 130);
    return out;
  }
  function setUi(patch) { var u = uiCfg(); for (var k in patch) u[k] = patch[k]; sset('ui', u); applyUI(u); return u; }
  function applyFont(pct) {
    pct = clamp(Number(pct) || 100, 85, 130);
    if (pct === 100) R.style.removeProperty('font-size'); else R.style.fontSize = pct + '%';
  }
  function applyUI(u) {
    u = u || uiCfg();
    applyFont(u.fontScale);
    if (u.compact) R.setAttribute('data-density', 'compact'); else R.removeAttribute('data-density');
  }
  function compCfg() {
    var c = {};
    try { c = App.companionConfig ? App.companionConfig() : (sget('companion', {}) || {}); } catch (e) { c = {}; }
    c = c || {};
    var out = { show: c.show !== false, size: c.size || 'dock', chatty: c.chatty !== false, motion: c.motion !== false, talk: c.talk, intensity: c.intensity };
    if (!out.talk) out.talk = out.chatty ? 'normal' : 'sakit';
    if (typeof out.intensity !== 'number') out.intensity = out.motion ? 50 : 0;
    return out;
  }
  function sizeKey(s) {
    s = String(s || '').toLowerCase();
    if (s === 'sm' || s === 'small' || s === 'mini' || s === 's') return 'sm';
    if (s === 'lg' || s === 'large' || s === 'l') return 'lg';
    return 'md';
  }
  function dockPx(s) { return { sm: 44, md: 52, lg: 64 }[sizeKey(s)]; }
  function setComp(patch) {
    try {
      if (typeof App.setCompanion === 'function') App.setCompanion(patch);
      else { var c = sget('companion', {}) || {}; for (var k in patch) c[k] = patch[k]; sset('companion', c); }
    } catch (e) { /* ignore */ }
    if (V) later(liftCalc, 60);
  }
  function tgLink() { var t = sget('tg-link', null); return t && typeof t === 'object' ? t : { linked: false }; }
  function setRate(root, rate) {
    if (!root || !root.getAnimations) return;
    try { each(root.getAnimations({ subtree: true }), function (a) { if (a.playbackRate !== rate) a.playbackRate = rate; }); } catch (e) { /* ignore */ }
  }

  /* global CSS: compact density (applies to every screen) */
  var GLOBAL_CSS = [
    ':where(:root[data-density="compact"]) .page{gap:12px;padding-block:12px 104px}',
    ':where(:root[data-density="compact"]) .card{padding:12px}',
    ':where(:root[data-density="compact"]) .card.pad-lg{padding:16px}',
    ':where(:root[data-density="compact"]) .card-h{margin-bottom:8px}',
    ':where(:root[data-density="compact"]) .list-row{min-height:40px;padding-block:4px}',
    ':where(:root[data-density="compact"]) .btn{min-height:28px}',
    ':where(:root[data-density="compact"]) .btn-sm{min-height:24px}',
    ':where(:root[data-density="compact"]) .btn-lg{min-height:32px}',
    ':where(:root[data-density="compact"]) .input,:where(:root[data-density="compact"]) .select{min-height:30px;padding-block:4px}',
    ':where(:root[data-density="compact"]) select.select:not([multiple]):not([size]){height:30px}',
    ':where(:root[data-density="compact"]) .grid-2,:where(:root[data-density="compact"]) .grid-3,:where(:root[data-density="compact"]) .tiles{gap:8px}',
    ':where(:root[data-density="compact"]) .stack{gap:8px}',
    ':where(:root[data-density="compact"]) .seg button{min-height:24px;padding-block:2px}',
    ':where(:root[data-density="compact"]) .table td{padding-block:6px}',
    ':where(:root[data-density="compact"]) .tile{padding:8px}',
    ':where(:root[data-density="compact"]) .settings-row{min-height:44px;padding-block:8px}'
  ].join('\n');
  try { App.css('settings-global', GLOBAL_CSS); } catch (e) { /* ignore */ }
  applyUI();

  /* ambient: animation intensity for the dock + «Çox» talk mode tips */
  var amb = { lastTip: Date.now() };
  setInterval(function () {
    try {
      var c = compCfg();
      if (!c.show) return;
      var host = D.querySelector('.companion');
      if (host && c.intensity > 0) { var rate = 0.5 + c.intensity / 100; if (Math.abs(rate - 1) > 0.01) setRate(host, rate); }
      if (c.talk === 'cox' && c.chatty && !D.hidden && !overlayOpen() && !isTyping(D.activeElement) && Date.now() - amb.lastTip > 150000) {
        amb.lastTip = Date.now();
        var T = App.data && App.data.TIPS ? App.data.TIPS : null;
        var list = T ? ((App.mode && App.mode() === 'academy' && T.academy && T.academy.length) ? T.academy : T.general) : null;
        if (list && list.length && App.companion) App.companion.set('point', { say: pick(list), ms: 4200 });
      }
    } catch (e) { /* ignore */ }
  }, 2500);

  /* ------------------------------------------------------------------
     4. SCREEN CSS — tokens only. Layout: navigation list (left on wide
     screens; list → detail on phones) and a content panel of grouped rows.
     ------------------------------------------------------------------ */
  var CSS = [
    '.settings-page{--settings-lift:0px;--settings-ease:cubic-bezier(.2,.8,.2,1)}',
    '.settings-head h1{font:600 var(--t-h1,1.375rem)/1.27 var(--f-display);letter-spacing:-.01em;color:var(--text,var(--ink))}',
    '.settings-head p{font-size:var(--t-small,.8125rem);color:var(--text-2,var(--soft))}',
    /* layout */
    '.settings-wrap{display:grid;gap:16px;min-width:0;align-items:start}',
    '.settings-side,.settings-main{min-width:0;display:grid;gap:16px;align-content:start}',
    '.settings-main{container-type:inline-size;container-name:stmain}',
    '.settings-page:not(.is-wide)[data-view="list"] .settings-main{display:none}',
    '.settings-page:not(.is-wide)[data-view="sub"] .settings-side,.settings-page:not(.is-wide)[data-view="sub"] > .page-h{display:none}',
    '.settings-page.is-wide .settings-wrap{grid-template-columns:216px minmax(0,1fr);gap:40px}',
    '.settings-page.is-wide .settings-main{max-width:760px}',
    '.settings-page.is-wide .settings-side{position:sticky;top:calc(var(--hdr-h,56px) + var(--band-h,0px) + 16px);max-height:calc(100dvh - var(--hdr-h,56px) - var(--band-h,0px) - 32px);overflow-y:auto;overscroll-behavior:contain;gap:12px;padding:2px;margin:-2px}',
    '.settings-page.is-wide .settings-back{display:none}',
    '.settings-page.is-wide .settings-savebar{grid-column:2;max-width:760px}',
    /* search */
    '.settings-search .input{min-height:32px;height:32px;padding-block:0;font-size:var(--t-body,.875rem);background-color:var(--panel,var(--surface))}',
    '.settings-search > svg{width:15px;height:15px}',
    /* navigation */
    '.settings-groups{display:grid;gap:16px}',
    '.settings-navgrp{display:flex;flex-direction:column;min-width:0}',
    '.settings-nav-row{position:relative;display:flex;align-items:center;gap:12px;width:100%;min-width:0;min-height:48px;padding:8px 16px;border:0;background:none;color:var(--text,var(--ink));font:inherit;text-align:left;cursor:pointer;transition:background-color 120ms ease,color 120ms ease}',
    '.settings-nav-ic{flex:none;display:grid;place-items:center;width:20px;height:20px;color:var(--text-2,var(--soft))}',
    '.settings-nav-ic svg{width:18px;height:18px}',
    '.settings-nav-row .tx{flex:1;min-width:0;display:grid;gap:1px}',
    '.settings-nav-row .tx b{font-size:var(--t-body,.875rem);font-weight:500;line-height:20px}',
    '.settings-nav-row .tx small{font-size:var(--t-small,.8125rem);line-height:18px;color:var(--text-2,var(--soft));overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.settings-nav-row .end{flex:none;display:flex;align-items:center;gap:8px;color:var(--text-3,var(--faint))}',
    '.settings-nav-row .end svg{width:16px;height:16px}',
    '.settings-dot{width:6px;height:6px;flex:none;border-radius:50%;background:var(--accent,var(--firuze))}',
    /* phones: grouped list boxes */
    '.settings-page:not(.is-wide) .settings-navgrp{background:var(--panel,var(--surface));border:1px solid var(--border,var(--line));border-radius:8px;overflow:hidden}',
    '.settings-page:not(.is-wide) .settings-nav-row + .settings-nav-row{border-top:1px solid var(--border,var(--line))}',
    '@media (hover:hover){.settings-page:not(.is-wide) .settings-nav-row:hover{background:var(--hover)}}',
    '.settings-page:not(.is-wide) .settings-nav-row:active{background:var(--hover)}',
    '.settings-page:not(.is-wide) .settings-nav-row[data-sec="account"]{min-height:64px}',
    '.settings-page:not(.is-wide) .settings-nav-row[data-sec="account"] .settings-av{width:40px;height:40px}',
    '.settings-page:not(.is-wide) .settings-nav-row[data-sec="account"] .settings-av b{font-size:.875rem}',
    /* wide: a quiet sidebar list */
    '.settings-page.is-wide .settings-groups{gap:12px}',
    '.settings-page.is-wide .settings-navgrp{gap:1px}',
    '.settings-page.is-wide .settings-nav-row{min-height:32px;padding:6px 10px;gap:10px;border-radius:6px;color:var(--text-2,var(--soft))}',
    '.settings-page.is-wide .settings-nav-ic{width:16px;height:16px;color:var(--text-3,var(--faint))}',
    '.settings-page.is-wide .settings-nav-ic svg{width:16px;height:16px}',
    '.settings-page.is-wide .settings-nav-row .tx small,.settings-page.is-wide .settings-nav-row .chev{display:none}',
    '@media (hover:hover){.settings-page.is-wide .settings-nav-row:hover{background:var(--hover);color:var(--text,var(--ink))}}',
    '.settings-page.is-wide .settings-nav-row[aria-current="page"]{background:var(--selected,var(--sel));color:var(--text,var(--ink))}',
    '.settings-page.is-wide .settings-nav-row[aria-current="page"] .tx b{font-weight:600}',
    '.settings-page.is-wide .settings-nav-row[aria-current="page"] .settings-nav-ic{color:var(--accent,var(--firuze))}',
    '.settings-page.is-wide .settings-nav-row .settings-av{width:20px;height:20px}',
    '.settings-page.is-wide .settings-nav-row .settings-av b{font-size:.5625rem}',
    '.settings-nav-row:focus-visible{outline:2px solid var(--focus);outline-offset:-2px}',
    /* search results */
    '.settings-results{display:grid;gap:8px}',
    '.settings-results .settings-navgrp{background:var(--panel,var(--surface));border:1px solid var(--border,var(--line));border-radius:8px;overflow:hidden}',
    '.settings-results .settings-nav-row{min-height:44px;padding:8px 12px;border-radius:0;color:var(--text,var(--ink))}',
    '.settings-results .settings-nav-row + .settings-nav-row{border-top:1px solid var(--border,var(--line))}',
    '.settings-page.is-wide .settings-results .settings-nav-row .tx small{display:block}',
    '@media (hover:hover){.settings-results .settings-nav-row:hover{background:var(--hover)}}',
    '.settings-mk{background:var(--accent-t,var(--fir-t));color:inherit;border-radius:2px;padding:0 1px}',
    '.settings-noresult{padding:16px;font-size:var(--t-small,.8125rem);color:var(--text-2,var(--soft))}',
    '.settings-noresult b{display:block;color:var(--text,var(--ink));font-weight:600;margin-bottom:2px}',
    /* section header */
    '.settings-subh{display:grid;gap:4px}',
    '.settings-back{justify-self:start;margin:0 0 8px -8px}',
    '.settings-subh h2{font:600 var(--t-h1,1.375rem)/1.27 var(--f-display);letter-spacing:-.01em;outline:none}',
    '.settings-subh p{font-size:var(--t-small,.8125rem);line-height:18px;color:var(--text-2,var(--soft));max-width:62ch}',
    '.settings-sec{display:grid;gap:24px;min-width:0}',
    '.settings-sec.in,.settings-sec.in-r{animation:settings-in 160ms var(--settings-ease) both}',
    '.settings-side.in-l{animation:settings-in 160ms var(--settings-ease) both}',
    /* groups + rows */
    '.settings-grp{display:grid;gap:8px;min-width:0;border-radius:8px}',
    '.settings-cap{display:flex;align-items:baseline;justify-content:space-between;gap:12px;padding:0 4px;min-width:0}',
    '.settings-cap h3{font:600 var(--t-caption,.75rem)/16px var(--f-body);letter-spacing:.04em;text-transform:uppercase;color:var(--text-2,var(--soft))}',
    '.settings-cap .link,.settings-cap small{font-size:var(--t-small,.8125rem);font-weight:500}',
    '.settings-cap small{color:var(--text-3,var(--faint));font-weight:400}',
    '.settings-box{min-width:0;background:var(--panel,var(--surface));border:1px solid var(--border,var(--line));border-radius:8px}',
    '.settings-box > * + *{border-top:1px solid var(--border,var(--line))}',
    '.settings-box > .settings-row:first-child{border-top-left-radius:8px;border-top-right-radius:8px}',
    '.settings-box > .settings-row:last-child{border-bottom-left-radius:8px;border-bottom-right-radius:8px}',
    '.settings-foot{padding:0 4px;font-size:var(--t-caption,.75rem);line-height:16px;color:var(--text-2,var(--soft));max-width:70ch}',
    '.settings-row{display:flex;flex-wrap:wrap;align-items:center;gap:8px 24px;min-width:0;min-height:52px;padding:12px 16px}',
    '.settings-row > .tx{flex:1 1 240px;min-width:0;display:grid;gap:2px}',
    '.settings-row > .tx > b{font-size:var(--t-body,.875rem);font-weight:500;line-height:20px;color:var(--text,var(--ink))}',
    '.settings-row > .tx > small{font-size:var(--t-small,.8125rem);line-height:18px;color:var(--text-2,var(--soft));max-width:62ch}',
    '.settings-row > .ctl{flex:0 1 auto;display:flex;align-items:center;justify-content:flex-end;flex-wrap:wrap;gap:8px;min-width:0;margin-left:auto}',
    '.settings-row.wide-ctl > .ctl{flex:1 1 100%;justify-content:flex-start;margin-left:0}',
    '.settings-row.is-block{display:grid;gap:8px}',
    '.settings-list > * + *{border-top:1px solid var(--border,var(--line))}',
    '.settings-radio{min-height:56px}',
    '.settings-radio-dot{display:block;width:16px;height:16px;border-radius:50%;box-shadow:inset 0 0 0 1.5px var(--border-2,var(--line-2));transition:box-shadow 120ms ease}',
    '.settings-radio[aria-checked="true"] .settings-radio-dot{box-shadow:inset 0 0 0 5px var(--accent,var(--firuze))}',
    '.settings-radio[aria-checked="true"] .tx > b{font-weight:600}',
    '.settings-radio:focus-visible{outline:2px solid var(--focus);outline-offset:-2px}',
    '.settings-row .select{width:auto;max-width:100%}',
    '.settings-row select.select:not([multiple]):not([size]){height:32px;min-height:32px;font-size:var(--t-body,.875rem)}',
    '.settings-row .ctl .seg{max-width:100%}',
    /* form rows: label column + control column */
    '.settings-row.is-field{display:grid;grid-template-columns:minmax(0,200px) minmax(0,1fr);align-items:start;gap:6px 24px}',
    '.settings-row.is-field > label,.settings-row.is-field > .label{padding-top:6px;font-size:var(--t-body,.875rem);font-weight:500;line-height:20px;color:var(--text,var(--ink))}',
    '.settings-row.is-field .opt{display:block;font-size:var(--t-caption,.75rem);font-weight:400;color:var(--text-3,var(--faint))}',
    '.settings-row.is-field > .fctl{display:grid;gap:4px;min-width:0}',
    '.settings-row .fctl .input{min-height:32px;height:32px;padding-block:0;font-size:var(--t-body,.875rem)}',
    '.settings-row .fctl > span:not(.hint):not(.err):not(.settings-affix){display:block;min-width:0}',
    '.settings-row .fctl > select.select{width:100%}',
    '.settings-row .hint{font-size:var(--t-caption,.75rem);line-height:16px;color:var(--text-2,var(--soft))}',
    '.settings-row .err{display:flex;align-items:center;gap:6px;font-size:var(--t-caption,.75rem);font-weight:500;color:var(--danger,var(--nar))}',
    '.settings-row .err svg{width:14px;height:14px}',
    '@container stmain (max-width:560px){.settings-row.is-field{grid-template-columns:minmax(0,1fr);gap:6px}.settings-row.is-field > label,.settings-row.is-field > .label{padding-top:0}}',
    /* switch rows: the whole row toggles */
    '.settings-sw{cursor:pointer}',
    '.settings-sw > .tx > .chips,.settings-sw > .tx > .seg,.settings-sw > .tx > .select{margin-top:8px;cursor:auto;justify-self:start}',
    '.settings-sw > .tx > select.select{height:32px;min-height:32px;padding-block:0;font-size:var(--t-small,.8125rem);max-width:260px}',
    '.settings-sw > .tx[aria-disabled="true"] .seg,.settings-sw > .tx[aria-disabled="true"] .select{opacity:.45;pointer-events:none}',
    '.settings-sw .chips .chip{min-height:24px;padding:0 8px;font-size:var(--t-caption,.75rem)}',
    '.settings-sw .chips .chip s{color:var(--text-3,var(--faint))}',
    /* quiet example line */
    '.settings-ex{display:flex;flex-wrap:wrap;align-items:baseline;gap:2px 8px;min-width:0;font-size:var(--t-small,.8125rem);line-height:18px;color:var(--text-2,var(--soft))}',
    '.settings-ex .k{flex:none;font-size:var(--t-caption,.75rem);font-weight:500;color:var(--text-3,var(--faint))}',
    '.settings-ex .src{color:var(--text-2,var(--soft));overflow-wrap:anywhere}',
    '.settings-ex .src::after{content:" →";color:var(--text-3,var(--faint))}',
    '.settings-ex .tgt{color:var(--text,var(--ink));overflow-wrap:anywhere}',
    '.settings-ex .tgt.swap{animation:settings-in 160ms var(--settings-ease)}',
    '.settings-ex.block{display:grid;gap:2px}',
    '.settings-ex.block .src::after{content:none}',
    '.settings-flash{animation:settings-flash 1.6s ease}',
    '.settings-row2{display:flex;flex-wrap:wrap;gap:8px;align-items:center}',
    /* avatar */
    '.settings-av{position:relative;flex:none;width:48px;height:48px;display:grid;place-items:center;padding:0;border:0;border-radius:50%;background:var(--av,var(--av-firuze));color:var(--on-av,#fff)}',
    '.settings-av b{display:grid;place-items:center;width:100%;height:100%;font:600 1rem/1 var(--f-body);letter-spacing:.02em;color:var(--on-av,#fff)}',
    '.settings-av b svg{display:block;width:50%;height:50%;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}',
    '.settings-av.big{width:72px;height:72px}',
    '.settings-av.big b{font-size:1.5rem}',
    '.settings-prof .tx b{font-size:var(--t-h3,.9375rem);font-weight:600}',
    '.settings-prof .settings-hero-empty{color:var(--text-2,var(--soft))}',
    '.settings-prof-meta{display:flex;flex-wrap:wrap;gap:4px 8px;margin-top:2px}',
    '.settings-complete{gap:8px 16px}',
    '.settings-complete .progress{flex:0 0 120px;height:4px}',
    '.settings-complete .tx small b{color:var(--text,var(--ink));font-weight:500}',
    '.settings-avsheet{display:grid;justify-items:center;gap:16px;text-align:center;padding-top:4px}',
    /* chips that list values (pairs, specialties) */
    '.settings-chip-main{border-color:var(--accent-line,var(--firuze));color:var(--text,var(--ink))}',
    '.settings-chip-main::after{content:"əsas";margin-left:2px;font-size:var(--t-micro,.6875rem);color:var(--text-3,var(--faint))}',
    '.settings-add{border-style:dashed;color:var(--text-2,var(--soft));background:transparent}',
    '.settings-chips-pick .chip{cursor:pointer}',
    /* inputs with a unit */
    '.settings-affix{position:relative;display:block;min-width:0}',
    '.settings-affix > .input{padding-right:96px}',
    '.settings-affix > span{position:absolute;right:12px;top:50%;transform:translateY(-50%);color:var(--text-2,var(--soft));font-size:var(--t-small,.8125rem);pointer-events:none;white-space:nowrap}',
    '.settings-calc{font-size:var(--t-small,.8125rem);color:var(--text-2,var(--soft));font-variant-numeric:tabular-nums}',
    '.settings-calc b{color:var(--text,var(--ink));font-weight:600}',
    /* signature + seal */
    '.settings-sign{display:flex;align-items:center;justify-content:space-between;gap:16px;min-width:0}',
    '.settings-sign .sg-l{min-width:0;display:grid;gap:2px}',
    '.settings-sign .sg-k{font-size:var(--t-caption,.75rem);color:var(--text-2,var(--soft))}',
    '.settings-sign .sg-name{font-size:var(--t-h2,1.0625rem);font-weight:500;color:var(--text,var(--ink));line-height:1.3;overflow-wrap:anywhere}',
    '.settings-sign .sg-line{display:block;height:1px;background:var(--border-2,var(--line-2));margin:4px 0 2px}',
    '.settings-sign .sg-meta{display:flex;flex-wrap:wrap;gap:2px 12px;font-size:var(--t-caption,.75rem);color:var(--text-2,var(--soft))}',
    '.settings-seal{width:64px;height:64px;flex:none;color:var(--accent,var(--firuze));transform:rotate(-10deg)}',
    '.settings-seal .s-o{fill:none;stroke:currentColor;stroke-width:2.5}',
    '.settings-seal .s-i{fill:none;stroke:currentColor;stroke-width:1;stroke-dasharray:2 2}',
    '.settings-seal .s-t{fill:currentColor;font-family:var(--f-body);font-size:9px;font-weight:600;letter-spacing:.04em}',
    '.settings-seal .s-star{fill:none;stroke:currentColor;stroke-width:1.4;stroke-linejoin:miter}',
    '.settings-seal .s-c{fill:currentColor}',
    '.settings-seal .s-c2{fill:none;stroke:currentColor;stroke-width:1}',
    /* theme picker — the one visual preview on this screen */
    '.settings-theme{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;padding:16px}',
    '.settings-tt{display:grid;gap:8px;min-width:0;padding:0;border:0;background:none;color:var(--text,var(--ink));text-align:left;font:inherit;cursor:pointer}',
    '.settings-tt-art{position:relative;display:block;aspect-ratio:16 / 10;border-radius:6px;overflow:hidden;box-shadow:0 0 0 1px var(--border-2,var(--line-2));transition:box-shadow 120ms ease}',
    '@media (hover:hover){.settings-tt:hover .settings-tt-art{box-shadow:0 0 0 1px var(--text-3,var(--faint))}}',
    '.settings-tt[aria-pressed="true"] .settings-tt-art{box-shadow:0 0 0 2px var(--accent,var(--firuze))}',
    '.settings-tt:focus-visible{outline:none}',
    '.settings-tt:focus-visible .settings-tt-art{box-shadow:0 0 0 2px var(--panel,var(--surface)),0 0 0 4px var(--focus)}',
    '.settings-tt > b{display:flex;align-items:center;gap:8px;font-size:var(--t-small,.8125rem);font-weight:500;min-width:0}',
    '.settings-tt .tt-ck{flex:none;width:14px;height:14px;border-radius:50%;box-shadow:inset 0 0 0 1.5px var(--border-2,var(--line-2));transition:box-shadow 120ms ease}',
    '.settings-tt[aria-pressed="true"] .tt-ck{box-shadow:inset 0 0 0 4px var(--accent,var(--firuze))}',
    /* mini previews keep their own fixed palette (the theme they show), independent of the current theme */
    '.settings-art{position:absolute;inset:0;background:var(--a-bg)}',
    '.settings-art.lt{--a-bg:#F7F5F0;--a-side:#EFEBE3;--a-card:#FFFFFF;--a-line:#E4E0D8;--a-h:#1D1F21;--a-t:#C9C4BA;--a-acc:#2F5A55}',
    '.settings-art.dk{--a-bg:#121416;--a-side:#16191C;--a-card:#1E2226;--a-line:#2A2F33;--a-h:#E8E6E1;--a-t:#454B50;--a-acc:#6FA59D}',
    '.settings-art.half{clip-path:polygon(100% 0,100% 100%,0 100%)}',
    '.settings-art i{position:absolute;display:block}',
    '.settings-art .a-side{left:0;top:0;bottom:0;width:24%;background:var(--a-side);box-shadow:1px 0 0 var(--a-line)}',
    '.settings-art .a-s1,.settings-art .a-s2,.settings-art .a-s3{left:5%;height:3px;border-radius:1px;background:var(--a-t)}',
    '.settings-art .a-s1{top:14%;width:12%;background:var(--a-h)}',
    '.settings-art .a-s2{top:26%;width:14%;background:var(--a-acc)}',
    '.settings-art .a-s3{top:36%;width:10%}',
    '.settings-art .a-top{left:24%;right:0;top:0;height:16%;box-shadow:0 1px 0 var(--a-line)}',
    '.settings-art .a-card{left:31%;right:7%;top:26%;bottom:12%;border-radius:3px;background:var(--a-card);box-shadow:0 0 0 1px var(--a-line)}',
    '.settings-art .a-l1,.settings-art .a-l2,.settings-art .a-l3{left:36%;height:3px;border-radius:1px;background:var(--a-t)}',
    '.settings-art .a-l1{top:34%;width:26%;height:4px;background:var(--a-h)}',
    '.settings-art .a-l2{top:46%;width:44%}',
    '.settings-art .a-l3{top:55%;width:32%}',
    '.settings-art .a-btn{left:36%;bottom:20%;width:14%;height:9%;border-radius:2px;background:var(--a-acc)}',
    /* range: native control in the accent colour */
    '.settings-range{display:block;width:100%;min-width:140px;height:20px;margin:0;accent-color:var(--accent,var(--firuze));cursor:pointer}',
    '.settings-rangewrap{display:flex;align-items:center;gap:12px;min-width:0;width:100%;max-width:360px}',
    '.settings-rangewrap > .grow{flex:1;min-width:0}',
    '.settings-rangewrap > span[aria-hidden]{flex:none;color:var(--text-3,var(--faint));line-height:1}',
    '.settings-rangewrap > span.a1{font-size:.75rem}',
    '.settings-rangewrap > span.a2{font-size:1.0625rem}',
    '.settings-rangeval{min-width:84px;text-align:right;font-size:var(--t-small,.8125rem);font-variant-numeric:tabular-nums;color:var(--text-2,var(--soft))}',
    /* telegram */
    '.settings-code{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:12px 16px;border-radius:6px;background:var(--sunken,var(--surface2))}',
    '.settings-code b{font:500 1.0625rem/1 var(--f-mono);letter-spacing:.1em;color:var(--text,var(--ink))}',
    '.settings-code small{display:block;margin-top:6px;color:var(--text-2,var(--soft));font-size:var(--t-caption,.75rem);font-variant-numeric:tabular-nums}',
    '.settings-steps{margin:0;padding-left:1.3em;display:grid;gap:4px;color:var(--text-2,var(--soft));font-size:var(--t-small,.8125rem)}',
    '.settings-steps b{color:var(--text,var(--ink));font-weight:600}',
    /* privacy */
    '.settings-tok{display:inline-block;padding:0 4px;border-radius:3px;background:var(--sunken,var(--surface2));box-shadow:inset 0 0 0 1px var(--border,var(--line));color:var(--text,var(--ink));font:500 .78em/1.6 var(--f-mono)}',
    '.settings-danger .settings-box{border-color:color-mix(in srgb,var(--danger,var(--nar)) 32%,var(--border,var(--line)))}',
    '.settings-danger .settings-cap h3{color:var(--danger,var(--nar))}',
    '.settings-wipe{display:grid;gap:10px;margin-top:6px;text-align:left}',
    '.settings-wipe .input{font-family:var(--f-mono);letter-spacing:.2em;text-transform:uppercase}',
    '.settings-wipe label{color:var(--text,var(--ink));font-size:var(--t-small,.8125rem);font-weight:600}',
    /* shortcuts */
    '.settings-keys{width:100%;border-collapse:collapse;font-size:var(--t-body,.875rem)}',
    '.settings-keys td{padding:10px 16px;border-top:1px solid var(--border,var(--line));vertical-align:middle;transition:background-color 120ms ease}',
    '.settings-keys tr:first-child td{border-top:0}',
    '.settings-keys td:last-child{text-align:right;white-space:nowrap}',
    '.settings-keys .kbd{min-width:22px;height:22px;transition:background-color 120ms ease,color 120ms ease,border-color 120ms ease}',
    '.settings-keys .kbd.on{background:var(--accent,var(--firuze));border-color:var(--accent,var(--firuze));color:var(--on-accent,var(--on-firuze))}',
    '.settings-keys tr.hit td{background:var(--selected,var(--fir-t))}',
    '.settings-keys .plus{margin:0 3px;color:var(--text-3,var(--faint));font-size:var(--t-caption,.75rem)}',
    /* about */
    '.settings-app{gap:12px 16px}',
    '.settings-app .logo{width:32px;height:32px;flex:none}',
    '.settings-app .tx b{font-size:var(--t-h3,.9375rem);font-weight:600}',
    '.settings-kv{display:grid;grid-template-columns:minmax(0,180px) minmax(0,1fr);gap:0 24px;align-items:baseline}',
    '.settings-kv dt{color:var(--text-2,var(--soft));font-size:var(--t-small,.8125rem)}',
    '.settings-kv dd{margin:0;font-size:var(--t-body,.875rem);overflow-wrap:anywhere}',
    '.settings-ver{flex:none;min-width:40px;font:500 var(--t-small,.8125rem)/20px var(--f-mono);color:var(--text,var(--ink))}',
    ':where(.settings-link-row){border:0}',
    '.settings-link-row{cursor:pointer;background:none;width:100%;text-align:left;font:inherit;color:inherit;transition:background-color 120ms ease}',
    '@media (hover:hover){.settings-link-row:hover{background:var(--hover)}}',
    '.settings-link-row .ctl svg{width:16px;height:16px;color:var(--text-3,var(--faint))}',
    '.settings-stars{display:flex;gap:2px}',
    '.settings-stars button{width:36px;height:36px;display:grid;place-items:center;padding:0;border:0;border-radius:6px;background:none;color:var(--border-2,var(--line-2));cursor:pointer;transition:color 120ms ease}',
    '.settings-stars{--settings-m-star5:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\'%3E%3Cpath d=\'M12 2.6l2.9 5.9 6.5.95-4.7 4.58 1.1 6.47L12 17.45 6.2 20.5l1.1-6.47L2.6 9.45l6.5-.95z\' stroke=\'black\' stroke-width=\'1.6\' stroke-linejoin=\'round\'/%3E%3C/svg%3E")}',
    '.settings-stars button span{width:22px;height:22px;background:currentColor;-webkit-mask:var(--settings-m-star5) center/contain no-repeat;mask:var(--settings-m-star5) center/contain no-repeat}',
    '.settings-stars button.on{color:var(--accent,var(--firuze))}',
    '.settings-stars button:focus-visible{outline:2px solid var(--focus);outline-offset:1px}',
    '.settings-inv{display:grid;gap:14px;font-size:var(--t-small,.8125rem)}',
    '.settings-inv .miss{color:var(--danger,var(--nar));font-weight:500}',
    '.settings-inv .tot{display:flex;justify-content:space-between;align-items:baseline;padding-top:12px;border-top:1px solid var(--border,var(--line))}',
    '.settings-inv .tot b{font-size:var(--t-h2,1.0625rem);font-variant-numeric:tabular-nums}',
    /* save bar */
    '.settings-savebar{position:sticky;bottom:calc(16px + var(--settings-lift) + env(safe-area-inset-bottom,0px));z-index:6;display:flex;align-items:center;gap:12px;min-width:0;padding:8px 8px 8px 16px;border:1px solid var(--border-2,var(--line-2));border-radius:8px;background:var(--panel,var(--surface));color:var(--text,var(--ink));box-shadow:var(--sh-2);opacity:0;visibility:hidden;transform:translateY(8px);transition:opacity 160ms ease,transform 160ms ease,visibility 0s linear 160ms}',
    '.settings-savebar.on{opacity:1;visibility:visible;transform:none;transition:opacity 160ms ease,transform 160ms ease,visibility 0s}',
    '.settings-savebar.shake{animation:settings-attn 1.2s ease}',
    '.settings-savebar .sb-ic{flex:none;width:8px;height:8px;border-radius:50%;background:var(--accent,var(--firuze))}',
    '.settings-savebar .sb-tx{flex:1;min-width:0;display:grid;line-height:1.3}',
    '.settings-savebar .sb-tx b{font-size:var(--t-small,.8125rem);font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.settings-savebar .sb-tx small{font-size:var(--t-caption,.75rem);color:var(--text-2,var(--soft));overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.settings-savebar .sb-act{flex:none;display:flex;gap:6px}',
    '.settings-savebar .btn-primary .kbd{background:transparent;border-color:color-mix(in srgb,var(--on-accent,#fff) 35%,transparent);color:var(--on-accent,#fff);height:18px;min-width:18px;font-size:.625rem;opacity:.85}',
    '@media (max-width:479px){.settings-savebar .kbd{display:none}}',
    /* keyframes */
    '@keyframes settings-in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}',
    '@keyframes settings-flash{0%,40%{background-color:var(--selected,var(--fir-t))}100%{background-color:transparent}}',
    '@keyframes settings-attn{0%,50%{border-color:var(--danger,var(--nar))}100%{border-color:var(--border-2,var(--line-2))}}',
    '@media (prefers-reduced-motion:reduce){.settings-sec.in,.settings-sec.in-r,.settings-side.in-l,.settings-ex .tgt.swap,.settings-flash{animation:none}}'
  ].join('\n');

  /* ------------------------------------------------------------------
     5. STATE — saved snapshot (S0), draft (Dr), view refs (V)
     ------------------------------------------------------------------ */
  var V = null, ST = null, Dr = null, S0 = null;
  var WATCH = {}, ERR = {};
  var selfWrite = false;
  var stash = null, stashAt = 0, restoreNext = null;

  function loadSaved() {
    var p = App.profile(), pr = prefs(), inv = p.invoice && typeof p.invoice === 'object' ? p.invoice : {};
    var parts = String(p.name || '').trim().split(/\s+/).filter(Boolean);
    var out = {
      first: parts[0] || '', last: parts.slice(1).join(' '),
      email: p.email || '', phone: p.phone || '', role: p.role || '',
      pairs: Array.isArray(p.pairs) ? p.pairs.slice() : ['en-az'],
      specialties: Array.isArray(p.specialties) ? p.specialties.slice() : [],
      rate: optDec(p.rate), ratePage: optDec(p.ratePage), notarial: !!p.notarial,
      signName: p.signName != null ? String(p.signName) : String(p.name || ''),
      voen: inv.voen != null ? String(inv.voen) : '',
      addr: inv.addr != null ? String(inv.addr) : '',
      bank: inv.bank != null ? String(inv.bank) : '',
      iban: inv.iban != null ? String(inv.iban) : ''
    };
    PREF_KEYS.forEach(function (k) { out[k] = pr[k]; });
    return out;
  }
  function saveProfile(patch) {
    selfWrite = true;
    try { App.setProfile(patch); } catch (e) { /* ignore */ } finally { selfWrite = false; }
  }
  function dirtyKeys() {
    if (!Dr || !S0) return [];
    return Object.keys(Dr).filter(function (k) { return !same(Dr[k], S0[k]); });
  }
  function secsOf(keys) {
    var out = [];
    keys.forEach(function (k) { var s = FIELD_SEC[k]; if (s && out.indexOf(s) < 0) out.push(s); });
    return out;
  }
  function watch(key, fn) { (WATCH[key] = WATCH[key] || []).push(fn); }
  function changed(key) {
    (WATCH[key] || []).forEach(function (fn) { try { fn(Dr[key]); } catch (e) { /* ignore */ } });
    updateDirty();
  }

  /* ------------------------------------------------------------------
     6. VALIDATION
     ------------------------------------------------------------------ */
  function validate() {
    var e = {}, d = Dr;
    var em = String(d.email || '').trim();
    if (em && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) e.email = 'E-poçt ünvanı düzgün deyil. Nümunə: ad@domen.az';
    var ph = String(d.phone || '').replace(/[\s()\-]/g, '');
    if (ph && !/^\+?\d{9,15}$/.test(ph)) e.phone = 'Nömrəni +994 50 123 45 67 formatında yazın.';
    if (String(d.rate == null ? '' : d.rate).trim()) { var r = parseDec(d.rate); if (!(r >= 0) || r > 50) e.rate = 'Məbləği rəqəmlə yazın, məsələn 0,06.'; }
    if (String(d.ratePage == null ? '' : d.ratePage).trim()) { var rp = parseDec(d.ratePage); if (!(rp >= 0) || rp > 1000) e.ratePage = 'Məbləği rəqəmlə yazın, məsələn 12.'; }
    var v = String(d.voen || '').replace(/\s+/g, '');
    if (v && !/^\d{10}$/.test(v)) e.voen = 'VÖEN 10 rəqəmdən ibarət olmalıdır.';
    var ib = String(d.iban || '').replace(/\s+/g, '').toUpperCase();
    if (ib && !/^AZ\d{2}[A-Z]{4}[A-Z0-9]{20}$/.test(ib)) e.iban = 'IBAN «AZ» ilə başlayır və 28 simvoldan ibarətdir.';
    if (!d.pairs || !d.pairs.length) e.pairs = 'Ən azı bir dil cütü seçin.';
    return e;
  }
  function setErr(key, msg) {
    var inp = byId('st-' + key);
    if (inp && /^(INPUT|SELECT|TEXTAREA)$/.test(inp.tagName)) inp.setAttribute('aria-invalid', 'true');
    var el = ERR[key];
    if (el) { el.textContent = ''; el.appendChild(ie('alert')); el.appendChild(D.createTextNode(msg)); el.hidden = false; }
  }
  function clearErr(key) {
    var inp = byId('st-' + key);
    if (inp) inp.removeAttribute('aria-invalid');
    var el = ERR[key];
    if (el && !el.hidden) { el.hidden = true; el.textContent = ''; }
  }
  function showErrors(errs) { Object.keys(errs).forEach(function (k) { setErr(k, errs[k]); }); }

  /* ------------------------------------------------------------------
     7. FORM BUILDERS (bound to the draft)
        group = caption + bordered box of rows (+ optional footnote)
        row   = label + description on the left, control on the right
     ------------------------------------------------------------------ */
  function isRow(el) { return !!(el && el.classList && (el.classList.contains('settings-row') || el.classList.contains('settings-raw'))); }
  function card(title, sub, kids, o) {
    o = o || {};
    var box = h('div', { class: 'settings-box' + (o.boxCls ? ' ' + o.boxCls : '') });
    [].concat(kids || []).forEach(function (k) {
      if (!k) return;
      box.appendChild(isRow(k) ? k : h('div', { class: 'settings-row is-block' }, k));
    });
    return h('section', { class: 'settings-grp' + (o.cls ? ' ' + o.cls : ''), 'data-opt': o.opt || null },
      title || o.actions ? h('div', { class: 'settings-cap' }, h('h3', { text: title || '' }), o.actions || null) : null,
      box,
      sub ? h('p', { class: 'settings-foot' }, sub) : null);
  }
  /* a plain row: label + description left, control right */
  function rowEl(title, sub, ctl, o) {
    o = o || {};
    return h('div', { class: 'settings-row' + (o.cls ? ' ' + o.cls : ''), 'data-opt': o.opt || null },
      h('div', { class: 'tx' }, h('b', { id: o.tid || null, text: title }), sub ? h('small', { id: o.did || null }, sub) : null, o.extra || null),
      ctl ? h('div', { class: 'ctl' }, ctl) : null);
  }
  function fieldBox(key, label, control, o) {
    o = o || {};
    var id = o.forId || ('st-' + key);
    var err = h('span', { class: 'err', id: 'st-' + key + '-err', role: 'alert', hidden: true });
    ERR[key] = err;
    var hint = o.hintEl || (o.hint ? h('span', { class: 'hint', id: 'st-' + key + '-hint' }, o.hint) : null);
    var inp = byIdIn(control, id);
    if (inp) inp.setAttribute('aria-describedby', (hint && hint.id ? hint.id + ' ' : '') + 'st-' + key + '-err');
    return h('div', { class: 'settings-row is-field' + (o.cls ? ' ' + o.cls : ''), 'data-opt': o.opt || key },
      h('label', { for: id }, label, o.optTx ? h('span', { class: 'opt', text: o.optTx }) : null),
      h('div', { class: 'fctl' }, control, hint, err));
  }
  function byIdIn(root, id) {
    if (!root) return null;
    if (root.id === id) return root;
    return root.querySelector ? root.querySelector('#' + id) : null;
  }
  function textIn(key, attrs) {
    var a = { class: 'input', id: 'st-' + key, type: 'text', value: Dr[key] == null ? '' : String(Dr[key]), autocomplete: 'off' };
    for (var k in attrs || {}) a[k] = attrs[k];
    var el = h('input', a);
    el.addEventListener('input', function () { Dr[key] = el.value; clearErr(key); changed(key); });
    el.addEventListener('blur', function () { var e = validate()[key]; if (e && String(el.value).trim()) setErr(key, e); });
    return el;
  }
  function affix(input, suffix) { return h('span', { class: 'settings-affix' }, input, h('span', { 'aria-hidden': 'true', text: suffix })); }
  /* icon arguments are kept for callers; rows show no icon tiles */
  function switchRow(key, title, sub, icon, icCls, o) {
    o = o || {};
    var id = 'st-' + key, tid = id + '-t';
    var cur = o.get ? o.get() : Dr[key];
    var inp = h('input', { type: 'checkbox', id: id, checked: !!cur, 'aria-labelledby': tid, 'aria-describedby': sub ? id + '-d' : null });
    inp.addEventListener('change', function () {
      if (o.set) o.set(inp.checked, inp);
      else { Dr[key] = inp.checked; changed(key); }
    });
    var tx = h('div', { class: 'tx' }, h('b', { id: tid, text: title }), sub ? h('small', { id: id + '-d' }, sub) : null, o.extra || null);
    var row = h('div', { class: 'settings-row settings-sw', 'data-opt': o.opt || key }, tx,
      h('div', { class: 'ctl' }, h('label', { class: 'switch' }, inp, h('span', { 'aria-hidden': 'true' }))));
    row.addEventListener('click', function (e) {
      if (e.target.closest('.switch') || e.target.closest('.seg, select, button, a, input')) return;
      inp.click();
    });
    row._input = inp; row._tx = tx;
    return row;
  }
  function segCtl(key, items, o) {
    o = o || {};
    var cur = o.get ? o.get() : Dr[key];
    var wrap = h('div', { class: 'seg' + (o.block ? ' block' : '') + (o.wrap ? ' wrap' : '') + (o.sm ? ' sm' : '') + (o.cls ? ' ' + o.cls : ''), role: 'group', 'aria-label': o.label || key, id: o.noId ? null : 'st-' + key });
    items.forEach(function (it) {
      var b = h('button', { type: 'button', 'aria-pressed': String(it.id === cur), 'data-v': it.id, class: it.detected ? 'detected' : null }, it.ic ? ie(it.ic) : null, it.label);
      b.addEventListener('click', function () {
        if (b.getAttribute('aria-pressed') === 'true') return;
        each(wrap.children, function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        if (o.set) o.set(it.id, b);
        else { Dr[key] = it.id; changed(key); }
      });
      wrap.appendChild(b);
    });
    return wrap;
  }
  function selectCtl(key, items, o) {
    o = o || {};
    var cur = o.get ? o.get() : Dr[key];
    var sel = h('select', { class: 'select' + (o.cls ? ' ' + o.cls : ''), id: o.id || 'st-' + key, 'aria-label': o.label || null },
      items.map(function (it) { return h('option', { value: it.id }, it.label); }));
    sel.value = cur;
    sel.addEventListener('change', function () {
      if (o.set) o.set(sel.value, sel);
      else { Dr[key] = sel.value; changed(key); }
    });
    return sel;
  }
  function rangeCtl(id, min, max, step, value, onInput, onChange, label) {
    var r = h('input', { type: 'range', class: 'settings-range', id: id, min: String(min), max: String(max), step: String(step), value: String(value), 'aria-label': label || null });
    function paint() { r.style.setProperty('--p', ((Number(r.value) - min) / (max - min) * 100) + '%'); }
    paint();
    r.addEventListener('input', function () { paint(); if (onInput) onInput(Number(r.value)); });
    r.addEventListener('change', function () { if (onChange) onChange(Number(r.value)); });
    r._paint = paint;
    return r;
  }
  /* quiet example line: «Nümunə  source → target» */
  function exBox(k, src, tgt) {
    var t = h('span', { class: 'tgt' }, tgt);
    var box = h('div', { class: 'settings-ex', 'aria-live': 'polite' }, h('span', { class: 'k', text: k }), src ? h('span', { class: 'src' }, src) : null, t);
    box.set = function (txt) { t.textContent = ''; t.appendChild(typeof txt === 'string' ? D.createTextNode(txt) : txt); t.classList.remove('swap'); void t.offsetWidth; t.classList.add('swap'); };
    return box;
  }

  /* ------------------------------------------------------------------
     8. PROFILE SUMMARY (top of «Hesab») + avatar colour sheet
     ------------------------------------------------------------------ */
  function avParts(text) {
    return [h('b', { 'aria-hidden': 'true', text: text })];
  }
  function avCls(c) { for (var i = 0; i < AV_COLORS.length; i++) if (AV_COLORS[i].id === c) return c; return 'av-firuze'; }
  function draftName() { return (String(Dr.first || '').trim() + ' ' + String(Dr.last || '').trim()).trim(); }
  function paintAv(el, name, cls) {
    if (!el) return;
    el.className = (el._base || 'settings-av') + ' ' + cls;
    var b = el.querySelector('b'); if (!b) return;
    if (name) b.textContent = initials(name); else b.innerHTML = App.icon('user');
  }

  function buildHero() {
    V.heroAv = h('span', { class: 'settings-av', 'aria-hidden': 'true' }, avParts(''));
    V.heroAv._base = 'settings-av';
    V.heroName = h('b');
    V.heroMeta = h('small');
    V.heroMail = h('small', { class: 'truncate' });
    V.heroBadges = h('span', { class: 'settings-prof-meta' });
    V.compBar = h('i');
    V.compTx = h('small');
    V.compBtn = h('button', { class: 'btn btn-sm btn-ghost', type: 'button', onclick: completeNext }, 'Tamamla');
    var prof = h('div', { class: 'settings-row settings-prof' },
      V.heroAv,
      h('div', { class: 'tx' }, V.heroName, V.heroMeta, V.heroMail, V.heroBadges),
      h('div', { class: 'ctl' }, h('button', { class: 'btn btn-sm btn-secondary', type: 'button', onclick: avatarSheet }, 'Rəngi dəyiş')));
    V.comp = h('div', { class: 'settings-row settings-complete' },
      h('div', { class: 'tx' }, h('b', { text: 'Profilin tamlığı' }), V.compTx),
      h('div', { class: 'ctl' },
        h('div', { class: 'progress thin', role: 'progressbar', 'aria-label': 'Profil tamlığı', 'aria-valuemin': '0', 'aria-valuemax': '100' }, V.compBar),
        V.compBtn));
    return card('Profil', null, [prof, V.comp], { opt: 'profile' });
  }
  function filled(v) { return Array.isArray(v) ? v.length > 0 : String(v == null ? '' : v).trim() !== ''; }
  function syncHero() {
    if (!V || !Dr) return;
    var p = App.profile(), name = draftName(), cls = avCls(p.avatarColor);
    paintAv(V.navAv, name, cls);
    paintAv(V.heroAv, name, cls);
    if (!V.heroName || !V.heroName.isConnected) return;
    V.heroName.textContent = name || 'Adınızı əlavə edin';
    V.heroName.classList.toggle('settings-hero-empty', !name);
    var meta = [Dr.role, Dr.pairs && Dr.pairs.length ? pairsShort(Dr.pairs) : ''].filter(Boolean).join(' · ');
    V.heroMeta.textContent = meta;
    V.heroMeta.hidden = !meta;
    V.heroMail.textContent = Dr.email || '';
    V.heroMail.hidden = !Dr.email;
    V.heroMail.title = Dr.email || '';
    V.heroBadges.textContent = '';
    if (App.mode && App.mode() === 'academy' && p.rank) V.heroBadges.appendChild(h('span', { class: 'badge' }, p.rank));
    if (Dr.notarial) V.heroBadges.appendChild(h('span', { class: 'badge' }, 'Notarial tərcümə'));
    var since = p.memberSince ? new Date(p.memberSince) : null;
    if (since && !isNaN(since)) V.heroBadges.appendChild(h('span', { class: 'badge' }, 'Üzv: ' + MONTHS[since.getMonth()] + ' ' + since.getFullYear()));
    V.heroBadges.hidden = !V.heroBadges.childNodes.length;
    /* completeness */
    var miss = COMPLETE.filter(function (c) { return !filled(Dr[c[0]]); });
    var pct = Math.round((COMPLETE.length - miss.length) / COMPLETE.length * 100);
    V.compBar.style.width = pct + '%';
    V.compBar.parentNode.setAttribute('aria-valuenow', String(pct));
    V.compTx.textContent = '';
    if (!miss.length) {
      V.compTx.appendChild(h('b', { text: pct + '%' }));
      V.compTx.appendChild(D.createTextNode(' · bütün əsas sahələr doldurulub'));
      V.compBtn.hidden = true;
    } else {
      V.compTx.appendChild(h('b', { text: pct + '%' }));
      V.compTx.appendChild(D.createTextNode(' · qalıb: ' + miss.slice(0, 3).map(function (c) { return c[1]; }).join(', ') + (miss.length > 3 ? '…' : '')));
      V.compBtn.hidden = false;
      V.compMiss = miss[0][0];
    }
  }
  function completeNext() {
    var k = V && V.compMiss; if (!k) return;
    openSection(FIELD_SEC[k] || 'account', { opt: k });
  }
  function avatarSheet() {
    var p = App.profile(), cur = avCls(p.avatarColor), chosen = cur, name = draftName() || p.name;
    var prev = h('span', { class: 'settings-av big ' + cur, 'aria-hidden': 'true' }, avParts(initials(name)));
    if (!name) { var pb = prev.querySelector('b'); if (pb) pb.innerHTML = App.icon('user'); }
    var cap = h('p', { class: 'small muted', 'aria-live': 'polite' });
    function setCap(id) { for (var i = 0; i < AV_COLORS.length; i++) if (AV_COLORS[i].id === id) { cap.textContent = AV_COLORS[i].name + ' — ' + AV_COLORS[i].note; } }
    setCap(cur);
    var sw = h('div', { class: 'swatches', role: 'group', 'aria-label': 'Avatar rəngi' });
    AV_COLORS.forEach(function (c) {
      var b = h('button', { class: 'swatch ' + c.id, type: 'button', 'aria-pressed': String(c.id === cur), 'aria-label': c.name, title: c.name });
      b.addEventListener('click', function () {
        chosen = c.id;
        each(sw.children, function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        prev.className = 'settings-av big ' + c.id;
        setCap(c.id);
      });
      sw.appendChild(b);
    });
    var body = h('div', { class: 'settings-avsheet' }, prev, cap, sw,
      h('p', { class: 'small muted', text: 'Fotoşəkil əvəzinə baş hərfləriniz bu rəngdə göstərilir.' }));
    App.sheet({
      title: 'Avatarın rəngi', body: body,
      actions: [{ label: 'Ləğv et', kind: 'ghost' }, { label: 'Yadda saxla', kind: 'primary', onClick: function () {
        if (chosen === cur) return;
        saveProfile({ avatarColor: chosen });
        syncHero();
        var c = null; for (var i = 0; i < AV_COLORS.length; i++) if (AV_COLORS[i].id === chosen) c = AV_COLORS[i];
        toast('Avatar yeniləndi', 'ok', { sub: (c ? c.name : '') + ' rəngi seçildi' });
        nz('success', null, 1400);
      } }]
    });
  }

  /* ------------------------------------------------------------------
     9. SECTION: HESAB — profile, personal data, work profile, notifications
     ------------------------------------------------------------------ */
  function detectDevice() {
    var ua = navigator.userAgent || '', br = 'Brauzer', os = 'Kompüter';
    if (/Edg\//.test(ua)) br = 'Edge'; else if (/OPR\//.test(ua)) br = 'Opera'; else if (/Firefox\//.test(ua)) br = 'Firefox';
    else if (/Chrome\//.test(ua)) br = 'Chrome'; else if (/Safari\//.test(ua)) br = 'Safari';
    if (/iPhone/.test(ua)) os = 'iPhone'; else if (/iPad/.test(ua)) os = 'iPad'; else if (/Android/.test(ua)) os = 'Android';
    else if (/Mac OS X|Macintosh/.test(ua)) os = 'macOS'; else if (/Windows/.test(ua)) os = 'Windows'; else if (/Linux/.test(ua)) os = 'Linux';
    return br + ' · ' + os;
  }

  function secAccount() {
    var roleHint = h('span', { class: 'hint', id: 'st-role-hint' });
    var student = h('div', { class: 'settings-row', hidden: true },
      h('div', { class: 'tx' }, h('b', { text: 'Akademiya rejimi' }), h('small', { text: 'Tələbələr üçün dərslər, tapşırıqlar və irəliləyiş.' })),
      h('div', { class: 'ctl' }, h('button', { class: 'btn btn-sm btn-secondary', type: 'button', onclick: function () { if (App.setMode) App.setMode('academy'); } }, 'Akademiyaya keç')));
    var roles = ROLES.slice();
    if (Dr.role && !roles.some(function (r) { return r.id === Dr.role; })) roles.push({ id: Dr.role, label: Dr.role, hint: '' });
    var roleSel = selectCtl('role', roles);
    function syncRole() {
      var r = null; roles.forEach(function (x) { if (x.id === Dr.role) r = x; });
      roleHint.textContent = r ? r.hint : '';
      roleHint.hidden = !roleHint.textContent;
      student.hidden = !(Dr.role === 'Tələbə' && (!App.mode || App.mode() !== 'academy'));
    }
    watch('role', syncRole); syncRole();
    var personal = card('Şəxsi məlumatlar', 'Hamısı istəyə bağlıdır və yalnız bu cihazda saxlanılır.', [
      fieldBox('first', 'Ad', textIn('first', { autocomplete: 'given-name', placeholder: 'Adınız' })),
      fieldBox('last', 'Soyad', textIn('last', { autocomplete: 'family-name', placeholder: 'Soyadınız' }), { optTx: 'istəyə görə' }),
      fieldBox('email', 'E-poçt', textIn('email', { type: 'email', autocomplete: 'email', inputmode: 'email', spellcheck: 'false', placeholder: 'ad@domen.az' })),
      fieldBox('phone', 'Telefon', textIn('phone', { type: 'tel', autocomplete: 'tel', inputmode: 'tel', placeholder: '+994 50 123 45 67' }), { hint: 'Təcili təhvil məsələləri üçün.' }),
      fieldBox('role', 'Rol', roleSel, { hintEl: roleHint }),
      student
    ]);
    return h('div', { class: 'settings-sec-part' }, buildHero(), personal);
  }

  /* site access code: the Worker's ACCESS_CODE. Stored as 'code' (App.store → localStorage
     'nuanza2:code', JSON) and sent by ai/core.js with every AI request (x-access-code).
     Saved on its own button — it is not part of the profile draft. */
  function codeGroup() {
    var codeIn = h('input', { class: 'input', id: 'st-code', type: 'text', autocomplete: 'off', spellcheck: 'false', autocapitalize: 'off',
      value: String(sget('code', '') || ''), 'aria-describedby': 'st-code-hint', placeholder: 'Kod' });
    var codeSave = h('button', { class: 'btn btn-secondary btn-sm', type: 'button' }, 'Yadda saxla');
    function saveCode() {
      var v = codeIn.value.trim();
      codeIn.value = v;
      if (/[^\x20-\x7e]/.test(v)) { /* sent as an HTTP header: Latin letters, digits and signs only */
        codeIn.setAttribute('aria-invalid', 'true');
        toast('Kod yadda saxlanmadı', 'warn', { sub: 'Kodda yalnız latın hərfləri, rəqəmlər və işarələr ola bilər (ə, ş, ç… olmadan)' });
        return;
      }
      codeIn.removeAttribute('aria-invalid');
      if (v) sset('code', v); else { try { App.store.remove('code'); } catch (e) { /* storage blocked */ } }
      toast(v ? 'Giriş kodu yadda saxlandı' : 'Giriş kodu silindi', 'ok', { sub: v ? 'Növbəti AI sorğusu bu kodla göndəriləcək' : 'AI sorğuları kodsuz göndəriləcək' });
    }
    codeSave.addEventListener('click', saveCode);
    codeIn.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); saveCode(); } });
    return card('Sayt girişi', null, [
      h('div', { class: 'settings-row is-field', 'data-opt': 'code' },
        h('label', { for: 'st-code' }, 'Sayt giriş kodu'),
        h('div', { class: 'fctl' },
          h('div', { class: 'settings-row2' }, h('span', { class: 'grow', style: 'flex:1 1 180px;min-width:0' }, codeIn), codeSave),
          h('span', { class: 'hint', id: 'st-code-hint', text: 'Saytın sahibi kod qoyubsa, buraya yazın. Süni intellekt sorğuları bu kodla göndərilir.' })))
    ], { opt: 'code' });
  }

  /* göl: stepped carpet diamond centred on (cx, cy), half-diagonal R0, `n` steps per edge */
  function golPts(cx, cy, R0, n) {
    var st = R0 / (n + 1), p = [], i;
    function pt(x, y) { p.push((Math.round((cx + x) * 100) / 100) + ',' + (Math.round((cy + y) * 100) / 100)); }
    for (i = 0; i <= n; i++) { pt(i * st, -R0 + i * st); pt((i + 1) * st, -R0 + i * st); }
    for (i = 0; i <= n; i++) { pt(R0 - i * st, i * st); pt(R0 - i * st, (i + 1) * st); }
    for (i = 0; i <= n; i++) { pt(-i * st, R0 - i * st); pt(-(i + 1) * st, R0 - i * st); }
    for (i = 0; i <= n; i++) { pt(-R0 + i * st, -i * st); pt(-R0 + i * st, -(i + 1) * st); }
    return p.join(' ');
  }
  function sealSvg(name) {
    var id = uid('seal');
    var txt = upper(String(name || 'Tərcüməçi').trim() || 'Tərcüməçi') + ' · TƏRCÜMƏÇİ · NUANZA · ';
    return '<svg class="settings-seal" viewBox="0 0 120 120" aria-hidden="true" focusable="false"><defs><path id="' + id + '" d="M60 60 m-45 0 a45 45 0 1 1 90 0 a45 45 0 1 1 -90 0"/></defs>' +
      '<circle class="s-o" cx="60" cy="60" r="57"/><circle class="s-i" cx="60" cy="60" r="35"/>' +
      '<text class="s-t"><textPath href="#' + id + '" textLength="278" lengthAdjust="spacingAndGlyphs">' + esc(txt) + '</textPath></text>' +
      '<polygon class="s-star" points="' + golPts(60, 60, 23, 3) + '"/><polygon class="s-c2" points="60,47 73,60 60,73 47,60"/><polygon class="s-c" points="60,54 66,60 60,66 54,60"/></svg>';
  }

  function secWork() {
    /* pairs */
    var chips = h('div', { class: 'chips', id: 'st-pairs', role: 'list', 'aria-label': 'Dil cütləri' });
    function drawPairs() {
      chips.textContent = '';
      Dr.pairs.forEach(function (pid, i) {
        var x = h('button', { class: 'x', type: 'button', 'aria-label': pairLabel(pid) + ' cütünü sil', html: App.icon('x') });
        x.addEventListener('click', function () {
          if (Dr.pairs.length <= 1) { setErr('pairs', 'Ən azı bir dil cütü qalmalıdır.'); nz('worried', null, 1400); return; }
          Dr.pairs = Dr.pairs.filter(function (q) { return q !== pid; });
          drawPairs(); changed('pairs');
          var nx = chips.querySelector('.x'); focusEl(nx || chips.querySelector('.settings-add'));
        });
        chips.appendChild(h('span', { class: 'chip' + (i === 0 ? ' settings-chip-main' : ''), role: 'listitem', title: pairName(pid) + (i === 0 ? ' · əsas cüt' : '') },
          pairLabel(pid), x));
      });
      chips.appendChild(h('button', { class: 'chip settings-add', type: 'button', onclick: addPairsSheet }, ie('plus'), 'Əlavə et'));
    }
    function addPairsSheet() {
      var avail = allPairs().filter(function (p) { return Dr.pairs.indexOf(p.id) < 0; });
      if (!avail.length) { toast('Bütün dil cütləri artıq əlavə olunub', 'info'); return; }
      var chosen = [];
      var grid = h('div', { class: 'list' });
      avail.forEach(function (p) {
        var cb = h('input', { type: 'checkbox', 'aria-label': p.name });
        var b = h('label', { class: 'list-row', style: 'min-height:44px' },
          h('span', { class: 'tx' }, h('b', null, p.label, p.beta ? ' ' : null, p.beta ? h('span', { class: 'badge', text: 'beta' }) : null), h('small', { text: p.name })),
          h('span', { class: 'end' }, h('span', { class: 'switch' }, cb, h('span', { 'aria-hidden': 'true' }))));
        cb.addEventListener('change', function () {
          var i = chosen.indexOf(p.id);
          if (cb.checked && i < 0) chosen.push(p.id); else if (!cb.checked && i >= 0) chosen.splice(i, 1);
        });
        grid.appendChild(b);
      });
      App.sheet({
        title: 'Dil cütü əlavə et',
        body: h('div', { class: 'stack' }, h('p', { class: 'muted small', text: 'Bir neçəsini birdən seçə bilərsiniz. Siyahıda birinci gələn cüt tərcümə ekranında əsas kimi açılır.' }), grid),
        actions: [{ label: 'Ləğv et', kind: 'ghost' }, { label: 'Əlavə et', kind: 'primary', onClick: function () {
          if (!chosen.length) { toast('Ən azı bir cüt seçin', 'warn'); return false; }
          Dr.pairs = Dr.pairs.concat(chosen);
          clearErr('pairs'); drawPairs(); changed('pairs');
          toast(chosen.length === 1 ? pairLabel(chosen[0]) + ' əlavə olundu' : chosen.length + ' cüt əlavə olundu', 'ok', { sub: 'Yadda saxlamağı unutmayın' });
        } }]
      });
    }
    drawPairs();
    var pErr = h('span', { class: 'err', role: 'alert', hidden: true }); ERR.pairs = pErr;
    var pairsRow = h('div', { class: 'settings-row is-field', 'data-opt': 'pairs' },
      h('span', { class: 'label' }, 'Dil cütləri'), h('div', { class: 'fctl' }, chips, h('span', { class: 'hint', text: 'Birinci cüt əsasdır.' }), pErr));

    /* specialties */
    var sChips = h('div', { class: 'chips', id: 'st-specialties', role: 'list', 'aria-label': 'İxtisas sahələri' });
    function drawSpecs() {
      sChips.textContent = '';
      Dr.specialties.forEach(function (s) {
        var x = h('button', { class: 'x', type: 'button', 'aria-label': s + ' sahəsini sil', html: App.icon('x') });
        x.addEventListener('click', function () { Dr.specialties = Dr.specialties.filter(function (q) { return q !== s; }); drawSpecs(); changed('specialties'); focusEl(sChips.querySelector('.x') || sChips.querySelector('.settings-add')); });
        sChips.appendChild(h('span', { class: 'chip', role: 'listitem' }, s, x));
      });
      sChips.appendChild(h('button', { class: 'chip settings-add', type: 'button', onclick: addSpecSheet }, ie('plus'), 'Əlavə et'));
    }
    function addSpecSheet() {
      var chosen = [];
      var pickWrap = h('div', { class: 'chips settings-chips-pick', role: 'group', 'aria-label': 'Təkliflər' });
      SPECS.filter(function (s) { return Dr.specialties.indexOf(s) < 0; }).forEach(function (s) {
        var b = h('button', { class: 'chip', type: 'button', 'aria-pressed': 'false' }, s);
        b.addEventListener('click', function () { var i = chosen.indexOf(s); if (i >= 0) chosen.splice(i, 1); else chosen.push(s); b.setAttribute('aria-pressed', String(i < 0)); });
        pickWrap.appendChild(b);
      });
      var custom = h('input', { class: 'input', id: uid('spec'), placeholder: 'Məsələn: Gömrük sənədləri', maxlength: '40', autocomplete: 'off' });
      var body = h('div', { class: 'stack' }, pickWrap,
        h('div', { class: 'field' }, h('label', { for: custom.id }, 'Öz sahənizi yazın', h('span', { class: 'opt', text: 'istəyə görə' })), custom));
      var sh = App.sheet({
        title: 'İxtisas sahəsi əlavə et', body: body,
        actions: [{ label: 'Ləğv et', kind: 'ghost' }, { label: 'Əlavə et', kind: 'primary', onClick: function () {
          var c = custom.value.trim();
          if (c) { c = upper(c.charAt(0)) + c.slice(1); if (chosen.indexOf(c) < 0 && Dr.specialties.indexOf(c) < 0) chosen.push(c); }
          if (!chosen.length) { toast('Sahə seçin və ya yazın', 'warn'); return false; }
          Dr.specialties = Dr.specialties.concat(chosen);
          drawSpecs(); changed('specialties');
          toast(chosen.length === 1 ? '«' + chosen[0] + '» əlavə olundu' : chosen.length + ' sahə əlavə olundu', 'ok');
        } }]
      });
      custom.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); var f = sh.el && sh.el.querySelector('.sheet-f .btn-primary'); if (f) f.click(); } });
    }
    drawSpecs();
    var specRow = h('div', { class: 'settings-row is-field', 'data-opt': 'specialties' },
      h('span', { class: 'label' }, 'İxtisas sahələri'), h('div', { class: 'fctl' }, sChips, h('span', { class: 'hint', text: 'Bu sahələrin lüğətləri və üslub qaydaları önə çəkilir.' })));
    var profileCard = card('İş profili', null, [pairsRow, specRow]);

    /* rates */
    var sampleTx = h('span', { class: 'settings-calc' });
    var sampleBox = h('div', { class: 'settings-row' }, h('div', { class: 'tx' }, h('b', { text: 'Nümunə hesab' }), sampleTx));
    function drawSample() {
      var r = parseDec(Dr.rate), pg = parseDec(Dr.ratePage);
      sampleTx.textContent = '';
      sampleBox.hidden = !isFinite(r) && !isFinite(pg);
      sampleTx.appendChild(D.createTextNode('2 400 sözlük müqavilə ≈ '));
      sampleTx.appendChild(h('b', { text: isFinite(r) ? money(2400 * r) : '—' }));
      sampleTx.appendChild(D.createTextNode(' · 7 səhifəlik arayış ≈ '));
      sampleTx.appendChild(h('b', { text: isFinite(pg) ? money(7 * pg) : '—' }));
      if (Dr.notarial) sampleTx.appendChild(D.createTextNode('. Notarial sifarişlərdə tərcüməçi bəyanı əlavə olunur.'));
    }
    watch('rate', drawSample); watch('ratePage', drawSample); watch('notarial', drawSample);
    drawSample();
    var ratesCard = card('Tariflər', 'İstəyə bağlı. Yazsanız, layihə qiyməti bununla hesablanır. 1 səhifə = 1 800 simvol (boşluqlarla).', [
      fieldBox('rate', 'Söz başına', affix(textIn('rate', { inputmode: 'decimal', placeholder: 'məs. 0,05' }), 'AZN / söz'), { optTx: 'istəyə görə' }),
      fieldBox('ratePage', 'Səhifə başına', affix(textIn('ratePage', { inputmode: 'decimal', placeholder: 'məs. 10' }), 'AZN / səhifə'), { optTx: 'istəyə görə' }),
      switchRow('notarial', 'Notarial təsdiqli tərcümə edirəm', 'Notarius üçün imzalı nüsxə və tərcüməçi bəyanı hazırlanır.', 'stamp', ''),
      sampleBox
    ], { opt: 'rates' });

    /* signature + seal */
    var sgName = h('span', { class: 'sg-name' });
    var sgMeta = h('span', { class: 'sg-meta' });
    var sealHost = h('span', { 'aria-hidden': 'true' });
    var sealTimer = null;
    function drawSign() {
      var nm = String(Dr.signName || '').trim() || draftName() || 'Ad Soyad';
      sgName.textContent = nm;
      sgMeta.textContent = '';
      sgMeta.appendChild(h('span', { text: 'Tərcüməçi · ' + (pairsShort(Dr.pairs) || '—') }));
      sgMeta.appendChild(h('span', { text: dateAz(new Date()) }));
      clearTimeout(sealTimer);
      sealTimer = later(function () { sealHost.innerHTML = sealSvg(nm); }, 0);
    }
    watch('signName', function () { drawSign(); });
    watch('pairs', function () { drawSign(); });
    drawSign();
    var signCard = card('İmza və möhür', 'Tərcüməçi bəyanında, təhvil sənədində və möhür ştampında görünür.', [
      fieldBox('signName', 'İmzada görünən ad', textIn('signName', { autocomplete: 'name', placeholder: 'Ad Soyad' }), { hint: 'Pasportdakı kimi yazın — notarius bu adı yoxlayır.' }),
      h('div', { class: 'settings-row settings-sign', 'aria-label': 'İmza önizləməsi' },
        h('span', { class: 'sg-l' }, h('span', { class: 'sg-k', text: 'Tərcüməni yerinə yetirdi' }), sgName, h('span', { class: 'sg-line', 'aria-hidden': 'true' }), sgMeta),
        sealHost)
    ], { opt: 'sign' });

    /* invoice */
    var dl = h('datalist', { id: 'st-banks' }, BANKS.map(function (b) { return h('option', { value: b }); }));
    var invCard = card('Hesab-faktura rekvizitləri', 'Hər hesab-fakturada avtomatik görünür.', [
      fieldBox('voen', 'VÖEN', textIn('voen', { inputmode: 'numeric', maxlength: '10', placeholder: '1234567890', spellcheck: 'false' }), { hint: '10 rəqəm — vergi ödəyicisinin eyniləşdirmə nömrəsi.' }),
      fieldBox('bank', 'Bank', h('span', null, textIn('bank', { list: 'st-banks', placeholder: 'Bankı seçin və ya yazın' }), dl)),
      fieldBox('addr', 'Hüquqi ünvan', textIn('addr', { autocomplete: 'street-address', placeholder: 'Şəhər, rayon, küçə, ev' })),
      fieldBox('iban', 'Hesab nömrəsi (IBAN)', textIn('iban', { placeholder: 'AZ00 XXXX 0000 0000 0000 0000 0000', spellcheck: 'false', autocapitalize: 'characters' }), { hint: 'Ödənişlər bu hesaba yönləndirilir.' }),
      rowEl('Nümunə hesab-faktura', 'Rekvizitlərin sənəddə necə görünəcəyinə baxın.', h('button', { class: 'btn btn-sm btn-secondary', type: 'button', onclick: invoiceSheet }, 'Bax'))
    ], { opt: 'invoice' });

    return h('div', { class: 'settings-sec-part' }, profileCard, ratesCard, signCard, invCard);
  }
  function invoiceSheet() {
    var r = parseDec(Dr.rate); if (!isFinite(r)) r = 0;
    var total = 2400 * r, name = draftName() || '—';
    function val(v, miss) { v = String(v || '').trim(); return v ? h('dd', { text: v }) : h('dd', { class: 'miss', text: miss || 'əlavə edilməyib' }); }
    var today = new Date();
    var body = h('div', { class: 'settings-inv' },
      h('div', { class: 'row between' }, h('div', null, h('span', { class: 'eyebrow', text: 'Hesab-faktura' }), h('h3', { text: '№ NZ-' + today.getFullYear() + '-0001' })), h('span', { class: 'badge', text: dateAz(today) })),
      h('dl', { class: 'kv' },
        h('dt', { text: 'İcraçı' }), h('dd', { text: name }),
        h('dt', { text: 'VÖEN' }), val(Dr.voen),
        h('dt', { text: 'Ünvan' }), val(Dr.addr),
        h('dt', { text: 'Bank' }), val(Dr.bank),
        h('dt', { text: 'IBAN' }), val(Dr.iban),
        h('dt', { text: 'Sifarişçi' }), h('dd', { class: 'miss', text: 'Sifarişçinin adı' })),
      h('div', { class: 'table-wrap' }, h('table', { class: 'table compact' },
        h('thead', null, h('tr', null, h('th', { text: 'Xidmət' }), h('th', { class: 'num', text: 'Məbləğ' }))),
        h('tbody', null, h('tr', null, h('td', null, h('b', { text: 'Hüquqi tərcümə, ' + (pairLabel(Dr.pairs[0] || 'en-az')) }), h('div', { class: 'muted', text: '2 400 söz × ' + num(r) + ' AZN' })), h('td', { class: 'num', text: money(total) }))))),
      h('div', { class: 'tot' }, h('span', { class: 'muted', text: 'Cəmi ödənilməli' }), h('b', { text: money(total) })),
      (!String(Dr.voen || '').trim() || !String(Dr.iban || '').trim()) ? h('div', { class: 'callout red' }, ie('alert'), h('div', null, 'VÖEN və IBAN olmadan hesab-faktura rəsmi sayılmır. Qırmızı sətirləri doldurun.')) : null);
    App.sheet({ title: 'Nümunə hesab-faktura', body: body, actions: [{ label: 'Bağla', kind: 'primary' }] });
  }

  /* ------------------------------------------------------------------
     10. SECTION: DİL — interface language + language conventions
     ------------------------------------------------------------------ */
  function secLanguage() {
    var langSeg = segCtl('lang', LANGS_UI, {
      get: function () { return uiCfg().lang; }, label: 'İnterfeys dili',
      set: function (v) {
        setUi({ lang: v }); syncSummaries();
        if (v === 'az') toast('İnterfeys dili: Azərbaycan', 'ok');
        else toast('İnterfeys dili: ' + (v === 'en' ? 'English' : 'Русский'), 'info', { sub: 'Prototipdə mətnlər hələlik azərbaycancadır — tərcümələr növbəti buraxılışda.' });
      }
    });
    var ui = card('İnterfeys', 'Dərhal tətbiq olunur. Tərcümə dilləri «Hesab → İş profili» bölməsində seçilir.', [
      rowEl('İnterfeys dili', 'Menyular, düymələr və bildirişlər.', langSeg, { opt: 'lang' })
    ]);

    var now = new Date();
    var addrEx = exBox('Nümunə', '«You can change your password at any time.»', (ADDRS.filter(function (a) { return a.id === Dr.address; })[0] || ADDRS[0]).ex);
    watch('address', function (v) { addrEx.set((ADDRS.filter(function (a) { return a.id === v; })[0] || ADDRS[0]).ex); });
    var addrRow = rowEl('Müraciət forması', '«you» necə verilsin.', segCtl('address', ADDRS, { label: 'Müraciət forması' }), { opt: 'address', extra: addrEx });

    var dateItems = DATE_FMTS.map(function (f) { return { id: f.id, label: f.fn(now) }; });
    function dateNote(v) { var f = DATE_FMTS.filter(function (x) { return x.id === v; })[0] || DATE_FMTS[0]; return f.note.charAt(0).toUpperCase() + f.note.slice(1) + '.'; }
    var dateHint = h('span', { class: 'hint', id: 'st-dateFmt-hint', text: dateNote(Dr.dateFmt) });
    watch('dateFmt', function (v) { dateHint.textContent = dateNote(v); });
    var srcDate = MONTHS_EN[now.getMonth()] + ' ' + now.getDate() + ', ' + now.getFullYear();
    function dateOut(v) { var f = DATE_FMTS.filter(function (x) { return x.id === v; })[0] || DATE_FMTS[0]; return f.fn(now); }
    var dateEx = exBox('Nümunə', srcDate, dateOut(Dr.dateFmt));
    watch('dateFmt', function (v) { dateEx.set(dateOut(v)); });

    var numEx = exBox('Nümunə', '12,480.50 USD', (NUM_FMTS.filter(function (x) { return x.id === Dr.numFmt; })[0] || NUM_FMTS[0]).ex);
    watch('numFmt', function (v) { numEx.set((NUM_FMTS.filter(function (x) { return x.id === v; })[0] || NUM_FMTS[0]).ex); });

    var trEx = exBox('Nümunə', 'Щербаков Юрий Алексеевич', (TRANSLIT.filter(function (x) { return x.id === Dr.translit; })[0] || TRANSLIT[0]).ex);
    watch('translit', function (v) { trEx.set((TRANSLIT.filter(function (x) { return x.id === v; })[0] || TRANSLIT[0]).ex); });

    var formats = card('Tərcümədə format', 'Tarixlər, rəqəmlər və adlar bütün sənəddə eyni qaydada yazılır — Möhürdar Mirzə bunu yoxlayır.', [
      addrRow,
      fieldBox('dateFmt', 'Tarix formatı', selectCtl('dateFmt', dateItems), { hintEl: h('span', { class: 'stack-sm' }, dateHint, dateEx) }),
      fieldBox('numFmt', 'Rəqəm formatı', selectCtl('numFmt', NUM_FMTS), { hintEl: numEx }),
      fieldBox('translit', 'Adların transliterasiyası', selectCtl('translit', TRANSLIT), { hintEl: h('span', { class: 'stack-sm' }, h('span', { class: 'hint', text: 'Rus və digər kiril mənbələrindəki şəxs adları üçün.' }), trEx) })
    ]);
    return h('div', { class: 'settings-sec-part' }, ui, formats);
  }

  /* ------------------------------------------------------------------
     11. SECTION: TƏRCÜMƏ
     ------------------------------------------------------------------ */
  function secTranslation() {
    var regEx = exBox('Nümunə', '«Please submit the documents by Friday.»', REG_EX[Dr.register] || REG_EX.auto);
    var regHint = h('small', { id: 'st-register-hint', text: REG_HINT[Dr.register] || '' });
    watch('register', function (v) { regEx.set(REG_EX[v] || ''); regHint.textContent = REG_HINT[v] || ''; });
    var regField = h('div', { class: 'settings-row wide-ctl', 'data-opt': 'register' },
      h('div', { class: 'tx' }, h('b', { id: 'st-register-l', text: 'Əsas üslub' }), regHint),
      h('div', { class: 'ctl' }, segCtl('register', REGS, { label: 'Əsas üslub' })),
      h('div', { class: 'ctl' }, regEx));

    var style = card('Üslub', 'Yeni tərcümələr bu ayarla başlayır; hər layihədə və tərcümə ekranında ayrıca dəyişmək olar.', [
      regField,
      switchRow('enforceTerms', 'Termin bazası məcburidir', 'Lüğətdəki terminlər hər zaman işlənir; uyğunsuzluq olarsa seqment «Yoxlayın» kimi işarələnir.', 'book', '')
    ]);

    /* checks */
    var turkicChips = h('div', { class: 'chips' }, TURKIC.map(function (t) { return h('span', { class: 'chip' }, h('s', { text: t[0] }), ' → ', h('span', { text: t[1] })); }));
    var checks = card('Avtomatik yoxlamalar', null, [
      switchRow('turkic', 'Türk formalarını yoxla', 'Dilçi Nənə ədəbi normaya uyğun olmayan türk formalarını tapır və düzəliş təklif edir.', 'shield', 'nar', { extra: turkicChips }),
      switchRow('clarify', 'Dəqiqləşdirici suallar ver', 'Mətn birmənalı olmayanda (məsələn, «you» — sən, yoxsa siz?) tərcümədən əvvəl soruşulur.', 'help', 'gold')
    ]);

    return h('div', { class: 'settings-sec-part' }, style, checks);
  }

  /* ------------------------------------------------------------------
     12. SECTION: AI — quality, access code, companion
     ------------------------------------------------------------------ */
  function secAI() {
    var qList = h('div', { class: 'settings-raw settings-list', id: 'st-quality', role: 'radiogroup', 'aria-label': 'Keyfiyyət rejimi' });
    function paintQ() {
      each(qList.children, function (b) { var on = b.getAttribute('data-v') === Dr.quality; b.setAttribute('aria-checked', String(on)); b.tabIndex = on ? 0 : -1; });
    }
    QUALITY.forEach(function (q) {
      var b = h('button', { class: 'settings-row settings-link-row settings-radio', type: 'button', role: 'radio', 'data-v': q.id },
        h('div', { class: 'tx' }, h('b', { text: q.label }), h('small', { text: q.hint })),
        h('div', { class: 'ctl' }, h('span', { class: 'settings-radio-dot', 'aria-hidden': 'true' })));
      b.addEventListener('click', function () {
        if (Dr.quality === q.id) return;
        Dr.quality = q.id; paintQ(); changed('quality');
        if (q.id === 'meclis') nz('point', 'Böyük işlərdə beş redaktor tərcüməni bir-bir yoxlayacaq.', 2800);
      });
      b.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
        e.preventDefault();
        var l = Array.prototype.slice.call(qList.children), i = l.indexOf(b);
        var nx = l[(i + (e.key === 'ArrowDown' ? 1 : -1) + l.length) % l.length];
        focusEl(nx); nx.click();
      });
      qList.appendChild(b);
    });
    paintQ();
    var meclisLink = h('button', { class: 'link', type: 'button' }, 'Məclis necə işləyir?');
    meclisLink.addEventListener('click', function () {
      if (!App.bigJob) return;
      App.bigJob('Nümunə: podrat müqaviləsinin 4.2-ci bəndi', { score: 94, text: '«Podratçı» termini ardıcıl işlənib, rəqəmlər və tarixlər mənbə ilə üst-üstə düşür. Türk forması tapılmadı.' });
    });
    var quality = card('Keyfiyyət rejimi', 'Yeni tərcümələr bu rejimlə başlayır; tərcümə ekranında istənilən vaxt dəyişə bilərsiniz.', [qList], { opt: 'quality', actions: meclisLink });
    return h('div', { class: 'settings-sec-part' }, quality, codeGroup(), secCompanion());
  }

  /* companion settings (live) — a group inside «AI»; changes apply to the corner dock at once */
  function secCompanion() {
    var c = compCfg();
    function root() { var d = D.querySelector('.companion'); return d || null; }
    /* explicit «Sına» buttons speak through the dock; setting changes only nudge its state */
    function react(state, text, ms) {
      var co = App.companion; if (!co || typeof co.set !== 'function') return;
      try { co.set(state, text && c.talk !== 'sakit' ? { say: text, ms: ms || 2600 } : { ms: ms || 1400 }); } catch (e) { /* ignore */ }
    }
    var state = h('span', { class: 'badge' });
    function syncCap() {
      state.className = 'badge' + (c.show ? ' green' : '');
      state.textContent = c.show ? 'Görünür · ' + dockPx(c.size) + ' px' : 'Gizli';
    }
    syncCap();

    var showRow = switchRow('cShow', 'Nuanzanı göstər', 'Ekranın küncündə dayanır və yalnız lazım olanda qısa qeyd verir.', 'eye', '', {
      get: function () { return c.show; },
      set: function (v) {
        c.show = v; setComp({ show: v }); syncCap(); syncSummaries();
        toast(v ? 'Nuanza göstərilir' : 'Nuanza gizləndi', 'info', { sub: v ? 'Ekranın küncündədir' : 'Bu bölmədən istədiyiniz vaxt qaytara bilərsiniz' });
      }
    });
    var sizeSeg = segCtl('cSize', [{ id: 'sm', label: 'Kiçik' }, { id: 'md', label: 'Orta' }, { id: 'lg', label: 'Böyük' }], {
      get: function () { return sizeKey(c.size); }, label: 'Köməkçinin ölçüsü',
      set: function (v) {
        c.size = v === 'md' ? 'dock' : v;
        setComp({ size: c.size }); syncCap();
      }
    });
    var TALK_HINT = {
      sakit: 'Heç vaxt danışmır — yalnız küncdə görünür. Nəticələr bildirişlərdə qalır.',
      normal: 'Yalnız toxunanda və iş bitəndə danışır: yoxlama, QA, Məclisin yekunu.',
      cox: 'Bundan əlavə ekranlara keçəndə qısa məsləhətlər verir — öyrənənlər üçün.'
    };
    var talkHint = h('small', { text: TALK_HINT[c.talk] || '' });
    var talkSeg = segCtl('cTalk', [{ id: 'sakit', label: 'Sakit' }, { id: 'normal', label: 'Normal' }, { id: 'cox', label: 'Çox' }], {
      get: function () { return c.talk; }, label: 'Danışma tezliyi',
      set: function (v) {
        c.talk = v; c.chatty = v !== 'sakit';
        setComp({ talk: v, chatty: c.chatty }); talkHint.textContent = TALK_HINT[v]; syncSummaries();
        if (v === 'cox') amb.lastTip = Date.now() - 120000;
      }
    });
    function intLabel(v) { return v === 0 ? 'Hərəkətsiz' : v < 40 ? 'Sakit' : v < 75 ? 'Təbii' : 'Canlı'; }
    var intVal = h('span', { class: 'settings-rangeval', text: intLabel(c.intensity) + ' · ' + c.intensity + '%' });
    function applyPreviewRate(v) {
      var r = root(); if (!r) return;
      if (v > 0) setRate(r, 0.5 + v / 100);
    }
    var range = rangeCtl('st-cMotion', 0, 100, 10, c.intensity,
      function (v) { intVal.textContent = intLabel(v) + ' · ' + v + '%'; },
      function (v) {
        c.intensity = v; c.motion = v > 0;
        setComp({ intensity: v, motion: v > 0 });
        later(function () { applyPreviewRate(v); }, 80);
      }, 'Animasiya intensivliyi');

    var talkRow = rowEl('Danışma tezliyi', null, talkSeg, { opt: 'cTalk', extra: talkHint });
    var motionRow = h('div', { class: 'settings-row', 'data-opt': 'cMotion' },
      h('div', { class: 'tx' }, h('b', null, h('label', { for: 'st-cMotion', text: 'Animasiya intensivliyi' })),
        h('small', null, 'Göz qırpma və yüngül hərəkət. Ümumi animasiya rejimi — ',
          h('button', { class: 'link', type: 'button', onclick: function () { openSection('appearance', { opt: 'motion' }); } }, 'Görünüş → Animasiyalar'), '.')),
      h('div', { class: 'ctl' }, h('div', { class: 'settings-rangewrap' }, h('div', { class: 'grow' }, range), intVal)));
    var tryRow = rowEl('Sınaq', 'Nuanzanın necə səsləndiyini yoxlayın.', h('div', { class: 'settings-row2' },
      h('button', { class: 'btn btn-sm btn-secondary', type: 'button', onclick: function () { react('wave', 'Salam! Mən Nuanzayam — tərcümədə köməkçiniz.', 2800); } }, 'Salam de'),
      h('button', { class: 'btn btn-sm btn-secondary', type: 'button', onclick: function () { var T = App.data && App.data.TIPS && App.data.TIPS.general; react('point', T && T.length ? pick(T) : 'Lüğətə əlavə etdiyiniz termini bütün layihələrdə qoruyuram.', 4200); } }, 'Məsləhət ver')));
    return card('Köməkçi — Nuanza', 'Dərhal tətbiq olunur — ekranın küncündəki köməkçidə.', [
      showRow,
      rowEl('Ölçü', null, sizeSeg, { opt: 'cSize' }),
      talkRow,
      motionRow,
      tryRow
    ], { opt: 'companion', actions: state });
  }

  /* ------------------------------------------------------------------
     13. SECTION: GÖRÜNÜŞ (live)
     ------------------------------------------------------------------ */
  function artLayer(kind, extra) {
    return h('span', { class: 'settings-art ' + kind + (extra ? ' ' + extra : '') },
      h('i', { class: 'a-side' }), h('i', { class: 'a-s1' }), h('i', { class: 'a-s2' }), h('i', { class: 'a-s3' }), h('i', { class: 'a-top' }),
      h('i', { class: 'a-card' }), h('i', { class: 'a-l1' }), h('i', { class: 'a-l2' }), h('i', { class: 'a-l3' }), h('i', { class: 'a-btn' }));
  }
  function setThemeFx(t, origin) {
    /* a calm theme change: no circular reveal */
    if (App.setTheme) App.setTheme(t);
    void origin;
  }
  function curTheme() { var t = App.theme ? App.theme() : 'light'; return t === 'dark' || t === 'system' ? t : 'light'; }
  function secAppearance() {
    var ui = uiCfg();
    var cur = curTheme();
    var tiles = h('div', { class: 'settings-theme settings-raw', role: 'group', 'aria-label': 'Tema', id: 'st-theme' });
    function markTiles(t) { each(tiles.children, function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === t)); }); }
    THEMES.forEach(function (t) {
      var art = t.id === 'system' ? [artLayer('lt'), artLayer('dk', 'half')] : [artLayer(t.id === 'dark' ? 'dk' : 'lt')];
      var b = h('button', { class: 'settings-tt', type: 'button', 'aria-pressed': String(t.id === cur), 'data-v': t.id },
        h('span', { class: 'settings-tt-art', 'aria-hidden': 'true' }, art), h('b', null, h('span', { class: 'tt-ck', 'aria-hidden': 'true' }), t.label));
      b.addEventListener('click', function () {
        if (curTheme() === t.id) return;
        markTiles(t.id);
        setThemeFx(t.id, b);
        syncSummaries();
      });
      tiles.appendChild(b);
    });
    V.onTheme = function () { markTiles(curTheme()); };

    /* font size */
    var fsVal = h('span', { class: 'settings-rangeval' });
    var resetFs = h('button', { class: 'btn btn-sm btn-ghost', type: 'button', hidden: ui.fontScale === 100 }, 'Standart');
    function fsLabel(v) { fsVal.textContent = v + '%' + (v === 100 ? ' · standart' : ''); }
    fsLabel(ui.fontScale);
    var fsRange = rangeCtl('st-fontScale', 85, 125, 5, ui.fontScale,
      function (v) { fsLabel(v); applyFont(v); },
      function (v) { setUi({ fontScale: v }); resetFs.hidden = v === 100; syncSummaries(); }, 'Şrift ölçüsü');
    resetFs.addEventListener('click', function () { fsRange.value = '100'; fsRange._paint(); fsLabel(100); setUi({ fontScale: 100 }); resetFs.hidden = true; syncSummaries(); toast('Şrift ölçüsü standarta qaytarıldı', 'info'); });
    var fsField = h('div', { class: 'settings-row', 'data-opt': 'fontScale' },
      h('div', { class: 'tx' }, h('b', null, h('label', { for: 'st-fontScale', text: 'Şrift ölçüsü' })), h('small', { text: 'Bütün interfeys mütənasib böyüyür və ya kiçilir.' })),
      h('div', { class: 'ctl' },
        h('div', { class: 'settings-rangewrap' }, h('span', { class: 'a1', 'aria-hidden': 'true', text: 'A' }), h('div', { class: 'grow' }, fsRange), h('span', { class: 'a2', 'aria-hidden': 'true', text: 'A' }), fsVal),
        resetFs));

    var compactRow = switchRow('compact', 'Kompakt rejim', 'Siyahılar, cədvəllər və düymələr daha sıx — ekranda daha çox seqment görünür.', 'grid', '', {
      get: function () { return uiCfg().compact; },
      set: function (v) { setUi({ compact: v }); toast(v ? 'Kompakt rejim aktivdir' : 'Adi sıxlıq bərpa olundu', 'info'); }
    });
    /* motion: full (default) · system · reduce — stored as App.store('motion') */
    var osReduce = false;
    try { osReduce = !!W.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { osReduce = false; }
    var MOTION_HINT = {
      full: 'Keçidlər, köməkçi və Mirzə Məclisinin səhnəsi tam işləyir — cihazda «hərəkəti azalt» açıq olsa belə.',
      system: osReduce ? 'Cihazınızda «hərəkəti azalt» açıqdır — animasiyalar minimuma endirilib.' : 'Cihazın «hərəkəti azalt» ayarına uyğunlaşır. Hazırda cihaz tam animasiyaya icazə verir.',
      reduce: 'Keçidlər və animasiyalar demək olar ki, dayanır. Köməkçi sakit dayanır, Məclis yalnız yumşaq keçidlərlə görünür.'
    };
    function motionNow() { var m = App.motion ? App.motion() : sget('motion', 'full'); return m === 'reduce' || m === true ? 'reduce' : m === 'system' ? 'system' : 'full'; }
    var motionHint = h('small', { text: MOTION_HINT[motionNow()] });
    var motionSeg = segCtl('motion', [{ id: 'full', label: 'Tam' }, { id: 'system', label: 'Sistemə görə' }, { id: 'reduce', label: 'Azaldılmış' }], {
      get: motionNow, label: 'Animasiyalar',
      set: function (v) {
        if (App.setMotion) App.setMotion(v); else sset('motion', v);
        motionHint.textContent = MOTION_HINT[v]; syncSummaries();
        if (v === 'reduce') toast('Animasiyalar azaldıldı', 'info');
        else if (v === 'system') toast('Animasiyalar sistemə görə', 'info', { sub: osReduce ? 'Cihaz hərəkəti azaltmağı istəyir' : 'Cihaz tam animasiyaya icazə verir' });
        else toast('Animasiyalar tam', 'ok');
      }
    });
    var motionField = h('div', { class: 'settings-row', 'data-opt': 'motion' },
      h('div', { class: 'tx' }, h('b', { text: 'Animasiyalar' }), motionHint), h('div', { class: 'ctl' }, motionSeg));

    return h('div', { class: 'settings-sec-part' },
      card('Tema', 'Sistem rejimi cihazınızın ayarına uyğunlaşır.', [tiles], { opt: 'theme' }),
      card('Mətn və sıxlıq', null, [fsField, compactRow]),
      card('Hərəkət', null, [motionField], { opt: 'motionCard' })
    );
  }

  /* ------------------------------------------------------------------
     14. BİLDİRİŞLƏR (part of «Hesab»)
     ------------------------------------------------------------------ */
  function newCode() {
    var A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', s = 'NZ-';
    for (var i = 0; i < 6; i++) { if (i === 4) s += '-'; s += A.charAt(Math.floor(Math.random() * A.length)); }
    return { code: s, exp: Date.now() + 10 * 60000 };
  }
  var tgCode = null;
  function secNotifications() {
    /* reminders */
    var leadSeg = segCtl('nLead', LEADS, { label: 'Nə qədər əvvəl', sm: true });
    var dRow = switchRow('nDeadline', 'Son tarix xatırlatması', 'Təhvilə az qalanda Telegramda və brauzerdə xəbər verilir.', 'clock', 'nar', { extra: leadSeg });
    function syncLead() { dRow._tx.setAttribute('aria-disabled', String(!Dr.nDeadline)); each(leadSeg.children, function (b) { b.disabled = !Dr.nDeadline; }); }
    watch('nDeadline', syncLead); syncLead();

    /* e-mail */
    var daySel = selectCtl('nWeeklyDay', WEEK_DAYS, { label: 'Göndərmə vaxtı' });
    var wRow = switchRow('nWeekly', 'Həftəlik e-poçt hesabatı', 'Həftənin işi və yaxınlaşan son tarixlər — bir məktubda.', 'mail', 'gold', { extra: daySel });
    function syncDay() { wRow._tx.setAttribute('aria-disabled', String(!Dr.nWeekly)); daySel.disabled = !Dr.nWeekly; }
    watch('nWeekly', syncDay); syncDay();

    var remind = card('Bildirişlər', null, [
      dRow,
      switchRow('nMeclis', 'Mirzə Məclisinin rəyi hazır olanda', 'Dərin yoxlama və ya böyük sənədin tərcüməsi bitəndə.', 'shield', ''),
      switchRow('nComments', 'Müştəri şərh yazanda', 'Təhvil paketinə yazılan qeydlər və düzəliş istəkləri.', 'message', ''),
      switchRow('nStreak', 'Akademiya: gündəlik xatırlatma', 'Hər axşam 20:00-da, əgər həmin gün dərs etməmisinizsə.', 'flame', 'gold'),
      wRow
    ], { opt: 'nDeadline' });

    /* telegram */
    var tgBox = h('div', { class: 'settings-raw settings-list' });
    var tgCard = card('Telegram', 'Bildirişləri və qısa tərcümələri birbaşa Telegramda alın.', [tgBox], { opt: 'telegram' });
    var codeTimer = null;
    function drawTg() {
      clearInterval(codeTimer);
      tgBox.textContent = '';
      var t = tgLink();
      if (Dr.local) tgBox.appendChild(rowEl('Lokal rejim seçilib', 'Yadda saxladıqdan sonra Telegram bildirişləri dayandırılacaq.', null));
      if (t.linked) {
        var test = h('button', { class: 'btn btn-sm btn-secondary', type: 'button' }, 'Test mesajı');
        test.addEventListener('click', function () {
          busy(test, true);
          later(function () { busy(test, false); toast('Test mesajı göndərildi', 'ok', { sub: '@MirzeBot: «Salam' + (Dr.first ? ', ' + Dr.first : '') + '! Bildirişlər işləyir.»', icon: 'telegram' }); }, 900);
        });
        var off = h('button', { class: 'btn btn-sm btn-ghost', type: 'button' }, 'Ayır');
        off.addEventListener('click', function () {
          App.confirm({ title: 'Telegram bot ayrılsın?', text: 'Xatırlatmalar və Məclisin rəyləri artıq Telegrama gəlməyəcək.', okLabel: 'Ayır', danger: true }).then(function (ok) {
            if (!ok) return;
            sset('tg-link', { linked: false });
            if (V) { drawTg(); syncSummaries(); }
            toast('Telegram bot ayrıldı', 'info');
          });
        });
        tgBox.appendChild(h('div', { class: 'settings-row' },
          h('div', { class: 'tx' }, h('b', null, (t.handle || 'Telegram') + ' ', h('span', { class: 'badge green', text: 'Qoşulub' })),
            h('small', { text: 'Bildirişlər @MirzeBot vasitəsilə gəlir' + (t.since ? ' · ' + fmtDate(t.since) + ' tarixindən' : '') })),
          h('div', { class: 'ctl' }, test, off)));
        return;
      }
      if (!tgCode || tgCode.exp < Date.now()) tgCode = newCode();
      var codeB = h('b', { text: tgCode.code });
      var left = h('small');
      function tick() {
        var ms = tgCode.exp - Date.now();
        if (ms <= 0) { tgCode = newCode(); codeB.textContent = tgCode.code; ms = tgCode.exp - Date.now(); }
        var s = Math.ceil(ms / 1000);
        left.textContent = 'Kod ' + Math.floor(s / 60) + ':' + pad2(s % 60) + ' ərzində etibarlıdır';
      }
      tick();
      codeTimer = setInterval(function () { if (!V || !codeB.isConnected) { clearInterval(codeTimer); return; } tick(); }, 1000);
      V.secTimers.push(codeTimer);
      var copy = h('button', { class: 'btn btn-sm btn-secondary', type: 'button' }, ie('copy'), 'Kopyala');
      copy.addEventListener('click', function () {
        var done = function () { toast('Kod kopyalandı', 'ok', { sub: tgCode.code }); };
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(tgCode.code).then(done, function () { toast('Kodu əl ilə köçürün', 'warn', { sub: tgCode.code }); });
          else toast('Kodu əl ilə köçürün', 'warn', { sub: tgCode.code });
        } catch (e) { toast('Kodu əl ilə köçürün', 'warn', { sub: tgCode.code }); }
      });
      var renew = h('button', { class: 'icon-btn sm ghost', type: 'button', 'aria-label': 'Yeni kod', title: 'Yeni kod', html: App.icon('refresh') });
      renew.addEventListener('click', function () { tgCode = newCode(); codeB.textContent = tgCode.code; tick(); toast('Yeni kod yaradıldı', 'info'); });
      var verify = h('button', { class: 'btn btn-sm btn-primary', type: 'button' }, 'Bağlantını yoxla');
      verify.addEventListener('click', function () {
        busy(verify, true);
        later(function () {
          busy(verify, false);
          var handle = App.profile().telegram || '';
          sset('tg-link', { linked: true, handle: handle, since: new Date().toISOString() });
          tgCode = null;
          if (!V) return;
          drawTg(); syncSummaries();
          toast('Telegram bot qoşuldu', 'ok', { sub: '@MirzeBot artıq sizə yazacaq', icon: 'telegram' });
          nz('celebrate', 'Artıq Telegramda da yanınızdayam.', 2800);
        }, 1600);
      });
      tgBox.appendChild(h('div', { class: 'settings-row is-block' },
        h('ol', { class: 'settings-steps' },
          h('li', null, 'Telegramda ', h('b', { text: '@MirzeBot' }), ' botunu açın və ', h('b', { text: 'Start' }), ' düyməsinə basın.'),
          h('li', null, 'Aşağıdakı kodu bota mesaj kimi göndərin.'),
          h('li', null, '«Bağlantını yoxla» düyməsinə basın.')),
        h('div', { class: 'settings-code' }, h('div', null, codeB, left), h('div', { class: 'settings-row2' }, renew, copy)),
        h('div', { class: 'row' }, verify)));
    }
    watch('local', drawTg);
    drawTg();

    return h('div', { class: 'settings-sec-part' }, remind, tgCard);
  }
  /* ------------------------------------------------------------------
     15. SECTION: MƏXFİLİK
     ------------------------------------------------------------------ */
  function maskLine(on) {
    function tok(t) { return h('span', { class: 'settings-tok', text: t }); }
    if (!on) return h('span', null, 'Cənab Rəşad Əliyev 12 500 AZN məbləğini 15.11.2026 tarixinədək ödəməlidir.');
    return h('span', null, 'Cənab ', tok('AD_1'), ' ', tok('MƏBLƏĞ_1'), ' AZN məbləğini ', tok('TARİX_1'), ' tarixinədək ödəməlidir.');
  }
  function secPrivacy() {
    var localNote = h('small');
    function drawLocal() {
      localNote.textContent = Dr.local
        ? 'Layihələr, tərcümə yaddaşı və lüğət yalnız bu cihazda saxlanılır. Bulud sinxronizasiyası və Telegram bot dayanır; tərcümə üçün yalnız seçdiyiniz seqment şifrəli kanalla göndərilir və saxlanılmır.'
        : 'Bulud rejimi: layihələr şifrələnmiş şəkildə saxlanılır və cihazlarınız arasında sinxronlaşır. Mətnləriniz modelləri öyrətmək üçün istifadə olunmur.';
    }
    watch('local', drawLocal); drawLocal();
    var localRow = switchRow('local', 'Lokal rejim', null, 'lock', 'green', { extra: localNote });

    var maskOut = h('span', { class: 'tgt' }, maskLine(Dr.mask));
    var maskK = h('span', { class: 'k' });
    function drawMask() {
      maskK.textContent = Dr.mask ? 'Göndərilən mətn' : 'Olduğu kimi göndərilir';
      maskOut.textContent = ''; maskOut.appendChild(maskLine(Dr.mask));
      maskOut.classList.remove('swap'); void maskOut.offsetWidth; maskOut.classList.add('swap');
    }
    drawMask(); watch('mask', drawMask);
    var maskEx = h('div', { class: 'settings-ex block', 'aria-live': 'polite' }, maskK, maskOut);
    var maskRow = switchRow('mask', 'Adları və rəqəmləri maskala', 'AI-a göndərməzdən əvvəl şəxs adları, məbləğlər, tarixlər və hesab nömrələri yer tutucularla əvəz olunur; cavab gələndə öz yerinə qaytarılır.', 'eyeoff', '', { extra: maskEx });

    var dataCard = card('Saxlama', null, [
      localRow,
      fieldBox('retention', 'Avtomatik silmə', selectCtl('retention', RETENTION), { hint: 'Tamamlanmış layihələrin mətnləri silinir; lüğət və tərcümə yaddaşı qalır.' })
    ]);
    var aiCard = card('Süni intellekt', null, [maskRow], { opt: 'mask' });
    return h('div', { class: 'settings-sec-part' }, dataCard, aiCard);
  }

  /* ------------------------------------------------------------------
     16. SECTION: MƏLUMATLAR — export + delete
     ------------------------------------------------------------------ */
  /* export: a real JSON file of everything Nuanza keeps in this browser */
  function exportJson() {
    var data = {};
    try {
      var ls = W.localStorage;
      for (var i = 0; i < ls.length; i++) {
        var k = ls.key(i);
        if (k && k.indexOf('nuanza2:') === 0 && k !== 'nuanza2:code') { var raw = ls.getItem(k); try { data[k.slice(8)] = JSON.parse(raw); } catch (e) { data[k.slice(8)] = raw; } }
      }
    } catch (e) { /* storage blocked */ }
    var file = 'nuanza-' + isoToday() + '.json';
    try {
      var blob = new Blob([JSON.stringify({ app: 'Mirzə', exported: new Date().toISOString(), data: data }, null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob), a = h('a', { href: url, download: file });
      D.body.appendChild(a); a.click(); a.remove();
      later(function () { URL.revokeObjectURL(url); }, 4000);
      toast('Yükləndi', 'ok', { sub: file, icon: 'download' });
    } catch (e) { toast('Fayl yaradılmadı', 'warn', { sub: 'Brauzer yükləməyə icazə vermədi' }); }
  }
  function storageUse() {
    var n = 0, bytes = 0;
    try {
      var ls = W.localStorage;
      for (var i = 0; i < ls.length; i++) { var k = ls.key(i); if (k && k.indexOf('nuanza2:') === 0) { n++; bytes += k.length + String(ls.getItem(k) || '').length; } }
    } catch (e) { return null; }
    return { n: n, kb: Math.max(1, Math.round(bytes * 2 / 1024)) };
  }
  function secData() {
    var use = storageUse();
    var exportCard = card('İxrac', 'Giriş kodu ixraca daxil edilmir.', [
      rowEl('Yerli məlumat', use ? num(use.n) + ' qeyd · təxminən ' + num(use.kb) + ' KB · bu brauzerdə' : 'Brauzer yaddaşına giriş yoxdur.', null),
      rowEl('Məlumatlarımı ixrac et', 'JSON faylı: profil, layihələr, lüğət və ayarlar.', h('button', { class: 'btn btn-sm btn-secondary', type: 'button', onclick: exportJson }, ie('download'), 'İxrac et'), { opt: 'export' })
    ], { opt: 'export' });

    var wipeBtn = h('button', { class: 'btn btn-sm btn-danger', type: 'button' }, 'Hər şeyi sil');
    wipeBtn.addEventListener('click', function () { wipeAll(wipeBtn); });
    var danger = card('Təhlükəli zona', null, [
      rowEl('Bütün məlumatları sil', 'Layihələr, tərcümə yaddaşı, lüğət, Akademiya irəliləyişi və ayarlar bu cihazdan həmişəlik silinəcək. Əvvəlcə ixrac etməyi tövsiyə edirik.', wipeBtn)
    ], { opt: 'wipe', cls: 'settings-danger' });

    return h('div', { class: 'settings-sec-part' }, exportCard, danger);
  }
  function isoToday() { var d = new Date(); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  function isSil(v) { v = String(v || '').trim(); return upper(v) === 'SİL' || v.toUpperCase() === 'SIL'; }
  function wipeAll(btn) {
    var inp = h('input', { class: 'input', id: uid('wipe'), autocomplete: 'off', spellcheck: 'false', autocapitalize: 'characters', placeholder: 'SİL', 'aria-describedby': null });
    var text = h('div', { class: 'settings-wipe' },
      h('span', { text: 'Layihələr, tərcümə yaddaşı, lüğət, Akademiya irəliləyişi və bütün ayarlar bu cihazdan silinəcək. Bu əməliyyat geri qaytarılmır.' }),
      h('label', { for: inp.id }, 'Təsdiq üçün ', h('b', { text: 'SİL' }), ' yazın'), inp);
    var pr = App.confirm({ title: 'Hər şey silinsin?', text: text, okLabel: 'Hər şeyi sil', danger: true });
    var dlg = inp.closest ? inp.closest('.dialog') : null;
    var ok = dlg ? dlg.querySelector('.dialog-f .btn-danger') : null;
    if (ok) {
      ok.disabled = true;
      inp.addEventListener('input', function () { ok.disabled = !isSil(inp.value); inp.removeAttribute('aria-invalid'); });
      inp.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        if (isSil(inp.value)) ok.click(); else inp.setAttribute('aria-invalid', 'true');
      });
      later(function () { focusEl(inp); }, 120);
    }
    pr.then(function (yes) {
      if (!yes || !isSil(inp.value)) { if (!yes) nz('success', null, 1400); return; }
      busy(btn, true);
      nz('worried', null, 1400);
      later(function () {
        busy(btn, false);
        wipeStorage();
        R.style.removeProperty('font-size'); R.removeAttribute('data-density');
        tgCode = null;
        if (V) { S0 = loadSaved(); Dr = clone(S0); }
        toast('Bütün məlumatlar silindi', 'ok', { sub: 'Mirzə ilk açılışdakı vəziyyətindədir' });
        later(function () {
          if (App.go) App.go('home');
          later(function () { if (App.onboarding) App.onboarding(); }, 350);
        }, 900);
      }, 1400);
    });
  }
  function wipeStorage() {
    var keys = ['profile', 'prefs', 'ui', 'companion', 'theme', 'motion', 'mode', 'onboarded', 'logins', 'sessions-out', 'tg-link', 'billing',
      'glossary-user', 'translate-history', 'translate-last', 'translate-state'];
    try {
      var ls = W.localStorage;
      for (var i = 0; i < ls.length; i++) { var k = ls.key(i); if (k && k.indexOf('nuanza2:') === 0) { var kk = k.slice(8); if (keys.indexOf(kk) < 0) keys.push(kk); } }
    } catch (e) { /* storage blocked */ }
    keys.forEach(function (k) {
      try { if (App.store && typeof App.store.remove === 'function') App.store.remove(k); else W.localStorage.removeItem('nuanza2:' + k); } catch (e) { /* ignore */ }
    });
  }

  /* ------------------------------------------------------------------
     17. SECTION: KLAVİATURA QISAYOLLARI
     ------------------------------------------------------------------ */
  function secShortcuts() {
    var rows = [];
    var groups = [];
    SHORTCUTS.forEach(function (g) {
      var tbody = h('tbody');
      g.rows.forEach(function (r) {
        var kb = [];
        r[0].forEach(function (k, i) {
          if (i) kb.push(h('span', { class: 'plus', 'aria-hidden': 'true', text: '+' }));
          kb.push(h('kbd', { class: 'kbd', 'data-k': k, text: k }));
        });
        var tr = h('tr', null, h('td', { text: r[1] }), h('td', null, kb));
        tr._keys = r[0];
        rows.push(tr); tbody.appendChild(tr);
      });
      groups.push(card(g.grp, null, [h('div', { class: 'settings-raw' }, h('table', { class: 'settings-keys', 'aria-label': g.grp }, tbody))], g === SHORTCUTS[0] ? { opt: 'keys' } : null));
    });
    V.keyRows = rows;
    V.keyDown = {};
    return h('div', { class: 'settings-sec-part' },
      h('p', { class: 'settings-foot', text: 'Düymələri basın — uyğun qısayol cədvəldə işıqlanacaq.' }),
      groups,
      card(null, null, [rowEl('Qısa siyahı', 'İstənilən ekranda «?» basaraq açılır.', h('button', { class: 'btn btn-sm btn-secondary', type: 'button', onclick: function () { if (App.shortcuts) App.shortcuts(); } }, 'Aç'))]));
  }
  function keyName(e) {
    var k = e.key;
    if (k === 'Control') return 'Ctrl';
    if (k === 'Meta') return '⌘';
    if (k === 'Alt' || k === 'AltGraph') return 'Alt';
    if (k === 'Shift') return 'Shift';
    if (k === 'Escape' || k === 'Esc') return 'Esc';
    if (k === 'Enter') return 'Enter';
    if (k === 'ArrowDown') return '↓';
    if (k === 'ArrowUp') return '↑';
    if (k === '?' || k === '/') return k;
    if (e.code && /^Key[A-Z]$/.test(e.code)) return e.code.slice(3);
    return k && k.length === 1 ? k.toUpperCase() : k;
  }
  function paintKeys() {
    if (!V || !V.keyRows) return;
    var down = V.keyDown;
    each(V.secEl ? V.secEl.querySelectorAll('.settings-keys .kbd') : [], function (kb) { kb.classList.toggle('on', !!down[kb.getAttribute('data-k')]); });
    V.keyRows.forEach(function (tr) {
      var all = tr._keys.every(function (k) { return down[k]; });
      if (all && !tr.classList.contains('hit')) { tr.classList.add('hit'); later(function () { tr.classList.remove('hit'); }, 900); }
    });
  }

  /* ------------------------------------------------------------------
     18. SECTION: HAQQINDA
     ------------------------------------------------------------------ */
  var LEGAL = {
    privacy: { title: 'Məxfilik siyasəti', paras: [
      'Mirzə mətnlərinizi yalnız tərcümə və yoxlama üçün emal edir. Mətnləriniz süni intellekt modellərini öyrətmək üçün istifadə olunmur.',
      'Bulud rejimində məlumatlar şifrələnmiş şəkildə saxlanılır. Lokal rejimdə isə cihazınızdan çıxmır.',
      'Maskalama aktiv olanda şəxs adları, məbləğlər, tarixlər və hesab nömrələri AI-a göndərilməzdən əvvəl yer tutucularla əvəz olunur.',
      'İstənilən vaxt bütün məlumatlarınızı ixrac edə və ya həmişəlik silə bilərsiniz.'] },
    terms: { title: 'İstifadə şərtləri', paras: [
      'Tərcümələrin müəllif hüquqları sizə və ya sifarişçinizə məxsusdur. Mirzə alət rolunu oynayır və tərcümə üzərində hüquq iddia etmir.',
      'Notarial və hüquqi sənədlərdə yekun məsuliyyət imzalayan tərcüməçinin üzərindədir. Mirzə Məclisinin rəyi tövsiyə xarakterlidir.'] },
    licenses: { title: 'Açıq mənbə lisenziyaları', paras: [
      'Inter, JetBrains Mono və Plus Jakarta Sans şriftləri — SIL Open Font License 1.1.',
      'Göl motivi Mirzə komandası tərəfindən çəkilib.',
      'Nuanza və Mirzə Məclisi personajları — © 2026 Mirzə, Bakı.',
      'Akademiyadakı real xəbər mətnləri — NTREX-128 (Microsoft), CC BY-SA 4.0; səhv annotasiyaları və düzəldilmiş tərcümələr Mirzənindir və eyni lisenziya (CC BY-SA 4.0) ilə paylaşılır.',
      'İnsan Hüquqları haqqında Ümumi Bəyannamə (BMT, 1948) — rəsmi ingilis mətni və rəsmi Azərbaycan tərcüməsi.'] }
  };
  function legalSheet(id) {
    var L = LEGAL[id];
    App.sheet({ title: L.title, body: h('div', { class: 'prose' }, L.paras.map(function (t) { return h('p', { text: t }); }),
      h('p', { class: 'small muted', text: 'Son yenilənmə: 7 oktyabr 2026' })), actions: [{ label: 'Bağla', kind: 'primary' }] });
  }
  function feedbackSheet() {
    var kind = 'idea', rating = 0;
    var kinds = segCtl('fbKind', [{ id: 'idea', label: 'Təklif' }, { id: 'bug', label: 'Xəta' }, { id: 'thanks', label: 'Təşəkkür' }], {
      get: function () { return kind; }, set: function (v) { kind = v; ta.placeholder = PH[v]; }, label: 'Rəyin növü', block: true, noId: true });
    var PH = {
      idea: 'Məsələn: hüquqi üslubda «shall» həmişə «-məlidir» kimi verilsin.',
      bug: 'Nə etdiniz, nə gözləyirdiniz və nə baş verdi?',
      thanks: 'Mirzədə ən çox nəyi bəyənirsiniz?'
    };
    var taId = uid('fb');
    var ta = h('textarea', { class: 'textarea', id: taId, placeholder: PH.idea, maxlength: '1000', 'aria-describedby': taId + '-c ' + taId + '-e' });
    var cnt = h('span', { class: 'hint', id: taId + '-c', text: '0 / 1000' });
    var err = h('span', { class: 'err', id: taId + '-e', role: 'alert', hidden: true });
    ta.addEventListener('input', function () { cnt.textContent = ta.value.length + ' / 1000'; if (ta.value.trim().length >= 10) { err.hidden = true; ta.removeAttribute('aria-invalid'); } });
    var stars = h('div', { class: 'settings-stars', role: 'radiogroup', 'aria-label': 'Mirzəni qiymətləndirin' });
    var STAR_TX = ['', 'Pis', 'Orta', 'Yaxşı', 'Çox yaxşı', 'Əla'];
    var starTx = h('span', { class: 'small muted', 'aria-live': 'polite' });
    [1, 2, 3, 4, 5].forEach(function (i) {
      var b = h('button', { type: 'button', role: 'radio', 'aria-checked': 'false', 'aria-label': i + ' ulduz' }, h('span', { 'aria-hidden': 'true' }));
      b.addEventListener('click', function () {
        rating = i;
        each(stars.children, function (x, j) { x.classList.toggle('on', j < i); x.setAttribute('aria-checked', String(j + 1 === i)); });
        starTx.textContent = STAR_TX[i];
      });
      stars.appendChild(b);
    });
    var incId = uid('fbinc');
    var inc = h('input', { type: 'checkbox', id: incId, checked: true });
    var body = h('div', { class: 'stack' },
      kinds,
      h('div', { class: 'field' }, h('label', { for: taId }, 'Rəyiniz'), ta, h('div', { class: 'row between' }, err, cnt)),
      h('div', { class: 'field' }, h('span', { class: 'label' }, 'Qiymətiniz'), h('div', { class: 'row' }, stars, starTx)),
      h('div', { class: 'list-row' }, h('span', { class: 'tx' }, h('b', { text: 'Texniki məlumatı əlavə et' }), h('small', { text: 'Versiya, brauzer və ekran ölçüsü. Mətnləriniz göndərilmir.' })),
        h('span', { class: 'end' }, h('label', { class: 'switch', 'aria-label': 'Texniki məlumatı əlavə et' }, inc, h('span', { 'aria-hidden': 'true' })))));
    App.sheet({
      title: 'Rəy göndər', body: body,
      actions: [{ label: 'Ləğv et', kind: 'ghost' }, { label: 'Göndər', kind: 'primary', onClick: function () {
        if (ta.value.trim().length < 10) {
          err.textContent = ''; err.appendChild(ie('alert')); err.appendChild(D.createTextNode('Bir-iki cümlə yazın — ən azı 10 simvol.'));
          err.hidden = false; ta.setAttribute('aria-invalid', 'true'); focusEl(ta);
          return false;
        }
        return new Promise(function (res) {
          later(function () {
            res(true);
            toast('Rəyiniz göndərildi', 'ok', { sub: 'Təşəkkür edirik. Komanda 2 iş günü ərzində baxacaq.' });
            nz('success', null, 1600);
            void rating;
          }, 1100);
        });
      } }]
    });
  }
  function linkRow(title, sub, onClick, o) {
    o = o || {};
    var b = h('button', { class: 'settings-row settings-link-row', type: 'button', 'data-opt': o.opt || null, onclick: onClick },
      h('div', { class: 'tx' }, h('b', { text: title }), sub ? h('small', { text: sub }) : null),
      h('div', { class: 'ctl' }, ie(o.icon || 'chevron')));
    return b;
  }
  function secAbout() {
    var ver = App.version || '3.0';
    var upd = h('button', { class: 'btn btn-sm btn-secondary', type: 'button' }, 'Yenilikləri yoxla');
    upd.addEventListener('click', function () {
      busy(upd, true);
      later(function () { busy(upd, false); toast('Ən son versiyadasınız', 'ok', { sub: 'Mirzə ' + ver }); }, 1200);
    });
    var app = card(null, null, [
      h('div', { class: 'settings-row settings-app', 'data-opt': 'version' },
        h('span', { class: 'logo-wrap', html: App.logo ? App.logo('logo') : '' }),
        h('div', { class: 'tx' }, h('b', { text: 'Mirzə' }), h('small', { text: 'Versiya ' + ver + ' · tərcüməçinin iş masası' })),
        h('div', { class: 'ctl' }, upd))
    ]);
    function kv(k, v) { return h('div', { class: 'settings-row' }, h('dl', { class: 'settings-kv', style: 'width:100%' }, h('dt', { text: k }), h('dd', { text: v }))); }
    var info = card('Texniki məlumat', null, [
      kv('Mühərrik', 'Mirzə Məclisi · 5 redaktor'),
      kv('Dillər', 'AZ · EN · RU · TR'),
      kv('Telegram bot', '@MirzeBot'),
      kv('Cihaz', detectDevice())
    ]);
    var CHANGES = [
      ['3.0', 'Noyabr 2026', 'Yeni ad — Mirzə. Yeni iş masası, Kitabxana, 7 peşəkar sahə, «Səhvi tap».'],
      ['2.0', 'Oktyabr 2026', 'Mirzə Məclisi, Akademiya rejimi və köməkçi Nuanza.'],
      ['1.6', 'İyul 2026', 'Telegram bot, TMX/TBX ixracı və lokal rejim.'],
      ['1.4', 'Aprel 2026', 'Türk formalarının aşkarlanması və üslubun avtomatik tanınması.']
    ];
    var news = card('Yeniliklər', null, CHANGES.map(function (c) {
      return h('div', { class: 'settings-row', style: 'flex-wrap:nowrap;align-items:flex-start' }, h('span', { class: 'settings-ver', text: c[0] }),
        h('div', { class: 'tx' }, h('b', { text: c[1] }), h('small', { text: c[2] })));
    }));
    var help = card('Kömək', null, [
      linkRow('Rəy göndər', 'Təklif, xəta və ya təşəkkür.', feedbackSheet, { opt: 'feedback' }),
      linkRow('Girişi yenidən göstər', 'Rejim, dil cütləri və ad — ilk quraşdırma.', function () { if (App.onboarding) App.onboarding(); }, { opt: 'intro' })
    ]);
    var legal = card('Hüquqi', null, [
      linkRow('Məxfilik siyasəti', null, function () { legalSheet('privacy'); }, { opt: 'legal' }),
      linkRow('İstifadə şərtləri', null, function () { legalSheet('terms'); }),
      linkRow('Lisenziyalar', null, function () { legalSheet('licenses'); })
    ]);
    return h('div', { class: 'settings-sec-part' }, app, info, news, help, legal);
  }

  var BUILD = {
    account: function () { return [secAccount(), secWork(), secNotifications()]; },
    appearance: secAppearance, language: secLanguage, translation: secTranslation, ai: secAI,
    privacy: secPrivacy, shortcuts: secShortcuts, data: secData, about: secAbout
  };

  /* ------------------------------------------------------------------
     19. NAV, SEARCH, SUMMARIES
     ------------------------------------------------------------------ */
  function summaryOf(id) {
    try {
      if (id === 'account') return draftName() || Dr.email || 'Profil, iş profili, bildirişlər';
      if (id === 'appearance') { var t = curTheme(); var mo = App.motion ? App.motion() : 'full'; return ({ system: 'Sistem', light: 'İşıqlı', dark: 'Qaranlıq' }[t] || '') + ' · şrift ' + uiCfg().fontScale + '%' + (mo === 'reduce' ? ' · az animasiya' : mo === 'system' ? ' · animasiya sistemə görə' : ''); }
      if (id === 'language') { var l = uiCfg().lang; return ({ az: 'Azərbaycan', en: 'English', ru: 'Русский' }[l] || 'Azərbaycan') + ' · müraciət: ' + ((ADDRS.filter(function (a) { return a.id === Dr.address; })[0] || ADDRS[0]).label); }
      if (id === 'translation') return (REG_SHORT[Dr.register] || '') + (Dr.enforceTerms ? ' · termin bazası məcburi' : '');
      if (id === 'ai') { var c = compCfg(); return (Q_SHORT[Dr.quality] || '') + ' · Nuanza ' + (c.show ? 'görünür' : 'gizli'); }
      if (id === 'privacy') return Dr.local ? 'Lokal rejim' : (Dr.mask ? 'Bulud · maskalama aktiv' : 'Bulud rejimi');
      if (id === 'shortcuts') { var n = 0; SHORTCUTS.forEach(function (g) { n += g.rows.length; }); return n + ' qısayol'; }
      if (id === 'data') return 'İxrac və silmə';
      if (id === 'about') return 'Mirzə ' + (App.version || '3.0');
    } catch (e) { /* ignore */ }
    return '';
  }
  function syncSummaries() {
    if (!V || !V.navSmall) return;
    SECTIONS.forEach(function (s) { var el = V.navSmall[s.id]; if (el) el.textContent = summaryOf(s.id); });
  }
  function buildNav() {
    V.navRows = {}; V.navSmall = {}; V.navDot = {};
    var wrap = h('div', { class: 'settings-groups' });
    GROUPS.forEach(function (g) {
      var list = h('div', { class: 'settings-navgrp', role: 'group', 'aria-label': g });
      SECTIONS.filter(function (s) { return s.grp === g; }).forEach(function (s) {
        var sm = h('small');
        var dot = h('span', { class: 'settings-dot', hidden: true, title: 'Saxlanılmamış dəyişiklik' }, h('span', { class: 'sr-only', text: 'saxlanılmamış dəyişiklik var' }));
        var lead;
        if (s.id === 'account') { V.navAv = h('span', { class: 'settings-av', 'aria-hidden': 'true' }, avParts('')); V.navAv._base = 'settings-av'; lead = V.navAv; }
        else lead = h('span', { class: 'settings-nav-ic', 'aria-hidden': 'true', html: App.icon(s.icon) });
        var b = h('button', { class: 'settings-nav-row', type: 'button', 'data-sec': s.id },
          lead, h('span', { class: 'tx' }, h('b', { text: s.title }), sm), h('span', { class: 'end' }, dot, ie('chevron', 'chev')));
        var chev = b.querySelector('.end svg'); if (chev) chev.classList.add('chev');
        b.addEventListener('click', function () { openSection(s.id); });
        V.navRows[s.id] = b; V.navSmall[s.id] = sm; V.navDot[s.id] = dot;
        list.appendChild(b);
      });
      wrap.appendChild(list);
    });
    wrap.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      var rows = Array.prototype.slice.call(wrap.querySelectorAll('.settings-nav-row'));
      var i = rows.indexOf(D.activeElement); if (i < 0) return;
      e.preventDefault();
      var nx = rows[(i + (e.key === 'ArrowDown' ? 1 : -1) + rows.length) % rows.length];
      focusEl(nx);
      if (ST.wide) nx.click();
    });
    return wrap;
  }
  function markNav() {
    if (!V || !V.navRows) return;
    SECTIONS.forEach(function (s) {
      var b = V.navRows[s.id]; if (!b) return;
      if (ST.wide && ST.sec === s.id) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
  }
  function markText(label, toks) {
    var f = fold(label), best = -1, len = 0;
    toks.forEach(function (t) { var i = f.indexOf(t); if (i >= 0 && (best < 0 || i < best)) { best = i; len = t.length; } });
    if (best < 0 || f.length !== label.length) return label;
    return [label.slice(0, best), h('mark', { class: 'settings-mk', text: label.slice(best, best + len) }), label.slice(best + len)];
  }
  function runSearch() {
    if (!V) return;
    var raw = V.search.value, q = fold(raw.trim());
    ST.q = raw;
    if (!q) { V.groups.hidden = false; V.results.hidden = true; V.results.textContent = ''; V.srStatus.textContent = ''; return; }
    var toks = q.split(/\s+/).filter(Boolean);
    function hit(str) { var f = fold(str); return toks.every(function (t) { return f.indexOf(t) >= 0; }); }
    var out = [];
    SECTIONS.forEach(function (s) {
      if (hit(s.title + ' ' + s.desc + ' ' + s.kw)) out.push({ sec: s.id, label: s.title, score: fold(s.title).indexOf(toks[0]) === 0 ? 0 : 2 });
    });
    OPTS.forEach(function (o) {
      var s = SEC[o[0]];
      if (hit(o[2] + ' ' + o[3] + ' ' + s.title)) out.push({ sec: o[0], opt: o[1], label: o[2], score: fold(o[2]).indexOf(toks[0]) === 0 ? 1 : fold(o[2]).indexOf(toks[0]) > 0 ? 3 : 4 });
    });
    out.sort(function (a, b) { return a.score - b.score; });
    out = out.slice(0, 14);
    V.groups.hidden = true; V.results.hidden = false; V.results.textContent = '';
    V.srStatus.textContent = out.length ? out.length + ' nəticə' : 'Heç nə tapılmadı';
    if (!out.length) {
      V.results.appendChild(h('div', { class: 'settings-noresult' },
        h('b', { text: '«' + raw.trim() + '» tapılmadı' }),
        h('span', { text: 'Başqa sözlə yoxlayın: «tema», «VÖEN», «Telegram» və ya «maskala».' })));
      return;
    }
    V.results.appendChild(h('div', { class: 'settings-navgrp' }, out.map(function (r) {
      var s = SEC[r.sec];
      var b = h('button', { class: 'settings-nav-row settings-res-row', type: 'button' }, h('span', { class: 'settings-nav-ic', 'aria-hidden': 'true', html: App.icon(s.icon) }),
        h('span', { class: 'tx' }, h('b', null, markText(r.label, toks)), h('small', { text: r.opt ? s.title : 'Bölmə' })),
        h('span', { class: 'end' }, ie('chevron')));
      b.addEventListener('click', function () { openSection(r.sec, { opt: r.opt }); });
      return b;
    })));
  }

  /* ------------------------------------------------------------------
     20. NAVIGATION INSIDE THE SCREEN
     ------------------------------------------------------------------ */
  function destroySection() {
    if (!V) return;
    (V.insts || []).forEach(function (i) { try { if (i && i.destroy) i.destroy(); } catch (e) { /* ignore */ } });
    V.insts = [];
    (V.secTimers || []).forEach(function (t) { clearInterval(t); clearTimeout(t); });
    V.secTimers = [];
    V.keyRows = null; V.onTheme = null;
    V.heroName = null; V.heroAv = null;
    WATCH = {}; ERR = {};
  }
  function renderSection(o) {
    o = o || {};
    if (!V || !ST.sec) return;
    destroySection();
    var s = SEC[ST.sec], body;
    try { body = BUILD[s.id](); }
    catch (e) {
      try { console.error('[Nuanza settings]', e); } catch (x) { /* ignore */ }
      body = h('div', { class: 'settings-noresult' }, h('b', { text: 'Bu bölmə açılmadı' }), h('span', { text: 'Səhifəni yeniləyin və ya bir az sonra yenidən cəhd edin.' }));
    }
    V.secTitle = h('h2', { tabindex: '-1', text: s.title });
    var head = h('div', { class: 'settings-subh' },
      h('button', { class: 'btn btn-ghost btn-sm settings-back', type: 'button', onclick: goBack }, ie('back'), 'Ayarlar'),
      V.secTitle, h('p', { text: s.desc }));
    var parts = [].concat(body);
    var sec = h('div', { class: 'settings-sec' + (o.noAnim ? '' : (ST.wide ? ' in' : ' in-r')), 'data-sec': s.id }, head);
    parts.forEach(function (p) {
      if (!p) return;
      if (p.classList && p.classList.contains('settings-sec-part')) { while (p.firstChild) sec.appendChild(p.firstChild); }
      else sec.appendChild(p);
    });
    V.main.textContent = '';
    V.main.appendChild(sec);
    V.secEl = sec;
    syncHero();
    if (V.pendingErrs) { showErrors(V.pendingErrs); V.pendingErrs = null; }
  }
  function openSection(id, o) {
    o = o || {};
    if (!V) return;
    id = secId(id);
    if (o.opt && OPT_SEC[o.opt] && OPT_SEC[o.opt] !== id && FIELD_SEC[o.opt] !== id) id = OPT_SEC[o.opt];
    if (!id || !SEC[id]) return;
    var prev = ST.sec;
    if (!ST.wide && !prev) ST.listScroll = W.scrollY || W.pageYOffset || 0;
    var same = prev === id && V.secEl && V.secEl.isConnected;
    ST.sec = id;
    V.page.setAttribute('data-view', 'sub');
    markNav();
    if (!same) renderSection(o);
    if (!ST.wide) {
      try {
        if (!prev && !o.noPush) { W.history.pushState({ nzSettings: id }, '', '#settings?s=' + id); ST.pushed = true; }
        else if (prev && !o.fromPop) W.history.replaceState(W.history.state, '', '#settings?s=' + id);
      } catch (e) { /* sandboxed */ }
    }
    if (!o.noScroll) {
      if (!ST.wide && !same) { try { W.scrollTo(0, 0); } catch (e) { /* ignore */ } }
      else ensureVisible();
    }
    if (o.opt) later(function () { focusOpt(o.opt); }, same ? 0 : 80);
    else if (!ST.wide && !o.noFocus && !same) later(function () { if (V && V.secTitle) focusEl(V.secTitle); }, 30);
  }
  function showList(o) {
    o = o || {};
    if (!V || ST.wide) return;
    var from = ST.sec;
    ST.sec = null;
    V.page.setAttribute('data-view', 'list');
    destroySection();
    V.main.textContent = '';
    V.secEl = null;
    markNav();
    if (!o.noAnim) { V.side.classList.remove('in-l'); void V.side.offsetWidth; V.side.classList.add('in-l'); }
    var y = ST.listScroll || 0;
    later(function () { try { W.scrollTo(0, y); } catch (e) { /* ignore */ } }, 0);
    if (from && V.navRows[from] && !o.noFocus) later(function () { if (V && V.navRows[from]) focusEl(V.navRows[from]); }, 30);
  }
  function goBack() {
    if (ST.pushed) {
      ST.pushed = false;
      try { W.history.back(); return; } catch (e) { /* fall through */ }
    }
    showList();
    try { W.history.replaceState(W.history.state, '', '#settings'); } catch (e) { /* sandboxed */ }
  }
  function ensureVisible() {
    if (!V || !V.wrap) return;
    var off = (V.hdrH || 70) + 16;
    var top = V.wrap.getBoundingClientRect().top + (W.scrollY || 0) - off;
    if ((W.scrollY || 0) > top + 4) { try { W.scrollTo({ top: Math.max(0, top), behavior: reduced() ? 'auto' : 'smooth' }); } catch (e) { W.scrollTo(0, top); } }
  }
  function focusOpt(opt) {
    if (!V || !V.main) return;
    var el = V.main.querySelector('[data-opt="' + opt + '"]');
    var ctl = byId('st-' + opt);
    if (!el && ctl) el = ctl.closest('.settings-row, .settings-grp') || ctl;
    if (!el) return;
    try { el.scrollIntoView({ block: 'center', behavior: reduced() ? 'auto' : 'smooth' }); } catch (e) { el.scrollIntoView(); }
    el.classList.remove('settings-flash'); void el.offsetWidth; el.classList.add('settings-flash');
    later(function () { if (el) el.classList.remove('settings-flash'); }, 2000);
    var f = (ctl && /^(INPUT|SELECT|TEXTAREA)$/.test(ctl.tagName)) ? ctl : el.querySelector('input:not([type="hidden"]), select, textarea, button');
    later(function () { focusEl(f); }, reduced() ? 0 : 280);
  }
  function measureWide() { return V.page.clientWidth >= 740; }
  function onResize() {
    if (!V || !V.page.isConnected) return;
    var wide = measureWide();
    if (wide !== ST.wide) {
      ST.wide = wide;
      V.page.classList.toggle('is-wide', wide);
      if (wide && !ST.sec) openSection('account', { noPush: true, noScroll: true, noAnim: true, noFocus: true });
      markNav(); updateDirty();
    }
    liftCalc();
  }
  function liftCalc() {
    if (!V || !V.page.isConnected) return;
    var c = compCfg(), lift = 0;
    if (c.show) {
      var r = V.page.getBoundingClientRect(), dw = dockPx(c.size);
      if (W.innerWidth - (r.right - 16) < dw + 28) lift = dw + 14;
    }
    V.page.style.setProperty('--settings-lift', lift + 'px');
  }

  /* ------------------------------------------------------------------
     21. DIRTY BAR, SAVE, CANCEL
     ------------------------------------------------------------------ */
  function updateDirty() {
    if (!V || !V.bar) return;
    var keys = dirtyKeys(), n = keys.length, secs = secsOf(keys);
    V.bar.classList.toggle('on', n > 0);
    V.bar.setAttribute('aria-hidden', String(!n));
    var names = secs.map(function (s) { return SEC[s].title; }).join(', ');
    V.barB.textContent = ST.wide ? 'Saxlanılmamış dəyişikliklər' : n + ' dəyişiklik';
    V.barS.textContent = ST.wide ? n + ' dəyişiklik · ' + names : names;
    SECTIONS.forEach(function (s) { var d = V.navDot[s.id]; if (d) d.hidden = secs.indexOf(s.id) < 0; });
    syncSummaries();
    syncHero();
  }
  function save() {
    if (!V) return;
    var keys = dirtyKeys();
    if (!keys.length) { toast('Saxlanılacaq dəyişiklik yoxdur', 'info'); return; }
    var errs = validate(), ek = Object.keys(errs);
    if (ek.length) {
      var first = ek[0], sec = FIELD_SEC[first];
      if (sec && sec !== ST.sec) { V.pendingErrs = errs; openSection(sec, { opt: first }); }
      else { showErrors(errs); focusOpt(first); }
      V.bar.classList.remove('shake'); void V.bar.offsetWidth; V.bar.classList.add('shake');
      toast(ek.length === 1 ? 'Bir sahədə düzəliş lazımdır' : ek.length + ' sahədə düzəliş lazımdır', 'err', { sub: errs[first] });
      nz('worried', null, 1600);
      return;
    }
    busy(V.saveBtn, true);
    later(function () { if (!V) return; busy(V.saveBtn, false); commit(keys); }, 450);
  }
  function decOrNull(v) { if (!String(v == null ? '' : v).trim()) return null; var n = parseDec(v); return isFinite(n) ? n : null; }
  function commit(keys) {
    TEXT_KEYS.forEach(function (k) { Dr[k] = String(Dr[k] == null ? '' : Dr[k]).trim(); });
    Dr.voen = Dr.voen.replace(/\s+/g, '');
    Dr.iban = Dr.iban.replace(/\s+/g, '').toUpperCase();
    saveProfile({
      name: draftName(), email: Dr.email, phone: Dr.phone, role: Dr.role,
      pairs: Dr.pairs.slice(), specialties: Dr.specialties.slice(),
      rate: decOrNull(Dr.rate), ratePage: decOrNull(Dr.ratePage), notarial: !!Dr.notarial, signName: Dr.signName,
      invoice: { voen: Dr.voen, addr: Dr.addr, bank: Dr.bank, iban: Dr.iban }
    });
    var pr = {}; PREF_KEYS.forEach(function (k) { pr[k] = Dr[k]; }); sset('prefs', pr);
    if (keys.indexOf('register') >= 0 || keys.indexOf('quality') >= 0) {
      var ts = sget('translate-state', null); ts = ts && typeof ts === 'object' ? ts : {};
      if (keys.indexOf('register') >= 0) ts.reg = Dr.register;
      if (keys.indexOf('quality') >= 0) ts.quality = Dr.quality;
      sset('translate-state', ts);
    }
    if (keys.indexOf('local') >= 0) { var t = tgLink(); if (Dr.local && t.linked) toast('Telegram bildirişləri dayandırıldı', 'info', { sub: 'Lokal rejimdə məlumat cihazdan çıxmır' }); }
    S0 = clone(Dr);
    TEXT_KEYS.forEach(function (k) { var el = byId('st-' + k); if (el && el.value !== Dr[k]) el.value = Dr[k]; });
    updateDirty();
    var names = secsOf(keys).map(function (s) { return SEC[s].title; });
    toast('Yadda saxlanıldı', 'ok', { sub: names.join(' · ') });
    nz('success', null, 1600);
  }
  function cancel() {
    if (!V) return;
    var keys = dirtyKeys(); if (!keys.length) return;
    var undo = clone(Dr);
    Dr = clone(S0);
    if (ST.sec) renderSection({ noAnim: true });
    updateDirty();
    toast('Dəyişikliklər ləğv edildi', 'info', { sub: keys.length + ' sahə əvvəlki vəziyyətinə qaytarıldı', action: { label: 'Geri qaytar', onClick: function () {
      if (!V) return;
      Dr = undo;
      if (ST.sec) renderSection({ noAnim: true });
      updateDirty();
    } } });
  }

  /* ------------------------------------------------------------------
     22. RENDER + LIFECYCLE
     ------------------------------------------------------------------ */
  function onDocKey(e) {
    if (!V || !V.page.isConnected) return;
    if ((e.ctrlKey || e.metaKey) && !e.altKey && (e.code === 'KeyS' || e.key === 's' || e.key === 'S')) {
      if (D.querySelector('.dialog.on, .onb, .mc')) return;
      e.preventDefault();
      save();
      return;
    }
    if (V.keyRows && e.type === 'keydown') { V.keyDown[keyName(e)] = true; paintKeys(); clearTimeout(V.keyClr); V.keyClr = later(function () { if (V) { V.keyDown = {}; paintKeys(); } }, 1600); }
    if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey && !isTyping(e.target) && !overlayOpen()) {
      e.preventDefault();
      if (!ST.wide && ST.sec) goBack();
      later(function () { if (V) focusEl(V.search); }, 60);
    }
  }
  function onDocKeyUp(e) {
    if (!V || !V.keyRows) return;
    delete V.keyDown[keyName(e)];
    if (e.key === 'Meta' || e.key === 'Control') V.keyDown = {};
    paintKeys();
  }
  function onBlurWin() { if (V && V.keyRows) { V.keyDown = {}; paintKeys(); } }
  function onPop() {
    if (!V || !V.page.isConnected) return;
    var hs = String(W.location.hash || '');
    if (hs.replace(/^#\/?/, '').split(/[?/]/)[0] !== 'settings') return;
    var m = /[?&]s=([^&]+)/.exec(hs), id = m ? decodeURIComponent(m[1]) : null;
    if (id) id = secId(id);
    if (id) { if (ST.sec !== id) openSection(id, { fromPop: true, noPush: true }); }
    else { ST.pushed = false; if (!ST.wide && ST.sec) showList(); }
  }

  function render(el, params) {
    params = params || {};
    App.css('settings', CSS);
    var now = Date.now(), keepSec = null;
    if (stash && now - stashAt < 500) { Dr = stash.dr; S0 = stash.s0; keepSec = stash.sec; }
    else if (restoreNext) { S0 = loadSaved(); Dr = restoreNext.dr; keepSec = restoreNext.sec; }
    else { S0 = loadSaved(); Dr = clone(S0); }
    stash = null; restoreNext = null;

    ST = { sec: null, wide: false, q: '', pushed: false, listScroll: 0 };
    V = { el: el, insts: [], secTimers: [], offs: [] };
    WATCH = {}; ERR = {};

    /* header */
    var head = h('div', { class: 'page-h settings-head' },
      h('div', null, h('h1', { text: 'Ayarlar' }),
        h('p', { text: 'Profil, iş üslubu və tətbiq. Formlar «Yadda saxla» basılana qədər qaralama kimi qalır.' })));

    /* side: search + nav + results */
    V.search = h('input', { class: 'input', type: 'search', id: 'st-search', placeholder: 'Ayarlarda axtar', autocomplete: 'off', spellcheck: 'false', 'aria-label': 'Ayarlarda axtar', 'aria-controls': 'st-results', enterkeyhint: 'search' });
    V.search.addEventListener('input', runSearch);
    V.search.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && V.search.value) { e.preventDefault(); e.stopPropagation(); V.search.value = ''; runSearch(); }
      else if (e.key === 'Enter') { var f = V.results.querySelector('.settings-res-row'); if (f) { e.preventDefault(); f.click(); } }
      else if (e.key === 'ArrowDown') { var g = V.results.querySelector('.settings-res-row') || V.groups.querySelector('.settings-nav-row'); if (g) { e.preventDefault(); focusEl(g); } }
    });
    V.results = h('div', { id: 'st-results', class: 'settings-results', hidden: true });
    V.results.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      var rows = Array.prototype.slice.call(V.results.querySelectorAll('.settings-res-row')), i = rows.indexOf(D.activeElement);
      if (i < 0) return;
      e.preventDefault();
      if (e.key === 'ArrowUp' && i === 0) { focusEl(V.search); return; }
      focusEl(rows[Math.min(rows.length - 1, Math.max(0, i + (e.key === 'ArrowDown' ? 1 : -1)))]);
    });
    V.srStatus = h('span', { class: 'sr-only', role: 'status', 'aria-live': 'polite' });
    V.groups = buildNav();
    V.side = h('nav', { class: 'settings-side', 'aria-label': 'Ayarlar bölmələri' },
      h('label', { class: 'input-ic settings-search' }, ie('search'), V.search), V.srStatus, V.groups, V.results);
    V.main = h('div', { class: 'settings-main', role: 'region', 'aria-label': 'Bölmə' });

    /* save bar */
    V.barB = h('b'); V.barS = h('small');
    V.saveBtn = h('button', { class: 'btn btn-primary btn-sm', type: 'button', onclick: save }, 'Yadda saxla', h('kbd', { class: 'kbd', 'aria-hidden': 'true', text: MOD + ' S' }));
    V.bar = h('div', { class: 'settings-savebar', role: 'region', 'aria-label': 'Yadda saxlanılmamış dəyişikliklər', 'aria-hidden': 'true' },
      h('span', { class: 'sb-ic', 'aria-hidden': 'true' }), h('span', { class: 'sb-tx' }, V.barB, V.barS),
      h('span', { class: 'sb-act' }, h('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: cancel }, 'Ləğv et'), V.saveBtn));

    V.wrap = h('div', { class: 'settings-wrap' }, V.side, V.main, V.bar);
    V.page = h('div', { class: 'page settings-page', 'data-view': 'list' }, head, V.wrap);
    el.appendChild(V.page);
    try { var hdr = D.querySelector('.hdr'); V.hdrH = hdr ? hdr.getBoundingClientRect().height : 70; } catch (e) { V.hdrH = 70; }

    /* initial view */
    ST.wide = measureWide();
    V.page.classList.toggle('is-wide', ST.wide);
    var want = secId(params.s || params.section || params.id || keepSec || null);
    if (want && params.opt && OPT_SEC[params.opt] && OPT_SEC[params.opt] !== want && FIELD_SEC[params.opt] !== want) want = OPT_SEC[params.opt];
    if (want) openSection(want, { noPush: true, noScroll: true, noAnim: true, noFocus: true });
    else if (ST.wide) openSection('account', { noPush: true, noScroll: true, noAnim: true, noFocus: true });
    else V.page.setAttribute('data-view', 'list');
    if (want && !ST.wide) { try { W.history.replaceState(W.history.state, '', '#settings?s=' + want); } catch (e) { /* sandboxed */ } }
    syncSummaries();
    updateDirty();
    liftCalc();
    if (params.opt && ST.sec) later(function () { focusOpt(params.opt); }, 120);

    /* listeners */
    D.addEventListener('keydown', onDocKey);
    D.addEventListener('keyup', onDocKeyUp);
    W.addEventListener('blur', onBlurWin);
    W.addEventListener('popstate', onPop);
    W.addEventListener('resize', onResize);
    if (typeof W.ResizeObserver === 'function') {
      try { V.ro = new W.ResizeObserver(function () { onResize(); }); V.ro.observe(V.page); } catch (e) { V.ro = null; }
    }
    if (typeof App.on === 'function') {
      V.offs.push(App.on('theme', function () { if (V && V.onTheme) V.onTheme(); syncSummaries(); }));
      V.offs.push(App.on('profile', function () {
        if (!V) return;
        if (selfWrite) { syncHero(); return; }
        var fresh = loadSaved();
        if (!dirtyKeys().length) { S0 = fresh; Dr = clone(fresh); if (ST.sec && !SEC[ST.sec].live) renderSection({ noAnim: true }); }
        else S0 = fresh;
        updateDirty();
      }));
    }
  }
  function leave() {
    if (!V) return;
    var keys = dirtyKeys();
    stash = { dr: clone(Dr), s0: clone(S0), sec: ST.sec }; stashAt = Date.now();
    if (keys.length) {
      var st = stash, n = keys.length;
      later(function () {
        if (App.current && App.current() === 'settings') return;
        toast('Dəyişikliklər yadda saxlanmadı', 'warn', { sub: n + ' sahə qaralamada qaldı', ms: 7000, action: { label: 'Qaytar', onClick: function () {
          restoreNext = st;
          if (App.go) App.go('settings', { s: st.sec || FIELD_SEC[keys[0]] || 'account' });
        } } });
      }, 40);
    }
    D.removeEventListener('keydown', onDocKey);
    D.removeEventListener('keyup', onDocKeyUp);
    W.removeEventListener('blur', onBlurWin);
    W.removeEventListener('popstate', onPop);
    W.removeEventListener('resize', onResize);
    try { if (V.ro) V.ro.disconnect(); } catch (e) { /* ignore */ }
    (V.offs || []).forEach(function (off) { try { if (typeof off === 'function') off(); } catch (e) { /* ignore */ } });
    destroySection();
    clearTimeout(V.keyClr);
    V = null;
  }

  App.register('settings', {
    title: 'Ayarlar',
    icon: 'settings',
    group: 'Hesab',
    mode: 'both',
    render: render,
    leave: leave
  });
})();
