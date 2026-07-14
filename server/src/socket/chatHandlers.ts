import { Server, Socket } from 'socket.io';
import prisma from '../config/database';

const authorSelect = {
  id: true,
  name: true,
  avatar: true,
  status: true,
};

const messageInclude = {
  author: { select: authorSelect },
  reactions: { include: { user: { select: { id: true, name: true } } } },
  _count: { select: { replies: true } },
};

interface SocketUser {
  id: string;
  name: string;
}

/**
 * Registers all chat-related socket event handlers for a connection.
 */
export function registerChatHandlers(io: Server, socket: Socket): void {
  const user = socket.data.user as SocketUser;

  // Join every channel room of a workspace the user belongs to.
  socket.on('join_workspace', async (workspaceId: string) => {
    try {
      const membership = await prisma.workspaceMember.findUnique({
        where: { userId_workspaceId: { userId: user.id, workspaceId } },
      });
      if (!membership) return;

      socket.join(`workspace:${workspaceId}`);

      const channels = await prisma.channel.findMany({
        where: {
          workspaceId,
          OR: [
            { type: { in: ['PUBLIC', 'ANNOUNCEMENT'] } },
            { members: { some: { userId: user.id } } },
          ],
        },
        select: { id: true },
      });
      channels.forEach((c) => socket.join(`channel:${c.id}`));
    } catch (err) {
      console.error('join_workspace error:', err);
    }
  });

  socket.on('join_channel', (channelId: string) => {
    socket.join(`channel:${channelId}`);
  });

  socket.on('leave_channel', (channelId: string) => {
    socket.leave(`channel:${channelId}`);
  });

  socket.on('join_dm', (dmId: string) => {
    socket.join(`dm:${dmId}`);
  });

  // Send a message and broadcast to the room.
  socket.on(
    'send_message',
    async (
      payload: {
        content: string;
        channelId?: string;
        dmId?: string;
        parentId?: string;
      },
      ack?: (msg: unknown) => void
    ) => {
      try {
        const content = (payload.content || '').trim();
        if (!content || (!payload.channelId && !payload.dmId)) return;

        const message = await prisma.message.create({
          data: {
            content,
            type: 'TEXT',
            channelId: payload.channelId || null,
            dmId: payload.dmId || null,
            parentId: payload.parentId || null,
            authorId: user.id,
          },
          include: messageInclude,
        });

        const room = payload.channelId
          ? `channel:${payload.channelId}`
          : `dm:${payload.dmId}`;
        io.to(room).emit('message:new', message);
        if (payload.parentId) {
          io.to(room).emit('thread:reply', { parentId: payload.parentId, message });
        }
        if (ack) ack(message);
      } catch (err) {
        console.error('send_message error:', err);
      }
    }
  );

  socket.on(
    'edit_message',
    async (payload: { messageId: string; content: string }) => {
      try {
        const existing = await prisma.message.findUnique({
          where: { id: payload.messageId },
        });
        if (!existing || existing.authorId !== user.id) return;

        const message = await prisma.message.update({
          where: { id: payload.messageId },
          data: { content: payload.content, edited: true, editedAt: new Date() },
          include: messageInclude,
        });

        const room = message.channelId
          ? `channel:${message.channelId}`
          : `dm:${message.dmId}`;
        io.to(room).emit('message:edited', message);
      } catch (err) {
        console.error('edit_message error:', err);
      }
    }
  );

  socket.on('delete_message', async (payload: { messageId: string }) => {
    try {
      const existing = await prisma.message.findUnique({
        where: { id: payload.messageId },
      });
      if (!existing || existing.authorId !== user.id) return;

      await prisma.message.delete({ where: { id: payload.messageId } });

      const room = existing.channelId
        ? `channel:${existing.channelId}`
        : `dm:${existing.dmId}`;
      io.to(room).emit('message:deleted', {
        messageId: existing.id,
        channelId: existing.channelId,
        dmId: existing.dmId,
      });
    } catch (err) {
      console.error('delete_message error:', err);
    }
  });

  // Toggle-friendly add reaction: upsert then broadcast full reaction list.
  socket.on(
    'add_reaction',
    async (payload: { messageId: string; emoji: string }) => {
      try {
        await prisma.reaction.upsert({
          where: {
            messageId_userId_emoji: {
              messageId: payload.messageId,
              userId: user.id,
              emoji: payload.emoji,
            },
          },
          create: {
            messageId: payload.messageId,
            userId: user.id,
            emoji: payload.emoji,
          },
          update: {},
        });
        await broadcastReactions(io, payload.messageId);
      } catch (err) {
        console.error('add_reaction error:', err);
      }
    }
  );

  socket.on(
    'remove_reaction',
    async (payload: { messageId: string; emoji: string }) => {
      try {
        await prisma.reaction.deleteMany({
          where: {
            messageId: payload.messageId,
            userId: user.id,
            emoji: payload.emoji,
          },
        });
        await broadcastReactions(io, payload.messageId);
      } catch (err) {
        console.error('remove_reaction error:', err);
      }
    }
  );

  socket.on('typing_start', (payload: { channelId?: string; dmId?: string }) => {
    const room = payload.channelId ? `channel:${payload.channelId}` : `dm:${payload.dmId}`;
    socket.to(room).emit('typing:start', {
      ...payload,
      userId: user.id,
      name: user.name,
    });
  });

  socket.on('typing_stop', (payload: { channelId?: string; dmId?: string }) => {
    const room = payload.channelId ? `channel:${payload.channelId}` : `dm:${payload.dmId}`;
    socket.to(room).emit('typing:stop', {
      ...payload,
      userId: user.id,
      name: user.name,
    });
  });

  socket.on('mark_read', async (payload: { channelId: string }) => {
    try {
      await prisma.channelMember.updateMany({
        where: { channelId: payload.channelId, userId: user.id },
        data: { lastReadAt: new Date() },
      });
    } catch (err) {
      console.error('mark_read error:', err);
    }
  });
}

/**
 * Reloads reactions for a message and emits the aggregated list.
 */
async function broadcastReactions(io: Server, messageId: string): Promise<void> {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: {
      channelId: true,
      dmId: true,
      reactions: { include: { user: { select: { id: true, name: true } } } },
    },
  });
  if (!message) return;

  const room = message.channelId ? `channel:${message.channelId}` : `dm:${message.dmId}`;
  io.to(room).emit('reaction:updated', { messageId, reactions: message.reactions });
}
