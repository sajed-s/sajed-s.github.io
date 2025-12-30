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

const renderer  = new THREE.WebGLRenderer({ antialias: true });
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
const SECTION_TO_MOON = { projects: 0, work: 1, contact: 2 };
const MOON_TO_SECTION = { 0: "projects", 1: "work", 2: "contact" };

// --- INTRO DOLLY: camera starts far and glides to "home" ---
let introActive = true;
const intro = {
  t: 0,
  duration: 9,                               // seconds
  startPos: new THREE.Vector3(0, 6, 305),       // starting camera position
  startTarget: new THREE.Vector3(0, 1, 0.25)      // starting look-at target
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
renderer.setClearColor(0x071122, 1); // dark blue

// 2) Star sprite generators (CanvasTexture)
function makeStarTexture(hex, innerAlpha = 0.8) {
  const size = 32;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');

  const r = (hex >> 16) & 255, g = (hex >> 8) & 255, b = hex & 255;
  const grad = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  grad.addColorStop(0.00, `rgba(${r},${g},${b},${innerAlpha})`);
  grad.addColorStop(0.22, `rgba(${r},${g},${b},0.22)`);
  grad.addColorStop(1.00, `rgba(0,0,0,0)`);

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/2, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return tex;
}

// CRISP star: white-hot core + thin colored rim
function makeCrispStarTexture(hex, size = 16) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');

  const r = (hex >> 16) & 255, g = (hex >> 8) & 255, b = hex & 255;
  const cx = size / 2, cy = size / 2;

  ctx.clearRect(0, 0, size, size);

  const core = Math.max(1, Math.floor(size * 0.22));
  ctx.fillStyle = 'rgba(255,255,255,1)';
  ctx.beginPath();
  ctx.arc(cx, cy, core, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = `rgba(${r},${g},${b},1)`;
  ctx.lineWidth = Math.max(1, Math.round(size * 0.06));
  ctx.beginPath();
  ctx.arc(cx, cy, core + ctx.lineWidth * 0.6, 0, Math.PI * 2);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return tex;
}

const starTexWhite        = makeStarTexture(0xffffff, 1.0);
const starTexCyan         = makeStarTexture(0x00ffff, 1.0);
const starTexRedSharp     = makeStarTexture(0xff5544, 5);   // FIXED: use crisp
const starTexOrangeSharp  = makeStarTexture(0xffaa33, 5);   // FIXED: use crisp

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

// fewer points
const WHITE_COUNT  = IS_MOBILE ? 600 : 1000;
const CYAN_COUNT   = IS_MOBILE ? 120 : 200;
const RED_COUNT    = IS_MOBILE ? 25  : 50;
const ORANGE_COUNT = IS_MOBILE ? 30  : 60;

// Stars
const starsWhite = makeStars({
  count: WHITE_COUNT,
  minR: 40, maxR: 250,
  sizePx: 10,
  texture: starTexWhite,
  opacity: 0.8,
  additive: true
});
const starsCyan = makeStars({
  count: CYAN_COUNT,
  minR: 10, maxR: 180,
  sizePx: 8,
  texture: starTexCyan,
  opacity: 0.65,
  additive: true
});
const starsRed = makeStars({
  count: RED_COUNT,
  minR: 10, maxR: 50,
  sizePx: 2,                 // smaller
  texture: starTexRedSharp,
  opacity: 0.55,
  additive: true,
  twinkleRatio: 0.18
});

const starsOrange = makeStars({
  count: ORANGE_COUNT,
  minR: 10, maxR: 50,
  sizePx: 2,                 // smaller
  texture: starTexOrangeSharp,
  opacity: 0.65,
  additive: true,
  twinkleRatio: 0.18
});

starfieldGroup.add(starsCyan, starsWhite, starsRed, starsOrange);

// Halo layers (fast glow)
const haloWhite  = makeHaloLayer(starsWhite,  starTexWhite,        2.2, 0.32);
const haloCyan   = makeHaloLayer(starsCyan,   starTexCyan,         2.2, 0.28);
const haloRed    = makeHaloLayer(starsRed,    starTexRedSharp,     2.1, 0.26);
const haloOrange = makeHaloLayer(starsOrange, starTexOrangeSharp,  2.1, 0.30);
starfieldGroup.add(haloWhite, haloCyan, haloRed, haloOrange);

// Optional: gentle drift/rotation
const _starSpin = { y: 0.00015, x: 0.00003 };

// ---- Sun ----
const sunGeo = new THREE.SphereGeometry(2, 64, 64);
const sunMat = new THREE.MeshStandardMaterial({
  color: 0xffcc33,
  emissive: 0x775500,
  emissiveIntensity: 0.35,
  metalness: 0,
  roughness: 1
});
const sphere = new THREE.Mesh(sunGeo, sunMat);
// (Optional texture)
// const sunTexture = loader.load("8k_sun.jpg", t => { t.colorSpace = THREE.SRGBColorSpace; sunMat.map = t; sunMat.needsUpdate = true; });
scene.add(sphere);

// ===================
//  Moons
// ===================
const moons = [];
const moonCount = 5;
const moonTexturePaths = [
  "2k_jupiter.jpg",
  "2k_mars.jpg",
  "2k_venus.jpg",
  "2k_earth_daymap.jpg",
  "2k_neptune.jpg"
];
const moonTextures = moonTexturePaths.map(p => loader.load(p));

for (let i = 0; i < moonCount; i++) {
  const size = 0.2 + Math.random() * 0.65;
  const geo  = new THREE.SphereGeometry(size, 16, 16);
  const mat  = new THREE.MeshStandardMaterial({ map: moonTextures[i % moonTextures.length] });
  const moon = new THREE.Mesh(geo, mat);
  moon.userData = {
    angle:  Math.random() * Math.PI * 2,
    radius: 5 + i * 1.5,
    speed:  0.001 + i * 0.0005
  };
  if (i === 0) moon.userData.section = "projects";
  if (i === 1) moon.userData.section = "work";
  if (i === 2) moon.userData.section = "contact";

  moons.push(moon);
  scene.add(moon);
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

// Moon 0 → Projects
if (moons[0]) {
  attachLabelToObject(moons[0], "Projects", () => {
    openSection("projects");
    focusCameraOnMoon(0);
  });
}
// Moon 1 → Work
if (moons[1]) {
  attachLabelToObject(moons[1], "Work", () => {
    openSection("work");
    focusCameraOnMoon(1);
  });
}
// Moon 2 → Get in Touch
if (moons[2]) {
  attachLabelToObject(moons[2], "Get in Touch", () => {
    openSection("contact");
    focusCameraOnMoon(2);
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
}
function hideHomeOverlay(){
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
  showProjectsOverlay();
  focusCameraOnMoon(SECTION_TO_MOON.projects);
});

// Optional close buttons if present
document.getElementById("projects-close")?.addEventListener("click", hideProjectsOverlay);
document.getElementById("home-close")?.addEventListener("click", hideHomeOverlay);

document.getElementById("contact-button")?.addEventListener("click", (e) => {
  e.preventDefault();
  hideAllOverlays();
  showContactOverlay();
  focusCameraOnMoon(SECTION_TO_MOON.contact);
});

document.getElementById("work-button")?.addEventListener("click", (e) => {
  e.preventDefault();
  hideAllOverlays();
  showWorkOverlay();
  focusCameraOnMoon(SECTION_TO_MOON.work);
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
      controls.enabled = true;   // hand back control
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

  // Drift stars
  starfieldGroup.rotation.y += _starSpin.y;
  starfieldGroup.rotation.x += _starSpin.x;

  // Orbit moons
  moons.forEach(moon => {
    moon.userData.angle += moon.userData.speed;
    const x = Math.cos(moon.userData.angle) * moon.userData.radius;
    const z = Math.sin(moon.userData.angle) * moon.userData.radius;
    moon.position.set(x, 0, z);
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
      if (section) openSection(section);
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
    { title: "Self-driving car sensor fusion", img: "self_d.jpg", desc: "Integrating LiDAR, radar, and camera data for robust perception in autonomous vehicles." },
    { title: "Nucleus-to-cytoplasm ratio in blood images", img: "blood.png", desc: "Segmentation and quantitative analysis of blood cell images for diagnostic research." },
    { title: "CT Scan Foreign Object detection", img: "fro.png", desc: "Machine learning approach for segmentation multiple dual energy objects from CT scan." },
    { title: "Pose estimation on cattle", img: "pos.mp4", desc: "Computer vision pipeline for detecting and estimating cattle body poses from camera data." },
    { title: "Computer Vision for Zebrafish Tracking", img: "traking.mp4", desc: "Computer vision pipeline for Zebrafish Tracking." }
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
const cursor = document.getElementById("astro-cursor");

let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;

let posX = mouseX;
let posY = mouseY;

let lastX = mouseX;
let lastY = mouseY;

let currentAngle = 0;

document.addEventListener("mousemove", (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

function animateCursor() {
  // Smooth follow (inertia)
  const followSpeed = 0.08;
  posX += (mouseX - posX) * followSpeed;
  posY += (mouseY - posY) * followSpeed;

  // Direction
  const dx = mouseX - lastX;
  const dy = mouseY - lastY;

  // Smooth rotation
  const targetAngle = Math.atan2(dy, dx) * (180 / Math.PI);
  currentAngle += (targetAngle - currentAngle) * 0.15;

  // Gentle wobble
  const wobble = Math.sin(Date.now() * 0.006) * 2;

  cursor.style.transform = `
    translate(${posX}px, ${posY}px)
    rotate(${currentAngle + wobble}deg)
  `;

  lastX = mouseX;
  lastY = mouseY;

  requestAnimationFrame(animateCursor);
}

animateCursor();


// ===================
//  AI Chat UI Wiring
// ===================

// Grab elements
const aiToggle = document.getElementById("ai-toggle");
const aiChat   = document.getElementById("ai-chat");
const aiMsgs   = document.getElementById("ai-messages");
const aiInput  = document.getElementById("ai-text");
const aiSend   = document.getElementById("ai-send");

const aiRobot  = document.getElementById("ai-robot");
const robotImg = document.getElementById("robot-img");

// Safety check
if (!aiToggle || !aiChat || !aiMsgs || !aiInput || !aiSend || !aiRobot || !robotImg) {
  console.error("❌ AI chat elements not found");
} else {
  console.log("✅ AI chat elements found");
}

// ===================
//  Robot helpers
// ===================

function robotIdle() {
  aiRobot.style.display = "flex";
  robotImg.src = "rocket.gif";
}

function robotSpeak() {
  aiRobot.style.display = "flex";
  robotImg.src = "rocket.gif";
}

function robotHide() {
  aiRobot.style.display = "none";
}

// ===================
//  Toggle chat open / close
// ===================

aiToggle.addEventListener("click", () => {
  const isOpen = aiChat.style.display === "flex";

  aiChat.style.display = isOpen ? "none" : "flex";
  aiChat.setAttribute("aria-hidden", isOpen ? "true" : "false");

  if (!isOpen) {
    robotIdle();   // show idle robot when opening
  } else {
    robotHide();   // hide robot when closing
  }
});

// ===================
//  Browser LLM (transformers.js)
// ===================

let aiBusy = false;
let llm = null;
let loadingModel = false;

async function loadLLM() {
  if (llm || loadingModel) return;
  loadingModel = true;

  aiMsgs.innerHTML += `<div><em>Loading AI model (first time only)…</em></div>`;
  aiMsgs.scrollTop = aiMsgs.scrollHeight;

  llm = await window.pipeline(
    "text2text-generation",
    "Xenova/flan-t5-small"
  );

  aiMsgs.innerHTML += `<div><em>AI ready ✅</em></div>`;
  aiMsgs.scrollTop = aiMsgs.scrollHeight;
}

// ===================
//  Send AI Message
// ===================

async function sendAIMessage() {
  if (aiBusy) return;

  const text = aiInput.value.trim();
  if (!text) return;

  aiBusy = true;

  // User message
  aiMsgs.innerHTML += `<div><strong>You:</strong> ${text}</div>`;
  aiInput.value = "";
  aiMsgs.scrollTop = aiMsgs.scrollHeight;

  await loadLLM();

  // Robot speaking animation
  robotSpeak();

  // Small delay for realism
  await new Promise(r => setTimeout(r, 300));

  // Thinking indicator
  const thinking = document.createElement("div");
  thinking.innerHTML = "<em>🤖 thinking...</em>";
  aiMsgs.appendChild(thinking);
  aiMsgs.scrollTop = aiMsgs.scrollHeight;

  // Prompt (simple & constrained for small model)
  const prompt = `
You are a tiny AI running in a browser.

Rules:
- If the user says hi or hello, greet them.

User question:
"${text}"

Answer:
`;

  const result = await llm(prompt, { max_new_tokens: 35 });

  // Cleanup
  thinking.remove();
  robotIdle();

  // AI response
  aiMsgs.innerHTML += `<div><strong>AI:</strong> ${result[0].generated_text}</div>`;
  aiMsgs.scrollTop = aiMsgs.scrollHeight;

  aiBusy = false;
}

// ===================
//  Input events
// ===================

// Send button
aiSend.addEventListener("click", sendAIMessage);

// Enter key
aiInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendAIMessage();
});

