import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const role = params.get('role');

    if (token) {
      localStorage.setItem('token', token);
      localStorage.setItem('mn_token', token);
      if (role) {
        localStorage.setItem('role', role);
      }

      const normalizedRole = (role || '').toLowerCase();
      if (normalizedRole === 'mentor' || normalizedRole === 'tutor') {
        navigate('/mentor/dashboard');
      } else if (normalizedRole === 'admin') {
        navigate('/admin');
      } else {
        navigate('/student/dashboard');
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-bg, #FAF8F5)',
      color: 'var(--color-text-primary, #18181B)',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{
        fontSize: '28px',
        marginBottom: '12px'
      }}>
        🔄
      </div>
      <div style={{ fontSize: '18px', fontWeight: 700 }}>
        Logging you in...
      </div>
    </div>
  );
};

export default AuthCallback;
