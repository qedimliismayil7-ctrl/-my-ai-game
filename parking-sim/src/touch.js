// Telefon/planşet üçün ekran idarəsi: fırlanan sükan, qaz və əyləc pedalları, ötürmə və digər düymələr.
// Düymələr klaviatura kodlarını input.pressed-ə əlavə edir, ona görə oyun məntiqi dəyişmir.
import { clamp } from './physics.js';

export function isTouchDevice() {
  return matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
}

export function setupTouch(input) {
  const root = document.createElement('div');
  root.id = 'touch';
  root.className = 'hidden';
  root.innerHTML = `
    <div class="t-wheel" id="tWheel">
      <svg viewBox="-60 -60 120 120"><circle r="52" fill="rgba(20,24,28,.55)" stroke="#d8dee4" stroke-width="9"/>
      <path d="M-50 0H50M0 0V50" stroke="#d8dee4" stroke-width="9"/><circle r="12" fill="#d8dee4"/>
      <rect x="-5" y="-61" width="10" height="14" fill="#ff9a2e"/></svg>
      <span id="tWheelDeg">0°</span>
    </div>
    <div class="t-gears">
      <button data-key="Digit1">P</button><button data-key="Digit2">R</button>
      <button data-key="Digit3">N</button><button data-key="Digit4">D</button>
    </div>
    <div class="t-pedals">
      <div class="t-pedal brake" id="tBrake"><i></i><span>Əyləc</span></div>
      <div class="t-pedal gas" id="tGas"><i></i><span>Qaz</span></div>
    </div>
    <div class="t-top">
      <button data-key="KeyZ">◀</button><button data-key="KeyX">▶</button>
      <button data-key="KeyC">📷</button><button data-hold="KeyB">👀</button>
      <button data-key="KeyH">👨‍🏫</button><button data-key="Enter">✓</button><button data-key="Escape">☰</button>
    </div>`;
  document.body.appendChild(root);

  const state = { active: false, steer: 0, throttle: 0, brake: 0 };
  input.touch = state;

  // Sükan: barmağın bucaq dəyişməsi sükanı çevirir (±450°), real sükan kimi buraxanda yerində qalır
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
    state.steer = clamp(state.steer + (d * 180) / Math.PI / 450, -1, 1);
  });
  const release = () => { grab = null; };
  wheel.addEventListener('pointerup', release);
  wheel.addEventListener('pointercancel', release);
  wheel.addEventListener('dblclick', () => { state.steer = 0; });

  // Pedallar: barmağı yuxarı sürüşdürdükcə daha çox basılır (aşağı hissə — yüngül)
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
    el.addEventListener('pointermove', (e) => { if (e.buttons || e.pressure) set(e); });
    const up = () => { state[key] = 0; bar.style.height = '0%'; };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
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
    },
    update(car) {
      svg.style.transform = `rotate(${car.wheelDeg}deg)`;
      root.querySelector('#tWheelDeg').textContent = Math.round(car.wheelDeg) + '°';
      root.querySelectorAll('.t-gears button').forEach((b) => b.classList.toggle('on', b.textContent === car.gear));
    },
  };
}
