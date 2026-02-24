import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import PlayerSphere from './PlayerSphere';
import { AURA_COLORS, auraToRingsColor, coreValueToRingCount, getRingLayout } from '@spheres/shared';
import type { AuraType, Vec3 } from '@spheres/shared';

interface Props {
  uid: string;
  targetPosition: Vec3;
  aura: AuraType;
  coreValue: number;
  isAI?: boolean;
  highlighted?: boolean;
}

const INTERP_SPEED = 12;

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
  float edge = smoothstep(0.0, 0.00, radial) * smoothstep(0.0, 0.00, radial);
  float density = 0.8 + 0.7 * (1.0 - radial);
  float a = edge * density * opacity;
  if (a < 0.001) discard;
  gl_FragColor = vec4(color * a, a);
}`;

export default function RemoteSphere({
  targetPosition,
  aura,
  coreValue,
  highlighted,
}: Props) {
  const groupRef = useRef<THREE.Group>(null!);
  const ringGroupRef = useRef<THREE.Group>(null!);
  const targetVec = useRef(new THREE.Vector3());
  const initialized = useRef(false);

  const ringCount = coreValueToRingCount(coreValue);
  const ringsColor = auraToRingsColor(AURA_COLORS[aura]);
  const layout = useMemo(() => getRingLayout(ringCount), [ringCount]);

  const ringMats = useMemo(
    () =>
      layout.map(
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
    [layout, ringsColor], // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => {
    const c = new THREE.Color(ringsColor);
    ringMats.forEach((m) => m.uniforms.color.value.copy(c));
  }, [ringsColor, ringMats]);

  useEffect(() => () => ringMats.forEach((m) => m.dispose()), [ringMats]);

  targetVec.current.set(targetPosition.x, targetPosition.y, targetPosition.z);

  useFrame(({ clock }, delta) => {
    const group = groupRef.current;

    if (!initialized.current) {
      group.position.copy(targetVec.current);
      initialized.current = true;
      return;
    }

    group.position.lerp(targetVec.current, Math.min(INTERP_SPEED * delta, 1));
  });

  return (
    <group ref={groupRef}>
      <PlayerSphere aura={aura} coreValue={coreValue} />
      {highlighted && (
        <group ref={ringGroupRef} rotation={[Math.PI / 2.8, 0.2, 0]}>
          {layout.map((ring, i) => (
            <mesh
              key={i}
              material={ringMats[i]}
              position={[0, 0, ring.zOff]}
              renderOrder={2}
            >
              <ringGeometry args={[ring.inner, ring.outer, 96]} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}
