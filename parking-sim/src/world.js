// Səviyyə məlumatından 3D səhnə: detallı asfalt (çatlar, ləkələr, təkər izləri), aşınmış xətlər, bordürlər,
// drenajlar, səki, ot, kollar, ağaclar (instancing), fənərlər, binalar, nişanlar və ətraf maşınlar.
// Həndəsələr mümkün qədər birləşdirilir/instanslanır ki, draw call sayı az olsun.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { buildParkedCar, LAYER } from './carModel.js';
import { obstaclesOf } from './sim.js';
import * as TX from './textures.js';

function rng(seed) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Böyük miqyaslı rəng dəyişkənliyi (təkrarlanan naxış hiss olunmasın) — aoMap kimi bütün sahəyə bir dəfə
let macroTex = null;
function macro() {
  if (macroTex) return macroTex;
  macroTex = TX.canvasTex(256, 256, (g, w, h) => {
    const r = rng(77);
    g.fillStyle = '#e8e8e8'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 90; i++) {
      const v = 150 + r() * 105;
      g.fillStyle = `rgba(${v},${v},${v},0.35)`;
      g.beginPath(); g.ellipse(r() * w, r() * h, 8 + r() * 40, 6 + r() * 30, r() * 3, 0, Math.PI * 2); g.fill();
    }
  }, false);
  return macroTex;
}

// Xətt üçün düzbucaqlı (UV xətt boyu metrə görə — aşınma naxışı uzanmasın)
function stripGeo(x1, z1, x2, z2, w, y) {
  const dx = x2 - x1, dz = z2 - z1, len = Math.hypot(dx, dz);
  const g = new THREE.PlaneGeometry(w, len);
  g.rotateX(-Math.PI / 2);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setY(i, uv.getY(i) * (len / 2.5) + (x1 * 0.37 + z1 * 0.21));
  g.rotateY(Math.atan2(dx, dz));
  g.translate((x1 + x2) / 2, y, (z1 + z2) / 2);
  return g;
}

