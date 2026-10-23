# 🅿️ Park Ustası — 3D park simulyatoru

Brauzerdə işləyən 3D park simulyatoru. Məqsəd real həyatda park etməyi öyrənməkdir: hər səviyyədə **təlimatçı** real istinad nöqtələri ilə addım-addım yol göstərir ("hədəfdən sonrakı xətt arxa təkərinizin bərabərinə gələndə dayanın", "maşın 45° olanda sükanı tam sola çevirin" və s.).

## İşə salmaq

```bash
cd parking-sim
npm install
npm run dev      # http://localhost:5173
npm run build    # dist/ — istənilən statik hostinqə yükləmək olar
npm test         # avtomatik sürücü təlimatçıya əməl edib 5 səviyyəni keçir
npm run build:single  # dist/park-ustasi.html — hər şey daxildə olan tək fayl (telefon üçün link)
```

## Nə var

| Bölmə | Təsvir |
|---|---|
| Fizika (`src/physics.js`) | Velosiped (Ackermann) modeli: arxa təkərlər ön təkərləri izləyir. 4.5 m uzunluq, 1.8 m en, 2.7 m təkər bazası, 35° maksimum təkər bucağı, ətalət, avtomat qutuda "sürünmə", ~10 km/saat maksimum, OBB toqquşma |
| Sükan (`src/input.js`) | Gamepad API: Logitech G29/G920, Thrustmaster və s. 900° sükan (±450° → ±35°, nisbət ≈12.9:1), qaz/əyləc/debriyaj ayrı oxlar, D/R/N/P düymələri, kalibrasiya ekranı oxları özü tapır, titrəmə (vibrationActuator) toqquşmada. Sükan yoxdursa klaviatura |
| Kameralar | Sürücü oturacağı (siçanla baxış, B — çiyin üstündən), yuxarıdan, arxadan (C). Sol, sağ və salon güzgüsü ayrıca render olunur. R-də arxa kamera dinamik istiqamət xətləri ilə avtomatik açılır |
| Səviyyələr (`src/levels.js`) | 1. Düz park (irəli ilə) · 2. Arxa ilə park · 3. Paralel park · 4. Maili park (60°) · 5. Dar küçədə 3 hərəkətlə dönmə |
| Təlimatçı (`src/coach.js`) | Maşının vəziyyətinə görə addımlar, "DAYANIN!" xəbərdarlığı, keçəndə düzəliş, yaşıl "ideal maşın" kölgəsi və trayektoriya, istəyə görə səsli |
| Qiymətləndirmə (`src/scoring.js`) | Toqquşma, bordürə toxunma, vaxt, manevr sayı, xəttin içində olmaq, bucaq xətası, mərkəzdən sürüşmə, bordürə məsafə, siqnal, sürət → 100 bal və 3 ulduz |
| Park sensorları | Ön/arxa 8 sensor, yaxınlaşdıqca siqnal sürətlənir, 30 sm-dən az — fasiləsiz səs |
| Dərslər | "Real həyatda park": hazırlıq, sürət nəzarəti, müşahidə, istinad nöqtələri, qaydalar və hər manevrin nəzəriyyəsi |

## Telefon

Telefonda (toxunma ekranı) ekranın altında sükan (barmaqla fırladın), Əyləc və Qaz pedalları (yuxarı sürüşdürdükcə daha çox basılır), P/R/N/D düymələri, siqnal, kamera, arxaya baxış, təlimatçı, bitir və menyu düymələri çıxır. Telefonu üfüqi tutun.

## Klaviatura

W/S — qaz/əyləc · A/D — sükan (Shift sürətli, K mərkəzə) · E/Q və 1–4 — ötürmə · Boşluq — əl əyləci · Z/X — siqnal · C — kamera · V — arxa kamera · B — arxaya baxış · M — güzgülər · H — təlimatçı · G — köməkçi · Enter — bitir · T — yenidən · Esc — pauza

## Qeydlər

- Ötürməni dəyişmək üçün maşın dayanmalı və əyləc basılı olmalıdır (Ayarlarda söndürmək olar).
- Brauzerlər sükanın güc əks-əlaqəsini (mərkəzə qaytaran yay) Gamepad API ilə idarə etməyə imkan vermir — yalnız titrəmə. Yay effektini sükanın proqramında (G HUB və s.) açın.
- Təlimatçının istinad nöqtələri avtomatik sürücü ilə yoxlanılıb: addımlara əməl edəndə hər 5 səviyyə keçilir.
