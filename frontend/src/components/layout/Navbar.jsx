// ============================================================
// components/layout/Navbar.jsx
// MentorNearby Global Navigation Bar (Matching Reference Design)
// ============================================================

import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import NotificationDropdown from '../notifications/NotificationDropdown';
import ThemeSwitcher from './ThemeSwitcher';
import './Navbar.css';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { isDark, darkMode } = useTheme();
  const isDarkMode = isDark ?? darkMode ?? true;
  const {
    unreadCount,
    dropdownOpen: notifDropdownOpen,
    toggleDropdown: toggleNotifDropdown,
    closeDropdown: closeNotifDropdown,
  } = useNotifications();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const navRef = useRef(null);

  // Close dropdowns on outside click or route change
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    setActiveDropdown(null);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const userRole = (
    user?.role ||
    user?.user?.role ||
    Cookies.get('role') ||
    ''
  ).toString().trim().toUpperCase();

  const getDashboardPath = () => {
    if (userRole === 'ADMIN') return '/admin';
    if (userRole === 'TUTOR') return '/tutor/dashboard';
    return '/dashboard';
  };

  const getProfilePath = () => {
    if (userRole === 'TUTOR') return '/tutor/profile/edit';
    return '/profile';
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  if (
    location.pathname === '/dashboard' ||
    location.pathname === '/tutor/dashboard' ||
    location.pathname === '/tutor/profile' ||
    location.pathname === '/tutor/profile/edit' ||
    location.pathname === '/profile'
  ) {
    return null;
  }

  const toggleDropdown = (name) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  return (
    <header className={`navbar ${isDarkMode ? 'navbar-dark' : ''}`} ref={navRef}>
      {isDarkMode && (
        <div
          className="navbar-glow-line"
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '1px',
            background: 'linear-gradient(90deg, transparent 0%, rgba(250, 204, 21, 0.4) 50%, transparent 100%)',
            pointerEvents: 'none',
          }}
        />
      )}
      <div className="navbar-container">
        {/* Brand Logo matching Reference */}
        <Link to="/" className="navbar-logo" aria-label="MentorNearby Home">
          <img
            src="/logo.png"
            alt="MentorNearby Logo"
            className="navbar-logo-img"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <div className="navbar-logo-text-wrap">
            <span className="navbar-brand-name">
              <span className="navbar-brand-mentor">Mentor</span>
              <span className="navbar-brand-nearby">Nearby</span>
            </span>
            <span className="navbar-brand-tagline">Find. Learn. Grow.</span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="navbar-links desktop-only" aria-label="Main Navigation">
          {/* Role-based Find Tutors / Find Students Link with Dropdown */}
          <div className="nav-item-dropdown-container">
            {userRole === 'TUTOR' ? (
              <button
                type="button"
                className={`navbar-link-item ${isActive('/find-students') || isActive('/requirements') ? 'active' : ''}`}
                onClick={() => {
                  toggleDropdown('findStudents');
                  navigate('/find-students');
                }}
                onMouseEnter={() => setActiveDropdown('findStudents')}
              >
                <span>Find Students</span>
                <span className="nav-chevron">▾</span>
              </button>
            ) : (
              <button
                type="button"
                className={`navbar-link-item ${isActive('/search') || isActive('/find-tutors') || isActive('/tutors') ? 'active' : ''}`}
                onClick={() => {
                  toggleDropdown('findTutors');
                  navigate('/find-tutors');
                }}
                onMouseEnter={() => setActiveDropdown('findTutors')}
              >
                <span>Find Tutors</span>
                <span className="nav-chevron">▾</span>
              </button>
            )}

            {activeDropdown === 'findStudents' && (
              <div
                className="nav-dropdown-menu"
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <Link to="/find-students" className="nav-dropdown-item">
                  <span className="nav-dd-icon">🔍</span>
                  <div>
                    <div className="nav-dd-title">All Student Leads</div>
                    <div className="nav-dd-sub">Search and filter active student tuition requests</div>
                  </div>
                </Link>
                <Link to="/find-students?mode=OFFLINE" className="nav-dropdown-item">
                  <span className="nav-dd-icon">🏠</span>
                  <div>
                    <div className="nav-dd-title">Home Tuition Requests</div>
                    <div className="nav-dd-sub">Students looking for home tutors nearby</div>
                  </div>
                </Link>
                <Link to="/find-students?mode=ONLINE" className="nav-dropdown-item">
                  <span className="nav-dd-icon">🌐</span>
                  <div>
                    <div className="nav-dd-title">Online Student Classes</div>
                    <div className="nav-dd-sub">Students looking for online mentors</div>
                  </div>
                </Link>
              </div>
            )}

            {activeDropdown === 'findTutors' && (
              <div
                className="nav-dropdown-menu"
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <Link to="/find-tutors" className="nav-dropdown-item">
                  <span className="nav-dd-icon">🔍</span>
                  <div>
                    <div className="nav-dd-title">All Tutors</div>
                    <div className="nav-dd-sub">Search and filter verified tutors</div>
                  </div>
                </Link>
                <Link to="/find-tutors?filter=subject" className="nav-dropdown-item">
                  <span className="nav-dd-icon">📚</span>
                  <div>
                    <div className="nav-dd-title">By Subject</div>
                    <div className="nav-dd-sub">Maths, Science, Physics &amp; more</div>
                  </div>
                </Link>
                <Link to="/find-tutors?filter=location" className="nav-dropdown-item">
                  <span className="nav-dd-icon">📍</span>
                  <div>
                    <div className="nav-dd-title">By Location</div>
                    <div className="nav-dd-sub">Find home tutors near your area</div>
                  </div>
                </Link>
                <Link to="/find-tutors?verified=true" className="nav-dropdown-item">
                  <span className="nav-dd-icon">🛡️</span>
                  <div>
                    <div className="nav-dd-title">KYC Verified Only</div>
                    <div className="nav-dd-sub">100% background-checked tutors</div>
                  </div>
                </Link>
              </div>
            )}
          </div>

          {/* Courses */}
          <Link
            to="/courses"
            className={`navbar-link-item ${isActive('/courses') ? 'active' : ''}`}
          >
            Courses
          </Link>

          {/* Study Resources with Dropdown */}
          <div className="nav-item-dropdown-container">
            <button
              type="button"
              className={`navbar-link-item ${isActive('/study-resources') || isActive('/books') ? 'active' : ''}`}
              onClick={() => toggleDropdown('studyResources')}
              onMouseEnter={() => setActiveDropdown('studyResources')}
            >
              <span>Study Resources</span>
              <span className="nav-chevron">▾</span>
            </button>
            {activeDropdown === 'studyResources' && (
              <div
                className="nav-dropdown-menu"
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <Link to="/book-bank" className="nav-dropdown-item">
                  <span className="nav-dd-icon">📚</span>
                  <div>
                    <div className="nav-dd-title">Book Bank</div>
                    <div className="nav-dd-sub">Class 9–12 textbooks/books</div>
                  </div>
                </Link>
                <Link to="/study-resources" className="nav-dropdown-item">
                  <span className="nav-dd-icon">📄</span>
                  <div>
                    <div className="nav-dd-title">Notes &amp; PDFs</div>
                    <div className="nav-dd-sub">Notes, Formula Sheets &amp; Revision PDFs</div>
                  </div>
                </Link>
                <Link to="/courses" className="nav-dropdown-item">
                  <span className="nav-dd-icon">❓</span>
                  <div>
                    <div className="nav-dd-title">Previous Year Papers</div>
                    <div className="nav-dd-sub">10-year board questions &amp; solutions</div>
                  </div>
                </Link>
                <Link to="/study-resources" className="nav-dropdown-item">
                  <span className="nav-dd-icon">⭐</span>
                  <div>
                    <div className="nav-dd-title">Topper Tips</div>
                    <div className="nav-dd-sub">Exam strategies from top rankers</div>
                  </div>
                </Link>
              </div>
            )}
          </div>

          {/* How It Works */}
          <Link
            to="/how-it-works"
            className={`navbar-link-item ${isActive('/how-it-works') ? 'active' : ''}`}
          >
            How It Works
          </Link>

          {/* Safety & Trust */}
          <Link
            to="/safety"
            className={`navbar-link-item ${isActive('/safety') ? 'active' : ''}`}
          >
            Safety &amp; Trust
          </Link>

          {/* Help & Support with Dropdown */}
          <div className="nav-item-dropdown-container">
            <button
              type="button"
              className={`navbar-link-item ${isActive('/contact') || isActive('/faqs') ? 'active' : ''}`}
              onClick={() => toggleDropdown('helpSupport')}
              onMouseEnter={() => setActiveDropdown('helpSupport')}
            >
              <span>Help &amp; Support</span>
              <span className="nav-chevron">▾</span>
            </button>
            {activeDropdown === 'helpSupport' && (
              <div
                className="nav-dropdown-menu"
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <Link to="/contact" className="nav-dropdown-item">
                  <span className="nav-dd-icon">💬</span>
                  <div>
                    <div className="nav-dd-title">Contact Us</div>
                    <div className="nav-dd-sub">24/7 dedicated assistance</div>
                  </div>
                </Link>
                <Link to="/faqs" className="nav-dropdown-item">
                  <span className="nav-dd-icon">❓</span>
                  <div>
                    <div className="nav-dd-title">FAQs</div>
                    <div className="nav-dd-sub">Frequently asked questions</div>
                  </div>
                </Link>
                <Link to="/safety" className="nav-dropdown-item">
                  <span className="nav-dd-icon">🛡️</span>
                  <div>
                    <div className="nav-dd-title">Parent Guidelines</div>
                    <div className="nav-dd-sub">Safety and trust policies</div>
                  </div>
                </Link>
              </div>
            )}
          </div>

          {/* More Dropdown */}
          <div className="nav-item-dropdown-container">
            <button
              type="button"
              className="navbar-link-item"
              onClick={() => toggleDropdown('moreMenu')}
              onMouseEnter={() => setActiveDropdown('moreMenu')}
            >
              <span>More</span>
              <span className="nav-chevron">▾</span>
            </button>
            {activeDropdown === 'moreMenu' && (
              <div
                className="nav-dropdown-menu"
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <Link to="/books" className="nav-dropdown-item">
                  <span className="nav-dd-icon">📚</span>
                  <div>
                    <div className="nav-dd-title">NCERT &amp; Free Books</div>
                    <div className="nav-dd-sub">Read online & download anytime</div>
                  </div>
                </Link>
                <Link to="/post-requirement" className="nav-dropdown-item">
                  <span className="nav-dd-icon">✍️</span>
                  <div>
                    <div className="nav-dd-title">Post Requirement</div>
                    <div className="nav-dd-sub">Let verified tutors reach out to you</div>
                  </div>
                </Link>
                <Link to="/become-tutor" className="nav-dropdown-item">
                  <span className="nav-dd-icon">🧑‍🏫</span>
                  <div>
                    <div className="nav-dd-title">Become a Tutor</div>
                    <div className="nav-dd-sub">Start teaching and grow your practice</div>
                  </div>
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* Desktop Controls (Language, Theme, Notification Bell, Login, Sign Up) */}
        <div className="navbar-auth-actions desktop-only">
          {/* Language Selector Pill */}
          <div className="nav-lang-pill" title="Language: English">
            <span className="nav-lang-globe">🌐</span>
            <span className="nav-lang-text">English</span>
            <span className="nav-chevron">▾</span>
          </div>

          {/* Theme Switcher Toggle */}
          <ThemeSwitcher />

          {/* Notification Bell with Dropdown */}
          <div className="nav-notification-wrapper" style={{ position: 'relative' }}>
            <button
              type="button"
              className={`nav-notification-btn ${notifDropdownOpen ? 'active' : ''}`}
              onClick={toggleNotifDropdown}
              aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
              title="Notifications"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              {unreadCount > 0 && (
                <span className="nav-notification-badge">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            <NotificationDropdown
              isOpen={notifDropdownOpen}
              onClose={closeNotifDropdown}
            />
          </div>

          {!isAuthenticated ? (
            <>
              <Link to="/login" className="navbar-btn-signin">
                Login
              </Link>
              <Link to="/register" className="navbar-btn-signup">
                Sign Up
              </Link>
            </>
          ) : (
            <div className="nav-user-menu-wrap" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Link to={getDashboardPath()} style={{ textDecoration: 'none' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #E2E8F0', background: '#1E293B', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {user?.avatar || user?.profilePhoto?.url ? (
                    <img
                      src={user?.avatar || user?.profilePhoto?.url}
                      alt={user?.name || 'User'}
                      className="w-full h-full object-cover object-center"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
                    />
                  ) : (
                    <span style={{ color: '#FFFFFF', fontWeight: '700', fontSize: '15px' }}>
                      {(user?.name || 'U').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </Link>
              <Link to={getDashboardPath()} className="navbar-btn-signin">
                Dashboard
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="navbar-btn-logout"
                title="Logout"
              >
                Logout
              </button>
            </div>
          )}
        </div>

        {/* Mobile Header Controls */}
        <div className="mobile-header-controls">
          <ThemeSwitcher compact={true} />
          <div className="nav-notification-wrapper" style={{ position: 'relative' }}>
            <button
              type="button"
              className={`nav-notification-btn compact ${notifDropdownOpen ? 'active' : ''}`}
              onClick={toggleNotifDropdown}
              aria-label="Notifications"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              {unreadCount > 0 && (
                <span className="nav-notification-badge">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          </div>
          <button
            type="button"
            className="navbar-mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="navbar-mobile-drawer">
          {userRole === 'TUTOR' ? (
            <Link
              to="/find-students"
              onClick={() => setMobileMenuOpen(false)}
              className={isActive('/find-students') || isActive('/requirements') ? 'active' : ''}
            >
              <span>🔍 Find Students</span>
              <span>→</span>
            </Link>
          ) : (
            <Link
              to="/find-tutors"
              onClick={() => setMobileMenuOpen(false)}
              className={isActive('/find-tutors') || isActive('/search') ? 'active' : ''}
            >
              <span>🔍 Find Tutors</span>
              <span>→</span>
            </Link>
          )}

          <Link
            to="/courses"
            onClick={() => setMobileMenuOpen(false)}
            className={isActive('/courses') ? 'active' : ''}
          >
            <span>🎓 Courses</span>
            <span>→</span>
          </Link>

          <Link
            to="/study-resources"
            onClick={() => setMobileMenuOpen(false)}
            className={isActive('/study-resources') ? 'active' : ''}
          >
            <span>📚 Study Resources</span>
            <span>→</span>
          </Link>

          <Link
            to="/study-resources"
            onClick={() => setMobileMenuOpen(false)}
            className={isActive('/study-resources') || isActive('/book-bank') ? 'active' : ''}
          >
            <span>📚 Book Bank (Class 1-12)</span>
            <span>→</span>
          </Link>

          <Link
            to="/how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className={isActive('/how-it-works') ? 'active' : ''}
          >
            <span>💡 How It Works</span>
            <span>→</span>
          </Link>

          <Link
            to="/safety"
            onClick={() => setMobileMenuOpen(false)}
            className={isActive('/safety') ? 'active' : ''}
          >
            <span>🛡️ Safety &amp; Trust</span>
            <span>→</span>
          </Link>

          <Link
            to="/become-tutor"
            onClick={() => setMobileMenuOpen(false)}
            className={isActive('/become-tutor') ? 'active' : ''}
          >
            <span>🧑‍🏫 Become a Tutor</span>
            <span>→</span>
          </Link>

          {!isAuthenticated ? (
            <div className="mobile-drawer-auth-actions">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="navbar-btn-signin"
                style={{ flex: 1, textAlign: 'center' }}
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="navbar-btn-signup"
                style={{ flex: 1, textAlign: 'center' }}
              >
                Sign Up
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
              <Link
                to={getDashboardPath()}
                onClick={() => setMobileMenuOpen(false)}
                className="navbar-btn-signin"
                style={{ textAlign: 'center' }}
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="navbar-btn-logout"
                style={{ width: '100%', padding: '10px 0', textAlign: 'center' }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
