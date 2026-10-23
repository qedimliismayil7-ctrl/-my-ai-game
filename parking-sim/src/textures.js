// Prosedur teksturalar (fayl yükləmir — layihə xarici linklərdən asılı deyil).
// Hər material üçün rəng (albedo), roughness və hündürlükdən hesablanmış normal xəritəsi yaradılır.
import * as THREE from 'three';

// Toxumlu təsadüfi ədəd və hamar "value noise"
function rng(seed) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function valueNoise(size, cells, seed) {
  const r = rng(seed);
  const grid = new Float32Array((cells + 1) * (cells + 1)).map(() => r());
  const out = new Float32Array(size * size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const fx = (x / size) * cells, fy = (y / size) * cells;
    const ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy;
    const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
    const g = (a, b) => grid[((b % cells) * (cells + 1)) + (a % cells)];
    const v = g(ix, iy) * (1 - sx) * (1 - sy) + g(ix + 1, iy) * sx * (1 - sy) + g(ix, iy + 1) * (1 - sx) * sy + g(ix + 1, iy + 1) * sx * sy;
    out[y * size + x] = v;
  }
  return out;
}
function fbm(size, seed, octaves = [[4, 0.5], [16, 0.3], [64, 0.2]]) {
  const out = new Float32Array(size * size);
  octaves.forEach(([c, w], i) => {
    const n = valueNoise(size, c, seed + i * 101);
    for (let k = 0; k < out.length; k++) out[k] += n[k] * w;
  });
  return out;
}

// hündürlük → normal xəritəsi (tangent fəza)
function normalFromHeight(h, size, strength) {
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = y * size + x;
    const l = h[y * size + ((x - 1 + size) % size)], r = h[y * size + ((x + 1) % size)];
    const u = h[((y - 1 + size) % size) * size + x], d = h[((y + 1) % size) * size + x];
    let nx = (l - r) * strength, ny = (u - d) * strength, nz = 1;
    const len = Math.hypot(nx, ny, nz);
    nx /= len; ny /= len; nz /= len;
    data[i * 4] = (nx * 0.5 + 0.5) * 255;
    data[i * 4 + 1] = (ny * 0.5 + 0.5) * 255;
    data[i * 4 + 2] = (nz * 0.5 + 0.5) * 255;
    data[i * 4 + 3] = 255;
  }
  const t = new THREE.DataTexture(data, size, size);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.needsUpdate = true;
  return t;
}
function dataTex(fn, size, srgb) {
  const data = new Uint8Array(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    const [r, g, b, a = 255] = fn(i);
    data[i * 4] = r; data[i * 4 + 1] = g; data[i * 4 + 2] = b; data[i * 4 + 3] = a;
  }
  const t = new THREE.DataTexture(data, size, size);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.needsUpdate = true;
  return t;
}

const cache = {};
// Asfalt: iri və xırda dənələr, qətranın tünd/açıq yerləri; roughness dənələrdə yüksək
export function asphalt(size = 512) {
  if (cache.asphalt) return cache.asphalt;
  const base = fbm(size, 7, [[6, 0.45], [24, 0.3], [96, 0.25]]);
  const r = rng(11);
  const grit = new Float32Array(size * size);
  for (let i = 0; i < grit.length; i++) grit[i] = r() < 0.07 ? r() : 0;
  const height = new Float32Array(size * size);
  for (let i = 0; i < height.length; i++) height[i] = base[i] * 0.5 + grit[i];
  const map = dataTex((i) => {
    const v = 52 + base[i] * 34 + grit[i] * 55;
    return [v, v * 1.01, v * 1.04];
  }, size, true);
  const rough = dataTex((i) => { const v = 225 - grit[i] * 40 - base[i] * 20; return [v, v, v]; }, size, false);
  const normal = normalFromHeight(height, size, 2.2);
  return (cache.asphalt = { map, rough, normal });
}

