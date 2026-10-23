// Səviyyələr: yalnız məlumat (Three.js-siz). world.js bunu 3D-yə çevirir, coach.js təlimatı oxuyur.
// Bucaqlar: +X istiqaməti = π/2, +Z = 0, −Z = π, −X = −π/2. Pozalar ARXA OXUN mərkəzidir.
// Ölçülər ABŞ dayanacaq standartlarına yaxındır: perpendikulyar yer 9×18 ft (2.7×5.5 m), koridor 24 ft (7.3 m).
import { CAR, DEG, PARKED, wrapAngle, collide } from './physics.js';
import { obstaclesOf } from './sim.js';

const P = Math.PI;
const R = CAR.minRadius;
const FRONT = CAR.wheelbase + CAR.frontOverhang; // arxa oxdan ön bampere
const BACK = CAR.rearOverhang; // arxa oxdan arxa bampere
const HALF_W = CAR.width / 2;

const COLORS = [0xb8bec6, 0x1d2a44, 0x8a1c1c, 0xf2f2f2, 0x2c2c2c, 0x3b5f8a, 0x6b6f3a, 0xc9a227, 0x5a5f66, 0x7a2f55, 0x274d3a];

// Təlimatçının istinad nöqtələrinin parametrləri (tests/tune-levels.mjs ilə seçilib)
export const TUNE = {
  l1: { lane: -2.2, dx: -0.15 },
  l2: { lane: 1.55, dx: 0 },
  l3: { lat: 0.8, s0: -0.45, th: 45, back: 0.8 },
  l4: { lane: 0.6, dx: -0.15 },
};

function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Tam sükanla qövs: k = +1 sol, −1 sağ; bucaq dh dəyişənə qədər
function arc(pose, k, dh) {
  let { x, z, h } = pose;
  const n = 400;
  for (let i = 0; i < n; i++) {
    const step = dh / n;
    h += step;
    const ds = (step * R) / k;
    x += Math.sin(h) * ds;
    z += Math.cos(h) * ds;
  }
  return { x, z, h: wrapAngle(pose.h + dh) };
}

// Qonşu maşınların ölçüləri (ABŞ-da yayğın: kompakt, sedan, böyük sedan, krossover — təxmini dəyərlər)
export const NEIGHBOR_SIZES = [
  { l: 4.45, w: 1.78 }, { l: 4.68, w: 1.83 }, { l: 4.8, w: 1.86 }, { l: 4.95, w: 1.88 }, { l: 5.1, w: 1.95 },
];
function parkedCar(r, x, z, h, exact = false, size = null) {
  return {
    l: size ? size.l : PARKED.length,
    w: size ? size.w : PARKED.width,
    x: exact ? x : x + (r() - 0.5) * 0.16,
    z: exact ? z : z + (r() - 0.5) * 0.16,
    h: exact ? h : h + (r() - 0.5) * 3 * DEG,
    color: COLORS[Math.floor(r() * COLORS.length)],
  };
}

function emptyLayout(kind) {
  return { kind, lines: [], dashed: [], cars: [], curbs: [], boxes: [], trees: [], grass: [], sidewalks: [], arrows: [] };
}

// Yol boyunca maşının bütün hissələri (gövdə, güzgülər) maşınlara ~8 sm-dən çox yaxınlaşmırmı?
function pathFree(L, poses, margin = 0.08) {
  const g = obstaclesOf(L).filter((o) => o.type === 'car').map((o) => ({ ...o, hw: o.hw + margin, hl: o.hl + margin }));
  return poses.every((q) => !collide(q, g));
}
function arcPoses(pose, k, dh, n = 24) {
  const out = [];
  for (let i = 0; i <= n; i++) out.push(arc(pose, k, (dh * i) / n));
  return out;
}
function linePoses(a, b, n = 10) {
  const out = [];
  for (let i = 0; i <= n; i++) out.push({ x: a.x + ((b.x - a.x) * i) / n, z: a.z + ((b.z - a.z) * i) / n, h: b.h });
  return out;
}
// Məşq variantı bir hərəkətlə fiziki mümkün deyilsə (dar yer + xəttə yaxın böyük qonşu), başqa düzülüş seçilir
const retry = (f) => (v, T) => {
  if (!v.vary) return f(v, T);
  let lv;
  for (let k = 0; k < 12; k++) { lv = f({ ...v, seed: (v.seed || 1) + k * 7919 }, T); if (lv.feasible) return lv; }
  return lv;
};
const DX_TRY = [0, 0.15, -0.15, 0.3, -0.3, 0.45];

// ---------- Perpendikulyar dayanacaq ----------
const LOT = { W: 2.7, D: 5.5, A: 3.65 }; // yer eni, dərinliyi, koridorun yarısı
// Məşqdə qonşu maşının ölçüsü təsadüfi seçilir (Öyrənmə/İmtahan sabit 4.8 × 1.86)
const sizeOf = (r, vary) => (vary ? NEIGHBOR_SIZES[Math.floor(r() * NEIGHBOR_SIZES.length)] : null);

