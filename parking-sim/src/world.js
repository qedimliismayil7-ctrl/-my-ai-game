// Səviyyə məlumatından 3D səhnə və maneələr siyahısı qurur.
import * as THREE from 'three';
import { buildParkedCar, LAYER } from './carModel.js';
import { obstaclesOf } from './sim.js';

function noiseTexture(base, vary, size = 256, speck = 0) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const img = g.createImageData(size, size);
  for (let i = 0; i < size * size; i++) {
    const n = (Math.random() - 0.5) * vary + (Math.random() < speck ? 30 : 0);
    img.data[i * 4] = base[0] + n;
    img.data[i * 4 + 1] = base[1] + n;
    img.data[i * 4 + 2] = base[2] + n;
    img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function tileTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#b9b6b0';
  g.fillRect(0, 0, 128, 128);
  g.strokeStyle = '#9d9a94';
  g.lineWidth = 3;
  for (let i = 0; i <= 128; i += 64) {
    g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 128); g.stroke();
    g.beginPath(); g.moveTo(0, i); g.lineTo(128, i); g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function windowTexture(color) {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#' + color.toString(16).padStart(6, '0');
  g.fillRect(0, 0, 64, 128);
  g.fillStyle = 'rgba(40,60,80,0.75)';
  for (let y = 10; y < 128; y += 32) for (let x = 8; x < 64; x += 28) g.fillRect(x, y, 18, 18);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

let cache = null;
function textures() {
  if (!cache) {
    cache = {
      asphalt: noiseTexture([78, 80, 84], 22, 256, 0.02),
      grass: noiseTexture([78, 120, 58], 30),
      tiles: tileTexture(),
    };
  }
  return cache;
}

export function buildWorld(level) {
  const L = level.layout;
  const group = new THREE.Group();
  const tx = textures();

  // yer
  const asphalt = tx.asphalt.clone();
  asphalt.needsUpdate = true;
  asphalt.repeat.set(40, 40);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ map: asphalt, roughness: 0.95 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);

  for (const gr of L.grass) {
    const t = tx.grass.clone(); t.needsUpdate = true; t.repeat.set(gr.w / 4, gr.l / 4);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(gr.w, gr.l), new THREE.MeshStandardMaterial({ map: t, roughness: 1 }));
    m.rotation.x = -Math.PI / 2;
    m.position.set(gr.cx, 0.04, gr.cz);
    m.receiveShadow = true;
    group.add(m);
  }
  for (const sw of L.sidewalks) {
    const t = tx.tiles.clone(); t.needsUpdate = true; t.repeat.set(sw.w / 1.2, sw.l / 1.2);
    const m = new THREE.Mesh(new THREE.BoxGeometry(sw.w, 0.15, sw.l), new THREE.MeshStandardMaterial({ map: t, roughness: 0.9 }));
    m.position.set(sw.cx, 0.075, sw.cz);
    m.receiveShadow = true;
    group.add(m);
  }

  // xətlər
  const lineMat = new THREE.MeshStandardMaterial({ color: 0xf2f2ea, roughness: 0.7 });
  const yellowMat = new THREE.MeshStandardMaterial({ color: 0xf1c40f, roughness: 0.7 });
  const addLine = (x1, z1, x2, z2, w = 0.12, mat = lineMat) => {
    const dx = x2 - x1, dz = z2 - z1, len = Math.hypot(dx, dz);
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.01, len), mat);
    m.position.set((x1 + x2) / 2, 0.006, (z1 + z2) / 2);
    m.rotation.y = Math.atan2(dx, dz);
    m.receiveShadow = true;
    group.add(m);
  };
  for (const [x1, z1, x2, z2] of L.lines) addLine(x1, z1, x2, z2);
  for (const [x1, z1, x2, z2] of L.dashed) {
    const len = Math.hypot(x2 - x1, z2 - z1);
    const n = Math.floor(len / 4);
    for (let i = 0; i < n; i++) {
      const a = i / n, b = (i + 0.5) / n;
      addLine(x1 + (x2 - x1) * a, z1 + (z2 - z1) * a, x1 + (x2 - x1) * b, z1 + (z2 - z1) * b, 0.12, L.kind === 'street' ? lineMat : yellowMat);
    }
  }
  // istiqamət oxları
  const arrowShape = new THREE.Shape();
  arrowShape.moveTo(-0.18, -1.0); arrowShape.lineTo(0.18, -1.0); arrowShape.lineTo(0.18, 0.1);
  arrowShape.lineTo(0.45, 0.1); arrowShape.lineTo(0, 1.0); arrowShape.lineTo(-0.45, 0.1); arrowShape.lineTo(-0.18, 0.1);
  const arrowGeo = new THREE.ShapeGeometry(arrowShape);
  for (const [x, z, h] of L.arrows) {
    const m = new THREE.Mesh(arrowGeo, lineMat);
    m.rotation.order = 'YXZ';
    m.rotation.set(-Math.PI / 2, h + Math.PI, 0);
    m.position.set(x, 0.007, z);
    group.add(m);
  }

  // bordürlər
  const curbMat = new THREE.MeshStandardMaterial({ color: 0xcfcfc8, roughness: 0.8 });
  for (const [x1, z1, x2, z2] of L.curbs) {
    const dx = x2 - x1, dz = z2 - z1, len = Math.hypot(dx, dz);
    const h = Math.atan2(dx, dz);
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.16, len), curbMat);
    m.position.set((x1 + x2) / 2, 0.08, (z1 + z2) / 2);
    m.rotation.y = h;
    m.castShadow = m.receiveShadow = true;
    group.add(m);
  }

  // park olunmuş maşınlar
  for (const c of L.cars) {
    const m = buildParkedCar(c.color);
    // c — gövdə mərkəzi; modelin mənşəyi arxa oxdadır (4.8 m maşında arxa oxdan mərkəzə 1.35 m)
    m.root.position.set(c.x - Math.sin(c.h) * 1.35, 0, c.z - Math.cos(c.h) * 1.35);
    m.root.rotation.y = c.h;
    m.root.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    group.add(m.root);
  }

  // binalar, dirəklər, maneələr
  for (const b of L.boxes) {
    let mat;
    if (b.type === 'building') {
      const t = windowTexture(b.color);
      t.repeat.set(Math.max(1, Math.round(b.hw / 1.5)), Math.max(1, Math.round(b.height / 3)));
      mat = new THREE.MeshStandardMaterial({ map: t, roughness: 0.9 });
    } else {
      mat = new THREE.MeshStandardMaterial({ color: b.color, roughness: 0.6, metalness: b.type === 'pole' ? 0.5 : 0 });
    }
    const m = new THREE.Mesh(new THREE.BoxGeometry(b.hw * 2, b.height, b.hl * 2), mat);
    m.position.set(b.cx, b.height / 2, b.cz);
    m.rotation.y = b.h;
    m.castShadow = m.receiveShadow = true;
    group.add(m);
    if (b.type === 'pole') {
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 1.2), new THREE.MeshStandardMaterial({ color: 0x777777 }));
      lamp.position.set(b.cx, b.height, b.cz - 0.5);
      group.add(lamp);
    }
    if (b.type === 'barrier') {
      for (let i = -3; i <= 3; i += 2) {
        const s = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.25, b.hl * 2 + 0.02), new THREE.MeshStandardMaterial({ color: 0xffffff }));
        s.position.set(b.cx + i, 0.75, b.cz);
        group.add(s);
      }
    }
  }

  // ağaclar
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2f, roughness: 1 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x3f7a3a, roughness: 1 });
  const trunkGeo = new THREE.CylinderGeometry(0.14, 0.2, 2.2, 8);
  const leafGeo = new THREE.IcosahedronGeometry(1.4, 1);
  for (const [x, z] of L.trees) {
    const t = new THREE.Mesh(trunkGeo, trunkMat);
    t.position.set(x, 1.1, z);
    t.castShadow = true;
    const l = new THREE.Mesh(leafGeo, leafMat);
    l.position.set(x, 3.0, z);
    l.scale.set(1, 1.15, 1);
    l.castShadow = true;
    group.add(t, l);
  }

  // hədəf yerin işarəsi (köməkçi layında)
  const tg = level.target;
  if (!tg.zone) {
    const fill = new THREE.Mesh(
      new THREE.PlaneGeometry(tg.w, tg.l),
      new THREE.MeshBasicMaterial({ color: 0x2ee66b, transparent: true, opacity: 0.18, depthWrite: false }),
    );
    fill.rotation.order = 'YXZ';
    fill.rotation.set(-Math.PI / 2, tg.h, 0);
    fill.position.set(tg.x, 0.012, tg.z);
    fill.layers.set(LAYER.HELPERS);
    group.add(fill);
    // irəli istiqamət oxu
    const ar = new THREE.Mesh(arrowGeo, new THREE.MeshBasicMaterial({ color: 0x2ee66b, transparent: true, opacity: 0.6 }));
    ar.rotation.order = 'YXZ';
    ar.rotation.set(-Math.PI / 2, tg.h + Math.PI, 0);
    ar.position.set(tg.x, 0.014, tg.z);
    ar.layers.set(LAYER.HELPERS);
    group.add(ar);
  }

  return { group, obstacles: obstaclesOf(L) };
}
