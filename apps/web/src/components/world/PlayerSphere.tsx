import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AURA_COLORS, spectrumColor, CORE_VALUE } from '@spheres/shared';
import type { AuraType } from '@spheres/shared';

function coreToHex(coreValue: number): string {
  const t = (coreValue - CORE_VALUE.min) / (CORE_VALUE.max - CORE_VALUE.min) * 2 - 1;
  const { r, g, b } = spectrumColor(t);
  return `rgb(${r},${g},${b})`;
}

const GLOW_VERTEX = /* glsl */ `
varying float vGlow;
void main() {
  vec3 n = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1);
  vec3 eye = normalize(-mv.xyz);
  vGlow = pow(max(dot(n, eye), 0.0), 1.0);
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
  { scale: 1, opacity: 8 },
];

interface Props {
  aura: AuraType;
  coreValue: number;
  speed?: number;
  emitLight?: boolean;
}

export default function PlayerSphere({ aura, coreValue, speed = 0, emitLight = false }: Props) {
  const auraColor = AURA_COLORS[aura];
  const coreColor = coreToHex(coreValue);
  const coreRef = useRef<THREE.Mesh>(null!);

  const glowMats = useMemo(
    () =>
      GLOW_LAYERS.map(
        (l) =>
          new THREE.ShaderMaterial({
            uniforms: {
              color: { value: new THREE.Color(auraColor) },
              opacity: { value: l.opacity },
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
    glowMats.forEach((mat, i) => {
      mat.uniforms.color.value.copy(c);
      mat.uniforms.opacity.value = GLOW_LAYERS[i].opacity;
    });
  }, [auraColor, glowMats]);

  return (
    <group>
      <mesh ref={coreRef} renderOrder={0}>
        <sphereGeometry args={[0.2, 32, 32]} />
        <meshStandardMaterial
          color={coreColor}
          emissive={coreColor}
          emissiveIntensity={11}
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
