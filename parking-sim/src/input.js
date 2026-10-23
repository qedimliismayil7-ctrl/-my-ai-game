// Giriş: klaviatura + Gamepad API (oyun sükanı). Kalibrasiya xəritəsi localStorage-da saxlanır.
import { clamp } from './physics.js';

const STORE = 'park-sim-wheel-map';

function load(key, def) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch { return def; }
}
function save(key, v) {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* yaddaş əlçatmazdır */ }
}

export class Input {
  constructor() {
    this.keys = new Set();
    this.pressed = new Set(); // bu kadrda basılan düymələr
    this.kbSteer = 0;
    this.maps = load(STORE, {});
    this.padIndex = null;
    this.prevButtons = [];
    this.padEvents = [];
    this.state = { steer: 0, throttle: 0, brake: 0, clutch: 0, handbrake: false, source: 'keyboard' };

    addEventListener('keydown', (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT')) return;
      if (!this.keys.has(e.code)) this.pressed.add(e.code);
      this.keys.add(e.code);
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    });
    addEventListener('keyup', (e) => this.keys.delete(e.code));
    addEventListener('blur', () => this.keys.clear());
    addEventListener('gamepadconnected', (e) => {
      if (this.padIndex === null) this.padIndex = e.gamepad.index;
    });
    addEventListener('gamepaddisconnected', (e) => {
      if (this.padIndex === e.gamepad.index) this.padIndex = null;
    });
  }

  pad() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    if (this.padIndex !== null && pads[this.padIndex]) return pads[this.padIndex];
    for (const p of pads) if (p && p.connected) { this.padIndex = p.index; return p; }
    return null;
  }

  get map() {
    const p = this.pad();
    return p ? this.maps[p.id] || null : null;
  }

  saveMap(id, map) {
    this.maps[id] = map;
    save(STORE, this.maps);
  }

  // Kadrda bir dəfə çağırılır. Qaytarır: idarəetmə vəziyyəti və düymə hadisələri.
  poll(dt) {
    const k = this.keys;
    const left = k.has('KeyA') || k.has('ArrowLeft');
    const right = k.has('KeyD') || k.has('ArrowRight');
    // klaviatura sükanı: əllə çevrilən sükan kimi — buraxanda yerində qalır
    const rate = (k.has('ShiftLeft') || k.has('ShiftRight') ? 2.0 : 1.0) * (this.steerRate ?? 1);
    if (left) this.kbSteer -= rate * dt;
    if (right) this.kbSteer += rate * dt;
    // şəhərdə: düymə buraxılanda sükan özü mərkəzə qayıdır (sürətdən asılı)
    if (!left && !right && this.selfCenter) this.kbSteer -= Math.sign(this.kbSteer) * Math.min(Math.abs(this.kbSteer), this.selfCenter * dt);
    if (k.has('KeyK')) this.kbSteer *= Math.max(0, 1 - 6 * dt);
    this.kbSteer = clamp(this.kbSteer, -1, 1);

    let steer = this.kbSteer;
    let throttle = k.has('KeyW') || k.has('ArrowUp') ? 1 : 0;
    let brake = k.has('KeyS') || k.has('ArrowDown') ? 1 : 0;
    let clutch = 0;
    let source = 'keyboard';
    this.padEvents = [];

    const p = this.pad();
    const m = this.map;
    if (p && m) {
      source = 'wheel';
      const ax = (i) => (i != null && p.axes[i] != null ? p.axes[i] : 0);
      if (m.steer) {
        const v = ax(m.steer.axis);
        const c = m.steer.center;
        let s = v >= c ? (v - c) / (m.steer.right - c) : -(v - c) / (m.steer.left - c);
        if (!isFinite(s)) s = 0;
        s = clamp(s, -1, 1);
        if (Math.abs(s) < 0.004) s = 0;
        if (!left && !right) { steer = s; this.kbSteer = s; }
      }
      const pedal = (cfg) => {
        if (!cfg) return 0;
        const v = ax(cfg.axis);
        const r = (v - cfg.rest) / (cfg.pressed - cfg.rest);
        return clamp(isFinite(r) ? r : 0, 0, 1);
      };
      const dz = (x) => (x < 0.03 ? 0 : (x - 0.03) / 0.97);
      throttle = Math.max(throttle, dz(pedal(m.throttle)));
      brake = Math.max(brake, dz(pedal(m.brake)));
      clutch = dz(pedal(m.clutch));
      // düymələr
      const btn = (i) => i != null && p.buttons[i] && p.buttons[i].pressed;
      for (const name of ['D', 'R', 'N', 'P', 'up', 'down', 'sigL', 'sigR', 'cam']) {
        const i = m.buttons?.[name];
        const now = btn(i);
        if (now && !this.prevButtons[i]) this.padEvents.push(name);
      }
      this.prevButtons = p.buttons.map((b) => b.pressed);
    } else if (p) {
      source = 'pad-uncalibrated';
    }

    const t = this.touch;
    if (t && t.active) {
      if (left || right) t.steer = this.kbSteer;
      else if (source !== 'wheel') { steer = t.steer; this.kbSteer = t.steer; }
      throttle = Math.max(throttle, t.throttle);
      brake = Math.max(brake, t.brake);
      if (source === 'keyboard') source = 'touch';
    }

    this.state = {
      steer, throttle, brake, clutch,
      handbrake: k.has('Space'),
      source,
    };
    return this.state;
  }

  consume(code) {
    if (this.pressed.has(code)) { this.pressed.delete(code); return true; }
    return false;
  }

  endFrame() {
    this.pressed.clear();
  }

  rumble(strong, weak, ms) {
    const p = this.pad();
    const act = p && p.vibrationActuator;
    if (act && act.playEffect) {
      act.playEffect(act.type || 'dual-rumble', { duration: ms, strongMagnitude: clamp(strong, 0, 1), weakMagnitude: clamp(weak, 0, 1) }).catch(() => {});
    } else if (p && p.hapticActuators && p.hapticActuators[0]) {
      p.hapticActuators[0].pulse(clamp(strong, 0, 1), ms).catch?.(() => {});
    }
  }

  get hasFFB() {
    const p = this.pad();
    return !!(p && (p.vibrationActuator || (p.hapticActuators && p.hapticActuators.length)));
  }
}

