// Fizika testləri: kadr sürətindən asılılıq, aşağı sürət, əyləc, geri gediş, sükan, toqquşma.
import { CarPhysics, FixedStepper, CAR, DEG, carBox, obbOverlap, toWorld, ContactTracker, SPEC, collide } from '../src/physics.js';

let failed = 0;
const check = (name, ok, info = '') => { console.log(`${ok ? '✓' : '✗'} ${name}${info ? ' — ' + info : ''}`); if (!ok) failed++; };

// Eyni giriş ardıcıllığı müxtəlif kadr sürətlərində (30, 60, 144 FPS və nizamsız kadrlar)
function scenario(frameDt) {
  const car = new CarPhysics();
  car.reset({ x: 0, z: 0, h: 0 });
  car.gear = 'D';
  const st = new FixedStepper(1 / 120);
  // giriş fizika vaxtının funksiyasıdır (kadr sərhədindən asılı olmasın)
  let t = 0, sim = 0, k = 0;
  const inpAt = (q) => ({ steer: q < 3 ? 0.6 : -0.4, throttle: q > 1 && q < 4 ? 0.5 : 0, brake: q > 6 ? 0.5 : 0, clutch: 0, handbrake: false });
  while (t < 8) {
    const dt = typeof frameDt === 'function' ? frameDt(k++) : frameDt;
    st.advance(dt, (h) => { car.step(h, inpAt(sim)); sim += h; });
    t += dt;
  }
  return car;
}
const ref = scenario(1 / 120);
for (const [name, dt] of [['30 FPS', 1 / 30], ['60 FPS', 1 / 60], ['144 FPS', 1 / 144], ['nizamsız 20–90 FPS', (k) => [1 / 20, 1 / 90, 1 / 45, 1 / 60][k % 4]]]) {
  const c = scenario(dt);
  const d = Math.hypot(c.x - ref.x, c.z - ref.z);
  check(`kadr sürətindən asılı deyil (${name})`, d < 0.02 && Math.abs(c.h - ref.h) < 0.005, `fərq ${(d * 100).toFixed(1)} sm`);
}