function perpLot({ seed, targetIdx, W = LOT.W, vary = false }) {
  const r = rng(seed);
  const { D, A } = LOT;
  const L = emptyLayout('lot');
  for (let i = -7; i <= 7; i++) {
    const x = i * W;
    for (const side of [1, -1]) {
      const z0 = A * side, z1 = (A + D) * side;
      L.lines.push([x - W / 2, z0, x - W / 2, z1]);
      if (i === 7) L.lines.push([x + W / 2, z0, x + W / 2, z1]);
      if (side > 0 && i === targetIdx) continue; // hədəf yer
      const near = side > 0 && Math.abs(i - targetIdx) === 1;
      if (near || r() < 0.72) {
        const h = r() < 0.6 ? (side > 0 ? 0 : P) : side > 0 ? P : 0;
        const sz = sizeOf(r, vary);
        // qonşu maşın yerin içində, amma xəttə yaxın da dura bilər (məşqdə)
        const off = vary && near ? (r() - 0.5) * Math.max(0, W - (sz?.w || PARKED.width) - 0.25) : 0;
        L.cars.push(parkedCar(r, x + off, (A + D / 2) * side, h, false, sz));
      }
    }
  }
  const xEnd = 7 * W + W / 2;
  L.lines.push([-xEnd, A + D, xEnd, A + D], [-xEnd, -A - D, xEnd, -A - D]);
  L.dashed.push([-xEnd - 6, 0, xEnd + 6, 0]);
  L.curbs.push([-xEnd - 8, A + D + 0.35, xEnd + 8, A + D + 0.35], [-xEnd - 8, -A - D - 0.35, xEnd + 8, -A - D - 0.35]);
  L.grass.push({ cx: 0, cz: A + D + 4.5, w: 90, l: 8 }, { cx: 0, cz: -A - D - 4.5, w: 90, l: 8 });
  L.arrows.push([-13, -1.8, P / 2], [6, -1.8, P / 2], [-6, 1.8, -P / 2], [13, 1.8, -P / 2]);
  L.boxes.push(
    { cx: -10, cz: 26, h: 0, hw: 9, hl: 5, height: 12, color: 0xd8cbb3, type: 'building' },
    { cx: 13, cz: 28, h: 0, hw: 10, hl: 6, height: 18, color: 0xa9b8c4, type: 'building' },
    { cx: 0, cz: -28, h: 0, hw: 15, hl: 6, height: 9, color: 0xc7a98c, type: 'building' },
    { cx: -34, cz: 0, h: 0, hw: 4, hl: 10, height: 6, color: 0xbfbfbf, type: 'building' },
  );
  for (const [x, z] of [[-14, 13.5], [-6, 14.5], [3, 13.5], [11, 15], [-12, -13.5], [-2, -14.5], [8, -13.5], [16, -14.5]]) L.trees.push([x, z]);
  for (const x of [-13.5, 0, 13.5]) L.boxes.push({ cx: x, cz: A + D + 1.1, h: 0, hw: 0.12, hl: 0.12, height: 6, color: 0x555a60, type: 'pole' });
  return L;
}

// ---------- Ümumi qaydalar (Real həyatda park) ----------

export const GENERAL_LESSONS = [
  {
    title: 'Hazırlıq: oturacaq və güzgülər',
    items: [
      'Oturacağı elə qurun ki, əyləci sona qədər basanda dizləriniz azca bükülü qalsın.',
      'Sükanı iki əllə “saat 9 və 3” vəziyyətində tutun. Park zamanı əlləri dəyişərək çevirmək rahatdır.',
      'Yan güzgülər: maşının yan tərəfi güzgünün daxili kənarında az (təxminən 1/4) görünsün, üfüq ortada olsun.',
      'Salon güzgüsü: arxa şüşə bütöv görünməlidir.',
    ],
  },
  {
    title: 'Sürət nəzarəti',
    items: [
      'Avtomat qutulu maşın D və ya R-də qazsız da yavaş “sürünür” (təxminən 4–5 km/saat). Park zamanı qaza demək olar ki, basmayın.',
      'Sürəti əyləclə tənzimləyin: azca buraxın — maşın yavaş gedir, basın — dayanır.',
      'Qayda: maşın yavaş, sükan isə cəld çevrilməlidir.',
      'D ↔ R yalnız maşın TAM dayananda, əyləc basılı halda dəyişilir.',
    ],
  },
  {
    title: 'Müşahidə: güzgülər, kor nöqtə, çiyin üstündən baxış',
    items: [
      'Manevrdən əvvəl üç güzgüyə baxın və siqnal verin.',
      'Kor nöqtəni yoxlamaq üçün başınızı çevirib çiyin üstündən baxın (simulyatorda B / 👀).',
      'Geri gedərkən yalnız kameraya güvənməyin: güzgülər + çiyin üstündən baxış + kamera.',
      '2023 Elantra SEL-də park sensorları standart deyil (yalnız əlavə paketlə gəlir). Ona görə simulyatorda sensor “köməkçi” kimi ayrıca açılır.',
    ],
  },
  {
    title: 'İstinad nöqtələri nədir?',
    items: [
      'Sürücü maşının künclərini görmür, ona görə “istinad nöqtələri” istifadə olunur: “çiyniniz xəttə çatanda”, “xətt güzgünün altında itəndə” və s.',
      'Bu simulyatordakı istinad nöqtələri 2023 Elantra-nın ölçülərinə (4.68 m uzunluq, 2.72 m baza, 5.4 m dönmə radiusu) görə hesablanıb. Başqa maşında bir az fərqli olacaq.',
      'Real maşında ilk dəfə boş dayanacaqda, konuslarla yoxlayın.',
    ],
  },
  {
    title: 'Ümumi qaydalar və nəzakət',
    items: [
      'Piyada keçidinin, yol ayrıcının, yanğın kranının, avtobus dayanacağının yaxınlığında və nişanla qadağan olunan yerlərdə park etməyin (dəqiq məsafələr ştat/ölkə qaydalarına görə dəyişir).',
      'Paralel parkda bordürə 30 sm-dən (≈12 düym) uzaq durmayın.',
      'Park etdikdən sonra: P, əl əyləci, sükanı düzəldin; qapını açmazdan əvvəl güzgüdə velosipedçiyə baxın.',
      'Səhv etdinizsə — dayanın, bir az geri/irəli gedib düzəldin. Bir əlavə manevr toqquşmadan yaxşıdır.',
    ],
  },
];

