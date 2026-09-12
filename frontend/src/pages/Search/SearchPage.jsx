// ============================================================
// pages/Search/SearchPage.jsx
// MentorNearby "All Tutors" Marketplace Page
// End-to-End Functional Filter System with Real Database Data
// ZERO Fake / Mock Tutors • Fixed Popover Dropdown Architecture
// ============================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { searchTutors } from '../../api/search';
import { saveTutor, removeSavedTutor, getMySavedTutors } from '../../api/savedTutors';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import './SearchPage.css';

// Subject visual branding dictionary matching Screen 3
const SUBJECT_AESTHETICS = {
  mathematics: { symbol: 'π', color: '#2563EB', bg: '#EFF6FF', border: '#DBEAFE', darkBg: 'rgba(37, 99, 235, 0.15)' },
  maths: { symbol: 'π', color: '#2563EB', bg: '#EFF6FF', border: '#DBEAFE', darkBg: 'rgba(37, 99, 235, 0.15)' },
  physics: { symbol: '⚛️', color: '#E11D48', bg: '#FDF2F8', border: '#FCE7F3', darkBg: 'rgba(225, 29, 72, 0.15)' },
  chemistry: { symbol: '🧪', color: '#059669', bg: '#F0FDF4', border: '#DCFCE7', darkBg: 'rgba(5, 150, 105, 0.15)' },
  biology: { symbol: '🧬', color: '#9333EA', bg: '#FAF5FF', border: '#F3E8FF', darkBg: 'rgba(147, 51, 234, 0.15)' },
  english: { symbol: '📖', color: '#D97706', bg: '#FFF7ED', border: '#FFEDD5', darkBg: 'rgba(217, 119, 6, 0.15)' },
  hindi: { symbol: 'Aअ', color: '#E11D48', bg: '#FFF1F2', border: '#FFE4E6', darkBg: 'rgba(225, 29, 72, 0.15)' },
  'computer science': { symbol: '💻', color: '#4F46E5', bg: '#EEF2FF', border: '#E0E7FF', darkBg: 'rgba(79, 70, 229, 0.15)' },
  'art & craft': { symbol: '🎨', color: '#D97706', bg: '#FEFCE8', border: '#FEF08A', darkBg: 'rgba(217, 119, 6, 0.15)' },
  accountancy: { symbol: '₹', color: '#E11D48', bg: '#FEF2F2', border: '#FEE2E2', darkBg: 'rgba(225, 29, 72, 0.15)' },
  economics: { symbol: '📈', color: '#7C3AED', bg: '#FAF5FF', border: '#F3E8FF', darkBg: 'rgba(124, 58, 237, 0.15)' },
  'social studies': { symbol: '🌐', color: '#059669', bg: '#F0FDF4', border: '#DCFCE7', darkBg: 'rgba(5, 150, 105, 0.15)' },
  history: { symbol: '🏛️', color: '#BE123C', bg: '#FFF1F2', border: '#FFE4E6', darkBg: 'rgba(190, 18, 60, 0.15)' },
  geography: { symbol: '🧭', color: '#0D9488', bg: '#ECFDF5', border: '#CCFBF1', darkBg: 'rgba(13, 148, 136, 0.15)' },
  science: { symbol: '🔬', color: '#0D9488', bg: '#F0FDFA', border: '#CCFBF1', darkBg: 'rgba(13, 148, 136, 0.15)' },
};

