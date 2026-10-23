// Maşının 3D modeli. Mənşə: arxa oxun mərkəzi, yer səviyyəsi; irəli = lokal +Z, sol = lokal +X.
// Laylar: 0 dünya, 1 maşının xarici gövdəsi, 2 salon (yalnız sürücü kamerası), 3 arxa kamera xətləri, 4 köməkçilər.
import * as THREE from 'three';
import { CAR } from './physics.js';

export const LAYER = { WORLD: 0, BODY: 1, INTERIOR: 2, REARCAM: 3, HELPERS: 4 };

const R0 = -CAR.rearOverhang;
const F0 = CAR.wheelbase + CAR.frontOverhang;
const HW = CAR.width / 2;

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

const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.22, 20);
wheelGeo.rotateZ(Math.PI / 2);
const hubGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.23, 12);
hubGeo.rotateZ(Math.PI / 2);
const tireMat = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.9 });
const hubMat = new THREE.MeshStandardMaterial({ color: 0x9aa0a6, metalness: 0.7, roughness: 0.35 });
const glassMat = new THREE.MeshStandardMaterial({ color: 0x1b2633, metalness: 0.4, roughness: 0.15, transparent: true, opacity: 0.85 });
const blackMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });

function makeWheel() {
  const g = new THREE.Group();
  const tire = new THREE.Mesh(wheelGeo, tireMat);
  tire.castShadow = true;
  const hub = new THREE.Mesh(hubGeo, hubMat);
  const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.235, 0.05, 0.36), hubMat);
  g.add(tire, hub, spoke);
  g.position.y = 0.32;
  return g;
}

