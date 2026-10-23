// Maşının 3D modeli. Mənşə: arxa oxun mərkəzi, yer səviyyəsi; irəli = lokal +Z, sol = lokal +X.
// Laylar: 0 dünya, 1 maşının xarici gövdəsi, 2 salon (yalnız sürücü kamerası), 3 arxa kamera xətləri, 4 köməkçilər.
// Oyunçunun maşını 2023 Elantra-nın ölçülərindədir (physics.js → CAR); siluet və salon təxminidir.
import * as THREE from 'three';
import { CAR, PARKED } from './physics.js';

export const LAYER = { WORLD: 0, BODY: 1, INTERIOR: 2, REARCAM: 3, HELPERS: 4 };

// Sürücünün gözü, güzgülər və arxa kamera (lokal koordinatlar, təxmini — salon fotolarına görə)
export const VIEW = {
  eye: [0.37, 1.17, 1.1],
  mirrorL: [CAR.width / 2 + 0.11, 0.98, 1.98],
  mirrorR: [-CAR.width / 2 - 0.11, 0.98, 1.98],
  mirrorC: [0, 1.27, 1.55],
  rearCam: [0, 0.98, -CAR.rearOverhang + 0.04],
};

function box(w, h, l, mat, x, y, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, l), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function setLayer(obj, layer, extra = []) {
  obj.traverse((o) => {
    o.layers.set(layer);
    for (const e of extra) o.layers.enable(e);
  });
}

// Yan profildən (z, y nöqtələri) eninə uzanan gövdə
function profileMesh(points, width, mat, bevel = 0.06) {
  const shape = new THREE.Shape(points.map(([z, y]) => new THREE.Vector2(z, y)));
  const g = new THREE.ExtrudeGeometry(shape, { depth: width - 2 * bevel, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 4 });
  g.rotateY(-Math.PI / 2);
  g.translate(width / 2 - bevel, 0, 0);
  const m = new THREE.Mesh(g, mat);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

const tireMat = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.9 });
const rimMat = new THREE.MeshStandardMaterial({ color: 0x2b2e33, metalness: 0.6, roughness: 0.4 }); // SEL: tünd 16" disk
const glassMat = new THREE.MeshStandardMaterial({ color: 0x1a232c, metalness: 0.5, roughness: 0.12, transparent: true, opacity: 0.88 });
const blackMat = new THREE.MeshStandardMaterial({ color: 0x111214, roughness: 0.8 });

function makeWheel(radius) {
  const g = new THREE.Group();
  const tg = new THREE.CylinderGeometry(radius, radius, 0.21, 22);
  tg.rotateZ(Math.PI / 2);
  const tire = new THREE.Mesh(tg, tireMat);
  tire.castShadow = true;
  const rg = new THREE.CylinderGeometry(radius * 0.66, radius * 0.66, 0.22, 16);
  rg.rotateZ(Math.PI / 2);
  const rim = new THREE.Mesh(rg, rimMat);
  g.add(tire, rim);
  for (let i = 0; i < 5; i++) {
    const s = new THREE.Mesh(new THREE.BoxGeometry(0.225, 0.045, radius * 1.2), rimMat);
    s.rotation.x = (i * Math.PI * 2) / 5;
    g.add(s);
  }
  g.position.y = radius;
  return g;
}