export function buildWorld(level) {
  const L = level.layout;
  const group = new THREE.Group();
  const R = rng(level.id * 131 + (L.cars[0] ? Math.round(L.cars[0].x * 10) : 0));
  const wet = []; // yaş havada dəyişən materiallar

  // ---------- asfalt ----------
  const A = TX.asphalt();
  const asphaltMat = new THREE.MeshStandardMaterial({ map: A.map, roughnessMap: A.rough, normalMap: A.normal, normalScale: new THREE.Vector2(0.6, 0.6), aoMap: macro(), aoMapIntensity: 0.55, roughness: 1, metalness: 0 });
  for (const t of [A.map, A.rough, A.normal]) { t.repeat.set(200 / 6, 200 / 6); t.anisotropy = 8; }
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), asphaltMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);
  wet.push({ mat: asphaltMat, dry: { roughness: 1, color: 0xffffff }, wet: { roughness: 0.28, color: 0x9a9a9a } });

  // ---------- ot, səki ----------
  const G = TX.grass();
  for (const gr of L.grass) {
    const mat = new THREE.MeshStandardMaterial({ map: G.map.clone(), normalMap: G.normal, roughness: 0.95 });
    mat.map.needsUpdate = true;
    mat.map.repeat.set(gr.w / 3, gr.l / 3);
    G.normal.repeat.set(gr.w / 3, gr.l / 3);
    const m = new THREE.Mesh(new THREE.BoxGeometry(gr.w, 0.12, gr.l), mat);
    m.position.set(gr.cx, 0.06, gr.cz);
    m.receiveShadow = true;
    group.add(m);
  }
  const P = TX.paving();
  for (const sw of L.sidewalks) {
    const mat = new THREE.MeshStandardMaterial({ map: P.map.clone(), normalMap: P.normal, roughness: 0.85 });
    mat.map.needsUpdate = true;
    mat.map.repeat.set(sw.w / 1.4, sw.l / 1.4);
    P.normal.repeat.set(sw.w / 1.4, sw.l / 1.4);
    const m = new THREE.Mesh(new THREE.BoxGeometry(sw.w, 0.15, sw.l), mat);
    m.position.set(sw.cx, 0.075, sw.cz);
    m.receiveShadow = true;
    group.add(m);
    wet.push({ mat, dry: { roughness: 0.85 }, wet: { roughness: 0.35 } });
  }

  // ---------- aşınmış xətlər ----------
  const paint = new THREE.MeshStandardMaterial({ color: 0xf1efe6, roughness: 0.55, alphaMap: TX.wornPaint(), alphaTest: 0.45, polygonOffset: true, polygonOffsetFactor: -2 });
  const yellow = paint.clone();
  yellow.color.set(0xe6b422);
  const lineGeo = [], yellowGeo = [];
  for (const [x1, z1, x2, z2] of L.lines) lineGeo.push(stripGeo(x1, z1, x2, z2, 0.12, 0.006));
  for (const [x1, z1, x2, z2] of L.dashed) {
    const len = Math.hypot(x2 - x1, z2 - z1);
    const n = Math.floor(len / 4);
    for (let i = 0; i < n; i++) {
      const a = i / n, b = (i + 0.5) / n;
      (L.kind === 'street' ? lineGeo : yellowGeo).push(stripGeo(x1 + (x2 - x1) * a, z1 + (z2 - z1) * a, x1 + (x2 - x1) * b, z1 + (z2 - z1) * b, 0.12, 0.006));
    }
  }
  if (lineGeo.length) { const m = new THREE.Mesh(mergeGeometries(lineGeo), paint); m.receiveShadow = true; group.add(m); }
  if (yellowGeo.length) { const m = new THREE.Mesh(mergeGeometries(yellowGeo), yellow); m.receiveShadow = true; group.add(m); }
  wet.push({ mat: paint, dry: { roughness: 0.55 }, wet: { roughness: 0.2 } });
  // istiqamət oxları
  const arrowShape = new THREE.Shape();
  arrowShape.moveTo(-0.18, -1.0); arrowShape.lineTo(0.18, -1.0); arrowShape.lineTo(0.18, 0.1);
  arrowShape.lineTo(0.45, 0.1); arrowShape.lineTo(0, 1.0); arrowShape.lineTo(-0.45, 0.1); arrowShape.lineTo(-0.18, 0.1);
  const arrowGeo = new THREE.ShapeGeometry(arrowShape);
  for (const [x, z, h] of L.arrows) {
    const m = new THREE.Mesh(arrowGeo, paint);
    m.rotation.order = 'YXZ';
    m.rotation.set(-Math.PI / 2, h + Math.PI, 0);
    m.position.set(x, 0.007, z);
    m.receiveShadow = true;
    group.add(m);
  }

  // ---------- dekallar: çatlar, yağ ləkələri, təkər izləri, gölməçələr (instanced) ----------
  const decalLayer = (kind, count, size, place, opts = {}) => {
    const mat = new THREE.MeshStandardMaterial({ map: TX.decal(kind), transparent: true, depthWrite: false, roughness: opts.rough ?? 0.9, polygonOffset: true, polygonOffsetFactor: -1, ...opts.mat });
    const geo = new THREE.PlaneGeometry(1, 1);
    geo.rotateX(-Math.PI / 2);
    const im = new THREE.InstancedMesh(geo, mat, count);
    const o = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const [x, z, rot, s] = place(i);
      o.position.set(x, 0.004 + i * 0.00001, z);
      o.rotation.set(0, rot, 0);
      o.scale.set(s * size[0], 1, s * size[1]);
      o.updateMatrix();
      im.setMatrixAt(i, o.matrix);
    }
    im.receiveShadow = true;
    group.add(im);
    return im;
  };
  const span = L.kind === 'street' ? [55, 3.6] : [22, 9];
  decalLayer('crack', 26, [1.2, 2.6], () => [(R() - 0.5) * span[0] * 2, (R() - 0.5) * span[1] * 2, R() * 6, 0.6 + R()]);
  decalLayer('oil', 14, [1.4, 1.0], (i) => {
    const c = L.cars[i % Math.max(1, L.cars.length)];
    return c ? [c.x + (R() - 0.5) * 0.6, c.z + (R() - 0.5) * 0.8, R() * 6, 0.6 + R() * 0.6] : [R() * 10, R() * 5, 0, 1];
  });
  decalLayer('tire', 10, [1.6, 5], () => [(R() - 0.5) * span[0] * 1.6, (R() - 0.5) * (L.kind === 'street' ? 4 : 5), Math.PI / 2 + (R() - 0.5) * 0.5, 0.8 + R() * 0.5]);
  const puddles = decalLayer('puddle', 12, [3, 2], () => [(R() - 0.5) * span[0] * 1.6, (R() - 0.5) * span[1] * 1.4, R() * 6, 0.6 + R() * 0.8], { rough: 0.03, mat: { color: 0x1a1d22, alphaMap: TX.decal('puddle'), map: null, metalness: 0, transparent: true } });
  puddles.visible = false;

  // ---------- bordürlər: yuvarlaq kənarlı beton profil ----------
  const C = TX.concrete();
  const curbMat = new THREE.MeshStandardMaterial({ map: C.map, roughnessMap: C.rough, normalMap: C.normal, roughness: 1 });
  C.map.repeat.set(1, 1);
  const prof = new THREE.Shape();
  prof.moveTo(-0.15, 0); prof.lineTo(-0.15, 0.13); prof.quadraticCurveTo(-0.15, 0.16, -0.12, 0.16);
  prof.lineTo(0.12, 0.16); prof.quadraticCurveTo(0.15, 0.16, 0.15, 0.13); prof.lineTo(0.15, 0);
  const curbGeos = [], drainGeos = [];
  for (const [x1, z1, x2, z2] of L.curbs) {
    const len = Math.hypot(x2 - x1, z2 - z1);
    // 2 m-lik seqmentlər, aralarında birləşmə tikişi
    const n = Math.max(1, Math.round(len / 2));
    for (let i = 0; i < n; i++) {
      const g = new THREE.ExtrudeGeometry(prof, { depth: len / n - 0.012, bevelEnabled: false });
      const a = i / n;
      g.translate(0, 0, -(len / n) / 2);
      g.rotateY(Math.atan2(x2 - x1, z2 - z1));
      g.translate(x1 + (x2 - x1) * (a + 0.5 / n), 0, z1 + (z2 - z1) * (a + 0.5 / n));
      curbGeos.push(g);
    }
    // drenaj barmaqlıqları hər ~22 m-dən bir, bordürün yanında
    const nx = (z2 - z1) / len, nz = -(x2 - x1) / len;
    for (let d = 11; d < len - 5; d += 22) {
      const cx = x1 + ((x2 - x1) * d) / len, cz = z1 + ((z2 - z1) * d) / len;
      const side = Math.sign(-(cx * nx + cz * nz)) || 1; // yola tərəf
      const g = new THREE.BoxGeometry(0.9, 0.012, 0.42);
      g.rotateY(Math.atan2(x2 - x1, z2 - z1) + Math.PI / 2);
      g.translate(cx + nx * side * 0.36, 0.006, cz + nz * side * 0.36);
      drainGeos.push(g);
    }
  }
  if (curbGeos.length) { const m = new THREE.Mesh(mergeGeometries(curbGeos), curbMat); m.castShadow = m.receiveShadow = true; group.add(m); }
  if (drainGeos.length) {
    const grate = TX.canvasTex(128, 64, (g, w, h) => {
      g.fillStyle = '#1a1b1d'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#050505';
      for (let x = 8; x < w - 6; x += 10) g.fillRect(x, 8, 5, h - 16);
    });
    group.add(new THREE.Mesh(mergeGeometries(drainGeos), new THREE.MeshStandardMaterial({ map: grate, metalness: 0.7, roughness: 0.5 })));
  }
  wet.push({ mat: curbMat, dry: { roughness: 1 }, wet: { roughness: 0.4 } });

  // ---------- ətraf maşınlar ----------
  const PALETTE = [0xe8e8e6, 0x1b1d22, 0x9aa0a8, 0x2f4f7f, 0x7e1a1a, 0xc8c2b4, 0x3a4a3a, 0x5a5f66, 0x101114, 0xb5b9bf];
  const shadowGeo = new THREE.PlaneGeometry(1, 1);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = new THREE.MeshBasicMaterial({ map: TX.decal('shadow'), transparent: true, depthWrite: false, opacity: 0.75, polygonOffset: true, polygonOffsetFactor: -3 });
  const shadows = new THREE.InstancedMesh(shadowGeo, shadowMat, Math.max(1, L.cars.length));
  const so = new THREE.Object3D();
  L.cars.forEach((c, i) => {
    const variant = Math.floor(R() * 3);
    const m = buildParkedCar(PALETTE[Math.floor(R() * PALETTE.length)], variant, { l: c.l, w: c.w });
    m.root.position.set(c.x - Math.sin(c.h) * m.centerOffset, 0, c.z - Math.cos(c.h) * m.centerOffset);
    m.root.rotation.y = c.h;
    m.root.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    m.lights.drl.emissiveIntensity = 0;
    m.lights.tail.emissiveIntensity = 0.02;
    group.add(m.root);
    so.position.set(c.x, 0.008, c.z);
    so.rotation.set(0, c.h, 0);
    so.scale.set((c.w || 1.86) + 0.45, 1, (c.l || 4.8) + 0.4);
    so.updateMatrix();
    shadows.setMatrixAt(i, so.matrix);
  });
  shadows.count = L.cars.length;
  group.add(shadows);

  // ---------- binalar ----------
  const lamps = [];
  const windowsMats = [];
  for (const b of L.boxes) {
    if (b.type === 'building') {
      const f = TX.facade(Math.round(b.cx * 7 + b.cz * 3), b.color);
      const bays = [Math.max(1, Math.round((b.hw * 2) / 4)), Math.max(1, Math.round(b.height / 3.4))];
      const mat = new THREE.MeshStandardMaterial({ map: f.map.clone(), emissiveMap: f.emissive.clone(), emissive: 0xffd9a0, emissiveIntensity: 0, roughness: 0.85 });
      mat.map.needsUpdate = mat.emissiveMap.needsUpdate = true;
      mat.map.repeat.set(bays[0], bays[1]);
      mat.emissiveMap.repeat.set(bays[0], bays[1]);
      mat.map.wrapS = mat.map.wrapT = mat.emissiveMap.wrapS = mat.emissiveMap.wrapT = THREE.RepeatWrapping;
      windowsMats.push(mat);
      const roofMat = new THREE.MeshStandardMaterial({ color: 0x55585c, roughness: 0.9 });
      const m = new THREE.Mesh(new THREE.BoxGeometry(b.hw * 2, b.height, b.hl * 2), [mat, mat, roofMat, roofMat, mat, mat]);
      m.position.set(b.cx, b.height / 2, b.cz);
      m.rotation.y = b.h;
      m.castShadow = m.receiveShadow = true;
      group.add(m);
      // parapet və əsas zolaq
      const par = new THREE.Mesh(new THREE.BoxGeometry(b.hw * 2 + 0.3, 0.6, b.hl * 2 + 0.3), new THREE.MeshStandardMaterial({ color: new THREE.Color(b.color).multiplyScalar(0.8), roughness: 0.9 }));
      par.position.set(b.cx, b.height + 0.3, b.cz);
      par.rotation.y = b.h;
      group.add(par);
      const base = new THREE.Mesh(new THREE.BoxGeometry(b.hw * 2 + 0.06, 1.2, b.hl * 2 + 0.06), new THREE.MeshStandardMaterial({ color: 0x3d3f43, roughness: 0.7 }));
      base.position.set(b.cx, 0.6, b.cz);
      base.rotation.y = b.h;
      group.add(base);
    } else if (b.type === 'pole') {
      // fənər dirəyi: konik dirək, qol, işıq başlığı (gecə üçün emissive)
      const pole = new THREE.Group();
      const metal = new THREE.MeshStandardMaterial({ color: 0x4a4e54, metalness: 0.7, roughness: 0.45 });
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.12, b.height, 12), metal);
      p.position.y = b.height / 2;
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 0.5, 12), new THREE.MeshStandardMaterial({ map: C.map, roughness: 0.9 }));
      base.position.y = 0.25;
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 1.4), metal);
      arm.position.set(0, b.height - 0.1, -0.6);
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.12, 0.7), metal);
      head.position.set(0, b.height - 0.15, -1.2);
      const bulbMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffd7a0, emissiveIntensity: 0 });
      const bulb = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.6), bulbMat);
      bulb.rotation.x = Math.PI / 2;
      bulb.position.set(0, b.height - 0.215, -1.2);
      for (const o of [p, arm, head]) o.castShadow = true;
      pole.add(p, base, arm, head, bulb);
      pole.position.set(b.cx, 0, b.cz);
      pole.rotation.y = b.h;
      group.add(pole);
      lamps.push({ pos: new THREE.Vector3(b.cx, b.height - 0.3, b.cz - 1.2), bulbMat });
    } else {
      const mat = new THREE.MeshStandardMaterial({ color: b.color, roughness: 0.5 });
      const m = new THREE.Mesh(new THREE.BoxGeometry(b.hw * 2, b.height, b.hl * 2), mat);
      m.position.set(b.cx, b.height / 2, b.cz);
      m.rotation.y = b.h;
      m.castShadow = m.receiveShadow = true;
      group.add(m);
      if (b.type === 'barrier') for (let i = -3; i <= 3; i += 2) {
        const st = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.25, b.hl * 2 + 0.02), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 }));
        st.position.set(b.cx + i, 0.75, b.cz);
        group.add(st);
      }
    }
  }

  // ---------- ağaclar və kollar (instanced, rəng və ölçü dəyişkən) ----------
  const nTree = L.trees.length;
  if (nTree) {
    const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.1, 0.18, 2.6, 7), new THREE.MeshStandardMaterial({ color: 0x5b4636, roughness: 1 }), nTree);
    const leafGeo = new THREE.IcosahedronGeometry(1, 1);
    const lp = leafGeo.attributes.position;
    for (let i = 0; i < lp.count; i++) { const k = 0.85 + ((i * 7919) % 100) / 400; lp.setXYZ(i, lp.getX(i) * k, lp.getY(i) * k, lp.getZ(i) * k); }
    leafGeo.computeVertexNormals();
    const leaves = new THREE.InstancedMesh(leafGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, flatShading: true }), nTree * 3);
    const o = new THREE.Object3D();
    const col = new THREE.Color();
    L.trees.forEach(([x, z], i) => {
      const s = 0.85 + R() * 0.5;
      o.position.set(x, 1.3 * s, z); o.rotation.set(0, R() * 6, 0); o.scale.set(s, s, s); o.updateMatrix();
      trunk.setMatrixAt(i, o.matrix);
      for (let k = 0; k < 3; k++) {
        const a = R() * 6.28, rr = 0.5 * s;
        o.position.set(x + Math.cos(a) * rr, (2.7 + k * 0.6) * s, z + Math.sin(a) * rr);
        const ls = (1.25 - k * 0.2) * s * (0.85 + R() * 0.3);
        o.scale.set(ls, ls * 0.9, ls); o.rotation.set(R(), R() * 6, R()); o.updateMatrix();
        leaves.setMatrixAt(i * 3 + k, o.matrix);
        leaves.setColorAt(i * 3 + k, col.setHSL(0.24 + R() * 0.06, 0.35 + R() * 0.15, 0.22 + R() * 0.08));
      }
    });
    trunk.castShadow = leaves.castShadow = true;
    leaves.receiveShadow = true;
    group.add(trunk, leaves);
  }
  // otlu sahələrin kənarında kollar
  const hedges = [];
  for (const gr of L.grass) for (let x = gr.cx - gr.w / 2 + 2; x < gr.cx + gr.w / 2 - 2; x += 1.6) if (R() < 0.75) hedges.push([x, gr.cz - Math.sign(gr.cz) * (gr.l / 2 - 0.8)]);
  if (hedges.length) {
    const hg = new THREE.IcosahedronGeometry(0.7, 1);
    const hm = new THREE.InstancedMesh(hg, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, flatShading: true }), hedges.length);
    const o = new THREE.Object3D();
    const col = new THREE.Color();
    hedges.forEach(([x, z], i) => {
      o.position.set(x, 0.5, z); o.scale.set(1 + R() * 0.4, 0.7 + R() * 0.3, 0.9); o.rotation.set(0, R() * 6, 0); o.updateMatrix();
      hm.setMatrixAt(i, o.matrix);
      hm.setColorAt(i, col.setHSL(0.27 + R() * 0.05, 0.4, 0.2 + R() * 0.06));
    });
    hm.castShadow = hm.receiveShadow = true;
    group.add(hm);
  }

  // ---------- nişanlar (real ölçü: 0.6–0.75 m lövhə, 2.1 m hündürlük) ----------
  const addSign = (x, z, h, tex, size = 0.6) => {
    const sg = new THREE.Group();
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.1 + size / 2, 8), new THREE.MeshStandardMaterial({ color: 0x8e9399, metalness: 0.8, roughness: 0.4 }));
    post.position.y = (2.1 + size / 2) / 2;
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.5, side: THREE.DoubleSide }));
    plate.position.y = 2.1 + size / 2;
    post.castShadow = plate.castShadow = true;
    sg.add(post, plate);
    sg.position.set(x, 0, z);
    sg.rotation.y = h;
    group.add(sg);
  };
  if (L.kind === 'lot') {
    addSign(-24, -4.2, Math.PI / 2, TX.signTex('P'), 0.6);
    addSign(22, 4.2, -Math.PI / 2, TX.signTex('stop'), 0.75); // ABŞ R1-1: 30 düym
  } else {
    addSign(-30, 3.9, Math.PI / 2, TX.signTex('speed', '40'), 0.6);
  }

  // ---------- hədəf yerin işarəsi (köməkçi) ----------
  const tg = level.target;
  if (!tg.zone) {
    const fill = new THREE.Mesh(new THREE.PlaneGeometry(tg.w, tg.l), new THREE.MeshBasicMaterial({ color: 0x2ee66b, transparent: true, opacity: 0.16, depthWrite: false }));
    fill.rotation.order = 'YXZ';
    fill.rotation.set(-Math.PI / 2, tg.h, 0);
    fill.position.set(tg.x, 0.012, tg.z);
    fill.layers.set(LAYER.HELPERS);
    group.add(fill);
    const ar = new THREE.Mesh(arrowGeo, new THREE.MeshBasicMaterial({ color: 0x2ee66b, transparent: true, opacity: 0.55 }));
    ar.rotation.order = 'YXZ';
    ar.rotation.set(-Math.PI / 2, tg.h + Math.PI, 0);
    ar.position.set(tg.x, 0.014, tg.z);
    ar.layers.set(LAYER.HELPERS);
    group.add(ar);
  }

  // Hava/vaxt: yaş səth (aşağı roughness, tünd), gölməçələr, gecə işıqları
  function setAtmosphere({ wet: isWet, night, evening }) {
    for (const w of wet) {
      const s = isWet ? w.wet : w.dry;
      w.mat.roughness = s.roughness;
      if (s.color !== undefined) w.mat.color.set(s.color);
    }
    asphaltMat.normalScale.setScalar(isWet ? 0.25 : 0.6);
    puddles.visible = isWet;
    for (const l of lamps) l.bulbMat.emissiveIntensity = night ? 6 : evening ? 1.5 : 0;
    for (const m of windowsMats) m.emissiveIntensity = night ? 1.1 : evening ? 0.25 : 0;
  }

  return { group, obstacles: obstaclesOf(L), lamps, setAtmosphere };
}
