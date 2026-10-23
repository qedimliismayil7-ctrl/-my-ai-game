// Səviyyələr: yalnız məlumat (Three.js-siz). world.js bunu 3D-yə çevirir, coach.js təlimatı oxuyur.
// Bucaqlar: +X istiqaməti = π/2, +Z = 0, −Z = π, −X = −π/2. Pozalar ARXA OXUN mərkəzidir.
import { CAR, DEG, wrapAngle } from './physics.js';

const P = Math.PI;
const R = CAR.minRadius;

const COLORS = [0xb8bec6, 0x1d2a44, 0x8a1c1c, 0xf2f2f2, 0x2c2c2c, 0x3b5f8a, 0x6b6f3a, 0xc9a227, 0x5a5f66, 0x7a2f55, 0x274d3a];

function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Tam sükanla qövs: k = +1 sol, −1 sağ; dir = +1 irəli, −1 geri; bucaq dəyişənə qədər
function arc(pose, k, dir, dh) {
  let { x, z, h } = pose;
  const target = h + dh;
  const n = 400;
  for (let i = 0; i < n; i++) {
    const step = dh / n;
    h += step;
    const ds = (step * R) / k;
    x += Math.sin(h) * ds;
    z += Math.cos(h) * ds;
  }
  return { x, z, h: wrapAngle(target) };
}

// ---------- Ümumi tikinti blokları ----------

function parkedCar(r, x, z, h) {
  return {
    x: x + (r() - 0.5) * 0.16,
    z: z + (r() - 0.5) * 0.16,
    h: h + (r() - 0.5) * 3 * DEG,
    color: COLORS[Math.floor(r() * COLORS.length)],
  };
}

function scenery(layout, r, xs, zs) {
  for (const [x, z] of zs) layout.trees.push([x, z]);
  for (const b of xs) layout.boxes.push(b);
}

// Perpendikulyar dayanacaq: koridor X boyu (z −3.5…3.5), yerlər hər iki tərəfdə 5 m dərinlikdə.
function perpLot({ seed, targetH, freeA = [], freeB = [] }) {
  const r = rng(seed);
  const W = 2.6, D = 5;
  const L = { kind: 'lot', lines: [], dashed: [], cars: [], curbs: [], boxes: [], trees: [], grass: [], sidewalks: [], arrows: [] };
  for (let i = -6; i <= 6; i++) {
    const x = i * W;
    for (const side of [1, -1]) {
      const z0 = 3.5 * side, z1 = (3.5 + D) * side;
      L.lines.push([x - W / 2, z0, x - W / 2, z1]);
      if (i === 6) L.lines.push([x + W / 2, z0, x + W / 2, z1]);
      const free = side > 0 ? freeA : freeB;
      if (side > 0 && i === 0) continue; // hədəf yer
      if (free.includes(i)) continue;
      if (r() < (Math.abs(i) <= 1 && side > 0 ? 2 : 0.72)) {
        const h = r() < 0.6 ? (side > 0 ? 0 : P) : side > 0 ? P : 0;
        L.cars.push(parkedCar(r, x, (3.5 + D / 2) * side, h));
      }
    }
  }
  const xEnd = 6 * W + W / 2;
  L.lines.push([-xEnd, 3.5 + D, xEnd, 3.5 + D]);
  L.lines.push([-xEnd, -3.5 - D, xEnd, -3.5 - D]);
  L.dashed.push([-xEnd - 6, 0, xEnd + 6, 0]);
  L.curbs.push([-xEnd - 8, 8.85, xEnd + 8, 8.85]);
  L.curbs.push([-xEnd - 8, -8.85, xEnd + 8, -8.85]);
  L.grass.push({ cx: 0, cz: 13, w: 80, l: 8 }, { cx: 0, cz: -13, w: 80, l: 8 });
  L.arrows.push([-12, -1.75, P / 2], [6, -1.75, P / 2], [-6, 1.75, -P / 2], [12, 1.75, -P / 2]);
  scenery(L, r, [
    { cx: -10, cz: 24, h: 0, hw: 9, hl: 5, height: 12, color: 0xd8cbb3, type: 'building' },
    { cx: 12, cz: 26, h: 0, hw: 10, hl: 6, height: 18, color: 0xa9b8c4, type: 'building' },
    { cx: 0, cz: -26, h: 0, hw: 14, hl: 6, height: 9, color: 0xc7a98c, type: 'building' },
    { cx: -32, cz: 0, h: 0, hw: 4, hl: 10, height: 6, color: 0xbfbfbf, type: 'building' },
  ], [[-14, 12], [-6, 13], [3, 12], [11, 13.5], [-12, -12], [-2, -13], [8, -12], [16, -13]]);
  // işıq dirəkləri — maneə kimi
  for (const x of [-12, 0, 12]) L.boxes.push({ cx: x, cz: 9.6, h: 0, hw: 0.12, hl: 0.12, height: 6, color: 0x555a60, type: 'pole' });
  return L;
}