const run = (setup, inp, time) => {
  const c = new CarPhysics();
  c.reset({ x: 0, z: 0, h: 0 });
  setup(c);
  for (let t = 0; t < time; t += 1 / 120) c.step(1 / 120, inp);
  return c;
};
const creep = run((c) => { c.gear = 'D'; }, { steer: 0, throttle: 0, brake: 0, clutch: 0 }, 6);
check('D-də qazsız sürünmə ≈ 4–5 km/saat', creep.speedKmh > 4 && creep.speedKmh < 5.2, `${creep.speedKmh.toFixed(1)} km/saat`);
const fast = run((c) => { c.gear = 'D'; }, { steer: 0, throttle: 1, brake: 0, clutch: 0 }, 8);
check('irəli maksimum ≈ 10 km/saat', fast.speedKmh > 9.5 && fast.speedKmh <= 10.05, `${fast.speedKmh.toFixed(1)} km/saat`);
const rev = run((c) => { c.gear = 'R'; }, { steer: 0, throttle: 1, brake: 0, clutch: 0 }, 8);
check('geri maksimum ≈ 7 km/saat, istiqamət geri', rev.v < 0 && rev.speedKmh <= 7.05 && rev.speedKmh > 6.5, `${rev.speedKmh.toFixed(1)} km/saat`);
{
  const c = new CarPhysics(); c.reset({ x: 0, z: 0, h: 0 }); c.gear = 'D'; c.v = 10 / 3.6;
  let d = 0;
  while (c.v > 0) { const z0 = c.z; c.step(1 / 120, { steer: 0, throttle: 0, brake: 1, clutch: 0 }); d += c.z - z0; }
  check('10 km/saatdan tam əyləc yolu < 0.7 m', d < 0.7 && d > 0.3, `${(d * 100).toFixed(0)} sm`);
  for (let i = 0; i < 240; i++) c.step(1 / 120, { steer: 0, throttle: 0, brake: 0.3, clutch: 0 });
  check('yüngül əyləclə (30%) sürünmə saxlanılır', c.v === 0);
}
{
  const c = new CarPhysics(); c.reset({ x: 0, z: 0, h: 0 }); c.gear = 'D';
  for (let i = 0; i < 120; i++) c.step(1 / 120, { steer: 1, throttle: 0, brake: 1, clutch: 0 });
  let minX = Infinity, maxX = -Infinity;
  for (let t = 0; t < 30; t += 1 / 120) { c.step(1 / 120, { steer: 1, throttle: 0, brake: 0, clutch: 0 }); minX = Math.min(minX, c.x); maxX = Math.max(maxX, c.x); }
  const R = (maxX - minX) / 2;
  check('tam sükanla arxa oxun dönmə radiusu modelə uyğun', Math.abs(R - CAR.minRadius) < 0.05, `${R.toFixed(2)} m (gözlənilən ${CAR.minRadius.toFixed(2)})`);
  check('sükan 446°-də ön təkər ≈ 36°', Math.abs(Math.abs(c.delta) / DEG - CAR.maxSteer / DEG) < 0.1 && Math.abs(c.wheelDeg) > 440, `${(Math.abs(c.delta) / DEG).toFixed(1)}°, sükan ${Math.abs(c.wheelDeg).toFixed(0)}°`);
}
{
  // divara maksimum sürətlə: içindən keçmir
  const wall = { cx: 0, cz: 6, h: 0, hw: 3, hl: 0.05, type: 'wall' };
  const c = new CarPhysics(); c.reset({ x: 0, z: 0, h: 0 }); c.gear = 'D';
  let hits = 0;
  for (let t = 0; t < 8; t += 1 / 120) if (c.step(1 / 120, { steer: 0, throttle: 1, brake: 0, clutch: 0 }, [wall])) hits++;
  check('nazik maneədən keçib getmir (tunelləmə yoxdur)', !obbOverlap(carBox(c.x, c.z, c.h), wall) && c.z + CAR.wheelbase + CAR.frontOverhang < 6.01 && hits > 0, `ön bamper z=${(c.z + CAR.wheelbase + CAR.frontOverhang).toFixed(2)} m, divar 5.95–6.05`);
}

