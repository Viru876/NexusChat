import { useCallback } from 'react';
import SimplePeer from 'simple-peer';
import type { Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import { getSocket } from './useSocket';
import { useCallStore } from '../store/callStore';
import { useSocketStore } from '../store/socketStore';
import type { CallType, User } from '../types';

interface SignalPayload {
  from: string;
  signal: SimplePeer.SignalData;
  callId: string;
}

// ICE servers are now provided by the server with fresh TURN credentials
// for each call. This fallback is only used if the server doesn't provide any.
const FALLBACK_ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

// Module-level ICE servers that get updated when the server provides fresh ones.
let currentIceServers: RTCIceServer[] = FALLBACK_ICE_SERVERS;

/**
 * Translates a getUserMedia failure into an actionable message instead of a
 * generic "no access" toast, since the real cause is often "no camera
 * hardware" or "camera already in use" rather than a denied permission.
 */
function describeMediaError(err: unknown, type: CallType): string {
  const name = (err as { name?: string })?.name;
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return 'Camera/microphone access was blocked. Check your browser\'s site permissions (click the lock icon in the address bar) and reload.';
  }
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return type === 'video'
      ? 'No camera was found on this device. Try an audio call instead, or connect a webcam.'
      : 'No microphone was found on this device.';
  }
  if (name === 'NotReadableError' || name === 'TrackStartError') {
    return 'Your camera/microphone is already in use by another app or browser tab. Close it and try again.';
  }
  if (name === 'OverconstrainedError') {
    return 'Your camera does not support the requested settings.';
  }
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
    return 'Camera/microphone access requires HTTPS.';
  }
  return 'Could not access camera/microphone. Check site permissions and that no other app is using them.';
}

// ---------------------------------------------------------------------------
// Module-level WebRTC engine.
//
// `useWebRTC()` is called from several different components (the global
// VideoCall overlay, WorkspacePage, ChannelPage, DMPage). If each of those
// hook calls owned its own `useRef` state, every component would get an
// INDEPENDENT set of peer connections and local stream — only the Zustand
// call store would be shared. In practice this meant the component that
// initiated a call could hold the real RTCPeerConnections while the
// VideoCall overlay's own (separate) hook instance had none, or a call would
// get orphaned entirely if the user navigated to a different page mid-call.
// That produced exactly the symptom reported: calls stuck on "Connecting..."
// forever, regardless of ICE/TURN configuration, because the signalling
// negotiation was racing against itself rather than failing on the network.
//
// The fix: keep all mutable call state (peer connections, local stream,
// active call id) in module scope, so there is exactly ONE engine for the
// whole app no matter how many components call the hook. The hook below is
// just a thin, stateless wrapper around this singleton.
// ---------------------------------------------------------------------------

const peers = new Map<string, SimplePeer.Instance>();
let localStream: MediaStream | null = null;
let activeCallId: string | null = null;

/**
 * Requests camera/microphone access based on the call type, throwing a
 * human-readable error message on failure.
 */
async function getMedia(type: CallType): Promise<MediaStream> {
  const constraints: MediaStreamConstraints = {
    audio: true,
    video: type === 'video',
  };
  try {
    return await navigator.mediaDevices.getUserMedia(constraints);
  } catch (err) {
    throw new Error(describeMediaError(err, type));
  }
}

/**
 * Creates (or returns the existing) peer connection to a specific remote
 * participant. `initiator` determines who sends the WebRTC offer.
 */
