import * as THREE from 'three';
import { createScene, scene, camera, renderer } from './scene.js';
import { createLights } from './lights.js';
import { Sea } from './sea.js';
import { Sky } from './sky.js';
import { AirPlane } from './plane.js';


let sea, sky, airplane;
let mousePos = { x: 0, y: 0 };

let sectionObjects = [];
let currentIndex = -1;
let transitioning = false;
let orbitAngle = 0;
let inOrbitMode = false;
let orbitTarget = null;
let resetRotation = false;
let targetRotation = new THREE.Euler(0, 0, 0);
let resetPosition = false;
let targetPosition = new THREE.Vector3(0, 100, 0);





// const sections = [
//   { id: 'about', label: 'À propos', color: 0xffcc00 },
//   { id: 'skills', label: 'Compétences', color: 0x00ccff },
//   { id: 'projects', label: 'Projets', color: 0xff6699 },
//   { id: 'art', label: 'Créations', color: 0xcc66ff },
//   { id: 'goals', label: 'Objectifs', color: 0x66ff66 },
//   { id: 'contact', label: 'Contact', color: 0xffffff }
// ];
const sections = [
  { id: 'about', label: 'À propos', color: 0xffcc00, text: 'Je suis développeur front-end passionné.' },
  { id: 'skills', label: 'Compétences', color: 0x00ccff, text: 'JavaScript, Three.js, React, Tailwind, etc.' },
  { id: 'projects', label: 'Projets', color: 0xff6699, text: 'Portfolio, simulateur spatial, jeu musical...' },
  { id: 'art', label: 'Créations', color: 0xcc66ff, text: 'Design 3D, illustrations, maquettes Figma.' },
  { id: 'goals', label: 'Objectifs', color: 0x66ff66, text: 'Progresser en création interactive immersive.' },
  { id: 'contact', label: 'Contact', color: 0xffffff, text: 'hello@example.com / LinkedIn / GitHub' }
];


window.addEventListener('load', init, false);

function init() {
  createScene();
  createLights(scene);
  createPlane();
  createSea();
  createSky();
  createSectionObjects();
  

  // 🧭 Roadmap interactive
  const roadmap = document.createElement('div');
  roadmap.id = 'roadmap';
  roadmap.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 15px;
    z-index: 10;
    font-family: sans-serif;
  `;
  
  const icons = ['👤', '🛠️', '💻', '🎨', '🚀', '📬'];
  
  sections.forEach((section, index) => {
    const tab = document.createElement('button');
    tab.className = 'roadmap-tab';
    tab.innerHTML = `<span class="icon">${icons[index]}</span> ${section.label}`;
    tab.addEventListener('click', () => showSection(index));
    roadmap.appendChild(tab);
  });
  
  document.body.appendChild(roadmap);
  

// sections.forEach((section, index) => {
//   const dot = document.createElement('button');
//   dot.className = 'roadmap-dot';
//   dot.textContent = '●';
//   dot.style.cssText = `
//     font-size: 24px;
//     background: none;
//     border: none;
//     cursor: pointer;
//     color: #fff;
//     opacity: 0.4;
//     transition: transform 0.2s, opacity 0.3s;
//   `;
//   dot.addEventListener('click', () => {
//     showSection(index);
//   });
//   roadmap.appendChild(dot);
// });

document.body.appendChild(roadmap);

  

  document.addEventListener('mousemove', handleMouseMove, false);
  document.addEventListener('keydown', e => {
    if (e.code === 'Space') {
      e.preventDefault();
      nextSection();
    }
  });

  const button = document.createElement('button');
  // button.textContent = '→ Suivant';
  // button.id = 'nextBtn';
  // button.style.cssText = 'position:absolute;top:20px;right:20px;z-index:10;padding:10px 20px;';
  document.body.appendChild(button);
  button.addEventListener('click', nextSection);
  document.addEventListener('click', onClickObject, false);


  nextSection(); // démarrer avec le premier
  loop();
}

function createPlane() {
  airplane = new AirPlane();
  airplane.mesh.scale.set(0.25, 0.25, 0.25);
  airplane.mesh.position.y = 100;
  scene.add(airplane.mesh);
}

function createSea() {
  sea = new Sea();
  sea.mesh.position.y = -600;
  scene.add(sea.mesh);
}

function createSky() {
  sky = new Sky();
  sky.mesh.position.y = -600;
  scene.add(sky.mesh);
}