// dims: { length, width, wheelbase, rearOverhang, track } — verilməsə oyunçunun maşını (Elantra)
export function buildCar(color = 0x8d9095, player = false, dims = null) {
  const D = dims || CAR;
  const W = D.width, HW = W / 2;
  const R0 = -D.rearOverhang, F0 = D.length - D.rearOverhang;
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const paint = new THREE.MeshStandardMaterial({ color, metalness: 0.55, roughness: 0.38 });

  // Sedan siluet: alçaq kapot, maili şüşə, arxaya enən "kupe" damı, qısa baqaj (Elantra kimi)
  const wb = D.wheelbase;
  const lower = [
    [F0, 0.32], [F0 + 0.02, 0.62], [F0 - 0.15, 0.74], [wb * 0.66, 0.92], [wb * 0.2, 0.96],
    [R0 + 0.35, 0.99], [R0 + 0.02, 0.92], [R0, 0.62], [R0 + 0.05, 0.32],
  ];
  body.add(profileMesh(lower, W, paint));
  const gh = [[wb * 0.68, 0.9], [wb * 0.32, 1.38], [-0.15, 1.37], [R0 + 0.55, 0.98], [wb * 0.6, 0.94]];
  body.add(profileMesh(gh, W - 0.16, glassMat, 0.04));
  body.add(profileMesh([[wb * 0.36, 1.375], [wb * 0.33, 1.4], [-0.1, 1.39], [-0.2, 1.36]], W - 0.3, paint, 0.03));
  body.add(box(W - 0.06, 0.16, 0.1, blackMat, 0, 0.36, F0 - 0.02));
  body.add(box(W - 0.06, 0.16, 0.1, blackMat, 0, 0.38, R0 + 0.03));
  // radiator barmaqlığı (sadələşdirilmiş)
  body.add(box(W * 0.62, 0.22, 0.04, blackMat, 0, 0.5, F0 + 0.005));
  for (const s of [1, -1]) body.add(box(0.2, 0.12, 0.09, paint, s * (HW + 0.08), 0.98, 1.98));

  // təkərlər (205/55R16 → radius ≈ 0.32 m)
  const wheels = {};
  const track = D.track || W - 0.25;
  for (const [k, x, z] of [['fl', 1, wb], ['fr', -1, wb], ['rl', 1, 0], ['rr', -1, 0]]) {
    const pivot = new THREE.Group();
    pivot.position.set(x * track / 2, 0, z);
    const w = makeWheel(0.316);
    pivot.add(w);
    root.add(pivot);
    wheels[k] = { pivot, wheel: w };
  }

  // işıqlar
  const lights = {};
  const mk = (c, e) => new THREE.MeshStandardMaterial({ color: c, emissive: e, emissiveIntensity: 0 });
  const headMat = mk(0xfff6d8, 0xfff2c0);
  headMat.emissiveIntensity = 0.4;
  for (const s of [1, -1]) {
    const hl = box(0.42, 0.07, 0.05, headMat, s * (HW - 0.3), 0.72, F0 - 0.08);
    hl.rotation.y = s * 0.25;
    body.add(hl);
  }
  lights.brake = mk(0x5a0b0b, 0xff2020);
  lights.reverse = mk(0xdddddd, 0xffffff);
  lights.blinkL = mk(0x6a3d00, 0xffa000);
  lights.blinkR = mk(0x6a3d00, 0xffa000);
  // arxa işıqlar — bütün eni boyu zolaq (Elantra kimi, sadələşdirilmiş)
  body.add(box(W - 0.2, 0.05, 0.03, lights.brake, 0, 0.88, R0 + 0.04));
  for (const s of [1, -1]) {
    body.add(box(0.1, 0.06, 0.03, lights.reverse, s * 0.25, 0.74, R0 + 0.02));
    const bm = s > 0 ? lights.blinkL : lights.blinkR;
    body.add(box(0.12, 0.06, 0.03, bm, s * (HW - 0.12), 0.8, R0 + 0.03));
    body.add(box(0.14, 0.04, 0.03, bm, s * (HW - 0.18), 0.66, F0 - 0.02));
    body.add(box(0.03, 0.04, 0.1, bm, s * (HW + 0.13), 0.96, 1.98));
  }

  setLayer(root, player ? LAYER.BODY : LAYER.WORLD);
  const out = { root, wheels, lights, paint };
  if (player) addInterior(root, out, paint, HW);
  return out;
}

export function buildParkedCar(color) {
  return buildCar(color, false, { length: PARKED.length, width: PARKED.width, wheelbase: 2.8, rearOverhang: 1.05, track: 1.6 });
}

