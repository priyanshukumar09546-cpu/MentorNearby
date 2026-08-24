import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { searchTutors, getPublicStats } from '../../api/search';
import UnlockContactModal from '../../components/payment/UnlockContactModal';
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

const HomePage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState({ location: '', subject: '' });
  const [openFaq, setOpenFaq] = useState(null);
  const [featuredTutors, setFeaturedTutors] = useState([]);
  const [loadingTutors, setLoadingTutors] = useState(true);
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
        const [tutorsRes, statsRes] = await Promise.allSettled([
          searchTutors({ limit: 3, verified: 'true' }),
          getPublicStats(),
        ]);
        if (tutorsRes.status === 'fulfilled') {
          setFeaturedTutors(tutorsRes.value.data?.data?.tutors || []);
        } else {
          setFeaturedTutors([]);
        }
        if (statsRes.status === 'fulfilled') {
          setPublicStats(statsRes.value.data?.data || {});
        }
      } catch (_) {
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
    setSelectedTutorId(tutorId);
    setUnlockModalOpen(true);
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
              <div className="mn-hero-eyebrow-pill">
                <span className="mn-eyebrow-icon">🛡️</span>
                <span>India's Trusted Tutor Platform</span>
              </div>

              {/* Main Headline */}
              <h1 className="mn-hero-main-title" id="mn-hero-heading">
                Find Trusted<br />
                Tutors <span className="mn-gold-highlight">Near You</span>
              </h1>

              {/* Subtitle */}
              <p className="mn-hero-sub-text">
                Connect with background-verified tutors for home tuition, online classes and exam prep.
              </p>

              {/* Unified Quick Search Bar */}
              <form className="mn-hero-search-bar" onSubmit={handleSearch} role="search">
                <div className="mn-search-field">
                  <span className="mn-search-field-icon">📍</span>
                  <input
                    type="text"
                    className="mn-search-input"
                    placeholder="City / Area"
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
                    <option value="">Subject</option>
                    {POPULAR_SUBJECTS.map((s) => (
                      <option key={s.name} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <span className="mn-field-chevron">▾</span>
                </div>

                <button type="submit" className="mn-search-submit-btn">
                  Find a Tutor
                </button>
              </form>

              {/* 2 Large Action CTA Cards */}
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

              {/* 4 Trust Badges in a Row */}
              <div className="mn-hero-trust-row">
                <div className="mn-trust-mini-item">
                  <span className="mn-trust-mini-icon">🛡️</span>
                  <div>
                    <div className="mn-trust-mini-title">KYC Verified Tutors</div>
                    <div className="mn-trust-mini-desc">100% Safe &amp; Secure</div>
                  </div>
                </div>

                <div className="mn-trust-mini-item">
                  <span className="mn-trust-mini-icon">💼</span>
                  <div>
                    <div className="mn-trust-mini-title">Trusted Contact Info</div>
                    <div className="mn-trust-mini-desc">Parents Safety First</div>
                  </div>
                </div>

                <div className="mn-trust-mini-item">
                  <span className="mn-trust-mini-icon">👥</span>
                  <div>
                    <div className="mn-trust-mini-title">Verified Students</div>
                    <div className="mn-trust-mini-desc">Build Real Connections</div>
                  </div>
                </div>

                <div className="mn-trust-mini-item">
                  <span className="mn-trust-mini-icon">📖</span>
                  <div>
                    <div className="mn-trust-mini-title">16+ Subjects Covered</div>
                    <div className="mn-trust-mini-desc">For All Grades</div>
                  </div>
                </div>
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
                  <Link to="/search?verified=true" className="mn-col-view-all">View All</Link>
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
                    const tutorId = tutor._id || tutor.id;
                    const name = tutor.user?.name || tutor.name || 'Tutor';
                    const photo = tutor.profilePhoto?.url || tutor.profilePhoto || tutor.user?.avatar || '';
                    const subject = tutor.subjects?.join(', ') || tutor.subjects?.[0] || 'General Subjects';
                    const classes = tutor.classes?.length ? `Class ${tutor.classes.join(', ')}` : (tutor.grades?.length ? `Class ${tutor.grades.join(', ')}` : 'All Classes');
                    const exp = tutor.experience?.years ? `${tutor.experience.years}+ Years Exp.` : (tutor.experience ? `${tutor.experience} Exp.` : 'Experienced');
                    const qual = tutor.qualifications?.[0]?.degree || tutor.qualifications?.[0]?.title || '';
                    const hasReviews = tutor.totalReviews > 0 && tutor.averageRating;
                    const rating = hasReviews ? Number(tutor.averageRating).toFixed(1) : null;
                    const reviews = tutor.totalReviews || 0;
                    const fee = tutor.fees?.amount ? `₹${tutor.fees.amount} /hr` : (tutor.hourlyRate ? `₹${tutor.hourlyRate} /hr` : 'Fee on request');
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

      {/* Unlock Contact Modal */}
      {unlockModalOpen && (
        <UnlockContactModal
          isOpen={unlockModalOpen}
          onClose={() => setUnlockModalOpen(false)}
          tutorId={selectedTutorId}
        />
      )}
    </main>
  );
};

export default HomePage;