// ---------- Ümumi qaydalar (Real həyatda park) ----------

export const GENERAL_LESSONS = [
  {
    title: 'Hazırlıq: oturacaq və güzgülər',
    items: [
      'Oturacağı elə qurun ki, əyləci sona qədər basanda dizləriniz azca bükülü qalsın.',
      'Sükanı iki əllə “saat 9 və 3” vəziyyətində tutun. Park zamanı əlləri dəyişərək (əl-əl üstə) çevirmək rahatdır.',
      'Yan güzgülər: maşınınızın yan tərəfi güzgünün daxili kənarında çox az (təxminən 1/4) görünməlidir, üfüq güzgünün ortasında.',
      'Salon güzgüsü: arxa şüşə bütöv görünməlidir.',
    ],
  },
  {
    title: 'Sürət nəzarəti: yavaş — ən yaxşı dostunuzdur',
    items: [
      'Avtomat qutulu maşın D və ya R-də qaza basmadan da yavaş “sürünür” (təxminən 4–5 km/saat). Park zamanı qaza demək olar ki, basmayın.',
      'Sürəti əyləc pedalı ilə tənzimləyin: əyləci azca buraxın — maşın yavaş hərəkət edir, basın — dayanır.',
      'Qayda: “Maşın ilbiz kimi, sükan dəli kimi” — maşın yavaş, sükan isə sürətlə çevrilməlidir.',
      'İstiqaməti (D ↔ R) yalnız maşın TAM dayananda dəyişin, əyləci basıb saxlayaraq.',
    ],
  },
  {
    title: 'Müşahidə: güzgülər, kor nöqtə, çiyin üstündən baxış',
    items: [
      'Manevrdən əvvəl hər üç güzgüyə baxın və dönmə siqnalını yandırın.',
      'Yan güzgülərdə görünməyən sahə — kor nöqtə var. Hərəkətə başlamazdan əvvəl başınızı çevirib çiyin üstündən baxın (simulyatorda B düyməsi).',
      'Geri gedərkən yalnız kameraya güvənməyin: kamera piyadanı, uşağı və ya alçaq dirəyi gec göstərə bilər. Güzgülər + çiyin üstündən baxış + kamera.',
      'Park sensorunun siqnalı sürətləndikcə maneə yaxınlaşır; fasiləsiz səs təxminən 30 sm və daha az deməkdir — dərhal dayanın.',
    ],
  },
  {
    title: 'İstinad nöqtələri nədir?',
    items: [
      'Sürücü maşının künclərini görmür, ona görə təlimatçılar “istinad nöqtələri” istifadə edir: məsələn, “çiyniniz xəttə çatanda” və ya “xətt güzgünün altında itəndə”.',
      'Hər maşında bu nöqtələr bir az fərqlidir. Simulyatorda öyrəndiyiniz qaydaları real maşında ilk dəfə boş dayanacaqda, konuslarla yoxlayın.',
      'Yuxarıdan görünüş (C) və yaşıl “ideal maşın” kölgəsi istinad nöqtələrinin harada olduğunu başa düşməyə kömək edir. Sonra onları söndürüb yalnız güzgülərlə məşq edin.',
    ],
  },
  {
    title: 'Ümumi qaydalar və nəzakət',
    items: [
      'Piyada keçidinin, yol ayrıcının, avtobus dayanacağının yaxınlığında, səki üzərində və nişanla qadağan olunan yerlərdə park etməyin (dəqiq məsafələr üçün Yol Hərəkəti Qaydalarına baxın).',
      'Paralel parkda bordürə 20–30 sm-dən uzaq durmayın, qonşu maşınların çıxmasına yer saxlayın.',
      'Park etdikdən sonra: P vəziyyəti (mexanikidə 1-ci və ya R ötürmə), əl əyləci, sükanı düzəldin, qapını açmazdan əvvəl güzgüdə velosipedçiyə baxın.',
      'Tələsməyin. Səhv etdinizsə — dayanın, bir az geri/irəli gedib düzəldin. Bir əlavə manevr toqquşmadan yaxşıdır.',
    ],
  },
];

