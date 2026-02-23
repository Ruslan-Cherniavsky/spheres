import type { AuraType, Vec3 } from '@spheres/shared';
import { worldManager } from './world.js';

import { AURA_LIST } from '@spheres/shared';

const AI_AURAS: AuraType[] = AURA_LIST.filter((a) => a !== 'sos');

interface AIState {
  uid: string;
  target: Vec3;
  wanderTimer: number;
  speed: number;
}

const aiStates: AIState[] = [];

function randomTarget(): Vec3 {
  return {
    x: (Math.random() - 0.5) * 150,
    y: (Math.random() - 0.5) * 100,
    z: (Math.random() - 0.5) * 150,
  };
}

export function spawnAISpheres(worldId: string, count: number) {
  for (let i = 0; i < count; i++) {
    const uid = `ai-${i}`;
    const pos: Vec3 = {
      x: (Math.random() - 0.5) * 120,
      y: (Math.random() - 0.5) * 80,
      z: (Math.random() - 0.5) * 120,
    };

    worldManager.addPlayer(worldId, {
      uid,
      socketId: `ai-socket-${i}`,
      position: pos,
      aura: AI_AURAS[i % AI_AURAS.length],
      coreValue: Math.random() * 1.2 - 0.6,
      status: 'idle',
      isAI: true,
      lastUpdateTs: Date.now(),
    });

    aiStates.push({
      uid,
      target: randomTarget(),
      wanderTimer: 2 + Math.random() * 6,
      speed: 2 + Math.random() * 3,
    });
  }

  console.log(`[ai] spawned ${count} spheres in ${worldId}`);
}

export function tickAI(worldId: string, dt: number) {
  for (const ai of aiStates) {
    ai.wanderTimer -= dt;

    if (ai.wanderTimer <= 0) {
      ai.target = randomTarget();
      ai.wanderTimer = 3 + Math.random() * 8;
    }

    const player = worldManager.getPlayer(worldId, ai.uid);
    if (!player) continue;

    if (player.status === 'chatting') continue;

    const dx = ai.target.x - player.position.x;
    const dy = ai.target.y - player.position.y;
    const dz = ai.target.z - player.position.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (dist > 1) {
      const step = Math.min(ai.speed * dt, dist);
      const factor = step / dist;
      player.position = {
        x: player.position.x + dx * factor,
        y: player.position.y + dy * factor,
        z: player.position.z + dz * factor,
      };
      player.lastUpdateTs = Date.now();
    }
  }
}

export function getAIUids(): string[] {
  return aiStates.map((a) => a.uid);
}
