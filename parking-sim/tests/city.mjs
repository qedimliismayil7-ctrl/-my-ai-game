// Şəhər qaydalarının testi SÜNİ xəritədə (tests/fixtures/grid.json — real Bakı deyil).
import { readFileSync } from 'node:fs';
import { RoadNetwork, signalState, nextManeuver } from '../src/city/network.js';
import { RuleMonitor } from '../src/city/rules.js';

const city = JSON.parse(readFileSync(new URL('./fixtures/grid.json', import.meta.url)));
const net = new RoadNetwork(city);
let failed = 0;
const check = (name, ok, info = '') => { console.log(`${ok ? '✓' : '✗'} ${name}${info ? ' — ' + info : ''}`); if (!ok) failed++; };

// Düz xətt üzrə sürüş: (x0,z0) → istiqamət h, sürət v, sağa sürüşmə lat
function drive({ x0, z0, h, v, dist, lat = 0, blinker = null, t0 = 0, steerAt = null }) {
  const rm = new RuleMonitor(net);
  const dt = 1 / 30;
  let x = x0 + Math.cos(h) * -lat, z = z0 - Math.sin(h) * -lat, t = t0, s = 0, hh = h;
  while (s < dist) {
    if (steerAt && s > steerAt.s && s < steerAt.s + steerAt.len) hh += (steerAt.dh / steerAt.len) * v * dt;
    x += Math.sin(hh) * v * dt; z += Math.cos(hh) * v * dt; s += v * dt; t += dt;
    rm.update(dt, { x, z, h: hh, v, frontX: x + Math.sin(hh) * 3.6, frontZ: z + Math.cos(hh) * 3.6 }, blinker, t);
  }
  return rm.violations.map((v) => v.key);
}

const ap = net.approaches[0];
check('svetofor yanaşmaları tapıldı', net.approaches.length >= 6, `${net.approaches.length}`);
// qırmızı işıq vaxtını tap: bu yanaşma üçün qırmızı olan an
let tRed = 0;
while (signalState(ap, tRed + 4) !== 'red' || signalState(ap, tRed) !== 'red') tRed += 0.5;
const h = Math.atan2(ap.dx, ap.dz);
const lane = ap.oneway ? 0 : ap.halfW / 2;
const sx = ap.x - ap.dx * 30 - ap.dz * lane, sz = ap.z - ap.dz * 30 + ap.dx * lane;
let tStart = tRed - 30 / 8;
while (signalState(ap, tStart + 30 / 8) !== 'red') tStart += 0.5;
check('qırmızıda keçmə tutulur', drive({ x0: sx, z0: sz, h, v: 8, dist: 45, t0: tStart }).includes('redLight'));
let tG = 0;
while (signalState(ap, tG + 30 / 8) !== 'green' || signalState(ap, tG) !== 'green') tG += 0.5;
check('yaşılda keçmə — pozuntu yoxdur', !drive({ x0: sx, z0: sz, h, v: 8, dist: 45, t0: tG }).includes('redLight'));

// birtərəfli yol (Yol 2): əks istiqamətdə
const one = city.roads.find((r) => r.oneway);
const [ax, az] = one.pts[1], [bx, bz] = one.pts[2];
const hOne = Math.atan2(bx - ax, bz - az);
check('birtərəfli yolda düzgün istiqamət — pozuntu yoxdur', !drive({ x0: ax + (bx - ax) * 0.2, z0: az + (bz - az) * 0.2, h: hOne, v: 8, dist: 100 }).includes('wrongWay'));
check('birtərəfli yolda əks istiqamət tutulur', drive({ x0: bx - (bx - ax) * 0.2, z0: bz - (bz - az) * 0.2, h: hOne + Math.PI, v: 8, dist: 100 }).includes('wrongWay'));

