import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import UnlockContactModal from '../../components/payment/UnlockContactModal';
import ThemeSwitcher from '../../components/layout/ThemeSwitcher';
import './StudentDashboard.css';

/* ── Clean Inline SVG Graphics & Icons ── */
const BooksGraduationIllustration = () => (
  <svg width="190" height="130" viewBox="0 0 220 150" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Shadow base */}
    <ellipse cx="110" cy="138" rx="85" ry="8" fill="#e2e8f0" />
    
    {/* Bottom Book (Navy/Blue) */}
    <path d="M40 115 L180 115 L185 130 L35 130 Z" fill="#1e3a8a" />
    <path d="M35 115 L180 115 L180 120 L35 120 Z" fill="#2563eb" />
    <rect x="35" y="120" width="145" height="4" fill="#f8fafc" />
    <rect x="35" y="125" width="145" height="5" fill="#1d4ed8" />

    {/* Middle Book (Warm Yellow/Gold) */}
    <path d="M48 95 L172 95 L176 110 L44 110 Z" fill="#d97706" />
    <path d="M44 95 L172 95 L172 100 L44 100 Z" fill="#f59e0b" />
    <rect x="44" y="100" width="128" height="4" fill="#fefce8" />
    <rect x="44" y="105" width="128" height="5" fill="#b45309" />

    {/* Top Book (Cyan/Sky Blue) */}
    <path d="M56 75 L164 75 L168 90 L52 90 Z" fill="#0284c7" />
    <path d="M52 75 L164 75 L164 80 L52 80 Z" fill="#38bdf8" />
    <rect x="52" y="80" width="112" height="4" fill="#f0f9ff" />
    <rect x="52" y="85" width="112" height="5" fill="#0369a1" />

    {/* Graduation Cap (Mortarboard) */}
    <path d="M110 24 L175 42 L110 60 L45 42 Z" fill="#0f172a" />
    <path d="M110 24 L175 42 L110 46 L45 42 Z" fill="#1e293b" />
    <path d="M72 50 L72 70 C72 82 148 82 148 70 L148 50" fill="#0f172a" stroke="#1e293b" strokeWidth="2" />
    
    {/* Cap Button & Tassel */}
    <circle cx="110" cy="42" r="3.5" fill="#f59e0b" />
    <path d="M110 42 Q142 46 145 68" stroke="#f59e0b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    <polygon points="142,66 148,66 147,78 143,78" fill="#f59e0b" />

    {/* Small Cute Potted Plant */}
    <ellipse cx="192" cy="136" rx="14" ry="4" fill="#cbd5e1" />
    <path d="M184 116 L200 116 L197 134 L187 134 Z" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1.5" />
    <path d="M186 116 Q182 100 190 92 Q192 106 190 116 Z" fill="#10b981" />
    <path d="M192 116 Q200 98 196 90 Q188 102 192 116 Z" fill="#059669" />
    <path d="M194 116 Q204 104 206 98 Q198 108 194 116 Z" fill="#34d399" />
  </svg>
);

