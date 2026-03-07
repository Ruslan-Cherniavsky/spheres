import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const DEFAULTS = {
  count: 4000,
  minRecycle: 180,
  spawnMin: 350,
  spawnMax: 700,
  driftSpeed: 0.4,
  twinkleSpeed: 0.6,
} as const;

const _v = new THREE.Vector3();

function spawnStar(
  positions: Float32Array,
  velocities: Float32Array,
  colors: Float32Array,
  sizes: Float32Array,
  phases: Float32Array,
  i: number,
  cx: number,
  cy: number,
  cz: number,
) {
  const r =
    DEFAULTS.spawnMin +
    Math.random() * (DEFAULTS.spawnMax - DEFAULTS.spawnMin);
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(Math.random() * 2 - 1);

  const idx = i * 3;
  positions[idx] = cx + r * Math.sin(phi) * Math.cos(theta);
  positions[idx + 1] = cy + r * Math.sin(phi) * Math.sin(theta);
  positions[idx + 2] = cz + r * Math.cos(phi);

  velocities[idx] = (Math.random() - 0.5) * DEFAULTS.driftSpeed;
  velocities[idx + 1] = (Math.random() - 0.5) * DEFAULTS.driftSpeed;
  velocities[idx + 2] = (Math.random() - 0.5) * DEFAULTS.driftSpeed;

  const temp = 0.85 + Math.random() * 0.3;
  colors[idx] = temp;
  colors[idx + 1] = temp * (0.9 + Math.random() * 0.1);
  colors[idx + 2] = 0.8 + Math.random() * 0.2;

  sizes[i] = 0.2 + Math.random() * 0.8;
  phases[i] = Math.random() * Math.PI * 2;
}

export default function Starfield({ count = DEFAULTS.count }) {
  const pointsRef = useRef<THREE.Points>(null!);
  const { camera } = useThree();

  const starData = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      spawnStar(positions, velocities, colors, sizes, phases, i, 0, 0, 0);
    }

    const geometry = new THREE.BufferGeometry();
    const posAttr = new THREE.BufferAttribute(positions, 3);
    posAttr.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute('position', posAttr);
    geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));

    return { geometry, positions, velocities, colors, sizes, phases };
  }, [count]);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      },
      vertexShader: /* glsl */ `
        attribute vec3 aColor;
        attribute float aSize;
        attribute float aPhase;

        uniform float uTime;
        uniform float uPixelRatio;

        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);

          float twinkle = sin(uTime * ${DEFAULTS.twinkleSpeed.toFixed(1)} + aPhase) * 0.35 + 0.65;
          float pulse  = sin(uTime * 1.7 + aPhase * 3.0) * 0.15 + 0.85;
          vAlpha = twinkle * pulse;
          vColor = aColor;

          gl_PointSize = aSize * uPixelRatio * (180.0 / -mv.z);
          gl_PointSize = clamp(gl_PointSize, 0.5, 4.0);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          float d = length(gl_PointCoord - 0.5);
          if (d > 0.5) discard;

          float glow = exp(-d * 6.0);
          float core = smoothstep(0.15, 0.0, d);
          float alpha = (glow * 0.6 + core * 0.4) * vAlpha;

          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  const minSq = DEFAULTS.minRecycle * DEFAULTS.minRecycle;
  const maxSq = DEFAULTS.spawnMax * DEFAULTS.spawnMax * 1.3;

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const camPos = camera.position;
    const { positions, velocities, colors, sizes, phases } = starData;
    const posAttr = starData.geometry.attributes
      .position as THREE.BufferAttribute;

    material.uniforms.uTime.value = state.clock.elapsedTime;

    for (let i = 0; i < count; i++) {
      const idx = i * 3;

      positions[idx] += velocities[idx] * dt;
      positions[idx + 1] += velocities[idx + 1] * dt;
      positions[idx + 2] += velocities[idx + 2] * dt;

      _v.set(
        positions[idx] - camPos.x,
        positions[idx + 1] - camPos.y,
        positions[idx + 2] - camPos.z,
      );
      const distSq = _v.lengthSq();

      if (distSq < minSq || distSq > maxSq) {
        spawnStar(
          positions,
          velocities,
          colors,
          sizes,
          phases,
          i,
          camPos.x,
          camPos.y,
          camPos.z,
        );
        (starData.geometry.attributes.aColor as THREE.BufferAttribute).needsUpdate = true;
        (starData.geometry.attributes.aSize as THREE.BufferAttribute).needsUpdate = true;
        (starData.geometry.attributes.aPhase as THREE.BufferAttribute).needsUpdate = true;
      }
    }

    posAttr.needsUpdate = true;
  });

  return (
    <points
      ref={pointsRef}
      geometry={starData.geometry}
      material={material}
      renderOrder={-1}
      frustumCulled={false}
    />
  );
}
