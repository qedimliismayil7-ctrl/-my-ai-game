import * as THREE from 'three';
import './style.css';
import { CarPhysics, CAR, SPEC, GEARS, toWorld, carBox, FixedStepper, ContactTracker, STEER_RATE, closestOnObb, clamp } from './physics.js';
import { buildCar, updateCarVisual, buildGhost, drawCluster, LAYER, VIEW } from './carModel.js';
import { QUALITY, QUALITY_ORDER, TIMES, makeSky, makeEnvironment, makeComposer, FpsMeter } from './gfx.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { decal } from './textures.js';
import { buildWorld } from './world.js';
import { advise } from './advisor.js';
import { LEVELS, GENERAL_LESSONS, makeLevel, randomVariant } from './levels.js';
import { bumperClearance } from './sim.js';

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
  mirrors: true, autoRearCam: true, rearStatic: true, rearDynamic: true, quality: 'auto', timeOfDay: 'day', showFps: false, volume: 0.7,
  touchMode: 'wheel', touchSens: 2, touchSize: 1, touchSwap: false,
  steerDeadzone: 0.02, steerCurve: 1, pedalCurve: 1, kbSteerSpeed: 1,
  seatHeight: 0, seatFwd: 0, fov: 50, mirrorL: 0, mirrorR: 0, mirrorTilt: 0,
};
const SETTING_LABELS = {
  sensors: 'Park sensoru köməkçisi (2023 SEL-də standart deyil — İmtahanda sönülüdür)',
  details: 'Təlimatçının ətraflı izahları (istinad nöqtələri)',
  voice: 'Səsli təlimatçı (brauzer səsi)',
  realGear: 'Real ötürmə qaydaları (dayanmadan və əyləcsiz dəyişmək olmaz)',
  clutchMode: 'Debriyaj rejimi (ötürmə üçün debriyaj)',
  mirrors: 'Güzgüləri göstər',
  autoRearCam: 'R-də arxa kamera avtomatik açılsın',
  rearStatic: 'Arxa kamerada məsafə xətləri (0.5/1/2 m)',
  rearDynamic: 'Arxa kamerada sükanla əyilən xətlər (simulyator köməkçisi — SEL-də təsdiqlənməyib)',
  quality: 'Qrafika keyfiyyəti',
  timeOfDay: 'Günün vaxtı / hava',
  showFps: 'Ölçmə paneli (FPS, kadr vaxtı, draw call, yaddaş)',
  volume: 'Səs səviyyəsi',
  seatHeight: 'Oturacaq hündürlüyü (sm)',
  seatFwd: 'Oturacaq irəli/geri (sm)',
  fov: 'Baxış sahəsi (şaquli °; real hiss üçün 45–55)',
  mirrorL: 'Sol güzgü: sola/sağa (°)',
  mirrorR: 'Sağ güzgü: sola/sağa (°)',
  mirrorTilt: 'Yan güzgülər: yuxarı/aşağı (°)',
  touchMode: 'Telefon: sükan növü',
  touchSens: 'Telefon: sükan həssaslığı',
  touchSize: 'Telefon: düymələrin ölçüsü',
  touchSwap: 'Telefon: pedallar solda, sükan sağda',
  steerDeadzone: 'Sükan: ölü zona (mərkəzdə reaksiya verməyən hissə)',
  steerCurve: 'Sükan: əyri (1 — xətti, böyük — mərkəzdə yumşaq)',
  pedalCurve: 'Qaz/əyləc pedalı: əyri (1 — xətti, böyük — başlanğıcda yumşaq)',
  kbSteerSpeed: 'Klaviatura: sükanın fırlanma sürəti',
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
// Məşq irəliləyişi: hər səviyyədə uğurlu park sayı → köməkçilər mərhələli söndürülür
const PROGRESS_KEY = 'park-sim-progress';
const progress = loadJSON(PROGRESS_KEY, {});
const STAGES = [
  { name: 'Mərhələ 1/4: təlimatçı + xəyali maşın + xətlər', coach: true, ghost: true, traj: true, dyn: true, advisor: true },
  { name: 'Mərhələ 2/4: təlimatçı + xətlər (xəyali maşın yox)', coach: true, ghost: false, traj: true, dyn: true, advisor: true },
  { name: 'Mərhələ 3/4: yalnız xəbərdarlıqlar və arxa kamera xətləri', coach: false, ghost: false, traj: false, dyn: true, advisor: true },
  { name: 'Mərhələ 4/4: köməksiz — güzgülər və sürücü baxışı', coach: false, ghost: false, traj: false, dyn: false, advisor: false },
];
function helpFor(drive, levelId) {
  if (drive === 'learn') return STAGES[0];
  if (drive === 'exam') return { ...STAGES[3], name: 'İmtahan' };
  if (game.practiceHelp === 'full') return STAGES[0];
  if (game.practiceHelp === 'none') return STAGES[3];
  return STAGES[Math.min(3, progress[levelId] || 0)];
}

// ---------- Renderer və səhnə ----------
// Keyfiyyət: "auto" — telefonda Orta, kompüterdə Yüksək ilə başlayır, FPS 48-dən aşağı düşəndə endirilir.
let quality = settings.quality === 'auto' ? (TOUCH ? 'medium' : 'high') : settings.quality;
const renderer = new THREE.WebGLRenderer({ antialias: quality !== 'low', powerPreference: 'high-performance' });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = false;
$('stage').appendChild(renderer.domElement);

const scene = new THREE.Scene();
const HORIZON = 0xcfe0ee;
scene.fog = new THREE.Fog(HORIZON, 80, 260);
const sky = makeSky();
for (let i = 0; i < 5; i++) sky.layers.enable(i);
scene.add(sky);
scene.environment = makeEnvironment(renderer);

const hemi = new THREE.HemisphereLight(0xe4f0ff, 0x6b665c, 0.55);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff1dc, 2.6);
sun.castShadow = true;
Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, near: 1, far: 120 });
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.02;
sun.shadow.radius = 3;
sun.shadow.camera.layers.enable(LAYER.BODY);
scene.add(sun, sun.target);
for (const l of [hemi, sun]) for (let i = 0; i < 5; i++) l.layers.enable(i);
renderer.info.autoReset = false; // draw call sayını bütün kadr üzrə (güzgülər daxil) ölçmək üçün

