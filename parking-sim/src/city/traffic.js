// Süni intellektli trafik (Three.js-siz): maşınlar yol şəbəkəsi üzrə sağ zolaqla hərəkət edir,
// svetofora əməl edir, öndəki maşına (oyunçu da daxil) Intelligent Driver Model (IDM) ilə məsafə saxlayır.
import { signalState } from './network.js';
import { PARKED } from '../physics.js';

const IDM = { a: 1.6, b: 2.5, s0: 2.5, T: 1.4 }; // sürətlənmə, rahat əyləc, min. məsafə, vaxt intervalı (təxmini)
const CAR_LEN = PARKED.length;

function rand(seed) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Traffic {
  constructor(net, count, seed = 1) {
    this.net = net;
    this.r = rand(seed);
    this.cars = [];
    // yalnız ən azı 25 m uzunluğunda, "service" olmayan seqmentlərdə doğulur
    this.spawnable = net.segs.filter((s) => s.len > 25 && s.road.type !== 'service');
    for (let i = 0; i < count; i++) this.spawn(null);
  }

  // Kənar istiqamətlər: hər seqment iki tərəfə (ikitərəfli) və ya bir tərəfə (birtərəfli)
  edgesFrom(node) {
    return this.net.adj.get(node) || [];
  }

  spawn(avoid) {
    for (let k = 0; k < 30; k++) {
      const s = this.spawnable[Math.floor(this.r() * this.spawnable.length)];
      if (!s) return;
      const dir = s.road.oneway || this.r() < 0.5 ? 1 : -1;
      const from = dir > 0 ? s.a : s.b, to = dir > 0 ? s.b : s.a;
      const t = 5 + this.r() * (s.len - 10);
      const car = { seg: s, from, to, dir, t, v: 0, vWish: 0, color: Math.floor(this.r() * 8), id: Math.floor(this.r() * 1e9), next: null, wait: 0 };
      this.place(car);
      if (avoid && Math.hypot(car.x - avoid.x, car.z - avoid.z) < 60) continue;
      if (this.cars.some((c) => Math.hypot(c.x - car.x, c.z - car.z) < 12)) continue;
      car.vWish = (s.road.maxspeed / 3.6) * (0.7 + this.r() * 0.25);
      car.v = car.vWish * 0.6;
      this.pickNext(car);
      this.cars.push(car);
      return car;
    }
  }

  // seqment üzərindəki mövqedən dünyaya: sağ zolağın mərkəzi
  place(car) {
    const s = car.seg;
    const fx = s.dx * car.dir, fz = s.dz * car.dir;
    const base = car.dir > 0 ? [s.ax, s.az] : [s.bx, s.bz];
    const lane = s.road.oneway ? s.halfW - this.net.city.defaults.laneWidth / 2 : s.halfW / 2;
    // sağ vektor = (−fz, fx)
    car.x = base[0] + fx * car.t - fz * lane;
    car.z = base[1] + fz * car.t + fx * lane;
    car.h = Math.atan2(fx, fz);
    car.fx = fx; car.fz = fz;
  }

  pickNext(car) {
    const opts = this.edgesFrom(car.to).filter((e) => e.to !== car.from && e.seg.road.type !== 'service');
    const all = opts.length ? opts : this.edgesFrom(car.to).filter((e) => e.to !== car.from);
    car.next = all.length ? all[Math.floor(this.r() * all.length)] : null;
  }

  // Svetofor: bu seqmentin sonunda qırmızı/sarı varsa dayanma xəttinə qədər məsafə
  signalGap(car, time) {
    // yol adına yox, istiqamət və məsafəyə görə (OSM-də yol bir neçə hissəyə bölünə bilər)
    for (const ap of this.net.approaches) {
      if (ap.dx * car.fx + ap.dz * car.fz < 0.7) continue;
      const rx = ap.x - car.x, rz = ap.z - car.z;
      const ahead = rx * car.fx + rz * car.fz;
      if (ahead < -1 || ahead > 60) continue;
      if (Math.abs(rx * car.fz - rz * car.fx) > ap.halfW + 1) continue;
      const st = signalState(ap, time);
      if (st === 'red' || (st === 'yellow' && ahead > car.v * 1.5)) return ahead - CAR_LEN / 2;
    }
    return Infinity;
  }

  // Öndəki ən yaxın maşın (eyni istiqamətdə, eyni zolaqda) — oyunçu da daxil
  leaderGap(car, player) {
    let best = Infinity, vL = 0;
    const check = (x, z, h, v, len) => {
      const rx = x - car.x, rz = z - car.z;
      const ahead = rx * car.fx + rz * car.fz;
      if (ahead <= 0 || ahead > 70) return;
      const lat = Math.abs(rx * car.fz - rz * car.fx);
      if (lat > 2.0) return;
      const same = Math.sin(h) * car.fx + Math.cos(h) * car.fz;
      if (same < 0.3 && ahead > 12) return; // qarşıdan gələn deyil, kəsişmədə dayanan maşın sayılır
      const gap = ahead - (CAR_LEN + len) / 2;
      if (gap < best) { best = gap; vL = Math.max(0, v * Math.max(0, same)); }
    };
    for (const o of this.cars) if (o !== car) check(o.x, o.z, o.h, o.v, CAR_LEN);
    if (player) check(player.cx, player.cz, player.h, player.v, player.len);
    return { gap: best, vL };
  }

  update(dt, time, player) {
    for (const car of this.cars) {
      // toqquşmadan sonra dayanır
      if (car.stunned > 0) { car.stunned -= dt; car.v = 0; car.braking = true; continue; }
      // döngədən əvvəl yavaşla
      let vTarget = car.vWish;
      const left = car.seg.len - car.t;
      if (car.next && left < 25) {
        const a1 = Math.atan2(car.fx, car.fz);
        const n = car.next.seg, nd = car.next.dir;
        const a2 = Math.atan2(n.dx * nd, n.dz * nd);
        let d = Math.abs(a2 - a1);
        if (d > Math.PI) d = 2 * Math.PI - d;
        if (d > 0.5) vTarget = Math.min(vTarget, 4 + (1 - d / Math.PI) * 5);
      }
      const { gap, vL } = this.leaderGap(car, player);
      const sig = this.signalGap(car, time);
      // IDM
      const v = car.v;
      const sStar = (lv, g) => IDM.s0 + Math.max(0, v * IDM.T + (v * (v - lv)) / (2 * Math.sqrt(IDM.a * IDM.b)));
      let acc = IDM.a * (1 - Math.pow(v / Math.max(vTarget, 0.5), 4));
      if (gap < Infinity) acc -= IDM.a * Math.pow(sStar(vL) / Math.max(gap, 0.1), 2);
      if (sig < Infinity) acc = Math.min(acc, IDM.a * (1 - Math.pow(v / Math.max(vTarget, 0.5), 4)) - IDM.a * Math.pow(sStar(0) / Math.max(sig, 0.1), 2));
      acc = Math.max(-7, Math.min(IDM.a, acc));
      car.v = Math.max(0, v + acc * dt);
      car.braking = acc < -0.5;
      car.t += car.v * dt;
      // növbəti seqmentə keç
      while (car.t > car.seg.len) {
        car.t -= car.seg.len;
        if (!car.next) { car.respawn = true; break; }
        const e = car.next;
        car.from = car.to; car.to = e.to; car.seg = e.seg; car.dir = e.dir;
        car.vWish = (e.seg.road.maxspeed / 3.6) * (0.7 + (car.id % 25) / 100);
        this.pickNext(car);
      }
      if (!car.respawn) this.place(car);
    }
    // ölü nöqtəyə çatan maşınlar oyunçudan uzaqda yenidən doğulur
    for (let i = this.cars.length - 1; i >= 0; i--) {
      if (this.cars[i].respawn) {
        const old = this.cars.splice(i, 1)[0];
        const n = this.spawn(player ? { x: player.cx, z: player.cz } : null);
        if (n) n.mesh = old.mesh;
      }
    }
  }

  // Oyunçunun fizikası üçün maneələr (OBB)
  obstacles() {
    return this.cars.map((c) => ({ cx: c.x, cz: c.z, h: c.h, hw: PARKED.width / 2, hl: CAR_LEN / 2, type: 'car', name: 'maşın', ai: c }));
  }
}
