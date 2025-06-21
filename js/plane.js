import * as THREE from 'three';
// import * as THREE from './three.module.js';
import { Colors } from './colors.js';
import { Pilot } from './pilot.js';

export class AirPlane {
  constructor() {
    this.mesh = new THREE.Object3D();

    const geomCockpit = new THREE.BoxGeometry(60, 50, 50);
    const matCockpit = new THREE.MeshPhongMaterial({ color: Colors.green, flatShading: true });
    const cockpit = new THREE.Mesh(geomCockpit, matCockpit);
    cockpit.castShadow = cockpit.receiveShadow = true;
    this.mesh.add(cockpit);

    const geomEngine = new THREE.BoxGeometry(20, 50, 50);
    const matEngine = new THREE.MeshPhongMaterial({ color: Colors.white, flatShading: true });
    const engine = new THREE.Mesh(geomEngine, matEngine);
    engine.position.x = 40;
    engine.castShadow = engine.receiveShadow = true;
    this.mesh.add(engine);

    const geomTail = new THREE.BoxGeometry(15, 20, 5);
    const matTail = new THREE.MeshPhongMaterial({ color: Colors.green, flatShading: true });
    const tail = new THREE.Mesh(geomTail, matTail);
    tail.position.set(-35, 25, 0);
    tail.castShadow = tail.receiveShadow = true;
    this.mesh.add(tail);

    const geomWing = new THREE.BoxGeometry(40, 8, 150);
    const matWing = new THREE.MeshPhongMaterial({ color: Colors.green, flatShading: true });
    const wing = new THREE.Mesh(geomWing, matWing);
    wing.castShadow = wing.receiveShadow = true;
    this.mesh.add(wing);

    const geomProp = new THREE.BoxGeometry(20, 10, 10);
    const matProp = new THREE.MeshPhongMaterial({ color: Colors.brown, flatShading: true });
    this.propeller = new THREE.Mesh(geomProp, matProp);
    this.propeller.castShadow = this.propeller.receiveShadow = true;

    const geomBlade = new THREE.BoxGeometry(1, 100, 20);
    const matBlade = new THREE.MeshPhongMaterial({ color: Colors.brownDark, flatShading: true });
    const blade = new THREE.Mesh(geomBlade, matBlade);
    blade.position.x = 8;
    this.propeller.add(blade);

    this.propeller.position.set(50, 0, 0);
    this.mesh.add(this.propeller);

    this.pilot = new Pilot();
    this.pilot.mesh.position.set(-10, 27, 0);
    this.mesh.add(this.pilot.mesh);
  }

  update() {
    this.propeller.rotation.x += 0.3;
    this.pilot.updateHairs();
  }
}
