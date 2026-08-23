// ============================================================
// pages/StudyResources/StudyResourcesPage.jsx
// MentorNearby Official NCERT Book Bank Portal
// 100% Free • Exclusively Official NCERT Textbooks • Classes 9 to 12
// English & Hindi Mediums • Real NCERT Chapter-by-Chapter PDFs
// ============================================================

import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { OFFICIAL_NCERT_BOOKS, formatChapterCode } from '../../data/officialNcertBooksCatalog';
import { searchStudyResources } from '../../api/studyResources';
import './StudyResources.css';

const AVAILABLE_CLASSES = ['All Classes', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];

const AVAILABLE_MEDIUMS = [
  { value: 'All Mediums', label: 'All Mediums' },
  { value: 'English', label: 'English Medium' },
  { value: 'Hindi', label: 'Hindi Medium' },
];

const SORT_OPTIONS = [
  { value: 'recommended', label: 'Sort By: Recommended' },
  { value: 'class_asc', label: 'Class (9 to 12)' },
  { value: 'title_asc', label: 'A–Z' },
  { value: 'title_desc', label: 'Z–A' },
];

const StudyResourcesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Filters State (Exclusively NCERT)
  const [selectedClass, setSelectedClass] = useState(searchParams.get('class') || 'All Classes');
  const [selectedMedium, setSelectedMedium] = useState(searchParams.get('medium') || 'All Mediums');
  const [selectedSubject, setSelectedSubject] = useState(searchParams.get('subject') || 'All Subjects');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'recommended');
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);

  // Chapter Selection Modal State
  const [selectedBookForChapters, setSelectedBookForChapters] = useState(null);

  // Supplementary Backend DB resources (if any)
  const [dbResources, setDbResources] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch backend supplementary records
  useEffect(() => {
    const fetchDbResources = async () => {
      try {
        setLoading(true);
        const res = await searchStudyResources({ category: 'TEXTBOOK', limit: 100 });
        const list = res.data?.resources || res.resources || [];
        setDbResources(list);
      } catch (err) {
        console.warn('Backend resources offline, using official NCERT catalog:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDbResources();
  }, []);

  // Merge Official NCERT Catalog with DB Resources
  const allCatalogResources = useMemo(() => {
    const officialList = OFFICIAL_NCERT_BOOKS.map((item) => ({
      ...item,
      chaptersCount: item.chapters?.length || item.chaptersCount || 12,
      isOfficialCatalog: true,
    }));

    const dbFormatted = dbResources
      .filter((d) => !officialList.some((o) => o.title === d.title || (o.classLevel === String(d.classLevel) && o.subject === d.subject && o.medium === d.medium)))
      .map((d) => ({
        id: d._id || d.id,
        title: d.title,
        shortTitle: d.chapterTitle || d.title,
        board: 'NCERT',
        classLevel: String(d.classLevel || '9'),
        medium: d.medium || 'English',
        subject: d.subject || 'Science',
        category: 'TEXTBOOK',
        resourceType: 'Books',
        description: d.description || `Official NCERT ${d.subject} textbook for Class ${d.classLevel}.`,
        publisher: 'National Council of Educational Research and Training (NCERT)',
        officialBookUrl: d.officialUrl || d.fileUrl || `https://ncert.nic.in/textbook.php`,
        officialNcertUrl: d.officialUrl || d.fileUrl || `https://ncert.nic.in/textbook.php`,
        fileUrl: d.fileUrl || `/api/study-resources/stream/${d._id}`,
        isFree: true,
        chaptersCount: d.chaptersCount || 12,
        chapters: d.chapters || [],
        isOfficialCatalog: false,
      }));

    return [...officialList, ...dbFormatted];
  }, [dbResources]);

  // Dynamic Subjects List derived from available resources matching selected Class & Medium
  const dynamicSubjectOptions = useMemo(() => {
    let pool = allCatalogResources;

    if (selectedClass !== 'All Classes') {
      const clsNum = selectedClass.replace('Class ', '');
      pool = pool.filter((r) => r.classLevel === clsNum);
    }

    if (selectedMedium !== 'All Mediums') {
      pool = pool.filter((r) => r.medium?.toLowerCase() === selectedMedium.toLowerCase());
    }

    const subjects = new Set();
    pool.forEach((r) => {
      if (r.subject) subjects.add(r.subject);
    });

    return ['All Subjects', ...Array.from(subjects).sort()];
  }, [allCatalogResources, selectedClass, selectedMedium]);

  // Filtered & Sorted Resources
  const filteredResources = useMemo(() => {
    let list = [...allCatalogResources];

    // 1. Class Filter (Class 9, 10, 11, 12)
    if (selectedClass && selectedClass !== 'All Classes') {
      const clsNum = selectedClass.replace('Class ', '');
      list = list.filter((r) => r.classLevel === clsNum);
    }

    // 2. Medium Filter (English Medium / Hindi Medium)
    if (selectedMedium && selectedMedium !== 'All Mediums') {
      list = list.filter((r) => r.medium?.toLowerCase() === selectedMedium.toLowerCase());
    }

    // 3. Subject Filter
    if (selectedSubject && selectedSubject !== 'All Subjects') {
      list = list.filter((r) => r.subject?.toLowerCase() === selectedSubject.toLowerCase());
    }

    // 4. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((r) => {
        const inTitle = r.title?.toLowerCase().includes(q);
        const inShort = r.shortTitle?.toLowerCase().includes(q);
        const inSubject = r.subject?.toLowerCase().includes(q);
        const inDesc = r.description?.toLowerCase().includes(q);
        const inClass = `class ${r.classLevel}`.includes(q) || r.classLevel === q;
        const inChapters = r.chapters?.some((ch) => ch.title?.toLowerCase().includes(q) || `chapter ${ch.chapterNumber}`.includes(q));
        return inTitle || inShort || inSubject || inDesc || inClass || inChapters;
      });
    }

    // 5. Sorting
    if (sortBy === 'class_asc') {
      list.sort((a, b) => Number(a.classLevel) - Number(b.classLevel));
    } else if (sortBy === 'title_asc') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'title_desc') {
      list.sort((a, b) => b.title.localeCompare(a.title));
    }

    return list;
  }, [allCatalogResources, selectedClass, selectedMedium, selectedSubject, searchQuery, sortBy]);

  // Pagination Logic
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredResources.length / itemsPerPage) || 1;
  const paginatedResources = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredResources.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredResources, currentPage]);

  // Handle Clear All Filters
  const handleClearAll = () => {
    setSelectedClass('All Classes');
    setSelectedMedium('All Mediums');
    setSelectedSubject('All Subjects');
    setSearchQuery('');
    setSortBy('recommended');
    setCurrentPage(1);
  };

  // Helper: Open Chapter Selection Experience on "Read Online"
  const handleReadOnline = (item) => {
    setSelectedBookForChapters(item);
  };

  // Helper: Open Official NCERT Book Portal
  const handleOpenOfficialNcert = (item) => {
    const targetUrl = item.officialBookUrl || item.officialNcertUrl || `https://ncert.nic.in/textbook.php?${item.ncertCode || 'iemh1'}=0-${item.chaptersCount || 12}`;
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  // Helper: Open Specific Chapter's Official NCERT PDF in New Tab
  const handleOpenChapterNcert = (book, chapter) => {
    const targetUrl = chapter.pdfUrl || chapter.directPdfUrl || chapter.officialChapterUrl || getNcertPdfUrl(book.ncertCode, chapter.chapterNumber);
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  // Helper: Get Card Theme Color
  const getCardThemeClass = (item) => {
    const isHindi = item.medium === 'Hindi';
    const sub = (item.subject || '').toLowerCase();
    if (isHindi) return 'up-amber';
    if (sub.includes('math')) return 'cbse-green';
    if (sub.includes('physic')) return 'icse-blue';
    if (sub.includes('chem')) return 'up-purple';
    if (sub.includes('bio')) return 'pyq-maroon';
    return 'cbse-green';
  };

  // Helper: Card Subject Icon on Cover Corner
  const getCardCornerIcon = (item) => {
    const sub = (item.subject || '').toLowerCase();
    if (sub.includes('math')) return '🧮';
    if (sub.includes('physic')) return '⚛️';
    if (sub.includes('chem')) return '🧪';
    if (sub.includes('bio')) return '🧬';
    if (sub.includes('eng')) return '📖';
    if (sub.includes('hin')) return '📜';
    if (sub.includes('sci')) return '🔬';
    return '📚';
  };

  return (
    <div className="mn-sr-page">
      <div className="mn-sr-container">

        {/* ============================================================ */}
        {/* 1. HERO SECTION                                              */}
        {/* ============================================================ */}
        <section className="mn-sr-hero">
          <div className="mn-sr-hero-card">
            <div className="mn-sr-hero-left">
              <h1 className="mn-sr-hero-title">
                NCERT Book Bank.{' '}
                <span className="mn-sr-orange-text">Classes 9 to 12. Complete &amp; 100% Free.</span>
              </h1>
              <p className="mn-sr-hero-sub">
                Official NCERT textbooks for Class 9, 10, 11 &amp; 12 in English &amp; Hindi Mediums with full chapter navigation and direct official NCERT access.
              </p>
            </div>

            {/* Center Educational Graphic */}
            <div className="mn-sr-hero-center-graphic">
              <div style={{ fontSize: '56px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📚</span>
                <span>🇮🇳</span>
                <span>🎓</span>
              </div>
            </div>

            {/* Right Badge Box */}
            <div className="mn-sr-hero-right-badge-box">
              <div className="mn-sr-hero-badge-tag">
                <span>🏛️</span> OFFICIAL NCERT
              </div>
              <div className="mn-sr-hero-badge-item">
                <span>▷ Read Online — </span>
                <span className="free">100% FREE</span>
              </div>
              <div className="mn-sr-hero-badge-item">
                <span>↗ Official Source — </span>
                <span className="free">Direct Access</span>
              </div>
              <div className="mn-sr-hero-friendly-text">
                NCERT Books, <span style={{ color: '#EA580C' }}>Always Free 🤗</span>
              </div>
            </div>
          </div>

          {/* Medium Switcher Quick Filter Bar */}
          <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
            {AVAILABLE_MEDIUMS.map((m) => (
              <button
                key={m.value}
                type="button"
                className={`mn-sr-board-pill-btn ${selectedMedium === m.value ? 'active' : ''}`}
                onClick={() => {
                  setSelectedMedium(m.value);
                  setSelectedSubject('All Subjects');
                  setCurrentPage(1);
                }}
                style={{
                  padding: '9px 18px',
                  borderRadius: 20,
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  border: selectedMedium === m.value ? '1px solid #EA580C' : '1px solid #CBD5E1',
                  background: selectedMedium === m.value ? '#EA580C' : '#FFFFFF',
                  color: selectedMedium === m.value ? '#FFFFFF' : '#334155',
                  transition: 'all 0.2s ease',
                }}
              >
                {m.value === 'English' ? '🇬🇧 ' : (m.value === 'Hindi' ? '🇮🇳 ' : '🌐 ')}
                {m.label}
              </button>
            ))}
          </div>
        </section>

        {/* ============================================================ */}
        {/* 2. MAIN 3-COLUMN LAYOUT                                      */}
        {/* ============================================================ */}
        <div className="mn-sr-main-layout">

          {/* ---------------------------------------------------------- */}
          {/* LEFT FILTER SIDEBAR                                        */}
          {/* ---------------------------------------------------------- */}
          <aside className="mn-sr-sidebar-card">
            <div className="mn-sr-filter-header">
              <h3 className="mn-sr-filter-title">NCERT Filters</h3>
              <button type="button" className="mn-sr-clear-btn" onClick={handleClearAll}>
                Clear All
              </button>
            </div>

            {/* Class Filter (Grid of Pills: Class 9, 10, 11, 12) */}
            <div className="mn-sr-filter-group">
              <label className="mn-sr-filter-label">Class</label>
              <div className="mn-sr-class-pills-grid">
                {AVAILABLE_CLASSES.map((cls) => (
                  <button
                    key={cls}
                    type="button"
                    className={`mn-sr-class-pill ${selectedClass === cls ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedClass(cls);
                      setSelectedSubject('All Subjects');
                      setCurrentPage(1);
                    }}
                  >
                    {cls}
                  </button>
                ))}
              </div>
            </div>

            {/* Medium Filter Dropdown */}
            <div className="mn-sr-filter-group">
              <label className="mn-sr-filter-label">Medium</label>
              <select
                className="mn-sr-select"
                value={selectedMedium}
                onChange={(e) => {
                  setSelectedMedium(e.target.value);
                  setSelectedSubject('All Subjects');
                  setCurrentPage(1);
                }}
              >
                {AVAILABLE_MEDIUMS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            {/* Subject Filter Dropdown */}
            <div className="mn-sr-filter-group">
              <label className="mn-sr-filter-label">Subject</label>
              <select
                className="mn-sr-select"
                value={selectedSubject}
                onChange={(e) => {
                  setSelectedSubject(e.target.value);
                  setCurrentPage(1);
                }}
              >
                {dynamicSubjectOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Apply Filters CTA */}
            <button
              type="button"
              className="mn-sr-apply-btn"
              onClick={() => setCurrentPage(1)}
            >
              Apply Filters
            </button>
          </aside>

          {/* ---------------------------------------------------------- */}
          {/* CENTER: SEARCH & BOOK CARDS GRID                           */}
          {/* ---------------------------------------------------------- */}
          <main className="mn-sr-center-content">

            {/* Search Bar & Sort Dropdown */}
            <div className="mn-sr-search-sort-row">
              <div className="mn-sr-search-bar">
                <input
                  type="text"
                  className="mn-sr-search-input"
                  placeholder="Search NCERT books, subjects, classes..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                />
                <button
                  type="button"
                  className="mn-sr-search-icon"
                  onClick={() => setCurrentPage(1)}
                >
                  🔍
                </button>
              </div>

              <select
                className="mn-sr-sort-select"
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setCurrentPage(1);
                }}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Active Filters Summary Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '14px 0 10px', fontSize: 13, color: '#64748B', fontWeight: 600 }}>
              <div>
                Showing <strong>{filteredResources.length}</strong> official NCERT books for{' '}
                <span style={{ color: '#0F172A', fontWeight: 800 }}>
                  {selectedClass !== 'All Classes' ? selectedClass : 'Classes 9–12'}
                </span>
                {selectedMedium !== 'All Mediums' && ` • ${selectedMedium} Medium`}
                {selectedSubject !== 'All Subjects' && ` • ${selectedSubject}`}
              </div>
            </div>

            {/* Empty State */}
            {filteredResources.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: '#FFF', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: 44 }}>📚</span>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: '12px 0 4px' }}>
                  No NCERT books found for this selection
                </h3>
                <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 16px' }}>
                  Try changing your class, medium, or subject to discover available NCERT textbooks.
                </p>
                <button type="button" className="mn-sr-clear-btn" onClick={handleClearAll} style={{ fontSize: 14 }}>
                  Reset All Filters
                </button>
              </div>
            )}

            {/* 5-COLUMN NCERT BOOK CARDS GRID */}
            {filteredResources.length > 0 && (
              <>
                <div className="mn-sr-cards-grid">
                  {paginatedResources.map((item) => {
                    const id = item.id || item._id;
                    const themeClass = getCardThemeClass(item);
                    const classLevel = item.classLevel || '9';
                    const medium = item.medium || 'English';
                    const chaptersCount = item.chapters?.length || item.chaptersCount || 12;
                    const isHindi = medium === 'Hindi';

                    return (
                      <div key={id} className="mn-sr-card">
                        {/* Large Thematic NCERT Textbook-Style Cover */}
                        <div
                          className={`mn-sr-card-cover ${themeClass}`}
                          onClick={() => handleReadOnline(item)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="mn-sr-cover-top-badges">
                            <span className="mn-sr-cover-board-badge">NCERT</span>
                            <span className="mn-sr-cover-class-badge">
                              {isHindi ? `कक्षा ${classLevel}` : `Class ${classLevel}`}
                            </span>
                          </div>

                          <div className="mn-sr-cover-center">
                            <div style={{ fontSize: '10.5px', fontWeight: '800', opacity: 0.9 }}>NCERT</div>
                            <div style={{ fontSize: '12.5px', fontWeight: '900', letterSpacing: '0.3px' }}>
                              {item.shortTitle || item.subject}
                            </div>
                            <div style={{ fontSize: '9px', fontWeight: '700', opacity: 0.85 }}>
                              {isHindi ? 'हिंदी माध्यम' : 'English Medium'}
                            </div>
                          </div>

                          <div className="mn-sr-cover-bottom-icon">
                            <span>{getCardCornerIcon(item)}</span>
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="mn-sr-card-body">
                          <div className="mn-sr-card-category-label">
                            NCERT Textbook
                          </div>

                          <h3
                            className="mn-sr-card-book-title"
                            onClick={() => handleReadOnline(item)}
                            title={item.title}
                            style={{ cursor: 'pointer' }}
                          >
                            {item.shortTitle || item.title}
                          </h3>

                          <div className="mn-sr-card-meta-line">
                            {isHindi ? `कक्षा ${classLevel} • हिंदी माध्यम` : `Class ${classLevel} • English Medium`}
                          </div>

                          <div
                            className="mn-sr-card-chapters-line"
                            onClick={() => handleReadOnline(item)}
                            style={{ cursor: 'pointer' }}
                          >
                            {isHindi ? `📖 Book • ${chaptersCount} अध्याय` : `📖 Book • ${chaptersCount} Chapters`}
                          </div>

                          {/* Action Buttons: [ Read Online ] and [ Open Official NCERT ] */}
                          <div className="mn-sr-card-actions">
                            <button
                              type="button"
                              className="mn-sr-btn-read-free"
                              onClick={() => handleReadOnline(item)}
                              title="View all chapters and read online"
                            >
                              Read Online
                            </button>

                            <button
                              type="button"
                              className="mn-sr-btn-download-free"
                              onClick={() => handleOpenOfficialNcert(item)}
                              title="Open official NCERT portal textbook page in new tab"
                              style={{
                                background: '#F1F5F9',
                                color: '#0F172A',
                                border: '1px solid #CBD5E1',
                                fontWeight: 700,
                              }}
                            >
                              Open Official NCERT ↗
                            </button>
                          </div>

                          <div className="mn-sr-card-free-tag">
                            <span>🟢</span> Official NCERT • 100% Free
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Dynamic Pagination Controls */}
                {totalPages > 1 && (
                  <div className="mn-sr-pagination">
                    <button
                      type="button"
                      className="mn-sr-page-pill"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    >
                      ‹
                    </button>
                    {Array.from({ length: Math.min(totalPages, 5) }).map((_, idx) => {
                      const pageNum = idx + 1;
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          className={`mn-sr-page-pill ${currentPage === pageNum ? 'active' : ''}`}
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    {totalPages > 5 && <span>...</span>}
                    {totalPages > 5 && (
                      <button
                        type="button"
                        className={`mn-sr-page-pill ${currentPage === totalPages ? 'active' : ''}`}
                        onClick={() => setCurrentPage(totalPages)}
                      >
                        {totalPages}
                      </button>
                    )}
                    <button
                      type="button"
                      className="mn-sr-page-pill"
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
          {/* RIGHT SIDEBAR (TRENDING NCERT BOOKS)                       */}
          {/* ---------------------------------------------------------- */}
          <aside className="mn-sr-right-sidebar">
            <div className="mn-sr-trending-card">
              <div className="mn-sr-trending-header">
                <h3 className="mn-sr-trending-title">Popular NCERT Books</h3>
              </div>

              <div className="mn-sr-trending-list">
                <div
                  className="mn-sr-trend-row"
                  onClick={() => {
                    const b = OFFICIAL_NCERT_BOOKS.find((x) => x.id === 'ncert-c10-maths-en');
                    if (b) setSelectedBookForChapters(b);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="mn-sr-trend-icon-box cbse">📖</div>
                  <div className="mn-sr-trend-info">
                    <h4 className="mn-sr-trend-name">Class 10 Mathematics (English)</h4>
                    <span className="mn-sr-trend-views">14 Chapters • NCERT</span>
                  </div>
                </div>

                <div
                  className="mn-sr-trend-row"
                  onClick={() => {
                    const b = OFFICIAL_NCERT_BOOKS.find((x) => x.id === 'ncert-c10-science-en');
                    if (b) setSelectedBookForChapters(b);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="mn-sr-trend-icon-box icse">🔬</div>
                  <div className="mn-sr-trend-info">
                    <h4 className="mn-sr-trend-name">Class 10 Science (English)</h4>
                    <span className="mn-sr-trend-views">13 Chapters • NCERT</span>
                  </div>
                </div>

                <div
                  className="mn-sr-trend-row"
                  onClick={() => {
                    const b = OFFICIAL_NCERT_BOOKS.find((x) => x.id === 'ncert-c9-maths-en');
                    if (b) setSelectedBookForChapters(b);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="mn-sr-trend-icon-box cbse">📖</div>
                  <div className="mn-sr-trend-info">
                    <h4 className="mn-sr-trend-name">Class 9 Mathematics (English)</h4>
                    <span className="mn-sr-trend-views">12 Chapters • NCERT</span>
                  </div>
                </div>

                <div
                  className="mn-sr-trend-row"
                  onClick={() => {
                    const b = OFFICIAL_NCERT_BOOKS.find((x) => x.id === 'ncert-c11-physics-p1-en');
                    if (b) setSelectedBookForChapters(b);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="mn-sr-trend-icon-box icse">⚛️</div>
                  <div className="mn-sr-trend-info">
                    <h4 className="mn-sr-trend-name">Class 11 Physics Part I</h4>
                    <span className="mn-sr-trend-views">7 Chapters • NCERT</span>
                  </div>
                </div>

                <div
                  className="mn-sr-trend-row"
                  onClick={() => {
                    const b = OFFICIAL_NCERT_BOOKS.find((x) => x.id === 'ncert-c12-chemistry-p1-en');
                    if (b) setSelectedBookForChapters(b);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="mn-sr-trend-icon-box up">🧪</div>
                  <div className="mn-sr-trend-info">
                    <h4 className="mn-sr-trend-name">Class 12 Chemistry Part I</h4>
                    <span className="mn-sr-trend-views">5 Chapters • NCERT</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>

        </div>

      </div>

      {/* ============================================================ */}
      {/* 3. CLEAN NCERT CHAPTER SELECTION MODAL (READ ONLINE)         */}
      {/* ============================================================ */}
      {selectedBookForChapters && (
        <div
          className="mn-ch-modal-overlay"
          onClick={() => setSelectedBookForChapters(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
        >
          <div
            className="mn-ch-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              maxWidth: '860px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              overflow: 'hidden',
              border: '1px solid #E2E8F0',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '22px 28px',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#F8FAFC',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span
                    style={{
                      background: '#EA580C',
                      color: '#FFF',
                      fontSize: '11px',
                      fontWeight: '800',
                      padding: '2px 8px',
                      borderRadius: '12px',
                    }}
                  >
                    OFFICIAL NCERT
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#64748B' }}>
                    {selectedBookForChapters.medium === 'Hindi' ? 'हिंदी माध्यम' : 'English Medium'}
                  </span>
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0F172A', margin: 0 }}>
                  NCERT {selectedBookForChapters.subject} — Class {selectedBookForChapters.classLevel}
                </h2>
                <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0' }}>
                  {selectedBookForChapters.title} • {selectedBookForChapters.chapters?.length || selectedBookForChapters.chaptersCount || 12} Chapters Available
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => handleOpenOfficialNcert(selectedBookForChapters)}
                  style={{
                    background: '#EA580C',
                    color: '#FFF',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    fontSize: '12.5px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                  title="Open full official textbook on NCERT portal"
                >
                  <span>📚</span>
                  <span>Open Full NCERT Book ↗</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedBookForChapters(null)}
                  style={{
                    background: '#F1F5F9',
                    border: '1px solid #CBD5E1',
                    borderRadius: '50%',
                    width: '34px',
                    height: '34px',
                    fontSize: '18px',
                    fontWeight: '700',
                    color: '#475569',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Chapters List */}
            <div
              style={{
                padding: '24px 28px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ fontSize: '13px', color: '#475569', fontWeight: '600', marginBottom: '4px' }}>
                Select a chapter below to open the official NCERT PDF in a new tab:
              </div>

              {(selectedBookForChapters.chapters && selectedBookForChapters.chapters.length > 0
                ? selectedBookForChapters.chapters
                : Array.from({ length: selectedBookForChapters.chaptersCount || 12 }).map((_, i) => ({
                    chapterNumber: i + 1,
                    title: `Chapter ${i + 1}`,
                    officialChapterUrl: `https://ncert.nic.in/textbook.php?${selectedBookForChapters.ncertCode || 'iemh1'}=${i + 1}-${selectedBookForChapters.chaptersCount || 12}`,
                  }))
              ).map((ch) => (
                <div
                  key={ch.chapterNumber}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 18px',
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '12px',
                    gap: '16px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                    <div
                      style={{
                        background: '#0F172A',
                        color: '#FFFFFF',
                        borderRadius: '8px',
                        width: '36px',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '13px',
                        fontWeight: '800',
                        flexShrink: 0,
                      }}
                    >
                      {formatChapterCode(ch.chapterNumber)}
                    </div>
                    <div>
                      <div style={{ fontSize: '14.5px', fontWeight: '800', color: '#0F172A' }}>
                        Chapter {ch.chapterNumber} — {ch.title}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748B' }}>
                        Official NCERT • {selectedBookForChapters.subject}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenChapterNcert(selectedBookForChapters, ch)}
                    style={{
                      background: '#EA580C',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '9px 18px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      flexShrink: 0,
                      boxShadow: '0 2px 8px rgba(234, 88, 12, 0.25)',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#C2410C')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#EA580C')}
                    title="Open official NCERT Chapter PDF directly in new tab"
                  >
                    <span>📄</span>
                    <span>Open PDF ↗</span>
                  </button>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '14px 28px',
                borderTop: '1px solid #E2E8F0',
                background: '#F8FAFC',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '12px',
                color: '#64748B',
              }}
            >
              <span>🏛️ All textbooks are sourced directly from the official NCERT portal (ncert.nic.in).</span>
              <button
                type="button"
                onClick={() => setSelectedBookForChapters(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#0F172A',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '12.5px',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default StudyResourcesPage;
