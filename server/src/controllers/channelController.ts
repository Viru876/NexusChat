import { Request, Response } from 'express';
import prisma from '../config/database';
import { createChannelSchema } from '../utils/validators';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { getIO } from '../socket';

const authorSelect = {
  id: true,
  name: true,
  avatar: true,
  status: true,
};

/**
 * Verifies the user is a member of the workspace that owns the channel.
 */
async function assertWorkspaceMember(userId: string, workspaceId: string): Promise<void> {
  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });
  if (!membership) {
    throw new AppError('You are not a member of this workspace.', 403);
  }
}

export const createChannel = asyncHandler(async (req: Request, res: Response) => {
  const { workspaceId, name, description, type } = createChannelSchema.parse(req.body);
  const userId = req.user!.id;

  await assertWorkspaceMember(userId, workspaceId);

  const existing = await prisma.channel.findFirst({
    where: { workspaceId, name },
  });
  if (existing) {
    throw new AppError('A channel with this name already exists.', 409);
  }

  const channel = await prisma.channel.create({
    data: {
      name,
      description,
      type: type || 'PUBLIC',
      workspaceId,
      createdById: userId,
      members: { create: { userId } },
    },
  });

  try {
    getIO().to(`workspace:${workspaceId}`).emit('channel:created', { channel });
  } catch {
    // ignore if socket not ready
  }

  res.status(201).json({ channel });
});

export const getChannels = asyncHandler(async (req: Request, res: Response) => {
  const { workspaceId } = req.params;
  const userId = req.user!.id;

  await assertWorkspaceMember(userId, workspaceId);

  const channels = await prisma.channel.findMany({
    where: {
      workspaceId,
      OR: [
        { type: { in: ['PUBLIC', 'ANNOUNCEMENT'] } },
        { members: { some: { userId } } },
      ],
    },
    include: {
      members: { where: { userId }, select: { lastReadAt: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  // Compute unread counts per channel
  const withUnread = await Promise.all(
    channels.map(async (channel) => {
      const lastReadAt = channel.members[0]?.lastReadAt ?? null;
      const unreadCount = await prisma.message.count({
        where: {
          channelId: channel.id,
          parentId: null,
          authorId: { not: userId },
          ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}),
        },
      });
      const { members, ...rest } = channel;
      return { ...rest, unreadCount };
    })
  );

  res.json({ channels: withUnread });
});

export const getChannelMessages = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;
  const cursor = req.query.cursor as string | undefined;
  const limit = Math.min(Number(req.query.limit) || 50, 100);

  const channel = await prisma.channel.findUnique({ where: { id } });
  if (!channel) {
    throw new AppError('Channel not found.', 404);
  }
  await assertWorkspaceMember(userId, channel.workspaceId);

  const messages = await prisma.message.findMany({
    where: { channelId: id, parentId: null },
    include: {
      author: { select: authorSelect },
      reactions: { include: { user: { select: { id: true, name: true } } } },
      _count: { select: { replies: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  let nextCursor: string | null = null;
  if (messages.length > limit) {
    const nextItem = messages.pop();
    nextCursor = nextItem!.id;
  }

  // Return chronological order (oldest first) for rendering
  res.json({ messages: messages.reverse(), nextCursor });
});

export const getChannel = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const channel = await prisma.channel.findUnique({
    where: { id },
    include: {
      members: { include: { user: { select: authorSelect } } },
      _count: { select: { members: true, messages: true } },
    },
  });
  if (!channel) {
    throw new AppError('Channel not found.', 404);
  }
  await assertWorkspaceMember(userId, channel.workspaceId);

  res.json({ channel });
});

/**
 * Deletes a channel and its messages. Allowed for the channel creator, or
 * any workspace OWNER/ADMIN — mirrors the permission model used elsewhere
 * (e.g. task deletion).
 */
export const deleteChannel = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const channel = await prisma.channel.findUnique({ where: { id } });
  if (!channel) {
    throw new AppError('Channel not found.', 404);
  }

  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId: channel.workspaceId } },
  });
  if (!membership) {
    throw new AppError('You are not a member of this workspace.', 403);
  }

  const canDelete =
    channel.createdById === userId || membership.role === 'OWNER' || membership.role === 'ADMIN';
  if (!canDelete) {
    throw new AppError('Only the creator or an admin can delete this channel.', 403);
  }

  if (channel.name === 'general') {
    throw new AppError('The #general channel cannot be deleted.', 400);
  }

  await prisma.channel.delete({ where: { id } });

  try {
    getIO()
      .to(`workspace:${channel.workspaceId}`)
      .emit('channel:deleted', { channelId: id, workspaceId: channel.workspaceId });
  } catch {
    // ignore if socket not ready
  }

  res.json({ message: `#${channel.name} has been deleted.` });
});

export const joinChannel = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const channel = await prisma.channel.findUnique({ where: { id } });
  if (!channel) {
    throw new AppError('Channel not found.', 404);
  }
  await assertWorkspaceMember(userId, channel.workspaceId);

  await prisma.channelMember.upsert({
    where: { channelId_userId: { channelId: id, userId } },
    create: { channelId: id, userId },
    update: {},
  });

  res.json({ message: 'Joined channel.' });
});
