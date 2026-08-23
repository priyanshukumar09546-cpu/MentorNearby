// ============================================================
// pages/Books/BooksHomePage.jsx
// Main Dynamic NCERT Books & Study Resources Portal
// ============================================================

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchCategories, fetchClasses, searchResources } from '../../api/resources';
import { useAuth } from '../../context/AuthContext';
import './Books.css';

const BooksHomePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [categories, setCategories] = useState({});
  const [classes, setClasses] = useState([]);
  const [selectedMedium, setSelectedMedium] = useState('English');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const loadPortalData = async () => {
      try {
        setLoading(true);
        const [catData, classData] = await Promise.all([
          fetchCategories(),
          fetchClasses({ medium: selectedMedium }),
        ]);

        setCategories(catData.data?.categories || {});
        setClasses(classData.data?.classes || []);
      } catch (err) {
        console.error('Failed to load books portal data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPortalData();
  }, [selectedMedium]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    try {
      setSearching(true);
      const res = await searchResources({ q: searchQuery.trim(), medium: selectedMedium });
      setSearchResults(res.data?.resources || []);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleClassClick = (cls) => {
    navigate(`/books/browse?classLevel=${encodeURIComponent(cls)}&medium=${encodeURIComponent(selectedMedium)}&category=NCERT_BOOK`);
  };

  const handleCategoryClick = (catKey) => {
    navigate(`/books/browse?category=${encodeURIComponent(catKey)}&medium=${encodeURIComponent(selectedMedium)}`);
  };

  return (
    <div className="books-page-root">
      {/* Hero Header */}
      <section className="books-hero">
        <div className="books-hero-content">
          <div className="books-hero-badge">
            <span>📚</span> Official NCERT & CBSE Study Portal
          </div>
          <h1 className="books-hero-title">
            Dynamic NCERT Textbooks, Solutions & Study Materials
          </h1>
          <p className="books-hero-desc">
            Directly access official NCERT textbooks (Classes 1–12), detailed step-by-step solutions, rapid formula notes, and CBSE board examination papers.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="books-search-box">
            <span className="books-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by book, subject, chapter name (e.g. 'Relations and Functions', 'Class 12 Physics')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="books-search-input"
            />
            <button type="submit" className="books-search-btn" disabled={searching}>
              {searching ? 'Searching...' : 'Search Books'}
            </button>
          </form>

          {isAuthenticated && (
            <div className="mt-4 flex items-center gap-3">
              <Link to="/bookmarks" className="text-sm font-semibold text-yellow-300 hover:text-yellow-200 flex items-center gap-1.5 underline">
                <span>🔖</span> View My Saved Bookmarks & Resources
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Main Content Container */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Search Results Display if active */}
        {searchResults !== null && (
          <div className="mb-12 bg-white rounded-2xl p-6 border border-blue-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                Search Results for "{searchQuery}" ({searchResults.length} found)
              </h2>
              <button
                onClick={() => { setSearchResults(null); setSearchQuery(''); }}
                className="text-sm font-bold text-red-600 hover:underline"
              >
                ✕ Clear Search
              </button>
            </div>

            {searchResults.length === 0 ? (
              <div className="books-empty-state">
                <div className="books-empty-icon">🔎</div>
                <h3 className="books-empty-title">No matching resources found</h3>
                <p className="books-empty-desc">Try checking your spelling or searching by subject name.</p>
              </div>
            ) : (
              <div className="books-catalog-grid">
                {searchResults.map((book) => (
                  <div key={book._id} className="book-card">
                    <div className="book-card-cover-wrapper">
                      <span className="book-card-badge">{book.classLevel}</span>
                      <span className="book-card-medium-badge">{book.medium}</span>
                      <div className="book-card-cover-title">{book.title}</div>
                    </div>
                    <div className="book-card-body">
                      <div>
                        <div className="book-card-meta">
                          <span>📖 {book.subject}</span>
                          <span>•</span>
                          <span>{book.publisher || 'NCERT'}</span>
                        </div>
                        <h3 className="book-card-title">{book.title}</h3>
                        <p className="book-card-desc">{book.description}</p>
                      </div>
                      <div className="book-card-footer">
                        <span className="book-card-chapters-count">
                          {book.chapters?.length || 0} Units / Chapters
                        </span>
                        <Link to={`/books/resource/${book._id}`} className="book-card-btn">
                          View Chapters →
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Medium Selector */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="books-section-title">
              <span>🎯</span> Select Your Medium & Category
            </h2>
          </div>
          
          <div className="books-medium-toggle">
            <button
              className={`books-medium-btn ${selectedMedium === 'English' ? 'active' : ''}`}
              onClick={() => setSelectedMedium('English')}
            >
              🇬🇧 English Medium
            </button>
            <button
              className={`books-medium-btn ${selectedMedium === 'Hindi' ? 'active' : ''}`}
              onClick={() => setSelectedMedium('Hindi')}
            >
              🇮🇳 Hindi Medium (हिंदी)
            </button>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="books-categories-grid">
          {Object.entries(categories).map(([key, cat]) => (
            <div
              key={key}
              className="books-category-card"
              onClick={() => handleCategoryClick(key)}
            >
              <div>
                <div className="books-cat-icon">{cat.icon}</div>
                <h3 className="books-cat-title">{cat.label}</h3>
              </div>
              <div className="books-cat-count">
                {cat.count} Available Resources →
              </div>
            </div>
          ))}
        </div>

        {/* Dynamic Classes Grid */}
        <div className="mt-8">
          <h2 className="books-section-title">
            <span>🏫</span> Select Class ({selectedMedium} Medium)
          </h2>

          {loading ? (
            <div className="p-8 text-center text-slate-500 font-medium">
              Loading available classes from database...
            </div>
          ) : classes.length === 0 ? (
            <div className="books-empty-state">
              <div className="books-empty-icon">📚</div>
              <h3 className="books-empty-title">No resources available yet</h3>
              <p className="books-empty-desc">Run NCERT sync in Admin control center to initialize books.</p>
            </div>
          ) : (
            <div className="books-classes-grid">
              {classes.map((cls) => (
                <button
                  key={cls}
                  className="books-class-btn"
                  onClick={() => handleClassClick(cls)}
                >
                  <span>📖</span>
                  <span>{cls}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Resource Highlights */}
        <div className="mt-12 bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg">
          <div>
            <span className="bg-yellow-400 text-slate-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Free Academic Access
            </span>
            <h3 className="text-2xl font-bold mt-2">100% Official NCERT & CBSE Content</h3>
            <p className="text-blue-100 text-sm mt-1 max-w-xl">
              Official chapter PDFs, textbook exercises, revision notes, and exam marking schemes are direct official educational materials for teachers and students.
            </p>
          </div>
          <Link
            to={`/books/browse?category=NCERT_BOOK&medium=${selectedMedium}`}
            className="bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-bold px-6 py-3 rounded-xl transition whitespace-nowrap shadow"
          >
            Browse All Books →
          </Link>
        </div>

      </div>
    </div>
  );
};

export default BooksHomePage;