// ---------- Səviyyələr ----------

function level1() {
  const target = { x: 0, z: 6, h: 0, w: 2.6, l: 5, strict: true };
  const start = { x: -16, z: -2.0, h: P / 2 };
  const turnAt = { x: -R - 0.3, z: -2.0, h: P / 2 };
  const arcEnd = arc(turnAt, -1, 1, -P / 2);
  const final = { x: arcEnd.x, z: 4.6, h: 0 };
  return {
    id: 1,
    name: 'Düz park (irəli ilə)',
    short: 'Perpendikulyar yerə irəli ilə girin',
    layout: perpLot({ seed: 11, targetH: 0 }),
    start,
    target,
    par: { time: 60, moves: 1 },
    signal: 'R',
    theory: [
      'Bu ən sadə, amma ən çox toqquşma olan manevrdir: sağdakı maşının küncünə arxa təkər, soldakına isə ön bamper yaxınlaşır.',
      'Koridorun əks tərəfi ilə gedin — park yerlərindən uzaq (təxminən 4–5 m). Nə qədər geniş dönsəniz, bir o qədər asan girərsiniz.',
      'Sağa siqnal verin. Hədəf yerin birinci xətti sağ güzgünüzdən təxminən 1 m qabaqda olanda dayanın.',
      'Sükanı tam sağa çevirin (bir yarım dövrəyə yaxın) və yavaş irəli gedin. Sol güzgüdə soldakı maşının ön küncünə, sağ güzgüdə sağdakı maşına baxın.',
      'Maşın xətlərə paralel olanda sükanı düzəldin və düz irəli gedin. Öndəki bordür kapotun altında itəndə — dayanın.',
      'Səhv: çox tez dönmək (arxa təkər sağdakı maşına dəyir) və ya çox gec dönmək (maşın xəttin üstünə çıxır). Lazım olsa geri çəkilib düzəldin.',
    ],
    coach: [
      { check: 'gear', to: 'D', text: 'Əyləci basıb saxlayın və ötürməni D vəziyyətinə keçirin.' },
      { check: 'signal', to: 'R', text: 'Sağa dönmə siqnalını yandırın (X düyməsi). Güzgülərə baxın.' },
      {
        check: 'goto', axis: 'x', to: turnAt.x, sign: 1, tol: 0.25, ghost: turnAt,
        text: 'Əyləci azca buraxın və koridorun sol tərəfi ilə yavaş irəli gedin.',
        hint: 'İstinad: hədəf yerin birinci xətti sağ güzgünüzdən ~1 m qabaqda olanda dayanın.',
      },
      { check: 'steer', to: 1, text: 'Dayanmış halda sükanı TAM SAĞA çevirin (~1¼ dövrə).' },
      {
        check: 'turn', to: 0, sign: -1, tol: 2, ghost: arcEnd,
        text: 'Yavaş irəli gedin. Sol güzgüdə soldakı maşının küncünü izləyin.',
        hint: 'Maşın xətlərə paralel olanda dayanın.',
      },
      { check: 'steer', to: 0, text: 'Sükanı düzəldin — təkərlər düz olsun.' },
      {
        check: 'goto', axis: 'z', to: final.z, sign: 1, tol: 0.2, ghost: final,
        text: 'Düz irəli gedin.',
        hint: 'Öndəki bordür kapotun altında itəndə (ön sensor tez-tez səslənəndə) dayanın.',
      },
      { check: 'park', text: 'Ötürməni P-yə keçirin və siqnalı söndürün. Hazırdır!' },
    ],
  };
}

