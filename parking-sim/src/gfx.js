// Qrafika: keyfiyyət səviyyələri, səma və ətraf əksolunma xəritəsi, post-effektlər, FPS ölçmə.
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';

// Keyfiyyət səviyyələri. mirrorScale — güzgü şəklinin ekran ölçüsünə nisbəti,
// mirrorEvery — yan güzgülər neçə kadrdan bir yenilənir (salon güzgüsü və arxa kamera hər kadr).
export const QUALITY = {
  low: { name: 'Aşağı', pixelRatio: 1, shadows: false, shadowSize: 0, bloom: false, mirrorScale: 0.5, mirrorEvery: 2, clearcoat: false, envIntensity: 0.7, anisotropy: 2, mirrorFar: 45 },
  medium: { name: 'Orta', pixelRatio: 1.5, shadows: true, shadowSize: 1024, bloom: false, mirrorScale: 0.7, mirrorEvery: 2, clearcoat: true, envIntensity: 0.9, anisotropy: 4, mirrorFar: 70 },
  high: { name: 'Yüksək', pixelRatio: 2, shadows: true, shadowSize: 2048, bloom: true, mirrorScale: 1, mirrorEvery: 1, clearcoat: true, envIntensity: 1, anisotropy: 8, mirrorFar: 110 },
  // Ultra: ən güclü görünüş — 4K kölgə xəritəsi, ekran fəzasında AO (GTAO), tam piksel sıxlığı. Avtomatik endirilmir.
  ultra: { name: 'Ultra', pixelRatio: 2.5, shadows: true, shadowSize: 4096, bloom: true, ao: true, mirrorScale: 1, mirrorEvery: 1, clearcoat: true, envIntensity: 1, anisotropy: 16, mirrorFar: 160 },
};
export const QUALITY_ORDER = ['low', 'medium', 'high', 'ultra'];

// Günün vaxtı / hava. İşıq intensivlikləri təxminidir (fiziki məntiqə yaxın nisbətlər, kalibrlənmiş lüks deyil).
export const TIMES = {
  day: { name: 'Günəşli gündüz', sun: [0.8, 1.25, 0.18], sunColor: 0xfff1dc, sunInt: 2.8, hemiSky: 0xe4f0ff, hemiGround: 0x6b665c, hemiInt: 0.5, top: 0x4f86c6, horizon: 0xcfe0ee, ground: 0x8c877d, fog: 0xcfe0ee, exposure: 1.0, wet: false, night: false },
  evening: { name: 'Axşam', sun: [-0.95, 0.2, 0.12], sunColor: 0xffb070, sunInt: 2.0, hemiSky: 0xffc9a0, hemiGround: 0x4a3c38, hemiInt: 0.35, top: 0x3c4f86, horizon: 0xf2a86e, ground: 0x5a4a40, fog: 0xd9a27c, exposure: 1.15, wet: false, night: false, evening: true },
  night: { name: 'Yaş asfalt, gecə', sun: [0.3, 0.5, -0.4], sunColor: 0x8fa6d8, sunInt: 0.12, hemiSky: 0x24304a, hemiGround: 0x0c0d10, hemiInt: 0.12, top: 0x05070d, horizon: 0x1a2232, ground: 0x0b0c0e, fog: 0x141a24, exposure: 1.35, wet: true, night: true },
};

// Gradientli səma qübbəsi + günəş (fayl yoxdur; həm fon, həm əksolunma mənbəyi)
export function makeSky(t = TIMES.day) {
  const geo = new THREE.SphereGeometry(450, 32, 16);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      top: { value: new THREE.Color(t.top) },
      horizon: { value: new THREE.Color(t.horizon) },
      ground: { value: new THREE.Color(t.ground) },
      sunDir: { value: new THREE.Vector3(...t.sun).normalize() },
      sunAmt: { value: t.night ? 0.0 : 1.0 },
    },
    vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform vec3 top; uniform vec3 horizon; uniform vec3 ground; uniform vec3 sunDir; uniform float sunAmt; varying vec3 vDir;
      void main(){
        float h = vDir.y;
        vec3 c = h > 0.0 ? mix(horizon, top, pow(h, 0.55)) : mix(horizon, ground, min(1.0, -h * 6.0));
        float s = max(dot(normalize(vDir), sunDir), 0.0);
        c += vec3(1.0, 0.92, 0.78) * (pow(s, 900.0) * 6.0 + pow(s, 12.0) * 0.18) * sunAmt;
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const sky = new THREE.Mesh(geo, mat);
  sky.renderOrder = -10;
  sky.frustumCulled = false;
  return sky;
}

