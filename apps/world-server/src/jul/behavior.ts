import type { ServerPlayerState } from '../world.js';
import type { JulState } from './state.js';
import type { MemoryManager } from './memory.js';
import { JUL_PERSONALITY } from './personality.js';
import { pickInterestingUser, computeInitiationDesire, getDistanceBetween } from './targeting.js';
import { WORLD_CONFIG } from '@spheres/shared';

export type BehaviorAction =
  | { type: 'initiate_contact'; targetUid: string }
  | { type: 'end_conversation' }
  | { type: 'none' };

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function driftToward(current: number, target: number, rate: number, dt: number): number {
  return current + (target - current) * rate * dt;
}

function applyInternalDrift(state: JulState, dt: number): void {
  const jitter = (Math.random() - 0.5) * 0.02 * dt;

  state.mood = clamp01(driftToward(state.mood, 0.6, 0.01, dt) + jitter);
  state.energy = clamp01(
    state.mode === 'resting'
      ? state.energy + 0.03 * dt
      : state.energy - 0.005 * dt,
  );
  state.curiosity = clamp01(state.curiosity + (Math.random() - 0.5) * 0.04 * dt);

  if (state.mode !== 'talking') {
    state.socialNeed = clamp01(state.socialNeed + 0.008 * dt);
  }
}

export function updateBehavior(
  state: JulState,
  players: ServerPlayerState[],
  memory: MemoryManager,
  dt: number,
): BehaviorAction | null {
  applyInternalDrift(state, dt);
  state.modeTimer -= dt;

  switch (state.mode) {
    case 'wandering': {
      if (state.modeTimer <= 0) {
        state.modeTimer = 2 + Math.random() * 3;

        const desire = computeInitiationDesire(state);
        if (desire >= JUL_PERSONALITY.initiationThreshold) {
          const targetUid = pickInterestingUser(state, players, memory);
          if (targetUid) {
            state.currentTargetUid = targetUid;
            state.mode = 'observing';
            state.modeTimer = 3 + Math.random() * 5;
            return null;
          }
        }
      }
      return null;
    }

    case 'observing': {
      if (!state.currentTargetUid) {
        state.mode = 'wandering';
        state.modeTimer = 2;
        return null;
      }

      const target = players.find((p) => p.uid === state.currentTargetUid);
      if (!target || target.status !== 'idle') {
        state.currentTargetUid = null;
        state.mode = 'wandering';
        state.modeTimer = 2;
        return null;
      }

      if (state.modeTimer <= 0) {
        const desire = computeInitiationDesire(state);
        if (desire >= JUL_PERSONALITY.initiationThreshold * 0.8) {
          state.mode = 'approaching';
          state.modeTimer = 15;
          return null;
        }
        state.currentTargetUid = null;
        state.mode = 'wandering';
        state.modeTimer = 3;
      }
      return null;
    }

    case 'approaching': {
      if (!state.currentTargetUid) {
        state.mode = 'wandering';
        state.modeTimer = 2;
        return null;
      }

      const target = players.find((p) => p.uid === state.currentTargetUid);
      if (!target || target.status !== 'idle') {
        state.currentTargetUid = null;
        state.mode = 'wandering';
        state.modeTimer = 2;
        return null;
      }

      const dist = getDistanceBetween(state.position, target.position);
      if (dist <= WORLD_CONFIG.proximityThreshold) {
        const targetUid = state.currentTargetUid;
        return { type: 'initiate_contact', targetUid };
      }

      if (state.modeTimer <= 0) {
        state.currentTargetUid = null;
        state.mode = 'wandering';
        state.modeTimer = 3;
      }
      return null;
    }

    case 'talking': {
      return null;
    }

    case 'avoiding': {
      if (state.modeTimer <= 0) {
        state.currentTargetUid = null;
        state.mode = 'wandering';
        state.modeTimer = 3;
      }
      return null;
    }

    case 'resting': {
      if (state.modeTimer <= 0 && Date.now() >= state.conversationCooldownUntil) {
        state.mode = 'wandering';
        state.modeTimer = 3;
      }
      return null;
    }

    default:
      return null;
  }
}
