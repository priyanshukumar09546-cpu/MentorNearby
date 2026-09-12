// ============================================================
// pages/Subject/AllSubjectsPage.jsx
// MentorNearby "All Subjects" Hub
// Dynamic Real Database Subject & Tutor Counts
// Matches Reference Design Screen 2 (media_1789236176987.jpg)
// ZERO Fake / Mock Data
// ============================================================

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { searchTutors } from '../../api/search';
import { useTheme } from '../../context/ThemeContext';
import './AllSubjectsPage.css';

// Subject visual branding dictionary matching Screen 2
const SUBJECT_AESTHETICS = {
  mathematics: {
    symbol: 'π',
    iconClass: 'fa-solid fa-calculator',
    color: '#2563EB',
    bg: '#EFF6FF',
    border: '#DBEAFE',
    darkBg: 'rgba(37, 99, 235, 0.15)',
  },
  maths: {
    symbol: 'π',
    iconClass: 'fa-solid fa-calculator',
    color: '#2563EB',
    bg: '#EFF6FF',
    border: '#DBEAFE',
    darkBg: 'rgba(37, 99, 235, 0.15)',
  },
  physics: {
    symbol: '⚛️',
    iconClass: 'fa-solid fa-atom',
    color: '#E11D48',
    bg: '#FDF2F8',
    border: '#FCE7F3',
    darkBg: 'rgba(225, 29, 72, 0.15)',
  },
  chemistry: {
    symbol: '🧪',
    iconClass: 'fa-solid fa-flask',
    color: '#059669',
    bg: '#F0FDF4',
    border: '#DCFCE7',
    darkBg: 'rgba(5, 150, 105, 0.15)',
  },
  biology: {
    symbol: '🧬',
    iconClass: 'fa-solid fa-dna',
    color: '#9333EA',
    bg: '#FAF5FF',
    border: '#F3E8FF',
    darkBg: 'rgba(147, 51, 234, 0.15)',
  },
  english: {
    symbol: '📖',
    iconClass: 'fa-solid fa-book-open',
    color: '#D97706',
    bg: '#FFF7ED',
    border: '#FFEDD5',
    darkBg: 'rgba(217, 119, 6, 0.15)',
  },
  hindi: {
    symbol: 'Aअ',
    iconClass: 'fa-solid fa-language',
    color: '#E11D48',
    bg: '#FFF1F2',
    border: '#FFE4E6',
    darkBg: 'rgba(225, 29, 72, 0.15)',
  },
  'computer science': {
    symbol: '💻',
    iconClass: 'fa-solid fa-laptop-code',
    color: '#4F46E5',
    bg: '#EEF2FF',
    border: '#E0E7FF',
    darkBg: 'rgba(79, 70, 229, 0.15)',
  },
  'art & craft': {
    symbol: '🎨',
    iconClass: 'fa-solid fa-palette',
    color: '#D97706',
    bg: '#FEFCE8',
    border: '#FEF08A',
    darkBg: 'rgba(217, 119, 6, 0.15)',
  },
  accountancy: {
    symbol: '₹',
    iconClass: 'fa-solid fa-calculator',
    color: '#E11D48',
    bg: '#FEF2F2',
    border: '#FEE2E2',
    darkBg: 'rgba(225, 29, 72, 0.15)',
  },
  economics: {
    symbol: '📈',
    iconClass: 'fa-solid fa-chart-line',
    color: '#7C3AED',
    bg: '#FAF5FF',
    border: '#F3E8FF',
    darkBg: 'rgba(124, 58, 237, 0.15)',
  },
  'social studies': {
    symbol: '🌐',
    iconClass: 'fa-solid fa-earth-americas',
    color: '#059669',
    bg: '#F0FDF4',
    border: '#DCFCE7',
    darkBg: 'rgba(5, 150, 105, 0.15)',
  },
  history: {
    symbol: '🏛️',
    iconClass: 'fa-solid fa-landmark',
    color: '#BE123C',
    bg: '#FFF1F2',
    border: '#FFE4E6',
    darkBg: 'rgba(190, 18, 60, 0.15)',
  },
  geography: {
    symbol: '🧭',
    iconClass: 'fa-solid fa-compass',
    color: '#0D9488',
    bg: '#ECFDF5',
    border: '#CCFBF1',
    darkBg: 'rgba(13, 148, 136, 0.15)',
  },
  science: {
    symbol: '🔬',
    iconClass: 'fa-solid fa-microscope',
    color: '#0D9488',
    bg: '#F0FDFA',
    border: '#CCFBF1',
    darkBg: 'rgba(13, 148, 136, 0.15)',
  },
};

const getSubjectAesthetic = (subjectName) => {
  const key = (subjectName || '').toLowerCase().trim();
  return (
    SUBJECT_AESTHETICS[key] || {
      symbol: (subjectName || '').charAt(0).toUpperCase() || '📚',
      iconClass: 'fa-solid fa-book-bookmark',
      color: '#4F46E5',
      bg: '#EEF2FF',
      border: '#E0E7FF',
      darkBg: 'rgba(79, 70, 229, 0.15)',
    }
  );
};

