import React, { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const { user, authLoading, signInWithGoogle } = useAuth();
  const location = useLocation();
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectTo = (location.state as { from?: string } | null)?.from || '/account';

  if (!authLoading && user) {
    return <Navigate to={redirectTo} replace />;
  }

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Google Sign-In was cancelled or blocked. Please allow popups and try again.'
      );
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 sm:py-24">
      <div className="bg-white border border-[#E8ECE8] rounded-3xl p-8 space-y-6 text-center">
        <div>
          <p className="font-display text-xs font-semibold text-[#26734D]">GIFTLY Account</p>
          <h1 className="font-display text-2xl font-extrabold text-[#202A27] mt-1">
            Sign in to your account
          </h1>
          <p className="text-sm text-[#777F7B] mt-2 leading-relaxed">
            Sync your shopping bag and wishlist across devices, manage saved addresses, and track
            every order.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 text-left">
            {error}
          </div>
        )}

        <button
          type="button"
          disabled={signingIn}
          onClick={() => void handleGoogleSignIn()}
          className="w-full inline-flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl bg-[#26734D] text-white text-sm font-semibold hover:bg-[#1E5C3D] disabled:opacity-60 transition-colors cursor-pointer"
        >
          {signingIn ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M21.35 11.1h-9.18v2.92h5.27c-.23 1.48-1.72 4.34-5.27 4.34-3.17 0-5.76-2.63-5.76-5.86s2.59-5.86 5.76-5.86c1.81 0 3.02.77 3.71 1.43l2.53-2.44C16.79 4.1 14.69 3.2 12.17 3.2 7.21 3.2 3.2 7.21 3.2 12.17s4.01 8.97 8.97 8.97c5.18 0 8.61-3.64 8.61-8.77 0-.59-.06-1.04-.14-1.27z"
              />
            </svg>
          )}
          {signingIn ? 'Signing in...' : 'Continue with Google'}
        </button>

        <div className="pt-4 border-t border-[#E8ECE8] space-y-2 text-xs text-[#777F7B]">
          <p className="flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#26734D]" />
            Secured by Firebase Authentication
          </p>
          <p>
            Just browsing?{' '}
            <Link to="/shop" className="text-[#26734D] font-semibold hover:underline">
              Continue as guest
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