// Gecə: ən yaxın dirək fənərləri real işıq saçır (hamısı yox — performans üçün 4 ədəd)
const lampLights = [];
for (let i = 0; i < 4; i++) {
  const l = new THREE.SpotLight(0xffc98a, 0, 22, 0.9, 0.6, 1.6);
  l.visible = false;
  for (let k = 0; k < 5; k++) l.layers.enable(k);
  scene.add(l, l.target);
  lampLights.push(l);
}
let timeKey = null;
let curWorld = null; // işıqlandırılan səhnə (menyu və ya səviyyə)
function applyTime(key) {
  const t = TIMES[key] || TIMES.day;
  timeKey = key;
  const u = sky.material.uniforms;
  u.top.value.set(t.top); u.horizon.value.set(t.horizon); u.ground.value.set(t.ground);
  u.sunDir.value.set(...t.sun).normalize();
  u.sunAmt.value = t.night ? 0 : 1;
  scene.environment?.dispose();
  scene.environment = makeEnvironment(renderer, t);
  scene.fog.color.set(t.fog);
  scene.fog.near = t.night ? 30 : 80; scene.fog.far = t.night ? 160 : 260;
  hemi.color.set(t.hemiSky); hemi.groundColor.set(t.hemiGround); hemi.intensity = t.hemiInt;
  sun.color.set(t.sunColor); sun.intensity = t.sunInt;
  renderer.toneMappingExposure = t.exposure;
  for (const l of lampLights) l.visible = t.night || !!t.evening;
  for (const l of lampLights) l.intensity = t.night ? 60 : 12;
  headL.visible = !!t.night || !!t.evening;
  if (curWorld) curWorld.setAtmosphere(t);
  sound.setWet(t.wet);
  lampT = 0;
}
let lampT = 0;
function updateLampLights(dt) {
  if (!curWorld || !lampLights[0].visible) return;
  lampT -= dt;
  if (lampT > 0) return;
  lampT = 0.5;
  const near = curWorld.lamps.map((l) => ({ l, d: (l.pos.x - car.x) ** 2 + (l.pos.z - car.z) ** 2 })).sort((a, b) => a.d - b.d);
  lampLights.forEach((s, i) => {
    const n = near[i];
    s.visible = !!n;
    if (!n) return;
    s.position.copy(n.l.pos);
    s.target.position.set(n.l.pos.x, 0, n.l.pos.z);
  });
}

// ---------- Maşın ----------
const car = new CarPhysics();
const model = buildCar(0x8f9396, true); // Elantra — boz metallik (fotolardakı kimi; rəngin zavod adı təsdiqlənməyib)
scene.add(model.root);
// fənərlər (gecə/axşam): iki spot işıq, maşınla birlikdə hərəkət edir
const headL = new THREE.Group();
for (const sx of [0.6, -0.6]) {
  const h = new THREE.SpotLight(0xf2f4ff, 40, 30, 0.42, 0.5, 1.4);
  h.position.set(sx, 0.7, CAR.length - CAR.rearOverhang - 0.1);
  h.target.position.set(sx * 1.4, 0, CAR.length + 12);
  for (let k = 0; k < 5; k++) h.layers.enable(k);
  headL.add(h, h.target);
}
headL.visible = false;
model.root.add(headL);
// kontakt kölgəsi: təkərlərin və altlığın yerə toxunduğu yerdə yumşaq qaralma (kölgə xəritəsi olmasa da)
{
  const cs = new THREE.Mesh(new THREE.PlaneGeometry(CAR.width + 0.35, CAR.length + 0.3), new THREE.MeshBasicMaterial({ map: decal('shadow'), transparent: true, depthWrite: false, opacity: 0.85, color: 0x000000 }));
  cs.rotation.x = -Math.PI / 2;
  cs.position.set(0, 0.012, CAR.length / 2 - CAR.rearOverhang);
  cs.renderOrder = 1;
  cs.layers.set(LAYER.BODY);
  model.root.add(cs);
}
const ghost = buildGhost();
ghost.visible = false;
scene.add(ghost);

// ---------- Kameralar ----------
const driverCam = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.05, 500);
driverCam.rotation.order = 'YXZ';
driverCam.position.set(...VIEW.eye);
model.root.add(driverCam);