function createSectionObjects() {
  sections.forEach(section => {
    const geometry = new THREE.IcosahedronGeometry(30, 1);
    const material = new THREE.MeshStandardMaterial({
      color: section.color,
      flatShading: true
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.visible = false;
    scene.add(mesh);
    sectionObjects.push(mesh);
  });
}


function onClickObject(event) {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(sectionObjects);
  if (intersects.length > 0) {
    orbitTarget = intersects[0].object;
    inOrbitMode = true;
    orbitAngle = 0;

    // Affiche les infos de l’objet dans la modale
    const index = sectionObjects.indexOf(orbitTarget);
    if (index !== -1) {
      const section = sections[index];
      const panel = document.getElementById('orbitInfoPanel');
      panel.innerHTML = `<h3>${section.label}</h3><p>${section.text}</p>`;
      panel.classList.add('show');
    }
  }
}





function showSection(index) {
  if (transitioning || index === currentIndex) return;
  transitioning = true;

  const prev = sectionObjects[currentIndex];
  const next = sectionObjects[index];

  const animationDuration = 120;
  let frame = 0;

  if (prev) {
    const startX = prev.position.x;
    const endX = -500;
    const out = () => {
      if (frame < animationDuration) {
        prev.position.x = startX + (endX - startX) * (frame / animationDuration);
        frame++;
        requestAnimationFrame(out);
      } else {
        prev.visible = false;
        animateIn();
      }
    };
    out();
  } else {
    animateIn();
  }

  function animateIn() {
    next.position.set(500, 100, 0);
    next.visible = true;
    let f = 0;
    const inAnim = () => {
      if (f < animationDuration) {
        next.position.x = 500 - ((500) * (f / animationDuration));
        f++;
        requestAnimationFrame(inAnim);
      } else {
        next.position.x = 0;
        transitioning = false;

        if (inOrbitMode) {
          resetRotation = true;
          resetPosition = true;
          targetRotation.set(0, 0, 0);
          targetPosition.set(0, 100, 0);
        }

        inOrbitMode = false;
        orbitTarget = null;
        document.getElementById('orbitInfoPanel').classList.remove('show');

      }
    };
    inAnim();
  }

  currentIndex = index;
  updateOverlay(sections[index].id);
}





function nextSection() {
  const next = (currentIndex + 1) % sections.length;
  showSection(next);
}

function normalize(v, vmin, vmax, tmin, tmax) {
  const nv = Math.max(Math.min(v, vmax), vmin);
  const pc = (nv - vmin) / (vmax - vmin);
  return tmin + (pc * (tmax - tmin));
}

function handleMouseMove(event) {
  const tx = -1 + (event.clientX / window.innerWidth) * 2;
  const ty = 1 - (event.clientY / window.innerHeight) * 2;
  mousePos = { x: tx, y: ty };
}

function updatePlane() {
  if (inOrbitMode && orbitTarget) {
    orbitAngle += 0.01;
    const radius = 150;
    const islandPos = orbitTarget.position;
    airplane.mesh.position.x = islandPos.x + Math.cos(orbitAngle) * radius;
    airplane.mesh.position.z = islandPos.z + Math.sin(orbitAngle) * radius;
    airplane.mesh.position.y = islandPos.y + 60;
    airplane.mesh.lookAt(islandPos.x, islandPos.y + 60, islandPos.z);
  } else {
    const targetY = normalize(mousePos.y, -0.75, 0.75, 25, 175);
    const targetX = normalize(mousePos.x, -0.75, 0.75, -100, 100);
    airplane.mesh.position.y += (targetY - airplane.mesh.position.y) * 0.1;
    airplane.mesh.position.x += (targetX - airplane.mesh.position.x) * 0.1;
    airplane.mesh.rotation.z = (targetY - airplane.mesh.position.y) * 0.0128;
    airplane.mesh.rotation.x = (airplane.mesh.position.y - targetY) * 0.0064;
    airplane.update();
  }
}



// function checkCollisions() {
//   const airplaneBox = new THREE.Box3().setFromObject(airplane.mesh);

//   sections.forEach((section, index) => {
//     const obj = sectionObjects[index];
//     const infoDiv = document.getElementById(section.id);

//     if (obj.visible) {
//       const objectBox = new THREE.Box3().setFromObject(obj);

//       if (airplaneBox.intersectsBox(objectBox)) {
//         obj.material.emissive.setHex(0xffffff);
//         obj.scale.set(1.2, 1.2, 1.2);
//         infoDiv.style.display = 'block';
//       } else {
//         obj.material.emissive.setHex(0x000000);
//         obj.scale.set(1, 1, 1);
//         infoDiv.style.display = 'none';
//       }
//     } else {
//       infoDiv.style.display = 'none';
//     }
//   });
// }

function updateOrbit() {
  if (!orbitTarget) return;

  orbitAngle += 0.01;
  const radius = 150;
  const center = orbitTarget.position;

  // Avion tourne autour de l'objet (l'île)
  airplane.mesh.position.x = center.x + Math.cos(orbitAngle) * radius;
  airplane.mesh.position.z = center.z + Math.sin(orbitAngle) * radius;
  airplane.mesh.position.y = center.y + 20;

  // L’avion regarde vers le centre
  airplane.mesh.lookAt(center.x, center.y + 60, center.z);

  // Continue les animations internes (hélice, cheveux…)
  airplane.update();
}


  

function loop() {
  // 🌊 Mouvements de fond
  sea.moveWaves();
  sky.mesh.rotation.z += 0.01;

  // 🌀 Rotation de l’objet actif (juste visuel)
  if (sectionObjects[currentIndex] && sectionObjects[currentIndex].visible) {
    sectionObjects[currentIndex].rotation.y += 0.01;
  }

  // ✈️ Animation de l’avion : hélice et cheveux
  airplane.update();

  // 🔁 Retour fluide de rotation après orbite
  if (resetRotation) {
    airplane.mesh.rotation.x += (targetRotation.x - airplane.mesh.rotation.x) * 0.05;
    airplane.mesh.rotation.y += (targetRotation.y - airplane.mesh.rotation.y) * 0.05;
    airplane.mesh.rotation.z += (targetRotation.z - airplane.mesh.rotation.z) * 0.05;

    const epsilon = 0.01;
    if (
      Math.abs(airplane.mesh.rotation.x - targetRotation.x) < epsilon &&
      Math.abs(airplane.mesh.rotation.y - targetRotation.y) < epsilon &&
      Math.abs(airplane.mesh.rotation.z - targetRotation.z) < epsilon
    ) {
      resetRotation = false;
      airplane.mesh.rotation.copy(targetRotation);
    }
  }

  // 🔁 Retour fluide de position après orbite
  if (resetPosition) {
    airplane.mesh.position.lerp(targetPosition, 0.05);
    if (airplane.mesh.position.distanceTo(targetPosition) < 0.1) {
      airplane.mesh.position.copy(targetPosition);
      resetPosition = false;
    }
  }

  // ✨ Comportement avion : orbite ou vol libre
  if (inOrbitMode && orbitTarget) {
    updateOrbit();
  } else {
    updatePlane();
  }

  // 💥 Collision avion / objets
  // checkCollisions();

  // 🎥 Rendu
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}


function updateOverlay(id) {
  const section = sections.find(s => s.id === id);
  const el = document.getElementById('cardInfo');
  if (section && el) {
    el.innerHTML = `<h3>${section.label}</h3><p>${section.text}</p>`;
    el.style.display = 'block';
  }

  const tabs = document.querySelectorAll('.roadmap-tab');
  tabs.forEach((tab, i) => {
    tab.classList.toggle('active', i === currentIndex);
  });
}

// function updateOverlay(id) {
//   const section = sections.find(s => s.id === id);
//   const el = document.getElementById('cardInfo');
//   if (section && el) {
//     el.innerHTML = `<h3>${section.label}</h3><p>${section.text}</p>`;
//     el.style.display = 'block';
//   }
  
//   // const dots = document.querySelectorAll('.roadmap-dot');
//   // dots.forEach((dot, i) => {
//   //   dot.style.opacity = i === currentIndex ? '1' : '0.4';
//   //   dot.style.transform = i === currentIndex ? 'scale(1.4)' : 'scale(1)';
//   // });
//   const dots = document.querySelectorAll('.roadmap-dot');
// dots.forEach((dot, i) => {
//   dot.classList.toggle('active', i === currentIndex);
// });

// }

// function updateOverlay(id) {
//   document.querySelectorAll('.overlay').forEach(el => el.classList.remove('active'));
//   const el = document.getElementById(id);
//   if (el) el.classList.add('active');

//   const dots = document.querySelectorAll('.roadmap-dot');
//   dots.forEach((dot, i) => {
//     dot.style.opacity = i === currentIndex ? '1' : '0.4';
//     dot.style.transform = i === currentIndex ? 'scale(1.4)' : 'scale(1)';
//   });
// }

