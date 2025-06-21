import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Colors } from './colors.js';

export class Sea {
  constructor() {
    const baseGeom = new THREE.CylinderGeometry(600, 600, 800, 40, 10);
    baseGeom.rotateX(-Math.PI / 2);
    const geom = mergeVertices(baseGeom);

    const position = geom.attributes.position;
    this.waves = [];

    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const y = position.getY(i);
      const z = position.getZ(i);

      this.waves.push({
        x,
        y,
        z,
        ang: Math.random() * Math.PI * 2,
        amp: 5 + Math.random() * 15,
        speed: 0.016 + Math.random() * 0.032
      });
    }

    const mat = new THREE.MeshPhongMaterial({
      color: Colors.blue,
      transparent: true,
      opacity: .8,
      flatShading: true,
    });

    this.mesh = new THREE.Mesh(geom, mat);
    this.mesh.receiveShadow = true;
  }

  moveWaves() {
  const position = this.mesh.geometry.attributes.position;

  for (let i = 0; i < position.count; i++) {
    const vprops = this.waves[i];

    position.setX(i, vprops.x + Math.cos(vprops.ang) * vprops.amp);
    position.setY(i, vprops.y + Math.sin(vprops.ang) * vprops.amp);

    vprops.ang += vprops.speed;
  }

  // 🧵 Correction du "trou" en copiant la première position sur la dernière
  const lastIndex = position.count - 1;
  position.setX(lastIndex, position.getX(0));
  position.setY(lastIndex, position.getY(0));
  position.setZ(lastIndex, position.getZ(0));

  position.needsUpdate = true;
  this.mesh.rotation.z += 0.005;
}

}
