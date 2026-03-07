import { create } from 'zustand';
import type { PlayerState, Vec3, AuraType } from '@spheres/shared';
import { WORLD_CONFIG } from '@spheres/shared';
import { createSocket, type AppSocket } from '../lib/socket';

export interface RemotePlayer {
  state: PlayerState;
  targetPos: Vec3;
  prevPos: Vec3;
}

export type ContactState = 'idle' | 'outgoing' | 'incoming' | 'chatting' | 'rating';

export interface ChatMessage {
  fromUid: string;
  text: string;
  timestamp: number;
  isOwn: boolean;
}

interface WorldStore {
  connected: boolean;
  worldId: string;
  socket: AppSocket | null;
  remotePlayers: Record<string, RemotePlayer>;
  myUid: string | null;

  // Contact / proximity
  nearestPlayer: { uid: string; distance: number } | null;
  contactState: ContactState;
  contactTargetUid: string | null;
  incomingFromUid: string | null;
  cooldowns: Record<string, number>;

  // Contact timing
  requestStartedAt: number | null;

  // Chat
  chatMessages: ChatMessage[];
  chatMessageCount: number;

  // Rating feedback
  ratingFeedback: { value: number; timestamp: number } | null;

  // Kicked state
  kickedMessage: string | null;

  connect: (token: string, uid: string) => void;
  disconnect: () => void;
  sendPositionUpdate: (
    pos: Vec3,
    rotation?: { x: number; y: number; z: number; w: number },
    aura?: AuraType,
  ) => void;
  setNearestPlayer: (nearest: { uid: string; distance: number } | null) => void;
  requestContact: (targetUid: string) => void;
  respondContact: (fromUid: string, accept: boolean) => void;
  sendChatMessage: (text: string) => void;
  endChat: () => void;
  reportUser: () => void;
  submitRating: (value: number) => void;
  skipRating: () => void;
}

