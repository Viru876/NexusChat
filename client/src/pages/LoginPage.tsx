import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import api from '../api/axios';
import GoogleSignInButton from '../components/ui/GoogleSignInButton';

const perks = [
  'Real-time messaging & video calls',
  'Kanban task management built in',
  'Beautiful, secure, and lightning fast',
];

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser, setToken } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  // If the user was redirected here from a protected page (e.g. a workspace
  // invite link), send them back there after signing in.
  const redirectTo = (location.state as { from?: { pathname: string } } | null)?.from?.pathname;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      if (data.token) setToken(data.token);
      setUser(data.user);
      toast.success(`Welcome back, ${data.user.name}!`);
      navigate(redirectTo || '/app');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left */}
      <div className="relative hidden w-1/2 flex-col justify-center overflow-hidden bg-bg-dark p-12 md:flex">
        <div className="absolute -left-20 top-1/4 h-72 w-72 rounded-full bg-indigo-600/30 blur-3xl" />
        <div className="absolute bottom-1/4 right-0 h-72 w-72 rounded-full bg-violet-600/20 blur-3xl" />

        <div className="relative z-10">
          <div className="mb-8 flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-brand text-2xl font-black text-white shadow-glow">
              N
            </span>
            <span className="text-2xl font-bold">NexusChat</span>
          </div>

          <h1 className="text-4xl font-black text-gradient">Welcome back</h1>
          <p className="mt-3 max-w-sm text-text-secondary">
            Sign in to continue collaborating with your team.
          </p>

          <ul className="mt-10 space-y-3">
            {perks.map((p) => (
              <li key={p} className="flex items-center gap-3 text-text-secondary">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400">
                  <Check size={14} />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right */}
      <div className="flex w-full items-center justify-center bg-void p-6 md:w-1/2">
        <div className="glass w-full max-w-md rounded-2xl p-8 shadow-glow">
          <h2 className="mb-1 text-2xl font-bold">Sign in to NexusChat</h2>
          <p className="mb-6 text-sm text-text-secondary">
            New here?{' '}
            <Link to="/register" className="text-indigo-400 hover:underline">
              Create an account
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-text-secondary">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-3 text-text-secondary" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-field pl-9"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm text-text-secondary">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-3 text-text-secondary" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
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

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-text-secondary">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="accent-indigo-500"
                />
                Remember me
              </label>
              <Link to="/forgot-password" className="text-sm text-indigo-400 hover:underline">
                Forgot password?
              </Link>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-text-secondary">or continue with</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <GoogleSignInButton />
        </div>
      </div>
    </div>
  );
}
