// Şəhər yol şəbəkəsi (Three.js-siz): seqmentlər, yaxın yolun tapılması, marşrut, svetofor yanaşmaları.
// Giriş: tools/osm-to-city.mjs-in çıxışı.

const CELL = 40; // m — məkan şəbəkəsi

export class RoadNetwork {
  constructor(city) {
    this.city = city;
    this.pos = new Map(); // node id → [x, z]
    this.junction = new Map(); // node id → neçə yol keçir
    this.segs = [];
    this.adj = new Map();
    for (const r of city.roads) {
      r.nodes.forEach((id, i) => {
        this.pos.set(id, r.pts[i]);
        this.junction.set(id, (this.junction.get(id) || 0) + (i === 0 || i === r.nodes.length - 1 ? 1 : 2));
      });
      for (let i = 0; i < r.pts.length - 1; i++) {
        const [ax, az] = r.pts[i], [bx, bz] = r.pts[i + 1];
        const len = Math.hypot(bx - ax, bz - az);
        if (len < 0.01) continue;
        const seg = { road: r, i, a: r.nodes[i], b: r.nodes[i + 1], ax, az, bx, bz, len, dx: (bx - ax) / len, dz: (bz - az) / len, halfW: r.width / 2 };
        this.segs.push(seg);
        this.link(seg.a, seg.b, len, seg, 1);
        if (!r.oneway) this.link(seg.b, seg.a, len, seg, -1);
      }
    }
    // məkan şəbəkəsi
    this.grid = new Map();
    this.segs.forEach((s, k) => {
      const pad = s.halfW + 2;
      const x0 = Math.floor((Math.min(s.ax, s.bx) - pad) / CELL), x1 = Math.floor((Math.max(s.ax, s.bx) + pad) / CELL);
      const z0 = Math.floor((Math.min(s.az, s.bz) - pad) / CELL), z1 = Math.floor((Math.max(s.az, s.bz) + pad) / CELL);
      for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
        const key = x + ',' + z;
        if (!this.grid.has(key)) this.grid.set(key, []);
        this.grid.get(key).push(k);
      }
    });
    this.approaches = this.buildApproaches();
  }

  link(from, to, len, seg, dir) {
    if (!this.adj.has(from)) this.adj.set(from, []);
    this.adj.get(from).push({ to, len, seg, dir });
  }

  segsNear(x, z) {
    return (this.grid.get(Math.floor(x / CELL) + ',' + Math.floor(z / CELL)) || []).map((k) => this.segs[k]);
  }

  // Maşının mövqeyini yola bağla. h — maşının bucağı (irəli = sin h, cos h).
  match(x, z, h) {
    const fx = Math.sin(h), fz = Math.cos(h);
    let best = null;
    for (const s of this.segsNear(x, z)) {
      const px = x - s.ax, pz = z - s.az;
      const t = Math.max(0, Math.min(s.len, px * s.dx + pz * s.dz));
      const cx = s.ax + s.dx * t, cz = s.az + s.dz * t;
      const d = Math.hypot(x - cx, z - cz);
      const align = fx * s.dx + fz * s.dz;
      // eyni məsafədə istiqaməti uyğun gələn seqmentə üstünlük
      const score = d - Math.abs(align) * 0.5;
      if (!best || score < best.score) {
        const lateral = px * s.dz - pz * s.dx; // + : seqment istiqamətinə görə sol tərəf
        best = { seg: s, d, t, lateral, align, score, onRoad: d <= s.halfW + 0.3 };
      }
    }
    return best;
  }

  nearestNode(x, z, filter = null) {
    let best = null, bd = Infinity;
    for (const [id, [nx, nz]] of this.pos) {
      if (filter && !filter(id)) continue;
      const d = Math.hypot(nx - x, nz - z);
      if (d < bd) { bd = d; best = id; }
    }
    return best;
  }

  // Dijkstra (birtərəfli yollara əməl edir)
  route(from, to) {
    const dist = new Map([[from, 0]]), prev = new Map(), done = new Set();
    const open = [[0, from]];
    while (open.length) {
      open.sort((a, b) => a[0] - b[0]);
      const [d, u] = open.shift();
      if (done.has(u)) continue;
      done.add(u);
      if (u === to) break;
      for (const e of this.adj.get(u) || []) {
        const nd = d + e.len;
        if (nd < (dist.get(e.to) ?? Infinity)) { dist.set(e.to, nd); prev.set(e.to, u); open.push([nd, e.to]); }
      }
    }
    if (!dist.has(to)) return null;
    const path = [to];
    while (path[0] !== from) path.unshift(prev.get(path[0]));
    return { nodes: path, length: dist.get(to) };
  }

  // Svetofor yanaşmaları: hər svetofor nöqtəsinə gələn hər istiqamət üçün dayanma xətti
  buildApproaches() {
    const out = [];
    const sigIds = new Set(this.city.signals.map((s) => s.id));
    for (const r of this.city.roads) {
      r.nodes.forEach((id, i) => {
        if (!sigIds.has(id)) return;
        const [nx, nz] = r.pts[i];
        const dirs = [];
        if (i > 0) dirs.push(r.pts[i - 1]); // irəli istiqamətdə gələn
        if (!r.oneway && i < r.nodes.length - 1) dirs.push(r.pts[i + 1]); // əks istiqamətdə gələn
        for (const [px, pz] of dirs) {
          const len = Math.hypot(nx - px, nz - pz);
          if (len < 3) continue;
          const dx = (nx - px) / len, dz = (nz - pz) / len;
          // dayanma xətti: kəsişən yolun yarı eni + 2 m qabaqda (təxmini)
          const cross = this.crossHalfWidth(id, r);
          const back = Math.min(len - 1, cross + 2);
          out.push({ signal: id, road: r, x: nx - dx * back, z: nz - dz * back, dx, dz, halfW: r.width / 2, oneway: r.oneway, group: Math.abs(dz) >= Math.abs(dx) ? 0 : 1, offset: hash(id) % 20 });
        }
      });
    }
    return out;
  }

  crossHalfWidth(id, self) {
    let w = 4;
    for (const r of this.city.roads) if (r !== self && r.nodes.includes(id)) w = Math.max(w, r.width / 2);
    return w;
  }
}

