import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  Hash,
  ClipboardList,
  MessageSquarePlus,
  PhoneCall,
  LayoutGrid,
  Home,
  UserMinus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useAuthStore } from '../store/authStore';
import { useWebRTC } from '../hooks/useWebRTC';
import api from '../api/axios';
import KanbanBoard from '../components/tasks/KanbanBoard';

export default function WorkspacePage() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const { currentWorkspace, channels, members, removeMember } = useWorkspaceStore();
  const { user } = useAuthStore();
  const { startCall } = useWebRTC();
  const [tab, setTab] = useState<'home' | 'tasks'>('home');

  const startWorkspaceCall = () => {
    const others = members.filter((m) => m.userId !== user?.id).map((m) => m.user);
    if (others.length === 0) {
      toast('Invite a teammate to start a call.');
      return;
    }
    startCall(others, 'video');
  };

  const myRole = members.find((m) => m.userId === user?.id)?.role;
  const canManageMembers = myRole === 'OWNER' || myRole === 'ADMIN';

  const handleRemoveMember = async (targetUserId: string, targetName: string) => {
    if (!workspaceId) return;
    if (!confirm(`Remove ${targetName} from this workspace?`)) return;
    try {
      await api.delete(`/workspaces/${workspaceId}/members/${targetUserId}`);
      removeMember(targetUserId);
      toast.success(`${targetName} was removed.`);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  // No workspace selected yet.
  if (!workspaceId || !currentWorkspace) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-brand text-4xl font-black text-white shadow-glow">
          N
        </div>
        <h1 className="text-2xl font-bold text-text-primary">
          Welcome to NexusChat{user ? `, ${user.name}` : ''}
        </h1>
        <p className="mt-2 max-w-md text-text-secondary">
          Select a workspace from the sidebar, or create a new one to start collaborating with
          your team.
        </p>
      </div>
    );
  }

  const stats = [
    { icon: Users, label: 'Members', value: members.length },
    { icon: Hash, label: 'Channels', value: channels.length },
  ];

  const quickActions = [
    {
      icon: MessageSquarePlus,
      label: 'Browse Channels',
      onClick: () => {
        if (channels[0]) {
          navigate(`/app/workspace/${workspaceId}/channel/${channels[0].id}`);
        }
      },
    },
    { icon: ClipboardList, label: 'Manage Tasks', onClick: () => setTab('tasks') },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary">{currentWorkspace.name}</h1>
          {currentWorkspace.description && (
            <p className="text-sm text-text-secondary">{currentWorkspace.description}</p>
          )}
        </div>
        <div className="flex gap-1 rounded-lg bg-bg-medium p-1">
          <button
            onClick={() => setTab('home')}
            className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-sm transition ${
              tab === 'home' ? 'bg-indigo-500/30 text-white' : 'text-text-secondary'
            }`}
          >
            <Home size={15} /> Home
          </button>
          <button
            onClick={() => setTab('tasks')}
            className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-sm transition ${
              tab === 'tasks' ? 'bg-indigo-500/30 text-white' : 'text-text-secondary'
            }`}
          >
            <LayoutGrid size={15} /> Tasks
          </button>
        </div>
      </div>

      {tab === 'tasks' ? (
        <KanbanBoard workspaceId={workspaceId} />
      ) : (
        <div className="flex-1 overflow-y-auto p-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-4xl"
          >
            <h2 className="mb-4 text-lg font-bold text-text-primary">
              Welcome to {currentWorkspace.name} 👋
            </h2>

            {/* Stats */}
            <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3">
              {stats.map((s) => (
                <div key={s.label} className="glass rounded-xl p-4">
                  <s.icon className="mb-2 text-indigo-400" size={22} />
                  <p className="text-2xl font-black text-text-primary">{s.value}</p>
                  <p className="text-sm text-text-secondary">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <h3 className="mb-3 text-sm font-semibold uppercase text-text-secondary">
              Quick actions
            </h3>
            <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              {quickActions.map((a) => (
                <button
                  key={a.label}
                  onClick={a.onClick}
                  className="glass flex flex-col items-start gap-2 rounded-xl p-4 text-left transition hover:-translate-y-0.5 hover:border-indigo-500/60"
                >
                  <a.icon className="text-indigo-400" size={20} />
                  <span className="text-sm font-medium text-text-primary">{a.label}</span>
                </button>
              ))}
              <button
                onClick={startWorkspaceCall}
                className="glass flex flex-col items-start gap-2 rounded-xl p-4 text-left transition hover:-translate-y-0.5 hover:border-indigo-500/60"
              >
                <PhoneCall className="text-indigo-400" size={20} />
                <span className="text-sm font-medium text-text-primary">Start a Call</span>
              </button>
            </div>

            {/* Members */}
            <h3 className="mb-3 text-sm font-semibold uppercase text-text-secondary">Members</h3>
            <div className="glass rounded-xl p-4">
              {members.map((m) => (
                <div key={m.userId} className="flex items-center gap-3 py-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-brand text-sm font-semibold text-white">
                    {m.user.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-primary">{m.user.name}</p>
                    <p className="text-xs text-text-secondary">{m.role.toLowerCase()}</p>
                  </div>
                  {canManageMembers && m.role !== 'OWNER' && m.userId !== user?.id && (
                    <button
                      onClick={() => handleRemoveMember(m.userId, m.user.name)}
                      className="rounded p-1.5 text-text-secondary transition hover:bg-white/5 hover:text-red-400"
                      title={`Remove ${m.user.name}`}
                    >
                      <UserMinus size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
