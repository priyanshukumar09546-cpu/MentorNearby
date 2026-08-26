import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { extractUserRole } from '../components/common/ProtectedRoute';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { checkAuth } = useAuth();

  useEffect(() => {
    const processCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const urlToken = params.get('token');
        const urlRole = params.get('role');

        if (urlToken) {
          localStorage.setItem('token', urlToken);
          localStorage.setItem('mn_token', urlToken);
        }

        console.log('[AUTH CALLBACK] Verifying session via checkAuth()...');
        const verifiedUser = await checkAuth();
        const role = extractUserRole(verifiedUser) || (urlRole || '').toLowerCase();
        
        let targetDashboard = '/student-dashboard';
        if (role === 'tutor') {
          targetDashboard = '/tutor-dashboard';
        } else if (role === 'admin') {
          targetDashboard = '/admin/dashboard';
        }
        
        console.log('[AUTH CALLBACK SUCCESS] Redirecting to:', targetDashboard);
        window.location.href = targetDashboard;
      } catch (err) {
        console.error('[AUTH CALLBACK ERROR]:', err);
        navigate('/login?error=' + encodeURIComponent('Authentication failed. Please sign in again.'), { replace: true });
      }
    };
    processCallback();
  }, [checkAuth, navigate]);

  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F8FAFC',
        color: '#0F172A',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔄</div>
      <div style={{ fontSize: '18px', fontWeight: 700 }}>Authenticating session...</div>
      <div style={{ fontSize: '13px', color: '#64748B', marginTop: '6px' }}>Please wait while we log you in.</div>
    </div>
  );
};

export default AuthCallback;
