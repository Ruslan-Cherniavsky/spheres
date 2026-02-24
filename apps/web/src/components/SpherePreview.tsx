import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { AURA_COLORS } from '@spheres/shared';
import type { AuraType } from '@spheres/shared';

const GLOW_VERTEX = /* glsl */ `
varying float vGlow;
void main() {
  vec3 n = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 0.8);
  vec3 eye = normalize(-mv.xyz);
  vGlow = pow(max(dot(n, eye), 0.1), 3.6);
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

const PREVIEW_GLOW = [
  { scale: 1, opacity: 9 },
];

function Sphere({ aura, coreValue }: { aura: AuraType; coreValue: number }) {
  const coreRef = useRef<THREE.Mesh>(null!);
  const auraColor = AURA_COLORS[aura];

  const glowMats = useMemo(
    () =>
      PREVIEW_GLOW.map(
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
      mat.uniforms.opacity.value = PREVIEW_GLOW[i].opacity;
    });
  }, [auraColor, glowMats]);

  useFrame(() => {
    if (coreRef.current) coreRef.current.rotation.y += 0.003;
  });

  return (
    <group>
      <mesh ref={coreRef} renderOrder={0}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial
          color={auraColor}
          emissive={auraColor}
          emissiveIntensity={2.5}
          roughness={0.4}
          metalness={0.0}
          toneMapped={false}
        />
      </mesh>

      {PREVIEW_GLOW.map((layer, i) => (
        <mesh key={i} scale={layer.scale} material={glowMats[i]} renderOrder={1}>
          <sphereGeometry args={[2, 32, 32]} />
        </mesh>
      ))}
    </group>
  );
}

export default function SpherePreview({
  aura,
  coreValue,
}: {
  aura: AuraType;
  coreValue: number;
}) {
  return (
    <Canvas
      camera={{ position: [0, 0, 10], fov: 45 }}
      style={{ background: 'transparent' }}
      gl={{
        antialias: false,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1,
      }}
    >
      <ambientLight intensity={0.15} />
      <Sphere aura={aura} coreValue={coreValue} />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.8}
      />
      <EffectComposer multisampling={8}>
        <Bloom
          intensity={1}
          luminanceThreshold={0.1}
          luminanceSmoothing={1}
          mipmapBlur
          radius={0.55}
        />
      </EffectComposer>
    </Canvas>
  );
}