// ---------- Səviyyələr ----------
// v = { seed, shift, startJitter } — Məşq rejimində dəyişir; Öyrənmə və İmtahanda sabitdir.

function level1once(v, T = TUNE.l1) {
  const ti = v.shift || 0;
  const W = v.W || LOT.W;
  const tx = ti * W;
  const lane = T.lane + (v.laneOff || 0);
  const target = { x: tx, z: LOT.A + LOT.D / 2, h: 0, w: W, l: LOT.D, strict: true };
  const start = { x: tx - 16 + (v.startJitter || 0), z: lane, h: P / 2 };
  const layout = perpLot({ seed: v.seed ?? 11, targetIdx: ti, W, vary: !!v.vary });
  // dönmə nöqtəsi: qonşu maşınlara toxunmayan ilk variant (Öyrənmədə sabit)
  let turnAt, arcEnd, final, feasible = false;
  for (const d of v.vary ? DX_TRY : [0]) {
    turnAt = { x: tx - R + T.dx + d, z: lane, h: P / 2 };
    arcEnd = arc(turnAt, -1, -P / 2);
    final = { x: arcEnd.x, z: LOT.A + LOT.D - 0.3 - FRONT, h: 0 };
    if (pathFree(layout, [...arcPoses(turnAt, -1, -P / 2), ...linePoses(arcEnd, final)])) { feasible = true; break; }
  }
  if (!feasible) { turnAt = { x: tx - R + T.dx, z: lane, h: P / 2 }; arcEnd = arc(turnAt, -1, -P / 2); final = { x: arcEnd.x, z: LOT.A + LOT.D - 0.3 - FRONT, h: 0 }; }
  return {
    id: 1,
    feasible,
    name: 'Düz park (irəli ilə)',
    short: 'Perpendikulyar yerə irəli ilə',
    layout,
    start, target,
    par: { time: 60, moves: 1 },
    signal: 'R',
    theory: [
      'Koridorun əks tərəfi ilə gedin — park yerlərindən uzaq. Nə qədər geniş dönsəniz, bir o qədər asan girərsiniz.',
      'Sağa siqnal verin. Hədəf yerin birinci xətti sağ güzgünüzdən təxminən 1 m qabaqda olanda dayanın.',
      'Sükanı tam sağa çevirin (≈1¼ dövrə) və yavaş irəli gedin. Sol güzgüdə soldakı maşının ön küncünü izləyin.',
      'Maşın xətlərə paralel olanda sükanı düzəldin, düz irəli gedin. Öndəki bordür kapotun altında itəndə dayanın.',
      'Səhv: tez dönmək — arxa təkər sağdakı maşına yaxınlaşır; gec dönmək — xəttin üstünə çıxırsınız. Lazım olsa geri çəkilib düzəldin.',
    ],
    coach: [
      { check: 'gear', to: 'D', text: 'Əyləc + D' },
      { check: 'signal', to: 'R', text: 'Sağa siqnal (X)' },
      { check: 'goto', axis: 'x', to: turnAt.x, sign: 1, tol: 0.25, ghost: turnAt, text: 'Yavaş irəli, koridorun sol tərəfi ilə', hint: 'Hədəf yerin 1-ci xətti sağ güzgüdən ~1 m qabaqda' },
      { check: 'steer', to: 1, text: 'Sükan tam SAĞA' },
      { check: 'turn', to: 0, sign: -1, tol: 2, ghost: arcEnd, text: 'Yavaş irəli', hint: 'Xətlərə paralel olanda dayanın' },
      { check: 'steer', to: 0, text: 'Sükanı düzəldin' },
      { check: 'goto', axis: 'z', to: final.z, sign: 1, tol: 0.2, ghost: final, text: 'Düz irəli', hint: 'Bordür kapotun altında itəndə dayanın' },
      { check: 'park', text: 'P və siqnalı söndürün' },
    ],
  };
}

