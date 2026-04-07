import type { PlayerState, Vec3, AuraType } from './types';

// ── Client → Server ──────────────────────────────────────

export interface ClientEvents {
  join_world: (data: { worldId: string; token: string }) => void;
  leave_world: () => void;
  update_state: (data: {
    position: Vec3;
    rotation?: { x: number; y: number; z: number; w: number };
    aura?: AuraType;
  }) => void;
  request_contact: (data: { targetUid: string }) => void;
  respond_contact: (data: { fromUid: string; accept: boolean }) => void;
  chat_message: (data: { toUid: string; text: string }) => void;
  typing_start: (data: { toUid: string }) => void;
  typing_stop: (data: { toUid: string }) => void;
  end_chat: (data: { withUid: string }) => void;
  rate_core: (data: { withUid: string; value: number }) => void;
  report_user: (data: { targetUid: string }) => void;
}

// ── Server → Client ──────────────────────────────────────

export interface ServerEvents {
  world_snapshot: (data: {
    players: Record<string, PlayerState>;
    worldId: string;
  }) => void;
  player_joined: (data: { player: PlayerState }) => void;
  player_left: (data: { uid: string }) => void;
  player_update: (data: {
    uid: string;
    position: Vec3;
    rotation?: { x: number; y: number; z: number; w: number };
    aura?: AuraType;
    status?: string;
  }) => void;
  incoming_request: (data: { fromUid: string }) => void;
  request_declined: (data: { byUid: string }) => void;
  request_timeout: (data: { fromUid: string }) => void;
  contact_started: (data: { withUid: string }) => void;
  chat_message: (data: {
    fromUid: string;
    text: string;
    timestamp: number;
  }) => void;
  typing_start: (data: { fromUid: string }) => void;
  typing_stop: (data: { fromUid: string }) => void;
  chat_ended: (data: { withUid: string; ratingCooldownUntil?: number }) => void;
  core_updated: (data: { uid: string; coreValue: number }) => void;
  rating_received: (data: { fromUid: string; value: number; newCoreValue: number }) => void;
  rate_blocked: (data: { targetUid: string }) => void;
  error: (data: { message: string; code?: string }) => void;
}
