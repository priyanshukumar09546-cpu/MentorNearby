// ============================================================
// pages/Courses/CoursesPage.jsx
// MentorNearby Courses Marketplace Page
// Real Database-Driven PYQ Mastery, Subject Packs & Video Solutions
// Strict Visual Reference Implementation
// ============================================================

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getCourses } from '../../api/courses';
import './Courses.css';

// 5 Main Categories
const CATEGORY_TABS = [
  { id: 'PYQ_MASTERY', label: 'PYQ Mastery', icon: '📑' },
  { id: 'SUBJECT_COURSE', label: 'Subject Courses', icon: '📘' },
  { id: 'CRASH_COURSE', label: 'Exam Crash Courses', icon: '🔮' },
  { id: 'REVISION_COURSE', label: 'Revision Courses', icon: '📗' },
  { id: 'BOARD_PREP', label: 'Board Prep', icon: '📕' },
];

const AVAILABLE_CLASSES = ['All Classes', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];

const AVAILABLE_SUBJECTS = [
  'All Subjects',
  'Mathematics',
  'Science',
  'Physics',
  'Chemistry',
  'Biology',
  'English',
  'Social Science',
  'Hindi',
];

const COURSE_TYPES = [
  { value: 'ALL', label: 'All Types' },
  { value: 'PYQ_MASTERY', label: 'PYQ Mastery' },
  { value: 'SUBJECT_COURSE', label: 'Subject Course' },
  { value: 'CRASH_COURSE', label: 'Exam Crash Course' },
  { value: 'REVISION_COURSE', label: 'Revision Course' },
  { value: 'BOARD_PREP', label: 'Board Prep' },
];

const LANGUAGES = [
  'All Languages',
  'English',
  'Hindi',
  'Bilingual',
];

