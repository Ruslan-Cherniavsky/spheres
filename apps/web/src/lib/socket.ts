import { io, type Socket } from 'socket.io-client';
import type { ClientEvents, ServerEvents } from '@spheres/shared';

const WORLD_SERVER_URL =
  import.meta.env.VITE_WORLD_SERVER_URL || 'http://localhost:3001';

export type AppSocket = Socket<ServerEvents, ClientEvents>;

export function createSocket(token: string): AppSocket {
  return io(WORLD_SERVER_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    autoConnect: false,
  });
}
