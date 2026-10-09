/* Nuanza — Hüquq, Rəsmi sənədlər, Maliyyə, Neft-qaz curriculum (original Nuanza content). */
window.NUANZA_DOMAINS = window.NUANZA_DOMAINS || {};

/* ───────────────────────── 1. HÜQUQİ SƏNƏDLƏR ───────────────────────── */
window.NUANZA_DOMAINS['huquq'] = {
  key: 'huquq', name: 'Hüquqi sənədlər', icon: 'scale',
  why: 'Azərbaycanda xarici investorlarla bağlanan müqavilələrin, etibarnamələrin və məhkəmə qərarlarının tərcüməsi ən çox sifariş edilən və səhvi ən baha başa gələn işlərdəndir.',
  glossary: [
    { en: 'shall', az: '-malıdır / -məlidir', note: 'öhdəlik bildirir, gələcək zaman deyil' },
    { en: 'may', az: '-a / -ə bilər; hüququ var', note: 'hüquq bildirir' },
    { en: 'may not', az: '-a / -ə bilməz', note: 'qadağa bildirir' },
    { en: 'indemnify', az: 'zərərin əvəzini ödəmək' },
    { en: 'liability', az: 'məsuliyyət' },
    { en: 'obligation', az: 'öhdəlik' },
    { en: 'breach of contract', az: 'müqavilənin pozulması' },
    { en: 'terminate the Agreement', az: 'Müqaviləyə xitam vermək' },
    { en: 'governing law', az: 'tətbiq olunan hüquq' },
    { en: 'jurisdiction', az: 'yurisdiksiya' },
    { en: 'force majeure', az: 'fors-major' },
    { en: 'hereinafter referred to as', az: 'bundan sonra ... adlandırılacaq' },
    { en: 'in witness whereof', az: 'bunun təsdiqi olaraq' },
    { en: 'notwithstanding', az: 'baxmayaraq', note: 'türkcə «rağmen» deyil' },
    { en: 'Service Provider', az: 'Xidmət göstərən' },
    { en: 'Customer', az: 'Sifarişçi', note: 'xidmət müqaviləsində' },
    { en: 'Seller / Buyer', az: 'Satıcı / Alıcı' },
    { en: 'Lessor', az: 'İcarəyə verən' },
    { en: 'Lessee', az: 'İcarəçi' },
    { en: 'sublet', az: 'subicarəyə vermək' },
    { en: 'Employer', az: 'İşəgötürən' },
    { en: 'Employee', az: 'İşçi' },
    { en: 'probation period', az: 'sınaq müddəti' },
    { en: 'annual leave', az: 'illik məzuniyyət', note: '«tətil» deyil' },
    { en: 'calendar days', az: 'təqvim günləri' },
    { en: 'Confidential Information', az: 'Məxfi Məlumat' },
    { en: 'Disclosing Party', az: 'Açıqlayan Tərəf' },
    { en: 'Receiving Party', az: 'Qəbul edən Tərəf' },
    { en: 'fault', az: 'təqsir', note: 'hüquqi mətndə «günah» yox' },
    { en: 'penalty (contractual)', az: 'dəbbə', note: 'Mülki Məcəllə termini' },
    { en: 'power of attorney', az: 'etibarnamə' },
    { en: 'principal', az: 'etibar edən' },
    { en: 'attorney-in-fact', az: 'nümayəndə (vəkil edilmiş şəxs)' },
    { en: 'notary', az: 'notarius' },
    { en: 'claimant / plaintiff', az: 'iddiaçı' },
    { en: 'defendant', az: 'cavabdeh' },
    { en: 'Court of Appeal', az: 'Apellyasiya məhkəməsi', note: 'iki «l» ilə' },
    { en: 'court of first instance', az: 'birinci instansiya məhkəməsi' },
    { en: 'court fee / state duty', az: 'dövlət rüsumu' },
    { en: 'annex', az: 'əlavə' }
  ],
  tasks: [
    { id: 'huquq-b1-1', level: 'B1', domain: 'Hüquqi sənədlər', reg: 'Hüquqi', client: 'Hüquq firması', title: 'Xidmət müqaviləsi: icra müddəti',
      xp: 20, minutes: 4,
      src: 'The Service Provider shall complete the work within 30 days from the date of signing of this Agreement. The Customer shall pay AZN 4,500 upon completion.',
      model: 'Xidmət göstərən işi bu Müqavilənin imzalandığı tarixdən etibarən 30 gün ərzində tamamlamalıdır. Sifarişçi iş tamamlandıqdan sonra 4 500 AZN ödəməlidir.',
      hints: ['«shall» öhdəlikdir: -malıdır / -məlidir.', '«Service Provider» Azərbaycan müqavilələrində «Xidmət göstərən» adlanır.', 'Minlik ayırıcı vergül yox, boşluqdur.'],
      draft: 'Xidmət Provayderi işi bu Müqavilənin imzalandığı tarixdən etibarən 30 gün içində tamamlayacaq. Sifarişçi iş tamamlandıqdan sonra 4500 AZN ödəməlidir.',
      tip: 'Müqavilədə «shall» gördünüzsə, feli gələcək zamanda deyil, vacib şəkildə yazın.',
      traps: [
        { w: ['Xidmət Provayderi'], now: 'Xidmət göstərən', type: 'Termin', why: 'Azərbaycan hüquq dilində müqavilə tərəfi «Xidmət göstərən» adlanır, «provayder» kalkadır.', ex: 'Xidmət göstərən və Sifarişçi' },
        { w: ['içində'], now: 'ərzində', type: 'Üslub', why: 'Müddət bildirəndə rəsmi mətndə «ərzində» işlənir.', ex: '10 iş günü ərzində' },
        { w: ['tamamlayacaq'], now: 'tamamlamalıdır', type: 'Məna', why: '«Shall» öhdəlik bildirir, sadəcə gələcəkdə baş verəcək hadisə deyil.', ex: 'Tərəf ödəməlidir' },
        { w: ['4500'], now: '4 500', type: 'Rəqəm', why: 'Azərbaycan dilində minliklər boşluqla ayrılır.', ex: '18 500 AZN' }
      ] },

    { id: 'huquq-b1-2', level: 'B1', domain: 'Hüquqi sənədlər', reg: 'Hüquqi', client: 'Notariat kontoru', title: 'Etibarnamə: vergi orqanlarında təmsil',
      xp: 20, minutes: 4,
      src: 'I, Rashad Mammadov, hereby authorise Leyla Aliyeva to represent me before the tax authorities and to sign documents on my behalf.',
      model: 'Mən, Rəşad Məmmədov, bununla Leyla Əliyevaya vergi orqanlarında məni təmsil etmək və mənim adımdan sənədləri imzalamaq səlahiyyəti verirəm.',
      hints: ['Azərbaycan adlarını ingilis transliterasiyasından bərpa edin.', '«Authorise» etibarnamədə «səlahiyyət vermək»dir.', '«Before the authorities» — «orqanlarında».'],
      draft: 'Mən, Rashad Mammadov, bununla Leyla Aliyevaya vergi orqanları önündə məni təmsil etmək və mənim adımdan sənədləri imzalamaq icazəsi verirəm.',
      tip: 'İngiliscə yazılmış Azərbaycan adı həmişə orijinal orfoqrafiyaya qaytarılır: Mammadov → Məmmədov.',
      traps: [
        { w: ['Rashad Mammadov'], now: 'Rəşad Məmmədov', type: 'Ad', why: 'Azərbaycan vətəndaşının adı Azərbaycan əlifbası ilə yazılmalıdır.', ex: 'Huseynov → Hüseynov' },
        { w: ['Aliyevaya'], now: 'Əliyevaya', type: 'Ad', why: 'İngilis «A» hərfi burada «Ə» səsini verir.', ex: 'Aliyeva → Əliyeva' },
        { w: ['orqanları önündə'], now: 'orqanlarında', type: 'Türk forması', why: '«Önündə» bu mənada türkcə kalkadır.', ex: 'məhkəmədə təmsil etmək' },
        { w: ['icazəsi verirəm'], now: 'səlahiyyəti verirəm', type: 'Termin', why: 'Etibarnamə icazə yox, təmsil səlahiyyəti verir.', ex: 'imzalamaq səlahiyyəti' }
      ] },

    { id: 'huquq-b2-1', level: 'B2', domain: 'Hüquqi sənədlər', reg: 'Hüquqi', client: 'Daşınmaz əmlak agentliyi', title: 'İcarə müqaviləsi: subicarə və dəbbə',
      xp: 30, minutes: 6,
      src: 'The Lessee may not sublet the Premises without the prior written consent of the Lessor. Monthly rent of AZN 1,200 shall be paid no later than the 5th day of each month. Late payment shall incur a penalty of 0.1% for each day of delay.',
      model: 'İcarəçi İcarəyə verənin əvvəlcədən yazılı razılığı olmadan İcarə obyektini subicarəyə verə bilməz. Aylıq 1 200 AZN məbləğində icarə haqqı hər ayın 5-dən gec olmayaraq ödənilməlidir. Ödənişin gecikdirildiyi hər gün üçün 0,1% dəbbə hesablanır.',
      hints: ['«May not» qadağadır.', '«Consent» — «razılıq».', 'Onluq kəsr vergüllə yazılır: 0,1%.'],
      draft: 'İcarəçi İcarəyə verənin əvvəlcədən yazılı onayı olmadan İcarə obyektini subicarəyə verə bilər. Aylıq 1,200 AZN məbləğində icarə haqqı hər ayın 5-dən gec olmayaraq ödənilməlidir. Ödənişin gecikdirildiyi hər gün üçün 0.1% dəbbə hesablanır.',
      tip: 'Hüquqi mətndə «not» sözünü itirmək bütün bəndin mənasını tərsinə çevirir — inkarı ayrıca yoxlayın.',
      traps: [
        { w: ['onayı'], now: 'razılığı', type: 'Türk forması', why: '«Onay» türkcədir, Azərbaycan dilində «razılıq» işlənir.', ex: 'yazılı razılıq' },
        { w: ['verə bilər'], now: 'verə bilməz', type: 'Məna', why: '«May not» qadağa bildirir, icazə yox.', ex: 'Tərəf ötürə bilməz' },
        { w: ['1,200'], now: '1 200', type: 'Rəqəm', why: 'Minlik ayırıcı vergül deyil, boşluqdur.', ex: '25 000 manat' },
        { w: ['0.1%'], now: '0,1%', type: 'Rəqəm', why: 'Azərbaycan dilində onluq kəsr vergüllə yazılır.', ex: '2,5%' }
      ] },

    { id: 'huquq-b2-2', level: 'B2', domain: 'Hüquqi sənədlər', reg: 'Hüquqi', client: 'İnsan resursları şöbəsi', title: 'Əmək müqaviləsi: sınaq müddəti',
      xp: 30, minutes: 6,
      src: 'The Employee shall be subject to a probation period of three months. During the probation period, either Party may terminate this Agreement by giving the other Party three days’ written notice. The Employee is entitled to 21 calendar days of paid annual leave.',
      model: 'İşçiyə üç ay sınaq müddəti müəyyən edilir. Sınaq müddəti ərzində Tərəflərdən hər biri digər Tərəfi üç gün əvvəl yazılı qaydada xəbərdar etməklə bu Müqaviləyə xitam verə bilər. İşçinin 21 təqvim günü müddətində ödənişli illik məzuniyyət hüququ vardır.',
      hints: ['«Either Party» — «Tərəflərdən hər biri».', '«Calendar days» və «working days» fərqlidir.', '«Annual leave» əmək hüququnda «məzuniyyət»dir.'],
      draft: 'İşçiyə üç ay deneme süresi müəyyən edilir. Sınaq müddəti ərzində hər iki Tərəf digər Tərəfi üç gün əvvəl yazılı qaydada xəbərdar etməklə bu Müqaviləyə xitam verə bilər. İşçinin 21 iş günü müddətində ödənişli illik tətil hüququ vardır.',
      tip: 'Əmək müqaviləsində hər rəqəmin vahidini (təqvim günü, iş günü, ay) ayrıca yoxlayın.',
      traps: [
        { w: ['deneme süresi'], now: 'sınaq müddəti', type: 'Türk forması', why: 'Azərbaycan Əmək Məcəlləsində termin «sınaq müddəti»dir.', ex: 'sınaq müddəti bitdikdən sonra' },
        { w: ['hər iki Tərəf'], now: 'Tərəflərdən hər biri', type: 'Məna', why: '«Either» birgə hərəkət yox, hər birinin ayrıca hüququ deməkdir.', ex: 'Tərəflərdən hər biri tələb edə bilər' },
        { w: ['21 iş günü'], now: '21 təqvim günü', type: 'Məna', why: '«Calendar days» iş günləri deyil, bütün günlərdir.', ex: '30 təqvim günü' },
        { w: ['illik tətil'], now: 'illik məzuniyyət', type: 'Termin', why: 'İşçinin hüququ «məzuniyyət» adlanır, «tətil» məktəb və ya bayram üçündür.', ex: 'əmək məzuniyyəti' }
      ] },

    { id: 'huquq-c1-1', level: 'C1', domain: 'Hüquqi sənədlər', reg: 'Hüquqi', client: 'Beynəlxalq hüquq firması', title: 'NDA: məxfilikdən istisnalar',
      xp: 40, minutes: 8,
      src: 'Notwithstanding the foregoing, the Receiving Party shall not be liable for disclosure of Confidential Information which (a) is or becomes publicly available through no fault of the Receiving Party, or (b) is required to be disclosed by law or by a court order, provided that the Receiving Party gives the Disclosing Party prompt written notice of such requirement.',
      model: 'Yuxarıda göstərilənlərə baxmayaraq, Qəbul edən Tərəf aşağıdakı Məxfi Məlumatın açıqlanmasına görə məsuliyyət daşımır: (a) Qəbul edən Tərəfin təqsiri olmadan ictimaiyyət üçün əlçatan olan və ya sonradan əlçatan olan məlumat; (b) qanuna və ya məhkəmə qərarına əsasən açıqlanması tələb olunan məlumat, bu şərtlə ki, Qəbul edən Tərəf belə tələb barədə Açıqlayan Tərəfi dərhal yazılı qaydada xəbərdar etsin.',
      hints: ['«Shall not be liable» — məsuliyyətdən azad edir.', '«Fault» hüquqi mətndə «təqsir»dir.', '«Provided that» — «bu şərtlə ki».'],
      draft: 'Yuxarıda göstərilənlərə rağmen, Alan Tərəf aşağıdakı Məxfi Məlumatın açıqlanmasına görə məsuliyyət daşımalıdır: (a) Alan Tərəfin günahı olmadan ictimaiyyət üçün əlçatan olan və ya sonradan əlçatan olan məlumat; (b) qanuna və ya məhkəmə qərarına əsasən açıqlanması tələb olunan məlumat, bu şərtlə ki, Alan Tərəf belə tələb barədə Açıqlayan Tərəfi dərhal yazılı qaydada xəbərdar etsin.',
      tip: '«Shall not» bəzən öhdəlik yox, azadolma bildirir — cümlənin kimə xeyir verdiyini soruşun.',
      traps: [
        { w: ['rağmen'], now: 'baxmayaraq', type: 'Türk forması', why: '«Rağmen» türkcədir; Azərbaycan dilində «baxmayaraq» işlənir.', ex: 'bu şərtlərə baxmayaraq' },
        { w: ['Alan Tərəf'], now: 'Qəbul edən Tərəf', type: 'Termin', why: 'NDA-da sabit termin «Qəbul edən Tərəf»dir və bütün mətndə eyni saxlanmalıdır.', ex: 'Qəbul edən Tərəf öhdəlik daşıyır' },
        { w: ['məsuliyyət daşımalıdır'], now: 'məsuliyyət daşımır', type: 'Məna', why: '«Shall not be liable» məsuliyyətin olmadığını bildirir; tərcümə mənanı tərsinə çevirib.', ex: 'Satıcı məsuliyyət daşımır' },
        { w: ['günahı'], now: 'təqsiri', type: 'Termin', why: 'Mülki hüquqda «fault» qarşılığı «təqsir»dir.', ex: 'təqsiri olmadan' }
      ] },

    { id: 'huquq-c1-2', level: 'C1', domain: 'Hüquqi sənədlər', reg: 'Hüquqi', client: 'Vəkil bürosu', title: 'Məhkəmə qərarı: apellyasiya',
      xp: 40, minutes: 8,
      src: 'The Court of Appeal, having examined the case file and heard the parties, found that the court of first instance had misapplied Article 449 of the Civil Code. The appeal is therefore partially upheld, and the defendant is ordered to pay the claimant AZN 37,850 in damages and AZN 1,135.50 in state duty.',
      model: 'Apellyasiya məhkəməsi işin materiallarını araşdıraraq və tərəfləri dinləyərək belə nəticəyə gəlmişdir ki, birinci instansiya məhkəməsi Mülki Məcəllənin 449-cu maddəsini düzgün tətbiq etməmişdir. Bu səbəbdən apellyasiya şikayəti qismən təmin edilir; cavabdehdən iddiaçının xeyrinə 37 850 AZN zərərin əvəzi və 1 135,50 AZN dövlət rüsumu tutulur.',
      hints: ['«Apellyasiya» iki «l» ilə yazılır.', 'Şəkilçi rəqəmin son səsinə uyğunlaşır: 449-cu.', 'Kimdən tutulur, kimin xeyrinə — diqqətlə.'],
      draft: 'Apelyasiya məhkəməsi işin materiallarını araşdıraraq və tərəfləri dinləyərək belə nəticəyə gəlmişdir ki, birinci instansiya məhkəməsi Mülki Məcəllənin 449-ci maddəsini düzgün tətbiq etməmişdir. Bu səbəbdən apelyasiya şikayəti qismən təmin edilir; iddiaçıdan cavabdehin xeyrinə 37,850 AZN zərərin əvəzi və 1 135,50 AZN dövlət rüsumu tutulur.',
      tip: 'Qətnamənin nəticə hissəsində pul kimdən tutulub kimə verilir — tərəfləri bir daha yoxlayın.',
      traps: [
        { w: ['Apelyasiya', 'apelyasiya'], now: 'Apellyasiya / apellyasiya', type: 'Orfoqrafiya', why: 'Söz orfoqrafiya lüğətində iki «l» ilə verilir.', ex: 'apellyasiya şikayəti' },
        { w: ['449-ci'], now: '449-cu', type: 'Orfoqrafiya', why: '449 «doqquz» ilə bitir, şəkilçi ahəngə görə «-cu» olur.', ex: '9-cu, 19-cu' },
        { w: ['iddiaçıdan cavabdehin xeyrinə'], now: 'cavabdehdən iddiaçının xeyrinə', type: 'Məna', why: '«The defendant is ordered to pay the claimant» — ödəyən cavabdehdir.', ex: 'cavabdehdən tutulsun' },
        { w: ['37,850'], now: '37 850', type: 'Rəqəm', why: 'Minliklər boşluqla ayrılır; vergül onluq kəsr üçündür.', ex: '37 850 AZN' }
      ] }
  ]
};

