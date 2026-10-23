import * as THREE from 'three';
import './style.css';
import { CarPhysics, CAR, SPEC, GEARS, toWorld, carBox } from './physics.js';
import { buildCar, updateCarVisual, buildGhost, LAYER, VIEW } from './carModel.js';
import { buildWorld } from './world.js';
import { LEVELS, GENERAL_LESSONS, makeLevel, randomVariant } from './levels.js';
import { bumperClearance } from './sim.js';
import { RoadNetwork, nextManeuver } from './city/network.js';
import { buildCity } from './city/cityWorld.js';
import { RuleMonitor } from './city/rules.js';

// data/ qovluğundakı şəhər xəritələri (tools/osm-to-city.mjs ilə OSM-dən yaradılır)
const CITIES = Object.values(import.meta.glob('../data/*.json', { eager: true, import: 'default' }));
import { Input, Calibrator } from './input.js';
import { Sound, speak } from './audio.js';
import { Coach } from './coach.js';
import { evaluate, overlapsTarget } from './scoring.js';
import { setupTouch, isTouchDevice } from './touch.js';

const TOUCH = isTouchDevice();

const $ = (id) => document.getElementById(id);

// ---------- Ayarlar ----------
const SETTINGS_KEY = 'park-sim-settings';
const RESULTS_KEY = 'park-sim-results';
const DEFAULTS = {
  sensors: true, details: false, voice: false, realGear: true, clutchMode: false,
  mirrors: true, autoRearCam: true, shadows: !TOUCH, volume: 0.7,
  touchMode: 'wheel', touchSens: 2, touchSize: 1, touchSwap: false,
};
const SETTING_LABELS = {
  sensors: 'Park sensoru köməkçisi (2023 SEL-də standart deyil — İmtahanda sönülüdür)',
  details: 'Təlimatçının ətraflı izahları (istinad nöqtələri)',
  voice: 'Səsli təlimatçı (brauzer səsi)',
  realGear: 'Real ötürmə qaydaları (dayanmadan və əyləcsiz dəyişmək olmaz)',
  clutchMode: 'Debriyaj rejimi (ötürmə üçün debriyaj)',
  mirrors: 'Güzgüləri göstər',
  autoRearCam: 'R-də arxa kamera avtomatik açılsın',
  shadows: 'Kölgələr',
  volume: 'Səs səviyyəsi',
  touchMode: 'Telefon: sükan növü',
  touchSens: 'Telefon: sükan həssaslığı',
  touchSize: 'Telefon: düymələrin ölçüsü',
  touchSwap: 'Telefon: pedallar solda, sükan sağda',
};
const DRIVE_MODES = {
  learn: { name: 'Öyrənmə', desc: 'Təlimatçı, köməkçi xətlər, səhvdən geri qayıtma' },
  practice: { name: 'Məşq', desc: 'Dəyişən park yerləri, istəyə görə kömək' },
  exam: { name: 'İmtahan', desc: 'Köməksiz manevr, daha ciddi qiymətləndirmə' },
};
function loadJSON(k, d) { try { return { ...d, ...JSON.parse(localStorage.getItem(k) || '{}') }; } catch { return { ...d }; } }
function saveJSON(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* boş */ } }
const settings = loadJSON(SETTINGS_KEY, DEFAULTS);
const results = loadJSON(RESULTS_KEY, {});

// ---------- Renderer və səhnə ----------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, TOUCH ? 1.25 : 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = false;
$('stage').appendChild(renderer.domElement);

const scene = new THREE.Scene();
const SKY = 0xbcd6ea;
scene.background = new THREE.Color(SKY);
scene.fog = new THREE.Fog(SKY, 70, 190);

const hemi = new THREE.HemisphereLight(0xdfefff, 0x5a5348, 1.1);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff3dd, 1.9);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 120 });
sun.shadow.bias = -0.0005;
sun.shadow.camera.layers.enable(LAYER.BODY);
scene.add(sun, sun.target);
for (const l of [hemi, sun]) for (let i = 0; i < 5; i++) l.layers.enable(i);

// ---------- Maşın ----------
const car = new CarPhysics();
const model = buildCar(0x8d9095, true); // Elantra — boz metallik (fotolardakı kimi)
scene.add(model.root);
const ghost = buildGhost();
ghost.visible = false;
scene.add(ghost);

// ---------- Kameralar ----------
const driverCam = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.05, 400);
driverCam.rotation.order = 'YXZ';
driverCam.position.set(...VIEW.eye);
model.root.add(driverCam);

const freeCam = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 400);
scene.add(freeCam);

function mirrorCam(fov, aspect, pos, yaw, pitch, layers) {
  const c = new THREE.PerspectiveCamera(fov, aspect, 0.05, 250);
  c.rotation.order = 'YXZ';
  c.position.set(...pos);
  c.rotation.set(pitch, yaw, 0);
  c.layers.disableAll();
  for (const l of layers) c.layers.enable(l);
  model.root.add(c);
  return c;
}
const camL = mirrorCam(24, 1.6, VIEW.mirrorL, -0.2, -0.08, [LAYER.WORLD, LAYER.BODY]);
const camR = mirrorCam(24, 1.6, VIEW.mirrorR, 0.26, -0.12, [LAYER.WORLD, LAYER.BODY]);
const camC = mirrorCam(20, 3.4, VIEW.mirrorC, 0, -0.1, [LAYER.WORLD]);
// Arxa kamera baqaj qapağında (standart). Dinamik xətlər rəsmi təsdiqlənmədiyi üçün köməkçi kimi göstərilir.
const camRear = mirrorCam(110, 1.6, VIEW.rearCam, 0, -0.55, [LAYER.WORLD, LAYER.REARCAM]);

// ---------- Arxa kamera xətləri və trayektoriya ----------
function ribbon(color, opacity = 0.9) {
  const g = new THREE.BufferGeometry();
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide }));
  m.frustumCulled = false;
  m.renderOrder = 5;
  return m;
}
function setRibbon(mesh, pts, width, y = 0.03) {
  const pos = new Float32Array(pts.length * 6);
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let dx = b.x - a.x, dz = b.z - a.z;
    const l = Math.hypot(dx, dz) || 1;
    const nx = (-dz / l) * width / 2, nz = (dx / l) * width / 2;
    pos.set([pts[i].x + nx, y, pts[i].z + nz, pts[i].x - nx, y, pts[i].z - nz], i * 6);
  }
  const idx = [];
  for (let i = 0; i < pts.length - 1; i++) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  mesh.geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  mesh.geometry.setIndex(idx);
  mesh.geometry.computeBoundingSphere();
}
// Arxa kameranın statik xətləri (maşına bərkidilir)
const rearGuides = new THREE.Group();
const rearDyn = [ribbon(0xffd400), ribbon(0xffd400)];
{
  const addBar = (z, color, w = 2.0) => {
    const r = ribbon(color);
    setRibbon(r, [{ x: -w / 2, z }, { x: w / 2, z }], 0.06);
    rearGuides.add(r);
  };
  addBar(-CAR.rearOverhang - 0.5, 0xff3030);
  addBar(-CAR.rearOverhang - 1.0, 0xffd400);
  addBar(-CAR.rearOverhang - 2.0, 0x2ee66b);
  for (const s of [1, -1]) {
    const r = ribbon(0x2ee66b, 0.55);
    setRibbon(r, [{ x: s * 0.95, z: -CAR.rearOverhang - 0.2 }, { x: s * 0.95, z: -CAR.rearOverhang - 3 }], 0.05);
    rearGuides.add(r);
  }
  rearGuides.add(...rearDyn);
  rearGuides.traverse((o) => o.layers.set(LAYER.REARCAM));
  model.root.add(rearGuides);
}
function updateRearDynamic() {
  const k = Math.tan(car.delta) / CAR.wheelbase;
  for (const [i, s] of [[0, 1], [1, -1]]) {
    const pts = [];
    let x = 0, z = 0, h = 0;
    for (let n = 0; n <= 24; n++) {
      const c = { x: x + Math.cos(h) * s * 0.9 + Math.sin(h) * -CAR.rearOverhang, z: z - Math.sin(h) * s * 0.9 + Math.cos(h) * -CAR.rearOverhang };
      pts.push(c);
      const ds = -0.14;
      h += ds * k; x += Math.sin(h) * ds; z += Math.cos(h) * ds;
    }
    setRibbon(rearDyn[i], pts, 0.07, 0.025);
  }
}
// Dünyada trayektoriya (köməkçi layı)
const trajL = ribbon(0x2ee66b, 0.75), trajR = ribbon(0x2ee66b, 0.75);
for (const t of [trajL, trajR]) { t.layers.set(LAYER.HELPERS); scene.add(t); }
function updateTrajectory() {
  const dir = car.gear === 'R' ? -1 : 1;
  const pts = car.predict(dir, 7, 40);
  const lz = dir > 0 ? CAR.wheelbase + CAR.frontOverhang : -CAR.rearOverhang;
  const side = (s) => pts.map((p) => toWorld(s * CAR.width / 2, lz, p));
  setRibbon(trajL, side(1), 0.08);
  setRibbon(trajR, side(-1), 0.08);
}

