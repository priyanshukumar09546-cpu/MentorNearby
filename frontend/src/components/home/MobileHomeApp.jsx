// ============================================================
// components/home/MobileHomeApp.jsx
// MentorNearby Mobile App-Style Interface
// Inspired by Design Reference Image 1 & Image 2
// Strictly Real Data • Swipeable Carousel • Native PWA Feel
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import './MobileHomeApp.css';

// 4 Official Banners from Reference Image 2
const BANNERS = [
  {
    id: 1,
    image: '/banners/banner-1.png',
    alt: 'Find the Right Tutor Near You - Learn from verified tutors in your neighborhood',
    link: '/search',
    label: 'Find Your Tutor',
  },
  {
    id: 2,
    image: '/banners/banner-2.png',
    alt: 'Score Higher With Expert Guidance - School, Boards and Competitive exams',
    link: '/courses',
    label: 'Explore Subjects',
  },
  {
    id: 3,
    image: '/banners/banner-3.png',
    alt: 'Share Your Knowledge Make an Impact - Join as a tutor and teach online or offline',
    link: '/become-tutor',
    label: 'Become a Tutor',
  },
  {
    id: 4,
    image: '/banners/banner-4.png',
    alt: 'All Your Study Resources in One Place - NCERT, notes, papers & formulas',
    link: '/study-resources',
    label: 'Explore Resources',
  },
];

// Popular Subjects (10 items matching Reference Image 1)
const POPULAR_SUBJECTS = [
  { name: 'Mathematics', symbol: 'π', color: '#2563EB', bg: '#EFF6FF', darkBg: 'rgba(37, 99, 235, 0.16)' },
  { name: 'Physics', icon: 'fa-solid fa-atom', color: '#DB2777', bg: '#FDF2F8', darkBg: 'rgba(219, 39, 119, 0.16)' },
  { name: 'Chemistry', icon: 'fa-solid fa-flask', color: '#059669', bg: '#F0FDF4', darkBg: 'rgba(5, 150, 105, 0.16)' },
  { name: 'Biology', icon: 'fa-solid fa-dna', color: '#9333EA', bg: '#FAF5FF', darkBg: 'rgba(147, 51, 234, 0.16)' },
  { name: 'English', icon: 'fa-solid fa-book-open', color: '#D97706', bg: '#FFF7ED', darkBg: 'rgba(217, 119, 6, 0.16)' },
  { name: 'Computer Science', icon: 'fa-solid fa-laptop-code', color: '#4F46E5', bg: '#EEF2FF', darkBg: 'rgba(79, 70, 229, 0.16)' },
  { name: 'Economics', icon: 'fa-solid fa-chart-simple', color: '#E11D48', bg: '#FEF2F2', darkBg: 'rgba(225, 29, 72, 0.16)' },
  { name: 'Accountancy', symbol: '₹', color: '#D97706', bg: '#FEF3C7', darkBg: 'rgba(217, 119, 6, 0.16)' },
  { name: 'Competitive Exams', icon: 'fa-solid fa-award', color: '#0D9488', bg: '#F0FDFA', darkBg: 'rgba(13, 148, 136, 0.16)' },
  { name: 'More', icon: 'fa-solid fa-table-cells-large', color: '#64748B', bg: '#F1F5F9', darkBg: 'rgba(100, 116, 139, 0.16)', isMore: true },
];

const FAQS = [
  {
    q: 'How does MentorNearby verify tutors?',
    a: 'Tutors submit government-issued IDs, academic degrees, and credentials verified by our verification team. After identity checks, verified tutors earn the Verified badge.',
  },
  {
    q: 'How is contact information protected?',
    a: 'Phone numbers and emails are never shown publicly. You unlock a tutor contact using free unlocks or nominal coins, protecting families from unwanted spam.',
  },
  {
    q: 'How do I find tutors in my area?',
    a: 'Enter your location, subject, or class. You can filter by teaching mode (Online, Home Tuition, Hybrid) and budget to find verified tutors near you.',
  },
  {
    q: 'Is there a fee to search tutors?',
    a: 'Searching tutors and viewing full profiles is 100% free with zero middleman commissions.',
  },
];

