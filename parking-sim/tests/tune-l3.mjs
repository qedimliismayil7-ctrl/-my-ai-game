// Paralel park üçün təlimatçının parametrlərini seçir: hər namizəd 3 variantda (boşluq yeri) yoxlanılır.
import { makeLevel } from '../src/levels.js';
import { runLevel } from './autopilot.mjs';
const out = [];
for (const lat of [0.6, 0.8, 1.0]) for (const s0 of [-0.6, -0.3, 0, 0.3]) for (const th of [40, 45, 50]) for (const back of [0, 0.4, 0.8, 1.2]) {
  let worst = 100, ok = true, sumCurb = 0;
  for (const shift of [0, -1, 1]) {
    const r = runLevel(makeLevel(3, { shift }, { lat, s0, th, back }));
    if (!r.done || !r.res.passed) { ok = false; break; }
    worst = Math.min(worst, r.res.score); sumCurb += r.res.curbDist;
  }
  if (ok) out.push({ lat, s0, th, back, worst, curb: +(sumCurb / 3).toFixed(2) });
}
out.sort((a, b) => b.worst - a.worst || Math.abs(a.curb - 0.2) - Math.abs(b.curb - 0.2));
console.log(out.slice(0, 10));
