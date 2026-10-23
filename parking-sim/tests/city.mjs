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
