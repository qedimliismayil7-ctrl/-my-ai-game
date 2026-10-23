// Maşının fizikası (Three.js-dən asılı deyil — node-da da test olunur).
// Koordinatlar: yer müstəvisi XZ. Bucaq h: irəli istiqamət = (sin h, cos h).
// h artanda maşın SOLA dönür. Maşının sol tərəfi lokal +X-dir.
// Mövqe (x, z) ARXA OXUN mərkəzidir — velosiped modelində arxa təkərlər ön təkərləri izləyir.

export const DEG = Math.PI / 180;

export const CAR = {
  length: 4.5,
  width: 1.8,
  wheelbase: 2.7,
  rearOverhang: 0.85,
  frontOverhang: 0.95,
  track: 1.55,
  maxSteer: 35 * DEG,
  wheelLock: 450, // sükanın bir tərəfə maksimum dönməsi (900° tam)
  mass: 1400,
};
CAR.steerRatio = CAR.wheelLock / (CAR.maxSteer / DEG); // ≈ 12.9 : 1
CAR.centerOffset = CAR.length / 2 - CAR.rearOverhang; // arxa oxdan gövdə mərkəzinə (1.4 m)
CAR.minRadius = CAR.wheelbase / Math.tan(CAR.maxSteer); // arxa oxun minimum dönmə radiusu

export const LIMITS = {
  vmaxForward: 10 / 3.6, // ~10 km/saat
  vmaxReverse: 7 / 3.6,
  creep: 1.3, // avtomat qutuda qaza basmadan "sürünmə" sürəti (m/s)
};

export const GEARS = ['P', 'R', 'N', 'D'];

export function wrapAngle(a) {
  while (a > Math.PI) a -= 2 * Math.PI;
  while (a < -Math.PI) a += 2 * Math.PI;
  return a;
}

export function clamp(v, a, b) {
  return v < a ? a : v > b ? b : v;
}

// ---------- OBB (fırlanmış düzbucaqlı) ----------
// b = { cx, cz, h, hw (yarım en, lokal X), hl (yarım uzunluq, lokal Z) }

export function obbAxes(h) {
  const s = Math.sin(h), c = Math.cos(h);
  return [[c, -s], [s, c]]; // lokal X, lokal Z
}

export function obbCorners(b) {
  const [ax, az] = obbAxes(b.h);
  const out = [];
  for (const [i, j] of [[1, 1], [-1, 1], [-1, -1], [1, -1]]) {
    out.push([
      b.cx + ax[0] * b.hw * i + az[0] * b.hl * j,
      b.cz + ax[1] * b.hw * i + az[1] * b.hl * j,
    ]);
  }
  return out;
}

export function obbOverlap(a, b) {
  const ca = obbCorners(a), cb = obbCorners(b);
  for (const axis of [...obbAxes(a.h), ...obbAxes(b.h)]) {
    let amin = Infinity, amax = -Infinity, bmin = Infinity, bmax = -Infinity;
    for (const p of ca) { const d = p[0] * axis[0] + p[1] * axis[1]; amin = Math.min(amin, d); amax = Math.max(amax, d); }
    for (const p of cb) { const d = p[0] * axis[0] + p[1] * axis[1]; bmin = Math.min(bmin, d); bmax = Math.max(bmax, d); }
    if (amax < bmin || bmax < amin) return false;
  }
  return true;
}

// Nöqtənin OBB-yə ən yaxın nöqtəsi və məsafəsi
export function closestOnObb(px, pz, b) {
  const [ax, az] = obbAxes(b.h);
  const dx = px - b.cx, dz = pz - b.cz;
  const lx = clamp(dx * ax[0] + dz * ax[1], -b.hw, b.hw);
  const lz = clamp(dx * az[0] + dz * az[1], -b.hl, b.hl);
  const qx = b.cx + ax[0] * lx + az[0] * lz;
  const qz = b.cz + ax[1] * lx + az[1] * lz;
  return { x: qx, z: qz, d: Math.hypot(qx - px, qz - pz) };
}

// Nöqtəni pozanın lokal koordinatlarına keçir (lx: sol +, lz: irəli +)
export function toLocal(px, pz, pose) {
  const [ax, az] = obbAxes(pose.h);
  const dx = px - pose.x, dz = pz - pose.z;
  return { lx: dx * ax[0] + dz * ax[1], lz: dx * az[0] + dz * az[1] };
}

export function toWorld(lx, lz, pose) {
  const [ax, az] = obbAxes(pose.h);
  return { x: pose.x + ax[0] * lx + az[0] * lz, z: pose.z + ax[1] * lx + az[1] * lz };
}

