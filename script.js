// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({ antialias: true });

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hoveredObject = null;



renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
const light = new THREE.PointLight(0xffffff, 1);
light.position.set(10, 10, 10);
scene.add(light);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.2); // soft fill light
scene.add(ambientLight);


// Sphere
const textureLoader = new THREE.TextureLoader();
const sunTexture = textureLoader.load('2k_sun.jpg'); // use correct path

// Create sun sphere with texture
const geometry = new THREE.SphereGeometry(2, 64, 64);
const material = new THREE.MeshStandardMaterial({
  map: sunTexture,
  emissive: 0xffcc33,        // soft yellow glow
  emissiveIntensity: 0.5,    // always glowing
  metalness: 0,
  roughness: 1
});
const sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);


// Create moons
const moons = [];
const moonCount = 5;

for (let i = 0; i < moonCount; i++) {
  const moonSize = 0.20 + Math.random() * 0.35; // varies from 0.25 to 0.4
  const moonGeometry = new THREE.SphereGeometry(moonSize, 16, 16);
  const moonMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const moon = new THREE.Mesh(moonGeometry, moonMaterial);
  moon.userData = {
    angle: Math.random() * Math.PI * 2,
    radius: 3 + i * 1.3,
    speed: 0.001 + i * 0.0005
  };

  moons.push(moon);
  scene.add(moon);
}


// Camera position
camera.position.z = 10;

// OrbitControls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enablePan = false;

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  sphere.rotation.y += 0.001;

  // Move moons in orbit
  moons.forEach((moon) => {
    moon.userData.angle += moon.userData.speed;

    const x = Math.cos(moon.userData.angle) * moon.userData.radius;
    const z = Math.sin(moon.userData.angle) * moon.userData.radius;

    moon.position.set(x, 0, z);
  });

  // 🌟 Raycasting for hover effect
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(moons.concat(sphere));

  // 🔽 ⬇️ PLACE THIS PART RIGHT HERE ⬇️ 🔽
  // Reset previous hover
  if (hoveredObject && !intersects.find(i => i.object === hoveredObject)) {
    hoveredObject.scale.set(1, 1, 1);
    if (hoveredObject !== sphere) {
      hoveredObject.material.emissive.set(0x000000);
    }
    hoveredObject = null;
  }

  // New hover
  if (intersects.length > 0) {
    const target = intersects[0].object;
    if (target !== hoveredObject) {
      if (hoveredObject) {
        hoveredObject.scale.set(1, 1, 1);
        if (hoveredObject !== sphere) {
          hoveredObject.material.emissive.set(0x000000);
        }
      }

      hoveredObject = target;
      hoveredObject.scale.set(1.05, 1.05, 1.05);
      hoveredObject.material.emissive.set(0xffff66);
    }
  }

  renderer.render(scene, camera);
}


// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

window.addEventListener('mousemove', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});


animate();

