// ============================================================
// pages/Books/BooksListPage.jsx
// Filterable Catalogue of Books, Solutions, Notes & Papers
// ============================================================

import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { fetchResources, fetchClasses, fetchSubjects } from '../../api/resources';
import './Books.css';

const BooksListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const category = searchParams.get('category') || 'NCERT_BOOK';
  const medium = searchParams.get('medium') || 'English';
  const classLevel = searchParams.get('classLevel') || 'All';
  const subject = searchParams.get('subject') || 'All';

  const [resources, setResources] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [subjectsList, setSubjectsList] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const categoryLabels = {
    NCERT_BOOK: 'NCERT Textbooks',
    NCERT_SOLUTION: 'NCERT Solutions',
    NCERT_NOTE: 'Revision Notes & Formulas',
    CBSE_PAPER: 'CBSE Sample Papers',
    OTHER_SOLUTION: 'Other Solutions',
  };

  useEffect(() => {
    const loadFilteredData = async () => {
      try {
        setLoading(true);

        const params = {
          category,
          medium,
          classLevel: classLevel !== 'All' ? classLevel : undefined,
          subject: subject !== 'All' ? subject : undefined,
          limit: 50,
        };

        const [resData, classData, subjectData] = await Promise.all([
          fetchResources(params),
          fetchClasses({ category, medium }),
          fetchSubjects({ category, medium, classLevel: classLevel !== 'All' ? classLevel : undefined }),
        ]);

        setResources(resData.data?.resources || []);
        setTotalCount(resData.data?.total || 0);
        setClassesList(classData.data?.classes || []);
        setSubjectsList(subjectData.data?.subjects || []);
      } catch (err) {
        console.error('Error fetching filtered resources:', err);
      } finally {
        setLoading(false);
      }
    };

    loadFilteredData();
  }, [category, medium, classLevel, subject]);

  const updateFilter = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === 'All') {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }

    // Reset subject when class changes
    if (key === 'classLevel') {
      newParams.delete('subject');
    }

    setSearchParams(newParams);
  };

  return (
    <div className="books-page-root">
      {/* Breadcrumb & Sub-Header */}
      <div className="bg-white border-b border-slate-200 py-4">
        <div className="max-w-6xl mx-auto px-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
            <Link to="/books" className="text-blue-600 hover:underline">📚 Study Portal</Link>
            <span>›</span>
            <span>{categoryLabels[category] || category}</span>
            {classLevel !== 'All' && (
              <>
                <span>›</span>
                <span className="font-bold text-slate-800">{classLevel}</span>
              </>
            )}
          </div>

          {/* Medium Toggle in Header */}
          <div className="books-medium-toggle mb-0">
            <button
              className={`books-medium-btn ${medium === 'English' ? 'active' : ''}`}
              onClick={() => updateFilter('medium', 'English')}
            >
              🇬🇧 English
            </button>
            <button
              className={`books-medium-btn ${medium === 'Hindi' ? 'active' : ''}`}
              onClick={() => updateFilter('medium', 'Hindi')}
            >
              🇮🇳 Hindi (हिंदी)
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Category Pills Header */}
        <div className="flex flex-wrap gap-2 mb-6">
          {Object.entries(categoryLabels).map(([key, label]) => (
            <button
              key={key}
              onClick={() => updateFilter('category', key)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                category === key
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Dynamic Classes Selector */}
        <div className="mb-6">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Select Class Level
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => updateFilter('classLevel', 'All')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                classLevel === 'All'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              All Classes
            </button>
            {classesList.map((cls) => (
              <button
                key={cls}
                onClick={() => updateFilter('classLevel', cls)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  classLevel === cls
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {cls}
              </button>
            ))}
          </div>
        </div>

        {/* Subjects Horizontal Scroll */}
        {subjectsList.length > 0 && (
          <div className="mb-6">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Filter By Subject
            </div>
            <div className="books-subjects-scroll">
              <button
                onClick={() => updateFilter('subject', 'All')}
                className={`books-subject-pill ${subject === 'All' ? 'active' : ''}`}
              >
                All Subjects
              </button>
              {subjectsList.map((sub) => (
                <button
                  key={sub}
                  onClick={() => updateFilter('subject', sub)}
                  className={`books-subject-pill ${subject === sub ? 'active' : ''}`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-900">
            {classLevel !== 'All' ? `${classLevel} ` : ''}
            {categoryLabels[category] || 'Resources'}
            <span className="ml-2 text-sm font-normal text-slate-500">
              ({totalCount} items available)
            </span>
          </h2>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="p-16 text-center text-slate-500 font-medium">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            Loading study resources...
          </div>
        ) : resources.length === 0 ? (
          <div className="books-empty-state">
            <div className="books-empty-icon">📖</div>
            <h3 className="books-empty-title">No resources available yet for this selection</h3>
            <p className="books-empty-desc">
              Try switching medium (English / Hindi) or selecting another class.
            </p>
            <Link to="/books" className="btn btn-primary btn-sm">
              ← Back to Study Portal
            </Link>
          </div>
        ) : (
          <div className="books-catalog-grid">
            {resources.map((book) => (
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
    </div>
  );
};

export default BooksListPage;
