import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../../api/auth';
import './LoginPage.css';

const EmailIcon = () => (
  <svg className="auth-field-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setMessage('');

    try {
      const res = await forgotPassword({ email: email.trim().toLowerCase() });
      setMessage(
        res?.data?.message ||
        `If ${email.trim()} is registered with MentorNearby, a secure password reset link has been dispatched. Please check your Inbox and Spam/Junk folders.`
      );
    } catch (err) {
      console.error('Password reset request failed:', err);
      setErrorMsg(
        err?.response?.data?.message ||
        'Unable to send reset email at this moment. Please check your internet connection or try again shortly.'
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
              Account<br />
              <span className="auth-highlight-gold">Recovery</span>
            </h2>
            <p className="auth-panel-desc">
              Don't worry, we'll help you securely reset your password and get back to your learning journey.
            </p>

            <div className="auth-trust-list">
              <div className="auth-trust-item">
                <span className="auth-trust-icon-box bg-blue-500/20 text-blue-400">🔒</span>
                <span>Encrypted Password Reset</span>
              </div>
              <div className="auth-trust-item">
                <span className="auth-trust-icon-box bg-emerald-500/20 text-emerald-400">🛡️</span>
                <span>Protected User Identity</span>
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
              <h1 className="auth-form-title">Reset Password 🔑</h1>
              <p className="auth-form-subtitle">Enter your registered email address to receive reset instructions</p>
            </div>

            {errorMsg && (
              <div className="auth-alert-error mb-4" role="alert">
                <span className="auth-alert-icon">⚠️</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {message ? (
              <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-950 text-sm mb-6 text-left shadow-sm">
                <div className="flex items-center gap-2 font-bold text-base text-emerald-900 mb-2">
                  <span className="text-xl">✉️</span> <span>Check Your Inbox!</span>
                </div>
                <p className="leading-relaxed mb-3 text-emerald-800">
                  {message}
                </p>
                <div className="bg-white/80 border border-emerald-200/80 rounded-xl p-3 text-xs text-slate-600 mb-4 space-y-1">
                  <div>⏰ <strong>Link Expiry:</strong> Valid for 10 minutes.</div>
                  <div>📁 <strong>Can't find it?</strong> Check your <em>Spam / Junk</em> and <em>Promotions</em> tabs.</div>
                </div>
                <div className="flex flex-col gap-2">
                  <Link to="/login" className="auth-primary-btn text-center" style={{ textDecoration: 'none' }}>
                    Return to Login
                  </Link>
                  <button
                    type="button"
                    onClick={() => { setMessage(''); setEmail(''); }}
                    className="text-xs text-slate-500 hover:text-slate-800 bg-transparent border-none cursor-pointer py-1 text-center font-semibold"
                  >
                    Try a different email address
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="auth-form-body">
                <div className="auth-input-group">
                  <label className="auth-input-label" htmlFor="forgot-email">Registered Email Address</label>
                  <div className="auth-input-box">
                    <EmailIcon />
                    <input
                      id="forgot-email"
                      type="email"
                      className="auth-input-element"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoFocus
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="auth-primary-btn"
                  disabled={loading}
                >
                  {loading ? 'Sending link...' : 'Send Reset Link →'}
                </button>
              </form>
            )}

            <div className="auth-footer-nav" style={{ marginTop: '28px' }}>
              <span>Remember your password?</span>
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

export default ForgotPasswordPage;

