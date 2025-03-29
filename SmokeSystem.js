import * as THREE from 'three';
import { TweenMax, Linear } from 'gsap';

export function createStylizedSmoke(scene, rocketPosition) {
  const geometry = new THREE.SphereGeometry(5 + Math.random() * 5, 6, 6);
  const material = new THREE.MeshLambertMaterial({
    color: 0xe3e3e3,
    transparent: true,
    opacity: 1
  });

  const smoke = new THREE.Mesh(geometry, material);
  smoke.position.set(rocketPosition.x, rocketPosition.y - 5, rocketPosition.z);
  smoke.scale.set(0.4, 0.4, 0.4);

  scene.add(smoke);

  TweenMax.to(smoke.position, 1.2, {
    y: rocketPosition.y - 40,
    ease: Linear.easeNone
  });

  TweenMax.to(smoke.scale, 1.2, {
    x: 1.5,
    y: 1.5,
    z: 1.5,
    ease: Linear.easeNone
  });

  TweenMax.to(smoke.material, 1.2, {
    opacity: 0,
    onComplete: () => {
      scene.remove(smoke);
    }
  });
}