// player = true: salon, sükan, işıqların idarəsi
export function buildCar(color = 0xc0392b, player = false) {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const paint = new THREE.MeshStandardMaterial({ color, metalness: 0.45, roughness: 0.4 });

  const L = F0 - R0;
  const mid = (F0 + R0) / 2;
  // alt gövdə
  body.add(box(CAR.width, 0.62, L, paint, 0, 0.62, mid));
  // bamperlər
  body.add(box(CAR.width - 0.04, 0.22, 0.12, blackMat, 0, 0.42, F0 - 0.04));
  body.add(box(CAR.width - 0.04, 0.22, 0.12, blackMat, 0, 0.42, R0 + 0.04));
  // salon (şüşə) və dam
  const cabin = box(CAR.width - 0.16, 0.48, 2.45, glassMat, 0, 1.17, 0.95);
  body.add(cabin);
  body.add(box(CAR.width - 0.2, 0.05, 2.0, paint, 0, 1.43, 0.85));
  // yan güzgülər
  for (const s of [1, -1]) {
    body.add(box(0.2, 0.13, 0.08, paint, s * (HW + 0.07), 1.0, 2.0));
  }

  // təkərlər
  const wheels = {};
  for (const [k, x, z] of [['fl', 1, CAR.wheelbase], ['fr', -1, CAR.wheelbase], ['rl', 1, 0], ['rr', -1, 0]]) {
    const pivot = new THREE.Group();
    pivot.position.set(x * CAR.track / 2, 0, z);
    const w = makeWheel();
    pivot.add(w);
    root.add(pivot);
    wheels[k] = { pivot, wheel: w };
  }

  // işıqlar
  const lights = {};
  const mk = (c, e) => new THREE.MeshStandardMaterial({ color: c, emissive: e, emissiveIntensity: 0 });
  const headMat = mk(0xfff6d8, 0xfff2c0);
  headMat.emissiveIntensity = 0.4;
  for (const s of [1, -1]) body.add(box(0.36, 0.1, 0.04, headMat, s * 0.6, 0.78, F0 + 0.005));
  lights.brake = mk(0x6a0d0d, 0xff2020);
  lights.reverse = mk(0xdddddd, 0xffffff);
  lights.blinkL = mk(0x6a3d00, 0xffa000);
  lights.blinkR = mk(0x6a3d00, 0xffa000);
  for (const s of [1, -1]) {
    body.add(box(0.32, 0.12, 0.04, lights.brake, s * 0.62, 0.8, R0 - 0.005));
    body.add(box(0.1, 0.1, 0.04, lights.reverse, s * 0.36, 0.8, R0 - 0.005));
    const bm = s > 0 ? lights.blinkL : lights.blinkR;
    body.add(box(0.12, 0.08, 0.04, bm, s * 0.82, 0.8, R0 - 0.006));
    body.add(box(0.12, 0.08, 0.04, bm, s * 0.82, 0.78, F0 + 0.006));
    body.add(box(0.03, 0.05, 0.12, bm, s * (HW + 0.005), 0.75, 2.75));
  }

  setLayer(root, player ? LAYER.BODY : LAYER.WORLD);

  const out = { root, wheels, lights, paint };

  if (player) {
    // Kapot: sürücü də görsün
    const hood = box(CAR.width - 0.02, 0.02, 1.3, paint, 0, 0.94, 3.0);
    hood.castShadow = false;
    root.add(hood);
    setLayer(hood, LAYER.BODY, [LAYER.INTERIOR]);

    const interior = new THREE.Group();
    const dashMat = new THREE.MeshStandardMaterial({ color: 0x23262b, roughness: 0.85 });
    const trimMat = new THREE.MeshStandardMaterial({ color: 0x3a3f46, roughness: 0.8 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xb9b2a5, roughness: 0.95, side: THREE.DoubleSide });
    // panel
    interior.add(box(CAR.width - 0.12, 0.2, 0.55, dashMat, 0, 0.86, 2.25));
    // qapı panelləri (pəncərənin alt kənarı)
    for (const s of [1, -1]) interior.add(box(0.08, 0.38, 2.6, trimMat, s * (HW - 0.06), 0.82, 0.9));
    // A, B, C dirəkləri
    for (const s of [1, -1]) {
      const a = box(0.07, 0.62, 0.08, dashMat, s * (HW - 0.12), 1.18, 2.12);
      a.rotation.x = -0.75;
      interior.add(a);
      interior.add(box(0.1, 0.5, 0.1, trimMat, s * (HW - 0.1), 1.2, 0.85));
      const c = box(0.12, 0.55, 0.32, trimMat, s * (HW - 0.12), 1.15, -0.15);
      c.rotation.x = 0.55;
      interior.add(c);
    }
    // tavan
    const roof = new THREE.Mesh(new THREE.PlaneGeometry(CAR.width - 0.2, 2.1), roofMat);
    roof.rotation.x = Math.PI / 2;
    roof.position.set(0, 1.42, 0.82);
    interior.add(roof);
    // arxa şüşənin altı (rəf)
    interior.add(box(CAR.width - 0.2, 0.05, 0.45, dashMat, 0, 0.98, -0.15));
    // salon güzgüsünün korpusu
    interior.add(box(0.22, 0.06, 0.02, dashMat, 0, 1.36, 1.8));
    // cihazlar paneli işığı
    const cluster = box(0.3, 0.06, 0.12, new THREE.MeshBasicMaterial({ color: 0x0c2b3d }), 0.37, 0.97, 2.05);
    interior.add(cluster);
    // sükan
    const steer = new THREE.Group();
    steer.position.set(0.37, 0.9, 1.82);
    steer.rotation.x = -0.35;
    const ringMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.6 });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.022, 10, 36), ringMat);
    const spin = new THREE.Group();
    spin.add(ring);
    const sp1 = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.03, 0.02), ringMat);
    const sp2 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.17, 0.02), ringMat);
    sp2.position.y = -0.09;
    const hubC = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.05, 16), ringMat);
    hubC.rotation.x = Math.PI / 2;
    const mark = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.02, 0.025), new THREE.MeshBasicMaterial({ color: 0xff9a2e }));
    mark.position.y = 0.19;
    spin.add(sp1, sp2, hubC, mark);
    steer.add(spin);
    interior.add(steer);
    root.add(interior);
    setLayer(interior, LAYER.INTERIOR);
    out.steeringWheel = spin;
  }
  return out;
}

// Ackermann bucaqları ilə təkərləri və sükanı yenilə
export function updateCarVisual(model, car, dt) {
  const ack = car.ackermann();
  model.wheels.fl.pivot.rotation.y = ack.left;
  model.wheels.fr.pivot.rotation.y = ack.right;
  const spin = (car.v * dt) / 0.32;
  for (const k of ['fl', 'fr', 'rl', 'rr']) model.wheels[k].wheel.rotation.x += spin;
  if (model.steeringWheel) model.steeringWheel.rotation.z = car.wheelDeg * (Math.PI / 180);
}

// Şəffaf "ideal maşın" (təlimatçının göstərdiyi poza)
export function buildGhost() {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: 0x2ee66b, transparent: true, opacity: 0.22, depthWrite: false });
  const m = new THREE.Mesh(new THREE.BoxGeometry(CAR.width, 1.2, CAR.length), mat);
  m.position.set(0, 0.6, CAR.centerOffset);
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), new THREE.LineBasicMaterial({ color: 0x2ee66b }));
  edges.position.copy(m.position);
  // irəli oxu
  const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.7, 3), new THREE.MeshBasicMaterial({ color: 0x2ee66b }));
  arrow.rotation.x = Math.PI / 2;
  arrow.position.set(0, 1.25, CAR.wheelbase + 0.6);
  g.add(m, edges, arrow);
  setLayer(g, LAYER.HELPERS);
  return g;
}