const freeCam = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 500);
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
// Sürücü tərəfi düz güzgü, sərnişin tərəfi qabarıq (ABŞ: geniş bucaq — obyektlər göründüyündən yaxındır)
// Baxış bucaqları (üfüqi): düz güzgünün sahəsi gözdən göründüyü bucağa bərabərdir (≈ şüşənin eni / məsafə).
// Sol düz ≈18°, sağ qabarıq ≈30°, salon ≈32°, arxa kamera ≈120° (genişbucaqlı). Hamısı təxminidir.
const MIRROR_BASE = { L: { yaw: -0.13, pitch: -0.07 }, R: { yaw: 0.23, pitch: -0.1 } };
const camL = mirrorCam(12, 1.6, VIEW.mirrorL, MIRROR_BASE.L.yaw, MIRROR_BASE.L.pitch, [LAYER.WORLD, LAYER.BODY]);
const camR = mirrorCam(20, 1.6, VIEW.mirrorR, MIRROR_BASE.R.yaw, MIRROR_BASE.R.pitch, [LAYER.WORLD, LAYER.BODY]);
const camC = mirrorCam(10, 3.4, VIEW.mirrorC, 0, -0.05, [LAYER.WORLD]);
// Güzgü tənzimləməsi (ayarlarda yadda qalır)
function applyMirrorAdjust() {
  const D = Math.PI / 180;
  camL.rotation.set(MIRROR_BASE.L.pitch + settings.mirrorTilt * D, MIRROR_BASE.L.yaw - settings.mirrorL * D, 0);
  camR.rotation.set(MIRROR_BASE.R.pitch + settings.mirrorTilt * D, MIRROR_BASE.R.yaw - settings.mirrorR * D, 0);
}
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
const rearStatic = new THREE.Group(); // statik məsafə xətləri (0.5 / 1 / 2 m)
const rearDyn = [ribbon(0xffd400), ribbon(0xffd400)]; // dinamik — sükanla əyilir (simulyator köməkçisi)
{
  const addBar = (z, color, w = 2.0) => {
    const r = ribbon(color);
    setRibbon(r, [{ x: -w / 2, z }, { x: w / 2, z }], 0.06);
    rearStatic.add(r);
  };
  addBar(-CAR.rearOverhang - 0.5, 0xff3030);
  addBar(-CAR.rearOverhang - 1.0, 0xffd400);
  addBar(-CAR.rearOverhang - 2.0, 0x2ee66b);
  for (const s of [1, -1]) {
    const r = ribbon(0x2ee66b, 0.55);
    setRibbon(r, [{ x: s * 0.95, z: -CAR.rearOverhang - 0.2 }, { x: s * 0.95, z: -CAR.rearOverhang - 3 }], 0.05);
    rearStatic.add(r);
  }
  rearGuides.add(rearStatic, ...rearDyn);
  rearGuides.traverse((o) => o.layers.set(LAYER.REARCAM));
  model.root.add(rearGuides);
}
function updateRearDynamic() {
  const k = Math.tan(car.delta) / CAR.wheelbase;
  for (const [i, s] of [[0, 1], [1, -1]]) {
    const pts = [];
    let x = 0, z = 0, h = 0;
    for (let n = 0; n <= 24; n++) {
      // arxa bamperin künclərinin gələcək yolu — fizika ilə eyni kinematika (car.predict ilə eyni düstur)
      const c = { x: x + Math.cos(h) * s * (CAR.width / 2) + Math.sin(h) * -CAR.rearOverhang, z: z - Math.sin(h) * s * (CAR.width / 2) + Math.cos(h) * -CAR.rearOverhang };
      pts.push(c);
      const ds = -0.14;
      h += ds * k; x += Math.sin(h) * ds; z += Math.cos(h) * ds;
    }
    setRibbon(rearDyn[i], pts, 0.07, 0.025);
  }
}
// Dünyada trayektoriya (köməkçi layı)
const trajL = ribbon(0x2ee66b, 0.75), trajR = ribbon(0x2ee66b, 0.75);
// dönərkən: irəli — daxili arxa təkərin izi (ön təkərlərdən içəridən keçir); geri — xarici ön küncün açılması
const trajX = ribbon(0xff8c1a, 0.8);
const trajLines = [trajL, trajR, trajX];
for (const t of trajLines) { t.layers.set(LAYER.HELPERS); scene.add(t); }
function updateTrajectory() {
  const dir = car.gear === 'R' ? -1 : 1;
  const pts = car.predict(dir, 7, 40);
  const lz = dir > 0 ? CAR.wheelbase + CAR.frontOverhang : -CAR.rearOverhang;
  const side = (s) => pts.map((p) => toWorld(s * CAR.width / 2, lz, p));
  setRibbon(trajL, side(1), 0.08);
  setRibbon(trajR, side(-1), 0.08);
  const turn = Math.abs(car.delta) > 0.05 ? Math.sign(car.delta) : 0; // +1 sol
  trajX.visible = !!turn;
  if (turn) {
    const p = dir > 0
      ? pts.map((q) => toWorld(turn * CAR.track / 2, 0, q)) // daxili arxa təkər
      : pts.map((q) => toWorld(-turn * CAR.width / 2, CAR.wheelbase + CAR.frontOverhang, q)); // xarici ön künc
    setRibbon(trajX, p, 0.07, 0.035);
  }
}

