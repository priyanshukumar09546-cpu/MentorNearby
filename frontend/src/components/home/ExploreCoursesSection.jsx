// ============================================================
// components/home/ExploreCoursesSection.jsx
// MentorNearby — Explore Our Courses Section
// Clean 4-card layout for Class 9, Class 10, Class 11, Class 12
// Matching Reference Image 1 with exact vector illustrations & circular buttons
// ============================================================

import React from 'react';
import { Link } from 'react-router-dom';

const COURSE_CLASSES = [
  {
    classNum: '9',
    title: 'Class 9',
    description: 'Complete Study Resources',
    color: '#8B5CF6',
    btnBg: '#8B5CF6',
    border: '#DDD6FE',
    glow: 'rgba(139, 92, 246, 0.08)',
    link: '/courses?class=Class 9',
    illustration: (
      <svg width="120" height="85" viewBox="0 0 120 85" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Soft shadow */}
        <ellipse cx="60" cy="78" rx="48" ry="6" fill="#DDD6FE" fillOpacity="0.4" />
        {/* Open Notebook / Binder */}
        <rect x="22" y="24" width="76" height="50" rx="4" fill="#8B5CF6" />
        <path d="M 24 26 L 58 26 L 58 72 L 24 72 Z" fill="#F5F3FF" />
        <path d="M 62 26 L 96 26 L 96 72 L 62 72 Z" fill="#FFFFFF" />
        {/* Binder Spine Rings */}
        <circle cx="60" cy="34" r="2.5" fill="#C4B5FD" />
        <circle cx="60" cy="46" r="2.5" fill="#C4B5FD" />
        <circle cx="60" cy="58" r="2.5" fill="#C4B5FD" />
        <circle cx="60" cy="68" r="2.5" fill="#C4B5FD" />
        {/* Ruled lines on pages */}
        <line x1="28" y1="36" x2="54" y2="36" stroke="#DDD6FE" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="28" y1="44" x2="54" y2="44" stroke="#DDD6FE" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="28" y1="52" x2="50" y2="52" stroke="#DDD6FE" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="28" y1="60" x2="52" y2="60" stroke="#DDD6FE" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="66" y1="36" x2="92" y2="36" stroke="#E2E8F0" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="66" y1="44" x2="92" y2="44" stroke="#E2E8F0" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="66" y1="52" x2="88" y2="52" stroke="#E2E8F0" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="66" y1="60" x2="90" y2="60" stroke="#E2E8F0" strokeWidth="1.5" strokeLinecap="round" />
        {/* Bookmark ribbon */}
        <path d="M 50 20 L 55 20 L 55 38 L 52.5 35 L 50 38 Z" fill="#EC4899" />
        {/* Pencil Holder Cup */}
        <rect x="88" y="38" width="20" height="28" rx="3" fill="#EC4899" />
        <line x1="91" y1="46" x2="105" y2="46" stroke="#FBCFE8" strokeWidth="1" />
        {/* Pencils and ruler sticking out */}
        <path d="M 92 38 L 92 18 L 95 14 L 98 18 L 98 38 Z" fill="#F59E0B" />
        <path d="M 94 14 L 96 14 L 95 12 Z" fill="#1E293B" />
        <path d="M 99 38 L 103 20 L 106 21 L 102 38 Z" fill="#06B6D4" />
        <rect x="86" y="22" width="4" height="20" rx="1" fill="#FBBF24" transform="rotate(-15 86 22)" />
        {/* Sparkle star */}
        <path d="M 16 22 Q 16 16 22 16 Q 16 16 16 10 Q 16 16 10 16 Q 16 16 16 22 Z" fill="#A78BFA" />
      </svg>
    ),
  },
  {
    classNum: '10',
    title: 'Class 10',
    description: 'Notes, PYQs & More',
    color: '#2563EB',
    btnBg: '#EA580C',
    border: '#FED7AA',
    glow: 'rgba(234, 88, 12, 0.08)',
    link: '/courses?class=Class 10',
    illustration: (
      <svg width="120" height="85" viewBox="0 0 120 85" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Soft shadow */}
        <ellipse cx="60" cy="78" rx="46" ry="6" fill="#FDE68A" fillOpacity="0.5" />
        {/* Stack of 2 Books */}
        <rect x="26" y="58" width="68" height="15" rx="3" fill="#F59E0B" />
        <rect x="29" y="60" width="62" height="11" fill="#FEF3C7" />
        <path d="M 26 58 L 30 58 L 30 73 L 26 73 Z" fill="#D97706" />
        <rect x="30" y="45" width="60" height="14" rx="3" fill="#FB923C" />
        <rect x="33" y="47" width="54" height="10" fill="#FFF7ED" />
        <path d="M 30 45 L 34 45 L 34 59 L 30 59 Z" fill="#EA580C" />
        {/* Graduation Cap (Mortarboard) on top */}
        <polygon points="60,18 96,30 60,42 24,30" fill="#1E40AF" />
        <polygon points="60,20 92,30 60,40 28,30" fill="#2563EB" />
        {/* Cap skull base */}
        <path d="M 44 36 L 44 48 C 44 54, 76 54, 76 48 L 76 36 Z" fill="#1E3A8A" />
        {/* Gold button and tassel */}
        <circle cx="60" cy="30" r="3" fill="#FBBF24" />
        <path d="M 60 30 Q 78 32 86 42 L 88 56" stroke="#FBBF24" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <rect x="85" y="54" width="6" height="8" rx="1" fill="#F59E0B" />
        {/* Sparkle star */}
        <path d="M 96 16 Q 96 11 101 11 Q 96 11 96 6 Q 96 11 91 11 Q 96 11 96 16 Z" fill="#FBBF24" />
        <circle cx="20" cy="38" r="2" fill="#FCD34D" />
      </svg>
    ),
  },
  {
    classNum: '11',
    title: 'Class 11',
    description: 'All Subjects & Resources',
    color: '#059669',
    btnBg: '#10B981',
    border: '#BBF7D0',
    glow: 'rgba(16, 185, 129, 0.08)',
    link: '/courses?class=Class 11',
    illustration: (
      <svg width="120" height="85" viewBox="0 0 120 85" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Soft shadow */}
        <ellipse cx="60" cy="78" rx="46" ry="6" fill="#BBF7D0" fillOpacity="0.5" />
        {/* Stack of Books */}
        <rect x="22" y="60" width="60" height="14" rx="3" fill="#10B981" />
        <rect x="24" y="62" width="55" height="10" fill="#ECFDF5" />
        <rect x="26" y="47" width="52" height="14" rx="3" fill="#047857" />
        <rect x="28" y="49" width="47" height="10" fill="#D1FAE5" />
        <rect x="30" y="35" width="44" height="13" rx="2" fill="#059669" />
        <rect x="32" y="37" width="39" height="9" fill="#ECFDF5" />
        {/* Chemistry Laboratory Flask (Conical Erlenmeyer) */}
        <path d="M 78 22 L 86 22 L 86 34 L 102 66 C 104 70, 100 74, 95 74 L 69 74 C 64 74, 60 70, 62 66 L 78 34 Z" fill="rgba(255, 255, 255, 0.85)" stroke="#065F46" strokeWidth="2.5" />
        {/* Liquid inside flask */}
        <path d="M 66 62 L 98 62 L 95 72 L 69 72 Z" fill="#34D399" />
        {/* Bubbles */}
        <circle cx="78" cy="67" r="2" fill="#FFFFFF" />
        <circle cx="86" cy="65" r="2.5" fill="#FFFFFF" />
        <circle cx="82" cy="56" r="2" fill="#6EE7B7" />
        {/* Sparkle star */}
        <path d="M 104 22 Q 104 17 109 17 Q 104 17 104 12 Q 104 17 99 17 Q 104 17 104 22 Z" fill="#34D399" />
        <circle cx="20" cy="30" r="2" fill="#10B981" />
      </svg>
    ),
  },
  {
    classNum: '12',
    title: 'Class 12',
    description: 'Board Exam Preparation',
    color: '#DB2777',
    btnBg: '#EC4899',
    border: '#FBCFE8',
    glow: 'rgba(236, 72, 153, 0.08)',
    link: '/courses?class=Class 12',
    illustration: (
      <svg width="120" height="85" viewBox="0 0 120 85" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Soft shadow */}
        <ellipse cx="60" cy="78" rx="46" ry="6" fill="#FBCFE8" fillOpacity="0.45" />
        {/* Stack of books on left */}
        <rect x="22" y="58" width="42" height="15" rx="3" fill="#BE185D" />
        <rect x="24" y="60" width="37" height="11" fill="#FDF2F8" />
        <rect x="26" y="45" width="36" height="14" rx="3" fill="#DB2777" />
        <rect x="28" y="47" width="31" height="10" fill="#FCE7F3" />
        {/* Mini graduation cap on books */}
        <polygon points="44,28 60,34 44,40 28,34" fill="#831843" />
        <circle cx="44" cy="34" r="2" fill="#F472B6" />
        {/* Laptop on right */}
        <rect x="62" y="34" width="46" height="32" rx="3" fill="#1E293B" stroke="#0F172A" strokeWidth="2" />
        <rect x="65" y="37" width="40" height="24" rx="2" fill="#38BDF8" />
        {/* Code / Study lines on laptop screen */}
        <line x1="68" y1="42" x2="80" y2="42" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="68" y1="47" x2="96" y2="47" stroke="#BAE6FD" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="68" y1="52" x2="90" y2="52" stroke="#BAE6FD" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="68" y1="57" x2="78" y2="57" stroke="#38BDF8" strokeWidth="1.5" strokeLinecap="round" />
        {/* Laptop base */}
        <path d="M 58 66 L 112 66 L 108 72 L 62 72 Z" fill="#64748B" />
        <rect x="80" y="67" width="10" height="2" rx="1" fill="#E2E8F0" />
        {/* Sparkle star */}
        <path d="M 112 24 Q 112 19 117 19 Q 112 19 112 14 Q 112 19 107 19 Q 112 19 112 24 Z" fill="#F472B6" />
      </svg>
    ),
  },
];

