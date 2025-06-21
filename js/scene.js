import * as THREE from 'three';
import { Stars } from './stars.js';

export let scene, camera, renderer;
export let stars;

// 🌤️ Phases : matin → après-midi → soir → nuit
const cyclePhases = [
  { color: new THREE.Color(0xe4e0ba) }, // matin
  { color: new THREE.Color(0xf7d9aa) }, // après-midi
  { color: new THREE.Color(0xff9966) }, // soir
  { color: new THREE.Color(0x001d3d) }  // nuit
];

let currentPhaseIndex = 0;
let nextPhaseIndex = 1;
let transitionProgress = 0;
const cycleDuration = 15000; // ⏱️ durée d'une phase (en ms)
let lastTime = Date.now();

export function createScene() {
  const HEIGHT = window.innerHeight;
  const WIDTH = window.innerWidth;

  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(cyclePhases[0].color.clone(), 100, 950);
  scene.background = cyclePhases[0].color.clone();

  camera = new THREE.PerspectiveCamera(60, WIDTH / HEIGHT, 1, 10000);
  camera.position.set(0, 100, 200);

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(WIDTH, HEIGHT);
  renderer.shadowMap.enabled = true;

  const container = document.getElementById('world');
  container.appendChild(renderer.domElement);

  // 🌟 Ajout des étoiles après création de la scène
  stars = new Stars();
  stars.addToScene(scene);

  window.addEventListener('resize', () => {
    const HEIGHT = window.innerHeight;
    const WIDTH = window.innerWidth;
    renderer.setSize(WIDTH, HEIGHT);
    camera.aspect = WIDTH / HEIGHT;
    camera.updateProjectionMatrix();
  });

  animateCycle(); // ☀️ démarrer le cycle
}

function animateCycle() {
  requestAnimationFrame(animateCycle);

  const now = Date.now();
  const delta = now - lastTime;
  lastTime = now;

  transitionProgress += delta / cycleDuration;

  if (transitionProgress >= 1) {
    transitionProgress = 0;
    currentPhaseIndex = nextPhaseIndex;
    nextPhaseIndex = (nextPhaseIndex + 1) % cyclePhases.length;
  }

  const currentColor = cyclePhases[currentPhaseIndex].color.clone();
  const nextColor = cyclePhases[nextPhaseIndex].color.clone();
  const interpolatedColor = currentColor.lerp(nextColor, transitionProgress);

  scene.fog.color.copy(interpolatedColor);
  scene.background.copy(interpolatedColor);

  // 🌌 Afficher les étoiles uniquement pendant la nuit
  const isNight = currentPhaseIndex === 3 || nextPhaseIndex === 3;
  if (stars) {
    if (isNight) {
      stars.show();
    } else {
      stars.hide();
    }
  }
}
