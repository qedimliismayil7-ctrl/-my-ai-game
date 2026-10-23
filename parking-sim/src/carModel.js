// Maşının 3D modeli (prosedur — lisenziyalı Elantra GLB modeli tapılmadı).
// Mənşə: arxa oxun mərkəzi, yer səviyyəsi; irəli = lokal +Z, sol = lokal +X.
// Laylar: 0 dünya, 1 oyunçunun gövdəsi, 2 salon (yalnız sürücü kamerası), 3 arxa kamera xətləri, 4 köməkçilər.
// Ölçülər physics.js → CAR ilə eynidir, ona görə görünən gövdə toqquşma qutusuna uyğun gəlir.
// Siluet, barmaqlıq, işıqlar və salon fotolara əsasən TƏXMİNİDİR (zavod CAD məlumatı deyil).
import * as THREE from 'three';
import { CAR, PARKED } from './physics.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export const LAYER = { WORLD: 0, BODY: 1, INTERIOR: 2, REARCAM: 3, HELPERS: 4 };

// Sürücünün gözü, güzgülər və arxa kamera (lokal koordinatlar, təxmini)
export const VIEW = {
  eye: [0.37, 1.15, 0.86],
  mirrorL: [CAR.width / 2 + 0.13, 0.99, 1.92],
  mirrorR: [-CAR.width / 2 - 0.13, 0.99, 1.92],
  mirrorC: [0, 1.25, 1.08],
  rearCam: [0, 0.93, -CAR.rearOverhang + 0.06],
};

// ---------- Materiallar ----------
export const MAT = {
  physical: true, // aşağı keyfiyyətdə MeshStandardMaterial
};

function paintMat(color) {
  if (!MAT.physical) return new THREE.MeshStandardMaterial({ color, metalness: 0.55, roughness: 0.35 });
  // metallik boya: əsas qat yarı-metal (piqment + alüminium hissəcikləri), üstündə şəffaf lak
  return new THREE.MeshPhysicalMaterial({ color, metalness: 0.35, roughness: 0.38, clearcoat: 1, clearcoatRoughness: 0.05 });
}
const M = {};
function mats() {
  if (M.ready === MAT.physical) return M;
  M.ready = MAT.physical;
  M.glass = MAT.physical
    ? new THREE.MeshPhysicalMaterial({ color: 0x0e1418, metalness: 0, roughness: 0.04, transparent: true, opacity: 0.8, envMapIntensity: 1.1, depthWrite: false })
    : new THREE.MeshStandardMaterial({ color: 0x0d1418, metalness: 0.2, roughness: 0.08, transparent: true, opacity: 0.6, depthWrite: false });
  // dayanan maşınlarda salon modeli yoxdur — tonlanmış şüşə daha az şəffafdır (real tonlama ilə də içi zəif görünür)
  M.glassDark = MAT.physical
    ? new THREE.MeshPhysicalMaterial({ color: 0x0a0e12, metalness: 0, roughness: 0.03, transparent: true, opacity: 0.86, envMapIntensity: 1.8, depthWrite: false })
    : new THREE.MeshStandardMaterial({ color: 0x0a0e12, metalness: 0.2, roughness: 0.06, transparent: true, opacity: 0.88, depthWrite: false });
  M.glossDS = new THREE.MeshStandardMaterial({ color: 0x08090a, roughness: 0.18, metalness: 0.2, side: THREE.DoubleSide });
  M.trim = new THREE.MeshStandardMaterial({ color: 0x0c0d0f, roughness: 0.55, metalness: 0.1 }); // qara plastik
  M.gloss = new THREE.MeshStandardMaterial({ color: 0x08090a, roughness: 0.18, metalness: 0.2 }); // parlaq qara
  M.chrome = new THREE.MeshStandardMaterial({ color: 0xd5d8dc, roughness: 0.12, metalness: 1 });
  M.tire = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.92, metalness: 0 });
  M.rim = new THREE.MeshStandardMaterial({ color: 0x3a3d42, roughness: 0.32, metalness: 0.85 }); // SEL 16" tünd disk (təxmini rəng)
  M.disc = new THREE.MeshStandardMaterial({ color: 0x6b6e72, roughness: 0.5, metalness: 0.8 });
  M.well = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 1 });
  M.lens = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.35, depthWrite: false });
  M.plate = new THREE.MeshStandardMaterial({ color: 0xe9ecef, roughness: 0.6 });
  return M;
}

function mesh(geo, mat, cast = true) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = cast;
  m.receiveShadow = true;
  return m;
}
function box(w, h, l, mat, x, y, z) {
  const m = mesh(new THREE.BoxGeometry(w, h, l), mat);
  m.position.set(x, y, z);
  return m;
}
function setLayer(obj, layer, extra = []) {
  obj.traverse((o) => {
    o.layers.set(layer);
    for (const e of extra) o.layers.enable(e);
  });
}

// Yan tərəfdə düz çoxbucaqlı: pts = [[z, y], ...], x — sabit (sol +, sağ −)
function sidePoly(pts, x, mat) {
  const pos = [];
  for (let i = 1; i < pts.length - 1; i++) for (const k of [0, i, i + 1]) pos.push(x, pts[k][1], pts[k][0]);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  const m = mesh(g, mat, false);
  m.material = mat;
  return m;
}

