import * as THREE from 'three';

export function createRocketExhaust(config = {}) {
  const maxParticles = config.maxParticles || 200;
  const size = config.size || 2.0;
  const sizeVariance = config.sizeVariance || 1.0;
  const emissionRate = config.emissionRate || 10;

  const positions = new Float32Array(maxParticles * 3);
  const velocities = [];
  const ages = new Float32Array(maxParticles);
  const sizes = new Float32Array(maxParticles);

  const geometry = new THREE.BufferGeometry();

  for (let i = 0; i < maxParticles; i++) {
    resetParticle(i);
  }

  function resetParticle(i) {
    positions[i * 3 + 0] = 0;
    positions[i * 3 + 1] = 0;
    positions[i * 3 + 2] = 0;

    velocities[i] = new THREE.Vector3(
      (Math.random() - 0.5) * 0.2,
      -Math.random() * 0.5,
      0
    );

    ages[i] = Math.random(); // Start some mid-life
    sizes[i] = size + sizeVariance * (Math.random() - 0.5) * 2;
  }

  const material = new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color('cyan') },
      dpr: { value: window.devicePixelRatio }
    },
    vertexShader: `
      uniform float dpr;
      attribute float age;
      attribute float particleSize;
      varying float vAge;
      void main() {
        vAge = age;
        gl_PointSize = particleSize * (1.0 - age) * dpr;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying float vAge;
      void main() {
        float alpha = 1.0 - vAge;
        gl_FragColor = vec4(vec3(0.8, 1.0, 1.0), alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('age', new THREE.BufferAttribute(ages, 1));
  geometry.setAttribute('particleSize', new THREE.BufferAttribute(sizes, 1));

  const points = new THREE.Points(geometry, material);

  // Update logic to call in your animation loop
  points.update = function (delta, rocketPosition) {
    for (let i = 0; i < maxParticles; i++) {
      ages[i] += delta;
      if (ages[i] >= 1.0) resetParticle(i);

      positions[i * 3 + 0] += velocities[i].x * delta * 60;
      positions[i * 3 + 1] += velocities[i].y * delta * 60;
      positions[i * 3 + 2] += velocities[i].z * delta * 60;
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.age.needsUpdate = true;

    // Reposition entire particle system to rocket
    if (rocketPosition) {
      points.position.copy(rocketPosition);
    }
  };

  return points;
}
