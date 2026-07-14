import { useState, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import api from '../api/axios';
import GoogleSignInButton from '../components/ui/GoogleSignInButton';

const perks = [
  'Free forever for small teams',
  'Set up your workspace in seconds',
  'No credit card required',
];

/**
 * Rates password strength on a 0–4 scale.
 */
function scorePassword(pw: string): number {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}

const strengthLabels = ['Weak', 'Weak', 'Fair', 'Strong', 'Very strong'];
const strengthColors = ['#ef4444', '#ef4444', '#f59e0b', '#10b981', '#06b6d4'];

export default function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser, setToken } = useAuthStore();

  // If the user was redirected here from a protected page (e.g. a workspace
  // invite link), send them back there after registering.
  const redirectTo = (location.state as { from?: { pathname: string } } | null)?.from?.pathname;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => scorePassword(password), [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error('Please fill in all fields.');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      toast.error('Passwords do not match.');
      return;
    }
    if (!agree) {
      toast.error('Please accept the terms to continue.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', { name, email, password });
      if (data.token) setToken(data.token);
      setUser(data.user);
      toast.success('Account created! Welcome to NexusChat.');
      navigate(redirectTo || '/app');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left form */}
      <div className="flex w-full items-center justify-center bg-void p-6 md:w-1/2">
        <div className="glass w-full max-w-md rounded-2xl p-8 shadow-glow">
          <h2 className="mb-1 text-2xl font-bold">Create your account</h2>
          <p className="mb-6 text-sm text-text-secondary">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:underline">
              Sign in
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-text-secondary">Full name</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-3 text-text-secondary" />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Virendra Singh"
                  className="input-field pl-9"
                />
              </div>
            </div>

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

              {password && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-1 flex-1 rounded-full transition"
                        style={{
                          background:
                            i < strength ? strengthColors[strength] : 'rgba(255,255,255,0.1)',
                        }}
                      />
                    ))}
                  </div>
                  <p className="mt-1 text-xs" style={{ color: strengthColors[strength] }}>
                    {strengthLabels[strength]}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm text-text-secondary">Confirm password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-3 text-text-secondary" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-enter your password"
                  className="input-field pl-9"
                />
              </div>
            </div>

            <label className="flex items-start gap-2 text-sm text-text-secondary">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                className="mt-0.5 accent-indigo-500"
              />
              I agree to the Terms of Service and Privacy Policy.
            </label>

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
              {loading ? 'Creating account...' : 'Create Account'}
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

      {/* Right panel */}
      <div className="relative hidden w-1/2 flex-col justify-center overflow-hidden bg-bg-dark p-12 md:flex">
        <div className="absolute -right-20 top-1/3 h-72 w-72 rounded-full bg-violet-600/30 blur-3xl" />
        <div className="absolute bottom-1/4 left-0 h-72 w-72 rounded-full bg-cyan-600/20 blur-3xl" />

        <div className="relative z-10">
          <div className="mb-8 flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-brand text-2xl font-black text-white shadow-glow">
              N
            </span>
            <span className="text-2xl font-bold">NexusChat</span>
          </div>

          <h1 className="text-4xl font-black text-gradient">Join your team</h1>
          <p className="mt-3 max-w-sm text-text-secondary">
            Create an account and bring your team together in one beautiful workspace.
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
    </div>
  );
}