const getSubjectAesthetic = (subjectName) => {
  const key = (subjectName || '').toLowerCase().trim();
  return (
    SUBJECT_AESTHETICS[key] || {
      symbol: (subjectName || '').charAt(0).toUpperCase() || '📚',
      color: '#2563EB',
      bg: '#EFF6FF',
      border: '#DBEAFE',
      darkBg: 'rgba(37, 99, 235, 0.15)',
    }
  );
};

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { isDark, darkMode } = useTheme();
  const isDarkMode = isDark ?? darkMode ?? false;

  // Single source of truth for filters
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get('q') || searchParams.get('search') || ''
  );
  const [selectedSubject, setSelectedSubject] = useState(searchParams.get('subject') || '');
  const [selectedClass, setSelectedClass] = useState(
    searchParams.get('class') || searchParams.get('grade') || ''
  );
  const [selectedLocation, setSelectedLocation] = useState(
    searchParams.get('location') || searchParams.get('city') || ''
  );
  const [selectedMode, setSelectedMode] = useState(
    searchParams.get('mode') || searchParams.get('teachingModes') || ''
  );
  const [selectedMaxFees, setSelectedMaxFees] = useState(
    searchParams.get('maxFees') || searchParams.get('maxFee') || ''
  );
  const [selectedMinExp, setSelectedMinExp] = useState(
    searchParams.get('minExperience') || searchParams.get('experience') || ''
  );
  const [selectedMinRating, setSelectedMinRating] = useState(
    searchParams.get('minRating') || searchParams.get('rating') || ''
  );
  const [sort, setSort] = useState(searchParams.get('sort') || 'relevance');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page')) || 1);

  // Floating Popover State: { name: 'subject'|'class'|'location'|'mode'|'sort', top, left, width }
  const [activePopover, setActivePopover] = useState(null);

  // Full Filters Modal / Drawer State
  const [showFiltersModal, setShowFiltersModal] = useState(false);

  // Real Database Tutors State
  const [tutors, setTutors] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Full Catalog of Real Filter Options (derived from database)
  const [catalogSubjects, setCatalogSubjects] = useState([]);
  const [catalogClasses, setCatalogClasses] = useState([]);
  const [catalogLocations, setCatalogLocations] = useState([]);

  // Saved / Bookmark State
  const [savedTutorIds, setSavedTutorIds] = useState(new Set());

  // Button Refs for Popover Anchoring
  const filterPillRefs = {
    subject: useRef(null),
    class: useRef(null),
    location: useRef(null),
    mode: useRef(null),
    sort: useRef(null),
  };

  // Close popover on window resize / scroll
  useEffect(() => {
    const handleScrollOrResize = () => {
      if (activePopover) {
        setActivePopover(null);
      }
    };
    window.addEventListener('resize', handleScrollOrResize);
    return () => window.removeEventListener('resize', handleScrollOrResize);
  }, [activePopover]);

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

  // Fetch full catalog once to extract complete real filter options
  useEffect(() => {
    searchTutors({ limit: 50 })
      .then((res) => {
        const allList =
          res.data?.data?.tutors ||
          res.data?.tutors ||
          res.data?.data ||
          (Array.isArray(res.data) ? res.data : []);

        if (Array.isArray(allList) && allList.length > 0) {
          // Extract real subjects
          const subs = Array.from(
            new Set(
              allList
                .flatMap((t) => t.subjects || [t.subject])
                .filter(Boolean)
                .map((s) => s.trim())
            )
          ).sort();
          if (subs.length > 0) setCatalogSubjects(subs);

          // Extract real classes
          const cls = Array.from(
            new Set(
              allList
                .flatMap((t) => t.grades || t.classes || [])
                .filter(Boolean)
                .map((c) => c.toString().trim())
            )
          ).sort((a, b) => {
            const numA = parseInt(a.replace(/\D/g, '')) || 0;
            const numB = parseInt(b.replace(/\D/g, '')) || 0;
            return numA - numB;
          });
          if (cls.length > 0) setCatalogClasses(cls);

          // Extract real locations (split multiple like "HAPUR & Ghaziabad")
          const locs = Array.from(
            new Set(
              allList
                .flatMap((t) => {
                  const city = t.location?.city || '';
                  const area = t.location?.area || '';
                  return [city, area];
                })
                .flatMap((locStr) => locStr.split(/[&,/+]/))
                .map((l) => l.trim())
                .filter((l) => l.length > 1)
            )
          ).map((l) => l.charAt(0).toUpperCase() + l.slice(1).toLowerCase());
          const dedupedLocs = Array.from(new Set(locs)).sort();
          if (dedupedLocs.length > 0) setCatalogLocations(dedupedLocs);
        }
      })
      .catch((err) => {
        console.error('Error loading filter catalog:', err);
      });
  }, []);

  // Sync URL query params with state
  const syncParamsToUrl = useCallback(
    (overrides = {}) => {
      const p = new URLSearchParams();
      const current = {
        q: searchQuery,
        subject: selectedSubject,
        class: selectedClass,
        location: selectedLocation,
        mode: selectedMode,
        maxFees: selectedMaxFees,
        minExperience: selectedMinExp,
        minRating: selectedMinRating,
        sort,
        page: currentPage,
        ...overrides,
      };

      if (current.q && current.q.trim()) p.set('q', current.q.trim());
      if (current.subject) p.set('subject', current.subject);
      if (current.class) p.set('class', current.class);
      if (current.location) p.set('location', current.location);
      if (current.mode) p.set('mode', current.mode);
      if (current.maxFees) p.set('maxFees', current.maxFees);
      if (current.minExperience) p.set('minExperience', current.minExperience);
      if (current.minRating) p.set('minRating', current.minRating);
      if (current.sort && current.sort !== 'relevance') p.set('sort', current.sort);
      if (current.page && current.page > 1) p.set('page', current.page.toString());

      setSearchParams(p, { replace: true });
    },
    [
      searchQuery,
      selectedSubject,
      selectedClass,
      selectedLocation,
      selectedMode,
      selectedMaxFees,
      selectedMinExp,
      selectedMinRating,
      sort,
      currentPage,
      setSearchParams,
    ]
  );

  // Fetch Tutors from Real Database API with active filters
  const fetchTutorsFromApi = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const cleanParams = {};
      if (searchQuery.trim()) cleanParams.q = searchQuery.trim();
      if (selectedSubject) cleanParams.subject = selectedSubject;
      if (selectedClass) cleanParams.class = selectedClass;
      if (selectedLocation) cleanParams.location = selectedLocation;
      if (selectedMode) cleanParams.teachingModes = selectedMode;
      if (selectedMaxFees) cleanParams.maxFees = selectedMaxFees;
      if (selectedMinExp) cleanParams.minExperience = selectedMinExp;
      if (selectedMinRating) cleanParams.minRating = selectedMinRating;
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
  }, [
    searchQuery,
    selectedSubject,
    selectedClass,
    selectedLocation,
    selectedMode,
    selectedMaxFees,
    selectedMinExp,
    selectedMinRating,
    sort,
    currentPage,
  ]);

  // Execute fetch when filters change
  useEffect(() => {
    fetchTutorsFromApi();
  }, [fetchTutorsFromApi]);

  // Toggle or open a popover directly below its corresponding button
  const handleTogglePopover = (name) => {
    if (activePopover?.name === name) {
      setActivePopover(null);
      return;
    }

    const btn = filterPillRefs[name]?.current;
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const popoverWidth = 210;

    // Viewport-safe left calculation
    let left = rect.left;
    if (left + popoverWidth > window.innerWidth - 12) {
      left = window.innerWidth - popoverWidth - 12;
    }
    if (left < 12) {
      left = 12;
    }

    setActivePopover({
      name,
      top: rect.bottom + 6,
      left,
      width: Math.max(rect.width, 190),
    });
  };

  // Close popover helper
  const handleClosePopover = () => {
    setActivePopover(null);
  };

  // Filter Selection Handlers
  const handleSelectSubject = (subj) => {
    setSelectedSubject(subj);
    setCurrentPage(1);
    handleClosePopover();
    syncParamsToUrl({ subject: subj, page: 1 });
  };

  const handleSelectClass = (cls) => {
    setSelectedClass(cls);
    setCurrentPage(1);
    handleClosePopover();
    syncParamsToUrl({ class: cls, page: 1 });
  };

  const handleSelectLocation = (loc) => {
    setSelectedLocation(loc);
    setCurrentPage(1);
    handleClosePopover();
    syncParamsToUrl({ location: loc, page: 1 });
  };

  const handleSelectMode = (mode) => {
    setSelectedMode(mode);
    setCurrentPage(1);
    handleClosePopover();
    syncParamsToUrl({ mode, page: 1 });
  };

  const handleSelectSort = (newSort) => {
    setSort(newSort);
    setCurrentPage(1);
    handleClosePopover();
    syncParamsToUrl({ sort: newSort, page: 1 });
  };

  // Search Submission
  const handleExecuteSearch = (e) => {
    if (e) e.preventDefault();
    handleClosePopover();
    setCurrentPage(1);
    syncParamsToUrl({ q: searchQuery, page: 1 });
  };

  // Clear Search Bar Only
  const handleClearSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
    syncParamsToUrl({ q: '', page: 1 });
  };

  // Clear All Filters
  const handleClearAll = () => {
    setSearchQuery('');
    setSelectedSubject('');
    setSelectedClass('');
    setSelectedLocation('');
    setSelectedMode('');
    setSelectedMaxFees('');
    setSelectedMinExp('');
    setSelectedMinRating('');
    setSort('relevance');
    setCurrentPage(1);
    handleClosePopover();
    setShowFiltersModal(false);
    setSearchParams(new URLSearchParams());
  };

  // Saved / Bookmark Toggle
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

  // Count active filters (excluding search and sort)
  const activeFilters = [];
  if (selectedSubject) activeFilters.push({ key: 'subject', label: selectedSubject });
  if (selectedClass) activeFilters.push({ key: 'class', label: selectedClass });
  if (selectedLocation) activeFilters.push({ key: 'location', label: selectedLocation });
  if (selectedMode) activeFilters.push({ key: 'mode', label: selectedMode });
  if (selectedMaxFees) activeFilters.push({ key: 'maxFees', label: `Under ₹${selectedMaxFees}` });
  if (selectedMinExp) activeFilters.push({ key: 'minExperience', label: `${selectedMinExp}+ Yrs Exp` });
  if (selectedMinRating) activeFilters.push({ key: 'minRating', label: `${selectedMinRating}+ ★` });

  const activeFilterCount = activeFilters.length;

  const currentSubjectAesthetic = selectedSubject ? getSubjectAesthetic(selectedSubject) : null;

  return (
    <div className={`mn-all-tutors-root ${isDarkMode ? 'dark' : 'light'}`}>
      <div className="mn-all-tutors-container">
        
        {/* ============================================================ */}
        {/* 1. TITLE / SUBJECT BANNER & REAL TUTOR COUNT                 */}
        {/* ============================================================ */}
        {selectedSubject ? (
          <div className="mn-subject-banner-container">
            <div className="mn-subject-banner-card">
              <div
                className="mn-subject-banner-icon-box"
                style={{
                  background: isDarkMode ? currentSubjectAesthetic.darkBg : currentSubjectAesthetic.bg,
                  color: currentSubjectAesthetic.color,
                  borderColor: isDarkMode ? 'transparent' : currentSubjectAesthetic.border,
                }}
              >
                <span className="mn-subject-banner-symbol">{currentSubjectAesthetic.symbol}</span>
              </div>
              <div className="mn-subject-banner-text">
                <h1 className="mn-subject-banner-title">{selectedSubject} Tutors</h1>
                <p className="mn-subject-banner-desc">Find verified tutors who teach {selectedSubject}.</p>
              </div>
            </div>
            <div className="mn-subject-tutors-count-row">
              <span className="mn-subject-tutors-count-text">
                {!loading && `${totalCount} ${totalCount === 1 ? 'Tutor' : 'Tutors'}`}
              </span>
            </div>
          </div>
        ) : (
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
        )}

        {/* ============================================================ */}
        {/* 2. SEARCH BAR                                                */}
        {/* ============================================================ */}
        <form className="mn-all-tutors-search-form" onSubmit={handleExecuteSearch} role="search">
          <i className="fa-solid fa-magnifying-glass mn-all-tutors-search-icon" aria-hidden="true"></i>
          <input
            type="text"
            className="mn-all-tutors-search-input"
            placeholder={
              selectedSubject
                ? 'Search tutors, location, or class...'
                : 'Search by name, subject, class, or location...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search tutors"
          />
          {searchQuery && (
            <button
              type="button"
              className="mn-all-tutors-search-clear"
              onClick={handleClearSearch}
              aria-label="Clear search query"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          )}
        </form>

        {/* ============================================================ */}
        {/* 3. HORIZONTAL FILTER PILLS ROW                               */}
        {/* ============================================================ */}
        <div className="mn-all-tutors-filter-pills-row">
          
          {/* A. Filters Button (Opens Comprehensive Filters Modal) */}
          <button
            type="button"
            className={`mn-filter-pill-btn mn-filter-pill-main ${
              activeFilterCount > 0 ? 'has-active-filters' : ''
            }`}
            onClick={() => setShowFiltersModal(true)}
            aria-label="Open filter settings modal"
          >
            <i className="fa-solid fa-sliders"></i>
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="mn-filter-count-pill">{activeFilterCount}</span>
            )}
          </button>

          {/* B. Subject Dropdown Pill (shown when not viewing a dedicated subject banner) */}
          {!selectedSubject && (
            <button
              ref={filterPillRefs.subject}
              type="button"
              className={`mn-filter-pill-btn ${selectedSubject ? 'active' : ''}`}
              onClick={() => handleTogglePopover('subject')}
              aria-expanded={activePopover?.name === 'subject'}
            >
              <span>{selectedSubject || 'Subject'}</span>
              <i className="fa-solid fa-chevron-down mn-pill-chevron"></i>
            </button>
          )}

          {/* C. Class Dropdown Pill */}
          <button
            ref={filterPillRefs.class}
            type="button"
            className={`mn-filter-pill-btn ${selectedClass ? 'active' : ''}`}
            onClick={() => handleTogglePopover('class')}
            aria-expanded={activePopover?.name === 'class'}
          >
            <span>{selectedClass || 'Class'}</span>
            <i className="fa-solid fa-chevron-down mn-pill-chevron"></i>
          </button>

          {/* D. Location Dropdown Pill */}
          <button
            ref={filterPillRefs.location}
            type="button"
            className={`mn-filter-pill-btn ${selectedLocation ? 'active' : ''}`}
            onClick={() => handleTogglePopover('location')}
            aria-expanded={activePopover?.name === 'location'}
          >
            <span>{selectedLocation || 'Location'}</span>
            <i className="fa-solid fa-chevron-down mn-pill-chevron"></i>
          </button>

          {/* E. Availability Dropdown Pill */}
          <button
            ref={filterPillRefs.mode}
            type="button"
            className={`mn-filter-pill-btn ${selectedMode ? 'active' : ''}`}
            onClick={() => handleTogglePopover('mode')}
            aria-expanded={activePopover?.name === 'mode'}
          >
            <span>{selectedMode || 'Availability'}</span>
            <i className="fa-solid fa-chevron-down mn-pill-chevron"></i>
          </button>

        </div>

        {/* ============================================================ */}
        {/* ACTIVE FILTER TAGS ROW (IF ANY ACTIVE)                       */}
        {/* ============================================================ */}
        {activeFilterCount > 0 && (
          <div className="mn-active-filters-chips-bar">
            <span className="mn-active-filters-label">Active:</span>
            {activeFilters.map((f) => (
              <span key={f.key} className="mn-active-filter-chip">
                <span>{f.label}</span>
                <button
                  type="button"
                  onClick={() => {
                    if (f.key === 'subject') handleSelectSubject('');
                    if (f.key === 'class') handleSelectClass('');
                    if (f.key === 'location') handleSelectLocation('');
                    if (f.key === 'mode') handleSelectMode('');
                    if (f.key === 'maxFees') { setSelectedMaxFees(''); syncParamsToUrl({ maxFees: '' }); }
                    if (f.key === 'minExperience') { setSelectedMinExp(''); syncParamsToUrl({ minExperience: '' }); }
                    if (f.key === 'minRating') { setSelectedMinRating(''); syncParamsToUrl({ minRating: '' }); }
                  }}
                  aria-label={`Remove ${f.label} filter`}
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </span>
            ))}
            <button
              type="button"
              className="mn-clear-all-text-btn"
              onClick={handleClearAll}
            >
              Clear All
            </button>
          </div>
        )}

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
                onChange={(e) => handleSelectSort(e.target.value)}
                aria-label="Sort tutors by"
              >
                <option value="relevance">Recommended</option>
                <option value="rating">Highest Rated</option>
                <option value="fees_asc">Price: Low to High</option>
                <option value="fees_desc">Price: High to Low</option>
                <option value="experience">Experience: High to Low</option>
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
              aria-label="Grid view (2 columns)"
              title="Grid View"
            >
              <i className="fa-solid fa-table-cells-large"></i>
            </button>
            <button
              type="button"
              className={`mn-view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              aria-label="List view (Single column)"
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
          /* EMPTY STATE (Zero Fake Tutors Guaranteed) */
          <div className="mn-all-tutors-empty-box">
            <div className="mn-all-tutors-empty-icon">🔍</div>
            <h3 className="mn-all-tutors-empty-title">No tutors found</h3>
            <p className="mn-all-tutors-empty-desc">
              {activeFilterCount > 0 || searchQuery
                ? 'No tutors matched your specific filters. Try changing or clearing your filters to see available tutors.'
                : 'Verified tutors will appear here once they join MentorNearby.'}
            </p>
            <div className="mn-all-tutors-empty-actions">
              {(activeFilterCount > 0 || searchQuery) && (
                <button
                  type="button"
                  className="mn-all-tutors-clear-btn"
                  onClick={handleClearAll}
                >
                  Clear Filters
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

              // Real qualification
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

              // Real experience
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

              // Real ratings & review count (DO NOT FABRICATE 5.0)
              const numRating = Number(tutor.averageRating || tutor.rating || 0);
              const reviewCount = Number(tutor.totalReviews || 0);
              const hasRealRating = numRating > 0 && reviewCount > 0;

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
                          <i className="fa-solid fa-circle-check"></i>
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

                  {/* Main Card Content */}
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

                      {/* Real Rating & Review Count (Honest state without fake 5.0) */}
                      <div className="mn-tutor-rating-row">
                        {hasRealRating ? (
                          <>
                            <span className="mn-tutor-star-icon">★</span>
                            <span className="mn-tutor-rating-number">{numRating.toFixed(1)}</span>
                            <span className="mn-tutor-reviews-count">({reviewCount})</span>
                          </>
                        ) : (
                          <>
                            <span className="mn-tutor-star-icon muted">★</span>
                            <span className="mn-tutor-rating-number new-badge">New</span>
                            <span className="mn-tutor-reviews-count">(0 reviews)</span>
                          </>
                        )}
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

      {/* ============================================================ */}
      {/* 7. UNCLIPPED FLOATING POPOVER (PORTAL OUTSIDE SCROLL ROW)    */}
      {/* ============================================================ */}
      {activePopover && (
        <>
          {/* Backdrop overlay for outside tap */}
          <div
            className="mn-popover-backdrop"
            onClick={handleClosePopover}
            aria-hidden="true"
          />

          {/* Floating Dropdown Popover */}
          <div
            className="mn-popover-card"
            style={{
              top: `${activePopover.top}px`,
              left: `${activePopover.left}px`,
              minWidth: `${activePopover.width}px`,
            }}
            role="dialog"
            aria-modal="true"
          >
            {/* Popover Header with Title and Clear */}
            <div className="mn-popover-header">
              <span className="mn-popover-title">
                {activePopover.name === 'subject' && 'Select Subject'}
                {activePopover.name === 'class' && 'Select Class'}
                {activePopover.name === 'location' && 'Select Location'}
                {activePopover.name === 'mode' && 'Select Availability'}
              </span>
              <button
                type="button"
                className="mn-popover-close-btn"
                onClick={handleClosePopover}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* A. Subject Options */}
            {activePopover.name === 'subject' && (
              <div className="mn-popover-items-list">
                <button
                  type="button"
                  className={`mn-popover-item ${!selectedSubject ? 'selected' : ''}`}
                  onClick={() => handleSelectSubject('')}
                >
                  <span>All Subjects</span>
                  {!selectedSubject && <i className="fa-solid fa-check"></i>}
                </button>
                {catalogSubjects.map((subj) => (
                  <button
                    key={subj}
                    type="button"
                    className={`mn-popover-item ${selectedSubject === subj ? 'selected' : ''}`}
                    onClick={() => handleSelectSubject(subj)}
                  >
                    <span>{subj}</span>
                    {selectedSubject === subj && <i className="fa-solid fa-check"></i>}
                  </button>
                ))}
              </div>
            )}

            {/* B. Class Options */}
            {activePopover.name === 'class' && (
              <div className="mn-popover-items-list">
                <button
                  type="button"
                  className={`mn-popover-item ${!selectedClass ? 'selected' : ''}`}
                  onClick={() => handleSelectClass('')}
                >
                  <span>All Classes</span>
                  {!selectedClass && <i className="fa-solid fa-check"></i>}
                </button>
                {catalogClasses.map((cls) => (
                  <button
                    key={cls}
                    type="button"
                    className={`mn-popover-item ${selectedClass === cls ? 'selected' : ''}`}
                    onClick={() => handleSelectClass(cls)}
                  >
                    <span>{cls}</span>
                    {selectedClass === cls && <i className="fa-solid fa-check"></i>}
                  </button>
                ))}
              </div>
            )}

            {/* C. Location Options */}
            {activePopover.name === 'location' && (
              <div className="mn-popover-items-list">
                <button
                  type="button"
                  className={`mn-popover-item ${!selectedLocation ? 'selected' : ''}`}
                  onClick={() => handleSelectLocation('')}
                >
                  <span>All Locations</span>
                  {!selectedLocation && <i className="fa-solid fa-check"></i>}
                </button>
                {catalogLocations.map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    className={`mn-popover-item ${selectedLocation === loc ? 'selected' : ''}`}
                    onClick={() => handleSelectLocation(loc)}
                  >
                    <span>{loc}</span>
                    {selectedLocation === loc && <i className="fa-solid fa-check"></i>}
                  </button>
                ))}
              </div>
            )}

            {/* D. Availability Options */}
            {activePopover.name === 'mode' && (
              <div className="mn-popover-items-list">
                <button
                  type="button"
                  className={`mn-popover-item ${!selectedMode ? 'selected' : ''}`}
                  onClick={() => handleSelectMode('')}
                >
                  <span>All Modes</span>
                  {!selectedMode && <i className="fa-solid fa-check"></i>}
                </button>
                <button
                  type="button"
                  className={`mn-popover-item ${selectedMode === 'Online' ? 'selected' : ''}`}
                  onClick={() => handleSelectMode('Online')}
                >
                  <span>Online</span>
                  {selectedMode === 'Online' && <i className="fa-solid fa-check"></i>}
                </button>
                <button
                  type="button"
                  className={`mn-popover-item ${selectedMode === 'Offline' ? 'selected' : ''}`}
                  onClick={() => handleSelectMode('Offline')}
                >
                  <span>Offline</span>
                  {selectedMode === 'Offline' && <i className="fa-solid fa-check"></i>}
                </button>
                <button
                  type="button"
                  className={`mn-popover-item ${selectedMode === 'Online & Offline' ? 'selected' : ''}`}
                  onClick={() => handleSelectMode('Online & Offline')}
                >
                  <span>Online &amp; Offline</span>
                  {selectedMode === 'Online & Offline' && <i className="fa-solid fa-check"></i>}
                </button>
              </div>
            )}

          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* 8. COMPREHENSIVE FILTERS MODAL / SLIDE-OVER DRAWER          */}
      {/* ============================================================ */}
      {showFiltersModal && (
        <div className="mn-filters-modal-root" role="dialog" aria-modal="true">
          <div
            className="mn-filters-modal-backdrop"
            onClick={() => setShowFiltersModal(false)}
          />

          <div className="mn-filters-modal-panel">
            {/* Modal Header */}
            <div className="mn-filters-modal-header">
              <div className="mn-filters-modal-title-wrap">
                <h2 className="mn-filters-modal-title">Filters</h2>
                {activeFilterCount > 0 && (
                  <span className="mn-filters-modal-count-badge">
                    {activeFilterCount} {activeFilterCount === 1 ? 'active' : 'active'}
                  </span>
                )}
              </div>
              <button
                type="button"
                className="mn-filters-modal-close"
                onClick={() => setShowFiltersModal(false)}
                aria-label="Close filters"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="mn-filters-modal-body">
              
              {/* Section 1: Subject */}
              <div className="mn-filter-section">
                <label className="mn-filter-section-title">Subject</label>
                <div className="mn-filter-chips-grid">
                  <button
                    type="button"
                    className={`mn-modal-chip ${!selectedSubject ? 'active' : ''}`}
                    onClick={() => setSelectedSubject('')}
                  >
                    All Subjects
                  </button>
                  {catalogSubjects.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`mn-modal-chip ${selectedSubject === s ? 'active' : ''}`}
                      onClick={() => setSelectedSubject(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Section 2: Class */}
              <div className="mn-filter-section">
                <label className="mn-filter-section-title">Class / Grade</label>
                <div className="mn-filter-chips-grid">
                  <button
                    type="button"
                    className={`mn-modal-chip ${!selectedClass ? 'active' : ''}`}
                    onClick={() => setSelectedClass('')}
                  >
                    All Classes
                  </button>
                  {catalogClasses.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`mn-modal-chip ${selectedClass === c ? 'active' : ''}`}
                      onClick={() => setSelectedClass(c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Section 3: Location */}
              <div className="mn-filter-section">
                <label className="mn-filter-section-title">Location</label>
                <div className="mn-filter-chips-grid">
                  <button
                    type="button"
                    className={`mn-modal-chip ${!selectedLocation ? 'active' : ''}`}
                    onClick={() => setSelectedLocation('')}
                  >
                    All Locations
                  </button>
                  {catalogLocations.map((l) => (
                    <button
                      key={l}
                      type="button"
                      className={`mn-modal-chip ${selectedLocation === l ? 'active' : ''}`}
                      onClick={() => setSelectedLocation(l)}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Section 4: Availability */}
              <div className="mn-filter-section">
                <label className="mn-filter-section-title">Availability / Mode</label>
                <div className="mn-filter-chips-grid">
                  <button
                    type="button"
                    className={`mn-modal-chip ${!selectedMode ? 'active' : ''}`}
                    onClick={() => setSelectedMode('')}
                  >
                    All Modes
                  </button>
                  <button
                    type="button"
                    className={`mn-modal-chip ${selectedMode === 'Online' ? 'active' : ''}`}
                    onClick={() => setSelectedMode('Online')}
                  >
                    Online
                  </button>
                  <button
                    type="button"
                    className={`mn-modal-chip ${selectedMode === 'Offline' ? 'active' : ''}`}
                    onClick={() => setSelectedMode('Offline')}
                  >
                    Offline
                  </button>
                  <button
                    type="button"
                    className={`mn-modal-chip ${selectedMode === 'Online & Offline' ? 'active' : ''}`}
                    onClick={() => setSelectedMode('Online & Offline')}
                  >
                    Online &amp; Offline
                  </button>
                </div>
              </div>

              {/* Section 5: Maximum Fees */}
              <div className="mn-filter-section">
                <label className="mn-filter-section-title">Monthly Fee (Max)</label>
                <div className="mn-filter-chips-grid">
                  <button
                    type="button"
                    className={`mn-modal-chip ${!selectedMaxFees ? 'active' : ''}`}
                    onClick={() => setSelectedMaxFees('')}
                  >
                    Any Price
                  </button>
                  <button
                    type="button"
                    className={`mn-modal-chip ${selectedMaxFees === '3000' ? 'active' : ''}`}
                    onClick={() => setSelectedMaxFees('3000')}
                  >
                    Under ₹3,000
                  </button>
                  <button
                    type="button"
                    className={`mn-modal-chip ${selectedMaxFees === '5000' ? 'active' : ''}`}
                    onClick={() => setSelectedMaxFees('5000')}
                  >
                    Under ₹5,000
                  </button>
                  <button
                    type="button"
                    className={`mn-modal-chip ${selectedMaxFees === '10000' ? 'active' : ''}`}
                    onClick={() => setSelectedMaxFees('10000')}
                  >
                    Under ₹10,000
                  </button>
                </div>
              </div>

              {/* Section 6: Experience */}
              <div className="mn-filter-section">
                <label className="mn-filter-section-title">Teaching Experience</label>
                <div className="mn-filter-chips-grid">
                  <button
                    type="button"
                    className={`mn-modal-chip ${!selectedMinExp ? 'active' : ''}`}
                    onClick={() => setSelectedMinExp('')}
                  >
                    Any Experience
                  </button>
                  <button
                    type="button"
                    className={`mn-modal-chip ${selectedMinExp === '1' ? 'active' : ''}`}
                    onClick={() => setSelectedMinExp('1')}
                  >
                    1+ Years
                  </button>
                  <button
                    type="button"
                    className={`mn-modal-chip ${selectedMinExp === '3' ? 'active' : ''}`}
                    onClick={() => setSelectedMinExp('3')}
                  >
                    3+ Years
                  </button>
                  <button
                    type="button"
                    className={`mn-modal-chip ${selectedMinExp === '5' ? 'active' : ''}`}
                    onClick={() => setSelectedMinExp('5')}
                  >
                    5+ Years
                  </button>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="mn-filters-modal-footer">
              <button
                type="button"
                className="mn-modal-clear-btn"
                onClick={handleClearAll}
              >
                Clear All
              </button>
              <button
                type="button"
                className="mn-modal-apply-btn"
                onClick={() => {
                  setShowFiltersModal(false);
                  setCurrentPage(1);
                  syncParamsToUrl({ page: 1 });
                }}
              >
                Show Results
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default SearchPage;
