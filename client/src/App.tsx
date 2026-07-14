import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useSocket } from './hooks/useSocket';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import WorkspacePage from './pages/WorkspacePage';
import ChannelPage from './pages/ChannelPage';
import DMPage from './pages/DMPage';
import ProfilePage from './pages/ProfilePage';
import JoinWorkspacePage from './pages/JoinWorkspacePage';
import AppLayout from './components/layout/AppLayout';
import Loader from './components/ui/Loader';
import VideoCall from './components/video/VideoCall';

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-void">
        <Loader label="Loading NexusChat..." />
      </div>
    );
  }
  // Preserve the page the user was trying to reach (e.g. a workspace invite
  // link) so Login/Register can send them back here after authenticating.
  return isAuthenticated ? (
    children
  ) : (
    <Navigate to="/login" replace state={{ from: location }} />
  );
}

export default function App() {
  const { checkAuth, isAuthenticated } = useAuthStore();
  const location = useLocation();

  // Establish the global socket connection when authenticated.
  useSocket();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Standalone (scrollable) pages toggle body overflow.
  useEffect(() => {
    const standalonePaths = ['/', '/login', '/register', '/forgot-password', '/reset-password'];
    const standalone =
      standalonePaths.includes(location.pathname) || location.pathname.endsWith('/join');
    document.body.classList.toggle('scrollable', standalone);
  }, [location.pathname]);

  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/app" replace /> : <LoginPage />}
        />
        <Route
          path="/register"
          element={isAuthenticated ? <Navigate to="/app" replace /> : <RegisterPage />}
        />
        <Route
          path="/forgot-password"
          element={isAuthenticated ? <Navigate to="/app" replace /> : <ForgotPasswordPage />}
        />
        <Route
          path="/reset-password"
          element={isAuthenticated ? <Navigate to="/app" replace /> : <ResetPasswordPage />}
        />

        <Route
          path="/workspace/:workspaceId/join"
          element={
            <ProtectedRoute>
              <JoinWorkspacePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<WorkspacePage />} />
          <Route path="workspace/:workspaceId" element={<WorkspacePage />} />
          <Route
            path="workspace/:workspaceId/channel/:channelId"
            element={<ChannelPage />}
          />
          <Route path="dm/:dmId" element={<DMPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Global video-call overlay (incoming + active calls) */}
      {isAuthenticated && <VideoCall />}
    </>
  );
}
