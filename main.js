import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import {
  createStylizedSmoke
} from './SmokeSystem.js';



const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 5000);
const cameraRadius = 80;
let scrollAngle = 0;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 0.9));
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(100, 200, 100);
scene.add(dirLight);

new OrbitControls(camera, renderer.domElement);

// Loader DOM
const loaderScreen = document.getElementById('loader-container');


function hideLoader() {
  loaderScreen.style.display = 'none';
}

function createStars(count) {
  const starGeometry = new THREE.BufferGeometry();
  const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 1, sizeAttenuation: true });
  const starVertices = [];
  for (let i = 0; i < count; i++) {
    const x = THREE.MathUtils.randFloatSpread(2000);
    const y = THREE.MathUtils.randFloatSpread(2000);
    const z = THREE.MathUtils.randFloatSpread(2000);
    starVertices.push(x, y, z);
  }
  starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
  scene.add(new THREE.Points(starGeometry, starMaterial));
}
createStars(1500);

const loader = new GLTFLoader();
let island, xwing, astronaut, rocketship;
let idleMixer, walkMixer, petMixer;
let isWalking = false;
let isLaunching = false;
let isPetting = false;
let launchStartTime = 0;
// let smokeParticles = [];
const keysPressed = { forward: false, backward: false, left: false, right: false };
const planets = [];
const orbitRadius = 150;
const walkRadius = 10;
let modelsToLoad = 12;
let modelsLoaded = 0;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let targetToReach = null;
let wolf = null; // on le stockera ici


function checkLoadingComplete() {
  modelsLoaded++;
  if (modelsLoaded >= modelsToLoad) hideLoader();
}

const planetConfigs = [
  { name: 'Earth', file: 'Planet-9g1aIbfR9Y.glb', scale: 10, orbitOffset: 0, orbitSpeed: 0.001 },
  { name: 'Jupiter', file: 'Jupiter.glb', scale: 0.4, orbitOffset: 20, orbitSpeed: 0.0008 },
  { name: 'Mars', file: 'Planet-5zzi8WUMXj.glb', scale: 10, orbitOffset: 40, orbitSpeed: 0.0012 },
  { name: 'Neptune', file: 'Planet-18Uxrb2dIc.glb', scale: 10, orbitOffset: 60, orbitSpeed: 0.0009 },
  { name: 'Saturn', file: 'Saturn.glb', scale: 50, orbitOffset: 80, orbitSpeed: 0.0007 },
  { name: 'Venus', file: 'Venus.glb', scale: 0.3, orbitOffset: 100, orbitSpeed: 0.0011 }
];

planetConfigs.forEach((config, i) => {
  loader.load(`/models/${config.file}`, gltf => {
    const planet = gltf.scene;
    const angle = (i / planetConfigs.length) * Math.PI * 2;
    planet.scale.set(config.scale, config.scale, config.scale);
    planet.userData = {
      angle,
      radius: orbitRadius + config.orbitOffset,
      speed: config.orbitSpeed
    };
    scene.add(planet);
    planets.push(planet);
    checkLoadingComplete();
  });
});
let wavingMixer, wavingAction;

