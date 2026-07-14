import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Hash, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useWorkspaceStore } from '../../store/workspaceStore';
import api from '../../api/axios';
import Avatar from '../ui/Avatar';
import Loader from '../ui/Loader';
import type { SearchResult } from '../../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Filter = 'messages' | 'files' | 'people';
const RECENT_KEY = 'nexuschat_recent_searches';

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const navigate = useNavigate();
  const { currentWorkspace } = useWorkspaceStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<Filter>('messages');
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setRecent(JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'));
    }
  }, [isOpen]);

  const runSearch = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const { data } = await api.get('/messages/search', {
          params: { q, workspaceId: currentWorkspace?.id },
        });
        setResults(data.results);
      } finally {
        setLoading(false);
      }
    },
    [currentWorkspace?.id]
  );

  // Debounced search on query change.
  useEffect(() => {
    const t = setTimeout(() => runSearch(query), 300);
    return () => clearTimeout(t);
  }, [query, runSearch]);

  const saveRecent = (q: string) => {
    if (!q.trim()) return;
    const next = [q, ...recent.filter((r) => r !== q)].slice(0, 6);
    setRecent(next);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  };

  const openResult = (r: SearchResult) => {
    saveRecent(query);
    if (r.channel) {
      navigate(`/app/workspace/${r.channel.workspaceId}/channel/${r.channel.id}`);
    }
    onClose();
  };

  const filtered = results.filter((r) => {
    if (filter === 'files') return r.type === 'FILE' || r.type === 'IMAGE';
    return true;
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-start justify-center px-4 pt-24"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

          <motion.div
            className="glass relative z-10 w-full max-w-2xl overflow-hidden rounded-xl shadow-glow"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
          >
            <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
              <Search size={20} className="text-text-secondary" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search messages, files, people..."
                className="flex-1 bg-transparent text-lg text-text-primary outline-none placeholder:text-text-secondary"
              />
              <button
                onClick={onClose}
                className="rounded-lg p-1 text-text-secondary hover:bg-white/5 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Filters */}
            <div className="flex gap-2 border-b border-white/10 px-4 py-2">
              {(['messages', 'files', 'people'] as Filter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition ${
                    filter === f
                      ? 'bg-indigo-500/25 text-white'
                      : 'text-text-secondary hover:bg-white/5'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className="max-h-[50vh] overflow-y-auto p-2">
              {loading && (
                <div className="flex justify-center py-8">
                  <Loader size={24} />
                </div>
              )}

              {!loading && query && filtered.length === 0 && (
                <p className="py-8 text-center text-sm text-text-secondary">
                  No results found for "{query}"
                </p>
              )}

              {!loading && !query && recent.length > 0 && (
                <div className="p-2">
                  <p className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase text-text-secondary">
                    <Clock size={12} /> Recent searches
                  </p>
                  {recent.map((r) => (
                    <button
                      key={r}
                      onClick={() => setQuery(r)}
                      className="block w-full rounded px-2 py-1.5 text-left text-sm text-text-primary transition hover:bg-white/5"
                    >
                      {r}
                    </button>
                  ))}
                </div>
              )}

              {!loading &&
                filter !== 'people' &&
                filtered.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => openResult(r)}
                    className="flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-white/5"
                  >
                    <Avatar user={r.author} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-text-primary">
                          {r.author.name}
                        </span>
                        {r.channel && (
                          <span className="flex items-center gap-0.5 text-xs text-text-secondary">
                            <Hash size={11} />
                            {r.channel.name}
                          </span>
                        )}
                        <span className="text-xs text-text-secondary">
                          {format(new Date(r.createdAt), 'MMM d')}
                        </span>
                      </div>
                      <p className="truncate text-sm text-text-secondary">{r.content}</p>
                    </div>
                  </button>
                ))}

              {!loading && filter === 'people' && (
                <p className="py-8 text-center text-sm text-text-secondary">
                  People search uses the member list in each workspace.
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
