import { useEffect, useRef, useState } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Hash, Lock, Megaphone, Users, Search, Video, Pin, Paperclip } from 'lucide-react';
import toast from 'react-hot-toast';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useMessageStore } from '../store/messageStore';
import { useAuthStore } from '../store/authStore';
import { useWebRTC } from '../hooks/useWebRTC';
import { getSocket } from '../hooks/useSocket';
import api from '../api/axios';
import MessageList from '../components/chat/MessageList';
import MessageInput from '../components/chat/MessageInput';
import ThreadPanel from '../components/chat/ThreadPanel';
import PinnedMessagesPanel from '../components/chat/PinnedMessagesPanel';
import SharedFilesPanel from '../components/chat/SharedFilesPanel';
import type { Message } from '../types';

interface LayoutContext {
  openSearch: () => void;
}

export default function ChannelPage() {
  const { channelId } = useParams();
  const { openSearch } = useOutletContext<LayoutContext>();
  const { channels, members } = useWorkspaceStore();
  const { user } = useAuthStore();
  const { startCall } = useWebRTC();

  const messages = useMessageStore((s) => (channelId ? s.messages[channelId] || [] : []));
  const setMessages = useMessageStore((s) => s.setMessages);
  const prependMessages = useMessageStore((s) => s.prependMessages);
  const clearUnread = useMessageStore((s) => s.clearUnread);

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [thread, setThread] = useState<Message | null>(null);
  const [showPinned, setShowPinned] = useState(false);
  const [showFiles, setShowFiles] = useState(false);
  const loadedRef = useRef<string | null>(null);

  const channel = channels.find((c) => c.id === channelId);

  // Join the channel room + load initial messages.
  useEffect(() => {
    if (!channelId) return;
    getSocket()?.emit('join_channel', channelId);
    getSocket()?.emit('mark_read', { channelId });
    clearUnread(channelId);
    setThread(null);

    if (loadedRef.current === channelId && messages.length > 0) return;

    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/channels/${channelId}/messages`);
        setMessages(channelId, data.messages);
        setNextCursor(data.nextCursor);
        loadedRef.current = channelId;
      } catch (err) {
        toast.error((err as Error).message);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId]);

  const loadMore = async () => {
    if (!channelId || !nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const { data } = await api.get(`/channels/${channelId}/messages`, {
        params: { cursor: nextCursor },
      });
      prependMessages(channelId, data.messages);
      setNextCursor(data.nextCursor);
    } finally {
      setLoadingMore(false);
    }
  };

  const startChannelCall = () => {
    // Ring every other workspace member. (Channel-specific membership isn't
    // fetched separately on the client, and public channels are open to the
    // whole workspace anyway, so this covers the people who'd actually be
    // in the channel.)
    const others = members.filter((m) => m.userId !== user?.id).map((m) => m.user);
    if (others.length === 0) {
      toast('Invite a teammate to start a call.');
      return;
    }
    startCall(others, 'video');
  };

  if (!channel) {
    return (
      <div className="flex h-full items-center justify-center text-text-secondary">
        Channel not found.
      </div>
    );
  }

  const TypeIcon = channel.type === 'PRIVATE' ? Lock : channel.type === 'ANNOUNCEMENT' ? Megaphone : Hash;

  return (
    <div className="flex h-full">
      <div className="flex h-full flex-1 flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <TypeIcon size={18} className="text-text-secondary" />
            <span className="truncate font-bold text-text-primary">{channel.name}</span>
            {channel.description && (
              <span className="hidden truncate text-sm text-text-secondary md:inline">
                | {channel.description}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <span className="mr-1 flex items-center gap-1 text-sm text-text-secondary">
              <Users size={16} /> {members.length}
            </span>
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
              onClick={openSearch}
              className="rounded-lg p-2 text-text-secondary transition hover:bg-white/5 hover:text-white"
              title="Search"
            >
              <Search size={18} />
            </button>
            <button
              onClick={startChannelCall}
              className="rounded-lg p-2 text-text-secondary transition hover:bg-white/5 hover:text-white"
              title="Start video call"
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
        <MessageInput channelId={channelId} placeholder={`Message #${channel.name}`} />
      </div>

      {/* Thread panel */}
      <AnimatePresence>
        {thread && <ThreadPanel parent={thread} onClose={() => setThread(null)} />}
      </AnimatePresence>

      <PinnedMessagesPanel
        isOpen={showPinned}
        onClose={() => setShowPinned(false)}
        channelId={channelId}
      />
      <SharedFilesPanel
        isOpen={showFiles}
        onClose={() => setShowFiles(false)}
        channelId={channelId}
      />
    </div>
  );
}
