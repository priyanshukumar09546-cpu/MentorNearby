// ============================================================
// components/home/MobileHomeApp.jsx
// MentorNearby Mobile App-Style Interface
// Inspired by Reference Design (media_1789107906443.png)
// Strictly Real Data • Swipeable Carousel • Native iOS/Android Feel
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import './MobileHomeApp.css';

// 4 Promotional Banners (Slide 1 matches reference design)
const BANNERS = [
  {
    id: 1,
    image: '/images/home/home-promo-banner.png',
    alt: 'Learn Smarter with Verified Tutors - Personalized learning. Real results. Online or Offline.',
    link: '/search',
    label: 'Explore Tutors',
  },
  {
    id: 2,
    image: '/banners/banner-1.png',
    alt: 'Find the Right Tutor Near You - Learn from verified tutors in your neighborhood',
    link: '/search',
    label: 'Find Your Tutor',
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

// Popular Subjects (matching Reference Design with pastel rounded icon chips)
const POPULAR_SUBJECTS = [
  { name: 'Mathematics', symbol: 'π', color: '#2563EB', bg: '#EFF6FF', darkBg: 'rgba(37, 99, 235, 0.16)' },
  { name: 'Physics', icon: 'fa-solid fa-atom', color: '#E11D48', bg: '#FDF2F8', darkBg: 'rgba(225, 29, 72, 0.16)' },
  { name: 'Chemistry', icon: 'fa-solid fa-flask', color: '#059669', bg: '#F0FDF4', darkBg: 'rgba(5, 150, 105, 0.16)' },
  { name: 'Biology', icon: 'fa-solid fa-dna', color: '#9333EA', bg: '#FAF5FF', darkBg: 'rgba(147, 51, 234, 0.16)' },
  { name: 'English', icon: 'fa-solid fa-book-open', color: '#D97706', bg: '#FFF7ED', darkBg: 'rgba(217, 119, 6, 0.16)' },
  { name: 'Computer Science', icon: 'fa-solid fa-laptop-code', color: '#4F46E5', bg: '#EEF2FF', darkBg: 'rgba(79, 70, 229, 0.16)' },
  { name: 'Economics', icon: 'fa-solid fa-chart-simple', color: '#E11D48', bg: '#FEF2F2', darkBg: 'rgba(225, 29, 72, 0.16)' },
  { name: 'More', icon: 'fa-solid fa-ellipsis', color: '#64748B', bg: '#F1F5F9', darkBg: 'rgba(100, 116, 139, 0.16)', isMore: true },
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

  // Auto-slide banners every 5 seconds (pausing on user touch/hover)
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % BANNERS.length);
    }, 5000);
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
      navigate('/subjects');
    } else {
      navigate(`/tutors?subject=${encodeURIComponent(sub.name)}`);
    }
  };

  // Strictly Dynamic Platform Stats from backend API / DB
  const studentCount = Number(publicStats.totalStudents || 0);
  const verifiedTutorCount = Number(publicStats.totalVerifiedTutors || 0);
  const ratingVal = Number(publicStats.avgRating || 0);
  const totalTutors = Number(publicStats.totalTutors || 0);

  return (
    <div className={`mn-mobile-home-app ${isDarkMode ? 'dark' : 'light'}`}>
      
      {/* ============================================================ */}
      {/* 1. LARGE ROUNDED SEARCH BAR (Matching Reference)             */}
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
          <button
            type="button"
            className="mn-m-search-filter-btn"
            onClick={() => navigate('/search')}
            aria-label="Filter search results"
          >
            <i className="fa-solid fa-sliders"></i>
          </button>
        </form>
      </section>

      {/* ============================================================ */}
      {/* 2. THREE PRIMARY ACTION CARDS (Matching Reference Design)     */}
      {/* ============================================================ */}
      <section className="mn-m-action-cards-section" aria-label="Primary Quick Actions">
        <div className="mn-m-action-cards-grid">
          {/* Card A: Find a Tutor */}
          <Link
            to="/search"
            className="mn-m-action-card card-pink"
            aria-label="Find a Tutor: Get the best tutors near you"
          >
            <div className="mn-m-card-art-wrap">
              <img
                src="/images/home/card-find-tutor-art.png"
                alt="Find a Tutor"
                className="mn-m-card-art-img"
                loading="eager"
              />
            </div>
            <div className="mn-m-card-body">
              <h3 className="mn-m-card-title">Find a Tutor</h3>
              <p className="mn-m-card-sub">Get the best tutors near you</p>
              <div className="mn-m-card-cta-btn cta-pink" aria-hidden="true">
                <i className="fa-solid fa-chevron-right"></i>
              </div>
            </div>
          </Link>

          {/* Card B: Become a Tutor */}
          <Link
            to="/become-tutor"
            className="mn-m-action-card card-yellow"
            aria-label="Become a Tutor: Share your knowledge, earn & grow"
          >
            <div className="mn-m-card-art-wrap">
              <img
                src="/images/home/card-become-tutor-art.png"
                alt="Become a Tutor"
                className="mn-m-card-art-img"
                loading="eager"
              />
            </div>
            <div className="mn-m-card-body">
              <h3 className="mn-m-card-title">Become a Tutor</h3>
              <p className="mn-m-card-sub">Share your knowledge earn &amp; grow</p>
              <div className="mn-m-card-cta-btn cta-yellow" aria-hidden="true">
                <i className="fa-solid fa-chevron-right"></i>
              </div>
            </div>
          </Link>

          {/* Card C: Find Students */}
          <Link
            to="/find-students"
            className="mn-m-action-card card-mint"
            aria-label="Find Students: Get more students for your classes"
          >
            <div className="mn-m-card-art-wrap">
              <img
                src="/images/home/card-find-students-art.png"
                alt="Find Students"
                className="mn-m-card-art-img"
                loading="eager"
              />
            </div>
            <div className="mn-m-card-body">
              <h3 className="mn-m-card-title">Find Students</h3>
              <p className="mn-m-card-sub">Get more students for your classes</p>
              <div className="mn-m-card-cta-btn cta-green" aria-hidden="true">
                <i className="fa-solid fa-chevron-right"></i>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. PROMOTIONAL BANNER CAROUSEL (Matching Reference)          */}
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
      {/* 4. REAL PLATFORM STATS STRIP (Strictly Real Data)             */}
      {/* ============================================================ */}
      <section className="mn-m-trust-strip-section" aria-label="Platform Highlights">
        <div className="mn-m-trust-strip-container">
          
          {/* Stat 1: Happy Students */}
          <div className="mn-m-trust-item">
            <div className="mn-m-trust-icon-box trust-pink">
              <i className="fa-solid fa-users"></i>
            </div>
            <div className="mn-m-trust-text">
              <span className="mn-m-trust-val">
                {studentCount > 0 ? `${studentCount}+` : 'Active'}
              </span>
              <span className="mn-m-trust-label">Happy Students</span>
            </div>
          </div>

          {/* Stat 2: Verified Tutors */}
          <div className="mn-m-trust-item">
            <div className="mn-m-trust-icon-box trust-green">
              <i className="fa-solid fa-shield-halved"></i>
            </div>
            <div className="mn-m-trust-text">
              <span className="mn-m-trust-val">
                {verifiedTutorCount > 0
                  ? totalTutors > 0 && verifiedTutorCount >= totalTutors
                    ? `${Math.round((verifiedTutorCount / totalTutors) * 100)}%`
                    : `${verifiedTutorCount}+`
                  : 'Verified'}
              </span>
              <span className="mn-m-trust-label">Verified Tutors</span>
            </div>
          </div>

          {/* Stat 3: Average Rating */}
          <div className="mn-m-trust-item">
            <div className="mn-m-trust-icon-box trust-gold">
              <i className="fa-solid fa-star"></i>
            </div>
            <div className="mn-m-trust-text">
              <span className="mn-m-trust-val">
                {ratingVal > 0 ? `${ratingVal.toFixed(1)}/5` : 'Top Rated'}
              </span>
              <span className="mn-m-trust-label">
                {ratingVal > 0 ? 'Average Rating' : 'Quality Assured'}
              </span>
            </div>
          </div>

          {/* Stat 4: Nearby Tutors */}
          <div className="mn-m-trust-item">
            <div className="mn-m-trust-icon-box trust-coral">
              <i className="fa-solid fa-location-dot"></i>
            </div>
            <div className="mn-m-trust-text">
              <span className="mn-m-trust-val">
                {totalTutors > 0 ? `${totalTutors}+` : 'Nearby'}
              </span>
              <span className="mn-m-trust-label">Nearby Tutors</span>
            </div>
          </div>

        </div>
      </section>

      {/* ============================================================ */}
      {/* 5. FEATURED TUTORS (Moved High Up, Matching Reference)        */}
      {/* ============================================================ */}
      <section className="mn-m-section mn-m-featured-section">
        <div className="mn-m-section-header">
          <h2 className="mn-m-section-title">Featured Tutors</h2>
          <Link to="/tutors" className="mn-m-view-all-link">
            <span>View All</span>
            <i className="fa-solid fa-chevron-right" style={{ fontSize: '11px', marginLeft: '3px' }}></i>
          </Link>
        </div>

        {loadingTutors ? (
          <div className="mn-m-tutors-hscroll">
            {[1, 2, 3].map((i) => (
              <div key={i} className="mn-m-tutor-vcard skeleton">
                <div className="mn-m-skeleton-avatar"></div>
                <div className="mn-m-skeleton-line title"></div>
                <div className="mn-m-skeleton-line sub"></div>
                <div className="mn-m-skeleton-line loc"></div>
                <div className="mn-m-skeleton-line btn"></div>
              </div>
            ))}
          </div>
        ) : featuredTutors.length > 0 ? (
          <div className="mn-m-tutors-hscroll">
            {featuredTutors.map((tutor) => {
              const tutorId = tutor._id || tutor.user?._id || tutor.userId || tutor.id || tutor.user;
              const name = tutor.user?.name || tutor.name || 'Verified Tutor';
              const photo = tutor.profilePhoto?.url || tutor.profilePhoto || tutor.profilePic || tutor.user?.avatar || tutor.user?.profilePic || '';
              
              // Real subjects formatting
              const subjectsList = Array.isArray(tutor.subjects) && tutor.subjects.length > 0
                ? tutor.subjects.slice(0, 2).join(', ')
                : (tutor.subject || '');

              // Real grades / class formatting
              const grades = tutor.grades?.length
                ? `Class ${tutor.grades.slice(0, 2).map((g) => g.toString().replace(/Class\s*/i, '')).join('–')}`
                : (tutor.classes?.length ? `Class ${tutor.classes.slice(0, 2).map((c) => c.toString().replace(/Class\s*/i, '')).join('–')}` : '');

              const classSubjectLine = [subjectsList, grades].filter(Boolean).join(' • ');

              // Real location
              const location = tutor.location?.city || tutor.location?.area || tutor.city || '';

              // Real reviews & rating (ONLY if real reviews exist)
              const hasRating = (tutor.averageRating > 0 || tutor.rating > 0);
              const rating = hasRating ? Number(tutor.averageRating || tutor.rating).toFixed(1) : null;

              // Real teaching modes
              const modes = (tutor.teachingModes || []).map((m) => m.toString().toUpperCase());
              const isOnline = modes.length === 0 || modes.some((m) => m.includes('ONLINE'));
              const isOffline = modes.some((m) => m.includes('OFFLINE') || m.includes('HOME'));

              return (
                <div key={tutorId} className="mn-m-tutor-vcard">
                  {/* Avatar + Rating Row */}
                  <div className="mn-m-tutor-vcard-top">
                    <Link to={`/tutor/${tutorId}`} state={{ tutor }} className="mn-m-tutor-avatar-wrap">
                      {photo ? (
                        <img
                          src={photo}
                          alt={name}
                          className="mn-m-tutor-avatar-img"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.parentElement?.querySelector('.mn-m-tutor-avatar-fallback');
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        className="mn-m-tutor-avatar-fallback"
                        style={{ display: photo ? 'none' : 'flex' }}
                      >
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <span className="mn-m-online-badge" title="Active on MentorNearby" aria-hidden="true"></span>
                    </Link>

                    {hasRating && (
                      <div className="mn-m-tutor-rating-pill">
                        <i className="fa-solid fa-star mn-m-star-gold"></i>
                        <span>{rating}</span>
                      </div>
                    )}
                  </div>

                  {/* Body: Name, Subjects, Location, Modes */}
                  <div className="mn-m-tutor-vcard-body">
                    <Link to={`/tutor/${tutorId}`} state={{ tutor }} className="mn-m-tutor-name" title={name}>
                      {name}
                    </Link>

                    {classSubjectLine && (
                      <div className="mn-m-tutor-subline" title={classSubjectLine}>
                        {classSubjectLine}
                      </div>
                    )}

                    {location && (
                      <div className="mn-m-tutor-locline">
                        <i className="fa-solid fa-location-dot"></i>
                        <span>{location}</span>
                      </div>
                    )}

                    <div className="mn-m-tutor-modes-row">
                      {isOnline && <span className="mn-m-mode-badge online">Online</span>}
                      {isOffline && <span className="mn-m-mode-badge offline">Offline</span>}
                    </div>
                  </div>

                  {/* Outlined Action CTA Button */}
                  <Link to={`/tutor/${tutorId}`} state={{ tutor }} className="mn-m-view-profile-btn">
                    <span>View Profile</span>
                    <i className="fa-solid fa-arrow-right"></i>
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mn-m-empty-tutors-card">
            <div className="mn-m-empty-icon-wrap">
              <i className="fa-solid fa-user-graduate mn-m-empty-icon"></i>
            </div>
            <h3 className="mn-m-empty-title">No tutors available yet</h3>
            <p className="mn-m-empty-desc">Be among the first teachers to establish your presence on MentorNearby.</p>
            <Link to="/become-tutor" className="mn-m-empty-cta">
              Become a Tutor
            </Link>
          </div>
        )}
      </section>

      {/* ============================================================ */}
      {/* 6. POPULAR SUBJECTS (Horizontal Scroll with Pastel Chips)    */}
      {/* ============================================================ */}
      <section className="mn-m-section">
        <div className="mn-m-section-header">
          <h2 className="mn-m-section-title">Popular Subjects</h2>
          <Link to="/subjects" className="mn-m-view-all-link">
            <span>View All</span>
          </Link>
        </div>

        <div className="mn-m-subjects-hscroll">
          {POPULAR_SUBJECTS.map((sub) => (
            <button
              key={sub.name}
              type="button"
              className="mn-m-subject-chip-item"
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
      {/* 7. FREE STUDY MATERIALS (Matching Reference Cards)           */}
      {/* ============================================================ */}
      <section className="mn-m-section">
        <div className="mn-m-section-header">
          <h2 className="mn-m-section-title">Free Study Materials</h2>
          <Link to="/study-resources" className="mn-m-view-all-link">
            <span>Explore All</span>
          </Link>
        </div>

        <div className="mn-m-resources-hscroll">
          <Link to="/books" className="mn-m-res-card-ref">
            <div className="mn-m-res-icon-box res-blue">
              <i className="fa-solid fa-book-bookmark"></i>
            </div>
            <div className="mn-m-res-info">
              <span className="mn-m-res-title">NCERT Books &amp; Solutions</span>
              <span className="mn-m-res-sub">Class 1 to 12</span>
            </div>
            <i className="fa-solid fa-chevron-right mn-m-res-arrow"></i>
          </Link>

          <Link to="/study-resources" className="mn-m-res-card-ref">
            <div className="mn-m-res-icon-box res-emerald">
              <i className="fa-solid fa-file-lines"></i>
            </div>
            <div className="mn-m-res-info">
              <span className="mn-m-res-title">Revision Notes &amp; PDFs</span>
              <span className="mn-m-res-sub">Chapter-wise</span>
            </div>
            <i className="fa-solid fa-chevron-right mn-m-res-arrow"></i>
          </Link>

          <Link to="/courses" className="mn-m-res-card-ref">
            <div className="mn-m-res-icon-box res-violet">
              <i className="fa-solid fa-clock-rotate-left"></i>
            </div>
            <div className="mn-m-res-info">
              <span className="mn-m-res-title">Previous Year Papers</span>
              <span className="mn-m-res-sub">CBSE, ICSE &amp; more</span>
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
        <h3 className="mn-m-seo-title">Home Tuition &amp; Tutors Near You</h3>
        <p className="mn-m-seo-text">
          Connect directly with verified tutors in Civil Lines, Rajendra Nagar, Subhash Nagar, Model Town, Rampur Garden and surrounding localities within 5km. Zero commission &amp; free chat.
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
