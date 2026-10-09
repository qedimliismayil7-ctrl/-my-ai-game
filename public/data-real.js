/* =====================================================================
   NUANZA — data-real.js · real tərcümə materialı (Akademiya)

   1) NUANZA_REAL.items — NTREX-128 (Microsoft), newstest2019 ingilis xəbər
      mətnləri və onların dərc olunmuş Azərbaycan dilinə tərcümələri.
      Mənbə: https://github.com/MicrosoftTranslator/NTREX
      Lisenziya: Creative Commons Attribution-ShareAlike 4.0 International
      (CC BY-SA 4.0) — https://creativecommons.org/licenses/by-sa/4.0/
      DƏYİŞİKLİKLƏR: status, səhv annotasiyaları (errors), düzəldilmiş
      tərcümələr (fixed), başlıqlar, ipucları və məsləhətlər Nuanza
      tərəfindən hazırlanıb. Bu uyğunlaşdırılmış material da eyni
      lisenziya — CC BY-SA 4.0 — şərtləri ilə paylaşılır (share-alike).
      Orijinal mətnlər (src, model) dəyişdirilməyib.

   2) NUANZA_REAL.docs — BMT · İnsan Hüquqları haqqında Ümumi Bəyannamə
      (1948), rəsmi ingilis mətni və rəsmi Azərbaycan tərcüməsi (Unicode
      UDHR layihəsi / NLTK udhr2 korpusu vasitəsilə). BMT mətnləri sərbəst
      surətdə çoxaldıla bilər. Rəqəmsallaşdırmadakı 5 aşkar hərf xətası
      düzəldilib (m.6 «subyektliyinin», m.8 «səlahiyyətli», m.11
      «hüququna», m.2 «siyasi», m.30 «Bəyannamədə»); mətn başqa cür
      dəyişdirilməyib. İpucları Nuanzanındır.
   ===================================================================== */
