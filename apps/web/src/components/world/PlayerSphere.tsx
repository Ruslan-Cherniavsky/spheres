import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AURA_COLORS } from '@spheres/shared';
import type { AuraType } from '@spheres/shared';

const GLOW_VERTEX = /* glsl */ `
varying float vGlow;
void main() {
  vec3 n = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.2);
  vec3 eye = normalize(-mv.xyz);
  vGlow = pow(max(dot(n, eye), 0.1), 1.9);
  gl_Position = projectionMatrix * mv;
}`;

const GLOW_FRAGMENT = /* glsl */ `
uniform vec3 color;
uniform float opacity;
varying float vGlow;
void main() {
  float a = vGlow * opacity;
  gl_FragColor = vec4(color * a, a);
}`;

const GLOW_LAYERS = [
  { scale: 1, opacity: 9 },
];

interface Props {
  aura: AuraType;
  coreValue: number;
  speed?: number;
  emitLight?: boolean;
}

const SPAWN_DURATION = 1.2;
const SPAWN_PHASE1_END = 0.7;
const SPAWN_SCALE_PEAK = 1.15;
const SPAWN_EMISSIVE_START = 6.0;
const SPAWN_EMISSIVE_END = 2.0;
const SPAWN_PHASE1_END_SCALE = SPAWN_SCALE_PEAK * (1 - Math.exp(-5 * SPAWN_PHASE1_END));

export default function PlayerSphere({ aura, coreValue, speed = 0, emitLight = false }: Props) {
  const auraColor = AURA_COLORS[aura];
  const coreRef = useRef<THREE.Mesh>(null!);
  const groupRef = useRef<THREE.Group>(null!);
  const spawnElapsed = useRef(0);
  const isSpawning = useRef(true);

  const glowMats = useMemo(
    () =>
      GLOW_LAYERS.map(
        (l) =>
          new THREE.ShaderMaterial({
            uniforms: {
              color: { value: new THREE.Color(auraColor) },
              opacity: { value: 0 },
            },
            vertexShader: GLOW_VERTEX,
            fragmentShader: GLOW_FRAGMENT,
            transparent: true,
            depthWrite: false,
            depthTest: true,
            blending: THREE.AdditiveBlending,
            side: THREE.FrontSide,
            toneMapped: false,
          }),
      ),
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => () => { glowMats.forEach((m) => m.dispose()); }, [glowMats]);

  useEffect(() => {
    const c = new THREE.Color(auraColor);
    glowMats.forEach((mat) => {
      mat.uniforms.color.value.copy(c);
    });
  }, [auraColor, glowMats]);

  useFrame((_, delta) => {
    if (!isSpawning.current) return;

    spawnElapsed.current = Math.min(spawnElapsed.current + delta, SPAWN_DURATION);
    const t = spawnElapsed.current;

    let scale: number;
    if (t < SPAWN_PHASE1_END) {
      scale = SPAWN_SCALE_PEAK * (1 - Math.exp(-5 * t));
    } else {
      const phase2T = (t - SPAWN_PHASE1_END) / (SPAWN_DURATION - SPAWN_PHASE1_END);
      scale = SPAWN_PHASE1_END_SCALE + (1.0 - SPAWN_PHASE1_END_SCALE) * phase2T;
    }

    if (groupRef.current) {
      groupRef.current.scale.setScalar(scale);
    }

    const progress = t / SPAWN_DURATION;
    const emissive = SPAWN_EMISSIVE_START + (SPAWN_EMISSIVE_END - SPAWN_EMISSIVE_START) * progress;
    if (coreRef.current) {
      (coreRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = emissive;
    }

    for (let i = 0; i < glowMats.length; i++) {
      glowMats[i].uniforms.opacity.value = GLOW_LAYERS[i].opacity * progress;
    }

    if (t >= SPAWN_DURATION) {
      if (groupRef.current) groupRef.current.scale.setScalar(1.0);
      if (coreRef.current) {
        (coreRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = SPAWN_EMISSIVE_END;
      }
      for (let i = 0; i < glowMats.length; i++) {
        glowMats[i].uniforms.opacity.value = GLOW_LAYERS[i].opacity;
      }
      isSpawning.current = false;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh ref={coreRef} renderOrder={0}>
        <sphereGeometry args={[0.2, 32, 32]} />
        <meshStandardMaterial
          color={auraColor}
          emissive={auraColor}
          emissiveIntensity={SPAWN_EMISSIVE_START}
          roughness={0.15}
          metalness={0.0}
          toneMapped={false}
        />
      </mesh>

      {GLOW_LAYERS.map((layer, i) => (
        <mesh
          key={i}
          scale={layer.scale}
          material={glowMats[i]}
          renderOrder={1}
          frustumCulled={false}
        >
          <sphereGeometry args={[0.4, 32, 32]} />
        </mesh>
      ))}

      {emitLight && (
        <pointLight color={auraColor} intensity={0.6} distance={6} decay={2} />
      )}
    </group>
  );
}
