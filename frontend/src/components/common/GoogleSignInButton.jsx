import React, { useState } from 'react';
import client from '../../api/client';

const GoogleSignInButton = ({ defaultRole = 'STUDENT', buttonText = 'Continue with Google' }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleClick = async () => {
    setError('');
    setLoading(true);

    try {
      const res = await client.get(`/auth/google/url?role=${encodeURIComponent(defaultRole)}`);
      if (res.data.data?.url) {
        window.location.href = res.data.data.url;
      } else {
        throw new Error('Could not retrieve Google OAuth authorization URL');
      }
    } catch (err) {
      setLoading(false);
      setError(
        err.response?.data?.message ||
        'Google sign-in requires GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET in .env. Please configure Google Cloud OAuth.'
      );
    }
  };

  return (
    <div className="w-full my-3">
      <button
        type="button"
        onClick={handleGoogleClick}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg font-semibold hover:bg-gray-50 transition shadow-sm disabled:opacity-50"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" style={{ width: '20px', height: '20px', minWidth: '20px', minHeight: '20px', flexShrink: 0, display: 'inline-block' }}>
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>{loading ? 'Connecting with Google...' : buttonText}</span>
      </button>

      {error && (
        <p className="text-xs text-red-600 mt-1 font-semibold text-center">{error}</p>
      )}
    </div>
  );
};

export default GoogleSignInButton;