// Beton (bordür, səki): açıq boz, xırda məsamələr
export function concrete(size = 256) {
  if (cache.concrete) return cache.concrete;
  const n = fbm(size, 21, [[8, 0.5], [32, 0.3], [128, 0.2]]);
  const map = dataTex((i) => { const v = 168 + n[i] * 40; return [v, v * 0.99, v * 0.96]; }, size, true);
  const rough = dataTex((i) => { const v = 215 + n[i] * 30; return [v, v, v]; }, size, false);
  return (cache.concrete = { map, rough, normal: normalFromHeight(n, size, 1.2) });
}

// Ot
export function grass(size = 256) {
  if (cache.grass) return cache.grass;
  const n = fbm(size, 31, [[8, 0.4], [40, 0.3], [160, 0.3]]);
  const map = dataTex((i) => [62 + n[i] * 40, 96 + n[i] * 52, 44 + n[i] * 22], size, true);
  return (cache.grass = { map, normal: normalFromHeight(n, size, 2) });
}

// Səki plitələri
export function paving(size = 256) {
  if (cache.paving) return cache.paving;
  const n = fbm(size, 41, [[16, 0.6], [64, 0.4]]);
  const tile = 64;
  const h = new Float32Array(size * size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const edge = Math.min(x % tile, y % tile, tile - (x % tile), tile - (y % tile));
    h[y * size + x] = (edge < 2 ? 0 : 1) * 0.8 + n[y * size + x] * 0.2;
  }
  const map = dataTex((i) => { const v = 150 + n[i] * 30 - (h[i] < 0.5 ? 40 : 0); return [v, v * 0.97, v * 0.93]; }, size, true);
  return (cache.paving = { map, normal: normalFromHeight(h, size, 3) });
}

// Canvas ilə çəkilən teksturalar (dekallar, binalar, nişanlar)
export function canvasTex(w, h, draw, srgb = true) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

// Aşınmış boya xətti üçün alfa (xətt boyu ləkələr və qırıqlar)
export function wornPaint() {
  if (cache.worn) return cache.worn;
  return (cache.worn = canvasTex(64, 512, (g, w, h) => {
    g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
    const r = rng(5);
    for (let i = 0; i < 260; i++) {
      g.fillStyle = `rgba(0,0,0,${0.25 + r() * 0.6})`;
      g.beginPath(); g.ellipse(r() * w, r() * h, 1 + r() * 6, 1 + r() * 10, 0, 0, Math.PI * 2); g.fill();
    }
  }, false));
}

