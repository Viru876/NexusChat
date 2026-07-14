import { useEffect } from 'react';
import { getSocket } from './useSocket';
import { useAuthStore } from '../store/authStore';
import type { UserStatus } from '../types';

const IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes of inactivity => AWAY

/**
 * Tracks user activity and reports presence changes to the server.
 * Automatically flips the user to AWAY after inactivity and back to ONLINE
 * on the next interaction.
 */
export function usePresence() {
  const { updateUser, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) return;

    let idleTimer: ReturnType<typeof setTimeout>;
    let currentStatus: UserStatus = 'ONLINE';

    const setStatus = (status: UserStatus) => {
      if (status === currentStatus) return;
      currentStatus = status;
      const socket = getSocket();
      socket?.emit('set_status', status);
      updateUser({ status });
    };

    const resetIdle = () => {
      setStatus('ONLINE');
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => setStatus('AWAY'), IDLE_TIMEOUT);
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, resetIdle, { passive: true }));
    resetIdle();

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        setStatus('AWAY');
      } else {
        resetIdle();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearTimeout(idleTimer);
      events.forEach((e) => window.removeEventListener(e, resetIdle));
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [isAuthenticated, updateUser]);

  const setStatus = (status: UserStatus) => {
    getSocket()?.emit('set_status', status);
    updateUser({ status });
  };

  const setCustomStatus = (customStatus: string) => {
    getSocket()?.emit('set_custom_status', customStatus);
    updateUser({ customStatus });
  };

  return { setStatus, setCustomStatus };
}
