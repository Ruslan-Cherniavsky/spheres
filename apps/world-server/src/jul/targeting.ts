import type { Vec3 } from '@spheres/shared';
import type { ServerPlayerState } from '../world.js';
import type { JulState } from './state.js';
import type { MemoryManager } from './memory.js';
import { JUL_PERSONALITY } from './personality.js';
import { JUL_UID } from '@spheres/shared';

export function getDistanceBetween(a: Vec3, b: Vec3): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function computeInitiationDesire(state: JulState): number {
  if (state.energy < 0.2 || state.socialNeed < 0.3) return 0;

  const raw =
    state.socialNeed * 0.5 +
    state.curiosity * 0.3 +
    state.energy * 0.2 -
    JUL_PERSONALITY.shyness * 0.4;

  return Math.max(0, Math.min(1, raw));
}

export function pickInterestingUser(
  state: JulState,
  players: ServerPlayerState[],
  memory: MemoryManager,
): string | null {
  const now = Date.now();
  if (now < state.conversationCooldownUntil) return null;

  const candidates: Array<{ uid: string; score: number }> = [];

  for (const p of players) {
    if (p.isAI) continue;
    if (p.uid === JUL_UID) continue;
    if (p.status !== 'idle') continue;
    if (p.uid === state.lockedConversationUid) continue;

    const dist = getDistanceBetween(state.position, p.position);
    if (dist > 40) continue;

    let score = 0;

    // Proximity score: closer = higher (max ~1.0 at dist=0, ~0.25 at dist=40)
    score += Math.max(0, 1 - dist / 40) * 0.5;

    // Curiosity boost
    score += state.curiosity * 0.3;

    // Familiarity boost (use cached relationship if available)
    const cached = memory.getCachedRelationship(p.uid);
    if (cached) {
      score += cached.familiarity * 0.15;
      score -= cached.avoidance * 0.3;
    }

    if (score > 0.2) {
      candidates.push({ uid: p.uid, score });
    }
  }

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => b.score - a.score);
  return candidates[0].uid;
}