function flipWinding(g) {
  if (g.index) {
    const ix = g.index.array;
    for (let i = 0; i < ix.length; i += 3) { const t = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = t; }
    g.index.needsUpdate = true;
    return;
  }
  for (const name of Object.keys(g.attributes)) {
    const a = g.attributes[name], n = a.itemSize, arr = a.array;
    for (let i = 0; i < a.count; i += 3) {
      for (let k = 0; k < n; k++) { const t = arr[(i + 1) * n + k]; arr[(i + 1) * n + k] = arr[(i + 2) * n + k]; arr[(i + 2) * n + k] = t; }
    }
    a.needsUpdate = true;
  }
}

// Yan profildən (Shape: x = maşının z-i, y = hündürlük) eninə uzanan gövdə, sonra plan və en kəsiyinə görə əyilir.
// widthAt(y, z) → həmin nöqtədə yarım en (m)
function sculpt(shape, width, widthAt, steps = 10, curveSegments = 10) {
  const g = new THREE.ExtrudeGeometry(shape, { depth: width, steps, bevelEnabled: false, curveSegments });
  g.translate(0, 0, -width / 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const z = p.getX(i), y = p.getY(i), x = p.getZ(i); // extrude oxu → maşının eni
    const hw = widthAt(y, z);
    p.setXYZ(i, (x / (width / 2)) * hw, y, z);
  }
  // oxların yerdəyişməsi həndəsəni güzgüləyir — üçbucaqların istiqaməti tərsinə çevrilməlidir,
  // yoxsa normallar içəri baxır (gövdə qaranlıq görünür, şüşə çöldən görünmür)
  flipWinding(g);
  g.computeVertexNormals();
  return g;
}

// Gövdə stilləri: oyunçunun maşını (Elantra) və ətraf maşınlar üçün
function styleFor(D, kind) {
  const L = D.length, R0 = -D.rearOverhang, F0 = L - D.rearOverhang, wb = D.wheelbase;
  const base = { L, R0, F0, wb, W: D.width, H: D.height || 1.42, belt: 0.95, hood: 0.78, nose: 0.62, cowl: wb * 0.74, roofF: wb * 0.37, roofR: -0.2, glassR: R0 + 0.62, deck: 0.99, arch: 0.45 };
  if (kind === 'suv') Object.assign(base, { H: D.height || 1.68, belt: 1.08, hood: 0.98, nose: 0.82, cowl: wb * 0.8, roofF: wb * 0.55, roofR: R0 + 0.35, glassR: R0 + 0.12, deck: 1.15, arch: 0.47 });
  if (kind === 'hatch') Object.assign(base, { H: D.height || 1.48, roofR: R0 + 0.35, glassR: R0 + 0.15, deck: 1.0 });
  return base;
}

function lowerShape(S) {
  const { R0, F0, wb, belt, hood, nose, cowl, deck, arch } = S;
  const s = new THREE.Shape();
  const yb = 0.22; // altlıq
  s.moveTo(F0 - 0.14, yb + 0.02);
  s.lineTo(wb + arch, yb);
  s.absarc(wb, yb, arch, 0, Math.PI, false); // ön təkər yuvası
  s.lineTo(arch, yb);
  s.absarc(0, yb, arch, 0, Math.PI, false); // arxa təkər yuvası
  s.lineTo(R0 + 0.16, yb + 0.03);
  s.quadraticCurveTo(R0 - 0.01, yb + 0.06, R0, 0.48); // arxa bamper
  s.lineTo(R0 + 0.01, deck - 0.12);
  s.quadraticCurveTo(R0 + 0.02, deck, R0 + 0.16, deck + 0.01); // baqaj qapağının dodağı
  s.lineTo(S.glassR + 0.05, deck);
  s.lineTo(cowl * 0.35, belt + 0.02);
  s.lineTo(cowl, belt - 0.01); // kapotun arxası
  s.quadraticCurveTo((cowl + F0) / 2, hood + 0.08, F0 - 0.2, hood); // kapot
  s.quadraticCurveTo(F0 - 0.04, nose + 0.08, F0, nose - 0.04); // burun
  s.quadraticCurveTo(F0 + 0.02, 0.32, F0 - 0.14, yb + 0.02); // ön bamper
  return s;
}

function greenhouseShape(S) {
  const { cowl, roofF, roofR, glassR, belt, deck, H } = S;
  const s = new THREE.Shape();
  s.moveTo(cowl - 0.02, belt - 0.03);
  s.quadraticCurveTo(roofF + 0.25, H - 0.08, roofF, H - 0.015); // ön şüşə
  s.quadraticCurveTo((roofF + roofR) / 2, H + 0.01, roofR, H - 0.03); // dam
  s.quadraticCurveTo(glassR + 0.25, deck + 0.18, glassR, deck); // arxa şüşə (fastback)
  s.lineTo(cowl - 0.02, belt - 0.03);
  return s;
}

// Plan görünüşündə künclərin yumrulanması və en kəsiyində "tumblehome"
function lowerWidth(S) {
  const { W, F0, R0 } = S;
  return (y, z) => {
    let k = 1;
    const fr = (z - (F0 - 0.75)) / 0.75; if (fr > 0) k -= 0.14 * fr * fr;
    const rr = ((R0 + 0.6) - z) / 0.6; if (rr > 0) k -= 0.09 * rr * rr;
    if (y > 0.8) k -= 0.05 * Math.min(1, (y - 0.8) / 0.25);
    if (y < 0.34) k -= 0.03 * (0.34 - y) / 0.12;
    return (W / 2) * k;
  };
}
function greenWidth(S) {
  const { W, belt, H } = S;
  return (y) => (W / 2) * (0.9 - 0.18 * Math.max(0, (y - belt) / (H - belt)));
}

