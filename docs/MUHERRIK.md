# Nuanza mühərriki: real situasiyalarda düzgün tərcümə

## 1. Qısa cavab

Nuanza sözlərə toxunmazdan əvvəl situasiyanı müəyyən edir: bu hansı sənəddir (Sovet doğum şəhadətnaməsi, etibarnamə zənciri, müqavilə, epikriz, UI faylı və s.), kim üçündür və nə dərəcədə hərfi olmalıdır. Sonra həmin sənəd növünün «playbook»unu yükləyir. Yalnız müştərinin bildiyi faktları soruşur: pasportdakı ad yazılışı, qiymətləndirici, «shall» siyasəti, məktubun mövqeyi. Dəqiq olmalı olan hər şeyi kod və yoxlanılmış məlumat bazaları həll edir və kilidləyir: adlar, rəqəmlər, tarixlər, seriya və kodlar, rəsmi adlar, qiymət şkalası, sözlə yazılan tarix və məbləğ. Gemini yalnız bu kilidlərin arasındakı dili yazır. Hər seqment tərcümədən sonra deterministik yoxlamadan keçir (rəqəmin dəyəri, ad kilidi, inkar, modallıq, səlahiyyət sayı, türk sızması, cədvəl və vaxt kodu pariteti). Səhv tapılan seqmentlər yalnız hədəfli şəkildə düzəldilir, tərcüməçi isə əvvəlcə qırmızı seqmentlərə baxır, onun cavabları bütün sənədə yayılır. Hər prompt, playbook və model dəyişikliyi real situasiyalardan (S01–S14) qurulmuş test dəstindən keçmədən işə düşmür. Notarial məsuliyyət imzalayan tərcüməçidə qalır.

### 1.1 Beş dizayndan nə götürdük, nəyi düzəltdik

| Hissə | Mənbə |
|---|---|
| Əsas axın: təsnifat → playbook → kilid → tərcümə → 100% yoxlama → yalnız səhvlərin düzəlişi | situation-first |
| azLint (türk sızması, AZ lüğəti), OCR-un 1-ci fazada olması, gəlirə görə qurma sırası, monolinqval AZ korrektor | translator-team |
| Şəxs adları maskalanmış şablon TM, mənbələrin üstünlük sırası, sahəyə bağlı məna (iddiaçı), paket üzrə vahidlik | memory-retrieval |
| ≤5 sual qaydası, klaviatura ilə baxış, diff qoruyucu, vaxt sayğacı, /api-nin qorunması | human-in-loop |
| Tələ cütləri, reqressiya qapısı, modelin sabitlənməsi, kalibrlənmiş LLM hakim | eval-driven |

**Hakimlərin göstərdiyi zəif yerlər belə düzəldildi:**
- Ailə soyadı yoxlaması yalnız ata ilə uşaq arasında aparılır. Ana öz soyadını saxlaya bilər, onun soyadı zorla dəyişdirilmir.
- Adlar «hal markerli token» kimi göndərilmir. Ad kilidlənir, şəkilçini model artırır, yoxlama şəkilçiyə dözümlü uyğunluqla aparılır.
- Hüquqi abbreviaturalar düzəldildi: ƏM = Əmək Məcəlləsi (Labour Code), İXM = İnzibati Xətalar Məcəlləsi. «İM = Labour Code» səhvi silindi.
- Köhnə 5 ballıq şkala (attestat, islahatdan əvvəlki diplomlar) ayrıca dəstəklənir.
- Boşanma işlərində UK və Kanada üçün Applicant/Respondent tərəf cütü əlavə edildi.
- «shall mean», «shall be deemed» və «hereinafter» üçün ağ siyahı var, ona görə təriflər bəndində «-malıdır» səhv tətbiq olunmur.
- Apostrof avtodüzəlişi iki halı ayırır: rəqəmdən sonra defis qoyulur (10:00-dan), xüsusi addan sonra heç nə qoyulmur (Bakıya).
- Məktublarda hədəf mətnin mövqeyi ayrıca yoxlanır.
- OCR həmişə iki dəfə oxuyur.
- Yaşıl seqmentlərin toplu təsdiqi yalnız kalibrləmədən sonra mümkündür. Notarial sənəddə ad, rəqəm və tarix heç vaxt toplu təsdiqlənmir.
- Düzəlişin «qaydaya istinad» sahəsi saxta ola bilməz: istinad olunan tapıntı həqiqətən mövcud olmalı və düzəlişdən sonra yox olmalıdır.
- Ölçmə yüngül başlayır (tələ cütləri). MQM kalibrləməsi sonraya qalır ki, qurucunun vaxtı müştəri problemlərinə getsin.

---

## 2. Mühərrikin addımları

Sürət: `fast` = minimal düşünmə, `normal` = aşağı düşünmə, `deep` = tam düşünmə. «flash» və «flash-lite» sabitlənmiş model versiyalarıdır, `-latest` yalnız nəzarət testində istifadə olunur.

**1. Qəbul və müştəri profili.** *Deterministik, model yoxdur.*
- Layihə müştəri adı altında (və ya «gəlmə müştəri») D1-də yaradılır.
- Profil yüklənir: təsdiqlənmiş ad yazılışları, kilidli terminlər, siyasətlər (shall, rəqəm və tarix formatı, sən/siz, UK/US, qiymətləndirici), sertifikat blokları.
- Birləşmə sırası: qlobal defolt < playbook < müştəri profili < bu işin cavabları.
- Vaxt sayğacı işə düşür.

**2. İdxal və struktur.** *Deterministik. OCR üçün: flash · normal (əlyazmalı tibbi səhifədə deep), ikinci oxu flash-lite · fast.*
- DOCX birbaşa XML-dən (JSZip) oxunur. Cədvəllər saxlanır, `numbering.xml`-dən «4.2» kimi nömrələr kilidli etiket olur, iki sütunlu bilingual cədvəl tanınır.
- PDF-də sətir, sütun və cədvəl pdf.js koordinatları ilə bərpa olunur, təkrarlanan başlıq və altlıqlar çıxarılır.
- SRT/VTT, JSON/ICU, XLIFF, .strings, Android XML, XLSX/CSV, TMX/TBX üçün ayrıca parserlər var.
- Səhifədə 30 simvoldan az mətn varsa və ya giriş fotodursa, OCR işə düşür. Prompt: «dəqiq köçür, tərcümə etmə, düzəltmə, Kiril Kiril qalsın, şübhəli simvolu ⟦?⟧ ilə işarələ».
- İkinci oxu yalnız adları, rəqəmləri, tarixləri və seriyanı oxuyur. Fərqli çıxan hər sahə qırmızı olur və şəklin həmin hissəsi yanında göstərilir.
- Nəticə tipli bloklardır: başlıq, sahə {etiket, dəyər}, abzas, cədvəl sətri, subtitr bloku, UI sətri, möhür, imza, əlyazma.

**3. Sənəd növünün təyini.** *İz qaydaları deterministikdir, sonra flash-lite · fast (sənəd başına bir çağırış).*
- İzlər: СВИДЕТЕЛЬСТВО О РОЖДЕНИИ, ДОВЕРЕННОСТЬ, APOSTILLE, QƏTNAMƏ, QƏTƏ ALDI, EPİKRİZ, BAKALAVR DİPLOMU, Satınalan təşkilat, Mədaxil/Məxaric/Qalıq, vaxt kodu, `{placeholder}`, WARNING/CAUTION, türk şəkilçiləri. Bunlara struktur statistikası da əlavə olunur: cədvəl payı, bənd sıxlığı, Kiril payı.
- Model bütün sənəddən nümunə görür: ilk ~1500 söz, bütün başlıqlar, orta və son hissələr.
- Nəticə Situasiya Obyektidir: sənəd növü, alt növ, zəncir hissələri, ölkə və dövr (soviet_azssr / rsfsr / rf / az_current), məqsəd, qəbul edən orqan, rejim, dil qarışığı, şəxslər (rol və cins dəlili ilə).
- Model növü yalnız qapalı siyahıdan seçir. Təyinat ölkəsini təxmin etmir, «çatışmır» siyahısına yazır.
- Etibar 0.85-dən aşağıdırsa, tərcüməçi bir toxunuşla təsdiqləyir.

**4. Situasiya kartı və sual vərəqi.** *Deterministik, cavabı insan verir.*
- Playbook-un sualları təklif olunan cavablarla göstərilir. Təkliflər ad bərpasından, pasport romanizasiyasından və profildən gəlir.
- Bloklayan suallar ixracı bloklayır. Tərcümə təklif olunan defoltlarla başlaya bilər, amma həmin seqmentlər təsdiqə qədər qırmızı qalır. Telegramda suallar inline düymələrlə verilir (ətraflı bölmə 5-də).

**5. Playbook-un yığılması.** *Deterministik.*
- Qatlar bu ardıcıllıqla birləşir: cüt qaydaları (RULES, ORTHO) → domen paketləri → sənəd növü playbook-u → müştəri profili → bu işin qərarları.
- Uyğun olmayan qaydalar söndürülür. Məsələn, AZ→EN «shall» qaydası məktubda işləmir, artikl və zaman qaydaları bank çıxarışında və UI-də işləmir.
- Hər qaydanın ID-si var (CIV-07, CON-12), ona görə yoxlama və düzəliş konkret qaydaya istinad edə bilir.

**6. Seqmentləşdirmə və token qorunması.** *Deterministik.*
- RU/AZ/EN/TR abbreviatura siyahıları işlənir: г., гор., р-н, р-на, пр., д., кв., М.П., mm c.s., mq, MPM-in. İnisiallar (L.M., A.R.-in) və «№ ...» qorunur.
- Mötərizə, dırnaq və (a)–(iv) siyahısı içində bölünmə olmur. Birlikdə saxlanan hissələr: məhkəmə preambulası, etibarnamədə səlahiyyətlər, ünvan.
- Vahid struktura görə seçilir: sahə, cədvəl sətri, subtitr bloku, UI açarı.
- Qoruyucu işarələr (⟦T1⟧) bunlara qoyulur: seriya (II-ЖГ Kiril qalır), reyestr, iş və istinad nömrələri, ICD, ixtisas və prosedur kodları, IBAN, kart maskası, placeholder, ICU, teq, URL.
- Vaxt kodları, JSON açarları və cədvəlin rəqəm xanaları ümumiyyətlə LLM-ə getmir.
- Rəqəm və tarixlər dəyər kimi oxunur, hədəf formatı əvvəlcədən hesablanır (RƏQƏM/TARİX XƏRİTƏSİ): 25,000.00 → 25 000,00; 2,5 → 2.5. Sözlə tarix kodla yaradılır.

