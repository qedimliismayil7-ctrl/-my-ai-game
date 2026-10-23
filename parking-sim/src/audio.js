// Səslər: park sensoru, mühərrik, toqquşma, siqnal relesi, uğur. Hamısı WebAudio ilə yaradılır (fayl yoxdur).

export class Sound {
  constructor() {
    this.ctx = null;
    this.volume = 0.7;
    this.beepTimer = 0;
    this.continuous = null;
  }

  // İstifadəçi jestindən sonra çağırılmalıdır
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(this.ctx.destination);
      this.startEngine();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  setVolume(v) {
    this.volume = v;
    if (this.master) this.master.gain.value = v;
  }

  tone(freq, dur, type = 'sine', gain = 0.25, when = 0) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + when;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.005);
    g.gain.setValueAtTime(gain, t + dur - 0.01);
    g.gain.linearRampToValueAtTime(0, t + dur);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  startEngine() {
    const c = this.ctx;
    this.eng = c.createOscillator();
    this.eng.type = 'sawtooth';
    this.eng.frequency.value = 38;
    this.engSub = c.createOscillator();
    this.engSub.type = 'sine';
    this.engSub.frequency.value = 19;
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 220;
    this.engGain = c.createGain();
    this.engGain.gain.value = 0.0;
    this.eng.connect(lp);
    this.engSub.connect(lp);
    lp.connect(this.engGain).connect(this.master);
    this.eng.start();
    this.engSub.start();
  }

  engine(throttle, speed, running) {
    if (!this.ctx || !this.eng) return;
    const t = this.ctx.currentTime;
    const f = 34 + throttle * 30 + speed * 4;
    this.eng.frequency.setTargetAtTime(f, t, 0.15);
    this.engSub.frequency.setTargetAtTime(f / 2, t, 0.15);
    this.engGain.gain.setTargetAtTime(running ? 0.05 + throttle * 0.06 : 0, t, 0.2);
  }

  // Park sensoru: məsafə (m) azaldıqca siqnal sürətlənir, ~0.3 m-dən az — fasiləsiz.
  sensors(front, rear, dt, enabled) {
    if (!this.ctx) return;
    const d = Math.min(front, rear);
    const isFront = front < rear;
    const range = isFront ? 1.2 : 1.6;
    if (!enabled || d > range) {
      this.stopContinuous();
      this.beepTimer = 0;
      return;
    }
    const freq = isFront ? 1250 : 980;
    if (d < 0.3) {
      if (!this.continuous) {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.frequency.value = freq;
        g.gain.value = 0.12;
        o.connect(g).connect(this.master);
        o.start();
        this.continuous = { o, g };
      }
      return;
    }
    this.stopContinuous();
    const interval = 0.08 + ((d - 0.3) / (range - 0.3)) * 0.62;
    this.beepTimer -= dt;
    if (this.beepTimer <= 0) {
      this.tone(freq, 0.07, 'sine', 0.16);
      this.beepTimer = interval;
    }
  }

  stopContinuous() {
    if (this.continuous) {
      const { o, g } = this.continuous;
      g.gain.setTargetAtTime(0, this.ctx.currentTime, 0.01);
      o.stop(this.ctx.currentTime + 0.05);
      this.continuous = null;
    }
  }

  crash(strength = 1) {
    if (!this.ctx) return;
    const c = this.ctx;
    const len = 0.35;
    const buf = c.createBuffer(1, c.sampleRate * len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 3);
    const src = c.createBufferSource();
    src.buffer = buf;
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 600;
    const g = c.createGain();
    g.gain.value = 0.5 * Math.min(1, 0.4 + strength);
    src.connect(lp).connect(g).connect(this.master);
    src.start();
    this.tone(70, 0.18, 'sine', 0.35);
  }

  // təkərin bordürə yumşaq dirənməsi (metal zərbə yox)
  bump(strength = 0.3) {
    this.tone(55, 0.12, 'sine', 0.2 + Math.min(0.2, strength * 0.3));
  }

  tick(on) {
    this.tone(on ? 1800 : 1400, 0.012, 'square', 0.06);
  }

  shift() {
    this.tone(220, 0.04, 'square', 0.05);
  }

  warn() {
    this.tone(440, 0.12, 'triangle', 0.15);
    this.tone(330, 0.15, 'triangle', 0.15, 0.13);
  }

  success() {
    [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.16, 'triangle', 0.18, i * 0.12));
  }

  step() {
    this.tone(880, 0.06, 'sine', 0.1);
    this.tone(1320, 0.08, 'sine', 0.1, 0.06);
  }

  stopAll() {
    this.stopContinuous();
    this.engine(0, 0, false);
  }
}

// Səsli təlimatçı (brauzerdə Azərbaycan və ya Türk səsi varsa)
export function speak(text) {
  if (!('speechSynthesis' in window)) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const voices = synth.getVoices();
  const v = voices.find((x) => x.lang.toLowerCase().startsWith('az')) || voices.find((x) => x.lang.toLowerCase().startsWith('tr'));
  if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'az-AZ';
  u.rate = 1.0;
  synth.speak(u);
}