// Əksolunma xəritəsi: səma + boz yer + bir neçə "bina" işığı (maşın boyası və şüşə üçün)
export function makeEnvironment(renderer, t = TIMES.day) {
  const envScene = new THREE.Scene();
  envScene.add(makeSky(t));
  const ground = new THREE.Mesh(new THREE.CircleGeometry(400, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color(t.ground).multiplyScalar(0.7) }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -1.5;
  envScene.add(ground);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const col = new THREE.Color([0xb9ad98, 0x9ea8b0, 0xc4b8a2][i % 3]).multiplyScalar(t.night ? 0.05 : t.evening ? 0.6 : 1);
    const b = new THREE.Mesh(new THREE.BoxGeometry(60, 30 + (i % 3) * 10, 20), new THREE.MeshBasicMaterial({ color: col }));
    b.position.set(Math.cos(a) * 160, 10, Math.sin(a) * 160);
    b.lookAt(0, 10, 0);
    envScene.add(b);
  }
  if (t.night) {
    // gecə: fənərlərin parlaq nöqtələri yaş asfaltda və boyada əks olunsun
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const l = new THREE.Mesh(new THREE.SphereGeometry(4, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffc98a).multiplyScalar(6) }));
      l.position.set(Math.cos(a) * 60, 18, Math.sin(a) * 60);
      envScene.add(l);
    }
  }
  const pmrem = new THREE.PMREMGenerator(renderer);
  const rt = pmrem.fromScene(envScene, 0.02);
  pmrem.dispose();
  return rt.texture;
}

export function makeComposer(renderer, scene, camera, withAO = false) {
  const size = renderer.getDrawingBufferSize(new THREE.Vector2());
  const rt = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, rt);
  const pass = new RenderPass(scene, camera);
  composer.addPass(pass);
  let ao = null;
  if (withAO) {
    // ekran fəzasında ambient occlusion: maşının altı, təkər yuvaları, künclər
    ao = new GTAOPass(scene, camera, size.x, size.y);
    ao.blendIntensity = 0.85;
    ao.updateGtaoMaterial({ radius: 0.6, distanceExponent: 1.5, thickness: 1.2, scale: 1, samples: 12 });
    composer.addPass(ao);
  }
  // ölçülü bloom: yalnız çox parlaq yerlər (işıqlar, günəş əksi) — görüntü bulanmasın
  const bloom = new UnrealBloomPass(new THREE.Vector2(size.x / 2, size.y / 2), 0.22, 0.35, 0.95);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  return { composer, pass, bloom, ao, withAO };
}

// FPS ölçmə (son ~1 saniyənin ortası) və avtomatik keyfiyyət endirmə
export class FpsMeter {
  constructor() {
    this.frames = [];
    this.fps = 0;
    this.lowFor = 0;
  }
  tick(dtReal) {
    this.frames.push(dtReal);
    if (this.frames.length > 60) this.frames.shift();
    const avg = this.frames.reduce((a, b) => a + b, 0) / this.frames.length;
    this.fps = avg > 0 ? 1 / avg : 0;
    return this.fps;
  }
  // true qaytarırsa — keyfiyyəti bir pillə endirmək lazımdır (4 saniyə ardıcıl 48 FPS-dən aşağı)
  shouldDowngrade(dtReal) {
    if (this.frames.length < 60) return false;
    this.lowFor = this.fps < 48 ? this.lowFor + dtReal : 0;
    if (this.lowFor > 4) { this.lowFor = 0; this.frames = []; return true; }
    return false;
  }
}
