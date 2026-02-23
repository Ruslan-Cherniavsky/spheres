import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import PlayerSphere from './PlayerSphere';
import { AURA_COLORS } from '@spheres/shared';
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

export default function RemoteSphere({
  targetPosition,
  aura,
  coreValue,
  highlighted,
}: Props) {
  const groupRef = useRef<THREE.Group>(null!);
  const ringRef = useRef<THREE.Mesh>(null!);
  const targetVec = useRef(new THREE.Vector3());
  const initialized = useRef(false);

  targetVec.current.set(targetPosition.x, targetPosition.y, targetPosition.z);

  useFrame(({ clock }, delta) => {
    const group = groupRef.current;

    if (!initialized.current) {
      group.position.copy(targetVec.current);
      initialized.current = true;
      return;
    }

    group.position.lerp(targetVec.current, Math.min(INTERP_SPEED * delta, 1));

    if (ringRef.current) {
      const t = clock.getElapsedTime();
      const pulse = 0.25 + Math.sin(t * 2.5) * 0.12;
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity = pulse;
      ringRef.current.rotation.z = t * 0.3;
    }
  });

  const auraColor = AURA_COLORS[aura];

  return (
    <group ref={groupRef}>
      <PlayerSphere aura={aura} coreValue={coreValue} />
      {highlighted && (
        <mesh ref={ringRef} rotation={[Math.PI / 2.5, 0.3, 0]} renderOrder={2}>
          <ringGeometry args={[1.1, 1.25, 48]} />
          <meshBasicMaterial
            color={auraColor}
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}
