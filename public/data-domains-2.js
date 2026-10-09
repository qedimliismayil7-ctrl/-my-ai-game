/* Nuanza — Tibbi, İT və lokalizasiya, Media/marketinq/ədəbiyyat curriculum (original Nuanza content). */
window.NUANZA_DOMAINS = window.NUANZA_DOMAINS || {};

window.NUANZA_DOMAINS['tibb'] = {
  key: 'tibb', name: 'Tibbi', icon: 'heart',
  why: "Azərbaycanda özəl klinikaların, xaricdə müalicə turizminin və dərman idxalının artması səbəbilə xəstə sənədlərinin, epikrizlərin və dərman təlimatlarının dəqiq tərcüməsi birbaşa pasiyent təhlükəsizliyinə təsir edir.",
  glossary: [
    { en: 'patient', az: 'pasiyent / xəstə' },
    { en: 'medical record', az: 'tibbi kart', note: 'xəstəxanada: xəstəlik tarixçəsi' },
    { en: 'discharge summary', az: 'epikriz (çıxarış epikrizi)' },
    { en: 'to discharge', az: 'evə yazmaq (xəstəxanadan)', note: '«buraxmaq» yox' },
    { en: 'to admit', az: 'xəstəxanaya qəbul etmək / yerləşdirmək' },
    { en: 'informed consent', az: 'məlumatlandırılmış razılıq' },
    { en: 'to withdraw consent', az: 'razılığı geri götürmək' },
    { en: 'package leaflet', az: 'dərmanın istifadə təlimatı' },
    { en: 'side effect / adverse reaction', az: 'əlavə təsir / arzuolunmaz reaksiya' },
    { en: 'common (1 in 10)', az: 'tez-tez rast gəlinən', note: 'tezlik kateqoriyasıdır, «ümumi» deyil' },
    { en: 'contraindication', az: 'əks göstəriş' },
    { en: 'indication', az: 'istifadəyə göstəriş' },
    { en: 'dosage', az: 'dozalanma / doza' },
    { en: 'active substance', az: 'təsiredici maddə' },
    { en: 'excipients / other ingredients', az: 'köməkçi maddələr / digər komponentlər' },
    { en: 'tablet', az: 'tablet' },
    { en: 'acute', az: 'kəskin', note: '«akut» yox' },
    { en: 'chronic', az: 'xroniki' },
    { en: 'complication', az: 'ağırlaşma' },
    { en: 'history of (a disease)', az: 'anamnezdə ... olması' },
    { en: 'blood test', az: 'qan analizi' },
    { en: 'referral', az: 'göndəriş', note: '«referans» yox' },
    { en: 'ID card', az: 'şəxsiyyət vəsiqəsi' },
    { en: 'blood pressure (BP)', az: 'arterial təzyiq (AT)' },
    { en: 'mmHg', az: 'mm c.s. (civə sütunu)' },
    { en: 'heart rate (HR), bpm', az: 'ürək vurğularının sayı, dəqiqədə ... vurğu' },
    { en: 'ECG', az: 'EKQ (elektrokardioqramma)' },
    { en: 'lead (ECG)', az: 'aparma' },
    { en: 'ST elevation', az: 'ST seqmentinin elevasiyası (qalxması)' },
    { en: 'myocardial infarction', az: 'miokard infarktı' },
    { en: 'impression (clinical)', az: 'ilkin diaqnoz / klinik rəy', note: '«təəssürat» yox' },
    { en: 'stat', az: 'dərhal, təxirəsalınmadan' },
    { en: 'heartburn', az: 'mədə yanması (qıcqırma)', note: 'ürəklə əlaqəsi yoxdur' },
    { en: 'nausea', az: 'ürəkbulanma' },
    { en: 'dizziness', az: 'başgicəllənmə' },
    { en: 'pregnant / breast-feeding', az: 'hamilə / əmizdirən' },
    { en: 'stomach ulcer', az: 'mədə xorası' },
    { en: 'keep out of the reach of children', az: 'uşaqların əli çatmayan yerdə saxlayın' }
  ],
  tasks: [
    { id: 'tibb-b1-1', level: 'B1', domain: 'Tibbi', reg: 'Neytral', client: 'Əczaçılıq distribyutoru «Şəfa Farm» MMC', title: 'Dərman qutusu: qəbul qaydası',
      xp: 20, minutes: 4,
      src: "Take one tablet twice a day after meals. Do not exceed 4 tablets in 24 hours. Keep out of the reach of children. Store below 25°C.",
      model: "Gündə iki dəfə, yeməkdən sonra bir tablet qəbul edin. 24 saat ərzində 4 tabletdən çox qəbul etməyin. Uşaqların əli çatmayan yerdə saxlayın. 25°C-dən aşağı temperaturda saxlayın.",
      hints: ['«after meals» — yeməkdən sonra.', '«below 25°C» — 25°C-dən aşağı (yuxarı yox!).', 'Standart qablaşdırma ifadələrini hazır formada işlədin.'],
      draft: "Gündə iki dəfə, yeməkdən əvvəl bir tablet qəbul edin. 24 saat ərzində 4 tabletdən çox qəbul etməyin. Uşaqlardan uzak tutun. 25 dərəcədən yüksək temperaturda saxlayın.",
      tip: 'Dərman mətnində hər ön söz (after/before, below/above) pasiyentin həyatı qədər vacibdir — iki dəfə yoxlayın.',
      traps: [
        { w: ['yeməkdən əvvəl'], now: 'yeməkdən sonra', type: 'Məna', why: '«after meals» yeməkdən sonra deməkdir; səhv qəbul mədəni zədələyə bilər.', ex: 'after meals → yeməkdən sonra' },
        { w: ['uzak'], now: 'uzaq', type: 'Türk forması', why: 'Azərbaycan dilində söz «uzaq» kimi yazılır; üstəlik qablaşdırmada standart ifadə «uşaqların əli çatmayan yerdə saxlayın»dır.', ex: 'Uşaqların əli çatmayan yerdə saxlayın.' },
        { w: ['25 dərəcədən yüksək'], now: '25°C-dən aşağı', type: 'Rəqəm', why: '«below» aşağı deməkdir və vahid (°C) mütləq saxlanmalıdır.', ex: 'Store below 30°C → 30°C-dən aşağı temperaturda saxlayın.' }
      ] },

    { id: 'tibb-b1-2', level: 'B1', domain: 'Tibbi', reg: 'Neytral', client: 'Diaqnostika mərkəzi «Laborator Plus»', title: 'Analizə hazırlıq: pasiyentə SMS',
      xp: 20, minutes: 4,
      src: "Please do not eat or drink anything after midnight before your blood test. You may drink a small amount of water. Bring your referral and ID card.",
      model: "Qan analizindən əvvəlki gecə saat 00:00-dan sonra heç nə yeməyin və içməyin. Az miqdarda su içə bilərsiniz. Göndərişinizi və şəxsiyyət vəsiqənizi özünüzlə gətirin.",
      hints: ['«blood test» tibbdə «qan analizi»dir.', '«may» burada icazədir, məcburiyyət deyil.', '«referral» — həkim göndərişi.'],
      draft: "Qan testindən əvvəl gecə yarısından sonra heç nə yeməyin və içməyin. Az miqdarda su içməlisiniz. Referansınızı və ID kartınızı gətirin.",
      tip: 'May = «...a bilərsiniz», must = «...malısınız». Pasiyent təlimatında bu fərq səhvə yol vermir.',
      traps: [
        { w: ['Qan testindən'], now: 'Qan analizindən', type: 'Termin', why: 'Azərbaycan tibb praktikasında «blood test» qan analizi adlanır.', ex: 'urine test → sidik analizi' },
        { w: ['içməlisiniz'], now: 'içə bilərsiniz', type: 'Məna', why: '«may» icazə bildirir; «içməlisiniz» pasiyentə yanlış göstəriş verir.', ex: 'You may take a shower → Duş qəbul edə bilərsiniz.' },
        { w: ['Referansınızı'], now: 'Göndərişinizi', type: 'Termin', why: '«referral» yalançı dostdur — «referans» yox, həkim göndərişi deməkdir.', ex: 'referral letter → göndəriş' },
        { w: ['ID kartınızı'], now: 'şəxsiyyət vəsiqənizi', type: 'Termin', why: 'Rəsmi sənədin Azərbaycandakı adı «şəxsiyyət vəsiqəsi»dir.', ex: 'Bring your ID → Şəxsiyyət vəsiqənizi gətirin.' }
      ] },

    { id: 'tibb-b2-1', level: 'B2', domain: 'Tibbi', reg: 'Rəsmi', client: 'Xaricdə müalicə olunmuş pasiyentin ailəsi', title: 'Epikriz: appendektomiya',
      xp: 30, minutes: 6,
      src: "The patient was admitted on 3 March 2026 with acute appendicitis. A laparoscopic appendectomy was performed without complications. He was discharged in a stable condition on 6 March and advised to avoid heavy lifting for four weeks.",
      model: "Pasiyent 3 mart 2026-cı il tarixində kəskin appendisit diaqnozu ilə xəstəxanaya qəbul edilmişdir. Ağırlaşmasız laparoskopik appendektomiya aparılmışdır. Pasiyent 6 mart tarixində stabil vəziyyətdə evə yazılmış və ona dörd həftə ərzində ağır yük qaldırmamaq tövsiyə edilmişdir.",
      hints: ['«acute» tibbdə «kəskin»dir.', '«discharged» — xəstəxanadan evə yazılmaq.', 'Tarix: 2026-cı il (ahəng qanunu).'],
      draft: "Pasiyent 3 mart 2026-ci il tarixində akut appendisit diaqnozu ilə xəstəxanaya qəbul edilmişdir. Komplikasiyasız laparoskopik appendektomiya aparılmışdır. Pasiyent 6 mart tarixində stabil vəziyyətdə buraxılıb və ona dörd həftə ərzində ağır yük qaldırmamaq tövsiyə edilmişdir.",
      tip: 'Epikriz rəsmi sənəddir: keçmiş zaman «-mışdır» formasında, terminlər isə Azərbaycan tibb ənənəsinə uyğun olmalıdır.',
      traps: [
        { w: ['2026-ci il'], now: '2026-cı il', type: 'Tarix', why: '2026 «altı» ilə bitir, ahəng qanununa görə şəkilçi «-cı» olur.', ex: '2025-ci il, 2026-cı il' },
        { w: ['akut'], now: 'kəskin', type: 'Termin', why: 'Azərbaycan tibb terminologiyasında «acute» kəskin kimi verilir.', ex: 'acute pain → kəskin ağrı' },
        { w: ['Komplikasiyasız'], now: 'Ağırlaşmasız', type: 'Termin', why: 'Klinik sənədlərdə «complication» üçün yerli termin «ağırlaşma»dır.', ex: 'postoperative complications → əməliyyatdan sonrakı ağırlaşmalar' },
        { w: ['buraxılıb'], now: 'evə yazılmışdır', type: 'Termin', why: '«discharged» xəstəxanadan evə yazılmaq deməkdir; «buraxılmaq» həbsxana kontekstini xatırladır və üslubdan düşür.', ex: 'discharge date → evə yazılma tarixi' }
      ] },

    { id: 'tibb-b2-2', level: 'B2', domain: 'Tibbi', reg: 'Rəsmi', client: 'Özəl klinika «Nur Med»', title: 'Məlumatlandırılmış razılıq forması',
      xp: 30, minutes: 6,
      src: "I confirm that the risks, benefits and alternatives of the procedure have been explained to me. I understand that I may withdraw my consent at any time before the procedure without affecting my future care.",
      model: "Təsdiq edirəm ki, prosedurun riskləri, faydaları və alternativləri mənə izah edilmişdir. Başa düşürəm ki, prosedurdan əvvəl istənilən vaxt razılığımı geri götürə bilərəm və bu, gələcəkdə mənə göstəriləcək tibbi yardıma təsir etməyəcək.",
      hints: ['«I confirm» — Təsdiq edirəm.', '«may withdraw» hüquqdur, öhdəlik deyil.', '«care» burada tibbi yardım deməkdir.'],
      draft: "Onaylayıram ki, prosedurun riskləri, faydaları və alternativləri mənə izah edilmişdir. Başa düşürəm ki, prosedurdan əvvəl istənilən vaxt razılığımı geri götürməliyəm və bu, gələcək qayğıma təsir etməyəcək.",
      tip: 'Razılıq formasında pasiyentin hüquqları («may») heç vaxt öhdəliyə («must») çevrilməməlidir.',
      traps: [
        { w: ['Onaylayıram'], now: 'Təsdiq edirəm', type: 'Türk forması', why: '«Onaylamaq» türk dilinə məxsusdur; Azərbaycan dilində «təsdiq etmək» işlənir.', ex: 'I confirm → Təsdiq edirəm' },
        { w: ['geri götürməliyəm'], now: 'geri götürə bilərəm', type: 'Məna', why: '«may» imkan/hüquq bildirir, öhdəlik deyil.', ex: 'You may cancel → Ləğv edə bilərsiniz' },
        { w: ['gələcək qayğıma'], now: 'gələcəkdə mənə göstəriləcək tibbi yardıma', type: 'Termin', why: 'Tibbi kontekstdə «care» qayğı yox, tibbi yardım/müalicədir.', ex: 'primary care → ilkin tibbi yardım' }
      ] },

    { id: 'tibb-c1-1', level: 'C1', domain: 'Tibbi', reg: 'Rəsmi', client: 'Dərman qeydiyyatı üçün «Şəfa Farm» MMC', title: 'İstifadə təlimatı: əks göstərişlər və əlavə təsirlər',
      xp: 40, minutes: 8,
      src: "Do not take this medicine if you are allergic to ibuprofen or any of the other ingredients. Tell your doctor if you are pregnant, breast-feeding or have a history of stomach ulcers. Common side effects (may affect up to 1 in 10 people) include nausea, heartburn and dizziness. Stop treatment and seek medical help immediately if you notice black stools.",
      model: "İbuprofenə və ya dərmanın digər komponentlərindən hər hansı birinə allergiyanız varsa, bu dərmanı qəbul etməyin. Hamiləsinizsə, əmizdirirsinizsə və ya anamnezinizdə mədə xorası olubsa, həkiminizə bildirin. Tez-tez rast gəlinən əlavə təsirlər (10 nəfərdən 1-ə qədərində müşahidə oluna bilər): ürəkbulanma, mədə yanması və başgicəllənmə. Qara rəngli nəcis müşahidə etsəniz, müalicəni dayandırın və dərhal həkimə müraciət edin.",
      hints: ['«Common» burada tezlik kateqoriyasıdır.', '«up to 1 in 10» — 10 nəfərdən 1-ə qədərində.', '«heartburn» ürəklə bağlı deyil.'],
      draft: "İbuprofenə və ya dərmanın digər komponentlərindən hər hansı birinə allergiyanız varsa, bu dərmanı qəbul etməyin. Hamiləsinizsə, əmizdirirsinizsə və ya mədə xorası tarixçəniz varsa, həkiminizə bildirin. Ümumi yan təsirlər (10 nəfərdən 1-ni təsir edə bilər): ürəkbulanma, ürək yanması və başgicəllənmə. Qara rəngli nəcis müşahidə etsəniz, müalicəni dayandırın və dərhal həkimə müraciət edin.",
      tip: 'Təlimatdakı tezlik kateqoriyaları (very common, common, uncommon, rare) sabit terminlərdir — glossaridən götürün.',
      traps: [
        { w: ['Ümumi yan təsirlər'], now: 'Tez-tez rast gəlinən əlavə təsirlər', type: 'Termin', why: '«Common» təlimatda tezlik kateqoriyasıdır (10 nəfərdən 1-ə qədər), «ümumi» deyil.', ex: 'Uncommon → Az-az rast gəlinən' },
        { w: ['10 nəfərdən 1-ni təsir edə bilər'], now: '10 nəfərdən 1-ə qədərində müşahidə oluna bilər', type: 'Rəqəm', why: '«up to» yuxarı həddi bildirir; tərcümədə itirilsə, statistik məna dəyişir.', ex: 'up to 1 in 100 → 100 nəfərdən 1-ə qədərində' },
        { w: ['mədə xorası tarixçəniz'], now: 'anamnezinizdə mədə xorası', type: 'Termin', why: '«history of» tibbdə anamnez kimi verilir.', ex: 'history of asthma → anamnezdə astma' },
        { w: ['ürək yanması'], now: 'mədə yanması', type: 'Termin', why: '«heartburn» mədə turşusunun yaratdığı yanmadır, ürəklə əlaqəsi yoxdur.', ex: 'heartburn → mədə yanması (qıcqırma)' }
      ] },

    { id: 'tibb-c1-2', level: 'C1', domain: 'Tibbi', reg: 'Rəsmi', client: 'Kardiologiya şöbəsi (xarici klinikadan köçürülən pasiyent)', title: 'Qəbul qeydi: kəskin koronar sindrom',
      xp: 40, minutes: 8,
      src: "58-year-old female presenting with a 2-day history of chest pain radiating to the left arm. BP 160/95 mmHg, HR 102 bpm. ECG showed ST elevation in leads II, III and aVF. Patient denies smoking. Troponin result pending; repeat ECG in 30 minutes. Impression: inferior myocardial infarction. Plan: aspirin 300 mg stat, urgent referral to cardiology for primary PCI.",
      model: "58 yaşlı qadın pasiyent 2 gündür davam edən, sol qola irradiasiya edən döş qəfəsi ağrısı şikayəti ilə müraciət etmişdir. AT 160/95 mm c.s., ürək vurğularının sayı dəqiqədə 102. EKQ-də II, III və aVF aparmalarında ST seqmentinin elevasiyası qeydə alınmışdır. Pasiyent siqaret çəkmədiyini bildirir. Troponin analizinin nəticəsi gözlənilir; 30 dəqiqədən sonra EKQ təkrarlanmalıdır. İlkin diaqnoz: aşağı divar miokard infarktı. Plan: dərhal 300 mq aspirin, birincili PKM (perkutan koronar müdaxilə) üçün təcili kardiologiyaya göndəriş.",
      hints: ['«leads» EKQ-də «aparmalar»dır.', '«Impression» — ilkin diaqnoz.', 'Vahidləri lokallaşdırın: mm c.s., dəqiqədə vurğu.'],
      draft: "58 yaşlı qadın pasiyent 2 gündür davam edən, sol qola irradiasiya edən döş qəfəsi ağrısı şikayəti ilə müraciət etmişdir. AT 160/95 mm c.s., nəbz 102 bpm. EKQ-də II, III və aVF xətlərində ST seqmentinin elevasiyası qeydə alınmışdır. Pasiyent siqaret çəkmədiyini bildirir. Troponin analizinin nəticəsi gözlənilir; 30 dəqiqədən sonra EKQ təkrarlanmalıdır. Təəssürat: aşağı divar miokard infarktı. Plan: aspirin 300 mq stat, birincili PKM (perkutan koronar müdaxilə) üçün təcili kardiologiyaya göndəriş.",
      tip: 'Klinik qeydlərdəki ixtisarlar (stat, bpm, PCI) tərcüməçi üçün tələdir — hər birini açıb yerli ekvivalentini yazın.',
      traps: [
        { w: ['bpm'], now: 'dəqiqədə 102 vurğu', type: 'Rəqəm', why: 'Ölçü vahidləri Azərbaycan tibb sənədlərinə uyğunlaşdırılmalıdır.', ex: 'HR 80 bpm → ürək vurğularının sayı dəqiqədə 80' },
        { w: ['xətlərində'], now: 'aparmalarında', type: 'Termin', why: 'EKQ «lead»-ləri Azərbaycan kardiologiyasında «aparma» adlanır.', ex: 'lead V1 → V1 aparması' },
        { w: ['Təəssürat'], now: 'İlkin diaqnoz', type: 'Termin', why: 'Klinik qeyddə «Impression» həkimin ilkin diaqnozudur, emosional «təəssürat» deyil.', ex: 'Impression: pneumonia → İlkin diaqnoz: pnevmoniya' },
        { w: ['stat'], now: 'dərhal', type: 'Termin', why: '«stat» latınca «statim» — dərhal deməkdir; tərcüməsiz qalmamalıdır.', ex: 'morphine 5 mg stat → dərhal 5 mq morfin' }
      ] }
  ]
};

