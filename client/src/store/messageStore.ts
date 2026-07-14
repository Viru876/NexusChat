import { create } from 'zustand';
import type { Message, Reaction, TypingUser } from '../types';

interface MessageState {
  messages: Record<string, Message[]>; // keyed by channelId
  dmMessages: Record<string, Message[]>; // keyed by dmId
  typingUsers: Record<string, TypingUser[]>; // keyed by channelId or dmId
  unreadCounts: Record<string, number>;

  setMessages: (key: string, messages: Message[], isDM?: boolean) => void;
  prependMessages: (key: string, messages: Message[], isDM?: boolean) => void;
  addMessage: (key: string, message: Message, isDM?: boolean) => void;
  updateMessage: (
    key: string,
    messageId: string,
    updates: Partial<Message>,
    isDM?: boolean
  ) => void;
  deleteMessage: (key: string, messageId: string, isDM?: boolean) => void;
  updateReactions: (messageId: string, reactions: Reaction[]) => void;
  setTyping: (key: string, user: TypingUser, isTyping: boolean) => void;
  incrementUnread: (key: string) => void;
  clearUnread: (key: string) => void;
  reset: () => void;
}

/**
 * Merges a list of messages into an existing array, de-duplicating by id
 * and keeping chronological order.
 */
function mergeMessages(existing: Message[], incoming: Message[]): Message[] {
  const map = new Map<string, Message>();
  [...existing, ...incoming].forEach((m) => map.set(m.id, m));
  return Array.from(map.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

export const useMessageStore = create<MessageState>((set) => ({
  messages: {},
  dmMessages: {},
  typingUsers: {},
  unreadCounts: {},

  setMessages: (key, messages, isDM = false) =>
    set((state) => {
      const field = isDM ? 'dmMessages' : 'messages';
      return { [field]: { ...state[field], [key]: messages } } as Partial<MessageState>;
    }),

  prependMessages: (key, messages, isDM = false) =>
    set((state) => {
      const field = isDM ? 'dmMessages' : 'messages';
      const existing = state[field][key] || [];
      return {
        [field]: { ...state[field], [key]: mergeMessages(messages, existing) },
      } as Partial<MessageState>;
    }),

  addMessage: (key, message, isDM = false) =>
    set((state) => {
      const field = isDM ? 'dmMessages' : 'messages';
      const existing = state[field][key] || [];
      if (existing.some((m) => m.id === message.id)) return state;
      return {
        [field]: { ...state[field], [key]: [...existing, message] },
      } as Partial<MessageState>;
    }),

  updateMessage: (key, messageId, updates, isDM = false) =>
    set((state) => {
      const field = isDM ? 'dmMessages' : 'messages';
      const existing = state[field][key] || [];
      return {
        [field]: {
          ...state[field],
          [key]: existing.map((m) => (m.id === messageId ? { ...m, ...updates } : m)),
        },
      } as Partial<MessageState>;
    }),

  deleteMessage: (key, messageId, isDM = false) =>
    set((state) => {
      const field = isDM ? 'dmMessages' : 'messages';
      const existing = state[field][key] || [];
      return {
        [field]: {
          ...state[field],
          [key]: existing.filter((m) => m.id !== messageId),
        },
      } as Partial<MessageState>;
    }),

  updateReactions: (messageId, reactions) =>
    set((state) => {
      const apply = (record: Record<string, Message[]>) => {
        const next: Record<string, Message[]> = {};
        for (const [k, list] of Object.entries(record)) {
          next[k] = list.map((m) => (m.id === messageId ? { ...m, reactions } : m));
        }
        return next;
      };
      return {
        messages: apply(state.messages),
        dmMessages: apply(state.dmMessages),
      };
    }),

  setTyping: (key, user, isTyping) =>
    set((state) => {
      const current = state.typingUsers[key] || [];
      let next: TypingUser[];
      if (isTyping) {
        next = current.some((u) => u.userId === user.userId)
          ? current
          : [...current, user];
      } else {
        next = current.filter((u) => u.userId !== user.userId);
      }
      return { typingUsers: { ...state.typingUsers, [key]: next } };
    }),

  incrementUnread: (key) =>
    set((state) => ({
      unreadCounts: { ...state.unreadCounts, [key]: (state.unreadCounts[key] || 0) + 1 },
    })),

  clearUnread: (key) =>
    set((state) => ({ unreadCounts: { ...state.unreadCounts, [key]: 0 } })),

  reset: () => set({ messages: {}, dmMessages: {}, typingUsers: {}, unreadCounts: {} }),
}));