window.NUANZA_REAL = {
 "source": {
  "name": "NTREX-128",
  "by": "Microsoft",
  "licence": "CC BY-SA 4.0",
  "url": "https://github.com/MicrosoftTranslator/NTREX"
 },
 "items": [
  {
   "id": "real-01",
   "level": "B1",
   "words": 21,
   "title": "Harlemdə barlar və kilsələr",
   "domain": "Xəbər · cəmiyyət",
   "status": "flawed",
   "src": "\"Historically, the old people I've talked to say there was a bar and a church on every corner,\" Mr. Adams said.",
   "model": "\"Söhbət etdiyim yaşlı adamlar tarixən hər küncdə bir bar və kilsənin olduğunu deyirdilər\" Cənab Adams dedi.",
   "errors": [
    {
     "w": [
      "deyirdilər"
     ],
     "now": "deyirlər",
     "type": "Məna",
     "why": "Mənbədə «say» indiki zamandadır: yaşlı adamlar bunu indi danışırlar, «deyirdilər» isə keçmişdə təkrarlanan hərəkəti bildirir.",
     "ex": "People say… → İnsanlar deyirlər ki…"
    },
    {
     "w": [
      "Cənab"
     ],
     "now": "cənab",
     "type": "Orfoqrafiya",
     "why": "Müraciət sözü «cənab» cümlənin ortasında kiçik hərflə yazılır.",
     "ex": "…, – deyə cənab Adams bildirdi."
    }
   ],
   "fixed": "\"Söhbət etdiyim yaşlı adamlar deyirlər ki, vaxtilə hər tində bir bar və bir kilsə olub\", – deyə cənab Adams bildirdi."
  },
  {
   "id": "real-02",
   "level": "B1",
   "words": 31,
   "title": "Barlar niyə yoxa çıxır",
   "domain": "Xəbər · cəmiyyət",
   "status": "flawed",
   "src": "He said the disappearance of bars was understandable. \"People socialize in a different way\" nowadays, he said. \"Bars are no longer neighborhood living rooms where people go on a regular basis.\"",
   "model": "O qeyd etdi ki, barların olmaması başa düşülən bir haldır. \"Bugün insanlar fərqli istiqamətdə sosiallaşırlar\", o dedi. “Artıq yaşayış yerlərinin ətrafında insanların daim gedə biləcəyi barlar yoxdur\".",
   "errors": [
    {
     "w": [
      "olmaması"
     ],
     "now": "yoxa çıxması",
     "type": "Məna",
     "why": "«disappearance» prosesdir — barlar tədricən yoxa çıxır; «olmaması» isə sadəcə yoxluq bildirir."
    },
    {
     "w": [
      "Bugün"
     ],
     "now": "Bu gün",
     "type": "Türk forması",
     "why": "«bugün» türk yazılışıdır; Azərbaycan dilində ayrı yazılır: «bu gün» (burada daha yaxşısı — «indi»)."
    },
    {
     "w": [
      "fərqli istiqamətdə"
     ],
     "now": "fərqli şəkildə",
     "type": "Məna",
     "why": "«in a different way» — «başqa cür, fərqli şəkildə»; «istiqamət» isə yön bildirir."
    },
    {
     "w": [
      "insanların daim gedə biləcəyi barlar yoxdur"
     ],
     "now": "barlar artıq insanların müntəzəm getdiyi məhəllə qonaq otağı deyil",
     "type": "Məna",
     "why": "Mənbə barların yox olduğunu demir: onlar artıq məhəllənin «qonaq otağı» rolunu oynamır."
    }
   ],
   "fixed": "O bildirdi ki, barların yoxa çıxması başa düşüləndir. \"İndi insanlar fərqli şəkildə ünsiyyət qururlar\", – dedi. \"Barlar artıq insanların müntəzəm getdiyi məhəllə qonaq otağı deyil\"."
  },
  {
   "id": "real-03",
   "level": "B1",
   "words": 25,
   "title": "Omar ovunda qəfil qışqırıq",
   "domain": "Xəbər · hadisə",
   "status": "flawed",
   "src": "Hammel said at first he thought it was just excitement of catching a lobster, but then he \"realized that he was yelling, 'I got bit!",
   "model": "Hammel əvvəl bunun xərçəng ovlayan oğlanın həyəcanı olduğunu düşündüyünü, sonra isə “onun məni dişlədi!” deyə qışqırdığını anladığını dedi.",
   "errors": [
    {
     "w": [
      "xərçəng"
     ],
     "now": "omar",
     "type": "Termin",
     "why": "«lobster» — «omar»; «xərçəng» çay xərçəngi və ya krab üçün işlənir.",
     "ex": "lobster season → omar ovu mövsümü"
    },
    {
     "w": [
      "onun məni dişlədi"
     ],
     "now": "Məni dişlədi",
     "type": "Məna",
     "why": "«I got bit!» — «Məni dişlədi!»; «onun» yiyəlik formasıdır və cümləni qrammatik cəhətdən pozur."
    }
   ],
   "fixed": "Hammel dedi ki, əvvəlcə bunun sadəcə omar tutmağın həyəcanı olduğunu düşünüb, amma sonra oğlanın “Məni dişlədi!” deyə qışqırdığını anlayıb."
  },
  {
   "id": "real-04",
   "level": "B1",
   "words": 31,
   "title": "Tramp və Kim: ikinci görüş",
   "domain": "Xəbər · siyasət",
   "status": "flawed",
   "src": "He noted that Kim is interested in a second meeting after their initial meeting in Singapore in June was hailed by Trump as a big step toward denuclearization of North Korea.",
   "model": "O bildirib ki, Kim iyun ayında Sinqapurdakı birinci görüşdən sonra ikinci görüşdə də maraqlıdır, bu, Şimali Koreyanın nüvəsizləşdirilməsi istiqamətində atılmış böyük bir addım kimi Tramp tərəfindən yüksək qiymətləndirilib.",
   "errors": [
    {
     "w": [
      "bu,"
     ],
     "now": "həmin görüşü",
     "type": "Məna",
     "why": "«bu» əvəzliyi Kimin marağına aid kimi oxunur, halbuki Trampın yüksək qiymətləndirdiyi Sinqapurdakı ilk görüşdür."
    }
   ],
   "fixed": "O bildirib ki, Kim ikinci görüşdə maraqlıdır; iyun ayında Sinqapurda keçirilən ilk görüşü Tramp Şimali Koreyanın nüvəsizləşdirilməsi istiqamətində atılmış böyük addım kimi yüksək qiymətləndirmişdi."
  },
  {
   "id": "real-05",
   "level": "B1",
   "words": 23,
   "title": "Tramp Şimali Koreya haqqında",
   "domain": "Xəbər · siyasət",
   "status": "flawed",
   "src": "\"We're doing great with North Korea,\" he said. \"We were going to war with North Korea. Millions of people would have been killed.",
   "model": "\"Biz Şimali Koreya ilə böyük iş gördük\", o dedi. \"Şimali Koreya ilə müharibəyə doğru gedirdik. Miyonlarla insanlar öldürüləcəkdi.",
   "errors": [
    {
     "w": [
      "böyük iş gördük"
     ],
     "now": "işlərimiz əla gedir",
     "type": "Məna",
     "why": "«We're doing great» indiki davamlı vəziyyətdir: «işlərimiz əla gedir»; «böyük iş gördük» bitmiş nailiyyət kimi səslənir."
    },
    {
     "w": [
      "Miyonlarla"
     ],
     "now": "Milyonlarla",
     "type": "Orfoqrafiya",
     "why": "Sözdə «l» hərfi düşüb: düzgün yazılış — «milyonlarla»."
    },
    {
     "w": [
      "insanlar öldürüləcəkdi"
     ],
     "now": "insan həlak olacaqdı",
     "type": "Üslub",
     "why": "«milyonlarla» kəmiyyət bildirdiyi üçün isim təkdə işlənir: «milyonlarla insan».",
     "ex": "thousands of people → minlərlə insan"
    }
   ],
   "fixed": "\"Şimali Koreya ilə işlərimiz əla gedir\", – deyə o bildirdi. \"Biz Şimali Koreya ilə müharibəyə gedirdik. Milyonlarla insan həlak olacaqdı."
  },
  {
   "id": "real-06",
   "level": "B1",
   "words": 32,
   "title": "Qapıçının üstündən qol",
   "domain": "Xəbər · idman",
   "status": "flawed",
   "src": "The attempt sailed high above the box as it drifted toward the right top corner of the net. The ball eventually dropped over a leaping Kepa Arrizabalaga and fell into the net.",
   "model": "Cəhd cərimə meydançasından xeyli yuxarıdan “süzüb”, qapı torunun düz yuxarı küncünə tərəf hərəkət etmişdir. Top nəhayət yuxarıya atılan Kepa Arrizabalaqanın üstündən keçib və qapıya düşüb.",
   "errors": [
    {
     "w": [
      "düz"
     ],
     "now": "sağ",
     "type": "Məna",
     "why": "«right top corner» — «sağ yuxarı künc»; «düz» burada istiqaməti itirir."
    },
    {
     "w": [
      "hərəkət etmişdir"
     ],
     "now": "getdi",
     "type": "Üslub",
     "why": "Bir abzasda zaman forması qarışıb: «-mişdir» kitab üslubu, növbəti cümlə isə «keçib» ilə gedir; idman xəbərində sadə keçmiş təbiidir."
    }
   ],
   "fixed": "Zərbə cərimə meydançasının xeyli yuxarısından uçaraq qapının sağ yuxarı küncünə doğru getdi. Top nəhayət sıçrayan Kepa Arrizabalaqanın üstündən keçib tora düşdü."
  },
  {
   "id": "real-08",
   "level": "B1",
   "words": 21,
   "title": "Qadının sualı",
   "domain": "Xəbər · siyasət",
   "status": "ok",
   "src": "\"I'm standing right here in front of you,\" one woman said. \"Do you think he's telling the truth to the country?",
   "model": "\"Mən burada, sizin qarşınızda dayanmışam\", bir qadın dedi. \"Elə bilirsiniz, o, ölkəyə həqiqəti deyir?",
   "hints": [
    "«right here in front of you» — «düz burada, qarşınızda».",
    "«Do you think…?» sualı «Sizcə…?» və ya «Elə bilirsiniz…?» ilə başlaya bilər.",
    "«telling the truth to the country» — «ölkəyə həqiqəti deyir»."
   ],
   "tip": "Qısa dialoqdur: sitat və müəllif sözlərini düzgün ayırın."
  },
  {
   "id": "real-09",
   "level": "B1",
   "words": 20,
   "title": "Futbol: kapitanın oyunu",
   "domain": "Xəbər · idman",
   "status": "flawed",
   "src": "Captain Halkett was immense, marshalling a superbly-organised defence, while Menga kept Connor Goldson and Joe Worrall on their toes throughout.",
   "model": "Kapitan Halket də yaxşı oyun nümayiş etdirir və möhtəşəm mütəşəkkil müdafiəni davam etdirirdi, Menqa isə Konor Qoldson və Co Uorralın ayaqlarında topu tutmasına mane olurdu.",
   "errors": [
    {
     "w": [
      "də"
     ],
     "now": "—",
     "type": "Əlavə",
     "why": "Mənbədə «da/də» («həm də») mənası yoxdur; ədat lazımsız müqayisə yaradır."
    },
    {
     "w": [
      "davam etdirirdi"
     ],
     "now": "idarə edirdi",
     "type": "Məna",
     "why": "«marshalling a defence» — müdafiəni təşkil etmək, idarə etmək deməkdir, «davam etdirmək» yox."
    },
    {
     "w": [
      "ayaqlarında topu tutmasına mane olurdu"
     ],
     "now": "bütün oyun boyu gərginlikdə saxlayırdı",
     "type": "Məna",
     "why": "«kept someone on their toes» idiomdur: «rahat buraxmamaq, daim ayıq saxlamaq»; ayaq və topla bağlı deyil."
    }
   ],
   "fixed": "Kapitan Halket möhtəşəm oynayırdı: o, mükəmməl təşkil olunmuş müdafiəni idarə edirdi, Menqa isə bütün oyun boyu Konor Qoldsonu və Co Uorralı gərginlikdə saxlayırdı."
  },
  {
   "id": "real-10",
   "level": "B1",
   "words": 26,
   "title": "Həbsxanada iğtişaş",
   "domain": "Xəbər · hadisə",
   "status": "flawed",
   "src": "And in October last year riot officers were called to the prison to deal with a serious disturbance in which staff were attacked with pool balls.",
   "model": "Keçən ilin oktyabr ayında heyətə bilyard topları ilə hücum olunduğu ciddi insidentlə bağlı asayiş yaradan polislər həbsxanaya çağırılmışdı.",
   "errors": [
    {
     "w": [
      "asayiş yaradan polislər"
     ],
     "now": "xüsusi təyinatlı polis",
     "type": "Termin",
     "why": "«riot officers» — iğtişaşları yatıran xüsusi təyinatlı polisdir; «asayiş yaradan polislər» termin deyil."
    },
    {
     "w": [
      "insidentlə bağlı"
     ],
     "now": "iğtişaşı yatırmaq üçün",
     "type": "Məna",
     "why": "«to deal with a serious disturbance» — ciddi iğtişaşı yatırmaq məqsədini bildirir; «insidentlə bağlı» həm məqsədi, həm də hadisənin ağırlığını itirir."
    }
   ],
   "fixed": "Keçən ilin oktyabr ayında isə əməkdaşlara bilyard topları ilə hücum edilən ciddi iğtişaşı yatırmaq üçün həbsxanaya xüsusi təyinatlı polis çağırılmışdı."
  },
  {
   "id": "real-11",
   "level": "B1",
   "words": 20,
   "title": "Leysan yağışları və sel təhlükəsi",
   "domain": "Xəbər · hava",
   "status": "flawed",
   "src": "These rains are expected to produce life-threatening flash flooding and debris flows in the deserts, and landslides in mountainous terrain.",
   "model": "Bu yağışların insan ölümünə yol açacaq sel daşqınlarına və səhralarda çöküntü axınına, eyni zamanda dağlıq ərazilərdə torpaq sürüşməsinə səbəb olacağı gözlənilir.",
   "errors": [
    {
     "w": [
      "insan ölümünə yol açacaq"
     ],
     "now": "insan həyatı üçün təhlükəli",
     "type": "Məna",
     "why": "«life-threatening» təhlükə bildirir, ölümün mütləq olacağını yox."
    },
    {
     "w": [
      "çöküntü axınına"
     ],
     "now": "palçıq-daş axınlarına",
     "type": "Termin",
     "why": "«debris flow» — sel zamanı palçıq, daş və qırıntı axınıdır; «çöküntü» geoloji laylar üçün işlənir."
    }
   ],
   "fixed": "Bu yağışların səhralarda insan həyatı üçün təhlükəli qəfil sel daşqınlarına və palçıq-daş axınlarına, dağlıq ərazilərdə isə torpaq sürüşmələrinə səbəb olacağı gözlənilir."
  },
  {
   "id": "real-12",
   "level": "B1",
   "words": 31,
   "title": "Sulavesidə zəlzələ və sunami",
   "domain": "Xəbər · fəlakət",
   "status": "flawed",
   "src": "At least 384 people were killed, many swept away as giant waves crashed onto beaches, when a major earthquake and tsunami hit the Indonesian island of Sulawesi, authorities said on Saturday.",
   "model": "Şənbə günü rəsmilərin verdiyi məlumata görə böyükmiqyaslı zəlzələ və sunaminin İndoneziyanın Sulavesi adasını vurması nəticəsində ən azı 384 nəfər həyatını itirib, çoxunu isə nəhəng dalğalar götürüb sahilə atmışdır.",
   "errors": [
    {
     "w": [
      "götürüb sahilə atmışdır"
     ],
     "now": "aparıb",
     "type": "Məna",
     "why": "«swept away as giant waves crashed onto beaches» — dalğalar sahilə çırpılarkən insanları aparıb; tərcümədə əksinə, dalğalar onları sahilə atır."
    }
   ],
   "fixed": "Rəsmilərin şənbə günü verdiyi məlumata görə, güclü zəlzələ və sunaminin İndoneziyanın Sulavesi adasını vurması nəticəsində ən azı 384 nəfər həlak olub; onların çoxunu sahilə çırpılan nəhəng dalğalar aparıb."
  },
  {
   "id": "real-13",
   "level": "B1",
   "words": 29,
   "title": "Paluda hava limanı",
   "domain": "Xəbər · fəlakət",
   "status": "flawed",
   "src": "The city's airport has been reopened only for relief efforts and will remain closed until Oct. President Joko Widodo was scheduled to visit evacuation centers in Palu on Sunday.",
   "model": "Şəhərin hava limanı yalnız yardım işləri üçün yenidən açılıb və Oktyabr ayına qədər bağlı qalacaq. Prezident Coko Vidodo bazar günü Paludakı evakuasiya mərkəzlərinə səfər planlaşdırıb.",
   "errors": [
    {
     "w": [
      "Oktyabr"
     ],
     "now": "oktyabr",
     "type": "Orfoqrafiya",
     "why": "Ay adları cümlənin ortasında kiçik hərflə yazılır.",
     "ex": "until October → oktyabradək"
    }
   ],
   "fixed": "Şəhərin hava limanı yalnız yardım işləri üçün yenidən açılıb və oktyabr ayına qədər bağlı qalacaq. Prezident Coko Vidodo bazar günü Paludakı evakuasiya mərkəzlərinə səfər planlaşdırıb."
  },
  {
   "id": "real-14",
   "level": "B1",
   "words": 28,
   "title": "Çatdırılmayan mesajlar",
   "domain": "Xəbər · texnologiya",
   "status": "ok",
   "src": "His messages, though, only resulted in one gray check mark, rather than a pair of blue checks. \"I think that means the messages were not delivered,\" he said.",
   "model": "Lakin onun mesajları qoşa mavi işarə ilə deyil, bir boz işarə ilə nəticələnib. “Məncə, bu, o deməkdir ki, mesajlar çatmadı”, o dedi.",
   "hints": [
    "«check mark» — mesajlaşma tətbiqində «işarə» (bəzən «quş» da deyilir).",
    "«rather than» — «…deyil, …» qarşılaşdırması.",
    "«were not delivered» — «çatmayıb, çatdırılmayıb»."
   ],
   "tip": "Gündəlik texnologiya dili: sadə, təbii cümlələr qurun."
  },
  {
   "id": "real-15",
   "level": "B1",
   "words": 28,
   "title": "Süni intellekt və qrin kart",
   "domain": "Xəbər · texnologiya",
   "status": "flawed",
   "src": "\"I think green cards should automatically be offered to PhD's in AI,\" he said. China's State Council issued its Next Generation Artificial Intelligence Development Plan in July 2017.",
   "model": "“Düşünürəm ki, Sİ sahəsində fəlsəfə doktoru dərəcəsi alanlara avtomatik qrin kardlar təklif edilməlidir”, deyə o bildirib. Çin Dövlət Şurası 2017-ci ilin iyulunda Yeni Nəsil Süni İntellekt İnkişafı Planını təqdim edib.",
   "errors": [
    {
     "w": [
      "qrin kardlar"
     ],
     "now": "qrin kart",
     "type": "Orfoqrafiya",
     "why": "Azərbaycan dilində söz «kart» kimi yazılır («bank kartı», «qrin kart»); «kard» yanlış yazılışdır."
    }
   ],
   "fixed": "“Düşünürəm ki, süni intellekt sahəsində fəlsəfə doktoru dərəcəsi alanlara avtomatik olaraq qrin kart təklif edilməlidir”, – deyə o bildirib. Çin Dövlət Şurası 2017-ci ilin iyulunda Yeni Nəsil Süni İntellektin İnkişafı Planını təqdim edib."
  },
  {
   "id": "real-16",
   "level": "B2",
   "words": 48,
   "title": "Uels məclisi üzvlərinin titulu",
   "domain": "Xəbər · siyasət",
   "status": "flawed",
   "src": "There is consternation among some AMs at a suggestion their title should change to MWPs (Member of the Welsh Parliament). It has arisen because of plans to change the name of the assembly to the Welsh Parliament. AMs across the political spectrum are worried it could invite ridicule.",
   "model": "Bəzi məclis üzvləri arasında adlarının Uels Parlamenti Üzvlərinə (UPÜ) dəyişdirilməsini tələb edən təklif ilə bağlı narahatlıq hökm sürür. Bu narahatlıq məclisin adının Uels Parlamenti kimi dəyişdirilməsi planından sonra ortaya çıxıb. Siyasi spektrdə olan Məclis üzvləri bu şəkildə lağa qoyula biləcəklərindən narahatdırlar.",
   "errors": [
    {
     "w": [
      "tələb edən"
     ],
     "now": "irəli sürülən",
     "type": "Məna",
     "why": "«a suggestion» təklifdir, tələb deyil; «tələb edən təklif» mənanı sərtləşdirir."
    },
    {
     "w": [
      "planından sonra"
     ],
     "now": "planı ilə əlaqədar",
     "type": "Məna",
     "why": "«because of plans» səbəb bildirir, zaman ardıcıllığı yox."
    },
    {
     "w": [
      "Siyasi spektrdə olan"
     ],
     "now": "Bütün siyasi spektrdən olan",
     "type": "Buraxma",
     "why": "«across the political spectrum» — narahatlığın bütün partiyalarda olduğunu vurğulayır; «bütün» sözü düşüb."
    }
   ],
   "fixed": "Bəzi məclis üzvləri arasında onların titulunun MWP (Member of the Welsh Parliament — Uels Parlamentinin üzvü) kimi dəyişdirilməsi təklifi çaşqınlıq yaradıb. Bu təklif məclisin adını Uels Parlamenti kimi dəyişmək planları ilə əlaqədar ortaya çıxıb. Bütün siyasi spektrdən olan məclis üzvləri bunun onları gülüş hədəfinə çevirə biləcəyindən narahatdırlar."
  },
  {
   "id": "real-17",
   "level": "B2",
   "words": 44,
   "title": "Yeni titul və uels sözləri",
   "domain": "Xəbər · siyasət",
   "status": "flawed",
   "src": "One Labour AM said his group was concerned \"it rhymes with Twp and Pwp.\" For readers outside of Wales: In Welsh twp means daft and pwp means poo. A Plaid AM said the group as a whole was \"not happy\" and has suggested alternatives.",
   "model": "Məclisdə İşçi Partiyası üzvlərindən biri qeyd edib ki, onun partiyasına görə bu, \"Twp və Pwp kimi səslənir\". Uelsdən olmayan oxucular üçün qeyd edək ki, Uelsdə \"Twp\" axmaq, \"Pwp\" isə nəcis deməkdir. Məclisin Pleyd Partiyasının üzvü ümumilikdə partiya olaraq bu vəziyyətdən məmnun olmadıqlarını və öz təkliflərini də irəli sürdüklərini bildiriblər.",
   "errors": [
    {
     "w": [
      "Uelsdə"
     ],
     "now": "uels dilində",
     "type": "Məna",
     "why": "«In Welsh» — «uels dilində»; «Uelsdə» isə ölkəni, yeri bildirir."
    },
    {
     "w": [
      "bildiriblər"
     ],
     "now": "bildirib",
     "type": "Üslub",
     "why": "Mübtəda təkdir («Pleyd Partiyasının üzvü»), xəbər də təkdə olmalıdır."
    }
   ],
   "fixed": "Məclisdəki leyboristlərdən biri bildirib ki, onun qrupu bu sözün \"Twp və Pwp ilə qafiyələnməsindən\" narahatdır. Uelsdən kənar oxucular üçün: uels dilində \"twp\" axmaq, \"pwp\" isə nəcis deməkdir. Pleyd Kamri partiyasından olan məclis üzvü bildirib ki, qrup ümumilikdə bundan \"məmnun deyil\" və alternativlər təklif edib."
  },
  {
   "id": "real-18",
   "level": "B2",
   "words": 44,
   "title": "MWP və «Muppet» söz oyunu",
   "domain": "Xəbər · siyasət",
   "status": "flawed",
   "src": "A Welsh Conservative said his group was \"open minded\" about the name change, but noted it was a short verbal hop from MWP to Muppet. In this context The Welsh letter w is pronounced similarly to the Yorkshire English pronunciation of the letter u.",
   "model": "Uels Mühafizəkar partiyasının nümayəndəsi bildirib ki, onun partiyası ad dəyişikliyini kifayət qədər normal qarşılayıb, lakin qeyd edilməlidir ki, bu hal Uels Parlamenti Üzvü adından Oyuncaq adına qısa verbal keçiddir. Bu kontekstdə \"Welsh\" sözündəki “w” hərfi Yorkşayr İngilis ləhçəsindəki “u” hərfinə oxşar tələffüz olunur.",
   "errors": [
    {
     "w": [
      "qeyd edilməlidir ki"
     ],
     "now": "qeyd edib ki",
     "type": "Məna",
     "why": "«but noted» — mühafizəkarın özünün qeyd etdiyini bildirir; «qeyd edilməlidir» tərcüməçinin öz şərhinə çevrilib."
    },
    {
     "w": [
      "Oyuncaq"
     ],
     "now": "«Muppet» (kukla, «axmaq»)",
     "type": "Ad",
     "why": "Söz oyunu MWP ilə «Muppet» səs oxşarlığına əsaslanır; «Oyuncaq» yazanda zarafat itir."
    },
    {
     "w": [
      "\"Welsh\" sözündəki"
     ],
     "now": "uels dilindəki",
     "type": "Məna",
     "why": "«The Welsh letter w» — uels dilindəki «w» hərfidir, «Welsh» sözündəki hərf yox."
    }
   ],
   "fixed": "Uels mühafizəkarlarından biri bildirib ki, onların qrupu ad dəyişikliyinə açıq yanaşır, lakin qeyd edib ki, MWP-dən «Muppet»ə (kukla, «axmaq») cəmi bir addımdır. Bu kontekstdə uels dilindəki “w” hərfi Yorkşir ingiliscəsindəki “u” hərfinə oxşar tələffüz olunur."
  },
  {
   "id": "real-19",
   "level": "B2",
   "words": 47,
   "title": "Makedoniyada ad referendumu",
   "domain": "Xəbər · siyasət",
   "status": "flawed",
   "src": "Macedonian President Gjorge Ivanov, an opponent of the plebiscite on the name change, has said he will disregard the vote. However, supporters of the referendum, including Prime Minister Zoran Zaev, argue that the name change is simply the price to pay to join the EU and NATO.",
   "model": "Ad dəyişikliyi ilə bağlı plebisitə etiraz edən Makedoniya prezidenti George İvanov seçkilərə getməyəcəyini bildirib. Lakin Baş Nazir Zoran Zaev də daxil olmaqla referendumun dəstəkçiləri bildirib ki, ad dəyişikliyi Aİ və NATO-ya qoşulmaq üçün ödənilməsi lazım gələn bir bədəldir.",
   "errors": [
    {
     "w": [
      "seçkilərə getməyəcəyini"
     ],
     "now": "səsverməni nəzərə almayacağını",
     "type": "Məna",
     "why": "«disregard the vote» — nəticəni saymamaq deməkdir, seçkiyə getməmək yox; həm də bu, seçki deyil, referendumdur."
    },
    {
     "w": [
      "George"
     ],
     "now": "Gyorge",
     "type": "Ad",
     "why": "Makedoniyalı prezidentin adı «Gjorge»dir, ingiliscə «George» deyil; Azərbaycan mətbuatında — «Gyorge İvanov»."
    },
    {
     "w": [
      "Baş Nazir"
     ],
     "now": "Baş nazir",
     "type": "Orfoqrafiya",
     "why": "Vəzifə adında yalnız ilk söz böyük hərflə yazılır: «Baş nazir»."
    }
   ],
   "fixed": "Ad dəyişikliyi ilə bağlı plebisitin əleyhdarı olan Makedoniya prezidenti Gyorge İvanov səsverməni nəzərə almayacağını bildirib. Lakin Baş nazir Zoran Zaev də daxil olmaqla referendumun tərəfdarları bildirirlər ki, ad dəyişikliyi sadəcə Aİ və NATO-ya qoşulmaq üçün ödənilməli olan bədəldir."
  },
  {
   "id": "real-20",
   "level": "B2",
   "words": 46,
   "title": "Harlemin iki köhnə kilsəsi",
   "domain": "Xəbər · tarix",
   "status": "flawed",
   "src": "Both churches were built by white congregations before Harlem became a black metropolis - Metropolitan Community in 1870, St. Martin's a decade later. The original white Methodist congregation moved out in the 1930s. A black congregation that had been worshiping nearby took title to the building.",
   "model": "Hər iki kilsə Harlem qara metropolis - 1870-ci ildə Metropolitan Cəmiyyəti, on il sonra isə Müqəddəs Martin kilsəsi olmamışdan əvvəl ağlar cəmiyyəti tərəfindən qurulub. Əsl ağ Metodist cəmiyyəti 1930-cu illərdə köç etmişdir. Yaxınlıqda dua edən qara cəmiyyətin nümayəndələri isə kilsəyə ad vermişlər.",
   "errors": [
    {
     "w": [
      "Harlem qara metropolis"
     ],
     "now": "Harlem qaradərililərin metropolisinə çevrilməzdən",
     "type": "Söz sırası",
     "why": "Tarixlər cümlənin ortasına salındığı üçün «Harlem … olmamışdan əvvəl» quruluşu dağılıb və «qara metropolis» yarımçıq qalıb."
    },
    {
     "w": [
      "ağlar cəmiyyəti"
     ],
     "now": "ağdərili icmalar",
     "type": "Termin",
     "why": "«congregation» — dini icma, kilsə camaatıdır; «cəmiyyət» başqa anlayışdır."
    },
    {
     "w": [
      "Əsl"
     ],
     "now": "İlkin",
     "type": "Məna",
     "why": "«original» burada «ilk, əvvəlki» deməkdir, «əsl» yox."
    },
    {
     "w": [
      "kilsəyə ad vermişlər"
     ],
     "now": "binanın mülkiyyətini öz üzərinə götürüb",
     "type": "Məna",
     "why": "«took title to the building» — binaya mülkiyyət hüququ almaq deməkdir; «ad vermək» tam başqa mənadır."
    }
   ],
   "fixed": "Hər iki kilsə Harlem qaradərililərin metropolisinə çevrilməzdən əvvəl ağdərili icmalar tərəfindən tikilib: Metropolitan Community 1870-ci ildə, Müqəddəs Martin kilsəsi isə on il sonra. İlkin ağdərili metodist icması 1930-cu illərdə buradan köçüb. Yaxınlıqda ibadət edən qaradərili icma binanın mülkiyyətini öz üzərinə götürüb."
  },
  {
   "id": "real-21",
   "level": "B2",
   "words": 36,
   "title": "Müqəddəs Martin kilsəsində təmir",
   "domain": "Xəbər · mədəniyyət",
   "status": "flawed",
   "src": "What has played out at St. Martin's over the last few months has been a complicated tale of architects and contractors, some brought in by the lay leaders of the church, others by the Episcopal diocese.",
   "model": "Son bir neçə ay ərzində Müqəddəs Martində ifa olunan hər alət memarların və podratçıların qarmaqarışıq taleyini əks etdirir, bəziləri bu peşə sinfinə aid olmayan kilsə liderləri, digərləri isə Yepiskoplar tərəfindən gətirilib.",
   "errors": [
    {
     "w": [
      "ifa olunan hər alət"
     ],
     "now": "baş verənlər",
     "type": "Məna",
     "why": "«What has played out» — «baş verənlər» deməkdir; «play» burada musiqi ifası deyil."
    },
    {
     "w": [
      "taleyini"
     ],
     "now": "hekayəsini",
     "type": "Məna",
     "why": "«tale» — hekayə, əhvalat; «tale» (qismət) ilə səhv salınıb."
    },
    {
     "w": [
      "bu peşə sinfinə aid olmayan kilsə liderləri"
     ],
     "now": "kilsənin ruhani olmayan rəhbərləri",
     "type": "Termin",
     "why": "«lay leaders» — kilsəni idarə edən, lakin ruhani olmayan şəxslərdir."
    },
    {
     "w": [
      "Yepiskoplar"
     ],
     "now": "Episkopal yeparxiya",
     "type": "Termin",
     "why": "«the Episcopal diocese» — Episkopal kilsəsinin yeparxiyasıdır (inzibati bölgə), «yepiskoplar» yox."
    }
   ],
   "fixed": "Son bir neçə ayda Müqəddəs Martin kilsəsində baş verənlər memarlar və podratçılarla bağlı mürəkkəb bir hekayəyə çevrilib: onların bəzilərini kilsənin ruhani olmayan rəhbərləri, digərlərini isə Episkopal yeparxiya cəlb edib."
  },
  {
   "id": "real-22",
   "level": "B2",
   "words": 38,
   "title": "Kaliforniyada köpəkbalığı hücumu",
   "domain": "Xəbər · hadisə",
   "status": "flawed",
   "src": "A shark attacked and injured a 13-year-old boy Saturday while he was diving for lobster in California on the opening day of lobster season, officials said. The attack occurred just before 7 a.m. near Beacon's Beach in Encinitas.",
   "model": "Rəsmilər bildirdi ki, köpəkbalığı şənbə günü xərçəng mövsümünün açıldığı gün Kaliforniyada xərçəng ovuna çıxmış 13 yaşlı bir oğlana hücum edərək onu yaralayıb. Hadisə Ensinitasda Bekon çimərliyi ətrafında səhər saat 7-dən biraz əvvəl baş verib.",
   "errors": [
    {
     "w": [
      "xərçəng"
     ],
     "now": "omar",
     "type": "Termin",
     "why": "«lobster» — «omar»; «xərçəng» başqa canlıdır.",
     "ex": "lobster season → omar mövsümü"
    },
    {
     "w": [
      "Bekon"
     ],
     "now": "Bikon",
     "type": "Ad",
     "why": "«Beacon» [ˈbiːkən] kimi oxunur: «Bikon çimərliyi»."
    },
    {
     "w": [
      "biraz"
     ],
     "now": "bir az",
     "type": "Türk forması",
     "why": "«biraz» türk yazılışıdır; Azərbaycan dilində ayrı yazılır: «bir az» (burada — «bir qədər»)."
    }
   ],
   "fixed": "Rəsmilər bildirib ki, şənbə günü omar ovu mövsümünün açıldığı gün Kaliforniyada omar tutmaq üçün suya dalan 13 yaşlı oğlana köpəkbalığı hücum edərək onu yaralayıb. Hücum Ensinitasda, Bikon çimərliyi yaxınlığında səhər saat 7-dən bir qədər əvvəl baş verib."
  },
  {
   "id": "real-24",
   "level": "B2",
   "words": 46,
   "title": "Supermarketdə gözəllik guşəsi",
   "domain": "Xəbər · biznes",
   "status": "flawed",
   "src": "We've also invested in specially trained colleagues who will be on hand to offer advice. Our range of brands is designed to suit every need and the alluring environment and convenient locations mean we're now a compelling beauty destination which challenges the old way of shopping.\"",
   "model": "Biz həmçinin öz tövsiyələrini verməyə hazır olan xüsusi təhsilli həmkarlarımıza da investisiya etdik. Bizim brendlər hər ehtiyaca uyğun formada dizayn edilib və cəlbedici mühit və rahat məkanlar indi köhnə alış-veriş tərzinə rəqib çıxacaq qədər sövqedici gözəllik məkana çevrilib\".",
   "errors": [
    {
     "w": [
      "investisiya etdik"
     ],
     "now": "sərmayə qoyduq",
     "type": "Üslub",
     "why": "Azərbaycan dilində sabit birləşmə «investisiya/sərmayə qoymaq»dır; «investisiya etmək» kalkadır."
    },
    {
     "w": [
      "xüsusi təhsilli"
     ],
     "now": "xüsusi təlim keçmiş",
     "type": "Məna",
     "why": "«specially trained» — xüsusi hazırlıq, təlim keçmiş deməkdir; «təhsil» ali/orta təhsili xatırladır."
    },
    {
     "w": [
      "məkana çevrilib"
     ],
     "now": "məkanına çevrilmişik",
     "type": "Məna",
     "why": "Mənbədə «we're now…» — gözəllik məkanına çevrilən şirkətin özüdür, «mühit və məkanlar» yox."
    }
   ],
   "fixed": "Biz həmçinin məsləhət verməyə hər an hazır olan, xüsusi təlim keçmiş əməkdaşlara sərmayə qoyduq. Brend çeşidimiz hər ehtiyaca cavab verəcək şəkildə seçilib; cəlbedici mühit və rahat məkanlar sayəsində biz artıq köhnə alış-veriş tərzinə meydan oxuyan cəlbedici gözəllik məkanına çevrilmişik\"."
  },
  {
   "id": "real-25",
   "level": "B2",
   "words": 34,
   "title": "Aparıcı brenddən ayrılır",
   "domain": "Xəbər · şou-biznes",
   "status": "flawed",
   "src": "Willoughby has no time for their homewear and accessories brand Truly. The pair's business had been likened to Gwyneth Paltrow's Goop brand. This Morning presenter, 37, took to Instagram to announce she is leaving.",
   "model": "Uillobinin onları ev əşyaları və aksesuarlar brendi olan Truly üçün vaxtı yoxdur. Cütlüyün biznesi Qvinet Peltrounun Goop brendinə bənzədildi. “This Morning” (“Bu Səhər”) proqramının 37 yaşlı aparıcısı instagram hesabında ayrıldığını elan edib.",
   "errors": [
    {
     "w": [
      "onları"
     ],
     "now": "onların",
     "type": "Orfoqrafiya",
     "why": "Burada yiyəlik hal lazımdır: «onların … brendi»; «onları» təsirlik haldır."
    },
    {
     "w": [
      "instagram"
     ],
     "now": "Instagram",
     "type": "Ad",
     "why": "Xidmət adı xüsusi addır və böyük hərflə yazılır."
    }
   ],
   "fixed": "Uillobinin onların ev əşyaları və aksesuarlar brendi olan Truly üçün vaxtı yoxdur. Cütlüyün biznesi Qvinet Peltrounun Goop brendinə bənzədilirdi. “This Morning” proqramının 37 yaşlı aparıcısı Instagram hesabında ayrıldığını elan edib."
  },
  {
   "id": "real-26",
   "level": "B2",
   "words": 38,
   "title": "Holli Uillobi və Piter Cons",
   "domain": "Xəbər · şou-biznes",
   "status": "flawed",
   "src": "Holly Willoughby has left Dragons\" Den star Peter Jones fuming by pulling out of their lucrative lifestyle brand business at the last minute - to focus on her own new bumper contracts with Marks & Spencer and ITV.",
   "model": "Holi Uillobi son dəqiqədə Piter Consun gəlirli həyat tərzi brendi ilə bağlı işdən ayrılmasını və Marks & Spencer və ITV ilə yeni müqavilələrinə fokuslanmasını bildirməsi Dragons Den ulduzunun “başından tüstü çıxarıb”.",
   "errors": [
    {
     "w": [
      "Holi Uillobi"
     ],
     "now": "Holli Uillobinin",
     "type": "Ad",
     "why": "«Holly» iki «l» ilə — «Holli»; üstəlik bu, «…bildirməsi» budaq cümləsinin subyektidir və yiyəlik halda olmalıdır."
    },
    {
     "w": [
      "Piter Consun"
     ],
     "now": "Piter Consla birgə",
     "type": "Məna",
     "why": "Biznes ikisinin birgə işidir («their business»), yalnız Piter Consun deyil."
    },
    {
     "w": [
      "yeni müqavilələrinə"
     ],
     "now": "yeni iri müqavilələrinə",
     "type": "Buraxma",
     "why": "«bumper contracts» — çox gəlirli, iri müqavilələrdir; bu çalar tərcümədə düşüb."
    },
    {
     "w": [
      "fokuslanmasını"
     ],
     "now": "diqqət yetirməsini",
     "type": "Üslub",
     "why": "«fokuslanmaq» ingilis/rus kalkasıdır; ədəbi dildə «diqqət yetirmək, cəmləşmək»."
    }
   ],
   "fixed": "Holli Uillobinin son anda Piter Consla birgə qurduqları gəlirli həyat tərzi brendindən çəkilməsi və Marks & Spencer və ITV ilə bağladığı yeni iri müqavilələrə diqqət yetirməsi \"Dragons' Den\" ulduzunun “başından tüstü çıxarıb”."
  },
  {
   "id": "real-27",
   "level": "B2",
   "words": 42,
   "title": "Satışa az qalmış imtina",
   "domain": "Xəbər · biznes",
   "status": "flawed",
   "src": "Her decision to pull out left everyone involved absolutely stunned. Nobody could believe what was happening on Tuesday, it was so close to the launch. There is a warehouse full of goods at the Marlow HQ which are ready to be sold.\"",
   "model": "Onun geri çəkilmə qərarı bütün əməkdaşları təəccübləndirdi. Heç kim çərşənbə axşamı günü başlamağa bu qədər yaxın ikən belə bir hadisənin baş verəcəyinə inanmırdı. Hələ Marlow HQ-də satışa çıxarılmağa hazır olan məhsul dolu anbar var\".",
   "errors": [
    {
     "w": [
      "təəccübləndirdi"
     ],
     "now": "şoka saldı",
     "type": "Üslub",
     "why": "«left everyone absolutely stunned» çox güclü ifadədir; «təəccübləndirdi» onu xeyli zəiflədir."
    },
    {
     "w": [
      "baş verəcəyinə inanmırdı"
     ],
     "now": "baş verənlərə inana bilmirdi",
     "type": "Məna",
     "why": "Mənbə çərşənbə axşamı artıq baş verənlərdən danışır; tərcümədə hadisə gələcəkdə gözlənilən kimi verilib."
    },
    {
     "w": [
      "Marlow HQ-də"
     ],
     "now": "Marlodakı baş ofisdə",
     "type": "Termin",
     "why": "«HQ» — «headquarters», yəni baş ofis/qərargah; ixtisar tərcüməsiz saxlanılmamalıdır."
    }
   ],
   "fixed": "Onun geri çəkilmək qərarı işə cəlb olunmuş hər kəsi tamamilə şoka saldı. Çərşənbə axşamı heç kim baş verənlərə inana bilmirdi — satışın başlanmasına çox az qalmışdı. Marlodakı baş ofisdə satışa hazır məhsullarla dolu anbar var\"."
  },
  {
   "id": "real-28",
   "level": "B2",
   "words": 45,
   "title": "Trampın zarafatı",
   "domain": "Xəbər · siyasət",
   "status": "flawed",
   "src": "He joked about criticism he would get from the news media for making a comment some would consider \"unpresidential\" and for being so positive about the North Korean leader. Why has President Trump given up so much? Trump said in his mock \"news anchor\" voice.",
   "model": "O, bəzilərinin \"prezidentə yaraşmayan\" davranış hesab edəcəyi fikirlərinə və Şimali Koreya lideri barəsində pozitiv yanaşmasına görə xəbər mediasından aldığı tənqidləri lağa qoydu. Nə üçün Prezident Tramp belə çox vaz keçib? Tramp onu tənqid edən xəbər aparıcısının səsini təqlid edərək dedi.",
   "errors": [
    {
     "w": [
      "aldığı tənqidləri"
     ],
     "now": "alacağı tənqidlərə",
     "type": "Məna",
     "why": "«criticism he would get» — gələcəkdə alacağı tənqiddir; Tramp onu qabaqcadan zarafata salır."
    },
    {
     "w": [
      "onu tənqid edən"
     ],
     "now": "—",
     "type": "Əlavə",
     "why": "Mənbədə sadəcə «mock \"news anchor\" voice» var; aparıcının onu tənqid etdiyi əlavə olunub."
    }
   ],
   "fixed": "O, bəzilərinin \"prezidentə yaraşmayan\" hesab edəcəyi fikirlərinə və Şimali Koreya liderinə bu qədər müsbət yanaşmasına görə xəbər mediasından alacağı tənqidlərə zarafatla toxundu. \"Prezident Tramp niyə bu qədər güzəştə gedib?\" – deyə Tramp xəbər aparıcısının səsini yamsılayaraq dedi."
  },
  {
   "id": "real-29",
   "level": "B2",
   "words": 41,
   "title": "Kimlə münasibətlərin nəticələri",
   "domain": "Xəbər · siyasət",
   "status": "flawed",
   "src": "He said his efforts to improve relations with Kim have brought positive results - ending rocket tests, helping free hostages and getting the remains of American servicemen returned home. And he defended his unusual approach in talking about relations with Kim.",
   "model": "O bildirib ki, Kim ilə münasibətlərin inkişaf etdirilməsi istiqamətində göstərilən səylər raket testlərinin sona çatdırılması, girovların azad edilməsi və qalan amerikalı əsgərlərin ölkəyə qaytarılması istiqamətində müsbət nəticələr göstərib. Və o, Kim ilə münasibətləri müzakirə edən zaman onun belə qeyri-adi yanaşmasını müdafiə edib.",
   "errors": [
    {
     "w": [
      "qalan amerikalı əsgərlərin"
     ],
     "now": "amerikalı hərbçilərin qalıqlarının",
     "type": "Məna",
     "why": "«the remains of American servicemen» — həlak olmuş hərbçilərin qalıqlarıdır, «qalan əsgərlər» yox. Ciddi məna səhvi!"
    },
    {
     "w": [
      "raket testlərinin"
     ],
     "now": "raket sınaqlarının",
     "type": "Termin",
     "why": "Hərbi terminologiyada «test» — «sınaq»: «raket sınaqları»."
    },
    {
     "w": [
      "onun belə"
     ],
     "now": "öz",
     "type": "Məna",
     "why": "«onun» Kimə aid kimi oxuna bilər; mənbədə Tramp öz yanaşmasını müdafiə edir."
    },
    {
     "w": [
      "Və o,"
     ],
     "now": "O,",
     "type": "Üslub",
     "why": "Azərbaycan dilində cümləni «Və» ilə başlamaq üslubca zəifdir; ingilis «And» buraxıla bilər."
    }
   ],
   "fixed": "O bildirib ki, Kimlə münasibətləri yaxşılaşdırmaq üçün göstərdiyi səylər müsbət nəticə verib: raket sınaqları dayandırılıb, girovların azad edilməsinə kömək olunub və amerikalı hərbçilərin qalıqları vətənə qaytarılıb. O, Kimlə münasibətlərdən danışarkən öz qeyri-adi yanaşmasını da müdafiə edib."
  },
  {
   "id": "real-30",
   "level": "B2",
   "words": 41,
   "title": "İndoneziya prezidentinin çətinlikləri",
   "domain": "Xəbər · siyasət",
   "status": "flawed",
   "src": "But funding shortfalls have plagued Mr. Joko's administration as he faces re-election next year. Mr. Joko is also facing pressure from lingering sectarian tensions in Indonesia, where members of the Muslim majority have embraced a more conservative form of the faith.",
   "model": "Lakin maliyyə vəsaitinin çatışmazlığı Cənab Cokonun administrasiyanı çətinə salıb, onun gələn il təkrar seçkilər gözləyir. Cənab Coko həm də Müsəlman çoxluğun etiqadının daha mühafizəkar hal aldığı İndoneziyadakı uzunsürən təriqətçi gərginliyin təzyiqləri ilə üzləşir.",
   "errors": [
    {
     "w": [
      "Cənab Cokonun"
     ],
     "now": "cənab Cokonun",
     "type": "Orfoqrafiya",
     "why": "«cənab» cümlənin ortasında kiçik hərflə yazılır."
    },
    {
     "w": [
      "administrasiyanı"
     ],
     "now": "administrasiyasını",
     "type": "Orfoqrafiya",
     "why": "Yiyəlik birləşmədə mənsubiyyət şəkilçisi düşüb: «Cokonun administrasiyasını»."
    },
    {
     "w": [
      "onun gələn il"
     ],
     "now": "onu gələn il",
     "type": "Orfoqrafiya",
     "why": "«gözləyir» feili təsirlik hal tələb edir: «onu … seçkilər gözləyir»."
    },
    {
     "w": [
      "Müsəlman"
     ],
     "now": "müsəlman",
     "type": "Orfoqrafiya",
     "why": "Din mənsubiyyətini bildirən sözlər kiçik hərflə yazılır: «müsəlman çoxluq»."
    }
   ],
   "fixed": "Lakin maliyyə çatışmazlığı cənab Cokonun administrasiyasını çətin vəziyyətə salıb, halbuki onu gələn il təkrar seçkilər gözləyir. Cənab Coko həm də İndoneziyada uzun sürən məzhəb gərginliyinin təzyiqi ilə üzləşir; burada müsəlman çoxluğun nümayəndələri dinin daha mühafizəkar formasını qəbul ediblər."
  },
  {
   "id": "real-31",
   "level": "C1",
   "words": 68,
   "title": "Uels məclisi Parlament olur",
   "domain": "Xəbər · siyasət",
   "status": "flawed",
   "src": "The Government of Wales Act 2017 gave the Welsh assembly the power to change its name. In June, the Commission published the results of a public consultation on the proposals which found broad support for calling the assembly a Welsh Parliament. On the matter of the AMs' title, the Commission favoured Welsh Parliament Members or WMPs, but the MWP option received the most support in a public consultation.",
   "model": "Uels Hökumətinin 2017-ci ilə dair İdarəetmə qanunu Uels məclisinə adını dəyişdirməsi səlahiyyətini vermişdi. İyun ayında Komissiya məclisi Uels Parlamenti kimi adlandırmaq üçün ictimai məsləhətləşmənin nəticələrini dərc etdi, adın dəyişdirilməsi kütlə tərəfindən geniş dəstək aldı. Məclis Üzvlərinə veriləcək ad ilə bağlı Komissiya Uels Parlamenti Üzvləri (WMP) adının lehinə çıxış etdi, lakin ictimai məsləhətləşmədə ən çox dəstəyi MWP (Uels Parlamentinin Üzvləri) seçimi almışdı.",
   "errors": [
    {
     "w": [
      "Uels Hökumətinin 2017-ci ilə dair İdarəetmə qanunu"
     ],
     "now": "2017-ci il tarixli «Uels Hökuməti haqqında» Qanun",
     "type": "Ad",
     "why": "«Government of Wales Act 2017» qanunun rəsmi adıdır: «Uels Hökuməti haqqında» Qanun; «İdarəetmə qanunu» ad deyil."
    },
    {
     "w": [
      "kütlə tərəfindən"
     ],
     "now": "ictimaiyyət tərəfindən",
     "type": "Üslub",
     "why": "«public» rəsmi kontekstdə «ictimaiyyət»dir; «kütlə» mənfi çalarlı, danışıq sözüdür."
    }
   ],
   "fixed": "2017-ci il tarixli «Uels Hökuməti haqqında» Qanun Uels məclisinə öz adını dəyişmək səlahiyyəti verib. İyun ayında Komissiya təkliflərlə bağlı ictimai məsləhətləşmənin nəticələrini dərc edib: məclisin Uels Parlamenti adlandırılması geniş dəstək alıb. Məclis üzvlərinin titulu məsələsində Komissiya «Welsh Parliament Members» (WMP) variantına üstünlük verib, lakin ictimai məsləhətləşmədə ən çox dəstəyi MWP variantı alıb."
  },
  {
   "id": "real-32",
   "level": "C1",
   "words": 62,
   "title": "Qanun layihəsi və konsensus",
   "domain": "Xəbər · siyasət",
   "status": "flawed",
   "src": "AMs are apparently suggesting alternative options, but the struggle to reach consensus could be a headache for the Presiding Officer, Elin Jones, who is expected to submit draft legislation on the changes within weeks. The legislation on the reforms will include other changes to the way the assembly works, including rules on disqualification of AMs and the design of the committee system.",
   "model": "Məclis Üzvləri açıq-aşkar alternativ seçimlər də təklif etməyə davam edir, lakin ortaq məxrəcə gəlmək üçün mübarizə aparmaq bir neçə həftə içində dəyişikliklər ilə bağlı qanun layihəsi hazırlayıb təqdim etməsi gözlənilən vəzifəli şəxs Elin Cons üçün başağrısı ola bilər. İslahatlar ilə bağlı qanun layihəsinə məclisin iş prinispi ilə bağlı dəyişikliklər, o cümlədən məclis üzvlərinin diskvalifikasiyası və komitə sisteminin strukturu ilə bağlı qaydalar da daxil ediləcək.",
   "errors": [
    {
     "w": [
      "açıq-aşkar"
     ],
     "now": "görünür",
     "type": "Məna",
     "why": "«apparently» — «görünür, deyilənə görə»; «açıq-aşkar» isə «aşkarca, ictimai şəkildə» deməkdir."
    },
    {
     "w": [
      "təklif etməyə davam edir"
     ],
     "now": "təklif edir",
     "type": "Əlavə",
     "why": "Mənbədə «davam etmək» mənası yoxdur."
    },
    {
     "w": [
      "vəzifəli şəxs"
     ],
     "now": "Məclisin sədri",
     "type": "Termin",
     "why": "«Presiding Officer» — Uels məclisinin sədridir, ümumi «vəzifəli şəxs» yox."
    },
    {
     "w": [
      "prinispi"
     ],
     "now": "prinsipi",
     "type": "Orfoqrafiya",
     "why": "Hərflərin yeri dəyişib: düzgün yazılış — «prinsip»."
    }
   ],
   "fixed": "Görünür, məclis üzvləri alternativ variantlar təklif edirlər, lakin konsensusa gəlmək çətinliyi bir neçə həftə ərzində dəyişikliklərlə bağlı qanun layihəsini təqdim etməsi gözlənilən Məclisin sədri Elin Cons üçün baş ağrısına çevrilə bilər. İslahatlarla bağlı qanunvericiliyə məclisin iş prinsipinə dair digər dəyişikliklər, o cümlədən məclis üzvlərinin diskvalifikasiyası və komitə sisteminin quruluşu ilə bağlı qaydalar da daxil ediləcək."
  },
  {
   "id": "real-33",
   "level": "C1",
   "words": 69,
   "title": "Şimali Makedoniya adı uğrunda səsvermə",
   "domain": "Xəbər · siyasət",
   "status": "flawed",
   "src": "Voters will vote Sunday on whether to change their country's name to the \"Republic of North Macedonia.\" The popular vote was set up in a bid to resolve a decades-long dispute with neighboring Greece, which has its own province called Macedonia. Athens has long insisted that its northern neighbor's name represents a claim on its territory and has repeatedly objected to its membership bids for the EU and NATO.",
   "model": "Seçicilər bazar günü ölkənin adının \"Şimali Makedoniya Respublikası\"na dəyişdirilməsi ilə bağlı səsvermədə iştirak edəcəklər. Xalq səsverməsi Makedoniya adlı əyaləti olan qonşu Yunanıstan ilə on illərdir davam edən mübahisəni həll etmək məqsədi daşıyır. Afina uzun müddətdir bildirir ki, şimal qonşusunun adı ölkə ərazisindəki əyalətin adını daşıyır və onun Aİ və NATO-ya üzv olmasına dəfələrlə etiraz edib.",
   "errors": [
    {
     "w": [
      "ölkə ərazisindəki əyalətin adını daşıyır"
     ],
     "now": "onun ərazisinə iddia deməkdir",
     "type": "Məna",
     "why": "Afina adın sadəcə eyni olmasından yox, onun Yunanıstan ərazisinə iddia ifadə etməsindən narahatdır — əsas fikir itib."
    }
   ],
   "fixed": "Seçicilər bazar günü ölkənin adının \"Şimali Makedoniya Respublikası\"na dəyişdirilməsi ilə bağlı səs verəcəklər. Ümumxalq səsverməsi Makedoniya adlı öz əyaləti olan qonşu Yunanıstanla onilliklərdir davam edən mübahisəni həll etmək məqsədi daşıyır. Afina uzun müddətdir israr edir ki, şimal qonşusunun adı onun ərazisinə iddia deməkdir və bu ölkənin Aİ və NATO-ya üzvlük cəhdlərinə dəfələrlə etiraz edib."
  },
  {
   "id": "real-34",
   "level": "C1",
   "words": 57,
   "title": "Kilsələrin aktivləri satılır",
   "domain": "Xəbər · cəmiyyət",
   "status": "flawed",
   "src": "As for churches, he worries that the money from selling assets will not last as long as leaders expect it to, \"and sooner or later they'll be right back where they started.\" Churches, he added, could be replaced by apartment buildings with condominiums filled with the kind of people who will not help the neighborhood's remaining sanctuaries.",
   "model": "Kilsələrə gəldikdə isə o, aktivlərin satılmasından gələn gəlirin liderlərin gözlədiyi qədər uzunmüddətli olmayacağından narahatdır və bildirib ki, \"və əvvəl-axır başladıqları yerə geri qayıtmalı olacaqlar\". Əlavə edərək qeyd edib ki, kilsələr ətrafda qalan məbədlərə xeyri dəyməyəcək adamlarla dolu müştərək mülkiyyətli mənzillərdən ibarət binalarla əvəz oluna bilərdi.",
   "errors": [
    {
     "w": [
      "\"və əvvəl-axır"
     ],
     "now": "\"əvvəl-axır",
     "type": "Əlavə",
     "why": "Sitatdan əvvəl artıq «və bildirib ki» var; sitatın içində ikinci «və» təkrardır."
    },
    {
     "w": [
      "əvəz oluna bilərdi"
     ],
     "now": "əvəz oluna bilər",
     "type": "Məna",
     "why": "«could be replaced» burada gələcək ehtimaldır; «bilərdi» isə baş tutmamış keçmiş imkanı bildirir."
    },
    {
     "w": [
      "Əlavə edərək qeyd edib ki"
     ],
     "now": "O əlavə edib ki",
     "type": "Üslub",
     "why": "«əlavə edərək qeyd edib» eyni mənanı iki dəfə deyir."
    }
   ],
   "fixed": "Kilsələrə gəldikdə isə o, aktivlərin satışından gələn pulun liderlərin gözlədiyi qədər uzun müddətə çatmayacağından narahatdır, \"və gec-tez onlar başladıqları yerə qayıdacaqlar\". O əlavə edib ki, kilsələrin yerində məhəllədə qalan məbədlərə kömək etməyəcək insanlarla dolu kondominium mənzilli yaşayış binaları tikilə bilər."
  },
  {
   "id": "real-35",
   "level": "C1",
   "words": 59,
   "title": "Müqəddəs Martin və karilon",
   "domain": "Xəbər · tarix",
   "status": "flawed",
   "src": "St. Martin's was taken over by a black congregation under the Rev. John Howard Johnson, who led a boycott of retailers on 125th Street, a main street for shopping in Harlem, who resisted hiring or promoting blacks. A fire in 1939 left the building badly damaged, but as Father Johnson's parishioners made plans to rebuild, they commissioned the carillon.",
   "model": "Müqəddəs Martin kilsəsi qaradərililərin işə alınmasına və ya irəli çəkilməsinə etiraz edən pərakəndəçilərə qarşı Harlemdə bazarlıq üçün əsas küçələrdən sayılan 125-ci Küçədə boykot etirazının liderlərindən inqilabçı Con Hovard Consonun rəhbərliyi ilə qaraların cəmiyyəti tərəfindən ələ keçirildi. 1939-cu ildə binada baş vermiş yanğın ona son dərəcə ağır zərər vurmuşdu, lakin Conson Atanın prixoda mənsub adamları binanı yenidən bərpa etmək üçün planlar qurdular, onlar karilionu istifadəyə verdilər.",
   "errors": [
    {
     "w": [
      "inqilabçı"
     ],
     "now": "keşiş",
     "type": "Məna",
     "why": "«the Rev.» — «Reverend», ruhani titulu (keşiş, möhtərəm); «revolutionary» ilə səhv salınıb."
    },
    {
     "w": [
      "ələ keçirildi"
     ],
     "now": "öz üzərinə götürüldü",
     "type": "Üslub",
     "why": "«taken over» burada icmanın kilsəni idarəyə götürməsidir; «ələ keçirmək» zorla tutmaq çaları verir."
    },
    {
     "w": [
      "prixoda"
     ],
     "now": "kilsə icmasına",
     "type": "Termin",
     "why": "«prixod» rus sözüdür; «parishioners» — kilsə icmasının üzvləri, dindarlar."
    },
    {
     "w": [
      "istifadəyə verdilər"
     ],
     "now": "sifariş verdilər",
     "type": "Məna",
     "why": "«commissioned the carillon» — karilonu hazırlatmaq üçün sifariş vermək deməkdir."
    }
   ],
   "fixed": "Müqəddəs Martin kilsəsini keşiş Con Hovard Consonun rəhbərlik etdiyi qaradərili icma öz üzərinə götürdü; Conson Harlemin əsas ticarət küçəsi olan 125-ci küçədə qaradərililəri işə götürməkdən və ya vəzifədə irəli çəkməkdən imtina edən pərakəndə satıcılara qarşı boykota rəhbərlik etmişdi. 1939-cu ildə baş verən yanğın binaya ciddi ziyan vurdu, lakin Conson atanın kilsə icmasına mənsub dindarlar binanı bərpa etməyi planlaşdırarkən karilon sifariş verdilər."
  },
  {
   "id": "real-36",
   "level": "C1",
   "words": 63,
   "title": "Karilon — mədəni sərvət",
   "domain": "Xəbər · mədəniyyət",
   "status": "flawed",
   "src": "The expert who played the carillon in July called it something else: \"A cultural treasure\" and \"an irreplaceable historical instrument.\" The expert, Tiffany Ng of the University of Michigan, also noted that it was the first carillon in the world to be played by a black musician, Dionisio A. Lind, who moved to the larger carillon at the Riverside Church 18 years ago.",
   "model": "İyulda karilionu ifa edən mütəxəssis ona başqa adlar da verdi: \"Mədəni sərvət\" və \"əvəzolunmaz tarixi musiqi aləti\". Miçiqan Universitetinin mütəxəssisi Tiffani Nc həmçinin qeyd edib ki, bu, 18 il əvvəl \"Riverside\" (Riversayd) Kilsəsində daha böyük kariliona keçmiş dünyada ilk dəfə qara dərili Dionisio A. Lind tərəfindən ifa olunan karilion idi.",
   "errors": [
    {
     "w": [
      "Nc"
     ],
     "now": "Nq",
     "type": "Ad",
     "why": "«Ng» soyadı Azərbaycan dilində «Nq» kimi verilir; «Nc» səslənməni təhrif edir."
    },
    {
     "w": [
      "qara dərili"
     ],
     "now": "qaradərili",
     "type": "Orfoqrafiya",
     "why": "Mürəkkəb sifət bitişik yazılır: «qaradərili»."
    }
   ],
   "fixed": "İyulda karilonda çalan mütəxəssis onu başqa cür adlandırdı: \"mədəni sərvət\" və \"əvəzolunmaz tarixi musiqi aləti\". Miçiqan Universitetinin mütəxəssisi Tiffani Nq həmçinin qeyd etdi ki, bu, dünyada ilk dəfə qaradərili musiqiçinin — 18 il əvvəl Riversayd kilsəsindəki daha böyük karilona keçmiş Dionisio A. Lindin çaldığı karilon olub."
  },
  {
   "id": "real-37",
   "level": "C1",
   "words": 52,
   "title": "Yaralı oğlan xəstəxanada",
   "domain": "Xəbər · hadisə",
   "status": "flawed",
   "src": "His whole clavicle was ripped open,\" Hammel said he noticed once he got to the boy. \"I yelled at everyone to get out of the water: 'There's a shark in the water!'\" Hammel added. The boy was airlifted to Rady Children's Hospital in San Diego where he is listed in critical condition.",
   "model": "\"Onun körpücük sümüyü tamamilə sınmışdı\", Hammel oğlanı götürən kimi bunu müşahidə etdiyini dedi. \"Mən hər kəsin sudan çıxması üçün qışqırmağa başladım: Suda köpəkbalığı var!\", deyə Hammel əlavə etdi. Oğlan San Dieqo şəhərində \"Rady\" Uşaq Xəstəxanasına çatdırılıb, vəziyyəti ağır olaraq qiymətləndirilib.",
   "errors": [
    {
     "w": [
      "sınmışdı"
     ],
     "now": "yarılmışdı",
     "type": "Məna",
     "why": "«ripped open» — dəri və toxumanın yırtılması, yarılmasıdır; sümük sınığı demək deyil."
    },
    {
     "w": [
      "oğlanı götürən kimi"
     ],
     "now": "oğlanın yanına çatan kimi",
     "type": "Məna",
     "why": "«once he got to the boy» — oğlanın yanına çatanda deməkdir."
    },
    {
     "w": [
      "çatdırılıb"
     ],
     "now": "helikopterlə çatdırılıb",
     "type": "Buraxma",
     "why": "«airlifted» — hava yolu ilə, helikopterlə daşınmaq; bu vacib detal düşüb."
    }
   ],
   "fixed": "\"Onun bütün körpücük sümüyü nahiyəsi yarılmışdı\", – Hammel oğlanın yanına çatan kimi bunu gördüyünü dedi. \"Hamıya qışqırdım ki, sudan çıxsınlar: «Suda köpəkbalığı var!»\" – deyə Hammel əlavə etdi. Oğlan helikopterlə San-Dieqodakı Rady Uşaq Xəstəxanasına çatdırılıb, vəziyyəti kritik qiymətləndirilir."
  },
  {
   "id": "real-38",
   "level": "C1",
   "words": 56,
   "title": "Köpəkbalığının növü naməlumdur",
   "domain": "Xəbər · hadisə",
   "status": "flawed",
   "src": "The species of shark responsible for the attack was unknown. Lifeguard Capt. Larry Giles said at a media briefing that a shark had been spotted in the area a few weeks earlier, but it was determined not to be a dangerous species of shark. Giles added the victim sustained traumatic injuries to his upper torso area.",
   "model": "Hücum edən köpəkbalığının növü naməlumdur. Xilasetmə komandasının kapitanı Larri Cayls mediaya qısaca bildirib ki, köpəkbalığı həmin ərazidə bir neçə həftə əvvəl müəyyən edilib, lakin növünün təhlükəli olmadığı aşkar edilib. Cayls zərərçəkmişin yuxarı ətraflarında travmatik zədələrin olduğunu əlavə edib.",
   "errors": [
    {
     "w": [
      "mediaya qısaca bildirib"
     ],
     "now": "media brifinqində bildirib",
     "type": "Termin",
     "why": "«media briefing» — jurnalistlər üçün brifinqdir; «qısaca» yalançı mənadır."
    },
    {
     "w": [
      "müəyyən edilib"
     ],
     "now": "görülüb",
     "type": "Məna",
     "why": "«had been spotted» — gözə dəyib, görülüb; «müəyyən edilmək» təhqiqat nəticəsini xatırladır."
    },
    {
     "w": [
      "yuxarı ətraflarında"
     ],
     "now": "bədəninin yuxarı hissəsində",
     "type": "Məna",
     "why": "«upper torso» — gövdənin yuxarı hissəsidir; «ətraflar» isə əl və ayaqlardır."
    }
   ],
   "fixed": "Hücum edən köpəkbalığının növü məlum deyil. Xilasedicilərin kapitanı Larri Cayls media brifinqində bildirib ki, bir neçə həftə əvvəl həmin ərazidə köpəkbalığı görülüb, lakin onun təhlükəli növdən olmadığı müəyyən edilib. Cayls əlavə edib ki, zərərçəkənin bədəninin yuxarı hissəsində ağır travmatik xəsarətlər var."
  },
  {
   "id": "real-39",
   "level": "C1",
   "words": 67,
   "title": "Sainsbury's gözəllik bazarına girir",
   "domain": "Xəbər · biznes",
   "status": "flawed",
   "src": "Sainsbury's is taking on Boots, Superdrug and Debenhams with department store-style beauty aisles staffed with specialist assistants. As part of a substantial push into the UK's £2.8bn beauty market, which is continuing to grow while fashion and homeware sales fall back, the larger beauty aisles will be tested out in 11 stores around the country and taken to more stores next year if it proves a success.",
   "model": "Sainbury's mütəxəssis köməkçilərindən ibarət heyəti olan gözəllik məhsulları vitrininə malik mağazaları olan Boots, Superdrug və Debenhams mağazalarını alır. Moda və ev əşyaları satışlarında geriləmə olsa da, böyüməkdə davam edən BK-ın £2.8 milyardlıq gözəllik bazarı üçün əhəmiyyətli bir addım kimi daha geniş gözəllik məhsulları vitrini ölkə ərazisində 11 mağazada sınaqdan keçiriləcək və uğurlu olarsa, növbəti il daha çox mağazalarda yerləşdiriləcək.",
   "errors": [
    {
     "w": [
      "mağazalarını alır"
     ],
     "now": "mağazaları ilə rəqabətə girir",
     "type": "Məna",
     "why": "«is taking on» burada «rəqabətə girmək, meydan oxumaq»dır, satın almaq yox. Ciddi məna səhvi!"
    },
    {
     "w": [
      "Sainbury's"
     ],
     "now": "Sainsbury's",
     "type": "Ad",
     "why": "Şirkət adında «s» hərfi düşüb: «Sainsbury's»."
    },
    {
     "w": [
      "£2.8 milyardlıq"
     ],
     "now": "2,8 milyard funt sterlinqlik",
     "type": "Rəqəm",
     "why": "Azərbaycan dilində onluq kəsr vergüllə yazılır və valyuta adı sözlə verilir."
    },
    {
     "w": [
      "daha çox mağazalarda"
     ],
     "now": "daha çox mağazada",
     "type": "Orfoqrafiya",
     "why": "«çox» kəmiyyət bildirdiyi üçün isim təkdə işlənir: «daha çox mağazada»."
    }
   ],
   "fixed": "Sainsbury's mütəxəssis məsləhətçilərin xidmət göstərdiyi univermaq tipli gözəllik bölmələri ilə Boots, Superdrug və Debenhams ilə rəqabətə girir. Moda və ev əşyaları satışı azalsa da, böyüməkdə davam edən Böyük Britaniyanın 2,8 milyard funt sterlinqlik gözəllik bazarına ciddi addım kimi daha geniş gözəllik bölmələri ölkə üzrə 11 mağazada sınaqdan keçiriləcək və uğurlu olarsa, gələn il daha çox mağazada tətbiq ediləcək."
  },
  {
   "id": "real-40",
   "level": "C1",
   "words": 55,
   "title": "Gözəllik məhsulları iki dəfə artır",
   "domain": "Xəbər · biznes",
   "status": "flawed",
   "src": "Sainsbury's said it would be doubling the size of its beauty offering to up to 3,000 products, including brands such as Revlon, Essie, Tweezerman and Dr. PawPaw for the first time. Existing ranges from L'Oreal, Maybelline and Burt's Bees will also get more space with branded areas similar to those found in shops like Boots.",
   "model": "Sainbury's bildirib ki, onun gözəllik məhsullarının sayı iki dəfə artaraq 3000-ə qədər çatdırılacaq, bu brendlərə ilk dəfə olaraq Revlon, Essie, Tweezerman və Dr. PawPaw da daxil ediləcək. L'Oreal, Maybelline və Burt's Bees silsiləsindən olan brendlər Boots kimi mağazalarda mövcud olanlara bənzər brendlərlə müqayisədə daha çox yerə sahib olacaq.",
   "errors": [
    {
     "w": [
      "Sainbury's"
     ],
     "now": "Sainsbury's",
     "type": "Ad",
     "why": "Şirkət adı səhv yazılıb: «Sainsbury's»."
    },
    {
     "w": [
      "brendlərlə müqayisədə"
     ],
     "now": "brend guşələri ilə",
     "type": "Məna",
     "why": "Mənbədə mövcud brendlərə Boots-dakılar kimi brend guşələri ilə daha çox yer veriləcəyi deyilir; heç bir müqayisə yoxdur."
    }
   ],
   "fixed": "Sainsbury's bildirib ki, gözəllik məhsullarının çeşidini iki dəfə artıraraq 3000-ə çatdıracaq və ilk dəfə Revlon, Essie, Tweezerman və Dr. PawPaw kimi brendləri təklif edəcək. L'Oreal, Maybelline və Burt's Bees-in mövcud çeşidləri də Boots kimi mağazalardakılara bənzər brend guşələri ilə daha çox yer alacaq."
  },
  {
   "id": "real-41",
   "level": "C1",
   "words": 66,
   "title": "Supermarketlər alıcı uğrunda",
   "domain": "Xəbər · biznes",
   "status": "ok",
   "src": "In addition, perfume retailer the Fragrance Shop will be testing out concessions in two Sainsbury's stores, the first of which opened in Croydon, south London, last week while a second opens in Selly Oak, Birmingham, later this year. Online shopping and a shift towards buying small amounts of food daily at local convenience stores means supermarkets are having to do more to persuade people to visit.",
   "model": "Bundan əlavə, ətir pərakəndəçisi Fragrance Shop iki Sainsbury's mağazasında sınaqdan keçiriləcək, birincisi keçən həftə Londonun cənubunda Kroydonda açılmış mağazada, ikincisi isə bu ilin sonlarında Birminqhamda Seli Oakda açılacaq mağazada baş tutacaq. Onlayn alış-veriş və gündəlik yerli mağazalarda kiçik miqdarda ərzaq alışına meyil supermarketlərin insanları ora gətirməyə sövq etmək üçün daha çox iş aparmasını tələb edir.",
   "hints": [
    "«perfume retailer» — «ətir pərakəndəçisi» (və ya «ətir satıcısı»).",
    "Yer adları: Croydon — «Kroydon», Selly Oak — «Selli Ouk».",
    "«convenience stores» — evə yaxın kiçik mağazalar; «yerli mağazalar» kimi vermək olar."
   ],
   "tip": "Uzun cümlələri hissələrə bölün: əvvəl kim, harada, nə vaxt — sonra səbəb."
  },
  {
   "id": "real-42",
   "level": "C1",
   "words": 53,
   "title": "Argos və Habitat strategiyası",
   "domain": "Xəbər · biznes",
   "status": "flawed",
   "src": "Sainsbury's has been putting Argos outlets in hundreds of stores and has also introduced a number of Habitats since it bought both chains two years ago, which it says has bolstered grocery sales and made the acquisitions more profitable. The supermarket's previous attempt to revamp its beauty and pharmacy departments ended in failure.",
   "model": "Sainsbury's yüzlərlə mağazalara Argos outletlərini yerləşdirir və həmçinin iki il əvvəl hər iki zənciri satın aldıqdan bəri bir sıra Habitat mağazalarını təqdim edir, deyilənə görə bu, ərzaq mağazası satışlarını artırmış və satınalmaları daha gəlirli etmişdir. Supermarketin gözəllik və əczaçılıq şöbələrini yeniləmək üçün göstərdiyi əvvəlki cəhdlər uğursuzluqla nəticələnmişdi.",
   "errors": [
    {
     "w": [
      "yüzlərlə mağazalara"
     ],
     "now": "yüzlərlə mağazaya",
     "type": "Orfoqrafiya",
     "why": "«yüzlərlə» kəmiyyət bildirir; ardınca isim təkdə gəlir: «yüzlərlə mağazaya»."
    },
    {
     "w": [
      "outletlərini"
     ],
     "now": "satış nöqtələrini",
     "type": "Termin",
     "why": "«outlet» burada mağaza içində satış nöqtəsidir; «outlet» kalkası lazımsızdır."
    },
    {
     "w": [
      "deyilənə görə"
     ],
     "now": "şirkətin sözlərinə görə",
     "type": "Məna",
     "why": "«which it says» — bunu şirkətin özü deyir; «deyilənə görə» mənbəsiz şayiə kimi səslənir."
    }
   ],
   "fixed": "Sainsbury's iki il əvvəl hər iki şəbəkəni satın aldıqdan bəri yüzlərlə mağazasında Argos satış nöqtələri açır və bir sıra Habitat bölmələri də təqdim edib; şirkətin sözlərinə görə, bu, ərzaq satışlarını artırıb və alınan şirkətləri daha gəlirli edib. Supermarketin gözəllik və aptek şöbələrini yeniləmək üçün əvvəlki cəhdi uğursuzluqla nəticələnmişdi."
  },
  {
   "id": "real-43",
   "level": "C1",
   "words": 52,
   "title": "Aptek biznesinin satışı",
   "domain": "Xəbər · biznes",
   "status": "flawed",
   "src": "The new strategy comes after Sainsbury's sold its 281-store pharmacy business to Celesio, the owner of the Lloyds Pharmacy chain, for £125m, three years ago. It said Lloyds would play a role in the plan, by adding an extended range of luxury skincare brands including La Roche-Posay and Vichy in four stores.",
   "model": "Yeni strategiya Sainsbury's-nin 281 mağazalıq əczaçı biznesini üç il əvvəl 125 milyon funt sterlinqə Lloyds Əczaçılıq zəncirinin sahibi Selesioya satmasının ardınca gəldi. Dörd mağazada La Roche-Posay və Vichy də daxil olmaqla bir sıra lüks dəriyə qulluq məhsullarını əlavə edərək Lloyds-un da planda yer alacağı bildirilib.",
   "errors": [
    {
     "w": [
      "əczaçı biznesini"
     ],
     "now": "aptek biznesini",
     "type": "Termin",
     "why": "«pharmacy business» — aptek biznesidir; «əczaçı» peşə sahibini (pharmacist) bildirir."
    },
    {
     "w": [
      "Lloyds Əczaçılıq"
     ],
     "now": "Lloyds Pharmacy",
     "type": "Ad",
     "why": "Şəbəkənin adı ticarət markasıdır və tərcümə edilmir: «Lloyds Pharmacy»."
    }
   ],
   "fixed": "Yeni strategiya Sainsbury's-in üç il əvvəl 281 mağazadan ibarət aptek biznesini Lloyds Pharmacy şəbəkəsinin sahibi Celesio-ya 125 milyon funt sterlinqə satmasından sonra ortaya çıxıb. Şirkət bildirib ki, Lloyds da dörd mağazada La Roche-Posay və Vichy daxil olmaqla geniş çeşiddə lüks dəriyə qulluq brendləri əlavə etməklə planda iştirak edəcək."
  },
  {
   "id": "real-44",
   "level": "C1",
   "words": 55,
   "title": "Holli Uillobinin prioritetləri",
   "domain": "Xəbər · şou-biznes",
   "status": "flawed",
   "src": "As Willoughby, 37, took to Instagram to announce she was leaving Truly, Jones jetted out of Britain to head for one of his holiday homes. A source said: \"Truly was by far the top of Holly's priorities. It was going to be her long-term future that would see her through the next couple of decades.",
   "model": "37 yaşlı Uillobi instagram hesabında Truly-dən ayrıldığını elan etdikdən sonra Cons Britaniyanı tərk edərək tətil evlərindən birinə yollanıb. Mənbələr bildirir ki, \"Truly Holinin prioritetlərinə daxil deyil. Bu, növbəti bir neçə onillikdə onu təmin edə biləcək uzunmüddətli gələcəyi olacaqdı.",
   "errors": [
    {
     "w": [
      "prioritetlərinə daxil deyil"
     ],
     "now": "prioritetləri arasında açıq-aydın birinci idi",
     "type": "Məna",
     "why": "«was by far the top of Holly's priorities» — Truly onun üçün ən vacib iş idi; tərcümə mənanı tam tərsinə çevirib."
    },
    {
     "w": [
      "Mənbələr bildirir"
     ],
     "now": "Mənbə bildirib",
     "type": "Məna",
     "why": "«A source said» — bir mənbədir və keçmiş zamandadır."
    },
    {
     "w": [
      "Holinin"
     ],
     "now": "Hollinin",
     "type": "Ad",
     "why": "«Holly» iki «l» ilə yazılır: «Holli»."
    }
   ],
   "fixed": "37 yaşlı Uillobi Instagram-da Truly-dən ayrıldığını elan edəndə Cons Britaniyadan çıxıb tətil evlərindən birinə uçdu. Mənbə bildirib: \"Truly Hollinin prioritetləri arasında açıq-aydın birinci idi. Bu, onu növbəti bir neçə onillik təmin edəcək uzunmüddətli gələcəyi olmalı idi."
  },
  {
   "id": "real-45",
   "level": "C1",
   "words": 55,
   "title": "Brendə milyonluq zərər riski",
   "domain": "Xəbər · biznes",
   "status": "flawed",
   "src": "Experts believe the departure of the This Morning presenter, who is among Britain's most bankable stars, could cost the firm millions due to hefty investment in products ranging from cushions and candles to clothing and homewear, and the potential for further delays to its launch. And it could mean the end of a long friendship.",
   "model": "Ekspertlər inanır ki, Britaniyanın ən çox gəlir gətirən ulduzları arasında olan \"This Morning\" proqramının aparıcısının ayrılması yastıq və şamlardan tutmuş ev əşyaları və geyimə qədər məhsul çeşidlərinə etdiyi ciddi investisiyaya və bu məhsulların bazara çıxarılmasında həddən artıq gecikmə müddətinə görə firmaya milyonlarla zərərə başa gələcək. Bu, həmçinin uzunmüddətli dostluğun sona çatması deməkdir.",
   "errors": [
    {
     "w": [
      "həddən artıq gecikmə müddətinə"
     ],
     "now": "əlavə gecikmə ehtimalına",
     "type": "Məna",
     "why": "«the potential for further delays» — yeni gecikmələrin mümkünlüyüdür, «həddən artıq gecikmə» yox."
    },
    {
     "w": [
      "başa gələcək"
     ],
     "now": "başa gələ bilər",
     "type": "Məna",
     "why": "«could cost» ehtimal bildirir; tərcümədə qəti fakta çevrilib."
    },
    {
     "w": [
      "deməkdir"
     ],
     "now": "demək ola bilər",
     "type": "Məna",
     "why": "«it could mean» — ehtimaldır; «deməkdir» qəti hökm verir."
    }
   ],
   "fixed": "Ekspertlər hesab edir ki, Britaniyanın ən çox gəlir gətirən ulduzlarından biri olan \"This Morning\" aparıcısının ayrılması yastıq və şamlardan tutmuş geyim və ev əşyalarına qədər məhsullara qoyulmuş böyük sərmayə və satışın daha da gecikə bilməsi səbəbindən firmaya milyonlarla funta başa gələ bilər. Bu, həm də uzunmüddətli dostluğun sonu demək ola bilər."
  }
 ],
 "docsSource": {
  "name": "İnsan Hüquqları haqqında Ümumi Bəyannamə (1948)",
  "by": "BMT",
  "note": "rəsmi Azərbaycan tərcüməsi",
  "url": "https://www.ohchr.org/en/human-rights/universal-declaration/translations/azerbaijani-azerbaijani"
 },
 "docs": [
  {
   "id": "udhr-1",
   "n": 1,
   "level": "B1",
   "words": 30,
   "title": "Ümumi Bəyannamə — Maddə 1",
   "src": "All human beings are born free and equal in dignity and rights. They are endowed with reason and conscience and should act towards one another in a spirit of brotherhood.",
   "model": "Bütün insanlar ləyaqət və hüquqlarına görə azad və bərabər doğulurlar. Onların şüurları və vicdanları var və bir-birlərinə münasibətdə qardaşlıq ruhunda davranmalıdırlar.",
   "hints": [
    "«dignity» — «ləyaqət».",
    "«born free and equal» — «azad və bərabər doğulurlar».",
    "«in a spirit of brotherhood» — «qardaşlıq ruhunda»."
   ]
  },
  {
   "id": "udhr-2",
   "n": 2,
   "level": "C1",
   "words": 78,
   "title": "Ümumi Bəyannamə — Maddə 2",
   "src": "Everyone is entitled to all the rights and freedoms set forth in this Declaration, without distinction of any kind, such as race, colour, sex, language, religion, political or other opinion, national or social origin, property, birth or other status.\nFurthermore, no distinction shall be made on the basis of the political, jurisdictional or international status of the country or territory to which a person belongs, whether it be independent, trust, non‐self‐governing or under any other limitation of sovereignty.",
   "model": "Hər bir şəxs irqindən, dərisinin rəngindən, cinsindən, dilindən, dinindən, siyasi və digər əqidəsindən, milli və ya sosial mənşəyindən, əmlak, sosial mövqe və digər vəziyyətindən asılı olmayaraq bu Bəyannamədə elan olunmuş bütün hüquq və azadlıqlara malik olmalıdır.\nBundan əlavə, həmin şəxsin mənsub olduğu ölkənin və ya ərazinin, həmin ərazinin müstəqil, qəyyumluq altında olan, özüidarəolunmayan və ya suverenliyi hər hansı şəkildə məhdudlaşmış olmasından asılı olmayaraq, siyasi, hüquqi və beynəlxalq statusundan asılı olaraq heç bir ayrı-seçkilik qoyulmamalıdır.",
   "hints": [
    "«is entitled to» — «…malik olmalıdır / …hüququna malikdir».",
    "«without distinction of any kind» — «…asılı olmayaraq», «heç bir ayrı-seçkilik qoyulmadan».",
    "«trust, non-self-governing» — «qəyyumluq altında olan, özüidarəolunmayan»."
   ]
  },
  {
   "id": "udhr-3",
   "n": 3,
   "level": "B1",
   "words": 12,
   "title": "Ümumi Bəyannamə — Maddə 3",
   "src": "Everyone has the right to life, liberty and the security of person.",
   "model": "Hər bir şəxsin yaşamaq, azadlıq və şəxsi toxunulmazlıq hüququ var.",
   "hints": [
    "«Everyone has the right to…» — «Hər bir şəxsin … hüququ var».",
    "«security of person» — «şəxsi toxunulmazlıq»."
   ]
  },
  {
   "id": "udhr-4",
   "n": 4,
   "level": "B1",
   "words": 21,
   "title": "Ümumi Bəyannamə — Maddə 4",
   "src": "No one shall be held in slavery or servitude; slavery and the slave trade shall be prohibited in all their forms.",
   "model": "Heç kim kölə və ya asılı vəziyyətdə saxlanıla bilməz; quldarlıq və qul ticarəti bütün formalarda qadağan edilir.",
   "hints": [
    "«No one shall be held…» — «Heç kim … saxlanıla bilməz».",
    "«slavery or servitude» — «kölə və ya asılı vəziyyət».",
    "«slave trade» — «qul ticarəti»."
   ]
  },
  {
   "id": "udhr-5",
   "n": 5,
   "level": "B1",
   "words": 16,
   "title": "Ümumi Bəyannamə — Maddə 5",
   "src": "No one shall be subjected to torture or to cruel, inhuman or degrading treatment or punishment.",
   "model": "Heç kim işgəncəyə və ya qəddar, qeyri-insani və ya onun ləyaqətini alçaldan münasibətə və cəzaya məruz qalmamalıdır.",
   "hints": [
    "«torture» — «işgəncə».",
    "«degrading treatment» — «ləyaqəti alçaldan münasibət».",
    "«shall be subjected to» — «məruz qalmamalıdır»."
   ]
  },
  {
   "id": "udhr-6",
   "n": 6,
   "level": "B1",
   "words": 13,
   "title": "Ümumi Bəyannamə — Maddə 6",
   "src": "Everyone has the right to recognition everywhere as a person before the law.",
   "model": "Hər bir şəxs harada olmasından asılı olmayaraq özünün hüquq subyektliyinin tanınması hüququna malikdir.",
   "hints": [
    "«recognition … as a person before the law» — «hüquq subyektliyinin tanınması».",
    "«everywhere» — «harada olmasından asılı olmayaraq»."
   ]
  },
  {
   "id": "udhr-7",
   "n": 7,
   "level": "B2",
   "words": 39,
   "title": "Ümumi Bəyannamə — Maddə 7",
   "src": "All are equal before the law and are entitled without any discrimination to equal protection of the law. All are entitled to equal protection against any discrimination in violation of this Declaration and against any incitement to such discrimination.",
   "model": "Bütün insanlar qanun qarşısında bərabərdirlər və qanun tərəfindən bərabər müdafiə hüququna malikdirlər. Bütün insanlar bu Bəyannaməni pozan hər hansı ayrı-seçkilikdən və belə ayrı-seçkiliyə hər hansı cəhddən bərabər müdafiə olunma hüququna malikdirlər.",
   "hints": [
    "«equal before the law» — «qanun qarşısında bərabər».",
    "«discrimination» — «ayrı-seçkilik».",
    "«incitement» — «təhrik, cəhd»."
   ]
  },
  {
   "id": "udhr-8",
   "n": 8,
   "level": "B1",
   "words": 27,
   "title": "Ümumi Bəyannamə — Maddə 8",
   "src": "Everyone has the right to an effective remedy by the competent national tribunals for acts violating the fundamental rights granted him by the constitution or by law.",
   "model": "Hər bir şəxs Konstitusiyanın və ya qanunun ona verdiyi hüquqların pozulması zamanı səlahiyyətli milli məhkəmələr tərəfindən hüquqlarının bərpa olunması hüququna malikdir.",
   "hints": [
    "«effective remedy» — «hüquqların bərpası».",
    "«competent national tribunals» — «səlahiyyətli milli məhkəmələr»."
   ]
  },
  {
   "id": "udhr-9",
   "n": 9,
   "level": "B1",
   "words": 11,
   "title": "Ümumi Bəyannamə — Maddə 9",
   "src": "No one shall be subjected to arbitrary arrest, detention or exile.",
   "model": "Heç kim özbaşına həbsə, tutulmaya və ya sürgünə məruz qala bilməz.",
   "hints": [
    "«arbitrary arrest» — «özbaşına həbs».",
    "«detention or exile» — «tutulma və ya sürgün»."
   ]
  },
  {
   "id": "udhr-10",
   "n": 10,
   "level": "B2",
   "words": 33,
   "title": "Ümumi Bəyannamə — Maddə 10",
   "src": "Everyone is entitled in full equality to a fair and public hearing by an independent and impartial tribunal, in the determination of his rights and obligations and of any criminal charge against him.",
   "model": "Hər bir şəxs onun hüquq və vəzifələrinin təyini və ona qarşı irəli sürülmüş cinayət ittihamının əsaslılığının müəyyənləşdirilməsi üçün onun işinin müstəqil və bitərəf məhkəmədə, tam bərabərlik əsasında, aşkarlıq və ədalətin bütün tələblərinin gözlənilməsi şəraitində baxılması hüququna malikdir.",
   "hints": [
    "«fair and public hearing» — «işin ədalətli və açıq baxılması».",
    "«independent and impartial tribunal» — «müstəqil və qərəzsiz (bitərəf) məhkəmə».",
    "«criminal charge» — «cinayət ittihamı»."
   ]
  },
  {
   "id": "udhr-11",
   "n": 11,
   "level": "C1",
   "words": 92,
   "title": "Ümumi Bəyannamə — Maddə 11",
   "src": "Everyone charged with a penal offence has the right to be presumed innocent until proved guilty according to law in a public trial at which he has had all the guarantees necessary for his defence.\nNo one shall be held guilty of any penal offence on account of any act or omission which did not constitute a penal offence, under national or international law, at the time when it was committed. Nor shall a heavier penalty be imposed than the one that was applicable at the time the penal offence was committed.",
   "model": "Cinayət törətməkdə ittiham olunan hər bir şəxs günahı ona müdafiə üçün bütün imkanların təmin olunduğu açıq məhkəmə istintaqında qanuni şəkildə sübut olunanadək günahsız hesab edilmək hüququna malikdir.\nHeç bir kəs milli qanunvericilik və ya beynəlxalq hüquqa əsasən törədildiyi zaman cinayət hesab edilməyən hərəkət və ya hərəkətsizlik üçün cinayətdə ittiham oluna bilməz. Eyni zamanda cinayətin törədildiyi zaman tətbiq oluna biləcək cəzadan daha ağırı tətbiq oluna bilməz.",
   "hints": [
    "«presumed innocent» — «günahsız hesab edilmək».",
    "«act or omission» — «hərəkət və ya hərəkətsizlik».",
    "«penal offence» — «cinayət»."
   ]
  },
  {
   "id": "udhr-12",
   "n": 12,
   "level": "B2",
   "words": 38,
   "title": "Ümumi Bəyannamə — Maddə 12",
   "src": "No one shall be subjected to arbitrary interference with his privacy, family, home or correspondence, nor to attacks upon his honour and reputation. Everyone has the right to the protection of the law against such interference or attacks.",
   "model": "Heç kim şəxsi və ailə həyatına müdaxiləyə, evinin toxunulmazlığına, məktublaşmasının gizliliyinə, şərəf və nüfuzuna özbaşına qəsdə məruz qala bilməz. Hər bir şəxsin belə müdaxilə və qəsdən qanun tərəfindən müdafiə olunmaq hüququ var.",
   "hints": [
    "«arbitrary interference» — «özbaşına müdaxilə».",
    "«privacy, family, home or correspondence» — «şəxsi və ailə həyatı, mənzil, yazışma».",
    "«honour and reputation» — «şərəf və nüfuz»."
   ]
  },
  {
   "id": "udhr-13",
   "n": 13,
   "level": "B2",
   "words": 33,
   "title": "Ümumi Bəyannamə — Maddə 13",
   "src": "Everyone has the right to freedom of movement and residence within the borders of each State.\nEveryone has the right to leave any country, including his own, and to return to his country.",
   "model": "Hər bir şəxs hər bir ölkə hüdudunda sərbəst hərəkət etmək və yaşayış yeri seçmək hüququna malikdir.\nHər bir şəxs öz ölkəsi də daxil olmaqla istənilən ölkəni tərk etmək və öz ölkəsinə qayıtmaq hüququna malikdir.",
   "hints": [
    "«freedom of movement and residence» — «sərbəst hərəkət etmək və yaşayış yeri seçmək».",
    "«to leave any country» — «istənilən ölkəni tərk etmək»."
   ]
  },
  {
   "id": "udhr-14",
   "n": 14,
   "level": "B2",
   "words": 44,
   "title": "Ümumi Bəyannamə — Maddə 14",
   "src": "Everyone has the right to seek and to enjoy in other countries asylum from persecution.\nThis right may not be invoked in the case of prosecutions genuinely arising from non‐political crimes or from acts contrary to the purposes and principles of the United Nations.",
   "model": "Hər bir şəxs digər ölkələrdə təqibdən sığınacaq axtarmaq və bu sığınacaqdan istifadə etmək hüququna malikdir.\nBu hüquq həqiqətən də qeyri-siyasi cinayət və ya Birləşmiş Millətlər Təşkilatının məqsəd və prinsiplərinə zidd hərəkət törədilməsinə əsaslanan təqiblər zamanı istifadə oluna bilməz.",
   "hints": [
    "«asylum from persecution» — «təqibdən sığınacaq».",
    "«non-political crimes» — «qeyri-siyasi cinayətlər».",
    "«the United Nations» — «Birləşmiş Millətlər Təşkilatı»."
   ]
  },
  {
   "id": "udhr-15",
   "n": 15,
   "level": "B1",
   "words": 24,
   "title": "Ümumi Bəyannamə — Maddə 15",
   "src": "Everyone has the right to a nationality.\nNo one shall be arbitrarily deprived of his nationality nor denied the right to change his nationality.",
   "model": "Hər bir şəxs vətəndaşlıq hüququna malikdir.\nHeç kim özbaşına olaraq vətəndaşlıqdan və vətəndaşlığını dəyişmək hüququndan məhrum edilə bilməz.",
   "hints": [
    "«nationality» — burada «vətəndaşlıq».",
    "«arbitrarily deprived» — «özbaşına məhrum edilmək»."
   ]
  },
  {
   "id": "udhr-16",
   "n": 16,
   "level": "C1",
   "words": 77,
   "title": "Ümumi Bəyannamə — Maddə 16",
   "src": "Men and women of full age, without any limitation due to race, nationality or religion, have the right to marry and to found a family. They are entitled to equal rights as to marriage, during marriage and at its dissolution.\nMarriage shall be entered into only with the free and full consent of the intending spouses.\nThe family is the natural and fundamental group unit of society and is entitled to protection by society and the State.",
   "model": "Yetkinlik yaşına çatmış kişilər və qadınlar irqi, milli və dini əlamətlərinə görə heç bir məhdudiyyət qoyulmadan nikaha daxil olmaq və ailə qurmaq hüququna malikdirlər. Onlar nikaha daxil olarkən, nikah müddətində və onun pozulması zamanı eyni hüquqlardan istifadə edirlər.\nNikah, nikaha daxil olan hər iki tərəfin azad və tam razılığı olarsa bağlana bilər.\nAilə cəmiyyətin təbii və başlıca qrup vahididir və cəmiyyət və dövlət tərəfindən müdafiə olunma hüququna malikdir.",
   "hints": [
    "«of full age» — «yetkinlik yaşına çatmış».",
    "«to marry and to found a family» — «nikaha daxil olmaq və ailə qurmaq».",
    "«free and full consent» — «azad və tam razılıq»."
   ]
  },
  {
   "id": "udhr-17",
   "n": 17,
   "level": "B1",
   "words": 24,
   "title": "Ümumi Bəyannamə — Maddə 17",
   "src": "Everyone has the right to own property alone as well as in association with others.\nNo one shall be arbitrarily deprived of his property.",
   "model": "Hər bir şəxsin həm təkbaşına, həm də digərləri ilə birlikdə mülkiyyətə sahib olma hüququ var.\nHeç kim özbaşına olaraq mülkiyyətdən məhrum edilə bilməz.",
   "hints": [
    "«to own property» — «mülkiyyətə sahib olmaq».",
    "«alone as well as in association with others» — «həm təkbaşına, həm də başqaları ilə birlikdə»."
   ]
  },
  {
   "id": "udhr-18",
   "n": 18,
   "level": "B2",
   "words": 47,
   "title": "Ümumi Bəyannamə — Maddə 18",
   "src": "Everyone has the right to freedom of thought, conscience and religion; this right includes freedom to change his religion or belief, and freedom, either alone or in community with others and in public or private, to manifest his religion or belief in teaching, practice, worship and observance.",
   "model": "Hər bir şəxs düşüncə, vicdan və din azadlığı hüququna malikdir; bu hüquqa öz dinini və etiqadını dəyişmək azadlığı və öz dininə və inanclarına təhsil, dua və dini və ritual ayinlər zamanı təklikdə və ya başqaları ilə birlikdə, aşkar və ya fərdi şəkildə etiqad etmək azadlığı daxildir.",
   "hints": [
    "«freedom of thought, conscience and religion» — «düşüncə, vicdan və din azadlığı».",
    "«to manifest his religion» — «dinə etiqad etmək».",
    "«worship and observance» — «ibadət və ayinlər»."
   ]
  },
  {
   "id": "udhr-19",
   "n": 19,
   "level": "B2",
   "words": 35,
   "title": "Ümumi Bəyannamə — Maddə 19",
   "src": "Everyone has the right to freedom of opinion and expression; this right includes freedom to hold opinions without interference and to seek, receive and impart information and ideas through any media and regardless of frontiers.",
   "model": "Hər bir şəxs əqidə və onu sərbəst ifadə etmək azadlığı hüququna malikdir; bu hüquqa maneəsiz olaraq əqidəyə malik olmaq və informasiya və ideyaları dövlət sərhədlərindən asılı olmayaraq istənilən vasitələrlə axtarmaq, əldə etmək və yaymaq azadlığı daxildir.",
   "hints": [
    "«freedom of opinion and expression» — «əqidə və onu sərbəst ifadə etmək azadlığı».",
    "«to seek, receive and impart information» — «məlumat axtarmaq, əldə etmək və yaymaq».",
    "«regardless of frontiers» — «sərhədlərdən asılı olmayaraq»."
   ]
  },
  {
   "id": "udhr-20",
   "n": 20,
   "level": "B1",
   "words": 21,
   "title": "Ümumi Bəyannamə — Maddə 20",
   "src": "Everyone has the right to freedom of peaceful assembly and association.\nNo one may be compelled to belong to an association.",
   "model": "Hər bir şəxs dinc yığıncaqlar və assosiasiyalar azadlığı hüququna malikdir.\nHeç bir şəxs hər hansı bir assosiasiyaya qoşulmağa məcbur edilə bilməz.",
   "hints": [
    "«peaceful assembly» — «dinc yığıncaq».",
    "«association» — «assosiasiya, birlik».",
    "«compelled» — «məcbur edilmək»."
   ]
  },
  {
   "id": "udhr-21",
   "n": 21,
   "level": "C1",
   "words": 77,
   "title": "Ümumi Bəyannamə — Maddə 21",
   "src": "Everyone has the right to take part in the government of his country, directly or through freely chosen representatives.\nEveryone has the right of equal access to public service in his country.\nThe will of the people shall be the basis of the authority of government; this will shall be expressed in periodic and genuine elections which shall be by universal and equal suffrage and shall be held by secret vote or by equivalent free voting procedures.",
   "model": "Hər bir şəxs dövlətin idarə olunmasında bilavasitə və ya azad şəkildə seçilmiş nümayəndələr vasitəsilə iştirak etmək hüququna malikdir.\nHər bir şəxs öz ölkəsində dövlət xidmətində qulluq etmək üçün bərabər imkana malik olmaq hüququna malikdir.\nXalqın iradəsi iqtidar hakimiyyətinin əsası olmalıdır; bu iradə öz ifadəsini gizli səsvermə yolu ilə, ümumi və bərabər seçki hüququ və ya səsvermənin azadlığını təmin edən digər eynimənalı formalar əsasında keçirilən mütamadi və saxtalaşdırılmamış seçkilərdə tapmalıdır.",
   "hints": [
    "«directly or through freely chosen representatives» — «bilavasitə və ya azad seçilmiş nümayəndələr vasitəsilə».",
    "«universal and equal suffrage» — «ümumi və bərabər seçki hüququ».",
    "«secret vote» — «gizli səsvermə»."
   ]
  },
  {
   "id": "udhr-22",
   "n": 22,
   "level": "B2",
   "words": 52,
   "title": "Ümumi Bəyannamə — Maddə 22",
   "src": "Everyone, as a member of society, has the right to social security and is entitled to realization, through national effort and international co‐operation and in accordance with the organization and resources of each State, of the economic, social and cultural rights indispensable for his dignity and the free development of his personality.",
   "model": "Hər bir şəxs cəmiyyətin üzvü kimi sosial müdafiə hüququna və milli səylər və beynəlxalq əməkdaşlıq yolu ilə və hər bir dövlətin strukturu və resurslarına uyğun olaraq onun ləyaqətinin müdafiəsi və şəxsiyyətinin azad inkişafı üçün iqtisadi, sosial və mədəni sahələrdə hüquqlara malikdir.",
   "hints": [
    "«social security» — «sosial təminat (müdafiə)».",
    "«international co-operation» — «beynəlxalq əməkdaşlıq».",
    "«free development of his personality» — «şəxsiyyətin azad inkişafı»."
   ]
  },
  {
   "id": "udhr-23",
   "n": 23,
   "level": "C1",
   "words": 86,
   "title": "Ümumi Bəyannamə — Maddə 23",
   "src": "Everyone has the right to work, to free choice of employment, to just and favourable conditions of work and to protection against unemployment.\nEveryone, without any discrimination, has the right to equal pay for equal work.\nEveryone who works has the right to just and favourable remuneration ensuring for himself and his family an existence worthy of human dignity, and supplemented, if necessary, by other means of social protection.\nEveryone has the right to form and to join trade unions for the protection of his interests.",
   "model": "Hər bir şəxsin əmək, sərbəst iş yeri seçmək, ədalətli və yaxşı iş şəraiti və işsizlikdən müdafiə hüququ var.\nHər bir şəxs heç bir ayrı-seçkilik olmadan eyni iş üçün eyni əmək haqqı almaq hüququna malikdir.\nHər bir işləyən şəxs, əməyinin lazım gələrsə digər sosial müdafiə vasitələrilə tamamlanan, onun özünün və ailəsinin layiqli dolanışığını təmin edə bilən ədalətli və qənaətbəxş ödənilməsi hüququna malikdir.\nHər bir şəxsin həmkarlar ittifaqı yaratmaq və öz sosial maraqlarını müdafiə etmək üçün həmkarlar ittifaqlarına daxil olmaq hüququ var.",
   "hints": [
    "«protection against unemployment» — «işsizlikdən müdafiə».",
    "«equal pay for equal work» — «bərabər əməyə görə bərabər haqq».",
    "«trade unions» — «həmkarlar ittifaqları»."
   ]
  },
  {
   "id": "udhr-24",
   "n": 24,
   "level": "B1",
   "words": 19,
   "title": "Ümumi Bəyannamə — Maddə 24",
   "src": "Everyone has the right to rest and leisure, including reasonable limitation of working hours and periodic holidays with pay.",
   "model": "Hər bir şəxsin istirahət və asudə vaxt, o cümlədən iş gününün ağlabatan hüdudu və ödənilən mütamadi məzuniyyət hüququ var.",
   "hints": [
    "«rest and leisure» — «istirahət və asudə vaxt».",
    "«periodic holidays with pay» — «ödənişli mütamadi məzuniyyət»."
   ]
  },
  {
   "id": "udhr-25",
   "n": 25,
   "level": "C1",
   "words": 82,
   "title": "Ümumi Bəyannamə — Maddə 25",
   "src": "Everyone has the right to a standard of living adequate for the health and well‐being of himself and of his family, including food, clothing, housing and medical care and necessary social services, and the right to security in the event of unemployment, sickness, disability, widowhood, old age or other lack of livelihood in circumstances beyond his control.\nMotherhood and childhood are entitled to special care and assistance. All children, whether born in or out of wedlock, shall enjoy the same social protection.",
   "model": "Hər bir şəxs onun özünün və ailəsinin səhhət və rifahını təmin etmək üçün lazım olan, qida, geyim, tibbi xidmət və lazımi sosial təminat da daxil olmaqla həyat səviyyəsi hüququna və işsizlik, xəstəlik, əlillik, dul qalma, qocalıq və ondan asılı olmayan səbəblər üzündən yaşayış vasitələrinin itirilməsi zamanı təminat hüququna malikdir.\nAnalıq və uşaqlıq xüsusi qayğı və yardım almaq hüququna malikdirlər. Həm nikah nəticəsində həm də nikahdan kənar doğulmuş uşaqlar eyni sosial müdafiədən istifadə etməlidirlər.",
   "hints": [
    "«standard of living» — «həyat səviyyəsi».",
    "«widowhood, old age» — «dul qalma, qocalıq».",
    "«born in or out of wedlock» — «nikahda və ya nikahdan kənar doğulmuş»."
   ]
  },
  {
   "id": "udhr-26",
   "n": 26,
   "level": "C1",
   "words": 116,
   "title": "Ümumi Bəyannamə — Maddə 26",
   "src": "Everyone has the right to education. Education shall be free, at least in the elementary and fundamental stages. Elementary education shall be compulsory. Technical and professional education shall be made generally available and higher education shall be equally accessible to all on the basis of merit.\nEducation shall be directed to the full development of the human personality and to the strengthening of respect for human rights and fundamental freedoms. It shall promote understanding, tolerance and friendship among all nations, racial or religious groups, and shall further the activities of the United Nations for the maintenance of peace.\nParents have a prior right to choose the kind of education that shall be given to their children.",
   "model": "Hər bir şəxsin təhsil hüququ var. Ən azı ibtidai və ümumi təhsil pulsuz olmalıdır. İbtidai təhsil icbari olmalıdır. Hər kəs texniki və peşə təhsili almaq imkanına malik olmalıdır, ali təhsil də hər kəsin qabiliyyəti əsasında hamıya eyni dərəcədə müyəssər olmalıdır.\nTəhsil insan şəxsiyyətinin tam inkişafına və insan hüquqları və əsas azadlıqlara hörmətin artırılmasına yönəldilməlidir. Təhsil xalqlar, irqi və dini qruplar arasında qarşılıqlı anlaşmanın, dözümlülüyün və dostluğun möhkəmləndirilməsinə və Birləşmiş Millətlərin sülhü qoruma sahəsində fəaliyyətinə yardım etməlidir.\nValideynlər öz azyaşlı uşaqlarının təhsil növünü seçməkdə üstünlüyə malikdirlər.",
   "hints": [
    "«elementary education shall be compulsory» — «ibtidai təhsil icbari olmalıdır».",
    "«on the basis of merit» — «qabiliyyət əsasında».",
    "«tolerance» — «dözümlülük»."
   ]
  },
  {
   "id": "udhr-27",
   "n": 27,
   "level": "B2",
   "words": 54,
   "title": "Ümumi Bəyannamə — Maddə 27",
   "src": "Everyone has the right freely to participate in the cultural life of the community, to enjoy the arts and to share in scientific advancement and its benefits.\nEveryone has the right to the protection of the moral and material interests resulting from any scientific, literary or artistic production of which he is the author.",
   "model": "Hər bir şəxs cəmiyyətin mədəni həyatında sərbəst iştirak etmək, incəsənətdən həzz almaq, elmi tərəqqidə iştirak etmək və onun faydasından istifadə etmək hüququna malikdir.\nHər bir şəxs müəllifi olduğu elmi, ədəbi, və incəsənət əsərlərinin nəticəsində meydana çıxan maddi və mənəvi mənafelərinin qorunması hüququna malikdir.",
   "hints": [
    "«cultural life of the community» — «cəmiyyətin mədəni həyatı».",
    "«moral and material interests» — «mənəvi və maddi mənafelər»."
   ]
  },
  {
   "id": "udhr-28",
   "n": 28,
   "level": "B1",
   "words": 24,
   "title": "Ümumi Bəyannamə — Maddə 28",
   "src": "Everyone is entitled to a social and international order in which the rights and freedoms set forth in this Declaration can be fully realized.",
   "model": "Hər bir şəxsin bu Bəyannamədə əks olunmuş hüquq və azadlıqların tam təmin olunduğu sosial və beynəlxalq düzüm hüququ var.",
   "hints": [
    "«social and international order» — «sosial və beynəlxalq qayda (düzüm)».",
    "«set forth in this Declaration» — «bu Bəyannamədə əks olunmuş»."
   ]
  },
  {
   "id": "udhr-29",
   "n": 29,
   "level": "C1",
   "words": 95,
   "title": "Ümumi Bəyannamə — Maddə 29",
   "src": "Everyone has duties to the community in which alone the free and full development of his personality is possible.\nIn the exercise of his rights and freedoms, everyone shall be subject only to such limitations as are determined by law solely for the purpose of securing due recognition and respect for the rights and freedoms of others and of meeting the just requirements of morality, public order and the general welfare in a democratic society.\nThese rights and freedoms may in no case be exercised contrary to the purposes and principles of the United Nations.",
   "model": "Hər bir şəxs yalnız onun azad və tam inkişafı mümkün olduğu cəmiyyət qarşısında vəzifələr daşıyır.\nÖz hüquq və azadlıqlarını həyata keçirərkən hər bir şəxs yalnız elə məhdudiyyətlərə məruz qala bilər ki, onlar qanun tərəfindən digərlərinin hüquq və azadlıqlarının tanınması və hörmət olunmasının təmin edilməsi və demokratik cəmiyyətin əxlaqi, ictimai asayiş və ümumi rifah tələblərini ödəmək məqsədilə təyin edilmiş olsun.\nBu hüquq və azadlıqların həyata keçirilməsi Birləşmiş Millətlər Təşkilatının məqsəd və prinsiplərinə zidd olmamalıdır.",
   "hints": [
    "«duties to the community» — «cəmiyyət qarşısında vəzifələr».",
    "«determined by law» — «qanunla müəyyən edilmiş».",
    "«public order and the general welfare» — «ictimai qayda və ümumi rifah»."
   ]
  },
  {
   "id": "udhr-30",
   "n": 30,
   "level": "B2",
   "words": 41,
   "title": "Ümumi Bəyannamə — Maddə 30",
   "src": "Nothing in this Declaration may be interpreted as implying for any State, group or person any right to engage in any activity or to perform any act aimed at the destruction of any of the rights and freedoms set forth herein.",
   "model": "Bu Bəyannamədə heç nə hər hansı dövlətə, şəxslər qrupuna və ayrı-ayrı şəxslərə Bəyannamədə elan olunmuş hüquq və azadlıqların məhvinə yönəlmiş hər hansı fəaliyyətlə məşğul olmaq və ya hər hansı hərəkəti törətmək hüququnun verilməsi kimi təfsir oluna bilməz.",
   "hints": [
    "«Nothing in this Declaration may be interpreted…» — «Bu Bəyannamədə heç nə … kimi təfsir oluna bilməz».",
    "«aimed at the destruction of» — «…məhvinə yönəlmiş»."
   ]
  }
 ]
};