window.NUANZA_DOMAINS['it'] = {
  key: 'it', name: 'İT və lokalizasiya', icon: 'code',
  why: "Azərbaycanda mobil tətbiqlərin, bank və dövlət xidmətlərinin rəqəmsallaşması ilə interfeys, istifadəçi təlimatları və məxfilik siyasətlərinin peşəkar lokalizasiyasına tələbat sürətlə artır.",
  glossary: [
    { en: 'localization (L10n)', az: 'lokalizasiya' },
    { en: 'user interface (UI)', az: 'istifadəçi interfeysi' },
    { en: 'string', az: 'sətir (interfeys mətni)' },
    { en: 'placeholder / variable', az: 'yertutan / dəyişən', note: '{name}, %d, %s toxunulmaz saxlanır' },
    { en: 'Save', az: 'Yadda saxla' },
    { en: 'Cancel', az: 'Ləğv et' },
    { en: 'Settings', az: 'Parametrlər', note: '«Ayarlar» türk formasıdır' },
    { en: 'Account', az: 'Hesab' },
    { en: 'password', az: 'parol' },
    { en: 'to reset', az: 'sıfırlamaq' },
    { en: 'verification code', az: 'təsdiq kodu' },
    { en: 'to tap / to click', az: 'toxunmaq / klikləmək' },
    { en: 'folder', az: 'qovluq' },
    { en: 'file', az: 'fayl' },
    { en: 'to upload / to download', az: 'yükləmək / endirmək' },
    { en: 'bug', az: 'xəta', note: '«böcək» yox' },
    { en: 'crash', az: 'qəfil bağlanma / çökmə' },
    { en: 'release notes', az: 'buraxılış qeydləri' },
    { en: 'version', az: 'versiya' },
    { en: 'feature', az: 'funksiya / imkan' },
    { en: 'update', az: 'yeniləmə' },
    { en: 'tooltip', az: 'izah (siçanı üzərinə gətirəndə açılan qısa mətn)' },
    { en: 'toast / notification', az: 'bildiriş' },
    { en: 'empty state', az: 'boş vəziyyət ekranı' },
    { en: 'keyboard shortcut', az: 'klaviatura qısayolu', note: 'Ctrl+S tərcümə olunmur' },
    { en: 'personal data', az: 'şəxsi məlumatlar' },
    { en: 'third party', az: 'üçüncü şəxs' },
    { en: 'data controller', az: 'məlumatların operatoru / sahibi' },
    { en: 'privacy policy', az: 'məxfilik siyasəti' },
    { en: 'terms of use', az: 'istifadə şərtləri' },
    { en: 'as is', az: '«olduğu kimi»' },
    { en: 'warranty', az: 'zəmanət' },
    { en: 'consequential damages', az: 'törəmə (dolayı) zərər' },
    { en: 'to be liable', az: 'məsuliyyət daşımaq' },
    { en: 'character limit', az: 'simvol limiti' },
    { en: 'spam folder', az: 'spam qovluğu' }
  ],
  tasks: [
    { id: 'it-b1-1', level: 'B1', domain: 'İT və lokalizasiya', reg: 'Neytral', client: 'Mobil tətbiq startapı «Şirkət A»', title: 'İnterfeys sətirləri',
      xp: 20, minutes: 3,
      src: "Save changes | Welcome back, {name}! | You have %d new messages. | Are you sure you want to delete this file?",
      model: "Dəyişiklikləri yadda saxla | Yenidən xoş gəldiniz, {name}! | %d yeni mesajınız var. | Bu faylı silmək istədiyinizə əminsiniz?",
      hints: ['{name} və %d kimi yertutanlara toxunmayın.', 'Düymələr qısa və eyniformalı olmalıdır.', '«Save» üçün standart: «Yadda saxla».'],
      draft: "Dəyişiklikləri qeyd edin | Yenidən xoş gəldiniz, {ad}! | % d yeni mesajınız var. | Bu faylı silmək istədiyinizə əminsiniz?",
      tip: 'Yertutan proqram kodudur, söz deyil: onu tərcümə etsəniz, tətbiq istifadəçinin adını göstərə bilməyəcək.',
      traps: [
        { w: ['{ad}'], now: '{name}', type: 'Ad', why: 'Yertutanın adı kodda dəyişən kimi axtarılır; tərcümə edilsə, sətir sınır.', ex: 'Hello, {user}! → Salam, {user}!' },
        { w: ['% d'], now: '%d', type: 'Durğu', why: 'Format spesifikatoru boşluqsuz və dəyişmədən qalmalıdır, əks halda rəqəm yerinə simvollar çıxacaq.', ex: '%d items → %d element' },
        { w: ['qeyd edin'], now: 'yadda saxla', type: 'Üslub', why: 'Düymələrdə qısa əmr forması və standart termin «Yadda saxla» işlənir.', ex: 'Save → Yadda saxla' }
      ] },

    { id: 'it-b1-2', level: 'B1', domain: 'İT və lokalizasiya', reg: 'Neytral', client: 'Bank tətbiqi komandası (App Store qeydi)', title: 'Buraxılış qeydləri 2.4',
      xp: 20, minutes: 4,
      src: "Version 2.4 is now available. We fixed a bug that caused the app to crash on startup and improved battery usage. Update now to get the latest features.",
      model: "2.4 versiyası artıq əlçatandır. Tətbiqin işə salınarkən qəfil bağlanmasına səbəb olan xətanı aradan qaldırdıq və batareya istifadəsini optimallaşdırdıq. Ən yeni funksiyaları əldə etmək üçün indi yeniləyin.",
      hints: ['Versiya nömrəsi onluq kəsr deyil.', '«bug» — xəta.', '«features» — funksiyalar.'],
      draft: "2,4 versiyası artıq əlçatandır. Tətbiqin işə salınarkən qəfil bağlanmasına səbəb olan böceyi aradan qaldırdıq və batareya istifadəsini optimallaşdırdıq. Son xüsusiyyətləri əldə etmək üçün indi yeniləyin.",
      tip: 'Versiya nömrələri (2.4, 10.1.3) identifikatordur — onları rəqəm kimi lokallaşdırmayın.',
      traps: [
        { w: ['2,4'], now: '2.4', type: 'Rəqəm', why: 'Versiya nömrəsi kəsr deyil, nöqtəli identifikatordur və dəyişdirilmir.', ex: 'iOS 17.2 → iOS 17.2' },
        { w: ['böceyi'], now: 'xətanı', type: 'Termin', why: '«bug» proqram xətasıdır; «böcək» hərfi və üstəlik türk yazılışıdır.', ex: 'bug fixes → xətaların aradan qaldırılması' },
        { w: ['Son xüsusiyyətləri'], now: 'Ən yeni funksiyaları', type: 'Termin', why: 'Proqram təminatında «features» funksiyalar kimi verilir; «son» isə «axırıncı» kimi anlaşıla bilər.', ex: 'new features → yeni funksiyalar' }
      ] },

    { id: 'it-b2-1', level: 'B2', domain: 'İT və lokalizasiya', reg: 'Neytral', client: 'Elektron xidmətlər portalı «Rəqəmsal MMC»', title: 'İstifadəçi təlimatı: parolun sıfırlanması',
      xp: 30, minutes: 6,
      src: "To reset your password, tap Settings > Account > Security and select 'Forgot password'. A verification code will be sent to your registered email address. The code expires after 10 minutes. If you do not receive it, check your spam folder.",
      model: "Parolunuzu sıfırlamaq üçün Parametrlər > Hesab > Təhlükəsizlik bölməsinə keçin və «Parolu unutmusunuz?» seçimini edin. Qeydiyyatdan keçdiyiniz e-poçt ünvanına təsdiq kodu göndəriləcək. Kodun etibarlılıq müddəti 10 dəqiqədir. Kodu almasanız, spam qovluğunu yoxlayın.",
      hints: ['Menyu adları tətbiqin Azərbaycan interfeysindəki adlarla eyni olmalıdır.', '«expires after 10 minutes» — rəqəm və vahidi yoxlayın.', 'Bütün mətndə bir termin: parol.'],
      draft: "Şifrənizi sıfırlamaq üçün Ayarlar > Hesab > Təhlükəsizlik bölməsinə keçin və 'Forgot password' seçimini edin. Qeydiyyatdan keçdiyiniz e-poçt ünvanına təsdiq kodu göndəriləcək. Kodun etibarlılıq müddəti 10 saatdır. Kodu almasanız, spam qovluğunu yoxlayın.",
      tip: 'Təlimatdakı düymə adları ekranda gördüyü sözlə hərfi-hərfinə üst-üstə düşməlidir — interfeys sətirləri faylını açıb yoxlayın.',
      traps: [
        { w: ['Ayarlar'], now: 'Parametrlər', type: 'Türk forması', why: '«Ayarlar» türk interfeyslərindən keçib; Azərbaycan lokalizasiyasında «Parametrlər» işlənir.', ex: 'Settings → Parametrlər' },
        { w: ["'Forgot password'"], now: '«Parolu unutmusunuz?»', type: 'Termin', why: 'İstifadəçi ingilis düyməsini yox, lokallaşdırılmış interfeysi görür; mətn ona uyğun olmalıdır.', ex: "'Log out' → «Çıxış»" },
        { w: ['10 saatdır'], now: '10 dəqiqədir', type: 'Rəqəm', why: '«minutes» dəqiqədir; vahid səhvi təhlükəsizlik məlumatını təhrif edir.', ex: '5 minutes → 5 dəqiqə' },
        { w: ['Şifrənizi'], now: 'Parolunuzu', type: 'Termin', why: 'Eyni məhsulda bir anlayış üçün bir termin işlədilməlidir; glossaridə «password» = parol.', ex: 'Change password → Parolu dəyiş' }
      ] },

    { id: 'it-b2-2', level: 'B2', domain: 'İT və lokalizasiya', reg: 'Hüquqi', client: 'Onlayn mağaza «Şirkət A» MMC', title: 'Məxfilik siyasəti: məlumatların toplanması',
      xp: 30, minutes: 6,
      src: "We collect personal data only to the extent necessary to provide our services. We do not sell your data to third parties. You have the right to request access to, correction or deletion of your personal data at any time by contacting privacy@example.com.",
      model: "Biz şəxsi məlumatları yalnız xidmətlərimizi göstərmək üçün zəruri olan həcmdə toplayırıq. Məlumatlarınızı üçüncü şəxslərə satmırıq. Siz istənilən vaxt privacy@example.com ünvanı ilə əlaqə saxlayaraq şəxsi məlumatlarınıza çıxış əldə etməyi, onların düzəldilməsini və ya silinməsini tələb etmək hüququna maliksiniz.",
      hints: ['«personal data» — şəxsi məlumatlar (qanunvericilik termini).', '«third parties» hüquqi mətndə «üçüncü şəxslər»dir.', 'E-poçt ünvanlarına və URL-lərə toxunmayın.'],
      draft: "Biz şəxsi datanı yalnız xidmətlərimizi göstərmək üçün zəruri olan həcmdə toplayırıq. Məlumatlarınızı üçüncü tərəflərə satmırıq. Siz istənilən vaxt privacy@example.az ünvanı ilə əlaqə saxlayaraq şəxsi məlumatlarınıza çıxış əldə etməyi, onların düzəldilməsini və ya silinməsini tələb etmək hüququna maliksiniz.",
      tip: 'Məxfilik siyasəti hüquqi sənəddir: terminləri «Fərdi məlumatlar haqqında» qanunun dilinə yaxın saxlayın.',
      traps: [
        { w: ['şəxsi datanı'], now: 'şəxsi məlumatları', type: 'Termin', why: '«data» hüquqi mətndə «məlumatlar» kimi verilir; «data» jarqondur.', ex: 'data subject → məlumat subyekti' },
        { w: ['üçüncü tərəflərə'], now: 'üçüncü şəxslərə', type: 'Termin', why: 'Azərbaycan hüquq dilində sabit ifadə «üçüncü şəxslər»dir.', ex: 'disclose to third parties → üçüncü şəxslərə açıqlamaq' },
        { w: ['privacy@example.az'], now: 'privacy@example.com', type: 'Ad', why: 'E-poçt ünvanları, domenlər və URL-lər lokallaşdırılmır — dəyişsə, müraciət ünvanına çatmaz.', ex: 'support@company.com → support@company.com' }
      ] },

    { id: 'it-c1-1', level: 'C1', domain: 'İT və lokalizasiya', reg: 'Hüquqi', client: 'SaaS platforması «Bulud Xidmət» MMC', title: 'İstifadə şərtləri: məsuliyyətin məhdudlaşdırılması',
      xp: 40, minutes: 8,
      src: "The Service is provided 'as is' without warranties of any kind. To the fullest extent permitted by law, the Company shall not be liable for any indirect or consequential damages arising out of your use of the Service. The Company may amend these Terms at any time; continued use of the Service after such amendments shall constitute your acceptance of the revised Terms.",
      model: "Xidmət hər hansı zəmanət verilmədən «olduğu kimi» təqdim edilir. Qanunla icazə verilən maksimum həddə Şirkət Xidmətdən istifadəniz nəticəsində yaranan hər hansı dolayı və ya törəmə zərərə görə məsuliyyət daşımır. Şirkət bu Şərtlərə istənilən vaxt dəyişiklik edə bilər; belə dəyişikliklərdən sonra Xidmətdən istifadəni davam etdirməyiniz yenilənmiş Şərtləri qəbul etdiyiniz mənasını verir.",
      hints: ['«shall not» — inkar; öhdəlik yox, məsuliyyətin istisnasıdır.', '«may amend» — hüquqdur.', '«consequential damages» sabit hüquqi termindir.'],
      draft: "Xidmət hər hansı zəmanət verilmədən «olduğu kimi» təqdim edilir. Qanunla icazə verilən maksimum həddə Şirkət Xidmətdən istifadəniz nəticəsində yaranan hər hansı dolayı və ya ardıcıl zərərə görə məsuliyyət daşımalıdır. Şirkət bu Şərtlərə istənilən vaxt dəyişiklik etməlidir; belə dəyişikliklərdən sonra Xidmətdən istifadəni davam etdirməyiniz yenilənmiş Şərtləri qəbul etdiyiniz mənasını verir.",
      tip: '«Shall not be liable» cümləsində «not»u itirmək şirkətin məsuliyyətini tam tərsinə çevirir — inkarı ilk yoxlayın.',
      traps: [
        { w: ['ardıcıl zərərə'], now: 'törəmə zərərə', type: 'Termin', why: '«consequential» burada «ardıcıl» yox, birbaşa olmayan, nəticə kimi yaranan (törəmə) zərərdir.', ex: 'consequential loss → törəmə itki' },
        { w: ['məsuliyyət daşımalıdır'], now: 'məsuliyyət daşımır', type: 'Məna', why: '«shall not be liable» məsuliyyəti istisna edir; tərcümə mənanı tərsinə çevirib.', ex: 'shall not be liable → məsuliyyət daşımır' },
        { w: ['dəyişiklik etməlidir'], now: 'dəyişiklik edə bilər', type: 'Məna', why: '«may» Şirkətin hüququdur, öhdəliyi deyil.', ex: 'The Company may suspend → Şirkət dayandıra bilər' }
      ] },

    { id: 'it-c1-2', level: 'C1', domain: 'İT və lokalizasiya', reg: 'Neytral', client: 'Layihə idarəetmə tətbiqi «Şirkət A»', title: 'Simvol limitli interfeys paketi',
      xp: 40, minutes: 8,
      src: "Button (max 12 chars): Get started | Toast: {count} files uploaded successfully | Error: Couldn't connect to the server. Check your internet connection and try again. | Tooltip: Press Ctrl+S to save | Empty state: No results found for “{query}”. Try a different keyword or remove filters. | Notification: {user} commented on your post %s ago",
      model: "Düymə (maks. 12 simvol): Başla | Bildiriş: {count} fayl uğurla yükləndi | Xəta: Serverə qoşulmaq mümkün olmadı. İnternet bağlantınızı yoxlayıb yenidən cəhd edin. | İzah: Yadda saxlamaq üçün Ctrl+S düymələrini basın | Boş vəziyyət: «{query}» üzrə nəticə tapılmadı. Başqa açar söz yoxlayın və ya filtrləri silin. | Bildiriş: {user} %s əvvəl paylaşımınıza şərh yazdı",
      hints: ['Simvol limitini sayın — boşluqlar da daxildir.', 'Azərbaycan dilində saydan sonra isim cəmlənmir.', 'Qısayollar və yertutanlar olduğu kimi qalır.'],
      draft: "Düymə (maks. 12 simvol): Başlamaq üçün klikləyin | Bildiriş: {count} fayllar uğurla yükləndi | Xəta: Serverə qoşulmaq mümkün olmadı. İnternet bağlantınızı yoxlayıb yenidən cəhd edin. | İzah: Yadda saxlamaq üçün Ctrl+Ş düymələrini basın | Boş vəziyyət: «{sorğu}» üzrə nəticə tapılmadı. Başqa açar söz yoxlayın və ya filtrləri silin. | Bildiriş: {user} %s əvvəl paylaşımınıza şərh yazdı",
      tip: 'İnterfeysdə qısalıq keyfiyyətdir: limiti aşan düymə ekranda kəsilir və «Başlamaq üçün kl…» kimi görünür.',
      traps: [
        { w: ['Başlamaq üçün klikləyin'], now: 'Başla', type: 'Üslub', why: 'Düymə 12 simvolla məhdudlaşıb; 23 simvolluq mətn ekrana sığmayacaq.', ex: 'Sign in → Daxil ol' },
        { w: ['{count} fayllar'], now: '{count} fayl', type: 'Üslub', why: 'Azərbaycan dilində saydan sonra isim tək formada işlənir.', ex: '5 files → 5 fayl' },
        { w: ['Ctrl+Ş'], now: 'Ctrl+S', type: 'Ad', why: 'Klaviatura qısayolları fiziki düymələrə bağlıdır və tərcümə olunmur.', ex: 'Ctrl+Z → Ctrl+Z' },
        { w: ['{sorğu}'], now: '{query}', type: 'Ad', why: 'Yertutan kod dəyişənidir; adı dəyişsə, axtarış sözü ekranda görünməyəcək.', ex: '“{query}” → «{query}»' }
      ] }
  ]
};