// ---------- Kalibrasiya ----------
// Addım-addım: dinc vəziyyət → sükan sol → sükan sağ → pedallar → düymələr.

const STEPS = [
  { id: 'rest', text: 'Sükanı mərkəzdə saxlayın, pedallara toxunmayın…', kind: 'rest' },
  { id: 'left', text: 'Sükanı TAM SOLA çevirin və saxlayın', kind: 'steerL' },
  { id: 'right', text: 'İndi sükanı TAM SAĞA çevirin və saxlayın', kind: 'steerR' },
  { id: 'center', text: 'Sükanı mərkəzə qaytarın', kind: 'center' },
  { id: 'throttle', text: 'QAZ pedalını sona qədər basın və saxlayın', kind: 'pedal', key: 'throttle' },
  { id: 'brake', text: 'ƏYLƏC pedalını sona qədər basın və saxlayın', kind: 'pedal', key: 'brake' },
  { id: 'clutch', text: 'DEBRİYAJ pedalını basın (yoxdursa “Keç”)', kind: 'pedal', key: 'clutch', optional: true },
  { id: 'bD', text: 'D (irəli) üçün düyməni basın', kind: 'button', key: 'D', optional: true },
  { id: 'bR', text: 'R (geri) üçün düyməni basın', kind: 'button', key: 'R', optional: true },
  { id: 'bN', text: 'N (neytral) üçün düyməni basın', kind: 'button', key: 'N', optional: true },
  { id: 'bP', text: 'P (park) üçün düyməni basın', kind: 'button', key: 'P', optional: true },
  { id: 'bUp', text: 'Ötürmə YUXARI (P→R→N→D) — məsələn sağ ləçək', kind: 'button', key: 'up', optional: true },
  { id: 'bDown', text: 'Ötürmə AŞAĞI (D→N→R→P) — məsələn sol ləçək', kind: 'button', key: 'down', optional: true },
  { id: 'bSigL', text: 'SOL dönmə siqnalı üçün düymə', kind: 'button', key: 'sigL', optional: true },
  { id: 'bSigR', text: 'SAĞ dönmə siqnalı üçün düymə', kind: 'button', key: 'sigR', optional: true },
  { id: 'bCam', text: 'Kamera dəyişmək üçün düymə', kind: 'button', key: 'cam', optional: true },
];

export class Calibrator {
  constructor(input) {
    this.input = input;
    this.reset();
  }

  reset() {
    this.i = 0;
    this.map = { buttons: {} };
    this.rest = null;
    this.timer = 0;
    this.phase = 0;
    this.candidate = null;
    this.used = new Set();
    this.done = false;
    this.prevBtn = null;
  }

  get step() { return STEPS[this.i]; }
  get total() { return STEPS.length; }

