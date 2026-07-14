import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, ArrowLeft, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      toast.error('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      toast.success('Password reset! You can now sign in.');
      navigate('/login');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // No token present in the URL at all — nothing to do here.
  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-void p-6">
        <div className="glass w-full max-w-md rounded-2xl p-8 text-center shadow-glow">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/15 text-red-400">
            <XCircle size={28} />
          </div>
          <h2 className="mb-2 text-xl font-bold text-text-primary">Invalid reset link</h2>
          <p className="mb-6 text-sm text-text-secondary">
            This password reset link is missing or malformed. Please request a new one.
          </p>
          <Link to="/forgot-password" className="btn-primary inline-flex px-6 py-2.5">
            Request new link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-void p-6">
      <div className="glass w-full max-w-md rounded-2xl p-8 shadow-glow">
        <Link
          to="/login"
          className="mb-6 inline-flex items-center gap-1 text-sm text-text-secondary hover:text-white"
        >
          <ArrowLeft size={16} /> Back to sign in
        </Link>

        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-brand text-lg font-black text-white shadow-glow">
            N
          </span>
          <span className="text-xl font-bold">NexusChat</span>
        </div>

        <h2 className="mb-1 text-2xl font-bold">Set a new password</h2>
        <p className="mb-6 text-sm text-text-secondary">
          Choose a strong password you haven't used before.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-text-secondary">New password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-3 text-text-secondary" />
              <input
                type={showPassword ? 'text' : 'password'}
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="input-field px-9"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-3 text-text-secondary hover:text-white"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-text-secondary">Confirm password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-3 text-text-secondary" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter your new password"
                className="input-field pl-9"
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
            {loading ? 'Resetting...' : 'Reset password'}
          </button>
        </form>
      </div>
    </div>
  );
}
