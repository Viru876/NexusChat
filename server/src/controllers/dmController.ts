import { Request, Response } from 'express';
import prisma from '../config/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';

const userSelect = {
  id: true,
  name: true,
  avatar: true,
  status: true,
  customStatus: true,
};

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

/**
 * Finds an existing DM between the current user and the target, or creates one.
 * DM identity is symmetric regardless of who initiated.
 */
export const getOrCreateDM = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const targetId = req.body.userId as string;

  if (!targetId || targetId === userId) {
    throw new AppError('A valid target user id is required.', 400);
  }

  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) {
    throw new AppError('User not found.', 404);
  }

  let dm = await prisma.directMessage.findFirst({
    where: {
      OR: [
        { initiatorId: userId, receiverId: targetId },
        { initiatorId: targetId, receiverId: userId },
      ],
    },
    include: {
      initiator: { select: userSelect },
      receiver: { select: userSelect },
    },
  });

  if (!dm) {
    dm = await prisma.directMessage.create({
      data: { initiatorId: userId, receiverId: targetId },
      include: {
        initiator: { select: userSelect },
        receiver: { select: userSelect },
      },
    });
  }

  const messages = await prisma.message.findMany({
    where: { dmId: dm.id, parentId: null },
    include: messageInclude,
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const otherUser = dm.initiatorId === userId ? dm.receiver : dm.initiator;

  res.json({ dm: { ...dm, otherUser }, messages: messages.reverse() });
});

export const getDMMessages = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;
  const cursor = req.query.cursor as string | undefined;
  const limit = Math.min(Number(req.query.limit) || 50, 100);

  const dm = await prisma.directMessage.findUnique({ where: { id } });
  if (!dm) {
    throw new AppError('Conversation not found.', 404);
  }
  if (dm.initiatorId !== userId && dm.receiverId !== userId) {
    throw new AppError('You are not part of this conversation.', 403);
  }

  const messages = await prisma.message.findMany({
    where: { dmId: id, parentId: null },
    include: messageInclude,
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  let nextCursor: string | null = null;
  if (messages.length > limit) {
    const nextItem = messages.pop();
    nextCursor = nextItem!.id;
  }

  res.json({ messages: messages.reverse(), nextCursor });
});

export const getMyDMs = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const dms = await prisma.directMessage.findMany({
    where: { OR: [{ initiatorId: userId }, { receiverId: userId }] },
    include: {
      initiator: { select: userSelect },
      receiver: { select: userSelect },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: { author: { select: authorSelect } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const result = dms.map((dm) => {
    const otherUser = dm.initiatorId === userId ? dm.receiver : dm.initiator;
    return {
      id: dm.id,
      otherUser,
      lastMessage: dm.messages[0] || null,
      createdAt: dm.createdAt,
    };
  });

  res.json({ dms: result });
});