// Salon: 2023 Elantra fotolarına əsasən (təxmini). Yalnız sürücü kamerası görür.
function addInterior(root, out, paint, HW) {
  const hood = box(CAR.width - 0.3, 0.02, 1.1, paint, 0, 0.9, 3.0);
  hood.rotation.x = 0.1;
  hood.castShadow = false;
  root.add(hood);
  setLayer(hood, LAYER.BODY, [LAYER.INTERIOR]);

  const g = new THREE.Group();
  const dash = new THREE.MeshStandardMaterial({ color: 0x1c1e21, roughness: 0.85 });
  const trim = new THREE.MeshStandardMaterial({ color: 0x2a2d31, roughness: 0.8 });
  const chrome = new THREE.MeshStandardMaterial({ color: 0x9aa0a6, metalness: 0.8, roughness: 0.3 });
  const headliner = new THREE.MeshStandardMaterial({ color: 0x8e8c88, roughness: 0.95, side: THREE.DoubleSide });
  const screen = new THREE.MeshBasicMaterial({ color: 0x0b1620 });

  g.add(box(CAR.width - 0.12, 0.16, 0.5, dash, 0, 0.8, 2.22)); // alçaq panel
  g.add(box(CAR.width - 0.2, 0.012, 0.02, chrome, 0, 0.83, 1.97)); // havalandırma xətti
  // cihazlar + ekran bir çərçivədə, sürücüyə tərəf əyilmiş
  const bezel = new THREE.Group();
  bezel.add(box(0.95, 0.15, 0.05, dash, 0, 0, 0));
  bezel.add(box(0.36, 0.11, 0.01, screen, 0.25, 0, -0.03), box(0.36, 0.11, 0.01, screen, -0.22, 0, -0.03));
  bezel.position.set(0.12, 0.95, 2.02);
  bezel.rotation.set(-0.15, -0.18, 0);
  g.add(bezel);
  // sərnişin tərəfdə diaqonal konsol "qanadı"
  const wing = box(0.06, 0.06, 0.95, trim, -0.12, 0.62, 1.55);
  wing.rotation.set(0.35, -0.15, 0);
  g.add(wing);
  g.add(box(0.2, 0.22, 0.7, trim, 0.0, 0.48, 1.25)); // orta konsol
  g.add(box(0.05, 0.1, 0.05, chrome, 0.02, 0.63, 1.38)); // ötürmə qolu
  for (const s of [1, -1]) g.add(box(0.07, 0.34, 2.5, trim, s * (HW - 0.07), 0.78, 0.9)); // qapı panelləri
  for (const s of [1, -1]) {
    const a = box(0.07, 0.7, 0.08, dash, s * (HW - 0.13), 1.13, 2.08);
    a.rotation.x = -0.9;
    g.add(a);
    g.add(box(0.1, 0.48, 0.12, trim, s * (HW - 0.1), 1.16, 0.75));
    const c = box(0.12, 0.6, 0.4, trim, s * (HW - 0.14), 1.12, -0.35);
    c.rotation.x = 0.75;
    g.add(c);
  }
  const roof = new THREE.Mesh(new THREE.PlaneGeometry(CAR.width - 0.24, 2.0), headliner);
  roof.rotation.x = Math.PI / 2;
  roof.position.set(0, 1.36, 0.75);
  g.add(roof);
  g.add(box(CAR.width - 0.26, 0.04, 0.5, dash, 0, 0.98, -0.42)); // arxa rəf
  g.add(box(0.24, 0.07, 0.02, dash, 0, 1.3, 1.58)); // salon güzgüsü

  // sükan: üç qollu, ortada loqo
  const steer = new THREE.Group();
  steer.position.set(0.37, 0.84, 1.8);
  steer.rotation.x = -0.38;
  const ringMat = new THREE.MeshStandardMaterial({ color: 0x18191b, roughness: 0.6 });
  const spin = new THREE.Group();
  spin.add(new THREE.Mesh(new THREE.TorusGeometry(0.185, 0.02, 10, 40), ringMat));
  for (const [w, h, x, y] of [[0.17, 0.035, -0.09, -0.01], [0.17, 0.035, 0.09, -0.01], [0.04, 0.12, 0, -0.11]]) {
    const sp = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.02), ringMat);
    sp.position.set(x, y, 0);
    spin.add(sp);
  }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.05, 20), ringMat);
  hub.rotation.x = Math.PI / 2;
  const logo = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.006, 6, 20), chrome);
  logo.scale.set(1.4, 1, 1);
  logo.position.z = -0.03;
  const mark = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.02, 0.025), new THREE.MeshBasicMaterial({ color: 0xff9a2e }));
  mark.position.y = 0.185;
  spin.add(hub, logo, mark);
  steer.add(spin);
  g.add(steer);
  root.add(g);
  setLayer(g, LAYER.INTERIOR);
  out.steeringWheel = spin;
}

// Ackermann bucaqları ilə təkərləri və sükanı yenilə
export function updateCarVisual(model, car, dt) {
  const ack = car.ackermann();
  model.wheels.fl.pivot.rotation.y = ack.left;
  model.wheels.fr.pivot.rotation.y = ack.right;
  const spin = (car.v * dt) / 0.316;
  for (const k of ['fl', 'fr', 'rl', 'rr']) model.wheels[k].wheel.rotation.x += spin;
  if (model.steeringWheel) model.steeringWheel.rotation.z = car.wheelDeg * (Math.PI / 180);
}

// Şəffaf "ideal maşın" (təlimatçının göstərdiyi poza)
export function buildGhost() {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: 0x2ee66b, transparent: true, opacity: 0.2, depthWrite: false });
  const m = new THREE.Mesh(new THREE.BoxGeometry(CAR.width, 1.2, CAR.length), mat);
  m.position.set(0, 0.6, CAR.centerOffset);
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), new THREE.LineBasicMaterial({ color: 0x2ee66b }));
  edges.position.copy(m.position);
  const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.7, 3), new THREE.MeshBasicMaterial({ color: 0x2ee66b }));
  arrow.rotation.x = Math.PI / 2;
  arrow.position.set(0, 1.25, CAR.wheelbase + 0.6);
  g.add(m, edges, arrow);
  setLayer(g, LAYER.HELPERS);
  return g;
}
