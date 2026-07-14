import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { getSocket } from '../../hooks/useSocket';
import api from '../../api/axios';
import MessageItem from './MessageItem';
import MessageInput from './MessageInput';
import Loader from '../ui/Loader';
import type { Message } from '../../types';

interface ThreadPanelProps {
  parent: Message;
  onClose: () => void;
}

/**
 * Slide-in thread panel showing a parent message and its replies. Replies
 * arrive in real time via the 'thread:reply' socket event.
 */
export default function ThreadPanel({ parent, onClose }: ThreadPanelProps) {
  const [replies, setReplies] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/messages/${parent.id}/thread`);
        if (mounted) setReplies(data.replies);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [parent.id]);

  // Listen for new replies to this thread.
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onReply = (payload: { parentId: string; message: Message }) => {
      if (payload.parentId === parent.id) {
        setReplies((prev) =>
          prev.some((m) => m.id === payload.message.id) ? prev : [...prev, payload.message]
        );
      }
    };
    socket.on('thread:reply', onReply);
    return () => {
      socket.off('thread:reply', onReply);
    };
  }, [parent.id]);

  return (
    <motion.div
      className="flex h-full w-[380px] flex-col border-l border-white/5 bg-bg-dark"
      initial={{ x: 380, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 380, opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 320 }}
    >
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
        <h3 className="font-bold text-text-primary">Thread</h3>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-text-secondary transition hover:bg-white/5 hover:text-white"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-3">
        <MessageItem message={parent} showHeader />
        <div className="my-2 flex items-center gap-3 px-4">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs text-text-secondary">
            {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
          </span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        {loading ? (
          <div className="flex justify-center py-6">
            <Loader size={22} />
          </div>
        ) : (
          replies.map((r) => <MessageItem key={r.id} message={r} showHeader />)
        )}
      </div>

      <MessageInput
        channelId={parent.channelId || undefined}
        dmId={parent.dmId || undefined}
        parentId={parent.id}
        placeholder="Reply..."
      />
    </motion.div>
  );
}
