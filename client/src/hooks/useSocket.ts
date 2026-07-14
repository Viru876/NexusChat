import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { useMessageStore } from '../store/messageStore';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useCallStore } from '../store/callStore';
import { useSocketStore } from '../store/socketStore';
import type { Message, Reaction, IncomingCall, Channel } from '../types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// Module-level singleton so every component shares one socket connection.
let socketInstance: Socket | null = null;

/**
 * Returns the current socket synchronously. Prefer subscribing to
 * `useSocketStore` in effects that need to react to the socket becoming
 * available (e.g. WebRTC signaling) — this getter alone can't trigger a
 * re-run if called before the socket exists.
 */
export function getSocket(): Socket | null {
  return socketInstance;
}

/**
 * Global socket lifecycle hook. Mounted once (in App) to establish and tear
 * down the Socket.IO connection and wire up global event listeners.
 */
export function useSocket(): Socket | null {
  const { isAuthenticated } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      if (socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
        useSocketStore.getState().setSocket(null);
      }
      return;
    }

    if (socketInstance) return;

    const token = localStorage.getItem('nexuschat_token') || '';
    const socket = io(SOCKET_URL, {
      auth: { token },
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    socketInstance = socket;
    socketRef.current = socket;
    useSocketStore.getState().setSocket(socket);

    const messageStore = useMessageStore.getState();
    const workspaceStore = useWorkspaceStore.getState();
    const callStore = useCallStore.getState();

    const keyFor = (m: { channelId?: string | null; dmId?: string | null }) =>
      m.channelId || m.dmId || '';

    socket.on('connect', () => {
      const ws = useWorkspaceStore.getState().currentWorkspace;
      if (ws) socket.emit('join_workspace', ws.id);
    });

    socket.on('message:new', (message: Message) => {
      const isDM = Boolean(message.dmId);
      const key = keyFor(message);
      if (message.parentId) return; // thread replies handled separately
      messageStore.addMessage(key, message, isDM);
      messageStore.incrementUnread(key);
    });

    socket.on('message:edited', (message: Message) => {
      const isDM = Boolean(message.dmId);
      messageStore.updateMessage(keyFor(message), message.id, message, isDM);
    });

    socket.on(
      'message:deleted',
      (payload: { messageId: string; channelId?: string | null; dmId?: string | null }) => {
        const isDM = Boolean(payload.dmId);
        messageStore.deleteMessage(keyFor(payload), payload.messageId, isDM);
      }
    );

    socket.on(
      'reaction:updated',
      (payload: { messageId: string; reactions: Reaction[] }) => {
        messageStore.updateReactions(payload.messageId, payload.reactions);
      }
    );

    socket.on(
      'typing:start',
      (payload: { channelId?: string; dmId?: string; userId: string; name: string }) => {
        const key = payload.channelId || payload.dmId || '';
        messageStore.setTyping(key, { userId: payload.userId, name: payload.name }, true);
      }
    );

    socket.on(
      'typing:stop',
      (payload: { channelId?: string; dmId?: string; userId: string; name: string }) => {
        const key = payload.channelId || payload.dmId || '';
        messageStore.setTyping(key, { userId: payload.userId, name: payload.name }, false);
      }
    );

    socket.on(
      'presence:update',
      (payload: { userId: string; status: Message['author']['status']; customStatus?: string | null }) => {
        workspaceStore.updateMemberPresence(payload.userId, payload.status, payload.customStatus);
      }
    );

    socket.on('channel:created', (payload: { channel: Channel }) => {
      workspaceStore.addChannel(payload.channel);
      socket.emit('join_channel', payload.channel.id);
    });

    socket.on('channel:deleted', (payload: { channelId: string }) => {
      workspaceStore.removeChannel(payload.channelId);
    });

    socket.on('workspace:deleted', (payload: { workspaceId: string }) => {
      workspaceStore.removeWorkspace(payload.workspaceId);
    });

    socket.on('member:removed', (payload: { workspaceId: string; userId: string }) => {
      workspaceStore.removeMember(payload.userId);
      if (payload.userId === useAuthStore.getState().user?.id) {
        workspaceStore.removeWorkspace(payload.workspaceId);
      }
    });

    socket.on('message:pinned', (message: Message) => {
      const isDM = Boolean(message.dmId);
      messageStore.updateMessage(keyFor(message), message.id, message, isDM);
    });

    socket.on('call:incoming', (payload: IncomingCall) => {
      callStore.setIncomingCall(payload);
    });

    socket.connect();

    return () => {
      socket.off();
      socket.disconnect();
      socketInstance = null;
      socketRef.current = null;
      useSocketStore.getState().setSocket(null);
    };
  }, [isAuthenticated]);

  return socketRef.current;
}