window.NUANZA_DOMAINS['media'] = {
  key: 'media', name: 'Media, marketinq və ədəbiyyat', icon: 'megaphone',
  why: "Azərbaycan media bazarında beynəlxalq brendlərin reklam kampaniyaları, xəbər lentləri, yayım platformaları üçün subtitrlər və dünya klassikasının yeni tərcümələri tərcüməçidən həm dəqiqlik, həm də yaradıcı üslub tələb edir.",
  glossary: [
    { en: 'headline', az: 'başlıq' },
    { en: 'lead (news)', az: 'lid, xəbərin giriş abzası' },
    { en: 'dateline', az: 'xəbərin yer və tarix qeydi' },
    { en: 'press release', az: 'press-reliz / mətbuat açıqlaması' },
    { en: 'reporters / journalists', az: 'jurnalistlər' },
    { en: 'chief executive (CEO)', az: 'baş icraçı direktor' },
    { en: 'revenue', az: 'gəlir (dövriyyə)' },
    { en: 'first quarter', az: 'birinci rüb' },
    { en: 'retail chain', az: 'pərakəndə satış şəbəkəsi' },
    { en: 'percent / percentage point', az: 'faiz / faiz bəndi' },
    { en: 'million / billion', az: 'milyon / milyard' },
    { en: 'slogan / tagline', az: 'şüar / slogan' },
    { en: 'call to action', az: 'hərəkətə çağırış' },
    { en: 'buy one, get one free', az: 'birini al, ikincisi hədiyyə' },
    { en: 'offer / promotion', az: 'kampaniya / aksiya' },
    { en: 'valid until', az: '... qədər qüvvədədir' },
    { en: 'target audience', az: 'hədəf auditoriya' },
    { en: 'brand voice', az: 'brendin dili / tonu' },
    { en: 'copywriting', az: 'kopiraytinq' },
    { en: 'transcreation', az: 'yaradıcı uyğunlaşdırma (transkreasiya)' },
    { en: 'subtitle', az: 'subtitr' },
    { en: 'characters per line (CPL)', az: 'sətirdə simvol sayı' },
    { en: 'reading speed', az: 'oxuma sürəti' },
    { en: 'line break', az: 'sətir keçidi' },
    { en: 'dubbing / voice-over', az: 'dublyaj / səsləndirmə' },
    { en: 'idiom', az: 'idiom, frazeoloji birləşmə' },
    { en: 'break a leg', az: 'uğurlar! (səhnə idiomu)' },
    { en: 'like the back of one’s hand', az: 'beş barmağı kimi / əzbər' },
    { en: 'rehearsal', az: 'məşq' },
    { en: 'play (theatre)', az: 'tamaşa, pyes' },
    { en: 'literary prose', az: 'bədii nəsr' },
    { en: 'anaphora / parallelism', az: 'anafora / paralellik' },
    { en: 'irony', az: 'ironiya, kinayə' },
    { en: 'fortune (wealth)', az: 'var-dövlət, sərvət', note: '«şans» deyil' },
    { en: 'single (unmarried)', az: 'subay' },
    { en: 'public domain', az: 'ictimai mülkiyyət (müəllif hüququ bitmiş)' }
  ],
  tasks: [
    { id: 'media-b1-1', level: 'B1', domain: 'Media, marketinq və ədəbiyyat', reg: 'Danışıq', client: 'Kafe şəbəkəsi «Kofe Evi»', title: 'Reklam bannerı: həftəlik aksiya',
      xp: 20, minutes: 3,
      src: "Fresh coffee, every morning. Buy one, get one free — this week only at all Kofe Evi cafés! Offer valid until 15 June.",
      model: "Hər səhər təzə qəhvə. Birini al, ikincisi hədiyyə — yalnız bu həftə bütün «Kofe Evi» kafelərində! Kampaniya 15 iyuna qədər qüvvədədir.",
      hints: ['Reklam dili hərfi yox, təbii səslənməlidir.', 'Ay adları kiçik hərflə yazılır.', '«valid until» — ... qədər qüvvədədir.'],
      draft: "Hər səhər təzə qəhvə. Birini al, birini pulsuz al — yalnız bu həftə bütün «Kofe Evi» kafelərində! Kampaniya 15 İyuna qədər keçərlidir.",
      tip: 'Şüar tərcümə edilmir, yenidən yazılır: Azərbaycan alıcısının gündəlik dildə eşitdiyi formanı tapın.',
      traps: [
        { w: ['birini pulsuz al'], now: 'ikincisi hədiyyə', type: 'Üslub', why: 'Hərfi kalka ağır səslənir; yerli reklamda sabit formul «birini al, ikincisi hədiyyə»dir.', ex: 'Buy 2, get 1 free → 2 al, 1 hədiyyə' },
        { w: ['15 İyuna'], now: '15 iyuna', type: 'Tarix', why: 'Azərbaycan dilində ay adları kiçik hərflə yazılır.', ex: '1 May → 1 may' },
        { w: ['keçərlidir'], now: 'qüvvədədir', type: 'Türk forması', why: '«Keçərli» türk sözüdür; Azərbaycan dilində «qüvvədədir» və ya «etibarlıdır» işlənir.', ex: 'valid until → ... qədər qüvvədədir' }
      ] },

    { id: 'media-b1-2', level: 'B1', domain: 'Media, marketinq və ədəbiyyat', reg: 'Danışıq', client: 'Yayım platforması «Ekran»', title: 'Serial subtitrləri: gecə söhbəti',
      xp: 20, minutes: 4,
      src: "[Subtitles, max 42 characters per line] — Where were you last night? — I told you. I was working late. — Until three in the morning?",
      model: "— Dünən gecə harada idin? | — Dedim axı. Gec saata qədər işləyirdim. | — Səhər saat üçə qədər?",
      hints: ['Ər-arvad dialoqu: «sən» müraciəti.', 'Hər sətir 42 simvoldan çox olmamalıdır.', 'Dialoqda kiçik rəqəmləri sözlə yazın.'],
      draft: "— Dünən gecə harada idiniz? | — Sənə dedim axı, mən dünən gecə gec saata qədər ofisdə işləyirdim. | — Səhər saat 3-ə qədər?",
      tip: 'Subtitr danışıqdan qısa olmalıdır: tamaşaçı oxumağa yox, filmə baxmağa gəlib.',
      traps: [
        { w: ['idiniz'], now: 'idin', type: 'Üslub', why: 'Yaxın adamlar arasındakı mübahisədə «siz» müraciəti qeyri-təbiidir.', ex: 'Are you OK? → Yaxşısan?' },
        { w: ['Sənə dedim axı, mən dünən gecə gec saata qədər ofisdə işləyirdim.'], now: 'Dedim axı. Gec saata qədər işləyirdim.', type: 'Üslub', why: 'Sətir 42 simvol limitini aşır və orijinalda olmayan «ofisdə» sözü əlavə olunub.', ex: 'I was busy. → Məşğul idim.' },
        { w: ['saat 3-ə'], now: 'saat üçə', type: 'Rəqəm', why: 'Subtitr dialoqunda kiçik rəqəmlər adətən sözlə yazılır, danışıq ahəngi qorunur.', ex: 'at two → saat ikidə' }
      ] },

    { id: 'media-b2-1', level: 'B2', domain: 'Media, marketinq və ədəbiyyat', reg: 'Rəsmi', client: 'İqtisadi xəbər portalı', title: 'Xəbər: pərakəndə şəbəkənin rüblük nəticələri',
      xp: 30, minutes: 6,
      src: "Retail chain Shahar Market said on Tuesday that its first-quarter revenue rose 12.5 percent to 18.4 million manat, driven by online sales. The company plans to open 15 new stores by the end of 2026 and hire about 600 staff, its chief executive told reporters.",
      model: "«Şəhər Market» pərakəndə satış şəbəkəsi çərşənbə axşamı bildirib ki, birinci rübdə gəliri onlayn satışların hesabına 12,5 faiz artaraq 18,4 milyon manata çatıb. Şirkətin baş icraçı direktoru jurnalistlərə bildirib ki, 2026-cı ilin sonunadək 15 yeni mağaza açmaq və təxminən 600 işçi işə götürmək planlaşdırılır.",
      hints: ['Tuesday — çərşənbə axşamı.', 'Onluq kəsrdə vergül: 12,5.', 'million ≠ milyard.'],
      draft: "«Şəhər Market» pərakəndə satış şəbəkəsi çərşənbə günü bildirib ki, birinci rübdə gəliri onlayn satışların hesabına 12.5 faiz artaraq 18,4 milyard manata çatıb. Şirkətin baş icraçı direktoru reportyorlara bildirib ki, 2026-cı ilin sonunadək 15 yeni mağaza açmaq və təxminən 600 işçi işə götürmək planlaşdırılır.",
      tip: 'Xəbərdə rəqəm, tarix və həftə günü faktdır: bir səhv — və xəbər təkzib tələb edir.',
      traps: [
        { w: ['çərşənbə günü'], now: 'çərşənbə axşamı', type: 'Tarix', why: 'Tuesday çərşənbə axşamıdır; çərşənbə (Wednesday) başqa gündür.', ex: 'Wednesday → çərşənbə' },
        { w: ['12.5 faiz'], now: '12,5 faiz', type: 'Rəqəm', why: 'Azərbaycan dilində onluq kəsr vergüllə yazılır.', ex: '3.75% → 3,75 faiz' },
        { w: ['milyard'], now: 'milyon', type: 'Rəqəm', why: '«million» milyondur; səhv rəqəmi min dəfə şişirdir.', ex: '2.1 billion → 2,1 milyard' },
        { w: ['reportyorlara'], now: 'jurnalistlərə', type: 'Termin', why: 'Azərbaycan mediasında «reporters» üçün təbii söz «jurnalistlər»dir.', ex: 'told reporters → jurnalistlərə bildirib' }
      ] },

    { id: 'media-b2-2', level: 'B2', domain: 'Media, marketinq və ədəbiyyat', reg: 'Danışıq', client: 'Film festivalı üçün subtitr studiyası', title: 'Film subtitrləri: premyeradan əvvəl',
      xp: 30, minutes: 6,
      src: "[Film subtitles, max 2 lines × 42 characters] — Break a leg tonight! — Thanks. I'm so nervous I could throw up. — Relax. You've been rehearsing for months. You know this play like the back of your hand.",
      model: "— Bu axşam uğurlar! | — Sağ ol. Elə həyəcanlıyam ki, ürəyim bulanır. | — Sakit ol. Aylardır məşq edirsən. Bu tamaşanı əzbər bilirsən.",
      hints: ['İdiomları mənası ilə verin, sözbəsöz yox.', 'Danışıq dili, «sən» müraciəti.', 'Subtitr qısa və təbii olmalıdır.'],
      draft: "— Bu axşam ayağını sındır! | — Sağ ol. Elə həyəcanlıyam ki, qusa bilərəm. | — Sakit ol. Aylardır məşq edirsən. Bu tamaşanı əlinin içi kimi bilirsən.",
      tip: 'İdiomun sözlərini yox, funksiyasını tərcümə edin: «break a leg» bəddua deyil, arzu cümləsidir.',
      traps: [
        { w: ['ayağını sındır'], now: 'uğurlar', type: 'Məna', why: '«Break a leg» səhnə ənənəsində uğur arzusudur; hərfi tərcümə tamaşaçını çaşdırır.', ex: 'Break a leg! → Uğurlar!' },
        { w: ['qusa bilərəm'], now: 'ürəyim bulanır', type: 'Üslub', why: 'Hiperbola Azərbaycan danışığında daha təbii və yumşaq ifadə ilə verilir.', ex: 'I could throw up → ürəyim bulanır' },
        { w: ['əlinin içi kimi bilirsən'], now: 'əzbər bilirsən', type: 'Üslub', why: 'Kalka anlaşılmazdır; yerli ekvivalent «əzbər» və ya «beş barmağın kimi bilirsən»dir.', ex: 'know like the back of your hand → beş barmağın kimi bilmək' }
      ] },

    { id: 'media-c1-1', level: 'C1', domain: 'Media, marketinq və ədəbiyyat', reg: 'Neytral', client: 'Nəşriyyat — Charles Dickens, «A Tale of Two Cities» (1859), ictimai mülkiyyət', title: 'Dikkens: «İki şəhərin hekayəsi» — giriş',
      xp: 40, minutes: 8,
      src: "It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness, it was the epoch of belief, it was the epoch of incredulity, it was the season of Light, it was the season of Darkness, it was the spring of hope, it was the winter of despair, we had everything before us, we had nothing before us…",
      model: "Bu, zamanların ən yaxşısı idi, zamanların ən pisi idi; müdriklik çağı idi, axmaqlıq çağı idi; iman dövrü idi, inamsızlıq dövrü idi; İşıq fəsli idi, Zülmət fəsli idi; ümid baharı idi, ümidsizlik qışı idi; qarşımızda hər şey var idi, qarşımızda heç nə yox idi…",
      hints: ['Dikkensin cüt-cüt paralelliyini qoruyun: eyni söz iki dəfə təkrarlanır.', 'Müəllifin böyük hərfləri (Light, Darkness) məqsədlidir.', '«spring» — bahar (ikimənalılıqdan qaçın).'],
      draft: "Bu, zamanların ən yaxşısı idi, zamanların ən pisi idi; müdriklik çağı idi, axmaqlıq dövrü idi; iman epoxası idi, inamsızlıq epoxası idi; işıq fəsli idi, zülmət fəsli idi; ümid yazı idi, ümidsizlik qışı idi; qarşımızda hər şey var idi, qarşımızda heç nə yox idi…",
      tip: 'Bədii mətndə forma da məzmundur: ritmi, təkrarı və müəllifin durğu işarələrini tərcümədə yaşadın.',
      traps: [
        { w: ['axmaqlıq dövrü'], now: 'axmaqlıq çağı', type: 'Üslub', why: 'Orijinalda «age … age» təkrarlanır; cütün ikinci hissəsində söz dəyişsə, Dikkensin paralelliyi pozulur.', ex: 'the age of wisdom, the age of foolishness → müdriklik çağı, axmaqlıq çağı' },
        { w: ['epoxası'], now: 'dövrü', type: 'Üslub', why: '«Epoxa» ağır, kitabi alınmadır və cümlənin ritmini qırır; «dövr» təbii və ahəngdardır.', ex: 'epoch of belief → iman dövrü' },
        { w: ['işıq fəsli idi, zülmət fəsli'], now: 'İşıq fəsli idi, Zülmət fəsli', type: 'Orfoqrafiya', why: 'Dikkens «Light» və «Darkness» sözlərini simvol kimi böyük hərflə yazıb; tərcümə bunu saxlamalıdır.', ex: 'the season of Light → İşıq fəsli' },
        { w: ['ümid yazı'], now: 'ümid baharı', type: 'Məna', why: '«yazı» həm «yaz fəsli», həm də «yazı (mətn)» kimi oxuna bilər; «bahar» ikimənalılığı aradan qaldırır və poetikdir.', ex: 'the spring of hope → ümid baharı' }
      ] },

    { id: 'media-c1-2', level: 'C1', domain: 'Media, marketinq və ədəbiyyat', reg: 'Neytral', client: 'Nəşriyyat — Jane Austen, «Pride and Prejudice» (1813), ictimai mülkiyyət', title: 'Ostin: «Qürur və qərəz» — ilk abzas',
      xp: 40, minutes: 8,
      src: "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife. However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families, that he is considered the rightful property of some one or other of their daughters.",
      model: "Hamının qəbul etdiyi bir həqiqətdir ki, böyük var-dövlət sahibi olan subay kişinin mütləq arvada ehtiyacı olur. Belə bir kişi yeni bir yerə ilk dəfə gələndə onun hissləri və ya fikirləri nə qədər az bilinsə də, bu həqiqət ətrafdakı ailələrin beynində elə möhkəm oturub ki, onu bu ailələrin qızlarından birinin qanuni mülkü sayırlar.",
      hints: ['«fortune» burada var-dövlətdir.', '«single» — subay.', 'Ostinin ironiyası: «must be in want of» — ehtiyacı olmalıdır (guya).'],
      draft: "Hamının qəbul etdiyi bir həqiqətdir ki, böyük şansı olan tək kişi mütləq arvad istəməlidir. Belə bir kişi yeni bir yerə ilk dəfə gələndə onun hissləri və ya fikirləri nə qədər az bilinsə də, bu həqiqət ətrafdakı ailələrin beynində elə möhkəm oturub ki, onu bu ailələrin qızlarından birinin haqlı mülkiyyəti sayırlar.",
      tip: 'Ostinin ironiyası ciddi tonla deyilən absurddadır: tərcümə təmtəraqlı səslənməli, amma oxucu gülümsəməlidir.',
      traps: [
        { w: ['böyük şansı olan'], now: 'böyük var-dövlət sahibi olan', type: 'Məna', why: 'XIX əsr ingilis dilində «fortune» bəxt yox, sərvət deməkdir.', ex: 'a man of fortune → varlı adam' },
        { w: ['tək kişi'], now: 'subay kişi', type: 'Məna', why: '«single» burada ailə vəziyyətidir; «tək» yalnız, kimsəsiz kimi anlaşılır.', ex: 'single woman → subay qadın' },
        { w: ['arvad istəməlidir'], now: 'arvada ehtiyacı olur', type: 'Üslub', why: '«be in want of» — ehtiyac duymaq; ironiya ondadır ki, bu «ehtiyac»ı kişi yox, qonşular müəyyən edir.', ex: 'in want of money → pula ehtiyacı olan' },
        { w: ['haqlı mülkiyyəti'], now: 'qanuni mülkü', type: 'Termin', why: '«rightful property» hüquqi çalarlı ifadədir; Azərbaycan dilində sabit qarşılığı «qanuni mülk»dür, «haqlı mülkiyyət» isə süni səslənir.', ex: 'rightful owner → qanuni sahib' }
      ] }
  ]
};