// Arxa ox pozasından gövdə OBB-si
export function carBox(x, z, h, margin = 0) {
  return {
    cx: x + Math.sin(h) * CAR.centerOffset,
    cz: z + Math.cos(h) * CAR.centerOffset,
    h,
    hw: CAR.width / 2 + margin,
    hl: CAR.length / 2 + margin,
  };
}

// ---------- Maşın ----------

export class CarPhysics {
  constructor() {
    this.reset({ x: 0, z: 0, h: 0 });
  }

  reset(pose) {
    this.x = pose.x;
    this.z = pose.z;
    this.h = pose.h;
    this.v = 0; // irəli + / geri −  (m/s)
    this.steer = 0; // −1 sol … +1 sağ (sükan)
    this.delta = 0; // ön təkər bucağı, + = sol
    this.gear = 'P';
    this.accel = 0;
    this.odometer = 0;
  }

  get pose() { return { x: this.x, z: this.z, h: this.h }; }
  get box() { return carBox(this.x, this.z, this.h); }
  get speedKmh() { return Math.abs(this.v) * 3.6; }
  get wheelDeg() { return this.steer * CAR.wheelLock; }

  // Ackermann: daxili və xarici ön təkərin bucağı (vizual)
  ackermann() {
    const d = this.delta;
    if (Math.abs(d) < 1e-4) return { left: 0, right: 0 };
    const R = CAR.wheelbase / Math.tan(Math.abs(d));
    const inner = Math.atan(CAR.wheelbase / (R - CAR.track / 2));
    const outer = Math.atan(CAR.wheelbase / (R + CAR.track / 2));
    return d > 0 ? { left: inner, right: outer } : { left: -outer, right: -inner };
  }

  // inp: { steer (−1..1), throttle, brake, clutch (0..1), handbrake (bool), clutchMode (bool) }
  step(dt, inp, obstacles = null) {
    this.steer = clamp(inp.steer, -1, 1);
    // ön təkərlər sükanı bir az gecikmə ilə izləyir (sükan sütununun elastikliyi)
    const targetDelta = -this.steer * CAR.maxSteer;
    const maxRate = 120 * DEG * dt;
    this.delta += clamp(targetDelta - this.delta, -maxRate, maxRate);

    const dir = this.gear === 'D' ? 1 : this.gear === 'R' ? -1 : 0;
    let aDrive = 0;
    if (dir) {
      const vmax = dir > 0 ? LIMITS.vmaxForward : LIMITS.vmaxReverse;
      const target = LIMITS.creep + inp.throttle * (vmax - LIMITS.creep);
      const vd = this.v * dir;
      const cap = 0.7 + 1.6 * inp.throttle;
      let f = clamp((target - vd) * 2.0, 0, cap);
      if (inp.clutchMode) f *= 1 - clamp(inp.clutch, 0, 1);
      aDrive = f * dir;
    }
    let vNew = this.v + aDrive * dt;
    let brakeA = inp.brake * 7 + (inp.handbrake ? 5 : 0) + 0.12;
    if (this.gear === 'P') brakeA = 20;
    const db = brakeA * dt;
    if (Math.abs(vNew) <= db) vNew = 0;
    else vNew -= Math.sign(vNew) * db;
    this.accel = (vNew - this.v) / dt;
    this.v = vNew;

    // velosiped modeli
    const px = this.x, pz = this.z, ph = this.h;
    this.h = wrapAngle(this.h + (this.v / CAR.wheelbase) * Math.tan(this.delta) * dt);
    this.x += Math.sin(this.h) * this.v * dt;
    this.z += Math.cos(this.h) * this.v * dt;
    this.odometer += Math.abs(this.v * dt);

    if (obstacles) {
      const box = this.box;
      for (const o of obstacles) {
        if (obbOverlap(box, o)) {
          this.x = px; this.z = pz; this.h = ph;
          const impact = Math.abs(this.v);
          this.v = -this.v * 0.15;
          return { hit: o, impact };
        }
      }
    }
    return null;
  }

  // Cari sükanla gələcək trayektoriya (arxa ox nöqtələri + künclər)
  predict(direction, dist = 6, n = 30) {
    const pts = [];
    let x = this.x, z = this.z, h = this.h;
    const ds = (dist / n) * direction;
    const k = Math.tan(this.delta) / CAR.wheelbase;
    for (let i = 0; i <= n; i++) {
      pts.push({ x, z, h });
      h += ds * k;
      x += Math.sin(h) * ds;
      z += Math.cos(h) * ds;
    }
    return pts;
  }
}
