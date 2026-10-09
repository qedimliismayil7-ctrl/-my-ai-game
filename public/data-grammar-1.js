/* Nuanza — English grammar course (A1, A2, B1), original Nuanza content. */
window.NUANZA_GRAMMAR = window.NUANZA_GRAMMAR || { units: [] };
window.NUANZA_GRAMMAR.units.push(

  /* ===================== A1 ===================== */

  { id: "to-be", level: "A1", group: "Zamanlar", title: "The verb to be (am / is / are)", az: "«Olmaq» feli: am / is / are",
    when: "Kim, nə, harada, necə olduğunu deyəndə işlənir: ad, yaş, peşə, yer, hal-vəziyyət. İngilis cümləsində fel mütləq olmalıdır, ona görə «-dır/-dir» mənası be ilə verilir.",
    form: ["I am (I'm)", "he/she/it is (he's, she's, it's)", "you/we/they are (you're, we're, they're)", "Are you ready? — Is he at home?", "I'm not tired — She isn't late — They aren't here"],
    rules: [
      "I ilə am, he/she/it və tək isimlə is, you/we/they və cəm isimlə are işlənir.",
      "İnkar üçün be-dən sonra not gəlir: I am not, he is not (isn't), they are not (aren't).",
      "Sualda be mübtədadan əvvələ keçir: You are tired → Are you tired?",
      "Yaş, ac/susuz olmaq, qorxmaq be ilə deyilir: I am 20, I am hungry, I am afraid."
    ],
    azTrap: "Azərbaycan dilində «Mən tələbəyəm», «O evdədir» cümlələrində ayrıca fel yoxdur, şəkilçi kifayətdir. Buna görə öyrənənlər «I student», «She at home» yazır. Bundan əlavə, «Mənim 20 yaşım var» təsiri ilə «I have 20 years» deyilir; ingiliscə yaş be ilə verilir.",
    examples: [
      { en: "I am a student.", az: "Mən tələbəyəm." },
      { en: "My sister is at work now.", az: "Bacım indi işdədir." },
      { en: "Are you cold? — No, I'm not.", az: "Üşüyürsən? — Xeyr." },
      { en: "We are twenty years old.", az: "Bizim iyirmi yaşımız var." }
    ],
    wrong: [
      { bad: "She at home.", good: "She is at home.", why: "İngilis cümləsində fel olmalıdır; «-dır» mənasını is verir." },
      { bad: "I have 25 years.", good: "I am 25 (years old).", why: "Yaş have ilə yox, be ilə deyilir." },
      { bad: "They is my friends.", good: "They are my friends.", why: "they ilə are işlənir." }
    ],
    exercise: [
      { q: "My father ___ a doctor.", a: ["is"], hint: "he/she/it → is" },
      { q: "We ___ from Azerbaijan.", a: ["are"], hint: "we → are" },
      { q: "I ___ not hungry.", a: ["am"], hint: "I → am" },
      { q: "___ your brother at school?", options: ["Is", "Are", "Am"], a: ["Is"], hint: "Sual: be mübtədadan əvvəl" },
      { q: "Choose the correct sentence.", options: ["I am 18 years old.", "I have 18 years.", "I 18 years old."], a: ["I am 18 years old."], hint: "Yaş → be" }
    ],
    rule_ids: ["be-missing", "be-agree", "age-have"] },

  { id: "pronouns-he-she-it", level: "A1", group: "Əvəzliklər", title: "Subject and object pronouns (he / she / it)", az: "Şəxs əvəzlikləri: he, she, it və «o»",
    when: "İnsanı və ya əşyanı yenidən adını çəkmədən göstərmək üçün işlənir. Azərbaycan dilindəki «o» ingilis dilində üç sözə ayrılır: he (kişi), she (qadın), it (əşya, heyvan, hadisə).",
    form: ["Subject: I, you, he, she, it, we, they", "Object: me, you, him, her, it, us, them", "He likes her. — She likes him.", "It is cold. (hava, vaxt, məsafə)"],
    rules: [
      "Kişi üçün he/him, qadın üçün she/her, əşya və heyvan üçün it işlənir.",
      "Feldən əvvəl mübtəda forması (he, she), feldən və ön sözdən sonra obyekt forması (him, her) gəlir.",
      "Hava, vaxt, məsafə haqqında cümlələrdə mübtəda kimi it lazımdır: It is raining. It is five o'clock.",
      "Mübtəda buraxılmır: «Is very nice» yox, «It is very nice»."
    ],
    azTrap: "Azərbaycan dilində «o» cinsə görə dəyişmir, ona görə danışanlar qadın haqqında he, kişi haqqında she deyir və ya hekayənin ortasında qarışdırır. Həm də dilimizdə mübtəda tez-tez buraxılır («Gəldi», «Soyuqdur»), ingilis dilində isə he/she/it mütləq yazılmalıdır.",
    examples: [
      { en: "This is my aunt. She is a teacher.", az: "Bu mənim xalamdır. O, müəllimdir." },
      { en: "I called Rashad, but he didn't answer.", az: "Rəşada zəng etdim, amma o cavab vermədi." },
      { en: "Where is my phone? I can't find it.", az: "Telefonum haradadır? Onu tapa bilmirəm." },
      { en: "It is very hot today.", az: "Bu gün çox istidir." }
    ],
    wrong: [
      { bad: "My mother is a nurse. He works at night.", good: "My mother is a nurse. She works at night.", why: "Qadın haqqında she işlənir." },
      { bad: "Is very cold outside.", good: "It is very cold outside.", why: "Hava haqqında cümlədə mübtəda it buraxılmır." },
      { bad: "I saw he yesterday.", good: "I saw him yesterday.", why: "Feldən sonra obyekt forması (him) gəlir." }
    ],
    exercise: [
      { q: "Leyla is my cousin. ___ lives in Sumgait.", a: ["She"], hint: "Qadın → she" },
      { q: "I like this book. ___ is very interesting.", a: ["It"], hint: "Əşya → it" },
      { q: "Can you help ___? (Murad)", a: ["him"], hint: "Feldən sonra → him" },
      { q: "___ is raining again.", options: ["He", "It", "This"], a: ["It"], hint: "Hava → it" },
      { q: "My grandfather is 80, but ___ still works in the garden.", options: ["she", "he", "it"], a: ["he"], hint: "Kişi → he" }
    ],
    rule_ids: ["pronoun-gender", "missing-subject", "pronoun-case"] },

  { id: "possessives", level: "A1", group: "Əvəzliklər", title: "Possessives: my, your, 's", az: "Yiyəlik: my, your, 's",
    when: "Bir şeyin kimə aid olduğunu göstərmək üçün işlənir. Azərbaycan dilindəki «-ım, -ın, -ı» şəkilçilərinin yerinə ingilis dilində isimdən əvvəl ayrıca söz gəlir.",
    form: ["my, your, his, her, its, our, their + noun", "mine, yours, his, hers, ours, theirs (isimsiz)", "Ali's car — my parents' house", "Whose bag is this? — It's mine."],
    rules: [
      "Yiyəlik sözü həmişə isimdən əvvəl gəlir: my book, their house.",
      "İnsan və heyvan üçün 's işlənir: Nigar's phone, the dog's bed. -s ilə bitən cəmdə yalnız apostrof qoyulur: my parents' car.",
      "its (onun — əşya) ilə it's (it is) fərqlidir.",
      "İsim olmayanda mine, yours, hers işlənir: This pen is mine."
    ],
    azTrap: "Azərbaycan dilində «onun» cinsə görə dəyişmədiyi üçün his/her qarışdırılır: qadın haqqında «his husband» deyilir. Bundan başqa, «Əlinin maşını» quruluşu birbaşa «car of Ali» kimi çevrilir; insanlar üçün təbii forma Ali's car-dır.",
    examples: [
      { en: "This is my brother's room.", az: "Bu qardaşımın otağıdır." },
      { en: "Aysel and her husband live in Baku.", az: "Aysel və əri Bakıda yaşayırlar." },
      { en: "Is this your umbrella? — No, it's hers.", az: "Bu sənin çətirindir? — Xeyr, onunkudur." },
      { en: "The cat is eating its food.", az: "Pişik yeməyini yeyir." }
    ],
    wrong: [
      { bad: "Sevda loves his job.", good: "Sevda loves her job.", why: "Sahib qadındırsa her işlənir." },
      { bad: "the car of my father", good: "my father's car", why: "İnsana aid olanda 's daha təbiidir." },
      { bad: "The company changed it's name.", good: "The company changed its name.", why: "its — yiyəlik, it's — it is." }
    ],
    exercise: [
      { q: "Kamran is visiting ___ grandmother.", a: ["his"], hint: "Kamran — kişi" },
      { q: "This is ___ (Elvin) laptop.", a: ["Elvin's"], hint: "İnsan + 's" },
      { q: "We love ___ new apartment.", a: ["our"], hint: "we → our" },
      { q: "That bag isn't mine. It's ___.", options: ["her", "hers", "she"], a: ["hers"], hint: "İsimsiz → hers" },
      { q: "The tree lost ___ leaves.", options: ["it's", "its", "his"], a: ["its"], hint: "Əşya yiyəliyi → its" }
    ],
    rule_ids: ["his-her", "its-its", "possessive-s"] },

  { id: "plurals", level: "A1", group: "Artikllər və isimlər", title: "Plural nouns", az: "İsimlərin cəmi",
    when: "Birdən çox şeydən danışanda isim cəm formaya düşür. Azərbaycan dilindən fərqli olaraq say ilə də cəm forması işlənir: two books.",
    form: ["book → books, bus → buses, box → boxes", "city → cities, day → days", "knife → knives, leaf → leaves", "man → men, woman → women, child → children, person → people, foot → feet, tooth → teeth"],
    rules: [
      "Adətən -s artırılır; -s, -sh, -ch, -x, -o ilə bitənlərə -es: buses, dishes, potatoes.",
      "Samitdən sonra gələn -y → -ies (city → cities), saitdən sonra isə sadəcə -s (day → days).",
      "Bəzi isimlər qaydasızdır: men, women, children, people, feet, teeth, mice.",
      "Saydan (two, three, many) sonra isim mütləq cəm olur: three apples, many people."
    ],
    azTrap: "Azərbaycan dilində saydan sonra isim tək qalır: «üç kitab», «çox adam». Bu vərdişlə «three book», «many student» yazılır. İngilis dilində say birdən çoxdursa isim -s alır. Həm də people artıq cəmdir, «peoples» adi mənada deyilmir.",
    examples: [
      { en: "I have two sisters.", az: "Mənim iki bacım var." },
      { en: "There are many children in the park.", az: "Parkda çoxlu uşaq var." },
      { en: "These boxes are heavy.", az: "Bu qutular ağırdır." },
      { en: "Three people are waiting outside.", az: "Çöldə üç nəfər gözləyir." }
    ],
    wrong: [
      { bad: "I bought five apple.", good: "I bought five apples.", why: "Saydan sonra isim cəm olur." },
      { bad: "There are many peoples here.", good: "There are many people here.", why: "people artıq cəm formadır." },
      { bad: "Two childs are playing.", good: "Two children are playing.", why: "child qaydasızdır: children." }
    ],
    exercise: [
      { q: "one city → two ___", a: ["cities"], hint: "samit + y → -ies" },
      { q: "one woman → three ___", a: ["women"], hint: "Qaydasız" },
      { q: "one dish → four ___", a: ["dishes"], hint: "-sh → -es" },
      { q: "I need two ___.", options: ["ticket", "tickets", "ticketes"], a: ["tickets"], hint: "Saydan sonra cəm" },
      { q: "My ___ hurt after the long walk.", options: ["foots", "feet", "feets"], a: ["feet"], hint: "foot → feet" }
    ],
    rule_ids: ["plural-after-number", "irregular-plural", "people-plural"] },

  { id: "articles-a-an-the", level: "A1", group: "Artikllər və isimlər", title: "Articles: a / an / the / no article", az: "Artikllər: a, an, the və artiklsiz isim",
    when: "Hər tək sayılan isimdən əvvəl artikl (və ya my, this kimi söz) lazımdır. a/an — «hər hansı bir», the — «hər ikimizin bildiyi o konkret», artiklsiz forma isə ümumi mənada cəm və sayılmayan isimlər üçündür. Azərbaycan dilində artikl olmadığı üçün bu mövzu ən çətin mövzulardandır.",
    form: ["a + samit səsi: a book, a university", "an + sait səsi: an apple, an hour", "the + konkret/məlum: the book on the table", "Ø + ümumi cəm/sayılmayan: I like cats. Water is important."],
    rules: [
      "a/an yalnız tək sayılan isimlə işlənir: a car (✓), a water (✗).",
      "a/an seçimi hərfə yox, səsə görədir: an hour (h oxunmur), a university (ju- səsi).",
      "Bir şeyi ilk dəfə deyəndə a/an, ikinci dəfə the: I saw a dog. The dog was black.",
      "Tək olan və ya hamının bildiyi şeylər the alır: the sun, the sky, the capital, the door (bu otağın qapısı).",
      "Ümumi mənada danışanda cəm və sayılmayan isimlər artiklsiz olur: Dogs are friendly. Money isn't everything.",
      "Peşə a/an ilə deyilir: She is a doctor. Ən üstün dərəcə the ilə: the best.",
      "Yemək, idman, dil adları, at home/at work/by bus kimi ifadələr artiklsizdir: have breakfast, play football, speak English."
    ],
    azTrap: "Azərbaycan dilində artikl yoxdur, «bir» sözü də çox vaxt buraxılır: «Mən həkiməm», «Maşın aldım». Buna görə «I am doctor», «I bought car» yazılır. Əks tərəfdən, «Həyat çətindir» kimi ümumi fikirlər «The life is hard» kimi çevrilir. Yadda saxlayın: tək sayılan isim heç vaxt tək-tənha qalmır, ümumi fikirdə isə the lazım deyil.",
    examples: [
      { en: "My father is an engineer.", az: "Atam mühəndisdir." },
      { en: "I bought a new phone. The phone was expensive.", az: "Yeni telefon aldım. Telefon baha idi." },
      { en: "Can you close the window, please?", az: "Zəhmət olmasa, pəncərəni bağlaya bilərsən?" },
      { en: "Life is short, and time is money.", az: "Həyat qısadır, vaxt isə puldur." }
    ],
    wrong: [
      { bad: "She is teacher.", good: "She is a teacher.", why: "Tək sayılan isim (peşə) a/an tələb edir." },
      { bad: "The life is beautiful.", good: "Life is beautiful.", why: "Ümumi mənada sayılmayan isim artiklsiz olur." },
      { bad: "I waited for a hour.", good: "I waited for an hour.", why: "hour sait səsi ilə başlayır (h oxunmur), ona görə an." }
    ],
    exercise: [
      { q: "I eat ___ apple every day.", a: ["an"], hint: "Sait səsi → an" },
      { q: "She works at ___ university.", options: ["a", "an", "the"], a: ["a"], hint: "university «ju» səsi ilə başlayır" },
      { q: "Look at ___ moon! It's beautiful tonight.", a: ["the"], hint: "Tək olan şey → the" },
      { q: "Choose the correct sentence.", options: ["I like the music.", "I like music.", "I like a music."], a: ["I like music."], hint: "Ümumi məna → artiklsiz" },
      { q: "I have a cat and a dog. ___ cat is white.", a: ["The"], hint: "İkinci dəfə deyilir → the" }
    ],
    rule_ids: ["article-missing", "a-an", "article-generic", "article-profession"] },

  { id: "there-is-are", level: "A1", group: "Artikllər və isimlər", title: "There is / There are", az: "There is / There are — «var»",
    when: "Bir yerdə nəyinsə olub-olmadığını, mövcudluğunu bildirmək üçün işlənir. Azərbaycan dilindəki «var / yoxdur» mənasıdır.",
    form: ["There is + tək/sayılmayan isim: There is a bank near here.", "There are + cəm isim: There are two banks.", "Is there a lift? — Are there any shops?", "There isn't any milk. — There aren't any chairs."],
    rules: [
      "Yeni məlumat verəndə cümlə There is/are ilə başlayır, yer sonda gəlir: There is a cat in the garden.",
      "Ardınca gələn ilk isim tək və ya sayılmayandırsa is, cəmdirsə are işlənir.",
      "Keçmişdə there was / there were, gələcəkdə there will be deyilir.",
      "«Var» mənasında yer üçün have işlənmir: «In Baku have many parks» səhvdir."
    ],
    azTrap: "Azərbaycan dilində «Otaqda bir stol var» deyilir və «var» sona gəlir, ona görə «In the room is a table» və ya «In the room have a table» yazılır. Həmçinin «Mənim maşınım var» (have) ilə «Burada maşın var» (there is) qarışdırılır.",
    examples: [
      { en: "There is a pharmacy on the corner.", az: "Tində aptek var." },
      { en: "There are thirty students in our class.", az: "Sinfimizdə otuz şagird var." },
      { en: "Is there a bus to the airport?", az: "Hava limanına avtobus var?" },
      { en: "There wasn't any bread at home.", az: "Evdə çörək yox idi." }
    ],
    wrong: [
      { bad: "In my city have a big park.", good: "There is a big park in my city.", why: "Yerdə nəyinsə olması there is ilə deyilir." },
      { bad: "There is many cars on the road.", good: "There are many cars on the road.", why: "Cəm isimlə there are işlənir." },
      { bad: "Is a hotel near here?", good: "Is there a hotel near here?", why: "Sualda there buraxılmır: Is there...?" }
    ],
    exercise: [
      { q: "There ___ a lot of water on the floor.", a: ["is"], hint: "water sayılmır → is" },
      { q: "There ___ three bedrooms in the apartment.", a: ["are"], hint: "Cəm → are" },
      { q: "___ there a supermarket near your house?", a: ["Is"], hint: "Tək isim → Is" },
      { q: "Choose the correct sentence.", options: ["In the fridge have eggs.", "There are eggs in the fridge.", "Eggs are there in fridge."], a: ["There are eggs in the fridge."], hint: "there are + yer" },
      { q: "Yesterday there ___ a storm.", options: ["is", "was", "were"], a: ["was"], hint: "Keçmiş, tək" }
    ],
    rule_ids: ["there-is-are", "have-existence"] },

  { id: "present-simple", level: "A1", group: "Zamanlar", title: "Present Simple", az: "İndiki sadə zaman",
    when: "Vərdişləri, müntəzəm hərəkətləri, ümumi həqiqətləri və daimi vəziyyətləri bildirir: işim, yaşadığım yer, hər gün etdiyim şeylər.",
    form: ["I/you/we/they work", "he/she/it works", "Do you work? — Does she work?", "I don't work — She doesn't work"],
    rules: [
      "he/she/it ilə felə -s/-es artırılır: works, watches, goes; have → has.",
      "Sual və inkar do/does ilə qurulur; does işlənəndə əsas fel -s almır: Does she work? (works yox).",
      "Tez-tez always, usually, every day, on Mondays kimi sözlərlə işlənir.",
      "Ümumi həqiqətlər üçün: Water boils at 100 degrees."
    ],
    azTrap: "Azərbaycan dilində «işləyirəm» həm indi, həm də ümumiyyətlə mənasını verir, ona görə vərdiş üçün də «I am working every day» deyilir. Ən çox yayılmış səhv isə he/she ilə -s-in unudulmasıdır, çünki dilimizdə III şəxs təkdə fel ayrıca şəkilçi almır («o işləyir»).",
    examples: [
      { en: "She works in a bank.", az: "O, bankda işləyir." },
      { en: "We usually have dinner at seven.", az: "Biz adətən saat yeddidə şam edirik." },
      { en: "Does your brother speak English?", az: "Qardaşın ingiliscə danışır?" },
      { en: "My parents don't drink coffee.", az: "Valideynlərim qəhvə içmir." }
    ],
    wrong: [
      { bad: "She work in a bank.", good: "She works in a bank.", why: "he/she/it ilə felə -s artırılır." },
      { bad: "Does he likes football?", good: "Does he like football?", why: "does işlənəndə əsas fel -s almır." },
      { bad: "I am going to school every day.", good: "I go to school every day.", why: "Hər gün olan vərdiş Present Simple ilə deyilir." }
    ],
    exercise: [
      { q: "My brother ___ (live) in Ganja.", a: ["lives"], hint: "he/she/it → -s" },
      { q: "She ___ (watch) TV every evening.", a: ["watches"], hint: "-ch → -es" },
      { q: "___ you like tea?", a: ["Do"], hint: "you → Do" },
      { q: "He ___ eat meat.", options: ["don't", "doesn't", "isn't"], a: ["doesn't"], hint: "he → doesn't" },
      { q: "Choose the correct question.", options: ["Does she speaks Russian?", "Does she speak Russian?", "Do she speak Russian?"], a: ["Does she speak Russian?"], hint: "does + əsas fel" }
    ],
    rule_ids: ["third-person-s", "do-does-base", "habit-tense"] },

  { id: "adverbs-of-frequency", level: "A1", group: "Sifət və zərf", title: "Adverbs of frequency", az: "Tezlik zərfləri: always, usually, never",
    when: "Bir hərəkətin nə qədər tez-tez olduğunu bildirir. Ən çox Present Simple ilə işlənir.",
    form: ["always 100% — usually — often — sometimes — rarely — never 0%", "əsas feldən əvvəl: I often walk.", "be-dən sonra: She is always late.", "How often do you...? — once a week, every day"],
    rules: [
      "Tezlik zərfi əsas feldən əvvəl gəlir: I usually get up at seven.",
      "be felindən (am/is/are) sonra gəlir: He is never hungry in the morning.",
      "never özü inkardır, ona not artırılmır: I never smoke.",
      "every day, once a week kimi ifadələr adətən cümlənin sonunda olur."
    ],
    azTrap: "Azərbaycan dilində söz sırası sərbəstdir və «Mən heç vaxt siqaret çəkmirəm» cümləsində iki inkar var. Bu təsirlə «I don't never smoke» (ikiqat inkar) və ya «I go always» yazılır. İngilis dilində never tək işlənir, zərf isə feldən əvvəl durur.",
    examples: [
      { en: "I always brush my teeth before bed.", az: "Yatmazdan əvvəl həmişə dişlərimi fırçalayıram." },
      { en: "She is often tired on Fridays.", az: "O, cümə günləri tez-tez yorğun olur." },
      { en: "We sometimes eat out.", az: "Biz bəzən çöldə yemək yeyirik." },
      { en: "My grandmother never uses a computer.", az: "Nənəm heç vaxt kompüterdən istifadə etmir." }
    ],
    wrong: [
      { bad: "I go always to the gym.", good: "I always go to the gym.", why: "Tezlik zərfi əsas feldən əvvəl gəlir." },
      { bad: "He doesn't never call me.", good: "He never calls me.", why: "never özü inkardır; ikiqat inkar olmaz." },
      { bad: "She always is busy.", good: "She is always busy.", why: "be felindən sonra gəlir." }
    ],
    exercise: [
      { q: "Put in order: (usually / I / walk) to work.", a: ["I usually walk"], hint: "Mübtəda + zərf + fel" },
      { q: "Put in order: (late / never / is / he).", a: ["He is never late", "He is never late."], hint: "be + zərf" },
      { q: "Choose the correct sentence.", options: ["I don't never drink cola.", "I never drink cola.", "I drink never cola."], a: ["I never drink cola."], hint: "never = inkar" },
      { q: "We ___ go to the cinema — maybe once a month.", options: ["always", "sometimes", "never"], a: ["sometimes"], hint: "Ayda bir dəfə" },
      { q: "___ often do you visit your parents?", a: ["How"], hint: "Tezlik sualı" }
    ],
    rule_ids: ["adverb-position", "double-negative"] },

  { id: "present-continuous", level: "A1", group: "Zamanlar", title: "Present Continuous", az: "İndiki davamlı zaman",
    when: "Danışdığımız anda və ya bu günlərdə davam edən müvəqqəti hərəkəti bildirir.",
    form: ["I am working", "he/she/it is working", "you/we/they are working", "Are you working? — I'm not working"],
    rules: [
      "Quruluş: am/is/are + fel + -ing. be heç vaxt buraxılmır.",
      "-ing yazılışı: make → making, sit → sitting, lie → lying.",
      "now, at the moment, today, this week, Look! Listen! kimi sözlərlə işlənir.",
      "Vəziyyət felləri (know, like, want, need, understand, believe) adətən davamlı formada işlənmir."
    ],
    azTrap: "Azərbaycan dilində «-ır» şəkilçisi həm vərdiş, həm də indiki an üçün işlənir, ona görə iki zaman qarışdırılır. Həm də be köməkçi feli unudulur: «I working now». «Başa düşürəm», «istəyirəm» kimi fellər isə «I am understanding», «I am wanting» kimi səhv çevrilir.",
    examples: [
      { en: "I am reading an interesting book at the moment.", az: "Hazırda maraqlı bir kitab oxuyuram." },
      { en: "Look! It's snowing.", az: "Bax! Qar yağır." },
      { en: "They aren't working this week.", az: "Onlar bu həftə işləmirlər." },
      { en: "What are you doing?", az: "Nə edirsən?" }
    ],
    wrong: [
      { bad: "She cooking now.", good: "She is cooking now.", why: "be (is) köməkçi feli buraxılmır." },
      { bad: "I am understanding you.", good: "I understand you.", why: "understand vəziyyət felidir, davamlı formada işlənmir." },
      { bad: "Listen! The baby cries.", good: "Listen! The baby is crying.", why: "Danışıq anında baş verən hərəkət üçün Present Continuous lazımdır." }
    ],
    exercise: [
      { q: "Be quiet! The children ___ (sleep).", a: ["are sleeping"], hint: "are + -ing" },
      { q: "I ___ (write) an email right now.", a: ["am writing", "'m writing"], hint: "am + -ing" },
      { q: "run → ___", a: ["running"], hint: "Qısa sait + samit → samit ikiləşir" },
      { q: "I ___ what you mean.", options: ["know", "am knowing", "knowing"], a: ["know"], hint: "Vəziyyət feli" },
      { q: "___ he watching TV?", options: ["Does", "Is", "Are"], a: ["Is"], hint: "he → is" }
    ],
    rule_ids: ["be-missing", "stative-continuous", "now-continuous"] },

  { id: "can-could", level: "A1", group: "Modal fellər", title: "Can / Could", az: "Bacarıq və icazə: can, could",
    when: "can — bacarıq, imkan, icazə və xahiş üçün; could — keçmişdəki bacarıq və daha nəzakətli xahiş üçün işlənir.",
    form: ["I/you/he/she... can swim (-s yoxdur)", "can't (cannot) / couldn't", "Can you help me? — Could you open the door, please?", "I could read when I was five."],
    rules: [
      "can-dan sonra fel to-suz və -s-siz gəlir: She can drive (cans / can to drive yox).",
      "Sual və inkar do olmadan qurulur: Can you...? I can't...",
      "could = keçmişdə bacarırdı: My grandfather could speak three languages.",
      "Xahiş üçün Could you...? Can you...?-dan daha nəzakətlidir."
    ],
    azTrap: "Azərbaycan dilində «bilmək» həm «know», həm də «can» mənasında işlənir («Üzməyi bilirəm», «Gələ bilmirəm»). Buna görə «I know swimming» və ya «I can to swim» kimi cümlələr yaranır. Bacarıq üçün can + fel kifayətdir.",
    examples: [
      { en: "My little brother can count to a hundred.", az: "Kiçik qardaşım yüzə qədər saya bilir." },
      { en: "I can't come tomorrow.", az: "Sabah gələ bilmərəm." },
      { en: "Could you repeat that, please?", az: "Zəhmət olmasa, təkrar edə bilərsiniz?" },
      { en: "She couldn't sleep last night.", az: "O, dünən gecə yata bilmədi." }
    ],
    wrong: [
      { bad: "I can to speak English.", good: "I can speak English.", why: "Modal feldən sonra to işlənmir." },
      { bad: "He cans play the guitar.", good: "He can play the guitar.", why: "Modal fel -s almır." },
      { bad: "Do you can help me?", good: "Can you help me?", why: "Sualda do yox, can özü əvvələ keçir." }
    ],
    exercise: [
      { q: "She ___ (not) swim. She never learned.", a: ["can't", "cannot"], hint: "Bacarıq inkarı" },
      { q: "When I was a child, I ___ climb trees very fast.", a: ["could"], hint: "Keçmişdə bacarıq" },
      { q: "Choose the correct sentence.", options: ["He can drives.", "He can drive.", "He can to drive."], a: ["He can drive."], hint: "can + sadə fel" },
      { q: "___ you pass me the salt, please?", options: ["Do", "Could", "Are"], a: ["Could"], hint: "Nəzakətli xahiş" },
      { q: "I'm sorry, I ___ hear you. The music is too loud.", options: ["can't", "don't can", "not can"], a: ["can't"], hint: "can + not" }
    ],
    rule_ids: ["modal-to", "modal-s", "modal-do-question"] },

  { id: "imperatives", level: "A1", group: "Söz sırası", title: "Imperatives", az: "Əmr forması",
    when: "Göstəriş, əmr, məsləhət, dəvət və xəbərdarlıq üçün işlənir: təlimatlarda, reseptlərdə, yol göstərəndə.",
    form: ["Open the door.", "Don't open the door.", "Please sit down. / Sit down, please.", "Let's go! — Let's not wait."],
    rules: [
      "Felin sadə forması işlənir, mübtəda (you) deyilmir: Close the window.",
      "İnkar don't ilə qurulur: Don't touch it. (Not touch yox.)",
      "please əlavə etmək əmri nəzakətli edir.",
      "«Gəlin edək» mənası üçün Let's + fel: Let's start."
    ],
    azTrap: "Azərbaycan dilində «Gəlmə», «Toxunma» kimi inkar felin özündə şəkilçi ilə verilir, buna görə «Not touch!» və ya «No touch!» yazılır. İngilis dilində inkar əmr həmişə Don't ilə başlayır. Həm də ingilis dilində əmr tonu sərt səslənə bilər, ona görə please və Could you...? tez-tez işlənir.",
    examples: [
      { en: "Turn left at the traffic lights.", az: "Svetoforda sola dönün." },
      { en: "Don't forget your keys.", az: "Açarlarını unutma." },
      { en: "Please wait here.", az: "Zəhmət olmasa, burada gözləyin." },
      { en: "Let's take a taxi.", az: "Gəlin taksi tutaq." }
    ],
    wrong: [
      { bad: "Not smoke here.", good: "Don't smoke here.", why: "İnkar əmr Don't ilə qurulur." },
      { bad: "You close the door.", good: "Close the door.", why: "Əmr formasında you adətən deyilmir." },
      { bad: "Let's to go.", good: "Let's go.", why: "Let's-dən sonra to işlənmir." }
    ],
    exercise: [
      { q: "___ talk during the exam!", a: ["Don't", "Do not"], hint: "İnkar əmr" },
      { q: "___ have a break. I'm tired.", a: ["Let's"], hint: "Təklif: «gəlin»" },
      { q: "Choose the correct sign.", options: ["No park here.", "Don't park here.", "Not park here."], a: ["Don't park here."], hint: "Don't + fel" },
      { q: "___ the water before you add the pasta.", options: ["Boiling", "Boil", "To boil"], a: ["Boil"], hint: "Reseptdə sadə fel" },
      { q: "Choose the most polite request.", options: ["Give me water.", "Please give me some water.", "You give me water."], a: ["Please give me some water."], hint: "please" }
    ],
    rule_ids: ["imperative-negative", "lets-to"] },

  { id: "questions-word-order", level: "A1", group: "Sual və inkar", title: "Questions and word order", az: "Sual cümlələri və söz sırası",
    when: "İngilis dilində sual intonasiya ilə yox, söz sırası ilə qurulur: köməkçi fel mübtədadan əvvələ keçir.",
    form: ["(Wh-) + köməkçi fel + mübtəda + əsas fel", "Do you live here? — Where do you live?", "Is she a nurse? — What is her job?", "Who called you? (mübtəda sualı, do yoxdur)"],
    rules: [
      "be, can, will kimi fellər özü əvvələ keçir: Are you OK? Can she drive?",
      "Digər fellərdə do/does/did əlavə olunur: Where does he work?",
      "Sual sözü (what, where, when, why, how, who) əvvəldə durur.",
      "who/what mübtədanı soruşanda do işlənmir: Who lives here? (Who does live yox.)"
    ],
    azTrap: "Azərbaycan dilində sual çox vaxt yalnız intonasiya və ya «-mı» ədatı ilə qurulur, söz sırası dəyişmir: «Sən burada yaşayırsan?» Buna görə «You live here?», «Where you work?» yazılır. Yazı dilində ingilis sualı mütləq köməkçi fellə başlamalıdır.",
    examples: [
      { en: "Where do your parents live?", az: "Valideynlərin harada yaşayır?" },
      { en: "Is this seat free?", az: "Bu yer boşdur?" },
      { en: "What time does the train leave?", az: "Qatar saat neçədə yola düşür?" },
      { en: "Who wants some tea?", az: "Kim çay istəyir?" }
    ],
    wrong: [
      { bad: "Where you work?", good: "Where do you work?", why: "Sualda köməkçi fel (do) lazımdır." },
      { bad: "What time the shop opens?", good: "What time does the shop open?", why: "does əvvələ keçir, əsas fel -s almır." },
      { bad: "Who did break the window?", good: "Who broke the window?", why: "who mübtədanı soruşanda did işlənmir." }
    ],
    exercise: [
      { q: "___ do you go to work? — By bus.", a: ["How"], hint: "Necə?" },
      { q: "Where ___ your sister study?", a: ["does"], hint: "she → does" },
      { q: "Choose the correct question.", options: ["Why you are sad?", "Why are you sad?", "Why do you are sad?"], a: ["Why are you sad?"], hint: "be əvvələ keçir" },
      { q: "Choose the correct question.", options: ["Who does know the answer?", "Who knows the answer?", "Who know the answer?"], a: ["Who knows the answer?"], hint: "Mübtəda sualı" },
      { q: "Put in order: (you / can / swim)?", a: ["Can you swim?", "Can you swim"], hint: "Modal əvvəldə" }
    ],
    rule_ids: ["question-aux", "question-word-order", "subject-question"] },

  { id: "negatives", level: "A1", group: "Sual və inkar", title: "Negative sentences", az: "İnkar cümlələr",
    when: "Bir şeyin doğru olmadığını bildirmək üçün. İngilis dilində inkar köməkçi fel + not ilə qurulur, bir cümlədə yalnız bir inkar olur.",
    form: ["be: I'm not / isn't / aren't", "do: don't / doesn't / didn't + fel", "modal: can't, won't, shouldn't", "nobody, nothing, never + müsbət fel"],
    rules: [
      "not köməkçi feldən sonra gəlir: She doesn't like it. (She not like it yox.)",
      "doesn't/didn't-dən sonra əsas fel sadə formada olur: He didn't go.",
      "Bir cümlədə iki inkar olmur: I don't know anything / I know nothing.",
      "Şəxs bildirən «heç kim» = nobody, «heç nə» = nothing, «heç vaxt» = never."
    ],
    azTrap: "Azərbaycan dilində «Heç kim gəlmədi», «Heç nə bilmirəm» kimi cümlələrdə iki inkar normaldır. Bu birbaşa çevrilib «Nobody didn't come», «I don't know nothing» olur. İngilis dilində inkar sözlərindən yalnız biri qalır.",
    examples: [
      { en: "I don't eat fish.", az: "Mən balıq yemirəm." },
      { en: "He didn't call me yesterday.", az: "O, dünən mənə zəng etmədi." },
      { en: "Nobody knows the answer.", az: "Cavabı heç kim bilmir." },
      { en: "I don't need anything, thanks.", az: "Heç nəyə ehtiyacım yoxdur, sağ ol." }
    ],
    wrong: [
      { bad: "I don't know nothing.", good: "I don't know anything.", why: "İkiqat inkar olmaz: don't + anything." },
      { bad: "She not like coffee.", good: "She doesn't like coffee.", why: "İnkar üçün köməkçi fel (doesn't) lazımdır." },
      { bad: "He didn't went home.", good: "He didn't go home.", why: "didn't-dən sonra fel sadə formada olur." }
    ],
    exercise: [
      { q: "They ___ (not / have) a car.", a: ["don't have", "do not have"], hint: "they → don't" },
      { q: "My phone ___ (not / work) today.", a: ["isn't working", "doesn't work", "is not working", "does not work"], hint: "it → isn't / doesn't" },
      { q: "Choose the correct sentence.", options: ["Nobody didn't help me.", "Nobody helped me.", "Nobody not helped me."], a: ["Nobody helped me."], hint: "Bir inkar" },
      { q: "I didn't ___ anything.", options: ["buy", "bought", "buys"], a: ["buy"], hint: "didn't + sadə fel" },
      { q: "There isn't ___ in the box.", options: ["nothing", "anything", "something"], a: ["anything"], hint: "İnkardan sonra any-" }
    ],
    rule_ids: ["double-negative", "negative-aux", "did-past-verb"] },

  { id: "prepositions-of-time", level: "A1", group: "Ön sözlər", title: "Prepositions of time: in / on / at", az: "Zaman ön sözləri: in, on, at",
    when: "Vaxtı göstərmək üçün. Azərbaycan dilindəki «-da/-də» ingilis dilində üç fərqli sözlə verilir.",
    form: ["at + saat, an: at 5 o'clock, at night, on the weekend", "on + gün, tarix: on Monday, on 5 May, on my birthday", "in + ay, il, fəsil, günün hissəsi: in June, in 2024, in winter, in the morning", "Ø: today, tomorrow, next week, last year, every day"],
    rules: [
      "Saat və dəqiq an üçün at.",
      "Həftənin günü və tarix üçün on.",
      "Daha uzun dövrlər (ay, il, fəsil, əsr) və in the morning/afternoon/evening üçün in.",
      "next, last, this, every, today, tomorrow-dan əvvəl ön söz işlənmir: next Friday (on next Friday yox)."
    ],
    azTrap: "Azərbaycan dilində «saat beşdə», «bazar ertəsi», «iyunda», «gələn həftə» — hamısı ya «-da» ilə, ya da şəkilçisiz deyilir, buna görə in/on/at təsadüfi seçilir. Xüsusən «in Monday», «at the morning», «in next week» kimi səhvlər yayılıb.",
    examples: [
      { en: "The meeting starts at ten o'clock.", az: "İclas saat onda başlayır." },
      { en: "I was born on 3 March 2005.", az: "Mən 3 mart 2005-ci ildə anadan olmuşam." },
      { en: "We go to the village in summer.", az: "Yayda kəndə gedirik." },
      { en: "I'll see you next week.", az: "Gələn həftə görüşərik." }
    ],
    wrong: [
      { bad: "See you in Monday.", good: "See you on Monday.", why: "Həftənin günü ilə on işlənir." },
      { bad: "I study at the evening.", good: "I study in the evening.", why: "Günün hissələri in the ilə (amma at night)." },
      { bad: "We'll meet on next Friday.", good: "We'll meet next Friday.", why: "next-dən əvvəl ön söz işlənmir." }
    ],
    exercise: [
      { q: "The movie starts ___ 8 pm.", a: ["at"], hint: "Saat → at" },
      { q: "My birthday is ___ April.", a: ["in"], hint: "Ay → in" },
      { q: "We have English ___ Tuesdays.", a: ["on"], hint: "Gün → on" },
      { q: "I can't sleep ___ night.", options: ["in", "on", "at"], a: ["at"], hint: "Sabit ifadə: at night" },
      { q: "Choose the correct sentence.", options: ["I'll call you on tomorrow.", "I'll call you tomorrow.", "I'll call you at tomorrow."], a: ["I'll call you tomorrow."], hint: "tomorrow — ön sözsüz" }
    ],
    rule_ids: ["prep-time", "prep-next-last"] },

  { id: "prepositions-of-place", level: "A1", group: "Ön sözlər", title: "Prepositions of place", az: "Yer ön sözləri: in, on, at, under, next to",
    when: "Bir şeyin harada olduğunu göstərmək üçün işlənir.",
    form: ["in — içində: in the box, in Baku, in the kitchen", "on — üstündə (səthdə): on the table, on the wall, on the second floor", "at — nöqtə, ünvan: at the bus stop, at home, at work, at school", "under, next to, between, behind, in front of, opposite"],
    rules: [
      "Şəhər, ölkə, otaq və qapalı yer üçün in.",
      "Səth, divar, mərtəbə, küçə üçün on: on the floor, on Nizami Street.",
      "Konkret nöqtə və tədbir, həmçinin at home / at work / at school üçün at.",
      "Hərəkət istiqaməti üçün to: go to school (amma go home — to-suz)."
    ],
    azTrap: "Azərbaycan dilində «-da» həm «içində», həm «üstündə», həm də «yanında» mənasını verir, buna görə «on the room», «in the bus stop» deyilir. Həmçinin «evə getmək» birbaşa «go to home» kimi çevrilir; home ilə to işlənmir.",
    examples: [
      { en: "The keys are on the table.", az: "Açarlar stolun üstündədir." },
      { en: "My office is in the city center.", az: "Ofisim şəhərin mərkəzindədir." },
      { en: "I'll wait for you at the bus stop.", az: "Səni avtobus dayanacağında gözləyəcəyəm." },
      { en: "The bank is next to the post office.", az: "Bank poçtun yanındadır." }
    ],
    wrong: [
      { bad: "There is a picture in the wall.", good: "There is a picture on the wall.", why: "Divar səthdir → on." },
      { bad: "I'm going to home.", good: "I'm going home.", why: "home ilə to işlənmir." },
      { bad: "She lives at London.", good: "She lives in London.", why: "Şəhər üçün in." }
    ],
    exercise: [
      { q: "The milk is ___ the fridge.", a: ["in"], hint: "İçində" },
      { q: "Our apartment is ___ the fifth floor.", a: ["on"], hint: "Mərtəbə → on" },
      { q: "Is your father ___ work now?", a: ["at"], hint: "at work" },
      { q: "The cat is sleeping ___ the bed.", options: ["under", "at", "to"], a: ["under"], hint: "Altında" },
      { q: "Choose the correct sentence.", options: ["Let's go to home.", "Let's go home.", "Let's go at home."], a: ["Let's go home."], hint: "home — to-suz" }
    ],
    rule_ids: ["prep-place", "go-home"] },

  { id: "countable-uncountable", level: "A1", group: "Artikllər və isimlər", title: "Countable and uncountable nouns", az: "Sayılan və sayılmayan isimlər",
    when: "İngilis dilində isimlər iki qrupa bölünür: sayıla bilənlər (apple, chair) və sayılmayanlar (water, money, advice). Bu bölgü artikl, cəm forması və miqdar sözlərini təyin edir.",
    form: ["Countable: a book, two books, many books", "Uncountable: water, rice, money, information, advice, news, furniture, homework", "a piece of advice, a glass of water, a bottle of milk", "Uncountable + is: The news is good."],
    rules: [
      "Sayılmayan isimlər a/an və -s almır: information (an information / informations yox).",
      "Sayılmayan isimlə fel təkdə olur: The furniture is new.",
      "Saymaq lazım olanda ölçü sözü işlənir: two pieces of advice, a cup of tea.",
      "advice, information, news, furniture, luggage, homework, equipment ingilis dilində sayılmır, baxmayaraq ki, başqa dillərdə sayıla bilər."
    ],
    azTrap: "Azərbaycan dilində «məsləhətlər», «məlumatlar», «xəbərlər», «ev tapşırıqları» cəm formada rahat işlənir. Ona görə «advices», «informations», «homeworks» yazılır. İngilis dilində bu sözlər sayılmır və heç vaxt -s almır.",
    examples: [
      { en: "Can I give you some advice?", az: "Sənə bir məsləhət verə bilərəmmi?" },
      { en: "I need more information about the course.", az: "Kurs haqqında daha çox məlumata ehtiyacım var." },
      { en: "The news is on at nine.", az: "Xəbərlər saat doqquzdadır." },
      { en: "Could I have a glass of water?", az: "Bir stəkan su ala bilərəm?" }
    ],
    wrong: [
      { bad: "He gave me many advices.", good: "He gave me a lot of advice.", why: "advice sayılmır, -s almır." },
      { bad: "I have a lot of homeworks.", good: "I have a lot of homework.", why: "homework sayılmayan isimdir." },
      { bad: "The news are bad.", good: "The news is bad.", why: "news sayılmır, fel təkdə olur." }
    ],
    exercise: [
      { q: "Thank you for the ___ (information).", a: ["information"], hint: "-s almır" },
      { q: "The furniture in this room ___ very old.", a: ["is"], hint: "Sayılmayan → tək fel" },
      { q: "Can I have a ___ of bread?", options: ["piece", "many", "number"], a: ["piece"], hint: "Ölçü sözü" },
      { q: "Choose the correct sentence.", options: ["We bought new furnitures.", "We bought new furniture.", "We bought a new furniture."], a: ["We bought new furniture."], hint: "furniture sayılmır" },
      { q: "Which noun is countable?", options: ["money", "coin", "rice"], a: ["coin"], hint: "Bir, iki... saymaq olar" }
    ],
    rule_ids: ["uncountable-plural", "uncountable-article", "advice-information"] },

  { id: "some-any", level: "A1", group: "Artikllər və isimlər", title: "Some / Any", az: "Some və any — «bir az, bir neçə, heç»",
    when: "Dəqiq olmayan miqdarı bildirir, cəm və sayılmayan isimlərlə işlənir.",
    form: ["some — təsdiq cümləsi: I have some friends here.", "any — inkar və sual: I don't have any money. Do you have any questions?", "some — təklif və xahiş: Would you like some tea?", "something / anything, somebody / anybody, somewhere / anywhere"],
    rules: [
      "Təsdiq cümləsində some, inkar və sualda any işlənir.",
      "Təklif və xahişdə (Would you like / Can I have) sual olsa da some deyilir.",
      "Tək sayılan isimlə some/any yox, a/an işlənir: Do you have a pen?",
      "Eyni qayda something/anything, somebody/anybody sözlərinə də aiddir."
    ],
    azTrap: "Azərbaycan dilində «bir az», «bir neçə» çox vaxt deyilmir: «Çörək aldım», «Sualın var?». Bu səbəbdən ingiliscə some/any ümumiyyətlə buraxılır və ya inkarda some saxlanılır: «I don't have some money». İnkar və sualda any olmalıdır.",
    examples: [
      { en: "There are some eggs in the fridge.", az: "Soyuducuda bir neçə yumurta var." },
      { en: "We don't have any milk.", az: "Bizdə heç süd yoxdur." },
      { en: "Are there any good restaurants near here?", az: "Buralarda yaxşı restoran var?" },
      { en: "Would you like some cake?", az: "Bir az tort istərdiniz?" }
    ],
    wrong: [
      { bad: "I don't have some time.", good: "I don't have any time.", why: "İnkarda any işlənir." },
      { bad: "Do you have some brothers?", good: "Do you have any brothers?", why: "Adi sualda any işlənir." },
      { bad: "Can I have any water, please?", good: "Can I have some water, please?", why: "Xahişdə some işlənir." }
    ],
    exercise: [
      { q: "I bought ___ apples at the market.", a: ["some"], hint: "Təsdiq" },
      { q: "There aren't ___ chairs in the room.", a: ["any"], hint: "İnkar" },
      { q: "Is there ___ sugar?", options: ["some", "any", "a"], a: ["any"], hint: "Sual" },
      { q: "Would you like ___ coffee?", options: ["some", "any", "an"], a: ["some"], hint: "Təklif" },
      { q: "I didn't see ___ in the street.", options: ["somebody", "anybody", "nobody"], a: ["anybody"], hint: "İnkar → any-" }
    ],
    rule_ids: ["some-any", "double-negative"] },

  /* ===================== A2 ===================== */

  { id: "past-simple-was-were", level: "A2", group: "Zamanlar", title: "Past Simple: was / were", az: "Keçmiş zaman: was / were",
    when: "be felinin keçmiş forması. Keçmişdə harada, necə, kim olduğumuzu bildirir: «idi, idim, idilər».",
    form: ["I/he/she/it was", "you/we/they were", "Was she at home? — Were you tired?", "I wasn't — They weren't"],
    rules: [
      "I, he, she, it və tək isimlə was; you, we, they və cəm isimlə were.",
      "Sual və inkarda did işlənmir: Were you there? (Did you be yox.)",
      "Doğulmaq: I was born in 2003. (I born yox.)",
      "there was / there were — keçmişdə «var idi»."
    ],
    azTrap: "Azərbaycan dilində «idi» şəkilçi kimi sözə qoşulur və şəxsə görə qarışmır, ona görə was/were seçimində səhv olur: «They was». Ən çox rast gəlinən səhv isə «Mən 2003-cü ildə doğulmuşam» cümləsinin «I born in 2003» kimi deyilməsidir.",
    examples: [
      { en: "I was at the library yesterday.", az: "Dünən kitabxanada idim." },
      { en: "The tickets were very expensive.", az: "Biletlər çox baha idi." },
      { en: "Where were you born?", az: "Harada anadan olmusan?" },
      { en: "It wasn't my fault.", az: "Bu mənim günahım deyildi." }
    ],
    wrong: [
      { bad: "I born in Shaki.", good: "I was born in Shaki.", why: "Doğulmaq was/were born ilə deyilir." },
      { bad: "We was very happy.", good: "We were very happy.", why: "we ilə were işlənir." },
      { bad: "Did you be at school yesterday?", good: "Were you at school yesterday?", why: "be-nin sualı did ilə qurulmur." }
    ],
    exercise: [
      { q: "My parents ___ in Turkey last week.", a: ["were"], hint: "Cəm → were" },
      { q: "The movie ___ boring.", a: ["was"], hint: "Tək → was" },
      { q: "___ you at the party?", a: ["Were"], hint: "you → were" },
      { q: "Choose the correct sentence.", options: ["She born in 1999.", "She was born in 1999.", "She is born in 1999."], a: ["She was born in 1999."], hint: "was born" },
      { q: "There ___ many people at the concert.", options: ["was", "were", "did"], a: ["were"], hint: "people → cəm" }
    ],
    rule_ids: ["was-born", "was-were"] },

  { id: "past-simple", level: "A2", group: "Zamanlar", title: "Past Simple: regular and irregular verbs", az: "Keçmiş sadə zaman: qaydalı və qaydasız fellər",
    when: "Keçmişdə müəyyən vaxtda başlayıb bitmiş hərəkəti bildirir: yesterday, last week, in 2019, two days ago.",
    form: ["Regular: work → worked, live → lived, study → studied, stop → stopped", "Irregular: go → went, see → saw, buy → bought, write → wrote", "Did you see it? — Where did you go?", "I didn't see it. (didn't + sadə fel)"],
    rules: [
      "Qaydalı fellər -ed alır; bütün şəxslərdə forma eynidir.",
      "Qaydasız fellərin keçmiş forması əzbərlənməlidir (go → went, take → took).",
      "Sual və inkarda did/didn't işlənir, əsas fel sadə formaya qayıdır: Did she buy? (bought yox).",
      "ago keçmişdəki nöqtəni göstərir və sözdən sonra gəlir: three years ago."
    ],
    azTrap: "Azərbaycan dilində keçmiş zaman şəkilçisi (-dı) həm inkarda, həm sualda qalır: «getmədi», «getdi?». Buna görə ingiliscə də iki dəfə keçmiş forması işlənir: «didn't went», «Did you saw?». did keçmişi artıq göstərir, əsas fel sadə formada qalmalıdır.",
    examples: [
      { en: "We visited our grandparents last weekend.", az: "Keçən həftə sonu baba-nənəmizə baş çəkdik." },
      { en: "I bought these shoes two days ago.", az: "Bu ayaqqabıları iki gün əvvəl aldım." },
      { en: "Did you finish your homework?", az: "Ev tapşırığını bitirdin?" },
      { en: "She didn't come to the meeting.", az: "O, iclasa gəlmədi." }
    ],
    wrong: [
      { bad: "I didn't went to school.", good: "I didn't go to school.", why: "didn't-dən sonra sadə fel gəlir." },
      { bad: "Did you saw the match?", good: "Did you see the match?", why: "did ilə əsas fel sadə formada olur." },
      { bad: "Yesterday I buyed a jacket.", good: "Yesterday I bought a jacket.", why: "buy qaydasızdır: bought." }
    ],
    exercise: [
      { q: "We ___ (go) to Gabala last summer.", a: ["went"], hint: "go → went" },
      { q: "She ___ (study) medicine in Baku.", a: ["studied"], hint: "samit + y → -ied" },
      { q: "They ___ (not / watch) the news yesterday.", a: ["didn't watch", "did not watch"], hint: "didn't + sadə fel" },
      { q: "Where ___ you meet your wife?", options: ["did", "do", "were"], a: ["did"], hint: "Keçmiş sual" },
      { q: "I ___ him at the station an hour ago.", options: ["see", "saw", "seen"], a: ["saw"], hint: "see → saw" }
    ],
    rule_ids: ["did-past-verb", "irregular-past", "ago-position"] },

  { id: "past-continuous", level: "A2", group: "Zamanlar", title: "Past Continuous", az: "Keçmiş davamlı zaman",
    when: "Keçmişdə müəyyən anda davam edən hərəkəti və ya qısa hadisənin fonunu bildirir: «...edirdim».",
    form: ["I/he/she/it was working", "you/we/they were working", "What were you doing at 8? — Was it raining?", "Past Continuous + when + Past Simple"],
    rules: [
      "Quruluş: was/were + fel + -ing.",
      "Uzun fon hərəkəti Past Continuous, onu kəsən qısa hadisə Past Simple ilə verilir: I was cooking when the phone rang.",
      "while ilə iki paralel uzun hərəkət: While I was reading, he was sleeping.",
      "Vəziyyət felləri (know, want) davamlı formada işlənmir."
    ],
    azTrap: "Azərbaycan dilində «Mən yemək bişirirdim, telefon zəng çaldı» cümləsində hər iki fel keçmiş formadadır, fon və hadisə ayrılmır. Buna görə ingiliscə hər ikisi Past Simple ilə yazılır və hekayədə fon itir. «-ırdı» mənası üçün was/were + -ing seçin.",
    examples: [
      { en: "I was having dinner when you called.", az: "Sən zəng edəndə şam edirdim." },
      { en: "At ten o'clock last night we were watching a movie.", az: "Dünən axşam saat onda movie izləyirdik." },
      { en: "It was raining, so we stayed at home.", az: "Yağış yağırdı, ona görə evdə qaldıq." },
      { en: "While she was driving, her phone rang.", az: "O, maşın sürərkən telefonu zəng çaldı." }
    ],
    wrong: [
      { bad: "When you called, I slept.", good: "When you called, I was sleeping.", why: "Kəsilən fon hərəkəti Past Continuous ilə verilir." },
      { bad: "They was playing football.", good: "They were playing football.", why: "they ilə were." },
      { bad: "I was knowing the answer.", good: "I knew the answer.", why: "know davamlı formada işlənmir." }
    ],
    exercise: [
      { q: "I ___ (walk) home when I saw the accident.", a: ["was walking"], hint: "Fon → was + -ing" },
      { q: "What ___ you doing at 7 pm yesterday?", a: ["were"], hint: "you → were" },
      { q: "She was taking a shower when the lights ___ (go) out.", a: ["went"], hint: "Qısa hadisə → Past Simple" },
      { q: "While we ___ dinner, the guests arrived.", options: ["cooked", "were cooking", "are cooking"], a: ["were cooking"], hint: "while + davamlı" },
      { q: "Choose the correct sentence.", options: ["It snowed when I woke up.", "It was snowing when I woke up.", "It snowing when I woke up."], a: ["It was snowing when I woke up."], hint: "Fon + kəsən hadisə" }
    ],
    rule_ids: ["past-continuous-background", "was-were", "stative-continuous"] },

  { id: "future-will-going-to", level: "A2", group: "Zamanlar", title: "Future: will, going to, Present Continuous", az: "Gələcək zaman: will, going to və planlaşdırılmış görüş",
    when: "Gələcəyi bildirməyin üç əsas yolu var: will — qərar anında verilən qərar, söz, proqnoz; going to — əvvəlcədən niyyət və görünən əlamətə əsaslanan proqnoz; Present Continuous — vaxtı, yeri razılaşdırılmış plan.",
    form: ["will + fel: I'll help you. It will be cold.", "am/is/are going to + fel: I'm going to study law.", "am/is/are + -ing: I'm meeting Anar at six.", "won't = will not"],
    rules: [
      "Danışıq anında qərar, təklif və vədə will: The phone's ringing — I'll get it.",
      "Əvvəlcədən qərar verilmiş niyyətə going to: We're going to buy a house next year.",
      "Gözlə görünən əlamət varsa going to: Look at those clouds! It's going to rain.",
      "Təqvimdə yazılmış, razılaşdırılmış plan Present Continuous ilə: I'm flying to Istanbul on Friday."
    ],
    azTrap: "Azərbaycan dilində gələcək çox vaxt indiki zamanla deyilir: «Sabah gəlirəm», «Axşam zəng edirəm». Bu, birbaşa Present Simple-a çevrilir: «I call you tonight». İngilis dilində qərar və vəd üçün will (I'll call you), plan üçün going to və ya Present Continuous lazımdır.",
    examples: [
      { en: "I'm tired. I think I'll go to bed.", az: "Yorğunam. Deyəsən, yatacağam." },
      { en: "She's going to start a new job in May.", az: "O, mayda yeni işə başlayacaq." },
      { en: "We're having a party on Saturday.", az: "Şənbə günü qonaqlıq veririk." },
      { en: "Don't worry, I won't tell anyone.", az: "Narahat olma, heç kimə deməyəcəyəm." }
    ],
    wrong: [
      { bad: "I call you tomorrow.", good: "I'll call you tomorrow.", why: "Vəd və qərar üçün will lazımdır." },
      { bad: "I will to visit my aunt.", good: "I will visit my aunt.", why: "will-dən sonra to işlənmir." },
      { bad: "Look at the sky! It will rain.", good: "Look at the sky! It's going to rain.", why: "Görünən əlamətə əsaslanan proqnoz → going to." }
    ],
    exercise: [
      { q: "A: I don't have a pen. B: No problem, I ___ lend you one.", a: ["will", "'ll"], hint: "Anlıq qərar" },
      { q: "We ___ going to paint the kitchen next week.", a: ["are", "'re"], hint: "we → are" },
      { q: "Be careful! You ___ fall!", options: ["will", "are going to", "fall"], a: ["are going to"], hint: "Görünən təhlükə" },
      { q: "I ___ my dentist at 4 pm tomorrow. It's in my calendar.", options: ["see", "am seeing", "will to see"], a: ["am seeing"], hint: "Razılaşdırılmış görüş" },
      { q: "Choose the correct promise.", options: ["I don't forget.", "I won't forget.", "I not forget."], a: ["I won't forget."], hint: "Vəd → will" }
    ],
    rule_ids: ["future-will", "will-to", "future-present-simple"] },

  { id: "much-many-a-lot", level: "A2", group: "Artikllər və isimlər", title: "Much / Many / A lot of / A few / A little", az: "Miqdar sözləri: much, many, a lot of, a few, a little",
    when: "Miqdarı bildirmək üçün. Seçim ismin sayılan və ya sayılmayan olmasından asılıdır.",
    form: ["many + cəm: many books — How many?", "much + sayılmayan: much time — How much?", "a lot of / lots of + hər ikisi", "a few + cəm (bir neçə), a little + sayılmayan (bir az)"],
    rules: [
      "many sayılan cəm, much sayılmayan isimlə işlənir.",
      "Təsdiq cümləsində adətən a lot of işlənir; much və many daha çox sual və inkarda: I don't have much time.",
      "a few / a little — «bir az, kifayət qədər» (müsbət); few / little — «çox az» (mənfi).",
      "Qiymət soruşanda How much...?, say soruşanda How many...?"
    ],
    azTrap: "Azərbaycan dilində «çox» sözü hər iki növ isimlə eynidir: «çox kitab», «çox su». Buna görə «much people», «many money» səhvləri yaranır. Əvvəlcə isimin sayılıb-sayılmadığını yoxlayın.",
    examples: [
      { en: "How many brothers do you have?", az: "Neçə qardaşın var?" },
      { en: "We don't have much time.", az: "Çox vaxtımız yoxdur." },
      { en: "There were a lot of people at the wedding.", az: "Toyda çoxlu adam var idi." },
      { en: "Add a little salt and a few onions.", az: "Bir az duz və bir neçə soğan əlavə edin." }
    ],
    wrong: [
      { bad: "There are much cars here.", good: "There are a lot of cars here.", why: "cars sayılır; much yox, many / a lot of." },
      { bad: "How many money do you need?", good: "How much money do you need?", why: "money sayılmır → How much." },
      { bad: "I have a few water.", good: "I have a little water.", why: "Sayılmayan isimlə a little." }
    ],
    exercise: [
      { q: "How ___ sugar do you take?", a: ["much"], hint: "sugar sayılmır" },
      { q: "How ___ students are in your group?", a: ["many"], hint: "students sayılır" },
      { q: "I have ___ friends in Ganja — three or four.", options: ["a few", "a little", "much"], a: ["a few"], hint: "Cəm, bir neçə" },
      { q: "There isn't ___ milk left.", options: ["many", "much", "a few"], a: ["much"], hint: "İnkar + sayılmayan" },
      { q: "She has ___ books at home — hundreds!", options: ["much", "a lot of", "a little"], a: ["a lot of"], hint: "Təsdiq, çox" }
    ],
    rule_ids: ["much-many", "few-little"] },

  { id: "comparatives-superlatives", level: "A2", group: "Sifət və zərf", title: "Comparatives and superlatives", az: "Sifətin müqayisə və üstünlük dərəcəsi",
    when: "İki şeyi müqayisə edəndə (bigger than) və bir şeyi qrupda ən yüksək dərəcədə göstərəndə (the biggest) işlənir.",
    form: ["Qısa sifət: old → older → the oldest; big → bigger → the biggest; easy → easier → the easiest", "Uzun sifət: expensive → more expensive → the most expensive", "Qaydasız: good → better → the best; bad → worse → the worst; far → further → the furthest", "as ... as: She is as tall as her mother."],
    rules: [
      "Bir hecalı sifətlər -er/-est, iki və daha çox hecalılar more/most alır (-y ilə bitənlər istisna: happier).",
      "Müqayisədə than işlənir: Baku is bigger than Ganja.",
      "Üstünlük dərəcəsindən əvvəl the gəlir: the tallest building in the world (of yox, in).",
      "-er və more birlikdə işlənmir: more better, more bigger səhvdir."
    ],
    azTrap: "Azərbaycan dilində müqayisə «daha» sözü ilə qurulur və bütün sifətlərə eyni qayda tətbiq olunur: «daha yaxşı», «daha böyük». Bu, «more better», «more bigger» kimi ikiqat formalara gətirir. Həm də «-dan/-dən» birbaşa «from» kimi çevrilir: «bigger from me» əvəzinə than lazımdır.",
    examples: [
      { en: "My brother is taller than me.", az: "Qardaşım məndən hündürdür." },
      { en: "This is the best restaurant in town.", az: "Bu, şəhərin ən yaxşı restoranıdır." },
      { en: "Trains are more comfortable than buses.", az: "Qatarlar avtobuslardan rahatdır." },
      { en: "Today isn't as hot as yesterday.", az: "Bu gün dünənki qədər isti deyil." }
    ],
    wrong: [
      { bad: "My English is more better now.", good: "My English is better now.", why: "better artıq müqayisə formasıdır, more əlavə olunmur." },
      { bad: "She is older from me.", good: "She is older than me.", why: "Müqayisədə than işlənir." },
      { bad: "It's the most big city of the country.", good: "It's the biggest city in the country.", why: "Qısa sifət -est alır; yerlə in işlənir." }
    ],
    exercise: [
      { q: "This bag is ___ (heavy) than that one.", a: ["heavier"], hint: "-y → -ier" },
      { q: "Mount Everest is ___ (high) mountain in the world.", a: ["the highest"], hint: "the + -est" },
      { q: "A Ferrari is ___ (expensive) than a Toyota.", a: ["more expensive"], hint: "Uzun sifət → more" },
      { q: "My cold is ___ today than yesterday.", options: ["more bad", "worse", "badder"], a: ["worse"], hint: "bad → worse" },
      { q: "Choose the correct sentence.", options: ["He is more taller than me.", "He is taller than me.", "He is taller from me."], a: ["He is taller than me."], hint: "-er + than" }
    ],
    rule_ids: ["double-comparative", "comparative-than", "superlative-the"] },

  { id: "must-have-to-should", level: "A2", group: "Modal fellər", title: "Must / Have to / Should", az: "Məcburiyyət və məsləhət: must, have to, should",
    when: "must və have to məcburiyyəti, should isə məsləhət və tövsiyəni bildirir. mustn't qadağa, don't have to isə «lazım deyil» deməkdir.",
    form: ["must + fel: You must wear a seatbelt.", "have to / has to + fel: She has to work on Saturdays.", "should + fel: You should see a doctor.", "mustn't (qadağandır) ≠ don't have to (lazım deyil)"],
    rules: [
      "must — danışanın fikrincə vacib olan və ya qayda; have to — kənar səbəbdən (iş, qanun, cədvəl) məcburiyyət.",
      "Keçmişdə yalnız had to işlənir: I had to wait for an hour.",
      "mustn't = etmək olmaz; don't have to = etmək məcburi deyil, amma olar.",
      "should — məsləhət: You should drink more water. Modal feldən sonra to gəlmir."
    ],
    azTrap: "Azərbaycan dilində «lazım deyil» və «olmaz» ayrı-ayrı ifadələrdir, amma ingiliscə must not hər ikisi kimi səhv başa düşülür. «Sabah gəlməyin lazım deyil» cümləsini «You mustn't come tomorrow» kimi çevirmək «gəlmək qadağandır» deməkdir. Həmçinin «məcburam» mənasında «I must to go» deyilir; must-dan sonra to yoxdur.",
    examples: [
      { en: "You must be at the airport two hours before the flight.", az: "Uçuşdan iki saat əvvəl hava limanında olmalısınız." },
      { en: "My mother has to get up at six every day.", az: "Anam hər gün saat altıda durmalıdır." },
      { en: "You don't have to bring anything. We have everything.", az: "Heç nə gətirməyin lazım deyil. Hər şeyimiz var." },
      { en: "You shouldn't eat so much sugar.", az: "Bu qədər şəkər yeməməlisən." }
    ],
    wrong: [
      { bad: "I must to finish this today.", good: "I must finish this today.", why: "must-dan sonra to işlənmir." },
      { bad: "Yesterday I must stay late at work.", good: "Yesterday I had to stay late at work.", why: "must-un keçmiş forması yoxdur → had to." },
      { bad: "It's Sunday, you mustn't go to school.", good: "It's Sunday, you don't have to go to school.", why: "«Lazım deyil» mənası don't have to ilə verilir." }
    ],
    exercise: [
      { q: "You ___ smoke in the hospital. It's forbidden.", a: ["mustn't", "must not"], hint: "Qadağa" },
      { q: "She ___ (have to) wear a uniform at work.", a: ["has to"], hint: "she → has to" },
      { q: "You look tired. You ___ go to bed early.", options: ["should", "must to", "have"], a: ["should"], hint: "Məsləhət" },
      { q: "Last year we ___ move to a new apartment.", options: ["must", "had to", "have to"], a: ["had to"], hint: "Keçmiş" },
      { q: "The museum is free. You ___ pay.", options: ["mustn't", "don't have to", "shouldn't to"], a: ["don't have to"], hint: "Lazım deyil" }
    ],
    rule_ids: ["modal-to", "mustnt-dont-have-to", "must-past"] },

  { id: "like-doing-want-to-do", level: "A2", group: "Feli formalar (-ing / to)", title: "Like doing / Want to do", az: "Feldən sonra -ing və ya to: like doing, want to do",
    when: "Bir fel başqa felin ardınca gələndə ya -ing, ya da to + fel formasında olur. Bu, birinci feldən asılıdır və əzbərlənməlidir.",
    form: ["+ -ing: like, love, hate, enjoy, finish, mind, stop, go (shopping)", "+ to: want, need, decide, hope, plan, learn, would like", "would like + to: I'd like to order.", "Ön sözdən sonra həmişə -ing: good at swimming, before leaving"],
    rules: [
      "enjoy, finish, mind, avoid-dən sonra yalnız -ing: I enjoy cooking.",
      "want, need, decide, hope, would like-dan sonra to + fel: I want to rest.",
      "like/love/hate-dən sonra -ing və to hər ikisi olur, amma would like mütləq to tələb edir.",
      "Ön söz (in, at, of, about, without) felin -ing formasını tələb edir: Thank you for helping."
    ],
    azTrap: "Azərbaycan dilində «getmək istəyirəm», «oxumağı sevirəm» quruluşunda felin məsdər forması hər yerdə eynidir, ona görə ingiliscə də to hər yerə qoyulur: «I enjoy to dance», «I'm interested in to learn». Bəzən isə to tamamilə atılır: «I want go».",
    examples: [
      { en: "I enjoy walking by the sea.", az: "Dəniz kənarında gəzməkdən zövq alıram." },
      { en: "We want to visit Lankaran next summer.", az: "Gələn yay Lənkərana getmək istəyirik." },
      { en: "Would you like to come with us?", az: "Bizimlə gəlmək istərdin?" },
      { en: "She's good at drawing.", az: "O, rəsm çəkməkdə bacarıqlıdır." }
    ],
    wrong: [
      { bad: "I enjoy to read books.", good: "I enjoy reading books.", why: "enjoy-dan sonra -ing gəlir." },
      { bad: "I want go home.", good: "I want to go home.", why: "want-dan sonra to + fel lazımdır." },
      { bad: "I'm interested in learn Spanish.", good: "I'm interested in learning Spanish.", why: "Ön sözdən sonra -ing forması gəlir." }
    ],
    exercise: [
      { q: "Have you finished ___ (eat)?", a: ["eating"], hint: "finish + -ing" },
      { q: "They decided ___ (stay) at home.", a: ["to stay"], hint: "decide + to" },
      { q: "I'd like ___ a table for two, please.", options: ["book", "to book", "booking"], a: ["to book"], hint: "would like + to" },
      { q: "Do you mind ___ the window?", options: ["to open", "opening", "open"], a: ["opening"], hint: "mind + -ing" },
      { q: "He left without ___ goodbye.", options: ["say", "to say", "saying"], a: ["saying"], hint: "Ön söz + -ing" }
    ],
    rule_ids: ["gerund-infinitive", "preposition-ing", "want-to"] },

  { id: "present-perfect-ever-never", level: "A2", group: "Zamanlar", title: "Present Perfect: experience (ever / never)", az: "Bitmiş indiki zaman: təcrübə (ever, never)",
    when: "Həyatımızda nə vaxtsa olub-olmadığını, vaxtı dəqiqləşdirmədən bildirmək üçün işlənir: «heç ... olmusan?», «heç vaxt ... etməmişəm».",
    form: ["I/you/we/they have (I've) + V3", "he/she/it has (she's) + V3", "Have you ever been to London?", "I've never tried sushi."],
    rules: [
      "Quruluş: have/has + felin III forması (visited, seen, been, eaten).",
      "ever sualda «heç, nə vaxtsa», never isə «heç vaxt» mənasını verir və feldən əvvəl gəlir.",
      "Səfər təcrübəsi üçün been to: I've been to Paris (gedib qayıtmışam).",
      "Dəqiq vaxt (yesterday, in 2020) deyiləndə Present Perfect yox, Past Simple işlənir."
    ],
    azTrap: "Azərbaycan dilində «Mən Parisdə olmuşam» və «Dünən Parisdə oldum» eyni keçmiş forma ilə deyilə bilir, ona görə ingiliscə hər ikisi Past Simple ilə yazılır: «Did you ever go...?». Həmçinin «I have been in Paris last year» kimi dəqiq vaxtla Present Perfect qarışdırılır.",
    examples: [
      { en: "Have you ever eaten Japanese food?", az: "Heç yapon yeməyi yemisən?" },
      { en: "I've never been to Nakhchivan.", az: "Heç vaxt Naxçıvanda olmamışam." },
      { en: "She has met the president twice.", az: "O, prezidentlə iki dəfə görüşüb." },
      { en: "We've seen this movie before.", az: "Bu filmə əvvəllər baxmışıq." }
    ],
    wrong: [
      { bad: "Did you ever see a whale?", good: "Have you ever seen a whale?", why: "Həyat təcrübəsi Present Perfect ilə soruşulur." },
      { bad: "I have been to Istanbul last year.", good: "I went to Istanbul last year.", why: "Dəqiq vaxtla Past Simple işlənir." },
      { bad: "I haven't never flown.", good: "I have never flown.", why: "never özü inkardır." }
    ],
    exercise: [
      { q: "Have you ever ___ (ride) a horse?", a: ["ridden"], hint: "ride → rode → ridden" },
      { q: "She ___ never seen snow.", a: ["has", "'s"], hint: "she → has" },
      { q: "I ___ to Georgia three times.", options: ["have been", "have gone", "was"], a: ["have been"], hint: "Təcrübə: been to" },
      { q: "We ___ to Turkey in 2022.", options: ["have gone", "went", "have been"], a: ["went"], hint: "Dəqiq vaxt → Past Simple" },
      { q: "Choose the correct question.", options: ["Did you ever try skiing?", "Have you ever tried skiing?", "Have you ever try skiing?"], a: ["Have you ever tried skiing?"], hint: "have + V3" }
    ],
    rule_ids: ["present-perfect-definite-time", "irregular-v3", "double-negative"] },

  { id: "too-enough", level: "A2", group: "Sifət və zərf", title: "Too / Enough", az: "Too (həddindən artıq) və enough (kifayət qədər)",
    when: "too — lazım olandan artıq (mənfi nəticə), enough — lazım olan qədər mənasını verir.",
    form: ["too + sifət: too hot, too expensive", "sifət + enough: old enough, warm enough", "enough + isim: enough money, enough time", "too/enough + to + fel: too tired to walk; old enough to drive"],
    rules: [
      "too sifətdən əvvəl, enough isə sifətdən sonra gəlir: big enough (enough big yox).",
      "İsimlə enough isimdən əvvəl gəlir: enough chairs.",
      "too çoxluğu bildirir və adətən problem deməkdir; very isə sadəcə gücləndirir: very hot (normal), too hot (içmək olmur).",
      "Nəticə to + fel ilə verilir: The box is too heavy to carry."
    ],
    azTrap: "Azərbaycan dilində «çox» həm very, həm də too mənasında işlənir: «Çay çox istidir». Ona görə «It's too nice!» (çox gözəldir) kimi müsbət mənada too işlədilir, bu isə ingiliscə tənqid kimi səslənir. Həmçinin «kifayət qədər böyük» sırası ilə «enough big» yazılır.",
    examples: [
      { en: "This coffee is too hot to drink.", az: "Bu qəhvə içmək üçün çox istidir." },
      { en: "He isn't old enough to vote.", az: "Onun səs verməyə yaşı çatmır." },
      { en: "We don't have enough chairs for everyone.", az: "Hamı üçün kifayət qədər stulumuz yoxdur." },
      { en: "The jacket is very nice, but it's too expensive.", az: "Gödəkcə çox gözəldir, amma həddən artıq bahadır." }
    ],
    wrong: [
      { bad: "The room isn't enough big.", good: "The room isn't big enough.", why: "enough sifətdən sonra gəlir." },
      { bad: "Your dress is too beautiful!", good: "Your dress is very beautiful!", why: "too mənfi mənadır; tərif üçün very." },
      { bad: "I have time enough.", good: "I have enough time.", why: "enough isimdən əvvəl gəlir." }
    ],
    exercise: [
      { q: "I can't sleep. It's ___ noisy here.", a: ["too"], hint: "Problem → too" },
      { q: "Is the water warm ___ to swim?", a: ["enough"], hint: "sifət + enough" },
      { q: "We don't have ___ eggs for the cake.", options: ["too", "enough", "very"], a: ["enough"], hint: "enough + isim" },
      { q: "Choose the correct sentence.", options: ["She is enough tall.", "She is tall enough.", "She is too enough tall."], a: ["She is tall enough."], hint: "sifət + enough" },
      { q: "The suitcase is ___ heavy for me to lift.", options: ["too", "enough", "very much"], a: ["too"], hint: "Qaldıra bilmirəm" }
    ],
    rule_ids: ["enough-position", "too-very"] },

  { id: "linking-and-but-because-so", level: "A2", group: "Bağlayıcılar", title: "And, but, or, because, so", az: "Əsas bağlayıcılar: and, but, or, because, so",
    when: "İki fikri birləşdirmək üçün: əlavə (and), zidd (but), seçim (or), səbəb (because), nəticə (so).",
    form: ["and — və", "but — amma", "or — və ya", "because + səbəb: I stayed home because I was ill.", "so + nəticə: I was ill, so I stayed home."],
    rules: [
      "because səbəbi, so nəticəni bildirir; ikisi bir cümlədə birlikdə işlənmir.",
      "so-dan əvvəl adətən vergül qoyulur: It was late, so we left.",
      "but ilə although eyni cümlədə işlənmir.",
      "İnkar cümlədə «nə ... nə də» mənası üçün or: I don't drink tea or coffee."
    ],
    azTrap: "Azərbaycan dilində «Çünki xəstə idim, ona görə gəlmədim» kimi cümlələrdə həm səbəb, həm nəticə sözü işlənir. Bu, «Because I was ill, so I didn't come» kimi ikiqat bağlayıcıya gətirir. Həm də «Çünki...» ilə başlayan ayrıca cümlə yazı dilində yarımçıq sayılır.",
    examples: [
      { en: "I like tea, but my wife prefers coffee.", az: "Mən çayı sevirəm, amma həyat yoldaşım qəhvəni üstün tutur." },
      { en: "We stayed inside because it was raining.", az: "Yağış yağdığı üçün içəridə qaldıq." },
      { en: "The shop was closed, so I went home.", az: "Mağaza bağlı idi, ona görə evə getdim." },
      { en: "Do you want rice or potatoes?", az: "Düyü istəyirsən, yoxsa kartof?" }
    ],
    wrong: [
      { bad: "Because it was cold, so we stayed home.", good: "Because it was cold, we stayed home.", why: "because və so birlikdə işlənmir." },
      { bad: "I missed the bus. Because I woke up late.", good: "I missed the bus because I woke up late.", why: "because ilə başlayan hissə ayrıca cümlə ola bilməz." },
      { bad: "Although he is rich, but he is unhappy.", good: "Although he is rich, he is unhappy.", why: "although və but birlikdə işlənmir." }
    ],
    exercise: [
      { q: "I was hungry, ___ I made a sandwich.", a: ["so"], hint: "Nəticə" },
      { q: "She is tired ___ she worked all day.", a: ["because"], hint: "Səbəb" },
      { q: "He's very clever, ___ he's lazy.", options: ["and", "but", "so"], a: ["but"], hint: "Ziddiyyət" },
      { q: "Would you like juice ___ water?", options: ["or", "and", "but"], a: ["or"], hint: "Seçim" },
      { q: "Choose the correct sentence.", options: ["Because I was busy, so I didn't call.", "I was busy, so I didn't call.", "I was busy, because I didn't call."], a: ["I was busy, so I didn't call."], hint: "Bir bağlayıcı" }
    ],
    rule_ids: ["because-so", "although-but", "because-fragment"] },

  { id: "word-order-basic", level: "A2", group: "Söz sırası", title: "Basic word order (S–V–O, place, time)", az: "Əsas söz sırası: mübtəda – fel – tamamlıq – yer – zaman",
    when: "İngilis cümləsində söz sırası sabitdir və mənanı göstərir. Azərbaycan dilindən fərqli olaraq fel sonda yox, mübtədadan dərhal sonra gəlir.",
    form: ["Subject + Verb + Object: Ali reads books.", "... + Place + Time: I met her at the cafe yesterday.", "Sifət isimdən əvvəl: a big red car", "Fel ilə tamamlıq ayrılmır: I like football very much."],
    rules: [
      "Fel mübtədadan dərhal sonra, tamamlıq isə feldən sonra gəlir.",
      "Yer zamandan əvvəl gəlir: We went to the park on Sunday.",
      "Fel ilə onun tamamlığı arasına zərf qoyulmur: I speak English well (I speak well English yox).",
      "Zaman ifadəsi cümlənin əvvəlinə də keçə bilər: Yesterday I met her at the cafe."
    ],
    azTrap: "Azərbaycan dili S–O–V dilidir: «Mən kitabı oxudum». Bu sıra ingiliscə köçürüləndə «I the book read» kimi təbii olmayan cümlələr yaranır. Həmçinin «Mən ingiliscəni yaxşı danışıram» sırası ilə «I very well speak English» və ya «I speak very well English» deyilir.",
    examples: [
      { en: "My sister bought a new car last month.", az: "Bacım keçən ay yeni maşın aldı." },
      { en: "We had lunch in a small restaurant yesterday.", az: "Dünən kiçik bir restoranda nahar etdik." },
      { en: "He speaks Russian very well.", az: "O, rus dilində çox yaxşı danışır." },
      { en: "I really like this song.", az: "Bu mahnını çox bəyənirəm." }
    ],
    wrong: [
      { bad: "I very much like football.", good: "I like football very much.", why: "very much fel + tamamlıqdan sonra gəlir." },
      { bad: "She speaks very well English.", good: "She speaks English very well.", why: "Fel ilə tamamlıq arasına zərf girmir." },
      { bad: "Yesterday at home I my homework did.", good: "I did my homework at home yesterday.", why: "Sıra: mübtəda + fel + tamamlıq + yer + zaman." }
    ],
    exercise: [
      { q: "Put in order: (plays / my brother / the piano).", a: ["My brother plays the piano", "My brother plays the piano."], hint: "S + V + O" },
      { q: "Put in order: (I / to the gym / go / every day).", a: ["I go to the gym every day", "I go to the gym every day."], hint: "Yer + zaman" },
      { q: "Choose the correct sentence.", options: ["I speak well French.", "I speak French well.", "I well speak French."], a: ["I speak French well."], hint: "Fel + tamamlıq + zərf" },
      { q: "Choose the correct sentence.", options: ["We at home yesterday stayed.", "We stayed at home yesterday.", "We stayed yesterday at home."], a: ["We stayed at home yesterday."], hint: "Yer zamandan əvvəl" },
      { q: "Choose the correct phrase.", options: ["a car red", "a red car", "red a car"], a: ["a red car"], hint: "Sifət isimdən əvvəl" }
    ],
    rule_ids: ["word-order-svo", "adverb-between-verb-object", "place-time-order"] },

  /* ===================== B1 ===================== */

  { id: "present-perfect-yet-since-for", level: "B1", group: "Zamanlar", title: "Present Perfect: already, yet, just, since, for", az: "Bitmiş indiki zaman: already, yet, just, since, for",
    when: "Keçmişdəki hərəkətin indi nəticəsi olduğunu (already, yet, just) və ya keçmişdə başlayıb indiyədək davam edən vəziyyəti (since, for) bildirir.",
    form: ["I've already finished. — Have you finished yet? — I haven't finished yet.", "She's just left.", "for + müddət: for two years, for a long time", "since + başlanğıc: since 2020, since Monday, since I was a child"],
    rules: [
      "already (artıq) və just (indicə) have ilə V3 arasında gəlir: I've just eaten.",
      "yet sual və inkarda, cümlənin sonunda gəlir: Has he called yet?",
      "for müddəti, since başlanğıc nöqtəsini göstərir.",
      "Keçmişdən indiyədək davam edən vəziyyət üçün Present Simple yox, Present Perfect: I have lived here since 2015."
    ],
    azTrap: "Azərbaycan dilində «Beş ildir burada yaşayıram», «Səni çoxdan tanıyıram» indiki zamanla deyilir. Bu, ingiliscə «I live here for five years», «I know you since school» kimi çevrilir. İngilis dilində keçmişdən indiyə uzanan müddət üçün have + V3 lazımdır. Həmçinin «-dan bəri» birbaşa «from» kimi tərcümə olunur: «from 2015» əvəzinə since işlənir.",
    examples: [
      { en: "I've known Orkhan since we were at school.", az: "Orxanı məktəbdən tanıyıram." },
      { en: "They have lived in this house for ten years.", az: "Onlar on ildir bu evdə yaşayırlar." },
      { en: "Have you sent the report yet?", az: "Hesabatı artıq göndərmisən?" },
      { en: "The bus has just left.", az: "Avtobus indicə getdi." }
    ],
    wrong: [
      { bad: "I live in Baku for five years.", good: "I have lived in Baku for five years.", why: "İndiyədək davam edən müddət üçün Present Perfect." },
      { bad: "She has worked here from 2019.", good: "She has worked here since 2019.", why: "Başlanğıc nöqtəsi since ilə verilir." },
      { bad: "I didn't finish yet.", good: "I haven't finished yet.", why: "yet adətən Present Perfect ilə işlənir (amerikan danışıq dilində Past Simple də eşidilir, amma yazıda Present Perfect daha düzgündür)." }
    ],
    exercise: [
      { q: "We have been friends ___ ten years.", a: ["for"], hint: "Müddət" },
      { q: "He has worked at the bank ___ January.", a: ["since"], hint: "Başlanğıc" },
      { q: "Have you done your homework ___?", a: ["yet"], hint: "Sual, sonda" },
      { q: "I ___ her for a long time.", options: ["know", "have known", "am knowing"], a: ["have known"], hint: "İndiyədək davam edən vəziyyət" },
      { q: "Don't cook — I've ___ eaten.", options: ["yet", "already", "since"], a: ["already"], hint: "Artıq" }
    ],
    rule_ids: ["tense-since-for", "since-from", "yet-present-perfect"] },

  { id: "present-perfect-vs-past-simple", level: "B1", group: "Zamanlar", title: "Present Perfect vs Past Simple", az: "Present Perfect və Past Simple fərqi",
    when: "Hər ikisi keçmişdəki hərəkətdən danışır. Past Simple bitmiş, dəqiq vaxtı məlum olan keçmişə; Present Perfect isə vaxtı vacib olmayan və indi ilə əlaqəsi olan keçmişə baxır.",
    form: ["Past Simple: I lost my keys yesterday. (dünən — bitmiş vaxt)", "Present Perfect: I've lost my keys. (indi açarım yoxdur)", "When did you...? — həmişə Past Simple", "this week / today / so far — vaxt bitməyibsə Present Perfect"],
    rules: [
      "yesterday, last year, ago, in 2010, When...? ilə yalnız Past Simple işlənir.",
      "Nəticə indi vacibdirsə Present Perfect: She has broken her leg (indi ayağı gipsdədir).",
      "Hekayə danışanda ilk cümlə Present Perfect ola bilər, detallar isə Past Simple ilə verilir: I've been to Rome. I went there in 2019.",
      "Ölmüş insanın həyat təcrübəsi Past Simple ilə: Shakespeare wrote many plays."
    ],
    azTrap: "Azərbaycan dilində «-dı» və «-ıb/-mış» şəkilçiləri ingilis zamanlarına birbaşa uyğun gəlmir. Ona görə «Dünən onu görmüşəm» ifadəsi «I have seen him yesterday» olur. Qayda sadədir: keçmişdəki dəqiq vaxt göstərilirsə və ya When? ilə soruşulursa, Present Perfect işlənmir.",
    examples: [
      { en: "I've lost my phone. Can I use yours?", az: "Telefonumu itirmişəm. Səninkindən istifadə edə bilərəm?" },
      { en: "I lost my phone last week, but I found it.", az: "Keçən həftə telefonumu itirdim, amma tapdım." },
      { en: "Have you seen the new museum? — Yes, I went there on Sunday.", az: "Yeni muzeyi görmüsən? — Hə, bazar günü getdim." },
      { en: "When did you start learning English?", az: "İngilis dilini öyrənməyə nə vaxt başladın?" }
    ],
    wrong: [
      { bad: "I have seen him yesterday.", good: "I saw him yesterday.", why: "yesterday dəqiq keçmiş vaxtdır → Past Simple." },
      { bad: "When have you arrived?", good: "When did you arrive?", why: "When? sualı Past Simple tələb edir." },
      { bad: "I have finished school in 2020.", good: "I finished school in 2020.", why: "İl göstərilib → Past Simple." }
    ],
    exercise: [
      { q: "We ___ (move) to Baku two years ago.", a: ["moved"], hint: "ago → Past Simple" },
      { q: "Oh no! I ___ (forget) my password.", a: ["have forgotten", "'ve forgotten"], hint: "Nəticə indi vacibdir" },
      { q: "___ you ever met a famous person?", options: ["Did", "Have", "Were"], a: ["Have"], hint: "Təcrübə" },
      { q: "When ___ the movie start?", options: ["has", "did", "have"], a: ["did"], hint: "When → Past Simple" },
      { q: "Choose the correct sentence.", options: ["I've visited Paris in 2018.", "I visited Paris in 2018.", "I've visit Paris in 2018."], a: ["I visited Paris in 2018."], hint: "Dəqiq il" }
    ],
    rule_ids: ["present-perfect-definite-time", "when-past-simple"] },

  { id: "used-to", level: "B1", group: "Zamanlar", title: "Used to", az: "Used to — keçmiş vərdiş və vəziyyət",
    when: "Keçmişdə müntəzəm olan, amma indi olmayan vərdiş və vəziyyətləri bildirir: «əvvəllər ... edirdim».",
    form: ["used to + fel: I used to play football.", "didn't use to: She didn't use to like coffee.", "Did you use to...?", "be used to + -ing = alışmaq (fərqli məna): I'm used to working late."],
    rules: [
      "used to bütün şəxslərdə eynidir və ardınca sadə fel gəlir.",
      "İnkar və sualda did işlənir və -d düşür: didn't use to, Did you use to?",
      "used to yalnız keçmiş üçündür; indiki vərdiş üçün usually işlənir (I use to yox).",
      "be/get used to + -ing «alışmaq» deməkdir: I'm used to the cold."
    ],
    azTrap: "Azərbaycan dilində «Əvvəllər idmanla məşğul olurdum» cümləsi keçmiş davamlı formada deyilir, ona görə ingiliscə «I was doing sport before» yazılır və vərdiş mənası itir. Bundan başqa, «adətən edirəm» mənasında səhvən «I use to wake up early» deyilir.",
    examples: [
      { en: "I used to live with my grandparents.", az: "Əvvəllər baba-nənəmlə yaşayırdım." },
      { en: "There used to be a cinema on this street.", az: "Əvvəllər bu küçədə kinoteatr var idi." },
      { en: "Did you use to wear glasses?", az: "Əvvəllər eynək taxırdın?" },
      { en: "He didn't use to eat vegetables, but now he loves them.", az: "O, əvvəllər tərəvəz yemirdi, indi isə çox sevir." }
    ],
    wrong: [
      { bad: "I use to go jogging every morning.", good: "I usually go jogging every morning.", why: "İndiki vərdiş usually ilə verilir; used to yalnız keçmişdir." },
      { bad: "Did you used to smoke?", good: "Did you use to smoke?", why: "did-dən sonra use (d-siz)." },
      { bad: "I used to living in a village.", good: "I used to live in a village.", why: "used to-dan sonra sadə fel gəlir." }
    ],
    exercise: [
      { q: "When I was a child, I ___ (be) afraid of dogs.", a: ["used to be"], hint: "Keçmiş vəziyyət" },
      { q: "She ___ (not) like fish, but now she does.", a: ["didn't use to", "did not use to"], hint: "didn't use to" },
      { q: "___ you use to walk to school?", a: ["Did"], hint: "Sual → Did" },
      { q: "Choose the correct sentence.", options: ["We used to going camping.", "We used to go camping.", "We use to went camping."], a: ["We used to go camping."], hint: "used to + fel" },
      { q: "I've lived in London for years, so I'm used to ___ on the left.", options: ["drive", "driving", "drove"], a: ["driving"], hint: "be used to + -ing" }
    ],
    rule_ids: ["used-to", "use-to-present"] },

  { id: "zero-first-conditional", level: "B1", group: "Şərt cümlələri", title: "Zero and First Conditional", az: "Sıfır və birinci növ şərt cümlələri",
    when: "Sıfır növ — həmişə doğru olan nəticələr (qanunlar, faktlar); birinci növ — real, gələcəkdə mümkün vəziyyət və onun nəticəsi.",
    form: ["Zero: If + Present Simple, Present Simple — If you heat ice, it melts.", "First: If + Present Simple, will + fel — If it rains, we'll stay home.", "unless = if not", "when (mütləq olacaq) / if (ola da bilər)"],
    rules: [
      "if hissəsində will işlənmir, hətta mənası gələcək olsa belə: If I see him, I'll tell him.",
      "Nəticə hissəsində will, can, may, imperativ ola bilər: If you're cold, close the window.",
      "if hissəsi əvvəldə gələndə ondan sonra vergül qoyulur; sonda gələndə vergül lazım deyil.",
      "Eyni qayda when, as soon as, before, after, until ilə də işləyir: I'll call you when I arrive."
    ],
    azTrap: "Azərbaycan dilində «Əgər sabah yağış yağsa, evdə qalacağıq» cümləsində şərt hissəsi gələcək mənalıdır, buna görə ingiliscə «If it will rain» yazılır. Eyni səhv «Gələndə zəng edəcəm» → «When I will come» quruluşunda da var. if/when-dən sonra Present Simple qalır.",
    examples: [
      { en: "If you mix red and blue, you get purple.", az: "Qırmızı ilə göyü qarışdırsan, bənövşəyi alınır." },
      { en: "If we leave now, we'll catch the train.", az: "İndi çıxsaq, qatara çatarıq." },
      { en: "I'll text you when I get home.", az: "Evə çatanda sənə mesaj yazacağam." },
      { en: "You won't pass the exam unless you study.", az: "Oxumasan, imtahandan keçməyəcəksən." }
    ],
    wrong: [
      { bad: "If it will be sunny, we'll go to the beach.", good: "If it is sunny, we'll go to the beach.", why: "if hissəsində will işlənmir." },
      { bad: "I'll call you when I will arrive.", good: "I'll call you when I arrive.", why: "when-dən sonra gələcək mənasında Present Simple." },
      { bad: "Unless you don't hurry, you'll be late.", good: "Unless you hurry, you'll be late.", why: "unless artıq «if not» deməkdir, ikinci inkar lazım deyil." }
    ],
    exercise: [
      { q: "If you ___ (press) this button, the machine starts.", a: ["press"], hint: "Sıfır növ" },
      { q: "If she ___ (study) hard, she will pass.", a: ["studies"], hint: "if + Present Simple" },
      { q: "We ___ (be) late if we don't hurry.", a: ["will be", "'ll be"], hint: "Nəticə → will" },
      { q: "I'll wait here until you ___ back.", options: ["will come", "come", "came"], a: ["come"], hint: "until + Present Simple" },
      { q: "Choose the correct sentence.", options: ["If I will see Nigar, I'll tell her.", "If I see Nigar, I'll tell her.", "If I see Nigar, I tell her tomorrow."], a: ["If I see Nigar, I'll tell her."], hint: "if + Present, will + fel" }
    ],
    rule_ids: ["will-after-if", "unless-double-negative", "conditional-comma"] },

  { id: "relative-clauses-who-which-that", level: "B1", group: "Budaq cümlələr", title: "Relative clauses: who, which, that, where", az: "Təyin budaq cümləsi: who, which, that, where",
    when: "İsim haqqında əlavə məlumat verib onu dəqiqləşdirmək üçün işlənir: «kitab ki, ...», «oxuduğum kitab».",
    form: ["who — insanlar: the man who lives next door", "which — əşya, heyvan: the book which I bought", "that — insan və əşya (danışıq dilində): the movie that we saw", "where — yer: the city where I was born; whose — yiyəlik: the girl whose bag..."],
    rules: [
      "İnsan üçün who, əşya üçün which; that hər ikisini əvəz edə bilər.",
      "Budaq cümlə təyin etdiyi isimdən dərhal sonra gəlir.",
      "who/which/that budaq cümlənin tamamlığıdırsa buraxıla bilər: the book (that) I read.",
      "Budaq cümlədə əvəzlik təkrarlanmır: the book which I read (it yox)."
    ],
    azTrap: "Azərbaycan dilində təyin budaq cümləsi isimdən əvvəl gəlir və feli sifətlə qurulur: «dünən aldığım kitab». İngilis dilində isə sıra tərsinədir: the book which I bought yesterday. Bu fərqə görə öyrənənlər ya budaq cümləni yanlış yerə qoyur, ya da əvəzliyi ikiqat işlədir: «the book which I bought it».",
    examples: [
      { en: "The woman who works at the reception is very kind.", az: "Qəbulda işləyən qadın çox mehribandır." },
      { en: "This is the laptop which I bought last year.", az: "Bu, keçən il aldığım noutbukdur." },
      { en: "Shusha is the town where my father was born.", az: "Şuşa atamın doğulduğu şəhərdir." },
      { en: "I have a friend whose brother is a pilot.", az: "Qardaşı pilot olan bir dostum var." }
    ],
    wrong: [
      { bad: "The man which called you is my uncle.", good: "The man who called you is my uncle.", why: "İnsan üçün who (və ya that)." },
      { bad: "This is the car that I bought it.", good: "This is the car that I bought.", why: "Budaq cümlədə əvəzlik təkrarlanmır." },
      { bad: "The restaurant where we ate there was great.", good: "The restaurant where we ate was great.", why: "where artıq yeri bildirir; there artıqdır." }
    ],
    exercise: [
      { q: "The doctor ___ helped me was very young.", a: ["who", "that"], hint: "İnsan" },
      { q: "Do you remember the hotel ___ we stayed?", a: ["where"], hint: "Yer" },
      { q: "This is the phone ___ I told you about.", options: ["who", "which", "where"], a: ["which"], hint: "Əşya" },
      { q: "That's the boy ___ father is a famous singer.", options: ["who", "whose", "which"], a: ["whose"], hint: "Yiyəlik" },
      { q: "Choose the correct sentence.", options: ["The cake that she made it was delicious.", "The cake that she made was delicious.", "The cake who she made was delicious."], a: ["The cake that she made was delicious."], hint: "Əvəzlik təkrarlanmır" }
    ],
    rule_ids: ["relative-who-which", "relative-resumptive-pronoun"] },

  { id: "passive-basic", level: "B1", group: "Məchul növ", title: "The passive (present and past simple)", az: "Məchul növ: indiki və keçmiş sadə zaman",
    when: "Hərəkəti kimin etdiyi məlum olmayanda, vacib olmayanda və ya diqqət hərəkətin obyektinə yönələndə işlənir: «tikilib, istehsal olunur».",
    form: ["am/is/are + V3: English is spoken here.", "was/were + V3: The bridge was built in 1990.", "by + icraçı: The book was written by Nizami.", "Is it made...? — It isn't made..."],
    rules: [
      "Məchul növ be + felin III forması ilə qurulur; be zamanı göstərir.",
      "İcraçı vacibdirsə by ilə verilir; adətən isə deyilmir.",
      "Tamamlığı olmayan fellər (happen, arrive, die) məchul olmur: The accident happened (was happened yox).",
      "Doğulmaq həmişə məchuldur: I was born."
    ],
    azTrap: "Azərbaycan dilində məchul şəkilçi ilə qurulur və köməkçi fel yoxdur: «Bu ev 1990-cı ildə tikilib». Buna görə ingiliscə be buraxılır: «This house built in 1990». Həm də «baş verdi» kimi fellər məchul hiss edildiyi üçün «was happened» yazılır.",
    examples: [
      { en: "Tea is grown in Lankaran.", az: "Lənkəranda çay becərilir." },
      { en: "The Maiden Tower was built many centuries ago.", az: "Qız qalası çox əsrlər əvvəl tikilib." },
      { en: "My bike was stolen last night.", az: "Dünən gecə velosipedim oğurlandı." },
      { en: "These shoes are made in Italy.", az: "Bu ayaqqabılar İtaliyada istehsal olunur." }
    ],
    wrong: [
      { bad: "This car made in Germany.", good: "This car was made in Germany.", why: "Məchul növdə be (was/is) buraxılmır." },
      { bad: "The accident was happened at night.", good: "The accident happened at night.", why: "happen tamamlıqsız feldir, məchul olmur." },
      { bad: "The letter was wrote yesterday.", good: "The letter was written yesterday.", why: "Məchulda III forma (written) lazımdır." }
    ],
    exercise: [
      { q: "Football ___ (play) all over the world.", a: ["is played"], hint: "is + V3" },
      { q: "The windows ___ (clean) yesterday.", a: ["were cleaned"], hint: "were + V3" },
      { q: "The Mona Lisa was painted ___ Leonardo da Vinci.", a: ["by"], hint: "İcraçı" },
      { q: "What ___ yesterday? Why are the police here?", options: ["was happened", "happened", "is happened"], a: ["happened"], hint: "happen — məchulsuz" },
      { q: "English ___ in many countries.", options: ["speaks", "is spoken", "is speaking"], a: ["is spoken"], hint: "is + V3" }
    ],
    rule_ids: ["passive-be-missing", "passive-intransitive", "irregular-v3"] },

  { id: "so-such", level: "B1", group: "Sifət və zərf", title: "So / Such", az: "So və such — «elə, o qədər»",
    when: "Sifəti və ya ismi gücləndirmək və tez-tez nəticəni göstərmək üçün işlənir: «o qədər yorğun idim ki, ...».",
    form: ["so + sifət/zərf: so tired, so quickly", "such + (a/an) + sifət + isim: such a nice day, such good friends", "so ... that / such ... that: It was so cold that we stayed in.", "so many / so much + isim"],
    rules: [
      "so isimsiz sifət və ya zərflə: The movie was so boring.",
      "such isimlə: such a boring movie. Tək sayılan isimdə a/an such-dan sonra gəlir.",
      "Sayılmayan və cəm isimlə such artiklsiz: such awful weather, such kind people.",
      "Miqdar üçün so many / so much: There were so many people."
    ],
    azTrap: "Azərbaycan dilində «elə», «o qədər» hər iki halda eynidir: «elə gözəl gün», «elə gözəldir». Buna görə «so nice day», «a such nice day» kimi formalar yaranır. Yadda saxlayın: isim varsa such a, isim yoxdursa so.",
    examples: [
      { en: "I'm so happy to see you!", az: "Səni gördüyümə çox şadam!" },
      { en: "It was such a long journey.", az: "Çox uzun səfər idi." },
      { en: "They are such good neighbors.", az: "Onlar çox yaxşı qonşulardır." },
      { en: "The music was so loud that I couldn't hear anything.", az: "Musiqi elə yüksək idi ki, heç nə eşidə bilmirdim." }
    ],
    wrong: [
      { bad: "It was so nice day.", good: "It was such a nice day.", why: "İsim varsa such a + sifət + isim." },
      { bad: "She is a such kind person.", good: "She is such a kind person.", why: "a such-dan sonra gəlir." },
      { bad: "There were such many people.", good: "There were so many people.", why: "many/much ilə such yox, so işlənir." }
    ],
    exercise: [
      { q: "The exam was ___ difficult!", a: ["so"], hint: "Yalnız sifət" },
      { q: "It was ___ a difficult exam!", a: ["such"], hint: "a + isim" },
      { q: "There were ___ many cars that we couldn't park.", options: ["such", "so", "too"], a: ["so"], hint: "so many" },
      { q: "They have ___ beautiful children.", options: ["so", "such", "such a"], a: ["such"], hint: "Cəm isim, artiklsiz" },
      { q: "Choose the correct sentence.", options: ["He's so a good teacher.", "He's such a good teacher.", "He's a such good teacher."], a: ["He's such a good teacher."], hint: "such a + sifət + isim" }
    ],
    rule_ids: ["so-such"] },

  { id: "linking-words-b1", level: "B1", group: "Bağlayıcılar", title: "Linking words: although, however, because of, so that", az: "Bağlayıcı sözlər: although, however, because of, so that",
    when: "Mətndə fikirləri məntiqli birləşdirmək üçün: zidd fikir (although, however), səbəb (because of, due to), məqsəd (so that, to), ardıcıllıq (first, then, finally).",
    form: ["although + cümlə: Although it was late, we kept working.", "However, + yeni cümlə: It was late. However, we kept working.", "because + cümlə / because of + isim: because of the rain", "so that + cümlə (məqsəd): I left early so that I could catch the bus."],
    rules: [
      "although bir cümlənin içində iki hissəni bağlayır; however isə adətən yeni cümlənin əvvəlində, vergüllə gəlir.",
      "because-dan sonra tam cümlə, because of / due to-dan sonra isim gəlir.",
      "Məqsədi bildirmək üçün to + fel və ya so that işlənir; for + fel işlənmir: I came to help (for help-ing yox).",
      "Ardıcıllıq üçün First, Then, After that, Finally — hər biri adətən vergüllə."
    ],
    azTrap: "Azərbaycan dilində «...görə» həm cümlə, həm də isimlə işlənir: «yağışa görə», «yağış yağdığına görə». Bu, «because the rain» kimi səhvə gətirir. Məqsəd üçün «almaq üçün» birbaşa «for buy» və ya «for to buy» kimi çevrilir; ingiliscə to buy kifayətdir.",
    examples: [
      { en: "Although he was tired, he finished the project.", az: "Yorğun olmasına baxmayaraq, layihəni bitirdi." },
      { en: "The plan was good. However, it was too expensive.", az: "Plan yaxşı idi. Lakin çox baha idi." },
      { en: "The flight was canceled because of the fog.", az: "Duman səbəbindən reys ləğv olundu." },
      { en: "I went to the shop to buy some bread.", az: "Çörək almaq üçün mağazaya getdim." }
    ],
    wrong: [
      { bad: "We stayed home because the rain.", good: "We stayed home because of the rain.", why: "İsimdən əvvəl because of işlənir." },
      { bad: "I came here for learn English.", good: "I came here to learn English.", why: "Məqsəd to + fel ilə verilir." },
      { bad: "It was expensive, however I bought it.", good: "It was expensive. However, I bought it.", why: "however iki cümləni vergüllə birləşdirmir; nöqtə və ya nöqtəli vergül lazımdır." }
    ],
    exercise: [
      { q: "___ it was raining, we went for a walk.", a: ["Although", "Though", "Even though"], hint: "Ziddiyyət, bir cümlə" },
      { q: "The match was canceled because ___ the snow.", a: ["of"], hint: "İsimdən əvvəl" },
      { q: "She saved money ___ buy a car.", options: ["for", "to", "for to"], a: ["to"], hint: "Məqsəd" },
      { q: "The hotel was nice. ___, the food was terrible.", options: ["Although", "However", "Because"], a: ["However"], hint: "Yeni cümlə, ziddiyyət" },
      { q: "Speak slowly ___ everyone can understand you.", options: ["so that", "because", "however"], a: ["so that"], hint: "Məqsəd + cümlə" }
    ],
    rule_ids: ["because-of", "for-purpose", "however-comma", "although-but"] },

  { id: "common-learner-errors", level: "B1", group: "Yazı və durğu", title: "Common learner errors (I am agree, more better, married with)", az: "Azərbaycanlıların tipik səhvləri",
    when: "Bəzi səhvlər ana dilinin birbaşa tərcüməsindən yaranır və orta səviyyədə belə qalır. Bu bölmə ən çox rast gəlinən «kalka» səhvlərini bir yerdə toplayır.",
    form: ["I agree (I am agree yox)", "better / bigger (more better yox)", "married to (married with yox)", "depend on, listen to, wait for, explain to somebody", "make a photo → take a photo; say me → tell me"],
    rules: [
      "agree feldir, be ilə işlənmir: I agree with you. I don't agree.",
      "Müqayisə dərəcəsi bir dəfə göstərilir: better, more interesting (more better yox).",
      "Evlənmək: be married to somebody, marry somebody (married with / marry with yox).",
      "Fel + ön söz birləşmələrini əzbərləyin: depend on, listen to, wait for, explain something to somebody."
    ],
    azTrap: "Bu səhvlərin hamısı Azərbaycan dilinin quruluşundan gəlir: «Mən razıyam» (sifət + -am → I am agree), «daha yaxşı» (more better), «biri ilə evlənmək» (-la/-lə → with), «-dan asılıdır» (depends from), «mənə izah et» (explain me), «şəkil çəkmək» (make a photo). Hər birinin ingilis dilində öz sabit forması var.",
    examples: [
      { en: "I agree with you completely.", az: "Səninlə tam razıyam." },
      { en: "Your English is much better now.", az: "İngilis dilin indi xeyli yaxşıdır." },
      { en: "My sister is married to a doctor.", az: "Bacım bir həkimlə ailəlidir." },
      { en: "Can you explain this rule to me?", az: "Bu qaydanı mənə izah edə bilərsən?" }
    ],
    wrong: [
      { bad: "I am agree with you.", good: "I agree with you.", why: "agree feldir; am lazım deyil." },
      { bad: "This phone is more better than mine.", good: "This phone is better than mine.", why: "better artıq müqayisə formasıdır." },
      { bad: "She got married with an Italian.", good: "She got married to an Italian.", why: "married ilə to işlənir." }
    ],
    exercise: [
      { q: "I ___ with your idea. (razıyam)", a: ["agree"], hint: "be lazım deyil" },
      { q: "He is married ___ my cousin.", a: ["to"], hint: "married to" },
      { q: "It depends ___ the weather.", a: ["on"], hint: "depend on" },
      { q: "Choose the correct sentence.", options: ["Can you explain me the problem?", "Can you explain the problem to me?", "Can you explain to me about the problem?"], a: ["Can you explain the problem to me?"], hint: "explain something to somebody" },
      { q: "Choose the correct sentence.", options: ["Let's make a photo.", "Let's take a photo.", "Let's do a photo."], a: ["Let's take a photo."], hint: "take a photo" }
    ],
    rule_ids: ["am-agree", "double-comparative", "married-with", "explain-to", "make-photo", "dependent-preposition"] }

);
