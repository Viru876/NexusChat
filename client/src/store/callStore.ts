import { create } from 'zustand';
import type { User, CallType, CallStatus, IncomingCall } from '../types';

export interface CallParticipant {
  user: User;
  stream: MediaStream | null;
  status: 'connecting' | 'connected';
}

interface CallState {
  isInCall: boolean;
  callId: string | null;
  callType: CallType | null;
  localStream: MediaStream | null;
  // Everyone else currently in the call, keyed by userId.
  participants: Map<string, CallParticipant>;
  callStatus: CallStatus;
  incomingCall: IncomingCall | null;
  isMinimized: boolean;
  isMuted: boolean;
  isCameraOff: boolean;

  setIncomingCall: (call: IncomingCall | null) => void;
  startOutgoingCall: (callId: string, type: CallType) => void;
  joinIncomingCall: (callId: string, type: CallType) => void;
  addParticipant: (user: User) => void;
  removeParticipant: (userId: string) => void;
  setParticipantStream: (userId: string, stream: MediaStream) => void;
  setParticipantConnected: (userId: string) => void;
  setStatus: (status: CallStatus) => void;
  setLocalStream: (stream: MediaStream | null) => void;
  setMinimized: (value: boolean) => void;
  toggleMute: () => void;
  toggleCamera: () => void;
  endCall: () => void;
}

const initialState = {
  isInCall: false,
  callId: null as string | null,
  callType: null as CallType | null,
  localStream: null as MediaStream | null,
  participants: new Map<string, CallParticipant>(),
  callStatus: 'idle' as CallStatus,
  incomingCall: null as IncomingCall | null,
  isMinimized: false,
  isMuted: false,
  isCameraOff: false,
};

export const useCallStore = create<CallState>((set, get) => ({
  ...initialState,

  setIncomingCall: (incomingCall) =>
    set({ incomingCall, callStatus: incomingCall ? 'ringing' : 'idle' }),

  startOutgoingCall: (callId, type) =>
    set({
      isInCall: true,
      callId,
      callType: type,
      callStatus: 'calling',
      incomingCall: null,
      participants: new Map(),
    }),

  joinIncomingCall: (callId, type) =>
    set({
      isInCall: true,
      callId,
      callType: type,
      callStatus: 'connected',
      incomingCall: null,
      participants: new Map(),
    }),

  addParticipant: (user) =>
    set((state) => {
      const participants = new Map(state.participants);
      if (!participants.has(user.id)) {
        participants.set(user.id, { user, stream: null, status: 'connecting' });
      }
      return { participants };
    }),

  removeParticipant: (userId) =>
    set((state) => {
      const participants = new Map(state.participants);
      participants.delete(userId);
      return { participants };
    }),

  setParticipantStream: (userId, stream) =>
    set((state) => {
      const participants = new Map(state.participants);
      const existing = participants.get(userId);
      if (existing) {
        participants.set(userId, { ...existing, stream, status: 'connected' });
      }
      return { participants, callStatus: 'connected' };
    }),

  setParticipantConnected: (userId) =>
    set((state) => {
      const participants = new Map(state.participants);
      const existing = participants.get(userId);
      if (existing) {
        participants.set(userId, { ...existing, status: 'connected' });
      }
      return { participants, callStatus: 'connected' };
    }),

  setStatus: (callStatus) => set({ callStatus }),

  setLocalStream: (localStream) => set({ localStream }),
  setMinimized: (isMinimized) => set({ isMinimized }),

  toggleMute: () => {
    const { localStream, isMuted } = get();
    if (localStream) {
      localStream.getAudioTracks().forEach((t) => (t.enabled = isMuted));
    }
    set({ isMuted: !isMuted });
  },

  toggleCamera: () => {
    const { localStream, isCameraOff } = get();
    if (localStream) {
      localStream.getVideoTracks().forEach((t) => (t.enabled = isCameraOff));
    }
    set({ isCameraOff: !isCameraOff });
  },

  endCall: () => {
    const { localStream } = get();
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
    }
    set({ ...initialState, participants: new Map() });
  },
}));
