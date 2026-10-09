/* =====================================================================
   NUANZA QRAMMATİKA — ai/grammar-rules.js
   Deterministik (oflayn) yoxlamalar — AI-dan əvvəl/AI olmadan dərhal işləyir.
     • İngilis dili (əsas — öyrənənlər üçün): «I am agree», «more better», «didn't went»,
       «married with him», «people is», rəqəmdən sonra cəm, a/an, «Yesterday I go»,
       «He go», «can to», «I have 20 years», «since 3 years», yalançı dostlar, kalkalar,
       in/on/at, sayılmayan isimlər, kiçik «i», boşluq və durğu.
     • Azərbaycan dili: türk formaları (değil, için, -yor…), rus sözləri, «ki» ayrı,
       -mı/-mi bitişik, bitişik/ayrı yazılış (və ya, hər bir…), boşluq/durğu, « »,
       cümlə əvvəli böyük hərf, ay/həftə günləri kiçik hərflə, orfoqrafiya siyahısı,
       danışıq forması (gələcəm), «Men/Sen» (yalnız aydın hallarda).
   Prinsip: dəqiqlik tamlıqdan vacibdir — düzgün mətndə yalançı həyəcan olmamalıdır.
   Hər qeyd: {start, end, wrong, fix, type, why, sev, rule, ruleTitle, src:'local'}
   («manual:true» — avtomatik düzəliş yoxdur, fix boşdur).
   Brauzerdə window.NuanzaGrammarRules, Node-da module.exports.
   ===================================================================== */
