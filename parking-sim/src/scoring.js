// Qiymətləndirmə: maşın xəttin içindədirmi, bucaq xətası, toqquşmalar, vaxt, manevr sayı.
import { CAR, DEG, carBox, obbCorners, toLocal, wrapAngle } from './physics.js';

export function evaluate(level, car, stats) {
  const t = level.target;
  const corners = obbCorners(carBox(car.x, car.z, car.h));
  const tc = { x: t.x, z: t.z, h: t.h };
  let maxOut = 0;
  let worst = -1;
  corners.forEach(([x, z], i) => {
    const { lx, lz } = toLocal(x, z, tc);
    const out = Math.max(Math.abs(lx) - t.w / 2, 0, Math.abs(lz) - t.l / 2);
    if (out > maxOut) { maxOut = out; worst = i; }
  });
  const inside = maxOut < 0.02;

  let angleErr = Math.abs(wrapAngle(car.h - t.h)) / DEG;
  let wrongWay = false;
  if (!t.strict) angleErr = Math.min(angleErr, 180 - angleErr);
  else if (angleErr > 90) wrongWay = true;

  const cx = car.x + Math.sin(car.h) * CAR.centerOffset;
  const cz = car.z + Math.cos(car.h) * CAR.centerOffset;
  const c = toLocal(cx, cz, tc);
  const notes = [];
  let score = 100;
  const angleTol = t.angleTol || 10;

  // Uğur şərtləri
  let passed = inside && !wrongWay && angleErr <= angleTol;
  if (!inside) {
    const names = ['sol ön', 'sağ ön', 'sağ arxa', 'sol arxa'];
    notes.push(`✗ Maşın xəttdən kənara çıxıb: ${names[worst]} künc ${(maxOut * 100).toFixed(0)} sm kənarda.`);
  }
  if (wrongWay) notes.push(level.id === 2 ? '✗ Maşın arxa ilə yox, irəli ilə park olunub.' : '✗ Maşın səhv istiqamətdə dayanıb.');
  else if (angleErr > angleTol) notes.push(`✗ Bucaq xətası çox böyükdür: ${angleErr.toFixed(1)}°.`);

  // Xallar
  if (stats.collisions > 0) {
    score -= stats.collisions * 15;
    notes.push(`− Toqquşma: ${stats.collisions} dəfə (hər biri −15). Real həyatda bu, sığorta hadisəsidir!`);
  }
  if (stats.curbHits > 0) {
    score -= stats.curbHits * 8;
    notes.push(`− Bordürə toxunma: ${stats.curbHits} dəfə (−8).`);
  }
  const extraMoves = Math.max(0, stats.moves - level.par.moves);
  if (extraMoves) {
    score -= extraMoves * 5;
    notes.push(`− Manevr sayı ${stats.moves} (norma ${level.par.moves}): −${extraMoves * 5}.`);
  }
  if (!wrongWay) {
    const aPen = Math.max(0, angleErr - 1.5) * 2.5;
    if (aPen > 0.5) { score -= aPen; notes.push(`− Bucaq xətası ${angleErr.toFixed(1)}°: −${aPen.toFixed(0)}.`); }
  }
  if (!t.zone) {
    const lat = Math.abs(c.lx);
    if (lat > 0.15) {
      const p = (lat - 0.15) * 40;
      score -= p;
      notes.push(`− Mərkəzdən yana sürüşmə ${(lat * 100).toFixed(0)} sm: −${p.toFixed(0)}.`);
    }
  }
  if (t.curbZ !== undefined) {
    const side = Math.max(...corners.map(([, z]) => z));
    const curbDist = t.curbZ - side;
    if (curbDist > 0.3) {
      const p = Math.min(25, (curbDist - 0.3) * 60);
      score -= p;
      notes.push(`− Bordürə məsafə ${(curbDist * 100).toFixed(0)} sm (ideal 20–30 sm): −${p.toFixed(0)}.`);
    } else {
      notes.push(`✓ Bordürə məsafə ${(Math.max(0, curbDist) * 100).toFixed(0)} sm — əla.`);
    }
  }
  const overTime = Math.max(0, stats.time - level.par.time);
  if (overTime > 0) {
    const p = Math.min(15, overTime * 0.25);
    score -= p;
    notes.push(`− Vaxt ${stats.time.toFixed(0)} san (norma ${level.par.time}): −${p.toFixed(0)}.`);
  }
  if (!stats.signaled) {
    score -= 5;
    notes.push(`− Dönmə siqnalı verilmədi (−5). Real yolda bu, cərimədir.`);
  }
  if (stats.maxSpeed > 11) {
    score -= 5;
    notes.push(`− Park üçün çox sürətli: ${stats.maxSpeed.toFixed(0)} km/saat (−5).`);
  }
  if (passed && notes.length === 0) notes.push('✓ Mükəmməl park! Heç bir səhv yoxdur.');

  score = Math.max(0, Math.min(100, score));
  if (!passed) score = Math.min(score, 40);
  const stars = !passed ? 0 : score >= 90 ? 3 : score >= 70 ? 2 : 1;
  return { passed, inside, maxOut, angleErr, wrongWay, lateral: c.lx, score: Math.round(score), stars, notes };
}

// Hədəfə qismən də olsa daxil olubmu (P-də avtomatik yoxlama üçün)
export function overlapsTarget(level, car) {
  const t = level.target;
  const corners = obbCorners(carBox(car.x, car.z, car.h));
  let n = 0;
  for (const [x, z] of corners) {
    const { lx, lz } = toLocal(x, z, t);
    if (Math.abs(lx) < t.w / 2 + 0.3 && Math.abs(lz) < t.l / 2 + 0.3) n++;
  }
  return n >= 3;
}
