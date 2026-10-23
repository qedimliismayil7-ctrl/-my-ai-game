# 🅿️ Park Ustası — 3D park simulyatoru

Brauzerdə işləyən 3D park simulyatoru. Məqsəd real həyatda park etməyi öyrənməkdir: hər səviyyədə **təlimatçı** real istinad nöqtələri ilə addım-addım yol göstərir ("hədəfdən sonrakı xətt arxa təkərinizin bərabərinə gələndə dayanın", "maşın 45° olanda sükanı tam sola çevirin" və s.).

## İşə salmaq

```bash
cd parking-sim
npm install
npm run dev      # http://localhost:5173
npm run build    # dist/ — istənilən statik hostinqə yükləmək olar
npm test         # avtomatik sürücü təlimatçıya əməl edib 5 səviyyəni və 30 təsadüfi məşq variantını keçir
npm run build:single  # dist/park-ustasi.html — hər şey daxildə olan tək fayl (telefon üçün link)
```

## Maşın: 2023 Hyundai Elantra SEL (ABŞ)

| Parametr | Dəyər | Mənbə / qeyd |
|---|---|---|
| Uzunluq | 4.676 m (184.1 in) | Hyundai spesifikasiyası, dilerlər |
| En | 1.826 m (71.9 in) | KBB, dilerlər |
| Təkər bazası | 2.720 m (107.1 in) | Hyundai spesifikasiyası |
| İz eni | 1.585 m | J.D. Power (62.4 in) — **təxmini** (təkər ölçüsünə görə dəyişir) |
| Ön / arxa çıxıntı | 0.91 / 1.046 m | **təxmini** — rəsmi rəqəm tapılmadı, 4.676 − 2.720 bölünüb |
| Dönmə radiusu | 5.39 m (17.7 ft) | Hyundai; dairə 35.4 ft (J.D. Power) |
| Sükan nisbəti | 12.9:1 | Hyundai 2021 Elantra spesifikasiyası — 2023 üçün **eyni qəbul edilib** |
| Sükan dövrəsi | 2.48 (±446°) | Hyundai 2021 Elantra spesifikasiyası — **eyni qəbul edilib** |
| Təkərin maksimum bucağı | ≈36° | **hesablanıb**: dönmə radiusundan (velosiped modeli); effektiv nisbət ≈12.4:1 |
| Park sensoru | standart deyil | 2023 SEL-də yalnız $1,900 Convenience Package ilə (Hyundai qiymət cədvəli, 04.01.2023). Oyunda ayrıca **köməkçi**dir, İmtahanda sönülü |
| Arxa kamera | standart | KBB, CarMax; dinamik xətlərin olması rəsmi təsdiqlənmədi — oyunda dinamik xətlər köməkçi kimi göstərilir |

Salon, sürücünün göz nöqtəsi, güzgülərin və kameranın yeri fotolara əsasən **təxminidir** (`src/carModel.js` → `VIEW`).
Dayanacaq ölçüləri ABŞ-a yaxındır: yer 9×18 ft (2.7×5.5 m), koridor 24 ft, paralel yer 24 ft (7.3 m), küçə 36 ft (11 m).

