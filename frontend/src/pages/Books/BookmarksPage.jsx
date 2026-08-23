// ============================================================
// pages/Books/BookmarksPage.jsx
// User Saved Bookmarks & Quick Study Access
// ============================================================

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchMyBookmarks, removeBookmark } from '../../api/bookmarks';
import { useToast } from '../../context/ToastContext';
import './Books.css';

const BookmarksPage = () => {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const loadBookmarks = async () => {
      try {
        setLoading(true);
        const res = await fetchMyBookmarks();
        setBookmarks(res.data?.bookmarks || []);
      } catch (err) {
        showToast('Failed to load bookmarks', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadBookmarks();
  }, [showToast]);

  const handleRemove = async (id, title) => {
    try {
      await removeBookmark(id);
      setBookmarks((prev) => prev.filter((b) => b._id !== id));
      showToast(`Removed from bookmarks`, 'success');
    } catch (err) {
      showToast('Failed to remove bookmark', 'error');
    }
  };

  return (
    <div className="books-page-root">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-wrap justify-between items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500 font-semibold mb-1">
              <Link to="/books" className="text-blue-600 hover:underline">📚 Study Portal</Link>
              <span>›</span>
              <span>My Saved Bookmarks</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
              🔖 Saved Books & Study Materials
            </h1>
          </div>
          <Link to="/books" className="btn btn-outline btn-sm font-bold">
            ← Browse More Books
          </Link>
        </div>
      </div>

      {/* Bookmarks List */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="p-16 text-center text-slate-500 font-medium">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            Loading saved bookmarks...
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="books-empty-state">
            <div className="books-empty-icon">🔖</div>
            <h3 className="books-empty-title">No bookmarks saved yet</h3>
            <p className="books-empty-desc">
              Bookmark your favorite textbooks, notes, and chapters for one-click access whenever you study or prepare lessons.
            </p>
            <Link to="/books" className="btn btn-primary font-bold">
              Explore NCERT Textbooks →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookmarks.map((bm) => {
              const res = bm.resource;
              if (!res) return null;

              const isChapter = bm.chapterIndex >= 0;
              const chapterObj = isChapter && res.chapters ? res.chapters[bm.chapterIndex] : null;

              return (
                <div key={bm._id} className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm hover:border-blue-300 transition">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl font-bold flex-shrink-0">
                      {isChapter ? '📄' : '📚'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-0.5 rounded">
                          {res.classLevel}
                        </span>
                        <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-0.5 rounded">
                          {res.subject}
                        </span>
                        <span className="text-xs text-slate-400">
                          {res.medium} Medium
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900">
                        {isChapter && bm.chapterTitle ? bm.chapterTitle : res.title}
                      </h3>
                      {isChapter && (
                        <p className="text-xs text-slate-500">From book: {res.title}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                    {isChapter && chapterObj?.openUrl ? (
                      <a
                        href={chapterObj.openUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-open-official text-xs px-4 py-2"
                      >
                        <span>📖</span> Open Chapter
                      </a>
                    ) : (
                      <Link
                        to={`/books/resource/${res._id}`}
                        className="btn-open-official text-xs px-4 py-2"
                      >
                        <span>📚</span> View Book
                      </Link>
                    )}

                    <button
                      onClick={() => handleRemove(bm._id, bm.chapterTitle || res.title)}
                      className="text-slate-400 hover:text-red-600 p-2 text-sm font-bold transition"
                      title="Remove Bookmark"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookmarksPage;
