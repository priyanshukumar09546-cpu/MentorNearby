// ============================================================
// pages/Books/BookDetailPage.jsx
// Book Detail & Chapter-wise Units View with Official PDF/Viewer Actions
// ============================================================

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchResourceById } from '../../api/resources';
import { checkBookmark, addBookmark, removeBookmark } from '../../api/bookmarks';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import './Books.css';

const BookDetailPage = () => {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkId, setBookmarkId] = useState(null);
  const [togglingBookmark, setTogglingBookmark] = useState(false);

  useEffect(() => {
    const loadResource = async () => {
      try {
        setLoading(true);
        const res = await fetchResourceById(id);
        setResource(res.data?.resource);

        if (isAuthenticated) {
          try {
            const bRes = await checkBookmark(id);
            setIsBookmarked(bRes.data?.isBookmarked);
            setBookmarkId(bRes.data?.bookmarkId);
          } catch (e) {
            // ignore bookmark check failure
          }
        }
      } catch (err) {
        showToast('Failed to load resource details', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadResource();
  }, [id, isAuthenticated, showToast]);

  const handleToggleBookmark = async (chapterIdx = -1, chapterTitle = '') => {
    if (!isAuthenticated) {
      showToast('Please sign in to bookmark study materials', 'info');
      return;
    }

    try {
      setTogglingBookmark(true);
      if (isBookmarked && chapterIdx === -1 && bookmarkId) {
        await removeBookmark(bookmarkId);
        setIsBookmarked(false);
        setBookmarkId(null);
        showToast('Removed from Bookmarks', 'success');
      } else {
        const res = await addBookmark({
          resourceId: id,
          chapterIndex: chapterIdx,
          chapterTitle: chapterTitle,
        });
        if (chapterIdx === -1) {
          setIsBookmarked(true);
          setBookmarkId(res.data?.bookmark?._id);
        }
        showToast(chapterIdx === -1 ? 'Book bookmarked successfully!' : `Bookmarked ${chapterTitle}!`, 'success');
      }
    } catch (err) {
      showToast('Failed to update bookmark', 'error');
    } finally {
      setTogglingBookmark(false);
    }
  };

  if (loading) {
    return (
      <div className="books-page-root flex items-center justify-center p-20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-semibold">Loading textbook & chapter units...</p>
        </div>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="books-page-root p-12 text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Resource Not Found</h2>
        <p className="text-slate-600 mb-6">The requested textbook or resource is not available.</p>
        <Link to="/books" className="btn btn-primary">← Back to Study Portal</Link>
      </div>
    );
  }

  return (
    <div className="books-page-root">
      
      {/* Breadcrumb Header */}
      <div className="bg-white border-b border-slate-200 py-4">
        <div className="max-w-6xl mx-auto px-4 flex items-center gap-2 text-sm text-slate-600 font-medium">
          <Link to="/books" className="text-blue-600 hover:underline">📚 Study Portal</Link>
          <span>›</span>
          <Link to={`/books/browse?classLevel=${encodeURIComponent(resource.classLevel)}&medium=${encodeURIComponent(resource.medium)}`} className="text-blue-600 hover:underline">
            {resource.classLevel}
          </Link>
          <span>›</span>
          <span>{resource.subject}</span>
          <span>›</span>
          <span className="font-bold text-slate-800 truncate">{resource.title}</span>
        </div>
      </div>

      {/* Book Detail Hero Banner */}
      <div className="book-detail-header">
        <div className="max-w-6xl mx-auto px-4">
          <div className="book-detail-grid">
            
            {/* Visual Cover */}
            <div className="book-detail-cover">
              <div>
                <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 inline-block">
                  {resource.classLevel} • {resource.medium}
                </span>
                <h2 className="text-2xl font-black">{resource.title}</h2>
                <div className="text-sm font-semibold text-blue-100 mt-2">{resource.subject}</div>
              </div>
            </div>

            {/* Book Meta & Global Actions */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-md">
                  {resource.category.replace('_', ' ')}
                </span>
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-md">
                  ✓ Official {resource.publisher || 'NCERT'}
                </span>
                <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-md">
                  {resource.medium} Medium
                </span>
              </div>

              <h1 className="text-3xl font-extrabold text-slate-900 mb-3">{resource.title}</h1>
              <p className="text-slate-600 text-base leading-relaxed mb-6">
                {resource.description || `Official textbook for ${resource.classLevel} ${resource.subject} according to the latest rationalised curriculum.`}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                {resource.officialUrl && (
                  <a
                    href={resource.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-open-official px-5 py-2.5 text-sm"
                  >
                    <span>🌐</span> Open Official Portal
                  </a>
                )}

                {resource.downloadUrl && (
                  <a
                    href={resource.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-download-pdf px-5 py-2.5 text-sm"
                  >
                    <span>⬇️</span> Download Full Book ZIP
                  </a>
                )}

                <button
                  onClick={() => handleToggleBookmark(-1, resource.title)}
                  disabled={togglingBookmark}
                  className={`btn btn-outline text-sm font-bold flex items-center gap-2 ${
                    isBookmarked ? 'bg-amber-50 text-amber-700 border-amber-400' : ''
                  }`}
                >
                  <span>{isBookmarked ? '★' : '☆'}</span>
                  <span>{isBookmarked ? 'Bookmarked' : 'Bookmark Book'}</span>
                </button>
              </div>

            </div>

          </div>
        </div>
      </div>

      {/* Chapters & Units List */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-extrabold text-slate-900">
            Chapters & Units ({resource.chapters?.length || 0})
          </h2>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            Direct Official Links
          </span>
        </div>

        {!resource.chapters || resource.chapters.length === 0 ? (
          <div className="books-empty-state">
            <div className="books-empty-icon">📄</div>
            <h3 className="books-empty-title">Chapters not loaded yet</h3>
            <p className="books-empty-desc">You can access the full book using the official portal link above.</p>
          </div>
        ) : (
          <div>
            {resource.chapters.map((ch, idx) => (
              <div key={ch._id || idx} className="chapter-item-card">
                
                <div className="flex items-center gap-4 flex-1">
                  <div className="chapter-num">{ch.unitNumber || idx + 1}</div>
                  <div className="chapter-info">
                    <h3 className="chapter-title">{ch.title}</h3>
                    <span className="text-xs text-slate-500 font-medium">
                      Unit {ch.unitNumber || idx + 1} • {ch.contentType || 'PDF'}
                    </span>
                  </div>
                </div>

                <div className="chapter-actions">
                  {ch.openUrl ? (
                    <a
                      href={ch.openUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-open-official"
                    >
                      <span>📖</span> Open PDF
                    </a>
                  ) : (
                    <span className="bg-slate-100 text-slate-400 text-xs font-bold px-3 py-2 rounded-lg">
                      Not Available
                    </span>
                  )}

                  {ch.downloadUrl && ch.downloadUrl !== ch.openUrl && (
                    <a
                      href={ch.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-download-pdf"
                    >
                      <span>⬇️</span> Download
                    </a>
                  )}

                  <button
                    onClick={() => handleToggleBookmark(idx, ch.title)}
                    className="btn-bookmark-toggle"
                    title="Bookmark Chapter"
                  >
                    🔖
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default BookDetailPage;
