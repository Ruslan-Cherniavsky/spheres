import 'dotenv/config';
import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import cors from 'cors';
import { getFirestore } from 'firebase-admin/firestore';
import { WORLD_CONFIG, CORE_VALUE } from '@spheres/shared';
import type { AuraType } from '@spheres/shared';
import { initFirebaseAdmin, verifyToken } from './auth.js';
import { worldManager } from './world.js';
import { spawnAISpheres, tickAI, getAIUids } from './ai.js';

const PORT = parseInt(process.env.PORT || '3001', 10);
const CORS_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',');

initFirebaseAdmin();

// ── Express ───────────────────────────────

const app = express();
app.use(cors({ origin: CORS_ORIGINS }));

app.get('/', (_req, res) => {
  res.json({
    name: 'spheres-world-server',
    status: 'ok',
    defaultWorld: WORLD_CONFIG.defaultWorldId,
  });
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    players: worldManager.getPlayerCount(WORLD_CONFIG.defaultWorldId),
  });
});

// ── Socket.io ─────────────────────────────

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: CORS_ORIGINS, methods: ['GET', 'POST'] },
});

// socket → world mapping
const socketMeta = new Map<string, { worldId: string; uid: string }>();
// contact request timeout tracking: "requesterUid:targetUid" → timeoutId
const requestTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

function requestKey(uid1: string, uid2: string) {
  return `${uid1}:${uid2}`;
}

function clearRequestTimeout(uid1: string, uid2: string) {
  const k = requestKey(uid1, uid2);
  const tid = requestTimeouts.get(k);
  if (tid) {
    clearTimeout(tid);
    requestTimeouts.delete(k);
  }
}

// Rating cooldown: "raterUid:targetUid" → timestamp of last rating
const ratingCooldowns = new Map<string, number>();

function ratingPairKey(raterUid: string, targetUid: string) {
  return `${raterUid}:${targetUid}`;
}

async function checkRatingCooldown(raterUid: string, targetUid: string): Promise<boolean> {
  const key = ratingPairKey(raterUid, targetUid);
  const now = Date.now();

  const cached = ratingCooldowns.get(key);
  if (cached && now - cached < CORE_VALUE.ratingCooldownMs) return false;

  try {
    const db = getFirestore('spheres');
    const doc = await db.collection('ratingCooldowns').doc(key).get();
    if (doc.exists) {
      const lastRated = doc.data()?.timestamp as number;
      ratingCooldowns.set(key, lastRated);
      if (now - lastRated < CORE_VALUE.ratingCooldownMs) return false;
    }
  } catch (err) {
    console.error('[rate-cooldown] firestore check failed:', (err as Error).message);
  }

  return true;
}

async function recordRating(raterUid: string, targetUid: string) {
  const key = ratingPairKey(raterUid, targetUid);
  const now = Date.now();
  ratingCooldowns.set(key, now);

  try {
    const db = getFirestore('spheres');
    await db.collection('ratingCooldowns').doc(key).set({
      raterUid,
      targetUid,
      timestamp: now,
    });
  } catch (err) {
    console.error('[rate-cooldown] firestore write failed:', (err as Error).message);
  }
}

