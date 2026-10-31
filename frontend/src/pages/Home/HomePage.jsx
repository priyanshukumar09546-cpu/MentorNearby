import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { searchTutors, getPublicStats } from '../../api/search';
import { getFeaturedTutors } from '../../api/tutors';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import MobileHomeApp from '../../components/home/MobileHomeApp';
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
    let isMounted = true;
    const fetchTutorsAndStats = async () => {
      try {
        setLoadingTutors(true);
        const [tutorsRes, statsRes] = await Promise.allSettled([
          getFeaturedTutors(),
          getPublicStats(),
        ]);

        let list = [];
        if (tutorsRes.status === 'fulfilled') {
          const d = tutorsRes.value?.data;
          list = d?.data?.tutors || d?.tutors || d?.data || (Array.isArray(d) ? d : []);
        }

        // If featured API returned empty, fallback to active search
        if (!Array.isArray(list) || list.length === 0) {
          try {
            const fallbackRes = await searchTutors({ limit: 8 });
            const fd = fallbackRes.data;
            list = fd?.data?.tutors || fd?.tutors || fd?.data || (Array.isArray(fd) ? fd : []);
          } catch (fbErr) {
            console.warn('Fallback search tutors failed:', fbErr);
          }
        }

        if (isMounted) {
          if (Array.isArray(list) && list.length > 0) {
            setFeaturedTutors(list);
          } else {
            setFeaturedTutors([]);
          }

          if (statsRes.status === 'fulfilled') {
            setPublicStats(statsRes.value?.data?.data || statsRes.value?.data || {});
          }
        }
      } catch (err) {
        console.error('Error fetching homepage tutors:', err);
        if (isMounted) setFeaturedTutors([]);
      } finally {
        if (isMounted) {
          setLoadingTutors(false);
        }
      }
    };

    fetchTutorsAndStats();
    return () => {
      isMounted = false;
    };
  }, []);

  // Premium viewport reveal animation on scroll for key sections
  useEffect(() => {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return;

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.querySelectorAll('.mn-reveal').forEach((el) => el.classList.add('is-revealed'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
    );

    const elements = document.querySelectorAll('.mn-reveal:not(.is-revealed)');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [featuredTutors, loadingTutors]);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.location) params.set('location', search.location);
    if (search.subject) params.set('subject', search.subject);
    navigate(`/search?${params.toString()}`);
  };

  const handleSubjectClick = (subject) => {
    navigate(`/tutors?subject=${encodeURIComponent(subject)}`);
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
      {/* 📱 MOBILE VIEW (<= 768px): App-Style Experience inspired by Reference */}
      <div className="mn-mobile-home-container">
        <MobileHomeApp
          featuredTutors={featuredTutors}
          loadingTutors={loadingTutors}
          publicStats={publicStats}
        />
      </div>

      {/* 💻 DESKTOP VIEW (> 768px): Preserved Original 3-Column Layout */}
      <div className="mn-desktop-home-container">
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

            {/* CENTER COLUMN: FRAMED HERO VISUAL (COMPOSITION WITH MENTOR ASSET & FLOATING CARDS) */}
            <div className="mn-hero-center-col">
              <div className="mn-hero-composition-wrap mn-reveal" aria-label="MentorNearby Verified Mentorship Platform">
                
                {/* Decorative Yellow Arc & Sparkles SVG */}
                <svg className="mn-hero-decor-svg" viewBox="0 0 460 380" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  {/* 3 Yellow Sparkles above head */}
                  <line x1="202" y1="18" x2="210" y2="34" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
                  <line x1="222" y1="12" x2="225" y2="30" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
                  <line x1="242" y1="18" x2="236" y2="34" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
                  
                  {/* Golden perimeter orbit arc */}
                  <path
                    d="M 125 105 A 135 135 0 0 0 120 280 C 105 320 60 330 45 350"
                    stroke="#F59E0B"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    fill="none"
                    opacity="0.9"
                  />
                </svg>

                {/* Native Burgundy Circular Background */}
                <div className="mn-hero-burgundy-circle" aria-hidden="true"></div>

                {/* Hero Mentor Subject Image */}
                <div className="mn-hero-subject-container">
                  <img
                    src="/images/home/hero-mentor-student.png"
                    alt="Verified Tutor Mentor on MentorNearby"
                    className="mn-hero-subject-img"
                    loading="eager"
                  />
                </div>

                {/* 6 Native Floating Feature Cards (Pill Badges) */}
                {/* 1. Top Left: Verified Tutors */}
                <div className="mn-hero-pill-card mn-pill-top-left" style={{ '--pill-delay': '0ms' }}>
                  <div className="mn-pill-icon-box mn-pill-icon-maroon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
                    </svg>
                  </div>
                  <div className="mn-pill-text-wrap">
                    <span className="mn-pill-title">Verified Tutors</span>
                    <span className="mn-pill-sub">KYC & Identity Checked</span>
                  </div>
                </div>

                {/* 2. Middle Left: Nearby Tutors (Pointed at by finger) */}
                <div className="mn-hero-pill-card mn-pill-mid-left" style={{ '--pill-delay': '60ms' }}>
                  <div className="mn-pill-icon-box mn-pill-icon-brown">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                    </svg>
                  </div>
                  <div className="mn-pill-text-wrap">
                    <span className="mn-pill-title">Nearby Tutors</span>
                    <span className="mn-pill-sub">Within 5km Radius</span>
                  </div>
                </div>

                {/* 3. Bottom Left: Instant Connect */}
                <div className="mn-hero-pill-card mn-pill-bot-left" style={{ '--pill-delay': '120ms' }}>
                  <div className="mn-pill-icon-box mn-pill-icon-gold">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7 2v11h3v9l7-12h-4l4-8z"/>
                    </svg>
                  </div>
                  <div className="mn-pill-text-wrap">
                    <span className="mn-pill-title">Instant Connect</span>
                    <span className="mn-pill-sub">Chat Before You Book</span>
                  </div>
                </div>

                {/* 4. Top Right: Affordable Fees */}
                <div className="mn-hero-pill-card mn-pill-top-right" style={{ '--pill-delay': '30ms' }}>
                  <div className="mn-pill-icon-box mn-pill-icon-amber">
                    <span className="mn-pill-rupee">₹</span>
                  </div>
                  <div className="mn-pill-text-wrap">
                    <span className="mn-pill-title">Affordable Fees</span>
                    <span className="mn-pill-sub">Transparent & Low Cost</span>
                  </div>
                </div>

                {/* 5. Middle Right: All Subjects */}
                <div className="mn-hero-pill-card mn-pill-mid-right" style={{ '--pill-delay': '90ms' }}>
                  <div className="mn-pill-icon-box mn-pill-icon-orange">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/>
                    </svg>
                  </div>
                  <div className="mn-pill-text-wrap">
                    <span className="mn-pill-title">All Subjects</span>
                    <span className="mn-pill-sub">Class 1 to College Level</span>
                  </div>
                </div>

                {/* 6. Bottom Right: Safe & Trusted */}
                <div className="mn-hero-pill-card mn-pill-bot-right" style={{ '--pill-delay': '150ms' }}>
                  <div className="mn-pill-icon-box mn-pill-icon-maroon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/>
                    </svg>
                  </div>
                  <div className="mn-pill-text-wrap">
                    <span className="mn-pill-title">Safe & Trusted</span>
                    <span className="mn-pill-sub">Your Safety, Our Priority</span>
                  </div>
                </div>

              </div>
            </div>

            {/* RIGHT COLUMN: 3 STATS CARDS STACKED VERTICALLY */}
            <div className="mn-hero-right-col">
              {/* Stat Card 1: Happy Students */}
              <div className="mn-stat-vertical-card mn-reveal" style={{ '--stagger': 0 }}>
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
              <div className="mn-stat-vertical-card mn-reveal" style={{ '--stagger': 1 }}>
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
              <div className="mn-stat-vertical-card mn-reveal" style={{ '--stagger': 2 }}>
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
      {/* 2. MIDDLE 3-COLUMN DIRECTORY SECTION                         */}
      {/* ============================================================ */}
      <section className="mn-directory-section" aria-label="Explore subjects, tutors and resources">
        <div className="mn-container">
          <div className="mn-directory-grid-3col">
            
            {/* COLUMN 1: POPULAR SUBJECTS (2x4 GRID) */}
            <div className="mn-directory-col">
              <div className="mn-col-header">
                <h3 className="mn-col-title">Popular Subjects</h3>
                <Link to="/subjects" className="mn-col-view-all">View All</Link>
              </div>

              <div className="mn-subjects-2x4-grid">
                {POPULAR_SUBJECTS.map((sub, idx) => (
                  <button
                    key={sub.name}
                    type="button"
                    className="mn-subject-tile mn-reveal"
                    style={{ '--stagger': idx }}
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
                  <Link to="/tutors" className="mn-col-view-all">View All</Link>
                  <Link to="/tutors" className="mn-carousel-arrow-btn" aria-label="Next tutors">›</Link>
                </div>
              </div>

              {loadingTutors ? (
                <div className="mn-featured-tutors-grid">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="mn-featured-tutor-card mn-reveal" style={{ opacity: 0.6, '--stagger': i }}>
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
                  {featuredTutors.slice(0, 3).map((tutor, idx) => {
                    const tutorId = tutor._id || tutor.user?._id || tutor.userId || tutor.id || tutor.user;
                    const name = tutor.user?.name || tutor.name || 'Verified Tutor';
                    const photo = tutor.profilePhoto?.url || tutor.profilePhoto || tutor.profilePic || tutor.user?.avatar || tutor.user?.profilePic || '';
                    const subjectsList = Array.isArray(tutor.subjects) && tutor.subjects.length > 0
                      ? tutor.subjects.join(', ')
                      : (tutor.subject || 'General Subjects');
                    const classes = tutor.grades?.length ? `Class ${tutor.grades.join(', ')}` : (tutor.classes?.length ? `Class ${tutor.classes.join(', ')}` : 'All Classes');
                    const location = tutor.location?.city || tutor.location?.area || tutor.city || '';
                    const expYears = tutor.experience?.years !== undefined ? tutor.experience.years : (typeof tutor.experience === 'number' ? tutor.experience : null);
                    const exp = expYears !== null ? `${expYears}+ Years Exp.` : (tutor.experience?.description || 'Experienced');
                    const qual = tutor.qualifications?.[0]?.degree || tutor.qualifications?.[0]?.title || tutor.education?.[0]?.degree || '';
                    const hasReviews = tutor.totalReviews > 0 && tutor.averageRating;
                    const rating = hasReviews ? Number(tutor.averageRating).toFixed(1) : null;
                    const reviews = tutor.totalReviews || 0;
                    const feeAmount = tutor.fees?.amount || tutor.monthlyFees || tutor.monthly_fees || tutor.fees || tutor.hourlyRate || tutor.price || 0;
                    const fee = feeAmount > 0 ? `₹${Number(feeAmount).toLocaleString('en-IN')} / month` : 'Fee on request';
                    const isVerified = tutor.kycStatus === 'VERIFIED' || tutor.verificationStatus === 'approved' || tutor.verificationStatus === 'VERIFIED' || tutor.isApproved === true || tutor.isVerified === true;

                    return (
                      <div key={tutorId} className="mn-featured-tutor-card mn-reveal" style={{ '--stagger': idx }}>
                        {/* Tutor Image & Verified Badge */}
                        <Link to={`/tutor/${tutorId}`} state={{ tutor }} className="mn-tutor-photo-wrap block" style={{ textDecoration: 'none' }}>
                          {isVerified && <span className="mn-verified-badge">VERIFIED</span>}
                          {photo ? (
                            <img src={photo} alt={name} className="mn-tutor-photo-img" />
                          ) : (
                            <div className="mn-tutor-photo-placeholder">
                              {name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </Link>

                        {/* Tutor Info */}
                        <div className="mn-tutor-card-body">
                          <Link to={`/tutor/${tutorId}`} state={{ tutor }} style={{ textDecoration: 'none', color: 'inherit' }}>
                            <h4 className="mn-tutor-name hover:text-blue-600 transition">{name}</h4>
                          </Link>
                          <div className="mn-tutor-subject-classes" title={`${subjectsList} • ${classes}`}>
                            {subjectsList} • {classes}
                          </div>
                          <div className="mn-tutor-exp-qual" title={`${exp}${location ? ` • ${location}` : ''}${qual ? ` • ${qual}` : ''}`}>
                            {exp}{location ? ` • ${location}` : ''}{qual ? ` • ${qual}` : ''}
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
                            state={{ tutor }}
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
                {STUDY_RESOURCES_LIST.map((res, idx) => (
                  <Link key={res.title} to={res.path} className="mn-resource-row-card mn-reveal" style={{ '--stagger': idx }}>
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
          <div className="mn-trust-strip-card mn-reveal">
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
                className={`mn-faq-card mn-reveal ${openFaq === i ? 'open' : ''}`}
                style={{ '--stagger': i }}
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
      </div>
    </main>
  );
};

export default HomePage;