loader.load('/models/Floating_Island.glb', gltf => {
  island = gltf.scene;
  island.scale.set(20, 20, 20);
  island.position.set(0, -24, 0);
  scene.add(island);
  checkLoadingComplete();

  loader.load('/models/Wolf.glb', wolfGltf => {
    wolf = wolfGltf.scene;
    wolf.scale.set(2, 2, 2);
    wolf.position.set(15, -9, -5);
    scene.add(wolf);
    checkLoadingComplete();
  });
  

  const rockPositions = [
    [-32.88, -9, 7.99],
    [-22.88, -9, -12],
    [-26.88, -9, 6.36],
    [-32.88, -9, 17]
  ];

  loader.load('/models/Rock Large.glb', rockGltf => {
    rockPositions.forEach(pos => {
      const rock = rockGltf.scene.clone();
      rock.scale.set(3, 3, 3);
      rock.position.set(...pos);
      scene.add(rock);
    });
  });

  const rock2Positions = [
    [-32.88, -9, 7.99],
    [-28.88, -9, -0.99],
    [-22.88, -9, -3.05],
    [-26.88, -9, 6.36],
    [-32.88, -9, 12.69]
  ];

  loader.load('/models/Rock Large-d2VWOdthtR.glb', rockGltf => {
    rock2Positions.forEach(pos => {
      const rock = rockGltf.scene.clone();
      rock.scale.set(3, 3, 3);
      rock.position.set(...pos);
      scene.add(rock);
    });
  });

  loader.load('/models/Round Rover.glb', roverGltf => {
    const rover = roverGltf.scene;
    rover.scale.set(1, 1, 1);
    rover.position.set(-22, -0.5, -5);
    rover.rotation.y = Math.PI / 2.5;
    scene.add(rover);
    checkLoadingComplete();
  });

  loader.load('/models/Rocketship.glb', gltf => {
    rocketship = gltf.scene;
    rocketship.scale.set(3, 3, 3);
    rocketship.position.set(25, -9, -20);
    rocketship.rotation.y = Math.PI / 1.5;
    scene.add(rocketship);
    checkLoadingComplete();
  });

  loader.load('/animation/Thoughtful Head Nod.glb', idleGltf => {
    astronaut = idleGltf.scene;
    astronaut.scale.set(2, 2, 2);
    astronaut.position.set(walkRadius, -9, 0);
    scene.add(astronaut);
    idleMixer = new THREE.AnimationMixer(astronaut);
    idleMixer.clipAction(idleGltf.animations[0]).play();
    checkLoadingComplete();

    loader.load('/animation/Walking.glb', walkGltf => {
      walkMixer = new THREE.AnimationMixer(astronaut);
      const walkClip = walkGltf.animations[0];
      walkClip.tracks = walkClip.tracks.filter(t => !t.name.endsWith('.position'));
      walkMixer.clipAction(walkClip).play();
      walkMixer.clipAction(walkClip).paused = true;
      checkLoadingComplete();
    });

    loader.load('/animation/Petting Animal.glb', petGltf => {
      petMixer = new THREE.AnimationMixer(astronaut);
      const petClip = petGltf.animations[0];
      const petAction = petMixer.clipAction(petClip);
      petAction.loop = THREE.LoopOnce;
      petAction.clampWhenFinished = true;
      window.addEventListener('keydown', e => {
        if (e.key.toLowerCase() === 'c') {
          isPetting = true;
          petAction.reset();
          petAction.play();
        }
      });
      checkLoadingComplete();
    });

    
    // ✅ AJOUTE ICI le chargement du waving maintenant que astronaut est défini
  loader.load('/animation/Waving.glb', wavingGltf => {
    wavingMixer = new THREE.AnimationMixer(astronaut);
    const wavingClip = wavingGltf.animations[0];
    wavingAction = wavingMixer.clipAction(wavingClip);
    wavingAction.loop = THREE.LoopOnce;
    wavingAction.clampWhenFinished = true;
    checkLoadingComplete();
  });


    
  });
});


// TRAÎNÉE DU X-WING
const trailPoints = [];
const trailGeometry = new THREE.BufferGeometry();
const trailMaterial = new THREE.LineBasicMaterial({ color: 0x00ffff });
scene.add(new THREE.Line(trailGeometry, trailMaterial));


loader.load('/models/x-wing.glb', gltf => {
  xwing = gltf.scene;
  xwing.scale.set(0.6, 0.6, 0.6);
  scene.add(xwing);
  checkLoadingComplete();
});




// window.addEventListener('click', (event) => {
//   if (!rocketship || !astronaut) return;

//   mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
//   mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

//   raycaster.setFromCamera(mouse, camera);
//   const intersects = raycaster.intersectObjects([rocketship], true);

//   if (intersects.length > 0) {
//     astronaut.lookAt(camera.position); // L'astronaute regarde la caméra
//     isLaunching = true;
//     launchStartTime = performance.now();

//     // Redirection après 3 secondes (suffisant pour voir la fusée décoller)
//     setTimeout(() => {
//       window.location.href = 'destination.html';
//     }, 3000);
//   }
// });
window.addEventListener('click', (event) => {
  if (!rocketship || !astronaut || !wavingAction) return;

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects([rocketship], true);

  if (intersects.length > 0) {
    astronaut.lookAt(camera.position);

    wavingAction.reset().play();

    // Déclenche le décollage 1s après le début du waving
    setTimeout(() => {
      isLaunching = true;
      launchStartTime = performance.now();
    }, 1000);

    // Redirige 3s après le clic (pour voir l'animation et un peu le décollage)
    setTimeout(() => {
      window.location.href = 'destination.html';
    }, 3000);
  }
});




window.addEventListener('click', (event) => {
  // calculer la position du curseur dans l'espace clip
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects([wolf], true);

  if (intersects.length > 0 && astronaut) {
    targetToReach = new THREE.Vector3(
      wolf.position.x - 2, // on évite qu'il rentre dedans
      astronaut.position.y,
      wolf.position.z - 1
    );
    isWalking = true;
  }
});


window.addEventListener('wheel', (e) => {
  scrollAngle += e.deltaY * 0.0015;
});