  skip() {
    if (this.step?.optional) this.next();
  }

  next() {
    this.i++;
    this.timer = 0;
    this.phase = 0;
    this.candidate = null;
    this.prevBtn = null;
    if (this.i >= STEPS.length) this.finish();
  }

  finish() {
    this.done = true;
    const p = this.input.pad();
    if (p) this.input.saveMap(p.id, this.map);
  }

  // Qaytarır: { text, sub, progress }
  update(dt) {
    const p = this.input.pad();
    if (!p) return { text: 'Sükan tapılmadı. Sükanı qoşun və istənilən düyməni basın.', sub: '', progress: 0 };
    if (this.done) return { text: 'Kalibrasiya tamamlandı!', sub: '', progress: 1 };
    const s = this.step;
    const axes = p.axes.slice();
    let sub = '';

    if (s.kind === 'rest') {
      this.timer += dt;
      if (!this.rest) this.rest = axes.slice();
      else for (let a = 0; a < axes.length; a++) this.rest[a] = this.rest[a] * 0.9 + axes[a] * 0.1;
      sub = 'Gözləyin…';
      if (this.timer > 1.2) this.next();
    } else if (s.kind === 'steerL' || s.kind === 'steerR') {
      if (s.kind === 'steerL') {
        let best = -1, bd = 0.45;
        for (let a = 0; a < axes.length; a++) {
          const d = Math.abs(axes[a] - this.rest[a]);
          if (d > bd) { bd = d; best = a; }
        }
        if (best >= 0) this.holdCheck(dt, best, axes[best], () => {
          this.map.steer = { axis: best, center: this.rest[best], left: axes[best] };
          this.used.add(best);
          this.next();
        });
      } else {
        const a = this.map.steer.axis;
        const d = axes[a] - this.map.steer.center;
        const dl = this.map.steer.left - this.map.steer.center;
        if (Math.sign(d) !== Math.sign(dl) && Math.abs(d) > 0.45) this.holdCheck(dt, a, axes[a], () => {
          this.map.steer.right = axes[a];
          this.next();
        });
      }
      sub = 'Saxlayın…';
    } else if (s.kind === 'center') {
      const a = this.map.steer.axis;
      const span = Math.abs(this.map.steer.right - this.map.steer.left);
      if (Math.abs(axes[a] - this.map.steer.center) < span * 0.06) {
        this.timer += dt;
        if (this.timer > 0.6) {
          this.map.steer.center = axes[a];
          this.next();
        }
      } else this.timer = 0;
    } else if (s.kind === 'pedal') {
      if (this.phase === 0) {
        let best = -1, bd = 0.5;
        for (let a = 0; a < axes.length; a++) {
          if (this.used.has(a)) continue;
          const d = Math.abs(axes[a] - this.rest[a]);
          if (d > bd) { bd = d; best = a; }
        }
        sub = 'Basıb saxlayın…';
        if (best >= 0) this.holdCheck(dt, best, axes[best], () => {
          this.candidate = { axis: best, pressed: axes[best] };
          this.phase = 1;
          this.timer = 0;
        });
      } else {
        const c = this.candidate;
        sub = 'İndi pedalı BURAXIN';
        if (Math.abs(axes[c.axis] - c.pressed) > 0.5) this.holdCheck(dt, c.axis, axes[c.axis], () => {
          this.map[s.key] = { axis: c.axis, rest: axes[c.axis], pressed: c.pressed };
          this.used.add(c.axis);
          this.rest[c.axis] = axes[c.axis];
          this.next();
        });
      }
    } else if (s.kind === 'button') {
      const now = p.buttons.map((b) => b.pressed);
      if (!this.prevBtn) this.prevBtn = now;
      for (let b = 0; b < now.length; b++) {
        if (now[b] && !this.prevBtn[b]) {
          this.map.buttons[s.key] = b;
          this.prevBtn = null;
          this.next();
          return { text: STEPS[this.i - 1].text, sub: `Düymə #${b} təyin edildi`, progress: this.i / STEPS.length };
        }
      }
      this.prevBtn = now;
    }
    return { text: s.text, sub, progress: this.i / STEPS.length };
  }

  holdCheck(dt, axis, value, ok) {
    if (this.hold && this.hold.axis === axis && Math.abs(this.hold.value - value) < 0.04) {
      this.hold.t += dt;
      if (this.hold.t > 0.5) { this.hold = null; ok(); }
    } else {
      this.hold = { axis, value, t: 0 };
    }
  }
}