// Disk: 5 cüt qol (SEL 16" — forma təxmini)
function makeWheel(radius = 0.316, detail = 1) {
  const m = mats();
  const g = new THREE.Group();
  const seg = detail > 0 ? 28 : 16;
  const tg = new THREE.CylinderGeometry(radius, radius, 0.205, seg, 1, true);
  tg.rotateZ(Math.PI / 2);
  g.add(mesh(tg, m.tire));
  for (const s of [1, -1]) {
    const side = new THREE.RingGeometry(radius * 0.68, radius, seg);
    side.rotateY((s * Math.PI) / 2);
    side.translate(s * 0.1025, 0, 0);
    g.add(mesh(side, m.tire, false));
  }
  const rimFace = new THREE.CylinderGeometry(radius * 0.68, radius * 0.68, 0.02, seg);
  rimFace.rotateZ(Math.PI / 2);
  const inner = mesh(rimFace, m.disc, false);
  inner.position.x = 0.02;
  g.add(inner);
  const lip = new THREE.TorusGeometry(radius * 0.66, 0.012, 6, seg);
  lip.rotateY(Math.PI / 2);
  const lipM = mesh(lip, m.rim, false); lipM.position.x = 0.1; g.add(lipM);
  for (let i = 0; i < 5; i++) for (const off of [-0.09, 0.09]) {
    const sp = mesh(new THREE.BoxGeometry(0.03, radius * 0.6, 0.032), m.rim, false);
    sp.position.set(0.095, radius * 0.33, 0);
    const piv = new THREE.Group();
    piv.rotation.x = (i * Math.PI * 2) / 5 + off;
    piv.add(sp);
    g.add(piv);
  }
  const hub = new THREE.CylinderGeometry(0.055, 0.06, 0.04, 14);
  hub.rotateZ(Math.PI / 2);
  const hubM = mesh(hub, m.rim, false); hubM.position.x = 0.1; g.add(hubM);
  g.position.y = radius;
  return g;
}

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
let grilleTex = null;
function grille() {
  // "parametrik" barmaqlıq: üçbucaqlı fasetlər (sadələşdirilmiş)
  if (!grilleTex) grilleTex = canvasTex(256, 64, (g, w, h) => {
    g.fillStyle = '#0a0b0c'; g.fillRect(0, 0, w, h);
    for (let x = -16; x < w + 16; x += 16) for (let y = 0; y < h; y += 16) {
      const o = (y / 16) % 2 ? 8 : 0;
      const l = 30 + ((x * 7 + y * 13) % 30);
      g.fillStyle = `rgb(${l},${l + 2},${l + 4})`;
      g.beginPath(); g.moveTo(x + o, y); g.lineTo(x + o + 8, y + 8); g.lineTo(x + o, y + 16); g.lineTo(x + o - 8, y + 8); g.closePath(); g.fill();
    }
  });
  return grilleTex;
}

