import { Server, Socket } from 'socket.io';
import prisma from '../config/database';

type Status = 'ONLINE' | 'OFFLINE' | 'AWAY' | 'DND';

interface SocketUser {
  id: string;
  name: string;
}

/**
 * Emits a presence update to every workspace the given user is a member of.
 */
async function broadcastPresence(
  io: Server,
  userId: string,
  status: Status,
  customStatus?: string | null
): Promise<void> {
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId },
    select: { workspaceId: true },
  });

  const payload = { userId, status, customStatus };
  memberships.forEach((m) => {
    io.to(`workspace:${m.workspaceId}`).emit('presence:update', payload);
  });
}

/**
 * Sets a user's status in the DB and broadcasts the change.
 */
export async function setUserStatus(
  io: Server,
  userId: string,
  status: Status
): Promise<void> {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { status },
      select: { customStatus: true },
    });
    await broadcastPresence(io, userId, status, user.customStatus);
  } catch (err) {
    console.error('setUserStatus error:', err);
  }
}

export function registerPresenceHandlers(io: Server, socket: Socket): void {
  const user = socket.data.user as SocketUser;

  socket.on('set_status', async (status: Status) => {
    await setUserStatus(io, user.id, status);
  });

  socket.on('set_custom_status', async (customStatus: string) => {
    try {
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: { customStatus },
        select: { status: true, customStatus: true },
      });
      await broadcastPresence(
        io,
        user.id,
        updated.status as Status,
        updated.customStatus
      );
    } catch (err) {
      console.error('set_custom_status error:', err);
    }
  });
}
