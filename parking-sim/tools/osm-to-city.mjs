// OpenStreetMap faylını (XML .osm və ya Overpass JSON) oyunun şəhər formatına çevirir.
// İstifadə: node tools/osm-to-city.mjs map.osm data/narimanov.json "Bakı — Nərimanov"
// Koordinatlar: mərkəzə görə metr; x = şərq, z = cənub (şimal −z). Asılılıq yoxdur.
import { readFileSync, writeFileSync } from 'node:fs';

const [, , inFile, outFile, title = 'Şəhər'] = process.argv;
if (!inFile || !outFile) {
  console.error('İstifadə: node tools/osm-to-city.mjs <giriş.osm|json> <çıxış.json> [ad]');
  process.exit(1);
}

// ---------- Oxuma ----------
function parseXml(text) {
  const nodes = new Map(), ways = [];
  const attrs = (s) => Object.fromEntries([...s.matchAll(/(\w+)="([^"]*)"/g)].map((m) => [m[1], unescape(m[2])]));
  const tagsOf = (body) => Object.fromEntries([...body.matchAll(/<tag\s+k="([^"]*)"\s+v="([^"]*)"\s*\/>/g)].map((m) => [unescape(m[1]), unescape(m[2])]));
  for (const m of text.matchAll(/<node\s([^>]*?)(\/>|>([\s\S]*?)<\/node>)/g)) {
    const a = attrs(m[1]);
    nodes.set(a.id, { lat: +a.lat, lon: +a.lon, tags: m[3] ? tagsOf(m[3]) : {} });
  }
  for (const m of text.matchAll(/<way\s([^>]*?)>([\s\S]*?)<\/way>/g)) {
    const a = attrs(m[1]);
    ways.push({ id: a.id, nodes: [...m[2].matchAll(/<nd\s+ref="(\d+)"/g)].map((x) => x[1]), tags: tagsOf(m[2]) });
  }
  return { nodes, ways };
}
function unescape(s) {
  return s.replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}
function parseJson(text) {
  const j = JSON.parse(text);
  const nodes = new Map(), ways = [];
  for (const e of j.elements) {
    if (e.type === 'node') nodes.set(String(e.id), { lat: e.lat, lon: e.lon, tags: e.tags || {} });
    if (e.type === 'way') ways.push({ id: String(e.id), nodes: e.nodes.map(String), tags: e.tags || {} });
  }
  return { nodes, ways };
}

const raw = readFileSync(inFile, 'utf8');
const { nodes, ways } = raw.trimStart().startsWith('{') ? parseJson(raw) : parseXml(raw);

// ---------- Proyeksiya ----------
let latMin = Infinity, latMax = -Infinity, lonMin = Infinity, lonMax = -Infinity;
const bounds = raw.match(/<bounds\s+minlat="([\d.-]+)"\s+minlon="([\d.-]+)"\s+maxlat="([\d.-]+)"\s+maxlon="([\d.-]+)"/);
if (bounds) [latMin, lonMin, latMax, lonMax] = bounds.slice(1).map(Number);
else for (const n of nodes.values()) { latMin = Math.min(latMin, n.lat); latMax = Math.max(latMax, n.lat); lonMin = Math.min(lonMin, n.lon); lonMax = Math.max(lonMax, n.lon); }
const lat0 = (latMin + latMax) / 2, lon0 = (lonMin + lonMax) / 2;
const MY = 111320, MX = 111320 * Math.cos((lat0 * Math.PI) / 180);
const proj = (n) => [+((n.lon - lon0) * MX).toFixed(2), +(-(n.lat - lat0) * MY).toFixed(2)];
const halfX = ((lonMax - lonMin) / 2) * MX, halfZ = ((latMax - latMin) / 2) * MY;

// ---------- Yollar ----------
// Avtomobil yolları; zolaq sayı OSM-də yoxdursa, növünə görə təxmini (est: true)
// Zolaq sayı OSM-də yoxdursa, növünə görə təxmini götürülür (lanesEst: true).
// Sürət həddi: OSM-də maxspeed yoxdursa — Azərbaycanda yaşayış məntəqələri üçün ümumi hədd 60 km/saat,
// yaşayış zonası (living_street) üçün 20 km/saat (speedEst: true).
const ROAD = {
  motorway: { lanes: 6 }, trunk: { lanes: 6 }, primary: { lanes: 4 }, secondary: { lanes: 4 }, tertiary: { lanes: 2 },
  unclassified: { lanes: 2 }, residential: { lanes: 2 }, living_street: { lanes: 1, speed: 20 }, service: { lanes: 1 },
  motorway_link: { lanes: 1 }, trunk_link: { lanes: 1 }, primary_link: { lanes: 1 }, secondary_link: { lanes: 1 }, tertiary_link: { lanes: 1 },
};
const LANE_W = 3.3; // m (təxmini)
const URBAN_LIMIT = 60; // Azərbaycan: yaşayış məntəqələrində ümumi hədd

function parseSpeed(v) {
  if (!v) return null;
  const m = String(v).match(/(\d+)/);
  if (!m) return null;
  return /mph/.test(v) ? Math.round(+m[1] * 1.609) : +m[1];
}

const roads = [];
const nodeUse = new Map();
for (const w of ways) {
  const t = w.tags;
  const def = ROAD[t.highway];
  if (!def || t.area === 'yes' || t.access === 'private' || t.service === 'parking_aisle') continue;
  const pts = w.nodes.map((id) => nodes.get(id)).filter(Boolean);
  if (pts.length < 2) continue;
  const oneway = t.oneway === 'yes' || t.oneway === '1' || t.junction === 'roundabout' || t.highway === 'motorway' ? 1 : t.oneway === '-1' ? -1 : 0;
  let ids = w.nodes.filter((id) => nodes.has(id));
  if (oneway === -1) ids = ids.reverse();
  const lanesTag = parseInt(t.lanes, 10);
  const lanes = lanesTag > 0 ? lanesTag : (oneway ? Math.max(1, Math.ceil(def.lanes / 2)) : def.lanes);
  const sp = parseSpeed(t.maxspeed);
  roads.push({
    id: w.id,
    name: t['name:az'] || t.name || '',
    type: t.highway,
    nodes: ids,
    pts: ids.map((id) => proj(nodes.get(id))),
    oneway: oneway !== 0,
    lanes,
    lanesEst: !(lanesTag > 0),
    width: +(t.width && parseFloat(t.width) > 2 ? parseFloat(t.width) : lanes * LANE_W).toFixed(1),
    maxspeed: sp || def.speed || URBAN_LIMIT,
    speedEst: !sp,
    roundabout: t.junction === 'roundabout',
    bridge: t.bridge === 'yes',
    tunnel: t.tunnel === 'yes',
    layer: parseInt(t.layer || '0', 10) || 0,
  });
  for (const id of ids) nodeUse.set(id, (nodeUse.get(id) || 0) + 1);
}

// ---------- Nöqtə obyektləri: svetofor, nişanlar, keçidlər ----------
const signals = [], signs = [], crossings = [];
const used = (id) => nodeUse.has(id);
for (const [id, n] of nodes) {
  const t = n.tags;
  if (!used(id)) continue;
  const [x, z] = proj(n);
  if (t.highway === 'traffic_signals' || t.crossing === 'traffic_signals') signals.push({ id, x, z, crossing: t.highway === 'crossing' });
  if (t.highway === 'stop') signs.push({ id, x, z, type: 'stop' });
  if (t.highway === 'give_way') signs.push({ id, x, z, type: 'give_way' });
  if (t.highway === 'crossing' || t.railway === 'crossing') crossings.push({ id, x, z, signals: t.crossing === 'traffic_signals' });
  if (t.traffic_sign) signs.push({ id, x, z, type: 'tag', value: t.traffic_sign });
}

// ---------- Binalar ----------
const buildings = [];
for (const w of ways) {
  const t = w.tags;
  if (!t.building) continue;
  const pts = w.nodes.map((id) => nodes.get(id)).filter(Boolean).map(proj);
  if (pts.length < 4) continue;
  const levels = parseFloat(t['building:levels']);
  const h = parseFloat(t.height) || (levels > 0 ? levels * 3.2 : null);
  buildings.push({ pts: pts.slice(0, -1), h: h ? +h.toFixed(1) : null, hEst: !h });
}

// ---------- Yaşıllıq və su (vizual) ----------
const areas = [];
for (const w of ways) {
  const t = w.tags;
  const kind = t.leisure === 'park' || t.landuse === 'grass' || t.landuse === 'forest' || t.natural === 'wood' ? 'green' : t.natural === 'water' ? 'water' : null;
  if (!kind) continue;
  const pts = w.nodes.map((id) => nodes.get(id)).filter(Boolean).map(proj);
  if (pts.length >= 4) areas.push({ kind, pts: pts.slice(0, -1) });
}

const out = {
  title,
  source: 'OpenStreetMap töhfəçiləri (ODbL) — https://www.openstreetmap.org/copyright',
  center: { lat: +lat0.toFixed(6), lon: +lon0.toFixed(6) },
  bounds: { minlat: latMin, minlon: lonMin, maxlat: latMax, maxlon: lonMax },
  half: [+halfX.toFixed(0), +halfZ.toFixed(0)],
  defaults: { laneWidth: LANE_W, urbanLimit: URBAN_LIMIT },
  roads, signals, signs, crossings, buildings, areas,
};
writeFileSync(outFile, JSON.stringify(out));
console.log(`${outFile}: ${roads.length} yol, ${signals.length} svetofor, ${signs.length} nişan, ${crossings.length} keçid, ${buildings.length} bina, ${areas.length} sahə; ${(JSON.stringify(out).length / 1024).toFixed(0)} KB`);
