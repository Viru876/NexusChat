import { Server, Socket } from 'socket.io';
import crypto from 'crypto';

interface SocketUser {
  id: string;
  name: string;
  avatar?: string | null;
}

interface ParticipantInfo {
  id: string;
  name: string;
  avatar?: string | null;
}

interface CallState {
  callId: string;
  initiatorId: string;
  type: 'audio' | 'video';
  // Everyone who has actually joined (initiator joins immediately).
  participants: Map<string, ParticipantInfo>;
  createdAt: number;
}

// In-memory registry of active group calls keyed by callId.
const activeCalls = new Map<string, CallState>();

// Map of userId -> set of socket ids (a user may have multiple tabs).
const userSockets = new Map<string, Set<string>>();

export function trackUserSocket(userId: string, socketId: string): void {
  if (!userSockets.has(userId)) {
    userSockets.set(userId, new Set());
  }
  userSockets.get(userId)!.add(socketId);
}

export function untrackUserSocket(userId: string, socketId: string): void {
  const set = userSockets.get(userId);
  if (set) {
    set.delete(socketId);
    if (set.size === 0) userSockets.delete(userId);
  }
}

/**
 * Returns true if the user still has at least one active socket connection.
 */
export function hasUserSockets(userId: string): boolean {
  const set = userSockets.get(userId);
  return Boolean(set && set.size > 0);
}

function emitToUser(io: Server, userId: string, event: string, payload: unknown): void {
  const sockets = userSockets.get(userId);
  if (!sockets) return;
  sockets.forEach((sid) => io.to(sid).emit(event, payload));
}

function toInfo(user: SocketUser): ParticipantInfo {
  return { id: user.id, name: user.name, avatar: user.avatar };
}

/**
 * Generates time-limited TURN credentials using HMAC-based shared-secret
 * auth (RFC 5766 / coturn compatible). The Open Relay staticauth endpoint
 * uses secret "openrelayprojectsecret". Credentials expire after `ttl`
 * seconds; the client must refresh before expiry for long calls.
 */
function generateTurnCredentials(ttl = 86400): { username: string; credential: string } {
  const secret = 'openrelayprojectsecret';
  const timestamp = Math.floor(Date.now() / 1000) + ttl;
  const username = `${timestamp}:nexuschat`;
  const credential = crypto
    .createHmac('sha1', secret)
    .update(username)
    .digest('base64');
  return { username, credential };
}

/**
 * Returns the ICE server configuration to be sent to clients. Uses the
 * staticauth TURN endpoint from Open Relay (metered.ca) with dynamically
 * generated HMAC credentials, plus standard STUN servers as fallback for
 * same-network peers.
 */
function getIceServers(): Array<{ urls: string | string[]; username?: string; credential?: string }> {
  const { username, credential } = generateTurnCredentials();
  return [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    {
      urls: 'turn:staticauth.openrelay.metered.ca:80',
      username,
      credential,
    },
    {
      urls: 'turn:staticauth.openrelay.metered.ca:443',
      username,
      credential,
    },
    {
      urls: 'turn:staticauth.openrelay.metered.ca:443?transport=tcp',
      username,
      credential,
    },
  ];
}

/**
 * Registers WebRTC signaling handlers for multi-party (mesh) group calls.
 * The server only tracks call membership and relays signaling data; media
 * flows peer-to-peer via simple-peer on the client. Topology rule: whenever
 * someone joins a call, THEY become the initiator of a peer connection to
 * every participant already in the call — this keeps join order
 * deterministic and avoids double-initiator races.
 */
