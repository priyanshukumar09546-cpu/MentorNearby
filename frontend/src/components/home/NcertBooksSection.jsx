// ============================================================
// components/home/NcertBooksSection.jsx
// MentorNearby — Explore Our NCERT Books Library Section
// Matching Reference Image 1 with exact book stack vector art, pills, and 12 class buttons
// ============================================================

import React from 'react';
import { Link } from 'react-router-dom';

const NCERT_CLASSES = [
  { num: 1, color: '#10B981', bg: '#ECFDF5', border: '#A7F3D0' },
  { num: 2, color: '#8B5CF6', bg: '#F5F3FF', border: '#DDD6FE' },
  { num: 3, color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
  { num: 4, color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE' },
  { num: 5, color: '#EAB308', bg: '#FEFCE8', border: '#FEF08A' },
  { num: 6, color: '#6366F1', bg: '#EEF2FF', border: '#C7D2FE' },
  { num: 7, color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
  { num: 8, color: '#EA580C', bg: '#FFF7ED', border: '#FED7AA' },
  { num: 9, color: '#9333EA', bg: '#FAF5FF', border: '#E9D5FF' },
  { num: 10, color: '#06B6D4', bg: '#ECFEFF', border: '#A5F3FC' },
  { num: 11, color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  { num: 12, color: '#EC4899', bg: '#FDF2F8', border: '#FBCFE8' },
];

const NcertBooksSection = () => {
  return (
    <section className="mn-ncert-library-section" aria-label="Explore Our NCERT Books Library">
      <div className="mn-container">
        {/* Section Header with Decorative Accent Lines */}
        <div className="mn-courses-section-header" style={{ justifyContent: 'center', marginBottom: 24 }}>
          <div className="mn-courses-header-text">
            <h2 className="mn-courses-main-title">
              <span className="mn-title-accent-bar" aria-hidden="true"></span>
              <span>Explore Our</span>
              <span className="mn-courses-orange-text">NCERT Books Library</span>
              <span className="mn-title-accent-bar" aria-hidden="true"></span>
            </h2>
            <p className="mn-courses-sub-desc">
              All your NCERT textbooks, one place.
            </p>
          </div>
        </div>

        {/* Main NCERT Banner Card */}
        <div className="mn-ncert-banner-card">
          <div className="mn-ncert-banner-content">
            {/* Left: Stack of 3 NCERT Books with Green Leaves */}
            <div className="mn-ncert-books-stack-visual" aria-hidden="true">
              <svg width="150" height="110" viewBox="0 0 150 110" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Botanical leaves / sprouts at base */}
                <path d="M 38 88 C 24 82, 14 70, 22 58 C 32 64, 38 78, 38 88 Z" fill="#10B981" />
                <path d="M 40 88 C 28 85, 20 76, 26 66" stroke="#047857" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M 28 92 C 16 90, 8 82, 14 74 C 22 78, 28 86, 28 92 Z" fill="#34D399" />
                <path d="M 112 88 C 126 82, 136 70, 128 58 C 118 64, 112 78, 112 88 Z" fill="#10B981" />
                <path d="M 110 88 C 122 85, 130 76, 124 66" stroke="#047857" strokeWidth="1.5" strokeLinecap="round" />

                {/* Soft base shadow */}
                <ellipse cx="75" cy="98" rx="60" ry="7" fill="#FDBA74" fillOpacity="0.4" />

                {/* Book 3: Bottom Yellow Hardcover */}
                <g transform="rotate(2 75 88)">
                  <path d="M 32 82 L 118 82 L 122 92 L 30 92 Z" fill="#D97706" />
                  <rect x="30" y="80" width="88" height="14" rx="2" fill="#F59E0B" />
                  <rect x="36" y="82" width="80" height="10" fill="#FEF3C7" />
                  <path d="M 30 80 L 34 80 L 34 94 L 30 94 Z" fill="#B45309" />
                </g>

                {/* Book 2: Middle Blue Hardcover */}
                <g transform="rotate(-3 75 70)">
                  <path d="M 34 64 L 114 64 L 118 74 L 32 74 Z" fill="#1E40AF" />
                  <rect x="32" y="62" width="82" height="14" rx="2" fill="#2563EB" />
                  <rect x="38" y="64" width="74" height="10" fill="#EFF6FF" />
                  <path d="M 32 62 L 36 62 L 36 76 L 32 76 Z" fill="#1D4ED8" />
                  <line x1="42" y1="69" x2="68" y2="69" stroke="#93C5FD" strokeWidth="1.5" strokeLinecap="round" />
                </g>

                {/* Book 1: Top Red Hardcover with embossed "NCERT" */}
                <g transform="rotate(1 75 50)">
                  <path d="M 36 44 L 112 44 L 116 56 L 34 56 Z" fill="#991B1B" />
                  <rect x="34" y="42" width="78" height="16" rx="3" fill="#DC2626" />
                  <rect x="40" y="44" width="70" height="12" fill="#FFF1F2" />
                  <path d="M 34 42 L 39 42 L 39 58 L 34 58 Z" fill="#B91C1C" />
                  {/* Embossed NCERT White Text on Spine/Cover */}
                  <text x="56" y="54" fill="#FFFFFF" fontSize="9.5" fontWeight="900" letterSpacing="1" fontFamily="system-ui, sans-serif">
                    NCERT
                  </text>
                  <circle cx="98" cy="50" r="3" fill="#FEF08A" />
                </g>

                {/* Sparkle star */}
                <path d="M 124 36 Q 124 30 129 30 Q 124 30 124 24 Q 124 30 119 30 Q 124 30 124 36 Z" fill="#F59E0B" />
              </svg>
            </div>

            {/* Center: 3 Feature Highlight Pills */}
            <div className="mn-ncert-pills-row">
              <div className="mn-ncert-pill">
                <span className="mn-ncert-pill-icon mn-pill-red">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                  </svg>
                </span>
                <span className="mn-ncert-pill-text">Class 1 – 12</span>
              </div>

              <div className="mn-ncert-pill">
                <span className="mn-ncert-pill-icon mn-pill-orange">
                  <span style={{ fontSize: 13, fontWeight: 800 }}>文A</span>
                </span>
                <span className="mn-ncert-pill-text">English &amp; Hindi Medium</span>
              </div>

              <div className="mn-ncert-pill">
                <span className="mn-ncert-pill-icon mn-pill-orange">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    <polyline points="9 12 11 14 15 10"></polyline>
                  </svg>
                </span>
                <span className="mn-ncert-pill-text">Official NCERT Books</span>
              </div>
            </div>

            {/* Right: CTA Button */}
            <div className="mn-ncert-cta-wrap">
              <Link to="/books" className="mn-ncert-explore-btn">
                <span>Explore Books</span>
                <span className="mn-ncert-btn-arrow">→</span>
              </Link>
            </div>
          </div>

          {/* Bottom: Horizontal Row of 12 Individual Class Cards (Class 1 to 12) */}
          <div className="mn-ncert-classes-strip" role="list">
            {NCERT_CLASSES.map((cls) => (
              <Link
                key={cls.num}
                to={`/books?class=Class ${cls.num}`}
                className="mn-ncert-class-chip"
                style={{
                  backgroundColor: cls.bg,
                  borderColor: cls.border,
                  color: '#0F172A',
                }}
                role="listitem"
                title={`Class ${cls.num} NCERT Books`}
              >
                <span
                  className="mn-ncert-chip-book-icon"
                  style={{ color: cls.color }}
                  aria-hidden="true"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"></path>
                    <path d="M6 6h10"></path>
                    <path d="M6 10h10"></path>
                  </svg>
                </span>
                <span className="mn-ncert-chip-label">Class {cls.num}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default NcertBooksSection;