// dims: { length, width, height, wheelbase, rearOverhang, track }; kind: 'elantra' | 'sedan' | 'suv' | 'hatch'
export function buildCar(color = 0x8f9396, player = false, dims = null, kind = 'elantra') {
  const m = mats();
  const D = dims || CAR;
  const S = styleFor(D, kind === 'elantra' ? 'sedan' : kind);
  const { W, R0, F0, wb } = S;
  const HW = W / 2;
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const paint = paintMat(color);

  const lw = lowerWidth(S);
  body.add(mesh(sculpt(lowerShape(S), W, lw, player ? 12 : 6, player ? 12 : 6), paint));
  body.add(mesh(sculpt(greenhouseShape(S), W, greenWidth(S), player ? 8 : 4, player ? 10 : 5), player ? m.glass : m.glassDark, false));
  if (!player) {
    // sadə salon siluyeti: oturacaq arxalıqları və baş dayaqları (şüşədən tünd kölgə kimi görünür)
    const seatM = m.trim;
    for (const zz of [S.roofF - 0.35, S.roofR + 0.25]) {
      body.add(box(W - 0.45, 0.55, 0.12, seatM, 0, S.belt + 0.05, zz));
      for (const xx of [0.38, -0.38]) body.add(box(0.26, 0.18, 0.1, seatM, xx, S.belt + 0.42, zz - 0.02));
    }
  }
  // dam paneli (rəngli) — şüşənin üstündə
  const rs = new THREE.Shape();
  // dam: şüşənin üstünü örtür (yalnız yanlarda, öndə və arxada şüşə görünür — real Elantra kimi)
  rs.moveTo(S.roofF - 0.02, S.H - 0.015);
  rs.quadraticCurveTo((S.roofF + S.roofR) / 2, S.H + 0.035, S.roofR + 0.06, S.H - 0.02);
  rs.lineTo(S.roofR + 0.06, S.H - 0.07);
  rs.quadraticCurveTo((S.roofF + S.roofR) / 2, S.H - 0.03, S.roofF - 0.02, S.H - 0.07);
  const gw = greenWidth(S);
  body.add(mesh(sculpt(rs, W, (y) => gw(y) + 0.012, 4, 10), paint));
  // dirəklər: B (qara), C (rəngli üçbucaq) — yan şüşələrin arasında
  const midB = (S.roofF + S.roofR) / 2 - 0.05;
  for (const s of [1, -1]) {
    const yB = (S.belt + S.H) / 2;
    const b = box(0.02, S.H - S.belt - 0.05, 0.09, m.gloss, s * (gw(yB) + 0.006), yB, midB);
    b.rotation.z = s * 0.2;
    body.add(b);
    // C dirəyində qara üçbucaqlı örtük (fotolardakı kimi)
    body.add(sidePoly([[S.roofR + 0.2, S.H - 0.07], [S.glassR + 0.3, S.deck + 0.05], [S.roofR - 0.08, S.belt + 0.03]], s * (gw(S.belt + 0.2) + 0.008), m.glossDS));
    // pəncərə ətrafı xrom zolaq
    const ch = box(0.012, 0.012, (S.cowl - S.glassR) * 0.86, m.chrome, s * (lw(S.belt, 0.5) - 0.012), S.belt + 0.005, (S.cowl + S.glassR) / 2 - 0.05);
    body.add(ch);
  }

  // təkər yuvaları (qara layner — gövdənin içindən görünməsin)
  for (const z of [0, wb]) {
    const lg = new THREE.CylinderGeometry(S.arch - 0.01, S.arch - 0.01, W - 0.12, 20, 1, true, -Math.PI / 2, Math.PI);
    lg.rotateZ(Math.PI / 2);
    const lm = mesh(lg, m.well, false);
    lm.position.set(0, 0.22, z);
    lm.material.side = THREE.DoubleSide;
    body.add(lm);
  }

  // ön: barmaqlıq, faralar, loqo, alt hissə
  const gm = new THREE.MeshStandardMaterial({ map: grille(), roughness: 0.3, metalness: 0.4 });
  const gr = mesh(new THREE.PlaneGeometry(W * 0.74, 0.27), gm, false);
  gr.position.set(0, 0.47, F0 - 0.005);
  body.add(gr);
  body.add(box(W * 0.6, 0.06, 0.05, m.trim, 0, 0.28, F0 - 0.1));
  const lights = {};
  const em = (c, e, i = 0) => new THREE.MeshStandardMaterial({ color: c, emissive: e, emissiveIntensity: i, roughness: 0.3 });
  lights.drl = em(0xf4f4f0, 0xffffff, 1.2);
  lights.brake = em(0x5a0808, 0xff1a1a, 0.15);
  lights.tail = em(0x6a0b0b, 0xff2a2a, 0.35);
  lights.reverse = em(0xdddddd, 0xffffff);
  lights.blinkL = em(0x6a3d00, 0xffa000);
  lights.blinkR = em(0x6a3d00, 0xffa000);
  for (const s of [1, -1]) {
    // faralar: dar, künclərə doğru uzanan (Elantra kimi — sadələşdirilmiş)
    const hl = new THREE.Group();
    hl.add(box(0.46, 0.075, 0.12, m.gloss, 0, 0, 0));
    hl.add(box(0.44, 0.012, 0.01, lights.drl, 0, 0.026, 0.062));
    const lens = box(0.47, 0.08, 0.125, m.lens, 0, 0, 0.005);
    lens.castShadow = false;
    hl.add(lens);
    hl.position.set(s * (HW - 0.3), 0.665, F0 - 0.17);
    hl.rotation.y = s * 0.32;
    hl.rotation.z = -s * 0.06;
    body.add(hl);
    body.add(box(0.12, 0.035, 0.03, lights[s > 0 ? 'blinkL' : 'blinkR'], s * (HW - 0.12), 0.64, F0 - 0.3));
  }
  const logo = mesh(new THREE.TorusGeometry(0.055, 0.008, 8, 28), m.chrome, false);
  logo.scale.set(1.45, 1, 1);
  logo.rotation.z = 0.12;
  logo.position.set(0, 0.63, F0 - 0.02);
  body.add(logo);

  // arxa: bütün eni boyu işıq zolağı ("H" forması — sadələşdirilmiş), bamper, nömrə, kamera
  body.add(box(W - 0.22, 0.035, 0.02, lights.tail, 0, S.deck - 0.07, R0 + 0.02));
  for (const s of [1, -1]) {
    const v = box(0.03, 0.16, 0.02, lights.tail, s * (HW - 0.2), S.deck - 0.12, R0 + 0.03);
    body.add(v);
    body.add(box(0.24, 0.05, 0.02, lights.brake, s * (HW - 0.3), S.deck - 0.16, R0 + 0.025));
    body.add(box(0.08, 0.04, 0.02, lights.reverse, s * 0.42, 0.5, R0 + 0.01));
    body.add(box(0.1, 0.035, 0.02, s > 0 ? lights.blinkL : lights.blinkR, s * (HW - 0.12), S.deck - 0.2, R0 + 0.03));
  }
  body.add(box(W * 0.7, 0.1, 0.06, m.trim, 0, 0.3, R0 + 0.06));
  body.add(box(0.31, 0.16, 0.01, m.plate, 0, 0.7, R0 - 0.004));
  body.add(box(0.03, 0.02, 0.02, m.gloss, ...VIEW.rearCam.map((v, i) => (i === 2 ? R0 + 0.005 : i === 1 ? 0.8 : v))));

  // yan güzgülər: gövdə rəngli korpus, qara əsas, dönmə işığı
  for (const s of [1, -1]) {
    const mg = new THREE.Group();
    const hs = mesh(new THREE.SphereGeometry(0.1, 14, 10), paint);
    hs.scale.set(1.0, 0.62, 0.55);
    mg.add(hs);
    const glass = mesh(new THREE.PlaneGeometry(0.15, 0.09), new THREE.MeshStandardMaterial({ color: 0x9fb0bd, metalness: 1, roughness: 0.05 }), false);
    glass.position.set(0, 0, -0.056);
    glass.rotation.y = Math.PI;
    mg.add(glass);
    mg.add(box(0.06, 0.03, 0.08, m.trim, -s * 0.07, -0.03, 0.02));
    mg.add(box(0.08, 0.008, 0.03, s > 0 ? lights.blinkL : lights.blinkR, s * 0.02, -0.055, 0.03));
    mg.position.set(s * (HW + 0.07), 0.99, 1.92);
    body.add(mg);
    // qapı tutacaqları və qapı aralıqları
    for (const z of [1.25, 0.15]) body.add(box(0.015, 0.025, 0.14, paint, s * (lw(0.82, z) + 0.004), 0.82, z));
    for (const z of [1.98, 0.92, -0.08]) body.add(box(0.004, 0.55, 0.006, m.trim, s * (lw(0.6, z) + 0.002), 0.6, z));
  }
  if (kind === 'elantra') {
    // akula üzgəci antena
    const fin = new THREE.Shape();
    fin.moveTo(0.08, 0); fin.lineTo(-0.1, 0); fin.quadraticCurveTo(-0.08, 0.06, 0.02, 0.065); fin.closePath();
    const fg = new THREE.ExtrudeGeometry(fin, { depth: 0.05, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01, bevelSegments: 2 });
    fg.rotateY(-Math.PI / 2); fg.translate(0.025, 0, 0);
    const fm = mesh(fg, m.gloss); fm.position.set(0, S.H - 0.03, S.roofR + 0.1); body.add(fm);
    // kapotda loqoya doğru yaxınlaşan iki xətt (V) — fotolardakı kimi
    const hoodY = (z) => { const t = (S.cowl - z) / (S.cowl - (S.F0 - 0.2)); const a = S.belt, b = S.hood + 0.085, c = S.hood; return (1 - t) * (1 - t) * a + 2 * (1 - t) * t * b + t * t * c; };
    const creaseMat = new THREE.MeshStandardMaterial({ color: 0x000000, transparent: true, opacity: 0.22, depthWrite: false });
    for (const sd of [1, -1]) {
      const pts = [];
      for (let i = 0; i <= 10; i++) {
        const t = i / 10, z = S.cowl - 0.05 + t * (S.F0 - 0.25 - S.cowl + 0.05);
        pts.push(new THREE.Vector3(sd * (0.42 - 0.3 * t), hoodY(z) + 0.004, z));
      }
      const cr = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, 0.003, 4), creaseMat, false);
      body.add(cr);
    }
    // altlıq: qara plastik örtük (fotolardakı kimi)
    body.add(box(W - 0.3, 0.01, S.wb - 0.75, new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.95 }), 0, 0.17, S.wb / 2));
    // arxa şüşənin altında qara zolaq
    body.add(box(W * 0.78, 0.012, 0.13, m.gloss, 0, S.deck + 0.004, S.glassR + 0.08));
    // "Z" formalı yan xətt: qapılar boyunca enən kəskin qırış — tünd kölgə xətti + üstündə işıqlı kənar
    const creaseDark = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false });
    const creaseLight = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.12, depthWrite: false });
    for (const sd of [1, -1]) {
      const line = (dy, mat) => {
        const pts = [];
        for (let i = 0; i <= 12; i++) {
          const t = i / 12, z = 2.05 - t * 2.5, y = 0.84 - t * 0.27 + dy;
          pts.push(new THREE.Vector3(sd * (lw(y, z) + 0.003), y, z));
        }
        body.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.004, 4), mat, false));
      };
      line(0, creaseDark);
      line(0.012, creaseLight);
      // ön bamperin küncündə qara üçbucaqlı hava girişi
      const tri = new THREE.Shape();
      tri.moveTo(0, 0); tri.lineTo(0.16, 0.0); tri.lineTo(0.02, 0.13); tri.closePath();
      const tg = new THREE.ShapeGeometry(tri);
      const tm = mesh(tg, m.gloss, false);
      tm.position.set(sd * (HW - 0.12), 0.36, F0 - 0.1);
      tm.rotation.y = sd * 0.7;
      tm.scale.x = -sd;
      body.add(tm);
      // arxa künclərdə üçbucaqlı fənərlər (zolağın uclarında, yana keçir)
      const tl = new THREE.Shape();
      tl.moveTo(0, 0); tl.lineTo(0.42, 0.03); tl.lineTo(0, -0.17); tl.closePath(); // gövdənin içinə doğru
      const tlg = new THREE.ShapeGeometry(tl);
      const tlm = mesh(tlg, lights.tail, false);
      tlm.position.set(sd * (HW - 0.06), S.deck - 0.055, R0 + 0.04);
      tlm.rotation.y = Math.PI;
      tlm.scale.x = sd;
      body.add(tlm);
      const side = box(0.012, 0.06, 0.38, lights.tail, sd * (lw(S.deck - 0.1, R0 + 0.25) + 0.002), S.deck - 0.11, R0 + 0.22);
      side.rotation.x = -0.25;
      body.add(side);
    }
    // baqajda "ELANTRA" yazısı
    const name = mesh(new THREE.PlaneGeometry(0.62, 0.05), new THREE.MeshStandardMaterial({ map: canvasTex(512, 48, (g2) => {
      g2.clearRect(0, 0, 512, 48); g2.fillStyle = '#d0d4d8'; g2.font = '600 34px Arial'; g2.textAlign = 'center'; g2.textBaseline = 'middle';
      g2.fillText('E  L  A  N  T  R  A', 256, 26);
    }), transparent: true, metalness: 0.9, roughness: 0.25 }), false);
    name.position.set(0, S.deck - 0.27, R0 + 0.006);
    name.rotation.y = Math.PI;
    body.add(name);
  }

  // təkərlər (205/55R16 → radius ≈ 0.316 m — təxmini)
  const wheels = {};
  const track = D.track || W - 0.25;
  for (const [k, x, z] of [['fl', 1, wb], ['fr', -1, wb], ['rl', 1, 0], ['rr', -1, 0]]) {
    const pivot = new THREE.Group();
    pivot.position.set(x * track / 2, 0, z);
    const w = makeWheel(0.316, player ? 1 : 0);
    if (x < 0) w.rotation.y = Math.PI; // disk üzü bayıra
    pivot.add(w);
    root.add(pivot);
    wheels[k] = { pivot, wheel: w };
  }

  setLayer(root, player ? LAYER.BODY : LAYER.WORLD);
  const out = { root, wheels, lights, paint };
  if (player) addInterior(root, out, paint, S);
  return out;
}

