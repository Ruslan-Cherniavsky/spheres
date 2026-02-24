import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import PlayerSphere from './PlayerSphere';
import { AURA_COLORS, coreValueToRingCount } from '@spheres/shared';
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

/* Fixed-size ring system: total area is always the same.
   `count` determines how many sub-bands the area is divided into. */
const MAX_RINGS = 7;
const RING_INNER_START = 0.58;
const RING_OUTER_END = 1.1;
const RING_GAP = 0.012;
const GAP_SCALE = [0.6, 1.2, 0.9, 1.15, 0.95, 1.8];
const WIDTH_SCALE = [0.7, 1.1, 0.95, 1.1, 0.88, 1.7, 0.92];

function ringLayout(count: number) {
  const totalSpace = RING_OUTER_END - RING_INNER_START;
  const gaps = count > 1
    ? Array.from({ length: count - 1 }, (_, i) =>
        RING_GAP * (GAP_SCALE[i % GAP_SCALE.length] ?? 1),
      )
    : [];
  const totalGaps = gaps.reduce((a, b) => a + b, 0);
  const bandArea = totalSpace - totalGaps;

  const baseScales = count > 1
    ? Array.from({ length: count }, (_, i) => 0.5 + 0.5 * i / (count - 1))
    : [1];
  const widthJitter = baseScales.map((s, i) => s * (WIDTH_SCALE[i % WIDTH_SCALE.length] ?? 1));
  const jitterSum = widthJitter.reduce((a, b) => a + b, 0);
  const norm = bandArea / jitterSum;

  const rings: { inner: number; outer: number; opacityScale: number; zOff: number }[] = [];
  let cursor = RING_INNER_START;

  for (let i = 0; i < count; i++) {
    const width = widthJitter[i] * norm;
    const inner = cursor;
    const outer = inner + width;
    const opacityScale = 1.0 - i * (0.4 / MAX_RINGS);
    const zOff = i * 0.004;
    rings.push({ inner, outer, opacityScale, zOff });
    cursor = outer + (gaps[i] ?? 0);
  }
  return rings;
}

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
  const auraColor = AURA_COLORS[aura];
  const layout = useMemo(() => ringLayout(ringCount), [ringCount]);

  const ringMats = useMemo(
    () =>
      layout.map(
        (r) =>
          new THREE.ShaderMaterial({
            uniforms: {
              color: { value: new THREE.Color(auraColor) },
              opacity: { value: 0.45 * r.opacityScale },
            },
            vertexShader: RING_VERTEX,
            fragmentShader: RING_FRAGMENT,
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
          }),
      ),
    [layout], // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => {
    const c = new THREE.Color(auraColor);
    ringMats.forEach((m) => m.uniforms.color.value.copy(c));
  }, [auraColor, ringMats]);

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
