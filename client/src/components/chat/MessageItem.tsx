import { useState } from 'react';
import { format } from 'date-fns';
import {
  SmilePlus,
  MessageSquare,
  Pencil,
  Trash2,
  Download,
  FileText,
  Pin,
  PinOff,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getSocket } from '../../hooks/useSocket';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/axios';
import Avatar from '../ui/Avatar';
import EmojiPicker from './EmojiPicker';
import type { Message } from '../../types';

interface MessageItemProps {
  message: Message;
  showHeader: boolean;
  onOpenThread?: (message: Message) => void;
}

/**
 * Renders lightweight markdown: **bold**, *italic*, `code`, ```code blocks```,
 * and auto-linked URLs. Escapes HTML first to avoid injection.
 */
function renderMarkdown(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return escaped
    .replace(/```([\s\S]+?)```/g, '<pre><code>$1</code></pre>')
    .replace(/`([^`]+?)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+?)\*/g, '<em>$1</em>')
    .replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    )
    .replace(/\n/g, '<br/>');
}

function formatBytes(bytes?: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MessageItem({ message, showHeader, onOpenThread }: MessageItemProps) {
  const { user } = useAuthStore();
  const [showEmoji, setShowEmoji] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);
  const isOwn = user?.id === message.authorId;

  // Aggregate reactions by emoji.
  const reactionGroups = message.reactions.reduce<
    Record<string, { count: number; users: string[]; mine: boolean }>
  >((acc, r) => {
    if (!acc[r.emoji]) acc[r.emoji] = { count: 0, users: [], mine: false };
    acc[r.emoji].count += 1;
    if (r.user?.name) acc[r.emoji].users.push(r.user.name);
    if (r.userId === user?.id) acc[r.emoji].mine = true;
    return acc;
  }, {});

  const toggleReaction = (emoji: string, mine: boolean) => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit(mine ? 'remove_reaction' : 'add_reaction', {
      messageId: message.id,
      emoji,
    });
  };

  const saveEdit = () => {
    const socket = getSocket();
    if (socket && editText.trim() && editText !== message.content) {
      socket.emit('edit_message', { messageId: message.id, content: editText.trim() });
    }
    setEditing(false);
  };

  const deleteMessage = () => {
    getSocket()?.emit('delete_message', { messageId: message.id });
  };

  const togglePin = async () => {
    try {
      await api.post(`/messages/${message.id}/pin`);
      toast.success(message.pinned ? 'Message unpinned.' : 'Message pinned.');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  if (message.type === 'SYSTEM') {
    return (
      <div className="py-1 text-center text-xs text-text-secondary">{message.content}</div>
    );
  }

  return (
    <div className={`group relative flex gap-3 px-4 py-0.5 hover:bg-white/[0.02] ${showHeader ? 'mt-3' : ''}`}>
      {/* Avatar / spacer */}
      <div className="w-9 flex-shrink-0">
        {showHeader ? (
          <Avatar user={message.author} size="lg" />
        ) : (
          <span className="hidden text-[10px] text-text-secondary group-hover:block">
            {format(new Date(message.createdAt), 'HH:mm')}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        {showHeader && (
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-text-primary">{message.author.name}</span>
            <span className="text-xs text-text-secondary">
              {format(new Date(message.createdAt), 'MMM d, HH:mm')}
            </span>
          </div>
        )}

        {/* Content */}
        {editing ? (
          <div className="mt-1 flex gap-2">
            <input
              autoFocus
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEdit();
                if (e.key === 'Escape') setEditing(false);
              }}
              className="input-field flex-1"
            />
            <button onClick={saveEdit} className="btn-primary px-3 py-1 text-sm">
              Save
            </button>
          </div>
        ) : (
          message.content && (
            <div
              className="message-content break-words text-[15px] text-text-primary"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
            />
          )
        )}

        {/* Image */}
        {message.type === 'IMAGE' && message.fileUrl && (
          <a href={message.fileUrl} target="_blank" rel="noopener noreferrer">
            <img
              src={message.fileUrl}
              alt={message.fileName || 'image'}
              className="mt-2 max-h-80 rounded-lg border border-indigo-500/20 object-cover"
            />
          </a>
        )}

        {/* File card */}
        {message.type === 'FILE' && message.fileUrl && (
          <a
            href={message.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="glass mt-2 flex max-w-sm items-center gap-3 rounded-lg p-3 transition hover:border-indigo-500/50"
          >
            <FileText size={24} className="text-indigo-400" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-text-primary">
                {message.fileName}
              </p>
              <p className="text-xs text-text-secondary">{formatBytes(message.fileSize)}</p>
            </div>
            <Download size={18} className="text-text-secondary" />
          </a>
        )}

        {message.edited && !editing && (
          <span className="ml-1 text-xs text-text-secondary">(edited)</span>
        )}

        {message.pinned && (
          <span className="mt-1 flex items-center gap-1 text-xs font-medium text-amber-400">
            <Pin size={11} /> Pinned
          </span>
        )}

        {/* Reactions */}
        {Object.keys(reactionGroups).length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {Object.entries(reactionGroups).map(([emoji, info]) => (
              <button
                key={emoji}
                onClick={() => toggleReaction(emoji, info.mine)}
                title={info.users.join(', ')}
                className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition ${
                  info.mine
                    ? 'border-indigo-500/60 bg-indigo-500/20 text-white'
                    : 'border-white/10 bg-white/5 text-text-secondary hover:border-indigo-500/40'
                }`}
              >
                <span>{emoji}</span>
                <span>{info.count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Thread indicator */}
        {message._count && message._count.replies > 0 && onOpenThread && (
          <button
            onClick={() => onOpenThread(message)}
            className="mt-1 flex items-center gap-1 text-xs font-medium text-indigo-400 hover:underline"
          >
            <MessageSquare size={13} />
            {message._count.replies} {message._count.replies === 1 ? 'reply' : 'replies'}
          </button>
        )}
      </div>

      {/* Hover action bar */}
      <div className="glass absolute -top-3 right-4 hidden items-center gap-1 rounded-lg px-1 py-0.5 group-hover:flex">
        <div className="relative">
          <button
            onClick={() => setShowEmoji((s) => !s)}
            className="rounded p-1.5 text-text-secondary transition hover:bg-white/10 hover:text-white"
            title="Add reaction"
          >
            <SmilePlus size={16} />
          </button>
          {showEmoji && (
            <div className="absolute right-0 top-8 z-50">
              <EmojiPicker
                onSelect={(emoji) => {
                  toggleReaction(emoji, false);
                  setShowEmoji(false);
                }}
                onClose={() => setShowEmoji(false)}
              />
            </div>
          )}
        </div>

        {onOpenThread && (
          <button
            onClick={() => onOpenThread(message)}
            className="rounded p-1.5 text-text-secondary transition hover:bg-white/10 hover:text-white"
            title="Reply in thread"
          >
            <MessageSquare size={16} />
          </button>
        )}

        <button
          onClick={togglePin}
          className="rounded p-1.5 text-text-secondary transition hover:bg-white/10 hover:text-white"
          title={message.pinned ? 'Unpin message' : 'Pin message'}
        >
          {message.pinned ? <PinOff size={16} /> : <Pin size={16} />}
        </button>

        {isOwn && (
          <>
            <button
              onClick={() => {
                setEditText(message.content);
                setEditing(true);
              }}
              className="rounded p-1.5 text-text-secondary transition hover:bg-white/10 hover:text-white"
              title="Edit"
            >
              <Pencil size={16} />
            </button>
            <button
              onClick={deleteMessage}
              className="rounded p-1.5 text-text-secondary transition hover:bg-white/10 hover:text-red-400"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
