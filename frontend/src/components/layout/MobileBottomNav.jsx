// ============================================================
// components/layout/MobileBottomNav.jsx
// MentorNearby Premium Mobile Bottom Navigation Bar
// 5 Primary Actions: Home, Explore, Post/Ask (+), Messages, Profile
// Reuses MentorNearby FontAwesome 6 Icon System & Theme Tokens
// ============================================================

import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import './MobileBottomNav.css';

const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { isDark, darkMode } = useTheme();
  const isDarkMode = isDark ?? darkMode ?? false;

  const pathname = location.pathname;

  // Hide on admin routes, auth callback, or full-screen reader/watch pages
  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/auth/callback') ||
    pathname.startsWith('/auth-success') ||
    pathname.startsWith('/books/read') ||
    pathname.startsWith('/course/watch')
  ) {
    return null;
  }

  const userRole = (
    user?.role ||
    user?.user?.role ||
    ''
  ).toString().toLowerCase().trim();
  const isTutor = userRole === 'tutor';

  // 1. Home Active Check
  const isHomeActive = pathname === '/';

  // 2. Explore / Search Active Check
  const isExploreActive =
    pathname.startsWith('/search') ||
    pathname.startsWith('/tutors') ||
    pathname.startsWith('/explore') ||
    pathname.startsWith('/find-tutors') ||
    pathname.startsWith('/find-students') ||
    pathname.startsWith('/courses') ||
    pathname.startsWith('/study-resources') ||
    pathname.startsWith('/books');

  // 3. Post / Ask (+) Action Destination & Active Check
  const postDestination = isTutor ? '/find-students' : '/post-requirement';
  const isPostActive =
    pathname.startsWith('/post-requirement') ||
    pathname.startsWith('/student/requirements') ||
    pathname.startsWith('/tutor/requests');

  // 4. Messages Active Check
  const isMessagesActive =
    pathname.startsWith('/chat') ||
    pathname.startsWith('/messages') ||
    pathname.startsWith('/app/chat');

  // 5. Profile Destination & Active Check
  const profileDestination = isAuthenticated
    ? isTutor
      ? '/tutor/dashboard'
      : '/student/dashboard'
    : '/login';

  const isProfileActive =
    pathname.startsWith('/profile') ||
    pathname.startsWith('/tutor/profile') ||
    pathname.startsWith('/student/profile') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/student/dashboard') ||
    pathname.startsWith('/tutor/dashboard') ||
    pathname.startsWith('/student-dashboard') ||
    pathname.startsWith('/tutor-dashboard') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/saved-tutors') ||
    pathname.startsWith('/purchases') ||
    pathname.startsWith('/kyc');

  // Handler for Home button:
  // - If user is already on the Home page ('/'), smoothly scroll to the top (0, 0)
  // - If user is on any other page, immediately reset scroll to top (0, 0) and navigate
  const handleHomeClick = (e) => {
    if (pathname === '/') {
      e.preventDefault();
      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      } catch (_) {
        window.scrollTo(0, 0);
      }
      if (document.documentElement) {
        try {
          document.documentElement.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        } catch (_) {
          document.documentElement.scrollTop = 0;
        }
      }
      if (document.body) {
        try {
          document.body.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        } catch (_) {
          document.body.scrollTop = 0;
        }
      }
      const root = document.getElementById('root');
      if (root) {
        try {
          root.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        } catch (_) {
          root.scrollTop = 0;
        }
      }
      const mainContent = document.querySelector('.mn-app-main-content');
      if (mainContent) {
        try {
          mainContent.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        } catch (_) {
          mainContent.scrollTop = 0;
        }
      }
      return;
    }

    // Navigating from any other page to Home:
    // Reset immediately so the view begins at the very top (0, 0)
    try {
      window.scrollTo(0, 0);
    } catch (_) {}
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
    const root = document.getElementById('root');
    if (root) root.scrollTop = 0;
    const mainContent = document.querySelector('.mn-app-main-content');
    if (mainContent) mainContent.scrollTop = 0;
  };

  // Handler for Messages to guarantee clean conversation list opening
  const handleMessagesClick = (e) => {
    if (pathname.startsWith('/chat') || pathname.startsWith('/messages')) {
      e.preventDefault();
      // Remove chat-open class and navigate to root /chat without query params
      document.body.classList.remove('chat-open');
      navigate('/chat', { replace: true });
    }
  };

  return (
    <nav
      className={`mn-mobile-bottom-nav ${isDarkMode ? 'dark' : 'light'}`}
      aria-label="Mobile Navigation Bar"
    >
      <div className="mn-bottom-nav-container">
        {/* 1. Home */}
        <Link
          to="/"
          onClick={handleHomeClick}
          className={`mn-bottom-nav-item ${isHomeActive ? 'active' : ''}`}
          aria-label="Home"
        >
          <div className="mn-bottom-icon-wrap">
            <i className={`fa-solid fa-house ${isHomeActive ? 'active-icon' : ''}`}></i>
          </div>
          <span className="mn-bottom-label">Home</span>
        </Link>

        {/* 2. Explore / Search */}
        <Link
          to="/search"
          className={`mn-bottom-nav-item ${isExploreActive ? 'active' : ''}`}
          aria-label="Explore"
        >
          <div className="mn-bottom-icon-wrap">
            <i className="fa-solid fa-magnifying-glass"></i>
          </div>
          <span className="mn-bottom-label">Explore</span>
        </Link>

        {/* 3. Primary Center Action (+) */}
        <Link
          to={postDestination}
          className={`mn-bottom-center-action ${isPostActive ? 'active' : ''}`}
          aria-label={isTutor ? 'Find Requests' : 'Post Requirement'}
        >
          <div className="mn-bottom-plus-btn">
            <i className="fa-solid fa-plus"></i>
          </div>
          <span className="mn-bottom-label center-label">
            {isTutor ? 'Requests' : 'Post/Ask'}
          </span>
        </Link>

        {/* 4. Messages */}
        <Link
          to="/chat"
          onClick={handleMessagesClick}
          className={`mn-bottom-nav-item ${isMessagesActive ? 'active' : ''}`}
          aria-label="Messages"
        >
          <div className="mn-bottom-icon-wrap">
            <i className={isMessagesActive ? 'fa-solid fa-comment-dots' : 'fa-regular fa-comment-dots'}></i>
          </div>
          <span className="mn-bottom-label">Messages</span>
        </Link>

        {/* 5. Profile */}
        <Link
          to={profileDestination}
          className={`mn-bottom-nav-item ${isProfileActive ? 'active' : ''}`}
          aria-label="Profile"
        >
          <div className="mn-bottom-icon-wrap">
            <i className={isProfileActive ? 'fa-solid fa-user' : 'fa-regular fa-user'}></i>
          </div>
          <span className="mn-bottom-label">Profile</span>
        </Link>
      </div>
    </nav>
  );
};

export default MobileBottomNav;