const PARKED_KINDS = [
  { kind: 'sedan', d: { length: 4.85, width: 1.84, height: 1.45, wheelbase: 2.82, rearOverhang: 1.05, track: 1.6 } },
  { kind: 'suv', d: { length: 4.75, width: 1.88, height: 1.7, wheelbase: 2.75, rearOverhang: 1.0, track: 1.62 } },
  { kind: 'hatch', d: { length: 4.35, width: 1.8, height: 1.48, wheelbase: 2.65, rearOverhang: 0.85, track: 1.56 } },
];
// Ətraf maşınlar: hər növ+ölçü üçün bir dəfə qurulur, sonra hissələri material üzrə birləşdirilir
// (~80 obyekt → ~12 draw call) və həndəsə eyni maşınlar arasında paylaşılır. Yalnız boya materialı fərqlidir.
const parkedCache = new Map();
const paintCache = new Map();
function bakeTemplate(out) {
  out.root.updateMatrixWorld(true);
  const groups = new Map();
  out.root.traverse((o) => {
    if (!o.isMesh || !o.visible) return;
    let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    g.applyMatrix4(o.matrixWorld);
    for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'uv') g.deleteAttribute(k);
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    if (!g.attributes.normal) g.computeVertexNormals();
    const key = o.material.uuid;
    if (!groups.has(key)) groups.set(key, { mat: o.material, geos: [], cast: false });
    const e = groups.get(key);
    e.geos.push(g);
    e.cast ||= o.castShadow;
  });
  const parts = [];
  for (const e of groups.values()) parts.push({ geo: mergeGeometries(e.geos, false), mat: e.mat, cast: e.cast, paint: e.mat === out.paint });
  return { parts, lights: out.lights };
}
export function buildParkedCar(color, variant = 0, size = null) {
  const k = PARKED_KINDS[variant % PARKED_KINDS.length];
  // görünən model toqquşma qutusu ilə eyni ölçüdədir (qonşu maşınların ölçüsü məşqdə dəyişir)
  const L = size?.l || PARKED.length, Wd = size?.w || PARKED.width;
  const sc = L / k.d.length;
  const d = { ...k.d, length: L, width: Wd, wheelbase: k.d.wheelbase * sc, rearOverhang: k.d.rearOverhang * sc };
  const key = `${variant % PARKED_KINDS.length}|${L}|${Wd}|${MAT.physical}`;
  if (!parkedCache.has(key)) parkedCache.set(key, bakeTemplate(buildCar(0x888888, false, d, k.kind)));
  const t = parkedCache.get(key);
  if (!paintCache.has(color)) paintCache.set(color, paintMat(color));
  const paint = paintCache.get(color);
  const root = new THREE.Group();
  for (const p of t.parts) {
    const m = new THREE.Mesh(p.geo, p.paint ? paint : p.mat);
    m.castShadow = p.cast;
    m.receiveShadow = true;
    m.layers.set(LAYER.WORLD);
    root.add(m);
  }
  // modelin mənşəyi arxa oxdadır; mərkəzə qədər məsafə
  return { root, lights: t.lights, paint, centerOffset: d.length / 2 - d.rearOverhang };
}

