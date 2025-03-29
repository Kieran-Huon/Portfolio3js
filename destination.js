import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { createStylizedSmoke } from './SmokeSystem.js';
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry.js';


const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 30;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lights
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 20, 10);
scene.add(light);
scene.add(new THREE.AmbientLight(0xffffff, 0.4));

// Rocket
const loader = new GLTFLoader();
let rocket;
let rocketTarget = new THREE.Vector3(0, -10, 0);

loader.load('/models/Rocketship.glb', (gltf) => {
  rocket = gltf.scene;
  rocket.scale.set(1, 1, 1);
  rocket.position.copy(rocketTarget);
  scene.add(rocket);
});

// Stars
// function generateStars() {
//   const geometry = new THREE.BufferGeometry();
//   const vertices = [];
//   for (let i = 0; i < 200; i++) {
//     vertices.push(
//       THREE.MathUtils.randFloatSpread(100),
//       THREE.MathUtils.randFloatSpread(100),
//       -50
//     );
//   }
//   geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
//   const material = new THREE.PointsMaterial({ color: 0xffffff, size: 0.7 });
//   const stars = new THREE.Points(geometry, material);
//   scene.add(stars);
// }
// generateStars();

// Create asteroid (rock)
// function createRock(position, scale = 1) {
//   const geometry = new THREE.IcosahedronGeometry(Math.random() * 0.5 + 0.5, 1);
//   const material = new THREE.MeshStandardMaterial({ color: 0x888888, flatShading: true });
//   const rock = new THREE.Mesh(geometry, material);
//   rock.position.copy(position);
//   rock.scale.setScalar(scale);
//   rock.userData.velocity = new THREE.Vector3(
//     (Math.random() - 0.5) * 0.3,
//     (Math.random() - 0.5) * 0.3,
//     0
//   );
//   return rock;
// }
function generateRockGeometry() {
  const vertices = [];
  for (let i = 0; i < 50; i++) {
    vertices.push(new THREE.Vector3(
      (Math.random() - 0.5) * 3,
      (Math.random() - 0.5) * 3,
      (Math.random() - 0.5) * 3
    ));
  }
  const geometry = new ConvexGeometry(vertices);
  geometry.scale(1.5, 1.5, 1.5);
  return geometry;
}

function createRock(position, scale = 1) {
  const geometry = generateRockGeometry();
  const material = new THREE.MeshStandardMaterial({ color: 0x888888, flatShading: true });
  const rock = new THREE.Mesh(geometry, material);
  rock.position.copy(position);
  rock.scale.setScalar(scale);
  rock.userData.velocity = new THREE.Vector3(
    (Math.random() - 0.5) * 0.15,
    (Math.random() - 0.5) * 0.15,
    0
  );
  rock.userData.canSplit = scale > 0.5;
  return rock;
}


const rocks = [];
for (let i = 0; i < 50; i++) {
  const rock = createRock(new THREE.Vector3(
    THREE.MathUtils.randFloatSpread(60),
    THREE.MathUtils.randFloatSpread(60),
    0
  ));
  rocks.push(rock);
  scene.add(rock);
}

function splitRock(originalRock) {
  const newScale = originalRock.scale.x / 1.5;
  const basePos = originalRock.position.clone();
  const pieces = [];

  for (let i = 0; i < 2; i++) {
    const offset = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
      0
    );
    const newRock = createRock(basePos.clone().add(offset), newScale);
    pieces.push(newRock);
  }

  return pieces;
}


// Mouse tracking
const mouse = new THREE.Vector2();
window.addEventListener('mousemove', (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

  const vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
  vector.unproject(camera);
  const dir = vector.sub(camera.position).normalize();
  const distance = -camera.position.z / dir.z;
  rocketTarget = camera.position.clone().add(dir.multiplyScalar(distance));
});

// Collision detection + rock splitting (basic version)
// function checkCollisions() {
//   if (!rocket) return;
//   const rocketBox = new THREE.Box3().setFromObject(rocket);
//   for (let i = rocks.length - 1; i >= 0; i--) {
//     const rock = rocks[i];
//     const rockBox = new THREE.Box3().setFromObject(rock);
//     if (rocketBox.intersectsBox(rockBox)) {
//       scene.remove(rock);
//       rocks.splice(i, 1);

//       // Split large rock into two small ones
//       if (rock.scale.x > 0.5) {
//         for (let j = 0; j < 2; j++) {
//           const newRock = createRock(
//             rock.position.clone().add(new THREE.Vector3(
//               (Math.random() - 0.5) * 2,
//               (Math.random() - 0.5) * 2,
//               0
//             )),
//             rock.scale.x / 1.5
//           );
//           rocks.push(newRock);
//           scene.add(newRock);
//         }
//       }
//     }
//   }
// }

