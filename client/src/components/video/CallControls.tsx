import { Mic, MicOff, Video, VideoOff, PhoneOff, ScreenShare, MessageSquare, Minimize2 } from 'lucide-react';
import { useCallStore } from '../../store/callStore';

interface CallControlsProps {
  onEnd: () => void;
  onToggleChat?: () => void;
  onMinimize?: () => void;
  onScreenShare?: () => void;
}

/**
 * Bottom control bar for an active call: mute, camera, screen share, chat,
 * minimize, and end call.
 */
export default function CallControls({
  onEnd,
  onToggleChat,
  onMinimize,
  onScreenShare,
}: CallControlsProps) {
  const { isMuted, isCameraOff, callType, toggleMute, toggleCamera } = useCallStore();

  const btnClass =
    'flex h-12 w-12 items-center justify-center rounded-full transition';

  return (
    <div className="glass flex items-center gap-3 rounded-2xl px-4 py-3 shadow-glow">
      <button
        onClick={toggleMute}
        className={`${btnClass} ${
          isMuted ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'
        }`}
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
      </button>

      {callType === 'video' && (
        <button
          onClick={toggleCamera}
          className={`${btnClass} ${
            isCameraOff ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'
          }`}
          title={isCameraOff ? 'Turn camera on' : 'Turn camera off'}
        >
          {isCameraOff ? <VideoOff size={20} /> : <Video size={20} />}
        </button>
      )}

      {onScreenShare && (
        <button
          onClick={onScreenShare}
          className={`${btnClass} bg-white/10 text-white hover:bg-white/20`}
          title="Share screen"
        >
          <ScreenShare size={20} />
        </button>
      )}

      {onToggleChat && (
        <button
          onClick={onToggleChat}
          className={`${btnClass} bg-white/10 text-white hover:bg-white/20`}
          title="Chat"
        >
          <MessageSquare size={20} />
        </button>
      )}

      {onMinimize && (
        <button
          onClick={onMinimize}
          className={`${btnClass} bg-white/10 text-white hover:bg-white/20`}
          title="Minimize"
        >
          <Minimize2 size={20} />
        </button>
      )}

      <button
        onClick={onEnd}
        className={`${btnClass} bg-red-500 text-white hover:bg-red-600`}
        title="End call"
      >
        <PhoneOff size={20} />
      </button>
    </div>
  );
}