function level2once(v, T = TUNE.l2) {
  const ti = v.shift || 0;
  const W = v.W || LOT.W;
  const tx = ti * W;
  const lane = T.lane + (v.laneOff || 0);
  const target = { x: tx, z: LOT.A + LOT.D / 2, h: P, w: W, l: LOT.D, strict: true };
  const start = { x: tx - 16 + (v.startJitter || 0), z: lane, h: P / 2 };
  // geri dönmə qövsü: arxa ox R radiusla lane-dən yerin mərkəzinə; lane dəyişəndə dayanma nöqtəsi də dəyişir
  const layout = perpLot({ seed: v.seed ?? 23, targetIdx: ti, W, vary: !!v.vary });
  let stopAt, arcEnd, final, feasible = false;
  for (const d of v.vary ? DX_TRY : [0]) {
    stopAt = { x: tx + R + T.dx + d, z: lane, h: P / 2 };
    arcEnd = arc(stopAt, -1, P / 2);
    final = { x: arcEnd.x, z: LOT.A + LOT.D - 0.3 - BACK, h: P };
    if (pathFree(layout, [...arcPoses(stopAt, -1, P / 2), ...linePoses(arcEnd, final)])) { feasible = true; break; }
  }
  if (!feasible) { stopAt = { x: tx + R + T.dx, z: lane, h: P / 2 }; arcEnd = arc(stopAt, -1, P / 2); final = { x: arcEnd.x, z: LOT.A + LOT.D - 0.3 - BACK, h: P }; }
  return {
    id: 2,
    feasible,
    name: 'Arxa ilə park',
    short: 'Perpendikulyar yerə arxa ilə',
    layout,
    start, target,
    par: { time: 75, moves: 2 },
    signal: 'R',
    theory: [
      'Arxa ilə park daha təhlükəsizdir: çıxanda yolu yaxşı görürsünüz. ABŞ-da bir çox dayanacaqda bu tövsiyə olunur.',
      'Yerlərə ~1–1.5 m məsafədə, paralel yavaş irəli gedin və hədəf yeri keçin.',
      'İstinad: hədəfdən SONRAKI yerin uzaq xətti arxa təkərinizin (arxa qapının) bərabərinə gələndə dayanın.',
      'R, sükan tam sağa. Geri gedərkən sağ güzgüdə sağdakı maşının küncünü, sol güzgüdə xətti izləyin. Çiyin üstündən baxın.',
      'Maşın hər iki güzgüdə xətlərə paralel görünəndə sükanı düzəldin, düz geri gedin. Arxa bordürə ~30 sm qalanda dayanın.',
    ],
    coach: [
      { check: 'gear', to: 'D', text: 'Əyləc + D' },
      { check: 'signal', to: 'R', text: 'Sağa siqnal (X)' },
      { check: 'goto', axis: 'x', to: stopAt.x, sign: 1, tol: 0.25, ghost: stopAt, text: 'Yerlərə ~1.2 m məsafədə irəli', hint: 'Sonrakı yerin uzaq xətti arxa təkərin bərabərində' },
      { check: 'gear', to: 'R', text: 'Əyləc + R' },
      { check: 'steer', to: 1, text: 'Sükan tam SAĞA' },
      { check: 'turn', to: P, sign: 1, tol: 2, ghost: arcEnd, text: 'Yavaş geri, güzgülərə baxın', hint: 'Xətlərə paralel olanda dayanın' },
      { check: 'steer', to: 0, text: 'Sükanı düzəldin' },
      { check: 'goto', axis: 'z', to: final.z, sign: 1, tol: 0.2, ghost: final, text: 'Düz geri', hint: 'Arxa bordürə ~30 sm' },
      { check: 'park', text: 'P və siqnalı söndürün' },
    ],
  };
}

