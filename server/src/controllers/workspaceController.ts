import { Request, Response } from 'express';
import prisma from '../config/database';
import { createWorkspaceSchema, inviteMemberSchema, slugify } from '../utils/validators';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { sendEmail, buildInviteEmail } from '../utils/sendEmail';
import { getIO } from '../socket';

const memberUserSelect = {
  id: true,
  name: true,
  email: true,
  avatar: true,
  status: true,
  customStatus: true,
};

/**
 * Ensures a unique slug by appending a counter if the base slug is taken.
 */
async function uniqueSlug(name: string): Promise<string> {
  const base = slugify(name) || 'workspace';
  let slug = base;
  let counter = 1;
  // eslint-disable-next-line no-await-in-loop
  while (await prisma.workspace.findUnique({ where: { slug } })) {
    slug = `${base}-${counter++}`;
  }
  return slug;
}

export const createWorkspace = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, icon } = createWorkspaceSchema.parse(req.body);
  const userId = req.user!.id;

  const slug = await uniqueSlug(name);

  const workspace = await prisma.workspace.create({
    data: {
      name,
      slug,
      description,
      icon,
      ownerId: userId,
      members: {
        create: { userId, role: 'OWNER' },
      },
      channels: {
        create: [
          {
            name: 'general',
            description: 'This is the beginning of your workspace.',
            type: 'PUBLIC',
            createdById: userId,
            members: { create: { userId } },
          },
          {
            name: 'announcements',
            description: 'Important updates from your team.',
            type: 'ANNOUNCEMENT',
            createdById: userId,
            members: { create: { userId } },
          },
        ],
      },
    },
    include: {
      channels: true,
      members: { include: { user: { select: memberUserSelect } } },
    },
  });

  res.status(201).json({ workspace });
});

export const getMyWorkspaces = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const workspaces = await prisma.workspace.findMany({
    where: { members: { some: { userId } } },
    include: {
      _count: { select: { members: true, channels: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  res.json({
    workspaces: workspaces.map((w) => ({
      id: w.id,
      name: w.name,
      slug: w.slug,
      description: w.description,
      icon: w.icon,
      ownerId: w.ownerId,
      memberCount: w._count.members,
      channelCount: w._count.channels,
      createdAt: w.createdAt,
    })),
  });
});

export const getWorkspace = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId: id } },
  });
  if (!membership) {
    throw new AppError('You are not a member of this workspace.', 403);
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id },
    include: {
      channels: {
        where: {
          OR: [
            { type: { in: ['PUBLIC', 'ANNOUNCEMENT'] } },
            { members: { some: { userId } } },
          ],
        },
        orderBy: { createdAt: 'asc' },
      },
      members: {
        include: { user: { select: memberUserSelect } },
        orderBy: { joinedAt: 'asc' },
      },
      _count: { select: { tasks: true } },
    },
  });

  if (!workspace) {
    throw new AppError('Workspace not found.', 404);
  }

  res.json({ workspace, role: membership.role });
});

/**
 * Returns minimal public info about a workspace so a user can see what
 * they're about to join before actually joining. Does not require existing
 * membership, unlike getWorkspace.
 */
export const getWorkspacePreview = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const workspace = await prisma.workspace.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      icon: true,
      description: true,
      _count: { select: { members: true, channels: true } },
    },
  });

  if (!workspace) {
    throw new AppError('Workspace not found. Check the invite link and try again.', 404);
  }

  const existingMembership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId: id } },
  });

  res.json({
    workspace: {
      id: workspace.id,
      name: workspace.name,
      icon: workspace.icon,
      description: workspace.description,
      memberCount: workspace._count.members,
      channelCount: workspace._count.channels,
    },
    isMember: Boolean(existingMembership),
  });
});

export const joinWorkspace = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const workspace = await prisma.workspace.findUnique({ where: { id } });
  if (!workspace) {
    throw new AppError('Workspace not found. Check the invite link and try again.', 404);
  }

  const existing = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId: id } },
  });

  // Already a member (e.g. re-clicked an old invite link) — treat as success
  // rather than an error, since the end state the user wants is the same.
  if (existing) {
    res.json({ message: 'You are already a member of this workspace.', workspace });
    return;
  }

  await prisma.workspaceMember.create({
    data: { userId, workspaceId: id, role: 'MEMBER' },
  });

  // Auto-join #general channel
  const general = await prisma.channel.findFirst({
    where: { workspaceId: id, name: 'general' },
  });
  if (general) {
    await prisma.channelMember.upsert({
      where: { channelId_userId: { channelId: general.id, userId } },
      create: { channelId: general.id, userId },
      update: {},
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: memberUserSelect,
  });

  try {
    getIO().to(`workspace:${id}`).emit('member:joined', { workspaceId: id, user });
  } catch {
    // socket not ready — ignore
  }

  res.json({ message: 'Joined workspace successfully.', workspace });
});

