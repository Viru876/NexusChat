import { Request, Response } from 'express';
import prisma from '../config/database';
import { createTaskSchema, updateTaskSchema } from '../utils/validators';
import { AppError, asyncHandler } from '../middleware/errorHandler';

const assigneeSelect = {
  id: true,
  name: true,
  avatar: true,
  status: true,
};

async function assertWorkspaceMember(userId: string, workspaceId: string) {
  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });
  if (!membership) {
    throw new AppError('You are not a member of this workspace.', 403);
  }
  return membership;
}

export const createTask = asyncHandler(async (req: Request, res: Response) => {
  const data = createTaskSchema.parse(req.body);
  const userId = req.user!.id;

  await assertWorkspaceMember(userId, data.workspaceId);

  const task = await prisma.task.create({
    data: {
      title: data.title,
      description: data.description,
      priority: data.priority || 'MEDIUM',
      workspaceId: data.workspaceId,
      assigneeId: data.assigneeId || null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      createdById: userId,
      status: 'TODO',
    },
    include: { assignee: { select: assigneeSelect } },
  });

  res.status(201).json({ task });
});

export const getTasks = asyncHandler(async (req: Request, res: Response) => {
  const { workspaceId } = req.params;
  const userId = req.user!.id;

  await assertWorkspaceMember(userId, workspaceId);

  const tasks = await prisma.task.findMany({
    where: { workspaceId },
    include: { assignee: { select: assigneeSelect } },
    orderBy: { createdAt: 'desc' },
  });

  const grouped = {
    TODO: tasks.filter((t) => t.status === 'TODO'),
    IN_PROGRESS: tasks.filter((t) => t.status === 'IN_PROGRESS'),
    IN_REVIEW: tasks.filter((t) => t.status === 'IN_REVIEW'),
    DONE: tasks.filter((t) => t.status === 'DONE'),
  };

  res.json({ tasks, grouped });
});

export const updateTask = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = updateTaskSchema.parse(req.body);
  const userId = req.user!.id;

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) {
    throw new AppError('Task not found.', 404);
  }
  await assertWorkspaceMember(userId, task.workspaceId);

  const updated = await prisma.task.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.priority !== undefined && { priority: data.priority }),
      ...(data.assigneeId !== undefined && { assigneeId: data.assigneeId }),
      ...(data.dueDate !== undefined && {
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      }),
    },
    include: { assignee: { select: assigneeSelect } },
  });

  res.json({ task: updated });
});

export const assignTask = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const assigneeId = req.body.assigneeId as string | null;
  const userId = req.user!.id;

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) {
    throw new AppError('Task not found.', 404);
  }
  await assertWorkspaceMember(userId, task.workspaceId);

  if (assigneeId) {
    await assertWorkspaceMember(assigneeId, task.workspaceId);
  }

  const updated = await prisma.task.update({
    where: { id },
    data: { assigneeId: assigneeId || null },
    include: { assignee: { select: assigneeSelect } },
  });

  res.json({ task: updated });
});

export const deleteTask = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) {
    throw new AppError('Task not found.', 404);
  }

  const membership = await assertWorkspaceMember(userId, task.workspaceId);
  const canDelete =
    task.createdById === userId || membership.role === 'OWNER' || membership.role === 'ADMIN';
  if (!canDelete) {
    throw new AppError('Only the creator or an admin can delete this task.', 403);
  }

  await prisma.task.delete({ where: { id } });
  res.json({ message: 'Task deleted.' });
});
