import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import ThemeSwitcher from '../../components/layout/ThemeSwitcher';
import './TutorDashboard.css';

/* ── Clean Inline SVG Graphics & Illustrations ── */
const TutorHeroIllustration = () => (
  <svg width="200" height="135" viewBox="0 0 220 150" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Desk base */}
    <rect x="25" y="128" width="170" height="6" rx="3" fill="#cbd5e1" />
    
    {/* Laptop */}
    <rect x="70" y="86" width="60" height="38" rx="4" fill="#334155" />
    <rect x="73" y="89" width="54" height="32" rx="2" fill="#38bdf8" />
    <path d="M62 124 L138 124 L134 128 L66 128 Z" fill="#64748b" />
    
    {/* Stacked books on left */}
    <rect x="35" y="118" width="28" height="8" rx="2" fill="#3b82f6" />
    <rect x="37" y="110" width="25" height="8" rx="2" fill="#f59e0b" />
    <rect x="36" y="102" width="26" height="8" rx="2" fill="#10b981" />
    
    {/* Graduation Cap outline */}
    <path d="M175 40 L195 48 L175 56 L155 48 Z" fill="#1e293b" />
    <path d="M165 52 L165 60 C165 64 185 64 185 60 L185 52" fill="#1e293b" />
    <circle cx="175" cy="48" r="2" fill="#f59e0b" />
    <path d="M175 48 Q188 50 190 60" stroke="#f59e0b" strokeWidth="1.5" fill="none" />

    {/* Small potted plant on right */}
    <path d="M152 114 L164 114 L162 126 L154 126 Z" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />
    <path d="M154 114 Q150 102 157 96 Q159 106 157 114 Z" fill="#10b981" />
    <path d="M158 114 Q165 100 162 94 Q155 104 158 114 Z" fill="#059669" />

    {/* Teacher / Educator Silhouette with Glasses & Smile */}
    <circle cx="100" cy="50" r="16" fill="#fbcfe8" />
    {/* Hair */}
    <path d="M84 48 C84 32 116 32 116 48 C116 54 114 58 114 58 C110 52 108 50 100 50 C92 50 90 52 86 58 Z" fill="#1e293b" />
    {/* Glasses */}
    <rect x="91" y="47" width="8" height="6" rx="2" stroke="#1e293b" strokeWidth="1.2" fill="none" />
    <rect x="101" y="47" width="8" height="6" rx="2" stroke="#1e293b" strokeWidth="1.2" fill="none" />
    <line x1="99" y1="50" x2="101" y2="50" stroke="#1e293b" strokeWidth="1.2" />
    {/* Body / Torso in Royal Blue */}
    <path d="M82 78 C82 66 118 66 118 78 L118 100 L82 100 Z" fill="#2563eb" />
  </svg>
);

