import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

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

        {sent ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
              <CheckCircle2 size={28} />
            </div>
            <h2 className="mb-2 text-xl font-bold text-text-primary">Check your email</h2>
            <p className="text-sm text-text-secondary">
              If an account exists for <span className="text-text-primary">{email}</span>,
              we've sent a link to reset your password. It expires in 30 minutes.
            </p>
            <button
              onClick={() => setSent(false)}
              className="mt-6 text-sm text-indigo-400 hover:underline"
            >
              Didn't get it? Try again
            </button>
          </div>
        ) : (
          <>
            <h2 className="mb-1 text-2xl font-bold">Forgot your password?</h2>
            <p className="mb-6 text-sm text-text-secondary">
              Enter the email associated with your account and we'll send you a link to reset
              your password.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-text-secondary">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-3 text-text-secondary" />
                  <input
                    type="email"
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input-field pl-9"
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
