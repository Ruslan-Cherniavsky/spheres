import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { WORLD_CONFIG } from '@spheres/shared';
import { useWorldStore } from '../../stores/worldStore';

const _diff = new THREE.Vector3();

interface Props {
  playerPosRef: React.RefObject<THREE.Vector3>;
}

export default function ProximityDetector({ playerPosRef }: Props) {
  const prevNearestUid = useRef<string | null>(null);

  useFrame(() => {
    const myPos = playerPosRef.current;
    if (!myPos) return;

    const { remotePlayers, contactState, setNearestPlayer } =
      useWorldStore.getState();

    if (contactState !== 'idle') return;

    let nearest: { uid: string; distance: number } | null = null;

    for (const [uid, remote] of Object.entries(remotePlayers)) {
      if (remote.state.status !== 'idle') continue;

      const tp = remote.targetPos;
      _diff.set(tp.x - myPos.x, tp.y - myPos.y, tp.z - myPos.z);
      const dist = _diff.length();

      if (dist < WORLD_CONFIG.proximityThreshold) {
        if (!nearest || dist < nearest.distance) {
          nearest = { uid, distance: dist };
        }
      }
    }

    const nearestUid = nearest?.uid ?? null;
    if (nearestUid !== prevNearestUid.current) {
      prevNearestUid.current = nearestUid;
      setNearestPlayer(nearest);
    }
  });

  return null;
}
