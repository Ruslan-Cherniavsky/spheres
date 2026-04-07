import { JUL_UID } from '@spheres/shared';
import type { AuraType } from '@spheres/shared';
import { worldManager } from '../world.js';
import type { JulState } from './state.js';
import { createInitialJulState } from './state.js';
import { JUL_PERSONALITY, JUL_CHARACTER_PROMPT } from './personality.js';
import { updateMovement } from './movement.js';
import { MemoryManager } from './memory.js';
import { OpenRouterProvider } from './providers/openrouter.js';
import { updateBehavior, type BehaviorAction } from './behavior.js';
import {
  tryStartConversation,
  endConversation,
  isConversationLocked,
  isAtDailyLimit,
  incrementDailyCount,
  checkDailyReset,
} from './conversation.js';
import { getDistanceBetween } from './targeting.js';

function moodToAura(mood: number): AuraType {
  if (mood > 0.8) return 'joy';
  if (mood > 0.65) return 'calm';
  if (mood > 0.5) return 'neutral';
  if (mood > 0.35) return 'doubt';
  if (mood > 0.2) return 'sadness';
  return 'apathy';
}

function computeTypingDelay(text: string): number {
  const MS_PER_CHAR = 45;
  const MIN_DELAY = 1000;
  const MAX_DELAY = 8000;
  const raw = text.length * MS_PER_CHAR;
  return Math.max(MIN_DELAY, Math.min(MAX_DELAY, raw));
}

let julState: JulState = createInitialJulState();
const memory = new MemoryManager();
const provider = new OpenRouterProvider();

// ── Callbacks wired from main index.ts ──

export interface JulCallbacks {
  findSocketByUid: (uid: string) => any;
  emitToWorld: (worldId: string, event: string, data: any) => void;
  clearRequestTimeout: (uid1: string, uid2: string) => void;
}

let callbacks: JulCallbacks | null = null;

export function initJul(worldId: string, cbs: JulCallbacks): void {
  callbacks = cbs;
  spawnJul(worldId);
  console.log('[jul] initialized in world', worldId);
}

// ── Spawn ──

export function spawnJul(worldId: string): void {
  julState = createInitialJulState();
  worldManager.addPlayer(worldId, {
    uid: JUL_UID,
    socketId: 'jul-socket',
    position: { ...julState.position },
    aura: JUL_PERSONALITY.defaultAura,
    coreValue: 0,
    status: 'idle',
    isAI: false,
    lastUpdateTs: Date.now(),
  });
  console.log('[jul] spawned in', worldId);
}

// ── Tick (called at 10Hz) ──

export function tickJul(worldId: string, dt: number): BehaviorAction | null {
  checkDailyReset(julState);

  const players = worldManager.getPlayers(worldId);
  const action = updateBehavior(julState, players, memory, dt);

  const targetPlayer = julState.currentTargetUid
    ? worldManager.getPlayer(worldId, julState.currentTargetUid)
    : undefined;

  updateMovement(julState, dt, targetPlayer?.position);

  const julPlayer = worldManager.getPlayer(worldId, JUL_UID);
  if (julPlayer) {
    julPlayer.position = { ...julState.position };
    julPlayer.aura = moodToAura(julState.mood);
    julPlayer.lastUpdateTs = Date.now();
  }

  return action;
}

// ── Contact: user → Jul ──

export function handleJulContactRequest(worldId: string, requesterUid: string): void {
  const julPlayer = worldManager.getPlayer(worldId, JUL_UID);
  const requester = worldManager.getPlayer(worldId, requesterUid);
  if (!julPlayer || !requester) return;

  if (isConversationLocked(julState) || isAtDailyLimit(julState) ||
      (julState.mode === 'approaching' && julState.currentTargetUid !== requesterUid)) {
    const delay = 1000 + Math.random() * 1500;
    setTimeout(() => {
      const r = worldManager.getPlayer(worldId, requesterUid);
      const j = worldManager.getPlayer(worldId, JUL_UID);
      if (!r || r.status !== 'requesting') return;

      r.status = 'idle';
      r.chattingWith = undefined;
      if (j?.status === 'requesting') {
        j.status = 'idle';
        j.chattingWith = undefined;
      }

      callbacks?.clearRequestTimeout(requesterUid, JUL_UID);
      const sock = callbacks?.findSocketByUid(requesterUid);
      sock?.emit('request_declined', { byUid: JUL_UID });
      callbacks?.emitToWorld(worldId, 'player_update', { uid: requesterUid, status: 'idle' });
      callbacks?.emitToWorld(worldId, 'player_update', { uid: JUL_UID, status: 'idle' });
      console.log('[jul] declined contact from', requesterUid, '(busy or at limit)');
    }, delay);
    return;
  }

  // Jul accepts after shy delay
  const delay = 1000 + Math.random() * 2000;
  setTimeout(() => {
    const r = worldManager.getPlayer(worldId, requesterUid);
    const j = worldManager.getPlayer(worldId, JUL_UID);
    if (!r || !j || r.status !== 'requesting') return;

    callbacks?.clearRequestTimeout(requesterUid, JUL_UID);

    r.status = 'chatting';
    r.chattingWith = JUL_UID;
    j.status = 'chatting';
    j.chattingWith = requesterUid;

    julState.currentTargetUid = null;
    tryStartConversation(julState, requesterUid);

    const sock = callbacks?.findSocketByUid(requesterUid);
    sock?.emit('contact_started', { withUid: JUL_UID });
    callbacks?.emitToWorld(worldId, 'player_update', { uid: requesterUid, status: 'chatting' });
    callbacks?.emitToWorld(worldId, 'player_update', { uid: JUL_UID, status: 'chatting' });

    console.log('[jul] accepted contact from', requesterUid);
  }, delay);
}

