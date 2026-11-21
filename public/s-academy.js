/* =====================================================================
   NUANZA — s-academy.js
   Akademiya ekranları (Mirzə workstation: sakit, tipoqrafik, bir aksent):
     • 'task'      Tapşırıq — rejim · toplu · sahə · səviyyə alət zolağı; mənbə və
                   tərcümə yan-yana panellərdə; «Yoxlat» → Mirzə Məclisi → bal,
                   meyarlar, peşəkar rəy sətirləri (Kritik/Əsas/Kiçik · Mənbə ·
                   Tərcümədə · Düzəliş · Problem · Rəyçi), nümunə tərcümə, XP.
                   Mətn topluları: Mirzə tapşırıqları · Xəbərlər (NTREX-128) ·
                   Məşhur sənədlər (BMT Ümumi Bəyannaməsi) — data-real.js.
                   «Səhvi tap» rejimi: dərc olunmuş real tərcümədə səhvləri tapmaq
                   (oflayn; buraxılan səhvlər səhv kartlarına düşür).
     • 'practice'  Məşq — məşqlərin siyahısı; «Detektiv» səhifədə oynanılır,
                   digərləri vərəqdə (Sən vs maşın, Düzəlt, Kontekst, Sürət,
                   Şifahi, Simulyator, Real səhv ovu).
     • 'cards'     Səhv kartları — yalnız istifadəçinin öz səhvlərindən (academy:mycards);
                   aralıqlı təkrar (Leitner), çevrilən kart.
     • 'progress'  Mənim inkişafım — yalnız real nəticələr: rütbə, KPI, bacarıqlar,
                   bal dinamikası, zəif tərəflər, tarixçə, missiyalar, həftəlik çağırış.
     • 'lessons'   Dərslər — nəzəri dərslər (App.data.LESSONS) və bütün tapşırıqlar
                   sahə/səviyyə üzrə, statusla; { lesson } → dərs səhifəsi.
     • 'glossary'  Lüğət — sahə lüğətləri səhifə kimi (App.academyGlossary vərəqi də qalır).
   Plain browser JS. Uses App.* (app.js) and app.css components.
   Screen CSS classes: acad-*, task-*, practice-*, cards-*, progress-*, lessons-*, glossary-*.
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
  function lower(s) { s = String(s == null ? '' : s); try { return s.toLocaleLowerCase('az'); } catch (e) { return s.toLowerCase(); } }
  function upper(s) { s = String(s == null ? '' : s); try { return s.toLocaleUpperCase('az'); } catch (e) { return s.toUpperCase(); } }
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
  /* Speech policy: «Normal» (default) — only outcomes (done, problem found); «Çox» — everything; «Sakit» — nothing. */
  function chatty(state) {
    var c = null; try { c = App.companionConfig ? App.companionConfig() : null; } catch (e) { c = null; }
    if (c && c.chatty === false) return false;
    var t = (c && c.talk) || 'normal';
    return t === 'cox' || (t !== 'sakit' && /^(success|worried|sad|celebrate)$/.test(state || ''));
  }
  function nz(state, text, ms) {
    var c = App.companion; if (!c || typeof c.set !== 'function') return;
    try { c.set(state || 'idle', text && chatty(state || 'idle') ? { say: text, ms: ms || 3000 } : { ms: ms || 1600 }); } catch (e) { /* ignore */ }
  }
  function pointOf(el) {
    try { if (el && el.isConnected) { var r = el.getBoundingClientRect(); if (r.width || r.height) return { x: r.left + r.width / 2, y: r.top + Math.min(r.height / 2, 24) }; } } catch (e) { /* ignore */ }
    return { x: W.innerWidth / 2, y: W.innerHeight * 0.4 };
  }
  /* Workstation tone: no confetti / star bursts on academy screens — results speak for themselves.
     (Kept as a function so every call site stays as it was.) */
  function burstAt() { return null; }
  function fxXP(pt, text) {
    try {
      if (W.NuanzaFX && typeof W.NuanzaFX.xp === 'function') W.NuanzaFX.xp(pt.x, pt.y, text);
      else if (App.fx && App.fx.xp) App.fx.xp(pt.x, pt.y, text);
    } catch (e) { /* ignore */ }
  }
  /* a new rank is announced with a calm toast instead of the full-screen medal */
  function fxMedal(name) {
    try { App.toast('Yeni rütbə: ' + name, 'ok', { sub: 'Bal və XP tarixçəsi «İnkişaf» bölməsindədir', icon: 'medal' }); } catch (e) { /* ignore */ }
  }
  function busy(btn, on) { if (!btn) return; if (on) btn.setAttribute('aria-busy', 'true'); else btn.removeAttribute('aria-busy'); }
  function isBusy(btn) { return !!btn && btn.getAttribute('aria-busy') === 'true'; }
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
    { id: 'base', label: 'Mirzə tapşırıqları' },
    { id: 'news', label: 'Xəbərlər (NTREX)' },
    { id: 'docs', label: 'Məşhur sənədlər' }
  ].filter(function (c) { return TASKS.some(function (t) { return !t.sim && (t.col || 'base') === c.id; }); });
  function colOf(t) { return (t && t.col) || 'base'; }

  /* curriculum domains (data-domains-*.js): window.NUANZA_DOMAINS[key] = { key, name, icon, why, glossary[{en,az,note}], tasks[] }.
     Domain tasks join the base collection («Nuanza tapşırıqları») and carry `dkey`; the «Sahə» chip row filters by it. */
  var DOMAINS = [];
  var ICON_FB = { code: 'keyboard', megaphone: 'message', scale: 'shield', gavel: 'shield', law: 'shield', coins: 'chart', money: 'chart', bank: 'chart',
    oil: 'flame', drop: 'flame', fuel: 'flame', doc: 'file', docs: 'file', stethoscope: 'heart', medical: 'heart', news: 'file', film: 'play' };
  function domIcon(n) {
    n = String(n || '');
    if (!n) return 'book';
    try { if (App.icon(n).replace('i-' + n, 'i-dot') !== App.icon('dot')) return n; } catch (e) { /* fall through */ }
    return ICON_FB[n] || 'book';
  }
  (function () {
    var src = W.NUANZA_DOMAINS && typeof W.NUANZA_DOMAINS === 'object' ? W.NUANZA_DOMAINS : null;
    if (!src) return;
    Object.keys(src).forEach(function (k) {
      var d = src[k];
      if (!d || typeof d !== 'object') return;
      var key = String(d.key || k), name = String(d.name || k);
      var gl = (Array.isArray(d.glossary) ? d.glossary : []).filter(function (g) { return g && g.en && g.az; })
        .map(function (g) { return { en: String(g.en), az: String(g.az), note: g.note ? String(g.note) : '' }; });
      var n = 0;
      (Array.isArray(d.tasks) ? d.tasks : []).forEach(function (t) {
        if (!t || !t.id || !t.src || !levelById(t.level) || taskById(t.id)) return;
        TASKS.push({ id: String(t.id), dkey: key, level: t.level, domain: t.domain || name, reg: t.reg || 'Neytral', client: t.client || name, title: t.title || name,
          xp: Number(t.xp) || LV_XP[t.level] || 30, minutes: Number(t.minutes) || minsOf(words(t.src)), src: String(t.src), model: t.model || '',
          hints: Array.isArray(t.hints) ? t.hints : [], draft: t.draft || '', tip: t.tip || '', traps: Array.isArray(t.traps) ? t.traps : [] });
        n++;
      });
      if (!n && !gl.length) return;
      DOMAINS.push({ key: key, name: name, icon: domIcon(d.icon), why: String(d.why || ''), glossary: gl, count: n });
    });
  })();
  function domByKey(k) { for (var i = 0; i < DOMAINS.length; i++) if (DOMAINS[i].key === k) return DOMAINS[i]; return null; }

  /* «Kitabxana» → «Tapşırığa çevir»: one-off task from App.store 'academy:custom' (kept as 'academy:customTask' so a reload resumes it) */
  var CUSTOM = null;
  function customFrom(c) {
    if (!c || typeof c !== 'object' || !String(c.src || '').trim()) return null;
    var src = String(c.src).trim(), n = words(src), lv = n <= 30 ? 'B1' : n <= 60 ? 'B2' : 'C1';
    var sl = c.srcLang === 'az' ? 'az' : 'en';
    var url = /^https?:\/\//i.test(String(c.url || '')) ? String(c.url) : '';
    return { id: 'custom-' + (c.at || Date.now()), level: lv, domain: 'Kitabxana', reg: 'Neytral', client: String(c.source || 'Kitabxana'),
      title: String(c.title || 'Kitabxana mətni'), xp: LV_XP[lv] || 30, minutes: minsOf(n), src: src, model: '', hints: [], draft: '',
      tip: 'Bu mətn Kitabxanadan gəlir — model tərcümə yoxdur, Mirzə Məclisi yoxlayacaq.', traps: [], custom: true, srcLang: sl,
      source: String(c.source || ''), licence: String(c.licence || ''), url: url };
  }
  function pairOf(task) { var s = task && task.srcLang === 'az' ? 'az' : 'en'; return { from: s, to: s === 'az' ? 'en' : 'az' }; }

  function taskById(id) {
    for (var i = 0; i < TASKS.length; i++) if (TASKS[i].id === id) return TASKS[i];
    if (CUSTOM && CUSTOM.id === id) return CUSTOM;
    if (id && String(id).indexOf('custom-') === 0) {
      var c = sget('academy:customTask', null);
      if (c && c.id === id && c.src) { CUSTOM = c; return c; }
    }
    return null;
  }

  var SEV = { 'Türk forması': 'mid', 'Rəqəm': 'high', 'Termin': 'mid', 'Məna': 'high', 'Orfoqrafiya': 'mid', 'Üslub': 'low', 'Durğu': 'low', 'Ad': 'mid', 'Tarix': 'high', 'Söz sırası': 'low', 'Ardıcıllıq': 'mid', 'Boş seqment': 'high', 'Buraxma': 'high', 'Əlavə': 'mid' };
  var SEV_LABEL = { high: 'Kritik', mid: 'Əsas', low: 'Kiçik' };
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
    { min: 91, l: 'A', w: 'Əla', head: 'Peşəkar səviyyə' },
    { min: 81, l: 'B', w: 'Çox yaxşı', head: 'Möhkəm tərcümə' },
    { min: 71, l: 'C', w: 'Yaxşı', head: 'Yaxşı əsas var' },
    { min: 61, l: 'D', w: 'Kafi', head: 'Bir neçə düzəliş lazımdır' },
    { min: 51, l: 'E', w: 'Qənaətbəxş', head: 'Əsaslı redaktə lazımdır' },
    { min: 0, l: 'F', w: 'Qeyri-kafi', head: 'Tərcümə yenidən yazılmalıdır' }
  ];
  function gradeOf(s) { for (var i = 0; i < GRADES.length; i++) if (s >= GRADES[i].min) return GRADES[i]; return GRADES[GRADES.length - 1]; }
  var DEFAULT_RUB = [{ name: 'Məna dəqiqliyi', max: 40, score: 32 }, { name: 'Terminologiya', max: 20, score: 16 }, { name: 'Üslub və axıcılıq', max: 20, score: 16 }, { name: 'Ədəbi norma', max: 10, score: 8 }, { name: 'Format (rəqəm, tarix, ad)', max: 10, score: 8 }];

  /* games */
  var GAMES = [
    { id: 'vs', name: 'İnsan, yoxsa maşın?', icon: 'users', cls: '', desc: 'Eyni cümlə, iki variant — hansı daha dəqiqdir?', diff: 2, skill: 'Məna' },
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
  var OK_MSG = ['Düzdür.', 'Doğrudur.', 'Məhz belə.'];

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
     4. CSS (tokens only) — workstation tone: hairlines, one accent, no gradients
     ------------------------------------------------------------------ */
  var CSS = [
    /* shared — academy workstation pieces (acad-) */
    '@keyframes acad-in{from{opacity:0;transform:translateY(3px)}to{opacity:1;transform:none}}',
    '.task-in{animation:acad-in 160ms ease both}',
    '@keyframes task-shake{0%{box-shadow:0 0 0 3px var(--danger-t)}100%{box-shadow:0 0 0 0 transparent}}',
    '.task-shake{animation:task-shake 180ms ease}',
    '@keyframes task-flash{0%{background-color:var(--accent-t)}100%{background-color:transparent}}',
    '.task-flash{animation:task-flash 600ms ease}',
    '.acad-page .page-h h1{font-size:var(--t-h1);line-height:28px;font-weight:600;letter-spacing:-.01em}',
    '.acad-page .page-h p{font-size:var(--t-body);line-height:21px;color:var(--text-2)}',
    '.acad-nav{display:flex;align-items:stretch;gap:2px;min-width:0;border-bottom:1px solid var(--border);overflow-x:auto;scrollbar-width:none}',
    '.acad-nav::-webkit-scrollbar{display:none}',
    '.acad-nav a{position:relative;flex:none;display:inline-flex;align-items:center;gap:6px;padding:6px 10px 9px;border-radius:var(--r-xs) var(--r-xs) 0 0;color:var(--text-2);font:500 var(--t-small)/18px var(--f-body);text-decoration:none;white-space:nowrap;transition:color var(--t-fast) ease,background-color var(--t-fast) ease}',
    '.acad-nav a:hover{color:var(--text);background:var(--hover)}',
    '.acad-nav a[aria-current="page"]{color:var(--text);font-weight:600}',
    '.acad-nav a[aria-current="page"]::after{content:"";position:absolute;left:10px;right:10px;bottom:-1px;height:2px;border-radius:1px;background:var(--accent)}',
    '.acad-nav a:focus-visible{outline:2px solid var(--focus);outline-offset:-2px}',
    '.acad-nav-n{font:500 var(--t-micro)/14px var(--f-mono);color:var(--text-3)}',
    '.acad-cap{display:block;color:var(--text-2);font:600 var(--t-caption)/16px var(--f-body);letter-spacing:.04em;text-transform:uppercase}',
    '.acad-meta{display:flex;flex-wrap:wrap;align-items:center;row-gap:2px;min-width:0;color:var(--text-2);font-size:var(--t-small);line-height:18px}',
    '.acad-meta > *{display:inline-flex;align-items:center;min-width:0}',
    '.acad-meta > * + *::before{content:"·";margin:0 7px;color:var(--text-3)}',
    '.acad-lv{display:inline-flex;align-items:center;justify-content:center;flex:none;height:18px;min-width:26px;padding:0 4px;border:1px solid var(--border-2);border-radius:4px;color:var(--text);font:500 var(--t-micro)/1 var(--f-mono);letter-spacing:.02em}',
    '.acad-meta > .acad-lv + *::before{margin-left:7px}',
    '.acad-count{color:var(--text-2);font:500 var(--t-caption)/16px var(--f-mono);font-variant-numeric:tabular-nums;white-space:nowrap}',
    '.acad-mono{font-family:var(--f-mono);font-variant-numeric:tabular-nums}',
    '.acad-panel{min-width:0;padding:16px 20px;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--panel)}',
    '.acad-panel-h{display:flex;flex-wrap:wrap;align-items:flex-start;justify-content:space-between;gap:6px 12px;margin-bottom:12px}',
    '.acad-panel-h > div{display:grid;gap:2px;min-width:0}',
    '.acad-panel-h h2,.acad-panel-h h3{font-size:var(--t-h3);line-height:20px;font-weight:600}',
    '.acad-sec{display:grid;gap:10px;min-width:0}',
    '.acad-sec-h{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:4px 12px;min-width:0}',
    '.acad-sec-h h2{font-size:var(--t-h2);line-height:24px;font-weight:600}',
    '.acad-sec-h small{color:var(--text-2);font-size:var(--t-small)}',
    '.acad-act{display:flex;flex-wrap:wrap;align-items:center;gap:8px;min-width:0}',
    '.acad-act.end{justify-content:flex-end}',
    '.acad-field{display:grid;gap:4px;min-width:0}',
    '.acad-field > span{color:var(--text-2);font:500 var(--t-caption)/16px var(--f-body)}',
    '.acad-field .select{width:100%;min-width:0}',
    '.acad-empty{display:grid;justify-items:start;gap:4px;padding:20px;border:1px dashed var(--border-2);border-radius:var(--r-sm);background:transparent}',
    '.acad-empty b{font-size:var(--t-h3);line-height:20px;font-weight:600}',
    '.acad-empty p{max-width:62ch;color:var(--text-2);font-size:var(--t-body);line-height:21px}',
    '.acad-empty .acad-act{margin-top:8px}',
    '.acad-status{display:inline-flex;align-items:center;gap:6px;height:22px;padding:0 8px;border-radius:999px;background:var(--sunken);color:var(--text-2);font:500 var(--t-caption)/1 var(--f-body);white-space:nowrap}',
    '.acad-status::before{content:"";width:6px;height:6px;border-radius:50%;background:currentColor}',
    '.acad-status.ok{background:var(--success-t);color:var(--success)}',
    '.acad-status.warn{background:var(--warning-t);color:var(--warning)}',
    '.acad-status.err{background:var(--danger-t);color:var(--danger)}',
    '.acad-status.acc{background:var(--accent-t);color:var(--accent)}',
    '.acad-bar{position:relative;height:4px;min-width:0;border-radius:2px;background:var(--sunken);overflow:hidden}',
    '.acad-bar > i{display:block;height:100%;width:0;border-radius:inherit;background:var(--accent);transition:width 180ms ease}',
    '.acad-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(112px,1fr));min-width:0;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--panel);overflow:hidden}',
    '.acad-stat{display:grid;gap:2px;min-width:0;padding:10px 14px;box-shadow:-1px 0 0 var(--border)}',
    '.acad-stat span{color:var(--text-2);font-size:var(--t-caption);line-height:16px}',
    '.acad-stat b{font-size:var(--t-h2);line-height:24px;font-weight:600;font-variant-numeric:tabular-nums}',
    '.acad-who{display:inline-flex;align-items:center;gap:6px;min-width:0;color:var(--text-2);font-size:var(--t-caption);line-height:16px;white-space:nowrap}',
    '.acad-av{flex:none;width:20px;height:20px;display:inline-grid;place-items:center;border:1px solid var(--border-2);border-radius:50%;color:var(--text-2);font:600 8.5px/1 var(--f-body);letter-spacing:.03em}',
    '.acad-sev{display:inline-flex;align-items:center;gap:6px;color:var(--text-2);font:600 var(--t-caption)/16px var(--f-body);white-space:nowrap}',
    '.acad-sev i{flex:none;width:7px;height:7px;border-radius:2px;background:var(--border-2)}',
    '.acad-sev[data-sev="high"]{color:var(--danger)}',
    '.acad-sev[data-sev="high"] i{background:var(--danger)}',
    '.acad-sev[data-sev="mid"]{color:var(--warning)}',
    '.acad-sev[data-sev="mid"] i{background:var(--warning)}',
    '.acad-srcblk{display:grid;gap:4px;min-width:0;padding:10px 14px;border-left:2px solid var(--border-2);border-radius:0 var(--r-xs) var(--r-xs) 0;background:var(--sunken);color:var(--text-2);font-size:var(--t-body);line-height:21px}',
    '.acad-srcblk b{color:var(--text);font-weight:600}',
    '.acad-credit{color:var(--text-3);font-size:var(--t-caption);line-height:16px;overflow-wrap:anywhere}',
    '.acad-credit a{color:var(--text-2)}',
    '.acad-note{color:var(--text-2);font-size:var(--t-small);line-height:18px}',
    '.acad-note b{color:var(--text);font-weight:600}',
    /* review rows — severity · (source) · translation · correction · issue · reviewer */
    '.acad-rv{min-width:0;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--panel)}',
    '.acad-rv-h{display:none}',
    '.acad-rv-l{margin:0;padding:0;list-style:none}',
    '.acad-rv-row{position:relative;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);grid-template-areas:"sev who" "was now" "why why" "act act" "ext ext";gap:8px 16px;align-items:start;padding:14px 16px;border-bottom:1px solid var(--border);transition:background-color var(--t-fast) ease}',
    '.acad-rv.with-src .acad-rv-row{grid-template-areas:"sev who" "src src" "was now" "why why" "act act" "ext ext"}',
    '.acad-rv-row:last-child{border-bottom:0}',
    '.acad-rv-row:focus{outline:none}',
    '.acad-rv-row:focus-visible{outline:2px solid var(--focus);outline-offset:-2px}',
    '.acad-rv-sev{grid-area:sev;display:flex;flex-wrap:wrap;align-items:center;gap:2px 10px;min-width:0}',
    '.acad-rv-type{color:var(--text-2);font-size:var(--t-small);line-height:18px}',
    '.acad-rv-who{grid-area:who;justify-self:end;min-width:0}',
    '.acad-rv-c{display:grid;gap:2px;min-width:0;font-size:var(--t-body);line-height:21px;overflow-wrap:anywhere}',
    '.acad-rv-src{grid-area:src;color:var(--text-2)}',
    '.acad-rv-src > span:last-child{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}',
    '.acad-rv-was{grid-area:was}',
    '.acad-rv-now{grid-area:now}',
    '.acad-rv-why{grid-area:why;color:var(--text)}',
    '.acad-rv-lbl{color:var(--text-3);font:500 var(--t-micro)/14px var(--f-body);letter-spacing:.04em;text-transform:uppercase}',
    '.acad-was{color:var(--danger);text-decoration:line-through;text-decoration-thickness:1px}',
    '.acad-miss{color:var(--danger);font-style:italic}',
    '.acad-now{color:var(--accent);font-weight:600}',
    '.acad-rv-act{grid-area:act;display:flex;flex-wrap:wrap;align-items:center;gap:6px 8px;min-width:0}',
    '.acad-rv-act:empty{display:none}',
    '.acad-rv-ext{grid-area:ext;display:grid;gap:8px;min-width:0}',
    '.acad-rv-ext:empty{display:none}',
    '.acad-rv-ex{display:grid;gap:2px;padding:8px 12px;border-left:2px solid var(--border-2);border-radius:0 var(--r-xs) var(--r-xs) 0;background:var(--sunken);font-size:var(--t-small);line-height:18px}',
    '.acad-rv-self{display:grid;gap:6px;max-width:520px}',
    '.acad-rv-self-row{display:flex;gap:8px}',
    '.acad-rv-self-row .input{flex:1;min-width:0;height:32px;min-height:32px;padding-block:4px}',
    '.acad-rv-self small{color:var(--text-2);font-size:var(--t-caption)}',
    '.acad-rv-state{display:inline-flex;align-items:center;gap:6px;color:var(--success);font-size:var(--t-small);line-height:18px}',
    '.acad-rv-state:empty{display:none}',
    '.acad-rv-state svg{width:14px;height:14px}',
    '.acad-rv-state.miss{color:var(--danger)}',
    '.acad-rv-row.done{background:var(--sunken)}',
    '.acad-rv-row.done .acad-was{opacity:.7}',
    '@media (min-width:1200px){',
    '.acad-rv-h,.acad-rv-row{grid-template-columns:104px minmax(0,1fr) minmax(0,1fr) minmax(0,1.9fr) 148px;column-gap:16px}',
    '.acad-rv-h{display:grid;padding:8px 16px;border-bottom:1px solid var(--border);border-radius:var(--r-sm) var(--r-sm) 0 0;background:var(--sunken);color:var(--text-2);font:600 var(--t-micro)/14px var(--f-body);letter-spacing:.04em;text-transform:uppercase}',
    '.acad-rv-row{grid-template-areas:"sev was now why who" ". act act act act" ". ext ext ext ext";row-gap:10px}',
    '.acad-rv.with-src .acad-rv-h,.acad-rv.with-src .acad-rv-row{grid-template-columns:104px minmax(0,1.2fr) minmax(0,.9fr) minmax(0,.9fr) minmax(0,1.6fr) 148px}',
    '.acad-rv.with-src .acad-rv-row{grid-template-areas:"sev src was now why who" ". act act act act act" ". ext ext ext ext ext"}',
    '.acad-rv-h > :last-child{text-align:right}',
    '.acad-rv-sev{flex-direction:column;align-items:flex-start}',
    '.acad-rv-lbl{display:none}',
    '}',
    /* token tapping (Səhvi tap, Detektiv) */
    '.acad-tap{color:var(--text);font-size:1.0625rem;line-height:2;overflow-wrap:anywhere}',
    '.practice-w{display:inline;margin:0;padding:2px 1px;border:0;border-radius:3px;background:transparent;color:inherit;font:inherit;line-height:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:background-color var(--t-fast) ease,box-shadow var(--t-fast) ease,color var(--t-fast) ease}',
    '@media (hover:hover){.practice-w:not([aria-disabled="true"]):hover{background:var(--hover);box-shadow:inset 0 -1px 0 var(--border-2)}}',
    '.practice-w:focus-visible{outline:2px solid var(--focus);outline-offset:1px}',
    '.practice-w[aria-pressed="true"]{background:var(--accent-t);box-shadow:inset 0 -2px 0 var(--accent)}',
    '.practice-w.hit{background:var(--danger-t);color:var(--danger);text-decoration:line-through;text-decoration-thickness:1px;box-shadow:inset 0 -2px 0 var(--danger)}',
    '.practice-w.miss{color:var(--danger);text-decoration:line-through;text-decoration-thickness:1px;box-shadow:none;border-bottom:1px dashed var(--danger);border-radius:0}',
    '.practice-w.false{color:var(--text-3);box-shadow:inset 0 -1px 0 var(--border-2)}',
    '.practice-w[aria-disabled="true"]{cursor:default}',
    '.practice-fix{display:inline;margin:0 4px;padding:1px 5px;border-radius:3px;background:var(--accent-t);color:var(--accent);font-size:.9375rem;font-weight:600;text-decoration:none}',
    '.acad-tapbar{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px 12px;padding-top:12px;border-top:1px solid var(--border)}',
    '.acad-legend{display:flex;flex-wrap:wrap;gap:4px 16px;color:var(--text-2);font-size:var(--t-caption);line-height:16px}',
    '.acad-legend span{display:inline-flex;align-items:center;gap:6px}',
    '.acad-legend i{width:14px;height:0;border-bottom:2px solid var(--danger)}',
    '.acad-legend i.miss{border-bottom:1px dashed var(--danger)}',
    '.acad-legend i.false{border-bottom:1px solid var(--text-3)}',
    '.acad-tapres{display:grid;gap:14px;padding-top:14px;border-top:1px solid var(--border);animation:acad-in 160ms ease both}',
    '.acad-fixed{display:grid;gap:4px}',
    '.acad-fixed p{font-size:var(--t-body);line-height:21px}',
    /* ---- TASK ---- */
    '.task-bar{display:flex;flex-wrap:wrap;align-items:flex-end;gap:12px 16px;min-width:0}',
    '.task-bar .seg button{min-height:28px;padding:3px 10px;font-size:var(--t-small)}',
    '.task-f-col{flex:1 1 180px;max-width:240px}',
    '.task-f-dom{flex:1 1 200px;max-width:280px}',
    '.task-bar-new{margin-left:auto}',
    '@media (max-width:639px){.task-f-mode,.task-f-mode .seg{width:100%}.task-f-mode .seg button{flex:1 1 0}.task-f-col,.task-f-dom{flex:1 1 140px;max-width:none}.task-bar-new{margin-left:0;flex:1 1 auto}}',
    '.task-note{display:flex;flex-wrap:wrap;align-items:center;gap:6px 16px;min-width:0;margin-top:-6px;padding-bottom:16px;border-bottom:1px solid var(--border)}',
    '.task-note p{flex:1 1 320px;min-width:0;margin:0;color:var(--text-2);font-size:var(--t-small);line-height:18px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;cursor:default}',
    '.task-note p.clamp{cursor:pointer}',
    '.task-note p.open{display:block}',
    '.task-slot{display:grid;gap:16px;min-width:0}',
    '.task-brief{display:grid;gap:12px}',
    '.task-brief .kv{font-size:var(--t-small)}',
    '.task-brief ul{display:grid;gap:4px;margin:0;padding-left:1.1em;color:var(--text);font-size:var(--t-small);line-height:18px}',
    '.task-work{display:grid;min-width:0;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--panel)}',
    '.task-work > *{min-width:0}',
    '.task-work > div{display:flex}',
    '.task-work > div > *{flex:1 1 auto}',
    '@media (min-width:1200px){.task-work{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}.task-work > * + *{border-left:1px solid var(--border)}}',
    '@media (max-width:1199px){.task-work > * + *{border-top:1px solid var(--border)}}',
    '.task-pane{display:flex;flex-direction:column;gap:12px;min-width:0;padding:14px 20px 16px}',
    '@media (max-width:639px){.task-pane{padding:12px 16px 14px}}',
    '.task-pane-h{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:28px}',
    '.task-pane h2{font-size:var(--t-h2);line-height:24px;font-weight:600}',
    '.task-src-head{display:grid;gap:6px;min-width:0}',
    '.task-src-tx{color:var(--text);font-size:1rem;line-height:1.65;overflow-wrap:anywhere}',
    '.task-pane-f{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px 12px;margin-top:auto;padding-top:12px;border-top:1px solid var(--border)}',
    '.task-hints{display:grid;gap:6px}',
    '.task-hints ol{display:grid;gap:6px;margin:0;padding:0;list-style:none;counter-reset:hint}',
    '.task-hints li{position:relative;padding-left:22px;color:var(--text);font-size:var(--t-small);line-height:18px;animation:acad-in 160ms ease both}',
    '.task-hints li::before{counter-increment:hint;content:counter(hint);position:absolute;left:0;top:0;color:var(--text-3);font:500 var(--t-micro)/18px var(--f-mono)}',
    '.task-cost{margin-left:2px;color:var(--text-3);font:500 var(--t-micro)/1 var(--f-mono)}',
    '.task-tr-h{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}',
    '.task-field{display:grid;gap:6px;flex:1 1 auto;min-width:0}',
    '.task-ta{min-height:176px;height:100%;font-size:1rem;line-height:1.65;resize:vertical}',
    '.task-keys{display:inline-flex;align-items:center;gap:4px;color:var(--text-3);font-size:var(--t-caption)}',
    '@media (hover:none){.task-keys{display:none}}',
    '@media (max-width:479px){.task-pane-f > .btn-primary{flex:1 1 100%}}',
    '.task-res-slot:empty{display:none}',
    '.task-res,.task-res-sk{display:grid;gap:20px;min-width:0}',
    '.task-res-sk .acad-panel{display:grid;gap:10px}',
    '.task-verdict{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px 32px;align-items:start;padding:16px 20px;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--panel)}',
    '.task-verdict:focus{outline:none}',
    '.task-verdict:focus-visible{outline:2px solid var(--focus);outline-offset:2px}',
    '.task-vtx{display:grid;gap:6px;min-width:0}',
    '.task-vtx h2{font-size:var(--t-h2);line-height:24px;font-weight:600}',
    '.task-vtx p{color:var(--text-2);font-size:var(--t-body);line-height:21px;max-width:70ch}',
    '.task-score{display:grid;justify-items:end;align-content:start;gap:6px;text-align:right}',
    '.task-score-n{font-size:var(--t-display);line-height:34px;font-weight:600;letter-spacing:-.01em;font-variant-numeric:tabular-nums}',
    '.task-score-n small{margin-left:2px;color:var(--text-3);font-size:var(--t-small);font-weight:500;letter-spacing:0}',
    '.task-grade-w{color:var(--text-2);font-size:var(--t-small);line-height:18px}',
    '@media (max-width:639px){.task-verdict{grid-template-columns:minmax(0,1fr)}.task-score{grid-row:1;display:flex;flex-wrap:wrap;align-items:baseline;justify-items:start;gap:4px 12px;text-align:left}}',
    '.task-res-grid{display:grid;gap:20px;min-width:0}',
    '@media (min-width:1200px){.task-res-grid.two{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}}',
    '.task-rub-row{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:baseline;gap:6px 12px;padding:9px 0;border-top:1px solid var(--border)}',
    '.task-rub-row:first-child{border-top:0;padding-top:0}',
    '.task-rub-row .acad-bar{grid-column:1 / -1}',
    '.task-rub-n{font-size:var(--t-small);line-height:18px}',
    '.task-rub-v{color:var(--text-3);font:500 var(--t-caption)/16px var(--f-mono)}',
    '.task-rub-v b{color:var(--text);font-weight:600}',
    '.task-model-tx{color:var(--text);font-size:1rem;line-height:1.65}',
    '.task-model .acad-note{margin-top:10px}',
    '.task-model .acad-credit{margin-top:6px}',
    '.task-next{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px}',
    '@media (max-width:479px){.task-next .btn{flex:1 1 100%}}',
    '.task-hunt{display:grid;gap:14px;min-width:0;padding:16px 20px;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--panel)}',
    '@media (max-width:639px){.task-hunt{padding:14px 16px}}',
    '.task-hunt-h{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}',
    '.task-hunt-h > div{display:grid;gap:2px;min-width:0}',
    '.task-hunt-h h2{font-size:var(--t-h2);line-height:24px;font-weight:600}',
    '.task-hunt-sheet{display:grid;gap:16px;min-width:0}',
    '.task-hunt-sheet .task-hunt{padding:0;border:0;background:none}',
    '.task-gl{display:grid;gap:4px;min-width:0}',
    '.task-gl-h{display:flex;align-items:center;gap:8px;margin:14px 0 4px;color:var(--text);font-size:var(--t-small);font-weight:600}',
    '.task-gl-h svg{width:16px;height:16px;color:var(--text-2)}',
    '.task-gl-h small{margin-left:auto;color:var(--text-3);font:500 var(--t-caption)/1 var(--f-mono)}',
    '.task-gl-l{display:grid;margin:0;border:1px solid var(--border);border-radius:var(--r-sm);overflow:hidden}',
    '.task-gl-r{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.2fr);gap:4px 16px;padding:8px 12px;border-top:1px solid var(--border);font-size:var(--t-small);line-height:18px}',
    '.task-gl-r:first-child{border-top:0}',
    '.task-gl-r dt{margin:0;color:var(--text-2);overflow-wrap:anywhere}',
    '.task-gl-r dd{display:grid;gap:2px;margin:0;min-width:0;overflow-wrap:anywhere}',
    '.task-gl-r dd b{font-weight:500}',
    '.task-gl-r dd small{color:var(--text-3);font-size:var(--t-caption);line-height:16px}',
    '@media (max-width:420px){.task-gl-r{grid-template-columns:minmax(0,1fr)}}',
    /* ---- PRACTICE ---- */
    '.practice-list{min-width:0;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--panel);overflow:hidden}',
    '.practice-lh{display:none}',
    '.practice-row{display:grid;grid-template-columns:28px minmax(0,1fr) auto 14px;align-items:center;gap:4px 14px;width:100%;min-height:56px;padding:10px 16px;border:0;border-bottom:1px solid var(--border);background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer;transition:background-color var(--t-fast) ease}',
    '.practice-row:last-child{border-bottom:0}',
    '@media (hover:hover){.practice-row:hover{background:var(--hover)}}',
    '.practice-row:focus-visible{outline:2px solid var(--focus);outline-offset:-2px}',
    '.practice-ic{width:28px;height:28px;display:grid;place-items:center;border:1px solid var(--border);border-radius:var(--r-xs);color:var(--text-2)}',
    '.practice-ic svg{width:16px;height:16px}',
    '.practice-tx{display:grid;gap:2px;min-width:0}',
    '.practice-tx b{font-size:var(--t-body);line-height:20px;font-weight:600}',
    '.practice-tx small{color:var(--text-2);font-size:var(--t-small);line-height:18px}',
    '.practice-m{margin-top:2px;font-size:var(--t-caption);line-height:16px}',
    '.practice-skill,.practice-diff{display:none}',
    '.practice-best{color:var(--text);font:500 var(--t-caption)/16px var(--f-mono);text-align:right;white-space:nowrap}',
    '.practice-best.none{color:var(--text-3)}',
    '.practice-chev{display:inline-flex;color:var(--text-3)}',
    '.practice-chev svg{width:14px;height:14px}',
    '.practice-diff{align-items:center;gap:8px;color:var(--text-2);font-size:var(--t-small)}',
    '.practice-diff-b{display:inline-flex;align-items:flex-end;gap:2px;height:12px}',
    '.practice-diff-b i{width:3px;border-radius:1px;background:var(--border-2)}',
    '.practice-diff-b i:nth-child(1){height:6px}',
    '.practice-diff-b i:nth-child(2){height:9px}',
    '.practice-diff-b i:nth-child(3){height:12px}',
    '.practice-diff-b i.on{background:var(--text-2)}',
    '@media (min-width:900px){',
    '.practice-lh,.practice-row{grid-template-columns:28px minmax(0,1fr) 150px 96px 104px 14px}',
    '.practice-lh{display:grid;align-items:center;gap:14px;padding:8px 16px;border-bottom:1px solid var(--border);background:var(--sunken);color:var(--text-2);font:600 var(--t-micro)/14px var(--f-body);letter-spacing:.04em;text-transform:uppercase}',
    '.practice-lh > :nth-child(5){text-align:right}',
    '.practice-skill{display:block;color:var(--text-2);font-size:var(--t-small);line-height:18px}',
    '.practice-diff{display:inline-flex}',
    '.practice-m{display:none}',
    '}',
    '.practice-det{display:grid;gap:14px;min-width:0;padding:16px 20px;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--panel);scroll-margin-top:calc(var(--hdr-h) + 16px)}',
    '@media (max-width:639px){.practice-det{padding:14px 16px}}',
    '.practice-det-h{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}',
    '.practice-det-h > div{display:grid;gap:2px;min-width:0}',
    '.practice-det-h h2{font-size:var(--t-h2);line-height:24px;font-weight:600}',
    '.practice-q{display:grid;gap:16px}',
    '.practice-q-top{display:flex;align-items:center;gap:12px}',
    '.practice-q-top .acad-bar{flex:1}',
    '.practice-q-score{color:var(--text-2);font-size:var(--t-small);white-space:nowrap}',
    '.practice-q-sit{display:grid;gap:2px;padding:10px 14px;border-left:2px solid var(--border-2);border-radius:0 var(--r-xs) var(--r-xs) 0;background:var(--sunken)}',
    '.practice-q-sit b{font-weight:600;font-size:var(--t-body)}',
    '.practice-q-src{display:grid;gap:4px}',
    '.practice-q-src p{color:var(--text);font-size:1rem;line-height:1.6}',
    '.practice-q-term{padding:12px 0;font-size:var(--t-display);line-height:34px;font-weight:600;letter-spacing:-.01em;text-align:center}',
    '.practice-q-sent{font-size:1.0625rem;line-height:1.7}',
    '.practice-q-mark{padding:0 3px;border-radius:3px;background:var(--accent-t);color:inherit;box-shadow:inset 0 -2px 0 var(--accent)}',
    '.practice-q-ask{font-size:var(--t-body);font-weight:600}',
    '.practice-opts{display:grid;gap:8px}',
    '.choice.practice-opt{align-items:center;gap:12px;padding-block:11px}',
    '.practice-opt-k{flex:none;width:22px;height:22px;display:grid;place-items:center;border:1px solid var(--border-2);border-radius:4px;color:var(--text-2);font:500 var(--t-caption)/1 var(--f-mono)}',
    '.choice.practice-opt b{font-size:var(--t-body);font-weight:500;line-height:21px}',
    '.practice-opts.locked .choice{pointer-events:none}',
    '.choice.practice-opt.right{border-color:var(--success);background:var(--success-t)}',
    '.choice.practice-opt.right::after{border-color:var(--success);background:var(--success)}',
    '.choice.practice-opt.right::before{content:"";position:absolute;top:50%;right:18px;z-index:1;width:10px;height:10px;margin-top:-5px;background:var(--panel);-webkit-mask:var(--m-check) center/contain no-repeat;mask:var(--m-check) center/contain no-repeat}',
    '.choice.practice-opt.wrong{border-color:var(--danger);background:var(--danger-t)}',
    '.choice.practice-opt.wrong::after{border-color:var(--danger);background:var(--danger)}',
    '.choice.practice-opt.dim{opacity:.6}',
    '.practice-q-fb{display:grid;gap:12px}',
    '.practice-q-fb:empty{display:none}',
    '.practice-fb{padding:10px 14px;border-left:2px solid var(--success);border-radius:0 var(--r-xs) var(--r-xs) 0;background:var(--sunken);color:var(--text);font-size:var(--t-body);line-height:21px;animation:acad-in 160ms ease both}',
    '.practice-fb.bad{border-left-color:var(--danger)}',
    '.practice-fb.info{border-left-color:var(--border-2)}',
    '.practice-timer{display:flex;align-items:center;gap:10px;color:var(--text);font:500 var(--t-small)/1 var(--f-mono)}',
    '.practice-timer svg{width:16px;height:16px;color:var(--text-2)}',
    '.practice-timer .acad-bar{flex:1}',
    '.practice-timer .acad-bar > i{transition:width 1s linear}',
    '.practice-timer.low{color:var(--danger)}',
    '.practice-timer.low .acad-bar > i{background:var(--danger)}',
    '.practice-end{display:grid;justify-items:start;gap:8px}',
    '.practice-end-n{font-size:var(--t-display);line-height:34px;font-weight:600;font-variant-numeric:tabular-nums}',
    '.practice-end-n small{margin-left:4px;color:var(--text-3);font-size:var(--t-small);font-weight:500}',
    '.practice-end h3{font-size:var(--t-h2);line-height:24px}',
    '.practice-end p{max-width:52ch;color:var(--text-2);font-size:var(--t-body)}',
    '.practice-oral{display:grid;justify-items:center;gap:14px;padding-bottom:4px;text-align:center}',
    '.practice-wave{display:flex;align-items:center;justify-content:center;gap:3px;width:100%;max-width:280px;height:40px}',
    '.practice-wave i{flex:1;max-width:3px;height:16%;border-radius:2px;background:var(--border-2)}',
    '.practice-wave.on i{background:var(--accent);animation:practice-wave 1.2s ease-in-out infinite;animation-delay:calc(var(--i) * -60ms)}',
    '@keyframes practice-wave{0%,100%{height:16%}50%{height:var(--h,70%)}}',
    '.practice-mic{width:56px;height:56px;display:grid;place-items:center;border:1px solid var(--accent);border-radius:50%;background:var(--accent);color:var(--on-accent);cursor:pointer;transition:background-color var(--t-fast) ease,opacity var(--t-fast) ease}',
    '.practice-mic svg{width:22px;height:22px}',
    '.practice-mic:disabled{opacity:.5;cursor:default}',
    '.practice-mic.lac{background:var(--panel);color:var(--accent)}',
    '.practice-oral-tx{max-width:46ch;font-size:1rem;line-height:1.6}',
    '.practice-oral-tx.muted{color:var(--text-2);font-size:var(--t-body)}',
    '.practice-fb-list{display:grid;gap:8px;width:100%;text-align:left}',
    '.practice-req{display:grid;gap:4px;margin:0;padding-left:1.1em;font-size:var(--t-body)}',
    '.practice-quote{margin:0;padding:10px 14px;border-left:2px solid var(--border-2);background:var(--sunken);border-radius:0 var(--r-xs) var(--r-xs) 0;color:var(--text);font-size:var(--t-body);line-height:21px}',
    /* ---- CARDS ---- */
    '.cards-bar{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:12px 16px;min-width:0}',
    '.cards-bar .acad-field{flex:0 1 240px}',
    '.cards-sum{margin-left:auto;padding-bottom:7px}',
    '.cards-wrap{display:grid;gap:14px;width:100%;max-width:680px;margin-inline:auto;min-width:0}',
    '.cards-top{display:grid;gap:8px}',
    '.cards-count{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:6px 12px;color:var(--text-2);font-size:var(--t-small)}',
    '.cards-count .acad-mono b{color:var(--text);font-weight:600}',
    '.cards-stage{position:relative;padding-bottom:6px}',
    '.cards-stage::after{content:"";position:absolute;left:10px;right:10px;bottom:0;height:8px;border:1px solid var(--border);border-top:0;border-radius:0 0 var(--r-sm) var(--r-sm);background:var(--panel)}',
    '.cards-stage.single::after{display:none}',
    '.cards-card{position:relative;z-index:1;display:block;width:100%;min-height:336px;padding:0;border:0;border-radius:var(--r-sm);background:none;color:inherit;font:inherit;text-align:left;cursor:pointer;touch-action:pan-y;-webkit-tap-highlight-color:transparent;transition:transform 160ms ease,opacity 160ms ease}',
    '.cards-card:focus-visible{outline:2px solid var(--focus);outline-offset:3px}',
    '.cards-card.drag{transition:none}',
    '.cards-card.out-r{transform:translateX(24px);opacity:0}',
    '.cards-card.out-l{transform:translateX(-24px);opacity:0}',
    '.cards-card.in{animation:acad-in 160ms ease both}',
    '.cards-inner{display:grid;min-height:inherit}',
    '.cards-face{grid-area:1 / 1;display:flex;flex-direction:column;gap:16px;min-width:0;padding:18px 24px 16px;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--panel);transition:opacity 160ms ease,visibility 0s linear 0s}',
    '@media (max-width:639px){.cards-face{padding:16px 18px 14px}}',
    '.cards-face.back{opacity:0;visibility:hidden}',
    '.cards-card.flipped .cards-face.front{opacity:0;visibility:hidden}',
    '.cards-card.flipped .cards-face.back{opacity:1;visibility:visible}',
    '.cards-face-top{display:flex;flex-wrap:wrap;align-items:center;gap:6px 12px;padding-bottom:12px;border-bottom:1px solid var(--border)}',
    '.cards-side{color:var(--danger);font:600 var(--t-caption)/16px var(--f-body);letter-spacing:.04em;text-transform:uppercase}',
    '.cards-side.ok{color:var(--success)}',
    '.cards-tag{color:var(--text-2);font-size:var(--t-small);line-height:18px}',
    '.cards-face-top > :last-child{margin-left:auto}',
    '.cards-blk{display:grid;gap:6px;min-width:0}',
    '.cards-lbl{color:var(--text-3);font:500 var(--t-micro)/14px var(--f-body);letter-spacing:.04em;text-transform:uppercase}',
    '.cards-src{color:var(--text-2);font-size:var(--t-body);line-height:21px}',
    '.cards-sent{font-size:1.25rem;line-height:1.5;font-weight:500;letter-spacing:-.005em;overflow-wrap:anywhere}',
    '@media (min-width:640px){.cards-sent{font-size:1.375rem}}',
    '.cards-bad{color:var(--danger);text-decoration:line-through;text-decoration-thickness:1.5px}',
    'mark.cards-good{padding:0 2px;border-radius:3px;background:var(--accent-t);color:var(--accent);font-weight:600}',
    '.cards-why{display:grid;gap:4px;padding:10px 12px;border-left:2px solid var(--border-2);border-radius:0 var(--r-xs) var(--r-xs) 0;background:var(--sunken);font-size:var(--t-body);line-height:21px}',
    '.cards-foot{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:6px 12px;margin-top:auto;padding-top:12px;border-top:1px solid var(--border);color:var(--text-3);font-size:var(--t-caption);line-height:16px}',
    '.cards-box{display:inline-flex;align-items:center;gap:6px;color:var(--text-2);font:500 var(--t-caption)/16px var(--f-mono)}',
    '.cards-pips{display:inline-flex;gap:2px}',
    '.cards-pips i{width:10px;height:4px;border-radius:1px;background:var(--border-2)}',
    '.cards-pips i.on{background:var(--accent)}',
    '.cards-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}',
    '.cards-actions .btn,.cards-flip{min-height:40px}',
    '.cards-actions .kbd,.cards-flip .kbd{margin-left:8px}',
    '.cards-actions .btn-primary .kbd{border-color:color-mix(in srgb,var(--on-accent) 45%,transparent);color:inherit;background:transparent}',
    '.cards-keys{display:flex;flex-wrap:wrap;justify-content:center;gap:4px 16px;color:var(--text-3);font-size:var(--t-caption)}',
    '.cards-keys span{display:inline-flex;align-items:center;gap:6px}',
    '@media (hover:none){.cards-keys{display:none}}',
    '.cards-done{display:grid;gap:12px}',
    '.cards-done h2{font-size:var(--t-h2);line-height:24px;font-weight:600}',
    '.cards-done p{color:var(--text-2);font-size:var(--t-body)}',
    '.cards-boxes{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));min-width:0;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--panel);overflow:hidden}',
    '.cards-bx{display:grid;gap:4px;min-width:0;padding:12px 14px;box-shadow:-1px 0 0 var(--border)}',
    '.cards-bx span{color:var(--text-2);font-size:var(--t-caption);line-height:16px}',
    '.cards-bx b{font-size:var(--t-h2);line-height:24px;font-weight:600;font-variant-numeric:tabular-nums}',
    '.cards-bx small{color:var(--text-3);font-size:var(--t-caption);line-height:16px}',
    '.cards-bx .acad-bar{margin-top:4px}',
    '@media (max-width:639px){.cards-bx{padding:10px 8px}.cards-bx small{display:none}}',
    '.cards-note{color:var(--text-2);font-size:var(--t-small);line-height:18px}',
    /* ---- PROGRESS ---- */
    '.progress-sum{display:grid;gap:14px;padding-bottom:0;overflow:hidden}',
    '.progress-rank-row{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:6px 16px}',
    '.progress-rank-row > div{display:grid;gap:2px}',
    '.progress-rank{font-size:var(--t-h2);line-height:24px;font-weight:600}',
    '.progress-xp{color:var(--text-2);font:500 var(--t-small)/18px var(--f-mono)}',
    '.progress-next{display:grid;gap:6px}',
    '.progress-next p{color:var(--text-2);font-size:var(--t-small);line-height:18px}',
    '.progress-ladder{display:flex;gap:4px;margin:0;padding:0;list-style:none}',
    '.progress-ladder li{flex:1;min-width:0;display:grid;gap:4px;padding-top:6px;border-top:2px solid var(--border);color:var(--text-3);font-size:var(--t-caption);line-height:16px}',
    '.progress-ladder li span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.progress-ladder li.done{border-top-color:var(--accent-line);color:var(--text-2)}',
    '.progress-ladder li.cur{border-top-color:var(--accent);color:var(--text);font-weight:600}',
    '.progress-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));margin:0 -20px;border-top:1px solid var(--border)}',
    '.progress-kpi{display:grid;gap:2px;min-width:0;padding:12px 20px;box-shadow:-1px 0 0 var(--border)}',
    '.progress-kpi span{color:var(--text-2);font-size:var(--t-caption);line-height:16px}',
    '.progress-kpi b{font-size:var(--t-h2);line-height:24px;font-weight:600;font-variant-numeric:tabular-nums}',
    '.progress-kpi b small{margin-left:3px;color:var(--text-3);font-size:var(--t-caption);font-weight:500}',
    '@media (max-width:639px){.progress-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.progress-kpi:nth-child(n+3){border-top:1px solid var(--border)}.progress-kpi{padding:10px 16px}.progress-kpis{margin:0 -20px}}',
    '.progress-grid{display:grid;gap:20px;min-width:0}',
    '@media (min-width:1200px){.progress-grid.two{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}}',
    '.progress-tw{min-width:0;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--panel);overflow-x:auto}',
    '.progress-t{width:100%;border-collapse:collapse;font-size:var(--t-small);line-height:18px}',
    '.progress-t th{padding:8px 12px;border-bottom:1px solid var(--border);background:var(--sunken);color:var(--text-2);font:600 var(--t-micro)/14px var(--f-body);letter-spacing:.04em;text-transform:uppercase;text-align:left;white-space:nowrap}',
    '.progress-t td{padding:9px 12px;border-bottom:1px solid var(--border);vertical-align:middle}',
    '.progress-t tbody tr:last-child td{border-bottom:0}',
    '.progress-t .num{text-align:right;font-family:var(--f-mono);font-size:var(--t-caption);font-variant-numeric:tabular-nums;white-space:nowrap}',
    '.progress-t td.bar{width:22%;min-width:72px}',
    '.progress-t td small{display:block;color:var(--text-3);font-size:var(--t-caption);line-height:16px}',
    '.progress-t tr.clickable{cursor:pointer;transition:background-color var(--t-fast) ease}',
    '@media (hover:hover){.progress-t tr.clickable:hover{background:var(--hover)}}',
    '.progress-t .acad-lv{margin-right:0}',
    '.progress-d{font-family:var(--f-mono);font-size:var(--t-caption);white-space:nowrap}',
    '.progress-d.up{color:var(--success)}',
    '.progress-d.dn{color:var(--danger)}',
    '.progress-d.eq{color:var(--text-3)}',
    '@media (max-width:639px){.progress-t .hide-sm{display:none}.progress-t td,.progress-t th{padding-inline:10px}}',
    '.progress-more{justify-self:start}',
    '.progress-chart{position:relative;min-width:0}',
    '.progress-chart svg{display:block;width:100%;height:auto;overflow:visible}',
    '.progress-chart:focus-visible{outline:2px solid var(--focus);outline-offset:4px;border-radius:var(--r-xs)}',
    '.progress-svg .g{fill:none;stroke:var(--border);stroke-width:1}',
    '.progress-svg .ln{fill:none;stroke:var(--accent);stroke-width:1.5;stroke-linejoin:round;stroke-linecap:round}',
    '.progress-svg .d{fill:var(--panel);stroke:var(--accent);stroke-width:1.5}',
    '.progress-svg .hit{fill:transparent;cursor:crosshair;outline:none}',
    '.progress-svg text{font-family:var(--f-mono);font-size:10.5px;fill:var(--text-3)}',
    '.progress-svg .end{font-family:var(--f-mono);font-size:12px;font-weight:600;fill:var(--text)}',
    '.progress-svg .cx{stroke:var(--border-2);stroke-width:1;opacity:0;transition:opacity var(--t-fast) ease}',
    '.progress-svg .cx.on{opacity:1}',
    '.progress-tip{position:absolute;left:0;top:0;z-index:2;min-width:132px;max-width:220px;padding:8px 10px;border:1px solid var(--border);border-radius:var(--r-xs);background:var(--panel);color:var(--text);box-shadow:var(--sh-2);font-size:var(--t-caption);line-height:16px;pointer-events:none;opacity:0;transform:translate(-50%,calc(-100% - 10px));transition:opacity var(--t-fast) ease}',
    '.progress-tip.on{opacity:1}',
    '.progress-tip b{display:block;font:600 var(--t-small)/18px var(--f-mono)}',
    '.progress-tip span{display:block;color:var(--text-2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.progress-ms-l{display:grid;margin:0;padding:0;list-style:none}',
    '.progress-ms-row{display:grid;grid-template-columns:28px minmax(0,1fr) auto;align-items:center;gap:4px 12px;width:100%;padding:10px 0;border:0;background:transparent;color:inherit;font:inherit;text-align:left}',
    '.progress-ms-l > li + li{border-top:1px solid var(--border)}',
    '.progress-ms-l > li:first-child,.progress-ms-l > li:first-child > .progress-ms-row{padding-top:0}',
    'button.progress-ms-row{cursor:pointer;transition:background-color var(--t-fast) ease}',
    '@media (hover:hover){button.progress-ms-row:hover{background:var(--hover)}}',
    '.progress-ms-row .practice-ic.ok{color:var(--success);border-color:color-mix(in srgb,var(--success) 40%,var(--border))}',
    '.progress-ms-tx{display:grid;gap:3px;min-width:0}',
    '.progress-ms-tx b{font-size:var(--t-small);line-height:18px;font-weight:600}',
    '.progress-ms-tx small{color:var(--text-2);font-size:var(--t-caption);line-height:16px}',
    '.progress-ms-tx .acad-bar{max-width:220px}',
    '.progress-ms-end{display:inline-flex;align-items:center;gap:8px;color:var(--text-2);font:500 var(--t-caption)/16px var(--f-mono);white-space:nowrap}',
    '.progress-ms-end svg{width:14px;height:14px;color:var(--text-3)}',
    '.progress-week-card{display:grid;gap:10px;align-content:start}',
    '.progress-week-card h3{font-size:var(--t-h3);line-height:20px;font-weight:600}',
    '.progress-week-card p{color:var(--text-2);font-size:var(--t-small);line-height:18px}',
    '.progress-week-meta{display:flex;justify-content:space-between;gap:8px;color:var(--text-2);font:500 var(--t-caption)/16px var(--f-mono)}',
    '.progress-week-card .btn,.progress-week-card .acad-status{justify-self:start}',
    /* ---- LESSONS ---- */
    '.lessons-bar{display:flex;flex-wrap:wrap;align-items:flex-end;gap:12px 16px;min-width:0;padding-bottom:16px;border-bottom:1px solid var(--border)}',
    '.lessons-bar .seg button{min-height:28px;padding:3px 10px;font-size:var(--t-small)}',
    '.lessons-f-q{flex:1 1 220px;min-width:0}',
    '.lessons-f-q .input{height:32px;min-height:32px}',
    '.lessons-f-sel{flex:0 1 150px}',
    '@media (max-width:639px){.lessons-f-col,.lessons-f-col .seg{width:100%}.lessons-f-col .seg button{flex:1 1 0;padding-inline:6px}.lessons-f-sel{flex:1 1 120px}}',
    '.lessons-grp{min-width:0;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--panel);overflow:hidden}',
    '.lessons-gh{display:flex;flex-wrap:wrap;align-items:center;gap:6px 14px;padding:10px 16px;border-bottom:1px solid var(--border);background:var(--sunken)}',
    '.lessons-gh svg{width:16px;height:16px;color:var(--text-2)}',
    '.lessons-gh h3{flex:1 1 auto;min-width:0;font-size:var(--t-h3);line-height:20px;font-weight:600}',
    '.lessons-gh .acad-bar{width:72px}',
    '.lessons-row{display:grid;grid-template-columns:30px minmax(0,1fr) auto 14px;align-items:center;gap:4px 14px;width:100%;min-height:48px;padding:9px 16px;border:0;border-bottom:1px solid var(--border);background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer;transition:background-color var(--t-fast) ease}',
    '.lessons-row:last-child{border-bottom:0}',
    '@media (hover:hover){.lessons-row:hover{background:var(--hover)}}',
    '.lessons-row:focus-visible{outline:2px solid var(--focus);outline-offset:-2px}',
    '.lessons-t{display:grid;gap:1px;min-width:0}',
    '.lessons-t b{font-size:var(--t-body);line-height:20px;font-weight:500}',
    '.lessons-t small{color:var(--text-2);font-size:var(--t-caption);line-height:16px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.lessons-len{display:none;color:var(--text-3);font:500 var(--t-caption)/16px var(--f-mono);text-align:right;white-space:nowrap}',
    '.lessons-st{justify-self:end;display:inline-flex;align-items:center;gap:8px;color:var(--text-3);font-size:var(--t-caption);line-height:16px;white-space:nowrap}',
    '.lessons-st.prog{color:var(--accent);font-weight:500}',
    '.lessons-st.done{color:var(--text)}',
    '.lessons-st.done svg{width:14px;height:14px;color:var(--success)}',
    '.lessons-sc{font:600 var(--t-caption)/16px var(--f-mono)}',
    '.lessons-gr{color:var(--text-2);font:500 var(--t-caption)/16px var(--f-mono)}',
    '.lessons-chev{display:inline-flex;color:var(--text-3)}',
    '.lessons-chev svg{width:14px;height:14px}',
    '@media (min-width:900px){.lessons-row{grid-template-columns:30px minmax(0,1fr) 124px 112px 14px}.lessons-len{display:block}}',
    '.lessons-th-ic{width:30px;display:inline-flex;justify-content:center;color:var(--text-2)}',
    '.lessons-th-ic svg{width:16px;height:16px}',
    '.lessons-back{justify-self:start;margin-bottom:-8px}',
    '.lessons-ls{display:grid;gap:24px;width:100%;max-width:800px;min-width:0}',
    '.lessons-ls-sec{display:grid;gap:10px;min-width:0}',
    '.lessons-ls-sec > h2{font-size:var(--t-h2);line-height:24px;font-weight:600}',
    '.lessons-rule{padding:12px 16px;border:1px solid var(--border);border-left:2px solid var(--accent);border-radius:0 var(--r-sm) var(--r-sm) 0;background:var(--panel);font-size:var(--t-body);line-height:21px}',
    '.lessons-ex{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:4px 24px;padding:12px 0;border-top:1px solid var(--border)}',
    '.lessons-ex:last-child{border-bottom:1px solid var(--border)}',
    '.lessons-ex p{font-size:var(--t-body);line-height:21px;overflow-wrap:anywhere}',
    '.lessons-ex .src{color:var(--text-2)}',
    '.lessons-ex small{grid-column:1 / -1;color:var(--text-3);font-size:var(--t-caption);line-height:16px}',
    '@media (max-width:639px){.lessons-ex{grid-template-columns:minmax(0,1fr)}}',
    '.lessons-pit{display:grid;gap:2px;padding:10px 0;border-top:1px solid var(--border);font-size:var(--t-body);line-height:21px}',
    '.lessons-pit:last-child{border-bottom:1px solid var(--border)}',
    '.lessons-pit > span{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 10px}',
    '.lessons-pit small{color:var(--text-2);font-size:var(--t-small);line-height:18px}',
    '.lessons-q{display:grid;gap:8px;padding:12px 0;border-top:1px solid var(--border)}',
    '.lessons-q > p{font-size:var(--t-body);line-height:21px;font-weight:500}',
    '.lessons-sum{padding:12px 16px;border:1px solid var(--border);border-radius:var(--r-sm);background:var(--sunken);font-size:var(--t-body);line-height:21px}',
    '.lessons-res{display:grid;gap:8px}',
    '.lessons-res:empty{display:none}',
    /* ---- GLOSSARY ---- */
    '.glossary-layout{display:grid;gap:16px;min-width:0}',
    '@media (min-width:1100px){.glossary-layout{grid-template-columns:220px minmax(0,1fr);align-items:start;gap:24px}}',
    '.glossary-doms{display:none}',
    '@media (min-width:1100px){.glossary-doms{display:grid;gap:1px;position:sticky;top:calc(var(--hdr-h) + 16px)}.glossary-sel{display:none}}',
    '.glossary-dom{display:flex;align-items:center;gap:10px;width:100%;min-height:32px;padding:6px 10px;border:0;border-radius:var(--r-xs);background:transparent;color:var(--text-2);font:500 var(--t-small)/18px var(--f-body);text-align:left;cursor:pointer;transition:background-color var(--t-fast) ease,color var(--t-fast) ease}',
    '.glossary-dom svg{width:16px;height:16px;flex:none}',
    '.glossary-dom span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.glossary-dom small{color:var(--text-3);font:500 var(--t-micro)/14px var(--f-mono)}',
    '@media (hover:hover){.glossary-dom:hover{background:var(--hover);color:var(--text)}}',
    '.glossary-dom[aria-pressed="true"]{background:var(--selected);color:var(--text);font-weight:600}',
    '.glossary-dom[aria-pressed="true"] svg{color:var(--accent)}',
    '.glossary-dom:focus-visible{outline:2px solid var(--focus);outline-offset:-2px}',
    '.glossary-main{display:grid;gap:12px;min-width:0}',
    '.glossary-tools{display:flex;flex-wrap:wrap;align-items:flex-end;gap:10px 12px}',
    '.glossary-tools .input-ic{flex:1 1 260px;min-width:0}',
    '.glossary-tools .input{height:32px;min-height:32px}',
    '.glossary-sel{flex:1 1 200px}',
    '.glossary-why{color:var(--text-2);font-size:var(--t-small);line-height:18px;max-width:80ch}',
    '.glossary-t td.en{width:34%;color:var(--text-2)}',
    '.glossary-t td.az{width:30%;color:var(--text);font-weight:500}',
    '.glossary-t td.nt{color:var(--text-2);font-size:var(--t-caption);line-height:16px}',
    '.glossary-t tr.grp td{padding:7px 12px;background:var(--sunken);color:var(--text-2);font:600 var(--t-micro)/14px var(--f-body);letter-spacing:.04em;text-transform:uppercase}',
    '.glossary-t tr.grp td span{margin-left:8px;color:var(--text-3);font-family:var(--f-mono);letter-spacing:0}',
    '@media (max-width:639px){',
    '.glossary-t thead{display:none}',
    '.glossary-t tr{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:2px 12px;padding:9px 12px;border-bottom:1px solid var(--border)}',
    '.glossary-t tbody tr:last-child{border-bottom:0}',
    '.glossary-t td{display:block;width:auto!important;padding:0;border:0}',
    '.glossary-t td.nt{grid-column:1 / -1}',
    '.glossary-t td.nt:empty{display:none}',
    '.glossary-t tr.grp{display:block;padding:0}',
    '.glossary-t tr.grp td{display:block;padding:7px 12px}',
    '}',
    '@media (prefers-reduced-motion:reduce){',
    '.acad-page *,.practice-q *,.practice-oral *,.task-hunt-sheet *{animation-duration:1ms!important;animation-iteration-count:1!important;transition-duration:1ms!important}',
    '.practice-wave.on i{animation:none;height:40%}',
    '}'
  ].join('\n');

  /* ------------------------------------------------------------------
     5a. SHARED VIEW PIECES — academy sub-navigation, meta lines,
         severity labels, professional review rows
     ------------------------------------------------------------------ */
  var NAV = [
    { id: 'task', t: 'Tapşırıq' }, { id: 'lessons', t: 'Dərslər' }, { id: 'practice', t: 'Məşq' },
    { id: 'cards', t: 'Kartlar' }, { id: 'glossary', t: 'Lüğət' }, { id: 'progress', t: 'İnkişaf' }
  ];
  function acadNav(cur) {
    var nav = h('nav', { class: 'acad-nav', 'aria-label': 'Akademiya bölmələri' });
    NAV.forEach(function (it) {
      if (it.id !== cur && !hasScreen(it.id)) return;
      var n = it.id === 'cards' ? dueCount() : 0;
      var a = h('a', { href: '#' + it.id, 'aria-current': it.id === cur ? 'page' : null }, it.t,
        n ? h('span', { class: 'acad-nav-n', title: n + ' kart təkrar gözləyir', text: String(n) }) : null);
      a.addEventListener('click', function (e) { e.preventDefault(); App.go(it.id); });
      nav.appendChild(a);
    });
    return nav;
  }
  function pageHead(title, sub, actions) {
    var acts = (actions || []).filter(Boolean);
    return h('div', { class: 'page-h' },
      h('div', null, h('h1', { text: title }), sub ? h('p', { text: sub }) : null),
      acts.length ? h('div', { class: 'actions' }, acts) : null);
  }
  function metaLine(items, cls) {
    return h('div', { class: 'acad-meta' + (cls ? ' ' + cls : '') }, items.filter(function (x) { return x !== null && x !== undefined && x !== ''; })
      .map(function (x) { return typeof x === 'object' && x.nodeType ? x : h('span', { text: String(x) }); }));
  }
  function lvTag(id) { var lv = levelById(id); return h('span', { class: 'acad-lv', title: lv ? lv.id + ' · ' + lv.name : String(id || ''), text: String(id || '—') }); }
  function sevTag(sev) { return h('span', { class: 'acad-sev', 'data-sev': sev || 'mid' }, h('i', { 'aria-hidden': 'true' }), SEV_LABEL[sev] || SEV_LABEL.mid); }
  function initials(name) { var p = String(name || '').trim().split(/\s+/); return upper((p[0] || '').charAt(0) + (p[1] || '').charAt(0)); }
  function whoTag(name) {
    if (!name) return null;
    return h('span', { class: 'acad-who' }, h('span', { class: 'acad-av', 'aria-hidden': 'true', text: initials(name) }), h('span', { text: name }));
  }
  function statusPill(text, kind) { return h('span', { class: 'acad-status' + (kind ? ' ' + kind : ''), text: text }); }
  function bar(pct, label) {
    pct = clamp(Math.round(Number(pct) || 0), 0, 100);
    var a = label ? { class: 'acad-bar', role: 'progressbar', 'aria-label': label, 'aria-valuenow': pct, 'aria-valuemin': 0, 'aria-valuemax': 100 } : { class: 'acad-bar', 'aria-hidden': 'true' };
    return h('div', a, h('i', { style: 'width:' + pct + '%' }));
  }
  function field(label, ctl, cls) { return h('label', { class: 'acad-field' + (cls ? ' ' + cls : '') }, h('span', { text: label }), ctl); }
  function statLine(items) {
    return h('div', { class: 'acad-stats' }, items.map(function (it) {
      return h('div', { class: 'acad-stat' }, h('span', { text: it.l }), h('b', { text: String(it.v) }));
    }));
  }
  function emptyNote(title, text, actions) {
    var acts = (actions || []).filter(Boolean);
    return h('div', { class: 'acad-empty' }, h('b', { text: title }), text ? h('p', { text: text }) : null, acts.length ? h('div', { class: 'acad-act' }, acts) : null);
  }

  /* source sentence for a finding — only when the sentences of source and
     translation line up one to one (otherwise the column is left out) */
  function sentences(t) { return String(t || '').split(/(?<=[.!?…]["»”’)]?)\s+/u).map(function (s) { return s.trim(); }).filter(Boolean); }
  function srcFor(src, text, frag) {
    if (!frag) return '';
    var S = sentences(src), X = sentences(text);
    if (S.length < 2 || S.length !== X.length) return '';
    for (var i = 0; i < X.length; i++) if (X[i].indexOf(frag) >= 0) return S[i];
    return '';
  }
  /* one finding: severity · (source) · translation · correction · issue · reviewer */
  function reviewRow(o) {
    var row = h('li', { class: 'acad-rv-row' + (o.cls ? ' ' + o.cls : ''), 'data-sev': o.sev || 'mid' });
    row.appendChild(h('div', { class: 'acad-rv-sev' }, sevTag(o.sev), h('span', { class: 'acad-rv-type', text: o.type || '' })));
    if (o.withSrc) {
      row.appendChild(h('div', { class: 'acad-rv-c acad-rv-src' }, h('span', { class: 'acad-rv-lbl', text: 'Mənbə' }),
        h('span', { lang: o.srcLang || 'en', title: o.src || null, text: o.src || '—' })));
    }
    row.appendChild(h('div', { class: 'acad-rv-c acad-rv-was' }, h('span', { class: 'acad-rv-lbl', text: 'Tərcümədə' }),
      o.missing ? h('span', { class: 'acad-miss', text: o.was }) : h('s', { class: 'acad-was', lang: 'az', text: o.was })));
    row.appendChild(h('div', { class: 'acad-rv-c acad-rv-now' }, h('span', { class: 'acad-rv-lbl', text: 'Düzəliş' }),
      h('b', { class: 'acad-now', lang: 'az', text: o.now })));
    row.appendChild(h('div', { class: 'acad-rv-c acad-rv-why' }, h('span', { class: 'acad-rv-lbl', text: 'Problem' }), h('p', { text: o.why || '' })));
    row.appendChild(h('div', { class: 'acad-rv-who' }, whoTag(o.who)));
    row.appendChild(h('div', { class: 'acad-rv-act' }, o.act || null));
    row.appendChild(h('div', { class: 'acad-rv-ext' }, o.ext || null));
    return row;
  }
  function reviewList(rows, withSrc, label) {
    return h('div', { class: 'acad-rv' + (withSrc ? ' with-src' : '') },
      h('div', { class: 'acad-rv-h', 'aria-hidden': 'true' },
        h('span', { text: 'Ciddilik' }), withSrc ? h('span', { text: 'Mənbə' }) : null,
        h('span', { text: 'Tərcümədə' }), h('span', { text: 'Düzəliş' }), h('span', { text: 'Problem' }), h('span', { text: 'Rəyçi' })),
      h('ol', { class: 'acad-rv-l', 'aria-label': label || 'Qeydlər' }, rows));
  }

  /* ------------------------------------------------------------------
     5. TASK SCREEN
     ------------------------------------------------------------------ */
  var T = null;

  function renderTask(page, params) {
    var lvParam = params.level && levelById(params.level) ? params.level : null;
    T = { page: page, task: null, hints: 0, result: null, checking: false, level: lvParam || sget('academy:level', 'B2'), lastChecked: null,
      mode: params.mode === 'hunt' || params.mode === 'tr' ? params.mode : sget('academy:tmode', 'tr'), col: sget('academy:col', 'base'), hunt: null,
      dom: sget('academy:dom', '') };
    if (!levelById(T.level)) T.level = 'B2';
    if (T.mode !== 'hunt' || !HUNT.length) T.mode = 'tr';
    if (!COLS.some(function (c) { return c.id === T.col; })) T.col = 'base';
    if (params.col && COLS.some(function (c) { return c.id === params.col; })) { T.col = params.col; T.mode = 'tr'; T.dom = ''; }
    if (params.dom && domByKey(params.dom)) { T.dom = params.dom; T.col = 'base'; T.mode = 'tr'; }
    if (!domByKey(T.dom)) T.dom = '';
    if (T.dom && T.col !== 'base') T.dom = '';
    var custom = null;
    if (params.custom) {
      custom = customFrom(sget('academy:custom', null));
      try { if (App.store.remove) App.store.remove('academy:custom'); else sset('academy:custom', null); } catch (e) { sset('academy:custom', null); }
      if (custom) { CUSTOM = custom; sset('academy:customTask', custom); T.mode = 'tr'; T.col = 'base'; T.dom = ''; }
      else later(function () { App.toast('Kitabxana mətni tapılmadı', 'info', { sub: 'Kitabxanada parçanı seçib «Tapşırığa çevir» düyməsinə yenidən toxunun' }); }, 300);
    }

    page.appendChild(acadNav('task'));
    var nCards = userCards().length;
    page.appendChild(pageHead('Tapşırıq', 'Mətni oxuyun, öz variantınızı yazın — Mirzə Məclisi yoxlayıb hər qeydi izah edəcək.', [
      hasScreen('lessons') ? h('button', { class: 'btn btn-ghost', type: 'button', onclick: function () { App.go('lessons'); } }, ie('list'), 'Bütün tapşırıqlar') : null,
      nCards ? h('button', { class: 'btn btn-ghost', type: 'button', onclick: function () { App.go('cards'); } }, ie('cards'), 'Səhv kartları', h('span', { class: 'acad-count', text: String(nCards) })) : null
    ]));

    T.getCard = toolbar();
    page.appendChild(T.getCard);
    page.appendChild(T.noteRow);
    T.briefSlot = h('div', { class: 'task-slot', hidden: true });
    page.appendChild(T.briefSlot);
    T.srcSlot = h('div', { class: 'task-src-slot' });
    T.trCard = translationCard();
    T.work = h('div', { class: 'task-work' }, T.srcSlot, T.trCard);
    page.appendChild(T.work);
    T.resSlot = h('div', { class: 'task-res-slot', 'aria-live': 'polite' });
    page.appendChild(T.resSlot);
    T.huntSlot = h('div', { class: 'task-slot', hidden: true });
    page.appendChild(T.huntSlot);

    var st = sget('academy:task', null);
    var pick = custom || (params.id ? taskById(params.id) : null);
    if (pick) { T.mode = 'tr'; T.dom = pick.dkey || ''; }
    paintMode();
    if (T.mode === 'hunt') {
      loadHunt(nextHunt(T.level));
    } else if (pick) {
      T.col = colOf(pick); paintMode();
      setLevel(pick.level);
      loadTask(pick, {});
      later(function () { nz('read', pick.tip, 3200); }, 700);
    } else if (!lvParam && !params.domain && !params.col && !params.dom && st && taskById(st.id) && colOf(taskById(st.id)) === T.col &&
        (!T.dom || taskById(st.id).dkey === T.dom)) {
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

  /* segmented control (mode, level) */
  function segBtns(items, cur, onPick, label, cls) {
    var wrap = h('div', { class: 'seg ' + (cls || ''), role: 'group', 'aria-label': label });
    var btns = items.map(function (it) {
      var b = h('button', { type: 'button', 'aria-pressed': 'false', title: it.title || null }, it.icon ? ie(it.icon) : null, it.label);
      b.addEventListener('click', function () { onPick(it.id); });
      wrap.appendChild(b);
      return b;
    });
    wrap._paint = function (v) { btns.forEach(function (b, i) { b.setAttribute('aria-pressed', items[i].id === v ? 'true' : 'false'); }); };
    wrap._paint(cur);
    return wrap;
  }

  /* one compact toolbar: mode · collection · domain · level · new text; a quiet note line below */
  function toolbar() {
    var modes = segBtns([{ id: 'tr', label: 'Tərcümə et' }, { id: 'hunt', label: 'Səhvi tap' }], T.mode, setMode, 'Tapşırıq növü', 'sm');
    var fMode = field('Rejim', modes, 'task-f-mode');
    if (!HUNT.length) fMode.hidden = true;

    var colSel = h('select', { class: 'select sm', 'aria-label': 'Mətn toplusu' }, COLS.map(function (c) { return h('option', { value: c.id, text: c.label }); }));
    colSel.addEventListener('change', function () { setCol(colSel.value); });
    T.colRow = field('Mətnlər', colSel, 'task-f-col');
    if (COLS.length < 2) T.colRow.hidden = true;

    var domSel = h('select', { class: 'select sm', 'aria-label': 'Sahə' },
      h('option', { value: '', text: 'Bütün sahələr' }),
      DOMAINS.map(function (d) { return h('option', { value: d.key, text: d.name }); }));
    domSel.addEventListener('change', function () { setDom(domSel.value); });
    T.domRow = field('Sahə', domSel, 'task-f-dom');
    if (!DOMAINS.length) T.domRow.hidden = true;

    var lvSeg = segBtns(LEVELS.map(function (l) { return { id: l.id, label: l.id, title: l.id + ' · ' + l.name + ' — ' + lower(l.d) }; }), T.level, function (id) {
      if (!T || T.level === id) return;
      var prev = T.level;
      setLevel(id);
      fetchTask(null, false, function () { setLevel(prev); });
    }, 'Səviyyə', 'sm task-lv');
    var fLv = field('Səviyyə', lvSeg, 'task-f-lv');
    T.paintLevel = function () { lvSeg._paint(T.level); var lv = levelById(T.level); fLv.title = lv ? lv.id + ' · ' + lv.name + ' — ' + lower(lv.d) : ''; };

    T.getBtn = h('button', { class: 'btn btn-secondary task-bar-new', type: 'button' }, ie('refresh'), 'Yeni mətn al');
    T.getBtn.addEventListener('click', function () { fetchTask(null, false); });

    T.paintCol = function () { colSel.value = T.col; };
    T.paintModeBtns = function () { modes._paint(T.mode); };

    /* note line: domain intro / collection note + «Lüğət» */
    T.note = h('p', null);
    T.note.addEventListener('click', function () { if (T.note.classList.contains('clamp')) T.note.classList.toggle('open'); });
    var gloss = h('button', { class: 'btn btn-ghost btn-sm', type: 'button', 'aria-haspopup': 'dialog' }, ie('book'), h('span', { text: 'Lüğət' }));
    gloss.addEventListener('click', function () { glossarySheet(T && T.dom ? T.dom : ''); });
    T.gloss = gloss;
    T.noteRow = h('div', { class: 'task-note' }, T.note, gloss);
    T.paintDom = function () {
      var d = domByKey(T.dom || '');
      domSel.value = d ? d.key : '';
      gloss.lastChild.textContent = d ? 'Lüğət · ' + d.glossary.length : 'Lüğət';
      gloss.hidden = T.mode === 'hunt' || (d ? !d.glossary.length : !DOMAINS.some(function (x) { return x.glossary.length; }));
    };
    T.paintLevel();
    T.paintDom();
    return h('div', { class: 'task-bar', role: 'group', 'aria-label': 'Tapşırıq seçimi' }, fMode, T.colRow, T.domRow, fLv, T.getBtn);
  }
  function setDom(k) {
    if (!T || T.checking) { if (T) paintMode(); return; }
    if ((T.dom || '') === k && T.col === 'base') return;
    var prev = { dom: T.dom, col: T.col };
    T.dom = k; sset('academy:dom', k);
    if (T.col !== 'base') { T.col = 'base'; sset('academy:col', 'base'); }
    paintMode();
    fetchTask(null, false, function () {
      T.dom = prev.dom; T.col = prev.col; sset('academy:dom', prev.dom); sset('academy:col', prev.col); paintMode();
    });
  }

  /* glossary sheet: one domain, or all domains grouped (searchable en → az + note) */
  function glossarySheet(key) {
    var only = domByKey(key);
    var groups = (only ? [only] : DOMAINS).filter(function (d) { return d.glossary.length; });
    var total = groups.reduce(function (s, d) { return s + d.glossary.length; }, 0);
    var q = h('input', { class: 'input', type: 'search', placeholder: 'İngiliscə və ya azərbaycanca axtarın…', 'aria-label': 'Termin axtar', autocomplete: 'off', spellcheck: 'false' });
    var count = h('p', { class: 'acad-count', 'aria-live': 'polite' });
    var list = h('div', { class: 'task-gl' });
    function paint() {
      var f = fold(q.value.trim()), n = 0;
      list.textContent = '';
      groups.forEach(function (d) {
        var rows = d.glossary.filter(function (g) { return !f || fold(g.en + ' ' + g.az + ' ' + g.note).indexOf(f) >= 0; });
        if (!rows.length) return;
        n += rows.length;
        if (!only) list.appendChild(h('h3', { class: 'task-gl-h' }, ie(d.icon), h('span', { text: d.name }), h('small', { text: String(rows.length) })));
        list.appendChild(h('dl', { class: 'task-gl-l' }, rows.map(function (g) {
          return h('div', { class: 'task-gl-r' },
            h('dt', { lang: 'en', text: g.en }),
            h('dd', null, h('b', { lang: 'az', text: g.az }), g.note ? h('small', { text: g.note }) : null));
        })));
      });
      if (!n) list.appendChild(h('p', { class: 'acad-note', text: 'Heç nə tapılmadı — başqa sözlə axtarın.' }));
      count.textContent = f ? n + ' termin tapıldı' : total + ' termin' + (only ? '' : ' · ' + groups.length + ' sahə');
    }
    q.addEventListener('input', paint);
    paint();
    App.sheet({ title: only ? 'Lüğət · ' + only.name : 'Sahə lüğətləri', wide: true,
      body: h('div', { class: 'stack' }, only && only.why ? h('p', { class: 'acad-note', text: only.why }) : null, h('label', { class: 'input-ic' }, ie('search'), q), count, list),
      actions: hasScreen('glossary') ? [{ label: 'Lüğət səhifəsində aç', kind: 'ghost', icon: 'book', onClick: function () { setTimeout(function () { App.go('glossary', { dom: only ? only.key : '' }); }, 60); } }] : null });
  }
  App.academyGlossary = glossarySheet;

  function paintMode() {
    if (!T) return;
    var hunt = T.mode === 'hunt';
    if (T.paintModeBtns) T.paintModeBtns();
    if (T.paintCol) T.paintCol();
    T.colRow.hidden = hunt || COLS.length < 2;
    if (T.domRow) T.domRow.hidden = hunt || !DOMAINS.length;
    if (T.paintDom) T.paintDom();
    T.work.hidden = hunt; T.resSlot.hidden = hunt; T.huntSlot.hidden = !hunt;
    if (hunt) T.briefSlot.hidden = true; else T.briefSlot.hidden = !(T.task && T.task.sim);
    var d = domByKey(T.dom || '');
    var note = hunt
      ? 'Dərc olunmuş real tərcümədə (NTREX-128) səhvləri tapın: şübhəli sözləri seçin və «Yoxla».'
      : T.col === 'news' ? 'Real xəbər mətnləri — nümunə kimi dərc olunmuş peşəkar tərcümə göstəriləcək.'
      : T.col === 'docs' ? 'İnsan Hüquqları haqqında Ümumi Bəyannamə — BMT-nin rəsmi tərcüməsi ilə müqayisə.'
      : d && d.why ? d.why
      : DOMAINS.length ? 'Yeddi peşəkar sahə — hər birində tapşırıqlar və termin lüğəti. Sahə seçin və ya hamısından növbə ilə alın.'
      : 'Mətni oxuyun, öz variantınızı yazın — Mirzə Məclisi yoxlayacaq.';
    T.note.textContent = note;
    T.note.classList.remove('open');
    T.note.classList.toggle('clamp', note.length > 150);
    T.note.title = note.length > 150 ? 'Tam oxumaq üçün toxunun' : '';
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
    if (!T || T.col === c || T.checking) { if (T) paintMode(); return; }
    var prev = T.col, pdom = T.dom;
    T.col = c; sset('academy:col', c);
    if (c !== 'base' && T.dom) { T.dom = ''; sset('academy:dom', ''); }
    paintMode();
    fetchTask(null, false, function () { T.col = prev; T.dom = pdom; sset('academy:col', prev); sset('academy:dom', pdom); paintMode(); });
  }

  function nextTask(level, domain) {
    var col = (T && T.col) || 'base';
    var base = TASKS.filter(function (t) { return !t.sim && colOf(t) === col; });
    if (!base.length) base = TASKS.filter(function (t) { return !t.sim && !t.col; });
    var dk = T && T.dom && col === 'base' ? T.dom : '';
    if (dk) {
      var inDom = base.filter(function (t) { return t.dkey === dk; });
      if (inDom.length) {
        base = inDom;
        /* respect the level when possible, else the nearest level */
        if (!base.some(function (t) { return t.level === level; })) {
          var li = levelIdx(level), best = 99;
          base.forEach(function (t) { best = Math.min(best, Math.abs(levelIdx(t.level) - li)); });
          var near = base.filter(function (t) { return Math.abs(levelIdx(t.level) - li) === best; });
          level = near[0].level;
        }
      }
    }
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
    return h('section', { class: 'task-pane task-src', role: 'status' },
      h('span', { class: 'sr-only', text: 'Mətn hazırlanır…' }),
      h('div', { class: 'sk-stack' },
        h('span', { class: 'skeleton text', style: 'width:120px' }),
        h('span', { class: 'skeleton title' }),
        h('span', { class: 'skeleton text', style: 'width:60%' }),
        h('span', { class: 'skeleton text' }), h('span', { class: 'skeleton text', style: 'width:92%' }), h('span', { class: 'skeleton text', style: 'width:64%' })));
  }

  function fetchTask(domain, initial, onCancel) {
    if (!T || isBusy(T.getBtn) || T.checking) { if (onCancel && T && T.checking) onCancel(); return; }
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
    T.briefSlot.hidden = !task.sim || T.mode === 'hunt';
    if (task.sim) T.briefSlot.appendChild(briefCard(task));
    T.srcSlot.textContent = '';
    T.srcSlot.appendChild(sourceCard(task));
    if (T.draftBtn) T.draftBtn.hidden = !task.draft;
    var pr = pairOf(task);
    if (T.trEye) T.trEye.textContent = 'Tərcümə · ' + pr.to.toUpperCase();
    T.ta.setAttribute('lang', pr.to);
    T.ta.placeholder = pr.to === 'en' ? 'Tərcüməni ingiliscə bura yazın…' : 'Tərcüməni bura yazın…';
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
    return h('section', { class: 'acad-panel task-brief', 'aria-label': 'Sifarişin şərtləri' },
      h('div', { class: 'acad-panel-h' },
        h('div', null, h('span', { class: 'acad-cap', text: 'Simulyator · sifariş' }), h('h2', { text: task.client + ' — ' + task.title })),
        statusPill(s.deadline, 'acc')),
      h('dl', { class: 'kv' },
        h('dt', { text: 'Son tarix' }), h('dd', { text: s.deadline }),
        h('dt', { text: 'Həcm' }), h('dd', { text: s.volume }),
        h('dt', { text: 'Əlaqə' }), h('dd', { text: s.contact })),
      h('div', { class: 'stack-sm' }, h('span', { class: 'acad-cap', text: 'Müştərinin tələbləri' }),
        h('ul', null, s.req.map(function (r) { return h('li', { text: r }); }))));
  }

  function sourceCard(task) {
    var lv = levelById(task.level), pr = pairOf(task);
    var hintBox = h('div', { class: 'task-hints', 'aria-live': 'polite' });
    var hintBtn = h('button', { class: 'btn btn-ghost btn-sm', type: 'button' });
    var hintCount = h('span', { class: 'acad-count' });
    function paint() {
      hintBox.textContent = '';
      hintBox.hidden = !T.hints;
      if (T.hints) {
        hintBox.appendChild(h('span', { class: 'acad-cap', text: 'İpucları' }));
        hintBox.appendChild(h('ol', null, task.hints.slice(0, T.hints).map(function (x) { return h('li', { text: x }); })));
      }
      var done = T.hints >= task.hints.length;
      hintBtn.textContent = '';
      hintBtn.appendChild(ie('bulb'));
      hintBtn.appendChild(D.createTextNode(done ? 'İpucları bitdi' : (T.hints ? 'Növbəti ipucu' : 'İpucu göstər')));
      if (!done) hintBtn.appendChild(h('span', { class: 'task-cost', text: '−2 XP' }));
      hintBtn.disabled = done;
      hintCount.textContent = 'İpucu ' + T.hints + ' / ' + task.hints.length;
    }
    hintBtn.addEventListener('click', function () {
      if (T.hints >= task.hints.length) return;
      T.hints++; saveTask(); paint();
      if (T.hints === 1) nz('point', 'Bir ipucu verdim — qalanını özünüz tapın!', 2400);
      else nz('think', null, 1200);
    });
    paint();
    return h('section', { class: 'task-pane task-src', 'aria-labelledby': 'task-src-h' },
      h('div', { class: 'task-pane-h' },
        h('span', { class: 'acad-cap', text: 'Mənbə · ' + pr.from.toUpperCase() + ' → ' + pr.to.toUpperCase() }),
        h('button', { class: 'icon-btn sm ghost', type: 'button', 'aria-label': 'Mənbəni kopyala', title: 'Kopyala', html: App.icon('copy'), onclick: function () { copyText(task.src, 'Mənbə kopyalandı'); } })),
      h('div', { class: 'task-src-head' },
        h('h2', { id: 'task-src-h', text: task.title }),
        metaLine([lvTag(task.level), lv ? lv.name : null, task.domain, task.client,
          h('span', { title: 'Üslub avtomatik təyin edildi', text: (T.reg || task.reg) + ' üslub' }),
          words(task.src) + ' söz', '~' + task.minutes + ' dəq'])),
      h('p', { class: 'task-src-tx', lang: pr.from, text: task.src }),
      task.credit ? h('p', { class: 'acad-credit', text: task.credit }) : null,
      task.custom ? customCredit(task) : null,
      hintBox,
      task.hints.length ? h('div', { class: 'task-pane-f' }, hintBtn, hintCount) : null);
  }
  function customCredit(task) {
    var bits = ['Mənbə: ' + (task.source || task.client)];
    if (task.licence) bits.push('Lisenziya: ' + task.licence);
    return h('p', { class: 'acad-credit' }, bits.join(' · '),
      task.url ? h('span', null, ' · ', h('a', { href: task.url, target: '_blank', rel: 'noopener noreferrer', text: 'Mənbəni aç' })) : null);
  }

  function updateWC() { if (T && T.wc && T.ta) { var n = words(T.ta.value); T.wc.textContent = n + ' söz'; } }

  function translationCard() {
    var ta = h('textarea', { class: 'textarea task-ta', id: 'task-ta', rows: '6', placeholder: 'Tərcüməni bura yazın…', lang: 'az', spellcheck: 'true', 'aria-describedby': 'task-ta-hint' });
    var err = h('span', { class: 'err', hidden: true, role: 'alert' }, ie('alert'), 'Əvvəlcə tərcüməni yazın — ən azı bir cümlə.');
    var wc = h('span', { class: 'acad-count', text: '0 söz' });
    var draft = h('button', { class: 'btn btn-ghost btn-sm', type: 'button' }, ie('file'), 'Nümunə qaralama');
    var check = h('button', { class: 'btn btn-primary', type: 'button' }, ie('check'), 'Yoxlat');
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
    return h('section', { class: 'task-pane task-tr', 'aria-labelledby': 'task-tr-h' },
      h('div', { class: 'task-pane-h' }, T.trEye = h('span', { class: 'acad-cap', text: 'Tərcümə · AZ' }), wc),
      h('h2', { class: 'task-tr-h', id: 'task-tr-h', text: 'Sizin variantınız' }),
      h('div', { class: 'field task-field' },
        h('label', { class: 'sr-only', for: 'task-ta', text: 'Sizin tərcüməniz' }),
        ta, err,
        h('span', { class: 'hint', id: 'task-ta-hint', text: 'Terminlərə, rəqəmlərə və üsluba diqqət edin. Məclis hər qeydi izah edəcək.' })),
      h('div', { class: 'task-pane-f' },
        h('div', { class: 'acad-act' }, draft,
          h('span', { class: 'task-keys', 'aria-hidden': 'true' }, h('kbd', { class: 'kbd', text: MOD }), h('kbd', { class: 'kbd', text: 'Enter' }))),
        check));
  }

  function resultSkeleton() {
    return h('div', { class: 'task-res-sk', role: 'status' },
      h('span', { class: 'sr-only', text: 'Məclis yoxlayır…' }),
      h('section', { class: 'acad-panel' },
        h('span', { class: 'skeleton text', style: 'width:180px' }),
        h('span', { class: 'skeleton title', style: 'width:40%' }),
        h('span', { class: 'skeleton text' }), h('span', { class: 'skeleton text', style: 'width:70%' })),
      h('section', { class: 'acad-panel' },
        h('span', { class: 'skeleton text', style: 'width:30%' }), h('span', { class: 'skeleton text' }), h('span', { class: 'skeleton text', style: 'width:84%' })));
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
      var pr = pairOf(task);
      return App.fakeAI('grade', { src: task.src, text: text, model: task.model, register: T.reg || task.reg, domain: task.domain, level: task.level, from: pr.from, to: pr.to, pair: pr.from + '-' + pr.to }, 700).then(function (r) {
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
      if (!(e && e.ok === false)) App.toast('Yoxlama tamamlanmadı', 'err', { sub: 'Bağlantını yoxlayın və bir az sonra yenidən cəhd edin' });
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
      var sc = res.querySelector('.task-score-n');
      burstAt(sc, 'stars');
      if (fresh) addXP(out.xp, pointOf(sc));
      else App.toast('Bu variant artıq yoxlanılıb', 'info', { sub: 'XP yalnız yeni variant üçün verilir' });
    }, reduced() ? 120 : 420);
  }

  function resultView(out) {
    var g = out.grade, task = out.task, n = out.errors.length;
    var sealKind = out.score >= 85 ? 'ok' : out.score >= 70 ? 'warn' : 'err';
    var verdict = h('section', { class: 'task-verdict', tabindex: '-1', 'aria-labelledby': 'task-v-h' },
      h('div', { class: 'task-vtx' },
        h('span', { class: 'acad-cap', text: 'Mirzə Məclisinin rəyi' }),
        h('h2', { id: 'task-v-h' }, h('span', { class: 'sr-only', text: 'Qiymət ' + g.l + ', ' + g.w + ', ' + out.score + ' bal. ' }), g.head),
        h('p', { text: out.summary }),
        metaLine(['+' + out.xp + ' XP', n ? n + ' qeyd' : 'Qeyd yoxdur', out.hints ? out.hints + ' ipucu' : null, lvTag(task.level), task.domain])),
      h('div', { class: 'task-score' },
        h('span', { class: 'task-score-n', 'aria-hidden': 'true' }, String(out.score), h('small', { text: '/100' })),
        h('span', { class: 'task-grade-w', text: g.l + ' · ' + g.w }),
        statusPill(out.verdict.seal, sealKind)));

    var rub = h('section', { class: 'acad-panel task-rub', 'aria-labelledby': 'task-sk-h' },
      h('div', { class: 'acad-panel-h' }, h('div', null, h('span', { class: 'acad-cap', text: 'Meyarlar' }), h('h3', { id: 'task-sk-h', text: 'Qiymətləndirmə' }))),
      h('div', { class: 'task-rub-l' }, out.rubric.map(function (r) {
        var pct = r.max ? Math.round(r.score / r.max * 100) : 0;
        return h('div', { class: 'task-rub-row' },
          h('span', { class: 'task-rub-n', text: r.name }),
          h('span', { class: 'task-rub-v' }, h('b', { text: String(r.score) }), ' / ' + r.max),
          bar(pct, r.name));
      })));

    var model = !task.model ? null : h('section', { class: 'acad-panel task-model', 'aria-labelledby': 'task-m-h' },
      h('div', { class: 'acad-panel-h' },
        h('div', null, h('span', { class: 'acad-cap', text: 'Nümunə' }), h('h3', { id: 'task-m-h', text: task.modelLabel || 'Məclisin variantı' })),
        h('button', { class: 'icon-btn sm ghost', type: 'button', 'aria-label': 'Variantı kopyala', title: 'Kopyala', html: App.icon('copy'), onclick: function () { copyText(task.model, (task.modelLabel || 'Məclisin variantı') + ' kopyalandı'); } })),
      h('p', { class: 'task-model-tx', lang: pairOf(task).to, text: task.model }),
      h('p', { class: 'acad-note', text: task.modelNote || 'Yeganə düzgün variant deyil — amma terminlər, rəqəmlər və üslub burada qorunub.' }),
      task.credit ? h('p', { class: 'acad-credit', text: task.credit }) : null);

    var counter = h('span', { class: 'acad-count', text: '0 / ' + n + ' düzəldilib' });
    T.counter = counter;
    var errList;
    if (!n) {
      var nextLv = levelIdx(task.level) < LEVELS.length - 1 ? LEVELS[levelIdx(task.level) + 1] : null;
      errList = emptyNote('Qeyd yoxdur', 'Beş mirzənin heç biri irad tutmadı. Növbəti səviyyəni sınamağın vaxtıdır.', [
        nextLv ? h('button', { class: 'btn btn-secondary btn-sm', type: 'button', onclick: function () { setLevel(nextLv.id); fetchTask(null, true); scrollToEl(T.getCard); } }, nextLv.id + ' səviyyəsini sına', ie('arrow')) : null]);
    } else {
      var withSrc = out.errors.some(function (e) { return !isMissing(e) && !!srcFor(task.src, out.text, e.was); });
      errList = reviewList(out.errors.map(function (e, i) { return errCard(e, i, out, withSrc); }), withSrc, 'Məclisin qeydləri');
    }
    var errSec = h('section', { class: 'acad-sec', 'aria-labelledby': 'task-errs-h' },
      h('div', { class: 'acad-sec-h' }, h('h2', { id: 'task-errs-h', text: n ? 'Rəy · ' + n + ' qeyd' : 'Rəy' }), n ? counter : null),
      errList);

    var next = h('div', { class: 'task-next' },
      h('button', { class: 'btn btn-ghost', type: 'button', onclick: function () { scrollToEl(T.ta.closest('.task-pane') || T.ta); later(function () { focusSoft(T.ta); }, reduced() ? 0 : 380); } }, ie('edit'), 'Yenidən yaz'),
      h('button', { class: 'btn btn-secondary', type: 'button', onclick: function () { fetchTask(null, true); scrollToEl(T.getCard); } }, 'Növbəti mətn', ie('arrow')));

    return h('div', { class: 'task-res' }, verdict, errSec,
      h('div', { class: 'task-res-grid' + (model ? ' two' : '') }, rub, model), next);
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

  /* a finding as a review row: [Tətbiq et] applies the correction (and files an error card),
     [Özüm düzəldim] lets the student type the fix first (+5 XP) */
  function errCard(e, i, out, withSrc) {
    var missing = isMissing(e);
    var exId = 'task-ex-' + i;
    var exBox = e.ex ? h('div', { class: 'acad-rv-ex', id: exId, hidden: true }, h('span', { class: 'acad-rv-lbl', text: 'Nümunə' }), h('span', { text: e.ex })) : null;
    var exBtn = e.ex ? h('button', { class: 'btn btn-ghost btn-sm', type: 'button', 'aria-expanded': 'false', 'aria-controls': exId }, ie('help'), 'Nümunə') : null;
    function toggleWhy(force) {
      if (!exBox) return;
      var open = force != null ? force : exBox.hidden;
      exBox.hidden = !open; exBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    if (exBtn) exBtn.addEventListener('click', function () { toggleWhy(); });

    var tries = 0;
    var inp = h('input', { class: 'input', type: 'text', lang: 'az', autocomplete: 'off', 'aria-label': 'Düzəlişiniz', placeholder: 'Düzgün forma…' });
    var test = h('button', { class: 'btn btn-secondary btn-sm', type: 'button' }, 'Yoxla');
    var note = h('small', { 'aria-live': 'polite', text: 'Düzgün formanı yazın və «Yoxla» basın.' });
    var selfBox = h('div', { class: 'acad-rv-self', hidden: true }, h('div', { class: 'acad-rv-self-row' }, inp, test), note);
    var bSelf = h('button', { class: 'btn btn-ghost btn-sm', type: 'button', 'aria-expanded': 'false' }, ie('edit'), 'Özüm düzəldim');
    var bShow = h('button', { class: 'btn btn-secondary btn-sm', type: 'button' }, ie('check'), missing ? 'Düzgün variant' : 'Tətbiq et');
    var state = h('span', { class: 'acad-rv-state', 'aria-live': 'polite' });
    var card = reviewRow({
      sev: e.severity, type: e.type, withSrc: withSrc, srcLang: pairOf(out.task).from,
      src: withSrc && !missing ? srcFor(out.task.src, out.text, e.was) : '',
      was: missing ? (e.was === '…' ? 'Buraxılıb' : e.was === '—' ? 'Tərcümədə yoxdur' : e.was) : e.was, missing: missing,
      now: e.now, why: e.why, who: e.elder,
      act: [bShow, bSelf, exBtn, state], ext: [selfBox, exBox]
    });
    var nowEl = card.querySelector('.acad-now');

    function norm(s) { return lower(String(s || '').trim()).replace(/[«»"“”.,!?:;]/g, '').replace(/\s+/g, ' '); }
    function check() {
      var v = norm(inp.value), want = norm(e.now);
      var ok = !!v && (v === want || (v.length >= 3 && v.indexOf(want) >= 0) || (want.length > 4 && v.length >= want.length * 0.75 && want.indexOf(v) >= 0));
      if (ok) { resolve('self'); return; }
      tries++;
      inp.setAttribute('aria-invalid', 'true'); shake(inp);
      if (tries === 1) { note.textContent = 'Hələ yox — nümunəyə baxın.'; toggleWhy(true); nz('think', null, 1200); }
      else note.textContent = 'İpucu: «' + e.now.slice(0, Math.max(2, Math.ceil(e.now.length / 2))) + '…». Və ya «Tətbiq et» düyməsinə basın.';
    }
    function setState(txt) {
      state.textContent = '';
      state.appendChild(ie('check'));
      state.appendChild(D.createTextNode(txt));
    }
    function resolve(how) {
      if (card.classList.contains('done')) return;
      card.classList.add('done');
      selfBox.hidden = true; bSelf.hidden = true; bShow.hidden = true;
      if (how === 'self') {
        applyFix(e);
        setState('Özünüz düzəltdiniz · +5 XP');
        addXP(5, pointOf(nowEl));
        burstAt(nowEl, 'stars');
        nz('success', pick(['Əla! Məhz belə.', 'Düz tapdınız!', e.elder + ' razıdır!']), 2000);
      } else {
        var applied = applyFix(e);
        var added = addUserCard(e, out.task, out.text, out.errors);
        setState((applied ? 'Düzəliş mətnə tətbiq olundu' : 'Düzgün variant göstərildi') + (added ? ' · kartlara əlavə olundu' : ''));
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
          nz('celebrate', 'Bütün səhvlər düzəldi! Yenidən yoxlatsanız, bal artacaq.', 3400);
          App.toast('Bütün qeydlər düzəldildi', 'ok', { sub: 'Mətni Məclisə yenidən göndərin', action: { label: 'Yoxlat', onClick: function () { scrollToEl(T.ta.closest('.task-pane') || T.ta); } } });
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
     5b. «SƏHVİ TAP» — find the real errors in a published translation
         (NTREX-128, annotated by Nuanza). Fully offline.
     ------------------------------------------------------------------ */
  function nextHunt(level) {
    if (!HUNT.length) return null;
    var pool = HUNT.filter(function (x) { return x.level === level; });
    if (!pool.length) pool = HUNT;
    var cur = T && T.hunt ? T.hunt.id : null;
    var cand = pool.filter(function (x) { return x.id !== cur; });
    if (!cand.length) cand = pool;
    var rot = Number(sget('academy:huntrot', 0)) || 0;
    sset('academy:huntrot', rot + 1);
    return cand[rot % cand.length];
  }

  function loadHunt(item) {
    if (!T || !T.huntSlot) return;
    T.huntSlot.textContent = '';
    if (!item) { T.huntSlot.appendChild(emptyNote('Real mətnlər yüklənmədi', 'Səhifəni yeniləyin və ya bir az sonra yenidən cəhd edin.')); return; }
    T.hunt = item;
    if (item.level !== T.level) setLevel(item.level);
    T.huntSlot.appendChild(huntView(item, { onNext: function () { loadHunt(nextHunt(T.level)); scrollToEl(T.huntSlot); } }));
    nz('point', 'Bu tərcümədə ' + item.errors.length + ' real səhv var. Tapa bilərsinizmi?', 2800);
  }

  /* character spans of each annotated error inside the published text */
  function huntSpans(item) {
    var txt = item.model, sp = [];
    item.errors.forEach(function (e, k) {
      (e.w || []).forEach(function (w) {
        if (!w) return;
        var from = 0, x;
        while ((x = txt.indexOf(w, from)) >= 0) {
          var b = txt.charAt(x - 1), a = txt.charAt(x + w.length);
          var okB = !(b && /\p{L}/u.test(b) && /\p{L}/u.test(w.charAt(0)));
          var okA = !(a && /\p{L}/u.test(a) && /\p{L}/u.test(w.charAt(w.length - 1)));
          var free = !sp.some(function (o) { return x < o.e && x + w.length > o.s; });
          if (okB && okA && free) sp.push({ s: x, e: x + w.length, k: k });
          from = x + 1;
        }
      });
    });
    return sp;
  }

  function tapLegend() {
    return h('div', { class: 'acad-legend', 'aria-hidden': 'true' },
      h('span', null, h('i'), 'tapdınız'), h('span', null, h('i', { class: 'miss' }), 'buraxdınız'), h('span', null, h('i', { class: 'false' }), 'düzgün söz idi'));
  }

  function huntView(item, opts) {
    opts = opts || {};
    var sec = h('section', { class: 'task-hunt', 'aria-label': 'Səhvi tap' });
    function build() {
      var checked = false, toks = [], spans = huntSpans(item);
      sec.textContent = '';
      var count = h('span', { class: 'acad-count', 'aria-live': 'polite', text: 'Seçilib: 0' });
      var text = h('p', { class: 'acad-tap', lang: 'az' });
      var re = /[\p{L}\p{N}]+(?:[.,'’-][\p{L}\p{N}]+)*%?/gu, last = 0, m, txt = item.model;
      while ((m = re.exec(txt))) {
        if (m.index > last) text.appendChild(D.createTextNode(txt.slice(last, m.index)));
        var s0 = m.index, e0 = m.index + m[0].length, sIdx = -1;
        for (var q = 0; q < spans.length; q++) if (s0 < spans[q].e && e0 > spans[q].s) { sIdx = q; break; }
        var b = h('button', { class: 'practice-w', type: 'button', 'aria-pressed': 'false', text: m[0] });
        b._span = sIdx; b._err = sIdx >= 0 ? spans[sIdx].k : -1;
        b.addEventListener('click', onTap);
        toks.push(b); text.appendChild(b);
        last = re.lastIndex;
      }
      if (last < txt.length) text.appendChild(D.createTextNode(txt.slice(last)));
      function sel(t) { return t.getAttribute('aria-pressed') === 'true'; }
      function selected() { return toks.filter(sel); }
      function onTap(ev) {
        if (checked) return;
        var t = ev.currentTarget;
        t.setAttribute('aria-pressed', sel(t) ? 'false' : 'true');
        count.textContent = 'Seçilib: ' + selected().length;
      }
      var clearBtn = h('button', { class: 'btn btn-ghost btn-sm', type: 'button' }, 'Təmizlə');
      var checkBtn = h('button', { class: 'btn btn-primary', type: 'button' }, ie('check'), 'Yoxla');
      var res = h('div', { class: 'acad-tapres', hidden: true, 'aria-live': 'polite' });
      clearBtn.addEventListener('click', function () {
        if (checked) return;
        toks.forEach(function (t) { t.setAttribute('aria-pressed', 'false'); });
        count.textContent = 'Seçilib: 0';
      });
      checkBtn.addEventListener('click', function () {
        if (checked) return;
        if (!selected().length) { shake(text); App.toast('Əvvəlcə şübhəli sözləri seçin', 'warn', { sub: 'Səhv olduğunu düşündüyünüz sözə toxunun' }); return; }
        checked = true;
        var total = item.errors.length, found = {}, falses = 0, prevFalse = false;
        toks.forEach(function (t) {
          var on = sel(t);
          if (t._err >= 0 && on) found[t._err] = true;
          if (t._err < 0 && on) { if (!prevFalse) falses++; prevFalse = true; } else prevFalse = false;
        });
        var hits = Object.keys(found).length, misses = total - hits;
        var lastTok = {};
        toks.forEach(function (t) {
          var on = sel(t);
          t.removeAttribute('aria-pressed'); t.setAttribute('aria-disabled', 'true');
          if (t._err >= 0) {
            var e = item.errors[t._err];
            t.classList.add(found[t._err] ? 'hit' : 'miss');
            t.setAttribute('aria-label', t.textContent + ' — ' + (found[t._err] ? 'tapdınız' : 'buraxdınız') + '. Düzgün: ' + (e.now === '—' ? 'artıqdır' : e.now));
            lastTok[t._span] = t;
          } else if (on) {
            t.classList.add('false');
            t.setAttribute('aria-label', t.textContent + ' — bu söz düzgün idi');
          }
        });
        Object.keys(lastTok).forEach(function (si) {
          var e = item.errors[spans[si].k];
          lastTok[si].insertAdjacentElement('afterend', h('ins', { class: 'practice-fix', text: e.now === '—' ? 'artıqdır' : e.now }));
        });
        var score = Math.round(clamp(hits / total * 100 - falses * 10, 0, 100));
        var prev = bestOf('realhunt'), rec = prev == null || score > prev;
        if (rec && score > 0) setBest('realhunt', score);
        checkBtn.disabled = true; clearBtn.disabled = true;
        /* missed errors become the user's own error cards */
        var added = 0;
        item.errors.forEach(function (e, k) {
          if (found[k] || !e.w || !e.w[0] || !e.now || e.now === '—') return;
          if (addUserCard({ was: e.w[0], now: e.now, type: e.type, why: e.why, elder: TYPE_ELDER[e.type] || 'Mənaçı Mirzə' }, { id: item.id, src: item.src }, item.model, [])) added++;
        });
        res.hidden = false;
        var stats = statLine([{ l: 'Bal', v: score }, { l: 'Tapıldı', v: hits + ' / ' + total }, { l: 'Buraxıldı', v: misses }, { l: 'Yanlış seçim', v: falses }]);
        res.appendChild(h('div', { class: 'acad-sec-h' }, h('span', { class: 'acad-cap', text: 'Nəticə' }), rec && score > 0 ? statusPill('Yeni rekord', 'acc') : (prev != null ? h('span', { class: 'acad-count', text: 'Rekord: ' + prev + ' bal' }) : null)));
        res.appendChild(stats);
        res.appendChild(tapLegend());
        var withSrc = item.errors.some(function (e) { return !!srcFor(item.src, item.model, (e.w || [])[0]); });
        res.appendChild(reviewList(item.errors.map(function (e, k) {
          return reviewRow({ sev: SEV[e.type] || 'mid', type: e.type, withSrc: withSrc, src: withSrc ? srcFor(item.src, item.model, (e.w || [])[0]) : '',
            was: (e.w || [])[0] || '—', now: e.now === '—' ? '(silinməlidir)' : e.now, why: e.why, who: TYPE_ELDER[e.type] || 'Mənaçı Mirzə',
            act: found[k] ? h('span', { class: 'acad-rv-state' }, ie('check'), 'Tapdınız') : h('span', { class: 'acad-rv-state miss' }, ie('alert'), 'Buraxdınız'),
            ext: e.ex ? h('div', { class: 'acad-rv-ex' }, h('span', { class: 'acad-rv-lbl', text: 'Nümunə' }), h('span', { text: e.ex })) : null });
        }), withSrc, 'Səhvlər'));
        if (item.fixed) res.appendChild(h('div', { class: 'acad-fixed' },
          h('span', { class: 'acad-cap', text: 'Düzəldilmiş tərcümə · redaktə' }),
          h('p', { lang: 'az', text: item.fixed })));
        res.appendChild(h('div', { class: 'acad-act end' },
          h('button', { class: 'btn btn-ghost', type: 'button', onclick: build }, ie('refresh'), 'Yenidən'),
          opts.onNext ? h('button', { class: 'btn btn-secondary', type: 'button', onclick: opts.onNext }, 'Növbəti mətn', ie('arrow')) : null));
        refreshGrid();
        var xp = hits ? Math.max(5, Math.round((LV_XP[item.level] || 30) * score / 100)) : 0;
        later(function () {
          if (xp) addXP(xp, pointOf(stats));
          if (added) App.toast('Səhv kartlarına əlavə olundu', 'ok', { sub: added + ' buraxılmış səhv — təkrarda qarşınıza çıxacaq', action: { label: 'Bax', onClick: function () { App.go('cards'); } } });
          if (score >= 80) nz('celebrate', 'Peşəkar redaktor gözü! ' + hits + ' / ' + total + ' səhv tapıldı.', 3000);
          else if (score >= 50) nz('success', hits + ' səhv tapdınız. Buraxılanlar kartlara düşdü.', 3000);
          else nz('worried', 'Real tərcümələrdə səhv gizlənir — buraxılanlara baxın.', 3000);
        }, 300);
      });
      var lv = levelById(item.level);
      sec.appendChild(h('div', { class: 'task-hunt-h' },
        h('div', null, h('span', { class: 'acad-cap', text: 'Səhvi tap · real tərcümə' }), h('h2', { text: item.title || 'Real xəbər' })),
        lvTag(item.level)));
      sec.appendChild(metaLine([lv ? lv.name : null, item.domain || 'Xəbər', words(item.src) + ' söz', item.errors.length + ' səhv']));
      sec.appendChild(h('div', { class: 'acad-srcblk' }, h('span', { class: 'acad-rv-lbl', text: 'Mənbə · EN' }), h('p', { lang: 'en', text: item.src })));
      sec.appendChild(h('p', { class: 'acad-note', html: 'Aşağıdakı dərc olunmuş tərcümədə <b>' + item.errors.length + ' səhv</b> var. Səhv olduğunu düşündüyünüz sözləri seçin, sonra «Yoxla». Yanlış seçim −10 bal.' }));
      sec.appendChild(h('div', { class: 'stack-sm' }, h('span', { class: 'acad-cap', text: 'Dərc olunmuş tərcümə · AZ' }), text));
      sec.appendChild(h('div', { class: 'acad-tapbar' }, count, h('div', { class: 'acad-act' }, clearBtn, checkBtn)));
      sec.appendChild(res);
      sec.appendChild(h('p', { class: 'acad-credit', text: NTREX_LINE + ' · annotasiya: Nuanza (CC BY-SA 4.0)' }));
    }
    build();
    return sec;
  }

  /* Məşq → «Real səhv ovu»: the same round in a sheet */
  function playHunt(g) {
    var item = nextHunt(null) || null;
    if (!item) return;
    var body = h('div', { class: 'task-hunt-sheet' });
    var s = App.sheet({ title: g.name, body: body, wide: true });
    function show(it) {
      body.textContent = '';
      body.appendChild(huntView(it, { onNext: function () { show(nextHunt(null)); try { s.body.scrollTop = 0; } catch (e) { /* ignore */ } } }));
    }
    show(item);
  }

  /* ------------------------------------------------------------------
     6. PRACTICE SCREEN — a tidy list of drills + the Detective round
     ------------------------------------------------------------------ */
  var P = null;

  function renderPractice(page, params) {
    P = { page: page };
    page.appendChild(acadNav('practice'));
    page.appendChild(pageHead('Məşq', (NUM_WORD[GAMES.length] || GAMES.length) + ' qısa məşq — hər biri bir bacarığı itiləyir. Ən yaxşı nəticələriniz yadda qalır.', [
      h('button', { class: 'btn btn-secondary', type: 'button', onclick: function () { openGame(pick(GAMES)); } }, ie('refresh'), 'Təsadüfi məşq')]));
    P.grid = h('div', { class: 'practice-list' });
    buildGrid();
    page.appendChild(h('section', { class: 'acad-sec', 'aria-labelledby': 'practice-games-h' },
      h('div', { class: 'acad-sec-h' }, h('h2', { id: 'practice-games-h', text: 'Məşqlər' }), h('small', { text: GAMES.length + ' məşq · hər biri bir bacarıq' })),
      P.grid));
    P.det = detSection();
    page.appendChild(P.det);
    if (params.game && gameById(params.game)) later(function () { openGame(gameById(params.game)); }, 420);
  }

  function buildGrid() {
    if (!P || !P.grid) return;
    P.grid.textContent = '';
    P.grid.appendChild(h('div', { class: 'practice-lh', 'aria-hidden': 'true' },
      h('span'), h('span', { text: 'Məşq' }), h('span', { text: 'Bacarıq' }), h('span', { text: 'Çətinlik' }), h('span', { text: 'Ən yaxşı nəticə' }), h('span')));
    GAMES.forEach(function (g) { P.grid.appendChild(gameCard(g)); });
  }

  function gameCard(g) {
    var best = bestOf(g.id);
    var diff = h('span', { class: 'practice-diff' },
      h('span', { class: 'practice-diff-b', 'aria-hidden': 'true' }, [1, 2, 3].map(function (n) { return h('i', { class: n <= g.diff ? 'on' : '' }); })),
      h('span', { text: DIFF[g.diff] }));
    var b = h('button', { class: 'practice-row', type: 'button', 'aria-label': g.name + '. ' + g.desc + ' Bacarıq: ' + g.skill + '. Çətinlik: ' + DIFF[g.diff] + '. ' + (best == null ? 'Nəticə yoxdur.' : 'Ən yaxşı nəticə: ' + fmtBest(g.id, best) + '.') },
      h('span', { class: 'practice-ic', html: App.icon(g.icon), 'aria-hidden': 'true' }),
      h('span', { class: 'practice-tx' }, h('b', { text: g.name }), h('small', { text: g.desc }),
        h('span', { class: 'practice-m acad-meta' }, h('span', { text: g.skill }), h('span', { text: DIFF[g.diff] }))),
      h('span', { class: 'practice-skill', text: g.skill }),
      diff,
      h('span', { class: 'practice-best' + (best == null ? ' none' : ''), text: best == null ? '—' : fmtBest(g.id, best) }),
      h('span', { class: 'practice-chev', html: App.icon('chevron'), 'aria-hidden': 'true' }));
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
    var sec = h('section', { class: 'practice-det', id: 'practice-det', 'aria-labelledby': 'practice-det-h' });
    var di = (Number(sget('academy:det', 0)) || 0) % DET.length;
    function next() { di = (di + 1) % DET.length; sset('academy:det', di); build(); later(function () { var w = sec.querySelector('.practice-w'); focusSoft(w); }, 60); }
    function build() {
      var d = DET[di], checked = false, toks = [];
      sec.textContent = '';
      var count = h('span', { class: 'acad-count', 'aria-live': 'polite', text: 'Seçilib: 0' });
      var text = h('p', { class: 'acad-tap', lang: 'az' });
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
      var checkBtn = h('button', { class: 'btn btn-primary', type: 'button' }, ie('check'), 'Yoxla');
      var res = h('div', { class: 'acad-tapres', hidden: true, 'aria-live': 'polite' });
      clearBtn.addEventListener('click', function () {
        if (checked) return;
        toks.forEach(function (t) { t.setAttribute('aria-pressed', 'false'); });
        count.textContent = 'Seçilib: 0';
      });
      checkBtn.addEventListener('click', function () {
        if (checked) return;
        if (!selected().length) { shake(text); App.toast('Əvvəlcə şübhəli sözləri seçin', 'warn', { sub: 'Səhv olduğunu düşündüyünüz sözə toxunun' }); return; }
        checked = true;
        var hits = 0, misses = 0, falses = 0, total = d.errors.length, found = {};
        toks.forEach(function (t) {
          var on = t.getAttribute('aria-pressed') === 'true';
          t.removeAttribute('aria-pressed');
          t.setAttribute('aria-disabled', 'true');
          if (t._err >= 0) {
            var e = d.errors[t._err];
            if (on) { hits++; found[t._err] = true; t.classList.add('hit'); } else { misses++; t.classList.add('miss'); }
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
        res.hidden = false;
        var stats = statLine([{ l: 'Bal', v: score }, { l: 'Tapıldı', v: hits + ' / ' + total }, { l: 'Buraxıldı', v: misses }, { l: 'Yanlış seçim', v: falses }]);
        res.appendChild(h('div', { class: 'acad-sec-h' }, h('span', { class: 'acad-cap', text: 'Nəticə' }), rec && score > 0 ? statusPill('Yeni rekord', 'acc') : (prev != null ? h('span', { class: 'acad-count', text: 'Rekord: ' + prev + ' bal' }) : null)));
        res.appendChild(stats);
        res.appendChild(tapLegend());
        var withSrc = d.errors.some(function (e) { return !!srcFor(d.src, d.tgt, e.w); });
        res.appendChild(reviewList(d.errors.map(function (e, k) {
          return reviewRow({ sev: SEV[e.type] || 'mid', type: e.type, withSrc: withSrc, src: withSrc ? srcFor(d.src, d.tgt, e.w) : '',
            was: e.w, now: e.now, why: e.why, who: TYPE_ELDER[e.type] || 'Mənaçı Mirzə',
            act: found[k] ? h('span', { class: 'acad-rv-state' }, ie('check'), 'Tapdınız') : h('span', { class: 'acad-rv-state miss' }, ie('alert'), 'Buraxdınız') });
        }), withSrc, 'Səhvlər'));
        res.appendChild(h('div', { class: 'acad-act end' },
          h('button', { class: 'btn btn-ghost', type: 'button', onclick: build }, ie('refresh'), 'Yenidən'),
          h('button', { class: 'btn btn-secondary', type: 'button', onclick: next }, 'Növbəti mətn', ie('arrow'))));
        refreshGrid();
        var xp = hits * 4 + (score === 100 ? 10 : 0);
        later(function () {
          if (xp) addXP(xp, pointOf(stats));
          if (score >= 80) nz('celebrate', 'Əsl detektivsiniz! ' + hits + ' səhvin hamısını tutdunuz.', 3000);
          else if (score >= 50) nz('success', hits + ' səhv tapdınız. Buraxılanlara baxın — kartlara düşəcək.', 3000);
          else nz('worried', 'Bir neçəsi gözdən qaçdı — Məclis göstərdi. Yenə cəhd edək?', 3000);
        }, 300);
      });
      sec.appendChild(h('div', { class: 'practice-det-h' },
        h('div', null, h('span', { class: 'acad-cap', text: 'Detektiv · sınaq raundu' }), h('h2', { id: 'practice-det-h', text: 'Səhvləri tapın' })),
        h('div', { class: 'acad-act' }, h('span', { class: 'acad-count', text: 'Mətn ' + (di + 1) + ' / ' + DET.length }),
          h('button', { class: 'icon-btn sm ghost', type: 'button', 'aria-label': 'Başqa mətn', title: 'Başqa mətn', html: App.icon('refresh'), onclick: next }))));
      sec.appendChild(h('div', { class: 'acad-srcblk' }, h('span', { class: 'acad-rv-lbl', text: 'Mənbə · EN' }), h('b', { text: d.title }), h('p', { lang: 'en', text: d.src })));
      sec.appendChild(h('p', { class: 'acad-note', html: 'Tərcümədə <b>' + d.errors.length + ' səhv</b> gizlənib. Şübhəli sözləri seçin, sonra «Yoxla». Yanlış seçim −10 bal.' }));
      sec.appendChild(h('div', { class: 'stack-sm' }, h('span', { class: 'acad-cap', text: 'Tərcümə · AZ' }), text));
      sec.appendChild(h('div', { class: 'acad-tapbar' }, count, h('div', { class: 'acad-act' }, clearBtn, checkBtn)));
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
      timerEl = h('div', { class: 'practice-timer', role: 'timer', 'aria-label': 'Qalan vaxt' }, ie('clock'), h('div', { class: 'acad-bar' }, timerBar), timerTx);
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
        h('span', { class: 'acad-count', text: (i + 1) + ' / ' + qs.length }),
        bar(pct, 'Gediş'),
        h('span', { class: 'practice-q-score', text: g.id === 'vs' ? 'Siz ' + right + ' : ' + ai + ' maşın' : right + ' düz' })));
      if (timerEl) body.appendChild(timerEl);
      if (q.sit) body.appendChild(h('div', { class: 'practice-q-sit' }, h('span', { class: 'acad-rv-lbl', text: 'Situasiya' }), h('b', { text: q.sit })));
      if (q.src) body.appendChild(h('div', { class: 'practice-q-src' }, h('span', { class: 'acad-cap', text: 'Mənbə · EN' }), h('p', { lang: 'en', text: q.src })));
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
      var extra = g.id === 'vs' ? ' Variant ' + 'AB'.charAt(q.ai) + ' — maşın tərcüməsi idi.' : '';
      fb.appendChild(h('div', { class: 'practice-fb' + (ok ? '' : ' bad') }, h('b', { text: msg + ' ' }), q.explain + extra));
      var last = i >= qs.length - 1;
      var nextBtn = h('button', { class: 'btn btn-primary', type: 'button' }, last ? 'Nəticəyə bax' : 'Növbəti', ie('arrow'));
      nextBtn.addEventListener('click', function () { i++; if (i >= qs.length) finish(false); else render(); });
      fb.appendChild(h('div', { class: 'acad-act end' }, nextBtn));
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
      var head = h('div', { class: 'practice-end-n' }, String(score), h('small', { text: g.id === 'speed' ? 'termin' : '/100 bal' }));
      var title, sub;
      if (g.id === 'vs') { title = right > ai ? 'Siz qalib gəldiniz' : right === ai ? 'Bərabərlik' : 'Bu dəfə maşın qalib gəldi'; sub = 'Hesab ' + right + ' : ' + ai + '. Hər raundda daha təbii variantı seçmək — redaktorun əsas bacarığıdır.'; }
      else if (g.id === 'speed') { title = (timeUp ? 'Vaxt bitdi · ' : 'Hamısı cavablandı · ') + right + ' termin'; sub = right + ' düz cavab, ' + (i - right) + ' səhv. Lüğətçi Mirzə yanlış cavabları kartlarınıza yazdı.'; }
      else { title = score >= 80 ? 'Əla nəticə' : score >= 50 ? 'Yaxşıdır — bir az da' : 'Bir də cəhd edək'; sub = qs.length + ' sualdan ' + right + ' düz cavab. ' + (g.id === 'context' ? 'Üslub hissi məşqlə gəlir.' : 'Ədəbi norma — tərcüməçinin imzasıdır.'); }
      body.appendChild(h('div', { class: 'practice-end' },
        h('span', { class: 'acad-cap', text: 'Nəticə' }), head,
        h('h3', { text: title }), h('p', { text: sub }),
        rec ? statusPill('Yeni rekord', 'acc') : (prev != null ? h('span', { class: 'acad-count', text: 'Rekord: ' + fmtBest(g.id, prev) }) : null)));
      s.setActions([
        { label: 'Bağla', kind: 'ghost' },
        { label: 'Yenidən', kind: 'primary', icon: 'refresh', onClick: function () { setTimeout(function () { playQuiz(g); }, 380); } }
      ]);
      refreshGrid();
      setTimeout(function () {
        if (xp) addXP(xp, pointOf(head));
        var great = g.id === 'speed' ? right >= 8 : score >= 80;
        nz(great ? 'celebrate' : 'success', great ? 'Möhtəşəm! ' + title + '.' : 'Yaxşı məşq idi — sabah daha yaxşı olacaq.', 2600);
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
      body.appendChild(h('span', { class: 'acad-cap', text: 'Addım 1 / 2 · Dinləyin' }));
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
      var clock = h('b', { class: 'acad-count', text: '0:00' });
      var stopBtn = h('button', { class: 'practice-mic rec', type: 'button', 'aria-label': 'Dayandır' }, ie('pause'));
      body.appendChild(h('span', { class: 'acad-cap', text: 'Addım 2 / 2 · Danışın' }));
      body.appendChild(h('p', { class: 'acad-note', text: 'Dinlənilir… Prototipdə mikrofon işə salınmır — nəticə nümunədir.' }));
      body.appendChild(wave); body.appendChild(stopBtn); body.appendChild(clock);
      focusSoft(stopBtn);
      var sec = 0, stopped = false;
      var iv = setInterval(function () { sec++; clock.textContent = '0:' + (sec < 10 ? '0' : '') + sec; }, 1000);
      ivs.push(iv);
      function stop() {
        if (stopped || over) return; stopped = true; clearInterval(iv);
        body.textContent = '';
        body.appendChild(h('span', { class: 'acad-cap', text: 'Mirzələr qiymətləndirir' }));
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
      var head = h('div', { class: 'practice-end-n' }, String(score), h('small', { text: '/100 bal' }));
      body.appendChild(h('div', { class: 'practice-end', style: 'width:100%;text-align:left' },
        h('span', { class: 'acad-cap', text: 'Nəticə' }), head, h('h3', { text: 'Axıcı və dəqiq' }),
        rec ? statusPill('Yeni rekord', 'acc') : null));
      body.appendChild(h('div', { class: 'practice-q-src', style: 'text-align:left;width:100%' }, h('span', { class: 'acad-cap', text: 'Tanınan tərcümə' }), h('p', { lang: 'az', text: '«Bakıya xoş gəlmisiniz! Konfrans saat doqquzda, B zalında başlayır.»' })));
      body.appendChild(h('div', { class: 'practice-fb-list' },
        h('div', { class: 'practice-fb' }, h('b', { text: 'Salamlama: ' }), 'təbii səslənir, intonasiya yerindədir.'),
        h('div', { class: 'practice-fb info' }, h('b', { text: '«nine sharp»: ' }), '«düz saat doqquzda» daha dəqiq olardı — dəqiqlik vurğusu itdi.'),
        h('div', { class: 'practice-fb' }, h('b', { text: 'Ad və rəqəm: ' }), '«Hall B» — «B zalı», vaxt düzgün ötürülüb.')));
      s.setActions([{ label: 'Bağla', kind: 'ghost' }, { label: 'Yenidən', kind: 'primary', icon: 'refresh', onClick: function () { setTimeout(function () { playOral(g); }, 380); } }]);
      refreshGrid();
      setTimeout(function () { addXP(15, pointOf(head)); nz('success', 'Gözəl şifahi tərcümə! «nine sharp»ı yadda saxlayaq.', 2800); }, 400);
    }
    step1();
  }

  function simBrief() {
    var task = taskById('sim-ada'), s = task.sim;
    var body = h('div', { class: 'stack' },
      metaLine([h('b', { text: task.client }), s.contact]),
      h('blockquote', { class: 'practice-quote' }, '«Salam! Tələbə bələdçisinin 3-cü fəslini tərcümə etdirmək istəyirik. Əvvəlcə kiçik sınaq parçası göndəririk: üslub rəsmi-neytral olsun, lüğətimizə əməl edin.»'),
      h('dl', { class: 'kv' },
        h('dt', { text: 'Son tarix' }), h('dd', { text: s.deadline }),
        h('dt', { text: 'Həcm' }), h('dd', { text: s.volume })),
      h('div', { class: 'stack-sm' }, h('span', { class: 'acad-cap', text: 'Müştərinin tələbləri' }),
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
     7. CARDS SCREEN (spaced repetition) — an editorial flashcard
     ------------------------------------------------------------------ */
  var C = null;

  function renderCards(page, params) {
    C = { page: page, tag: params.tag || null };
    page.appendChild(acadNav('cards'));
    page.appendChild(pageHead('Səhv kartları', 'Tapşırıqlarda buraxdığınız səhvlər kart olur. «Bildim» — kart seyrəkləşir, «Çətin oldu» — tez-tez qayıdır.'));
    if (!deck().length) { renderNoCards(page); return; }
    C.chips = h('div', { class: 'cards-bar' });
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
    page.appendChild(emptyNote('Hələ səhv kartı yoxdur',
      'Tapşırıqda tərcüməniz yoxlananda düzəlişi tətbiq edin — o, buraya kart kimi düşəcək və vaxtaşırı təkrarlanacaq.',
      [h('button', { class: 'btn btn-primary', type: 'button', onclick: function () { App.go('task'); } }, ie('edit'), 'Tapşırıq götür')]));
  }

  function paintChips() {
    var tags = [];
    deck().forEach(function (c) { if (tags.indexOf(c.tag) < 0) tags.push(c.tag); });
    if (C.tag && tags.indexOf(C.tag) < 0) C.tag = null;
    C.chips.textContent = '';
    var sel = h('select', { class: 'select sm', 'aria-label': 'Mövzu üzrə süzgəc' },
      h('option', { value: '', text: 'Bütün mövzular' }),
      tags.map(function (tg) { return h('option', { value: tg, text: tg }); }));
    sel.value = C.tag || '';
    sel.addEventListener('change', function () { var v = sel.value || null; if (C.tag === v) return; C.tag = v; startSession(false); });
    var f = field('Mövzu', sel);
    f.hidden = tags.length < 2;
    C.chips.appendChild(f);
    C.chips.appendChild(h('span', { class: 'acad-count cards-sum', text: deck().length + ' kart · ' + dueCount() + ' bu gün' }));
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
      'Qutu ' + box + '/5');
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
        h('span', { class: 'acad-mono' }, h('b', { text: String(C.done) }), ' / ' + total + ' kart'),
        metaLine(['Bildim ' + C.known, 'Çətin ' + C.hard])),
      bar(pct, 'Təkrar gedişi')));

    var front = h('div', { class: 'cards-face front' },
      h('div', { class: 'cards-face-top' }, h('span', { class: 'cards-side', text: 'Səhv' }), h('span', { class: 'cards-tag', text: c.tag }), boxPips(rec.box || 1)),
      h('div', { class: 'cards-blk' }, h('span', { class: 'cards-lbl', text: 'Mənbə · EN' }), h('p', { class: 'cards-src', lang: 'en', text: c.src })),
      h('div', { class: 'cards-blk' }, h('span', { class: 'cards-lbl', text: c.mine ? 'Sizin tapşırıqdakı variant' : 'Əvvəlki variantınız' }),
        h('p', { class: 'cards-sent', lang: 'az' }, markPart(c.wrong, c.bad, 'cards-bad', 's'))),
      h('div', { class: 'cards-foot' }, h('span', { text: 'Düzgün variantı xatırlayın, sonra kartı çevirin' }), h('kbd', { class: 'kbd', text: 'Boşluq' })));
    var back = h('div', { class: 'cards-face back', 'aria-hidden': 'true' },
      h('div', { class: 'cards-face-top' }, h('span', { class: 'cards-side ok', text: 'Düzgün' }), h('span', { class: 'cards-tag', text: c.tag }), c.elder ? whoTag(c.elder) : boxPips(rec.box || 1)),
      h('div', { class: 'cards-blk' }, h('span', { class: 'cards-lbl', text: 'Belə olmalıdır' }),
        h('p', { class: 'cards-sent', lang: 'az' }, markPart(c.right, c.good, 'cards-good', 'mark'))),
      h('div', { class: 'cards-why' }, h('span', { class: 'cards-lbl', text: 'Niyə' }), h('p', { text: c.why })),
      h('div', { class: 'cards-foot' }, h('span', { text: 'Bildim → ' + dueLabel(Math.min(5, (rec.box || 1) + 1)) + ' · Çətin oldu → bu sessiyada yenə' })));
    var card = h('button', { class: 'cards-card' + (first ? '' : ' in'), type: 'button', 'aria-label': 'Kart: ' + c.wrong + '. Çevirmək üçün basın' },
      h('div', { class: 'cards-inner' }, front, back));
    var stage = h('div', { class: 'cards-stage' + (C.queue.length <= 1 ? ' single' : '') }, card);
    C.wrap.appendChild(stage);

    var flipBtn = h('button', { class: 'btn btn-secondary btn-block cards-flip', type: 'button' }, 'Kartı çevir', h('kbd', { class: 'kbd', 'aria-hidden': 'true', text: 'Boşluq' }));
    var hardBtn = h('button', { class: 'btn btn-secondary', type: 'button' }, 'Çətin oldu', h('kbd', { class: 'kbd', 'aria-hidden': 'true', text: '1' }));
    var knewBtn = h('button', { class: 'btn btn-primary', type: 'button' }, 'Bildim', h('kbd', { class: 'kbd', 'aria-hidden': 'true', text: '2' }));
    var acts = h('div', { class: 'cards-actions', hidden: true }, hardBtn, knewBtn);
    C.wrap.appendChild(flipBtn);
    C.wrap.appendChild(acts);
    C.wrap.appendChild(h('div', { class: 'cards-keys', 'aria-hidden': 'true' },
      h('span', null, h('kbd', { class: 'kbd', text: 'Boşluq' }), 'çevir'),
      h('span', null, h('kbd', { class: 'kbd', text: '1' }), h('kbd', { class: 'kbd', text: '←' }), 'çətin oldu'),
      h('span', null, h('kbd', { class: 'kbd', text: '2' }), h('kbd', { class: 'kbd', text: '→' }), 'bildim'),
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
      if (moved) card.style.transform = 'translateX(' + dx + 'px)';
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
      later(function () { focusSoft(k.knewBtn); }, reduced() ? 0 : 180);
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
    }, reduced() ? 30 : 170);
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
    var remaining = dueCount();
    var actions = h('div', { class: 'acad-act' });
    if (C.hard) actions.appendChild(h('button', { class: 'btn btn-primary', type: 'button', onclick: function () { startSession(false); } }, ie('refresh'), 'Çətinləri təkrarla'));
    else if (remaining) actions.appendChild(h('button', { class: 'btn btn-primary', type: 'button', onclick: function () { startSession(false); } }, ie('cards'), 'Yenə ' + Math.min(10, remaining) + ' kart'));
    actions.appendChild(h('button', { class: 'btn btn-secondary', type: 'button', onclick: function () { App.go('home'); } }, ie('home'), 'Masaya qayıt'));
    var head = h('h2', { id: 'cards-done-h', text: 'Təkrar tamamlandı' });
    C.wrap.appendChild(h('section', { class: 'acad-panel cards-done', 'aria-labelledby': 'cards-done-h' },
      h('span', { class: 'acad-cap', text: 'Sessiya bitdi' }),
      head,
      h('p', { text: C.uniq + ' kart təkrarlandı. ' + nextDueText() + '.' }),
      statLine([{ l: 'Bildim', v: C.known }, { l: 'Çətin oldu', v: C.hard }, { l: 'Dəqiqlik', v: acc + '%' }, { l: 'XP', v: '+' + xp }]),
      actions));
    later(function () {
      addXP(xp, pointOf(head));
      nz('celebrate', acc >= 80 ? 'Möhtəşəm təkrar! Yaddaş belə qurulur.' : 'Sessiya bitdi! Çətin kartlar tezliklə qayıdacaq.', 3200);
    }, reduced() ? 100 : 300);
  }

  function renderCardsEmpty(cards) {
    C.ended = true;
    C.wrap.textContent = '';
    C.wrap.appendChild(emptyNote(C.tag ? '«' + C.tag + '» üzrə təkrar yoxdur' : 'Bu gün üçün hamısı təkrarlanıb',
      nextDueText() + '. Yaddaş dincəlməyi də sevir — amma istəsəniz, yenə məşq edə bilərsiniz.', [
        cards.length ? h('button', { class: 'btn btn-primary', type: 'button', onclick: function () { startSession(true); } }, ie('cards'), 'Yenə də məşq et') : null,
        h('button', { class: 'btn btn-secondary', type: 'button', onclick: function () { App.go('task'); } }, ie('edit'), 'Tapşırıq götür')]));
  }

  function boxesCard() {
    var s = srsAll(), counts = [0, 0, 0, 0, 0, 0], all = deck();
    all.forEach(function (c) { var b = s[c.id] ? clamp(Number(s[c.id].box) || 1, 1, 5) : 1; counts[b]++; });
    var max = Math.max.apply(null, counts.slice(1)) || 1;
    return h('section', { class: 'acad-sec', 'aria-labelledby': 'cards-bx-h' },
      h('div', { class: 'acad-sec-h' }, h('h2', { id: 'cards-bx-h', text: 'Aralıqlı təkrar' }), h('small', { class: 'tnum', text: all.length + ' kart · 5 qutu' })),
      h('div', { class: 'cards-boxes' }, [1, 2, 3, 4, 5].map(function (b) {
        return h('div', { class: 'cards-bx' },
          h('span', { text: 'Qutu ' + b }), h('b', { text: String(counts[b]) }), h('small', { text: INT_LABEL[b] }),
          bar(Math.round(counts[b] / max * 100)));
      })),
      h('p', { class: 'cards-note', text: '«Bildim» dedikcə kart növbəti qutuya keçir və daha seyrək görünür. «Çətin oldu» onu birinci qutuya qaytarır.' }));
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
     8. PROGRESS SCREEN («Mənim inkişafım») — rank bar, KPI strip,
        skills table, a minimal score line, weak areas, history
     ------------------------------------------------------------------ */
  /* ax: the rubric skill (AXES index) whose change since the first check is the area's trend */
  var EMAP = [
    { t: 'Məna və yalançı dostlar', s: '«actual», «eventually»', types: ['Məna', 'Boş seqment'], tag: 'Məna', ax: 0 },
    { t: 'Terminologiya', s: 'Lüğətə uyğunluq', types: ['Termin'], tag: 'Termin', ax: 1 },
    { t: 'Türk formaları', s: '«için», «içinde»', types: ['Türk forması'], tag: 'Türk forması', ax: 3 },
    { t: 'Rəqəm və tarix', s: '12,4% · 15 mart', types: ['Rəqəm', 'Tarix'], tag: 'Rəqəm', ax: 4 },
    { t: 'Üslub və yazılış', s: 'Müraciət, register, orfoqrafiya', types: ['Üslub', 'Söz sırası', 'Orfoqrafiya', 'Ardıcıllıq', 'Durğu', 'Ad'], tag: 'Üslub', ax: 2 }
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
      sub = 'İlk tapşırıq yoxlanıb — ' + hist[0].s + ' bal. Növbəti nəticələrlə dinamika yaranacaq.';
    }

    page.appendChild(acadNav('progress'));
    page.appendChild(pageHead('Mənim inkişafım', sub));
    page.appendChild(rankCard(p, r, hist));
    if (!n) {
      page.appendChild(progressEmpty());
      return;
    }
    var row = [];
    if (now) row.push(skillsCard(now, base));
    if (n >= 2) row.push(lineCard(hist));
    if (row.length) page.appendChild(h('div', { class: 'progress-grid' + (row.length === 2 ? ' two' : '') }, row));
    var em = errorMapCard(now, base);
    if (em) page.appendChild(em);
    page.appendChild(historyCard(hist));
    page.appendChild(h('div', { class: 'progress-grid two' }, missionsCard(), weeklyCard()));
  }

  function progressEmpty() {
    return emptyNote('Hələ nəticə yoxdur', 'İlk tərcüməniz yoxlananda bacarıqlarınız, ballarınız və zəif tərəfləriniz burada görünəcək.',
      [h('button', { class: 'btn btn-primary', type: 'button', onclick: function () { App.go('task'); } }, ie('edit'), 'İlk tapşırığa başla')]);
  }

  function rankCard(p, r, hist) {
    var pct = Math.round((r.progress || 0) * 100);
    var xp = Number(p.xp) || 0, streak = Number(p.streak) || 0;
    var R = ranks();
    var avg = hist.length ? Math.round(hist.reduce(function (s, x) { return s + x.s; }, 0) / hist.length) : null;
    var last = hist.length ? hist[hist.length - 1].s : null;
    var nextTx = r.nextName ? (xp ? r.nextName + ' rütbəsinə ' + num(r.toNext) + ' XP qalıb' : 'Hər tapşırıq XP gətirir. ' + r.nextName + ' rütbəsi ' + num(r.toNext) + ' XP-dədir.') : 'Ən yüksək rütbə — Ustad.';
    function kpi(label, val, unit) { return h('div', { class: 'progress-kpi' }, h('span', { text: label }), h('b', null, val == null ? '—' : String(val), unit && val != null ? h('small', { text: unit }) : null)); }
    return h('section', { class: 'acad-panel progress-sum', 'aria-labelledby': 'progress-rank-h' },
      h('div', { class: 'progress-rank-row' },
        h('div', null, h('span', { class: 'acad-cap', text: 'Rütbə' }), h('h2', { class: 'progress-rank', id: 'progress-rank-h', text: r.name })),
        h('span', { class: 'progress-xp', text: num(xp) + ' XP' })),
      h('div', { class: 'progress-next' }, bar(pct, 'Növbəti rütbəyə'), h('p', { text: nextTx })),
      h('ol', { class: 'progress-ladder', 'aria-label': 'Rütbələr' }, R.map(function (rk, i) {
        return h('li', { class: i < r.index ? 'done' : i === r.index ? 'cur' : '', 'aria-current': i === r.index ? 'step' : null }, h('span', { text: rk.name }));
      })),
      h('div', { class: 'progress-kpis' },
        kpi('Yoxlanan tapşırıq', hist.length),
        kpi('Orta bal', avg, '/100'),
        kpi('Son bal', last, '/100'),
        kpi('Günlük seriya', streak, streak === 1 ? 'gün' : 'gün')));
  }

  function delta(d) {
    if (d == null) return h('span', { class: 'progress-d eq', text: '—' });
    return h('span', { class: 'progress-d ' + (d > 0 ? 'up' : d < 0 ? 'dn' : 'eq'), text: (d > 0 ? '↑ +' : d < 0 ? '↓ −' : '→ ') + Math.abs(d) });
  }

  function skillsCard(now, base) {
    var B = base && base.some(function (v, i) { return v !== now[i]; }) ? base : null;
    return h('section', { class: 'acad-sec', 'aria-labelledby': 'progress-sk-h' },
      h('div', { class: 'acad-sec-h' }, h('h2', { id: 'progress-sk-h', text: 'Bacarıqlar' }), h('small', { text: 'Məclisin meyarları üzrə, 0–100' })),
      h('div', { class: 'progress-tw' }, h('table', { class: 'progress-t' },
        h('thead', null, h('tr', null, h('th', { text: 'Bacarıq' }), h('th', { class: 'num hide-sm', text: 'Başlanğıc' }), h('th', { class: 'num', text: 'İndi' }), h('th', { class: 'num', text: 'Dəyişmə' }), h('th', { class: 'hide-sm', text: '' }))),
        h('tbody', null, AXES.map(function (a, i) {
          return h('tr', null,
            h('td', { text: a }),
            h('td', { class: 'num hide-sm', text: B ? String(B[i]) : '—' }),
            h('td', { class: 'num' }, h('b', { text: String(now[i]) })),
            h('td', { class: 'num' }, delta(B ? now[i] - B[i] : null)),
            h('td', { class: 'bar hide-sm' }, bar(now[i])));
        })))));
  }

  function lineCard(hist) {
    var pts = hist.slice(-12), n = pts.length;
    var Wd = 360, Ht = 180, pl = 28, pr = 30, pt = 14, pb = 24, y0 = 40, y1 = 100;
    function X(i) { return n <= 1 ? (pl + (Wd - pl - pr) / 2) : pl + i * (Wd - pl - pr) / (n - 1); }
    function Y(v) { return pt + (y1 - clamp(v, y0, y1)) / (y1 - y0) * (Ht - pt - pb); }
    var s = '<svg class="progress-svg" viewBox="0 0 ' + Wd + ' ' + Ht + '" aria-hidden="true">';
    [40, 60, 80, 100].forEach(function (v) {
      s += '<line class="g" x1="' + pl + '" x2="' + (Wd - pr + 6) + '" y1="' + f1(Y(v)) + '" y2="' + f1(Y(v)) + '"/>';
      s += '<text x="' + (pl - 8) + '" y="' + f1(Y(v) + 3.5) + '" text-anchor="end">' + v + '</text>';
    });
    var line = pts.map(function (p, i) { return (i ? 'L' : 'M') + f1(X(i)) + ' ' + f1(Y(p.s)); }).join(' ');
    s += '<line class="cx" x1="0" x2="0" y1="' + pt + '" y2="' + (Ht - pb) + '"/>';
    s += '<path class="ln" d="' + line + '"/>';
    pts.forEach(function (p, i) { s += '<circle class="d" data-i="' + i + '" cx="' + f1(X(i)) + '" cy="' + f1(Y(p.s)) + '" r="3"/>'; });
    var last = pts[n - 1];
    s += '<text class="end" x="' + f1(X(n - 1) + 8) + '" y="' + f1(Y(last.s) + 4) + '">' + last.s + '</text>';
    var xi = [0, Math.floor((n - 1) / 2), n - 1].filter(function (v, i, a) { return a.indexOf(v) === i; });
    xi.forEach(function (i, k) {
      var anchor = k === 0 ? 'start' : (i === n - 1 ? 'end' : 'middle');
      var x = k === 0 ? X(i) - 4 : (i === n - 1 ? X(i) + 4 : X(i));
      s += '<text x="' + f1(x) + '" y="' + (Ht - 6) + '" text-anchor="' + anchor + '">' + shortDate(pts[i].t) + '</text>';
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
      Array.prototype.forEach.call(dots, function (d, j) { d.setAttribute('r', j === i ? '4.5' : '3'); });
      tip.textContent = '';
      tip.appendChild(h('b', { text: p.s + ' bal' }));
      tip.appendChild(h('span', { text: longDate(p.t) + (p.lv ? ' · ' + p.lv : '') }));
      tip.appendChild(h('span', { text: p.title || 'Tapşırıq' }));
      tip.style.left = clamp(X(i) * sc, 70, r.width - 70) + 'px';
      tip.style.top = (Y(p.s) * sc) + 'px';
      tip.classList.add('on');
    }
    function hide() { cur = -1; cxl.classList.remove('on'); tip.classList.remove('on'); Array.prototype.forEach.call(dots, function (d) { d.setAttribute('r', '3'); }); }
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
    return h('section', { class: 'acad-sec', 'aria-labelledby': 'progress-line-h' },
      h('div', { class: 'acad-sec-h' }, h('h2', { id: 'progress-line-h', text: 'Bal dinamikası' }), h('small', { text: 'son ' + n + ' yoxlama' })),
      h('div', { class: 'acad-panel' },
        wrap,
        metaLine(['orta ' + avg, 'ən yüksək ' + best, 'ilk ' + pts[0].s + ' → son ' + last.s, h('span', { class: 'progress-d ' + (diff > 0 ? 'up' : diff < 0 ? 'dn' : 'eq'), text: (diff > 0 ? '+' : diff < 0 ? '−' : '±') + Math.abs(diff) })], 'acad-mono')));
  }

  /* weak areas as an analytic table: area · errors · share · trend (rubric skill since the first check) */
  function errorMapCard(now, base) {
    var lg = sget('academy:errlog', {}) || {};
    var rows = EMAP.map(function (m) { var c = 0; m.types.forEach(function (t) { c += Number(lg[t]) || 0; }); return { m: m, n: c }; })
      .filter(function (r) { return r.n > 0; })
      .sort(function (a, b) { return b.n - a.n; });
    if (!rows.length) return null;
    var total = rows.reduce(function (a, r) { return a + r.n; }, 0);
    var B = base && now ? base : null;
    return h('section', { class: 'acad-sec', 'aria-labelledby': 'progress-emap-h' },
      h('div', { class: 'acad-sec-h' }, h('h2', { id: 'progress-emap-h', text: 'Zəif tərəflər' }), h('small', { text: total + ' səhv · ən çox: ' + lower(rows[0].m.t) })),
      h('div', { class: 'progress-tw' }, h('table', { class: 'progress-t' },
        h('thead', null, h('tr', null, h('th', { text: 'Mövzu' }), h('th', { class: 'num', text: 'Səhv' }), h('th', { class: 'num hide-sm', text: 'Pay' }), h('th', { class: 'hide-sm', text: '' }), h('th', { class: 'num', text: 'Dinamika' }), h('th', { class: 'num', text: '' }))),
        h('tbody', null, rows.map(function (r) {
          var share = Math.round(r.n / total * 100), m = r.m;
          var d = now && B ? now[m.ax] - B[m.ax] : null;
          var go = h('button', { class: 'btn btn-ghost btn-sm', type: 'button', 'aria-label': m.t + ' — kartlara bax' }, 'Kartlar', ie('chevron'));
          go.addEventListener('click', function (e) { e.stopPropagation(); App.go('cards', { tag: m.tag }); });
          var tr = h('tr', { class: 'clickable' },
            h('td', null, m.t, h('small', { text: m.s })),
            h('td', { class: 'num' }, h('b', { text: String(r.n) })),
            h('td', { class: 'num hide-sm', text: share + '%' }),
            h('td', { class: 'bar hide-sm' }, bar(share)),
            h('td', { class: 'num', title: now ? AXES[m.ax] + ': ' + now[m.ax] + (B ? ' (başlanğıcda ' + B[m.ax] + ')' : '') : null }, delta(d)),
            h('td', { class: 'num' }, go));
          tr.addEventListener('click', function () { App.go('cards', { tag: m.tag }); });
          return tr;
        })))),
      h('p', { class: 'acad-note', text: 'Dinamika — uyğun meyar üzrə bacarığın ilk yoxlamadan bəri dəyişməsi. Sətrə toxunun: həmin mövzunun səhv kartları açılır.' }));
  }

  function historyCard(hist) {
    var all = hist.slice().reverse(), LIM = 8, open = false;
    var tbody = h('tbody');
    var more = all.length > LIM ? h('button', { class: 'btn btn-ghost btn-sm progress-more', type: 'button' }) : null;
    function paint() {
      tbody.textContent = '';
      (open ? all : all.slice(0, LIM)).forEach(function (p) {
        var g = gradeOf(p.s);
        tbody.appendChild(h('tr', null,
          h('td', { class: 'num', style: 'text-align:left', text: shortDate(p.t) }),
          h('td', { text: p.title || 'Tapşırıq' }),
          h('td', { class: 'hide-sm' }, p.lv ? lvTag(p.lv) : '—'),
          h('td', { class: 'num' }, h('b', { text: String(p.s) })),
          h('td', { class: 'num hide-sm', text: g.l + ' · ' + g.w })));
      });
      if (more) more.textContent = open ? 'Daha az göstər' : 'Hamısını göstər · ' + all.length;
    }
    if (more) more.addEventListener('click', function () { open = !open; paint(); });
    paint();
    return h('section', { class: 'acad-sec', 'aria-labelledby': 'progress-hist-h' },
      h('div', { class: 'acad-sec-h' }, h('h2', { id: 'progress-hist-h', text: 'Tarixçə' }), h('small', { text: all.length + ' yoxlama' })),
      h('div', { class: 'progress-tw' }, h('table', { class: 'progress-t' },
        h('thead', null, h('tr', null, h('th', { text: 'Tarix' }), h('th', { text: 'Tapşırıq' }), h('th', { class: 'hide-sm', text: 'Səviyyə' }), h('th', { class: 'num', text: 'Bal' }), h('th', { class: 'num hide-sm', text: 'Qiymət' }))),
        tbody)),
      more);
  }

  function missionsCard() {
    var done = 0;
    var rows = MISSIONS.map(function (m) {
      var cur = msProgress(m), complete = cur >= m.max, claimed = complete && isClaimed(m);
      if (claimed) done++;
      var pct = Math.round(cur / m.max * 100);
      var tx = h('span', { class: 'progress-ms-tx' },
        h('b', { text: m.t }),
        h('small', { text: m.s }),
        bar(pct));
      var ic = h('span', { class: 'practice-ic' + (complete ? ' ok' : ''), html: App.icon(complete ? 'check' : m.ic), 'aria-hidden': 'true' });
      if (claimed) return h('li', { class: 'progress-ms-row' }, ic, tx, h('span', { class: 'progress-ms-end' }, statusPill('Alındı', 'ok')));
      if (complete) {
        var cb = h('button', { class: 'btn btn-primary btn-sm', type: 'button' }, '+' + m.xp + ' XP al');
        cb.addEventListener('click', function () {
          if (isClaimed(m)) return;
          var c = sget(claimKey(m), {}) || {}; c[m.id] = true; sset(claimKey(m), c);
          burstAt(cb, 'stars');
          addXP(m.xp, pointOf(cb));
          nz('success', '+' + m.xp + ' XP! Belə davam edək.', 2200);
          var card = cb.closest('.progress-ms');
          if (card && card.parentNode) card.parentNode.replaceChild(missionsCard(), card);
        });
        return h('li', { class: 'progress-ms-row' }, ic, tx, h('span', { class: 'progress-ms-end' }, cb));
      }
      return h('li', null, h('button', { class: 'progress-ms-row', type: 'button', onclick: function () { goFirst(m.go || ['task'], { mission: m.id }, 'Bu bölmə hazırlanır'); } },
        ic, tx, h('span', { class: 'progress-ms-end' }, cur + ' / ' + m.max + ' · +' + m.xp + ' XP', h('span', { html: App.icon('chevron'), 'aria-hidden': 'true', style: 'display:inline-flex' }))));
    });
    return h('section', { class: 'acad-panel progress-ms', 'aria-labelledby': 'progress-ms-h' },
      h('div', { class: 'acad-panel-h' },
        h('div', null, h('span', { class: 'acad-cap', text: 'Missiyalar' }), h('h3', { id: 'progress-ms-h', text: 'Bugünkü hədəflər' })),
        h('span', { class: 'acad-count', text: done + ' / ' + MISSIONS.length })),
      h('ul', { class: 'progress-ms-l' }, rows));
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
      action = statusPill('Çağırış tamamlandı', 'ok');
    } else {
      action = h('button', { class: 'btn btn-secondary', type: 'button' }, 'Növbəti hüquqi mətn', ie('arrow'));
      action.addEventListener('click', function () { App.go('task', { domain: 'Hüquq', level: 'B2' }); });
    }
    return h('section', { class: 'acad-panel progress-week-card', 'aria-labelledby': 'progress-week-h' },
      h('span', { class: 'acad-cap', text: 'Həftəlik çağırış' }),
      h('h3', { id: 'progress-week-h', text: 'Hüquqi həftə' }),
      h('p', { text: 'Bazar gününədək 5 hüquqi mətni 85+ balla tərcümə edin. Möhürdar Mirzə hər rəqəmi yoxlayacaq.' }),
      bar(wk * 20, 'Çağırış gedişi'),
      h('div', { class: 'progress-week-meta' }, h('span', { text: wk + ' / 5 mətn' }), h('span', { text: dl === 0 ? 'bu gün bitir' : dl + ' gün qalıb' })),
      h('p', null, h('b', { text: 'Mükafat: ' }), '«Möhürdar» nişanı · +150 XP'),
      action);
  }

  /* ------------------------------------------------------------------
     9. LESSONS SCREEN ('lessons', «Dərslər») — theory lessons
        (App.data.LESSONS) + every translation task grouped by domain and
        level, with status from the score history. A row opens the task flow.
        The desk's «Dərsə başla» lands here with { lesson } → lesson page.
     ------------------------------------------------------------------ */
  var LSF = { col: 'base', lv: '', st: '', q: '' }; /* filters, kept for the session */

  function theoryList() { var L = (App.data && App.data.LESSONS) || []; return Array.isArray(L) ? L.filter(function (x) { return x && x.id && x.title; }) : []; }
  function theoryDone() { var d = sget('home:lessons-done', {}); return d && typeof d === 'object' ? d : {}; }
  function findTheory(id) {
    if (!id) return null;
    var s = sget('home:lesson', null);
    if (s && s.lesson && s.lesson.id === id && s.lesson.title) return s.lesson; /* the lesson the desk prepared */
    var L = theoryList();
    for (var i = 0; i < L.length; i++) if (L[i].id === id) return L[i];
    return null;
  }
  /* best / last score per task — scores keep title + level, which are unique per task */
  function taskResults() {
    var res = {};
    scores().forEach(function (x) {
      var k = x.title + '|' + x.lv, r = res[k] || { n: 0, best: 0, last: 0 };
      r.n++; r.best = Math.max(r.best, Number(x.s) || 0); r.last = Number(x.s) || 0; res[k] = r;
    });
    return res;
  }
  function openTask(t) {
    var st = sget('academy:task', null);
    if (st && st.id === t.id && String(st.text || '').trim()) {
      /* resume the draft: point the task screen at this task's collection and domain */
      sset('academy:col', colOf(t)); sset('academy:dom', t.dkey || ''); sset('academy:tmode', 'tr');
      App.go('task');
    } else App.go('task', { id: t.id });
  }
  function lessonGroups(col) {
    var list = TASKS.filter(function (t) { return colOf(t) === col; });
    var groups = [];
    function add(key, name, icon, items, why) { if (items.length) groups.push({ key: key, name: name, icon: icon, items: items, why: why || '' }); }
    if (col === 'base') {
      add('core', 'Əsas kurs', 'cap', list.filter(function (t) { return !t.dkey; }), 'Turizm, yazışma, biznes, hüquq, interfeys — qısa peşəkar mətnlər və simulyator sifarişi.');
      DOMAINS.forEach(function (d) { add(d.key, d.name, d.icon, list.filter(function (t) { return t.dkey === d.key; }), d.why); });
    } else {
      var by = {}, order = [];
      list.forEach(function (t) { var k = t.domain || 'Digər'; if (!by[k]) { by[k] = []; order.push(k); } by[k].push(t); });
      order.forEach(function (k) { add(k, k, col === 'docs' ? 'file' : 'globe', by[k]); });
    }
    groups.forEach(function (g) { g.items = g.items.map(function (t, i) { return { t: t, i: i }; }).sort(function (a, b) { return levelIdx(a.t.level) - levelIdx(b.t.level) || a.i - b.i; }).map(function (x) { return x.t; }); });
    return groups;
  }

  function renderLessons(page, params) {
    var lid = params.lesson || (params.id && findTheory(params.id) ? params.id : null);
    var L = lid ? findTheory(lid) : null;
    if (L) { renderLessonPage(page, L); return; }
    if (lid) later(function () { App.toast('Dərs tapılmadı', 'info', { sub: 'Siyahıdan başqa dərs seçin' }); }, 300);
    if (!COLS.some(function (c) { return c.id === LSF.col; })) LSF.col = 'base';

    var res = taskResults(), stDraft = sget('academy:task', null);
    var draftId = stDraft && stDraft.id && String(stDraft.text || '').trim() ? stDraft.id : null;
    var all = TASKS.length, doneN = TASKS.filter(function (t) { return res[t.title + '|' + t.level]; }).length;
    page.appendChild(acadNav('lessons'));
    page.appendChild(pageHead('Dərslər',
      theoryList().length + ' nəzəri dərs · ' + all + ' tərcümə tapşırığı · ' + doneN + ' yoxlanılıb. Sahə və səviyyə üzrə qruplaşdırılıb — sətrə toxunun, tapşırıq açılır.', [
        h('button', { class: 'btn btn-primary', type: 'button', onclick: function () { App.go('task'); } }, ie('edit'), draftId ? 'Tapşırığa davam et' : 'Növbəti tapşırıq')]));

    /* filters */
    var colSeg = segBtns(COLS.map(function (c) { return { id: c.id, label: c.id === 'base' ? 'Mirzə kursu' : c.id === 'news' ? 'Xəbərlər' : 'Sənədlər', title: c.label }; }), LSF.col,
      function (id) { LSF.col = id; colSeg._paint(id); paintList(); }, 'Mətn toplusu', 'sm');
    var lvSel = h('select', { class: 'select sm', 'aria-label': 'Səviyyə' }, h('option', { value: '', text: 'Bütün səviyyələr' }),
      LEVELS.map(function (l) { return h('option', { value: l.id, text: l.id + ' · ' + l.name }); }));
    lvSel.value = LSF.lv;
    lvSel.addEventListener('change', function () { LSF.lv = lvSel.value; paintList(); });
    var stSel = h('select', { class: 'select sm', 'aria-label': 'Status' },
      h('option', { value: '', text: 'Hamısı' }), h('option', { value: 'todo', text: 'Başlanmayıb' }), h('option', { value: 'prog', text: 'Davam edir' }), h('option', { value: 'done', text: 'Yoxlanılıb' }));
    stSel.value = LSF.st;
    stSel.addEventListener('change', function () { LSF.st = stSel.value; paintList(); });
    var q = h('input', { class: 'input', type: 'search', placeholder: 'Başlıq, sifarişçi və ya sahə…', 'aria-label': 'Tapşırıq axtar', autocomplete: 'off', spellcheck: 'false', value: LSF.q });
    q.addEventListener('input', function () { LSF.q = q.value; paintList(); });
    var fCol = field('Toplu', colSeg, 'lessons-f-col');
    if (COLS.length < 2) fCol.hidden = true;
    page.appendChild(h('div', { class: 'lessons-bar', role: 'group', 'aria-label': 'Süzgəclər' },
      fCol, field('Səviyyə', lvSel, 'lessons-f-sel'), field('Status', stSel, 'lessons-f-sel'),
      h('label', { class: 'acad-field lessons-f-q' }, h('span', { text: 'Axtarış' }), h('span', { class: 'input-ic' }, ie('search'), q))));

    /* theory lessons */
    var TH = theoryList();
    if (TH.length) {
      var done = theoryDone();
      page.appendChild(h('section', { class: 'acad-sec', 'aria-labelledby': 'lessons-th-h' },
        h('div', { class: 'acad-sec-h' }, h('h2', { id: 'lessons-th-h', text: 'Nəzəri dərslər' }), h('small', { class: 'tnum', text: TH.filter(function (x) { return done[x.id]; }).length + ' / ' + TH.length + ' keçilib' })),
        h('div', { class: 'lessons-grp' }, TH.map(function (x) {
          var b = h('button', { class: 'lessons-row', type: 'button' },
            h('span', { class: 'lessons-th-ic', html: App.icon('book'), 'aria-hidden': 'true' }),
            h('span', { class: 'lessons-t' }, h('b', { text: x.title }), h('small', { text: [x.topic, x.level].filter(Boolean).join(' · ') })),
            h('span', { class: 'lessons-len', text: (x.minutes || 5) + ' dəq · +' + (x.xp || 30) + ' XP' }),
            done[x.id] ? h('span', { class: 'lessons-st done' }, ie('check'), 'Keçilib') : h('span', { class: 'lessons-st', text: 'Başlanmayıb' }),
            h('span', { class: 'lessons-chev', html: App.icon('chevron'), 'aria-hidden': 'true' }));
          b.addEventListener('click', function () { App.go('lessons', { lesson: x.id }); });
          return b;
        }))));
    }

    var listSec = h('section', { class: 'acad-sec', 'aria-labelledby': 'lessons-tasks-h' });
    page.appendChild(listSec);
    function statusOf(t) { return res[t.title + '|' + t.level] ? 'done' : t.id === draftId ? 'prog' : 'todo'; }
    function paintList() {
      listSec.textContent = '';
      var f = fold(LSF.q.trim());
      var groups = lessonGroups(LSF.col).map(function (g) {
        return { g: g, rows: g.items.filter(function (t) {
          if (LSF.lv && t.level !== LSF.lv) return false;
          if (LSF.st && statusOf(t) !== LSF.st) return false;
          return !f || fold(t.title + ' ' + t.client + ' ' + t.domain + ' ' + g.name).indexOf(f) >= 0;
        }) };
      }).filter(function (x) { return x.rows.length; });
      var shown = groups.reduce(function (s, x) { return s + x.rows.length; }, 0);
      var colObj = COLS.filter(function (c) { return c.id === LSF.col; })[0];
      listSec.appendChild(h('div', { class: 'acad-sec-h' }, h('h2', { id: 'lessons-tasks-h', text: 'Tərcümə tapşırıqları' }), h('small', { class: 'tnum', text: (colObj ? colObj.label + ' · ' : '') + shown + ' tapşırıq' })));
      if (!groups.length) {
        listSec.appendChild(emptyNote('Uyğun tapşırıq yoxdur', 'Süzgəcləri dəyişin və ya axtarışı təmizləyin.', [
          h('button', { class: 'btn btn-secondary btn-sm', type: 'button', onclick: function () { LSF.lv = ''; LSF.st = ''; LSF.q = ''; lvSel.value = ''; stSel.value = ''; q.value = ''; paintList(); } }, 'Süzgəcləri sıfırla')]));
        return;
      }
      groups.forEach(function (x) {
        var g = x.g, dn = g.items.filter(function (t) { return statusOf(t) === 'done'; }).length;
        listSec.appendChild(h('div', { class: 'lessons-grp', role: 'group', 'aria-label': g.name },
          h('div', { class: 'lessons-gh', title: g.why || null }, ie(g.icon), h('h3', { text: g.name }),
            h('span', { class: 'acad-count', text: dn + ' / ' + g.items.length }), bar(g.items.length ? dn / g.items.length * 100 : 0)),
          x.rows.map(function (t) { return taskRow(t, res[t.title + '|' + t.level], t.id === draftId); })));
      });
    }
    paintList();
  }

  function taskRow(t, r, inProg) {
    var status;
    if (r) status = h('span', { class: 'lessons-st done', title: r.n + ' yoxlama · son bal ' + r.last }, ie('check'), h('span', { class: 'lessons-sc', text: String(r.best) }), h('span', { class: 'lessons-gr', text: gradeOf(r.best).l }));
    else if (inProg) status = h('span', { class: 'lessons-st prog', text: 'Davam edir' });
    else status = h('span', { class: 'lessons-st', text: 'Başlanmayıb' });
    var b = h('button', { class: 'lessons-row', type: 'button', 'aria-label': t.level + ' · ' + t.title + ' · ' + (r ? 'ən yaxşı bal ' + r.best : inProg ? 'davam edir' : 'başlanmayıb') },
      lvTag(t.level),
      h('span', { class: 'lessons-t' }, h('b', { text: t.title }), h('small', { text: [t.sim ? 'Simulyator' : null, t.client, t.domain !== t.client ? t.domain : null].filter(Boolean).join(' · ') })),
      h('span', { class: 'lessons-len', text: words(t.src) + ' söz · ' + t.minutes + ' dəq' }),
      status,
      h('span', { class: 'lessons-chev', html: App.icon('chevron'), 'aria-hidden': 'true' }));
    b.addEventListener('click', function () { openTask(t); });
    return b;
  }

  /* one theory lesson as a page: rule, examples, typical mistakes, quiz, a short task
     (same stores and XP rule as the desk's lesson sheet: home:lessondone:<day>, home:lessons-done) */
  function renderLessonPage(page, L) {
    var exs = (L.examples || []).filter(function (e) { return e && e.src && e.tgt; });
    var pits = (L.pitfalls || []).filter(function (x) { return x && x.wrong && x.right; });
    var qz = (L.quiz || []).filter(function (q) { return q && q.q && Array.isArray(q.options) && q.options.length >= 2 && q.answer >= 0 && q.answer < q.options.length; });
    var task = L.task && L.task.src ? L.task : null;
    var right = 0, answered = 0;
    var passed = !!theoryDone()[L.id];
    page.appendChild(acadNav('lessons'));
    page.appendChild(h('button', { class: 'btn btn-ghost btn-sm lessons-back', type: 'button', onclick: function () { App.go('lessons'); } }, ie('back'), 'Bütün dərslər'));
    page.appendChild(h('div', { class: 'page-h' },
      h('div', null,
        h('h1', { text: L.title }),
        metaLine([L.topic || 'Dərs', L.level, (L.minutes || 5) + ' dəqiqə', '+' + (L.xp || 30) + ' XP', passed ? statusPill('Keçilib', 'ok') : null]))));
    var ls = h('div', { class: 'lessons-ls' });
    page.appendChild(ls);
    function sec(title, kids) { return h('section', { class: 'lessons-ls-sec' }, h('h2', { text: title }), kids); }
    if (L.intro) ls.appendChild(h('p', { class: 'task-src-tx', text: L.intro }));
    if (L.rule) ls.appendChild(h('div', { class: 'lessons-rule' }, h('span', { class: 'acad-cap', text: 'Qayda' }), h('p', { text: L.rule })));
    if (exs.length) ls.appendChild(sec('Nümunələr', h('div', null, exs.map(function (e) {
      return h('div', { class: 'lessons-ex' }, h('p', { class: 'src', lang: L.from || 'en', text: e.src }), h('p', { lang: L.to || 'az', text: e.tgt }), e.note ? h('small', { text: e.note }) : null);
    }))));
    if (pits.length) ls.appendChild(sec('Tipik səhvlər', h('div', null, pits.map(function (x) {
      return h('div', { class: 'lessons-pit' }, h('span', null, h('s', { class: 'acad-was', text: x.wrong }), h('span', { class: 'acad-count', text: '→' }), h('b', { class: 'acad-now', text: x.right })), x.why ? h('small', { text: x.why }) : null);
    }))));
    if (qz.length) {
      var status = h('p', { class: 'acad-count', 'aria-live': 'polite', text: qz.length + ' sual · hər birində bir cavab seçin' });
      var quizDone = function (el) {
        var key = 'home:lessondone:' + dayKey(), done = sget(key, {}) || {};
        if (done[L.id] != null) { App.toast('Dərs təkrarlandı', 'info', { sub: right + ' / ' + qz.length + ' düzgün · XP yalnız ilk dəfə verilir' }); return; }
        done[L.id] = right; sset(key, done);
        var allDone = theoryDone(); allDone[L.id] = true; sset('home:lessons-done', allDone);
        var xp = Math.max(5, Math.round((L.xp || 30) * (qz.length ? 0.5 + 0.5 * right / qz.length : 1)));
        addXP(xp, pointOf(el));
        nz(right === qz.length ? 'celebrate' : 'success', right === qz.length ? 'Hamısı düzdür.' : right + ' / ' + qz.length + '. Səhv olanlara bir də baxın.', 2600);
      };
      ls.appendChild(sec('Suallar', [status].concat(qz.map(function (q, i) {
        var fb = h('div', { 'aria-live': 'polite' });
        var wrap = h('div', { class: 'practice-opts', role: 'group', 'aria-label': 'Sual ' + (i + 1) + ' — variantlar' });
        var btns = q.options.map(function (o, k) {
          var b = h('button', { class: 'choice practice-opt', type: 'button' },
            h('span', { class: 'practice-opt-k', 'aria-hidden': 'true', text: 'ABCDE'.charAt(k) }), h('span', null, h('b', { text: o })));
          b.addEventListener('click', function () {
            if (wrap.classList.contains('locked')) return;
            wrap.classList.add('locked');
            var ok = k === q.answer;
            btns.forEach(function (x, j) { x.setAttribute('aria-disabled', 'true'); x.classList.add(j === q.answer ? 'right' : j === k ? 'wrong' : 'dim'); });
            fb.appendChild(h('div', { class: 'practice-fb' + (ok ? '' : ' bad') }, h('b', { text: ok ? 'Düzdür. ' : 'Düzgün cavab: ' + 'ABCDE'.charAt(q.answer) + '. ' }), q.explain || ''));
            answered++; if (ok) right++;
            status.textContent = right + ' / ' + qz.length + ' düzgün' + (answered < qz.length ? ' · ' + (qz.length - answered) + ' sual qalıb' : '');
            if (answered === qz.length) quizDone(status);
          });
          wrap.appendChild(b);
          return b;
        });
        return h('div', { class: 'lessons-q' }, h('p', { text: (i + 1) + '. ' + q.q }), wrap, fb);
      }))));
    }
    if (task) ls.appendChild(lessonTask(L, task));
    if (L.summary) ls.appendChild(h('div', { class: 'lessons-sum' }, h('span', { class: 'acad-cap', text: 'Yadda saxlayın' }), h('p', { text: L.summary })));
    ls.appendChild(h('div', { class: 'acad-act' },
      h('button', { class: 'btn btn-secondary', type: 'button', onclick: function () { App.go('lessons'); } }, ie('back'), 'Bütün dərslər'),
      h('button', { class: 'btn btn-primary', type: 'button', onclick: function () { App.go('task'); } }, 'Tərcümə tapşırığı', ie('arrow'))));
  }

  function lessonTask(L, task) {
    var ta = h('textarea', { class: 'textarea', id: 'lessons-ta', rows: '3', lang: L.to || 'az', placeholder: 'Tərcüməniz…' });
    var hintsBox = h('ol', { class: 'task-hints-l' }), res = h('div', { class: 'lessons-res', 'aria-live': 'polite' }), shown = 0;
    var hints = task.hints || [];
    var hintBtn = hints.length ? h('button', { class: 'btn btn-ghost btn-sm', type: 'button' }, ie('bulb'), 'İpucu') : null;
    if (hintBtn) hintBtn.addEventListener('click', function () {
      if (shown >= hints.length) return;
      hintsBox.appendChild(h('li', { text: hints[shown++] }));
      if (shown >= hints.length) hintBtn.disabled = true;
    });
    var modelBtn = task.model ? h('button', { class: 'btn btn-ghost btn-sm', type: 'button' }, ie('eye'), 'Nümunə') : null;
    if (modelBtn) modelBtn.addEventListener('click', function () {
      modelBtn.disabled = true;
      res.appendChild(h('div', { class: 'acad-srcblk' }, h('span', { class: 'acad-rv-lbl', text: 'Nümunə tərcümə' }), h('p', { lang: L.to || 'az', style: 'color:var(--text)', text: task.model })));
    });
    var check = h('button', { class: 'btn btn-primary btn-sm', type: 'button' }, ie('check'), 'Yoxla');
    check.addEventListener('click', function () {
      var text = ta.value.trim();
      if (isBusy(check)) return;
      if (text.split(/\s+/).length < 2) { ta.setAttribute('aria-invalid', 'true'); focusSoft(ta); return; }
      ta.removeAttribute('aria-invalid');
      busy(check, true);
      res.textContent = '';
      res.appendChild(h('div', { class: 'sk-stack', role: 'status' }, h('span', { class: 'skeleton text' }), h('span', { class: 'skeleton text', style: 'width:70%' })));
      App.fakeAI('grade', { src: task.src, text: text, model: task.model || '', level: L.level, from: L.from, to: L.to }, 600).then(function (r) {
        busy(check, false);
        if (!res.isConnected) return;
        res.textContent = '';
        if (!r || r.ok === false || r.score == null) {
          res.appendChild(h('div', { class: 'practice-fb bad' }, (r && r.error) || 'Yoxlama tamamlanmadı — bağlantını yoxlayın və yenidən cəhd edin.'));
          return;
        }
        var errs = r.errors || [];
        res.appendChild(metaLine([h('b', { class: 'acad-mono', text: r.score + ' / 100' }), errs.length ? errs.length + ' qeyd' : 'Qeyd yoxdur', r.summary || null]));
        if (errs.length) res.appendChild(reviewList(errs.slice(0, 3).map(function (e) {
          var miss = isMissing({ was: String(e.was == null ? '' : e.was) });
          return reviewRow({ sev: e.severity || SEV[e.type] || 'mid', type: e.type || 'Məna', was: miss ? 'Tərcümədə yoxdur' : String(e.was), missing: miss, now: e.now || '—', why: e.why || '', who: e.elder || TYPE_ELDER[e.type] || 'Mənaçı Mirzə' });
        }), false, 'Qeydlər'));
        if (task.model && modelBtn && !modelBtn.disabled) modelBtn.click();
      }, function () { busy(check, false); res.textContent = ''; });
    });
    return h('section', { class: 'lessons-ls-sec' }, h('h2', { text: 'Tapşırıq' }),
      h('div', { class: 'acad-srcblk' }, h('span', { class: 'acad-rv-lbl', text: 'Mənbə · ' + upper(L.from || 'en') }), h('p', { lang: L.from || 'en', style: 'color:var(--text)', text: task.src })),
      h('div', { class: 'field' }, h('label', { class: 'sr-only', for: 'lessons-ta', text: 'Tərcüməniz' }), ta),
      h('div', { class: 'task-hints' }, hintsBox),
      h('div', { class: 'acad-act' }, check, hintBtn, modelBtn),
      res);
  }

  /* ------------------------------------------------------------------
     10. GLOSSARY SCREEN ('glossary', «Lüğət») — the domain glossaries as a
         page: domain filter + search + term · translation · note table.
         Same data as App.academyGlossary (the quick sheet).
     ------------------------------------------------------------------ */
  var GF = { dom: '', q: '' };

  function renderGlossary(page, params) {
    if (params.dom != null && (params.dom === '' || domByKey(params.dom))) GF.dom = params.dom;
    if (GF.dom && !domByKey(GF.dom)) GF.dom = '';
    var groups = DOMAINS.filter(function (d) { return d.glossary.length; });
    var total = groups.reduce(function (s, d) { return s + d.glossary.length; }, 0);
    page.appendChild(acadNav('glossary'));
    page.appendChild(pageHead('Lüğət', groups.length + ' peşəkar sahə · ' + total + ' termin. İngiliscə termin, Azərbaycan dilində qəbul olunmuş qarşılığı və istifadə qeydi.', [
      h('button', { class: 'btn btn-ghost', type: 'button', onclick: function () { App.go('task', GF.dom ? { dom: GF.dom } : {}); } }, ie('edit'), 'Bu sahədən tapşırıq')]));
    if (!total) { page.appendChild(emptyNote('Lüğət yüklənmədi', 'Sahə lüğətləri hələ hazır deyil. Səhifəni yeniləyin.')); return; }

    var side = h('nav', { class: 'glossary-doms', 'aria-label': 'Sahələr' });
    var sideBtns = [];
    var items = [{ key: '', name: 'Bütün sahələr', icon: 'grid', n: total }].concat(groups.map(function (d) { return { key: d.key, name: d.name, icon: d.icon, n: d.glossary.length }; }));
    items.forEach(function (it) {
      var b = h('button', { class: 'glossary-dom', type: 'button', 'aria-pressed': 'false' }, ie(it.icon), h('span', { text: it.name }), h('small', { text: String(it.n) }));
      b.addEventListener('click', function () { setDomG(it.key); });
      side.appendChild(b); sideBtns.push(b);
    });
    var sel = h('select', { class: 'select sm', 'aria-label': 'Sahə' }, items.map(function (it) { return h('option', { value: it.key, text: it.name + ' · ' + it.n }); }));
    sel.addEventListener('change', function () { setDomG(sel.value); });
    var q = h('input', { class: 'input', type: 'search', placeholder: 'İngiliscə və ya azərbaycanca axtarın…', 'aria-label': 'Termin axtar', autocomplete: 'off', spellcheck: 'false', value: GF.q });
    q.addEventListener('input', function () { GF.q = q.value; paint(); });
    var why = h('p', { class: 'glossary-why' });
    var count = h('span', { class: 'acad-count', 'aria-live': 'polite' });
    var tbody = h('tbody');
    var table = h('div', { class: 'progress-tw' }, h('table', { class: 'progress-t glossary-t' },
      h('thead', null, h('tr', null, h('th', { text: 'Termin · EN' }), h('th', { text: 'Azərbaycanca' }), h('th', { text: 'Qeyd' }))),
      tbody));
    var emptySlot = h('div');
    function setDomG(k) { GF.dom = k; paint(); }
    function paint() {
      var cur = GF.dom || '';
      sideBtns.forEach(function (b, i) { b.setAttribute('aria-pressed', items[i].key === cur ? 'true' : 'false'); });
      sel.value = cur;
      var d = domByKey(cur);
      why.textContent = d && d.why ? d.why : '';
      why.hidden = !why.textContent;
      var f = fold(GF.q.trim()), n = 0;
      tbody.textContent = '';
      (d ? [d] : groups).forEach(function (g) {
        var rows = g.glossary.filter(function (x) { return !f || fold(x.en + ' ' + x.az + ' ' + x.note).indexOf(f) >= 0; });
        if (!rows.length) return;
        n += rows.length;
        if (!d) tbody.appendChild(h('tr', { class: 'grp' }, h('td', { colspan: '3' }, g.name, h('span', { text: String(rows.length) }))));
        rows.forEach(function (x) {
          tbody.appendChild(h('tr', null, h('td', { class: 'en', lang: 'en', text: x.en }), h('td', { class: 'az', lang: 'az', text: x.az }), h('td', { class: 'nt', text: x.note || '' })));
        });
      });
      table.hidden = !n;
      emptySlot.textContent = '';
      if (!n) emptySlot.appendChild(emptyNote('Heç nə tapılmadı', 'Başqa sözlə axtarın və ya bütün sahələrə baxın.', [
        h('button', { class: 'btn btn-secondary btn-sm', type: 'button', onclick: function () { GF.q = ''; q.value = ''; GF.dom = ''; paint(); } }, 'Axtarışı təmizlə')]));
      count.textContent = f ? n + ' termin tapıldı' : n + ' termin' + (d ? '' : ' · ' + groups.length + ' sahə');
    }
    page.appendChild(h('div', { class: 'glossary-layout' },
      side,
      h('div', { class: 'glossary-main' },
        h('div', { class: 'glossary-tools' },
          field('Sahə', sel, 'glossary-sel'),
          h('label', { class: 'acad-field', style: 'flex:1 1 260px' }, h('span', { text: 'Axtarış' }), h('span', { class: 'input-ic' }, ie('search'), q))),
        h('div', { class: 'acad-sec-h' }, why, count),
        table, emptySlot)));
    paint();
  }

  /* ------------------------------------------------------------------
     11. REGISTER
     ------------------------------------------------------------------ */
  var RENDER = { task: renderTask, practice: renderPractice, cards: renderCards, progress: renderProgress, lessons: renderLessons, glossary: renderGlossary };
  function start(id) {
    return function (el, params) {
      cleanup(); gen++;
      T = null; P = null; C = null;
      App.css('academy', CSS);
      var page = h('div', { class: 'page acad-page ' + id + '-page' });
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
  App.register('lessons', { title: 'Dərslər', icon: 'list', group: 'Akademiya', mode: 'academy', render: start('lessons'), leave: leave });
  App.register('glossary', { title: 'Lüğət', icon: 'book', group: 'Akademiya', mode: 'academy', render: start('glossary'), leave: leave });
})();
