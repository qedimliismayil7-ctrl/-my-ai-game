/* =====================================================================
   NUANZA — s-settings.js
   'settings' — Profil və ayarlar (hər iki rejim, «Hesab» qrupu).
     • Telefonda: axtarışlı bölmələr siyahısı → hər bölmə geri düyməli alt səhifə.
     • Geniş ekranda: solda yapışqan bölmə naviqasiyası, sağda bölmənin məzmunu.
     • Profil başlığı: xalça gölündə baş hərflər, rəng seçimi, profil tamlığı.
     • Bölmələr: Hesab · İş profili · Tərcümə · Nuanza köməkçisi · Görünüş ·
       Bildirişlər · Məxfilik və məlumat · Klaviatura qısayolları · Haqqında.
     • Formlar qaralama kimi saxlanılır: «Yadda saxlanılmamış dəyişikliklər» paneli,
       Ctrl/⌘+S, doğrulama. Tema, şrift, sıxlıq və köməkçi dərhal tətbiq olunur.
   Store: profile (App.setProfile), prefs, ui, companion, tg-link.
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
  function chatty() { try { var c = App.companionConfig ? App.companionConfig() : null; return !c || c.chatty !== false; } catch (e) { return true; } }
  function nz(state, text, ms) {
    var c = App.companion; if (!c || typeof c.set !== 'function') return;
    try { c.set(state, text && chatty() ? { say: text, ms: ms || 3000 } : { ms: ms || 1600 }); } catch (e) { /* ignore */ }
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
  var GROUPS = ['Profil', 'İş üslubu', 'Tətbiq', 'Kömək'];
  var SECTIONS = [
    { id: 'account', title: 'Hesab', icon: 'user', cls: '', grp: 'Profil', kw: 'profil şəxsi ad e-poçt telefon giriş kod',
      desc: 'Ad, əlaqə məlumatları və sayt giriş kodu.' },
    { id: 'work', title: 'İş profili', icon: 'quill', cls: 'gold', grp: 'Profil', kw: 'dil cüt ixtisas tarif qiymət imza möhür faktura vöen bank',
      desc: 'Dil cütləri, ixtisas sahələri, tariflər və hesab-faktura rekvizitləri.' },
    { id: 'translation', title: 'Tərcümə', icon: 'translate', cls: 'settings-fir', grp: 'İş üslubu', kw: 'üslub register keyfiyyət format tarix rəqəm transliterasiya türk',
      desc: 'Əsas üslub, keyfiyyət rejimi, formatlar və avtomatik yoxlamalar.' },
    { id: 'companion', title: 'Nuanza köməkçisi', icon: 'sparkle', cls: 'gold', grp: 'İş üslubu', kw: 'köməkçi qız nuanza animasiya danışıq ölçü', live: true,
      desc: 'Nuanzanın görünüşü, ölçüsü, nə qədər danışdığı və hərəkəti.' },
    { id: 'appearance', title: 'Görünüş', icon: 'palette', cls: '', grp: 'Tətbiq', kw: 'tema qaranlıq işıqlı şrift kompakt dil interfeys animasiya hərəkət', live: true,
      desc: 'Tema, şrift ölçüsü, sıxlıq, animasiyalar və interfeys dili.' },
    { id: 'notifications', title: 'Bildirişlər', icon: 'bell', cls: 'gold', grp: 'Tətbiq', kw: 'bildiriş xatırlatma telegram bot e-poçt hesabat',
      desc: 'Son tarix xatırlatmaları, Telegram bot və həftəlik e-poçt hesabatı.' },
    { id: 'privacy', title: 'Məxfilik və məlumat', icon: 'lock', cls: 'green', grp: 'Tətbiq', kw: 'məxfilik lokal maska sil ixrac json tmx tbx',
      desc: 'Lokal rejim, maskalama, saxlama müddəti və məlumatların ixracı.' },
    { id: 'shortcuts', title: 'Klaviatura qısayolları', icon: 'keyboard', cls: '', grp: 'Kömək', kw: 'qısayol klaviatura düymə',
      desc: 'Siçana əl atmadan, daha sürətli işləmək üçün.' },
    { id: 'about', title: 'Haqqında', icon: 'info', cls: '', grp: 'Kömək', kw: 'versiya rəy şərtlər məxfilik siyasəti',
      desc: 'Versiya, hüquqi sənədlər və rəy göndərmək.' }
  ];
  var SEC = {}; SECTIONS.forEach(function (s) { SEC[s.id] = s; });

  /* searchable options: [section, data-opt key, label, keywords] */
  var OPTS = [
    ['account', 'first', 'Ad və soyad', 'ad soyad adı imza'],
    ['account', 'email', 'E-poçt ünvanı', 'email mail poçt'],
    ['account', 'phone', 'Telefon nömrəsi', 'nömrə mobil əlaqə'],
    ['account', 'role', 'Rol', 'freelance büro şirkətdaxili tələbə vəzifə'],
    ['account', 'code', 'Sayt giriş kodu', 'kod giriş açar parol şifrə access ai süni intellekt'],
    ['work', 'pairs', 'Dil cütləri', 'ingilis rus türk en ru tr az dil'],
    ['work', 'specialties', 'İxtisas sahələri', 'hüquq maliyyə neft tibb sahə'],
    ['work', 'rates', 'Tariflər', 'qiymət söz səhifə azn manat notarial'],
    ['work', 'sign', 'İmza və möhür', 'imza möhür ştamp bəyan'],
    ['work', 'invoice', 'Hesab-faktura məlumatları', 'vöen ünvan bank iban faktura rekvizit'],
    ['translation', 'register', 'Əsas üslub', 'register danışıq neytral rəsmi hüquqi defolt'],
    ['translation', 'quality', 'Keyfiyyət rejimi', 'sürətli dəqiq mirzə məclisi'],
    ['translation', 'enforceTerms', 'Termin bazası məcburidir', 'lüğət glossary termin'],
    ['translation', 'address', 'Müraciət forması', 'sən siz you'],
    ['translation', 'dateFmt', 'Tarix formatı', 'tarix gün ay il'],
    ['translation', 'numFmt', 'Rəqəm formatı', 'rəqəm vergül nöqtə onluq kəsr'],
    ['translation', 'translit', 'Adların transliterasiyası', 'ad soyad transliterasiya kiril latın'],
    ['translation', 'turkic', 'Türk formalarını yoxla', 'türkcə türk forması dilçi nənə'],
    ['translation', 'clarify', 'Dəqiqləşdirici suallar', 'klarifikasiya sual soruş'],
    ['companion', 'cShow', 'Nuanzanı göstər', 'köməkçi gizlət göstər'],
    ['companion', 'cSize', 'Köməkçinin ölçüsü', 'kiçik böyük ölçü'],
    ['companion', 'cTalk', 'Danışma tezliyi', 'sakit normal çox danış'],
    ['companion', 'cMotion', 'Animasiya intensivliyi', 'hərəkət animasiya canlı'],
    ['appearance', 'theme', 'Tema', 'işıqlı qaranlıq sistem rəng gecə'],
    ['appearance', 'fontScale', 'Şrift ölçüsü', 'şrift yazı böyüt kiçilt'],
    ['appearance', 'compact', 'Kompakt rejim', 'sıx kompakt sıxlıq'],
    ['appearance', 'motion', 'Animasiyalar', 'animasiya hərəkət azalt həmişə tam sistem sakit'],
    ['appearance', 'lang', 'İnterfeys dili', 'english русский dil azərbaycan'],
    ['appearance', 'intro', 'Girişi yenidən göstər', 'tanışlıq onboarding giriş'],
    ['notifications', 'nDeadline', 'Son tarix xatırlatması', 'deadline müddət xatırlat'],
    ['notifications', 'telegram', 'Telegram botu qoş', 'bot bağla kod telegram'],
    ['notifications', 'nWeekly', 'Həftəlik e-poçt hesabatı', 'e-poçt hesabat həftəlik'],
    ['privacy', 'local', 'Lokal rejim', 'lokal cihaz oflayn'],
    ['privacy', 'mask', 'Adları və rəqəmləri maskala', 'maska anonim gizlət ai'],
    ['privacy', 'retention', 'Avtomatik silmə müddəti', 'sil müddət saxlama'],
    ['privacy', 'export', 'Məlumatlarımı ixrac et', 'json ixrac yüklə'],
    ['privacy', 'wipe', 'Hər şeyi sil', 'sil hesab təhlükəli zona'],
    ['shortcuts', 'keys', 'Qısayolların siyahısı', 'qısayol ctrl alt düymə'],
    ['about', 'version', 'Versiya', 'versiya yenilik buraxılış'],
    ['about', 'feedback', 'Rəy göndər', 'rəy təklif xəta əlaqə'],
    ['about', 'legal', 'Məxfilik siyasəti və istifadə şərtləri', 'şərtlər siyasət lisenziya']
  ];

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
    { id: 'auto', label: 'Avtomatik', ic: 'sparkle' },
    { id: 'danisiq', label: 'Danışıq' },
    { id: 'neytral', label: 'Neytral' },
    { id: 'resmi', label: 'Rəsmi' },
    { id: 'huquqi', label: 'Hüquqi' }
  ];
  var REG_EX = {
    auto: 'Nuanza mətnin üslubunu özü tanıyır: müqavilədə «Hüquqi», işgüzar məktubda «Rəsmi», çatda «Danışıq».',
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
    { id: 'fast', label: 'Sürətli', ic: 'zap', cls: 'gold', hint: 'Təxminən 1 saniyə, bir keçid. Qısa mesajlar və çat üçün.' },
    { id: 'exact', label: 'Dəqiq', ic: 'target', cls: '', hint: 'Lüğət, tərcümə yaddaşı və hər seqment üçün əminlik yoxlaması.' },
    { id: 'meclis', label: 'Mirzə Məclisi', ic: 'shield', cls: 'settings-fir', hint: 'Tərcümədən sonra beş mirzə yoxlayır və səhvləri özləri düzəldir.' }
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
    { id: 'av-nar', name: 'Nar', note: 'isti və cəsur' },
    { id: 'av-lacquer', name: 'Lacivərt', note: 'sakit və ciddi' },
    { id: 'av-zafaran', name: 'Zəfəran', note: 'günəşli və mehriban' },
    { id: 'av-firuze', name: 'Firuzə', note: 'təravətli' },
    { id: 'av-benovse', name: 'Bənövşə', note: 'zərif' },
    { id: 'av-zeytun', name: 'Zeytun', note: 'təbii və təmkinli' }
  ];
  var THEMES = [
    { id: 'dark', label: 'Qaranlıq', ic: 'moon' },
    { id: 'light', label: 'İşıqlı', ic: 'sun' },
    { id: 'system', label: 'Sistem', ic: 'settings' }
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
    pairs: 'work', specialties: 'work', rate: 'work', ratePage: 'work', notarial: 'work', signName: 'work', voen: 'work', addr: 'work', bank: 'work', iban: 'work',
    register: 'translation', quality: 'translation', enforceTerms: 'translation', address: 'translation', dateFmt: 'translation', numFmt: 'translation',
    translit: 'translation', turkic: 'translation', clarify: 'translation',
    nDeadline: 'notifications', nLead: 'notifications', nMeclis: 'notifications', nComments: 'notifications', nStreak: 'notifications', nWeekly: 'notifications', nWeeklyDay: 'notifications',
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
  function dockPx(s) { return { sm: 52, md: 64, lg: 78 }[sizeKey(s)]; }
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
    ':where(:root[data-density="compact"]) .page{gap:14px;padding-block:14px 112px}',
    ':where(:root[data-density="compact"]) .card{padding:14px}',
    ':where(:root[data-density="compact"]) .card.pad-lg{padding:18px}',
    ':where(:root[data-density="compact"]) .card-h{margin-bottom:10px}',
    ':where(:root[data-density="compact"]) .list-row{min-height:46px;padding-block:6px}',
    ':where(:root[data-density="compact"]) .btn{min-height:38px}',
    ':where(:root[data-density="compact"]) .btn-sm{min-height:30px}',
    ':where(:root[data-density="compact"]) .btn-lg{min-height:46px}',
    ':where(:root[data-density="compact"]) .input,:where(:root[data-density="compact"]) .select{min-height:38px;padding-block:7px}',
    ':where(:root[data-density="compact"]) .grid-2,:where(:root[data-density="compact"]) .grid-3,:where(:root[data-density="compact"]) .tiles{gap:10px}',
    ':where(:root[data-density="compact"]) .stack{gap:8px}',
    ':where(:root[data-density="compact"]) .seg button{min-height:30px;padding-block:4px}',
    ':where(:root[data-density="compact"]) .table td{padding-block:8px}',
    ':where(:root[data-density="compact"]) .tile{min-height:92px;padding:12px}'
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
     4. SCREEN CSS
     ------------------------------------------------------------------ */
  var CSS = [
    '.settings-page{--settings-lift:0px}',
    /* hero */
    '.settings-hero{display:grid;grid-template-columns:auto minmax(0,1fr);align-items:center;gap:14px 18px;overflow:hidden;isolation:isolate;padding-top:26px}',
    '@media (min-width:640px){.settings-hero{grid-template-columns:auto minmax(0,1fr) auto;gap:16px 24px;padding:30px 28px 22px}}',
    '.settings-hero > .rugband{position:absolute;left:0;right:0;top:0}',
    '.settings-hero::before{content:"";position:absolute;top:0;right:0;bottom:0;width:62%;z-index:-2;background:var(--firuze);opacity:.1;-webkit-mask:var(--m-field) 0 0/56px 56px repeat;mask:var(--m-field) 0 0/56px 56px repeat}',
    '.settings-hero::after{content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;background:linear-gradient(90deg,var(--surface) 38%,transparent),radial-gradient(60% 130% at 100% 0%,var(--fir-t),transparent 70%)}',
    '.settings-av{--av:var(--av-nar);position:relative;flex:none;width:84px;height:84px;display:grid;place-items:center;padding:0;border:0;border-radius:50%;background:none;color:inherit;cursor:pointer;filter:drop-shadow(0 8px 12px color-mix(in srgb,var(--av) 30%,transparent))}',
    '@media (min-width:640px){.settings-av{width:104px;height:104px}}',
    '.settings-av .sa-star,.settings-av .sa-fill{position:absolute;-webkit-mask:var(--m-star) center/contain no-repeat;mask:var(--m-star) center/contain no-repeat;transition:transform .7s var(--ease-spring),background-color .3s var(--ease-out)}',
    /* avatar: göl — firuzə stepped rim with a zəfəran glint, the colour fill inside */
    '.settings-av .sa-star{inset:0;background:linear-gradient(135deg,var(--firuze),color-mix(in srgb,var(--firuze) 60%,var(--gold-hi)) 55%,var(--zafaran))}',
    '.settings-av .sa-fill{inset:6px;background:linear-gradient(160deg,color-mix(in srgb,var(--on-av) 18%,var(--av)),var(--av) 60%)}',
    '.settings-av .sa-ring{display:none}',
    '.settings-av b{position:relative;font-family:var(--f-display);font-size:1.75rem;font-weight:600;letter-spacing:.03em;color:var(--on-av);line-height:1}',
    '@media (min-width:640px){.settings-av b{font-size:2.125rem}}',
    '.settings-av b svg{display:block;width:1.1em;height:1.1em;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}',
    '.settings-hero h2.settings-hero-empty{color:var(--soft)}',
    '@media (hover:hover){.settings-av:hover .sa-star,.settings-av:hover .sa-fill{transform:rotate(90deg)}}',
    '.settings-av:active{transform:scale(.97)}',
    '.settings-av:focus-visible{outline:2px solid var(--focus);outline-offset:4px}',
    '.settings-av-edit{position:absolute;right:-2px;bottom:2px;width:30px;height:30px;display:grid;place-items:center;border-radius:50%;background:var(--surface);color:var(--ink);box-shadow:var(--sh-pop),0 0 0 1px var(--line)}',
    '.settings-av-edit svg{width:15px;height:15px}',
    '.settings-av.big{width:128px;height:128px;cursor:default}',
    '.settings-av.big b{font-size:2.75rem}',
    '.settings-av.pop{animation:settings-pop .5s var(--ease-spring)}',
    '.settings-hero-tx{min-width:0;display:grid;gap:3px}',
    '.settings-hero-tx h2{font-size:var(--fs-xl);line-height:1.15;overflow-wrap:anywhere}',
    '.settings-hero-meta{color:var(--soft);font-size:var(--fs-sm);min-width:0}',
    '.settings-hero-mail{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.settings-hero-badges{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}',
    '.settings-hero-act{grid-column:1 / -1;display:flex;flex-wrap:wrap;gap:8px}',
    '@media (min-width:640px){.settings-hero-act{grid-column:auto;flex-direction:column;align-items:stretch}}',
    '.settings-complete{grid-column:1 / -1;display:grid;gap:8px;padding-top:14px;border-top:1px solid var(--line)}',
    '.settings-complete .row{justify-content:space-between;flex-wrap:nowrap}',
    '.settings-complete .row > span{min-width:0;color:var(--soft)}',
    '.settings-complete .row > span b{color:var(--ink)}',
    /* layout */
    '.settings-wrap{display:grid;gap:20px;min-width:0;align-items:start}',
    '.settings-side,.settings-main{min-width:0;display:grid;gap:16px;align-content:start}',
    '.settings-main{container-type:inline-size;container-name:stmain}',
    '.settings-page:not(.is-wide)[data-view="list"] .settings-main{display:none}',
    '.settings-page:not(.is-wide)[data-view="sub"] .settings-side,.settings-page:not(.is-wide)[data-view="sub"] .settings-hero,.settings-page:not(.is-wide)[data-view="sub"] > .page-h{display:none}',
    '.settings-page.is-wide .settings-wrap{grid-template-columns:232px minmax(0,1fr);gap:28px}',
    '.settings-page.is-wide .settings-side{position:sticky;top:calc(var(--hdr-h) + var(--band-h) + 16px);max-height:calc(100dvh - var(--hdr-h) - var(--band-h) - 32px);overflow-y:auto;overscroll-behavior:contain;padding:3px 6px 10px 3px;margin:-3px -6px 0 -3px}',
    '.settings-page.is-wide .settings-back{display:none}',
    '.settings-page.is-wide .settings-savebar{grid-column:2}',
    /* search + nav */
    '.settings-search input{background-color:var(--surface)}',
    '.settings-grp{display:grid;gap:6px}',
    '.settings-grp-h{padding:0 4px;font-size:.6875rem;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--soft)}',
    '.settings-navcard{padding:2px 16px}',
    '.settings-nav-row .tx small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.settings-dot{width:8px;height:8px;flex:none;border-radius:50%;background:var(--zafaran);box-shadow:0 0 0 3px var(--zaf-t);animation:pop-in .3s var(--ease-spring) both}',
    '.settings-page.is-wide .settings-grp{gap:2px}',
    '.settings-page.is-wide .settings-grp + .settings-grp{margin-top:12px}',
    '.settings-page.is-wide .settings-navcard{padding:0;background:none;border:0;box-shadow:none}',
    '.settings-page.is-wide .settings-nav-row{min-height:40px;padding:5px 10px;gap:10px}',
    '.settings-page.is-wide .settings-nav-row + .settings-nav-row{border-top:0}',
    '.settings-page.is-wide .settings-nav-row::before{inset:0}',
    '.settings-page.is-wide .settings-nav-row .ic{width:30px;height:30px;border-radius:9px}',
    '.settings-page.is-wide .settings-nav-row .ic svg{width:16px;height:16px}',
    '.settings-page.is-wide .settings-nav-row .tx b{font-size:var(--fs-sm);font-weight:500}',
    '.settings-page.is-wide .settings-nav-row .tx small,.settings-page.is-wide .settings-nav-row .chev{display:none}',
    '.settings-page.is-wide .settings-nav-row[aria-current="page"]::before{opacity:1;background:var(--fir-t)}',
    '.settings-page.is-wide .settings-nav-row[aria-current="page"] .tx b{color:var(--firuze);font-weight:600}',
    '.settings-page.is-wide .settings-nav-row[aria-current="page"] .end::after{content:"";width:9px;height:9px;background:var(--firuze);-webkit-mask:var(--m-star) center/contain no-repeat;mask:var(--m-star) center/contain no-repeat}',
    '.settings-results .list-row .tx small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.settings-page.is-wide .settings-results{padding:2px 12px}',
    '.settings-mk{background:var(--fir-t);color:inherit;border-radius:3px;padding:0 1px}',
    '.settings-noresult{padding:24px 16px}',
    '.settings-noresult .empty-art{width:72px;height:72px}',
    /* section */
    '.settings-subh{display:grid;gap:10px}',
    '.settings-back{justify-self:start;margin-left:-10px}',
    '.settings-subh-t{display:flex;align-items:flex-start;gap:14px;min-width:0}',
    '.settings-subh-t h2{font-size:var(--fs-2xl);line-height:var(--lh-tight);outline:none}',
    '.settings-subh-t p{color:var(--soft);margin-top:4px;max-width:62ch}',
    '.settings-subh-t .badge{margin-top:8px}',
    '.settings-sec{display:grid;gap:16px;min-width:0}',
    '.settings-sec.in-r{animation:settings-in-r .26s var(--ease-out) both}',
    '.settings-sec.in{animation:settings-in .24s var(--ease-out) both}',
    '.settings-side.in-l{animation:settings-in-l .26s var(--ease-out) both}',
    '.settings-card .card-h{align-items:flex-start;margin-bottom:12px}',
    '.settings-card .card-h p{margin-top:2px;max-width:60ch}',
    '.settings-card .list{margin-block:-6px}',
    '.settings-sw{cursor:pointer}',
    /* rows that carry extra content (chips, a seg, a select): pin the icon and switch to the title line */
    '.settings-sw.has-extra{align-items:flex-start}',
    '.settings-sw.has-extra > .ic{margin-top:2px}',
    '.settings-sw.has-extra > .end{margin-top:4px}',
    '.settings-sw .tx > .chips{gap:6px}',
    '.settings-sw .tx > .chips .chip{min-height:28px;padding:0 10px;gap:4px;font-size:var(--fs-xs)}',
    /* «Əsas üslub»: Avtomatik gets its own row on phones, the four registers share the next one */
    '.seg.settings-reg{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));width:100%}',
    '.seg.settings-reg button{min-width:0;padding-inline:4px}',
    '.seg.settings-reg button:first-child{grid-column:1/-1}',
    '@media (min-width:640px){.seg.settings-reg{grid-template-columns:1.35fr repeat(4,minmax(0,1fr))}.seg.settings-reg button:first-child{grid-column:auto}}',
    '.sg-meta > span{display:block}',
    '.settings-meter-n{white-space:nowrap}',
    '.settings-hist .tx b{white-space:nowrap}',
    '.settings-paid{color:var(--ok);font-weight:600}',
    /* three export tiles on a two-column phone grid: the odd one out spans the full row */
    '@media (max-width:479px){.settings-exp{grid-template-columns:1fr 1fr}.settings-exp > :last-child:nth-child(odd){grid-column:1/-1}}',
    '.settings-sw .tx small{max-width:58ch}',
    '.settings-sw .tx .seg,.settings-sw .tx .select{margin-top:8px;cursor:auto}',
    '.settings-sw .tx .select{min-height:38px;padding-block:6px;font-size:var(--fs-sm);max-width:280px}',
    '.settings-sw .tx[aria-disabled="true"] .seg,.settings-sw .tx[aria-disabled="true"] .select{opacity:.45;pointer-events:none}',
    '.settings-flash{border-radius:var(--r-md);animation:settings-flash 1.9s var(--ease-out)}',
    '.settings-mt{margin-top:4px}',
    '.settings-row2{display:flex;flex-wrap:wrap;gap:8px;align-items:center}',
    /* save bar */
    '.settings-savebar{position:sticky;bottom:calc(16px + var(--settings-lift) + env(safe-area-inset-bottom,0px));z-index:6;display:flex;align-items:center;gap:10px;min-width:0;padding:8px 8px 8px 10px;border-radius:16px;background:var(--inv-bg);color:var(--inv-ink);box-shadow:var(--sh-3);opacity:0;visibility:hidden;transform:translateY(16px) scale(.98);transition:opacity var(--t-base) var(--ease-out),transform .32s var(--ease-spring),visibility 0s linear var(--t-base)}',
    '.settings-savebar.on{opacity:1;visibility:visible;transform:none;transition:opacity var(--t-base) var(--ease-out),transform .32s var(--ease-spring),visibility 0s}',
    '.settings-savebar.shake{animation:settings-shake .42s var(--ease-out)}',
    '.settings-savebar .sb-ic{flex:none;width:32px;height:32px;display:grid;place-items:center;border-radius:50%;background:color-mix(in srgb,var(--inv-gold) 22%,transparent);color:var(--inv-gold)}',
    '.settings-savebar .sb-ic svg{width:16px;height:16px}',
    '.settings-savebar .sb-tx{flex:1;min-width:0;display:grid;line-height:1.3}',
    '.settings-savebar .sb-tx b{font-size:var(--fs-sm);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.settings-savebar .sb-tx small{font-size:var(--fs-xs);color:var(--inv-soft);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.settings-savebar .sb-act{flex:none;display:flex;gap:6px}',
    '.settings-savebar .btn-ghost{--btn-ink:var(--inv-ink);--btn-bg-h:color-mix(in srgb,var(--inv-ink) 12%,transparent)}',
    '.settings-savebar .kbd{background:color-mix(in srgb,var(--on-firuze) 14%,transparent);border-color:color-mix(in srgb,var(--on-firuze) 28%,transparent);color:var(--on-firuze);height:18px;min-width:18px;font-size:.66rem}',
    '@media (max-width:479px){.settings-savebar .kbd{display:none}}',
    /* inputs */
    '.settings-affix{position:relative;display:block;min-width:0}',
    '.settings-affix > .input{padding-right:92px}',
    '.settings-affix > span{position:absolute;right:12px;top:50%;transform:translateY(-50%);color:var(--soft);font-size:var(--fs-sm);pointer-events:none;white-space:nowrap}',
    '.settings-ex{display:grid;gap:6px;padding:12px 14px;border-radius:var(--r-md);background:var(--surface2);font-size:var(--fs-sm);min-width:0}',
    '.settings-ex .k{display:flex;align-items:center;gap:6px;font-size:.6875rem;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--soft)}',
    '.settings-ex .src{color:var(--soft);overflow-wrap:anywhere}',
    '.settings-ex .tgt{font-family:var(--f-display);font-size:var(--fs-md);line-height:1.4;color:var(--ink);overflow-wrap:anywhere}',
    '.settings-ex .tgt.swap{animation:settings-in .3s var(--ease-out)}',
    '.settings-choices{display:grid;gap:10px;grid-template-columns:minmax(0,1fr)}',
    '@media (min-width:480px){.settings-choices{grid-template-columns:repeat(2,minmax(0,1fr))}}',
    '.settings-choices.three{grid-template-columns:minmax(0,1fr)}',
    '@container stmain (min-width:600px){.settings-choices.three{grid-template-columns:repeat(3,minmax(0,1fr))}}',
    '.settings-choices .choice b{display:flex;align-items:center;gap:6px;flex-wrap:wrap}',
    '.settings-chip-main{border-color:color-mix(in srgb,var(--firuze) 60%,var(--line-2));background:var(--fir-t)}',
    '.settings-chip-main svg{color:var(--firuze)}',
    /* firuzə variants for brand/selected icon tiles, badges and bars (scoped names, work in sheets too) */
    '.ic.settings-fir{background:var(--fir-t);color:var(--firuze)}',
    '.badge.settings-fir{background:var(--fir-t);color:var(--firuze)}',
    '.progress.settings-over > i{background:var(--nar)}',
    '.progress.settings-prog > i{background:linear-gradient(90deg,color-mix(in srgb,var(--firuze) 70%,var(--lacquer)),var(--firuze))}',
    '.settings-add{border-style:dashed;color:var(--soft);background:transparent}',
    '.settings-chips-pick .chip{cursor:pointer}',
    /* signature + seal */
    '.settings-sign{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:16px 18px;border-radius:var(--r-md);background:var(--surface);border:1px dashed var(--line-2);min-width:0}',
    '.settings-sign .sg-l{min-width:0;display:grid;gap:2px}',
    '.settings-sign .sg-k{font-size:.6875rem;letter-spacing:.12em;text-transform:uppercase;color:var(--soft);font-weight:600}',
    '.settings-sign .sg-name{font-family:var(--f-display);font-style:normal;font-weight:500;letter-spacing:-.01em;font-size:var(--fs-xl);color:var(--lacquer);line-height:1.25;overflow-wrap:anywhere}',
    '.settings-sign .sg-line{display:block;height:1px;background:var(--line-2);margin:6px 0 2px}',
    '.settings-sign .sg-meta{font-size:var(--fs-xs);color:var(--soft)}',
    '.settings-seal{width:88px;height:88px;flex:none;color:var(--firuze);opacity:.9;transform:rotate(-12deg)}',
    '.settings-seal .s-o{fill:none;stroke:currentColor;stroke-width:2.5}',
    '.settings-seal .s-i{fill:none;stroke:currentColor;stroke-width:1;stroke-dasharray:2 2}',
    '.settings-seal .s-t{fill:currentColor;font-family:var(--f-body);font-size:9px;font-weight:600;letter-spacing:.04em}',
    '.settings-seal .s-star{fill:none;stroke:currentColor;stroke-width:1.4;stroke-linejoin:miter}',
    '.settings-seal .s-c{fill:currentColor}',
    '.settings-seal .s-c2{fill:none;stroke:currentColor;stroke-width:1}',
    '.settings-seal.stamp{animation:settings-stamp .5s var(--ease-spring)}',
    /* theme tiles */
    '.settings-theme{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}',
    '.settings-tt{position:relative;display:grid;gap:8px;min-width:0;padding:7px 7px 10px;border:1.5px solid var(--line-2);border-radius:var(--r-lg);background:var(--surface);color:var(--ink);text-align:left;font:inherit;cursor:pointer;transition:border-color var(--t-base),box-shadow var(--t-base),transform var(--t-fast) var(--ease-out)}',
    '@media (hover:hover){.settings-tt:hover{border-color:color-mix(in srgb,var(--firuze) 45%,var(--line-2))}}',
    '.settings-tt:active{transform:scale(.98)}',
    '.settings-tt:focus-visible{outline:2px solid var(--focus);outline-offset:2px}',
    '.settings-tt[aria-pressed="true"]{border-color:var(--firuze);box-shadow:0 0 0 3px var(--fir-t)}',
    '.settings-tt > b{display:flex;align-items:center;gap:6px;padding-inline:3px;font-size:var(--fs-sm);font-weight:600;min-width:0}',
    '.settings-tt > b svg{width:15px;height:15px;color:var(--soft)}',
    '.settings-tt .tt-ck{position:absolute;top:12px;right:12px;z-index:2;width:20px;height:20px;border-radius:50%;background:var(--firuze);box-shadow:0 0 0 2px var(--surface);transform:scale(0);transition:transform .3s var(--ease-spring)}',
    '.settings-tt .tt-ck::after{content:"";position:absolute;inset:5px;background:var(--on-firuze);-webkit-mask:var(--m-check) center/contain no-repeat;mask:var(--m-check) center/contain no-repeat}',
    '.settings-tt[aria-pressed="true"] .tt-ck{transform:scale(1)}',
    '.settings-tt-art{position:relative;display:block;aspect-ratio:4 / 3;border-radius:11px;overflow:hidden;box-shadow:inset 0 0 0 1px var(--line)}',
    /* mini app previews: lt = new light UI (cool grey, ink, firuzə), dk = new dark UI (near-black, firuzə headings).
       Fixed per tile, independent of the current theme. Kilim strip = nar + firuzə triangles; logo = göl. */
    '.settings-art{position:absolute;inset:0;background:var(--a-bg)}',
    '.settings-art.lt{--a-bg:color-mix(in srgb,var(--ivory) 93%,var(--deep-2));--a-card:var(--ivory);--a-line:color-mix(in srgb,var(--deep-2) 16%,transparent);--a-h:color-mix(in srgb,var(--deep-2) 78%,transparent);--a-fir:color-mix(in srgb,var(--firuze) 78%,var(--deep-2));--a-top:color-mix(in srgb,var(--ivory) 70%,var(--a-bg));--a-dia:var(--ivory)}',
    '.settings-art.dk{--a-bg:color-mix(in srgb,var(--deep-2) 40%,black);--a-card:color-mix(in srgb,var(--on-deep) 7%,var(--a-bg));--a-line:color-mix(in srgb,var(--on-deep) 20%,transparent);--a-fir:color-mix(in srgb,var(--firuze) 82%,var(--on-deep));--a-h:var(--a-fir);--a-top:color-mix(in srgb,var(--on-deep) 4%,var(--a-bg));--a-dia:var(--on-deep)}',
    '.settings-art.half{clip-path:polygon(100% 0,100% 100%,0 100%)}',
    '.settings-art i{position:absolute;display:block}',
    '.settings-art .a-top{left:0;right:0;top:0;height:17%;background:var(--a-top)}',
    '.settings-art .a-band{left:0;right:0;top:17%;height:6%}',
    '.settings-art .a-band::before,.settings-art .a-band::after{content:"";position:absolute;inset:0;background:var(--nar);-webkit-mask:var(--m-band) 0 100%/9px 100% repeat-x;mask:var(--m-band) 0 100%/9px 100% repeat-x}',
    '.settings-art .a-band::after{background:var(--a-fir);-webkit-mask-image:var(--m-band2);mask-image:var(--m-band2)}',
    '.settings-art .a-logo{left:44%;top:2.5%;width:12%;aspect-ratio:1;background:var(--rug);-webkit-mask:var(--m-star) center/contain no-repeat;mask:var(--m-star) center/contain no-repeat}',
    '.settings-art .a-logo::before,.settings-art .a-logo::after{content:"";position:absolute;inset:24%;background:var(--a-dia);clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%)}',
    '.settings-art .a-logo::after{inset:37%;background:var(--a-fir)}',
    '.settings-art .a-side{left:0;top:23%;bottom:0;width:24%;background:color-mix(in srgb,var(--a-card) 55%,var(--a-bg))}',
    '.settings-art .a-s1,.settings-art .a-s2{left:5%;height:4px;border-radius:2px;background:var(--a-line)}',
    '.settings-art .a-s1{top:32%;width:13%;background:var(--a-fir)}',
    '.settings-art .a-s2{top:42%;width:10%}',
    '.settings-art .a-card{left:31%;right:7%;top:31%;bottom:12%;border-radius:6px;background:var(--a-card);box-shadow:0 0 0 1px var(--a-line)}',
    '.settings-art .a-l1,.settings-art .a-l2,.settings-art .a-l3{left:37%;height:4px;border-radius:2px;background:var(--a-line)}',
    '.settings-art .a-l1{top:39%;width:34%;height:6px;border-radius:3px;background:var(--a-h)}',
    '.settings-art .a-l2{top:51%;width:46%}',
    '.settings-art .a-l3{top:60%;width:28%}',
    '.settings-art .a-btn{left:37%;bottom:19%;width:24%;height:10%;border-radius:999px;background:var(--a-fir)}',
    /* range */
    '.settings-range{--p:50%;-webkit-appearance:none;appearance:none;display:block;width:100%;height:28px;margin:0;background:transparent;cursor:pointer}',
    '.settings-range:focus{outline:none}',
    '.settings-range::-webkit-slider-runnable-track{height:6px;border-radius:var(--r-pill);background:linear-gradient(90deg,var(--firuze) 0 var(--p),var(--surface2) var(--p) 100%);box-shadow:inset 0 0 0 1px var(--line)}',
    '.settings-range::-moz-range-track{height:6px;border-radius:var(--r-pill);background:var(--surface2);box-shadow:inset 0 0 0 1px var(--line)}',
    '.settings-range::-moz-range-progress{height:6px;border-radius:var(--r-pill);background:var(--firuze)}',
    '.settings-range::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:22px;height:22px;margin-top:-8px;border:0;border-radius:50%;background:var(--knob);box-shadow:var(--sh-pop),0 0 0 1px var(--line-2);transition:transform var(--t-fast) var(--ease-spring)}',
    '.settings-range::-moz-range-thumb{width:22px;height:22px;border:0;border-radius:50%;background:var(--knob);box-shadow:var(--sh-pop),0 0 0 1px var(--line-2)}',
    '.settings-range:active::-webkit-slider-thumb{transform:scale(1.14)}',
    '.settings-range:focus-visible::-webkit-slider-thumb{box-shadow:0 0 0 3px var(--focus)}',
    '.settings-range:focus-visible::-moz-range-thumb{box-shadow:0 0 0 3px var(--focus)}',
    '.settings-rangewrap{display:grid;gap:2px}',
    '.settings-rangewrap .ticks{display:flex;justify-content:space-between;gap:8px;font-size:var(--fs-xs);color:var(--soft)}',
    '.settings-rangeval{font-variant-numeric:tabular-nums;font-weight:600;color:var(--ink)}',
    '.settings-aa{display:flex;align-items:center;gap:12px}',
    '.settings-aa > span{flex:none;font-family:var(--f-display);color:var(--soft);line-height:1}',
    '.settings-aa > span:first-child{font-size:.8125rem}',
    '.settings-aa > span:last-child{font-size:1.375rem}',
    '.settings-aa > .grow{flex:1}',
    '.settings-sample{font-family:var(--f-display);font-size:var(--fs-lg);line-height:1.35}',
    /* companion */
    '.settings-nzgrid{display:grid;gap:16px;grid-template-columns:minmax(0,1fr);align-items:start}',
    '@container stmain (min-width:620px){.settings-nzgrid{grid-template-columns:minmax(0,1fr) minmax(0,.92fr)}.settings-nzgrid > .settings-nzprev{order:2;position:sticky;top:calc(var(--hdr-h) + var(--band-h) + 16px)}}',
    '.settings-nzstage{position:relative;isolation:isolate;display:grid;place-items:end center;min-height:250px;padding:84px 12px 20px;border-radius:var(--r-md);background:radial-gradient(80% 70% at 50% 100%,var(--fir-t),transparent 70%),var(--surface2)}',
    '.settings-nzstage::before{content:"";position:absolute;inset:0;z-index:-1;border-radius:inherit;background:var(--firuze);opacity:.08;-webkit-mask:var(--m-field) 0 0/48px 48px repeat;mask:var(--m-field) 0 0/48px 48px repeat}',
    '.settings-nzstage > .rugband{position:absolute;left:14%;right:14%;bottom:16px;z-index:-1}',
    '.settings-nzstage .nz{transition:width .45s var(--ease-spring),opacity .3s,filter .3s}',
    '.settings-nzstage.off .nz{opacity:.38;filter:grayscale(.75)}',
    '.settings-nzstage .settings-nzfb svg{width:96px;height:96px}',
    '.settings-nzcap{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;font-size:var(--fs-sm);color:var(--soft)}',
    /* notifications */
    '.settings-code{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;padding:14px 16px;border-radius:var(--r-md);background:var(--surface2);border:1px dashed var(--line-2)}',
    '.settings-code b{font:600 1.375rem/1 var(--f-mono);letter-spacing:.12em;color:var(--ink)}',
    '.settings-code small{display:block;margin-top:6px;color:var(--soft);font-size:var(--fs-xs);font-variant-numeric:tabular-nums}',
    '.settings-steps{margin:0;padding-left:1.3em;display:grid;gap:6px;color:var(--soft);font-size:var(--fs-sm)}',
    '.settings-steps b{color:var(--ink)}',
    /* privacy */
    '.settings-tok{display:inline-block;padding:0 6px;border-radius:6px;background:var(--lac-t);color:var(--lacquer);font:600 .78em/1.7 var(--f-mono);letter-spacing:.02em;animation:pop-in .3s var(--ease-spring) both}',
    '.settings-tile-busy{pointer-events:none;opacity:.75}',
    '.settings-tile-busy .ic{color:transparent;position:relative}',
    '.settings-tile-busy .ic::after{content:"";position:absolute;inset:10px;border-radius:50%;border:2px solid color-mix(in srgb,var(--lacquer) 25%,transparent);border-top-color:var(--lacquer);animation:spin .7s linear infinite}',
    '.settings-danger-row{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px}',
    '.settings-danger-row p{max-width:52ch;font-size:var(--fs-sm);color:var(--soft)}',
    '.settings-wipe{display:grid;gap:10px;margin-top:6px;text-align:left}',
    '.settings-wipe .input{font-family:var(--f-mono);letter-spacing:.24em;text-transform:uppercase}',
    '.settings-wipe label{color:var(--ink);font-size:var(--fs-sm);font-weight:600}',
    /* shortcuts */
    '.settings-keys td:last-child{text-align:right;white-space:nowrap}',
    '.settings-keys .kbd{transition:background var(--t-fast),color var(--t-fast),transform var(--t-fast),border-color var(--t-fast)}',
    '.settings-keys .kbd.on{background:var(--lacquer);border-color:var(--lacquer);color:var(--on-lacquer);transform:translateY(1px)}',
    '.settings-keys tr.hit td{background:var(--fir-t)}',
    '.settings-keys tr.grp td{background:var(--surface2);font-size:.6875rem;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--soft);padding-block:8px}',
    '.settings-keys .plus{margin:0 3px;color:var(--faint);font-size:var(--fs-xs)}',
    /* about */
    '.settings-about{display:grid;justify-items:center;text-align:center;gap:10px;padding-block:30px 22px}',
    '.settings-about .logo{width:76px;height:76px;transition:transform .9s var(--ease-spring)}',
    '@media (hover:hover){.settings-about:hover .logo{transform:rotate(45deg)}}',
    '.settings-about h2{font-size:var(--fs-2xl)}',
    '.settings-about .row{justify-content:center}',
    '.settings-legal{display:flex;flex-wrap:wrap;justify-content:center;gap:4px 16px;font-size:var(--fs-sm)}',
    '.settings-stars{display:flex;gap:2px}',
    '.settings-stars button{width:40px;height:40px;display:grid;place-items:center;padding:0;border:0;border-radius:10px;background:none;color:var(--line-2);cursor:pointer;transition:transform var(--t-fast) var(--ease-spring),color var(--t-fast)}',
    /* rating: a plain rounded 5-point star (universal «rate us» symbol, not the göl ornament) */
    '.settings-stars{--settings-m-star5:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\'%3E%3Cpath d=\'M12 2.6l2.9 5.9 6.5.95-4.7 4.58 1.1 6.47L12 17.45 6.2 20.5l1.1-6.47L2.6 9.45l6.5-.95z\' stroke=\'black\' stroke-width=\'1.6\' stroke-linejoin=\'round\'/%3E%3C/svg%3E")}',
    '.settings-stars button span{width:26px;height:26px;background:currentColor;-webkit-mask:var(--settings-m-star5) center/contain no-repeat;mask:var(--settings-m-star5) center/contain no-repeat}',
    '.settings-stars button.on{color:var(--zafaran)}',
    '.settings-stars button:active{transform:scale(.86)}',
    '.settings-stars button:focus-visible{outline:2px solid var(--focus);outline-offset:1px}',
    '.settings-inv{display:grid;gap:14px;font-size:var(--fs-sm)}',
    '.settings-inv .miss{color:var(--nar);font-weight:500}',
    '.settings-inv .tot{display:flex;justify-content:space-between;align-items:baseline;padding-top:12px;border-top:1px solid var(--line)}',
    '.settings-inv .tot b{font-family:var(--f-display);font-size:var(--fs-xl)}',
    '.settings-avsheet{display:grid;justify-items:center;gap:16px;text-align:center;padding-top:6px}',
    '.settings-out{animation:settings-out .28s var(--ease-in-out) forwards}',
    /* keyframes */
    '@keyframes settings-in-r{from{opacity:0;transform:translateX(18px)}to{opacity:1;transform:none}}',
    '@keyframes settings-in-l{from{opacity:0;transform:translateX(-18px)}to{opacity:1;transform:none}}',
    '@keyframes settings-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}',
    '@keyframes settings-flash{0%,35%{box-shadow:0 0 0 3px var(--firuze);background-color:var(--fir-t)}100%{box-shadow:0 0 0 3px transparent;background-color:transparent}}',
    '@keyframes settings-shake{0%,100%{transform:none}20%{transform:translateX(-7px)}45%{transform:translateX(6px)}70%{transform:translateX(-3px)}}',
    '@keyframes settings-stamp{0%{transform:rotate(-12deg) scale(1.3);opacity:0}60%{transform:rotate(-12deg) scale(.93);opacity:1}100%{transform:rotate(-12deg) scale(1)}}',
    '@keyframes settings-pop{0%{transform:scale(.86)}100%{transform:scale(1)}}',
    '@keyframes settings-out{to{opacity:0;transform:translateX(24px)}}'
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
     ------------------------------------------------------------------ */
  function card(title, sub, kids, o) {
    o = o || {};
    return h('section', { class: 'card settings-card' + (o.cls ? ' ' + o.cls : ''), 'data-opt': o.opt || null },
      h('div', { class: 'card-h' },
        h('div', null, o.eyebrow ? h('span', { class: 'eyebrow', text: o.eyebrow }) : null, h('h3', { text: title }), sub ? h('p', { class: 'muted small', text: sub }) : null),
        o.actions ? h('div', { class: 'actions' }, o.actions) : null),
      h('div', { class: 'stack' }, kids));
  }
  function fieldBox(key, label, control, o) {
    o = o || {};
    var id = o.forId || ('st-' + key);
    var err = h('span', { class: 'err', id: 'st-' + key + '-err', role: 'alert', hidden: true });
    ERR[key] = err;
    var hint = o.hintEl || (o.hint ? h('span', { class: 'hint', id: 'st-' + key + '-hint' }, o.hint) : null);
    var inp = byIdIn(control, id);
    if (inp) inp.setAttribute('aria-describedby', (hint && hint.id ? hint.id + ' ' : '') + 'st-' + key + '-err');
    return h('div', { class: 'field' + (o.cls ? ' ' + o.cls : ''), 'data-opt': o.opt || key },
      h('label', { for: id }, label, o.optTx ? h('span', { class: 'opt', text: o.optTx }) : null),
      control, hint, err);
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
  function switchRow(key, title, sub, icon, icCls, o) {
    o = o || {};
    var id = 'st-' + key, tid = id + '-t';
    var cur = o.get ? o.get() : Dr[key];
    var inp = h('input', { type: 'checkbox', id: id, checked: !!cur, 'aria-labelledby': tid, 'aria-describedby': sub ? id + '-d' : null });
    inp.addEventListener('change', function () {
      if (o.set) o.set(inp.checked, inp);
      else { Dr[key] = inp.checked; changed(key); }
    });
    var tx = h('span', { class: 'tx' }, h('b', { id: tid, text: title }), sub ? h('small', { id: id + '-d' }, sub) : null, o.extra || null);
    var row = h('div', { class: 'list-row settings-sw' + (o.extra ? ' has-extra' : ''), 'data-opt': o.opt || key }, icon ? icTile(icon, icCls) : null, tx,
      h('span', { class: 'end' }, h('label', { class: 'switch' }, inp, h('span', { 'aria-hidden': 'true' }))));
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
  function exBox(k, src, tgt) {
    var t = h('div', { class: 'tgt' }, tgt);
    var box = h('div', { class: 'settings-ex', 'aria-live': 'polite' }, h('span', { class: 'k' }, ie('sparkle'), k), src ? h('div', { class: 'src' }, src) : null, t);
    box.set = function (txt) { t.textContent = ''; t.appendChild(typeof txt === 'string' ? D.createTextNode(txt) : txt); t.classList.remove('swap'); void t.offsetWidth; t.classList.add('swap'); };
    return box;
  }

  /* ------------------------------------------------------------------
     8. HERO (profile header) + avatar colour sheet
     ------------------------------------------------------------------ */
  function avParts(text) {
    return [h('span', { class: 'sa-star', 'aria-hidden': 'true' }), h('span', { class: 'sa-fill', 'aria-hidden': 'true' }),
      h('span', { class: 'sa-ring', 'aria-hidden': 'true' }), h('b', { 'aria-hidden': 'true', text: text })];
  }
  function avCls(c) { for (var i = 0; i < AV_COLORS.length; i++) if (AV_COLORS[i].id === c) return c; return 'av-firuze'; }
  function draftName() { return (String(Dr.first || '').trim() + ' ' + String(Dr.last || '').trim()).trim(); }

  function buildHero() {
    V.av = h('button', { class: 'settings-av av-nar', type: 'button', 'aria-label': 'Şəkli dəyiş — avatar rəngini seçin', onclick: avatarSheet },
      avParts(''), h('span', { class: 'settings-av-edit', 'aria-hidden': 'true', html: App.icon('palette') }));
    V.avTx = V.av.querySelector('b');
    V.heroName = h('h2');
    V.heroMeta = h('p', { class: 'settings-hero-meta' });
    V.heroMail = h('p', { class: 'settings-hero-meta settings-hero-mail' });
    V.heroBadges = h('div', { class: 'settings-hero-badges' });
    V.compBar = h('i');
    V.compTx = h('span', { class: 'small' });
    V.compBtn = h('button', { class: 'link small', type: 'button', onclick: completeNext }, 'Tamamla');
    V.comp = h('div', { class: 'settings-complete' },
      h('div', { class: 'row' }, V.compTx, V.compBtn),
      h('div', { class: 'progress settings-prog thin', role: 'progressbar', 'aria-label': 'Profil tamlığı', 'aria-valuemin': '0', 'aria-valuemax': '100' }, V.compBar));
    return h('section', { class: 'card settings-hero', 'aria-label': 'Profil' },
      h('div', { class: 'rugband thin', 'aria-hidden': 'true' }),
      V.av,
      h('div', { class: 'settings-hero-tx' }, V.heroName, V.heroMeta, V.heroMail, V.heroBadges),
      h('div', { class: 'settings-hero-act' },
        h('button', { class: 'btn btn-sm', type: 'button', onclick: function () { openSection('account', { opt: 'first' }); } }, ie('edit'), 'Profili redaktə et'),
        h('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: avatarSheet }, ie('palette'), 'Şəkli dəyiş')),
      V.comp);
  }
  function filled(v) { return Array.isArray(v) ? v.length > 0 : String(v == null ? '' : v).trim() !== ''; }
  function syncHero() {
    if (!V || !V.heroName || !Dr) return;
    var p = App.profile(), name = draftName();
    V.heroName.textContent = name || 'Profilinizi tamamlayın';
    V.heroName.classList.toggle('settings-hero-empty', !name);
    if (name) V.avTx.textContent = initials(name); else V.avTx.innerHTML = App.icon('user');
    V.av.className = 'settings-av ' + avCls(p.avatarColor);
    var meta = [Dr.role, Dr.pairs && Dr.pairs.length ? pairsShort(Dr.pairs) : ''].filter(Boolean).join(' · ');
    V.heroMeta.textContent = meta;
    V.heroMeta.hidden = !meta;
    V.heroMail.textContent = Dr.email || (name ? '' : 'Adınızı və e-poçtunuzu əlavə edin');
    V.heroMail.hidden = !V.heroMail.textContent;
    V.heroMail.title = Dr.email || '';
    V.heroBadges.textContent = '';
    if (App.mode && App.mode() === 'academy' && p.rank) V.heroBadges.appendChild(h('span', { class: 'badge navy' }, ie('medal'), p.rank));
    if (Dr.notarial) V.heroBadges.appendChild(h('span', { class: 'badge navy' }, ie('stamp'), 'Notarial tərcümə'));
    var since = p.memberSince ? new Date(p.memberSince) : null;
    if (since && !isNaN(since)) V.heroBadges.appendChild(h('span', { class: 'badge' }, 'Üzv: ' + MONTHS[since.getMonth()] + ' ' + since.getFullYear()));
    /* completeness */
    var miss = COMPLETE.filter(function (c) { return !filled(Dr[c[0]]); });
    var pct = Math.round((COMPLETE.length - miss.length) / COMPLETE.length * 100);
    V.compBar.style.width = pct + '%';
    V.compBar.parentNode.setAttribute('aria-valuenow', String(pct));
    V.compTx.textContent = '';
    if (!miss.length) {
      V.compTx.appendChild(h('b', { text: 'Profil 100% tamamdır' }));
      V.compTx.appendChild(D.createTextNode(' — hər şey yerindədir'));
      V.compBtn.hidden = true;
    } else {
      V.compTx.appendChild(h('b', { text: 'Profil ' + pct + '% tamamdır' }));
      V.compTx.appendChild(D.createTextNode(' · qalıb: ' + miss.slice(0, 3).map(function (c) { return c[1]; }).join(', ') + (miss.length > 3 ? '…' : '')));
      V.compBtn.hidden = false;
      V.compMiss = miss[0][0];
    }
  }
  function completeNext() {
    var k = V && V.compMiss; if (!k) return;
    openSection(FIELD_SEC[k] || 'work', { opt: k });
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
        prev.classList.remove('pop'); void prev.offsetWidth; prev.classList.add('pop');
        setCap(c.id);
      });
      sw.appendChild(b);
    });
    var body = h('div', { class: 'settings-avsheet' }, prev, cap, sw,
      h('p', { class: 'small muted', text: 'Fotoşəkil əvəzinə baş hərfləriniz xalça gölündə göstərilir.' }));
    App.sheet({
      title: 'Şəkli dəyiş', body: body,
      actions: [{ label: 'Ləğv et', kind: 'ghost' }, { label: 'Yadda saxla', kind: 'primary', onClick: function () {
        if (chosen === cur) return;
        saveProfile({ avatarColor: chosen });
        syncHero();
        if (V && V.av) { V.av.classList.add('pop'); later(function () { if (V && V.av) { V.av.classList.remove('pop'); burstAt(V.av, 'stars'); } }, 320); }
        var c = null; for (var i = 0; i < AV_COLORS.length; i++) if (AV_COLORS[i].id === chosen) c = AV_COLORS[i];
        toast('Avatar yeniləndi', 'ok', { sub: (c ? c.name : '') + ' rəngi seçildi' });
        nz('celebrate', 'Bu rəng sizə çox yaraşır!', 2400);
      } }]
    });
  }

  /* ------------------------------------------------------------------
     9. SECTION: HESAB
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
    /* personal */
    var roleHint = h('span', { class: 'hint', id: 'st-role-hint' });
    var student = h('div', { class: 'callout navy', hidden: true }, ie('cap'),
      h('div', null, h('b', { text: 'Tələbəsiniz? ' }), 'Akademiya rejimində dərslər, missiyalar və rütbələr sizi gözləyir. ',
        h('button', { class: 'link', type: 'button', onclick: function () { if (App.setMode) App.setMode('academy'); } }, 'Akademiyaya keç')));
    var roles = ROLES.slice();
    if (Dr.role && !roles.some(function (r) { return r.id === Dr.role; })) roles.push({ id: Dr.role, label: Dr.role, hint: '' });
    var roleSel = selectCtl('role', roles);
    function syncRole() {
      var r = null; roles.forEach(function (x) { if (x.id === Dr.role) r = x; });
      roleHint.textContent = r ? r.hint : '';
      student.hidden = !(Dr.role === 'Tələbə' && (!App.mode || App.mode() !== 'academy'));
    }
    watch('role', syncRole); syncRole();
    var personal = card('Şəxsi məlumatlar', 'Hamısı istəyə bağlıdır və yalnız bu cihazda saxlanılır.', [
      h('div', { class: 'grid-2' },
        fieldBox('first', 'Ad', textIn('first', { autocomplete: 'given-name', placeholder: 'Adınız' })),
        fieldBox('last', 'Soyad', textIn('last', { autocomplete: 'family-name', placeholder: 'Soyadınız' }), { optTx: 'istəyə görə' })),
      fieldBox('email', 'E-poçt', textIn('email', { type: 'email', autocomplete: 'email', inputmode: 'email', spellcheck: 'false', placeholder: 'ad@domen.az' })),
      h('div', { class: 'grid-2' },
        fieldBox('phone', 'Telefon', textIn('phone', { type: 'tel', autocomplete: 'tel', inputmode: 'tel', placeholder: '+994 50 123 45 67' }), { hint: 'Təcili təhvil məsələləri üçün.' }),
        fieldBox('role', 'Rol', roleSel, { hintEl: roleHint })),
      student
    ]);

    /* site access code: the Worker's ACCESS_CODE. Stored as 'code' (App.store → localStorage
       'nuanza2:code', JSON) and sent by ai/core.js with every AI request (x-access-code).
       Saved on its own button — it is not part of the profile draft. */
    var codeIn = h('input', { class: 'input', id: 'st-code', type: 'text', autocomplete: 'off', spellcheck: 'false', autocapitalize: 'off',
      value: String(sget('code', '') || ''), 'aria-describedby': 'st-code-hint' });
    var codeSave = h('button', { class: 'btn btn-secondary btn-sm', type: 'button' }, ie('check'), 'Yadda saxla');
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
    var codeCard = card('Sayt girişi', 'Süni intellekt sorğuları bu kodla göndərilir.', [
      h('div', { class: 'field' },
        h('label', { for: 'st-code' }, 'Sayt giriş kodu'), codeIn,
        h('span', { class: 'hint', id: 'st-code-hint', text: 'Saytın sahibi kod qoyubsa, buraya yazın' })),
      h('div', { class: 'row' }, codeSave)
    ], { opt: 'code' });

    return h('div', { class: 'stack-lg' }, personal, codeCard);
  }

  /* ------------------------------------------------------------------
     10. SECTION: İŞ PROFİLİ
     ------------------------------------------------------------------ */
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
          i === 0 ? ie('target') : null, pairLabel(pid), x));
      });
      chips.appendChild(h('button', { class: 'chip settings-add', type: 'button', onclick: addPairsSheet }, ie('plus'), 'Cüt əlavə et'));
    }
    function addPairsSheet() {
      var avail = allPairs().filter(function (p) { return Dr.pairs.indexOf(p.id) < 0; });
      if (!avail.length) { toast('Bütün dil cütləri artıq əlavə olunub', 'info'); return; }
      var chosen = [];
      var grid = h('div', { class: 'settings-choices' });
      avail.forEach(function (p) {
        var b = h('button', { class: 'choice', type: 'button', 'aria-pressed': 'false' }, icTile('translate', p.beta ? 'gold' : ''),
          h('span', null, h('b', null, p.label, p.beta ? h('span', { class: 'badge gold', text: 'beta' }) : null), h('small', { text: p.name })));
        b.addEventListener('click', function () {
          var i = chosen.indexOf(p.id);
          if (i >= 0) chosen.splice(i, 1); else chosen.push(p.id);
          b.setAttribute('aria-pressed', String(i < 0));
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
    var pairsCard = card('Dil cütləri', 'Hansı istiqamətlərdə tərcümə edirsiniz. İşarəli birinci cüt əsasdır.', [chips, pErr], { opt: 'pairs' });

    /* specialties */
    var sChips = h('div', { class: 'chips', id: 'st-specialties', role: 'list', 'aria-label': 'İxtisas sahələri' });
    function drawSpecs() {
      sChips.textContent = '';
      Dr.specialties.forEach(function (s) {
        var x = h('button', { class: 'x', type: 'button', 'aria-label': s + ' sahəsini sil', html: App.icon('x') });
        x.addEventListener('click', function () { Dr.specialties = Dr.specialties.filter(function (q) { return q !== s; }); drawSpecs(); changed('specialties'); focusEl(sChips.querySelector('.x') || sChips.querySelector('.settings-add')); });
        sChips.appendChild(h('span', { class: 'chip', role: 'listitem' }, s, x));
      });
      sChips.appendChild(h('button', { class: 'chip settings-add', type: 'button', onclick: addSpecSheet }, ie('plus'), 'Sahə əlavə et'));
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
    var specCard = card('İxtisas sahələri', 'Nuanza bu sahələrin lüğətlərini və üslub qaydalarını önə çəkir.', [sChips], { opt: 'specialties' });

    /* rates */
    var sampleTx = h('div');
    var sampleBox = h('div', { class: 'callout navy' }, ie('chart'), sampleTx);
    function drawSample() {
      var r = parseDec(Dr.rate), pg = parseDec(Dr.ratePage);
      sampleTx.textContent = '';
      sampleBox.hidden = !isFinite(r) && !isFinite(pg);
      sampleTx.appendChild(h('b', { text: 'Nümunə hesab: ' }));
      sampleTx.appendChild(D.createTextNode('2 400 sözlük müqavilə ≈ '));
      sampleTx.appendChild(h('b', { text: isFinite(r) ? money(2400 * r) : '—' }));
      sampleTx.appendChild(D.createTextNode(' · 7 səhifəlik arayış ≈ '));
      sampleTx.appendChild(h('b', { text: isFinite(pg) ? money(7 * pg) : '—' }));
      if (Dr.notarial) sampleTx.appendChild(D.createTextNode('. Notarial sifarişlərdə tərcüməçi bəyanı avtomatik əlavə olunur.'));
    }
    watch('rate', drawSample); watch('ratePage', drawSample); watch('notarial', drawSample);
    drawSample();
    var ratesCard = card('Öz tarifləriniz', 'İstəyə bağlı. Yazsanız, layihə qiyməti bununla hesablanır.', [
      h('div', { class: 'grid-2' },
        fieldBox('rate', 'Söz başına', affix(textIn('rate', { inputmode: 'decimal', placeholder: 'məs. 0,05' }), 'AZN / söz'), { optTx: 'istəyə görə' }),
        fieldBox('ratePage', 'Səhifə başına', affix(textIn('ratePage', { inputmode: 'decimal', placeholder: 'məs. 10' }), 'AZN / səhifə'), { optTx: 'istəyə görə', hint: '1 səhifə = 1 800 simvol (boşluqlarla).' })),
      h('div', { class: 'list' }, switchRow('notarial', 'Notarial təsdiqli tərcümə edirəm', 'Notarius üçün imzalı nüsxə və tərcüməçi bəyanı hazırlanır.', 'stamp', 'gold')),
      sampleBox
    ], { opt: 'rates' });

    /* signature + seal */
    var sgName = h('span', { class: 'sg-name' });
    var sgMeta = h('span', { class: 'sg-meta' });
    var sealHost = h('span', { 'aria-hidden': 'true' });
    var sealTimer = null;
    function drawSign(animate) {
      var nm = String(Dr.signName || '').trim() || draftName() || 'Ad Soyad';
      sgName.textContent = nm;
      sgMeta.textContent = '';
      sgMeta.appendChild(h('span', { text: 'Tərcüməçi · ' + (pairsShort(Dr.pairs) || '—') }));
      sgMeta.appendChild(h('span', { text: dateAz(new Date()) }));
      clearTimeout(sealTimer);
      sealTimer = later(function () {
        sealHost.innerHTML = sealSvg(nm);
        if (animate && !reduced()) { var s = sealHost.firstChild; if (s && s.classList) s.classList.add('stamp'); }
      }, animate ? 380 : 0);
    }
    watch('signName', function () { drawSign(true); });
    watch('pairs', function () { drawSign(false); });
    drawSign(false);
    var signCard = card('İmza və möhür', 'Tərcüməçi bəyanında, təhvil sənədində və möhür ştampında görünür.', [
      fieldBox('signName', 'İmzada görünən ad', textIn('signName', { autocomplete: 'name', placeholder: 'Ad Soyad' }), { hint: 'Pasportdakı kimi yazın — notarius bu adı yoxlayır.' }),
      h('div', { class: 'settings-sign', 'aria-label': 'İmza önizləməsi' },
        h('span', { class: 'sg-l' }, h('span', { class: 'sg-k', text: 'Tərcüməni yerinə yetirdi' }), sgName, h('span', { class: 'sg-line', 'aria-hidden': 'true' }), sgMeta),
        sealHost)
    ], { opt: 'sign' });

    /* invoice */
    var dl = h('datalist', { id: 'st-banks' }, BANKS.map(function (b) { return h('option', { value: b }); }));
    var invCard = card('Hesab-faktura məlumatları', 'Hər hesab-fakturada avtomatik görünəcək.', [
      h('div', { class: 'grid-2' },
        fieldBox('voen', 'VÖEN', textIn('voen', { inputmode: 'numeric', maxlength: '10', placeholder: '1234567890', spellcheck: 'false' }), { hint: '10 rəqəm — vergi ödəyicisinin eyniləşdirmə nömrəsi.' }),
        fieldBox('bank', 'Bank', textIn('bank', { list: 'st-banks', placeholder: 'Bankı seçin və ya yazın' }))),
      dl,
      fieldBox('addr', 'Hüquqi ünvan', textIn('addr', { autocomplete: 'street-address', placeholder: 'Şəhər, rayon, küçə, ev' })),
      fieldBox('iban', 'Hesab nömrəsi (IBAN)', textIn('iban', { placeholder: 'AZ00 XXXX 0000 0000 0000 0000 0000', spellcheck: 'false', autocapitalize: 'characters' }), { hint: 'Ödənişlər bu hesaba yönləndirilir.' }),
      h('div', { class: 'row' }, h('button', { class: 'btn btn-sm', type: 'button', onclick: invoiceSheet }, ie('file'), 'Nümunə hesab-fakturaya bax'))
    ], { opt: 'invoice' });

    return h('div', { class: 'stack-lg' }, pairsCard, specCard, ratesCard, signCard, invCard);
  }
  function invoiceSheet() {
    var r = parseDec(Dr.rate); if (!isFinite(r)) r = 0;
    var total = 2400 * r, name = draftName() || '—';
    function val(v, miss) { v = String(v || '').trim(); return v ? h('dd', { text: v }) : h('dd', { class: 'miss', text: miss || 'əlavə edilməyib' }); }
    var today = new Date();
    var body = h('div', { class: 'settings-inv' },
      h('div', { class: 'row between' }, h('div', null, h('span', { class: 'eyebrow', text: 'Hesab-faktura' }), h('h3', { class: 'serif', text: '№ NZ-' + today.getFullYear() + '-0001' })), h('span', { class: 'badge', text: dateAz(today) })),
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
     11. SECTION: TƏRCÜMƏ
     ------------------------------------------------------------------ */
  function secTranslation() {
    var regEx = exBox('Nümunə', '«Please submit the documents by Friday.»', REG_EX[Dr.register] || REG_EX.auto);
    var regHint = h('span', { class: 'hint', id: 'st-register-hint', text: REG_HINT[Dr.register] || '' });
    watch('register', function (v) { regEx.set(REG_EX[v] || ''); regHint.textContent = REG_HINT[v] || ''; });
    var regField = h('div', { class: 'field', 'data-opt': 'register' },
      h('span', { class: 'label', id: 'st-register-l' }, 'Əsas üslub'),
      segCtl('register', REGS, { label: 'Əsas üslub', cls: 'settings-reg' }), regHint, regEx);

    var qGrid = h('div', { class: 'settings-choices three', id: 'st-quality', role: 'group', 'aria-label': 'Keyfiyyət rejimi' });
    var meclisLink = h('button', { class: 'link small', type: 'button' }, 'Məclis necə işləyir?');
    meclisLink.addEventListener('click', function () {
      if (!App.bigJob) return;
      App.bigJob('Nümunə: podrat müqaviləsinin 4.2-ci bəndi', { score: 94, text: '«Podratçı» termini ardıcıl işlənib, rəqəmlər və tarixlər mənbə ilə üst-üstə düşür. Türk forması tapılmadı.' });
    });
    QUALITY.forEach(function (q) {
      var b = h('button', { class: 'choice', type: 'button', 'aria-pressed': String(Dr.quality === q.id) }, icTile(q.ic, q.cls), h('span', null, h('b', { text: q.label }), h('small', { text: q.hint })));
      b.addEventListener('click', function () {
        if (Dr.quality === q.id) return;
        each(qGrid.children, function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        Dr.quality = q.id; changed('quality');
        if (q.id === 'meclis') nz('point', 'Böyük işlərdə beş mirzə tərcüməni bir-bir yoxlayacaq.', 2800);
      });
      qGrid.appendChild(b);
    });
    var qField = h('div', { class: 'field', 'data-opt': 'quality' }, h('span', { class: 'label' }, 'Keyfiyyət rejimi', meclisLink), qGrid);

    var style = card('Üslub və keyfiyyət', 'Yeni tərcümələr bu ayarlarla başlayır; hər layihədə ayrıca dəyişmək olar.', [
      regField, qField,
      h('div', { class: 'list' }, switchRow('enforceTerms', 'Termin bazası məcburidir', 'Lüğətdəki terminlər hər zaman işlənir; uyğunsuzluq olarsa seqment «Yoxlayın» kimi işarələnir.', 'book', ''))
    ]);

    /* formats */
    var now = new Date();
    var addrEx = exBox('Nümunə', '«You can change your password at any time.»', (ADDRS.filter(function (a) { return a.id === Dr.address; })[0] || ADDRS[0]).ex);
    watch('address', function (v) { addrEx.set((ADDRS.filter(function (a) { return a.id === v; })[0] || ADDRS[0]).ex); });
    var addrField = h('div', { class: 'field', 'data-opt': 'address' }, h('span', { class: 'label' }, 'Müraciət forması («you»)'), segCtl('address', ADDRS, { label: 'Müraciət forması' }), addrEx);

    var dateItems = DATE_FMTS.map(function (f) { return { id: f.id, label: f.fn(now) }; });
    function dateNote(v) { var f = DATE_FMTS.filter(function (x) { return x.id === v; })[0] || DATE_FMTS[0]; return f.note.charAt(0).toUpperCase() + f.note.slice(1) + '.'; }
    var dateHint = h('span', { class: 'hint', id: 'st-dateFmt-hint', text: dateNote(Dr.dateFmt) });
    watch('dateFmt', function (v) { dateHint.textContent = dateNote(v); });
    var srcDate = MONTHS_EN[now.getMonth()] + ' ' + now.getDate() + ', ' + now.getFullYear();
    function dateOut(v) { var f = DATE_FMTS.filter(function (x) { return x.id === v; })[0] || DATE_FMTS[0]; return f.fn(now); }
    var dateEx = exBox('Canlı nümunə', 'Mənbə: ' + srcDate, dateOut(Dr.dateFmt));
    watch('dateFmt', function (v) { dateEx.set(dateOut(v)); });

    var numEx = exBox('Canlı nümunə', 'Mənbə: 12,480.50 USD', (NUM_FMTS.filter(function (x) { return x.id === Dr.numFmt; })[0] || NUM_FMTS[0]).ex);
    watch('numFmt', function (v) { numEx.set((NUM_FMTS.filter(function (x) { return x.id === v; })[0] || NUM_FMTS[0]).ex); });

    var trEx = exBox('Canlı nümunə', 'Mənbə: Щербаков Юрий Алексеевич', (TRANSLIT.filter(function (x) { return x.id === Dr.translit; })[0] || TRANSLIT[0]).ex);
    watch('translit', function (v) { trEx.set((TRANSLIT.filter(function (x) { return x.id === v; })[0] || TRANSLIT[0]).ex); });

    var formats = card('Dil və format', 'Tarixlər, rəqəmlər və adlar bütün sənəddə eyni qaydada yazılır — Möhürdar Mirzə bunu yoxlayır.', [
      addrField,
      h('div', { class: 'grid-2' },
        fieldBox('dateFmt', 'Tarix formatı', selectCtl('dateFmt', dateItems), { hintEl: dateHint }),
        fieldBox('numFmt', 'Rəqəm formatı', selectCtl('numFmt', NUM_FMTS))),
      h('div', { class: 'grid-2' }, dateEx, numEx),
      fieldBox('translit', 'Adların transliterasiyası', selectCtl('translit', TRANSLIT), { hint: 'Rus və digər kiril mənbələrindəki şəxs adları üçün.' }),
      trEx
    ]);

    /* checks */
    var turkicChips = h('div', { class: 'chips' }, TURKIC.map(function (t) { return h('span', { class: 'chip' }, h('s', { class: 'muted', text: t[0] }), ' → ', h('b', { text: t[1] })); }));
    var checks = card('Avtomatik yoxlamalar', null, [
      h('div', { class: 'list' },
        switchRow('turkic', 'Türk formalarını yoxla', 'Dilçi Nənə ədəbi normaya uyğun olmayan türk formalarını tapır və düzəliş təklif edir.', 'shield', 'nar', { extra: turkicChips }),
        switchRow('clarify', 'Dəqiqləşdirici suallar ver', 'Mətn birmənalı olmayanda (məsələn, «you» — sən, yoxsa siz?) Nuanza tərcümədən əvvəl soruşur.', 'help', 'gold'))
    ]);
    turkicChips.style.marginTop = '8px';

    return h('div', { class: 'stack-lg' }, style, formats, checks);
  }

  /* ------------------------------------------------------------------
     12. SECTION: NUANZA KÖMƏKÇİSİ (live)
     ------------------------------------------------------------------ */
  function secCompanion() {
    var c = compCfg();
    var SZ = { sm: 112, md: 140, lg: 172 };
    var stage = h('div', { class: 'settings-nzstage' + (c.show ? '' : ' off') }, h('div', { class: 'rugband', 'aria-hidden': 'true' }));
    var inst = null;
    if (W.Nuanza && typeof W.Nuanza.mount === 'function') {
      try { inst = W.Nuanza.mount(stage, { size: 'full', width: SZ[sizeKey(c.size)], label: 'Nuanza — canlı önizləmə. Toxunun' }); V.insts.push(inst); } catch (e) { inst = null; }
    }
    if (!inst) stage.appendChild(h('div', { class: 'settings-nzfb', html: App.logo ? App.logo('logo') : '' }));
    function root() { return inst ? (inst.el || inst.root) : null; }
    function react(state, text, ms) {
      if (!inst) return;
      try {
        if (text && c.talk !== 'sakit') inst.set(state, { say: text, ms: ms || 2600 });
        else { inst.set(state, { ms: ms || 1600 }); if (inst.say) inst.say(''); }
      } catch (e) { /* ignore */ }
    }
    var cap = h('span');
    var state = h('span', { class: 'badge' });
    function syncCap() {
      cap.textContent = c.show ? 'Ekranda: ' + dockPx(c.size) + ' px, sağ-aşağı küncdə' : 'Gizlədilib — heç bir ekranda görünməyəcək';
      state.className = 'badge ' + (c.show ? 'green dot' : '');
      state.textContent = c.show ? 'Görünür' : 'Gizli';
      stage.classList.toggle('off', !c.show);
    }
    syncCap();
    var prevCard = h('section', { class: 'card settings-card settings-nzprev', 'aria-label': 'Canlı önizləmə' },
      h('div', { class: 'card-h' }, h('div', null, h('span', { class: 'eyebrow', text: 'Canlı önizləmə' }), h('h3', { text: 'Nuanza' })), state),
      stage, h('div', { class: 'settings-nzcap settings-mt' }, cap,
        h('div', { class: 'settings-row2' },
          h('button', { class: 'btn btn-sm', type: 'button', onclick: function () { react('wave', 'Salam! Mən Nuanzayam — tərcümədə köməkçiniz.', 2800); nz('wave', 'Salam! Buradayam.', 2200); } }, ie('message'), 'Salam de'),
          h('button', { class: 'btn btn-sm btn-ghost', type: 'button', onclick: function () { var T = App.data && App.data.TIPS && App.data.TIPS.general; react('point', T && T.length ? pick(T) : 'Lüğətə əlavə etdiyiniz termini bütün layihələrdə qoruyuram.', 4200); } }, ie('bulb'), 'Məsləhət ver'))));

    /* controls */
    var showRow = switchRow('cShow', 'Nuanzanı göstər', 'Ekranın küncündə dayanır, məsləhət verir və böyük işlərdə Mirzə Məclisini çağırır.', 'eye', 'gold', {
      get: function () { return c.show; },
      set: function (v) {
        c.show = v; setComp({ show: v }); syncCap(); syncSummaries();
        react(v ? 'wave' : 'sad', v ? 'Yenidən buradayam!' : 'Yaxşı, kənarda gözləyəcəyəm…', 2400);
        toast(v ? 'Nuanza qayıtdı' : 'Nuanza gizləndi', 'info', { sub: v ? 'Küncdə sizi gözləyir' : 'Bu bölmədən istədiyiniz vaxt qaytara bilərsiniz' });
      }
    });
    var SIZE_SAY = { sm: 'Kiçik və diqqəti yayındırmayan.', md: 'Klassik ölçü — tam ortada.', lg: 'Belə sizi daha yaxşı görürəm!' };
    var sizeSeg = segCtl('cSize', [{ id: 'sm', label: 'Kiçik' }, { id: 'md', label: 'Orta' }, { id: 'lg', label: 'Böyük' }], {
      get: function () { return sizeKey(c.size); }, label: 'Köməkçinin ölçüsü', block: true,
      set: function (v) {
        c.size = v === 'md' ? 'dock' : v;
        var r = root(); if (r) r.style.setProperty('--nz-w', SZ[v] + 'px');
        setComp({ size: c.size }); syncCap();
        react(v === 'lg' ? 'celebrate' : 'surprised', SIZE_SAY[v], 2200);
      }
    });
    var TALK_HINT = {
      sakit: 'Yalnız vacib anlarda: Məclisin hökmü, səhv, son tarix. Söz buludları göstərilmir.',
      normal: 'Lazım olanda qısa məsləhətlər və təbriklər.',
      cox: 'Hər fürsətdə məsləhət, incəlik və ruhlandırıcı söz — öyrənənlər üçün ideal.'
    };
    var talkHint = h('span', { class: 'hint', text: TALK_HINT[c.talk] || '' });
    var talkSeg = segCtl('cTalk', [{ id: 'sakit', label: 'Sakit' }, { id: 'normal', label: 'Normal' }, { id: 'cox', label: 'Çox' }], {
      get: function () { return c.talk; }, label: 'Danışma tezliyi', block: true,
      set: function (v) {
        c.talk = v; c.chatty = v !== 'sakit';
        setComp({ talk: v, chatty: c.chatty }); talkHint.textContent = TALK_HINT[v]; syncSummaries();
        if (v === 'sakit') react('idle', null, 1200);
        else if (v === 'normal') react('wave', 'Lazım olanda bir-iki kəlmə deyəcəyəm.', 2600);
        else { amb.lastTip = Date.now() - 120000; react('celebrate', 'Hər fürsətdə məsləhət verəcəyəm!', 2600); }
      }
    });
    function intLabel(v) { return v === 0 ? 'Hərəkətsiz' : v < 40 ? 'Sakit' : v < 75 ? 'Təbii' : 'Canlı'; }
    var intVal = h('span', { class: 'settings-rangeval', text: intLabel(c.intensity) + ' · ' + c.intensity + '%' });
    function applyPreviewRate(v) {
      var r = root(); if (!r) return;
      r.classList.toggle('nz-calm', v === 0);
      if (v > 0) setRate(r, 0.5 + v / 100);
    }
    var range = rangeCtl('st-cMotion', 0, 100, 10, c.intensity,
      function (v) { intVal.textContent = intLabel(v) + ' · ' + v + '%'; applyPreviewRate(v); },
      function (v) {
        c.intensity = v; c.motion = v > 0;
        setComp({ intensity: v, motion: v > 0 });
        later(function () { applyPreviewRate(v); }, 80);
        react('point', v === 0 ? 'Hərəkətsiz dayanacağam.' : v < 40 ? 'Sakit və təmkinli olacağam.' : v < 75 ? 'Təbii tempdə.' : 'Enerjim tükənməzdir!', 2400);
      }, 'Animasiya intensivliyi');
    applyPreviewRate(c.intensity);
    V.secTimers.push(setInterval(function () { var v = Number(range.value); if (v > 0) applyPreviewRate(v); }, 1200));

    var ctlCard = card('Davranış', 'Dəyişikliklər dərhal tətbiq olunur — önizləmədə və ekranın küncündə.', [
      h('div', { class: 'list' }, showRow),
      h('div', { class: 'field', 'data-opt': 'cSize' }, h('span', { class: 'label' }, 'Ölçü'), sizeSeg),
      h('div', { class: 'field', 'data-opt': 'cTalk' }, h('span', { class: 'label' }, 'Danışma tezliyi'), talkSeg, talkHint),
      h('div', { class: 'field', 'data-opt': 'cMotion' },
        h('label', { for: 'st-cMotion' }, 'Animasiya intensivliyi', intVal),
        h('div', { class: 'settings-rangewrap' }, range, h('div', { class: 'ticks', 'aria-hidden': 'true' }, h('span', { text: 'Hərəkətsiz' }), h('span', { text: 'Təbii' }), h('span', { text: 'Canlı' }))),
        h('span', { class: 'hint' }, 'Göz qırpma, hörük və lələyin yellənməsi. Ümumi animasiya rejimi (o cümlədən cihazda «hərəkəti azalt» açıq olanda) — ',
          h('button', { class: 'link small', type: 'button', onclick: function () { openSection('appearance', { opt: 'motion' }); } }, 'Görünüş → Animasiyalar'), '.'))
    ]);
    later(function () { react('wave', c.talk === 'sakit' ? null : 'Burada məni öz zövqünüzə görə tənzimləyin.', 2800); }, 450);
    return h('div', { class: 'settings-nzgrid' }, prevCard, ctlCard);
  }

  /* ------------------------------------------------------------------
     13. SECTION: GÖRÜNÜŞ (live)
     ------------------------------------------------------------------ */
  function artLayer(kind, extra) {
    return h('span', { class: 'settings-art ' + kind + (extra ? ' ' + extra : '') },
      h('i', { class: 'a-top' }), h('i', { class: 'a-band' }), h('i', { class: 'a-logo' }), h('i', { class: 'a-side' }), h('i', { class: 'a-s1' }), h('i', { class: 'a-s2' }),
      h('i', { class: 'a-card' }), h('i', { class: 'a-l1' }), h('i', { class: 'a-l2' }), h('i', { class: 'a-l3' }), h('i', { class: 'a-btn' }));
  }
  function setThemeFx(t, origin) {
    var apply = function () { if (App.setTheme) App.setTheme(t); };
    if (origin && typeof D.startViewTransition === 'function' && !reduced()) {
      var r = origin.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
      try {
        var vt = D.startViewTransition(apply);
        vt.ready.then(function () {
          var rad = Math.hypot(Math.max(x, W.innerWidth - x), Math.max(y, W.innerHeight - y));
          R.animate({ clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + rad + 'px at ' + x + 'px ' + y + 'px)'] },
            { duration: 560, easing: 'cubic-bezier(.2,.8,.2,1)', pseudoElement: '::view-transition-new(root)' });
        }).catch(function () { /* ignore */ });
        return;
      } catch (e) { /* fall through */ }
    }
    apply();
  }
  function secAppearance() {
    var ui = uiCfg();
    var cur = App.theme ? App.theme() : 'dark';
    var tiles = h('div', { class: 'settings-theme', role: 'group', 'aria-label': 'Tema', id: 'st-theme' });
    function markTiles(t) { each(tiles.children, function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === t)); }); }
    THEMES.forEach(function (t) {
      var art = t.id === 'system' ? [artLayer('lt'), artLayer('dk', 'half')] : [artLayer(t.id === 'dark' ? 'dk' : 'lt')];
      var b = h('button', { class: 'settings-tt', type: 'button', 'aria-pressed': String(t.id === cur), 'data-v': t.id },
        h('span', { class: 'settings-tt-art', 'aria-hidden': 'true' }, art), h('span', { class: 'tt-ck', 'aria-hidden': 'true' }), h('b', null, ie(t.ic), t.label));
      b.addEventListener('click', function () {
        if ((App.theme ? App.theme() : 'dark') === t.id) return;
        markTiles(t.id);
        setThemeFx(t.id, b);
        syncSummaries();
        if (t.id === 'dark') nz('surprised', 'Gecə rejimi — gözlərinizi qoruyaq.', 2200);
        else if (t.id === 'light') nz('success', 'Gün işığı kimi aydın.', 2000);
        else nz('idle', 'Cihazınızın ayarına uyğunlaşacağam.', 2200);
      });
      tiles.appendChild(b);
    });
    V.onTheme = function () { markTiles(App.theme ? App.theme() : 'dark'); };

    /* font size */
    var fsVal = h('span', { class: 'settings-rangeval' });
    var resetFs = h('button', { class: 'link small', type: 'button', hidden: ui.fontScale === 100 }, 'Standarta qaytar');
    function fsLabel(v) { fsVal.textContent = v + '%' + (v === 100 ? ' · standart' : ''); }
    fsLabel(ui.fontScale);
    var fsRange = rangeCtl('st-fontScale', 85, 125, 5, ui.fontScale,
      function (v) { fsLabel(v); applyFont(v); },
      function (v) { setUi({ fontScale: v }); resetFs.hidden = v === 100; syncSummaries(); }, 'Şrift ölçüsü');
    resetFs.addEventListener('click', function () { fsRange.value = '100'; fsRange._paint(); fsLabel(100); setUi({ fontScale: 100 }); resetFs.hidden = true; syncSummaries(); toast('Şrift ölçüsü standarta qaytarıldı', 'info'); });
    var fsField = h('div', { class: 'field', 'data-opt': 'fontScale' },
      h('label', { for: 'st-fontScale' }, 'Şrift ölçüsü', fsVal),
      h('div', { class: 'settings-aa' }, h('span', { 'aria-hidden': 'true', text: 'A' }), h('div', { class: 'grow' }, fsRange), h('span', { 'aria-hidden': 'true', text: 'A' })),
      h('p', { class: 'settings-sample', text: 'Mətnin mənasını birlikdə tutacağıq.' }),
      h('div', { class: 'row between' }, h('span', { class: 'hint', text: 'Bütün interfeys mütənasib böyüyür və ya kiçilir.' }), resetFs));

    var compactRow = switchRow('compact', 'Kompakt rejim', 'Kartlar, siyahılar və düymələr daha sıx — kiçik ekranda daha çox seqment görünür.', 'grid', '', {
      get: function () { return uiCfg().compact; },
      set: function (v) { setUi({ compact: v }); toast(v ? 'Kompakt rejim aktivdir' : 'Adi sıxlıq bərpa olundu', 'info'); }
    });
    /* motion: full (default) · system · reduce — stored as App.store('motion') */
    var osReduce = false;
    try { osReduce = !!W.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { osReduce = false; }
    var MOTION_HINT = {
      full: 'Nuanza nəfəs alır, göz qırpır, baxışı ilə sizi izləyir; Mirzə Məclisi tam səhnə ilə işləyir — cihazda «hərəkəti azalt» açıq olsa belə.',
      system: osReduce ? 'Cihazınızda «hərəkəti azalt» açıqdır — ona görə animasiyalar indi minimuma endirilib.' : 'Cihazın «hərəkəti azalt» ayarına uyğunlaşır. Hazırda cihaz tam animasiyaya icazə verir.',
      reduce: 'Keçidlər və animasiyalar demək olar ki, dayanır. Nuanza sakit dayanır, Məclis yalnız yumşaq keçidlərlə görünür.'
    };
    function motionNow() { var m = App.motion ? App.motion() : sget('motion', 'full'); return m === 'reduce' || m === true ? 'reduce' : m === 'system' ? 'system' : 'full'; }
    var motionHint = h('span', { class: 'hint', text: MOTION_HINT[motionNow()] });
    var motionSeg = segCtl('motion', [{ id: 'full', label: 'Həmişə tam' }, { id: 'system', label: 'Sistemə görə' }, { id: 'reduce', label: 'Azaldılmış' }], {
      get: motionNow, label: 'Animasiyalar', block: true,
      set: function (v) {
        if (App.setMotion) App.setMotion(v); else sset('motion', v);
        motionHint.textContent = MOTION_HINT[v]; syncSummaries();
        if (v === 'reduce') { toast('Animasiyalar azaldıldı', 'info', { sub: 'Nuanza və Məclis sakit rejimdədir' }); nz('idle', null, 1200); }
        else if (v === 'system') { toast('Animasiyalar sistemə görə', 'info', { sub: osReduce ? 'Cihaz hərəkəti azaltmağı istəyir' : 'Cihaz tam animasiyaya icazə verir' }); nz('read', null, 1400); }
        else { toast('Animasiyalar tam', 'ok', { sub: 'Nuanza yenidən canlıdır' }); nz('celebrate', 'Yenidən hərəkətdəyəm!', 2200); }
      }
    });
    var motionField = h('div', { class: 'field', 'data-opt': 'motion' },
      h('span', { class: 'label' }, 'Animasiyalar'), motionSeg, motionHint);
    var langSeg = segCtl('lang', LANGS_UI, {
      get: function () { return uiCfg().lang; }, label: 'İnterfeys dili', block: true,
      set: function (v) {
        setUi({ lang: v }); syncSummaries();
        if (v === 'az') toast('İnterfeys dili: Azərbaycan', 'ok');
        else toast('İnterfeys dili: ' + (v === 'en' ? 'English' : 'Русский'), 'info', { sub: 'Prototipdə mətnlər hələlik azərbaycancadır — tərcümələr növbəti buraxılışda.' });
      }
    });
    var introRow = h('button', { class: 'list-row', type: 'button', 'data-opt': 'intro', onclick: function () { if (App.onboarding) App.onboarding(); } },
      icTile('sparkle', 'settings-fir'), h('span', { class: 'tx' }, h('b', { text: 'Girişi yenidən göstər' }), h('small', { text: 'Nuanza ilə tanışlıq, rejim və dil cütlərinin seçimi' })), h('span', { class: 'end' }, ie('chevron')));

    return h('div', { class: 'stack-lg' },
      card('Tema', 'Sistem rejimi gündüz işıqlı, axşam qaranlıq görünür.', [tiles], { opt: 'theme' }),
      card('Mətn və sıxlıq', null, [fsField, h('div', { class: 'list' }, compactRow)]),
      card('Hərəkət', 'Nuanzanın canlılığı, Mirzə Məclisinin səhnəsi və ekran keçidləri.', [motionField], { opt: 'motionCard' }),
      card('Dil', null, [h('div', { class: 'field', 'data-opt': 'lang' }, h('span', { class: 'label' }, 'İnterfeys dili'), langSeg,
        h('span', { class: 'hint', text: 'Tərcümə dilləri «İş profili» bölməsində seçilir.' })), h('div', { class: 'list' }, introRow)])
    );
  }

  /* ------------------------------------------------------------------
     14. SECTION: BİLDİRİŞLƏR
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
    var dRow = switchRow('nDeadline', 'Son tarix xatırlatması', 'Təhvilə az qalanda Telegramda və brauzerdə xəbər veririk.', 'clock', 'nar', { extra: leadSeg });
    function syncLead() { dRow._tx.setAttribute('aria-disabled', String(!Dr.nDeadline)); each(leadSeg.children, function (b) { b.disabled = !Dr.nDeadline; }); }
    watch('nDeadline', syncLead); syncLead();
    var remind = card('Xatırlatmalar', 'Nə vaxt və nə barədə xəbər verək.', [h('div', { class: 'list' },
      dRow,
      switchRow('nMeclis', 'Mirzə Məclisinin hökmü hazır olanda', 'Dərin yoxlama və ya böyük sənədin tərcüməsi bitəndə.', 'shield', ''),
      switchRow('nComments', 'Müştəri şərh yazanda', 'Təhvil paketinə yazılan qeydlər və düzəliş istəkləri.', 'message', ''),
      switchRow('nStreak', 'Akademiya: seriya xatırlatması', 'Hər axşam 20:00-da, əgər həmin gün dərs etməmisinizsə.', 'flame', 'gold'))], { opt: 'nDeadline' });

    /* telegram */
    var tgBody = h('div', { class: 'stack' });
    var tgCard = card('Telegram bot', 'Bildirişləri və qısa tərcümələri birbaşa Telegramda alın.', [tgBody], { opt: 'telegram' });
    var codeTimer = null;
    function drawTg() {
      clearInterval(codeTimer);
      tgBody.textContent = '';
      var t = tgLink();
      if (Dr.local) tgBody.appendChild(h('div', { class: 'callout' }, ie('alert'), h('div', null, h('b', { text: 'Lokal rejim seçilib. ' }), 'Yadda saxladıqdan sonra Telegram bildirişləri dayandırılacaq.')));
      if (t.linked) {
        var test = h('button', { class: 'btn btn-sm', type: 'button' }, ie('send'), 'Test mesajı');
        test.addEventListener('click', function () {
          busy(test, true);
          later(function () { busy(test, false); toast('Test mesajı göndərildi', 'ok', { sub: '@NuanzaBot: «Salam' + (Dr.first ? ', ' + Dr.first : '') + '! Bildirişlər işləyir.»', icon: 'telegram' }); }, 900);
        });
        var off = h('button', { class: 'btn btn-ghost btn-sm', type: 'button' }, 'Ayır');
        off.addEventListener('click', function () {
          App.confirm({ title: 'Telegram bot ayrılsın?', text: 'Xatırlatmalar və Məclis hökmləri artıq Telegrama gəlməyəcək.', okLabel: 'Ayır', danger: true }).then(function (ok) {
            if (!ok) return;
            sset('tg-link', { linked: false });
            if (V) { drawTg(); syncSummaries(); }
            toast('Telegram bot ayrıldı', 'info');
          });
        });
        tgBody.appendChild(h('div', { class: 'list' }, h('div', { class: 'list-row' }, icTile('telegram', 'green'),
          h('span', { class: 'tx' }, h('b', null, t.handle || 'Telegram', ' ', h('span', { class: 'badge green dot', text: 'Qoşulub' })),
            h('small', { text: 'Bildirişlər @NuanzaBot vasitəsilə gəlir' + (t.since ? ' · ' + fmtDate(t.since) + ' tarixindən' : '') })))));
        tgBody.appendChild(h('div', { class: 'settings-row2' }, test, off));
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
      var copy = h('button', { class: 'btn btn-sm', type: 'button' }, ie('copy'), 'Kopyala');
      copy.addEventListener('click', function () {
        var done = function () { toast('Kod kopyalandı', 'ok', { sub: tgCode.code }); };
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(tgCode.code).then(done, function () { toast('Kodu əl ilə köçürün', 'warn', { sub: tgCode.code }); });
          else toast('Kodu əl ilə köçürün', 'warn', { sub: tgCode.code });
        } catch (e) { toast('Kodu əl ilə köçürün', 'warn', { sub: tgCode.code }); }
      });
      var renew = h('button', { class: 'icon-btn sm ghost', type: 'button', 'aria-label': 'Yeni kod', title: 'Yeni kod', html: App.icon('refresh') });
      renew.addEventListener('click', function () { tgCode = newCode(); codeB.textContent = tgCode.code; tick(); toast('Yeni kod yaradıldı', 'info'); });
      var verify = h('button', { class: 'btn btn-secondary', type: 'button' }, ie('telegram'), 'Bağlantını yoxla');
      verify.addEventListener('click', function () {
        busy(verify, true);
        later(function () {
          busy(verify, false);
          var handle = App.profile().telegram || '';
          sset('tg-link', { linked: true, handle: handle, since: new Date().toISOString() });
          tgCode = null;
          if (!V) return;
          burstAt(verify, 'confetti');
          drawTg(); syncSummaries();
          toast('Telegram bot qoşuldu', 'ok', { sub: '@NuanzaBot artıq sizə yazacaq', icon: 'telegram' });
          nz('celebrate', 'Artıq Telegramda da yanınızdayam!', 2800);
        }, 1600);
      });
      tgBody.appendChild(h('ol', { class: 'settings-steps' },
        h('li', null, 'Telegramda ', h('b', { text: '@NuanzaBot' }), ' botunu açın və ', h('b', { text: 'Start' }), ' düyməsinə basın.'),
        h('li', null, 'Aşağıdakı kodu bota mesaj kimi göndərin.'),
        h('li', null, '«Bağlantını yoxla» düyməsinə basın.')));
      tgBody.appendChild(h('div', { class: 'settings-code' }, h('div', null, codeB, left), h('div', { class: 'settings-row2' }, renew, copy)));
      tgBody.appendChild(h('div', { class: 'row' }, verify));
    }
    watch('local', drawTg);
    drawTg();

    /* e-mail */
    var daySel = selectCtl('nWeeklyDay', WEEK_DAYS, { label: 'Göndərmə vaxtı' });
    var wRow = switchRow('nWeekly', 'Həftəlik hesabat', 'Həftənin işi və yaxınlaşan son tarixlər — bir məktubda.', 'mail', 'gold', { extra: daySel });
    function syncDay() { wRow._tx.setAttribute('aria-disabled', String(!Dr.nWeekly)); daySel.disabled = !Dr.nWeekly; }
    watch('nWeekly', syncDay); syncDay();
    var mailCard = card('E-poçt', null, [h('div', { class: 'list' }, wRow)], { opt: 'nWeekly' });

    return h('div', { class: 'stack-lg' }, remind, tgCard, mailCard);
  }
  /* ------------------------------------------------------------------
     15. SECTION: MƏXFİLİK VƏ MƏLUMAT
     ------------------------------------------------------------------ */
  function maskLine(on) {
    function tok(t) { return h('span', { class: 'settings-tok', text: t }); }
    if (!on) return h('span', null, 'Cənab Rəşad Əliyev 12 500 AZN məbləğini 15.11.2026 tarixinədək ödəməlidir.');
    return h('span', null, 'Cənab ', tok('AD_1'), ' ', tok('MƏBLƏĞ_1'), ' AZN məbləğini ', tok('TARİX_1'), ' tarixinədək ödəməlidir.');
  }
  function secPrivacy() {
    var localNote = h('div', { class: 'callout' });
    function drawLocal() {
      localNote.className = 'callout ' + (Dr.local ? 'green' : 'navy');
      localNote.textContent = '';
      localNote.appendChild(ie(Dr.local ? 'lock' : 'info'));
      localNote.appendChild(Dr.local
        ? h('div', null, h('b', { text: 'Lokal rejim: ' }), 'layihələr, tərcümə yaddaşı və lüğət yalnız bu cihazda saxlanılır. Bulud sinxronizasiyası və Telegram bot dayanır; AI tərcüməsi üçün yalnız seçdiyiniz seqment şifrəli kanalla göndərilir və saxlanılmır.')
        : h('div', null, h('b', { text: 'Bulud rejimi: ' }), 'layihələr şifrələnmiş şəkildə Bakıdakı məlumat mərkəzində saxlanılır və bütün cihazlarınızda sinxronlaşır. Mətnləriniz AI modellərini öyrətmək üçün istifadə olunmur.'));
    }
    watch('local', drawLocal); drawLocal();
    var maskOut = h('div', { class: 'tgt' }, maskLine(Dr.mask));
    var maskK = h('span', { class: 'k' });
    function drawMask() {
      maskK.textContent = '';
      maskK.appendChild(ie(Dr.mask ? 'eyeoff' : 'eye'));
      maskK.appendChild(D.createTextNode(Dr.mask ? 'AI-a belə gedir' : 'AI-a olduğu kimi gedir'));
      maskOut.textContent = ''; maskOut.appendChild(maskLine(Dr.mask));
      maskOut.classList.remove('swap'); void maskOut.offsetWidth; maskOut.classList.add('swap');
    }
    drawMask(); watch('mask', drawMask);
    var maskEx = h('div', { class: 'settings-ex', 'aria-live': 'polite' }, maskK, maskOut,
      h('span', { class: 'small muted', text: 'Cavab gələndə adlar, məbləğlər və tarixlər öz yerinə qaytarılır.' }));

    var dataCard = card('Məlumat necə işlənir', null, [
      h('div', { class: 'list' }, switchRow('local', 'Lokal rejim', 'Hassas sənədlər üçün: məlumatlar cihazdan çıxmır.', 'lock', 'green')),
      localNote,
      h('div', { class: 'list' }, switchRow('mask', 'AI-a göndərməzdən əvvəl adları və rəqəmləri maskala', 'Şəxs adları, məbləğlər, tarixlər və hesab nömrələri yer tutucularla əvəz olunur.', 'eyeoff', '')),
      maskEx,
      fieldBox('retention', 'Avtomatik silmə müddəti', selectCtl('retention', RETENTION), { hint: 'Tamamlanmış layihələrin mətnləri silinir; lüğət və tərcümə yaddaşı qalır.' })
    ]);

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
        var blob = new Blob([JSON.stringify({ app: 'Nuanza', exported: new Date().toISOString(), data: data }, null, 2)], { type: 'application/json' });
        var url = URL.createObjectURL(blob), a = h('a', { href: url, download: file });
        D.body.appendChild(a); a.click(); a.remove();
        later(function () { URL.revokeObjectURL(url); }, 4000);
        toast('Yükləndi', 'ok', { sub: file, icon: 'download' });
      } catch (e) { toast('Fayl yaradılmadı', 'warn', { sub: 'Brauzer yükləməyə icazə vermədi' }); }
    }
    var tiles = h('div', { class: 'tiles settings-exp' },
      h('button', { class: 'tile', type: 'button', 'aria-label': 'JSON ixrac et — profil, layihələr və ayarlar', onclick: exportJson }, icTile('database'),
        h('span', null, h('b', { text: 'JSON' }), h('small', { text: 'Profil, layihələr, ayarlar' }))));
    var exportCard = card('Məlumatlarımı ixrac et', 'Hər şey sizindir — istənilən vaxt açıq standartlarda götürün.', [tiles], { opt: 'export' });

    /* danger */
    var wipeBtn = h('button', { class: 'btn btn-danger', type: 'button' }, ie('trash'), 'Hər şeyi sil');
    wipeBtn.addEventListener('click', function () { wipeAll(wipeBtn); });
    var danger = h('section', { class: 'card settings-card danger', 'data-opt': 'wipe' },
      h('div', { class: 'card-h' }, h('div', null, h('span', { class: 'eyebrow plain', text: 'Təhlükəli zona' }), h('h3', { text: 'Bütün məlumatları sil' }))),
      h('div', { class: 'settings-danger-row' },
        h('p', { text: 'Layihələr, tərcümə yaddaşı, lüğət, Akademiya irəliləyişi və ayarlar həmişəlik silinəcək. Əvvəlcə ixrac etməyi tövsiyə edirik.' }),
        wipeBtn));

    return h('div', { class: 'stack-lg' }, dataCard, exportCard, danger);
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
      if (!yes || !isSil(inp.value)) { if (!yes) nz('success', 'Uf, yaxşı ki fikrinizi dəyişdiniz.', 2200); return; }
      busy(btn, true);
      nz('worried', null, 1400);
      later(function () {
        busy(btn, false);
        wipeStorage();
        R.style.removeProperty('font-size'); R.removeAttribute('data-density');
        tgCode = null;
        if (V) { S0 = loadSaved(); Dr = clone(S0); }
        toast('Bütün məlumatlar silindi', 'ok', { sub: 'Nuanza ilk günkü kimi təmizdir' });
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
    var tbody = h('tbody');
    SHORTCUTS.forEach(function (g) {
      tbody.appendChild(h('tr', { class: 'grp' }, h('td', { colspan: '2', text: g.grp })));
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
    });
    V.keyRows = rows;
    V.keyDown = {};
    var table = h('div', { class: 'table-wrap', 'data-opt': 'keys' }, h('table', { class: 'table compact settings-keys' },
      h('thead', null, h('tr', null, h('th', { text: 'Əməliyyat' }), h('th', { style: 'text-align:right', text: 'Qısayol' }))), tbody));
    return h('div', { class: 'stack-lg' },
      h('div', { class: 'callout navy' }, ie('keyboard'), h('div', null, h('b', { text: 'Sınayın: ' }), 'klaviaturada düymələri basın — uyğun qısayol cədvəldə işıqlanacaq.')),
      table,
      h('div', { class: 'row' }, h('button', { class: 'btn btn-sm', type: 'button', onclick: function () { if (App.shortcuts) App.shortcuts(); } }, ie('keyboard'), 'Qısa siyahını pəncərədə aç'),
        h('span', { class: 'small muted' }, 'və ya istənilən ekranda ', h('kbd', { class: 'kbd', text: '?' }), ' basın')));
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
      'Nuanza mətnlərinizi yalnız tərcümə və yoxlama üçün emal edir. Mətnləriniz süni intellekt modellərini öyrətmək üçün istifadə olunmur.',
      'Bulud rejimində məlumatlar şifrələnmiş şəkildə Bakıdakı məlumat mərkəzində saxlanılır. Lokal rejimdə isə cihazınızdan çıxmır.',
      'Maskalama aktiv olanda şəxs adları, məbləğlər, tarixlər və hesab nömrələri AI-a göndərilməzdən əvvəl yer tutucularla əvəz olunur.',
      'İstənilən vaxt bütün məlumatlarınızı JSON, TMX və TBX formatında ixrac edə və ya həmişəlik silə bilərsiniz.'] },
    terms: { title: 'İstifadə şərtləri', paras: [
      'Tərcümələrin müəllif hüquqları sizə və ya sifarişçinizə məxsusdur. Nuanza alət rolunu oynayır və tərcümə üzərində hüquq iddia etmir.',
      'Notarial və hüquqi sənədlərdə yekun məsuliyyət imzalayan tərcüməçinin üzərindədir. Mirzə Məclisinin hökmü tövsiyə xarakterlidir.'] },
    licenses: { title: 'Açıq mənbə lisenziyaları', paras: [
      'Unbounded və Plus Jakarta Sans şriftləri — SIL Open Font License 1.1.',
      'Xalça naxışları və göl motivi Nuanza komandası tərəfindən çəkilib.',
      'Nuanza və Mirzə Məclisi personajları — © 2026 Nuanza, Bakı.',
      'Akademiyadakı real xəbər mətnləri — NTREX-128 (Microsoft), CC BY-SA 4.0; səhv annotasiyaları və düzəldilmiş tərcümələr Nuanzanındır və eyni lisenziya (CC BY-SA 4.0) ilə paylaşılır.',
      'İnsan Hüquqları haqqında Ümumi Bəyannamə (BMT, 1948) — rəsmi ingilis mətni və rəsmi Azərbaycan tərcüməsi.'] }
  };
  function legalSheet(id) {
    var L = LEGAL[id];
    App.sheet({ title: L.title, body: h('div', { class: 'prose' }, L.paras.map(function (t) { return h('p', { text: t }); }),
      h('p', { class: 'small muted', text: 'Son yenilənmə: 7 oktyabr 2026' })), actions: [{ label: 'Aydındır', kind: 'primary' }] });
  }
  function feedbackSheet() {
    var kind = 'idea', rating = 0;
    var kinds = segCtl('fbKind', [{ id: 'idea', label: 'Təklif', ic: 'bulb' }, { id: 'bug', label: 'Xəta', ic: 'alert' }, { id: 'thanks', label: 'Təşəkkür', ic: 'heart' }], {
      get: function () { return kind; }, set: function (v) { kind = v; ta.placeholder = PH[v]; }, label: 'Rəyin növü', block: true, noId: true });
    var PH = {
      idea: 'Məsələn: hüquqi üslubda «shall» həmişə «-məlidir» kimi verilsin.',
      bug: 'Nə etdiniz, nə gözləyirdiniz və nə baş verdi?',
      thanks: 'Nuanzada ən çox nəyi bəyənirsiniz?'
    };
    var taId = uid('fb');
    var ta = h('textarea', { class: 'textarea', id: taId, placeholder: PH.idea, maxlength: '1000', 'aria-describedby': taId + '-c ' + taId + '-e' });
    var cnt = h('span', { class: 'hint', id: taId + '-c', text: '0 / 1000' });
    var err = h('span', { class: 'err', id: taId + '-e', role: 'alert', hidden: true });
    ta.addEventListener('input', function () { cnt.textContent = ta.value.length + ' / 1000'; if (ta.value.trim().length >= 10) { err.hidden = true; ta.removeAttribute('aria-invalid'); } });
    var stars = h('div', { class: 'settings-stars', role: 'radiogroup', 'aria-label': 'Nuanzanı qiymətləndirin' });
    var STAR_TX = ['', 'Pis', 'Orta', 'Yaxşı', 'Çox yaxşı', 'Əla!'];
    var starTx = h('span', { class: 'small muted', 'aria-live': 'polite' });
    [1, 2, 3, 4, 5].forEach(function (i) {
      var b = h('button', { type: 'button', role: 'radio', 'aria-checked': 'false', 'aria-label': i + ' ulduz' }, h('span', { 'aria-hidden': 'true' }));
      b.addEventListener('click', function () {
        rating = i;
        each(stars.children, function (x, j) { x.classList.toggle('on', j < i); x.setAttribute('aria-checked', String(j + 1 === i)); });
        starTx.textContent = STAR_TX[i];
        if (i === 5) burstAt(b, 'stars');
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
      actions: [{ label: 'Ləğv et', kind: 'ghost' }, { label: 'Göndər', kind: 'primary', icon: 'send', onClick: function () {
        if (ta.value.trim().length < 10) {
          err.textContent = ''; err.appendChild(ie('alert')); err.appendChild(D.createTextNode('Bir-iki cümlə yazın — ən azı 10 simvol.'));
          err.hidden = false; ta.setAttribute('aria-invalid', 'true'); focusEl(ta);
          return false;
        }
        return new Promise(function (res) {
          later(function () {
            res(true);
            toast('Rəyiniz göndərildi', 'ok', { sub: 'Təşəkkürlər! Komandamız 2 iş günü ərzində baxacaq.' });
            nz('celebrate', rating >= 4 ? 'Çox sağ olun! Bu, bizim üçün çox dəyərlidir.' : 'Rəyiniz üçün sağ olun — düzəldəcəyik!', 2800);
          }, 1100);
        });
      } }]
    });
  }
  function secAbout() {
    var ver = App.version || '2.0';
    var upd = h('button', { class: 'btn btn-sm', type: 'button' }, ie('refresh'), 'Yenilikləri yoxla');
    upd.addEventListener('click', function () {
      busy(upd, true);
      later(function () { busy(upd, false); toast('Ən son versiyadasınız', 'ok', { sub: 'Nuanza ' + ver + ' · 7 oktyabr 2026' }); }, 1200);
    });
    var hero = h('section', { class: 'card framed settings-about carpet', 'data-opt': 'version' },
      h('span', { html: App.logo ? App.logo('logo') : '' }),
      h('h2', { text: 'Nuanza' }),
      h('p', { class: 'muted', text: 'Versiya ' + ver + ' · buraxılış 2026.10 · Bakı' }),
      h('div', { class: 'row' }, upd,
        h('button', { class: 'btn btn-primary btn-sm', type: 'button', 'data-opt': 'feedback', onclick: feedbackSheet }, ie('message'), 'Rəy göndər')),
      h('div', { class: 'settings-legal', 'data-opt': 'legal' },
        h('button', { class: 'link', type: 'button', onclick: function () { legalSheet('privacy'); } }, 'Məxfilik siyasəti'),
        h('button', { class: 'link', type: 'button', onclick: function () { legalSheet('terms'); } }, 'İstifadə şərtləri'),
        h('button', { class: 'link', type: 'button', onclick: function () { legalSheet('licenses'); } }, 'Lisenziyalar')));
    var info = card('Texniki məlumat', null, [h('dl', { class: 'kv' },
      h('dt', { text: 'Mühərrik' }), h('dd', { text: 'Mirzə Məclisi 2.0 · 5 mirzə' }),
      h('dt', { text: 'Dillər' }), h('dd', { text: 'AZ · EN · RU · TR' }),
      h('dt', { text: 'Telegram bot' }), h('dd', { text: '@NuanzaBot' }),
      h('dt', { text: 'Məlumat mərkəzi' }), h('dd', { text: 'Bakı, Azərbaycan' }),
      h('dt', { text: 'Cihaz' }), h('dd', { text: detectDevice() }))]);
    var CHANGES = [
      ['2.0', 'Oktyabr 2026', 'Mirzə Məclisi, Akademiya rejimi və köməkçi Nuanza.'],
      ['1.6', 'İyul 2026', 'Telegram bot, TMX/TBX ixracı və lokal rejim.'],
      ['1.4', 'Aprel 2026', 'Türk formalarının aşkarlanması və üslubun avtomatik tanınması.']
    ];
    var news = card('Yeniliklər', null, [h('div', { class: 'list' }, CHANGES.map(function (c, i) {
      return h('div', { class: 'list-row' }, h('span', { class: 'medal sm' + (i ? ' locked' : ''), 'aria-hidden': 'true' }, h('b', { text: c[0].split('.')[0] })),
        h('span', { class: 'tx' }, h('b', null, 'Nuanza ' + c[0], ' ', i === 0 ? h('span', { class: 'badge gold', text: 'Yeni' }) : null), h('small', { text: c[1] + ' · ' + c[2] })));
    }))]);
    return h('div', { class: 'stack-lg' }, hero, info, news,
      h('p', { class: 'small muted', style: 'text-align:center', text: 'Bakıda, çay və səbirlə hazırlanıb.' }));
  }

  var BUILD = {
    account: secAccount, work: secWork, translation: secTranslation, companion: secCompanion, appearance: secAppearance,
    notifications: secNotifications, privacy: secPrivacy, shortcuts: secShortcuts, about: secAbout
  };

  /* ------------------------------------------------------------------
     19. NAV, SEARCH, SUMMARIES
     ------------------------------------------------------------------ */
  function summaryOf(id) {
    try {
      if (id === 'account') return draftName() || Dr.email || 'Profilinizi tamamlayın';
      if (id === 'work') { var r = parseDec(Dr.rate); return (pairsShort(Dr.pairs) || '—') + (isFinite(r) ? ' · ' + num(r) + ' AZN/söz' : ''); }
      if (id === 'translation') return (REG_SHORT[Dr.register] || '') + ' · ' + (Q_SHORT[Dr.quality] || '');
      if (id === 'companion') { var c = compCfg(); return c.show ? 'Görünür · ' + ({ sakit: 'sakit', normal: 'normal danışır', cox: 'çox danışır' }[c.talk] || '') : 'Gizlədilib'; }
      if (id === 'appearance') { var t = App.theme ? App.theme() : 'dark'; var mo = App.motion ? App.motion() : 'full'; return ({ system: 'Sistem', light: 'İşıqlı', dark: 'Qaranlıq' }[t] || '') + ' · şrift ' + uiCfg().fontScale + '%' + (mo === 'reduce' ? ' · az animasiya' : mo === 'system' ? ' · animasiya sistemə görə' : ''); }
      if (id === 'notifications') return tgLink().linked ? 'Telegram qoşulub' : 'Telegram qoşulmayıb';
      if (id === 'privacy') return Dr.local ? 'Lokal rejim' : (Dr.mask ? 'Bulud · maskalama aktiv' : 'Bulud rejimi');
      if (id === 'shortcuts') { var n = 0; SHORTCUTS.forEach(function (g) { n += g.rows.length; }); return n + ' qısayol'; }
      if (id === 'about') return 'Nuanza ' + (App.version || '2.0');
    } catch (e) { /* ignore */ }
    return '';
  }
  function syncSummaries() {
    if (!V || !V.navSmall) return;
    SECTIONS.forEach(function (s) { var el = V.navSmall[s.id]; if (el) el.textContent = summaryOf(s.id); });
  }
  function buildNav() {
    V.navRows = {}; V.navSmall = {}; V.navDot = {};
    var wrap = h('div', { class: 'stack-lg settings-groups' });
    GROUPS.forEach(function (g) {
      var hid = uid('grp');
      var list = h('div', { class: 'list' });
      SECTIONS.filter(function (s) { return s.grp === g; }).forEach(function (s) {
        var sm = h('small');
        var dot = h('span', { class: 'settings-dot', hidden: true, title: 'Saxlanılmamış dəyişiklik' }, h('span', { class: 'sr-only', text: 'saxlanılmamış dəyişiklik var' }));
        var b = h('button', { class: 'list-row settings-nav-row', type: 'button', 'data-sec': s.id },
          icTile(s.icon, s.cls), h('span', { class: 'tx' }, h('b', { text: s.title }), sm), h('span', { class: 'end' }, dot, ie('chevron')));
        b.addEventListener('click', function () { openSection(s.id); });
        V.navRows[s.id] = b; V.navSmall[s.id] = sm; V.navDot[s.id] = dot;
        list.appendChild(b);
      });
      wrap.appendChild(h('div', { class: 'settings-grp', role: 'group', 'aria-labelledby': hid },
        h('div', { class: 'settings-grp-h', id: hid, text: g }), h('div', { class: 'card settings-navcard' }, list)));
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
      V.results.appendChild(h('div', { class: 'empty settings-noresult' }, h('div', { class: 'empty-art' }),
        h('h3', { text: '«' + raw.trim() + '» tapılmadı' }),
        h('p', { text: 'Başqa sözlə yoxlayın: məsələn, «tema», «VÖEN», «Telegram» və ya «maskala».' })));
      return;
    }
    V.results.appendChild(h('div', { class: 'settings-grp' }, h('div', { class: 'settings-grp-h', text: out.length + ' nəticə' }),
      h('div', { class: 'card settings-navcard settings-results' }, h('div', { class: 'list' }, out.map(function (r) {
        var s = SEC[r.sec];
        var b = h('button', { class: 'list-row settings-res-row', type: 'button' }, icTile(s.icon, s.cls),
          h('span', { class: 'tx' }, h('b', null, markText(r.label, toks)), h('small', { text: r.opt ? s.title + ' › ' + r.label : 'Bölmə · ' + s.desc })),
          h('span', { class: 'end' }, ie('chevron')));
        b.addEventListener('click', function () { openSection(r.sec, { opt: r.opt }); });
        return b;
      })))));
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
      body = h('div', { class: 'empty' }, h('div', { class: 'empty-art' }), h('h3', { text: 'Bu bölmə açılmadı' }), h('p', { text: 'Bir az sonra yenidən cəhd edin.' }));
    }
    V.secTitle = h('h2', { tabindex: '-1', text: s.title });
    var head = h('div', { class: 'settings-subh' },
      h('button', { class: 'btn btn-ghost btn-sm settings-back', type: 'button', onclick: goBack }, ie('back'), 'Ayarlar'),
      h('div', { class: 'settings-subh-t' }, icTile(s.icon, (s.cls ? s.cls + ' ' : '') + 'lg'),
        h('div', { class: 'grow' }, V.secTitle, h('p', { text: s.desc }), s.live ? h('span', { class: 'badge green dot', text: 'Dərhal tətbiq olunur' }) : null)));
    var sec = h('div', { class: 'settings-sec' + (o.noAnim ? '' : (ST.wide ? ' in' : ' in-r')), 'data-sec': s.id }, head, body);
    V.main.textContent = '';
    V.main.appendChild(sec);
    V.secEl = sec;
    if (V.pendingErrs) { showErrors(V.pendingErrs); V.pendingErrs = null; }
  }
  function openSection(id, o) {
    o = o || {};
    if (!V || !SEC[id]) return;
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
    if (!el && ctl) el = ctl.closest('.field, .list-row, .card') || ctl;
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
    V.barB.textContent = ST.wide ? 'Yadda saxlanılmamış dəyişikliklər' : n + ' dəyişiklik';
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
      nz('worried', 'Bir şey düz deyil — qırmızı sahəyə baxın.', 2600);
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
    var r = V.bar.getBoundingClientRect();
    updateDirty();
    var names = secsOf(keys).map(function (s) { return SEC[s].title; });
    toast('Yadda saxlanıldı', 'ok', { sub: names.join(' · ') });
    try { if (App.fx && App.fx.burst && r.width) App.fx.burst(r.right - 60, r.top + r.height / 2, 'stars'); } catch (e) { /* ignore */ }
    nz('success', pick(['Hazırdır! Yeni ayarlar artıq işləyir.', 'Yadda saxladım — növbəti tərcümədə nəzərə alacağam.', 'Hər şey yerindədir.']), 2600);
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
    if (id && SEC[id]) { if (ST.sec !== id) openSection(id, { fromPop: true, noPush: true }); }
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
    var head = h('div', { class: 'page-h' },
      h('div', null, h('span', { class: 'eyebrow', text: 'Hesab' }), h('h1', { html: 'Profil və <em>ayarlar</em>' }),
        h('p', { text: 'Nuanzanı iş üslubunuza uyğunlaşdırın. Formlar qaralama kimi saxlanılır — «Yadda saxla» basana qədər heç nə dəyişmir.' })));

    /* side: search + nav + results */
    V.search = h('input', { class: 'input', type: 'search', id: 'st-search', placeholder: 'Ayarlarda axtar…', autocomplete: 'off', spellcheck: 'false', 'aria-label': 'Ayarlarda axtar', 'aria-controls': 'st-results', enterkeyhint: 'search' });
    V.search.addEventListener('input', runSearch);
    V.search.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && V.search.value) { e.preventDefault(); e.stopPropagation(); V.search.value = ''; runSearch(); }
      else if (e.key === 'Enter') { var f = V.results.querySelector('.settings-res-row'); if (f) { e.preventDefault(); f.click(); } }
      else if (e.key === 'ArrowDown') { var g = V.results.querySelector('.settings-res-row') || V.groups.querySelector('.settings-nav-row'); if (g) { e.preventDefault(); focusEl(g); } }
    });
    V.results = h('div', { id: 'st-results', hidden: true });
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
      h('span', { class: 'sb-ic', html: App.icon('alert') }), h('span', { class: 'sb-tx' }, V.barB, V.barS),
      h('span', { class: 'sb-act' }, h('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: cancel }, 'Ləğv et'), V.saveBtn));

    V.wrap = h('div', { class: 'settings-wrap' }, V.side, V.main, V.bar);
    V.page = h('div', { class: 'page settings-page', 'data-view': 'list' }, head, buildHero(), V.wrap);
    el.appendChild(V.page);
    try { var hdr = D.querySelector('.hdr'); V.hdrH = hdr ? hdr.getBoundingClientRect().height : 70; } catch (e) { V.hdrH = 70; }

    /* initial view */
    ST.wide = measureWide();
    V.page.classList.toggle('is-wide', ST.wide);
    var want = params.s || params.section || params.id || keepSec || null;
    if (want && !SEC[want]) want = null;
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
