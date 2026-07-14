import { useEffect, useState } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useMessageStore } from '../../store/messageStore';
import { usePresence } from '../../hooks/usePresence';
import { getSocket } from '../../hooks/useSocket';
import api from '../../api/axios';
import WorkspaceSidebar from './WorkspaceSidebar';
import ChannelSidebar from './ChannelSidebar';
import SearchModal from '../chat/SearchModal';
import type { DirectMessageConversation } from '../../types';

export default function AppLayout() {
  const { workspaceId } = useParams();
  const {
    setWorkspaces,
    setCurrentWorkspace,
    setChannels,
    setMembers,
    setDMs,
  } = useWorkspaceStore();
  const messageStore = useMessageStore();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Enable presence tracking for the whole app session.
  usePresence();

  // Load workspaces + DMs once on mount.
  useEffect(() => {
    (async () => {
      try {
        const [wsRes, dmRes] = await Promise.all([
          api.get('/workspaces'),
          api.get('/dms'),
        ]);
        setWorkspaces(wsRes.data.workspaces);
        setDMs(dmRes.data.dms as DirectMessageConversation[]);
      } catch {
        // handled by interceptor toast elsewhere
      }
    })();
  }, [setWorkspaces, setDMs]);

  // Load the active workspace's channels + members and join socket rooms.
  useEffect(() => {
    if (!workspaceId) return;
    (async () => {
      try {
        const { data } = await api.get(`/workspaces/${workspaceId}`);
        setCurrentWorkspace(data.workspace);
        setMembers(data.workspace.members || []);

        const chRes = await api.get(`/channels/workspace/${workspaceId}`);
        setChannels(chRes.data.channels);

        // Seed unread counts from the server.
        chRes.data.channels.forEach((c: { id: string; unreadCount?: number }) => {
          if (c.unreadCount && c.unreadCount > 0) {
            for (let i = 0; i < c.unreadCount; i++) messageStore.incrementUnread(c.id);
          }
        });

        const socket = getSocket();
        socket?.emit('join_workspace', workspaceId);
      } catch {
        // ignore
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-void">
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen((s) => !s)}
        className="glass absolute left-3 top-3 z-40 rounded-lg p-2 md:hidden"
      >
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Sidebars — slide out on mobile */}
      <div
        className={`flex h-full transition-transform duration-300 md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } absolute z-30 md:relative md:z-auto`}
      >
        <WorkspaceSidebar />
        <ChannelSidebar onOpenSearch={() => setSearchOpen(true)} />
      </div>

      {/* Main content */}
      <main className="flex h-full flex-1 flex-col overflow-hidden bg-void">
        <Outlet context={{ openSearch: () => setSearchOpen(true) }} />
      </main>

      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
