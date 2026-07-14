import { useEffect, useState } from 'react';
import { Pin, PinOff } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Modal from '../ui/Modal';
import Loader from '../ui/Loader';
import Avatar from '../ui/Avatar';
import type { Message } from '../../types';

interface PinnedMessagesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  channelId?: string;
  dmId?: string;
}

/**
 * Modal listing every pinned message in the current channel or DM, with a
 * one-click unpin action for each.
 */
export default function PinnedMessagesPanel({
  isOpen,
  onClose,
  channelId,
  dmId,
}: PinnedMessagesPanelProps) {
  const [pinned, setPinned] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/messages/pinned', {
          params: channelId ? { channelId } : { dmId },
        });
        setPinned(data.pinned);
      } catch (err) {
        toast.error((err as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [isOpen, channelId, dmId]);

  const unpin = async (messageId: string) => {
    try {
      await api.post(`/messages/${messageId}/pin`);
      setPinned((prev) => prev.filter((m) => m.id !== messageId));
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Pinned messages" maxWidth="max-w-lg">
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader size={22} />
        </div>
      ) : pinned.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-secondary">
          No pinned messages yet. Hover a message and click the pin icon to add one here.
        </p>
      ) : (
        <div className="max-h-[60vh] space-y-3 overflow-y-auto">
          {pinned.map((m) => (
            <div key={m.id} className="glass rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Avatar user={m.author} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-text-primary">
                      {m.author.name}
                    </span>
                    <button
                      onClick={() => unpin(m.id)}
                      className="flex items-center gap-1 rounded p-1 text-xs text-text-secondary transition hover:bg-white/5 hover:text-red-400"
                      title="Unpin"
                    >
                      <PinOff size={14} />
                    </button>
                  </div>
                  <p className="mt-0.5 break-words text-sm text-text-secondary">
                    {m.content || (m.fileName ? `📎 ${m.fileName}` : '')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

// Re-export the icon for convenience where a trigger button is built inline.
export { Pin };