// ---------- Güzgü görünüşləri (render hədəfləri + ekran üstü quad-lar) ----------
const overlay = new THREE.Scene();
const orthoCam = new THREE.OrthographicCamera(0, innerWidth, innerHeight, 0, -10, 10);
const views = [
  { key: 'L', cam: camL, hfov: 18, label: '', mirror: true, glass: [0.19, 0.115], boost: 1.9, pos: VIEW.mirrorL, shape: 'side' },
  { key: 'C', cam: camC, hfov: 32, label: '', mirror: true, glass: [0.25, 0.068], boost: 1.25, pos: VIEW.mirrorC, shape: 'center' },
  { key: 'R', cam: camR, hfov: 30, label: 'Obyektlər göründüyündən yaxındır', mirror: true, glass: [0.19, 0.115], boost: 1.9, pos: VIEW.mirrorR, shape: 'side' },
  { key: 'B', cam: camRear, hfov: 120, label: 'Arxa kamera — ətrafı yoxlayın', mirror: true, shape: 'screen' },
];
// güzgü formaları (alfa maskası): yan güzgü — yuvarlaq trapesiya, salon — uzun oval, ekran — düzbucaqlı
function maskTex(kind) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, 256, 128);
  g.fillStyle = '#fff';
  g.beginPath();
  if (kind === 'side') {
    g.moveTo(14, 18); g.quadraticCurveTo(10, 4, 40, 6); g.lineTo(226, 10); g.quadraticCurveTo(250, 12, 248, 40);
    g.lineTo(242, 96); g.quadraticCurveTo(236, 124, 200, 122); g.lineTo(46, 116); g.quadraticCurveTo(10, 112, 8, 80); g.closePath();
  } else if (kind === 'center') {
    g.roundRect(4, 8, 248, 112, 52);
  } else g.roundRect(2, 2, 252, 124, 10);
  g.fill();
  const t = new THREE.CanvasTexture(c);
  return t;
}
const rtType = THREE.HalfFloatType;
for (const v of views) {
  v.rt = new THREE.WebGLRenderTarget(256, 128, { type: rtType, samples: 2 });
  const mask = maskTex(v.shape);
  v.frame = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0x07080a, alphaMap: mask, transparent: true, toneMapped: false }));
  v.quad = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: v.rt.texture, alphaMap: mask, transparent: true, side: THREE.DoubleSide }));
  v.quad.position.z = 1;
  overlay.add(v.frame, v.quad);
  v.el = document.createElement('div');
  v.el.className = 'vlabel ' + v.key;
  v.el.textContent = v.label;
  if (!v.label) v.el.style.visibility = 'hidden';
  $('views').appendChild(v.el);
  v.size = [0, 0];
}
// Hər görünüşün ekrandakı düzbucaqlısı: sürücü görünüşündə güzgülər real yerlərinə proyeksiya olunur
// (başı çevirəndə onlar da yer dəyişir), digər kameralarda yuxarıda sabit düzülür.
const _v3 = new THREE.Vector3();
function viewRect(v) {
  const W = innerWidth, H = innerHeight;
  if (v.key === 'B') {
    const rw = Math.min(W * (TOUCH ? 0.3 : 0.32), 480), rh = rw * 0.6;
    return { x: (W - rw) / 2, y: TOUCH ? 112 : 96, w: rw, h: rh };
  }
  // telefonda ekran idarəsi yer tutur — güzgülər yuxarıda sabit sırada qalır
  if (game.camMode === 'driver' && game.mode === 'play' && !TOUCH) {
    driverCam.updateMatrixWorld();
    model.root.localToWorld(_v3.set(...v.pos));
    const dist = _v3.distanceTo(driverCam.getWorldPosition(new THREE.Vector3()));
    _v3.project(driverCam);
    // arxada qalırsa (başı çevirəndə) gizlət; ekrandan bir az kənardadırsa kənara sıx (salon güzgüsü yuxarıda, yan güzgülər kənarda)
    if (_v3.z > 1 || Math.abs(_v3.x) > 2.2 || Math.abs(_v3.y) > 2.2) return null;
    const pxPerRad = H / (2 * Math.tan((driverCam.fov * Math.PI) / 360));
    let w = (v.glass[0] / dist) * pxPerRad * v.boost, h = (v.glass[1] / dist) * pxPerRad * v.boost;
    const minW = Math.min(W * (v.key === 'C' ? 0.26 : 0.17), 400);
    if (w < minW) { h *= minW / w; w = minW; }
    let x = ((_v3.x + 1) / 2) * W - w / 2, y = ((_v3.y + 1) / 2) * H - h / 2;
    x = Math.max(4, Math.min(W - w - 4, x));
    y = Math.max(4, Math.min(H - h - 4, y));
    return { x, y, w, h };
  }
  const sw = Math.min(W * 0.2, 300), sh = sw * 0.6;
  const cw = Math.min(W * 0.28, 420), ch = cw * 0.28;
  return { L: { x: 10, y: H - 10 - sh, w: sw, h: sh }, R: { x: W - 10 - sw, y: H - 10 - sh, w: sw, h: sh }, C: { x: (W - cw) / 2, y: H - 8 - ch, w: cw, h: ch } }[v.key];
}
function layoutViews() {
  const H = innerHeight;
  const pr = renderer.getPixelRatio() * QUALITY[quality].mirrorScale;
  for (const v of views) {
    const r = viewRect(v);
    v.rect = r;
    if (!r) continue;
    // render hədəfinin ölçüsü 32 px-ə yuvarlaqlaşdırılır — hər kadr yenidən yaradılmasın
    const tw = Math.max(64, Math.round((r.w * pr) / 32) * 32), th = Math.max(32, Math.round((r.h * pr) / 32) * 32);
    if (tw !== v.size[0] || th !== v.size[1]) {
      v.size = [tw, th];
      v.rt.setSize(tw, th);
      v.cam.aspect = r.w / r.h;
      // üfüqi bucaq sabit qalır (ekrandakı ölçüdən asılı olmayaraq eyni sahə görünür)
      v.cam.fov = (2 * Math.atan(Math.tan((v.hfov * Math.PI) / 360) / v.cam.aspect) * 180) / Math.PI;
      v.cam.updateProjectionMatrix();
    }
    v.cam.far = v.key === 'B' ? 40 : QUALITY[quality].mirrorFar;
    v.quad.position.set(r.x + r.w / 2, r.y + r.h / 2, 1);
    v.quad.scale.set(v.mirror ? -r.w : r.w, r.h, 1);
    v.frame.position.set(r.x + r.w / 2, r.y + r.h / 2, 0);
    v.frame.scale.set(r.w * 1.06 + 6, r.h * 1.1 + 6, 1);
    v.el.style.left = r.x + r.w / 2 + 'px';
    v.el.style.top = H - r.y - 16 + 'px';
  }
}

// ---------- Vəziyyət ----------
const input = new Input();
const touchUI = setupTouch(input, settings);
input.cfg = settings;
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
  yaw: 0, pitch: -0.1, yawTarget: 0, headSway: 0,
  rearCamManual: false,
  blinker: null, blinkT: 0, blinkOn: false,
  stats: null,
  lastDir: 0,
  lastHit: -10,
  parkTimer: 0,
  clear: { front: 9, rear: 9 },
  drive: 'learn',
  help: { coach: true, ghost: true, sensors: true, freeCam: true },
  practiceHelp: 'auto',
  coachRes: null,
  lastSpoken: '',
  time: 0,
  finished: false,
};
const stepper = new FixedStepper(1 / 120); // fizika addımı 120 Hz
const CAM_NAMES = { driver: 'Sürücü', top: 'Yuxarıdan', chase: 'Arxadan' };

