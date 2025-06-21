import * as THREE from 'three';

export class Stars {
  constructor() {
    const starCount = 1000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 1000 + Math.random() * 300;

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 2,
        sizeAttenuation: true,
        transparent: true,
        opacity: 1,
        depthWrite: false,
        blending: THREE.AdditiveBlending // 💫 rend les étoiles lumineuses
      });
      

    this.points = new THREE.Points(geometry, material);
    this.points.visible = false; // caché par défaut
  }

  show() {
    this.points.visible = true;
  }

  hide() {
    this.points.visible = false;
  }

  addToScene(scene) {
    scene.add(this.points);
  }
} 