export const useWorldStore = create<WorldStore>((set, get) => ({
  connected: false,
  worldId: WORLD_CONFIG.defaultWorldId,
  socket: null,
  remotePlayers: {},
  myUid: null,

  nearestPlayer: null,
  contactState: 'idle',
  contactTargetUid: null,
  incomingFromUid: null,
  cooldowns: {},
  requestStartedAt: null,
  chatMessages: [],
  chatMessageCount: 0,
  ratingFeedback: null,
  kickedMessage: null,

  connect: (token, uid) => {
    const existing = get().socket;
    if (existing) existing.disconnect();

    const socket = createSocket(token);
    set({ socket, myUid: uid, kickedMessage: null });

    socket.on('connect', () => {
      socket.emit('join_world', {
        worldId: WORLD_CONFIG.defaultWorldId,
        token,
      });
    });

    socket.on('world_snapshot', ({ players, worldId }) => {
      const remotePlayers: Record<string, RemotePlayer> = {};
      for (const [pUid, state] of Object.entries(players)) {
        if (pUid === uid) continue;
        remotePlayers[pUid] = {
          state,
          prevPos: { ...state.position },
          targetPos: { ...state.position },
        };
      }
      set({ connected: true, worldId, remotePlayers });
    });

    socket.on('player_joined', ({ player }) => {
      if (player.uid === uid) return;
      const { remotePlayers } = get();
      set({
        remotePlayers: {
          ...remotePlayers,
          [player.uid]: {
            state: player,
            prevPos: { ...player.position },
            targetPos: { ...player.position },
          },
        },
      });
    });

    socket.on('player_left', ({ uid: leftUid }) => {
      const { remotePlayers, contactTargetUid, incomingFromUid } = get();
      const { [leftUid]: _, ...rest } = remotePlayers;
      const updates: Partial<WorldStore> = { remotePlayers: rest };

      if (contactTargetUid === leftUid || incomingFromUid === leftUid) {
        updates.contactState = 'idle';
        updates.contactTargetUid = null;
        updates.incomingFromUid = null;
      }

      set(updates as any);
    });

    socket.on('player_update', ({ uid: updateUid, position, aura, status }) => {
      if (updateUid === uid) return;
      const { remotePlayers } = get();
      const existing = remotePlayers[updateUid];
      if (!existing) return;

      set({
        remotePlayers: {
          ...remotePlayers,
          [updateUid]: {
            state: {
              ...existing.state,
              ...(aura && { aura: aura as AuraType }),
              ...(status && { status: status as PlayerState['status'] }),
              ...(position && { position }),
              lastUpdateTs: Date.now(),
            },
            prevPos: { ...existing.targetPos },
            targetPos: position || existing.targetPos,
          },
        },
      });
    });

    // ── Contact events ────────────────────

    socket.on('incoming_request', ({ fromUid }) => {
      set({ contactState: 'incoming', incomingFromUid: fromUid, requestStartedAt: Date.now() });
    });

    socket.on('request_timeout', () => {
      set({ contactState: 'idle', incomingFromUid: null, requestStartedAt: null });
    });

    socket.on('contact_started', ({ withUid }) => {
      set({
        contactState: 'chatting',
        contactTargetUid: withUid,
        incomingFromUid: null,
        requestStartedAt: null,
        chatMessages: [],
        chatMessageCount: 0,
      });
    });

    socket.on('chat_message', ({ fromUid, text, timestamp }) => {
      const { chatMessages, myUid: self } = get();
      set({
        chatMessages: [
          ...chatMessages,
          { fromUid, text, timestamp, isOwn: fromUid === self },
        ],
      });
    });

    socket.on('request_declined', ({ byUid }) => {
      const { cooldowns } = get();
      set({
        contactState: 'idle',
        contactTargetUid: null,
        requestStartedAt: null,
        cooldowns: {
          ...cooldowns,
          [byUid]: Date.now() + WORLD_CONFIG.contactCooldownMs,
        },
      });
    });

    socket.on('chat_ended', ({ withUid }) => {
      const { chatMessageCount } = get();
      if (chatMessageCount >= 1) {
        set({ contactState: 'rating', contactTargetUid: withUid, incomingFromUid: null, requestStartedAt: null, chatMessages: [], chatMessageCount: 0 });
      } else {
        set({ contactState: 'idle', contactTargetUid: null, incomingFromUid: null, requestStartedAt: null, chatMessages: [], chatMessageCount: 0 });
      }
    });

    socket.on('core_updated', ({ uid: coreUid, coreValue }) => {
      const { remotePlayers } = get();
      const existing = remotePlayers[coreUid];
      if (!existing) return;
      set({
        remotePlayers: {
          ...remotePlayers,
          [coreUid]: {
            ...existing,
            state: { ...existing.state, coreValue },
          },
        },
      });
    });

    socket.on('rating_received', ({ value }) => {
      set({ ratingFeedback: { value, timestamp: Date.now() } });
      setTimeout(() => {
        const { ratingFeedback } = get();
        if (ratingFeedback && Date.now() - ratingFeedback.timestamp >= 2500) {
          set({ ratingFeedback: null });
        }
      }, 3000);
    });

    socket.on('error', ({ message, code }) => {
      console.error('[socket] error:', message);
      if (code === 'DUPLICATE_SESSION') {
        set({ kickedMessage: message, connected: false, contactState: 'idle', contactTargetUid: null, incomingFromUid: null, requestStartedAt: null });
        return;
      }
      const { contactState } = get();
      if (contactState === 'outgoing' || contactState === 'incoming') {
        set({ contactState: 'idle', contactTargetUid: null, incomingFromUid: null, requestStartedAt: null });
      }
    });

    socket.on('disconnect', () => {
      set({ connected: false, contactState: 'idle', contactTargetUid: null, incomingFromUid: null, requestStartedAt: null });
    });

    socket.connect();
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.emit('leave_world');
      socket.disconnect();
    }
    set({
      socket: null,
      connected: false,
      remotePlayers: {},
      myUid: null,
      nearestPlayer: null,
      contactState: 'idle',
      contactTargetUid: null,
      incomingFromUid: null,
      requestStartedAt: null,
      cooldowns: {},
    });
  },

  sendPositionUpdate: (pos, rotation, aura) => {
    const { socket, connected } = get();
    if (!socket || !connected) return;
    socket.emit('update_state', { position: pos, rotation, aura });
  },

  setNearestPlayer: (nearest) => set({ nearestPlayer: nearest }),

  requestContact: (targetUid) => {
    const { socket, connected, contactState } = get();
    if (!socket || !connected || contactState !== 'idle') return;
    socket.emit('request_contact', { targetUid });
    set({ contactState: 'outgoing', contactTargetUid: targetUid, requestStartedAt: Date.now() });
  },

  respondContact: (fromUid, accept) => {
    const { socket, connected } = get();
    if (!socket || !connected) return;
    socket.emit('respond_contact', { fromUid, accept });

    if (accept) {
      set({
        contactState: 'chatting',
        contactTargetUid: fromUid,
        incomingFromUid: null,
        requestStartedAt: null,
        chatMessages: [],
        chatMessageCount: 0,
      });
    } else {
      set({ contactState: 'idle', incomingFromUid: null, requestStartedAt: null });
    }
  },

  sendChatMessage: (text) => {
    const { socket, connected, contactState, contactTargetUid, chatMessageCount } = get();
    if (!socket || !connected || contactState !== 'chatting' || !contactTargetUid) return;
    const trimmed = text.trim();
    if (!trimmed || trimmed.length > 500) return;
    socket.emit('chat_message', { toUid: contactTargetUid, text: trimmed });
    set({ chatMessageCount: chatMessageCount + 1 });
  },

  endChat: () => {
    const { socket, connected, contactState, contactTargetUid, chatMessageCount } = get();
    if (!socket || !connected || contactState !== 'chatting' || !contactTargetUid) return;
    socket.emit('end_chat', { withUid: contactTargetUid });

    if (chatMessageCount >= 1) {
      set({ contactState: 'rating', requestStartedAt: null, chatMessages: [], chatMessageCount: 0 });
    } else {
      set({ contactState: 'idle', contactTargetUid: null, requestStartedAt: null, chatMessages: [], chatMessageCount: 0 });
    }
  },

  reportUser: () => {
    const { socket, connected, contactTargetUid } = get();
    if (!socket || !connected || !contactTargetUid) return;
    socket.emit('report_user', { targetUid: contactTargetUid });
  },

  submitRating: (value) => {
    const { socket, connected, contactTargetUid } = get();
    if (socket && connected && contactTargetUid) {
      socket.emit('rate_core', { withUid: contactTargetUid, value });
    }
    set({ contactState: 'idle', contactTargetUid: null, requestStartedAt: null });
  },

  skipRating: () => {
    set({ contactState: 'idle', contactTargetUid: null, requestStartedAt: null });
  },
}));
