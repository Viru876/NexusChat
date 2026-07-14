import { useGoogleLogin, TokenResponse } from '@react-oauth/google';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/axios';

interface GoogleSignInButtonProps {
  disabled?: boolean;
}

/**
 * Renders Google's official "Sign in with Google" button when a client ID
 * is configured, verifying the returned ID token with our backend. Falls
 * back to a disabled-looking placeholder button (with an explanatory toast)
 * when Google sign-in has not been set up for this deployment.
 */
export default function GoogleSignInButton({ disabled }: GoogleSignInButtonProps) {
  const navigate = useNavigate();
  const { setUser, setToken } = useAuthStore();
  const configured = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      toast.error('Google sign-in did not return a credential.');
      return;
    }
    try {
      const { data } = await api.post('/auth/google', {
        credential: credentialResponse.credential,
      });
      if (data.token) setToken(data.token);
      setUser(data.user);
      toast.success(`Welcome, ${data.user.name}!`);
      navigate('/app');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  if (!configured) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => toast('Google sign-in is not configured for this deployment.')}
        className="btn-ghost w-full py-2.5"
      >
        <span className="font-bold text-white">G</span> Continue with Google
      </button>
    );
  }

  return (
    <div className="flex w-full justify-center [&>div]:w-full">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => toast.error('Google sign-in failed. Please try again.')}
        theme="filled_black"
        shape="pill"
        width="100%"
        text="continue_with"
      />
    </div>
  );
}

// Re-exported so consumers can use the imperative hook variant if ever needed.
export { useGoogleLogin };
export type { TokenResponse };
