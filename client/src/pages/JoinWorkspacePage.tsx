import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Users, Hash, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import Loader from '../components/ui/Loader';
import { useWorkspaceStore } from '../store/workspaceStore';
import type { Workspace } from '../types';

interface WorkspacePreview {
  id: string;
  name: string;
  icon: string | null;
  description: string | null;
  memberCount: number;
  channelCount: number;
}

/**
 * Landing page for workspace invite links (e.g. shared via the invite email
 * or the "Copy invite link" action). Shows a preview of the workspace and
 * lets the signed-in user join with one click.
 */
export default function JoinWorkspacePage() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const { workspaces, setWorkspaces, setCurrentWorkspace } = useWorkspaceStore();

  const [preview, setPreview] = useState<WorkspacePreview | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!workspaceId) return;
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/workspaces/${workspaceId}/preview`);
        setPreview(data.workspace);
        setIsMember(data.isMember);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [workspaceId]);

  const handleJoin = async () => {
    if (!workspaceId) return;
    setJoining(true);
    try {
      const { data } = await api.post(`/workspaces/${workspaceId}/join`);
      const joined: Workspace = data.workspace;

      if (!workspaces.some((w) => w.id === joined.id)) {
        setWorkspaces([...workspaces, joined]);
      }
      setCurrentWorkspace(joined);
      toast.success(`Joined ${joined.name}!`);
      navigate(`/app/workspace/${joined.id}`);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-void">
        <Loader label="Loading invite..." />
      </div>
    );
  }

  if (error || !preview) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-void p-6">
        <div className="glass w-full max-w-md rounded-2xl p-8 text-center shadow-glow">
          <h2 className="mb-2 text-xl font-bold text-text-primary">Invite link invalid</h2>
          <p className="mb-6 text-sm text-text-secondary">
            {error || 'This workspace could not be found.'}
          </p>
          <button onClick={() => navigate('/app')} className="btn-primary inline-flex px-6 py-2.5">
            <ArrowLeft size={16} /> Back to NexusChat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-void p-6">
      <div className="glass w-full max-w-md rounded-2xl p-8 text-center shadow-glow">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-brand text-2xl font-black text-white shadow-glow">
          {preview.icon && preview.icon.startsWith('http') ? (
            <img
              src={preview.icon}
              alt={preview.name}
              className="h-full w-full rounded-2xl object-cover"
            />
          ) : preview.icon ? (
            <span>{preview.icon}</span>
          ) : (
            preview.name.charAt(0).toUpperCase()
          )}
        </div>

        <h2 className="text-xl font-bold text-text-primary">{preview.name}</h2>
        {preview.description && (
          <p className="mt-1 text-sm text-text-secondary">{preview.description}</p>
        )}

        <div className="mt-4 flex items-center justify-center gap-4 text-sm text-text-secondary">
          <span className="flex items-center gap-1">
            <Users size={14} /> {preview.memberCount} members
          </span>
          <span className="flex items-center gap-1">
            <Hash size={14} /> {preview.channelCount} channels
          </span>
        </div>

        {isMember ? (
          <button
            onClick={() => navigate(`/app/workspace/${preview.id}`)}
            className="btn-primary mt-6 w-full py-2.5"
          >
            Go to workspace
          </button>
        ) : (
          <button onClick={handleJoin} disabled={joining} className="btn-primary mt-6 w-full py-2.5">
            {joining ? 'Joining...' : `Join ${preview.name}`}
          </button>
        )}
      </div>
    </div>
  );
}