(function (root) {
  'use strict';

  /* ------------------------------------------------------------------
     1. QAYDA KATALOQU (server.js GRAMMAR_RULES ilə eyni id-lər)
     keys: lövhə üçün açar sözlər (kurs vahidini tapmaq üçün ehtiyat yol)
     ------------------------------------------------------------------ */
  var RULES = {
    'en.article': { t: 'Artikllər: a / an / the', type: 'Article', keys: ['article', 'a-an', 'the'], ex: [['I have car.', 'I have a car.']], note: 'Azərbaycan dilində artikl yoxdur, ingilis dilində isə tək sayda sayılan isimdən əvvəl a/an və ya the lazımdır.' },
    'en.a_an': { t: 'a yoxsa an', type: 'Article', keys: ['a-an', 'article'], ex: [['a apple', 'an apple'], ['an university', 'a university']], note: 'Qərar hərfə yox, səsə görədir: sait səsindən əvvəl an (an hour), samitdən əvvəl a (a uniform).' },
    'en.zero_article': { t: 'Ümumi anlayışlarda «the» işlənmir', type: 'Article', keys: ['zero-article', 'article', 'the'], ex: [['The education is important.', 'Education is important.']], note: 'Ümumiyyətlə danışanda (təhsil, həyat, sevgi) the qoyulmur.' },
    'en.be_agree': { t: '«agree» feldir: I agree', type: 'Grammar', keys: ['agree', 'be', 'to-be'], ex: [['I am agree.', 'I agree.'], ['She is not agree.', "She doesn't agree."]], note: '«Razıyam» sözbəsöz «I am agree» olmur — agree özü feldir.' },
    'en.be_verb': { t: 'to be: am / is / are', type: 'Grammar', keys: ['to-be', 'be', 'am-is-are'], ex: [['I is happy.', 'I am happy.'], ['They was late.', 'They were late.']], note: 'I am, he/she/it is, we/you/they are; keçmişdə I/he/she/it was, we/you/they were.' },
    'en.sv_agreement': { t: 'Mübtəda ilə xəbərin uzlaşması', type: 'Grammar', keys: ['agreement', 'subject-verb'], ex: [['People is kind.', 'People are kind.']], note: 'People, police, children cəmdir — are/were/have ilə işlənir.' },
    'en.third_person_s': { t: 'He/she/it + fel-s', type: 'Grammar', keys: ['present-simple', 'third-person', 'simple-present'], ex: [['He go to school.', 'He goes to school.'], ['She have a cat.', 'She has a cat.']], note: 'Present Simple-da he/she/it-dən sonra felə -s/-es artırılır.' },
    'en.did_base': { t: "did / didn't + felin 1-ci forması", type: 'Tense', keys: ['past-simple', 'did', 'negative'], ex: [["I didn't went.", "I didn't go."], ['Did you saw it?', 'Did you see it?']], note: 'Keçmiş zaman artıq did-dədir, ona görə fel əsas formada qalır.' },
    'en.modal_base': { t: 'can / must / should + felin 1-ci forması', type: 'Grammar', keys: ['modal', 'can', 'must', 'should'], ex: [['I can to swim.', 'I can swim.']], note: 'Modal fellərdən sonra «to» işlənmir.' },
    'en.past_simple': { t: 'Past Simple: keçmişdə bitmiş iş', type: 'Tense', keys: ['past-simple', 'past'], ex: [['Yesterday I go to work.', 'Yesterday I went to work.']], note: 'yesterday, last week, ago kimi sözlər varsa, fel keçmiş zamanda olur.' },
    'en.present_perfect': { t: 'Present Perfect yoxsa Past Simple', type: 'Tense', keys: ['present-perfect', 'perfect'], ex: [['I have seen him yesterday.', 'I saw him yesterday.'], ['I live here since 2020.', 'I have lived here since 2020.']], note: 'Dəqiq keçmiş vaxt (yesterday, in 2020) Present Perfect ilə işlənmir.' },
    'en.continuous': { t: 'Present Continuous / Simple', type: 'Tense', keys: ['present-continuous', 'continuous'], ex: [['I am knowing him.', 'I know him.']], note: 'know, like, want kimi vəziyyət felləri adətən -ing ilə işlənmir.' },
    'en.future': { t: 'Gələcək zaman: will / going to', type: 'Tense', keys: ['future', 'will', 'going-to'], ex: [['I will to call you.', 'I will call you.']], note: 'will-dən sonra felin əsas forması gəlir.' },
    'en.comparative': { t: 'Müqayisə dərəcəsi: better, more…', type: 'Grammar', keys: ['comparative', 'superlative', 'comparison'], ex: [['more better', 'better'], ['the most best', 'the best']], note: 'better, bigger artıq müqayisə formasıdır — more əlavə edilmir.' },
    'en.plural': { t: 'Cəm: rəqəmdən sonra -s', type: 'Grammar', keys: ['plural', 'nouns', 'countable'], ex: [['two book', 'two books'], ['three child', 'three children']], note: 'Azərbaycan dilində «iki kitab» deyilir, ingilis dilində isə rəqəmdən sonra isim cəmdə olur.' },
    'en.uncountable': { t: 'Sayılmayan isimlər', type: 'Grammar', keys: ['uncountable', 'countable', 'much-many'], ex: [['informations', 'information'], ['much people', 'many people']], note: 'information, advice, furniture cəm şəkilçisi almır; sayılan isimlərlə many işlənir.' },
    'en.preposition': { t: 'Sözönülər: in / on / at', type: 'Word choice', keys: ['preposition', 'prepositions', 'in-on-at'], ex: [['at the morning', 'in the morning'], ['in Monday', 'on Monday']], note: 'in — ay, il, günün hissəsi; on — həftənin günü, tarix; at — saat, night.' },
    'en.verb_pattern': { t: 'Fel + sözönü birləşmələri', type: 'Word choice', keys: ['verb-patterns', 'preposition', 'phrasal'], ex: [['married with him', 'married to him'], ['discuss about it', 'discuss it'], ['explain me', 'explain to me']], note: 'Bəzi fellər müəyyən sözönü ilə işlənir — bunları birlikdə öyrənmək lazımdır.' },
    'en.word_order': { t: 'Söz sırası: S + V + O', type: 'Grammar', keys: ['word-order', 'adverb'], ex: [['I very like it.', 'I really like it.']], note: 'İngilis cümləsində fel mübtədadan dərhal sonra gəlir, very feli təyin etmir.' },
    'en.questions': { t: 'Sual cümləsi: do / does / did', type: 'Grammar', keys: ['questions', 'question'], ex: [['Where you live?', 'Where do you live?']], note: 'Sual cümləsində köməkçi fel mübtədadan əvvəl gəlir.' },
    'en.pronoun': { t: 'he / she / it — cinsə görə əvəzlik', type: 'Grammar', keys: ['pronoun', 'pronouns'], ex: [['My sister said he is busy.', 'My sister said she is busy.']], note: 'Azərbaycan dilindəki «o» ingilis dilində kişi üçün he, qadın üçün she, əşya üçün it olur.' },
    'en.false_friend': { t: 'Yalançı dostlar', type: 'Word choice', keys: ['false-friends', 'vocabulary'], ex: [['This topic is actual.', 'This topic is relevant.'], ['go to the magazine', 'go to the shop']], note: 'Bəzi sözlər eyni səslənir, amma mənası fərqlidir: actual = həqiqi, magazine = jurnal.' },
    'en.calque': { t: 'Kalka: sözbəsöz tərcümə', type: 'Word choice', keys: ['collocations', 'calque', 'make-do'], ex: [['make a photo', 'take a photo'], ['I have 20 years.', 'I am 20 years old.']], note: 'Rus və Azərbaycan ifadələrini sözbəsöz çevirmək ingilis dilində təbii olmur.' },
    'en.capital': { t: 'Böyük hərf: I, cümlə əvvəli, adlar', type: 'Spelling', keys: ['capital', 'capitalisation', 'punctuation'], ex: [['i think so', 'I think so']], note: '«I» (mən) həmişə böyük hərflə yazılır; cümlə də böyük hərflə başlayır.' },
    'en.spelling': { t: 'Orfoqrafiya', type: 'Spelling', keys: ['spelling'], ex: [], note: 'Sözün düzgün yazılışı.' },
    'en.punctuation': { t: 'Durğu işarələri', type: 'Punctuation', keys: ['punctuation'], ex: [['Hello ,world', 'Hello, world']], note: 'Durğu işarəsindən əvvəl boşluq qoyulmur, sonra isə qoyulur.' },
    'en.style': { t: 'Üslub və aydınlıq', type: 'Style', keys: ['style'], ex: [], note: 'Daha təbii və aydın ifadə.' },

    'az.turkish': { t: 'Türk formaları', type: 'Türk forması', keys: [], ex: [['değil', 'deyil'], ['için', 'üçün'], ['geliyor', 'gəlir']], note: 'Türk dilinin söz və şəkilçiləri Azərbaycan ədəbi dilində işlənmir.' },
    'az.russian': { t: 'Rus sözləri və kalkalar', type: 'Rus kalkası', keys: [], ex: [['spravka', 'arayış'], ['naprimer', 'məsələn']], note: 'Yazılı mətndə rus sözlərinin Azərbaycan qarşılığı işlənir.' },
    'az.calque': { t: 'Kalka', type: 'Kalka', keys: [], ex: [], note: 'Başqa dildən sözbəsöz köçürülmüş ifadə.' },
    'az.ki': { t: '«ki» bağlayıcısı ayrı yazılır', type: 'Bitişik/ayrı yazılış', keys: [], ex: [['bilirəmki', 'bilirəm ki'], ['beləki', 'belə ki']], note: 'Bağlayıcı «ki» ayrı yazılır; «çünki», «halbuki», «sanki» isə bitişikdir.' },
    'az.mi': { t: 'Sual ədatı -mı/-mi bitişik yazılır', type: 'Bitişik/ayrı yazılış', keys: [], ex: [['gəlirsən mi?', 'gəlirsənmi?']], note: 'Azərbaycan dilində sual ədatı sözə bitişik yazılır (türk dilindən fərqli olaraq).' },
    'az.compound': { t: 'Bitişik və ayrı yazılış', type: 'Bitişik/ayrı yazılış', keys: [], ex: [['vəya', 'və ya'], ['hərbir', 'hər bir'], ['heçkim', 'heç kim']], note: '«və ya», «hər bir», «heç kim», «həm də» ayrı yazılır.' },
    'az.punct_space': { t: 'Durğu işarəsi və boşluq', type: 'Durğu', keys: [], ex: [['Salam ,dost', 'Salam, dost']], note: 'Durğu işarəsi əvvəlki sözə bitişik yazılır, ondan sonra boşluq qoyulur.' },
    'az.comma': { t: 'Vergül: çünki, lakin, amma', type: 'Durğu', keys: [], ex: [['Gəlmədim çünki xəstəyəm.', 'Gəlmədim, çünki xəstəyəm.']], note: '«çünki», «lakin», «amma» ilə başlayan hissədən əvvəl vergül qoyulur.' },
    'az.quotes': { t: 'Dırnaq: « »', type: 'Durğu', keys: [], ex: [['"Nuanza"', '«Nuanza»']], note: 'Azərbaycan dilində əsas dırnaq işarəsi « » formasıdır.' },
    'az.capital': { t: 'Böyük hərf', type: 'Böyük/kiçik hərf', keys: [], ex: [['bakıda', 'Bakıda'], ['gəldim. sonra', 'gəldim. Sonra']], note: 'Cümlə və xüsusi adlar (şəhər, ölkə) böyük hərflə başlayır.' },
    'az.month': { t: 'Ay və həftə günləri kiçik hərflə', type: 'Böyük/kiçik hərf', keys: [], ex: [['15 Mart 2024', '15 mart 2024'], ['Şənbə günü', 'şənbə günü']], note: 'Ay və həftə günlərinin adları kiçik hərflə yazılır (bayram adları istisnadır: 20 Yanvar).' },
    'az.ortho': { t: 'Orfoqrafiya', type: 'Orfoqrafiya', keys: [], ex: [['xaiş', 'xahiş'], ['gedmirəm', 'getmirəm'], ['Men', 'Mən']], note: 'Sözlər Orfoqrafiya lüğətinə uyğun yazılır.' },
    'az.suffix': { t: 'Şəkilçi və uzlaşma', type: 'Qrammatika', keys: [], ex: [], note: 'Şəkilçilər ahəng qanununa uyğun seçilir, mübtəda ilə xəbər uzlaşır.' },
    'az.order': { t: 'Söz sırası', type: 'Söz sırası', keys: [], ex: [], note: 'Azərbaycan cümləsində xəbər adətən sonda gəlir.' },
    'az.colloquial': { t: 'Danışıq forması', type: 'Üslub', keys: [], ex: [['gələcəm', 'gələcəyəm']], note: 'Yazılı mətndə danışıq formaları yerinə ədəbi forma işlənir.' },
    'az.style': { t: 'Üslub', type: 'Üslub', keys: [], ex: [['həmçinin də', 'həmçinin']], note: 'Artıq söz təkrarı (pleonazm) mətni ağırlaşdırır.' }
  };
  var TYPES = {
    en: ['Grammar', 'Spelling', 'Punctuation', 'Article', 'Tense', 'Word choice', 'Style'],
    az: ['Orfoqrafiya', 'Türk forması', 'Durğu', 'Qrammatika', 'Söz sırası', 'Üslub', 'Kalka', 'Böyük/kiçik hərf', 'Bitişik/ayrı yazılış', 'Rus kalkası']
  };
  /* Növlərin Azərbaycanca adı (EN növləri UI-da belə göstərilir) */
  var TYPE_AZ = { Grammar: 'Qrammatika', Spelling: 'Yazılış', Punctuation: 'Durğu', Article: 'Artikl', Tense: 'Zaman', 'Word choice': 'Söz seçimi', Style: 'Üslub' };

  /* ------------------------------------------------------------------
     2. KÖMƏKÇİLƏR
     ------------------------------------------------------------------ */
  var L = '\\p{L}\\p{N}';
  var IS_W = /[\p{L}\p{N}]/u;
  function lower(s) { try { return String(s).toLocaleLowerCase('az'); } catch (e) { return String(s).toLowerCase(); } }
  function upper(s) { try { return String(s).toLocaleUpperCase('az'); } catch (e) { return String(s).toUpperCase(); } }
  function lowerEn(s) { return String(s).toLowerCase(); }
  function isUpper(ch) { return ch !== lower(ch) && ch === upper(ch); }
  function cap(s, az) { s = String(s); return s ? (az ? upper(s.charAt(0)) : s.charAt(0).toUpperCase()) + s.slice(1) : s; }
  /* düzəlişi orijinalın hərf ölçüsünə uyğunlaşdırır */
  function matchCase(orig, fix, az) {
    if (!orig || !fix) return fix;
    if (orig.length > 1 && orig === (az ? upper(orig) : orig.toUpperCase()) && orig !== (az ? lower(orig) : orig.toLowerCase())) return az ? upper(fix) : fix.toUpperCase();
    if (isUpper(orig.charAt(0))) return cap(fix, az);
    return fix;
  }
  function issue(start, wrong, fix, rule, why, sev, extra) {
    var r = RULES[rule] || RULES['en.style'];
    var x = { start: start, end: start + wrong.length, wrong: wrong, fix: fix, type: r.type, why: why, sev: sev || 'mid', rule: rule, ruleTitle: r.t, src: 'local' };
    if (extra) for (var k in extra) if (Object.prototype.hasOwnProperty.call(extra, k)) x[k] = extra[k];
    return x;
  }
  /* bütün sözlər: {w, s, e} */
  function words(text) {
    var out = [], re = /[\p{L}\p{N}]+(?:['’][\p{L}]+)?/gu, m;
    while ((m = re.exec(text))) out.push({ w: m[0], s: m.index, e: m.index + m[0].length });
    return out;
  }
  /* regex ilə gəz; prefiks qrupu (sərhəd) üçün m[1] uzunluğu nəzərə alınır */
  function scan(re, text, fn) {
    re.lastIndex = 0;
    var m, guard = 0;
    while ((m = re.exec(text)) && guard++ < 5000) {
      if (m[0] === '') { re.lastIndex++; continue; }
      fn(m, m.index + (m[1] ? m[1].length : 0));
    }
  }
  /* sözlərin hərfi qarşılığı: «(^|[^L])(a|b|c)(?=[^L]|$)» */
  function wordRe(list, flags) {
    var alts = list.slice().sort(function (a, b) { return b.length - a.length; }).map(function (w) { return w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s+'); });
    return new RegExp('(^|[^' + L + '])(' + alts.join('|') + ')(?=[^' + L + ']|$)', 'g' + (flags || '') + 'u');
  }
  /* cümlə sərhədləri: [{s,e,text}] */
  function sentences(text) {
    var out = [], re = /[^.!?…\n]+[.!?…]*/g, m;
    while ((m = re.exec(text))) out.push({ s: m.index, e: m.index + m[0].length, t: m[0] });
    return out;
  }
  function sentenceAt(sents, i) { for (var k = 0; k < sents.length; k++) if (i >= sents[k].s && i < sents[k].e) return sents[k]; return null; }
  /* ahəng: son sait arxa sıradırmı? */
  function backVowel(w) { var m = lower(w).match(/[aıoueəiöü](?=[^aıoueəiöü]*$)/); return !m || /[aıou]/.test(m[0]); }
  function lastVowel(w) { var m = lower(w).match(/[aıoueəiöü](?=[^aıoueəiöü]*$)/); return m ? m[0] : 'a'; }

  /* ------------------------------------------------------------------
     3. İNGİLİS DİLİ — öyrənənlərin tipik səhvləri
     ------------------------------------------------------------------ */
  var IRR = {
    go: 'went', come: 'came', see: 'saw', have: 'had', do: 'did', make: 'made', take: 'took', eat: 'ate', buy: 'bought', meet: 'met',
    give: 'gave', get: 'got', write: 'wrote', speak: 'spoke', tell: 'told', say: 'said', think: 'thought', find: 'found', leave: 'left',
    feel: 'felt', know: 'knew', begin: 'began', bring: 'brought', drink: 'drank', sleep: 'slept', swim: 'swam', sing: 'sang', run: 'ran',
    sit: 'sat', stand: 'stood', win: 'won', lose: 'lost', send: 'sent', spend: 'spent', teach: 'taught', understand: 'understood',
    become: 'became', forget: 'forgot', fly: 'flew', drive: 'drove', ride: 'rode', wake: 'woke', wear: 'wore', break: 'broke',
    choose: 'chose', fall: 'fell', catch: 'caught', sell: 'sold', hear: 'heard', pay: 'paid', build: 'built', lend: 'lent'
  };
  var REG = ['visit', 'work', 'study', 'live', 'play', 'watch', 'want', 'like', 'love', 'talk', 'walk', 'start', 'finish', 'call', 'help', 'open',
    'stay', 'travel', 'decide', 'arrive', 'ask', 'cook', 'clean', 'move', 'try', 'learn', 'listen', 'wait', 'answer', 'plan', 'stop', 'enjoy', 'need'];
  var PAST2BASE = {}; Object.keys(IRR).forEach(function (b) { PAST2BASE[IRR[b]] = b; });
  /* «did» ilə qarışan keçmiş formalar (did/had/read/put/cut — çıxarılıb: ya qeyri-müəyyən, ya da did had nadir) */
  delete PAST2BASE.did; delete PAST2BASE.had;
  function pastOf(v) {
    if (IRR[v]) return IRR[v];
    if (/e$/.test(v)) return v + 'd';
    if (/[^aeiou]y$/.test(v)) return v.slice(0, -1) + 'ied';
    if (v === 'stop' || v === 'plan') return v + v.slice(-1) + 'ed';
    return v + 'ed';
  }
  function thirdOf(v) {
    if (v === 'have') return 'has';
    if (v === 'do' || v === 'go') return v + 'es';
    if (/(s|sh|ch|x|z)$/.test(v)) return v + 'es';
    if (/[^aeiou]y$/.test(v)) return v.slice(0, -1) + 'ies';
    return v + 's';
  }
  var BASES = Object.keys(IRR).concat(REG);
  /* he/she + əsas forma: keçmişlə üst-üstə düşən fellər çıxarılır (read, put, cut…) */
  var THIRD_SAFE = ['go', 'have', 'do', 'want', 'like', 'live', 'work', 'know', 'need', 'play', 'study', 'watch', 'come', 'say', 'think', 'make',
    'take', 'see', 'get', 'speak', 'write', 'eat', 'drink', 'love', 'teach', 'understand', 'try', 'learn', 'visit', 'buy', 'give', 'sleep', 'swim', 'travel', 'enjoy'];
  var COUNT_NOUNS = { book: 'books', year: 'years', day: 'days', month: 'months', week: 'weeks', hour: 'hours', minute: 'minutes', student: 'students',
    friend: 'friends', child: 'children', man: 'men', woman: 'women', person: 'people', apple: 'apples', car: 'cars', dollar: 'dollars',
    page: 'pages', room: 'rooms', brother: 'brothers', sister: 'sisters', teacher: 'teachers', language: 'languages', city: 'cities',
    country: 'countries', time: 'times', question: 'questions', lesson: 'lessons', word: 'words', kilometer: 'kilometers', ticket: 'tickets', manat: 'manats' };
  var NUMS = ['two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'twenty', 'thirty', 'fifty', 'hundred', 'many', 'several', 'few'];
  var COMPAR = { better: 'better', worse: 'worse', bigger: 'bigger', smaller: 'smaller', easier: 'easier', harder: 'harder', faster: 'faster', cheaper: 'cheaper',
    taller: 'taller', older: 'older', younger: 'younger', larger: 'larger', longer: 'longer', shorter: 'shorter', happier: 'happier', stronger: 'stronger', higher: 'higher' };
  var UNCOUNT = { informations: 'information', advices: 'advice', furnitures: 'furniture', knowledges: 'knowledge', equipments: 'equipment', homeworks: 'homework',
    luggages: 'luggage', baggages: 'baggage', researches: 'research', feedbacks: 'feedback' };
  var SILENT_H = /^(hour|honest|honou?r|heir)/;
  var DAYS = 'monday|tuesday|wednesday|thursday|friday|saturday|sunday';
  var MONTHS_EN = 'january|february|march|april|june|july|august|september|october|november|december';

  function enRules(text, out) {
    var sents = sentences(text);
    var W = '[^' + L + ']';

    /* «I am agree» → «I agree» */
    scan(new RegExp("(^|" + W + ")(I am|I'm|I’m|you are|you're|we are|we're|they are|they're|he is|he's|she is|she's)\\s+(not\\s+)?(agree|disagree)(?=" + W + "|$)", 'giu'), text, function (m, at) {
      var subj = m[2].replace(/['’](m|re|s)$/i, '').replace(/\s+(am|are|is)$/i, '');
      var third = /^(he|she)$/i.test(subj);
      var neg = !!m[3];
      var fix = subj + ' ' + (neg ? (third ? "doesn't " : "don't ") + m[4].toLowerCase() : (third ? m[4].toLowerCase() + 's' : m[4].toLowerCase()));
      var wrong = m[0].slice(m[1].length);
      out.push(issue(at, wrong, fix, 'en.be_agree', 'İngilis dilində «agree» feldir, «be» (am/is/are) ilə işlənmir: I agree. İnkarda: I don\'t agree.', 'high'));
    });
    /* «more better» → «better», «the most best» → «the best» */
    scan(new RegExp('(^|' + W + ')(more|most)\\s+(' + Object.keys(COMPAR).join('|') + '|best|worst)(?=' + W + '|$)', 'giu'), text, function (m, at) {
      var w = m[3].toLowerCase(), fix = m[2].toLowerCase() === 'most' && w === 'better' ? 'best' : m[3];
      if (m[2].toLowerCase() === 'more' && (w === 'best' || w === 'worst')) return;
      out.push(issue(at, m[0].slice(m[1].length), matchCase(m[2], fix), 'en.comparative', '«' + m[3] + '» artıq müqayisə formasıdır, «' + m[2].toLowerCase() + '» əlavə edilmir: This is better.', 'mid'));
    });
    /* «didn't went» → «didn't go» */
    scan(new RegExp("(^|" + W + ")(didn't|didn’t|did not|did|doesn't|doesn’t|does not|don't|don’t|do not)\\s+(" + Object.keys(PAST2BASE).join('|') + ')(?=' + W + '|$)', 'giu'), text, function (m, at) {
      var v = m[3].toLowerCase(), base = PAST2BASE[v];
      if (!base || base === v) return;
      out.push(issue(at, m[0].slice(m[1].length), m[2] + ' ' + base, 'en.did_base', '«' + m[2].replace(/’/g, "'") + '» özü zamanı göstərir, ondan sonra felin əsas forması gəlir: I didn\'t go.', 'high'));
    });
    /* «can to swim» → «can swim» */
    scan(new RegExp('(^|' + W + ')(can|could|must|should|will|would|might|may)\\s+to\\s+([a-z]+)(?=' + W + '|$)', 'gu'), text, function (m, at) {
      out.push(issue(at, m[0].slice(m[1].length), m[2] + ' ' + m[3], m[2] === 'will' ? 'en.future' : 'en.modal_base', '«' + m[2] + '» modal feldir — ondan sonra «to» işlənmir: I ' + m[2] + ' ' + m[3] + '.', 'high'));
    });
    /* «married with him» → «married to him» (married with two children düzgündür) */
    scan(new RegExp('(^|' + W + ')(married|marry)\\s+with\\s+(him|her|me|you|them|my|his|their|our|your|[A-Z][a-z]+)(?=' + W + '|$)', 'gu'), text, function (m, at) {
      out.push(issue(at, m[0].slice(m[1].length), m[2] + ' to ' + m[3], 'en.verb_pattern', 'İngilis dilində kiminləsə evlənmək «married to» olur: She is married to Tom. («ilə» sözbəsöz «with» deyil.)', 'mid'));
    });
    /* «people is» → «people are» */
    scan(new RegExp('(^|' + W + ')(people|children|police)\\s+(is|was|has)(?=' + W + '|$)', 'giu'), text, function (m, at) {
      var v = m[3].toLowerCase(), fix = v === 'is' ? 'are' : v === 'was' ? 'were' : 'have';
      out.push(issue(at, m[0].slice(m[1].length), m[2] + ' ' + matchCase(m[3], fix), 'en.sv_agreement', '«' + m[2].toLowerCase() + '» cəmdir, ona görə «' + fix + '» işlənir: People are kind.', 'high'));
    });
    /* «I is», «they was», «I has» */
    scan(new RegExp('(^|' + W + ')(I|we|We|they|They|you|You)\\s+(is|was|has|does|goes)(?=' + W + '|$)', 'gu'), text, function (m, at) {
      var s = m[2].toLowerCase(), v = m[3];
      var fix = v === 'is' ? (s === 'i' ? 'am' : 'are') : v === 'was' ? (s === 'i' ? null : 'were') : v === 'has' ? 'have' : v === 'does' ? 'do' : 'go';
      if (!fix) return;
      var prev = text.slice(Math.max(0, at - 12), at).toLowerCase();
      if (/(than|as|if|and|or)\s+$/.test(prev) && s === 'you') return;
      out.push(issue(at, m[0].slice(m[1].length), m[2] + ' ' + fix, v === 'is' || v === 'was' ? 'en.be_verb' : 'en.sv_agreement',
        v === 'is' || v === 'was' ? 'to be felinin forması mübtədaya uyğun olur: I am, you/we/they are; keçmişdə we/you/they were.' : '«' + v + '» yalnız he/she/it ilə işlənir; ' + m[2] + ' ilə «' + fix + '»: I have a car.', 'high'));
    });
    /* «He go» → «He goes» (köməkçi feldən sonra deyilsə) */
    scan(new RegExp('(^|' + W + ')(he|she|He|She)\\s+(' + THIRD_SAFE.join('|') + ')(?=' + W + '|$)', 'gu'), text, function (m, at) {
      var prev = text.slice(Math.max(0, at - 14), at).toLowerCase();
      if (/(do|does|did|can|could|will|would|should|must|may|might|shall|let|make|made|help|let's|that|if|lest|rather)\s+$/.test(prev)) return;
      if (/['’]s?\s*$/.test(prev)) return;
      var v = m[3];
      out.push(issue(at, m[0].slice(m[1].length), m[2] + ' ' + thirdOf(v), 'en.third_person_s', 'Present Simple-da he/she-dən sonra felə -s artırılır: She ' + thirdOf(v) + '. (Keçmişdən danışırsınızsa: She ' + pastOf(v) + '.)', 'high'));
    });
    /* rəqəmdən sonra cəm: «two book» → «two books» */
    scan(new RegExp('(^|' + W + ')(' + NUMS.join('|') + '|[2-9]|[1-9][0-9]+)\\s+(' + Object.keys(COUNT_NOUNS).join('|') + ')(?=' + W + '|$)', 'giu'), text, function (m, at) {
      var after = text.slice(at + m[0].length - m[1].length, at + m[0].length - m[1].length + 8);
      if (/^\s*(-|old\b)/.test(after) || /^-/.test(after)) return;
      var before = text.slice(Math.max(0, at - 3), at);
      if (/(^|\s)a\s$/i.test(before) || /-$/.test(before)) return;
      var nf = COUNT_NOUNS[m[3].toLowerCase()];
      out.push(issue(at, m[0].slice(m[1].length), m[2] + ' ' + nf, 'en.plural', 'İngilis dilində birdən çox olanda isim cəmdə olur: two ' + nf + '. (Azərbaycan dilində «iki kitab» deyilsə də.)', 'mid'));
    });
    /* sayılmayan isimlər + much/many */
    scan(wordRe(Object.keys(UNCOUNT), 'i'), text, function (m, at) {
      var fix = matchCase(m[2], UNCOUNT[m[2].toLowerCase()]);
      out.push(issue(at, m[2], fix, 'en.uncountable', '«' + fix.toLowerCase() + '» sayılmayan isimdir, cəm şəkilçisi -s almır: some ' + fix.toLowerCase() + '.', 'mid'));
    });
    scan(new RegExp('(^|' + W + ')(much)\\s+(people|friends|books|students|things|times|cars|problems|questions|children|words|countries|cities|mistakes)(?=' + W + '|$)', 'giu'), text, function (m, at) {
      out.push(issue(at, m[0].slice(m[1].length), matchCase(m[2], 'many') + ' ' + m[3], 'en.uncountable', 'Sayılan isimlərlə «many», sayılmayanlarla «much» işlənir: many people, much time.', 'mid'));
    });
    /* a / an */
    scan(new RegExp('(^|' + W + ')(a|A)\\s+([a-z][a-z]*)(?=' + W + '|$)', 'gu'), text, function (m, at) {
      var w = m[3];
      if (m[2] === 'A' && at > 0 && !/[.!?]\s*$/.test(text.slice(0, at)) && !/^\s*$/.test(text.slice(0, at))) return; /* «Vitamin A», «Plan A» */
      var needAn = (/^[aeio]/.test(w) && !/^(one|once|eu|ewe)/.test(w)) || SILENT_H.test(w);
      if (!needAn) return;
      if (/^(e\.g|i\.e)/.test(w)) return;
      out.push(issue(at, m[0].slice(m[1].length), (m[2] === 'A' ? 'An ' : 'an ') + w, 'en.a_an', 'Sait səsi ilə başlayan sözdən əvvəl «an» yazılır: an apple, an hour.', 'mid'));
    });
    scan(new RegExp('(^|' + W + ')(an|An)\\s+([a-z][a-z]*)(?=' + W + '|$)', 'gu'), text, function (m, at) {
      var w = m[3];
      var needA = (/^[bcdfgjklmnpqrstvwxyz]/.test(w) && !SILENT_H.test(w)) || /^(uni|use|usu|uro|eu|one|once)/.test(w);
      if (!needA) return;
      out.push(issue(at, m[0].slice(m[1].length), (m[2] === 'An' ? 'A ' : 'a ') + w, 'en.a_an', 'Samit səsi ilə başlayan sözdən əvvəl «a» yazılır: a book, a university (ju- səsi).', 'mid'));
    });
    /* «Yesterday I go» → «Yesterday I went» */
    sents.forEach(function (S) {
      if (!/\b(yesterday|last\s+(night|week|month|year|summer|winter|spring|autumn|weekend|monday|tuesday|wednesday|thursday|friday|saturday|sunday)|\d+\s+(days|weeks|months|years)\s+ago|ago)\b/i.test(S.t)) return;
      if (/\b(will|tomorrow|next|usually|always|every)\b/i.test(S.t)) return;
      var re = new RegExp('(^|' + W + ')(I|we|We|they|They|you|You)\\s+(' + BASES.join('|') + ')(?=' + W + '|$)', 'gu');
      scan(re, S.t, function (m, at) {
        var v = m[3];
        out.push(issue(S.s + at, m[0].slice(m[1].length), m[2] + ' ' + pastOf(v), 'en.past_simple', 'Cümlədə keçmiş vaxt var (yesterday, last…, ago) — fel Past Simple-da olur: Yesterday I ' + pastOf(v) + '.', 'high'));
      });
    });
    /* «I have 20 years» → «I am 20 years old» */
    scan(new RegExp('(^|' + W + ')(I have|I\'ve|he has|she has|He has|She has)\\s+(\\d{1,3})\\s+years(?!\\s+(of|experience|ago|in|at|with))(?=' + W + '|$)', 'gu'), text, function (m, at) {
      var s = m[2].split(/\s|'/)[0];
      var be = /^i$/i.test(s) ? 'am' : 'is';
      out.push(issue(at, m[0].slice(m[1].length), s + ' ' + be + ' ' + m[3] + ' years old', 'en.calque', 'Yaş ingilis dilində «be» ilə deyilir: I am 20 years old. («20 yaşım var» sözbəsöz «I have» olmur.)', 'high'));
    });
    /* «since 3 years» → «for 3 years» */
    scan(new RegExp('(^|' + W + ')(since)\\s+(\\d+|two|three|four|five|six|seven|eight|nine|ten|many|several)\\s+(years|months|weeks|days|hours)(?=' + W + '|$)', 'giu'), text, function (m, at) {
      out.push(issue(at, m[0].slice(m[1].length), matchCase(m[2], 'for') + ' ' + m[3] + ' ' + m[4], 'en.present_perfect', 'Müddət «for» ilə (for 3 years), başlanğıc nöqtəsi «since» ilə (since 2020) deyilir.', 'mid'));
    });
    /* fel + sözönü */
    var VP = [
      [/(discuss|discussed|discussing|discusses)\s+about/gi, function (m) { return m[2]; }, '«discuss» özü «müzakirə etmək» deməkdir, «about» artıqdır: We discussed the plan.'],
      [/(explain|explained|explains|explaining)\s+(me|him|her|us|them)(?=[^\p{L}]|$)/giu, function (m) { return m[2] + ' to ' + m[3]; }, '«explain» kimə izah edildiyini «to» ilə göstərir: Can you explain it to me?'],
      [/(listen|listened|listening|listens)\s+(music|me|him|her|the|my|this|it)(?=[^\p{L}]|$)/giu, function (m) { return m[2] + ' to ' + m[3]; }, '«listen» həmişə «to» ilə işlənir: I listen to music.'],
      [/(depend|depends|depended|depending)\s+(from|of)(?=[^\p{L}]|$)/giu, function (m) { return m[2] + ' on'; }, '«depend» «on» ilə işlənir: It depends on you.'],
      [/(interested)\s+(about|for)(?=[^\p{L}]|$)/giu, function (m) { return m[2] + ' in'; }, '«interested» «in» ilə işlənir: I am interested in art.'],
      [/(said|say|says)\s+(me)(?=[^\p{L}]|$)/giu, function (m) { return (m[2].toLowerCase() === 'said' ? 'told' : m[2].toLowerCase() === 'says' ? 'tells' : 'tell') + ' me'; }, 'Kiməsə nəsə demək «tell somebody» olur: She told me. («say» birbaşa şəxs qəbul etmir: said to me.)'],
      [/(return)\s+(back)(?=[^\p{L}]|$)/giu, function (m) { return m[2]; }, '«return» özü «geri qayıtmaq» deməkdir, «back» artıqdır.']
    ];
    VP.forEach(function (r) {
      scan(new RegExp('(^|[^' + L + '])(?:' + r[0].source + ')', 'giu'), text, function (m, at) {
        var mm = [m[0]].concat([].slice.call(m, 1));
        out.push(issue(at, m[0].slice(m[1].length), r[1](mm), 'en.verb_pattern', r[2], 'mid'));
      });
    });
    /* «make a photo» → «take a photo» */
    scan(new RegExp('(^|' + W + ')(make|makes|made|making)\\s+(a\\s+photo|photos|a\\s+picture|pictures)(?=' + W + '|$)', 'giu'), text, function (m, at) {
      var v = m[2].toLowerCase(), t = v === 'made' ? 'took' : v === 'makes' ? 'takes' : v === 'making' ? 'taking' : 'take';
      out.push(issue(at, m[0].slice(m[1].length), matchCase(m[2], t) + ' ' + m[3], 'en.calque', 'İngilis dilində şəkil «çəkilir»: take a photo. («make a photo» rus dilindən kalkadır.)', 'mid'));
    });
    /* «in the last year» (keçən il mənasında) → «last year» — yalnız have/has olmayan cümlədə */
    scan(new RegExp('(^|' + W + ')(in\\s+the\\s+last)\\s+(year|month|week)(?=\\s*[.!?,]|\\s*$)', 'giu'), text, function (m, at) {
      var S = sentenceAt(sents, at);
      if (S && /\b(have|has|'ve|’ve|haven't|hasn't)\b/i.test(S.t)) return;
      out.push(issue(at, m[0].slice(m[1].length), 'last ' + m[3], 'en.calque', '«Keçən il» ingilis dilində sadəcə «last year»-dir. «In the last year» «son bir ildə» deməkdir və Present Perfect ilə işlənir.', 'mid'));
    });
    /* yalançı dostlar */
    scan(new RegExp('(^|' + W + ')(is|are|was|were)\\s+(very\\s+|so\\s+|really\\s+)?(actual)(?=' + W + '|$)', 'giu'), text, function (m, at) {
      out.push(issue(at + m[0].length - m[1].length - m[4].length, m[4], 'relevant', 'en.false_friend', '«actual» = həqiqi, faktiki. «Aktual» mənasında «relevant» və ya «topical» işlənir: This topic is relevant.', 'mid'));
    });
    scan(new RegExp('(^|' + W + ')(go|goes|went|going)\\s+to\\s+the\\s+(magazine)(?=' + W + '|$)', 'giu'), text, function (m, at) {
      out.push(issue(at + m[0].length - m[1].length - m[3].length, m[3], 'shop', 'en.false_friend', '«magazine» = jurnal. «Mağaza» ingilis dilində «shop» və ya «store»-dur.', 'high'));
    });
    scan(new RegExp('(^|' + W + ')(work|works|worked|working)\\s+(at|in)\\s+(a|the)\\s+(fabric)(?=' + W + '|$)', 'giu'), text, function (m, at) {
      out.push(issue(at + m[0].length - m[1].length - m[5].length, m[5], 'factory', 'en.false_friend', '«fabric» = parça. «Fabrik/zavod» ingilis dilində «factory»-dir.', 'high'));
    });
    scan(new RegExp('(^|' + W + ')(a\\s+)?(very\\s+)?(sympathetic)\\s+(girl|boy|man|woman|person|guy)(?=' + W + '|$)', 'giu'), text, function (m, at) {
      out.push(issue(at + (m[2] || '').length + (m[3] || '').length, m[4], 'nice', 'en.false_friend', '«sympathetic» = başa düşən, rəğbət bəsləyən. «Simpatik» mənasında «nice», «good-looking» işlənir.', 'mid'));
    });
    /* in/on/at */
    scan(new RegExp('(^|' + W + ')(at)\\s+(the)\\s+(morning|evening|afternoon)(?=' + W + '|$)', 'giu'), text, function (m, at) {
      out.push(issue(at, m[0].slice(m[1].length), matchCase(m[2], 'in') + ' the ' + m[4], 'en.preposition', 'Günün hissələri «in the» ilə: in the morning; amma «at night».', 'mid'));
    });
    scan(new RegExp('(^|' + W + ')(in)\\s+(' + DAYS + ')(?=' + W + '|$)', 'giu'), text, function (m, at) {
      out.push(issue(at, m[0].slice(m[1].length), matchCase(m[2], 'on') + ' ' + cap(m[3]), 'en.preposition', 'Həftənin günləri «on» ilə işlənir: on Monday.', 'mid'));
    });
    scan(new RegExp('(^|' + W + ')(on)\\s+(' + MONTHS_EN + ')(?!\\s*\\d)(?=' + W + '|$)', 'giu'), text, function (m, at) {
      out.push(issue(at, m[0].slice(m[1].length), matchCase(m[2], 'in') + ' ' + cap(m[3]), 'en.preposition', 'Aylar «in» ilə işlənir: in May; tarixlə isə «on»: on 5 May.', 'mid'));
    });
    scan(new RegExp('(^|' + W + ')(in)\\s+(night)(?=' + W + '|$)', 'giu'), text, function (m, at) {
      out.push(issue(at, m[0].slice(m[1].length), matchCase(m[2], 'at') + ' night', 'en.preposition', '«Gecə» ingilis dilində «at night»-dır.', 'mid'));
    });
    /* «I very like» → «I really like» */
    scan(new RegExp('(^|' + W + ')(I|we|they|you|he|she|We|They|You|He|She)\\s+(very)\\s+(like|love|want|enjoy|likes|loves|wants|enjoys)(?=' + W + '|$)', 'gu'), text, function (m, at) {
      out.push(issue(at, m[0].slice(m[1].length), m[2] + ' really ' + m[4], 'en.word_order', '«very» feli təyin etmir: I really like it və ya I like it very much.', 'mid'));
    });
    /* «The education is (very) important» → «Education is…» */
    scan(new RegExp('(^|' + W + ')(the|The)\\s+(education|life|health|nature|society|history|science|knowledge|friendship|love|money)\\s+(?=(is|are)\\s+(very\\s+|so\\s+|really\\s+)?(important|necessary|valuable|essential)(' + W + '|$))', 'gu'), text, function (m, at) {
      var fix = m[2] === 'The' ? cap(m[3]) : m[3];
      out.push(issue(at, m[2] + ' ' + m[3], fix, 'en.zero_article', 'Ümumi anlayışdan danışanda (təhsil, həyat) «the» işlənmir: Education is important.', 'mid'));
    });
    /* kiçik «i» → «I» */
    scan(/(^|[\s("“«])(i)(?=(['’](m|ve|ll|d))?([\s,.!?;:)]|$))/g, text, function (m, at) {
      out.push(issue(at, 'i', 'I', 'en.capital', '«I» (mən) ingilis dilində həmişə böyük hərflə yazılır: I think so.', 'mid'));
    });
  }

  /* ------------------------------------------------------------------
     4. AZƏRBAYCAN DİLİ
     ------------------------------------------------------------------ */
  var TR = {
    'değil': 'deyil', 'değilim': 'deyiləm', 'değilsin': 'deyilsən', 'değiliz': 'deyilik', 'değildir': 'deyil', 'değildi': 'deyildi',
    'için': 'üçün', 'ancak': 'ancaq', 'şimdi': 'indi', 'şimdiki': 'indiki', 'onay': 'təsdiq', 'onayı': 'təsdiqi', 'onaylandı': 'təsdiqləndi',
    'tarafından': 'tərəfindən', 'şirket': 'şirkət', 'şirketin': 'şirkətin', 'şirkete': 'şirkətə', 'olarak': 'olaraq', 'gerekir': 'lazımdır',
    'gerekli': 'lazımi', 'evet': 'bəli', 'hayır': 'xeyr', 'çok': 'çox', 'önemli': 'vacib', 'lütfen': 'zəhmət olmasa', 'teşekkür': 'təşəkkür',
    'teşekkürler': 'təşəkkürlər', 'bilgi': 'məlumat', 'bilgiler': 'məlumatlar', 'sözleşme': 'müqavilə', 'müşteri': 'müştəri', 'toplantı': 'iclas',
    'rapor': 'hesabat', 'raporu': 'hesabatı', 'raporun': 'hesabatın', 'rapora': 'hesabata', 'raporda': 'hesabatda', 'rapordan': 'hesabatdan', 'raporlar': 'hesabatlar',
    've': 'və', 'ile': 'ilə', 'ise': 'isə', 'kadar': 'qədər', 'gibi': 'kimi', 'bugün': 'bu gün', 'yarın': 'sabah', 'hafta': 'həftə', 'ayrıca': 'həmçinin',
    'neden': 'niyə', 'nasıl': 'necə', 'nerede': 'harada', 'güzel': 'gözəl', 'kötü': 'pis', 'büyük': 'böyük', 'küçük': 'kiçik', 'hepsi': 'hamısı',
    'herkes': 'hamı', 'bazen': 'bəzən', 'hiç': 'heç', 'artık': 'artıq', 'hemen': 'dərhal', 'galiba': 'deyəsən', 'kendi': 'öz', 'kendisi': 'özü',
    'fakat': 'fəqət', 'merhaba': 'salam', 'çünkü': 'çünki', 'yapmak': 'etmək', 'yaptı': 'etdi', 'yaptım': 'etdim'
  };
  var RU = { 'doqovor': 'müqavilə', 'dogovor': 'müqavilə', 'spravka': 'arayış', 'naçalnik': 'rəis', 'ştraf': 'cərimə', 'otçot': 'hesabat',
    'podpis': 'imza', 'zakaz': 'sifariş', 'uje': 'artıq', 'koroçe': 'qısası', 'voobşe': 'ümumiyyətlə', 'naprimer': 'məsələn', 'koneçno': 'əlbəttə',
    'kvartira': 'mənzil', 'remont': 'təmir', 'sdaça': 'qalıq', 'vrode': 'deyəsən' };
  var RU_LOW = { 'kvartira': 1, 'remont': 1 };
  var ORTHO = { 'xaiş': 'xahiş', 'tesdiq': 'təsdiq', 'mütəxəsis': 'mütəxəssis', 'məsuliyət': 'məsuliyyət', 'məsuliyyet': 'məsuliyyət', 'mənfət': 'mənfəət',
    'tərcumə': 'tərcümə', 'tercume': 'tərcümə', 'hormetli': 'hörmətli', 'muellim': 'müəllim', 'müəlim': 'müəllim', 'cəmiyət': 'cəmiyyət',
    'keyfiyət': 'keyfiyyət', 'fəaliyət': 'fəaliyyət', 'vəziyət': 'vəziyyət', 'məktəp': 'məktəb', 'kitap': 'kitab', 'təşəkür': 'təşəkkür',
    'təşəkkur': 'təşəkkür', 'nece': 'necə', 'bele': 'belə', 'neçe': 'neçə', 'hemişe': 'həmişə', 'gelir': 'gəlir', 'mügavilə': 'müqavilə',
    'muqavile': 'müqavilə', 'imtahan': null };
  var COMPOUND = { 'vəya': 'və ya', 'hərbir': 'hər bir', 'hərhansı': 'hər hansı', 'heçbir': 'heç bir', 'heçkim': 'heç kim', 'heçnə': 'heç nə',
    'heçvaxt': 'heç vaxt', 'həmdə': 'həm də', 'çün ki': 'çünki', 'halbu ki': 'halbuki' };
  var KI_FIX = { 'beləki': 'belə ki', 'eləki': 'elə ki', 'yəqinki': 'yəqin ki', 'odurki': 'odur ki', 'hansıki': 'hansı ki', 'nəki': null };
  var KI_OK = { 'indiki': 1, 'şimdiki': 1, 'çünki': 1, 'halbuki': 1, 'sanki': 1, 'nəinki': 1, 'bəlkə': 1, 'mülki': 1 };
  var PLEO = { 'həmçinin də': 'həmçinin', 'ən optimal': 'optimal', 'ilk debüt': 'debüt', 'təhvil etmək': 'təhvil vermək', 'təhvil etdi': 'təhvil verdi', 'təhvil etməlidir': 'təhvil verməlidir' };
  var PROPER = { 'azərbaycan': 'Azərbaycan', 'azərbaycanın': 'Azərbaycanın', 'azərbaycana': 'Azərbaycana', 'azərbaycanda': 'Azərbaycanda', 'azərbaycandan': 'Azərbaycandan', 'azərbaycanı': 'Azərbaycanı',
    'bakı': 'Bakı', 'bakının': 'Bakının', 'bakıya': 'Bakıya', 'bakıda': 'Bakıda', 'bakıdan': 'Bakıdan', 'bakını': 'Bakını' };
  var MONTHS_AZ = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avqust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'];
  /* türk -yor felləri → Azərbaycan indiki zamanı (yalnız bilinən köklər) */
  var YOR = { gel: 'gəlir', gid: 'gedir', yap: 'edir', bil: 'bilir', gör: 'görür', al: 'alır', ver: 'verir', ist: 'istəyir', söyl: 'söyləyir',
    düşün: 'düşünür', çalış: 'çalışır', ok: 'oxuyur', yaz: 'yazır', konuş: 'danışır', anl: 'anlayır', sev: 'sevir', bekl: 'gözləyir', ol: 'olur',
    ed: 'edir', di: 'deyir', bak: 'baxır', kal: 'qalır', iç: 'içir', gel_: 'gəlir' };
  function yorFix(w) {
    var m = lower(w).match(/^(\p{L}+?)([ıiuü])yor(um|sun|uz|sunuz|lar|du|dum|dun|duk)?$/u);
    if (!m || /^yor/.test(lower(w))) return undefined;
    var az = YOR[m[1]];
    if (!az) return null; /* türk forması aydındır, amma düzəliş avtomatik deyil */
    var v = lastVowel(az), back = backVowel(az);
    var p = m[3] || '';
    var nv = { a: 'ı', ı: 'ı', o: 'u', u: 'u', e: 'i', ə: 'i', i: 'i', ö: 'ü', ü: 'ü' }[v] || 'i';
    var END = {
      um: back ? 'am' : 'əm', sun: back ? 'san' : 'sən', uz: { ı: 'ıq', i: 'ik', u: 'uq', ü: 'ük' }[nv], sunuz: { ı: 'sınız', i: 'siniz', u: 'sunuz', ü: 'sünüz' }[nv],
      lar: back ? 'lar' : 'lər', du: 'd' + nv, dum: 'd' + nv + 'm', dun: 'd' + nv + 'n', duk: 'd' + nv + (back ? 'q' : 'k')
    };
    return az + (p ? END[p] : '');
  }

  function azRules(text, out) {
    var ws = words(text), sents = sentences(text);
    ws.forEach(function (t, i) {
      var w = t.w, lw = lower(w);
      /* abreviaturalar (ISE, VE) */
      if (w.length <= 4 && w === upper(w) && w !== lw) return;
      if (TR[lw]) {
        out.push(issue(t.s, w, matchCase(w, TR[lw], true), 'az.turkish', '«' + lw + '» türk dilinə məxsusdur; Azərbaycan dilində «' + TR[lw] + '» yazılır.', 'mid'));
        return;
      }
      var yf = yorFix(w);
      if (yf !== undefined) {
        if (yf) out.push(issue(t.s, w, matchCase(w, yf, true), 'az.turkish', 'Türk dilinin -yor şəkilçisi Azərbaycan dilində -ır/-ir/-ur/-ür olur: geliyor → gəlir.', 'mid'));
        else out.push(issue(t.s, w, '', 'az.turkish', 'Türk dilinin -yor şəkilçisi Azərbaycan dilində işlənmir; indiki zaman -ır/-ir/-ur/-ür ilə düzəlir: gəlir, oxuyur.', 'mid', { manual: true }));
        return;
      }
      if (RU[lw]) {
        out.push(issue(t.s, w, matchCase(w, RU[lw], true), 'az.russian', '«' + lw + '» rus sözüdür; yazılı mətndə «' + RU[lw] + '» işlənir.', RU_LOW[lw] ? 'low' : 'mid'));
        return;
      }
      if (ORTHO[lw]) {
        out.push(issue(t.s, w, matchCase(w, ORTHO[lw], true), 'az.ortho', 'Düzgün yazılışı: «' + ORTHO[lw] + '» (Orfoqrafiya lüğəti).', 'mid'));
        return;
      }
      if (COMPOUND[lw]) {
        out.push(issue(t.s, w, matchCase(w, COMPOUND[lw], true), 'az.compound', '«' + COMPOUND[lw] + '» ayrı yazılır.', 'low'));
        return;
      }
      if (KI_FIX[lw]) {
        out.push(issue(t.s, w, matchCase(w, KI_FIX[lw], true), 'az.ki', 'Bağlayıcı «ki» əvvəlki sözdən ayrı yazılır: ' + KI_FIX[lw] + '.', 'mid'));
        return;
      }
      if (PROPER[lw] && w === lw) {
        out.push(issue(t.s, w, PROPER[lw], 'az.capital', 'Ölkə və şəhər adları böyük hərflə yazılır: ' + PROPER[lw] + '.', 'mid'));
        return;
      }
      /* fel + ki bitişik: bilirəmki → bilirəm ki */
      if (/ki$/.test(lw) && !KI_OK[lw] && lw.length >= 6) {
        var rest = lw.slice(0, -2);
        if (/^\p{L}{2,}(ır|ir|ur|ür|ar|ər|acaq|əcək|malı|məli|mış|miş|muş|müş|dı|di|du|dü|dır|dir|dur|dür)(am|əm|san|sən|ıq|ik|uq|ük|m|n|q|k|sınız|siniz|lar|lər)?$/u.test(rest)) {
          out.push(issue(t.s, w, w.slice(0, -2) + ' ki', 'az.ki', 'Bağlayıcı «ki» ayrı yazılır: Bilirəm ki, gələcək.', 'mid'));
          return;
        }
      }
      /* gedmirəm → getmirəm, edmək → etmək */
      var dm = lw.match(/^(g?e)d(m(?:ir|ək|əz|ə|əli|əyib|əyəcək|əmiş|ədi|iş)\p{L}*)$/u);
      if (dm && w === lw) {
        out.push(issue(t.s, w, dm[1] + 't' + dm[2], 'az.ortho', '«get-», «et-» köklərində «d» yalnız saitdən əvvəl yazılır (gedir), samitdən əvvəl «t» qalır: getmirəm, etmək.', 'mid'));
        return;
      }
      var dd = lw.match(/^(g?e)dd(i\p{L}*)$/u);
      if (dd && w === lw) {
        out.push(issue(t.s, w, dd[1] + 'td' + dd[2], 'az.ortho', 'Keçmiş zamanda kök dəyişmir: getdi, etdi.', 'mid'));
        return;
      }
      /* -irem → -irəm */
      var em = lw.match(/^(\p{L}{2,}(?:ir|ır|ur|ür))em$/u);
      if (em && /[əıöüğşç]/.test(lw + text.slice(0, 400))) {
        out.push(issue(t.s, w, matchCase(w, em[1] + 'əm', true), 'az.ortho', 'Şəxs şəkilçisi «-əm/-am» yazılır: bilirəm, gedirəm.', 'mid'));
        return;
      }
      /* danışıq: gələcəm → gələcəyəm */
      var fu = lw.match(/^(\p{L}{2,})(acam|əcəm)$/u);
      if (fu && !/(tapm|bilm|qarm|daranm|gec|bac)$/.test(fu[1])) {
        var lit = fu[1] + (fu[2] === 'acam' ? 'acağam' : 'əcəyəm');
        out.push(issue(t.s, w, matchCase(w, lit, true), 'az.colloquial', 'Bu danışıq formasıdır; yazıda ədəbi forma işlənir: ' + lit + '.', 'low'));
        return;
      }
      /* Men/Sen — yalnız cümlədə 1-ci/2-ci şəxs feli varsa */
      if (lw === 'men' || lw === 'sen') {
        var S = sentenceAt(sents, t.s);
        var re = lw === 'men' ? /\p{L}{2,}(am|əm|yam|yəm|ım|im|um|üm)(?![\p{L}])/u : /\p{L}{2,}(san|sən|sın|sin|sun|sün)(?![\p{L}])/u;
        if (S && /[əƏ]/.test(S.t) && re.test(S.t.slice(t.e - S.s))) {
          var f = lw === 'men' ? 'mən' : 'sən';
          out.push(issue(t.s, w, matchCase(w, f, true), 'az.ortho', '«' + f + '» «ə» ilə yazılır: ' + cap(f, true) + ' gedirəm.', 'high'));
        }
      }
    });

    /* «hariç» → «-dan/-dən başqa» */
    scan(/(^|[^\p{L}\p{N}])(\p{L}+)\s+(hariç)(?=[^\p{L}]|$)/gu, text, function (m, at) {
      var suf = backVowel(m[2]) ? 'dan' : 'dən';
      out.push(issue(at, m[2] + ' ' + m[3], m[2] + suf + ' başqa', 'az.turkish', '«hariç» türk sözüdür; Azərbaycan dilində «…-dan/-dən başqa» deyilir: Əlidən başqa.', 'mid'));
    });
    /* sual ədatı ayrı: «gəlirsən mi?» → «gəlirsənmi?» */
    scan(/(^|[^\p{L}\p{N}])(\p{L}{2,})\s+(mı|mi|mu|mü)(?=\s*[?.!,]|\s*$)/gu, text, function (m, at) {
      out.push(issue(at, m[2] + ' ' + m[3], m[2] + m[3], 'az.mi', 'Azərbaycan dilində sual ədatı -mı/-mi sözə bitişik yazılır: Gəlirsənmi?', 'mid'));
    });
    /* çünki / lakin / amma — əvvəlində vergül */
    scan(/(^|[^\p{L}\p{N}])(\p{L}+)[ \t]+(çünki|lakin|amma)(?=[ \t]+\p{L})/gu, text, function (m, at) {
      var prev = lower(m[2]);
      if (/^(və|ya|yaxud|həm|ki|ancaq|nə)$/.test(prev)) return;
      out.push(issue(at, m[0].slice(m[1].length), m[2] + ', ' + m[3], 'az.comma', '«' + m[3] + '» ilə başlayan hissədən əvvəl vergül qoyulur: Gəlmədim, ' + m[3] + ' …', 'low'));
    });
    /* pleonazm */
    scan(wordRe(Object.keys(PLEO), 'i'), text, function (m, at) {
      var k = lower(m[2]).replace(/\s+/g, ' ');
      if (!PLEO[k]) return;
      out.push(issue(at, m[2], matchCase(m[2], PLEO[k], true), 'az.style', '«' + k + '» əvəzinə «' + PLEO[k] + '» — artıq söz (pleonazm) və ya düzgün söz birləşməsi.', 'low'));
    });
    /* ay adları tarixdə böyük hərflə: «15 Mart 2024» → «15 mart 2024» */
    var mre = new RegExp('(^|[^\\p{L}\\p{N}])(\\d{1,2}\\s+)(' + MONTHS_AZ.map(function (x) { return cap(x, true); }).join('|') + ')(\\p{L}*)(?=\\s+\\d{4}|\\s*-?(də|da|dək|ində|ında)\\b|[^\\p{L}]|$)', 'gu');
    scan(mre, text, function (m, at) {
      var after = text.slice(at + m[0].length - m[1].length, at + m[0].length - m[1].length + 30);
      if (/^\s*(faciəsi|hadisələri|Günü|günü|bayramı|qələbəsi|Qələbə|meydanı|küçəsi|prospekti|metro)/.test(after)) return;
      if (!/^\s+\d{4}|^\s*(-?ci|-cı|-cu|-cü)?\s*(il|ildə|tarixində|tarixdə)/.test(after) && !m[4]) return;
      var s = at + m[2].length, w = m[3] + m[4];
      out.push(issue(s, w, lower(w), 'az.month', 'Ay adları kiçik hərflə yazılır: 15 mart 2024. (Bayram adları — «20 Yanvar» — istisnadır.)', 'low'));
    });
    /* həftə günləri cümlə ortasında böyük hərflə */
    scan(/(^|[^\p{L}\p{N}.!?])(\s+)(Bazar ertəsi|Çərşənbə axşamı|Cümə axşamı|Şənbə|Çərşənbə)(?=\s+günü|[^\p{L}]|$)/gu, text, function (m, at) {
      var before = text.slice(0, at + m[2].length).replace(/\s+$/, '');
      if (!before || /[.!?…:]$/.test(before) || /\n$/.test(text.slice(0, at + m[2].length))) return;
      var s = at + m[2].length;
      out.push(issue(s, m[3], lower(m[3]), 'az.month', 'Həftə günlərinin adları kiçik hərflə yazılır: şənbə günü.', 'low'));
    });
    /* düz dırnaqlar "..." → «...» */
    var qre = /"([^"\n]{1,300})"/g, qm;
    while ((qm = qre.exec(text))) {
      if (/[{}=<>]/.test(qm[1])) continue;
      out.push(issue(qm.index, '"', '«', 'az.quotes', 'Azərbaycan dilində dırnaq « » işarəsi ilə yazılır: «Nuanza».', 'low', { pair: 'open' }));
      out.push(issue(qm.index + qm[0].length - 1, '"', '»', 'az.quotes', 'Azərbaycan dilində dırnaq « » işarəsi ilə yazılır: «Nuanza».', 'low', { pair: 'close' }));
    }
  }

  /* ------------------------------------------------------------------
     5. ÜMUMİ — boşluq, durğu, cümlə əvvəli böyük hərf
     ------------------------------------------------------------------ */
  var ABBR = /(^|\s)(etc|vs|approx|e\.g|i\.e|p\.m|a\.m|no|cf|ca|mr|mrs|ms|dr|st|məs|səh|bax|s|b|və s|və b|e\.ə|b\.e|prof|dos|akad|küç|ç|r|şək|cild|il|bənd|maddə)$/i;
  function commonRules(text, out, lang) {
    var az = lang === 'az', rp = az ? 'az.punct_space' : 'en.punctuation', rc = az ? 'az.capital' : 'en.capital';
    /* ikiqat boşluq (sətir əvvəlindəki girinti istisna) */
    scan(/(\S)( {2,})(?=\S)/g, text, function (m, at) {
      out.push(issue(at + m[1].length - m[1].length + 1 - 1 + 1 - 1 + m[1].length - m[1].length + m[1].length - 1 + 1, m[2], ' ', rp, az ? 'Sözlər arasında bir boşluq qoyulur.' : 'Sözlər arasında bir boşluq kifayətdir.', 'low'));
    });
    /* durğu işarəsindən əvvəl boşluq: «Salam ,» */
    scan(/([\p{L}\p{N})»"])([ \t]+)([,;:!?]|\.(?!\.)(?=\s|$))/gu, text, function (m, at) {
      var s = m.index + m[1].length;
      if (m[3] === ':' && /\d/.test(text.charAt(s + m[2].length + 1))) return;
      out.push(issue(s, m[2] + m[3], m[3], rp, az ? 'Durğu işarəsi əvvəlki sözə bitişik yazılır: Salam, dost.' : 'İngilis dilində də durğu işarəsindən əvvəl boşluq qoyulmur: Hello, world.', 'low'));
    });
    /* durğu işarəsindən sonra boşluq yoxdur: «salam,dost» */
    scan(/(\p{Ll}{2,})([,;!?])(\p{L}{2,})/gu, text, function (m) {
      var s = m.index + m[1].length;
      out.push(issue(s, m[2], m[2] + ' ', rp, az ? 'Vergül, nöqtəli vergül, nida və sual işarəsindən sonra boşluq qoyulur.' : 'Durğu işarəsindən sonra boşluq qoyulur: Hello, world.', 'low'));
    });
    scan(/(\p{Ll}{2,})(\.)(\p{Lu}\p{Ll}+)/gu, text, function (m) {
      var tokStart = text.lastIndexOf(' ', m.index) + 1, tok = text.slice(tokStart, m.index + m[0].length);
      if (/[\/@:]|www|\.\w+\./.test(tok)) return;
      out.push(issue(m.index + m[1].length, '.', '. ', rp, az ? 'Nöqtədən sonra boşluq qoyulur.' : 'Nöqtədən sonra boşluq qoyulur.', 'low'));
    });
    /* cümlə sonundan sonra kiçik hərf */
    scan(/([.!?])(\s+)(\p{Ll})/gu, text, function (m) {
      var p = m.index, pre = text.slice(Math.max(0, p - 12), p);
      if (m[1] === '.' && (text.charAt(p - 1) === '.' || ABBR.test(pre) || /(^|\s)\p{L}$/u.test(pre) || /\d$/.test(pre) || /\.\p{L}+$/u.test(pre))) return;
      if (/^\p{Ll}\p{Lu}/u.test(text.slice(p + 1 + m[2].length, p + 3 + m[2].length))) return; /* iPhone */
      var s = p + 1 + m[2].length;
      out.push(issue(s, m[3], az ? upper(m[3]) : m[3].toUpperCase(), rc, az ? 'Yeni cümlə böyük hərflə başlayır.' : 'Yeni cümlə böyük hərflə başlayır.', 'mid'));
    });
    /* mətnin ilk hərfi */
    var fm = text.match(/^[\s"«“(]*(\p{Ll})(\p{L}*)/u);
    if (fm && !/\p{Lu}/u.test(fm[2]) && (fm[1] + fm[2]).length > 1 && !(lang === 'en' && fm[1] + fm[2] === 'i')) {
      var s0 = fm[0].length - fm[1].length - fm[2].length;
      out.push(issue(s0, fm[1], az ? upper(fm[1]) : fm[1].toUpperCase(), rc, 'Mətn (cümlə) böyük hərflə başlayır.', 'low'));
    }
    /* təkrarlanan köməkçi söz: «və və», «the the» */
    scan(/(^|[^\p{L}\p{N}])(və|bu|ki|ilə|bir|the|a|an|and|to|of|is|in)\s+(\2)(?=[^\p{L}]|$)/giu, text, function (m, at) {
      if (lower(m[2]) !== lower(m[3])) return;
      out.push(issue(at, m[2] + text.slice(at + m[2].length, at + m[0].length - m[1].length - m[3].length) + m[3], m[2], az ? 'az.style' : 'en.style', 'Eyni söz iki dəfə yazılıb.', 'mid'));
    });
  }

  /* ------------------------------------------------------------------
     6. DİL TANIMA + ƏSAS FUNKSİYA
     ------------------------------------------------------------------ */
  function detect(t) {
    t = String(t || '');
    if (/[əƏğĞıİşŞçÇöÖüÜ]/.test(t)) {
      var en = (t.match(/\b(the|and|is|are|was|were|have|has|with|this|that|I|you)\b/g) || []).length;
      var az = (t.match(/[əƏ]/g) || []).length + (t.match(/(^|\s)(və|bu|ilə|deyil|üçün|mən|sən|bir|ki)(?=\s|$|[.,!?])/gi) || []).length * 2;
      return en > az * 2 ? 'en' : 'az';
    }
    if (/(^|\s)(men|sen|bu|ve|bir|ki|ucun|deyil|var|yox)(?=\s|$|[.,!?])/i.test(t) && !/\b(the|is|are|and|you)\b/i.test(t)) return 'az';
    return 'en';
  }
  var SEVR = { high: 3, mid: 2, low: 1 };
  /* üst-üstə düşənləri at: əvvəlcə daha ciddi, sonra daha qısa */
  function dedupe(list) {
    var sorted = list.slice().sort(function (a, b) { return (SEVR[b.sev] - SEVR[a.sev]) || (a.start - b.start) || ((a.end - a.start) - (b.end - b.start)); });
    var kept = [];
    sorted.forEach(function (x) {
      if (x.start < 0 || x.end <= x.start) return;
      if (kept.some(function (k) { return x.start < k.end && x.end > k.start; })) return;
      kept.push(x);
    });
    return kept.sort(function (a, b) { return a.start - b.start; });
  }
  function check(text, opts) {
    text = String(text == null ? '' : text);
    opts = opts || {};
    var lang = opts.lang === 'az' || opts.lang === 'en' ? opts.lang : detect(text);
    var out = [];
    if (!text.trim()) return { lang: lang, issues: [] };
    try { if (lang === 'en') enRules(text, out); else azRules(text, out); } catch (e) { /* bir qayda xəta versə də, qalanları işləsin */ }
    try { commonRules(text, out, lang); } catch (e) { /* ignore */ }
    /* yalnız mətndə həqiqətən olan parçalar */
    out = out.filter(function (x) { return text.slice(x.start, x.end) === x.wrong && x.wrong !== x.fix; });
    return { lang: lang, issues: dedupe(out) };
  }
  function score(text, issues) {
    var n = (String(text || '').match(/[\p{L}\p{N}]+/gu) || []).length, pen = 0;
    (issues || []).forEach(function (x) { pen += x.sev === 'high' ? 4 : x.sev === 'mid' ? 2 : 1; });
    return Math.max(0, Math.min(100, Math.round(100 * Math.exp(-1.5 * pen / Math.max(n, 15)))));
  }
  function apply(text, issues) {
    var out = String(text || '');
    (issues || []).filter(function (x) { return !x.manual; }).slice().sort(function (a, b) { return b.start - a.start; })
      .forEach(function (x) { out = out.slice(0, x.start) + x.fix + out.slice(x.end); });
    return out;
  }
  /* Qaydalar ekranı üçün: növə görə qruplaşdırılmış lövhə */
  function cheatSheet(lang) {
    var groups = {}, order = [];
    Object.keys(RULES).forEach(function (id) {
      if (id.indexOf(lang + '.') !== 0) return;
      var r = RULES[id];
      if (!r.ex.length && !r.note) return;
      var g = lang === 'en' ? (TYPE_AZ[r.type] || r.type) : r.type;
      if (!groups[g]) { groups[g] = []; order.push(g); }
      groups[g].push({ id: id, title: r.t, note: r.note, ex: r.ex });
    });
    return order.map(function (g) { return { type: g, items: groups[g] }; });
  }
  /* Kiçik CEFR təxmini (AI olmayanda): cümlə uzunluğu, söz müxtəlifliyi, mürəkkəb strukturlar */
  function level(text, issues) {
    var ws = (String(text || '').toLowerCase().match(/[a-z']+/g) || []);
    if (ws.length < 8) return { cefr: '', why: 'Səviyyəni təxmin etmək üçün mətn çox qısadır.' };
    var uniq = {}; ws.forEach(function (w) { uniq[w] = 1; });
    var ttr = Object.keys(uniq).length / ws.length;
    var sents = String(text).split(/[.!?]+/).filter(function (s) { return /\w/.test(s); }).length || 1;
    var avg = ws.length / sents;
    var complex = (String(text).match(/\b(although|whereas|however|therefore|which|whose|unless|despite|would have|had been|has been|have been|if I were|in order to)\b/gi) || []).length;
    var long = ws.filter(function (w) { return w.length >= 9; }).length / ws.length;
    var errRate = (issues || []).filter(function (x) { return x.sev !== 'low'; }).length / Math.max(1, sents);
    var pts = (avg > 9 ? 1 : 0) + (avg > 15 ? 1 : 0) + (ttr > 0.6 ? 1 : 0) + (complex >= 1 ? 1 : 0) + (complex >= 3 ? 1 : 0) + (long > 0.08 ? 1 : 0) - (errRate > 1 ? 2 : errRate > 0.4 ? 1 : 0);
    var cefr = ['A1', 'A2', 'B1', 'B2', 'C1'][Math.max(0, Math.min(4, pts))];
    var why = cefr === 'A1' || cefr === 'A2' ? 'Qısa, sadə cümlələr və əsas lüğət; tipik səhvlər hələ çoxdur.'
      : cefr === 'B1' ? 'Fikirlər aydındır, bağlayıcılar var; zamanlarda və artikllərdə hələ səhvlər görünür.'
        : 'Mürəkkəb cümlələr, zəngin lüğət və bağlayıcılar işlənib.';
    return { cefr: cefr, why: why + ' (oflayn təxmin)' };
  }

  var API = { check: check, detect: detect, score: score, apply: apply, dedupe: dedupe, cheatSheet: cheatSheet, level: level, RULES: RULES, TYPES: TYPES, TYPE_AZ: TYPE_AZ };
  if (typeof module === 'object' && module.exports) module.exports = API;
  if (root) root.NuanzaGrammarRules = API;
})(typeof window !== 'undefined' ? window : null);
