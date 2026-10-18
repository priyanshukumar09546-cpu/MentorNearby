import React, { useState, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
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

const CheckIcon = () => (
  <svg className="w-4 h-4 text-emerald-600 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

const BulletIcon = () => (
  <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-300 mr-2 align-middle"></span>
);

const ResetPasswordPage = () => {
  const { token: routeToken } = useParams();
  const [searchParams] = useSearchParams();
  const token = routeToken || searchParams.get('token') || searchParams.get('access_token') || '';
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Password rules validation
  const rules = useMemo(() => {
    return {
      minLength: password.length >= 8,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      passwordsMatch: password && confirmPassword && password === confirmPassword,
    };
  }, [password, confirmPassword]);

  const isValidPassword = rules.minLength && rules.hasUpper && rules.hasLower && rules.hasNumber;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      setErrorMsg('Password reset token is missing. Please request a new password reset link.');
      return;
    }

    if (!isValidPassword) {
      setErrorMsg('Please ensure your password meets all complexity requirements below.');
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
      setErrorMsg(
        err?.response?.data?.message ||
          'Failed to reset password. The reset link may have expired or was already used.'
      );
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
                <span>Single-Use Secure Recovery</span>
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
              <div className="auth-alert-error" role="alert" style={{ marginBottom: '16px' }}>
                <span className="auth-alert-icon">⚠️</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-sm mb-6">
                <p className="font-bold text-base mb-1">🎉 Success!</p>
                <p>{successMsg}</p>
                <div className="mt-3">
                  <Link to="/login" className="text-xs font-bold text-emerald-700 underline">
                    Click here if you are not redirected automatically
                  </Link>
                </div>
              </div>
            )}

            {!token ? (
              <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-950 text-sm mb-6 text-left">
                <div className="font-bold text-base text-amber-900 mb-2 flex items-center gap-2">
                  <span>⚠️</span> <span>Missing Reset Link</span>
                </div>
                <p className="leading-relaxed mb-4 text-amber-800">
                  No password reset token was detected in your URL. Please make sure you clicked the full link sent to your email.
                </p>
                <Link
                  to="/forgot-password"
                  className="auth-primary-btn text-center block"
                  style={{ textDecoration: 'none' }}
                >
                  Request New Password Reset Link →
                </Link>
              </div>
            ) : (
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

                {/* Password Criteria Checklist */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-600 mb-4 space-y-1.5">
                  <div className="font-semibold text-slate-700 mb-1">Password must include:</div>
                  <div className={rules.minLength ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                    {rules.minLength ? <CheckIcon /> : <BulletIcon />} Minimum 8 characters
                  </div>
                  <div className={rules.hasUpper ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                    {rules.hasUpper ? <CheckIcon /> : <BulletIcon />} At least one uppercase letter (A-Z)
                  </div>
                  <div className={rules.hasLower ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                    {rules.hasLower ? <CheckIcon /> : <BulletIcon />} At least one lowercase letter (a-z)
                  </div>
                  <div className={rules.hasNumber ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                    {rules.hasNumber ? <CheckIcon /> : <BulletIcon />} At least one number (0-9)
                  </div>
                  {confirmPassword && (
                    <div className={rules.passwordsMatch ? 'text-emerald-700 font-medium' : 'text-rose-600'}>
                      {rules.passwordsMatch ? <CheckIcon /> : <BulletIcon />} Passwords match
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="auth-primary-btn"
                  disabled={loading || !isValidPassword || password !== confirmPassword}
                >
                  {loading ? 'Updating password...' : 'Update Password →'}
                </button>
              </form>
            )}

            <div className="auth-footer-nav" style={{ marginTop: '28px' }}>
              <span>Remembered your password?</span>
              <Link to="/login" className="auth-nav-link">Sign In</Link>
            </div>

            <div className="auth-security-pill">
              <span className="auth-security-icon">🛡️</span>
              <span>Your account security is protected with end-to-end encryption.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