// ---------- Salon (yalnız sürücü kamerası) ----------
let clusterCtx = null;
function addInterior(root, out, paint, S) {
  const HW = S.W / 2;
  // kapot: sürücü də görsün (gövdənin özü layer 1-dədir)
  const hoodShape = new THREE.Shape();
  hoodShape.moveTo(S.cowl, S.belt - 0.005);
  hoodShape.quadraticCurveTo((S.cowl + S.F0) / 2, S.hood + 0.085, S.F0 - 0.2, S.hood + 0.005);
  hoodShape.lineTo(S.F0 - 0.2, S.hood - 0.02);
  hoodShape.lineTo(S.cowl, S.belt - 0.04);
  const lw = lowerWidth(S);
  const hood = mesh(sculpt(hoodShape, S.W, (y, z) => lw(y, z) - 0.02, 6, 10), paint, false);
  root.add(hood);
  setLayer(hood, LAYER.BODY, [LAYER.INTERIOR]);

  const g = new THREE.Group();
  const soft = new THREE.MeshStandardMaterial({ color: 0x17181a, roughness: 0.9 });
  const trim = new THREE.MeshStandardMaterial({ color: 0x25272b, roughness: 0.7 });
  const silver = new THREE.MeshStandardMaterial({ color: 0x9da2a8, roughness: 0.35, metalness: 0.8 });
  const cloth = new THREE.MeshStandardMaterial({ color: 0x1a1b1d, roughness: 1 });
  const headliner = new THREE.MeshStandardMaterial({ color: 0xb8b5af, roughness: 0.95, side: THREE.DoubleSide });

  // panel: alçaq, üfüqi; üst hissə yumşaq plastik
  const dash = new THREE.Shape();
  dash.moveTo(1.38, 0.55); dash.lineTo(1.5, 0.78); dash.quadraticCurveTo(1.7, 0.85, 2.02, 0.88); dash.lineTo(2.02, 0.55);
  g.add(mesh(sculpt(dash, S.W - 0.1, () => HW - 0.15, 6, 6), soft, false));
  // havalandırma xətti (xrom)
  g.add(box(S.W - 0.2, 0.01, 0.015, silver, 0, 0.74, 1.47));
  // cihazlar + multimedia: bir çərçivədə, sürücüyə tərəf əyilmiş (SEL: analog cihazlar + 8" ekran — təxmini)
  const tex = canvasTex(512, 128, (c) => { clusterCtx = c; drawCluster(0, 'P'); });
  out.clusterTex = tex;
  const bezel = new THREE.Group();
  bezel.add(box(0.84, 0.14, 0.05, soft, 0, 0, 0));
  const scr = mesh(new THREE.PlaneGeometry(0.79, 0.115), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }), false);
  scr.position.z = -0.026;
  scr.rotation.y = Math.PI;
  bezel.add(scr);
  bezel.position.set(0.13, 0.9, 1.57); // üst kənarı kapota baxış xəttindən aşağıdadır
  bezel.rotation.set(-0.12, -0.16, 0);
  g.add(bezel);
  // sərnişin tərəfdə diaqonal konsol "qanadı"
  const wing = box(0.05, 0.05, 0.85, trim, -0.13, 0.62, 1.08);
  wing.rotation.set(0.42, -0.12, 0);
  g.add(wing);
  g.add(box(0.2, 0.2, 0.7, trim, 0, 0.46, 0.85)); // orta konsol
  g.add(box(0.05, 0.1, 0.05, silver, 0.02, 0.6, 0.95)); // ötürmə qolu
  // qapı panelləri
  for (const s of [1, -1]) {
    // gövdə qabığının içində qalır (çöldən salon görünəndə qapı panelləri gövdədən çıxmasın)
    g.add(box(0.05, 0.3, 2.0, trim, s * (HW - 0.13), 0.76, 0.6));
    g.add(box(0.02, 0.012, 1.1, silver, s * (HW - 0.16), 0.88, 0.85));
  }
  // A dirəkləri ön şüşənin kənarı boyunca (şüşənin həndəsəsinə görə)
  const a0 = new THREE.Vector3(0, S.belt - 0.02, S.cowl - 0.03), a1 = new THREE.Vector3(0, S.H - 0.03, S.roofF + 0.02);
  const dir = a1.clone().sub(a0);
  for (const s of [1, -1]) {
    const len = dir.length();
    const pl = box(0.055, len, 0.07, soft, 0, 0, 0);
    pl.position.copy(a0.clone().add(a1).multiplyScalar(0.5));
    pl.position.x = s * (HW - 0.17);
    pl.lookAt(pl.position.clone().add(dir));
    pl.rotateX(Math.PI / 2);
    g.add(pl);
    g.add(box(0.06, 0.45, 0.1, trim, s * (HW - 0.2), 1.1, (S.roofF + S.roofR) / 2 - 0.05)); // B
  }
  // tavan
  const roof = mesh(new THREE.PlaneGeometry(S.W - 0.36, S.roofF - S.roofR - 0.05), headliner, false);
  roof.rotation.x = Math.PI / 2;
  roof.position.set(0, S.H - 0.07, (S.roofF + S.roofR) / 2);
  g.add(roof);
  // salon güzgüsü (ön şüşəyə bərkidilib)
  g.add(box(0.25, 0.065, 0.025, soft, VIEW.mirrorC[0], VIEW.mirrorC[1] + 0.01, VIEW.mirrorC[2] + 0.02));
  // oturacaqlar (qara parça, ağ zolaqlar — fotolardakı kimi)
  const stripe = new THREE.MeshStandardMaterial({ color: 0xcfd2d6, roughness: 0.8 });
  for (const x of [0.37, -0.37]) {
    const seat = new THREE.Group();
    seat.add(box(0.5, 0.12, 0.5, cloth, 0, 0.45, 0));
    const back = box(0.5, 0.7, 0.12, cloth, 0, 0.82, -0.27);
    back.rotation.x = -0.18;
    seat.add(back);
    seat.add(box(0.28, 0.2, 0.1, cloth, 0, 1.25, -0.34));
    // çiyin hissəsində üç nazik ağ zolaq (fotolardakı kimi, kənar tərəfdə)
    for (let k = 0; k < 3; k++) {
      const st = box(0.008, 0.45, 0.005, stripe, Math.sign(x) * (0.17 + k * 0.016), 0.8, -0.2);
      st.rotation.x = -0.18;
      seat.add(st);
    }
    seat.position.set(x, 0, 0.62);
    if (x > 0) { seat.visible = false; out.driverSeat = seat; } // sürücünün öz oturacağı içəridən görünmür, çöldən görünür
    g.add(seat);
  }
  g.add(box(0.2, 0.08, 0.3, soft, 0, 0.6, 0.45)); // qoltuqaltı
  g.add(box(S.W - 0.36, 0.12, 0.5, cloth, 0, 0.47, -0.08)); // arxa oturacaq (arxa şüşənin altında qalır)
  const rb = box(S.W - 0.36, 0.55, 0.12, cloth, 0, 0.78, -0.33);
  rb.rotation.x = -0.2;
  g.add(rb);
  g.add(box(S.W - 0.36, 0.03, 0.32, soft, 0, 0.95, S.glassR + 0.2)); // arxa rəf (arxa şüşənin altında, baqajın içinə çıxmır)

  // sükan: üç qollu (2023 Elantra kimi — sadələşdirilmiş), ortada loqo
  const steer = new THREE.Group();
  steer.position.set(VIEW.eye[0], 0.82, 1.38);
  steer.rotation.x = -0.42;
  const ringMat = new THREE.MeshStandardMaterial({ color: 0x141517, roughness: 0.65 });
  const spin = new THREE.Group();
  spin.add(mesh(new THREE.TorusGeometry(0.18, 0.019, 12, 48), ringMat, false));
  for (const [w, h, x, y, rz] of [[0.15, 0.04, -0.085, -0.015, 0.08], [0.15, 0.04, 0.085, -0.015, -0.08], [0.035, 0.11, -0.03, -0.11, 0.1], [0.035, 0.11, 0.03, -0.11, -0.1]]) {
    const sp = mesh(new THREE.BoxGeometry(w, h, 0.02), ringMat, false);
    sp.position.set(x, y, 0);
    sp.rotation.z = rz;
    spin.add(sp);
  }
  const hub = mesh(new THREE.CylinderGeometry(0.068, 0.068, 0.05, 24), ringMat, false);
  hub.rotation.x = Math.PI / 2;
  const logo = mesh(new THREE.TorusGeometry(0.026, 0.005, 6, 20), silver, false);
  logo.scale.set(1.45, 1, 1);
  logo.position.z = -0.03;
  const mark = mesh(new THREE.BoxGeometry(0.025, 0.02, 0.022), new THREE.MeshBasicMaterial({ color: 0xff9a2e }), false);
  mark.position.y = 0.18;
  spin.add(hub, logo, mark);
  steer.add(spin);
  g.add(steer);
  root.add(g);
  setLayer(g, LAYER.INTERIOR);
  out.steeringWheel = spin;
}