export function registerVideoHandlers(io: Server, socket: Socket): void {
  const user = socket.data.user as SocketUser;

  socket.on(
    'call_initiate',
    (
      payload: { calleeIds: string[]; type: 'audio' | 'video' },
      ack?: (res: { callId: string; iceServers: Array<{ urls: string | string[]; username?: string; credential?: string }> }) => void
    ) => {
      const callId = `${user.id}-${Date.now()}`;
      const call: CallState = {
        callId,
        initiatorId: user.id,
        type: payload.type,
        participants: new Map([[user.id, toInfo(user)]]),
        createdAt: Date.now(),
      };
      activeCalls.set(callId, call);

      const uniqueCallees = Array.from(new Set(payload.calleeIds)).filter(
        (id) => id !== user.id
      );
      uniqueCallees.forEach((calleeId) => {
        emitToUser(io, calleeId, 'call:incoming', {
          callId,
          type: payload.type,
          caller: toInfo(user),
        });
      });

      if (ack) ack({ callId, iceServers: getIceServers() });
    }
  );

  // A callee (or anyone invited) actually joins the call room.
  socket.on('call_join', (payload: { callId: string }) => {
    const call = activeCalls.get(payload.callId);
    if (!call) {
      emitToUser(io, user.id, 'call:ended', { callId: payload.callId });
      return;
    }

    const existing = Array.from(call.participants.values()).filter(
      (p) => p.id !== user.id
    );

    call.participants.set(user.id, toInfo(user));

    // Tell the joiner who is already here — they will initiate peers to each.
    emitToUser(io, user.id, 'call:existing_participants', {
      callId: payload.callId,
      participants: existing,
      iceServers: getIceServers(),
    });

    // Tell everyone already in the call that a new peer will connect to them.
    existing.forEach((p) => {
      emitToUser(io, p.id, 'call:participant_joined', {
        callId: payload.callId,
        participant: toInfo(user),
      });
    });
  });

  socket.on('call_reject', (payload: { callId: string }) => {
    const call = activeCalls.get(payload.callId);
    if (!call) return;
    emitToUser(io, call.initiatorId, 'call:rejected', {
      callId: payload.callId,
      userId: user.id,
      name: user.name,
    });
  });

  // Voluntary hangup / leave — call continues for any remaining participants.
  socket.on('call_leave', (payload: { callId: string }) => {
    const call = activeCalls.get(payload.callId);
    if (!call) return;

    call.participants.delete(user.id);

    call.participants.forEach((p) => {
      emitToUser(io, p.id, 'call:participant_left', {
        callId: payload.callId,
        userId: user.id,
      });
    });

    if (call.participants.size === 0) {
      activeCalls.delete(payload.callId);
    }
  });

  // Relay the WebRTC offer/answer/ICE to the target peer.
  socket.on('offer', (payload: { to: string; signal: unknown; callId: string }) => {
    emitToUser(io, payload.to, 'offer', {
      from: user.id,
      signal: payload.signal,
      callId: payload.callId,
    });
  });

  socket.on('answer', (payload: { to: string; signal: unknown; callId: string }) => {
    emitToUser(io, payload.to, 'answer', {
      from: user.id,
      signal: payload.signal,
      callId: payload.callId,
    });
  });

  socket.on('ice_candidate', (payload: { to: string; candidate: unknown; callId: string }) => {
    emitToUser(io, payload.to, 'ice_candidate', {
      from: user.id,
      candidate: payload.candidate,
      callId: payload.callId,
    });
  });

  // Clean up any calls this socket's user was part of on disconnect. Note:
  // this handler runs BEFORE index.ts's disconnect handler calls
  // untrackUserSocket, so we must exclude the disconnecting socket itself
  // when checking whether the user still has other active tabs.
  socket.on('disconnect', () => {
    const sockets = userSockets.get(user.id);
    const remainingOtherSockets = sockets
      ? sockets.size - (sockets.has(socket.id) ? 1 : 0)
      : 0;
    if (remainingOtherSockets > 0) return; // still has other tabs connected
    activeCalls.forEach((call, callId) => {
      if (!call.participants.has(user.id)) return;
      call.participants.delete(user.id);
      call.participants.forEach((p) => {
        emitToUser(io, p.id, 'call:participant_left', { callId, userId: user.id });
      });
      if (call.participants.size === 0) {
        activeCalls.delete(callId);
      }
    });
  });
}