function level2() {
  const target = { x: 0, z: 6, h: P, w: 2.6, l: 5, strict: true };
  const start = { x: -16, z: 1.4, h: P / 2 };
  const stopAt = { x: R, z: 1.4, h: P / 2 };
  const arcEnd = arc(stopAt, -1, -1, P / 2);
  const final = { x: arcEnd.x, z: 7.4, h: P };
  return {
    id: 2,
    name: 'Arxa ilə park',
    short: 'Perpendikulyar yerə arxa ilə girin',
    layout: perpLot({ seed: 23, targetH: P }),
    start,
    target,
    par: { time: 75, moves: 2 },
    signal: 'R',
    theory: [
      'Arxa ilə park daha asandır və daha təhlükəsizdir: dar yerə arxa ilə girib, çıxanda yolu yaxşı görürsünüz. Maşının ön təkərləri dönür, ona görə geri gedəndə maşın çox kəskin döner.',
      'Park yerlərinə ~1–1.5 m məsafədə, onlara paralel yavaş irəli gedin. Hədəf yeri keçin.',
      'İstinad: hədəfdən SONRAKI yerin uzaq xətti arxa təkərinizin (arxa qapının) bərabərinə gələndə dayanın.',
      'R-ə keçin, sükanı tam sağa çevirin. Geri gedərkən sağ güzgüdə sağdakı maşının küncünü, sol güzgüdə sol xətti izləyin. Çiyin üstündən də baxın.',
      'Maşın hər iki güzgüdə xətlərə paralel görünəndə sükanı düzəldin və düz geri gedin.',
      'Arxa bordürə 20–30 sm qalanda (sensor fasiləsiz səslənməyə başlayanda) dayanın.',
      'Səhv: tez dönmək — sağ arxa künc qonşu maşına dəyir; gec dönmək — sol xəttə çıxırsınız. Düzəltmək üçün bir az irəli gedib sükanı əks tərəfə çevirin.',
    ],
    coach: [
      { check: 'gear', to: 'D', text: 'Əyləci basıb ötürməni D-yə keçirin.' },
      { check: 'signal', to: 'R', text: 'Sağa siqnal verin (X).' },
      {
        check: 'goto', axis: 'x', to: stopAt.x, sign: 1, tol: 0.25, ghost: stopAt,
        text: 'Park yerlərinə ~1.2 m məsafədə yavaş irəli gedin, hədəf yeri keçin.',
        hint: 'İstinad: hədəfdən sonrakı yerin uzaq xətti arxa təkərinizin bərabərinə gələndə dayanın.',
      },
      { check: 'gear', to: 'R', text: 'Əyləci saxlayın və R-ə keçin. Arxa kamera açılır.' },
      { check: 'steer', to: 1, text: 'Sükanı TAM SAĞA çevirin.' },
      {
        check: 'turn', to: P, sign: 1, tol: 2, ghost: arcEnd,
        text: 'Yavaş geri gedin. Sağ güzgüdə sağdakı maşının küncünü, sol güzgüdə xətti izləyin.',
        hint: 'Maşın xətlərə paralel olanda dayanın.',
      },
      { check: 'steer', to: 0, text: 'Sükanı düzəldin.' },
      {
        check: 'goto', axis: 'z', to: final.z, sign: 1, tol: 0.2, ghost: final,
        text: 'Düz geri gedin.',
        hint: 'Arxa bordürə ~30 sm qalanda (sensor çox tez səslənəndə) dayanın.',
      },
      { check: 'park', text: 'P-yə keçin, siqnalı söndürün. Əla!' },
    ],
  };
}