window.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  if (key === 'k') isWalking = true;
  if (key === 'z' || e.key === 'ArrowUp') keysPressed.forward = true;
  if (key === 's' || e.key === 'ArrowDown') keysPressed.backward = true;
  if (key === 'q' || e.key === 'ArrowLeft') keysPressed.left = true;
  if (key === 'd' || e.key === 'ArrowRight') keysPressed.right = true;
  if (e.code === 'Space' && rocketship && !isLaunching) {
    isLaunching = true;
    launchStartTime = performance.now();
  }
});

window.addEventListener('keyup', (e) => {
  const key = e.key.toLowerCase();
  if (key === 'k') isWalking = false;
  if (key === 'z' || e.key === 'ArrowUp') keysPressed.forward = false;
  if (key === 's' || e.key === 'ArrowDown') keysPressed.backward = false;
  if (key === 'q' || e.key === 'ArrowLeft') keysPressed.left = false;
  if (key === 'd' || e.key === 'ArrowRight') keysPressed.right = false;
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  const time = clock.getElapsedTime();

  const camX = Math.cos(scrollAngle) * cameraRadius;
  const camZ = Math.sin(scrollAngle) * cameraRadius;
  camera.position.set(camX, 15, camZ);
  camera.lookAt(0, 0, 0);

  planets.forEach(planet => {
    const d = planet.userData;
    d.angle += d.speed;
    planet.position.set(
      Math.cos(d.angle) * d.radius,
      0,
      Math.sin(d.angle) * d.radius
    );
    planet.rotation.y += 0.005;
  });

  if (xwing) {
    const angle = time * 0.3;
    const radius = orbitRadius + 80;
    const pos = new THREE.Vector3(
      Math.cos(angle) * radius,
      5,
      Math.sin(angle) * radius
    );
    xwing.position.copy(pos);
    xwing.lookAt(0, 0, 0);

    trailPoints.push(pos.clone());
    if (trailPoints.length > 40) trailPoints.shift();
    const positions = new Float32Array(trailPoints.length * 3);
    trailPoints.forEach((p, i) => {
      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
    });
    trailGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    trailGeometry.setDrawRange(0, trailPoints.length);
    trailGeometry.attributes.position.needsUpdate = true;
  }

  
  if (astronaut && idleMixer && walkMixer) {
  let isMoving = false;
  const direction = new THREE.Vector3();

  if (targetToReach) {
    direction.subVectors(targetToReach, astronaut.position);
    const distance = direction.length();

    if (distance > 0.2) {
      direction.normalize();
      astronaut.position.add(direction.clone().multiplyScalar(2 * delta));
      astronaut.lookAt(astronaut.position.clone().add(direction));
      walkMixer.update(delta);
      walkMixer.clipAction(walkMixer._actions[0]._clip).paused = false;
      idleMixer.clipAction(idleMixer._actions[0]._clip).paused = true;
      isMoving = true;
    } else {
      // arrivé à destination
      isWalking = false;
      targetToReach = null;
      isPetting = true;
      petMixer?.clipAction(petMixer._actions[0]._clip)?.reset()?.play();
    }
  }

  if (!isMoving) {
    if (keysPressed.forward || keysPressed.backward || keysPressed.left || keysPressed.right) {
      direction.set(
        (keysPressed.right ? 1 : 0) - (keysPressed.left ? 1 : 0),
        0,
        (keysPressed.backward ? 1 : 0) - (keysPressed.forward ? 1 : 0)
      ).normalize();

      astronaut.position.add(direction.clone().multiplyScalar(3 * delta));
      astronaut.lookAt(astronaut.position.clone().add(direction));
      walkMixer.update(delta);
      walkMixer.clipAction(walkMixer._actions[0]._clip).paused = false;
      idleMixer.clipAction(idleMixer._actions[0]._clip).paused = true;
    } else {
      idleMixer.update(delta);
      walkMixer.clipAction(walkMixer._actions[0]._clip).paused = true;
      idleMixer.clipAction(idleMixer._actions[0]._clip).paused = false;
    }
  }
}


  if (petMixer && isPetting) {
    petMixer.update(delta);
  }

  if (rocketship && isLaunching) {
    const elapsed = (performance.now() - launchStartTime) / 1000;

    if (elapsed < 2) {
      rocketship.position.y += 0.3;
    }
    if (elapsed < 2 || (elapsed > 8 && elapsed < 10)) {
      // createSmoke(rocketship.position.x, rocketship.position.y - 5, rocketship.position.z);
      // createSmoke(scene, rocketship.position.x, rocketship.position.y - 5, rocketship.position.z);
      createStylizedSmoke(scene, rocketship.position); // version stylisée
    }
    if (elapsed > 8 && elapsed < 10) {
      rocketship.position.y -= 0.3;
    }
    if (elapsed >= 10) {
      isLaunching = false;
      rocketship.position.y = -9;
    }
  }

  if (wavingMixer) {
    wavingMixer.update(delta);
  }
  


  renderer.render(scene, camera);
}

animate();
