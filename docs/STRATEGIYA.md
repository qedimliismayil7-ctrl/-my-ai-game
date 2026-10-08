# Nuanza: peşəkar tərcüməçilər üçün yekun plan

*Yoxlanmış versiya, 7 oktyabr 2026. Səy ölçüləri bütün planda belədir: S ≈ 8–15 saat, M ≈ 20–40 saat, L ≈ 60 saatdan çox. Təsisçi həftədə təxminən 15 saat işləyir, yəni bir M işi 1,5–3 həftə çəkir. "Fərziyyə" yazılan rəqəmləri müsahibələr və pilotlar yoxlamalıdır.*

## 1. Baxış

Nuanza Azərbaycan dili ilə işləyən peşəkar tərcüməçinin iş masasıdır, Trados-un daha bir surəti deyil. Bakıda pullu iş CAT alətində başlamır. Müştəri WhatsApp və ya Telegram-da pasportun, diplomun və ya müqavilənin şəklini göndərib "neçəyə, nə vaxta?" soruşur. Sonra sənəd notariusun qəbul edəcəyi formada yığılır. Ad, FİN və tarixlər pasporta, məbləğlər və nömrələr isə orijinal sənədə tam uyğun olmalıdır. Tərcüməçi notariusun yanında imza atır (notarius tərcüməçinin imzasının həqiqiliyini təsdiqləyir), sonra da ödənişi tələb etməli olur.

Nuanza bu zənciri mərhələlərlə əhatə edir. İlk 90 gündə fotodan notariusa hazır `.docx` sənədinə qədər, 4–6-cı aylarda isə messencerdən sifariş qəbulu, qiymət mətni və hesab-faktura. AI qaralamanı yazır, Azərbaycan dilinin sabit qaydaları (şəkilçilər, rəqəmlər, sözlə yazılmış məbləğ, adlar) onu yoxlayır, son sözü isə tərcüməçi deyir. Müştəri sənədləri yalnız ödənişli, məlumatı təlimdə istifadə etməyən AI ilə emal olunur. Məlumatın hansı xidmətlərdən keçdiyi (Cloudflare, Google, Telegram) "Məlumat pasportu"nda açıq yazılır. Gələcəkdə eyni "ölkə paketi" (vətəndaşlıq sənədi şablonları, transliterasiya, notarius qaydaları) Gürcüstan, Özbəkistan və Qazaxıstan üçün də qurula bilər, amma bu, 12-ci aydan əvvəl müzakirə olunmur.

**Bir cümləlik təqdimat:** Nuanza müştərinin göndərdiyi sənəd fotosunu notariusa hazır tərcümə qaralamasına çevirir və adları, tarixləri, rəqəmləri pasporta və orijinala qarşı yoxlayır. Son yoxlamanı və imzanı tərcüməçi edir.

## 2. Kim üçündür

1. **Notarial tərcümə büroları** (notariuslar və ASAN xidmət mərkəzləri yaxınlığında, 3–10 tərcüməçi). İlk ödəyən müştəri olma ehtimalı ən yüksək seqment budur, bunu müsahibələr təsdiqləməlidir.
   - Əsas problem: hər gün eyni pasportu, doğum şəhadətnaməsini və diplomu Word-da sıfırdan cədvəl kimi yığırlar. Bir ad və ya FİN səhvi sənədin notarius və ya konsulluq tərəfindən rədd edilməsinə, yeni tərcüməyə və yeni notarius rüsumuna səbəb olur. Tərcüməçilər arasında ortaq lüğət, ad reyestri və keyfiyyət nəzarəti yoxdur. Çox vaxt bir neçə tərcüməçi eyni kompüterdən istifadə edir.
2. **Sərbəst sertifikatlı tərcüməçilər.** Notarial sənədlərlə yanaşı birbaşa müştəri üçün hüquqi və korporativ mətnlər də tərcümə edirlər.
   - Əsas problem: sifarişlər telefonla, fotolarla gəlir. Sözləri və səhifələri saymaq, qiymət yazmaq hər dəfə əl ilə görülür. Pulsuz və ya şəxsi ChatGPT hesabı ən bahalı yerlərdə (ad, rəqəm, sözlə məbləğ, tərtibat) səhv edir. Ayarlar dəyişdirilməyibsə, müştəri mətni modelin təlimində istifadə oluna bilər və bu, NDA-ya zidd ola bilər.
   - Açıq məhdudiyyət: hüquqi və korporativ mətnlər çox vaxt DOCX kimi gəlir və müştəri formatın qorunmasını gözləyir. İlk 90 gündə Nuanza formatı qoruyaraq geri qaytarmır. Satışda bu, açıq deyilir.
3. **Beynəlxalq agentliklər üçün işləyən frilanserlər** (Trados və memoQ paketləri, USD ilə ödəniş). Bu seqmentə yalnız müsahibələr onların pul ödədiyini göstərsə keçirik.
   - Əsas problem: agentlik eyni faylı (SDLXLIFF/MQXLIFF) teqləri ilə birlikdə geri istəyir. Qlobal alətlər Azərbaycan şəkilçilərini və türk, rus dillərinin təsirini tanımır. Capterra-ya görə Trados Studio-nun bir istifadəçi yeri ayda $52–63-dür (qiymət RWS saytında yoxlanmalı və yoxlama tarixi yazılmalıdır).

Bakıdakı daxili tərcümə komandalarına (neft-qaz şirkətləri, banklar, Big-4) 6-cı aydan sonra baxılacaq. 50-dən çox ödəyən istifadəçi olmadan nazirliklər və digər dövlət qurumları hədəf deyil.

## 3. Nuanza-nı fərqləndirən 3 əsas şey