// ikitərəfli yol (Küçə 0): sağ və sol tərəf
const two = city.roads.find((r) => r.name === 'Küçə 0');
const [cx, cz] = two.pts[1], [dx2, dz2] = two.pts[2];
const hTwo = Math.atan2(dx2 - cx, dz2 - cz);
const mid = (k) => [cx + (dx2 - cx) * k, cz + (dz2 - cz) * k];
const R = two.width / 4;
const [m1x, m1z] = mid(0.2);
// sağ tərəf: sağ vektor (−dz, dx) = lokal −X
const rx = -Math.cos(hTwo), rz = Math.sin(hTwo);
check('ikitərəfli yolda sağ zolaq — pozuntu yoxdur', !drive({ x0: m1x + rx * R, z0: m1z + rz * R, h: hTwo, v: 8, dist: 100 }).includes('oncoming'));
check('qarşı zolağa çıxma tutulur', drive({ x0: m1x - rx * R, z0: m1z - rz * R, h: hTwo, v: 8, dist: 100 }).includes('oncoming'));
// sürət: 60 km/saat həddində 80 km/saat
check('sürət həddini aşma tutulur', drive({ x0: m1x + rx * R, z0: m1z + rz * R, h: hTwo, v: 80 / 3.6, dist: 120 }).some((k) => k.startsWith('speed')));
check('hədd daxilində — sürət pozuntusu yoxdur', !drive({ x0: m1x + rx * R, z0: m1z + rz * R, h: hTwo, v: 50 / 3.6, dist: 120 }).some((k) => k.startsWith('speed')));

// marşrut birtərəfli yola əks getmir
const from = one.nodes[one.nodes.length - 1], to = one.nodes[0];
const r = net.route(from, to);
const usesWrong = r && r.nodes.some((id, i) => i > 0 && one.nodes.indexOf(id) === one.nodes.indexOf(r.nodes[i - 1]) - 1 && one.nodes.includes(r.nodes[i - 1]));
check('marşrut birtərəfli yola əks istiqamətdə girmir', r && !usesWrong, r ? `${Math.round(r.length)} m` : 'yoxdur');
const man = nextManeuver(net, r.nodes, ...net.pos.get(from));
check('növbəti dönüş göstərişi var', !!man, man ? `${man.turn} ${Math.round(man.dist)} m` : '');

if (failed) { console.error(`${failed} şəhər testi keçilmədi`); process.exit(1); }
console.log('Şəhər testləri keçildi (süni xəritə).');

// ---------- Trafik (süni xəritə + varsa real Nərimanov) ----------
import { Traffic } from '../src/city/traffic.js';
import { existsSync } from 'node:fs';
const maps = [['süni xəritə', city]];
if (existsSync(new URL('../data/narimanov.json', import.meta.url))) maps.push(['Nərimanov', JSON.parse(readFileSync(new URL('../data/narimanov.json', import.meta.url)))]);
let tfail = 0;
for (const [name, data] of maps) {
  const n2 = new RoadNetwork(data);
  const T = new Traffic(n2, 12, 7);
  let redRuns = 0, overlaps = 0, moved = 0;
  const startPos = new Map(T.cars.map((c) => [c, [c.x, c.z]]));
  for (let t = 0; t < 180; t += 1 / 30) {
    // qırmızıda dayanma xəttini keçən varmı
    // maşın obyektinə görə (yenidən doğulanda massivdəki sıra dəyişir)
    const before = new Map(T.cars.map((c) => [c, n2.approaches.map((ap) => ({ ap, s: (c.x + c.fx * 2.4 - ap.x) * ap.dx + (c.z + c.fz * 2.4 - ap.z) * ap.dz, lat: Math.abs((c.x - ap.x) * ap.dz - (c.z - ap.z) * ap.dx), al: c.fx * ap.dx + c.fz * ap.dz }))]));
    T.update(1 / 30, t, null);
    T.cars.forEach((c) => {
      if (!before.has(c)) return;
      n2.approaches.forEach((ap, k) => {
        const b = before.get(c)[k];
        const s = (c.x + c.fx * 2.4 - ap.x) * ap.dx + (c.z + c.fz * 2.4 - ap.z) * ap.dz;
        if (b.al > 0.7 && b.lat < ap.halfW + 0.5 && b.s < 0 && s >= 0 && signalState(ap, t) === 'red') redRuns++;
      });
    });
    for (let i = 0; i < T.cars.length; i++) for (let j = i + 1; j < T.cars.length; j++) {
      const a = T.cars[i], b = T.cars[j];
      if (Math.hypot(a.x - b.x, a.z - b.z) < 2.5 && a.fx * b.fx + a.fz * b.fz > 0.7) overlaps++;
    }
  }
  for (const [c, [x, z]] of startPos) if (Math.hypot(c.x - x, c.z - z) > 30) moved++;
  const ok1 = moved >= Math.min(6, T.cars.length - 2), ok2 = redRuns === 0, ok3 = overlaps < 30;
  console.log(`${ok1 ? '✓' : '✗'} trafik hərəkət edir (${name}): ${moved}/${T.cars.length} maşın 30 m-dən çox getdi`);
  console.log(`${ok2 ? '✓' : '✗'} trafik qırmızı işıqda keçmir (${name}): ${redRuns} hal`);
  console.log(`${ok3 ? '✓' : '✗'} eyni istiqamətdə maşınlar üst-üstə düşmür (${name}): ${overlaps} kadr`);
  if (!ok1 || !ok2 || !ok3) tfail++;
}
if (tfail) { console.error('Trafik testləri keçilmədi'); process.exit(1); }

