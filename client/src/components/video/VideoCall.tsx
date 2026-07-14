import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, Video, Maximize2 } from 'lucide-react';
import { useCallStore } from '../../store/callStore';
import { useWebRTC } from '../../hooks/useWebRTC';
import Avatar from '../ui/Avatar';
import VideoGrid from './VideoGrid';
import CallControls from './CallControls';

/**
 * Formats seconds into mm:ss.
 */
function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function VideoCall() {
  const {
    incomingCall,
    isInCall,
    callStatus,
    participants,
    isMinimized,
    setMinimized,
  } = useCallStore();
  const { answerCall, rejectCall, endCall } = useWebRTC();

  const participantList = Array.from(participants.values());
  const headerLabel =
    participantList.length === 0
      ? 'Waiting for others...'
      : participantList.map((p) => p.user.name).join(', ');

  const [duration, setDuration] = useState(0);

  // Track call duration once connected.
  useEffect(() => {
    if (callStatus !== 'connected') {
      setDuration(0);
      return;
    }
    const t = setInterval(() => setDuration((d) => d + 1), 1000);
    return () => clearInterval(t);
  }, [callStatus]);

  return (
    <>
      {/* Incoming call prompt */}
      <AnimatePresence>
        {incomingCall && !isInCall && (
          <motion.div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="glass flex w-80 flex-col items-center gap-4 rounded-2xl p-8 shadow-glow-lg"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
            >
              <div className="relative">
                <span className="absolute inset-0 animate-ping rounded-full bg-indigo-500/40" />
                <Avatar user={incomingCall.caller} size="xl" />
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-text-primary">
                  {incomingCall.caller.name}
                </p>
                <p className="text-sm text-text-secondary">
                  Incoming {incomingCall.type} call · NexusChat
                </p>
              </div>
              <div className="flex gap-6">
                <button
                  onClick={rejectCall}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white transition hover:bg-red-600"
                  title="Decline"
                >
                  <PhoneOff size={22} />
                </button>
                <button
                  onClick={answerCall}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white transition hover:bg-emerald-600"
                  title="Accept"
                >
                  {incomingCall.type === 'video' ? <Video size={22} /> : <Phone size={22} />}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active / outgoing call */}
      <AnimatePresence>
        {isInCall && !isMinimized && (
          <motion.div
            className="fixed inset-0 z-[75] flex flex-col bg-void"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Top bar */}
            <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between p-4">
              <div className="glass rounded-lg px-3 py-1.5">
                <p className="text-sm font-semibold text-text-primary">{headerLabel}</p>
                <p className="text-xs text-text-secondary">
                  {callStatus === 'connected'
                    ? formatDuration(duration)
                    : callStatus === 'calling'
                    ? 'Calling...'
                    : 'Connecting...'}
                </p>
              </div>
            </div>

            <VideoGrid />

            {/* Controls */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
              <CallControls
                onEnd={endCall}
                onMinimize={() => setMinimized(true)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Minimized bubble */}
      <AnimatePresence>
        {isInCall && isMinimized && (
          <motion.div
            className="glass fixed bottom-4 right-4 z-[75] w-64 overflow-hidden rounded-xl shadow-glow"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
          >
            <div className="h-36">
              <VideoGrid />
            </div>
            <div className="flex items-center justify-between p-2">
              <span className="truncate text-sm font-medium text-text-primary">
                {headerLabel}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setMinimized(false)}
                  className="rounded p-1.5 text-text-secondary hover:bg-white/10 hover:text-white"
                  title="Expand"
                >
                  <Maximize2 size={16} />
                </button>
                <button
                  onClick={endCall}
                  className="rounded p-1.5 text-red-400 hover:bg-white/10"
                  title="End call"
                >
                  <PhoneOff size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
