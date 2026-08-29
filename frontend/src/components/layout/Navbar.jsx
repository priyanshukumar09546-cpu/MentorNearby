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
    unreadCount: contextUnreadCount,
    dropdownOpen: notifDropdownOpen,
    toggleDropdown: toggleNotifDropdown,
    closeDropdown: closeNotifDropdown,
  } = useNotifications();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const navRef = useRef(null);

  // ── FORCE FIX: Notifications Direct State & Real-Time Polling ──
  const [showNotif, setShowNotif] = useState(false);
  const [notificationsList, setNotificationsList] = useState([]);
  const [bellUnreadCount, setBellUnreadCount] = useState(0);
  const notifDropdownRef = useRef(null);

  const token =
    localStorage.getItem('token') ||
    localStorage.getItem('mn_token') ||
    Cookies.get('token');

  const fetchBellCount = async () => {
    if (!token && !isAuthenticated) {
      setBellUnreadCount(0);
      return;
    }
    try {
      console.log('🔔 Fetching unread count...');
      const apiUrl = import.meta.env.VITE_API_URL || 'https://api.mentornearby.com';
      const res = await fetch(`${apiUrl}/api/notifications/unread-count`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) return;
      const data = await res.json();
      const count =
        typeof data.count === 'number'
          ? data.count
          : (data.unreadCount ?? data.data?.count ?? data.data?.unreadCount ?? 0);
      console.log('🔔 Count:', count, data);
      setBellUnreadCount(count);
    } catch (err) {
      console.error('Bell count error', err);
    }
  };

  useEffect(() => {
    fetchBellCount();
    const interval = setInterval(fetchBellCount, 10000);
    return () => clearInterval(interval);
  }, [token, isAuthenticated]);

  const handleBellClick = async (e) => {
    e.stopPropagation();
    console.log('🔔 Bell clicked, current show:', showNotif);
    const nextState = !showNotif;
    setShowNotif(nextState);

    if (nextState) {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'https://api.mentornearby.com';
        const res = await fetch(`${apiUrl}/api/notifications`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data)
            ? data
            : (data.notifications || data.data?.notifications || data.data || []);
          console.log('🔔 Notifications fetched:', list);
          setNotificationsList(list);
        }
      } catch (err) {
        console.error('Failed to load notifications:', err);
      }
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleDocClick = (e) => {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target)) {
        setShowNotif(false);
      }
    };
    document.addEventListener('click', handleDocClick);
    return () => document.removeEventListener('click', handleDocClick);
  }, []);

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

  const isDashboardRoute =
    location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/student-dashboard') ||
    location.pathname.startsWith('/student/dashboard') ||
    location.pathname.startsWith('/tutor-dashboard') ||
    location.pathname.startsWith('/tutor/dashboard') ||
    location.pathname.startsWith('/tutor/requests') ||
    location.pathname.startsWith('/student-requests') ||
    location.pathname.startsWith('/tutor/profile') ||
    location.pathname.startsWith('/student/profile') ||
    location.pathname.startsWith('/student/purchases') ||
    location.pathname.startsWith('/student/requirements') ||
    location.pathname.startsWith('/saved-tutors') ||
    location.pathname.startsWith('/post-requirement') ||
    location.pathname.startsWith('/purchases') ||
    location.pathname.startsWith('/admin');

  if (isDashboardRoute) {
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
          <div
            className="nav-notification-wrapper relative"
            ref={notifDropdownRef}
            style={{ position: 'relative' }}
          >
            <button
              type="button"
              className={`nav-notification-btn ${showNotif ? 'active' : ''}`}
              onClick={handleBellClick}
              aria-label={`Notifications ${bellUnreadCount > 0 ? `(${bellUnreadCount} unread)` : ''}`}
              title="Notifications"
              style={{ position: 'relative', cursor: 'pointer', zIndex: 50 }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              {bellUnreadCount > 0 && (
                <span
                  className="nav-notification-badge"
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    background: '#EF4444',
                    color: '#FFF',
                    fontSize: '10px',
                    fontWeight: 800,
                    minWidth: '18px',
                    height: '18px',
                    padding: '0 4px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 5px rgba(239, 68, 68, 0.4)',
                  }}
                >
                  {bellUnreadCount > 99 ? '99+' : bellUnreadCount}
                </span>
              )}
            </button>

            {showNotif && (
              <div
                className="absolute right-0 top-12 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col text-left"
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '48px',
                  width: '360px',
                  maxWidth: 'calc(100vw - 32px)',
                  zIndex: 99999,
                  boxShadow: '0 20px 45px rgba(0,0,0,0.18)',
                }}
              >
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-gray-900">Notifications</span>
                    {bellUnreadCount > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {bellUnreadCount} new
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {bellUnreadCount > 0 && (
                      <button
                        type="button"
                        onClick={async () => {
                          const apiUrl =
                            import.meta.env.VITE_API_URL || 'https://api.mentornearby.com';
                          await fetch(`${apiUrl}/api/notifications/read-all`, {
                            method: 'PUT',
                            headers: { Authorization: `Bearer ${token}` },
                          });
                          setBellUnreadCount(0);
                          setNotificationsList((prev) =>
                            prev.map((n) => ({ ...n, isRead: true }))
                          );
                        }}
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-transparent border-none cursor-pointer"
                      >
                        Mark all read
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowNotif(false)}
                      className="w-6 h-6 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 text-xs font-bold border-none bg-transparent cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="max-h-[360px] overflow-y-auto divide-y divide-gray-100">
                  {notificationsList.length === 0 ? (
                    <div className="p-6 text-center text-gray-400">
                      <span className="text-3xl block mb-2">🔔</span>
                      <p className="text-xs font-medium text-gray-600">No new notifications</p>
                      <p className="text-[11px] text-gray-400 mt-1">
                        Try sending a message from another account to test alerts
                      </p>
                    </div>
                  ) : (
                    notificationsList.map((n) => (
                      <div
                        key={n._id}
                        onClick={async () => {
                          const apiUrl =
                            import.meta.env.VITE_API_URL || 'https://api.mentornearby.com';
                          fetch(`${apiUrl}/api/notifications/${n._id}/read`, {
                            method: 'PUT',
                            headers: { Authorization: `Bearer ${token}` },
                          }).catch(() => {});
                          setShowNotif(false);
                          if (n.actionUrl) {
                            navigate(n.actionUrl);
                          } else if (n.conversationId) {
                            navigate(`/messages?chat=${n.conversationId}`);
                          } else {
                            navigate('/notifications');
                          }
                        }}
                        className={`p-3.5 hover:bg-gray-50 cursor-pointer transition flex items-start gap-3 ${
                          !n.isRead ? 'bg-blue-50/60' : 'bg-white'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {n.sender?.name ? n.sender.name.charAt(0).toUpperCase() : '🔔'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-xs text-gray-900 truncate">
                            {n.title ||
                              (n.sender?.name
                                ? `${n.sender.name} sent a message`
                                : 'Notification')}
                          </p>
                          <p className="text-xs text-gray-600 line-clamp-2 mt-0.5">{n.message}</p>
                          <span className="text-[10px] text-gray-400 block mt-1">
                            {new Date(n.createdAt || Date.now()).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2.5 bg-gray-50 border-t border-gray-100 text-center">
                  <Link
                    to="/notifications"
                    onClick={() => setShowNotif(false)}
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    View all notifications →
                  </Link>
                </div>
              </div>
            )}
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

          {isAuthenticated && (
            <>
              <Link
                to="/messages"
                onClick={() => setMobileMenuOpen(false)}
                className={isActive('/messages') || isActive('/chat') ? 'active' : ''}
              >
                <span>💬 Messages</span>
                <span>→</span>
              </Link>
              <Link
                to="/notifications"
                onClick={() => setMobileMenuOpen(false)}
                className={isActive('/notifications') ? 'active' : ''}
              >
                <span>🔔 Notifications {unreadCount > 0 ? `(${unreadCount})` : ''}</span>
                <span>→</span>
              </Link>
            </>
          )}

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
