import { useMemo } from 'react';
import * as THREE from 'three';

export default function Starfield({ count = 3000 }) {
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const r = 200 + Math.random() * 300;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [count]);

  return (
    <points geometry={geometry} renderOrder={-1}>
      <pointsMaterial
        color="#ffffff"
        size={0.5}
        sizeAttenuation
        transparent
        opacity={0.7}
        depthWrite={false}
      />
    </points>
  );
}