const StudentDashboardPage = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Real dynamic states from Backend
  const [unlocks, setUnlocks] = useState([]);
  const [savedCount, setSavedCount] = useState(0);
  const [activeRequestsCount, setActiveRequestsCount] = useState(0);
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [recommendedTutors, setRecommendedTutors] = useState([]);
  const [recommendedCourses, setRecommendedCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [selectedTutorId, setSelectedTutorId] = useState(null);

  const dropdownRef = useRef(null);

  // Close user dropdown on outside click
  useEffect(() => {
    const handleOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Fetch all real backend data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // 1. Fetch contact unlocks
        try {
          const unlockRes = await client.get('/contact-unlocks/my-unlocks');
          setUnlocks(unlockRes.data.data?.unlocks || []);
        } catch (_) {
          setUnlocks([]);
        }

        // 2. Fetch saved tutors count
        try {
          const savedRes = await client.get('/saved-tutors/my-saved');
          setSavedCount(savedRes.data.data?.savedTutors?.length || 0);
        } catch (_) {
          setSavedCount(0);
        }

        // 3. Fetch active tuition requirements
        try {
          const reqRes = await client.get('/requirements/me');
          setActiveRequestsCount(reqRes.data.data?.count || reqRes.data.data?.data?.length || 0);
        } catch (_) {
          setActiveRequestsCount(0);
        }

        // 4. Fetch unread notifications count
        try {
          const notifRes = await client.get('/notifications?unreadOnly=true');
          setUnreadAlertsCount(notifRes.data.data?.unreadCount || 0);
        } catch (_) {
          setUnreadAlertsCount(0);
        }

        // 5. Fetch real tutors from MongoDB
        try {
          const searchRes = await client.get('/search?limit=3&verifiedOnly=true');
          let tutorsList = searchRes.data.data?.tutors || [];
          if (tutorsList.length === 0) {
            // Fallback to any active tutors if verified filter is empty
            const allTutorsRes = await client.get('/search?limit=3');
            tutorsList = allTutorsRes.data.data?.tutors || [];
          }
          setRecommendedTutors(tutorsList);
        } catch (_) {
          setRecommendedTutors([]);
        }

        // 6. Fetch real courses from MongoDB
        try {
          const coursesRes = await client.get('/courses?limit=2&published=true');
          setRecommendedCourses(coursesRes.data.data?.courses || []);
        } catch (_) {
          setRecommendedCourses([]);
        }

      } catch (err) {
        console.error('Dashboard data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleContactClick = (tutor) => {
    const id = tutor.user?._id || tutor._id;
    setSelectedTutorId(id);
    setUnlockModalOpen(true);
  };

  const handleReferClick = () => {
    const refLink = `${window.location.origin}/register?ref=${user?._id || ''}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(refLink);
      showToast('Referral link copied to clipboard! Share with friends.', 'success');
    } else {
      showToast('Invite friends to MentorNearby and earn reward unlocks!', 'info');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const contactedCount = unlocks.length;
  const unlocksUsed = user?.unlocksUsed !== undefined ? user.unlocksUsed : contactedCount;
  const userName = user?.name || 'Student';
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <div className="sd-layout">
      
      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div
          className="sd-sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ========================================================
          LEFT SIDEBAR
          ======================================================== */}
      <aside className={`sd-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sd-sidebar-top">
          
          {/* Brand Logo */}
          <Link to="/" className="sd-logo-link">
            <img
              src="/logo.png"
              alt="MentorNearby"
              className="sd-logo-img"
            />
            <div className="sd-logo-text-group">
              <span className="sd-logo-name">MentorNearby</span>
              <span className="sd-logo-tagline">Find Mentor. Learn Better.</span>
            </div>
          </Link>

          {/* Navigation Menu */}
          <nav aria-label="Student Dashboard Navigation">
            <ul className="sd-nav-list">
              <li className="sd-nav-item">
                <Link to="/dashboard" className="sd-nav-link active">
                  <div className="sd-nav-left">
                    <span className="sd-nav-icon">🏠</span>
                    <span>Dashboard</span>
                  </div>
                </Link>
              </li>

              <li className="sd-nav-item">
                <Link to="/search" className="sd-nav-link">
                  <div className="sd-nav-left">
                    <span className="sd-nav-icon">🔍</span>
                    <span>Find Tutors</span>
                  </div>
                </Link>
              </li>

              <li className="sd-nav-item">
                <Link to="/courses" className="sd-nav-link">
                  <div className="sd-nav-left">
                    <span className="sd-nav-icon">🎓</span>
                    <span>Courses</span>
                  </div>
                </Link>
              </li>

              <li className="sd-nav-item">
                <Link to="/study-resources" className="sd-nav-link">
                  <div className="sd-nav-left">
                    <span className="sd-nav-icon">📖</span>
                    <span>Study Resources</span>
                  </div>
                </Link>
              </li>

              <li className="sd-nav-item">
                <Link to="/books" className="sd-nav-link">
                  <div className="sd-nav-left">
                    <span className="sd-nav-icon">📚</span>
                    <span>NCERT & Free Books</span>
                  </div>
                </Link>
              </li>

              <li className="sd-nav-item">
                <Link to="/messages" className="sd-nav-link">
                  <div className="sd-nav-left">
                    <span className="sd-nav-icon">💬</span>
                    <span>Messages</span>
                  </div>
                  {unreadMessagesCount > 0 && (
                    <span className="sd-nav-badge">{unreadMessagesCount}</span>
                  )}
                </Link>
              </li>

              <li className="sd-nav-item">
                <Link to="/notifications" className="sd-nav-link">
                  <div className="sd-nav-left">
                    <span className="sd-nav-icon">🔔</span>
                    <span>Alerts</span>
                  </div>
                  {unreadAlertsCount > 0 && (
                    <span className="sd-nav-badge">{unreadAlertsCount}</span>
                  )}
                </Link>
              </li>

              <li className="sd-nav-item">
                <Link to="/bookmarks" className="sd-nav-link">
                  <div className="sd-nav-left">
                    <span className="sd-nav-icon">🔖</span>
                    <span>Bookmarks</span>
                  </div>
                </Link>
              </li>

              <li className="sd-nav-item">
                <Link to="/my-courses" className="sd-nav-link">
                  <div className="sd-nav-left">
                    <span className="sd-nav-icon">📺</span>
                    <span>My Courses</span>
                  </div>
                </Link>
              </li>

              <li className="sd-nav-item">
                <Link to="/student/purchases" className="sd-nav-link">
                  <div className="sd-nav-left">
                    <span className="sd-nav-icon">🛍️</span>
                    <span>My Purchases</span>
                  </div>
                </Link>
              </li>

              <li className="sd-nav-item">
                <Link to="/settings" className="sd-nav-link">
                  <div className="sd-nav-left">
                    <span className="sd-nav-icon">⚙️</span>
                    <span>Settings</span>
                  </div>
                </Link>
              </li>

              <li className="sd-nav-item">
                <Link to="/contact" className="sd-nav-link">
                  <div className="sd-nav-left">
                    <span className="sd-nav-icon">❓</span>
                    <span>Help & Support</span>
                  </div>
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        {/* Refer & Earn Sidebar Card */}
        <div className="sd-refer-card">
          <div className="sd-refer-gift-icon" aria-hidden="true">🎁</div>
          <h4 className="sd-refer-title">Refer &amp; Earn!</h4>
          <p className="sd-refer-desc">Invite your friends and earn exciting rewards.</p>
          <button
            type="button"
            className="sd-refer-btn"
            onClick={handleReferClick}
          >
            Refer Now
          </button>
        </div>
      </aside>

      {/* ========================================================
          MAIN DASHBOARD CANVAS
          ======================================================== */}
      <div className="sd-main">
        
        {/* Top Navbar */}
        <header className="sd-topbar">
          <div className="sd-topbar-left">
            <button
              type="button"
              className="sd-hamburger-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle Sidebar Navigation"
            >
              ☰
            </button>

            <form onSubmit={handleSearchSubmit} className="sd-search-form" role="search">
              <input
                type="text"
                className="sd-search-input"
                placeholder="Search for tutors, subjects or courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="sd-search-icon-btn" aria-label="Submit Search">
                🔍
              </button>
            </form>
          </div>

          <div className="sd-topbar-right">
            {/* Theme Toggle */}
            <ThemeSwitcher compact={false} />

            {/* Messages Icon */}
            <Link to="/messages" className="sd-icon-btn" aria-label="Messages">
              <span>💬</span>
              {unreadMessagesCount > 0 && (
                <span className="sd-topbar-badge">{unreadMessagesCount}</span>
              )}
            </Link>

            {/* Notifications Icon */}
            <Link to="/notifications" className="sd-icon-btn" aria-label="Notifications">
              <span>🔔</span>
              {unreadAlertsCount > 0 && (
                <span className="sd-topbar-badge">{unreadAlertsCount}</span>
              )}
            </Link>

            {/* User Profile Widget */}
            <div className="sd-user-dropdown-wrap" ref={dropdownRef}>
              <button
                type="button"
                className="sd-user-btn"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                aria-expanded={userDropdownOpen}
              >
                <div className="sd-user-avatar">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={userName} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span>{userInitial}</span>
                  )}
                </div>
                <div className="sd-user-meta">
                  <span className="sd-user-name">{userName}</span>
                  <span className="sd-user-role">Student / Parent</span>
                </div>
                <span className="sd-user-chevron">⌄</span>
              </button>

              {userDropdownOpen && (
                <div className="sd-dropdown-menu" role="menu">
                  <Link to="/profile" className="sd-dropdown-item" onClick={() => setUserDropdownOpen(false)}>
                    <span>👤</span> Profile Details
                  </Link>
                  <Link to="/saved-tutors" className="sd-dropdown-item" onClick={() => setUserDropdownOpen(false)}>
                    <span>⭐</span> Saved Tutors
                  </Link>
                  <Link to="/settings" className="sd-dropdown-item" onClick={() => setUserDropdownOpen(false)}>
                    <span>⚙️</span> Account Settings
                  </Link>
                  <div style={{ height: '1px', background: '#f1f5f9', margin: '4px 0' }}></div>
                  <button type="button" className="sd-dropdown-item danger" onClick={handleLogout}>
                    <span>🚪</span> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dashboard Content Canvas */}
        <main className="sd-canvas">
          
          {/* ========================================================
              1. WELCOME HERO BANNER
              ======================================================== */}
          <section className="sd-hero-card" aria-labelledby="sd-welcome-heading">
            <div className="sd-hero-left">
              <h1 className="sd-hero-title" id="sd-welcome-heading">
                Welcome back, {userName} 👋
              </h1>
              <p className="sd-hero-subtitle">
                Find the right mentor and continue your learning journey.
              </p>
              <div className="sd-hero-actions">
                <Link to="/search" className="sd-hero-btn-primary">
                  <span>👤</span> Find a Tutor
                </Link>
                <Link to="/courses" className="sd-hero-btn-secondary">
                  <span>📖</span> Explore Courses
                </Link>
              </div>
            </div>

            <div className="sd-hero-illustration" aria-hidden="true">
              <BooksGraduationIllustration />
            </div>
          </section>

          {/* ========================================================
              2. FOUR STAT / KPI CARDS (REAL DATA ONLY)
              ======================================================== */}
          <section className="sd-stats-row" aria-label="Student Overview Statistics">
            {/* Card 1: Tutors Contacted */}
            <div className="sd-stat-card">
              <div className="sd-stat-icon-wrap red">
                <span>❤️</span>
              </div>
              <div className="sd-stat-content">
                <span className="sd-stat-label">Tutors Contacted</span>
                <span className="sd-stat-number">{contactedCount}</span>
                <span className="sd-stat-subtext">Keep connecting!</span>
              </div>
            </div>

            {/* Card 2: Saved Tutors */}
            <div className="sd-stat-card">
              <div className="sd-stat-icon-wrap amber">
                <span>⭐</span>
              </div>
              <div className="sd-stat-content">
                <span className="sd-stat-label">Saved Tutors</span>
                <span className="sd-stat-number">{savedCount}</span>
                <span className="sd-stat-subtext">Save your favorite tutors</span>
              </div>
            </div>

            {/* Card 3: Active Requests */}
            <div className="sd-stat-card">
              <div className="sd-stat-icon-wrap purple">
                <span>✉️</span>
              </div>
              <div className="sd-stat-content">
                <span className="sd-stat-label">Active Requests</span>
                <span className="sd-stat-number">{activeRequestsCount}</span>
                <span className="sd-stat-subtext">Awaiting response</span>
              </div>
            </div>

            {/* Card 4: Contact Unlocks Used */}
            <div className="sd-stat-card">
              <div className="sd-stat-icon-wrap green">
                <span>🔒</span>
              </div>
              <div className="sd-stat-content">
                <span className="sd-stat-label">Contact Unlocks Used</span>
                <span className="sd-stat-number">{unlocksUsed}</span>
                <span className="sd-stat-subtext">Unlock to view contacts</span>
              </div>
            </div>
          </section>

          {/* ========================================================
              3. TWO-COLUMN MIDDLE SECTION (REAL DATA ONLY)
              ======================================================== */}
          <div className="sd-middle-section">
            
            {/* COLUMN 1: RECOMMENDED COURSES */}
            <section className="sd-courses-column" aria-labelledby="sd-rec-courses-heading">
              <div className="sd-section-header">
                <h2 className="sd-section-title" id="sd-rec-courses-heading">
                  <span>📖</span> Recommended Courses for You
                </h2>
                <Link to="/courses" className="sd-section-link">
                  Explore All Courses →
                </Link>
              </div>

              {recommendedCourses.length > 0 ? (
                <div className="sd-courses-grid">
                  {recommendedCourses.map((course) => {
                    const isClass12 = course.classLevel === '12' || (course.title && course.title.includes('12'));
                    const bannerClass = isClass12 ? 'class-12' : 'class-10';
                    const classLabel = course.classLevel ? `CLASS ${course.classLevel}` : 'PYQ MASTERY';

                    return (
                      <div key={course._id} className="sd-course-card">
                        <div className={`sd-course-banner ${bannerClass}`}>
                          <div>
                            <div className="sd-cb-top-tag">{classLabel}</div>
                            <div className="sd-cb-main-heading">{course.subject || 'PYQ Mastery'}</div>
                            <div className="sd-cb-sub-badge">{course.pyqYearsRange || '10+ YEARS BOARD PYQS'}</div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="sd-cb-solutions-tag">
                              <span className="sd-cb-dot"></span> VIDEO SOLUTIONS
                            </div>
                            <div className="sd-cb-youtube-icon">▶</div>
                          </div>
                        </div>

                        <div className="sd-course-body">
                          <h3 className="sd-course-title">{course.title}</h3>
                          <ul className="sd-course-feature-list">
                            <li className="sd-course-feature-item">
                              <span className="check">✓</span> {course.pyqYearsRange || '10+ Years Board PYQs'}
                            </li>
                            <li className="sd-course-feature-item">
                              <span className="check">✓</span> Solved Papers &amp; Video Solutions
                            </li>
                          </ul>
                          <Link to={`/courses/${course.slug || course._id}`} className="sd-course-yt-btn">
                            <span>▶</span> Explore Course
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="sd-empty-state-box">
                  <span className="sd-empty-icon">🎓</span>
                  <p className="sd-empty-title">No courses published yet</p>
                  <p className="sd-empty-desc">Check back soon for solved board examination papers.</p>
                  <Link to="/courses" className="sd-empty-btn">Browse Catalog</Link>
                </div>
              )}
            </section>

            {/* COLUMN 2: FIND TRUSTED TUTORS NEAR YOU */}
            <section className="sd-tutors-column" aria-labelledby="sd-trusted-tutors-heading">
              <div className="sd-section-header">
                <h2 className="sd-section-title" id="sd-trusted-tutors-heading">
                  <span>🧑‍🏫</span> Find Trusted Tutors Near You
                </h2>
                <Link to="/search" className="sd-section-link">
                  View All Tutors →
                </Link>
              </div>

              {recommendedTutors.length > 0 ? (
                <div className="sd-tutors-grid">
                  {recommendedTutors.map((tutor) => {
                    const tutorId = tutor.user?._id || tutor._id;
                    const name = tutor.name || tutor.user?.name || 'Verified Educator';
                    const subject = Array.isArray(tutor.subjects) && tutor.subjects.length > 0
                      ? tutor.subjects.slice(0, 2).join(', ')
                      : (tutor.subject || 'General Studies');
                    const locationText = tutor.location?.city
                      ? `${tutor.location.city}${tutor.location.state ? `, ${tutor.location.state}` : ''}`
                      : 'Location Available';
                    const rating = tutor.averageRating ? Number(tutor.averageRating).toFixed(1) : '5.0';
                    const reviews = tutor.totalReviews || 0;
                    const photoUrl = tutor.profilePhoto?.url || tutor.user?.avatar || '';
                    const isVerified = tutor.kycStatus === 'VERIFIED';

                    return (
                      <div key={tutorId} className="sd-tutor-card">
                        <div className="sd-tutor-photo-wrap">
                          {photoUrl ? (
                            <img
                              src={photoUrl}
                              alt={name}
                              className="sd-tutor-photo"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <span className="font-bold text-blue-600 text-lg">
                              {name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>

                        {isVerified && (
                          <div className="sd-tutor-verified-badge">
                            <span>🛡️</span> Verified Tutor
                          </div>
                        )}

                        <h3 className="sd-tutor-name" title={name}>{name}</h3>
                        <p className="sd-tutor-subject" title={subject}>{subject}</p>
                        <p className="sd-tutor-location">📍 {locationText}</p>
                        <div className="sd-tutor-rating">
                          <span>⭐</span> {rating} {reviews > 0 ? `(${reviews})` : ''}
                        </div>

                        <div className="sd-tutor-actions">
                          <Link to={`/tutor/${tutorId}`} className="sd-tutor-btn-profile">
                            View Profile
                          </Link>
                          <button
                            type="button"
                            className="sd-tutor-btn-contact"
                            onClick={() => handleContactClick(tutor)}
                          >
                            Contact Tutor
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="sd-empty-state-box">
                  <span className="sd-empty-icon">🧑‍🏫</span>
                  <p className="sd-empty-title">No verified tutors found near you</p>
                  <p className="sd-empty-desc">Try searching across all subjects or expanding your location.</p>
                  <Link to="/search" className="sd-empty-btn">Find Tutors</Link>
                </div>
              )}
            </section>
          </div>

          {/* ========================================================
              4. STUDY RESOURCES SECTION
              ======================================================== */}
          <section className="sd-resources-section" aria-labelledby="sd-resources-heading">
            <div className="sd-section-header">
              <h2 className="sd-section-title" id="sd-resources-heading">
                <span>📑</span> Study Resources
              </h2>
            </div>

            <div className="sd-resources-grid">
              {/* Resource 1 */}
              <Link to="/study-resources" className="sd-resource-card formula">
                <div className="sd-resource-icon-box blue">
                  <span>📄</span>
                </div>
                <div className="sd-resource-text">
                  <span className="sd-resource-title">Formula Sheets</span>
                  <span className="sd-resource-desc">Important formulas at one place</span>
                </div>
                <span className="sd-resource-arrow">→</span>
              </Link>

              {/* Resource 2 */}
              <Link to="/study-resources" className="sd-resource-card questions">
                <div className="sd-resource-icon-box green">
                  <span>❓</span>
                </div>
                <div className="sd-resource-text">
                  <span className="sd-resource-title">Important Questions</span>
                  <span className="sd-resource-desc">Chapter-wise important questions</span>
                </div>
                <span className="sd-resource-arrow">→</span>
              </Link>

              {/* Resource 3 */}
              <Link to="/books" className="sd-resource-card ncert">
                <div className="sd-resource-icon-box indigo">
                  <span>📖</span>
                </div>
                <div className="sd-resource-text">
                  <span className="sd-resource-title">NCERT &amp; Free Books</span>
                  <span className="sd-resource-desc">Access NCERT books and more</span>
                </div>
                <span className="sd-resource-arrow">→</span>
              </Link>

              {/* Resource 4 */}
              <Link to="/study-resources" className="sd-resource-card revision">
                <div className="sd-resource-icon-box red">
                  <span>📑</span>
                </div>
                <div className="sd-resource-text">
                  <span className="sd-resource-title">Revision Material</span>
                  <span className="sd-resource-desc">Notes &amp; PDFs for quick revision</span>
                </div>
                <span className="sd-resource-arrow">→</span>
              </Link>
            </div>
          </section>

        </main>
      </div>

      {/* Contact Unlock Modal */}
      {selectedTutorId && (
        <UnlockContactModal
          isOpen={unlockModalOpen}
          onClose={() => {
            setUnlockModalOpen(false);
            setSelectedTutorId(null);
          }}
          tutorId={selectedTutorId}
        />
      )}

    </div>
  );
};

export default StudentDashboardPage;