function checkCollisions() {
  if (!rocket) return;
  const rocketBox = new THREE.Box3().setFromObject(rocket);

  for (let i = 0; i < rocks.length; i++) {
    const rock = rocks[i];
    const rockBox = new THREE.Box3().setFromObject(rock);

    if (rocketBox.intersectsBox(rockBox)) {
      // Collision
      const direction = rock.position.clone().sub(rocket.position).normalize();
      const forceMagnitude = 0.0055; // ↩︎ plus doux qu'avant

      rock.userData.velocity.add(direction.multiplyScalar(forceMagnitude));

      // Rebond léger de la fusée (optionnel)
      rocket.position.add(direction.multiplyScalar(-0.1));

      // Rare split
      const force = rocket.position.distanceTo(rock.position) * 50;
      if (rock.userData.canSplit && force > 40 && Math.random() < 0.005) {
        const fragments = splitRock(rock);
        fragments.forEach(frag => {
          scene.add(frag);
          rocks.push(frag);
        });

        // Enlève le rocher d'origine si splitté
        scene.remove(rock);
        rocks.splice(i, 1);
      }
    }
  }
}


// function checkCollisions() {
//   if (!rocket) return;
//   const rocketBox = new THREE.Box3().setFromObject(rocket);

//   for (let i = 0; i < rocks.length; i++) {
//     const rock = rocks[i];
//     const rockBox = new THREE.Box3().setFromObject(rock);

//     if (rocketBox.intersectsBox(rockBox)) {
//       // Calcul du vecteur de collision
//       const direction = rock.position.clone().sub(rocket.position).normalize();
//       const forceMagnitude = 0.08;

//       // Appliquer l'impulsion à l'astéroïde
//       rock.userData.velocity.add(direction.multiplyScalar(forceMagnitude));

//       // Appliquer un petit rebond à la fusée (optionnel)
//       rocket.position.add(direction.multiplyScalar(-0.3));

//       // Très rare split
//       const force = rocket.position.distanceTo(rock.position) * 50;
//       if (rock.userData.canSplit && force > 40 && Math.random() < 0.05) {
//         const fragments = splitRock(rock);
//         fragments.forEach(frag => {
//           scene.add(frag);
//           rocks.push(frag);
//         });

//         // On enlève le rocher d'origine uniquement si splitté
//         scene.remove(rock);
//         rocks.splice(i, 1);
//       }
//     }
//   }
// }

// function checkCollisions() {
//   if (!rocket) return;
//   const rocketBox = new THREE.Box3().setFromObject(rocket);

//   for (let i = rocks.length - 1; i >= 0; i--) {
//     const rock = rocks[i];
//     const rockBox = new THREE.Box3().setFromObject(rock);

//     if (rocketBox.intersectsBox(rockBox)) {
//       // Collision ! Simulation de force :
//       const force = rocket.position.distanceTo(rock.position) * 50;

//       if (rock.userData.canSplit && force > 40 && Math.random() < 0.1) {
//         const fragments = splitRock(rock);
//         fragments.forEach(frag => {
//           scene.add(frag);
//           rocks.push(frag);
//         });
//       }

//       scene.remove(rock);
//       rocks.splice(i, 1);
//     }
//   }
// }


// === STARFIELD SHADER ===
const starUniforms = {
  color: { value: new THREE.Color('white') },
  opacity: { value: 1 },
  time: { value: 0 },
  dpr: { value: window.devicePixelRatio }
};

const starVertexShader = `
  uniform float time;
  uniform float dpr;
  varying float vTwinkle;
  void main() {
    vTwinkle = 0.5 + 0.5 * sin(time + position.x * 10.0);
    gl_PointSize = 1.5 * dpr;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const starFragmentShader = `
  uniform float opacity;
  varying float vTwinkle;
  void main() {
    gl_FragColor = vec4(vec3(1.0), opacity * vTwinkle);
  }