**7. Bütün sənəd üzrə Kilid Vərəqi (şəxslər, terminlər, qurumlar).** *Deterministik + flash-lite · fast. Tanınmayanlar üçün flash · normal.*
- Namizədlər: tərif nümunələri ((the "X"), hereinafter, bundan sonra "...", далее — «...»), böyük hərfli birləşmələr, abbreviaturalar, təkrarlanan ifadələr, akt sitatları, ata adı nümunələri (-ович, кызы, oğlu, qızı).
- Həll sırası: bu işin qərarları > müştəri TBX/TM > təsdiqlənmiş düzəlişlər > yoxlanılmış paketlər (ad lüğəti, toponim bazası, rəsmi adlar, frazbuk, tibbi, MHBS, satınalma, HSE) > sənəddən çıxarılan > model.
- Ziddiyyət gizli həll olunmur, tərcüməçiyə göstərilir.
- Məna sahəyə bağlıdır: iddiaçı satınalmada bidder, məhkəmədə plaintiff/claimant.
- Model ad, qurum və əmin olmadığı abbreviatura barədə təxmin etmir, «SORUŞ» qaytarır.
- 2600 söz və 25 termin limiti yoxdur.

**8. Yaddaşdan kontekst paketi.** *Deterministik (Worker + D1).*
- TM axtarışı: dəqiq, kontekst (eyni qonşular), şəxs və rəqəmləri maskalanmış şablon, qeyri-səlis (≥75%). Açar: müştəri + cüt + sənəd növü + dövr/təyinat. Dövr açarın içindədir ki, cari AZ şəhadətnaməsinin şablonu Sovet şəhadətnaməsinə tətbiq olunmasın.
- 2–4 nümunə seçilir: əvvəlcə eyni sənəd növündən və eyni müştəridən olan düzəlişlər («AI yazdı X → tərcüməçi yazdı Y»), sonra playbook-un qızıl nümunələri.
- Təsdiqlənmiş 100% şablon uyğunluğu avtomatik doldurulur, amma yenə yoxlamadan keçir.
- Test dəstindəki mətnlər nümunə kimi istifadə edilmir.

**9. Məhdud tərcümə.** *flash · normal (sənədlər). flash · fast (UI, subtitr, cədvəl sətirləri, bot məktubları, sürətli rejim).*
- Hissələr struktura görə qurulur: bütöv forma bir çağırışda (≤1500 söz), hüquqi bənd qrupları, başlıqla birlikdə 30–40 cədvəl sətri, cümlə ilə bitən subtitr qrupu, 60–100 UI açarı. Eyni mətn bir dəfə tərcümə olunur. 3–4 çağırış paralel gedir.
- Prompt quruluşu:
  - Sabit prefiks `system` sahəsində gedir ki, keşlənsin: rol, rejim mətni, ≤15 nömrəli qayda, sənədin kilidli lüğəti.
  - Sonra yalnız bu hissəyə aid olanlar gəlir: adlar, rəqəm və tarix xəritəsi, frazbuk, işarələmə qaydaları, kontekst (əvvəlki 2–4 seqment tərcüməsi ilə, sonrakı 2–3 mənbə seqmenti).
- Rejimlər: `literal_form`, `legal_strict`, `faithful`, `adaptive`, `transcreate`, `subtitle`, `ui`. «Mənanı tərcümə et, sözləri yox» qaydası yalnız `adaptive` və `transcreate` rejimində qalır.
- Çıxış JSON-dur (responseSchema): `{i, t, conf: h|m|l, flags[], q?}` və `new_terms[]`. Model təxmin etmək əvəzinə sual verir.
- Temperatur sabitlənmiş modelin rəsmi tövsiyəsi ilə başlayır: Gemini 3 nəslində Google defolt 1.0-ı saxlamağı tövsiyə edir. Dəyişiklik yalnız test dəstində ölçüldükdən sonra edilir.
- Ciddi rejimlərdə flash-lite-a səssiz keçid yoxdur: ya təkrar cəhd, ya qırmızı seqment.

**10. Deterministik yoxlama və təhlükəsiz avtodüzəliş.** *Deterministik, 10 min sözə 1 saniyədən az.*
- Yoxlamalar: token pariteti; rəqəmin dəyər pariteti; tarix (sözlə yazılan daxil); ad kilidi (istənilən əlifbada, şəkilçiyə dözümlü, variant detektoru ilə); kilidli terminlər və qadağan variantlar; frazbuk must-map; işarələr və məcburi bloklar; inkar; modallıq (ağ siyahı ilə); sadalama sayı; şərt markerləri; lateralliq; türk sızması; «ə» sıxlığı; AZ mətnində Kiril; cədvəl pariteti; qalıq arifmetikası; IBAN; placeholder/ICU; dəyişənə bitişik şəkilçi; UI uzunluğu; sən/siz; SMS hissələri; CPL/CPS. Uzunluq nisbəti yalnız 6 sözdən uzun nəsr seqmentlərində yoxlanır.
- Paket vahidliyi: eyni termin, eyni ad və eyni xəbərdarlıq bütün sənəddə və paketdə eyni olmalıdır.
- Avtodüzəlişlər jurnala yazılır: qoruyucu işarənin bərpası, dəyəri eyni olan rəqəmin formatı, rəqəmdən sonra apostrof → defis, xüsusi addan sonra apostrofun silinməsi, TR ay adı → kiçik hərfli AZ ay adı, %30 → 30%, siqnal sözlərin normallaşması, Kiril oxşar hərf → Latın, subtitr sətir bölgüsü.
- Qalan hər şey tapıntıdır: `{ruleId, ağırlıq: blokator|major|minor}`.

**11. Hədəfli düzəliş.** *flash · normal. Notarial, tibbi və hüquqi blokatorlar üçün flash · deep.*
- Kimə tətbiq olunur: tapıntısı olan, `conf=l` olan və risk nümunəsinə düşən seqmentlər (əməliyyat bəndləri, səlahiyyətlər, ixtisas tələbləri, dozalar, xəbərdarlıqlar).
- Prompt: «Yalnız sadalanan problemləri düzəlt, başqa sözə toxunma.»
- Ən çox 2 dövr edilir, sonra seqment qırmızı olur («insan lazımdır»).
- Hər dəyişiklik yenidən yoxlanır. Kilidi, rəqəmi, inkarı və ya tokeni pozan dəyişiklik avtomatik rədd edilir.
- Stil redaktoru `literal_form` və `legal_strict` rejimlərində yoxdur. `adaptive` və `transcreate` rejimində mövqe və şərtlər kilidli qalır, redaktor isə yalnız test dəsti faydasını göstərərsə işləyir.
- TR→AZ və EN→AZ `adaptive`/`transcreate` üçün monolinqval AZ korrektor (flash · fast) var: mənbəni görmür, yalnız orfoqrafiyanı, türk formalarını və ahəngi düzəldir. Mənaya toxunan düzəliş geri alınır.

**12. Buraxılma, inkar, rol və mövqe auditi.** *flash-lite · fast. Notarial, tibbi və əməliyyat bəndləri üçün flash · normal, ayrıca «opponent yoxlayıcı» promptu ilə.*
- Mənbə məzmun vahidlərinə bölünür: hərəkət və ya səlahiyyət, şərt, inkar, istisna, kəmiyyət, şəxs, siyahı elementi, «kim kimə nə etdi». Hər vahid hədəfdə sitatla tapılmalıdır.
- Tapılmayan, artıq və ya qütbü dəyişmiş vahid tapıntı olur və addım 11-ə bir dəfə qayıdır.
- Məktublarda mənbə və hədəf mətnə ayrıca mövqe etiketi verilir.
- Əhatə: `literal_form`, hüquqi əməliyyat bəndləri, diaqnoz və dozalar 100%; qalan sənədlərdə yalnız riskli seqmentlər.
- Bu, geri-tərcümənin yerinə işləyir: eyni model ailəsi geri-tərcümədə öz səhvini çox vaxt «düzəldir».

**13. Risk rəngi və növbə.** *Deterministik.*
- 🔴 Qırmızı:
  - blokator;
  - tanınmayan abbreviatura;
  - təsdiqlənməmiş ad və ya fakt;
  - OCR fərqi və ya ⟦?⟧;
  - rəqəm və ya tarix uyğunsuzluğu;
  - notarial formada hər ad, rəqəm və tarix seqmenti (tərcüməçi işarələyənə qədər).
- 🟡 Sarı: düzəliş edilib, təklif olunan termin işlədilib, `conf=l`, flash-lite istifadə olunub, uzunluq kənarda qalır.
- 🟢 Yaşıl: təsdiqlənmiş TM; tapıntı yoxdur və `conf=h`.
- Başlanğıcda rənglər qaydalarla verilir, ~300 redaktədən sonra real redaktələrə görə kalibrlənir.

**14. Tərcüməçinin baxışı, qərarlar, yayılma.** *İnsan. «Kilidi tətbiq et» üçün flash-lite · fast, yenidən tərcümə üçün flash · normal.* Ətraflı bölmə 5-dədir.

**15. Risk əsaslı dərin QA (fonda).** *flash · normal; tibbi və hüquqi blokatorlar üçün deep.*
- Əhatə: bütün qırmızı və sarı seqmentlər, playbook-un risk bölmələri və yaşılların təsadüfi 10%-i. 5000 söz limiti yoxdur.
- Playbook-un yoxlama siyahısı ilə işləyir. `literal_form` və `legal_strict` rejimlərində üslub iradı qadağandır.
- Hər «yeni variant» təklifi göstərilməzdən əvvəl yenidən yoxlamadan keçir.

