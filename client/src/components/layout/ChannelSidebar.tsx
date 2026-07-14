import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Hash,
  Plus,
  ChevronDown,
  Lock,
  Megaphone,
  Search,
  Mic,
  Headphones,
  Link2,
  Mail,
  Trash2,
  LogOut,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useMessageStore } from '../../store/messageStore';
import { useAuthStore } from '../../store/authStore';
import { getSocket } from '../../hooks/useSocket';
import api from '../../api/axios';
import Avatar from '../ui/Avatar';
import Modal from '../ui/Modal';
import ContextMenu, { ContextMenuItem } from '../ui/ContextMenu';
import type { Channel, ChannelType } from '../../types';

interface ChannelSidebarProps {
  onOpenSearch: () => void;
}

const typeIcon = (type: ChannelType) => {
  if (type === 'PRIVATE') return <Lock size={15} />;
  if (type === 'ANNOUNCEMENT') return <Megaphone size={15} />;
  return <Hash size={15} />;
};

export default function ChannelSidebar({ onOpenSearch }: ChannelSidebarProps) {
  const navigate = useNavigate();
  const { workspaceId, channelId } = useParams();
  const { currentWorkspace, channels, dms, addChannel, removeChannel, removeWorkspace } =
    useWorkspaceStore();
  const { unreadCounts, clearUnread } = useMessageStore();
  const { user } = useAuthStore();

  const [showCreate, setShowCreate] = useState(false);
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showDeleteWorkspace, setShowDeleteWorkspace] = useState(false);
  const [showLeaveWorkspace, setShowLeaveWorkspace] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [deletingWorkspace, setDeletingWorkspace] = useState(false);
  const [leavingWorkspace, setLeavingWorkspace] = useState(false);
  const [filter, setFilter] = useState('');
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<ChannelType>('PUBLIC');
  const [creating, setCreating] = useState(false);
  const [menu, setMenu] = useState<{ x: number; y: number; channel: Channel } | null>(null);
  const workspaceMenuRef = useRef<HTMLDivElement>(null);

  const isOwner = currentWorkspace && user && currentWorkspace.ownerId === user.id;

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (workspaceMenuRef.current && !workspaceMenuRef.current.contains(e.target as Node)) {
        setShowWorkspaceMenu(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const filteredChannels = channels.filter((c) =>
    c.name.toLowerCase().includes(filter.toLowerCase())
  );

  const openChannel = (c: Channel) => {
    clearUnread(c.id);
    getSocket()?.emit('mark_read', { channelId: c.id });
    navigate(`/app/workspace/${workspaceId}/channel/${c.id}`);
  };

  const handleCreate = async () => {
    const name = newName.trim().toLowerCase().replace(/\s+/g, '-');
    if (!/^[a-z0-9-]+$/.test(name)) {
      toast.error('Use lowercase letters, numbers, and hyphens only.');
      return;
    }
    setCreating(true);
    try {
      const { data } = await api.post('/channels', {
        workspaceId,
        name,
        type: newType,
      });
      addChannel(data.channel);
      getSocket()?.emit('join_channel', data.channel.id);
      setShowCreate(false);
      setNewName('');
      toast.success(`#${name} created!`);
      openChannel(data.channel);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteChannel = async (channel: Channel) => {
    if (!confirm(`Delete #${channel.name}? This permanently removes all its messages.`)) return;
    try {
      await api.delete(`/channels/${channel.id}`);
      removeChannel(channel.id);
      toast.success(`#${channel.name} deleted.`);
      if (channel.id === channelId && workspaceId) {
        navigate(`/app/workspace/${workspaceId}`);
      }
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!workspaceId || !currentWorkspace) return;
    setDeletingWorkspace(true);
    try {
      await api.delete(`/workspaces/${workspaceId}`);
      removeWorkspace(workspaceId);
      toast.success(`${currentWorkspace.name} has been deleted.`);
      setShowDeleteWorkspace(false);
      navigate('/app');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setDeletingWorkspace(false);
    }
  };

  const handleLeaveWorkspace = async () => {
    if (!workspaceId || !currentWorkspace) return;
    setLeavingWorkspace(true);
    try {
      await api.post(`/workspaces/${workspaceId}/leave`);
      removeWorkspace(workspaceId);
      toast.success(`You left ${currentWorkspace.name}.`);
      setShowLeaveWorkspace(false);
      navigate('/app');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLeavingWorkspace(false);
    }
  };

  const copyInviteLink = () => {
    if (!workspaceId) return;
    const link = `${window.location.origin}/workspace/${workspaceId}/join`;
    navigator.clipboard.writeText(link);
    toast.success('Invite link copied to clipboard.');
    setShowWorkspaceMenu(false);
  };

  const sendInvite = async () => {
    if (!workspaceId) return;
    if (!inviteEmail.trim()) {
      toast.error('Enter an email address.');
      return;
    }
    setInviting(true);
    try {
      const { data } = await api.post(`/workspaces/${workspaceId}/invite`, {
        email: inviteEmail.trim(),
      });
      toast.success(data.message);
      setInviteEmail('');
      setShowInvite(false);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setInviting(false);
    }
  };

  const contextItems = (channel: Channel): ContextMenuItem[] => {
    const items: ContextMenuItem[] = [
      {
        label: 'Mark as read',
        onClick: () => {
          clearUnread(channel.id);
          getSocket()?.emit('mark_read', { channelId: channel.id });
        },
      },
      {
        label: 'Copy link',
        icon: Link2,
        onClick: () => {
          navigator.clipboard.writeText(
            `${window.location.origin}/app/workspace/${workspaceId}/channel/${channel.id}`
          );
          toast.success('Link copied to clipboard.');
        },
      },
    ];

    if (channel.name !== 'general') {
      items.push({
        label: 'Delete channel',
        icon: Trash2,
        danger: true,
        onClick: () => handleDeleteChannel(channel),
      });
    }

    return items;
  };

  return (
    <div className="flex h-full w-60 flex-col bg-bg-dark">
      {/* Workspace header */}
      <div className="relative" ref={workspaceMenuRef}>
        <button
          onClick={() => setShowWorkspaceMenu((s) => !s)}
          className="flex w-full items-center justify-between border-b border-white/5 px-4 py-3.5 text-left transition hover:bg-white/5"
        >
          <span className="truncate font-bold text-text-primary">
            {currentWorkspace?.name || 'Workspace'}
          </span>
          <ChevronDown size={18} className="text-text-secondary" />
        </button>

        {showWorkspaceMenu && (
          <div className="glass absolute left-3 right-3 top-full z-50 mt-1 rounded-lg p-1.5 shadow-glow">
            <button
              onClick={copyInviteLink}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-text-primary transition hover:bg-white/5"
            >
              <Link2 size={15} /> Copy invite link
            </button>
            <button
              onClick={() => {
                setShowInvite(true);
                setShowWorkspaceMenu(false);
              }}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-text-primary transition hover:bg-white/5"
            >
              <Mail size={15} /> Invite people via email
            </button>
            <div className="my-1 h-px bg-white/10" />

            {isOwner ? (
              <button
                onClick={() => {
                  setShowDeleteWorkspace(true);
                  setShowWorkspaceMenu(false);
                }}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-red-400 transition hover:bg-white/5"
              >
                <Trash2 size={15} /> Delete workspace
              </button>
            ) : (
              <button
                onClick={() => {
                  setShowLeaveWorkspace(true);
                  setShowWorkspaceMenu(false);
                }}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-red-400 transition hover:bg-white/5"
              >
                <LogOut size={15} /> Leave workspace
              </button>
            )}
          </div>
        )}
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="flex items-center gap-2 rounded-md bg-bg-medium px-2.5 py-1.5">
          <Search size={14} className="text-text-secondary" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter channels"
            className="w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-secondary"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2">
        {/* Channels */}
        <div className="mb-2">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
              Channels
            </span>
            <button
              onClick={() => setShowCreate(true)}
              className="text-text-secondary transition hover:text-white"
            >
              <Plus size={16} />
            </button>
          </div>

          {filteredChannels.map((c) => {
            const active = c.id === channelId;
            const unread = unreadCounts[c.id] || 0;
            return (
              <button
                key={c.id}
                onClick={() => openChannel(c)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setMenu({ x: e.clientX, y: e.clientY, channel: c });
                }}
                className={`group flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm transition ${
                  active
                    ? 'bg-indigo-500/25 text-white'
                    : unread > 0
                    ? 'font-semibold text-white hover:bg-white/5'
                    : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  {typeIcon(c.type)}
                  <span className="truncate">{c.name}</span>
                </span>
                {unread > 0 && (
                  <span className="ml-1 rounded-full bg-indigo-500 px-1.5 text-xs font-bold text-white">
                    {unread}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Direct messages */}
        <div className="mb-2">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
              Direct Messages
            </span>
          </div>

          {dms.map((dm) => (
            <button
              key={dm.id}
              onClick={() => navigate(`/app/dm/${dm.id}`)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-text-secondary transition hover:bg-white/5 hover:text-text-primary"
            >
              <Avatar user={dm.otherUser} size="sm" showStatus />
              <span className="truncate">{dm.otherUser.name}</span>
            </button>
          ))}
          {dms.length === 0 && (
            <p className="px-2 py-1 text-xs text-text-secondary">No conversations yet.</p>
          )}
        </div>
      </div>

      {/* User panel */}
      {user && (
        <div className="flex items-center gap-2 border-t border-white/5 bg-void px-3 py-2.5">
          <Avatar user={user} size="md" showStatus />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-text-primary">{user.name}</p>
            <p className="truncate text-xs text-text-secondary">
              {user.customStatus || user.status.toLowerCase()}
            </p>
          </div>
          <button className="text-text-secondary transition hover:text-white">
            <Mic size={16} />
          </button>
          <button className="text-text-secondary transition hover:text-white">
            <Headphones size={16} />
          </button>
        </div>
      )}

      {/* Create channel modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create a channel">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-text-secondary">Channel name</label>
            <div className="flex items-center gap-2 rounded-md bg-bg-medium px-2">
              <Hash size={16} className="text-text-secondary" />
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                placeholder="marketing"
                className="w-full bg-transparent py-2 text-text-primary outline-none"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm text-text-secondary">Type</label>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as ChannelType)}
              className="input-field"
            >
              <option value="PUBLIC">Public</option>
              <option value="PRIVATE">Private</option>
              <option value="ANNOUNCEMENT">Announcement</option>
            </select>
          </div>
          <button onClick={handleCreate} disabled={creating} className="btn-primary w-full">
            {creating ? 'Creating...' : 'Create Channel'}
          </button>
        </div>
      </Modal>

      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          items={contextItems(menu.channel)}
          onClose={() => setMenu(null)}
        />
      )}

      {/* Invite by email modal */}
      <Modal isOpen={showInvite} onClose={() => setShowInvite(false)} title="Invite people">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-text-secondary">Email address</label>
            <input
              autoFocus
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendInvite()}
              placeholder="teammate@example.com"
              className="input-field"
            />
            <p className="mt-1 text-xs text-text-secondary">
              Only workspace admins and owners can send invites.
            </p>
          </div>
          <button onClick={sendInvite} disabled={inviting} className="btn-primary w-full">
            {inviting ? 'Sending...' : 'Send Invite'}
          </button>
        </div>
      </Modal>

      {/* Delete workspace confirmation */}
      <Modal
        isOpen={showDeleteWorkspace}
        onClose={() => setShowDeleteWorkspace(false)}
        title="Delete workspace"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            This will permanently delete <strong className="text-text-primary">{currentWorkspace?.name}</strong>,
            including all channels, messages, tasks, and files. This action cannot be undone.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowDeleteWorkspace(false)}
              className="btn-ghost flex-1"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteWorkspace}
              disabled={deletingWorkspace}
              className="flex-1 rounded-lg bg-red-500 py-2.5 font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
            >
              {deletingWorkspace ? 'Deleting...' : 'Delete Workspace'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Leave workspace confirmation */}
      <Modal
        isOpen={showLeaveWorkspace}
        onClose={() => setShowLeaveWorkspace(false)}
        title="Leave workspace"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            You'll lose access to <strong className="text-text-primary">{currentWorkspace?.name}</strong> and
            its channels. You can rejoin later with an invite link.
          </p>
          <div className="flex gap-2">
            <button onClick={() => setShowLeaveWorkspace(false)} className="btn-ghost flex-1">
              Cancel
            </button>
            <button
              onClick={handleLeaveWorkspace}
              disabled={leavingWorkspace}
              className="flex-1 rounded-lg bg-red-500 py-2.5 font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
            >
              {leavingWorkspace ? 'Leaving...' : 'Leave Workspace'}
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
