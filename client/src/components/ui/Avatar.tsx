import type { User, UserStatus } from '../../types';

interface AvatarProps {
  user: Pick<User, 'name' | 'avatar' | 'status'>;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showStatus?: boolean;
}

const sizeMap: Record<NonNullable<AvatarProps['size']>, number> = {
  sm: 24,
  md: 36,
  lg: 44,
  xl: 80,
};

const statusColor: Record<UserStatus, string> = {
  ONLINE: '#10b981',
  AWAY: '#f59e0b',
  DND: '#ef4444',
  OFFLINE: '#64748b',
};

/**
 * Returns up to two uppercase initials from a name.
 */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Avatar({ user, size = 'md', showStatus = false }: AvatarProps) {
  const px = sizeMap[size];
  const dotSize = Math.max(8, Math.round(px * 0.28));

  return (
    <div className="relative inline-block" style={{ width: px, height: px }}>
      {user.avatar ? (
        <img
          src={user.avatar}
          alt={user.name}
          className="rounded-full object-cover"
          style={{ width: px, height: px }}
        />
      ) : (
        <div
          className="flex items-center justify-center rounded-full font-semibold text-white"
          style={{
            width: px,
            height: px,
            fontSize: px * 0.4,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          }}
        >
          {initials(user.name)}
        </div>
      )}

      {showStatus && (
        <span
          className="absolute rounded-full border-2"
          style={{
            width: dotSize,
            height: dotSize,
            bottom: 0,
            right: 0,
            background: statusColor[user.status] || statusColor.OFFLINE,
            borderColor: '#0a0a12',
          }}
          title={user.status}
        />
      )}
    </div>
  );
}
