import { create } from 'zustand';
import type {
  Workspace,
  Channel,
  WorkspaceMember,
  UserStatus,
  DirectMessageConversation,
} from '../types';

interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  channels: Channel[];
  currentChannel: Channel | null;
  members: WorkspaceMember[];
  dms: DirectMessageConversation[];

  setWorkspaces: (workspaces: Workspace[]) => void;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  removeWorkspace: (workspaceId: string) => void;
  setChannels: (channels: Channel[]) => void;
  setCurrentChannel: (channel: Channel | null) => void;
  addChannel: (channel: Channel) => void;
  removeChannel: (channelId: string) => void;
  updateChannel: (channelId: string, updates: Partial<Channel>) => void;
  setMembers: (members: WorkspaceMember[]) => void;
  addMember: (member: WorkspaceMember) => void;
  removeMember: (userId: string) => void;
  updateMemberPresence: (
    userId: string,
    status: UserStatus,
    customStatus?: string | null
  ) => void;
  setDMs: (dms: DirectMessageConversation[]) => void;
  reset: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  workspaces: [],
  currentWorkspace: null,
  channels: [],
  currentChannel: null,
  members: [],
  dms: [],

  setWorkspaces: (workspaces) => set({ workspaces }),
  setCurrentWorkspace: (currentWorkspace) => set({ currentWorkspace }),

  removeWorkspace: (workspaceId) =>
    set((state) => ({
      workspaces: state.workspaces.filter((w) => w.id !== workspaceId),
      ...(state.currentWorkspace?.id === workspaceId
        ? { currentWorkspace: null, channels: [], currentChannel: null, members: [] }
        : {}),
    })),

  setChannels: (channels) => set({ channels }),
  setCurrentChannel: (currentChannel) => set({ currentChannel }),

  addChannel: (channel) =>
    set((state) =>
      state.channels.some((c) => c.id === channel.id)
        ? state
        : { channels: [...state.channels, channel] }
    ),

  removeChannel: (channelId) =>
    set((state) => ({
      channels: state.channels.filter((c) => c.id !== channelId),
      ...(state.currentChannel?.id === channelId ? { currentChannel: null } : {}),
    })),

  updateChannel: (channelId, updates) =>
    set((state) => ({
      channels: state.channels.map((c) =>
        c.id === channelId ? { ...c, ...updates } : c
      ),
    })),

  setMembers: (members) => set({ members }),

  addMember: (member) =>
    set((state) =>
      state.members.some((m) => m.userId === member.userId)
        ? state
        : { members: [...state.members, member] }
    ),

  removeMember: (userId) =>
    set((state) => ({ members: state.members.filter((m) => m.userId !== userId) })),

  updateMemberPresence: (userId, status, customStatus) =>
    set((state) => ({
      members: state.members.map((m) =>
        m.userId === userId
          ? {
              ...m,
              user: {
                ...m.user,
                status,
                ...(customStatus !== undefined ? { customStatus } : {}),
              },
            }
          : m
      ),
      dms: state.dms.map((dm) =>
        dm.otherUser.id === userId
          ? {
              ...dm,
              otherUser: {
                ...dm.otherUser,
                status,
                ...(customStatus !== undefined ? { customStatus } : {}),
              },
            }
          : dm
      ),
    })),

  setDMs: (dms) => set({ dms }),

  reset: () =>
    set({
      currentWorkspace: null,
      channels: [],
      currentChannel: null,
      members: [],
    }),
}));