// ── Chat message from user ──

let replyInProgress = false;

export async function handleJulChatMessage(
  worldId: string,
  fromUid: string,
  text: string,
): Promise<void> {
  if (!text || julState.lockedConversationUid !== fromUid) return;
  if (replyInProgress) return;

  julState.conversationMessages.push({ role: 'user', text });
  replyInProgress = true;

  const userSock = callbacks?.findSocketByUid(fromUid);
  userSock?.emit('typing_start', { fromUid: JUL_UID });

  if (isAtDailyLimit(julState)) {
    try {
      const rel = await memory.getRelationship(fromUid);
      const farewell = await provider.generateReply({
        interactionType: 'farewell',
        recentMessages: julState.conversationMessages.slice(-10),
        mood: julState.mood,
        energy: julState.energy,
        personality: JUL_CHARACTER_PROMPT,
        relationship: rel,
      });

      julState.conversationMessages.push({ role: 'jul', text: farewell });
      incrementDailyCount(julState);

      const delay = computeTypingDelay(farewell);
      setTimeout(() => {
        const msg = { fromUid: JUL_UID, text: farewell, timestamp: Date.now() };
        const sock = callbacks?.findSocketByUid(fromUid);
        sock?.emit('typing_stop', { fromUid: JUL_UID });
        sock?.emit('chat_message', msg);
        replyInProgress = false;
      }, delay);
      console.log('[jul] sent farewell (daily limit) to', fromUid);
    } catch (err) {
      console.error('[jul-ai] farewell failed:', (err as Error).message);
      setTimeout(() => {
        const msg = { fromUid: JUL_UID, text: 'I need to go now... goodbye.', timestamp: Date.now() };
        const sock = callbacks?.findSocketByUid(fromUid);
        sock?.emit('typing_stop', { fromUid: JUL_UID });
        sock?.emit('chat_message', msg);
        replyInProgress = false;
      }, 1000);
      julState.conversationMessages.push({ role: 'jul', text: 'I need to go now... goodbye.' });
    }
    return;
  }

  try {
    const rel = await memory.getRelationship(fromUid);
    const reply = await provider.generateReply({
      interactionType: 'reply',
      userMessage: text,
      recentMessages: julState.conversationMessages.slice(-10),
      mood: julState.mood,
      energy: julState.energy,
      personality: JUL_CHARACTER_PROMPT,
      relationship: rel,
    });

    julState.conversationMessages.push({ role: 'jul', text: reply });
    incrementDailyCount(julState);

    const delay = computeTypingDelay(reply);
    setTimeout(() => {
      const msg = { fromUid: JUL_UID, text: reply, timestamp: Date.now() };
      const sock = callbacks?.findSocketByUid(fromUid);
      sock?.emit('typing_stop', { fromUid: JUL_UID });
      sock?.emit('chat_message', msg);
      replyInProgress = false;
    }, delay);
  } catch (err) {
    console.error('[jul-ai] reply failed:', (err as Error).message);
    setTimeout(() => {
      const msg = { fromUid: JUL_UID, text: '...', timestamp: Date.now() };
      const sock = callbacks?.findSocketByUid(fromUid);
      sock?.emit('typing_stop', { fromUid: JUL_UID });
      sock?.emit('chat_message', msg);
      replyInProgress = false;
    }, 1000);
  }
}

// ── End chat ──

