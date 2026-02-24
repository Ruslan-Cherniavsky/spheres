import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { AURA_COLORS, auraToRingsColor, coreValueToRingCount, getRingLayout } from '@spheres/shared';
import type { AuraType } from '@spheres/shared';

const PREVIEW_RING_SCALE = 5;

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

const RING_VERTEX = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const RING_FRAGMENT = /* glsl */ `
uniform vec3 color;
uniform float opacity;
varying vec2 vUv;
void main() {
  float radial = vUv.x;
  float inner = smoothstep(0.0, 0.00, radial);
  float outer = 1.0 - smoothstep(0.88, 0.0, radial);
  float a = inner * outer * opacity;
  if (a < 0.001) discard;
  gl_FragColor = vec4(color, a);
}`;

function Sphere({ aura, coreValue, showRings }: { aura: AuraType; coreValue: number; showRings: boolean }) {
  const coreRef = useRef<THREE.Mesh>(null!);
  const auraColor = AURA_COLORS[aura];
  const ringCount = coreValueToRingCount(coreValue);
  const ringsColor = auraToRingsColor(auraColor);
  const ringLayout = useMemo(() => getRingLayout(ringCount), [ringCount]);

  const ringMats = useMemo(
    () =>
      ringLayout.map(
        (r) =>
          new THREE.ShaderMaterial({
            uniforms: {
              color: { value: new THREE.Color(ringsColor) },
              opacity: { value: 0.9 * r.opacityScale },
            },
            vertexShader: RING_VERTEX,
            fragmentShader: RING_FRAGMENT,
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
          }),
      ),
    [ringLayout, ringsColor],
  );
  useEffect(() => {
    const c = new THREE.Color(ringsColor);
    ringMats.forEach((m) => m.uniforms.color.value.copy(c));
  }, [ringsColor, ringMats]);
  useEffect(() => () => ringMats.forEach((m) => m.dispose()), [ringMats]);

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
    if (coreRef.current && !showRings) coreRef.current.rotation.y += 0.003;
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

      {showRings && (
        <group rotation={[0.1, 0.2, 0]}>
          {ringLayout.map((ring, i) => (
            <mesh key={i} material={ringMats[i]} renderOrder={2} position={[0, 0, ring.zOff * PREVIEW_RING_SCALE]}>
              <ringGeometry
                args={[
                  ring.inner * PREVIEW_RING_SCALE,
                  ring.outer * PREVIEW_RING_SCALE,
                  128,
                ]}
              />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}

export default function SpherePreview({
  aura,
  coreValue,
  showRings = false,
}: {
  aura: AuraType;
  coreValue: number;
  showRings?: boolean;
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
      <Sphere aura={aura} coreValue={coreValue} showRings={showRings} />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate={!showRings}
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
