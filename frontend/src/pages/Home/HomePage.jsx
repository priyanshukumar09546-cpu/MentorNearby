import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { searchTutors, getPublicStats } from '../../api/search';
import { getFeaturedTutors } from '../../api/tutors';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import './HomePage.css';

const POPULAR_SUBJECTS = [
  { name: 'Maths', icon: '🔢', color: '#2563EB', bg: 'rgba(37, 99, 235, 0.08)' },
  { name: 'Physics', icon: '⚛️', color: '#EA580C', bg: 'rgba(234, 88, 12, 0.08)' },
  { name: 'Chemistry', icon: '🧪', color: '#16A34A', bg: 'rgba(22, 163, 74, 0.08)' },
  { name: 'Biology', icon: '🧬', color: '#D946EF', bg: 'rgba(217, 70, 239, 0.08)' },
  { name: 'English', icon: '📖', color: '#E11D48', bg: 'rgba(225, 29, 72, 0.08)' },
  { name: 'Computer Science', icon: '💻', color: '#0284C7', bg: 'rgba(2, 132, 199, 0.08)' },
  { name: 'Accountancy', icon: '₹', color: '#7C3AED', bg: 'rgba(124, 58, 237, 0.08)' },
  { name: 'Economics', icon: '📈', color: '#D97706', bg: 'rgba(217, 119, 6, 0.08)' },
];

const STUDY_RESOURCES_LIST = [
  {
    title: 'NCERT Solutions',
    subtitle: 'All Classes',
    icon: '📘',
    path: '/books',
  },
  {
    title: 'Notes & PDFs',
    subtitle: 'Curated Notes',
    icon: '🌿',
    path: '/study-resources',
  },
  {
    title: 'Previous Year Papers',
    subtitle: 'Boards & Competitive',
    icon: '📑',
    path: '/courses',
  },
  {
    title: 'Topper Tips',
    subtitle: 'By Top Rankers',
    icon: '⭐',
    path: '/study-resources',
  },
];

const FAQS = [
  {
    q: 'How does MentorNearby verify tutors?',
    a: 'Tutors submit government-issued IDs, college degrees, and professional credentials for review by our admin team. After identity and qualification checks, tutors earn a Verified badge.',
  },
  {
    q: 'How is contact information protected?',
    a: "Tutor phone numbers and email addresses are never shown publicly. You unlock a tutor's contact using your free unlocks (first 2 unlocks are completely free) or a small nominal fee. This protects both tutors and families from spam.",
  },
  {
    q: 'How do I find tutors in my area?',
    a: 'Simply enter your city, area, or subject into our search bar. You can filter by class, teaching mode (Online, Offline, Hybrid), and budget to discover top-rated tutors near you.',
  },
  {
    q: 'Is there a fee to use MentorNearby?',
    a: 'Searching tutors and viewing full profiles is 100% free. Every student gets 2 free contact unlocks upon registration with no hidden subscriptions.',
  },
  {
    q: 'Can tutors see my private information or address?',
    a: 'No. Tutors only see your general city and locality. Your exact residential address and private contact info are never shared publicly.',
  },
];

const LIVE_ACTIVITIES = [
  { name: 'Rahul', city: 'Bareilly', action: 'just chatted with Class 10 Maths teacher', time: '2 mins ago', icon: '💬' },
  { name: 'Priya', city: 'Civil Lines', action: 'contacted Physics home tutor for Class 12', time: 'Just now', icon: '⚡' },
  { name: 'Amit', city: 'Rajendra Nagar', action: 'started chat with Chemistry mentor', time: '4 mins ago', icon: '🧪' },
  { name: 'Ananya', city: 'Subhash Nagar', action: 'unlocked Biology revision notes', time: 'Just now', icon: '📖' },
  { name: 'Vikram', city: 'Model Town', action: 'requested demo with English tutor', time: '1 min ago', icon: '👨‍🏫' },
  { name: 'Sneha', city: 'Rampur Garden', action: 'connected with Science teacher within 3km', time: '3 mins ago', icon: '📍' },
  { name: 'Rohan', city: 'Mahanagar', action: 'chatted with Mathematics faculty', time: 'Just now', icon: '💬' },
];

const HERO_PHRASES = [
  'Find The Best Home Tutors Near You',
  'Within 5 Kilometers',
  'Verified & Trusted Tutors',
  'Learn Better, Closer to Home',
];

const HomePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { isDark, darkMode } = useTheme();
  const isDarkMode = isDark ?? darkMode ?? false;
  const [search, setSearch] = useState({ location: '', subject: '' });
  const [openFaq, setOpenFaq] = useState(null);
  const [featuredTutors, setFeaturedTutors] = useState([]);
  const [loadingTutors, setLoadingTutors] = useState(true);
  const [activeActivityIndex, setActiveActivityIndex] = useState(0);

  // Typewriter effect state
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Typewriter effect loop (70ms type, 35ms delete, 2000ms pause, 600ms delete pause)
  useEffect(() => {
    const currentPhrase = HERO_PHRASES[phraseIndex];
    let timer;

    if (!isDeleting && displayText === currentPhrase) {
      timer = setTimeout(() => setIsDeleting(true), 2000);
    } else if (isDeleting && displayText === '') {
      timer = setTimeout(() => {
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % HERO_PHRASES.length);
      }, 600);
    } else {
      const speed = isDeleting ? 35 : 70;
      timer = setTimeout(() => {
        setDisplayText((prev) =>
          isDeleting
            ? currentPhrase.substring(0, prev.length - 1)
            : currentPhrase.substring(0, prev.length + 1)
        );
      }, speed);
    }

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, phraseIndex]);

  // Live Activity rotation every 5 seconds
  useEffect(() => {
    const activityTimer = setInterval(() => {
      setActiveActivityIndex((prev) => (prev + 1) % LIVE_ACTIVITIES.length);
    }, 5000);
    return () => clearInterval(activityTimer);
  }, []);

  const [publicStats, setPublicStats] = useState({
    totalStudents: 0,
    totalVerifiedTutors: 0,
    totalTutors: 0,
    avgRating: 0,
    totalReviews: 0,
  });
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [selectedTutorId, setSelectedTutorId] = useState(null);

  useEffect(() => {
    const fetchTutorsAndStats = async () => {
      try {
        setLoadingTutors(true);
        const [tutorsRes, statsRes] = await Promise.allSettled([
          getFeaturedTutors(),
          getPublicStats(),
        ]);

        if (tutorsRes.status === 'fulfilled') {
          const list =
            tutorsRes.value.data?.data?.tutors ||
            tutorsRes.value.data?.tutors ||
            tutorsRes.value.data?.data ||
            (Array.isArray(tutorsRes.value.data) ? tutorsRes.value.data : []);
          if (Array.isArray(list) && list.length > 0) {
            setFeaturedTutors(list);
          } else {
            const fallbackRes = await searchTutors({ limit: 8 });
            const fallbackList =
              fallbackRes.data?.data?.tutors ||
              fallbackRes.data?.tutors ||
              fallbackRes.data?.data ||
              [];
            setFeaturedTutors(Array.isArray(fallbackList) ? fallbackList : []);
          }
        }

        if (statsRes.status === 'fulfilled') {
          setPublicStats(statsRes.value.data?.data || {});
        }
      } catch (err) {
        console.error('Error fetching homepage tutors:', err);
        setFeaturedTutors([]);
      } finally {
        setLoadingTutors(false);
      }
    };
    fetchTutorsAndStats();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.location) params.set('location', search.location);
    if (search.subject) params.set('subject', search.subject);
    navigate(`/search?${params.toString()}`);
  };

  const handleSubjectClick = (subject) => {
    navigate(`/search?subject=${encodeURIComponent(subject)}`);
  };

  const handleUnlock = (tutorId) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    const isSubscribed = Boolean(
      user?.isSubscribed ||
      user?.subscriptionActive ||
      user?.role === 'ADMIN' ||
      (user?.subscriptionExpiry && new Date(user.subscriptionExpiry) > new Date())
    );

    if (isSubscribed) {
      navigate(`/tutor/${tutorId}`);
    } else {
      navigate('/subscription');
    }
  };

  return (
    <main className="mn-home-root">
      {/* ============================================================ */}
      {/* 1. HERO SECTION (3-COLUMN EXACT REFERENCE LAYOUT)            */}
      {/* ============================================================ */}
      <section className="mn-hero-section" aria-labelledby="mn-hero-heading">
        <div className="mn-hero-ambient-glow" aria-hidden="true"></div>
        <div className="mn-container">
          <div className="mn-hero-grid-3col">
            
            {/* LEFT COLUMN: BADGE, HEADLINE, SEARCH BAR, 2 ACTION CARDS, 4 TRUST BADGES */}
            <div className="mn-hero-left-col">
              {/* Eyebrow Pill */}
              <div className="mn-hero-eyebrow-pill mn-hero-badge-animated">
                <span className="mn-eyebrow-icon">📍</span>
                <span>5km Radius • 100% Verified Tutors</span>
              </div>

              {/* Main Headline with Typewriter Animation */}
              <div className="mn-hero-headline-wrap">
                <h1 className="mn-hero-main-title" id="mn-hero-heading">
                  <span className="mn-typewriter-gradient">{displayText}</span>
                  <span className="mn-typewriter-cursor">|</span>
                </h1>
              </div>

              {/* Subtitle */}
              <p className="mn-hero-sub-text">
                Connect directly with KYC-verified tutors in your neighborhood. Zero commission, affordable fees, and free chat before you start.
              </p>

              {/* Unified Quick Search Bar (Location + Subject) */}
              <form className="mn-hero-search-bar" onSubmit={handleSearch} role="search">
                <div className="mn-search-field">
                  <span className="mn-search-field-icon">📍</span>
                  <input
                    type="text"
                    className="mn-search-input"
                    placeholder="Location (e.g. Bareilly, Civil Lines)"
                    value={search.location}
                    onChange={(e) => setSearch((s) => ({ ...s, location: e.target.value }))}
                  />
                  <span className="mn-field-chevron">▾</span>
                </div>

                <div className="mn-search-divider" aria-hidden="true"></div>

                <div className="mn-search-field">
                  <span className="mn-search-field-icon">📖</span>
                  <select
                    className="mn-search-select"
                    value={search.subject}
                    onChange={(e) => setSearch((s) => ({ ...s, subject: e.target.value }))}
                  >
                    <option value="">Select Subject</option>
                    {POPULAR_SUBJECTS.map((s) => (
                      <option key={s.name} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <span className="mn-field-chevron">▾</span>
                </div>

                <button type="submit" className="mn-search-submit-btn">
                  Search Tutors
                </button>
              </form>

              {/* 4 Feature Boxes Below Hero */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: 10,
                  marginTop: 18,
                  marginBottom: 18,
                  width: '100%',
                }}
              >
                {[
                  { icon: '🛡️', title: 'Verified Teachers', desc: '100% ID & Degree Checked' },
                  { icon: '💬', title: 'Free Chat First', desc: 'Direct Message & Talk' },
                  { icon: '💰', title: 'Affordable Fees', desc: 'Transparent & Low Cost' },
                  { icon: '📍', title: 'Nearby Only', desc: 'Within 5km Radius' },
                ].map((box, i) => (
                  <div
                    key={i}
                    style={{
                      background: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #E2E8F0',
                      borderRadius: 12,
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{box.icon}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>
                        {box.title}
                      </div>
                      <div style={{ fontSize: 10, color: '#64748B', marginTop: 2, fontWeight: 500 }}>
                        {box.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 3 Large Action CTA Cards */}
              <div className="mn-hero-cta-cards-row">
                <Link to="/search" className="mn-cta-card">
                  <div className="mn-cta-card-icon-wrap">
                    <span className="mn-cta-icon">🔍</span>
                  </div>
                  <div className="mn-cta-card-content">
                    <div className="mn-cta-card-title">Find a Tutor</div>
                    <div className="mn-cta-card-sub">Search &amp; connect with verified tutors</div>
                  </div>
                  <span className="mn-cta-card-arrow">›</span>
                </Link>

                <Link to="/find-students" className="mn-cta-card">
                  <div className="mn-cta-card-icon-wrap">
                    <span className="mn-cta-icon">🎓</span>
                  </div>
                  <div className="mn-cta-card-content">
                    <div className="mn-cta-card-title">Find Students</div>
                    <div className="mn-cta-card-sub">Tuition leads &amp; student requests</div>
                  </div>
                  <span className="mn-cta-card-arrow">›</span>
                </Link>

                <Link to="/become-tutor" className="mn-cta-card">
                  <div className="mn-cta-card-icon-wrap">
                    <span className="mn-cta-icon">👤</span>
                  </div>
                  <div className="mn-cta-card-content">
                    <div className="mn-cta-card-title">Become a Tutor</div>
                    <div className="mn-cta-card-sub">Join as a tutor &amp; start teaching</div>
                  </div>
                  <span className="mn-cta-card-arrow">›</span>
                </Link>
              </div>
            </div>

            {/* CENTER COLUMN: FRAMED HERO VISUAL (EXACT PROVIDED ARTWORK) */}
            <div className="mn-hero-center-col">
              <div className="mn-hero-visual-frame">
                <img
                  src="/hero-illustration.png"
                  alt="KYC Verified Tutors and Students studying on MentorNearby"
                  className="mn-hero-visual-img"
                />
              </div>
            </div>

            {/* RIGHT COLUMN: 3 STATS CARDS STACKED VERTICALLY */}
            <div className="mn-hero-right-col">
              {/* Stat Card 1: Happy Students */}
              <div className="mn-stat-vertical-card">
                <div className="mn-stat-v-header">
                  <div className="mn-stat-v-icon-box mn-stat-purple">
                    <span className="mn-stat-icon">👥</span>
                  </div>
                  <div>
                    <div className="mn-stat-v-number">
                      {publicStats.totalStudents > 0 ? `${publicStats.totalStudents.toLocaleString('en-IN')}+` : '0'}
                    </div>
                    <div className="mn-stat-v-label">Happy Students</div>
                  </div>
                </div>
                <div className="mn-avatar-stack">
                  <div className="mn-avatar-dot" style={{ backgroundColor: '#F43F5E' }}>👩</div>
                  <div className="mn-avatar-dot" style={{ backgroundColor: '#3B82F6' }}>👦</div>
                  <div className="mn-avatar-dot" style={{ backgroundColor: '#10B981' }}>👧</div>
                  <div className="mn-avatar-dot" style={{ backgroundColor: '#F59E0B' }}>🧑</div>
                  <div className="mn-avatar-dot" style={{ backgroundColor: '#8B5CF6' }}>👨</div>
                </div>
              </div>

              {/* Stat Card 2: Verified Tutors */}
              <div className="mn-stat-vertical-card">
                <div className="mn-stat-v-header">
                  <div className="mn-stat-v-icon-box mn-stat-green">
                    <span className="mn-stat-icon">🛡️</span>
                  </div>
                  <div>
                    <div className="mn-stat-v-number">
                      {(publicStats.totalVerifiedTutors || publicStats.totalTutors) > 0 
                        ? `${(publicStats.totalVerifiedTutors || publicStats.totalTutors).toLocaleString('en-IN')}+` 
                        : '0'}
                    </div>
                    <div className="mn-stat-v-label">Verified Tutors</div>
                  </div>
                </div>
                <div className="mn-avatar-stack">
                  <div className="mn-avatar-dot" style={{ backgroundColor: '#10B981' }}>👨‍🏫</div>
                  <div className="mn-avatar-dot" style={{ backgroundColor: '#6366F1' }}>👩‍🏫</div>
                  <div className="mn-avatar-dot" style={{ backgroundColor: '#EC4899' }}>👨‍🏫</div>
                  <div className="mn-avatar-dot" style={{ backgroundColor: '#14B8A6' }}>👩‍🏫</div>
                  <div className="mn-avatar-dot" style={{ backgroundColor: '#F59E0B' }}>👨‍🏫</div>
                </div>
              </div>

              {/* Stat Card 3: Average Rating */}
              <div className="mn-stat-vertical-card">
                <div className="mn-stat-v-header">
                  <div className="mn-stat-v-icon-box mn-stat-gold">
                    <span className="mn-stat-icon">⭐</span>
                  </div>
                  <div>
                    <div className="mn-stat-v-number">
                      {publicStats.avgRating > 0 ? `${publicStats.avgRating}/5` : '0.0'}
                    </div>
                    <div className="mn-stat-v-label">Average Rating</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 1.5 LIVE ACTIVITY TICKER: "Abhi Active Students"            */}
      {/* ============================================================ */}
      <section
        style={{
          background: 'linear-gradient(90deg, rgba(254, 243, 199, 0.45) 0%, rgba(253, 230, 138, 0.3) 100%)',
          borderTop: '1px solid #FDE68A',
          borderBottom: '1px solid #FDE68A',
          padding: '12px 16px',
        }}
        aria-label="Live Student Activity on MentorNearby"
      >
        <div className="mn-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#FEF3C7', border: '1px solid #F59E0B', padding: '4px 12px', borderRadius: 20 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16A34A', display: 'inline-block', boxShadow: '0 0 8px #16A34A' }}></span>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Abhi Active Students
            </span>
          </div>

          <div
            key={activeActivityIndex}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13.5,
              fontWeight: 600,
              color: '#1E293B',
              animation: 'fadeIn 0.4s ease-in-out',
            }}
          >
            <span style={{ fontSize: 16 }}>{LIVE_ACTIVITIES[activeActivityIndex].icon}</span>
            <span>
              <strong>{LIVE_ACTIVITIES[activeActivityIndex].name}</strong> from <span style={{ color: '#D97706', fontWeight: 700 }}>{LIVE_ACTIVITIES[activeActivityIndex].city}</span>{' '}
              {LIVE_ACTIVITIES[activeActivityIndex].action}
            </span>
            <span style={{ fontSize: 11, color: '#64748B', marginLeft: 4 }}>
              • {LIVE_ACTIVITIES[activeActivityIndex].time}
            </span>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. MIDDLE 3-COLUMN DIRECTORY SECTION                         */}
      {/* ============================================================ */}
      <section className="mn-directory-section" aria-label="Explore subjects, tutors and resources">
        <div className="mn-container">
          <div className="mn-directory-grid-3col">
            
            {/* COLUMN 1: POPULAR SUBJECTS (2x4 GRID) */}
            <div className="mn-directory-col">
              <div className="mn-col-header">
                <h3 className="mn-col-title">Popular Subjects</h3>
                <Link to="/search" className="mn-col-view-all">View All</Link>
              </div>

              <div className="mn-subjects-2x4-grid">
                {POPULAR_SUBJECTS.map((sub) => (
                  <button
                    key={sub.name}
                    type="button"
                    className="mn-subject-tile"
                    onClick={() => handleSubjectClick(sub.name)}
                    aria-label={`Browse ${sub.name} tutors`}
                  >
                    <span className="mn-subject-tile-icon">{sub.icon}</span>
                    <span className="mn-subject-tile-name">{sub.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* COLUMN 2: FEATURED TUTORS (3 CARDS ROW + ARROW) */}
            <div className="mn-directory-col mn-featured-tutors-col">
              <div className="mn-col-header">
                <h3 className="mn-col-title">Featured Tutors</h3>
                <div className="mn-col-header-right">
                  <Link to="/search" className="mn-col-view-all">View All</Link>
                  <Link to="/search" className="mn-carousel-arrow-btn" aria-label="Next tutors">›</Link>
                </div>
              </div>

              {loadingTutors ? (
                <div className="mn-featured-tutors-grid">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="mn-featured-tutor-card" style={{ opacity: 0.6 }}>
                      <div className="mn-tutor-photo-wrap" style={{ background: '#E2E8F0' }}></div>
                      <div className="mn-tutor-card-body">
                        <div style={{ height: '14px', background: '#E2E8F0', borderRadius: '4px', marginBottom: '6px' }}></div>
                        <div style={{ height: '10px', background: '#F1F5F9', borderRadius: '4px', width: '60%' }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : featuredTutors.length > 0 ? (
                <div className="mn-featured-tutors-grid">
                  {featuredTutors.slice(0, 3).map((tutor) => {
                    const tutorId = tutor._id || tutor.user?._id || tutor.userId || tutor.id || tutor.user;
                    const name = tutor.user?.name || tutor.name || 'Tutor';
                    const photo = tutor.profilePic || tutor.user?.avatar || tutor.user?.profilePic || tutor.profilePhoto?.url || tutor.profilePhoto || '';
                    const subject = tutor.subjects?.join(', ') || tutor.subjects?.[0] || 'General Subjects';
                    const classes = tutor.classes?.length ? `Class ${tutor.classes.join(', ')}` : (tutor.grades?.length ? `Class ${tutor.grades.join(', ')}` : 'All Classes');
                    const exp = tutor.experience?.years ? `${tutor.experience.years}+ Years Exp.` : (tutor.experience ? `${tutor.experience} Exp.` : 'Experienced');
                    const qual = tutor.qualifications?.[0]?.degree || tutor.qualifications?.[0]?.title || tutor.education?.[0]?.degree || '';
                    const hasReviews = tutor.totalReviews > 0 && tutor.averageRating;
                    const rating = hasReviews ? Number(tutor.averageRating).toFixed(1) : null;
                    const reviews = tutor.totalReviews || 0;
                    const feeAmount = tutor.fees?.amount || tutor.monthlyFees || tutor.monthly_fees || tutor.fees || tutor.hourlyRate || tutor.price || 0;
                    const fee = feeAmount > 0 ? `₹${Number(feeAmount).toLocaleString('en-IN')} / month` : 'Fee on request';
                    const isVerified = tutor.kycStatus === 'VERIFIED' || tutor.verificationStatus === 'VERIFIED';

                    return (
                      <div key={tutorId} className="mn-featured-tutor-card">
                        {/* Tutor Image & Verified Badge */}
                        <div className="mn-tutor-photo-wrap">
                          {isVerified && <span className="mn-verified-badge">VERIFIED</span>}
                          {photo ? (
                            <img src={photo} alt={name} className="mn-tutor-photo-img" />
                          ) : (
                            <div className="mn-tutor-photo-placeholder">
                              {name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>

                        {/* Tutor Info */}
                        <div className="mn-tutor-card-body">
                          <h4 className="mn-tutor-name">{name}</h4>
                          <div className="mn-tutor-subject-classes" title={`${subject} • ${classes}`}>
                            {subject} • {classes}
                          </div>
                          <div className="mn-tutor-exp-qual" title={`${exp}${qual ? ` • ${qual}` : ''}`}>
                            {exp}{qual ? ` • ${qual}` : ''}
                          </div>

                          <div className="mn-tutor-rating-rate-row">
                            <div className="mn-tutor-rating-val">
                              {hasReviews ? (
                                <>
                                  <span className="mn-star-gold">⭐</span> {rating} <span className="mn-rev-count">({reviews})</span>
                                </>
                              ) : (
                                <span style={{ fontSize: '10.5px', color: '#8C827A', fontWeight: 600 }}>⭐ New Tutor</span>
                              )}
                            </div>
                            <div className="mn-tutor-fee-val">{fee}</div>
                          </div>

                          <Link
                            to={`/tutor/${tutorId}`}
                            className="mn-tutor-profile-btn"
                          >
                            View Profile
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mn-tutors-empty-state">
                  <div className="mn-tutors-empty-icon">👨‍🏫</div>
                  <h4 className="mn-tutors-empty-title">No tutors available yet</h4>
                  <p className="mn-tutors-empty-sub">Be the first tutor to join MentorNearby.</p>
                  <Link to="/become-tutor" className="mn-tutors-empty-btn">
                    Become a Tutor
                  </Link>
                </div>
              )}
            </div>

            {/* COLUMN 3: STUDY RESOURCES (4 LIST CARDS) */}
            <div className="mn-directory-col">
              <div className="mn-col-header">
                <h3 className="mn-col-title">Study Resources</h3>
                <Link to="/study-resources" className="mn-col-view-all">View All</Link>
              </div>

              <div className="mn-study-resources-list">
                {STUDY_RESOURCES_LIST.map((res) => (
                  <Link key={res.title} to={res.path} className="mn-resource-row-card">
                    <div className="mn-resource-left">
                      <span className="mn-resource-icon">{res.icon}</span>
                      <div>
                        <div className="mn-resource-title">{res.title}</div>
                        <div className="mn-resource-sub">{res.subtitle}</div>
                      </div>
                    </div>
                    <span className="mn-resource-explore-btn">Explore →</span>
                  </Link>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. TRUSTED & VERIFIED PLATFORM BANNER STRIP                  */}
      {/* ============================================================ */}
      <section className="mn-trust-platform-strip" aria-label="Platform Trust Guarantee">
        <div className="mn-container">
          <div className="mn-trust-strip-card">
            <div className="mn-trust-strip-left">
              <div className="mn-trust-shield-large">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  <path d="m9 12 2 2 4-4"></path>
                </svg>
              </div>
              <div>
                <h4 className="mn-trust-strip-heading">Trusted &amp; Verified Platform</h4>
                <p className="mn-trust-strip-desc">We verify tutors and ensure a safe learning environment for every student.</p>
              </div>
            </div>

            <div className="mn-trust-strip-items-row">
              <div className="mn-trust-strip-pill">
                <span className="mn-trust-pill-icon">👤</span>
                <span>Verified Tutors</span>
              </div>
              <div className="mn-trust-strip-pill">
                <span className="mn-trust-pill-icon">🛡️</span>
                <span>Safe &amp; Secure</span>
              </div>
              <div className="mn-trust-strip-pill">
                <span className="mn-trust-pill-icon">🔒</span>
                <span>100% Privacy</span>
              </div>
              <div className="mn-trust-strip-pill">
                <span className="mn-trust-pill-icon">👥</span>
                <span>Student First</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. PRESERVED FAQ SECTION                                     */}
      {/* ============================================================ */}
      <section className="mn-faq-section" aria-labelledby="faq-title">
        <div className="mn-container">
          <div className="mn-section-header text-center">
            <div className="mn-section-tag">FAQ</div>
            <h2 className="mn-section-title" id="faq-title">Frequently Asked Questions</h2>
            <p className="mn-section-desc">Got questions? We have answers to help you get started quickly.</p>
          </div>

          <div className="mn-faq-list" role="list">
            {FAQS.map((faq, i) => (
              <div
                key={i}
                className={`mn-faq-card ${openFaq === i ? 'open' : ''}`}
                role="listitem"
              >
                <button
                  className="mn-faq-question-btn"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                >
                  <span>{faq.q}</span>
                  <span className="mn-faq-toggle-icon" aria-hidden="true">
                    {openFaq === i ? '−' : '+'}
                  </span>
                </button>
                {openFaq === i && (
                  <div className="mn-faq-answer-body">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 5. SEO FOOTER CONTENT: LOCAL TUITION IN BAREILLY & NEARBY    */}
      {/* ============================================================ */}
      <section
        className="mn-seo-section bg-slate-50 dark:bg-[#0a0a0f] border-t border-slate-200 dark:border-white/10 text-slate-900 dark:text-gray-100 transition-colors duration-200"
        style={{
          background: isDarkMode ? '#0a0a0f' : '#F8FAFC',
          borderTop: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
          padding: '48px 0 36px',
        }}
        aria-label="Local Home Tuition and Tutor Directory Keywords"
      >
        <div className="mn-container">
          <div style={{ marginBottom: 24 }}>
            <h2
              className="text-slate-900 dark:text-white"
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: isDarkMode ? '#FFFFFF' : '#0F172A',
                marginBottom: 8,
              }}
            >
              Home Tuition in Bareilly &amp; Private Tutors Near You
            </h2>
            <p
              className="text-slate-600 dark:text-gray-300"
              style={{
                fontSize: 13,
                color: isDarkMode ? '#94A3B8' : '#64748B',
                lineHeight: 1.6,
                maxWidth: 900,
              }}
            >
              MentorNearby is India's dedicated hyper-local home tuition and private tutor marketplace connecting students and parents directly with background-verified teachers within 5km. Whether you need Class 10 Board Exam prep, Class 12 IIT-JEE/NEET coaching, or foundational primary school guidance, find top-rated tutors near your locality with zero middleman commissions and free initial chat.
            </p>
          </div>

          <div
            className="border-t border-slate-200 dark:border-white/10"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 20,
              paddingTop: 16,
              borderTop: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
            }}
          >
            <div>
              <h3
                className="text-slate-700 dark:text-gray-200"
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: isDarkMode ? '#E2E8F0' : '#334155',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: 10,
                }}
              >
                Popular Localities in Bareilly
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 12.5, lineHeight: 2 }}>
                <li>
                  <Link
                    to="/search?location=Civil+Lines"
                    className="text-slate-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition"
                    style={{ color: isDarkMode ? '#94A3B8' : '#64748B', textDecoration: 'none' }}
                  >
                    Home Tutors in Civil Lines, Bareilly
                  </Link>
                </li>
                <li>
                  <Link
                    to="/search?location=Rajendra+Nagar"
                    className="text-slate-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition"
                    style={{ color: isDarkMode ? '#94A3B8' : '#64748B', textDecoration: 'none' }}
                  >
                    Home Tuition in Rajendra Nagar
                  </Link>
                </li>
                <li>
                  <Link
                    to="/search?location=Subhash+Nagar"
                    className="text-slate-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition"
                    style={{ color: isDarkMode ? '#94A3B8' : '#64748B', textDecoration: 'none' }}
                  >
                    Private Tutors in Subhash Nagar
                  </Link>
                </li>
                <li>
                  <Link
                    to="/search?location=Model+Town"
                    className="text-slate-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition"
                    style={{ color: isDarkMode ? '#94A3B8' : '#64748B', textDecoration: 'none' }}
                  >
                    CBSE Tutors in Model Town
                  </Link>
                </li>
                <li>
                  <Link
                    to="/search?location=Rampur+Garden"
                    className="text-slate-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition"
                    style={{ color: isDarkMode ? '#94A3B8' : '#64748B', textDecoration: 'none' }}
                  >
                    Maths &amp; Science Tutors in Rampur Garden
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3
                className="text-slate-700 dark:text-gray-200"
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: isDarkMode ? '#E2E8F0' : '#334155',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: 10,
                }}
              >
                Top Subjects &amp; Classes
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 12.5, lineHeight: 2 }}>
                <li>
                  <Link
                    to="/search?subject=Maths"
                    className="text-slate-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition"
                    style={{ color: isDarkMode ? '#94A3B8' : '#64748B', textDecoration: 'none' }}
                  >
                    Class 10 Maths Home Tutor near me
                  </Link>
                </li>
                <li>
                  <Link
                    to="/search?subject=Physics"
                    className="text-slate-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition"
                    style={{ color: isDarkMode ? '#94A3B8' : '#64748B', textDecoration: 'none' }}
                  >
                    Class 12 Physics &amp; Numerical Faculty
                  </Link>
                </li>
                <li>
                  <Link
                    to="/search?subject=Chemistry"
                    className="text-slate-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition"
                    style={{ color: isDarkMode ? '#94A3B8' : '#64748B', textDecoration: 'none' }}
                  >
                    Class 11 &amp; 12 Chemistry Tutors
                  </Link>
                </li>
                <li>
                  <Link
                    to="/search?subject=Biology"
                    className="text-slate-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition"
                    style={{ color: isDarkMode ? '#94A3B8' : '#64748B', textDecoration: 'none' }}
                  >
                    NEET Biology Mentors in Bareilly
                  </Link>
                </li>
                <li>
                  <Link
                    to="/search?subject=English"
                    className="text-slate-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition"
                    style={{ color: isDarkMode ? '#94A3B8' : '#64748B', textDecoration: 'none' }}
                  >
                    Spoken English &amp; Grammar Classes
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3
                className="text-slate-700 dark:text-gray-200"
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: isDarkMode ? '#E2E8F0' : '#334155',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: 10,
                }}
              >
                Quick Search Searches
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 12.5, lineHeight: 2 }}>
                <li>
                  <Link
                    to="/search"
                    className="text-slate-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition"
                    style={{ color: isDarkMode ? '#94A3B8' : '#64748B', textDecoration: 'none' }}
                  >
                    Tuition near me within 5km
                  </Link>
                </li>
                <li>
                  <Link
                    to="/search"
                    className="text-slate-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition"
                    style={{ color: isDarkMode ? '#94A3B8' : '#64748B', textDecoration: 'none' }}
                  >
                    Female Home Tutor in Bareilly
                  </Link>
                </li>
                <li>
                  <Link
                    to="/books"
                    className="text-slate-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition"
                    style={{ color: isDarkMode ? '#94A3B8' : '#64748B', textDecoration: 'none' }}
                  >
                    Free NCERT Solutions PDF
                  </Link>
                </li>
                <li>
                  <Link
                    to="/study-resources"
                    className="text-slate-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition"
                    style={{ color: isDarkMode ? '#94A3B8' : '#64748B', textDecoration: 'none' }}
                  >
                    Topper Notes &amp; Formula Sheets
                  </Link>
                </li>
                <li>
                  <Link
                    to="/become-tutor"
                    className="text-slate-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition"
                    style={{ color: isDarkMode ? '#94A3B8' : '#64748B', textDecoration: 'none' }}
                  >
                    Join as Home Tutor (Earn ₹15k-₹40k/mo)
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default HomePage;