/* ───────────────────────── 2. RƏSMİ ŞƏXSİ SƏNƏDLƏR ───────────────────────── */
window.NUANZA_DOMAINS['senedler'] = {
  key: 'senedler', name: 'Rəsmi şəxsi sənədlər', icon: 'file',
  why: 'Xaricdə təhsil, iş və miqrasiya üçün hər il minlərlə şəhadətnamə, diplom və arayışın notarial tərcüməsi tələb olunur — burada bir hərf səhvi sənədin qəbul edilməməsi deməkdir.',
  glossary: [
    { en: 'birth certificate', az: 'doğum haqqında şəhadətnamə' },
    { en: 'marriage certificate', az: 'nikah haqqında şəhadətnamə' },
    { en: 'divorce certificate', az: 'nikahın pozulması haqqında şəhadətnamə' },
    { en: 'death certificate', az: 'ölüm haqqında şəhadətnamə' },
    { en: 'civil registry office', az: 'Qeydiyyat şöbəsi' },
    { en: 'record No.', az: 'akt qeydinin nömrəsi' },
    { en: 'surname', az: 'soyadı' },
    { en: 'given name', az: 'adı' },
    { en: 'patronymic', az: 'ata adı' },
    { en: 'maiden name', az: 'qızlıq soyadı' },
    { en: 'date of birth', az: 'doğum tarixi' },
    { en: 'place of birth', az: 'doğum yeri' },
    { en: 'citizenship', az: 'vətəndaşlıq' },
    { en: 'spouse', az: 'həyat yoldaşı' },
    { en: 'identity card', az: 'şəxsiyyət vəsiqəsi' },
    { en: 'date of issue', az: 'verilmə tarixi' },
    { en: 'issuing authority', az: 'sənədi verən orqan' },
    { en: 'valid until', az: '... tarixinədək etibarlıdır' },
    { en: 'diploma', az: 'diplom' },
    { en: 'transcript of records', az: 'qiymət cədvəli (diploma əlavəsi)' },
    { en: 'Bachelor’s degree', az: 'bakalavr dərəcəsi', note: '«of Arts / of Science» adətən tərcümə olunmur' },
    { en: 'Master’s degree', az: 'magistr dərəcəsi' },
    { en: 'with honours', az: 'fərqlənmə ilə' },
    { en: 'GPA', az: 'ümumi orta müvəffəqiyyət göstəricisi (ÜOMG)' },
    { en: 'credit', az: 'kredit' },
    { en: 'thesis (BA/MA)', az: 'buraxılış işi / magistr dissertasiyası', note: 'bakalavr işi «dissertasiya» deyil' },
    { en: 'supervisor', az: 'elmi rəhbər' },
    { en: 'reference letter', az: 'tövsiyə məktubu' },
    { en: 'certificate of employment', az: 'iş yerindən arayış' },
    { en: 'This is to certify that', az: 'Bununla təsdiq edilir ki' },
    { en: 'To whom it may concern', az: 'Aidiyyəti üzrə təqdim edilməsi üçün' },
    { en: 'certificate of no criminal record', az: 'məhkumluq haqqında arayış' },
    { en: 'apostille', az: 'apostil' },
    { en: 'Hague Convention', az: 'Haaqa Konvensiyası' },
    { en: 'public document', az: 'rəsmi sənəd', note: '«ictimai sənəd» deyil' },
    { en: 'Notary Public', az: 'notarius' },
    { en: 'seal / stamp', az: 'möhür / ştamp' },
    { en: 'certified translation', az: 'təsdiq edilmiş tərcümə' }
  ],
  tasks: [
    { id: 'senedler-b1-1', level: 'B1', domain: 'Rəsmi şəxsi sənədlər', reg: 'Rəsmi', client: 'Tərcümə bürosu', title: 'Doğum haqqında şəhadətnamə',
      xp: 20, minutes: 3,
      src: 'Birth Certificate. Surname: Hasanova. Given name: Aysel. Date of birth: 14 March 2019. Place of birth: Ganja, Azerbaijan. Father: Elvin Hasanov. Mother: Nigar Hasanova.',
      model: 'Doğum haqqında şəhadətnamə. Soyadı: Həsənova. Adı: Aysel. Doğum tarixi: 14 mart 2019-cu il. Doğum yeri: Gəncə, Azərbaycan. Atası: Elvin Həsənov. Anası: Nigar Həsənova.',
      hints: ['Sənədin adı Azərbaycan rəsmi adı ilə verilir.', 'Ay adı kiçik hərflə, ilə şəkilçi və «il» əlavə olunur.', 'Şəhər adları Azərbaycan yazılışı ilə.'],
      draft: 'Doğum Sertifikatı. Soyadı: Hasanova. Adı: Aysel. Doğum tarixi: 14 Mart 2019. Doğum yeri: Ganja, Azərbaycan. Atası: Elvin Həsənov. Anası: Nigar Həsənova.',
      tip: 'Şəxsi sənəddə bir ad iki cür yazıla bilməz — hər adı sənəd boyu eyni saxlayın.',
      traps: [
        { w: ['Doğum Sertifikatı'], now: 'Doğum haqqında şəhadətnamə', type: 'Termin', why: 'Azərbaycanda bu sənədin rəsmi adı «Doğum haqqında şəhadətnamə»dir.', ex: 'nikah haqqında şəhadətnamə' },
        { w: ['Hasanova'], now: 'Həsənova', type: 'Ad', why: 'Soyad Azərbaycan əlifbası ilə bərpa olunmalı və valideynlərin soyadı ilə eyni yazılmalıdır.', ex: 'Hasanov → Həsənov' },
        { w: ['14 Mart 2019'], now: '14 mart 2019-cu il', type: 'Tarix', why: 'Ay adı kiçik hərflə yazılır, ildən sonra şəkilçi və «il» gəlir.', ex: '1 may 2026-cı il' },
        { w: ['Ganja'], now: 'Gəncə', type: 'Ad', why: 'Azərbaycan şəhər adları ingilis transliterasiyası ilə saxlanmır.', ex: 'Sumgayit → Sumqayıt' }
      ] },

    { id: 'senedler-b1-2', level: 'B1', domain: 'Rəsmi şəxsi sənədlər', reg: 'Rəsmi', client: 'Vizaya müraciət edən şəxs', title: 'İş yerindən arayış',
      xp: 20, minutes: 4,
      src: 'This is to certify that Kamran Guliyev has worked at Company A LLC as an accountant since 1 September 2021. Issued for submission to the bank.',
      model: 'Bununla təsdiq edilir ki, Kamran Quliyev 1 sentyabr 2021-ci il tarixindən «Şirkət A» MMC-də mühasib vəzifəsində çalışır. Arayış banka təqdim edilmək üçün verilmişdir.',
      hints: ['«This is to certify» sabit formuldur.', '«Has worked ... since» hələ də davam edən işdir.', '«Guliyev» Azərbaycan dilində «Q» ilə yazılır.'],
      draft: 'Bu, təsdiq edir ki, Kamran Guliyev 1 sentyabr 2021-ci il tarixindən «Şirkət A» MMC-də mühasib vəzifəsində işləmişdir. Sertifikat banka təqdim edilmək üçün verilmişdir.',
      tip: 'Present Perfect + since = indiyədək davam edir; Azərbaycan dilində indiki zaman işlədin.',
      traps: [
        { w: ['Bu, təsdiq edir ki'], now: 'Bununla təsdiq edilir ki', type: 'Üslub', why: 'Rəsmi arayışlarda sabit formul «Bununla təsdiq edilir ki»dir.', ex: 'Bununla təsdiq edilir ki, ...' },
        { w: ['Guliyev'], now: 'Quliyev', type: 'Ad', why: 'İngilis «G» bu soyadda Azərbaycan «Q» hərfinə uyğundur.', ex: 'Guliyeva → Quliyeva' },
        { w: ['işləmişdir'], now: 'çalışır', type: 'Məna', why: '«Has worked since» işin davam etdiyini göstərir; keçmiş zaman işdən çıxdığını düşündürür.', ex: '2020-ci ildən burada yaşayır' },
        { w: ['Sertifikat'], now: 'Arayış', type: 'Termin', why: 'İş yerindən verilən sənəd Azərbaycanda «arayış» adlanır.', ex: 'əmək haqqı barədə arayış' }
      ] },

    { id: 'senedler-b2-1', level: 'B2', domain: 'Rəsmi şəxsi sənədlər', reg: 'Rəsmi', client: 'Təhsil agentliyi', title: 'Bakalavr diplomu',
      xp: 30, minutes: 5,
      src: 'This is to certify that Farid Ismayilov, having completed the programme of study in International Relations, was awarded the degree of Bachelor of Arts with Honours on 30 June 2025. Registration No. 0457. Rector: Prof. S. Karimova.',
      model: 'Bununla təsdiq edilir ki, Fərid İsmayılov Beynəlxalq münasibətlər ixtisası üzrə təhsil proqramını başa vuraraq 30 iyun 2025-ci il tarixində fərqlənmə ilə bakalavr dərəcəsinə layiq görülmüşdür. Qeydiyyat nömrəsi: 0457. Rektor: prof. S. Kərimova.',
      hints: ['«Bachelor of Arts» incəsənətlə bağlı deyil.', '«With Honours» — «fərqlənmə ilə».', 'Bütün adları Azərbaycan yazılışına qaytarın.'],
      draft: 'Bununla təsdiq edilir ki, Farid Ismayilov Beynəlxalq münasibətlər ixtisası üzrə təhsil proqramını başa vuraraq 30 iyun 2025-ci il tarixində şərəflə İncəsənət bakalavrı dərəcəsinə layiq görülmüşdür. Qeydiyyat nömrəsi: 0457. Rektor: prof. S. Karimova.',
      tip: '«Bachelor of Arts / Science» humanitar və ya təbiət elmləri profilini göstərir, «incəsənət» və «elm» kimi tərcümə edilmir.',
      traps: [
        { w: ['Farid Ismayilov'], now: 'Fərid İsmayılov', type: 'Ad', why: 'Ad və soyad Azərbaycan əlifbası ilə bərpa olunur: Ə, İ, ı.', ex: 'Ismayilova → İsmayılova' },
        { w: ['şərəflə'], now: 'fərqlənmə ilə', type: 'Termin', why: 'Azərbaycan diplomlarında «with honours» qarşılığı «fərqlənmə ilə»dir.', ex: 'fərqlənmə diplomu' },
        { w: ['İncəsənət bakalavrı dərəcəsinə'], now: 'bakalavr dərəcəsinə', type: 'Məna', why: '«Arts» burada humanitar profil deməkdir, incəsənət yox.', ex: 'Master of Arts → magistr dərəcəsi' },
        { w: ['Karimova'], now: 'Kərimova', type: 'Ad', why: 'İngilis «a» bu soyadda «ə» səsini verir.', ex: 'Karimov → Kərimov' }
      ] },

    { id: 'senedler-b2-2', level: 'B2', domain: 'Rəsmi şəxsi sənədlər', reg: 'Rəsmi', client: 'Miqrasiya hüquqşünası', title: 'Nikah haqqında şəhadətnamə',
      xp: 30, minutes: 5,
      src: 'Marriage Certificate. Orkhan Nabiyev and Sabina Huseynova entered into marriage on 12.08.2023, and marriage record No. 215 was made. Surnames after marriage: husband – Nabiyev; wife – Nabiyeva. Issued by the Sumgayit City Civil Registry Office.',
      model: 'Nikah haqqında şəhadətnamə. Orxan Nəbiyev və Səbinə Hüseynova 12 avqust 2023-cü il tarixində nikaha daxil olmuşlar və bu barədə 215 nömrəli akt qeydi aparılmışdır. Nikahdan sonra soyadları: ərin – Nəbiyev; arvadın – Nəbiyeva. Sumqayıt şəhər Qeydiyyat şöbəsi tərəfindən verilmişdir.',
      hints: ['12.08.2023 formatı gün.ay.il deməkdir.', 'Sənədin adını Azərbaycan rəsmi formasında verin.', 'Hər soyadın bütün yazılışlarını eyniləşdirin.'],
      draft: 'Evlilik sertifikatı. Orxan Nəbiyev və Səbinə Hüseynova 8 dekabr 2023-cü il tarixində nikaha daxil olmuşlar və bu barədə 215 nömrəli akt qeydi aparılmışdır. Nikahdan sonra soyadları: ərin – Nəbiyev; arvadın – Nabiyeva. Sumqayıt şəhər Qeydiyyat şöbəsi tərəfindən verilmişdir.',
      tip: 'Rəqəmli tarixdə ay ilə günü qarışdırmamaq üçün sənədin hansı ölkədə verildiyinə baxın.',
      traps: [
        { w: ['Evlilik sertifikatı'], now: 'Nikah haqqında şəhadətnamə', type: 'Türk forması', why: '«Evlilik» türkcə formadır; rəsmi sənədin adı «Nikah haqqında şəhadətnamə»dir.', ex: 'nikaha daxil olmaq' },
        { w: ['8 dekabr'], now: '12 avqust', type: 'Tarix', why: '12.08.2023 Azərbaycan formatında gün.ay.il-dir — 12 avqust.', ex: '05.03.2024 → 5 mart 2024-cü il' },
        { w: ['Nabiyeva'], now: 'Nəbiyeva', type: 'Ad', why: 'Arvadın soyadı ərin soyadı ilə eyni orfoqrafiyada yazılmalıdır.', ex: 'Nəbiyev → Nəbiyeva' }
      ] },

    { id: 'senedler-c1-1', level: 'C1', domain: 'Rəsmi şəxsi sənədlər', reg: 'Rəsmi', client: 'Universitet müəllimi', title: 'Magistraturaya tövsiyə məktubu',
      xp: 40, minutes: 7,
      src: 'I have known Ms Gunel Rahimova for three years as her thesis supervisor. She has consistently demonstrated exceptional analytical skills and intellectual curiosity, and her final thesis was graded “excellent”. I have no hesitation in recommending her for the Master’s programme in Public Policy, and I am confident that she will be an asset to any academic community.',
      model: 'Günel Rəhimovanı üç ildir buraxılış işinin elmi rəhbəri kimi tanıyıram. O, daim müstəsna analitik bacarıqlar və elmi maraq nümayiş etdirmiş, buraxılış işi isə «əla» qiymətləndirilmişdir. Onu Dövlət siyasəti üzrə magistratura proqramına heç bir tərəddüd etmədən tövsiyə edirəm və əminəm ki, o, istənilən akademik mühit üçün dəyərli qazanc olacaqdır.',
      hints: ['Bakalavr səviyyəsində «thesis» — «buraxılış işi».', '«Asset» insan haqqında maliyyə termini deyil.', 'Ms + ad Azərbaycan dilində adətən buraxılır.'],
      draft: 'Günel Rahimovanı üç ildir dissertasiyasının elmi rəhbəri kimi tanıyıram. O, daim müstəsna analitik bacarıqlar və elmi maraq nümayiş etdirmiş, buraxılış işi isə «əla» qiymətləndirilmişdir. Onu Dövlət siyasəti üzrə magistratura proqramına heç bir tərəddüd etmədən tövsiyə edirəm və əminəm ki, o, istənilən akademik mühit üçün bir aktiv olacaqdır.',
      tip: 'Tövsiyə məktubunda ingilis idiomlarını hərfi yox, Azərbaycan akademik üslubunda verin.',
      traps: [
        { w: ['Rahimovanı'], now: 'Rəhimovanı', type: 'Ad', why: 'Soyad Azərbaycan orfoqrafiyası ilə yazılmalıdır.', ex: 'Rahimov → Rəhimov' },
        { w: ['dissertasiyasının'], now: 'buraxılış işinin', type: 'Termin', why: '«Dissertasiya» elmi dərəcə üçündür; bakalavr işi «buraxılış işi» adlanır.', ex: 'buraxılış işinin müdafiəsi' },
        { w: ['bir aktiv olacaqdır'], now: 'dəyərli qazanc olacaqdır', type: 'Məna', why: 'Burada «asset» məcazi mənada «dəyərli insan» deməkdir, mühasibat termini yox.', ex: 'komandamız üçün dəyərli qazancdır' }
      ] },

    { id: 'senedler-c1-2', level: 'C1', domain: 'Rəsmi şəxsi sənədlər', reg: 'Rəsmi', client: 'Notariat kontoru', title: 'Apostil möhürü',
      xp: 40, minutes: 8,
      src: 'APOSTILLE (Hague Convention of 5 October 1961). 1. Country: United Kingdom of Great Britain and Northern Ireland. This public document 2. has been signed by Daniel Brooks 3. acting in the capacity of Notary Public 4. bears the seal/stamp of the said Notary Public. Certified 5. at London 6. the 03/02/2026 7. by the Foreign Office 8. Number: APO-118293 9. Seal/stamp 10. Signature.',
      model: 'APOSTİL (5 oktyabr 1961-ci il tarixli Haaqa Konvensiyası). 1. Ölkə: Böyük Britaniya və Şimali İrlandiya Birləşmiş Krallığı. Bu rəsmi sənəd 2. Daniel Brooks tərəfindən imzalanmışdır, 3. o, notarius qismində çıxış edir, 4. sənəd həmin notariusun möhürü/ştampı ilə təsdiq edilmişdir. Təsdiq edilmişdir: 5. London şəhərində 6. 3 fevral 2026-cı il tarixində 7. Xarici İşlər Nazirliyi tərəfindən 8. Nömrə: APO-118293 9. Möhür/ştamp 10. İmza.',
      hints: ['«Public document» Haaqa Konvensiyasında «rəsmi sənəd»dir.', 'Britaniya tarixi gün/ay/il formatındadır.', 'Ölkənin tam rəsmi adını saxlayın.'],
      draft: 'APOSTİL (5 oktyabr 1961-ci il tarixli Haaqa Konvensiyası). 1. Ölkə: İngiltərə. Bu ictimai sənəd 2. Daniel Brooks tərəfindən imzalanmışdır, 3. o, ictimai notarius qismində çıxış edir, 4. sənəd həmin notariusun möhürü/ştampı ilə təsdiq edilmişdir. Təsdiq edilmişdir: 5. London şəhərində 6. 2 mart 2026-cı il tarixində 7. Xarici İşlər Nazirliyi tərəfindən 8. Nömrə: APO-118293 9. Möhür/ştamp 10. İmza.',
      tip: 'Apostil standart 10 bəndlik formadır — bəndlərin nömrələrini və ardıcıllığını dəyişməyin.',
      traps: [
        { w: ['İngiltərə'], now: 'Böyük Britaniya və Şimali İrlandiya Birləşmiş Krallığı', type: 'Ad', why: 'İngiltərə Birləşmiş Krallığın yalnız bir hissəsidir; rəsmi sənəddə tam ad verilir.', ex: 'Amerika Birləşmiş Ştatları' },
        { w: ['ictimai sənəd'], now: 'rəsmi sənəd', type: 'Məna', why: '«Public document» dövlət orqanı və ya notariusun verdiyi rəsmi sənəddir, «ictimai» yox.', ex: 'rəsmi sənədlərin leqallaşdırılması' },
        { w: ['ictimai notarius'], now: 'notarius', type: 'Termin', why: '«Notary Public» sadəcə «notarius» kimi tərcümə edilir.', ex: 'notarius tərəfindən təsdiq edilmişdir' },
        { w: ['2 mart'], now: '3 fevral', type: 'Tarix', why: 'Britaniyada 03/02/2026 gün/ay/il formatındadır — 3 fevral.', ex: '11/04 → 11 aprel' }
      ] }
  ]
};

