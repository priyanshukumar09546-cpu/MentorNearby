import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { resetPassword } from '../../api/auth';
import './LoginPage.css';

const LockIcon = () => (
  <svg className="auth-field-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" /><circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" /><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" /><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" /><path d="m2 2 20 20" />
  </svg>
);

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      await resetPassword({ token, password });
      setSuccessMsg('Your password has been reset successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-split-card">
        
        {/* LEFT PANEL */}
        <div className="auth-left-panel">
          <div className="auth-panel-glow"></div>
          <div className="auth-panel-dots"></div>

          <div className="auth-brand-header">
            <Link to="/" className="auth-logo-link">
              <img src="/logo.png" alt="MentorNearby Logo" className="auth-brand-logo-img" />
            </Link>
          </div>

          <div className="auth-left-content">
            <h2 className="auth-panel-title">
              New Password<br />
              <span className="auth-highlight-gold">Setup</span>
            </h2>
            <p className="auth-panel-desc">
              Create a strong and secure password to protect your account and personal study records.
            </p>

            <div className="auth-trust-list">
              <div className="auth-trust-item">
                <span className="auth-trust-icon-box bg-blue-500/20 text-blue-400">🔒</span>
                <span>256-bit Encrypted Password</span>
              </div>
              <div className="auth-trust-item">
                <span className="auth-trust-icon-box bg-emerald-500/20 text-emerald-400">🛡️</span>
                <span>Secure Session Handling</span>
              </div>
            </div>
          </div>

          <div className="auth-illustration-wrap">
            <img src="/hero-illustration.png" alt="Students studying" className="auth-panel-illustration" />
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="auth-right-panel">
          <div className="auth-form-container">
            
            <div className="auth-form-header">
              <h1 className="auth-form-title">Set New Password ✨</h1>
              <p className="auth-form-subtitle">Choose a new password for your MentorNearby account</p>
            </div>

            {errorMsg && (
              <div className="auth-alert-error" role="alert">
                <span className="auth-alert-icon">⚠️</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-sm mb-6">
                <p className="font-bold text-base mb-1">🎉 Success!</p>
                {successMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="auth-form-body">
              <div className="auth-input-group">
                <label className="auth-input-label" htmlFor="new-password">New Password</label>
                <div className="auth-input-box">
                  <LockIcon />
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    className="auth-input-element"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoFocus
                    required
                  />
                  <button
                    type="button"
                    className="auth-toggle-pw-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              <div className="auth-input-group">
                <label className="auth-input-label" htmlFor="confirm-new-password">Confirm New Password</label>
                <div className="auth-input-box">
                  <LockIcon />
                  <input
                    id="confirm-new-password"
                    type={showPassword ? 'text' : 'password'}
                    className="auth-input-element"
                    placeholder="Re-enter your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="auth-primary-btn"
                disabled={loading}
              >
                {loading ? 'Updating password...' : 'Update Password →'}
              </button>
            </form>

            <div className="auth-footer-nav" style={{ marginTop: '28px' }}>
              <span>Remembered your password?</span>
              <Link to="/login" className="auth-nav-link">Sign In</Link>
            </div>

            <div className="auth-security-pill">
              <span className="auth-security-icon">🛡️</span>
              <span>Your data is protected and never shared with anyone.</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default ResetPasswordPage;