io.on('connection', (socket) => {
  console.log(`[ws] connected: ${socket.id}`);

  // ── Join world ────────────────────────
  socket.on('join_world', async ({ worldId, token }) => {
    try {
      const decoded = await verifyToken(token);
      const uid = decoded.uid;

      // Kick previous session if same user is already connected
      for (const [oldSocketId, oldMeta] of socketMeta) {
        if (oldMeta.uid === uid && oldSocketId !== socket.id) {
          const oldSock = io.sockets.sockets.get(oldSocketId);
          if (oldSock) {
            oldSock.emit('error', { message: 'Logged in from another location', code: 'DUPLICATE_SESSION' });
            oldSock.disconnect(true);
          }
          handleLeave(oldSock ?? socket, oldSocketId);
        }
      }

      socket.join(worldId);
      socketMeta.set(socket.id, { worldId, uid });

      worldManager.addPlayer(worldId, {
        uid,
        socketId: socket.id,
        position: {
          x: (Math.random() - 0.5) * 20,
          y: (Math.random() - 0.5) * 10,
          z: (Math.random() - 0.5) * 20,
        },
        aura: 'neutral',
        coreValue: 0,
        status: 'idle',
        isAI: false,
        lastUpdateTs: Date.now(),
      });

      // Send full snapshot
      socket.emit('world_snapshot', {
        players: worldManager.getSnapshot(worldId),
        worldId,
      });

      // Notify others
      const player = worldManager.getPlayer(worldId, uid);
      if (player) {
        const { socketId: _, ...state } = player;
        socket.to(worldId).emit('player_joined', { player: state });
      }

      console.log(`[ws] ${uid} joined ${worldId} (${worldManager.getPlayerCount(worldId)} players)`);
    } catch (err) {
      console.error(`[ws] auth failed: ${(err as Error).message}`);
      socket.emit('error', { message: 'Authentication failed', code: 'AUTH_FAILED' });
      socket.disconnect();
    }
  });

  // ── Position / state updates ──────────
  socket.on('update_state', (data) => {
    const meta = socketMeta.get(socket.id);
    if (!meta) return;

    worldManager.updatePlayer(meta.worldId, meta.uid, {
      position: data.position,
      rotation: data.rotation,
      aura: data.aura as AuraType | undefined,
    });

    socket.to(meta.worldId).emit('player_update', {
      uid: meta.uid,
      position: data.position,
      rotation: data.rotation,
      aura: data.aura as AuraType | undefined,
    });
  });

  // ── Contact request ──────────────────
  socket.on('request_contact', ({ targetUid }) => {
    const meta = socketMeta.get(socket.id);
    if (!meta) return;

    const requester = worldManager.getPlayer(meta.worldId, meta.uid);
    const target = worldManager.getPlayer(meta.worldId, targetUid);

    if (!requester || !target) {
      socket.emit('error', { message: 'Player not found' });
      return;
    }

    if (requester.status !== 'idle' || target.status !== 'idle') {
      socket.emit('error', { message: 'Player is busy' });
      return;
    }

    requester.status = 'requesting';
    target.status = 'requesting';

    if (target.isAI) {
      scheduleAIResponse(meta.worldId, meta.uid, targetUid);
    } else {
      const targetSock = io.sockets.sockets.get(target.socketId);
      targetSock?.emit('incoming_request', { fromUid: meta.uid });
    }

    // Auto-decline after timeout
    const key = requestKey(meta.uid, targetUid);
    const tid = setTimeout(() => {
      requestTimeouts.delete(key);
      const r = worldManager.getPlayer(meta.worldId, meta.uid);
      const t = worldManager.getPlayer(meta.worldId, targetUid);
      if (r?.status === 'requesting') r.status = 'idle';
      if (t?.status === 'requesting') t.status = 'idle';

      const reqSock = findSocketByUid(meta.uid);
      reqSock?.emit('request_declined', { byUid: targetUid });
      if (t && !t.isAI) {
        const tSock = findSocketByUid(targetUid);
        tSock?.emit('request_timeout', { fromUid: meta.uid });
      }
      console.log(`[contact] timeout: ${meta.uid} → ${targetUid}`);
    }, WORLD_CONFIG.contactRequestTimeoutMs);
    requestTimeouts.set(key, tid);

    console.log(`[contact] ${meta.uid} → ${targetUid}`);
  });

  // ── Contact response ──────────────────
  socket.on('respond_contact', ({ fromUid, accept }) => {
    const meta = socketMeta.get(socket.id);
    if (!meta) return;

    clearRequestTimeout(fromUid, meta.uid);

    const requester = worldManager.getPlayer(meta.worldId, fromUid);
    const responder = worldManager.getPlayer(meta.worldId, meta.uid);
    if (!requester || !responder) return;

    if (accept) {
      requester.status = 'chatting';
      responder.status = 'chatting';

      const reqSock = io.sockets.sockets.get(requester.socketId);
      reqSock?.emit('contact_started', { withUid: meta.uid });
      socket.emit('contact_started', { withUid: fromUid });
      console.log(`[contact] accepted: ${fromUid} ↔ ${meta.uid}`);
    } else {
      requester.status = 'idle';
      responder.status = 'idle';

      const reqSock = io.sockets.sockets.get(requester.socketId);
      reqSock?.emit('request_declined', { byUid: meta.uid });
      console.log(`[contact] declined: ${meta.uid} declined ${fromUid}`);
    }
  });

  // ── Chat message relay ──────────────────
  socket.on('chat_message', ({ toUid, text }) => {
    const meta = socketMeta.get(socket.id);
    if (!meta) return;

    const sender = worldManager.getPlayer(meta.worldId, meta.uid);
    if (!sender || sender.status !== 'chatting') return;
    if (!text || text.length > 500) return;

    const msg = { fromUid: meta.uid, text, timestamp: Date.now() };

    // Echo to sender
    socket.emit('chat_message', msg);

    const target = worldManager.getPlayer(meta.worldId, toUid);
    if (!target) return;

    if (target.isAI) {
      scheduleAIChat(meta.worldId, meta.uid, toUid);
    } else {
      const targetSock = findSocketByUid(toUid);
      targetSock?.emit('chat_message', msg);
    }
  });

  // ── End chat ───────────────────────────
  socket.on('end_chat', async ({ withUid }) => {
    const meta = socketMeta.get(socket.id);
    if (!meta) return;

    const player = worldManager.getPlayer(meta.worldId, meta.uid);
    const other = worldManager.getPlayer(meta.worldId, withUid);

    if (player) player.status = 'idle';
    if (other) other.status = 'idle';

    if (other && !other.isAI) {
      const otherSock = findSocketByUid(withUid);

      const [senderAllowed, receiverAllowed] = await Promise.all([
        checkRatingCooldown(meta.uid, withUid),
        checkRatingCooldown(withUid, meta.uid),
      ]);

      const senderCooldownUntil = senderAllowed ? undefined
        : (ratingCooldowns.get(ratingPairKey(meta.uid, withUid)) ?? 0) + CORE_VALUE.ratingCooldownMs;
      const receiverCooldownUntil = receiverAllowed ? undefined
        : (ratingCooldowns.get(ratingPairKey(withUid, meta.uid)) ?? 0) + CORE_VALUE.ratingCooldownMs;

      socket.emit('chat_ended', { withUid, ratingCooldownUntil: senderCooldownUntil });
      otherSock?.emit('chat_ended', { withUid: meta.uid, ratingCooldownUntil: receiverCooldownUntil });
    } else {
      socket.emit('chat_ended', { withUid });
    }

    if (other?.isAI) {
      scheduleAIRating(meta.worldId, meta.uid, withUid);
    }

    console.log(`[chat] ended: ${meta.uid} ↔ ${withUid}`);
  });

  // ── Rate core ──────────────────────────
  socket.on('rate_core', async ({ withUid, value }) => {
    const meta = socketMeta.get(socket.id);
    if (!meta) return;

    const numValue = Number(value);
    if (!Number.isFinite(numValue) || numValue < -2 || numValue > 2) return;
    if (withUid === meta.uid) return;

    const target = worldManager.getPlayer(meta.worldId, withUid);
    if (!target) return;

    if (!target.isAI) {
      const allowed = await checkRatingCooldown(meta.uid, withUid);
      if (!allowed) {
        socket.emit('rate_blocked', { targetUid: withUid });
        console.log(`[rate] blocked: ${meta.uid} → ${withUid} (cooldown)`);
        return;
      }
    }

    const step = numValue * CORE_VALUE.ratingStep;
    const newCore = Math.max(CORE_VALUE.min, Math.min(CORE_VALUE.max, target.coreValue + step));
    target.coreValue = newCore;

    io.to(meta.worldId).emit('core_updated', { uid: withUid, coreValue: newCore });

    if (!target.isAI) {
      updateCoreInFirestore(withUid, newCore);
      recordRating(meta.uid, withUid);
    }

    console.log(`[rate] ${meta.uid} rated ${withUid}: ${numValue} → core=${newCore.toFixed(3)}`);
  });

  // ── Report user (metadata only) ────────
  socket.on('report_user', ({ targetUid }) => {
    const meta = socketMeta.get(socket.id);
    if (!meta) return;
    saveReport(meta.uid, targetUid);
  });

  // ── Leave / disconnect ────────────────
  socket.on('leave_world', () => handleLeave(socket));
  socket.on('disconnect', (reason) => {
    handleLeave(socket);
    console.log(`[ws] disconnected: ${socket.id} (${reason})`);
  });
});