// ---------- Güzgü görünüşləri (render hədəfləri + ekran üstü quad-lar) ----------
const overlay = new THREE.Scene();
const orthoCam = new THREE.OrthographicCamera(0, innerWidth, innerHeight, 0, -10, 10);
const views = [
  { key: 'L', cam: camL, label: 'Sol güzgü', mirror: true },
  { key: 'C', cam: camC, label: 'Salon güzgüsü', mirror: true },
  { key: 'R', cam: camR, label: 'Sağ güzgü', mirror: true },
  { key: 'B', cam: camRear, label: 'Arxa kamera', mirror: true },
];
for (const v of views) {
  v.rt = new THREE.WebGLRenderTarget(256, 128, { samples: 4 });
  v.frame = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0x0b0d10 }));
  v.quad = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: v.rt.texture, side: THREE.DoubleSide }));
  v.quad.position.z = 1;
  overlay.add(v.frame, v.quad);
  v.el = document.createElement('div');
  v.el.className = 'vlabel';
  v.el.textContent = v.label;
  $('views').appendChild(v.el);
}
function layoutViews() {
  const W = innerWidth, H = innerHeight;
  const sw = Math.min(W * 0.22, 330), sh = sw * 0.62;
  const cw = Math.min(W * 0.3, 440), ch = cw * 0.3;
  const rw = Math.min(W * (TOUCH ? 0.3 : 0.34), 500), rh = rw * 0.6;
  const rect = {
    L: { x: 12, y: H - 12 - sh, w: sw, h: sh },
    R: { x: W - 12 - sw, y: H - 12 - sh, w: sw, h: sh },
    C: { x: (W - cw) / 2, y: H - 10 - ch, w: cw, h: ch },
    B: { x: (W - rw) / 2, y: TOUCH ? 112 : 70, w: rw, h: rh },
  };
  const pr = renderer.getPixelRatio();
  for (const v of views) {
    const r = rect[v.key];
    v.rect = r;
    v.cam.aspect = r.w / r.h;
    v.cam.updateProjectionMatrix();
    v.rt.setSize(Math.round(r.w * pr), Math.round(r.h * pr));
    v.quad.position.set(r.x + r.w / 2, r.y + r.h / 2, 1);
    v.quad.scale.set(v.mirror ? -r.w : r.w, r.h, 1);
    v.frame.position.set(r.x + r.w / 2, r.y + r.h / 2, 0);
    v.frame.scale.set(r.w + 8, r.h + 8, 1);
    v.el.style.left = r.x + 'px';
    v.el.style.top = H - r.y - 4 + 'px';
  }
}

// ---------- Vəziyyət ----------
const input = new Input();
const touchUI = setupTouch(input, settings);
const calib = new Calibrator(input);
const sound = new Sound();
sound.setVolume(settings.volume);

const game = {
  mode: 'menu',
  level: null,
  world: null,
  obstacles: [],
  coach: null,
  camMode: 'driver',
  topZoom: 24,
  yaw: 0, pitch: -0.1, yawTarget: 0,
  rearCamManual: false,
  blinker: null, blinkT: 0, blinkOn: false,
  stats: null,
  lastDir: 0,
  lastHit: -10,
  parkTimer: 0,
  clear: { front: 9, rear: 9 },
  drive: 'learn',
  help: { coach: true, ghost: true, sensors: true, freeCam: true },
  practiceHelp: false,
  coachRes: null,
  lastSpoken: '',
  time: 0,
  finished: false,
};
const CAM_NAMES = { driver: 'Sürücü', top: 'Yuxarıdan', chase: 'Arxadan' };

function startLevel(base, drive = game.drive) {
  leaveCity();
  game.drive = drive;
  const lv = drive === 'practice' ? makeLevel(base.id, randomVariant(base.id)) : makeLevel(base.id);
  if (game.world) scene.remove(game.world.group);
  game.level = lv;
  game.world = buildWorld(lv);
  scene.add(game.world.group);
  game.obstacles = game.world.obstacles;
  car.reset(lv.start);
  input.kbSteer = 0;
  if (input.touch) input.touch.steer = 0;
  const help = drive === 'learn' || (drive === 'practice' && game.practiceHelp);
  game.help = { coach: help, ghost: help, sensors: drive !== 'exam' && settings.sensors, freeCam: drive !== 'exam' };
  game.coach = game.help.coach ? new Coach(lv.coach) : null;
  game.stats = { time: 0, collisions: 0, curbHits: 0, moves: 0, signaled: false, signalTime: 0, maxSpeed: 0, reversed: false, lookedBack: false, gearAbuse: 0 };
  game.lastDir = 0;
  game.lastHit = -10;
  game.parkTimer = 0;
  game.blinker = null;
  game.rearCamManual = false;
  game.finished = false;
  game.camMode = 'driver';
  game.yaw = game.yawTarget = 0;
  game.lastSpoken = '';
  coachShown = '';
  $('lvName').textContent = `${lv.id}. ${lv.name}`;
  $('modeTag').textContent = DRIVE_MODES[drive].name;
  $('colLbl').textContent = 'Toqquşma';
  $('mvLbl').textContent = 'Manevr';
  $('coach').classList.toggle('hidden', !game.coach);
  document.querySelector('.sensor').classList.toggle('hidden', !game.help.sensors);
  setMode('play');
}

// ---------- Ekranlar ----------
function show(name) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === 'scr-' + name));
}
function setMode(m) {
  game.mode = m;
  touchUI.show(TOUCH && m === 'play');
  $('hud').classList.toggle('hidden', m !== 'play' && m !== 'pause');
  $('views').classList.toggle('hidden', !(m === 'play' || m === 'pause'));
  if (m === 'play') show('none');
  if (m !== 'play') { sound.stopAll(); $('toast').classList.remove('show'); }
}
function go(name) {
  sound.unlock();
  if (name === 'levels') renderLevels();
  if (name === 'lessons') renderLessons(0);
  if (name === 'settings') renderSettings();
  if (name === 'city') renderCities();
  if (name === 'calib') { calib.reset(); setMode('calib'); } else setMode('menu');
  show(name);
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-go]');
  if (b) go(b.dataset.go);
});

