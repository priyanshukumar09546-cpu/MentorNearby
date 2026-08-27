// ============================================================
// pages/StudyResources/ChapterDetailPage.jsx
// MentorNearby Dedicated Chapter Resources Detail Page
// Hierarchy: Class → Board → Medium → Subject → Book → Chapter → Resources
// (Textbook, Notes, Solutions, PYQs, Formula Sheet, Practice)
// ============================================================

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { OFFICIAL_NCERT_BOOKS, getNcertPdfUrl } from '../../data/officialNcertBooksCatalog';
import { OFFICIAL_STUDY_RESOURCES, formatChapterCode } from '../../data/officialStudyCatalog';
import { searchStudyResources } from '../../api/studyResources';
import StudyResourceViewerModal from '../../components/studyResources/StudyResourceViewerModal';
import './StudyResources.css';

const ChapterDetailPage = () => {
  const { bookId, chapterNumber } = useParams();
  const navigate = useNavigate();

  const chNum = Number(chapterNumber) || 1;
  const [book, setBook] = useState(null);
  const [chapter, setChapter] = useState(null);
  const [loading, setLoading] = useState(true);

  // In-Browser PDF Reader Modal
  const [viewerData, setViewerData] = useState({
    isOpen: false,
    resource: null,
    resourceId: null,
  });

  // Load Book & Specific Chapter
  useEffect(() => {
    const fetchChapterData = async () => {
      setLoading(true);
      // 1. Check official NCERT catalog
      let official = OFFICIAL_NCERT_BOOKS.find(
        (b) => b.id === bookId || b.slug === bookId || b.ncertCode === bookId
      );

      if (!official) {
        official = OFFICIAL_STUDY_RESOURCES.find(
          (b) => b.id === bookId || b.slug === bookId
        );
      }

      if (official) {
        setBook(official);
        const ch = official.chapters?.find((c) => Number(c.chapterNumber) === chNum) || official.chapters?.[0] || {
          chapterNumber: chNum,
          chapterName: `Chapter ${chNum}`,
          title: `Chapter ${chNum}`,
          pdfUrl: getNcertPdfUrl(official.ncertCode, chNum),
          source: 'NCERT Official',
        };
        setChapter(ch);
        setLoading(false);
        return;
      }

      // 2. Check Backend API
      try {
        const res = await searchStudyResources({ q: bookId, limit: 1 });
        const list = res.data?.resources || res.resources || [];
        if (list.length > 0) {
          const b = list[0];
          setBook(b);
          setChapter({
            id: `ch${chNum}`,
            chapterNumber: chNum,
            chapterCode: formatChapterCode(chNum),
            title: b.chapterTitle || `Chapter ${formatChapterCode(chNum)}: Overview & Core Concepts`,
            description: b.description || 'Comprehensive study resource with notes, solutions, and practice problems.',
            officialUrl: b.fileUrl,
            resources: {
              textbook: { title: 'Chapter Textbook', url: b.fileUrl },
              notes: { title: 'Revision Notes', url: b.fileUrl },
              solutions: { title: 'Model Solutions', url: b.fileUrl },
              pyqs: { title: '10 Years PYQs', url: b.fileUrl },
              formulaSheet: { title: 'Formula Sheet', url: b.fileUrl },
            },
          });
        }
      } catch (err) {
        console.error('Failed to load chapter resources:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchChapterData();
  }, [bookId, chNum]);

  // Open Dedicated In-App PDF Reader
  const handleOpenReader = (resTitle, customUrl) => {
    const targetUrl = customUrl || chapter?.pdfUrl || chapter?.directPdfUrl || chapter?.officialChapterUrl || chapter?.officialUrl || (book?.ncertCode ? getNcertPdfUrl(book.ncertCode, chNum) : book?.officialBookUrl);
    if (targetUrl) {
      setViewerData({
        isOpen: true,
        resource: {
          title: `${book?.title || 'NCERT Book'} — ${resTitle || chapter?.title || `Chapter ${chNum}`}`,
          fileUrl: targetUrl,
          type: 'PDF',
          classLevel: book?.classLevel,
          subject: book?.subject,
          isFree: true,
        },
        resourceId: book?._id || book?.id,
      });
    }
  };

  // Direct Download Official NCERT Resource
  const handleDownloadResource = (resTitle, customUrl) => {
    const targetUrl = customUrl || chapter?.pdfUrl || chapter?.directPdfUrl || chapter?.officialChapterUrl || chapter?.officialUrl || (book?.ncertCode ? getNcertPdfUrl(book.ncertCode, chNum) : book?.officialBookUrl);
    if (targetUrl) {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  if (loading) {
    return (
      <div className="mn-sr-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 44, height: 44, border: '4px solid #CBD5E1', borderTopColor: '#D97706', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }}></div>
          <p style={{ color: '#64748B', fontWeight: 700 }}>Loading Chapter Resources...</p>
        </div>
      </div>
    );
  }

  if (!book || !chapter) {
    return (
      <div className="mn-sr-page" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <span style={{ fontSize: 48 }}>📖</span>
        <h2 style={{ color: '#0F172A', margin: '14px 0 8px' }}>Chapter Not Found</h2>
        <p style={{ color: '#64748B', marginBottom: 24 }}>The chapter resources you requested could not be located.</p>
        <Link to="/study-resources" className="mn-sr-apply-btn" style={{ display: 'inline-flex', width: 'auto', padding: '0 24px', height: 40, textDecoration: 'none', alignItems: 'center' }}>
          ← Back to All Books
        </Link>
      </div>
    );
  }

  const code = formatChapterCode(chNum);
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
          <span className="mn-sr-bc-item">{book.subject}</span>
          <span className="mn-sr-bc-sep">›</span>
          <Link to={`/study-resources/book/${book.id}`} className="mn-sr-bc-link">
            {book.shortTitle || book.title}
          </Link>
          <span className="mn-sr-bc-sep">›</span>
          <span className="mn-sr-bc-current">Chapter {code}: {chapter.title}</span>
        </nav>

        {/* ---------------------------------------------------------- */}
        {/* 2. CHAPTER HEADER BANNER                                    */}
        {/* ---------------------------------------------------------- */}
        <section className="mn-sr-chapter-header-card">
          <div className="mn-sr-ch-left">
            <div className="mn-sr-bh-badges-row">
              <span className="mn-sr-bh-badge board">{boardBadge}</span>
              <span className="mn-sr-bh-badge class-badge">
                {isHindi ? `कक्षा ${book.classLevel}` : `Class ${book.classLevel}`}
              </span>
              <span className="mn-sr-bh-badge medium">{book.medium} Medium</span>
              <span className="mn-sr-bh-badge free-tag">⚡ 100% FREE</span>
            </div>

            <div className="mn-sr-ch-sub-title">
              {isHindi ? `अध्याय ${code}` : `Chapter ${code}`}
            </div>
            <h1 className="mn-sr-ch-title">{chapter.title}</h1>
            <p className="mn-sr-ch-context">
              Class {book.classLevel} · {boardBadge} · {book.title}
            </p>
            {chapter.description && (
              <p className="mn-sr-ch-desc">{chapter.description}</p>
            )}
          </div>

          <div className="mn-sr-ch-right-nav">
            <div className="mn-sr-ch-nav-box">
              <div className="mn-sr-ch-nav-label">Chapter Navigation</div>
              <div className="mn-sr-ch-nav-btns">
                <button
                  type="button"
                  className="mn-sr-ch-prev-next-btn"
                  disabled={chNum <= 1}
                  onClick={() => navigate(`/study-resources/book/${book.id}/chapter/${chNum - 1}`)}
                >
                  ← Prev
                </button>
                <span className="mn-sr-ch-curr-indicator">
                  {code} / {formatChapterCode(totalChapters)}
                </span>
                <button
                  type="button"
                  className="mn-sr-ch-prev-next-btn"
                  disabled={chNum >= totalChapters}
                  onClick={() => navigate(`/study-resources/book/${book.id}/chapter/${chNum + 1}`)}
                >
                  Next →
                </button>
              </div>
              <Link
                to={`/study-resources/book/${book.id}`}
                className="mn-sr-ch-all-chapters-link"
              >
                View All {totalChapters} Chapters
              </Link>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------- */}
        {/* 3. CHAPTER RESOURCES GRID (6 CORE RESOURCES)                */}
        {/* ---------------------------------------------------------- */}
        <div className="mn-sr-section-title-row">
          <h2 className="mn-sr-section-h2">
            Available Study Materials &amp; Resources
          </h2>
          <span className="mn-sr-section-badge">
            ✓ 100% Free • Read Online &amp; Download
          </span>
        </div>

        <div className="mn-sr-resource-cards-grid">

          {/* 1. 📖 Textbook Card */}
          <div className="mn-sr-resource-card textbook-card">
            <div className="mn-sr-rc-header">
              <span className="mn-sr-rc-icon">📖</span>
              <div>
                <span className="mn-sr-rc-tag">OFFICIAL TEXTBOOK</span>
                <h3 className="mn-sr-rc-title">NCERT / Board Textbook</h3>
              </div>
            </div>
            <p className="mn-sr-rc-desc">
              Complete chapter text including illustrations, in-text examples, definitions, and chapter-end exercises.
            </p>
            <div className="mn-sr-rc-actions">
              <button
                type="button"
                className="mn-sr-rc-btn read"
                onClick={() => handleOpenReader('Textbook', chapter.resources?.textbook?.url || chapter.officialUrl)}
              >
                📖 Read Chapter
              </button>
              <button
                type="button"
                className="mn-sr-rc-btn download"
                onClick={() => handleDownloadResource('Textbook', chapter.resources?.textbook?.url || chapter.officialUrl)}
              >
                ⬇️ Download PDF
              </button>
            </div>
          </div>

          {/* 2. 📝 Notes Card */}
          <div className="mn-sr-resource-card notes-card">
            <div className="mn-sr-rc-header">
              <span className="mn-sr-rc-icon">📝</span>
              <div>
                <span className="mn-sr-rc-tag">REVISION NOTES</span>
                <h3 className="mn-sr-rc-title">Chapter Revision Notes</h3>
              </div>
            </div>
            <p className="mn-sr-rc-desc">
              Concise summary notes, key concept explanations, derivations, and quick revision bullet points.
            </p>
            <div className="mn-sr-rc-actions">
              <button
                type="button"
                className="mn-sr-rc-btn read"
                onClick={() => handleOpenReader('Revision Notes', chapter.resources?.notes?.url)}
              >
                📖 Read Notes
              </button>
              <button
                type="button"
                className="mn-sr-rc-btn download"
                onClick={() => handleDownloadResource('Revision Notes', chapter.resources?.notes?.url)}
              >
                ⬇️ Download PDF
              </button>
            </div>
          </div>

          {/* 3. ✅ Solutions Card */}
          <div className="mn-sr-resource-card solutions-card">
            <div className="mn-sr-rc-header">
              <span className="mn-sr-rc-icon">✅</span>
              <div>
                <span className="mn-sr-rc-tag">STEP-BY-STEP</span>
                <h3 className="mn-sr-rc-title">NCERT &amp; Board Solutions</h3>
              </div>
            </div>
            <p className="mn-sr-rc-desc">
              Comprehensive step-by-step solved exercise problems with detailed explanations and diagrammatic proofs.
            </p>
            <div className="mn-sr-rc-actions">
              <button
                type="button"
                className="mn-sr-rc-btn read"
                onClick={() => handleOpenReader('Solutions', chapter.resources?.solutions?.url)}
              >
                ✅ View Solutions
              </button>
              <button
                type="button"
                className="mn-sr-rc-btn download"
                onClick={() => handleDownloadResource('Solutions', chapter.resources?.solutions?.url)}
              >
                ⬇️ Download PDF
              </button>
            </div>
          </div>

          {/* 4. ❓ PYQs Card */}
          <div className="mn-sr-resource-card pyq-card">
            <div className="mn-sr-rc-header">
              <span className="mn-sr-rc-icon">❓</span>
              <div>
                <span className="mn-sr-rc-tag">10 YEARS SOLVED</span>
                <h3 className="mn-sr-rc-title">Previous Year Questions</h3>
              </div>
            </div>
            <p className="mn-sr-rc-desc">
              Chapter-wise 10-year board examination question bank with official marking scheme solutions.
            </p>
            <div className="mn-sr-rc-actions">
              <button
                type="button"
                className="mn-sr-rc-btn read"
                onClick={() => handleOpenReader('PYQs', chapter.resources?.pyqs?.url)}
              >
                ❓ Practice PYQs
              </button>
              <button
                type="button"
                className="mn-sr-rc-btn download"
                onClick={() => handleDownloadResource('PYQs', chapter.resources?.pyqs?.url)}
              >
                ⬇️ Download PDF
              </button>
            </div>
          </div>

          {/* 5. 📊 Formula Sheet Card */}
          <div className="mn-sr-resource-card formula-card">
            <div className="mn-sr-rc-header">
              <span className="mn-sr-rc-icon">📊</span>
              <div>
                <span className="mn-sr-rc-tag">HIGH-YIELD</span>
                <h3 className="mn-sr-rc-title">Formula Sheet &amp; Maps</h3>
              </div>
            </div>
            <p className="mn-sr-rc-desc">
              All essential mathematical and scientific formulas, identities, constants, and theorem maps in one place.
            </p>
            <div className="mn-sr-rc-actions">
              <button
                type="button"
                className="mn-sr-rc-btn read"
                onClick={() => handleOpenReader('Formula Sheet', chapter.resources?.formulaSheet?.url)}
              >
                📊 View Formula Sheet
              </button>
              <button
                type="button"
                className="mn-sr-rc-btn download"
                onClick={() => handleDownloadResource('Formula Sheet', chapter.resources?.formulaSheet?.url)}
              >
                ⬇️ Download PDF
              </button>
            </div>
          </div>

          {/* 6. 📝 Practice Questions Card */}
          <div className="mn-sr-resource-card practice-card">
            <div className="mn-sr-rc-header">
              <span className="mn-sr-rc-icon">📝</span>
              <div>
                <span className="mn-sr-rc-tag">SELF-ASSESSMENT</span>
                <h3 className="mn-sr-rc-title">Practice Questions &amp; Test</h3>
              </div>
            </div>
            <p className="mn-sr-rc-desc">
              Interactive chapter test containing Multiple Choice Questions (MCQs), Assertion-Reason, and Case-Based problems.
            </p>
            <div className="mn-sr-rc-actions">
              <button
                type="button"
                className="mn-sr-rc-btn practice-now"
                onClick={() => handleOpenReader('Practice Test', chapter.resources?.solutions?.url)}
              >
                ✏️ Practice Now
              </button>
            </div>
          </div>

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
              <p className="mn-sr-trust-desc">CBSE, ICSE &amp; UP Board syllabus.</p>
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
              <p className="mn-sr-trust-desc">Official links &amp; protected data.</p>
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

export default ChapterDetailPage;