function handleLeave(socket: import('socket.io').Socket, socketIdOverride?: string) {
  const sid = socketIdOverride ?? socket.id;
  const meta = socketMeta.get(sid);
  if (!meta) return;

  // If player was chatting/requesting, reset the other party
  const player = worldManager.getPlayer(meta.worldId, meta.uid);
  if (player && player.status !== 'idle') {
    // Find any player in chatting/requesting state linked to this one
    const snapshot = worldManager.getSnapshot(meta.worldId);
    for (const [uid, p] of Object.entries(snapshot)) {
      if (uid === meta.uid) continue;
      if (p.status === 'chatting' || p.status === 'requesting') {
        const other = worldManager.getPlayer(meta.worldId, uid);
        if (other && !other.isAI) {
          other.status = 'idle';
          const otherSock = io.sockets.sockets.get(other.socketId);
          otherSock?.emit('chat_ended', { withUid: meta.uid });
        } else if (other?.isAI) {
          other.status = 'idle';
        }
      }
    }
  }

  // Clear any pending request timeouts involving this player
  for (const [key, tid] of requestTimeouts) {
    if (key.startsWith(`${meta.uid}:`) || key.endsWith(`:${meta.uid}`)) {
      clearTimeout(tid);
      requestTimeouts.delete(key);
    }
  }

  worldManager.removePlayer(meta.worldId, meta.uid);
  socket.to(meta.worldId).emit('player_left', { uid: meta.uid });
  socketMeta.delete(sid);
  console.log(`[ws] ${meta.uid} left ${meta.worldId}`);
}