function level3() {
  const r = rng(37);
  const gap = 7.0, curbZ = 4.0, carZ = 2.9;
  const L = { kind: 'street', lines: [], dashed: [], cars: [], curbs: [], boxes: [], trees: [], grass: [], sidewalks: [], arrows: [] };
  L.curbs.push([-60, curbZ + 0.15, 60, curbZ + 0.15], [-60, -curbZ - 0.15, 60, -curbZ - 0.15]);
  L.sidewalks.push({ cx: 0, cz: curbZ + 2.3, w: 120, l: 4 }, { cx: 0, cz: -curbZ - 2.3, w: 120, l: 4 });
  L.dashed.push([-60, 0, 60, 0]);
  L.lines.push([-60, 1.8, -gap / 2, 1.8], [gap / 2, 1.8, 60, 1.8]);
  L.lines.push([-gap / 2, 1.8, -gap / 2, curbZ], [gap / 2, 1.8, gap / 2, curbZ]);
  // qabaqda və arxada maşınlar
  const front = gap / 2 + 2.25, rear = -gap / 2 - 2.25;
  L.cars.push(parkedCar(r, front, carZ, P / 2), parkedCar(r, rear, carZ, P / 2));
  L.cars[0].x = front; L.cars[0].z = carZ; L.cars[0].h = P / 2;
  L.cars[1].x = rear; L.cars[1].z = carZ; L.cars[1].h = P / 2;
  for (const x of [front + 6.2, front + 12.6, rear - 6.3, rear - 13]) L.cars.push(parkedCar(r, x, carZ, P / 2));
  for (const x of [-20, -8, 5, 18]) L.cars.push(parkedCar(r, x, -carZ, -P / 2));
  for (let x = -40; x <= 40; x += 10) L.trees.push([x + 3, curbZ + 3.4], [x - 2, -curbZ - 3.4]);
  for (let i = -4; i <= 4; i++) {
    L.boxes.push({ cx: i * 13, cz: curbZ + 10, h: 0, hw: 6, hl: 5, height: 9 + ((i * 7) % 5) * 3, color: [0xd8cbb3, 0xc9b79c, 0xb9c4cc, 0xe0d6c4][(i + 8) % 4], type: 'building' });
    L.boxes.push({ cx: i * 13 + 6, cz: -curbZ - 10, h: 0, hw: 6, hl: 5, height: 10 + ((i * 5) % 4) * 3, color: [0xc7a98c, 0xd8cbb3, 0xa9b8c4][(i + 9) % 3], type: 'building' });
  }

  const target = { x: 0, z: (1.8 + curbZ) / 2, h: P / 2, w: curbZ - 1.8, l: gap, strict: true, curbZ };
  const za = carZ - 0.9 - 0.8 - 0.9;
  const start = { x: -14, z: za, h: P / 2 };
  const stopAt = { x: gap / 2 + 0.45, z: za, h: P / 2 };
  const a1 = arc(stopAt, -1, -1, 48 * DEG);
  const a2 = arc(a1, 1, -1, -48 * DEG);
  const final = { x: -CAR.centerOffset, z: a2.z, h: P / 2 };
  return {
    id: 3,
    name: 'Paralel park',
    short: 'İki maşının arasına, bordür boyunca',
    layout: L,
    start,
    target,
    par: { time: 90, moves: 3 },
    signal: 'R',
    theory: [
      'Paralel park imtahanda ən çox qorxulan manevrdir, amma dəqiq istinad nöqtələri ilə hər dəfə eyni alınır. Boşluq maşınınızdan ən azı 1.5 m uzun olmalıdır.',
      '1) Siqnal verin. Qabaqdakı maşına paralel, ondan təxminən 0.8–1 m aralı dayanın, arxa bamperiniz onun arxa bamperini ~0.5 m keçsin.',
      '2) R-ə keçin, ətrafa və çiyin üstündən baxın. Sükanı TAM SAĞA çevirib yavaş geri gedin.',
      '3) Maşın təxminən 45° bucaq alanda dayanın. İstinad: sol yan güzgüdə arxadakı maşının bütün ön hissəsi (hər iki farası) görünür.',
      '4) Sükanı TAM SOLA çevirin və yavaş geri gedin. Sağ ön küncünüz qabaqdakı maşının arxasından keçir — sağ tərəfə nəzər salın.',
      '5) Maşın bordürə paralel olanda dayanın. Lazım olsa D-yə keçib maşını iki maşının ortasına çəkin, sükanı düzəldin.',
      'Bordürə 20–30 sm qalmalıdır. Bordürə toxunmaq imtahanda səhv sayılır. Sağ güzgünü bir az aşağı əymək bordürü görməyə kömək edir.',
    ],
    coach: [
      { check: 'gear', to: 'D', text: 'Əyləci basıb D-yə keçin.' },
      { check: 'signal', to: 'R', text: 'Sağa siqnal verin (X) — arxadakılar niyyətinizi bilsin.' },
      {
        check: 'goto', axis: 'x', to: stopAt.x, sign: 1, tol: 0.25, ghost: stopAt,
        text: 'Qabaqdakı maşına paralel, ondan ~0.8 m aralı yavaş irəli gedin.',
        hint: 'İstinad: arxa bamperiniz onun arxa bamperini ~0.5 m keçəndə dayanın.',
      },
      { check: 'gear', to: 'R', text: 'R-ə keçin. Güzgülərə və çiyin üstündən baxın (B).' },
      { check: 'steer', to: 1, text: 'Sükanı TAM SAĞA çevirin.' },
      {
        check: 'turn', to: P / 2 + 48 * DEG, sign: 1, tol: 2, ghost: a1,
        text: 'Yavaş geri gedin.',
        hint: 'Maşın ~45° olanda dayanın: sol güzgüdə arxadakı maşının hər iki farası görünür.',
      },
      { check: 'steer', to: -1, text: 'Sükanı TAM SOLA çevirin.' },
      {
        check: 'turn', to: P / 2, sign: -1, tol: 2, ghost: a2,
        text: 'Yavaş geri gedin. Sağ ön künc qabaqdakı maşının arxasından keçir.',
        hint: 'Maşın bordürə paralel olanda dayanın.',
      },
      { check: 'gear', to: 'D', text: 'D-yə keçin — maşını boşluğun ortasına çəkəcəyik.' },
      { check: 'steer', to: 0, text: 'Sükanı düzəldin.' },
      {
        check: 'goto', axis: 'x', to: final.x, sign: 1, tol: 0.3, ghost: final,
        text: 'Bir az irəli gedin.',
        hint: 'Qabaq və arxa məsafə təxminən bərabər olanda dayanın.',
      },
      { check: 'park', text: 'P-yə keçin, siqnalı söndürün. Bordürə məsafəni yoxlayın!' },
    ],
  };
}