// Cihazlar paneli: iki analog cihaz + ekran (canvas). Sürət dəyişəndə yenilənir.
export function drawCluster(kmh, gear) {
  const g = clusterCtx;
  if (!g) return;
  g.fillStyle = '#05080b'; g.fillRect(0, 0, 512, 128);
  const dial = (cx, val, max, label) => {
    g.strokeStyle = '#3c4650'; g.lineWidth = 3; g.beginPath(); g.arc(cx, 70, 46, Math.PI * 0.75, Math.PI * 2.25); g.stroke();
    g.strokeStyle = '#cfd6dc'; g.lineWidth = 2;
    for (let i = 0; i <= 10; i++) { const a = Math.PI * 0.75 + (i / 10) * Math.PI * 1.5; g.beginPath(); g.moveTo(cx + Math.cos(a) * 40, 70 + Math.sin(a) * 40); g.lineTo(cx + Math.cos(a) * 46, 70 + Math.sin(a) * 46); g.stroke(); }
    const a = Math.PI * 0.75 + Math.min(1, val / max) * Math.PI * 1.5;
    g.strokeStyle = '#ff5a2a'; g.lineWidth = 3; g.beginPath(); g.moveTo(cx, 70); g.lineTo(cx + Math.cos(a) * 42, 70 + Math.sin(a) * 42); g.stroke();
    g.fillStyle = '#9aa6b0'; g.font = '11px sans-serif'; g.textAlign = 'center'; g.fillText(label, cx, 112);
  };
  dial(60, 800 + kmh * 60, 7000, 'RPM');
  dial(196, kmh / 1.609, 160, 'MPH');
  g.fillStyle = '#e8eef2'; g.font = 'bold 26px sans-serif'; g.textAlign = 'center'; g.fillText(gear, 128, 78);
  // multimedia ekranı
  g.fillStyle = '#0b1622'; g.fillRect(272, 8, 232, 112);
  g.fillStyle = '#20384f'; g.fillRect(280, 16, 216, 70);
  g.fillStyle = '#7fb2d9'; g.font = '13px sans-serif'; g.textAlign = 'left';
  g.fillText(gear === 'R' ? 'Arxa kamera' : `${kmh.toFixed(0)} km/saat`, 290, 106);
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
  const mat = new THREE.MeshBasicMaterial({ color: 0x2ee66b, transparent: true, opacity: 0.18, depthWrite: false });
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
