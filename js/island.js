import * as THREE from 'three';

export function createIsland(color = 0x88cc66) {
  const island = new THREE.Group();

  // Base
  const geom = new THREE.CylinderGeometry(40, 80, 20, 6);
  const mat = new THREE.MeshStandardMaterial({ color, flatShading: true });
  const base = new THREE.Mesh(geom, mat);
  base.receiveShadow = true;
  island.add(base);

  // Palmier (simple cylindre + sphère)
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(2, 2, 20, 6),
    new THREE.MeshStandardMaterial({ color: 0x8b5a2b })
  );
  trunk.position.y = 20;
  island.add(trunk);

  const leaves = new THREE.Mesh(
    new THREE.SphereGeometry(10, 6, 6),
    new THREE.MeshStandardMaterial({ color: 0x33aa33 })
  );
  leaves.position.set(0, 32, 0);
  island.add(leaves);

  return island;
}