function level4() {
  const r = rng(53);
  const hs = P / 6; // yer 60° bucaq altında
  const f = [Math.sin(hs), Math.cos(hs)];
  const sp = 2.5 / Math.sin(P / 3);
  const D = 5;
  const L = { kind: 'lot', lines: [], dashed: [], cars: [], curbs: [], boxes: [], trees: [], grass: [], sidewalks: [], arrows: [] };
  for (let i = -6; i <= 6; i++) {
    const xe = i * sp;
    for (const off of i === 6 ? [-sp / 2, sp / 2] : [-sp / 2]) {
      L.lines.push([xe + off, 3.5, xe + off + f[0] * D, 3.5 + f[1] * D]);
    }
    if (i === 0) continue;
    if (Math.abs(i) === 1 || r() < 0.7) {
      L.cars.push(parkedCar(r, xe + f[0] * D / 2, 3.5 + f[1] * D / 2, r() < 0.85 ? hs : hs + P));
    }
  }
  const zBack = 3.5 + f[1] * D;
  L.lines.push([-6.5 * sp, zBack, 6.5 * sp + f[0] * D, zBack]);
  L.curbs.push([-45, zBack + 0.35, 45, zBack + 0.35]);
  L.curbs.push([-45, -2.15, 45, -2.15]);
  L.grass.push({ cx: 0, cz: zBack + 4.5, w: 90, l: 8 }, { cx: 0, cz: -6.3, w: 90, l: 8 });
  L.arrows.push([-14, 0.8, P / 2], [-2, 0.8, P / 2], [10, 0.8, P / 2]);
  for (let x = -36; x <= 36; x += 8) L.trees.push([x, -5.5 - ((x / 8) % 2 ? 1 : 0)]);
  L.boxes.push(
    { cx: -8, cz: zBack + 16, h: 0, hw: 12, hl: 6, height: 10, color: 0xd8cbb3, type: 'building' },
    { cx: 16, cz: zBack + 14, h: 0, hw: 7, hl: 5, height: 15, color: 0xb9c4cc, type: 'building' },
    { cx: 0, cz: -18, h: 0, hw: 16, hl: 5, height: 7, color: 0xc7a98c, type: 'building' },
  );

  const center = { x: f[0] * D / 2, z: 3.5 + f[1] * D / 2 };
  const target = { x: center.x, z: center.z, h: hs, w: 2.5, l: D, strict: true };
  const start = { x: -18, z: 0.5, h: P / 2 };
  const tEnd = (0.5 + R * 0.5 - 3.5) / f[1];
  const turnAt = { x: f[0] * tEnd - R * Math.sin(P / 3) - 0.15, z: 0.5, h: P / 2 };
  const arcEnd = arc(turnAt, -1, 1, hs - P / 2);
  const finalT = D / 2 - CAR.centerOffset;
  const finalZ = 3.5 + f[1] * finalT;
  const final = { x: arcEnd.x + (finalZ - arcEnd.z) * Math.tan(hs), z: finalZ, h: hs };
  return {
    id: 4,
    name: 'Maili park',
    short: '60° bucaq altında yerə irəli ilə',
    layout: L,
    start,
    target,
    par: { time: 60, moves: 1 },
    signal: 'R',
    theory: [
      'Maili (çəp) yerlər adətən birtərəfli hərəkətli dayanacaqlarda olur: yerlər hərəkət istiqamətinə doğru əyilib, ona görə irəli ilə girmək çox asandır.',
      'Yalnız oxların göstərdiyi istiqamətdə hərəkət edin — maili yerə əks istiqamətdən girmək olmaz.',
      'Yerlərin girişindən 1.5–2 m aralı yavaş gedin, sağa siqnal verin.',
      'İstinad: hədəf yerin birinci xətti sağ güzgünüzün bərabərinə çatmamış (~1 m qabaqda) dönməyə başlayın.',
      'Sükanı tam sağa çevirin. Bucaq 90°-dən kiçik olduğu üçün dönmə qısadır — maşın xətlərə paralel olan kimi sükanı düzəldin.',
      'Düz irəli gedin və öndəki xəttə/bordürə ~30 sm qalanda dayanın.',
      'Çıxarkən: geri gedin, sükanı sola çevirin (arxanız hərəkət istiqamətinin əksinə dönməsin!) və arxa tərəfə diqqətlə baxın.',
    ],
    coach: [
      { check: 'gear', to: 'D', text: 'Əyləci basıb D-yə keçin.' },
      { check: 'signal', to: 'R', text: 'Sağa siqnal verin (X).' },
      {
        check: 'goto', axis: 'x', to: turnAt.x, sign: 1, tol: 0.25, ghost: turnAt,
        text: 'Yerlərin girişindən ~2 m aralı, oxlar istiqamətində yavaş irəli gedin.',
        hint: 'İstinad: hədəf yerin birinci xətti sağ güzgünüzdən ~1 m qabaqda olanda dayanın.',
      },
      { check: 'steer', to: 1, text: 'Sükanı TAM SAĞA çevirin.' },
      {
        check: 'turn', to: hs, sign: -1, tol: 2, ghost: arcEnd,
        text: 'Yavaş irəli. Maşın çəp xətlərə paralel olacaq.',
        hint: 'Xətlərə paralel olanda dayanın.',
      },
      { check: 'steer', to: 0, text: 'Sükanı düzəldin.' },
      {
        check: 'goto', axis: 'z', to: final.z, sign: 1, tol: 0.2, ghost: final,
        text: 'Düz irəli gedin.',
        hint: 'Öndəki xəttə ~30 sm qalanda dayanın.',
      },
      { check: 'park', text: 'P-yə keçin, siqnalı söndürün. Hazırdır!' },
    ],
  };
}

