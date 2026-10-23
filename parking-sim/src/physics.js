// Maşının fizikası (Three.js-dən asılı deyil — node-da da test olunur).
// Koordinatlar: yer müstəvisi XZ. Bucaq h: irəli istiqamət = (sin h, cos h).
// h artanda maşın SOLA dönür. Maşının sol tərəfi lokal +X-dir.
// Mövqe (x, z) ARXA OXUN mərkəzidir — velosiped modelində arxa təkərlər ön təkərləri izləyir.

export const DEG = Math.PI / 180;

// 2023 Hyundai Elantra SEL (ABŞ bazarı). Mənbələr README-dədir.
// "est" — dəqiq rəsmi rəqəm tapılmadı, təxmini/hesablanmış dəyərdir.
export const SPEC = {
  model: '2023 Hyundai Elantra SEL (ABŞ)',
  length: { v: 4.676, src: '184.1 in (Hyundai spesifikasiyası, dilerlər)' },
  width: { v: 1.826, src: '71.9 in (KBB, dilerlər)' },
  height: { v: 1.415, src: '55.7 in' },
  wheelbase: { v: 2.72, src: '107.1 in (Hyundai spesifikasiyası)' },
  track: { v: 1.585, src: '62.4 in ön (J.D. Power); 16" təkər üçün', est: true },
  frontOverhang: { v: 0.91, src: 'rəsmi rəqəm tapılmadı; uzunluq − baza = 1.956 m bölünüb', est: true },
  rearOverhang: { v: 1.046, src: 'rəsmi rəqəm tapılmadı; 1.956 − 0.91', est: true },
  turnRadius: { v: 5.39, src: '17.7 ft minimum dönmə radiusu (Hyundai); 35.4 ft dairə (J.D. Power)' },
  steerRatio: { v: 12.9, src: '12.9:1 (Hyundai 2021 Elantra spesifikasiyası; 2023 üçün eyni qəbul edilib)', est: true },
  lockToLock: { v: 2.48, src: '2.48 dövrə (Hyundai 2021 Elantra spesifikasiyası)', est: true },
  tire: { v: '205/55R16', src: 'SEL 16" disk', est: true },
  mass: { v: 1301, src: '2,868 lb (dilerlər)' },
  parkSensors: { v: false, src: 'Arxa park məsafə xəbərdarlığı 2023 SEL-də standart deyil — $1,900 Convenience Package (Hyundai qiymət cədvəli, 04.01.2023)' },
  rearCamera: { v: true, src: 'Arxa görüntü kamerası standartdır (KBB, CarMax); xətlərin dinamik olması rəsmi təsdiqlənmədi', est: true },
};

const WHEEL_LOCK = (SPEC.lockToLock.v * 360) / 2; // bir tərəfə ≈ 446°
// Velosiped modelinin maksimum bucağı rəsmi dönmə radiusundan hesablanır:
// 5.39 m xarici ön təkərin xarici kənarına qədərdir (təkər yarım eni ≈ 0.1 m).
const R_OUTER_WHEEL = SPEC.turnRadius.v - 0.1;
const R_REAR = Math.sqrt(R_OUTER_WHEEL ** 2 - SPEC.wheelbase.v ** 2) - SPEC.track.v / 2;

export const CAR = {
  length: SPEC.length.v,
  width: SPEC.width.v,
  height: SPEC.height.v,
  wheelbase: SPEC.wheelbase.v,
  rearOverhang: SPEC.rearOverhang.v,
  frontOverhang: SPEC.frontOverhang.v,
  track: SPEC.track.v,
  maxSteer: Math.atan(SPEC.wheelbase.v / R_REAR), // ≈ 36°
  wheelLock: WHEEL_LOCK,
  mass: SPEC.mass.v,
};
// Effektiv nisbət ≈ 12.4:1 (rəsmi 12.9:1 — real sükan qeyri-xəttidir, burada xətti qəbul edilir)
CAR.steerRatio = CAR.wheelLock / (CAR.maxSteer / DEG);
CAR.centerOffset = CAR.length / 2 - CAR.rearOverhang; // arxa oxdan gövdə mərkəzinə
CAR.minRadius = CAR.wheelbase / Math.tan(CAR.maxSteer); // arxa oxun minimum dönmə radiusu