/**
 * Permanently deletes a workspace and everything in it (channels, messages,
 * tasks, memberships) via cascading deletes defined in the Prisma schema.
 * Only the workspace owner may do this.
 */
export const deleteWorkspace = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const workspace = await prisma.workspace.findUnique({ where: { id } });
  if (!workspace) {
    throw new AppError('Workspace not found.', 404);
  }
  if (workspace.ownerId !== userId) {
    throw new AppError('Only the workspace owner can delete this workspace.', 403);
  }

  // Snapshot members before deleting so we can notify anyone still connected.
  const memberIds = (
    await prisma.workspaceMember.findMany({
      where: { workspaceId: id },
      select: { userId: true },
    })
  ).map((m) => m.userId);

  await prisma.workspace.delete({ where: { id } });

  try {
    getIO().to(`workspace:${id}`).emit('workspace:deleted', { workspaceId: id, memberIds });
  } catch {
    // socket not ready — ignore
  }

  res.json({ message: `${workspace.name} has been deleted.` });
});

/**
 * Lets a non-owner member leave a workspace. Owners must transfer ownership
 * or delete the workspace instead, since a workspace can't be ownerless.
 */
export const leaveWorkspace = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const workspace = await prisma.workspace.findUnique({ where: { id } });
  if (!workspace) {
    throw new AppError('Workspace not found.', 404);
  }
  if (workspace.ownerId === userId) {
    throw new AppError(
      'As the owner, you must delete the workspace or transfer ownership before leaving.',
      400
    );
  }

  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId: id } },
  });
  if (!membership) {
    throw new AppError('You are not a member of this workspace.', 404);
  }

  await prisma.$transaction([
    prisma.channelMember.deleteMany({ where: { userId, channel: { workspaceId: id } } }),
    prisma.workspaceMember.delete({ where: { id: membership.id } }),
  ]);

  res.json({ message: `You have left ${workspace.name}.` });
});

/**
 * Removes a member from a workspace. Only owners/admins may remove others;
 * the owner cannot be removed (they must delete or transfer the workspace).
 */
export const removeMember = asyncHandler(async (req: Request, res: Response) => {
  const { id, userId: targetUserId } = req.params;
  const requesterId = req.user!.id;

  const requesterMembership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: requesterId, workspaceId: id } },
  });
  if (
    !requesterMembership ||
    (requesterMembership.role !== 'OWNER' && requesterMembership.role !== 'ADMIN')
  ) {
    throw new AppError('Only admins and owners can remove members.', 403);
  }

  const workspace = await prisma.workspace.findUnique({ where: { id } });
  if (!workspace) {
    throw new AppError('Workspace not found.', 404);
  }
  if (workspace.ownerId === targetUserId) {
    throw new AppError('The workspace owner cannot be removed.', 400);
  }

  const targetMembership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: targetUserId, workspaceId: id } },
  });
  if (!targetMembership) {
    throw new AppError('This user is not a member of the workspace.', 404);
  }

  await prisma.$transaction([
    prisma.channelMember.deleteMany({
      where: { userId: targetUserId, channel: { workspaceId: id } },
    }),
    prisma.workspaceMember.delete({ where: { id: targetMembership.id } }),
  ]);

  try {
    getIO().to(`workspace:${id}`).emit('member:removed', { workspaceId: id, userId: targetUserId });
  } catch {
    // socket not ready — ignore
  }

  res.json({ message: 'Member removed from workspace.' });
});

export const inviteMember = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { email } = inviteMemberSchema.parse(req.body);
  const userId = req.user!.id;

  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId: id } },
  });
  if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
    throw new AppError('Only admins and owners can invite members.', 403);
  }

  const workspace = await prisma.workspace.findUnique({ where: { id } });
  if (!workspace) {
    throw new AppError('Workspace not found.', 404);
  }

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const inviteLink = `${clientUrl}/workspace/${id}/join`;

  await sendEmail({
    to: email,
    subject: `You're invited to join ${workspace.name} on NexusChat`,
    html: buildInviteEmail(workspace.name, inviteLink),
  });

  res.json({ message: `Invitation sent to ${email}.`, inviteLink });
});
