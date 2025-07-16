// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
const light = new THREE.PointLight(0xffffff, 1);
light.position.set(10, 10, 10);
scene.add(light);

// Sphere
const geometry = new THREE.SphereGeometry(2, 64, 64);
const material = new THREE.MeshStandardMaterial({
  color: 0x0077ff,
  metalness: 0.5,
  roughness: 0.2
});
const sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);

// Create moons
const moons = [];
const moonCount = 5;

for (let i = 0; i < moonCount; i++) {
  const moonGeometry = new THREE.SphereGeometry(0.3, 16, 16); // small sphere
  const moonMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const moon = new THREE.Mesh(moonGeometry, moonMaterial);

  // Give each moon a different orbit radius and angle
  moon.userData = {
    angle: Math.random() * Math.PI * 2,
    radius: 3 + i * 0.7, // spreads out from 3 to ~6
    speed: 0.01 + i * 0.005 // different speeds
  };

  moons.push(moon);
  scene.add(moon);
}

// Camera position
camera.position.z = 5;

// OrbitControls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enablePan = false;

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();

  // Move moons in orbit
  moons.forEach((moon) => {
    moon.userData.angle += moon.userData.speed;

    const x = Math.cos(moon.userData.angle) * moon.userData.radius;
    const z = Math.sin(moon.userData.angle) * moon.userData.radius;

    moon.position.set(x, 0, z); // keep moons level on Y axis
  });

  renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();