1. **Notarial zəncir Nuanza-dadır.** Zəncir belədir: foto → OCR → Azərbaycan sənəd şablonu → şəxs dosyesi (MRZ yoxlaması ilə) → tərcüməçinin təsdiq bloku və notarius üçün yer → `.docx`. Qiymət təklifi və hesab 4–6-cı aylarda əlavə olunur. Bizim yoxladığımız qlobal alətlərin heç biri Azərbaycan vətəndaşlıq sənədlərini və notarius prosesini tanımır. Büroda toplanan şablonlar, ad reyestrləri və TM vaxt keçdikcə dəyər yaradır. Buna baxmayaraq istifadəçi öz məlumatını istənilən vaxt JSON və ya TMX kimi apara bilir: etibar bunun üzərində qurulur.
2. **Azərbaycan dili üçün sabit qaydalarla düzgünlük yoxlaması.** Buraya daxildir:
   - şəkilçini tanıyan qlossari (müqavilə → müqaviləsinin);
   - rəqəmdən sonra düzgün şəkilçi (2026-cı il);
   - sözlə yazılmış məbləğin rəqəmlə tutuşdurulması;
   - latın mətnində kiril hərfləri;
   - türk və rus dillərinin təsiri;
   - mənbə ilə hədəf arasında faktlar cədvəli.

   Bunlar AI təxmini deyil, izahı olan qaydalardır. DeepL-in öz API cədvəlində Azərbaycan dili üçün `glossaries:false` yazılıb (https://github.com/DeepLcom/api-docs/blob/main/snippets/language-table.jsx). Satış materialında istifadə etməzdən əvvəl bu yenidən yoxlanmalıdır. memoQ-un termin axtarışı söz formalarını qruplaşdırmır. Qaydaların özünü kopyalamaq olar. Üstünlük onların notarial iş axını və yerli məlumatla birləşməsindədir.
3. **Etibar və messencerdən qəbul.**
   - Ödənişli Gemini səviyyəsi və versiyası sabitlənmiş model.
   - Mətn sorğularında FİN, VÖEN, IBAN, telefon və e-poçt maskalanır. Skan maskalana bilmir: OCR üçün şəkil Google-a tam göndərilir və bu, "Məlumat pasportu"nda açıq yazılır.
   - Skanlar Nuanza serverlərində saxlanılmır: yaddaşda emal olunub silinir.
   - Tərcüməçinin müştəriyə göndərə biləcəyi bir səhifəlik "Məlumat pasportu".

   Sifariş işin başladığı yerdən qəbul olunur. Bakıda müştərilər həm WhatsApp, həm də Telegram işlədir. Hansının üstün olduğunu müsahibələr göstərəcək. Əvvəlki "Telegram ~45%" rəqəmi istifadəçi payı deyil: wmtips Azərbaycan saytlarında hansı messencer vidcetinin quraşdırıldığını sayır və orada WhatsApp 59,9%, Telegram 45%-dir (https://www.wmtips.com/technologies/instant-messaging/country/az/). Ona görə ilk versiyada qəbul PWA "Paylaş" menyusu (Android-də WhatsApp və Telegram-dan birbaşa Nuanza-ya) və fayl yükləmə ilə işləyir. Telegram botu ilə qəbul 4–6-cı aylarda gəlir. Qiymətlər AZN ilədir və pullu CAT alətlərindən xeyli ucuzdur. OmegaT və Matecat kimi pulsuz alətlər də var, onlarla qiymətlə yox, notarial zəncir və AZ yoxlamaları ilə rəqabət aparırıq.

## 4. Tələbə funksiyaları ilə nə edirik

Qərar: funksiyaları gizlətmirik, məhsuldan çıxarırıq. Onlar ~200KB faylı şişirir və bürolara satışda brendi qarışdırır. Ardıcıllıq belədir:
- 1–2-ci həftədə tələbə bölmələri menyudan çıxarılır və onların AI əməliyyatları serverdə bağlanır, beləliklə ödənişli açar oyunlara xərclənmir.
- Kodun fiziki silinməsi və `akademiya-arxiv` git budağına köçürülməsi faylın modullara bölünməsi ilə birlikdə 4–6-cı aylarda edilir. Tək faylda tələsik silmək peşəkar funksiyaları sındıra bilər.

- **Saxlayırıq (peşəkar formada):**
  - Bilik bazası: səhv arxivi, qərar jurnalı, ifadə bankı.
  - Qızıl test dəsti. O, model dəyişikliyindən əvvəl yoxlama dəstinə çevrilir. Üstünə 50 "tələ" seqmenti əlavə olunur: türk sözləri, rəqəmdən sonra şəkilçi, tarix formatları, ad transliterasiyası.
  - Peşəkar simulyator. O, ilk tanışlıqda istifadə olunan 3 nümunə sənədə çevrilir: etibarnamə RU→AZ, doğum şəhadətnaməsi EN→AZ, neft-qaz sahəsində əməyin mühafizəsi (HSE) mətni EN→AZ. Nümunələrdə yalnız uydurma şəxs məlumatları olur və hər səhifədə "NÜMUNƏ" yazılır.
- **Başqa iş üçün istifadə edirik:**
  - Yalançı dostlar siyahısı türk və rus təsirini tutan QA qaydalarına çevrilir.
  - İki qiymətləndiricili AI yoxlaması redaktorun "ikinci göz" yoxlaması olur.
  - Təkrarlanan səhv kartları "mənim tez-tez etdiyim səhvlər" adlı şəxsi QA qaydalarına çevrilir.
  - Bacarıq radarı sonradan büro rəhbəri üçün hər tərcüməçinin səhv profilinə çevrilir.
  - 8 guşəli ulduz medallar seqment statusunu göstərir: boş → AI → TM → redaktə → təsdiq.
  - Xalça haşiyəsi zolağı layihənin irəliləyişini göstərir.
- **Çıxarırıq:** XP və rütbələr, ardıcıl günlər seriyası, öyrənmə yolu, gündəlik dərslər, oyunlar (Sən AI-yə qarşı, Detektiv, Post-redaktə, Kontekst dəyişmə, Sürət, Şifahi tərcümə), nəzəriyyə və testlər. Maskot yalnız loqoda qalır. Universitetlər üçün ayrıca tədris məhsulunu yalnız 50-dən çox ödəyən peşəkar istifadəçi olandan sonra müzakirə etmək olar.

## 5. Ən güclü 10 fikir

Qeyd: "Orta bal" fikir seçimi mərhələsində daxili qiymətləndiricilərin 10 ballıq şkala ilə verdiyi baldır, bazar sübutu deyil.

### 1. Təhlükəsizliyin gücləndirilməsi və NDA-ya uyğun AI — M
Birləşdirilən fikirlər: tech-45, tech-46, ai-18, competition-39. Orta bal 7,5–8.

- **Nə qururuq:**
  - **Açıq qapıların bağlanması:**
    - /setup silinir. Webhook skriptlə, `secret_token` ilə qeydiyyatdan keçirilir. `X-Telegram-Bot-Api-Secret-Token` başlığı uyğun gəlməyən /tg sorğuları rədd edilir.
    - Sessiya yoxdursa, /api 401 qaytarır. Ortaq ACCESS_CODE əvəzinə hər şəxsə ayrıca, ləğv edilə bilən dəvət tokeni verilir. İlk 90 gündə bu token həm də hesab rolunu oynayır, Telegram Login 4-cü ayda gəlir. Token brauzerdə HttpOnly və Secure kukidə (cookie) saxlanılır, localStorage-də yox.
    - Worker hər sorğunu ötürən proksi olmur. O, yalnız icazə verilən əməliyyatları (`pretranslate`, `qa_deep`, `variants`, `ocr_doc` və s.) serverdəki prompt şablonları ilə yerinə yetirir. İstifadəçidən gələn sərbəst prompt qəbul olunmur.
    - İstifadəçi, chat_id və IP üzrə sorğu limitləri qoyulur (Cloudflare Rate Limiting).
    - Gemini açarı və bot tokeni dəyişdirilir və `wrangler secret` ilə saxlanılır. Test və iş mühiti üçün ayrı açarlar olur.
    - Brauzer tərəfi: Content-Security-Policy başlığı qoyulur. AI cavabı və idxal olunan DOCX/PDF mətni heç vaxt `innerHTML` ilə göstərilmir, çünki sənəddəki gizli göstəriş və ya HTML XSS-ə çevrilə bilər. CDN kitabxanaları sabit versiya və SRI həşi ilə yüklənir.
  - **AI qaydaları:**
    - Bütün çağırışlar, bot daxil olmaqla, yalnız ödənişli açarla (`GEMINI_KEY_PAID`) gedir. Bu açar yoxdursa, sistem xəbərsiz pulsuz açara keçmir, aydın xəta göstərir.
    - Model ID-ləri versiyalı formada sabitlənir (`MODEL_PRIMARY`, `MODEL_FAST`). Vacib: Gemini 2.5 Flash Gemini Developer API-da 16 oktyabr 2026-da bağlanır (Vertex AI-da 20 oktyabrda). Ona görə 2.5-i sabitləmək mənasızdır. `MODEL_PRIMARY` kimi hazırda GA statusunda olan 3.x Flash, `MODEL_FAST` kimi 3.1 Flash-Lite seçilir. Dəqiq ID `models.list` ilə yoxlanılır, preview modellər iş mühitində istifadə olunmur.
    - Hər çağırışda `maxOutputTokens` və "düşünmə" büdcəsi açıq verilir. Əks halda düşünmə tokenləri çıxış kimi hesablanır və xərc 2–3 dəfə arta bilər.
    - Sorğu mətni loglanmır, Workers logs-da da. Məlumatların saxlanılmaması (ZDR) üçün müraciət edilir, amma kiçik hesaba verilməyə bilər. Alternativ olaraq Vertex AI qiymətləndirilir (regional emal, məsələn AB regionu, və Google Cloud-un məlumat emalı şərtləri).
    - Gündəlik xərc limiti: ümumi və istifadəçi üzrə sayğac Durable Object-də saxlanılır. KV ardıcıl deyil və eyni anda gələn sorğularda limiti keçməyə imkan verir. Limit dolanda pulsuz plan trafiki dayanır, ödəyənlərə xəbərdarlıq çıxır. Google Cloud büdcə xəbərdarlığı yalnız xəbər verir, xərci dayandırmır, ona görə API kvotası da aşağı salınır.
  - **Brauzerdə maskalama:**
    - FİN, VÖEN, AZ IBAN, +994 telefonlar, e-poçt və kart nömrələri ⟦ID1⟧ kimi yer tutucularla əvəz olunur və cavabdan sonra geri qaytarılır. Hər yer tutucu cavabda düz bir dəfə olmalıdır.
    - Bu, yalnız mətn sorğularına aiddir. Notarial axında OCR üçün şəkil maskalanmadan göndərilir və bu, Məlumat pasportunda yazılır.
    - **Adlar maskalanmır:** yer tutucu şəkilçi qəbul etmir (⟦P2⟧-nin) və transliterasiyanı pozur.
  - **Botda xəbərdarlıq:** "Müştəri sənədlərini bura yapışdırmayın, veb tətbiqdən istifadə edin." 4–6-cı aylarda bot sifariş qəbul edəndə sənəd yalnız `/sifaris` rejimində qəbul olunur, bu rejimdə məlumatın hara getdiyi bir dəfə göstərilir və tərcüməçi təsdiqləyir.
  - **"Məlumat pasportu" (versiyalı):** hansı model işləyir. Ödənişli səviyyədir və mətn təlimdə istifadə olunmur, amma sui-istifadəyə nəzarət üçün Google onu 55 günə qədər saxlaya bilər. Məlumat bu yolla gedir: brauzer → Cloudflare (keçid, saxlamır) → Google Gemini. Telegram yalnız bot işlənəndə bu yola daxil olur. Mətn sorğularında maskalama açıqdır, skan isə maskalanmır. TM və dosyelər hazırda yalnız bu cihazda saxlanılır. Bu dəyişəndə (büro funksiyaları) pasport yenilənir və istifadəçilərə bildirilir. Məlumatı emal edən üçüncü tərəflərin siyahısı: Cloudflare, Google, Telegram, Epoint.
  - **Paylaşılan büro kompüteri:** tətbiqdə PIN kilidi və "Çıxış et və bu cihazdakı məlumatı sil" düyməsi olur, çünki IndexedDB eyni brauzeri açan hər kəsə açıqdır.
- **Niyə vacibdir:**
  - Pulsuz səviyyədə Google sorğulardan məhsullarını yaxşılaşdırmaq üçün istifadə edə bilər, onları insanlar da oxuya bilər (https://ai.google.dev/gemini-api/terms). Bu, tərcüməçinin xəbəri olmadan NDA-nı pozur.
  - Açıq /api həm böyük hesab, həm də nüfuz riskidir.
  - `gemini-flash-latest` ləqəbi xəbərdarlıqsız yeni nəslə keçə bilər. 2.5 Flash 16 oktyabrda bağlanır, yəni 9 gün qalıb (Google-un tərtibatçı forumu; rəsmi https://ai.google.dev/gemini-api/docs/deprecations səhifəsində yoxlanmalıdır).
- **Səy:** M (≈ 20–25 saat), 1–2-ci həftədə.

### 2. Notarial sənəd dəsti — L (M ilə başlayır)
Birləşdirilən fikirlər: workflow-2, competition-40, growth-56 (şablon hissəsi), business-28 (paket). Orta bal 8,5, siyahıda ən yüksək baldır.

- **Nə qururuq:**
  - **Axın:** foto və ya skan gəlir. Gemini vision (ödənişli səviyyə, sabitlənmiş 3.x Flash) sənədin növünü təyin edir və sahələri sərt JSON sxeminə çıxarır. Şəkil Google-a maskalanmadan gedir (fikir 1-ə bax). Nəticə orijinalın düzülüşünü təkrarlayan A4 cədvəlinə düşür və real `.docx` faylı yaranır (HTML-dən düzəldilmiş .doc yox, `w:lang=az-Latn-AZ` ilə). Eyni `.docx` generatoru sonra bütün çatdırılan fayllar üçün də işlənir.
  - **İlk şablonlar:**
    - 90 gündə 2 şablon bir istiqamətdə: şəxsiyyət vəsiqəsi və doğum haqqında şəhadətnamə;
    - 4-cü ayda diplom və diplom əlavəsi (fənn / kredit / qiymət sətirləri, "əla" kimi qiymət sözlərinin sabit qarşılığı).
  - **Sahə adları** AZ/EN/RU/TR dillərində əvvəlcədən tərcümə olunub və kilidli TM kimi saxlanılır.
  - **Möhür və imza qeydləri** avtomatik qoyulur: [Gerb]/[Coat of arms]/[Герб], [Dəyirmi möhür: "…"], [İmza], [QR kod]. Oxunmayan yerlər üçün [oxunmur]/[illegible]/[неразборчиво] işlənir. Möhür mətnini AI uydurmur: mətn ya OCR-dan gəlir və tərcüməçi təsdiqləyir, ya da tərcüməçi özü yazır.
  - **Sənədin sonunda:** tərcüməçinin iki dildə təsdiq bəyanatı (ad, diplom nömrəsi, dil cütü), notarius üçün boş yer və notariusun standart mətni. Bu mətni hər tərcüməçi (büroda isə büro) bir dəfə saxlayır, çünki ofislər onu fərqli yazır.
  - **Notarius tələbləri (yeni, 2–3 notariusla yoxlanılır):** səhifə nömrələnməsi ("Səhifə 1/3"), tərcümənin orijinalın surətinə tikilməsi, tərcüməçinin hər səhifədə imzası tələb olunurmu, şrift və kənar boşluqları, ikidilli sənədlərin necə tərcümə olunduğu, tərcüməçinin notariusa təqdim etdiyi sənədlər (şəxsiyyət vəsiqəsi, diplom).
  - **OCR yoxlama ekranı:** şəkil və sahə yanaşı görünür, OCR-ın əmin olmadığı sahələr sarı rənglə işarələnir.
  - **Sonrakı şablonlar:** nikah və boşanma şəhadətnaməsi, attestat, məhkumluq haqqında arayış, sürücülük vəsiqəsi, etibarnamə, Türkiyənin nüfus qeydiyyatı çıxarışı (Nüfus Kayıt Örneği) → AZ, apostilin 10 sahəli bloku.
- **Niyə vacibdir:** bu, Bakı bazarında ən çox təkrarlanan pullu işdir. Dörd daxili qiymətləndiricinin dördü də 7–9 bal verib. ChatGPT tərtibatı olmayan sərbəst mətn verir və möhür mətnini uydurur. Hədəf (fərziyyə): günün eyni tipli ikinci sənədi 3–5 dəqiqəyə hazır olsun. İlkin vaxt müsahibələrdə ölçülür.
- **Səy:** tam həcmdə L. 90 gündə: bir istiqamətdə 2 şablon, OCR yoxlama ekranı və `.docx` generatoru, ≈ 28 saat (M). İstiqamət 4-cü həftənin sonunda müsahibələrə görə seçilir, məsələn AZ→EN və ya AZ→RU. Başlamazdan əvvəl 20 real skanda OCR testi aparılır.

### 3. Şəxs dosyesi və MRZ yoxlaması — M
Birləşdirilən fikirlər: workflow-3, competition-40 (şəxs kartı), business-28 (ad reyestri). Orta bal 8,0.

- **Nə qururuq:**
  - **Dosye:** hər sifarişdə bir və ya bir neçə dosye olur və pasport və ya ŞV-nin OCR nəticəsindən avtomatik doldurulur. İçində:
    - Azərbaycan əlifbası ilə tam ad;
    - pasportdakı latın yazılışı. Vizual hissədəki yazılış (Ə, Ş kimi hərflərlə) MRZ-dəki diakritikasız transliterasiyadan fərqlənə bilər. Hər sifarişdə hansının işlənəcəyini tərcüməçi bir dəfə seçir (məsələn, xarici universitet MRZ formasını istəyə bilər) və seçim bütün sənədlərdə kilidlənir;
    - rus və türk yazılışları;
    - ata adının necə yazılacağı: EN "Elchin oglu" və ya "son of Elchin", RU "Эльчин оглы". Hər müştəri üçün bir dəfə seçilir;
    - FİN (7 simvol), sənədin seriyası və nömrəsi;
    - doğum tarixi və yeri, sabit yer adları ilə: Bakı → Baku / Баку / Bakü.
  - **MRZ yoxlaması:** MRZ varsa (ŞV-də TD1, 3 sətir; pasportda TD3, 2 sətir), ICAO 9303 nəzarət rəqəmləri (7-3-1) ilə yoxlanılır. Bu, O/0, I/1, S/5 kimi OCR səhvlərini AI olmadan tutur (təxminən 50 sətir kod).
  - **Sərt QA qaydası:** sifarişin bütün sənədlərində şəxsin adı hər dəfə dosyedəki ilə simvol-simvol eyni olmalıdır. Tarix hər formatda yoxlanılır: 07.10.2026 / October 7, 2026 / 7 октября 2026 г.
  - **Pasport olmayanda:** transliterasiya yalnız təklif verir, tərcüməçi bir dəfə təsdiqləyir. AZ→RU qaydaları (xüsusən Ə→А/Э) səhvə meyillidir.
  - **Saxlama və razılıq:** dosye FİN və pasport məlumatı olan fərdi məlumatdır. İlk versiyada yalnız bu cihazda (IndexedDB) saxlanılır və avtomatik silinmə müddəti var (məsələn, 12 ay, ayarda dəyişir). "Təkrar müştəri" funksiyası (gələn il dosyenin yenidən istifadəsi) yalnız sifarişdə "dosyeni saxla" seçiləndə, yəni müştəri razılıq verəndə işləyir.
- **Niyə vacibdir:** notarius, konsulluq və universitet ilk olaraq adı yoxlayır. ChatGPT isə pasportdakı yazılışı həvəslə "düzəldir". Bu yoxlama ən bahalı notarial səhvin qarşısını alır və nəticəsi ölçülə bilər.
- **Səy:** M. 90 gündə dosye, MRZ və ad kilidi ≈ 14 saat.

### 4. Azərbaycan QA paketi — S → M
Birləşdirilən fikirlər: workflow-5, competition-37, ai-21, ux-11 (diakritik hissəsi). Orta bal 6,8–7,5.

- **Nə qururuq:** brauzerdə işləyən qaydalar. API xərci yoxdur. Qaydalar hər AI cavabında və tərcüməçinin öz mətnində işləyir. Hər qaydanın Azərbaycan dilində izahı və bir kliklə düzəlişi var.
  - **İlk buraxılışda 5 qayda:**
    1. Rəqəmdən və abreviaturadan sonra şəkilçi rəqəmin deyilişinə görə seçilir: 1-ci, 3-cü, 6-cı, 9-cu, 40-cı, 100-cü, 2026-cı il, 5-də, BMT-nin. Bunun üçün 20 sətirlik cədvəl kifayətdir.
    2. Sözlə yazılmış məbləğ rəqəmlə tutuşdurulur və lazım olanda yaradılır, AZ/RU/EN/TR dillərində, qəpik və kopeyka daxil: "1 500 (min beş yüz) manat".
    3. Latın sözlərinin içindəki kiril а/е/о/р/с/х/у hərfləri tapılır. ə-nin səhv variantları (ä U+00E4, ǝ U+01DD) U+0259-a, Ə-nin səhv variantları (Ǝ U+018E, Ä U+00C4) U+018F-ə çevrilir.
    4. Böyük hərflər `toLocaleUpperCase('az')` ilə yazılır, beləliklə İ/I qarışmır.
    5. Türk dilinin təsiri tutulur: mövcud yalançı dostlar siyahısından "için", "değil", "ile", "şirket", "sözleşme", -yor, -mak/-mek, %5 kimi türk formaları (Azərbaycan dilində 5%). Ən çox rast gəlinən 20 türk forması həm də promptdakı "heç vaxt işlətmə" siyahısına əlavə olunur.
  - **Sonra:** rus kalkaları ("tərəfindən" sözünün həddindən artıq işlənməsi, "hansı ki"), yerli formatlar, itmiş diakritik işarələr (muqavile → müqavilə).
- **Niyə vacibdir:** tərcüməçini hüquqşünas və notarius qarşısında utandıran səhvlər mexaniki səhvlərdir. Bu paket 30 saniyəlik demo üçün yaxşıdır: ChatGPT tərcüməsini yapışdırırsan, türk formaları düzəliş təklifi ilə birlikdə işarələnir.
- **Səy:** ilk 5 qayda S (≈ 8 saat, testlərlə), tam paket M.

### 5. Faktlar cədvəli: rəqəmlər, pul, tarixlər, maddə istinadları — M
Birləşdirilən fikirlər: ai-24 və workflow-5-in məbləğ qaydası. Orta bal 7,3.

- **Nə qururuq:** hər iki mətnin faktlarını eyni formata gətiririk və müqayisə edirik.
  - Ayırıcılar: 1,250.50 ↔ 1 250,50.
  - AZ/RU/TR rəqəm sözləri milyarda qədər, həmçinin mln, mlrd, млн, тыс.
  - Valyutalar: ₼/AZN/manat, $/USD/ABŞ dolları, €/avro, ₽/rubl, ₺.
  - Faizlər.
  - Dörd dildə ay adları, rus dilində yiyəlik halında (октября).
  - Maddə istinadları: "Article 5(2)(b)" ↔ "5-ci maddənin 2-ci hissəsinin b) bəndi".

  Qeyri-müəyyən tarix (03/04/2026) aydınlaşdırıcı suala çevrilir. Ekranda "mənbə faktı ↔ hədəf faktı" cədvəli görünür, hər sətirdən seqmentə keçmək olur.

  Qərar belədir: adi rejimdə qırmızı fakt yalnız xəbərdarlıq verir, notarial rejimdə isə ixracdan əvvəl açıq təsdiq tələb edir. QA hesabatında belə bir sətir çıxır: "Yoxlanmış faktlar: 212/212".
- **Niyə vacibdir:** müqavilədə və bank sənədində səhv məbləğ ən bahalı səhvdir. İndiki rəqəm yoxlaması rəqəmləri sadəcə mətn kimi müqayisə edir. Ona görə həm boş yerə xəbərdarlıq verir, həm də "3 ay" əvəzinə "üç ay" yazılanda fərqi görmür.
- **Səy:** M. 90 gündə yalnız v0: notarial sənədlər üçün rəqəm, sözlə məbləğ və tarix (≈ 8 saat). Tam versiya (valyutalar, milyard, maddə istinadları) 4–6-cı aylarda.

### 6. Messencerdən sifariş qəbulu və /qiymet kalkulyatoru — S → M
Birləşdirilən fikirlər: workflow-0, competition-42, growth-56 (/quote), ux-16. Orta bal 7,5.

- **Nə qururuq:**
  - **90 gündə, PWA "Paylaş" hədəfi (Web Share Target):** Android-də WhatsApp və ya Telegram-da şəkil üçün "Paylaş → Nuanza" basılır və şəkil birbaşa veb tətbiqə düşür. Heç bir server onu saxlamır. iPhone-da PWA bunu dəstəkləmir, orada "Fayl yüklə" düyməsi işlənir.
  - **İctimai `/qiymet` səhifəsi** (ASCII ünvan) girişsiz və AI-siz işləyir, hər şey brauzerdə hesablanır. Fayl atırsan və ya mətn yapışdırırsan, söz, simvol və standart səhifə sayını (boşluqlarla 1 800 simvol, ayarda dəyişir) və hazır qiymət mətnini alırsan. AI olmadığı üçün sui-istifadə xərci yoxdur. Bu, yeni istifadəçi gətirən pulsuz alətdir.
  - **4–6-cı aylarda, botda axın:**
    1. Tərcüməçi `/sifaris` rejimində müştərinin foto albomunu və ya PDF-ini bota yönləndirir. Bot faylı `getFile` ilə alır (20 MB limiti). Fayl Telegram serverlərində qalır, Nuanza onu yaddaşda emal edib silir.
    2. Gemini (ödənişli açar, istifadəçi limitləri ilə) OCR edir və bunları təyin edir: sənədin növü, dili, səhifə sayı, standart səhifə sayı, möhür və ya əlyazma olub-olmaması.
    3. Bot qiyməti tərcüməçinin saxlanmış tarifinə görə hesablayır. Tarifdə sənəd növünə sabit qiymət və təcililik əmsalı var. Notarius və apostil xərcləri ayrıca sətirdə yazılır.
    4. Bot göndərilməyə hazır mətni AZ/RU/EN düymələri ilə qaytarır. Nümunə: "Salam! Diplom + əlavə (3 səh.), EN→AZ, notarial təsdiqlə: 45 AZN. Hazır: sabah 15:00. Lazımdır: sənədin orijinalı." (Müştərinin notariusa gəlməsinin lazım olub-olmadığı müsahibədə dəqiqləşdirilir.)
    5. [Qiyməti dəyiş] və [İş yarat] düymələri var. [İş yarat] veb tətbiqdə işi açır: OCR mətni artıq seqmentlərə bölünüb, dosye doldurulub.
  - **Bot əmrləri** yalnız kiçik latın hərfləri, rəqəm və alt xətt ilə yazılır (`/qiymet`, `/sifaris`, `/balans`). Telegram "/qiymət" əmrini tanımır.
- **Niyə vacibdir:** sifarişlər məhz belə gəlir və müştəri çox vaxt bir neçə büroya yazır (müsahibələrdə yoxlanılır). Bizim bildiyimiz heç bir CAT aləti messencerdən foto albomu qəbul edib AZN ilə qiymətli cavab qaytarmır.
- **Səy:** 90 gündə S ("Paylaş" hədəfi və `/qiymet`, ≈ 6–8 saat). Bot axını M, 4–6-cı aylarda.

### 7. Şəkilçini tanıyan qlossari və 150 rəsmi ad — M
Birləşdirilən fikirlər: ai-19, competition-36, competition-41 (kiçildilmiş). Orta bal 6,5–7,0.

- **Nə qururuq:**
  - **Kök tapan modul:** Azərbaycan dili üçün qaydalara əsaslanan kiçik modul (təxmini həcm 300 sətir, real həcm fərqli ola bilər). O, iki və dörd variantlı ahəngi, y/n/s bitişdirici samitlərini və k→y, q→ğ yumşalmasını (çörək → çörəyi, ayaq → ayağı) tanıyır, şəkilçiləri sabit ardıcıllıqla ayırır.
  - **Qlossari qeydi:** mənbə forması, hədəf forması, qadağan variantlar, hansı müştəriyə aid olduğu və "dəyişdirmə" bayrağı (brendlər üçün).
  - **Terminlərin yoxlanması:**
    - Çağırışdan əvvəl termin `<t id=3 az="nizamnamə kapitalı">` kimi işarələnir.
    - Çağırışdan sonra yoxlayıcı hər id-nin tərcümədə olub-olmadığına baxır.
    - Termin yoxdursa, model bir dəfə avtomatik yenidən çağırılır. Yenə yoxdursa, seqment qırmızı olur.
    - QA hesabatında belə bir sətir çıxır: "Termin uyğunluğu: 100% (148/148)".
  - **Türk formaları** qadağan variantlara əvvəlcədən əlavə olunur (sözleşme → müqavilə).
  - **Rəsmi adlar:** notarial sənədlərdə ən çox rast gəlinən rəsmi adlar (dövlət orqanları, məhkəmələr, məcəllələr) AZ/EN/RU/TR dillərində, mənbə linki və qüvvədə olduğu tarixlərlə. Əvvəl 50 ad yığılır, sonra 150-yə çatdırılır. Adı dəyişmiş orqan QA-da işarələnir.
- **Niyə vacibdir:** "müqaviləsinin" sözünü "termin yoxdur" kimi işarələyən qlossarini tərcüməçi ilk saatda söndürəcək. Böyük şirkətlər bu modulu təxminən 10 milyonluq ölkə üçün prioritet etməyəcək. Eyni modul sonra özbək, qazax və türkmən dillərinə də uyğunlaşdırıla bilər.
- **Səy:** M (≈ 35–45 saat, adların toplanması daxil), 4–6-cı aylarda. 70–99% oxşar TM uyğunluqlarının avtomatik düzəldilməsi sonraya qalır.

### 8. Hesablar və məlumatın qorunması, sonra Büro funksiyaları — M → L (mərhələlərlə)
Birləşdirilən fikirlər: tech-48, workflow-9, tech-49, business-28 (komanda hissəsi), growth-59, competition-44. Orta bal 5,5–7,0, büro qiymətləndiricisi 9 verib.

- **Mərhələ A (90 gün ərzində, kiçildilmiş):**
  - Dərhal: `navigator.storage.persist()`, IndexedDB və bütün məlumatı bir kliklə JSON kimi ixrac edib bərpa etmək imkanı.
  - Hesab = dəvət tokeni (fikir 1). D1-də yalnız token, plan, limitlər və `usage_ledger` cədvəli saxlanılır: user_id, vaxt, əməliyyat, mənbə sözləri, tokenlər, model və xərc. Mətn, ad və FİN yazılmır.
  - Başlıqda "AI sözləri: 41 200 qaldı" sayğacı. Limitlər serverdə yoxlanılır, brauzerdə yox.
  - PIN kilidi və "cihazdan çıxış et və sil" düyməsi.
- **Mərhələ A2 (4-cü ay):**
  - Telegram Login: domen BotFather-də bağlanır, `hash` HMAC-SHA256 ilə və `auth_date` təzəliyi yoxlanılır. Botda /balans əmri.
  - Əsas ekranlar üçün rus dilində interfeys. Bunun üçün interfeys mətnləri ayrıca tərcümə faylına (i18n) köçürülür.
  - TMX 1.4 ixrac və idxalı, CSV/XLSX qlossari idxalı (şərtsiz, XLIFF-dən asılı deyil).
- **Mərhələ B (5–6-cı ay):**
  - Başlamazdan əvvəl: hüquqşünas məsləhəti (bax risk 1), büro ilə məlumat emalı müqaviləsi (büro məlumat sahibidir, Nuanza emal edən tərəfdir), saxlama müddəti və silinmə qaydası, D1 Time Travel ilə ehtiyat nüsxə, girişlərin jurnalı.
  - Büroya məxsus ortaq qlossari, ad reyestri və dosyelər D1-də.
  - Rollar: sahib, tərcüməçi, redaktor.
  - İki nəfərlik yoxlama (tərcüməçi tərcümə edir, redaktor təsdiqləyir) və hər seqment üzrə kimin nə etdiyinin qeydi.
  - İşdən gedən tərcüməçinin girişini ləğv etmək imkanı.
  - FİN, ad və ya sənəd nömrəsi ilə arxivdə axtarış.
  - Hesab-faktura sənədi (.docx/PDF) və mühasib üçün CSV. E-qaiməni büro e-taxes.gov.az-da özü yazır, avtomatik inteqrasiya qurulmur.
- **Niyə vacibdir:**
  - localStorage-də heç bir notarial iş axını işləmir. Brauzer təmizlənəndə aylarla toplanmış TM silinir.
  - Bürolar məhsulu əsasən ortaq funksiyalara görə alacaq.
  - Şəxsi parolla uçdan-uca şifrələmə ortaq büro TM-i ilə ziddiyyət təşkil edir, itirilmiş parol da itirilmiş məlumat deməkdir. Ona görə 6-cı aydan əvvəl qurulmur.
- **Səy:** A mərhələsi S (≈ 10 saat 90 gündə), A2 M, B L.

### 9. Notariusa getməzdən əvvəl müştəri təsdiqi üçün link — M
Əsas fikir: workflow-7 (müştəri təsdiqi hissəsi). Orta bal 6,5, büro qiymətləndiricisi 8 verib.

- **Nə qururuq:** `/r/{imzalı-token}` linki. Səhifəyə girişsiz baxmaq olur, onu dəyişmək olmur. Link 72 saatdan sonra işləmir, tərcüməçi onu istənilən vaxt ləğv edə bilər, səhifə axtarış sistemlərinə bağlıdır (`noindex`). Açmaq üçün 4 rəqəmli kod lazımdır, tərcüməçi onu müştəriyə ayrıca mesajla göndərir. Müştəri yalnız dosyedən götürülən kritik sahələri (ad, tarix, rəqəm, yer) görür. Ya "Bəli, hamısı düzgündür" düyməsini basır, ya da sahəyə şərh yazır. Təsdiq vaxtı ilə birlikdə işə əlavə olunur. Sahələr serverdə ən çox 72 saat saxlanılır, sonra silinir. Səhifədə büronun adı görünür, Nuanza yalnız kiçik altlıqdadır və büro onu söndürə bilər.
- **Niyə vacibdir:** notariusdan sonra tapılan səhv ikinci rüsum və ikinci gediş deməkdir. Bu təsdiq məsuliyyəti avtomatik olaraq müştəriyə keçirmir, amma mübahisədə müştərinin sahələri yoxladığına yazılı sübutdur. Hüquqi təsiri hüquqşünasla dəqiqləşdirilir.
- **Səy:** M. Telegram Login (8-ci fikrin A2 mərhələsi) hazır olandan sonra, 4–6-cı aylarda qurulur.

### 10. XLIFF körpüsü (şərtlə) — M
Birləşdirilən fikirlər: competition-38, tech-52, workflow-4 (XLIFF hissəsi), ux-17. Orta bal 6,3, bütün qiymətləndiricilərdə sabit 6–7.

- **Nə qururuq:**
  - **v1-də idxal brauzerdə:** yalnız SDLXLIFF və XLIFF 1.2. MQXLIFF, MXLIFF və XLIFF 2.0 sonra gəlir. Fayllar brauzerdə açılır və serverə getmir.
  - **.sdlppx** paketi JSZip ilə açılır, amma geri qaytarma paketi (.sdlrpx) yaradılmır, ayrı-ayrı SDLXLIFF faylları qaytarılır. Agentliyin bunu qəbul edib-etmədiyi müsahibədə soruşulur.
  - **Teqlər** ⟦1⟧…⟦/1⟧ tokenlərinə çevrilir. Teqlərin sayını və sırasını yoxlayan QA qaydası əlavə olunur.
  - **İxrac:** yalnız `<target>` dəyişir. Statuslar agentliyin alətinə uyğunlaşdırılır, məsələn təsdiq → ApprovedTranslation / ManuallyConfirmed.
  - **Köhnə məlumatın gətirilməsi:** TMX 1.4 və CSV qlossari idxalı şərtsizdir və 4-cü ayda gəlir (fikir 8, A2). TBX sonra əlavə olunur.
  - DOCX və IDML filtrləri qurulmur, çünki sənədin skeletini agentliyin CAT aləti saxlayır.
- **Niyə vacibdir:** Nuanza Trados-la rəqabət aparmır, onun yanında Azərbaycan dili üzrə köməkçi olur. Beləliklə rəqiblər müştəri gətirən kanala çevrilir.
- **Səy:** v1 M (≈ 30 saat). Şərt: müsahibələr agentlik frilanserlərinin pul ödəyən seqment olduğunu göstərməlidir. Notarial bürolar üçün bu funksiya vacib deyil.

## 6. 90 günlük yol xəritəsi

Fərziyyə: təsisçi həftədə təxminən 15 saat işləyir. 12 həftədə bu, ≈ 180 saatdır. Bunun ≈ 20%-i ehtiyatdır: universitet imtahanları, 8–9 noyabr və 31 dekabr – 2 yanvar bayramları, xəstəlik. Planlaşdırılan iş ≈ 150 saatdır. Əvvəlki versiya 400 saatdan çox iş tələb edirdi, ona görə həcm yarıdan çox kəsilib.

### Həftə 1–2 (7–20 oktyabr): təhlükəsizlik, model köçü, müsahibələrin başlanğıcı — ≈ 28 saat
- **Təhlükəsizlik (≈ 10 saat, fikir 1):**
  - açarlar dəyişdirilib və `wrangler secret`-də saxlanılır, /setup silinib;
  - webhook `secret_token` ilə qeydiyyatdan keçirilib, /api tokensiz işləmir;
  - dəvət tokenləri HttpOnly kukidə, sorğu limitləri var;
  - yalnız icazə verilən əməliyyatlar qəbul olunur, CSP qoyulub.
- **16 oktyabrdan əvvəl model köçü (≈ 6 saat):**
  - `gemini-flash-latest` ləqəbinin hazırda hansı modelə işarə etdiyi yoxlanılıb;
  - 3.x Flash (GA) və 3.1 Flash-Lite versiyalı ID-ləri sabitlənib, qızıl dəstdə müqayisə olunub;
  - "düşünmə" büdcəsi və `maxOutputTokens` qoyulub;
  - Google Cloud Billing açılıb, büdcə xəbərdarlığı qoyulub və API kvotası aşağı salınıb; mətn loglanmır; ZDR müraciəti göndərilib.
- **Xərc qoruyucusu (≈ 4 saat):** ümumi və istifadəçi üzrə gündəlik xərc sayğacı Durable Object-də.
- **Məlumat qorunur (≈ 3 saat):** `storage.persist()` və "Məlumatımı yüklə / bərpa et" (JSON) düyməsi əlavə olunub. Botda müştəri sənədləri barədə xəbərdarlıq var.
- **Tələbə funksiyaları (≈ 2 saat):** menyudan çıxarılıb, AI əməliyyatları serverdə bağlanıb. Menyu peşəkar quruluşa keçib: Bu gün · Sifarişlər · Layihələr · Lüğətlər · Yaddaş · QA hesabatları · Bilik · Müştərilər və tariflər · Ayarlar.
- **Müsahibələr (≈ 3 saat):**
  - Bakıda 30 büronun siyahısı hazırdır (notariuslar və ASAN yaxınlığında). ProZ.com-da AZ dil cütü üzrə tərcüməçilər də əlavə olunub.
  - 5 müsahibə təyin olunub, ilk 1–2-si 2-ci həftədə keçirilir.
- **OCR testinə hazırlıq:** razılıqla 20 skan toplanmağa başlanıb.

### Həftə 3–6 (21 oktyabr – 17 noyabr): sübut, qeydiyyat və nüvə — ≈ 50 saat
- **Müsahibələr və qərar (≈ 14 saat):** 8–10 müsahibə keçirilir. **4-cü həftənin sonunda ilkin qərar verilir:** əsas ödəyən seqment hansıdır (notarial bürolar və ya agentlik frilanserləri) və ilk şablonlar hansı istiqamətdə olacaq. 6-cı həftədə qalan müsahibələrlə qərar təsdiqlənir. 2–3 notariusdan formal tələblər soruşulur (fikir 2).
- **OCR testi (≈ 6 saat):** 20 skan (öz sənədlərin, ailənin və ya razılıqla redaktə olunmuş sənədlər: ŞV, doğum şəhadətnaməsi, diplom) ödənişli Gemini ilə sərt JSON sxemi üzrə emal olunur, hər sahənin düzgünlüyü cədvələ yazılır. Növbəti mərhələyə keçid şərti: çap olunmuş sahələrdə ən azı 95%. Ad, FİN və tarix sahələrindəki səhvləri MRZ yoxlaması və ya yoxlama ekranı tutmalıdır.
- **Qeydiyyat və ödəniş (≈ 4 saat):**
  - fərdi sahibkar kimi qeydiyyat (e-taxes.gov.az, ASAN İmza). Fəaliyyət kodu və vergi rejimi mühasiblə və ya Vergi xidmətinin çağrı mərkəzi (195) ilə dəqiqləşdirilir;
  - bank hesabı (Birbank Biznes) açılır və Epoint-ə müraciət edilir. Təsdiq bir neçə həftə çəkə bilər, saytda ictimai oferta, geri qaytarma qaydası və əlaqə məlumatı tələb oluna bilər;
  - qeydiyyat bitməmiş ödəniş qəbul edilmir.
- **Hüquqi mətnlər (≈ 4 saat):** qısa Məxfilik siyasəti, İstifadə şərtləri və Məlumat pasportu v1 (AZ/RU), məlumatı emal edən üçüncü tərəflərin siyahısı. Orada iki şey açıq deyilir:
  - AI nəticəsinə görə son məsuliyyəti tərcüməçi daşıyır;
  - Nuanza müştəri mətnini və TM-i istifadəçilər arasında heç vaxt birləşdirmir.
- **Məhsul (≈ 22 saat):**
  - AZ QA paketi v1 (5 qayda) və Vitest testləri;
  - şəxs dosyesi, MRZ yoxlaması (TD1/TD3) və sifariş boyu ad kilidi, testləri ilə. Testlər Azərbaycan nümunələri ilə yazılır: seqmentləşdirmə (b.e., və s., 1-ci), MRZ, QA qaydaları;
  - yeni kod ayrıca modullarda yazılır (Wrangler onları özü esbuild ilə yığır). Köhnə faylın bölünməsi 4–6-cı aylara qalır;
  - mətn yazmayan xəta monitorinqi (Workers logs) və tətbiqdə "Rəy bildir" düyməsi.
- **Satış (müsahibələrin içində):**
  - **Pulsuz keyfiyyət auditi:** büronun öz kompüterində, redaktə olunmuş nümunələr üzərində və yalnız ödənişli Gemini ilə aparılır. Nəticə bir səhifəlik hesabat olur.
  - Pilotda iştirak üçün niyyət toplanır, pul hələ alınmır.
- **Kredit müraciəti (≤ 1 saat):** Google for Startups "Start" proqramına (2 000 $-a qədər kredit) müraciət et. Kreditlərin Gemini Developer API-yə aid olub-olmadığını yoxla, Vertex AI tələb oluna bilər.

### Həftə 7–12 (18 noyabr – 29 dekabr): ilk pilotlar və ilk ödənişlər — ≈ 70 saat
- **Şablonlar (≈ 28 saat):** seçilmiş istiqamətdə 1-ci və 2-ci şablon (ŞV, doğum şəhadətnaməsi). OCR yoxlama ekranı, real `.docx`, təsdiq bloku, redaktə olunan notarius mətni, səhifə nömrələnməsi, notariusların tələblərinə uyğun düzülüş.
- **Faktlar cədvəli v0 (≈ 8 saat):** rəqəm, sözlə məbləğ, tarix. Notarial rejimdə qırmızı fakt ixracı bloklayır.
- **Hesab və limitlər (≈ 6 saat):** D1-də dəvət tokeni = hesab, `usage_ledger`, serverdə limitlər, "AI sözləri qaldı" sayğacı.
- **Maskalama və kilid (≈ 5 saat):** mətn sorğularında FİN, VÖEN, IBAN, telefon və e-poçt maskalanır. PIN kilidi və "cihazdan çıxış et və sil".
- **Qəbul (≈ 6 saat):** `/qiymet` (AI-siz) və PWA "Paylaş" hədəfi.
- **Bazara çıxış (≈ 5 saat):** öz domeni ilə AZ/RU açılış səhifəsi, qiymətlər, ictimai oferta və geri qaytarma qaydası. 2 dəqiqəlik demo video: uydurma məlumatlı eyni nümunə sənəd əvvəl ChatGPT-də, sonra Nuanza-da işlənir (ad, sözlə məbləğ və şəkilçi səhvləri göstərilir).
- **Pilotlar (≈ 12 saat):** 3–5 pilot büro. Hər birinə ilk tanışlığı şəxsən keçirirsən. Pilot pulsuz deyil: ilk ay bank köçürməsi və ya Epoint ilə ödənilir. Hər həftə bir sənədə sərf olunan vaxt ölçülür.
- **90-cı günün hədəfi (fərziyyə):** 3 ödəyən büro və 10 ödəyən tərcüməçi. İllik başlanğıc təklifləri ilə bu, təxminən 2 760 AZN-dir (3 × 490 + 10 × 129). Aylıq ödəniş seçilsə, daha az olar. Optimist ssenari: 5 büro və 30 tərcüməçi (≈ 6 320 AZN). Satış qıfı fərziyyəsi: 30 büronun siyahısından 10 müsahibə, 5 pilot, 3 ödəyən.

### 90 gündə nəyi etmirik
- DOCX/XLSX/PPTX formatını qoruyaraq geri qaytarma (DOCX v0 4–6-cı aylarda, şərtlə);
- Telegram botu ilə sifariş qəbulu, Telegram Login, rus interfeysi (4–6-cı aylar);
- diplom şablonu, şəkilçini tanıyan qlossari, rəsmi adlar, tam faktlar cədvəli (4–6-cı aylar);
- XLIFF, TMX, TBX;
- müştəri təsdiqi linki, büro funksiyaları, hesab-faktura;
- Telegram Mini App, mobil "sürüşdür-təsdiqlə", Trados qısayolları olan klaviatura redaktoru;
- seqment risk işığı, müştəri üslub qaydalarının avtomatik çıxarılması;
- ictimai müqayisəli test (benchmark), gündəlik kanal məzmunu;
- nazirlik lisenziyası, xarici bazara çıxış;
- Telegram Stars, dəvət (referal) proqramı;
- sənədlərə QR ilə "Verified" sertifikatı;
- uçdan-uca şifrələmə rejimləri;
- 9 mərhələli kanban və səhər icmalı.

### 4–6-cı aylar
Prioritet sırası ilə, təxminən 180 saatın sığdığı qədər:
1. Telegram Login, rus interfeysi, TMX ixrac və idxalı, CSV/XLSX qlossari idxalı (fikir 8, A2).
2. Diplom şablonu, sonra daha 4 şablon və apostil bloku.
3. Telegram botu ilə sifariş qəbulu (fikir 6). Sifariş jurnalı və hesab: qiymət, avans, ödənilib / ödənilməyib, hesab-faktura (.docx), mühasib üçün CSV.
4. Şəkilçini tanıyan qlossari və rəsmi adlar (fikir 7), tam faktlar cədvəli.
5. Faylın modullara bölünməsi və tələbə kodunun `akademiya-arxiv` budağına köçürülməsi.
6. Büro funksiyaları (fikir 8, B mərhələsi), hüquqşünas məsləhətindən sonra.
7. Notariusa getməzdən əvvəl müştəri təsdiqi (fikir 9).
8. İki sütunlu (RU|AZ, EN|AZ) müqavilə çıxışı. DOCX v0: paraqraf və cədvəl səviyyəsində formatı qoruyan geri qaytarma, yalnız sərbəst tərcüməçilər ödəyən seqmentdirsə.
9. XLIFF körpüsü (şərtlə).
10. İlk hesab-fakturalardan sonra KOBİA-nın "Startap" şəhadətnaməsinə müraciət. Praktiki işləyən sertifikatlı tərcüməçi və ya büro sahibi məsləhətçi kimi cəlb olunur.

## 7. Biznes modeli

Prinsip: brauzerdə işləyən alətlər (redaktor, TM, qlossari, yerli QA, faktlar cədvəli) Nuanza-ya pulsuz başa gəlir, ona görə istifadəçi üçün də pulsuzdur. Pul AI sözlərinə, notarial dəstə, komanda funksiyalarına və etibar funksiyalarına görə alınır. Bütün qiymətlər fərziyyədir, onları ilkin satış yoxlayacaq. Limitlər 2027-ci il model qiymətlərinə görə hesablanıb.

| Plan | Qiymət | Nə daxildir |
|---|---|---|
| Sərbəst | 0 AZN | Redaktor, TM, qlossari, AZ QA və faktlar cədvəli limitsiz. Ayda 5 000 AI sözü, ayda 3 notarial sənəd (OCR + şablon), /qiymet. İlk 90 gündə yalnız dəvətlə |
| Peşəkar (fərdi) | 19 AZN/ay və ya 179 AZN/il | Ayda 60 000 AI sözü və 50 notarial sənəd, bütün şablonlar, şəxs dosyeləri, qiymət mətni, `.docx`. Əlavə 10 000 söz 3 AZN-dir. Telegram-da sifariş qəbulu 4–6-cı aylardan |
| Büro | 59 AZN/ay (3 istifadəçi daxil), hər əlavə istifadəçi 15 AZN; illik 590 AZN | Qiymət sabitdir (büro gözlənilməz söz hesabı istəmir). Ayda 200 notarial sənəd və 150 000 AI sözü daxildir, ondan sonra hər sənəd 0,30 AZN. Ortaq lüğət və dosyelər, rollar, hesab-faktura (5-ci aydan) |
| İlk 50 tərcüməçi | İlk il 129 AZN | Peşəkar planı |
| İlk 10 büro | İlk il 490 AZN | Büro planı |

İllik başlanğıc təkliflərinə yazılı yol xəritəsi əlavə olunur. Söz verilən funksiya yazılı tarixdə çatdırılmasa, qalan ayların pulu qaytarılır.

Ödəniş üsulları:
- Epoint: AZN kartları, link, QR. Komissiya müqavilədə dəqiqləşdirilir. Avtomatik aylıq ödəniş dəstəklənmirsə, hər ay ödəniş linki göndərilir.
- Bank köçürməsi (Birbank Biznes).
- MMC olan bürolar üçün müqavilə, təhvil-təslim aktı və e-qaimə (fərdi sahibkar kimi e-taxes.gov.az-da əl ilə yazılır).

Stripe Azərbaycandakı satıcılara birbaşa açıq deyil (https://osome.com/uk/blog/stripe-account-azerbaijan-guide/). Telegram Stars və "öz açarını gətir" planı olmayacaq.

**Bir istifadəçinin gəlir və xərci (təxmini, 1 $ ≈ 1,70 AZN):**
- **Model qiymətləri (1 mln token üçün giriş / çıxış, üçüncü tərəf mənbələri, rəsmi https://ai.google.dev/gemini-api/docs/pricing səhifəsində yoxlanmalıdır):**
  - Gemini 2.5 Flash $0,30 / $2,50: 16 oktyabrda bağlanır, hesablamaya daxil edilmir;
  - 3.1 Flash-Lite $0,25 / $1,50;
  - 3.7 Flash: 31 dekabr 2026-dək endirimli başlanğıc qiyməti $0,75 / $3,75, 1 yanvar 2027-dən $1,50 / $7,50;
  - 3.6 Flash $1,50 / $7,50.
- **1 000 mənbə sözü** (3 keçid: qaralama, redaktor, AI QA; təxminən 27 000 giriş və 4 800 çıxış tokeni; fərziyyədir, `usage_ledger` ilə ölçüləcək):
  - Flash-Lite ilə ≈ $0,014 (≈ 0,024 AZN);
  - 3.x Flash ilə, 2027 qiyməti: ≈ $0,077 (≈ 0,13 AZN). Düşünmə məhdudlaşdırılmasa ≈ $0,11 və çox (≈ 0,19 AZN);
  - modellər arasında bölgü ilə (qaralama Flash-Lite-da, redaktor və AI QA yalnız riskli seqmentlərdə, təxminən 30%, Flash-da): ≈ $0,033 (≈ 0,056 AZN). Prefiks keşi və təcili olmayan işlər üçün Batch rejimi (təxminən 50% endirim, yoxlanmalı) xərci daha da azaldır.
- **Bir notarial sənəd** (3 səhifəlik skan): Gemini 3 nəslində bir şəkil susmaya görə ≈ 1 120 tokendir (`media_resolution` ilə 280–2 240). JSON doldurma və QA ilə birlikdə ≈ $0,03–0,06 (≈ 0,05–0,10 AZN). Bazarda sənəd və ya səhifə üçün qiymət 7–35 AZN-dir (https://asan.gov.az/en/service/asan-xidmetler/funksional-yardimci-xidmetler/tercueme-xidmetleri, yoxlanmalıdır).
- **Peşəkar istifadəçi bütün limiti işlətsə** (60 000 söz + 50 sənəd):
  - bölgü ilə xərc ≈ 3,4 + 3,0 = 6,4 AZN;
  - ən pis halda (hamısı Flash, 2027 qiyməti) ≈ 7,8 + 5,0 = 12,8 AZN;
  - 2% vergi və təxminən 2–3% ödəniş komissiyasından sonra xalis gəlir ≈ 18 AZN. Marja bölgü ilə ≈ 65%, ən pis halda ≈ 30%.
- **Büro, ən pis halda** (200 sənəd + 150 000 söz, hamısı Flash, 2027): ≈ 20 + 19,5 ≈ 40 AZN xərc. Bölgü ilə ≈ 12 + 8,4 ≈ 20 AZN. Xalis gəlir ≈ 56 AZN, marja ≈ 30–64%. Köhnə limitlər (300 sənəd + 300 000 söz) 2027 qiymətləri ilə ≈ 69 AZN xərc, yəni zərər verərdi. Başlanğıc qiymətləri də buna görə 99/390 AZN-dən 129/490 AZN-ə qaldırılıb.
- **Sərbəst istifadəçi:** ayda ≈ 0,5 AZN xərc. İlk 90 gündə dəvətlə ən çox 50 nəfər olur (ayda ≈ 25 AZN).
- **Sabit xərclər:** Cloudflare Workers Paid $5/ay (≈ 8,5 AZN), domen (illik), mühasib xərci (dəqiqləşdirilməlidir), Epoint komissiyası. Sadələşdirilmiş vergi dövriyyənin 2%-idir, mühasiblə təsdiqlənməlidir.
- **Tərcüməçi üçün xərc payı:** 0,06 AZN/söz qiymətlə (fərziyyə) 10 000 sözlük işdən tərcüməçi ≈ 600 AZN qazanır. Həmin iş üçün AI xərci bölgü ilə ≈ 0,56 AZN, ən pis halda ≈ 1,3 AZN-dir, yəni 0,25%-dən az. Ödənişli səviyyə ilə məxfilik praktiki olaraq pulsuzdur.
- 3.7 Flash-ın endirimli başlanğıc qiyməti ilk pilotlarda (31 dekabra qədər) xərci yarıya salır, amma planlar 2027 qiymətinə görə qurulub.

## 8. Rəqiblər və mövqe

Qiymətlər üçüncü tərəf mənbələrindəndir. Satış materialında istifadə etməzdən əvvəl hər birinin rəsmi saytda yoxlanma tarixi yazılmalıdır.

| Rəqib | Qiymət | Azərbaycan dili üçün zəif yeri |
|---|---|---|
| Trados Studio Freelance | $52–63/ay, birdəfəlik $915 (https://www.capterra.com/p/151746/SDL-Trados-Studio/) | Bahalıdır, böyük fayllarda yavaşdır. Az yayılmış dillər üçün Hunspell yoxlaması çoxlu boş xəbərdarlıq verir (https://community.rws.com/ideas/trados-portfolio-ideas/i/trados-studio/add-more-hunspell-spellcheckers-to-trados) |
| memoQ translator pro | $45/ay | Termin axtarışı təxminən 80% simvol oxşarlığına baxır, söz formalarını qruplaşdırmır (https://translationtribulations.com/2013/06/understanding-fuzzy-term-matching-in.html) |
| Phrase Freelancer | $27/ay, yalnız illik | Uzun işlərdə yavaşdır, QA boş xəbərdarlıq verir (https://www.capterra.com/p/276186/Phrase/reviews/) |
| Smartcat | Basic planı $1 200/il | Ödənişlərdən 3%-ə qədər komissiya tutur, ödənişlərin saxlanmasından şikayətlər var (https://ca.trustpilot.com/review/smartcat.ai) |
| OmegaT, Matecat | Pulsuz | AZ morfologiyası, notarial şablonlar, MRZ və fakt yoxlaması yoxdur. Qiymətlə yox, iş axını ilə rəqabət aparırıq |
| DeepL Pro | ≈ $8,74/ay | Azərbaycan dili üçün `glossaries:false`, `translationMemory:false` |
| ChatGPT/Claude, öz GPT-n | $0–20/ay | TM yoxdur, terminlər məcburi deyil, MRZ və fakt yoxlaması yoxdur, notarial şablon və `.docx` cədvəli yoxdur. Pulsuz və şəxsi hesablarda ayardan asılı olaraq məlumat təlimdə istifadə oluna bilər (Team/Enterprise planlarında yox) (https://ottiaq.org/app/uploads/2025/08/24_ottiaq_avis_en.pdf) |
| LocalDoc NLLB-3.3B (Bakı) | Açıq çəkilər, lisenziya NLLB-200-dən CC-BY-NC 4.0 (qeyri-kommersiya) | Tərcümə modelidir, iş masası deyil. FLORES testində güclü nəticə göstərir (https://huggingface.co/LocalDoc/nllb-3.3b-en-az). Amma kommersiya məhsulunda ehtiyat model kimi istifadə oluna bilməz və GPU tələb edir, ona görə yalnız keyfiyyət müqayisəsi üçün işlənir |
| Tərcümə Mərkəzi (aztc.gov.az) | — | Sertifikat imtahanları keçirir, reyestr və lüğətlər aparır (https://aztc.gov.az/en/posts/id:1558). Həm tərəfdaş, həm də rəqib ola bilər |

**Mövqe:** Nuanza Trados-u əvəz etmir. O, Trados-un yanında Azərbaycan dili üzrə köməkçidir və notarial zəncirdə tam işi görür.
- **Rəqabət aparmadığımız sahələr:** format filtrləri, masaüstü CAT, korporativ TMS, tərcümə modeli, sifariş bazarı və ümumi chat.
- **Üstün olmağı hədəflədiyimiz sahələr:** şəkilçini tanıyan terminologiya və QA, türk və rus təsirinin aşkarlanması, notarial sənəd dəstləri, AZ identifikatorlarının maskalanması, messencerdən sifariş qəbulu və pullu CAT alətlərindən xeyli ucuz AZN qiyməti.

**"Niyə ChatGPT Projects yox?" sualına cavab:** ChatGPT bunları etmir:
- MRZ nəzarət rəqəmlərini hesablamır;
- sifarişin bütün sənədlərində adı simvol-simvol eyni saxlamır;
- sözlə yazılmış məbləği rəqəmlə tutuşdurmur;
- notariusun qəbul etdiyi cədvəl düzülüşünü vermir;
- terminləri məcburi tətbiq etmir, sadəcə təklif edir;
- tərcüməçinin müştəriyə göstərə biləcəyi, Azərbaycan identifikatorlarının maskalanmasını da təsvir edən "Məlumat pasportu" vermir.

## 9. Uğuru necə ölçək

Yalnız saylar toplanır, mətn heç vaxt toplanmır.

| Göstərici | 90-cı gün üçün hədəf (fərziyyə) |
|---|---|
| Əsas göstərici: həftədə təsdiqlənmiş söz (AI, TM və redaktə üzrə bölgü ilə) və həftədə ixrac olunan notarial sənəd | Həftədə 60 sənəd (3 büro × gündə 4 sənəd × 5 gün) və 30 000 söz (10 tərcüməçi × 3 000 söz) |
| Bir notarial sənədə sərf olunan vaxt | Müsahibədə ölçülən ilkin vaxtın 50%-i və ya daha az. Eyni tipli ikinci sənəd 3–5 dəqiqə |
| Pilot bürolarda ad və ya rəqəm səhvinə görə rədd (notarius, konsulluq) | 0 |
| Aktivləşmə: 7 gün ərzində 1 sənəd ixrac edən və ya ən azı 300 söz təsdiqləyən istifadəçilər | Qeydiyyatdan keçənlərin ən azı 40%-i |
| Həftəlik aktiv tərcüməçi | 25 |
| Ödəyənlər; aktivləşmiş istifadəçilərdən ödəyənlərin payı | 3 büro və 10 tərcüməçi; ən azı 8% |
| AI xərcinin gəlirə nisbəti; 1 000 söz üçün AI xərci | 20% və ya az; bölgü ilə $0,04 və ya az |
| Məxfilik: pulsuz açara gedən çağırış, loglarda müştəri mətni, insident | Hər biri 0 |
| Gündəlik xərc limitinin işə düşməsi | Həftədə ən çox 1 dəfə |

Növbəti mərhələyə keçid şərti: OCR çap olunmuş sahələrdə ən azı 95% düzgün olmalıdır (20 skanlıq test).

## 10. Risklər və cavabları

1. **Məxfiliyin pozulması (əsas risk).**
   - Risk:
     - Pulsuz səviyyədə sorğular təlimdə istifadə oluna və oxuna bilər.
     - Ödənişli səviyyədə də sui-istifadəyə nəzarət üçün 55 gün saxlanılır (https://ai.google.dev/gemini-api/docs/usage-policies).
     - Notarial OCR-da şəkil maskalanmadan Google-a gedir.
     - Telegram-ın bulud söhbətləri uçdan-uca şifrələnmir, bota göndərilən fayl Telegram serverlərində qalır.
     - Paylaşılan büro kompüterində IndexedDB brauzeri açan hər kəsə açıqdır.
     - "Fərdi məlumatlar haqqında" Qanun (№ 998-IIIQ, 2010) məlumatın xaricə ötürülməsini məhdudlaşdırır.
   - Cavab:
     - Yalnız ödənişli açar işlənir, sistem xəbərsiz pulsuz açara keçmir. ZDR üçün müraciət edilir. Vertex AI və AB regionu alternativ kimi qiymətləndirilir.
     - Mətn loglanmır. Mətn sorğularında FİN, VÖEN, IBAN, telefon və e-poçt maskalanır. Skanın maskalanmadığı Məlumat pasportunda açıq yazılır.
     - Skanlar Nuanza-da saxlanılmır. Sonradan saxlansa, çatdırılmadan 30 gün sonra avtomatik silinəcək.
     - PIN kilidi və "cihazdan çıxış et və sil" düyməsi var. Dosyelərin avtomatik silinmə müddəti var.
     - Botda xəbərdarlıq var, Məlumat pasportu versiyalıdır, məlumatı emal edən üçüncü tərəflərin siyahısı açıqdır.
     - İnsident planı: açarlar dərhal dəyişdirilir, təsirlənən istifadəçilərə bildiriş göndərilir.
     - Ödəniş almazdan əvvəl Bakıda məlumatların qorunması üzrə bir hüquqşünasla məsləhətləşmə aparılır (büdcə yoxdursa, universitetin hüquq klinikası və ya KOBİA vasitəsilə). İnformasiya sisteminin qeydiyyatı və məlumatın ölkədə saxlanması tələbi soruşulur.
     - TM və düzəlişlər istifadəçilər arasında heç vaxt birləşdirilmir.
2. **AI şəxsiyyət nömrəsini, məbləği və ya möhür mətnini dəyişir.**
   - Cavab:
     - Möhür mətnini AI yazmır.
     - MRZ yoxlaması, ad kilidi, faktlar cədvəli və yer tutucu yoxlaması sabit qaydalarla işləyir.
     - Notarial rejimdə qırmızı fakt təsdiq olmadan ixrac olunmur.
     - "Yaşılların hamısını təsdiqlə" funksiyası qurulmur.
     - İstifadə şərtlərində son məsuliyyət tərcüməçinin üzərindədir.
3. **Modelin bağlanması, xəbərsiz dəyişməsi və qiymət artımı.**
   - Cavab:
     - 2.5 Flash 16 oktyabrda bağlanır, ona görə model köçü bu həftə edilir. Versiyalı 3.x ID-ləri sabitlənir.
     - Modeli yalnız qızıl dəst və 50 tələ seqmenti nəticəni pisləşdirmədən keçəndə dəyişirik.
     - Ehtiyat model işləyəndə seqmentdə nişanla göstərilir.
     - 3.7 Flash-ın endirimli qiyməti 1 yanvarda iki dəfə artır. Limitlər və qiymətlər 2027 qiymətinə görə qurulub. Modellər arasında bölgü, keş və Batch rejimi istifadə olunur.
     - LocalDoc NLLB lisenziyası (CC-BY-NC) ucbatından ehtiyat model deyil.
4. **OCR möhürlü, əlyazmalı və sovet dövründən qalma kiril sənədlərində zəif işləyir.** Cavab: 20 skanlıq test keçid şərtidir. Şəkil və sahə yanaşı göstərilir, əmin olunmayan sahələr işarələnir. Köhnə əlyazma sənədlər ilk versiyada əl ilə daxil edilir.
5. **Bürolar ödəmir və ya audit üçün sənəd vermir.** Cavab:
   - Audit büronun öz kompüterində, redaktə olunmuş nümunələrdə aparılır.
   - Pilot pulsuz yox, endirimli olur.
   - Seqment 4-cü həftədə müsahibələrin nəticəsinə görə seçilir, 6-cı həftədə təsdiqlənir.
   - Uğur hədəfi realdır: 3 büro və 10 tərcüməçi.
6. **Gemini təhvil günü işləmir və ya limitə düşür.** Cavab: TM, qlossari, şablonlar və yerli QA AI olmadan işləyir. "AI-siz rejim" açarı var. Aşağı riskli işlər üçün Flash-Lite ehtiyatı nişanla istifadə olunur.
7. **Xərcin süni artırılması (açıq endpoint, bot spamı).** Cavab: Durable Object-də gündəlik xərc limiti, istifadəçi limitləri, aşağı salınmış API kvotası, Google Cloud büdcə xəbərdarlığı, ilk 90 gündə yalnız dəvətlə giriş, AI-siz `/qiymet`.
8. **Təsisçinin vaxtı az ola bilər (tək tələbə, həftədə təxminən 15 saat, dekabr–yanvarda imtahanlar).** Cavab:
   - Saat büdcəsinə və "90 gündə nəyi etmirik" siyahısına əməl olunur. Hər mərhələnin sonunda büdcə ilə faktiki saatlar müqayisə edilir.
   - L ölçülü işlər kiçildilmiş həcmdə görülür.
   - Praktiki işləyən notarial tərcüməçi və ya büro sahibi məsləhətçi kimi cəlb olunur, əvəzində gəlirdən pay və ya pulsuz Büro planı alır.
9. **Notarius və konsulluq AI ilə hazırlanmış tərcüməyə necə baxır.** Cavab: imzanı tərcüməçi atır, Nuanza sadəcə alətdir. Notarial sənədlərdə Nuanza brendi və QR olmur. Müsahibələr zamanı şablonların düzülüşünü 2–3 notariusa yoxlatdırırsan.
10. **Vergi və hüquqi qeydiyyat.** Fərdi sahibkarlar üçün vergi rejimi və icazə verilən fəaliyyət növləri dəyişə bilər. Cavab: qeydiyyatdan əvvəl mühasiblə və ya Vergi xidmətinin çağrı mərkəzi (195) ilə yoxla. Qeydiyyat bitməmiş ödəniş alma.
11. **Müştərilər Telegram-dan çox WhatsApp işlədir.** Cavab: ilk versiyada qəbul PWA "Paylaş" hədəfi ilə hər iki messencerdən işləyir. Bot yalnız müsahibələr Telegram-ın üstünlüyünü göstərsə prioritet olur.
12. **Epoint-in təsdiqi gecikir.** Cavab: ilk ödənişlər hesab-faktura ilə bank köçürməsi vasitəsilə qəbul edilir.

## 11. Bu həftə edilməli 5 iş

1-ci və 2-ci iş 16 oktyabra qədər mütləqdir (≈ 15 saat, yəni bu həftənin bütün vaxtı). 3–5-ci işlər gələn həftəyə keçə bilər.

1. **Təhlükəsizlik (≈ 8–10 saat).**
   - Gemini açarını və bot tokenini dəyiş, `wrangler secret`-də saxla, test və iş mühiti üçün ayrı açar yarat.
   - /setup marşrutunu sil. Webhook-u skriptdən `secret_token` ilə qeydiyyatdan keçir və başlığı uyğun gəlməyən /tg sorğularını rədd et.
   - /api dəvət tokeni olmadan 401 qaytarsın. Token HttpOnly kukidə saxlanılsın.
   - Cloudflare sorğu limiti bağlantısını və CSP başlığını əlavə et.
2. **Model köçü: ödənişli və sabit AI (≈ 6 saat, 16 oktyabrdan əvvəl, çünki 2.5 Flash bağlanır).**
   - Google Cloud Billing aç, açarı yalnız Generative Language API ilə məhdudlaşdır, büdcə xəbərdarlığı qoy və API kvotasını aşağı sal.
   - `gemini-flash-latest` ləqəbinin indi hansı modelə işarə etdiyini yoxla. `MODEL_PRIMARY`-də GA statusunda olan 3.x Flash-ı, `MODEL_FAST`-da 3.1 Flash-Lite-ı versiyalı ID ilə sabitlə və qızıl dəstdə yoxla.
   - Hər çağırışa `maxOutputTokens` və düşünmə büdcəsi qoy. Sorğu mətninin loglanmasını söndür. Gündəlik xərc limitini Durable Object sayğacı ilə qur.
3. **Məlumat itkisinə qarşı və tələbə funksiyaları (≈ 4 saat).** `navigator.storage.persist()` əlavə et və "Bütün məlumatımı yüklə / bərpa et" (JSON) düyməsini qur. Botda "Müştəri sənədlərini bura yapışdırmayın" xəbərdarlığı olsun. Tələbə bölmələrini menyudan çıxar və onların AI əməliyyatlarını serverdə bağla.
4. **Müştərilərlə tanışlıq (≈ 3 saat).** 30 büronun siyahısını tut və 5 müsahibə təyin et. Soruşmaq lazım olanlar:
   - gündə hansı sənədlər gəlir və neçə dənə;
   - bir sənədə neçə dəqiqə gedir;
   - səhifənin qiyməti nə qədərdir, standart səhifə neçə simvoldur;
   - müştərilər əsasən WhatsApp-da, yoxsa Telegram-da yazır;
   - hansı alətlərdən istifadə edirlər (Word, ChatGPT), bir kompüterdə neçə nəfər işləyir;
   - notarius nə tələb edir: səhifə nömrəsi, orijinalın surətinə tikmə, hər səhifədə imza, tərcüməçinin hansı sənədləri təqdim etdiyi;
   - sonuncu dəfə sənəd nə vaxt və niyə rədd edilib;
   - müştəridən pulu necə alırlar, hesab və ya qəbz yazırlarmı;
   - alətə kim qərar verir;
   - ayda 59 AZN ödəyərdilərmi.
5. **OCR testinə hazırlıq (≈ 2 saat).** 20 skan topla: öz sənədlərin, ailənin və ya razılıqla redaktə olunmuş ŞV, doğum şəhadətnaməsi və diplom. Sərt JSON sxemini və sahə düzgünlüyü cədvəlini hazırla. Testin özünü (≈ 6 saat) 3-cü həftədə ödənişli Gemini ilə apar. Nəticə 95%-dən aşağı olsa, şablon planını əl ilə daxiletmə üzərində qur.