function getOrCreatePeer(initiator: boolean, remoteId: string, callId: string): SimplePeer.Instance {
  const existing = peers.get(remoteId);
  if (existing) return existing;

  const socket = getSocket();
  const stream = localStream || undefined;

  const peer = new SimplePeer({
    initiator,
    trickle: true,
    stream,
    config: { iceServers: currentIceServers },
  });

  peer.on('signal', (signal: SimplePeer.SignalData) => {
    if (!socket) return;
    const sigType = (signal as { type?: string }).type;
    if (sigType === 'offer') {
      socket.emit('offer', { to: remoteId, signal, callId });
    } else if (sigType === 'answer') {
      socket.emit('answer', { to: remoteId, signal, callId });
    } else {
      socket.emit('ice_candidate', { to: remoteId, candidate: signal, callId });
    }
  });

  peer.on('stream', (remoteStream: MediaStream) => {
    useCallStore.getState().setParticipantStream(remoteId, remoteStream);
  });

  peer.on('connect', () => {
    useCallStore.getState().setParticipantConnected(remoteId);
  });

  peer.on('iceStateChange', (state: string) => {
    if (state === 'failed' || state === 'disconnected') {
      console.warn(`ICE connection ${state} for peer ${remoteId}`);
    }
    if (state === 'failed') {
      toast.error('Call connection failed — check your network and try again.');
    }
  });

  peer.on('error', (err: Error) => {
    console.error(`Peer error (${remoteId}):`, err);
  });

  peer.on('close', () => {
    peers.delete(remoteId);
    useCallStore.getState().removeParticipant(remoteId);
  });

  peers.set(remoteId, peer);
  return peer;
}

/**
 * Destroys every active peer connection and stops local media.
 */
function cleanupEngine(): void {
  peers.forEach((peer) => {
    try {
      peer.destroy();
    } catch {
      // ignore
    }
  });
  peers.clear();
  if (localStream) {
    localStream.getTracks().forEach((t) => t.stop());
    localStream = null;
  }
  activeCallId = null;
}

/**
 * Initiates a group (or 1:1) call to the given target users.
 */
async function startCallEngine(targets: User[], type: CallType): Promise<void> {
  const socket = getSocket();
  if (!socket) {
    toast.error('Not connected to the server.');
    return;
  }
  if (targets.length === 0) {
    toast('Invite a teammate to start a call.');
    return;
  }
  try {
    const stream = await getMedia(type);
    localStream = stream;
    useCallStore.getState().setLocalStream(stream);

    socket.emit(
      'call_initiate',
      { calleeIds: targets.map((t) => t.id), type },
      (res: { callId: string; iceServers?: RTCIceServer[] }) => {
        if (res.iceServers && res.iceServers.length > 0) {
          currentIceServers = res.iceServers;
        }
        activeCallId = res.callId;
        useCallStore.getState().startOutgoingCall(res.callId, type);
        targets.forEach((t) => useCallStore.getState().addParticipant(t));
      }
    );
  } catch (err) {
    toast.error((err as Error).message);
    console.error(err);
    cleanupEngine();
    useCallStore.getState().endCall();
  }
}

/**
 * Answers the current incoming call and joins the shared call room.
 */
async function answerCallEngine(): Promise<void> {
  const socket = getSocket();
  const incoming = useCallStore.getState().incomingCall;
  if (!socket || !incoming) return;

  try {
    const stream = await getMedia(incoming.type);
    localStream = stream;
    useCallStore.getState().setLocalStream(stream);
    activeCallId = incoming.callId;

    useCallStore.getState().joinIncomingCall(incoming.callId, incoming.type);
    useCallStore.getState().setIncomingCall(null);

    socket.emit('call_join', { callId: incoming.callId });
  } catch (err) {
    toast.error((err as Error).message);
    console.error(err);
    cleanupEngine();
    useCallStore.getState().endCall();
  }
}

/**
 * Rejects the current incoming call.
 */
function rejectCallEngine(): void {
  const socket = getSocket();
  const incoming = useCallStore.getState().incomingCall;
  if (socket && incoming) {
    socket.emit('call_reject', { callId: incoming.callId });
  }
  useCallStore.getState().setIncomingCall(null);
}

/**
 * Leaves the active call. The call keeps going for any other participants.
 */
function endCallEngine(): void {
  const socket = getSocket();
  const id = useCallStore.getState().callId;
  if (socket && id) {
    socket.emit('call_leave', { callId: id });
  }
  cleanupEngine();
  useCallStore.getState().endCall();
}

// ---- Signaling listeners: bound exactly once per socket instance --------
//
// This subscribes to the socket store at MODULE load time, entirely outside
// React's component lifecycle. That means the listeners exist for the whole
// app session as soon as this module is imported, and are rebound whenever
// the underlying socket instance changes (login/logout/reconnect) — they no
// longer depend on which component happened to mount first.

let boundSocket: Socket | null = null;