function level5() {
  const r = rng(71);
  const half = 3.75;
  const L = { kind: 'street', lines: [], dashed: [], cars: [], curbs: [], boxes: [], trees: [], grass: [], sidewalks: [], arrows: [] };
  L.curbs.push([-70, half + 0.15, 70, half + 0.15], [-70, -half - 0.15, 70, -half - 0.15]);
  L.sidewalks.push({ cx: 0, cz: half + 2.3, w: 140, l: 4 }, { cx: 0, cz: -half - 2.3, w: 140, l: 4 });
  L.dashed.push([-70, 0, 70, 0]);
  for (const x of [-34, -27, 26, 33]) L.cars.push(parkedCar(r, x, x < 0 ? 2.75 : -2.75, x < 0 ? P / 2 : -P / 2));
  for (let x = -50; x <= 50; x += 9) L.trees.push([x, half + 3.4], [x + 4, -half - 3.4]);
  for (let i = -4; i <= 4; i++) {
    L.boxes.push({ cx: i * 12, cz: half + 9, h: 0, hw: 5.5, hl: 4.5, height: 6 + ((i + 9) % 3) * 3, color: [0xe0d6c4, 0xc9b79c, 0xb9c4cc][(i + 9) % 3], type: 'building' });
    L.boxes.push({ cx: i * 12 + 5, cz: -half - 9, h: 0, hw: 5.5, hl: 4.5, height: 7 + ((i + 8) % 3) * 3, color: [0xd8cbb3, 0xa9b8c4, 0xc7a98c][(i + 9) % 3], type: 'building' });
  }
  // küçənin sonu — maneə (dalan)
  L.boxes.push({ cx: 44, cz: 0, h: 0, hw: 4, hl: 0.4, height: 1.1, color: 0xd23b2b, type: 'barrier' });
  L.boxes.push({ cx: -44, cz: 0, h: 0, hw: 4, hl: 0.4, height: 1.1, color: 0xd23b2b, type: 'barrier' });

  const target = { x: 0, z: -half / 2, h: -P / 2, w: half, l: 70, strict: true, angleTol: 15, zone: true };
  const start = { x: -6, z: half - 0.3 - 0.9, h: P / 2 };
  return {
    id: 5,
    name: 'Dar küçədə dönmə',
    short: '3 hərəkətlə geri dönün',
    layout: L,
    start,
    target,
    par: { time: 60, moves: 3 },
    signal: 'L',
    theory: [
      'Küçə bir hərəkətdə dönmək üçün dar olanda 3 hərəkətlə (irəli – geri – irəli) dönülür. Əvvəlcə hər iki istiqamətdə yolun boş olduğuna əmin olun.',
      '1) Sola siqnal verin, güzgülərə və sol çiyin üstündən baxın. Sükanı TAM SOLA çevirərək yavaş irəli gedin.',
      '2) Qarşı bordürə ~0.5 m qalanda dayanın. Peşəkar fənd: son metrdə sükanı sağa çevirməyə başlayın — növbəti hərəkətə hazır olursunuz.',
      '3) R-ə keçin. Sükanı TAM SAĞA çevirin, arxaya (çiyin üstündən) baxaraq yavaş geri gedin. Arxa bordürə ~0.5 m qalanda dayanın.',
      '4) D-yə keçin, sükanı TAM SOLA çevirin və irəli gedin. Maşın yeni istiqamətə düzələndə sükanı düzəldin və öz zolağınızda dayanın.',
      'Bordürə toxunmaq səhvdir. Təkərləri dayanmış halda yox, maşın azca hərəkət edərkən çevirmək təkərlər və sükan üçün daha yaxşıdır.',
    ],
    coach: [
      { check: 'signal', to: 'L', text: 'Sola siqnal verin (Z). Güzgülərə və sol çiyin üstündən baxın (yol boşdur).' },
      { check: 'gear', to: 'D', text: 'Əyləci basıb D-yə keçin.' },
      { check: 'steer', to: -1, text: 'Sükanı TAM SOLA çevirin.' },
      {
        check: 'sensor', which: 'front', below: 0.5,
        text: 'Yavaş irəli gedin — qarşı bordürə doğru.',
        hint: 'Qarşı bordürə ~0.5 m qalanda (ön sensor çox tez səslənəndə) dayanın.',
      },
      { check: 'gear', to: 'R', text: 'R-ə keçin.' },
      { check: 'steer', to: 1, text: 'Sükanı TAM SAĞA çevirin.' },
      {
        check: 'sensor', which: 'rear', below: 0.5,
        text: 'Çiyin üstündən baxaraq yavaş geri gedin.',
        hint: 'Arxa bordürə ~0.5 m qalanda dayanın.',
      },
      { check: 'gear', to: 'D', text: 'D-yə keçin.' },
      { check: 'steer', to: -1, text: 'Sükanı TAM SOLA çevirin.' },
      {
        check: 'turn', to: -P / 2, sign: 1, tol: 4,
        text: 'Yavaş irəli gedin, maşın yeni istiqamətə dönür.',
        hint: 'Maşın yola paralel olanda sükanı düzəltməyə hazırlaşın.',
      },
      { check: 'steer', to: 0, text: 'Sükanı düzəldin və bir az irəli gedin.' },
      { check: 'park', text: 'Dayanın, P-yə keçin və siqnalı söndürün. Afərin!' },
    ],
  };
}

export const LEVELS = [level1(), level2(), level3(), level4(), level5()];
