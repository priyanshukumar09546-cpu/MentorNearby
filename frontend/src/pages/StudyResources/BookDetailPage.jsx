// ============================================================
// pages/StudyResources/BookDetailPage.jsx
// MentorNearby Dedicated Book Detail & In-Browser Reader Page
// Complete Chapter-Wise Syllabus, Metadata & 100% Free Access
// ============================================================

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { OFFICIAL_NCERT_BOOKS, getNcertPdfUrl } from '../../data/officialNcertBooksCatalog';
import { OFFICIAL_STUDY_RESOURCES } from '../../data/officialStudyCatalog';
import { searchStudyResources } from '../../api/studyResources';
import StudyResourceViewerModal from '../../components/studyResources/StudyResourceViewerModal';
import './StudyResources.css';

const BookDetailPage = () => {
  const { id, slug, classLevel: routeClass, board: routeBoard } = useParams();
  const navigate = useNavigate();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewerData, setViewerData] = useState({
    isOpen: false,
    resource: null,
    resourceId: null,
  });

  // Find book from official catalog or backend API
  useEffect(() => {
    const fetchBook = async () => {
      setLoading(true);
      const identifier = id || slug;

      // 1. Check official NCERT catalog first
      let officialMatch = OFFICIAL_NCERT_BOOKS.find(
        (b) => b.id === identifier || b.slug === identifier || b.ncertCode === identifier
      );

      if (!officialMatch) {
        officialMatch = OFFICIAL_STUDY_RESOURCES.find(
          (b) => b.id === identifier || b.id === id || b.title?.toLowerCase().includes((slug || '').toLowerCase())
        );
      }

      if (officialMatch) {
        setBook(officialMatch);
        setLoading(false);
        return;
      }

      // 2. Fetch from backend API
      try {
        const res = await searchStudyResources({ q: identifier, limit: 1 });
        const list = res.data?.resources || res.resources || [];
        if (list.length > 0) {
          const item = list[0];
          setBook({
            ...item,
            id: item._id || item.id,
            chaptersCount: item.chaptersCount || 15,
            chapters: item.chapters?.length ? item.chapters : [
              { id: 'ch1', chapterNumber: 1, title: item.chapterTitle || 'Chapter 1: Overview & Notes', officialUrl: item.fileUrl }
            ],
            sourceName: 'MentorNearby Study Portal',
          });
        }
      } catch (err) {
        console.error('Failed to load book detail:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [id, slug]);

  // Read Online in-browser handler
  const handleReadOnline = () => {
    if (!book) return;
    setViewerData({
      isOpen: true,
      resource: {
        _id: book.id || book._id,
        id: book.id || book._id,
        title: book.title,
        classLevel: book.classLevel,
        subject: book.subject,
        fileUrl: book.officialBookUrl || `/api/study-resources/stream/${book.id}`,
        fileReference: {
          filename: `${(book.title || 'book').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`,
          fileSize: 1048576,
        },
        downloadPrice: 0,
        isDownloadUnlocked: true,
        isFree: true,
      },
      resourceId: book.id || book._id,
    });
  };

  // Direct Free Download
  const handleFreeDownload = () => {
    if (!book) return;
    const cleanFileName = `${(book.title || 'study-material').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
    const streamUrl = `/api/study-resources/stream/${book.id}?download=true`;
    const backendBase = (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.trim())
      ? import.meta.env.VITE_API_URL.trim().replace(/\/api$/, '')
      : (typeof window !== 'undefined' ? window.location.origin : 'https://mentornearby-2.onrender.com');
    const finalUrl = `${backendBase}${streamUrl}`;

    window.open(finalUrl, '_blank');
  };

  // Open Official Source in new tab
  const handleOpenOfficialLink = (url) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  if (loading) {
    return (
      <div className="mn-sr-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 44, height: 44, border: '4px solid #CBD5E1', borderTopColor: '#D97706', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }}></div>
          <p style={{ color: '#64748B', fontWeight: 600 }}>Loading educational resource...</p>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="mn-sr-page" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <span style={{ fontSize: 44 }}>📚</span>
        <h2 style={{ color: '#0F172A', margin: '14px 0 8px' }}>Resource Not Found</h2>
        <p style={{ color: '#64748B', marginBottom: 24 }}>The book or study resource you are looking for is currently unavailable.</p>
        <Link to="/study-resources" className="mn-sr-apply-btn" style={{ display: 'inline-flex', width: 'auto', padding: '0 24px', height: 40, textDecoration: 'none', alignItems: 'center' }}>
          ← Back to All Study Resources
        </Link>
      </div>
    );
  }

  const isHindi = book.medium === 'Hindi';
  const boardBadge = book.board === 'UP_BOARD_ENGLISH' ? 'UP Board (EM)' : (book.board === 'UP_BOARD_HINDI' ? 'UP Board (HM)' : book.board);
  const chapters = book.chapters || [];

  return (
    <div className="mn-sr-page">
      <div className="mn-sr-container" style={{ paddingTop: 20 }}>
        
        {/* Breadcrumb Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#64748B', marginBottom: 18, flexWrap: 'wrap' }}>
          <Link to="/" style={{ color: '#64748B', textDecoration: 'none' }}>Home</Link>
          <span>›</span>
          <Link to="/study-resources" style={{ color: '#D97706', textDecoration: 'none', fontWeight: 700 }}>Study Resources</Link>
          <span>›</span>
          <span>{boardBadge}</span>
          <span>›</span>
          <span>Class {book.classLevel}</span>
          <span>›</span>
          <span style={{ color: '#0F172A', fontWeight: 600 }}>{book.subject}</span>
        </div>

        {/* Book Hero Card */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 16,
            padding: '32px',
            marginBottom: 28,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
            display: 'grid',
            gridTemplateColumns: '260px 1fr',
            gap: 32,
            alignItems: 'start',
          }}
        >
          {/* Left: Large Thematic Book Cover */}
          <div
            style={{
              background: 'linear-gradient(135deg, #064E3B 0%, #047857 100%)',
              borderRadius: 12,
              padding: 24,
              color: '#FFFFFF',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: 320,
              boxShadow: '0 8px 24px rgba(6, 78, 59, 0.25)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ background: 'rgba(0,0,0,0.3)', padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 800 }}>
                {boardBadge}
              </span>
              <span style={{ background: 'rgba(255,255,255,0.2)', padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 800 }}>
                Class {book.classLevel}
              </span>
            </div>

            <div style={{ textAlign: 'center', margin: 'auto 0' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#FCD34D', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
                OFFICIAL BOOK
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0, textTransform: 'uppercase', lineHeight: 1.2 }}>
                {book.subject}
              </h2>
              <div style={{ fontSize: 13, opacity: 0.9, marginTop: 4 }}>
                {book.medium} Medium
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
              <span>📐 {chapters.length || book.chaptersCount} Chapters</span>
              <span>100% FREE</span>
            </div>
          </div>

          {/* Right: Book Details & Actions */}
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              <span style={{ background: '#D97706', color: '#FFF', fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 4 }}>
                {boardBadge}
              </span>
              <span style={{ background: '#2563EB', color: '#FFF', fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 4 }}>
                {isHindi ? `कक्षा ${book.classLevel}` : `Class ${book.classLevel}`}
              </span>
              <span style={{ background: '#059669', color: '#FFF', fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 4 }}>
                {book.medium} Medium
              </span>
              <span style={{ background: '#FEF3C7', color: '#92400E', fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 4 }}>
                ⚡ 100% FREE
              </span>
            </div>

            <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', margin: '0 0 12px', lineHeight: 1.3 }}>
              {book.title}
            </h1>

            <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, margin: '0 0 20px' }}>
              {book.description}
            </p>

            {/* Metadata Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 16,
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 10,
                padding: '14px 18px',
                marginBottom: 24,
                fontSize: 12.5,
              }}
            >
              <div>
                <span style={{ color: '#64748B', display: 'block', marginBottom: 2 }}>Publisher</span>
                <strong style={{ color: '#0F172A' }}>{book.sourceName || 'NCERT / State Board'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', marginBottom: 2 }}>Language</span>
                <strong style={{ color: '#0F172A' }}>{book.medium || 'English'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', marginBottom: 2 }}>Total Chapters</span>
                <strong style={{ color: '#0F172A' }}>{chapters.length || book.chaptersCount || 15} Chapters</strong>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleReadOnline}
                style={{
                  height: 42,
                  background: '#059669',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 8,
                  padding: '0 22px',
                  fontSize: 13.5,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)',
                }}
              >
                <span>📖</span>
                <span>Read Online FREE</span>
              </button>

              <button
                type="button"
                onClick={handleFreeDownload}
                style={{
                  height: 42,
                  background: '#FFFFFF',
                  border: '1.5px solid #D97706',
                  color: '#D97706',
                  borderRadius: 8,
                  padding: '0 20px',
                  fontSize: 13.5,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>⬇️</span>
                <span>Download FREE</span>
              </button>

              {book.officialBookUrl && (
                <button
                  type="button"
                  onClick={() => handleOpenOfficialLink(book.officialBookUrl)}
                  style={{
                    height: 42,
                    background: '#2563EB',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 8,
                    padding: '0 18px',
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span>🌐</span>
                  <span>Official Portal ↗</span>
                </button>
              )}
            </div>

            <div style={{ fontSize: 11.5, color: '#059669', fontWeight: 700, marginTop: 12 }}>
              ✓ For You, For Free 🤗 • 100% Free Educational Access
            </div>
          </div>
        </div>

        {/* Chapter-Level Index */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, padding: '28px 32px', marginBottom: 40 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', margin: '0 0 4px' }}>
                {isHindi ? 'अध्याय अनुक्रमणिका (Chapter Index)' : 'Table of Contents & Chapters'}
              </h2>
              <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
                Read any individual chapter online or open the official board text.
              </p>
            </div>

            <span style={{ fontSize: 12, fontWeight: 700, color: '#059669', background: '#D1FAE5', padding: '4px 10px', borderRadius: 6 }}>
              {chapters.length} Chapters Available
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {chapters.map((ch) => (
              <div
                key={ch.id || ch.chapterNumber}
                style={{
                  border: '1px solid #E2E8F0',
                  borderRadius: 10,
                  padding: '14px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  background: '#FFFFFF',
                  transition: 'border-color 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 8,
                      background: '#FEF3C7',
                      color: '#92400E',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      fontWeight: 900,
                      flexShrink: 0,
                    }}
                  >
                    {ch.chapterNumber}
                  </span>

                  <div>
                    <span style={{ fontSize: 11, color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                      {isHindi ? `अध्याय ${ch.chapterNumber}` : `Chapter ${ch.chapterNumber}`}
                    </span>
                    <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', margin: '2px 0 0' }}>
                      {ch.title}
                    </h3>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => handleOpenOfficialLink(ch.pdfUrl || ch.directPdfUrl || ch.officialChapterUrl || (book.ncertCode ? getNcertPdfUrl(book.ncertCode, ch.chapterNumber) : (ch.officialUrl || book.officialBookUrl)))}
                    style={{
                      height: 32,
                      background: '#EA580C',
                      border: 'none',
                      color: '#FFFFFF',
                      borderRadius: 6,
                      padding: '0 14px',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      boxShadow: '0 2px 6px rgba(234, 88, 12, 0.25)',
                    }}
                    title="Open official NCERT Chapter PDF in new tab"
                  >
                    <span>📄</span>
                    <span>Open PDF ↗</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

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

export default BookDetailPage;
