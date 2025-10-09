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
scene.add(camera);

const renderer  = new THREE.WebGLRenderer({ antialias: true });
const raycaster = new THREE.Raycaster();
const mouse     = new THREE.Vector2();

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
renderer.domElement.style.position = "fixed";
renderer.domElement.style.top  = "0";
renderer.domElement.style.left = "0";
renderer.domElement.style.zIndex = "0";

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
let focusOnStar   = false;   // (kept if you want sun zoom)
let focusHome     = false;
let focusOnMoon   = false;


let satellite = null;




const moonIndexToZoom  = 3;

const targetPosition   = new THREE.Vector3(0, 0.5, 3.7); // for star zoom

// ===================
//  Background Sky + Sun
// ===================
const loader = new THREE.TextureLoader();

// Star field (inside-out sphere)
const starTexture = loader.load("stars.jpg");
const skyGeo = new THREE.SphereGeometry(100, 64, 64);
const skyMat = new THREE.MeshBasicMaterial({ map: starTexture, side: THREE.BackSide, depthWrite: false });
const sky = new THREE.Mesh(skyGeo, skyMat);
scene.add(sky);

// Sun
const sunTexture = loader.load("8k_sun.jpg");
const sunGeo = new THREE.SphereGeometry(2, 64, 64);
const sunMat = new THREE.MeshStandardMaterial({
  map: sunTexture,
  emissive: 0xffcc33,
  emissiveIntensity: 0.5,
  metalness: 0,
  roughness: 1
});
const sphere = new THREE.Mesh(sunGeo, sunMat);
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
  moons.push(moon);
  scene.add(moon);
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

