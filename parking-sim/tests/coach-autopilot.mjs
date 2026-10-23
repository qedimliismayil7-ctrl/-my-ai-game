// Təlimatçının addımlarına əməl edən avtomatik sürücü: hər səviyyə keçilməlidir.
const B = new URL('../src/', import.meta.url).href;
let failed = 0;
const { CarPhysics, closestOnObb, obbAxes, toWorld, CAR } = await import(B+'physics.js');
const { LEVELS } = await import(B+'levels.js');
const { Coach } = await import(B+'coach.js');
const { evaluate } = await import(B+'scoring.js');
function obstaclesOf(L){ const o=[];
  for(const [x1,z1,x2,z2] of L.curbs){const dx=x2-x1,dz=z2-z1,len=Math.hypot(dx,dz);o.push({cx:(x1+x2)/2,cz:(z1+z2)/2,h:Math.atan2(dx,dz),hw:0.15,hl:len/2,type:'curb'});}
  for(const c of L.cars) o.push({cx:c.x,cz:c.z,h:c.h,hw:0.9,hl:2.25,type:'car'});
  for(const b of L.boxes) o.push({cx:b.cx,cz:b.cz,h:b.h,hw:b.hw,hl:b.hl,type:b.type});
  for(const [x,z] of L.trees) o.push({cx:x,cz:z,h:0,hw:0.2,hl:0.2,type:'tree'});
  return o;}
const SENS=[...[-0.75,-0.28,0.28,0.75].map(x=>({lx:x,lz:3.65,nx:x*0.6,nz:1,f:true})),...[-0.75,-0.28,0.28,0.75].map(x=>({lx:x,lz:-0.85,nx:x*0.6,nz:-1,f:false}))];
function sensors(car,obs){let front=9,rear=9;const [ax,az]=obbAxes(car.h);for(const s of SENS){const p=toWorld(s.lx,s.lz,car.pose);const nl=Math.hypot(s.nx,s.nz);const nwx=(ax[0]*s.nx+az[0]*s.nz)/nl,nwz=(ax[1]*s.nx+az[1]*s.nz)/nl;let best=9;for(const o of obs){const q=closestOnObb(p.x,p.z,o);if(q.d>2.5)continue;const dot=(q.x-p.x)*nwx+(q.z-p.z)*nwz;if(dot>=0.6*q.d||q.d<0.05)best=Math.min(best,q.d);}if(s.f)front=Math.min(front,best);else rear=Math.min(rear,best);}return {front,rear};}
for(const lv of LEVELS){
  const car=new CarPhysics(); car.reset(lv.start); const obs=obstaclesOf(lv.layout);
  const coach=new Coach(lv.coach); let sawBack=0; let steer=0, blinker=null, stats={time:0,collisions:0,curbHits:0,moves:0,signaled:false,maxSpeed:0}, lastDir=0, lastHit=-9, t=0;
  const dt=1/60; let log=[];
  for(let i=0;i<60*240;i++){ t+=dt;
    const sens=sensors(car,obs);
    const r=coach.update({...car.pose,v:car.v,delta:car.delta,gear:car.gear,steer:car.steer,blinker,sensors:sens});
    if(r.advanced) log.push(`${coach.steps[coach.i-1].check}@${car.x.toFixed(2)},${car.z.toFixed(2)},${(car.h*57.3).toFixed(1)}`);
    if(coach.doneAll) break;
    const st=coach.step; let brake=1, thr=0;
    if(st.check==='gear') car.gear=st.to;
    else if(st.check==='signal') { blinker=st.to; stats.signaled=true; }
    else if(st.check==='steer') steer+=Math.max(-dt,Math.min(dt,st.to-steer));
    else if(st.check==='park'){ car.gear='P'; blinker=null; }
    else { brake = r.status==='stop'||r.status==='back' ? 1 : r.status==='slow' ? 0.08 : 0; if(r.status==='back' && !sawBack){sawBack=1;} if(r.status==='back') log.push('BACK '+r.text); }
    const hit=car.step(dt,{steer,throttle:thr,brake,clutch:0,handbrake:false},obs);
    if(hit && t-lastHit>0.8){ log.push('sens '+JSON.stringify(sens)+' h '+(car.h*57.3).toFixed(0)); if(hit.hit.type==='curb')stats.curbHits++; else stats.collisions++; log.push(`HIT ${hit.hit.type} at ${car.x.toFixed(2)},${car.z.toFixed(2)}`);} if(hit) lastHit=t;
    if(Math.abs(car.v)>0.12){const d=Math.sign(car.v); if(d!==lastDir){stats.moves++;lastDir=d;}}
    if(stats.moves>0) stats.time+=dt; stats.maxSpeed=Math.max(stats.maxSpeed,car.speedKmh);
  }
  const res=evaluate(lv,car,stats);
  if(!res.passed || !coach.doneAll) failed++;
  console.log(`L${lv.id} done=${coach.doneAll} passed=${res.passed} score=${res.score} stars=${res.stars} angle=${res.angleErr.toFixed(1)} lat=${res.lateral.toFixed(2)} pose=${car.x.toFixed(2)},${car.z.toFixed(2)},${(car.h*57.3).toFixed(1)}`);
  console.log('   ', log.filter(l=>/HIT|BACK|goto|turn|sensor/.test(l)).slice(0,8).join(' | '), '\n   ', res.notes.join(' / '));
}
if (failed) { console.error(`${failed} səviyyə keçilmədi`); process.exit(1); }
