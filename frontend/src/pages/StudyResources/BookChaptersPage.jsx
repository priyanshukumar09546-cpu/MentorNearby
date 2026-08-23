// ============================================================
// pages/StudyResources/BookChaptersPage.jsx
// MentorNearby Dedicated Book Chapters Page
// Breadcrumbs → Complete Book Banner → Chapter Cards Grid
// (Textbook, Notes, Solutions, PYQs, Formula Sheet, Practice)
// ============================================================

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { OFFICIAL_NCERT_BOOKS } from '../../data/officialNcertBooksCatalog';
import { OFFICIAL_STUDY_RESOURCES, formatChapterCode } from '../../data/officialStudyCatalog';
import { searchStudyResources } from '../../api/studyResources';
import StudyResourceViewerModal from '../../components/studyResources/StudyResourceViewerModal';
import './StudyResources.css';

const BookChaptersPage = () => {
  const { bookId, id } = useParams();
  const navigate = useNavigate();

  const activeId = bookId || id;
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('asc'); // 'asc', 'desc', 'title'

  // PDF Viewer Modal State
  const [viewerData, setViewerData] = useState({
    isOpen: false,
    resource: null,
    resourceId: null,
  });

  // Load Book Data
  useEffect(() => {
    const fetchBook = async () => {
      setLoading(true);
      // 1. Check official NCERT catalog first
      const ncertFound = OFFICIAL_NCERT_BOOKS.find(
        (b) => b.id === activeId || b.slug === activeId || b.ncertCode === activeId
      );

      if (ncertFound) {
        setBook(ncertFound);
        setLoading(false);
        return;
      }

      // 2. Check official study catalog
      const official = OFFICIAL_STUDY_RESOURCES.find(
        (b) => b.id === activeId || b.slug === activeId
      );

      if (official) {
        setBook(official);
        setLoading(false);
        return;
      }

      // 2. Fetch from backend API
      try {
        const res = await searchStudyResources({ q: activeId, limit: 1 });
        const list = res.data?.resources || res.resources || [];
        if (list.length > 0) {
          const item = list[0];
          setBook({
            ...item,
            id: item._id || item.id,
            chaptersCount: item.chaptersCount || 15,
            chapters: item.chapters?.length ? item.chapters : [
              {
                id: 'ch1',
                chapterNumber: 1,
                chapterCode: '01',
                title: item.chapterTitle || 'Chapter 01: Overview & Key Concepts',
                description: item.description || 'Complete chapter study material and solved examples.',
                officialUrl: item.fileUrl,
                resources: {
                  textbook: { title: 'Chapter Textbook', url: item.fileUrl },
                  notes: { title: 'Revision Notes', url: item.fileUrl },
                  solutions: { title: 'Model Solutions', url: item.fileUrl },
                  pyqs: { title: '10 Years PYQs', url: item.fileUrl },
                  formulaSheet: { title: 'Formula Sheet', url: item.fileUrl },
                },
              },
            ],
          });
        }
      } catch (err) {
        console.error('Failed to load book chapters:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [activeId]);

  // Filtered & Sorted Chapters
  const processedChapters = useMemo(() => {
    if (!book || !book.chapters) return [];
    let list = [...book.chapters];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (ch) =>
          ch.title?.toLowerCase().includes(q) ||
          ch.description?.toLowerCase().includes(q) ||
          `chapter ${ch.chapterNumber}`.includes(q) ||
          `ch ${ch.chapterNumber}`.includes(q)
      );
    }

    if (sortBy === 'desc') {
      list.sort((a, b) => b.chapterNumber - a.chapterNumber);
    } else if (sortBy === 'title') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      list.sort((a, b) => a.chapterNumber - b.chapterNumber);
    }

    return list;
  }, [book, searchQuery, sortBy]);

  // Read Complete Book in Native Browser (New Tab)
  const handleReadCompleteBook = () => {
    if (!book) return;
    const targetUrl = book.officialBookUrl || book.officialNcertUrl || `https://ncert.nic.in/textbook.php?${book.ncertCode || 'iemh1'}=0-${book.chaptersCount || 12}`;
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  // Direct Download Book (New Tab)
  const handleDownloadBook = () => {
    if (!book) return;
    const targetUrl = book.officialBookUrl || book.officialNcertUrl || `https://ncert.nic.in/textbook.php?${book.ncertCode || 'iemh1'}=0-${book.chaptersCount || 12}`;
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  // Read Chapter in Native Browser PDF Viewer (New Tab)
  const handleReadChapter = (chapter) => {
    if (!book) return;
    const targetUrl = chapter.pdfUrl || chapter.directPdfUrl || chapter.officialChapterUrl || (book.ncertCode ? `https://ncert.nic.in/textbook/pdf/${book.ncertCode}${formatChapterCode(chapter.chapterNumber)}.pdf` : `https://ncert.nic.in/textbook.php`);
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="mn-sr-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 44, height: 44, border: '4px solid #CBD5E1', borderTopColor: '#D97706', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }}></div>
          <p style={{ color: '#64748B', fontWeight: 700 }}>Loading Book Chapters...</p>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="mn-sr-page" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <span style={{ fontSize: 48 }}>📚</span>
        <h2 style={{ color: '#0F172A', margin: '14px 0 8px' }}>Book Not Found</h2>
        <p style={{ color: '#64748B', marginBottom: 24 }}>The book you are looking for does not exist or has been moved.</p>
        <Link to="/study-resources" className="mn-sr-apply-btn" style={{ display: 'inline-flex', width: 'auto', padding: '0 24px', height: 40, textDecoration: 'none', alignItems: 'center' }}>
          ← Back to All Books
        </Link>
      </div>
    );
  }

  const isHindi = book.medium === 'Hindi';
  const boardBadge = book.board === 'UP_BOARD_ENGLISH' ? 'UP Board (EM)' : (book.board === 'UP_BOARD_HINDI' ? 'UP Board (HM)' : book.board);
  const totalChapters = book.chapters?.length || book.chaptersCount || 15;

  return (
    <div className="mn-sr-page">
      <div className="mn-sr-container">

        {/* ---------------------------------------------------------- */}
        {/* 1. BREADCRUMB NAVIGATION                                    */}
        {/* ---------------------------------------------------------- */}
        <nav className="mn-sr-breadcrumb-bar" aria-label="breadcrumb">
          <Link to="/" className="mn-sr-bc-link">Home</Link>
          <span className="mn-sr-bc-sep">›</span>
          <Link to="/study-resources" className="mn-sr-bc-link highlight">Study Resources</Link>
          <span className="mn-sr-bc-sep">›</span>
          <span className="mn-sr-bc-item">Class {book.classLevel}</span>
          <span className="mn-sr-bc-sep">›</span>
          <span className="mn-sr-bc-item">{boardBadge}</span>
          <span className="mn-sr-bc-sep">›</span>
          <span className="mn-sr-bc-item">{book.subject}</span>
          <span className="mn-sr-bc-sep">›</span>
          <span className="mn-sr-bc-current">{book.title}</span>
        </nav>

        {/* ---------------------------------------------------------- */}
        {/* 2. BOOK HEADER BANNER (SAME VISUAL LANGUAGE)               */}
        {/* ---------------------------------------------------------- */}
        <section className="mn-sr-book-header-card">
          <div className="mn-sr-bh-left">
            <div className="mn-sr-bh-badges-row">
              <span className="mn-sr-bh-badge board">{boardBadge}</span>
              <span className="mn-sr-bh-badge class-badge">
                {isHindi ? `कक्षा ${book.classLevel}` : `Class ${book.classLevel}`}
              </span>
              <span className="mn-sr-bh-badge medium">{book.medium} Medium</span>
              <span className="mn-sr-bh-badge free-tag">⚡ 100% FREE</span>
            </div>

            <h1 className="mn-sr-bh-title">{book.title}</h1>
            <p className="mn-sr-bh-sub">
              {isHindi
                ? `कक्षा ${book.classLevel} · ${boardBadge} · ${book.medium} माध्यम · कुल ${totalChapters} अध्याय`
                : `Class ${book.classLevel} · ${boardBadge} · ${book.medium} Medium · ${totalChapters} Chapters`}
            </p>
            <p className="mn-sr-bh-desc">{book.description}</p>
          </div>

          <div className="mn-sr-bh-actions">
            <button
              type="button"
              className="mn-sr-bh-btn primary"
              onClick={handleReadCompleteBook}
            >
              📖 Read Complete Book
            </button>
            <button
              type="button"
              className="mn-sr-bh-btn secondary"
              onClick={handleDownloadBook}
            >
              ⬇️ Download Complete Book
            </button>
            <div className="mn-sr-bh-free-label">
              ✓ For You, For Free 🤗 • 100% Free
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------- */}
        {/* 3. MAIN 3-COLUMN LAYOUT: CHAPTERS LIST + RIGHT SIDEBAR      */}
        {/* ---------------------------------------------------------- */}
        <div className="mn-sr-main-layout" style={{ marginTop: 24 }}>

          {/* Left / Center Area: Search Bar & Chapter Cards */}
          <div className="mn-sr-center-content" style={{ gridColumn: 'span 2' }}>

            {/* Chapters Search & Sort Bar */}
            <div className="mn-sr-search-sort-row">
              <div className="mn-sr-search-bar" style={{ flex: 1 }}>
                <input
                  type="text"
                  className="mn-sr-search-input"
                  placeholder="Search chapters by title, keywords or topic..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <span className="mn-sr-search-icon">🔍</span>
              </div>

              <select
                className="mn-sr-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="asc">Chapter 01 to {totalChapters}</option>
                <option value="desc">Chapter {totalChapters} to 01</option>
                <option value="title">Chapter Title (A–Z)</option>
              </select>
            </div>

            {/* Section Heading */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '18px 0 14px' }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', margin: 0 }}>
                {isHindi ? 'सभी अध्याय (All Chapters)' : 'All Chapters'} ({processedChapters.length})
              </h2>
              <span style={{ fontSize: 12.5, color: '#059669', fontWeight: 800 }}>
                ✓ Free Online Reading &amp; Downloads
              </span>
            </div>

            {/* Chapter Cards List */}
            <div className="mn-sr-chapters-list">
              {processedChapters.map((ch) => {
                const code = formatChapterCode(ch.chapterNumber);
                return (
                  <div key={ch.id || ch.chapterNumber} className="mn-sr-chapter-card">
                    <div className="mn-sr-cc-header">
                      <div className="mn-sr-cc-left">
                        <span className="mn-sr-cc-number-badge">
                          Chapter {code}
                        </span>
                        <div>
                          <h3 className="mn-sr-cc-title">
                            <Link
                              to={`/study-resources/book/${book.id}/chapter/${ch.chapterNumber}`}
                              className="mn-sr-cc-title-link"
                            >
                              {ch.title}
                            </Link>
                          </h3>
                          {ch.description && (
                            <p className="mn-sr-cc-desc">{ch.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="mn-sr-cc-actions">
                        <button
                          type="button"
                          className="mn-sr-cc-btn read"
                          onClick={() => handleReadChapter(ch)}
                          title="Open official NCERT Chapter PDF in new tab"
                        >
                          📄 Open PDF ↗
                        </button>
                        <button
                          type="button"
                          className="mn-sr-cc-btn download"
                          onClick={() => handleReadChapter(ch)}
                          title="Download official NCERT Chapter PDF in new tab"
                        >
                          ⬇️ Download PDF ↗
                        </button>
                      </div>
                    </div>

                    {/* Resources Available Chips Bar */}
                    <div className="mn-sr-cc-resources-bar">
                      <span className="mn-sr-cc-res-label">Resources Available:</span>
                      <Link
                        to={`/study-resources/book/${book.id}/chapter/${ch.chapterNumber}`}
                        className="mn-sr-cc-chip textbook"
                      >
                        📖 Textbook
                      </Link>
                      <Link
                        to={`/study-resources/book/${book.id}/chapter/${ch.chapterNumber}`}
                        className="mn-sr-cc-chip notes"
                      >
                        📝 Notes
                      </Link>
                      <Link
                        to={`/study-resources/book/${book.id}/chapter/${ch.chapterNumber}`}
                        className="mn-sr-cc-chip solutions"
                      >
                        ✅ Solutions
                      </Link>
                      <Link
                        to={`/study-resources/book/${book.id}/chapter/${ch.chapterNumber}`}
                        className="mn-sr-cc-chip pyqs"
                      >
                        ❓ PYQs
                      </Link>
                      <Link
                        to={`/study-resources/book/${book.id}/chapter/${ch.chapterNumber}`}
                        className="mn-sr-cc-chip formulas"
                      >
                        📊 Formula Sheet
                      </Link>
                      <Link
                        to={`/study-resources/book/${book.id}/chapter/${ch.chapterNumber}`}
                        className="mn-sr-cc-view-all-link"
                      >
                        View All Resources →
                      </Link>
                    </div>
                  </div>
                );
              })}

              {processedChapters.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 20px', background: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: 44 }}>🔍</span>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: '12px 0 4px' }}>
                    No chapters found matching "{searchQuery}"
                  </h3>
                  <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 16px' }}>
                    Try searching with another keyword or chapter title.
                  </p>
                  <button
                    type="button"
                    className="mn-sr-clear-btn"
                    onClick={() => setSearchQuery('')}
                    style={{ fontSize: 13, cursor: 'pointer' }}
                  >
                    Clear Search
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* Right Sidebar */}
          <aside className="mn-sr-right-sidebar">
            <div className="mn-sr-why-card">
              <h3 className="mn-sr-why-title">Why Learn with MentorNearby?</h3>
              <div className="mn-sr-why-item">
                <div className="mn-sr-why-icon-wrap orange">📚</div>
                <div>
                  <h4 className="mn-sr-why-h4">Complete Coverage</h4>
                  <p className="mn-sr-why-desc">Books, PYQs, Notes &amp; Solutions for all boards.</p>
                </div>
              </div>
              <div className="mn-sr-why-item">
                <div className="mn-sr-why-icon-wrap blue">🌐</div>
                <div>
                  <h4 className="mn-sr-why-h4">Bilingual Support</h4>
                  <p className="mn-sr-why-desc">English &amp; Hindi Medium resources available.</p>
                </div>
              </div>
              <div className="mn-sr-why-item">
                <div className="mn-sr-why-icon-wrap green">📖</div>
                <div>
                  <h4 className="mn-sr-why-h4">Read Online Free</h4>
                  <p className="mn-sr-why-desc">Read any book or chapter completely FREE.</p>
                </div>
              </div>
              <div className="mn-sr-why-item">
                <div className="mn-sr-why-icon-wrap purple">⬇️</div>
                <div>
                  <h4 className="mn-sr-why-h4">Download Free</h4>
                  <p className="mn-sr-why-desc">Download PDF for offline study.</p>
                </div>
              </div>
            </div>

            <div className="mn-sr-friendly-card">
              <div style={{ fontSize: 28, marginBottom: 6 }}>🤗</div>
              <h4 className="mn-sr-friendly-title">For You, For Free</h4>
              <p className="mn-sr-friendly-sub">
                All resources are <strong>100% FREE</strong> for every student.
              </p>
            </div>
          </aside>

        </div>

        {/* ---------------------------------------------------------- */}
        {/* 4. BOTTOM TRUST STRIP                                       */}
        {/* ---------------------------------------------------------- */}
        <section className="mn-sr-bottom-strip" style={{ marginTop: 40 }}>
          <div className="mn-sr-trust-item">
            <div className="mn-sr-trust-icon">🛡️</div>
            <div>
              <h4 className="mn-sr-trust-title">100% Quality Content</h4>
              <p className="mn-sr-trust-desc">Official books, PYQs &amp; study material.</p>
            </div>
          </div>
          <div className="mn-sr-trust-item">
            <div className="mn-sr-trust-icon">🎯</div>
            <div>
              <h4 className="mn-sr-trust-title">Board Aligned</h4>
              <p className="mn-sr-trust-desc">CBSE, ICSE &amp; UP Board latest syllabus.</p>
            </div>
          </div>
          <div className="mn-sr-trust-highlight">
            <h3 className="mn-sr-trust-hl-title">Everything Here is FREE!</h3>
            <p className="mn-sr-trust-hl-desc">Read Free. Download Free. Learn Free.</p>
          </div>
          <div className="mn-sr-trust-item">
            <div className="mn-sr-trust-icon">🔒</div>
            <div>
              <h4 className="mn-sr-trust-title">Safe &amp; Secure</h4>
              <p className="mn-sr-trust-desc">Secure downloads &amp; protected data.</p>
            </div>
          </div>
          <div className="mn-sr-trust-item">
            <div className="mn-sr-trust-icon">📱</div>
            <div>
              <h4 className="mn-sr-trust-title">Learn Anytime, Anywhere</h4>
              <p className="mn-sr-trust-desc">Access on mobile, tablet or desktop.</p>
            </div>
          </div>
        </section>

      </div>

      {/* In-Browser PDF Reader Modal */}
      {viewerData.isOpen && (
        <StudyResourceViewerModal
          isOpen={viewerData.isOpen}
          onClose={() => setViewerData({ isOpen: false, resource: null, resourceId: null })}
          resourceId={viewerData.resourceId}
          resource={viewerData.resource}
          initialResource={viewerData.resource}
        />
      )}
    </div>
  );
};

export default BookChaptersPage;
