// ============================================================
// pages/Subject/SubjectPage.jsx
// Dedicated Subject Hub with [Tutors] and [Notes & Study Material] Tabs
// Strictly Real Data • Direct Formula Sheet Master Combo PDF Viewer
// ============================================================

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { searchTutors } from '../../api/search';
import { fetchSubjectStudyResources, downloadStudyResourceComboFile } from '../../api/studyResources';
import { downloadWatermarkedNote } from '../../api/notes';
import StudyResourceViewerModal from '../../components/studyResources/StudyResourceViewerModal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import './SubjectPage.css';

// Subject visual branding dictionary
const SUBJECT_CONFIGS = {
  mathematics: {
    name: 'Mathematics',
    symbol: 'π',
    color: '#2563EB',
    bg: '#EFF6FF',
    border: '#DBEAFE',
    iconColor: '#1E40AF',
    subtitle: 'Find expert Mathematics tutors for all classes. Get help with concepts, homework and exam preparation.',
    graphics: '📐',
  },
  maths: {
    name: 'Mathematics',
    symbol: 'π',
    color: '#2563EB',
    bg: '#EFF6FF',
    border: '#DBEAFE',
    iconColor: '#1E40AF',
    subtitle: 'Find expert Mathematics tutors for all classes. Get help with concepts, homework and exam preparation.',
    graphics: '📐',
  },
  physics: {
    name: 'Physics',
    symbol: '⚛️',
    color: '#DB2777',
    bg: '#FDF2F8',
    border: '#FCE7F3',
    iconColor: '#9D174D',
    subtitle: 'Master Physics mechanics, electromagnetism, and optics with qualified local tutors.',
    graphics: '🔭',
  },
  chemistry: {
    name: 'Chemistry',
    symbol: '🧪',
    color: '#059669',
    bg: '#F0FDF4',
    border: '#DCFCE7',
    iconColor: '#047857',
    subtitle: 'Understand Organic, Inorganic and Physical Chemistry through personalized home tuition.',
    graphics: '⚗️',
  },
  biology: {
    name: 'Biology',
    symbol: '🧬',
    color: '#9333EA',
    bg: '#FAF5FF',
    border: '#F3E8FF',
    iconColor: '#7E22CE',
    subtitle: 'Excel in Botany, Zoology, human anatomy and medical entrance fundamentals.',
    graphics: '🔬',
  },
  science: {
    name: 'Science',
    symbol: '🔬',
    color: '#0D9488',
    bg: '#F0FDFA',
    border: '#CCFBF1',
    iconColor: '#0F766E',
    subtitle: 'Explore foundational concepts in Physics, Chemistry, and Biology for school and board exams.',
    graphics: '🧪',
  },
  english: {
    name: 'English',
    symbol: '📖',
    color: '#D97706',
    bg: '#FFF7ED',
    border: '#FFEDD5',
    iconColor: '#B45309',
    subtitle: 'Improve English grammar, literature analysis, writing skills and spoken fluency.',
    graphics: '📚',
  },
  'computer science': {
    name: 'Computer Science',
    symbol: '💻',
    color: '#4F46E5',
    bg: '#EEF2FF',
    border: '#E0E7FF',
    iconColor: '#3730A3',
    subtitle: 'Learn Python, Java, C++, data structures and board curriculum programming.',
    graphics: '🖥️',
  },
  economics: {
    name: 'Economics',
    symbol: '📈',
    color: '#E11D48',
    bg: '#FEF2F2',
    border: '#FEE2E2',
    iconColor: '#BE123C',
    subtitle: 'Learn Microeconomics, Macroeconomics, Indian Economic Development and statistics.',
    graphics: '📊',
  },
  accountancy: {
    name: 'Accountancy',
    symbol: '₹',
    color: '#D97706',
    bg: '#FEF3C7',
    border: '#FDE68A',
    iconColor: '#B45309',
    subtitle: 'Master financial accounting, company balance sheets, partnership accounts and GST.',
    graphics: '📑',
  },
  'competitive exams': {
    name: 'Competitive Exams',
    symbol: '🏆',
    color: '#0D9488',
    bg: '#F0FDFA',
    border: '#CCFBF1',
    iconColor: '#0F766E',
    subtitle: 'Target JEE, NEET, Olympiads and Foundation exams with top-ranked mentors.',
    graphics: '🎯',
  },
};