// ---------- Real park hissi üçün əlavə yoxlamalar ----------
const H = 1 / 120;
const steady = (c, inp, sec, obs) => { let hits = 0; for (let t = 0; t < sec; t += H) if (c.step(H, inp, obs)) hits++; return hits; };
{
  // sükan ani fırlanmır: tam soldan tam sağa keçid
  const c = new CarPhysics(); c.reset({ x: 0, z: 0, h: 0 });
  let t = 0; c.steer = -1;
  while (c.steer < 0.999 && t < 5) { c.step(H, { steer: 1, throttle: 0, brake: 1, clutch: 0 }); t += H; }
  check('tam soldan tam sağa sükan ≥ 1.5 s (klaviatura/telefon)', t >= 1.5 && t < 2.2, `${t.toFixed(2)} s`);
  // buraxanda mərkəzə qayıtmır (aşağı sürətdə)
  c.gear = 'D';
  steady(c, { steer: 1, throttle: 0, brake: 0, clutch: 0 }, 1);
  check('sükan öz-özünə mərkəzə sıçramır', Math.abs(c.steer - 1) < 1e-6);
}
{
  // dönmə dairəsi: rəsmi 5.39 m radius xarici ön təkərin kənarına aiddir, arxa ox radiusu deyil
  const c = new CarPhysics(); c.reset({ x: 0, z: 0, h: 0 }); c.gear = 'D'; c.steer = 1; c.delta = -CAR.maxSteer;
  const pts = { rearAxle: [], frontOuterWheel: [], rearInnerWheel: [], frontOuterCorner: [] };
  for (let t = 0; t < 25; t += H) {
    c.step(H, { steer: 1, throttle: 0, brake: 0, clutch: 0 });
    // sağa dönür → xarici tərəf sol (+X)
    pts.rearAxle.push([c.x, c.z]);
    const fw = toWorld(CAR.track / 2 + 0.1, CAR.wheelbase, c.pose); pts.frontOuterWheel.push([fw.x, fw.z]);
    const rw = toWorld(-CAR.track / 2 + 0.1, 0, c.pose); pts.rearInnerWheel.push([rw.x, rw.z]);
    const fc = toWorld(CAR.width / 2, CAR.wheelbase + CAR.frontOverhang, c.pose); pts.frontOuterCorner.push([fc.x, fc.z]);
  }
  // dönmə mərkəzi: arxa oxun uzantısında (sağa dönəndə −X tərəfdə); sabit qalmalıdır
  const ctr = toWorld(-CAR.minRadius, 0, c.pose);
  const radius = (arr) => { const r = arr.slice(arr.length / 2).map((p) => Math.hypot(p[0] - ctr.x, p[1] - ctr.z)); return r.reduce((x, y) => x + y, 0) / r.length; };
  const rFront = radius(pts.frontOuterWheel), rRear = radius(pts.rearAxle), rIn = radius(pts.rearInnerWheel), rCorner = radius(pts.frontOuterCorner);
  check('xarici ön təkərin (kənarı) dönmə radiusu ≈ rəsmi 5.39 m', Math.abs(rFront - SPEC.turnRadius.v) < 0.05, `${rFront.toFixed(2)} m`);
  check('arxa ox radiusu rəsmi rəqəmdən kiçikdir (ayrıca hesablanır)', rRear < SPEC.turnRadius.v - 1, `${rRear.toFixed(2)} m`);
  check('daxili arxa təkər ön təkərlərdən daha içəridən keçir', rIn < rFront - 2, `daxili arxa ${rIn.toFixed(2)} m, xarici ön ${rFront.toFixed(2)} m`);
  check('ön xarici künc ən geniş dairəni cızır', rCorner > rFront, `${rCorner.toFixed(2)} m (bordürdən-bordürə yox, divardan-divara)`);
}
{
  // düz geri: istiqamət dəyişmir, sürünmə sürəti
  const c = new CarPhysics(); c.reset({ x: 0, z: 0, h: 0 }); c.gear = 'R';
  steady(c, { steer: 0, throttle: 0, brake: 0, clutch: 0 }, 4);
  check('düz geri: yan sürüşmə və dönmə yoxdur', Math.abs(c.x) < 1e-9 && Math.abs(c.h) < 1e-9 && c.z < -3, `z=${c.z.toFixed(2)} m, ${c.speedKmh.toFixed(1)} km/saat`);
}
{
  // tam sükanla geri: ön hissə əks tərəfə açılır (ön künc yana çıxır)
  const c = new CarPhysics(); c.reset({ x: 0, z: 0, h: 0 }); c.gear = 'R'; c.steer = 1; c.delta = -CAR.maxSteer;
  const fc0 = toWorld(CAR.width / 2, CAR.wheelbase + CAR.frontOverhang, c.pose);
  steady(c, { steer: 1, throttle: 0, brake: 0, clutch: 0 }, 1.2);
  const fc1 = toWorld(CAR.width / 2, CAR.wheelbase + CAR.frontOverhang, c.pose);
  const rearC = toWorld(-CAR.width / 2, -CAR.rearOverhang, c.pose);
  check('tam sağ sükanla geri: arxa sağa gedir, ön sol künc sola açılır', fc1.x > fc0.x + 0.15 && rearC.x < -CAR.width / 2, `ön künc ${((fc1.x - fc0.x) * 100).toFixed(0)} sm sola`);
}
{
  // toqquşma: geri sıçrama yoxdur, davamlı təmas bir hadisədir
  const wall = { cx: 0, cz: 5, h: 0, hw: 3, hl: 0.05, type: 'car' };
  const c = new CarPhysics(); c.reset({ x: 0, z: 0, h: 0 }); c.gear = 'D';
  const tr = new ContactTracker(0.6);
  let events = 0, minV = 0;
  for (let t = 0; t < 6; t += H) { const hit = c.step(H, { steer: 0, throttle: 0.3, brake: 0, clutch: 0 }, [wall]); if (tr.step(H, hit)) events++; minV = Math.min(minV, c.v); }
  check('aşağı sürətdə toxunanda geri sıçramır', minV >= 0, `ən kiçik v=${minV.toFixed(3)}`);
  check('davamlı təmas bir toqquşma sayılır', events === 1, `${events} hadisə`);
}
{
  // bordür: gövdə üstündən keçə bilir, təkər dirənir
  const curb = { cx: 0, cz: 4.2, h: Math.PI / 2, hw: 0.15, hl: 3, type: 'curb' };
  const c = new CarPhysics(); c.reset({ x: 0, z: 0, h: 0 }); c.gear = 'D';
  let part = null;
  for (let t = 0; t < 6; t += H) { const hit = c.step(H, { steer: 0, throttle: 0, brake: 0, clutch: 0 }, [curb]); if (hit) part = part || hit.part; }
  const bumper = c.z + CAR.wheelbase + CAR.frontOverhang;
  check('bordürə ön təkər dirənir, bamper üstündən keçir', part === 'tire_frontL' || part === 'tire_frontR', `${part}, bamper bordürü ${((bumper - 4.05) * 100).toFixed(0)} sm keçib`);
  // güzgü: yan tərəfdəki dirəyə güzgü dəyir (gövdə dəymir)
  const pole = { cx: CAR.width / 2 + 0.07, cz: 4, h: 0, hw: 0.04, hl: 0.04, type: 'pole' };
  const c2 = new CarPhysics(); c2.reset({ x: 0, z: 0, h: 0 }); c2.gear = 'D';
  let p2 = null;
  for (let t = 0; t < 6 && !p2; t += H) { const hit = c2.step(H, { steer: 0, throttle: 0, brake: 0, clutch: 0 }, [pole]); if (hit) p2 = hit.part; }
  check('yan güzgü maneəyə dəyəndə aşkarlanır', p2 === 'mirrorL', String(p2));
}
{
  // dar yerdə düzəliş: irəli-geri bir neçə qısa hərəkətlə istiqamət dəyişir, eyni nəticə müxtəlif FPS-də
  const plan = (q) => { const seg = Math.floor(q / 2.5); return { gear: seg % 2 ? 'R' : 'D', steer: seg % 2 ? -1 : 1, brake: q % 2.5 > 2.0 ? 1 : 0 }; };
  const runFps = (fdt) => {
    const c = new CarPhysics(); c.reset({ x: 0, z: 0, h: 0 }); const st = new FixedStepper(H); let sim = 0;
    for (let t = 0; t < 12.5; t += fdt) st.advance(fdt, (h) => { const p = plan(sim); if (c.v === 0) c.gear = p.gear; c.step(h, { steer: p.steer, throttle: 0, brake: p.brake, clutch: 0 }); sim += h; });
    return c;
  };
  const a = runFps(1 / 120), b = runFps(1 / 30), d = runFps(1 / 144);
  check('dar yerdə 5 hissəli düzəliş: istiqamət ≥ 60° dəyişir', Math.abs(a.h) > 60 * DEG, `${(a.h / DEG).toFixed(0)}°, yerdəyişmə ${Math.hypot(a.x, a.z).toFixed(2)} m`);
  check('düzəliş manevri 30/144 FPS-də eyni yol', Math.hypot(a.x - b.x, a.z - b.z) < 0.03 && Math.hypot(a.x - d.x, a.z - d.z) < 0.03, `fərq ${(Math.hypot(a.x - b.x, a.z - b.z) * 100).toFixed(1)} / ${(Math.hypot(a.x - d.x, a.z - d.z) * 100).toFixed(1)} sm`);
}

if (failed) { console.error(`${failed} fizika testi keçilmədi`); process.exit(1); }
console.log('Fizika testləri keçildi.');
