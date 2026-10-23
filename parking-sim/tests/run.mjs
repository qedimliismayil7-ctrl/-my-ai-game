// npm test: Öyrənmə rejimində hər səviyyə + Məşq rejiminin təsadüfi variantları təlimatçı ilə keçilməlidir.
import { LEVELS, makeLevel, randomVariant } from '../src/levels.js';
import { runLevel } from './autopilot.mjs';

let failed = 0;
const line = (name, r) => {
  const ok = r.done && r.res.passed;
  if (!ok) failed++;
  console.log(`${ok ? '✓' : '✗'} ${name}: bal ${r.res.score}, ulduz ${r.res.stars}, bucaq ${r.res.angleErr.toFixed(1)}°, yana ${(r.res.lateral * 100).toFixed(0)} sm${r.hits.length ? ', toqquşma ' + r.hits.join(' ') : ''}${ok ? '' : ' — ' + r.res.fails.join(' ')}`);
};
for (const lv of LEVELS) line(`L${lv.id} ${lv.name}`, runLevel(lv));
// Məşq: hər səviyyə üçün 10 təsadüfi variant (yer eni, zolaq, boşluq, qonşu maşın ölçüsü dəyişir) (sabit toxumla təkrarlanan)
let seed = 12345;
Math.random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
for (const lv of LEVELS) for (let k = 0; k < 10; k++) {
  const v = randomVariant(lv.id);
  const info = lv.id === 3 ? `boşluq ${v.gap} m, yan ${(v.latOff * 100).toFixed(0)} sm` : lv.id === 5 ? `küçə ${(v.half * 2).toFixed(1)} m` : `yer eni ${v.W} m, zolaq ${(v.laneOff * 100).toFixed(0)} sm`;
  line(`L${lv.id} məşq #${k + 1} (${info}, start ${v.startJitter >= 0 ? '+' : ''}${v.startJitter} m)`, runLevel(makeLevel(lv.id, v)));
}
if (failed) { console.error(`\n${failed} yoxlama keçilmədi`); process.exit(1); }
console.log('\nHamısı keçildi.');