// Çatlar, təkər izləri, yağ ləkələri — şəffaf dekallar
export function decal(kind) {
  const key = 'decal_' + kind;
  if (cache[key]) return cache[key];
  return (cache[key] = canvasTex(256, 256, (g, w, h) => {
    const r = rng(kind.length * 97);
    g.clearRect(0, 0, w, h);
    if (kind === 'crack') {
      g.strokeStyle = 'rgba(10,10,10,0.85)';
      for (let k = 0; k < 3; k++) {
        g.lineWidth = 1.5 + r() * 1.5;
        g.beginPath();
        let x = w * 0.5, y = h * 0.1;
        g.moveTo(x, y);
        while (y < h * 0.9) { x += (r() - 0.5) * 30; y += 8 + r() * 14; g.lineTo(x, y); if (r() < 0.15) { g.moveTo(x, y); } }
        g.stroke();
      }
    } else if (kind === 'oil') {
      const grd = g.createRadialGradient(128, 128, 4, 128, 128, 110);
      grd.addColorStop(0, 'rgba(8,8,10,0.55)'); grd.addColorStop(0.6, 'rgba(10,10,12,0.25)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grd; g.beginPath(); g.ellipse(128, 128, 120, 80, 0.3, 0, Math.PI * 2); g.fill();
    } else if (kind === 'tire') {
      g.strokeStyle = 'rgba(12,12,12,0.35)';
      g.lineWidth = 22;
      for (const x of [70, 186]) { g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 20, 80, x - 20, 170, x + 10, 256); g.stroke(); }
    } else if (kind === 'puddle') {
      g.fillStyle = 'rgba(255,255,255,1)';
      g.beginPath();
      for (let a = 0; a < Math.PI * 2; a += 0.3) { const rr = 70 + r() * 50; g.lineTo(128 + Math.cos(a) * rr, 128 + Math.sin(a) * rr * 0.7); }
      g.closePath(); g.fill();
    } else if (kind === 'shadow') {
      // kontakt kölgəsi (maşının altı)
      const grd = g.createRadialGradient(128, 128, 10, 128, 128, 128);
      grd.addColorStop(0, 'rgba(0,0,0,0.85)'); grd.addColorStop(0.55, 'rgba(0,0,0,0.55)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grd; g.fillRect(0, 0, w, h);
    }
  }, kind !== 'puddle'));
}

// Bina fasadı: pəncərə şəbəkəsi, çərçivələr, gecə üçün işıqlı pəncərələr (emissive xəritə)
export function facade(seed, color) {
  const key = 'fac' + seed + color;
  if (cache[key]) return cache[key];
  const r = rng(seed);
  const col = '#' + color.toString(16).padStart(6, '0');
  const draw = (lit) => (g, w, h) => {
    g.fillStyle = lit ? '#000' : col; g.fillRect(0, 0, w, h);
    const cols = 4, rows = 4;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const px = 14 + x * (w / cols), py = 14 + y * (h / rows), pw = w / cols - 28, ph = h / rows - 34;
      if (lit) { if (r() < 0.35) { g.fillStyle = `rgb(${200 + r() * 55},${160 + r() * 50},${90 + r() * 40})`; g.fillRect(px, py, pw, ph); } continue; }
      g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(px - 4, py - 4, pw + 8, ph + 8);
      const sky = g.createLinearGradient(0, py, 0, py + ph);
      sky.addColorStop(0, '#7f95a8'); sky.addColorStop(1, '#2c3a46');
      g.fillStyle = sky; g.fillRect(px, py, pw, ph);
      g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(px, py, pw * 0.4, ph);
      g.fillStyle = '#d9d4cb'; g.fillRect(px - 4, py + ph + 4, pw + 8, 5);
    }
  };
  return (cache[key] = { map: canvasTex(256, 256, draw(false)), emissive: canvasTex(256, 256, draw(true)) });
}

// Nişan: dairəvi qırmızı haşiyəli və ya mavi düzbucaqlı
export function signTex(kind, text = '') {
  const key = 'sign' + kind + text;
  if (cache[key]) return cache[key];
  return (cache[key] = canvasTex(256, 256, (g, w, h) => {
    if (kind === 'P') {
      g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#1d5fbf'; g.fillRect(10, 10, w - 20, h - 20);
      g.fillStyle = '#fff'; g.font = 'bold 190px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('P', w / 2, h / 2 + 10);
    } else if (kind === 'stop') {
      g.fillStyle = '#c8102e'; g.beginPath();
      for (let i = 0; i < 8; i++) { const a = Math.PI / 8 + (i * Math.PI) / 4; g.lineTo(128 + 124 * Math.cos(a), 128 + 124 * Math.sin(a)); }
      g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 8; g.stroke();
      g.fillStyle = '#fff'; g.font = 'bold 72px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('STOP', 128, 132);
    } else if (kind === 'speed') {
      g.fillStyle = '#fff'; g.beginPath(); g.arc(128, 128, 124, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#c8102e'; g.lineWidth = 26; g.beginPath(); g.arc(128, 128, 108, 0, Math.PI * 2); g.stroke();
      g.fillStyle = '#111'; g.font = 'bold 110px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 128, 136);
    } else if (kind === 'oneway') {
      g.fillStyle = '#1d5fbf'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#fff'; g.beginPath(); g.moveTo(128, 24); g.lineTo(200, 110); g.lineTo(150, 110); g.lineTo(150, 232); g.lineTo(106, 232); g.lineTo(106, 110); g.lineTo(56, 110); g.closePath(); g.fill();
    }
  }));
}
