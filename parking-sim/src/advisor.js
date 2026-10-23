// Səhvə uyğun konkret izah: hansı künc yaxınlaşır, cari sükanla nəyə dəyəcək, tez/gec dönmə.
// Three.js-siz — testlərdə də işləyir. Sabit "istinad nöqtəsi" yox, maşının həqiqi həndəsəsindən hesablanır.
import { CAR, MIRROR, collide, closestOnObb, toWorld } from './physics.js';

const DAT = { maşın: 'maşına', dirək: 'dirəyə', bina: 'binaya', ağac: 'ağaca', maneə: 'maneəyə' };

// Yoxlanılan nöqtələr (lokal: lx sol +, lz irəli +; mənşə arxa ox)
const HW = CAR.width / 2, FZ = CAR.wheelbase + CAR.frontOverhang, RZ = -CAR.rearOverhang;
export const PROBES = [
  { id: 'FL', name: 'ön sol künc', lx: HW, lz: FZ },
  { id: 'FR', name: 'ön sağ künc', lx: -HW, lz: FZ },
  { id: 'RL', name: 'arxa sol künc', lx: HW, lz: RZ },
  { id: 'RR', name: 'arxa sağ künc', lx: -HW, lz: RZ },
  { id: 'F', name: 'ön bamper', lx: 0, lz: FZ },
  { id: 'B', name: 'arxa bamper', lx: 0, lz: RZ },
  { id: 'ML', name: 'sol güzgü', lx: HW + MIRROR.out, lz: MIRROR.lz },
  { id: 'MR', name: 'sağ güzgü', lx: -HW - MIRROR.out, lz: MIRROR.lz },
  { id: 'SL', name: 'sol yan (arxa qapı)', lx: HW, lz: 0.3 },
  { id: 'SR', name: 'sağ yan (arxa qapı)', lx: -HW, lz: 0.3 },
];

function tall(obstacles) { return obstacles.filter((o) => o.type !== 'curb'); }

// Hər nöqtədən ən yaxın hündür maneəyə məsafə
export function probeDistances(pose, obstacles) {
  const obs = tall(obstacles);
  return PROBES.map((p) => {
    const w = toWorld(p.lx, p.lz, pose);
    let d = 9, o = null;
    for (const ob of obs) {
      if (Math.abs(ob.cx - w.x) > ob.hl + ob.hw + 2 || Math.abs(ob.cz - w.z) > ob.hl + ob.hw + 2) continue;
      const q = closestOnObb(w.x, w.z, ob);
      if (q.d < d) { d = q.d; o = ob; }
    }
    return { ...p, d, o };
  });
}

// Maşının hansı hissəsi maneəyə ən yaxındır (toqquşma yerində)
function nearestProbe(pose, o) {
  let best = null;
  for (const p of PROBES) {
    const w = toWorld(p.lx, p.lz, pose);
    const d = closestOnObb(w.x, w.z, o).d;
    if (!best || d < best.d) best = { ...p, d };
  }
  return best;
}

// Cari sükan bucağı ilə dir istiqamətində dist metr irəliləyərkən ilk toqquşma
export function predictHit(pose, delta, dir, obstacles, dist = 2.5, n = 20) {
  const obs = tall(obstacles);
  let { x, z, h } = pose;
  const ds = (dist / n) * dir;
  const k = Math.tan(delta) / CAR.wheelbase;
  for (let i = 1; i <= n; i++) {
    h += ds * k; x += Math.sin(h) * ds; z += Math.cos(h) * ds;
    const q = { x, z, h };
    const hit = collide(q, obs);
    if (hit) return { s: (i * dist) / n, pose: q, o: hit.o, probe: nearestProbe(q, hit.o) };
  }
  return null;
}

const cm = (d) => `${Math.max(0, Math.round(d * 100))} sm`;

