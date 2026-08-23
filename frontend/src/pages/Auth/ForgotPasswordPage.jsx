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
      await forgotPassword({ email: email.trim().toLowerCase() });
      setMessage('Password reset instructions have been sent to your email.');
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || 'Failed to send reset link. Please try again.');
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
              <div className="auth-alert-error" role="alert">
                <span className="auth-alert-icon">⚠️</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {message ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-sm mb-6">
                <p className="font-bold text-base mb-1">✉️ Email Sent!</p>
                {message}
                <div className="mt-4">
                  <Link to="/login" className="auth-primary-btn" style={{ textDecoration: 'none' }}>
                    Return to Login
                  </Link>
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