function bindSignalingListeners(socket: Socket | null): void {
  if (socket === boundSocket) return;

  if (boundSocket) {
    boundSocket.off('call:existing_participants', onExistingParticipants);
    boundSocket.off('call:participant_joined', onParticipantJoined);
    boundSocket.off('call:participant_left', onParticipantLeft);
    boundSocket.off('offer', onOffer);
    boundSocket.off('answer', onAnswer);
    boundSocket.off('ice_candidate', onIce);
    boundSocket.off('call:rejected', onRejected);
    boundSocket.off('call:ended', onEnded);
  }

  boundSocket = socket;

  if (socket) {
    socket.on('call:existing_participants', onExistingParticipants);
    socket.on('call:participant_joined', onParticipantJoined);
    socket.on('call:participant_left', onParticipantLeft);
    socket.on('offer', onOffer);
    socket.on('answer', onAnswer);
    socket.on('ice_candidate', onIce);
    socket.on('call:rejected', onRejected);
    socket.on('call:ended', onEnded);
  }
}

// The caller becomes aware of participants as they join via
// call:participant_joined; the joiner learns who's already present via
// call:existing_participants. Both cases follow the SAME rule: the side that
// "arrives later" (the newly-joined participant) initiates the peer
// connection toward everyone already present — this avoids both sides trying
// to be the initiator at once.

function onExistingParticipants(payload: {
  callId: string;
  participants: { id: string; name: string; avatar?: string | null }[];
  iceServers?: RTCIceServer[];
}): void {
  if (payload.callId !== activeCallId) return;
  if (payload.iceServers && payload.iceServers.length > 0) {
    currentIceServers = payload.iceServers;
  }
  payload.participants.forEach((p) => {
    useCallStore.getState().addParticipant({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      status: 'ONLINE',
    } as User);
    getOrCreatePeer(true, p.id, payload.callId);
  });
}

function onParticipantJoined(payload: {
  callId: string;
  participant: { id: string; name: string; avatar?: string | null };
}): void {
  if (payload.callId !== activeCallId) return;
  useCallStore.getState().addParticipant({
    id: payload.participant.id,
    name: payload.participant.name,
    avatar: payload.participant.avatar,
    status: 'ONLINE',
  } as User);
  // The joiner initiates toward us; we just wait for their offer.
}

function onParticipantLeft(payload: { callId: string; userId: string }): void {
  if (payload.callId !== activeCallId) return;
  const peer = peers.get(payload.userId);
  if (peer) {
    try {
      peer.destroy();
    } catch {
      // ignore
    }
    peers.delete(payload.userId);
  }
  useCallStore.getState().removeParticipant(payload.userId);
}

function onOffer(payload: SignalPayload): void {
  if (payload.callId !== activeCallId) return;
  const peer = getOrCreatePeer(false, payload.from, payload.callId);
  peer.signal(payload.signal);
}

function onAnswer(payload: SignalPayload): void {
  if (payload.callId !== activeCallId) return;
  peers.get(payload.from)?.signal(payload.signal);
}

function onIce(payload: { from: string; candidate: SimplePeer.SignalData; callId: string }): void {
  if (payload.callId !== activeCallId) return;
  peers.get(payload.from)?.signal(payload.candidate);
}

function onRejected(payload: { name?: string }): void {
  toast(payload?.name ? `${payload.name} declined the call.` : 'Call was declined.');
}

function onEnded(): void {
  cleanupEngine();
  useCallStore.getState().endCall();
}

// Bind immediately for whatever socket exists right now (usually null at
// module load), then keep rebinding forever whenever the socket changes.
bindSignalingListeners(useSocketStore.getState().socket);
useSocketStore.subscribe((state) => bindSignalingListeners(state.socket));

/**
 * Thin, stateless hook wrapper around the shared WebRTC engine above. Safe
 * to call from any number of components simultaneously — they all drive the
 * same underlying peer connections and call state.
 */
export function useWebRTC() {
  const callId = useCallStore((s) => s.callId);
  const callType = useCallStore((s) => s.callType);

  const startCall = useCallback((targets: User[], type: CallType) => startCallEngine(targets, type), []);
  const answerCall = useCallback(() => answerCallEngine(), []);
  const rejectCall = useCallback(() => rejectCallEngine(), []);
  const endCall = useCallback(() => endCallEngine(), []);

  return { startCall, answerCall, rejectCall, endCall, callId, callType };
}
