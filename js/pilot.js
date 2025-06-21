import * as THREE from 'three';
import { Colors } from './colors.js';

export class Pilot {
  constructor() {
    this.mesh = new THREE.Object3D();
    this.mesh.name = "pilot";
    this.angleHairs = 0;

    // Corps
    const bodyGeom = new THREE.BoxGeometry(15, 15, 15);
    const bodyMat = new THREE.MeshPhongMaterial({
      color: Colors.brown,
      flatShading: true
    });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.set(2, -12, 0);
    this.mesh.add(body);

    // Visage
    const faceGeom = new THREE.BoxGeometry(10, 10, 10);
    const faceMat = new THREE.MeshLambertMaterial({ color: Colors.pink });
    const face = new THREE.Mesh(faceGeom, faceMat);
    this.mesh.add(face);

    // Cheveux supérieurs animés
    const hairGeom = new THREE.BoxGeometry(4, 4, 4);
    hairGeom.translate(0, 2, 0); // pour que la base soit alignée
    const hairMat = new THREE.MeshLambertMaterial({ color: Colors.yellow });

    this.hairsTop = new THREE.Object3D();
    for (let i = 0; i < 12; i++) {
      const h = new THREE.Mesh(hairGeom, hairMat);
      const col = i % 3;
      const row = Math.floor(i / 3);
      h.position.set(-4 + row * 4, 0, -4 + col * 4);
      this.hairsTop.add(h);
    }

    // Container général des cheveux
    const hairs = new THREE.Object3D();
    hairs.add(this.hairsTop);

    // Cheveux côtés
    const hairSideGeom = new THREE.BoxGeometry(12, 4, 2);
    hairSideGeom.translate(-6, 0, 0);

    const hairSideR = new THREE.Mesh(hairSideGeom, hairMat);
    hairSideR.position.set(8, -2, 6);
    hairs.add(hairSideR);

    const hairSideL = new THREE.Mesh(hairSideGeom, hairMat);
    hairSideL.position.set(8, -2, -6);
    hairs.add(hairSideL);

    // Cheveux arrière
    const hairBackGeom = new THREE.BoxGeometry(2, 8, 10);
    const hairBack = new THREE.Mesh(hairBackGeom, hairMat);
    hairBack.position.set(-1, -4, 0);
    hairs.add(hairBack);

    // Position des cheveux sur la tête
    hairs.position.set(-5, 5, 0);
    this.mesh.add(hairs);

    // Lunettes
    const glassGeom = new THREE.BoxGeometry(5, 5, 5);
    const glassMat = new THREE.MeshLambertMaterial({ color: Colors.brown });

    const glassR = new THREE.Mesh(glassGeom, glassMat);
    glassR.position.set(6, 0, 3);
    const glassL = glassR.clone();
    glassL.position.z = -glassR.position.z;

    const glassAGeom = new THREE.BoxGeometry(11, 1, 11);
    const glassA = new THREE.Mesh(glassAGeom, glassMat);

    this.mesh.add(glassR);
    this.mesh.add(glassL);
    this.mesh.add(glassA);

    // Oreilles
    const earGeom = new THREE.BoxGeometry(2, 3, 2);
    const earL = new THREE.Mesh(earGeom, faceMat);
    earL.position.set(0, 0, -6);
    const earR = earL.clone();
    earR.position.set(0, 0, 6);
    this.mesh.add(earL);
    this.mesh.add(earR);
  }

  updateHairs() {
    this.hairsTop.children.forEach((h, i) => {
      h.scale.y = 0.75 + Math.cos(this.angleHairs + i / 3) * 0.25;
    });
    this.angleHairs += 0.16;
  }
}
