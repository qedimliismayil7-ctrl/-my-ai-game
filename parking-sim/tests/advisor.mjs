// Təlimatçının səhvə uyğun izahları: konkret künc və düzəliş məsləhəti
import { CAR } from '../src/physics.js';
import { advise } from '../src/advisor.js';
let failed = 0;
const check = (name, ok, info = '') => { console.log(`${ok ? '✓' : '✗'} ${name}${info ? ' — ' + info : ''}`); if (!ok) failed++; };
const car = (x, z, h, extra = {}) => ({ type: 'car', name: 'maşın', cx: x, cz: z, h, hw: 0.93, hl: 2.4, ...extra });

// 1) irəli, tam sağa dönür, sağda (−X) yanında maşın — arxa sağ tərəf içəri kəsir → "tez döndünüz"
{
  const obs = [car(-CAR.width / 2 - 0.93 - 0.55, 1.0, 0)];
  const a = advise({ pose: { x: 0, z: 0, h: 0 }, v: 0.8, delta: -0.62, gear: 'D', steer: 1, obstacles: obs });
  check('irəli sağa dönərkən sağdakı maşın: tez dönmə izahı', a && /Tez döndünüz/.test(a.why), a ? `${a.text} | ${a.why}` : 'null');
}
// 2) geri düz, arxada maşın 20 sm → DAYANIN arxa bamper
{
  const obs = [car(0, -CAR.rearOverhang - 0.2 - 2.4, 0)];
  const a = advise({ pose: { x: 0, z: 0, h: 0 }, v: -0.5, delta: 0, gear: 'R', steer: 0, obstacles: obs });
  check('geri: arxada 20 sm — dayan, irəli çıxıb düzəlt', a && a.level === 'danger' && /arxa/.test(a.text) && /irəli/.test(a.why), a ? `${a.text} | ${a.why}` : 'null');
}
// 3) geri, tam sağ sükan: ön sol künc solda duran maşına açılır
{
  const fz = CAR.wheelbase + CAR.frontOverhang;
  const obs = [car(CAR.width / 2 + 0.93 + 0.3, fz + 2.4 - 0.6, 0)];
  const a = advise({ pose: { x: 0, z: 0, h: 0 }, v: -0.5, delta: -0.62, gear: 'R', steer: 1, obstacles: obs });
  check('geri dönərkən ön künc yana açılır', a && /ön sol künc/.test(a.text) && /yana açılır/.test(a.why), a ? `${a.text} | ${a.why}` : 'null');
}
// 4) maneə yoxdursa — susur
{
  const a = advise({ pose: { x: 0, z: 0, h: 0 }, v: 0.8, delta: 0, gear: 'D', steer: 0, obstacles: [] });
  check('boş yerdə izah yoxdur', a === null);
}
// 5) tez dönmə: təlimatçı hələ düz getməyi deyir
{
  const a = advise({ pose: { x: 0, z: 0, h: 0 }, v: 0.8, delta: -0.4, gear: 'D', steer: 0.6, obstacles: [], step: { check: 'goto' }, rem: 1.2 });
  check('dönmə nöqtəsinə çatmamış sükan: "tez dönürsünüz"', a && /Tez dönürsünüz/.test(a.text), a?.text);
}
if (failed) { console.error(`${failed} izah testi keçilmədi`); process.exit(1); }
console.log('İzah testləri keçildi.');