function renderLevels() {
  const list = $('levelList');
  list.innerHTML = '';
  for (const lv of LEVELS) {
    const el = document.createElement('div');
    el.className = 'lv';
    const row = (m) => {
      const r = results[`${lv.id}-${m}`];
      return `<div class="best"><span>${DRIVE_MODES[m].name}</span> <span class="st">${r ? '★'.repeat(r.stars) + '☆'.repeat(3 - r.stars) : '☆☆☆'}</span> ${r ? r.score : '—'}</div>`;
    };
    el.innerHTML = `<div class="n">Səviyyə ${lv.id}</div><h4>${lv.name}</h4><p>${lv.short}</p>${['learn', 'practice', 'exam'].map(row).join('')}`;
    el.onclick = () => openBrief(lv);
    list.appendChild(el);
  }
}
function renderCities() {
  const box = $('cityList');
  if (!CITIES.length) {
    box.innerHTML = `<p class="note">Real Bakı xəritəsi hələ əlavə olunmayıb. OpenStreetMap faylı <code>tools/osm-to-city.mjs</code> ilə <code>data/</code> qovluğuna çevrilməlidir.</p>`;
    return;
  }
  box.innerHTML = '';
  for (const c of CITIES) {
    const el = document.createElement('div');
    el.className = 'lv';
    el.innerHTML = `<h4>${c.title}</h4><p>${c.roads.length} yol · ${c.signals.length} svetofor · ${c.buildings.length} bina</p><p class="note">${c.source}</p>`;
    el.onclick = () => { sound.unlock(); startCity(c); };
    box.appendChild(el);
  }
}
let briefLevel = null;
function openBrief(lv) {
  briefLevel = lv;
  $('briefTitle').textContent = `${lv.id}. ${lv.name}`;
  $('briefShort').textContent = lv.short + ` · Norma: ${lv.par.moves} manevr, ${lv.par.time} saniyə`;
  $('briefTheory').innerHTML = lv.theory.map((t) => `<li>${t}</li>`).join('');
  $('briefHelp').checked = game.practiceHelp;
  renderModes();
  show('brief');
}
function renderModes() {
  $('briefModes').innerHTML = Object.entries(DRIVE_MODES).map(([k, m]) =>
    `<button class="mode ${k === game.drive ? 'on' : ''}" data-mode="${k}"><b>${m.name}</b><span>${m.desc}</span></button>`).join('');
  $('briefModes').querySelectorAll('button').forEach((b) => { b.onclick = () => { game.drive = b.dataset.mode; renderModes(); }; });
  $('briefHelpRow').classList.toggle('hidden', game.drive !== 'practice');
}
$('briefStart').onclick = () => {
  game.practiceHelp = $('briefHelp').checked;
  sound.unlock();
  if (TOUCH) {
    // tam ekran və üfüqi rejim (dəstəklənirsə)
    try {
      const fs = document.documentElement.requestFullscreen?.();
      fs?.then(() => screen.orientation?.lock?.('landscape').catch(() => {})).catch(() => {});
    } catch { /* dəstəklənmir */ }
  }
  startLevel(briefLevel);
};

function renderLessons(tab) {
  const tabs = [{ title: 'Ümumi qaydalar' }, ...LEVELS.map((l) => ({ title: l.name, level: l }))];
  $('lessonTabs').innerHTML = '';
  tabs.forEach((t, i) => {
    const b = document.createElement('button');
    b.textContent = t.title;
    b.className = i === tab ? 'on' : '';
    b.onclick = () => renderLessons(i);
    $('lessonTabs').appendChild(b);
  });
  if (tab === 0) {
    $('lessonBody').innerHTML = GENERAL_LESSONS.map((s) => `<h3>${s.title}</h3><ul>${s.items.map((i) => `<li>${i}</li>`).join('')}</ul>`).join('');
  } else {
    const lv = tabs[tab].level;
    $('lessonBody').innerHTML = `<h3>${lv.name}</h3><ol>${lv.theory.map((t) => `<li>${t}</li>`).join('')}</ol>
      <button class="primary" id="lessonPlay">Bu manevri məşq et ▶</button>`;
    $('lessonPlay').onclick = () => openBrief(lv);
  }
}

function renderSettings() {
  const box = $('settingsList');
  box.innerHTML = '';
  const save = () => { saveJSON(SETTINGS_KEY, settings); applySettings(); };
  for (const k of Object.keys(DEFAULTS)) {
    if (k.startsWith('touch') && !TOUCH) continue;
    const l = document.createElement('label');
    let inp;
    if (k === 'touchMode') {
      inp = document.createElement('select');
      inp.innerHTML = '<option value="wheel">Fırlanan sükan</option><option value="slider">Sağa-sola sürüşdürmə</option>';
      inp.value = settings[k];
      inp.onchange = () => { settings[k] = inp.value; save(); };
    } else if (typeof DEFAULTS[k] === 'number') {
      inp = document.createElement('input');
      const [min, max, step] = { volume: [0, 1, 0.05], touchSens: [1, 4, 0.5], touchSize: [0.8, 1.4, 0.1] }[k];
      Object.assign(inp, { type: 'range', min, max, step, value: settings[k] });
      inp.oninput = () => { settings[k] = +inp.value; sound.setVolume(settings.volume); save(); };
    } else {
      inp = document.createElement('input');
      inp.type = 'checkbox';
      inp.checked = settings[k];
      inp.onchange = () => { settings[k] = inp.checked; save(); };
    }
    inp.id = 'set-' + k;
    l.append(SETTING_LABELS[k], inp);
    box.appendChild(l);
  }
  const info = document.createElement('div');
  info.className = 'note spec';
  const row = (name, f, fmt) => `<tr><td>${name}</td><td>${fmt}${f.est ? ' <i>təxmini</i>' : ''}</td><td>${f.src}</td></tr>`;
  info.innerHTML = `<b>${SPEC.model}</b><table>
    ${row('Uzunluq', SPEC.length, SPEC.length.v.toFixed(3) + ' m')}
    ${row('En', SPEC.width, SPEC.width.v.toFixed(3) + ' m')}
    ${row('Təkər bazası', SPEC.wheelbase, SPEC.wheelbase.v.toFixed(2) + ' m')}
    ${row('İz eni', SPEC.track, SPEC.track.v + ' m')}
    ${row('Ön / arxa çıxıntı', SPEC.frontOverhang, SPEC.frontOverhang.v + ' / ' + SPEC.rearOverhang.v + ' m')}
    ${row('Dönmə radiusu', SPEC.turnRadius, SPEC.turnRadius.v + ' m')}
    ${row('Sükan nisbəti', SPEC.steerRatio, SPEC.steerRatio.v + ':1 (modeldə effektiv ' + CAR.steerRatio.toFixed(1) + ':1, təkər bucağı ' + (CAR.maxSteer * 180 / Math.PI).toFixed(1) + '° — dönmə radiusundan)')}
    ${row('Sükan dövrəsi', SPEC.lockToLock, SPEC.lockToLock.v + ' dövrə (±' + Math.round(CAR.wheelLock) + '°)')}
    ${row('Park sensoru', SPEC.parkSensors, 'standart deyil')}
    ${row('Arxa kamera', SPEC.rearCamera, 'standart')}
  </table>`;
  box.appendChild(info);
}
function applySettings() {
  renderer.shadowMap.enabled = settings.shadows;
  touchUI.applyLayout();
  if (game.level && game.drive !== 'exam') {
    game.help.sensors = settings.sensors;
    document.querySelector('.sensor').classList.toggle('hidden', !game.help.sensors);
  }
  scene.traverse((o) => { if (o.material) o.material.needsUpdate = true; });
}
applySettings();

