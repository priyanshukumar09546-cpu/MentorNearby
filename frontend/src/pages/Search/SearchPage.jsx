// ============================================================
// pages/Search/SearchPage.jsx
// MentorNearby "All Tutors" Marketplace Page
// Inspired by Reference Design (media_1789232106161.png)
// STRICTLY REAL DATABASE DATA • ZERO FAKE / MOCK TUTORS
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { searchTutors } from '../../api/search';
import { saveTutor, removeSavedTutor, getMySavedTutors } from '../../api/savedTutors';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import './SearchPage.css';

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { isDark, darkMode } = useTheme();
  const isDarkMode = isDark ?? darkMode ?? false;

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get('q') || searchParams.get('search') || searchParams.get('subject') || ''
  );
  const [selectedSubject, setSelectedSubject] = useState(searchParams.get('subject') || '');
  const [selectedClass, setSelectedClass] = useState(searchParams.get('class') || searchParams.get('grade') || '');
  const [selectedLocation, setSelectedLocation] = useState(searchParams.get('location') || searchParams.get('city') || '');
  const [selectedMode, setSelectedMode] = useState(searchParams.get('mode') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'relevance');
  const [viewMode, setViewMode] = useState('list'); // 'list' matches the reference screenshot
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page')) || 1);

  // Active Dropdown Pill State
  const [openDropdown, setOpenDropdown] = useState(null); // 'subject' | 'class' | 'location' | 'mode' | 'filters' | null
  const dropdownRef = useRef(null);

  // Real Database State
  const [tutors, setTutors] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Saved / Bookmark State
  const [savedTutorIds, setSavedTutorIds] = useState(new Set());

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load User Saved Tutors if authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    getMySavedTutors()
      .then((res) => {
        const list = res.data?.data || res.data || [];
        const ids = new Set(list.map((item) => item.tutor?._id || item.tutor || item._id));
        setSavedTutorIds(ids);
      })
      .catch(() => {});
  }, [isAuthenticated]);

  // Handle Save / Bookmark Tutor Toggle
  const handleToggleSave = async (e, tutorId) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const isAlreadySaved = savedTutorIds.has(tutorId);
    const nextSaved = new Set(savedTutorIds);

    if (isAlreadySaved) {
      nextSaved.delete(tutorId);
      setSavedTutorIds(nextSaved);
      try {
        await removeSavedTutor(tutorId);
      } catch (_) {
        nextSaved.add(tutorId);
        setSavedTutorIds(new Set(nextSaved));
      }
    } else {
      nextSaved.add(tutorId);
      setSavedTutorIds(nextSaved);
      try {
        await saveTutor(tutorId);
      } catch (_) {
        nextSaved.delete(tutorId);
        setSavedTutorIds(new Set(nextSaved));
      }
    }
  };

  // Fetch Real Tutors from Database API
  const fetchTutorsFromApi = async () => {
    setLoading(true);
    setError(null);
    try {
      const cleanParams = {};
      if (searchQuery.trim()) cleanParams.q = searchQuery.trim();
      if (selectedSubject) cleanParams.subject = selectedSubject;
      if (selectedClass) cleanParams.class = selectedClass;
      if (selectedLocation) cleanParams.location = selectedLocation;
      if (selectedMode) cleanParams.teachingModes = selectedMode;
      if (sort && sort !== 'relevance') cleanParams.sort = sort;
      cleanParams.page = currentPage;
      cleanParams.limit = 12;

      const res = await searchTutors(cleanParams);
      const list =
        res.data?.data?.tutors ||
        res.data?.tutors ||
        res.data?.data ||
        (Array.isArray(res.data) ? res.data : []);
      const total =
        res.data?.data?.total ?? res.data?.total ?? (Array.isArray(list) ? list.length : 0);
      const pages = res.data?.data?.pages || res.data?.pages || Math.ceil(total / 12) || 1;

      setTutors(Array.isArray(list) ? list : []);
      setTotalCount(total);
      setTotalPages(pages);
    } catch (err) {
      console.error('Error fetching tutors from API:', err);
      setError(err.response?.data?.message || 'Unable to connect to tutor database. Please try again.');
      setTutors([]);
      setTotalCount(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  // Sync state on page/sort change or when searchParams change
  useEffect(() => {
    fetchTutorsFromApi();
  }, [currentPage, sort, selectedSubject, selectedClass, selectedLocation, selectedMode]);

  // Trigger search execution
  const handleExecuteSearch = (e) => {
    if (e) e.preventDefault();
    setOpenDropdown(null);
    setCurrentPage(1);

    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (selectedSubject) params.set('subject', selectedSubject);
    if (selectedClass) params.set('class', selectedClass);
    if (selectedLocation) params.set('location', selectedLocation);
    if (selectedMode) params.set('mode', selectedMode);
    if (sort !== 'relevance') params.set('sort', sort);
    params.set('page', '1');

    setSearchParams(params);
    fetchTutorsFromApi();
  };

  const handleClearAll = () => {
    setSearchQuery('');
    setSelectedSubject('');
    setSelectedClass('');
    setSelectedLocation('');
    setSelectedMode('');
    setSort('relevance');
    setCurrentPage(1);
    setOpenDropdown(null);
    setSearchParams(new URLSearchParams());
    setTimeout(() => {
      fetchTutorsFromApi();
    }, 0);
  };

  // Extract dynamic filter options from loaded tutors
  const availableSubjects = Array.from(
    new Set(
      tutors
        .flatMap((t) => t.subjects || [t.subject])
        .filter(Boolean)
        .map((s) => s.trim())
    )
  );

  const availableClasses = Array.from(
    new Set(
      tutors
        .flatMap((t) => t.grades || t.classes || [])
        .filter(Boolean)
        .map((c) => c.toString().trim())
    )
  );

  const availableLocations = Array.from(
    new Set(
      tutors
        .map((t) => (t.location?.city || t.location?.area || '').trim())
        .filter(Boolean)
    )
  );

  return (
    <div className={`mn-all-tutors-root ${isDarkMode ? 'dark' : 'light'}`}>
      <div className="mn-all-tutors-container" ref={dropdownRef}>
        
        {/* ============================================================ */}
        {/* 1. TITLE & REAL TUTOR COUNT                                  */}
        {/* ============================================================ */}
        <div className="mn-all-tutors-title-row">
          <div className="mn-all-tutors-title-wrap">
            <h1 className="mn-all-tutors-heading">All Tutors</h1>
            <p className="mn-all-tutors-sub">
              Discover verified tutors and find the perfect match for your learning goals.
            </p>
          </div>
          <div className="mn-all-tutors-count-badge">
            {!loading && (
              <span>
                {totalCount} {totalCount === 1 ? 'Tutor' : 'Tutors'}
              </span>
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* 2. SEARCH BAR                                                */}
        {/* ============================================================ */}
        <form className="mn-all-tutors-search-form" onSubmit={handleExecuteSearch} role="search">
          <i className="fa-solid fa-magnifying-glass mn-all-tutors-search-icon" aria-hidden="true"></i>
          <input
            type="text"
            className="mn-all-tutors-search-input"
            placeholder="Search by name, subject, class, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search by name, subject, class, or location"
          />
          {searchQuery && (
            <button
              type="button"
              className="mn-all-tutors-search-clear"
              onClick={() => {
                setSearchQuery('');
                setCurrentPage(1);
                const params = new URLSearchParams(searchParams);
                params.delete('q');
                params.delete('search');
                setSearchParams(params);
                setTimeout(() => fetchTutorsFromApi(), 0);
              }}
              aria-label="Clear search"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          )}
        </form>

        {/* ============================================================ */}
        {/* 3. HORIZONTAL FILTER PILLS ROW (Matching Reference Design)   */}
        {/* ============================================================ */}
        <div className="mn-all-tutors-filter-pills-row">
          
          {/* A. Filters Button */}
          <button
            type="button"
            className={`mn-filter-pill-btn mn-filter-pill-main ${
              selectedSubject || selectedClass || selectedLocation || selectedMode ? 'has-active-filters' : ''
            }`}
            onClick={() => setOpenDropdown(openDropdown === 'filters' ? null : 'filters')}
            aria-label="Toggle Filters Sheet"
          >
            <i className="fa-solid fa-sliders"></i>
            <span>Filters</span>
            {(selectedSubject || selectedClass || selectedLocation || selectedMode) && (
              <span className="mn-filter-active-dot"></span>
            )}
          </button>

          {/* B. Subject Dropdown Pill */}
          <div className="mn-filter-pill-wrapper">
            <button
              type="button"
              className={`mn-filter-pill-btn ${selectedSubject ? 'active' : ''}`}
              onClick={() => setOpenDropdown(openDropdown === 'subject' ? null : 'subject')}
              aria-expanded={openDropdown === 'subject'}
            >
              <span>{selectedSubject || 'Subject'}</span>
              <i className="fa-solid fa-chevron-down mn-pill-chevron"></i>
            </button>

            {openDropdown === 'subject' && (
              <div className="mn-filter-dropdown-menu">
                <button
                  type="button"
                  className={`mn-filter-dropdown-item ${!selectedSubject ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedSubject('');
                    setOpenDropdown(null);
                    setCurrentPage(1);
                  }}
                >
                  All Subjects
                </button>
                {availableSubjects.map((subj) => (
                  <button
                    key={subj}
                    type="button"
                    className={`mn-filter-dropdown-item ${selectedSubject === subj ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedSubject(subj);
                      setOpenDropdown(null);
                      setCurrentPage(1);
                    }}
                  >
                    {subj}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* C. Class Dropdown Pill */}
          <div className="mn-filter-pill-wrapper">
            <button
              type="button"
              className={`mn-filter-pill-btn ${selectedClass ? 'active' : ''}`}
              onClick={() => setOpenDropdown(openDropdown === 'class' ? null : 'class')}
              aria-expanded={openDropdown === 'class'}
            >
              <span>{selectedClass || 'Class'}</span>
              <i className="fa-solid fa-chevron-down mn-pill-chevron"></i>
            </button>

            {openDropdown === 'class' && (
              <div className="mn-filter-dropdown-menu">
                <button
                  type="button"
                  className={`mn-filter-dropdown-item ${!selectedClass ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedClass('');
                    setOpenDropdown(null);
                    setCurrentPage(1);
                  }}
                >
                  All Classes
                </button>
                {availableClasses.map((cls) => (
                  <button
                    key={cls}
                    type="button"
                    className={`mn-filter-dropdown-item ${selectedClass === cls ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedClass(cls);
                      setOpenDropdown(null);
                      setCurrentPage(1);
                    }}
                  >
                    {cls}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* D. Location Dropdown Pill */}
          <div className="mn-filter-pill-wrapper">
            <button
              type="button"
              className={`mn-filter-pill-btn ${selectedLocation ? 'active' : ''}`}
              onClick={() => setOpenDropdown(openDropdown === 'location' ? null : 'location')}
              aria-expanded={openDropdown === 'location'}
            >
              <span>{selectedLocation || 'Location'}</span>
              <i className="fa-solid fa-chevron-down mn-pill-chevron"></i>
            </button>

            {openDropdown === 'location' && (
              <div className="mn-filter-dropdown-menu">
                <button
                  type="button"
                  className={`mn-filter-dropdown-item ${!selectedLocation ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedLocation('');
                    setOpenDropdown(null);
                    setCurrentPage(1);
                  }}
                >
                  All Locations
                </button>
                {availableLocations.map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    className={`mn-filter-dropdown-item ${selectedLocation === loc ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedLocation(loc);
                      setOpenDropdown(null);
                      setCurrentPage(1);
                    }}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* E. Availability Dropdown Pill */}
          <div className="mn-filter-pill-wrapper">
            <button
              type="button"
              className={`mn-filter-pill-btn ${selectedMode ? 'active' : ''}`}
              onClick={() => setOpenDropdown(openDropdown === 'mode' ? null : 'mode')}
              aria-expanded={openDropdown === 'mode'}
            >
              <span>{selectedMode || 'Availability'}</span>
              <i className="fa-solid fa-chevron-down mn-pill-chevron"></i>
            </button>

            {openDropdown === 'mode' && (
              <div className="mn-filter-dropdown-menu">
                <button
                  type="button"
                  className={`mn-filter-dropdown-item ${!selectedMode ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedMode('');
                    setOpenDropdown(null);
                    setCurrentPage(1);
                  }}
                >
                  All Modes
                </button>
                <button
                  type="button"
                  className={`mn-filter-dropdown-item ${selectedMode === 'Online' ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedMode('Online');
                    setOpenDropdown(null);
                    setCurrentPage(1);
                  }}
                >
                  Online
                </button>
                <button
                  type="button"
                  className={`mn-filter-dropdown-item ${selectedMode === 'Offline' ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedMode('Offline');
                    setOpenDropdown(null);
                    setCurrentPage(1);
                  }}
                >
                  Offline / Home
                </button>
                <button
                  type="button"
                  className={`mn-filter-dropdown-item ${selectedMode === 'Hybrid' ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedMode('Hybrid');
                    setOpenDropdown(null);
                    setCurrentPage(1);
                  }}
                >
                  Online &amp; Offline
                </button>
              </div>
            )}
          </div>

        </div>

        {/* ============================================================ */}
        {/* 4. SORT BY & VIEW TOGGLE (GRID / LIST)                       */}
        {/* ============================================================ */}
        <div className="mn-all-tutors-sort-bar">
          <div className="mn-all-tutors-sort-left">
            <span className="mn-all-tutors-sort-label">Sort by:</span>
            <div className="mn-all-tutors-sort-select-wrap">
              <select
                className="mn-all-tutors-sort-select"
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                  setCurrentPage(1);
                }}
                aria-label="Sort tutors by"
              >
                <option value="relevance">Recommended</option>
                <option value="rating">Rating</option>
                <option value="fees_asc">Price: Low to High</option>
                <option value="fees_desc">Price: High to Low</option>
                <option value="experience">Experience</option>
              </select>
              <i className="fa-solid fa-chevron-down mn-sort-arrow-icon"></i>
            </div>
          </div>

          {/* Grid / List Mode Toggle Buttons */}
          <div className="mn-all-tutors-view-toggle">
            <button
              type="button"
              className={`mn-view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
              title="Grid View"
            >
              <i className="fa-solid fa-table-cells-large"></i>
            </button>
            <button
              type="button"
              className={`mn-view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              aria-label="List view"
              title="List View"
            >
              <i className="fa-solid fa-bars"></i>
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 5. TUTORS LIST / GRID (STRICTLY REAL DATABASE DATA)          */}
        {/* ============================================================ */}
        {loading ? (
          /* SKELETON LOADING STATE */
          <div className={`mn-all-tutors-list-container ${viewMode === 'grid' ? 'grid-view' : 'list-view'}`}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="mn-tutor-real-card skeleton-card">
                <div className="mn-tutor-skeleton-photo"></div>
                <div className="mn-tutor-skeleton-info">
                  <div className="mn-tutor-skeleton-line title"></div>
                  <div className="mn-tutor-skeleton-line sub"></div>
                  <div className="mn-tutor-skeleton-line loc"></div>
                  <div className="mn-tutor-skeleton-chips">
                    <div className="mn-tutor-skeleton-chip"></div>
                    <div className="mn-tutor-skeleton-chip"></div>
                  </div>
                </div>
                <div className="mn-tutor-skeleton-action">
                  <div className="mn-tutor-skeleton-line price"></div>
                  <div className="mn-tutor-skeleton-btn"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          /* ERROR STATE */
          <div className="mn-all-tutors-error-box">
            <div className="mn-all-tutors-error-icon">⚠️</div>
            <h3 className="mn-all-tutors-error-title">Unable to load tutors</h3>
            <p className="mn-all-tutors-error-desc">{error}</p>
            <button
              type="button"
              className="mn-all-tutors-retry-btn"
              onClick={fetchTutorsFromApi}
            >
              Retry
            </button>
          </div>
        ) : tutors.length === 0 ? (
          /* EMPTY STATE */
          <div className="mn-all-tutors-empty-box">
            <div className="mn-all-tutors-empty-icon">🔍</div>
            <h3 className="mn-all-tutors-empty-title">
              {searchQuery || selectedSubject || selectedClass || selectedLocation || selectedMode
                ? 'No tutors found'
                : 'No tutors available yet'}
            </h3>
            <p className="mn-all-tutors-empty-desc">
              {searchQuery || selectedSubject || selectedClass || selectedLocation || selectedMode
                ? 'No tutors matched your specific filters. Try clearing some filters to see all verified tutors.'
                : 'Verified tutors will appear here once they join MentorNearby.'}
            </p>
            <div className="mn-all-tutors-empty-actions">
              {(searchQuery || selectedSubject || selectedClass || selectedLocation || selectedMode) && (
                <button
                  type="button"
                  className="mn-all-tutors-clear-btn"
                  onClick={handleClearAll}
                >
                  Clear Search &amp; Filters
                </button>
              )}
              <Link to="/become-tutor" className="mn-all-tutors-become-btn">
                Become a Tutor
              </Link>
            </div>
          </div>
        ) : (
          /* REAL TUTORS LIST / GRID */
          <div className={`mn-all-tutors-list-container ${viewMode === 'grid' ? 'grid-view' : 'list-view'}`}>
            {tutors.map((tutor) => {
              const tutorId = tutor._id || tutor.id || tutor.user?._id || tutor.user;
              const name = tutor.user?.name || tutor.name || 'Verified Tutor';
              const photo =
                tutor.profilePhoto?.url ||
                tutor.profilePhoto ||
                tutor.user?.avatar ||
                tutor.user?.profilePic ||
                '';

              // Real verification check
              const isVerified = Boolean(
                tutor.isVerified === true ||
                tutor.isApproved === true ||
                tutor.kycStatus === 'VERIFIED'
              );

              // Real subjects formatting
              const subjectsList =
                Array.isArray(tutor.subjects) && tutor.subjects.length > 0
                  ? tutor.subjects.join(', ')
                  : (tutor.subject || '');

              // Real qualification (from education array or qualifications)
              let qualification = '';
              if (Array.isArray(tutor.education) && tutor.education.length > 0) {
                const edu = tutor.education[0];
                const deg = edu.degree || '';
                const field = edu.field
                  ? edu.field.toLowerCase().includes('computer science')
                    ? 'CSE'
                    : edu.field
                  : '';
                qualification = deg ? (field ? `${deg} (${field})` : deg) : '';
              } else if (Array.isArray(tutor.qualifications) && tutor.qualifications.length > 0) {
                qualification = tutor.qualifications[0]?.degree || tutor.qualifications[0]?.title || '';
              }

              // Real location
              const locationStr = (tutor.location?.city || tutor.location?.area || tutor.city || '').trim();

              // Real grades / classes
              let classRange = '';
              if (Array.isArray(tutor.grades) && tutor.grades.length > 0) {
                const cleanGrades = tutor.grades.map((g) =>
                  g.toString().replace(/class\s*/i, '').trim()
                );
                if (cleanGrades.length > 1) {
                  classRange = `Class ${cleanGrades[0]}-${cleanGrades[cleanGrades.length - 1]}`;
                } else {
                  classRange = `Class ${cleanGrades[0]}`;
                }
              } else if (Array.isArray(tutor.classes) && tutor.classes.length > 0) {
                classRange = `Class ${tutor.classes.join(', ')}`;
              }

              // Real experience (ONLY display if it exists in database record)
              let experienceStr = '';
              if (tutor.experience?.years !== undefined && tutor.experience?.years !== null) {
                experienceStr = `${tutor.experience.years}+ Years Exp.`;
              } else if (typeof tutor.experience === 'number') {
                experienceStr = `${tutor.experience}+ Years Exp.`;
              }

              // Real teaching modes & online indicator
              let modesStr = 'Online';
              if (Array.isArray(tutor.teachingModes) && tutor.teachingModes.length > 0) {
                modesStr = tutor.teachingModes.join(' | ');
              } else if (tutor.teachingModes) {
                modesStr = tutor.teachingModes.toString();
              }

              // Real ratings & review count
              const hasRating = tutor.averageRating > 0 || tutor.rating > 0;
              const ratingDisplay = hasRating
                ? Number(tutor.averageRating || tutor.rating).toFixed(1)
                : '5.0';
              const reviewCount = tutor.totalReviews || 0;

              // Real fees / pricing
              const feeAmount =
                tutor.fees?.amount ||
                tutor.monthlyFees ||
                tutor.monthly_fees ||
                tutor.fees ||
                0;
              const freq = (tutor.fees?.frequency || 'PER_MONTH').toString().toUpperCase();
              let priceAmount = 'Fee on request';
              let pricePeriod = '';
              if (feeAmount > 0) {
                priceAmount = `₹${Number(feeAmount).toLocaleString('en-IN')}`;
                if (freq.includes('HOUR')) {
                  pricePeriod = '/ hr';
                } else {
                  pricePeriod = '/ month';
                }
              }

              // Wishlist check
              const isSaved = savedTutorIds.has(tutorId);

              return (
                <div key={tutorId} className="mn-tutor-real-card">
                  
                  {/* Top Bar: Verification Badge on Left, Availability + Wishlist on Right */}
                  <div className="mn-tutor-card-top-row">
                    <div className="mn-tutor-verified-badge-wrap">
                      {isVerified && (
                        <span className="mn-tutor-verified-badge">
                          <i className="fa-solid fa-shield-halved"></i>
                          <span>VERIFIED</span>
                        </span>
                      )}
                    </div>

                    <div className="mn-tutor-top-right-wrap">
                      <span className="mn-tutor-availability-badge">
                        <span className="mn-tutor-online-bullet"></span>
                        <span>{modesStr}</span>
                      </span>

                      <button
                        type="button"
                        className={`mn-tutor-heart-btn ${isSaved ? 'is-saved' : ''}`}
                        onClick={(e) => handleToggleSave(e, tutorId)}
                        aria-label={isSaved ? 'Remove from saved' : 'Save tutor'}
                      >
                        <i className={isSaved ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}></i>
                      </button>
                    </div>
                  </div>

                  {/* Main Card Content: Photo + Info + Pricing/CTA */}
                  <div className="mn-tutor-card-main-content">
                    
                    {/* Left: Tutor Photo */}
                    <div className="mn-tutor-photo-col">
                      <div className="mn-tutor-photo-frame">
                        {photo ? (
                          <img
                            src={photo}
                            alt={name}
                            className="mn-tutor-photo-img"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              if (e.target.nextSibling) {
                                e.target.nextSibling.style.display = 'flex';
                              }
                            }}
                          />
                        ) : null}
                        <div
                          className="mn-tutor-photo-fallback"
                          style={{ display: photo ? 'none' : 'flex' }}
                        >
                          {name.charAt(0).toUpperCase()}
                        </div>
                        {/* Active online dot on bottom-right of photo */}
                        <span className="mn-tutor-photo-online-dot"></span>
                      </div>
                    </div>

                    {/* Middle: Real Tutor Information */}
                    <div className="mn-tutor-info-col">
                      <div className="mn-tutor-name-row">
                        <Link to={`/tutors/${tutorId}`} className="mn-tutor-name-link">
                          <span className="mn-tutor-name-text">{name}</span>
                        </Link>
                        {isVerified && (
                          <span className="mn-tutor-name-check-icon" title="KYC Verified Tutor">
                            <i className="fa-solid fa-circle-check"></i>
                          </span>
                        )}
                      </div>

                      {subjectsList && (
                        <div className="mn-tutor-subjects-line">{subjectsList}</div>
                      )}

                      {qualification && (
                        <div className="mn-tutor-detail-line">
                          <i className="fa-solid fa-graduation-cap mn-tutor-icon-cap"></i>
                          <span>{qualification}</span>
                        </div>
                      )}

                      {locationStr && (
                        <div className="mn-tutor-detail-line">
                          <i className="fa-solid fa-location-dot mn-tutor-icon-loc"></i>
                          <span>{locationStr}</span>
                        </div>
                      )}

                      {/* Tag Chips (Class range & Experience) */}
                      {(classRange || experienceStr) && (
                        <div className="mn-tutor-chips-row">
                          {classRange && (
                            <span className="mn-tutor-chip">{classRange}</span>
                          )}
                          {experienceStr && (
                            <span className="mn-tutor-chip">{experienceStr}</span>
                          )}
                        </div>
                      )}

                      {/* Real Rating & Review Count */}
                      <div className="mn-tutor-rating-row">
                        <span className="mn-tutor-star-icon">★</span>
                        <span className="mn-tutor-rating-number">{ratingDisplay}</span>
                        <span className="mn-tutor-reviews-count">({reviewCount})</span>
                      </div>
                    </div>

                    {/* Right: Price & View Profile CTA */}
                    <div className="mn-tutor-action-col">
                      <div className="mn-tutor-price-text">
                        <span className="mn-tutor-price-amount">{priceAmount}</span>
                        {pricePeriod && (
                          <span className="mn-tutor-price-period"> {pricePeriod}</span>
                        )}
                      </div>
                      <Link to={`/tutors/${tutorId}`} className="mn-tutor-view-profile-btn">
                        <span>View Profile</span>
                        <i className="fa-solid fa-arrow-right"></i>
                      </Link>
                    </div>

                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* ============================================================ */}
        {/* 6. PAGINATION CONTROLS                                       */}
        {/* ============================================================ */}
        {!loading && !error && totalPages > 1 && (
          <div className="mn-all-tutors-pagination">
            <button
              type="button"
              className="mn-pagination-arrow-btn"
              disabled={currentPage === 1}
              onClick={() => {
                setCurrentPage((p) => Math.max(1, p - 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              aria-label="Previous page"
            >
              ‹
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
              <button
                key={pg}
                type="button"
                className={`mn-pagination-num-btn ${currentPage === pg ? 'active' : ''}`}
                onClick={() => {
                  setCurrentPage(pg);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                {pg}
              </button>
            ))}

            <button
              type="button"
              className="mn-pagination-arrow-btn"
              disabled={currentPage === totalPages}
              onClick={() => {
                setCurrentPage((p) => Math.min(totalPages, p + 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              aria-label="Next page"
            >
              ›
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default SearchPage;

