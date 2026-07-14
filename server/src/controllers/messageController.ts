import { Request, Response } from 'express';
import prisma from '../config/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { isCloudinaryConfigured, uploadBuffer } from '../config/cloudinary';
import { getIO } from '../socket';

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
 * Sends a message via REST. Supports optional file upload (multipart).
 * Also emits the message over Socket.IO so connected clients update instantly.
 */
export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const content = String(req.body.content || '').trim();
  const channelId = req.body.channelId || null;
  const dmId = req.body.dmId || null;
  const parentId = req.body.parentId || null;

  if (!channelId && !dmId) {
    throw new AppError('A channelId or dmId is required.', 400);
  }

  let fileUrl: string | undefined;
  let fileName: string | undefined;
  let fileSize: number | undefined;
  let type: 'TEXT' | 'FILE' | 'IMAGE' = 'TEXT';

  if (req.file) {
    if (!isCloudinaryConfigured()) {
      throw new AppError('File uploads are not configured on this server.', 503);
    }
    const isImage = req.file.mimetype.startsWith('image/');
    const result = await uploadBuffer(
      req.file.buffer,
      'nexuschat/files',
      isImage ? 'image' : 'auto'
    );
    fileUrl = result.url;
    fileName = req.file.originalname;
    fileSize = req.file.size;
    type = isImage ? 'IMAGE' : 'FILE';
  }

  if (!content && !fileUrl) {
    throw new AppError('Message content or a file is required.', 400);
  }

  const message = await prisma.message.create({
    data: {
      content,
      type,
      fileUrl,
      fileName,
      fileSize,
      channelId,
      dmId,
      parentId,
      authorId: userId,
    },
    include: messageInclude,
  });

  try {
    const room = channelId ? `channel:${channelId}` : `dm:${dmId}`;
    getIO().to(room).emit('message:new', message);
  } catch {
    // socket not ready
  }

  res.status(201).json({ message });
});

export const getThreadReplies = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const parent = await prisma.message.findUnique({
    where: { id },
    include: messageInclude,
  });
  if (!parent) {
    throw new AppError('Parent message not found.', 404);
  }

  const replies = await prisma.message.findMany({
    where: { parentId: id },
    include: messageInclude,
    orderBy: { createdAt: 'asc' },
  });

  res.json({ parent, replies });
});

export const searchMessages = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const query = String(req.query.q || '').trim();
  const workspaceId = req.query.workspaceId as string | undefined;

  if (!query) {
    res.json({ results: [] });
    return;
  }

  // Restrict search to channels within workspaces the user belongs to.
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId },
    select: { workspaceId: true },
  });
  const workspaceIds = memberships.map((m) => m.workspaceId);
  const scopedWorkspaces = workspaceId ? [workspaceId] : workspaceIds;

  const results = await prisma.message.findMany({
    where: {
      content: { contains: query, mode: 'insensitive' },
      channel: { workspaceId: { in: scopedWorkspaces } },
    },
    include: {
      author: { select: authorSelect },
      channel: { select: { id: true, name: true, workspaceId: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  res.json({ results });
});

/**
 * Verifies the requesting user can access the channel or DM a message
 * belongs to, then toggles its pinned state.
 */
async function assertMessageAccess(userId: string, message: { channelId: string | null; dmId: string | null }) {
  if (message.channelId) {
    const channel = await prisma.channel.findUnique({ where: { id: message.channelId } });
    if (!channel) throw new AppError('Channel not found.', 404);
    const membership = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId: channel.workspaceId } },
    });
    if (!membership) throw new AppError('You are not a member of this workspace.', 403);
  } else if (message.dmId) {
    const dm = await prisma.directMessage.findUnique({ where: { id: message.dmId } });
    if (!dm) throw new AppError('Conversation not found.', 404);
    if (dm.initiatorId !== userId && dm.receiverId !== userId) {
      throw new AppError('You are not part of this conversation.', 403);
    }
  }
}

export const pinMessage = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const message = await prisma.message.findUnique({ where: { id } });
  if (!message) {
    throw new AppError('Message not found.', 404);
  }
  await assertMessageAccess(userId, message);

  const updated = await prisma.message.update({
    where: { id },
    data: { pinned: !message.pinned, pinnedAt: message.pinned ? null : new Date() },
    include: messageInclude,
  });

  try {
    const room = message.channelId ? `channel:${message.channelId}` : `dm:${message.dmId}`;
    getIO().to(room).emit('message:pinned', updated);
  } catch {
    // socket not ready
  }

  res.json({ message: updated });
});

export const getPinnedMessages = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { channelId, dmId } = req.query as { channelId?: string; dmId?: string };

  if (!channelId && !dmId) {
    throw new AppError('A channelId or dmId query parameter is required.', 400);
  }

  await assertMessageAccess(userId, {
    channelId: channelId || null,
    dmId: dmId || null,
  });

  const pinned = await prisma.message.findMany({
    where: { pinned: true, ...(channelId ? { channelId } : { dmId }) },
    include: messageInclude,
    orderBy: { pinnedAt: 'desc' },
  });

  res.json({ pinned });
});

/**
 * Returns all file/image attachments shared in a channel or DM, most
 * recent first — powers the "Shared files" gallery view.
 */
export const getSharedFiles = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { channelId, dmId } = req.query as { channelId?: string; dmId?: string };

  if (!channelId && !dmId) {
    throw new AppError('A channelId or dmId query parameter is required.', 400);
  }

  await assertMessageAccess(userId, {
    channelId: channelId || null,
    dmId: dmId || null,
  });

  const files = await prisma.message.findMany({
    where: {
      type: { in: ['FILE', 'IMAGE'] },
      ...(channelId ? { channelId } : { dmId }),
    },
    include: { author: { select: authorSelect } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  res.json({ files });
});

export const deleteMessage = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const message = await prisma.message.findUnique({ where: { id } });
  if (!message) {
    throw new AppError('Message not found.', 404);
  }
  if (message.authorId !== userId) {
    throw new AppError('You can only delete your own messages.', 403);
  }

  await prisma.message.delete({ where: { id } });

  try {
    const room = message.channelId ? `channel:${message.channelId}` : `dm:${message.dmId}`;
    getIO().to(room).emit('message:deleted', { messageId: id, channelId: message.channelId, dmId: message.dmId });
  } catch {
    // ignore
  }

  res.json({ message: 'Message deleted.' });
});