// Pauza / nəticə düymələri
$('resume').onclick = () => setMode('play');
$('restart').onclick = () => (game.city ? startCity(game.city.data) : startLevel(game.level));
$('pauseTheory').onclick = () => { if (game.level) openBrief(LEVELS[game.level.id - 1]); };
$('resRetry').onclick = () => (game.city ? startCity(game.city.data) : startLevel(game.level));
$('resNext').onclick = () => (game.city ? startCity(game.city.data) : openBrief(LEVELS[game.level.id % LEVELS.length]));

let toastTimer = 0;
function toast(msg, bad = false) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  t.classList.toggle('bad', bad);
  toastTimer = 2.4;
}

// ---------- Kalibrasiya ekranı ----------
$('calibSkip').onclick = () => calib.skip();
$('calibRestart').onclick = () => calib.reset();
function updateCalibScreen(dt) {
  const p = input.pad();
  $('calibPad').textContent = p ? `Qoşulub: ${p.id}` : 'Sükan və ya pult tapılmadı. Qoşub istənilən düyməni basın (brauzer yalnız düymə basıldıqdan sonra görür).';
  const r = calib.update(dt);
  $('calibText').textContent = r.text;
  $('calibSub').textContent = r.sub;
  $('calibProg').style.width = r.progress * 100 + '%';
  $('calibSkip').disabled = !calib.step?.optional;
  if (p) {
    $('calibAxes').innerHTML = p.axes.map((a, i) => `<div class="ax">Ox ${i}<div class="bar"><i style="left:calc(${(a + 1) * 50}% - 2px)"></i></div></div>`).join('') +
      `<div style="grid-column:1/-1">${p.buttons.map((b, i) => `<span class="btn ${b.pressed ? 'on' : ''}">${i}</span>`).join('')}</div>`;
  }
  if (calib.done && !calib.reported) {
    calib.reported = true;
    toast('Kalibrasiya saxlanıldı ✓');
  }
}
function updatePadStatus() {
  const p = input.pad();
  const el = $('padStatus');
  if (!p) { el.textContent = TOUCH ? 'Telefon rejimi: ekrandakı sükan, pedallar və düymələrlə idarə edin. Telefonu üfüqi tutun.' : 'Sükan tapılmadı — klaviatura ilə oynaya bilərsiniz (W/A/S/D). Sükanı qoşub düymə basın.'; el.className = 'pad-status'; return; }
  const m = input.map;
  el.textContent = m ? `✓ Sükan hazırdır: ${p.id}${input.hasFFB ? ' · titrəmə dəstəklənir' : ''}` : `Sükan tapıldı: ${p.id} — kalibrasiya edin.`;
  el.className = 'pad-status' + (m ? ' ok' : '');
}

// ---------- Siçanla baxış ----------
let drag = null;
renderer.domElement.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY }; });
addEventListener('pointerup', () => { drag = null; });
addEventListener('pointermove', (e) => {
  if (!drag || game.mode !== 'play') return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  drag = { x: e.clientX, y: e.clientY };
  game.yawTarget = Math.max(-2.6, Math.min(2.6, game.yawTarget - dx * 0.005));
  game.pitch = Math.max(-0.7, Math.min(0.5, game.pitch - dy * 0.004));
});
renderer.domElement.addEventListener('dblclick', () => { game.yawTarget = 0; game.pitch = -0.1; });
renderer.domElement.addEventListener('wheel', (e) => {
  game.topZoom = Math.max(8, Math.min(50, game.topZoom * (e.deltaY > 0 ? 1.1 : 0.9)));
}, { passive: true });

// ---------- Ötürmə və siqnal ----------
function shiftTo(g, inp) {
  if (g === car.gear) return;
  const moving = Math.abs(car.v) > 0.3;
  if (settings.realGear) {
    if (g !== 'N' && inp.brake < 0.25 && !inp.handbrake) {
      toast(TOUCH ? 'Əvvəlcə Əyləci basıb saxlayın' : 'Əyləci basıb saxlayın (S)', true);
      sound.warn();
      return;
    }
    const dirNow = car.gear === 'D' ? 1 : car.gear === 'R' ? -1 : 0;
    const dirNew = g === 'D' ? 1 : g === 'R' ? -1 : 0;
    if (moving && (g === 'P' || (dirNew && dirNew !== dirNow && Math.sign(car.v) !== dirNew))) {
      toast('Əvvəlcə TAM dayanın', true);
      sound.warn();
      game.stats.gearAbuse++;
      return;
    }
  }
  if (settings.clutchMode && input.state.source === 'wheel' && input.map?.clutch && inp.clutch < 0.6) {
    toast('Debriyajı sona qədər basın', true);
    sound.warn();
    return;
  }
  car.gear = g;
  sound.shift();
}
function shiftStep(d, inp) {
  const i = GEARS.indexOf(car.gear);
  const n = GEARS[Math.max(0, Math.min(GEARS.length - 1, i + d))];
  shiftTo(n, inp);
}
function toggleBlinker(side) {
  game.blinker = game.blinker === side ? null : side;
  game.blinkT = 0;
  game.blinkOn = !!game.blinker;
  sound.tick(true);
}
function cycleCam() {
  if (!game.help.freeCam) { toast('İmtahanda yalnız sürücü görünüşü'); return; }
  const order = ['driver', 'top', 'chase'];
  game.camMode = order[(order.indexOf(game.camMode) + 1) % order.length];
  toast(CAM_NAMES[game.camMode]);
}

