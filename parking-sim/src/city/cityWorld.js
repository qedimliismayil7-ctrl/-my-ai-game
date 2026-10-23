// Şəhər səhnəsi: OSM məlumatından yollar, zolaq xətləri, dayanma xətləri, piyada keçidləri, svetoforlar,
// sürət nişanları və binalar. Həndəsələr birləşdirilir (performans üçün).
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { convexHull } from '../physics.js';
import { signalState } from './network.js';

const Y = { ground: 0, area: 0.01, road: 0.02, mark: 0.045 };

// Polilayının hər nöqtəsində sol normal (miter)
function normals(pts) {
  const n = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let dx = b[0] - a[0], dz = b[1] - a[1];
    const l = Math.hypot(dx, dz) || 1;
    dx /= l; dz /= l;
    n.push([dz, -dx]); // sol tərəf (irəli = (dx, dz))
  }
  return n;
}

function stripGeometry(pts, offL, offR, y) {
  const nm = normals(pts);
  const pos = [], idx = [];
  pts.forEach(([x, z], i) => {
    const [nx, nz] = nm[i];
    pos.push(x + nx * offL, y, z + nz * offL, x + nx * offR, y, z + nz * offR);
    if (i > 0) { const k = (i - 1) * 2; idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// Polilayn üzərində [s0, s1] arc-uzunluq hissəsini kəs
function slice(pts, cum, s0, s1) {
  const out = [];
  const at = (s) => {
    let i = 1;
    while (i < cum.length - 1 && cum[i] < s) i++;
    const t = (s - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
    return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t];
  };
  out.push(at(s0));
  for (let i = 0; i < cum.length; i++) if (cum[i] > s0 && cum[i] < s1) out.push(pts[i]);
  out.push(at(s1));
  return out;
}

function cumulative(pts) {
  const c = [0];
  for (let i = 1; i < pts.length; i++) c.push(c[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return c;
}

function signTexture(draw) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  draw(c.getContext('2d'));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const texCache = new Map();
function speedSignTex(v) {
  if (!texCache.has(v)) texCache.set(v, signTexture((g) => {
    g.fillStyle = '#fff'; g.beginPath(); g.arc(64, 64, 60, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#d1202a'; g.lineWidth = 14; g.beginPath(); g.arc(64, 64, 52, 0, Math.PI * 2); g.stroke();
    g.fillStyle = '#111'; g.font = 'bold 54px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(v), 64, 68);
  }));
  return texCache.get(v);
}
const crossingTex = () => signTexture((g) => {
  g.fillStyle = '#1d5fbf'; g.fillRect(4, 4, 120, 120);
  g.fillStyle = '#fff'; g.beginPath(); g.moveTo(64, 14); g.lineTo(118, 112); g.lineTo(10, 112); g.closePath(); g.fill();
  g.fillStyle = '#111'; g.beginPath(); g.arc(64, 52, 7, 0, Math.PI * 2); g.fill();
  g.lineWidth = 7; g.strokeStyle = '#111'; g.beginPath(); g.moveTo(64, 60); g.lineTo(60, 82); g.lineTo(48, 100); g.moveTo(60, 82); g.lineTo(76, 100); g.moveTo(52, 70); g.lineTo(76, 74); g.stroke();
});
const stopTex = () => signTexture((g) => {
  g.fillStyle = '#d1202a'; g.beginPath();
  for (let i = 0; i < 8; i++) { const a = Math.PI / 8 + (i * Math.PI) / 4; g.lineTo(64 + 60 * Math.cos(a), 64 + 60 * Math.sin(a)); }
  g.fill(); g.fillStyle = '#fff'; g.font = 'bold 36px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('STOP', 64, 66);
});
const giveWayTex = () => signTexture((g) => {
  g.fillStyle = '#d1202a'; g.beginPath(); g.moveTo(6, 14); g.lineTo(122, 14); g.lineTo(64, 120); g.closePath(); g.fill();
  g.fillStyle = '#fff'; g.beginPath(); g.moveTo(28, 26); g.lineTo(100, 26); g.lineTo(64, 94); g.closePath(); g.fill();
});

function hash(s) {
  let h = 0;
  for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) | 0;
  return Math.abs(h);
}

export function buildCity(city, net) {
  const group = new THREE.Group();
  const obstacles = [];
  const LW = city.defaults.laneWidth;

  // yer
  const size = Math.max(city.half[0], city.half[1]) * 2 + 400;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshStandardMaterial({ color: 0xb7b2a6, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);

  // yaşıllıq və su
  const greens = [], waters = [];
  for (const a of city.areas) {
    const shape = new THREE.Shape(a.pts.map(([x, z]) => new THREE.Vector2(x, -z)));
    const g = new THREE.ShapeGeometry(shape);
    g.rotateX(-Math.PI / 2);
    g.translate(0, Y.area, 0);
    (a.kind === 'water' ? waters : greens).push(g);
  }
  if (greens.length) group.add(new THREE.Mesh(mergeGeometries(greens), new THREE.MeshStandardMaterial({ color: 0x6d8f4e, roughness: 1, side: THREE.DoubleSide })));
  if (waters.length) group.add(new THREE.Mesh(mergeGeometries(waters), new THREE.MeshStandardMaterial({ color: 0x3d6f8f, roughness: 0.4, side: THREE.DoubleSide })));

  // yollar: geniş yollar üstdə (kəsişmələrdə)
  const roadGeo = [], solid = [], dashed = [];
  const sorted = city.roads.slice().sort((a, b) => a.width - b.width);
  sorted.forEach((r, k) => {
    const hw = r.width / 2;
    roadGeo.push(stripGeometry(r.pts, hw, -hw, Y.road + k * 0.00002));
    // xətlər üçün kəsişmələrin ətrafını kəs
    const cum = cumulative(r.pts);
    const total = cum[cum.length - 1];
    const cuts = [];
    r.nodes.forEach((id, i) => {
      if ((net.junction.get(id) || 0) >= 3 || i === 0 || i === r.nodes.length - 1) {
        const rr = net.crossHalfWidth(id, r) + 1.5;
        cuts.push([cum[i] - rr, cum[i] + rr]);
      }
    });
    const keep = [];
    let s = 0;
    for (const [a, b] of cuts.sort((p, q) => p[0] - q[0])) { if (a > s) keep.push([s, a]); s = Math.max(s, b); }
    if (s < total) keep.push([s, total]);
    const lanesDir = r.oneway ? r.lanes : Math.max(1, Math.floor(r.lanes / 2));
    const lines = [];
    if (!r.oneway) {
      if (r.lanes >= 4) lines.push({ off: 0.12, dash: false }, { off: -0.12, dash: false });
      else lines.push({ off: 0, dash: r.lanes < 2 ? null : true });
      for (let k2 = 1; k2 < lanesDir; k2++) lines.push({ off: k2 * Math.min(LW, hw / lanesDir), dash: true }, { off: -k2 * Math.min(LW, hw / lanesDir), dash: true });
    } else {
      const lw = r.width / r.lanes;
      for (let k2 = 1; k2 < r.lanes; k2++) lines.push({ off: hw - k2 * lw, dash: true });
    }
    for (const [a, b] of keep) {
      if (b - a < 2) continue;
      for (const ln of lines) {
        if (ln.dash === null) continue;
        if (!ln.dash) { solid.push(stripGeometry(slice(r.pts, cum, a, b), ln.off + 0.06, ln.off - 0.06, Y.mark)); continue; }
        for (let d = a; d + 3 <= b; d += 9) dashed.push(stripGeometry(slice(r.pts, cum, d, d + 3), ln.off + 0.06, ln.off - 0.06, Y.mark));
      }
    }
  });
  const asphalt = new THREE.MeshStandardMaterial({ color: 0x4a4c50, roughness: 0.95, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  const roadMesh = new THREE.Mesh(mergeGeometries(roadGeo), asphalt);
  roadMesh.receiveShadow = true;
  group.add(roadMesh);
  const paint = new THREE.MeshStandardMaterial({ color: 0xf0efe8, roughness: 0.7, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const marks = [...solid, ...dashed];

  // dayanma xətləri (svetoforlarda)
  for (const ap of net.approaches) {
    const lx = ap.dz, lz = -ap.dx; // sol
    const from = ap.oneway ? ap.halfW : 0;
    const p0 = [ap.x + lx * from, ap.z + lz * from], p1 = [ap.x - lx * ap.halfW, ap.z - lz * ap.halfW];
    marks.push(stripGeometry([p0, p1], 0.2, -0.2, Y.mark + 0.001));
  }
  // piyada keçidləri (zebra)
  for (const c of city.crossings) {
    for (const s of net.segsNear(c.x, c.z)) {
      if (s.a !== c.id && s.b !== c.id) continue;
      const lx = s.dz, lz = -s.dx;
      for (let o = -s.halfW + 0.3; o < s.halfW - 0.2; o += 1.0) {
        const cx = c.x + lx * o, cz = c.z + lz * o;
        marks.push(stripGeometry([[cx - s.dx * 2, cz - s.dz * 2], [cx + s.dx * 2, cz + s.dz * 2]], 0.25, -0.25, Y.mark + 0.002));
      }
      break;
    }
  }
  if (marks.length) group.add(new THREE.Mesh(mergeGeometries(marks), paint));

  // svetoforlar
  const lights = [];
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x3a3d42, metalness: 0.5, roughness: 0.5 });
  const housingMat = new THREE.MeshStandardMaterial({ color: 0x1b1c1e, roughness: 0.7 });
  for (const ap of net.approaches) {
    const rx = -ap.dz, rz = ap.dx; // sağ
    const px = ap.x + rx * (ap.halfW + 0.7), pz = ap.z + rz * (ap.halfW + 0.7);
    const g = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 3.4, 8), poleMat);
    pole.position.y = 1.7;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.95, 0.25), housingMat);
    head.position.y = 3.1;
    g.add(pole, head);
    const mats = ['#ff2a2a', '#ffb400', '#29e05a'].map((c) => new THREE.MeshStandardMaterial({ color: 0x222222, emissive: new THREE.Color(c), emissiveIntensity: 0 }));
    mats.forEach((m, i) => {
      const lamp = new THREE.Mesh(new THREE.CircleGeometry(0.11, 16), m);
      lamp.position.set(0, 3.4 - i * 0.3, -0.13);
      lamp.rotation.y = Math.PI;
      g.add(lamp);
    });
    g.position.set(px, 0, pz);
    g.rotation.y = Math.atan2(ap.dx, ap.dz); // lampalar gələn sürücüyə baxır
    group.add(g);
    lights.push({ ap, mats });
  }

  // nişanlar
  const signMat = (tex) => new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide });
  const addSign = (x, z, dx, dz, mat, size = 0.7) => {
    const rx = -dz, rz = dx;
    const g = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.3, 6), poleMat);
    pole.position.y = 1.15;
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat);
    plate.position.y = 2.3;
    g.add(pole, plate);
    g.position.set(x + rx * 0.0, 0, z + rz * 0.0);
    g.rotation.y = Math.atan2(-dx, -dz);
    group.add(g);
  };
  const speedSigns = [];
  for (const r of city.roads) {
    const cum = cumulative(r.pts);
    if (cum[cum.length - 1] < 60) continue;
    const place = (pts) => {
      const [ax, az] = pts[0], [bx, bz] = pts[1];
      const l = Math.hypot(bx - ax, bz - az) || 1;
      const dx = (bx - ax) / l, dz = (bz - az) / l;
      const d = Math.min(12, l * 0.5);
      const off = r.width / 2 + 0.8;
      addSign(ax + dx * d - dz * off, az + dz * d + dx * off, dx, dz, signMat(speedSignTex(r.maxspeed)));
      speedSigns.push({ road: r });
    };
    place(r.pts);
    if (!r.oneway) place(r.pts.slice().reverse());
  }
  const cTex = crossingTex();
  for (const c of city.crossings) {
    for (const s of net.segsNear(c.x, c.z)) {
      if (s.a !== c.id && s.b !== c.id) continue;
      for (const sgn of [1, -1]) {
        const dx = s.dx * sgn, dz = s.dz * sgn;
        const off = s.halfW + 0.8;
        addSign(c.x - dx * 3 - dz * off, c.z - dz * 3 + dx * off, dx, dz, signMat(cTex));
      }
      break;
    }
  }
  for (const sg of city.signs) {
    const tex = sg.type === 'stop' ? stopTex() : sg.type === 'give_way' ? giveWayTex() : null;
    if (!tex) continue;
    const m = net.match(sg.x, sg.z, 0);
    const s = m && m.seg;
    if (s) addSign(sg.x - s.dz * (s.halfW + 0.8), sg.z + s.dx * (s.halfW + 0.8), s.dx, s.dz, signMat(tex));
  }

  // binalar (hündürlük OSM-də yoxdursa — təxmini 12–21 m)
  const palette = [0xd9c9a8, 0xcbb994, 0xe2d6bd, 0xbfae8e, 0xd2c4ab];
  const byColor = palette.map(() => []);
  for (const b of city.buildings) {
    const h = b.h || 12 + (hash(b.pts[0].join()) % 4) * 3;
    const shape = new THREE.Shape(b.pts.map(([x, z]) => new THREE.Vector2(x, -z)));
    const g = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false });
    g.rotateX(-Math.PI / 2);
    byColor[hash(b.pts[0].join() + 'c') % palette.length].push(g);
    const hull = convexHull(b.pts);
    let cx = 0, cz = 0;
    for (const [x, z] of hull) { cx += x; cz += z; }
    cx /= hull.length; cz /= hull.length;
    const r = Math.max(...hull.map(([x, z]) => Math.hypot(x - cx, z - cz)));
    obstacles.push({ poly: hull, cx, cz, r, hw: r, hl: r, h: 0, type: 'building', name: 'bina' });
  }
  byColor.forEach((list, i) => {
    if (!list.length) return;
    const m = new THREE.Mesh(mergeGeometries(list), new THREE.MeshStandardMaterial({ color: palette[i], roughness: 0.9 }));
    m.castShadow = m.receiveShadow = true;
    group.add(m);
  });

  return {
    group,
    obstacles,
    update(time) {
      for (const L of lights) {
        const st = signalState(L.ap, time);
        L.mats[0].emissiveIntensity = st === 'red' ? 2.2 : 0.05;
        L.mats[1].emissiveIntensity = st === 'yellow' ? 2.2 : 0.05;
        L.mats[2].emissiveIntensity = st === 'green' ? 2.2 : 0.05;
      }
    },
    nearObstacles(x, z, rad = 30) {
      return obstacles.filter((o) => Math.abs(o.cx - x) < o.r + rad && Math.abs(o.cz - z) < o.r + rad);
    },
  };
}