`;

const starMaterial = new THREE.ShaderMaterial({
  uniforms: starUniforms,
  vertexShader: starVertexShader,
  fragmentShader: starFragmentShader,
  transparent: true
});

function generateCylinderStars(count = 800, radius = 60, height = 300) {
  const positions = [];

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * 2 * Math.PI;
    const r = radius * Math.sqrt(Math.random());
    const x = r * Math.cos(angle);
    const z = r * Math.sin(angle);
    const y = (Math.random() - 0.5) * height;
    positions.push(x, y, z);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

  const stars = new THREE.Points(geometry, starMaterial);
  starFieldGroup.add(stars);
}

// === PLANETS INSTANCED ===
function generatePlanets(count = 20, radius = 50, height = 200) {
  const geometry = new THREE.SphereGeometry(1, 16, 16);
  const material = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });

  const instancedMesh = new THREE.InstancedMesh(geometry, material, count);
  const dummy = new THREE.Object3D();

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = radius + Math.random() * 20;
    const y = (Math.random() - 0.5) * height;

    dummy.position.set(
      r * Math.cos(angle),
      y,
      r * Math.sin(angle)
    );
    dummy.scale.setScalar(Math.random() * 3 + 1);
    dummy.updateMatrix();
    instancedMesh.setMatrixAt(i, dummy.matrix);
  }

  starFieldGroup.add(instancedMesh);
}

// === ROTATING GROUP ===
const starFieldGroup = new THREE.Group();
scene.add(starFieldGroup);
generateCylinderStars();
generatePlanets();


// Animate
// function animate() {
//   requestAnimationFrame(animate);

//   if (rocket) {
//     // Move toward mouse
//     rocket.position.lerp(rocketTarget, 0.08);

//     // Rotate rocket to point upward toward movement direction
//     const dir = rocketTarget.clone().sub(rocket.position).normalize();
//     rocket.rotation.z = Math.atan2(dir.y, dir.x) - Math.PI / 2;

//     // Add smoke
//     createStylizedSmoke(scene, rocket.position);
//   }

//   // Move rocks
//   // rocks.forEach(rock => {
//   //   rock.position.add(rock.userData.velocity);
//   //   rock.rotation.x += 0.01;
//   //   rock.rotation.y += 0.01;
//   // });
//   rocks.forEach(rock => {
//     rock.position.add(rock.userData.velocity);
//     rock.rotation.x += 0.01;
//     rock.rotation.y += 0.01;
  
//     // Rebond sur les bords
//     const limit = 40;
//     ['x', 'y'].forEach(axis => {
//       if (Math.abs(rock.position[axis]) > limit) {
//         rock.userData.velocity[axis] *= -1;
//         rock.position[axis] = THREE.MathUtils.clamp(rock.position[axis], -limit, limit);
//       }
//     });
//   });
  

//   // Rotate the whole environment
// starUniforms.time.value += 0.02;
// starFieldGroup.rotation.y += 0.0015;
// starUniforms.dpr.value = window.devicePixelRatio;


//   checkCollisions();
//   renderer.render(scene, camera);
// }
// animate();
function animate() {
  requestAnimationFrame(animate);

  if (rocket) {
    // Mouvement fluide vers la souris (ralenti)
    rocket.position.lerp(rocketTarget, 0.03);

    // Orientation vers la direction du mouvement
    const dir = rocketTarget.clone().sub(rocket.position).normalize();
    rocket.rotation.z = Math.atan2(dir.y, dir.x) - Math.PI / 2;

    // Fumée
    createStylizedSmoke(scene, rocket.position);
  }

  // Déplacement des astéroïdes
  rocks.forEach(rock => {
    rock.position.add(rock.userData.velocity);
    rock.rotation.x += 0.01;
    rock.rotation.y += 0.01;

    // Rebonds sur les bords
    const limit = 40;
    ['x', 'y'].forEach(axis => {
      if (Math.abs(rock.position[axis]) > limit) {
        rock.userData.velocity[axis] *= -1;
        rock.position[axis] = THREE.MathUtils.clamp(rock.position[axis], -limit, limit);
      }
    });
  });

  // Collisions entre astéroïdes avec rebond réaliste
  for (let i = 0; i < rocks.length; i++) {
    for (let j = i + 1; j < rocks.length; j++) {
      const a = rocks[i];
      const b = rocks[j];
      const distance = a.position.distanceTo(b.position);
      const minDistance = (a.scale.x + b.scale.x) * 0.8;

      if (distance < minDistance) {
        // Calcul du vecteur de rebond
        const normal = b.position.clone().sub(a.position).normalize();
        const overlap = minDistance - distance;

        // Séparation douce
        a.position.add(normal.clone().multiplyScalar(-overlap * 0.5));
        b.position.add(normal.clone().multiplyScalar(overlap * 0.5));

        // Petites impulsions opposées
        a.userData.velocity.add(normal.clone().multiplyScalar(-0.02));
        b.userData.velocity.add(normal.clone().multiplyScalar(0.02));
      }
    }
  }

  // Rotation du fond étoilé
  starUniforms.time.value += 0.02;
  starFieldGroup.rotation.y += 0.0015;
  starUniforms.dpr.value = window.devicePixelRatio;

  checkCollisions();
  renderer.render(scene, camera);
}

animate();


// Handle resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