/* ───────────────────────── 3. MALİYYƏ VƏ BİZNES ───────────────────────── */
window.NUANZA_DOMAINS['maliyye'] = {
  key: 'maliyye', name: 'Maliyyə və biznes', icon: 'chart',
  why: 'MHBS-ə keçid, xarici bankların və auditorların bazarda olması səbəbindən illik hesabatların, bank məktublarının və işgüzar yazışmaların peşəkar tərcüməsinə tələbat daim artır.',
  glossary: [
    { en: 'revenue', az: 'gəlir (hasilat)' },
    { en: 'net profit', az: 'xalis mənfəət', note: '«xalis gəlir» deyil' },
    { en: 'gross profit', az: 'ümumi mənfəət' },
    { en: 'operating costs', az: 'əməliyyat xərcləri' },
    { en: 'statement of financial position', az: 'maliyyə vəziyyəti haqqında hesabat' },
    { en: 'statement of profit or loss', az: 'mənfəət və ya zərər haqqında hesabat' },
    { en: 'cash flow statement', az: 'pul vəsaitlərinin hərəkəti haqqında hesabat' },
    { en: 'IFRS', az: 'MHBS (Maliyyə Hesabatlarının Beynəlxalq Standartları)', note: 'türkcə «UFRS» deyil' },
    { en: 'assets', az: 'aktivlər' },
    { en: 'current assets', az: 'dövriyyə aktivləri' },
    { en: 'non-current assets', az: 'uzunmüddətli aktivlər' },
    { en: 'liabilities', az: 'öhdəliklər' },
    { en: 'equity', az: 'kapital' },
    { en: 'trade receivables', az: 'ticarət debitor borcları', note: '«alacaqlar» türkcədir' },
    { en: 'trade payables', az: 'ticarət kreditor borcları' },
    { en: 'fair value', az: 'ədalətli dəyər' },
    { en: 'amortised cost', az: 'amortizasiya olunmuş dəyər' },
    { en: 'expected credit losses', az: 'gözlənilən kredit zərərləri' },
    { en: 'allowance / provision', az: 'ehtiyat' },
    { en: 'depreciation', az: 'amortizasiya (köhnəlmə)' },
    { en: 'impairment', az: 'dəyərsizləşmə' },
    { en: 'going concern', az: 'fəaliyyətin fasiləsizliyi' },
    { en: 'material', az: 'əhəmiyyətli', note: '«maddi» deyil' },
    { en: 'material uncertainty', az: 'əhəmiyyətli qeyri-müəyyənlik' },
    { en: 'auditor’s opinion', az: 'auditor rəyi' },
    { en: 'Board of Directors', az: 'Direktorlar Şurası', note: '«İdarə Heyəti» = Management Board' },
    { en: 'shareholder', az: 'səhmdar' },
    { en: 'dividend per share', az: 'hər səhm üzrə dividend' },
    { en: 'account balance', az: 'hesabın qalığı' },
    { en: 'current account', az: 'cari hesab' },
    { en: 'account statement', az: 'hesabdan çıxarış' },
    { en: 'letter of credit', az: 'akkreditiv' },
    { en: 'bank guarantee', az: 'bank zəmanəti' },
    { en: 'invoice', az: 'hesab-faktura' },
    { en: 'VAT', az: 'ƏDV (əlavə dəyər vergisi)' },
    { en: 'outstanding', az: 'ödənilməmiş' },
    { en: 'Please find attached', az: '... əlavə olunur', note: 'hərfi tərcümə etməyin' },
    { en: 'thousand / million', az: 'min / milyon' }
  ],
  tasks: [
    { id: 'maliyye-b1-1', level: 'B1', domain: 'Maliyyə və biznes', reg: 'Rəsmi', client: 'Bank', title: 'Bank məktubu: hesabın qalığı',
      xp: 20, minutes: 3,
      src: 'Dear Customer, please be informed that the balance of your current account No. 3801 as of 30 September 2026 is AZN 12,450.75. If you have any questions, please call our contact centre.',
      model: 'Hörmətli müştəri, Sizə məlumat veririk ki, 30 sentyabr 2026-cı il tarixinə 3801 nömrəli cari hesabınızın qalığı 12 450,75 AZN təşkil edir. Suallarınız olarsa, əlaqə mərkəzimizə zəng edin.',
      hints: ['«Balance» bank hesabında «qalıq»dır.', 'Minlik boşluqla, kəsr vergüllə.', '«Question» — «sual».'],
      draft: 'Hörmətli müştəri, Sizə məlumat veririk ki, 30 sentyabr 2026-cı il tarixinə 3801 nömrəli cari hesabınızın balansı 12,450.75 AZN təşkil edir. Sorularınız olarsa, əlaqə mərkəzimizə zəng edin.',
      tip: 'İngilis məbləğində vergül və nöqtənin yerini dəyişin: 12,450.75 → 12 450,75.',
      traps: [
        { w: ['balansı'], now: 'qalığı', type: 'Termin', why: 'Bank sənədlərində hesabdakı məbləğ «hesabın qalığı» adlanır.', ex: 'gün sonuna qalıq' },
        { w: ['12,450.75'], now: '12 450,75', type: 'Rəqəm', why: 'Azərbaycan dilində minlik boşluqla, onluq kəsr vergüllə ayrılır.', ex: '1 250,40 AZN' },
        { w: ['Sorularınız'], now: 'Suallarınız', type: 'Türk forması', why: '«Soru» türkcədir; Azərbaycan dilində «sual».', ex: 'sualınız varsa' }
      ] },

    { id: 'maliyye-b1-2', level: 'B1', domain: 'Maliyyə və biznes', reg: 'Rəsmi', client: 'İstehsal şirkəti', title: 'İşgüzar e-məktub: qiymət siyahısı',
      xp: 20, minutes: 3,
      src: 'Dear Mr Aliyev, thank you for your inquiry. Please find attached our price list. We look forward to your reply. Kind regards, Sales Department.',
      model: 'Hörmətli cənab Əliyev, sorğunuz üçün təşəkkür edirik. Qiymət siyahımız əlavə olunur. Cavabınızı gözləyirik. Hörmətlə, Satış şöbəsi.',
      hints: ['«Please find attached» Azərbaycan dilində qısa formul ilə verilir.', '«Department» şirkətdə «şöbə»dir.'],
      draft: 'Hörmətli cənab Aliyev, sorğunuz üçün təşəkkür edirik. Xahiş edirik əlavədə qiymət siyahımızı tapın. Cavabınızı gözləyirik. Hörmətlə, Satış departamenti.',
      tip: 'İşgüzar məktub formullarını hərfi yox, Azərbaycan dilindəki hazır qarşılığı ilə verin.',
      traps: [
        { w: ['Aliyev'], now: 'Əliyev', type: 'Ad', why: 'Azərbaycan soyadı orijinal orfoqrafiya ilə yazılır.', ex: 'Aliyeva → Əliyeva' },
        { w: ['Xahiş edirik əlavədə qiymət siyahımızı tapın'], now: 'Qiymət siyahımız əlavə olunur', type: 'Üslub', why: '«Please find attached» ingilis formuludur; hərfi tərcümə qəribə səslənir.', ex: 'Müqavilənin layihəsi əlavə olunur.' },
        { w: ['Satış departamenti'], now: 'Satış şöbəsi', type: 'Termin', why: 'Şirkət strukturunda «department» adətən «şöbə» kimi verilir.', ex: 'Maliyyə şöbəsi' }
      ] },

    { id: 'maliyye-b2-1', level: 'B2', domain: 'Maliyyə və biznes', reg: 'Rəsmi', client: 'Holdinq şirkəti', title: 'İllik hesabat: rəhbərin müraciəti',
      xp: 30, minutes: 6,
      src: 'In 2025, the Group’s revenue grew by 14% to AZN 286.4 million, while net profit reached AZN 31.2 million. Despite higher operating costs, we maintained an EBITDA margin of 22%. The Board of Directors has recommended a dividend of AZN 0.45 per share.',
      model: '2025-ci ildə Qrupun gəliri 14% artaraq 286,4 milyon AZN-ə çatmış, xalis mənfəət isə 31,2 milyon AZN təşkil etmişdir. Əməliyyat xərclərinin artmasına baxmayaraq, EBITDA marjasını 22% səviyyəsində saxlamışıq. Direktorlar Şurası hər səhm üzrə 0,45 AZN məbləğində dividend ödənilməsini tövsiyə etmişdir.',
      hints: ['«Revenue» və «net profit» fərqli göstəricilərdir.', 'Onluq kəsrdə vergül işlədin.', '«Board of Directors» ≠ «Management Board».'],
      draft: '2025-ci ildə Qrupun gəliri 14% artaraq 286.4 milyon AZN-ə çatmış, xalis gəlir isə 31,2 milyon AZN təşkil etmişdir. Əməliyyat xərclərinin artmasına baxmayaraq, EBITDA marjasını 22% səviyyəsində saxlamışıq. İdarə Heyəti hər səhm üzrə 0,45 AZN məbləğində dividend ödənilməsini tövsiyə etmişdir.',
      tip: 'Maliyyə mətnində bir göstəricinin adını dəyişmək rəqəmi səhv yazmaq qədər təhlükəlidir.',
      traps: [
        { w: ['286.4'], now: '286,4', type: 'Rəqəm', why: 'Onluq kəsr Azərbaycan dilində vergüllə yazılır.', ex: '31,2 milyon' },
        { w: ['xalis gəlir'], now: 'xalis mənfəət', type: 'Termin', why: '«Net profit» mənfəətdir; «gəlir» revenue üçün işlənir.', ex: 'xalis mənfəət marjası' },
        { w: ['İdarə Heyəti'], now: 'Direktorlar Şurası', type: 'Termin', why: '«Board of Directors» nəzarət orqanıdır; «İdarə Heyəti» icra orqanıdır (Management Board).', ex: 'Direktorlar Şurasının sədri' }
      ] },

    { id: 'maliyye-b2-2', level: 'B2', domain: 'Maliyyə və biznes', reg: 'Rəsmi', client: 'Audit şirkəti', title: 'MHBS qeydi: debitor borcları',
      xp: 30, minutes: 6,
      src: 'Trade receivables are recognised initially at fair value and subsequently measured at amortised cost less any allowance for expected credit losses. As at 31 December 2025, the allowance amounted to AZN 1,870 thousand (2024: AZN 1,420 thousand).',
      model: 'Ticarət debitor borcları ilkin olaraq ədalətli dəyərlə tanınır və sonradan gözlənilən kredit zərərləri üzrə ehtiyat çıxılmaqla amortizasiya olunmuş dəyərlə ölçülür. 31 dekabr 2025-ci il tarixinə ehtiyatın məbləği 1 870 min AZN təşkil etmişdir (2024: 1 420 min AZN).',
      hints: ['MHBS-in rəsmi Azərbaycan terminlərindən istifadə edin.', '«Thousand» vahidini itirməyin.', '«Fair value» — sabit termin.'],
      draft: 'Ticarət alacaqları ilkin olaraq real dəyərlə tanınır və sonradan gözlənilən kredit zərərləri üzrə ehtiyat çıxılmaqla amortizasiya olunmuş dəyərlə ölçülür. 31 dekabr 2025-ci il tarixinə ehtiyatın məbləği 1 870 AZN təşkil etmişdir (2024: 1 420 min AZN).',
      tip: 'Cədvəl başlığında «AZN ’000» gördünüzsə, hər rəqəmin yanında «min» olduğunu unutmayın.',
      traps: [
        { w: ['Ticarət alacaqları'], now: 'Ticarət debitor borcları', type: 'Türk forması', why: '«Alacaqlar» türk mühasibat terminidir; Azərbaycan MHBS tərcümələrində «debitor borcları» işlənir.', ex: 'kreditor borcları' },
        { w: ['real dəyərlə'], now: 'ədalətli dəyərlə', type: 'Termin', why: '«Fair value» MHBS-də sabit «ədalətli dəyər» terminidir.', ex: 'ədalətli dəyərin qiymətləndirilməsi' },
        { w: ['1 870 AZN'], now: '1 870 min AZN', type: 'Rəqəm', why: '«Thousand» buraxılıb — məbləğ min dəfə azalıb.', ex: '1 420 min AZN' }
      ] },

    { id: 'maliyye-c1-1', level: 'C1', domain: 'Maliyyə və biznes', reg: 'Rəsmi', client: 'Audit şirkəti', title: 'Auditor rəyi və diqqət paraqrafı',
      xp: 40, minutes: 8,
      src: 'In our opinion, the accompanying consolidated financial statements present fairly, in all material respects, the consolidated financial position of the Group as at 31 December 2025, and its consolidated financial performance and cash flows for the year then ended, in accordance with IFRS. Without qualifying our opinion, we draw attention to Note 2, which describes a material uncertainty related to going concern.',
      model: 'Bizim fikrimizcə, əlavə edilmiş konsolidə edilmiş maliyyə hesabatları bütün əhəmiyyətli aspektlərdə Qrupun 31 dekabr 2025-ci il tarixinə konsolidə edilmiş maliyyə vəziyyətini, habelə həmin tarixdə başa çatan il üzrə konsolidə edilmiş maliyyə nəticələrini və pul vəsaitlərinin hərəkətini MHBS-ə uyğun olaraq ədalətli əks etdirir. Rəyimizi şərtləndirmədən, 2 saylı Qeydə diqqət yetirməyinizi xahiş edirik; həmin Qeyddə fəaliyyətin fasiləsizliyi ilə bağlı əhəmiyyətli qeyri-müəyyənlik təsvir olunur.',
      hints: ['«Material» auditdə «əhəmiyyətli» deməkdir.', 'IFRS-in Azərbaycan qısaltması MHBS-dir.', '«Going concern» — sabit termin.'],
      draft: 'Bizim fikrimizcə, əlavə edilmiş konsolidə edilmiş maliyyə hesabatları bütün maddi aspektlərdə Qrupun 31 dekabr 2025-ci il tarixinə konsolidə edilmiş maliyyə vəziyyətini, habelə həmin tarixdə başa çatan il üzrə konsolidə edilmiş maliyyə nəticələrini və pul vəsaitlərinin hərəkətini UFRS-ə uyğun olaraq ədalətli əks etdirir. Rəyimizi şərtləndirmədən, 2 saylı Qeydə diqqət yetirməyinizi xahiş edirik; həmin Qeyddə işin davamlılığı ilə bağlı əhəmiyyətli qeyri-müəyyənlik təsvir olunur.',
      tip: 'Auditor rəyi standart formuldur — sözləri sərbəst seçməyin, qəbul olunmuş terminologiyaya sadiq qalın.',
      traps: [
        { w: ['maddi aspektlərdə'], now: 'əhəmiyyətli aspektlərdə', type: 'Məna', why: '«Material» burada «maddi» yox, «əhəmiyyətli» deməkdir — yalançı dost.', ex: 'əhəmiyyətli təhrif' },
        { w: ['UFRS'], now: 'MHBS', type: 'Türk forması', why: '«UFRS» Türkiyədə işlənir; Azərbaycanda qəbul olunmuş qısaltma MHBS-dir.', ex: 'MHBS 9' },
        { w: ['işin davamlılığı'], now: 'fəaliyyətin fasiləsizliyi', type: 'Termin', why: '«Going concern» auditdə «fəaliyyətin fasiləsizliyi» prinsipidir.', ex: 'fəaliyyətin fasiləsizliyi fərziyyəsi' }
      ] },

    { id: 'maliyye-c1-2', level: 'C1', domain: 'Maliyyə və biznes', reg: 'Rəsmi', client: 'Topdan satış şirkəti', title: 'Borc barədə xəbərdarlıq məktubu',
      xp: 40, minutes: 7,
      src: 'We regret to inform you that, although payment was due within 30 days, invoice No. 2026/118 dated 15 July 2026 for AZN 48,600 (VAT inclusive) remains outstanding to date. Unless the full amount is received by 20 October 2026, we will be compelled to suspend further deliveries and to seek recovery of the debt through the courts.',
      model: 'Təəssüflə bildiririk ki, ödəniş 30 gün ərzində həyata keçirilməli olsa da, 15 iyul 2026-cı il tarixli 2026/118 nömrəli 48 600 AZN (ƏDV daxil olmaqla) məbləğində hesab-faktura bu günədək ödənilməmişdir. Tam məbləğ 20 oktyabr 2026-cı il tarixinədək daxil olmazsa, növbəti tədarükləri dayandırmağa və borcun məhkəmə qaydasında tutulması üçün tədbir görməyə məcbur olacağıq.',
      hints: ['«Unless» = «əgər ... -mazsa».', '«VAT inclusive» — ƏDV daxildir.', '«Invoice» rəsmi yazışmada «hesab-faktura»dır.'],
      draft: 'Təəssüflə bildiririk ki, ödəniş 30 gün ərzində həyata keçirilməli olsa da, 15 iyul 2026-cı il tarixli 2026/118 nömrəli 48 600 AZN (ƏDV xaric) məbləğində faktura bu günədək ödənilməmişdir. Tam məbləğ 20 oktyabr 2026-cı il tarixinədək daxil olarsa, növbəti tədarükləri dayandırmağa və borcun məhkəmə qaydasında tutulması üçün tədbir görməyə məcbur olacağıq.',
      tip: '«Unless» cümləsini tərcümə edəndə inkarı itirməyin — əks halda təhdid məntiqsiz olur.',
      traps: [
        { w: ['ƏDV xaric'], now: 'ƏDV daxil olmaqla', type: 'Məna', why: '«VAT inclusive» məbləğə ƏDV-nin daxil olduğunu bildirir.', ex: '1 180 AZN (ƏDV daxil olmaqla)' },
        { w: ['məbləğində faktura'], now: 'məbləğində hesab-faktura', type: 'Termin', why: 'Azərbaycanın vergi və işgüzar praktikasında sənədin adı «hesab-faktura»dır.', ex: 'elektron qaimə-faktura' },
        { w: ['daxil olarsa'], now: 'daxil olmazsa', type: 'Məna', why: '«Unless» inkar şərt bildirir: ödəniş gəlməsə, tədarük dayandırılır.', ex: 'cavab verməzsə' }
      ] }
  ]
};

