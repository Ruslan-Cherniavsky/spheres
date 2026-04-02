import type { Vec3 } from '@spheres/shared';

export type JulMode = 'wandering' | 'observing' | 'approaching' | 'talking' | 'avoiding' | 'resting';

export interface JulState {
  position: Vec3;
  velocity: Vec3;
  wanderTarget: Vec3;
  wanderTimer: number;

  mode: JulMode;
  modeTimer: number;

  mood: number;
  energy: number;
  socialNeed: number;
  curiosity: number;

  currentTargetUid: string | null;
  lockedConversationUid: string | null;

  conversationMessages: Array<{ role: 'jul' | 'user'; text: string }>;
  conversationStartMood: number;

  dailyRequestCount: number;
  dailyResetAt: number;
  conversationCooldownUntil: number;
}

export function createInitialJulState(): JulState {
  const now = Date.now();
  const tomorrow = now + 24 * 60 * 60 * 1000;

  return {
    position: { x: 2, y: 0, z: 2 },
    velocity: { x: 0, y: 0, z: 0 },
    wanderTarget: { x: 5, y: 0, z: 5 },
    wanderTimer: 4,

    mode: 'wandering',
    modeTimer: 0,

    mood: 0.65,
    energy: 0.8,
    socialNeed: 0.5,
    curiosity: 0.6,

    currentTargetUid: null,
    lockedConversationUid: null,

    conversationMessages: [],
    conversationStartMood: 0.65,

    dailyRequestCount: 0,
    dailyResetAt: tomorrow,
    conversationCooldownUntil: 0,
  };
}
