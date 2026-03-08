import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// ─── STARFIELD CONTROLS ─────────────────────────────────────────────
const CFG = {
  // Quantity
  count: 7000,
  brightStarChance: 0.09,        // % of stars that are large/bright

  // Shell (distance from camera)
  shellMin: 50,
  shellMax: 800,

  // Sizes (screen pixels before pixelRatio)
  sizeNormalMin: 0.8,
  sizeNormalMax: 1.1,
  sizeBrightMin: 1.2,
  sizeBrightMax: 1.8,
  pointScale: 1.8,               // multiplier applied to all sizes
  pointMin: 0.1,                 // clamp: smallest rendered size (px)
  pointMax: 5.0,                 // clamp: largest rendered size (px)

  // Drift (0 = stationary)
  driftSpeed: 0.1,

  // Pulse / twinkle
  pulseSpeedMin: 10.5,            // slowest pulse (rad/s)
  pulseSpeedMax: 80.4,            // fastest pulse (via aPhase)
  pulseSpeedMin2: 2.5,           // second wave base speed
  pulseSpeedMax2: 3.8,           // second wave max speed
  pulseAmpBig: 0.01,             // amplitude for biggest stars → range 85%-100%
  pulseAmpSmall: 0.90,           // amplitude for smallest stars → range 50%-100%

  // Colors (% chances)
  warmStarChance: 0.08,          // warm yellow/orange
  coolStarChance: 0.06,          // cool blue-white

  // Fragment shape
  edgeSoftness: 0.15,            // smoothstep inner edge (0 = hard dot, 0.4 = very soft)
} as const;
// ────────────────────────────────────────────────────────────────────

function initStar(
  positions: Float32Array,
  velocities: Float32Array,
  colors: Float32Array,
  sizes: Float32Array,
  phases: Float32Array,
  pulseAmps: Float32Array,
  i: number,
) {
  const r = CFG.shellMin + Math.random() * (CFG.shellMax - CFG.shellMin);
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(Math.random() * 2 - 1);

  const idx = i * 3;
  positions[idx] = r * Math.sin(phi) * Math.cos(theta);
  positions[idx + 1] = r * Math.sin(phi) * Math.sin(theta);
  positions[idx + 2] = r * Math.cos(phi);

  velocities[idx] = (Math.random() - 0.5) * CFG.driftSpeed;
  velocities[idx + 1] = (Math.random() - 0.5) * CFG.driftSpeed;
  velocities[idx + 2] = (Math.random() - 1) * CFG.driftSpeed;

  const roll = Math.random();
  if (roll < CFG.warmStarChance) {
    colors[idx] = 1.0;
    colors[idx + 1] = 0.85 + Math.random() * 0.1;
    colors[idx + 2] = 0.6 + Math.random() * 0.15;
  } else if (roll < CFG.warmStarChance + CFG.coolStarChance) {
    colors[idx] = 0.75 + Math.random() * 0.1;
    colors[idx + 1] = 0.82 + Math.random() * 0.1;
    colors[idx + 2] = 1.0;
  } else {
    const temp = 0.9 + Math.random() * 0.1;
    colors[idx] = temp;
    colors[idx + 1] = temp;
    colors[idx + 2] = 0.88 + Math.random() * 0.12;
  }

  const isBright = Math.random() < CFG.brightStarChance;
  const size = isBright
    ? CFG.sizeBrightMin + Math.random() * (CFG.sizeBrightMax - CFG.sizeBrightMin)
    : CFG.sizeNormalMin + Math.random() * (CFG.sizeNormalMax - CFG.sizeNormalMin);
  sizes[i] = size;
  phases[i] = Math.random() * Math.PI * 2;

  const sizeFactor =
    1.0 - (size - CFG.sizeNormalMin) / (CFG.sizeBrightMax - CFG.sizeNormalMin);
  pulseAmps[i] = CFG.pulseAmpBig + sizeFactor * (CFG.pulseAmpSmall - CFG.pulseAmpBig);
}

export default function Starfield({ count = CFG.count }) {
  const pointsRef = useRef<THREE.Points>(null!);
  const { camera } = useThree();

  const starData = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);
    const pulseAmps = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      initStar(positions, velocities, colors, sizes, phases, pulseAmps, i);
    }

    const geometry = new THREE.BufferGeometry();
    const posAttr = new THREE.BufferAttribute(positions, 3);
    posAttr.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute('position', posAttr);
    geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    geometry.setAttribute('aPulseAmp', new THREE.BufferAttribute(pulseAmps, 1));

    return { geometry, positions, velocities, colors, sizes, phases, pulseAmps };
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
        attribute float aPulseAmp;

        uniform float uTime;
        uniform float uPixelRatio;

        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);

          float speed1 = ${CFG.pulseSpeedMin.toFixed(1)} + aPhase * ${((CFG.pulseSpeedMax - CFG.pulseSpeedMin) / (Math.PI * 2)).toFixed(3)};
          float speed2 = ${CFG.pulseSpeedMin2.toFixed(1)} + aPhase * ${((CFG.pulseSpeedMax2 - CFG.pulseSpeedMin2) / (Math.PI * 2)).toFixed(3)};
          float wave1 = sin(uTime * speed1 + aPhase);
          float wave2 = sin(uTime * speed2 + aPhase * 2.7);
          float pulse = (wave1 + wave2) * 0.25 + 0.5;
          vAlpha = 1.0 - aPulseAmp + aPulseAmp * pulse;

          vColor = aColor;

          gl_PointSize = clamp(aSize * uPixelRatio * ${CFG.pointScale.toFixed(1)}, ${CFG.pointMin.toFixed(1)}, ${CFG.pointMax.toFixed(1)});
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          float d = length(gl_PointCoord - 0.5);
          if (d > 0.5) discard;

          float core = smoothstep(0.5, ${CFG.edgeSoftness.toFixed(2)}, d);
          gl_FragColor = vec4(vColor, core * vAlpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  const shellMaxSq = CFG.shellMax * CFG.shellMax * 1.2;

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const { positions, velocities, colors, sizes, phases, pulseAmps } = starData;
    const posAttr = starData.geometry.attributes.position as THREE.BufferAttribute;

    material.uniforms.uTime.value = state.clock.elapsedTime;

    pointsRef.current.position.copy(camera.position);

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      positions[idx] += velocities[idx] * dt;
      positions[idx + 1] += velocities[idx + 1] * dt;
      positions[idx + 2] += velocities[idx + 2] * dt;

      const x = positions[idx], y = positions[idx + 1], z = positions[idx + 2];
      if (x * x + y * y + z * z > shellMaxSq) {
        initStar(positions, velocities, colors, sizes, phases, pulseAmps, i);
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