const ExploreCoursesSection = () => {
  return (
    <section className="mn-courses-explore-section" aria-label="Explore Our Courses">
      <div className="mn-container">
        {/* Section Header with Decorative Accent Lines */}
        <div className="mn-courses-section-header">
          <div className="mn-courses-header-text">
            <h2 className="mn-courses-main-title">
              <span className="mn-title-accent-bar" aria-hidden="true"></span>
              <span>Explore Our</span>
              <span className="mn-courses-orange-text">Courses</span>
              <span className="mn-title-accent-bar" aria-hidden="true"></span>
            </h2>
            <p className="mn-courses-sub-desc">
              Complete study materials, notes, PYQs and exam preparation for Class 9 to 12.
            </p>
          </div>

          <Link to="/courses" className="mn-courses-all-btn">
            <span>View All Courses</span>
            <span className="mn-courses-arrow">→</span>
          </Link>
        </div>

        {/* 4 Cards Grid Matching Reference Image 1 */}
        <div className="mn-courses-grid-4col">
          {COURSE_CLASSES.map((item) => (
            <Link
              key={item.classNum}
              to={item.link}
              className="mn-course-class-card"
              style={{
                '--card-accent': item.color,
                borderColor: item.border,
                boxShadow: `0 8px 24px -6px ${item.glow}`,
              }}
            >
              {/* Top Vector Illustration */}
              <div className="mn-course-card-illustration-wrap">
                {item.illustration}
              </div>

              {/* Bottom Details Row with Circular Arrow Button */}
              <div className="mn-course-card-bottom-row">
                <div className="mn-course-card-text-col">
                  <h3 className="mn-course-card-class-title">{item.title}</h3>
                  <p className="mn-course-card-class-sub">{item.description}</p>
                </div>

                <div
                  className="mn-course-card-action-btn"
                  style={{ backgroundColor: item.btnBg }}
                  aria-hidden="true"
                >
                  <span>→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ExploreCoursesSection;