const SORT_OPTIONS = [
  { value: 'recommended', label: 'Sort By: Recommended' },
  { value: 'latest', label: 'Latest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'class_order', label: 'Class / Course Order' },
];

const CoursesPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedClass, setSelectedClass] = useState(searchParams.get('class') || 'All Classes');
  const [selectedSubject, setSelectedSubject] = useState(searchParams.get('subject') || 'All Subjects');
  const [selectedCourseType, setSelectedCourseType] = useState(searchParams.get('type') || 'ALL');
  const [selectedLanguage, setSelectedLanguage] = useState(searchParams.get('lang') || 'All Languages');
  const [selectedPrice, setSelectedPrice] = useState(searchParams.get('price') || 'All');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'recommended');
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);

  // Data & State
  const [courses, setCourses] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // Fetch Courses from Real Backend API
  const fetchCoursesList = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const params = {
        page: currentPage,
        limit: 12,
        sort: sortBy,
      };

      if (selectedCategory) params.category = selectedCategory;
      if (selectedCourseType && selectedCourseType !== 'ALL') params.category = selectedCourseType;
      if (selectedClass && selectedClass !== 'All Classes') params.classLevel = selectedClass.replace('Class ', '');
      if (selectedSubject && selectedSubject !== 'All Subjects') params.subject = selectedSubject;
      if (selectedLanguage && selectedLanguage !== 'All Languages') params.language = selectedLanguage;
      if (selectedPrice && selectedPrice !== 'All') params.price = selectedPrice;
      if (searchQuery.trim()) params.q = searchQuery.trim();

      const res = await getCourses(params);
      const courseList = res.data?.courses || res.courses || [];
      const total = res.data?.total || res.total || courseList.length;
      const pages = res.data?.pages || Math.ceil(total / 12) || 1;

      setCourses(courseList);
      setTotalCount(total);
      setTotalPages(pages);
    } catch (err) {
      console.error('Failed to fetch courses:', err);
      setErrorMsg(err.response?.data?.message || 'Unable to connect to course catalog. Please check backend server.');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedCourseType, selectedClass, selectedSubject, selectedLanguage, selectedPrice, searchQuery, sortBy, currentPage]);

  useEffect(() => {
    fetchCoursesList();
  }, [fetchCoursesList]);

  // Handle Category Tab Switch
  const handleCategoryClick = (catId) => {
    const nextCat = selectedCategory === catId ? '' : catId;
    setSelectedCategory(nextCat);
    setSelectedCourseType(nextCat ? nextCat : 'ALL');
    setCurrentPage(1);
  };

  // Handle Class Selection
  const handleClassClick = (cls) => {
    setSelectedClass(cls);
    setCurrentPage(1);
  };

  // Handle Price Selection
  const handlePriceClick = (priceOption) => {
    setSelectedPrice(priceOption);
    setCurrentPage(1);
  };

  // Apply Filters Click
  const handleApplyFilters = () => {
    setCurrentPage(1);
    fetchCoursesList();
  };

  // Clear All Filters
  const handleClearAll = () => {
    setSelectedCategory('');
    setSelectedClass('All Classes');
    setSelectedSubject('All Subjects');
    setSelectedCourseType('ALL');
    setSelectedLanguage('All Languages');
    setSelectedPrice('All');
    setSearchQuery('');
    setSortBy('recommended');
    setCurrentPage(1);
  };

  // Helper: Get Badge Category Class
  const getBadgeCategoryClass = (category) => {
    switch (category) {
      case 'SUBJECT_COURSE':
        return 'subject';
      case 'CRASH_COURSE':
        return 'crash';
      case 'REVISION_COURSE':
        return 'revision';
      case 'BOARD_PREP':
        return 'board';
      default:
        return 'pyq';
    }
  };

  // Helper: Format Category Label
  const getCategoryLabel = (category) => {
    switch (category) {
      case 'SUBJECT_COURSE':
        return 'Subject Course';
      case 'CRASH_COURSE':
        return 'Exam Crash';
      case 'REVISION_COURSE':
        return 'Revision Course';
      case 'BOARD_PREP':
        return 'Board Prep';
      default:
        return 'PYQ Mastery';
    }
  };

  return (
    <div className="mn-courses-page bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors">
      <div className="mn-courses-container">
        
        {/* ============================================================ */}
        {/* 1. HERO SECTION                                              */}
        {/* ============================================================ */}
        <section className="mn-courses-hero">
          <div className="mn-courses-hero-card bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <div className="mn-courses-hero-left">
              <h1 className="mn-courses-hero-title text-gray-900 dark:text-white">
                Learn Smarter with Structured,{' '}
                <span className="mn-courses-orange-text">Exam-Focused Courses.</span>
              </h1>
              <p className="mn-courses-hero-sub text-gray-600 dark:text-gray-300">
                Video courses, solved PYQs and board exam preparation designed for students.
              </p>
            </div>
            <div className="mn-courses-hero-graphic">
              <div className="mn-courses-hero-icon-wrap">
                <span>💻</span>
                <span>🎓</span>
                <span>📚</span>
              </div>
            </div>
          </div>

          {/* Category Filter Buttons Row */}
          <div className="mn-courses-categories-row">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`mn-courses-category-btn bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 ${selectedCategory === tab.id ? 'active' : ''}`}
                onClick={() => handleCategoryClick(tab.id)}
              >
                <span className="mn-courses-cat-icon">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ============================================================ */}
        {/* 2. MAIN 3-COLUMN LAYOUT                                      */}
        {/* ============================================================ */}
        <div className="mn-courses-main-layout">
          
          {/* ---------------------------------------------------------- */}
          {/* LEFT FILTER SIDEBAR                                        */}
          {/* ---------------------------------------------------------- */}
          <aside className="mn-courses-sidebar-card bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <div className="mn-courses-filter-header">
              <h3 className="mn-courses-filter-title text-gray-900 dark:text-white">Filters</h3>
              <button type="button" className="mn-courses-clear-all-btn" onClick={handleClearAll}>
                Clear All
              </button>
            </div>

            {/* Class Filter */}
            <div className="mn-courses-filter-group">
              <label className="mn-courses-filter-label text-gray-700 dark:text-gray-300">Class</label>
              <div className="mn-courses-class-pills-grid">
                {AVAILABLE_CLASSES.map((cls) => (
                  <button
                    key={cls}
                    type="button"
                    className={`mn-courses-class-pill bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 ${selectedClass === cls ? 'active' : ''}`}
                    onClick={() => handleClassClick(cls)}
                  >
                    {cls}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject Filter */}
            <div className="mn-courses-filter-group">
              <label className="mn-courses-filter-label text-gray-700 dark:text-gray-300">Subject</label>
              <select
                className="mn-courses-select bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
              >
                {AVAILABLE_SUBJECTS.map((sub) => (
                  <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white" key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            {/* Course Type Filter */}
            <div className="mn-courses-filter-group">
              <label className="mn-courses-filter-label text-gray-700 dark:text-gray-300">Course Type</label>
              <select
                className="mn-courses-select bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                value={selectedCourseType}
                onChange={(e) => {
                  setSelectedCourseType(e.target.value);
                  setSelectedCategory(e.target.value === 'ALL' ? '' : e.target.value);
                }}
              >
                {COURSE_TYPES.map((t) => (
                  <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white" key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Language Filter */}
            <div className="mn-courses-filter-group">
              <label className="mn-courses-filter-label text-gray-700 dark:text-gray-300">Language</label>
              <select
                className="mn-courses-select bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
              >
                {LANGUAGES.map((lang) => (
                  <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white" key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Filter */}
            <div className="mn-courses-filter-group">
              <label className="mn-courses-filter-label text-gray-700 dark:text-gray-300">Price</label>
              <div className="mn-courses-price-pills">
                {['All', 'Free', 'Paid'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`mn-courses-class-pill bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 ${selectedPrice === p ? 'active' : ''}`}
                    onClick={() => handlePriceClick(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Apply Filters CTA */}
            <button type="button" className="mn-courses-apply-btn" onClick={handleApplyFilters}>
              Apply Filters
            </button>
          </aside>

          {/* ---------------------------------------------------------- */}
          {/* CENTER: SEARCH, SORT & 4-COLUMN COURSE CARDS GRID          */}
          {/* ---------------------------------------------------------- */}
          <main className="mn-courses-center-content">
            
            {/* Search Bar & Sorting Header */}
            <div className="mn-courses-search-sort-row">
              <div className="mn-courses-search-bar bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <input
                  type="text"
                  className="mn-courses-search-input bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="Search by course title, class, subject or topic..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                />
                <button
                  type="button"
                  className="mn-courses-search-icon-btn text-gray-500 dark:text-gray-400"
                  onClick={handleApplyFilters}
                  title="Search"
                >
                  🔍
                </button>
              </div>

              <div className="mn-courses-sort-dropdown-wrap bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <select
                  className="mn-courses-sort-select bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-0"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white" key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Section Header */}
            <div className="mn-courses-grid-header">
              <h2 className="mn-courses-grid-title text-gray-900 dark:text-white">All Courses</h2>
              <p className="mn-courses-grid-subtitle text-gray-600 dark:text-gray-400">
                {totalCount > 0
                  ? `Showing ${courses.length} of ${totalCount} real courses from Class 9 to 12`
                  : 'Showing real courses from Class 9 to 12'}
              </p>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700" style={{ textAlign: 'center', padding: '60px 20px', borderRadius: 12 }}>
                <div style={{ width: 40, height: 40, border: '3px solid #E2E8F0', borderTopColor: '#D97706', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }}></div>
                <p className="text-gray-600 dark:text-gray-300" style={{ fontWeight: 600, fontSize: 13 }}>Loading real courses from database...</p>
              </div>
            )}

            {/* Error State */}
            {!loading && errorMsg && (
              <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800" style={{ textAlign: 'center', padding: '40px 20px', borderRadius: 12 }}>
                <p style={{ color: '#DC2626', fontWeight: 700, margin: '0 0 10px' }}>⚠️ {errorMsg}</p>
                <button type="button" onClick={fetchCoursesList} className="mn-courses-apply-btn" style={{ width: 'auto', padding: '0 20px', height: 36 }}>
                  Retry Loading
                </button>
              </div>
            )}

            {/* Empty State */}
            {!loading && !errorMsg && courses.length === 0 && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700" style={{ textAlign: 'center', padding: '60px 20px', borderRadius: 12 }}>
                <span style={{ fontSize: 40 }}>📚</span>
                <h3 className="text-gray-900 dark:text-white" style={{ fontSize: 16, fontWeight: 800, margin: '10px 0 4px' }}>No courses found</h3>
                <p className="text-gray-600 dark:text-gray-400" style={{ fontSize: 13, margin: '0 0 16px' }}>
                  No courses match your selected filter criteria. Try choosing a different class or subject.
                </p>
                <button type="button" className="mn-courses-clear-all-btn" onClick={handleClearAll} style={{ fontSize: 14 }}>
                  Reset Filters
                </button>
              </div>
            )}

            {/* 4-COLUMN CARDS GRID */}
            {!loading && !errorMsg && courses.length > 0 && (
              <>
                <div className="mn-courses-cards-grid">
                  {courses.map((course) => {
                    const id = course._id || course.id;
                    const slugOrId = course.slug || id;
                    const categoryCls = getBadgeCategoryClass(course.category);
                    const categoryText = getCategoryLabel(course.category);

                    return (
                      <div key={id} className="mn-course-card bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        {/* Dark Card Thumbnail Banner */}
                        <div className="mn-course-card-thumb">
                          <div className="mn-course-thumb-top-row">
                            <span className={`mn-course-type-badge ${categoryCls}`}>
                              {categoryText}
                            </span>
                            <span className="mn-course-class-badge">
                              Class {course.classLevel}
                            </span>
                          </div>

                          <div className="mn-course-thumb-center">
                            <div className="mn-course-thumb-tag">
                              {course.category === 'PYQ_MASTERY' ? '10 YEARS' : 'COMPLETE COURSE'}
                            </div>
                            <h4 className="mn-course-thumb-headline">
                              {course.category === 'PYQ_MASTERY' ? 'BOARD PYQ MASTERY' : course.subject}
                            </h4>
                            <div className="mn-course-thumb-subheadline">
                              {course.category === 'PYQ_MASTERY' ? course.subject.toUpperCase() : `CLASS ${course.classLevel}`}
                            </div>
                          </div>

                          <div className="mn-course-play-overlay">
                            ▶
                          </div>

                          <div className="mn-course-thumb-bottom-icons">
                            <span>📐</span>
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="mn-course-card-body">
                          <h3 className="mn-course-title text-gray-900 dark:text-white" title={course.title}>
                            {course.title}
                          </h3>

                          <div className="mn-course-meta-row text-gray-600 dark:text-gray-400">
                            <span className="mn-course-meta-item">
                              🎥 {course.totalVideosCount || 10} Videos
                            </span>
                            <span>•</span>
                            <span className="mn-course-meta-item">
                              📄 {course.totalPptCount || 10} PPTs
                            </span>
                          </div>

                          <div className="mn-course-author text-gray-500 dark:text-gray-400">
                            By {course.instructor?.name || 'MentorNearby'}
                          </div>

                          <Link
                            to={`/courses/${slugOrId}`}
                            className="mn-course-start-btn"
                          >
                            Start Learning
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="mn-courses-pagination-wrap">
                    <button
                      type="button"
                      className="mn-courses-page-btn bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    >
                      ‹
                    </button>
                    {Array.from({ length: totalPages }).map((_, idx) => {
                      const pageNum = idx + 1;
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          className={`mn-courses-page-btn bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 ${currentPage === pageNum ? 'active' : ''}`}
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      className="mn-courses-page-btn bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    >
                      ›
                    </button>
                  </div>
                )}
              </>
            )}
          </main>

          {/* ---------------------------------------------------------- */}
          {/* RIGHT SIDEBAR                                              */}
          {/* ---------------------------------------------------------- */}
          <aside className="mn-courses-right-sidebar">
            
            {/* Why Learn with MentorNearby? */}
            <div className="mn-courses-why-card bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <h3 className="mn-courses-why-title text-gray-900 dark:text-white">Why Learn with MentorNearby?</h3>
              
              <div className="mn-courses-why-item">
                <div className="mn-courses-why-icon orange">📚</div>
                <div>
                  <h4 className="mn-courses-why-h4 text-gray-900 dark:text-white">Structured Courses</h4>
                  <p className="mn-courses-why-desc text-gray-600 dark:text-gray-400">Well-organized courses for better understanding.</p>
                </div>
              </div>

              <div className="mn-courses-why-item">
                <div className="mn-courses-why-icon blue">📄</div>
                <div>
                  <h4 className="mn-courses-why-h4 text-gray-900 dark:text-white">PYQ Mastery</h4>
                  <p className="mn-courses-why-desc text-gray-600 dark:text-gray-400">10 Years of Board PYQs with video solutions.</p>
                </div>
              </div>

              <div className="mn-courses-why-item">
                <div className="mn-courses-why-icon green">📖</div>
                <div>
                  <h4 className="mn-courses-why-h4 text-gray-900 dark:text-white">Free Reading</h4>
                  <p className="mn-courses-why-desc text-gray-600 dark:text-gray-400">Read all PPTs online completely FREE.</p>
                </div>
              </div>

              <div className="mn-courses-why-item">
                <div className="mn-courses-why-icon purple">⬇️</div>
                <div>
                  <h4 className="mn-courses-why-h4 text-gray-900 dark:text-white">Download with Ease</h4>
                  <p className="mn-courses-why-desc text-gray-600 dark:text-gray-400">Download PPTs for just ₹19 each.</p>
                </div>
              </div>

              <div className="mn-courses-why-item">
                <div className="mn-courses-why-icon yellow">👥</div>
                <div>
                  <h4 className="mn-courses-why-h4 text-gray-900 dark:text-white">Trusted by Students</h4>
                  <p className="mn-courses-why-desc text-gray-600 dark:text-gray-400">Join thousands of students preparing smarter.</p>
                </div>
              </div>
            </div>

            {/* Get It Delivered to You (Print Delivery) */}
            <div className="mn-courses-delivery-card bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <div className="mn-courses-delivery-header">
                <span>🎓</span>
                <h3 className="mn-courses-delivery-title text-gray-900 dark:text-white">Get It Delivered to You</h3>
              </div>
              <p className="mn-courses-delivery-sub text-gray-600 dark:text-gray-400">Get printed copies of study material delivered fast.</p>
              
              <div className="mn-courses-delivery-brands">
                <div
                  className="mn-courses-brand-box zepto"
                  onClick={() => window.open('https://www.zeptonow.com', '_blank')}
                >
                  <div className="mn-courses-brand-name">zepto</div>
                  <div className="mn-courses-brand-time">10–15 min delivery</div>
                </div>

                <div
                  className="mn-courses-brand-box blinkit"
                  onClick={() => window.open('https://blinkit.com', '_blank')}
                >
                  <div className="mn-courses-brand-name">blinkit</div>
                  <div className="mn-courses-brand-time">10–20 min delivery</div>
                </div>
              </div>

              <p className="mn-courses-delivery-note text-gray-500 dark:text-gray-400">* Delivery available in selected cities</p>
            </div>

          </aside>

        </div>

        {/* ============================================================ */}
        {/* 3. BOTTOM TRUST STRIP & NOTE BANNER                          */}
        {/* ============================================================ */}
        <section className="mn-courses-bottom-trust-strip bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <div className="mn-courses-trust-item">
            <div className="mn-courses-trust-icon-box bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700">🛡️</div>
            <div>
              <h4 className="mn-courses-trust-title text-gray-900 dark:text-white">Quality Content</h4>
              <p className="mn-courses-trust-desc text-gray-600 dark:text-gray-400">All courses and materials are created by experts.</p>
            </div>
          </div>

          <div className="mn-courses-trust-item">
            <div className="mn-courses-trust-icon-box bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700">🎯</div>
            <div>
              <h4 className="mn-courses-trust-title text-gray-900 dark:text-white">Exam Focused</h4>
              <p className="mn-courses-trust-desc text-gray-600 dark:text-gray-400">Designed specially for board exam success.</p>
            </div>
          </div>

          <div className="mn-courses-trust-item">
            <div className="mn-courses-trust-icon-box bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700">🔄</div>
            <div>
              <h4 className="mn-courses-trust-title text-gray-900 dark:text-white">Always Updated</h4>
              <p className="mn-courses-trust-desc text-gray-600 dark:text-gray-400">New courses and PYQs added regularly.</p>
            </div>
          </div>

          <div className="mn-courses-trust-item">
            <div className="mn-courses-trust-icon-box bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700">📱</div>
            <div>
              <h4 className="mn-courses-trust-title text-gray-900 dark:text-white">Learn Anytime</h4>
              <p className="mn-courses-trust-desc text-gray-600 dark:text-gray-400">Access on mobile, tablet or desktop.</p>
            </div>
          </div>
        </section>

        {/* Informational Blue Note Banner */}
        <div className="mn-courses-info-banner bg-blue-50 dark:bg-gray-800 border-blue-200 dark:border-gray-700 text-blue-900 dark:text-blue-300">
          <span>ℹ️</span>
          <span>
            <strong>Note:</strong> Reading online is <strong>FREE</strong>. Download PPTs for just <strong>₹19 each</strong>.
          </span>
        </div>

      </div>
    </div>
  );
};

export default CoursesPage;
