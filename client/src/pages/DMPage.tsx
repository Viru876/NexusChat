import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Phone, Video, Pin, Paperclip } from 'lucide-react';
import toast from 'react-hot-toast';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useMessageStore } from '../store/messageStore';
import { useWebRTC } from '../hooks/useWebRTC';
import { getSocket } from '../hooks/useSocket';
import api from '../api/axios';
import MessageList from '../components/chat/MessageList';
import MessageInput from '../components/chat/MessageInput';
import ThreadPanel from '../components/chat/ThreadPanel';
import PinnedMessagesPanel from '../components/chat/PinnedMessagesPanel';
import SharedFilesPanel from '../components/chat/SharedFilesPanel';
import Avatar from '../components/ui/Avatar';
import type { Message, User } from '../types';

export default function DMPage() {
  const { dmId } = useParams();
  const { dms } = useWorkspaceStore();
  const { startCall } = useWebRTC();

  const messages = useMessageStore((s) => (dmId ? s.dmMessages[dmId] || [] : []));
  const setMessages = useMessageStore((s) => s.setMessages);
  const prependMessages = useMessageStore((s) => s.prependMessages);

  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [thread, setThread] = useState<Message | null>(null);
  const [showPinned, setShowPinned] = useState(false);
  const [showFiles, setShowFiles] = useState(false);
  const loadedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!dmId) return;
    getSocket()?.emit('join_dm', dmId);
    setThread(null);

    const known = dms.find((d) => d.id === dmId);
    if (known) setOtherUser(known.otherUser);

    if (loadedRef.current === dmId && messages.length > 0) return;

    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/dms/${dmId}/messages`);
        setMessages(dmId, data.messages, true);
        setNextCursor(data.nextCursor);
        loadedRef.current = dmId;
      } catch (err) {
        toast.error((err as Error).message);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dmId]);

  const loadMore = async () => {
    if (!dmId || !nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const { data } = await api.get(`/dms/${dmId}/messages`, {
        params: { cursor: nextCursor },
      });
      prependMessages(dmId, data.messages, true);
      setNextCursor(data.nextCursor);
    } finally {
      setLoadingMore(false);
    }
  };

  if (!dmId) {
    return (
      <div className="flex h-full items-center justify-center text-text-secondary">
        Conversation not found.
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <div className="flex h-full flex-1 flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            {otherUser && <Avatar user={otherUser} size="md" showStatus />}
            <div className="min-w-0">
              <p className="truncate font-bold text-text-primary">
                {otherUser?.name || 'Direct Message'}
              </p>
              <p className="text-xs text-text-secondary">
                {otherUser?.customStatus || otherUser?.status.toLowerCase()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowPinned(true)}
              className="rounded-lg p-2 text-text-secondary transition hover:bg-white/5 hover:text-white"
              title="Pinned messages"
            >
              <Pin size={18} />
            </button>
            <button
              onClick={() => setShowFiles(true)}
              className="rounded-lg p-2 text-text-secondary transition hover:bg-white/5 hover:text-white"
              title="Shared files"
            >
              <Paperclip size={18} />
            </button>
            <button
              onClick={() => otherUser && startCall([otherUser], 'audio')}
              className="rounded-lg p-2 text-text-secondary transition hover:bg-white/5 hover:text-white"
              title="Voice call"
            >
              <Phone size={18} />
            </button>
            <button
              onClick={() => otherUser && startCall([otherUser], 'video')}
              className="rounded-lg p-2 text-text-secondary transition hover:bg-white/5 hover:text-white"
              title="Video call"
            >
              <Video size={18} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <MessageList
          messages={messages}
          loadingMore={loadingMore || loading}
          hasMore={Boolean(nextCursor)}
          onLoadMore={loadMore}
          onOpenThread={(m) => setThread(m)}
        />

        {/* Input */}
        <MessageInput
          dmId={dmId}
          placeholder={`Message ${otherUser?.name || ''}`}
        />
      </div>

      {/* Thread panel */}
      <AnimatePresence>
        {thread && <ThreadPanel parent={thread} onClose={() => setThread(null)} />}
      </AnimatePresence>

      <PinnedMessagesPanel isOpen={showPinned} onClose={() => setShowPinned(false)} dmId={dmId} />
      <SharedFilesPanel isOpen={showFiles} onClose={() => setShowFiles(false)} dmId={dmId} />
    </div>
  );
}
