import * as THREE from 'three';
import { Cloud } from './cloud.js';

export class Sky {
  constructor() {
    this.mesh = new THREE.Object3D();
    this.nClouds = 20;
    const stepAngle = Math.PI * 2 / this.nClouds;

    for (let i = 0; i < this.nClouds; i++) {
      const c = new Cloud();
      const a = stepAngle * i;
      const h = 750 + Math.random() * 200;
      c.mesh.position.set(Math.cos(a) * h, Math.sin(a) * h, -400 - Math.random() * 400);
      c.mesh.rotation.z = a + Math.PI / 2;
      const s = 1 + Math.random() * 2;
      c.mesh.scale.set(s, s, s);
      this.mesh.add(c.mesh);
    }
  }
}
