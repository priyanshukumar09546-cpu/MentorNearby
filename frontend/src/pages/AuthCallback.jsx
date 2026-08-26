import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { extractUserRole, getRoleDashboard } from '../components/common/ProtectedRoute';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { checkAuth } = useAuth();

  useEffect(() => {
    const processCallback = async () => {
      try {
        const verifiedUser = await checkAuth();
        const role = extractUserRole(verifiedUser);
        const targetDashboard = getRoleDashboard(role);
        navigate(targetDashboard, { replace: true });
      } catch (_) {
        navigate('/login', { replace: true });
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
      <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔄</div>
      <div style={{ fontSize: '18px', fontWeight: 700 }}>Authenticating session...</div>
    </div>
  );
};

export default AuthCallback;