function startLevel(base, drive = game.drive) {
  game.drive = drive;
  const lv = drive === 'practice' ? makeLevel(base.id, randomVariant(base.id)) : makeLevel(base.id);
  if (game.world) scene.remove(game.world.group);
  game.level = lv;
  game.world = buildWorld(lv);
  scene.add(game.world.group);
  curWorld = game.world;
  curWorld.setAtmosphere(TIMES[timeKey] || TIMES.day);
  lampT = 0;
  game.obstacles = game.world.obstacles;
  car.reset(lv.start);
  input.kbSteer = 0;
  if (input.touch) input.touch.steer = 0;
  const st = helpFor(drive, base.id);
  game.help = { coach: st.coach, ghost: st.ghost, traj: st.traj, dyn: st.dyn && settings.rearDynamic, advisor: st.advisor, sensors: drive !== 'exam' && settings.sensors, freeCam: drive !== 'exam', stage: st.name };
  if (drive === 'practice') setTimeout(() => toast(st.name), 300);
  game.coach = game.help.coach ? new Coach(lv.coach) : null;
  game.stats = { time: 0, collisions: 0, curbHits: 0, moves: 0, signaled: false, signalTime: 0, maxSpeed: 0, reversed: false, lookedBack: false, gearAbuse: 0 };
  game.lastDir = 0;
  game.lastHit = -10;
  stepper.reset();
  game.curbContact = new ContactTracker(0.6);
  game.mistakes = [];
  game.lastWhy = '';
  game.advice = null; game.adviceT = 0; game.adviceHold = 0;
  game.bodyContact = new ContactTracker(0.6);
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
  if (m !== 'play' && game.camMode === 'photo') togglePhoto();
  document.body.classList.toggle('playing', m === 'play');
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
let briefLevel = null;
function openBrief(lv) {
  briefLevel = lv;
  $('briefTitle').textContent = `${lv.id}. ${lv.name}`;
  $('briefShort').textContent = lv.short + ` · Norma: ${lv.par.moves} manevr, ${lv.par.time} saniyə`;
  $('briefTheory').innerHTML = lv.theory.map((t) => `<li>${t}</li>`).join('');
  $('briefHelp').value = game.practiceHelp;
  $('briefStage').textContent = ` · indi: ${STAGES[Math.min(3, progress[lv.id] || 0)].name} (uğurlu: ${progress[lv.id] || 0})`;
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
  game.practiceHelp = $('briefHelp').value;
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
    if (k === 'quality') {
      inp = document.createElement('select');
      inp.innerHTML = '<option value="auto">Avtomatik</option>' + QUALITY_ORDER.map((q) => `<option value="${q}">${QUALITY[q].name}</option>`).join('');
      inp.value = settings[k];
      inp.onchange = () => { settings[k] = inp.value; save(); };
    } else if (k === 'timeOfDay') {
      inp = document.createElement('select');
      inp.innerHTML = Object.keys(TIMES).map((t) => `<option value="${t}">${TIMES[t].name}</option>`).join('');
      inp.value = settings[k];
      inp.onchange = () => { settings[k] = inp.value; save(); };
    } else if (k === 'touchMode') {
      inp = document.createElement('select');
      inp.innerHTML = '<option value="wheel">Fırlanan sükan</option><option value="slider">Sağa-sola sürüşdürmə</option>';
      inp.value = settings[k];
      inp.onchange = () => { settings[k] = inp.value; save(); };
    } else if (typeof DEFAULTS[k] === 'number') {
      inp = document.createElement('input');
      const [min, max, step] = { seatHeight: [-6, 6, 1], seatFwd: [-10, 10, 1], fov: [35, 70, 1], mirrorL: [-10, 10, 0.5], mirrorR: [-10, 10, 0.5], mirrorTilt: [-6, 6, 0.5], volume: [0, 1, 0.05], touchSens: [1, 4, 0.5], touchSize: [0.8, 1.4, 0.1], steerDeadzone: [0, 0.1, 0.01], steerCurve: [1, 2.5, 0.1], pedalCurve: [1, 2.5, 0.1], kbSteerSpeed: [0.5, 2, 0.1] }[k];
      Object.assign(inp, { type: 'range', min, max, step, value: settings[k] });
      const out = document.createElement('output');
      out.textContent = settings[k];
      inp.oninput = () => { settings[k] = +inp.value; out.textContent = inp.value; sound.setVolume(settings.volume); save(); };
      l.append(SETTING_LABELS[k], inp, out);
      inp.id = 'set-' + k;
      box.appendChild(l);
      continue;
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
// Keyfiyyət pilləsini tətbiq et (piksel sıxlığı, kölgələr, bloom, boya laki, güzgü ölçüsü)
let gfxComposer = null;
function applyQuality(q) {
  quality = q;
  const Q = QUALITY[q];
  renderer.setPixelRatio(Math.min(devicePixelRatio, Q.pixelRatio));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = Q.shadows;
  if (Q.shadows && sun.shadow.mapSize.x !== Q.shadowSize) {
    sun.shadow.mapSize.set(Q.shadowSize, Q.shadowSize);
    sun.shadow.map?.dispose();
    sun.shadow.map = null;
  }
  scene.traverse((o) => {
    const m = o.material;
    if (!m) return;
    if (m.isMeshPhysicalMaterial && m.clearcoat !== undefined && m.userData.cc === undefined) m.userData.cc = m.clearcoat;
    if (m.isMeshPhysicalMaterial && m.userData.cc) m.clearcoat = Q.clearcoat ? m.userData.cc : 0;
    if (m.isMeshStandardMaterial) m.envMapIntensity = (m.userData.env ?? (m.userData.env = m.envMapIntensity)) * Q.envIntensity;
    m.needsUpdate = true;
  });
  if (gfxComposer && gfxComposer.withAO !== !!Q.ao) { gfxComposer.composer.dispose(); gfxComposer = null; }
  if (Q.bloom && !gfxComposer) gfxComposer = makeComposer(renderer, scene, driverCam, !!Q.ao);
  if (gfxComposer) gfxComposer.composer.setSize(innerWidth, innerHeight);
  if (gfxComposer) gfxComposer.composer.setPixelRatio(renderer.getPixelRatio());
  for (const v of views) v.size = [0, 0];
  layoutViews();
}

function applySeat() {
  driverCam.fov = settings.fov;
  driverCam.updateProjectionMatrix();
}
function applySettings() {
  applySeat();
  applyMirrorAdjust();
  const want = settings.quality === 'auto' ? quality : settings.quality;
  if (want !== quality || settings.quality !== appliedQualitySetting) { appliedQualitySetting = settings.quality; applyQuality(settings.quality === 'auto' ? (TOUCH ? 'medium' : 'high') : settings.quality); }
  $('fps').classList.toggle('hidden', !settings.showFps);
  if (settings.timeOfDay !== timeKey) applyTime(settings.timeOfDay);
  touchUI.applyLayout();
  if (game.level && game.drive !== 'exam') {
    game.help.sensors = settings.sensors;
    document.querySelector('.sensor').classList.toggle('hidden', !game.help.sensors);
  }
  scene.traverse((o) => { if (o.material) o.material.needsUpdate = true; });
}
let appliedQualitySetting = null;
applySettings();

// Pauza / nəticə düymələri
$('resume').onclick = () => setMode('play');
$('restart').onclick = () => startLevel(game.level);
$('pauseTheory').onclick = () => { if (game.level) openBrief(LEVELS[game.level.id - 1]); };
$('resRetry').onclick = () => startLevel(game.level);
$('resNext').onclick = () => openBrief(LEVELS[game.level.id % LEVELS.length]);

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
// Gövdənin hansı hissəsi dəydi (ön/arxa bamper, künc, yan)
function partName(hit) {
  const b = carBox(car.x, car.z, car.h);
  const q = closestOnObb(b.cx, b.cz, hit.hit);
  const loc = toLocalPose(q.x, q.z);
  const fz = loc.lz > CAR.wheelbase ? 'ön' : loc.lz < 0 ? 'arxa' : '';
  const side = Math.abs(loc.lx) > CAR.width * 0.25 ? (loc.lx > 0 ? 'sol' : 'sağ') : '';
  if (fz && side) return `${fz} ${side} künc`;
  if (fz) return `${fz} bamper`;
  return `${side || ''} yan`.trim();
}
function toLocalPose(px, pz) {
  const s = Math.sin(car.h), c = Math.cos(car.h), dx = px - car.x, dz = pz - car.z;
  return { lx: dx * c - dz * s, lz: dx * s + dz * c };
}
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
// Foto rejimi: sərbəst kamera (fırlat/yaxınlaşdır), interfeys gizlənir, fizika dayanır
const orbit = new OrbitControls(freeCam, renderer.domElement);
orbit.enabled = false;
orbit.enableDamping = true;
orbit.maxPolarAngle = Math.PI * 0.495;
orbit.minDistance = 1.5;
orbit.maxDistance = 40;
function togglePhoto() {
  if (game.camMode === 'photo') {
    game.camMode = game.prevCam || 'driver';
    orbit.enabled = false;
    document.body.classList.remove('photo');
    toast(CAM_NAMES[game.camMode]);
    return;
  }
  if (!game.help.freeCam) { toast('İmtahanda foto rejimi yoxdur'); return; }
  game.prevCam = game.camMode;
  game.camMode = 'photo';
  const c = carBox(car.x, car.z, car.h);
  freeCam.up.set(0, 1, 0);
  freeCam.position.set(c.cx - Math.sin(car.h + 0.7) * 6.5, 1.6, c.cz - Math.cos(car.h + 0.7) * 6.5);
  orbit.target.set(c.cx, 0.7, c.cz);
  orbit.enabled = true;
  orbit.update();
  document.body.classList.add('photo');
  toast('Foto rejimi — sürüşdür: fırlat, təkər/çimdik: yaxınlaşdır, F: çıx');
}
$('photoBtn').onclick = () => togglePhoto();
function cycleCam() {
  if (game.camMode === 'photo') togglePhoto();
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
  if (input.consume('KeyF')) togglePhoto();
  if (input.consume('KeyV')) game.rearCamManual = !game.rearCamManual;
  if (input.consume('KeyM')) { settings.mirrors = !settings.mirrors; saveJSON(SETTINGS_KEY, settings); }
  if (input.consume('KeyH') && game.drive !== 'exam') {
    if (game.coach) game.coach = null;
    else { game.coach = new Coach(game.level.coach); fastForwardCoach(); }
    $('coach').classList.toggle('hidden', !game.coach);
  }
  if (input.consume('KeyG') && game.drive !== 'exam') { game.help.ghost = !game.help.ghost; game.help.traj = game.help.ghost; }
  if (input.consume('KeyT')) { startLevel(game.level); return; }
  if (input.consume('Enter')) { finish(); return; }
  for (const ev of input.padEvents) {
    if (['D', 'R', 'N', 'P'].includes(ev)) shiftTo(ev, inp);
    if (ev === 'up') shiftStep(1, inp);
    if (ev === 'down') shiftStep(-1, inp);
    if (ev === 'sigL') toggleBlinker('L');
    if (ev === 'sigR') toggleBlinker('R');
    if (ev === 'cam') cycleCam();
  }

  // fizika: sabit 120 Hz addım — nəticə kadr sürətindən asılı deyil
  const pin = { ...inp, clutchMode: settings.clutchMode && !!input.map?.clutch, steerRate: inp.source === 'wheel' ? STEER_RATE.wheel : STEER_RATE.hands };
  if (game.camMode !== 'photo') stepper.advance(dt, (h) => {
    const hit = car.step(h, pin, game.obstacles);
    // davamlı təmas bir dəfə sayılır; təkərin bordürə dəyməsi və gövdənin/güzgünün maneəyə dəyməsi ayrıdır
    const curb = hit && hit.hit.type === 'curb';
    const newCurb = game.curbContact.step(h, curb ? hit : null);
    const newHit = game.bodyContact.step(h, hit && !curb ? hit : null);
    if (newCurb) {
      game.stats.curbHits++;
      toast(hit.part.startsWith('tire_front') ? 'Ön təkər bordürə dirəndi' : 'Arxa təkər bordürə dirəndi', true);
      sound.bump(hit.impact);
      input.rumble(0.3, 0.3, 150);
    }
    if (newHit) {
      game.stats.collisions++;
      const where = hit.part === 'mirrorL' ? 'sol güzgü' : hit.part === 'mirrorR' ? 'sağ güzgü' : partName(hit);
      toast(`Toqquşma: ${where} → ${hit.hit.name}`, true);
      game.mistakes.push(`Toqquşma (${where}).` + (game.lastWhy ? ' ' + game.lastWhy : ''));
      sound.crash(hit.impact);
      input.rumble(Math.min(1, 0.4 + hit.impact), 0.6, 250);
    }
  });

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
  sound.engine(inp.throttle, Math.abs(car.v), true, car.gear);

  // təlimatçı
  let r = null;
  if (game.coach) {
    const prev = game.coach.i;
    r = game.coach.update({ ...car.pose, v: car.v, delta: car.delta, gear: car.gear, steer: car.steer, blinker: game.blinker, clear: game.clear });
    game.coachRes = r;
    if (game.coach.i !== prev) sound.step();
  } else game.coachRes = null;
  // səhvə uyğun izah (maşının real həndəsəsindən): hər 0.1 s; mesaj ən azı 1.2 s qalır ki, titrəməsin
  game.adviceT -= dt;
  if (game.adviceT <= 0) {
    game.adviceT = 0.1;
    const a = advise({ pose: car.pose, v: car.v, delta: car.delta, gear: car.gear, steer: car.steer, obstacles: game.obstacles, step: r?.step, rem: r?.rem });
    if (a) { game.advice = a; game.adviceHold = 1.2; if (a.why) game.lastWhy = a.why; }
  }
  game.adviceHold -= dt;
  if (game.adviceHold <= 0) game.advice = null;
  const adv = game.help.advisor ? game.advice : null;
  if (r || adv) {
    $('coach').classList.remove('hidden');
    renderCoach(adv && (adv.level !== 'info' || !r) ? { ...(r || { stepNo: 0, total: 0 }), text: adv.text, hint: adv.why, remain: '', status: adv.level === 'danger' ? 'stop' : adv.level === 'warn' ? 'back' : 'go', forceHint: true } : r);
  } else $('coach').classList.add('hidden');

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
  const showHint = settings.details || r.forceHint || r.status === 'back' || r.status === 'stop';
  const key = r.text + '|' + r.remain + '|' + (showHint ? r.hint : '') + '|' + r.status;
  if (key === coachShown) return;
  coachShown = key;
  const keys = (t) => (TOUCH ? t.replace(/\(X\)/g, '(▶)').replace(/\(Z\)/g, '(◀)').replace(/\(B\)/g, '(👀)') : t);
  $('coachText').textContent = keys(r.text);
  $('coachRemain').textContent = r.remain || '';
  $('coachHint').textContent = showHint && (r.status !== 'stop' || r.forceHint) ? keys(r.hint) : '';
  $('coachStep').textContent = r.total ? `${Math.min(r.stepNo, r.total)}/${r.total}` : '';
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
  if (res.passed && game.drive === 'practice' && res.stars >= 2) {
    progress[game.level.id] = (progress[game.level.id] || 0) + 1;
    saveJSON(PROGRESS_KEY, progress);
  }
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
  const why = [...new Set(game.mistakes)].slice(0, 3).map((n) => `<li class="why">↳ ${n}</li>`);
  $('resNotes').innerHTML = [...res.fails.map((n) => `<li class="fail">✗ ${n}</li>`), ...why, ...res.notes.map((n) => `<li>${n}</li>`)].join('');
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
  // oturacaq mövqeyi (ayar) + çiyin üstündən baxış; çox zəif yellənmə: təcildə baş 1–2 mm-dən az hərəkət edir
  game.headSway += (clamp(-car.accel * 0.002, -0.006, 0.006) - game.headSway) * Math.min(1, dt * 4);
  driverCam.position.set(VIEW.eye[0] + (lookBack ? -0.12 : 0), VIEW.eye[1] + settings.seatHeight / 100, VIEW.eye[2] + settings.seatFwd / 100 + game.headSway);

  const c = carBox(car.x, car.z, car.h);
  if (game.camMode === 'top') {
    freeCam.up.set(0, 0, -1);
    freeCam.position.set(c.cx, game.topZoom, c.cz + 0.01);
    freeCam.lookAt(c.cx, 0, c.cz);
  } else if (game.camMode === 'photo') {
    orbit.update();
  } else if (game.camMode === 'chase') {
    freeCam.up.set(0, 1, 0);
    const back = car.gear === 'R' ? -1 : 1;
    const goal = new THREE.Vector3(c.cx - Math.sin(car.h) * 8 * back, 4.2, c.cz - Math.cos(car.h) * 8 * back);
    freeCam.position.lerp(goal, Math.min(1, dt * 3));
    freeCam.lookAt(c.cx, 0.8, c.cz);
  }

  // köməkçilər
  const ghostPose = game.help.ghost && game.coachRes && game.coachRes.ghost;
  ghost.visible = !!ghostPose;
  if (ghostPose) {
    ghost.position.set(ghostPose.x, 0, ghostPose.z);
    ghost.rotation.y = ghostPose.h;
  }
  for (const t of trajLines) t.visible = !!game.help.traj;
  if (game.help.traj) updateTrajectory();
  rearDyn.forEach((r) => { r.visible = !!game.help.dyn; });
  rearStatic.visible = settings.rearStatic;
  if (game.help.dyn) updateRearDynamic();

  // günəş: seçilmiş vaxtın istiqamətindən (kölgə kamerası maşının ətrafında)
  const sd = sky.material.uniforms.sunDir.value;
  sun.position.set(car.x + sd.x * 50, sd.y * 50, car.z + sd.z * 50);
  sun.target.position.set(car.x, 0, car.z);
}

function mainCamera() {
  const cam = game.camMode === 'driver' ? driverCam : freeCam;
  cam.layers.disableAll();
  cam.layers.enable(LAYER.WORLD);
  cam.layers.enable(LAYER.INTERIOR); // salon həm içəridən, həm şüşədən görünür
  if (game.camMode !== 'driver') cam.layers.enable(LAYER.BODY);
  if (model.driverSeat) model.driverSeat.visible = game.camMode !== 'driver';
  if ((game.help.ghost || game.help.traj) && game.camMode !== 'photo') cam.layers.enable(LAYER.HELPERS);
  return cam;
}

let frameNo = 0;
function render() {
  frameNo++;
  renderer.info.reset();
  renderer.shadowMap.needsUpdate = QUALITY[quality].shadows;
  const playing = game.mode === 'play' || game.mode === 'pause' || game.mode === 'result';
  const cam = playing && game.world ? mainCamera() : freeCam;
  if (!playing || !game.world) {
    if (!cam.layers.isEnabled(LAYER.BODY)) cam.layers.enable(LAYER.BODY);
    cam.layers.enable(LAYER.INTERIOR);
    if (model.driverSeat) model.driverSeat.visible = true;
    drawMain(cam);
    return;
  }
  const rearOn = (car.gear === 'R' && settings.autoRearCam) || game.rearCamManual;
  layoutViews();
  const active = game.camMode === 'photo' ? [] : views.filter((v) => v.rect && (v.key === 'B' ? rearOn : settings.mirrors));
  for (const v of views) v.quad.visible = v.frame.visible = active.includes(v);
  for (const v of views) v.el.style.display = active.includes(v) && game.mode === 'play' && v.label ? '' : 'none';
  // yan güzgülər növbə ilə yenilənir (aşağı/orta keyfiyyətdə), salon güzgüsü və arxa kamera hər kadr
  const every = QUALITY[quality].mirrorEvery;
  for (const v of active) {
    if (every > 1 && (v.key === 'L' || v.key === 'R') && v.rendered && (frameNo + (v.key === 'R' ? 1 : 0)) % every) continue;
    renderer.setRenderTarget(v.rt);
    renderer.render(scene, v.cam);
    v.rendered = true;
    renderer.shadowMap.needsUpdate = false;
  }
  renderer.setRenderTarget(null);
  drawMain(cam);
  if (active.length) {
    renderer.autoClear = false;
    renderer.clearDepth();
    renderer.render(overlay, orthoCam);
    renderer.autoClear = true;
  }
}
function drawMain(cam) {
  if (QUALITY[quality].bloom && gfxComposer) {
    gfxComposer.pass.camera = cam;
    if (gfxComposer.ao) gfxComposer.ao.camera = cam;
    gfxComposer.composer.render();
  } else {
    renderer.setRenderTarget(null);
    renderer.render(scene, cam);
  }
}

function onResize() {
  renderer.setSize(innerWidth, innerHeight);
  if (gfxComposer) gfxComposer.composer.setSize(innerWidth, innerHeight);
  for (const v of views) v.size = [0, 0];
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
  curWorld = bg;
  bg.setAtmosphere(TIMES[timeKey] || TIMES.day);
  game.world = null;
  game.menuWorld = bg.group;
  scene.add(bg.group);
  car.reset(LEVELS[0].start);
}

// ---------- Əsas dövr ----------
let last = performance.now();
let menuT = 0;
const fpsMeter = new FpsMeter();
let clusterT = 0;
function frame(now) {
  const real = (now - last) / 1000;
  const dt = Math.min(0.05, real);
  last = now;
  fpsMeter.tick(real);
  if (settings.showFps && frameNo % 10 === 0) {
    const i = renderer.info, mem = performance.memory;
    $('fps').textContent = `${fpsMeter.fps.toFixed(0)} FPS · ${(1000 / Math.max(1, fpsMeter.fps)).toFixed(1)} ms · ${QUALITY[quality].name}\n` +
      `draw call ${i.render.calls} · üçbucaq ${(i.render.triangles / 1000).toFixed(0)}k\n` +
      `həndəsə ${i.memory.geometries} · tekstur ${i.memory.textures}` + (mem ? ` · JS ${(mem.usedJSHeapSize / 1048576).toFixed(0)} MB` : '');
  }
  if (settings.quality === 'auto' && game.mode === 'play' && fpsMeter.shouldDowngrade(real)) {
    const i = QUALITY_ORDER.indexOf(quality);
    if (i > 0) { applyQuality(QUALITY_ORDER[i - 1]); toast(`Qrafika: ${QUALITY[quality].name} (FPS aşağı idi)`); }
  }
  clusterT -= dt;
  if (clusterT <= 0 && model.clusterTex && game.camMode === 'driver') {
    clusterT = 0.15;
    drawCluster(car.speedKmh, car.gear);
    model.clusterTex.needsUpdate = true;
  }
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

  updateLampLights(dt);
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

window.__park = { game, car, startLevel, LEVELS, finish, setMode, applyTime, togglePhoto, renderer, model, scene, settings, applySettings };