function hash(s) {
  let h = 0;
  for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) | 0;
  return Math.abs(h);
}

// Svetofor fazası: 0-cı qrup (şimal-cənub) yaşıl 22 san, sarı 3, hamısı qırmızı 2; sonra 1-ci qrup
export const SIGNAL_CYCLE = { green: 22, yellow: 3, allRed: 2 };
export function signalState(ap, time) {
  const { green, yellow, allRed } = SIGNAL_CYCLE;
  const half = green + yellow + allRed;
  const t = (time + ap.offset) % (half * 2);
  const mine = ap.group === 0 ? t : (t + half) % (half * 2);
  if (mine < green) return 'green';
  if (mine < green + yellow) return 'yellow';
  return 'red';
}

// Marşrutda növbəti dönüş: { dist, turn: 'left'|'right'|'straight'|'arrive', name }
export function nextManeuver(net, routeNodes, x, z) {
  if (!routeNodes || routeNodes.length < 2) return null;
  // marşrutda maşına ən yaxın nöqtə
  let k = 0, bd = Infinity;
  routeNodes.forEach((id, i) => {
    const [nx, nz] = net.pos.get(id);
    const d = Math.hypot(nx - x, nz - z);
    if (d < bd) { bd = d; k = i; }
  });
  let dist = bd;
  for (let i = k + 1; i < routeNodes.length; i++) {
    const [ax, az] = net.pos.get(routeNodes[i - 1]);
    const [bx, bz] = net.pos.get(routeNodes[i]);
    if (i > k + 1) dist += Math.hypot(bx - ax, bz - az);
    if (i === routeNodes.length - 1) return { dist, turn: 'arrive', index: i };
    if ((net.junction.get(routeNodes[i]) || 0) < 3) continue;
    const [cx, cz] = net.pos.get(routeNodes[i + 1]);
    const a1 = Math.atan2(bx - ax, bz - az), a2 = Math.atan2(cx - bx, cz - bz);
    let d = a2 - a1;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    if (Math.abs(d) < 0.45) continue; // ~26°-dən az — düz
    const name = roadBetween(net, routeNodes[i], routeNodes[i + 1]);
    return { dist, turn: d > 0 ? 'left' : 'right', name, index: i };
  }
  return null;
}

export function roadBetween(net, a, b) {
  for (const e of net.adj.get(a) || []) if (e.to === b) return e.seg.road.name;
  return '';
}