function level3once(v, T = TUNE.l3) {
  const r = rng(v.seed ?? 37);
  const ox = v.shift ? v.shift * 9 : 0; // Məşqdə boşluq küçə boyu yerini dəyişir
  const gap = v.gap || T.gap || 7.3, curbZ = 5.5; // 24 ft yer; küçə 11 m (36 ft): 2 zolaq + hər tərəfdə park zolağı
  const laneZ = curbZ - 2.45; // park zolağının xətti (8 ft)
  const carZ = curbZ - 0.2 - PARKED.width / 2;
  const L = emptyLayout('street');
  L.curbs.push([-70, curbZ + 0.15, 70, curbZ + 0.15], [-70, -curbZ - 0.15, 70, -curbZ - 0.15]);
  L.sidewalks.push({ cx: 0, cz: curbZ + 2.3, w: 140, l: 4 }, { cx: 0, cz: -curbZ - 2.3, w: 140, l: 4 });
  L.dashed.push([-70, 0, 70, 0]);
  L.lines.push([-70, laneZ, ox - gap / 2, laneZ], [ox + gap / 2, laneZ, 70, laneZ]);
  L.lines.push([ox - gap / 2, laneZ, ox - gap / 2, curbZ], [ox + gap / 2, laneZ, ox + gap / 2, curbZ]);
  const fs = sizeOf(r, v.vary) || { l: PARKED.length, w: PARKED.width }, rs = sizeOf(r, v.vary) || { l: PARKED.length, w: PARKED.width };
  const front = ox + gap / 2 + fs.l / 2, rear = ox - gap / 2 - rs.l / 2;
  // qabaqdakı maşının bordürdən məsafəsi də dəyişir (məşqdə)
  const fz = curbZ - 0.2 - (v.vary ? r() * 0.25 : 0) - fs.w / 2;
  L.cars.push(parkedCar(r, front, fz, P / 2, true, fs), parkedCar(r, rear, curbZ - 0.2 - rs.w / 2, P / 2, true, rs));
  for (const dx of [6.4, 12.9]) L.cars.push(parkedCar(r, front + dx, carZ, P / 2), parkedCar(r, rear - dx, carZ, P / 2));
  for (const x of [-20, -8, 5, 18]) L.cars.push(parkedCar(r, x, -carZ, -P / 2));
  for (let x = -40; x <= 40; x += 10) L.trees.push([x + 3, curbZ + 3.4], [x - 2, -curbZ - 3.4]);
  for (let i = -4; i <= 4; i++) {
    L.boxes.push({ cx: i * 13, cz: curbZ + 10, h: 0, hw: 6, hl: 5, height: 9 + ((((i * 7) % 5) + 5) % 5) * 3, color: [0xd8cbb3, 0xc9b79c, 0xb9c4cc, 0xe0d6c4][(i + 8) % 4], type: 'building' });
    L.boxes.push({ cx: i * 13 + 6, cz: -curbZ - 10, h: 0, hw: 6, hl: 5, height: 10 + ((((i * 5) % 4) + 4) % 4) * 3, color: [0xc7a98c, 0xd8cbb3, 0xa9b8c4][(i + 9) % 3], type: 'building' });
  }

  const target = { x: ox, z: (laneZ + curbZ) / 2, h: P / 2, w: curbZ - laneZ, l: gap, strict: true, curbZ };
  const lat = T.lat + (v.latOff || 0);
  const za = fz - fs.w / 2 - lat - HALF_W;
  const start = { x: ox - 16 + (v.startJitter || 0), z: za, h: P / 2 };
  // Yol bu boşluğun öz həndəsəsindən hesablanır (sabit əzbər hərəkət deyil):
  // tam sağ qövs (θ) → düz geri (b) → tam sol qövs (θ); son mövqe bordürdən ~22 sm, arxadakı maşından ~m.
  const zf = curbZ - 0.22 - HALF_W;
  const plan = (th, b, xr) => {
    const s0 = { x: 0, z: za, h: P / 2 };
    const a1r = arc(s0, -1, th);
    const b1r = { x: a1r.x - Math.sin(a1r.h) * b, z: a1r.z - Math.cos(a1r.h) * b, h: a1r.h };
    const a2r = arc(b1r, 1, -th);
    const dx = xr - a2r.x;
    const sh = (q) => ({ x: q.x + dx, z: q.z, h: q.h });
    return { stopAt: sh(s0), a1: sh(a1r), b1: sh(b1r), a2: sh(a2r), th, b };
  };
  const solveB = (th, xr) => {
    const p0 = plan(th, 0, xr), p1 = plan(th, 1, xr);
    return (zf - p0.a2.z) / (p1.a2.z - p0.a2.z);
  };
  const obs = obstaclesOf(L).filter((o) => o.type === 'car');
  const pathFree = (pl) => {
    // qövs və düz hissə boyunca maşının bütün hissələri yoxlanılır
    const pts = [];
    for (let i = 0; i <= 24; i++) pts.push(arc(pl.stopAt, -1, (pl.th * i) / 24));
    for (let i = 0; i <= 8; i++) { const t = (pl.b * i) / 8; pts.push({ x: pl.a1.x - Math.sin(pl.a1.h) * t, z: pl.a1.z - Math.cos(pl.a1.h) * t, h: pl.a1.h }); }
    for (let i = 0; i <= 24; i++) pts.push(arc(pl.b1, 1, (-pl.th * i) / 24));
    const grow = (o) => ({ ...o, hw: o.hw + 0.08, hl: o.hl + 0.08 }); // ~8 sm ehtiyat
    const g = obs.map(grow);
    return pts.every((q) => !collide(q, g));
  };
  let best = null;
  for (const m of [0.45, 0.65, 0.85, 0.3]) {
    const xr = ox - gap / 2 + m + BACK;
    for (const thd of [45, 40, 50, 35, 55]) {
      let th = thd * DEG, b = solveB(th, xr);
      if (b < 0) {
        // yan məsafə azdır: düz hissəsiz, bucağı kiçildirik
        let lo = 10 * DEG, hi = th;
        for (let k = 0; k < 30; k++) { const mid = (lo + hi) / 2; if (solveB(mid, xr) < 0) hi = mid; else lo = mid; }
        th = lo; b = 0;
      }
      const pl = plan(th, b, xr);
      if (pathFree(pl)) { best = pl; break; }
    }
    if (best) break;
  }
  const feasible = !!best;
  if (!best) best = plan(T.th * DEG, Math.max(0, solveB(T.th * DEG, ox - gap / 2 + 0.6 + BACK)), ox - gap / 2 + 0.6 + BACK);
  const { stopAt, a1, b1, a2 } = best;
  const thDeg = Math.round(best.th / DEG);
  const final = { x: ox - CAR.centerOffset, z: a2.z, h: P / 2 };
  // istinad: arxa təkərin qabaqdakı maşının arxa bamperinə nisbəti (bu boşluq üçün)
  const rel = stopAt.x - (front - fs.l / 2);
  const relText = Math.abs(rel) < 0.15 ? 'arxa təkəriniz onun arxa bamperinin bərabərində' : `arxa təkəriniz onun arxa bamperindən ~${Math.abs(rel).toFixed(1)} m ${rel > 0 ? 'qabaqda' : 'arxada'}`;
  return {
    id: 3,
    feasible,
    name: 'Paralel park',
    short: 'İki maşının arasına, bordür boyunca',
    layout: L,
    start, target,
    par: { time: 90, moves: 3 },
    signal: 'R',
    theory: [
      'Boşluq maşınınızdan ən azı 1.5 m uzun olmalıdır (burada 7 m, Elantra 4.68 m).',
      '1) Siqnal verin. Qabaqdakı maşına paralel, ondan ~0.8 m aralı dayanın; arxa təkəriniz onun arxa bamperinin bərabərində olsun (arxa bamperiniz ~0.8 m boşluğa tərəf çıxır).',
      '2) R, ətrafa və çiyin üstündən baxın. Sükan TAM SAĞA, yavaş geri.',
      '3) Maşın ~45° olanda dayanın. İstinad: sol yan güzgüdə arxadakı maşının hər iki farası görünür.',
      '4) Sükanı düzəldin və düz geri gedin — ön bamperiniz qabaqdakı maşının arxa bamperini keçənə qədər.',
      '5) Sükan TAM SOLA, yavaş geri. Sağ ön künc qabaqdakı maşının arxasından keçir — sağa nəzər salın.',
      '6) Bordürə paralel olanda dayanın. Lazım olsa D ilə ortaya çəkin. Bordürə 20–30 sm qalmalıdır (ABŞ-da çox yerdə 12 düym ≈ 30 sm-dən az tələb olunur).',
    ],
    coach: [
      { check: 'gear', to: 'D', text: 'Əyləc + D' },
      { check: 'signal', to: 'R', text: 'Sağa siqnal (X)' },
      { check: 'goto', axis: 'x', to: stopAt.x, sign: 1, tol: 0.25, ghost: stopAt, text: `Qabaqdakı maşına paralel, ~${lat.toFixed(1)} m aralı`, hint: `Bu boşluq üçün: ${relText}` },
      { check: 'gear', to: 'R', text: 'Əyləc + R, çiyin üstündən baxın' },
      { check: 'steer', to: 1, text: 'Sükan tam SAĞA' },
      { check: 'turn', to: a1.h, sign: 1, tol: 2, ghost: a1, text: 'Yavaş geri', hint: `~${thDeg}°: sol güzgüdə arxadakı maşın görünür, bucağı güzgüyə görə yoxlayın` },
      ...(best.b > 0.05 ? [
        { check: 'steer', to: 0, text: 'Sükanı düzəldin' },
        { check: 'goto', axis: 'z', to: b1.z, sign: 1, tol: 0.06, ghost: b1, text: 'Düz geri', hint: 'Ön bamperiniz qabaqdakı maşının arxa bamperini keçəndə' },
      ] : []),
      { check: 'steer', to: -1, text: 'Sükan tam SOLA' },
      { check: 'turn', to: P / 2, sign: -1, tol: 2, ghost: a2, text: 'Yavaş geri', hint: 'Sağ ön künc qabaqdakı maşına yaxınlaşır — sağa baxın; bordürə paralel olanda dayanın' },
      { check: 'gear', to: 'D', text: 'Əyləc + D' },
      { check: 'steer', to: 0, text: 'Sükanı düzəldin' },
      { check: 'goto', axis: 'x', to: final.x, sign: 1, tol: 0.3, ghost: final, text: 'Bir az irəli', hint: 'Qabaq və arxa məsafə bərabər' },
      { check: 'park', text: 'P və siqnalı söndürün' },
    ],
  };
}

