// ============================================================
// pages/StudyResources/BookReaderPage.jsx
// MentorNearby Dedicated NCERT Chapter Navigator
// Real NCERT Chapter-by-Chapter PDFs • Direct Official NCERT Links
// ============================================================

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { OFFICIAL_NCERT_BOOKS, formatChapterCode, getNcertPdfUrl } from '../../data/officialNcertBooksCatalog';
import { OFFICIAL_STUDY_RESOURCES } from '../../data/officialStudyCatalog';
import { searchStudyResources } from '../../api/studyResources';
import StudyResourceViewerModal from '../../components/studyResources/StudyResourceViewerModal';
import './BookReader.css';

const BookReaderPage = () => {
  const { bookId } = useParams();
  const navigate = useNavigate();

  // Book & Chapters State
  const [currentBook, setCurrentBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chapterSearch, setChapterSearch] = useState('');

  // In-App Document Viewer State
  const [viewerData, setViewerData] = useState({
    isOpen: false,
    resource: null,
  });

  // Load Book Details
  useEffect(() => {
    let found = OFFICIAL_NCERT_BOOKS.find(
      (b) => b.id === bookId || b.slug === bookId || b.ncertCode === bookId
    );

    if (!found) {
      found = OFFICIAL_STUDY_RESOURCES.find(
        (b) => b.id === bookId || b.slug === bookId || b._id === bookId
      );
    }

    if (!found && bookId) {
      const lower = bookId.toLowerCase();
      found = OFFICIAL_NCERT_BOOKS.find((b) =>
        lower.includes(b.classLevel) &&
        (lower.includes(b.subject.toLowerCase()) || (b.ncertCode && lower.includes(b.ncertCode)))
      );
    }

    if (found) {
      setCurrentBook(found);
      setLoading(false);
    } else {
      searchStudyResources({ limit: 100 })
        .then((res) => {
          const list = res.data?.resources || res.resources || [];
          const dbFound = list.find((item) => item._id === bookId || item.id === bookId || item.slug === bookId);
          if (dbFound) {
            setCurrentBook({
              ...dbFound,
              chaptersCount: dbFound.chaptersCount || 12,
              chapters: dbFound.chapters || [],
            });
          } else {
            setCurrentBook(OFFICIAL_NCERT_BOOKS[0]);
          }
          setLoading(false);
        })
        .catch(() => {
          setCurrentBook(OFFICIAL_NCERT_BOOKS[0]);
          setLoading(false);
        });
    }
  }, [bookId]);

  // Chapters List
  const chaptersList = useMemo(() => {
    if (!currentBook) return [];
    const list = currentBook.chapters && currentBook.chapters.length > 0
      ? currentBook.chapters
      : Array.from({ length: currentBook.chaptersCount || 12 }).map((_, i) => ({
          chapterNumber: i + 1,
          title: `Chapter ${i + 1}`,
          officialChapterUrl: `https://ncert.nic.in/textbook.php?${currentBook.ncertCode || 'iemh1'}=${i + 1}-${currentBook.chaptersCount || 12}`,
          directPdfUrl: `https://ncert.nic.in/textbook/pdf/${currentBook.ncertCode || 'iemh1'}${formatChapterCode(i + 1)}.pdf`,
        }));

    if (!chapterSearch.trim()) return list;
    const q = chapterSearch.toLowerCase();
    return list.filter(
      (ch) =>
        ch.title?.toLowerCase().includes(q) ||
        `chapter ${ch.chapterNumber}`.includes(q) ||
        `ch ${ch.chapterNumber}`.includes(q)
    );
  }, [currentBook, chapterSearch]);

  // Helper: Open Official NCERT Portal for the Full Book
  const handleOpenFullBookNcert = () => {
    const targetUrl = currentBook?.officialBookUrl || currentBook?.officialNcertUrl || `https://ncert.nic.in/textbook.php?${currentBook?.ncertCode || 'iemh1'}=0-${currentBook?.chaptersCount || 12}`;
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  // Helper: Open Specific Chapter inside In-App PDF Reader
  const handleOpenChapter = (ch) => {
    const targetUrl = ch.pdfUrl || ch.directPdfUrl || ch.officialChapterUrl || (currentBook?.ncertCode ? getNcertPdfUrl(currentBook.ncertCode, ch.chapterNumber) : null);
    if (targetUrl) {
      setViewerData({
        isOpen: true,
        resource: {
          title: `${currentBook?.title || 'NCERT Book'} — Chapter ${ch.chapterNumber}: ${ch.title}`,
          fileUrl: targetUrl,
          type: 'PDF',
          classLevel: currentBook?.classLevel,
          subject: currentBook?.subject,
          isFree: true,
        },
      });
    }
  };

  if (loading || !currentBook) {
    return (
      <div className="mn-reader-loading-wrap">
        <div className="mn-reader-spinner" />
        <p>Loading Official NCERT Book Chapters...</p>
      </div>
    );
  }

  const bookTitle = currentBook.title || 'Official NCERT Textbook';
  const classText = `Class ${currentBook.classLevel || '9'}`;
  const subjectText = currentBook.subject || 'Mathematics';
  const mediumText = currentBook.medium === 'Hindi' ? 'Hindi Medium' : 'English Medium';

  return (
    <div className="mn-reader-page">

      {/* Header */}
      <header className="mn-reader-header">
        <div className="mn-reader-header-left">
          <button
            type="button"
            className="mn-reader-back-btn"
            onClick={() => navigate('/book-bank')}
            title="Return to Book Bank"
          >
            ← Back to Book Bank
          </button>

          <div className="mn-reader-title-box">
            <h1 className="mn-reader-book-title">{bookTitle}</h1>
            <nav className="mn-reader-breadcrumbs" aria-label="Breadcrumb">
              <Link to="/">Home</Link>
              <span>›</span>
              <Link to="/book-bank">Book Bank</Link>
              <span>›</span>
              <span>{classText}</span>
              <span>›</span>
              <span>{subjectText}</span>
              <span>›</span>
              <span className="current">{mediumText}</span>
            </nav>
          </div>
        </div>

        <div className="mn-reader-header-actions">
          <button
            type="button"
            className="mn-reader-header-btn download"
            onClick={handleOpenFullBookNcert}
            title="Open complete official NCERT textbook in new tab"
            style={{
              background: '#EA580C',
              color: '#FFFFFF',
              border: 'none',
              fontWeight: 800,
            }}
          >
            ↗ Open Full NCERT Book
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div style={{ maxWidth: '1100px', margin: '30px auto', padding: '0 20px', width: '100%' }}>

        {/* Hero Info Banner */}
        <div
          style={{
            background: '#1E293B',
            borderRadius: '16px',
            padding: '28px 32px',
            border: '1px solid #334155',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            color: '#FFFFFF',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span
                style={{
                  background: 'rgba(234, 88, 12, 0.25)',
                  color: '#FB923C',
                  border: '1px solid rgba(234, 88, 12, 0.4)',
                  padding: '3px 10px',
                  borderRadius: '16px',
                  fontSize: '11.5px',
                  fontWeight: '800',
                }}
              >
                🏛️ OFFICIAL NCERT
              </span>
              <span style={{ color: '#94A3B8', fontSize: '13px', fontWeight: '700' }}>
                {classText} • {subjectText} • {mediumText}
              </span>
            </div>

            <h2 style={{ fontSize: '24px', fontWeight: '900', margin: '0 0 6px', color: '#FFFFFF' }}>
              NCERT {subjectText} — {classText}
            </h2>

            <p style={{ color: '#CBD5E1', fontSize: '14px', margin: 0, maxWidth: '650px', lineHeight: 1.5 }}>
              {currentBook.description}
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenFullBookNcert}
            style={{
              background: '#EA580C',
              color: '#FFF',
              border: 'none',
              borderRadius: '10px',
              padding: '12px 22px',
              fontSize: '14px',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(234, 88, 12, 0.35)',
            }}
          >
            <span>📚</span>
            <span>Open Complete NCERT Book ↗</span>
          </button>
        </div>

        {/* Chapter List Card */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            padding: '28px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                📑 Chapters ({chaptersList.length})
              </h3>
              <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0' }}>
                Click "Read Chapter Online" on any chapter to open the official NCERT PDF directly.
              </p>
            </div>

            <input
              type="text"
              placeholder="Search chapters..."
              value={chapterSearch}
              onChange={(e) => setChapterSearch(e.target.value)}
              style={{
                padding: '9px 16px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '13.5px',
                outline: 'none',
                minWidth: '220px',
              }}
            />
          </div>

          {/* Chapters Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {chaptersList.map((ch) => (
              <div
                key={ch.chapterNumber}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
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
                      width: '38px',
                      height: '38px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13.5px',
                      fontWeight: '800',
                      flexShrink: 0,
                    }}
                  >
                    {formatChapterCode(ch.chapterNumber)}
                  </div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: '800', color: '#0F172A' }}>
                      Chapter {ch.chapterNumber} — {ch.title}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                      Official NCERT Textbook Chapter • {subjectText}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenChapter(ch)}
                  style={{
                    background: '#EA580C',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontSize: '13.5px',
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
                  title="Open official NCERT Chapter PDF in new tab"
                >
                  <span>📄</span>
                  <span>Open PDF ↗</span>
                </button>
              </div>
            ))}
          </div>

        </div>

      </div>

      {/* In-App Dedicated PDF Reader Modal */}
      {viewerData.isOpen && (
        <StudyResourceViewerModal
          isOpen={viewerData.isOpen}
          onClose={() => setViewerData({ isOpen: false, resource: null })}
          resource={viewerData.resource}
        />
      )}

    </div>
  );
};

export default BookReaderPage;