// ctx: { pose, v, delta, gear, obstacles, step (təlimatçının cari addımı), rem (goto qalan məsafə) }
// Qaytarır: { level: 'info'|'warn'|'danger', text, why } və ya null
export function advise(ctx) {
  const { pose, v, delta, gear, obstacles } = ctx;
  const dir = Math.abs(v) > 0.05 ? Math.sign(v) : gear === 'D' ? 1 : gear === 'R' ? -1 : 0;
  if (!dir) return null;
  const turning = Math.abs(delta) > 0.08 ? (delta > 0 ? 'L' : 'R') : null;

  // 1) çox yaxın nöqtə və hərəkət ona doğrudur
  const now = probeDistances(pose, obstacles);
  const k = Math.tan(delta) / CAR.wheelbase, ds = 0.25 * dir;
  const h2 = pose.h + ds * k;
  const ahead = probeDistances({ x: pose.x + Math.sin(h2) * ds, z: pose.z + Math.cos(h2) * ds, h: h2 }, obstacles);
  let close = null;
  now.forEach((p, i) => {
    if (p.d < 0.6 && ahead[i].d < p.d - 0.01 && (!close || p.d < close.d - 0.03 || (p.d < close.d + 0.03 && (p.id === 'F' || p.id === 'B')))) close = p;
  });

  // 2) cari sükanla proqnoz
  const hit = predictHit(pose, delta, dir, obstacles);

  if (close && close.d < 0.25) {
    return { level: 'danger', text: `DAYANIN — ${close.name} ${cm(close.d)}`, why: fixFor(close.id, dir, turning) };
  }
  if (hit && hit.s < 1.6) {
    const p = hit.probe;
    return { level: 'warn', text: `Bu sükanla ~${hit.s.toFixed(1)} m sonra ${p.name} ${DAT[hit.o.name] || 'maneəyə'} dəyəcək`, why: fixFor(p.id, dir, turning) };
  }
  if (close) return { level: 'info', text: `${cap(close.name)} yaxınlaşır (${cm(close.d)})`, why: '' };

  // 3) tez dönmə: təlimatçı hələ düz getməyi deyir, sürücü isə artıq sükanı çevirib
  if (ctx.step && ctx.step.check === 'goto' && ctx.rem > 0.5 && Math.abs(ctx.steer) > 0.35 && Math.abs(v) > 0.1) {
    return { level: 'warn', text: `Tez dönürsünüz — hələ ~${ctx.rem.toFixed(1)} m düz gedin`, why: 'Sükanı düzəldin; dönmə nöqtəsinə çatanda çevirin' };
  }
  return null;
}

function cap(s) { return s[0].toUpperCase() + s.slice(1); }

// Hansı hissə dəyirsə — nə etməli (hərəkət istiqaməti və dönmə tərəfinə görə)
function fixFor(id, dir, turning) {
  const side = id.endsWith('L') ? 'L' : id.endsWith('R') ? 'R' : null;
  const front = id[0] === 'F', rear = id[0] === 'R' || id === 'B';
  const sideZone = id[0] === 'S' || id[0] === 'M';
  if (dir > 0) {
    if ((rear || sideZone) && side && side === turning) return `Tez döndünüz — maşının ${side === 'L' ? 'sol' : 'sağ'} yanı içəri kəsir (arxa təkərlər ön təkərlərdən daha içəridən keçir). Dayanın, bir az geri çəkilib düz gedin, sonra dönün.`;
    if (front && side && turning && side !== turning) return 'Ön künc xaricə çıxır — sükanı daha çox çevirin və ya bir az geri çəkilib bucağı düzəldin.';
    if (front && side && side === turning) return 'Gec döndünüz — dayanın, bir az geri çəkilib bucağı düzəldin.';
    return 'Dayanın, bir az geri çəkilib bucağı düzəldin.';
  }
  if (front && side) return 'Geri gedəndə ön hissə yana açılır — o tərəfə baxın. Dayanıb sükanı bir az az çevirin.';
  if ((rear || sideZone) && side && side === turning) return 'Arxa küncü içəri çox kəsir — dayanın, bir az irəli çıxıb bucağı düzəldin.';
  return 'Dayanın, bir az irəli çıxıb bucağı düzəldin.';
}

