import { Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import prisma from '../config/database';
import { signToken, cookieOptions } from '../utils/jwt';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  googleAuthSchema,
} from '../utils/validators';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { isCloudinaryConfigured, uploadBuffer } from '../config/cloudinary';
import { sendEmail, buildPasswordResetEmail } from '../utils/sendEmail';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const userSelect = {
  id: true,
  name: true,
  email: true,
  avatar: true,
  bio: true,
  status: true,
  customStatus: true,
  createdAt: true,
};

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = registerSchema.parse(req.body);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError('An account with this email already exists.', 409);
  }

  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, password: hashed, status: 'ONLINE' },
    select: userSelect,
  });

  const token = signToken({ userId: user.id, email: user.email });
  res.cookie('token', token, cookieOptions());
  res.status(201).json({ user, token });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.password) {
    // Either no account exists, or it was created via Google and has no
    // password set — either way, standard email/password login can't proceed.
    throw new AppError('Invalid email or password.', 401);
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw new AppError('Invalid email or password.', 401);
  }

  await prisma.user.update({ where: { id: user.id }, data: { status: 'ONLINE' } });

  const token = signToken({ userId: user.id, email: user.email });
  res.cookie('token', token, cookieOptions());

  const { password: _pw, ...safeUser } = user;
  res.json({ user: { ...safeUser, status: 'ONLINE' }, token });
});

export const googleAuth = asyncHandler(async (req: Request, res: Response) => {
  const { credential } = googleAuthSchema.parse(req.body);

  if (!process.env.GOOGLE_CLIENT_ID) {
    throw new AppError('Google sign-in is not configured on this server.', 503);
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    throw new AppError('Invalid Google credential.', 401);
  }

  if (!payload || !payload.email) {
    throw new AppError('Could not verify your Google account.', 401);
  }

  const { sub: googleId, email, name, picture, email_verified } = payload;

  if (!email_verified) {
    throw new AppError('Your Google email is not verified.', 401);
  }

  // Link to an existing account (matched by googleId, then by email),
  // or create a brand new user for a first-time Google sign-in.
  let user = await prisma.user.findUnique({ where: { googleId } });

  if (!user) {
    const existingByEmail = await prisma.user.findUnique({ where: { email } });
    if (existingByEmail) {
      user = await prisma.user.update({
        where: { id: existingByEmail.id },
        data: {
          googleId,
          avatar: existingByEmail.avatar || picture || null,
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          name: name || email.split('@')[0],
          email,
          googleId,
          avatar: picture || null,
          status: 'ONLINE',
        },
      });
    }
  }

  await prisma.user.update({ where: { id: user.id }, data: { status: 'ONLINE' } });

  const token = signToken({ userId: user.id, email: user.email });
  res.cookie('token', token, cookieOptions());

  const { password: _pw, ...safeUser } = user;
  res.json({ user: { ...safeUser, status: 'ONLINE' }, token });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  if (req.user) {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { status: 'OFFLINE' },
    });
  }
  res.clearCookie('token', { ...cookieOptions(), maxAge: undefined });
  res.json({ message: 'Logged out successfully.' });
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: userSelect,
  });
  res.json({ user });
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const data = updateProfileSchema.parse(req.body);

  let avatarUrl: string | undefined;
  if (req.file && isCloudinaryConfigured()) {
    const result = await uploadBuffer(req.file.buffer, 'nexuschat/avatars', 'image');
    avatarUrl = result.url;
  }

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.bio !== undefined && { bio: data.bio }),
      ...(data.customStatus !== undefined && { customStatus: data.customStatus }),
      ...(avatarUrl && { avatar: avatarUrl }),
    },
    select: userSelect,
  });

  res.json({ user });
});

const RESET_TOKEN_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Hashes a raw token with SHA-256 for safe storage (mirrors how the raw
 * token, once emailed, can be verified without ever persisting it in
 * plaintext in the database).
 */
function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = forgotPasswordSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email } });

  // Always respond with the same generic message whether or not the email
  // exists, to avoid leaking which addresses have accounts.
  const genericResponse = {
    message: 'If an account exists for that email, a reset link has been sent.',
  };

  if (!user) {
    res.json(genericResponse);
    return;
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = hashToken(rawToken);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetPasswordToken: hashedToken,
      resetPasswordExpires: new Date(Date.now() + RESET_TOKEN_EXPIRY_MS),
    },
  });

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const resetLink = `${clientUrl}/reset-password?token=${rawToken}`;

  await sendEmail({
    to: user.email,
    subject: 'Reset your NexusChat password',
    html: buildPasswordResetEmail(user.name, resetLink),
  });

  res.json(genericResponse);
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = resetPasswordSchema.parse(req.body);
  const hashedToken = hashToken(token);

  const user = await prisma.user.findFirst({
    where: {
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { gt: new Date() },
    },
  });

  if (!user) {
    throw new AppError('This reset link is invalid or has expired.', 400);
  }

  const hashed = await bcrypt.hash(password, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashed,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    },
  });

  res.json({ message: 'Password reset successfully. You can now sign in.' });
});

export const searchUsers = asyncHandler(async (req: Request, res: Response) => {
  const query = String(req.query.q || '').trim();
  if (!query) {
    res.json({ users: [] });
    return;
  }

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
      ],
      NOT: { id: req.user!.id },
    },
    select: userSelect,
    take: 20,
  });

  res.json({ users });
});