// ===================
//  Overlay Helpers (safe no-ops if elements are missing)
// ===================
function showProjectsOverlay(){
  const el = document.getElementById("projects-overlay");
  if (el) { el.classList.add("open"); el.setAttribute("aria-hidden", "false"); }
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
function hideAllOverlays(){ hideProjectsOverlay(); hideHomeOverlay(); }

// ===================
//  Top Menu Wiring
// ===================
document.getElementById("home-button")?.addEventListener("click", (e) => {
  e.preventDefault();

  // Close any other overlay, open Home
  hideProjectsOverlay();
  showHomeOverlay();

  // Camera return home
  focusOnStar = false;
  focusOnMoon = false;
  focusHome   = true;
  

  const hdr = document.querySelector(".header");
  if (hdr) hdr.style.display = "none";
  if (typeof satellite !== "undefined" && satellite) satellite.visible = false;
});

document.getElementById("projects-button")?.addEventListener("click", (e) => {
  e.preventDefault();
  hideHomeOverlay();
  showProjectsOverlay();
});

// Optional close buttons if present
document.getElementById("projects-close")?.addEventListener("click", hideProjectsOverlay);
document.getElementById("home-close")?.addEventListener("click", hideHomeOverlay);

// ===================
//  Animation Loop
// ===================
function animate() {
  requestAnimationFrame(animate);
  controls.update();

  // Rotate sun
  sphere.rotation.y += 0.001;

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

  // Clear previous highlight when leaving
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

  // Follow the 4th moon when focused
  if (focusOnMoon) {
    const moonPos = moons[moonIndexToZoom].position;
    const desiredCam = moonPos.clone().add(new THREE.Vector3(0, 0.5, 1.5));
    camera.position.lerp(desiredCam, 0.05);
    controls.target.lerp(moonPos, 0.05);
    controls.update();
  }

  // Optional zoom-in on star (kept if you want a gentle zoom)
  if (focusOnStar) {
    camera.position.lerp(targetPosition, 0.01);
    camera.lookAt(0, 3, 0);
  }

  // Smooth return home
  if (focusHome) {
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
}

// ===================
//  Events
// ===================
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

window.addEventListener("mousemove", (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

window.addEventListener("click", () => {
  raycaster.setFromCamera(mouse, camera);

  // 1) Prefer the 4th moon
  const moonHits = raycaster.intersectObject(moons[moonIndexToZoom]);
  if (moonHits.length > 0) {
    focusOnMoon = true;
    focusOnStar = false;
    

    const hdr = document.querySelector(".header");
    if (hdr) hdr.style.display = "none";

    // Smooth-zoom target above the moon
    moonTargetPosition.copy(moons[moonIndexToZoom].position)
                      .add(new THREE.Vector3(0, 0.5, 1.5));

    // Lazy-load a satellite once (optional)
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

    return; // don't process the sun in this click
  }

  // 2) Sun click — OLD UI disabled (no typewriter/header)
  const sunHits = raycaster.intersectObject(sphere);
  if (sunHits.length > 0) {
    // If you want gentle zoom on the sun, uncomment:
    // focusOnStar = true;

    // Ensure overlays don't pop in from legacy code
    hideAllOverlays();
  }
});

// ===== Category Projects Data & Drawer Logic =====
const CATEGORY_PROJECTS = {
  bioinformatics: [
      { title: "Full genome sequence CPV",              url: "https://link.springer.com/content/pdf/10.1186/s12985-023-02102-2.pdf", img: "cpv.png"},
      { title: "miRNA targeting",                       url: "https://www.sciencedirect.com/science/article/pii/S2405580823001000", img: "mt.png"},
      { title: "Toxin–antitoxin sequence",              url: "https://scholar.google.com/scholar?oi=bibs&cluster=2667093651387999319&btnI=1&hl=en", img: "tat.png" },
      { title: "Liver tissue transcriptome data analysis",                 url: "https://scholar.google.com/scholar?oi=bibs&cluster=7009121602870455185&btnI=1&hl=en",img: "lt.png" },
      { title: "Oxidative stress biomarkers",           url: "https://archrazi.areeo.ac.ir/article_132302_bce77b696b418027013fb1808a67aa24.pdf",img: "so.png" },
      { title: "miRNA in breast cancer",                url: "https://www.frontiersin.org/journals/immunology/articles/10.3389/fimmu.2024.1333563/full",img: "mb.png" }
      
    ],
  cv: [
    "Self-driving car sensor fusion (LiDAR/Radar/Camera)",
    "Nucleus-to-cytoplasm ratio in blood image",
    "Kidney MRI analysis",
    "Pose estimation on cattle"
  ],
  srs: [
    "SPEXone georegistration",
    "NH3 super-resolution"
  ]
};

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

  // Build list (supports string or {title, url?, img?})
  list.innerHTML = '';
  const items = CATEGORY_PROJECTS[categoryKey] || [];
  items.forEach(entry => {
    const isObj = entry && typeof entry === 'object';
    const name  = isObj ? entry.title : String(entry);
    const url   = isObj ? entry.url   : null;
    const img   = isObj ? entry.img   : "";

    const card = document.createElement('article');
    card.className = 'project-item';
    card.setAttribute('role', 'listitem');

    const imageHTML = `<img class="project-thumb" src="${img || ''}" alt="${name}">`;

    if (url) {
      card.innerHTML = `
        <a class="project-link" href="${url}" target="_blank" rel="noopener noreferrer" aria-label="${name} (opens in new tab)">
          ${imageHTML}
          <h4>${name}</h4>
          <div class="meta">Open link</div>
        </a>`;
      card.querySelector('a').addEventListener('click', e => e.stopPropagation());
    } else {
      card.innerHTML = `
        ${imageHTML}
        <h4>${name}</h4>
        <div class="meta">Hover highlights • Click to expand (soon)</div>`;
    }

    list.appendChild(card);
  });

  // Reveal right column and slide categories left
  overlay.classList.add('shifted');
  drawer.classList.add('open');
  drawer.setAttribute('aria-hidden', 'false');
  list.scrollTop = 0;
}


function showProjectsOverlay(){
  const el = document.getElementById("projects-overlay");
  if (el) {
    el.classList.add("open");
    el.setAttribute("aria-hidden", "false");
    el.classList.remove("shifted");   // <-- add this so initial state is centered
  }
}

function closeProjectsDrawer(){
  const overlay = document.getElementById('projects-overlay');
  const drawer  = document.getElementById('projects-drawer');
  if (!drawer) return;
  drawer.classList.remove('open');
  drawer.setAttribute('aria-hidden', 'true');
  if (overlay) overlay.classList.remove('shifted');  // back to centered state
}


// Close drawer with the X (if present)
document.getElementById('drawer-close')?.addEventListener('click', closeProjectsDrawer);

// Click background of the overlay closes drawer (but clicking a card does not)
document.getElementById('projects-overlay')?.addEventListener('click', (e) => {
  const drawer = document.getElementById('projects-drawer');
  if (!drawer) return;
  const clickedInsideDrawer = drawer.contains(e.target);
  const clickedCard = e.target.closest && e.target.closest('.project-card');
  if (!clickedInsideDrawer && !clickedCard) closeProjectsDrawer();
});

// Bind category cards -> open drawer with that category
document.querySelectorAll('.project-card').forEach(card => {
  card.addEventListener('click', () => {
    const key = card.getAttribute('data-key');
    if (key) openProjectsDrawer(key);
  });
});


// Kick off
animate();
