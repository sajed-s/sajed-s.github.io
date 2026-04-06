// ===================
//  Nebula Background Canvas
// ===================
(function() {
  const cv = document.getElementById('nebula-bg');
  if (!cv) return;

  function paint() {
    const W = window.innerWidth, H = window.innerHeight;
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');

    // Base — very deep space
    ctx.fillStyle = '#020610';
    ctx.fillRect(0, 0, W, H);

    // Helper: paint one soft cloud blob
    function blob(x, y, r, R, G, B, alpha) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0.00, `rgba(${R},${G},${B},${alpha})`);
      g.addColorStop(0.35, `rgba(${R},${G},${B},${(alpha*0.55).toFixed(3)})`);
      g.addColorStop(0.65, `rgba(${R},${G},${B},${(alpha*0.15).toFixed(3)})`);
      g.addColorStop(1.00, `rgba(${R},${G},${B},0)`);
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 0.6, -0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- Large nebula clouds — boosted opacity so they're clearly visible ---
    // Purple core — centre-left
    blob(W*0.28, H*0.42, W*0.40, 130, 30, 220, 0.55);
    blob(W*0.18, H*0.58, W*0.30, 100, 20, 180, 0.45);
    blob(W*0.35, H*0.30, W*0.25, 160, 50, 255, 0.35);
    // Electric blue — right
    blob(W*0.74, H*0.36, W*0.36, 20,  90, 240, 0.52);
    blob(W*0.82, H*0.54, W*0.26, 10,  60, 210, 0.40);
    blob(W*0.68, H*0.22, W*0.22, 40, 100, 255, 0.38);
    // Violet bridge across the middle
    blob(W*0.50, H*0.50, W*0.35, 100, 30, 200, 0.42);
    blob(W*0.55, H*0.38, W*0.22, 120, 40, 220, 0.30);
    // Teal/cyan accent — bottom
    blob(W*0.38, H*0.80, W*0.28, 0,  180, 200, 0.38);
    blob(W*0.62, H*0.75, W*0.22, 0,  160, 190, 0.30);
    // Hot magenta — top right accent
    blob(W*0.80, H*0.16, W*0.22, 200, 20, 160, 0.35);
    blob(W*0.72, H*0.10, W*0.18, 180, 10, 140, 0.28);
    // Blue haze sweeping top
    blob(W*0.50, H*0.08, W*0.60, 15,  50, 180, 0.35);
    // Extra depth — dark centre hint of a galaxy core
    blob(W*0.48, H*0.46, W*0.12, 200, 180, 255, 0.50);

    // --- Bright star cluster glow at centre ---
    ctx.globalCompositeOperation = 'lighter';
    const cluster = ctx.createRadialGradient(W*0.50, H*0.44, 0, W*0.50, H*0.44, W*0.22);
    cluster.addColorStop(0,   'rgba(200,180,255,0.30)');
    cluster.addColorStop(0.4, 'rgba(120,90,220,0.12)');
    cluster.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = cluster;
    ctx.fillRect(0, 0, W, H);

    // --- Dust lanes — dark curved streaks for realism ---
    ctx.globalCompositeOperation = 'source-over';
    function dustLane(x1, y1, cpx, cpy, x2, y2, width, alpha) {
      const g = ctx.createLinearGradient(x1, y1, x2, y2);
      g.addColorStop(0,   `rgba(1,0,10,0)`);
      g.addColorStop(0.3, `rgba(1,0,10,${alpha})`);
      g.addColorStop(0.7, `rgba(1,0,10,${alpha})`);
      g.addColorStop(1,   `rgba(1,0,10,0)`);
      ctx.strokeStyle = g;
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo(cpx, cpy, x2, y2);
      ctx.stroke();
    }
    dustLane(W*0.05, H*0.28, W*0.42, H*0.38, W*0.75, H*0.62, W*0.09, 0.45);
    dustLane(W*0.25, H*0.18, W*0.55, H*0.30, W*0.92, H*0.68, W*0.07, 0.35);

    // --- Tiny background stars sprinkled in ---
    ctx.globalCompositeOperation = 'screen';
    const seed = 42;
    for (let i = 0; i < 600; i++) {
      // deterministic-ish via sin hash
      const sx = (Math.sin(i * 127.1 + seed) * 0.5 + 0.5) * W;
      const sy = (Math.sin(i * 311.7 + seed) * 0.5 + 0.5) * H;
      const sr = 0.4 + (Math.sin(i * 74.3) * 0.5 + 0.5) * 1.2;
      const sa = 0.15 + (Math.sin(i * 53.1) * 0.5 + 0.5) * 0.55;
      // colour varies: mostly white/blue, occasional warm
      const warm = Math.sin(i * 19.7) > 0.7;
      const R = warm ? 255 : 200 + Math.floor((Math.sin(i*31)*0.5+0.5)*55);
      const G = warm ? 220 : 200 + Math.floor((Math.sin(i*41)*0.5+0.5)*55);
      const B = warm ? 160 : 240;
      ctx.fillStyle = `rgba(${R},${G},${B},${sa.toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalCompositeOperation = 'source-over';
  }

  paint();
  window.addEventListener('resize', paint);
})();

// ===================
//  Three.js Scene
// ===================
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.up.set(0, 1, 0.25);             // Z is "up" for this view
camera.position.set(0, 25, 0.5);  

// === Adjust camera for mobile (less zoom) ===
if (window.innerWidth < 720) {
  camera.position.z = 9;
  camera.fov = 95;
  camera.updateProjectionMatrix();
}

scene.add(camera);

const renderer  = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const BLOOM_LAYER = 1;
const ENTIRE_SCENE = 0;
const darkMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
const materialsCache = {};


// keep the canvas behind UI
renderer.domElement.style.position = "fixed";
renderer.domElement.style.top  = "0";
renderer.domElement.style.left = "0";
renderer.domElement.style.zIndex = "0";

const raycaster = new THREE.Raycaster();
const mouse     = new THREE.Vector2();

// ===================
//  Lights
// ===================
const light = new THREE.PointLight(0xffffff, 1);
light.position.set(10, 10, 10);
scene.add(light);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);

// ===================
//  Flags & State
// ===================
let hoveredObject = null;
let focusOnStar   = false;
let focusHome     = false;
let focusOnMoon   = false;

let satellite = null;

let currentMoonIndex = 3; // default if you want one pre-picked
const SECTION_TO_MOON = { bioinformatics: 0, srs: 1, cv: 2, work: 3, contact: 4 };
const MOON_TO_SECTION = { 0: "bioinformatics", 1: "srs", 2: "cv", 3: "work", 4: "contact" };

// --- INTRO DOLLY: camera starts far and glides to "home" ---
let introActive = true;
const intro = {
  t: 0,
  duration: 9,
  startPos: new THREE.Vector3(0, 6, 305),
  startTarget: new THREE.Vector3(0, 1, 0.25)
};
// ease helper
function easeInOutCubic(x){ return x<0.5 ? 4*x*x*x : 1 - Math.pow(-2*x+2,3)/2; }

// Open the requested overlay (and close others)
function openSection(section) {
  hideAllOverlays();
  switch (section) {
    case "projects": showProjectsOverlay?.(); break;
    case "work":     showWorkOverlay?.();     break;
    case "contact":  showContactOverlay?.();  break;
    case "home":     showHomeOverlay?.();     break;
  }
}
const targetPosition = new THREE.Vector3(0, 25, 0.5); // for star zoom
const loader = new THREE.TextureLoader();


/////


/////
// ===================
//  Background Space (procedural) + Sun
// ===================


// 1) Use a deep space color as the renderer background
renderer.setClearColor(0x000000, 0); // transparent — nebula canvas shows behind
renderer.alpha = true;

// 2) Star sprite generators (CanvasTexture)

// Soft glow disc — for background dust layer
function makeGlowTexture(hex, size = 32) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const r = (hex >> 16) & 255, g = (hex >> 8) & 255, b = hex & 255;
  const grad = ctx.createRadialGradient(size/2,size/2,0, size/2,size/2,size/2);
  grad.addColorStop(0.00, `rgba(${r},${g},${b},1.0)`);
  grad.addColorStop(0.15, `rgba(${r},${g},${b},0.5)`);
  grad.addColorStop(0.45, `rgba(${r},${g},${b},0.08)`);
  grad.addColorStop(1.00, `rgba(0,0,0,0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Crisp pinpoint star — white-hot core, tight halo, colored tint
function makePinTexture(hex, size = 64) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const cx = size / 2, cy = size / 2;
  const r = (hex >> 16) & 255, g = (hex >> 8) & 255, b = hex & 255;

  // Outer soft halo
  const halo = ctx.createRadialGradient(cx,cy,0, cx,cy,cx);
  halo.addColorStop(0.00, `rgba(${r},${g},${b},0.55)`);
  halo.addColorStop(0.18, `rgba(${r},${g},${b},0.18)`);
  halo.addColorStop(0.50, `rgba(${r},${g},${b},0.04)`);
  halo.addColorStop(1.00, `rgba(0,0,0,0)`);
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, size, size);

  // Bright core
  const core = ctx.createRadialGradient(cx,cy,0, cx,cy,cx*0.12);
  core.addColorStop(0.0, 'rgba(255,255,255,1.0)');
  core.addColorStop(0.4, `rgba(${r},${g},${b},0.9)`);
  core.addColorStop(1.0, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(cx, cy, cx*0.12, 0, Math.PI*2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return tex;
}

// Hero star — bright with 4-point diffraction spikes
function makeHeroTexture(hex, size = 128) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const cx = size / 2, cy = size / 2;
  const r = (hex >> 16) & 255, g = (hex >> 8) & 255, b = hex & 255;

  // Wide outer glow
  const outer = ctx.createRadialGradient(cx,cy,0, cx,cy,cx);
  outer.addColorStop(0.00, `rgba(${r},${g},${b},0.7)`);
  outer.addColorStop(0.12, `rgba(${r},${g},${b},0.25)`);
  outer.addColorStop(0.35, `rgba(${r},${g},${b},0.06)`);
  outer.addColorStop(1.00, 'rgba(0,0,0,0)');
  ctx.fillStyle = outer;
  ctx.fillRect(0, 0, size, size);

  // 4-point diffraction spikes
  ctx.save();
  for (let s = 0; s < 4; s++) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(s * Math.PI / 2);
    const spike = ctx.createLinearGradient(0, 0, cx * 0.85, 0);
    spike.addColorStop(0.0, 'rgba(255,255,255,0.9)');
    spike.addColorStop(0.3, `rgba(${r},${g},${b},0.35)`);
    spike.addColorStop(1.0, 'rgba(0,0,0,0)');
    ctx.fillStyle = spike;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(cx * 0.85, -1.5);
    ctx.lineTo(cx * 0.85,  1.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  // Blazing white core
  const core = ctx.createRadialGradient(cx,cy,0, cx,cy,cx*0.08);
  core.addColorStop(0.0, 'rgba(255,255,255,1.0)');
  core.addColorStop(0.5, `rgba(${r},${g},${b},0.8)`);
  core.addColorStop(1.0, 'rgba(0,0,0,0)');
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(cx, cy, cx*0.08, 0, Math.PI*2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return tex;
}

// Pre-build all textures
const texGlowWhite  = makeGlowTexture(0xffffff);
const texGlowBlue   = makeGlowTexture(0xaaccff);
const texPinWhite   = makePinTexture(0xffffff);
const texPinBlue    = makePinTexture(0xb8d4ff);
const texPinOrange  = makePinTexture(0xffcc88);
const texPinRed     = makePinTexture(0xff8866);
const texHeroWhite  = makeHeroTexture(0xffffff);
const texHeroBlue   = makeHeroTexture(0xaaddff);
const texHeroYellow = makeHeroTexture(0xffe080);

// --- Twinkle shader material ---
function makeTwinklePointsMaterial(texture, {
  baseSize = 6,
  opacity = 0.75,
  additive = true,
  pixelRatio = window.devicePixelRatio || 1
} = {}) {
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uMap: { value: texture },
      uOpacity: { value: opacity },
      uBaseSize: { value: baseSize },
      uPixelRatio: { value: pixelRatio }
    },
    vertexShader: /* glsl */`
      uniform float uTime;
      uniform float uBaseSize;
      uniform float uPixelRatio;

      attribute float aSizeJitter; // -0.3..+0.3
      attribute float aTwinkle;    // 0 or 1
      attribute float aSpeed;      // 0.6..1.8
      attribute float aPhase;      // 0..2PI
      attribute float aOpacity;    // 0.5..1.0

      varying float vOpacity;

      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

        float tw = 1.0;
        if (aTwinkle > 0.0) {
          float s = sin(uTime * aSpeed + aPhase) * 0.5 + 0.5; // 0..1
          s = pow(s, 2.0); // linger darker, quick bright flash
          tw = mix(0.8, 1.5, s);
        }

        float size = uBaseSize * (1.0 + aSizeJitter) * tw;

        // simple size attenuation; adjust constant for your camera/FOV
        float atten = 300.0 / -mvPosition.z;
        gl_PointSize = size * atten * uPixelRatio;

        vOpacity = aOpacity;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: /* glsl */`
      uniform sampler2D uMap;
      uniform float uOpacity;

      varying float vOpacity;

      void main() {
        vec2 uv = gl_PointCoord;
        vec4 tex = texture2D(uMap, uv);
        vec3 rgb = tex.rgb * tex.a;          // premultiplied look
        gl_FragColor = vec4(rgb, tex.a * uOpacity * vOpacity);
        if (gl_FragColor.a < 0.02) discard;  // remove square edges
      }
    `,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending
  });
  mat.uniforms.uMap.value.colorSpace = THREE.SRGBColorSpace;
  return mat;
}

// 3) Build star layers (with twinkle attributes)
function makeStars({
  count,
  minR = 30,
  maxR = 90,
  sizePx = 4,
  texture,
  opacity = 0.75,
  additive = true,
  twinkleRatio = 0.25 // only this fraction will blink
}) {
  const geom = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const aSizeJitter = new Float32Array(count);
  const aTwinkle = new Float32Array(count);
  const aSpeed = new Float32Array(count);
  const aPhase = new Float32Array(count);
  const aOpacity = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const u = Math.random() * 2 * Math.PI;
    const v = Math.acos(2 * Math.random() - 1);
    const r = minR + Math.random() * (maxR - minR);
    const x = r * Math.sin(v) * Math.cos(u);
    const y = r * Math.sin(v) * Math.sin(u);
    const z = r * Math.cos(v);
    const idx = i * 3;
    pos[idx] = x; pos[idx + 1] = y; pos[idx + 2] = z;

    aSizeJitter[i] = (Math.random() * 0.6) - 0.3; // -0.3..+0.3
    const willTwinkle = Math.random() < twinkleRatio ? 1 : 0;
    aTwinkle[i] = willTwinkle;
    aSpeed[i] = willTwinkle ? (0.6 + Math.random() * 1.2) : 0.0;
    aPhase[i] = Math.random() * Math.PI * 2.0;
    aOpacity[i] = 0.5 + Math.random() * 0.5;
  }

  geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geom.setAttribute('aSizeJitter', new THREE.BufferAttribute(aSizeJitter, 1));
  geom.setAttribute('aTwinkle', new THREE.BufferAttribute(aTwinkle, 1));
  geom.setAttribute('aSpeed', new THREE.BufferAttribute(aSpeed, 1));
  geom.setAttribute('aPhase', new THREE.BufferAttribute(aPhase, 1));
  geom.setAttribute('aOpacity', new THREE.BufferAttribute(aOpacity, 1));

  const mat = makeTwinklePointsMaterial(texture, {
    baseSize: sizePx,
    opacity,
    additive,
    pixelRatio: window.devicePixelRatio || 1
  });

  const points = new THREE.Points(geom, mat);
  points.userData.isTwinklePoints = true; // tag for uTime updates
  return points;
}

// Cheap + pretty halo layer to enhance glow
function makeHaloLayer(points, texture, scale = 1.5, extraOpacity = 0.35) {
  const halo = points.clone();
  halo.geometry = points.geometry; // share
  const base = points.material.uniforms.uBaseSize.value;
  const op   = points.material.uniforms.uOpacity.value;

  halo.material = makeTwinklePointsMaterial(texture, {
    baseSize: base * scale,
    opacity: Math.min(1, op * extraOpacity),
    additive: true
  });
  halo.userData.isTwinklePoints = true;
  return halo;
}

const starfieldGroup = new THREE.Group();
scene.add(starfieldGroup);

const IS_MOBILE = window.innerWidth < 720;

// ── Layer 1: Background dust — thousands of tiny dim stars ──
// Gives the Milky Way density feel
const starsDust = makeStars({
  count:       IS_MOBILE ? 1800 : 4000,
  minR: 60, maxR: 280,
  sizePx:      IS_MOBILE ? 1.2 : 1.5,
  texture:     texGlowWhite,
  opacity:     0.52,
  additive:    true,
  twinkleRatio: 0.0
});

// ── Layer 2: Blue-tinted dust (cooler distant stars) ──
const starsDustBlue = makeStars({
  count:       IS_MOBILE ? 600 : 1400,
  minR: 80, maxR: 300,
  sizePx:      IS_MOBILE ? 1.0 : 1.3,
  texture:     texGlowBlue,
  opacity:     0.32,
  additive:    true,
  twinkleRatio: 0.0
});

// ── Layer 3: Mid-field crisp white stars ──
const starsMidWhite = makeStars({
  count:       IS_MOBILE ? 300 : 700,
  minR: 40, maxR: 200,
  sizePx:      IS_MOBILE ? 2.5 : 3.2,
  texture:     texPinWhite,
  opacity:     0.92,
  additive:    true,
  twinkleRatio: 0.35
});

// ── Layer 4: Mid-field blue stars (hot O/B type) ──
const starsMidBlue = makeStars({
  count:       IS_MOBILE ? 80 : 200,
  minR: 40, maxR: 180,
  sizePx:      IS_MOBILE ? 2.2 : 2.8,
  texture:     texPinBlue,
  opacity:     0.88,
  additive:    true,
  twinkleRatio: 0.4
});

// ── Layer 5: Orange/red foreground stars (K/M type) ──
const starsOrange = makeStars({
  count:       IS_MOBILE ? 40 : 100,
  minR: 30, maxR: 120,
  sizePx:      IS_MOBILE ? 2.0 : 2.6,
  texture:     texPinOrange,
  opacity:     0.82,
  additive:    true,
  twinkleRatio: 0.5
});
const starsRed = makeStars({
  count:       IS_MOBILE ? 20 : 55,
  minR: 25, maxR: 100,
  sizePx:      IS_MOBILE ? 1.8 : 2.4,
  texture:     texPinRed,
  opacity:     0.78,
  additive:    true,
  twinkleRatio: 0.5
});

// ── Layer 6: Hero stars — bright with diffraction spikes ──
// Just a handful — they should feel special
const starsHeroWhite = makeStars({
  count:       IS_MOBILE ? 4 : 9,
  minR: 35, maxR: 160,
  sizePx:      IS_MOBILE ? 10 : 14,
  texture:     texHeroWhite,
  opacity:     0.95,
  additive:    true,
  twinkleRatio: 1.0
});
const starsHeroBlue = makeStars({
  count:       IS_MOBILE ? 3 : 7,
  minR: 40, maxR: 180,
  sizePx:      IS_MOBILE ? 9 : 12,
  texture:     texHeroBlue,
  opacity:     0.9,
  additive:    true,
  twinkleRatio: 1.0
});
const starsHeroYellow = makeStars({
  count:       IS_MOBILE ? 2 : 5,
  minR: 30, maxR: 140,
  sizePx:      IS_MOBILE ? 8 : 11,
  texture:     texHeroYellow,
  opacity:     0.85,
  additive:    true,
  twinkleRatio: 1.0
});

// Add all layers back-to-front (dust first, hero stars last)
starfieldGroup.add(
  starsDust, starsDustBlue,
  starsMidWhite, starsMidBlue,
  starsOrange, starsRed,
  starsHeroWhite, starsHeroBlue, starsHeroYellow
);


// Halo layers only on the crisp/hero stars (not dust — would smear)
const haloMidWhite  = makeHaloLayer(starsMidWhite,   texGlowWhite, 2.8, 0.35);
const haloMidBlue   = makeHaloLayer(starsMidBlue,    texGlowBlue,  2.8, 0.30);
const haloHeroWhite = makeHaloLayer(starsHeroWhite,  texGlowWhite, 3.5, 0.40);
const haloHeroBlue  = makeHaloLayer(starsHeroBlue,   texGlowBlue,  3.5, 0.38);
const haloHeroYellow= makeHaloLayer(starsHeroYellow, makeGlowTexture(0xffe090), 3.5, 0.35);
starfieldGroup.add(haloMidWhite, haloMidBlue, haloHeroWhite, haloHeroBlue, haloHeroYellow);

// Gentle drift
const _starSpin = { y: 0.00012, x: 0.00002 };





// ===================
//  Shooting Stars
// ===================
const SHOOT_POOL = 6;   // max simultaneous meteors
const shooters = [];

function makeShooter() {
  // Trail: a thin tapered line built from a BufferGeometry
  const segments = 28;
  const positions = new Float32Array(segments * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  // Use a line with vertexColors for fade
  const colors = new Float32Array(segments * 3);
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    linewidth: 1
  });

  const line = new THREE.Line(geo, mat);
  line.visible = false;
  line.frustumCulled = false;
  scene.add(line);

  return {
    line,
    active: false,
    // spawn fields filled on activation
    ox: 0, oy: 0, oz: 0,   // origin
    dx: 0, dy: 0, dz: 0,   // direction (unit)
    speed: 0,
    length: 0,
    progress: 0,            // 0 = just spawned, 1 = finished
    duration: 0,
    nextSpawn: Math.random() * 5   // seconds until first fire
  };
}

for (let i = 0; i < SHOOT_POOL; i++) shooters.push(makeShooter());

function spawnShooter(s) {
  // Random point on a sphere shell at r=120..200, biased toward front hemisphere
  const theta = Math.random() * Math.PI * 2;
  const phi   = Math.acos(0.3 + Math.random() * 0.7); // upper hemisphere bias
  const r     = 120 + Math.random() * 80;
  s.ox = r * Math.sin(phi) * Math.cos(theta);
  s.oy = r * Math.cos(phi) * 0.6;           // flatten vertically
  s.oz = r * Math.sin(phi) * Math.sin(theta);

  // Direction: slight downward drift + random lateral
  const spread = 0.35;
  s.dx = (Math.random() - 0.5) * spread;
  s.dy = -(0.5 + Math.random() * 0.5);
  s.dz = (Math.random() - 0.5) * spread;
  // Normalise
  const len = Math.sqrt(s.dx*s.dx + s.dy*s.dy + s.dz*s.dz);
  s.dx /= len; s.dy /= len; s.dz /= len;

  s.speed    = 60 + Math.random() * 80;     // units/sec
  s.length   = 18 + Math.random() * 22;     // trail length
  s.duration = s.length / s.speed + (s.length * 2) / s.speed; // travel + fade
  s.progress = 0;
  s.active   = true;
  s.line.visible = true;
}

function updateShooter(s, dt) {
  if (!s.active) {
    s.nextSpawn -= dt;
    if (s.nextSpawn <= 0) {
      spawnShooter(s);
      s.nextSpawn = 3.5 + Math.random() * 6.5; // 3.5–10 s between shots
    }
    return;
  }

  s.progress += dt;
  const travelled = s.progress * s.speed;  // how far the HEAD has moved
  const segments = 28;
  const positions = s.line.geometry.attributes.position.array;
  const colors    = s.line.geometry.attributes.color.array;

  for (let i = 0; i < segments; i++) {
    // Each segment is at a fraction behind the head
    const frac = i / (segments - 1);           // 0 = head, 1 = tail end
    const dist = travelled - frac * s.length;  // distance from origin

    const px = s.ox + s.dx * dist;
    const py = s.oy + s.dy * dist;
    const pz = s.oz + s.dz * dist;
    positions[i*3]   = px;
    positions[i*3+1] = py;
    positions[i*3+2] = pz;

    // Brightness: head bright, tail fades; overall fades in + out
    const headBright  = Math.max(0, 1 - frac * frac);   // squared falloff
    const lifeIn      = Math.min(1, s.progress / 0.08); // 80ms fade-in
    const lifeOut     = Math.max(0, 1 - Math.max(0, (travelled - s.length) / s.length));
    const brightness  = headBright * lifeIn * lifeOut;

    // Warm white → slight blue tint on tail
    colors[i*3]   = 0.9 + 0.1 * headBright;   // R
    colors[i*3+1] = 0.92 + 0.08 * headBright; // G
    colors[i*3+2] = 1.0;                       // B
    // Use opacity via overall scale trick — encode in G channel brightness
    colors[i*3]   *= brightness;
    colors[i*3+1] *= brightness;
    colors[i*3+2] *= brightness;
  }

  s.line.geometry.attributes.position.needsUpdate = true;
  s.line.geometry.attributes.color.needsUpdate    = true;

  // Done when tail has passed
  if (travelled > s.length * 2.2) {
    s.active = false;
    s.line.visible = false;
  }
}

// ---- Sun ----
const sunGeo = new THREE.SphereGeometry(2, 64, 64);
const sunMat = new THREE.MeshBasicMaterial({
  color: 0xfffde0,   // almost white-hot at the surface
});
const sphere = new THREE.Mesh(sunGeo, sunMat);
scene.add(sphere);

// ---- Sun Glow Layers ----
// Each is a slightly larger sphere with AdditiveBlending — stacks to create corona

function makeSunGlowTexture(innerCol, outerCol, size = 256) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const cx = size / 2;
  const grad = ctx.createRadialGradient(cx,cx, 0, cx,cx, cx);
  grad.addColorStop(0.00, innerCol);
  grad.addColorStop(0.25, outerCol);
  grad.addColorStop(0.60, 'rgba(255,140,0,0.04)');
  grad.addColorStop(1.00, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Sprite-based glow (always faces camera)
const sunGlowMat = new THREE.SpriteMaterial({
  map: makeSunGlowTexture(
    'rgba(255,220,80,0.92)',
    'rgba(255,120,10,0.30)'
  ),
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  transparent: true,
  opacity: 1.0
});
const sunGlowSprite = new THREE.Sprite(sunGlowMat);
sunGlowSprite.scale.set(14, 14, 1);
scene.add(sunGlowSprite);

// Second wider softer halo
const sunHaloMat = new THREE.SpriteMaterial({
  map: makeSunGlowTexture(
    'rgba(255,180,40,0.35)',
    'rgba(255,80,0,0.08)'
  ),
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  transparent: true,
  opacity: 0.85
});
const sunHaloSprite = new THREE.Sprite(sunHaloMat);
sunHaloSprite.scale.set(28, 28, 1);
scene.add(sunHaloSprite);

// Outermost atmospheric scatter — very faint orange
const sunAtmoMat = new THREE.SpriteMaterial({
  map: makeSunGlowTexture(
    'rgba(255,120,20,0.12)',
    'rgba(255,60,0,0.02)'
  ),
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  transparent: true,
  opacity: 0.7
});
const sunAtmoSprite = new THREE.Sprite(sunAtmoMat);
sunAtmoSprite.scale.set(52, 52, 1);
scene.add(sunAtmoSprite);

// Point light ON the sun so it illuminates moons
const sunLight = new THREE.PointLight(0xffcc55, 2.5, 80);
scene.add(sunLight);

// ===================
//  Moons
// ===================
const moons = [];

// Helper: auto-scale a loaded GLB so its bounding sphere fits targetRadius
function autoScale(obj, targetRadius) {
  const box = new THREE.Box3().setFromObject(obj);
  const size = new THREE.Vector3();
  box.getSize(size);
  const currentRadius = Math.max(size.x, size.y, size.z) / 2;
  if (currentRadius > 0) {
    const s = targetRadius / currentRadius;
    obj.scale.set(s, s, s);
  }
}

// ── Moons 0 & 2: GLB objects (bio / cv) ──────────────────────
// These are placeholder spheres that get replaced once the GLB loads
const glbMoonDefs = [
  { index: 0, file: 'bio_object.glb',  section: 'bioinformatics' },
  { index: 2, file: 'cv_object.glb',   section: 'cv' }
];

// ── Create all 5 moons as spheres first ──────────────────────
const moonTexturePaths = [
  "2k_jupiter.jpg",  // 0 — bio (replaced by GLB)
  "2k_mars.jpg",     // 1 — remote sensing
  "2k_venus.jpg",    // 2 — cv (replaced by GLB)
  "2k_earth_daymap.jpg", // 3 — work
  "2k_neptune.jpg"   // 4 — contact
];
const moonTextures = moonTexturePaths.map(p => loader.load(p));

const moonSections = ['bioinformatics', 'srs', 'cv', 'work', 'contact'];
const moonRadii    = [5, 6.5, 8, 9.5, 11];
const moonSpeeds   = [0.001, 0.0015, 0.0008, 0.0005, 0.0003];

for (let i = 0; i < 5; i++) {
  const size = 0.35 + (i % 3) * 0.15;
  const geo  = new THREE.SphereGeometry(size, 16, 16);
  const mat  = new THREE.MeshStandardMaterial({ map: moonTextures[i] });
  const moon = new THREE.Mesh(geo, mat);
  moon.userData = {
    angle:   (i / 5) * Math.PI * 2,
    radius:  moonRadii[i],
    speed:   moonSpeeds[i],
    section: moonSections[i],
    isGLB:   false
  };
  moons.push(moon);
  scene.add(moon);
}

// ── Load GLB objects for bio (0) and cv (2) ──────────────────
{
  const gltfLoader  = new THREE.GLTFLoader();
  const dracoLoader = new THREE.DRACOLoader();
  dracoLoader.setDecoderPath("https://cdn.jsdelivr.net/npm/three@0.146.0/examples/js/libs/draco/");
  gltfLoader.setDRACOLoader(dracoLoader);

  glbMoonDefs.forEach(({ index, file, section }) => {
    gltfLoader.load(file, (gltf) => {
      const obj = gltf.scene;

      // Auto-scale to match sphere moon size (~0.5 radius)
      // CV model is extremely large — needs much smaller target
      const targetR = (file === 'cv_object.glb') ? 0.0055 : 0.55;
      autoScale(obj, targetR);

      // Store the base scale so pulse animation can be relative to it
      obj.userData.baseScale = obj.scale.x;

      // Copy orbital data from the placeholder sphere
      const old = moons[index];
      obj.userData = { ...old.userData, isGLB: true };

      // Position at same place as old sphere
      obj.position.copy(old.position);

      // Rotate 90 degrees so model faces correctly
      obj.rotation.x = Math.PI / 2;

      // Transfer any CSS2D labels from old sphere to new GLB
      old.children
        .filter(c => c.isCSS2DObject)
        .forEach(label => {
          old.remove(label);
          obj.add(label);
        });

      // Remove old sphere, insert GLB
      scene.remove(old);
      scene.add(obj);
      moons[index] = obj;

      console.log(`GLB moon loaded: ${file} (index ${index})`);
    }, undefined, err => {
      console.warn(`GLB not found (${file}), keeping sphere:`, err.message);
    });
  });
}

// ===================
//  Labels & Click Targets
// ===================
function attachLabelToObject(object3D, text, onClick, yOffset = 0.6) {
  const el = document.createElement("div");
  el.className = "space-label";
  el.textContent = text;
  el.style.pointerEvents = "auto";

  const labelObj = new THREE.CSS2DObject(el);
  labelObj.position.set(0, yOffset, 0);
  object3D.add(labelObj);

  if (typeof onClick === "function") {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    });
  }
  return labelObj;
}

// SUN → "Home"
attachLabelToObject(sphere, "Home", () => {
  openSection("home");
  focusOnMoon = false;
  focusOnStar = false;
  focusHome   = true;
  if (satellite) satellite.visible = false;
}, 1.2);

// Moon 0 → Bioinformatics
if (moons[0]) {
  attachLabelToObject(moons[0], "Bioinformatics", () => {
    hideAllOverlays();
    focusCameraOnMoon(0);
    ProjectViewer.open('bioinformatics');
  });
}
// Moon 1 → Remote Sensing
if (moons[1]) {
  attachLabelToObject(moons[1], "Remote Sensing", () => {
    hideAllOverlays();
    focusCameraOnMoon(1);
    ProjectViewer.open('srs');
  });
}
// Moon 2 → Computer Vision
if (moons[2]) {
  attachLabelToObject(moons[2], "Computer Vision", () => {
    hideAllOverlays();
    focusCameraOnMoon(2);
    ProjectViewer.open('cv');
  });
}
// Moon 3 → Work Experience
if (moons[3]) {
  attachLabelToObject(moons[3], "Work Experience", () => {
    hideAllOverlays();
    focusCameraOnMoon(3);
    showWorkOverlay();
  });
}
// Moon 4 → Get in Touch
if (moons[4]) {
  attachLabelToObject(moons[4], "Get in Touch", () => {
    hideAllOverlays();
    focusCameraOnMoon(4);
    showContactOverlay();
  });
}

// ===================
//  Camera & Controls
// ===================
camera.position.z = 10;
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enablePan = false;

// Save "home" camera + target
const homeCamPos    = camera.position.clone();
const homeCamTarget = controls.target.clone();

// --- INTRO DOLLY: place camera at intro start & lock controls ---
camera.position.copy(intro.startPos);
controls.target.copy(intro.startTarget);
controls.enabled = false;
controls.update();

// Label renderer
const labelRenderer = new THREE.CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.className = "label-layer";
labelRenderer.domElement.style.position = "fixed";
labelRenderer.domElement.style.top = "0";
labelRenderer.domElement.style.left = "0";
labelRenderer.domElement.style.zIndex = "1";
document.body.appendChild(labelRenderer.domElement);

// ===================
//  Overlay Helpers
// ===================
function showProjectsOverlay(){
  const el = document.getElementById("projects-overlay");
  if (el) {
    el.classList.add("open");
    el.setAttribute("aria-hidden", "false");
    el.classList.remove("shifted");
  }
}
function hideProjectsOverlay(){
  const el = document.getElementById("projects-overlay");
  if (el) { el.classList.remove("open"); el.setAttribute("aria-hidden", "true"); }
}
function showHomeOverlay(){
  const el = document.getElementById("home-overlay");
  if (el) { el.classList.add("open"); el.setAttribute("aria-hidden", "false"); }
  MissionTerminal.play();
}
function hideHomeOverlay(){
  MissionTerminal.stop();
  const el = document.getElementById("home-overlay");
  if (el) { el.classList.remove("open"); el.setAttribute("aria-hidden", "true"); }
}
function showWorkOverlay(){
  const el = document.getElementById("work-overlay");
  if (el) { el.classList.add("open"); el.setAttribute("aria-hidden", "false"); }
}
function hideWorkOverlay(){
  const el = document.getElementById("work-overlay");
  if (el) { el.classList.remove("open"); el.setAttribute("aria-hidden", "true"); }
}
function showContactOverlay(){
  const el = document.getElementById("contact-overlay");
  if (el) { el.classList.add("open"); el.setAttribute("aria-hidden", "false"); }
}
function hideContactOverlay(){
  const el = document.getElementById("contact-overlay");
  if (el) { el.classList.remove("open"); el.setAttribute("aria-hidden", "true"); }
}
function hideAllOverlays(){
  hideProjectsOverlay();
  hideHomeOverlay();
  hideWorkOverlay();
  hideContactOverlay();
  if (typeof SRSViewer    !== 'undefined') SRSViewer.hide();
  if (typeof ProjectViewer !== 'undefined') ProjectViewer.close();
}


//////
// ===================
//  Orbit Rings (visualize moon paths)
// ===================
function addOrbitRing(radius, color = 0x00d9c0, thickness = 0.025, glow = 0.22) {
  const group = new THREE.Group();

  // 1) Crisp thin ring (the line)
  const ringThinGeo = new THREE.RingGeometry(
    Math.max(0.001, radius - thickness),
    radius + thickness,
    128
  );
  const ringThinMat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.55,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const ringThin = new THREE.Mesh(ringThinGeo, ringThinMat);
  ringThin.rotation.x = Math.PI / 2; // put it in the x–z plane (y = 0)
  group.add(ringThin);

  // 2) Soft halo for a subtle glow
  const ringGlowGeo = new THREE.RingGeometry(
    Math.max(0.001, radius - thickness * 6),
    radius + thickness * 6,
    128
  );
  const ringGlowMat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: glow,               // soft
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const ringGlow = new THREE.Mesh(ringGlowGeo, ringGlowMat);
  ringGlow.rotation.x = Math.PI / 2;
  group.add(ringGlow);

  // Render a bit before other transparent stuff, and never occlude
  group.children.forEach(m => { m.renderOrder = 1; m.frustumCulled = false; });

  scene.add(group);
  return group;
}

const ORBIT_COLOR = 0xe5d352;
// Create one ring per moon radius (matches your radii: 5, 6.5, 8, 9.5, 11)
const orbitRings = [];
moons.forEach(moon => {
  const r = moon.userData.radius;
  orbitRings.push(addOrbitRing(r, ORBIT_COLOR, 0.025, 0.18));
});


//////
// ===================
//  Focus helpers
// ===================
function focusCameraOnMoon(index) {
  if (!moons[index]) return;
  currentMoonIndex = index;
  focusOnMoon = true;
  focusOnStar = false;
  focusHome   = false;

  if (!satellite) {
    const gltfLoader  = new THREE.GLTFLoader();
    const dracoLoader = new THREE.DRACOLoader();
    dracoLoader.setDecoderPath("https://cdn.jsdelivr.net/npm/three@0.146.0/examples/js/libs/draco/");
    gltfLoader.setDRACOLoader(dracoLoader);

    gltfLoader.load("satellite.glb", (gltf) => {
      satellite = gltf.scene;
      satellite.scale.set(0.2, 0.2, 0.2);
      camera.add(satellite);
      satellite.position.set(-2, 0, -3);
      satellite.visible = true;
    }, undefined, err => console.error(err));
  } else {
    satellite.visible = true;
  }
}

// ===================
//  Top Menu Wiring
// ===================
document.getElementById("home-button")?.addEventListener("click", (e) => {
  e.preventDefault();
  hideAllOverlays();
  showHomeOverlay();

  focusOnStar = false;
  focusOnMoon = false;
  focusHome   = true;

  if (satellite) satellite.visible = false;
});

document.getElementById("projects-button")?.addEventListener("click", (e) => {
  e.preventDefault();
  hideAllOverlays();
  focusCameraOnMoon(0);
  ProjectViewer.open('bioinformatics');
});

// Optional close buttons if present
document.getElementById("projects-close")?.addEventListener("click", hideProjectsOverlay);
document.getElementById("home-close")?.addEventListener("click", hideHomeOverlay);

document.getElementById("contact-button")?.addEventListener("click", (e) => {
  e.preventDefault();
  hideAllOverlays();
  focusCameraOnMoon(4);
  showContactOverlay();
});

document.getElementById("work-button")?.addEventListener("click", (e) => {
  e.preventDefault();
  hideAllOverlays();
  focusCameraOnMoon(3);
  showWorkOverlay();
});

// ===================
//  Animation Loop
// ===================
function animate() {
  requestAnimationFrame(animate);
  controls.update();

  // --- INTRO DOLLY: run once on load, then stop ---
  if (introActive) {
    intro.t = Math.min(1, intro.t + (1 / (intro.duration * 60))); // progress 0..1
    const k = easeInOutCubic(intro.t);

    const camPos = new THREE.Vector3().copy(intro.startPos).lerp(homeCamPos, k);
    const camTgt = new THREE.Vector3().copy(intro.startTarget).lerp(homeCamTarget, k);

    camera.position.copy(camPos);
    controls.target.copy(camTgt);
    controls.update();

    if (intro.t >= 1) {
      camera.position.copy(homeCamPos);
      controls.target.copy(homeCamTarget);
      controls.enabled = true;
      controls.update();
      introActive = false;
    }
  }

  // Update twinkle time uniform on all star materials
  const t = performance.now() * 0.001;
  starfieldGroup.traverse((obj) => {
    if (obj.isPoints && obj.userData.isTwinklePoints && obj.material && obj.material.uniforms?.uTime) {
      obj.material.uniforms.uTime.value = t;
    }
  });

  // Rotate sun
  sphere.rotation.y += 0.001;

  // Pulse sun glow — subtle breathe effect
  const sunPulse = 1.0 + 0.06 * Math.sin(t * 0.9);
  const sunPulse2 = 1.0 + 0.04 * Math.sin(t * 0.6 + 1.2);
  sunGlowSprite.scale.set(14 * sunPulse,  14 * sunPulse,  1);
  sunHaloSprite.scale.set(28 * sunPulse2, 28 * sunPulse2, 1);
  sunAtmoSprite.scale.set(52 * sunPulse,  52 * sunPulse,  1);
  // MeshBasicMaterial — brightness is pure color, no emissive needed

  // Drift stars
  starfieldGroup.rotation.y += _starSpin.y;
  starfieldGroup.rotation.x += _starSpin.x;

  // Shooting stars
  const dt = Math.min(0.05, 1/60);   // capped delta — safe on slow frames
  shooters.forEach(s => updateShooter(s, dt));

  // Orbit moons
  moons.forEach((moon, idx) => {
    moon.userData.angle += moon.userData.speed;
    const x = Math.cos(moon.userData.angle) * moon.userData.radius;
    const z = Math.sin(moon.userData.angle) * moon.userData.radius;
    moon.position.set(x, 0, z);

    // CV moon (index 2) — continuous self-rotation
    if (idx === 2 && moon.userData.isGLB) {
      moon.rotation.y += 0.018;
      moon.rotation.z += 0.008;
    }

    // Bio moon (index 0) — dramatic breathing pulse
    if (idx === 0 && moon.userData.isGLB && moon.userData.baseScale) {
      const base  = moon.userData.baseScale;
      const pulse = base * (1.0 + 0.6 * Math.sin(t * 1.2));
      moon.scale.set(pulse, pulse, pulse);
    }
  });

  // Hover highlight
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects([sphere, ...moons]);

  if (hoveredObject && !hits.find(i => i.object === hoveredObject)) {
    hoveredObject.scale.set(1, 1, 1);
    if (hoveredObject.material && hoveredObject.material.emissive) {
      hoveredObject.material.emissive.set(0x000000);
    }
    hoveredObject = null;
  }

  if (hits.length) {
    const obj = hits[0].object;
    if (obj !== hoveredObject) {
      if (hoveredObject) {
        hoveredObject.scale.set(1,1,1);
        if (hoveredObject.material && hoveredObject.material.emissive) {
          hoveredObject.material.emissive.set(0x000000);
        }
      }
      hoveredObject = obj;
      hoveredObject.scale.set(1.05, 1.05, 1.05);
      if (hoveredObject.material && hoveredObject.material.emissive) {
        hoveredObject.material.emissive.set(0xffff66);
      }
    }
  }

  // Follow the selected moon when focused (skip during intro)
  if (!introActive && focusOnMoon && moons[currentMoonIndex]) {
    const moonPos = moons[currentMoonIndex].position;
    const desiredCam = moonPos.clone().add(new THREE.Vector3(0, 0.5, 1.5));
    camera.position.lerp(desiredCam, 0.05);
    controls.target.lerp(moonPos, 0.05);
    controls.update();
  }

  // Optional zoom-in on star
  if (!introActive && focusOnStar) {
    camera.position.lerp(targetPosition, 0.01);
    camera.lookAt(0, 3, 0);
  }

  // Smooth return home
  if (!introActive && focusHome) {
    camera.position.lerp(homeCamPos, 0.05);
    controls.target.lerp(homeCamTarget, 0.05);
    controls.update();
    if (camera.position.distanceTo(homeCamPos) < 0.01) {
      camera.position.copy(homeCamPos);
      controls.target.copy(homeCamTarget);
      controls.update();
      focusHome = false;
    }
  }

  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}

function goHomeAndClear() {
  hideAllOverlays();
  focusOnMoon = false;
  focusOnStar = false;
  focusHome   = true;
  if (satellite) satellite.visible = false;
}

// ===================
//  Events
// ===================
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") goHomeAndClear();
});

window.addEventListener("mousemove", (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

window.addEventListener("click", () => {
  raycaster.setFromCamera(mouse, camera);

  // 1) Sun → Home overlay + return home
  const sunHits = raycaster.intersectObject(sphere, false);
  if (sunHits.length > 0) {
    openSection("home");
    focusOnMoon = false;
    focusOnStar = false;
    focusHome   = true;
    if (satellite) satellite.visible = false;
    return;
  }

  // 2) Moons → open the mapped overlay + fly camera
  const moonHits = raycaster.intersectObjects(moons, false);
  if (moonHits.length > 0) {
    const hit = moonHits[0].object;
    const idx = moons.indexOf(hit);
    if (idx !== -1) {
      focusCameraOnMoon(idx);
      const section = MOON_TO_SECTION[idx] || hit.userData.section;
      if      (section === 'bioinformatics') { hideAllOverlays(); focusCameraOnMoon(idx); ProjectViewer.open('bioinformatics'); }
      else if (section === 'srs')           { hideAllOverlays(); focusCameraOnMoon(idx); ProjectViewer.open('srs'); }
      else if (section === 'cv')            { hideAllOverlays(); focusCameraOnMoon(idx); ProjectViewer.open('cv'); }
      else if (section === 'work')          { hideAllOverlays(); focusCameraOnMoon(idx); showWorkOverlay(); }
      else if (section === 'contact')       { hideAllOverlays(); focusCameraOnMoon(idx); showContactOverlay(); }
      else hideAllOverlays();
    }
    return;
  }
});

// ===================
//  Projects Data
// ===================
const CATEGORY_PROJECTS = {
  bioinformatics: [
    { title: "Full genome sequence CPV", url: "https://link.springer.com/content/pdf/10.1186/s12985-023-02102-2.pdf", img: "cpv.png" },
    { title: "miRNA targeting", url: "https://www.sciencedirect.com/science/article/pii/S2405580823001000", img: "mt.png" },
    { title: "Toxin–antitoxin sequence", url: "https://scholar.google.com/scholar?oi=bibs&cluster=2667093651387999319&btnI=1&hl=en", img: "tat.png" },
    { title: "Liver tissue transcriptome data analysis", url: "https://scholar.google.com/scholar?oi=bibs&cluster=7009121602870455185&btnI=1&hl=en", img: "lt.png" },
    { title: "Oxidative stress biomarkers", url: "https://archrazi.areeo.ac.ir/article_132302_bce77b696b418027013fb1808a67aa24.pdf", img: "so.png" },
    { title: "miRNA in breast cancer", url: "https://www.frontiersin.org/journals/immunology/articles/10.3389/fimmu.2024.1333563/full", img: "mb.png" }
  ],
  cv: [
    { title: "AI-Driven Autonomous Driving", img: "self_d.jpg", desc: "Improved an object detection model under hard conditions — low light, rain, and occlusion — for robust autonomous vehicle perception." },
    { title: "Nucleus-to-cytoplasm ratio in blood images", img: "blood.png", desc: "Segmentation and quantitative analysis of blood cell images for diagnostic research." },
    { title: "CT Scan Foreign Object Detection", img: "fro.png", desc: "A fast-pass approach using few-shot learning to train a foreign object detection model directly on CT scan data with minimal annotations." },
    { title: "Pose Estimation on Cattle", img: "pos.mp4", desc: "Built computer vision software to detect and score BCS (Body Condition Score) and lameness using joint tracking on livestock." },
    { title: "Zebrafish Tracking", img: "traking.mp4", desc: "Built a pipeline using only classical image processing — zero AI — to track a zebrafish through microscopic video footage." }
  ],
  srs: [
    { title: "SPEXone georegistration", img: "spex_1.png", desc: "Georegistration of SPEX airborne data using keypoint registration." },
    { title: "NH₃ super-resolution", img: "thesis_1.png", desc: "Predicting NH₃ at higher resolution from CH₄ and NO₂." }
  ]
};

// ===================
//  Desktop Drawer
// ===================
function openProjectsDrawer(categoryKey){
  if (categoryKey === 'srs') { SRSViewer.show(); return; }
  const overlay = document.getElementById('projects-overlay');
  const drawer  = document.getElementById('projects-drawer');
  const list    = document.getElementById('project-list');
  const title   = document.getElementById('drawer-title');
  if (!overlay || !drawer || !list || !title) return;

  const titleMap = {
    bioinformatics: 'Bioinformatics Projects',
    cv:             'Computer Vision Projects',
    srs:            'Satellite Remote Sensing Projects'
  };
  title.textContent = titleMap[categoryKey] || 'Projects';

  list.innerHTML = '';
  const items = CATEGORY_PROJECTS[categoryKey] || [];
  items.forEach(entry => {
    const isObj = entry && typeof entry === 'object';
    const name  = isObj ? entry.title : String(entry);
    const url   = isObj ? entry.url   : null;
    const img   = isObj ? entry.img   : "";
    const desc  = isObj ? (entry.desc || entry.description || "") : "";

    const card = document.createElement('article');
    card.className = 'project-item';
    card.setAttribute('role', 'listitem');

    let media = "";
    if (img && (/\.(mp4|webm)$/i.test(img))) {
      media = `<video class="project-thumb" src="${img}" autoplay loop muted playsinline></video>`;
    } else if (img) {
      media = `<img class="project-thumb" src="${img}" alt="${name}">`;
    }

    const inner = `${media}<h4>${name}</h4>${desc ? `<p class="desc">${desc}</p>` : ''}`;

    if (url) {
      card.innerHTML =
        `<a class="project-link" href="${url}" target="_blank" rel="noopener noreferrer" aria-label="${name} (opens in new tab)">
          ${inner}
          <div class="meta">Open link</div>
        </a>`;
      card.querySelector('a').addEventListener('click', e => e.stopPropagation());
    } else {
      card.innerHTML = `${inner}<div class="meta"></div>`;
    }

    list.appendChild(card);
  });

  overlay.classList.add('shifted');
  drawer.classList.add('open');
  drawer.setAttribute('aria-hidden', 'false');
  list.scrollTop = 0;
}

function closeProjectsDrawer(){
  const overlay = document.getElementById('projects-overlay');
  const drawer  = document.getElementById('projects-drawer');
  if (!drawer) return;
  drawer.classList.remove('open');
  drawer.setAttribute('aria-hidden', 'true');
  if (overlay) overlay.classList.remove('shifted');
}

// Close drawer with the X (if present)
document.getElementById('drawer-close')?.addEventListener('click', closeProjectsDrawer);

// Click background of the overlay closes drawer
document.getElementById('projects-overlay')?.addEventListener('click', (e) => {
  const drawer = document.getElementById('projects-drawer');
  if (!drawer) return;
  const clickedInsideDrawer = drawer.contains(e.target);
  const clickedCard = e.target.closest && e.target.closest('.project-card');
  if (!clickedInsideDrawer && !clickedCard) closeProjectsDrawer();
});

// ===================
//  Mobile hamburger
// ===================
const hamburger   = document.getElementById('hamburger');
const mobileNav   = document.getElementById('mobile-nav');
const mobileClose = document.getElementById('mobile-close');

function openMobileNav() {
  if (!mobileNav) return;
  mobileNav.classList.add('open');
  mobileNav.setAttribute('aria-hidden', 'false');
  hamburger?.setAttribute('aria-expanded', 'true');
}
function closeMobileNav() {
  if (!mobileNav) return;
  mobileNav.classList.remove('open');
  mobileNav.setAttribute('aria-hidden', 'true');
  hamburger?.setAttribute('aria-expanded', 'false');
}
hamburger?.addEventListener('click', (e) => {
  e.stopPropagation();
  if (mobileNav?.classList.contains('open')) closeMobileNav();
  else openMobileNav();
});
mobileClose?.addEventListener('click', closeMobileNav);
document.querySelectorAll('.mobile-link').forEach(a => {
  a.addEventListener('click', () => {
    const targetId = a.getAttribute('data-target');
    document.getElementById(targetId)?.click();
    closeMobileNav();
  });
});
window.addEventListener('click', (e) => {
  if (!mobileNav?.classList.contains('open')) return;
  if (!mobileNav.contains(e.target) && e.target !== hamburger) closeMobileNav();
});
['projects-button','work-button','contact-button','home-button'].forEach(id=>{
  document.getElementById(id)?.addEventListener('click', () => { if (mobileNav?.classList.contains('open')) closeMobileNav(); });
});

// ===================
//  Mobile/Desktop project panels
// ===================
const MOBILE_BP = 720;
const isMobile = () => window.innerWidth < MOBILE_BP;

function buildProjectNode(entry) {
  const isObj = entry && typeof entry === 'object';
  const name  = isObj ? (entry.title || entry.name || 'Project') : String(entry);
  const url   = isObj ? entry.url   : null;
  const img   = isObj ? (entry.img || entry.image || "") : "";
  const desc  = isObj ? (entry.desc || entry.description || "") : "";

  const node = document.createElement('article');
  node.className = 'project-item';
  node.setAttribute('role', 'listitem');

  let media = '';
  if (img) {
    if (/\.(mp4|webm)$/i.test(img)) {
      media = `<video class="project-thumb" src="${img}" autoplay loop muted playsinline></video>`;
    } else {
      media = `<img class="project-thumb" src="${img}" alt="${name}">`;
    }
  }

  const inner = `${media}<h4>${name}</h4>${desc ? `<p class="desc">${desc}</p>` : ''}`;
  if (url) {
    node.innerHTML = `<a class="project-link" href="${url}" target="_blank" rel="noopener noreferrer" aria-label="${name} (opens in new tab)">${inner}</a>`;
    node.querySelector('a').addEventListener('click', e => e.stopPropagation());
  } else {
    node.innerHTML = inner;
  }
  return node;
}

function fillPanel(panel, key) {
  if (panel.dataset.filled === '1') return;
  const data = CATEGORY_PROJECTS[key] || [];
  data.forEach(entry => panel.appendChild(buildProjectNode(entry)));
  panel.dataset.filled = '1';
}

(function bindProjectCards() {
  const cards = document.querySelectorAll('.project-card[data-key]');
  cards.forEach(card => {
    if (card.dataset.bound === '1') return;
    card.dataset.bound = '1';

    card.addEventListener('click', () => {
      const key = card.getAttribute('data-key');
      if (!key) return;

      if (!isMobile()) {
        openProjectsDrawer(key);
        return;
      }

      let panel = card.querySelector('.mobile-panel');
      if (!panel) {
        panel = document.createElement('div');
        panel.className = 'mobile-panel';
        card.appendChild(panel);
      }

      fillPanel(panel, key);

      const willOpen = !card.classList.contains('open');
      document.querySelectorAll('.project-card.open').forEach(c => { if (c !== card) c.classList.remove('open'); });
      card.classList.toggle('open', willOpen);

      if (willOpen) {
        setTimeout(() => card.scrollIntoView({ behavior: 'smooth', block: 'start' }), 40);
      }
    });
  });
})();

// ===================
//  Start!
animate();


// ===================
//  AI Chat UI Wiring
// ===================

const aiToggle = document.getElementById("ai-toggle");
const aiChat   = document.getElementById("ai-chat");
const aiMsgs   = document.getElementById("ai-messages");
const aiInput  = document.getElementById("ai-text");
const aiSend   = document.getElementById("ai-send");
const aiRobot  = document.getElementById("ai-robot");
const robotImg = document.getElementById("robot-img");

function robotIdle()  { if(aiRobot) aiRobot.style.display = "flex"; if(robotImg) robotImg.src = "rocket.gif"; }
function robotHide()  { if(aiRobot) aiRobot.style.display = "none"; }

aiToggle.addEventListener("click", () => {
  const isOpen = aiChat.style.display === "flex";
  aiChat.style.display = isOpen ? "none" : "flex";
  aiChat.setAttribute("aria-hidden", isOpen ? "true" : "false");
  if (!isOpen) robotIdle(); else robotHide();
});

let aiBusy = false;
let llm = null;
let loadingModel = false;

async function loadLLM() {
  if (llm || loadingModel) return;
  loadingModel = true;
  aiMsgs.innerHTML += `<div><em>Loading AI model…</em></div>`;
  aiMsgs.scrollTop = aiMsgs.scrollHeight;
  llm = await window.pipeline("text2text-generation", "Xenova/flan-t5-small");
  aiMsgs.innerHTML += `<div><em>AI ready ✅</em></div>`;
  aiMsgs.scrollTop = aiMsgs.scrollHeight;
}

async function sendAIMessage() {
  if (aiBusy) return;
  const text = aiInput.value.trim();
  if (!text) return;
  aiBusy = true;
  aiMsgs.innerHTML += `<div><strong>You:</strong> ${text}</div>`;
  aiInput.value = "";
  aiMsgs.scrollTop = aiMsgs.scrollHeight;
  await loadLLM();
  robotIdle();
  const thinking = document.createElement("div");
  thinking.innerHTML = "<em>thinking...</em>";
  aiMsgs.appendChild(thinking);
  aiMsgs.scrollTop = aiMsgs.scrollHeight;
  const result = await llm(`"${text}"`, { max_new_tokens: 35 });
  thinking.remove();
  aiMsgs.innerHTML += `<div><strong>AI:</strong> ${result[0].generated_text}</div>`;
  aiMsgs.scrollTop = aiMsgs.scrollHeight;
  aiBusy = false;
}

aiSend.addEventListener("click", sendAIMessage);
aiInput.addEventListener("keydown", (e) => { if (e.key === "Enter") sendAIMessage(); });



// ===================
//  Mission Terminal
// ===================
const MissionTerminal = (() => {
  const LINES = [
    { prefix: "SYS",  text: "INITIALIZING DOSSIER...",              delay: 0   },
    { prefix: "ID",   text: "SAJED SARABANDI",                       delay: 320 },
    { prefix: "LOC",  text: "ARNHEM, NETHERLANDS",                   delay: 260 },
    { prefix: "ROLE", text: "SOFTWARE ENGINEER",                     delay: 260 },
    { prefix: "SPEC", text: "COMPUTER VISION",                       delay: 240 },
    { prefix: "SPEC", text: "SATELLITE REMOTE SENSING",              delay: 200 },
    { prefix: "SPEC", text: "BIOINFORMATICS",                        delay: 200 },
    { prefix: "LANG", text: "PYTHON  /  C++  /  JAVASCRIPT",         delay: 260 },
    { prefix: "EDU",  text: "M.SC. GEOMATICS — TU DELFT",            delay: 260 },
    { prefix: "EXP",  text: "SRON SPACE RESEARCH  |  VEERASENSE",    delay: 260 },
    { prefix: "STAT", text: "AVAILABLE FOR NEW MISSIONS",            delay: 300 },
    { prefix: "SYS",  text: "DOSSIER COMPLETE. AWAITING INPUT...",   delay: 340 },
  ];

  const CHAR_SPEED   = 28;   // ms per character
  const BLINK_AFTER  = 400;  // ms before cursor starts blinking at end of line

  let frameId    = null;
  let lineTimers = [];
  let charTimers = [];

  function getEl() { return document.getElementById('mission-terminal'); }

  function prefixColor(p) {
    if (p === 'SYS')  return '#00d9c0';
    if (p === 'STAT') return '#e5d352';
    if (p === 'SPEC') return '#7fa8c9';
    return '#00d9c0';
  }

  function typeInto(lineEl, textEl, fullText, cb) {
    let i = 0;
    function tick() {
      if (i <= fullText.length) {
        textEl.textContent = fullText.slice(0, i);
        i++;
        charTimers.push(setTimeout(tick, CHAR_SPEED));
      } else {
        charTimers.push(setTimeout(() => {
          lineEl.classList.add('done');
          if (cb) cb();
        }, BLINK_AFTER));
      }
    }
    tick();
  }

  function play() {
    stop();
    const el = getEl();
    if (!el) return;
    el.innerHTML = '';

    let cumulativeDelay = 200;

    LINES.forEach((entry, idx) => {
      cumulativeDelay += entry.delay;
      const d = cumulativeDelay;

      lineTimers.push(setTimeout(() => {
        const row = document.createElement('div');
        row.className = 'tm-line';

        const pfx = document.createElement('span');
        pfx.className = 'tm-prefix';
        pfx.textContent = entry.prefix;
        pfx.style.color = prefixColor(entry.prefix);

        const sep = document.createElement('span');
        sep.className = 'tm-sep';
        sep.textContent = ' › ';

        const txt = document.createElement('span');
        txt.className = 'tm-text';

        const cur = document.createElement('span');
        cur.className = 'tm-cursor';
        cur.textContent = '█';

        row.appendChild(pfx);
        row.appendChild(sep);
        row.appendChild(txt);
        row.appendChild(cur);
        el.appendChild(row);

        // scroll into view
        row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });

        typeInto(row, txt, entry.text, () => {
          cur.classList.add('blink');
        });

        // hide cursor on all previous lines once next line starts typing
        if (idx > 0) {
          const prev = el.querySelectorAll('.tm-cursor');
          prev.forEach((c, ci) => { if (ci < prev.length - 1) c.style.display = 'none'; });
        }
      }, d));

      cumulativeDelay += entry.text.length * CHAR_SPEED + BLINK_AFTER;
    });
  }

  function stop() {
    lineTimers.forEach(clearTimeout);
    charTimers.forEach(clearTimeout);
    lineTimers = [];
    charTimers = [];
    if (frameId) { cancelAnimationFrame(frameId); frameId = null; }
    const el = getEl();
    if (el) el.innerHTML = '';
  }

  return { play, stop };
})();

// ===================
//  SRS Image Viewer — clock arc
// ===================
const SRSViewer = (() => {
  const SATELLITES = [
    {
      img: 'landsat.png',
      name: 'Landsat',
      tag: 'USGS / NASA',
      desc: 'Monthly reconstruction of data-gap-free, cloud-free surface reflectance composites at 30 m resolution.'
    },
    {
      img: 'sentinel2.png',
      name: 'Sentinel-2',
      tag: 'ESA Copernicus',
      desc: 'Object detection on reconstructed agricultural farms using 10 m resolution multispectral imagery.'
    },
    {
      img: 'spex_1.png',
      name: 'Sentinel-5P / SPEXone',
      tag: 'ESA / SRON',
      desc: 'Shift detection on the SPEXone airborne polarimeter instrument for accurate georegistration.'
    },
    {
      img: 'thesis_1.png',
      name: 'Suomi NPP',
      tag: 'NASA / NOAA',
      desc: 'Super-resolution deep learning model for ammonia (NH₃) concentration retrieval from coarse satellite data.'
    },
    {
      img: 'metop.png',
      name: 'MetOp',
      tag: 'EUMETSAT / ESA',
      desc: 'Global fire and flood monitoring using thermal infrared and microwave channels for disaster response.'
    }
  ];

  let current = 0;
  let open    = false;
  let cooling = false;
  let current_el = null;

  const viewer  = () => document.getElementById('srs-viewer');
  const textPanel = () => document.getElementById('srs-text-panel');

  function updateText(idx) {
    const panel = textPanel();
    if (!panel) return;
    const sat = SATELLITES[idx];
    panel.innerHTML = `
      <div class="srs-counter">${idx + 1} / ${SATELLITES.length}</div>
      <div class="srs-sat-tag">${sat.tag}</div>
      <div class="srs-sat-name">${sat.name}</div>
      <p class="srs-sat-desc">${sat.desc}</p>
      <div class="srs-nav-hint">scroll to navigate</div>
    `;
    panel.classList.remove('srs-text-out');
    panel.classList.add('srs-text-in');
    // reset animation next time
    void panel.offsetWidth;
  }

  function makeItem(sat) {
    const wrap = document.createElement('div');
    wrap.className = 'srs-arc-wrap';
    const item = document.createElement('div');
    item.className = 'srs-arc-item';
    const img = document.createElement('img');
    img.src = sat.img;
    img.alt = sat.name;
    item.appendChild(img);
    wrap.appendChild(item);
    return { wrap, item };
  }

  function show() {
    open = true;
    current = 0;
    const v = viewer();
    if (!v) return;
    v.innerHTML = '';
    v.classList.add('open');

    const panel = textPanel();
    if (panel) panel.classList.add('open');

    const { wrap, item } = makeItem(SATELLITES[current]);
    item.classList.add('entering');
    item.addEventListener('animationend', () => {
      item.classList.remove('entering');
      item.classList.add('at-rest');
    }, { once: true });
    v.appendChild(wrap);
    current_el = { wrap, item };
    updateText(current);
  }

  function hide() {
    open = false;
    const v = viewer();
    if (!v) return;
    v.classList.remove('open');
    v.innerHTML = '';
    current_el = null;
    const panel = textPanel();
    if (panel) { panel.classList.remove('open'); panel.innerHTML = ''; }
  }

  function go(dir) {
    if (!open || cooling) return;
    cooling = true;
    setTimeout(() => { cooling = false; }, 620);

    const v = viewer();
    if (!v) return;

    // Exit current
    if (current_el) {
      const { item: old_item, wrap: old_wrap } = current_el;
      old_item.classList.remove('at-rest');
      old_item.classList.add('exiting');
      old_item.addEventListener('animationend', () => old_wrap.remove(), { once: true });
    }

    // Advance index
    current = ((current + dir) % SATELLITES.length + SATELLITES.length) % SATELLITES.length;

    // Enter new
    const { wrap, item } = makeItem(SATELLITES[current]);
    item.classList.add('entering');
    v.appendChild(wrap);
    current_el = { wrap, item };

    // Animate text out then in
    const panel = textPanel();
    if (panel) {
      panel.classList.remove('srs-text-in');
      panel.classList.add('srs-text-out');
      setTimeout(() => updateText(current), 200);
    }
  }

  window.addEventListener('wheel', (e) => {
    if (!open) return;
    e.preventDefault();
    go(e.deltaY > 0 ? 1 : -1);
  }, { passive: false });

  return { show, hide };
})();

// ===================
//  Project Viewer — image arc carousel (Bio / CV / SRS)
// ===================
const ProjectViewer = (() => {
  let current     = 0;
  let currentCat  = null;
  let current_el  = null;
  let open        = false;
  let cooling     = false;

  const viewer  = () => document.getElementById('project-viewer');
  const switcher= () => document.getElementById('cat-switcher');
  const cvPanel = () => document.getElementById('cv-text-panel');

  // Get images for a category
  function getImages(cat) {
    if (cat === 'srs') return [
      { img: 'spex_1.png',  title: 'SPEXone Georegistration' },
      { img: 'thesis_1.png',title: 'NH₃ Super-Resolution' }
    ];
    return (CATEGORY_PROJECTS[cat] || [])
      .filter(e => e && e.img)
      .map(e => ({ img: e.img, title: e.title || e.name || '', url: e.url || null, desc: e.desc || '' }));
  }

  function updateCVText(images, idx) {
    const panel = cvPanel();
    if (!panel) return;
    const entry = images[idx];
    const total = images.length;
    panel.innerHTML = `
      <div class="cv-counter">${idx + 1} / ${total}</div>
      <div class="cv-proj-tag">Computer Vision</div>
      <div class="cv-proj-name">${entry.title}</div>
      <p class="cv-proj-desc">${entry.desc}</p>
      <div class="cv-nav-hint">scroll to navigate</div>
    `;
    panel.classList.remove('cv-text-out');
    panel.classList.add('cv-text-in');
    void panel.offsetWidth;
  }

  function makeItem(entry) {
    const wrap = document.createElement('div');
    wrap.className = 'pv-arc-wrap';

    const item = document.createElement(entry.url ? 'a' : 'div');
    item.className = 'pv-arc-item pv-active';
    if (entry.url) {
      item.href = entry.url;
      item.target = '_blank';
      item.rel = 'noopener noreferrer';
    }

    const isVideo = entry.img && entry.img.toLowerCase().endsWith('.mp4');
    if (isVideo) {
      const vid = document.createElement('video');
      vid.src = entry.img;
      vid.autoplay = true;
      vid.loop = true;
      vid.muted = true;
      vid.playsInline = true;
      vid.setAttribute('playsinline', '');
      vid.className = 'pv-video';
      item.appendChild(vid);
    } else {
      const img = document.createElement('img');
      img.src = entry.img;
      img.alt = entry.title || '';
      item.appendChild(img);
    }

    if (entry.title) {
      const cap = document.createElement('div');
      cap.className = 'pv-caption';
      cap.textContent = entry.title;
      item.appendChild(cap);
    }

    wrap.appendChild(item);
    return { wrap, item };
  }

  function showImage(cat, idx) {
    const v = viewer();
    if (!v) return;
    const images = getImages(cat);
    if (!images.length) return;
    const entry = images[idx % images.length];

    // Exit current
    if (current_el) {
      const { item: old_item, wrap: old_wrap } = current_el;
      old_item.classList.remove('at-rest');
      old_item.classList.add('exiting');
      old_item.addEventListener('animationend', () => old_wrap.remove(), { once: true });
    }

    const { wrap, item } = makeItem(entry);
    item.classList.add('entering');
    v.appendChild(wrap);
    current_el = { wrap, item };

    // Update CV text panel if in cv mode
    if (cat === 'cv') updateCVText(images, idx % images.length);
  }

  function openCat(cat) {
    currentCat = cat;
    current    = 0;
    open       = true;
    current_el = null;

    const v = viewer();
    if (v) { v.innerHTML = ''; v.classList.add('open'); }

    // Show/hide CV text panel
    const panel = cvPanel();
    if (panel) {
      if (cat === 'cv') { panel.classList.add('open'); }
      else              { panel.classList.remove('open'); panel.innerHTML = ''; }
    }

    // Show SRS viewer for remote sensing, image arc for others
    if (cat === 'srs') {
      if (v) v.classList.remove('open'); // hide left arc
      SRSViewer.show();
    } else {
      SRSViewer.hide();
      showImage(cat, 0);
    }

    // Category switcher
    const sw = switcher();
    if (sw) {
      sw.classList.add('open');
      sw.querySelectorAll('.cat-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.cat === cat);
      });
    }
  }

  function go(dir) {
    if (!open || cooling || currentCat === 'srs') return;
    cooling = true;
    setTimeout(() => { cooling = false; }, 620);
    const images = getImages(currentCat);
    current = ((current + dir) % images.length + images.length) % images.length;

    // Animate CV text out then in
    if (currentCat === 'cv') {
      const panel = cvPanel();
      if (panel) {
        panel.classList.remove('cv-text-in');
        panel.classList.add('cv-text-out');
        setTimeout(() => updateCVText(images, current), 200);
      }
    }

    showImage(currentCat, current);
  }

  function close() {
    open = false;
    current_el = null;
    const v = viewer(), sw = switcher();
    if (v) { v.classList.remove('open'); v.innerHTML = ''; }
    if (sw) sw.classList.remove('open');
    SRSViewer.hide();
    const panel = cvPanel();
    if (panel) { panel.classList.remove('open'); panel.innerHTML = ''; }
  }

  // Cat → moon index map
  const CAT_MOON = { bioinformatics: 0, srs: 1, cv: 2 };

  // Wire category tabs
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.cat-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const cat = tab.dataset.cat;
        current_el = null;
        const v = viewer();
        if (v) v.innerHTML = '';
        // Move camera to the matching moon
        const moonIdx = CAT_MOON[cat];
        if (moonIdx !== undefined) focusCameraOnMoon(moonIdx);
        openCat(cat);
      });
    });
  });

  // Scroll
  window.addEventListener('wheel', (e) => {
    if (!open || currentCat === 'srs') return;
    e.preventDefault();
    go(e.deltaY > 0 ? 1 : -1);
  }, { passive: false });

  return { open: openCat, close, get isOpen() { return open; } };
})();