Mənbələr: [KBB](https://www.kbb.com/hyundai/elantra/2023/specs), [J.D. Power](https://www.jdpower.com/cars/2023/hyundai/elantra/sedan-4d-sel/specs), [Hyundai 2023 spesifikasiyası (PDF)](https://www.hyundainews.com/assets/documents/original/50515-2023ElantraProductSpecifications20220714.pdf), [Hyundai 2021 spesifikasiyası (PDF)](https://www.hyundainews.com/assets/documents/original/50451-446532021ElantraSpecifications20220713.pdf), [Hyundai 2023 qiymət cədvəli (PDF)](https://www.hyundainews.com/assets/documents/original/53437-2023MYElantraPriceSheet04Jan2023.pdf), [CarMax](https://www.carmax.com/car/29180978).

## Rejimlər

| Rejim | Necə işləyir |
|---|---|
| Öyrənmə | Təlimatçı, köməkçi xətlər, səhvdən geri qayıtma |
| Məşq | Dəyişən park yerləri, istəyə görə kömək |
| İmtahan | Köməksiz manevr, yalnız sürücü görünüşü, daha ciddi qiymətləndirmə |

Qiymətləndirmə ABŞ yol imtahanının məntiqinə yaxındır: toqquşma, xəttdən 30 sm-dən çox çıxma, səhv istiqamət, bordürdən 45 sm-dən (18 düym) uzaq durma — "keçmədi". Bordürə toxunma, əlavə manevr, siqnal və çiyin üstündən baxmamaq bal azaldır.

## Nə var

| Bölmə | Təsvir |
|---|---|
| Fizika (`src/physics.js`) | Velosiped (Ackermann) modeli: arxa təkərlər ön təkərləri izləyir. 2023 Elantra ölçüləri (yuxarıdakı cədvəl), ətalət, avtomat qutuda "sürünmə", ~10 km/saat maksimum, OBB toqquşma |
| Sükan (`src/input.js`) | Gamepad API: Logitech G29/G920, Thrustmaster və s. sükan ±446° (2.48 dövrə), qaz/əyləc/debriyaj ayrı oxlar, D/R/N/P düymələri, kalibrasiya ekranı oxları özü tapır, titrəmə (vibrationActuator) toqquşmada. Sükan yoxdursa klaviatura |
| Kameralar | Sürücü oturacağı (siçanla baxış, B — çiyin üstündən), yuxarıdan, arxadan (C). Sol, sağ və salon güzgüsü ayrıca render olunur. R-də arxa kamera dinamik istiqamət xətləri ilə avtomatik açılır |
| Səviyyələr (`src/levels.js`) | 1. Düz park (irəli ilə) · 2. Arxa ilə park · 3. Paralel park · 4. Maili park (60°) · 5. Dar küçədə 3 hərəkətlə dönmə |
| Təlimatçı (`src/coach.js`) | Maşının vəziyyətinə görə addımlar, "DAYANIN!" xəbərdarlığı, keçəndə düzəliş, yaşıl "ideal maşın" kölgəsi və trayektoriya, istəyə görə səsli |
| Qiymətləndirmə (`src/scoring.js`) | Toqquşma, bordürə toxunma, vaxt, manevr sayı, xəttin içində olmaq, bucaq xətası, mərkəzdən sürüşmə, bordürə məsafə, siqnal, sürət → 100 bal və 3 ulduz |
| Park sensorları | Ön/arxa 8 sensor, yaxınlaşdıqca siqnal sürətlənir, 30 sm-dən az — fasiləsiz səs |
| Dərslər | "Real həyatda park": hazırlıq, sürət nəzarəti, müşahidə, istinad nöqtələri, qaydalar və hər manevrin nəzəriyyəsi |

## Telefon

Telefonda (toxunma ekranı): sükan (fırlanan və ya sağa-sola sürüşdürmə, həssaslıq ayarlanır), ⟲ Düz düyməsi, Əyləc və Qaz pedalları, ortada P/R/N/D (pedallardan uzaqda) və digər düymələr. Ayarlarda düymələrin ölçüsü və pedalların tərəfi dəyişir. Tətbiqdən çıxanda oyun avtomatik pauza olur və pedallar buraxılır. Telefonu üfüqi tutun.

## Klaviatura

W/S — qaz/əyləc · A/D — sükan (Shift sürətli, K mərkəzə) · E/Q və 1–4 — ötürmə · Boşluq — əl əyləci · Z/X — siqnal · C — kamera · V — arxa kamera · B — arxaya baxış · M — güzgülər · H — təlimatçı · G — köməkçi · Enter — bitir · T — yenidən · Esc — pauza

## Qeydlər

- Ötürməni dəyişmək üçün maşın dayanmalı və əyləc basılı olmalıdır (Ayarlarda söndürmək olar).
- Brauzerlər sükanın güc əks-əlaqəsini (mərkəzə qaytaran yay) Gamepad API ilə idarə etməyə imkan vermir — yalnız titrəmə. Yay effektini sükanın proqramında (G HUB və s.) açın.
- Təlimatçının istinad nöqtələri avtomatik sürücü ilə yoxlanılıb: addımlara əməl edəndə hər 5 səviyyə keçilir.
