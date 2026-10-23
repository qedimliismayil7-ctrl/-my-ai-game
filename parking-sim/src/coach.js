// Təlimatçı: səviyyənin addımlarını maşının vəziyyətinə görə izləyir və real istinad nöqtələri ilə yol göstərir.
import { DEG, wrapAngle } from './physics.js';

const STOP = 0.06; // m/s — "dayanıb" sayılır

export class Coach {
  constructor(steps) {
    this.steps = steps;
    this.i = 0;
    this.doneAll = false;
    this.lastText = '';
  }

  get step() { return this.steps[this.i]; }

  // ctx: { x, z, h, v, delta, gear, steer, blinker, clear: {front, rear} } — clear: bamperdən maneəyə həndəsi məsafə
  // Qaytarır: { text, hint, status ('go'|'stop'|'back'|'ok'), stepNo, total, ghost, advanced }
  update(ctx) {
    if (this.doneAll || !this.step) {
      return { text: 'Hazırdır — P və ya ✓', hint: '', remain: '', status: 'ok', stepNo: this.steps.length, total: this.steps.length };
    }
    const s = this.step;
    const stopped = Math.abs(ctx.v) < STOP;
    let text = s.text, hint = s.hint || '', remain = '', status = 'go', done = false, rem = 0;

    switch (s.check) {
      case 'gear':
        done = ctx.gear === s.to;
        break;
      case 'signal':
        done = ctx.blinker === s.to;
        break;
      case 'steer': {
        const diff = s.to - ctx.steer;
        done = s.to === 0 ? Math.abs(diff) < 0.03 : Math.abs(diff) < 0.01;
        if (!done) {
          remain = `${Math.round(Math.abs(diff) * 446)}° ${diff > 0 ? 'sağa' : 'sola'}`;
          if (!stopped) hint = 'Dayanıb çevirsəniz daha dəqiq olar';
        }
        break;
      }
      case 'goto': {
        const val = s.axis === 'x' ? ctx.x : ctx.z;
        rem = (s.to - val) * s.sign;
        const lead = (ctx.v * ctx.v) / 14; // əyləc yolu
        if (rem < -s.tol) {
          status = 'back';
          text = `Keçdiniz — ${(-rem).toFixed(1)} m geri`;
          hint = 'Dayanın, istiqaməti dəyişib geri qayıdın';
        } else if (rem - lead > 0.04) {
          remain = `${rem.toFixed(1)} m`;
          if (rem < 1.5) { status = 'slow'; text = 'Yavaşlayın'; }
          done = stopped && rem <= s.tol;
        } else {
          status = 'stop';
          text = 'DAYANIN!';
          done = stopped;
        }
        break;
      }
      case 'turn': {
        const rem = wrapAngle(s.to - ctx.h) / DEG * s.sign;
        const lead = ((ctx.v * ctx.v) / 14) * Math.abs(Math.tan(ctx.delta || 0.6)) / 2.7 / DEG;
        if (rem < -s.tol * 2.5) {
          status = 'back';
          text = `Çox döndünüz (${Math.round(-rem)}°)`;
          hint = 'Dayanın, istiqaməti dəyişib düzəldin';
          done = stopped && rem > -s.tol * 4;
        } else if (rem - lead > 0.5) {
          remain = `${Math.round(rem)}°`;
          if (rem < 12) status = 'slow';
          done = stopped && rem <= s.tol;
        } else {
          status = 'stop';
          text = 'DAYANIN!';
          done = stopped;
        }
        break;
      }
      case 'clear':
      case 'sensor': {
        const d = ctx.clear[s.which];
        const lead = (ctx.v * ctx.v) / 14;
        if (d - lead > s.below) {
          remain = d < 3 ? `${d.toFixed(2)} m` : '';
        } else {
          status = 'stop';
          text = 'DAYANIN!';
          done = stopped;
        }
        break;
      }
      case 'park':
        done = ctx.gear === 'P' && !ctx.blinker;
        if (ctx.gear === 'P' && ctx.blinker) hint = 'Siqnalı söndürün';
        break;
      default:
        done = true;
    }

    let advanced = false;
    if (done) {
      this.i++;
      advanced = true;
      if (this.i >= this.steps.length) this.doneAll = true;
    }
    return { text, hint, remain, status, rem, step: s, stepNo: this.i + 1, total: this.steps.length, ghost: s.ghost || null, advanced };
  }
}
