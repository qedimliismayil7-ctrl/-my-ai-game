// Qiymətləndirmə — ABŞ sürücülük imtahanının (DMV) məntiqinə yaxın:
// "kritik səhv" (toqquşma, xəttdən çox çıxma, səhv istiqamət) dərhal "keçmədi" deməkdir,
// digər səhvlər bal azaldır. İmtahan rejimində tələblər daha ciddidir.
import { CAR, DEG, carBox, obbCorners, toLocal, wrapAngle } from './physics.js';

const CORNERS = ['sol ön', 'sağ ön', 'sağ arxa', 'sol arxa'];

export function evaluate(level, car, stats, mode = 'learn') {
  const exam = mode === 'exam';
  const t = level.target;
  const tc = { x: t.x, z: t.z, h: t.h };
  const corners = obbCorners(carBox(car.x, car.z, car.h));
  let maxOut = 0, worst = 0;
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

  const c = toLocal(car.x + Math.sin(car.h) * CAR.centerOffset, car.z + Math.cos(car.h) * CAR.centerOffset, tc);
  const fails = [];
  const notes = [];
  let score = 100;
  const minus = (p, text) => { if (p >= 0.5) { score -= p; notes.push(`−${Math.round(p)} ${text}`); } };

  // Kritik səhvlər
  if (stats.collisions > 0) fails.push(`Toqquşma (${stats.collisions}). İmtahanda bu, dərhal “keçmədi”dir.`);
  if (wrongWay) fails.push(level.id === 2 ? 'Arxa ilə yox, irəli ilə park edilib.' : 'Maşın səhv istiqamətdə dayanıb.');
  const outFail = t.zone ? 0.02 : 0.3;
  if (maxOut > outFail) fails.push(`${t.zone ? 'Öz zolağınızda deyil' : 'Xəttdən çox kənar'}: ${CORNERS[worst]} künc ${(maxOut * 100).toFixed(0)} sm.`);
  const angleFail = t.angleTol || (exam ? 7 : 10);
  if (!wrongWay && angleErr > angleFail) fails.push(`Bucaq xətası ${angleErr.toFixed(1)}° (hədd ${angleFail}°).`);
  if (exam && stats.time > level.par.time * 2) fails.push(`Vaxt həddi keçildi (${Math.round(stats.time)} san > ${level.par.time * 2}).`);
  if (exam && stats.moves > level.par.moves + 2) fails.push(`Çox manevr: ${stats.moves} (hədd ${level.par.moves + 2}).`);
  if (exam && stats.maxSpeed > 11) fails.push(`Park üçün təhlükəli sürət: ${stats.maxSpeed.toFixed(0)} km/saat.`);

  // Bal itirən səhvlər
  if (!inside && maxOut <= outFail) minus(10, `Xəttə toxunub: ${CORNERS[worst]} künc ${(maxOut * 100).toFixed(0)} sm.`);
  if (stats.curbHits) minus(stats.curbHits * (exam ? 15 : 10), `Bordürə toxunma: ${stats.curbHits}.`);
  if (!wrongWay) minus(Math.max(0, angleErr - 3) * 1.5, `Bucaq xətası ${angleErr.toFixed(1)}°.`);
  if (!t.zone) {
    const lat = Math.abs(c.lx);
    minus(Math.max(0, lat - 0.25) * 30, `Mərkəzdən yana ${(lat * 100).toFixed(0)} sm.`);
  }
  let curbDist = null;
  if (t.curbZ !== undefined) {
    curbDist = Math.max(0, t.curbZ - Math.max(...corners.map(([, z]) => z)));
    if (curbDist > 0.45) fails.push(`Bordürdən çox uzaq: ${(curbDist * 100).toFixed(0)} sm (hədd ≈ 45 sm / 18 düym).`);
    else if (curbDist > 0.3) minus(10, `Bordürə ${(curbDist * 100).toFixed(0)} sm (12 düymdən — 30 sm-dən çox).`);
  }
  const extra = Math.max(0, stats.moves - level.par.moves);
  minus(extra * (exam ? 10 : 5), `Əlavə manevr: ${extra}.`);
  if (!stats.signaled) minus(5, 'Siqnal verilmədi.');
  if (stats.reversed && !stats.lookedBack) minus(exam ? 10 : 5, 'Geri gedərkən çiyin üstündən baxılmadı (B / 👀).');
  if (stats.gearAbuse) minus(stats.gearAbuse * 5, `Hərəkətdə ötürmə dəyişmək cəhdi: ${stats.gearAbuse}.`);
  const over = Math.max(0, stats.time - level.par.time);
  minus(Math.min(10, over * 0.2), `Vaxt ${Math.round(stats.time)} san (norma ${level.par.time}).`);
  if (!exam && stats.maxSpeed > 11) minus(5, `Sürət ${stats.maxSpeed.toFixed(0)} km/saat.`);

  const passed = fails.length === 0;
  score = Math.max(0, Math.min(100, Math.round(score)));
  if (!passed) score = Math.min(score, 40);
  const stars = !passed ? 0 : score >= 90 ? 3 : score >= 75 ? 2 : 1;
  if (passed && notes.length === 0) notes.push('Səhv yoxdur — mükəmməl park.');
  return { passed, inside, maxOut, angleErr, wrongWay, lateral: c.lx, curbDist, score, stars, fails, notes };
}

// Hədəfə qismən də olsa daxil olubmu (P-də avtomatik yoxlama üçün)
export function overlapsTarget(level, car) {
  const t = level.target;
  let n = 0;
  for (const [x, z] of obbCorners(carBox(car.x, car.z, car.h))) {
    const { lx, lz } = toLocal(x, z, t);
    if (Math.abs(lx) < t.w / 2 + 0.3 && Math.abs(lz) < t.l / 2 + 0.3) n++;
  }
  return n >= 3;
}
