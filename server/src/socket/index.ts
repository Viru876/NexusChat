import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt';
import prisma from '../config/database';
import { registerChatHandlers } from './chatHandlers';
import { registerPresenceHandlers, setUserStatus } from './presenceHandlers';
import {
  registerVideoHandlers,
  trackUserSocket,
  untrackUserSocket,
  hasUserSockets,
} from './videoHandlers';

let io: Server | null = null;

/**
 * Returns the initialized Socket.IO server instance. Throws if not yet ready.
 */
export function getIO(): Server {
  if (!io) {
    throw new Error('Socket.IO has not been initialized yet.');
  }
  return io;
}

/**
 * Parses a cookie header string into a key/value record.
 */
function parseCookies(cookieHeader?: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  cookieHeader.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx > -1) {
      const key = pair.slice(0, idx).trim();
      const value = decodeURIComponent(pair.slice(idx + 1).trim());
      out[key] = value;
    }
  });
  return out;
}

export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
      methods: ['GET', 'POST'],
    },
  });

  // Authenticate socket connections via handshake auth token or cookie.
  io.use(async (socket: Socket, next) => {
    try {
      const tokenFromAuth = socket.handshake.auth?.token as string | undefined;
      const cookies = parseCookies(socket.handshake.headers.cookie);
      const token = tokenFromAuth || cookies.token;

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const payload = verifyToken(token);
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, name: true, avatar: true },
      });
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.data.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid authentication token'));
    }
  });

  io.on('connection', async (socket: Socket) => {
    const user = socket.data.user as { id: string; name: string };
    trackUserSocket(user.id, socket.id);

    // Set the user online and let their workspaces know.
    await setUserStatus(io!, user.id, 'ONLINE');

    // Register the feature handlers.
    registerChatHandlers(io!, socket);
    registerPresenceHandlers(io!, socket);
    registerVideoHandlers(io!, socket);

    socket.on('disconnect', async () => {
      untrackUserSocket(user.id, socket.id);
      // Only mark offline when the user has no other active sockets (multi-tab).
      if (!hasUserSockets(user.id)) {
        await setUserStatus(io!, user.id, 'OFFLINE');
      }
    });
  });

  return io;
}