const MobileHomeApp = ({ featuredTutors = [], loadingTutors = false, publicStats = {} }) => {
  const navigate = useNavigate();
  const { isDark, darkMode } = useTheme();
  const isDarkMode = isDark ?? darkMode ?? false;

  const [searchQuery, setSearchQuery] = useState('');
  const [currentBanner, setCurrentBanner] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  // Auto-slide banners every 4.5 seconds (pausing on user touch/hover)
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % BANNERS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isPaused]);

  // Touch handlers for mobile swipe
  const handleTouchStart = (e) => {
    setIsPaused(true);
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    setIsPaused(false);
    if (touchStartX.current === null) return;
    const deltaX = touchStartX.current - e.changedTouches[0].clientX;
    const deltaY = (touchStartY.current || 0) - e.changedTouches[0].clientY;

    // Detect predominantly horizontal swipe (ignore vertical scrolling)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 35) {
      if (deltaX > 0) {
        // Swiped left -> Next banner
        setCurrentBanner((prev) => (prev + 1) % BANNERS.length);
      } else {
        // Swiped right -> Previous banner
        setCurrentBanner((prev) => (prev - 1 + BANNERS.length) % BANNERS.length);
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      navigate('/search');
      return;
    }
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleSubjectClick = (sub) => {
    if (sub.isMore) {
      navigate('/search');
    } else {
      navigate(`/subject/${encodeURIComponent(sub.name)}`);
    }
  };

  return (
    <div className={`mn-mobile-home-app ${isDarkMode ? 'dark' : 'light'}`}>
      
      {/* ============================================================ */}
      {/* 1. PROMINENT SEARCH BAR (Image 1 Reference)                  */}
      {/* ============================================================ */}
      <section className="mn-m-search-section">
        <form className="mn-m-search-form" onSubmit={handleSearchSubmit} role="search">
          <i className="fa-solid fa-magnifying-glass mn-m-search-icon" aria-hidden="true"></i>
          <input
            type="text"
            className="mn-m-search-input"
            placeholder="Search for subjects, classes or tutors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search subjects, classes or tutors"
          />
          {searchQuery && (
            <button
              type="button"
              className="mn-m-search-clear-btn"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search query"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          )}
        </form>
      </section>

      {/* ============================================================ */}
      {/* 2. CATEGORY SHORTCUTS (Class 9-10, 11-12, Competitive, All)   */}
      {/* ============================================================ */}
      <section className="mn-m-categories-section">
        <div className="mn-m-categories-grid">
          {/* Class 9–10 */}
          <Link to="/classes/9-10" className="mn-m-cat-card cat-blue">
            <div className="mn-m-cat-icon-wrap">
              <i className="fa-solid fa-book-open"></i>
            </div>
            <span className="mn-m-cat-title">Class 9–10</span>
          </Link>

          {/* Class 11–12 */}
          <Link to="/classes/11-12" className="mn-m-cat-card cat-red">
            <div className="mn-m-cat-icon-wrap">
              <i className="fa-solid fa-user-graduate"></i>
            </div>
            <span className="mn-m-cat-title">Class 11–12</span>
          </Link>

          {/* Competitive */}
          <Link to="/search?category=competitive" className="mn-m-cat-card cat-green">
            <div className="mn-m-cat-icon-wrap">
              <i className="fa-solid fa-chart-line"></i>
            </div>
            <span className="mn-m-cat-title">Competitive</span>
          </Link>

          {/* All Subjects */}
          <Link to="/search" className="mn-m-cat-card cat-orange">
            <div className="mn-m-cat-icon-wrap">
              <i className="fa-solid fa-table-cells-large"></i>
            </div>
            <span className="mn-m-cat-title">All Subjects</span>
          </Link>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. HERO BANNER CAROUSEL (4 Real Banners from Image 2)        */}
      {/* ============================================================ */}
      <section
        className="mn-m-banner-section"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        aria-label="Promotional Banners Carousel"
      >
        <div className="mn-m-banner-slider-outer">
          <div
            className="mn-m-banner-track"
            style={{ transform: `translateX(-${currentBanner * 100}%)` }}
          >
            {BANNERS.map((banner, index) => (
              <div key={banner.id} className="mn-m-banner-slide">
                <Link to={banner.link} className="mn-m-banner-link" aria-label={banner.label}>
                  <img
                    src={banner.image}
                    alt={banner.alt}
                    className="mn-m-banner-img"
                    loading={index === 0 ? 'eager' : 'lazy'}
                  />
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Carousel Pagination Dots */}
        <div className="mn-m-carousel-dots" role="tablist" aria-label="Banner slide pagination">
          {BANNERS.map((banner, index) => (
            <button
              key={banner.id}
              type="button"
              className={`mn-m-dot ${currentBanner === index ? 'active' : ''}`}
              onClick={() => setCurrentBanner(index)}
              aria-label={`Go to slide ${index + 1}`}
              aria-selected={currentBanner === index}
              role="tab"
            />
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. PLATFORM TRUST & STATS STRIP (Strictly Real Data)         */}
      {/* ============================================================ */}
      <section className="mn-m-trust-strip-section" aria-label="Platform Highlights">
        <div className="mn-m-trust-strip-container">
          
          {/* Stat 1: Students or Safety */}
          <div className="mn-m-trust-item">
            <div className="mn-m-trust-icon-box trust-orange">
              <i className="fa-solid fa-users"></i>
            </div>
            <div className="mn-m-trust-text">
              <span className="mn-m-trust-val">
                {publicStats.totalStudents > 0
                  ? `${publicStats.totalStudents.toLocaleString('en-IN')}+`
                  : 'Safe'}
              </span>
              <span className="mn-m-trust-label">
                {publicStats.totalStudents > 0 ? 'Happy Students' : 'Verified'}
              </span>
            </div>
          </div>

          {/* Stat 2: Verified Tutors */}
          <div className="mn-m-trust-item">
            <div className="mn-m-trust-icon-box trust-green">
              <i className="fa-solid fa-shield-halved"></i>
            </div>
            <div className="mn-m-trust-text">
              <span className="mn-m-trust-val">
                {(publicStats.totalVerifiedTutors || publicStats.totalTutors) > 0
                  ? `${(publicStats.totalVerifiedTutors || publicStats.totalTutors).toLocaleString('en-IN')}+`
                  : '100%'}
              </span>
              <span className="mn-m-trust-label">Verified Tutors</span>
            </div>
          </div>

          {/* Stat 3: Average Rating or Direct Chat */}
          <div className="mn-m-trust-item">
            <div className="mn-m-trust-icon-box trust-gold">
              <i className="fa-solid fa-star"></i>
            </div>
            <div className="mn-m-trust-text">
              <span className="mn-m-trust-val">
                {publicStats.avgRating > 0 ? `${publicStats.avgRating}/5` : 'Direct'}
              </span>
              <span className="mn-m-trust-label">
                {publicStats.avgRating > 0 ? 'Average Rating' : 'Free Chat'}
              </span>
            </div>
          </div>

          {/* Stat 4: Proximity */}
          <div className="mn-m-trust-item">
            <div className="mn-m-trust-icon-box trust-coral">
              <i className="fa-solid fa-location-dot"></i>
            </div>
            <div className="mn-m-trust-text">
              <span className="mn-m-trust-val">5km</span>
              <span className="mn-m-trust-label">Nearby Tutors</span>
            </div>
          </div>

        </div>
      </section>

      {/* ============================================================ */}
      {/* 5. POPULAR SUBJECTS (Image 1 Reference)                      */}
      {/* ============================================================ */}
      <section className="mn-m-section">
        <div className="mn-m-section-header">
          <h2 className="mn-m-section-title">Popular Subjects</h2>
          <Link to="/search" className="mn-m-view-all-link">
            View All
          </Link>
        </div>

        <div className="mn-m-subjects-grid">
          {POPULAR_SUBJECTS.map((sub) => (
            <button
              key={sub.name}
              type="button"
              className="mn-m-subject-chip"
              onClick={() => handleSubjectClick(sub)}
              aria-label={`Explore ${sub.name}`}
            >
              <div
                className="mn-m-subject-icon-box"
                style={{
                  backgroundColor: isDarkMode ? sub.darkBg : sub.bg,
                  color: sub.color,
                }}
              >
                {sub.symbol ? (
                  <span className="mn-m-subject-symbol">{sub.symbol}</span>
                ) : (
                  <i className={sub.icon}></i>
                )}
              </div>
              <span className="mn-m-subject-name">{sub.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/* 6. FEATURED TUTORS (Real Profiles from Backend)              */}
      {/* ============================================================ */}
      <section className="mn-m-section">
        <div className="mn-m-section-header">
          <h2 className="mn-m-section-title">Featured Tutors</h2>
          <Link to="/search" className="mn-m-view-all-link">
            View All
          </Link>
        </div>

        {loadingTutors ? (
          <div className="mn-m-tutors-list">
            {[1, 2, 3].map((i) => (
              <div key={i} className="mn-m-tutor-skeleton-card">
                <div className="mn-m-skeleton-avatar"></div>
                <div className="mn-m-skeleton-lines">
                  <div className="mn-m-skeleton-line title"></div>
                  <div className="mn-m-skeleton-line sub"></div>
                  <div className="mn-m-skeleton-line tag"></div>
                </div>
              </div>
            ))}
          </div>
        ) : featuredTutors.length > 0 ? (
          <div className="mn-m-tutors-list">
            {featuredTutors.slice(0, 6).map((tutor) => {
              const tutorId = tutor._id || tutor.user?._id || tutor.userId || tutor.id || tutor.user;
              const name = tutor.user?.name || tutor.name || 'Verified Tutor';
              const photo = tutor.profilePhoto?.url || tutor.profilePhoto || tutor.profilePic || tutor.user?.avatar || tutor.user?.profilePic || '';
              
              // Real subjects formatting
              const subjectsList = Array.isArray(tutor.subjects) && tutor.subjects.length > 0
                ? tutor.subjects.slice(0, 2).join(', ')
                : (tutor.subject || 'General Subjects');

              // Real grades / class formatting
              const grades = tutor.grades?.length
                ? `Class ${tutor.grades.slice(0, 2).join(', ')}`
                : (tutor.classes?.length ? `Class ${tutor.classes.slice(0, 2).join(', ')}` : '');

              const classSubjectLine = grades ? `${grades} • ${subjectsList}` : subjectsList;

              // Real location
              const location = tutor.location?.city || tutor.location?.area || tutor.city || '';

              // Real reviews & rating (ONLY if real reviews exist)
              const hasReviews = tutor.totalReviews > 0 && tutor.averageRating;
              const rating = hasReviews ? Number(tutor.averageRating).toFixed(1) : null;
              const reviewCount = tutor.totalReviews || 0;

              // Real verification flag
              const isVerified = tutor.kycStatus === 'VERIFIED' || tutor.verificationStatus === 'approved' || tutor.isApproved === true || tutor.isVerified === true;

              // Real teaching modes
              const modes = tutor.teachingModes || [];
              const isOnline = modes.includes('ONLINE') || modes.includes('online');
              const isOffline = modes.includes('OFFLINE') || modes.includes('offline') || modes.includes('HOME_TUITION');
              let modeLabel = 'Online & Offline';
              if (isOnline && !isOffline) modeLabel = 'Online';
              if (isOffline && !isOnline) modeLabel = 'Home Tuition';

              return (
                <div key={tutorId} className="mn-m-tutor-card">
                  {/* Tutor Avatar with Online Indicator */}
                  <Link to={`/tutor/${tutorId}`} state={{ tutor }} className="mn-m-tutor-avatar-wrap">
                    {photo ? (
                      <img src={photo} alt={name} className="mn-m-tutor-avatar-img" />
                    ) : (
                      <div className="mn-m-tutor-avatar-fallback">
                        {name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="mn-m-online-badge" title="Active on MentorNearby" aria-hidden="true"></span>
                  </Link>

                  {/* Tutor Middle Info */}
                  <div className="mn-m-tutor-info">
                    <div className="mn-m-tutor-name-row">
                      <Link to={`/tutor/${tutorId}`} state={{ tutor }} className="mn-m-tutor-name">
                        {name}
                      </Link>
                      {isVerified && (
                        <i
                          className="fa-solid fa-circle-check mn-m-verified-icon"
                          title="KYC Verified Tutor"
                          aria-label="Verified"
                        ></i>
                      )}
                    </div>

                    <div className="mn-m-tutor-subline">
                      {classSubjectLine}
                    </div>

                    <div className="mn-m-tutor-meta-row">
                      {hasReviews ? (
                        <span className="mn-m-tutor-rating">
                          <i className="fa-solid fa-star mn-m-star-gold"></i> {rating} ({reviewCount}+ reviews)
                        </span>
                      ) : (
                        <span className="mn-m-tutor-new-tag">
                          <i className="fa-solid fa-star mn-m-star-gold"></i> New Tutor
                        </span>
                      )}

                      {location && (
                        <span className="mn-m-tutor-location">
                          <i className="fa-solid fa-location-dot"></i> {location}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tutor Right Column: Mode pill + View Profile CTA */}
                  <div className="mn-m-tutor-action-col">
                    <span className="mn-m-mode-pill">{modeLabel}</span>
                    <Link to={`/tutor/${tutorId}`} state={{ tutor }} className="mn-m-view-profile-btn">
                      View Profile
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mn-m-empty-tutors-card">
            <i className="fa-solid fa-graduation-cap mn-m-empty-icon"></i>
            <h3 className="mn-m-empty-title">Verified Tutors Joining Daily</h3>
            <p className="mn-m-empty-desc">Be among the first teachers to establish your presence on MentorNearby.</p>
            <Link to="/become-tutor" className="mn-m-empty-cta">
              Become a Tutor
            </Link>
          </div>
        )}
      </section>

      {/* ============================================================ */}
      {/* 7. STUDY RESOURCES QUICK ACCESS                              */}
      {/* ============================================================ */}
      <section className="mn-m-section">
        <div className="mn-m-section-header">
          <h2 className="mn-m-section-title">Free Study Materials</h2>
          <Link to="/study-resources" className="mn-m-view-all-link">
            Explore All
          </Link>
        </div>

        <div className="mn-m-resources-grid">
          <Link to="/books" className="mn-m-res-card">
            <div className="mn-m-res-icon-box res-blue">
              <i className="fa-solid fa-book-bookmark"></i>
            </div>
            <div className="mn-m-res-info">
              <span className="mn-m-res-title">NCERT Books & Solutions</span>
              <span className="mn-m-res-sub">Class 1 to 12</span>
            </div>
            <i className="fa-solid fa-chevron-right mn-m-res-arrow"></i>
          </Link>

          <Link to="/study-resources" className="mn-m-res-card">
            <div className="mn-m-res-icon-box res-emerald">
              <i className="fa-solid fa-file-lines"></i>
            </div>
            <div className="mn-m-res-info">
              <span className="mn-m-res-title">Revision Notes & PDFs</span>
              <span className="mn-m-res-sub">Chapter-wise summaries</span>
            </div>
            <i className="fa-solid fa-chevron-right mn-m-res-arrow"></i>
          </Link>

          <Link to="/courses" className="mn-m-res-card">
            <div className="mn-m-res-icon-box res-violet">
              <i className="fa-solid fa-clock-rotate-left"></i>
            </div>
            <div className="mn-m-res-info">
              <span className="mn-m-res-title">Previous Year Papers</span>
              <span className="mn-m-res-sub">CBSE, ICSE & State Boards</span>
            </div>
            <i className="fa-solid fa-chevron-right mn-m-res-arrow"></i>
          </Link>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 8. FREQUENTLY ASKED QUESTIONS (Preserved Accordion)          */}
      {/* ============================================================ */}
      <section className="mn-m-section">
        <div className="mn-m-section-header">
          <h2 className="mn-m-section-title">Frequently Asked Questions</h2>
        </div>

        <div className="mn-m-faq-list">
          {FAQS.map((faq, i) => (
            <div
              key={i}
              className={`mn-m-faq-item ${openFaq === i ? 'open' : ''}`}
            >
              <button
                type="button"
                className="mn-m-faq-question-btn"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                aria-expanded={openFaq === i}
              >
                <span>{faq.q}</span>
                <i className={`fa-solid ${openFaq === i ? 'fa-minus' : 'fa-plus'} mn-m-faq-toggle`}></i>
              </button>
              {openFaq === i && (
                <div className="mn-m-faq-answer">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/* 9. LOCAL TUITION KEYWORDS (Preserved for SEO)                 */}
      {/* ============================================================ */}
      <section className="mn-m-seo-strip">
        <h3 className="mn-m-seo-title">Home Tuition & Tutors Near You</h3>
        <p className="mn-m-seo-text">
          Connect directly with verified tutors in Civil Lines, Rajendra Nagar, Subhash Nagar, Model Town, Rampur Garden and surrounding localities within 5km. Zero commission & free chat.
        </p>
        <div className="mn-m-seo-tags">
          <Link to="/search?location=Civil+Lines" className="mn-m-seo-tag">Civil Lines Tutors</Link>
          <Link to="/search?location=Rajendra+Nagar" className="mn-m-seo-tag">Rajendra Nagar</Link>
          <Link to="/search?location=Model+Town" className="mn-m-seo-tag">Model Town</Link>
          <Link to="/search?location=Subhash+Nagar" className="mn-m-seo-tag">Subhash Nagar</Link>
        </div>
      </section>

    </div>
  );
};

export default MobileHomeApp;
