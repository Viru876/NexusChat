import { useEffect, useRef } from 'react';
import { useCallStore, type CallParticipant } from '../../store/callStore';
import Avatar from '../ui/Avatar';

/**
 * Renders one participant's video tile, falling back to their avatar for
 * audio-only calls or while their stream is still connecting.
 */
function ParticipantTile({
  participant,
  isVideo,
}: {
  participant: CallParticipant;
  isVideo: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && participant.stream) {
      videoRef.current.srcObject = participant.stream;
    }
  }, [participant.stream]);

  const hasVideoTrack = isVideo && participant.stream && participant.stream.getVideoTracks().length > 0;

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-xl bg-bg-medium">
      {hasVideoTrack ? (
        <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover" />
      ) : (
        <div className="flex flex-col items-center gap-3">
          <Avatar user={participant.user} size="xl" />
          <p className="text-sm font-medium text-text-primary">{participant.user.name}</p>
          {participant.status === 'connecting' && (
            <p className="text-xs text-text-secondary">Connecting...</p>
          )}
        </div>
      )}
      <span className="absolute bottom-2 left-2 rounded bg-black/50 px-2 py-0.5 text-xs text-white">
        {participant.user.name}
      </span>
    </div>
  );
}

/**
 * Grid layout for a mesh group call: every remote participant gets a tile,
 * sized responsively based on how many people are on the call. The local
 * camera preview floats as a small picture-in-picture over the grid.
 */
export default function VideoGrid() {
  const { localStream, participants, callType, isCameraOff } = useCallStore();
  const localRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localRef.current && localStream) {
      localRef.current.srcObject = localStream;
    }
  }, [localStream]);

  const isVideo = callType === 'video';
  const list = Array.from(participants.values());

  // Pick a grid column count that keeps tiles reasonably sized as the call
  // grows, without ever needing to scroll.
  const cols = list.length <= 1 ? 1 : list.length <= 4 ? 2 : 3;

  return (
    <div className="relative h-full w-full bg-void p-4">
      {list.length === 0 ? (
        <div className="flex h-full w-full items-center justify-center text-text-secondary">
          Waiting for others to join...
        </div>
      ) : (
        <div
          className="grid h-full w-full gap-3"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {list.map((p) => (
            <ParticipantTile key={p.user.id} participant={p} isVideo={isVideo} />
          ))}
        </div>
      )}

      {/* Local PiP */}
      {isVideo && (
        <div className="absolute bottom-24 right-6 h-40 w-56 overflow-hidden rounded-xl border border-indigo-500/40 bg-bg-medium shadow-glow">
          {isCameraOff ? (
            <div className="flex h-full w-full items-center justify-center text-sm text-text-secondary">
              Camera off
            </div>
          ) : (
            <video
              ref={localRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
            />
          )}
        </div>
      )}
    </div>
  );
}
