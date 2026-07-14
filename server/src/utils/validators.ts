import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const googleAuthSchema = z.object({
  credential: z.string().min(1, 'Google credential is required'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  bio: z.string().max(160, 'Bio must be 160 characters or less').optional(),
  customStatus: z.string().max(100).optional(),
});

export const createWorkspaceSchema = z.object({
  name: z.string().min(2, 'Workspace name must be at least 2 characters').max(50),
  description: z.string().max(300).optional(),
  icon: z.string().max(300).optional(),
});

export const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const channelNameRegex = /^[a-z0-9-]+$/;

export const createChannelSchema = z.object({
  workspaceId: z.string().uuid('Invalid workspace id'),
  name: z
    .string()
    .min(1, 'Channel name is required')
    .max(40)
    .regex(channelNameRegex, 'Channel name must be lowercase alphanumeric with hyphens only'),
  description: z.string().max(300).optional(),
  type: z.enum(['PUBLIC', 'PRIVATE', 'ANNOUNCEMENT']).optional(),
});

export const sendMessageSchema = z.object({
  content: z.string().max(4000).optional().default(''),
  channelId: z.string().uuid().optional(),
  dmId: z.string().uuid().optional(),
  parentId: z.string().uuid().optional(),
});

export const createTaskSchema = z.object({
  workspaceId: z.string().uuid(),
  title: z.string().min(1, 'Title is required').max(120),
  description: z.string().max(2000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assigneeId: z.string().uuid().optional().nullable(),
  dueDate: z.string().optional().nullable(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  description: z.string().max(2000).optional().nullable(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assigneeId: z.string().uuid().optional().nullable(),
  dueDate: z.string().optional().nullable(),
});

/**
 * Generates a URL-friendly slug from a workspace name.
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40);
}