const CLASS_OPTIONS = [
  { id: '9', label: 'Class 9' },
  { id: '10', label: 'Class 10' },
  { id: '11', label: 'Class 11' },
  { id: '12', label: 'Class 12' },
];

const SubjectPage = () => {
  const { subjectName, classLevel: paramClassLevel, subject: paramSubject } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { showToast } = useToast();

  // Canonical subject and initial class
  const rawSubject = subjectName || paramSubject || 'Mathematics';
  const decodedSubject = decodeURIComponent(rawSubject).trim();
  const subjectKey = decodedSubject.toLowerCase();
  const subjectConfig = SUBJECT_CONFIGS[subjectKey] || {
    name: decodedSubject,
    symbol: decodedSubject.charAt(0).toUpperCase(),
    color: '#2563EB',
    bg: '#EFF6FF',
    border: '#DBEAFE',
    iconColor: '#1E40AF',
    subtitle: `Find expert ${decodedSubject} tutors and study materials for school and board exams.`,
    graphics: '📚',
  };

  // State: Tab ('tutors' | 'resources')
  const initialTab = searchParams.get('tab') === 'resources' || searchParams.get('tab') === 'notes' ? 'resources' : 'tutors';
  const [activeTab, setActiveTab] = useState(initialTab);

  // State: Selected Class (Default '9' or query param)
  const initialClass = searchParams.get('class') || paramClassLevel || '9';
  const [selectedClass, setSelectedClass] = useState(initialClass);

  // Real Tutors State
  const [tutors, setTutors] = useState([]);
  const [loadingTutors, setLoadingTutors] = useState(true);

  // Real Study Resources & Master Combo State
  const [studyData, setStudyData] = useState(null);
  const [loadingResources, setLoadingResources] = useState(false);
  const [selectedResourceTypeFilter, setSelectedResourceTypeFilter] = useState('ALL');

  // PDF Viewer Modal State (Direct Master Combo PDF Viewing)
  const [viewerModalState, setViewerModalState] = useState({
    isOpen: false,
    resourceId: null,
    resource: null,
    isCombo: false,
  });

  // Keep URL query params in sync
  useEffect(() => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('tab', activeTab);
    nextParams.set('class', selectedClass);
    setSearchParams(nextParams, { replace: true });
  }, [activeTab, selectedClass]);

  // 1. Fetch REAL Tutors from MongoDB database
  useEffect(() => {
    let isMounted = true;
    const fetchRealTutors = async () => {
      try {
        setLoadingTutors(true);
        const res = await searchTutors({
          subject: subjectConfig.name,
          class: selectedClass,
          limit: 12,
        });

        if (!isMounted) return;
        const list = res.data?.data?.tutors || res.data?.tutors || res.data?.data || (Array.isArray(res.data) ? res.data : []);
        setTutors(Array.isArray(list) ? list : []);
      } catch (err) {
        if (!isMounted) return;
        console.error('Failed to load tutors for subject', err);
        setTutors([]);
      } finally {
        if (isMounted) setLoadingTutors(false);
      }
    };

    fetchRealTutors();
    return () => {
      isMounted = false;
    };
  }, [subjectConfig.name, selectedClass]);

  // 2. Fetch REAL Study Resources & Master Combo Bundle from MongoDB
  useEffect(() => {
    let isMounted = true;
    const fetchResources = async () => {
      try {
        setLoadingResources(true);
        const res = await fetchSubjectStudyResources(selectedClass, subjectConfig.name);
        if (!isMounted) return;
        setStudyData(res?.data || res);
      } catch (err) {
        if (!isMounted) return;
        console.error('Failed to load study resources for subject', err);
        setStudyData(null);
      } finally {
        if (isMounted) setLoadingResources(false);
      }
    };

    fetchResources();
    return () => {
      isMounted = false;
    };
  }, [subjectConfig.name, selectedClass]);

  // Extract chapters and bundles
  const chapters = useMemo(() => {
    if (!studyData?.chapters) return [];
    return Array.isArray(studyData.chapters) ? studyData.chapters : [];
  }, [studyData]);

  const formulaBundle = useMemo(() => {
    return studyData?.combos?.formulaBundle || studyData?.bundle || null;
  }, [studyData]);

  // ------------------------------------------------------------
  // SECTION 4, 5, 6: Direct Single Complete Combo PDF Viewer
  // Does NOT open a chapter-wise resource list.
  // Directly opens the single uploaded master combo PDF!
  // ------------------------------------------------------------
  const handleOpenMasterFormulaCombo = (bundle) => {
    const targetBundle = bundle || formulaBundle;
    const bId = targetBundle?._id || targetBundle?.id || `combo-c${selectedClass}-${subjectConfig.name.toLowerCase().slice(0, 4)}-formula`;

    setViewerModalState({
      isOpen: true,
      resourceId: bId,
      resource: {
        ...targetBundle,
        id: bId,
        _id: bId,
        title: targetBundle?.title || `Class ${selectedClass} ${subjectConfig.name} Formula Sheets Combo`,
        isCombo: true,
        comboType: 'FORMULA_COMBO',
      },
      isCombo: true,
    });
  };

  // Direct Free Combo Download
  const handleDownloadMasterCombo = async (bundle) => {
    const targetBundle = bundle || formulaBundle;
    const bId = targetBundle?._id || targetBundle?.id;
    if (!bId) return;

    try {
      if (showToast) showToast('📥 Preparing master combo PDF download...', 'info');
      const res = await downloadStudyResourceComboFile(bId);
      const url = res?.downloadUrl || res?.data?.downloadUrl || targetBundle?.fileUrl || `/api/study-resources/combo/stream/${bId}?download=true`;
      if (url) {
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${(targetBundle?.title || 'formula_sheet_combo').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`);
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        link.remove();
        if (showToast) showToast('✅ Combo PDF download started (100% Free)', 'success');
      }
    } catch (err) {
      const targetUrl = targetBundle?.fileUrl || `/api/study-resources/combo/stream/${bId}?download=true`;
      const link = document.createElement('a');
      link.href = targetUrl;
      link.setAttribute('download', `${(targetBundle?.title || 'formula_sheet_combo').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`);
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      link.remove();
      if (showToast) showToast('✅ Combo PDF downloaded (100% Free)', 'success');
    }
  };

  // Open individual chapter resource in PDF viewer
  const handleOpenChapterResource = (res) => {
    const rId = res?._id || res?.id;
    setViewerModalState({
      isOpen: true,
      resourceId: rId,
      resource: res,
      isCombo: false,
    });
  };

  return (
    <div className="mn-subj-page">
      <div className="mn-subj-container">

        {/* ------------------------------------------------------------ */}
        {/* 1. TOP HEADER BAR                                             */}
        {/* ------------------------------------------------------------ */}
        <header className="mn-subj-topbar">
          <button
            type="button"
            className="mn-subj-back-btn"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <i className="fa-solid fa-chevron-left" aria-hidden="true"></i>
          </button>
          <h1 className="mn-subj-header-title">{subjectConfig.name}</h1>
          <div className="mn-subj-header-spacer" aria-hidden="true"></div>
        </header>

        {/* ------------------------------------------------------------ */}
        {/* 2. SUBJECT HERO BANNER (Screens 2 & 3 Reference)             */}
        {/* ------------------------------------------------------------ */}
        <section
          className="mn-subj-hero-card"
          style={{
            backgroundColor: subjectConfig.bg,
            borderColor: subjectConfig.border,
          }}
          aria-label={`${subjectConfig.name} Overview`}
        >
          <div
            className="mn-subj-hero-icon-box"
            style={{ color: subjectConfig.iconColor }}
          >
            {subjectConfig.symbol}
          </div>

          <div className="mn-subj-hero-info">
            <h2 className="mn-subj-hero-title">{subjectConfig.name}</h2>
            <p className="mn-subj-hero-subtitle">{subjectConfig.subtitle}</p>
          </div>

          <div className="mn-subj-hero-graphics" aria-hidden="true">
            {subjectConfig.graphics}
          </div>
        </section>

        {/* ------------------------------------------------------------ */}
        {/* 3. SEGMENTED TABS: [Tutors] [Notes & Study Material]          */}
        {/* ------------------------------------------------------------ */}
        <nav className="mn-subj-tabs-wrap" role="tablist" aria-label="Subject View Tabs">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'tutors'}
            className={`mn-subj-tab-btn ${activeTab === 'tutors' ? 'active' : ''}`}
            onClick={() => setActiveTab('tutors')}
          >
            <i className="fa-solid fa-user-graduate"></i>
            <span>Tutors</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'resources'}
            className={`mn-subj-tab-btn ${activeTab === 'resources' ? 'active' : ''}`}
            onClick={() => setActiveTab('resources')}
          >
            <i className="fa-solid fa-book-open"></i>
            <span>Notes &amp; Study Material</span>
          </button>
        </nav>

        {/* ============================================================ */}
        {/* TAB 1: TUTORS TAB (Screen 2 Reference)                       */}
        {/* ============================================================ */}
        {activeTab === 'tutors' && (
          <div className="mn-subj-tab-content" role="tabpanel" aria-label="Tutors">

            {/* Class Selection Chips */}
            <div className="mn-subj-class-section">
              <h3 className="mn-subj-section-label">Select a Class</h3>
              <div className="mn-subj-class-chips" role="radiogroup" aria-label="Select Class for Tutors">
                {CLASS_OPTIONS.map((cls) => (
                  <button
                    key={cls.id}
                    type="button"
                    role="radio"
                    aria-checked={selectedClass === cls.id}
                    className={`mn-subj-class-chip ${selectedClass === cls.id ? 'active' : ''}`}
                    onClick={() => setSelectedClass(cls.id)}
                  >
                    {cls.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 4 Mini Trust Badges */}
            <div className="mn-subj-mini-trust-grid" aria-label="Platform Highlights">
              <div className="mn-subj-mini-trust-item">
                <span className="mn-subj-mini-trust-icon">🛡️</span>
                <span className="mn-subj-mini-trust-text">Verified Tutors</span>
              </div>
              <div className="mn-subj-mini-trust-item">
                <span className="mn-subj-mini-trust-icon">📍</span>
                <span className="mn-subj-mini-trust-text">Nearby Tutors</span>
              </div>
              <div className="mn-subj-mini-trust-item">
                <span className="mn-subj-mini-trust-icon">💰</span>
                <span className="mn-subj-mini-trust-text">Affordable Rates</span>
              </div>
              <div className="mn-subj-mini-trust-item">
                <span className="mn-subj-mini-trust-icon">💬</span>
                <span className="mn-subj-mini-trust-text">Free Chat</span>
              </div>
            </div>

            {/* Section Header with Filter */}
            <div className="mn-subj-list-header">
              <h3 className="mn-subj-list-title">
                Top {subjectConfig.name} Tutors (Class {selectedClass})
              </h3>
              <button
                type="button"
                className="mn-subj-filter-btn"
                onClick={() => navigate(`/search?subject=${encodeURIComponent(subjectConfig.name)}&class=${selectedClass}`)}
              >
                <i className="fa-solid fa-sliders"></i>
                <span>Filter</span>
              </button>
            </div>

            {/* Real Tutors List */}
            {loadingTutors ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748B' }}>
                <div className="spinner" style={{ margin: '0 auto 12px', width: 32, height: 32, borderColor: '#CBD5E1', borderTopColor: '#2563EB' }}></div>
                <p style={{ fontSize: 13, fontWeight: 600 }}>Loading real tutors for {subjectConfig.name}...</p>
              </div>
            ) : tutors.length > 0 ? (
              <div className="mn-subj-tutors-list">
                {tutors.map((tutor) => {
                  const tutorId = tutor._id || tutor.user?._id || tutor.userId || tutor.id;
                  const name = tutor.user?.name || tutor.name || 'Verified Mentor';
                  const photo = tutor.profilePhoto?.url || tutor.profilePhoto || tutor.profilePic || tutor.user?.avatar || '';
                  const isVerified = tutor.kycStatus === 'VERIFIED' || tutor.isVerified === true;
                  const hasReviews = tutor.totalReviews > 0 && tutor.averageRating;
                  const rating = hasReviews ? Number(tutor.averageRating).toFixed(1) : null;
                  const reviews = tutor.totalReviews || 0;
                  const qualification = tutor.qualifications?.[0]?.degree || tutor.qualifications?.[0]?.title || tutor.education?.[0]?.degree || tutor.qualification || tutor.bio || '';
                  const location = tutor.location?.city || tutor.location?.area || '';
                  const grades = tutor.grades?.length ? tutor.grades : tutor.classes?.length ? tutor.classes : [`${selectedClass}`];

                  return (
                    <article key={tutorId} className="mn-subj-tutor-card">
                      {/* Avatar */}
                      <Link to={`/tutor/${tutorId}`} className="mn-subj-tutor-avatar-wrap" style={{ textDecoration: 'none' }}>
                        {photo ? (
                          <img src={photo} alt={name} className="mn-subj-tutor-avatar-img" />
                        ) : (
                          <span className="mn-subj-tutor-avatar-initials">
                            {name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </Link>

                      {/* Info */}
                      <div className="mn-subj-tutor-info">
                        <div className="mn-subj-tutor-top-row">
                          <h4 className="mn-subj-tutor-name">
                            <Link to={`/tutor/${tutorId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                              {name}
                            </Link>
                          </h4>
                          {isVerified && (
                            <span className="mn-subj-verified-check" title="Verified KYC Tutor">
                              <i className="fa-solid fa-circle-check"></i>
                            </span>
                          )}
                        </div>

                        {hasReviews ? (
                          <div className="mn-subj-tutor-rating-row">
                            <span className="mn-subj-star">⭐</span>
                            <span className="mn-subj-rating-num">{rating}</span>
                            <span className="mn-subj-reviews-count">({reviews} reviews)</span>
                          </div>
                        ) : (
                          <div className="mn-subj-tutor-rating-row">
                            <span className="mn-subj-star">⭐</span>
                            <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Verified Tutor</span>
                          </div>
                        )}

                        {qualification && (
                          <p className="mn-subj-tutor-sub-details" title={qualification}>
                            {qualification}
                          </p>
                        )}

                        <div className="mn-subj-tutor-tags-row">
                          {grades.slice(0, 2).map((g) => (
                            <span key={g} className="mn-subj-tutor-tag">
                              Class {g}
                            </span>
                          ))}
                          <span className="mn-subj-tutor-tag">
                            {subjectConfig.name}
                          </span>
                        </div>
                      </div>

                      {/* CTA Col */}
                      <div className="mn-subj-tutor-action-col">
                        {location ? (
                          <span className="mn-subj-tutor-dist">
                            <i className="fa-solid fa-location-dot"></i> {location}
                          </span>
                        ) : (
                          <span className="mn-subj-tutor-dist">
                            <i className="fa-solid fa-location-dot"></i> Nearby
                          </span>
                        )}

                        <Link
                          to={`/tutor/${tutorId}`}
                          className="mn-subj-view-profile-btn"
                          state={{ tutor }}
                        >
                          View Profile
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              /* Strictly Real Empty State (No Mock/Sample Cards) */
              <div className="mn-subj-empty-state">
                <div className="mn-subj-empty-icon">🔍</div>
                <p className="mn-subj-empty-text">
                  No tutors found for {subjectConfig.name} in Class {selectedClass} yet.
                </p>
                <button
                  type="button"
                  className="mn-subj-empty-btn"
                  onClick={() => navigate('/search')}
                >
                  Explore All Verified Tutors
                </button>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: NOTES & STUDY MATERIAL TAB (Screen 3 Reference)       */}
        {/* ============================================================ */}
        {activeTab === 'resources' && (
          <div className="mn-subj-tab-content" role="tabpanel" aria-label="Notes & Study Material">

            {/* Class Selection Chips */}
            <div className="mn-subj-class-section">
              <h3 className="mn-subj-section-label">Select a Class</h3>
              <div className="mn-subj-class-chips" role="radiogroup" aria-label="Select Class for Study Material">
                {CLASS_OPTIONS.map((cls) => (
                  <button
                    key={cls.id}
                    type="button"
                    role="radio"
                    aria-checked={selectedClass === cls.id}
                    className={`mn-subj-class-chip ${selectedClass === cls.id ? 'active' : ''}`}
                    onClick={() => setSelectedClass(cls.id)}
                  >
                    {cls.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ------------------------------------------------------------ */}
            {/* 6 Category Tiles (Matching Screen 3)                         */}
            {/* ------------------------------------------------------------ */}
            <h3 className="mn-subj-section-label" style={{ marginTop: 6 }}>
              Study Material for Class {selectedClass}
            </h3>

            <div className="mn-subj-materials-grid">
              {/* Tile 1: Chapter-wise Notes */}
              <div
                className="mn-subj-material-card"
                onClick={() => setSelectedResourceTypeFilter(selectedResourceTypeFilter === 'NOTES' ? 'ALL' : 'NOTES')}
                style={{ borderColor: selectedResourceTypeFilter === 'NOTES' ? '#2563EB' : '#E2E8F0' }}
              >
                <div className="mn-subj-mat-icon-box" style={{ background: '#EFF6FF', color: '#2563EB' }}>
                  <i className="fa-solid fa-file-lines"></i>
                </div>
                <div className="mn-subj-mat-info">
                  <h4 className="mn-subj-mat-title">
                    <span>Chapter-wise Notes</span>
                    <i className="fa-solid fa-chevron-right" style={{ fontSize: 10, color: '#94A3B8' }}></i>
                  </h4>
                  <p className="mn-subj-mat-desc">Handwritten notes, formulas &amp; key concepts</p>
                </div>
              </div>

              {/* Tile 2: Important Questions */}
              <div
                className="mn-subj-material-card"
                onClick={() => setSelectedResourceTypeFilter(selectedResourceTypeFilter === 'IMPORTANT_QUESTIONS_ANSWERS' ? 'ALL' : 'IMPORTANT_QUESTIONS_ANSWERS')}
                style={{ borderColor: selectedResourceTypeFilter === 'IMPORTANT_QUESTIONS_ANSWERS' ? '#2563EB' : '#E2E8F0' }}
              >
                <div className="mn-subj-mat-icon-box" style={{ background: '#FEF2F2', color: '#E11D48' }}>
                  <i className="fa-solid fa-circle-question"></i>
                </div>
                <div className="mn-subj-mat-info">
                  <h4 className="mn-subj-mat-title">
                    <span>Important Questions</span>
                    <i className="fa-solid fa-chevron-right" style={{ fontSize: 10, color: '#94A3B8' }}></i>
                  </h4>
                  <p className="mn-subj-mat-desc">Most expected questions with solutions</p>
                </div>
              </div>

              {/* Tile 3: Previous Year Papers */}
              <Link to="/courses" className="mn-subj-material-card" style={{ textDecoration: 'none' }}>
                <div className="mn-subj-mat-icon-box" style={{ background: '#F0FDF4', color: '#16A34A' }}>
                  <i className="fa-solid fa-clock-rotate-left"></i>
                </div>
                <div className="mn-subj-mat-info">
                  <h4 className="mn-subj-mat-title">
                    <span>Previous Year Papers</span>
                    <i className="fa-solid fa-chevron-right" style={{ fontSize: 10, color: '#94A3B8' }}></i>
                  </h4>
                  <p className="mn-subj-mat-desc">Past year questions with detailed solutions</p>
                </div>
              </Link>

              {/* Tile 4: NCERT Solutions */}
              <Link to="/books" className="mn-subj-material-card" style={{ textDecoration: 'none' }}>
                <div className="mn-subj-mat-icon-box" style={{ background: '#FAF5FF', color: '#9333EA' }}>
                  <i className="fa-solid fa-book"></i>
                </div>
                <div className="mn-subj-mat-info">
                  <h4 className="mn-subj-mat-title">
                    <span>NCERT Solutions</span>
                    <i className="fa-solid fa-chevron-right" style={{ fontSize: 10, color: '#94A3B8' }}></i>
                  </h4>
                  <p className="mn-subj-mat-desc">Step-by-step solutions for all exercises</p>
                </div>
              </Link>

              {/* Tile 5: Formula Sheet */}
              <div
                className="mn-subj-material-card"
                onClick={() => setSelectedResourceTypeFilter(selectedResourceTypeFilter === 'FORMULA_SHEET' ? 'ALL' : 'FORMULA_SHEET')}
                style={{ borderColor: selectedResourceTypeFilter === 'FORMULA_SHEET' ? '#2563EB' : '#E2E8F0' }}
              >
                <div className="mn-subj-mat-icon-box" style={{ background: '#EFF6FF', color: '#2563EB' }}>
                  <span style={{ fontWeight: 900 }}>π</span>
                </div>
                <div className="mn-subj-mat-info">
                  <h4 className="mn-subj-mat-title">
                    <span>Formula Sheet</span>
                    <i className="fa-solid fa-chevron-right" style={{ fontSize: 10, color: '#94A3B8' }}></i>
                  </h4>
                  <p className="mn-subj-mat-desc">All important formulas in one place</p>
                </div>
              </div>

              {/* Tile 6: Practice Questions */}
              <Link to="/study-resources" className="mn-subj-material-card" style={{ textDecoration: 'none' }}>
                <div className="mn-subj-mat-icon-box" style={{ background: '#FFF7ED', color: '#D97706' }}>
                  <i className="fa-solid fa-bullseye"></i>
                </div>
                <div className="mn-subj-mat-info">
                  <h4 className="mn-subj-mat-title">
                    <span>Practice Questions</span>
                    <i className="fa-solid fa-chevron-right" style={{ fontSize: 10, color: '#94A3B8' }}></i>
                  </h4>
                  <p className="mn-subj-mat-desc">Topic-wise practice for better preparation</p>
                </div>
              </Link>
            </div>

            {/* ------------------------------------------------------------ */}
            {/* SECTION 4, 5, 6, 7: FORMULA SHEET COMBO MASTER CARD          */}
            {/* ONE SINGLE CARD REPRESENTING ONE COMPLETE MASTER COMBO PDF   */}
            {/* ------------------------------------------------------------ */}
            {formulaBundle && (
              <section className="mn-subj-combo-section" aria-label="Complete Formula Sheet Combo">
                <div className="mn-subj-combo-master-card">
                  <div className="mn-subj-combo-card-top">
                    <div className="mn-subj-combo-icon-and-title">
                      <div className="mn-subj-combo-icon-circle">
                        <span>📐</span>
                      </div>
                      <div className="mn-subj-combo-headings">
                        <div className="mn-subj-combo-badge-row">
                          <span className="mn-subj-combo-pill">Formula Sheet Combo</span>
                          <span className="mn-subj-combo-free-pill">100% Free Access</span>
                        </div>
                        <h4 className="mn-subj-combo-main-title">
                          Class {selectedClass} {subjectConfig.name} Complete Formula Sheet
                        </h4>
                        <p className="mn-subj-combo-sub-desc">
                          All formulas, theorems, derivations &amp; diagrams from Chapter 1 to final chapter in ONE complete printable master PDF.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mn-subj-combo-btn-row">
                    <button
                      type="button"
                      className="mn-subj-combo-view-btn"
                      onClick={() => handleOpenMasterFormulaCombo(formulaBundle)}
                    >
                      <span>👁️</span>
                      <span>View Complete PDF (Free)</span>
                    </button>

                    <button
                      type="button"
                      className="mn-subj-combo-download-btn"
                      onClick={() => handleDownloadMasterCombo(formulaBundle)}
                      title="Download complete PDF offline"
                    >
                      <span>📥</span>
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* ------------------------------------------------------------ */}
            {/* POPULAR CHAPTERS LIST (Real Database Chapter Catalog)        */}
            {/* ------------------------------------------------------------ */}
            <section className="mn-subj-chapters-section">
              <div className="mn-subj-list-header">
                <h3 className="mn-subj-list-title">
                  Popular Chapters (Class {selectedClass})
                </h3>
                <Link
                  to={`/study-resources?class=${selectedClass}&subject=${encodeURIComponent(subjectConfig.name)}`}
                  style={{ fontSize: 12, fontWeight: 700, color: '#E11D48', textDecoration: 'none' }}
                >
                  View All
                </Link>
              </div>

              {loadingResources ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: '#64748B' }}>
                  <div className="spinner" style={{ margin: '0 auto 10px', width: 28, height: 28 }}></div>
                  <p style={{ fontSize: 12 }}>Loading chapters from curriculum database...</p>
                </div>
              ) : chapters.length > 0 ? (
                <div className="mn-subj-chapters-list">
                  {chapters.map((ch, idx) => {
                    const chNum = ch.chapterNumber || idx + 1;
                    const chTitle = ch.chapterTitle || `Chapter ${chNum}`;
                    const resList = ch.resources || [];
                    const formulaRes = resList.find((r) => r.resourceType === 'FORMULA_SHEET');
                    const notesRes = resList.find((r) => r.resourceType === 'IMPORTANT_QUESTIONS_ANSWERS' || r.resourceType === 'NOTES');

                    // Filter based on selected quick filter
                    if (selectedResourceTypeFilter === 'FORMULA_SHEET' && !formulaRes) return null;
                    if (selectedResourceTypeFilter === 'NOTES' && !notesRes) return null;
                    if (selectedResourceTypeFilter === 'IMPORTANT_QUESTIONS_ANSWERS' && !notesRes) return null;

                    const primaryResource = formulaRes || notesRes || resList[0];

                    return (
                      <div
                        key={chNum}
                        className="mn-subj-chapter-row"
                        onClick={() => {
                          if (primaryResource) handleOpenChapterResource(primaryResource);
                        }}
                      >
                        <div className="mn-subj-chapter-left">
                          <span className="mn-subj-chapter-num">{chNum}</span>
                          <div style={{ minWidth: 0 }}>
                            <div className="mn-subj-chapter-name">{chTitle}</div>
                            {ch.unit && (
                              <div style={{ fontSize: 10.5, color: '#64748B', marginTop: 1 }}>{ch.unit}</div>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="mn-subj-chapter-resources-preview">
                            {formulaRes && (
                              <span className="mn-subj-chapter-res-tag" title="Formula Sheet Available">
                                📘 Formulas
                              </span>
                            )}
                            {notesRes && (
                              <span
                                className="mn-subj-chapter-res-tag"
                                style={{ background: '#FEF2F2', color: '#E11D48' }}
                                title="Q&A Notes Available"
                              >
                                📝 Q&amp;A
                              </span>
                            )}
                          </div>
                          <span className="mn-subj-chapter-chevron">
                            <i className="fa-solid fa-chevron-right"></i>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mn-subj-empty-state">
                  <div className="mn-subj-empty-icon">📚</div>
                  <p className="mn-subj-empty-text">
                    Study resources for {subjectConfig.name} Class {selectedClass} are currently being updated.
                  </p>
                  <Link
                    to="/study-resources"
                    className="mn-subj-empty-btn"
                    style={{ textDecoration: 'none', display: 'inline-block' }}
                  >
                    Browse All Study Materials
                  </Link>
                </div>
              )}
            </section>

          </div>
        )}

      </div>

      {/* ------------------------------------------------------------ */}
      {/* DIRECT IN-APP STUDY RESOURCE / MASTER COMBO PDF VIEWER MODAL */}
      {/* ------------------------------------------------------------ */}
      {viewerModalState.isOpen && (
        <StudyResourceViewerModal
          isOpen={viewerModalState.isOpen}
          onClose={() => setViewerModalState({ isOpen: false, resourceId: null, resource: null, isCombo: false })}
          resourceId={viewerModalState.resourceId}
          resource={viewerModalState.resource}
          isCombo={viewerModalState.isCombo}
        />
      )}
    </div>
  );
};

export default SubjectPage;