// Dayanacaqdakı digər maşınlar (ABŞ-da tipik orta sedan/krossover ölçüsü — təxmini)
export const PARKED = { length: 4.8, width: 1.86 };

export const LIMITS = {
  vmaxForward: 10 / 3.6, // ~10 km/saat
  vmaxReverse: 7 / 3.6,
  creep: 1.3, // avtomat qutuda qaza basmadan "sürünmə" sürəti (m/s)
};

export const GEARS = ['P', 'R', 'N', 'D'];

// Şəhər sürüşü üçün (təxmini): kütlə sürücü ilə, güc, hava müqaviməti əmsalı 0.5·ρ·Cd·A/m
export const CITY = { mass: 1380, power: 110000, drag: (0.5 * 1.2 * 0.27 * 2.2) / 1380 };
// Yan dinamika (təxmini): təkər yan sərtliyi N/rad, ətalət momenti kq·m², sürtünmə
export const DYN = { mass: 1380, Iz: 2250, Cf: 95000, Cr: 105000, mu: 0.9, frontShare: 0.39 };

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

// Qabarıq çoxbucaqlı (bina) ilə maşının OBB-si kəsişirmi (SAT)
export function polyOverlap(box, poly) {
  const ca = obbCorners(box);
  const axes = [...obbAxes(box.h)];
  for (let i = 0; i < poly.length; i++) {
    const [ax, az] = poly[i], [bx, bz] = poly[(i + 1) % poly.length];
    const l = Math.hypot(bx - ax, bz - az) || 1;
    axes.push([-(bz - az) / l, (bx - ax) / l]);
  }
  for (const axis of axes) {
    let amin = Infinity, amax = -Infinity, bmin = Infinity, bmax = -Infinity;
    for (const p of ca) { const d = p[0] * axis[0] + p[1] * axis[1]; amin = Math.min(amin, d); amax = Math.max(amax, d); }
    for (const p of poly) { const d = p[0] * axis[0] + p[1] * axis[1]; bmin = Math.min(bmin, d); bmax = Math.max(bmax, d); }
    if (amax < bmin || bmax < amin) return false;
  }
  return true;
}

