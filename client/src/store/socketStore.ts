import { create } from 'zustand';
import type { Socket } from 'socket.io-client';

interface SocketState {
  socket: Socket | null;
  setSocket: (socket: Socket | null) => void;
}

/**
 * Reactive holder for the current Socket.IO instance. Unlike a plain module
 * variable, components can subscribe to this and re-run effects once the
 * socket actually becomes available — avoiding races where an effect reads
 * the socket before `useSocket()` has finished creating it.
 */
export const useSocketStore = create<SocketState>((set) => ({
  socket: null,
  setSocket: (socket) => set({ socket }),
}));