export async function handleJulEndChat(
  worldId: string,
  withUid: string,
): Promise<{ rating: number }> {
  const messagesToSummarize = [...julState.conversationMessages];

  const rel = await memory.getRelationship(withUid);
  const result = endConversation(julState, rel);
  const rating = result?.rating ?? 0;

  const julPlayer = worldManager.getPlayer(worldId, JUL_UID);
  if (julPlayer) {
    julPlayer.status = 'idle';
    julPlayer.chattingWith = undefined;
  }

  (async () => {
    try {
      const summary = await provider.summarizeConversation({
        messages: messagesToSummarize,
        relationship: rel,
      });
      const wentWell = rating >= 0;
      await memory.updateAfterConversation(withUid, wentWell, summary);
      console.log('[jul] memory saved for', withUid, '| rating:', rating);
    } catch (err) {
      console.error('[jul] memory save failed:', (err as Error).message);
    }
  })();

  return { rating };
}

// ── Jul initiates contact ──

export async function handleJulInitiateContact(
  worldId: string,
  targetUid: string,
): Promise<void> {
  if (!tryStartConversation(julState, targetUid)) return;

  // Generate greeting for when the user accepts
  try {
    const rel = await memory.getRelationship(targetUid);
    const greeting = await provider.generateReply({
      interactionType: 'greeting',
      recentMessages: [],
      mood: julState.mood,
      energy: julState.energy,
      personality: JUL_CHARACTER_PROMPT,
      relationship: rel,
    });

    julState.conversationMessages.push({ role: 'jul', text: greeting });
    incrementDailyCount(julState);

    // Send greeting as first chat message
    const msg = { fromUid: JUL_UID, text: greeting, timestamp: Date.now() };
    const sock = callbacks?.findSocketByUid(targetUid);
    sock?.emit('chat_message', msg);
    console.log('[jul] sent greeting (initiated) to', targetUid);
  } catch (err) {
    console.error('[jul] initiate greeting failed:', (err as Error).message);
  }
}

// ── Accept from user when Jul initiated ──

export function handleJulRespondAccepted(worldId: string, userUid: string): void {
  const julPlayer = worldManager.getPlayer(worldId, JUL_UID);
  if (julPlayer) {
    julPlayer.status = 'chatting';
    julPlayer.chattingWith = userUid;
  }
  // Conversation already started in handleJulInitiateContact
  if (!julState.lockedConversationUid) {
    tryStartConversation(julState, userUid);
  }
}

export function handleJulRespondDeclined(worldId: string): void {
  const julPlayer = worldManager.getPlayer(worldId, JUL_UID);
  if (julPlayer) {
    julPlayer.status = 'idle';
    julPlayer.chattingWith = undefined;
  }
  julState.lockedConversationUid = null;
  julState.currentTargetUid = null;
  julState.mode = 'wandering';
  julState.modeTimer = 3;
  julState.conversationMessages = [];
  console.log('[jul] initiation declined, back to wandering');
}

// ── Helpers ──

export function getJulUid(): string {
  return JUL_UID;
}

export function getJulState(): JulState {
  return julState;
}

export function isJulUid(uid: string): boolean {
  return uid === JUL_UID;
}

// ── Partner disconnect cleanup ──

export function handleJulPartnerDisconnect(worldId: string, partnerUid: string): void {
  if (julState.currentTargetUid === partnerUid) {
    julState.currentTargetUid = null;
    if (julState.mode === 'observing' || julState.mode === 'approaching') {
      julState.mode = 'wandering';
      julState.modeTimer = 3;
    }
  }

  if (julState.lockedConversationUid !== partnerUid) return;

  const messagesToSummarize = [...julState.conversationMessages];
  const disconnectedUid = partnerUid;

  julState.lockedConversationUid = null;
  julState.currentTargetUid = null;
  julState.mode = 'wandering';
  julState.modeTimer = 3;
  julState.conversationCooldownUntil = Date.now() + JUL_PERSONALITY.conversationCooldownMs;
  julState.socialNeed = Math.max(0, julState.socialNeed - 0.2);
  julState.conversationMessages = [];

  const julPlayer = worldManager.getPlayer(worldId, JUL_UID);
  if (julPlayer) {
    julPlayer.status = 'idle';
    julPlayer.chattingWith = undefined;
  }

  (async () => {
    try {
      const rel = await memory.getRelationship(disconnectedUid);
      if (messagesToSummarize.length > 0) {
        const summary = await provider.summarizeConversation({
          messages: messagesToSummarize,
          relationship: rel,
        });
        await memory.updateAfterConversation(disconnectedUid, true, summary);
      }
      console.log('[jul] partner disconnected, memory saved for', disconnectedUid);
    } catch (err) {
      console.error('[jul] disconnect memory save failed:', (err as Error).message);
    }
  })();
}
