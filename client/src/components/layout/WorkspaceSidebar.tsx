import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, MessageSquare, Settings, LogOut, Circle, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useAuthStore } from '../../store/authStore';
import { usePresence } from '../../hooks/usePresence';
import api from '../../api/axios';
import Avatar from '../ui/Avatar';
import Tooltip from '../ui/Tooltip';
import Modal from '../ui/Modal';
import type { UserStatus, Workspace } from '../../types';

const statusOptions: { value: UserStatus; label: string; color: string }[] = [
  { value: 'ONLINE', label: 'Online', color: '#10b981' },
  { value: 'AWAY', label: 'Away', color: '#f59e0b' },
  { value: 'DND', label: 'Do Not Disturb', color: '#ef4444' },
  { value: 'OFFLINE', label: 'Invisible', color: '#64748b' },
];

export default function WorkspaceSidebar() {
  const navigate = useNavigate();
  const { workspaceId } = useParams();
  const { workspaces, setWorkspaces, setCurrentWorkspace } = useWorkspaceStore();
  const { user, logout } = useAuthStore();
  const { setStatus } = usePresence();

  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [name, setName] = useState('');
  const [joinInput, setJoinInput] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleCreate = async () => {
    if (name.trim().length < 2) {
      toast.error('Workspace name must be at least 2 characters.');
      return;
    }
    setCreating(true);
    try {
      const { data } = await api.post('/workspaces', { name: name.trim() });
      const ws: Workspace = data.workspace;
      setWorkspaces([...workspaces, ws]);
      setShowCreate(false);
      setName('');
      toast.success('Workspace created!');
      navigate(`/app/workspace/${ws.id}`);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const selectWorkspace = (ws: Workspace) => {
    setCurrentWorkspace(ws);
    navigate(`/app/workspace/${ws.id}`);
  };

  /**
   * Accepts either a full invite link (e.g. .../workspace/<id>/join) or a
   * raw workspace id pasted directly, and extracts the id from either form.
   */
  const extractWorkspaceId = (input: string): string | null => {
    const trimmed = input.trim();
    const match = trimmed.match(/workspace\/([a-zA-Z0-9-]+)\/join/);
    if (match) return match[1];
    // Fall back to treating the whole input as a raw workspace id.
    return /^[a-zA-Z0-9-]+$/.test(trimmed) ? trimmed : null;
  };

  const handleJoin = async () => {
    const workspaceId = extractWorkspaceId(joinInput);
    if (!workspaceId) {
      toast.error('Enter a valid invite link or workspace ID.');
      return;
    }
    setJoining(true);
    try {
      const { data } = await api.post(`/workspaces/${workspaceId}/join`);
      const joined: Workspace = data.workspace;
      if (!workspaces.some((w) => w.id === joined.id)) {
        setWorkspaces([...workspaces, joined]);
      }
      setShowJoin(false);
      setJoinInput('');
      toast.success(`Joined ${joined.name}!`);
      navigate(`/app/workspace/${joined.id}`);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="flex h-full w-[72px] flex-col items-center gap-2 bg-void py-3">
      {/* Logo */}
      <button
        onClick={() => navigate('/app')}
        className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-brand text-lg font-black text-white shadow-glow"
        title="NexusChat Home"
      >
        N
      </button>

      <div className="my-1 h-px w-8 bg-white/10" />

      {/* Workspaces */}
      <div className="flex flex-1 flex-col items-center gap-2 overflow-y-auto">
        {workspaces.map((ws) => {
          const active = ws.id === workspaceId;
          return (
            <Tooltip key={ws.id} content={ws.name}>
              <button
                onClick={() => selectWorkspace(ws)}
                className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold transition ${
                  active
                    ? 'bg-gradient-brand text-white shadow-glow ring-2 ring-indigo-400'
                    : 'bg-bg-medium text-text-secondary hover:bg-indigo-500/20 hover:text-white'
                }`}
              >
                {ws.icon && ws.icon.startsWith('http') ? (
                  <img src={ws.icon} alt={ws.name} className="h-full w-full rounded-full object-cover" />
                ) : ws.icon ? (
                  <span>{ws.icon}</span>
                ) : (
                  ws.name.charAt(0).toUpperCase()
                )}
              </button>
            </Tooltip>
          );
        })}

        <Tooltip content="Create workspace">
          <button
            onClick={() => setShowCreate(true)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-dashed border-indigo-500/40 text-indigo-400 transition hover:bg-indigo-500/10"
          >
            <Plus size={20} />
          </button>
        </Tooltip>

        <Tooltip content="Join workspace">
          <button
            onClick={() => setShowJoin(true)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-dashed border-cyan-500/40 text-cyan-400 transition hover:bg-cyan-500/10"
          >
            <LogIn size={18} />
          </button>
        </Tooltip>
      </div>

      {/* Bottom icons */}
      <div className="flex flex-col items-center gap-3 pt-2">
        <Tooltip content="Direct Messages">
          <button
            onClick={() => navigate('/app')}
            className="text-text-secondary transition hover:text-white"
          >
            <MessageSquare size={20} />
          </button>
        </Tooltip>

        <Tooltip content="Profile & Settings">
          <button
            onClick={() => navigate('/app/profile')}
            className="text-text-secondary transition hover:text-white"
          >
            <Settings size={20} />
          </button>
        </Tooltip>

        {/* User avatar + status menu */}
        <div className="relative" ref={menuRef}>
          <Tooltip content={user?.name || 'Profile'} side="right">
            <button onClick={() => setShowUserMenu((s) => !s)}>
              {user && <Avatar user={user} size="md" showStatus />}
            </button>
          </Tooltip>

          {showUserMenu && user && (
            <div className="glass absolute bottom-0 left-14 z-50 w-52 rounded-lg p-2 shadow-glow">
              <div className="mb-2 border-b border-white/10 px-2 pb-2">
                <p className="truncate text-sm font-semibold text-text-primary">{user.name}</p>
                <p className="truncate text-xs text-text-secondary">{user.email}</p>
              </div>
              <p className="px-2 py-1 text-xs font-semibold uppercase text-text-secondary">
                Set status
              </p>
              {statusOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setStatus(opt.value);
                    setShowUserMenu(false);
                  }}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-text-primary transition hover:bg-white/5"
                >
                  <Circle size={10} fill={opt.color} color={opt.color} />
                  {opt.label}
                </button>
              ))}
              <div className="my-1 h-px bg-white/10" />
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-red-400 transition hover:bg-white/5"
              >
                <LogOut size={16} />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create workspace modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create a workspace">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-text-secondary">Workspace name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="Acme Inc."
              className="input-field"
            />
          </div>
          <button onClick={handleCreate} disabled={creating} className="btn-primary w-full">
            {creating ? 'Creating...' : 'Create Workspace'}
          </button>
        </div>
      </Modal>

      {/* Join workspace modal */}
      <Modal isOpen={showJoin} onClose={() => setShowJoin(false)} title="Join a workspace">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-text-secondary">
              Invite link or workspace ID
            </label>
            <input
              autoFocus
              value={joinInput}
              onChange={(e) => setJoinInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              placeholder="Paste an invite link or workspace ID"
              className="input-field"
            />
            <p className="mt-1 text-xs text-text-secondary">
              Ask a workspace admin to send you an invite link, or a "Copy invite link" from
              their workspace settings.
            </p>
          </div>
          <button onClick={handleJoin} disabled={joining} className="btn-primary w-full">
            {joining ? 'Joining...' : 'Join Workspace'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
