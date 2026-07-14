import { useEffect, useRef, useState } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { ArrowDown } from 'lucide-react';
import MessageItem from './MessageItem';
import Loader from '../ui/Loader';
import type { Message } from '../../types';

interface MessageListProps {
  messages: Message[];
  loadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onOpenThread?: (message: Message) => void;
}

function dateLabel(date: Date): string {
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMMM d, yyyy');
}

/**
 * Renders the scrollable message list with date separators, grouped
 * consecutive messages, smart auto-scroll, and top infinite loading.
 */
export default function MessageList({
  messages,
  loadingMore,
  hasMore,
  onLoadMore,
  onOpenThread,
}: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(true);
  const [showNewBanner, setShowNewBanner] = useState(false);
  const prevCount = useRef(messages.length);

  // Auto-scroll on new messages if already near the bottom.
  useEffect(() => {
    if (messages.length > prevCount.current) {
      if (atBottom) {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      } else {
        setShowNewBanner(true);
      }
    }
    prevCount.current = messages.length;
  }, [messages.length, atBottom]);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const nearBottom = distanceFromBottom < 120;
    setAtBottom(nearBottom);
    if (nearBottom) setShowNewBanner(false);

    if (el.scrollTop < 60 && hasMore && !loadingMore && onLoadMore) {
      onLoadMore();
    }
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowNewBanner(false);
  };

  let lastDate = '';
  let lastAuthor = '';
  let lastTime = 0;

  return (
    <div className="relative flex-1 overflow-hidden">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto py-4"
      >
        {loadingMore && (
          <div className="flex justify-center py-3">
            <Loader size={22} />
          </div>
        )}

        {messages.length === 0 && !loadingMore && (
          <div className="flex h-full flex-col items-center justify-center text-center text-text-secondary">
            <p className="text-lg font-semibold text-text-primary">No messages yet</p>
            <p className="text-sm">Be the first to say something.</p>
          </div>
        )}

        {messages.map((m) => {
          const created = new Date(m.createdAt);
          const dayKey = format(created, 'yyyy-MM-dd');
          const showDate = dayKey !== lastDate;

          // Group consecutive messages from the same author within 5 minutes.
          const sameAuthor = m.authorId === lastAuthor;
          const withinWindow = created.getTime() - lastTime < 5 * 60 * 1000;
          const showHeader = showDate || !sameAuthor || !withinWindow;

          lastDate = dayKey;
          lastAuthor = m.authorId;
          lastTime = created.getTime();

          return (
            <div key={m.id}>
              {showDate && (
                <div className="my-3 flex items-center gap-3 px-4">
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="glass rounded-full px-3 py-0.5 text-xs font-medium text-text-secondary">
                    {dateLabel(created)}
                  </span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>
              )}
              <MessageItem message={m} showHeader={showHeader} onOpenThread={onOpenThread} />
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {showNewBanner && (
        <button
          onClick={scrollToBottom}
          className="btn-primary absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 text-sm"
        >
          <ArrowDown size={14} /> New messages
        </button>
      )}
    </div>
  );
}
