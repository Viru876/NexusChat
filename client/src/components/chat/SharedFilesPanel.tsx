import { useEffect, useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Modal from '../ui/Modal';
import Loader from '../ui/Loader';
import type { Message } from '../../types';

interface SharedFilesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  channelId?: string;
  dmId?: string;
}

function formatBytes(bytes?: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Gallery of every file/image shared in the current channel or DM, most
 * recent first — a quick way to find an attachment without scrolling chat.
 */
export default function SharedFilesPanel({
  isOpen,
  onClose,
  channelId,
  dmId,
}: SharedFilesPanelProps) {
  const [files, setFiles] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/messages/files', {
          params: channelId ? { channelId } : { dmId },
        });
        setFiles(data.files);
      } catch (err) {
        toast.error((err as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [isOpen, channelId, dmId]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Shared files" maxWidth="max-w-lg">
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader size={22} />
        </div>
      ) : files.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-secondary">
          No files have been shared here yet.
        </p>
      ) : (
        <div className="grid max-h-[60vh] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3">
          {files.map((f) => (
            <a
              key={f.id}
              href={f.fileUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="glass group flex flex-col overflow-hidden rounded-lg transition hover:border-indigo-500/50"
            >
              {f.type === 'IMAGE' && f.fileUrl ? (
                <img
                  src={f.fileUrl}
                  alt={f.fileName || 'shared image'}
                  className="h-24 w-full object-cover"
                />
              ) : (
                <div className="flex h-24 w-full items-center justify-center bg-white/5">
                  <FileText size={28} className="text-indigo-400" />
                </div>
              )}
              <div className="flex items-center justify-between gap-1 p-2">
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-text-primary">{f.fileName}</p>
                  <p className="text-[10px] text-text-secondary">
                    {formatBytes(f.fileSize)} · {format(new Date(f.createdAt), 'MMM d')}
                  </p>
                </div>
                <Download
                  size={14}
                  className="flex-shrink-0 text-text-secondary transition group-hover:text-white"
                />
              </div>
            </a>
          ))}
        </div>
      )}
    </Modal>
  );
}