**16. Yığım, buraxılış qapısı, ixrac.** *Deterministik.*
- Formatlar:
  - şəhadətnamə üçün güzgü-forma (tərcüməçi sətri və notarius bloku ilə);
  - bənd-bənd düzülmüş iki sütunlu müqavilə;
  - cədvəli saxlanmış transkript, çıxarış, BOQ;
  - orijinal DOCX-ə geri yazma;
  - SRT/VTT, JSON/XLIFF/.strings/Android XML, TMX/TBX.
- Qapı: həll olunmamış blokator yoxdur, OCR sahələri təsdiqlənib, bloklayan suallar cavablanıb, token, rəqəm və sadalama pariteti 100%-dir. Bunu keçmək yalnız yazılı səbəblə mümkündür və səbəb jurnala yazılır.
- Tərcüməçi qeydləri (qiymət şkalası, sertifikat bəyanatı) avtomatik əlavə olunur.

**17. Öyrənmə.** *Deterministik + flash-lite · fast (iş başına 1 çağırış).* Ətraflı bölmə 5.5-dədir.

---

## 3. Real situasiyalar cədvəli

| Ssenari | Nuanza nə bilir / nə soruşur | Xüsusi qaydalar | Avtomatik yoxlamalar |
|---|---|---|---|
| **S01** Sovet doğum şəhadətnaməsi RU→AZ (notarial, foto/skan) | **Bilir:** `civil_birth_cert`, dövr `soviet_azssr` (ССР, II-ЖГ seriyası); OCR iki dəfə oxuyur. **Soruşur (bloklayan):** hər şəxsin cari şəxsiyyət vəsiqəsindəki yazılışı. Təklif: Hüseynov Elçin Rafiq oğlu, Hüseynov Rafiq Əli oğlu, Hüseynova Sevil Həsən qızı. Cins (ata adından, təsdiqlə); sözlə tarix əlavə olunsunmu (defolt: bəli); tərcüməçi adı və notarius bloku (profildən) | `literal_form`, bütün sənəd bir çağırışda; AZ forma başlıqları (DOĞUM HAQQINDA ŞƏHADƏTNAMƏ, Doğulduğu yer, Ata, Ana, Akt qeydi №, Verilmə tarixi); ЗАГС → VVAQ bürosu; Azərbaycan SSR və Şaumyan rayonu verildiyi kimi qalır; М.П. → M.Y., (подпись) → (imza), [Möhür: ...], [oxunmur]; «II-ЖГ № 345678» Kiril qalır; tarix kodla yazılır: «14 mart 1987-ci il (min doqquz yüz səksən yeddinci il martın on dördü)»; sonda tərcüməçi sətri | Hər kilidli ad var (şəkilçiyə dözümlü), Huseynov/Quseynov variantları tutulur; ata ilə uşağın soyadı eynidir (ananınkı məcburi deyil); rusca sözlə tarix rəqəmlə üst-üstə düşür; «Respublikası», «Xətai», «qeydiyyat ofisi», «kızı», «doğum belgesi» qadağandır; seriya bayt-bayt eynidir; qoruyucu işarədən kənarda Kiril yoxdur; hər mənbə sahəsinin hədəf sahəsi var; ad, rəqəm və tarix tərcüməçi işarələyənə qədər qırmızı qalır |
| **S02** Diplom, transkript və əlavə AZ→EN | **Bilir:** paket bir layihədir, hər hissənin növü, şkala (100 ballıq və ya köhnə 5 ballıq). **Soruşur:** qiymətləndirici (WES, ENIC-NARIC, uni-assist, universitet), bu da US/UK variantını, tarix formatını və bəyanatı müəyyən edir; pasport yazılışı (təklif: Aytan Elshan gizi Mammadova); ata adı siyasəti; kurs adları siyasəti (universitetin ingilis kataloqu TM kimi) | Cədvəl rejimi: kredit, bal və hərf xanaları LLM-ə getmir; qiymət sözləri kodla: kafi = Satisfactory, qənaətbəxş = Sufficient; köhnə şkala: 5 əla, 4 yaxşı, 3 kafi, 2 qeyri-kafi; Qiymət = Grade, bal = points; universitet adları reyestrdən; 050407 və BB 0123456 qorunur; 84,6 → 84.6; GPA/ECTS çevrilməsi yoxdur; kurs adları paketdə bir dəfə tərcümə olunur; şkala qeydi və bəyanat avtomatik | Sətir və xana sayı eynidir; hər sətirdə rəqəmlər öz yerindədir; hərf ilə söz uyğundur; mənbədə olmayan ECTS, GPA, 4.0 qadağandır; ad bütün səhifələrdə eynidir; kurs adı transkriptdə və əlavədə eynidir; «Price», «ball», «enough» qadağandır; xanalarda uzunluq nisbəti yoxlanmır |
| **S03** Xidmət/əmək müqaviləsi EN→AZ (iki sütunlu) | **Bilir:** müqavilə növü, tətbiq olunan hüquq (governing law bəndindən), bilingual cədvəl, Word nömrələnməsi. **Soruşur:** hansı dil üstündür; rol adı (İcraçı; Podratçı yalnız podrat/tikinti üçün); shall siyasəti (eyni bənd iki variantda göstərilir); məbləğ konvensiyası; əvvəlki müqavilələr TMX/DOCX kimi | `legal_strict`, stil redaktoru yoxdur; təriflər əlavələr daxil bütün sənəddən kilidlənir (Agreement = Müqavilə; Saziş, Razılaşma, sözleşme qadağan); frazbuk: zərəri ödəmək və məsuliyyətdən azad etmək; kobud ehtiyatsızlıq; …qanunvericiliyi ilə tənzimlənir və ona uyğun şərh olunur; …səbəb olduğu həddə istisna olmaqla; shall → -malıdır, shall mean → deməkdir, shall be deemed → hesab edilir; «25 000,00 (iyirmi beş min) AZN» kodla; LLC → MMC, JSC → ASC; (a)–(iv) bir seqmentdir | shall bəndində -acaq/-əcək = major; təriflər hər seqmentdə və böyük hərflədir; qadağan variantlar yoxdur; bənd nömrələri ardıcıldır; dəyər pariteti (25,000.00 = 25 000,00 keçir, 3 725 → 3 752 tutulur); sözlə məbləğ rəqəmə bərabərdir; «qənaət», sözleşme, taraflar, yüklenici qadağandır; əhatə 100%, söz limiti yoxdur; təzminat, məsuliyyət, ödəniş və xitam bəndləri auditdən keçir |
| **S04** Etibarnamə + RF notarius qeydi + apostil RU→AZ | **Bilir:** üç hissəli zəncir; OCR. **Soruşur:** müvəkkil və vəkilin AZ pasportundakı adı (təklif: Əliyev Tofiq Məmməd oğlu, Əliyeva Nərgiz Tofiq qızı), FİN; ünvanın təsdiqi; Bakı notarius bloku lazımdırmı | `literal_form`; başlıq ETİBARNAMƏ; «Mən, …, bu etibarnamə ilə … səlahiyyət verirəm»; уполномочиваю → səlahiyyət verirəm; с правом / без права передоверия → başqasına etibar etmək hüququ ilə / hüququ olmadan; sözlə tarix sözlə qalır (kodla): «iki min iyirmi beşinci il mayın on beşi»; ünvan: Bakı şəhəri, Xətai rayonu, Babək prospekti, ev 12, mənzil 34; reyestr nömrəsi qorunur; «Dövlət rüsumu (tarif üzrə) tutulmuşdur: 200 rubl»; apostilin 10 sahəsi şablonla; səlahiyyətlər cümləsi bölünmür | Səlahiyyət sayı uyğundur (RU infinitivləri ilə AZ -maq/-mək formaları); audit hər səlahiyyəti hədəfdəki yerinə bağlayır, biri çatmırsa blokatordur; inkar cütünün pariteti; «icazə verirəm», «və digər zəruri hərəkətlər» qadağandır; ad, FİN, tarix və məbləğin dəyəri; reyestr nömrəsi bayt-bayt; zəncirin üç hissəsinin hamısı var |
| **S05** Məhkəmə qətnaməsi (boşanma/qəyyumluq) AZ→EN | **Bilir:** bölmələr (preambula, təsviri hissə, əsaslandırma, QƏTƏ ALDI, apellyasiya qeydi). **Soruşur:** qəbul edən orqan və yurisdiksiya, bu da tərəf cütünü və bəyanat mətnini müəyyən edir; pasport yazılışları (təklif: Sabina Akif gizi Guliyeva); möhür, qanuni qüvvə qeydi və apellyasiya qərarı tərcümə olunsunmu | `legal_strict`; Yasamal District Court of Baku City; Baku Court of Appeal; MPM → Civil Procedure Code; qətnamə → Judgment; nikahın pozulması → dissolution of marriage; QƏTƏ ALDI → HELD; -sın/-sin → shall be; Surəti əslinə uyğundur → True copy; tərəf cütü bir dəfə seçilir (US: Plaintiff/Defendant və ya Petitioner/Respondent; UK/Kanada boşanma: Applicant/Respondent); 150 sözlük preambula bir seqmentdir; iş nömrəsi qorunur | Tərəf terminləri qarışmır; RESOLUTION, violation of marriage, Region Court, «Let the claim», claimer qadağandır; MPM Civil Code kimi açılmır; maddə aralığı 217–219 eynidir; ad kilidləri; rol auditi: kim baxıb, kim kimə qarşı, nə tələb edib |
| **S06** Dövlət satınalması / neft-qaz tenderi AZ→EN | **Bilir:** paket bölmələri (elan, ixtisas tələbləri, texniki şərtlər, BOQ, müqavilə layihəsi), dövlət satınalması və ya özəl ITT. **Soruşur:** satınalan təşkilatın rəsmi ingiliscə adı (reyestrdən: Azerishig OJSC); shall və ya must; vaxt zonası qaydası; əvvəlki tenderlərin TMX-i | Hər bölmənin öz alt-playbook-u var; iddiaçı → bidder (plaintiff, claimant qadağan); tender təklifinin təminatı → bid security; satınalan təşkilat → procuring entity; -malıdır → shall/must, should qadağan; «17:00-dək (Bakı vaxtı)» → «until 17:00 Baku time (GMT+4) on 14 November 2025»; kVt → kW, ədəd → pcs; BOQ rəqəmləri LLM-ə getmir; bütün paketdən texniki alt-lüğət; uyğunluq matrisi ayrıca ixrac olunur | Modallıq; son tarixdə vaxt və zona var; çarpaz istinadlar (Bölmə 3.2 → Section 3.2); vahid və dəyər pariteti; BOQ sətir sayı; bütün terminlər bütün paketdə vahiddir; ixtisas tələbləri 100% auditdən keçir və növbədə birinci gəlir |
| **S07** İş arayışı, bank çıxarışı, MHBS AZ→EN | **Bilir:** alt növ və sütunların mənası. **Soruşur:** qəbul edən orqan; rəqəm formatı (2,450.00 və ya mənbə formatı); pasport yazılışı və cins (Mr/Ms) | Arayış şablonu: «This is to certify that…», «issued for submission to the relevant authority (To whom it may concern)»; aparıcı mütəxəssis → Leading Specialist; Kapital Bank OJSC; çıxarışda rəqəmlər LLM-ə getmir, kod onları bir formata salır; təsvirlər bir dəfə, lüğətdən (Əmək haqqı köçürməsi = Salary transfer, Nağdlaşdırma = Cash withdrawal); Mədaxil = Credit (in), Məxaric = Debit (out), Qalıq = Balance; merchant adı, kart maskası, IBAN və kod toxunulmazdır; MHBS terminbazası, mənfi ədədlər mötərizədə | Sətir sayı eynidir; hər xananın dəyəri eynidir; qalıq arifmetikası (əvvəlki + mədaxil − məxaric = qalıq) mənbədə (OCR səhvi üçün) və hədəfdə yoxlanır; IBAN mod-97; bütün sənəddə bir rəqəm formatı; MHBS cəmləri; «leading expert», «undistributed profit», «debtor debts» qadağandır |
| **S08** Epikriz AZ→EN (rus abbreviaturaları ilə) | **Bilir:** qarışıq mətn (ОАК, лейк. kimi Kiril hissələr işarələnir); əlyazma. **Soruşur:** klinika və ölkə (UK ischaemic / US ischemic); pasport yazılışı; lüğətdə olmayan və ya «qeyri-müəyyən» işarəli hər abbreviatura (SKA?) üçün məcburi sual | `faithful` (klinik); lüğət: ÜİX → IHD, AH → arterial hypertension, AT → BP, mm c.s. → mmHg, ОАК → CBC, лейк. → WBC; təxmin qadağandır (abbreviatura saxlanır, [?] və sual verilir); INN kiçik hərflə (Klopidoqrel → clopidogrel); mq → mg, q/l → g/L, vurğu/dəq → bpm; 2,5 → 2.5; ICD I21.1 qorunur; aşağı divar → inferior wall; diaqnoz və doza seqmentləri `deep` ilə | Doza dəyər və vahidlə yoxlanır (2,5 mq → 25 mg blokatordur); EN mətnində onluq vergül qalmayıb; tezlik (gündə 1 dəfə → once daily); lateralliq pariteti; lüğətdən kənar açılış qırmızıdır; diaqnoz, doza və analiz 100% auditdən keçir; [illegible] heç vaxt təxminlə doldurulmur |
| **S09** Biznes məktubu / danışıqlar AZ→EN (Telegram) | **Bilir:** D1 müştəri profili (Rəşad Babayev → Rashad Babayev, Head of Procurement; Mr Rossi, İtaliya; UK/US; Incoterms, ödəniş şərtləri); son 3 məktub kontekst kimi. **Soruşur:** mövqe (sərt, neytral, barışdırıcı, kəskinləşən), bir toxunuşla, defolt profildən; cümlə həm imtina, həm bazarlıq kimi oxuna bilirsə, iki variantlı sual | `adaptive`; Hörmətli cənab Rossi → Dear Mr Rossi; «məktubunuzu aldıq» → «Thank you for your letter of…»; «Cavabınızı gözləyirik» → «We look forward to hearing from you»; Hörmətlə → Kind regards / Yours sincerely; partiya → batch/shipment (party qadağan); sərt mövqedə «mümkün deyil» → «we are unable to proceed on these terms»; şərti təklif şərti qalır; redaktor mövqeni yumşalda bilməz | Rəqəm, faiz, tarix və Incoterms dəyəri; şərt markerləri (əgər, -sa/-sə → if/provided); inkar; mənbə və hədəf mövqe etiketi (fərq major sayılır); profil adları və vəzifələri; kalka qara siyahısı (We want to note, With respect) |
| **S10** Nazirlik məktubu / nota verbal AZ→EN | **Bilir:** məktub növü; göndərən və alan reyestrdən (İqtisadiyyat Nazirliyi → Ministry of Economy of the Republic of Azerbaijan). **Soruşur:** «Nazirlər Kabinetinin Qərarı» Decision, yoxsa Resolution olsun (bir dəfə soruşulur, profildə kilidlənir); ev üslubu (defolt UK) | Rəsmi `adaptive` rejim, hüquqi terminlər kilidli; «Ref. No. 05/3-1284, 18 September 2025» kodla; Fərman = Decree, Sərəncam = Order, Qanun = Law, Qaydalar = Rules, Əsasnamə = Regulations/Statute, Milli Məclis = Milli Majlis; sitat kodla ingilis sırasına salınır: «Decision No. 145 of the Cabinet of Ministers of the Republic of Azerbaijan dated 12 May 2023»; nəzakət formulu şablondan; xahiş edirəm → I would kindly request; Nazir müavini → Deputy Minister; nota verbal üçüncü şəxs çərçivəsində; AZ→EN «shall» qaydası söndürülür | Qurum adı must-map (Ministry of Economics və of the Economy qadağan); akt növləri vahiddir; sitat sahələri dəyərlə yoxlanır; tarix 18 September 2025 formatında (09/18 qadağan); «National Parliament» qadağandır; «№ 05/3-1284.» yerində bölünmə yoxdur |
| **S11** Fintek / e-ticarət UI sətirləri EN→AZ | **Bilir:** format (JSON/ICU, XLIFF, .strings, Android XML), açar → ekran və element, maxLength, marketinq açarları (promo.*, banner.*). **Soruşur:** Siz, yoxsa sən; brend lüğəti (keşbek?); əvvəlki buraxılışın TM-i | Bir layihədə `ui` (funksional) və `transcreate` (marketinq); açarlar LLM-ə getmir; `{placeholder}`, ICU və `<b>` qoruyucu işarə altındadır; dəyişənə şəkilçi bitişdirilmir, cümlə yenidən qurulur («{name} adlı alıcıya {amount} göndərdiniz»); rəqəmdən sonra cəm yoxdur («Səbətinizdə # məhsul var»); 10 ₼ / AZN, DD.MM.YYYY; düymələrdə qısa fel; yalnız yeni və dəyişmiş açarlar tərcümə olunur | Placeholder, teq və ICU bayt pariteti, ICU strukturu yoxlanır; `}-ə` tipli bitişik şəkilçi regexi; «# …lar/lər» yoxdur; uzunluq aşımı qısaltma düzəlişinə gedir; sən/siz qarışmır; Sepet, Giriş yap, Şifre qadağandır; ixrac eyni formatda |
| **S12** Texniki təlimat / HSE EN→AZ | **Bilir:** struktur (addım, xəbərdarlıq, şəkil), PDF sütunları, təkrarlanan başlıqlar. **Soruşur:** müştəri terminbazası (TBX/Excel); rus mənşəli terminlər siyasəti (flans, salnik, zadvijka/siyirtmə); əmr forması -in/-ın; rəqəm və vahid qaydası | Texniki `faithful`; DANGER = TƏHLÜKƏ, WARNING = XƏBƏRDARLIQ, CAUTION = DİQQƏT, NOTICE = QEYD; isolate (enerji mənasında) → enerji mənbəyindən ayırmaq (izolyasiya qadağan); discharge line → vurma xətti; LOTO və PTW saxlanır, ilk dəfə açılır; HSE-PTW-004 qorunur; 3,600 rpm → 3 600 dövr/dəq; Fig. → Şəkil; pompa, cıvata, tork qadağandır | İnkar pariteti (Do not → -mayın) blokatordur; dəyər və vahid pariteti (85 N·m, 0 bar); siqnal söz xəritəsi; eyni EN xəbərdarlığı eyni AZ mətnini alır; bütün təlimatda termin vahidliyi; əmr forması vahiddir; hər xəbərdarlıq və rəqəmli addım auditdən keçir |
| **S13** Video subtitrləri SRT EN→AZ | **Bilir:** hər subtitr bloku bir vahiddir və müddəti məlumdur. **Soruşur:** auditoriya və müraciət (korporativ üçün siz, gənclər üçün sən); sıxlaşdırmaya icazə; ekrandakı mətn və mahnılar; adlar lüğəti | `subtitle`; nömrə və vaxt kodları LLM-ə ümumiyyətlə getmir; cümlə bitənə qədər bloklar qruplanır (≤6), hər blok üçün bir mətn qaytarılır; blokun büdcəsi min(84, müddət × 17) simvol; AZ feli sonda olduğu üçün mətn bloklar arasında yenidən qurulur (14: «Əgər qəhvənizin niyə bu qədər tez soyuduğunu» / 15: «heç düşünmüsünüzsə, cavab çox sadədir.»); So, actually atılır; sətir bölgüsü kodla | Blok sayı və vaxt kodları bayt-bayt eynidir; sətirdə ≤42 simvol; ≤2 sətir; CPS ≤17; aşım olarsa yalnız həmin blok «N simvola sıxlaşdır» düzəlişinə gedir; adlar vahiddir |
| **S14** Türk brendinin kampaniyası, SMS, HR TR→AZ | **Bilir:** kanal (SMS, push, veb, HR). **Soruşur:** kanal limiti; brend lüğəti; müştəriyə «Siz»; şüarlar transkreasiya olunsun, yoxsa tərcümə; tək «sabah» səhər deməkdir, yoxsa sabah? | Prompta yalnız mənbədə rast gəlinən yalançı dostlar düşür: yarın sabah → sabah səhər; çalışan → əməkdaş/işçi; bekar → subay; çocuk → uşaq; sağlık → sağlamlıq; indirim → endirim; geçerlidir → qüvvədədir; avtodüzəliş: 10:00'dan → 10:00-dan, %30'a varan → 30%-dək, Ekim → oktyabr, xüsusi addan sonra apostrof silinir (Bakıya); SMS UCS-2 (70, birləşmiş SMS-də hissə başına 67 simvol) | Türk sızması: -yor, değil, için, tək «ile», -acaktır, yalnız türk dilində olan sözlər, AZ lüğətində olmayıb türk dilində olan söz; 6 sözdən uzun seqmentdə «ə» yoxdursa şübhəlidir; Siz böyük hərflədir; SMS hissə sayı; test dəstində sızma 0-dır |

---

## 4. Domen «playbook»ları

**Playbook nədir:** sənəd növü və dil cütü üçün versiyalı JSON fayl. İçindəkilər: iz qaydaları, rejim, suallar (bloklayan və ya yox), seqmentləşdirmə qaydaları, şablon başlıqları, frazbuk (`srcRegex → tgt`, `mustMap`, `forbid[]`), kilidli terminlər, format profili (rəqəm, tarix, sözlə məbləğ, vaxt zonası), işarələmə xəritəsi, aktiv yoxlamalar və onların ağırlığı, risk nümunələri, ixrac şablonu, 2–4 qızıl nümunə, 20–50 test elementi. Məlumat paketlərinin hər qeydinin mənbəyi və «son yoxlama tarixi» var.

### Faza 1: yüksək həcm, yüksək risk (ilk 4 həftə)

**1. `civil_cert_ru_az`: doğum, nikah, boşanma, ölüm şəhadətnamələri və şəxsiyyət/pasport səhifələri (Sovet AzSSR, RSFSR/RF, cari AZ)**
- Rejim `literal_form`, hər sahə ayrıca vahiddir, başlıqlar AZ formasından götürülür.
- Ata adı: -ович/-евич/оглы → oğlu; -овна/-евна/кызы → qızı; Алиевич → Əli oğlu. Qeyri-AZ adlar fonetik yazılır (İvanov Sergey Petroviç).
- ЗАГС → VVAQ (Vətəndaşlıq vəziyyəti aktlarının qeydiyyatı) bürosu; азербайджанец/-ка → azərbaycanlı.
- Tarixi adlar verildiyi kimi qalır: Azərbaycan SSR, Şaumyan rayonu. «Respublikası» və «Xətai» qadağandır.
- М.П. → M.Y.; (подпись) → (imza); [Möhür: ...]; [oxunmur]; seriya bayt-bayt köçürülür.
- Sonda: «Rus dilindən Azərbaycan dilinə tərcümə edilmişdir. Tərcüməçi: ... (imza)» və notarius bloku üçün yer.

**2. `poa_chain_ru_az`: etibarnamə, RF notarius qeydi, apostil**
- Hər üç hissə tərcümə olunur. Apostilin 10 nömrəli sahəsi şablonla doldurulur.
- уполномочиваю → səlahiyyət verirəm (icazə verirəm qadağandır); «Mən, ..., bu etibarnamə ilə ...».
- Qütb cütü: с правом / без права передоверия → başqasına etibar etmək hüququ ilə / hüququ olmadan.
- Sözlə tarix sözlə qalır və kodla yaradılır. года рождения → -cı il təvəllüdlü.
- Ünvan hissələri: г. → şəhəri, р-н → rayonu, пр. → prospekti, ул. → küçəsi, д. → ev, кв. → mənzil.
- Hər səlahiyyət hədəfdə olmalıdır. «Və digər hərəkətlər» kimi ümumiləşdirmə qadağandır.

**3. `academic_az_en`: diplom, transkript, diplom əlavəsi, attestat**
- Qiymət sözləri kodla yazılır. 100 ballıq şkala: A əla = Excellent, B çox yaxşı = Very good, C yaxşı = Good, D kafi = Satisfactory, E qənaətbəxş = Sufficient, F qeyri-kafi = Fail. Köhnə 5 ballıq şkala: 5 = Excellent, 4 = Good, 3 = Satisfactory, 2 = Unsatisfactory.
- Rəqəm xanaları LLM-ə getmir. 84,6 → 84.6. GPA və ECTS çevrilməsi yoxdur.
- Universitet adları reyestrdən götürülür. Dövlət Attestasiya Komissiyası = State Attestation Commission.
- Ad bütün paketdə pasportdakı kimidir. Ata adı siyasəti (gizi/oglu saxlanır və ya atılır) hər yerdə eynidir.
- Kurs adları paketdə bir dəfə tərcümə olunur. Tarix formatı və sertifikat bəyanatı qiymətləndiriciyə görə seçilir.
- Şkala haqqında tərcüməçi qeydi avtomatik əlavə olunur.

**4. `reference_finance_az_en`: iş arayışı, bank çıxarışı, mülkiyyət çıxarışı, MHBS**
- ARAYIŞ → CERTIFICATE / «This is to certify that». Mr/Ms oğlu/qızı formasından çıxarılır.
- Mədaxil = Credit (in), Məxaric = Debit (out), Qalıq = Balance (hesab sahibinin baxışından).
- Rəqəmlər kodla bir formata salınır. Merchant adı, maska, IBAN və kodlara toxunulmur.
- Qalıq arifmetikası mənbədə və hədəfdə yoxlanır, sətir sayı eyni qalır.
- MHBS: Bölüşdürülməmiş mənfəət = Retained earnings; Debitor borcları = Trade receivables; mənfi ədədlər mötərizədə qalır.

**5. `tr_az_brand`: marketinq, SMS, push, HR**
- Yalançı dostlar: yarın sabah → sabah səhər; çalışan → əməkdaş; bekar → subay; çocuk → uşaq; sağlık → sağlamlıq.
- Rəqəmə şəkilçi defislə yazılır (10:00-dan, 30%-dək). Xüsusi addan sonra apostrof olmur (Bakıya).
- Ay adları AZ dilində və kiçik hərflədir (15 oktyabr). %30 → 30%.
- Müştəriyə «Siz» böyük hərflə yazılır. Şüarlar transkreasiya olunur və 2–3 variant verilir.
- SMS-in UCS-2 büdcəsi 70/67 simvoldur. Aşanda «qısalt» düzəlişi işə düşür.
- Hədəf mətndə türk sızması sıfır olmalıdır.

### Faza 2: hüquqi və rəsmi (həftə 5–8)

**6. `contract_en_az`: xidmət, təchizat, əmək müqavilələri**
- Təriflər bütün sənəddən çıxarılıb kilidlənir və böyük hərflə qalır. Contractor = İcraçı (Podratçı yalnız podrat üçün), Agreement = Müqavilə.
- shall → -malıdır/-məlidir və ya müqavilə indiki zamanı. -acaq/-əcək qadağandır. Ağ siyahı: shall mean = deməkdir; shall be deemed = hesab edilir; hereinafter = bundan sonra «...» adlandırılacaq.
- Frazbuk: indemnify and hold harmless; gross negligence = kobud ehtiyatsızlıq; governed by and construed; save to the extent (mütənasib istisna kimi).
- Məbləğ: «25 000,00 (iyirmi beş min) AZN, ƏDV nəzərə alınmadan»; thirty (30) → otuz (30).
- LLC → MMC, JSC → ASC. Qeydiyyatdakı tərəf adları tərcümə olunmur.
- Bənd nömrələri kilidli etiketdir, iki sütunlu düzülüş saxlanır.

**7. `judgment_az_en`: qətnamə, apellyasiya qərarı**
- qətnamə = Judgment; QƏTƏ ALDI = HELD; -sın/-sin = shall be.
- Məhkəmə adları reyestrdən: Yasamal District Court of Baku City; Baku Court of Appeal; Supreme Court.
- Abbreviaturalar: MPM = Civil Procedure Code, MM = Civil Code, CM = Criminal Code, CPM = Criminal Procedure Code, AM = Family Code, ƏM = Labour Code, İXM = Code of Administrative Offences.
- Tərəf cütü yurisdiksiyaya görə bir dəfə seçilir: US üçün Plaintiff/Defendant və ya Petitioner/Respondent; UK mülki iş üçün Claimant/Defendant; UK və Kanada boşanması üçün Applicant/Respondent.
- Preambula bir seqmentdir, inisiallar ingilis sırasına salınır (Judge L.M. Rzayeva).
- Surəti əslinə uyğundur = True copy; qanuni qüvvəyə minmişdir = has entered into legal force.

**8. `official_letter_az_en`: rəsmi məktub, nota verbal, dəvət**
- Qurum adları reyestrdən. Ref. No. və tarix bloku kodla yazılır.
- Fərman = Decree, Sərəncam = Order, Qanun = Law, Qaydalar = Rules, Əsasnamə = Regulations/Statute, Milli Məclis = Milli Majlis. Qərar müştərinin seçiminə görə yazılır.
- Akt sitatı kodla ingilis sırasına salınır.
- Nəzakət formulları şablondan götürülür, kalka olmur. xahiş edirəm = I would kindly request.
- Nota verbal: «presents its compliments … and has the honour to …».
- AZ→EN «shall» qaydası söndürülür.

**9. `business_email`: AZ↔EN yazışma**
- Mövqe kilidlidir, şərti cümlələr şərti qalır.
- Açılış və bağlanış cədvəli var, kalka qara siyahısı işləyir.
- partiya = batch/shipment/consignment.
- Ad və vəzifələr müştəri profilindən götürülür.
- İmtina ilə bazarlıq arasında qeyri-müəyyənlik olarsa, sual verilir.

### Faza 3: texniki və format tələb edənlər (həftə 9–12)

**10. `tender_az_en`** (və təklifi geri tərcümə üçün `tender_en_az`)
- iddiaçı = bidder; bid security; procuring entity; ASC = OJSC.
- -malıdır → shall/must, should qadağandır.
- Son tarixə həmişə «Baku time (GMT+4)» yazılır.
- Uyğunluq matrisi çıxarılır.
- BOQ sətir rejimində işlənir.

**11. `medical_az_en`**
- Abbreviatura lüğətində hər qeydin «dəqiq» və ya «qeyri-müəyyən» işarəsi var. Təxmin qadağandır.
- Dərmanlar INN ilə və kiçik hərflə yazılır.
- Onluq ayırıcı nöqtədir.
- Vahid xəritəsi tətbiq olunur.
- Lateralliq yoxlanır.

**12. `hse_manual_en_az`**
- Siqnal söz xəritəsi tətbiq olunur.
- isolate enerji mənasında ayırmaq kimi tərcümə olunur.
- Əmr forması -in/-ın.
- Minliklər boşluqla yazılır (3 600).
- Kodlar qorunur.
- İnkar uyğunsuzluğu blokatordur.

**13. `ui_strings_en_az`**
- Açar və placeholder-lər qorunur.
- Dəyişənə şəkilçi bitişdirilmir.
- «# məhsul» (rəqəmdən sonra cəm yoxdur).
- Müraciət «Siz»-dir.
- Uzunluq limiti var.
- Türk UI sözləri qara siyahıdadır.

**14. `subtitles_en_az`**
- Subtitr blokları qrup halında tərcümə olunur.
- ≤2 sətir, ≤42 simvol.
- CPS ≤17.
- Doldurucu sözlər atılır.
- Vaxt kodlarına toxunulmur.

### Faza 1-də lazım olan məlumat paketləri (kiçik başlayıb böyüyür)
- RU→AZ ad lüğəti: ilk 500 ad və soyad kökü, sonra 3000+ (Гусейн → Hüseyn, Гасан → Həsən, Мамед → Məmməd, Наргиз → Nərgiz). Lüğət yalnız təklif verir, son sözü pasport deyir.
- AZ→EN pasport romanizasiyası: ə → a, x → kh, ş → sh, ç → ch, c → j, q → g, ğ → gh; qızı → gizi, oğlu → oglu.
- Toponim bazası: Bakı rayonları və küçələri, Sovet dövrü adları (Шаумяновский → Şaumyan) «verildiyi kimi» qaydası ilə.
- RU notarius frazbuku (ilk 100 ifadə), AZ şəhadətnamə başlıqları, apostil sahələri, qiymət şkalaları.
- TR→AZ yalançı dostlar və sızma lüğəti (ilk 150).
- Rəsmi adlar reyestri: ən çox rast gəlinən 30 universitet, 25 bank, əsas məhkəmələr və nazirliklər.

---

## 5. Tərcüməçinin rolu

### 5.1 Nuanza nə soruşur
- **Sual vermə qaydası:** sual yalnız iki variant fərqli mətn verirsə **və** heç bir cədvəl, profil və ya playbook bunu həll etmirsə verilir.
- **Sıralama:** təsir edilən seqment sayı × ağırlıq (ad, pul, hüquq, tibb = 3; üslub = 1) × qeyri-müəyyənlik.
- **Ekranda:** ən çox 5 sual və adlar cədvəli. Qalanları «Fərziyyələr» panelində durur və bir kliklə dəyişdirilir. Bloklayan suallar həmişə görünür və 5-lik limitə daxil deyil. Tender və müqavilədə siyasət sualları bir «Siyasətlər» kartında toplanır ki, gizlənməsin.
- **Hər sualda** defolt cavab var, mümkün olanda eyni bənd iki variantda göstərilir. Cavab adətən ~5 saniyə çəkir.
- **Tipik suallar:**
  - pasportdakı adlar və cins;
  - sözlə tarix əlavə olunsunmu;
  - qiymətləndirici və ya yurisdiksiya;
  - shall siyasəti, İcraçı və ya Podratçı;
  - Decision və ya Resolution;
  - mövqe; Siz və ya sən;
  - kanal limiti;
  - rus mənşəli terminlər;
  - tanınmayan abbreviatura (SKA?);
  - «sabah» səhər, yoxsa sabah.
- **Tərcümə zamanı** model təxmin etmək əvəzinə `{sual, variantlar}` qaytarır. Eyni suallar birləşdirilir, tərcümə defoltla davam edir, seqment isə qırmızı və ya sarı qalır.
- **Q düyməsi** sualı Telegramla müştəriyə göndərir və ya kopyalayır.

### 5.2 Etibar və alternativlər necə göstərilir
- Hər seqmentin rəngi və səbəb nişanları var: «Ad kilidlidir ✓», «Doza 2,5 → 2.5 dəyəri ✓», «SKA lüğətdə yoxdur», «7 səlahiyyətdən 1-i yoxdur», «shall → -malıdır ✓».
- Növbə qırmızı → sarı → yaşıl sırası ilə gedir, eyni problemlər qruplaşdırılır.
- **Alternativlər** yalnız qırmızı, sarı və risk seqmentlərində verilir: ən çox 3 variant, hər birində 6–10 sözlük «nə vaxt doğrudur» qeydi. Hər variant əvvəlcədən yoxlamadan keçib. Sıra: siyasətə uyğunluq → yoxlama nəticəsi → müştərinin keçmiş seçimləri.
- **Yaşılların toplu təsdiqi** playbook kalibrləndikdən sonra açılır (məsələn, 300-dən çox təsdiqlənmiş seqment və yaşılların 5%-dən azı redaktə olunub). `literal_form` sənədində ad, rəqəm və tarix heç vaxt toplu təsdiq olunmur.

### 5.3 Klaviatura
`Enter` təsdiq · `1–3` alternativ seçmək · `L` kilidləmək (sənəd və ya müştəri üçün) · `Q` müştəriyə sual · `E` redaktə. Vaxt sayğacı hər seqmentə sərf olunan vaxtı ölçür.

### 5.4 Qərarlar necə yayılır
- Cavab tipli qərara çevrilir: ad, abbreviaturanın mənası, termin seçimi, siyasət (shall, tərəf cütü, rəqəm formatı, mövqe). Əhatəsi seqment, sənəd və ya müştəri ola bilər.
- **Rəqəm və tarix formatı:** deterministik yenidən render.
- **Ad dəyişibsə:** həmin adı daşıyan bütün seqmentlər paketlə yenidən tərcümə olunur.
- **Termin və modallıq:** təsir edilən seqmentlərə bir flash-lite «yalnız bu kilidi tətbiq et» çağırışı gedir. **Diff qoruyucu** kilid hissəsindən kənardakı dəyişikliyi rədd edir.
- **Cavablanmış sual:** sualı verən seqment deyil, mənbədə eyni varlığı olan **bütün** seqmentlər yenidən işlənir.
- Təsdiqlənmiş seqment yalnız kilid hissəsində dəyişibsə təsdiqli qalır və «avtomatik yeniləndi» nişanı alır. Başqa dəyişiklik olarsa, seqment yenidən redaktə statusuna qayıdır.

### 5.5 Necə öyrənir
- **Təsdiq** TM-ə yazılır. Açar: müştəri + cüt + sənəd növü + dövr/təyinat. Şəxsi sənədlər şəxs və rəqəmləri maskalanmış halda saxlanır, bu həm məxfilik, həm də şablon uyğunluğu deməkdir.
- **Redaktə** düzəliş qeydi kimi saxlanır: `{src, ai, fin, sənəd növü, müştəri, playbook/prompt/model versiyası, ruleIds, rəng, saniyə}`.
- **İş bitəndə** flash-lite redaktəni təsnif edir: termin, ad, qrammatika və söz sırası, üslub və mövqe, OCR. Sonra:
  - termin namizədi 2 uyğun haldan sonra və ya bir `L` ilə müştəri terminbazasına keçir;
  - üslub qeydi müştəri profilinə yazılır və növbəti promptlara düşür;
  - eyni redaktə növü 3 və ya daha çox müxtəlif işdə təkrarlanarsa, qurucunun «qaydalar qutusu»na playbook təklifi düşür. Bir kliklə əlavə olunur, amma əvvəlcə test dəstindən keçir.
  - Adlar heç vaxt ümumiləşdirilmir. Mövcud kilidlə ziddiyyət göstərilir, amma tətbiq olunmur.
- **Kalibrləmə** həftəlikdir: yaşılların 8%-dən çoxu redaktə olunursa, yaşıl həddi qalxır.
- Bütün yaddaş D1-dədir, ona görə veb tətbiq, Telegram botu və bütün cihazlar eyni TM-i və profili görür.

### 5.6 Məsuliyyət və məxfilik
- Nuanza köməkçidir. Notarial və sertifikatlı tərcüməni insan oxuyur, imzalayır və məsuliyyəti daşıyır. Məhsul bunu açıq şəkildə deyir.
- Yalnız ödənişli Gemini açarı istifadə olunur (pulsuz səviyyədə məlumat təlimdə istifadə oluna bilər). D1-də şifrələmə tətbiq olunur. Orijinallar R2-də 30 gün saxlanır, tələb olunanda silinir. Müştəridən razılıq alınır (AZ «Fərdi məlumatlar haqqında» qanunu). TM şəxsi məlumatları maskalanmış halda saxlayır.

---

## 6. Keyfiyyəti necə ölçürük

### 6.1 Real Situasiya Test Dəsti
| Hissə | Ölçü | Nə üçündür |
|---|---|---|
| **Tələ cütləri** (v0, bu ay) | 100 → 250 minimal cüt | Hər məlum səhv üçün must_contain və ya must_not: kafi/qənaətbəxş, Qiymət → Price, shall → -acaq, save → qənaət, с правом/без права, iddiaçı (tender və məhkəmə), isolate → izolyasiya, `{name}-ə`, «5 məhsullar», AZ mətnində 25,000.00, 2,5 mg → 25 mg, ЗАГС → qeydiyyat ofisi, ССР → Respublikası, II-ЖГ → II-JG, sabah/bekar/çalışan, Fərman/Sərəncam, partiya → party |
| **Ssenari dəstləri S01–S14** | hər biri 15–20 sənəd (əvvəl 5, sonra artır) | Real şablonlar, uydurma şəxslər; istinad tərcümə, sual cavabları, gözlənilən Kilid Vərəqi, deterministik iddialar (dəyər pariteti, sətir və blok sayı, sızma = 0) |
| **Səhv yerləşdirilmiş variantlar** | hər ssenaridə 10+ | Rəqəm yerdəyişməsi, atılmış səlahiyyət, çevrilmiş inkar, türk sızması, yanlış qiymət sözü. QA-nın onların neçə faizini tutduğu ölçülür |
| **OCR dəsti** | 40–60 çap edilib fotolanmış sənəd | Ad, tarix və rəqəm sahələrində dəqiqlik, ikinci oxunun faydası |
| **Seqmentləşdirmə dəsti** | ~2000 işarələnmiş sərhəd | RU/AZ abbreviaturaları, inisiallar, ünvanlar |
| **Real işlər** | razılıqla, anonim | Tərcüməçinin düzəlişlərindən (`src, ai, fin`), `fin` istinad olur |

Dəst dev, test və holdout hissələrinə bölünür. Test və holdout mətnləri nümunə və TM kimi istifadə edilmir.

### 6.2 Metrikalar
| Metrika | Başlanğıc hədəf |
|---|---|
| HardPass: kritik iddiaların keçmə faizi | `literal_form` adlar, tarixlər, seriya: **100%**; hüquqi və texniki: ≥97% |
| Kritik tələ cütləri | 100% |
| QA-nın yerləşdirilmiş səhvləri tutma faizi | kritik növlərdə ≥95% |
| Auditin buraxılma tutması (səlahiyyət, bənd, inkar) | ≥95% |
| Türk sızması (TR→AZ, EN→AZ) | 0 |
| Tərcüməçi dəqiqəsi / 1000 söz | standart 12–18; hüquqi 20–30; forma: səhifəyə 6–10 dəq |
| Yaşıllardan redaktə olunanların payı | ≤5–8% |
| Qapını yazılı səbəblə keçmə payı, JSON səhvi, flash-lite istifadəsi | JSON səhvi ≤1% |
| Xərc / 1000 söz, p95 gecikmə | bölmə 7-yə bax |
| chrF (istinadla) | yalnız ucuz nəzarət siqnalı |
| MQM-P (kalibrlənmiş LLM hakim, v1-dən) | `literal` ≤1.5; hüquqi ≤3; `adaptive` ≤5 |

### 6.3 Reqressiya qapısı
1. **Hansı dəyişikliklər qapıdan keçir:** prompt, playbook, terminbaza, yoxlama, model, temperatur, hissə ölçüsü. Promptlar `/prompts/*.md` fayllarına köçürülür ki, hər dəyişiklik görünsün.
2. **Qaçışlar:** kiçik qaçış (150 element, bütün kritik tələlər) hər dəyişiklikdə; tam qaçış buraxılışdan əvvəl; holdout rübdə bir dəfə.
3. **Bloklayan qaydalar:**
   - köhnə versiyanın keçdiyi heç bir elementdə yeni kritik səhv yoxdur;
   - HardPass köhnə versiyadan aşağı deyil;
   - `literal_form` adları, tarixləri və seriyası 100%-dir;
   - xərc və p95 25%-dən çox artmır (keyfiyyət artımı olmadıqca);
   - JSON səhvi ≤1%.
4. **Model sabitlənir** (`FLASH_MODEL`, `LITE_MODEL`). Həftəlik nəzarət testi (canary) `-latest` üzərində qaçır və hesabat Telegramla gəlir. Yeni model yalnız qapıdan keçəndən sonra qəbul olunur.
5. **Aktiv recept KV-dədir**, ona görə dərhal geri qaytarmaq mümkündür.
6. **İstehsalda tapılan hər səhv əvvəlcə test elementinə çevrilir, sonra düzəldilir.**
7. **v1 (sonra):**
   - insan MQM etiketləri: 300 vahid, 25%-i iki annotatorla;
   - LLM hakim yalnız etibarlı olduğu kateqoriyalarda sayılır (türk sızması və ad standartı yalnız kodla);
   - ssenari üzrə cütləşmiş bootstrap;
   - risk modeli real redaktələrə uyğunlaşdırılır.

---

## 7. Xərc və sürət (təxmini)

**Fərziyyələr (qiymətləri yoxlayın, `-latest` dəyişir):** flash ≈ 1M giriş tokeni üçün $0.50, çıxış üçün $3.00 (düşünmə çıxış kimi hesablanır); flash-lite ≈ $0.10 / $0.40. 1000 söz ≈ 1500 (EN) – 2300 (AZ/RU) token.

### Dəqiq rejim, 1000 mənbə sözü üçün
| Addım | Çağırış | Model · sürət | Təxmini xərc |
|---|---|---|---|
| Təsnifat (sənəd başına, paylanmış) | 0.3 | flash-lite · fast | ~$0.0005 |
| Termin və şəxs çıxarılması | 1 | flash-lite · fast | ~$0.001 |
| Tanınmayan terminlərin həlli | 0.3 | flash · normal | ~$0.002 |
| Tərcümə | 3–4 | flash · normal | ~$0.022 |
| Hədəfli düzəliş (~30% seqment) | 1–1.5 | flash · normal | ~$0.007 |
| Audit | 1 | flash-lite · fast (ciddi sənəddə flash) | ~$0.001 (~$0.005) |
| Risk əsaslı dərin QA | 1 | flash · normal | ~$0.007 |
| **Cəmi** | **~8–9** | | **≈ $0.04 (≈ 0.07 AZN)** |

Xərcin çoxunu çıxış tokenləri yaradır. Sabit prefiksin keşlənməsi girişi əlavə ucuzlaşdırır.

### Digər rejimlər
- **Sürətli rejim** (bot, sürətli tərcüməçi): ~1.2–1.5 çağırış, **≈ $0.01 / 1000 söz**.
- **OCR:** səhifəyə **≈ $0.005–0.01** (iki oxu ilə).
- **Tibbi və hüquqi blokatorlarda `deep`:** sənədə +$0.01–0.02.

### Nümunə işlər
| İş | Xərc | Maşın vaxtı |
|---|---|---|
| Doğum şəhadətnaməsi (1 səhifə, fotodan) | ~$0.02–0.03 | 40–70 san + 2–4 dəq tərcüməçi yoxlaması |
| Diplom + 60 sətirlik transkript | ~$0.05 | ~1–2 dəq |
| 20 min sözlük müqavilə | ~$0.8–1.1 | 8–15 dəq |
| 60 min sözlük tender | ~$2.5 (Batch API ilə gecə ~$1.3) | 30–45 dəq |
| 300 sətirlik bank çıxarışı | <$0.01 | <1 dəq |
| 10 dəqiqəlik SRT | ~$0.02–0.05 | ~1 dəq |
| Bot məktubu | <$0.003 | 4–10 san |

### Ay üzrə (300 min söz + 400 skan səhifə)
Gemini təxminən $15–25, test qaçışları $10–20, Cloudflare Workers Paid $5 (D1, R2 və KV daxil). **Cəmi təxminən $30–50/ay.** Bu, Bakı səhifə qiymətlərinə (10–20 AZN) nisbətən çox kiçikdir.

---

## 8. Koda dəyişikliklər

### 8.1 Worker `/api` (köhnə sorğularla uyğunluq saxlanır)
- **Yeni sahələr** (hamısı ixtiyari): `tier: 'flash'|'lite'`, `system` (systemInstruction, keş üçün), `images: [{mime, data}]` (OCR), `schema` (responseSchema), `temperature`, `maxOut`, `allowFallback`.
- **Cavab:** `{json, usage: {in, out, thought, cached}, model, fellBack}`.
- Model ID-ləri env-də sabitlənir. 429/5xx xətasında 2 təkrar cəhd. Ciddi rejimlərdə səssiz fallback yoxdur. JSON kəsilərsə, hissə avtomatik iki yerə bölünür.
- **Qorunma:** sessiya tokeni və istifadəçi başına limit. Telegram hesabı birdəfəlik kodla bağlanır.
- **Yeni marşrutlar:** `/api/store/*` (D1), `/api/file` (R2, 30 gün), `/api/lookup` (böyük lüğətlər), versiya heşi ilə statik playbook JSON-ları, `/api/eval/*` (admin), test qaçışları üçün ixtiyari Cron.

### 8.2 Mövcud funksiyalar
| İndiki | Yeni | Nə dəyişir |
|---|---|---|
| `splitSegs` | `segment(doc, lang, profile)` | Dil üzrə abbreviaturalar, inisiallar, MPM-in, №, mötərizə və (a)–(iv) içində bölünmə yoxdur, birlikdə saxlanan hissələr; struktur vahidləri (sahə, sətir, blok, açar) |
| — | `protect()/restore()` | Qoruyucu işarələr; parity yoxlaması və 1 təkrar cəhd |
| `tmPrefill` | `tmLookup()` (D1) | Dəqiq, kontekst və maskalanmış şablon uyğunluğu; açar: müştəri + cüt + sənəd növü + dövr; TMX idxal və ixrac |
| `runAnalysis` | `classifyDoc()` + `extractAll()` + `buildQuestions()` | İz qaydaları + lite; bütün sənəd üzrə çıxarma; 2600 söz və 25 termin limiti yoxdur |
| `sitCard` | `buildBrief()` | Situasiya Obyekti, qərarlar, rejim mətni; ≤300 token, sabit prefiks |
| `glLine` | `lockBlock(chunk)` | Yalnız bu hissədə görünən adlar, terminlər (qadağan variantlarla), rəqəm xəritəsi, frazbuk |
| `chunksOf` | `planChunks()` | Struktura görə: forma, bənd qrupu, 30–40 sətir, blok qrupu, 60–100 açar; təkrarlar bir dəfə; token büdcəsi |
| `examplesFor` | `retrieveExamples()` | Eyni sənəd növü və müştəri əvvəl; playbook qızıl nümunələri; test mətnləri istisna |
| `aiPretranslate` | `runPipeline(p, mode)` | Qapı → kilidlər → tərcümə (3–4 paralel) → yoxlama → avtodüzəliş → hədəfli düzəliş → audit → yenidən yoxlama → rəng; iş vəziyyəti davam etdirilə bilir |
| senior editor | `reviseChunk()` | Yalnız tapıntılar; kilid qırılırsa rədd; `literal_form` və `legal_strict` rejimində stil redaktoru yoxdur |
| `answerQ` | `applyDecision()` | Tipli qərar; təsir edilən bütün seqmentlər; diff qoruyucu |
| `localQA` | `verify/*` | Modul yoxlamalar (bölmə 2, addım 10); hər tapıntı `{ruleId, ağırlıq}` |
| `deepQA` | `riskReview()` | Risk əsaslı, söz limiti yoxdur, yoxlama siyahısı ilə; təkliflər yenidən yoxlanır |
| `termConsistency` | `ledgerSweep()` | Deterministik, bütün terminlər, bütün paket |
| `reqCheck` | + uyğunluq matrisi | Tender tələbləri, qəbul edən orqanın tələbləri |
| HTML `.doc` | `export/*` | Forma, cədvəl, bilingual, DOCX, SRT/VTT, JSON/XLIFF, TMX/TBX |
| Gold test | Test dəsti və qapı | İddialara əsaslanır; LLM hakim yalnız təbiilik üçün |
| Sürətli tərcüməçi və bot | Yüngül axın | Əvvəlcə iz; şəhadətnamə və etibarnamə layihəyə yönləndirilir; profil və mövqe düyməsi |
| `corr` / TM (localStorage) | D1 + localStorage keşi | Bütün cihazlar və bot bir yaddaşdan istifadə edir |

### 8.3 Yeni modullar
```
ingest/      docx (numbering, cədvəl, bilingual), pdfLayout, ocr (iki oxu, kəsiklər), srt, vtt,
             jsonIcu, xliff, strings, androidXml, xlsx, tmx, tbx
situation/   fingerprint, classify, intakeCard (veb + Telegram düymələri)
playbooks/   loader, compose, *.json
locks/       sentinels, numbers (AZ/EN/RU rəqəm↔söz), dates (sözlə tarix, azOrdinalSuffix),
             names (RU→AZ bərpa, ata adı, translit, AZ→EN pasport), toponyms, abbreviations, citations
translate/   buildPrompt, translateChunk, reviseChunk, auditChunk, azProofread
verify/      values, dates, names, terms, tokens, negation, modality, enumeration, trLeak,
             script, tables, balance, iban, icu, uiLength, sms, subtitles, length
confidence.js, ledger.js, learn/ (diff, mine, calibrate)
export/      formDoc, tableDoc, bilingualDoc, docxRoundtrip, srt, structured, tmx, tbx
store/       D1 müştəri + localStorage keşi
evals/       bench/*.jsonl, run, gate, report
```

### 8.4 Qurma sırası
1. **Faza 0 (bu həftə):** bölmə 9-dakı 7 iş.
2. **Faza 1 (həftə 2–4), notarial nüvə:**
   - D1 store;
   - OCR (iki oxu, şəkillə yan-yana təsdiq);
   - ad bərpası (500 ad, ata adı qaydaları, pasport romanizasiyası);
   - toponim bazası;
   - `classifyDoc`, situasiya kartı, playbook yükləyicisi;
   - 5 playbook: civil_cert, poa_chain, academic, reference_finance, tr_az_brand;
   - `verify` v1, hədəfli düzəliş;
   - forma və cədvəl ixracı;
   - risk növbəsi və buraxılış qapısı;
   - S01, S02, S04, S07, S14 dəstləri.
3. **Faza 2 (həftə 5–8), hüquqi və rəsmi:**
   - DOCX XML idxal və ixracı (nömrələmə, bilingual cədvəl);
   - bütün sənəd üzrə termin çıxarılması;
   - TMX və TBX idxalı;
   - audit və `applyDecision` yayılması;
   - öyrənmə moduli;
   - contract, judgment, official_letter, business_email playbook-ları;
   - ortaq profil və mövqe ilə bot;
   - S03, S05, S09, S10 dəstləri.
4. **Faza 3 (həftə 9–12), formatlar və texniki:**
   - SRT/VTT, JSON/ICU, XLIFF, Android, .strings;
   - PDF layout bərpası;
   - tender, tibbi, HSE, UI və subtitr playbook-ları;
   - uyğunluq matrisi;
   - fonda dərin QA;
   - S06, S08, S11, S12, S13 dəstləri.
5. **Faza 4 (sonra):**
   - MQM kalibrləməsi və risk modelinin uyğunlaşdırılması;
   - Batch API;
   - uzun işlər üçün Cloudflare Queues və ya Durable Objects;
   - IDML.

---

## 9. Bu həftə edilməli işlər

Sıra keyfiyyətə ən böyük təsirdən başlayır.

1. **Rejim mətnləri və redaktorun söndürülməsi.**
   - `literal_form`, `legal_strict`, `faithful`, `adaptive` seçimi əlavə olunur. Təsnifatçı hazır olana qədər əl ilə seçilir, regex izi avtomatik təklif verir.
   - «Translate meaning not words» qaydası yalnız `adaptive` və `transcreate` rejimində qalır.
   - Senior editor `literal_form` və `legal_strict` rejimində söndürülür, yerinə «yalnız sadalanan problemi düzəlt» gəlir.
   - EN→AZ shall qaydası ağ siyahı ilə əlavə olunur. AZ→EN shall qaydası məktub və emaildə söndürülür.
   - *Qəbul meyarı:* S01, S03, S04 nümunələrində sərbəst ifadə yoxdur, shall → -malıdır.
2. **`splitSegs` v2.**
   - RU/AZ/EN/TR abbreviatura siyahıları, inisiallar, `MPM-in`, `№`, mötərizə və (a)–(iv) daxilində bölünmə yoxdur, preambula və səlahiyyətlər birlikdə saxlanır.
   - *Qəbul meyarı:* S01, S04, S05, S08 nümunələri gözlənilən sayda seqmentə bölünür.
3. **`protect()/restore()`.**
   - Seriya, reyestr və iş nömrələri, kodlar, IBAN, placeholder, ICU, teq və vaxt kodu üçün qoruyucu işarələr; parity yoxlaması və 1 təkrar cəhd.
   - *Qəbul meyarı:* II-ЖГ, 77/512-н/77-2025-3-1045, 2(006)-4521/2024, {name}, HSE-PTW-004 bayt-bayt qayıdır.
4. **`numbers.js` və dəyər pariteti.**
   - Lokala uyğun parser hazırkı rəqəm yoxlamasını əvəz edir.
   - AZ rəqəm → söz çevirmə, sıra şəkilçisi ilə sözlə tarix (1987-ci, 2024-cü, 1960-cı, 2019-cu), RU sözlə tarix parseri.
   - *Qəbul meyarı:* 2,5 → 25 tutulur; 25,000.00 → 25 000,00 keçir; 3 725,97 → 3 752,97 tutulur; «min doqquz yüz səksən yeddinci il martın on dördü» düzgün yaranır.
5. **Türk sızması lint və avtodüzəliş.**
   - ~60 yalançı dost TR→AZ promptuna əlavə olunur, ORTHO genişləndirilir.
   - Apostrof qaydası: rəqəmdən sonra defis, xüsusi addan sonra heç nə.
   - *Qəbul meyarı:* S14 nümunəsində bütün sızmalar tapılır; «Bakı'ya» → «Bakıya», «10:00'dan» → «10:00-dan», «Ekim» → «oktyabr».
6. **Worker yeniləməsi.**
   - Modelin sabitlənməsi, `usage` və `model` cavabda, `tier`, `system`, `schema`, `images` (OCR-a hazırlıq).
   - Token ilə qorunma və istifadəçi limiti; ciddi rejimdə səssiz fallback yoxdur; ödənişli açar.
   - *Qəbul meyarı:* hər cavabda model və token sayı görünür, tokensiz sorğu rədd olunur.
7. **Tələ dəsti v0.**
   - 80–100 minimal cüt (JSON: must_contain, must_not, dəyər pariteti).
   - Gold test səhifəsində «Qaçır» düyməsi və əvvəl/sonra müqayisəsi.
   - *Qəbul meyarı:* 1–6-cı işlərdən əvvəl və sonra nəticə qeydə alınır, hər iş ölçülmüş yaxşılaşma göstərir.

---

## 10. Tələbə funksiyaları: «Akademiya»

- **Ayrıca bölmə.** Tələbə hissəsi «Akademiya» adı ilə ayrıca bölmədə qalır ki, peşəkar tərcüməçinin iş ekranı sadə olsun. Mühərrik isə eynidir: eyni `verify/*`, eyni playbook-lar, eyni lüğətlər.
- **Olduğu kimi qalanlar:** XP, rütbələr, öyrənmə yolu, dərslər və təcrübə oyunları dəyişmir.
- **İki qiymətləndirici, bir mühərrik:**
  - A qiymətləndiricisi: flash, rubrika ilə;
  - B qiymətləndiricisi: flash-lite, fərqli rubrika ilə, üstəgəl deterministik yoxlamalar (rəqəm dəyəri, adlar, türk sızması, placeholder, modallıq, inkar). Bu yoxlamalar kritik səhvdə veto qoya bilir;
  - iki qiymətləndirici razılaşmırsa, nəticə ortalanmır, «qeyri-müəyyən» kimi göstərilir və müəllim növbəsinə gedir.
- **Səhv kartları** peşəkar QA ilə eyni taksonomiyadan və eyni qayda ID-lərindən istifadə edir. Tələbə «CON-12: shall → -acaq» kartını görür, tərcüməçi isə eyni tapıntını.
- **«Real işlər» treki** S01–S14 playbook-larından yaradılır:
  - Sovet şəhadətnaməsində ad bərpası məşqi (Гусейнов → Hüseynov, Рафикович → Rafiq oğlu);
  - yalançı dost oyunları (sabah, bekar, çalışan);
  - qiymət şkalası xəritələmə (kafi ↔ qənaətbəxş);
  - shall məşqləri, Fərman/Sərəncam, siqnal sözlər, notarius formulları.
- **Məlumat axını iki istiqamətlidir:**
  - peşəkar düzəlişlərdən (anonimləşdirilmiş, adlar və rəqəmlər silinmiş) yeni səhv kartları yaranır;
  - müəllimin təsdiqlədiyi tələbə tərcümələri razılıqla test dəstinə istinad kimi daxil ola bilər.
- **Gold test və tələbə qiymətləndirməsi** TR→AZ-da deterministik sızma sayını da hesablayır, ona görə türkləşmiş mətn «təbii» kimi yüksək bal ala bilməz.