// ---------- Park sensorları (köməkçi) ----------
const sensorDetail = new Array(8).fill(9);
function sensorColor(d) {
  return d < 0.3 ? '#ff3b3b' : d < 0.6 ? '#ff8c1a' : d < 1.0 ? '#ffd400' : d < 1.6 ? '#3ddc84' : 'rgba(255,255,255,.08)';
}
function drawSensorIcon() {
  const arc = (cx, cy, r, a0, a1, color) => {
    const p0 = [cx + r * Math.cos(a0), cy + r * Math.sin(a0)], p1 = [cx + r * Math.cos(a1), cy + r * Math.sin(a1)];
    return `<path d="M${p0[0]} ${p0[1]} A${r} ${r} 0 0 1 ${p1[0]} ${p1[1]}" stroke="${color}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  };
  let f = '', r = '';
  // ön: sensor 0..3 (lx −0.75 sağ … +0.75 sol)
  for (let i = 0; i < 4; i++) {
    const a0 = -Math.PI * (0.78 - i * 0.14), a1 = a0 + Math.PI * 0.12;
    for (let ring = 0; ring < 3; ring++) {
      const lim = [0.4, 0.9, 1.5][ring];
      f += arc(40, 52, 22 + ring * 8, a0, a1, sensorDetail[3 - i] < lim ? sensorColor(sensorDetail[3 - i]) : 'rgba(255,255,255,.08)');
    }
  }
  for (let i = 0; i < 4; i++) {
    const a0 = Math.PI * (0.22 + i * 0.14), a1 = a0 + Math.PI * 0.12;
    for (let ring = 0; ring < 3; ring++) {
      const lim = [0.4, 0.9, 1.5][ring];
      const d = sensorDetail[4 + i];
      r += arc(40, 88, 22 + ring * 8, a0, a1, d < lim ? sensorColor(d) : 'rgba(255,255,255,.08)');
    }
  }
  $('sFront').innerHTML = f;
  $('sRear').innerHTML = r;
  const fmt = (d) => (d < 2.5 ? (d * 100).toFixed(0) + ' sm' : '—');
  $('sdF').textContent = 'Ön ' + fmt(game.clear.front);
  $('sdR').textContent = 'Arxa ' + fmt(game.clear.rear);
}

// ---------- Oyun yeniləməsi ----------
function updatePlay(dt, inp) {
  // düymələr
  if (input.consume('KeyE')) shiftStep(1, inp);
  if (input.consume('KeyQ')) shiftStep(-1, inp);
  if (input.consume('Digit1')) shiftTo('P', inp);
  if (input.consume('Digit2')) shiftTo('R', inp);
  if (input.consume('Digit3')) shiftTo('N', inp);
  if (input.consume('Digit4')) shiftTo('D', inp);
  if (input.consume('KeyZ')) toggleBlinker('L');
  if (input.consume('KeyX')) toggleBlinker('R');
  if (input.consume('KeyC')) cycleCam();
  if (input.consume('KeyV')) game.rearCamManual = !game.rearCamManual;
  if (input.consume('KeyM')) { settings.mirrors = !settings.mirrors; saveJSON(SETTINGS_KEY, settings); }
  if (input.consume('KeyH') && game.drive !== 'exam' && !game.city) {
    if (game.coach) game.coach = null;
    else { game.coach = new Coach(game.level.coach); fastForwardCoach(); }
    $('coach').classList.toggle('hidden', !game.coach);
  }
  if (input.consume('KeyG') && game.drive !== 'exam') game.help.ghost = !game.help.ghost;
  if (input.consume('KeyT')) { if (game.city) startCity(game.city.data); else startLevel(game.level); return; }
  if (input.consume('Enter')) { if (game.city) finishCity(); else finish(); return; }
  for (const ev of input.padEvents) {
    if (['D', 'R', 'N', 'P'].includes(ev)) shiftTo(ev, inp);
    if (ev === 'up') shiftStep(1, inp);
    if (ev === 'down') shiftStep(-1, inp);
    if (ev === 'sigL') toggleBlinker('L');
    if (ev === 'sigR') toggleBlinker('R');
    if (ev === 'cam') cycleCam();
  }

  if (game.city) { updateCity(dt, inp); return; }

  // fizika
  const sub = 4;
  const pin = { ...inp, clutchMode: settings.clutchMode && !!input.map?.clutch };
  for (let i = 0; i < sub; i++) {
    const hit = car.step(dt / sub, pin, game.obstacles);
    if (hit) {
      const now = game.time;
      if (now - game.lastHit > 0.8) {
        if (hit.hit.type === 'curb') {
          game.stats.curbHits++;
          toast('Bordürə toxundunuz!', true);
        } else {
          game.stats.collisions++;
          toast(`Toqquşma! (${hit.hit.name})`, true);
        }
        sound.crash(hit.impact);
        input.rumble(Math.min(1, 0.4 + hit.impact), 0.6, 250);
      }
      game.lastHit = now;
    }
  }

  // statistika
  const st = game.stats;
  if (Math.abs(car.v) > 0.12) {
    const d = Math.sign(car.v);
    if (d !== game.lastDir) { st.moves++; game.lastDir = d; }
  }
  if (st.moves > 0 && !game.finished) st.time += dt;
  st.maxSpeed = Math.max(st.maxSpeed, car.speedKmh);
  if (game.blinker === game.level.signal) { st.signalTime += dt; if (st.signalTime > 1) st.signaled = true; }
  if (car.gear === 'R') {
    if (Math.abs(car.v) > 0.12) st.reversed = true;
    if (input.keys.has('KeyB') || game.yaw < -1.6) st.lookedBack = true;
  }

  // siqnal relesi
  if (game.blinker) {
    game.blinkT += dt;
    if (game.blinkT > 0.38) { game.blinkT = 0; game.blinkOn = !game.blinkOn; sound.tick(game.blinkOn); }
  } else game.blinkOn = false;

  game.clear = bumperClearance(car.pose, game.obstacles, sensorDetail);
  sound.sensors(game.clear.front, game.clear.rear, dt, game.help.sensors && car.gear !== 'P');
  sound.engine(inp.throttle, Math.abs(car.v), true);

  // təlimatçı
  if (game.coach) {
    const prev = game.coach.i;
    const r = game.coach.update({ ...car.pose, v: car.v, delta: car.delta, gear: car.gear, steer: car.steer, blinker: game.blinker, clear: game.clear });
    game.coachRes = r;
    if (game.coach.i !== prev) sound.step();
    renderCoach(r);
  } else game.coachRes = null;

  // P-də avtomatik yoxlama
  if (car.gear === 'P' && Math.abs(car.v) < 0.05 && st.moves > 0 && overlapsTarget(game.level, car)) {
    game.parkTimer += dt;
    if (game.parkTimer > 1.5) finish();
  } else game.parkTimer = 0;
}

// Təlimatçı sonradan açılanda artıq yerinə yetirilmiş addımları ötür
function fastForwardCoach() {
  const c = game.coach;
  for (let k = 0; k < c.steps.length; k++) {
    const r = c.update({ ...car.pose, v: car.v, delta: car.delta, gear: car.gear, steer: car.steer, blinker: game.blinker, clear: game.clear });
    if (!r.advanced) break;
  }
}

let coachShown = '';
function renderCoach(r) {
  const showHint = settings.details || r.status === 'back' || r.status === 'stop';
  const key = r.text + '|' + r.remain + '|' + (showHint ? r.hint : '') + '|' + r.status;
  if (key === coachShown) return;
  coachShown = key;
  const keys = (t) => (TOUCH ? t.replace(/\(X\)/g, '(▶)').replace(/\(Z\)/g, '(◀)').replace(/\(B\)/g, '(👀)') : t);
  $('coachText').textContent = keys(r.text);
  $('coachRemain').textContent = r.remain || '';
  $('coachHint').textContent = showHint && r.status !== 'stop' ? keys(r.hint) : '';
  $('coachStep').textContent = `${Math.min(r.stepNo, r.total)}/${r.total}`;
  $('coach').className = 'coach' + (r.status === 'stop' ? ' stop' : r.status === 'back' ? ' back' : '');
  if (settings.voice && r.text !== game.lastSpoken) {
    game.lastSpoken = r.text;
    speak(r.text);
  }
}

function finish() {
  if (game.finished) return;
  game.finished = true;
  const res = evaluate(game.level, car, game.stats, game.drive);
  const key = `${game.level.id}-${game.drive}`;
  if (res.passed && (!results[key] || res.score > results[key].score)) {
    results[key] = { score: res.score, stars: res.stars };
    saveJSON(RESULTS_KEY, results);
  }
  if (res.passed) sound.success(); else sound.warn();
  const exam = game.drive === 'exam';
  $('resTitle').textContent = exam
    ? (res.passed ? 'İmtahan: KEÇDİ ✓' : 'İmtahan: KEÇMƏDİ ✗')
    : res.passed ? (res.stars === 3 ? 'Əla park' : 'Park edildi ✓') : 'Alınmadı';
  $('resStars').innerHTML = [0, 1, 2].map((i) => `<span class="${i < res.stars ? '' : 'off'}">★</span>`).join('');
  $('resScore').textContent = res.score;
  const s = game.stats;
  const mm = Math.floor(s.time / 60), ss = Math.floor(s.time % 60).toString().padStart(2, '0');
  const t = game.level.target;
  $('resGrid').innerHTML = [
    ['Vaxt', `${mm}:${ss}`],
    ['Toqquşma', s.collisions],
    ['Bordür', s.curbHits],
    ['Manevr', `${s.moves} / ${game.level.par.moves}`],
    ['Bucaq xətası', res.angleErr.toFixed(1) + '°'],
    [t.zone ? 'Zolaqda' : 'Xəttin içində', res.inside ? 'Bəli' : `${(res.maxOut * 100).toFixed(0)} sm kənar`],
    ...(res.curbDist !== null ? [['Bordürə', `${(res.curbDist * 100).toFixed(0)} sm`]] : []),
  ].map(([a, b]) => `<div><span>${a}</span><b>${b}</b></div>`).join('');
  $('resNotes').innerHTML = [...res.fails.map((n) => `<li class="fail">✗ ${n}</li>`), ...res.notes.map((n) => `<li>${n}</li>`)].join('');
  setMode('result');
  show('result');
}

// ---------- Şəhər sürüşü (Bakı) ----------
function leaveCity() {
  if (!game.city) return;
  game.city = null;
  input.selfCenter = 0;
  input.steerRate = 1;
  document.body.classList.remove('city');
}

function startCity(data) {
  if (game.world) scene.remove(game.world.group);
  const net = new RoadNetwork(data);
  const world = buildCity(data, net);
  scene.add(world.group);
  // başlanğıc: mərkəzə yaxın, ən azı 60 m uzunluğunda seqmentin sağ zolağı
  const segs = net.segs.filter((s) => s.len > 40 && s.road.type !== 'service');
  segs.sort((a, b) => Math.hypot((a.ax + a.bx) / 2, (a.az + a.bz) / 2) - Math.hypot((b.ax + b.bx) / 2, (b.az + b.bz) / 2));
  const pick = segs[Math.floor(Math.random() * Math.min(12, segs.length))];
  const lane = pick.road.oneway ? pick.halfW - data.defaults.laneWidth / 2 : pick.halfW / 2;
  const t = Math.min(pick.len * 0.3, 15);
  // sağ zolaq: sağ vektor = (−dz, dx)
  const px = pick.ax + pick.dx * t - pick.dz * lane;
  const pz = pick.az + pick.dz * t + pick.dx * lane;
  const h = Math.atan2(pick.dx, pick.dz);
  // təyinat: 500–1500 m uzunluğunda marşrut
  const startNode = pick.b;
  let route = null, dest = null;
  const ids = [...net.pos.keys()];
  for (let k = 0; k < 60 && !route; k++) {
    const cand = ids[Math.floor(Math.random() * ids.length)];
    const r = net.route(startNode, cand);
    if (r && r.length > 500 && r.length < 1500) { route = r; dest = cand; }
  }
  if (!route) {
    for (const cand of ids) { const r = net.route(startNode, cand); if (r && (!route || r.length > route.length)) { route = r; dest = cand; } }
  }
  game.world = { group: world.group, obstacles: [] };
  game.obstacles = [];
  game.level = null;
  game.coach = null;
  game.city = { data, net, world, rules: new RuleMonitor(net), route, dest, time: 0, odo: 0, maxSpeed: 0, collisions: 0, lastHit: -9, startNode };
  car.reset({ x: px - Math.sin(h) * CAR.centerOffset, z: pz - Math.cos(h) * CAR.centerOffset, h }, 'city');
  input.kbSteer = 0;
  if (input.touch) input.touch.steer = 0;
  game.help = { coach: false, ghost: false, sensors: false, freeCam: true };
  game.stats = { time: 0, collisions: 0, curbHits: 0, moves: 0, signaled: false, signalTime: 0, maxSpeed: 0 };
  game.blinker = null;
  game.finished = false;
  game.camMode = 'driver';
  game.yaw = game.yawTarget = 0;
  game.topZoom = 60;
  $('lvName').textContent = data.title;
  $('modeTag').textContent = 'Şəhər';
  $('colLbl').textContent = 'Pozuntu';
  $('mvLbl').textContent = 'Məsafə';
  $('coach').classList.remove('hidden');
  document.querySelector('.sensor').classList.add('hidden');
  document.body.classList.add('city');
  setMode('play');
  drawMinimapBase();
}

function updateCity(dt, inp) {
  const C = game.city;
  C.time += dt;
  // klaviatura: sürət artdıqca sükan yavaş fırlanır və özü mərkəzə qayıdır
  const sp = Math.abs(car.v);
  input.steerRate = Math.max(0.22, 1 - sp / 22);
  input.selfCenter = sp > 1 ? 0.4 + sp * 0.06 : 0;
  const near = C.world.nearObstacles(car.x, car.z);
  const pin = { ...inp, clutchMode: settings.clutchMode && !!input.map?.clutch };
  for (let i = 0; i < 4; i++) {
    const hit = car.step(dt / 4, pin, near);
    if (hit && C.time - C.lastHit > 1) {
      C.collisions++;
      const v = C.rules.collision(C.time);
      if (v) violationToast(v);
      sound.crash(hit.impact);
      input.rumble(Math.min(1, 0.4 + hit.impact), 0.6, 250);
    }
    if (hit) C.lastHit = C.time;
  }
  C.odo += Math.abs(car.v) * dt;
  C.maxSpeed = Math.max(C.maxSpeed, car.speedKmh);
  if (game.blinker) {
    game.blinkT += dt;
    if (game.blinkT > 0.38) { game.blinkT = 0; game.blinkOn = !game.blinkOn; sound.tick(game.blinkOn); }
  } else game.blinkOn = false;
  sound.engine(inp.throttle, sp, true);
  C.world.update(C.time);
  const f = toWorld(0, CAR.wheelbase + CAR.frontOverhang, car.pose);
  for (const v of C.rules.update(dt, { x: car.x, z: car.z, h: car.h, v: car.v, frontX: f.x, frontZ: f.z }, game.blinker, C.time)) violationToast(v);
  // naviqasiya
  const man = nextManeuver(C.net, C.route?.nodes, car.x, car.z);
  const [dx, dz] = C.net.pos.get(C.dest) || [0, 0];
  const toDest = Math.hypot(dx - car.x, dz - car.z);
  renderNav(man, toDest);
  if (toDest < 12 && sp < 0.5) finishCity();
  updateCityHUD(inp);
}

function violationToast(v) {
  toast(`${v.critical ? '⛔' : '⚠️'} ${v.name}${v.extra ? ' (' + v.extra + ')' : ''} −${v.points}`, true);
  sound.warn();
}

const TURN_TXT = { left: '↰ Sola dönün', right: '↱ Sağa dönün', straight: '↑ Düz', arrive: '🏁 Təyinat' };
let navShown = '';
function renderNav(man, toDest) {
  const C = game.city;
  const warn = C.rules.warning;
  let text, remain = '', hint = '';
  if (toDest < 30) { text = '🏁 Təyinat — sağda dayanın'; remain = `${Math.round(toDest)} m`; }
  else if (man) {
    text = TURN_TXT[man.turn];
    remain = man.dist > 1000 ? `${(man.dist / 1000).toFixed(1)} km` : `${Math.round(man.dist / 10) * 10} m`;
    hint = man.name ? man.name : '';
  } else text = '↑ Düz davam edin';
  const key = text + remain + hint + warn;
  if (key === navShown) return;
  navShown = key;
  $('coachStep').textContent = '';
  $('coachText').textContent = text;
  $('coachRemain').textContent = remain;
  $('coachHint').textContent = warn || hint;
  $('coach').className = 'coach' + (warn ? ' back' : '');
}

function updateCityHUD(inp) {
  const C = game.city;
  $('spd').textContent = car.speedKmh.toFixed(0);
  $('mph').textContent = (car.speedKmh / 1.609).toFixed(0) + ' mph';
  $('limitSign').textContent = C.rules.limit;
  $('limitSign').classList.toggle('over', car.speedKmh > C.rules.limit);
  document.querySelectorAll('#gears b').forEach((b) => b.classList.toggle('on', b.dataset.g === car.gear));
  $('bl').classList.toggle('on', game.blinker === 'L' && game.blinkOn);
  $('br').classList.toggle('on', game.blinker === 'R' && game.blinkOn);
  $('wheelIcon').style.transform = `rotate(${car.wheelDeg}deg)`;
  $('wdeg').textContent = `${Math.round(car.wheelDeg)}°`;
  $('pq').style.setProperty('--v', inp.throttle * 100 + '%');
  $('pb').style.setProperty('--v', inp.brake * 100 + '%');
  $('pc').style.setProperty('--v', inp.clutch * 100 + '%');
  $('tm').textContent = `${Math.floor(C.time / 60)}:${Math.floor(C.time % 60).toString().padStart(2, '0')}`;
  $('col').textContent = C.rules.violations.length;
  $('mv').textContent = (C.odo / 1000).toFixed(2) + ' km';
  $('roadName').textContent = C.rules.road?.name || '';
  drawMinimap();
}

// Mini-xəritə: yollar bir dəfə çəkilir, maşın və marşrut hər kadrda
let mmBase = null;
const MM = { size: 200, scale: 0.35 };
function drawMinimapBase() {
  const C = game.city;
  mmBase = document.createElement('canvas');
  const half = Math.max(C.data.half[0], C.data.half[1]) + 50;
  mmBase.width = mmBase.height = 1024;
  MM.k = 1024 / (half * 2);
  const g = mmBase.getContext('2d');
  g.fillStyle = '#20252b';
  g.fillRect(0, 0, 1024, 1024);
  g.lineCap = 'round';
  g.strokeStyle = '#6b7480';
  for (const r of C.data.roads) {
    g.lineWidth = Math.max(1.5, r.width * MM.k);
    g.beginPath();
    r.pts.forEach(([x, z], i) => { const X = 512 + x * MM.k, Z = 512 + z * MM.k; if (i) g.lineTo(X, Z); else g.moveTo(X, Z); });
    g.stroke();
  }
  if (C.route) {
    g.strokeStyle = '#2ee66b';
    g.lineWidth = 4;
    g.beginPath();
    C.route.nodes.forEach((id, i) => { const [x, z] = C.net.pos.get(id); const X = 512 + x * MM.k, Z = 512 + z * MM.k; if (i) g.lineTo(X, Z); else g.moveTo(X, Z); });
    g.stroke();
    const [dx, dz] = C.net.pos.get(C.dest);
    g.fillStyle = '#ff4d4d';
    g.beginPath(); g.arc(512 + dx * MM.k, 512 + dz * MM.k, 8, 0, Math.PI * 2); g.fill();
  }
}
function drawMinimap() {
  const cv = $('minimap');
  if (!cv || !mmBase) return;
  const g = cv.getContext('2d');
  const S = cv.width;
  const view = 260; // m — görünən sahə
  const px = 512 + car.x * MM.k, pz = 512 + car.z * MM.k;
  const span = view * MM.k;
  g.save();
  g.clearRect(0, 0, S, S);
  g.beginPath(); g.arc(S / 2, S / 2, S / 2 - 2, 0, Math.PI * 2); g.clip();
  // maşın yuxarı baxsın
  g.translate(S / 2, S / 2);
  g.rotate(Math.PI + car.h);
  g.drawImage(mmBase, px - span / 2, pz - span / 2, span, span, -S / 2, -S / 2, S, S);
  g.restore();
  g.fillStyle = '#fff';
  g.beginPath(); g.moveTo(S / 2, S / 2 - 9); g.lineTo(S / 2 + 6, S / 2 + 7); g.lineTo(S / 2 - 6, S / 2 + 7); g.closePath(); g.fill();
}

function finishCity() {
  if (game.finished) return;
  game.finished = true;
  const C = game.city;
  const sum = C.rules.summary();
  const [dx, dz] = C.net.pos.get(C.dest) || [0, 0];
  const arrived = Math.hypot(dx - car.x, dz - car.z) < 15;
  const passed = sum.passed && arrived;
  const score = Math.max(0, 100 - sum.points);
  if (passed) sound.success(); else sound.warn();
  $('resTitle').textContent = passed ? 'Marşrut qaydalara uyğun keçildi ✓' : arrived ? 'Təyinata çatdınız, amma pozuntular var' : 'Təyinata çatılmadı';
  const stars = !passed ? 0 : score >= 95 ? 3 : score >= 85 ? 2 : 1;
  $('resStars').innerHTML = [0, 1, 2].map((i) => `<span class="${i < stars ? '' : 'off'}">★</span>`).join('');
  $('resScore').textContent = score;
  $('resGrid').innerHTML = [
    ['Vaxt', `${Math.floor(C.time / 60)}:${Math.floor(C.time % 60).toString().padStart(2, '0')}`],
    ['Məsafə', `${(C.odo / 1000).toFixed(2)} km`],
    ['Pozuntu', C.rules.violations.length],
    ['Cərimə xalı', sum.points],
    ['Maks. sürət', `${Math.round(C.maxSpeed)} km/saat`],
    ['Marşrut', C.route ? `${(C.route.length / 1000).toFixed(2)} km` : '—'],
  ].map(([a, b]) => `<div><span>${a}</span><b>${b}</b></div>`).join('');
  const list = C.rules.violations.map((v) => `<li class="${v.critical ? 'fail' : ''}">${v.critical ? '✗' : '−' + v.points} ${v.name}${v.extra ? ' (' + v.extra + ')' : ''} — ${Math.floor(v.time / 60)}:${Math.floor(v.time % 60).toString().padStart(2, '0')}</li>`);
  if (!list.length) list.push('<li>Heç bir pozuntu yoxdur.</li>');
  list.push(`<li class="src">Xəritə: ${C.data.source}</li>`);
  $('resNotes').innerHTML = list.join('');
  setMode('result');
  show('result');
}

// ---------- HUD ----------
function updateHUD(inp) {
  $('spd').textContent = car.speedKmh.toFixed(1);
  $('mph').textContent = (car.speedKmh / 1.609).toFixed(1) + ' mph';
  document.querySelectorAll('#gears b').forEach((b) => b.classList.toggle('on', b.dataset.g === car.gear));
  $('bl').classList.toggle('on', game.blinker === 'L' && game.blinkOn);
  $('br').classList.toggle('on', game.blinker === 'R' && game.blinkOn);
  $('wheelIcon').style.transform = `rotate(${car.wheelDeg}deg)`;
  $('wdeg').textContent = `${Math.round(car.wheelDeg)}°`;
  $('pq').style.setProperty('--v', inp.throttle * 100 + '%');
  $('pb').style.setProperty('--v', inp.brake * 100 + '%');
  $('pc').style.setProperty('--v', inp.clutch * 100 + '%');
  const s = game.stats;
  if (game.help.sensors) drawSensorIcon();
  $('tm').textContent = `${Math.floor(s.time / 60)}:${Math.floor(s.time % 60).toString().padStart(2, '0')}`;
  $('col').textContent = s.collisions + (s.curbHits ? ` (+${s.curbHits} bordür)` : '');
  $('mv').textContent = s.moves;
}

// ---------- Vizual və render ----------
function updateVisuals(dt, inp) {
  model.root.position.set(car.x, 0, car.z);
  model.root.rotation.y = car.h;
  updateCarVisual(model, car, dt);
  const L = model.lights;
  L.brake.emissiveIntensity = inp.brake > 0.05 || car.gear === 'P' ? 1.6 : 0.15;
  L.reverse.emissiveIntensity = car.gear === 'R' ? 1.5 : 0;
  L.blinkL.emissiveIntensity = game.blinker === 'L' && game.blinkOn ? 2 : 0;
  L.blinkR.emissiveIntensity = game.blinker === 'R' && game.blinkOn ? 2 : 0;

  // baş hərəkəti: B — çiyin üstündən arxaya
  const lookBack = input.keys.has('KeyB');
  const yawGoal = lookBack ? -2.45 : game.yawTarget;
  game.yaw += (yawGoal - game.yaw) * Math.min(1, dt * 8);
  driverCam.rotation.set(lookBack ? -0.12 : game.pitch, Math.PI + game.yaw, 0);
  driverCam.position.x = 0.37 + (lookBack ? -0.12 : 0);

  const c = carBox(car.x, car.z, car.h);
  if (game.camMode === 'top') {
    freeCam.up.set(0, 0, -1);
    freeCam.position.set(c.cx, game.topZoom, c.cz + 0.01);
    freeCam.lookAt(c.cx, 0, c.cz);
  } else if (game.camMode === 'chase') {
    freeCam.up.set(0, 1, 0);
    const back = car.gear === 'R' ? -1 : 1;
    const goal = new THREE.Vector3(c.cx - Math.sin(car.h) * 8 * back, 4.2, c.cz - Math.cos(car.h) * 8 * back);
    freeCam.position.lerp(goal, Math.min(1, dt * 3));
    freeCam.lookAt(c.cx, 0.8, c.cz);
  }

  // köməkçilər
  const helpers = game.help.ghost;
  const ghostPose = helpers && game.coachRes && game.coachRes.ghost;
  ghost.visible = !!ghostPose;
  if (ghostPose) {
    ghost.position.set(ghostPose.x, 0, ghostPose.z);
    ghost.rotation.y = ghostPose.h;
  }
  if (helpers) updateTrajectory();
  rearDyn.forEach((r) => { r.visible = helpers; });
  if (helpers) updateRearDynamic();

  sun.position.set(car.x + 20, 40, car.z + 12);
  sun.target.position.set(car.x, 0, car.z);
}

function mainCamera() {
  const cam = game.camMode === 'driver' ? driverCam : freeCam;
  cam.layers.disableAll();
  cam.layers.enable(LAYER.WORLD);
  cam.layers.enable(game.camMode === 'driver' ? LAYER.INTERIOR : LAYER.BODY);
  if (game.help.ghost) cam.layers.enable(LAYER.HELPERS);
  return cam;
}

function render() {
  renderer.shadowMap.needsUpdate = settings.shadows;
  const playing = game.mode === 'play' || game.mode === 'pause' || game.mode === 'result';
  if (!playing || !game.world) {
    // menyu fonu: dayanacaq ətrafında fırlanan kamera
    renderer.setRenderTarget(null);
    renderer.render(scene, freeCam);
    return;
  }
  const rearOn = (car.gear === 'R' && settings.autoRearCam) || game.rearCamManual;
  const active = views.filter((v) => (v.key === 'B' ? rearOn : settings.mirrors));
  for (const v of views) v.quad.visible = v.frame.visible = active.includes(v);
  for (const v of views) v.el.style.display = active.includes(v) && game.mode === 'play' ? '' : 'none';
  for (const v of active) {
    renderer.setRenderTarget(v.rt);
    renderer.render(scene, v.cam);
    renderer.shadowMap.needsUpdate = false;
  }
  renderer.setRenderTarget(null);
  renderer.render(scene, mainCamera());
  if (active.length) {
    renderer.autoClear = false;
    renderer.clearDepth();
    renderer.render(overlay, orthoCam);
    renderer.autoClear = true;
  }
}

function onResize() {
  renderer.setSize(innerWidth, innerHeight);
  for (const c of [driverCam, freeCam]) { c.aspect = innerWidth / innerHeight; c.updateProjectionMatrix(); }
  orthoCam.right = innerWidth;
  orthoCam.top = innerHeight;
  orthoCam.updateProjectionMatrix();
  layoutViews();
}
addEventListener('resize', onResize);
onResize();

// Menyu fonu üçün ilk səviyyənin səhnəsi
{
  const bg = buildWorld(LEVELS[0]);
  game.world = null;
  game.menuWorld = bg.group;
  scene.add(bg.group);
  car.reset(LEVELS[0].start);
}

// ---------- Əsas dövr ----------
let last = performance.now();
let menuT = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  game.time += dt;
  const inp = input.poll(dt);

  if (input.consume('Escape')) {
    if (game.mode === 'play') { setMode('pause'); show('pause'); }
    else if (game.mode === 'pause') setMode('play');
  }

  if (game.mode === 'play') {
    if (game.menuWorld) { scene.remove(game.menuWorld); game.menuWorld = null; }
    updatePlay(dt, inp);
    if (game.mode === 'play') { updateHUD(inp); if (TOUCH) touchUI.update(car); }
  } else if (game.mode === 'calib') {
    updateCalibScreen(dt);
  } else {
    sound.sensors(9, 9, dt, false);
  }

  if (game.world) updateVisuals(dt, game.mode === 'play' ? inp : { brake: 0, throttle: 0, clutch: 0 });
  if (!game.world || (game.mode !== 'play' && game.mode !== 'pause' && game.mode !== 'result')) {
    menuT += dt * 0.08;
    freeCam.up.set(0, 1, 0);
    freeCam.position.set(Math.cos(menuT) * 26, 11, Math.sin(menuT) * 26);
    freeCam.lookAt(0, 0, 2);
    model.root.position.set(car.x, 0, car.z);
    model.root.rotation.y = car.h;
  }

  if (toastTimer > 0) { toastTimer -= dt; if (toastTimer <= 0) $('toast').classList.remove('show'); }
  if (Math.floor(game.time * 2) !== Math.floor((game.time - dt) * 2)) updatePadStatus();
  render();
  input.endFrame();
  requestAnimationFrame(frame);
}
setMode('menu');
show('menu');
requestAnimationFrame(frame);

// test və sazlama üçün
// Tətbiqdən çıxanda (fon, başqa pəncərə) avtomatik pauza və girişlərin sıfırlanması
function autoPause() {
  input.keys.clear();
  touchUI.release();
  if (game.mode === 'play') { setMode('pause'); show('pause'); }
}
document.addEventListener('visibilitychange', () => { if (document.hidden) autoPause(); });
addEventListener('blur', autoPause);
addEventListener('pagehide', autoPause);

window.__park = { game, car, startLevel, LEVELS, finish, startCity, CITIES };
