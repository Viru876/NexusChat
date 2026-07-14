// NexusChat shared TypeScript types
// Developer: Virendra Singh (IEC2024015) — IIIT Allahabad

export type UserStatus = 'ONLINE' | 'OFFLINE' | 'AWAY' | 'DND';
export type MemberRole = 'OWNER' | 'ADMIN' | 'MEMBER';
export type ChannelType = 'PUBLIC' | 'PRIVATE' | 'ANNOUNCEMENT';
export type MessageType = 'TEXT' | 'FILE' | 'IMAGE' | 'SYSTEM';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type CallType = 'audio' | 'video';
export type CallStatus = 'idle' | 'calling' | 'ringing' | 'connected';

export interface User {
  id: string;
  name: string;
  email?: string;
  avatar?: string | null;
  bio?: string | null;
  status: UserStatus;
  customStatus?: string | null;
  createdAt?: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  ownerId: string;
  memberCount?: number;
  channelCount?: number;
  createdAt?: string;
}

export interface WorkspaceMember {
  id: string;
  userId: string;
  workspaceId: string;
  role: MemberRole;
  joinedAt: string;
  user: User;
}

export interface Channel {
  id: string;
  name: string;
  description?: string | null;
  type: ChannelType;
  workspaceId: string;
  createdById: string;
  unreadCount?: number;
  createdAt?: string;
}

export interface Reaction {
  id: string;
  emoji: string;
  messageId: string;
  userId: string;
  user?: { id: string; name: string };
}

export interface Message {
  id: string;
  content: string;
  type: MessageType;
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  channelId?: string | null;
  dmId?: string | null;
  authorId: string;
  parentId?: string | null;
  edited: boolean;
  editedAt?: string | null;
  pinned?: boolean;
  pinnedAt?: string | null;
  createdAt: string;
  author: User;
  reactions: Reaction[];
  _count?: { replies: number };
}

export interface DirectMessageConversation {
  id: string;
  otherUser: User;
  lastMessage?: Message | null;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  workspaceId: string;
  assigneeId?: string | null;
  assignee?: User | null;
  dueDate?: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface GroupedTasks {
  TODO: Task[];
  IN_PROGRESS: Task[];
  IN_REVIEW: Task[];
  DONE: Task[];
}

export interface IncomingCall {
  callId: string;
  type: CallType;
  caller: User;
}

export interface TypingUser {
  userId: string;
  name: string;
}

export interface SearchResult extends Message {
  channel?: { id: string; name: string; workspaceId: string } | null;
}
