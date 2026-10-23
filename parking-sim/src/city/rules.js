// Yol hərəkəti qaydalarının yoxlanması (Three.js-siz). Hər kadrda update() çağırılır, pozuntular toplanır.
// Qaydalar Azərbaycan YHQ-nın əsas tələblərinə yaxındır; cərimə xalları oyun üçündür (rəsmi deyil).
import { signalState } from './network.js';

export const RULES = {
  speed: { name: 'Sürət həddini aşma', points: 5 },
  speedHigh: { name: 'Sürət həddini 20 km/saatdan çox aşma', points: 15, critical: true },
  redLight: { name: 'Qırmızı işıqda keçmə', points: 20, critical: true },
  wrongWay: { name: 'Birtərəfli yolda əks istiqamətdə hərəkət', points: 20, critical: true },
  oncoming: { name: 'Qarşı hərəkət zolağına çıxma', points: 15, critical: true },
  offRoad: { name: 'Yolun hərəkət hissəsindən çıxma', points: 10 },
  noSignal: { name: 'Dönmə siqnalı verilmədi', points: 5 },
  stopSign: { name: '“STOP” nişanında tam dayanmamaq', points: 10 },
  collision: { name: 'Toqquşma', points: 25, critical: true },
};

export class RuleMonitor {
  constructor(net) {
    this.net = net;
    this.violations = [];
    this.warning = '';
    this.timers = { speed: 0, speedHigh: 0, offRoad: 0, wrongWay: 0, oncoming: 0 };
    this.cooldown = {};
    this.prevAp = new Map(); // yanaşma → əvvəlki işarəli məsafə
    this.turn = null;
    this.limit = net.city.defaults.urbanLimit;
    this.road = null;
  }

  add(key, time, extra = '') {
    if ((this.cooldown[key] || -99) > time) return null;
    this.cooldown[key] = time + 6;
    const v = { key, ...RULES[key], time, extra };
    this.violations.push(v);
    return v;
  }

  // car: { x, z, h, v (m/s), frontX, frontZ }, blinker, time
  update(dt, car, blinker, time) {
    const events = [];
    const push = (v) => { if (v) events.push(v); };
    const m = this.net.match(car.x, car.z, car.h);
    const moving = Math.abs(car.v) > 0.8;
    const kmh = Math.abs(car.v) * 3.6;
    this.warning = '';
    if (m && m.onRoad) {
      this.road = m.seg.road;
      this.limit = m.seg.road.maxspeed;
    }

    // sürət
    const over = kmh - this.limit;
    this.timers.speed = over > 10 ? this.timers.speed + dt : 0;
    this.timers.speedHigh = over > 20 ? this.timers.speedHigh + dt : 0;
    if (over > 0) this.warning = `Sürət həddi ${this.limit} km/saat`;
    if (this.timers.speedHigh > 1.5) push(this.add('speedHigh', time, `${Math.round(kmh)}/${this.limit}`));
    else if (this.timers.speed > 2) push(this.add('speed', time, `${Math.round(kmh)}/${this.limit}`));

    if (m) {
      const fwd = car.v >= 0 ? 1 : -1;
      const along = m.align * fwd; // hərəkət istiqamətinin seqmentlə uyğunluğu
      // yoldan çıxma (kəsişmələrdə yaxın yol dəyişə bilər — 1 san tolerans)
      this.timers.offRoad = !m.onRoad && moving ? this.timers.offRoad + dt : 0;
      if (this.timers.offRoad > 1) push(this.add('offRoad', time));
      if (m.onRoad && moving && Math.abs(m.align) > 0.6) {
        const r = m.seg.road;
        if (r.oneway) {
          this.timers.wrongWay = along < -0.6 ? this.timers.wrongWay + dt : 0;
          if (this.timers.wrongWay > 1) push(this.add('wrongWay', time, r.name));
        } else {
          // ikitərəfli yolda sağ tərəflə hərəkət: sol tərəfdə olmaq = qarşı zolaq
          const leftSide = m.lateral * Math.sign(along) > 0.4;
          this.timers.oncoming = leftSide && !this.nearJunction(car.x, car.z) ? this.timers.oncoming + dt : 0;
          if (this.timers.oncoming > 1.2) push(this.add('oncoming', time, r.name));
        }
      }
    }

    // svetofor: dayanma xəttini qırmızıda keçmək
    for (const ap of this.net.approaches) {
      const rx = car.frontX - ap.x, rz = car.frontZ - ap.z;
      if (Math.abs(rx) > 40 || Math.abs(rz) > 40) { this.prevAp.delete(ap); continue; }
      const s = rx * ap.dx + rz * ap.dz; // + : xətti keçib
      const lat = Math.abs(rx * ap.dz - rz * ap.dx);
      const heading = Math.sin(car.h) * ap.dx + Math.cos(car.h) * ap.dz;
      const prev = this.prevAp.get(ap);
      this.prevAp.set(ap, s);
      if (lat > ap.halfW + 1 || heading < 0.6) continue;
      const st = signalState(ap, time);
      if (s < 0 && s > -25 && st !== 'green') this.warning = st === 'red' ? 'Qırmızı işıq — dayanın' : 'Sarı işıq';
      if (prev !== undefined && prev < 0 && s >= 0 && st === 'red') push(this.add('redLight', time));
    }

    // dönmə siqnalı: kəsişmədə 40°-dən çox dönmə
    const nj = this.nearJunction(car.x, car.z);
    if (nj && !this.turn) this.turn = { h0: car.h, node: nj, sig: blinker };
    if (this.turn) {
      if (blinker) this.turn.sig = blinker;
      if (!nj || nj !== this.turn.node) {
        let d = car.h - this.turn.h0;
        while (d > Math.PI) d -= 2 * Math.PI;
        while (d < -Math.PI) d += 2 * Math.PI;
        if (Math.abs(d) > 0.7 && car.v > 0) {
          const need = d > 0 ? 'L' : 'R';
          if (this.turn.sig !== need) push(this.add('noSignal', time, need === 'L' ? 'sola' : 'sağa'));
        }
        this.turn = null;
      }
    }
    return events;
  }

  nearJunction(x, z) {
    for (const s of this.net.segsNear(x, z)) {
      for (const id of [s.a, s.b]) {
        if ((this.net.junction.get(id) || 0) < 3) continue;
        const [nx, nz] = this.net.pos.get(id);
        if (Math.hypot(nx - x, nz - z) < Math.max(10, s.halfW + 6)) return id;
      }
    }
    return null;
  }

  collision(time) {
    return this.add('collision', time);
  }

  summary() {
    const points = this.violations.reduce((a, v) => a + v.points, 0);
    const critical = this.violations.filter((v) => v.critical);
    return { points, critical, passed: critical.length === 0 && points <= 15 };
  }
}
