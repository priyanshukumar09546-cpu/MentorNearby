import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { searchTutors } from '../../api/search';
import UnlockContactModal from '../../components/payment/UnlockContactModal';
import './SearchPage.css';

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || searchParams.get('subject') || '');
  const [subject, setSubject] = useState(searchParams.get('subject') || '');
  const [classGrade, setClassGrade] = useState(searchParams.get('class') || searchParams.get('grade') || '');
  const [location, setLocation] = useState(searchParams.get('location') || searchParams.get('city') || '');
  const [teachingMode, setTeachingMode] = useState(searchParams.get('mode') || '');
  const [experience, setExperience] = useState(searchParams.get('experience') || '');
  const [priceRange, setPriceRange] = useState(searchParams.get('price') || '');
  const [rating, setRating] = useState(searchParams.get('rating') || '');

  const [verifiedOnly, setVerifiedOnly] = useState(searchParams.get('verified') === 'true' || false);
  const [onlineTutors, setOnlineTutors] = useState(searchParams.get('online') === 'true' || false);
  const [homeTuition, setHomeTuition] = useState(searchParams.get('home') === 'true' || false);

  const [sort, setSort] = useState(searchParams.get('sort') || 'relevance');
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page')) || 1);

  // Real Database State (NO FAKE / DEMO DATA)
  const [tutors, setTutors] = useState([]);
  const [topTutors, setTopTutors] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Contact Unlock Modal State
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [selectedTutorId, setSelectedTutorId] = useState(null);

  // Fetch Real Tutors from Database API
  const fetchTutorsFromApi = async () => {
    setLoading(true);
    setError(null);
    try {
      const cleanParams = {};
      if (searchQuery) cleanParams.subject = searchQuery;
      if (subject) cleanParams.subject = subject;
      if (classGrade) cleanParams.class = classGrade;
      if (location) cleanParams.location = location;
      if (teachingMode) cleanParams.teachingModes = teachingMode;
      if (experience) cleanParams.minExperience = experience;
      if (priceRange) cleanParams.maxFee = priceRange;
      if (verifiedOnly) cleanParams.verified = 'true';
      if (onlineTutors) cleanParams.teachingModes = 'ONLINE';
      if (homeTuition) cleanParams.teachingModes = 'OFFLINE';
      if (sort && sort !== 'relevance') cleanParams.sort = sort;
      cleanParams.page = currentPage;
      cleanParams.limit = 8; // 4 cards x 2 rows on desktop

      const res = await searchTutors(cleanParams);
      const list = res.data?.data?.tutors || res.data?.data || [];
      const total = res.data?.data?.total ?? list.length;
      const pages = res.data?.data?.pages || Math.ceil(total / 8) || 1;

      setTutors(list);
      setTotalCount(total);
      setTotalPages(pages);
    } catch (err) {
      console.error('Error fetching tutors:', err);
      setError(err.response?.data?.message || 'Unable to connect to tutor database. Please try again.');
      setTutors([]);
      setTotalCount(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Top Tutors for Right Sidebar dynamically from Real DB
  const fetchTopTutors = async () => {
    try {
      const res = await searchTutors({ sort: 'rating', limit: 5, verified: 'true' });
      const topList = res.data?.data?.tutors || res.data?.data || [];
      setTopTutors(topList);
    } catch (_) {
      setTopTutors([]);
    }
  };

  useEffect(() => {
    fetchTutorsFromApi();
  }, [currentPage, sort]);

  useEffect(() => {
    fetchTopTutors();
  }, []);

  const handleExecuteSearch = (e) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (subject) params.set('subject', subject);
    if (classGrade) params.set('class', classGrade);
    if (location) params.set('location', location);
    if (teachingMode) params.set('mode', teachingMode);
    if (experience) params.set('experience', experience);
    if (priceRange) params.set('price', priceRange);
    if (rating) params.set('rating', rating);
    if (verifiedOnly) params.set('verified', 'true');
    if (onlineTutors) params.set('online', 'true');
    if (homeTuition) params.set('home', 'true');
    if (sort !== 'relevance') params.set('sort', sort);
    params.set('page', '1');

    setSearchParams(params);
    setCurrentPage(1);
    fetchTutorsFromApi();
    setShowMobileFilters(false);
  };

  const handleClearAll = () => {
    setSearchQuery('');
    setSubject('');
    setClassGrade('');
    setLocation('');
    setTeachingMode('');
    setExperience('');
    setPriceRange('');
    setRating('');
    setVerifiedOnly(false);
    setOnlineTutors(false);
    setHomeTuition(false);
    setSort('relevance');
    setCurrentPage(1);
    setSearchParams(new URLSearchParams());
    fetchTutorsFromApi();
  };

  const handleSortChange = (newSort) => {
    setSort(newSort);
    const params = new URLSearchParams(searchParams);
    params.set('sort', newSort);
    setSearchParams(params);
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const handleUnlock = (tutorId) => {
    setSelectedTutorId(tutorId);
    setUnlockModalOpen(true);
  };

  return (
    <div className="mn-find-page-root">
      <div className="mn-find-container">
        
        {/* ============================================================ */}
        {/* 1. BREADCRUMB                                                */}
        {/* ============================================================ */}
        <nav className="mn-find-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span className="mn-find-breadcrumb-sep">›</span>
          <span className="mn-find-breadcrumb-active">Find Tutors</span>
        </nav>

        {/* ============================================================ */}
        {/* 2. PAGE HEADING & TOP 100% VERIFIED BADGE                   */}
        {/* ============================================================ */}
        <div className="mn-find-header-row">
          <div className="mn-find-title-col">
            <h1 className="mn-find-main-heading">
              Find the <span className="mn-gold-text">Right Tutor</span> for You
            </h1>
            <p className="mn-find-sub-text">
              Discover verified tutors, compare their expertise and connect with the right mentor for your learning goals.
            </p>
          </div>

          {/* 100% Verified Tutors Trust Card */}
          <div className="mn-find-top-trust-card">
            <div className="mn-top-trust-shield">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                <path d="m9 12 2 2 4-4"></path>
              </svg>
            </div>
            <div>
              <div className="mn-top-trust-title">100% Verified Tutors</div>
              <div className="mn-top-trust-sub">Background verified for your safety</div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 3. SEARCH BAR + FILTERS BUTTON + SORT CONTROL                */}
        {/* ============================================================ */}
        <div className="mn-find-search-bar-row">
          <div className="mn-find-search-input-wrap">
            <span className="mn-search-icon">🔍</span>
            <input
              type="text"
              className="mn-find-search-input"
              placeholder="Search by name, subject, class, skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleExecuteSearch(e)}
            />
          </div>

          <button
            type="button"
            className="mn-find-filters-toggle-btn"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            aria-label="Toggle Filter Options"
          >
            <span className="mn-filter-icon">⚙️</span>
            <span>Filters</span>
          </button>

          <div className="mn-find-sort-wrap">
            <span className="mn-sort-label">Sort by:</span>
            <select
              className="mn-find-sort-select bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
              value={sort}
              onChange={(e) => handleSortChange(e.target.value)}
            >
              <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white" value="relevance">Recommended</option>
              <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white" value="rating">Highest Rated</option>
              <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white" value="fees_asc">Lowest Fee</option>
              <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white" value="fees_desc">Highest Fee</option>
              <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white" value="experience">Most Experienced</option>
            </select>
            <span className="mn-sort-chevron">▾</span>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 4. MAIN 3-COLUMN LAYOUT (SIDEBAR - GRID - TOP TUTORS)        */}
        {/* ============================================================ */}
        <div className="mn-find-main-grid">
          
          {/* ------------------------------------------------------------ */}
          {/* COLUMN 1: LEFT FILTER SIDEBAR                                */}
          {/* ------------------------------------------------------------ */}
          <aside className={`mn-find-filter-sidebar ${showMobileFilters ? 'mobile-open' : ''}`}>
            <div className="mn-filter-header">
              <h2 className="mn-filter-heading">Filters</h2>
              <button
                type="button"
                className="mn-filter-clear-btn"
                onClick={handleClearAll}
              >
                Clear All
              </button>
            </div>

            <form onSubmit={handleExecuteSearch} className="mn-filter-form">
              {/* Subject */}
              <div className="mn-filter-field">
                <label className="mn-filter-lbl">Subject</label>
                <div className="mn-select-box-wrap">
                  <select
                    className="mn-filter-select bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  >
                    <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white" value="">All Subjects</option>
                    <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white" value="Mathematics">Mathematics</option>
                    <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white" value="Physics">Physics</option>
                    <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white" value="Chemistry">Chemistry</option>
                    <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white" value="Biology">Biology</option>
                    <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white" value="English">English</option>
                    <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white" value="Computer Science">Computer Science</option>
                    <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white" value="Accountancy">Accountancy</option>
                    <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white" value="Economics">Economics</option>
                    <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white" value="Hindi">Hindi</option>
                    <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white" value="Social Science">Social Science</option>
                  </select>
                  <span className="mn-select-chevron">▾</span>
                </div>
              </div>

              {/* Class / Grade */}
              <div className="mn-filter-field">
                <label className="mn-filter-lbl">Class / Grade</label>
                <div className="mn-select-box-wrap">
                  <select
                    className="mn-filter-select bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                    value={classGrade}
                    onChange={(e) => setClassGrade(e.target.value)}
                  >
                    <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white" value="">All Classes</option>
                    <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white" value="Class 1">Class 1 - 5</option>
                    <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white" value="Class 6">Class 6 - 8</option>
                    <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white" value="Class 9">Class 9 - 10</option>
                    <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white" value="Class 11">Class 11 - 12</option>
                    <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white" value="College">College / Degree</option>
                    <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white" value="Competitive">Competitive Exams</option>
                  </select>
                  <span className="mn-select-chevron">▾</span>
                </div>
              </div>

              {/* Location */}
              <div className="mn-filter-field">
                <label className="mn-filter-lbl">Location</label>
                <div className="mn-select-box-wrap">
                  <select
                    className="mn-filter-select bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  >
                    <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white" value="">All Locations</option>
                    <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white" value="Delhi">Delhi NCR</option>
                    <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white" value="Ghaziabad">Ghaziabad</option>
                    <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white" value="Noida">Noida</option>
                    <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white" value="Lucknow">Lucknow</option>
                    <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white" value="Kanpur">Kanpur</option>
                    <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white" value="Bhopal">Bhopal</option>
                    <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white" value="Jaipur">Jaipur</option>
                    <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white" value="Hyderabad">Hyderabad</option>
                  </select>
                  <span className="mn-select-chevron">▾</span>
                </div>
              </div>

              {/* Teaching Mode */}
              <div className="mn-filter-field">
                <label className="mn-filter-lbl">Teaching Mode</label>
                <div className="mn-select-box-wrap">
                  <select
                    className="mn-filter-select bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                    value={teachingMode}
                    onChange={(e) => setTeachingMode(e.target.value)}
                  >
                    <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white" value="">All Modes</option>
                    <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white" value="ONLINE">Online</option>
                    <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white" value="OFFLINE">Offline / Home</option>
                    <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white" value="HYBRID">Online &amp; Offline</option>
                  </select>
                  <span className="mn-select-chevron">▾</span>
                </div>
              </div>

              {/* Experience */}
              <div className="mn-filter-field">
                <label className="mn-filter-lbl">Experience</label>
                <div className="mn-select-box-wrap">
                  <select
                    className="mn-filter-select bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                  >
                    <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white" value="">All Experience</option>
                    <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white" value="1">1+ Years</option>
                    <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white" value="3">3+ Years</option>
                    <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white" value="5">5+ Years</option>
                    <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white" value="8">8+ Years</option>
                  </select>
                  <span className="mn-select-chevron">▾</span>
                </div>
              </div>

              {/* Price Range */}
              <div className="mn-filter-field">
                <label className="mn-filter-lbl">Price Range</label>
                <div className="mn-select-box-wrap">
                  <select
                    className="mn-filter-select bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                    value={priceRange}
                    onChange={(e) => setPriceRange(e.target.value)}
                  >
                    <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white" value="">All Budgets</option>
                    <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white" value="2000">Under ₹2,000 / month</option>
                    <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white" value="5000">Under ₹5,000 / month</option>
                    <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white" value="10000">Under ₹10,000 / month</option>
                  </select>
                  <span className="mn-select-chevron">▾</span>
                </div>
              </div>

              {/* Checkboxes */}
              <div className="mn-filter-checkboxes-group">
                <label className="mn-filter-check-lbl">
                  <input
                    type="checkbox"
                    className="mn-filter-checkbox"
                    checked={verifiedOnly}
                    onChange={(e) => setVerifiedOnly(e.target.checked)}
                  />
                  <span>Verified Tutors Only</span>
                </label>

                <label className="mn-filter-check-lbl">
                  <input
                    type="checkbox"
                    className="mn-filter-checkbox"
                    checked={onlineTutors}
                    onChange={(e) => setOnlineTutors(e.target.checked)}
                  />
                  <span>Online Tutors</span>
                </label>

                <label className="mn-filter-check-lbl">
                  <input
                    type="checkbox"
                    className="mn-filter-checkbox"
                    checked={homeTuition}
                    onChange={(e) => setHomeTuition(e.target.checked)}
                  />
                  <span>Available for Home Tuition</span>
                </label>
              </div>

              {/* Apply Filters Button */}
              <button type="submit" className="mn-filter-apply-btn">
                Apply Filters
              </button>
            </form>
          </aside>

          {/* ------------------------------------------------------------ */}
          {/* COLUMN 2: CENTER TUTOR GRID (REAL DATABASE DATA ONLY)        */}
          {/* ------------------------------------------------------------ */}
          <main className="mn-find-center-col">
            
            {/* Tutors Count Header & Grid Toggle */}
            <div className="mn-center-top-bar">
              <div className="mn-count-text">
                <span className="mn-gold-count">{totalCount.toLocaleString()}</span> {totalCount === 1 ? 'Tutor' : 'Tutors'} Found
              </div>

              <div className="mn-view-mode-buttons">
                <button
                  type="button"
                  className={`mn-view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid View"
                >
                  ⊞
                </button>
                <button
                  type="button"
                  className={`mn-view-mode-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                  aria-label="List View"
                >
                  ☰
                </button>
              </div>
            </div>

            {/* LOADING STATE */}
            {loading && (
              <div className="mn-find-loading-box">
                <div className="mn-find-spinner"></div>
                <p className="mn-find-loading-text">Searching verified tutors from database...</p>
              </div>
            )}

            {/* ERROR STATE */}
            {!loading && error && (
              <div className="mn-find-error-card">
                <span className="mn-find-error-icon">⚠️</span>
                <h3 className="mn-find-error-title">Unable to Load Tutors</h3>
                <p className="mn-find-error-sub">{error}</p>
                <button
                  type="button"
                  className="mn-filter-apply-btn"
                  style={{ maxWidth: '160px', margin: '0 auto' }}
                  onClick={fetchTutorsFromApi}
                >
                  Try Again
                </button>
              </div>
            )}

            {/* EMPTY STATE — NO REAL TUTORS FOUND */}
            {!loading && !error && tutors.length === 0 && (
              <div className="mn-find-empty-box">
                <div className="mn-find-empty-icon">🔍</div>
                <h3 className="mn-find-empty-title">No Tutors Found</h3>
                <p className="mn-find-empty-sub">
                  We couldn't find any tutors matching your exact search criteria. Try adjusting your subject, location, or clearing applied filters.
                </p>
                <div className="mn-find-empty-actions">
                  <button
                    type="button"
                    className="mn-find-clear-action-btn"
                    onClick={handleClearAll}
                  >
                    Clear Filters
                  </button>
                  <Link
                    to="/become-tutor"
                    className="mn-find-become-action-btn"
                  >
                    Become a Tutor
                  </Link>
                </div>
              </div>
            )}

            {/* 4x2 Grid of Real Database Tutor Cards */}
            {!loading && !error && tutors.length > 0 && (
              <>
                <div className={`mn-find-tutor-cards-grid ${viewMode === 'list' ? 'list-view' : ''}`}>
                  {tutors.map((tutor) => {
                    const id = tutor._id || tutor.id;
                    const name = tutor.user?.name || tutor.name || 'Tutor';
                    const photo = tutor.profilePhoto?.url || tutor.profilePhoto || tutor.user?.avatar || '';
                    const subjectName = tutor.subjects?.[0] || 'General';
                    const classes = tutor.grades?.[0] ? `Class ${tutor.grades.join(', ')}` : (tutor.classes?.[0] ? `Class ${tutor.classes.join(', ')}` : 'All Classes');
                    const expYears = tutor.experience?.years ?? 1;
                    const exp = `${expYears}+ Years Exp.`;
                    const qual = tutor.education?.[0]?.degree || tutor.qualifications?.[0]?.degree || 'Graduate';
                    const loc = tutor.location?.city || tutor.location?.area || 'Local Area';
                    const modeStr = Array.isArray(tutor.teachingModes) ? tutor.teachingModes.join(' & ') : (tutor.teachingModes || 'Online & Offline');
                    const ratingVal = tutor.averageRating && tutor.averageRating > 0 ? Number(tutor.averageRating).toFixed(1) : (tutor.totalReviews > 0 ? '5.0' : 'New');
                    const reviewsVal = tutor.totalReviews || 0;
                    const feeAmount = tutor.fees?.amount || tutor.monthlyFees || tutor.monthly_fees || tutor.fees || tutor.hourlyRate || tutor.price || 0;
                    const priceVal = feeAmount > 0 ? `₹${Number(feeAmount).toLocaleString('en-IN')} / month` : 'Fee on request';
                    const isVerified = tutor.kycStatus === 'VERIFIED' || tutor.verificationStatus?.identity;
                    const isOnline = Array.isArray(tutor.teachingModes)
                      ? tutor.teachingModes.some(m => typeof m === 'string' && m.toUpperCase().includes('ONLINE'))
                      : true;

                    return (
                      <div key={id} className="mn-grid-tutor-card">
                        {/* Top Tag Row */}
                        <div className="mn-card-tags-row">
                          {isVerified ? (
                            <span className="mn-card-verified-tag">VERIFIED</span>
                          ) : (
                            <span className="mn-card-verified-tag" style={{ background: '#64748B' }}>TUTOR</span>
                          )}
                          <span className="mn-card-status-dot-wrap">
                            <span className={`mn-card-status-dot ${isOnline ? 'online' : 'offline'}`}></span>
                            <span>{isOnline ? 'Online' : 'Offline'}</span>
                          </span>
                        </div>

                        {/* Tutor Portrait Photo */}
                        <div className="mn-card-photo-wrap">
                          {photo ? (
                            <img src={photo} alt={name} className="mn-card-photo-img" />
                          ) : (
                            <div className="mn-card-photo-placeholder">
                              {name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>

                        {/* Tutor Info */}
                        <div className="mn-card-info-wrap">
                          <h3 className="mn-card-tutor-name">
                            <Link to={`/tutor/${id}`}>{name}</Link>
                            {isVerified && <span className="mn-card-check-icon">✓</span>}
                          </h3>

                          <div className="mn-card-subject-classes" title={`${subjectName} • ${classes}`}>
                            {subjectName} • {classes}
                          </div>

                          <div className="mn-card-exp-qual" title={`${exp} • ${qual}`}>
                            {exp} • {qual}
                          </div>

                          <div className="mn-card-loc-mode" title={`${loc} • ${modeStr}`}>
                            {loc} • {modeStr}
                          </div>

                          <div className="mn-card-rating-price-row">
                            <div className="mn-card-rating-val">
                              <span className="mn-card-star">★</span> {ratingVal} <span className="mn-card-reviews-count">({reviewsVal})</span>
                            </div>
                            <div className="mn-card-price-val">
                              {priceVal}
                            </div>
                          </div>

                          {/* Unlock Contact CTA */}
                          <button
                            type="button"
                            className="mn-card-unlock-btn"
                            onClick={() => handleUnlock(id)}
                          >
                            <span className="mn-lock-icon">🔒</span>
                            <span>Unlock Now</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="mn-find-pagination">
                    <button
                      type="button"
                      className="mn-page-btn mn-page-arrow"
                      disabled={currentPage === 1}
                      onClick={() => handlePageChange(currentPage - 1)}
                      aria-label="Previous Page"
                    >
                      ‹
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 7).map((p) => (
                      <button
                        key={p}
                        type="button"
                        className={`mn-page-btn ${currentPage === p ? 'active' : ''}`}
                        onClick={() => handlePageChange(p)}
                      >
                        {p}
                      </button>
                    ))}

                    {totalPages > 7 && (
                      <>
                        <span className="mn-page-dots">...</span>
                        <button
                          type="button"
                          className={`mn-page-btn ${currentPage === totalPages ? 'active' : ''}`}
                          onClick={() => handlePageChange(totalPages)}
                        >
                          {totalPages}
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      className="mn-page-btn mn-page-arrow"
                      disabled={currentPage === totalPages}
                      onClick={() => handlePageChange(currentPage + 1)}
                      aria-label="Next Page"
                    >
                      ›
                    </button>
                  </div>
                )}
              </>
            )}

          </main>

          {/* ------------------------------------------------------------ */}
          {/* COLUMN 3: RIGHT SIDEBAR (TOP REAL TUTORS + TRUST CARD)       */}
          {/* ------------------------------------------------------------ */}
          <aside className="mn-find-right-sidebar">
            
            {/* Top Tutors This Week Card (Real Database Data) */}
            <div className="mn-top-tutors-card">
              <div className="mn-top-tutors-header">
                <h3 className="mn-top-tutors-title">Top Tutors This Week</h3>
                <Link to="/search?sort=rating" className="mn-top-tutors-view-all">View All</Link>
              </div>

              <div className="mn-top-tutors-list">
                {topTutors.length > 0 ? (
                  topTutors.map((tutor) => {
                    const id = tutor._id || tutor.id;
                    const name = tutor.user?.name || tutor.name || 'Tutor';
                    const photo = tutor.profilePhoto?.url || tutor.profilePhoto || tutor.user?.avatar || '';
                    const subjectName = tutor.subjects?.[0] || 'All Subjects';
                    const expYears = tutor.experience?.years ?? 2;
                    const ratingVal = tutor.averageRating && tutor.averageRating > 0 ? Number(tutor.averageRating).toFixed(1) : '5.0';
                    const reviewsVal = tutor.totalReviews || 0;
                    const feeAmount = tutor.fees?.amount || tutor.monthlyFees || tutor.monthly_fees || tutor.fees || tutor.hourlyRate || tutor.price || 0;
                    const feeDisplay = feeAmount > 0 ? `₹${Number(feeAmount).toLocaleString('en-IN')} / month` : 'Fee on request';
                    const isVerified = tutor.kycStatus === 'VERIFIED' || tutor.verificationStatus?.identity;

                    return (
                      <div key={id} className="mn-top-tutor-row">
                        {photo ? (
                          <img src={photo} alt={name} className="mn-top-tutor-photo" />
                        ) : (
                          <div className="mn-top-tutor-photo mn-top-tutor-photo-fallback">
                            {name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        
                        <div className="mn-top-tutor-info">
                          <div className="mn-top-tutor-name-row">
                            <span className="mn-top-tutor-name">{name}</span>
                            {isVerified && <span className="mn-top-tutor-check">✓</span>}
                          </div>
                          
                          <div className="mn-top-tutor-subj-exp">
                            {subjectName} • {expYears}+ Yrs
                          </div>

                          <div className="mn-top-tutor-rating-fee-row">
                            <div className="mn-top-tutor-rating">
                              <span className="mn-card-star">★</span> {ratingVal} ({reviewsVal})
                            </div>
                            <div className="mn-top-tutor-fee">{feeDisplay}</div>
                          </div>

                          <button
                            type="button"
                            className="mn-top-tutor-unlock-btn"
                            onClick={() => handleUnlock(id)}
                          >
                            <span className="mn-lock-icon">🔒</span>
                            <span>Unlock Now</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', margin: '8px 0' }}>
                    Real verified tutors will appear here as they register and get verified.
                  </p>
                )}
              </div>
            </div>

            {/* Safe & Trusted Learning Card */}
            <div className="mn-find-trust-box">
              <div className="mn-trust-box-icon">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  <path d="m9 12 2 2 4-4"></path>
                </svg>
              </div>
              <div>
                <h4 className="mn-trust-box-title">Safe &amp; Trusted Learning</h4>
                <p className="mn-trust-box-desc">
                  All tutors are KYC verified and background checked for your safety and peace of mind.
                </p>
              </div>
            </div>

          </aside>

        </div>

        {/* ============================================================ */}
        {/* 5. BOTTOM "REQUEST A TUTOR" BANNER                           */}
        {/* ============================================================ */}
        <div className="mn-find-bottom-cta-banner">
          <div className="mn-bottom-cta-left">
            <div className="mn-bottom-cta-icon-box">
              <span className="mn-bottom-user-icon">👤</span>
            </div>
            <div>
              <h4 className="mn-bottom-cta-heading">Still can't find the right tutor?</h4>
              <p className="mn-bottom-cta-sub">Let us help you match with the perfect tutor for your needs.</p>
            </div>
          </div>

          <Link to="/post-requirement" className="mn-bottom-cta-btn">
            <span>Request a Tutor</span>
            <span className="mn-cta-arrow">→</span>
          </Link>
        </div>

      </div>

      {/* Unlock Contact Modal */}
      {unlockModalOpen && (
        <UnlockContactModal
          isOpen={unlockModalOpen}
          onClose={() => setUnlockModalOpen(false)}
          tutorId={selectedTutorId}
        />
      )}
    </div>
  );
};

export default SearchPage;