export function convexHull(points) {
  const p = points.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [], upper = [];
  for (const q of p) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop(); lower.push(q); }
  for (const q of p.reverse()) { while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop(); upper.push(q); }
  return lower.slice(0, -1).concat(upper.slice(0, -1));
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

  reset(pose, profile = 'park') {
    this.profile = profile;
    this.vy = 0;
    this.r = 0;
    this.slip = 0;
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
    let aDrive = 0, aDrag = 0;
    if (this.profile === 'city') {
      // Şəhər: 2.0 MPI (147 at ≈ 110 kVt) — gücdən asılı sürətlənmə, hava müqaviməti (Cd≈0.27, A≈2.2 m² — təxmini)
      if (dir) {
        const vd = this.v * dir;
        const vmax = dir > 0 ? 50 : 4.5;
        let a = inp.throttle * Math.min(3.4, CITY.power / (CITY.mass * Math.max(vd, 1)));
        if (vd < LIMITS.creep) a = Math.max(a, Math.min(0.8, (LIMITS.creep - vd) * 1.5));
        if (vd > vmax) a = 0;
        if (inp.clutchMode) a *= 1 - clamp(inp.clutch, 0, 1);
        aDrive = a * dir;
      }
      aDrag = CITY.drag * this.v * this.v;
    } else if (dir) {
      const vmax = dir > 0 ? LIMITS.vmaxForward : LIMITS.vmaxReverse;
      const target = LIMITS.creep + inp.throttle * (vmax - LIMITS.creep);
      const vd = this.v * dir;
      const cap = 0.7 + 1.6 * inp.throttle;
      let f = clamp((target - vd) * 2.0, 0, cap);
      if (inp.clutchMode) f *= 1 - clamp(inp.clutch, 0, 1);
      aDrive = f * dir;
    }
    let vNew = this.v + aDrive * dt;
    let brakeA = inp.brake * (this.profile === 'city' ? 8.5 : 7) + (inp.handbrake ? 5 : 0) + 0.12 + aDrag;
    if (this.gear === 'P') brakeA = 20;
    const db = brakeA * dt;
    if (Math.abs(vNew) <= db) vNew = 0;
    else vNew -= Math.sign(vNew) * db;
    this.accel = (vNew - this.v) / dt;
    this.v = vNew;

    const px = this.x, pz = this.z, ph = this.h;
    if (this.profile === 'city') this.dynamicStep(dt);
    else {
      // velosiped modeli (kinematik — park sürətlərində dəqiqdir)
      this.h = wrapAngle(this.h + (this.v / CAR.wheelbase) * Math.tan(this.delta) * dt);
      this.x += Math.sin(this.h) * this.v * dt;
      this.z += Math.cos(this.h) * this.v * dt;
    }
    this.odometer += Math.abs(this.v * dt);

    if (obstacles) {
      const box = this.box;
      for (const o of obstacles) {
        if (o.poly ? polyOverlap(box, o.poly) : obbOverlap(box, o)) {
          this.x = px; this.z = pz; this.h = ph;
          const impact = Math.hypot(this.v, this.vy);
          this.v = -this.v * 0.15;
          this.vy = 0;
          this.r = 0;
          return { hit: o, impact };
        }
      }
    }
    return null;
  }

  // Dinamik velosiped modeli (şəhər sürətləri): təkərlərin yan sürüşməsi, sürtünmə həddi, kütlənin ətaləti.
  // Aşağı sürətdə kinematik modelə keçir. Parametrlər təxminidir (ön ağırlıq ~61%, μ≈0.9 quru asfalt).
  dynamicStep(dt) {
    const L = CAR.wheelbase, a = L * DYN.frontShare, b = L - a;
    const vx = this.v, d = this.delta;
    const rKin = (vx / L) * Math.tan(d);
    const w = vx > 0 ? clamp((vx - 3) / 2, 0, 1) : 0; // 3–5 m/s arası keçid; geri hərəkət kinematik
    let r = this.r, vy = this.vy;
    this.slip = 0;
    if (w > 0) {
      const Fzf = (DYN.mass * 9.81 * b) / L, Fzr = (DYN.mass * 9.81 * a) / L;
      const af = d - Math.atan2(vy + a * r, vx);
      const ar = -Math.atan2(vy - b * r, vx);
      const Fyf = clamp(DYN.Cf * af, -DYN.mu * Fzf, DYN.mu * Fzf);
      const Fyr = clamp(DYN.Cr * ar, -DYN.mu * Fzr, DYN.mu * Fzr);
      vy += ((Fyf * Math.cos(d) + Fyr) / DYN.mass - vx * r) * dt;
      r += ((a * Fyf * Math.cos(d) - b * Fyr) / DYN.Iz) * dt;
      this.slip = Math.max(Math.abs(af), Math.abs(ar));
    }
    this.r = w * r + (1 - w) * rKin;
    this.vy = w * vy;
    // ağırlıq mərkəzi arxa oxdan b qədər irəlidədir
    let fx = Math.sin(this.h), fz = Math.cos(this.h);
    let cx = this.x + fx * b, cz = this.z + fz * b;
    const lx = fz, lz = -fx; // sol
    cx += (fx * vx + lx * this.vy) * dt;
    cz += (fz * vx + lz * this.vy) * dt;
    this.h = wrapAngle(this.h + this.r * dt);
    fx = Math.sin(this.h); fz = Math.cos(this.h);
    this.x = cx - fx * b;
    this.z = cz - fz * b;
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