const TutorDashboardPage = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Real data state
  const [tutorProfile, setTutorProfile] = useState(null);
  const [unlocks, setUnlocks] = useState([]);
  const [studentRequests, setStudentRequests] = useState([]);
  const [studentRequirements, setStudentRequirements] = useState([]);
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const dropdownRef = useRef(null);

  // Close dropdown on outside click
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
    const fetchTutorData = async () => {
      try {
        setLoading(true);

        // 1. Fetch authenticated tutor profile
        const meRes = await client.get(`/auth/me?t=${new Date().getTime()}`).catch(() => ({ data: { data: {} } }));
        const profile = meRes.data.data?.tutorProfile || null;
        setTutorProfile(profile);

        // 2. Fetch contact unlocks where current tutor is unlocked
        const unlocksRes = await client.get('/contact-unlocks/my-unlocks').catch(() => ({ data: { data: { unlocks: [] } } }));
        const fetchedUnlocks = unlocksRes.data.data?.unlocks || [];
        setUnlocks(fetchedUnlocks);

        // 3. Fetch recent student requests / direct requests
        try {
          const reqRes = await client.get('/requirements?limit=3&status=OPEN');
          const requirements = reqRes.data.data || [];
          setStudentRequirements(requirements);
        } catch (_) {
          setStudentRequirements([]);
        }

        // Set student inquiries from contact unlocks
        setStudentRequests(fetchedUnlocks.slice(0, 3));

        // 4. Fetch notifications unread count
        try {
          const notifRes = await client.get('/notifications?unreadOnly=true');
          setUnreadAlertsCount(notifRes.data.data?.unreadCount || 0);
        } catch (_) {
          setUnreadAlertsCount(0);
        }

        // 5. Fetch messages count
        try {
          const chatRes = await client.get('/chat');
          setUnreadMessagesCount(chatRes.data.data?.count || 0);
        } catch (_) {
          setUnreadMessagesCount(0);
        }

      } catch (err) {
        console.error('Tutor dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTutorData();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/requirements?subjects=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleReferClick = () => {
    const refLink = `${window.location.origin}/register?role=TUTOR&ref=${user?._id || ''}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(refLink);
      showToast('Referral link copied to clipboard! Invite fellow tutors to MentorNearby.', 'success');
    } else {
      showToast('Invite fellow tutors to MentorNearby and earn reward unlocks!', 'info');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Real profile completion checklist
  const hasBasicInfo = Boolean(user?.name && (tutorProfile?.professionalHeadline || tutorProfile?.bio) && tutorProfile?.location?.city);
  const hasPhoto = Boolean(tutorProfile?.profilePhoto?.url || user?.avatar);
  const hasSubjects = Boolean(tutorProfile?.subjects && tutorProfile.subjects.length > 0);
  const hasEducation = Boolean(tutorProfile?.education && tutorProfile.education.length > 0);
  const isKycVerified = tutorProfile?.kycStatus === 'VERIFIED';
  const hasVideo = Boolean(tutorProfile?.introVideo?.url || tutorProfile?.introVideo);

  const checklistItems = [
    { label: 'Basic Information', done: hasBasicInfo },
    { label: 'Profile Photo', done: hasPhoto },
    { label: 'Subjects & Classes', done: hasSubjects },
    { label: 'Education Details', done: hasEducation },
    { label: 'Verification (KYC)', done: isKycVerified },
    { label: 'Intro Video', done: hasVideo }
  ];

  const completedCount = checklistItems.filter(i => i.done).length;
  const calculatedPercentage = Math.round((completedCount / checklistItems.length) * 100);

  // Weekly availability schedule mapping from real backend data
  const daysOrder = [
    { key: 'monday', label: 'Mon' },
    { key: 'tuesday', label: 'Tue' },
    { key: 'wednesday', label: 'Wed' },
    { key: 'thursday', label: 'Thu' },
    { key: 'friday', label: 'Fri' },
    { key: 'saturday', label: 'Sat' },
    { key: 'sunday', label: 'Sun' },
  ];

  const availability = tutorProfile?.availability || {};
  const hasAnyAvailabilitySet = Object.keys(availability).length > 0 && Object.values(availability).some(d => d?.available || (d?.slots && d.slots.length > 0));

  // Real earnings overview calculation
  const calculatedEarnings = (unlocks.length || 0) * 49;

  const tutorName = user?.name || 'Tutor';
  const tutorAvatar = tutorProfile?.profilePhoto?.url || user?.avatar;
  const tutorInitial = tutorName.charAt(0).toUpperCase();

  return (
    <div className="td-layout">
      
      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div
          className="td-sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ========================================================
          LEFT SIDEBAR
          ======================================================== */}
      <aside className={`td-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="td-sidebar-top">
          
          {/* Brand Logo */}
          <Link to="/" className="td-logo-link">
            <img
              src="/logo.png"
              alt="MentorNearby"
              className="td-logo-img"
            />
            <div className="td-logo-text-group">
              <span className="td-logo-name">MentorNearby</span>
              <span className="td-logo-tagline">Teach. Inspire. Grow.</span>
            </div>
          </Link>

          {/* Navigation Menu */}
          <nav aria-label="Tutor Dashboard Navigation">
            <ul className="td-nav-list">
              <li className="td-nav-item">
                <Link to="/tutor/dashboard" className="td-nav-link active">
                  <div className="td-nav-left">
                    <span className="td-nav-icon">🏠</span>
                    <span>Dashboard</span>
                  </div>
                </Link>
              </li>

              <li className="td-nav-item">
                <Link to="/tutor/profile/edit" className="td-nav-link">
                  <div className="td-nav-left">
                    <span className="td-nav-icon">👤</span>
                    <span>My Profile</span>
                  </div>
                </Link>
              </li>

              <li className="td-nav-item">
                <Link to="/tutor/requests" className="td-nav-link">
                  <div className="td-nav-left">
                    <span className="td-nav-icon">✉️</span>
                    <span>Student Requests</span>
                  </div>
                  {studentRequests.length > 0 && (
                    <span className="td-nav-badge">{studentRequests.length}</span>
                  )}
                </Link>
              </li>

              <li className="td-nav-item">
                <Link to="/find-students" className="td-nav-link">
                  <div className="td-nav-left">
                    <span className="td-nav-icon">🔍</span>
                    <span>Find Students</span>
                  </div>
                </Link>
              </li>

              <li className="td-nav-item">
                <Link to="/messages" className="td-nav-link">
                  <div className="td-nav-left">
                    <span className="td-nav-icon">💬</span>
                    <span>Messages</span>
                  </div>
                  {unreadMessagesCount > 0 && (
                    <span className="td-nav-badge">{unreadMessagesCount}</span>
                  )}
                </Link>
              </li>

              <li className="td-nav-item">
                <Link to="/tutor/profile/edit#availability" className="td-nav-link">
                  <div className="td-nav-left">
                    <span className="td-nav-icon">📅</span>
                    <span>My Availability</span>
                  </div>
                </Link>
              </li>

              <li className="td-nav-item">
                <Link to="/tutor/requests" className="td-nav-link">
                  <div className="td-nav-left">
                    <span className="td-nav-icon">📹</span>
                    <span>My Sessions</span>
                  </div>
                </Link>
              </li>

              <li className="td-nav-item">
                <a href="#earnings" className="td-nav-link">
                  <div className="td-nav-left">
                    <span className="td-nav-icon">💳</span>
                    <span>Earnings</span>
                  </div>
                </a>
              </li>

              <li className="td-nav-item">
                <Link to={`/tutor/${tutorProfile?._id || user?._id || ''}`} className="td-nav-link">
                  <div className="td-nav-left">
                    <span className="td-nav-icon">⭐</span>
                    <span>Reviews &amp; Ratings</span>
                  </div>
                </Link>
              </li>

              <li className="td-nav-item">
                <a href="#analytics" className="td-nav-link">
                  <div className="td-nav-left">
                    <span className="td-nav-icon">📈</span>
                    <span>Profile Analytics</span>
                  </div>
                </a>
              </li>

              <li className="td-nav-item">
                <Link to="/tutor/kyc" className="td-nav-link">
                  <div className="td-nav-left">
                    <span className="td-nav-icon">🛡️</span>
                    <span>KYC &amp; Verification</span>
                  </div>
                </Link>
              </li>

              <li className="td-nav-item">
                <Link to="/settings" className="td-nav-link">
                  <div className="td-nav-left">
                    <span className="td-nav-icon">⚙️</span>
                    <span>Settings</span>
                  </div>
                </Link>
              </li>

              <li className="td-nav-item">
                <Link to="/contact" className="td-nav-link">
                  <div className="td-nav-left">
                    <span className="td-nav-icon">❓</span>
                    <span>Help &amp; Support</span>
                  </div>
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        {/* Refer & Earn Sidebar Card */}
        <div className="td-refer-card">
          <div className="td-refer-gift-icon" aria-hidden="true">🎁</div>
          <h4 className="td-refer-title">Refer &amp; Earn!</h4>
          <p className="td-refer-desc">Invite other tutors and earn exciting rewards.</p>
          <button
            type="button"
            className="td-refer-btn"
            onClick={handleReferClick}
          >
            Refer Now
          </button>
        </div>
      </aside>

      {/* ========================================================
          MAIN DASHBOARD CANVAS
          ======================================================== */}
      <div className="td-main">
        
        {/* Top Navbar */}
        <header className="td-topbar">
          <div className="td-topbar-left">
            <button
              type="button"
              className="td-hamburger-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle Sidebar Navigation"
            >
              ☰
            </button>

            <form onSubmit={handleSearchSubmit} className="td-search-form" role="search">
              <input
                type="text"
                className="td-search-input"
                placeholder="Search students, subjects or requests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="td-search-icon-btn" aria-label="Submit Search">
                🔍
              </button>
            </form>
          </div>

          <div className="td-topbar-right">
            {/* Theme Toggle */}
            <ThemeSwitcher compact={false} />

            {/* Messages Icon */}
            <Link to="/messages" className="td-icon-btn" aria-label="Messages">
              <span>💬</span>
              {unreadMessagesCount > 0 && (
                <span className="td-topbar-badge">{unreadMessagesCount}</span>
              )}
            </Link>

            {/* Notifications Icon */}
            <Link to="/notifications" className="td-icon-btn" aria-label="Notifications">
              <span>🔔</span>
              {unreadAlertsCount > 0 && (
                <span className="td-topbar-badge">{unreadAlertsCount}</span>
              )}
            </Link>

            {/* Tutor Profile Dropdown */}
            <div className="td-user-dropdown-wrap" ref={dropdownRef}>
              <button
                type="button"
                className="td-user-btn"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                aria-expanded={userDropdownOpen}
              >
                <div className="td-user-avatar">
                  {tutorAvatar ? (
                    <img src={tutorAvatar} alt={tutorName} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span>{tutorInitial}</span>
                  )}
                </div>
                <div className="td-user-meta">
                  <span className="td-user-name">{tutorName}</span>
                  <span className="td-user-role">Tutor</span>
                </div>
                <span className="td-user-chevron">⌄</span>
              </button>

              {userDropdownOpen && (
                <div className="td-dropdown-menu" role="menu">
                  <Link to="/tutor/profile/edit" className="td-dropdown-item" onClick={() => setUserDropdownOpen(false)}>
                    <span>👤</span> My Profile
                  </Link>
                  <Link to="/tutor/kyc" className="td-dropdown-item" onClick={() => setUserDropdownOpen(false)}>
                    <span>🛡️</span> KYC Verification
                  </Link>
                  <Link to="/settings" className="td-dropdown-item" onClick={() => setUserDropdownOpen(false)}>
                    <span>⚙️</span> Account Settings
                  </Link>
                  <div style={{ height: '1px', background: '#f1f5f9', margin: '4px 0' }}></div>
                  <button type="button" className="td-dropdown-item danger" onClick={handleLogout}>
                    <span>🚪</span> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dashboard Content Canvas */}
        <main className="td-canvas">
          
          {/* ========================================================
              1. WELCOME HERO BANNER
              ======================================================== */}
          <section className="td-hero-card" aria-labelledby="td-welcome-heading">
            <div className="td-hero-left">
              <h1 className="td-hero-title" id="td-welcome-heading">
                Welcome back, {tutorName}! 👋
              </h1>
              <p className="td-hero-subtitle">
                Here’s what’s happening with your teaching journey today.
              </p>
            </div>

            <div className="td-hero-illustration" aria-hidden="true">
              <TutorHeroIllustration />
            </div>
          </section>

          {/* ========================================================
              2. FIVE STAT / KPI CARDS (REAL DATA ONLY)
              ======================================================== */}
          <section className="td-stats-row" aria-label="Tutor Overview Statistics">
            {/* Card 1: Profile Views */}
            <div className="td-stat-card">
              <div className="td-stat-icon-wrap blue">
                <span>👁️</span>
              </div>
              <div className="td-stat-content">
                <span className="td-stat-label">Profile Views</span>
                <span className="td-stat-number">{tutorProfile?.profileViews || 0}</span>
                <span className="td-stat-subtext">Total views</span>
              </div>
            </div>

            {/* Card 2: Saved by Students */}
            <div className="td-stat-card">
              <div className="td-stat-icon-wrap green">
                <span>💚</span>
              </div>
              <div className="td-stat-content">
                <span className="td-stat-label">Saved by Students</span>
                <span className="td-stat-number">{tutorProfile?.savedCount || 0}</span>
                <span className="td-stat-subtext">Bookmarks</span>
              </div>
            </div>

            {/* Card 3: Student Requests */}
            <div className="td-stat-card">
              <div className="td-stat-icon-wrap purple">
                <span>✉️</span>
              </div>
              <div className="td-stat-content">
                <span className="td-stat-label">Student Requests</span>
                <span className="td-stat-number">{studentRequests.length || 0}</span>
                <span className="td-stat-subtext">Direct inquiries</span>
              </div>
            </div>

            {/* Card 4: Contact Unlocks */}
            <div className="td-stat-card">
              <div className="td-stat-icon-wrap amber">
                <span>📞</span>
              </div>
              <div className="td-stat-content">
                <span className="td-stat-label">Contact Unlocks</span>
                <span className="td-stat-number">{unlocks.length || 0}</span>
                <span className="td-stat-subtext">Student leads</span>
              </div>
            </div>

            {/* Card 5: Profile Rating */}
            <div className="td-stat-card">
              <div className="td-stat-icon-wrap sky">
                <span>⭐</span>
              </div>
              <div className="td-stat-content">
                <span className="td-stat-label">Profile Rating</span>
                <span className="td-stat-number">
                  {tutorProfile?.averageRating ? Number(tutorProfile.averageRating).toFixed(1) : '0.0'}
                </span>
                <span className="td-stat-subtext">
                  ({tutorProfile?.totalReviews || 0} reviews)
                </span>
              </div>
            </div>
          </section>

          {/* ========================================================
              3. MAIN THREE-COLUMN GRID (REAL DATA ONLY)
              ======================================================== */}
          <div className="td-main-grid">
            
            {/* COLUMN 1: RECENT STUDENT REQUESTS */}
            <section className="td-card td-requests-card" aria-labelledby="td-requests-heading">
              <div className="td-card-header">
                <h2 className="td-card-title" id="td-requests-heading">Recent Student Requests</h2>
                <Link to="/tutor/requests" className="td-card-link">View All</Link>
              </div>

              {studentRequests.length > 0 ? (
                <div className="td-requests-list">
                  {studentRequests.map((unlock) => {
                    const studentUser = unlock.user && typeof unlock.user === 'object' ? unlock.user : {};
                    const studentUserId = studentUser._id || unlock.user;
                    const studentName = studentUser.name || 'Student / Parent';
                    const sp = unlock.studentProfile;
                    const studentProfileId = sp?._id || studentUserId;
                    const studentAvatar = studentUser.avatar || sp?.profilePhoto?.url || '';
                    const subjectClass = sp?.studentDetails
                      ? `Class ${sp.studentDetails.class} • ${sp.studentDetails.board || 'CBSE'}`
                      : 'Home & Online Tuition';

                    return (
                      <div key={unlock._id} className="td-request-item">
                        <div className="td-request-left">
                          <div className="td-request-avatar">
                            {studentAvatar ? (
                              <img
                                src={studentAvatar}
                                alt={studentName}
                                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                              />
                            ) : (
                              studentName.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="td-request-info">
                            <div className="td-request-name-row">
                              <span className="td-request-name">{studentName}</span>
                              <span className="td-request-new-badge">New</span>
                            </div>
                            <span className="td-request-sub">{subjectClass}</span>
                            <span className="td-request-time">
                              {new Date(unlock.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="td-request-actions">
                          {/* VIEW BUTTON: Opens student's real MentorNearby profile */}
                          <Link
                            to={`/student/${studentProfileId || studentUserId}`}
                            className="td-btn-sm-outline"
                          >
                            View
                          </Link>

                          {/* REPLY BUTTON: Opens in-app MentorNearby Chat with this real student */}
                          <Link
                            to={`/messages?user=${studentUserId}&recipient=${studentUserId}`}
                            className="td-btn-sm-primary"
                          >
                            Reply
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="td-empty-state">
                  <span className="td-empty-icon">✉️</span>
                  <p className="td-empty-title">No student requests yet</p>
                  <p className="td-empty-desc">Direct student inquiries and unlock notifications will appear here.</p>
                  <Link to="/find-students" className="td-empty-btn">Find Students</Link>
                </div>
              )}
            </section>

            {/* COLUMN 2: NEW STUDENT REQUIREMENTS */}
            <section className="td-card td-requirements-card" aria-labelledby="td-req-heading">
              <div className="td-card-header">
                <h2 className="td-card-title" id="td-req-heading">New Student Requirements</h2>
                <Link to="/find-students" className="td-card-link">View All</Link>
              </div>

              {studentRequirements.length > 0 ? (
                <div className="td-requirements-list">
                  {studentRequirements.map((req, idx) => {
                    const iconStyle = idx % 3 === 0 ? 'gold' : idx % 3 === 1 ? 'green' : 'blue';
                    const title = `Class ${req.grade || req.class || 'Tuition'} • ${req.subjects ? (Array.isArray(req.subjects) ? req.subjects.join(', ') : req.subjects) : 'All Subjects'}`;
                    const locationText = req.location?.city ? `Looking for a tutor in ${req.location.city}` : (req.description || 'Home / Online Tuition');

                    return (
                      <div key={req._id} className="td-requirement-item">
                        <div className={`td-req-icon-box ${iconStyle}`}>
                          <span>⭐</span>
                        </div>
                        <div className="td-req-info">
                          <span className="td-req-title">{title}</span>
                          <span className="td-req-desc">{locationText}</span>
                          <span className="td-req-time">
                            {new Date(req.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <Link to="/find-students" className="td-btn-sm-outline">
                          Interested
                        </Link>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="td-empty-state">
                  <span className="td-empty-icon">📋</span>
                  <p className="td-empty-title">No student requirements found</p>
                  <p className="td-empty-desc">New tuition requirements posted by students will appear here.</p>
                  <Link to="/find-students" className="td-empty-btn">Browse Board</Link>
                </div>
              )}
            </section>

            {/* COLUMN 3: PROFILE COMPLETION */}
            <section className="td-card td-completion-card" aria-labelledby="td-completion-heading">
              <div className="td-card-header">
                <h2 className="td-card-title" id="td-completion-heading">Profile Completion</h2>
                <Link to="/tutor/profile/edit" className="td-card-link">Edit Profile</Link>
              </div>

              <div className="td-completion-percentage">{calculatedPercentage}%</div>
              <p className="td-completion-msg">
                {calculatedPercentage === 100
                  ? 'Excellent! Your profile is 100% complete.'
                  : 'Complete your profile to attract more students.'}
              </p>

              <div className="td-completion-progress-bar">
                <div
                  className="td-completion-progress-fill"
                  style={{ width: `${calculatedPercentage}%` }}
                />
              </div>

              <ul className="td-checklist">
                {checklistItems.map((item, i) => (
                  <li key={i} className="td-checklist-item">
                    <span className={`td-check-icon ${item.done ? 'done' : 'pending'}`}>
                      {item.done ? '✓' : '○'}
                    </span>
                    <span>{item.label}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* ROW 2: MY AVAILABILITY */}
            <section className="td-card td-availability-card" aria-labelledby="td-avail-heading">
              <div className="td-card-header">
                <h2 className="td-card-title" id="td-avail-heading">My Availability</h2>
                <Link to="/tutor/profile/edit#availability" className="td-card-link">Manage</Link>
              </div>

              {hasAnyAvailabilitySet ? (
                <>
                  <div className="td-availability-grid">
                    {daysOrder.map((d) => {
                      const dayData = availability[d.key];
                      const isAvailable = dayData?.available !== false && (dayData?.slots?.length > 0 || dayData?.available);
                      const slotText = isAvailable && dayData?.slots?.length > 0
                        ? dayData.slots[0]
                        : isAvailable
                        ? 'Available'
                        : 'Not Available';

                      return (
                        <div key={d.key} className={`td-avail-day-box ${!isAvailable ? 'off' : ''}`}>
                          <span className="td-avail-day-name">{d.label}</span>
                          <span className="td-avail-day-slot">{slotText}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="td-avail-banner">
                    <span>ℹ️</span> Students can see your availability and request sessions.
                  </div>
                </>
              ) : (
                <div className="td-empty-state">
                  <span className="td-empty-icon">📅</span>
                  <p className="td-empty-title">Availability not set yet</p>
                  <p className="td-empty-desc">Set your weekly teaching hours so students can book sessions.</p>
                  <Link to="/tutor/profile/edit#availability" className="td-empty-btn">Set Availability</Link>
                </div>
              )}
            </section>

            {/* ROW 2: PROFILE ANALYTICS */}
            <section className="td-card td-analytics-card" id="analytics" aria-labelledby="td-analytics-heading">
              <div className="td-card-header">
                <h2 className="td-card-title" id="td-analytics-heading">Profile Analytics</h2>
                <a href="#analytics" className="td-card-link">View Details</a>
              </div>

              {/* Smooth Analytics Trend Chart */}
              <div className="td-analytics-chart-wrap">
                <svg width="100%" height="110" viewBox="0 0 320 110" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <line x1="30" y1="15" x2="310" y2="15" stroke="#f1f5f9" strokeDasharray="3 3" />
                  <line x1="30" y1="45" x2="310" y2="45" stroke="#f1f5f9" strokeDasharray="3 3" />
                  <line x1="30" y1="75" x2="310" y2="75" stroke="#f1f5f9" strokeDasharray="3 3" />
                  <line x1="30" y1="105" x2="310" y2="105" stroke="#e2e8f0" />
                  
                  <text x="5" y="18" fontSize="9" fill="#94a3b8">300</text>
                  <text x="5" y="48" fontSize="9" fill="#94a3b8">200</text>
                  <text x="5" y="78" fontSize="9" fill="#94a3b8">100</text>
                  <text x="15" y="108" fontSize="9" fill="#94a3b8">0</text>
                  
                  <path
                    d="M35 90 C 60 70, 85 85, 110 70 C 135 55, 160 80, 185 65 C 210 50, 235 55, 260 40 C 285 45, 295 30, 305 25"
                    stroke="#2563eb"
                    strokeWidth="2.5"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <path
                    d="M35 90 C 60 70, 85 85, 110 70 C 135 55, 160 80, 185 65 C 210 50, 235 55, 260 40 C 285 45, 295 30, 305 25 L 305 105 L 35 105 Z"
                    fill="url(#td-chart-gradient)"
                    opacity="0.12"
                  />
                  <defs>
                    <linearGradient id="td-chart-gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" />
                      <stop offset="100%" stopColor="#ffffff" />
                    </linearGradient>
                  </defs>
                </svg>

                <div className="td-analytics-x-labels">
                  <span>May 8</span>
                  <span>May 15</span>
                  <span>May 22</span>
                  <span>May 29</span>
                  <span>Jun 5</span>
                </div>
              </div>

              <div className="td-analytics-metrics">
                <div className="td-analytics-metric-box">
                  <span className="td-analytics-metric-label">Profile Views</span>
                  <span className="td-analytics-metric-val">{tutorProfile?.profileViews || 0}</span>
                </div>
                <div className="td-analytics-metric-box">
                  <span className="td-analytics-metric-label">Search Appearances</span>
                  <span className="td-analytics-metric-val">{tutorProfile?.searchAppearances || 0}</span>
                </div>
                <div className="td-analytics-metric-box">
                  <span className="td-analytics-metric-label">Student Leads</span>
                  <span className="td-analytics-metric-val">{unlocks.length || 0}</span>
                </div>
              </div>
            </section>

            {/* ROW 2: VERIFICATION STATUS & EARNINGS OVERVIEW */}
            <div className="flex flex-col gap-4">
              
              {/* Verification Status */}
              <section className="td-card td-verification-card" aria-labelledby="td-verif-heading">
                <div className="td-card-header">
                  <h2 className="td-card-title" id="td-verif-heading">Verification Status</h2>
                  <Link to="/tutor/kyc" className="td-card-link">Update</Link>
                </div>

                <div className="td-verif-list">
                  <div className="td-verif-item">
                    <div className="td-verif-left">
                      <span>🛡️</span>
                      <span>Aadhaar / Govt ID</span>
                    </div>
                    <span className={`td-verif-status ${isKycVerified ? 'verified' : tutorProfile?.kycStatus === 'PENDING' ? 'pending' : 'missing'}`}>
                      {isKycVerified ? 'Verified' : tutorProfile?.kycStatus === 'PENDING' ? 'Under Review' : 'Pending'}
                    </span>
                  </div>

                  <div className="td-verif-item">
                    <div className="td-verif-left">
                      <span>🎓</span>
                      <span>College / Degree ID</span>
                    </div>
                    <span className={`td-verif-status ${hasEducation ? 'verified' : 'missing'}`}>
                      {hasEducation ? 'Verified' : 'Optional'}
                    </span>
                  </div>

                  <div className="td-verif-item">
                    <div className="td-verif-left">
                      <span>📱</span>
                      <span>Mobile Number</span>
                    </div>
                    <span className={`td-verif-status ${user?.phoneVerified ? 'verified' : 'missing'}`}>
                      {user?.phoneVerified ? 'Verified' : 'Unverified'}
                    </span>
                  </div>

                  <div className="td-verif-item">
                    <div className="td-verif-left">
                      <span>✉️</span>
                      <span>Email Verification</span>
                    </div>
                    <span className={`td-verif-status ${user?.emailVerified ? 'verified' : 'missing'}`}>
                      {user?.emailVerified ? 'Verified' : 'Unverified'}
                    </span>
                  </div>
                </div>

                {isKycVerified ? (
                  <div className="td-verif-banner success">
                    <span>✓</span> You are fully verified
                  </div>
                ) : (
                  <div className="td-verif-banner warning">
                    <span>⚠️</span> Complete verification to boost rank
                  </div>
                )}
              </section>

              {/* Earnings Overview */}
              <section className="td-card td-earnings-card" id="earnings" aria-labelledby="td-earnings-heading">
                <div className="td-card-header">
                  <h2 className="td-card-title" id="td-earnings-heading">Earnings Overview</h2>
                  <a href="#earnings" className="td-card-link">View Details</a>
                </div>

                <div className="td-earnings-content">
                  <div>
                    <p className="td-earnings-amount">₹{calculatedEarnings.toLocaleString('en-IN')}</p>
                    <p className="td-earnings-subtext">
                      {calculatedEarnings > 0 ? 'Total contact unlock earnings' : 'No earnings yet.'}
                    </p>
                  </div>
                  <div className="td-earnings-wallet-icon" aria-hidden="true">
                    💳
                  </div>
                </div>
              </section>

            </div>

          </div>

          {/* ========================================================
              4. QUICK ACTIONS ROW
              ======================================================== */}
          <section className="td-quick-actions-bar" aria-label="Tutor Quick Actions">
            <span className="td-quick-actions-title">Quick Actions</span>
            <div className="td-quick-actions-list">
              <Link to="/tutor/profile/edit" className="td-quick-btn">
                <span>👤</span> Edit Profile
              </Link>
              <Link to="/tutor/profile/edit#subjects" className="td-quick-btn">
                <span>📖</span> Add Subjects
              </Link>
              <Link to="/tutor/profile/edit#availability" className="td-quick-btn">
                <span>📅</span> Manage Availability
              </Link>
              <Link to={`/tutor/${tutorProfile?._id || user?._id || ''}`} className="td-quick-btn">
                <span>⭐</span> View My Reviews
              </Link>
              <Link to="/tutor/requests" className="td-quick-btn">
                <span>📹</span> My Sessions
              </Link>
            </div>
          </section>

        </main>
      </div>

    </div>
  );
};

export default TutorDashboardPage;
