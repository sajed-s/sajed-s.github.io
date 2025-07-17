// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

scene.add(camera);

const renderer = new THREE.WebGLRenderer({ antialias: true });
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Flags & state
let hoveredObject = null;
let focusOnStar   = false;
let focusHome     = false;
let hasTyped      = false;

let focusOnMoon      = false;
let moonTargetPosition = new THREE.Vector3();
const moonIndexToZoom  = 3;

let satellite = null;
let satelliteAngle = 0;
const satelliteOrbitRadius = 0.8;  // distance from moon center


// Positions to lerp to/from
const targetPosition = new THREE.Vector3(0, 0.5, 3.7);

// Renderer + canvas styling
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
renderer.domElement.style.position = 'fixed';
renderer.domElement.style.top      = '0';
renderer.domElement.style.left     = '0';
renderer.domElement.style.zIndex   = '0';

// Lighting
const light = new THREE.PointLight(0xffffff, 1);
light.position.set(10, 10, 10);
scene.add(light);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);



// Sun sphere
const loader     = new THREE.TextureLoader();

// ——— STAR SKY BACKGROUND ———
const starTexture = loader.load('stars.jpg');
const skyGeo      = new THREE.SphereGeometry(100, 64, 64);
const skyMat      = new THREE.MeshBasicMaterial({
  map:        starTexture,
  side:       THREE.BackSide,
  depthWrite: false
});
const sky = new THREE.Mesh(skyGeo, skyMat);
scene.add(sky);


const sunTexture = loader.load('8k_sun.jpg');
const sunGeo     = new THREE.SphereGeometry(2, 64, 64);
const sunMat     = new THREE.MeshStandardMaterial({
  map:             sunTexture,
  emissive:        0xffcc33,
  emissiveIntensity: 0.5,
  metalness:       0,
  roughness:       1
});
const sphere = new THREE.Mesh(sunGeo, sunMat);
scene.add(sphere);






// Moons with individual textures
const moons            = [];
const moonCount        = 5;
const moonTexturePaths = [
  '2k_jupiter.jpg',
  '2k_mars.jpg',
  '2k_venus.jpg',
  '2k_earth_daymap.jpg',
  '2k_neptune.jpg'
];
const moonTextures = moonTexturePaths.map(p => loader.load(p));

for (let i = 0; i < moonCount; i++) {
  const size = 0.2 + Math.random() * 0.65;
  const geo  = new THREE.SphereGeometry(size, 16, 16);
  const mat  = new THREE.MeshStandardMaterial({
    map: moonTextures[i % moonTextures.length]
  });
  const moon = new THREE.Mesh(geo, mat);
  moon.userData = {
    angle:  Math.random() * Math.PI * 2,
    radius: 5 + i * 1.5,
    speed:  0.001 + i * 0.0005
  };
  moons.push(moon);
  scene.add(moon);
}

// Camera & controls
camera.position.z = 10;
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enablePan    = false;

// Save the “home” camera/target
const homeCamPos    = camera.position.clone();
const homeCamTarget = controls.target.clone();

// Home button click → start smooth return
document.getElementById('home-button').addEventListener('click', () => {
  focusOnStar = false;
  focusHome   = true;
  focusOnMoon = false;
  hasTyped    = false;
  document.querySelector('.header').style.display = 'none';
  if (satellite) satellite.visible = false;
});

// Typing effect setup
const aboutText = "I'm a software developer interested in space research and data science.";
let currentChar = 0;
function typeText() {
  const el = document.getElementById("about-text");
  if (currentChar < aboutText.length) {
    el.textContent += aboutText.charAt(currentChar++);
    setTimeout(typeText, 40);
  }
}

// Main animation loop
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


  // Hover highlighting
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects([sphere, ...moons]);
  if (hoveredObject && !hits.find(i => i.object === hoveredObject)) {
    hoveredObject.scale.set(1,1,1);
    if (hoveredObject !== sphere) hoveredObject.material.emissive.set(0x000000);
    hoveredObject = null;
  }
  if (hits.length) {
    const obj = hits[0].object;
    if (obj !== hoveredObject) {
      if (hoveredObject) {
        hoveredObject.scale.set(1,1,1);
        if (hoveredObject !== sphere) hoveredObject.material.emissive.set(0x000000);
      }
      hoveredObject = obj;
      hoveredObject.scale.set(1.05,1.05,1.05);
      hoveredObject.material.emissive.set(0xffff66);
    }
  }
  if (focusOnMoon) {
    // Camera smoothly follows the moving moon
    const moonPos = moons[moonIndexToZoom].position;
    const desiredCam = moonPos.clone().add(new THREE.Vector3(0, 0.5, 1.5));
    camera.position.lerp(desiredCam, 0.05);
    controls.target.lerp(moonPos, 0.05);
    controls.update();
  }


  // Smooth zoom‑in on star
  if (focusOnStar) {
    camera.position.lerp(targetPosition, 0.01);
    camera.lookAt(0,3,0);
  }

  // Smooth return‑home
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

// Event listeners
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

window.addEventListener('mousemove', e => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

window.addEventListener('click', () => {
  raycaster.setFromCamera(mouse, camera);

  // 1) Check the 4th moon first
  const moonHits = raycaster.intersectObject(moons[moonIndexToZoom]);
  if (moonHits.length > 0) {
    focusOnMoon = true;
    focusOnStar = false;
    hasTyped    = false;
    document.querySelector('.header').style.display = 'none';

    // Smooth‑zoom target above the moon
    moonTargetPosition.copy(moons[moonIndexToZoom].position)
                      .add(new THREE.Vector3(0, 0.5, 1.5));

    // Lazy‑load & attach the satellite HUD once
    if (!satellite) {
      const gltfLoader = new THREE.GLTFLoader();
      const dracoLoader = new THREE.DRACOLoader();
      dracoLoader.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.146.0/examples/js/libs/draco/');
      gltfLoader.setDRACOLoader(dracoLoader);

      gltfLoader.load('satellite.glb', (gltf) => {
        satellite = gltf.scene;
        satellite.scale.set(0.2, 0.2, 0.2);

        // Parent it to the camera so it moves with the view
        camera.add(satellite);

        // Position it in camera‑space: 2 units left, 0 up/down, 3 units forward
        satellite.position.set(-2, 0, -3);

        // Start hidden
        satellite.visible = true;
      }, undefined, err => console.error(err));
    } else {
      // If already loaded, just show it again
      satellite.visible = true;
    }

    return; // skip the sun‑click logic
  }

  // 2) Otherwise, check the sun
  const sunHits = raycaster.intersectObject(sphere);
  if (sunHits.length > 0 && !hasTyped) {
    focusOnStar = true;
    hasTyped    = true;
    focusOnMoon = false;
    document.querySelector('.header').style.display = 'block';
    if (satellite) satellite.visible = false;
    typeText();
  }
});



// Start animation
animate();
