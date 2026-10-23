// SÜNİ test xəritəsi (real Bakı deyil): şəbəkə, prospekt, birtərəfli küçə, svetofor, keçid, bina.
// Yalnız çeviricini və şəhər rejimini testlə yoxlamaq üçündür.
import { writeFileSync } from 'node:fs';
const lat0 = 40.0, lon0 = 49.0, dLat = 200 / 111320, dLon = 200 / (111320 * Math.cos(lat0 * Math.PI / 180));
let xml = `<?xml version="1.0"?>\n<osm version="0.6">\n<bounds minlat="${lat0 - 0.0005}" minlon="${lon0 - 0.0005}" maxlat="${lat0 + 3 * dLat + 0.0005}" maxlon="${lon0 + 3 * dLon + 0.0005}"/>\n`;
const id = (i, j) => 1000 + i * 10 + j;
for (let i = 0; i <= 3; i++) for (let j = 0; j <= 3; j++) {
  const tags = (i === 1 && j === 1) || (i === 2 && j === 1) ? '<tag k="highway" v="traffic_signals"/>' : '';
  xml += `<node id="${id(i, j)}" lat="${lat0 + i * dLat}" lon="${lon0 + j * dLon}">${tags}</node>\n`;
}
xml += `<node id="5001" lat="${lat0 + 1.5 * dLat}" lon="${lon0 + 1 * dLon}"><tag k="highway" v="crossing"/></node>\n`;
let w = 1;
// prospekt (şərq-qərb), i = 1
xml += `<way id="${w++}">${[0, 1, 2, 3].map((j) => `<nd ref="${id(1, j)}"/>`).join('')}<tag k="highway" v="primary"/><tag k="lanes" v="4"/><tag k="maxspeed" v="60"/><tag k="name" v="Test prospekti"/></way>\n`;
for (const i of [0, 2, 3]) xml += `<way id="${w++}">${[0, 1, 2, 3].map((j) => `<nd ref="${id(i, j)}"/>`).join('')}<tag k="highway" v="residential"/><tag k="name" v="Küçə ${i}"/></way>\n`;
// şimal-cənub küçələri; j = 2 birtərəfli
for (const j of [0, 1, 2, 3]) {
  const refs = j === 1 ? [`<nd ref="${id(0, 1)}"/>`, `<nd ref="${id(1, 1)}"/>`, `<nd ref="5001"/>`, `<nd ref="${id(2, 1)}"/>`, `<nd ref="${id(3, 1)}"/>`] : [0, 1, 2, 3].map((i) => `<nd ref="${id(i, j)}"/>`);
  xml += `<way id="${w++}">${refs.join('')}<tag k="highway" v="${j === 1 ? 'secondary' : 'residential'}"/>${j === 2 ? '<tag k="oneway" v="yes"/>' : ''}<tag k="name" v="Yol ${j}"/></way>\n`;
}
// bina
const bl = [[0.3, 0.3], [0.3, 0.7], [0.7, 0.7], [0.7, 0.3]];
bl.forEach(([a, b], k) => { xml += `<node id="${9000 + k}" lat="${lat0 + a * dLat}" lon="${lon0 + b * dLon}"/>\n`; });
xml += `<way id="${w++}"><nd ref="9000"/><nd ref="9001"/><nd ref="9002"/><nd ref="9003"/><nd ref="9000"/><tag k="building" v="yes"/><tag k="building:levels" v="9"/></way>\n`;
xml += '</osm>\n';
writeFileSync(new URL('./fixtures/grid.osm', import.meta.url), xml);
console.log('tests/fixtures/grid.osm yazıldı');
