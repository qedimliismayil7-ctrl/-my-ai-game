// Telefon/planşet üçün ekran idarəsi: sükan (fırlanan və ya sürüşdürmə), qaz və əyləc pedalları, ötürmə və digər düymələr.
// Düymələr klaviatura kodlarını input.pressed-ə əlavə edir, ona görə oyun məntiqi dəyişmir.
// settings: { touchMode: 'wheel'|'slider', touchSens: 1..4, touchSize: 0.8..1.4, touchSwap: bool } — canlı oxunur.
import { clamp } from './physics.js';

export function isTouchDevice() {
  return matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
}

export function setupTouch(input, settings) {
  const root = document.createElement('div');
  root.id = 'touch';
  root.className = 'hidden';
  root.innerHTML = `
    <div class="t-steer">
      <div class="t-wheel" id="tWheel">
        <svg viewBox="-60 -60 120 120"><circle r="52" fill="rgba(20,24,28,.55)" stroke="#d8dee4" stroke-width="9"/>
        <path d="M-50 0H50M0 0V50" stroke="#d8dee4" stroke-width="9"/><circle r="12" fill="#d8dee4"/>
        <rect x="-5" y="-61" width="10" height="14" fill="#ff9a2e"/></svg>
      </div>
      <div class="t-slider" id="tSlider"><i></i><b></b></div>
      <span class="t-deg" id="tDeg">0°</span>
    </div>
    <div class="t-pedals">
      <div class="t-pedal brake" id="tBrake"><i></i><span>Əyləc</span></div>
      <div class="t-pedal gas" id="tGas"><i></i><span>Qaz</span></div>
    </div>
    <div class="t-center">
      <div class="t-misc">
        <button data-key="KeyZ" aria-label="Sol siqnal">◀</button>
        <button data-key="KeyX" aria-label="Sağ siqnal">▶</button>
        <button id="tStraight" aria-label="Sükanı düzəlt">⟲ Düz</button>
        <button data-hold="KeyB" aria-label="Arxaya bax">👀</button>
        <button data-key="KeyC" aria-label="Kamera">📷</button>
        <button data-key="Enter" aria-label="Bitir">✓</button>
        <button data-key="Escape" aria-label="Menyu">☰</button>
      </div>
      <div class="t-gears">
        <button data-key="Digit1">P</button><button data-key="Digit2">R</button>
        <button data-key="Digit3">N</button><button data-key="Digit4">D</button>
      </div>
    </div>`;
  document.body.appendChild(root);

  const state = { active: false, steer: 0, throttle: 0, brake: 0 };
  input.touch = state;
  const sens = () => settings.touchSens || 2;

  // Fırlanan sükan: barmağın bucaq dəyişməsi × həssaslıq
  const wheel = root.querySelector('#tWheel');
  const svg = wheel.querySelector('svg');
  let grab = null;
  const angleOf = (e) => {
    const r = svg.getBoundingClientRect();
    return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2));
  };
  wheel.addEventListener('pointerdown', (e) => {
    wheel.setPointerCapture(e.pointerId);
    grab = { id: e.pointerId, a: angleOf(e) };
    e.preventDefault();
  });
  wheel.addEventListener('pointermove', (e) => {
    if (!grab || e.pointerId !== grab.id) return;
    const a = angleOf(e);
    let d = a - grab.a;
    if (d > Math.PI) d -= 2 * Math.PI;
    if (d < -Math.PI) d += 2 * Math.PI;
    grab.a = a;
    state.steer = clamp(state.steer + ((d * 180) / Math.PI / 450) * sens(), -1, 1);
  });

  // Sürüşdürmə: barmağı sağa-sola çəkmək; buraxanda yerində qalır
  const slider = root.querySelector('#tSlider');
  let sgrab = null;
  slider.addEventListener('pointerdown', (e) => {
    slider.setPointerCapture(e.pointerId);
    sgrab = { id: e.pointerId, x: e.clientX };
    e.preventDefault();
  });
  slider.addEventListener('pointermove', (e) => {
    if (!sgrab || e.pointerId !== sgrab.id) return;
    const half = slider.getBoundingClientRect().width / 2;
    state.steer = clamp(state.steer + ((e.clientX - sgrab.x) / half) * (sens() / 2), -1, 1);
    sgrab.x = e.clientX;
  });
  for (const el of [wheel, slider]) {
    const up = () => { grab = null; sgrab = null; };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  }
  root.querySelector('#tStraight').addEventListener('pointerdown', (e) => {
    e.preventDefault();
    state.steer = 0;
  });

  // Pedallar: barmağı yuxarı sürüşdürdükcə daha çox basılır
  const pedals = [];
  for (const [id, key] of [['#tBrake', 'brake'], ['#tGas', 'throttle']]) {
    const el = root.querySelector(id);
    const bar = el.querySelector('i');
    const set = (e) => {
      const r = el.getBoundingClientRect();
      const v = clamp(1 - (e.clientY - r.top) / r.height, 0.15, 1);
      state[key] = key === 'brake' ? Math.min(1, v * 1.15) : v;
      bar.style.height = state[key] * 100 + '%';
    };
    el.addEventListener('pointerdown', (e) => { el.setPointerCapture(e.pointerId); set(e); e.preventDefault(); });
    el.addEventListener('pointermove', (e) => { if (el.hasPointerCapture(e.pointerId)) set(e); });
    const up = () => { state[key] = 0; bar.style.height = '0%'; };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('lostpointercapture', up);
    pedals.push(up);
  }

  // Düymələr
  root.querySelectorAll('[data-key]').forEach((b) => {
    b.addEventListener('pointerdown', (e) => { input.pressed.add(b.dataset.key); e.preventDefault(); });
  });
  root.querySelectorAll('[data-hold]').forEach((b) => {
    b.addEventListener('pointerdown', (e) => { input.keys.add(b.dataset.hold); e.preventDefault(); });
    const up = () => input.keys.delete(b.dataset.hold);
    b.addEventListener('pointerup', up);
    b.addEventListener('pointercancel', up);
  });

  return {
    show(on) {
      state.active = on;
      root.classList.toggle('hidden', !on);
      document.body.classList.toggle('touch-ui', on);
      this.applyLayout();
    },
    applyLayout() {
      root.style.setProperty('--ts', settings.touchSize || 1);
      root.classList.toggle('swap', !!settings.touchSwap);
      root.classList.toggle('slider', settings.touchMode === 'slider');
    },
    // Tətbiqdən çıxanda: pedallar buraxılır (sükan yerində qalır, real maşın kimi)
    release() {
      grab = null; sgrab = null;
      for (const up of pedals) up();
      input.keys.delete('KeyB');
    },
    update(car) {
      svg.style.transform = `rotate(${car.wheelDeg}deg)`;
      root.querySelector('#tSlider b').style.left = `${50 + car.steer * 50}%`;
      root.querySelector('#tDeg').textContent = Math.round(car.wheelDeg) + '°';
      root.querySelectorAll('.t-gears button').forEach((b) => b.classList.toggle('on', b.textContent === car.gear));
    },
  };
}