function level4once(v, T = TUNE.l4) {
  const r = rng(v.seed ?? 53);
  const hs = P / 6; // yer 60° bucaq altında
  const f = [Math.sin(hs), Math.cos(hs)];
  const W = v.W || LOT.W, D = LOT.D;
  const sp = W / Math.sin(P / 3);
  const ti = v.shift || 0;
  const e0 = 3.5; // girişin xətti
  const L = emptyLayout('lot');
  for (let i = -7; i <= 7; i++) {
    const xe = i * sp;
    for (const off of i === 7 ? [-sp / 2, sp / 2] : [-sp / 2]) L.lines.push([xe + off, e0, xe + off + f[0] * D, e0 + f[1] * D]);
    if (i === ti) continue;
    if (Math.abs(i - ti) === 1 || r() < 0.7) L.cars.push(parkedCar(r, xe + f[0] * D / 2, e0 + f[1] * D / 2, r() < 0.85 ? hs : hs + P, false, sizeOf(r, v.vary)));
  }
  const zBack = e0 + f[1] * D;
  L.lines.push([-7.5 * sp, zBack, 7.5 * sp + f[0] * D, zBack]);
  L.curbs.push([-48, zBack + 0.45, 48, zBack + 0.45], [-48, -1.85, 48, -1.85]);
  L.grass.push({ cx: 0, cz: zBack + 4.6, w: 96, l: 8 }, { cx: 0, cz: -6.0, w: 96, l: 8 });
  L.arrows.push([-14, 0.9, P / 2], [-2, 0.9, P / 2], [10, 0.9, P / 2]);
  for (let x = -36; x <= 36; x += 8) L.trees.push([x, -5.4 - (Math.abs(x / 8) % 2)]);
  L.boxes.push(
    { cx: -8, cz: zBack + 16, h: 0, hw: 12, hl: 6, height: 10, color: 0xd8cbb3, type: 'building' },
    { cx: 16, cz: zBack + 14, h: 0, hw: 7, hl: 5, height: 15, color: 0xb9c4cc, type: 'building' },
    { cx: 0, cz: -18, h: 0, hw: 16, hl: 5, height: 7, color: 0xc7a98c, type: 'building' },
  );

  const xe0 = ti * sp;
  const center = { x: xe0 + f[0] * D / 2, z: e0 + f[1] * D / 2 };
  const target = { x: center.x, z: center.z, h: hs, w: W, l: D, strict: true };
  const lane = T.lane + (v.laneOff || 0);
  const start = { x: xe0 - 18 + (v.startJitter || 0), z: lane, h: P / 2 };
  const tEnd = (lane + R * 0.5 - e0) / f[1];
  const finalZ = zBack - 0.3 * f[1] - FRONT * f[1];
  let turnAt, arcEnd, final, feasible = false;
  const mk = (d) => {
    turnAt = { x: xe0 + f[0] * tEnd - R * Math.sin(P / 3) + T.dx + d, z: lane, h: P / 2 };
    arcEnd = arc(turnAt, -1, hs - P / 2);
    final = { x: arcEnd.x + (finalZ - arcEnd.z) * Math.tan(hs), z: finalZ, h: hs };
  };
  for (const d of v.vary ? DX_TRY : [0]) {
    mk(d);
    if (pathFree(L, [...arcPoses(turnAt, -1, hs - P / 2), ...linePoses(arcEnd, final)])) { feasible = true; break; }
  }
  if (!feasible) mk(0);
  return {
    id: 4,
    feasible,
    name: 'Maili park',
    short: '60° bucaq altında yerə irəli ilə',
    layout: L,
    start, target,
    par: { time: 60, moves: 1 },
    signal: 'R',
    theory: [
      'Maili yerlər birtərəfli hərəkətli dayanacaqlarda olur: yerlər hərəkət istiqamətinə doğru əyilib, irəli ilə girmək asandır.',
      'Yalnız oxların göstərdiyi istiqamətdə hərəkət edin.',
      'Yerlərin girişindən ~2 m aralı yavaş gedin, sağa siqnal verin.',
      'İstinad: hədəf yerin birinci xətti sağ güzgünüzdən ~1 m qabaqda olanda dönməyə başlayın.',
      'Sükan tam sağa. Dönmə qısadır — maşın xətlərə paralel olan kimi sükanı düzəldin, öndəki xəttə ~30 sm qalanda dayanın.',
    ],
    coach: [
      { check: 'gear', to: 'D', text: 'Əyləc + D' },
      { check: 'signal', to: 'R', text: 'Sağa siqnal (X)' },
      { check: 'goto', axis: 'x', to: turnAt.x, sign: 1, tol: 0.25, ghost: turnAt, text: 'Oxlar istiqamətində yavaş irəli', hint: 'Hədəf yerin 1-ci xətti sağ güzgüdən ~1 m qabaqda' },
      { check: 'steer', to: 1, text: 'Sükan tam SAĞA' },
      { check: 'turn', to: hs, sign: -1, tol: 2, ghost: arcEnd, text: 'Yavaş irəli', hint: 'Çəp xətlərə paralel olanda dayanın' },
      { check: 'steer', to: 0, text: 'Sükanı düzəldin' },
      { check: 'goto', axis: 'z', to: final.z, sign: 1, tol: 0.2, ghost: final, text: 'Düz irəli', hint: 'Öndəki xəttə ~30 sm' },
      { check: 'park', text: 'P və siqnalı söndürün' },
    ],
  };
}

