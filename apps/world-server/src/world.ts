import type { PlayerState, Vec3, AuraType } from '@spheres/shared';

export interface ServerPlayerState extends PlayerState {
  socketId: string;
  chattingWith?: string;
}

interface WorldState {
  players: Map<string, ServerPlayerState>;
}

class WorldManager {
  private worlds = new Map<string, WorldState>();

  getOrCreate(worldId: string): WorldState {
    let world = this.worlds.get(worldId);
    if (!world) {
      world = { players: new Map() };
      this.worlds.set(worldId, world);
    }
    return world;
  }

  addPlayer(worldId: string, player: ServerPlayerState): void {
    this.getOrCreate(worldId).players.set(player.uid, player);
  }

  removePlayer(worldId: string, uid: string): void {
    const world = this.worlds.get(worldId);
    if (!world) return;
    world.players.delete(uid);
  }

  updatePlayer(
    worldId: string,
    uid: string,
    data: { position?: Vec3; rotation?: any; aura?: AuraType },
  ): void {
    const player = this.getPlayer(worldId, uid);
    if (!player) return;
    if (data.position) player.position = data.position;
    if (data.rotation) player.rotation = data.rotation;
    if (data.aura) player.aura = data.aura;
    player.lastUpdateTs = Date.now();
  }

  getPlayer(worldId: string, uid: string): ServerPlayerState | undefined {
    return this.worlds.get(worldId)?.players.get(uid);
  }

  getSnapshot(worldId: string): Record<string, PlayerState> {
    const world = this.worlds.get(worldId);
    if (!world) return {};

    const snapshot: Record<string, PlayerState> = {};
    for (const [uid, player] of world.players) {
      const { socketId: _, chattingWith: _c, ...state } = player;
      snapshot[uid] = state;
    }
    return snapshot;
  }

  getPlayers(worldId: string): ServerPlayerState[] {
    const world = this.worlds.get(worldId);
    if (!world) return [];
    return Array.from(world.players.values());
  }

  getPlayerCount(worldId: string): number {
    return this.worlds.get(worldId)?.players.size ?? 0;
  }
}

export const worldManager = new WorldManager();