function scheduleAIResponse(worldId: string, requesterUid: string, aiUid: string) {
  const delay = 1000 + Math.random() * 2000;
  const shouldAccept = Math.random() > 0.15; // 85% accept

  setTimeout(() => {
    const requester = worldManager.getPlayer(worldId, requesterUid);
    const ai = worldManager.getPlayer(worldId, aiUid);
    if (!requester || !ai || requester.status !== 'requesting') return;

    if (shouldAccept) {
      requester.status = 'chatting';
      ai.status = 'chatting';

      const reqSock = findSocketByUid(requesterUid);
      reqSock?.emit('contact_started', { withUid: aiUid });
      console.log(`[ai] ${aiUid} accepted contact from ${requesterUid}`);
    } else {
      requester.status = 'idle';
      ai.status = 'idle';

      const reqSock = findSocketByUid(requesterUid);
      reqSock?.emit('request_declined', { byUid: aiUid });
      console.log(`[ai] ${aiUid} declined contact from ${requesterUid}`);
    }
  }, delay);
}

function findSocketByUid(uid: string) {
  for (const [socketId, meta] of socketMeta) {
    if (meta.uid === uid) return io.sockets.sockets.get(socketId);
  }
  return undefined;
}

// ── AI chat auto-responses ───────────────

const AI_PHRASES = [
  'Hello there!',
  'Nice to meet you!',
  'How are you doing?',
  'The stars are beautiful today.',
  'I enjoy floating here.',
  'What brings you to this corner of space?',
  'Have you met many other spheres?',
  'I feel calm here.',
  'This is a nice place to be.',
  'Do you like my aura?',
  'I was just thinking about the universe.',
  'It is peaceful, is it not?',
];

