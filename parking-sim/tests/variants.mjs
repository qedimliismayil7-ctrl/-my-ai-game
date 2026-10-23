// Geniş yoxlama: məşq variantlarının (yer eni, zolaq, boşluq, qonşu ölçüsü) hamısı bir hərəkətlə fiziki mümkündürmü?
// npm run test:variants — 432 kombinasiya, təlimatçının hesabladığı yolla toqquşmasız keçilməlidir.
import { makeLevel } from '../src/levels.js';
import { runLevel } from './autopilot.mjs';
let bad = 0, n = 0;
for (const id of [1, 2, 3, 4]) for (const W of [2.5, 2.7, 2.9]) for (const laneOff of [-0.35, 0, 0.35]) for (const gap of [6.7, 7.8]) for (const seed of [1, 2, 3, 4, 5, 6]) {
  n++;
  const r = runLevel(makeLevel(id, { seed: seed * 101, W, laneOff, gap, latOff: laneOff * 0.7, vary: true, shift: 0 }));
  if (!r.res.passed) { bad++; console.log('✗', id, W, laneOff, gap, seed, r.res.fails.join(' ')); }
}
console.log(`${n - bad} / ${n} variant keçildi`);
if (bad) process.exit(1);