function level5(v) {
  const r = rng(v.seed ?? 71);
  const half = v.half || 3.75;
  const L = emptyLayout('street');
  L.curbs.push([-70, half + 0.15, 70, half + 0.15], [-70, -half - 0.15, 70, -half - 0.15]);
  L.sidewalks.push({ cx: 0, cz: half + 2.3, w: 140, l: 4 }, { cx: 0, cz: -half - 2.3, w: 140, l: 4 });
  L.dashed.push([-70, 0, 70, 0]);
  for (const x of [-34, -27, 26, 33]) L.cars.push(parkedCar(r, x, x < 0 ? 2.75 : -2.75, x < 0 ? P / 2 : -P / 2));
  for (let x = -50; x <= 50; x += 9) L.trees.push([x, half + 3.4], [x + 4, -half - 3.4]);
  for (let i = -4; i <= 4; i++) {
    L.boxes.push({ cx: i * 12, cz: half + 9, h: 0, hw: 5.5, hl: 4.5, height: 6 + ((i + 9) % 3) * 3, color: [0xe0d6c4, 0xc9b79c, 0xb9c4cc][(i + 9) % 3], type: 'building' });
    L.boxes.push({ cx: i * 12 + 5, cz: -half - 9, h: 0, hw: 5.5, hl: 4.5, height: 7 + ((i + 8) % 3) * 3, color: [0xd8cbb3, 0xa9b8c4, 0xc7a98c][(i + 9) % 3], type: 'building' });
  }
  L.boxes.push({ cx: 44, cz: 0, h: 0, hw: 4, hl: 0.4, height: 1.1, color: 0xd23b2b, type: 'barrier' });
  L.boxes.push({ cx: -44, cz: 0, h: 0, hw: 4, hl: 0.4, height: 1.1, color: 0xd23b2b, type: 'barrier' });

  const target = { x: 0, z: -half / 2, h: -P / 2, w: half, l: 70, strict: true, angleTol: 15, zone: true };
  const start = { x: -6 + (v.startJitter || 0), z: half - 0.3 - HALF_W, h: P / 2 };
  return {
    id: 5,
    feasible: true,
    name: 'Dar küçədə dönmə',
    short: '3 hərəkətlə geri dönün (7.5 m küçə)',
    layout: L,
    start, target,
    par: { time: 60, moves: 3 },
    signal: 'L',
    theory: [
      'Elantra-nın dönmə dairəsi ~10.8 m-dir (35.4 ft), küçə isə 7.5 m — bir hərəkətdə dönmək olmur. 3 hərəkətlə dönülür (ABŞ-da “three-point turn”, yol imtahanında da soruşulur).',
      '1) Yolun hər iki istiqamətdə boş olduğuna əmin olun. Sola siqnal, sükan TAM SOLA, yavaş irəli.',
      '2) Qarşı bordürə ~0.5 m qalanda dayanın. Fənd: son metrdə sükanı sağa çevirməyə başlayın.',
      '3) R, sükan TAM SAĞA, çiyin üstündən baxaraq geri. Arxa bordürə ~0.5 m qalanda dayanın.',
      '4) D, sükan TAM SOLA, irəli. Maşın düzələndə sükanı düzəldin və öz zolağınızda dayanın.',
      'Bordürə toxunmaq səhvdir.',
    ],
    coach: [
      { check: 'signal', to: 'L', text: 'Sola siqnal (Z), yolu yoxlayın' },
      { check: 'gear', to: 'D', text: 'Əyləc + D' },
      { check: 'steer', to: -1, text: 'Sükan tam SOLA' },
      { check: 'clear', which: 'front', below: 0.5, text: 'Yavaş irəli', hint: 'Qarşı bordürə ~0.5 m' },
      { check: 'gear', to: 'R', text: 'Əyləc + R' },
      { check: 'steer', to: 1, text: 'Sükan tam SAĞA' },
      { check: 'clear', which: 'rear', below: 0.5, text: 'Çiyin üstündən baxıb geri', hint: 'Arxa bordürə ~0.5 m' },
      { check: 'gear', to: 'D', text: 'Əyləc + D' },
      { check: 'steer', to: -1, text: 'Sükan tam SOLA' },
      { check: 'turn', to: -P / 2, sign: 1, tol: 4, text: 'Yavaş irəli', hint: 'Yola paralel olanda dayanın' },
      { check: 'steer', to: 0, text: 'Sükanı düzəldin' },
      { check: 'park', text: 'P və siqnalı söndürün' },
    ],
  };
}