const AllSubjectsPage = () => {
  const navigate = useNavigate();
  const { isDark, darkMode } = useTheme();
  const isDarkMode = isDark ?? darkMode ?? false;

  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [subjectItems, setSubjectItems] = useState([]);

  // Load real subjects and dynamic tutor counts from MongoDB API
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    searchTutors({ limit: 100 })
      .then((res) => {
        if (!isMounted) return;
        const tutorsList =
          res.data?.data?.tutors ||
          res.data?.tutors ||
          res.data?.data ||
          (Array.isArray(res.data) ? res.data : []);

        // Aggregate unique subjects and count tutors for each
        const counts = {};
        if (Array.isArray(tutorsList)) {
          tutorsList.forEach((tutor) => {
            const subs =
              Array.isArray(tutor.subjects) && tutor.subjects.length > 0
                ? tutor.subjects
                : tutor.subject
                ? [tutor.subject]
                : [];

            subs.forEach((sub) => {
              if (!sub) return;
              const trimmed = sub.toString().trim();
              if (trimmed) {
                // Canonicalize first letter capitalized
                const formatted =
                  trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
                counts[formatted] = (counts[formatted] || 0) + 1;
              }
            });
          });
        }

        // Convert to sorted list of subjects
        const subjectsArray = Object.keys(counts)
          .sort((a, b) => counts[b] - counts[a] || a.localeCompare(b))
          .map((name) => ({
            name,
            count: counts[name],
            aesthetic: getSubjectAesthetic(name),
          }));

        setSubjectItems(subjectsArray);
      })
      .catch((err) => {
        console.error('Error fetching subjects catalog:', err);
        setSubjectItems([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Filter subjects by user search query
  const filteredSubjects = useMemo(() => {
    if (!searchQuery.trim()) return subjectItems;
    const q = searchQuery.toLowerCase().trim();
    return subjectItems.filter((item) =>
      item.name.toLowerCase().includes(q)
    );
  }, [subjectItems, searchQuery]);

  // Navigate to tutor marketplace filtered by subject
  const handleSelectSubject = (subjectName) => {
    navigate(`/tutors?subject=${encodeURIComponent(subjectName)}`);
  };

  return (
    <main className={`mn-subjects-page-root ${isDarkMode ? 'dark' : 'light'}`}>
      <div className="mn-subjects-page-container">
        
        {/* ============================================================ */}
        {/* 1. PAGE TITLE & SUBTITLE (Matching Reference Screen 2)       */}
        {/* ============================================================ */}
        <div className="mn-subjects-header">
          <h1 className="mn-subjects-title">All Subjects</h1>
          <p className="mn-subjects-subtitle">
            Explore tutors by subject and find the right mentor for your learning goals.
          </p>
        </div>

        {/* ============================================================ */}
        {/* 2. SEARCH BAR                                                */}
        {/* ============================================================ */}
        <div className="mn-subjects-search-wrap">
          <div className="mn-subjects-search-box">
            <i className="fa-solid fa-magnifying-glass mn-subjects-search-icon" aria-hidden="true"></i>
            <input
              type="text"
              className="mn-subjects-search-input"
              placeholder="Search subjects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search subjects"
            />
            {searchQuery && (
              <button
                type="button"
                className="mn-subjects-search-clear"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* 3. 2-COLUMN SUBJECTS GRID                                    */}
        {/* ============================================================ */}
        {loading ? (
          <div className="mn-subjects-grid">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div key={idx} className="mn-subject-card skeleton">
                <div className="mn-subject-skeleton-icon"></div>
                <div className="mn-subject-skeleton-text">
                  <div className="mn-skeleton-line title"></div>
                  <div className="mn-skeleton-line sub"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredSubjects.length > 0 ? (
          <div className="mn-subjects-grid">
            {filteredSubjects.map((item) => {
              const { name, count, aesthetic } = item;
              return (
                <div
                  key={name}
                  className="mn-subject-card"
                  onClick={() => handleSelectSubject(name)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelectSubject(name);
                    }
                  }}
                  aria-label={`${name}, ${count} ${count === 1 ? 'Tutor' : 'Tutors'}`}
                >
                  {/* Icon / Symbol Box */}
                  <div
                    className="mn-subject-icon-box"
                    style={{
                      background: isDarkMode ? aesthetic.darkBg : aesthetic.bg,
                      color: aesthetic.color,
                      borderColor: isDarkMode ? 'transparent' : aesthetic.border,
                    }}
                  >
                    <span className="mn-subject-symbol">{aesthetic.symbol}</span>
                  </div>

                  {/* Info: Subject Name & Dynamic Real Tutor Count */}
                  <div className="mn-subject-info">
                    <span className="mn-subject-name">{name}</span>
                    <span className="mn-subject-count">
                      {count} {count === 1 ? 'Tutor' : 'Tutors'}
                    </span>
                  </div>

                  {/* Right Chevron */}
                  <div className="mn-subject-chevron" aria-hidden="true">
                    <i className="fa-solid fa-chevron-right"></i>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mn-subjects-empty">
            <div className="mn-subjects-empty-icon">
              <i className="fa-solid fa-book-open-reader"></i>
            </div>
            {searchQuery ? (
              <>
                <h3 className="mn-subjects-empty-title">No subjects found</h3>
                <p className="mn-subjects-empty-desc">
                  No subjects match your search "{searchQuery}".
                </p>
                <button
                  type="button"
                  className="mn-subjects-empty-btn"
                  onClick={() => setSearchQuery('')}
                >
                  Clear Search
                </button>
              </>
            ) : (
              <>
                <h3 className="mn-subjects-empty-title">No tutors available yet</h3>
                <p className="mn-subjects-empty-desc">
                  Be among the first teachers to establish your presence on MentorNearby.
                </p>
                <Link to="/become-tutor" className="mn-subjects-empty-btn">
                  Become a Tutor
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
};

export default AllSubjectsPage;
