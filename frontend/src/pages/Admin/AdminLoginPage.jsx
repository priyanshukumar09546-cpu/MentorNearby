// ============================================================
// pages/Admin/AdminLoginPage.jsx
// MentorNearby Admin Login Interface — Production Ready
// Exact Match to Reference Design media_1787473009931.png
// ============================================================

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import './AdminLogin.css';

const AdminLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const navigate = useNavigate();
  const { user, isAuthenticated, refreshUser } = useAuth();
  const { showToast } = useToast();

  // If already logged in as ADMIN, redirect straight to /admin/dashboard
  useEffect(() => {
    const userRole = (user?.role || user?.user?.role || '').toString().trim().toUpperCase();
    if (isAuthenticated && userRole === 'ADMIN') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setErrorMsg('');

    try {
      console.log('[AdminLogin] Submitting admin credentials:', { email: email.trim() });
      let response;
      try {
        response = await client.post('/auth/admin/login', {
          email: email.trim(),
          password,
        });
      } catch (firstErr) {
        if (firstErr.response?.status === 404) {
          response = await client.post('/admin/login', {
            email: email.trim(),
            password,
          });
        } else {
          throw firstErr;
        }
      }

      console.log('[AdminLogin] Response received:', response.status, response.data);

      if (response.data.success) {
        const token = response.data.token || response.data.data?.token;
        const userObj = response.data.user || response.data.data?.user;

        if (token) {
          try {
            localStorage.setItem('token', token);
            localStorage.setItem('mn_token', token);
          } catch (_) {}
        }
        if (userObj) {
          try {
            localStorage.setItem('user', JSON.stringify(userObj));
            localStorage.setItem('role', 'admin');
            localStorage.setItem('mn_role', 'ADMIN');
          } catch (_) {}
        }

        await refreshUser();
        showToast('Admin authenticated successfully', 'success');
        navigate('/admin/dashboard', { replace: true });
        
        // Safety timeout fallback to ensure page transitions cleanly
        setTimeout(() => {
          if (window.location.pathname === '/admin' || window.location.pathname === '/admin/login') {
            window.location.replace('/admin/dashboard');
          }
        }, 300);
      }
    } catch (err) {
      console.error('[AdminLogin Error]:', err.response?.status, err.response?.data || err.message);
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Invalid admin credentials. Access restricted.';
      setErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    showToast('Direct admin credentials required for console access', 'info');
  };

  return (
    <div className="mn-admin-split-root">
      
      {/* ---------------------------------------------------------- */}
      {/* LEFT SIDE: Brand Showcase & Administrator Dashboard Illus   */}
      {/* ---------------------------------------------------------- */}
      <div className="mn-admin-left-side">
        
        {/* Decorative Grid Matrix & Circles */}
        <div className="mn-admin-decor-matrix" aria-hidden="true">
          <div className="mn-matrix-dot"></div>
          <div className="mn-matrix-dot"></div>
          <div className="mn-matrix-dot"></div>
          <div className="mn-matrix-dot"></div>
          <div className="mn-matrix-dot"></div>
          <div className="mn-matrix-dot"></div>
          <div className="mn-matrix-dot"></div>
          <div className="mn-matrix-dot"></div>
          <div className="mn-matrix-dot"></div>
        </div>
        <div className="mn-admin-glow-circle" aria-hidden="true"></div>

        {/* Brand Header */}
        <div className="mn-admin-brand-header">
          <div className="mn-admin-logo-wrapper">
            {/* MentorNearby Graduate & Open Book Logo */}
            <svg className="mn-admin-logo-svg" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="64" height="64" rx="16" fill="url(#mnLogoGrad)" />
              {/* Graduation Cap */}
              <path d="M32 14L48 22L32 30L16 22L32 14Z" fill="#FFFFFF" />
              <path d="M23 27.5V36C23 40 32 43 32 43C32 43 41 40 41 36V27.5" fill="#FFFFFF" opacity="0.9" />
              <path d="M43 24.5V36" stroke="#FEF08A" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="43" cy="37.5" r="2.5" fill="#FEF08A" />
              {/* Open Book */}
              <path d="M18 40C24 38 31 39 32 44C33 39 40 38 46 40V51C40 49 33 50 32 54C31 50 24 49 18 51V40Z" fill="#FFFFFF" />
              <defs>
                <linearGradient id="mnLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FF6B00" />
                  <stop offset="100%" stopColor="#EA580C" />
                </linearGradient>
              </defs>
            </svg>

            <div className="mn-admin-brand-text-col">
              <h1 className="mn-admin-brand-title">
                <span className="mn-brand-mentor">Mentor</span>
                <span className="mn-brand-nearby">Nearby</span>
              </h1>
              <p className="mn-admin-brand-subtitle">Admin Control Center</p>
            </div>
          </div>

          <p className="mn-admin-brand-tagline">
            Manage. Verify. Monitor. Grow MentorNearby.
          </p>
        </div>

        {/* Administrator Analytics Desk Vector Illustration */}
        <div className="mn-admin-illus-container">
          <svg className="mn-admin-desk-svg" viewBox="0 0 600 420" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Subtle City/Building Silhouette in Background */}
            <g opacity="0.12" fill="#EA580C">
              <rect x="40" y="160" width="30" height="120" rx="3" />
              <rect x="80" y="120" width="40" height="160" rx="4" />
              <polygon points="100,80 80,120 120,120" />
              <rect x="130" y="180" width="25" height="100" rx="2" />
              <rect x="360" y="140" width="45" height="140" rx="4" />
              <rect x="420" y="110" width="35" height="170" rx="3" />
              <polygon points="437,70 420,110 455,110" />
              <rect x="470" y="160" width="40" height="120" rx="3" />
            </g>

            {/* Modern Desk Surface */}
            <rect x="20" y="270" width="560" height="18" rx="5" fill="#1E293B" />
            <rect x="40" y="288" width="520" height="90" fill="#0F172A" />

            {/* Potted Plant on Left */}
            <g transform="translate(60, 210)">
              <path d="M12 40L6 60H34L28 40H12Z" fill="#EA580C" />
              {/* Leaves */}
              <path d="M20 40C10 25 5 10 20 0C35 10 30 25 20 40Z" fill="#10B981" />
              <path d="M15 35C0 25 -5 15 5 5C18 12 18 25 15 35Z" fill="#059669" />
              <path d="M25 35C40 25 45 15 35 5C22 12 22 25 25 35Z" fill="#34D399" />
            </g>

            {/* MentorNearby Coffee Mug on Right */}
            <g transform="translate(455, 240)">
              <rect x="0" y="0" width="32" height="32" rx="4" fill="#0F172A" stroke="#334155" strokeWidth="1.5" />
              <path d="M32 6C38 6 38 24 32 24" stroke="#334155" strokeWidth="3" strokeLinecap="round" fill="none" />
              {/* Mug Logo Accent */}
              <circle cx="16" cy="16" r="6" fill="#FF6B00" />
              <path d="M13 16L19 16" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
            </g>

            {/* Big Desktop Monitor */}
            <g transform="translate(130, 80)">
              {/* Monitor Stand */}
              <rect x="140" y="180" width="20" height="35" rx="3" fill="#334155" />
              <rect x="110" y="210" width="80" height="8" rx="4" fill="#1E293B" />
              
              {/* Screen Bezel */}
              <rect x="0" y="0" width="300" height="185" rx="10" fill="#1E293B" stroke="#475569" strokeWidth="3" />
              
              {/* Dashboard Content */}
              <rect x="6" y="6" width="288" height="173" rx="7" fill="#F8FAFC" />
              
              {/* Dashboard Header Bar */}
              <rect x="6" y="6" width="288" height="24" fill="#FFFFFF" />
              <circle cx="20" cy="18" r="4" fill="#FF6B00" />
              <rect x="30" y="15" width="40" height="6" rx="3" fill="#0F172A" />
              <circle cx="270" cy="18" r="4" fill="#CBD5E1" />

              {/* Sidebar in Dashboard */}
              <rect x="6" y="30" width="40" height="149" fill="#FFFFFF" stroke="#F1F5F9" strokeWidth="1" />
              <circle cx="26" cy="46" r="4" fill="#FF6B00" />
              <rect x="16" y="60" width="20" height="4" rx="2" fill="#E2E8F0" />
              <rect x="16" y="74" width="20" height="4" rx="2" fill="#E2E8F0" />
              <rect x="16" y="88" width="20" height="4" rx="2" fill="#E2E8F0" />

              {/* KPI Cards */}
              <rect x="54" y="38" width="65" height="32" rx="4" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
              <rect x="60" y="44" width="30" height="4" rx="2" fill="#94A3B8" />
              <rect x="60" y="52" width="45" height="8" rx="2" fill="#FF6B00" />

              <rect x="125" y="38" width="65" height="32" rx="4" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
              <rect x="131" y="44" width="30" height="4" rx="2" fill="#94A3B8" />
              <rect x="131" y="52" width="45" height="8" rx="2" fill="#10B981" />

              <rect x="196" y="38" width="90" height="32" rx="4" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
              <rect x="202" y="44" width="40" height="4" rx="2" fill="#94A3B8" />
              <rect x="202" y="52" width="55" height="8" rx="2" fill="#6366F1" />

              {/* Analytics Wave / Line Chart */}
              <rect x="54" y="76" width="140" height="60" rx="4" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
              <path d="M60 120 Q 80 90, 100 110 T 140 85 T 185 105" fill="none" stroke="#FF6B00" strokeWidth="2.5" />
              <path d="M60 120 Q 80 90, 100 110 T 140 85 T 185 105 V 130 H 60 Z" fill="#FFEDD5" opacity="0.5" />

              {/* Donut Chart */}
              <rect x="200" y="76" width="86" height="60" rx="4" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
              <circle cx="243" cy="106" r="18" fill="none" stroke="#E2E8F0" strokeWidth="6" />
              <circle cx="243" cy="106" r="18" fill="none" stroke="#FF6B00" strokeWidth="6" strokeDasharray="65 100" />
            </g>

            {/* Administrator Sitting on Chair (View from Behind/Side) */}
            <g transform="translate(145, 170)">
              {/* Modern Office Chair Backrest */}
              <rect x="-18" y="70" width="60" height="75" rx="14" fill="#0F172A" stroke="#1E293B" strokeWidth="2" />
              
              {/* Administrator Head */}
              <circle cx="12" cy="18" r="22" fill="#0F172A" />
              <path d="M-4 22C-4 12 4 4 16 4C28 4 36 12 36 22" fill="#0F172A" />
              <circle cx="26" cy="24" r="5" fill="#FED7AA" />
              
              {/* Orange Shirt / Torso */}
              <path d="M-10 40C-10 32 0 32 12 32C24 32 34 32 34 40L42 95H-18L-10 40Z" fill="#FF6B00" />
              <path d="M10 32L12 50L14 32" fill="#EA580C" />
              
              {/* Arm reaching for Mouse */}
              <path d="M34 50L75 75L95 85" stroke="#FF6B00" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="98" cy="86" r="7" fill="#FED7AA" />
              {/* Computer Mouse */}
              <rect x="94" y="88" width="16" height="10" rx="4" fill="#1E293B" />
            </g>
          </svg>
        </div>

      </div>

      {/* ---------------------------------------------------------- */}
      {/* RIGHT SIDE: Centered Clean White Admin Login Card          */}
      {/* ---------------------------------------------------------- */}
      <div className="mn-admin-right-side">
        
        <div className="mn-admin-card-container">
          
          {/* Top Shield/Lock Badge */}
          <div className="mn-admin-shield-badge-wrap">
            <div className="mn-admin-shield-badge">
              <svg viewBox="0 0 24 24" fill="none" className="mn-shield-lock-svg">
                <path d="M12 2L3 6V11C3 16.5 6.8 21.7 12 23C17.2 21.7 21 16.5 21 11V6L12 2Z" fill="#FF6B00" />
                <rect x="9" y="11" width="6" height="5" rx="1" fill="#FFFFFF" />
                <path d="M10 11V9C10 7.9 10.9 7 12 7C13.1 7 14 7.9 14 9V11" stroke="#FFFFFF" strokeWidth="1.5" />
              </svg>
            </div>
          </div>

          {/* Card Title & Subtitle */}
          <h2 className="mn-admin-card-title">Admin Login</h2>
          <p className="mn-admin-card-sub">Welcome back! Please sign in to continue.</p>

          {/* Inline Error Message */}
          {errorMsg && (
            <div className="mn-admin-error-box" role="alert">
              <span className="mn-error-alert-icon">⚠️</span>
              <div className="mn-error-text">{errorMsg}</div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="mn-admin-form" noValidate>
            
            {/* Email Field */}
            <div className="mn-form-group">
              <label className="mn-form-label" htmlFor="admin-email">
                Email Address
              </label>
              <div className="mn-input-icon-wrap">
                <span className="mn-input-lead-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M22 6L12 13L2 6" />
                  </svg>
                </span>
                <input
                  id="admin-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your admin email"
                  className="mn-form-input"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="mn-form-group">
              <label className="mn-form-label" htmlFor="admin-password">
                Password
              </label>
              <div className="mn-input-icon-wrap">
                <span className="mn-input-lead-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="mn-form-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="mn-pwd-toggle-btn"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={0}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="mn-form-row-between">
              <label className="mn-checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="mn-checkbox-input"
                />
                <span>Remember me</span>
              </label>

              <Link to="/forgot-password" className="mn-forgot-password-link">
                Forgot Password?
              </Link>
            </div>

            {/* Full-width Orange "Sign In" Button */}
            <button
              type="submit"
              disabled={loading}
              className="mn-admin-signin-btn"
            >
              {loading ? (
                <>
                  <span className="mn-btn-loader" aria-hidden="true"></span>
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span className="mn-btn-icon" aria-hidden="true">➔</span>
                  <span>Sign In</span>
                </>
              )}
            </button>

            {/* OR Divider */}
            <div className="mn-or-divider">
              <span className="mn-or-line"></span>
              <span className="mn-or-text">OR</span>
              <span className="mn-or-line"></span>
            </div>

            {/* Google Sign In Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="mn-google-signin-btn"
            >
              <svg className="mn-google-icon" viewBox="0 0 24 24" width="18" height="18">
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
              <span>Sign in with Google</span>
            </button>
          </form>

          {/* Bottom Security Note */}
          <div className="mn-admin-security-footer">
            <div className="mn-sec-shield-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF6B00" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <div className="mn-sec-text-content">
              <h4 className="mn-sec-heading">Secure Admin Access</h4>
              <p className="mn-sec-sub">Only authorized personnel can access this panel.</p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default AdminLoginPage;
