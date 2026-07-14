import { useState, useRef, useEffect } from 'react';
import { Smile, Paperclip, Send, Bold, Italic, Code, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { getSocket } from '../../hooks/useSocket';
import { useMessageStore } from '../../store/messageStore';
import api from '../../api/axios';
import EmojiPicker from './EmojiPicker';
import FileUpload from './FileUpload';
import type { TypingUser } from '../../types';

interface MessageInputProps {
  channelId?: string;
  dmId?: string;
  parentId?: string;
  placeholder?: string;
}

export default function MessageInput({
  channelId,
  dmId,
  parentId,
  placeholder,
}: MessageInputProps) {
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout>>();
  const isTyping = useRef(false);

  const key = channelId || dmId || '';
  const typingUsers = useMessageStore((s) => s.typingUsers[key] || []);

  const target = channelId ? { channelId } : { dmId };

  // Stop typing on unmount / channel switch.
  useEffect(() => {
    return () => {
      if (isTyping.current) {
        getSocket()?.emit('typing_stop', target);
        isTyping.current = false;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const emitTyping = () => {
    const socket = getSocket();
    if (!socket) return;
    if (!isTyping.current) {
      socket.emit('typing_start', target);
      isTyping.current = true;
    }
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit('typing_stop', target);
      isTyping.current = false;
    }, 2000);
  };

  const send = () => {
    const content = text.trim();
    if (!content) return;
    const socket = getSocket();
    if (!socket) {
      toast.error('Not connected to the server.');
      return;
    }
    socket.emit('send_message', { content, ...target, parentId });
    socket.emit('typing_stop', target);
    isTyping.current = false;
    setText('');
  };

  const handleFile = async (file: File) => {
    setSending(true);
    const form = new FormData();
    form.append('file', file);
    if (channelId) form.append('channelId', channelId);
    if (dmId) form.append('dmId', dmId);
    if (parentId) form.append('parentId', parentId);
    if (text.trim()) form.append('content', text.trim());

    try {
      await api.post('/messages', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setText('');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSending(false);
    }
  };

  // Wrap the selected text (or insert) with a markdown token.
  const applyFormat = (token: string) => {
    const el = inputRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = text.slice(start, end) || 'text';
    const next = text.slice(0, start) + token + selected + token + text.slice(end);
    setText(next);
    setTimeout(() => el.focus(), 0);
  };

  const typingLabel = (users: TypingUser[]) => {
    if (users.length === 0) return '';
    if (users.length === 1) return `${users[0].name} is typing...`;
    if (users.length === 2) return `${users[0].name} and ${users[1].name} are typing...`;
    return 'Several people are typing...';
  };

  return (
    <div className="px-4 pb-4">
      {/* Typing indicator */}
      <div className="h-5 px-1 text-xs italic text-text-secondary">
        {typingLabel(typingUsers)}
      </div>

      {showUpload && (
        <div className="mb-2">
          <FileUpload onFile={handleFile} onClose={() => setShowUpload(false)} />
        </div>
      )}

      <div className="glass rounded-xl p-2">
        {/* Toolbar */}
        <div className="flex items-center gap-1 border-b border-white/5 px-1 pb-1">
          <button
            onClick={() => applyFormat('**')}
            className="rounded p-1 text-text-secondary hover:bg-white/5 hover:text-white"
            title="Bold"
          >
            <Bold size={14} />
          </button>
          <button
            onClick={() => applyFormat('*')}
            className="rounded p-1 text-text-secondary hover:bg-white/5 hover:text-white"
            title="Italic"
          >
            <Italic size={14} />
          </button>
          <button
            onClick={() => applyFormat('`')}
            className="rounded p-1 text-text-secondary hover:bg-white/5 hover:text-white"
            title="Code"
          >
            <Code size={14} />
          </button>
        </div>

        {/* Input row */}
        <div className="flex items-end gap-2 pt-2">
          <div className="relative">
            <button
              onClick={() => setShowEmoji((s) => !s)}
              className="rounded-lg p-2 text-text-secondary transition hover:bg-white/5 hover:text-white"
              title="Emoji"
            >
              <Smile size={18} />
            </button>
            {showEmoji && (
              <div className="absolute bottom-12 left-0 z-50">
                <EmojiPicker
                  onSelect={(emoji) => {
                    setText((t) => t + emoji);
                    setShowEmoji(false);
                    inputRef.current?.focus();
                  }}
                  onClose={() => setShowEmoji(false)}
                />
              </div>
            )}
          </div>

          <button
            onClick={() => setShowUpload((s) => !s)}
            className="rounded-lg p-2 text-text-secondary transition hover:bg-white/5 hover:text-white"
            title="Attach file"
          >
            <Paperclip size={18} />
          </button>

          <button
            className="rounded-lg p-2 text-text-secondary transition hover:bg-white/5 hover:text-white"
            title="GIF (coming soon)"
          >
            <ImageIcon size={18} />
          </button>

          <textarea
            ref={inputRef}
            rows={1}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              emitTyping();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            onPaste={(e) => {
              // Support pasting a screenshot/image directly from the clipboard.
              const imageItem = Array.from(e.clipboardData.items).find((item) =>
                item.type.startsWith('image/')
              );
              if (imageItem) {
                const file = imageItem.getAsFile();
                if (file) {
                  e.preventDefault();
                  handleFile(file);
                }
              }
            }}
            placeholder={placeholder || 'Type a message...'}
            className="max-h-40 flex-1 resize-none bg-transparent py-2 text-[15px] text-text-primary outline-none placeholder:text-text-secondary"
          />

          <button
            onClick={send}
            disabled={!text.trim() || sending}
            className="btn-primary p-2.5"
            title="Send"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
