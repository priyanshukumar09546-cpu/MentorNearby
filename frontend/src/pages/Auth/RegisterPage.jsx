import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import StudentRegistration from './StudentRegistration';
import TutorRegistration from './TutorRegistration';
import './LoginPage.css';

/* ── Inline SVG Icons ── */
const UserIcon = () => (
  <svg className="auth-field-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);

const EmailIcon = () => (
  <svg className="auth-field-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const PhoneIcon = () => (
  <svg className="auth-field-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

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

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" style={{ width: '20px', height: '20px', minWidth: '20px', minHeight: '20px', flexShrink: 0, display: 'inline-block' }}>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);

const RegisterPage = () => {
  const [selectedRole, setSelectedRole] = useState('STUDENT');
  const [fullWizardMode, setFullWizardMode] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get('error');
    if (err) {
      setErrorMsg(err);
    }
    const roleParam = params.get('role');
    if (roleParam === 'TUTOR') {
      setSelectedRole('TUTOR');
    }
  }, []);

  // If user selected advanced multi-step wizard
  if (fullWizardMode && selectedRole === 'STUDENT') {
    return (
      <div className="auth-page-wrapper">
        <div className="container" style={{ maxWidth: '800px' }}>
          <StudentRegistration onBack={() => setFullWizardMode(false)} />
        </div>
      </div>
    );
  }

  if (fullWizardMode && selectedRole === 'TUTOR') {
    return (
      <div className="auth-page-wrapper">
        <div className="container" style={{ maxWidth: '840px' }}>
          <TutorRegistration onBack={() => setFullWizardMode(false)} />
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!name.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!password || password.length < 8) {
      setErrorMsg('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    if (!agreeTerms) {
      setErrorMsg('Please agree to the Terms of Service & Privacy Policy.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
        role: selectedRole === 'TUTOR' ? 'TUTOR' : 'STUDENT'
      });
      const userObj = res?.user || res?.data?.data?.user || res?.data?.user;
      const role = extractUserRole(userObj) || (selectedRole === 'TUTOR' ? 'TUTOR' : 'STUDENT');
      console.log('[AUTH ROLE AFTER REGISTER]', role);
      const targetDashboard = getRoleDashboard(role);
      navigate(targetDashboard, { replace: true });
    } catch (err) {
      const fieldErrors = err?.response?.data?.errors;
      let msg = err?.response?.data?.message;

      if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
        msg = fieldErrors.map(e => `${e.field}: ${e.message}`).join(' | ');
      } else if (!msg || msg === 'Validation Error') {
        msg = 'Registration failed. Please check your information and try again.';
      }

      if (err?.response?.status === 409 || (msg && msg.toLowerCase().includes('email'))) {
        setErrorMsg('Email already exists. Please log in instead.');
      } else {
        setErrorMsg(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  /* ── Google Sign-In ── */
  const handleGoogleClick = async () => {
    if (googleLoading) return;
    setErrorMsg('');
    setGoogleLoading(true);

    try {
      const res = await client.get(`/auth/google/url?role=${selectedRole}`);
      if (res.data.data?.url) {
        window.location.href = res.data.data.url;
      } else {
        throw new Error('Could not retrieve Google OAuth URL');
      }
    } catch (err) {
      setGoogleLoading(false);
      if (err.response?.data?.message) {
        setErrorMsg(err.response.data.message);
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        setErrorMsg('Unable to connect to MentorNearby backend server. Please check your network or server status.');
      } else {
        setErrorMsg('Google sign-up is currently unavailable. Please register with email.');
      }
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-split-card">
        
        {/* ========================================================
            LEFT PANEL: DARK NAVY BRANDED EDUCATIONAL DISPLAY
            ======================================================== */}
        <div className="auth-left-panel">
          <div className="auth-panel-glow"></div>
          <div className="auth-panel-dots"></div>

          {/* Top Brand Logo */}
          <div className="auth-brand-header">
            <Link to="/" className="auth-logo-link">
              <div className="auth-logo-brand-wrap">
                <img
                  src="/logo.png"
                  alt="MentorNearby Logo"
                  className="auth-brand-logo-img"
                />
                <span className="auth-logo-est">EST. 2026 INDIA</span>
              </div>
            </Link>
          </div>

          {/* Headline & Description */}
          <div className="auth-left-content">
            <h2 className="auth-panel-title">
              Find Trusted<br />
              Tutors <span className="auth-highlight-gold">Near You</span>
            </h2>
            <p className="auth-panel-desc">
              Connect with verified tutors for home & online tuition. Learn better, achieve more.
            </p>

            {/* Three Trust Features */}
            <div className="auth-trust-list">
              <div className="auth-trust-item">
                <span className="auth-trust-icon-box bg-blue-500/20 text-blue-400">🛡️</span>
                <span>KYC Verified Tutors</span>
              </div>
              <div className="auth-trust-item">
                <span className="auth-trust-icon-box bg-emerald-500/20 text-emerald-400">🔒</span>
                <span>Safe & Secure Platform</span>
              </div>
              <div className="auth-trust-item">
                <span className="auth-trust-icon-box bg-purple-500/20 text-purple-400">👥</span>
                <span>2 Free Contact Unlocks</span>
              </div>
            </div>
          </div>

          {/* Dominant Children Illustration at Bottom */}
          <div className="auth-illustration-wrap">
            <img
              src="/hero-illustration.png"
              alt="Students studying together in library"
              className="auth-panel-illustration"
            />
          </div>
        </div>

        {/* ========================================================
            RIGHT PANEL: CLEAN WHITE SIGN UP FORM
            ======================================================== */}
        <div className="auth-right-panel">
          <div className="auth-form-container">
            
            {/* Header */}
            <div className="auth-form-header">
              <h1 className="auth-form-title">Create Your Account ✨</h1>
              <p className="auth-form-subtitle">Join MentorNearby and start your learning journey</p>
            </div>

            {/* Role Switcher Tabs */}
            <div className="auth-role-tabs">
              <button
                type="button"
                className={`auth-role-tab-btn ${selectedRole === 'STUDENT' ? 'active' : ''}`}
                onClick={() => { setSelectedRole('STUDENT'); setErrorMsg(''); }}
              >
                <span>🎓</span>
                <span>Student / Parent</span>
              </button>
              <button
                type="button"
                className={`auth-role-tab-btn ${selectedRole === 'TUTOR' ? 'active' : ''}`}
                onClick={() => { setSelectedRole('TUTOR'); setErrorMsg(''); }}
              >
                <span>🧑‍🏫</span>
                <span>Tutor</span>
              </button>
            </div>

            {/* Error Message Alert */}
            {errorMsg && (
              <div className="auth-alert-error" role="alert">
                <span className="auth-alert-icon">⚠️</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Form */}
            {selectedRole === 'TUTOR' && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl mb-4 text-xs text-blue-900 leading-relaxed flex items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-xs text-blue-950 mb-0.5">🧑‍🏫 Fast Educator Registration</p>
                  <span>Create your tutor account to access your Tutor Dashboard.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFullWizardMode(true)}
                  className="text-xs text-blue-700 font-bold underline whitespace-nowrap"
                >
                  Full 9-Step Form →
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="auth-form-body">
              
              {/* Full Name */}
              <div className="auth-input-group">
                <label className="auth-input-label" htmlFor="register-name">Full Name</label>
                <div className="auth-input-box">
                  <UserIcon />
                  <input
                    id="register-name"
                    type="text"
                    className="auth-input-element"
                    placeholder="e.g. Rahul Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    required
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="auth-input-group">
                <label className="auth-input-label" htmlFor="register-email">Email Address</label>
                <div className="auth-input-box">
                  <EmailIcon />
                  <input
                    id="register-email"
                    type="email"
                    className="auth-input-element"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              {/* Mobile Phone */}
              <div className="auth-input-group">
                <label className="auth-input-label" htmlFor="register-phone">Mobile Phone Number</label>
                <div className="auth-input-box">
                  <PhoneIcon />
                  <input
                    id="register-phone"
                    type="tel"
                    className="auth-input-element"
                    placeholder="10-digit mobile number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    autoComplete="tel"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="auth-input-group">
                <label className="auth-input-label" htmlFor="register-password">Password</label>
                <div className="auth-input-box">
                  <LockIcon />
                  <input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    className="auth-input-element"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
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

              {/* Confirm Password Field */}
              <div className="auth-input-group">
                <label className="auth-input-label" htmlFor="register-confirm-password">Confirm Password</label>
                <div className="auth-input-box">
                  <LockIcon />
                  <input
                    id="register-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="auth-input-element"
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className="auth-toggle-pw-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              {/* Terms and Privacy Checkbox */}
              <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                <input
                  type="checkbox"
                  id="register-terms"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="register-terms" className="cursor-pointer">
                  I agree to the <Link to="/terms" className="text-blue-600 hover:underline">Terms</Link> & <Link to="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
                </label>
              </div>

              {/* Submit CTA Button */}
              <button
                type="submit"
                className="auth-primary-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="auth-btn-spinner" />
                    <span>Creating {selectedRole === 'TUTOR' ? 'Tutor' : 'Student'} Account...</span>
                  </>
                ) : (
                  <span>{selectedRole === 'TUTOR' ? 'Create Tutor Account (Tutor Dashboard) →' : 'Create Account'}</span>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="auth-divider">
              <span className="auth-divider-line" />
              <span className="auth-divider-text">or continue with</span>
              <span className="auth-divider-line" />
            </div>

            {/* Google Sign-in Button */}
            <button
              type="button"
              className="auth-social-btn"
              onClick={handleGoogleClick}
              disabled={googleLoading}
            >
              <GoogleIcon />
              <span>{googleLoading ? 'Connecting...' : `Continue with Google (${selectedRole === 'TUTOR' ? 'Tutor' : 'Student'})`}</span>
            </button>

            {/* Sign In Navigation */}
            <div className="auth-footer-nav">
              <span>Already have an account?</span>
              <Link to="/login" className="auth-nav-link">Sign In</Link>
            </div>

            {/* Bottom Security Pill */}
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

export default RegisterPage;

