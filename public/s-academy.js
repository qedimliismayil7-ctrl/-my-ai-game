/* =====================================================================
   NUANZA — s-academy.js
   Akademiya ekranları:
     • 'task'      Tapşırıq — səviyyəyə görə mətn al, mənbə + ipucu, tərcümə,
                   «Nuanza yoxlasın» → Mirzə Məclisi → böyük qiymət hərfi, bal
                   halqası, bacarıqlar, səhv kartları, XP (+ rütbə medalı).
     • 'practice'  Məşq — 7 oyun kartı; «Detektiv» səhifədə oynanılır, digərləri
                   vərəqdə (Sən vs AI, Düzəlt, Kontekst dəyiş, Sürət, Şifahi,
                   Simulyator).
     • 'cards'     Səhv kartları — yalnız istifadəçinin öz səhvlərindən (academy:mycards);
                   aralıqlı təkrar (Leitner), çevrilən kart.
     • 'progress'  Mənim inkişafım — yalnız real nəticələr: rütbə, bacarıq radarı,
                   bal xətti, səhv xəritəsi, missiyalar, həftəlik çağırış.
                   Yeni istifadəçi üçün boş vəziyyət + bir addım («İlk tapşırığa başla»).
   Plain browser JS. Uses App.* (app.js) and app.css components.
   Screen CSS classes: task-*, practice-*, cards-*, progress-*.
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
  var MON = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avqust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'];
  var MON_S = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avq', 'sen', 'okt', 'noy', 'dek'];
  var DAY = 86400000;
  var IS_MAC = /Mac|iPhone|iPad|iPod/.test((navigator.platform || '') + ' ' + (navigator.userAgent || ''));
  var MOD = IS_MAC ? '⌘' : 'Ctrl';

  function ie(name) {
    if (typeof App.iconEl === 'function') return App.iconEl(name);
    var t = D.createElement('template'); t.innerHTML = App.icon(name); return t.content.firstChild;
  }
  function icTile(name, cls) { return h('span', { class: 'ic' + (cls ? ' ' + cls : ''), html: App.icon(name), 'aria-hidden': 'true' }); }
  function lower(s) { s = String(s == null ? '' : s); try { return s.toLocaleLowerCase('az'); } catch (e) { return s.toLowerCase(); } }
  function upper(s) { s = String(s == null ? '' : s); try { return s.toLocaleUpperCase('az'); } catch (e) { return s.toUpperCase(); } }
  function cap(s) { s = String(s || ''); return s ? upper(s.charAt(0)) + s.slice(1) : s; }
  function esc(s) { return App.esc ? App.esc(s) : String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fold(s) { return App.fold ? App.fold(s) : lower(s); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function num(n) { return App.fmt && App.fmt.num ? App.fmt.num(n) : String(n); }
  function f1(n) { return Math.round(n * 10) / 10; }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function words(s) { return (String(s || '').match(/[\p{L}\p{N}]+(?:[-'’][\p{L}\p{N}]+)*/gu) || []).length; }
  function dayKey(d) { d = d || new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function weekKey(d) {
    d = d || new Date();
    var m = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
    return 'w' + dayKey(m);
  }
  function startOfDay(t) { var d = new Date(t); return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); }
  function shortDate(t) { var d = new Date(t); return d.getDate() + ' ' + MON_S[d.getMonth()]; }
  function longDate(t) { var d = new Date(t); return d.getDate() + ' ' + MON[d.getMonth()]; }
  function sget(k, fb) { try { var v = App.store.get(k, fb); return v === undefined || v === null ? fb : v; } catch (e) { return fb; } }
  function sset(k, v) { try { App.store.set(k, v); } catch (e) { /* storage blocked */ } }
  function profile() {
    try { return App.profile() || {}; } catch (e) { return { name: '', firstName: '', xp: 0, streak: 0, bestStreak: 0, dailyGoal: 30, initials: '', avatarColor: 'av-firuze' }; }
  }
  var RANKS_FB = [{ name: 'Şagird', min: 0 }, { name: 'Katib', min: 400 }, { name: 'Münşi', min: 1200 }, { name: 'Mirzə', min: 2500 }, { name: 'Dilmanc', min: 5000 }, { name: 'Ustad', min: 10000 }];
  function ranks() { return (App.data && App.data.RANKS) || App.RANKS || RANKS_FB; }
  function rankOf(xp) {
    if (typeof App.rank === 'function') { try { return App.rank(xp); } catch (e) { /* fall through */ } }
    var R = ranks(), i = 0; xp = Number(xp) || 0;
    for (var k = 0; k < R.length; k++) if (xp >= R[k].min) i = k;
    var nx = R[i + 1] || null;
    return { name: R[i].name, index: i, min: R[i].min, xp: xp, next: nx ? nx.min : null, nextName: nx ? nx.name : null, progress: nx ? clamp((xp - R[i].min) / (nx.min - R[i].min), 0, 1) : 1, toNext: nx ? nx.min - xp : 0 };
  }
  function reduced() { try { return App.reducedMotion ? App.reducedMotion() : false; } catch (e) { return false; } }
  function chatty() { try { return App.companionConfig ? App.companionConfig().chatty !== false : true; } catch (e) { return true; } }
  function nz(state, text, ms) {
    var c = App.companion; if (!c || typeof c.set !== 'function') return;
    try { c.set(state || 'idle', text && chatty() ? { say: text, ms: ms || 3000 } : { ms: ms || 1600 }); } catch (e) { /* ignore */ }
  }
  function pointOf(el) {
    try { if (el && el.isConnected) { var r = el.getBoundingClientRect(); if (r.width || r.height) return { x: r.left + r.width / 2, y: r.top + Math.min(r.height / 2, 24) }; } } catch (e) { /* ignore */ }
    return { x: W.innerWidth / 2, y: W.innerHeight * 0.4 };
  }
  function burstAt(el, kind) {
    var p = pointOf(el);
    try {
      if (W.NuanzaFX && typeof W.NuanzaFX.burst === 'function') W.NuanzaFX.burst(p.x, p.y, kind || 'stars');
      else if (App.fx && App.fx.burst) App.fx.burst(p.x, p.y, kind || 'stars');
    } catch (e) { /* ignore */ }
  }
  function fxXP(pt, text) {
    try {
      if (W.NuanzaFX && typeof W.NuanzaFX.xp === 'function') W.NuanzaFX.xp(pt.x, pt.y, text);
      else if (App.fx && App.fx.xp) App.fx.xp(pt.x, pt.y, text);
    } catch (e) { /* ignore */ }
  }
  function fxMedal(name) {
    try {
      if (W.NuanzaFX && typeof W.NuanzaFX.medal === 'function') W.NuanzaFX.medal(name);
      else if (App.fx && App.fx.medal) App.fx.medal(name);
    } catch (e) { /* ignore */ }
  }
  function busy(btn, on) { if (!btn) return; if (on) btn.setAttribute('aria-busy', 'true'); else btn.removeAttribute('aria-busy'); }
  function isBusy(btn) { return !!btn && btn.getAttribute('aria-busy') === 'true'; }
  function badge(text, cls, iconName) { return h('span', { class: 'badge' + (cls ? ' ' + cls : '') }, iconName ? ie(iconName) : null, text); }
  function shake(el) { if (!el) return; el.classList.remove('task-shake'); void el.offsetWidth; el.classList.add('task-shake'); }
  function flash(el) { if (!el) return; el.classList.remove('task-flash'); void el.offsetWidth; el.classList.add('task-flash'); }
  function focusSoft(el) { if (!el) return; try { el.focus({ preventScroll: true }); } catch (e) { try { el.focus(); } catch (e2) { /* ignore */ } } }
  function scrollToEl(el, off) {
    if (!el || !el.getBoundingClientRect) return;
    var y = el.getBoundingClientRect().top + (W.scrollY || W.pageYOffset || 0) - (off == null ? 92 : off);
    try { W.scrollTo({ top: Math.max(0, y), behavior: reduced() ? 'auto' : 'smooth' }); } catch (e) { W.scrollTo(0, Math.max(0, y)); }
  }
  function copyText(text, label) {
    var done = function () { App.toast(label || 'Kopyalandı', 'ok'); };
    try { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(done, done); return; } } catch (e) { /* ignore */ }
    done();
  }
  function hasScreen(id) {
    try { var l = App.screens ? App.screens() : []; for (var i = 0; i < l.length; i++) if (l[i] && l[i].id === id) return true; } catch (e) { /* ignore */ }
    return false;
  }
  function goFirst(ids, params, miss) {
    for (var i = 0; i < ids.length; i++) if (hasScreen(ids[i])) { App.go(ids[i], params || {}); return true; }
    App.toast(miss || 'Bu bölmə hazırlanır', 'info', { sub: 'Prototipdə hələ açılmayıb' });
    return false;
  }
  function confirmAsk(o) {
    if (typeof App.confirm === 'function') { try { return Promise.resolve(App.confirm(o)); } catch (e) { /* fall through */ } }
    return Promise.resolve(true);
  }

  /* lifecycle: timers, listeners, mini companions — cleaned on leave */
  var live = { to: [], iv: [], off: [], minis: [] };
  var gen = 0;
  function later(fn, ms) { var t = setTimeout(fn, ms || 0); live.to.push(t); return t; }
  function listen(target, ev, fn, opt) { target.addEventListener(ev, fn, opt); live.off.push(function () { target.removeEventListener(ev, fn, opt); }); }
  function cleanup() {
    live.to.forEach(clearTimeout); live.iv.forEach(clearInterval);
    live.off.forEach(function (f) { try { f(); } catch (e) { /* ignore */ } });
    live.minis.forEach(function (m) { try { if (m && m.destroy) m.destroy(); } catch (e) { /* ignore */ } });
    live = { to: [], iv: [], off: [], minis: [] };
  }
  function mountMini(el, state) {
    if (W.Nuanza && typeof W.Nuanza.mount === 'function') {
      try {
        var m = W.Nuanza.mount(el, { size: 'mini', label: 'Nuanza — toxunun' });
        if (m) { live.minis.push(m); if (state && m.set) m.set(state, {}); return m; }
      } catch (e) { /* fall through */ }
    }
    el.textContent = '';
    el.appendChild(h('span', { class: 'medal sm', 'aria-hidden': 'true' }, h('b', { text: 'N' })));
    return null;
  }

  /* ------------------------------------------------------------------
     2. XP, MISSIONS, HISTORY (shared with the academy desk on 'home')
     ------------------------------------------------------------------ */
  function todayXP() { var v = Number(sget('home:xp:' + dayKey(), 0)); return isFinite(v) ? v : 0; }
  function addXP(n, pt) {
    n = Math.round(Number(n) || 0);
    if (n <= 0) return null;
    var p = profile(), before = rankOf(p.xp).name, np = null;
    try { np = App.setProfile({ xp: (Number(p.xp) || 0) + n }); } catch (e) { /* ignore */ }
    sset('home:xp:' + dayKey(), todayXP() + n);
    if (pt) fxXP(pt, '+' + n + ' XP');
    var after = np ? rankOf(np.xp).name : before;
    if (after !== before) {
      setTimeout(function () { fxMedal(after); nz('celebrate', 'Yeni rütbə: ' + after + '! Möhürünüz hazırdır.', 3800); }, 900);
    }
    return { xp: n, rankUp: after !== before, rank: after };
  }

  var MISSIONS = [
    { id: 'login', t: 'Masaya baxın', s: 'Gündəlik giriş', cur: 1, max: 1, xp: 10, ic: 'home' },
    { id: 'lesson', t: 'Bir dərs bitirin', s: 'İstənilən mövzu, 5–7 dəqiqə', cur: 0, max: 1, xp: 30, ic: 'book', go: ['lessons', 'lesson', 'task'] },
    { id: 'cards', t: '10 səhv kartını təkrarlayın', s: 'Səhv kartları', cur: 0, max: 10, xp: 20, ic: 'cards', go: ['cards'] },
    { id: 'turk', t: 'Türk forması olmadan 3 cümlə', s: 'Dilçi Nənə izləyir', cur: 0, max: 3, xp: 25, ic: 'quill', go: ['task', 'practice'] },
    { id: 'week', t: 'Həftəlik: 5 gün ardıcıl məşq', s: 'Bazar gününədək', cur: 0, max: 5, xp: 60, ic: 'flame', weekly: true, go: ['practice'] }
  ];
  function msState() { var s = sget('home:ms:' + dayKey(), {}); return s && typeof s === 'object' ? s : {}; }
  function missionById(id) { for (var i = 0; i < MISSIONS.length; i++) if (MISSIONS[i].id === id) return MISSIONS[i]; return null; }
  function msProgress(m) {
    var st = msState();
    var v = st[m.id] != null ? Number(st[m.id]) : m.cur;
    if (m.id === 'lesson' && todayXP() >= 30) v = Math.max(v, 1);
    return clamp(isFinite(v) ? v : m.cur, 0, m.max);
  }
  function bumpMission(id, inc) {
    var m = missionById(id); if (!m) return false;
    var st = msState(), cur = msProgress(m);
    st[id] = clamp(cur + (inc || 1), 0, m.max);
    sset('home:ms:' + dayKey(), st);
    return st[id] >= m.max && cur < m.max;
  }
  function claimKey(m) { return 'home:claimed:' + (m.weekly ? weekKey() : dayKey()); }
  function isClaimed(m) { var c = sget(claimKey(m), {}) || {}; return !!c[m.id]; }

  /* score history — only real checked translations, empty for a new user */
  function scores() {
    var s = sget('academy:scores', null);
    return Array.isArray(s) ? s.filter(function (x) { return x && isFinite(Number(x.s)); }) : [];
  }
  function pushScore(score, task) {
    var s = scores().slice(-29);
    s.push({ t: Date.now(), s: score, title: task.title, lv: task.level });
    sset('academy:scores', s);
  }
  /* skills come only from rubric results; null until the first check */
  var AXES = ['Məna', 'Terminologiya', 'Üslub', 'Ədəbi norma', 'Format'];
  function normSkills(s) {
    return Array.isArray(s) && s.length >= AXES.length ? s.slice(0, AXES.length).map(function (v) { return clamp(Math.round(Number(v) || 0), 0, 100); }) : null;
  }
  function skills() { return normSkills(sget('academy:skills', null)); }
  function skillsStart() { return normSkills(sget('academy:skills0', null)); }
  function updateSkills(rubric) {
    var cur = skills(), first = !cur;
    var pcts = AXES.map(function (a, i) { var r = (rubric || [])[i]; return r && r.max ? r.score / r.max * 100 : null; });
    var s = AXES.map(function (a, i) {
      var p = pcts[i];
      if (first) return Math.round(p == null ? 0 : p);
      return p == null ? cur[i] : Math.round(cur[i] * 0.85 + p * 0.15);
    });
    if (first) sset('academy:skills0', s);
    sset('academy:skills', s);
  }
  function logErrors(errs) {
    var lg = sget('academy:errlog', {}) || {};
    errs.forEach(function (e) { lg[e.type] = (Number(lg[e.type]) || 0) + 1; });
    sset('academy:errlog', lg);
  }
  function weeklyCount() { return clamp(Number(sget('academy:weekly:' + weekKey(), 0)) || 0, 0, 5); }
  function bumpWeekly() { var v = weeklyCount(); if (v < 5) sset('academy:weekly:' + weekKey(), v + 1); return v + 1; }

  /* ------------------------------------------------------------------
     3. DATA — tasks, error vocabulary, games, cards
     ------------------------------------------------------------------ */
  var LEVELS = [
    { id: 'A2', name: 'Elementar', d: 'Qısa, gündəlik mətnlər' },
    { id: 'B1', name: 'Orta', d: 'Sadə işgüzar mətnlər' },
    { id: 'B2', name: 'Orta-yuxarı', d: 'Müqavilə və hesabat parçaları' },
    { id: 'C1', name: 'İrəliləmiş', d: 'Mürəkkəb hüquqi və texniki mətnlər' }
  ];
  function levelById(id) { for (var i = 0; i < LEVELS.length; i++) if (LEVELS[i].id === id) return LEVELS[i]; return null; }
  function levelIdx(id) { for (var i = 0; i < LEVELS.length; i++) if (LEVELS[i].id === id) return i; return 2; }

  var TASKS = [
    { id: 'a2-oldcity', level: 'A2', domain: 'Turizm', reg: 'Neytral', client: 'Otel', title: 'Otel bukleti: şəhər turu', xp: 20, minutes: 4,
      src: 'The Old City is a ten-minute walk from the hotel. The Maiden Tower museum is open every day except Monday, from 10:00 to 18:00.',
      model: 'İçərişəhər oteldən on dəqiqəlik piyada yolundadır. Qız qalası muzeyi bazar ertəsindən başqa hər gün saat 10:00-dan 18:00-dək açıqdır.',
      hints: ['«The Old City» Bakıda xüsusi addır — «İçərişəhər».', '«Maiden Tower» — «Qız qalası».', 'Həftə günləri kiçik hərflə yazılır: «bazar ertəsi».'],
      draft: 'Köhnə şəhər oteldən on dəqiqəlik yoldur. Qız qülləsi muzeyi Bazar ertəsi hariç hər gün 10:00-dan 18:00-a qədər açıqdır.',
      tip: 'Turist bukletidir — xüsusi adlara diqqət! Bakının öz adları var.',
      traps: [
        { w: ['köhnə şəhər'], now: 'İçərişəhər', type: 'Məna', why: 'Bakı kontekstində «The Old City» xüsusi addır — «İçərişəhər». Sözbəsöz «Köhnə şəhər» turisti çaşdırar.', ex: 'The Old City walls → İçərişəhərin qala divarları.' },
        { w: ['qız qülləsi'], now: 'Qız qalası', type: 'Ad', why: 'Abidənin rəsmi adı «Qız qalası»dır; xüsusi adlar sözbəsöz tərcümə olunmur.', ex: 'Palace of the Shirvanshahs → Şirvanşahlar sarayı.' },
        { w: ['Bazar ertəsi'], cs: true, now: 'bazar ertəsi', type: 'Orfoqrafiya', why: 'Həftə günlərinin adları cümlə ortasında kiçik hərflə yazılır.', ex: 'Muzey bazar ertəsi bağlıdır.' },
        { w: ['hariç'], now: '…dən başqa', type: 'Türk forması', why: '«hariç» türk dilinə məxsusdur. Azərbaycan dilində: «bazar ertəsindən başqa» və ya «bazar ertəsi istisna olmaqla».', ex: 'Muzey bazar ertəsindən başqa hər gün açıqdır.' }
      ] },
    { id: 'a2-chat', level: 'A2', domain: 'Gündəlik yazışma', reg: 'Danışıq', client: 'Komanda çatı', title: 'Həmkara Telegram mesajı', xp: 20, minutes: 3,
      src: 'Hi Leyla! Can you send me the glossary by tonight? Thanks a lot!',
      model: 'Salam, Leyla! Lüğəti bu axşama qədər mənə göndərə bilərsən? Çox sağ ol!',
      hints: ['Danışıq üslubu: dosta «sən» deyə müraciət təbiidir.', '«by tonight» — «bu axşama qədər».', '«Thanks a lot!» — «Çox sağ ol!»'],
      draft: 'Merhaba Leyla! Lüğəti bu gecəyə qədər mənə göndərə bilərsiniz? Çok təşəkkür edirik!',
      tip: 'Dosta mesajdır — danışıq üslubu. Rəsmiyyətə ehtiyac yoxdur!',
      traps: [
        { w: ['merhaba'], now: 'Salam', type: 'Türk forması', why: '«Merhaba» türk salamlaşmasıdır; Azərbaycan dilində — «Salam».', ex: 'Hi, Leyla! → Salam, Leyla!' },
        { w: ['bu gecəyə'], now: 'bu axşama', type: 'Məna', why: '«tonight» burada iş günü bitənə qədərdir — «bu axşam». «Gecə» daha gec vaxtı bildirir.', ex: 'See you tonight! → Bu axşam görüşərik!' },
        { w: ['göndərə bilərsiniz'], now: 'göndərə bilərsən', type: 'Üslub', why: 'Mesaj həmkar-dosta yazılıb: «siz» müraciəti burada soyuq səslənir.', ex: 'Can you help me? → Mənə kömək edə bilərsən?' },
        { w: ['təşəkkür edirik'], now: 'sağ ol', type: 'Üslub', why: 'Danışıq mesajında rəsmi «təşəkkür edirik» yad səslənir; təbii forma — «Çox sağ ol!»', ex: 'Thanks a lot! → Çox sağ ol!' }
      ] },
    { id: 'b1-false', level: 'B1', domain: 'Biznes', reg: 'Neytral', client: 'Layihə ofisi', title: 'Daxili layihə hesabatı', xp: 30, minutes: 5,
      src: 'Our actual costs were 12.4% higher than planned. Eventually, the team found a cheaper supplier.',
      model: 'Faktiki xərclərimiz planlaşdırılandan 12,4% yüksək olub. Nəhayət, komanda daha ucuz təchizatçı tapıb.',
      hints: ['«actual» yalançı dostdur: «faktiki», «aktual» deyil.', '«Eventually» — «nəhayət, sonda»; ehtimal bildirmir.', 'Onluq kəsr vergüllə yazılır: 12,4%.'],
      draft: 'Aktual xərclərimiz planlaşdırılandan 12.4% yüksək olub. Ehtimal ki, komanda daha ucuz tedarikçi tapıb.',
      tip: 'Burada yalançı dostlar gizlənib — «actual» və «eventually»yə diqqət!',
      traps: [
        { w: ['ehtimal ki'], now: 'Nəhayət', type: 'Məna', why: '«Eventually» — «nəhayət, sonda». «Ehtimal ki» isə «probably» deməkdir — məna tamam dəyişir.', ex: 'Eventually, they signed the contract. → Nəhayət, müqaviləni imzaladılar.' }
      ] },
    { id: 'b1-letter', level: 'B1', domain: 'İşgüzar yazışma', reg: 'Rəsmi', client: 'Bank', title: 'Müştəriyə rəsmi məktub', xp: 30, minutes: 5,
      src: 'Dear Mr. Aliyev, we are pleased to inform you that your loan application has been approved. Please find the agreement attached.',
      model: 'Hörmətli cənab Əliyev, kredit müraciətinizin təsdiq edildiyini məmnuniyyətlə bildiririk. Müqavilə məktuba əlavə olunur.',
      hints: ['Rəsmi müraciət: «Hörmətli cənab…».', 'Soyad Azərbaycan yazılışı ilə: «Əliyev».', '«Please find attached» — «…əlavə olunur».'],
      draft: 'Sayın Aliyev bəy, kredit müraciətiniz təsdiq olundu, bunu sizə bildirməkdən məmnunuq. Razılaşma əlavədədir.',
      tip: 'Bank məktubudur — rəsmi üslub və düzgün müraciət vacibdir.',
      traps: [
        { w: ['Aliyev'], cs: true, now: 'Əliyev', type: 'Ad', why: 'Azərbaycan soyadı ingilis transliterasiyası ilə deyil, öz yazılışı ilə verilir: «Əliyev».', ex: 'Mr. Mammadov → cənab Məmmədov; Ms. Guliyeva → xanım Quliyeva.' },
        { w: ['bəy'], now: 'cənab', type: 'Üslub', why: 'Rəsmi bank məktubunda müraciət — «Hörmətli cənab…». «Bəy» bu kontekstdə türk yazışmasını xatırladır.', ex: 'Dear Mr. Aliyev → Hörmətli cənab Əliyev' }
      ] },
    { id: 'b2-shall', level: 'B2', domain: 'Hüquq', reg: 'Hüquqi', client: 'Təchizat şirkəti', title: 'Təchizat müqaviləsi, 4.2-ci bənd', xp: 40, minutes: 6,
      src: 'The Supplier shall deliver 250 units to Baku by 15 March 2026. Payment shall be made within thirty (30) days of receipt of a valid invoice.',
      model: 'Təchizatçı 15 mart 2026-cı il tarixinədək Bakıya 250 ədəd məhsul təhvil verməlidir. Ödəniş etibarlı hesab-faktura alındıqdan sonra otuz (30) gün ərzində həyata keçirilir.',
      hints: ['«shall» öhdəlikdir: «təhvil verməlidir».', '«invoice» — lüğətdə «hesab-faktura».', 'Ay adı kiçik hərflə: «15 mart».'],
      draft: 'Tedarikçi 15 Mart 2026 tarixinədək Bakıya 205 ədəd məhsul təhvil etməlidir. Ödəniş etibarlı invoys alındıqdan sonra otuz (30) gün içinde həyata keçirilir.',
      tip: 'Müqavilədir: «shall», rəqəmlər və tarixlər — Möhürdar Mirzə hər birinə baxacaq.',
      traps: [] },
    { id: 'b2-fidic', level: 'B2', domain: 'Hüquq', reg: 'Hüquqi', client: 'Tikinti şirkəti', title: 'Tikinti müqaviləsi (FIDIC), 1.8-ci bənd', xp: 40, minutes: 5,
      src: 'The Contractor shall notify the Employer within 14 days after becoming aware of the event.',
      model: 'Podratçı hadisədən xəbər tutduqdan sonra 14 gün ərzində Sifarişçini xəbərdar etməlidir.',
      hints: ['FIDIC-də «Employer» — «Sifarişçi», «İşəgötürən» deyil.', '«shall notify» — «xəbərdar etməlidir».', '«within 14 days» — «14 gün ərzində».'],
      draft: 'Kontraktor hadisədən xəbər tutduqdan sonra 14 gün içində İşəgötürəni xəbərdar edəcək.',
      tip: 'FIDIC müqaviləsidir: «Employer» burada «İşəgötürən» deyil!',
      traps: [
        { w: ['edəcək'], now: 'etməlidir', type: 'Məna', why: 'Hüquqi mətndə «shall» gələcək zaman yox, öhdəlik bildirir: «xəbərdar etməlidir».', ex: 'The Buyer shall pay within 10 days. → Alıcı 10 gün ərzində ödəməlidir.' },
        { w: ['gün içində'], now: 'gün ərzində', type: 'Üslub', why: 'Hüquqi mətndə müddət «ərzində» ilə verilir; «içində» danışıq dilinə yaxındır.', ex: 'within 30 days → 30 gün ərzində' }
      ] },
    { id: 'b2-finance', level: 'B2', domain: 'Maliyyə', reg: 'Rəsmi', client: 'Enerji şirkəti', title: 'İllik hesabat 2025: xülasə', xp: 40, minutes: 6,
      src: 'Net profit rose by 12.4% to AZN 3.8 billion. The Board of Directors will meet on 2 June to approve the dividend.',
      model: 'Xalis mənfəət 12,4% artaraq 3,8 milyard manata çatıb. İdarə Heyəti dividendi təsdiqləmək üçün 2 iyunda iclas keçirəcək.',
      hints: ['«Net profit» — «xalis mənfəət».', 'AZN 3.8 billion → 3,8 milyard manat.', '«meet» rəsmi mətndə — «iclas keçirmək».'],
      draft: 'Təmiz gəlir 12.4% artaraq 3.8 milyard manata çatıb. İdarə Heyəti dividendi təsdiqləmək için 2 İyun tarixində toplantı keçirəcək.',
      tip: 'Maliyyə hesabatıdır: rəqəm formatı və «net profit» terminini yoxlayın.',
      traps: [] },
    { id: 'c1-majeure', level: 'C1', domain: 'Hüquq', reg: 'Hüquqi', client: 'Hüquq şöbəsi', title: 'Xidmət müqaviləsi, 9-cu maddə', xp: 50, minutes: 7,
      src: 'Neither Party shall be liable for any failure to perform its obligations where such failure results from force majeure.',
      model: 'Öhdəliklərin icra edilməməsi fors-major hallarının nəticəsidirsə, Tərəflərdən heç biri buna görə məsuliyyət daşımır.',
      hints: ['«Neither Party» — «Tərəflərdən heç biri».', 'İnkarlı «shall not be liable» — fakt: «məsuliyyət daşımır».', '«force majeure» — «fors-major».'],
      draft: 'Taraflardan heç biri, qarşısıalınmaz qüvvə nəticəsində öhdəliklərini yerinə yetirməməsinə görə cavabdeh olmamalıdır.',
      tip: 'Ən çətin janr: inkarlı «shall» və fors-major. Tələsməyin.',
      traps: [
        { w: ['taraflardan'], now: 'Tərəflərdən', type: 'Türk forması', why: '«taraf» türk formasıdır; Azərbaycan dilində «tərəf» — «Tərəflərdən heç biri».', ex: 'Neither Party → Tərəflərdən heç biri' },
        { w: ['olmamalıdır'], now: 'daşımır', type: 'Məna', why: 'İnkarlı «shall not be liable» qadağa yox, hüquqi faktdır: «məsuliyyət daşımır».', ex: 'The Supplier shall not be liable for indirect damages. → Təchizatçı dolayı zərərə görə məsuliyyət daşımır.' }
      ] },
    { id: 'c1-ui', level: 'C1', domain: 'İnterfeys', reg: 'Neytral', client: 'Mobil bank', title: 'Mobil tətbiq: təhlükəsizlik bildirişləri', xp: 50, minutes: 5,
      src: 'Your session has expired. Please sign in again to continue. Don’t share your one-time password with anyone.',
      model: 'Sessiyanın vaxtı bitib. Davam etmək üçün yenidən daxil olun. Birdəfəlik şifrənizi heç kimlə paylaşmayın.',
      hints: ['İnterfeys mətni qısa olmalıdır — artıq əvəzlikləri atın.', '«sign in» — «daxil olun».', '«one-time password» — «birdəfəlik şifrə».'],
      draft: 'Sizin sessiyanızın müddəti bitmişdir. Lütfen davam etmək üçün yenidən giriş edin. Tək istifadəlik parolunuzu heç kimə paylaşmayın.',
      tip: 'İnterfeys mətnidir: qısa, aydın və bankın öz terminləri ilə.',
      traps: [
        { w: ['sizin sessiyanızın'], now: 'Sessiyanın', type: 'Üslub', why: 'İnterfeysdə hər söz yer tutur: «Sizin» artıqdır, yiyəlik şəkilçisi kifayətdir.', ex: 'Your password has changed. → Şifrə dəyişdirildi.' },
        { w: ['giriş edin'], now: 'daxil olun', type: 'Termin', why: 'Bank tətbiqlərində «sign in» üçün qəbul olunmuş termin — «daxil olun».', ex: 'Sign in with Face ID → Face ID ilə daxil olun' },
        { w: ['tək istifadəlik parolunuzu', 'tək istifadəlik parol'], now: 'birdəfəlik şifrənizi', type: 'Termin', why: 'Bank terminologiyasında «one-time password» — «birdəfəlik şifrə» (SMS-kod).', ex: 'Enter the one-time password → Birdəfəlik şifrəni daxil edin' },
        { w: ['heç kimə paylaşmayın'], now: 'heç kimlə paylaşmayın', type: 'Üslub', why: '«Paylaşmaq» feili «kimləsə» idarə edir: «heç kimlə paylaşmayın».', ex: 'Share with friends → Dostlarla paylaşın' }
      ] },
    { id: 'sim-ada', level: 'B2', domain: 'Təhsil', reg: 'Rəsmi', client: 'Universitet', title: 'Tələbə bələdçisi, 3-cü fəsil', xp: 60, minutes: 6,
      sim: { deadline: 'Bu gün, 18:00', volume: '20 söz · sınaq parçası', contact: 'Tələbə xidmətləri',
        req: ['Rəsmi-neytral üslub', 'thesis → buraxılış işi', 'Ay adları kiçik hərflə'] },
      src: 'Students must submit their thesis by 1 May 2026. Late submissions will not be accepted without the Dean’s written approval.',
      model: 'Tələbələr buraxılış işini 1 may 2026-cı il tarixinədək təqdim etməlidirlər. Gecikmiş işlər dekanın yazılı razılığı olmadan qəbul edilmir.',
      hints: ['Müştəri lüğəti: «thesis» — «buraxılış işi».', '«submit» — «təqdim etmək»; «təslim etmək» türk ifadəsidir.', 'Vəzifə adı cümlə ortasında kiçik hərflə: «dekan».'],
      draft: 'Tələbələr tezislərini 1 May 2026 tarixinə qədər təslim etməlidir. Gecikən təqdimatlar Dekanın yazılı onayı olmadan qəbul edilməyəcək.',
      tip: 'Real sifarişdir: müştəri lüğəti və son tarix var. Peşəkar kimi işləyək!',
      traps: [
        { w: ['tezislərini', 'tezis'], now: 'buraxılış işini', type: 'Termin', why: 'Müştəri lüğətinə görə «thesis» — «buraxılış işi». «Tezis» isə məruzənin qısa xülasəsidir.', ex: 'bachelor’s thesis → buraxılış işi; master’s thesis → magistr dissertasiyası.' },
        { w: ['təslim'], now: 'təqdim', type: 'Türk forması', why: '«teslim etmek» türk ifadəsidir; sənəd «təqdim edilir» və ya «təhvil verilir».', ex: 'Submit your application → Müraciətinizi təqdim edin' },
        { w: ['onayı', 'onay'], now: 'razılığı', type: 'Türk forması', why: '«onay» türk sözüdür; Azərbaycan dilində «razılıq», «təsdiq».', ex: 'written approval → yazılı razılıq' },
        { w: ['Dekanın'], cs: true, now: 'dekanın', type: 'Orfoqrafiya', why: 'Vəzifə adları cümlə ortasında kiçik hərflə yazılır: «dekan», «rektor».', ex: 'the Dean of the School → məktəbin dekanı' }
      ] }
  ];
  /* real material (data-real.js): NTREX-128 news («ok» → translation tasks, «flawed» → «Səhvi tap»)
     and the UDHR («Məşhur sənədlər»). Base tasks have no `col` and stay the default collection. */
  var REAL = W.NUANZA_REAL && typeof W.NUANZA_REAL === 'object' ? W.NUANZA_REAL : null;
  var NTREX_LINE = 'Mənbə: NTREX-128 (Microsoft) · CC BY-SA 4.0';
  var UDHR_LINE = 'Mənbə: BMT · İnsan Hüquqları haqqında Ümumi Bəyannamə (1948), rəsmi Azərbaycan tərcüməsi';
  var LV_XP = { A2: 20, B1: 20, B2: 30, C1: 40 };
  function minsOf(n) { return Math.max(3, Math.round((Number(n) || 0) / 9) + 2); }
  var HUNT = [];
  if (REAL) {
    (Array.isArray(REAL.items) ? REAL.items : []).forEach(function (it) {
      if (!it || !it.id || !it.src || !it.model || !levelById(it.level)) return;
      if (it.status === 'ok') {
        TASKS.push({ id: it.id, col: 'news', level: it.level, domain: it.domain || 'Xəbər', reg: 'Neytral', client: 'Real xəbər · NTREX', title: it.title || 'Real xəbər',
          xp: LV_XP[it.level] || 30, minutes: minsOf(it.words), src: it.src, model: it.model, hints: it.hints || [], tip: it.tip || 'Real xəbər mətnidir — adlara, rəqəmlərə və mənaya diqqət!',
          draft: '', traps: [], credit: NTREX_LINE, modelLabel: 'Dərc olunmuş peşəkar tərcümə', modelNote: 'NTREX-128 korpusunda dərc olunmuş istinad tərcüməsi. Yeganə düzgün variant deyil — öz variantınızla müqayisə edin.' });
      } else if (it.status === 'flawed' && Array.isArray(it.errors) && it.errors.length) HUNT.push(it);
    });
    (Array.isArray(REAL.docs) ? REAL.docs : []).forEach(function (d) {
      if (!d || !d.id || !d.src || !d.model || !levelById(d.level)) return;
      TASKS.push({ id: d.id, col: 'docs', level: d.level, domain: 'Hüquq · beynəlxalq', reg: 'Hüquqi', client: 'BMT sənədi', title: d.title,
        xp: LV_XP[d.level] || 30, minutes: minsOf(d.words), src: d.src, model: d.model, hints: d.hints || [],
        tip: 'Rəsmi hüquqi mətndir: «hər bir şəxs … hüququna malikdir», «heç kim … bilməz» kimi sabit formulları qoruyun.',
        draft: '', traps: [], credit: UDHR_LINE, modelLabel: 'Rəsmi tərcümə', modelNote: 'BMT-nin rəsmi Azərbaycan mətni. Variantınız sözbəsöz eyni olmaya bilər — əsas olan terminlər və hüquqi dəqiqlikdir.' });
    });
  }
  var COLS = [
    { id: 'base', label: 'Nuanza tapşırıqları' },
    { id: 'news', label: 'Xəbərlər (NTREX)' },
    { id: 'docs', label: 'Məşhur sənədlər' }
  ].filter(function (c) { return TASKS.some(function (t) { return !t.sim && (t.col || 'base') === c.id; }); });
  function colOf(t) { return (t && t.col) || 'base'; }

  function taskById(id) { for (var i = 0; i < TASKS.length; i++) if (TASKS[i].id === id) return TASKS[i]; return null; }

  var SEV = { 'Türk forması': 'mid', 'Rəqəm': 'high', 'Termin': 'mid', 'Məna': 'high', 'Orfoqrafiya': 'mid', 'Üslub': 'low', 'Durğu': 'low', 'Ad': 'mid', 'Tarix': 'high', 'Söz sırası': 'low', 'Ardıcıllıq': 'mid', 'Boş seqment': 'high', 'Buraxma': 'high', 'Əlavə': 'mid' };
  var SEV_LABEL = { high: 'Kritik', mid: 'Vacib', low: 'Kiçik' };
  var SEV_BADGE = { high: 'red', mid: 'gold', low: 'navy' };
  var SEV_ORDER = { high: 0, mid: 1, low: 2 };
  var TYPE_ELDER = {
    'Termin': 'Lüğətçi Mirzə', 'Məna': 'Mənaçı Mirzə', 'Boş seqment': 'Mənaçı Mirzə', 'Üslub': 'Üslubçu Mirzə', 'Söz sırası': 'Üslubçu Mirzə',
    'Ardıcıllıq': 'Üslubçu Mirzə', 'Türk forması': 'Dilçi Nənə', 'Orfoqrafiya': 'Dilçi Nənə', 'Durğu': 'Dilçi Nənə',
    'Rəqəm': 'Möhürdar Mirzə', 'Ad': 'Möhürdar Mirzə', 'Tarix': 'Möhürdar Mirzə', 'Buraxma': 'Mənaçı Mirzə', 'Əlavə': 'Mənaçı Mirzə'
  };
  var TYPE_NOUN = { 'Türk forması': 'türk forması', 'Rəqəm': 'rəqəm səhvi', 'Termin': 'termin', 'Məna': 'məna səhvi', 'Orfoqrafiya': 'orfoqrafiya səhvi', 'Üslub': 'üslub qeydi', 'Durğu': 'durğu qeydi', 'Ad': 'ad', 'Tarix': 'tarix', 'Söz sırası': 'söz sırası', 'Ardıcıllıq': 'ardıcıllıq qeydi', 'Boş seqment': 'boş hissə', 'Buraxma': 'buraxma', 'Əlavə': 'artıq əlavə' };
  var EX_BY_TYPE = {
    'Türk forması': '«30 gün içinde» → «30 gün ərzində»; «için» → «üçün»; «toplantı» → «iclas».',
    'Termin': '«invoice» → «hesab-faktura», «Supplier» → «Təchizatçı» — lüğət müştərinin qanunudur.',
    'Rəqəm': 'Mənbədə 250 — tərcümədə də 250. Sonda rəqəmləri bir-bir mənbə ilə tutuşdurun.',
    'Orfoqrafiya': '«15 mart 2026-cı il», «bazar ertəsi» — ay və gün adları kiçik hərflə.',
    'Durğu': '«12,4%», «1 250 000 manat», «Nuanza» — vergül, boşluq və «» dırnaqları.',
    'Üslub': 'Rəsmi: «təşəkkür edirik»; danışıq: «sağ ol». Bir mətndə üslublar qarışmamalıdır.',
    'Məna': '«Eventually, the parties agreed.» → «Nəhayət, tərəflər razılaşdılar.»',
    'Ad': '«Maiden Tower» → «Qız qalası»; «Aliyev» → «Əliyev».',
    'Tarix': '«on 2 June» → «2 iyunda»; «by 1 May» → «1 may tarixinədək».',
    'Söz sırası': 'Azərbaycan cümləsində feil sonda gəlir: «Podratçı … xəbərdar etməlidir.»'
  };
  var TAG_OF = { 'Türk forması': 'Türk forması', 'Termin': 'Termin', 'Rəqəm': 'Rəqəm', 'Tarix': 'Rəqəm', 'Durğu': 'Orfoqrafiya', 'Orfoqrafiya': 'Orfoqrafiya', 'Ad': 'Orfoqrafiya', 'Üslub': 'Üslub', 'Söz sırası': 'Üslub', 'Ardıcıllıq': 'Üslub', 'Məna': 'Məna', 'Buraxma': 'Məna', 'Əlavə': 'Məna' };
  var GRADES = [
    { min: 91, l: 'A', w: 'Əla', head: 'Ustad işi!' },
    { min: 81, l: 'B', w: 'Çox yaxşı', head: 'Möhkəm tərcümə' },
    { min: 71, l: 'C', w: 'Yaxşı', head: 'Yaxşı əsas var' },
    { min: 61, l: 'D', w: 'Kafi', head: 'Bir neçə düzəliş lazımdır' },
    { min: 51, l: 'E', w: 'Qənaətbəxş', head: 'Bir də cəhd edək' },
    { min: 0, l: 'F', w: 'Qeyri-kafi', head: 'Yenidən yazaq — birlikdə' }
  ];
  function gradeOf(s) { for (var i = 0; i < GRADES.length; i++) if (s >= GRADES[i].min) return GRADES[i]; return GRADES[GRADES.length - 1]; }
  var DEFAULT_RUB = [{ name: 'Məna dəqiqliyi', max: 40, score: 32 }, { name: 'Terminologiya', max: 20, score: 16 }, { name: 'Üslub və axıcılıq', max: 20, score: 16 }, { name: 'Ədəbi norma', max: 10, score: 8 }, { name: 'Format (rəqəm, tarix, ad)', max: 10, score: 8 }];

  /* games */
  var GAMES = [
    { id: 'vs', name: 'Sən vs AI', icon: 'users', cls: '', desc: 'Eyni cümlə, iki variant — hansı daha dəqiqdir?', diff: 2, skill: 'Məna' },
    { id: 'detective', name: 'Detektiv', icon: 'search', cls: 'practice-fir', desc: 'Tərcümədə gizlənən səhvləri tapın.', diff: 2, skill: 'Redaktə', feat: true },
    { id: 'fix', name: 'Düzəlt', icon: 'edit', cls: 'green', desc: 'Səhv hissəni bir toxunuşla düzəldin.', diff: 1, skill: 'Ədəbi norma' },
    { id: 'context', name: 'Kontekst dəyiş', icon: 'layers', cls: 'gold', desc: 'Bir fikir: dosta, banka, məhkəməyə.', diff: 2, skill: 'Üslub' },
    { id: 'speed', name: 'Sürət', icon: 'zap', cls: 'gold', desc: '60 saniyədə neçə termin tanıyırsınız?', diff: 1, skill: 'Terminologiya' },
    { id: 'oral', name: 'Şifahi', icon: 'mic', cls: '', desc: 'Dinləyin və ardınca səsli tərcümə edin.', diff: 3, skill: 'Sürət' },
    { id: 'sim', name: 'Simulyator', icon: 'folder', cls: 'practice-fir', desc: 'Real sifariş: müştəri, son tarix, tarif.', diff: 3, skill: 'Peşəkarlıq' }
  ];
  if (HUNT.length) GAMES.splice(2, 0, { id: 'realhunt', name: 'Real səhv ovu', icon: 'search', cls: 'gold', desc: 'Dərc olunmuş real tərcümələrdə səhvləri tapın.', diff: 3, skill: 'Redaktə' });
  var NUM_WORD = { 7: 'Yeddi', 8: 'Səkkiz', 9: 'Doqquz' };
  var DIFF = { 1: 'Asan', 2: 'Orta', 3: 'Çətin' };
  function gameById(id) { for (var i = 0; i < GAMES.length; i++) if (GAMES[i].id === id) return GAMES[i]; return null; }
  function bestOf(id) { var b = sget('academy:best', {}) || {}; return b[id] != null ? Number(b[id]) : null; }
  function setBest(id, v) { var b = sget('academy:best', {}) || {}; b[id] = v; sset('academy:best', b); }
  function fmtBest(id, v) { return id === 'speed' ? v + ' termin' : v + ' bal'; }

  var QUIZ = {
    vs: [
      { src: 'The parties hereby agree as follows:', options: ['Tərəflər aşağıdakılar barədə razılığa gəlirlər:', 'Tərəflər bununla aşağıdakı kimi razılaşırlar:'], answer: 0, ai: 1, explain: '«hereby» sözbəsöz «bununla» verilmir — Azərbaycan hüquqi mətnində adətən buraxılır.' },
      { src: 'Please do not hesitate to contact us.', options: ['Xahiş edirik, tərəddüd etmədən bizimlə əlaqə saxlayın.', 'Sualınız yaranarsa, bizimlə əlaqə saxlayın.'], answer: 1, ai: 0, explain: '«do not hesitate» nəzakət formulasıdır — sözbəsöz yox, mənaca verilir.' },
      { src: 'Revenue increased by 8.5% year-on-year.', options: ['Gəlir ötən illə müqayisədə 8,5% artıb.', 'Gəlir ildən-ilə 8.5% artıb.'], answer: 0, ai: 1, explain: '«year-on-year» — «ötən illə müqayisədə»; onluq kəsr vergüllə: 8,5%.' },
      { src: 'Keep out of reach of children.', options: ['Uşaqlardan uzaq tutun.', 'Uşaqların əli çatmayan yerdə saxlayın.'], answer: 1, ai: 0, explain: 'Dərman təlimatının sabit ifadəsi: «Uşaqların əli çatmayan yerdə saxlayın.»' },
      { src: 'The Employer shall pay the Contractor within 28 days.', options: ['Sifarişçi 28 gün ərzində Podratçıya ödəniş etməlidir.', 'İşəgötürən 28 gün ərzində Podratçıya ödəyəcək.'], answer: 0, ai: 1, explain: 'FIDIC-də «Employer» — «Sifarişçi»; «shall» isə öhdəlikdir: «etməlidir».' }
    ],
    fix: [
      { sent: ['Müqavilə 30 gün ', 'içinde', ' qüvvəyə minir.'], options: ['ərzində', 'içində', 'zarfında'], answer: 0, explain: 'Rəsmi mətndə müddət «ərzində» ilə verilir; «içinde» türk formasıdır.' },
      { sent: ['Xalis mənfəət ', '3.8', ' milyard manat təşkil edib.'], options: ['3.8', '3,8', '3 8'], answer: 1, explain: 'Azərbaycan dilində onluq kəsr vergüllə ayrılır: 3,8.' },
      { sent: ['İclas 5 ', 'Noyabr', ' tarixində keçiriləcək.'], options: ['Noyabr', 'noyabr', 'Noyabrın'], answer: 1, explain: 'Ay adları cümlə ortasında kiçik hərflə yazılır.' },
      { sent: ['Sənədləri cüməyədək ', 'təhvil etməlisiniz', '.'], options: ['təhvil verməlisiniz', 'təslim etməlisiniz', 'təhvil eləməlisiniz'], answer: 0, explain: 'Sabit birləşmə: «təhvil vermək». «Təslim etmək» türk formasına yaxındır.' },
      { sent: ['', 'Aktual', ' xərclər büdcəni 8% keçib.'], options: ['Faktiki', 'Müasir', 'Aktual'], answer: 0, explain: '«actual costs» — «faktiki xərclər». «Aktual» — «gündəmdə olan» deməkdir.' },
      { sent: ['', 'Sayın', ' müştəri, sifarişiniz qəbul olundu.'], options: ['Dəyərli', 'Hörmətli', 'Sayın'], answer: 1, explain: 'Rəsmi müraciət: «Hörmətli müştəri». «Sayın» türk formasıdır.' }
    ],
    context: [
      { sit: 'Dosta Telegram mesajı', src: 'Can you send the file by tonight?', options: ['Faylı bu axşama qədər göndərə bilərsən?', 'Xahiş edirik, faylı bu axşamadək göndərəsiniz.', 'Tərəf faylı bu axşamadək təqdim etməlidir.'], answer: 0, explain: 'Dosta — danışıq üslubu və «sən» müraciəti.' },
      { sit: 'Müştəriyə rəsmi məktub', src: 'Can you send the file by tonight?', options: ['Faylı bu axşama qədər göndərə bilərsən?', 'Xahiş edirik, faylı bu axşamadək göndərəsiniz.', 'Tərəf faylı bu axşamadək təqdim etməlidir.'], answer: 1, explain: 'İşgüzar yazışmada xahiş «Xahiş edirik, … göndərəsiniz» formasında verilir.' },
      { sit: 'Müqavilə bəndi', src: 'The Party shall submit the file by 18:00.', options: ['Tərəf faylı saat 18:00-a qədər göndərsin.', 'Tərəf faylı saat 18:00-dək təqdim etməlidir.', 'Tərəf faylı saat 18:00-dək göndərə bilər.'], answer: 1, explain: 'Hüquqi üslub: «shall» — öhdəlik, «-malı/-məli».' },
      { sit: 'Bankdan müştəriyə SMS', src: 'Thanks for choosing us!', options: ['Bizi seçdiyin üçün sağ ol!', 'Bizi seçdiyiniz üçün təşəkkür edirik!', 'Bizi seçməyinizə görə dərin minnətdarlığımızı bildiririk.'], answer: 1, explain: 'SMS rəsmi, amma qısa olmalıdır — üçüncü variant məktub üçündür.' },
      { sit: 'Tətbiqdə düymə', src: 'Sign in', options: ['Daxil ol', 'Sistemə daxil olmağınızı xahiş edirik', 'Giriş et'], answer: 0, explain: 'İnterfeys mətni ən qısa və aydın formada olur: «Daxil ol».' }
    ],
    speed: [
      { term: 'Employer (FIDIC)', options: ['Sifarişçi', 'İşəgötürən', 'Müştəri'] },
      { term: 'net profit', options: ['xalis mənfəət', 'təmiz gəlir', 'xalis gəlir'] },
      { term: 'invoice', options: ['hesab-faktura', 'invoys', 'qaimə'] },
      { term: 'force majeure', options: ['fors-major', 'qarşısıalınmaz qüvvə', 'fövqəladə vəziyyət'] },
      { term: 'Contractor', options: ['Podratçı', 'Kontraktor', 'İcraçı'] },
      { term: 'Supplier', options: ['Təchizatçı', 'Tədarükçü', 'Göndərən'] },
      { term: 'liability', options: ['məsuliyyət', 'cavabdehlik', 'borc'] },
      { term: 'confidential information', options: ['məxfi məlumat', 'gizli məlumat', 'şəxsi informasiya'] },
      { term: 'revenue', options: ['gəlir', 'mənfəət', 'mədaxil'] },
      { term: 'to terminate (a contract)', options: ['xitam vermək', 'ləğv etmək', 'dayandırmaq'] },
      { term: 'governing law', options: ['tətbiq olunan hüquq', 'idarəedici qanun', 'hakim hüquq'] },
      { term: 'Subcontractor', options: ['Subpodratçı', 'Alt podratçı', 'Köməkçi icraçı'] },
      { term: 'one-time password', options: ['birdəfəlik şifrə', 'tək istifadəlik parol', 'bir dəfəlik kod'] },
      { term: 'sign in', options: ['daxil olmaq', 'giriş etmək', 'imzalamaq'] }
    ]
  };
  var ASK = { vs: 'Hansı variant daha dəqiqdir?', fix: 'Seçilmiş hissəni düzəldin:', context: 'Bu situasiyaya hansı variant uyğundur?', speed: 'Azərbaycan dilində qarşılığı:' };
  var OK_MSG = ['Düzdür!', 'Əla!', 'Məhz belə!', 'Bəli, doğrudur!'];

  var DET = [
    { title: 'Təchizat müqaviləsi, 4.2-ci bənd',
      src: 'The Supplier shall deliver 250 units to Baku by 15 March 2026. Payment shall be made within thirty (30) days of receipt of a valid invoice.',
      tgt: 'Tədarükçü 15 Mart 2026 tarixinədək Bakıya 205 ədəd məhsul təhvil verməlidir. Ödəniş etibarlı invoys alındıqdan sonra otuz (30) gün içinde həyata keçirilir.',
      errors: [
        { w: 'Tədarükçü', now: 'Təchizatçı', type: 'Termin', why: 'Layihə lüğətində «Supplier» — «Təchizatçı».' },
        { w: 'Mart', now: 'mart', type: 'Orfoqrafiya', why: 'Ay adları cümlə ortasında kiçik hərflə yazılır.' },
        { w: '205', now: '250', type: 'Rəqəm', why: 'Mənbədə 250 ədəd — rəqəmlərin yeri dəyişib. Ən bahalı səhv növü!' },
        { w: 'invoys', now: 'hesab-faktura', type: 'Termin', why: '«invoice» — «hesab-faktura»; «invoys» kalkadır.' },
        { w: 'içinde', now: 'ərzində', type: 'Türk forması', why: '«içinde» türk formasıdır; rəsmi mətndə — «ərzində».' }
      ] },
    { title: 'İllik hesabat 2025, xülasə',
      src: 'Net profit rose by 12.4% to AZN 3.8 billion. The Board of Directors will meet on 2 June to approve the dividend.',
      tgt: 'Təmiz gəlir 12.4% artaraq 3,8 milyard manata çatıb. İdarə Heyəti dividendi təsdiqləmək üçün 2 İyun tarixində toplantı keçirəcək.',
      errors: [
        { w: 'Təmiz', now: 'Xalis', type: 'Termin', why: '«Net profit» — «xalis mənfəət».' },
        { w: 'gəlir', now: 'mənfəət', type: 'Termin', why: '«profit» — «mənfəət»; «gəlir» isə «revenue»dur.' },
        { w: '12.4%', now: '12,4%', type: 'Rəqəm', why: 'Onluq kəsr vergüllə ayrılır.' },
        { w: 'İyun', now: 'iyun', type: 'Orfoqrafiya', why: 'Ay adları kiçik hərflə yazılır.' },
        { w: 'toplantı', now: 'iclas', type: 'Türk forması', why: '«toplantı» türk sözüdür; idarə heyəti «iclas keçirir».' }
      ] },
    { title: 'Tikinti müqaviləsi (FIDIC), 1.8-ci bənd',
      src: 'The Contractor shall notify the Employer within 14 days after becoming aware of the event.',
      tgt: 'Kontraktor hadisədən xəbər tutduqdan sonra 41 gün ərzində İşəgötürəni xəbərdar edəcək.',
      errors: [
        { w: 'Kontraktor', now: 'Podratçı', type: 'Termin', why: '«Contractor» — «Podratçı».' },
        { w: '41', now: '14', type: 'Rəqəm', why: 'Mənbədə 14 gün — rəqəmlər yerini dəyişib.' },
        { w: 'İşəgötürəni', now: 'Sifarişçini', type: 'Termin', why: 'FIDIC-də «Employer» — «Sifarişçi».' },
        { w: 'edəcək', now: 'etməlidir', type: 'Məna', why: '«shall» gələcək zaman deyil, öhdəlikdir.' }
      ] }
  ];

  var TAG_BADGE = { 'Yalançı dost': 'red', 'Türk forması': 'gold', 'Rəqəm': 'navy', 'Termin': 'navy', 'Hüquqi': 'red', 'Orfoqrafiya': 'gold', 'Üslub': '', 'Məna': 'red' };
  var INTERVAL = [0, 0, 1, 3, 7, 16];
  var INT_LABEL = { 1: 'hər gün', 2: '1 gündən bir', 3: '3 gündən bir', 4: 'həftədə bir', 5: '16 gündən bir' };

  function userCards() { var l = sget('academy:mycards', []); return Array.isArray(l) ? l : []; }
  function deck() { return userCards(); } /* only the user's own mistakes */
  function srsAll() { var s = sget('academy:srs', {}); return s && typeof s === 'object' ? s : {}; }
  function dueCount() {
    var s = srsAll(), now = Date.now();
    return deck().filter(function (c) { return !s[c.id] || s[c.id].due <= now; }).length;
  }

  /* ------------------------------------------------------------------
     4. CSS (tokens only)
     ------------------------------------------------------------------ */
  var CSS = [
    /* shared */
    '@keyframes task-shake{0%,100%{transform:none}20%{transform:translateX(-6px)}40%{transform:translateX(5px)}60%{transform:translateX(-3px)}80%{transform:translateX(2px)}}',
    '.task-shake{animation:task-shake .42s var(--ease-out)}',
    /* firuzə accent modifiers for shared components (icon tiles, badges) */
    ':is(.ic,.badge):is(.task-fir,.practice-fir,.progress-fir){background:var(--fir-t);color:var(--firuze)}',
    '@keyframes task-flash{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--firuze) 38%,transparent)}100%{box-shadow:0 0 0 12px transparent}}',
    '.task-flash{animation:task-flash .8s var(--ease-out)}',
    '@keyframes task-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}',
    '.task-in{animation:task-in .32s var(--ease-out) both}',
    '.card.lacquer .kv dt{color:var(--on-deep-soft)}',
    '.progress.progress-fir > i{background:linear-gradient(90deg,var(--firuze),color-mix(in srgb,var(--firuze) 72%,var(--on-deep)))}',

    /* ---- TASK ---- */
    '.task-get{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:16px 20px}',
    '.task-lv{display:grid;gap:10px;min-width:0}',
    '.task-lv-meter{display:flex;gap:3px;width:max-content;max-width:100%;padding:3px;border:1px solid var(--line);border-radius:var(--r-md);background:var(--surface2)}',
    '.task-lv-meter button{position:relative;min-width:56px;height:36px;padding:0 10px 4px;border:0;border-radius:9px;background:transparent;color:var(--soft);font:600 var(--fs-sm)/1 var(--f-body);letter-spacing:.03em;cursor:pointer;transition:background var(--t-base),color var(--t-base),box-shadow var(--t-base)}',
    '.task-lv-meter button::after{content:"";position:absolute;left:50%;bottom:5px;width:5px;height:5px;margin-left:-2.5px;background:currentColor;opacity:0;-webkit-mask:var(--m-star) center/contain no-repeat;mask:var(--m-star) center/contain no-repeat;transition:opacity var(--t-base)}',
    '.task-lv-meter button:hover{color:var(--ink)}',
    '.task-lv-meter button.on{color:var(--firuze)}',
    '.task-lv-meter button.on::after{opacity:.5}',
    '.task-lv-meter button[aria-pressed="true"]{background:var(--surface3);color:var(--firuze);box-shadow:var(--sh-pop)}',
    '.task-lv-meter button[aria-pressed="true"]::after{opacity:1}',
    '.task-lv-meter button:focus-visible{outline:2px solid var(--focus);outline-offset:-2px}',
    '.task-lv-tx{display:flex;flex-wrap:wrap;align-items:baseline;gap:2px 10px}',
    '.task-lv-tx b{font-family:var(--f-display);font-size:var(--fs-md)}',
    '.task-lv-tx small{color:var(--soft)}',
    '@media (max-width:479px){.task-get > .btn{width:100%}}',
    '.task-slot{display:grid;gap:20px;min-width:0}',
    '.task-src .card-h{margin-bottom:12px}',
    '.task-meta{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px}',
    '.task-src-tx{font-family:var(--f-display);font-size:1.1875rem;line-height:1.6;letter-spacing:-.003em}',
    '@media (min-width:640px){.task-src-tx{font-size:1.3125rem}}',
    '.task-src-foot{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;margin-top:16px;padding-top:12px;border-top:1px solid var(--line)}',
    '.task-hints{margin-top:12px}',
    '.task-hints ul{display:grid;gap:4px;margin:4px 0 0;padding-left:1.1em}',
    '.task-hints li{animation:task-in .3s var(--ease-out) both}',
    '.task-brief{display:grid;gap:14px}',
    '.task-brief-top{display:flex;align-items:center;gap:12px;min-width:0}',
    '.task-brief .kv{font-size:var(--fs-sm)}',
    '.task-brief .badges{display:flex;flex-wrap:wrap;gap:6px}',
    '.task-ta{min-height:156px;font-size:1.0625rem;line-height:1.65}',
    '.task-tr .card-h{margin-bottom:12px}',
    '.task-tr-foot{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px 14px;margin-top:14px}',
    '.task-tr-foot > .row{gap:10px}',
    '.task-keys{display:inline-flex;align-items:center;gap:4px}',
    '@media (hover:none){.task-keys{display:none}}',
    '@media (max-width:479px){.task-tr-foot > .btn{width:100%}}',
    '.task-res-slot:empty{display:none}',
    '.task-res,.task-res-sk{display:grid;gap:20px;min-width:0}',
    '.task-verdict:focus{outline:none}',
    '.task-verdict{display:grid;grid-template-columns:auto auto minmax(0,1fr);align-items:center;gap:20px 28px;overflow:hidden}',
    '@media (max-width:719px){.task-verdict{grid-template-columns:repeat(2,auto);justify-content:center;text-align:center}.task-vtx{grid-column:1 / -1;justify-items:center}.task-vtx .chips{justify-content:center}}',
    '.task-grade{display:grid;justify-items:center;gap:10px}',
    '.medal.task-medal > b{font-size:calc(var(--size) * .44)}',
    '.task-grade-w{font:600 .6875rem/1 var(--f-body);letter-spacing:.14em;text-transform:uppercase;color:var(--soft)}',
    '.task-vtx{display:grid;gap:8px;min-width:0}',
    '.task-vtx h2{font-size:var(--fs-xl)}',
    '.task-vtx .chips{margin-top:4px}',
    '.task-skills{display:grid;gap:14px}',
    '.task-skill{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:baseline;gap:6px 12px}',
    '.task-skill .progress{grid-column:1 / -1}',
    '.task-skill-n{font-size:var(--fs-sm);font-weight:500}',
    '.task-skill-v{font-size:var(--fs-sm);color:var(--soft);font-variant-numeric:tabular-nums}',
    '.task-skill-v b{font-family:var(--f-display);font-size:1rem;color:var(--ink)}',
    '.task-model-tx{font-family:var(--f-display);font-size:1.0625rem;line-height:1.65}',
    '.task-model .muted{margin-top:10px;font-size:var(--fs-sm)}',
    '.task-errs{display:grid;gap:12px}',
    '@media (min-width:860px){.task-errs{grid-template-columns:repeat(2,minmax(0,1fr))}}',
    '.task-err{position:relative;display:grid;align-content:start;gap:10px;min-width:0;padding:16px 16px 16px 20px;border:1px solid var(--line);border-radius:var(--r-lg);background:var(--surface);box-shadow:var(--sh-1);animation:task-in .36s var(--ease-out) both;transition:border-color var(--t-base),background var(--t-base)}',
    '.task-err::before{content:"";position:absolute;left:0;top:16px;bottom:16px;width:3px;border-radius:0 3px 3px 0;background:var(--nar);transition:background var(--t-base)}',
    '.task-err[data-sev="mid"]::before{background:var(--zafaran)}',
    '.task-err[data-sev="low"]::before{background:var(--lacquer)}',
    '.task-err-top{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px}',
    '.task-err-top small{color:var(--soft);font-size:var(--fs-xs)}',
    '.task-err-fix{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;font-family:var(--f-display);font-size:1.1875rem;line-height:1.35;overflow-wrap:anywhere}',
    '.task-was{color:var(--nar);text-decoration:line-through;text-decoration-thickness:2px;text-decoration-color:color-mix(in srgb,var(--nar) 75%,transparent)}',
    '.task-miss{color:var(--nar);font-style:normal;font-size:1rem}',
    '.task-arrow{display:inline-flex;color:var(--faint)}',
    '.task-arrow svg{width:18px;height:18px}',
    '.task-now{padding:1px 8px;border-radius:8px;background:var(--fir-t);color:var(--firuze);font-weight:600}',
    '.task-why-btn{justify-self:start;display:inline-flex;align-items:center;gap:6px;min-height:30px;padding:4px 12px 4px 8px;border:0;border-radius:var(--r-pill);background:var(--surface2);color:var(--ink);font:600 var(--fs-sm)/1.2 var(--f-body);cursor:pointer;transition:background var(--t-fast)}',
    '.task-why-btn svg{width:16px;height:16px;color:var(--zafaran-ink)}',
    '@media (hover:hover){.task-why-btn:hover{background:color-mix(in srgb,var(--surface2) 70%,var(--line))}}',
    '.task-why-btn[aria-expanded="true"]{background:var(--zaf-t)}',
    '.task-why-btn:focus-visible{outline:2px solid var(--focus);outline-offset:2px}',
    '.task-why{display:grid;gap:8px;font-size:.9rem;line-height:1.55;animation:task-in .26s var(--ease-out) both}',
    '.task-ex{display:grid;gap:3px;padding:8px 12px;border-left:2px solid var(--firuze);border-radius:0 8px 8px 0;background:var(--fir-t);font-family:var(--f-display);font-style:normal}',
    '.task-ex .eyebrow{font-family:var(--f-body);font-style:normal}',
    '.task-err-act{display:flex;flex-wrap:wrap;gap:8px}',
    '.task-self{display:grid;gap:6px}',
    '.task-self-row{display:flex;gap:8px}',
    '.task-self .input{min-height:38px;padding-block:6px}',
    '.task-self small{color:var(--soft);font-size:var(--fs-xs)}',
    '.task-err.done{border-color:color-mix(in srgb,var(--ok) 40%,var(--line));background:linear-gradient(180deg,var(--ok-t),transparent 70%),var(--surface)}',
    '.task-err.done::before{background:var(--ok)}',
    '.task-err.done .task-err-act,.task-err.done .task-self{display:none}',
    '.task-err.done .task-was{opacity:.6}',
    '.task-err-state:empty{display:none}',
    '.task-err-state{display:flex;flex-wrap:wrap;gap:6px}',
    '.task-err:focus{outline:none}',
    '.task-err:focus-visible{outline:2px solid var(--focus);outline-offset:2px}',
    '.task-next{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:10px}',
    '@media (max-width:479px){.task-next .btn{flex:1 1 100%}}',
    '.task-empty .empty-art{width:auto;height:auto;min-height:96px}',

    /* ---- PRACTICE ---- */
    '.practice-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(164px,1fr));gap:12px}',
    '@media (min-width:640px){.practice-grid{grid-template-columns:repeat(auto-fill,minmax(204px,1fr));gap:16px}}',
    'button.card.practice-game{display:flex;flex-direction:column;gap:12px;min-height:204px;padding:16px}',
    '.practice-game-top{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}',
    '.practice-game h3{font-size:1.0625rem;line-height:1.25}',
    '.practice-game p{margin-top:4px;color:var(--soft);font-size:var(--fs-sm);line-height:1.45}',
    '.practice-game-foot{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:6px 10px;margin-top:auto;padding-top:12px;border-top:1px solid var(--line);color:var(--soft);font-size:var(--fs-xs)}',
    /* phones: difficulty and record always on two lines, so every card's footer has the same rhythm */
    '@media (max-width:479px){.practice-game-foot{flex-direction:column;align-items:flex-start;justify-content:flex-start;gap:4px}}',
    '.practice-diff{display:inline-flex;align-items:center;gap:4px}',
    '.practice-diff i{width:7px;height:7px;border-radius:1.5px;background:var(--line-2);transform:rotate(45deg)}',
    '.practice-diff i.on{background:var(--firuze)}',
    '.practice-diff span{margin-left:4px}',
    '.practice-best{display:inline-flex;align-items:center;gap:4px}',
    '.practice-best svg{width:14px;height:14px;color:var(--zafaran-ink)}',
    '.practice-best b{font-family:var(--f-display);font-size:.9375rem;color:var(--ink)}',
    '.practice-game.feat{border-color:color-mix(in srgb,var(--firuze) 45%,var(--line))}',
    '.practice-game.feat::after{content:"";position:absolute;left:16px;right:16px;top:0;height:6px;background:var(--firuze);opacity:.7;-webkit-mask:var(--m-band) 0 0/18px 6px repeat-x;mask:var(--m-band) 0 0/18px 6px repeat-x;transform:scaleY(-1);pointer-events:none}',
    '.practice-det{display:grid;gap:16px;scroll-margin-top:calc(var(--hdr-h) + var(--band-h) + 16px)}',
    '.practice-det .card-h{margin-bottom:0}',
    '.practice-det-src{display:grid;gap:4px;padding:12px 14px;border-radius:var(--r-md);background:var(--surface2);color:var(--soft);font-size:.9375rem;line-height:1.55}',
    '.practice-det-src b{color:var(--ink);font-size:var(--fs-sm)}',
    '.practice-det-text{font-family:var(--f-display);font-size:1.1875rem;line-height:2;letter-spacing:-.005em;overflow-wrap:anywhere}',
    '@media (min-width:640px){.practice-det-text{font-size:1.3125rem}}',
    '.practice-w{display:inline;margin:0 -1px;padding:3px;border:0;border-radius:6px;background:transparent;color:inherit;font:inherit;line-height:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:background var(--t-fast),color var(--t-fast),box-shadow var(--t-fast)}',
    '@media (hover:hover){.practice-w:hover{background:var(--surface2)}}',
    '.practice-w:focus-visible{outline:2px solid var(--focus);outline-offset:1px}',
    '.practice-w[aria-pressed="true"]{background:var(--fir-t);color:var(--firuze);box-shadow:inset 0 -2px 0 var(--firuze)}',
    '.practice-w.hit{background:var(--ok-t);color:var(--ink);box-shadow:inset 0 -2px 0 var(--ok);text-decoration:line-through;text-decoration-color:var(--ok)}',
    '.practice-w.miss{background:var(--nar-t);color:var(--nar);text-decoration:line-through;outline:1.5px dashed var(--nar);outline-offset:-1px}',
    '.practice-w.false{background:transparent;color:var(--faint);box-shadow:inset 0 -2px 0 var(--line-2)}',
    '.practice-w[aria-disabled="true"]{cursor:default}',
    '.practice-fix{display:inline-block;margin:0 6px 0 3px;padding:0 7px;border-radius:7px;background:var(--fir-t);color:var(--firuze);font:600 .875rem/1.7 var(--f-body);text-decoration:none;vertical-align:.12em;animation:pop-in .32s var(--ease-spring) both}',
    '.practice-det-bar{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px}',
    '.practice-det-bar .row{gap:8px}',
    '.practice-det-res{display:grid;gap:16px;padding-top:16px;border-top:1px solid var(--line);animation:task-in .32s var(--ease-out) both}',
    '.practice-det-sum{display:flex;flex-wrap:wrap;align-items:center;gap:16px 24px}',
    '.practice-det-sum .stats{flex:1;min-width:210px}',
    '.practice-det-list{display:grid;gap:10px}',
    '.practice-det-li{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 8px;font-size:.9rem;line-height:1.5}',
    '.practice-det-li s{color:var(--nar);text-decoration-thickness:2px}',
    '.practice-det-li .task-now{font-family:var(--f-display)}',
    '.practice-q{display:grid;gap:16px}',
    '.practice-q-top{display:flex;align-items:center;gap:12px}',
    '.practice-q-top .progress{flex:1}',
    '.practice-q-sit{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:var(--r-md);background:var(--zaf-t)}',
    '.practice-q-sit svg{width:18px;height:18px;color:var(--zafaran-ink)}',
    '.practice-q-sit small{display:block;color:var(--soft);font-size:var(--fs-xs)}',
    '.practice-q-src{display:grid;gap:4px}',
    '.practice-q-src p,.practice-q-term{font-family:var(--f-display);font-size:1.1875rem;line-height:1.5}',
    '.practice-q-term{font-size:1.625rem;text-align:center;padding:10px 0}',
    '.practice-q-sent{font-family:var(--f-display);font-size:1.25rem;line-height:1.55}',
    '.practice-q-mark{padding:0 .2em;border-radius:6px;background:var(--fir-t);color:var(--firuze);box-shadow:inset 0 -2px 0 var(--firuze)}',
    '.practice-q-ask{font-weight:600}',
    '.practice-opts{display:grid;gap:10px}',
    '.choice.practice-opt{align-items:center;padding-block:14px}',
    '.practice-opt-k{flex:none;width:28px;height:28px;display:grid;place-items:center;border-radius:8px;background:var(--surface2);color:var(--soft);font:700 var(--fs-sm)/1 var(--f-body)}',
    '.choice.practice-opt b{font-weight:500;line-height:1.45}',
    '.practice-opts.locked .choice{pointer-events:none}',
    '.choice.practice-opt.right{border-color:var(--ok);background:linear-gradient(var(--ok-t),var(--ok-t)),var(--surface);box-shadow:0 0 0 3px var(--ok-t)}',
    '.choice.practice-opt.right::after{background:var(--ok);border-color:var(--ok)}',
    '.choice.practice-opt.right::before{content:"";position:absolute;top:18px;right:18px;z-index:1;width:12px;height:12px;background:var(--surface);-webkit-mask:var(--m-check) center/contain no-repeat;mask:var(--m-check) center/contain no-repeat}',
    '.choice.practice-opt.wrong{border-color:var(--nar);background:linear-gradient(var(--nar-t),var(--nar-t)),var(--surface);animation:task-shake .4s var(--ease-out)}',
    '.choice.practice-opt.wrong::after{background:var(--nar);border-color:var(--nar)}',
    '.choice.practice-opt.dim{opacity:.55}',
    '.practice-q-fb{display:grid;gap:12px}',
    '.practice-q-fb:empty{display:none}',
    '.practice-timer{display:flex;align-items:center;gap:10px;font:600 var(--fs-sm)/1 var(--f-body);color:var(--ink)}',
    '.practice-timer svg{width:18px;height:18px;color:var(--soft)}',
    '.practice-timer .progress{flex:1}',
    '.practice-timer .progress > i{animation:none;transition:width 1s linear}',
    '.practice-timer.low{color:var(--nar)}',
    '.practice-end{display:grid;justify-items:center;gap:12px;padding:8px 0 4px;text-align:center}',
    '.practice-end h3{font-size:var(--fs-xl)}',
    '.practice-end p{max-width:42ch;color:var(--soft)}',
    '.practice-oral{display:grid;justify-items:center;gap:16px;text-align:center;padding-bottom:4px}',
    '.practice-wave{display:flex;align-items:center;justify-content:center;gap:4px;width:100%;max-width:320px;height:56px}',
    '.practice-wave i{flex:1;max-width:6px;height:18%;border-radius:3px;background:var(--line-2);transition:background var(--t-base)}',
    '.practice-wave.on i{background:var(--firuze);animation:practice-wave 1s var(--ease-in-out) infinite;animation-delay:calc(var(--i) * -70ms)}',
    '.practice-wave.rec i{background:var(--nar)}',
    '@keyframes practice-wave{0%,100%{height:18%}50%{height:var(--h,80%)}}',
    '.practice-mic{width:76px;height:76px;display:grid;place-items:center;border:0;border-radius:50%;background:var(--firuze);color:var(--on-firuze);box-shadow:0 12px 26px -10px var(--firuze);cursor:pointer;transition:transform var(--t-fast) var(--ease-out),opacity var(--t-base)}',
    '.practice-mic svg{width:28px;height:28px}',
    '.practice-mic:active{transform:scale(.94)}',
    '.practice-mic:disabled{opacity:.5;cursor:default}',
    '.practice-mic.lac{background:var(--lacquer);color:var(--on-lacquer);box-shadow:0 12px 26px -10px var(--lacquer)}',
    '.practice-mic.rec{background:var(--nar);color:var(--on-nar);box-shadow:0 12px 26px -10px var(--nar);animation:practice-pulse 1.2s var(--ease-out) infinite}',
    '@keyframes practice-pulse{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--nar) 45%,transparent)}100%{box-shadow:0 0 0 20px transparent}}',
    '.practice-oral-tx{max-width:44ch;font-family:var(--f-display);font-size:1.1875rem;line-height:1.5}',
    '.practice-oral-tx.muted{font-family:var(--f-body);font-size:var(--fs-base)}',
    '.practice-fb-list{display:grid;gap:8px;width:100%;text-align:left}',
    '.practice-req{display:grid;gap:6px;margin:0;padding-left:1.1em}',

    /* ---- CARDS ---- */
    '@media (max-width:639px){.cards-chips{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;margin-inline:calc(var(--gutter) * -1);padding:2px var(--gutter) 4px}.cards-chips::-webkit-scrollbar{display:none}.cards-chips .chip{flex:none}}',
    '.cards-wrap{display:grid;gap:16px;width:100%;max-width:640px;margin-inline:auto;min-width:0}',
    '.cards-top{display:grid;gap:10px}',
    '.cards-count{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;color:var(--soft);font-size:var(--fs-sm)}',
    '.cards-count b{font-family:var(--f-display);font-size:1.125rem;color:var(--ink)}',
    '.cards-count .row{gap:6px}',
    '.cards-stage{position:relative;isolation:isolate;padding-bottom:12px;perspective:1600px}',
    '.cards-stage::before,.cards-stage::after{content:"";position:absolute;left:14px;right:14px;bottom:2px;height:48px;z-index:-1;border:1px solid var(--line);border-radius:0 0 var(--r-xl) var(--r-xl);background:var(--surface);box-shadow:var(--sh-1)}',
    '.cards-stage::after{left:30px;right:30px;bottom:-6px;z-index:-2;opacity:.75}',
    '.cards-stage.single::before,.cards-stage.single::after{display:none}',
    '.cards-stage.two::after{display:none}',
    '.cards-card{position:relative;display:block;width:100%;min-height:372px;padding:0;border:0;border-radius:var(--r-xl);background:none;color:inherit;font:inherit;text-align:left;cursor:pointer;touch-action:pan-y;-webkit-tap-highlight-color:transparent;transition:transform .26s var(--ease-out),opacity .26s var(--ease-out)}',
    '.cards-card:focus-visible{outline:2px solid var(--focus);outline-offset:4px}',
    '.cards-card.drag{transition:none}',
    '.cards-card.out-r{transform:translateX(70%) rotate(8deg);opacity:0}',
    '.cards-card.out-l{transform:translateX(-70%) rotate(-8deg);opacity:0}',
    '.cards-card.in{animation:cards-in .34s var(--ease-out) both}',
    '@keyframes cards-in{from{opacity:0;transform:translateY(14px) scale(.97)}to{opacity:1;transform:none}}',
    '.cards-inner{position:relative;display:grid;min-height:inherit;transform-style:preserve-3d;transition:transform .62s var(--ease-out)}',
    '.cards-card.flipped .cards-inner{transform:rotateY(180deg)}',
    '.cards-face{grid-area:1 / 1;position:relative;display:flex;flex-direction:column;gap:16px;min-width:0;padding:26px 22px 20px;border:1px solid var(--line);border-radius:var(--r-xl);background:var(--surface);box-shadow:var(--sh-2);-webkit-backface-visibility:hidden;backface-visibility:hidden;overflow:hidden}',
    '.cards-face::before{content:"";position:absolute;left:22px;right:22px;top:0;height:6px;background:var(--firuze);opacity:.55;-webkit-mask:var(--m-band) 0 0/18px 6px repeat-x;mask:var(--m-band) 0 0/18px 6px repeat-x;transform:scaleY(-1);pointer-events:none}',
    '.cards-face::after{content:"";position:absolute;right:-34px;top:-34px;width:128px;height:128px;background:var(--firuze);opacity:.1;-webkit-mask:var(--m-gul) center/contain no-repeat;mask:var(--m-gul) center/contain no-repeat;pointer-events:none}',
    '.cards-face.back{transform:rotateY(180deg);background:linear-gradient(180deg,var(--fir-t),transparent 45%),var(--surface)}',
    '.cards-face-top{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px 10px;position:relative}',
    '.cards-blk{display:grid;gap:6px;min-width:0}',
    '.cards-lbl{color:var(--soft);font:600 .6875rem/1.3 var(--f-body);letter-spacing:.12em;text-transform:uppercase}',
    '.cards-src{color:var(--soft);font-size:.9375rem;line-height:1.55}',
    '.cards-sent{font-family:var(--f-display);font-size:1.375rem;line-height:1.45;letter-spacing:-.005em;overflow-wrap:anywhere}',
    '@media (min-width:640px){.cards-sent{font-size:1.5rem}}',
    '.cards-bad{color:var(--nar);text-decoration:line-through;text-decoration-thickness:2px}',
    'mark.cards-good{padding:0 .18em;border-radius:6px;background:var(--fir-t);color:var(--firuze);font-weight:600}',
    '.cards-why{font-size:.9rem}',
    '.cards-hint{display:flex;align-items:center;gap:8px;margin-top:auto;color:var(--faint);font-size:var(--fs-xs)}',
    '.cards-hint svg{width:14px;height:14px}',
    '.cards-box{display:inline-flex;align-items:center;gap:6px;color:var(--soft);font-size:var(--fs-xs)}',
    '.cards-pips{display:inline-flex;gap:3px}',
    '.cards-pips i{width:7px;height:7px;border-radius:1.5px;background:var(--line-2);transform:rotate(45deg)}',
    '.cards-pips i.on{background:var(--firuze)}',
    '.cards-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px}',
    '.cards-actions .btn,.cards-flip{min-height:52px;font-size:1rem}',
    '.cards-keys{display:flex;flex-wrap:wrap;justify-content:center;gap:6px 14px;color:var(--faint);font-size:var(--fs-xs)}',
    '.cards-keys span{display:inline-flex;align-items:center;gap:5px}',
    '@media (hover:none){.cards-keys{display:none}}',
    '.cards-done{display:grid;justify-items:center;gap:14px;padding:32px 20px;text-align:center}',
    '.cards-done h2{font-size:var(--fs-2xl)}',
    '.cards-done > p{max-width:44ch}',
    '.cards-done .stats{width:100%;max-width:420px}',
    '.cards-done .stat{justify-items:center}',
    '.cards-done .actions{display:flex;flex-wrap:wrap;justify-content:center;gap:8px}',
    '.cards-empty .empty-art{width:auto;height:auto;min-height:96px}',
    '.cards-boxes{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}',
    '.cards-bx{display:grid;justify-items:center;gap:2px;min-width:0;padding:12px 4px 10px;border-radius:var(--r-md);background:var(--surface2);text-align:center}',
    '.cards-bx b{font-family:var(--f-display);font-size:1.5rem;line-height:1.1}',
    '.cards-bx span{font-size:var(--fs-xs);font-weight:600}',
    '.cards-bx small{color:var(--soft);font-size:.6875rem;line-height:1.25}',
    '.cards-bx .progress{width:72%;margin-top:6px}',

    /* ---- PROGRESS ---- */
    '.progress-hero{display:grid;gap:22px}',
    '@media (min-width:760px){.progress-hero{grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);align-items:center}}',
    '.progress-hero-l{display:flex;align-items:center;gap:18px;min-width:0}',
    '.progress-hero-l > .stack-sm{flex:1;min-width:0}',
    '.progress-rank{font-size:var(--fs-2xl);line-height:1.1}',
    '.card.lacquer .progress-rank em{color:color-mix(in srgb,var(--firuze) 72%,var(--on-deep))}',
    '.progress-hero-main{display:grid;gap:18px;min-width:0}',
    '.progress-ladder{display:flex;gap:4px;margin:0;padding:12px 0 0;border-top:1px solid color-mix(in srgb,var(--on-deep) 14%,transparent);list-style:none}',
    '.progress-ladder li{flex:1;min-width:0;display:grid;justify-items:center;gap:6px;color:var(--on-deep-soft);font-size:.6875rem;letter-spacing:.02em;text-align:center}',
    '.progress-ladder li span{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.progress-ladder i{width:9px;height:9px;border:1px solid color-mix(in srgb,var(--on-deep) 40%,transparent);border-radius:2px;transform:rotate(45deg)}',
    '.progress-ladder li.done i{background:color-mix(in srgb,var(--firuze) 72%,var(--on-deep));border-color:transparent}',
    '.progress-ladder li.cur i{background:color-mix(in srgb,var(--firuze) 72%,var(--on-deep));border-color:transparent;box-shadow:0 0 0 3px color-mix(in srgb,var(--firuze) 32%,transparent)}',
    '.progress-ladder li.cur span{color:color-mix(in srgb,var(--firuze) 72%,var(--on-deep));font-weight:700}',
    '.progress-hero .stats{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}',
    '@media (min-width:480px){.progress-hero .stats{grid-template-columns:repeat(4,minmax(0,1fr))}}',
    '@media (min-width:760px){.progress-hero .stats{grid-template-columns:repeat(2,minmax(0,1fr))}}',
    '.progress-hero .stat{padding:12px;border-radius:var(--r-md);background:color-mix(in srgb,var(--on-deep) 7%,transparent)}',
    '.progress-hero .stat > b{font-size:1.5rem;color:var(--on-deep)}',
    '.progress-chart{position:relative;min-width:0}',
    '.progress-chart svg{display:block;width:100%;height:auto;overflow:visible}',
    '.progress-chart:focus-visible{outline:2px solid var(--focus);outline-offset:4px;border-radius:8px}',
    '.progress-svg .g{fill:none;stroke:var(--line);stroke-width:1}',
    '.progress-svg .sp{stroke:var(--line);stroke-width:1}',
    '.progress-svg .b{fill:none;stroke:var(--faint);stroke-width:1.5;stroke-linejoin:round}',
    '.progress-svg .n{fill:color-mix(in srgb,var(--firuze) 14%,transparent);stroke:var(--firuze);stroke-width:2;stroke-linejoin:round;transform-origin:190px 150px;animation:progress-grow .9s var(--ease-out) both}',
    '@keyframes progress-grow{from{opacity:0;transform:scale(.2)}to{opacity:1;transform:none}}',
    '.progress-svg .d{fill:var(--firuze);stroke:var(--surface);stroke-width:2}',
    '.progress-svg .hit{fill:transparent;cursor:pointer;outline:none}',
    '.progress-svg text{font-family:var(--f-body);font-size:12px;fill:var(--soft)}',
    '.progress-svg .lv{font-size:12.5px;font-weight:700;fill:var(--ink)}',
    '.progress-svg .up{font-weight:600;fill:var(--ok)}',
    '.progress-svg .dn{font-weight:600;fill:var(--nar)}',
    '.progress-svg .ax{font-size:11px;fill:var(--faint);font-variant-numeric:tabular-nums}',
    '.progress-svg .ln{fill:none;stroke:var(--firuze);stroke-width:2;stroke-linejoin:round;stroke-linecap:round;stroke-dasharray:1;stroke-dashoffset:0;animation:progress-draw 1.2s var(--ease-out) both}',
    '@keyframes progress-draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}',
    '.progress-svg .ar{fill:var(--firuze);opacity:.12}',
    '.progress-svg .cx{stroke:var(--line-2);stroke-width:1;opacity:0;transition:opacity var(--t-fast)}',
    '.progress-svg .cx.on{opacity:1}',
    '.progress-svg .end{font-family:var(--f-display);font-size:14px;font-weight:600;fill:var(--ink)}',
    '.progress-tip{position:absolute;left:0;top:0;z-index:2;min-width:120px;max-width:220px;padding:8px 10px;border-radius:10px;background:var(--inv-bg);color:var(--inv-ink);box-shadow:var(--sh-2);font-size:.75rem;line-height:1.35;pointer-events:none;opacity:0;transform:translate(-50%,calc(-100% - 12px));transition:opacity var(--t-fast)}',
    '.progress-tip.on{opacity:1}',
    '.progress-tip b{display:block;font:600 1.0625rem/1.2 var(--f-display)}',
    '.progress-tip span{display:block;color:var(--inv-soft);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.progress-legend{display:flex;flex-wrap:wrap;gap:6px 16px;color:var(--soft);font-size:var(--fs-xs)}',
    '.progress-legend span{display:inline-flex;align-items:center;gap:6px}',
    '.progress-legend i{width:16px;height:2px;border-radius:2px;background:var(--firuze)}',
    '.progress-legend i.b{background:var(--faint)}',
    '.progress-card{display:grid;gap:14px;align-content:start}',
    '.progress-card .card-h{margin-bottom:0}',
    '.progress-tbl summary{display:inline-flex;align-items:center;gap:6px;color:var(--soft);font-size:var(--fs-xs);font-weight:600;cursor:pointer;list-style:none}',
    '.progress-tbl summary::-webkit-details-marker{display:none}',
    '.progress-tbl summary svg{width:14px;height:14px;transition:transform var(--t-base)}',
    '.progress-tbl[open] summary svg{transform:rotate(90deg)}',
    '.progress-tbl .table-wrap{margin-top:10px;box-shadow:none}',
    '.progress-meta{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px 16px}',
    '.progress-emap{display:grid;gap:2px}',
    '.progress-erow{display:grid;grid-template-columns:minmax(0,8.75rem) minmax(0,1fr) auto;align-items:center;gap:12px;width:calc(100% + 20px);margin:0 -10px;padding:9px 10px;border:0;border-radius:var(--r-md);background:none;color:inherit;font:inherit;text-align:left;cursor:pointer;transition:background var(--t-fast)}',
    '@media (hover:hover){.progress-erow:hover{background:var(--surface2)}}',
    '.progress-erow:focus-visible{outline:2px solid var(--focus);outline-offset:-2px}',
    '.progress-erow-t{min-width:0;font-size:var(--fs-sm);font-weight:500;line-height:1.3}',
    '.progress-erow-t small{display:block;color:var(--faint);font-size:var(--fs-xs);font-weight:400}',
    '.progress-erow-v{display:inline-flex;align-items:center;gap:6px;font:600 var(--fs-sm)/1 var(--f-body);font-variant-numeric:tabular-nums}',
    '@media (max-width:479px){.progress-erow{grid-template-columns:minmax(0,1fr) auto}.progress-erow .progress{grid-column:1 / -1;grid-row:2}}',
    '.progress-ms .list-row .tx .progress{margin-top:6px}',
    '.progress-week{display:grid;gap:24px}',
    '.progress-week-l{display:grid;gap:12px;min-width:0}',
    '.progress-week-l .btn{justify-self:start}',
    '.progress-week-meta{display:flex;justify-content:space-between;gap:8px;color:var(--on-deep-soft);font-size:var(--fs-sm)}',
    '.progress-reward{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:var(--r-md);background:color-mix(in srgb,var(--on-deep) 8%,transparent)}',
    '.progress-reward small{display:block;color:var(--on-deep-soft)}',
    '.card.lacquer .avatar.sm{box-shadow:0 0 0 1.5px var(--deep),0 0 0 2.5px var(--firuze)}'
  ].join('\n');

  /* ------------------------------------------------------------------
     5. TASK SCREEN
     ------------------------------------------------------------------ */
  var T = null;

  function renderTask(page, params) {
    var lvParam = params.level && levelById(params.level) ? params.level : null;
    T = { page: page, task: null, hints: 0, result: null, checking: false, level: lvParam || sget('academy:level', 'B2'), lastChecked: null,
      mode: params.mode === 'hunt' || params.mode === 'tr' ? params.mode : sget('academy:tmode', 'tr'), col: sget('academy:col', 'base'), hunt: null };
    if (!levelById(T.level)) T.level = 'B2';
    if (T.mode !== 'hunt' || !HUNT.length) T.mode = 'tr';
    if (!COLS.some(function (c) { return c.id === T.col; })) T.col = 'base';
    if (params.col && COLS.some(function (c) { return c.id === params.col; })) { T.col = params.col; T.mode = 'tr'; }

    page.appendChild(h('div', { class: 'page-h' },
      h('div', null,
        h('span', { class: 'eyebrow', text: 'Akademiya · Tapşırıq' }),
        h('h1', { html: 'Bugünkü <em>tapşırıq</em>' }),
        h('p', { text: 'Mətni oxuyun, öz variantınızı yazın — Mirzə Məclisi yoxlayıb hər səhvi izah edəcək.' })),
      userCards().length ? h('div', { class: 'actions' },
        h('button', { class: 'btn btn-ghost', type: 'button', onclick: function () { App.go('cards'); } }, ie('cards'), 'Səhv kartları')) : null));

    page.appendChild(modeCard());
    T.getCard = levelCard();
    page.appendChild(T.getCard);
    T.briefSlot = h('div', { class: 'task-slot', hidden: true });
    T.srcSlot = h('div', { class: 'task-slot' });
    page.appendChild(T.briefSlot);
    page.appendChild(T.srcSlot);
    T.trCard = translationCard();
    page.appendChild(T.trCard);
    T.resSlot = h('div', { class: 'task-res-slot', 'aria-live': 'polite' });
    page.appendChild(T.resSlot);
    T.huntSlot = h('div', { class: 'task-slot', hidden: true });
    page.appendChild(T.huntSlot);

    var st = sget('academy:task', null);
    var pick = params.id ? taskById(params.id) : null;
    if (pick) T.mode = 'tr';
    paintMode();
    if (T.mode === 'hunt') {
      loadHunt(nextHunt(T.level));
    } else if (pick) {
      T.col = colOf(pick); paintMode();
      setLevel(pick.level);
      loadTask(pick, {});
      later(function () { nz('read', pick.tip, 3200); }, 700);
    } else if (!lvParam && !params.domain && !params.col && st && taskById(st.id) && colOf(taskById(st.id)) === T.col) {
      var t0 = taskById(st.id);
      setLevel(t0.level);
      loadTask(t0, { text: st.text, hints: st.hints, reg: st.reg });
      later(function () { nz('point', 'Qaldığımız yerdən davam edək: «' + t0.title + '».', 2800); }, 900);
    } else {
      fetchTask(params.domain || null, true);
    }
  }

  function setLevel(id) {
    if (!T || !levelById(id)) return;
    T.level = id; sset('academy:level', id);
    if (T.paintLevel) T.paintLevel();
  }

  function levelCard() {
    var meter = h('div', { class: 'task-lv-meter', role: 'group', 'aria-label': 'Səviyyə' });
    var lbl = h('b'), sub = h('small');
    var btns = LEVELS.map(function (lv) {
      var b = h('button', { type: 'button', 'aria-pressed': 'false', title: lv.id + ' · ' + lv.name }, lv.id);
      b.addEventListener('click', function () {
        if (!T || T.level === lv.id) return;
        var prev = T.level;
        setLevel(lv.id);
        fetchTask(null, false, function () { setLevel(prev); });
      });
      meter.appendChild(b);
      return b;
    });
    T.paintLevel = function () {
      var cur = levelIdx(T.level), lv = LEVELS[cur];
      btns.forEach(function (b, i) { b.setAttribute('aria-pressed', i === cur ? 'true' : 'false'); b.classList.toggle('on', i <= cur); });
      lbl.textContent = lv.id + ' · ' + lv.name;
      sub.textContent = lv.d;
    };
    T.getBtn = h('button', { class: 'btn btn-secondary', type: 'button' }, ie('sparkle'), 'Yeni mətn al');
    T.getBtn.addEventListener('click', function () { fetchTask(null, false); });
    T.paintLevel();
    return h('section', { class: 'card task-get', 'aria-label': 'Səviyyə və yeni mətn' },
      h('div', { class: 'task-lv' }, h('span', { class: 'eyebrow', text: 'Səviyyəniz' }), meter, h('div', { class: 'task-lv-tx' }, lbl, sub)),
      T.getBtn);
  }

  /* «Tərcümə et» / «Səhvi tap» + collection choice */
  function segBtns(items, cur, onPick, label, cls) {
    var wrap = h('div', { class: 'seg ' + cls, role: 'group', 'aria-label': label });
    var btns = items.map(function (it) {
      var b = h('button', { type: 'button', 'aria-pressed': 'false' }, it.icon ? ie(it.icon) : null, it.label);
      b.addEventListener('click', function () { onPick(it.id); });
      wrap.appendChild(b);
      return b;
    });
    wrap._paint = function (v) { btns.forEach(function (b, i) { b.setAttribute('aria-pressed', items[i].id === v ? 'true' : 'false'); }); };
    wrap._paint(cur);
    return wrap;
  }
  function modeCard() {
    var modes = segBtns([{ id: 'tr', label: 'Tərcümə et', icon: 'edit' }, { id: 'hunt', label: 'Səhvi tap', icon: 'search' }], T.mode, setMode, 'Tapşırıq növü', 'block');
    if (!HUNT.length) modes.hidden = true;
    var cols = segBtns(COLS, T.col, setCol, 'Mətn toplusu', 'wrap sm');
    T.colRow = h('div', { class: 'task-mode-row' }, h('span', { class: 'eyebrow plain', text: 'Mətnlər' }), cols);
    if (COLS.length < 2) T.colRow.hidden = true;
    T.paintCol = function () { cols._paint(T.col); };
    T.paintModeBtns = function () { modes._paint(T.mode); };
    T.modeNote = h('p', { class: 'small muted' });
    return h('section', { class: 'card task-mode', 'aria-label': 'Tapşırıq növü və mətnlər' }, modes, T.colRow, T.modeNote);
  }
  function paintMode() {
    if (!T) return;
    var hunt = T.mode === 'hunt';
    if (T.paintModeBtns) T.paintModeBtns();
    if (T.paintCol) T.paintCol();
    T.colRow.hidden = hunt || COLS.length < 2;
    T.srcSlot.hidden = hunt; T.trCard.hidden = hunt; T.resSlot.hidden = hunt; T.huntSlot.hidden = !hunt;
    if (hunt) T.briefSlot.hidden = true; else T.briefSlot.hidden = !(T.task && T.task.sim);
    T.modeNote.textContent = hunt
      ? 'Dərc olunmuş real tərcümədə (NTREX-128) səhvləri tapın: şübhəli sözlərə toxunun və «Yoxla».'
      : T.col === 'news' ? 'Real xəbər mətnləri — nümunə kimi dərc olunmuş peşəkar tərcümə göstəriləcək.'
      : T.col === 'docs' ? 'İnsan Hüquqları haqqında Ümumi Bəyannamə — BMT-nin rəsmi tərcüməsi ilə müqayisə.'
      : 'Mətni oxuyun, öz variantınızı yazın — Mirzə Məclisi yoxlayacaq.';
    if (T.getBtn) { T.getBtn.lastChild.textContent = hunt ? 'Başqa mətn' : 'Yeni mətn al'; }
  }
  function setMode(m) {
    if (!T || T.mode === m || T.checking) return;
    T.mode = m; sset('academy:tmode', m);
    paintMode();
    if (m === 'hunt') { if (!T.hunt) loadHunt(nextHunt(T.level)); scrollToEl(T.huntSlot); }
    else if (!T.task) fetchTask(null, true);
  }
  function setCol(c) {
    if (!T || T.col === c || T.checking) return;
    var prev = T.col;
    T.col = c; sset('academy:col', c); paintMode();
    fetchTask(null, false, function () { T.col = prev; sset('academy:col', prev); paintMode(); });
  }

  function nextTask(level, domain) {
    var col = (T && T.col) || 'base';
    var base = TASKS.filter(function (t) { return !t.sim && colOf(t) === col; });
    if (!base.length) base = TASKS.filter(function (t) { return !t.sim && !t.col; });
    var pool = base.filter(function (t) { return t.level === level; });
    if (domain) {
      var d = pool.filter(function (t) { return t.domain === domain; });
      if (!d.length) d = base.filter(function (t) { return t.domain === domain; });
      if (d.length) pool = d;
    }
    if (!pool.length) pool = base;
    var cur = T && T.task ? T.task.id : null;
    var cand = pool.filter(function (t) { return t.id !== cur; });
    if (!cand.length) cand = pool;
    var rot = Number(sget('academy:rot', 0)) || 0;
    sset('academy:rot', rot + 1);
    return cand[rot % cand.length];
  }

  function confirmDiscard() {
    if (!T || !T.ta || T.result || words(T.ta.value) < 4) return Promise.resolve(true);
    return confirmAsk({ title: 'Yeni mətn götürülsün?', text: 'Yazdığınız tərcümə hələ yoxlanmayıb və silinəcək.', okLabel: 'Yeni mətn al' });
  }

  function srcSkeleton() {
    return h('section', { class: 'card framed', role: 'status' },
      h('span', { class: 'sr-only', text: 'Mətn hazırlanır…' }),
      h('div', { class: 'sk-stack' },
        h('span', { class: 'skeleton text', style: 'width:140px' }),
        h('span', { class: 'skeleton title' }),
        h('div', { class: 'row' }, h('span', { class: 'skeleton', style: 'width:72px;height:22px;border-radius:999px' }), h('span', { class: 'skeleton', style: 'width:90px;height:22px;border-radius:999px' }), h('span', { class: 'skeleton', style: 'width:64px;height:22px;border-radius:999px' })),
        h('span', { class: 'skeleton text' }), h('span', { class: 'skeleton text', style: 'width:92%' }), h('span', { class: 'skeleton text', style: 'width:64%' })));
  }

  function fetchTask(domain, initial, onCancel) {
    if (!T || isBusy(T.getBtn) || T.checking) return;
    if (T.mode === 'hunt') { loadHunt(nextHunt(T.level)); return; }
    (initial ? Promise.resolve(true) : confirmDiscard()).then(function (ok) {
      if (!T) return;
      if (!ok) { if (onCancel) onCancel(); return; }
      var task = nextTask(T.level, domain);
      if (task.level !== T.level) setLevel(task.level);
      var g = gen;
      busy(T.getBtn, true);
      T.briefSlot.hidden = true;
      T.srcSlot.textContent = '';
      T.srcSlot.appendChild(srcSkeleton());
      T.resSlot.textContent = '';
      T.result = null;
      T.ta.value = ''; T.ta.disabled = true; updateWC();
      nz('think', initial ? null : 'Səviyyənizə uyğun mətn seçirəm…', 1800);
      App.fakeAI('analyze', { text: task.src }).then(function (a) {
        if (g !== gen || !T) return;
        busy(T.getBtn, false);
        loadTask(task, { reg: a && a.register });
        var card = T.srcSlot.lastChild; if (card) card.classList.add('task-in');
        nz('read', task.tip, 3200);
      }, function () {
        if (g !== gen || !T) return;
        busy(T.getBtn, false); loadTask(task, {});
      });
    });
  }

  function loadTask(task, o) {
    o = o || {};
    T.task = task; T.hints = clamp(Number(o.hints) || 0, 0, task.hints.length); T.result = null; T.lastChecked = null;
    T.reg = o.reg || task.reg;
    T.briefSlot.textContent = '';
    T.briefSlot.hidden = !task.sim;
    if (task.sim) T.briefSlot.appendChild(briefCard(task));
    T.srcSlot.textContent = '';
    T.srcSlot.appendChild(sourceCard(task));
    if (T.draftBtn) T.draftBtn.hidden = !task.draft;
    T.ta.disabled = false;
    T.ta.value = o.text || '';
    T.ta.removeAttribute('aria-invalid'); T.err.hidden = true;
    updateWC();
    T.resSlot.textContent = '';
    saveTask();
  }

  function saveTask() {
    if (!T || !T.task) return;
    sset('academy:task', { id: T.task.id, text: T.ta ? T.ta.value : '', hints: T.hints, reg: T.reg });
  }

  function briefCard(task) {
    var s = task.sim;
    return h('section', { class: 'card lacquer task-brief', 'aria-label': 'Sifarişin şərtləri' },
      h('div', { class: 'task-brief-top' }, icTile('folder', 'gold'),
        h('div', { class: 'stack-sm grow' },
          h('span', { class: 'eyebrow', text: 'Simulyator · real sifariş' }),
          h('h2', { html: esc(task.client) + ' — <em>' + esc(task.title) + '</em>' }))),
      h('dl', { class: 'kv' },
        h('dt', { text: 'Son tarix' }), h('dd', { text: s.deadline }),
        h('dt', { text: 'Həcm' }), h('dd', { text: s.volume }),
        h('dt', { text: 'Əlaqə' }), h('dd', { text: s.contact })),
      h('div', { class: 'badges' }, s.req.map(function (r) { return badge(r, '', 'check'); })));
  }

  function sourceCard(task) {
    var lv = levelById(task.level);
    var hintBox = h('div', { class: 'task-hints', 'aria-live': 'polite' });
    var hintBtn = h('button', { class: 'btn btn-ghost btn-sm', type: 'button' });
    var hintCount = h('span', { class: 'small muted tnum' });
    function paint() {
      hintBox.textContent = '';
      hintBox.hidden = !T.hints;
      if (T.hints) {
        hintBox.appendChild(h('div', { class: 'callout navy' }, ie('bulb'),
          h('div', null, h('b', { text: 'İpucu' }), h('ul', null, task.hints.slice(0, T.hints).map(function (x) { return h('li', { text: x }); })))));
      }
      var done = T.hints >= task.hints.length;
      hintBtn.textContent = '';
      hintBtn.appendChild(ie('bulb'));
      hintBtn.appendChild(D.createTextNode(done ? 'İpucları bitdi' : (T.hints ? 'Növbəti ipucu · −2 XP' : 'İpucu · −2 XP')));
      hintBtn.disabled = done;
      hintCount.textContent = 'İpucu: ' + T.hints + ' / ' + task.hints.length;
    }
    hintBtn.addEventListener('click', function () {
      if (T.hints >= task.hints.length) return;
      T.hints++; saveTask(); paint();
      if (T.hints === 1) nz('point', 'Bir ipucu verdim — qalanını özünüz tapın!', 2400);
      else nz('think', null, 1200);
    });
    paint();
    return h('section', { class: 'card framed task-src', 'aria-labelledby': 'task-src-h' },
      h('div', { class: 'card-h' },
        h('div', null, h('span', { class: 'eyebrow', text: 'Mənbə · EN → AZ · ' + task.client }), h('h2', { id: 'task-src-h', text: task.title })),
        h('div', { class: 'actions' }, h('button', { class: 'icon-btn sm ghost', type: 'button', 'aria-label': 'Mənbəni kopyala', title: 'Kopyala', html: App.icon('copy'), onclick: function () { copyText(task.src, 'Mənbə kopyalandı'); } }))),
      h('div', { class: 'task-meta' },
        badge(lv.id + ' · ' + lv.name, 'navy'),
        badge(task.domain, 'gold'),
        h('span', { class: 'badge', title: 'Üslubu Nuanza avtomatik təyin etdi' }, ie('sparkle'), (T.reg || task.reg) + ' · avtomatik'),
        badge(words(task.src) + ' söz'),
        badge('~' + task.minutes + ' dəq', '', 'clock')),
      h('p', { class: 'task-src-tx', lang: 'en', text: task.src }),
      task.credit ? h('p', { class: 'task-credit', text: task.credit }) : null,
      h('div', { class: 'task-src-foot' }, hintBtn, hintCount),
      hintBox);
  }

  function updateWC() { if (T && T.wc && T.ta) { var n = words(T.ta.value); T.wc.textContent = n + ' söz'; } }

  function translationCard() {
    var ta = h('textarea', { class: 'textarea task-ta', id: 'task-ta', rows: '5', placeholder: 'Tərcüməni bura yazın…', lang: 'az', spellcheck: 'true', 'aria-describedby': 'task-ta-hint' });
    var err = h('span', { class: 'err', hidden: true, role: 'alert' }, ie('alert'), 'Əvvəlcə tərcüməni yazın — ən azı bir cümlə.');
    var wc = h('span', { class: 'badge tnum', text: '0 söz' });
    var draft = h('button', { class: 'btn btn-ghost btn-sm', type: 'button' }, ie('file'), 'Nümunə qaralama');
    var check = h('button', { class: 'btn btn-primary', type: 'button' }, ie('sparkle'), 'Nuanza yoxlasın');
    T.ta = ta; T.err = err; T.wc = wc; T.check = check; T.draftBtn = draft;
    var wrote = false;
    ta.addEventListener('input', function () {
      updateWC();
      if (ta.getAttribute('aria-invalid')) { ta.removeAttribute('aria-invalid'); err.hidden = true; }
      saveTask();
      if (!wrote) { wrote = true; nz('write', null, 2000); }
    });
    ta.addEventListener('keydown', function (e) { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); runCheck(); } });
    draft.addEventListener('click', function () {
      if (!T || !T.task || ta.disabled || !T.task.draft) return;
      ta.value = T.task.draft; updateWC(); saveTask(); flash(ta); focusSoft(ta);
      ta.removeAttribute('aria-invalid'); err.hidden = true;
      nz('point', 'Bu, tipik tələbə qaralamasıdır. Göndərin — Məclis səhvləri tapsın!', 3000);
    });
    check.addEventListener('click', runCheck);
    return h('section', { class: 'card task-tr', 'aria-labelledby': 'task-tr-h' },
      h('div', { class: 'card-h' },
        h('div', null, h('span', { class: 'eyebrow', text: 'Tərcümə · AZ' }), h('h2', { id: 'task-tr-h', text: 'Sizin variantınız' })),
        wc),
      h('div', { class: 'field' },
        h('label', { class: 'sr-only', for: 'task-ta', text: 'Sizin tərcüməniz' }),
        ta, err,
        h('span', { class: 'hint', id: 'task-ta-hint', text: 'Terminlərə, rəqəmlərə və üsluba diqqət edin. Məclis hər səhvi izah edəcək.' })),
      h('div', { class: 'task-tr-foot' },
        h('div', { class: 'row' }, draft,
          h('span', { class: 'task-keys small muted', 'aria-hidden': 'true' }, h('kbd', { class: 'kbd', text: MOD }), h('kbd', { class: 'kbd', text: 'Enter' }))),
        check));
  }

  function resultSkeleton() {
    return h('div', { class: 'task-res-sk', role: 'status' },
      h('span', { class: 'sr-only', text: 'Məclis yoxlayır…' }),
      h('section', { class: 'card pad-lg' },
        h('div', { class: 'row', style: 'gap:20px;flex-wrap:nowrap' },
          h('span', { class: 'skeleton circle', style: 'width:96px;height:96px;flex:none' }),
          h('span', { class: 'skeleton circle', style: 'width:112px;height:112px;flex:none' }),
          h('div', { class: 'sk-stack grow' }, h('span', { class: 'skeleton title' }), h('span', { class: 'skeleton text' }), h('span', { class: 'skeleton text', style: 'width:70%' })))),
      h('div', { class: 'grid-2' }, h('span', { class: 'skeleton block' }), h('span', { class: 'skeleton block' })));
  }

  function runCheck() {
    if (!T || !T.task || T.checking || T.ta.disabled) return;
    var task = T.task;
    var text = T.ta.value.trim();
    if (words(text) < 2) {
      T.ta.setAttribute('aria-invalid', 'true'); T.err.hidden = false; shake(T.ta); focusSoft(T.ta);
      nz('worried', 'Əvvəlcə tərcüməni yazın — Məclis gözləyir.', 2600);
      return;
    }
    T.checking = true; busy(T.check, true);
    T.resSlot.textContent = '';
    T.resSlot.appendChild(resultSkeleton());
    nz('think', 'Mirzələri çağırıram…', 1600);
    var g = gen, out = null, hints = T.hints;
    App.bigJob('Tərcüməniz yoxlanılır', function () {
      return App.fakeAI('grade', { src: task.src, text: text, model: task.model, register: T.reg || task.reg, domain: task.domain, level: task.level }, 700).then(function (r) {
        if (r && r.ok === false) throw r; /* live engine failed — fakeAI already showed the toast */
        out = evaluate(task, text, r || {}, hints);
        return out.verdict;
      });
    }).then(function () {
      if (g !== gen || !T) return;
      T.checking = false; busy(T.check, false);
      if (out) showResult(out);
    }, function (e) {
      if (g !== gen || !T) return;
      T.checking = false; busy(T.check, false);
      T.resSlot.textContent = '';
      if (!(e && e.ok === false)) App.toast('Məclis toplana bilmədi', 'err', { sub: 'Bir az sonra yenidən cəhd edin' });
    });
  }

  function findTrap(text, tr) {
    for (var i = 0; i < tr.w.length; i++) {
      var hay = tr.cs ? text : lower(text), needle = tr.cs ? tr.w[i] : lower(tr.w[i]);
      var from = 0, idx;
      while ((idx = hay.indexOf(needle, from)) >= 0) {
        var before = idx > 0 ? hay.charAt(idx - 1) : '', after = hay.charAt(idx + needle.length);
        var okB = !before || !/\p{L}/u.test(before), okA = !after || !/\p{L}/u.test(after);
        var atStart = tr.cs && (idx === 0 || /[.!?]\s*$/.test(text.slice(0, idx)));
        if (okB && okA && !atStart) return text.substr(idx, needle.length);
        from = idx + 1;
      }
    }
    return null;
  }

  function penalize(rub, type) {
    var i = 4, d = 4;
    if (type === 'Məna' || type === 'Boş seqment') { i = 0; d = 8; }
    else if (type === 'Termin') { i = 1; d = 5; }
    else if (type === 'Üslub' || type === 'Söz sırası' || type === 'Ardıcıllıq') { i = 2; d = 4; }
    else if (type === 'Türk forması' || type === 'Orfoqrafiya' || type === 'Durğu') { i = 3; d = 3; }
    if (rub[i]) rub[i].score = clamp(rub[i].score - d, 0, rub[i].max);
  }

  function evaluate(task, text, r, hints) {
    var rub = (r.rubric && r.rubric.length ? r.rubric : DEFAULT_RUB).map(function (x) { return { name: x.name, max: x.max, score: x.score }; });
    var errs = [];
    (r.errors || []).forEach(function (e) {
      if (!e) return;
      errs.push({ was: String(e.was == null ? '—' : e.was), now: String(e.now || ''), type: e.type || 'Məna', why: e.why || '', severity: e.severity || SEV[e.type] || 'mid', elder: e.elder || TYPE_ELDER[e.type] || 'Mənaçı Mirzə', ex: e.ex || EX_BY_TYPE[e.type] || '' });
    });
    (task.traps || []).forEach(function (tr) {
      var w = findTrap(text, tr);
      if (!w) return;
      var lw = lower(w);
      var dup = errs.some(function (e) { var le = lower(e.was); return le.length > 2 && (le === lw || le.indexOf(lw) >= 0 || lw.indexOf(le) >= 0); });
      if (dup) return;
      errs.push({ was: w, now: tr.now, type: tr.type, why: tr.why, ex: tr.ex || EX_BY_TYPE[tr.type] || '', severity: tr.sev || SEV[tr.type] || 'mid', elder: TYPE_ELDER[tr.type] || 'Mənaçı Mirzə' });
      penalize(rub, tr.type);
    });
    errs.sort(function (a, b) { return (SEV_ORDER[a.severity] || 1) - (SEV_ORDER[b.severity] || 1); });
    var score = clamp(Math.round(rub.reduce(function (s, x) { return s + x.score; }, 0)), 0, 100);
    var g = gradeOf(score);
    var xp = Math.max(5, Math.round(task.xp * score / 100) + (score >= 91 ? 10 : 0) - (hints || 0) * 2);
    var counts = {};
    errs.forEach(function (e) { counts[e.type] = (counts[e.type] || 0) + 1; });
    var summary;
    if (!errs.length) summary = 'Beş mirzənin heç biri irad tutmadı: terminlər, rəqəmlər və üslub qaydasındadır.';
    else {
      summary = errs.length + ' qeyd: ' + Object.keys(counts).map(function (k) { return counts[k] + ' ' + (TYPE_NOUN[k] || lower(k)); }).join(', ') + '.';
      var top = errs[0];
      if (top.was && top.was !== '—' && top.was !== '…' && top.was.indexOf('«') !== 0) summary += ' Əvvəlcə «' + top.was + '» → «' + top.now + '» düzəlişinə baxın.';
    }
    var seal = score >= 85 ? 'Keçdi' : score >= 70 ? 'Düzəlişlərlə qəbul' : 'Yenidən yazın';
    return { score: score, grade: g, rubric: rub, errors: errs, xp: xp, summary: summary, text: text, task: task, hints: hints || 0,
      verdict: { score: score, text: g.l + ' · ' + g.w + '. ' + summary, seal: seal, grade: g.l + ' · ' + g.w } };
  }

  function showResult(out) {
    var task = out.task;
    var fresh = T.lastChecked !== out.text;
    T.lastChecked = out.text;
    T.result = out; T.fixed = 0; T.cardToast = false;
    if (fresh) {
      pushScore(out.score, task);
      updateSkills(out.rubric);
      logErrors(out.errors);
      if (!out.errors.some(function (e) { return e.type === 'Türk forması'; })) bumpMission('turk', 1);
      /* the home learning path: «Mətni alın», «Tərcümə edin» and «Nuanza yoxlasın» are done now */
      var pth = Number(sget('home:path', 2)); if (isFinite(pth) && pth < 3) sset('home:path', 3);
      if (task.domain === 'Hüquq' && out.score >= 85) bumpWeekly();
      if (task.sim) { var b = bestOf('sim'); if (b == null || out.score > b) setBest('sim', out.score); }
    }
    var res = resultView(out);
    T.resSlot.textContent = '';
    T.resSlot.appendChild(res);
    later(function () { focusSoft(res.querySelector('.task-verdict')); scrollToEl(res); }, 60);
    later(function () {
      var medal = res.querySelector('.task-medal');
      burstAt(medal, out.score >= 81 ? 'stars' : out.score >= 61 ? 'diamonds' : 'ink');
      if (fresh) addXP(out.xp, pointOf(medal));
      else App.toast('Bu variant artıq yoxlanılıb', 'info', { sub: 'XP yalnız yeni variant üçün verilir' });
    }, reduced() ? 120 : 520);
  }

  function resultView(out) {
    var g = out.grade, task = out.task;
    var medal = h('span', { class: 'medal lg pop task-medal' + (g.l === 'E' || g.l === 'F' ? ' nar' : ''), 'aria-hidden': 'true' }, h('b', { text: g.l }));
    var verdict = h('section', { class: 'card pad-lg carpet task-verdict', tabindex: '-1', 'aria-labelledby': 'task-v-h' },
      h('div', { class: 'task-grade' }, medal, h('span', { class: 'task-grade-w', text: g.w })),
      App.ring(out.score, 'bal', null),
      h('div', { class: 'task-vtx' },
        h('span', { class: 'eyebrow', text: 'Mirzə Məclisinin rəyi' }),
        h('h2', { id: 'task-v-h' }, h('span', { class: 'sr-only', text: 'Qiymət ' + g.l + ', ' + g.w + ', ' + out.score + ' bal. ' }), g.head),
        h('p', { class: 'muted', text: out.summary }),
        h('div', { class: 'chips' },
          badge('+' + out.xp + ' XP', 'gold', 'zap'),
          out.errors.length ? badge(out.errors.length + ' qeyd', 'red', 'alert') : badge('Səhvsiz', 'green', 'check'),
          out.hints ? badge(out.hints + ' ipucu', '', 'bulb') : null,
          badge(task.level + ' · ' + task.domain, 'navy'))));

    var skills = h('section', { class: 'card', 'aria-labelledby': 'task-sk-h' },
      h('div', { class: 'card-h' }, h('div', null, h('span', { class: 'eyebrow', text: 'Bacarıqlar' }), h('h2', { id: 'task-sk-h', text: 'Nə yaxşı alındı?' }))),
      h('div', { class: 'task-skills' }, out.rubric.map(function (r) {
        var pct = r.max ? Math.round(r.score / r.max * 100) : 0;
        var cls = pct >= 85 ? ' green' : pct >= 65 ? ' gold' : '';
        return h('div', { class: 'task-skill' },
          h('span', { class: 'task-skill-n', text: r.name }),
          h('span', { class: 'task-skill-v' }, h('b', { text: String(r.score) }), ' / ' + r.max),
          h('div', { class: 'progress' + cls, role: 'progressbar', 'aria-label': r.name, 'aria-valuenow': pct, 'aria-valuemin': 0, 'aria-valuemax': 100 }, h('i', { style: 'width:' + pct + '%' })));
      })));

    var model = h('section', { class: 'card framed task-model', 'aria-labelledby': 'task-m-h' },
      h('div', { class: 'card-h' },
        h('div', null, h('span', { class: 'eyebrow', text: 'Nümunə' }), h('h2', { id: 'task-m-h', text: task.modelLabel || 'Məclisin variantı' })),
        h('div', { class: 'actions' }, h('button', { class: 'icon-btn sm ghost', type: 'button', 'aria-label': 'Variantı kopyala', title: 'Kopyala', html: App.icon('copy'), onclick: function () { copyText(task.model, (task.modelLabel || 'Məclisin variantı') + ' kopyalandı'); } }))),
      h('p', { class: 'task-model-tx', lang: 'az', text: task.model }),
      h('p', { class: 'muted', text: task.modelNote || 'Yeganə düzgün variant deyil — amma terminlər, rəqəmlər və üslub burada qorunub.' }),
      task.credit ? h('p', { class: 'task-credit', text: task.credit }) : null);

    var counter = badge('0 / ' + out.errors.length + ' düzəldilib', 'navy');
    T.counter = counter;
    var errList;
    if (!out.errors.length) {
      var art = h('div', { class: 'empty-art', 'aria-hidden': 'true' });
      errList = h('div', { class: 'empty task-empty' }, art,
        h('h3', { text: 'Səhv tapılmadı' }),
        h('p', { text: 'Beş mirzənin heç biri irad tutmadı. Növbəti səviyyəni sınamağın vaxtıdır!' }),
        h('div', { class: 'actions' }, levelIdx(task.level) < LEVELS.length - 1 ? h('button', { class: 'btn btn-secondary', type: 'button', onclick: function () { setLevel(LEVELS[levelIdx(task.level) + 1].id); fetchTask(null, true); } }, ie('arrow'), LEVELS[levelIdx(task.level) + 1].id + ' səviyyəsini sına') : null));
      later(function () { mountMini(art, 'celebrate'); }, 30);
    } else {
      errList = h('div', { class: 'task-errs' }, out.errors.map(function (e, i) { return errCard(e, i, out); }));
    }
    var errSec = h('section', { class: 'stack', 'aria-labelledby': 'task-errs-h' },
      h('div', { class: 'sec-h' }, h('h2', { id: 'task-errs-h', text: out.errors.length ? 'Səhvlər və izahlar' : 'Səhvlər' }), out.errors.length ? counter : null),
      errList);

    var next = h('div', { class: 'task-next' },
      h('button', { class: 'btn btn-ghost', type: 'button', onclick: function () { scrollToEl(T.ta.closest('.card') || T.ta); later(function () { focusSoft(T.ta); }, reduced() ? 0 : 380); } }, ie('edit'), 'Yenidən yaz'),
      h('button', { class: 'btn btn-secondary', type: 'button', onclick: function () { fetchTask(null, true); scrollToEl(T.getCard); } }, 'Növbəti mətn', ie('arrow')));

    return h('div', { class: 'task-res' }, verdict, h('div', { class: 'grid-2' }, skills, model), errSec, next);
  }

  function sentenceWith(text, frag) {
    var sents = String(text).match(/[^.!?]+[.!?]*/g) || [text];
    for (var i = 0; i < sents.length; i++) if (sents[i].indexOf(frag) >= 0) return sents[i].trim();
    return String(text).trim();
  }
  function isMissing(e) { return !e.was || e.was === '—' || e.was === '…' || e.was.indexOf('«') === 0; }
  function addUserCard(e, task, text, all) {
    if (isMissing(e)) return false;
    var list = userCards();
    var id = 'u-' + task.id + '-' + fold(e.was).replace(/[^a-z0-9]+/g, '').slice(0, 24);
    if (list.some(function (c) { return c.id === id; })) return false;
    var wrong = sentenceWith(text, e.was);
    var right = wrong.replace(e.was, e.now);
    (all || []).forEach(function (x) { if (x !== e && !isMissing(x) && x.was !== e.was && right.indexOf(x.was) >= 0 && right.indexOf(e.now) !== right.indexOf(x.was)) right = right.replace(x.was, x.now); });
    list.unshift({ id: id, tag: TAG_OF[e.type] || e.type, elder: e.elder, src: task.src, wrong: wrong, bad: e.was, right: right, good: e.now, why: e.why, mine: true });
    sset('academy:mycards', list.slice(0, 40));
    try { if (App.refreshNav) App.refreshNav(); } catch (er) { /* ignore */ }
    return true;
  }
  function applyFix(e) {
    if (!T || !T.ta || isMissing(e)) return false;
    var v = T.ta.value, i = v.indexOf(e.was);
    if (i < 0) { var lv = lower(v); i = lv.indexOf(lower(e.was)); if (lv.length !== v.length) i = -1; }
    if (i < 0) return false;
    T.ta.value = v.slice(0, i) + e.now + v.slice(i + e.was.length);
    updateWC(); saveTask(); flash(T.ta);
    return true;
  }

  function errCard(e, i, out) {
    var missing = isMissing(e);
    var fixEl = h('div', { class: 'task-err-fix' },
      h('span', { class: 'sr-only', text: 'Səhv: ' }),
      missing ? h('span', { class: 'task-miss', text: e.was === '…' ? 'Buraxılıb' : e.was === '—' ? 'Tərcümədə yoxdur' : e.was }) : h('s', { class: 'task-was', text: e.was }),
      h('span', { class: 'task-arrow', html: App.icon('arrow'), 'aria-hidden': 'true' }),
      h('span', { class: 'sr-only', text: 'Düzgün: ' }),
      h('b', { class: 'task-now', text: e.now }));
    var whyId = 'task-why-' + i;
    var why = h('div', { class: 'task-why', id: whyId, hidden: true },
      h('p', { text: e.why }),
      e.ex ? h('p', { class: 'task-ex' }, h('span', { class: 'eyebrow plain', text: 'Nümunə' }), h('span', { text: e.ex })) : null);
    var whyBtn = h('button', { class: 'task-why-btn', type: 'button', 'aria-expanded': 'false', 'aria-controls': whyId }, ie('help'), 'Niyə?');
    function toggleWhy(force) {
      var open = force != null ? force : why.hidden;
      why.hidden = !open; whyBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    whyBtn.addEventListener('click', function () { toggleWhy(); });

    var tries = 0;
    var inp = h('input', { class: 'input', type: 'text', lang: 'az', autocomplete: 'off', 'aria-label': 'Düzəlişiniz', placeholder: 'Düzgün forma…' });
    var test = h('button', { class: 'btn btn-secondary btn-sm', type: 'button' }, 'Yoxla');
    var note = h('small', { 'aria-live': 'polite', text: 'Düzgün formanı yazın və «Yoxla» basın.' });
    var selfBox = h('div', { class: 'task-self', hidden: true }, h('div', { class: 'task-self-row' }, inp, test), note);
    var bSelf = h('button', { class: 'btn btn-sm', type: 'button', 'aria-expanded': 'false' }, ie('edit'), 'Özüm düzəldim');
    var bShow = h('button', { class: 'btn btn-secondary btn-sm', type: 'button' }, ie('check'), 'Düzgün variant');
    var state = h('div', { class: 'task-err-state' });
    var card = h('article', { class: 'task-err', 'data-sev': e.severity, style: 'animation-delay:' + Math.min(i, 6) * 60 + 'ms' },
      h('div', { class: 'task-err-top' }, badge(e.type, SEV_BADGE[e.severity] || 'gold'), h('small', { text: (SEV_LABEL[e.severity] || 'Vacib') + ' · ' + e.elder + ' tapdı' })),
      fixEl, whyBtn, why,
      h('div', { class: 'task-err-act' }, bSelf, bShow),
      selfBox, state);

    function norm(s) { return lower(String(s || '').trim()).replace(/[«»"“”.,!?:;]/g, '').replace(/\s+/g, ' '); }
    function check() {
      var v = norm(inp.value), want = norm(e.now);
      var ok = !!v && (v === want || (v.length >= 3 && v.indexOf(want) >= 0) || (want.length > 4 && v.length >= want.length * 0.75 && want.indexOf(v) >= 0));
      if (ok) { resolve('self'); return; }
      tries++;
      inp.setAttribute('aria-invalid', 'true'); shake(inp);
      if (tries === 1) { note.textContent = 'Hələ yox — «Niyə?» izahına baxın.'; toggleWhy(true); nz('think', null, 1200); }
      else note.textContent = 'İpucu: «' + e.now.slice(0, Math.max(2, Math.ceil(e.now.length / 2))) + '…». Və ya «Düzgün variant»ı açın.';
    }
    function resolve(how) {
      if (card.classList.contains('done')) return;
      card.classList.add('done');
      selfBox.hidden = true;
      state.textContent = '';
      if (how === 'self') {
        applyFix(e);
        state.appendChild(badge('Özünüz düzəltdiniz · +5 XP', 'green', 'check'));
        addXP(5, pointOf(fixEl));
        burstAt(fixEl, 'stars');
        nz('success', pick(['Əla! Məhz belə.', 'Düz tapdınız!', e.elder + ' razıdır!']), 2000);
      } else {
        var applied = applyFix(e);
        var added = addUserCard(e, out.task, out.text, out.errors);
        state.appendChild(badge(applied ? 'Düzəliş mətnə tətbiq olundu' : 'Düzgün variant göstərildi', 'navy', 'check'));
        if (added) { state.appendChild(D.createTextNode(' ')); state.appendChild(badge('Kartlara əlavə olundu', 'gold', 'cards')); }
        toggleWhy(true);
        if (added && !T.cardToast) {
          T.cardToast = true;
          App.toast('Səhv kartlarına əlavə olundu', 'ok', { sub: '«' + e.was + '» → «' + e.now + '» — təkrarda qarşınıza çıxacaq', action: { label: 'Bax', onClick: function () { App.go('cards'); } } });
        }
      }
      card.setAttribute('tabindex', '-1');
      focusSoft(card);
      T.fixed = (T.fixed || 0) + 1;
      if (T.counter) T.counter.textContent = T.fixed + ' / ' + out.errors.length + ' düzəldilib';
      if (T.fixed >= out.errors.length) {
        later(function () {
          if (T && T.counter) burstAt(T.counter, 'confetti');
          nz('celebrate', 'Bütün səhvlər düzəldi! Yenidən yoxlatsanız, bal artacaq.', 3400);
          App.toast('Bütün səhvlər düzəldildi', 'ok', { sub: 'Mətni Məclisə yenidən göndərin', action: { label: 'Yoxlat', onClick: function () { scrollToEl(T.ta.closest('.card') || T.ta); } } });
        }, 450);
      }
    }
    bSelf.addEventListener('click', function () {
      var open = selfBox.hidden;
      selfBox.hidden = !open; bSelf.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) { inp.value = missing ? '' : e.was; focusSoft(inp); try { inp.select(); } catch (er) { /* ignore */ } }
    });
    test.addEventListener('click', check);
    inp.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); check(); } });
    inp.addEventListener('input', function () { inp.removeAttribute('aria-invalid'); });
    bShow.addEventListener('click', function () { resolve('show'); });
    return card;
  }

  /* ------------------------------------------------------------------
     6. PRACTICE SCREEN
     ------------------------------------------------------------------ */
  var P = null;

  function renderPractice(page, params) {
    P = { page: page };
    page.appendChild(h('div', { class: 'page-h' },
      h('div', null,
        h('span', { class: 'eyebrow', text: 'Akademiya · Məşq' }),
        h('h1', { html: 'Məşq <em>meydanı</em>' }),
        h('p', { text: (NUM_WORD[GAMES.length] || GAMES.length) + ' oyun — hər biri bir bacarığı itiləyir. Ən yaxşı nəticələriniz yadda qalır.' })),
      h('div', { class: 'actions' },
        h('button', { class: 'btn', type: 'button', onclick: function () { openGame(pick(GAMES)); } }, ie('refresh'), 'Təsadüfi oyun'))));
    P.grid = h('div', { class: 'practice-grid' });
    buildGrid();
    page.appendChild(h('section', { class: 'stack', 'aria-labelledby': 'practice-games-h' },
      h('div', { class: 'sec-h' }, h('h2', { id: 'practice-games-h', text: 'Oyunlar' }), h('span', { class: 'small muted', text: GAMES.length + ' oyun · hər biri bir bacarıq' })),
      P.grid));
    P.det = detSection();
    page.appendChild(P.det);
    if (params.game && gameById(params.game)) later(function () { openGame(gameById(params.game)); }, 420);
  }

  function buildGrid() {
    if (!P || !P.grid) return;
    P.grid.textContent = '';
    GAMES.forEach(function (g) { P.grid.appendChild(gameCard(g)); });
  }

  function gameCard(g) {
    var best = bestOf(g.id);
    var diff = h('span', { class: 'practice-diff', 'aria-label': 'Çətinlik: ' + DIFF[g.diff] },
      [1, 2, 3].map(function (n) { return h('i', { class: n <= g.diff ? 'on' : '', 'aria-hidden': 'true' }); }),
      h('span', { 'aria-hidden': 'true', text: DIFF[g.diff] }));
    var bestEl = h('span', { class: 'practice-best' }, ie('trophy'),
      best == null ? h('span', { text: 'Rekord yoxdur' }) : h('span', null, h('b', { text: String(best) }), ' ' + (g.id === 'speed' ? 'termin' : 'bal')));
    var b = h('button', { class: 'card practice-game' + (g.feat ? ' feat' : ''), type: 'button', 'aria-label': g.name + '. ' + g.desc + ' Çətinlik: ' + DIFF[g.diff] + '. ' + (best == null ? 'Rekord yoxdur.' : 'Rekord: ' + fmtBest(g.id, best) + '.') },
      h('div', { class: 'practice-game-top' }, icTile(g.icon, g.cls), g.feat ? badge('Oynayın', 'practice-fir', 'play') : badge(g.skill, '')),
      h('div', null, h('h3', { text: g.name }), h('p', { text: g.desc })),
      h('div', { class: 'practice-game-foot' }, diff, bestEl));
    b.addEventListener('click', function () { openGame(g); });
    return b;
  }

  function openGame(g) {
    if (!g) return;
    if (g.id === 'detective') {
      if (!P || !P.det) return;
      scrollToEl(P.det);
      later(function () { var w = P && P.det ? P.det.querySelector('.practice-w') : null; focusSoft(w); }, reduced() ? 0 : 450);
      nz('point', 'Şübhəli sözlərə toxunun, sonra «Yoxla».', 2600);
      return;
    }
    if (g.id === 'realhunt') { playHunt(g); return; }
    if (g.id === 'oral') { playOral(g); return; }
    if (g.id === 'sim') { simBrief(g); return; }
    playQuiz(g);
  }

  function detSection() {
    var sec = h('section', { class: 'card pad-lg practice-det', id: 'practice-det', 'aria-labelledby': 'practice-det-h' });
    var di = (Number(sget('academy:det', 0)) || 0) % DET.length;
    function next() { di = (di + 1) % DET.length; sset('academy:det', di); build(); later(function () { var w = sec.querySelector('.practice-w'); focusSoft(w); }, 60); }
    function build() {
      var d = DET[di], checked = false, toks = [];
      sec.textContent = '';
      var count = h('span', { class: 'small muted tnum', 'aria-live': 'polite', text: 'Seçilib: 0' });
      var text = h('p', { class: 'practice-det-text', lang: 'az' });
      var re = /[\p{L}\p{N}]+(?:[.,'’-][\p{L}\p{N}]+)*%?/gu, last = 0, m, used = {};
      while ((m = re.exec(d.tgt))) {
        if (m.index > last) text.appendChild(D.createTextNode(d.tgt.slice(last, m.index)));
        var w = m[0], errIdx = -1;
        for (var k = 0; k < d.errors.length; k++) if (!used[k] && d.errors[k].w === w) { errIdx = k; used[k] = 1; break; }
        var b = h('button', { class: 'practice-w', type: 'button', 'aria-pressed': 'false', text: w });
        b._err = errIdx;
        b.addEventListener('click', onTap);
        toks.push(b);
        text.appendChild(b);
        last = re.lastIndex;
      }
      if (last < d.tgt.length) text.appendChild(D.createTextNode(d.tgt.slice(last)));
      function selected() { return toks.filter(function (t) { return t.getAttribute('aria-pressed') === 'true'; }); }
      function onTap(ev) {
        if (checked) return;
        var t = ev.currentTarget, on = t.getAttribute('aria-pressed') !== 'true';
        t.setAttribute('aria-pressed', on ? 'true' : 'false');
        count.textContent = 'Seçilib: ' + selected().length;
      }
      var clearBtn = h('button', { class: 'btn btn-ghost btn-sm', type: 'button' }, 'Təmizlə');
      var checkBtn = h('button', { class: 'btn btn-primary', type: 'button' }, ie('search'), 'Yoxla');
      var res = h('div', { class: 'practice-det-res', hidden: true, 'aria-live': 'polite' });
      clearBtn.addEventListener('click', function () {
        if (checked) return;
        toks.forEach(function (t) { t.setAttribute('aria-pressed', 'false'); });
        count.textContent = 'Seçilib: 0';
      });
      checkBtn.addEventListener('click', function () {
        if (checked) return;
        if (!selected().length) { shake(text); App.toast('Əvvəlcə şübhəli sözləri seçin', 'warn', { sub: 'Səhv olduğunu düşündüyünüz sözə toxunun' }); return; }
        checked = true;
        var hits = 0, misses = 0, falses = 0, total = d.errors.length;
        toks.forEach(function (t) {
          var on = t.getAttribute('aria-pressed') === 'true';
          t.removeAttribute('aria-pressed');
          t.setAttribute('aria-disabled', 'true');
          if (t._err >= 0) {
            var e = d.errors[t._err];
            if (on) { hits++; t.classList.add('hit'); } else { misses++; t.classList.add('miss'); }
            t.setAttribute('aria-label', t.textContent + ' — ' + (on ? 'tapdınız' : 'buraxdınız') + '. Düzgün: ' + e.now);
            t.insertAdjacentElement('afterend', h('ins', { class: 'practice-fix', text: e.now }));
          } else if (on) {
            falses++; t.classList.add('false');
            t.setAttribute('aria-label', t.textContent + ' — bu söz düzgün idi');
          }
        });
        var score = Math.round(clamp(hits / total * 100 - falses * 10, 0, 100));
        var prev = bestOf('detective'), rec = prev == null || score > prev;
        if (rec && score > 0) setBest('detective', score);
        checkBtn.disabled = true; clearBtn.disabled = true;
        var ring = App.ring(score, 'bal', null, { size: 'sm' });
        res.hidden = false;
        res.appendChild(h('div', { class: 'practice-det-sum' }, ring,
          h('div', { class: 'stats' },
            h('div', { class: 'stat' }, h('b', { text: hits + '/' + total }), h('span', { text: 'tapıldı' })),
            h('div', { class: 'stat' }, h('b', { text: String(misses) }), h('span', { text: 'buraxıldı' })),
            h('div', { class: 'stat' }, h('b', { text: String(falses) }), h('span', { text: 'yanlış həyəcan' }))),
          rec && score > 0 ? badge('Yeni rekord!', 'gold', 'trophy') : null));
        res.appendChild(h('div', { class: 'practice-det-list' }, d.errors.map(function (e) {
          return h('div', { class: 'practice-det-li' }, badge(e.type, SEV_BADGE[SEV[e.type]] || 'gold'), h('s', { text: e.w }), h('span', { class: 'task-arrow', html: App.icon('arrow'), 'aria-hidden': 'true' }), h('b', { class: 'task-now', text: e.now }), h('span', { class: 'muted', text: '— ' + e.why }));
        })));
        res.appendChild(h('div', { class: 'row', style: 'justify-content:flex-end' },
          h('button', { class: 'btn btn-ghost', type: 'button', onclick: build }, ie('refresh'), 'Yenidən'),
          h('button', { class: 'btn btn-secondary', type: 'button', onclick: next }, 'Növbəti mətn', ie('arrow'))));
        refreshGrid();
        var xp = hits * 4 + (score === 100 ? 10 : 0);
        later(function () {
          if (xp) addXP(xp, pointOf(ring));
          if (score >= 80) { burstAt(ring, 'confetti'); nz('celebrate', 'Əsl detektivsiniz! ' + hits + ' səhvin hamısını tutdunuz.', 3000); }
          else if (score >= 50) nz('success', hits + ' səhv tapdınız. Buraxılanlara baxın — kartlara düşəcək.', 3000);
          else nz('worried', 'Bir neçəsi gözdən qaçdı — Məclis göstərdi. Yenə cəhd edək?', 3000);
        }, 300);
      });
      sec.appendChild(h('div', { class: 'card-h' },
        h('div', null, h('span', { class: 'eyebrow', text: 'Detektiv · sınaq raundu' }), h('h2', { id: 'practice-det-h', text: 'Səhvləri tapın' })),
        h('div', { class: 'actions' }, badge('Mətn ' + (di + 1) + ' / ' + DET.length, 'navy'),
          h('button', { class: 'icon-btn sm ghost', type: 'button', 'aria-label': 'Başqa mətn', title: 'Başqa mətn', html: App.icon('refresh'), onclick: next }))));
      sec.appendChild(h('p', { class: 'muted', html: 'Tərcümədə <b>' + d.errors.length + ' səhv</b> gizlənib. Şübhəli sözlərə toxunun, sonra «Yoxla».' }));
      sec.appendChild(h('div', { class: 'practice-det-src' }, h('span', { class: 'eyebrow plain', text: 'Mənbə · EN' }), h('b', { text: d.title }), h('p', { lang: 'en', text: d.src })));
      sec.appendChild(text);
      sec.appendChild(h('div', { class: 'practice-det-bar' }, count, h('div', { class: 'row' }, clearBtn, checkBtn)));
      sec.appendChild(res);
    }
    build();
    return sec;
  }

  function refreshGrid() { if (P && P.grid && P.grid.isConnected) buildGrid(); }

  function playQuiz(g) {
    var bank = QUIZ[g.id] || [];
    if (!bank.length) return;
    var qs = g.id === 'speed'
      ? shuffle(bank.slice()).map(function (q) { var opts = shuffle(q.options.slice()); return { term: q.term, options: opts, answer: opts.indexOf(q.options[0]) }; })
      : bank.slice();
    var i = 0, right = 0, ai = 0, over = false, tick = null, left = 60;
    var body = h('div', { class: 'practice-q' });
    var s = App.sheet({ title: g.name, body: body, wide: true, onClose: function () { over = true; clearInterval(tick); } });
    var timerEl = null, timerBar = null, timerTx = null;
    if (g.id === 'speed') {
      timerBar = h('i', { style: 'width:100%' });
      timerTx = h('b', { class: 'tnum', text: '60 san' });
      timerEl = h('div', { class: 'practice-timer', role: 'timer', 'aria-label': 'Qalan vaxt' }, ie('clock'), h('div', { class: 'progress thin' }, timerBar), timerTx);
      tick = setInterval(function () {
        if (over) { clearInterval(tick); return; }
        left--;
        timerTx.textContent = Math.max(0, left) + ' san';
        timerBar.style.width = (Math.max(0, left) / 60 * 100) + '%';
        timerEl.classList.toggle('low', left <= 10);
        if (left <= 0) finish(true);
      }, 1000);
    }
    function render() {
      if (over) return;
      var q = qs[i];
      body.textContent = '';
      var pct = Math.round(i / qs.length * 100);
      body.appendChild(h('div', { class: 'practice-q-top' },
        h('span', { class: 'small muted tnum', text: (i + 1) + ' / ' + qs.length }),
        h('div', { class: 'progress thin', role: 'progressbar', 'aria-label': 'Gediş', 'aria-valuenow': pct, 'aria-valuemin': 0, 'aria-valuemax': 100 }, h('i', { style: 'width:' + pct + '%' })),
        g.id === 'vs' ? badge('Siz ' + right + ' : ' + ai + ' AI', 'navy') : badge(right + ' düz', 'green')));
      if (timerEl) body.appendChild(timerEl);
      if (q.sit) body.appendChild(h('div', { class: 'practice-q-sit' }, ie('message'), h('span', null, h('small', { text: 'Situasiya' }), h('b', { text: q.sit }))));
      if (q.src) body.appendChild(h('div', { class: 'practice-q-src' }, h('span', { class: 'eyebrow plain', text: 'Mənbə · EN' }), h('p', { lang: 'en', text: q.src })));
      if (q.sent) body.appendChild(h('p', { class: 'practice-q-sent', lang: 'az' }, q.sent[0], h('mark', { class: 'practice-q-mark', text: q.sent[1] }), q.sent[2]));
      if (q.term) body.appendChild(h('p', { class: 'practice-q-term', lang: 'en', text: q.term }));
      body.appendChild(h('p', { class: 'practice-q-ask', text: q.q || ASK[g.id] }));
      var fb = h('div', { class: 'practice-q-fb', 'aria-live': 'polite' });
      var wrap = h('div', { class: 'practice-opts', role: 'group', 'aria-label': 'Variantlar' });
      var btns = q.options.map(function (o, k) {
        var b = h('button', { class: 'choice practice-opt', type: 'button' },
          h('span', { class: 'practice-opt-k', 'aria-hidden': 'true', text: 'ABCD'.charAt(k) }),
          h('span', null, h('b', { lang: 'az', text: o })));
        b.addEventListener('click', function () { choose(k, btns, fb, wrap); });
        wrap.appendChild(b);
        return b;
      });
      body.appendChild(wrap);
      body.appendChild(fb);
      try { s.body.scrollTop = 0; } catch (e) { /* ignore */ }
      focusSoft(btns[0]);
    }
    function choose(k, btns, fb, wrap) {
      if (over || wrap.classList.contains('locked')) return;
      wrap.classList.add('locked');
      var q = qs[i], ok = k === q.answer;
      btns.forEach(function (b, j) {
        b.setAttribute('aria-disabled', 'true');
        if (j === q.answer) b.classList.add('right');
        else if (j === k) b.classList.add('wrong');
        else b.classList.add('dim');
      });
      if (ok) right++; else if (g.id === 'vs') ai++;
      if (g.id === 'speed') {
        setTimeout(function () { if (over) return; i++; if (i >= qs.length) finish(false); else render(); }, ok ? 320 : 700);
        return;
      }
      var msg = ok ? pick(OK_MSG) : 'Düzgün cavab: ' + 'ABCD'.charAt(q.answer) + '.';
      var extra = g.id === 'vs' ? ' Variant ' + 'AB'.charAt(q.ai) + ' — AI-nin variantı idi.' : '';
      fb.appendChild(h('div', { class: 'callout ' + (ok ? 'green' : 'red') }, ie(ok ? 'check' : 'info'), h('div', null, h('b', { text: msg + ' ' }), q.explain + extra)));
      var last = i >= qs.length - 1;
      var nextBtn = h('button', { class: 'btn btn-primary', type: 'button' }, last ? 'Nəticəyə bax' : 'Növbəti', ie('arrow'));
      nextBtn.addEventListener('click', function () { i++; if (i >= qs.length) finish(false); else render(); });
      fb.appendChild(h('div', { class: 'row', style: 'justify-content:flex-end' }, nextBtn));
      focusSoft(nextBtn);
      try { fb.scrollIntoView({ block: 'nearest', behavior: reduced() ? 'auto' : 'smooth' }); } catch (e) { /* ignore */ }
      if (ok && right % 2 === 0) nz('success', null, 1200);
    }
    function finish(timeUp) {
      if (over) return;
      over = true; clearInterval(tick);
      var score = g.id === 'speed' ? right : Math.round(right / qs.length * 100);
      var prev = bestOf(g.id), rec = score > 0 && (prev == null || score > prev);
      if (rec) setBest(g.id, score);
      var xp = right * (g.id === 'speed' ? 3 : 5);
      body.textContent = '';
      var head = g.id === 'speed' ? h('span', { class: 'medal lg pop', 'aria-hidden': 'true' }, h('b', { text: String(right) })) : App.ring(score, 'bal', null);
      var title, sub;
      if (g.id === 'vs') { title = right > ai ? 'Siz qalib gəldiniz!' : right === ai ? 'Bərabərlik!' : 'Bu dəfə AI qalib gəldi'; sub = 'Hesab ' + right + ' : ' + ai + '. Hər raundda daha təbii variantı seçmək — redaktorun əsas bacarığıdır.'; }
      else if (g.id === 'speed') { title = (timeUp ? 'Vaxt bitdi! ' : 'Hamısı cavablandı! ') + right + ' termin'; sub = right + ' düz cavab, ' + (i - right) + ' səhv. Lüğətçi Mirzə yanlış cavabları kartlarınıza yazdı.'; }
      else { title = score >= 80 ? 'Əla nəticə!' : score >= 50 ? 'Yaxşıdır — bir az da!' : 'Bir də cəhd edək'; sub = qs.length + ' sualdan ' + right + ' düz cavab. ' + (g.id === 'context' ? 'Üslub hissi məşqlə gəlir.' : 'Ədəbi norma — tərcüməçinin imzasıdır.'); }
      body.appendChild(h('div', { class: 'practice-end' }, head,
        h('h3', { text: title }), h('p', { text: sub }),
        rec ? badge('Yeni rekord!', 'gold', 'trophy') : (prev != null ? badge('Rekord: ' + fmtBest(g.id, prev), '') : null)));
      s.setActions([
        { label: 'Bağla', kind: 'ghost' },
        { label: 'Yenidən oyna', kind: 'primary', icon: 'refresh', onClick: function () { setTimeout(function () { playQuiz(g); }, 380); } }
      ]);
      refreshGrid();
      setTimeout(function () {
        if (xp) addXP(xp, pointOf(head));
        if (rec) burstAt(head, 'confetti');
        var great = g.id === 'speed' ? right >= 8 : score >= 80;
        nz(great ? 'celebrate' : 'success', great ? 'Möhtəşəm! ' + title : 'Yaxşı məşq idi — sabah daha yaxşı olacaq.', 2600);
      }, 420);
    }
    render();
  }

  function mkWave() {
    var w = h('div', { class: 'practice-wave', 'aria-hidden': 'true' });
    for (var k = 0; k < 28; k++) w.appendChild(h('i', { style: '--i:' + k + ';--h:' + Math.round(30 + Math.abs(Math.sin(k * 1.7)) * 62) + '%' }));
    return w;
  }

  function playOral(g) {
    var over = false, timers = [], ivs = [];
    function t(fn, ms) { timers.push(setTimeout(function () { if (!over) fn(); }, ms)); }
    var body = h('div', { class: 'practice-oral' });
    var s = App.sheet({ title: 'Şifahi · ardıcıl tərcümə', body: body, wide: true, onClose: function () { over = true; timers.forEach(clearTimeout); ivs.forEach(clearInterval); } });
    function step1() {
      body.textContent = '';
      var wave = mkWave();
      var play = h('button', { class: 'practice-mic lac', type: 'button', 'aria-label': 'Dinlə' }, ie('play'));
      var tx = h('p', { class: 'practice-oral-tx muted', text: 'Natiqin sözlərini dinləyin. Mətn yalnız dinlədikdən sonra görünəcək.' });
      var slot = h('div');
      body.appendChild(h('span', { class: 'eyebrow', text: 'Addım 1 / 2 · Dinləyin' }));
      body.appendChild(wave); body.appendChild(play); body.appendChild(tx); body.appendChild(slot);
      focusSoft(play);
      play.addEventListener('click', function () {
        if (play.disabled) return;
        play.disabled = true; wave.classList.add('on');
        nz('read', null, 2200);
        t(function () {
          wave.classList.remove('on');
          tx.classList.remove('muted'); tx.setAttribute('lang', 'en');
          tx.textContent = '«Welcome to Baku! The conference starts at nine sharp, in Hall B.»';
          var go = h('button', { class: 'btn btn-primary', type: 'button' }, ie('mic'), 'Tərcüməni söylə');
          go.addEventListener('click', step2);
          slot.appendChild(go); focusSoft(go);
        }, reduced() ? 300 : 2400);
      });
    }
    function step2() {
      body.textContent = '';
      var wave = mkWave(); wave.classList.add('on', 'rec');
      var clock = h('b', { class: 'tnum', text: '0:00' });
      var stopBtn = h('button', { class: 'practice-mic rec', type: 'button', 'aria-label': 'Dayandır' }, ie('pause'));
      body.appendChild(h('span', { class: 'eyebrow', text: 'Addım 2 / 2 · Danışın' }));
      body.appendChild(h('p', { class: 'muted', text: 'Nuanza dinləyir… Prototipdə mikrofon işə salınmır — nəticə nümunədir.' }));
      body.appendChild(wave); body.appendChild(stopBtn); body.appendChild(clock);
      focusSoft(stopBtn);
      var sec = 0, stopped = false;
      var iv = setInterval(function () { sec++; clock.textContent = '0:' + (sec < 10 ? '0' : '') + sec; }, 1000);
      ivs.push(iv);
      function stop() {
        if (stopped || over) return; stopped = true; clearInterval(iv);
        body.textContent = '';
        body.appendChild(h('span', { class: 'eyebrow', text: 'Mirzələr qiymətləndirir' }));
        body.appendChild(h('div', { class: 'sk-stack', style: 'width:100%;max-width:420px', role: 'status' }, h('span', { class: 'skeleton title' }), h('span', { class: 'skeleton text' }), h('span', { class: 'skeleton text', style: 'width:76%' })));
        nz('think', null, 1200);
        t(result, 1100);
      }
      stopBtn.addEventListener('click', stop);
      t(stop, reduced() ? 700 : 3600);
    }
    function result() {
      body.textContent = '';
      var score = 88;
      var prev = bestOf('oral'), rec = prev == null || score > prev;
      if (rec) setBest('oral', score);
      var ring = App.ring(score, 'bal', null);
      body.appendChild(ring);
      body.appendChild(h('h3', { text: 'Axıcı və dəqiq!' }));
      body.appendChild(h('div', { class: 'practice-q-src', style: 'text-align:left;width:100%' }, h('span', { class: 'eyebrow plain', text: 'Tanınan tərcümə' }), h('p', { lang: 'az', text: '«Bakıya xoş gəlmisiniz! Konfrans saat doqquzda, B zalında başlayır.»' })));
      body.appendChild(h('div', { class: 'practice-fb-list' },
        h('div', { class: 'callout green' }, ie('check'), h('div', null, h('b', { text: 'Salamlama: ' }), 'təbii səslənir, intonasiya yerindədir.')),
        h('div', { class: 'callout' }, ie('bulb'), h('div', null, h('b', { text: '«nine sharp»: ' }), '«düz saat doqquzda» daha dəqiq olardı — dəqiqlik vurğusu itdi.')),
        h('div', { class: 'callout green' }, ie('check'), h('div', null, h('b', { text: 'Ad və rəqəm: ' }), '«Hall B» — «B zalı», vaxt düzgün ötürülüb.'))));
      if (rec) body.appendChild(badge('Yeni rekord!', 'gold', 'trophy'));
      s.setActions([{ label: 'Bağla', kind: 'ghost' }, { label: 'Yenidən', kind: 'primary', icon: 'refresh', onClick: function () { setTimeout(function () { playOral(g); }, 380); } }]);
      refreshGrid();
      setTimeout(function () { addXP(15, pointOf(ring)); if (rec) burstAt(ring, 'stars'); nz('success', 'Gözəl şifahi tərcümə! «nine sharp»ı yadda saxlayaq.', 2800); }, 400);
    }
    step1();
  }

  function simBrief() {
    var task = taskById('sim-ada'), s = task.sim;
    var body = h('div', { class: 'stack' },
      h('div', { class: 'row', style: 'gap:12px;flex-wrap:nowrap' }, icTile('cap', 'green'),
        h('div', { class: 'stack-sm' }, h('b', { text: task.client }), h('small', { class: 'muted', text: s.contact }))),
      h('div', { class: 'callout navy' }, ie('message'), h('div', null, '«Salam! Tələbə bələdçisinin 3-cü fəslini tərcümə etdirmək istəyirik. Əvvəlcə kiçik sınaq parçası göndəririk: üslub rəsmi-neytral olsun, lüğətimizə əməl edin.»')),
      h('dl', { class: 'kv' },
        h('dt', { text: 'Son tarix' }), h('dd', { text: s.deadline }),
        h('dt', { text: 'Həcm' }), h('dd', { text: s.volume })),
      h('div', { class: 'stack-sm' }, h('span', { class: 'eyebrow', text: 'Müştərinin tələbləri' }),
        h('ul', { class: 'practice-req' }, s.req.map(function (r) { return h('li', { text: r }); }))));
    App.sheet({
      title: 'Simulyator: yeni sifariş', body: body,
      actions: [
        { label: 'İmtina et', kind: 'ghost', onClick: function () { App.toast('Sifarişdən imtina edildi', 'info', { sub: 'Simulyator istənilən vaxt açıqdır' }); } },
        { label: 'Sifarişi qəbul et', kind: 'primary', icon: 'check', onClick: function () { setTimeout(function () { App.go('task', { id: 'sim-ada' }); }, 220); } }
      ]
    });
  }

  /* ------------------------------------------------------------------
     7. CARDS SCREEN (spaced repetition)
     ------------------------------------------------------------------ */
  var C = null;

  function renderCards(page, params) {
    C = { page: page, tag: params.tag || null };
    page.appendChild(h('div', { class: 'page-h' },
      h('div', null,
        h('span', { class: 'eyebrow', text: 'Akademiya · Səhv kartları' }),
        h('h1', { html: 'Səhv <em>kartları</em>' }),
        h('p', { text: 'Tapşırıqlarda buraxdığınız səhvlər kart olur. «Bildim» — kart seyrəkləşir, «Çətin oldu» — tez-tez qayıdır.' }))));
    if (!deck().length) { renderNoCards(page); return; }
    C.chips = h('div', { class: 'chips cards-chips', role: 'group', 'aria-label': 'Mövzu üzrə süzgəc' });
    page.appendChild(C.chips);
    paintChips();
    C.wrap = h('div', { class: 'cards-wrap' });
    page.appendChild(C.wrap);
    C.boxes = boxesCard();
    page.appendChild(C.boxes);
    startSession(false);
    listen(D, 'keydown', onCardsKey);
  }

  /* a new user has no mistakes yet — so no cards, just one clear next step */
  function renderNoCards(page) {
    C.ended = true;
    var art = h('div', { class: 'empty-art', 'aria-hidden': 'true' });
    page.appendChild(h('div', { class: 'empty cards-empty' }, art,
      h('h3', { text: 'Hələ səhv kartı yoxdur' }),
      h('p', { text: 'Tapşırıqda tərcüməniz yoxlananda səhvin düzgün variantına baxın — o, buraya kart kimi düşəcək və vaxtaşırı təkrarlanacaq.' }),
      h('div', { class: 'actions' },
        h('button', { class: 'btn btn-primary', type: 'button', onclick: function () { App.go('task'); } }, ie('edit'), 'Tapşırıq götür'))));
    later(function () { mountMini(art, 'idle'); }, 30);
  }

  function paintChips() {
    var tags = [];
    deck().forEach(function (c) { if (tags.indexOf(c.tag) < 0) tags.push(c.tag); });
    if (C.tag && tags.indexOf(C.tag) < 0) C.tag = null;
    C.chips.textContent = '';
    C.chips.hidden = tags.length < 2;
    [null].concat(tags).forEach(function (tg) {
      var b = h('button', { class: 'chip', type: 'button', 'aria-pressed': C.tag === tg ? 'true' : 'false', text: tg || 'Hamısı' });
      b.addEventListener('click', function () { if (C.tag === tg) return; C.tag = tg; paintChips(); startSession(false); });
      C.chips.appendChild(b);
    });
  }

  function startSession(all) {
    var s = srsAll(), now = Date.now();
    var cards = deck().filter(function (c) { return !C.tag || c.tag === C.tag; });
    var due = all ? cards.slice() : cards.filter(function (c) { return !s[c.id] || s[c.id].due <= now; });
    due.sort(function (a, b) { var ra = s[a.id] || { box: 1, due: 0 }, rb = s[b.id] || { box: 1, due: 0 }; return ra.box - rb.box || ra.due - rb.due; });
    C.queue = due.slice(0, 10);
    C.uniq = C.queue.length; C.done = 0; C.known = 0; C.hard = 0; C.again = {}; C.flipped = false; C.ended = false;
    if (!C.queue.length) renderCardsEmpty(cards);
    else renderCard(true);
  }

  function boxPips(box) {
    return h('span', { class: 'cards-box', title: 'Qutu ' + box + ' / 5' },
      h('span', { class: 'cards-pips', 'aria-hidden': 'true' }, [1, 2, 3, 4, 5].map(function (n) { return h('i', { class: n <= box ? 'on' : '' }); })),
      'Qutu ' + box);
  }
  function markPart(sentence, part, cls, tag) {
    var i = part ? sentence.indexOf(part) : -1;
    if (i < 0) return [sentence];
    return [sentence.slice(0, i), h(tag, { class: cls, text: part }), sentence.slice(i + part.length)];
  }
  function dueLabel(box) {
    var d = INTERVAL[clamp(box, 1, 5)];
    return d === 0 ? 'bu gün' : d === 1 ? 'sabah' : d + ' gün sonra';
  }

  function renderCard(first) {
    var c = C.queue[0];
    var s = srsAll(), rec = s[c.id] || { box: 1 };
    C.flipped = false;
    C.wrap.textContent = '';
    var total = C.done + C.queue.length;
    var pct = total ? Math.round(C.done / total * 100) : 0;
    C.wrap.appendChild(h('div', { class: 'cards-top' },
      h('div', { class: 'cards-count' },
        h('span', null, h('b', { class: 'tnum', text: String(C.done) }), ' / ' + total + ' kart'),
        h('span', { class: 'row' }, badge('Bildim ' + C.known, 'green', 'check'), badge('Çətin ' + C.hard, 'red', 'refresh'))),
      h('div', { class: 'progress', role: 'progressbar', 'aria-label': 'Təkrar gedişi', 'aria-valuenow': pct, 'aria-valuemin': 0, 'aria-valuemax': 100 }, h('i', { style: 'width:' + pct + '%' }))));

    var front = h('div', { class: 'cards-face front' },
      h('div', { class: 'cards-face-top' }, badge(c.tag, TAG_BADGE[c.tag] || ''), boxPips(rec.box || 1)),
      h('div', { class: 'cards-blk' }, h('span', { class: 'cards-lbl', text: 'Mənbə · EN' }), h('p', { class: 'cards-src', lang: 'en', text: c.src })),
      h('div', { class: 'cards-blk' }, h('span', { class: 'cards-lbl', text: c.mine ? 'Sizin tapşırıqdakı variant' : 'Əvvəlki variantınız' }),
        h('p', { class: 'cards-sent', lang: 'az' }, markPart(c.wrong, c.bad, 'cards-bad', 's'))),
      h('div', { class: 'cards-hint' }, ie('refresh'), 'Düzgün variantı xatırlayın və kartı çevirin'));
    var back = h('div', { class: 'cards-face back', 'aria-hidden': 'true' },
      h('div', { class: 'cards-face-top' }, badge('Düzgün variant', 'green', 'check'), h('span', { class: 'small muted', text: c.elder })),
      h('div', { class: 'cards-blk' }, h('span', { class: 'cards-lbl', text: 'Belə olmalıdır' }),
        h('p', { class: 'cards-sent', lang: 'az' }, markPart(c.right, c.good, 'cards-good', 'mark'))),
      h('div', { class: 'callout navy cards-why' }, ie('bulb'), h('div', null, h('b', { text: 'Niyə? ' }), c.why)),
      h('div', { class: 'cards-hint' }, ie('clock'), 'Bildim → ' + dueLabel(Math.min(5, (rec.box || 1) + 1)) + ' · Çətin oldu → bu sessiyada yenə'));
    var card = h('button', { class: 'cards-card' + (first ? '' : ' in'), type: 'button', 'aria-label': 'Kart: ' + c.wrong + '. Çevirmək üçün basın' },
      h('div', { class: 'cards-inner' }, front, back));
    var stage = h('div', { class: 'cards-stage' + (C.queue.length <= 1 ? ' single' : C.queue.length === 2 ? ' two' : '') }, card);
    C.wrap.appendChild(stage);

    var flipBtn = h('button', { class: 'btn btn-secondary btn-block cards-flip', type: 'button' }, ie('refresh'), 'Kartı çevir');
    var hardBtn = h('button', { class: 'btn btn-danger', type: 'button' }, ie('refresh'), 'Çətin oldu');
    var knewBtn = h('button', { class: 'btn btn-secondary', type: 'button' }, ie('check'), 'Bildim');
    var acts = h('div', { class: 'cards-actions', hidden: true }, hardBtn, knewBtn);
    C.wrap.appendChild(flipBtn);
    C.wrap.appendChild(acts);
    C.wrap.appendChild(h('div', { class: 'cards-keys', 'aria-hidden': 'true' },
      h('span', null, h('kbd', { class: 'kbd', text: 'Boşluq' }), 'çevir'),
      h('span', null, h('kbd', { class: 'kbd', text: '1' }), 'çətin oldu'),
      h('span', null, h('kbd', { class: 'kbd', text: '2' }), 'bildim'),
      h('span', null, 'və ya kartı sağa / sola sürüşdürün')));
    C.cur = { card: card, front: front, back: back, acts: acts, flipBtn: flipBtn, knewBtn: knewBtn, c: c };

    var x0 = null, dx = 0, moved = false, pid = null;
    card.addEventListener('pointerdown', function (e) {
      if (!C.flipped || (e.button != null && e.button > 0)) return;
      x0 = e.clientX; dx = 0; moved = false; pid = e.pointerId;
    });
    card.addEventListener('pointermove', function (e) {
      if (x0 === null || e.pointerId !== pid) return;
      dx = e.clientX - x0;
      if (!moved && Math.abs(dx) > 8) { moved = true; card.classList.add('drag'); try { card.setPointerCapture(pid); } catch (er) { /* ignore */ } }
      if (moved) card.style.transform = 'translateX(' + dx + 'px) rotate(' + f1(dx / 24) + 'deg)';
    });
    function endDrag() {
      if (x0 === null) return;
      x0 = null; card.classList.remove('drag'); card.style.transform = '';
      if (moved && Math.abs(dx) > 90) answer(dx > 0);
    }
    card.addEventListener('pointerup', endDrag);
    card.addEventListener('pointercancel', endDrag);
    card.addEventListener('click', function () { if (moved) { moved = false; return; } flip(); });
    flipBtn.addEventListener('click', flip);
    hardBtn.addEventListener('click', function () { answer(false); });
    knewBtn.addEventListener('click', function () { answer(true); });
    if (!first) focusSoft(card);
  }

  function flip() {
    if (!C || !C.cur || C.ended) return;
    var k = C.cur;
    C.flipped = !k.card.classList.contains('flipped');
    k.card.classList.toggle('flipped', C.flipped);
    k.front.setAttribute('aria-hidden', C.flipped ? 'true' : 'false');
    k.back.setAttribute('aria-hidden', C.flipped ? 'false' : 'true');
    if (C.flipped && k.acts.hidden) {
      k.acts.hidden = false; k.flipBtn.hidden = true;
      later(function () { focusSoft(k.knewBtn); }, reduced() ? 0 : 320);
    }
  }

  function answer(knew) {
    if (!C || !C.cur || C.ended || C.busy) return;
    if (!C.flipped) { flip(); return; }
    var c = C.queue.shift();
    var s = srsAll(), now = Date.now(), rec = s[c.id] || { box: 1, due: 0, n: 0 };
    if (knew) {
      rec.box = Math.min(5, (rec.box || 1) + 1);
      rec.due = INTERVAL[rec.box] === 0 ? now : startOfDay(now) + INTERVAL[rec.box] * DAY;
      C.known++;
      if (C.known % 3 === 0) nz('success', pick(['Yaddaşınız möhkəmlənir!', 'Bu kart artıq sizindir.', 'Əla gedirsiniz!']), 1800);
    } else {
      rec.box = 1; rec.due = now; C.hard++;
      if (!C.again[c.id]) { C.again[c.id] = 1; C.queue.push(c); nz('think', 'Bu kartı bu gün yenə göstərəcəyəm.', 2000); }
    }
    rec.n = (Number(rec.n) || 0) + 1; rec.last = now;
    s[c.id] = rec; sset('academy:srs', s);
    C.done++;
    C.busy = true;
    var card = C.cur.card;
    card.style.transform = '';
    card.classList.add(knew ? 'out-r' : 'out-l');
    later(function () {
      C.busy = false;
      if (!C.queue.length) finishSession(); else renderCard(false);
      if (C.boxes && C.boxes.isConnected) { var nb = boxesCard(); C.boxes.parentNode.replaceChild(nb, C.boxes); C.boxes = nb; }
    }, reduced() ? 30 : 260);
  }

  function nextDueText() {
    var s = srsAll(), now = Date.now(), soon = null, cnt = 0;
    deck().forEach(function (c) { var r = s[c.id]; if (r && r.due > now) { var d = startOfDay(r.due); if (soon === null || d < soon) { soon = d; cnt = 0; } if (d === soon) cnt++; } });
    if (soon === null) return 'Növbəti təkrar: sabah';
    var days = Math.round((soon - startOfDay(now)) / DAY);
    return 'Növbəti təkrar: ' + (days <= 1 ? 'sabah' : longDate(soon)) + ' — ' + cnt + ' kart';
  }

  function finishSession() {
    C.ended = true;
    C.wrap.textContent = '';
    var acc = C.done ? Math.round(C.known / C.done * 100) : 0;
    var xp = 10 + C.known * 2;
    bumpMission('cards', C.uniq);
    try { if (App.refreshNav) App.refreshNav(); } catch (e) { /* ignore */ }
    var medal = h('span', { class: 'medal xl pop', 'aria-hidden': 'true' }, h('b', { text: String(C.uniq) }));
    var remaining = dueCount();
    var actions = h('div', { class: 'actions' });
    if (C.hard) actions.appendChild(h('button', { class: 'btn btn-secondary', type: 'button', onclick: function () { startSession(false); } }, ie('refresh'), 'Çətinləri təkrarla'));
    else if (remaining) actions.appendChild(h('button', { class: 'btn btn-secondary', type: 'button', onclick: function () { startSession(false); } }, ie('cards'), 'Yenə ' + Math.min(10, remaining) + ' kart'));
    actions.appendChild(h('button', { class: 'btn', type: 'button', onclick: function () { App.go('home'); } }, ie('home'), 'Masaya qayıt'));
    C.wrap.appendChild(h('section', { class: 'card pad-lg carpet cards-done', 'aria-labelledby': 'cards-done-h' },
      medal,
      h('h2', { id: 'cards-done-h', html: 'Təkrar <em>tamamlandı</em>!' }),
      h('p', { class: 'muted', text: C.uniq + ' kart təkrarlandı. ' + nextDueText() + '.' }),
      h('div', { class: 'stats' },
        h('div', { class: 'stat' }, h('b', { text: String(C.known) }), h('span', { text: 'bildim' })),
        h('div', { class: 'stat' }, h('b', { text: String(C.hard) }), h('span', { text: 'çətin oldu' })),
        h('div', { class: 'stat' }, h('b', { text: acc + '%' }), h('span', { text: 'dəqiqlik' })),
        h('div', { class: 'stat' }, h('b', { text: '+' + xp }), h('span', { text: 'XP' }))),
      actions));
    later(function () {
      burstAt(medal, 'confetti');
      addXP(xp, pointOf(medal));
      nz('celebrate', acc >= 80 ? 'Möhtəşəm təkrar! Yaddaş belə qurulur.' : 'Sessiya bitdi! Çətin kartlar tezliklə qayıdacaq.', 3200);
    }, reduced() ? 100 : 420);
  }

  function renderCardsEmpty(cards) {
    C.ended = true;
    C.wrap.textContent = '';
    var art = h('div', { class: 'empty-art', 'aria-hidden': 'true' });
    C.wrap.appendChild(h('div', { class: 'empty cards-empty' }, art,
      h('h3', { text: C.tag ? '«' + C.tag + '» üzrə təkrar yoxdur' : 'Bu gün üçün hamısı təkrarlanıb' }),
      h('p', { text: nextDueText() + '. Yaddaş dincəlməyi də sevir — amma istəsəniz, yenə məşq edə bilərsiniz.' }),
      h('div', { class: 'actions' },
        cards.length ? h('button', { class: 'btn btn-primary', type: 'button', onclick: function () { startSession(true); } }, ie('cards'), 'Yenə də məşq et') : null,
        h('button', { class: 'btn', type: 'button', onclick: function () { App.go('task'); } }, ie('edit'), 'Tapşırıq götür'))));
    later(function () { mountMini(art, 'sleep'); }, 30);
  }

  function boxesCard() {
    var s = srsAll(), counts = [0, 0, 0, 0, 0, 0], all = deck();
    all.forEach(function (c) { var b = s[c.id] ? clamp(Number(s[c.id].box) || 1, 1, 5) : 1; counts[b]++; });
    var max = Math.max.apply(null, counts.slice(1)) || 1;
    return h('section', { class: 'card', 'aria-labelledby': 'cards-bx-h' },
      h('div', { class: 'card-h' },
        h('div', null, h('span', { class: 'eyebrow', text: 'Aralıqlı təkrar' }), h('h2', { id: 'cards-bx-h', text: 'Kartlar qutularda' })),
        badge(all.length + ' kart', 'navy')),
      h('div', { class: 'cards-boxes' }, [1, 2, 3, 4, 5].map(function (b) {
        return h('div', { class: 'cards-bx' },
          h('b', { text: String(counts[b]) }), h('span', { text: 'Qutu ' + b }), h('small', { text: INT_LABEL[b] }),
          h('div', { class: 'progress thin' + (b >= 4 ? ' green' : b >= 2 ? ' gold' : ''), 'aria-hidden': 'true' }, h('i', { style: 'width:' + Math.round(counts[b] / max * 100) + '%' })));
      })),
      h('p', { class: 'small muted', style: 'margin-top:12px', text: '«Bildim» dedikcə kart növbəti qutuya keçir və daha seyrək görünür. «Çətin oldu» onu birinci qutuya qaytarır.' }));
  }

  function onCardsKey(e) {
    if (!C || C.ended || !C.cur || (App.current && App.current() !== 'cards')) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (D.querySelector('.sheet.on,.dialog.on,.onb')) return;
    var tEl = e.target, tag = tEl && tEl.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (tEl && tEl.isContentEditable)) return;
    var onCtl = tag === 'BUTTON' || tag === 'A';
    if ((e.key === ' ' || e.key === 'Enter') && !onCtl) { e.preventDefault(); flip(); }
    else if (e.key === '1' || e.key === 'ArrowLeft') { e.preventDefault(); answer(false); }
    else if (e.key === '2' || e.key === 'ArrowRight') { e.preventDefault(); answer(true); }
  }

  /* ------------------------------------------------------------------
     8. PROGRESS SCREEN («Mənim inkişafım»)
     ------------------------------------------------------------------ */
  var EMAP = [
    { t: 'Məna və yalançı dostlar', s: '«actual», «eventually»', types: ['Məna', 'Boş seqment'], tag: 'Məna' },
    { t: 'Terminologiya', s: 'Lüğətə uyğunluq', types: ['Termin'], tag: 'Termin' },
    { t: 'Türk formaları', s: '«için», «içinde»', types: ['Türk forması'], tag: 'Türk forması' },
    { t: 'Rəqəm və tarix', s: '12,4% · 15 mart', types: ['Rəqəm', 'Tarix'], tag: 'Rəqəm' },
    { t: 'Üslub və yazılış', s: 'Müraciət, register, orfoqrafiya', types: ['Üslub', 'Söz sırası', 'Orfoqrafiya', 'Ardıcıllıq', 'Durğu', 'Ad'], tag: 'Üslub' }
  ];

  function renderProgress(page) {
    var p = profile(), r = rankOf(p.xp);
    var hist = scores(), n = hist.length;
    var now = skills(), base = skillsStart();
    var sub = 'Hər yoxlanan tərcümə burada iz qoyur: rütbə, ballar və zəif tərəflər.';
    if (n >= 2) {
      var k = Math.min(4, Math.floor(n / 2) || 1);
      var avgFirst = Math.round(hist.slice(0, k).reduce(function (s, x) { return s + x.s; }, 0) / k);
      var avgLast = Math.round(hist.slice(-k).reduce(function (s, x) { return s + x.s; }, 0) / k);
      sub = n + ' tapşırıq yoxlanıb. Orta bal ' + avgFirst + '-dən ' + avgLast + '-ə ' + (avgLast > avgFirst ? 'qalxıb' : avgLast < avgFirst ? 'enib' : 'bərabər qalıb') + '.';
    } else if (n === 1) {
      sub = 'İlk tapşırıq yoxlanıb — ' + hist[0].s + ' bal. Növbəti nəticələrlə qrafik yaranacaq.';
    }

    page.appendChild(h('div', { class: 'page-h' },
      h('div', null,
        h('span', { class: 'eyebrow', text: 'Akademiya · İnkişaf' }),
        h('h1', { html: 'Mənim <em>inkişafım</em>' }),
        h('p', { text: sub }))));

    page.appendChild(rankCard(p, r, hist));
    if (!n) {
      page.appendChild(progressEmpty());
      return;
    }
    var charts = [];
    if (now) charts.push(radarCard(now, base));
    if (n >= 2) charts.push(lineCard(hist));
    if (charts.length === 2) page.appendChild(h('div', { class: 'grid-2' }, charts));
    else charts.forEach(function (c) { page.appendChild(c); });
    var em = errorMapCard();
    var ms = missionsCard();
    if (em) page.appendChild(h('div', { class: 'grid-2' }, em, ms));
    else page.appendChild(ms);
    page.appendChild(weeklyCard());
  }

  function progressEmpty() {
    var art = h('div', { class: 'empty-art', 'aria-hidden': 'true' });
    var el = h('div', { class: 'empty' }, art,
      h('h3', { text: 'Hələ nəticə yoxdur' }),
      h('p', { text: 'İlk tərcüməniz yoxlananda bacarıqlarınız, ballarınız və səhv xəritəniz burada görünəcək.' }),
      h('div', { class: 'actions' },
        h('button', { class: 'btn btn-primary', type: 'button', onclick: function () { App.go('task'); } }, ie('edit'), 'İlk tapşırığa başla')));
    later(function () { mountMini(art, 'point'); }, 30);
    return el;
  }

  function rankCard(p, r, hist) {
    var pct = Math.round((r.progress || 0) * 100);
    var xp = Number(p.xp) || 0, streak = Number(p.streak) || 0;
    var R = ranks();
    var stats = [];
    if (xp) stats.push(h('div', { class: 'stat' }, h('b', { text: num(xp) }), h('span', { text: 'ümumi XP' })));
    if (streak) stats.push(h('div', { class: 'stat' }, h('b', { text: String(streak) }), h('span', { text: 'günlük seriya' })));
    if (hist.length) {
      var avg = Math.round(hist.reduce(function (s, x) { return s + x.s; }, 0) / hist.length);
      stats.push(h('div', { class: 'stat' }, h('b', { text: String(hist.length) }), h('span', { text: 'tapşırıq' })));
      stats.push(h('div', { class: 'stat' }, h('b', { text: String(avg) }), h('span', { text: 'orta bal' })));
    }
    var nextTx = r.nextName ? (xp ? r.nextName + ' rütbəsinə ' + num(r.toNext) + ' XP qalıb' : 'Hər tapşırıq XP gətirir. ' + r.nextName + ' rütbəsi ' + num(r.toNext) + ' XP-dədir.') : 'Ən yüksək rütbə — Ustad!';
    return h('section', { class: 'card lacquer pad-lg progress-hero', 'aria-labelledby': 'progress-rank-h' },
      h('div', { class: 'progress-hero-main' },
        h('div', { class: 'progress-hero-l' },
          h('span', { class: 'medal lg', 'aria-hidden': 'true' }, h('b', { text: r.name.charAt(0) })),
          h('div', { class: 'stack-sm' },
            h('span', { class: 'eyebrow', text: 'Rütbəniz' }),
            h('h2', { class: 'progress-rank', id: 'progress-rank-h', html: '<em>' + esc(r.name) + '</em>' }),
            h('p', { class: 'muted small', text: nextTx }),
            h('div', { class: 'progress progress-fir', role: 'progressbar', 'aria-label': 'Növbəti rütbəyə', 'aria-valuenow': pct, 'aria-valuemin': 0, 'aria-valuemax': 100 }, h('i', { style: 'width:' + pct + '%' })))),
        h('ol', { class: 'progress-ladder', 'aria-label': 'Rütbələr' }, R.map(function (rk, i) {
          return h('li', { class: i < r.index ? 'done' : i === r.index ? 'cur' : '', 'aria-current': i === r.index ? 'step' : null }, h('i', { 'aria-hidden': 'true' }), h('span', { text: rk.name }));
        }))),
      stats.length ? h('div', { class: 'stats' }, stats) : null);
  }

  function radarCard(now, base) {
    var B = base && base.some(function (v, i) { return v !== now[i]; }) ? base : null;
    var cx = 190, cy = 150, R = 92, n = AXES.length;
    function pt(i, v) { var a = -Math.PI / 2 + i * 2 * Math.PI / n; return [cx + Math.cos(a) * R * v / 100, cy + Math.sin(a) * R * v / 100]; }
    function poly(vals) { return vals.map(function (v, i) { var q = pt(i, v); return f1(q[0]) + ',' + f1(q[1]); }).join(' '); }
    var s = '<svg class="progress-svg" viewBox="0 0 380 300" aria-hidden="true">';
    [25, 50, 75, 100].forEach(function (v) { s += '<polygon class="g" points="' + poly(AXES.map(function () { return v; })) + '"/>'; });
    AXES.forEach(function (a, i) { var q = pt(i, 100); s += '<line class="sp" x1="' + cx + '" y1="' + cy + '" x2="' + f1(q[0]) + '" y2="' + f1(q[1]) + '"/>'; });
    if (B) s += '<polygon class="b" points="' + poly(B) + '"/>';
    s += '<polygon class="n" points="' + poly(now) + '"/>';
    now.forEach(function (v, i) { var q = pt(i, v); s += '<circle class="d" data-i="' + i + '" cx="' + f1(q[0]) + '" cy="' + f1(q[1]) + '" r="4"/>'; });
    AXES.forEach(function (a, i) {
      var ang = -Math.PI / 2 + i * 2 * Math.PI / n, c = Math.cos(ang), sn = Math.sin(ang);
      var x = cx + c * (R + 16), y = cy + sn * (R + 16);
      var anchor = c > 0.3 ? 'start' : c < -0.3 ? 'end' : 'middle';
      var y1, y2;
      if (sn < -0.5) { y1 = y - 16; y2 = y - 1; } else if (sn > 0.5) { y1 = y + 8; y2 = y + 23; } else { y1 = y - 3; y2 = y + 13; }
      var g = B ? now[i] - B[i] : 0;
      s += '<text x="' + f1(x) + '" y="' + f1(y1) + '" text-anchor="' + anchor + '">' + esc(a) + '</text>';
      s += '<text class="lv" x="' + f1(x) + '" y="' + f1(y2) + '" text-anchor="' + anchor + '">' + now[i] + (g ? ' <tspan class="' + (g > 0 ? 'up' : 'dn') + '">' + (g > 0 ? '+' : '−') + Math.abs(g) + '</tspan>' : '') + '</text>';
    });
    now.forEach(function (v, i) { var q = pt(i, v); s += '<circle class="hit" tabindex="0" role="img" aria-label="' + esc(AXES[i]) + ': ' + v + (B ? ', başlanğıcda ' + B[i] : '') + '" data-i="' + i + '" cx="' + f1(q[0]) + '" cy="' + f1(q[1]) + '" r="14"/>'; });
    s += '</svg>';
    var wrap = h('div', { class: 'progress-chart', html: s });
    var tip = h('div', { class: 'progress-tip', 'aria-hidden': 'true' });
    wrap.appendChild(tip);
    var svg = wrap.querySelector('svg');
    function show(i) {
      var q = pt(i, now[i]), r = svg.getBoundingClientRect(), sc = r.width / 380;
      tip.textContent = '';
      tip.appendChild(h('b', { text: String(now[i]) }));
      tip.appendChild(h('span', { text: AXES[i] }));
      if (B) tip.appendChild(h('span', { text: 'Başlanğıcda: ' + B[i] }));
      tip.style.left = clamp(q[0] * sc, 64, r.width - 64) + 'px';
      tip.style.top = (q[1] * sc) + 'px';
      tip.classList.add('on');
      Array.prototype.forEach.call(svg.querySelectorAll('.d'), function (d) { d.setAttribute('r', d.getAttribute('data-i') === String(i) ? '6' : '4'); });
    }
    function hide() { tip.classList.remove('on'); Array.prototype.forEach.call(svg.querySelectorAll('.d'), function (d) { d.setAttribute('r', '4'); }); }
    Array.prototype.forEach.call(svg.querySelectorAll('.hit'), function (c) {
      var i = Number(c.getAttribute('data-i'));
      c.addEventListener('pointerenter', function () { show(i); });
      c.addEventListener('pointerleave', hide);
      c.addEventListener('focus', function () { show(i); });
      c.addEventListener('blur', hide);
      c.addEventListener('click', function () { show(i); });
    });
    var table = h('details', { class: 'progress-tbl' },
      h('summary', null, ie('chevron'), 'Cədvəl kimi göstər'),
      h('div', { class: 'table-wrap' }, h('table', { class: 'table compact' },
        h('thead', null, h('tr', null, h('th', { text: 'Bacarıq' }), B ? h('th', { class: 'num', text: 'Başlanğıcda' }) : null, h('th', { class: 'num', text: 'İndi' }))),
        h('tbody', null, AXES.map(function (a, i) { return h('tr', null, h('td', { text: a }), B ? h('td', { class: 'num', text: String(B[i]) }) : null, h('td', { class: 'num' }, h('b', { text: String(now[i]) }))); })))));
    return h('section', { class: 'card progress-card', 'aria-labelledby': 'progress-radar-h' },
      h('div', { class: 'card-h' }, h('div', null, h('span', { class: 'eyebrow', text: 'Bacarıqlar' }), h('h2', { id: 'progress-radar-h', text: 'Bacarıq radarı' }))),
      B ? h('div', { class: 'progress-legend' }, h('span', null, h('i', { 'aria-hidden': 'true' }), 'İndi'), h('span', null, h('i', { class: 'b', 'aria-hidden': 'true' }), 'Başlanğıcda')) : null,
      wrap, table);
  }

  function lineCard(hist) {
    var pts = hist.slice(-12), n = pts.length;
    var Wd = 360, Ht = 210, pl = 30, pr = 30, pt = 18, pb = 28, y0 = 40, y1 = 100;
    function X(i) { return n <= 1 ? (pl + (Wd - pl - pr) / 2) : pl + i * (Wd - pl - pr) / (n - 1); }
    function Y(v) { return pt + (y1 - clamp(v, y0, y1)) / (y1 - y0) * (Ht - pt - pb); }
    var s = '<svg class="progress-svg" viewBox="0 0 ' + Wd + ' ' + Ht + '" aria-hidden="true">';
    [40, 60, 80, 100].forEach(function (v) {
      s += '<line class="g" x1="' + pl + '" x2="' + (Wd - pr + 6) + '" y1="' + f1(Y(v)) + '" y2="' + f1(Y(v)) + '"/>';
      s += '<text class="ax" x="' + (pl - 8) + '" y="' + f1(Y(v) + 4) + '" text-anchor="end">' + v + '</text>';
    });
    var line = pts.map(function (p, i) { return (i ? 'L' : 'M') + f1(X(i)) + ' ' + f1(Y(p.s)); }).join(' ');
    var area = line + ' L' + f1(X(n - 1)) + ' ' + f1(Y(y0)) + ' L' + f1(X(0)) + ' ' + f1(Y(y0)) + ' Z';
    s += '<path class="ar" d="' + area + '"/>';
    s += '<line class="cx" x1="0" x2="0" y1="' + pt + '" y2="' + (Ht - pb) + '"/>';
    s += '<path class="ln" pathLength="1" d="' + line + '"/>';
    pts.forEach(function (p, i) { s += '<circle class="d" data-i="' + i + '" cx="' + f1(X(i)) + '" cy="' + f1(Y(p.s)) + '" r="4"/>'; });
    var last = pts[n - 1];
    s += '<text class="end" x="' + f1(X(n - 1) + 9) + '" y="' + f1(Y(last.s) + 5) + '">' + last.s + '</text>';
    var xi = [0, Math.floor((n - 1) / 2), n - 1].filter(function (v, i, a) { return a.indexOf(v) === i; });
    xi.forEach(function (i, k) {
      var anchor = k === 0 ? 'start' : (i === n - 1 ? 'end' : 'middle');
      var x = k === 0 ? X(i) - 4 : (i === n - 1 ? X(i) + 4 : X(i));
      s += '<text class="ax" x="' + f1(x) + '" y="' + (Ht - 6) + '" text-anchor="' + anchor + '">' + shortDate(pts[i].t) + '</text>';
    });
    s += '<rect class="hit" x="' + (pl - 14) + '" y="0" width="' + (Wd - pl - pr + 28) + '" height="' + Ht + '"/>';
    s += '</svg>';
    var avg = Math.round(pts.reduce(function (a, p) { return a + p.s; }, 0) / Math.max(1, n));
    var best = pts.reduce(function (a, p) { return Math.max(a, p.s); }, 0);
    var diff = last.s - pts[0].s;
    var wrap = h('div', { class: 'progress-chart', tabindex: '0', role: 'img', 'aria-label': 'Son ' + n + ' tapşırığın balı: ' + pts.map(function (p) { return p.s; }).join(', ') + '. Ox düymələri ilə nöqtələrə baxın.', html: s });
    var tip = h('div', { class: 'progress-tip', 'aria-hidden': 'true' });
    wrap.appendChild(tip);
    var svg = wrap.querySelector('svg'), cxl = svg.querySelector('.cx'), dots = svg.querySelectorAll('.d'), hitR = svg.querySelector('.hit');
    var cur = -1;
    function show(i) {
      i = clamp(i, 0, n - 1); cur = i;
      var r = svg.getBoundingClientRect(), sc = r.width / Wd, p = pts[i];
      cxl.setAttribute('x1', f1(X(i))); cxl.setAttribute('x2', f1(X(i))); cxl.classList.add('on');
      Array.prototype.forEach.call(dots, function (d, j) { d.setAttribute('r', j === i ? '6' : '4'); });
      tip.textContent = '';
      tip.appendChild(h('b', { text: p.s + ' bal' }));
      tip.appendChild(h('span', { text: longDate(p.t) + ' · ' + (p.lv || '') }));
      tip.appendChild(h('span', { text: p.title || 'Tapşırıq' }));
      tip.style.left = clamp(X(i) * sc, 70, r.width - 70) + 'px';
      tip.style.top = (Y(p.s) * sc) + 'px';
      tip.classList.add('on');
    }
    function hide() { cur = -1; cxl.classList.remove('on'); tip.classList.remove('on'); Array.prototype.forEach.call(dots, function (d) { d.setAttribute('r', '4'); }); }
    function idxAt(e) { var r = svg.getBoundingClientRect(); var vx = (e.clientX - r.left) / r.width * Wd; return n <= 1 ? 0 : Math.round((vx - pl) / ((Wd - pl - pr) / (n - 1))); }
    hitR.addEventListener('pointermove', function (e) { show(idxAt(e)); });
    hitR.addEventListener('pointerdown', function (e) { show(idxAt(e)); });
    hitR.addEventListener('pointerleave', hide);
    wrap.addEventListener('focus', function () { show(n - 1); });
    wrap.addEventListener('blur', hide);
    wrap.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); show((cur < 0 ? n - 1 : cur) - 1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); show((cur < 0 ? n - 1 : cur) + 1); }
      else if (e.key === 'Escape') hide();
    });
    var table = h('details', { class: 'progress-tbl' },
      h('summary', null, ie('chevron'), 'Cədvəl kimi göstər'),
      h('div', { class: 'table-wrap' }, h('table', { class: 'table compact' },
        h('thead', null, h('tr', null, h('th', { text: 'Tarix' }), h('th', { text: 'Mətn' }), h('th', { class: 'num', text: 'Bal' }))),
        h('tbody', null, pts.slice().reverse().map(function (p) { return h('tr', null, h('td', { class: 'muted', text: shortDate(p.t) }), h('td', { text: (p.lv ? p.lv + ' · ' : '') + (p.title || 'Tapşırıq') }), h('td', { class: 'num' }, h('b', { text: String(p.s) }))); })))));
    return h('section', { class: 'card progress-card', 'aria-labelledby': 'progress-line-h' },
      h('div', { class: 'card-h' },
        h('div', null, h('span', { class: 'eyebrow', text: 'Ballar' }), h('h2', { id: 'progress-line-h', text: 'Son ' + n + ' tapşırıq' })),
        h('div', { class: 'actions' }, badge('orta ' + avg, 'navy'), badge('ən yüksək ' + best, 'gold'))),
      wrap,
      h('div', { class: 'stats' },
        h('div', { class: 'stat' }, h('b', { text: String(pts[0].s) }), h('span', { text: 'ilk bal · ' + shortDate(pts[0].t) })),
        h('div', { class: 'stat' }, h('b', { text: String(last.s) }), h('span', { text: 'son bal · ' + shortDate(last.t) })),
        h('div', { class: 'stat' }, h('b', null, (diff >= 0 ? '+' : '−') + Math.abs(diff)), h('span', { text: 'dəyişmə' }))),
      table);
  }

  function errorMapCard() {
    var lg = sget('academy:errlog', {}) || {};
    var rows = EMAP.map(function (m) { var c = 0; m.types.forEach(function (t) { c += Number(lg[t]) || 0; }); return { m: m, n: c }; })
      .filter(function (r) { return r.n > 0; })
      .sort(function (a, b) { return b.n - a.n; });
    if (!rows.length) return null;
    var total = rows.reduce(function (a, r) { return a + r.n; }, 0);
    var maxN = rows[0].n;
    var top = rows[0];
    return h('section', { class: 'card progress-card', 'aria-labelledby': 'progress-emap-h' },
      h('div', { class: 'card-h' },
        h('div', null, h('span', { class: 'eyebrow', text: 'Zəif tərəflər' }), h('h2', { id: 'progress-emap-h', text: 'Səhvlərin xəritəsi' })),
        h('span', { class: 'small muted', text: total + ' səhv' })),
      h('div', { class: 'progress-emap' }, rows.map(function (r, i) {
        var share = Math.round(r.n / total * 100), m = r.m;
        var b = h('button', { class: 'progress-erow', type: 'button', 'aria-label': m.t + ': səhvlərin ' + share + '%-i, ' + r.n + ' səhv. Kartlara bax' },
          h('span', { class: 'progress-erow-t' }, m.t, h('small', { text: m.s })),
          h('span', { class: 'progress' + (i ? ' gold' : ''), 'aria-hidden': 'true' }, h('i', { style: 'width:' + Math.round(r.n / maxN * 100) + '%' })),
          h('span', { class: 'progress-erow-v' }, share + '%'));
        b.addEventListener('click', function () { App.go('cards', { tag: m.tag }); });
        return b;
      })),
      h('div', { class: 'callout' }, ie('bulb'),
        h('div', null, 'Ən çox səhv — ', h('b', { text: lower(top.m.t) }), '.')));
  }

  function missionsCard() {
    var done = 0;
    var rows = MISSIONS.map(function (m) {
      var cur = msProgress(m), complete = cur >= m.max, claimed = complete && isClaimed(m);
      if (claimed) done++;
      var pct = Math.round(cur / m.max * 100);
      var tx = h('span', { class: 'tx' },
        h('b', { text: m.t }),
        h('small', { text: m.s + ' · ' + cur + ' / ' + m.max }),
        h('span', { class: 'progress thin' + (complete ? ' green' : ' gold'), 'aria-hidden': 'true' }, h('i', { style: 'width:' + pct + '%' })));
      var ic = icTile(complete ? 'check' : m.ic, complete ? 'green' : m.weekly ? 'progress-fir' : 'gold');
      if (claimed) return h('div', { class: 'list-row' }, ic, tx, h('span', { class: 'end' }, badge('Alındı', 'green', 'check')));
      if (complete) {
        var cb = h('button', { class: 'btn btn-primary btn-sm', type: 'button' }, ie('zap'), '+' + m.xp + ' XP al');
        cb.addEventListener('click', function () {
          if (isClaimed(m)) return;
          var c = sget(claimKey(m), {}) || {}; c[m.id] = true; sset(claimKey(m), c);
          burstAt(cb, 'stars');
          addXP(m.xp, pointOf(cb));
          nz('success', '+' + m.xp + ' XP! Belə davam edək.', 2200);
          var card = cb.closest('.progress-ms');
          if (card && card.parentNode) card.parentNode.replaceChild(missionsCard(), card);
        });
        return h('div', { class: 'list-row' }, ic, tx, h('span', { class: 'end' }, cb));
      }
      return h('button', { class: 'list-row', type: 'button', onclick: function () { goFirst(m.go || ['task'], { mission: m.id }, 'Bu bölmə hazırlanır'); } },
        ic, tx, h('span', { class: 'end' }, badge('+' + m.xp + ' XP', 'gold'), h('span', { html: App.icon('chevron'), 'aria-hidden': 'true', style: 'display:inline-flex' })));
    });
    return h('section', { class: 'card progress-ms', 'aria-labelledby': 'progress-ms-h' },
      h('div', { class: 'card-h' },
        h('div', null, h('span', { class: 'eyebrow', text: 'Missiyalar' }), h('h2', { id: 'progress-ms-h', text: 'Bugünkü tapşırıqlar' })),
        badge(done + ' / ' + MISSIONS.length, 'navy')),
      h('div', { class: 'list' }, rows));
  }

  function weeklyCard() {
    var wk = weeklyCount();
    var dl = 6 - ((new Date().getDay() + 6) % 7);
    var claimedKey = 'academy:wclaim:' + weekKey(), claimed = !!sget(claimedKey, false);
    var action;
    if (wk >= 5 && !claimed) {
      action = h('button', { class: 'btn btn-primary', type: 'button' }, ie('medal'), '+150 XP al');
      action.addEventListener('click', function () {
        sset(claimedKey, true);
        burstAt(action, 'confetti');
        addXP(150, pointOf(action));
        nz('celebrate', 'Hüquqi həftə fəth edildi! Möhürdar nişanı sizindir.', 3200);
        var card = action.closest('.progress-week-card');
        if (card && card.parentNode) card.parentNode.replaceChild(weeklyCard(), card);
      });
    } else if (wk >= 5) {
      action = badge('Çağırış tamamlandı', 'green', 'check');
    } else {
      action = h('button', { class: 'btn btn-primary', type: 'button' }, 'Növbəti hüquqi mətn', ie('arrow'));
      action.addEventListener('click', function () { App.go('task', { domain: 'Hüquq', level: 'B2' }); });
    }
    return h('section', { class: 'card lacquer pad-lg progress-week-card', 'aria-labelledby': 'progress-week-h' },
      h('div', { class: 'progress-week' },
        h('div', { class: 'progress-week-l' },
          h('span', { class: 'eyebrow', text: 'Həftəlik çağırış' }),
          h('h2', { id: 'progress-week-h', html: 'Hüquqi <em>həftə</em>' }),
          h('p', { class: 'muted', text: 'Bazar gününədək 5 hüquqi mətni 85+ balla tərcümə edin. Möhürdar Mirzə hər rəqəmi yoxlayacaq.' }),
          h('div', { class: 'progress progress-fir lg', role: 'progressbar', 'aria-label': 'Çağırış gedişi', 'aria-valuenow': wk * 20, 'aria-valuemin': 0, 'aria-valuemax': 100 }, h('i', { style: 'width:' + wk * 20 + '%' })),
          h('div', { class: 'progress-week-meta' }, h('span', { text: wk + ' / 5 mətn' }), h('span', { text: dl === 0 ? 'bu gün bitir' : dl + ' gün qalıb' })),
          h('div', { class: 'progress-reward' }, h('span', { class: 'medal sm', 'aria-hidden': 'true' }, h('b', { text: 'M' })),
            h('span', null, h('b', { text: 'Mükafat: «Möhürdar» nişanı' }), h('small', { text: '+150 XP və profilinizdə möhür' }))),
          action)));
  }

  /* ------------------------------------------------------------------
     9. REGISTER
     ------------------------------------------------------------------ */
  var RENDER = { task: renderTask, practice: renderPractice, cards: renderCards, progress: renderProgress };
  function start(id) {
    return function (el, params) {
      cleanup(); gen++;
      T = null; P = null; C = null;
      App.css('academy', CSS);
      var page = h('div', { class: 'page ' + id + '-page' });
      el.appendChild(page);
      RENDER[id](page, params || {});
    };
  }
  function leave() { cleanup(); gen++; T = null; P = null; C = null; }

  App.register('task', { title: 'Tapşırıq', icon: 'edit', group: 'Akademiya', mode: 'academy', render: start('task'), leave: leave });
  App.register('practice', { title: 'Məşq', icon: 'target', group: 'Akademiya', mode: 'academy', render: start('practice'), leave: leave });
  App.register('cards', {
    title: 'Səhv kartları', icon: 'cards', group: 'Akademiya', mode: 'academy', badgeKind: 'gold',
    badge: function () { var n = dueCount(); return n ? String(n) : null; },
    render: start('cards'), leave: leave
  });
  App.register('progress', { title: 'Mənim inkişafım', icon: 'chart', group: 'Akademiya', mode: 'academy', render: start('progress'), leave: leave });
})();