function scheduleAIChat(worldId: string, requesterUid: string, aiUid: string) {
  const delay = 1500 + Math.random() * 3000;
  setTimeout(() => {
    const ai = worldManager.getPlayer(worldId, aiUid);
    const requester = worldManager.getPlayer(worldId, requesterUid);
    if (!ai || !requester || ai.status !== 'chatting' || requester.status !== 'chatting') return;

    const text = AI_PHRASES[Math.floor(Math.random() * AI_PHRASES.length)];
    const msg = { fromUid: aiUid, text, timestamp: Date.now() };
    const reqSock = findSocketByUid(requesterUid);
    reqSock?.emit('chat_message', msg);
  }, delay);
}

// ── Report (Firestore metadata only) ─────

async function saveReport(reporterUid: string, targetUid: string) {
  try {
    const db = getFirestore('spheres');
    await db.collection('reports').add({
      reporterUid,
      targetUid,
      timestamp: Date.now(),
    });
    console.log(`[report] ${reporterUid} reported ${targetUid}`);
  } catch (err) {
    console.error('[report] failed:', (err as Error).message);
  }
}

// ── AI rating after chat ─────────────────

function scheduleAIRating(worldId: string, playerUid: string, _aiUid: string) {
  const delay = 1000 + Math.random() * 2000;
  setTimeout(() => {
    const player = worldManager.getPlayer(worldId, playerUid);
    if (!player) return;

    const ratingValue = Math.floor(Math.random() * 5) - 2;
    const step = ratingValue * CORE_VALUE.ratingStep;
    const newCore = Math.max(CORE_VALUE.min, Math.min(CORE_VALUE.max, player.coreValue + step));
    player.coreValue = newCore;

    io.to(worldId).emit('core_updated', { uid: playerUid, coreValue: newCore });

    const playerSock = findSocketByUid(playerUid);
    playerSock?.emit('rating_received', { fromUid: _aiUid, value: ratingValue, newCoreValue: newCore });

    if (!player.isAI) {
      updateCoreInFirestore(playerUid, newCore);
    }

    console.log(`[ai-rate] AI rated ${playerUid}: ${ratingValue} → core=${newCore.toFixed(3)}`);
  }, delay);
}

// ── Core value persistence ────────────────

async function updateCoreInFirestore(uid: string, coreValue: number) {
  try {
    const db = getFirestore('spheres');
    await db.doc(`users/${uid}`).update({ coreValue, updatedAt: Date.now() });
  } catch (err) {
    console.error('[core] firestore update failed:', (err as Error).message);
  }
}

// ── AI tick loop (10 Hz) ──────────────────

const DEFAULT_WORLD = WORLD_CONFIG.defaultWorldId;
spawnAISpheres(DEFAULT_WORLD, 10);

const AI_TICK_MS = 100;
setInterval(() => {
  tickAI(DEFAULT_WORLD, AI_TICK_MS / 1000);

  const aiUids = getAIUids();
  for (const uid of aiUids) {
    const player = worldManager.getPlayer(DEFAULT_WORLD, uid);
    if (!player) continue;
    io.to(DEFAULT_WORLD).emit('player_update', {
      uid,
      position: player.position,
      aura: player.aura,
      status: player.status,
    });
  }
}, AI_TICK_MS);

// ── Start ─────────────────────────────────

httpServer.listen(PORT, () => {
  console.log(`[spheres] world server on :${PORT}`);
  console.log(`[spheres] CORS: ${CORS_ORIGINS.join(', ')}`);
  console.log(`[spheres] AI spheres: 10 in ${DEFAULT_WORLD}`);
});
