import type { JulState } from './state.js';
import type { UserRelationship } from './memory.js';
import { JUL_PERSONALITY } from './personality.js';

export function tryStartConversation(state: JulState, targetUid: string): boolean {
  if (state.lockedConversationUid) return false;
  if (Date.now() < state.conversationCooldownUntil) return false;
  if (isAtDailyLimit(state)) return false;

  state.lockedConversationUid = targetUid;
  state.mode = 'talking';
  state.modeTimer = 0;
  state.conversationMessages = [];
  state.conversationStartMood = state.mood;
  return true;
}

export function endConversation(
  state: JulState,
  memory: UserRelationship,
): { partnerUid: string; rating: number } | null {
  const partnerUid = state.lockedConversationUid;
  if (!partnerUid) return null;

  const rating = computeJulRating(state, memory);

  state.lockedConversationUid = null;
  state.currentTargetUid = null;
  state.mode = 'resting';
  state.modeTimer = 15 + Math.random() * 15;
  state.conversationCooldownUntil = Date.now() + JUL_PERSONALITY.conversationCooldownMs;
  state.socialNeed = Math.max(0, state.socialNeed - 0.3);
  state.conversationMessages = [];

  return { partnerUid, rating };
}

export function isConversationLocked(state: JulState): boolean {
  return state.lockedConversationUid !== null;
}

export function isAtDailyLimit(state: JulState): boolean {
  return state.dailyRequestCount >= JUL_PERSONALITY.dailyLimit - JUL_PERSONALITY.safeMargin;
}

export function incrementDailyCount(state: JulState): void {
  state.dailyRequestCount++;
}

export function checkDailyReset(state: JulState): void {
  if (Date.now() >= state.dailyResetAt) {
    state.dailyRequestCount = 0;
    state.dailyResetAt = Date.now() + 24 * 60 * 60 * 1000;
    console.log('[jul] daily request count reset');
  }
}

function computeJulRating(state: JulState, memory: UserRelationship): number {
  const msgCount = state.conversationMessages.length;
  const moodDelta = state.mood - state.conversationStartMood;

  let score = 0;
  if (msgCount > 6) score++;
  if (msgCount > 12) score++;
  if (memory.trust > 0.5) score++;
  if (moodDelta < -0.15) score -= 2;
  else if (moodDelta < 0) score--;

  return Math.max(-2, Math.min(2, score));
}