// ---------- Yeni qaydalar: məsafə və yol vermə (süni xəritə) ----------
{
  const rm = new RuleMonitor(net);
  // ikitərəfli "Küçə 0" üzrə: öndə 8 m məsafədə eyni istiqamətdə gedən maşın, sürət 50 km/saat
  const v = 50 / 3.6, fx = Math.sin(hTwo), fz = Math.cos(hTwo);
  const seg0 = net.segs.find((sg) => sg.road === two);
  const ai = { x: 0, z: 0, h: hTwo, v, fx, fz, seg: seg0 };
  const fake = { cars: [ai] };
  let x = m1x + rx * R, z = m1z + rz * R;
  for (let t = 0; t < 5; t += 1 / 30) {
    x += fx * v / 30; z += fz * v / 30;
    ai.x = x + fx * 12; ai.z = z + fz * 12; // arxa oxdan 12 m irəli ≈ 7 m boşluq (0.5 san)
    rm.update(1 / 30, { x, z, h: hTwo, v, frontX: x + fx * 3.6, frontZ: z + fz * 3.6 }, null, t, fake);
  }
  check('təhlükəsiz məsafə pozuntusu tutulur', rm.violations.some((q) => q.key === 'tailgate'));
}
{
  // ikinci dərəcəli yoldan (Küçə 0, residential) əsas yola (Yol 1, secondary) çıxış; əsas yolda maşın yaxınlaşır
  const node = '1001';
  const [nx, nz] = net.pos.get(node);
  const mainSeg = net.segs.find((sg) => sg.road.name === 'Yol 1' && (sg.a === node || sg.b === node));
  const dirTo = mainSeg.a === node ? -1 : 1; // node-a doğru
  const afx = mainSeg.dx * dirTo, afz = mainSeg.dz * dirTo;
  const ai = { x: nx - afx * 15, z: nz - afz * 15, h: Math.atan2(afx, afz), v: 9, fx: afx, fz: afz, seg: mainSeg };
  const resSeg = net.segs.find((sg) => sg.road.name === 'Küçə 0' && (sg.a === node || sg.b === node));
  const rd = resSeg.a === node ? -1 : 1;
  const pfx = resSeg.dx * rd, pfz = resSeg.dz * rd, ph = Math.atan2(pfx, pfz);
  const rm = new RuleMonitor(net);
  let x = nx - pfx * 20 - pfz * 1.6, z = nz - pfz * 20 + pfx * 1.6;
  for (let t = 0; t < 3; t += 1 / 30) {
    x += pfx * 6 / 30; z += pfz * 6 / 30;
    rm.update(1 / 30, { x, z, h: ph, v: 6, frontX: x + pfx * 3.6, frontZ: z + pfz * 3.6 }, null, t, { cars: [ai] });
  }
  check('əsas yoldakı maşına yol verməmək tutulur', rm.violations.some((q) => q.key === 'yieldMain'));
  const rm2 = new RuleMonitor(net);
  x = nx - pfx * 20 - pfz * 1.6; z = nz - pfz * 20 + pfx * 1.6;
  for (let t = 0; t < 3; t += 1 / 30) {
    x += pfx * 6 / 30; z += pfz * 6 / 30;
    rm2.update(1 / 30, { x, z, h: ph, v: 6, frontX: x + pfx * 3.6, frontZ: z + pfz * 3.6 }, null, t, { cars: [] });
  }
  check('yol boş olanda — yol vermə pozuntusu yoxdur', !rm2.violations.some((q) => q.key.startsWith('yield')));
}
if (failed) { console.error(`${failed} şəhər testi keçilmədi`); process.exit(1); }