/* ───────────────────────── 4. NEFT-QAZ VƏ TEXNİKİ ───────────────────────── */
window.NUANZA_DOMAINS['neftqaz'] = {
  key: 'neftqaz', name: 'Neft-qaz və texniki', icon: 'flame',
  why: 'Azərbaycan iqtisadiyyatının əsasını təşkil edən neft-qaz sektorunda SƏTƏM qaydaları, təlimatlar, spesifikasiyalar və tender sənədləri gündəlik ingilis dilindən tərcümə olunur, səhv isə insan həyatına təhlükə yarada bilər.',
  glossary: [
    { en: 'HSE', az: 'SƏTƏM (sağlamlıq, əməyin təhlükəsizliyi və ətraf mühit)' },
    { en: 'PPE', az: 'fərdi mühafizə vasitələri (FMV)' },
    { en: 'hard hat', az: 'qoruyucu dəbilqə' },
    { en: 'safety glasses', az: 'qoruyucu eynək' },
    { en: 'safety boots', az: 'mühafizə ayaqqabısı' },
    { en: 'permit to work', az: 'iş icazəsi' },
    { en: 'hot work', az: 'odla bağlı işlər', note: '«isti iş» deyil' },
    { en: 'hazardous area', az: 'təhlükəli zona' },
    { en: 'hazard', az: 'təhlükə' },
    { en: 'risk assessment', az: 'riskin qiymətləndirilməsi' },
    { en: 'near miss', az: 'baş verməsinə az qalmış hadisə' },
    { en: 'confined space', az: 'qapalı məkan' },
    { en: 'lockout / tagout', az: 'bloklama və etiketləmə' },
    { en: 'gas testing', az: 'qaz analizi' },
    { en: 'LEL (lower explosive limit)', az: 'alışmanın aşağı konsentrasiya həddi (LEL)' },
    { en: 'fire watch', az: 'yanğın növbətçisi' },
    { en: 'gas release', az: 'qaz sızması' },
    { en: 'Emergency Shutdown (ESD)', az: 'Qəza dayanması (ESD)' },
    { en: 'muster point', az: 'toplanma məntəqəsi' },
    { en: 'upwind', az: 'küləyə qarşı istiqamətdə', note: '«küləklə birgə» deyil' },
    { en: 'Offshore Installation Manager', az: 'Dəniz qurğusunun rəisi' },
    { en: 'valve', az: 'klapan (siyirtmə)' },
    { en: 'pressure gauge', az: 'manometr' },
    { en: 'torque', az: 'fırladıcı moment' },
    { en: 'bolt / gasket', az: 'bolt / araqat' },
    { en: 'pipeline', az: 'boru kəməri' },
    { en: 'seamless pipe', az: 'tikişsiz boru' },
    { en: 'wall thickness', az: 'divar qalınlığı' },
    { en: 'tolerance', az: 'yol verilən kənarlaşma' },
    { en: 'weld', az: 'qaynaq tikişi' },
    { en: 'radiographic inspection', az: 'radioqrafik nəzarət' },
    { en: 'coating', az: 'örtük' },
    { en: 'shall / should (spec)', az: 'olmalıdır / tövsiyə olunur', note: 'spesifikasiyada fərq məcburidir' },
    { en: 'wellhead', az: 'quyuağzı avadanlıq' },
    { en: 'drilling rig', az: 'qazma qurğusu' },
    { en: 'tender / bidder', az: 'tender / tender iştirakçısı' },
    { en: 'bid bond', az: 'tender təminatı' },
    { en: 'scope of work', az: 'işin həcmi' },
    { en: 'subcontractor', az: 'subpodratçı' }
  ],
  tasks: [
    { id: 'neftqaz-b1-1', level: 'B1', domain: 'Neft-qaz və texniki', reg: 'Rəsmi', client: 'Neft-qaz podratçısı', title: 'SƏTƏM qaydası: fərdi mühafizə',
      xp: 20, minutes: 3,
      src: 'All personnel must wear a hard hat, safety glasses and safety boots on site at all times. Smoking is permitted only in designated areas.',
      model: 'Bütün işçi heyəti obyektdə hər zaman qoruyucu dəbilqə, qoruyucu eynək və mühafizə ayaqqabısı geyinməlidir. Siqaret çəkməyə yalnız xüsusi ayrılmış yerlərdə icazə verilir.',
      hints: ['«Must» — tələb, -malıdır / -məlidir.', '«Hard hat» papaq deyil.', '«Personnel» — «işçi heyəti».'],
      draft: 'Bütün personal obyektdə hər zaman sərt şlyapa, qoruyucu eynək və mühafizə ayaqqabısı geyinə bilər. Siqaret çəkməyə yalnız xüsusi ayrılmış yerlərdə icazə verilir.',
      tip: 'Təhlükəsizlik qaydasında «must» heç vaxt «bilər» ilə verilmir.',
      traps: [
        { w: ['Bütün personal'], now: 'Bütün işçi heyəti', type: 'Üslub', why: '«Personal» Azərbaycan dilində sifətdir («şəxsi»); kollektiv üçün «işçi heyəti» işlənir.', ex: 'texniki heyət' },
        { w: ['sərt şlyapa'], now: 'qoruyucu dəbilqə', type: 'Termin', why: '«Hard hat» FMV terminidir — qoruyucu dəbilqə.', ex: 'dəbilqəsiz sahəyə giriş qadağandır' },
        { w: ['geyinə bilər'], now: 'geyinməlidir', type: 'Məna', why: '«Must» məcburiyyət bildirir, seçim yox.', ex: 'eynək taxmalıdır' }
      ] },

    { id: 'neftqaz-b1-2', level: 'B1', domain: 'Neft-qaz və texniki', reg: 'Neytral', client: 'Avadanlıq istehsalçısı', title: 'Texniki xidmət təlimatı',
      xp: 20, minutes: 3,
      src: 'Close valve V-12 before removing the pressure gauge. Check that the pressure is 0 bar. Tighten the bolts to 45 N·m.',
      model: 'Manometri çıxarmazdan əvvəl V-12 klapanını bağlayın. Təzyiqin 0 bar olduğunu yoxlayın. Boltları 45 N·m momentlə bərkidin.',
      hints: ['«Close» və «open» ilə ehtiyatlı olun.', '«Pressure gauge» — manometr.', 'Vahid yazılışını orijinaldakı kimi saxlayın.'],
      draft: 'Təzyiq ölçəni çıxarmazdan əvvəl V-12 klapanını açın. Təzyiqin 0 bar olduğunu yoxlayın. Boltları 45 Nm momentlə bərkidin.',
      tip: 'Təlimatda hər feli (aç/bağla, sıx/burax) orijinalla ayrıca tutuşdurun.',
      traps: [
        { w: ['Təzyiq ölçəni'], now: 'Manometri', type: 'Termin', why: 'Cihazın texniki adı «manometr»dir.', ex: 'manometrin göstəricisi' },
        { w: ['klapanını açın'], now: 'klapanını bağlayın', type: 'Məna', why: '«Close» bağlamaq deməkdir; səhv əməliyyat təzyiqli mühiti açar.', ex: 'siyirtməni bağlayın' },
        { w: ['45 Nm'], now: '45 N·m', type: 'Rəqəm', why: 'Fırladıcı momentin vahidi orijinaldakı kimi N·m yazılır.', ex: '120 N·m' }
      ] },

    { id: 'neftqaz-b2-1', level: 'B2', domain: 'Neft-qaz və texniki', reg: 'Rəsmi', client: 'Dəniz platforması operatoru', title: 'İş icazəsi: odla bağlı işlər',
      xp: 30, minutes: 6,
      src: 'Hot work in hazardous areas may only be carried out under a valid permit to work issued by the Area Authority. Before work starts, gas testing shall be performed, and the LEL reading must not exceed 10%. A fire watch shall remain at the site for at least 30 minutes after the work is completed.',
      model: 'Təhlükəli zonalarda odla bağlı işlər yalnız Sahə üzrə məsul şəxs tərəfindən verilmiş etibarlı iş icazəsi əsasında aparıla bilər. İşə başlamazdan əvvəl qaz analizi aparılmalı və alışmanın aşağı konsentrasiya həddi (LEL) göstəricisi 10%-i keçməməlidir. İş başa çatdıqdan sonra yanğın növbətçisi ən azı 30 dəqiqə ərazidə qalmalıdır.',
      hints: ['«Hot work» qaynaq, kəsmə kimi odla bağlı işlərdir.', 'Qısaltmanı ilk dəfə açıqlayın.', 'Vaxt vahidlərini yoxlayın.'],
      draft: 'Təhlükəli zonalarda isti işlər yalnız Sahə üzrə məsul şəxs tərəfindən verilmiş etibarlı iş icazəsi əsasında aparıla bilər. İşə başlamazdan əvvəl qaz analizi aparılmalı və LEL göstəricisi 10%-i keçməməlidir. İş başa çatdıqdan sonra yanğın növbətçisi ən azı 30 saniyə ərazidə qalmalıdır.',
      tip: 'Mətndə ilk dəfə çıxan qısaltmanı Azərbaycan dilində açın, qısaltmanı mötərizədə saxlayın.',
      traps: [
        { w: ['isti işlər'], now: 'odla bağlı işlər', type: 'Termin', why: '«Hot work» qaynaq, kəsmə, cilalama kimi alov və qığılcım yaradan işlərdir.', ex: 'odla bağlı işlərə icazə' },
        { w: ['və LEL göstəricisi'], now: 'və alışmanın aşağı konsentrasiya həddi (LEL) göstəricisi', type: 'Termin', why: 'Qısaltma ilk dəfə işlənəndə açılmalıdır, əks halda oxucu anlamaya bilər.', ex: 'Qəza dayanması (ESD)' },
        { w: ['30 saniyə'], now: '30 dəqiqə', type: 'Rəqəm', why: '«Minutes» dəqiqədir; vaxtın səhv verilməsi yanğın riskini artırır.', ex: '60 dəqiqə nəzarət' }
      ] },

    { id: 'neftqaz-b2-2', level: 'B2', domain: 'Neft-qaz və texniki', reg: 'Rəsmi', client: 'Boru kəməri layihəsi', title: 'Texniki spesifikasiya: borular',
      xp: 30, minutes: 6,
      src: 'Pipes shall be seamless carbon steel to API 5L Grade X52. Wall thickness tolerance shall be ±12.5%. All welds shall be 100% radiographically inspected. Coating thickness should be at least 300 µm.',
      model: 'Borular API 5L standartının X52 markasına uyğun tikişsiz karbonlu poladdan olmalıdır. Divar qalınlığı üzrə yol verilən kənarlaşma ±12,5% olmalıdır. Bütün qaynaq tikişləri 100% radioqrafik nəzarətdən keçirilməlidir. Örtüyün qalınlığının ən azı 300 mkm olması tövsiyə olunur.',
      hints: ['Spesifikasiyada «shall» tələbdir, «should» tövsiyə.', '«Seamless» — «tikişsiz».', '«Tolerance» — «yol verilən kənarlaşma».'],
      draft: 'Borular API 5L standartının X52 markasına uyğun qaynaqsız karbonlu poladdan olmalıdır. Divar qalınlığı üzrə tolerans ±12.5% olmalıdır. Bütün qaynaq tikişləri 100% radioqrafik nəzarətdən keçirilməlidir. Örtüyün qalınlığı ən azı 300 mkm olmalıdır.',
      tip: 'Spesifikasiyada «shall» və «should» müqavilə öhdəliyini müəyyən edir — onları eyniləşdirməyin.',
      traps: [
        { w: ['qaynaqsız'], now: 'tikişsiz', type: 'Termin', why: '«Seamless pipe» texniki dildə «tikişsiz boru»dur.', ex: 'tikişsiz polad boru' },
        { w: ['tolerans'], now: 'yol verilən kənarlaşma', type: 'Termin', why: 'Ölçü «tolerance»-ı Azərbaycan texniki normalarında «yol verilən kənarlaşma» adlanır.', ex: 'diametr üzrə yol verilən kənarlaşma' },
        { w: ['±12.5%'], now: '±12,5%', type: 'Rəqəm', why: 'Onluq kəsr vergüllə yazılır.', ex: '±0,5 mm' },
        { w: ['300 mkm olmalıdır'], now: '300 mkm olması tövsiyə olunur', type: 'Məna', why: '«Should» tövsiyədir, «shall» kimi məcburi tələb yox.', ex: 'yoxlanılması tövsiyə olunur' }
      ] },

    { id: 'neftqaz-c1-1', level: 'C1', domain: 'Neft-qaz və texniki', reg: 'Hüquqi', client: 'Neft şirkətinin satınalma şöbəsi', title: 'Tender sənədi: təklifin təqdimi',
      xp: 40, minutes: 8,
      src: 'Bidders shall submit a bid bond in the amount of 2% of the bid price, valid for 120 days from the bid submission deadline. Bids received after 17:00 (Baku time) on 14 November 2026 shall be rejected and returned unopened. The Company reserves the right to accept or reject any bid without incurring any liability to the affected Bidders.',
      model: 'Tender iştirakçıları təklif qiymətinin 2%-i məbləğində, təkliflərin təqdim edilməsi üçün son müddətdən etibarən 120 gün ərzində qüvvədə olan tender təminatı təqdim etməlidirlər. 14 noyabr 2026-cı il tarixində saat 17:00-dan (Bakı vaxtı ilə) sonra daxil olan təkliflər rədd edilir və açılmadan geri qaytarılır. Şirkət müvafiq tender iştirakçıları qarşısında heç bir məsuliyyət daşımadan istənilən təklifi qəbul etmək və ya rədd etmək hüququnu özündə saxlayır.',
      hints: ['«Bid bond» maliyyə təminatıdır.', 'Vaxt 24 saatlıq formatda saxlanır.', '«Reserves the right» — sabit hüquqi formul.'],
      draft: 'Tender iştirakçıları təklif qiymətinin 2%-i məbləğində, təkliflərin təqdim edilməsi üçün son müddətdən etibarən 120 gün ərzində qüvvədə olan təklif istiqrazı təqdim etməlidirlər. 14 noyabr 2026-cı il tarixində saat 5:00-dan (Bakı vaxtı ilə) sonra daxil olan təkliflər rədd edilir və açılmadan geri qaytarılır. Şirkət müvafiq tender iştirakçıları qarşısında heç bir məsuliyyət daşımadan istənilən təklifi qəbul etmək və ya rədd etmək hüququnu rezerv edir.',
      tip: 'Tender sənədində son müddət, saat və vaxt qurşağı ən çox mübahisə yaradan yerlərdir.',
      traps: [
        { w: ['təklif istiqrazı'], now: 'tender təminatı', type: 'Termin', why: '«Bid bond» istiqraz (qiymətli kağız) deyil, bank zəmanəti şəklində təminatdır.', ex: 'icra təminatı (performance bond)' },
        { w: ['saat 5:00-dan'], now: 'saat 17:00-dan', type: 'Rəqəm', why: '17:00 axşam saat beşdir; 24 saatlıq format dəyişdirilmir.', ex: 'saat 18:30-dək' },
        { w: ['hüququnu rezerv edir'], now: 'hüququnu özündə saxlayır', type: 'Üslub', why: '«Reserves the right» Azərbaycan hüquq dilində «hüququnu özündə saxlayır» formulu ilə verilir.', ex: 'Sifarişçi hüququnu özündə saxlayır' }
      ] },

    { id: 'neftqaz-c1-2', level: 'C1', domain: 'Neft-qaz və texniki', reg: 'Rəsmi', client: 'Dəniz platforması operatoru', title: 'Qəza proseduru: qaz sızması',
      xp: 40, minutes: 8,
      src: 'In the event of a gas release, the person discovering it shall raise the alarm immediately and, if safe to do so, initiate an Emergency Shutdown (ESD). All non-essential personnel shall proceed upwind to the designated muster point. Under no circumstances should anyone attempt to re-enter the affected area until the Offshore Installation Manager has declared it safe.',
      model: 'Qaz sızması baş verdikdə, onu aşkar edən şəxs dərhal həyəcan siqnalı verməli və təhlükəsiz olarsa, Qəza dayanmasını (ESD) işə salmalıdır. Bilavasitə işə cəlb olunmayan bütün heyət küləyə qarşı istiqamətdə, müəyyən edilmiş toplanma məntəqəsinə getməlidir. Dəniz qurğusunun rəisi ərazinin təhlükəsiz olduğunu elan edənədək heç kim heç bir halda hadisə baş vermiş əraziyə yenidən daxil olmağa cəhd etməməlidir.',
      hints: ['«Upwind» — küləyin gəldiyi tərəfə.', '«Muster point» sabit SƏTƏM terminidir.', 'Vəzifə adlarını kalka etməyin.'],
      draft: 'Qaz sızması baş verdikdə, onu aşkar edən şəxs dərhal həyəcan siqnalı verməli və təhlükəsiz olarsa, Qəza söndürülməsini (ESD) işə salmalıdır. Bilavasitə işə cəlb olunmayan bütün heyət küləyin istiqamətində, müəyyən edilmiş toplanma nöqtəsinə getməlidir. Ofşor Qurğu Meneceri ərazinin təhlükəsiz olduğunu elan edənədək heç kim heç bir halda hadisə baş vermiş əraziyə yenidən daxil olmağa cəhd etməməlidir.',
      tip: 'Qəza prosedurunda istiqamət və hərəkət bildirən hər söz həyati əhəmiyyət daşıyır — ikinci dəfə oxuyun.',
      traps: [
        { w: ['Qəza söndürülməsini'], now: 'Qəza dayanmasını', type: 'Termin', why: 'ESD sistemi qurğunu dayandırır; «söndürmə» yanğınla bağlı fərqli anlayışdır.', ex: 'ESD sistemi işə düşdü' },
        { w: ['küləyin istiqamətində'], now: 'küləyə qarşı istiqamətdə', type: 'Məna', why: '«Upwind» küləyin əsdiyi tərəfə doğru deməkdir; qaz küləklə daşındığı üçün səhv istiqamət ölümcül ola bilər.', ex: 'küləyə qarşı tərəfə çəkilin' },
        { w: ['toplanma nöqtəsinə'], now: 'toplanma məntəqəsinə', type: 'Termin', why: 'SƏTƏM sənədlərində sabit termin «toplanma məntəqəsi»dir.', ex: 'toplanma məntəqəsində yoxlama' },
        { w: ['Ofşor Qurğu Meneceri'], now: 'Dəniz qurğusunun rəisi', type: 'Üslub', why: 'Vəzifə adı kalka edilməməli, Azərbaycan dilində təbii qarşılıqla verilməlidir.', ex: 'qazma qurğusunun rəisi' }
      ] }
  ]
};
