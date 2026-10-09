/* Nuanza — English grammar course (B2, C1), original Nuanza content. */
window.NUANZA_GRAMMAR = window.NUANZA_GRAMMAR || { units: [] };
window.NUANZA_GRAMMAR.units.push(

  /* ===================== B2 ===================== */

  { id: "present-perfect-continuous", level: "B2", group: "Zamanlar", title: "Present Perfect Continuous", az: "İndiki bitməmiş davamlı zaman",
    when: "Keçmişdə başlayıb indiyə qədər davam edən və ya yenicə bitib izi görünən hərəkəti, xüsusən onun müddətini vurğulamaq üçün işlənir.",
    form: ["I/you/we/they have been working", "he/she/it has been working", "Have you been working? — Has she been working?", "I haven't been working — She hasn't been working"],
    rules: [
      "Müddət bildirən for (iki saatdır) və başlanğıc nöqtəsi bildirən since (səhərdən) ilə tez-tez işlənir.",
      "Sual adətən How long...? ilə qurulur: How long have you been waiting?",
      "Nəticə və say vurğulananda Present Perfect Simple seçilir: I have written three emails.",
      "Vəziyyət bildirən fellər (know, like, own, believe) davamlı formada işlənmir: I have known her for years."
    ],
    azTrap: "Azərbaycan dilində «Mən iki ildir burada işləyirəm» indiki zamanda deyilir, ona görə də çox vaxt «I work here for two years» və ya «I am working here since 2020» yazılır. İngilis dilində keçmişdən indiyə uzanan müddət üçün have been + -ing lazımdır.",
    examples: [
      { en: "I have been learning English for six years.", az: "Altı ildir ingilis dili öyrənirəm." },
      { en: "She has been working here since March.", az: "O, martdan bəri burada işləyir." },
      { en: "Your eyes are red. Have you been crying?", az: "Gözlərin qızarıb. Ağlamısan?" },
      { en: "How long have they been living in Baku?", az: "Onlar neçə ildir Bakıda yaşayırlar?" }
    ],
    wrong: [
      { bad: "I work here for two years.", good: "I have been working here for two years.", why: "Keçmişdə başlayıb indi də davam edən müddət üçün Present Perfect Continuous lazımdır." },
      { bad: "I am waiting since nine o'clock.", good: "I have been waiting since nine o'clock.", why: "since ilə Present Continuous yox, have been + -ing işlənir." },
      { bad: "I have been knowing him for ages.", good: "I have known him for ages.", why: "know vəziyyət felidir, davamlı formada işlənmir." }
    ],
    exercise: [
      { q: "We ___ (wait) for the bus for forty minutes.", a: ["have been waiting", "'ve been waiting"], hint: "have been + -ing" },
      { q: "How long ___ she ___ (study) medicine?", a: ["has been studying", "has, been studying"], hint: "has + been + -ing" },
      { q: "Choose: I ___ this book for a week, but I haven't finished it.", options: ["read", "have been reading", "am reading"], a: ["have been reading"], hint: "Hərəkət keçmişdən indiyə davam edir." },
      { q: "Choose: She ___ him since university.", options: ["has been knowing", "has known", "knows"], a: ["has known"], hint: "know davamlı formada işlənmir." },
      { q: "You're out of breath! ___ you ___ (run)?", a: ["Have, been running", "have been running"], hint: "Yenicə bitmiş hərəkətin izi görünür." }
    ],
    rule_ids: ["tense-since-for", "stative-continuous"] },

  { id: "past-perfect", level: "B2", group: "Zamanlar", title: "Past Perfect Simple", az: "Keçmişdən əvvəlki zaman",
    when: "Keçmişdəki bir anda artıq bitmiş olan, yəni başqa keçmiş hərəkətdən daha əvvəl baş vermiş hərəkəti göstərir.",
    form: ["I/you/he/she/we/they had finished", "Had you finished? — Had she left?", "I hadn't finished — She hadn't left", "Qısa forma: I'd finished"],
    rules: [
      "İki keçmiş hərəkətdən daha əvvəl olanı had + V3 ilə verilir: When I arrived, the film had started.",
      "already, just, never, by the time, before, after ilə tez-tez işlənir.",
      "Ardıcıllıq aydındırsa (after, before ilə), Past Simple də qəbul olunur, amma Past Perfect sırayı dəqiqləşdirir.",
      "I'd həm I had, həm də I would ola bilər: ardınca V3 gəlirsə, had deməkdir."
    ],
    azTrap: "Azərbaycan dilində «Mən gələndə film başlamışdı» deyirik, amma danışıqda çox vaxt sadəcə «başladı» da işlənir. Buna görə öyrənənlər hər iki hərəkəti Past Simple ilə verir və hansının əvvəl olduğu bulanıq qalır: When I arrived, the film started (= mən gələndə film başladı).",
    examples: [
      { en: "When we got to the station, the train had already left.", az: "Biz vağzala çatanda qatar artıq getmişdi." },
      { en: "She had never seen the sea before that summer.", az: "O, həmin yaya qədər heç vaxt dəniz görməmişdi." },
      { en: "By the time the police arrived, the thieves had escaped.", az: "Polis gələnə qədər oğrular qaçmışdı." },
      { en: "I didn't recognize him because he had grown a beard.", az: "Onu tanımadım, çünki saqqal saxlamışdı." }
    ],
    wrong: [
      { bad: "When I arrived, everyone left.", good: "When I arrived, everyone had left.", why: "Hamı mən gəlməmişdən əvvəl getmişdi — daha əvvəlki hərəkət had + V3 ilə verilir." },
      { bad: "I had went to bed early.", good: "I had gone to bed early.", why: "had-dən sonra felin üçüncü forması (V3) gəlir: go – went – gone." },
      { bad: "She told me she has lost her keys.", good: "She told me she had lost her keys.", why: "Keçmiş zamanlı hekayədə daha əvvəlki hərəkət had + V3 ilə verilir." }
    ],
    exercise: [
      { q: "When I opened the fridge, I saw that someone ___ (eat) my cake.", a: ["had eaten", "'d eaten"], hint: "had + V3" },
      { q: "By the time she called, I ___ already ___ (go) to sleep.", a: ["had, gone", "had gone"], hint: "go → gone" },
      { q: "Choose: He was nervous because he ___ on a plane before.", options: ["never flew", "had never flown", "has never flown"], a: ["had never flown"], hint: "Keçmişdəki andan əvvəlki təcrübə." },
      { q: "They ___ (not / finish) dinner when the guests arrived.", a: ["hadn't finished", "had not finished"], hint: "hadn't + V3" },
      { q: "Choose: I couldn't pay because I ___ my wallet at home.", options: ["had left", "have left", "was leaving"], a: ["had left"], hint: "Pul kisəsini daha əvvəl evdə qoymuşdu." }
    ],
    rule_ids: ["past-perfect-sequence", "irregular-v3"] },

  { id: "past-perfect-continuous", level: "B2", group: "Zamanlar", title: "Past Perfect Continuous", az: "Keçmişdən əvvəlki davamlı zaman",
    when: "Keçmişdəki bir andan əvvəl başlayıb həmin ana qədər davam etmiş hərəkətin müddətini və ya səbəbini vurğulayır.",
    form: ["I/you/he/she/we/they had been working", "Had you been working? — Had she been crying?", "I hadn't been working", "Qısa forma: She'd been working"],
    rules: [
      "Keçmişdəki bir ana qədər nə qədər davam etdiyini göstərir: I had been waiting for an hour when he came.",
      "Keçmişdəki görünən nəticənin səbəbini izah edir: The ground was wet because it had been raining.",
      "Present Perfect Continuous-un keçmişə köçürülmüş variantıdır: have been → had been.",
      "Vəziyyət felləri (know, own, believe) bu formada işlənmir, onların yerinə had + V3 gəlir."
    ],
    azTrap: "Azərbaycan dilində «Bir saat idi gözləyirdim» kimi cümlələri öyrənənlər Past Continuous ilə tərcümə edir: I was waiting for an hour. Bu cümlə müddətin keçmişdəki bir ana qədər uzandığını göstərmir; düzgün variant had been waiting-dir.",
    examples: [
      { en: "I had been waiting for an hour when the doctor finally called me.", az: "Bir saat idi gözləyirdim ki, nəhayət həkim məni çağırdı." },
      { en: "The streets were wet because it had been raining all night.", az: "Küçələr yaş idi, çünki bütün gecə yağış yağmışdı." },
      { en: "She was tired because she had been studying since dawn.", az: "O, yorğun idi, çünki sübhdən bəri dərs oxuyurdu." },
      { en: "How long had they been dating before they got married?", az: "Evlənməzdən əvvəl neçə müddət görüşmüşdülər?" }
    ],
    wrong: [
      { bad: "I was working there for ten years when the company closed.", good: "I had been working there for ten years when the company closed.", why: "Keçmişdəki bir ana qədər davam edən müddət had been + -ing ilə verilir." },
      { bad: "He had been knowing her for years.", good: "He had known her for years.", why: "know vəziyyət felidir, davamlı formada işlənmir." },
      { bad: "Her eyes were red because she has been crying.", good: "Her eyes were red because she had been crying.", why: "Hekayə keçmiş zamandadır, ona görə has been yox, had been işlənir." }
    ],
    exercise: [
      { q: "We ___ (drive) for five hours when the car broke down.", a: ["had been driving", "'d been driving"], hint: "had been + -ing" },
      { q: "He was sweating because he ___ (run).", a: ["had been running", "'d been running"], hint: "Görünən nəticənin səbəbi." },
      { q: "Choose: She ___ there for years before she got promoted.", options: ["had been working", "has been working", "is working"], a: ["had been working"], hint: "Keçmişdəki andan əvvəlki müddət." },
      { q: "Choose: I ___ him for ten years when he moved abroad.", options: ["had been knowing", "had known", "was knowing"], a: ["had known"], hint: "know vəziyyət felidir." },
      { q: "How long ___ you ___ (learn) French before you went to Paris?", a: ["had, been learning", "had been learning"], hint: "had + been + -ing" }
    ],
    rule_ids: ["past-perfect-continuous", "stative-continuous"] },

  { id: "future-continuous-perfect", level: "B2", group: "Zamanlar", title: "Future Continuous & Future Perfect", az: "Gələcək davamlı və gələcək bitmiş zaman",
    when: "Future Continuous gələcəkdə müəyyən anda davam edəcək hərəkəti, Future Perfect isə gələcəkdə müəyyən ana qədər bitmiş olacaq hərəkəti göstərir.",
    form: ["Future Continuous: I will be working (at 8 tomorrow)", "Future Perfect: I will have finished (by Friday)", "Will you be using the car? — Will she have left?", "I won't be working — I won't have finished"],
    rules: [
      "Future Continuous: this time tomorrow, at 6 p.m. tonight kimi konkret anla işlənir.",
      "Future Continuous nəzakətli sual üçün də işlənir: Will you be using the printer later?",
      "Future Perfect əsasən by (…-a qədər) ilə gəlir: by Monday, by the end of the year.",
      "by the time-dan sonra will yox, indiki zaman gəlir: By the time you arrive, I will have cooked dinner."
    ],
    azTrap: "Azərbaycan dilində «Cümə gününə qədər bitirəcəyəm» deyirik və öyrənənlər bunu I will finish until Friday kimi çevirir. Burada iki səhv var: until yox, by işlənməlidir və nəticəni vurğulamaq üçün will have finished daha dəqiqdir.",
    examples: [
      { en: "This time tomorrow I will be flying to London.", az: "Sabah bu vaxt Londona uçuram (uçuşda olacağam)." },
      { en: "By the end of June, we will have finished the project.", az: "İyunun sonuna qədər layihəni bitirmiş olacağıq." },
      { en: "Will you be using your laptop this evening?", az: "Bu axşam noutbukundan istifadə edəcəksən?" },
      { en: "By the time you get home, the kids will have gone to bed.", az: "Sən evə çatana qədər uşaqlar artıq yatmış olacaq." }
    ],
    wrong: [
      { bad: "I will finish the report until Friday.", good: "I will have finished the report by Friday.", why: "Son tarix (…-a qədər) by ilə verilir; until davam edən vəziyyət üçündür." },
      { bad: "By the time you will arrive, I will have left.", good: "By the time you arrive, I will have left.", why: "by the time-dan sonra will işlənmir, indiki zaman gəlir." },
      { bad: "At 9 tomorrow I will work in the office.", good: "At 9 tomorrow I will be working in the office.", why: "Gələcəkdə konkret anda davam edən hərəkət will be + -ing ilə verilir." }
    ],
    exercise: [
      { q: "Don't call me at 8 — I ___ (have) dinner.", a: ["will be having", "'ll be having"], hint: "Gələcəkdə həmin anda davam edəcək." },
      { q: "By 2030, she ___ (graduate) from university.", a: ["will have graduated", "'ll have graduated"], hint: "will have + V3" },
      { q: "Choose: I'll have finished the essay ___ Monday.", options: ["until", "by", "since"], a: ["by"], hint: "Son tarix." },
      { q: "Choose: By the time she ___, we will have eaten.", options: ["will come", "comes", "came"], a: ["comes"], hint: "by the time + indiki zaman" },
      { q: "This time next week we ___ (lie) on a beach.", a: ["will be lying", "'ll be lying"], hint: "will be + -ing" }
    ],
    rule_ids: ["future-perfect-by", "by-until"] },

  { id: "narrative-tenses", level: "B2", group: "Zamanlar", title: "Narrative Tenses", az: "Nəqletmə zamanları",
    when: "Keçmişdə baş vermiş hadisəni danışarkən dörd zaman birlikdə işlənir: Past Simple (əsas hadisələr), Past Continuous (fon), Past Perfect (daha əvvəlki hadisə) və Past Perfect Continuous (daha əvvəlki müddət).",
    form: ["Past Simple: He opened the door.", "Past Continuous: It was raining.", "Past Perfect: Someone had broken the window.", "Past Perfect Continuous: He had been driving all day."],
    rules: [
      "Hekayənin əsas hadisələri ardıcıl olaraq Past Simple ilə verilir.",
      "Fon, şərait, kəsilən hərəkət Past Continuous ilə verilir: While I was cooking, the phone rang.",
      "Hekayə xəttindən əvvəl olanlar Past Perfect ilə «geriyə qayıdış» kimi verilir.",
      "Bütün hekayə boyu bir zaman sistemində qalın, birdən indiki zamana keçməyin."
    ],
    azTrap: "Azərbaycan dilində nağıl danışarkən canlılıq üçün tez-tez indiki zamana keçirik: «Dünən gedirəm mağazaya, görürəm ki…». İngilis dilində yazılı mətndə bu qarışıqlıq səhv sayılır; keçmiş hekayə ardıcıl keçmiş zamanlarla danışılmalıdır.",
    examples: [
      { en: "It was getting dark and the wind was blowing hard.", az: "Hava qaralırdı və güclü külək əsirdi." },
      { en: "I was walking home when I heard a strange noise.", az: "Evə gedirdim ki, qəribə bir səs eşitdim." },
      { en: "I turned around and saw that someone had followed me.", az: "Geri döndüm və gördüm ki, kimsə məni izləmişdi." },
      { en: "He looked exhausted because he had been working all night.", az: "O, çox yorğun görünürdü, çünki bütün gecə işləmişdi." }
    ],
    wrong: [
      { bad: "Yesterday I go to the shop and I see my teacher.", good: "Yesterday I went to the shop and saw my teacher.", why: "Keçmiş hadisə ardıcıl keçmiş zamanla danışılır." },
      { bad: "While I cooked, the lights went out.", good: "While I was cooking, the lights went out.", why: "Kəsilən fon hərəkəti Past Continuous ilə verilir." },
      { bad: "When I got to the cinema, the film already started.", good: "When I got to the cinema, the film had already started.", why: "Daha əvvəlki hadisə Past Perfect ilə verilir." }
    ],
    exercise: [
      { q: "While we ___ (have) lunch, it started to rain.", a: ["were having"], hint: "Fon hərəkəti" },
      { q: "She ___ (open) the letter and began to cry.", a: ["opened"], hint: "Əsas hadisə" },
      { q: "Choose: When I arrived, they ___ all the pizza.", options: ["ate", "had eaten", "were eating"], a: ["had eaten"], hint: "Mən gəlməmişdən əvvəl." },
      { q: "Choose: His hands were dirty because he ___ in the garden.", options: ["had been working", "has worked", "works"], a: ["had been working"], hint: "Daha əvvəlki müddət." },
      { q: "The sun ___ (shine) and the birds were singing.", a: ["was shining"], hint: "Səhnənin təsviri" }
    ],
    rule_ids: ["tense-consistency", "past-continuous-background"] },

  { id: "second-conditional", level: "B2", group: "Şərt cümlələri", title: "Second Conditional", az: "İkinci tip şərt cümləsi",
    when: "İndi və ya gələcəkdə real olmayan, xəyali və ya ehtimalı az olan vəziyyətləri və onların nəticəsini bildirir.",
    form: ["If + Past Simple, would + V1", "If I had more time, I would travel.", "What would you do if you won?", "If she didn't work so much, she wouldn't be tired."],
    rules: [
      "If hissəsində keçmiş zaman işlənsə də, məna indiki və ya gələcəkdir.",
      "If hissəsində would işlənmir.",
      "be feli ilə rəsmi və tövsiyə olunan forma were-dir: If I were you, I would apologize.",
      "would yerinə could və ya might da gələ bilər: If I had a car, I could drive you."
    ],
    azTrap: "Azərbaycan dilində «Vaxtım olsaydı, səyahət edərdim» cümləsində hər iki tərəfdə şərt şəkilçisi var, ona görə öyrənənlər If I would have time… deyə hər iki tərəfə would qoyur. İngilis dilində would yalnız nəticə hissəsində işlənir.",
    examples: [
      { en: "If I had more money, I would buy a flat in the city center.", az: "Daha çox pulum olsaydı, şəhər mərkəzində mənzil alardım." },
      { en: "If I were you, I would talk to your manager.", az: "Sənin yerində olsaydım, menecerinlə danışardım." },
      { en: "What would you do if you lost your passport abroad?", az: "Xaricdə pasportunu itirsəydin, nə edərdin?" },
      { en: "She could get a better job if she spoke English.", az: "İngiliscə danışsaydı, daha yaxşı iş tapa bilərdi." }
    ],
    wrong: [
      { bad: "If I would have time, I would help you.", good: "If I had time, I would help you.", why: "If hissəsində would işlənmir, keçmiş zaman gəlir." },
      { bad: "If I am you, I would accept the offer.", good: "If I were you, I would accept the offer.", why: "Xəyali vəziyyətdə If I were you işlənir." },
      { bad: "If she knew the answer, she will tell us.", good: "If she knew the answer, she would tell us.", why: "İkinci tipdə nəticə hissəsində will yox, would gəlir." }
    ],
    exercise: [
      { q: "If I ___ (be) taller, I would play basketball.", a: ["were", "was"], hint: "If I were…" },
      { q: "If we lived near the sea, we ___ (swim) every day.", a: ["would swim", "'d swim"], hint: "would + V1" },
      { q: "Choose: If he ___ harder, he would pass the exam.", options: ["would study", "studied", "studies"], a: ["studied"], hint: "If + Past Simple" },
      { q: "Choose: What ___ you do if you saw a ghost?", options: ["will", "would", "did"], a: ["would"], hint: "Xəyali vəziyyət" },
      { q: "If I ___ (not / have) a car, I would take the metro.", a: ["didn't have", "did not have"], hint: "Keçmiş zamanın inkarı" }
    ],
    rule_ids: ["conditional-would-in-if", "if-i-were"] },

  { id: "third-conditional", level: "B2", group: "Şərt cümlələri", title: "Third Conditional", az: "Üçüncü tip şərt cümləsi",
    when: "Keçmişdə baş verməmiş xəyali vəziyyəti və onun xəyali nəticəsini, çox vaxt təəssüf və ya tənqid bildirmək üçün işlənir.",
    form: ["If + had + V3, would have + V3", "If I had known, I would have called you.", "Would you have come if I had asked?", "If she hadn't missed the bus, she wouldn't have been late."],
    rules: [
      "Hər iki hissə keçmişə aiddir və dəyişdirilə bilməz.",
      "If hissəsində would have işlənmir, had + V3 gəlir.",
      "would have danışıqda would've kimi tələffüz olunur, amma heç vaxt would of yazılmır.",
      "could have və might have də nəticə hissəsində gələ bilər: If you had told me, I could have helped."
    ],
    azTrap: "«Bilsəydim, zəng edərdim» cümləsi Azərbaycan dilində həm indiki, həm keçmiş xəyala aid ola bilər. Buna görə öyrənənlər keçmiş hadisə üçün də ikinci tipi işlədir: If I knew, I would call you. Keçmişdə baş verməyən hadisə üçün had known … would have called lazımdır.",
    examples: [
      { en: "If I had known about the meeting, I would have come.", az: "İclasdan xəbərim olsaydı, gələrdim." },
      { en: "We would have won if our goalkeeper hadn't been injured.", az: "Qapıçımız zədələnməsəydi, qalib gələrdik." },
      { en: "If you had left earlier, you wouldn't have missed the flight.", az: "Tez çıxsaydın, reysə gecikməzdin." },
      { en: "She might have passed if she had read the instructions.", az: "Təlimatı oxusaydı, bəlkə də keçərdi." }
    ],
    wrong: [
      { bad: "If I would have seen you, I would have said hello.", good: "If I had seen you, I would have said hello.", why: "If hissəsində had + V3 işlənir, would have yox." },
      { bad: "If he had studied, he would pass the exam last year.", good: "If he had studied, he would have passed the exam last year.", why: "Keçmiş nəticə would have + V3 ilə verilir." },
      { bad: "I would of helped you.", good: "I would have helped you.", why: "would've tələffüzü would of kimi səslənir, amma yazıda have olmalıdır." }
    ],
    exercise: [
      { q: "If you ___ (tell) me, I would have helped you.", a: ["had told", "'d told"], hint: "had + V3" },
      { q: "If it hadn't rained, we ___ (go) to the beach.", a: ["would have gone", "would've gone"], hint: "would have + V3" },
      { q: "Choose: If she ___ the alarm, she wouldn't have been late.", options: ["heard", "had heard", "would have heard"], a: ["had heard"], hint: "If + had + V3" },
      { q: "Choose: We ___ the match if we had trained more.", options: ["would win", "would have won", "had won"], a: ["would have won"], hint: "Keçmiş xəyali nəticə" },
      { q: "If I ___ (not / eat) so much, I wouldn't have felt sick.", a: ["hadn't eaten", "had not eaten"], hint: "hadn't + V3" }
    ],
    rule_ids: ["conditional-would-in-if", "would-of"] },

  { id: "mixed-conditionals", level: "B2", group: "Şərt cümlələri", title: "Mixed Conditionals", az: "Qarışıq şərt cümlələri",
    when: "Şərt və nəticə fərqli zamanlara aid olanda işlənir: keçmiş şərtin indiki nəticəsi və ya indiki xüsusiyyətin keçmiş nəticəsi.",
    form: ["Keçmiş şərt → indiki nəticə: If + had + V3, would + V1", "If I had taken the job, I would be rich now.", "İndiki şərt → keçmiş nəticə: If + Past Simple, would have + V3", "If I spoke Chinese, I would have got that job."],
    rules: [
      "Hər hissənin zamanını ayrıca düşünün: hansı keçmişə, hansı indiyə aiddir?",
      "now, today, still kimi sözlər nəticənin indiyə aid olduğunu göstərir.",
      "İndiki şərt adətən daimi xüsusiyyətdir: If I weren't so shy…",
      "Qarışıq formada da If hissəsində would işlənmir."
    ],
    azTrap: "Azərbaycan dilində «O işi qəbul etsəydim, indi varlı olardım» cümləsində zaman fərqini sözlər (indi) göstərir, felin forması dəyişmir. Öyrənənlər mexaniki olaraq bütöv üçüncü tipi işlədir: I would have been rich now. İndiki nəticə üçün would be lazımdır.",
    examples: [
      { en: "If I had studied medicine, I would be a doctor now.", az: "Tibb oxusaydım, indi həkim olardım." },
      { en: "If she weren't so shy, she would have spoken at the meeting.", az: "Bu qədər utancaq olmasaydı, iclasda danışardı." },
      { en: "We wouldn't be lost if you had brought the map.", az: "Xəritəni götürsəydin, indi azmış olmazdıq." },
      { en: "If he were more careful, he wouldn't have broken his phone.", az: "Daha diqqətli olsaydı, telefonunu sındırmazdı." }
    ],
    wrong: [
      { bad: "If I had taken that job, I would have been rich now.", good: "If I had taken that job, I would be rich now.", why: "now nəticənin indiyə aid olduğunu göstərir: would + V1." },
      { bad: "If I would have saved money, I would have a car now.", good: "If I had saved money, I would have a car now.", why: "If hissəsində would işlənmir." },
      { bad: "If I wasn't afraid of heights, I would climb that mountain last year.", good: "If I weren't afraid of heights, I would have climbed that mountain last year.", why: "Nəticə keçmişə aiddir (last year): would have + V3." }
    ],
    exercise: [
      { q: "If I had gone to bed earlier, I ___ (not / be) so tired now.", a: ["wouldn't be", "would not be"], hint: "İndiki nəticə" },
      { q: "If she ___ (be) more organized, she wouldn't have missed the deadline.", a: ["were", "was"], hint: "Daimi xüsusiyyət, indi" },
      { q: "Choose: If you had listened to me, we ___ in this mess now.", options: ["wouldn't have been", "wouldn't be", "won't be"], a: ["wouldn't be"], hint: "now" },
      { q: "Choose: If I ___ Spanish, I would have understood the film.", options: ["spoke", "had spoken", "would speak"], a: ["spoke"], hint: "Ümumi bacarıq (indiki şərt)" },
      { q: "If we ___ (buy) that house, we would live by the sea now.", a: ["had bought", "'d bought"], hint: "Keçmiş şərt" }
    ],
    rule_ids: ["mixed-conditional", "conditional-would-in-if"] },

  { id: "wish-if-only", level: "B2", group: "Şərt cümlələri", title: "Wish & If Only", az: "Arzu və təəssüf: wish, if only",
    when: "İndiki vəziyyətdən narazılığı, keçmişə görə təəssüfü və ya başqasının davranışından şikayəti ifadə edir.",
    form: ["İndi: I wish + Past Simple — I wish I had a car.", "Keçmiş: I wish + had + V3 — I wish I had studied.", "Şikayət: I wish + would — I wish you would stop.", "If only… daha güclü emosiya bildirir: If only I knew!"],
    rules: [
      "İndiki arzu üçün wish-dən sonra bir zaman geri çəkilir: I am → I wish I were.",
      "Keçmiş təəssüf üçün had + V3: I wish I hadn't said that.",
      "wish + would başqasının davranışından şikayət üçündür; özün haqqında I wish I would deyilmir.",
      "Gələcək üçün real ümid bildirmək üçün hope işlənir: I hope you pass."
    ],
    azTrap: "Azərbaycan dilində «Kaş maşınım olaydı» və «Ümid edirəm ki, imtahandan keçəcəksən» fərqli sözlərlə deyilir, amma öyrənənlər hər ikisini wish ilə tərcümə edir: I wish you will pass. Real ümid üçün hope, mümkün olmayan arzu üçün wish + keçmiş zaman lazımdır.",
    examples: [
      { en: "I wish I lived closer to my office.", az: "Kaş işimə daha yaxın yaşayaydım." },
      { en: "She wishes she hadn't sold her old car.", az: "O, köhnə maşınını satdığına təəssüflənir." },
      { en: "I wish my neighbors would stop playing loud music.", az: "Kaş qonşularım yüksək səslə musiqi qoymağı dayandıraydılar." },
      { en: "If only I had listened to my parents!", az: "Kaş valideynlərimə qulaq asaydım!" }
    ],
    wrong: [
      { bad: "I wish I have more free time.", good: "I wish I had more free time.", why: "İndiki arzu üçün wish-dən sonra keçmiş zaman gəlir." },
      { bad: "I wish you will pass your exam.", good: "I hope you pass your exam.", why: "Real gələcək ümid hope ilə bildirilir." },
      { bad: "I wish I didn't go to that party yesterday.", good: "I wish I hadn't gone to that party yesterday.", why: "Keçmişə təəssüf had + V3 ilə verilir." }
    ],
    exercise: [
      { q: "I wish I ___ (can) speak German.", a: ["could"], hint: "can → could" },
      { q: "He wishes he ___ (not / spend) all his money last month.", a: ["hadn't spent", "had not spent"], hint: "Keçmiş təəssüf" },
      { q: "Choose: I wish you ___ interrupting me all the time!", options: ["would stop", "stopped", "will stop"], a: ["would stop"], hint: "Başqasının davranışından şikayət" },
      { q: "Choose: I ___ you have a great time in Rome.", options: ["wish", "hope", "would"], a: ["hope"], hint: "Real ümid" },
      { q: "If only it ___ (be) sunny today!", a: ["were", "was"], hint: "İndiki arzu" }
    ],
    rule_ids: ["wish-tense", "wish-hope"] },

  { id: "unless-provided-that", level: "B2", group: "Şərt cümlələri", title: "Unless, Provided That, As Long As", az: "Şərt bağlayıcıları: unless, provided that, as long as",
    when: "if-dən başqa şərt bildirən bağlayıcılardır: unless «əgər … -masa», provided (that) və as long as «yalnız … şərti ilə» mənasını verir.",
    form: ["unless = if … not: Unless you hurry, you'll be late.", "provided (that) / providing: You can go provided that you finish your homework.", "as long as: I'll lend it to you as long as you return it.", "in case = ehtiyat üçün: Take an umbrella in case it rains."],
    rules: [
      "unless özü inkar mənası daşıyır, ondan sonra əlavə not qoyulmur.",
      "Bu bağlayıcılardan sonra gələcək üçün will yox, indiki zaman gəlir.",
      "provided that daha rəsmi, as long as daha danışıq üslubludur.",
      "in case şərt deyil, ehtiyat tədbiridir: in case it rains = yağış yağa bilər deyə."
    ],
    azTrap: "Azərbaycan dilində «gəlməsən» inkarı felin üzərində olduğu üçün öyrənənlər unless-dən sonra da inkar qoyur: Unless you don't come… Bu ikiqat inkar mənanı tərsinə çevirir. Həmçinin in case çox vaxt if ilə qarışdırılır.",
    examples: [
      { en: "We'll miss the train unless we leave now.", az: "İndi çıxmasaq, qatara çatmayacağıq." },
      { en: "You can borrow my car provided that you drive carefully.", az: "Ehtiyatla sürmək şərtilə maşınımı götürə bilərsən." },
      { en: "I don't mind where we eat as long as it's not too expensive.", az: "Çox baha olmasa, harada yeməyimizin fərqi yoxdur." },
      { en: "Write down my number in case you get lost.", az: "Azsan deyə nömrəmi yaz." }
    ],
    wrong: [
      { bad: "Unless you don't study, you will fail.", good: "Unless you study, you will fail.", why: "unless artıq inkar mənası daşıyır (= if not)." },
      { bad: "I'll come provided that I will finish work early.", good: "I'll come provided that I finish work early.", why: "Şərt bağlayıcısından sonra indiki zaman gəlir." },
      { bad: "Take a jacket if it gets cold later.", good: "Take a jacket in case it gets cold later.", why: "Ehtiyat üçün görülən iş in case ilə bildirilir." }
    ],
    exercise: [
      { q: "I won't go to the party ___ you come with me.", a: ["unless"], hint: "= if you don't" },
      { q: "You can stay out late as long as you ___ (call) me.", a: ["call"], hint: "will yox" },
      { q: "Choose: Bring some cash ___ the card machine doesn't work.", options: ["unless", "in case", "provided"], a: ["in case"], hint: "Ehtiyat üçün" },
      { q: "Choose: Unless he ___, we'll start without him.", options: ["arrives", "doesn't arrive", "will arrive"], a: ["arrives"], hint: "unless + müsbət fel" },
      { q: "The bank will lend you money ___ that you have a stable income.", a: ["provided", "providing"], hint: "Rəsmi şərt" }
    ],
    rule_ids: ["unless-double-negative", "will-after-if"] },

  { id: "passive-all-tenses", level: "B2", group: "Məchul növ", title: "The Passive: All Tenses", az: "Məchul növ: bütün zamanlarda",
    when: "Hərəkəti kimin etdiyi məlum olmayanda, vacib olmayanda və ya diqqət hərəkətin obyektinə yönələndə işlənir.",
    form: ["be (istənilən zamanda) + V3", "is built / is being built / was built / was being built", "has been built / had been built / will be built / will have been built", "Was it built? — It wasn't built."],
    rules: [
      "Zamanı be feli göstərir, əsas fel həmişə V3 formasında olur.",
      "İcraçı vacibdirsə by ilə əlavə olunur: The novel was written by Nizami Ganjavi.",
      "Yalnız tamamlıq qəbul edən (keçid) fellər məchul ola bilər: happen, arrive, die məchul olmur.",
      "İki tamamlıqlı fellərdə adətən şəxs mübtəda olur: I was given a prize."
    ],
    azTrap: "Azərbaycan dilində «Hadisə dünən baş verilib» kimi səhv məchul formalar danışıqda yayılıb, bu da ingiliscəyə keçir: The accident was happened. happen məchul ola bilməz. Bundan başqa, -ıl/-il şəkilçisi felə birləşdiyi üçün öyrənənlər be köməkçi felini unudur: The bridge built in 1990.",
    examples: [
      { en: "English is spoken in many countries.", az: "İngilis dilində bir çox ölkədə danışılır." },
      { en: "The road is being repaired, so we have to take another route.", az: "Yol təmir olunur, ona görə başqa yolla getməliyik." },
      { en: "The results have already been announced.", az: "Nəticələr artıq elan olunub." },
      { en: "The new stadium will be opened next spring.", az: "Yeni stadion gələn yaz açılacaq." }
    ],
    wrong: [
      { bad: "The accident was happened at night.", good: "The accident happened at night.", why: "happen keçidsiz feldir, məchul növdə işlənmir." },
      { bad: "This bridge built in 1990.", good: "This bridge was built in 1990.", why: "Məchul növdə be köməkçi feli mütləq lazımdır." },
      { bad: "The house is painting now.", good: "The house is being painted now.", why: "Davamlı məchul forma: is being + V3." }
    ],
    exercise: [
      { q: "The letter ___ (send) yesterday.", a: ["was sent"], hint: "Past Simple Passive" },
      { q: "A new hospital ___ (build) at the moment.", a: ["is being built"], hint: "is being + V3" },
      { q: "Choose: All the tickets ___ already.", options: ["have sold", "have been sold", "are selling"], a: ["have been sold"], hint: "have been + V3" },
      { q: "Choose: The earthquake ___ in 2003.", options: ["was happened", "happened", "has been happened"], a: ["happened"], hint: "happen məchul olmur." },
      { q: "The winners ___ (announce) tomorrow.", a: ["will be announced"], hint: "will be + V3" }
    ],
    rule_ids: ["passive-be-missing", "passive-intransitive"] },

  { id: "passive-modals", level: "B2", group: "Məchul növ", title: "Passive with Modals & Infinitives", az: "Modal fellər və məsdərlə məchul növ",
    when: "Modal fellərlə (can, must, should, might) və to-məsdərlə məchul məna yaratmaq üçün işlənir; qaydalarda, təlimatlarda və rəsmi mətnlərdə çox rast gəlinir.",
    form: ["modal + be + V3: It must be done today.", "modal + have been + V3: It should have been checked.", "to be + V3: I want to be invited.", "being + V3: I hate being interrupted."],
    rules: [
      "Modal feldən sonra həmişə be (indiki/gələcək) və ya have been (keçmiş) gəlir.",
      "Keçmişdə edilməli olan, amma edilməyən iş: should have been + V3.",
      "Məsdər tələb edən fellərdən sonra to be + V3: She expects to be promoted.",
      "-ing tələb edən fellərdən sonra being + V3: He enjoys being praised."
    ],
    azTrap: "Azərbaycan dilində «Bu iş bu gün edilməlidir» cümləsində məchulluq şəkilçi ilə bildirilir və öyrənənlər ingiliscədə be-ni buraxır: This must done today. Ya da əksinə, məlum forma işlədir: This must do today.",
    examples: [
      { en: "Mobile phones must be switched off during the exam.", az: "İmtahan zamanı mobil telefonlar söndürülməlidir." },
      { en: "This problem should have been solved years ago.", az: "Bu problem illər əvvəl həll edilməli idi." },
      { en: "Nobody likes being told what to do.", az: "Heç kim ona nə edəcəyinin deyilməsini sevmir." },
      { en: "She hopes to be chosen for the national team.", az: "O, milli komandaya seçilməyə ümid edir." }
    ],
    wrong: [
      { bad: "The form must completed in English.", good: "The form must be completed in English.", why: "Modaldan sonra məchul üçün be + V3 lazımdır." },
      { bad: "The window should have be closed.", good: "The window should have been closed.", why: "Keçmiş modal məchul: should have been + V3." },
      { bad: "I don't like to be interrupt.", good: "I don't like being interrupted.", why: "Əsas fel V3 formasında olmalıdır: interrupted." }
    ],
    exercise: [
      { q: "The rules ___ (must / follow) by all players.", a: ["must be followed"], hint: "must + be + V3" },
      { q: "The report ___ (should / send) yesterday, but nobody did it.", a: ["should have been sent"], hint: "should have been + V3" },
      { q: "Choose: Children love ___ stories at bedtime.", options: ["being read", "be read", "to read"], a: ["being read"], hint: "Uşaqlara oxunur" },
      { q: "Choose: This medicine can't ___ without a prescription.", options: ["sell", "be sold", "been sold"], a: ["be sold"], hint: "can't + be + V3" },
      { q: "He expects ___ (pay) at the end of the month.", a: ["to be paid"], hint: "to be + V3" }
    ],
    rule_ids: ["passive-be-missing", "modal-passive"] },

  { id: "causative-have-get", level: "B2", group: "Məchul növ", title: "Causative: Have/Get Something Done", az: "Başqasına iş gördürmək: have/get something done",
    when: "İşi özümüz yox, başqası (adətən pulla, xidmət kimi) bizim üçün görəndə, həmçinin başımıza gələn xoşagəlməz hadisəni bildirəndə işlənir.",
    form: ["have + obyekt + V3: I had my hair cut.", "get + obyekt + V3 (danışıq): I got my car repaired.", "Sual: Where do you have your suit cleaned?", "Xoşagəlməz hadisə: She had her bag stolen."],
    rules: [
      "Söz sırası vacibdir: have + obyekt + V3. I had cut my hair = saçımı özüm kəsmişdim.",
      "have bütün zamanlarda dəyişir: I'm having / I've had / I'll have my car serviced.",
      "Kiminsə bir iş görməsini təmin etmək: have someone do / get someone to do: I had the mechanic check the brakes.",
      "Oğurluq, zədə kimi hadisələrdə də işlənir: He had his phone stolen."
    ],
    azTrap: "Azərbaycan dilində «Saçımı kəsdirdim» deyirik, şəkilçi -dir işin başqası tərəfindən görüldüyünü göstərir. İngiliscədə bu şəkilçinin qarşılığı olmadığı üçün öyrənənlər I cut my hair yazır, bu isə «saçımı özüm kəsdim» deməkdir.",
    examples: [
      { en: "I need to have my eyes tested.", az: "Gözlərimi yoxlatdırmalıyam." },
      { en: "We're getting our kitchen redecorated next month.", az: "Gələn ay mətbəximizi təmir etdiririk." },
      { en: "She had her passport stolen on holiday.", az: "Tətildə onun pasportu oğurlandı." },
      { en: "I'll get the technician to install the software.", az: "Proqramı texnikə quraşdırtdıracağam." }
    ],
    wrong: [
      { bad: "I cut my hair yesterday at the barber's.", good: "I had my hair cut yesterday at the barber's.", why: "Bərbər kəsibsə, have + obyekt + V3 işlənir." },
      { bad: "I had repaired my car at the garage.", good: "I had my car repaired at the garage.", why: "Söz sırası: have + obyekt + V3." },
      { bad: "We must get the roof to fix.", good: "We must get the roof fixed.", why: "get + əşya + V3; to-məsdər yalnız şəxslə işlənir: get someone to fix it." }
    ],
    exercise: [
      { q: "I'm going to ___ my photo ___ (take) for my new passport.", a: ["have, taken", "get, taken"], hint: "have/get + obyekt + V3" },
      { q: "She ___ her teeth ___ (check) every six months.", a: ["has, checked", "gets, checked"], hint: "Müntəzəm xidmət" },
      { q: "Choose: We had our windows ___ last week.", options: ["clean", "cleaned", "cleaning"], a: ["cleaned"], hint: "V3" },
      { q: "Choose: I'll get my brother ___ me move the sofa.", options: ["help", "to help", "helped"], a: ["to help"], hint: "get + şəxs + to-məsdər" },
      { q: "He had his wallet ___ (steal) on the metro.", a: ["stolen"], hint: "steal – stole – stolen" }
    ],
    rule_ids: ["causative-have"] },

  { id: "reported-statements", level: "B2", group: "Vasitəli nitq", title: "Reported Speech: Statements", az: "Vasitəli nitq: nəqli cümlələr",
    when: "Başqasının dediyini öz sözlərimizlə çatdıranda işlənir; giriş feli keçmiş zamandadırsa, zamanlar adətən bir pillə geri çəkilir.",
    form: ["\"I am tired.\" → She said (that) she was tired.", "Present Perfect / Past Simple → Past Perfect", "will → would, can → could, may → might", "say vs tell: She said that… / She told me that…"],
    rules: [
      "Giriş feli keçmişdədirsə, zaman geri çəkilir: is → was, works → worked.",
      "Əvəzliklər və zaman/yer sözləri dəyişir: today → that day, tomorrow → the next day, here → there.",
      "tell-dən sonra mütləq kimə dediyimiz gəlir: She told me; say-dən sonra şəxs gəlmir (və ya to me).",
      "Hələ də doğru olan faktlarda zaman dəyişməyə bilər: He said the Earth goes around the Sun."
    ],
    azTrap: "Azərbaycan dilində «O dedi ki, yorğundur» cümləsində fel indiki zamanda qalır. Buna görə öyrənənlər ingiliscədə zamanı dəyişmir (She said she is tired) və say/tell-i qarışdırır: She said me.",
    examples: [
      { en: "He said that he was working from home that day.", az: "O dedi ki, həmin gün evdən işləyir." },
      { en: "She told me she had already seen the film.", az: "O mənə dedi ki, filmə artıq baxıb." },
      { en: "They said they would call us the next day.", az: "Onlar dedilər ki, ertəsi gün bizə zəng edəcəklər." },
      { en: "My teacher told us that we could use dictionaries.", az: "Müəllimimiz bizə dedi ki, lüğətdən istifadə edə bilərik." }
    ],
    wrong: [
      { bad: "She said me that she was busy.", good: "She told me that she was busy.", why: "Kimə dediyimizi bildirəndə tell işlənir; say me olmaz." },
      { bad: "He said that he will come tomorrow.", good: "He said that he would come the next day.", why: "will → would, tomorrow → the next day." },
      { bad: "She told that she liked the book.", good: "She said that she liked the book.", why: "tell-dən sonra şəxs mütləqdir; şəxs yoxdursa say işlənir." }
    ],
    exercise: [
      { q: "\"I am hungry.\" → He said he ___ hungry.", a: ["was"], hint: "am → was" },
      { q: "\"We have finished.\" → They said they ___ finished.", a: ["had"], hint: "have → had" },
      { q: "Choose: She ___ me that she was leaving.", options: ["said", "told", "spoke"], a: ["told"], hint: "Şəxs var: me" },
      { q: "Choose: \"I'll help you.\" → He said he ___ help me.", options: ["will", "would", "can"], a: ["would"], hint: "will → would" },
      { q: "\"I can swim.\" → My sister said she ___ swim.", a: ["could"], hint: "can → could" }
    ],
    rule_ids: ["say-tell", "backshift"] },

  { id: "reported-questions", level: "B2", group: "Vasitəli nitq", title: "Reported Questions", az: "Vasitəli nitq: sual cümlələri",
    when: "Başqasının verdiyi sualı çatdıranda işlənir; vasitəli sualda söz sırası nəqli cümlədəki kimi olur.",
    form: ["\"Where do you live?\" → She asked me where I lived.", "Bəli/xeyr sualı: if / whether — He asked if I was ready.", "do/does/did düşür, sual işarəsi qoyulmur", "Nəzakətli sual: Could you tell me where the station is?"],
    rules: [
      "Vasitəli sualda söz sırası: sual sözü + mübtəda + fel.",
      "do, does, did köməkçi felləri işlənmir.",
      "Sual sözü yoxdursa, if və ya whether əlavə olunur.",
      "Can you tell me…, Do you know… kimi dolayı suallarda da eyni söz sırası işlənir."
    ],
    azTrap: "Azərbaycan dilində «Soruşdu ki, harada yaşayırsan?» cümləsində birbaşa sual quruluşu saxlanılır. Buna görə öyrənənlər ingiliscədə də sual sırasını saxlayır: She asked me where do I live?",
    examples: [
      { en: "The officer asked me where I was going.", az: "Polis məndən hara getdiyimi soruşdu." },
      { en: "She asked whether I had ever been to Sheki.", az: "O, heç Şəkidə olub-olmadığımı soruşdu." },
      { en: "Do you know what time the museum opens?", az: "Muzeyin saat neçədə açıldığını bilirsən?" },
      { en: "He wanted to know how much the tickets cost.", az: "O, biletlərin neçəyə olduğunu bilmək istəyirdi." }
    ],
    wrong: [
      { bad: "She asked me where do I live.", good: "She asked me where I lived.", why: "Vasitəli sualda do düşür və söz sırası nəqli olur." },
      { bad: "He asked me am I ready.", good: "He asked me if I was ready.", why: "Bəli/xeyr sualında if/whether lazımdır." },
      { bad: "Can you tell me where is the bank?", good: "Can you tell me where the bank is?", why: "Dolayı sualda fel mübtədadan sonra gəlir." }
    ],
    exercise: [
      { q: "\"What is your name?\" → She asked me what my name ___.", a: ["was"], hint: "Fel sonda" },
      { q: "\"Do you like coffee?\" → He asked me ___ I liked coffee.", a: ["if", "whether"], hint: "Bəli/xeyr sualı" },
      { q: "Choose: Could you tell me where ___?", options: ["is the toilet", "the toilet is", "does the toilet"], a: ["the toilet is"], hint: "Mübtəda + fel" },
      { q: "Choose: They asked us when ___.", options: ["did we arrive", "we had arrived", "had we arrived"], a: ["we had arrived"], hint: "Nəqli söz sırası" },
      { q: "\"Where did you buy it?\" → She asked where I ___ (buy) it.", a: ["had bought"], hint: "did buy → had bought" }
    ],
    rule_ids: ["indirect-question-order"] },

  { id: "reported-commands", level: "B2", group: "Vasitəli nitq", title: "Reported Commands & Requests", az: "Vasitəli nitq: əmr və xahişlər",
    when: "Kiminsə əmrini, xahişini və ya məsləhətini çatdıranda fel + şəxs + to-məsdər quruluşu işlənir.",
    form: ["tell/ask + şəxs + to V1: She told me to wait.", "İnkar: tell + şəxs + not to V1: He asked us not to smoke.", "\"Please sit down.\" → She asked me to sit down.", "\"Don't touch it!\" → He told the kids not to touch it."],
    rules: [
      "Əmr üçün tell, xahiş üçün ask, məsləhət üçün advise işlənir.",
      "İnkarda not to-dan əvvəl gəlir: not to go (to not go yox).",
      "Bu quruluşda that-budaq cümləsi işlənmir.",
      "say bu quruluşda işlənmir: She said me to wait səhvdir."
    ],
    azTrap: "Azərbaycan dilində «Mənə dedi ki, gözlə» deyirik və öyrənənlər bunu say ilə tərcümə edir: She said me to wait və ya She said to me that wait. İngiliscədə əmr tell/ask + şəxs + to-məsdər ilə verilir.",
    examples: [
      { en: "The doctor told me to drink more water.", az: "Həkim mənə daha çox su içməyimi dedi." },
      { en: "My mother asked me not to come home late.", az: "Anam evə gec gəlməməyimi xahiş etdi." },
      { en: "The guide advised us to book the tickets online.", az: "Bələdçi biletləri onlayn almağı məsləhət gördü." },
      { en: "She asked the waiter to bring the bill.", az: "O, ofisiantdan hesabı gətirməsini xahiş etdi." }
    ],
    wrong: [
      { bad: "She said me to close the door.", good: "She told me to close the door.", why: "Əmr tell + şəxs + to-məsdər ilə verilir." },
      { bad: "He told us don't be late.", good: "He told us not to be late.", why: "İnkar əmr: not to + V1." },
      { bad: "They asked me that I help them.", good: "They asked me to help them.", why: "ask + şəxs + to-məsdər." }
    ],
    exercise: [
      { q: "\"Open your books.\" → The teacher told us ___ our books.", a: ["to open"], hint: "to + V1" },
      { q: "\"Don't worry.\" → She told me ___ worry.", a: ["not to"], hint: "not to" },
      { q: "Choose: He ___ me to call him later.", options: ["said", "asked", "spoke"], a: ["asked"], hint: "Xahiş" },
      { q: "Choose: The police told the crowd ___.", options: ["to not move", "not to move", "don't move"], a: ["not to move"], hint: "not to" },
      { q: "\"Could you help me, please?\" → She ___ me to help her.", a: ["asked"], hint: "Nəzakətli xahiş" }
    ],
    rule_ids: ["say-tell", "reported-imperative"] },

  { id: "reporting-verbs", level: "B2", group: "Vasitəli nitq", title: "Reporting Verbs", az: "Nəql felləri: suggest, admit, refuse…",
    when: "said-i təkrar etmək əvəzinə danışanın niyyətini (təklif, etiraf, imtina, xəbərdarlıq) dəqiq göstərən fellərdir; hər birinin öz quruluşu var.",
    form: ["fel + to V1: agree, offer, refuse, promise, threaten", "fel + şəxs + to V1: advise, warn, remind, persuade, encourage", "fel + -ing: admit, deny, suggest, recommend", "fel + ön söz + -ing: apologize for, insist on, accuse sb of, blame sb for"],
    rules: [
      "Hər felin quruluşunu birlikdə öyrənin: refuse to do, deny doing.",
      "suggest-dən sonra şəxs + to-məsdər gəlmir: suggest doing və ya suggest that we do.",
      "explain-dən sonra şəxs birbaşa gəlmir: explain something to someone.",
      "Bu fellər mətnə üslub və dəqiqlik verir, xüsusən esse və hesabatlarda."
    ],
    azTrap: "Azərbaycan dilində «Mənə izah etdi», «Getməyimizi təklif etdi» kimi quruluşlar öyrənənləri explain me və suggest us to go kimi səhvlərə aparır. Ana dilindəki yönlük hal ingiliscədə hər feldə fərqli qurulur.",
    examples: [
      { en: "He admitted breaking the vase.", az: "O, vazanı sındırdığını etiraf etdi." },
      { en: "She refused to sign the contract.", az: "O, müqaviləni imzalamaqdan imtina etdi." },
      { en: "My friend suggested going to the mountains for the weekend.", az: "Dostum həftə sonu dağlara getməyi təklif etdi." },
      { en: "The manager reminded us to submit our reports by Friday.", az: "Menecer hesabatları cüməyə qədər təqdim etməyi bizə xatırlatdı." }
    ],
    wrong: [
      { bad: "He suggested us to take a taxi.", good: "He suggested taking a taxi.", why: "suggest + -ing və ya suggest that we take…" },
      { bad: "She explained me the rules.", good: "She explained the rules to me.", why: "explain something to someone." },
      { bad: "He denied to steal the money.", good: "He denied stealing the money.", why: "deny-dən sonra -ing gəlir." }
    ],
    exercise: [
      { q: "\"I'll carry your bag.\" → He offered ___ my bag.", a: ["to carry"], hint: "offer + to V1" },
      { q: "\"I'm sorry I'm late.\" → She apologized ___ late.", a: ["for being"], hint: "apologize for + -ing" },
      { q: "Choose: The teacher encouraged me ___ for the competition.", options: ["to apply", "applying", "apply"], a: ["to apply"], hint: "encourage + şəxs + to V1" },
      { q: "Choose: They accused him ___ the documents.", options: ["to lose", "of losing", "for lose"], a: ["of losing"], hint: "accuse sb of + -ing" },
      { q: "\"Let's eat out tonight.\" → She suggested ___ (eat) out.", a: ["eating"], hint: "suggest + -ing" }
    ],
    rule_ids: ["suggest-pattern", "explain-to"] },

  { id: "modals-deduction-past", level: "B2", group: "Modal fellər", title: "Modals of Deduction: Present & Past", az: "Ehtimal bildirən modal fellər: must have, can't have, might have",
    when: "Faktlara əsaslanaraq indiki və ya keçmiş vəziyyət haqqında nəticə çıxaranda işlənir: əminlik dərəcəsini modal fel göstərir.",
    form: ["İndi: must / might / could / can't + V1", "Keçmiş: must / might / could / can't + have + V3", "She must have left. — He can't have seen us.", "They might have got lost."],
    rules: [
      "must have = əminəm ki, olub; can't have / couldn't have = əminəm ki, olmayıb.",
      "might / may / could have = ola bilsin ki, olub.",
      "Ehtimalda mustn't have işlənmir; inkar əminlik can't have ilə verilir.",
      "Davam edən hərəkət üçün: She must have been sleeping."
    ],
    azTrap: "Azərbaycan dilində «Yəqin ki, gedib», «Ola bilməz ki, görsün» kimi ifadələrdə ehtimal ayrıca sözlə bildirilir. Öyrənənlər ya bunu probably + Past Simple ilə verir, ya da əks ehtimal üçün mustn't have işlədir. Keçmiş ehtimal üçün modal + have + V3 lazımdır.",
    examples: [
      { en: "The lights are off. They must have gone to bed.", az: "İşıqlar sönüb. Yəqin ki, yatıblar." },
      { en: "She can't have finished the book already — it's 800 pages!", az: "O, kitabı artıq bitirmiş ola bilməz — 800 səhifədir!" },
      { en: "He might have missed the bus.", az: "Ola bilər ki, avtobusa gecikib." },
      { en: "You must be exhausted after such a long flight.", az: "Belə uzun uçuşdan sonra yəqin ki, çox yorulmusan." }
    ],
    wrong: [
      { bad: "He mustn't have heard the phone.", good: "He can't have heard the phone.", why: "Mənfi əminlik can't have ilə verilir." },
      { bad: "She must have went home.", good: "She must have gone home.", why: "have-dən sonra V3 gəlir: gone." },
      { bad: "They must left early.", good: "They must have left early.", why: "Keçmiş ehtimal: must + have + V3." }
    ],
    exercise: [
      { q: "The ground is wet. It ___ (must / rain) last night.", a: ["must have rained"], hint: "must have + V3" },
      { q: "She ___ (can't / see) me — I was hiding.", a: ["can't have seen", "cannot have seen", "couldn't have seen"], hint: "Mənfi əminlik" },
      { q: "Choose: I'm not sure where Ali is. He ___ to the gym.", options: ["must have gone", "might have gone", "can't have gone"], a: ["might have gone"], hint: "Əmin deyiləm" },
      { q: "Choose: You ___ be Leyla's brother — you look just like her!", options: ["must", "can't", "mustn't"], a: ["must"], hint: "İndiki əminlik" },
      { q: "They didn't answer the door. They ___ (might / be) asleep.", a: ["might have been"], hint: "might have been" }
    ],
    rule_ids: ["modal-have-v3", "mustnt-deduction"] },

  { id: "modals-past-obligation", level: "B2", group: "Modal fellər", title: "Should Have, Needn't Have, Had To", az: "Keçmişə aid öhdəlik, məsləhət və tənqid",
    when: "Keçmişdə edilməli olan, amma edilməyən iş (tənqid, təəssüf), lazım olmadan edilən iş və keçmiş məcburiyyət üçün işlənir.",
    form: ["should / ought to have + V3: You should have told me.", "shouldn't have + V3: I shouldn't have eaten so much.", "needn't have + V3 (edildi, amma lazım deyildi)", "didn't need to + V1 (lazım deyildi, adətən edilmədi); had to (məcbur idi)"],
    rules: [
      "should have = etməli idin, amma etmədin.",
      "needn't have done: iş görülüb, amma lüzumsuz idi. didn't need to do: lazım deyildi (adətən görülməyib).",
      "Keçmiş məcburiyyət had to ilə verilir; must have yox, çünki must have ehtimaldır.",
      "could have = imkan var idi, amma istifadə edilmədi: You could have called me."
    ],
    azTrap: "«Gəlməli idin» Azərbaycan dilində keçmiş zamanla deyilir və öyrənənlər bunu You must come və ya You had to come kimi çevirir. had to «məcbur idi» deməkdir; tənqid və təəssüf üçün should have + V3 lazımdır.",
    examples: [
      { en: "You should have told me you were ill.", az: "Xəstə olduğunu mənə deməli idin." },
      { en: "I shouldn't have shouted at him.", az: "Ona qışqırmamalı idim." },
      { en: "We needn't have cooked so much — half the guests didn't come.", az: "Bu qədər yemək bişirməyə ehtiyac yox idi — qonaqların yarısı gəlmədi." },
      { en: "I had to work late yesterday.", az: "Dünən gec saata qədər işləməli oldum." }
    ],
    wrong: [
      { bad: "You must have called me yesterday.", good: "You should have called me yesterday.", why: "must have ehtimal bildirir; tənqid should have ilə verilir." },
      { bad: "Yesterday I must work late.", good: "Yesterday I had to work late.", why: "Keçmiş məcburiyyət had to ilə verilir." },
      { bad: "You should told me earlier.", good: "You should have told me earlier.", why: "Keçmişə aid: should + have + V3." }
    ],
    exercise: [
      { q: "I failed the test. I ___ (should / study) more.", a: ["should have studied", "ought to have studied"], hint: "should have + V3" },
      { q: "We ___ (needn't / take) umbrellas — it didn't rain at all.", a: ["needn't have taken", "need not have taken"], hint: "Lüzumsuz iş görüldü" },
      { q: "Choose: My car broke down, so I ___ take a taxi.", options: ["must", "had to", "should have"], a: ["had to"], hint: "Keçmiş məcburiyyət" },
      { q: "Choose: You ___ eaten all that chocolate. Now you feel sick.", options: ["shouldn't have", "needn't", "mustn't"], a: ["shouldn't have"], hint: "Tənqid" },
      { q: "Why didn't you ask? I ___ (could / help) you.", a: ["could have helped"], hint: "İstifadə olunmayan imkan" }
    ],
    rule_ids: ["should-have", "modal-have-v3"] },

  { id: "gerund-infinitive-meaning", level: "B2", group: "Feli formalar (-ing / to)", title: "Gerund vs Infinitive: Change in Meaning", az: "Məna dəyişikliyi: stop, remember, try, forget, regret",
    when: "Bəzi fellərdən sonra həm -ing, həm də to-məsdər gələ bilər, amma məna fərqli olur.",
    form: ["stop doing (dayandırmaq) / stop to do (nəyisə etmək üçün dayanmaq)", "remember / forget doing (keçmişi xatırlamaq) / remember to do (etməyi unutmamaq)", "try doing (sınaq üçün yoxlamaq) / try to do (cəhd etmək, çətindir)", "regret doing (peşmanlıq) / regret to tell (rəsmi: təəssüflə bildirmək)"],
    rules: [
      "-ing adətən daha əvvəl baş vermiş və ya artıq gedən hərəkətə işarə edir.",
      "to-məsdər adətən sonra ediləcək hərəkətə və ya məqsədə işarə edir.",
      "go on doing (davam etmək) / go on to do (sonra başqa işə keçmək).",
      "like, love, hate, start, begin-də məna demək olar ki, dəyişmir."
    ],
    azTrap: "Azərbaycan dilində «Siqareti atdım» və «Siqaret çəkmək üçün dayandım» tamam fərqli sözlərlə deyilir, ona görə də öyrənənlər stop smoking və stop to smoke arasındakı fərqi hiss etmir və birini o birinin yerinə işlədir.",
    examples: [
      { en: "He stopped smoking two years ago.", az: "O, iki il əvvəl siqareti atdı." },
      { en: "We stopped to buy some water on the way.", az: "Yolda su almaq üçün dayandıq." },
      { en: "Remember to lock the door when you leave.", az: "Çıxanda qapını bağlamağı unutma." },
      { en: "I remember meeting her at a conference in Tbilisi.", az: "Onunla Tbilisidə bir konfransda tanış olduğumu xatırlayıram." }
    ],
    wrong: [
      { bad: "Don't forget calling your grandmother.", good: "Don't forget to call your grandmother.", why: "Gələcəkdə ediləcək iş üçün forget to do." },
      { bad: "I stopped to eat sugar because it's unhealthy.", good: "I stopped eating sugar because it's unhealthy.", why: "Vərdişi dayandırmaq: stop doing." },
      { bad: "If the printer doesn't work, try to turn it off and on.", good: "If the printer doesn't work, try turning it off and on.", why: "Həll yolu kimi sınamaq: try doing." }
    ],
    exercise: [
      { q: "I'll never forget ___ (see) the Caspian Sea for the first time.", a: ["seeing"], hint: "Keçmiş xatirə" },
      { q: "Please remember ___ (send) the email before 5.", a: ["to send"], hint: "Ediləcək iş" },
      { q: "Choose: On the way home, I stopped ___ some bread.", options: ["buying", "to buy", "buy"], a: ["to buy"], hint: "Məqsəd" },
      { q: "Choose: I tried ___ the window, but it was stuck.", options: ["to open", "opening", "open"], a: ["to open"], hint: "Cəhd etdi, alınmadı" },
      { q: "We regret ___ (inform) you that your application was unsuccessful.", a: ["to inform"], hint: "Rəsmi təəssüf" }
    ],
    rule_ids: ["gerund-infinitive"] },

  { id: "relative-clauses-defining", level: "B2", group: "Budaq cümlələr", title: "Defining vs Non-defining Relative Clauses", az: "Təyin budaq cümlələri: məhdudlaşdırıcı və əlavə",
    when: "Defining clause kimdən/nədən danışdığımızı müəyyən edir və vacibdir; non-defining clause artıq bəlli olan şəxs/əşya haqqında əlavə məlumat verir və vergüllə ayrılır.",
    form: ["Defining: The man who lives next door is a pilot.", "Non-defining: My father, who is 60, still plays football.", "who (şəxs), which (əşya), whose (yiyəlik), where, when", "that yalnız defining-də; non-defining-də that işlənmir"],
    rules: [
      "Non-defining clause hər iki tərəfdən vergüllə ayrılır və onu çıxarsaq, cümlənin mənası tam qalır.",
      "Non-defining clause-da that işlənmir: …Baku, which is the capital…",
      "Defining clause-da obyekt olan əvəzlik buraxıla bilər: The book (that) I bought.",
      "which bütöv bir cümləyə də aid ola bilər: He passed the exam, which surprised everyone."
    ],
    azTrap: "Azərbaycan dilində təyin budaq cümləsi adətən feli sifətlə (qonşuluqda yaşayan adam) verilir, vergül qaydası yoxdur. Buna görə öyrənənlər ingiliscədə vergülü təsadüfi qoyur və non-defining clause-da that işlədir: My mother, that is a teacher…",
    examples: [
      { en: "The woman who interviewed me was very friendly.", az: "Mənimlə müsahibə aparan qadın çox mehriban idi." },
      { en: "Baku, which is on the Caspian coast, hosts many international events.", az: "Xəzər sahilində yerləşən Bakı bir çox beynəlxalq tədbirə ev sahibliyi edir." },
      { en: "That's the café where we first met.", az: "Bu, ilk dəfə görüşdüyümüz kafedir." },
      { en: "My neighbor, whose son is a surgeon, gave me some advice.", az: "Oğlu cərrah olan qonşum mənə məsləhət verdi." }
    ],
    wrong: [
      { bad: "My brother, that lives in Ganja, is visiting us.", good: "My brother, who lives in Ganja, is visiting us.", why: "Non-defining clause-da that işlənmir." },
      { bad: "The people, who live here, are friendly.", good: "The people who live here are friendly.", why: "Bu clause kimlərdən danışdığımızı müəyyən edir, vergül qoyulmur." },
      { bad: "This is the book which I told you about it.", good: "This is the book which I told you about.", why: "which artıq obyekti əvəz edir; it təkrarlanmır." }
    ],
    exercise: [
      { q: "The girl ___ won the prize is my cousin.", a: ["who", "that"], hint: "Şəxs, defining" },
      { q: "Shusha, ___ is famous for its music, is in Karabakh.", a: ["which"], hint: "Non-defining, əşya/yer" },
      { q: "Choose: That's the man ___ car was stolen.", options: ["who", "whose", "which"], a: ["whose"], hint: "Yiyəlik" },
      { q: "Choose: Which sentence is punctuated correctly?", options: ["My mother who is a nurse works nights.", "My mother, who is a nurse, works nights.", "My mother, that is a nurse, works nights."], a: ["My mother, who is a nurse, works nights."], hint: "Yalnız bir anam var — əlavə məlumat" },
      { q: "I remember the day ___ we moved to this city.", a: ["when", "that"], hint: "Zaman" }
    ],
    rule_ids: ["relative-comma", "relative-that-nondefining"] },

  { id: "phrasal-verbs-separable", level: "B2", group: "Söz sırası", title: "Phrasal Verbs: Separable & Inseparable", az: "Frazal fellər: ayrılan və ayrılmayan",
    when: "Fel + hissəcik birləşmələrində tamamlığın harada durduğunu müəyyən etmək üçün; bəzi frazal fellər tamamlıqla ayrıla bilir, bəziləri ayrılmır.",
    form: ["Ayrılan: turn off the light / turn the light off", "Əvəzlik mütləq ortada: turn it off (turn off it yox)", "Ayrılmayan: look after the kids / look after them", "Üç hissəli: look forward to, get on with, put up with"],
    rules: [
      "Ayrılan frazal fellərdə tamamlıq isimdirsə, hər iki yerdə dura bilər.",
      "Tamamlıq əvəzlikdirsə (it, them, her), mütləq fel ilə hissəcik arasında durur.",
      "Ayrılmayan fellərdə (look after, get over, come across) tamamlıq həmişə sonda gəlir.",
      "Üç hissəli fellər heç vaxt ayrılmır: I can't put up with it."
    ],
    azTrap: "Azərbaycan dilində tamamlıq feldən əvvəl gəlir (işığı söndür) və hissəcik anlayışı yoxdur. Buna görə öyrənənlər ingiliscədə əvəzliyi sona qoyur: Turn off it, Pick up them. Bu, ingilis qulağına çox kobud səslənir.",
    examples: [
      { en: "Could you turn the music down, please?", az: "Musiqinin səsini azalda bilərsən?" },
      { en: "I wrote the number down, but then I lost it.", az: "Nömrəni yazdım, amma sonra itirdim." },
      { en: "My grandmother looks after my little sister.", az: "Nənəm kiçik bacıma baxır." },
      { en: "I'm really looking forward to the holidays.", az: "Tətili səbirsizliklə gözləyirəm." }
    ],
    wrong: [
      { bad: "It's cold. Put on it.", good: "It's cold. Put it on.", why: "Əvəzlik fel ilə hissəcik arasında durur." },
      { bad: "I'll pick up you at seven.", good: "I'll pick you up at seven.", why: "you əvəzlikdir: pick you up." },
      { bad: "She looks her brother after.", good: "She looks after her brother.", why: "look after ayrılmır." }
    ],
    exercise: [
      { q: "These are my shoes. Can you put ___ (them) ___ away?", a: ["them", "them, —"], hint: "Əvəzlik ortada: put them away" },
      { q: "Choose: Your coat is on the floor. ___", options: ["Pick up it.", "Pick it up.", "Pick up."], a: ["Pick it up."], hint: "Əvəzlik ortada" },
      { q: "Choose: I came ___ an old photo while cleaning.", options: ["across", "it across", "over"], a: ["across"], hint: "come across ayrılmır" },
      { q: "Choose: I can't put ___ this noise any longer.", options: ["up", "up with", "with up"], a: ["up with"], hint: "Üç hissəli" },
      { q: "The meeting was canceled. They called ___ off.", a: ["it"], hint: "call it off" }
    ],
    rule_ids: ["phrasal-pronoun-order"] },

  { id: "make-do-collocations", level: "B2", group: "Artikllər və isimlər", title: "Collocations: Make vs Do", az: "Söz birləşmələri: make və do",
    when: "Azərbaycan dilində hər ikisi «etmək» kimi tərcümə olunur, amma ingiliscədə hansı isimlə hansı felin işləndiyi sabit birləşmələrlə müəyyən olunur.",
    form: ["make = yaratmaq, nəticə: make a cake, make a decision, make a mistake, make money", "do = iş, fəaliyyət, vəzifə: do homework, do the dishes, do a favor, do business", "make + hiss/səs: make a noise, make a complaint, make an effort", "do + ümumi iş: do something, do nothing, do your best"],
    rules: [
      "Yeni bir şey yaradılırsa, adətən make işlənir: make a plan, make a list.",
      "Gündəlik işlər və vəzifələr üçün do: do the shopping, do the laundry.",
      "Ümumi qaydaya uymayan birləşmələri əzbərləmək lazımdır: make friends, do damage.",
      "Şəkil çəkmək üçün take a photo işlənir (make a photo yox)."
    ],
    azTrap: "«Etmək» və «eləmək» feli Azərbaycan dilində çox geniş işləndiyi üçün öyrənənlər bütün birləşmələri do ilə verir (do a mistake, do a decision) və ya rus dilinin təsiri ilə make a photo deyir.",
    examples: [
      { en: "We need to make a decision by Monday.", az: "Bazar ertəsinə qədər qərar verməliyik." },
      { en: "Could you do me a favor?", az: "Mənə bir yaxşılıq edə bilərsən?" },
      { en: "He made a lot of money in the oil industry.", az: "O, neft sənayesində çox pul qazandı." },
      { en: "I'll do the dishes if you make dinner.", az: "Sən şam yeməyi hazırlasan, mən qabları yuyaram." }
    ],
    wrong: [
      { bad: "I did a mistake in my essay.", good: "I made a mistake in my essay.", why: "Sabit birləşmə: make a mistake." },
      { bad: "Can you make a photo of us?", good: "Can you take a photo of us?", why: "Şəkil çəkmək: take a photo." },
      { bad: "She makes her homework every evening.", good: "She does her homework every evening.", why: "Sabit birləşmə: do homework." }
    ],
    exercise: [
      { q: "Please don't ___ so much noise — the baby is sleeping.", a: ["make"], hint: "Səs" },
      { q: "I always ___ my best in exams.", a: ["do"], hint: "do your best" },
      { q: "Choose: It's hard to ___ friends in a new city.", options: ["do", "make", "take"], a: ["make"], hint: "Sabit birləşmə" },
      { q: "Choose: We ___ business with companies in Turkey.", options: ["make", "do", "have"], a: ["do"], hint: "Sabit birləşmə" },
      { q: "He ___ an effort to be polite, but he was clearly annoyed.", a: ["made"], hint: "make an effort" }
    ],
    rule_ids: ["make-do", "make-photo"] },

  { id: "dependent-prepositions", level: "B2", group: "Ön sözlər", title: "Dependent Prepositions", az: "Asılı ön sözlər: interested in, depend on, good at",
    when: "Bəzi sifət, fel və isimlərdən sonra müəyyən bir ön söz gəlir; bu birləşmələr məntiqlə deyil, istifadə ilə müəyyən olunur.",
    form: ["sifət + ön söz: interested in, good at, afraid of, proud of, responsible for", "fel + ön söz: depend on, listen to, wait for, belong to, consist of", "isim + ön söz: reason for, solution to, increase in, damage to", "Ön sözdən sonra fel gəlirsə, -ing formasında olur: good at swimming"],
    rules: [
      "Ön sözü sözlə birlikdə öyrənin: depend on, «depend from» yox.",
      "Ön sözdən sonra həmişə isim, əvəzlik və ya -ing gəlir.",
      "Bəzi fellər ön söz qəbul etmir: discuss, enter, marry, call, answer.",
      "Ön söz mənanı dəyişə bilər: angry about (bir şeyə), angry with (birinə)."
    ],
    azTrap: "Azərbaycan dilində ön söz yerinə hal şəkilçiləri işlənir və öyrənənlər onları birbaşa tərcümə edir: «-dan asılıdır» → depend from, «haqqında müzakirə» → discuss about, «-a zəng etmək» → call to him. Rus dilinin təsiri də bu səhvləri gücləndirir.",
    examples: [
      { en: "I'm really interested in modern architecture.", az: "Müasir memarlığa çox maraq göstərirəm." },
      { en: "Our plans depend on the weather.", az: "Planlarımız havadan asılıdır." },
      { en: "She is very good at solving problems.", az: "O, problemləri həll etməkdə çox bacarıqlıdır." },
      { en: "We discussed the budget at the meeting.", az: "İclasda büdcəni müzakirə etdik." }
    ],
    wrong: [
      { bad: "It depends from the price.", good: "It depends on the price.", why: "depend həmişə on ilə işlənir." },
      { bad: "Let's discuss about this problem.", good: "Let's discuss this problem.", why: "discuss-dan sonra ön söz gəlmir." },
      { bad: "I'm interested to learn Japanese.", good: "I'm interested in learning Japanese.", why: "interested in + -ing." }
    ],
    exercise: [
      { q: "She's afraid ___ spiders.", a: ["of"], hint: "afraid of" },
      { q: "This book belongs ___ my teacher.", a: ["to"], hint: "belong to" },
      { q: "Choose: Are you good ___ math?", options: ["in", "at", "on"], a: ["at"], hint: "good at" },
      { q: "Choose: She married ___ last year.", options: ["with a doctor", "a doctor", "to a doctor"], a: ["a doctor"], hint: "marry + birbaşa tamamlıq" },
      { q: "There has been an increase ___ prices this year.", a: ["in"], hint: "increase in" }
    ],
    rule_ids: ["dependent-preposition", "discuss-about"] },

  { id: "quantifiers-advanced", level: "B2", group: "Əvəzliklər", title: "Each, Every, Either, Neither, Both", az: "Kəmiyyət əvəzlikləri: each, every, either, neither, both",
    when: "Qrupdakı üzvlərə ayrı-ayrılıqda (each, every) və ya iki şeydən birinə, heç birinə, hər ikisinə (either, neither, both) işarə etmək üçün işlənir.",
    form: ["each / every + tək isim + tək fel: Every student has a book.", "both + cəm isim: Both answers are correct.", "either / neither + tək isim: Neither option is good.", "either of / neither of / each of + the + cəm isim"],
    rules: [
      "every üç və daha çox üçün işlənir, each iki və daha çox üçün, fərdiliyi vurğulayır.",
      "both, either, neither yalnız iki şey üçündür.",
      "neither inkar mənası daşıyır, ondan sonra not işlənmir: Neither of them came.",
      "both … and, either … or, neither … nor: Neither Ali nor Aysel was there."
    ],
    azTrap: "Azərbaycan dilində «Hər tələbələr gəldi» deyilməsə də, «hamı» sözü cəm kimi düşünüldüyü üçün öyrənənlər every-dən sonra cəm isim və ya cəm fel işlədir: Every students have… Həmçinin «Heç biri gəlmədi» cümləsində ikiqat inkar normaldır, bu da Neither of them didn't come səhvinə gətirir.",
    examples: [
      { en: "Every room in the hotel has a sea view.", az: "Oteldəki hər otaqdan dəniz görünür." },
      { en: "Each of the candidates was interviewed separately.", az: "Namizədlərin hər biri ilə ayrıca müsahibə aparıldı." },
      { en: "You can park on either side of the street.", az: "Küçənin istənilən tərəfində park edə bilərsən." },
      { en: "Neither of my parents speaks English.", az: "Valideynlərimin heç biri ingiliscə danışmır." }
    ],
    wrong: [
      { bad: "Every students have to wear a uniform.", good: "Every student has to wear a uniform.", why: "every + tək isim + tək fel." },
      { bad: "Neither of them didn't come.", good: "Neither of them came.", why: "neither artıq inkardır; ikiqat inkar olmaz." },
      { bad: "Both of the three options are good.", good: "All three options are good.", why: "both yalnız iki şey üçündür." }
    ],
    exercise: [
      { q: "___ child in the class received a gift.", a: ["Every", "Each"], hint: "Tək isim" },
      { q: "I have two brothers. ___ of them are engineers.", a: ["Both"], hint: "İkisi də" },
      { q: "Choose: ___ of the two hotels was available, so we stayed with friends.", options: ["Either", "Neither", "Both"], a: ["Neither"], hint: "Heç biri" },
      { q: "Choose: Each of the players ___ a medal.", options: ["get", "gets", "are getting"], a: ["gets"], hint: "each of + tək fel" },
      { q: "You can pay ___ in cash or by card.", a: ["either"], hint: "either … or" }
    ],
    rule_ids: ["every-singular", "double-negative"] },

  { id: "linking-contrast", level: "B2", group: "Bağlayıcılar", title: "Linking Words: However, Although, Despite, Whereas", az: "Qarşılaşdırma və ziddiyyət bildirən bağlayıcılar",
    when: "Fikirlər arasında ziddiyyət və ya müqayisə göstərmək üçün; hər bağlayıcının cümlədəki yeri və ardınca gələn quruluş fərqlidir.",
    form: ["although / even though + tam cümlə: Although it was late, we went out.", "despite / in spite of + isim / -ing: Despite the rain, we went out.", "however / nevertheless: yeni cümlənin əvvəlində, vergüllə", "whereas / while: iki faktı müqayisə edir"],
    rules: [
      "despite-dən sonra of gəlmir: despite the rain (despite of yox), amma in spite of.",
      "despite-dən sonra tam cümlə lazımdırsa: despite the fact that…",
      "however iki cümləni vergüllə birləşdirmir: nöqtə və ya nöqtəli vergül lazımdır.",
      "although ilə but birlikdə işlənmir."
    ],
    azTrap: "Azərbaycan dilində «Baxmayaraq ki, … amma …» quruluşu tamamilə təbiidir, ona görə öyrənənlər Although it was cold, but we swam yazır. Həmçinin «-a baxmayaraq» ifadəsi despite of kimi tərcümə olunur.",
    examples: [
      { en: "Although she was tired, she finished the report.", az: "Yorğun olmasına baxmayaraq, hesabatı bitirdi." },
      { en: "Despite the traffic, we arrived on time.", az: "Tıxaca baxmayaraq, vaxtında çatdıq." },
      { en: "The plan was expensive. Nevertheless, the board approved it.", az: "Plan baha idi. Buna baxmayaraq, idarə heyəti onu təsdiqlədi." },
      { en: "My brother loves football, whereas I prefer chess.", az: "Qardaşım futbolu sevir, mən isə şahmatı üstün tuturam." }
    ],
    wrong: [
      { bad: "Although it was raining, but we played.", good: "Although it was raining, we played.", why: "although və but birlikdə işlənmir." },
      { bad: "Despite of the cold, she went swimming.", good: "Despite the cold, she went swimming.", why: "despite-dən sonra of gəlmir." },
      { bad: "The test was hard, however I passed.", good: "The test was hard; however, I passed.", why: "however iki cümləni vergüllə birləşdirmir." }
    ],
    exercise: [
      { q: "___ the bad weather, the flight left on time.", a: ["Despite", "In spite of"], hint: "+ isim" },
      { q: "___ he is rich, he lives in a small flat.", a: ["Although", "Even though", "Though"], hint: "+ tam cümlə" },
      { q: "Choose: The hotel was cheap. ___, it was very clean.", options: ["Although", "However", "Despite"], a: ["However"], hint: "Yeni cümlənin əvvəli" },
      { q: "Choose: She succeeded despite ___ no experience.", options: ["she had", "having", "of having"], a: ["having"], hint: "despite + -ing" },
      { q: "Some people love winter, ___ others can't stand it.", a: ["whereas", "while"], hint: "Müqayisə" }
    ],
    rule_ids: ["although-but", "despite-of", "however-comma"] },

  { id: "emphasis-do", level: "B2", group: "Söz sırası", title: "Emphatic Do/Does/Did", az: "Vurğu üçün do / does / did",
    when: "Təsdiq cümləsində fikri gücləndirmək, kiminsə şübhəsinə və ya iddiasına etiraz etmək üçün köməkçi fel əlavə olunur.",
    form: ["do + V1: I do like your dress!", "does + V1: She does work hard.", "did + V1: I did call you yesterday!", "Əmr: Do sit down. (nəzakətli, rəsmi)"],
    rules: [
      "do/does/did-dən sonra fel həmişə V1 formasında olur.",
      "Danışıqda köməkçi fel vurğulu tələffüz olunur.",
      "Ziddiyyət bildirmək üçün idealdır: I know you think I forgot, but I did remember.",
      "Əmr cümləsində Do come in nəzakətli dəvətdir."
    ],
    azTrap: "Azərbaycan dilində vurğu «həqiqətən», «axı», «əlbəttə» kimi sözlərlə verilir. Öyrənənlər did-dən sonra felin keçmiş formasını saxlayır: I did called you. Ya da bu quruluşu heç işlətmir və danışığı bir qədər «düz» edir.",
    examples: [
      { en: "I do understand your concerns.", az: "Narahatlığınızı həqiqətən başa düşürəm." },
      { en: "He doesn't talk much, but he does care about you.", az: "Az danışır, amma səni həqiqətən düşünür." },
      { en: "I did send the email — check your spam folder.", az: "Məktubu göndərdim axı — spam qovluğuna bax." },
      { en: "Do take a seat, Mr. Aliyev.", az: "Buyurun, əyləşin, cənab Əliyev." }
    ],
    wrong: [
      { bad: "I did called you yesterday!", good: "I did call you yesterday!", why: "did-dən sonra V1 gəlir." },
      { bad: "She does works very hard.", good: "She does work very hard.", why: "does-dan sonra felə -s artırılmır." },
      { bad: "I do am tired.", good: "I am tired. / I really am tired.", why: "be feli ilə do işlənmir; be-nin özü vurğulanır." }
    ],
    exercise: [
      { q: "You think I don't like it, but I ___ like it!", a: ["do"], hint: "İndiki zaman, I" },
      { q: "She ___ (does) ___ (look) tired today.", a: ["does, look", "does look"], hint: "does + V1" },
      { q: "Choose: I ___ lock the door. I'm sure of it.", options: ["did", "do", "was"], a: ["did"], hint: "Keçmiş" },
      { q: "Choose: He did ___ his homework.", options: ["finished", "finish", "finishes"], a: ["finish"], hint: "did + V1" },
      { q: "___ come in and make yourself at home!", a: ["Do"], hint: "Nəzakətli dəvət" }
    ],
    rule_ids: ["emphatic-do", "did-past-verb"] },

  /* ===================== C1 ===================== */

  { id: "passive-reporting", level: "C1", group: "Məchul növ", title: "Impersonal Passive: It Is Said That…", az: "Şəxssiz məchul: It is said that…, He is believed to…",
    when: "Xəbər, elmi və rəsmi mətnlərdə fikrin mənbəyini göstərmədən ümumi rəyi, iddianı və ya ehtimalı çatdırmaq üçün işlənir.",
    form: ["It + is said / believed / thought / reported + that…: It is believed that he left.", "Mübtəda + is said + to V1: He is said to be rich.", "Mübtəda + is said + to have V3 (keçmiş): He is said to have left.", "Mübtəda + is said + to be -ing (davam edən): She is thought to be hiding."],
    rules: [
      "Bu quruluş say, believe, think, report, know, expect, claim, consider fellərilə işlənir.",
      "Bildirilən hərəkət ondan əvvəl olubsa, to have + V3 işlənir.",
      "There ilə də qurula bilər: There are said to be wolves in the forest.",
      "Bu üslub danışanın məsuliyyəti öz üzərinə götürmədiyini göstərir — xəbərlərdə çox vacibdir."
    ],
    azTrap: "Azərbaycan dilində «Deyilənə görə, o, ölkəni tərk edib» deyirik və öyrənənlər bunu They say that… ilə və ya hərfi It says that… ilə tərcümə edir. Şəxsli formada isə keçmişi bildirən to have + V3-ü unudurlar: He is said to leave the country.",
    examples: [
      { en: "It is said that the castle is haunted.", az: "Deyilənə görə, qalada ruhlar dolaşır." },
      { en: "The painting is believed to be worth millions.", az: "Tablonun milyonlarla dəyərində olduğu güman edilir." },
      { en: "The suspect is thought to have left the country.", az: "Şübhəlinin ölkəni tərk etdiyi düşünülür." },
      { en: "There are reported to be hundreds of people still waiting.", az: "Bildirilir ki, yüzlərlə insan hələ də gözləyir." }
    ],
    wrong: [
      { bad: "He is said that he is very rich.", good: "He is said to be very rich.", why: "Şəxsli formada that yox, to-məsdər gəlir." },
      { bad: "The minister is believed to resign last week.", good: "The minister is believed to have resigned last week.", why: "Keçmiş hərəkət: to have + V3." },
      { bad: "It says that coffee is good for the heart.", good: "It is said that coffee is good for the heart.", why: "Ümumi rəy: It is said that…" }
    ],
    exercise: [
      { q: "It ___ (believe) that the treasure was buried here.", a: ["is believed"], hint: "It is + V3 + that" },
      { q: "The actor is said ___ (be) very generous.", a: ["to be"], hint: "to + V1" },
      { q: "Choose: The fire is thought ___ by a cigarette.", options: ["to cause", "to have been caused", "that caused"], a: ["to have been caused"], hint: "Keçmiş + məchul" },
      { q: "Choose: ___ are said to be over 2,000 mud volcanoes in the world.", options: ["It", "There", "They"], a: ["There"], hint: "there are said to be" },
      { q: "The company is expected ___ (announce) its results tomorrow.", a: ["to announce"], hint: "Gələcək: to + V1" }
    ],
    rule_ids: ["impersonal-passive"] },

  { id: "participle-clauses", level: "C1", group: "Budaq cümlələr", title: "Participle Clauses", az: "Feli sifət tərkibləri: Having finished…, Written in…",
    when: "Yazılı və rəsmi üslubda budaq cümləni qısaltmaq üçün işlənir: səbəb, zaman, şərt və ya nəticəni -ing, V3 və having + V3 formaları ilə ifadə edir.",
    form: ["-ing (eyni vaxtda / səbəb): Feeling tired, I went to bed.", "having + V3 (daha əvvəl): Having finished the report, she left.", "V3 (məchul): Written in 1920, the novel is still popular.", "Qısaldılmış relative: The man sitting by the window is my boss."],
    rules: [
      "Tərkibin gizli mübtədası əsas cümlənin mübtədası ilə eyni olmalıdır.",
      "Hərəkət əsas hərəkətdən əvvəl bitibsə, having + V3 işlənir.",
      "Məchul məna üçün V3: Built in 1890, the house needs repair.",
      "Əsas mübtəda fərqlidirsə, «sallanan» (dangling) tərkib yaranır — bu, ciddi üslub səhvidir."
    ],
    azTrap: "Azərbaycan dilində «Evə çatanda yağış başladı» kimi feli bağlamalı cümlələrdə mübtədaların fərqli olması normaldır. İngiliscədə isə Arriving home, the rain started cümləsi yağışın evə çatdığını bildirir. Bu «sallanan» tərkib Azərbaycan dilində danışanların ən çox etdiyi C1 səhvidir.",
    examples: [
      { en: "Walking along the boulevard, we saw an old friend.", az: "Bulvar boyu gəzərkən köhnə bir dostumuzu gördük." },
      { en: "Having lived abroad for ten years, he found Baku very different.", az: "On il xaricdə yaşadıqdan sonra Bakını çox fərqli gördü." },
      { en: "Built in the 12th century, the Maiden Tower attracts many tourists.", az: "XII əsrdə tikilmiş Qız qalası çoxlu turist cəlb edir." },
      { en: "Not knowing the way, I asked a police officer.", az: "Yolu bilmədiyim üçün polisdən soruşdum." }
    ],
    wrong: [
      { bad: "Arriving at the station, the train had already left.", good: "Arriving at the station, I found that the train had already left.", why: "Tərkibin mübtədası (mən) əsas cümlənin mübtədası olmalıdır." },
      { bad: "Finished the work, she went home.", good: "Having finished the work, she went home.", why: "Əvvəl bitmiş hərəkət: having + V3." },
      { bad: "Writing in simple English, the book is easy to read.", good: "Written in simple English, the book is easy to read.", why: "Kitab yazılıb (məchul): V3." }
    ],
    exercise: [
      { q: "___ (have) finished dinner, we went for a walk.", a: ["Having"], hint: "having + V3" },
      { q: "___ (know) little about art, I didn't comment on the painting.", a: ["Knowing"], hint: "Səbəb, -ing" },
      { q: "Choose: ___ by millions, the song became a global hit.", options: ["Downloading", "Downloaded", "Having downloaded"], a: ["Downloaded"], hint: "Məchul məna" },
      { q: "Choose: Which sentence is correct?", options: ["Walking home, it started to rain.", "Walking home, I got caught in the rain.", "Walked home, I got caught in the rain."], a: ["Walking home, I got caught in the rain."], hint: "Eyni mübtəda" },
      { q: "The students ___ (take) the exam must arrive by 9.", a: ["taking"], hint: "= who are taking" }
    ],
    rule_ids: ["dangling-participle"] },

  { id: "inversion", level: "C1", group: "Söz sırası", title: "Inversion after Negative Adverbials", az: "İnversiya: Never have I…, Not only…, Hardly had…",
    when: "Rəsmi, yazılı və ya ritorik üslubda inkar və ya məhdudlaşdırıcı zərflə cümləni başlayaraq vurğu yaratmaq üçün işlənir; bu zaman sual söz sırası işlənir.",
    form: ["Never / Rarely / Seldom + köməkçi fel + mübtəda: Never have I seen such beauty.", "Not only … but also: Not only did he lie, but he also stole.", "Hardly / No sooner … when / than: No sooner had I sat down than the phone rang.", "Only then / Only after / Under no circumstances / Little did I know"],
    rules: [
      "Köməkçi fel mübtədadan əvvəl gəlir, əsas fel yerində qalır.",
      "Köməkçi fel yoxdursa, do/does/did əlavə olunur: Rarely does he complain.",
      "Hardly ilə when, No sooner ilə than işlənir və adətən Past Perfect gəlir.",
      "Şərt cümlələrində if-siz inversiya: Had I known… = If I had known…"
    ],
    azTrap: "Azərbaycan dilində söz sırası sərbəstdir və vurğu üçün sadəcə sözün yeri dəyişdirilir, köməkçi fel yoxdur. Buna görə öyrənənlər Never I have seen… və ya Not only he lied… yazır — inversiyanı tamamlamırlar.",
    examples: [
      { en: "Never have I seen such a beautiful sunset.", az: "Heç vaxt belə gözəl gün batımı görməmişdim." },
      { en: "Not only did she win the race, but she also broke the record.", az: "O, nəinki yarışda qalib gəldi, həm də rekord qırdı." },
      { en: "No sooner had we arrived than it started to snow.", az: "Biz çatan kimi qar yağmağa başladı." },
      { en: "Under no circumstances should you share your password.", az: "Heç bir halda şifrənizi heç kimlə paylaşmamalısınız." }
    ],
    wrong: [
      { bad: "Never I have been so embarrassed.", good: "Never have I been so embarrassed.", why: "Köməkçi fel mübtədadan əvvəl gəlir." },
      { bad: "Not only he speaks French, but also German.", good: "Not only does he speak French, but he also speaks German.", why: "Not only-dən sonra inversiya: does he speak." },
      { bad: "Hardly had I closed my eyes than the alarm went off.", good: "Hardly had I closed my eyes when the alarm went off.", why: "Hardly … when; No sooner … than." }
    ],
    exercise: [
      { q: "Rarely ___ she make mistakes.", a: ["does"], hint: "do/does köməkçisi" },
      { q: "Never ___ I heard such nonsense!", a: ["have"], hint: "Present Perfect" },
      { q: "Choose: No sooner had he left ___ the guests arrived.", options: ["when", "than", "that"], a: ["than"], hint: "No sooner … than" },
      { q: "Choose: Little ___ that my life was about to change.", options: ["I knew", "did I know", "I did know"], a: ["did I know"], hint: "İnversiya" },
      { q: "___ I known about the problem, I would have helped.", a: ["Had"], hint: "= If I had known" }
    ],
    rule_ids: ["inversion-negative"] },

  { id: "cleft-sentences", level: "C1", group: "Söz sırası", title: "Cleft Sentences", az: "Vurğulu (parçalanmış) cümlələr: What I need is…, It was … who…",
    when: "Cümlənin bir hissəsini önə çəkib vurğulamaq üçün işlənir; danışıqda intonasiyanın gördüyü işi yazıda quruluş görür.",
    form: ["What-cleft: What I need is a holiday.", "It-cleft: It was Leyla who found the keys.", "All-cleft: All I want is some peace and quiet.", "The reason / The place / The person: The reason why I left is…"],
    rules: [
      "What-cleft-də what hissəsi tək sayılır: What we need is more people.",
      "It-cleft-də vurğulanan hissə It is/was-dan sonra gəlir, ardınca who/that.",
      "What I did was + (to) V1: What I did was (to) call the police.",
      "Sadəcə «yalnız» mənası üçün All I … quruluşu çox təbiidir."
    ],
    azTrap: "Azərbaycan dilində vurğu sözü feldən əvvəl qoymaqla («Açarları Leyla tapdı») verilir. İngiliscədə söz sırası sərt olduğu üçün bu yol işləmir; öyrənənlər isə cleft quruluşu yarımçıq qurur: What I need a holiday, It was Leyla found the keys.",
    examples: [
      { en: "What I really need is a good night's sleep.", az: "Mənə əslində lazım olan yaxşı bir gecə yuxusudur." },
      { en: "It was my grandfather who taught me to play backgammon.", az: "Mənə nərd oynamağı öyrədən babam olub." },
      { en: "All she wanted was a little respect.", az: "Onun istədiyi sadəcə bir az hörmət idi." },
      { en: "It's not the money that worries me — it's the time.", az: "Məni narahat edən pul deyil, vaxtdır." }
    ],
    wrong: [
      { bad: "What I need a coffee.", good: "What I need is a coffee.", why: "What-cleft-də is mütləq lazımdır." },
      { bad: "It was Ali broke the window.", good: "It was Ali who broke the window.", why: "It-cleft-də who/that buraxılmır (mübtəda olanda)." },
      { bad: "What we need are more time.", good: "What we need is more time.", why: "What-hissəsi tək sayılır." }
    ],
    exercise: [
      { q: "What I love about Sheki ___ the food.", a: ["is"], hint: "What-cleft" },
      { q: "It was in 2010 ___ we moved to Baku.", a: ["that", "when"], hint: "It-cleft" },
      { q: "Choose: ___ I want is to be left alone.", options: ["That", "All", "It"], a: ["All"], hint: "«Sadəcə istədiyim»" },
      { q: "Choose: It was the manager ___ made the final decision.", options: ["which", "who", "what"], a: ["who"], hint: "Şəxs" },
      { q: "What she did ___ to call her lawyer immediately.", a: ["was"], hint: "What … did was (to) V1" }
    ],
    rule_ids: ["cleft-is-missing"] },

  { id: "articles-advanced", level: "C1", group: "Artikllər və isimlər", title: "Articles: Advanced Uses", az: "Artikllər: ümumiləşdirmə, qurumlar, coğrafi adlar",
    when: "the və sıfır artiklın incə istifadəsi: bütöv növə ümumi istinad, qurumlar (school, hospital, prison) və coğrafi adlar üçün qaydalar.",
    form: ["Ümumi növ: Tigers are endangered. / The tiger is endangered. (elmi üslub)", "Qurum öz məqsədi ilə: go to school, be in hospital; bina kimi: go to the school", "the: okeanlar, dənizlər, çaylar, səhralar, dağ silsilələri, ölkə qrupları — the Caspian, the Kura, the Alps, the UK", "Artiklsız: tək dağlar, göllər, əksər ölkə və şəhərlər — Mount Shahdag, Lake Goygol, Azerbaijan"],
    rules: [
      "Ümumi danışıqda cəm isim artiklsız işlənir: Dogs are loyal (The dogs are loyal yox).",
      "Musiqi alətləri və ixtiralar ümumi mənada the ilə: play the tar, The smartphone changed our lives.",
      "school, university, prison, church, hospital — əsas məqsəd üçün artiklsız: He's in prison (məhkumdur).",
      "the + sifət sosial qrup bildirir: the rich, the elderly, the unemployed (cəm fel ilə)."
    ],
    azTrap: "Azərbaycan dilində artikl yoxdur, ona görə öyrənənlər ya the-ni tamamilə buraxır (Caspian Sea is…), ya da ümumiləşdirmədə artıq the qoyur (The people are afraid of the change). Coğrafi adlarda isə qayda məntiqlə deyil, növlə müəyyən olunur, bunu əzbərləmək lazımdır.",
    examples: [
      { en: "The Caspian Sea is the largest lake in the world.", az: "Xəzər dənizi dünyanın ən böyük gölüdür." },
      { en: "Children learn languages faster than adults.", az: "Uşaqlar dilləri böyüklərdən daha tez öyrənirlər." },
      { en: "My uncle has been in hospital since Monday.", az: "Əmim bazar ertəsindən bəri xəstəxanadadır." },
      { en: "The government promised to help the unemployed.", az: "Hökumət işsizlərə kömək edəcəyini vəd etdi." }
    ],
    wrong: [
      { bad: "The life is too short to worry.", good: "Life is too short to worry.", why: "Mücərrəd isim ümumi mənada artiklsız işlənir." },
      { bad: "We flew over Caucasus Mountains.", good: "We flew over the Caucasus Mountains.", why: "Dağ silsilələri the ilə işlənir." },
      { bad: "She goes to the church every Sunday to pray.", good: "She goes to church every Sunday to pray.", why: "Qurum əsas məqsədi ilə artiklsız işlənir." }
    ],
    exercise: [
      { q: "___ Kura is the longest river in the Caucasus. (the / —)", a: ["The"], hint: "Çay" },
      { q: "___ Lake Goygol is near Ganja. (the / —)", a: ["—", "-", ""], hint: "Lake + ad: artiklsız" },
      { q: "Choose: ___ are often more patient than young people.", options: ["The elderly", "Elderly", "The elderlies"], a: ["The elderly"], hint: "the + sifət" },
      { q: "Choose: My brother is studying at ___ university in Baku.", options: ["the", "a", "—"], a: ["a"], hint: "Hansısa bir universitet (konkret qurum)" },
      { q: "She plays ___ piano beautifully.", a: ["the"], hint: "Musiqi aləti" }
    ],
    rule_ids: ["article-missing", "article-generic", "article-geographic"] },

  { id: "subjunctive", level: "C1", group: "Budaq cümlələr", title: "The Subjunctive", az: "Subjunktiv (arzu-tələb forması): I suggest that he be…",
    when: "Rəsmi üslubda tələb, təklif, vaciblik bildirən fel və sifətlərdən sonra that-budaq cümləsində felin sadə forması (V1) işlənir; həmçinin sabit ifadələrdə və xəyali vəziyyətlərdə.",
    form: ["suggest / recommend / insist / demand / propose + that + mübtəda + V1", "It is essential / vital / important + that + mübtəda + V1", "İnkar: that he not be late", "Sabit ifadələr: God save the Queen; Be that as it may; If I were you"],
    rules: [
      "Bütün şəxslərdə felin sadə forması: that she go, that he be, that they be.",
      "he/she/it ilə -s artırılmır: I recommend that he see a doctor.",
      "British English-də should + V1 də işlənir: I suggest that he should apologize.",
      "Daha sadə üslubda başqa quruluş seçilir: I suggest he apologizes (danışıq)."
    ],
    azTrap: "Azərbaycan dilində «Təklif edirəm ki, o getsin» cümləsində əmr-arzu forması (-sın) var və öyrənənlər bunu ingiliscədə ya to-məsdərlə (I suggest him to go), ya da adi zamanla (that he goes) verir. Rəsmi yazıda düzgün forma that he go-dur.",
    examples: [
      { en: "The doctor recommended that she take a few days off.", az: "Həkim onun bir neçə gün istirahət etməsini tövsiyə etdi." },
      { en: "It is essential that every employee be informed.", az: "Hər bir işçinin məlumatlandırılması vacibdir." },
      { en: "They insisted that he not leave the building.", az: "Onlar onun binanı tərk etməməsində israr etdilər." },
      { en: "I propose that the meeting be postponed until Friday.", az: "Təklif edirəm ki, iclas cüməyə qədər təxirə salınsın." }
    ],
    wrong: [
      { bad: "I suggest him to apply for the job.", good: "I suggest that he apply for the job.", why: "suggest + şəxs + to-məsdər işlənmir." },
      { bad: "It is vital that she is present.", good: "It is vital that she be present.", why: "Rəsmi üslubda vaciblikdən sonra subjunktiv: be." },
      { bad: "The committee demanded that he resigns.", good: "The committee demanded that he resign.", why: "Subjunktivdə -s artırılmır." }
    ],
    exercise: [
      { q: "The teacher insisted that every student ___ (arrive) on time.", a: ["arrive"], hint: "V1, -s yoxdur" },
      { q: "It is important that he ___ (be) told the truth.", a: ["be"], hint: "be" },
      { q: "Choose: I recommend that she ___ a lawyer.", options: ["consults", "consult", "to consult"], a: ["consult"], hint: "Subjunktiv" },
      { q: "Choose: They requested that the music ___ turned down.", options: ["be", "is", "was"], a: ["be"], hint: "Məchul subjunktiv" },
      { q: "We asked that he ___ (not / smoke) in the office.", a: ["not smoke"], hint: "not + V1" }
    ],
    rule_ids: ["subjunctive", "suggest-pattern"] },

  { id: "hedging-formal-register", level: "C1", group: "Yazı və durğu", title: "Hedging & Formal Register", az: "Ehtiyatlı ifadə və rəsmi üslub",
    when: "Akademik və işgüzar yazıda iddianı yumşaltmaq, şəxsi tondan qaçmaq və danışıq ifadələrini rəsmi qarşılıqları ilə əvəz etmək üçün işlənir.",
    form: ["Modal fellər: may, might, could, would appear", "Fellər: seem, appear, tend to, suggest, indicate", "Zərflər: arguably, possibly, largely, to some extent", "Rəsmi fellər: get → obtain, find out → discover, go up → increase, think about → consider"],
    rules: [
      "Qəti iddialardan qaçın: This proves… əvəzinə This suggests…",
      "Rəsmi yazıda qısaltmalardan (don't, it's) və danışıq sözlərindən (a lot of, stuff, get) qaçın.",
      "Şəxssiz quruluşlar işlədin: It could be argued that…, There is evidence that…",
      "Frazal felləri tək sözlə əvəzləyin: put off → postpone, look into → investigate."
    ],
    azTrap: "Azərbaycan dilində rəsmi mətnlər çox vaxt kəskin və qəti ifadələrlə yazılır («Bu, sübut edir ki…», «Hamı bilir ki…»). İngilis akademik yazısında bu tərz qərəzli və qeyri-peşəkar görünür. Bundan başqa, öyrənənlər eyni mətndə danışıq sözlərini (a lot of, get) rəsmi sözlərlə qarışdırırlar.",
    examples: [
      { en: "The results suggest that the treatment may be effective.", az: "Nəticələr müalicənin effektiv ola biləcəyini göstərir." },
      { en: "It could be argued that the policy has largely failed.", az: "Siyasətin böyük ölçüdə uğursuz olduğunu iddia etmək olar." },
      { en: "Prices appear to have risen considerably over the past year.", az: "Qiymətlərin son bir ildə xeyli artdığı görünür." },
      { en: "Further research is required to confirm these findings.", az: "Bu nəticələri təsdiqləmək üçün əlavə araşdırma tələb olunur." }
    ],
    wrong: [
      { bad: "This proves that social media causes depression.", good: "This suggests that social media may contribute to depression.", why: "Akademik yazıda iddia ehtiyatla ifadə olunur." },
      { bad: "The company got a lot of profit last year.", good: "The company made a substantial profit last year.", why: "Rəsmi üslubda get və a lot of əvəzinə dəqiq sözlər seçilir." },
      { bad: "Everybody knows that the economy is getting worse.", good: "There is growing evidence that the economy is deteriorating.", why: "Ümumiləşdirici, sübutsuz iddialardan qaçılır." }
    ],
    exercise: [
      { q: "Rewrite formally: We need to look into the problem. → We need to ___ the problem.", a: ["investigate", "examine"], hint: "look into" },
      { q: "The data ___ (seem / indicate) that sales are falling.", a: ["seem to indicate", "seems to indicate"], hint: "seem + to V1" },
      { q: "Choose the most academic option: ___ the new law has reduced crime.", options: ["Everyone knows", "It appears that", "It's obvious that"], a: ["It appears that"], hint: "Ehtiyatlı ifadə" },
      { q: "Choose the formal verb: The meeting has been ___ until next week.", options: ["put off", "postponed", "pushed back"], a: ["postponed"], hint: "Tək söz" },
      { q: "Rewrite formally: Prices went up. → Prices ___.", a: ["increased", "rose"], hint: "go up" }
    ],
    rule_ids: ["register-informal", "hedging"] },

  { id: "punctuation-comma-splice", level: "C1", group: "Yazı və durğu", title: "Punctuation: Comma Splices & Run-ons", az: "Durğu işarələri: vergüllə birləşdirmə və axıcı cümlə səhvləri",
    when: "İki tam cümləni düzgün birləşdirmək üçün: ingilis yazısında yalnız vergüllə iki müstəqil cümləni birləşdirmək (comma splice) səhv sayılır.",
    form: ["Nöqtə: It was late. We went home.", "Nöqtəli vergül: It was late; we went home.", "Vergül + bağlayıcı (and, but, so, or, yet): It was late, so we went home.", "Budaq cümlə: Because it was late, we went home."],
    rules: [
      "İki müstəqil cümlə arasında tək vergül kifayət deyil (comma splice).",
      "Heç bir durğu işarəsi olmadan birləşdirilmiş cümlələr «run-on» səhvidir.",
      "however, therefore, moreover kimi zərflərdən əvvəl nöqtə və ya nöqtəli vergül, sonra vergül qoyulur.",
      "Budaq cümlə əvvəl gəlirsə, ondan sonra vergül qoyulur; sonda gəlirsə, adətən vergül qoyulmur: We went home because it was late."
    ],
    azTrap: "Azərbaycan dilində mürəkkəb cümlələr vergüllə sərbəst birləşdirilir («Hava soyuq idi, biz evə getdik») və bu düzgündür. Bu qayda ingiliscəyə köçürüləndə comma splice yaranır. Həmçinin Azərbaycan dilində «ki» bağlayıcısından əvvəl vergül qoyulur, öyrənənlər isə ingiliscədə that-dan əvvəl vergül qoyur: He said, that he was busy.",
    examples: [
      { en: "The museum was closed, so we went to a café instead.", az: "Muzey bağlı idi, ona görə də əvəzində kafeyə getdik." },
      { en: "I studied all night; however, I still failed the test.", az: "Bütün gecə oxudum, buna baxmayaraq, yenə də imtahandan kəsildim." },
      { en: "When the guests arrived, dinner was ready.", az: "Qonaqlar gələndə şam yeməyi hazır idi." },
      { en: "She said that she would call me later.", az: "O dedi ki, sonra mənə zəng edəcək." }
    ],
    wrong: [
      { bad: "It was raining, we stayed at home.", good: "It was raining, so we stayed at home.", why: "İki tam cümləni yalnız vergüllə birləşdirmək olmaz (comma splice)." },
      { bad: "I love Baku it is a beautiful city.", good: "I love Baku. It is a beautiful city.", why: "Run-on: iki cümlə arasında durğu işarəsi lazımdır." },
      { bad: "He told me, that he was tired.", good: "He told me that he was tired.", why: "İngiliscədə that-dan əvvəl vergül qoyulmur." }
    ],
    exercise: [
      { q: "Choose the correct sentence:", options: ["I was tired, I went to bed.", "I was tired, so I went to bed.", "I was tired so, I went to bed."], a: ["I was tired, so I went to bed."], hint: "Vergül + bağlayıcı" },
      { q: "Choose the correct sentence:", options: ["The price is high; however, the quality is excellent.", "The price is high, however the quality is excellent.", "The price is high however, the quality is excellent."], a: ["The price is high; however, the quality is excellent."], hint: "; however," },
      { q: "Choose the correct sentence:", options: ["I think, that you are right.", "I think that you are right.", "I think that, you are right."], a: ["I think that you are right."], hint: "that-dan əvvəl vergül yoxdur" },
      { q: "Fix the comma splice with one word: My phone died, ___ I couldn't call you.", a: ["so"], hint: "Nəticə bağlayıcısı" },
      { q: "Which punctuation mark joins these: We missed the bus___ we took a taxi. (; or ,)", a: [";"], hint: "Bağlayıcı yoxdur" }
    ],
    rule_ids: ["comma-splice", "comma-before-that"] },

  { id: "false-friends", level: "C1", group: "Yazı və durğu", title: "False Friends", az: "Yalançı dostlar: actual, eventually, sympathetic, accurate, magazine, fabric",
    when: "Azərbaycan və rus dillərindəki sözlərə bənzəyən, amma fərqli mənalı ingilis sözləri; düzgün seçilməsə, cümlənin mənası tamamilə dəyişir.",
    form: ["actual = həqiqi, faktiki (aktual yox → current, relevant)", "eventually = nəhayət, sonda (ehtimal ki yox → possibly)", "sympathetic = rəğbətli, anlayışlı (simpatik yox → nice, attractive); accurate = dəqiq (səliqəli yox → neat, tidy)", "magazine = jurnal (mağaza yox → shop, store); fabric = parça (fabrik yox → factory)"],
    rules: [
      "«Aktual məsələ» = a current / topical / pressing issue, an actual issue yox.",
      "«Simpatik oğlan» = a nice / good-looking guy; sympathetic = başqasının dərdinə şərik olan.",
      "«Akkurat, səliqəli adam» = a neat / tidy person; accurate = səhvsiz, dəqiq (məlumat, ölçü).",
      "Digər yalançı dostlar: conductor (dirijor/bilet satan, kondisioner yox), decade (on il, dekada yox), intelligent (ağıllı, ziyalı yox), cabinet (şkaf və ya nazirlər kabineti, iş otağı yox), artist (rəssam, aktyor yox)."
    ],
    azTrap: "Azərbaycan dilinə bir çox söz rus dili vasitəsilə keçib (aktual, simpatik, akkurat, magazin, fabrik, kabinet) və ingilis dilində oxşar formalı sözlər olduğu üçün öyrənənlər onları eyni mənada işlədir. Nəticədə «Aktual problem» actual problem, «Magazinə getdim» I went to the magazine kimi çevrilir.",
    examples: [
      { en: "Climate change is a pressing issue today.", az: "İqlim dəyişikliyi bu gün aktual məsələdir." },
      { en: "The actual cost was much higher than the estimate.", az: "Faktiki xərc təxmini xərcdən xeyli yüksək oldu." },
      { en: "After many attempts, she eventually passed her driving test.", az: "Çoxsaylı cəhdlərdən sonra o, nəhayət sürücülük imtahanından keçdi." },
      { en: "My aunt works at a textile factory, and she can tell any fabric by touch.", az: "Bibim toxuculuq fabrikində işləyir və istənilən parçanı toxunuşdan tanıyır." }
    ],
    wrong: [
      { bad: "This topic is very actual nowadays.", good: "This topic is very relevant nowadays.", why: "actual «faktiki» deməkdir; «aktual» = relevant, current, topical." },
      { bad: "I'll eventually come to the party, but I'm not sure.", good: "I'll possibly come to the party, but I'm not sure.", why: "eventually «nəhayət, sonda» deməkdir, «bəlkə» yox." },
      { bad: "He is a very sympathetic guy — all the girls like him.", good: "He is a really nice guy — all the girls like him.", why: "sympathetic «rəğbət bəsləyən» deməkdir; «simpatik» = nice, attractive." }
    ],
    exercise: [
      { q: "I bought some bread at the ___ near my house. (magazine / shop)", a: ["shop", "store"], hint: "Mağaza" },
      { q: "She is a very ___ person — her desk is always tidy. (accurate / neat)", a: ["neat"], hint: "Səliqəli" },
      { q: "Choose: The doctor was very ___ and listened to all my worries.", options: ["sympathetic", "symphatic", "simpatic"], a: ["sympathetic"], hint: "Anlayışlı" },
      { q: "Choose: My father worked at a car ___ for 20 years.", options: ["fabric", "factory", "fabrique"], a: ["factory"], hint: "Zavod, fabrik" },
      { q: "Choose: The weather forecast was not very ___ — it rained all day.", options: ["actual", "accurate", "eventual"], a: ["accurate"], hint: "Dəqiq" }
    ],
    rule_ids: ["false-friends"] },

  { id: "az-calques", level: "C1", group: "Yazı və durğu", title: "Calques: Common Errors of Azerbaijani Speakers", az: "Kalkalar: Azərbaycan dilindən hərfi tərcümə səhvləri",
    when: "Ana dilindəki ifadəni sözbəsöz ingiliscəyə çevirəndə yaranan səhvlər; qrammatik baxımdan «məntiqli» görünsə də, ingilis dilində qeyri-təbii və ya səhvdir.",
    form: ["«Razıyam» → I agree (I am agree yox)", "«Mənə izah et» → Explain it to me (Explain me yox)", "«Fikrimcə» → In my opinion / I think (By my opinion yox)", "«Neçə yaşın var?» → How old are you? (How many years do you have? yox)"],
    rules: [
      "agree feldir, be ilə işlənmir: I agree / I don't agree.",
      "Bəzi Azərbaycan fellərinə ingiliscədə be + sifət uyğun gəlir: «ac olmaq» = be hungry, «gecikmək» = be late, «qorxmaq» = be afraid.",
      "Yaş, ölçü, hava kimi mövzularda ingiliscə öz sabit quruluşunu işlədir: It's cold (Is cold yox), I'm 25 (I have 25 years yox).",
      "«Ev tapşırığı vermək», «dərs keçmək» kimi birləşmələr birbaşa çevrilmir: set homework, teach a lesson."
    ],
    azTrap: "Azərbaycan dilində mübtəda tez-tez buraxılır («Soyuqdur», «Yağış yağır») və fel «etmək» ilə düzəlir (müzakirə etmək, zəng etmək). Bu quruluşlar ingiliscəyə köçürüləndə mübtədasız cümlələr (Is very cold today), artıq ön sözlər (call to him) və uyğunsuz birləşmələr (I am agree) yaranır.",
    examples: [
      { en: "I completely agree with you.", az: "Səninlə tamamilə razıyam." },
      { en: "Could you explain this rule to me?", az: "Bu qaydanı mənə izah edə bilərsən?" },
      { en: "It's very hot today, so let's stay inside.", az: "Bu gün çox istidir, gəl içəridə qalaq." },
      { en: "In my opinion, the film was too long.", az: "Fikrimcə, film çox uzun idi." }
    ],
    wrong: [
      { bad: "I am agree with your idea.", good: "I agree with your idea.", why: "agree feldir; be ilə işlənmir." },
      { bad: "Is very cold today.", good: "It is very cold today.", why: "İngiliscədə mübtəda mütləqdir; hava üçün it işlənir." },
      { bad: "I will call to you tomorrow.", good: "I will call you tomorrow.", why: "call birbaşa tamamlıq qəbul edir, to işlənmir." }
    ],
    exercise: [
      { q: "Choose: ___ with you completely.", options: ["I am agree", "I agree", "I agreed am"], a: ["I agree"], hint: "agree feldir" },
      { q: "Choose: Can you explain ___?", options: ["me the problem", "the problem to me", "to me the problem to"], a: ["the problem to me"], hint: "explain sth to sb" },
      { q: "___ raining again. (Yenə yağış yağır.)", a: ["It's", "It is"], hint: "Mübtəda lazımdır" },
      { q: "Choose: ___ my opinion, the plan won't work.", options: ["By", "In", "On"], a: ["In"], hint: "Sabit ifadə" },
      { q: "My sister ___ 19 years old. (Bacımın 19 yaşı var.)", a: ["is"], hint: "Yaş be ilə" }
    ],
    rule_ids: ["am-agree", "missing-subject", "explain-to", "call-to"] }
);