const level1 = retry(level1once), level2 = retry(level2once), level3 = retry(level3once), level4 = retry(level4once);
const FACTORIES = [level1, level2, level3, level4, level5];

// Məşq rejimi üçün təsadüfi variant
export function randomVariant(id) {
  const s = Math.floor(Math.random() * 1e9);
  const shifts = { 1: [-2, -1, 0, 1, 2], 2: [-2, -1, 0, 1, 2], 3: [-1, 0, 1], 4: [-2, -1, 0, 1, 2], 5: [0] }[id];
  const r = rng(s);
  const pick = (a) => a[Math.floor(r() * a.length)];
  return {
    seed: s, shift: shifts[s % shifts.length], startJitter: ((s >> 4) % 7) - 3, vary: true,
    W: pick([2.5, 2.6, 2.7, 2.8, 2.9]), // yer eni 8.2–9.5 ft
    laneOff: (r() - 0.5) * 0.7, // başlanğıc zolağında yana sürüşmə ±35 sm
    gap: pick([6.7, 7.0, 7.3, 7.8]), // paralel boşluq (6.7 m-dən qısa boşluğa bu maşın bir qövs hərəkəti ilə girmir — testlə yoxlanıb)
    latOff: (r() - 0.5) * 0.5, // qabaqdakı maşından yan məsafə ±25 sm
    half: pick([3.7, 3.75, 3.8]), // dar küçənin yarı eni (7.4–7.6 m; 7.2 m-də 3 hərəkət kifayət etmir)
  };
}

export function makeLevel(id, variant = {}, tune) {
  return FACTORIES[id - 1](variant, tune);
}

export const LEVELS = FACTORIES.map((f) => f({}));
