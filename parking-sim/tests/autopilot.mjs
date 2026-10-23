// Təlimatçının addımlarına əməl edən avtomatik sürücü (fizika + təlimatçı + qiymətləndirmə, render yoxdur).
import { CarPhysics } from '../src/physics.js';
import { Coach } from '../src/coach.js';
import { evaluate } from '../src/scoring.js';
import { obstaclesOf, bumperClearance } from '../src/sim.js';

export function runLevel(lv, { mode = 'learn', maxTime = 240 } = {}) {
  const car = new CarPhysics();
  car.reset(lv.start);
  const obs = obstaclesOf(lv.layout);
  const coach = new Coach(lv.coach);
  const stats = { time: 0, collisions: 0, curbHits: 0, moves: 0, signaled: false, maxSpeed: 0, lookedBack: true, gearAbuse: 0 };
  let steer = 0, blinker = null, lastDir = 0, lastHit = -9, t = 0;
  const hits = [];
  const dt = 1 / 60;
  while (t < maxTime) {
    t += dt;
    const clear = bumperClearance(car.pose, obs);
    const r = coach.update({ ...car.pose, v: car.v, delta: car.delta, gear: car.gear, steer: car.steer, blinker, clear });
    if (coach.doneAll) break;
    const st = coach.step;
    let brake = 1;
    if (st.check === 'gear') car.gear = st.to;
    else if (st.check === 'signal') { blinker = st.to; stats.signaled = true; }
    else if (st.check === 'steer') steer += Math.max(-dt, Math.min(dt, st.to - steer));
    else if (st.check === 'park') { car.gear = 'P'; blinker = null; }
    else brake = r.status === 'stop' || r.status === 'back' ? 1 : r.status === 'slow' ? 0.08 : 0;
    const hit = car.step(dt, { steer, throttle: 0, brake, clutch: 0, handbrake: false }, obs);
    if (hit && t - lastHit > 0.8) {
      if (hit.hit.type === 'curb') stats.curbHits++; else stats.collisions++;
      hits.push(`${hit.hit.type}@${car.x.toFixed(2)},${car.z.toFixed(2)}`);
    }
    if (hit) lastHit = t;
    if (Math.abs(car.v) > 0.12) { const d = Math.sign(car.v); if (d !== lastDir) { stats.moves++; lastDir = d; } }
    if (stats.moves > 0) stats.time += dt;
    stats.maxSpeed = Math.max(stats.maxSpeed, car.speedKmh);
  }
  const res = evaluate(lv, car, stats, mode);
  return { done: coach.doneAll, res, hits, car, stats };
}
