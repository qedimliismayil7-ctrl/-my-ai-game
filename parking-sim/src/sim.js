// Səviyyə məlumatından maneələr və məsafə ölçmələri (Three.js-siz — oyun və testlər birlikdə istifadə edir).
import { CAR, PARKED, closestOnObb, obbAxes, toWorld } from './physics.js';

export function obstaclesOf(L) {
  const o = [];
  for (const [x1, z1, x2, z2] of L.curbs) {
    const dx = x2 - x1, dz = z2 - z1;
    o.push({ cx: (x1 + x2) / 2, cz: (z1 + z2) / 2, h: Math.atan2(dx, dz), hw: 0.15, hl: Math.hypot(dx, dz) / 2, type: 'curb', name: 'bordür' });
  }
  for (const c of L.cars) o.push({ cx: c.x, cz: c.z, h: c.h, hw: (c.w || PARKED.width) / 2, hl: (c.l || PARKED.length) / 2, type: 'car', name: 'maşın' });
  for (const b of L.boxes) {
    const name = b.type === 'building' ? 'bina' : b.type === 'pole' ? 'dirək' : 'maneə';
    o.push({ cx: b.cx, cz: b.cz, h: b.h, hw: b.hw, hl: b.hl, type: b.type, name });
  }
  for (const [x, z] of L.trees) o.push({ cx: x, cz: z, h: 0, hw: 0.2, hl: 0.2, type: 'tree', name: 'ağac' });
  return o;
}

// Bamper boyunca nöqtələr: ön və arxa (4 + 4). Park sensorlarının yerləri də budur.
export const BUMPER_POINTS = [
  ...[-0.75, -0.28, 0.28, 0.75].map((x) => ({ lx: x, lz: CAR.wheelbase + CAR.frontOverhang, nx: x * 0.6, nz: 1, f: true })),
  ...[-0.75, -0.28, 0.28, 0.75].map((x) => ({ lx: x, lz: -CAR.rearOverhang, nx: x * 0.6, nz: -1, f: false })),
];

// Hər bamper nöqtəsindən qarşıdakı maneəyə məsafə (~53° konus). out — 8 elementli massiv (istəyə görə).
export function bumperClearance(pose, obstacles, out = null) {
  let front = 9, rear = 9;
  const [ax, az] = obbAxes(pose.h);
  BUMPER_POINTS.forEach((s, i) => {
    const p = toWorld(s.lx, s.lz, pose);
    const nl = Math.hypot(s.nx, s.nz);
    const nwx = (ax[0] * s.nx + az[0] * s.nz) / nl, nwz = (ax[1] * s.nx + az[1] * s.nz) / nl;
    let best = 9;
    for (const o of obstacles) {
      if (Math.abs(o.cx - p.x) > o.hl + o.hw + 3 || Math.abs(o.cz - p.z) > o.hl + o.hw + 3) continue;
      const q = closestOnObb(p.x, p.z, o);
      if (q.d > 2.5) continue;
      const dot = (q.x - p.x) * nwx + (q.z - p.z) * nwz;
      if (dot >= 0.6 * q.d || q.d < 0.05) best = Math.min(best, q.d);
    }
    if (out) out[i] = best;
    if (s.f) front = Math.min(front, best); else rear = Math.min(rear, best);
  });
  return { front, rear };
}
